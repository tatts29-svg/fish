/* v12.45: retain completed SVG tile coverage until its replacement loads.
 * State is bounded to one coarse anchor, the last complete and current views.
 * Each native image owns one pair of listeners, removed on completion/pruning.
 */
const tileStates1245 = new WeakMap();
const tileStatusNodes1245 = new WeakMap();
function tileStatus1245(group, state){
 const host = group.ownerSVGElement?.parentElement; if (!host) return;
 const text = state === 'failed' ? 'Some imagery could not load · retry by moving map' : state === 'loading' ? 'Loading imagery…' : '';
 let saved = tileStatusNodes1245.get(host); if (!saved && !text) return;
 if (!text && saved && saved.group !== group) return;
 if (!saved) {
  const node = document.createElement('span'); node.className = 'map-imagery1245';
  node.style.cssText = 'position:absolute;left:8px;bottom:8px;max-width:calc(100% - 16px);padding:4px 7px;border-radius:4px;background:rgba(255,255,255,.94);color:#273238;font-size:12px;line-height:1.3;pointer-events:none;z-index:2';
  host.appendChild(node); saved = {node, text: null, group}; tileStatusNodes1245.set(host, saved);
 }
 saved.group = group;
 if (saved.text !== text) { saved.node.textContent = text; saved.node.hidden = !text; saved.text = text; }
}
function tileImages1245(group, items, sourcesReady = true){
 if (!group) return;
 let s = tileStates1245.get(group);
 if (!s) {
  s = {entries: new Map(), wanted: new Set(), keep: new Set(), anchor: new Set(), anchorSpan: 0, failures: new Set()}; tileStates1245.set(group, s);
  for (const node of Array.from(group.children)) node.remove();
 }
 const detach = e => { e.image.removeEventListener('load', e.loaded); e.image.removeEventListener('error', e.failed); };
 const order = () => {
  for (const [id, e] of s.entries) if (!s.wanted.has(id) && !s.keep.has(id) && !s.anchor.has(id)) { detach(e); e.image.remove(); s.entries.delete(id); }
  const ids = [...s.anchor].filter(id => !s.keep.has(id) && !s.wanted.has(id)).concat([...s.keep].filter(id => !s.wanted.has(id)), [...s.wanted]);
  let position = 0;
  for (const id of ids) { const e = s.entries.get(id); if (!e) continue; if (group.children[position] !== e.image) group.insertBefore(e.image, group.children[position] || null); position++; }
 };
 const finish = () => {
  if (s.waitingSources) { order(); tileStatus1245(group, s.failures.size ? 'failed' : 'loading'); return; }
  for (const id of s.wanted) if (!s.entries.get(id)?.ready) { order(); tileStatus1245(group, s.failures.size ? 'failed' : 'loading'); return; }
  s.anchorSpan = [...s.anchor].reduce((span, id) => Math.max(span, s.entries.get(id)?.span || 0), 0);
  if (!s.wanted.size) { s.anchor.clear(); s.anchorSpan = 0; }
  else if (s.wantedSpan >= s.anchorSpan) { s.anchor = new Set(s.wanted); s.anchorSpan = s.wantedSpan; }
  s.keep = new Set(s.wanted); order(); tileStatus1245(group, 'ready');
 };
 s.waitingSources = !sourcesReady; s.failures.clear();
 s.wantedSpan = items.reduce((span, t) => Math.max(span, Number(t.span) || 0), 0);
 s.wanted = new Set(items.map(t => JSON.stringify([t.key, t.url])));
 for (const t of items) {
  const id = JSON.stringify([t.key, t.url]); let e = s.entries.get(id);
  if (!e) {
   const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
   e = {image, ready: false}; s.entries.set(id, e); image.setAttribute('data-tile1245', id);
   e.loaded = () => { if (s.entries.get(id) !== e) return; e.ready = true; detach(e); finish(); };
   e.failed = () => { if (s.entries.get(id) !== e) return; detach(e); image.remove(); s.entries.delete(id); s.failures.add(id); order(); tileStatus1245(group, 'failed'); };
   image.addEventListener('load', e.loaded); image.addEventListener('error', e.failed); group.appendChild(image);
  }
  e.span = Number(t.span) || 0;
  const attrs = {href: t.url, x: t.x, y: t.y, width: t.span, height: t.span, preserveAspectRatio: 'none'};
  for (const [name, value] of Object.entries(attrs)) if (e.image.getAttribute(name) !== String(value)) e.image.setAttribute(name, String(value));
 }
 finish();
}
