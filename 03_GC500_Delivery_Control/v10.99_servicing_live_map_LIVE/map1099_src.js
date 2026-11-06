/* Author: Andrew Fisher. Saved servicing progress on the existing registered drawing.
   The shared SvcState owns all completion maths. This module never reads credentials or writes records. */
var SvcMap1099 = (function () {
'use strict';
var instances = new WeakMap();
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function symbol(line) {
  var t = String(line.type || '').toLowerCase(), k = line.kind;
  if (/pee.?panel/.test(t)) return 'pee';
  if (t.indexOf('accessible') >= 0 || k === 'access') return 'accessible';
  if (/16.?pan/.test(t) || k === 'pan16') return 'pan16';
  if (t.indexOf('tank') >= 0 || k === 'tank') return 'tank';
  if (t.indexOf('block') >= 0 || k === 'block' || k === 'sewer') return 'block';
  if (t.indexOf('toilet') >= 0 || t.indexOf('fwf') >= 0 || k === 'fwf' || k === 'pump_only') return 'toilet';
  return 'unknown';
}
var paths = {
  toilet:'<rect x="5" y="3" width="14" height="6" rx="1"/><path d="M6 11h12v3a6 6 0 0 1-5 6v2H9v-3a6 6 0 0 1-3-5z"/><path d="M8 6h2"/>',
  block:'<path d="M2 21V5l10-3 10 3v16z"/><path d="M5 9h5v12H5zM14 9h5v12h-5zM7 14h1m8 0h1"/>',
  pan16:'<path d="M2 21V5l10-3 10 3v16z"/><path d="M5 17h14M8 17v4m8-4v4"/><text x="12" y="14" text-anchor="middle" stroke="none" fill="currentColor" font-size="10" font-weight="900">16</text>',
  accessible:'<circle cx="13" cy="4" r="2"/><path d="M11 7v7h7l3 7M11 10h7M8 12a6 6 0 1 0 9 7"/>',
  pee:'<path d="M3 3h18v19H3zM11 3v19M6 7h2v9H6zm8 0h4v8h-4zM14 18h4"/>',
  tank:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M5 13h14"/>',
  unknown:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8v5h-4v2M12 18v1"/>'
};
function icon(kind) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[kind || 'unknown']+'</svg>'; }
function geometry(M) { return M.geometry || (typeof SVC1099_MAP_DATA !== 'undefined' ? SVC1099_MAP_DATA : null); }
function onDrawing(p, G) { return !!(p && G && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= G.rect[0] && p.x <= G.rect[2] && p.y >= G.rect[1] && p.y <= G.rect[3]); }
function model(M) {
  var S = M.S || SvcState, D = M.D, day = M.day || S.autoDay(D,M.now), st = S.jobStates(M.events || [],M.now), G = geometry(M), refs = [], areas = [];
  D.areas.forEach(function(a) {
    var members = a.refs.map(function(r) {
      var g = G && G.refs[r.ref], stats = S.refStats(D,r,day,st), spots = [];
      r.lines.forEach(function(l) {
        var gl = g && g.lines[l.id], p = gl && gl.point, key = onDrawing(p,G) ? p.x+','+p.y : 'off:' + l.id;
        var spot = spots.find(function(v){return v.key===key;});
        if (!spot) { spot = {id:r.ref+':'+spots.length,key:key,ref:r.ref,point:onDrawing(p,G) ? p : null,lines:[]}; spots.push(spot); }
        spot.lines.push({id:l.id,label:gl && gl.label || l.label || l.kind,qty:l.qty,kind:symbol({type:gl && gl.type,kind:l.kind}),pin:gl && gl.pin || g && g.pin || null});
      });
      var out = {ref:r.ref,area:String(a.n),title:g && g.title || r.ref,stats:stats,pct:S.pct(stats.d,stats.w),savedDone:stats.done && !stats.pending,spots:spots};
      refs.push(out); return out;
    });
    areas.push({id:String(a.n),name:a.name,stats:S.groupStats(D,a.refs,day,st),savedDone:members.length>0 && members.every(function(r){return r.savedDone;}),refs:members});
  });
  var flat = []; D.areas.forEach(function(a){flat=flat.concat(a.refs);});
  return {day:day,dayLabel:(S.dayOf(D,day)||{}).label || day,overall:S.groupStats(D,flat,day,st),areas:areas,refs:refs};
}
function statsAttrs(s, done, pct) { return ' data-d="'+s.d+'" data-w="'+s.w+'" data-pct="'+(pct == null ? s.pct : pct)+'" data-done="'+(done?'true':'false')+'"'; }
function directions(pin) { return Array.isArray(pin) && pin.length===2 && pin.every(Number.isFinite) ? 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(pin.join(',')) : ''; }
function clusters(points, threshold) {
  var sets = [];
  points.forEach(function(p) {
    var joins = sets.filter(function(s){return s.some(function(q){return Math.hypot(p.x-q.x,p.y-q.y)<=threshold;});});
    var merged = [p]; joins.forEach(function(s){merged=merged.concat(s);sets.splice(sets.indexOf(s),1);}); sets.push(merged);
  });
  return sets;
}
function rememberFocus(host) {
  var node=document.activeElement;if(!host||!host.contains(node))return null;
  var key=['data-map-refs','data-svc1099-reference','data-svc1099-area','href'].find(function(k){return node.hasAttribute(k);});
  return {node:node,key:key,value:key?node.getAttribute(key):null};
}
function restoreFocus(host, saved) {
  if(!saved)return;
  var node=saved.node;
  if(!node.isConnected&&saved.key)node=Array.from(host.querySelectorAll('['+saved.key+']')).find(function(n){return n.getAttribute(saved.key)===saved.value;});
  if(node&&node.isConnected&&document.activeElement!==node)node.focus({preventScroll:true});
}
function create(host) {
  var root = document.createElement('section'); root.className='svc1099';
  root.innerHTML='<div class="svc1099-heading"><div><h3>Servicing map</h3><p data-map-night></p></div><button type="button" data-map-refresh data-ro>Refresh progress</button></div>'+
    '<div class="svc1099-overall" data-svc1099-overall role="status"></div>'+
    '<div class="svc1099-area-chooser"><label>Show area <select data-map-area data-ro><option value="">All areas</option></select></label><button type="button" data-map-fit data-ro>Fit map</button></div>'+
    '<div class="svc1099-view" tabindex="0" role="group" aria-label="Servicing drawing. Use plus and minus to zoom, arrow keys to pan.">'+
    '<div class="svc1099-world"><img alt="Existing registered site drawing" draggable="false"/><svg class="svc1099-envelopes" aria-hidden="true"></svg></div><div class="svc1099-pins"></div>'+
    '<div class="svc1099-zoom"><button type="button" data-map-zoom="1" data-ro aria-label="Zoom in">+</button><button type="button" data-map-zoom="-1" data-ro aria-label="Zoom out">−</button><output data-map-scale>100%</output></div></div>'+
    '<p class="svc1099-map-help">Drag to move · pinch or use + / − to zoom · choose a symbol for its references.</p>'+
    '<div class="svc1099-key"></div><div class="svc1099-detail" aria-live="polite"></div>'+
    '<div class="svc1099-areas" aria-label="Servicing areas"></div><details class="svc1099-references"><summary>All references</summary><div class="svc1099-ref-list"></div></details>'+
    '<p class="svc1099-read" role="status"></p><small class="svc1099-author">Author: Andrew Fisher</small>';
  host.appendChild(root);
  var q=function(s){return root.querySelector(s);};
  var I={root:root,view:q('.svc1099-view'),world:q('.svc1099-world'),pins:q('.svc1099-pins'),svg:q('.svc1099-envelopes'),image:q('img'),M:null,m:null,G:null,z:1,x:0,y:0,fit:1,width:1,height:1,filter:'',selected:[],pointers:new Map(),frame:0,geometrySignature:'',signature:'',day:'',completed:new Set(),pulseUntil:0,dead:false};
  I.q=q;
  q('.svc1099-key').innerHTML=[['toilet','Toilet / trailer'],['block','Toilet block'],['pan16','16-pan block'],['accessible','Accessible toilet'],['pee','Pee panel'],['tank','Waste tank']].map(function(k){return '<span>'+icon(k[0])+esc(k[1])+'</span>';}).join('')+'<span class="svc1099-key-done">✓ Saved complete</span><span>Soft outlines: grouped servicing locations</span>';
  function size() {
    var box=I.view.getBoundingClientRect(); I.width=Math.max(1,box.width);I.height=Math.max(1,box.height);
    if (I.G) I.fit=Math.min(I.width/I.G.px[0],I.height/I.G.px[1]);
  }
  function project(p) { return {x:(p.x-I.G.rect[0])/(I.G.rect[2]-I.G.rect[0])*I.G.px[0],y:(p.y-I.G.rect[1])/(I.G.rect[3]-I.G.rect[1])*I.G.px[1]}; }
  function at(p) { var a=project(p),scale=I.fit*I.z;return {x:I.x+a.x*scale,y:I.y+a.y*scale}; }
  function fit(selected) {
    size(); if (!I.G) return;
    var pts=[];
    if(selected)I.m.refs.filter(function(r){return r.area===selected;}).forEach(function(r){r.spots.forEach(function(s){if(s.point)pts.push(project(s.point));});});
    if(pts.length){var xs=pts.map(function(p){return p.x;}),ys=pts.map(function(p){return p.y;});var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
      I.z=Math.min(24,Math.max(1,Math.min((I.width-100)/Math.max(x1-x0,50),(I.height-100)/Math.max(y1-y0,50))/I.fit));I.x=I.width/2-(x0+x1)/2*I.fit*I.z;I.y=I.height/2-(y0+y1)/2*I.fit*I.z;
    }else{I.z=1;I.x=(I.width-I.G.px[0]*I.fit)/2;I.y=(I.height-I.G.px[1]*I.fit)/2;}
    scheduleView();
  }
  function zoom(factor,cx,cy) {
    var old=I.z,next=Math.min(160,Math.max(1,old*factor));
    I.x=cx-(cx-I.x)*next/old;I.y=cy-(cy-I.y)*next/old;I.z=next;scheduleView();
  }
  function showDetail() {
    var rows=I.m.refs.filter(function(r){return I.selected.indexOf(r.ref)>=0;});
    var detail=rows.length?rows.map(function(r){return '<article><h4>'+esc(r.ref)+(r.title!==r.ref?' · '+esc(r.title):'')+'</h4><p><b>'+(r.savedDone?'✓ Saved complete':r.pct+'% complete')+'</b> · '+r.stats.d+' / '+r.stats.w+' jobs · '+esc(I.m.dayLabel)+'</p>'+r.spots.map(function(s){return '<ul>'+s.lines.map(function(l){var link=directions(l.pin);return '<li>'+icon(l.kind)+esc(l.label)+(s.point?'':' · '+(link?'Outside this drawing':'Location not recorded'))+(link?' <a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" data-ro>Directions</a>':'')+'</li>';}).join('')+'</ul>';}).join('')+'</article>';}).join(''):'<p>Select a map symbol to see its servicing progress.</p>';
    if(I.detailSignature!==detail){q('.svc1099-detail').innerHTML=detail;I.detailSignature=detail;}
  }
  function envelopes() {
    if(!I.G)return;
    var out='';
    I.m.areas.filter(function(a){return !I.filter||a.id===I.filter;}).forEach(function(a){
      var pts=[];a.refs.forEach(function(r){r.spots.forEach(function(s){if(s.point){var p=project(s.point);p.ref=r.ref;pts.push(p);}});});
      // Separate distant groups; these are location envelopes, never surveyed boundaries.
      clusters(pts,185).forEach(function(group){
        var xs=group.map(function(p){return p.x;}),ys=group.map(function(p){return p.y;}),x=Math.min.apply(null,xs)-15,y=Math.min.apply(null,ys)-15,w=Math.max.apply(null,xs)-x+15,h=Math.max.apply(null,ys)-y+15;
        if(w>720||h>720)return;
        out+='<rect class="svc1099-envelope'+(a.savedDone?' done':'')+'" data-svc1099-envelope="'+esc(a.id)+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="16" vector-effect="non-scaling-stroke"/>';
      });
    });
    if(I.envelopeSignature!==out){I.svg.innerHTML=out;I.envelopeSignature=out;}
  }
  function paint() {
    I.frame=0;if(I.dead||!I.G)return;
    var scale=I.fit*I.z;I.world.style.transform='translate('+I.x+'px,'+I.y+'px) scale('+scale+')';
    q('[data-map-scale]').textContent=Math.round(I.z*100)+'%';
    var pts=[];
    I.m.refs.filter(function(r){return !I.filter||r.area===I.filter;}).forEach(function(r){r.spots.forEach(function(s){if(!s.point)return;var p=at(s.point);if(p.x < -60||p.x>I.width+60||p.y< -60||p.y>I.height+60)return;p.spot=s;p.ref=r;pts.push(p);});});
    var groups=clusters(pts,54), html='';
    groups.forEach(function(group){
      var refs=[],kinds=[],complete=true,areas=[];group.forEach(function(p){if(refs.indexOf(p.ref.ref)<0)refs.push(p.ref.ref);if(areas.indexOf(p.ref.area)<0)areas.push(p.ref.area);complete=complete&&p.ref.savedDone;p.spot.lines.forEach(function(l){if(kinds.indexOf(l.kind)<0)kinds.push(l.kind);});});
      var x=group.reduce(function(n,p){return n+p.x;},0)/group.length,y=group.reduce(function(n,p){return n+p.y;},0)/group.length;
      var whole=areas.every(function(id){return I.m.areas.some(function(a){return a.id===id&&a.savedDone;});});
      var pulse=whole&&I.pulseUntil>Date.now()&&areas.some(function(id){return I.newDone&&I.newDone.has(id);});
      var label=refs.length===1?refs[0]:refs.length+' refs';
      html+='<button type="button" data-ro class="svc1099-pin'+(complete?' done':'')+(whole?' area-done':'')+(pulse?' pulse':'')+'" data-map-refs="'+esc(refs.join('|'))+'" data-saved-done="'+complete+'" style="left:'+x+'px;top:'+y+'px" aria-label="'+esc(refs.join(', ')+(complete?' · saved complete':' · servicing progress'))+'">'+icon(kinds[0])+(kinds.length>1?'<span class="svc1099-mixed" aria-hidden="true">'+icon(kinds[1])+'</span>':'')+(complete?'<b class="svc1099-tick" aria-hidden="true">✓</b>':'')+(refs.length>1?'<b class="svc1099-count">'+refs.length+'</b>':'')+'<span class="svc1099-pin-label">'+esc(label)+'</span></button>';
    });
    I.m.areas.filter(function(a){return a.savedDone&&(!I.filter||a.id===I.filter);}).forEach(function(a){
      var ps=[];a.refs.forEach(function(r){r.spots.forEach(function(s){if(s.point){var p=at(s.point);if(p.x>=0&&p.x<=I.width&&p.y>=0&&p.y<=I.height)ps.push(p);}});});
      clusters(ps,185*scale).forEach(function(group){
        var x=Math.max(8,Math.min(I.width-120,Math.min.apply(null,group.map(function(p){return p.x;}))-24));
        var y=Math.max(8,Math.min(I.height-24,Math.min.apply(null,group.map(function(p){return p.y;}))-56));
        html+='<span class="svc1099-area-badge" data-svc1099-area-badge="'+esc(a.id)+'" style="left:'+x+'px;top:'+y+'px" title="'+esc(a.name)+'">✓ Area '+esc(a.id)+' complete</span>';
      });
    });
    // Marker DOM changes only when geometry, viewport or saved status changes.
    if(I.pinsSignature!==html){var focus=rememberFocus(root);I.pins.innerHTML=html;I.pinsSignature=html;restoreFocus(root,focus);}
  }
  function scheduleView(){if(!I.frame)I.frame=requestAnimationFrame(paint);}
  function refreshStats(){
    var m=I.m;
    var outside=m.refs.filter(function(r){return r.spots.some(function(s){return !s.point;});}).length;
    q('.svc1099-map-help').textContent='Drag to move · pinch or use + / − to zoom · choose a symbol for its references.'+(outside?' '+outside+' references outside this drawing or awaiting a location; see All references.':'');
    root.setAttribute('data-svc1099-day',m.day);q('[data-map-night]').textContent=m.dayLabel+' · selected servicing night';
    var overall=q('[data-svc1099-overall]');overall.textContent=m.overall.pct+'% complete · '+m.overall.refsDone+' / '+m.overall.refs+' references · '+m.overall.d+' / '+m.overall.w+' jobs';
    ['d','w','pct'].forEach(function(k){overall.setAttribute('data-'+k,m.overall[k]);});
    var options='<option value="">All areas</option>'+m.areas.map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>';}).join('');
    if(q('[data-map-area]').innerHTML!==options){q('[data-map-area]').innerHTML=options;q('[data-map-area]').value=I.filter;}
    var areaHtml=m.areas.map(function(a){return '<button type="button" data-ro data-svc1099-area="'+esc(a.id)+'"'+statsAttrs(a.stats,a.savedDone)+' class="svc1099-area'+(a.savedDone?' done':'')+'" aria-pressed="'+(I.filter===a.id)+'"><strong>'+(a.savedDone?'✓ ':'')+esc(a.name)+'</strong><span>'+a.stats.pct+'% · '+a.stats.refsDone+'/'+a.stats.refs+' references · '+a.stats.d+'/'+a.stats.w+' jobs</span></button>';}).join('');
    if(q('.svc1099-areas').innerHTML!==areaHtml)q('.svc1099-areas').innerHTML=areaHtml;
    var list=m.refs.map(function(r){var missing=r.spots.some(function(s){return !s.point;});return '<button type="button" data-ro data-svc1099-reference="'+esc(r.ref)+'"'+statsAttrs(r.stats,r.savedDone,r.pct)+'>'+ (r.savedDone?'✓ ':'')+esc(r.ref)+' · '+r.pct+'%'+(missing?' · outside drawing / unplaced':'')+'</button>';}).join('');
    if(q('.svc1099-ref-list').innerHTML!==list)q('.svc1099-ref-list').innerHTML=list;
    q('.svc1099-read').textContent=I.M.readStatus || 'Saved progress · last verified '+(I.M.S||SvcState).hm(I.M.lastRead || I.M.now)+' AEST';
    showDetail();envelopes();scheduleView();
  }
  root.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.hasAttribute('data-map-refresh')){if(I.M&&I.M.refresh)I.M.refresh();return;}
    if(b.hasAttribute('data-map-fit')){fit(I.filter);return;}
    if(b.hasAttribute('data-map-zoom')){zoom(b.getAttribute('data-map-zoom')==='1'?1.5:1/1.5,I.width/2,I.height/2);return;}
    if(b.hasAttribute('data-svc1099-area')){I.filter=b.getAttribute('data-svc1099-area');q('[data-map-area]').value=I.filter;refreshStats();fit(I.filter);return;}
    var ref=b.getAttribute('data-svc1099-reference'), group=b.getAttribute('data-map-refs');
    if(ref||group){I.selected=ref?[ref]:group.split('|');showDetail();}
  });
  q('[data-map-area]').addEventListener('change',function(e){I.filter=e.target.value;refreshStats();fit(I.filter);});
  I.view.addEventListener('wheel',function(e){if(e.target.closest('button'))return;e.preventDefault();var b=I.view.getBoundingClientRect();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.005),e.clientX-b.left,e.clientY-b.top);},{passive:false});
  I.view.addEventListener('keydown',function(e){if(e.target!==I.view)return;var handled=true;if(e.key==='+'||e.key==='=')zoom(1.5,I.width/2,I.height/2);else if(e.key==='-')zoom(1/1.5,I.width/2,I.height/2);else if(e.key==='ArrowLeft')I.x+=60;else if(e.key==='ArrowRight')I.x-=60;else if(e.key==='ArrowUp')I.y+=60;else if(e.key==='ArrowDown')I.y-=60;else if(e.key==='Home')fit(I.filter);else handled=false;if(handled){e.preventDefault();scheduleView();}});
  I.view.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;I.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});I.view.setPointerCapture(e.pointerId);});
  I.view.addEventListener('pointermove',function(e){
    if(!I.pointers.has(e.pointerId))return;var old=Array.from(I.pointers.values()),prev=I.pointers.get(e.pointerId);I.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});var next=Array.from(I.pointers.values());
    if(next.length===1){I.x+=e.clientX-prev.x;I.y+=e.clientY-prev.y;scheduleView();}
    else if(next.length===2){var box=I.view.getBoundingClientRect(),before=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y),after=Math.hypot(next[0].x-next[1].x,next[0].y-next[1].y);if(before>0)zoom(after/before,(next[0].x+next[1].x)/2-box.left,(next[0].y+next[1].y)/2-box.top);}
  });
  function release(e){I.pointers.delete(e.pointerId);} I.view.addEventListener('pointerup',release);I.view.addEventListener('pointercancel',release);
  I.resize=new ResizeObserver(function(){var old=I.fit;size();if(old!==I.fit){I.x=I.width/2-(I.width/2-I.x)*(I.fit/old);I.y=I.height/2-(I.height/2-I.y)*(I.fit/old);}scheduleView();});I.resize.observe(I.view);
  I.visibility=function(){root.classList.toggle('paused',document.hidden);if(!document.hidden)scheduleView();};document.addEventListener('visibilitychange',I.visibility);
  I.update=function(M){
    var focus=M.focusReturn || rememberFocus(root);
    I.M=M;var G=geometry(M);I.m=model(M);
    if(!G){root.hidden=true;return;}root.hidden=false;
    if(I.G!==G){I.G=G;I.image.src=G.image;I.image.width=G.px[0];I.image.height=G.px[1];I.world.style.width=G.px[0]+'px';I.world.style.height=G.px[1]+'px';I.svg.setAttribute('viewBox','0 0 '+G.px[0]+' '+G.px[1]);I.svg.setAttribute('preserveAspectRatio','none');fit(I.filter);}
    var done=new Set(I.m.areas.filter(function(a){return a.savedDone;}).map(function(a){return a.id;}));
    I.newDone=new Set();if(I.day===I.m.day)done.forEach(function(id){if(!I.completed.has(id))I.newDone.add(id);});
    I.pulseUntil=I.newDone.size?Date.now()+1800:0;I.completed=done;I.day=I.m.day;refreshStats();restoreFocus(root,focus);
  };
  I.destroy=function(){I.dead=true;cancelAnimationFrame(I.frame);I.resize.disconnect();document.removeEventListener('visibilitychange',I.visibility);I.M=null;I.m=null;I.G=null;I.root.remove();};
  return I;
}
function update(host,M){var I=instances.get(host);if(!I){I=create(host);instances.set(host,I);}I.update(M);return I.m;}
function clear(host){if(!host)return;var I=instances.get(host);if(I){I.destroy();instances.delete(host);}}
return {model:model,update:update,clear:clear,rememberFocus:rememberFocus,symbol:symbol,icon:icon,clusters:clusters};
})();
if(typeof module==='object'&&module&&module.exports)module.exports=SvcMap1099;
