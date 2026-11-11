import pandas as pd, numpy as np, re
bl=pd.read_pickle('bl.pkl'); ss=pd.read_pickle('ss.pkl'); st=pd.read_pickle('st.pkl')

from tidy import clean, key
def famfix(f):
    f=re.sub(r'\s+',' ',str(f)).strip()
    return 'Coates Equipment' if f.lower() in ('customer equipment','coates equipment') else f
W0,W1=pd.Timestamp('2024-01-01'),pd.Timestamp('2024-07-28')   # steady window, Mon..Sun
WEEKS=((W1-W0).days+1)/7
# ---------- crew baseline
s=ss[ss.SALES_DATE!=''].copy(); s['d']=pd.to_datetime(s.SALES_DATE,format='%d/%m/%Y')
s['q']=pd.to_numeric(s.SALES_QUANTITY)-pd.to_numeric(s.RETURN_QUANTITY)
r=bl[bl.PRODUCT_CATEGORY=='Rental'].copy()
r['s']=pd.to_datetime(r.TRAN_START_DATE,format='%d/%m/%Y'); r['e']=pd.to_datetime(r.TRAN_END_DATE,format='%d/%m/%Y')
a=pd.concat([s[['d','HIRER']].rename(columns={'HIRER':'h'}),r[['s','HIRER_NAME']].rename(columns={'s':'d','HIRER_NAME':'h'})])
a=a[a.h.str.strip()!='']
wk=a.groupby(a.d.dt.to_period('W')).h.nunique()
crew=wk[(wk.index.start_time>=W0)&(wk.index.end_time<=W1+pd.Timedelta(days=1))]
CALLIDE_CREW=int(round(crew.median()))
weekly=pd.DataFrame({'Week starting':[p.start_time for p in wk.index],'People active (bought or hired)':wk.values})
# ---------- consumables
def cat(d):
    d=d.lower()
    R=[('Drilling & driver bits','driver bit|torsion|bit holder'),('Welding & cutting','flint|lighter|electrode|weld|gouging'),('Gloves','glove|nitrile'),('Height safety & tool tethering','harness|srl|nano-?lok|scaffold hook|tool lanyard|tool catch|tool holder|tether|lanyard|anchor strap'),('Lifting, rope & tarps','sling|shackle|ratchet strap|tie down|safety chain|rigging|rope|tarpaulin|brick line|bollard|barrier|bunting'),
       ('Purchased tools & equipment','spirit|\\bratchet \\d|sq dr|clamp xl|bar clamp|ladder|combo kit|torque ?wrench|\\bnm\\b|blow gun|chicago air|extension bar|lead stand|apron|\\bskin\\b|tool only|bare|table saw|saw table|mitre saw|saw mitre|compound|dumpy|tripod|threading machine|wagon|platform truck|lifting cage|safety gate|stand set|bundle|charger|angle finder|speedglas adflo 9100|impact (driver|wrench)|hammer drill|circular saw|sawzall|grease gun|caulking gun|gazebo|umbrella|wind region|wrench|\\blevel|square|plier|nipper|multi grips|thermometer|laser|\\bscale\\b|puller|mower|blower|post driver|crimper|trowel|feeler|penlight|chaps|cutter steel'),
       ('Project materials','pine|timber|framing|ply\\b|plywood|fence post|picket|hardwood|decking|batten|roofing|composite panel|form oil|mortar|strapping punched|brace strapping'),
       ('Height safety & tool tethering','harness|srl|nano-?lok|scaffold hook|tool lanyard|tool catch|tool holder|tether|lanyard|anchor strap'),
       ('Fire & emergency','fire ext|fire blanket|air horn|first aid|band.?aid|plaster|bandage|eye wash|burn'),
       ('Lifting, rope & tarps','sling|shackle|ratchet strap|tie down|safety chain|rigging|rope|tarpaulin|brick line|bollard|barrier|bunting'),
       ('Welding & cutting','weld|gauntlet|arc ?guard|arc safe|electrode|gouging|flint|lighter|cutting nozzle|oxygen|tip cleaner'),
       ('Torches & lighting','torch|headlamp|lamp head|\\blamp'),
       ('Gloves','glove|nitrile'),('Eye protection','glass|spec|goggle|lens|visor|face shield'),('Hearing protection','ear ?plug|earmuff|ear muff'),
       ('Head protection','hard ?hat|sweatband|helmet|chin strap|brim'),
       ('Respiratory protection','respir|mask|p2|filter|cartridge|dust guard'),
       ('Sun, heat & hydration','sunscreen|suncreen|sunblock|cooling|sqwincher|electrolyte|hydrat|zooper|ice|towel|repellent|aeroguard'),
       ('Batteries','batter'),
       ('Abrasives & cutting discs','disc|c/wheel|wheel|flap|cut.?off|blade|grind|sanding|wire brush|hacksaw|backing pad|mop|bevel brush|end brush|twist knot'),
       ('Drilling & driver bits','drill|bit\\b|bits|hole ?saw|annular|core|chisel|sds|arbor|jobber|countersink|tap\\b|taps|die\\b'),
       ('Fixings & fasteners','screw|bolt|nut|washer|rivet|anchor|tek|nail|shim|buckle|cable tie|zip tie|tie cable|clip|pin\\b|wedge'),
       ('Chemicals, adhesives & sealants','acetone|thinner|cutting fluid|tape|silicon|sealant|glue|adhesive|loctite|lubric|wd-?40|spray|grease|epoxy|araldite|anti seize|soft seal|oil|degreas|solvent|crc|rtv'),
       ('Paint & brushes','paint(?! marker)|enamel|primer|brush|roller|zinc'),
       ('Marking & stationery','marker|pen\\b|pens|pencil|paper|note|sharpie|crayon|chalk|clipboard|folder|envelope|stapl|toner|ink|ruler|label'),
       ('Lockout & tags','padlock|lock|tag|hasp'),
       ('Cleaning & hygiene','wipe|rag|bag|bin|soap|hand|tissue|toilet|clean|detergent|sanitis|disinfect|broom|dustpan|bucket|pail|scour|dishwash|glen ?20'),
       ('Crib & amenities','kettle|cooler|tub\\b|jerry|fly|fan\\b|fan |duct|tray|flag|fork|spoon|knife|cup|plate|coffee|tea\\b|sugar|milk|water|straw|jug|food container|container'),
       ('Clothing & hi-vis','shirt|vest|jacket|pant|sock|beanie|scarf|hi.?vis|boot|overall|coverall|poncho|rainsuit|knee pad|cap\\b'),
       ('Plumbing, hose & fittings','rubber|tube|hemp|coupl|elbow|adaptor|poly|gauge|hose|fitting|barb|valve|bspt|bspp|npt|swage|gyprock|mesh'),
       ('Hand tools & accessories','file\\b|drift|tensioner|band-?it|snip|knife|blade holder|scraper|pliers|spanner|hammer|tool')]
    for n,p in R:
        if re.search(p,d): return n
    return 'General store items'
