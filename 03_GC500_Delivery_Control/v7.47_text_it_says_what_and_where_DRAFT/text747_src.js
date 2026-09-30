/* v7.47 - TEXT IT SAYS WHAT IT IS AND WHERE IT GOES. Andrew Fisher, 30 Sep 2026: "I want to have the text function
 work so when I text and send, it will send them, for example, the P41, what it is - toilets - and the GPS
 coordinates of where it goes."

 The old text was the email's words: ten lines, about 700 characters, with dashes and middle dots that are not in
 the plain text alphabet (so every text held 70 characters, not 160). The service refuses a text over 480
 characters, so Send could not work for most references, and what a driver needs - what it is, where it goes, how
 to get in - sat in the middle of it. This one leads with those, in plain characters, inside three texts.

 Where it goes is navTargetFor(): the master plan's position where the plan tags the unit (master plan wins), a
 pin taken on site otherwise, then a position placed on the map, then the area. The text says which it is. The way
 in is entryOf(): a turn-in somebody pinned, else the pit lane rule (v7.42). */
const TEXT747_MAX = 459;          /* three plain texts */
const TEXT747_SERVICE_MAX = 480;  /* the service's own wall (SMS_MAX_CHARS) */
function text747Kind(a){
 return {building: 'Portable building', toilet: 'Toilets', generator: 'Generator', tower: 'Light tower',
 barrier: 'Water-filled barrier', furniture: 'Furniture'}[refKind(a)] || String(a.discipline || a.product || 'Item');
}
/* "WC43 - Toilets (FWF)", "P41 - Portable building (Building 6m) - QFES Crib Room", "GN01 - Generator (60kva)" */
function text747What(a){
 const low = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''), kind = text747Kind(a);
 const types = (a.item_types || []).filter(t => t && low(t) !== low(kind));
 /* "VMS × 8" is a count, not a name: it reads "x 8" after the type */
 const nm = String(a.name || '').split(' · ')[0].trim(), qm = nm.match(/^(.*?)\s*×\s*(\d+)$/);
 const name = qm ? qm[1].trim() : nm, qty = qm ? ' x ' + qm[2] : '';
 const plainWords = [kind, a.discipline, 'toilet', 'toilets', 'generator', 'generators', 'light tower', 'light towers',
 'lighting towers', 'furniture', 'barrier', 'barriers'].concat(a.item_types || []);
 const generic = !name || plainWords.some(w => w && (low(w) === low(name) || low(w) + 's' === low(name)));
 return a.key + ' - ' + kind + (types.length ? ' (' + types.join(', ') + ')' : '') + qty + (generic ? '' : ' - ' + name);
}
/* the plain text alphabet only: one odd character makes every text hold 70 characters instead of 160 */
function text747Plain(s){
 const t = smsPlain(s).replace(/\u00d7/g, 'x').replace(/\u00b0/g, ' deg').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
 return [...t].filter(ch => SMS_GSM.indexOf(ch) >= 0 || SMS_EXT.indexOf(ch) >= 0).join('');
}
function text747Where(a){
 const nt = navTargetFor(a), ll = nt ? nt.ll : null;
 if (!ll) return [movedFor(a) ? 'LOCATION CHANGED - the spot needs checking. Ring before you leave.'
 : 'GPS: none recorded yet - ring for the exact spot before you leave.'];
 const src = nt.pinned && nt.fix && nt.fix.master ? 'master plan'
 : nt.pinned ? 'pinned on site' + (nt.fix && nt.fix.acc != null ? ', within ' + Math.max(1, Math.round(nt.fix.acc)) + ' m' : '')
 : nt.placed ? 'placed on the map, not yet checked on site'
 : 'the area, not the exact spot';
 return ['GPS: ' + ll.lat.toFixed(6) + ', ' + ll.lon.toFixed(6) + ' (' + src + ')', 'Maps: ' + navUrl(ll)];
}
function text747WayIn(a){
 const e = entryOf(a.key); if (!e) return '';
 if (e.took === 'the pit lane rule') return e.end === 'south'
 ? 'Way in: off the Gold Coast Hwy at the paddock ramps into the pit lane, then up the lane (north-west).'
 : 'Way in: off the Gold Coast Hwy into the pit lane at its north-west end, then down it the way the race cars go.';
 if (e.lat != null && e.lon != null) return 'Way in: turn in at ' + e.lat.toFixed(6) + ', ' + e.lon.toFixed(6) + '.';
 return '';
}
function text747When(a){
 const eff = effectiveDates(a), day = (eff && eff.in) || a.first_date; if (!day) return '';
 const d = deliveryOf(a.key) || {};
 return 'Due ' + fmtDate(day) + (d.eta ? ', on site ' + d.eta : '');
}
function text747Link(a){
 const rec = (S.loads && Object.values(S.loads).find(l => (l.keys || []).includes(a.key) && l.card && webLink(l.card.url))) || null;
 const s = shareBase();
 return rec ? rec.card.url : (s.shared ? s.url + '#asset/' + encodeURIComponent(a.key) : '');
}
/* the text itself: what, where, how in - always; then the day and the pictures while it stays inside three texts */
function dropSmsText(a){
 const L = ['Coates GC500: ' + text747What(a)].concat(text747Where(a));
 const way = text747WayIn(a); if (way) L.push(way);
 const link = text747Link(a);
 [text747When(a), link ? 'Pictures: ' + link : ''].filter(Boolean).forEach(o => {
 if (smsShape(text747Plain(L.concat(o).join('\n'))).units <= TEXT747_MAX) L.push(o);
 });
 return text747Plain(L.join('\n'));
}
/* the Text box: a live count, the Messages link follows what is typed, and the long version on request */
function text747Wire(d, a, ready){
 const box = d.querySelector('#smTx'), cnt = d.querySelector('#smCount'), own = d.querySelector('#smOpen'), long = d.querySelector('#smLong');
 if (!box || !cnt) return;
 const redraw = () => {
 const v = box.value, sh = smsShape(v), over = ready && v.length > TEXT747_SERVICE_MAX;
 cnt.innerHTML = esc(sh.units + ' characters') + ' · <b>' + sh.parts + ' text' + (sh.parts === 1 ? '' : 's') + '</b>'
 + (sh.not_plain.length ? ' · <span class="warn747">' + esc(sh.not_plain.join(' ')) + ' ' + (sh.not_plain.length === 1 ? 'is' : 'are')
 + ' not in the plain alphabet, so each text holds 70 characters, not 160</span>' : '')
 + (over ? ' · <span class="warn747">over the ' + TEXT747_SERVICE_MAX + ' the service will send - trim it, or copy the words</span>' : '');
 if (own) own.href = 'sms:?&body=' + encodeURIComponent(v);
 const go = d.querySelector('#smGo'); if (go) go.disabled = over;
 };
 box.addEventListener('input', redraw);
 if (long) long.onclick = () => {
 const toLong = long.dataset.on !== '1';
 box.value = toLong ? text747Plain(dropSmsLong(a)) : dropSmsText(a);
 long.dataset.on = toLong ? '1' : '';
 long.textContent = toLong ? 'Back to the short text' : 'Full details';
 redraw();
 };
 redraw();
}
