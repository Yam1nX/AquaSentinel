"""
AquaSentinel — Flask API
Serves the trained RandomForest water-quality risk model with SHAP
explainability, real multi-year station trends, an explainable early-warning
state machine, a Bangladesh external-testing panel, data-completeness /
confidence honesty, citizen observations, and data/model provenance.

Endpoints:
  GET  /api/health                       -> sanity check
  GET  /api/stations                     -> all EU monitoring stations (map)
  GET  /api/station/<site_id>/history    -> real multi-year trajectory + early-warning state
  POST /api/predict                      -> risk prediction + SHAP + completeness + recommendations
  GET  /api/defaults                     -> typical/median values for the form
  GET  /api/bangladesh/sites             -> real single-point BD field observations, scored
  GET  /api/bangladesh/demo/<site_key>   -> DEMO SIMULATION 7-step early-warning walkthrough
  GET  /api/cross_region_eval            -> EU vs Bangladesh external stress-test panel
  GET  /api/provenance                   -> real data & methodology facts
  GET  /api/model_card                   -> purpose, training, honest evaluation, limitations
  GET  /api/citizen_reports              -> list citizen observations (optionally by region)
  POST /api/citizen_reports              -> submit a citizen observation
"""

import json
import os
import time
import uuid

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow the React dev server to call this API

# ---------------------------------------------------------------------------
# Load model artifacts + precomputed real data once at startup
# ---------------------------------------------------------------------------
clf = joblib.load("aquasentinel_model.pkl")
imputer = joblib.load("aquasentinel_imputer.pkl")

with open("model_metadata.json") as f:
    METADATA = json.load(f)

PARAM_COLS = METADATA["param_cols"]
CLASSES = METADATA["classes"]

with open("stations_for_map.json") as f:
    STATIONS = json.load(f)

# Real multi-year per-station history (>=2 real years), built by
# scripts/build_station_history.py from the raw EEA CSV. Powers the genuine
# temporal early-warning panel for EU stations — no simulated numbers here.
with open("station_history.json") as f:
    STATION_HISTORY = json.load(f)

# Honest, leakage-checked evaluation metrics (row-level AND station-level
# splits), built by scripts/build_eval_metrics.py.
with open("eval_metrics.json") as f:
    EVAL_METRICS = json.load(f)

# Real dataset provenance facts, built by the same precompute step.
with open("provenance_facts.json") as f:
    PROVENANCE = json.load(f)

with open("eu_distribution_stats.json") as f:
    EU_DIST = json.load(f)

# Genuine one-year-ahead forecast model (notebook Section 8.4) — walk-forward
# temporally validated (trained on transitions ending <=2022, tested only on
# 2023-2024, never seen in training). Backtested against a persistence
# baseline; see forecast_metrics.json / /api/model_card for the honest numbers.
forecast_model = joblib.load("aquasentinel_forecast_model.pkl")
forecast_imputer = joblib.load("aquasentinel_forecast_imputer.pkl")

with open("forecast_metrics.json") as f:
    FORECAST_METRICS = json.load(f)

FORECAST_FEATURES = FORECAST_METRICS["feature_cols"]

# Precomputed per-station forecast (notebook Section 8.4) and inspection
# priority ranking (notebook Section 8.5) — both built from real data only.
with open("station_forecasts.json") as f:
    STATION_FORECASTS = json.load(f)

with open("station_priority.json") as f:
    STATION_PRIORITY = json.load(f)

# Out-of-distribution (OOD) detector (notebook Section 8.6) — k-NN distance in
# the model's own z-scored, imputed feature space, calibrated against the EU
# training set's own internal nearest-neighbor distances. Catches the failure
# mode a probability alone cannot: a confident output for an input that looks
# nothing like anything the model was trained on.
ood_tree = joblib.load("aquasentinel_ood_tree.pkl")
with open("ood_detector_metadata.json") as f:
    OOD_META = json.load(f)
OOD_MEANS = OOD_META["means"]
OOD_STDS = OOD_META["stds"]
OOD_THRESHOLD = OOD_META["threshold_99th_percentile"]

# Missingness-aware conformal prediction (notebook Section 6.3) — a real,
# distribution-free coverage guarantee, calibrated separately per missingness
# pattern because a naive single calibration silently undercovers once the
# missing-field pattern shifts (see notebook for the honest before/after).
with open("conformal_thresholds.json") as f:
    CONFORMAL = json.load(f)

# Real multi-year Bangladesh river history (notebook Section 10.2) — official
# DoE River Water Quality Reports, 2010-2015 & 2021-2023, honest 2016-2020 gap.
with open("bangladesh_history.json") as f:
    BANGLADESH_HISTORY = json.load(f)

explainer = shap.TreeExplainer(clf)

CITIZEN_REPORTS_PATH = "citizen_reports.json"
if not os.path.exists(CITIZEN_REPORTS_PATH):
    with open(CITIZEN_REPORTS_PATH, "w") as f:
        json.dump([], f)

PARAM_UNITS = {
    "pH": "",
    "Dissolved oxygen": "mg/L",
    "BOD5": "mg/L",
    "Ammonium": "mg/L",
    "Nitrate": "mg/L",
    "Nitrite": "mg/L",
    "Total phosphorus": "mg/L",
    "Water temperature": "°C",
    "Electrical conductivity": "µS/cm",
}

