import json, re, math
S=json.load(open('locfind/all_sheets_text.json')); B=json.load(open('locfind/bubbles.json')); R=json.load(open('locfind/refs.json'))
G=json.load(open('/home/user/fish/03_GC500_Delivery_Control/satellite_explorer/explorer/assets/georeferencing.json'))
M=S['D001']
def in_inset(x,y):
    a=G['inset']['sheet_region_pts']; return a[0]<=x<=a[2] and a[1]<=y<=a[3]
def to_ll(x,y):
    T=G['inset' if in_inset(x,y) else 'main']['sheet_to_z18px']
    px=T[0][0]*x+T[0][1]*y+T[0][2]; py=T[1][0]*x+T[1][1]*y+T[1][2]
    n=2**18*512; lon=px/n*360-180; lat=math.degrees(math.atan(math.sinh(math.pi*(1-2*py/n)))); return round(lat,6),round(lon,6)
ctr=lambda b:((b[0]+b[2])/2,(b[1]+b[3])/2)
def inregion(x,y):
    a=G['main']['sheet_region_pts']; return a[0]<=x<=a[2] and a[1]<=y<=a[3]
# landmarks on the master
LM={'sector':[], 'gate':[], 'street':[], 'area':[], 'op':[]}
for x in M:
    t=x['t'].strip(); c=ctr(x['b'])
    if not inregion(*c): continue
    if re.fullmatch(r'S\d{2}( MCM)?',t): LM['sector'].append((t.split()[0],c))
    elif re.fullmatch(r'G ?\d{1,2}[AB]?a?',t) and x['sz']>13: LM['gate'].append(('Gate '+t.replace('G','').strip(),c))
    elif re.search(r'\b(PDE|HWY|DR|ST|AVE|BLVD|LN|CRT|CT|ESP)\b',t) and x['sz']>=5.5 and len(t)<30: LM['street'].append((t.title(),c))
    elif t in ('HELEN','COMMODORE','PARADISE WATERS','"THE HILL"','MACINTOSH ISLAND','PIT LANE','PHILLIP','CYPRESS AVE') or re.fullmatch(r'[A-Z ]*PARK[A-Z ]*',t) and x['sz']>=9: LM['area'].append((t.title().replace('"',''),c))
    elif re.fullmatch(r'OP\d{1,3}',t): LM['op'].append((t,c))
def near(kind,x,y,maxd):
    best=None
    for t,c in LM[kind]:
        d=math.hypot(c[0]-x,c[1]-y)
        if d<=maxd and (best is None or d<best[1]): best=(t,d)
    return best
PT=0.7056  # metres per sheet point at 1:2000
def words(x,y):
    out=[]
    for kind,md in (('street',80),('sector',140),('gate',110),('area',160)):
        n=near(kind,x,y,md)
        if n: out.append(f"{n[0]} (~{round(n[1]*PT/5)*5} m)")
    return out
# master small tags
def mtags(code):
    pat=re.compile(r'(?<![A-Z0-9])'+re.escape(code)+r'(?![0-9])')
    return [ctr(x['b']) for x in M if x['sz']<6 and pat.search(x['t'].upper())]
KINDCOL={'genset':[1.0,0.5,0.0],'lighting':[0.13,0.2,0.43],'tower':[0.66,0.33,0.63]}
res=[]
for r in R:
    k=r['k']; found=None
    t=mtags(k) if re.fullmatch(r'[A-Z]{1,4}\d{0,3}',k) else []
    if t:
        # prefer the main-plan copy when a tag appears in the main plan and the inset
        t2=[p for p in t if not in_inset(*p)] or t
        found={'how':'tag on the unit, master D001','pts':t2}
    else:
        for dl in r['dl']:
            sh=dl['s'][:4]; lab=dl['l']
            if sh not in B: continue
            cands=[b for b in B[sh] if (b['t']==lab or lab in b['t'].split()) and b['tips']]
            if sh=='D024' and k.startswith('LTC'):
                cands=[b for b in B[sh] if b['col']==KINDCOL['lighting'] and b['t']==('0'+lab) and b['tips']]
            elif sh=='D024' and k.startswith('GN'):
                cands=[b for b in cands if b['col']==KINDCOL['genset']]
            elif sh=='D024' and k.startswith('LT'):
                cands=[b for b in B[sh] if b['col']==KINDCOL['tower'] and b['t']==lab]
            if cands:
                found={'how':f'leader line from callout {lab} on {sh}','pts':[tp['tip'] for b in cands for tp in b['tips']]}
                break
            tl=[b for b in B.get(sh,[]) if b['t']==lab]
            if sh=='D024' and k.startswith('LT') and not k.startswith('LTC') and tl:
                found={'how':'listed in the storage-yard box on D024 (Molendinar), not on the circuit','pts':[]}; break
    row={'k':k,'name':r['name'],'item':r['item'],'first':r['first'],'pinned':r['fix'],'before':'drawing link (label)' if r['dl'] else 'none'}
    if found and found['pts']:
        x,y=found['pts'][0]
        row.update({'how':found['how'],'sheet_pt':[round(x,1),round(y,1)],'n_positions':len(found['pts']),'latlng':to_ll(x,y),'near':words(x,y),'inset':in_inset(x,y)})
        # neighbours: other master tags within 25 pt
        nb=[]
        for x2 in M:
            if x2['sz']<6 and re.fullmatch(r'(P|WC|BS|OP)\d{1,3}',x2['t'].strip()) and x2['t'].strip()!=k:
                c=ctr(x2['b']); d=math.hypot(c[0]-x,c[1]-y)
                if d<22: nb.append(x2['t'].strip())
        row['beside']=sorted(set(nb))[:6]
    elif found: row.update({'how':found['how']})
    res.append(row)