s['SKU_DESCRIPTION']=s.SKU_DESCRIPTION.map(clean)
s['CK']=s.SKU_DESCRIPTION.map(key)
g=s.groupby('CK')
con=pd.DataFrame({'Description':g.SKU_DESCRIPTION.agg(lambda x:x.value_counts().index[0]),
 'Total issued (whole job)':g.q.sum(),'Times issued':g.size(),'People issued to':g.HIRER.nunique(),
 'First issued':g.d.min(),'Last issued':g.d.max(),'Biggest single issue':g.q.max()})
win=s[(s.d>=W0)&(s.d<=W1)].groupby('CK').q.sum()
con['Issued in steady window']=win.reindex(con.index).fillna(0)
con['Callide per week']=(con['Issued in steady window']/WEEKS).round(2)
ss['CK']=ss.SKU_DESCRIPTION.map(key)
shelf=ss[ss.SALES_DATE==''].groupby('CK').AVAILABLE_QUANTITY.apply(lambda x:pd.to_numeric(x).sum())
con['Left on shelf at end']=shelf.reindex(con.index).fillna(0)
con['Group']=con.Description.map(cat)
def flag(x):
    f=[]
    if x['Biggest single issue']>=200 and x['Biggest single issue']>=0.5*x['Total issued (whole job)']: f.append('One-off project purchase')
    if x['Issued in steady window']==0: f.append('Early or late project use only')
    elif x['Times issued']<5: f.append('Low use - supply on request')
    return '; '.join(f)
