// Packed layouts on the real v7.93 page: no dead space. Layout only - every component is the page's own, untouched.
//   OPT=0 (as built, measured) | 1 (packed) | 2 (packed + jump bar + folds)   PAGE=... OUTD=... [MOB=1] node packed.js
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const path = require('path');
(async () => { const MOB = !!process.env.MOB, OPT = process.env.OPT || '1';
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: +process.env.W || 1440, H: 900}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 4000));
  await p.evaluate(() => go('today')); await new Promise(r => setTimeout(r, 3000));
  await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '*{animation-duration:0s!important;transition:none!important}'; document.head.appendChild(st);
    let e = document.getElementById('pane-today'); while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) || cs.height !== 'auto') { e.style.overflow = 'visible'; e.style.height = 'auto'; e.style.maxHeight = 'none'; } e = e.parentElement; } document.documentElement.style.overflow = 'visible'; });
  // empty space: each section's area less its cards at their natural height
  const measure = () => p.evaluate(() => {
    const T = document.getElementById('pane-today'), vis = e => e.getClientRects().length > 0;
    const C = {'Instruments': T.querySelector(':scope > .inst'), "Today's work": T.querySelector('.hub'), 'By group': T.querySelector('#pane-progress .groups:not(.branches)'),
      'By branch': T.querySelector('#pane-progress .groups.branches'), 'Money': T.querySelector('#pane-progress .money-grid')};
    const nat = new Map();
    const fix = document.createElement('style'); fix.textContent = '.nat95 > *{align-self:start!important;height:auto!important;flex-grow:0!important}.nat95{align-items:start!important}.nat95 .racecard,.nat95 > .card{min-height:0!important}'; document.head.appendChild(fix);
    Object.values(C).forEach(c => c && c.classList.add('nat95'));
    Object.values(C).forEach(c => c && [...c.children].filter(vis).forEach(k => { const r = k.getBoundingClientRect(); nat.set(k, r.width * r.height); }));
    Object.values(C).forEach(c => c && c.classList.remove('nat95')); fix.remove();
    const out = {}; let A = 0, B = 0;
    for (const [n, c] of Object.entries(C)) { if (!c || !vis(c)) continue; const r = c.getBoundingClientRect(), area = r.width * r.height;
      const used = [...c.children].filter(vis).reduce((a, k) => a + (nat.get(k) || 0), 0); out[n] = {h: Math.round(r.height), empty: Math.round(Math.max(0, area - used) / area * 100)}; A += area; B += Math.max(0, area - used); }
    out.total = {empty: Math.round(B / A * 100), page: document.documentElement.scrollHeight};
    return out; });
  if (OPT !== '0') await p.evaluate(OPT => {
    const T = document.getElementById('pane-today'), pp = document.getElementById('pane-progress'), dsn = pp.querySelector(':scope > .dsn');
    const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const css = [];
    // the programme card across its width: the day and the bar | the next milestone | the key dates
    css.push(`@media (min-width:900px){
      #pane-today .inst > .racecard{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,1fr);column-gap:22px;align-items:start}
      #pane-today .inst > .racecard > .phead{grid-column:1/-1}
      #pane-today .inst > .racecard > .pgm{grid-column:1} #pane-today .inst > .racecard > .pnext{grid-column:2;margin-top:0!important}
      #pane-today .inst > .racecard > .pkeys{grid-column:3;margin-top:0!important;border-top:0!important;padding-top:0!important}
      .pk95 > *{align-self:start!important}
      .mas95{display:grid!important;grid-auto-rows:2px!important;row-gap:0!important;column-gap:14px!important;grid-auto-flow:row dense!important;align-items:start!important}
      .mas95 > *{align-self:start!important;height:auto!important;margin:0 0 14px!important;flex:none!important}
      #pane-today .hub.mas95{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}
    }`);
    // the cards pack at their natural height, like bricks, instead of sitting in rows
    const pack = c => { if (!c || innerWidth < 900) return; c.classList.add('mas95');
      [...c.children].forEach(k => { k.style.gridRowEnd = 'auto'; });
      requestAnimationFrame(() => {}); [...c.children].forEach(k => { const h = k.getBoundingClientRect().height; if (h) k.style.gridRowEnd = 'span ' + Math.ceil((h + 14) / 2); }); };
    const st0 = el('style', '', css.join('\n')); document.head.appendChild(st0);
    [T.querySelector(':scope > .hub'), dsn.querySelector(':scope > .groups:not(.branches)'), dsn.querySelector(':scope > .groups.branches')].forEach(pack);
    const money = dsn.querySelector(':scope > .money-grid'); if (money) money.style.alignItems = 'start';
    if (OPT === '2') {
      const secs = [...dsn.querySelectorAll(':scope > h3.sec')], secTitle = h => h.firstChild.textContent.trim();
      secs.forEach(h => { const body = h.nextElementSibling, n = body ? body.children.length : 0, t = secTitle(h); if (t === 'By group') return;
        const d = el('details', 'fold94'); d.appendChild(el('summary', '', `<b>${t}</b><span>${t === 'By branch' ? (n - 1) + ' branches and all of them together' : 'revenue · direct costs · the difference'}</span><i>Open ▾</i>`));
        h.before(d); d.appendChild(h); if (body) d.appendChild(body); d.addEventListener('toggle', () => { if (d.open && body && body.classList.contains('groups')) { body.classList.remove('mas95'); pack(body); } }); });
      const out = dsn.querySelector(':scope > .out'); if (out) { const d = el('details', 'fold94'); d.appendChild(el('summary', '', '<b>On site</b><span>what has gone out, by date</span><i>Open ▾</i>')); out.before(d); d.appendChild(out); }
      const targets = [['Today', T.querySelector(':scope > .acts793')], ["Today's work", T.querySelector(':scope > .sec793')], ...secs.map(h => [secTitle(h), h.closest('details') || h]),
        ['On site', (dsn.querySelector('.out') || document.body).closest('details')], ['Trade by trade', pp.querySelector('details.pdetail')]];
      const bar = el('nav', 'jump94'); targets.forEach(([n, t], i) => { if (!t) return; const b = el('a', 'jb94' + (i ? '' : ' on'), n); b.href = '#'; bar.appendChild(b); });
      T.querySelector(':scope > .acts793 .head').appendChild(bar);
      document.head.appendChild(el('style', '', `.jump94{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
        .jb94{font-weight:700;font-size:13px;padding:7px 12px;border-radius:999px;color:var(--ink,#14181d);text-decoration:none;border:1px solid var(--rule,#e4e0dc);background:var(--paper,#fff)}
        .jb94.on{background:#ff6a13;border-color:#ff6a13;color:#fff}
        .fold94{background:var(--paper,#fff);border:1px solid var(--rule,#e4e0dc);border-radius:14px;margin:0 0 12px;padding:0 14px}
        .fold94 > summary{list-style:none;cursor:pointer;display:flex;align-items:baseline;gap:14px;padding:14px 4px}
        .fold94 > summary::-webkit-details-marker{display:none}
        .fold94 > summary b{font-size:17px;font-weight:800;color:var(--ink,#14181d)} .fold94 > summary span{color:var(--mute,#4b535b);font-size:13px;flex:1}
        .fold94 > summary i{font-style:normal;font-weight:800;font-size:12px;letter-spacing:.08em;color:#b34a0d;text-transform:uppercase}
        .fold94 > h3.sec{display:none}`));
    }
  }, OPT);
  await new Promise(r => setTimeout(r, 2000));
  // the packing is worked out once the page has settled
  if (OPT !== '0') await p.evaluate(() => document.querySelectorAll('.mas95').forEach(c => [...c.children].forEach(k => { k.style.gridRowEnd = 'auto'; const h = k.getBoundingClientRect().height; if (h) k.style.gridRowEnd = 'span ' + Math.ceil((h + 14) / 2); })));
  await new Promise(r => setTimeout(r, 800));
  const m = await measure();
  const tag = 'opt' + OPT + (MOB ? '_phone' : '_' + (process.env.W || 1440));
  console.log(tag, JSON.stringify(m), 'errors', s.errors.length);
  await p.screenshot({path: path.join(process.env.OUTD, tag + '.png'), fullPage: true});
  await s.browser.close(); })();
