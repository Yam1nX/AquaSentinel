"""Extract monthly per-station tables from DoE 'Surface and Ground Water Quality Report' PDFs (2021-2023).
Word-position based: each numeric word inside a table row is assigned to the month column whose header is nearest."""
import re, sys, json
import pdfplumber, pandas as pd

MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
def mon(w):
    w=w.lower().strip('.')
    if w in ('apl',): return 'apr'
    return w[:3] if w[:3] in MONTHS else None
NUM = re.compile(r'^[<>]?\d+(\.\d+)?$')

def title_lines(page):
    out=[]
    for ln in page.extract_text_lines():
        t=ln['text'].strip()
        if t.lower().startswith('table'):
            out.append((ln['top'],t))
    return out

def parse_title(t):
    m=re.search(r'Level (?:of )?(.+?) of (.+?) (River|Lake|Jheel|Beel)\b',t,re.I)
    yr=re.search(r'(20\d\d)',t[::-1][::-1][-30:])
    y=re.findall(r'20\d\d',t)
    if not m: return None
    return dict(param_raw=m.group(1).strip(), body=(m.group(2).strip()+' '+m.group(3).title()), year_title=int(y[-1]) if y else None)

def norm_param(p):
    p=p.lower()
    if p.startswith('ph'): return 'pH'
    if p.startswith('do'): return 'DO'
    if p.startswith('bod'): return 'BOD'
    if p.startswith('cod'): return 'COD'
    if p.startswith('tds'): return 'TDS'
    if p.startswith('turb'): return 'Turbidity'
    if p.startswith('chlor'): return 'Chloride'
    if p.startswith('ss'): return 'SS'
    if 'alkal' in p: return 'TotalAlkalinity'
    if p.startswith('ec') or 'conduct' in p: return 'EC'
    if 'salin' in p: return 'Salinity'
    if 'temp' in p: return 'Temperature'
    return p.strip()

def extract(pdf_path, year):
    rows=[]; log=[]
    with pdfplumber.open(pdf_path) as pdf:
        for pi,page in enumerate(pdf.pages):
            txt=page.extract_text() or ''
            if 'Jan' not in txt or 'Table' not in txt: continue
            titles=title_lines(page)
            words=page.extract_words(keep_blank_chars=False, use_text_flow=False)
            # header rows: lines containing >=6 month words
            lines=page.extract_text_lines()
            for li,ln in enumerate(lines):
                ws=[w for w in ln['chars']]  # not used
            hdrs=[]
            for w in words:
                if mon(w['text']) =='jan':
                    hdrs.append(w['top'])
            for htop in sorted(set(round(h,0) for h in hdrs)):
                hw=[w for w in words if abs(w['top']-htop)<3 and mon(w['text'])]
                cols={}
                for w in hw:
                    m=mon(w['text'])
                    if m and m not in cols: cols[m]=(w['x0']+w['x1'])/2
                if len(cols)<8: continue
                label_x_max=min(w['x0'] for w in hw if mon(w['text']))-4
                # title = nearest title line above header
                above=[(htop-t,tt) for t,tt in titles if t<htop+2]
                if not above: continue
                tt=min(above)[1]
                info=parse_title(tt)
                if not info: 
                    log.append((pi+1,'notitle',tt)); continue
                # collect body region: from header bottom to next 'EQS' line or next Table title or page end
                nxt=[t for t,_ in titles if t>htop+5]
                ybottom=min(nxt) if nxt else page.height
                eqs=[w['top'] for w in words if w['text'].startswith('EQS') and w['top']>htop]
                eqs=[e for e in eqs if e<ybottom]
                if eqs: ybottom=min(eqs)
                body=[w for w in words if w['top']>htop+6 and w['bottom']<=ybottom+1]
                # row anchors from cell rects: use horizontal rule positions if available
                hl=sorted(set(round(l['top'],0) for l in page.lines if abs(l['top']-l['bottom'])<1 and l['top']>htop and l['top']<=ybottom+2))
                rects=[r for r in page.rects if r['top']>htop and r['bottom']<=ybottom+2 and r['x0']<label_x_max+20 and (r['x1']-r['x0'])>30]
                # build row bands from label-column rects
                bands=sorted({(round(r['top']),round(r['bottom'])) for r in rects if r['height']>6 and r['x0']<label_x_max})
                # merge overlapping
                merged=[]
                for a,b in bands:
                    if merged and a<merged[-1][1]-1: merged[-1]=(merged[-1][0],max(b,merged[-1][1]))
                    else: merged.append((a,b))
                if not merged:
                    # fallback: group by label words' lines
                    lab=[w for w in body if w['x1']<=label_x_max+2 and not NUM.match(w['text'])]
                    ys=sorted(set(round(w['top']) for w in lab))
                    merged=[(y-2,y+10) for y in ys]
                for (a,b) in merged:
                    rw=[w for w in body if w['top']>=a-1 and w['bottom']<=b+1]
                    if not rw: continue
                    label=' '.join(w['text'] for w in sorted(rw,key=lambda w:(round(w['top']/4),w['x0'])) if w['x1']<=label_x_max+2)
                    label=re.sub(r'\s+',' ',label).strip()
                    if not label or label.lower().startswith('eqs') or label.lower().startswith('location'): continue
                    vals={}
                    for w in rw:
                        if w['x0']<=label_x_max+2: continue
                        if not NUM.match(w['text']): continue
                        xc=(w['x0']+w['x1'])/2
                        m=min(cols,key=lambda k:abs(cols[k]-xc))
                        # column half-width tolerance
                        vals.setdefault(m,[]).append(w['text'])
                    for m,v in vals.items():
                        rows.append(dict(year=year,page=pi+1,body=info['body'],param=norm_param(info['param_raw']),
                                         station=label,month=MONTHS.index(m)+1,value=v[0],n_tokens=len(v),title=tt))
    return pd.DataFrame(rows), log

if __name__=='__main__':
    pdf,year,out=sys.argv[1],int(sys.argv[2]),sys.argv[3]
    df,log=extract(pdf,year)
    df.to_csv(out,index=False)
    print(year,len(df),'rows;',df['body'].nunique() if len(df) else 0,'bodies;',df['param'].nunique() if len(df) else 0,'params')
    print('log',log[:5])