con['Note']=con.apply(flag,axis=1)
ONEOFF={'Purchased tools & equipment','Project materials'}
con.loc[con.Note.str.contains('One-off')&~con.Group.isin(ONEOFF),'Group']='Project materials'
con.loc[con.Group.isin(ONEOFF),'Note']=''
con=con[con['Total issued (whole job)']>0].reset_index().rename(columns={'CK':'SKU'})
con=con.sort_values(['Group','Callide per week'],ascending=[True,False])
# ---------- tooling
r['ITEM']=r['SKU/ITEM_NUMBER']; r['DESC']=r['SKU/ITEM DESCRIPTION'].map(clean)
r['K']=r.DESC.map(key)
iv=r.groupby(['TRANSACTION_ID','ITEM']).agg(s=('s','min'),e=('e','max'),DESC=('DESC','first'),K=('K','first'),FAM=('PRODUCT_FAMILY','first'),PROD=('PRODUCT','first'),h=('HIRER_NAME','first')).reset_index()
days=pd.date_range(W0,W1)
rows=[]
for d,grp in iv.groupby('K'):
    cnt=np.zeros(len(days),dtype=int)
    for it,gi in grp.groupby('ITEM'):
        m=np.zeros(len(days),dtype=bool)
        for a_,b_ in zip(gi.s.values,gi.e.values): m|=(days.values>=a_)&(days.values<=b_)
        cnt+=m
    inwin=grp[(grp.s<=W1)&(grp.e>=W0)]
    rows.append(dict(DESC=grp.DESC.value_counts().index[0],FAM=grp.FAM.iloc[0].strip(),PROD=grp.PROD.iloc[0].strip(),
      items_hired=grp.ITEM.nunique(),hires=len(grp),people=grp.h.nunique(),
      peak=int(cnt.max()),avg=round(cnt.mean(),1),items_win=inwin.ITEM.nunique()))
too=pd.DataFrame(rows)
too['k']=too.DESC.map(key)
sr=st[st.PRODUCT_CATEGORY=='Rental'].copy()
sr['ls']=pd.to_datetime(sr.LAST_SIGHTED_DATE_TIME.str[:10],format='%d/%m/%Y',errors='coerce')
GONE_EARLY=int(((sr.LAST_SIGHTED_ACTION=='Departure')&(sr.ls<=W1)).sum())
sr=sr[~((sr.LAST_SIGHTED_ACTION=='Departure')&(sr.ls<=W1))]; sr['k']=sr.DESCRIPTION.map(key); sr['DESCRIPTION']=sr.DESCRIPTION.map(clean)
sr['own']=np.where(sr.OWNER.str.upper()=='COATES','Coates','Customer')
fl=sr.groupby('k').agg(DESC2=('DESCRIPTION',lambda x:x.str.strip().iloc[0]),FAM2=('PRODUCT_FAMILY',lambda x:x.str.strip().iloc[0]),PROD2=('PRODUCT',lambda x:x.str.strip().iloc[0]),
   fleet=('SKU_NUMBER','size'),coates=('own',lambda x:(x=='Coates').sum()),cust=('own',lambda x:(x=='Customer').sum()),
   unit=('STORAGE_UNIT',lambda x:x.value_counts().index[0]),stk_out=('SIGHTED_STATUS',lambda x:(x=='On Hire').sum())).reset_index()
T=too.merge(fl,on='k',how='outer')
T['DESC']=T.DESC.fillna(T.DESC2); T['FAM']=T.FAM.fillna(T.FAM2); T['PROD']=T.PROD.fillna(T.PROD2)
for c in ['items_hired','hires','people','peak','avg','items_win','fleet','coates','cust']: T[c]=T[c].fillna(0)
T['unit']=T.unit.fillna('')
rs=pd.read_pickle('rs.pkl'); rs['k']=rs.ITEM_DESCRIPTION.map(key); rs['ITEM_DESCRIPTION']=rs.ITEM_DESCRIPTION.map(clean)
rg=rs.groupby('k').agg(DESC3=('ITEM_DESCRIPTION',lambda x:x.str.strip().iloc[0]),FAM3=('PRODUCT_FAMILY',lambda x:x.str.strip().iloc[0]),PROD3=('PRODUCT',lambda x:x.str.strip().iloc[0]),
  rs_fleet=('ITEM_NUMBER','size'),rs_out=('ITEM_STATUS',lambda x:(x=='On Hire').sum()),rs_cust=('OWNER',lambda x:(x.str.upper()=='UNITED GROUP INFRASTRUCTURE').sum())).reset_index()
