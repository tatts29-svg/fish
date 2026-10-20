import json, math
G=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json'))
D=json.load(open('DATA_v918.json')); ML=json.load(open('MASTER_LOC_v918.json'))
S=json.load(open('/dev/shm/state_brief.json'))['docs']
I=json.load(open('inventory.json'))
N=512*2**18
def ll2px(lat,lon):
    x=(lon+180)/360*N; s=math.sin(math.radians(lat)); y=(0.5-math.log((1+s)/(1-s))/(4*math.pi))*N; return x,y
def inv(M,x,y):
    a,b,c=M[0]; d,e,f=M[1]; det=a*e-b*d
    X=x-c; Y=y-f; return ((e*X-b*Y)/det, (-d*X+a*Y)/det)
def ll2pt(lat,lon, region='main'):
    x,y=ll2px(lat,lon); px,py=inv(G[region]['sheet_to_z18px'],x,y); return px/2384, py/1684, px, py
# validate on ML
errs=[]
for r,e in ML.items():
    if not e.get('ll') or not e.get('pt'): continue
    fx,fy,px,py=ll2pt(*e['ll'])
    ex=e['pt'][0]*2384; ey=e['pt'][1]*1684
    inset = 1482.86<=ex<=2334.08 and 873.42<=ey<=1464.24
    if inset: fx,fy,px,py=ll2pt(*e['ll'],region='inset')
    errs.append((math.hypot(px-ex,py-ey)*0.705556, r, inset))
errs.sort(); print('ML ll->pt err m: median',errs[len(errs)//2],'max',errs[-3:])
def lonLatOf(ax,ay):
    g=D['georef']; A=g['basemap_px_to_epsg3857']; u=ax*g['frame_px'][0]; v=ay*g['frame_px'][1]
    x=A[0][0]*u+A[0][1]*v+A[0][2]; y=A[1][0]*u+A[1][1]*v+A[1][2]; R=6378137
    return (2*math.atan(math.exp(y/R))-math.pi/2)*180/math.pi, x/R*180/math.pi
A={a['key']:a for a in D['assets']}
def aerial(a):
    links=a.get('drawing_links') or []
    order=[l for l in links if (l.get('year') or 2026)==2026]+[l for l in links if (l.get('year') or 2026)!=2026]
    for l in order:
        sh=next((s for s in D['sheets'] if s['sheet_id']==l['sheet']),None)
        if not sh: continue
        for m in sh.get('markers') or []:
            if m.get('ax') is None: continue
            if (l.get('tag_id') and m.get('tag')) and m['tag']==l['tag_id'] or (not (l.get('tag_id') and m.get('tag')) and m.get('label')==l.get('label')):
                return (m['tx'],m['ty']) if m.get('tx') is not None else (m['ax'],m['ay'])
    return None
refs=sorted({u['ref'] for u in I['units']})
for r in refs:
    if r in ML: continue
    fx=[v['v'] for k,v in S['fixes'].items() if v['v'].get('ref')==r]
    pl=S['places'].get(r)
    a=A.get(r); ap=aerial(a) if a else None
    out=None; how=None
    if fx:
        f=sorted(fx,key=lambda v:v['at'])[-1]; out=ll2pt(f['lat'],f['lon']); how='record pin'
    elif pl: out=ll2pt(pl['v']['lat'],pl['v']['lon']); how='record place'
    elif ap:
        lat,lon=lonLatOf(*ap); out=ll2pt(lat,lon); how='drawing area '+str(ap)
    print(r, how, out and [round(out[0],5),round(out[1],5)], a and a.get('drawing_links'))
