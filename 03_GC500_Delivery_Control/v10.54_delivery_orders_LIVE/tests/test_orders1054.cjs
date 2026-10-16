// Author: Andrew Fisher. v10.54 delivery orders, line 93 join, unit photos. GET-only against the live record.
//   node test_orders1054.cjs path/to/page.html [shotdir]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shots = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function drawerCard(p, ref){ await p.evaluate(r => openAsset(r), ref); await p.waitForTimeout(1500); return p.evaluate(() => { const c = document.querySelector('#drawer .seq1054'); return c ? {txt: c.innerText.replace(/\s+/g, ' '), me: [...c.querySelectorAll('.o1054.me')].map(x => x.innerText)} : null; }); }
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop';
  const h = await open(Object.assign({pageFile: page, hash: '#timeline'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(3500);
   const t = await p.evaluate(() => ({foot: document.getElementById('footL').textContent, list: (document.querySelector('#pane-timeline .seq1054-all') || {}).innerText || '', over: document.documentElement.scrollWidth > window.innerWidth + 1}));
   ok(/v10\.5[4-9]$/.test(t.foot), tag + ': footer v10.54 or later');
   ok(/Delivery orders to keep/.test(t.list) && (t.list.match(/Day \d+/g) || []).length === 11 && /P55[\s\S]*P56[\s\S]*P54[\s\S]*P52[\s\S]*P57/.test(t.list), tag + ': Timeline lists the 11 locked orders (group 4 P55 P56 P54 P52 P57)');
   ok(/WC17/.test(t.list) && /P36/.test(t.list) && /P10/.test(t.list), tag + ': the WC17 rule is listed');
   if (shots && mob) { await p.evaluate(() => document.querySelector('#pane-timeline .seq1054-all').scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({path: shots + '/timeline_orders_phone.png'}); }
   const c63 = await drawerCard(p, 'P63'); ok(c63 && /P63[\s\S]*→[\s\S]*P62[\s\S]*→[\s\S]*P60/.test(c63.txt) && c63.me.join() .includes('P63') && /1 of 3/.test(c63.txt), tag + ': P63 drawer: P63 → P62 → P60, 1 of 3');
   if (shots && mob) { await p.evaluate(() => document.querySelector('#drawer .seq1054').scrollIntoView()); await p.waitForTimeout(300); await p.screenshot({path: shots + '/p63_order_phone.png'}); }
   const c36 = await drawerCard(p, 'P36'); ok(c36 && /HRP/.test(c36.txt) && /WC17/.test(c36.txt), tag + ': P36 drawer: its group and the WC17 rule');
   const c05 = await drawerCard(p, 'WC05'); ok(c05 && c05.me.length === 2 && /waste tank[\s\S]*toilet block[\s\S]*P04/.test(c05.txt) && /P04 comes only after/.test(c05.txt), tag + ': WC05 drawer: tank then block, P04 last');
   const c17 = await drawerCard(p, 'WC17'); ok(c17 && /before P36 and P10/.test(c17.txt), tag + ': WC17 drawer: blocks before P36 and P10');
   const r = await p.evaluate(() => { const row = ONHIRE_ROWS.find(x => String(x.rental_contract) === '9968862' && Number(x.line) === 93); const a = assetOf('P65'), m = gcModel925(a), u = m.rows.find(x => x.physical && String(x.assetNo) === '1327217' && x.active !== false);
    const a6 = assetOf('P66'), m6 = gcModel925(a6), u6 = m6.rows.find(x => x.physical && String(x.assetNo) === '1327222' && x.active !== false);
    const a0 = assetOf('P06'), m0 = gcModel925(a0), u0 = m0.rows.find(x => x.physical && x.active !== false);
    return {p06: u0 ? Units925.photos(u0, m0.rows, dropPhotosOf('P06')).length : -1, key: row && row.match.key, p65: u ? Units925.photos(u, m.rows, dropPhotosOf('P65')).length : -1, p66: u6 ? Units925.photos(u6, m6.rows, dropPhotosOf('P66')).length : -1}; });
   ok(r.key === 'HRP', tag + ': Baseplan line 93 joins HRP');
   ok(r.p65 >= 2 && r.p66 >= 2, tag + ': Andrew\'s unit photos attach again (P65 ' + r.p65 + ', P66 ' + r.p66 + ')');
   ok(r.p06 === 3, tag + ': P06 shows Andrew\'s three 30 Sep photos (' + r.p06 + ')');
   ok(!t.over, tag + ': no sideways scroll');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