T=T.merge(rg,on='k',how='outer')
T['DESC']=T.DESC.fillna(T.DESC3); T['FAM']=T.FAM.fillna(T.FAM3); T['PROD']=T.PROD.fillna(T.PROD3)
for c in ['items_hired','hires','people','peak','avg','items_win','fleet','coates','cust','rs_fleet','rs_out','rs_cust','stk_out']: T[c]=T[c].fillna(0)
T['cust']=T[['cust','rs_cust']].max(axis=1)
T['coates']=T[['coates']].max(axis=1)+np.where((T.fleet==0)&(T.rs_fleet>T.rs_cust),T.rs_fleet-T.rs_cust,0)
def owner(x):
    if x.cust>0 and x.coates==0: return 'Customer owned (UGL)'
    if x.cust>0: return 'Mixed'
    return 'Coates hire'
T['Owner']='Coates'
T['FAM']=T.FAM.map(famfix); T['PROD']=T.PROD.map(famfix)
PLANT=r'forklift|telehandler|boom|scissor|knuckle|generator|compressor|crane|truck|ute|loader|excavator|ewp|lift \d|light tower|lighting tower|site office|toilet|crib|container|pump'
def tflag(x):
    f=[]
    if re.search(PLANT,x.DESC.lower()): f.append('Plant / mobile equipment - size from Tarong scope, not headcount')
    if x.hires>0 and x.items_win==0: f.append('Early or late project use only')
    return '; '.join(f)
T['Note']=T.apply(tflag,axis=1)
T['store_fleet']=T[['fleet','rs_fleet']].max(axis=1)
T['basis']=np.where(T.peak>0,T.peak,np.maximum(T.store_fleet,((T.hires>0)|(T.rs_out>0)|(T.stk_out>0)).astype(int)))
T['used']=(T.hires>0)|(T.rs_out>0)|(T.stk_out>0)
NOT_USED=int((~T.used).sum()); T=T[T.used]
T=T.sort_values(['FAM','PROD','DESC'])
# store set-up
st['STORAGE_UNIT']=st.STORAGE_UNIT.replace({'Customer Owned Equipment':'Equipment Container 1','Customer Owned Equipment 2':'Equipment Container 2','Temp':'Temporary storage'})
units=st[st.STORAGE_UNIT.str.strip()!=''].groupby('STORAGE_UNIT').agg(lines=('SKU_NUMBER','size'),rental=('PRODUCT_CATEGORY',lambda x:(x=='Rental').sum()),cons=('PRODUCT_CATEGORY',lambda x:(x=='Consumable').sum())).reset_index().sort_values('lines',ascending=False)
# project stats
cnt=np.zeros(len(days),dtype=int)
for it,gi in iv.groupby('ITEM'):
    m=np.zeros(len(days),dtype=bool)
    for a_,b_ in zip(gi.s.values,gi.e.values): m|=(days.values>=a_)&(days.values<=b_)
    cnt+=m
stats=dict(people=int(a.h.nunique()),units_issued=int(s.q.sum()),issues=int(len(s)),cons_lines=int(len(con)),
  tool_lines=int(len(T)),tool_hires=int(len(iv)),tools_hired=int(iv.ITEM.nunique()),peak_tools=int(cnt.max()),avg_tools=int(round(cnt.mean())),
  peak_week=int(wk.max()),store_items=int(T.store_fleet.sum()),containers=int(units.shape[0]),NOT_USED=NOT_USED)
pd.to_pickle(dict(stats=stats,GONE_EARLY=GONE_EARLY,con=con,T=T,weekly=weekly,crew=crew,CALLIDE_CREW=CALLIDE_CREW,WEEKS=WEEKS,W0=W0,W1=W1,units=units,
  span=(s.d.min(),s.d.max())),'out.pkl')
print(CALLIDE_CREW,WEEKS,len(con),len(T)); print(con.Group.value_counts()); print(T.Owner.value_counts()); print((T.Note!='').sum())
print(con[con.Note.str.contains('Bulk')][['Description','Total issued (whole job)']].head(30).to_string())
print(T.sort_values('peak',ascending=False)[['DESC','fleet','items_hired','peak','avg']].head(25).to_string())
