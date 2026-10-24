// v7.44 practice tests. Author: Andrew Fisher.
// Harness aborts all service writes; sync writes below are captured in this isolated browser only.
const path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const checks = [];
let browser;
function ok(name, pass, detail) {
 checks.push({name, pass: !!pass});
 console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + JSON.stringify(detail) : ''));
}
(async () => {
 const mobile = process.env.MOB === '1';
 const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1300, H: mobile ? 844 : 950, dpr: 1, gl: false});
 browser = s.browser;
 const p = s.page;
 await p.waitForFunction(() => typeof subhire744DrawerHtml === 'function' && SYNC.status === 'live', null, {timeout: 240000});
 const ro = await p.evaluate(() => {
  openAsset('WC17');
  const before = JSON.stringify(S), button = document.querySelector('#drawer [data-s744-open]');
  const result = subhire744One('WC17', 'Practice Supplier', 'Q744RO');
  return {button: !!button, disabled: button && button.disabled, result, untouched: before === JSON.stringify(S)};
 });
 ok('view link shows disabled Add sub-hired gear and refuses writes', ro.button && ro.disabled && ro.result === false && ro.untouched, ro);
 await p.evaluate(() => {
  window.__practiceCap = 'edit'; window.capability = () => window.__practiceCap;
  SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher via Codex';
  window.__writes = [];
  SYNC.db.doc = path => ({id: path.split('/')[1], path, set: async value => { window.__writes.push([path, JSON.parse(JSON.stringify(value))]); }, delete: async () => { window.__writes.push([path, null]); }});
  const original = window.fetch;
  window.fetch = async (u, o) => { const r = await original(u, o); if (/\/api\/(version|state)(\?|$)/.test(String(u)) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; };
  window.__beforeNumbers = JSON.stringify(S.assetNumbers);
  window.__beforeUnits = JSON.stringify(unitsOf('WC17'));
  window.__beforeMoneyFields = JSON.stringify({rates:S.rates, accRates:S.accRates, labour:S.labour, extras:S.extras});
  window.__beforeLabour = JSON.stringify(labourPlan().all);
  openAsset('WC17');
 });
 await p.locator('#drawer [data-s744-open]').click();
 await p.locator('#sub744Co').fill('Practice Supplier');
 await p.locator('#sub744Numbers').fill('Q744A\nQ744B');
 await p.locator('#drawer [data-s744-add]').click();
 const mixed = await p.evaluate(() => ({units: subOf('WC17').filter(x => x.co === 'Practice Supplier').map(x => x.no), marked: subhireCo('WC17'), numbersSame: JSON.stringify(S.assetNumbers) === window.__beforeNumbers,
  originalPreserved: JSON.parse(window.__beforeUnits).every(u => unitsOf('WC17').some(x => JSON.stringify(x) === JSON.stringify(u))), moneySame: window.__beforeMoneyFields === JSON.stringify({rates:S.rates, accRates:S.accRates, labour:S.labour, extras:S.extras}), labourSame: window.__beforeLabour === JSON.stringify(labourPlan().all), register: subRegister().some(g => g.co === 'Practice Supplier' && g.locs.some(l => l.a.key === 'WC17'))}));
 ok('drawer adds supplier units to mixed location without marking or Coates writes', mixed.units.includes('Q744A') && mixed.units.includes('Q744B') && !mixed.marked && mixed.numbersSame && mixed.originalPreserved && mixed.register, mixed);
 ok('adding supplier units does not alter financial entries or labour totals', mixed.moneySame && mixed.labourSame, mixed);
 const dup = await p.evaluate(() => {
  const before = JSON.stringify(S.units), first = subAdd('WC17', 'Different Supplier', 'Q744A'), across = subAdd('WC27', 'Practice Supplier', 'q744a'), badCo = subAdd('WC17', 'Coates', 'Q744C');
  return {first, across, badCo, unchanged: before === JSON.stringify(S.units)};
 });
 ok('existing number cannot be overwritten or placed at another location', !dup.first && !dup.across && !dup.badCo && dup.unchanged, dup);
 const short = await p.evaluate(() => { const r = subAddMany('WC17', 'Practice Supplier', 'Q 0000744 744 Q744A invalid!'); return {r, found: subOf('WC17').filter(x => ['Q','0000744','744'].includes(x.no)).map(x => x.no)}; });
 ok('short numbers and leading zeros survive; duplicates and invalid numbers are refused', short.found.length === 3 && short.r.added.length === 3 && short.r.refused.length === 2, short);
 const legacy = await p.evaluate(() => {
  const k = 'WC27', original = unitsLocal(k).slice();
  unitsSet(k, original.concat([{label:'Sub-hire: Legacy Supplier',asset_no:null,by:'practice',at:'2026-09-30T00:00:00Z'}, {label:'Practice board',asset_no:'Q744BOARD',by:'practice',at:'2026-09-30T00:00:00Z'}]));
  const board = JSON.stringify(unitsOf(k).find(u => u.asset_no === 'Q744BOARD'));
  const blocked = subAdd(k, 'Legacy Supplier', 'Q744BOARD'), added = subAdd(k, 'Legacy Supplier', 'Q744LEG');
  return {blocked, added, legacyKept: unitsOf(k).some(u => u.label === 'Sub-hire: Legacy Supplier' && !u.asset_no), newKept: unitsOf(k).some(u => u.asset_no === 'Q744LEG'), boardKept: board === JSON.stringify(unitsOf(k).find(u => u.asset_no === 'Q744BOARD'))};
 });
 ok('generic board and legacy unnamed unit are never overwritten', !legacy.blocked && legacy.added && legacy.legacyKept && legacy.newKept && legacy.boardKept, legacy);
 const unknown = await p.evaluate(() => {
  subAdd('WC17', 'Practice Supplier', ''); subAdd('WC17', 'Practice Supplier', '');
  const initial = subOf('WC17').filter(x => x.co === 'Practice Supplier' && !x.no);
  unitRemove('WC17', {label: initial[0].u.label});
  subAdd('WC17', 'Practice Supplier', '');
  const after = subOf('WC17').filter(x => x.co === 'Practice Supplier' && !x.no);
  return {count:after.length, preserved:after.some(x => x.u.label === initial[1].u.label), distinct:new Set(after.map(x => x.u.label)).size};
 });
 ok('adding an unnumbered unit after removal keeps the other unnumbered unit', unknown.count === 2 && unknown.distinct === 2 && unknown.preserved, unknown);
 await p.evaluate(() => { SUB744.open = 'WC43'; openAsset('WC43'); });
 const marked = await p.evaluate(() => {
  const input = document.querySelector('#sub744Co'), before = JSON.stringify(S.units), mismatch = subAdd('WC43', 'Different Supplier', 'Q744NO');
  return {company:input.value, readonly:input.readOnly, mismatch, unchanged:before === JSON.stringify(S.units), genericLabel:document.querySelector('label[for="uNo"]').textContent};
 });
 ok('marked location keeps its supplier and rejects conflicting company', marked.company === 'Event Portables' && marked.readonly && !marked.mismatch && marked.unchanged && /Event Portables/.test(marked.genericLabel), marked);
 await p.locator('#numAdd').fill('Q744OLD'); await p.locator('#numBtn').click();
 const oldbox = await p.evaluate(() => ({supplier:subOf('WC43').some(x => x.no === 'Q744OLD' && x.co === 'Event Portables'), numbersSame:JSON.stringify(S.assetNumbers) === window.__beforeNumbers}));
 ok('existing marked-location number button now saves supplier-labelled unit', oldbox.supplier && oldbox.numbersSame, oldbox);
 const placed = await p.evaluate(() => {
  const before = subOf('WC43').filter(x => x.no === 'Q744OLD').length, sheet = DATA.sheets.find(x => !x.master && x.sheet_id).sheet_id;
  const first = subhire744One('WC43', 'Event Portables', 'Q744OLD', {sheet, callout:'Q744place'});
  const second = subhire744One('WC43', 'Event Portables', 'Q744OLD', {sheet, callout:'Q744move'});
  const units = subOf('WC43').filter(x => x.no === 'Q744OLD');
  const moved = units[0].u.callout === 'Q744move', cleared = subhire744One('WC43', 'Event Portables', 'Q744OLD', {sheet:'', callout:''});
  const final = subOf('WC43').find(x => x.no === 'Q744OLD');
  return {first, second, count:units.length, before, moved, cleared:cleared && !final.u.sheet && !final.u.callout, label:units[0].u.label};
 });
 ok('existing supplier unit can be placed, moved and cleared on a drawing without duplication', placed.first && placed.second && placed.count === placed.before && placed.moved && placed.cleared && placed.label === 'Sub-hire: Event Portables', placed);
 await p.evaluate(() => { SUB744.open = 'WC17'; openAsset('WC17'); });
 await p.locator('#drawer [data-s744-ask]').click();
 const markBefore = await p.evaluate(() => ({checked:document.querySelector('#sub744Off') ? document.querySelector('#sub744Off').checked : false, marked:subhireCo('WC17')}));
 ok('marking the whole location requires confirmation; removing Coates numbers is opt-in', !markBefore.checked && !markBefore.marked, markBefore);
 await p.locator('#drawer [data-s744-confirm]').click();
 const markAfter = await p.evaluate(() => ({company:subhireCo('WC17'), off:S.subhire.WC17.coates_off, numbersSame:JSON.stringify(S.assetNumbers) === window.__beforeNumbers, banner:document.querySelector('.subhirebanner').textContent}));
 ok('confirmed whole-location mark keeps Coates numbers when removal was not selected', markAfter.company === 'Practice Supplier' && !markAfter.off && markAfter.numbersSame && /kept in the lists below/.test(markAfter.banner), markAfter);
 const persisted = await p.evaluate(() => { const own = (S.units.WC17 || {}).units || []; return {stamped:!!S.stamps['units/WC17'], named:own.filter(u => /^Sub-hire:/.test(u.label)).every(u => u.by === 'Andrew Fisher via Codex' && !!u.at), units:own.length}; });
 ok('supplier units use existing persisted units with recorder and time', persisted.stamped && persisted.named, persisted);
 await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); go('change'); });
 const register = await p.evaluate(() => ({picker:!!document.querySelector('#sub744Ref'), add:!!document.querySelector('[data-s744-pick]')}));
 ok('Sub-hire register offers location picker and Add sub-hired gear', register.picker && register.add, register);
 await p.locator('#sub744Ref').selectOption('WC43'); await p.locator('[data-s744-pick]').click();
 ok('register Add opens chosen drawer form', await p.locator('#drawer #sub744Co').isVisible());
 await p.locator('#sub744Numbers').fill('Q744DRAFT');
 await p.evaluate(() => openAsset('WC43', {keep:true}));
 ok('draft fleet numbers survive drawer redraw', await p.locator('#sub744Numbers').inputValue() === 'Q744DRAFT');
 await p.waitForTimeout(600);
 await p.waitForFunction(() => { const r = document.querySelector('#drawer').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }, null, {timeout:5000});
 const size = await p.evaluate(() => { const d = document.querySelector('#drawer'), box = d.querySelector('.sub744'); d.scrollTop = 0; const db = d.querySelector('.db'); if (db) db.scrollTop = 0; const r = d.getBoundingClientRect(); return {page:document.documentElement.scrollWidth <= innerWidth + 1, drawer:d.scrollWidth <= d.clientWidth + 1, form:box.scrollWidth <= box.clientWidth + 1, inViewport:r.left >= -1 && r.right <= innerWidth + 1, left:r.left, right:r.right, viewport:innerWidth}; });
 ok('page, drawer and sub-hire form fit viewport after slide animation settles', size.page && size.drawer && size.form && size.inViewport, size);
 // Only dismiss the transient practice toast for evidence; this does not alter application state or controls.
 await p.evaluate(() => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } });
 await p.screenshot({path:path.join(__dirname, mobile ? 'subhire_phone.png' : 'subhire_desktop.png'), animations:'disabled'});
 const locked = await p.evaluate(() => { window.__practiceCap = 'view'; const before = JSON.stringify(S); const result = subAddMany('WC43', 'Event Portables', 'Q744LOCK'); openAsset('WC43'); return {result, unchanged:before === JSON.stringify(S), disabled:document.querySelector('#drawer [data-s744-open]').disabled}; });
 ok('capability loss locks current controls and refuses stale writer calls', locked.result === null && locked.unchanged && locked.disabled, locked);
 await p.waitForTimeout(1500);
 const writes = await p.evaluate(() => ({units:window.__writes.filter(x => x[0].startsWith('units/')).length, subhire:window.__writes.filter(x => x[0].startsWith('subhire/')).length, assetNumbers:window.__writes.filter(x => x[0].startsWith('assetNumbers/')).length}));
 ok('captured writes include supplier units and explicit mark, never Coates asset numbers', writes.units > 0 && writes.subhire > 0 && writes.assetNumbers === 0, writes);
 ok('no page errors', s.errors.length === 0, s.errors);
 console.log('RESULT', checks.filter(x => x.pass).length + '/' + checks.length, JSON.stringify({mobile, blockedServiceWrites:s.counts.blocked, captured:writes}));
 await s.browser.close(); process.exit(checks.every(x => x.pass) ? 0 : 1);
})().catch(async e => { console.error('FAIL', e.message); if (browser) await browser.close().catch(() => {}); process.exit(1); });
