"""Author: Andrew Fisher. Prepare a verified-2026 vector-plan Explorer; no network writes."""
from pathlib import Path
import argparse, hashlib, json, re, sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_MANIFEST = '8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6'
BASE = {'explorer/index.html':'91e0ae84b59235c963eeb93ff79e9263844b333565b6b7c3726a62a918fd6d20',
'explorer/explorer.js':'e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a',
'explorer/explorer-merge.js':'7c276bb181541e506e983356fb746cd4233c77c6c973c178c7da27d458ad66c4',
'poc3d/index.html':'f8403834a1336ce15e9e296f46413bbf3dfd132bc5011a02a49813340c694efb'}
PLAN_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'
def sha(b): return hashlib.sha256(b).hexdigest()
def one(s,old,new,label): return rep(s,old,new,label,'Explorer1283')
def span(s,start,end,new,label):
 a=s.find(start); b=s.find(end,a)
 if a<0 or b<0 or s.count(start)!=1 or s.count(end)!=1: raise ValueError('Ambiguous '+label)
 return one(s,s[a:b],new,label)
def explorer(s):
 if 'PLAN_ONLY1283' in s: raise ValueError('Already applied')
 s=one(s,"let camera =", "const PLAN_ONLY1283 = true;\nlet camera =",'policy')
 s=one(s,"function setMode(m) {", "function setMode(m) {\n  m = 'original'; // Every old hash, saved choice, keyboard and adapter call resolves to the verified plan.",'central mode guard')
 s=one(s,"const MODE_KEY = 'gc500.explorer.mode', MODES = ['original', 'hybrid', 'satellite'];", "const MODE_KEY = 'gc500.explorer.mode', MODES = ['original'];",'mode allowlist')
 s=span(s,'function chooseMode(m) {','\n$(\'satRetry\').onclick',"""function chooseMode(m) { modeChosen = true; try { localStorage.setItem(MODE_KEY, 'original'); } catch (e) {} setMode('original'); }
function startMode() { try { localStorage.setItem(MODE_KEY, 'original'); const u=new URL(location.href); if (/^(hybrid|satellite|3d)$/.test(u.hash.slice(1))) u.hash='original'; if (u.searchParams.has('mode')) u.searchParams.delete('mode'); history.replaceState(null,'',u.pathname+u.search+u.hash); } catch(e) {} return 'original'; }
document.querySelectorAll('.modes button').forEach(b => b.onclick = () => chooseMode('original'));
""",'restore original only')
 s=one(s,"function ensureKey() { if (mapKey || gSession)", "function ensureKey() { if (PLAN_ONLY1283) return Promise.resolve(null); if (mapKey || gSession)",'no imagery keys')
 s=one(s,"    if (UNDER.length && PYR) drawUnderlay(v); else { const pic = preview || overview; if (pic) ctx.drawImage(pic, 0, 0, SHEET_W, SHEET_H); if (!UNDER_DONE) probeF.underMiss++; } }", "    /* Verified 2026 vectors only; the sheet's old aerial is deliberately excluded. */ }",'no aerial underlay')
 s=one(s,"const pLabels = once('labels', () => getJSON('assets/source-labels.json?v=84e7872ac157')), pUnder = getJSON('assets/underlay/manifest.json?v=84e7872ac157');", "const pLabels = once('labels', () => getJSON('assets/source-labels.json?v=84e7872ac157')); UNDER_DONE = true;",'no aerial request')
 s=span(s,"    /* the whole sheet in one small picture:","    const [geo, pyr]", "    // No flattened overview: it includes the undated aerial. The minimap is generated from verified vector tiles.\n",'no aerial overview')
 s=one(s,"    BOOT = pyr && pyr.boot && pyr.boot.meta ? pyr.boot : null;", "    BOOT = pyr && pyr.boot && pyr.boot.meta ? pyr.boot : null;\n    if (!BOOT || BOOT.meta.sha256 !== '"+PLAN_SHA+"' || BOOT.meta.issued !== '2 Oct 2026') throw new Error('The 2026 plan source could not be verified. Please reload or contact the dashboard owner.');",'drawing provenance guard')
 s=one(s,"function svgFromWorker(v, width, height, all = false, m = mode) {", "function svgFromWorker(v, width, height, all = false, m = mode) {\n  m = 'hybrid'; // Preserve vectors and symbols, omit classified aerial images even in PNG exports.",'vector export')
 s=one(s,"if (mode === 'original' && UNDER.length)","if (!PLAN_ONLY1283 && mode === 'original' && UNDER.length)",'no export aerial job')
 # Original export underlay is blocked; worker supplies the same transparent 2026 geometry as the pyramid.
 s=one(s,"    if (mode === 'original') { g.save();", "    if (!PLAN_ONLY1283 && mode === 'original') { g.save();",'no export old overview')
 s=span(s,"function legendHtml() {", "\n/* ---------------------------------------------------------------- find: categories", "function legendHtml() { return '<button type=\"button\" class=\"jump\" data-closelegend813>Close</button><h4>2026 master plan</h4><p>D001-26003-03 · issued 2 Oct 2026 · © iEDM. Drawing vectors, labels, symbols and lettering are retained; the old aerial background is excluded.</p><p>2026 aerial and photogrammetric 3D imagery are not yet verified. They are unavailable in this explorer.</p><p>PDF SHA-256 "+PLAN_SHA+"</p>'; }\n",'honest sources')
 s=one(s,"'Drawing © iEDM · D001 rev 03 · issued 2 Oct'", "'Drawing © iEDM · D001 rev 03 · issued 2 Oct 2026 · vectors only'",'attribution year')
 s=one(s,"find: code => readyPromise.then(() => { const q = $('q'); if (q) q.value = String(code || ''); return selectCode(String(code || '')); }),", """find: code => readyPromise.then(() => {
 const value=String(code||'').trim(),q=$('q');if(q)q.value=value;
 if(selectCode(value))return true;
 const exact=(P.labels||[]).filter(r=>norm(r[0])===norm(value));
 if(exact.length===1){clearSelection813();const r=exact[0],bb=r.slice(1),cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,aspect=sw/sh,h=Math.max(62,(bb[3]-bb[1])*9,(bb[2]-bb[0])*5/aspect),w=h*aspect;highlight=bb;gotoRect([cx-w/2,cy-h/2,cx+w/2,cy+h/2],r[0]);pickedLocation813();return true;}
 search();panel813(true);toast(exact.length>1?'More than one matching label is on the 2026 plan. Choose the intended result.':'No exact reference or label matches on the 2026 plan. Check the search results.');return false;
 }),""",'ready-aware exact source label fallback')
 s=one(s,"function afterFirstSharp() { maybeReady(); }", """function afterFirstSharp() { maybeReady(); }
// Author: Andrew Fisher. A real vector-only overview, assembled once from the lowest pyramid level.
async function miniPlan1283() {
 try { const lev=PYR.levels.find(x=>x.nx===1&&x.ny===1); if(!lev) return;
 const part=lev.tiles['0_0']; if(!part) return;
 const response=await fetch('assets/vt/'+lev.file,{headers:{Range:'bytes='+part[0]+'-'+(part[0]+part[1]-1)}});
 if(!response.ok) throw new Error('Plan overview unavailable'); let blob=await response.blob(); if(response.status!==206) blob=blob.slice(part[0],part[0]+part[1]);
 const bm=await createImageBitmap(blob), c=document.createElement('canvas'); c.width=Math.ceil(SHEET_W*lev.scale); c.height=Math.ceil(SHEET_H*lev.scale);
 const g=c.getContext('2d'); g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(bm,0,0);bm.close();$('miniImg').src=c.toDataURL('image/png');
 } catch(e) { $('mini').hidden=true; }
}
""",'vector minimap')
 s=one(s,"    alignmentPanel(); ready = true;", "    alignmentPanel(); miniPlan1283(); ready = true;",'start vector minimap')
 return s

