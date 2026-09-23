import json, joblib, warnings, numpy as np, pandas as pd
warnings.filterwarnings('ignore')
import os
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
clf=joblib.load(B+'aquasentinel_model.pkl'); imp=joblib.load(B+'aquasentinel_imputer.pkl')
meta=json.load(open(B+'model_metadata.json')); P=meta['param_cols']
ood=json.load(open(B+'ood_detector_metadata.json')); tree=joblib.load(B+'aquasentinel_ood_tree.pkl')
thr=ood['threshold_99th_percentile']
w=pd.read_csv(B+'data/doe_2021_2023_wide.csv')
# source typos flagged in extraction (DO 77.6 mg/L, pH 79) -> treated as missing
w.loc[w['DO']>25,'DO']=np.nan; w.loc[(w['pH']>14),'pH']=np.nan
w=w.dropna(subset=['DO','BOD']).copy()
MAXEXTRA=4   # NH4 (2) + NO3 (1) + TP (1) : the scored parameters DoE does not report
def pts(r):
    p=0
    p+=2 if r['DO']<4 else (1 if r['DO']<6 else 0)
    p+=2 if r['BOD']>6 else (1 if r['BOD']>3 else 0)
    if pd.notna(r['pH']) and not (6.5<=r['pH']<=8.5): p+=1
    return p
lab=lambda p: 0 if p<=1 else (1 if p<=3 else 2)
names=['Low','Medium','High']
w['pts_meas']=w.apply(pts,axis=1)
w['lb']=w['pts_meas'].map(lab); w['ub']=(w['pts_meas']+MAXEXTRA).map(lab)
X=pd.DataFrame({c:np.nan for c in P},index=w.index)
X['pH']=w['pH']; X['Dissolved oxygen']=w['DO']; X['BOD5']=w['BOD']; X['Electrical conductivity']=w['EC']
Xi=pd.DataFrame(imp.transform(X[P]),columns=P,index=w.index)
pred=clf.predict(Xi); idx={n:i for i,n in enumerate(names)}
w['pred']=[idx[p] for p in pred]
w['proj']=np.clip(w['pred'],w['lb'],w['ub'])
# OOD
Z=np.column_stack([(Xi[c]-ood['means'][c])/ood['stds'][c] for c in P])
d,_=tree.query(Z,k=1); w['ood_dist']=d; w['ood']=d>thr
n=len(w)
res={
 'n_station_months':int(n),'n_rivers':int(w.river.nunique()),'n_stations':int(w.groupby(['river','station']).ngroups),
 'years':sorted(map(int,w.year.unique())),
 'lb_class_share':{names[k]:round(float((w.lb==k).mean()),4) for k in range(3)},
 'interval_singleton_share':round(float((w.lb==w.ub).mean()),4),
 'guaranteed_high_share':round(float((w.lb==2).mean()),4),
 'model_pred_share':{names[k]:round(float((w.pred==k).mean()),4) for k in range(3)},
 'model_violates_lower_bound_share':round(float((w.pred<w.lb).mean()),4),
 'model_violates_among_guaranteed_high':round(float((w.pred[w.lb==2]<2).mean()),4),
 'projected_matches_lower_bound_share':round(float((w.proj==w.lb).mean()),4),
 'ood_flag_share':round(float(w.ood.mean()),4),
 'ood_median_multiple_of_threshold':round(float(np.median(d)/thr),2),
 'ood_dist_pctl_vs_thr':{str(q):round(float(np.percentile(d,q)/thr),2) for q in (5,25,50,75,95)},
}
# by river (top)
g=w.groupby('river').apply(lambda x: pd.Series({'n':len(x),'guaranteed_high':(x.lb==2).mean(),'model_violates':(x.pred<x.lb).mean(),'ood':x.ood.mean()})).round(3)
res['by_river']=g.sort_values('n',ascending=False).head(15).reset_index().to_dict('records')
# seasonal split (dry Nov-Apr / wet May-Oct)
w['season']=np.where(w.month.isin([11,12,1,2,3,4]),'dry','wet')
res['by_season']=w.groupby('season').apply(lambda x: pd.Series({'n':len(x),'guaranteed_high':(x.lb==2).mean(),'model_violates':(x.pred<x.lb).mean(),'ood':x.ood.mean()})).round(3).reset_index().to_dict('records')
res['by_year']=w.groupby('year').apply(lambda x: pd.Series({'n':len(x),'guaranteed_high':(x.lb==2).mean(),'model_violates':(x.pred<x.lb).mean()})).round(3).reset_index().to_dict('records')
# OOD as error predictor: does distance predict lower-bound violation? AUROC
from sklearn.metrics import roc_auc_score
v=(w.pred<w.lb).astype(int)
res['ood_auroc_for_lower_bound_violation']=round(float(roc_auc_score(v,w.ood_dist)),3) if v.nunique()>1 else None
res['note']=('Parameters reported by DoE and used: pH, DO, BOD5, EC. Ammonium, Nitrate, Nitrite, Total P, temperature are not reported and are median-imputed for the model; '
             'bounds assume up to +4 points from the unreported scored parameters (NH4 2, NO3 1, TP 1). Two source typos (DO 77.6, pH 79) treated as missing.')
