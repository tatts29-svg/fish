import pickle, json, hashlib
C=pickle.load(open('/dev/shm/dc_cmp.pkl','rb')); T=pickle.load(open('/dev/shm/dc_toilets.pkl','rb')); un=pickle.load(open('/dev/shm/dc_unassigned.pkl','rb'))
SH='/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'
PDF='/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/inputs_07oct/D001-26003-03-MASTER.pdf'
GEO='/home/user/fish/03_GC500_Delivery_Control/v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json'
sha=lambda p: hashlib.sha256(open(p,'rb').read()).hexdigest()
m8={'N':'north','NE':'north-east','E':'east','SE':'south-east','S':'south','SW':'south-west','W':'west','NW':'north-west'}
def clean(o):
    if isinstance(o,dict): return {k:clean(v) for k,v in o.items()}
    if isinstance(o,(list,tuple)): return [clean(v) for v in o]
    if hasattr(o,'item'): return o.item()
    return o
rows=[]
geom_agree=0; full_agree=0
for r in sorted(C['rows'],key=lambda r:(r['ref'],r['component'],r['door'])):
    m=r['mine']; v=r['v915']; ch=r['checks']
    f8=m8[m['faces8']]==v['faces']
    g=ch['edge'] and ch['at_diff']<0.02 and ch['outward_angle_deg']<3 and ch['opens']
    geom_agree+=g; full_agree+= (g and f8 and ch['bearing_diff_deg']<3)
    b=m['bearing_deg']; d4=min((b-45)%90,90-(b-45)%90); d8=min((b-22.5)%45,45-(b-22.5)%45)
    rows.append(dict(ref=r['ref'],component=r['component'],door=r['door'],kind=r['kind'],
        agree=bool(g and f8 and ch['bearing_diff_deg']<3),
        independent=dict(edge_index=m['edge_index'],at=m['at'],t_hinge=m['t_hinge'],t_closed_end=m['t_closed'],outward=m['outward'],
            bearing_deg=b,faces_8pt=m8[m['faces8']],faces_4pt=m['faces'],margin_to_4pt_boundary_deg=round(d4,1),margin_to_8pt_boundary_deg=round(d8,1),
            opens='outward' if m['opens_outward'] else 'inward',width_m=m['width_m'],sweep_deg=m['sweep_deg'],
            hinge_pt=m['hinge_pt'],closed_end_pt=m['closed_end_pt'],leaf_tip_pt=m['open_end_pt'],
            pdf=dict(arc_drawing=m['arc_drawing'],arc_seqno=m['arc_seqno'],leaf_drawing=m['leaf_drawing'],wall_drawing=m['wall_drawing'],
                     wall_segment_vs_v915_edge_endpoints_pt=m['wall_vs_v915_edge_endpoints_pt'],leaf_perp_to_edge_cos=m['leaf_perp_cos'],
                     leaf_candidates=m['leaf_options'],leaf_candidates_on_a_wall=m['wall_options'])),
        v915=v,
        checks=dict(edge_same=ch['edge'],at_diff=ch['at_diff'],outward_angle_diff_deg=ch['outward_angle_deg'],bearing_diff_deg=ch['bearing_diff_deg'],
                    faces_same_8pt=f8,faces_same_if_read_as_4pt=ch['faces'],opens_same=ch['opens'],same_arc_drawing=ch['arc_same_drawing'])))
toilets=[dict(ref=t['ref'],component=t['component'],door_symbols_on_outline=len(t['door_symbols_on_outline']),curves_inside=t['curves_inside'],
              chevron=[dict(drawing=c['drawing'],apex_pt=c['apex_pt'],apex_edge=c['apex_edge'],apex_t=c['apex_t'],arm_ends_on_edges=c['arm_ends_on_edges']) for c in t['chevrons']],
              v915_chevron_edge=t['v915_chevron_edge'],v915_door=t['v915_door'],chevron_edge_agrees=bool(t['chevrons']) and all(c['apex_edge']==t['v915_chevron_edge'][0] for c in t['chevrons'])) for t in T]
seen=set(); other=[]
words=pickle.load(open('/dev/shm/dc_words.pkl','rb'))
import math
for x in un:
    if 1.0<x[4]<1.3 and x[7] and x[6] not in seen:
        seen.add(x[6]); O=x[5]
        near=sorted((math.dist(O,((a[0]+a[2])/2,(a[1]+a[3])/2)),a[4]) for a in words if abs(a[0]-O[0])<25 and abs(a[1]-O[1])<25)
        other.append(dict(hinge_pt=O,radius_pt=x[4],arc_drawing=x[6],nearest_shaped_component=[x[1],x[2]],distance_pt=round(x[0],1),nearest_words=[t for d,t in near[:3]]))
