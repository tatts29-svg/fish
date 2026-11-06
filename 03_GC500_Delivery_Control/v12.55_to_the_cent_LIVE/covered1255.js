
<script id="covered1255-script">
/* Author: Andrew Fisher. v12.55 - the install and demob ticks on the generators, the light towers and the VMS boards
   are the record of the work; the money for that work is charged once, on the contract's own labour line (Baseplan
   9961976 lines 51, 52, 58 and 60; 9994954 line 13; 9961265 line 40), which the P&L already carries as contract
   installation. Until now the page charged both (5,631.86 on 29 Oct 2026). The lines stay as card lines, each at a rate
   of nought with the reason on them, so every table keeps its rows and tick counts. Same pattern as the held references
   (v11.52): a wrapper on labourLinesFor, nothing else. */
(function (W) {
 'use strict';
 const WORDS = {
  'generators': 'in the contract labour line (Baseplan 9961976 lines 51, 52 and 60; 9994954 line 13)',
  'lighting towers': 'in the contract labour line (Baseplan 9961976 line 58)',
  'variable message signs': 'in the contract labour line (Baseplan 9961265 line 40)'
 };
 const KEYS = new Set(['install', 'demob']);
 const wordsFor = disc => WORDS[String(disc || '').trim().toLowerCase()] || null;
 const api = {
  words: wordsFor,
  covers: (disc, key) => !!wordsFor(disc) && KEYS.has(String(key || '')),
  disciplines: Object.freeze(Object.keys(WORDS)),
  note: 'The tick records the work; the money is charged once, on the contract labour line (Andrew, 29 Oct 2026).'
 };
 W.CoveredLabour1255 = api;
 const beforeL = W.labourLinesFor;
 const gL = function (ref, disc, item, key, unit, asset) {
  const r = beforeL.apply(this, arguments);
  if (!r || !Array.isArray(r.lines) || !r.lines.length) return r;
  const words = wordsFor(disc);
  if (!words) return r;
  let touched = false;
  const lines = r.lines.map(L => {
   if (!KEYS.has(L.key) || L.held1152 || L.included1152 || L.covered1255) return L;
   touched = true;
   return Object.assign({}, L, {rate: 0, money: 'rate', sourceRate1255: L.rate,
    money_note: words + '. ' + api.note + (L.money_note ? ' ' + L.money_note : ''), covered1255: words});
  });
  return touched ? Object.assign({}, r, {lines, covered1255: words}) : r;
 };
 gL.covered1255 = true; W.labourLinesFor = gL; try { labourLinesFor = gL; } catch (x) {}
})(window);
</script>