json.dump(res,open(B+'data/bd_powered_eval.json','w'),indent=1)
w.to_csv(B+'data/doe_2021_2023_scored.csv',index=False)
print(json.dumps({k:v for k,v in res.items() if k not in('by_river','by_year','by_season','note')},indent=1))
print(pd.DataFrame(res['by_river']).to_string()); print(pd.DataFrame(res['by_season'])); print(pd.DataFrame(res['by_year']))

# ---- regional nutrient prior (REACH-Dhaka) applied ONLY to Dhaka-region rivers ---------------------------------
# EC in southern tidal rivers is driven by salinity, so a Dhaka sewage/industry prior must not be applied there.
import os as _os
DOMAIN={'Buriganga','Turag','Balu','Shitalakhya','Dhaleshwari','Kaligonga'}
pr3=B+'reach_nutrient_prior.pkl'; pr2=B+'reach_nutrient_prior_do_ph.pkl'
if _os.path.exists(pr3) and _os.path.exists(pr2):
    m3=joblib.load(pr3); m2=joblib.load(pr2)
    w['in_prior_domain']=w['river'].isin(DOMAIN)
    has_ec=w['EC'].notna()&(w['EC']<=2220)
    ex=np.full(len(w),np.nan)
    a=(w.in_prior_domain&has_ec).values; b=(w.in_prior_domain&~has_ec).values
    if a.any(): ex[a]=m3.predict(w.loc[a,['DO','pH','EC']].fillna(7.3).values)
    if b.any(): ex[b]=m2.predict(w.loc[b,['DO','pH']].fillna(7.3).values)
    w['prior_extra_points']=np.clip(np.rint(ex),0,MAXEXTRA)
    dm=w[w.in_prior_domain].copy()
    dm['prior_class']=[lab(int(x+y)) for x,y in zip(dm['pts_meas'],dm['prior_extra_points'])]
    assert ((dm.prior_class>=dm.lb)&(dm.prior_class<=dm.ub)).all()   # inside the provable interval by construction
    w['prior_class']=np.nan; w.loc[dm.index,'prior_class']=dm['prior_class']
    res['with_regional_prior']={
      'domain_rivers':sorted(DOMAIN),'n_station_months_in_domain':int(len(dm)),
      'prior_class_share':{names[k]:round(float((dm.prior_class==k).mean()),4) for k in range(3)},
      'naive_model_class_share_same_rows':{names[k]:round(float((dm.pred==k).mean()),4) for k in range(3)},
      'provable_lower_bound_share_same_rows':{names[k]:round(float((dm.lb==k).mean()),4) for k in range(3)},
      'prior_higher_than_naive_model_share':round(float((dm.prior_class>dm.pred).mean()),4),
      'by_river_prior_High_share':dm.groupby('river').apply(lambda x:(x.prior_class==2).mean()).round(3).to_dict(),
      'caveat':'Class-level accuracy cannot be verified: DoE has no nutrient measurements. The prior is validated only at the points level on REACH-Dhaka (see reach_prior_meta.json). Not applied outside Dhaka-region rivers.'}
    json.dump(res,open(B+'data/bd_powered_eval.json','w'),indent=1)
    w.to_csv(B+'data/doe_2021_2023_scored.csv',index=False)
    print(json.dumps(res['with_regional_prior'],indent=1))
