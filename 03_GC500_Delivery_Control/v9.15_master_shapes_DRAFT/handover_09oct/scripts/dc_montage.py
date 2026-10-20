import pickle, pymupdf, math
from PIL import Image, ImageDraw
C=pickle.load(open('/dev/shm/dc_cmp.pkl','rb'))
doc=pymupdf.open('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/inputs_07oct/D001-26003-03-MASTER.pdf'); pg=doc[0]
rows=sorted(C['rows'],key=lambda r:(r['ref'],r['component'],r['door']))
T=260; half=6
tiles=[]
for r in rows:
    m=r['mine']; O=m['hinge_pt']; Cl=m['closed_end_pt']
    cx=(O[0]+Cl[0])/2; cy=(O[1]+Cl[1])/2
    rect=pymupdf.Rect(cx-half,cy-half,cx+half,cy+half)
    pix=pg.get_pixmap(clip=rect,dpi=int(72*T/(2*half)))
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples).resize((T,T))
    d=ImageDraw.Draw(im); s=T/(2*half)
    def P(p): return ((p[0]-rect.x0)*s,(p[1]-rect.y0)*s)
    h=P(O); d.ellipse([h[0]-5,h[1]-5,h[0]+5,h[1]+5],outline=(255,0,0),width=2)
    # outward arrow from door mid
    mid=P((cx,cy)); ou=m['outward']
    d.line([mid,(mid[0]+ou[0]*70,mid[1]+ou[1]*70)],fill=(0,120,255),width=3)
    d.rectangle([0,0,T,30],fill=(255,255,255))
    d.text((3,2),f"{r['ref']} c{r['component']} d{r['door']} e{m['edge_index']} at{m['at']:.2f}",fill=(0,0,0))
    d.text((3,15),f"{m['faces8']} {m['bearing_deg']} | v915 {r['v915']['faces']} {r['v915']['bearing_deg']}",fill=(0,0,0) if r['agree'] else (200,0,0))
    tiles.append(im)
n=30; cols=6
for k in range(0,len(tiles),n):
    grp=tiles[k:k+n]; rws=math.ceil(len(grp)/cols)
    M=Image.new('RGB',(cols*T,rws*T),(255,255,255))
    for i,t in enumerate(grp): M.paste(t,((i%cols)*T,(i//cols)*T))
    p=f'doorcrops/montage_{k//n+1}.png'; M.save(p); print(p,len(grp))
