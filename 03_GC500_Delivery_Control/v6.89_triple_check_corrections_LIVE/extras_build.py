"""v6.88 - what the other sheets draw, placed on the master (Andrew, 27 Sep 2026: "if they are on other sheets lets add to the master")"""
import json, re, math, hashlib, os, io
src=open('locfind/resolve.py').read(); exec(src[:src.index('KINDCOL=')])   # to_ll, in_inset, words, LM, M, B, ctr
W,H=2384.0,1684.0
def sec_of(x,y):
    n=near('sector',x,y,140); return n[0] if n else None
# ---- 1. the two buildings the master missed: P27 and P29, leader lines on D022 ----
ML=json.load(open('locfind/master_loc.json'))
SKIP=re.compile(r'^([oF+x\s]+|LP|FL|FH|FHY|RL|MP|E\.P|G|\d+(\.\d+)?m?|\d+x\d+m|[A-Z]{1,3}\d{1,3}[a-z]?|OP\d+.*|BS\d+|WC\d+.*|P\d+.*|EEP\d|A\d+|S\d+( MCM)?|T\d+|Clear|Span|Bay|\+|x)$')
desc=[(x['t'].strip(),ctr(x['b'])) for x in M if 3<=x['sz']<=7.5 and re.search(r'[A-Za-z]{3,}',x['t']) and not SKIP.match(x['t'].strip())]
def unit(k,lab,tip):
    x,y=tip
    nb=sorted(set(x2['t'].strip() for x2 in M if x2['sz']<6 and re.fullmatch(r'(P|WC|BS|OP)\d{1,3}',x2['t'].strip()) and x2['t'].strip()!=k and math.hypot(ctr(x2['b'])[0]-x,ctr(x2['b'])[1]-y)<22))[:6]
    seen=[]
    for d,t in sorted(((math.hypot(c[0]-x,c[1]-y),t) for t,c in desc), key=lambda z:z[0]):
        if d>28 or len(seen)>=3: break
        if t.upper() not in [s.upper() for s in seen]: seen.append(t)
    return {'ll':list(to_ll(x,y)),'how':f'leader line from callout {lab} on D022','near':words(x,y),'next':seen,'beside':nb,'prec':'unit','pt':[round(x/W,5),round(y/H,5)],'sec':sec_of(x,y),'_xy':[x,y]}
BB={b['t']:b for b in B['D022']}
# the master (rev 03) tags them in the block "P34/24/26/27/28/29"; D022 (rev 02) drew their arrows ~20 m west, beside T&S.
# The master is the newer drawing, so the block tag it is.
TAG=(683.2,812.2)
add={}
for k,lab in (('P27','027'),('P29','029')):
    u=unit(k,lab,TAG); u['how']='the block tag P34/24/26/27/28/29 on the master D001 (D022 rev 02 drew callout '+lab+' about 20 m west, beside T&S)'; add[k]=u
# ---- 2. layers: places the other sheets draw that are not units on our schedule ----
L=[]
def put(layer,label,face,x,y,src,note):
    lat,lon=to_ll(x,y); L.append({'layer':layer,'label':label,'face':face,'fx':round(x/W,5),'fy':round(y/H,5),'ll':[lat,lon],'src':src,'note':note})
d1=json.load(open('locfind/extras.json'))['D001']
for k,lab,fx,fy,_,_,ctx in d1:
    x,y=fx*W,fy*H
    if k in ('gate_approach','gate_on_fence'):
        put('gate','Gate '+lab,lab,x,y,'D001-26003-03','Gate '+lab+(' — on the fence line' if k=='gate_on_fence' else ' — the approach')+(' (Cypress car park inset)' if ctx=='Cypress inset' else '')+', as the master draws it.')
    elif k=='entry_point':
        put('ep','Entry point',"EP",x,y,'D001-26003-03','Pedestrian entry point (E.P) drawn on the master.')
import pymupdf as _pm
_MW=_pm.open('gc500_v2/sources/drawings_26003/D001-26003-03-MASTER.pdf')[0].get_text('words')
BST={}
for w in _MW:
    mm=re.fullmatch(r'BS(\d{2})',w[4])
    if mm: BST.setdefault(mm.group(1),((w[0]+w[2])/2,(w[1]+w[3])/2))
for b in B['D024']:
    if b['col']==[0.13,0.2,0.43] and b['tips']:
        n=b['t'][-2:]
        if n in BST: x,y=BST[n]; how='the tag BS'+n+' printed on the screen on the master'
        else: x,y=b['tips'][0]['tip']; how='no BS'+n+' tag on the master or D024, so the leader line from callout '+b['t']+' on D024 followed to its arrow'
        put('screen','Big screen BS'+n,'BS'+n,x,y,'D001-26003-03 / D024-26003-02','Big screen BS'+n+' (2.88 sqm outdoor screen): '+how+'.')
    if b['col']==[0.18,0.72,0.0] and b['tips'] and b['t'] in ('EE','TV'):
        x,y=b['tips'][0]['tip']
        who='Eventelec — direct hire' if b['t']=='EE' else 'SC Television — self supply'
        put('gens',b['t']+' genset',b['t'],x,y,'D024-26003-02','Generator drawn on D024 as '+b['t']+': '+who+'. Not one of ours.')
