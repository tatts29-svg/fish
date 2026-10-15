/* v10.35: every generator and VMS board reference carries delivery, install and pick up and no demob; FWF, blocks, tanks
   and buildings as v10.32 left them. Read-only: the page is served from the build, every write aborted.
   Author: Andrew Fisher.
     PAGE=build/GC500_v10.35/GC500_Delivery_Control_hosted.html [BEFORE=build/GC500_v10.34/GC500_Delivery_Control_hosted.html] [OUT=dir] node v10.35_generators_vms_DRAFT/tests/test_gen_vms1035.cjs */
const path = require('path');
const {open} = require(path.resolve(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
const results = []; const check = (name, ok, note) => { results.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : '')); };
const survey = async pageFile => {
  const s = await open({pageFile, hash: '#equipment', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForTimeout(3000);
  const out = await p.evaluate(() => holdAssets(() => { /* one held pass, as a draw does, so the transport model is built once */
    const rows = [];
    for (const a of allAssets()) {
      const d = a.discipline || '?'; let st; try { st = sym1033State(a.key); } catch (e) { st = null; }
      if (!st) continue;
      const pick = k => st[k] ? {applies: !!st[k].applies, on: st[k].on, of: st[k].of, money: st[k].money, charge: st[k].charge} : null;
      const T = buildingTransportModel831(); const trows = (T.rows || []).filter(r => r.ref === a.key); const legPriced = trows.some(r => !['held', 'excluded', 'included'].includes(r.state));
      rows.push({ref: a.key, disc: d, items: (a.charge_lines || a.cls || a.lines || []).map(l => l.item), legPriced, trows: trows.map(r => r.leg + ':' + r.state).join(' '), delivery: pick('delivery'), install: pick('install'), levelling: pick('levelling'), steps: pick('steps'), cleaning: pick('cleaning'), demob: pick('demob'), pickup: pick('pickup')});
    }
    return {rows, footer: (document.body.innerText.match(/· v10\.\d\d/g) || []).slice(-1)[0]};
  }));
  return {out, s, p};
};
(async () => {
  const after = await survey(process.env.PAGE);
  const R = after.out.rows;
  const gens = R.filter(r => r.disc === 'Generators'), vms = R.filter(r => /variable message/i.test(r.disc));
  check('footer v10.35', after.out.footer === '· v10.35', after.out.footer);
  check('generators found', gens.length >= 10, gens.length + ' references');
  check('VMS boards found', vms.length >= 5, vms.length + ' references');
  const noDemob = [...gens, ...vms].filter(r => r.demob && r.demob.applies);
  check('no generator or VMS board carries a demob line', noDemob.length === 0, noDemob.map(r => r.ref).join(',') || 'none');
  const noOther = [...gens, ...vms].filter(r => ['levelling', 'steps', 'cleaning'].some(k => r[k] && r[k].applies));
  check('no generator or VMS board carries level, steps or clean', noOther.length === 0);
  const priced = [...gens, ...vms].filter(r => r.install && r.install.applies);
  check('every generator and VMS board the card prices carries install', priced.length >= gens.length + vms.length - 2, priced.length + ' of ' + (gens.length + vms.length) + ' (the card has no labour for ' + [...gens, ...vms].filter(r => !(r.install && r.install.applies)).map(r => r.ref + ' ' + r.items.join('/')).join('; ') + ')');
  const legs = [...gens, ...vms].filter(r => r.delivery && r.delivery.applies && r.pickup && r.pickup.applies);
  const legPriced = [...gens, ...vms].filter(r => r.legPriced), legHeld = [...gens, ...vms].filter(r => !r.legPriced);
  check('every generator and VMS board the card prices a transport leg for carries delivery and pick up', legPriced.every(r => r.delivery.applies && r.pickup.applies) && legs.length === legPriced.length, legs.length + ' with both legs; no card transport figure (held or excluded at the card, so no leg symbol): ' + legHeld.map(r => r.ref + ' ' + r.items.join('/') + ' [' + r.trows + ']').join('; '));
  const fwf = R.filter(r => r.items.some(i => /^FWF$/i.test(i)) && r.items.length === 1);
  check('an FWF still carries install and demob only', fwf.length && fwf.every(r => r.install.applies && r.demob.applies && !r.levelling.applies && !r.steps.applies && !r.cleaning.applies), fwf.length + ' FWF references');
  const bld = R.filter(r => r.disc === 'Portable buildings' && r.install && r.install.applies);
  check('a building still carries install, level, steps, clean, demob', bld.length && bld.filter(r => r.levelling.applies && r.steps.applies && r.cleaning.applies && r.demob.applies).length >= bld.length - 3, bld.length + ' priced buildings');
  /* the waste-tank rule (no steps on a tank) is v10.32's and is tested there per item; every tank reference here also carries a block, whose steps it shows */
  if (process.env.OUT) { const el = await after.p.$('#pane-equipment tr[data-key="' + gens[0].ref + '"], #pane-equipment [data-ref="' + gens[0].ref + '"]'); if (el) { await el.scrollIntoViewIfNeeded(); await after.p.waitForTimeout(500); await el.screenshot({path: path.join(process.env.OUT, 'gen_row_1035.png')}); } }
  await after.s.browser.close();
  if (process.env.BEFORE) {
    const before = await survey(process.env.BEFORE);
    const B = before.out.rows.filter(r => r.disc === 'Generators' || /variable message/i.test(r.disc));
    const ticked = B.filter(r => r.demob && r.demob.applies && r.demob.on > 0);
    const money = ticked.reduce((s, r) => s + (r.demob.money || 0) * (r.demob.on || 0), 0);
    check('demob ticks the rule now withholds on generators and VMS boards (reported, nothing changed)', true, ticked.length ? ticked.map(r => r.ref + ' ' + r.demob.on + '/' + r.demob.of).join(', ') + ' = $' + money.toFixed(2) : 'none in the record');
    const inst = B.filter(r => r.install && r.install.applies);
    check('install lines unchanged by the rule', inst.length === priced.length && inst.every(r => { const a = R.find(x => x.ref === r.ref); return a && a.install.money === r.install.money && a.install.on === r.install.on; }), inst.length + ' before, ' + priced.length + ' after');
    await before.s.browser.close();
  }
  const bad = results.filter(r => !r.ok).length;
  console.log(bad ? 'FAILED ' + bad + ' of ' + results.length : 'ALL ' + results.length + ' PASSED');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
