"""Regional nutrient prior: predict the risk points that the unreported nutrients (NH4, NO3, P) would add, from the
field variables DoE does report (DO, pH, EC), using REACH-Dhaka 2017-2021. Validated leave-location/river/year-out."""
import os, json, warnings, numpy as np, pandas as pd, joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold, LeaveOneGroupOut
warnings.filterwarnings('ignore')
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
r = pd.read_csv(B + 'data/reach_dhaka_clean.csv')
m = r.dropna(subset=['DO', 'pH', 'EC', 'NH4_N', 'NO3', 'PO4_P']).copy()  # EC needed for the 3-feature prior
m['nut'] = (np.where(m.NH4_N > 1, 2, np.where(m.NH4_N > 0.5, 1, 0)) + (m.NO3 > 25).astype(int) + (m.PO4_P > 0.1).astype(int))
FE = ['DO', 'pH', 'EC']
def cv(groups, feats, splitter):
    X = m[feats].values; y = m.nut.values; g = m[groups].values; p = np.zeros(len(m)); c = np.zeros(len(m))
    for tr, te in splitter.split(X, y, g):
        p[te] = RandomForestRegressor(300, min_samples_leaf=5, random_state=0).fit(X[tr], y[tr]).predict(X[te]); c[te] = np.median(y[tr])
    q = np.clip(np.rint(p), 0, 4)
    return p, {'MAE': round(float(np.abs(q - y).mean()), 3), 'bias': round(float((q - y).mean()), 3), 'within_1': round(float((np.abs(q - y) <= 1).mean()), 3),
               'const_MAE': round(float(np.abs(np.clip(np.rint(c), 0, 4) - y).mean()), 3)}
out = {'features': FE, 'n': int(len(m))}
oof, out['leave_location_out'] = cv('loc_code', FE, GroupKFold(5))
_, out['leave_river_out'] = cv('river', FE, LeaveOneGroupOut())
_, out['leave_year_out'] = cv('year', FE, LeaveOneGroupOut())
_, out['leave_location_out_with_temp_turbidity'] = cv('loc_code', FE + ['temp_c', 'turbidity'], GroupKFold(5)) if m[['temp_c', 'turbidity']].notna().all().all() else (None, None)
res = m.nut.values - oof
out['oof_residual_quantiles'] = {'q10': round(float(np.quantile(res, .10)), 2), 'q90': round(float(np.quantile(res, .90)), 2)}
rf = RandomForestRegressor(300, min_samples_leaf=5, random_state=0).fit(m[FE].values, m.nut.values)
joblib.dump(rf, B + 'reach_nutrient_prior.pkl')
# fallback prior when EC is not reported (DO + pH only), trained on all rows that have DO, pH and the nutrients
m2 = r.dropna(subset=['DO', 'pH', 'NH4_N', 'NO3', 'PO4_P']).copy()
m2['nut'] = (np.where(m2.NH4_N > 1, 2, np.where(m2.NH4_N > 0.5, 1, 0)) + (m2.NO3 > 25).astype(int) + (m2.PO4_P > 0.1).astype(int))
X2 = m2[['DO', 'pH']].values; y2 = m2.nut.values; g2 = m2['loc_code'].values; p2 = np.zeros(len(m2))
for tr, te in GroupKFold(5).split(X2, y2, g2):
    p2[te] = RandomForestRegressor(300, min_samples_leaf=5, random_state=0).fit(X2[tr], y2[tr]).predict(X2[te])
q2 = np.clip(np.rint(p2), 0, 4)
out['fallback_DO_pH_only_leave_location_out'] = {'n': int(len(m2)), 'MAE': round(float(np.abs(q2 - y2).mean()), 3), 'within_1': round(float((np.abs(q2 - y2) <= 1).mean()), 3)}
joblib.dump(RandomForestRegressor(300, min_samples_leaf=5, random_state=0).fit(X2, y2), B + 'reach_nutrient_prior_do_ph.pkl')
out['domain'] = 'Dhaka-region rivers and canals (REACH-Dhaka 2017-2021); do not apply outside comparable industrial-urban rivers'
json.dump(out, open(B + 'data/reach_prior_meta.json', 'w'), indent=1); print(json.dumps(out, indent=1))
