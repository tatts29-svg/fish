/* Author: Andrew Fisher. Move existing, qualified size/weight facts beside their native progress lights. */
(function () {
 'use strict';
 function refreshCard(card) {
  if (!card || card.dataset.loadlights992) return;
  card.dataset.loadlights992 = '1';
  const refs = [...card.querySelectorAll('.lc991-summary .tl841-ref')];
  const measures = new Map();
  for (const ref of refs) {
   const data = document.createElement('div'); data.className = 'lc992-data';
   const lights = ref.querySelector(':scope > .tl841-gantry');
   if (lights) data.append(lights);
   const facts = document.createElement('div'); facts.className = 'lc992-measures';
   measures.set(ref, {data, facts}); ref.append(data);
  }
  for (const panel of card.querySelectorAll('.lc991-detail .timeline968-loading')) {
   const body = panel.querySelector(':scope > .r924-body');
   if (!body) continue;
   for (const product of [...body.querySelectorAll(':scope > .r931-product')]) {
    const heading = product.querySelector(':scope > b');
    const ref = refs.find(node => heading?.textContent.startsWith(node.dataset.tl841Ref + ' · '));
    const values = [...product.querySelectorAll(':scope > .r931-fact > strong')];
    if (!ref || !values.some(node => /\d/.test(node.textContent) && /\b(?:mm|kg)\b/.test(node.textContent))) continue;
    // The native compact panel already separates sources and unknown fields into More info.
    // Keep its complete product/unit scope and qualification: a guide value is not an actual measurement.
    product.classList.add('lc992-product'); product.dataset.loadRef992 = ref.dataset.tl841Ref;
    heading.textContent = heading.textContent.slice((ref.dataset.tl841Ref + ' · ').length);
    measures.get(ref).facts.append(product);
   }
   const more = panel.querySelector(':scope > details[data-timeline968-more]');
   if (more && !body.querySelector('.r931-fact')) {
    // Preserve any remaining product context with its supporting records, without an empty measurements box.
    more.querySelector(':scope > summary').after(...body.children); body.remove();
    panel.querySelector(':scope > b')?.remove();
    more.querySelector(':scope > summary').textContent = 'Sources & loading guidance';
    panel.classList.add('lc992-sources');
   }
  }
  for (const {data, facts} of measures.values()) if (facts.children.length) data.append(facts);
 }
 window.LoadLights992 = {refreshCard};
 document.querySelectorAll('#pane-timeline .lc991').forEach(refreshCard);
 timeline841Schedule();
})();
