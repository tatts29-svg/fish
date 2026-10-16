"""Author: Andrew Fisher. v10.53 - no twin-steer trucks: a tick before any print or PDF, on every load and print-out
(Andrew, 17 Oct 2026; demob added the same day: "Same with demob"). Wording: WORDING.md beside this file.

- Before anything prints or a PDF is made, whoever is printing ticks "I confirm no twin-steer truck will be used for
  any load on this paperwork" and gives their name. There is no skip and no "don't ask again"; each print job asks.
  - Every print, PDF, run sheet, drop sheet, docket and stored-PDF button asks first.
  - The drivers and demob pre-dispatch checklist gets it as a compulsory box, so those routes ask once.
  - Behind that, a print the buttons did not catch is refused until the tick is done.
  - The page's PDF maker refuses until ticked.
  - Ctrl+P is caught. A print from the browser's own menu, without the tick, prints only the warning.
- Every printed page carries the short rule down its left edge, with who ticked and when. So does every PDF page.
- A red strip under the header shows on every tab. The drawer and the Timeline truck flow card carry the rule. The
  drivers' texts and the daily run message end with it.

No record change. Footer v10.52 -> v10.53.

    python3 patch_v1053.py path/to/page.html   (on the v10.52 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

END = "</script>\n</body>\n</html>"

NEW = r'''</script>
<script id="twinsteer1053-script">/* Author: Andrew Fisher. v10.53 - no twin-steer trucks: a tick before any print or PDF, on every load and print-out. */
(function(W){
 'use strict';
 const D = W.document;
 const TITLE = 'NO TWIN-STEER TRUCKS — GC500 SITE';
 const RULE = 'Twin-steer trucks must not be used for any GC500 delivery or pick-up. That means nowhere on the track, the Esplanade or inside Macintosh Island Park.';
 const WHEN = 'This applies to every delivery and pick-up in Week 3, Week 2, Week 1, Race Week and demob. Week 1: there is next to no room on site. Race Week: the track is more enclosed and runs one way only.';
 const WHY = 'If a twin-steer truck turns up, it will cause delays on site. There is nowhere to park and nowhere to unload, and it may not be able to unload at all.';
 const TICK = 'I confirm no twin-steer truck will be used for any load on this paperwork.';
 const SHORT = 'NO TWIN-STEER TRUCKS: not on the track, the Esplanade or inside Macintosh Island Park · Week 3, Week 2, Week 1, Race Week and demob · nowhere to park or unload';
 const SMS = 'NO TWIN-STEER TRUCKS: not on the track, the Esplanade or inside Macintosh Island Park (Week 3 to Race Week and demob). A twin-steer has nowhere to park or unload and may not be able to unload at all.';
 const CHECK_ID = 'twin-steer-1053';
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const say = m => { try { flash(m); } catch (x) {} };
 /* one print job at a time: ticked, then good for that job (until the print closes, two minutes at most) */
 const G = {until: 0, by: '', at: '', real: 0};
 const armed = () => Date.now() < G.until;
 const stampWords = () => G.by ? 'Checked by ' + G.by + ', ' + G.at : '';
 function arm(by, ms){
  G.until = Date.now() + (ms || 120000); G.by = String(by || '').trim().slice(0, 60);
  try { G.at = new Date().toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}).replace(',', ''); } catch (x) { G.at = new Date().toISOString(); }
  D.documentElement.classList.add('ts1053-armed');
  const s = D.getElementById('ts1053-strip'); if (s) s.textContent = SHORT + (stampWords() ? ' · ' + stampWords() : '');
  try { localStorage.setItem('gc500.printedBy', G.by); } catch (x) {}
 }
 function disarm(){ G.until = 0; D.documentElement.classList.remove('ts1053-armed'); }
 const fullName = v => { try { if (typeof flow891FullName === 'function') return !!flow891FullName(v); } catch (x) {} return /\S+\s+\S+/.test(String(v || '').trim()); };
 /* the tick */
 function ask(then){
  if (D.getElementById('ts1053')) return;
  let name = ''; try { name = localStorage.getItem('gc500.printedBy') || ''; } catch (x) {} if (!name) { try { name = whoAmI() || ''; } catch (x) {} }
  const box = D.createElement('div'); box.id = 'ts1053'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ts1053h');
  box.innerHTML = '<div class="ts1053-box"><h2 id="ts1053h">⛔ ' + e(TITLE) + '</h2><p class="ts1053-rule">' + e(RULE) + '</p><p>' + e(WHEN) + '</p><p>' + e(WHY) + '</p>' +
   '<label class="ts1053-ck"><input type="checkbox" id="ts1053c"> <b>' + e(TICK) + '</b></label>' +
   '<label class="ts1053-nm" for="ts1053n">Your full name</label><input id="ts1053n" autocomplete="name" value="' + e(name) + '">' +
   '<p class="ts1053-note">You can\'t print run sheets, dockets or load paperwork until you tick the box.</p>' +
   '<div class="ts1053-acts"><button type="button" class="btn" data-ts1053-no>Cancel</button><button type="button" class="btn primary" data-ts1053-go disabled>Tick done — continue</button></div></div>';
  D.body.appendChild(box);
  const ck = box.querySelector('#ts1053c'), nm = box.querySelector('#ts1053n'), go = box.querySelector('[data-ts1053-go]');
  const ok = () => ck.checked && fullName(nm.value); const sync = () => { go.disabled = !ok(); };
  ck.addEventListener('change', sync); nm.addEventListener('input', sync); sync();
  const close = () => box.remove();
  box.querySelector('[data-ts1053-no]').onclick = () => { close(); say('Not printed: the twin-steer check was not ticked.'); };
  box.addEventListener('keydown', ev => { if (ev.key === 'Escape') { close(); say('Not printed: the twin-steer check was not ticked.'); } });
  go.onclick = () => { if (!ok()) return; arm(nm.value); close(); try { if (then) then(); } catch (x) {} };
  setTimeout(() => { try { ck.focus(); } catch (x) {} }, 30);
 }
 /* 1. the print and PDF buttons: asked first, then the button runs as normal */
 const CHECKLIST_ROUTES = '[data-print-drv],[data-tl841-print],[data-print816]'; /* these open the pre-dispatch checklist, which carries the tick */
 function trigger(el){
  const t = el && el.closest && el.closest('button,a,[role="button"],label.btn,input[type="button"],input[type="submit"]'); if (!t) return null;
  if (t.closest('#ts1053,#drv782')) return null;
  if (t.matches(CHECKLIST_ROUTES)) return null;
  const names = [...t.attributes].map(a => a.name).join(' ') + ' ' + (t.id || '');
  const href = t.getAttribute('href') || '', words = (t.textContent || t.value || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  if (/print|pdf7|ep819|ep860|inv83|data-drop\b|data-advice|data-handover|data-ps7|dropsheet/i.test(names)) return t;
  if (/#print\/|\.pdf(\?|#|$)/i.test(href)) return t;
  if (/\bprint|\bpdf\b|run sheets?|drop sheets?|save as pdf|docket book/i.test(words)) return t;
  return null;
 }
 D.addEventListener('click', ev => {
  const t = trigger(ev.target); if (!t || armed()) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  ask(() => { try { t.click(); } catch (x) {} });
 }, true);
 /* 2. the backstop: a print that did not come through a button is refused until ticked */
 const nativePrint = W.print.bind(W);
 const realPrint = () => { G.real++; return nativePrint(); };
 W.print = function(){ if (armed()) return realPrint(); ask(() => say('Ticked. Press Print again.')); throw new Error('The twin-steer check comes before printing'); };
 /* 3. Ctrl+P, and the browser's own print menu */
 D.addEventListener('keydown', ev => { if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === 'p' || ev.key === 'P')) { ev.preventDefault(); ev.stopImmediatePropagation(); if (armed()) realPrint(); else ask(() => realPrint()); } }, true);
 let lockedPrint = false;
 W.addEventListener('beforeprint', () => { lockedPrint = !armed(); });
 W.addEventListener('afterprint', () => { const was = lockedPrint; lockedPrint = false; setTimeout(disarm, 800); if (was) setTimeout(() => ask(() => say('Ticked. Print again now.')), 900); });
 /* 4. the pre-dispatch checklist (drivers and demob) carries the tick as a compulsory box */
 if (typeof checks826 === 'function') { const b = checks826; checks826 = function(m){ const C = (b.apply(this, arguments) || []).slice(); if (!C.some(c => c.id === CHECK_ID)) C.unshift({id: CHECK_ID, text: '⛔ NO TWIN-STEER TRUCKS: none of these loads is on a twin-steer truck — not on the track, the Esplanade or inside Macintosh Island Park. Week 1 has next to no room; in Race Week the track is enclosed and one way.'}); return C; }; W.checks826 = checks826; }
 if (typeof checkDialog826 === 'function') { const bd = checkDialog826; checkDialog826 = function(read, snap, done, changed){ return bd.call(this, read, snap, function(record){ try { if (record && (record.checks || []).includes(CHECK_ID)) arm(record.by, 180000); } catch (x) {} return done.apply(this, arguments); }, changed); }; W.checkDialog826 = checkDialog826; }
 /* 5. PDFs: the page's own PDF maker refuses until ticked, and stamps the rule on every page */
 function stampDoc(doc){
  if (doc.__ts1053) return; doc.__ts1053 = true;
  try { const n = doc.internal.getNumberOfPages(), H = doc.internal.pageSize.getHeight(), k = doc.internal.scaleFactor, mm = v => v * 72 / 25.4 / k;
   for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(170, 0, 0); doc.text(SHORT + (stampWords() ? ' · ' + stampWords() : ''), mm(4), H - mm(8), {angle: 90}); } } catch (x) {}
 }
 function wrapJs(J){
  if (!J || J.__ts1053) return J;
  const Wr = function(){ const doc = new (Function.prototype.bind.apply(J, [null].concat([].slice.call(arguments))))();
   for (const m of ['output', 'save']) { const orig = doc[m] && doc[m].bind(doc); if (!orig) continue;
    doc[m] = function(){ if (!armed()) { ask(() => say('Ticked. Make the PDF again.')); throw new Error('The twin-steer check comes before a PDF'); } stampDoc(doc); return orig.apply(null, arguments); }; }
   return doc; };
  Object.keys(J).forEach(k => { try { Wr[k] = J[k]; } catch (x) {} }); Wr.API = J.API; Wr.prototype = J.prototype; Wr.__ts1053 = true; return Wr;
 }
 if (typeof pdf7Lib === 'function') { const pl = pdf7Lib; pdf7Lib = function(){ return Promise.resolve(pl.apply(this, arguments)).then(lib => lib && lib.jsPDF ? Object.assign({}, lib, {jsPDF: wrapJs(lib.jsPDF)}) : lib); }; W.pdf7Lib = pdf7Lib; }
 /* 6. the words on the drivers' texts and messages */
 if (typeof dropSmsLong === 'function') { const b = dropSmsLong; dropSmsLong = function(){ const t = b.apply(this, arguments); return typeof t === 'string' && t.indexOf('TWIN-STEER') < 0 ? t + '\n\n' + SMS : t; }; }
 if (typeof daily861Body === 'function') { const b = daily861Body; daily861Body = function(){ const t = b.apply(this, arguments); if (typeof t !== 'string' || t.indexOf('TWIN-STEER') >= 0) return t; let s = SMS; try { if (typeof daily861Gsm === 'function') s = daily861Gsm(SMS); } catch (x) {} return t + '\n\n' + s; }; }
 if (typeof pdf7MailText === 'function') { const b = pdf7MailText; pdf7MailText = function(){ const r = b.apply(this, arguments); try { if (typeof r === 'string' && r.indexOf('TWIN-STEER') < 0) return r + '\n\n' + SMS; if (r && typeof r.body === 'string' && r.body.indexOf('TWIN-STEER') < 0) return Object.assign({}, r, {body: r.body + '\n\n' + SMS}); } catch (x) {} return r; }; }
 /* 7. on screen: under the header on every tab, in the drawer and on the Timeline truck flow card */
 if (typeof flow891Card === 'function') { const b = flow891Card; flow891Card = function(){ const h = b.apply(this, arguments); return typeof h === 'string' && h.indexOf('ts1053-rule') < 0 ? h + '<section class="card nosfold ts1053-rule" role="note"><b>⛔ ' + e(TITLE) + '</b><p>' + e(RULE) + ' ' + e(WHEN) + '</p></section>' : h; }; }
 function banners(){
  if (!D.body) return;
  if (!D.getElementById('ts1053-banner')) { const tabs = D.getElementById('tabs'); const b = D.createElement('div'); b.id = 'ts1053-banner'; b.setAttribute('role', 'note');
   b.innerHTML = '⛔ <b>NO TWIN-STEER TRUCKS</b> on the track, the Esplanade or inside Macintosh Island Park · Week 3 to Race Week and demob';
   if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(b, tabs); else D.body.insertBefore(b, D.body.firstChild); }
  if (!D.getElementById('ts1053-lock')) { const l = D.createElement('div'); l.id = 'ts1053-lock';
   l.innerHTML = '<h1>⛔ ' + e(TITLE) + '</h1><p>' + e(RULE) + '</p><p>' + e(WHEN) + '</p><p>' + e(WHY) + '</p><p><b>Not printed.</b> Use the page\'s Print buttons and tick the twin-steer check first.</p>'; D.body.appendChild(l); }
  if (!D.getElementById('ts1053-strip')) { const s = D.createElement('div'); s.id = 'ts1053-strip'; s.setAttribute('aria-hidden', 'true'); s.textContent = SHORT; D.body.appendChild(s); }
  const dr = D.getElementById('drawer'); const db = dr && dr.classList.contains('on') && (dr.querySelector('.db') || dr);
  if (db && !db.querySelector('.ts1053-drawer')) { const x = D.createElement('div'); x.className = 'ts1053-drawer'; x.setAttribute('role', 'note'); x.innerHTML = '⛔ <b>No twin-steer trucks</b> on the track, the Esplanade or inside Macintosh Island Park'; db.insertBefore(x, db.firstChild); }
 }
 let q = false; const run = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; try { banners(); } catch (x) {} }); };
 const watch = () => { banners(); const dr = D.getElementById('drawer'); if (dr && !dr.__ts1053) { dr.__ts1053 = true; new MutationObserver(run).observe(dr, {childList: true, subtree: false, attributes: true, attributeFilter: ['class']}); const db = dr.querySelector('.db'); if (db) new MutationObserver(run).observe(db, {childList: true}); } };
 if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch); else watch();
 if (typeof W.openAsset === 'function') { const o = W.openAsset; W.openAsset = function(){ const r = o.apply(this, arguments); try { run(); setTimeout(run, 400); } catch (x) {} return r; }; }
 const st = D.createElement('style'); st.id = 'twinsteer1053-style';
 st.textContent = '#ts1053-banner{background:#b3120b;color:#fff;font-weight:600;font-size:13px;line-height:1.35;padding:6px 12px;text-align:center;letter-spacing:.01em}' +
  '#ts1053-banner b{font-weight:900;letter-spacing:.04em}' +
  '.ts1053-drawer{background:#fde8e6;color:#8e1c12;border-left:4px solid #b3120b;padding:6px 10px;margin:0 0 8px;font-size:13px;border-radius:4px}' +
  '.ts1053-rule{border-left:4px solid #b3120b!important;background:#fde8e6!important;color:#5a0d07!important}.ts1053-rule p{margin:4px 0 0}' +
  '#ts1053{position:fixed;inset:0;z-index:2147483646;background:rgba(10,10,10,.6);display:flex;align-items:center;justify-content:center;padding:16px}' +
  '#ts1053 .ts1053-box{background:#fff;color:#1d1d1b;max-width:560px;width:100%;max-height:92vh;overflow:auto;border-radius:10px;padding:18px 18px 14px;border-top:8px solid #b3120b;box-shadow:0 12px 40px rgba(0,0,0,.4)}' +
  '#ts1053 h2{margin:0 0 8px;color:#b3120b;font-size:20px;line-height:1.25}#ts1053 p{margin:6px 0;font-size:15px;line-height:1.4}#ts1053 .ts1053-rule{font-weight:700}' +
  '#ts1053 .ts1053-ck{display:flex;gap:10px;align-items:flex-start;margin:12px 0;padding:10px;border:2px solid #b3120b;border-radius:8px;font-size:15px;cursor:pointer}#ts1053 .ts1053-ck input{width:22px;height:22px;flex:none;margin-top:1px}' +
  '#ts1053 .ts1053-nm{display:block;font-weight:700;margin:6px 0 4px}#ts1053 #ts1053n{width:100%;box-sizing:border-box;font-size:16px;padding:8px;border:1px solid #888;border-radius:6px}' +
  '#ts1053 .ts1053-note{color:#5f6368;font-size:13px}#ts1053 .ts1053-acts{display:flex;gap:10px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}' +
  '#ts1053 [data-ts1053-go]{background:#b3120b;color:#fff;border-color:#b3120b}#ts1053 [data-ts1053-go]:disabled{opacity:.45}' +
  '#ts1053-lock,#ts1053-strip{display:none}' +
  '@media print{' +
   'html:not(.ts1053-armed):not(#ts1053x):not(#ts1053y):not(#ts1053z) body>*:not(#ts1053-lock){display:none!important}' +
   'html:not(.ts1053-armed):not(#ts1053x):not(#ts1053y):not(#ts1053z) #ts1053-lock{display:block!important;font:14pt/1.4 Arial,sans-serif;color:#000;padding:20mm}' +
   'html:not(.ts1053-armed) #ts1053-lock h1{color:#b3120b;font-size:22pt}' +
   'html.ts1053-armed:not(#ts1053x):not(#ts1053y):not(#ts1053z) #ts1053-strip{display:block!important;position:fixed;left:4mm;top:12mm;bottom:12mm;width:4mm;writing-mode:vertical-rl;transform:rotate(180deg);font:6.5pt/1 Arial,sans-serif;color:#a00;text-align:center;z-index:2147483647;white-space:nowrap;overflow:hidden}' +
   '#ts1053,#ts1053-banner,.ts1053-drawer{display:none!important}}';
 D.head.appendChild(st);
 W.ts1053 = {armed, arm, disarm, ask, stats: G, SHORT, SMS, CHECK_ID};
})(window);
</script>
</body>
</html>'''

PATCHES = [
    ('twin-steer gate script at the end of the page', END, NEW),
    ('Release footer', "+ ' · v10.52'", "+ ' · v10.53'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'twinsteer1053-script' in t: sys.exit('patch_v1053 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1053 applied: twin-steer tick before any print or PDF, checklist box, print lock, banners and texts; footer v10.52 -> v10.53')