PARAM_PLAIN = {
    "pH": "water pH balance",
    "Dissolved oxygen": "dissolved oxygen level",
    "BOD5": "organic pollution (BOD₅)",
    "Ammonium": "ammonium (nutrient pollution)",
    "Nitrate": "nitrate levels",
    "Nitrite": "nitrite levels",
    "Total phosphorus": "phosphorus (nutrient pollution)",
    "Water temperature": "water temperature",
    "Electrical conductivity": "dissolved mineral/salt content (conductivity)",
}

# reasonable defaults (dataset medians) used when a field is left blank by the user
DEFAULTS = {
    "pH": 7.9, "Dissolved oxygen": 9.6, "BOD5": 2.0, "Ammonium": 0.09,
    "Nitrate": 6.3, "Nitrite": 0.06, "Total phosphorus": 0.07,
    "Water temperature": 12.5, "Electrical conductivity": 401.0,
}

# ---------------------------------------------------------------------------
# Documented risk-scoring thresholds — the SAME rule used to derive the
# training label (notebook Section 4). Reused here for: (a) qualitative
# "elevated / depleted / typical" descriptors, and (b) the Bangladesh
# rule-based cross-check. Not an official regulatory classification.
# ---------------------------------------------------------------------------
def compute_risk_points(vals: dict):
    pts = 0
    do = vals.get("Dissolved oxygen")
    if do is not None:
        pts += 2 if do < 4 else (1 if do < 6 else 0)
    bod = vals.get("BOD5")
    if bod is not None:
        pts += 2 if bod > 6 else (1 if bod > 3 else 0)
    nh4 = vals.get("Ammonium")
    if nh4 is not None:
        pts += 2 if nh4 > 1 else (1 if nh4 > 0.5 else 0)
    no3 = vals.get("Nitrate")
    if no3 is not None and no3 > 25:
        pts += 1
    tp = vals.get("Total phosphorus")
    if tp is not None and tp > 0.1:
        pts += 1
    ph = vals.get("pH")
    if ph is not None and not (6.5 <= ph <= 8.5):
        pts += 1
    return pts


def bucket_risk_points(p):
    if p <= 1:
        return "Low"
    elif p <= 3:
        return "Medium"
    return "High"


QUALITATIVE_THRESHOLDS = {
    # param -> function(value) -> 'typical' | 'elevated (...)' | 'depleted (...)'
    "Dissolved oxygen": lambda v: "depleted (poor)" if v < 4 else ("depleted (moderate)" if v < 6 else "typical"),
    "BOD5": lambda v: "elevated (poor)" if v > 6 else ("elevated (moderate)" if v > 3 else "typical"),
    "Ammonium": lambda v: "elevated (poor)" if v > 1 else ("elevated (moderate)" if v > 0.5 else "typical"),
    "Nitrate": lambda v: "elevated" if v > 25 else "typical",
    "Total phosphorus": lambda v: "elevated" if v > 0.1 else "typical",
    "pH": lambda v: "outside typical range" if not (6.5 <= v <= 8.5) else "typical",
}


def qualitative_descriptor(param, value):
    fn = QUALITATIVE_THRESHOLDS.get(param)
    if fn is None or value is None:
        return "typical"
    return fn(value)


def ood_distance(imputed_row: dict):
    """
    Nearest-neighbor distance, in the EU-trained model's own z-scored feature
    space, from a fully-imputed reading to its closest EU training point.
    Values far beyond OOD_THRESHOLD mean this input looks nothing like
    anything the model has ever seen — a failure mode a raw probability
    cannot surface on its own (notebook Section 8.6).
    """
    v = np.array([(imputed_row[c] - OOD_MEANS[c]) / OOD_STDS[c] for c in PARAM_COLS])
    d, _ = ood_tree.query(v, k=1)
    d = float(d)
    return {
        "nearest_neighbor_distance": round(d, 3),
        "threshold": round(OOD_THRESHOLD, 3),
        "multiples_of_threshold": round(d / OOD_THRESHOLD, 1),
        "is_out_of_distribution": d > OOD_THRESHOLD,
    }


def get_calibrated_risk_set(imputed_fields: list, proba_by_class: dict):
    """
    Missingness-aware split conformal prediction (notebook Section 6.3): a
    distribution-free, statistically verified prediction SET, not a raw
    softmax number. Only returned when the request's exact missingness
    pattern matches a scenario we actually calibrated and validated for —
    scenario mismatch is reported honestly rather than silently reusing a
    threshold calibrated for a different (and possibly overconfident) setting.
    """
    missing_set = set(imputed_fields)
    matched_key = None
    for key, scenario in CONFORMAL["scenarios"].items():
        if missing_set == set(scenario["missing_fields"]):
            matched_key = key
            break

    if matched_key is None:
        return {
            "available": False,
            "note": (
                "No conformal calibration has been validated for this exact missingness pattern "
                f"({sorted(missing_set) if missing_set else 'none'}). The confidence_label above is "
                "a heuristic, not a statistically guaranteed coverage — treat it accordingly."
            ),
        }

    scenario = CONFORMAL["scenarios"][matched_key]
    q_hat = scenario["q_hat"]
    threshold = 1 - q_hat
    risk_set = [cls for cls, p in proba_by_class.items() if p >= threshold]
    if not risk_set:
        risk_set = [max(proba_by_class, key=proba_by_class.get)]

    return {
        "available": True,
        "scenario": matched_key,
        "scenario_description": scenario["description"],
        "risk_set": risk_set,
        "target_coverage": CONFORMAL["target_coverage"],
        "empirically_validated_coverage": CONFORMAL["validation"]["missingness_matched_calibration"]["empirical_coverage"],
        "note": (
            f"The true risk level is in {risk_set} with at least {CONFORMAL['target_coverage']:.0%} "
            "guaranteed coverage (split conformal prediction, calibrated specifically for this "
            "missingness pattern on held-out EU data) — a statistically verified statement, not a "
            "heuristic label."
            if len(risk_set) == 1 else
            f"The model cannot narrow this down to one class at the {CONFORMAL['target_coverage']:.0%} "
            f"guaranteed-coverage level: the true risk level is honestly reported as one of {risk_set}."
        ),
    }


