# Author: Andrew Fisher. Water-filled barrier runs on the 2 Oct master (read only).
exec(open('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/shapes_all/wfb.py').read())
import json
INSET=(1482.86,873.42,2334.08,1464.24)
def to_frame(x,y):
    if INSET[0]<=x<=INSET[2] and INSET[1]<=y<=INSET[3]: return [round(x/2384,5),round((y+0.06)/1684,5)]
    return [round((x+25.5)/2384,5),round((y+0.12)/1684,5)]
thin=[s for s in segs if s['short']<1.2 and 2.4<s['long']<3.1]
RUNS=[
 ('R01','WB06',[686,767,837,873],'high','GC Hwy, S11-S13 (west part of the one grandstand run)'),
 ('R02','WB06',[854,648,1084,757],'high','GC Hwy, S14/S01/S02 behind the precinct fence (east part)'),
 ('R03','WB01',[338,1111,361,1128],'high','GC Hwy at PB3 / OP62'),
 ('R04','WB05',[267,1186,289,1202],'medium','GC Hwy south of WC72, by the light rail station'),
 ('R05','WB16',[497,1053,505,1080],'medium','Commodore Park, by WC40 / accessible parking'),
 ('R06','WB04',[91,1192,97,1226],'medium','Breaker St, west edge of Helen Park'),
 ('R07','WB14',[1786,440,1790,444],'high','MP 4.0 / EEP 6, Turn 4 drivers right'),
 ('R08','WB13',[1569,522,1622,578],'medium','single pieces along the precinct fence behind S15 (by WC45)'),
 ('R09','WB13',[1529,576,1563,582],'low','alternating run below S15 by BAR 16 / FOOD (may be part of WB13 or another run)'),
 ('R10','WB17',[788,344,806,350],'low','T8 kerb: row of yellow pieces (no white alternation)'),
 ('R11','WB17',[740,351,757,360],'low','T9 kerb: row of yellow pieces (no white alternation)'),
 ('R12','WB18',[1489,533,1507,546],'low','T2 kerb: row of yellow pieces (no white alternation)'),
 ('R13',None,[50,1239,84,1288],'unmatched','Breaker St south / by WC71'),
 ('R14',None,[88,1215,220,1281],'unmatched','GC Hwy at Helen Park / G1, light rail side'),
 ('R15',None,[674,361,692,367],'unmatched','T10 kerb: row of yellow pieces'),
 ('R16',None,[1189,606,1195,612],'unmatched','single piece near BS03'),
 ('R17',None,[1598,594,1604,600],'unmatched','single piece on the road edge south of S15'),
 ('R18',None,[1883,622,1915,628],'unmatched','GC Hwy side-street closure (Brit Ave / Ocean Ave area)'),
 ('R19',None,[2138,643,2165,649],'unmatched','GC Hwy side-street closure (Norfolk Ave area); drawn again in the inset'),
 ('R20',None,[2261,657,2282,664],'unmatched','GC Hwy side-street closure (Pine Ave area); drawn again in the inset'),
 ('R21',None,[1895,1381,1916,1388],'unmatched','inset only: GC Hwy side-street closure'),
]
out=[];claimed=set()
for rid,ref,bb,conf,where in RUNS:
    S=[s for s in thin if bb[0]-2<=s['c'][0]<=bb[2]+2 and bb[1]-2<=s['c'][1]<=bb[3]+2 and s['i'] not in claimed]
    claimed.update(s['i'] for s in S)
    ny=sum(1 for s in S if s['col']=='#ffbf00'); nw=len(S)-ny
    # order by nearest-neighbour chain from an extreme end
    pts=[s['c'] for s in S]
    if not pts: continue
    import itertools
    start=max(pts,key=lambda p:max(math.dist(p,q) for q in pts))
    chain=[start]; rest=[p for p in pts if p is not start]
    while rest:
        n=min(rest,key=lambda p:math.dist(chain[-1],p)); chain.append(n); rest.remove(n)
    L_pt=sum(math.dist(chain[i],chain[i+1]) for i in range(len(chain)-1))+sum(s['long'] for s in S)/len(S)
    # simplify polyline: keep every point (pieces), frame coords
    seglen=sum(s['long'] for s in S)/len(S)*MPP
    out.append(dict(run=rid,candidate_ref=ref,confidence=conf,where=where,bbox_pdf_pt=bb,
        pieces_drawn=len(S),yellow=ny,white=nw,piece_len_m_drawn=round(seglen,2),
        length_m=round(L_pt*MPP,1),centroid_frame=to_frame(sum(p[0] for p in pts)/len(pts),sum(p[1] for p in pts)/len(pts)),
        polyline_frame=[to_frame(*p) for p in chain],
        pdf_drawings=sorted(s['i'] for s in S)))
json.dump(out,open('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/shapes_all/wfb_runs.json','w'),indent=1)
for o in out: print(o['run'],o['candidate_ref'],o['confidence'],o['pieces_drawn'],o['yellow'],o['white'],o['piece_len_m_drawn'],o['length_m'],o['centroid_frame'])
