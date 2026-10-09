import pickle, json, math
doors=pickle.load(open('/dev/shm/dc_doors.pkl','rb')); assign=pickle.load(open('/dev/shm/dc_assign.pkl','rb'))
J=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'))
G=json.load(open('/home/user/fish/03_GC500_Delivery_Control/v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json'))
INSET=(1482.86,873.42,2334.08,1464.24)
def in_inset(p): return INSET[0]<=p[0]<=INSET[2] and INSET[1]-0.06<=p[1]<=INSET[3]
def bearing(p,v):
    M=G['inset' if in_inset(p) else 'main']['sheet_to_z18px']
    ex=M[0][0]*v[0]+M[0][1]*v[1]; ey=M[1][0]*v[0]+M[1][1]*v[1]
    return math.degrees(math.atan2(ex,-ey))%360
def face4(b): return ['north','east','south','west'][int(((b+45)%360)//90)]
def face8(b): return ['N','NE','E','SE','S','SW','W','NW'][int(((b+22.5)%360)//45)]
def pip(p,poly):
    x,y=p;ins=False
    for i in range(len(poly)):
        x1,y1=poly[i];x2,y2=poly[(i+1)%len(poly)]
        if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: ins=not ins
    return ins
mine={}; dups=[]
for k,h in enumerate(assign):
    if not h: continue
    _,ref,ci,ei,th,tc=h[0]
    dr=doors[k]
    key=(ref,ci,round(dr['hinge'][0],2),round(dr['hinge'][1],2),round(dr['radius_pt'],2))
    if key in mine: dups.append(dict(ref=ref,component=ci,arc_drawing=dr['arc_drawing'],duplicate_of=mine[key]['arc_drawing'])); continue
    c=J['refs'][ref]['shape']['components'][ci]; P=c['poly_pt']
    O=dr['hinge']; Op=dr['open_end']
    ov=(Op[0]-O[0],Op[1]-O[1]); l=math.hypot(*ov); ou=(ov[0]/l,ov[1]/l)
    a,b=P[ei],P[(ei+1)%len(P)]
    ed=(b[0]-a[0],b[1]-a[1]); el=math.hypot(*ed)
    # leaf perpendicular to edge?
    perp=abs(ou[0]*ed[0]+ou[1]*ed[1])/el
    probe=(O[0]+ou[0]*0.4*dr['radius_pt']+ (dr['closed_end'][0]-O[0])*0.5, O[1]+ou[1]*0.4*dr['radius_pt']+(dr['closed_end'][1]-O[1])*0.5)
    outward=not pip(probe,P)
    # wall segment from PDF vs v9.15 edge endpoints
    w=dr['wall']; wall_match=None
    if w:
        s=w[2]; e1=((s[0],s[1]),(s[2],s[3]))
        dd=min(max(math.dist(e1[0],a),math.dist(e1[1],b)),max(math.dist(e1[0],b),math.dist(e1[1],a)))
        wall_match=round(dd,3)
    br=bearing(O,ou)
    mine[key]=dict(ref=ref,component=ci,kind=c['kind'],arc_drawing=dr['arc_drawing'],arc_seqno=dr['arc_seqno'],leaf_drawing=dr['leaf_drawing'],
        wall_drawing=w[1] if w else None,wall_vs_v915_edge_endpoints_pt=wall_match,
        hinge_pt=[round(O[0],3),round(O[1],3)],closed_end_pt=[round(dr['closed_end'][0],3),round(dr['closed_end'][1],3)],open_end_pt=[round(Op[0],3),round(Op[1],3)],
        radius_pt=round(dr['radius_pt'],3),width_m=round(dr['radius_pt']*0.705556,2),sweep_deg=round(dr['sweep'],1),
        edge_index=ei,t_hinge=round(th,4),t_closed=round(tc,4),at=round((th+tc)/2,4),
        outward=[round(ou[0],4),round(ou[1],4)],leaf_perp_cos=round(perp,4),opens_outward=outward,
        bearing_deg=round(br,1),faces=face4(br),faces8=face8(br),inset=in_inset(O),
        leaf_options=dr['n_leaf_options'],wall_options=dr['n_wall_options'])
# compare with v9.15
rows=[];agree=0;dis=[]
used=set()
v915=[]
for ref,v in J['refs'].items():
    s=v.get('shape')
    if not s: continue
    for ci,c in enumerate(s['components']):
        for di,dd in enumerate(c.get('doors') or []):
            v915.append((ref,ci,di,c,dd))
for ref,ci,di,c,dd in v915:
    cand=[(abs(m['at']-dd['at'])+(0 if m['edge_index']==dd['edge_index'] else 10),key) for key,m in mine.items() if m['ref']==ref and m['component']==ci and key not in used]
    if not cand: dis.append(dict(ref=ref,component=ci,door=di,issue='no independent door symbol found',v915=dict(edge_index=dd['edge_index'],at=dd['at'],faces=dd['faces'],bearing_deg=dd['bearing_deg'],arc_drawing=dd['pdf']['arc_drawing']))); continue
    cand.sort(); key=cand[0][1]; used.add(key); m=mine[key]
    ang=math.degrees(math.acos(max(-1,min(1,m['outward'][0]*dd['outward'][0]+m['outward'][1]*dd['outward'][1]))))
    db=abs((m['bearing_deg']-dd['bearing_deg']+180)%360-180)
    checks=dict(edge=m['edge_index']==dd['edge_index'],at_diff=round(abs(m['at']-dd['at']),4),outward_angle_deg=round(ang,2),bearing_diff_deg=round(db,2),
                faces=m['faces']==dd['faces'],arc_same_drawing=m['arc_drawing']==dd['pdf']['arc_drawing'],opens=('outward' if m['opens_outward'] else 'inward')==dd.get('opens'))
    ok=checks['edge'] and checks['at_diff']<0.02 and ang<3 and db<3 and checks['faces'] and checks['opens']
    row=dict(ref=ref,component=ci,door=di,kind=c['kind'],agree=ok,checks=checks,mine=m,
             v915=dict(edge_index=dd['edge_index'],at=dd['at'],outward=dd['outward'],faces=dd['faces'],bearing_deg=dd['bearing_deg'],opens=dd.get('opens'),arc_drawing=dd['pdf']['arc_drawing'],leaf_drawing=dd['pdf']['leaf_drawing']))
    rows.append(row)
    if ok: agree+=1
    else: dis.append(dict(ref=ref,component=ci,door=di,issue='mismatch',checks=checks,mine=m,v915=row['v915']))
extra=[m for key,m in mine.items() if key not in used]
print('v915 doors',len(v915),'mine unique',len(mine),'dups',len(dups),'agree',agree,'disagree',len(dis),'extra',len(extra))
for x in dis: print(json.dumps(x)[:600])
for x in extra: print('EXTRA',json.dumps(x)[:400])
import statistics
print('max at diff',max(r['checks']['at_diff'] for r in rows),'max ang',max(r['checks']['outward_angle_deg'] for r in rows),'max bearing',max(r['checks']['bearing_diff_deg'] for r in rows))
print('max wall diff',max((r['mine']['wall_vs_v915_edge_endpoints_pt'] or 99) for r in rows), 'perp max', max(r['mine']['leaf_perp_cos'] for r in rows))
print('wall none',sum(1 for r in rows if r['mine']['wall_drawing'] is None))
pickle.dump(dict(rows=rows,dis=dis,extra=extra,dups=dups,mine=mine),open('/dev/shm/dc_cmp.pkl','wb'))
