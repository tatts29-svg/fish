// read-only: v12.56 functional checks + screenshots (tabs, tracker strip, Today By group, money, map rings switch)
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.56/GC500_Delivery_Control_hosted.html';
const OUTDIR = process.env.OUTDIR || '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/shots56';
fs.mkdirSync(OUTDIR, {recursive: true});
(async () => {
  const h = await open({pageFile: PAGE, hash: '#today', W: 1440, H: 1000});
  const p = h.page; const R = {};
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const hideOverlays = () => p.evaluate(() => { document.querySelectorAll('*').forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && !el.closest('.tabs, nav')) el.setAttribute('data-hid56', el.style.visibility || ''), el.style.visibility = 'hidden'; }); });
  const showOverlays = () => p.evaluate(() => { document.querySelectorAll('[data-hid56]').forEach(el => { el.style.visibility = el.getAttribute('data-hid56'); el.removeAttribute('data-hid56'); }); });
  const shot = async (sel, name, opts) => { try { const el = await p.$(sel); if (!el) { R['shot_' + name] = 'no element ' + sel; return; } await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await el.screenshot({path: OUTDIR + '/' + name + '.png', ...(opts || {})}); R['shot_' + name] = 'ok'; } catch (e) { R['shot_' + name] = 'fail ' + e.message.slice(0, 120); } };
  // 1. tabs
  R.tabs = await p.evaluate(() => ({ off: [...TABS_OFF], bar: [...document.querySelectorAll('.tabs [data-goto], .tabs button, nav [data-goto]')].map(b => b.getAttribute('data-goto') || b.textContent.trim()).slice(0, 40), menu: [...document.querySelectorAll('#mmViews [data-goto]')].map(b => b.getAttribute('data-goto')), charge: moneySummary().charge.total }));
  await p.evaluate(() => { try { go('vmsoff'); } catch (e) {} }); await p.waitForTimeout(800);
  R.vmsoffLandsOn = await p.evaluate(() => ({hash: location.hash, pane: (document.querySelector('main .pane:not([hidden])') || {}).id || null}));
  await p.evaluate(() => { try { go('edit'); } catch (e) {} }); await p.waitForTimeout(800);
  R.editLandsOn = await p.evaluate(() => ({hash: location.hash, pane: (document.querySelector('main .pane:not([hidden])') || {}).id || null}));
  await shot('.tabs', 'tabbar');
  // 2. Today By group
  await p.evaluate(() => go('today')); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('details').forEach(d => { if (/Build complete|Build progress/i.test(d.querySelector('summary')?.textContent || '')) d.open = true; }); const b = [...document.querySelectorAll('button, summary')].find(x => /^Show$/i.test((x.textContent || '').trim())); if (b) b.click(); });
  await p.waitForTimeout(1500);
  R.groups = await p.evaluate(() => [...document.querySelectorAll('.grp[data-disc]')].map(g => ({disc: g.getAttribute('data-disc'), cls: g.className, n: (g.querySelector('.n') || {}).textContent, note: (g.querySelector('.note') || {}).textContent || null, types: [...g.querySelectorAll('table.bt tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim()).join(' | '))})));
  await hideOverlays();
  for (const d of ['Forklifts', 'Furniture', 'Track mat', 'Generators']) { const sel = `.grp[data-disc="${d}"]`; await shot(sel, 'group_' + d.replace(/\W+/g, '_')); }
  // the whole plates block
  const platesSel = await p.evaluate(() => { const g = document.querySelector('.grp[data-disc]'); const wrap = g && g.parentElement; if (wrap) { wrap.setAttribute('data-plates56', '1'); return '[data-plates56]'; } return null; });
  if (platesSel) await shot(platesSel, 'groups_all');
  await showOverlays();
  // 3. Costs P&L card
  await p.evaluate(() => go('costs')); await p.waitForTimeout(3000);
  await hideOverlays();
  const plSel = await p.evaluate(() => { const c = document.querySelector('.pl-cols'); const card = c && (c.closest('details, section, .card') || c.parentElement); if (card) { card.setAttribute('data-pl56', '1'); if (card.tagName === 'DETAILS') card.open = true; return '[data-pl56]'; } return null; });
  R.plSel = plSel; if (plSel) await shot(plSel, 'costs_pl');
  R.plRev = await p.evaluate(() => pl770Model().rev.map(r => [r.code, r.line, Math.round(r.now * 100) / 100]));
  await showOverlays();
  // 4. Servicing tracker strip
  await p.evaluate(() => go('servicing')); await p.waitForTimeout(3000);
  await p.evaluate(() => { document.querySelectorAll('details.svc1160-history').forEach(d => d.open = true); });
  await p.waitForTimeout(800);
  R.tracker = await p.evaluate(() => ({ history: [...document.querySelectorAll('details.svc1160-history [data-svc-day]')].map(b => b.textContent.trim().replace(/\s+/g, ' ')), active: [...document.querySelectorAll('#pane-servicing .svc-days [data-svc-day]')].map(b => b.getAttribute('data-svc-day')) }));
  await hideOverlays();
  await shot('details.svc1160-history', 'tracker_strip');
  await showOverlays();
  // 5. Map explorer: controls bar + rings switch
  await p.evaluate(() => go('map')); await p.waitForTimeout(9000);
  R.mapBar = await p.evaluate(() => { const bar = document.getElementById('map1147-controls'); return bar ? {text: bar.innerText.replace(/\s+/g, ' ').slice(0, 300), hasSwitch: !!bar.querySelector('#map1256-left'), checked: !!(bar.querySelector('#map1256-left') || {}).checked} : null; });
  const frame = p.frames().find(f => /explorer/i.test(f.url()) || f.name() === 'expframe');
  R.frameUrl = frame ? frame.url() : null;
  const ringsIn = async () => { if (!frame) return null; try { return await frame.evaluate(() => ({ left: window.GC500MapLeft1256 ? GC500MapLeft1256.state.showLeft : 'no module', rings: typeof Offsite1225 !== 'undefined' && Offsite1225.state ? (Offsite1225.state.points || Offsite1225.state.n || null) : 'n/a', keyHidden: (document.getElementById('map1256-key') || {}).hidden })); } catch (e) { return 'err ' + e.message.slice(0, 100); } };
  R.ringsBefore = await ringsIn();
  await hideOverlays();
  await shot('#expcard', 'map_before');
  // satellite view if a control exists in the parent
  await p.evaluate(() => { const b = [...document.querySelectorAll('#expcard button, #expcard select option')].find(x => /satellite/i.test(x.textContent || '')); if (b && b.tagName === 'BUTTON') b.click(); });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const c = document.getElementById('map1256-left'); if (c) { c.checked = true; c.dispatchEvent(new Event('change', {bubbles: true})); } });
  await p.waitForTimeout(2500);
  R.ringsAfter = await ringsIn();
  R.mapBarAfter = await p.evaluate(() => { const bar = document.getElementById('map1147-controls'); return bar ? {checked: !!(bar.querySelector('#map1256-left') || {}).checked} : null; });
  await shot('#expcard', 'map_after');
  await showOverlays();
  R.pageErrors = h.errors.slice(0, 5); R.errorCount = h.errors.length;
  fs.writeFileSync(OUTDIR + '/probe56.json', JSON.stringify(R, null, 1));
  console.log(JSON.stringify(R, null, 1).slice(0, 6000));
  await h.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