IF={'EVL':'Eventelec','GEM':'Gema Catering','TAL':'Broadcast (TAL)','COO':'Coolroom','ONT':'Ontrac','VIZ':'Broadcast (VIZ)','AUD':'Broadcast (AUD)','HTH':'Harry the Hirer'}
for b in B['D022']:
    if b['t'] in IF and b['tips']:
        x,y=b['tips'][0]['tip']; put('iface',b['t']+' · '+IF[b['t']],b['t'],x,y,'D022-26003-02',IF[b['t']]+' — an interface area D022 marks "not in BOQ". Not ours to supply.')
NS=[('WC18',(223,622),'D001-26003-03','Toilet WC18: tagged on the master and called out on D023; no row on our schedule carries it.'),
 ('WC-BSF',(151,1138),'D001-26003-03','Toilet WC-BSF (D023 calls it WCBS): tagged on the master; no row on our schedule carries it.'),
 ('P24',(686,815),'D001-26003-03','Building P24: in the master block tag "P34/24/26/27/28/29" (D022 callout 024 points to the same block); no row on our schedule carries it.'),
 ('P50',(146.4,1119.9),'D022-26003-02','Building P50: D022 callout 050, leader line followed to its arrow; no row on our schedule carries it.'),
 ('P61',(2143.5,249.2),'D022-26003-02','Building P61: D022 callout 061, leader line followed to its arrow; no row on our schedule carries it.'),
 ('CHL',(477.4,969.5),'D022-26003-02','CHL: D022 callout CHL (the master prints CHL on the same units); the drawings do not say what CHL is, and no row on our schedule carries it.'),
 ('P68',(2162,1263),'D001-26003-03','Building P68: tagged on the master (Cypress Ave car park inset) and called out on D016; no row on our schedule carries it.')]
for lab,(x,y),src,note in NS: put('wcx',lab,lab[:6],x,y,src,note)
# ---- 3. water barriers: the runs on the zone pages K221-K231, each page registered onto the master ----
runs=json.load(open('locfind/kruns.json')); ZL={}
import pymupdf
dd=pymupdf.open('gc500_v2/sources/drawings_26003/K220-K231-26003-02 COMBINED WFB.pdf')
for pg in range(1,12):
    ls=[]
    for b in dd[pg].get_text('dict')['blocks']:
        t=' '.join(' '.join(sp['text'] for sp in l['spans']).strip() for l in b.get('lines',[])).strip()
        if re.search(r'WFB|BARRIER|MERIDIAN|RAPID|MOVED|MONDAY',t) and b['bbox'][3]<1450: ls.append(re.sub(r'\s+',' ',t))
    ZL[pg]=ls
seen=[]; off=[]
for r in runs:
    if r['pg']==0: continue
    x,y=r['c']
    if any(s[0]==r['pg'] and s[1]==r['kind'] and math.hypot(s[2]-x,s[3]-y)<4 for s in seen): continue
    seen.append((r['pg'],r['kind'],x,y))
    kind='traffic management barriers' if r['kind']=='tm' else 'hostile vehicle mitigation (HVM)'
    note='Zone %d, drawing %s: %s, about %d m of run. The page lists: %s.'%(r['pg'],r['sheet'],kind,round(r['len_pt']*0.7056),'; '.join(ZL[r['pg']]) or 'no count')
    if not (0<=x<=W and 0<=y<=H): off.append({'sheet':r['sheet'],'kind':kind,'ll':list(to_ll(x,y)),'note':note}); continue
    put('wb','Barriers · Zone %d'%r['pg'],'Z%d'%r['pg'],x,y,r['sheet'],note)
# WC69: the master tags it twice; D023's own callout and zone page K228 both put it at the second tag
wctv=[b for b in B['D023'] if b['t']=='WCTV'][0]['tips'][0]['tip']
add['T0243']=unit('T0243','WCTV',wctv); add['T0243']['how']='leader line from callout WCTV on D023 (the schedule names T0243 "Toilet Block 6m · WC-TV"); the master prints WC on the same block'
json.dump({'units':add,'layers':L,'off_sheet':off},open('locfind/master_extra.json','w'),indent=0)
from collections import Counter
print('units',{k:(v['pt'],v['sec'],v['next'],v['beside']) for k,v in add.items()})
print('layers',Counter(l['layer'] for l in L)); print('off sheet',[(o['sheet'],o['ll']) for o in off])