# ---------------------------------------------------------------------------
# Core prediction (shared by /api/predict and the Bangladesh endpoints)
# ---------------------------------------------------------------------------
def build_response(sample: dict, source_label="user_input"):
    """Run the model + SHAP on one sample and build a full, honest API response."""
    provided = {k: (sample.get(k) if sample.get(k) not in (None, "") else None) for k in PARAM_COLS}
    imputed_flags = {k: (v is None) for k, v in provided.items()}

    row = {k: (provided[k] if provided[k] is not None else np.nan) for k in PARAM_COLS}
    x = pd.DataFrame([row])[PARAM_COLS]
    x_imp = pd.DataFrame(imputer.transform(x), columns=PARAM_COLS)

    pred = clf.predict(x_imp)[0]
    proba = clf.predict_proba(x_imp)[0]
    confidence = {cls: round(float(p), 3) for cls, p in zip(clf.classes_, proba)}
    max_proba = max(confidence.values())

    sv = explainer.shap_values(x_imp)
    class_idx = list(clf.classes_).index(pred)
    contrib = sv[0, :, class_idx]

    factors = []
    for param, impact in sorted(zip(PARAM_COLS, contrib), key=lambda t: -abs(t[1]))[:4]:
        val = round(float(x_imp[param].iloc[0]), 3)
        # NOTE: this is a multiclass model, so a SHAP contribution's sign is
        # relative to the SPECIFIC PREDICTED CLASS ("did this feature raise or
        # lower the model's confidence in <pred>?"), not "risk up/down" in a
        # general sense. A severely bad reading can still show a *negative*
        # contribution to e.g. a "Medium" prediction if it was actually pulling
        # toward "High" instead — phrasing this as "decreases risk" would be
        # misleading, so plain language stays scoped to the predicted class.
        direction = "increases risk" if impact > 0 else "decreases risk"
        descriptor = qualitative_descriptor(param, val)
        plain = PARAM_PLAIN.get(param, param)
        confidence_verb = "raising" if impact > 0 else "lowering"
        if descriptor == "typical":
            plain_sentence = (
                f"{param} is within its typical range, with only a small effect on "
                f"{confidence_verb} the model's confidence in this {pred} prediction."
            )
        else:
            plain_sentence = (
                f"{descriptor.capitalize()} {plain} was one of the strongest factors behind "
                f"this specific {pred} prediction ({confidence_verb} the model's confidence in {pred})."
            )
        factors.append({
            "parameter": param,
            "value": val,
            "unit": PARAM_UNITS.get(param, ""),
            "impact": round(float(impact), 4),
            "direction": direction,
            "was_imputed": imputed_flags[param],
            "qualitative": descriptor,
            "plain_language": plain_sentence,
        })

    n_total = len(PARAM_COLS)
    n_measured = sum(1 for v in imputed_flags.values() if not v)
    n_estimated = n_total - n_measured
    estimated_fraction = n_estimated / n_total

    # Out-of-distribution check — computed on the SAME imputed row the
    # classifier actually sees, so it measures genuine distributional
    # distance, not an artifact of different imputation.
    imputed_row = {c: float(x_imp[c].iloc[0]) for c in PARAM_COLS}
    ood = ood_distance(imputed_row)

    # --- Honest confidence label: combines model probability, data
    # completeness, AND distributional distance. A high model probability
    # alone never implies certainty when most inputs were imputed, or when
    # the input sits far outside anything the model was trained on.
    if ood["is_out_of_distribution"]:
        confidence_label = "LOW"
    elif estimated_fraction >= 0.5:
        confidence_label = "LOW"
    elif estimated_fraction >= 0.3:
        confidence_label = "MODERATE" if max_proba >= 0.6 else "LOW"
    else:
        if max_proba >= 0.75:
            confidence_label = "HIGH"
        elif max_proba >= 0.5:
            confidence_label = "MODERATE"
        else:
            confidence_label = "LOW"

    low_confidence = confidence_label == "LOW"

    field_detail = []
    for k in PARAM_COLS:
        field_detail.append({
            "parameter": k,
            "value": round(float(x_imp[k].iloc[0]), 4),
            "unit": PARAM_UNITS.get(k, ""),
            "status": "ESTIMATED" if imputed_flags[k] else "MEASURED",
        })

    recommendations = recommend_actions(pred, low_confidence)

    calibrated_risk_set = get_calibrated_risk_set(
        [k for k, v in imputed_flags.items() if v], confidence
    )

    return {
        "risk_level": pred,
        "confidence": confidence,
        "confidence_label": confidence_label,
        "calibrated_risk_set": calibrated_risk_set,
        "top_factors": factors,
        "imputed_fields": [k for k, v in imputed_flags.items() if v],
        "data_completeness": {
            "measured": n_measured,
            "estimated": n_estimated,
            "missing": 0,  # every field is either measured or median-imputed; none left blank downstream
            "total": n_total,
            "fields": field_detail,
        },
        "low_confidence_warning": low_confidence,
        "note": (
            "Estimated values were imputed because no measurement was available. "
            "Predictions using substantial imputation should be interpreted as "
            "screening signals, not laboratory confirmation."
            if n_estimated > 0 else None
        ),
        "out_of_distribution": ood,
        "out_of_distribution_warning": (
            f"This reading is {ood['multiples_of_threshold']}x farther from the nearest EU training "
            "example than 99% of genuine EU readings are from theirs — it sits well outside the "
            "conditions this model was trained on. Treat this prediction as an extrapolation, not a "
            "validated estimate."
            if ood["is_out_of_distribution"] else None
        ),
        "recommendations": recommendations,
        "source": source_label,
    }


