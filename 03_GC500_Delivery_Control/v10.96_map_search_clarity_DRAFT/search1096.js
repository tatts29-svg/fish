/* Author: Andrew Fisher. Bounded, deterministic search; identifiers never fuzzy matched. */
(function (root) {
 'use strict';
 const clean = value => String(value == null ? '' : value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
 const compact = value => clean(value).replace(/ /g, '');
 function prepare(row) {
  const ids = [row.code, ...(row.identifiers || [])].filter(Boolean).map(compact);
  const text = clean([row.code, row.description, row.category, row.location, ...(row.identifiers || []), ...(row.terms || [])].filter(Boolean).join(' '));
  return {row, ids, text, flat:compact(text)};
 }
 function query(rows, value) {
  const q = clean(value).replace(/^(?:ASSET(?: NUMBER| NO)?|REGO(?: NUMBER| NO)?|REGISTRATION(?: NUMBER| NO)?|REFERENCE|REF)\s+/, '');
  if (!q) return [];
  const flat = compact(q), tokens = q.split(' ');
  return rows.map((entry, order) => {
   const exact = entry.ids.includes(flat), prefix = entry.ids.some(id => id.startsWith(flat));
   const words = tokens.every(token => entry.text.includes(token));
   const idPart = flat.length >= 3 && entry.ids.some(id => id.includes(flat));
   if (!exact && !prefix && !words && !idPart) return null;
   return {row:entry.row, score:exact ? 0 : prefix ? 1 : words ? 2 : 3, order};
  }).filter(Boolean).sort((a,b) => a.score-b.score || (a.row.priority||0)-(b.row.priority||0) || a.order-b.order).map(match => match.row);
 }
 const api = {clean, compact, prepare, query};
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 else root.MapSearch1096 = api;
})(typeof window !== 'undefined' ? window : globalThis);
