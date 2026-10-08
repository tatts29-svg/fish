import pymupdf, pickle, time, sys
P='/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/inputs_07oct/D001-26003-03-MASTER.pdf'
t=time.time()
doc=pymupdf.open(P); pg=doc[0]
print(pg.rect, pg.rotation)
dr=pg.get_drawings()
print(len(dr), time.time()-t)
out=[]
for i,d in enumerate(dr):
    items=[]
    for it in d['items']:
        conv=[]
        for p in it[1:]:
            if isinstance(p,pymupdf.Point): conv.append((p.x,p.y))
            elif isinstance(p,pymupdf.Quad): conv.append(tuple((q.x,q.y) for q in (p.ul,p.ur,p.lr,p.ll)))
            elif isinstance(p,pymupdf.Rect): conv.append((p.x0,p.y0,p.x1,p.y1))
            else: conv.append(p)
        items.append((it[0],)+tuple(conv))
    out.append(dict(i=i,seqno=d.get('seqno'),type=d.get('type'),color=d.get('color'),fill=d.get('fill'),width=d.get('width'),rect=tuple(d['rect']),closePath=d.get('closePath'),items=items))
pickle.dump(out,open('/dev/shm/dc_drawings.pkl','wb'))
words=pg.get_text('words')
pickle.dump(words,open('/dev/shm/dc_words.pkl','wb'))
print('done',time.time()-t)
