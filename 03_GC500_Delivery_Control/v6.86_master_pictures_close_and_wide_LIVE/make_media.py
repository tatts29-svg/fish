import pymupdf, json, hashlib, os, io
from PIL import Image, ImageDraw
M=json.load(open('locfind/master_loc.json')); R={x['k']:x for x in json.load(open('locfind/resolved.json'))}; TP=json.load(open('locfind/tagpos.json'))
MEDIA='kit584/GC500_v5.84_reimport/media'
page=pymupdf.open('gc500_v2/sources/drawings_26003/D001-26003-03-MASTER.pdf')[0]; PW,PH=page.rect.width,page.rect.height
def shot(cx,cy,w,h,zoom,ring,label):
    x0=max(0,min(PW-w,cx-w/2)); y0=max(0,min(PH-h,cy-h/2))
    pix=page.get_pixmap(matrix=pymupdf.Matrix(zoom,zoom),clip=pymupdf.Rect(x0,y0,x0+w,y0+h))
    im=Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB'); d=ImageDraw.Draw(im)
    px,py=(cx-x0)*zoom,(cy-y0)*zoom
    for r,wd,c in ((ring+3,7,(255,255,255)),(ring,5,(220,30,30))): d.ellipse([px-r,py-r,px+r,py+r],outline=c,width=wd)
    b=io.BytesIO(); im.save(b,'WEBP',quality=74,method=6); return b.getvalue()
new=[]; out={}
for k,m in M.items():
    if m.get('prec')!='unit': continue
    x,y=R[k]['sheet_pt']
    if k=='WC07': x,y=TP['WC07']['pts'][1]
    pics=[]
    for (w,h,z,ring) in ((110,70,7,58),(520,340,1.8,22)):
        data=shot(x,y,w,h,z,ring,k); sha=hashlib.sha256(data).hexdigest(); fn=sha+'.webp'
        p=os.path.join(MEDIA,fn)
        if not os.path.exists(p): open(p,'wb').write(data)
        new.append({'bytes':len(data),'file':fn,'scope':'view','sha256':sha,'type':'image/webp'}); pics.append(sha)
    m['img']=pics
json.dump(M,open('locfind/master_loc.json','w'),separators=(',',':'))
man=json.load(open(os.path.join(MEDIA,'manifest.json')))
have={a['file'] for a in man['assets']}
assets=man['assets']+[a for a in new if a['file'] not in have]
uniq={a['file']:a for a in assets}; assets=sorted(uniq.values(), key=lambda a:a['file'])
def canon(v):
    if isinstance(v,list): return '['+','.join(canon(x) for x in v)+']'
    if isinstance(v,dict): return '{'+','.join(json.dumps(k)+':'+canon(v[k]) for k in sorted(v))+'}'
    return json.dumps(v)
sha=hashlib.sha256(canon({'schema':'gc500-media-v1','assets':assets}).encode()).hexdigest()
json.dump({'assets':assets,'schema':'gc500-media-v1','sha256':sha},open(os.path.join(MEDIA,'manifest.json'),'w'))
json.dump(new,open('locfind/new_media.json','w'))
print('pictures', len(new), 'total bytes', sum(a['bytes'] for a in new), 'manifest', len(assets), sha[:12])
