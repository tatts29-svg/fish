import math
MPP=0.705556
def c3(x): return None if x is None else tuple(round(v,3) for v in x)
def pts_of(d):
    pts=[]
    for it in d['items']:
        if it[0]=='l': pts+=[it[1],it[2]]
        elif it[0]=='c': pts+=[it[1],it[4]]
        elif it[0]=='qu': pts+=it[1]
        elif it[0]=='re': x0,y0,x1,y1=it[1]; pts+=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
    u=[]
    for p in pts:
        if not any(abs(p[0]-q[0])<1e-3 and abs(p[1]-q[1])<1e-3 for q in u): u.append(p)
    return u
def quad_info(u):
    if len(u)!=4: return None
    e=[math.dist(u[k],u[(k+1)%4]) for k in range(4)]
    if e[0]>=e[1]: L,W=(e[0]+e[2])/2,(e[1]+e[3])/2; a=(u[0],u[1])
    else: L,W=(e[1]+e[3])/2,(e[0]+e[2])/2; a=(u[1],u[2])
    ang=math.degrees(math.atan2(a[1][1]-a[0][1],a[1][0]-a[0][0]))%180
    cx=sum(p[0] for p in u)/4; cy=sum(p[1] for p in u)/4
    return dict(L=L*MPP,W=W*MPP,ang=ang,c=(cx,cy))
def to_frac(x,y):
    if 1482.86<=x<=2334.08 and 873.42<=y<=1464.24: return ((x)/2384,(y+0.06)/1684)
    return ((x+25.50)/2384,(y+0.12)/1684)
