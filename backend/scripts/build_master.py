"""QC the Bangladesh master dataset (DoE 2021-2023 annex tables + REACH-Dhaka 2017-2021 + DoE 2015 trend table).
Raw values are never edited: implausible values get value_clean = NaN and an explicit qc_flag."""
import os, json, numpy as np, pandas as pd
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/data/'
m = pd.read_csv(B + 'aquasentinel_bd_master_raw.csv', low_memory=False)
m['date'] = pd.to_datetime(m['date'])
LIM = {'pH': (3, 11), 'Dissolved oxygen': (0, 20), 'BOD5': (0, 400), 'COD': (0, 1500), 'Ammonium': (0, 60), 'Nitrate': (0, 500),
       'Water temperature': (5, 40), 'Electrical conductivity': (0, 60000), 'Turbidity': (0, 1500), 'Suspended solids': (0, 2000),
       'TDS': (0, 40000), 'Chloride': (0, 20000), 'Total alkalinity': (0, 1000), 'Salinity': (0, 100), 'E_coli': (0, 1e8)}
m['value_clean'] = m['value']; m['qc_flag'] = ''
for p, (lo, hi) in LIM.items():
    k = (m.parameter == p) & m.value.notna() & ((m.value < lo) | (m.value > hi))
    m.loc[k, 'value_clean'] = np.nan
    m.loc[k, 'qc_flag'] = np.where(m.loc[k, 'value'] < 0, 'negative_value', 'outside_plausible_range')
def wtype(r):
    s = f'{r}'.lower()
    return 'urban_lake' if ('lake' in s or 'jheel' in s) else ('canal' if ('canal' in s or 'khal' in s) else 'river')
m['water_type'] = m['river'].map(wtype)
m['season'] = np.where(m['month'].isin([11, 12, 1, 2, 3, 4]), 'dry', 'wet')
m.to_csv(B + 'bd_master_clean_long.csv', index=False)
keys = ['source', 'water_type', 'river', 'station', 'date', 'year', 'month', 'season', 'latitude', 'longitude']
m['latitude'] = m['latitude'].round(6).fillna(-999); m['longitude'] = m['longitude'].round(6).fillna(-999)   # NaN keys would be dropped by pivot
w = m.pivot_table(index=keys, columns='parameter', values='value_clean', aggfunc='first').reset_index()
w[['latitude', 'longitude']] = w[['latitude', 'longitude']].replace(-999, np.nan)
w.to_csv(B + 'bd_master_station_month.csv', index=False)
rep = {'rows_raw': int(len(m)), 'flagged': {k: int(v) for k, v in m.qc_flag[m.qc_flag != ''].value_counts().items()},
       'flagged_detail': m[m.qc_flag != ''][['source', 'river', 'station', 'date', 'parameter', 'value', 'qc_flag']].astype(str).values.tolist(),
       'station_months': int(len(w)), 'by_source': {s: {'station_months': int(len(g)), 'rivers': int(g.river.nunique()), 'stations': int(g.station.nunique()),
       'years': [int(g.year.min()), int(g.year.max())]} for s, g in w.groupby('source')},
       'parameter_coverage_by_source': {s: {c: int(g[c].notna().sum()) for c in w.columns if c in LIM} for s, g in w.groupby('source')},
       'missing_from_master': ['Phosphate/PO4 (present in REACH workbook)', 'Total coliform (present in REACH workbook)', 'Metals (Pb, Cr, Hg)']}
json.dump(rep, open(B + 'master_qc_report.json', 'w'), indent=1)
print(rep['flagged'], rep['station_months'], {s: v['station_months'] for s, v in rep['by_source'].items()})