def merge(s):
 s=one(s,"  function enter3d() {", "  function enter3d() {\n    if (typeof PLAN_ONLY1283 !== 'undefined' && PLAN_ONLY1283) { if (typeof toast === 'function') toast('2026 3D imagery is not yet verified. Showing the 2026 plan.'); return false; }",'block3d')
 s=one(s,"  function addButton() {", "  function addButton() {\n    if (typeof PLAN_ONLY1283 !== 'undefined' && PLAN_ONLY1283) return;",'remove3d control')
 s=one(s,"    G.mode3d = on => (on ? enter3d() : exit3d());", """    G.gotoLatLon1283 = (lat,lon,label='Recorded location') => {
      if(!GEO||!GEO.main||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<=-90||lat>=90||lon< -180||lon>180)return false;
      const z=z18Of(lat,lon), im=invAff(GEO.main.sheet_to_z18px), main=im&&apAff(im,z[0],z[1]);let p=null;
      if(main&&inRect(GEO.main.sheet_region_pts,main[0],main[1])&&!(GEO.main.exclude_pts||[]).some(r=>inRect(r,main[0],main[1])))p=main;
      if(!p&&GEO.inset){const ii=invAff(GEO.inset.sheet_to_z18px),q=ii&&apAff(ii,z[0],z[1]);if(q&&inRect(GEO.inset.sheet_region_pts,q[0],q[1]))p=q;}
      if(!p){toast('This recorded location is outside the 2026 plan. Its position has not been moved.');return false;}
      clearSelection813();gotoRect([p[0]-20,p[1]-20,p[0]+20,p[1]+20],String(label));return true;
    };
    G.mode3d = on => (on ? enter3d() : exit3d());""",'registered main and inset navigation')
 s=one(s,"el.innerHTML = `${info && info.img ?", "el.innerHTML = `${!PLAN_ONLY1283 && info && info.img ?",'exclude flattened aerial crop from cards')
 return s

