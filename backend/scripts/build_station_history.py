"""
Build station_history.json — REAL multi-year per-station time series for the
EU (EEA Waterbase) stations, used to power the temporal early-warning panel
with genuine data (not simulated).

NOTE: this logic is documented and executed step-by-step in
notebook/AquaSentinel_notebook.ipynb, Section 8.3 ("Early-Warning State
Machine") — that notebook is the canonical, reviewable version of this work.
This script is a convenience CLI equivalent for regenerating the file without
launching Jupyter; keep the two in sync if you change the thresholds.

Run from backend/: python3 scripts/build_station_history.py
Reads:  ../notebook/wise_river_wide.csv
Writes: station_history.json  (only stations with >=2 years of real data)
"""
import json
import numpy as np
import pandas as pd

PARAM_COLS = ['pH', 'Dissolved oxygen', 'BOD5', 'Ammonium', 'Nitrate', 'Nitrite',
              'Total phosphorus', 'Water temperature', 'Electrical conductivity']

CSV_PATH = "../notebook/wise_river_wide.csv"
OUT_PATH = "station_history.json"


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
    df = pd.read_csv(CSV_PATH)

    # Same 1st/99th percentile capping as the training notebook, for consistency
    for c in PARAM_COLS:
        lo, hi = df[c].quantile([0.01, 0.99])
        df[c] = df[c].clip(lo, hi)

    df['risk_points'] = df.apply(compute_risk_points, axis=1)
    df['Risk_Level'] = df['risk_points'].apply(bucket)

    out = {}
    n_multi = 0
    for (cc, site_id), g in df.groupby(['countryCode', 'monitoringSiteIdentifier']):
        g = g.sort_values('phenomenonTimeReferenceYear')
        if len(g) < 2:
            continue  # no real trend possible with a single reading
        n_multi += 1

        years = []
        for _, row in g.iterrows():
            years.append({
                "year": int(row['phenomenonTimeReferenceYear']),
                "risk_level": row['Risk_Level'],
                "risk_points": int(row['risk_points']),
                "params": {c: (None if pd.isna(row[c]) else round(float(row[c]), 4)) for c in PARAM_COLS},
            })

        # real slope over actual years present (not assumed evenly spaced)
        x = g['phenomenonTimeReferenceYear'].astype(float).values
        y = g['risk_points'].astype(float).values
        slope = float(np.polyfit(x, y, 1)[0]) if len(g) >= 3 else None

        first, last = years[0], years[-1]
        param_pct_change = {}
        for c in PARAM_COLS:
            v0, v1 = first['params'][c], last['params'][c]
            if v0 not in (None, 0) and v1 is not None:
                param_pct_change[c] = round((v1 - v0) / abs(v0) * 100, 1)
            else:
                param_pct_change[c] = None

        out[site_id] = {
            "countryCode": cc,
            "monitoringSiteName": g['monitoringSiteName'].iloc[-1],
            "lat": float(g['lat'].iloc[-1]),
            "lon": float(g['lon'].iloc[-1]),
            "n_years": len(years),
            "years": years,
            "risk_trend_slope": slope,
            "first_year": first['year'],
            "last_year": last['year'],
            "risk_trajectory": [yy['risk_level'] for yy in years],
            "param_pct_change_first_to_last": param_pct_change,
        }

    with open(OUT_PATH, "w") as f:
        json.dump(out, f)

    print(f"Stations with >=2 years real history: {n_multi}")
    print(f"Wrote {OUT_PATH} ({len(out)} entries)")


if __name__ == "__main__":
    main()
