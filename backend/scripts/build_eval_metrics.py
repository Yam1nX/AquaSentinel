"""
Honest, leakage-checked evaluation of the risk classifier — for the Model Card
and Data & Methodology panels.

Note on the original notebook: the median imputer was fit on the full feature
matrix (train+test) before the train/test split — a mild, common form of
information leakage (imputation statistics only, not labels). This script
re-fits the imputer on the TRAIN split only and re-evaluates, so the reported
numbers here are clean. Both are recorded for transparency.

NOTE: this evaluation (leakage check, baselines, station-level split) plus
the provenance/domain-shift export is documented and executed step-by-step in
notebook/AquaSentinel_notebook.ipynb, Sections 6.2, 10.1, and 12.1 — that
notebook is the canonical, reviewable version of this work. This script is a
convenience CLI equivalent for regenerating the files without launching
Jupyter; keep the two in sync if you change the methodology.

Run from backend/: python3 scripts/build_eval_metrics.py
Reads:  ../notebook/wise_river_wide.csv
Writes: eval_metrics.json
"""
import json
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

PARAM_COLS = ['pH', 'Dissolved oxygen', 'BOD5', 'Ammonium', 'Nitrate', 'Nitrite',
              'Total phosphorus', 'Water temperature', 'Electrical conductivity']
RANDOM_STATE = 42


def compute_risk_points(row):
    pts = 0
    do = row['Dissolved oxygen']
    if pd.notna(do):
        pts += 2 if do < 4 else (1 if do < 6 else 0)
    bod = row['BOD5']
    if pd.notna(bod):
        pts += 2 if bod > 6 else (1 if bod > 3 else 0)
    nh4 = row['Ammonium']
    if pd.notna(nh4):
        pts += 2 if nh4 > 1 else (1 if nh4 > 0.5 else 0)
    no3 = row['Nitrate']
    if pd.notna(no3) and no3 > 25:
        pts += 1
    tp = row['Total phosphorus']
    if pd.notna(tp) and tp > 0.1:
        pts += 1
    ph = row['pH']
    if pd.notna(ph) and not (6.5 <= ph <= 8.5):
        pts += 1
    return pts


def bucket(p):
    if p <= 1:
        return 'Low'
    elif p <= 3:
        return 'Medium'
    else:
        return 'High'


def main():
    df = pd.read_csv("../notebook/wise_river_wide.csv")
    for c in PARAM_COLS:
        lo, hi = df[c].quantile([0.01, 0.99])
        df[c] = df[c].clip(lo, hi)
    df['risk_points'] = df.apply(compute_risk_points, axis=1)
    df['Risk_Level'] = df['risk_points'].apply(bucket)

    X = df[PARAM_COLS]
    y = df['Risk_Level']

    # Geography-aware split note: EEA sites appear in multiple years, so a
    # per-row split leaks a station's other-year readings between train/test.
    # We report both this row-level split (matches original notebook approach)
    # AND a station-level split (no station appears in both train and test) so
    # the honest, harder number is visible too.
    class_counts = y.value_counts().to_dict()

    results = {}

    # --- Row-level split (imputer fit on TRAIN only — leakage-corrected) ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)
    imputer = SimpleImputer(strategy='median')
    X_train_imp = pd.DataFrame(imputer.fit_transform(X_train), columns=PARAM_COLS, index=X_train.index)
    X_test_imp = pd.DataFrame(imputer.transform(X_test), columns=PARAM_COLS, index=X_test.index)

    def eval_model(name, model, needs_scaling=False):
        if needs_scaling:
            scaler = StandardScaler()
            Xtr = scaler.fit_transform(X_train_imp)
            Xte = scaler.transform(X_test_imp)
        else:
            Xtr, Xte = X_train_imp, X_test_imp
        model.fit(Xtr, y_train)
        pred = model.predict(Xte)
        return {
            "accuracy": round(float(accuracy_score(y_test, pred)), 4),
            "macro_f1": round(float(f1_score(y_test, pred, average='macro')), 4),
            "weighted_f1": round(float(f1_score(y_test, pred, average='weighted')), 4),
            "report": classification_report(y_test, pred, output_dict=True),
        }

    results["row_level_split"] = {
        "description": "80/20 stratified split by row (matches the training notebook's approach). Imputer re-fit on train only, unlike the original notebook.",
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "dummy_most_frequent": eval_model("dummy", DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)),
        "logistic_regression": eval_model("logreg", LogisticRegression(max_iter=1000, class_weight='balanced'), needs_scaling=True),
        "random_forest": eval_model("rf", RandomForestClassifier(n_estimators=300, max_depth=10, random_state=RANDOM_STATE, class_weight='balanced')),
    }

    # --- Station-level split (harder, no leakage across years of same station) ---
    stations = df[['countryCode', 'monitoringSiteIdentifier']].drop_duplicates()
    stations_train, stations_test = train_test_split(
        stations, test_size=0.2, random_state=RANDOM_STATE)
    train_keys = set(map(tuple, stations_train.values))
    is_train = df.apply(lambda r: (r['countryCode'], r['monitoringSiteIdentifier']) in train_keys, axis=1)

    Xg_train, yg_train = X[is_train], y[is_train]
    Xg_test, yg_test = X[~is_train], y[~is_train]
    imputer2 = SimpleImputer(strategy='median')
    Xg_train_imp = pd.DataFrame(imputer2.fit_transform(Xg_train), columns=PARAM_COLS, index=Xg_train.index)
    Xg_test_imp = pd.DataFrame(imputer2.transform(Xg_test), columns=PARAM_COLS, index=Xg_test.index)

    rf2 = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=RANDOM_STATE, class_weight='balanced')
    rf2.fit(Xg_train_imp, yg_train)
    pred2 = rf2.predict(Xg_test_imp)

    results["station_level_split"] = {
        "description": "80/20 split by MONITORING STATION (no station's readings appear in both train and test) — a harder, geography-aware evaluation that avoids leakage between years of the same site.",
        "n_train_rows": int(len(Xg_train)),
        "n_test_rows": int(len(Xg_test)),
        "n_train_stations": int(len(stations_train)),
        "n_test_stations": int(len(stations_test)),
        "random_forest": {
            "accuracy": round(float(accuracy_score(yg_test, pred2)), 4),
            "macro_f1": round(float(f1_score(yg_test, pred2, average='macro')), 4),
            "weighted_f1": round(float(f1_score(yg_test, pred2, average='weighted')), 4),
            "report": classification_report(yg_test, pred2, output_dict=True),
        },
    }

    results["class_distribution_full_dataset"] = class_counts
    results["notes"] = [
        "The row-level split matches the original training notebook's methodology; the imputer here was refit on the train split only (the original notebook fit it on the full dataset before splitting, a mild leakage of imputation statistics, not labels).",
        "The station-level split is the more scientifically honest generalization estimate, since EEA stations recur across multiple years and a row-level split allows a station's other years into training.",
        "Both are reported rather than picking the more favorable number.",
    ]

    with open("eval_metrics.json", "w") as f:
        json.dump(results, f, indent=2)

    print("row-level RF:", results["row_level_split"]["random_forest"]["accuracy"], results["row_level_split"]["random_forest"]["macro_f1"])
    print("station-level RF:", results["station_level_split"]["random_forest"]["accuracy"], results["station_level_split"]["random_forest"]["macro_f1"])


if __name__ == "__main__":
    main()
