import pickle,json,math
doors=pickle.load(open('/dev/shm/dc_doors.pkl','rb')); assign=pickle.load(open('/dev/shm/dc_assign.pkl','rb'))
J=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'))
comps=[(ref,ci,c) for ref,v in J['refs'].items() if v.get('shape') for ci,c in enumerate(v['shape']['components'])]
def segd(p,a,b):
    ax,ay=b[0]-a[0],b[1]-a[1];L2=ax*ax+ay*ay;t=max(0,min(1,((p[0]-a[0])*ax+(p[1]-a[1])*ay)/L2))
    return math.hypot(p[0]-a[0]-t*ax,p[1]-a[1]-t*ay)
from collections import Counter
un=[]
for k,d in enumerate(doors):
    if assign[k]: continue
    O=d['hinge']
    if O[1]>1470: continue  # legend / title block strip
    best=min(((min(segd(O,c['poly_pt'][i],c['poly_pt'][(i+1)%len(c['poly_pt'])]) for i in range(len(c['poly_pt']))),ref,ci,c['kind']) for ref,ci,c in comps))
    un.append((best[0],best[1],best[2],best[3],round(d['radius_pt'],2),[round(O[0],2),round(O[1],2)],d['arc_drawing'],d['wall'] is not None))
un.sort()
print('unassigned symbols',len(un))
for x in un[:40]: print([round(x[0],2)]+list(x[1:]))
print(Counter(x[4] for x in un if x[0]<20))
pickle.dump(un,open('/dev/shm/dc_unassigned.pkl','wb'))
