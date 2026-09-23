"""Train the mask-aware MLP used as a second opinion in /api/predict (same recipe and split as notebook section 14.7)."""
import os, json, warnings, numpy as np, pandas as pd, joblib
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import GroupShuffleSplit
warnings.filterwarnings('ignore')
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
P = json.load(open(B + 'model_metadata.json'))['param_cols']
NUT = ['Ammonium', 'Nitrate', 'Nitrite', 'Total phosphorus']

def build(csv=None, seed=42):
    csv = csv or os.path.join(B, '..', 'notebook', 'wise_river_wide.csv')
    eu = pd.read_csv(csv)
    for c in P:
        lo, hi = eu[c].quantile([.01, .99]); eu[c] = eu[c].clip(lo, hi)
    def pts(r):
        p = 2 if r['Dissolved oxygen'] < 4 else (1 if r['Dissolved oxygen'] < 6 else 0)
        p += 2 if r['BOD5'] > 6 else (1 if r['BOD5'] > 3 else 0)
        if pd.notna(r['Ammonium']): p += 2 if r['Ammonium'] > 1 else (1 if r['Ammonium'] > .5 else 0)
        if pd.notna(r['Nitrate']) and r['Nitrate'] > 25: p += 1
        if pd.notna(r['Total phosphorus']) and r['Total phosphorus'] > .1: p += 1
        if pd.notna(r['pH']) and not (6.5 <= r['pH'] <= 8.5): p += 1
        return p
    eu = eu.dropna(subset=['Dissolved oxygen', 'BOD5']).copy()
    eu['y'] = eu.apply(pts, axis=1).map(lambda p: 0 if p <= 1 else (1 if p <= 3 else 2))
    grp = (eu.countryCode + eu.monitoringSiteIdentifier).values
    tr, _ = next(GroupShuffleSplit(1, test_size=.2, random_state=seed).split(eu, eu.y, grp))
    X, y = eu.iloc[tr][P].values, eu.y.values[tr]
    imp = SimpleImputer(strategy='median').fit(X); sc = StandardScaler().fit(imp.transform(X))
    rng = np.random.default_rng(seed); idx = [P.index(c) for c in NUT]
    Xs, ys = [X], [y]
    for _ in range(3):
        Xm = X.copy(); hide = rng.random((len(X), len(idx))) < .5
        for j, c in enumerate(idx): Xm[hide[:, j], c] = np.nan
        Xs.append(Xm); ys.append(y)
    Xa, ya = np.vstack(Xs), np.concatenate(ys)
    Z = np.hstack([sc.transform(imp.transform(Xa)), np.isnan(Xa).astype(float)])
    mlp = MLPClassifier((64, 32), max_iter=60, early_stopping=True, random_state=seed).fit(Z, ya)
    return {'imputer': imp, 'scaler': sc, 'mlp': mlp, 'param_cols': P}

if __name__ == '__main__':
    m = build(); joblib.dump(m, B + 'aquasentinel_maskaware_mlp.pkl'); print('saved', m['mlp'].classes_)
