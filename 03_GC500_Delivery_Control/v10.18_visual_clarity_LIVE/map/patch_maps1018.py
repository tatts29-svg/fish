"""Author: Andrew Fisher. Exact-source map clarity patch; no geometry or native data changes."""
from pathlib import Path
import hashlib,json,sys
HERE=Path(__file__).resolve().parent
BASE={'explorer.js':'d35ae04911e83dcb140dcc4f6eb23ed69dff39b0169609f7b2974dd5c9c12c69','explorer-merge.js':'8c321e5632f410df5ad17021f32cd50b70038e84ac419cb6ef3891115e691ef1','index.html':'08e131d11647c58239e4c21686274e3405f47127c929314eb5b1e8994cc9d05a'}
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
def patch(source):
 out={}
 for name,digest in BASE.items():
  s=(source/name).read_text()
  if sha(s)!=digest:raise ValueError('Map source changed: '+name)
  out[name]=s
 def once(name,old,new):
  if out[name].count(old)!=1:raise ValueError('Expected one map anchor: '+old[:100])
  out[name]=out[name].replace(old,new)
 js='explorer.js';merge='explorer-merge.js'
 once(js,'function satCanFetch() {',(HERE/'render1018.js').read_text()+'\nfunction satCanFetch() {')
 once(js,'if (k < 1) rotAnim = requestAnimationFrame(step);','if (k < 1) rotAnim = requestAnimationFrame(step); else rotAnim = 0;')
 once(js,"if (!animate || matchMedia('(prefers-reduced-motion:reduce)').matches)",'if (!animate || mapMotionOff1018())')
 once(js,"const calm = () => matchMedia('(prefers-reduced-motion:reduce)').matches;",'const calm = () => mapMotionOff1018();')
 once(js,'  dropVTQueue(); requestPaint();\n}',"  dropVTQueue(); requestPaint();\n  window.dispatchEvent(new Event('gc500viewchange1018'));\n}")
 once(js,'window.GC500Explorer = {fencingAdapter:', 'window.GC500Explorer = {viewEvents1018:true,fencingAdapter:')
 once(js,'if (!PYR) return Math.round(need * 4) / 4;','if (!PYR) return Math.ceil((need-1e-12) * 4) / 4;')
 once(js,'if (L >= need - .07) return L;','if (L >= need-1e-12) return L;')
 once(js,'Math.ceil((need - .07) * 2) / 2','Math.ceil((need-1e-12) * 2) / 2')
 once(js,'function requestCoarse(v, R, z) {','function requestCoarse(v, R, z, budget = 36) {')
 once(js,'if ((r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > 36) return;','if ((r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > Math.min(36,budget)) return;')
 once(js,'const t = tiles.get(tileKey(zc, tx, ty)); if (t)', 'const coarseKey1018=tileKey(zc,tx,ty);satWanted.add(coarseKey1018);const t = tiles.get(coarseKey1018); if (t)')
 once(js,'let anyOver = false, missing = 0, failed = 0, shown = 0, nextRetry = Infinity;', 'satVisible1018.clear();perf.satLimited1018=false;\n  let anyOver = false, missing = 0, failed = 0, shown = 0, nextRetry = Infinity;')
 once(js,'    const {z, over} = tileZoomFor(v, R.M, R.key); anyOver = anyOver || over;\n    const rg = satRange(R, z, v.x, v.y, v.x + v.w, v.y + v.h); if (!rg) continue;', '    const chosen1018=satelliteView1018(v,R,R.key);if(!chosen1018)continue;\n    const {z,over,range:rg,cells:visible1018}=chosen1018;anyOver=anyOver||over;perf.satLimited1018=perf.satLimited1018||chosen1018.limited;\n    for(const [tx,ty] of visible1018)satVisible1018.add(tileKey(z,tx,ty));')
 once(js,'    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 120) continue;                       /* never a flood: the zoom choice keeps this small */\n    if (fetchOK) requestCoarse(v, R, z);','    if (fetchOK) requestCoarse(v, R, z, TILE_CAP-visible1018.length);')
 once(js,'    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {\n      const t = tiles.get(tileKey(z, tx, ty));','    for (const [tx,ty] of visible1018) {\n      const t = tiles.get(tileKey(z, tx, ty));')
 once(js,"    const arr = [...tiles.entries()].sort((a, b) => a[1].at - b[1].at);","    const rank1018=k=>satVisible1018.has(k)?2:satWanted.has(k)?1:0;\n    const arr = [...tiles.entries()].sort((a,b)=>rank1018(a[0])-rank1018(b[0])||a[1].at-b[1].at);")
 once(js,"  if (mode !== 'original' && satCanFetch()) for (const R of regionsForTiles(v)) { const {z} = tileZoomFor(v, R.M), r = satRange(R, z, v.x, v.y, v.x + v.w, v.y + v.h); if (!r || (r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > 120) continue;\n    for (let ty = r.ty0; ty <= r.ty1; ty++) for (let tx = r.tx0; tx <= r.tx1; tx++) requestTile(z, tx, ty, -100 + Math.hypot(tx - (r.tx0 + r.tx1) / 2, ty - (r.ty0 + r.ty1) / 2), true); }", "  if (mode !== 'original' && satCanFetch()) for (const R of regionsForTiles(v)) { const chosen1018=satelliteView1018(v,R);if(!chosen1018)continue;const {z,range:r,cells}=chosen1018;\n    for(const [tx,ty] of cells)requestTile(z,tx,ty,-100+Math.hypot(tx-(r.tx0+r.tx1)/2,ty-(r.ty0+r.ty1)/2),true); }")
 for old in ['m.z !== z || m.x0 !== x0 || m.y0 !== y0 || m.canvas.width < W || m.canvas.height < H','m.L !== L || m.x0 !== x0 || m.y0 !== y0 || m.canvas.width < W || m.canvas.height < H']:
  once(js,old,old+' || m.canvas.width*m.canvas.height > 2*W*H')
 # Each allocation path is unique in its context; keep both stores bounded to the current aspect ratio.
 old='if (m.canvas.width < W || m.canvas.height < H) { m.canvas.width = Math.max(W, m.canvas.width); m.canvas.height = Math.max(H, m.canvas.height);'
 if out[js].count(old)!=2:raise ValueError('Expected both mosaic allocation paths')
 out[js]=out[js].replace(old,'if (m.canvas.width < W || m.canvas.height < H || m.canvas.width*m.canvas.height > 2*W*H) { m.canvas.width = W; m.canvas.height = H;')
 once(js,'  if (!queue.size || running >= 8) return;','  if (!queue.size || running >= 8 || (firstSharp&&!shown887()) || under3d()) return;')
 once(js,'  if (!ready || !vtQueue.size) return;','  if (!ready || !vtQueue.size || (firstSharp&&!shown887()) || under3d()) return;')
 once(js,'.then(bm => { put(bm); vtRetry.delete(q.key);', '.then(bm => { if(ac.signal.aborted||vtInflight.get(q.key)!==ac){if(bm)bm.close();return;}put(bm); vtRetry.delete(q.key);')
 once(js,'function buildItems() {','function buildItems(host1018) {')
 once(js,'  HOST = hostPlan();','  HOST = host1018===undefined?hostPlan():host1018;')
 once(merge,'    buildItems();\n    const byCode', '    buildItems(h);\n    const byCode')
 once(merge,"${st887.why ? `<div class=\"xc-why\">${escH(st887.why)}</div>` : ''}",'')
 once(merge,'      ${lines887}', '      ${(st887&&st887.why)||lines887?`<details class="xc-s map-why1018"><summary>More info</summary>${st887&&st887.why?`<div class="xc-why">${escH(st887.why)}</div>`:\'\'}${lines887}</details>`:\'\'}')
 once(merge,"const quantities=el.querySelector('.map1010-quantities,.map-source1017'),quantityOpen=quantities?quantities.open:null,quantityFocus=!!(quantities&&focus===quantities.querySelector('summary'));","const disclosures1018=['map1010-quantities','map-source1017','map-why1018'].map(cls=>{const item=el.querySelector('.'+cls);return {cls,open:item?item.open:null,focused:!!(item&&focus===item.querySelector('summary'))}});")
 once(merge,"const nextQuantity=el.querySelector('.map1010-quantities,.map-source1017');if(nextQuantity&&quantityOpen!==null){nextQuantity.open=quantityOpen;if(quantityFocus)nextQuantity.querySelector('summary').focus({preventScroll:true});}","for(const item of disclosures1018){const next=el.querySelector('.'+item.cls);if(next&&item.open!==null){next.open=item.open;if(item.focused)next.querySelector('summary').focus({preventScroll:true})}}")
 once(js,"function startPulse() { pulseT0 = performance.now(); clearTimeout(pulseRAF); pulseRAF = setTimeout(() => { pulseRAF = 0; placePulse(null); }, 20000); requestPaint(); }", "function startPulse() { pulseT0 = performance.now(); clearTimeout(pulseRAF);$('pulse').classList.toggle('motion1018-off',mapMotionOff1018()); pulseRAF = setTimeout(() => { pulseRAF = 0; placePulse(null); }, mapMotionOff1018()?220:950); requestPaint(); }")
 once(js,"if(sel){ctx.save();ctx.strokeStyle='#ff821f';ctx.lineWidth=2.5*dpr;ctx.beginPath();ctx.arc(c.x,c.y,r+4*dpr,0,Math.PI*2);ctx.stroke();ctx.restore();}","if(sel){ctx.save();ctx.strokeStyle='#1b1009';ctx.lineWidth=5*dpr;ctx.beginPath();ctx.arc(c.x,c.y,r+4*dpr,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ff9a4d';ctx.lineWidth=2*dpr;ctx.stroke();ctx.restore();}")
 once(js,'} else { clearTimeout(done782Timer); done782Timer = 0; } }','} else { clearTimeout(done782Timer); done782Timer = 0;stopPulse();clearFeedback1018(); } }')
 once(js,'boot();\nwindow.__marksCount', (HERE/'feedback1018.js').read_text()+'\nboot();\nwindow.__marksCount')
 once(js,"' · photograph enlarged beyond its detail' : ''","' · photograph enlarged beyond its detail' : perf.satLimited1018?' · satellite detail reduced for this wide view':''")
 once(js,"(tileZoomAny(v) ? ' · imagery enlarged beyond its detail' : '')","(tileZoomAny(v) ? ' · imagery enlarged beyond its detail' : perf.satLimited1018?' · satellite detail reduced for this wide view':'')")
 once('index.html','</style>',(HERE/'feedback1018.css').read_text()+'\n</style>')
 for name in [js,merge]:
  once('index.html',name+'?v='+BASE[name][:12],name+'?v='+sha(out[name])[:12])
 return out
if __name__=='__main__':
 source,target=map(Path,sys.argv[1:3]);target.mkdir(parents=True,exist_ok=True);out=patch(source)
 evidence={'author':'Andrew Fisher','changedFiles':{}}
 for name,s in out.items():
  (target/name).write_text(s);evidence['changedFiles']['explorer/'+name]={'base':BASE[name],'candidate':sha(s),'bytes':len(s.encode())}
 (HERE/'evidence/source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n')
 print(json.dumps(evidence))
