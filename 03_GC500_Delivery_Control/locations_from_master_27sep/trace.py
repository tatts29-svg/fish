import pymupdf, json, math, re, glob, os
SHEETS={'D022':'D022-26003-02-PORT BUILDINGS.pdf','D023':'D023-26003-02-TOILETS.pdf','D024':'D024-26003-02-GENS & LTS.pdf','D025':'D025-26003-02-VMS.pdf'}
out={}
for sh,fn in SHEETS.items():
    p=pymupdf.open('gc500_v2/sources/drawings_26003/'+fn)[0]
    words=[]
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            for s in l['spans']:
                if s['size']>12 and s['text'].strip() and len(s['text'].strip())<=6:
                    words.append((s['text'].strip(), pymupdf.Rect(s['bbox'])))
    dr=p.get_drawings()
    lines=[]; fills=[]
    for g in dr:
        w=g.get('width') or 0
        if g.get('fill') is not None and g['rect'].width<60 and g['rect'].height<60 and g['rect'].width>12:
            fills.append((g['rect'], g['fill']))
        if w>=0.6 and (g.get('color') or (1,1,1))[0]<0.15:
            for it in g['items']:
                if it[0]=='l': lines.append((it[1],it[2],w))
    res=[]
    seen=set()
    for t,r in words:
        cx=(r.x0+r.x1)/2; cy=(r.y0+r.y1)/2
        key=(t,round(cx),round(cy))
        if key in seen: continue
        seen.add(key)
        # bubble fill colour: smallest fill rect containing centre
        fc=[f for f in fills if f[0].contains(pymupdf.Point(cx,cy))]
        fc.sort(key=lambda f:f[0].width*f[0].height)
        col=[round(v,2) for v in fc[0][1]] if fc else None
        rad=(fc[0][0].width/2) if fc else 20
        # leaders: lines with an endpoint within rad+3 of centre
        tips=[]
        for a,b,w in lines:
            for P,Q in ((a,b),(b,a)):
                if math.hypot(P.x-cx,P.y-cy)<=rad+3 and math.hypot(Q.x-cx,Q.y-cy)>rad+20:
                    # follow chain
                    cur=Q; path=[P,Q]; used=set()
                    for _ in range(6):
                        nxt=None
                        for a2,b2,w2 in lines:
                            if abs(w2-w)>0.3: continue
                            for P2,Q2 in ((a2,b2),(b2,a2)):
                                if math.hypot(P2.x-cur.x,P2.y-cur.y)<0.8 and math.hypot(Q2.x-P.x,Q2.y-P.y)>math.hypot(cur.x-P.x,cur.y-P.y)+1:
                                    nxt=Q2
                        if nxt is None: break
                        cur=nxt; path.append(cur)
                    # extend a little along the last direction for the arrowhead
                    dx,dy=cur.x-path[-2].x,cur.y-path[-2].y; L=math.hypot(dx,dy) or 1
                    tip=(cur.x+dx/L*10, cur.y+dy/L*10)
                    tips.append({'tip':[round(tip[0],1),round(tip[1],1)],'w':round(w,2),'len':round(math.hypot(tip[0]-cx,tip[1]-cy),1)})
        # de-dup tips
        uniq=[]
        for tp in tips:
            if all(math.hypot(tp['tip'][0]-u['tip'][0],tp['tip'][1]-u['tip'][1])>4 for u in uniq): uniq.append(tp)
        res.append({'t':t,'c':[round(cx,1),round(cy,1)],'col':col,'rad':round(rad,1),'tips':uniq})
    out[sh]=res
    print(sh, len(res), 'with leaders', sum(1 for x in res if x['tips']), 'multi', sum(1 for x in res if len(x['tips'])>1))
json.dump(out,open('locfind/bubbles.json','w'))