json.dump(res,open('locfind/resolved.json','w'),indent=0)
got=[x for x in res if 'latlng' in x]
print('resolved', len(got), 'of', len(res))
print('new (no link before):', [x['k'] for x in got if x['before']=='none'])
print('unresolved:', [x['k'] for x in res if 'latlng' not in x])
print('landmark counts', {k:len(v) for k,v in LM.items()})

# ---- second pass: a point read by eye, and area-only matches from each line's own place words ----
MANUAL={'GN04':((1581.0,577.4),'leader line from callout 004 on D024, read by eye (the tracer missed it)')}
AREA=[('T0258',(127,1202),'Helen Park label on the master'),('T0266',(127,1202),'Helen Park label on the master'),('WB04',(127,1202),'Helen Park label on the master'),
 ('T0005',(533,738),'Macintosh Island label on the master'),
 ('T0085',(1218,334),'SUPPLY compound label on the master (S.L.S equipment compound)'),
 ('T0024',(1250,334),'supply / equipment compound on the master — "Coates compound" read as this compound, confirm'),
 ('T0025',(1487,342),'sector S18 label on the master'),
 ('WB02',(734,381),'sector S08 label on the master'),('WB19',(734,381),'sector S08 label on the master'),
 ('WB13',(1592,541),'sector S15 label on the master'),('WB07',(1036,789),'Admiralty Dr label on the master'),
 ('WB03',(1527,537),'Turn 2 marker on the master'),('WB20',(1527,537),'Turn 2 marker on the master'),('WB18',(1527,537),'Turn 2 marker on the master'),
 ('WB14',(1780,414),'Turn 4 marker on the master'),('WB15',(206,463),'Turn 11 marker on the master'),('WB17',(830,345),'Turns 6–9 markers on the master (T6–T9 span ~250 m)'),
 ('WB16',(416,1175),'Commodore Park label on the master'),('T0265',(2129,1436),'OP42 label on the master'),
 ('PG01',(850,699),'Pit Lane label on the master — garage numbers are not printed'),('PG03',(850,699),'Pit Lane label on the master — garage numbers are not printed'),
 ('PG05',(850,699),'Pit Lane label on the master — garage numbers are not printed'),('PG29',(850,699),'Pit Lane label on the master — garage numbers are not printed')]
byk={x['k']:x for x in res}
for k,(pt,how) in MANUAL.items():
    x,y=pt; byk[k].update({'how':how,'sheet_pt':[x,y],'n_positions':1,'latlng':to_ll(x,y),'near':words(x,y),'inset':in_inset(x,y),'precision':'unit'})
for k,pt,how in AREA:
    if k in byk and 'latlng' not in byk[k]:
        x,y=pt; byk[k].update({'how':how,'sheet_pt':[x,y],'latlng':to_ll(x,y),'near':words(x,y),'inset':in_inset(x,y),'precision':'area only'})
for x in res:
    if 'latlng' in x and 'precision' not in x: x['precision']='unit'
json.dump(res,open('locfind/resolved.json','w'),indent=0)
print('unit-level', sum(1 for x in res if x.get('precision')=='unit'), 'area-only', sum(1 for x in res if x.get('precision')=='area only'), 'none', [x['k'] for x in res if 'latlng' not in x])

# ---- third pass: what is written beside it on the master (the nearest descriptive words within ~20 m) ----
SKIP=re.compile(r'^([oF+x\s]+|LP|FL|FH|FHY|RL|MP|E\.P|G|\d+(\.\d+)?m?|\d+x\d+m|[A-Z]{1,3}\d{1,3}[a-z]?|OP\d+.*|BS\d+|WC\d+.*|P\d+.*|EEP\d|A\d+|S\d+( MCM)?|T\d+|Clear|Span|Bay|\+|x)$')
desc=[(x['t'].strip(),ctr(x['b'])) for x in M if 3<=x['sz']<=7.5 and re.search(r'[A-Za-z]{3,}',x['t']) and not SKIP.match(x['t'].strip())]
for r in res:
    if r.get('precision')!='unit': continue
    x,y=r['sheet_pt']; ds=sorted(((math.hypot(c[0]-x,c[1]-y),t) for t,c in desc), key=lambda z:z[0])
    seen=[]; 
    for d,t in ds:
        if d>28: break
        if t.upper() not in [s.upper() for s in seen]: seen.append(t)
        if len(seen)>=3: break
    r['labelled_near']=seen
json.dump(res,open('locfind/resolved.json','w'),indent=0)
