/* Author: Andrew Fisher. Existing actions and source records retained. */
(function () {
 'use strict';
 const folds = new Map();
 function company() {
  return document.querySelector('#pane-subhired [data-supplier932-company][aria-pressed="true"]')?.dataset.supplier932Company || '';
 }
 function disclosures() {
  const owner = company();
  return [...document.querySelectorAll('#pane-subhired [data-subhire975-units],#pane-subhired [data-subhire975-day],#pane-subhired [data-subhire975-history]')].map(node => ({
   node, key: owner + '|' + (node.hasAttribute('data-subhire975-units') ? 'units' : node.hasAttribute('data-subhire975-history') ? 'history' : 'day:' + node.dataset.subhire975Day)
  }));
 }
 function captureSubhired() { disclosures().forEach(({node, key}) => folds.set(key, node.open)); }
 function restoreSubhired() { disclosures().forEach(({node, key}) => { if (folds.has(key)) node.open = folds.get(key); }); }
 function costs() {
  const pane = document.getElementById('pane-costs'), nav = pane?.querySelector(':scope > .finance857-nav');
  if (!nav) return;
  const view = state.financeView857 || 'summary';
  nav.querySelectorAll('[data-finance857],[data-finance888]').forEach(button => {
   button.setAttribute('aria-pressed', String((button.dataset.finance857 || button.dataset.finance888) === view));
  });
  const old = pane.querySelector(':scope > [data-flow994-costback]');
  if (view === 'summary') { old?.remove(); return; }
  if (old) return;
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'btn flow994-costback'; back.dataset.flow994Costback = ''; back.setAttribute('data-ro', '');
  back.textContent = '← Back to P&L summary';
  back.onclick = () => {
   const summary = pane.querySelector('.finance857-nav [data-finance857="summary"]');
   if (!summary) return;
   summary.click();
   requestAnimationFrame(() => {
    if (state.tab !== 'costs' || state.financeView857 !== 'summary') return;
    document.querySelector('main')?.scrollTo({top: 0, behavior: 'instant'});
    pane.querySelector('.finance857-nav [data-finance857="summary"]')?.focus({preventScroll: true});
   });
  };
  nav.before(back);
 }
 const previousCosts = renderCosts;
 renderCosts = function () { const result = previousCosts.apply(this, arguments); costs(); return result; };
 Object.assign(renderCosts, previousCosts);
 window.Flow994 = {costs, captureSubhired, restoreSubhired};
 costs();
})();
