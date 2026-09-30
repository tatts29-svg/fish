// Author: Andrew Fisher. Capture financial explanations on the phone without record writes.
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
 const rig = await open({pageFile: process.argv[2], hash: '#costs', mobile: true, W: 390, H: 844, dpr: 2});
 try {
  const p = rig.page;
  await p.waitForFunction(() => typeof labourNote753 === 'function' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await p.waitForTimeout(1500);
  const ledgerDetails = p.locator('details[data-sfold="costs|ledger"]');
  if (!(await ledgerDetails.evaluate(el => el.open))) await ledgerDetails.locator('summary').click();
  const show = async (locator, name) => {
   await locator.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
   await locator.evaluate(el => { window.scrollBy({top: el.getBoundingClientRect().top - 265, behavior: 'instant'}); });
   await p.waitForTimeout(250); await p.screenshot({path: path.join(__dirname, name)});
   if (name !== 'finance_phone_outlook753.png') await locator.screenshot({path: path.join(__dirname, name.replace('.png', '_detail.png'))});
  };
  await show(p.locator('#moneyCard .hint').filter({hasText: 'The toilet servicing, at our rates.'}), 'finance_phone_servicing753.png');
  await show(p.locator('#moneyCard').getByText('wages — 49 of 208 shifts priced', {exact: false}).first(), 'finance_phone_labour_note753.png');
  await show(p.locator('#finance745 .fin745-metrics'), 'finance_phone_outlook753.png');
  const result = await p.evaluate(() => ({overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, viewport: document.documentElement.clientWidth, revenue: moneySummary().charge.total, readOnly: capability() === 'view', text: document.querySelector('#moneyCard').innerText}));
  fs.writeFileSync(path.join(__dirname, 'finance_phone753.json'), JSON.stringify({author: 'Andrew Fisher', ...result, errors: rig.errors, blockedWrites: rig.counts.blocked}, null, 2));
  console.log(JSON.stringify({...result, text: undefined, errors: rig.errors, blockedWrites: rig.counts.blocked}));
 } finally { await rig.browser.close(); }
})().catch(e => {console.error(e);process.exitCode = 1;});
