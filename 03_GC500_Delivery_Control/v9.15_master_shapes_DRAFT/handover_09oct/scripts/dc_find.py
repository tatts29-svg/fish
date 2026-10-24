# Independent door-swing census on D001-26003-03 (2 Oct master). Does not use ../shapes/ code.
import pickle, math, numpy as np, json
from collections import defaultdict
D=pickle.load(open('/dev/shm/dc_drawings.pkl','rb'))
def V(a,b): return (b[0]-a[0],b[1]-a[1])
def L(v): return math.hypot(*v)
segs=[]  # x1,y1,x2,y2,drawing
for d in D:
    if 's' not in (d['type'] or ''): continue
    for it in d['items']:
        if it[0]=='l': segs.append((*it[1],*it[2],d['i']))
        elif it[0]=='qu':
            q=it[1]
            for k in range(4): segs.append((*q[k],*q[(k+1)%4],d['i']))
S=np.array(segs)
print('segments',len(S))
# endpoint grid for short segments (leaf candidates)
grid=defaultdict(list)
lens=np.hypot(S[:,2]-S[:,0],S[:,3]-S[:,1])
for j in np.nonzero(lens<6)[0]:
    for e in (0,2):
        grid[(int(S[j,e]//1),int(S[j,e+1]//1))].append(j)
def near_end(p,tol):
    out=[]
    cx,cy=int(p[0]//1),int(p[1]//1)
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            for j in grid.get((cx+dx,cy+dy),[]):
                for e in (0,2):
                    if math.hypot(S[j,e]-p[0],S[j,e+1]-p[1])<tol: out.append((j,e))
    return out
def isect(p,u,q,w):
    # p+s*u = q+t*w
    det=u[0]*(-w[1])-u[1]*(-w[0])
    if abs(det)<1e-9: return None
    rx,ry=q[0]-p[0],q[1]-p[1]
    s=(rx*(-w[1])-ry*(-w[0]))/det
    return (p[0]+s*u[0],p[1]+s*u[1])
doors=[]
for d in D:
    if 's' not in (d['type'] or ''): continue
    for ii,it in enumerate(d['items']):
        if it[0]!='c': continue
        P0,C1,C2,P3=it[1],it[2],it[3],it[4]
        t0=V(P0,C1); t3=V(C2,P3)
        if L(t0)<1e-6 or L(t3)<1e-6: continue
        n0=(-t0[1],t0[0]); n3=(-t3[1],t3[0])
        O=isect(P0,n0,P3,n3)
        if O is None: continue
        r0,r3=L(V(O,P0)),L(V(O,P3))
        if not (0.3<r0<5) or abs(r0-r3)>0.05*r0: continue
        a0=math.atan2(P0[1]-O[1],P0[0]-O[0]); a3=math.atan2(P3[1]-O[1],P3[0]-O[0])
        sweep=abs((math.degrees(a3-a0)+180)%360-180)
        if abs(sweep-90)>6: continue
        r=(r0+r3)/2
        # leaf: segment with one end at hinge O, length ~r, along O->P0 or O->P3
        cands={}
        for j,e in near_end(O,0.25*r):
            other=(S[j,2-e],S[j,3-e]) if e==0 else (S[j,0],S[j,1])
            lv=V(O,other); ll=L(lv)
            if ll<0.6*r or ll>2.5*r: continue
            for openP,closedP,lab in ((P0,P3,'P0'),(P3,P0,'P3')):
                ov=V(O,openP)
                c=(lv[0]*ov[0]+lv[1]*ov[1])/(ll*L(ov))
                if c>0.985:
                    dh=math.hypot(S[j,e]-O[0],S[j,e+1]-O[1])
                    score=dh+abs(ll-r)*0.2
                    if lab not in cands or score<cands[lab][0]: cands[lab]=(score,j,openP,closedP,ll,dh)
        if not cands: continue
        # wall test: a long straight segment (> 2.5 r) through hinge and closed end
        opts=[]
        for lab,(score,j,openP,closedP,ll,dh) in cands.items():
            u=V(O,closedP); ul=L(u); u=(u[0]/ul,u[1]/ul)
            x1,y1,x2,y2=S[:,0],S[:,1],S[:,2],S[:,3]
            m=(np.minimum(x1,x2)<O[0]+0.3)&(np.maximum(x1,x2)>O[0]-0.3)&(np.minimum(y1,y2)<O[1]+0.3)&(np.maximum(y1,y2)>O[1]-0.3)
            idx=np.nonzero(m)[0]
            wall=None
            for w in idx:
                a=(S[w,0],S[w,1]); b=(S[w,2],S[w,3]); ab=V(a,b); lab_=L(ab)
                if lab_<2.5*r: continue
                cosang=abs(ab[0]*u[0]+ab[1]*u[1])/lab_
                if cosang<0.995: continue
                def dist(p):
                    t=((p[0]-a[0])*ab[0]+(p[1]-a[1])*ab[1])/lab_**2
                    t=max(-0.02,min(1.02,t))
                    return math.hypot(p[0]-a[0]-t*ab[0],p[1]-a[1]-t*ab[1])
                dd=max(dist(O),dist(closedP))
                if dd<0.12 and (wall is None or dd<wall[0]): wall=(dd,int(S[w,4]),[float(v) for v in S[w,:4]])
            opts.append((lab,score,j,openP,closedP,ll,dh,wall))
        withwall=[o for o in opts if o[7]]
        amb=len(withwall)>1
        chosen=sorted(withwall,key=lambda o:o[7][0])[0] if withwall else sorted(opts,key=lambda o:o[1])[0]
        lab,score,j,openP,closedP,ll,dh,wall=chosen
        doors.append(dict(arc_drawing=d['i'],arc_seqno=d['seqno'],arc_item=ii,hinge=O,radius_pt=r,sweep=sweep,open_end=openP,closed_end=closedP,
                          leaf_drawing=int(S[j,4]),leaf_seg=[float(x) for x in S[j,:4]],leaf_len=ll,leaf_hinge_gap=dh,arc=[P0,C1,C2,P3],width=d['width'],color=d['color'],
                          wall=wall,n_leaf_options=len(opts),n_wall_options=len(withwall),ambiguous=amb))
print('door symbols',len(doors))
pickle.dump(doors,open('/dev/shm/dc_doors.pkl','wb'))
from collections import Counter
print(Counter(round(x['radius_pt'],1) for x in doors).most_common(20))
