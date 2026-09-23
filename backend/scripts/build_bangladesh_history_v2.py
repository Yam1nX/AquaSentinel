"""
Rebuild bangladesh_history.json from the expanded, multi-source master
dataset (EU classifier/imputer are NOT retrained -- they are trained only
on EU Waterbase data, and stay exactly as they were; only the Bangladesh
external-validation data changes here).

Sources merged into the master dataset (see AquaSentinel_Project_Story /
mentor conversation for provenance):
  - DoE River Water Quality Report 2015, Chapter 6 trend tables (2010-2015)
  - REACH-Dhaka field dataset (2017-2021), which includes real
    Ammonia-Nitrogen and Nitrate measurements -- previously always missing
  - DoE Surface & Ground Water Quality Reports 2021-2023 (monthly, 33 rivers)

Run from backend/:  python scripts/build_bangladesh_history_v2.py
"""
import json
import joblib
import numpy as np
import pandas as pd

MASTER_CSV = "data/aquasentinel_bd_master_raw.csv"

clf = joblib.load("aquasentinel_model.pkl")
imputer = joblib.load("aquasentinel_imputer.pkl")
with open("model_metadata.json") as f:
    METADATA = json.load(f)
PARAM_COLS = METADATA["param_cols"]  # 9 EU feature columns, in model order

# same rule as app.py's compute_risk_points -- kept in exact sync
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


def model_predict(params: dict):
    row = {k: (params.get(k) if params.get(k) is not None else np.nan) for k in PARAM_COLS}
    x = pd.DataFrame([row])[PARAM_COLS]
    x_imp = pd.DataFrame(imputer.transform(x), columns=PARAM_COLS)
    return clf.predict(x_imp)[0]


# same early-warning state machine as app.py -- kept in exact sync
SUDDEN_JUMP_POINTS = 2
SLOPE_WARNING = 0.15
SLOPE_WATCH = 0.05
PARAM_WORSENS_IF = {
    "Dissolved oxygen": "down", "BOD5": "up", "Ammonium": "up",
    "Nitrate": "up", "Total phosphorus": "up",
}
PCT_CHANGE_FLAG = 15.0


def classify_early_warning(years):
    if len(years) < 2:
        return {"state": "NORMAL", "reasons": ["Not enough historical readings to assess a trend."],
                "slope": None, "delta_points_last_two": None}
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
            reasons.append(f"Risk score jumped from {prev['risk_points']} to {latest['risk_points']} points "
                            f"between {prev['year']} and {latest['year']}.")
        if sustained_rise:
            reasons.append(f"Sustained upward trend across {len(years)} recorded years "
                            f"(slope +{slope:.2f} risk points/year).")
    elif mild_rise:
        state = "WATCH"
        reasons.append("A mild but real upward movement was detected in the most recent readings.")
    else:
        state = "NORMAL"
        reasons.append("No sustained or sudden deterioration detected in the recorded history.")
    reasons.extend(param_reasons)
    return {"state": state, "reasons": reasons, "slope": round(slope, 3) if slope is not None else None,
            "delta_points_last_two": int(delta_points)}


PARAM_FROM_MASTER = {
    "pH": "pH", "Dissolved oxygen": "Dissolved oxygen", "BOD5": "BOD5",
    "Ammonium": "Ammonium", "Nitrate": "Nitrate",
    "Water temperature": "Water temperature", "Electrical conductivity": "Electrical conductivity",
    # Nitrite and Total phosphorus are not measured in ANY available Bangladesh
    # source (DoE or REACH) -- they remain a genuine, disclosed data gap.
}

RIVERS = {"buriganga": "Buriganga", "turag": "Turag", "shitalakhya": "Shitalakhya"}


def main():
    master = pd.read_csv(MASTER_CSV)
    master["river_lower"] = master["river"].str.strip().str.lower()
    master["parameter"] = master["parameter"].replace({"BOD": "BOD5"})

    out = {}
    for key, name in RIVERS.items():
        sub = master[master["river_lower"] == key]
        years_present = sorted(sub["year"].dropna().unique().astype(int))
        year_entries = []
        for y in years_present:
            ysub = sub[sub["year"] == y]
            params = {c: None for c in PARAM_COLS}
            for model_key, master_key in PARAM_FROM_MASTER.items():
                vals = ysub[ysub["parameter"] == master_key]["value"]
                if len(vals) > 0:
                    params[model_key] = round(float(vals.mean()), 3)
            measured_fields = [k for k, v in params.items() if v is not None]
            risk_points = compute_risk_points(params)
            risk_level = bucket_risk_points(risk_points)
            model_level = model_predict(params)
            year_entries.append({
                "year": int(y), "risk_level": risk_level, "model_predicted_level": model_level,
                "risk_points": risk_points, "params": params, "measured_fields": measured_fields,
                "n_raw_observations": int(len(ysub)),
                "sources": sorted(ysub["source"].unique().tolist()),
            })

        all_years = list(range(min(years_present), max(years_present) + 1))
        gap_years = [y for y in all_years if y not in years_present]
        ever_measured = sorted(set(m for e in year_entries for m in e["measured_fields"]))
        ever_imputed = sorted(set(PARAM_COLS) - set(ever_measured))

        out[key] = {
            "river": name,
            "source": ("Bangladesh Department of Environment (DoE) River/Surface & Ground Water "
                       "Quality Reports 2015/2021/2022/2023 (Ch.6 trend tables for 2010-2015) + "
                       "REACH-Dhaka field dataset 2017-2021"),
            "years": year_entries,
            "early_warning": classify_early_warning(year_entries),
            "data_gap_years": gap_years,
            "measured_parameters": ever_measured,
            "imputed_parameters": ever_imputed,
        }

    with open("bangladesh_history.json", "w") as f:
        json.dump(out, f, indent=2)

    total_years = sum(len(v["years"]) for v in out.values())
    total_raw = sum(e["n_raw_observations"] for v in out.values() for e in v["years"])
    print(f"Wrote bangladesh_history.json: {len(out)} rivers, {total_years} river-year entries, "
          f"{total_raw} underlying raw observations.")
    for k, v in out.items():
        print(f"  {k}: years {v['years'][0]['year']}-{v['years'][-1]['year']}, "
              f"gap={v['data_gap_years']}, measured={v['measured_parameters']}")


if __name__ == "__main__":
    main()
