"""Author: Andrew Fisher. Equipment map marks and retained pickup map records."""
from pathlib import Path
import re,sys,hashlib
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='636519966750489d9f2e8313ea016e8e3aad9bb2169aa6744dd6aa1002b31018'
def apply(s):
 if hashlib.sha256(s.encode()).hexdigest()!=BASE:raise ValueError('Requires exact live v12.96 base')
 def script(sid,fn):
  nonlocal s
  pat=re.compile(r'(<script\b[^>]*\bid="'+re.escape(sid)+r'"[^>]*>)(.*?)(</script>)',re.S)
  hits=list(pat.finditer(s))
  if len(hits)!=1:raise ValueError('Expected one script '+sid)
  m=hits[0];s=s[:m.start(2)]+fn(m.group(2))+s[m.end(2):]
 def r(t,a,b,label):return rep(t,a,b,label,'demob locations')
 def collection(t):
  hook='/* Author: Andrew Fisher. Explicit collection quantities in the existing native delivery history. */'
  # Install pure metadata helpers before the native collection adapter.
  if hook not in t:raise ValueError('Native collection insertion point missing')
  t=r(t,hook,(HERE/'pickup_locations1297_src.js').read_text()+'\n'+(HERE/'vms_locations1297_src.js').read_text()+'\n'+hook,'pickup location helper')
  t=r(t,'function snapshot(key){', '''function captureLocations1297(key,physical,reading){
 let location=null;try{location=root.Find1176?.locate({kind:'asset',key});}catch(_){}
 let unitLocations=Object.create(null);
 try{unitLocations=root.VmsPickupLocations1297.read(key,physical,root.VmsEquipment1103?.model(),co=>root.Units925.owner(co));}catch(_){}
 return root.PickupLocations1297.capture(key,{capturedAt:new Date().toISOString(),arrivalAt:reading.arrival?.at,location,units:physical,fixes:S.fixes,unitLocations});
}
function snapshot(key){''','capture only native qualified positions')
  t=r(t,'return {key,r,record,reading,pools,identities,token:JSON.stringify([r.units,record,pools,identities])};',"const pickupLocations1297=captureLocations1297(key,physical,reading);\n return {key,r,record,reading,pools,identities,pickupLocations1297,token:JSON.stringify([r.units,record,pools,identities,root.PickupLocations1297.signature(pickupLocations1297)])};",'stale form guard includes location source')
  t=r(t,"return bad('The quantities or record changed. Close and reopen collection.');","return bad('The quantities, record or map position changed. Close and reopen collection.');",'location drift notice')
  t=r(t,'return {ok:true,value:c,complete,snapshot:s};',"const saved=root.PickupLocations1297.select(s.pickupLocations1297,selected);if(saved)c.pickupLocations1297=saved;\n return {ok:true,value:c,complete,snapshot:s};",'persist selected metadata only')
  t=r(t,'The remaining units stay available for pickup.</p>', 'The remaining units stay available for pickup.</p><p>The current recorded map position is saved with this pickup record, where known. This does not verify its position at a backdated departure time.</p>','honest capture notice')
  return t
 script('demob-weather996-source',collection)
 def find(t):
  t=(HERE/'demob_shapes1297_src.js').read_text()+'\n'+t
  t=r(t,"const mPx = 1 / mpp; pinAt(c, Wd / 2, H / 2, mPx, String(L.tag || L.label));", "const mPx = 1 / mpp;\n if(L.demob1297)W.DemobShapes1297.paint(c,L.demob1297,{x:Wd/2,y:H/2,width:Wd,height:H});\n else pinAt(c, Wd / 2, H / 2, mPx, String(L.tag || L.label));",'satellite equipment symbol')
  t=r(t,'pinAt(c, X, Y, mPx, String(L.tag || L.label));', '''if(L.demob1297){
  const fit1297=sheetFitOf((DATA.sheets||[]).find(s=>s.key==='D001'));
  W.DemobShapes1297.paint(c,L.demob1297,{x:X,y:Y,width:Wd,height:H,projectSheet:(fx,fy)=>({x:(((fx-fit1297.fx.c)/fit1297.fx.k)*FX-x0)/fw*Wd,y:(((fy-fit1297.fy.c)/fit1297.fy.k)*FY-y0)/fh*H})});
 }else pinAt(c, X, Y, mPx, String(L.tag || L.label));''','aerial equipment footprint projection')
  return t
 script('find1178-script',find)
 def singles(t):
  t=r(t,"const navOf = L =>",'''/* Author: Andrew Fisher. Map-only history resolution; truck ordering keeps locOf. */
function mapReading1297(c){
 let reading=null,rows=[];try{reading=W.Departure1211?.read(c.key);}catch(_){}
 try{rows=gcUnits925(c.r?.a||assetOf(c.key),{loading:false});}catch(_){}
 let location=locOf(c),unitLocations=Object.create(null);
 if(c.u&&c.vms){try{location=W.Find1176.locate({kind:'asset',key:c.key});unitLocations=W.VmsPickupLocations1297.read(c.key,rows,W.VmsEquipment1103?.model(),co=>W.Units925.owner(co));}catch(_){location=null;}}
 return W.PickupLocations1297.resolve(c,location,{reading,rows,fixes:S.fixes,unitLocations,capturedAt:new Date().toISOString()});
}
function mapLoc1297(c,index=0,result=mapReading1297(c)){
 const entry=result.locations[index]||result;
 if(!entry.location)return null;
 const markerCard=c.tank&&entry.unitId===c.tank.id?Object.assign({},c,{icon:'tank',tank:null}):c;
 const L=Object.assign({},entry.location,{key:c.key,id:c.key,a:c.r?.a||assetOf(c.key)}),opts={rawShape:null,sameKindCount:(model().byKey.get(c.key)||[]).filter(x=>x.icon===markerCard.icon).length,paths:iconPaths(markerCard.icon),locationSignature:JSON.stringify([entry.capturedAt,entry.eventId,entry.location]),locationCount:new Set(result.locations.filter(x=>x.location).map(x=>x.location.lat+','+x.location.lon)).size};
 if(entry.location.scope==='unit'||entry.location.scope==='board')opts.destination=null;
 if(entry.historical){opts.destination=null;opts.source=null;}
 L.demob1297=W.DemobShapes1297.context(markerCard,L,opts);
 L.pickup1297=entry;
 if(entry.historical||c.st.s==='gone')L.warn=[L.warn,entry.note].filter(Boolean).join(' ');
 if(L.demob1297.kind==='unlocated')return null;
 L.what=[L.what,entry.historical?'Pickup record location':c.st.s==='gone'?'Recorded/plan location':''].filter(Boolean).join(' · ');
 return L;
}
function mapCaption1297(c,r,L){
 const gone=c.st.s==='gone';
 let title=gone?r.label:r.historical?r.label:'Equipment location';
 let note=[gone||r.historical?r.note:'',L?.demob1297.qualification||''].filter(Boolean).join(' ');
 const links=r.locations.map((it,i)=>i>0&&it.location&&(it.historical||r.hasHistory)?'<button type="button" class="btn" data-history1297="'+e(c.key)+'" data-u1238="'+e(c.uid)+'" data-hi1297="'+i+'">'+e(it.unitId===c.tank?.id?'Waste tank pickup map':'Pickup map '+(i+1))+'</button>':'').join('');
 return '<div class="map-note1297"><b>'+e(title)+'</b>'+(note?'<small>'+e(note)+'</small>':'')+links+'</div>';
}
const navOf = L =>''','map only projection')
  t=r(t,"const picId = (c, v, L) => (c.vms ? 'v|' + c.vms.label : 'a|' + c.key) + '|' + L.lat.toFixed(6) + ',' + L.lon.toFixed(6) + '|' + v;", "const picId = (c, v, L) => (c.vms ? 'v|' + c.vms.label : 'a|' + c.key) + ':' + encodeURIComponent(c.uid) + '|' + encodeURIComponent(W.DemobShapes1297.signature(L.demob1297)) + '|' + v;",'image cache unit status source signature')
  t=r(t,'const L = locOf(c), ic = SVG(ICONS[c.icon] || ICONS.other),', 'const reading1297=mapReading1297(c), L = mapLoc1297(c,0,reading1297), ic = SVG(ICONS[c.icon] || ICONS.other),','map pictures use resolved location')
  t=r(t,"(c.vms ? 'the board’s pin is still to come' : 'the driver reports at the pit lane')", "(c.vms ? 'the board’s position is still to come' : 'equipment position to confirm')",'no report point as equipment')
  t=r(t,"+ '><i class=\"pu1238\" style=\"left:' + (s.x * 100).toFixed(2) + '%;top:' + (s.y * 100).toFixed(2) + '%\"></i><span class=\"pb1238\">'", "+ '><span class=\"pb1238\">'",'remove circular centre overlay')
  t=r(t,"if (!L) return '<div class=\"ph1238\">","if (!L) return mapCaption1297(c,reading1297,L)+'<div class=\"ph1238\">",'retain available history links with unlocated primary')
  t=r(t,"return '<div class=\"ph1238\">' + fr('close') + fr('wide') + fr('site') + '</div>';", "return mapCaption1297(c,reading1297,L)+'<div class=\"ph1238\">' + fr('close') + fr('wide') + fr('site') + '</div>';",'location provenance caption')
  t=r(t,"(c.st.s === 'gone' ? stampHtml(c) : picsHtml(c)", "(c.st.s === 'gone' ? stampHtml(c)+picsHtml(c) : picsHtml(c)",'retain maps on picked up card')
  t=r(t,'const L = locOf(c), out = []; if (!L) return out;', 'const L = mapLoc1297(c), out = []; if (!L) return out;','export identical equipment locations')
  t=r(t,'function openMap(c) {\n const L = locOf(c);','function openMap(c,index=0) {\n const L = mapLoc1297(c,index);','full image history position')
  # Shared words must match the map attached to them.
  t=r(t,'const L = locOf(c), st = statusWords(c), lines =', 'const L = mapLoc1297(c), st = statusWords(c), lines =','shared map position consistency')
  t=r(t,"if (L) lines.push('Navigate: ' + navOf(L));", "if (L) { if(c.st.s==='gone'||L.pickup1297?.historical)lines.push(L.pickup1297.label+': '+L.pickup1297.note); lines.push('Navigate: ' + navOf(L)); }",'shared history qualification')
  t=r(t,"const t = ev.target && ev.target.closest ? ev.target : null; if (!t || !t.closest('#pane-demob')) return;", "const t = ev.target && ev.target.closest ? ev.target : null; if (!t || !t.closest('#pane-demob')) return;\n const history1297=t.closest('[data-history1297]');if(history1297){const card=cardOf(history1297.dataset.history1297,history1297.dataset.u1238);if(card)openMap(card,Number(history1297.dataset.hi1297)||0);return;}",'paired history map action')
  t=r(t,"if (c.vms) lines.push('Where: '", "if(L?.pickup1297?.historical)lines.push('Where: '+L.label+' · '+L.lat.toFixed(5)+', '+L.lon.toFixed(5)+' · '+L.how);\n else if (c.vms) lines.push('Where: '",'shared saved where words')
  t=r(t,'function whereHtml(c) {', '''function whereHtml(c) {
 if(c.st.s==='gone'){const r=mapReading1297(c);if(r.historical&&r.location)return '<div class="wh1238"><b>Pickup record location</b><small>'+e(r.location.label+' · '+r.location.how)+'</small></div>';}''','saved card header location')
  t=r(t,"if (a.classList.contains('ph1238') && b.classList.contains('ph1238')) return;", "if (a.classList.contains('ph1238') && b.classList.contains('ph1238')) { const ids=x=>[...x.querySelectorAll('[data-pi1238]')].map(i=>i.dataset.pi1238).join('\\n'); if(ids(a)===ids(b))return; a.replaceChildren(...b.childNodes);return; }",'refresh changed image identity only')
  t=r(t,'files, locOf, navOf, goCard', 'files, locOf, mapLoc1297, mapReading1297, navOf, goCard','read only test access')
  return t
 script('singles1238-script',singles)
 sys.path.insert(0,str(HERE))
 from build_integration1297 import apply as apply_build
 s=apply_build(s)
 s=r(s,"+' · v12.96';", "+' · v12.97';",'footer')
 s=r(s,'<style id="singles1238-style">','<style>/* Author: Andrew Fisher. Existing Demob card location captions. */\n.map-note1297{padding:8px 2px 5px;color:#e0eceb;font-size:12px;line-height:1.4}.map-note1297 b{display:block}.map-note1297 small{display:block;color:#b1c6ca;margin-top:2px}.map-note1297 .btn{margin:5px 4px 0 0}.st-gone .ph1238{margin-top:4px}</style>\n<style id="singles1238-style">','small retained map caption')
 return s
if __name__=='__main__':
 p=Path(sys.argv[1]);p.write_text(apply(p.read_text()))
