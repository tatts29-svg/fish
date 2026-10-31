/* Author: Andrew Fisher. v11.55 - a unit identified on a reference carries its number. GN10 (20kva 1283681), GN24 (60kva
   1277089) and P67 (Building 6m 421107) were identified through the page's own identity form, so their numbers sit on the
   unit record and not on the reference's own number list; the card, the drawer, the register and the finder read the
   number from the unit record too, and "n of q numbered" counts it. A number already on the reference's list is never
   counted twice. Nothing is written. (Pad chairs counted by quantity: the regex edit in the patch.) */
(function(W){
 'use strict';
 const recordsOf = ref => {
  const out = [];
  try {
   const L = (typeof S !== 'undefined' && S && S.loads) || {};
   for (const k in L) { const u = L[k]; if (!u || u.kind !== 'unit925-record' || u.ref !== ref || u.active === false || u.removedBy) continue;
    const no = String(u.assetNo == null ? '' : u.assetNo).trim(); if (no && !out.some(x => x.no === no)) out.push({no, owner: String(u.owner || 'coates'), item: String(u.item || u.label || '')}); }
  } catch (e) {}
  return out;
 };
 const keyOf = a => a && typeof a === 'object' ? a.key : a;
 W.identifiedNumbers1155 = recordsOf;
 /* the card's numbers: a Coates unit's number on its record joins "asset no." */
 const beforeD = displayNumbers744;
 const gD = function(a){ const r = beforeD.apply(this, arguments);
  try { const add = recordsOf(keyOf(a)).filter(u => u.owner === 'coates' && /^\d{4,8}$/.test(u.no) && !r.all.includes(u.no)).map(u => u.no);
   if (add.length) { const own = r.own.concat(add); return Object.assign({}, r, {own, all: own.concat(r.supplier), identified1155: add}); } } catch (e) {}
  return r; };
 gD.v1155 = true; W.displayNumbers744 = gD; try { displayNumbers744 = gD; } catch (x) {}
 /* "n of q numbered": a unit identified on the record is a numbered unit */
 const beforeN = locNums;
 const gN = function(a){ const r = beforeN.apply(this, arguments);
  try { if (r && a) { const norm = s => String(s == null ? '' : s).trim().toUpperCase();
   const have = new Set((assetNumbersOf(a) || []).map(norm)); try { subOf(a.key).forEach(x => { if (x && x.no) have.add(norm(x.no)); }); } catch (e) {}
   const add = recordsOf(a.key).filter(u => !have.has(norm(u.no))).length;
   if (add) return Object.assign({}, r, {n: Math.min(r.n + add, r.q), identified1155: add}); } } catch (e) {}
  return r; };
 gN.v1155 = true; W.locNums = gN; try { locNums = gN; } catch (x) {}
 /* the finder: the number on the unit record finds the reference, beside the unit row it already had */
 const idx0 = W.finderIndex;
 if (typeof idx0 === 'function') W.finderIndex = function(){ const out = idx0.apply(this, arguments);
  try { out.forEach(it => { if (it.kind !== 'asset') return; const add = recordsOf(it.key).map(u => u.no).filter(n => !it.hay.includes(n.toLowerCase()));
   if (add.length) { it.hay += ' ' + add.join(' ').toLowerCase(); if (Array.isArray(it.nums)) add.forEach(n => { if (!it.nums.some(x => String(x) === n)) it.nums.push(n); }); } }); } catch (e) {}
  return out; };
 const m0 = W.finderMatches;
 if (typeof m0 === 'function') W.finderMatches = function(q){ const out = m0.apply(this, arguments);
  try { const digits = String(q || '').replace(/\D/g, ''); if (digits.length < 4) return out;
   const refs = []; const L = (typeof S !== 'undefined' && S && S.loads) || {};
   for (const k in L) { const u = L[k]; if (u && u.kind === 'unit925-record' && u.active !== false && !u.removedBy && String(u.assetNo || '').replace(/\D/g, '') === digits && !refs.includes(u.ref)) refs.push(u.ref); }
   if (!refs.length) return out;
   const have = new Set(out.filter(it => it.kind === 'asset').map(it => it.key)), idx = finderIndex();
   const add = refs.filter(r => !have.has(r)).map(r => idx.find(it => it.kind === 'asset' && it.key === r)).filter(Boolean);
   if (add.length) return add.concat(out).slice(0, 14); } catch (e) {}
  return out; };
})(window);
