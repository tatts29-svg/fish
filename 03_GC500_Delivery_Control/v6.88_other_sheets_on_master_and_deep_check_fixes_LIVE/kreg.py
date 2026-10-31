import json,re,math,itertools
S=json.load(open('locfind/all_sheets_text.json'))
M=S['D001']; K=S['K220-K231']
ctr=lambda b:((b[0]+b[2])/2,(b[1]+b[3])/2)
pat=re.compile(r"^(?!26003|TITLE|LEGEND|PROJECT|CLIENT|REVISION|DESIGNER|REVIEWER|APPROVER|Key Plan|K2|C\.Hendry|M\.Kol|L\.Daley|NOT TO|Water|Zone|Traffic|Hostile|COPYRIGHT|DWG)[A-Z0-9][A-Za-z0-9 ./#-]{1,30}$")
from collections import defaultdict
mt=defaultdict(list)
for x in M:
  t=x['t'].strip()
  if pat.match(t): mt[t].append(ctr(x['b']))
res={}
for pg in range(12):
  kt=defaultdict(list)
  for x in K:
    if x['pg']!=pg: continue
    t=x['t'].strip()
    if pat.match(t) and ctr(x['b'])[1]<1450: kt[t].append(ctr(x['b']))
  pairs=[(t,kt[t][0],mt[t][0]) for t in kt if len(kt[t])==1 and len(mt[t])==1]
  best=None
  for a,b in itertools.combinations(pairs,2):
    dk=math.dist(a[1],b[1]); dm=math.dist(a[2],b[2])
    if dk<50: continue
    s=dm/dk
    # rotation check
    ang=math.atan2(b[2][1]-a[2][1],b[2][0]-a[2][0])-math.atan2(b[1][1]-a[1][1],b[1][0]-a[1][0])
    ang=(ang+math.pi)%(2*math.pi)-math.pi
    if abs(ang)>0.05: continue
    tx=a[2][0]-s*a[1][0]; ty=a[2][1]-s*a[1][1]
    inl=[p for p in pairs if math.dist((s*p[1][0]+tx,s*p[1][1]+ty),p[2])<6]
    if best is None or len(inl)>len(best[3]): best=(s,tx,ty,inl)
  if best and len(best[3])>=3:
    inl=best[3]; n=len(inl)
    # least squares s,tx,ty
    mkx=sum(p[1][0] for p in inl)/n; mky=sum(p[1][1] for p in inl)/n; mmx=sum(p[2][0] for p in inl)/n; mmy=sum(p[2][1] for p in inl)/n
    num=sum((p[1][0]-mkx)*(p[2][0]-mmx)+(p[1][1]-mky)*(p[2][1]-mmy) for p in inl); den=sum((p[1][0]-mkx)**2+(p[1][1]-mky)**2 for p in inl)
    s=num/den; tx=mmx-s*mkx; ty=mmy-s*mky
    r=[math.dist((s*p[1][0]+tx,s*p[1][1]+ty),p[2]) for p in inl]
    res[pg]={'s':s,'tx':tx,'ty':ty,'n':n,'tags':[p[0] for p in inl],'rms':math.sqrt(sum(x*x for x in r)/n),'max':max(r)}
    print(pg,'K%d'%(220+pg),'pairs',len(pairs),'inliers',n,'s=%.4f'%s,'rms %.2f max %.2f pt'%(res[pg]['rms'],res[pg]['max']),res[pg]['tags'][:12])
  else: print(pg,'K%d'%(220+pg),'pairs',len(pairs),'no fit',[p[0] for p in pairs])
json.dump(res,open('locfind/kreg.json','w'))
