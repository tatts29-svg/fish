"""Author: Andrew Fisher. Map Explorer source policy; apply to verified live v12.81."""
from pathlib import Path
import sys, hashlib
BASE_SHA256='3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b'
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(s, pretest=False):
 if not pretest and hashlib.sha256(s.encode()).hexdigest() != BASE_SHA256: raise ValueError('Expected exact verified v12.81 base')
 if 'map2026Only1283' in s: raise ValueError('Already patched v12.83')
 def one(old,new,label):
  nonlocal s;s=rep(s,old,new,label,'v12.83')
 one('function renderMap_held(){',"""function renderMap_held(){
 // Author: Andrew Fisher. The only eligible Map Explorer source is the verified 2026 vector plan.
 if (expOn()) { state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; EXP.mode3d = false; renderExplorerTab(); return; }
 $('#pane-map').innerHTML = paneHeadingHtml('map') + '<div class="card"><h2>2026 master plan</h2><p>The verified plan is available on the hosted GC500 dashboard. Offline copies do not contain a verified 2026 imagery layer.</p></div>'; return;
""",'all Explorer entry points')
 one("function expFind(key){", "function expFind(key){\n window.mapLocate1283Seq=(window.mapLocate1283Seq||0)+1;",'cancel old coordinate request')
 one("function expOpen2d(){ expCancel3d813();", "function expOpen2d(){ window.mapLocate1283Seq=(window.mapLocate1283Seq||0)+1; expCancel3d813();",'cancel on later plan navigation')
 one("function mapLocate_held(sheetKey, label, key, opts){", """function mapLocate_held(sheetKey, label, key, opts){
 if(expOn()) { const sh1283=DATA.sheets.find(s=>s.key===sheetKey); const master1283=sheetKey==='MASTER'||sheetKey==='D001'||(sh1283&&(sh1283.master||/^D001/.test(sh1283.sheet_id||'')));
  if(key||master1283) { expFind(key||label); return; }
  expOpen2d(); flash('This drawing is not available in the verified 2026 Map Explorer. Search the master plan for its reference.'); return;
 }
""",'route sheet-only and keyless references')
 one("let img = m && m.img && DATA.media && typeof DATA.media[m.img[0]] === 'string' ? DATA.media[m.img[0]] : null;", "let img = null; // The flattened plan thumbnail contains unverified aerial imagery.",'no old aerial reference thumbnail')
 one(" if (hosted) items.push(['proof3d', 'The 3D proof']);", " // Unverified 3D imagery is not offered in the 2026-only explorer.",'remove unavailable3D action')
 one("f.title = 'Satellite plan explorer';", "f.title = '2026 master plan explorer';",'frame title')
 one("explorer: {name: 'Satellite plan explorer', path: 'explorer/index.html', wait: 'Loading the plan explorer…', ref: 'strict-origin-when-cross-origin', sub: 'D001 rev 03 on real satellite · the plan itself, to 64,000 per cent'},", "explorer: {name: '2026 master plan explorer', path: 'explorer/index.html', wait: 'Loading the 2026 plan…', ref: 'strict-origin-when-cross-origin', sub: 'D001 rev 03 · issued 2 Oct 2026 · verified plan vectors'},",'machine map label')
 one("function expOpen3d(key){ EXP.mode3d = true; if (key) return expFind(key); if (!expOn()) return false; state.sheet = SAT_EXPLORER; state.mapMasterSeen = true; go('map'); renderMap(); expFlush3d(); return true; }", "function expOpen3d(key){ expCancel3d813(); return key ? expFind(key) : expOpen2d(); }",'legacy 3D routes to2026plan')
 one("function inject(m, tries){", "function inject(m, tries){\n if (m.key === 'map') { const M=make(m); M.items=M.all(); live.map=M; return; } // Preserve pin data, never mount the undated satellite surface.",'disable old satellite mount')
 one("var OPTIONS = [['plan', 'Site plan & equipment'], ['sat', 'VMS, generators & gates']];", "var OPTIONS = [['plan', '2026 master plan & equipment']];",'eligible map selection')
 one("function stored() { try { var v = localStorage.getItem(KEY); return v === 'plan' || v === 'sat' ? v : ''; } catch (e) { return ''; } }", "function stored() { try { localStorage.setItem(KEY, 'plan'); } catch(e) {} return 'plan'; }",'reset persisted satellite')
 one("  if (v !== 'plan' && v !== 'sat') return;", "  v = 'plan';",'force eligible map')
 one("The master plan with every reference. Plan, Sat + plan, Satellite and 3D are on the map itself.", "D001 issued 2 Oct 2026. Aerial and 3D views are unavailable until their 2026 capture dates are verified.",'source notice')
 # Coordinates remain the recorded values. The child uses the existing reviewed plan registration, not a new guessed location.
 one("try { mapLocate('MASTER', g.master); return true; } catch (e) { try { go('map'); } catch (x) {} return false; }", "try { return W.gate1156Zoom(g.lat,g.lon,g.id); } catch(e) { return false; }",'gate plan action uses recorded position')
 a=s.index('W.gate1156Zoom = function (lat, lon, id) {');b=s.index('\nfunction ring(M, svg, lat, lon, id)',a)
 one(s[a:b],"""W.gate1156Zoom = function (lat, lon, id) {
 if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
 expOpen2d(); const f=expFrame(); if(!f) return false; let tries=0;
 const seq=W.mapLocate1283Seq=(W.mapLocate1283Seq||0)+1;
 const current=()=>W.mapLocate1283Seq===seq && state.tab==='map' && EXP.frame===f;
 (function locate1283(){ if(!current()) return; const g=f.contentWindow && f.contentWindow.GC500Explorer;
  if(g && g.ready && typeof g.gotoLatLon1283==='function') { Promise.resolve(g.ready).then(()=>{ if(!current()) return; const placed=g.gotoLatLon1283(lat,lon,id); if(placed && typeof flash==='function') flash(String(id||'Recorded location')+' — located on the 2026 plan.'); }).catch(()=>{ if(current()&&typeof flash==='function') flash('The 2026 plan could not open this location. Please retry when the plan has loaded.'); }); return; }
  if(++tries<225) setTimeout(locate1283,200); else if(current()&&typeof flash==='function') flash('The 2026 plan is still loading. Please select this location again when it is ready.');
 })(); return true;
};""",'recorded coordinates on verified plan')
 one("ringed on the satellite map under the explorer; the master plan ", "opening on the 2026 plan; the master plan ",'gate message')
 one("try { flash(L.label + ' — ringed on the satellite map.'); }", "try { flash(L.label + ' — opening on the 2026 plan.'); }",'finder message')
 one('<style id="mapx1188-style">',"""<style id="map2026Only1283">
/* Author: Andrew Fisher. Only verified 2026 sources can be selected in Map Explorer. */
#pane-map [data-mopen="proof3d"],#pane-map [data-sheet="__satellite"],#pane-map [data-sheet="__satellite3d"],#pane-map .s1141-map[data-s1141="map"],.mpages [data-mpage="proof3d"]{display:none!important}
</style>
<style id="mapx1188-style">""",'source policy marker')
 if not pretest: one("+' · v12.81';","+' · v12.83';",'release footer')
 return s
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(apply(p.read_text()),encoding='utf-8')