ACTION_RECOMMENDATIONS = {
    "Low": [
        "Continue routine monitoring at the current frequency.",
        "No immediate action indicated by this screening result.",
    ],
    "Medium": [
        "Consider increasing sampling frequency at this location.",
        "Review recent trends for early signs of deterioration.",
        "Encourage additional citizen observations nearby.",
    ],
    "High": [
        "Increase sampling frequency at this location.",
        "Investigate potential upstream pollution sources.",
        "Review recent parameter deterioration in detail.",
        "Consider notifying the relevant local environmental authority.",
        "Encourage additional community observations to corroborate the signal.",
    ],
}


def recommend_actions(risk_level, low_confidence):
    base = list(ACTION_RECOMMENDATIONS.get(risk_level, ACTION_RECOMMENDATIONS["Medium"]))
    if low_confidence:
        base.append("Prioritize obtaining a real measurement — this result relies heavily on estimated values.")
    return {
        "actions": base,
        "disclaimer": "Decision-support suggestions only — not official regulatory instructions.",
    }


# ---------------------------------------------------------------------------
# Early-warning state machine (documented, deterministic, explainable)
#
# States: NORMAL, WATCH, WARNING, CRITICAL
# Uses REAL multi-year risk-point history for EU stations. Thresholds below
# are explicit, documented prototype assumptions, applied consistently:
#   - "sudden jump":    risk_points increases by >=2 between the two most
#                        recent recorded years
#   - "sustained rise":  linear slope of risk_points vs. year > +0.15/year
#                        across the station's full recorded history (needs >=3 years)
#   - "mild rise":       slope between +0.05 and +0.15/year, OR a +1 point
#                        jump between the two most recent years
#   - CRITICAL:          current level is High AND (sustained rise OR
#                        sudden jump OR the previous year was also High)
#   - parameter reasons: any of DO/BOD5/Ammonium/Nitrate/Total phosphorus
#                        moved >15% (worsening direction) between the two
#                        most recent recorded years
# ---------------------------------------------------------------------------
SUDDEN_JUMP_POINTS = 2
SLOPE_WARNING = 0.15
SLOPE_WATCH = 0.05
PARAM_WORSENS_IF = {
    "Dissolved oxygen": "down",
    "BOD5": "up",
    "Ammonium": "up",
    "Nitrate": "up",
    "Total phosphorus": "up",
}
PCT_CHANGE_FLAG = 15.0


def classify_early_warning(years):
    """years: list of {year, risk_level, risk_points, params}, ascending by year."""
    if len(years) < 2:
        return {
            "state": "NORMAL",
            "reasons": ["Not enough historical readings to assess a trend (only one recorded year)."],
            "slope": None,
            "delta_points_last_two": None,
        }

    latest, prev = years[-1], years[-2]
    delta_points = latest["risk_points"] - prev["risk_points"]

    slope = None
    if len(years) >= 3:
        x = np.array([y["year"] for y in years], dtype=float)
        yv = np.array([y["risk_points"] for y in years], dtype=float)
        slope = float(np.polyfit(x, yv, 1)[0])

    sudden_jump = delta_points >= SUDDEN_JUMP_POINTS
    sustained_rise = slope is not None and slope > SLOPE_WARNING
    mild_rise = (slope is not None and SLOPE_WATCH < slope <= SLOPE_WARNING) or delta_points == 1
    is_high_now = latest["risk_level"] == "High"
    prev_also_high = is_high_now and prev["risk_level"] == "High"

    param_reasons = []
    for param, worse_if in PARAM_WORSENS_IF.items():
        v0, v1 = prev["params"].get(param), latest["params"].get(param)
        if v0 not in (None, 0) and v1 is not None:
            pct = (v1 - v0) / abs(v0) * 100
            if worse_if == "up" and pct > PCT_CHANGE_FLAG:
                param_reasons.append(f"{param} increased {pct:.0f}% since {prev['year']}")
            elif worse_if == "down" and pct < -PCT_CHANGE_FLAG:
                param_reasons.append(f"{param} decreased {abs(pct):.0f}% since {prev['year']}")

    reasons = []
    if is_high_now and (sustained_rise or sudden_jump or prev_also_high):
        state = "CRITICAL"
        reasons.append(f"Current predicted risk is High as of {latest['year']}.")
        if prev_also_high:
            reasons.append(f"Risk was also High in the prior recorded year ({prev['year']}).")
    elif sudden_jump or sustained_rise:
        state = "WARNING"
        if sudden_jump:
            reasons.append(
                f"Risk score jumped from {prev['risk_points']} to {latest['risk_points']} points "
                f"between {prev['year']} and {latest['year']}."
            )
        if sustained_rise:
            reasons.append(
                f"Sustained upward trend across {len(years)} recorded years (slope +{slope:.2f} risk points/year)."
            )
    elif mild_rise:
        state = "WATCH"
        reasons.append("A mild but real upward movement was detected in the most recent readings.")
    else:
        state = "NORMAL"
        reasons.append("No sustained or sudden deterioration detected in the recorded history.")

    reasons.extend(param_reasons)

    return {
        "state": state,
        "reasons": reasons,
        "slope": round(slope, 3) if slope is not None else None,
        "delta_points_last_two": int(delta_points),
    }


