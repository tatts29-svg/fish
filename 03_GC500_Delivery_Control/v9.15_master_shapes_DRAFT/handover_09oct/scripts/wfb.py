import sys,math,collections,json;sys.path.insert(0,'/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/shapes_all')
from load import load
L=load()
MPP=0.705556
def upts(d):
    U=[]
    for k,ps in d['items']:
        for p in ps:
            q=(round(p[0],3),round(p[1],3))
            if q not in U: U.append(q)
    return U
def seginfo(d):
    U=upts(d)
    if len(U)!=4: return None
    # rectangle edges: sort by angle around centroid
    cx=sum(p[0] for p in U)/4; cy=sum(p[1] for p in U)/4
    U.sort(key=lambda p:math.atan2(p[1]-cy,p[0]-cx))
    e=[math.dist(U[i],U[(i+1)%4]) for i in range(4)]
    return dict(c=(cx,cy),long=max(e),short=min(e),poly=U)
segs=[]
for d in L:
    if d['rect'][1]>1475 and d['rect'][0]<1300: continue  # legend
    if d['fill'] in ('#ffbf00','#fafafa') and d['type'] in ('f','fs'):
        s=seginfo(d)
        if s and s['short']<4.5 and s['long']<8 and s['long']>1.0 and s['short']>0.3 and s['long']/s['short']>0.4:
            s.update(i=d['i'],col=d['fill']); segs.append(s)
Y=[s for s in segs if s['col']=='#ffbf00']
W=[s for s in segs if s['col']=='#fafafa']
