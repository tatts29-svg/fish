import pymupdf, sys, json
from PIL import Image, ImageDraw
doc=pymupdf.open('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/inputs_07oct/D001-26003-03-MASTER.pdf'); pg=doc[0]
def crop(name,cx,cy,half=14,marks=(),dpi=1400):
    r=pymupdf.Rect(cx-half,cy-half,cx+half,cy+half)
    pix=pg.get_pixmap(clip=r,dpi=dpi)
    path=f'doorcrops/{name}.png'; pix.save(path)
    im=Image.open(path).convert('RGB'); d=ImageDraw.Draw(im); s=pix.width/(2*half)
    for (x,y,col) in marks:
        px,py=(x-r.x0)*s,(y-r.y0)*s
        d.ellipse([px-6,py-6,px+6,py+6],outline=col,width=3)
    d.text((5,5),f'{name}  centre {cx:.2f},{cy:.2f} pt (2 Oct)  +/-{half}pt',fill=(255,0,0))
    im.save(path); return path
if __name__=='__main__':
    for spec in json.loads(sys.argv[1]):
        print(crop(spec[0],spec[1],spec[2],spec[3] if len(spec)>3 else 14,[tuple(m) for m in (spec[4] if len(spec)>4 else [])]))
