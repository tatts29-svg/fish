import pickle, json, math, numpy as np
doors=pickle.load(open('/dev/shm/dc_doors.pkl','rb'))
J=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'))
comps=[]
for ref,v in J['refs'].items():
    s=v.get('shape')
    if not s: continue
    for ci,c in enumerate(s['components']):
        comps.append((ref,ci,c))
def segdist(p,a,b):
    ax,ay=b[0]-a[0],b[1]-a[1]; L2=ax*ax+ay*ay
    t=((p[0]-a[0])*ax+(p[1]-a[1])*ay)/L2
    tc=max(0,min(1,t))
    return math.hypot(p[0]-a[0]-tc*ax,p[1]-a[1]-tc*ay),t
def pip(p,poly):
    x,y=p;ins=False
    for i in range(len(poly)):
        x1,y1=poly[i];x2,y2=poly[(i+1)%len(poly)]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: ins=not ins
    return ins
assign=[]
for k,dr in enumerate(doors):
    O,Cl=dr['hinge'],dr['closed_end']
    hits=[]
    for ref,ci,c in comps:
        P=c['poly_pt']
        xs=[p[0] for p in P]; ys=[p[1] for p in P]
        if not (min(xs)-3<O[0]<max(xs)+3 and min(ys)-3<O[1]<max(ys)+3): continue
        for ei in range(len(P)):
            a,b=P[ei],P[(ei+1)%len(P)]
            dh,th=segdist(O,a,b); dc,tcl=segdist(Cl,a,b)
            if dh<0.25 and dc<0.25:
                hits.append((dh+dc,ref,ci,ei,th,tcl))
    hits.sort()
    assign.append(hits)
pickle.dump(assign,open('/dev/shm/dc_assign.pkl','wb'))
from collections import Counter
print('doors with a component', sum(1 for h in assign if h), 'multi', sum(1 for h in assign if len(h)>1))
byc=Counter((h[0][1],h[0][2]) for h in assign if h)
v915=Counter()
for ref,ci,c in comps:
    if c.get('doors'): v915[(ref,ci)]=len(c['doors'])
print('v915 comps with doors',len(v915),sum(v915.values()))
print('mine comps',len(byc),sum(byc.values()))
for key in sorted(set(byc)|set(v915)):
    if byc[key]!=v915[key]: print('COUNT DIFF',key,'mine',byc[key],'v915',v915[key])
# radius of assigned
print(Counter(round(doors[k]['radius_pt'],1) for k,h in enumerate(assign) if h))
