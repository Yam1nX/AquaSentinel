import pandas as pd, numpy as np, re
frames=[pd.read_csv(f'doe_{y}_raw.csv') for y in (2021,2022,2023)]
d=pd.concat(frames,ignore_index=True)
d['value']=pd.to_numeric(d['value'],errors='coerce')
d=d.dropna(subset=['value'])
MERGE=re.compile(r'^(Bridge|Ghat|Road|Point|Char|Bazar|Bazaar|Launch|\()',re.I)
out=[]
for key,g in d.groupby(['year','page','body','param'],sort=False):
    order=list(dict.fromkeys(g['station']))
    remap={}
    for i,s in enumerate(order):
        if i>0 and MERGE.match(s) and not order[i-1].rstrip().endswith(')') and len(s.split())<=3:
            base=remap.get(order[i-1],order[i-1])
            remap[s]=base+' '+s   # merged label
            remap[order[i-1]]=remap[s]
    g=g.copy()
    g['station']=g['station'].map(lambda s: remap.get(s,s))
    # union of values; if a (station, month) collides keep first
    g=g.drop_duplicates(['station','month'])
    out.append(g)
d=pd.concat(out,ignore_index=True)
def norm(s):
    s=re.sub(r'\s+',' ',s).strip()
    s=s.replace('Hajaribag','Hazaribagh').replace('Bangladesg','Bangladesh').replace('Frendship','Friendship').replace('Chadnighat','Chandni Ghat')
    return s
d['station']=d['station'].map(norm)
d['river']=d['body'].str.replace(' River','',regex=False).replace({'Turagh':'Turag','Tatulia':'Tetulia','Sugandha':'Sughanda'})
d['water_type']=np.where(d['body'].str.contains('Lake|Jheel'),'urban_lake','river')
# plausibility flags
lim={'pH':(0,14),'DO':(0,25),'BOD':(0,500),'COD':(0,3000)}
d['flag_range']=[ (p in lim and not (lim[p][0]<=v<=lim[p][1])) for p,v in zip(d.param,d.value)]
d=d[['year','month','water_type','river','station','param','value','flag_range','page']].sort_values(['year','river','station','param','month']).reset_index(drop=True)
d.to_csv('doe_2021_2023_long.csv',index=False)
print(d.shape, d.flag_range.sum(),'range flags')
print(d.groupby(['water_type','year']).size().unstack())
# wide station-month for the 3 core params
w=d.pivot_table(index=['year','month','water_type','river','station'],columns='param',values='value',aggfunc='first').reset_index()
w.to_csv('doe_2021_2023_wide.csv',index=False)
print(w.shape)
core=w.dropna(subset=['DO','BOD'])
print('rows with DO&BOD:',len(core),' with pH too:',core['pH'].notna().sum(),' with COD:',core['COD'].notna().sum())
print(core.groupby('river').size().sort_values(ascending=False).head(15))
