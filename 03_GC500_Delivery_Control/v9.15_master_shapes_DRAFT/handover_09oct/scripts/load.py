import pymupdf, pickle, hashlib, os
M='/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/inputs_07oct/D001-26003-03-MASTER.pdf'
OUT=os.path.dirname(os.path.abspath(__file__))+'/drs.pkl'
def col(c):
    if c is None: return None
    return '#%02x%02x%02x'%tuple(int(round(v*255)) for v in c[:3])
def load():
    if os.path.exists(OUT): return pickle.load(open(OUT,'rb'))
    doc=pymupdf.open(M); p=doc[0]
    drs=p.get_drawings()
    L=[]
    for i,d in enumerate(drs):
        pts=[]
        for it in d['items']:
            if it[0]=='re': r=it[1]; pts.append(('re',[(r.x0,r.y0),(r.x1,r.y0),(r.x1,r.y1),(r.x0,r.y1)]))
            elif it[0]=='qu': q=it[1]; pts.append(('qu',[(q.ul.x,q.ul.y),(q.ur.x,q.ur.y),(q.lr.x,q.lr.y),(q.ll.x,q.ll.y)]))
            else: pts.append((it[0],[(v.x,v.y) for v in it[1:] if isinstance(v,pymupdf.Point)]))
        L.append(dict(i=i,type=d.get('type'),stroke=col(d.get('color')),fill=col(d.get('fill')),w=d.get('width'),dashes=d.get('dashes'),items=pts,rect=tuple(d['rect']),seqno=d.get('seqno'),layer=d.get('layer'),op=d.get('stroke_opacity')))
    pickle.dump(L,open(OUT,'wb'))
    return L
