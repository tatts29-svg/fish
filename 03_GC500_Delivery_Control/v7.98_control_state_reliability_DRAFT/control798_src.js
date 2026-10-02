/* v7.98 — keep the open drawer's connection badge current without rebuilding its fields.
   Author: Andrew Fisher. The existing sync footer owns status/capability changes; no new timer. */
function drawerSync798Word(){
 return SYNC.status === 'live' ? (SYNC.readonly ? 'Live · view only' : 'Live')
 : SYNC.status === 'file' ? 'No service behind this copy'
 : SYNC.status === 'connecting' ? 'Connecting'
 : SYNC.status === 'unreachable' ? (SYNC.readonly ? 'Offline · view only' : 'Offline · will send')
 : 'Snapshot';
}
function drawerSync798Refresh(){
 const word = document.querySelector('#drawer.on .ptag.sync b');
 if (!word) return;
 const next = drawerSync798Word();
 if (word.textContent !== next) word.textContent = next;
}
/* The reference's recorded delivery instruction belongs on both delivery sheets.
   A delivery instruction must not be carried into a later removal load. */
function dpDeliveryNotes798(g){
 if (!g || g.kind !== 'deliveries') return '';
 const seen = new Set(), notes = new Map();
 (g.rows || []).forEach(r => {
  const key = r && r.a && r.a.key;
  if (!key || seen.has(key)) return;
  seen.add(key);
  const d = deliveryOf(key), note = String((d && d.note) || '').replace(/\r\n?/g, '\n').trim();
  if (!note) return;
  if (!notes.has(note)) notes.set(note, []);
  notes.get(note).push(key);
 });
 if (!notes.size) return '';
 return '<div class="dp-lines dp-delivery798">' + [...notes].map(([note, refs]) =>
  '<div class="dp-l dp-w"><label>Delivery note</label><div><b>' + esc(refs.join(', ')) + '</b> · '
  + esc(note).replace(/\n/g, '<br>') + '</div></div>').join('') + '</div>';
}
