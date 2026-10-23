"""Author: Andrew Fisher. Reproducible small vector font for map labels, no remote font request."""
import base64, io, json, math
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

HERE=Path(__file__).resolve().parent
# Open stroked line drawings on a 24 by 24 grid, shared by the font and visible key.
box=[[5,21],[5,4],[19,4],[19,21],[5,21]]
symbols={
 'toilet':('Flush toilet',[box,[[5,8],[19,8]],[[14,11],[14,21]],[[10,14],[11,14]]]),
 'sewer':('Sewer-connected toilet',[[[5,17],[5,3],[19,3],[19,17],[5,17]],[[14,7],[14,17]],[[7,20],[20,20],[20,23]],[[12,17],[12,20]]]),
 'block':('Toilet block',[[[2,21],[2,5],[22,5],[22,21],[2,21]],[[8,5],[8,21]],[[15,5],[15,21]],[[5,12],[5,14]],[[11,12],[11,14]],[[18,12],[18,14]]]),
 'pan16':('16-pan block',[[[1,21],[1,4],[23,4],[23,21],[1,21]],[[5,10],[7,8],[7,17]],[[17,8],[12,8],[12,17],[18,17],[18,12],[12,12]]]),
 'accessible':('Accessible toilet',[[[12,7],[12,14],[18,14],[21,20]],[[12,10],[18,10]],[[8,12],[5,15],[5,19],[8,22],[13,22],[16,19]],[[12,2],[14,4],[12,6],[10,4],[12,2]]]),
 'pee':('Pee panel / urinal',[[[2,22],[2,3],[22,3],[22,22]],[[12,3],[12,22]],[[5,8],[9,8],[9,15],[5,15],[5,8]],[[15,8],[19,8],[19,15],[15,15],[15,8]]]),
 'tank':('Waste tank',[[[3,7],[6,4],[18,4],[21,7],[18,10],[6,10],[3,7],[3,19],[6,22],[18,22],[21,19],[21,7]],[[3,16],[21,16]]]),
 'trailer':('Toilet trailer',[[[4,18],[4,3],[19,3],[19,18],[4,18],[23,18]],[[12,7],[12,18]],[[7,20],[9,22],[7,24],[5,22],[7,20]],[[17,20],[19,22],[17,24],[15,22],[17,20]]]),
 'generator':('Generator',[[[2,19],[2,6],[22,6],[22,19],[2,19]],[[6,2],[17,2]],[[13,8],[9,13],[14,13],[11,17]],[[4,22],[7,22]],[[17,22],[20,22]]]),
 'building':('Building',[[[2,22],[2,7],[12,2],[22,7],[22,22],[2,22]],[[6,11],[10,11],[10,16],[6,16],[6,11]],[[14,22],[14,11],[19,11],[19,22]]]),
 'vms':('VMS board',[[[2,3],[22,3],[22,16],[2,16],[2,3]],[[5,9],[18,9],[14,6]],[[18,9],[14,12]],[[12,16],[12,21]],[[5,22],[19,22]]]),
 'light':('Light tower',[[[12,6],[12,21]],[[5,22],[19,22]],[[2,2],[9,2],[9,7],[2,7],[2,2]],[[15,2],[22,2],[22,7],[15,7],[15,2]],[[9,4],[15,4]]]),
 'barrier':('Barrier',[[[2,20],[5,5],[19,5],[22,20],[2,20]],[[4,15],[20,15]],[[7,8],[9,8]],[[15,8],[17,8]]]),
 'plant':('Access / plant equipment',[[[3,22],[3,14],[17,14],[17,22]],[[5,13],[5,6],[12,6],[16,13]],[[20,3],[20,21],[24,21]],[[6,20],[8,22],[6,24],[4,22],[6,20]],[[14,20],[16,22],[14,24],[12,22],[14,20]]]),
 'unknown':('Other type · see details',[[[4,3],[20,3],[20,22],[4,22],[4,3]],[[9,8],[15,8],[15,12],[12,14],[12,16]],[[12,19],[12,19.3]]])
}

def glyph(lines):
 pen=TTGlyphPen(None)
 def polygon(points):
  pen.moveTo((round((points[0][0]+2)*40),round((23-points[0][1])*40)))
  for x,y in points[1:]:pen.lineTo((round((x+2)*40),round((23-y)*40)))
  pen.closePath()
 for line in lines:
  for (x,y),(a,b) in zip(line,line[1:]):
   dx,dy=a-x,b-y;dist=math.hypot(dx,dy)
   if not dist:continue
   ox,oy=-dy/dist*.8,dx/dist*.8
   polygon([(x+ox,y+oy),(a+ox,b+oy),(a-ox,b-oy),(x-ox,y-oy)])
  for x,y in line:
   polygon([(x+.8*math.cos(-i*math.pi/6),y+.8*math.sin(-i*math.pi/6)) for i in range(12)])
 return pen.glyph()

names=['.notdef']+list(symbols)
fb=FontBuilder(1000,isTTF=True);fb.setupGlyphOrder(names)
fb.setupCharacterMap({0xE100+i:name for i,name in enumerate(symbols)})
fb.setupGlyf({name:glyph(symbols[name][1]) if name in symbols else TTGlyphPen(None).glyph() for name in names})
fb.setupHorizontalMetrics({name:(1200,0) for name in names})
fb.setupHorizontalHeader(ascent=1000,descent=-200)
fb.setupNameTable({'familyName':'GC500 Map Units','styleName':'Regular','uniqueFontIdentifier':'GC500-Map-Units-1145','fullName':'GC500 Map Units','psName':'GC500MapUnits'})
fb.setupOS2(sTypoAscender=1000,sTypoDescender=-200,usWinAscent=1000,usWinDescent=200)
fb.setupPost();fb.setupMaxp();fb.font['head'].created=fb.font['head'].modified=2082844800
fb.font.recalcTimestamp=False;fb.font.flavor='woff';out=io.BytesIO();fb.font.save(out)
data={'font':base64.b64encode(out.getvalue()).decode(),'symbols':{n:{'label':label,'glyph':chr(0xE100+i),'lines':lines} for i,(n,(label,lines)) in enumerate(symbols.items())}}
(HERE/'symbols.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
print('Vector symbols:',len(symbols),'font bytes:',len(out.getvalue()))