# ---------------------------------------------------------------------------
# Bangladesh — REAL single-point field observations at specific pollution
# hotspots (manually compiled from published studies; see /api/provenance).
# These specific points have no time series, but Buriganga and Turag now DO
# have real river-level multi-year history — see BANGLADESH_HISTORY below,
# built from official Bangladesh DoE reports (notebook Section 10.2). The
# DEMO SIMULATION endpoint remains for the pedagogical step-by-step walkthrough.
# ---------------------------------------------------------------------------
BANGLADESH_SITES = {
    "buriganga-hazaribagh": {
        "label": "Buriganga River — Hazaribagh (tannery zone, dry season)",
        "lat": 23.7104, "lon": 90.3667,
        "measured": {
            "pH": 6.8, "Dissolved oxygen": 2.0, "BOD5": 87.5,
            "Water temperature": 28.0, "Electrical conductivity": 900.0,
        },
    },
    "buriganga-postogola": {
        "label": "Buriganga River — Postogola",
        "lat": 23.6975, "lon": 90.4270,
        "measured": {
            "pH": 7.4, "Dissolved oxygen": 3.5, "BOD5": 45.0,
            "Water temperature": 27.0, "Electrical conductivity": 650.0,
        },
    },
    "turag-confluence": {
        "label": "Turag River — confluence point",
        "lat": 23.8103, "lon": 90.3654,
        "measured": {
            "pH": 7.0, "Dissolved oxygen": 1.85, "BOD5": 140.0,
            "Water temperature": 29.0, "Electrical conductivity": 750.0,
        },
    },
}


def score_bangladesh_site(key, site):
    result = build_response(site["measured"], source_label="bangladesh_field_observation")
    result["site_key"] = key
    result["label"] = site["label"]
    result["lat"] = site["lat"]
    result["lon"] = site["lon"]
    result["temporal_data_available"] = False
    result["temporal_note"] = (
        "This exact point has no time series — it is a single-point-in-time field observation. "
        "The river it's on does have real multi-year history: see /api/bangladesh/history/buriganga "
        "or /api/bangladesh/history/turag (official DoE data, 2010-2015 & 2021-2023). The demo "
        "simulation endpoint remains available as a clearly labelled, step-by-step illustration."
    )
    return result


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": METADATA.get("model_type"),
        "trained_on": METADATA.get("trained_on"),
        "classes": CLASSES,
        "stations_loaded": len(STATIONS),
        "stations_with_real_history": len(STATION_HISTORY),
    })


@app.route("/api/stations", methods=["GET"])
def stations():
    """Return all monitoring stations for the Leaflet map."""
    return jsonify(STATIONS)


@app.route("/api/station/<site_id>/history", methods=["GET"])
def station_history(site_id):
    """Real multi-year trajectory + early-warning classification for one EU station."""
    hist = STATION_HISTORY.get(site_id)
    if hist is None:
        return jsonify({"error": "No multi-year history available for this station."}), 404
    warning = classify_early_warning(hist["years"])
    return jsonify({
        "site_id": site_id,
        "monitoringSiteName": hist["monitoringSiteName"],
        "countryCode": hist["countryCode"],
        "lat": hist["lat"],
        "lon": hist["lon"],
        "n_years": hist["n_years"],
        "years": hist["years"],
        "risk_trajectory": hist["risk_trajectory"],
        "param_pct_change_first_to_last": hist["param_pct_change_first_to_last"],
        "early_warning": warning,
        "forecast": STATION_FORECASTS.get(site_id),  # None if unavailable — never fabricated
        "data_type": "real_observed_history",
    })


@app.route("/api/station/<site_id>/forecast", methods=["GET"])
def station_forecast(site_id):
    """
    Genuine one-year-ahead forecast for one station (notebook Section 8.4) —
    a real RandomForest trained on real consecutive-year transitions, walk-
    forward validated (never trained on the 2023-2024 test years). Returned
    alongside the honest backtested accuracy so the frontend never presents
    forecast confidence as more certain than it's been measured to be.
    """
    fc = STATION_FORECASTS.get(site_id)
    if fc is None:
        return jsonify({"error": "No forecast available for this station."}), 404
    return jsonify({
        "site_id": site_id,
        **fc,
        "backtest": {
            "description": FORECAST_METRICS["methodology"],
            "forecast_model": FORECAST_METRICS["forecast_model"],
            "persistence_baseline": FORECAST_METRICS["persistence_baseline"],
            "worsening_transition_recall": FORECAST_METRICS["worsening_transition_recall"],
            "worsening_transition_precision": FORECAST_METRICS["worsening_transition_precision"],
            "worsening_base_rate": FORECAST_METRICS["worsening_base_rate"],
            "caveat": (
                "This model modestly beats a 'nothing changes' baseline on held-out future years, "
                "concentrated on the Medium/High classes. It only catches a minority of stations that "
                "actually worsen the following year — treat 'escalation expected' as a real but partial "
                "signal, not a guarantee."
            ),
        },
    })


