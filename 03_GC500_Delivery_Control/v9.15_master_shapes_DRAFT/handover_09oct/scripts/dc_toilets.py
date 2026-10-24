import pickle, json, math, numpy as np
from collections import Counter
D=pickle.load(open('/dev/shm/dc_drawings.pkl','rb'))
doors=pickle.load(open('/dev/shm/dc_doors.pkl','rb'))
J=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'))
R=np.array([d['rect'] for d in D])
def segd(p,a,b):
    ax,ay=b[0]-a[0],b[1]-a[1];L2=ax*ax+ay*ay;t=((p[0]-a[0])*ax+(p[1]-a[1])*ay)/L2
    tc=max(0,min(1,t));return math.hypot(p[0]-a[0]-tc*ax,p[1]-a[1]-tc*ay),t
out=[];stats=Counter()
for ref,v in J['refs'].items():
    s=v.get('shape')
    if not s: continue
    for ci,c in enumerate(s['components']):
        if c['kind']!='toilet': continue
        P=c['poly_pt']; xs=[p[0] for p in P]; ys=[p[1] for p in P]
        m=(R[:,0]>=min(xs)-0.15)&(R[:,2]<=max(xs)+0.15)&(R[:,1]>=min(ys)-0.15)&(R[:,3]<=max(ys)+0.15)
        idx=np.nonzero(m)[0]
        curves=0; chevs=[]; other=[]
        for i in idx:
            d=D[i]; its=d['items']
            if any(it[0]=='c' for it in its): curves+=sum(1 for it in its if it[0]=='c')
            ls=[it for it in its if it[0]=='l']
            if len(ls)==2 and len(its)==2 and math.dist(ls[0][2],ls[1][1])<0.01:
                apex=ls[0][2]; e1=ls[0][1]; e2=ls[1][2]
                de=[segd(apex,P[k],P[(k+1)%4]) for k in range(4)]
                k=min(range(4),key=lambda k:de[k][0])
                a1=[segd(e1,P[q],P[(q+1)%4])[0] for q in range(4)]; a2=[segd(e2,P[q],P[(q+1)%4])[0] for q in range(4)]
                chevs.append(dict(drawing=i,apex_pt=[round(apex[0],3),round(apex[1],3)],apex_edge=k,apex_dist_pt=round(de[k][0],3),apex_t=round(de[k][1],3),
                                  arm_ends_on_edges=[min(range(4),key=lambda q:a1[q]),min(range(4),key=lambda q:a2[q])],arm_end_dist_pt=round(max(min(a1),min(a2)),3)))
        # any door symbol (arc+leaf) with hinge within 0.5 pt of this outline
        near=[dd['arc_drawing'] for dd in doors if min(segd(dd['hinge'],P[k],P[(k+1)%4])[0] for k in range(4))<0.5]
        v915m=[mk for mk in c.get('marks',[]) if mk.get('type')=='chevron']
        rec=dict(ref=ref,component=ci,curves_inside=curves,chevrons=chevs,door_symbols_on_outline=near,
                 v915_chevron_edge=[mk['edge_index'] for mk in v915m],v915_door=c.get('door'))
        rec['chevron_edge_agrees']= (len(chevs)==1 and [chevs[0]['apex_edge']]==rec['v915_chevron_edge'])
        out.append(rec)
        stats['toilets']+=1; stats['chev=%d'%len(chevs)]+=1; stats['curves=%d'%curves]+=1
        stats['door_syms' if near else 'no_door_syms']+=1
        stats['agree' if rec['chevron_edge_agrees'] else 'chev_disagree']+=1
print(stats)
print(Counter(round(ch['apex_t'],1) for r in out for ch in r['chevrons']))
print(Counter(tuple(sorted(((ch['apex_edge']-e)%4) for e in ch['arm_ends_on_edges'])) for r in out for ch in r['chevrons']))
for r in out:
    if not r['chevron_edge_agrees'] or r['door_symbols_on_outline']: print(r)
pickle.dump(out,open('/dev/shm/dc_toilets.pkl','wb'))
