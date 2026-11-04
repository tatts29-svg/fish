"""Author: Andrew Fisher. Bright source outlines and lightweight map location rings."""
from pathlib import Path
import re,sys,hashlib
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='567b19b3b767b66a273d0956aced913b942808f98e8f0c1f6075114c17f87261'
def apply(s):
 if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live v12.97 base')
 def r(t,a,b,label):return rep(t,a,b,label,'map glow v12.98')
 def script(sid,fn):
  nonlocal s
  matches=list(re.finditer(r'(<script\b[^>]*\bid="'+re.escape(sid)+r'"[^>]*>)(.*?)(</script>)',s,re.S))
  if len(matches)!=1:raise ValueError('Expected one script '+sid)
  m=matches[0];s=s[:m.start(2)]+fn(m[2])+s[m.end(2):]
 def find(t):
  t=r(t,"const VERSION = 'v12.97', RENDER_REV = 'plan-outlines-2'","const VERSION = 'v12.98', RENDER_REV = 'plan-outlines-glow-3'",'cache render revision')
  # Static export retains a bright location circle; moving pulse is DOM-only.
  t=r(t,'const parts = projected(m, p);','W.MapBeacon1298?.paintRing(g,m,p);\n const parts = projected(m, p);','static exported ring')
  t=r(t,'g.globalAlpha = neutral ? .18 : .3; g.strokeStyle = m.colour; g.lineWidth = neutral ? 7 : 10;', 'g.globalAlpha = neutral ? .4 : .5; g.strokeStyle = m.colour; g.lineWidth = neutral ? 12 : 16;','strong static outline halo')
  t=r(t,"g.lineWidth = 5; g.strokeStyle = '#0b151c'; g.stroke(); g.lineWidth = 2.8;", "g.lineWidth = 9; g.strokeStyle = '#0b151c'; g.stroke(); g.lineWidth = 5;",'strong static outline edge')
  anchor='/* Author: Andrew Fisher. v11.76 - find it on the map'
  t=r(t,anchor,(HERE/'map_beacon1298_src.js').read_text()+'\n'+anchor,'shared projected SVG beacons')
  t=r(t,"if(L.demob1297)W.DemobShapes1297.paint(c,L.demob1297,{x:Wd/2,y:H/2,width:Wd,height:H});", "const projection1298={x:Wd/2,y:H/2,width:Wd,height:H};\n if(L.demob1297)W.DemobShapes1297.paint(c,L.demob1297,projection1298);",'capture satellite projection')
  t=r(t,"return {view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan: false, source: 'satellite', across: Math.round(Wd * mpp)};", "return {_beacon1298:W.MapBeacon1298.capture(L.demob1297,projection1298,{width:Wd,height:H+B}),view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan: false, source: 'satellite', across: Math.round(Wd * mpp)};",'satellite picture metadata')
  t=r(t,"if(L.demob1297){\n  const fit1297=sheetFitOf((DATA.sheets||[]).find(s=>s.key==='D001'));\n  W.DemobShapes1297.paint(c,L.demob1297,{x:X,y:Y,width:Wd,height:H,projectSheet:(fx,fy)=>({x:(((fx-fit1297.fx.c)/fit1297.fx.k)*FX-x0)/fw*Wd,y:(((fy-fit1297.fy.c)/fit1297.fy.k)*FY-y0)/fh*H})});\n }else pinAt(c, X, Y, mPx, String(L.tag || L.label));", """let projection1298={x:X,y:Y,width:Wd,height:H};
 if(L.demob1297){
  const fit1297=sheetFitOf((DATA.sheets||[]).find(s=>s.key==='D001'));
  if(fit1297)projection1298.projectSheet=(fx,fy)=>({x:(((fx-fit1297.fx.c)/fit1297.fx.k)*FX-x0)/fw*Wd,y:(((fy-fit1297.fy.c)/fit1297.fy.k)*FY-y0)/fh*H});
  W.DemobShapes1297.paint(c,L.demob1297,projection1298);
 }else pinAt(c, X, Y, mPx, String(L.tag || L.label));""",'capture exact aerial crop')
  t=r(t,"return {view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan, source: 'aerial', across: Math.round(fw / pxPerM)};", "return {_beacon1298:W.MapBeacon1298.capture(L.demob1297,projection1298,{width:Wd,height:H+B}),view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan, source: 'aerial', across: Math.round(fw / pxPerM)};",'aerial picture metadata')
  t=r(t,"pics[V.key] = p; img.src = p.dataUrl; img.hidden = false;", "pics[V.key] = p; img.onload=()=>{if(img.isConnected)W.MapBeacon1298.picture(img.parentNode,p._beacon1298,V.key);}; img.src = p.dataUrl; img.hidden = false;",'full picture overlay after load')
  return t
 script('find1178-script',find)
 def singles(t):
  t=r(t,'const revoke = url => { try { W.URL.revokeObjectURL(url); } catch (x) {} };', 'const revoke = url => { W.MapBeacon1298.forget(url); try { W.URL.revokeObjectURL(url); } catch (x) {} };','release snapshot with every cached image URL')
  t=r(t,"im.removeAttribute('src'); im.classList.remove('on');", "W.MapBeacon1298.detach(im.parentNode); im.removeAttribute('src'); im.classList.remove('on');",'detach evicted card overlay')
  t=r(t,'return b ? URL.createObjectURL(b) : null;', "const url=b?URL.createObjectURL(b):null;if(url)W.MapBeacon1298.remember(url,pic._beacon1298);return url;",'store small projection with cached picture')
  t=r(t,"D.querySelectorAll('#pane-demob img[data-pi1238]:not(.on)').forEach(im => { if (im.getAttribute('data-pi1238') !== id) return; im.src = url; im.classList.add('on'); const w = im.parentNode && im.parentNode.querySelector('.w1238'); if (w) w.remove(); });", """D.querySelectorAll('#pane-demob img[data-pi1238]').forEach(im => { if (im.getAttribute('data-pi1238') !== id) return;
  const mount=()=>{if(im.isConnected&&im.getAttribute('src')===url&&!im.parentNode.querySelector('svg.mb1298'))W.MapBeacon1298.cached(im.parentNode,url,id.slice(id.lastIndexOf('|')+1));};
  if(!im.classList.contains('on')){im.onload=mount;im.src=url;im.classList.add('on');}else if(im.complete&&im.naturalWidth)mount();else im.onload=mount;
  const w=im.parentNode&&im.parentNode.querySelector('.w1238');if(w)w.remove(); });""",'attach visible cached map overlay')
  return t
 script('singles1238-script',singles)
 sys.path.insert(0,str(HERE));from build_integration1298 import apply as apply_build
 s=apply_build(s)
 s=r(s,"+' · v12.97';","+' · v12.98';",'footer')
 s=r(s,'<style id="singles1238-style">','<style id="map-beacon1298-style">\n'+(HERE/'map_beacon1298_src.css').read_text()+'\n</style>\n<style id="singles1238-style">','shared overlay styles')
 return s
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(apply(p.read_text()))
