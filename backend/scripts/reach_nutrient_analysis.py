"""What the unmeasured parameters look like in real Dhaka rivers (REACH-Dhaka 2017-2021), and whether cheap field-probe
variables can recover them. Outputs data/reach_analysis.json."""
import os, json, warnings, numpy as np, pandas as pd, joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold
warnings.filterwarnings('ignore')
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
r = pd.read_csv(B + 'data/reach_dhaka_clean.csv')
imp = joblib.load(B + 'aquasentinel_imputer.pkl'); meta = json.load(open(B + 'model_metadata.json'))
med = dict(zip(meta['param_cols'], imp.statistics_))

def p_do(x):  return np.where(x < 4, 2, np.where(x < 6, 1, 0))
def p_ph(x):  return np.where((x < 6.5) | (x > 8.5), 1, 0)
def p_nh4(x): return np.where(x > 1, 2, np.where(x > 0.5, 1, 0))
def p_no3(x): return np.where(x > 25, 1, 0)
def p_tp(x):  return np.where(x > 0.1, 1, 0)   # orthophosphate-P is a lower bound of total P

m = r.dropna(subset=['DO', 'pH', 'NH4_N', 'NO3', 'PO4_P']).copy()
m['blind'] = p_do(m.DO) + p_ph(m.pH)
m['nut'] = p_nh4(m.NH4_N) + p_no3(m.NO3) + p_tp(m.PO4_P)
lab = lambda p: np.where(p <= 1, 0, np.where(p <= 3, 1, 2))
res = {'n_samples': int(len(m)), 'n_locations': int(m.loc_code.nunique()), 'n_rivers': int(m.river.nunique()),
       'years': [int(m.year.min()), int(m.year.max())]}

# 1. what nutrient blindness leaves out
res['extra_points_from_unmeasured_nutrients'] = {
    'mean': round(float(m.nut.mean()), 2), 'median': float(m.nut.median()),
    'share_ge2': round(float((m.nut >= 2).mean()), 3), 'share_ge3': round(float((m.nut >= 3).mean()), 3),
    'distribution': {int(k): round(float(v), 3) for k, v in m.nut.value_counts(normalize=True).sort_index().items()}}
# EU median imputation implies these nutrient points (what the model effectively assumes)
eu_nut = int(p_nh4(med['Ammonium']) + p_no3(med['Nitrate']) + p_tp(med['Total phosphorus']))
res['eu_median_imputation_implied_nutrient_points'] = eu_nut
shift = {}
for b in (0, 1, 2):   # BOD is not measured in REACH: show all three BOD contributions
    shift[f'if_BOD_adds_{b}'] = round(float((lab(m.blind + b) < lab(m.blind + m.nut + b)).mean()), 3)
res['share_where_nutrients_would_raise_risk_class'] = shift

# 2. legal exceedance (ECR 2023 fisheries class values as transcribed; verify against the gazette)
no3n = m.NO3 * 14.007 / 62.005
ex = {'DO_below_5': float((m.DO < 5).mean()), 'NH4N_above_0.3': float((m.NH4_N > 0.3).mean()),
      'NH4N_above_1.0': float((m.NH4_N > 1.0).mean()), 'PO4P_above_0.5': float((m.PO4_P > 0.5).mean()),
      'NO3N_above_7.0': float((no3n > 7.0).mean())}
ec = r.dropna(subset=['Ecoli'])
ex['Ecoli_above_5000_per_100mL'] = float((ec.Ecoli > 5000).mean()); ex['n_ecoli'] = int(len(ec))
res['exceedance_share'] = {k: (round(v, 3) if isinstance(v, float) else v) for k, v in ex.items()}

# 3. can cheap field-probe variables recover the nutrient points? leave-location-out CV
feats = ['DO', 'pH', 'EC', 'temp_c', 'turbidity']
t = m.dropna(subset=feats).copy(); X = t[feats].values; y = t.nut.values; g = t.loc_code.values
pred_rf = np.zeros(len(t)); pred_const = np.zeros(len(t))
for tr, te in GroupKFold(n_splits=5).split(X, y, g):
    rf = RandomForestRegressor(300, min_samples_leaf=5, random_state=0).fit(X[tr], y[tr])
    pred_rf[te] = rf.predict(X[te]); pred_const[te] = np.median(y[tr])
def rep(p, rounded=True):
    q = np.clip(np.rint(p), 0, 4) if rounded else p
    e = q - y
    return {'MAE_points': round(float(np.abs(e).mean()), 3), 'bias_points': round(float(e.mean()), 3),
            'exact': round(float((q == y).mean()), 3), 'within_1': round(float((np.abs(e) <= 1).mean()), 3)}
res['field_probe_recovery_leave_location_out'] = {
    'features': feats, 'n': int(len(t)),
    'eu_median_imputation': rep(np.full(len(t), eu_nut)),
    'regional_constant_median': rep(pred_const),
    'field_probe_random_forest': rep(pred_rf)}

# 4. cross-source consistency with DoE monthly data (2021-2023) for shared rivers
doe = pd.read_csv(B + 'data/doe_2021_2023_wide.csv')
doe['season'] = np.where(doe.month.isin([11, 12, 1, 2, 3, 4]), 'dry', 'wet')
rows = []
for rv in ['Buriganga', 'Turag', 'Balu', 'Shitalakhya', 'Dhaleshwari']:
    for s in ('dry', 'wet'):
        a = r[(r.river == rv) & (r.season == s)]; b = doe[(doe.river == rv) & (doe.season == s)]
        rows.append({'river': rv, 'season': s, 'REACH_2017_2021_median_DO': round(float(a.DO.median()), 2), 'n_reach': int(a.DO.notna().sum()),
                     'DoE_2021_2023_median_DO': round(float(b.DO.median()), 2) if b.DO.notna().any() else None, 'n_doe': int(b.DO.notna().sum())})
res['cross_source_DO_medians'] = rows
yr = r[r.river.isin(['Buriganga', 'Turag'])].groupby(['river', 'year']).DO.agg(['median', 'count']).round(2).reset_index()
res['reach_DO_by_year_buriganga_turag'] = yr.to_dict('records')
res['note'] = ('REACH has no BOD; nutrient points are computed without BOD. Orthophosphate-P is used as a lower-bound proxy for total P. '
               'Ammonia is total ammonia-N (Nessler), nitrate as mg NO3/L, matching the EEA columns used by the rule.')
json.dump(res, open(B + 'data/reach_analysis.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k not in ('cross_source_DO_medians', 'reach_DO_by_year_buriganga_turag')}, indent=1))
print(pd.DataFrame(res['cross_source_DO_medians']).to_string()); print(yr.to_string())