def index(s):
 s=span(s,"  P.ov = fetch(","})();\n</script>\n<style>", "  try { localStorage.setItem('gc500.explorer.mode','original'); } catch(e) {}\n",'remove imagery prefetch')
 s=re.sub(r'\s*<button data-mode="(?:hybrid|satellite)"[^\n]*</button>', '',s)
 s=s.replace('Map explorer · plan, satellite and 3D · D001 rev 03 · issued 2 Oct · Master Layout Plan','Map explorer · 2026 master plan · D001 rev 03 · issued 2 Oct 2026')
 s=s.replace('Original plan','2026 plan')
 s=one(s,'<p id="sourceImagery813">', '<p id="sourceImagery813">', 'source paragraph anchor')
 s=span(s,'<p id="sourceImagery813">','<button class="jump" id="legendBtn">', '<p id="sourceImagery813"><b>2026 sources only</b> The drawing’s vectors, labels and symbols are shown on a clean background. The old aerial is excluded.</p><p>2026 aerial and 3D imagery are not yet verified.</p>', 'source notice')
 s=s.replace('The plan opens from pre-rendered tiles; the photograph is fetched only for the view you are looking at, only in the satellite modes.','The verified 2026 master plan opens from sharp vector tiles. Search, pan and zoom to find your equipment.')
 s=one(s,'<script src="explorer-fix887.js?v=6996471a6a0f"></script>', '<script src="explorer-fix887.js?v=6996471a6a0f"></script>\n<script>/* Author: Andrew Fisher. The 2026 plan labels are always retained. */const fm1283=document.getElementById("fmPlan");if(fm1283){fm1283.checked=true;fm1283.disabled=true;fm1283.closest("label").hidden=true;}const ft1283=document.getElementById("fmFooter");if(ft1283)ft1283.textContent="2026 master plan labels are retained. Plan alignment is for site orientation, not set-out.";</script>','honest fixed fencing layer')
 s=s.replace('<style>','<style>\n/* Author: Andrew Fisher. Controls for unavailable imagery are removed from this 2026-only view. */\n#layers .ctl,#layers label:has(#insetOn),#about813 .card:first-child,#fencePanel label:has(#fmPlan){display:none}\n',1)
 return s

def prepare(source,out):
 if out.exists() and any(out.iterdir()): raise ValueError('Use a fresh empty output directory')
 old={}
 for p,h in BASE.items():
  b=(source/p).read_bytes()
  if sha(b)!=h: raise ValueError('Wrong source '+p)
  old[p]=b.decode()
 changed={'explorer/explorer.js':explorer(old['explorer/explorer.js']), 'explorer/explorer-merge.js':merge(old['explorer/explorer-merge.js'])}
 page=index(old['explorer/index.html'])
 for p,s in changed.items(): page=one(page,Path(p).name+'?v='+BASE[p][:12],Path(p).name+'?v='+sha(s.encode())[:12],'script pin')
 changed['explorer/index.html']=page
 changed['poc3d/index.html']='<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GC500 2026 map</title><style>body{background:#15110e;color:#f4efe9;font:16px system-ui;padding:2rem}a{color:#ff8b45}</style><h1>2026 master plan</h1><p>2026 3D imagery is not yet verified. Opening the 2026 plan.</p><a id="plan" href="../explorer/index.html#original">Open the 2026 plan</a><script>/* Author: Andrew Fisher. v12.83 source policy. */ const u=new URL("../explorer/index.html",location.href),q=new URLSearchParams(location.search);for(const k of ["find","embed","back"])if(q.has(k))u.searchParams.set(k,q.get(k));u.hash="original";document.getElementById("plan").href=u.href;location.replace(u.href);</script></html>'

 evidence={'author':'Andrew Fisher','baseManifest':BASE_MANIFEST,'files':{}}
 for p,s in changed.items():
  b=s.encode();f=out/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(b);evidence['files'][p]={'base':BASE[p],'sha256':sha(b),'bytes':len(b)}
 (out/'source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n')
 return evidence
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('out',type=Path);a=p.parse_args();print(json.dumps(prepare(a.source,a.out),indent=2))
