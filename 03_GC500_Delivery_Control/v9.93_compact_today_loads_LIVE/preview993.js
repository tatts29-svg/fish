/* Author: Andrew Fisher. Local design preview: retain every native measurement and action. */
(function () {
 'use strict';
 function enhance(card) {
  if (!card || card.dataset.preview993) return;
  card.dataset.preview993 = '1';
  for (const ref of card.querySelectorAll('.lc991-summary .tl841-ref')) {
   const asset = assetOf(ref.dataset.tl841Ref);
   const record = asset && handling875Record(asset);
   // Permanent recorded instructions; never infer an unloading method from a vehicle or a guide.
   if (!record || !['forklift', 'tilt-tray', 'crane-truck', 'franna', 'onsite-crane', 'none'].includes(record.method)) continue;
   const fact = document.createElement('span'); fact.className = 'lc993-unload';
   fact.dataset.unloadMethod993 = record.method;
   fact.textContent = handling875Words(record.method);
   if (record.source) {
    const source = document.createElement('small'); source.textContent = ' · Schedule'; fact.append(source);
   }
   (ref.querySelector('.ld-w') || ref).append(fact);
  }
  for (const strong of card.querySelectorAll('.lc992-product > .r931-fact > strong')) {
   const original = strong.textContent;
   const parts = original.split(' · ');
   const fragment = document.createDocumentFragment();
   parts.forEach((part, index) => {
    if (index) {
     const separator = document.createElement('span');
     separator.className = 'lc993-separator'; separator.textContent = ' · ';
     fragment.append(separator);
    }
    const reading = document.createElement('span'); reading.className = 'lc993-reading';
    const named = /^(Length|Width|Height|Mass|Weight)(\s+)(.+)$/.exec(part);
    if (named) {
     const label = document.createElement('span'); label.className = 'lc993-label'; label.textContent = named[1];
     const value = document.createElement('span'); value.className = 'lc993-value'; value.textContent = named[3];
     reading.append(label, document.createTextNode(named[2]), value);
    } else {
     // Decorative label only. Original units, ranges and value text remain verbatim.
     reading.dataset.label = /\bkg\b/.test(part) ? 'Weight' : /\bmm\b/.test(part) ? 'Dimensions' : '';
     reading.textContent = part;
    }
    fragment.append(reading);
   });
   // Guard presentation against accidental changes to the native facts.
   if (fragment.textContent !== original) continue;
   strong.replaceChildren(fragment); strong.classList.add('lc993-readings');
   for (const node of [...strong.parentElement.childNodes]) {
    // The native sources fold sometimes leaves a standalone separator behind.
    if (node.nodeType === Node.TEXT_NODE && /^[\s·]*$/.test(node.textContent)) node.remove();
   }
  }
 }
 const before = window.LoadLights992.refreshCard;
 window.LoadLights992.refreshCard = function (card) {
  const result = before.apply(this, arguments); enhance(card); return result;
 };
 document.querySelectorAll('#pane-timeline .lc991').forEach(enhance);
})();
