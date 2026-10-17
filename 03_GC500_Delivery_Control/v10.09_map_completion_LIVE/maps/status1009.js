/* Author: Andrew Fisher. Map status is read from the shared physical-work record. */
const MAP1009_STATES = Object.freeze({
  complete: {label:'Complete', colour:'#4aff9a', fill:'#128448', shape:'octagon', glyph:'check'},
  incomplete: {label:'Not complete', colour:'#ffd172', fill:'#52370e', shape:'diamond', glyph:'dash'},
  partial: {label:'Partial', colour:'#ffd172', fill:'#52370e', shape:'diamond', glyph:'dash'},
  review: {label:'Review required', colour:'#ffaaa3', fill:'#742923', shape:'triangle', glyph:'!'},
  unknown: {label:'Not confirmed', colour:'#e0e7ed', fill:'#35424d', shape:'circle', glyph:'?'},
  cancelled: {label:'Cancelled', colour:'#e0e7ed', fill:'#35424d', shape:'circle', glyph:'×'},
  moved: {label:'Moved', colour:'#e0e7ed', fill:'#35424d', shape:'circle', glyph:'↗'}
});
function statusModel1009(row, available) {
  const state = available && row && Object.prototype.hasOwnProperty.call(MAP1009_STATES, row.state) ? row.state : 'unknown';
  const model = MAP1009_STATES[state];
  const label=state==='unknown'?(available&&row&&/no (?:delivery )?record/i.test(String(row.label||''))?'No delivery record':'Status unavailable'):model.label;
  return Object.assign({state}, model, {label,detail:available && row && typeof row.label === 'string' ? row.label : label});
}
function statusSnapshot1009(raw) {
  const available = !!(raw && raw.available === true && Array.isArray(raw.states));
  const rows = new Map();
  if (available) raw.states.forEach(row => {
    if (!row || typeof row.key !== 'string' || !row.key.trim()) return;
    const key = norm(row.key);
    // Duplicate contradictory answers cannot confer completion.
    if (rows.has(key)) rows.set(key, {key,state:'review',label:'Conflicting status'});
    else rows.set(key, {key,state:row.state,label:row.label});
  });
  return {available, rows, signature:JSON.stringify([available, [...rows].sort((a,b)=>a[0].localeCompare(b[0]))])};
}
let MAP1009 = statusSnapshot1009(null);
function mapStatus1009(it) {
  if (!it || !it.cat || it.cat.host !== 'trade') return null;
  return statusModel1009(MAP1009.rows.get(it.code), MAP1009.available);
}
function mapHostStatus1009() {
  try {
    const host = window.parent && window.parent !== window ? window.parent : null;
    return host && typeof host.gc500MapStatus1009 === 'function' ? host.gc500MapStatus1009() : null;
  } catch (_) { return null; }
}
function selectedStatus1009() {
  let el = $('mapStatus1009');
  if (!el) { el = document.createElement('div'); el.id = 'mapStatus1009'; el.className = 'sr1009'; el.setAttribute('role','status'); el.setAttribute('aria-live','polite'); ($('stage') || document.body).appendChild(el); }
  const status = mapStatus1009(selected), text = selected && status ? selected.code + ' · ' + status.label + (status.detail.toLowerCase() !== status.label.toLowerCase() ? ' · ' + status.detail : '') : '';
  if (el.textContent !== text) el.textContent = text;
}
function mapGlyph1009(status) {
  const shape = status.shape === 'octagon' ? '<path d="M10 2h12l8 8v12l-8 8H10l-8-8V10Z"/>' : status.shape === 'diamond' ? '<path d="m16 2 14 14-14 14L2 16Z"/>' : status.shape === 'triangle' ? '<path d="m16 2 14 27H2Z"/>' : '<circle cx="16" cy="16" r="14"/>';
  const mark = status.glyph === 'check' ? '<path class="map1009-mark" d="m9 16 5 5 10-11"/>' : status.glyph === 'dash' ? '<path class="map1009-mark" d="M10 16h12"/>' : '<text x="16" y="22" text-anchor="middle">' + esc(status.glyph) + '</text>';
  return '<svg class="map1009-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false" style="--status1009:'+status.colour+';--fill1009:'+status.fill+'">'+shape+mark+'</svg>';
}
function badge1009(ctx, x, y, status) {
  const r=14*dpr, shape=status.shape;
  ctx.save(); ctx.translate(x,y); ctx.lineJoin='round'; ctx.lineCap='round';
  const path=()=>{ctx.beginPath();if(shape==='circle'){ctx.arc(0,0,r,0,Math.PI*2);return;}
    const points=shape==='octagon'?[[-.43,-1],[.43,-1],[1,-.43],[1,.43],[.43,1],[-.43,1],[-1,.43],[-1,-.43]]:shape==='diamond'?[[0,-1],[1,0],[0,1],[-1,0]]:[[0,-1],[1,.94],[-1,.94]];
    points.forEach((p,i)=>i?ctx.lineTo(p[0]*r,p[1]*r):ctx.moveTo(p[0]*r,p[1]*r));ctx.closePath();};
  path();ctx.strokeStyle='#10191d';ctx.lineWidth=7*dpr;ctx.stroke();ctx.fillStyle=status.fill;ctx.fill();
  ctx.strokeStyle=status.colour;ctx.lineWidth=2*dpr;ctx.stroke();
  ctx.strokeStyle=status.glyph==='check'?'#fff':status.colour;ctx.lineWidth=3*dpr;
  if(status.glyph==='check'){ctx.beginPath();ctx.moveTo(-6*dpr,0);ctx.lineTo(-1*dpr,5*dpr);ctx.lineTo(8*dpr,-6*dpr);ctx.stroke();}
  else if(status.glyph==='dash'){ctx.beginPath();ctx.moveTo(-5*dpr,0);ctx.lineTo(5*dpr,0);ctx.stroke();}
  else {ctx.fillStyle=status.colour;ctx.font=`800 ${18*dpr}px Inter,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(status.glyph,0,shape==='triangle'?3*dpr:0);}
  ctx.restore();
}
function label1009(ctx, it, c, r, selected1009, colour) {
  const status=selected1009&&mapStatus1009(it),pad=8*dpr,h=(status?40:20)*dpr;
  ctx.save();ctx.font=`800 ${12*dpr}px Inter,sans-serif`;const main=textWidth887(ctx,it.code);
  ctx.font=`800 ${10*dpr}px Inter,sans-serif`;const sub=status?textWidth887(ctx,status.label.toUpperCase()):0;
  const w=Math.max(main,sub)+pad*2;
  const x=Math.min(Math.max(4*dpr,c.x+r*.75),canvas.width-w-4*dpr),y=Math.min(Math.max(4*dpr,c.y-r*.75-h-8*dpr),canvas.height-h-4*dpr);
  ctx.fillStyle='#101c23';ctx.strokeStyle=selected1009?'#ff821f':colour;ctx.lineWidth=(selected1009?2:1)*dpr;
  ctx.beginPath();ctx.roundRect(x,y,w,h,5*dpr);ctx.fill();ctx.stroke();ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.font=`800 ${12*dpr}px Inter,sans-serif`;ctx.fillStyle='#fff';ctx.fillText(it.code,x+pad,y+(status?12:10)*dpr);
  if(status){ctx.font=`800 ${10*dpr}px Inter,sans-serif`;ctx.fillStyle=status.colour;ctx.fillText(status.label.toUpperCase(),x+pad,y+28*dpr);}
  ctx.restore();
}
window.GC500MapCompletion1009=Object.freeze({pull:()=>complete897Pull(),status:code=>mapStatus1009(ITEMS.find(it=>it.code===norm(String(code||'')))),
  get state(){return {available:MAP1009.available,selected:selected&&selected.code,selectedStatus:mapStatus1009(selected),complete:[...COMPLETE897],doneLayer:DONE782_ON};}});
