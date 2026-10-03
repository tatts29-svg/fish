"""v6.90 - the master plan cut into sharp tiles (Andrew, 27 Sep 2026: "no blurry"). Rendered from the vector PDF
D001-26003-03 at three sizes; 512 px WebP tiles, named by their SHA-256 like every other hosted picture."""
import pymupdf, io, hashlib, json, os, sys
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
SRC='gc500_v2/sources/drawings_26003/D001-26003-03-MASTER.pdf'; MEDIA='kit584/GC500_v5.84_reimport/media'; T=512
def stripe(args):
    W,row=args
    pg=pymupdf.open(SRC)[0]; PW,PH=pg.rect.width,pg.rect.height; z=W/PW; H=round(PH*z)
    y0=row*T; y1=min(H,y0+T)
    pix=pg.get_pixmap(matrix=pymupdf.Matrix(z,z),clip=pymupdf.Rect(0,y0/z,PW,y1/z),alpha=False)
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    out=[]
    for c in range((W+T-1)//T):
        t=im.crop((c*T,0,min(W,(c+1)*T),im.height)); b=io.BytesIO(); t.save(b,'WEBP',quality=82,method=5); d=b.getvalue()
        sha=hashlib.sha256(d).hexdigest(); p=os.path.join(MEDIA,sha+'.webp')
        if not os.path.exists(p): open(p,'wb').write(d)
        out.append((c,sha,len(d)))
    return W,row,out
if __name__=='__main__':
    levels=[int(x) for x in sys.argv[1:]] or [5200,10400,20800]
    pg=pymupdf.open(SRC)[0]; PW,PH=pg.rect.width,pg.rect.height
    jobs=[(W,r) for W in levels for r in range((round(PH*W/PW)+T-1)//T)]
    res={}
    with ProcessPoolExecutor(4) as ex:
        for W,row,out in ex.map(stripe,jobs): res.setdefault(W,{})[row]=out
    idx={'tile':T,'levels':[]}; media=[]
    for W in levels:
        H=round(PH*W/PW); rows=[[s for c,s,n in sorted(res[W][r])] for r in sorted(res[W])]
        idx['levels'].append({'w':W,'h':H,'rows':rows})
        for r in res[W].values():
            for c,s,n in r: media.append({'bytes':n,'file':s+'.webp','scope':'view','sha256':s,'type':'image/webp'})
    json.dump(idx,open('locfind/tiles_index.json','w'),separators=(',',':')); json.dump(media,open('locfind/tiles_media.json','w'))
    print('tiles',len(media),'MB',round(sum(m['bytes'] for m in media)/1e6,1),[ (l['w'],len(l['rows']),len(l['rows'][0])) for l in idx['levels']])
