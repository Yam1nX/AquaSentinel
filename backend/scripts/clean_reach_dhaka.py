"""Clean the REACH-Dhaka water quality workbook (2017-2021) into a tidy CSV with rule-ready columns.
Unit handling: nitrate is mg/L as NO3- (same basis as the EEA 'Nitrate' column), ammonia is mg/L NH3-N (same basis as the
EEA 'Ammonium' column), phosphate is mg/L as PO4 -> converted to mg P/L (x 30.974/94.971)."""
import sys, re, pandas as pd, numpy as np
src = sys.argv[1]; out = sys.argv[2]
d = pd.read_excel(src, sheet_name='All_Data-2017-2021')
d.columns = [re.sub(r'\s+', ' ', c).strip() for c in d.columns]
ren = {'River/Stream':'river_raw','Location':'location','Location Code / SL No.':'loc_code','Latitude':'lat','Longitude':'lon',
       'Temp (°C)':'temp_c','pH':'pH','EC (µS/cm)':'EC','TDS (mg/L)':'TDS','DO (mg/L)':'DO','Turbidity (NTU)':'turbidity',
       'Suspended Solids (mg/L)':'SS','Alkalinity (Total) (mg/L as CaCO3)':'alkalinity','Ammonia-Nitrogen (NH3-N) (mg/L)':'NH4_N',
       'Nitrate (mg/L)':'NO3','Phosphate (mg/L)':'PO4','Chloride (mg/L)':'chloride','COD (mg/L)':'COD','TOC (mg/L)':'TOC',
       'TC (count/100 mL)':'TC','E.coli (count/100mL)':'Ecoli','Project':'project'}
d = d.rename(columns=ren)
keep = ['Date']+list(ren.values())
d = d[[c for c in keep if c in d.columns]].copy()
d['Date'] = pd.to_datetime(d['Date'], errors='coerce')
d['year'] = d['Date'].dt.year; d['month'] = d['Date'].dt.month
d['river'] = (d['river_raw'].astype(str).str.strip().str.title()
              .replace({'Dhaleshwari':'Dhaleshwari','Tongi Khal':'Tongi Khal'}))
d['loc_code'] = d['loc_code'].astype(str).str.replace(r'^L-?','',regex=True).str.strip()
num = ['temp_c','pH','EC','TDS','DO','turbidity','SS','alkalinity','NH4_N','NO3','PO4','chloride','COD','TOC','TC','Ecoli','lat','lon']
for c in num: d[c] = pd.to_numeric(d[c], errors='coerce')
d['PO4_P'] = d['PO4'] * 30.974/94.971
d['season'] = np.where(d['month'].isin([11,12,1,2,3,4]),'dry','wet')
d = d.dropna(subset=['Date'])
d.to_csv(out, index=False)
print(len(d), d['river'].nunique(), d['loc_code'].nunique(), d['Date'].min().date(), d['Date'].max().date())
print(d['river'].value_counts().to_dict())
