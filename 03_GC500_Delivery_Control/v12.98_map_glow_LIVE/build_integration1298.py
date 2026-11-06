"""Author: Andrew Fisher. Keep native Build lifecycle and add bounded SVG beacons."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(s):
    if 'W.BuildBeacon1298=api' in s:
        raise ValueError('Build beacons v12.98 already applied')
    if 'W.BuildShapes1297=Object.freeze' not in s:
        raise ValueError('Requires v12.97 Build plan geometry')

    def r(old, new, label):
        nonlocal s
        s = rep(s, old, new, label, 'Build beacons v12.98')

    opening = '<script id="threemaps1261-script">'
    if s.count(opening) != 1:
        raise ValueError('Expected one native three-map compositor')
    start = s.index(opening) + len(opening)
    end = s.index('</script>', start)
    previous = s[start:end]
    if previous.count('W.composeMaps1261 = async function') != 1:
        raise ValueError('Unexpected native compositor')
    r(previous, '\n' + (HERE / 'build_beacon1298_src.js').read_text() + '\n', 'exact three-panel projection')
    r('async function draw(id, marker1297) {',
      'async function draw(id, marker1297, onMeta1298) {', 'optional native plan projection capture')
    r("""  W.DemobShapes1297?.paint(c,marker1297,{x:X,y:Y,width:OUT.w,height:OUT.h,
   projectSheet:(fx,fy)=>({x:(fx*lv.w-x0)*sc,y:(fy*lv.h-y0)*sc})});""",
      """  const projection1298={x:X,y:Y,width:OUT.w,height:OUT.h,
   projectSheet:(fx,fy)=>({x:(fx*lv.w-x0)*sc,y:(fy*lv.h-y0)*sc})};
  W.DemobShapes1297?.paint(c,marker1297,projection1298);
  if(typeof onMeta1298==='function'&&W.MapBeacon1298)onMeta1298(W.MapBeacon1298.capture(marker1297,projection1298,{width:OUT.w,height:OUT.h}));""",
      'capture the unchanged native plan crop')
    r("const box=button.querySelector('.b1247-thumb');if(box){box.querySelectorAll('img')",
      "const box=button.querySelector('.b1247-thumb');if(box){W.BuildBeacon1298.detach(box);box.querySelectorAll('img')",
      'remove Build overlay with lifecycle image')
    r(""" function show(button,url){
  if(!button.isConnected)return;waiting(button);const box=thumb(button),image=D.createElement('img');
  image.alt='Recorded map location for '+button.dataset.build1247Key;image.decoding='async';image.src=url;box.replaceChildren(image);button.dataset.picture1247='ready';
 }""", """ function show(button,picture){
  if(!button.isConnected)return;waiting(button);const box=thumb(button),image=D.createElement('img'),url=typeof picture==='string'?picture:picture.url;
  W.BuildBeacon1298.detach(box);
  image.onload=()=>{if(image.isConnected&&box.contains(image)&&button.dataset.picture1247==='ready')W.BuildBeacon1298.attach(box,picture);};
  image.alt='Recorded map location for '+button.dataset.build1247Key;image.decoding='async';image.src=url;box.replaceChildren(image);button.dataset.picture1247='ready';
 }""", 'attach Build beacons after matching picture loads')
    r("'build-layout1297',W.BuildShapes1297.signature(L)",
      "'build-layout1298',W.BuildShapes1297.signature(L)", 'version Build preview cache key')
    return s