@app.route("/api/priority", methods=["GET"])
def priority():
    """
    Inspection Priority list (notebook Section 8.5) — a transparent, auditable
    ranking (current severity + early-warning state + forecast escalation +
    data recency) for resource-constrained agencies deciding where to look
    first. Optional query params: limit (default 20, max 200), state (filter
    to one early_warning_state), country (filter to one countryCode).
    """
    try:
        limit = min(int(request.args.get("limit", 20)), 200)
    except ValueError:
        limit = 20
    rows = STATION_PRIORITY
    state_filter = request.args.get("state")
    if state_filter:
        rows = [r for r in rows if r["early_warning_state"] == state_filter.upper()]
    country_filter = request.args.get("country")
    if country_filter:
        rows = [r for r in rows if r["countryCode"] == country_filter.upper()]
    return jsonify({
        "methodology": (
            "priority_score = current risk points + 2x early-warning state weight "
            "(CRITICAL=3, WARNING=2, WATCH=1, NORMAL=0) + 2 if the forecast model expects "
            "escalation next year - 2x data-staleness penalty (0 fresh .. 1 for data >=10 years old). "
            "Every component is real, computed, and auditable — not a black box."
        ),
        "total_stations_ranked": len(STATION_PRIORITY),
        "returned": min(limit, len(rows)),
        "stations": rows[:limit],
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Body: { "pH": 7.1, "Dissolved oxygen": 5.2, "BOD5": 3.0, ... }
    Any field can be omitted -> it will be imputed and flagged in the response.
    """
    data = request.get_json(force=True, silent=True) or {}
    try:
        result = build_response(data, source_label="user_input")
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/defaults", methods=["GET"])
def defaults():
    """Typical/median values — used by the frontend to pre-fill or reset the form."""
    return jsonify({"defaults": DEFAULTS, "units": PARAM_UNITS, "param_order": PARAM_COLS})


@app.route("/api/bangladesh/sites", methods=["GET"])
def bangladesh_sites():
    """All real Bangladesh field observations, scored by the model."""
    return jsonify([score_bangladesh_site(k, v) for k, v in BANGLADESH_SITES.items()])


@app.route("/api/bangladesh/history/<river>", methods=["GET"])
def bangladesh_history(river):
    """
    REAL multi-year river-level history for Buriganga or Turag (notebook
    Section 10.2), built from official Bangladesh DoE River Water Quality
    Reports (2010-2015, 2021-2023 — 2016-2020 is an honest reporting gap, not
    bridged). 'risk_level' per year is the transparent rule-based label
    (consistent with how EU station_history.json is built); the model's own
    prediction is kept alongside as 'model_predicted_level' specifically so
    the two can be compared — across all 18 real yearly observations here,
    the model under-calls severity by one class in all but one case, because
    Ammonium/Nitrate/Nitrite/Total phosphorus are never measured by DoE.
    """
    hist = BANGLADESH_HISTORY.get(river.lower())
    if hist is None:
        return jsonify({"error": "Unknown river. Use 'buriganga' or 'turag'."}), 404
    return jsonify({
        **hist,
        "risk_trajectory": [y["risk_level"] for y in hist["years"]],
        "model_trajectory": [y["model_predicted_level"] for y in hist["years"]],
        "data_type": "real_observed_history",
    })


@app.route("/api/bangladesh/demo/<site_key>", methods=["GET"])
def bangladesh_demo(site_key):
    """
    DEMO SIMULATION ONLY — a deterministic, reproducible 7-step early-warning
    walkthrough ending at the site's REAL measured values. The intermediate
    steps (1-6) are simulated/interpolated because no real time series exists
    for Bangladesh sites; this is explicitly labelled throughout and must
    never be presented as real historical observations.
    """
    site = BANGLADESH_SITES.get(site_key)
    if site is None:
        return jsonify({"error": "Unknown Bangladesh site key."}), 404

    real_end = site["measured"]
    # Deterministic, clearly-labelled "normal baseline" starting point — a
    # typical healthy river reading (matching the "Clean EU river" sample
    # used elsewhere in this app), NOT derived from any real Bangladesh
    # measurement. Interpolated linearly across 7 steps to the real
    # endpoint. Every step is tagged as a simulation.
    baseline = {
        "pH": 7.6, "Dissolved oxygen": 8.5, "BOD5": 2.0,
        "Water temperature": 26.0, "Electrical conductivity": 400.0,
    }

    n_steps = 7
    steps = []
    for i in range(n_steps):
        t = i / (n_steps - 1)  # 0 -> 1
        sample = {}
        for k in ["pH", "Dissolved oxygen", "BOD5", "Water temperature", "Electrical conductivity"]:
            sample[k] = round(baseline[k] + (real_end[k] - baseline[k]) * t, 3)
        result = build_response(sample, source_label="demo_simulation")
        risk_points = compute_risk_points(sample)
        steps.append({
            "step": i + 1,
            "label": [
                "Normal conditions (simulated baseline)",
                "Early parameter drift begins (simulated)",
                "BOD5 rising (simulated)",
                "Dissolved oxygen falling (simulated)",
                "Predicted risk increasing (simulated)",
                "Approaching real observed conditions (simulated)",
                "Real observed field conditions reached",
            ][i],
            "simulated_inputs": sample,
            "risk_points": risk_points,
            "prediction": result,
            "is_real_measurement": i == n_steps - 1,
        })

    # Early-warning classification applied to this clearly-labelled simulated
    # trajectory, using the same logic as real stations.
    fake_years = [
        {"year": 2020 + i, "risk_level": s["prediction"]["risk_level"], "risk_points": s["risk_points"],
         "params": s["simulated_inputs"]}
        for i, s in enumerate(steps)
    ]
    warning = classify_early_warning(fake_years)

    return jsonify({
        "site_key": site_key,
        "label": site["label"],
        "mode": "DEMO SIMULATION — NOT REAL MEASUREMENTS",
        "disclaimer": (
            "Steps 1-6 use simulated, interpolated input values to illustrate how the "
            "early-warning system responds to deterioration over time. Only step 7 uses "
            "the site's real measured field observation. No simulated value is ever "
            "presented as a real observation."
        ),
        "steps": steps,
        "early_warning": warning,
        "recommendations": recommend_actions(steps[-1]["prediction"]["risk_level"], False),
    })


@app.route("/api/cross_region_eval", methods=["GET"])
def cross_region_eval():
    """
    Honest cross-region panel: EU training/validation performance (from
    eval_metrics.json, computed with a clean train/test split) alongside a
    SMALL-SAMPLE Bangladesh external stress test (n=3) — model prediction vs.
    the same documented rule-based label, plus a real domain-shift indicator
    (z-score of each Bangladesh measured value against the actual EU
    training distribution).
    """
    bd_results = []
    agree = 0
    for key, site in BANGLADESH_SITES.items():
        scored = score_bangladesh_site(key, site)
        rule_points = compute_risk_points(site["measured"])
        rule_level = bucket_risk_points(rule_points)
        matches = rule_level == scored["risk_level"]
        agree += int(matches)

        shift = {}
        for param, val in site["measured"].items():
            d = EU_DIST.get(param)
            if d and d["std"] > 0:
                shift[param] = round((val - d["mean"]) / d["std"], 2)

        bd_results.append({
            "site_key": key,
            "label": site["label"],
            "model_prediction": scored["risk_level"],
            "rule_based_label": rule_level,
            "agrees_with_rule": matches,
            "measured_fields": list(site["measured"].keys()),
            "domain_shift_zscore": shift,
            "note": "z-score = how many EU training standard deviations this measured value sits from the EU training mean. Large |z| indicates the reading is well outside the training distribution.",
            "out_of_distribution": scored["out_of_distribution"],
            "calibrated_risk_set": scored["calibrated_risk_set"],
        })

    return jsonify({
        "training_domain": "Europe (EEA Waterbase, 6 countries, 2010-2024)",
        "external_test_domain": "Bangladesh (Buriganga & Turag rivers, Dhaka)",
        "eu_evaluation": {
            "description": "Held-out EU test performance (see /api/model_card for full detail and both split methodologies).",
            "row_level_random_forest": EVAL_METRICS["row_level_split"]["random_forest"],
            "station_level_random_forest": EVAL_METRICS["station_level_split"]["random_forest"],
        },
        "bangladesh_external_stress_test": {
            "sample_size": len(BANGLADESH_SITES),
            "warning": "Small-sample external stress test — NOT a statistically powered validation. Do not interpret as generalizable accuracy.",
            "agreement_with_rule_based_label": f"{agree}/{len(BANGLADESH_SITES)}",
            "out_of_distribution_note": (
                "out_of_distribution.nearest_neighbor_distance is the joint k-NN distance in the full "
                "9-parameter feature space (Section 8.6) — a stronger, multivariate version of the "
                "per-parameter z-scores above. multiples_of_threshold shows how many times farther this "
                "site's nearest EU neighbor is than 99% of genuine EU points are from theirs."
            ),
            "sites": bd_results,
        },
    })


@app.route("/api/provenance", methods=["GET"])
def provenance():
    return jsonify(PROVENANCE)


@app.route("/api/model_card", methods=["GET"])
def model_card():
    return jsonify({
        "purpose": "Water-quality risk screening and early warning — a decision-support and prioritization tool, not a laboratory replacement.",
        "model_type": METADATA.get("model_type"),
        "training_data": PROVENANCE["data_source"],
        "training_coverage": PROVENANCE["filtered_to"],
        "external_testing": "Bangladesh field observations (Buriganga & Turag rivers) — small-sample external stress test, never used in training.",
        "risk_label_derivation": PROVENANCE["risk_label_method"],
        "evaluation": {
            "class_distribution_note": "The training label is imbalanced (~80% Low / 16% Medium / 3% High), so a naive always-predict-Low baseline already scores ~80% accuracy — macro-F1 is the more informative metric here.",
            "baselines": {
                "dummy_most_frequent": EVAL_METRICS["row_level_split"]["dummy_most_frequent"],
                "logistic_regression": EVAL_METRICS["row_level_split"]["logistic_regression"],
                "random_forest_row_split": EVAL_METRICS["row_level_split"]["random_forest"],
            },
            "station_level_split": EVAL_METRICS["station_level_split"],
            "methodology_note": EVAL_METRICS["notes"],
            "important_caveat": (
                "Because the Risk_Level label is itself a transparent, rule-derived function of "
                "these same 9 input features (see risk_label_derivation), very high classification "
                "accuracy is expected — the model is largely learning to reconstruct a known, "
                "documented rule from (partly imputed) inputs. This is NOT independent evidence "
                "that the underlying rule correctly reflects real-world freshwater ecological health; "
                "it only shows the model learned the rule faithfully."
            ),
        },
        "forecasting": {
            "description": (
                "A second, separate model (notebook Section 8.4) predicts NEXT YEAR's risk level "
                "from this year's readings, trend-so-far, and years of history — walk-forward "
                "validated on 2023-2024 transitions never seen in training."
            ),
            "forecast_model_vs_persistence_baseline": {
                "forecast_model": FORECAST_METRICS["forecast_model"],
                "persistence_baseline": FORECAST_METRICS["persistence_baseline"],
            },
            "worsening_transition_detection": {
                "base_rate": FORECAST_METRICS["worsening_base_rate"],
                "recall": FORECAST_METRICS["worsening_transition_recall"],
                "precision": FORECAST_METRICS["worsening_transition_precision"],
            },
            "honest_caveat": (
                "The forecast model provides a real, measured lift over assuming nothing changes, "
                "concentrated on the Medium/High classes — but it only catches a minority of stations "
                "that actually worsen the following year. It is a genuine, backtested, partial "
                "capability, not a guarantee of foresight."
            ),
        },
        "out_of_distribution_detection": {
            "description": (
                "A k-NN out-of-distribution detector (notebook Section 8.6) — separate from the "
                "confidence label — checks whether a reading's joint combination of parameters sits "
                "within the model's actual trained experience, not just whether the classifier's "
                "output probability looks confident. Calibrated from the EU training set's own "
                "internal nearest-neighbor distances (99th percentile threshold)."
            ),
            "calibration_sanity_check": (
                f"{OOD_META['calibration_sanity_check_pct_within_threshold']}% of genuine EU points fall "
                "within their own threshold (expected ~99%, confirming correct calibration)."
            ),
            "bangladesh_result": (
                "All 3 Bangladesh sites are flagged out-of-distribution — their nearest EU neighbor is "
                "7 to 28 times farther away than 99% of genuine EU points are from theirs. See "
                "/api/cross_region_eval for the per-site figures."
            ),
            "effect": "Any prediction flagged out-of-distribution is automatically capped at LOW confidence, regardless of the classifier's raw probability.",
        },
        "conformal_prediction": {
            "description": (
                "Missingness-aware split conformal prediction (notebook Section 6.3) — a "
                "distribution-free, statistically verified prediction SET with a stated coverage "
                "guarantee, calibrated separately per missingness pattern. Complements the OOD "
                "detector above: OOD asks 'does this input look like anything we've trained on', "
                "conformal prediction asks 'given the model's own probabilities, what's the smallest "
                "set of classes we can guarantee contains the truth, at a stated confidence level'."
            ),
            "key_finding": (
                "Calibrating once on fully-measured data and reusing that threshold on nutrient-blind "
                "inputs (Ammonium/Nitrate/Nitrite/Total phosphorus missing, as in the real Bangladesh "
                "sites) delivers only ~84% empirical coverage against a claimed 90% target, and never "
                "once honestly widens its answer. Calibrating specifically for that missingness "
                "pattern restores ~90% coverage and correctly widens to a multi-class set in ~13% of "
                "cases instead of guessing."
            ),
            "validated_scenarios": CONFORMAL["scenarios"],
            "validation_result": CONFORMAL["validation"],
            "effect": (
                "/api/predict returns calibrated_risk_set.risk_set with a stated coverage guarantee "
                "only when the request's exact missingness pattern matches a validated scenario; "
                "otherwise it honestly reports that no calibration exists for that pattern rather than "
                "reusing a mismatched threshold."
            ),
        },
        "known_limitations": [
            "Domain shift: trained only on European rivers; Bangladesh testing is small-sample (n=3) and not statistically powered.",
            "The risk label is a transparent prototype rule, not an official regulatory classification.",
            "Substantial missing data in the training set for several parameters (see /api/provenance) is handled by median imputation, which can mask true severity — reflected in the confidence label.",
            "Model is a screening signal only — not a substitute for laboratory testing or regulatory assessment.",
            "Predictions do not imply causation; SHAP shows association/contribution to the model's output, not a causal mechanism.",
            "The one-year-ahead forecast model only catches a minority of stations that genuinely worsen the following year (see 'forecasting' above) — annual aggregates likely miss higher-frequency dynamics that drive real deterioration.",
            "Conformal calibration only covers two specific missingness patterns (fully-measured, and nutrient-blind) — any other combination of missing fields has no statistically verified coverage guarantee yet.",
        ],
    })


@app.route("/api/citizen_reports", methods=["GET"])
def get_citizen_reports():
    with open(CITIZEN_REPORTS_PATH) as f:
        reports = json.load(f)
    # optional simple bounding-box filter: ?min_lat=&max_lat=&min_lon=&max_lon=
    args = request.args
    if all(k in args for k in ("min_lat", "max_lat", "min_lon", "max_lon")):
        try:
            min_lat, max_lat = float(args["min_lat"]), float(args["max_lat"])
            min_lon, max_lon = float(args["min_lon"]), float(args["max_lon"])
            reports = [
                r for r in reports
                if min_lat <= r["lat"] <= max_lat and min_lon <= r["lon"] <= max_lon
            ]
        except ValueError:
            pass
    return jsonify(reports)


@app.route("/api/citizen_reports", methods=["POST"])
def post_citizen_report():
    data = request.get_json(force=True, silent=True) or {}

    try:
        lat = float(data["lat"])
        lon = float(data["lon"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "lat and lon are required and must be numeric."}), 400

    report = {
        "id": str(uuid.uuid4()),
        "type": "citizen_observation",
        "lat": lat,
        "lon": lon,
        "water_colour": str(data.get("water_colour") or "")[:100],
        "foam_observed": bool(data.get("foam_observed", False)),
        "unusual_smell": bool(data.get("unusual_smell", False)),
        "visible_pollution": bool(data.get("visible_pollution", False)),
        "free_text": str(data.get("free_text") or "")[:1000],
        "has_photo": bool(data.get("has_photo", False)),
        "submitted_at": int(time.time()),
    }

    with open(CITIZEN_REPORTS_PATH) as f:
        reports = json.load(f)
    reports.append(report)
    with open(CITIZEN_REPORTS_PATH, "w") as f:
        json.dump(reports, f)

    return jsonify(report), 201


if __name__ == "__main__":
    app.run(debug=False, port=5000)