out=dict(
 meta=dict(what='Independent door-side re-check of v9.15 shapes_v915.json against the 2 Oct master D001-26003-03 (fresh pymupdf read; no code or data from scratchpad/shapes/ used; v9.15 outlines used only to name edges)',
   built='8 Oct 2026',
   sources=dict(master=dict(file='D001-26003-03-MASTER.pdf',sha256=sha(PDF)),shapes_v915=dict(sha256=sha(SH)),georeferencing=dict(file='v8.93_maps_aligned_DRAFT/assets_small/georeferencing.json',sha256=sha(GEO))),
   method=['every cubic curve on the sheet tested as a quarter circle: centre = intersection of the end normals, equal radii within 5%, sweep 90 +/- 6 deg (1464 found)',
           'door leaf = a stroked segment (line or quad side, any drawing) starting within 0.25 r of the arc centre, length 0.6-2.5 r, parallel to centre->arc end within 10 deg; on toilet blocks both arc ends have a line from the hinge (landing box), so the wall side is the one lying on a straight segment longer than 2.5 r through hinge and the other arc end (within 0.12 pt); the leaf is the other',
           'edge = the v9.15 outline edge (2 Oct pt, poly_pt) holding both hinge and closed arc end within 0.25 pt; the PDF wall segment found independently is reported against that edge',
           'at = mean of hinge and closed-end positions along the edge from its first vertex (door centre)',
           'outward = unit vector hinge->leaf tip (sheet pt, y down); opens outward if a probe point in front of the door is outside the outline',
           'bearing = outward pushed through the georeferencing sheet_to_z18px linear part (main or inset by position), clockwise from north (Web Mercator px, y south); 2 Oct pt directions equal 17 Sep directions (pure translation)',
           'faces: v9.15 uses an 8-point compass (north, north-east, ...); both 8-point and 4-point are given here'],
   legend=dict(door='PORTABLE BUILDINGS and TOILET BLOCK legend symbols: quarter-circle arc + straight leaf from the hinge, drawn outside the outline (crop doorcrops/legend_buildings_toilets.png)',
               single_toilet='SINGLE TOILET legend symbol: square outline, a circle inside, and two straight lines from the midpoint of one edge to the midpoints of the two adjacent edges, tangent to the circle (the chevron). It is part of the symbol itself; no swing arc and no leaf. The legend does not say what the chevron edge means.')),
 summary=dict(v915_door_arcs=117,independent_door_symbols_on_v915_outlines=119,duplicates_drawn_twice=2,unique=117,
   matched=len(rows),agreed=full_agree,geometry_agreed=geom_agree,disagreements=len(rows)-full_agree,
   worst=dict(at_diff=max(r['checks']['at_diff'] for r in rows),outward_angle_deg=max(r['checks']['outward_angle_diff_deg'] for r in rows),bearing_diff_deg=max(r['checks']['bearing_diff_deg'] for r in rows)),
   all_open_outward=all(r['independent']['opens']=='outward' for r in rows),
   faces_vocabulary_note='28 of the 117 have an intercardinal v9.15 faces value (north-west 11, south-east 8, south-west 7, north-east 2). They agree with the independent 8-point reading. If the picker or the driver text collapses faces to N/E/S/W, 9 doors sit within 4 deg of a 4-point boundary (P18, P19, P20, P21 at 0.8 deg, P44 at 0.2 deg, P06 at 2.1 deg, P38/P39/P42 at 3.9 deg): there the side should be stated as the 8-point value or the bearing, not N/E/S/W.',
   single_toilets=dict(checked=len(toilets),with_any_door_swing_on_outline=sum(1 for t in toilets if t['door_symbols_on_outline']),with_chevron=sum(1 for t in toilets if t['chevron']),
      chevron_edge_agrees_with_v915=sum(1 for t in toilets if t['chevron_edge_agrees']),chevron_apex_at_edge_midpoint=True,
      note='WC73 components 0 and 1 have their chevron drawn twice (drawings 119264/120528, 119274/120538), same edge as v9.15.')),
 disagreements=[],
 observations=[
   dict(item='duplicate door drawings',detail='WC17 component 1: both door arcs are drawn twice (120443/120540 and 120445/120542, identical geometry). Counted once; v9.15 also has 2 doors there.'),
   dict(item='doors opening onto an OP symbol',detail='P52 door 1 (hinge 106.91,1160.43 pt) sits on the stretch of P52 edge 1 that the OP10 box (drawing 116211) shares; P46 door 0 (hinge 460.31,1181.97 pt) sits where the OP14 box (grey fill 122745) overlaps P46. Door side and position agree with v9.15; on the ground those doors open into the OP10 / OP14 openings (like P66 into OP78). Crops doorcrops/P52_P53_P56.png, doorcrops/P46_door.png.'),
   dict(item='no door drawn (confirmed)',detail='P53 and P56: no door symbol on their outlines (crop doorcrops/P52_P53_P56.png; P54 next to them has one). P26/P27/P28/P29/P34 block: no door symbol on its outlines. Generators and pee panels: none.'),
   dict(item='inset copy agrees',detail='The inset redraws P60, P62, P63 with their doors (arcs 226354, 226351, 226357); through the inset georeferencing they face 85.6, 267.1, 86.8 deg against 85.8, 267.2, 86.9 deg from the main plan used by v9.15. Crops doorcrops/inset_P60_P62_P63.png and doorcrops/main_P60_P62_P63.png.'),
   dict(item='CP1 identity (not a door question)',detail='CP1 shape (centroid 2162.07,1263.04 pt) is the building tagged P68 on the master (tag 0.3 pt from the centroid); no CP1 text on the master; its door read is correct for that building.'),
   dict(item='door swings on the master not attached to any v9.15 reference',detail='Door-sized symbols with a wall, on buildings without a Coates reference (nearest tags EVL, COOL, GEM, BSF, CHL, COA and two toilet-block-sized ones near the F fence labels at 1780-1789,273 pt). Listed in other_door_symbols for whoever owns pin/identity; crops doorcrops/unassigned_nearGN24.png (EVL), unassigned_nearGN23.png, unassigned_nearP41.png, unassigned_nearP04.png.')],
 crops=dict(legend='doorcrops/legend_buildings_toilets.png',every_door=['doorcrops/montage_%d.png'%i for i in (1,2,3,4)],montage_key='red ring = hinge read here; blue line = outward read here, from the door centre; header: ref, component, door, edge, at, independent 8-point face and bearing | v9.15 face and bearing'),
 doors=rows, single_toilets=toilets, other_door_symbols=other)
json.dump(clean(out),open('doors_check.json','w'),indent=1)
print(full_agree,geom_agree,len(rows),len(toilets),len(other))
