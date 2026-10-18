import pymupdf, json, math, re
d=pymupdf.open('gc500_v2/sources/drawings_26003/K220-K231-26003-02 COMBINED WFB.pdf')
REG={int(k):v for k,v in json.load(open('locfind/kreg.json')).items()}
# the four pages with too few shared words: one word each, scale from its font size (checked against a second word)
def one(kb,ksz,mb,msz): s=msz/ksz; return {'s':s,'tx':mb[0]-s*kb[0],'ty':mb[1]-s*kb[1],'n':2,'tags':['manual']}
REG[3]=one([203,104],80.64,[1996,375],6.07)       # CONS SITE, checked on G4
REG[4]=one([1986,1271],80.07,[1849,1018],6.07)    # BEACHPOINT, checked on FOCUS and 5A
REG[5]=one([94,1018],49.39,[2155,718],7.08)       # NORFOLK AVE, checked on PINE AVE
REG[10]=one([426,894],41.77,[1518,578],3.51)      # 70 70, checked on T2 and T3
COL={(0.97,0.6,0.12):'tm',(0.15,0.46,0.73):'hvm'}
out=[]
for pg in range(12):
  p=d[pg]; R=REG[pg]; s,tx,ty=R['s'],R['tx'],R['ty']
  T=lambda x,y:(s*x+tx,s*y+ty)
  labs=[]
  for b in p.get_text('dict')['blocks']:
    for l in b.get('lines',[]):
      t=' '.join(sp['text'] for sp in l['spans']).strip(); bb=l['bbox']
      if re.search(r'WFB|BARRIERS|MERIDIAN|RAPID GATE|MOVED|MONDAY',t) and bb[3]<1450: labs.append((t,((bb[0]+bb[2])/2,(bb[1]+bb[3])/2)))
  for x in p.get_drawings():
    f=x.get('fill'); 
    if not f or x['rect'].y1>1450: continue
    k=COL.get(tuple(round(v,2) for v in f))
    if not k: continue
    r=x['rect']; pts=[]
    for it in x['items']:
      for q in it[1:]:
        if hasattr(q,'x'): pts.append((q.x,q.y))
        elif hasattr(q,'x0'): pts+= [(q.x0,q.y0),(q.x1,q.y1)]
    c=((r.x0+r.x1)/2,(r.y0+r.y1)/2)
    # the run's two far ends
    best=(0,None,None)
    for i in range(len(pts)):
      for j in range(i+1,len(pts)):
        dd=math.dist(pts[i],pts[j])
        if dd>best[0]: best=(dd,pts[i],pts[j])
    near=sorted(labs,key=lambda L:math.dist(L[1],c))
    out.append({'pg':pg,'sheet':'K%d'%(220+pg),'kind':k,'c':T(*c),'a':T(*best[1]) if best[1] else None,'b':T(*best[2]) if best[2] else None,
      'len_pt':best[0]*s,'lab':near[0][0] if near else None,'labd':math.dist(near[0][1],c)*s if near else None})
json.dump(out,open('locfind/kruns.json','w'))
for o in out: print(o['sheet'],o['kind'],[round(v) for v in o['c']],'len %.0f pt (%.0f m)'%(o['len_pt'],o['len_pt']*0.7056),o['lab'],o['labd'] and round(o['labd']))
