import pickle,math,json,collections
from lib import *
segs=pickle.load(open('wfb_segs.pkl','rb'))
for s in segs:
    u=s['u']; e=[math.dist(u[k],u[(k+1)%4]) for k in range(4)]
    if e[0]<e[1]: ends=[((u[0][0]+u[1][0])/2,(u[0][1]+u[1][1])/2),((u[2][0]+u[3][0])/2,(u[2][1]+u[3][1])/2)]
    else: ends=[((u[1][0]+u[2][0])/2,(u[1][1]+u[2][1])/2),((u[3][0]+u[0][0])/2,(u[3][1]+u[0][1])/2)]
    s['ends']=ends
n=len(segs)
TOL=0.6/MPP  # 0.6 m in pt
par=list(range(n))
def f(a):
    while par[a]!=a: par[a]=par[par[a]]; a=par[a]
    return a
adj=collections.defaultdict(list)
for i in range(n):
    for j in range(i+1,n):
        dmin=min(math.dist(a,b) for a in segs[i]['ends'] for b in segs[j]['ends'])
        if dmin<TOL:
            par[f(i)]=f(j); adj[i].append(j); adj[j].append(i)
groups=collections.defaultdict(list)
for i in range(n): groups[f(i)].append(i)
runs=[]
for g,mem in groups.items():
    # order chain: start at a node with degree<=1
    deg={i:len(adj[i]) for i in mem}
    start=min(mem,key=lambda i:(deg[i],i))
    order=[start]; seen={start}
    while True:
        nx=[j for j in adj[order[-1]] if j not in seen]
        if not nx: break
        order.append(nx[0]); seen.add(nx[0])
    # polyline through ends
    poly=[]
    first=segs[order[0]]
    if len(order)>1:
        nxt=segs[order[1]]
        e0,e1=first['ends']
        if min(math.dist(e0,b) for b in nxt['ends'])<min(math.dist(e1,b) for b in nxt['ends']): e0,e1=e1,e0
        poly=[e0,e1]
    else: poly=list(first['ends'])
    for k in order[1:]:
        s=segs[k]; a,b=s['ends']
        if math.dist(a,poly[-1])>math.dist(b,poly[-1]): a,b=b,a
        poly.append(b)
    length=sum(math.dist(poly[k],poly[k+1]) for k in range(len(poly)-1))*MPP
    cx=sum(segs[i]['c'][0] for i in mem)/len(mem); cy=sum(segs[i]['c'][1] for i in mem)/len(mem)
    runs.append(dict(n_pieces=len(mem),chain_ok=len(order)==len(mem),n_yellow=sum(segs[i]['col']=='Y' for i in mem),
        length_m=round(length,2),poly_pt=[[round(x,2),round(y,2)] for x,y in poly],centroid_pt=[round(cx,2),round(cy,2)],
        frac=[ [round(v,6) for v in to_frac(*p)] for p in poly],draw_idx=sorted(segs[i]['i'] for i in mem),
        piece_L_med=round(sorted(segs[i]['L'] for i in mem)[len(mem)//2],3)))
runs.sort(key=lambda r:(r['centroid_pt'][1],r['centroid_pt'][0]))
for k,r in enumerate(runs): r['run']=k+1
json.dump(runs,open('wfb_runs.json','w'),indent=0)
for r in runs: print(r['run'],r['n_pieces'],r['chain_ok'],r['n_yellow'],r['length_m'],r['centroid_pt'],r['piece_L_med'])
print(sum(r['n_pieces'] for r in runs))
