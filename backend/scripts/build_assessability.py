"""Regulatory assessability: for every station-month in the master dataset, is compliance with each ECR 2023 use class
provably failed, certifiable, or undeterminable from the parameters that were actually measured?"""
import os, sys, json, numpy as np, pandas as pd
here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(here, '..'))
import ecr2023 as E
B = os.path.join(here, '..') + '/data/'
w = pd.read_csv(B + 'bd_master_station_month.csv')
w = w[~w.source.str.contains('2015')]                         # monthly station data only (the 2015 table is seasonal river means)
cols = {'pH': 'pH', 'Dissolved oxygen': 'Dissolved oxygen', 'BOD5': 'BOD5', 'COD': 'COD', 'TDS': 'TDS', 'Ammonium': 'Ammonium', 'Nitrate': 'Nitrate', 'E_coli': 'E_coli'}
def reading(r): return {k: r[c] for k, c in cols.items() if c in r and pd.notna(r[c])}
verd = []; 
for _, r in w.iterrows():
    a = E.assess(reading(r)); verd.append({c: v['verdict'] for c, v in a.items()} | {'_fails_' + c: ','.join(v['failed']) for c, v in a.items()})
V = pd.DataFrame(verd, index=w.index); w = pd.concat([w, V], axis=1)
res = {'note': 'Master dataset has no phosphate, metals or fecal-coliform counts other than E. coli; E. coli above a limit proves fecal coliform above it, below a limit proves nothing. Standards transcribed from the gazette image - verify.', 'by_source': {}}
std_cols = ['pH', 'DO', 'BOD', 'NO3_N', 'NH4_N', 'PO4_P', 'Cr', 'Pb', 'Hg', 'FC', 'TDS', 'COD']
have = {'pH': 'pH', 'DO': 'Dissolved oxygen', 'BOD': 'BOD5', 'NO3_N': 'Nitrate', 'NH4_N': 'Ammonium', 'FC': 'E_coli', 'TDS': 'TDS', 'COD': 'COD'}
for s, g in w.groupby('source'):
    d = {'n_station_months': int(len(g)), 'schedule_parameters_measured_share': {p: round(float(g[have[p]].notna().mean()), 3) if p in have and have[p] in g else 0.0 for p in std_cols}, 'classes': {}}
    for cid, spec in E.STANDARDS.items():
        d['classes'][cid] = {'label': spec['label'], **{k: round(float((g[cid] == k).mean()), 4) for k in ('non_compliant', 'undetermined', 'compliant')}}
    res['by_source'][s] = d
dm = w[w.source.str.contains('DoE_SurfaceGround')]
res['doe_fisheries_non_compliant_by_river'] = dm.groupby('river').apply(lambda x: pd.Series({'n': len(x), 'non_compliant': round(float((x['4_fisheries'] == 'non_compliant').mean()), 3)})).sort_values('n', ascending=False).head(15).reset_index().to_dict('records')
res['doe_drivers_of_failure_fisheries'] = {p: round(float(dm['_fails_4_fisheries'].str.contains(p, regex=False).mean()), 3) for p in ['DO', 'BOD', 'pH', 'COD', 'TDS']}
res['overall'] = {'n_station_months': int(len(w)), 'share_certifiable_any_class': round(float((w[list(E.STANDARDS)] == 'compliant').any(axis=1).mean()), 4),
                  'share_provably_failing_fisheries': round(float((w['4_fisheries'] == 'non_compliant').mean()), 4),
                  'share_provably_failing_drinking_source_conventional': round(float((w['3_drinking_source_conventional'] == 'non_compliant').mean()), 4)}
json.dump(res, open(B + 'assessability.json', 'w'), indent=1); print(json.dumps(res['overall'], indent=1)); print(json.dumps(res['by_source']['REACH-Dhaka_2017-2021']['classes']['4_fisheries']), res['doe_drivers_of_failure_fisheries'])
