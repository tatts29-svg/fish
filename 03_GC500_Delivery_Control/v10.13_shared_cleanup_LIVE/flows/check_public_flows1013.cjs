/* Author: Andrew Fisher. Read-only interaction checks on the verified public page. */
'use strict';
module.exports = async function checkPublicFlows1013(page) {
 const checks = [], check = (name, pass, details) => checks.push({name, pass: !!pass, details});
 for (const tab of ['plant', 'costs', 'subhired']) {
  await page.evaluate(value => go(value), tab);
  await page.waitForTimeout(350);
  const r = await page.evaluate(() => {
   const pane = document.getElementById('pane-' + state.tab);
   const fold = [...pane.querySelectorAll('details')].find(el => !el.closest('.rochip') && el.querySelector('summary')?.getClientRects().length);
   if (!fold) return {found: false};
   fold.open = true;
   const key = Persistence1010.key(fold, pane);
   fold.querySelector('summary').scrollIntoView({block: 'center'});
   document.dispatchEvent(new WheelEvent('wheel', {bubbles: true, deltaY: 1}));
   const main = document.querySelector('main'), body = document.scrollingElement;
   const before = [main.scrollTop, body.scrollTop], record = JSON.stringify(S);
   photoRedraw();
   const fresh = [...pane.querySelectorAll('details')].find(el => Persistence1010.key(el, pane) === key);
   return {found: true, open: !!fresh?.open, before, after: [main.scrollTop, body.scrollTop], recordUnchanged: record === JSON.stringify(S)};
  });
  check('Public ' + tab + ' photo refresh retains disclosure, position and records', r.found && r.open && r.recordUnchanged && r.before.every((value, i) => value === r.after[i]), r);
 }
 await page.evaluate(() => {
  go('plant');
  const button = document.querySelector('#pane-plant [data-invdrill]');
  window.__publicFlowOrigin1013 = button?.dataset.invdrill;
  for (let fold = button?.closest('details'); fold; fold = fold.parentElement.closest('details')) fold.open = true;
  button?.click();
 });
 await page.waitForTimeout(350);
 const closed = await page.evaluate(() => {
  const button = document.querySelector('#pane-plant [data-invdrill-x]');
  if (!button) return {found: false};
  button.scrollIntoView({block: 'center'}); button.focus({preventScroll: true});
  const record = JSON.stringify(S); button.click();
  const active = document.activeElement, bounds = active.getBoundingClientRect(), main = document.querySelector('main').getBoundingClientRect();
  return {found: true, closed: !INV.drill, focusReturned: active.dataset.invdrill === window.__publicFlowOrigin1013, visible: bounds.bottom > Math.max(0, main.top) && bounds.top < Math.min(innerHeight, main.bottom), recordUnchanged: record === JSON.stringify(S)};
 });
 check('Public Inventory Close returns focus to the visible originating quantity', closed.found && closed.closed && closed.focusReturned && closed.visible && closed.recordUnchanged, closed);
 const pending = await page.evaluate(() => {
  const button = document.querySelector('#pane-plant [data-invref87]');
  if (!button) return {found: false};
  const record = JSON.stringify(S); button.click();
  document.dispatchEvent(new WheelEvent('wheel', {bubbles: true, deltaY: -200}));
  const main = document.querySelector('main'); main.scrollTop = 100;
  return {found: true, top: main.scrollTop, recordUnchanged: record === JSON.stringify(S)};
 });
 await page.waitForTimeout(400);
 const after = await page.evaluate(() => document.querySelector('main').scrollTop);
 check('Public delayed Inventory reveal yields to newer scrolling', pending.found && pending.recordUnchanged && Math.abs(pending.top - after) < 2, {before: pending, after});
 await page.evaluate(() => { delete window.__publicFlowOrigin1013; });
 return checks;
};
