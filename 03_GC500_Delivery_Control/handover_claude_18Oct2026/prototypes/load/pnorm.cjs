// compare parity captures after masking clock times (HH:MM[:SS]); reports tabs whose text still differs
const [A, B] = process.argv.slice(2).map(f => require(require('path').resolve(f)));
const mask = s => String(s == null ? '' : s).replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '#:#');
let same = 0, diff = [];
for (const k of A.tabs) { for (const f of ['panes', 'full']) { if (!A[f] || !B[f]) continue; if (mask(A[f][k]) === mask(B[f][k])) same++; else diff.push(f + ':' + k); } }
const ft = mask(A.first.text) === mask(B.first.text);
console.log('landed', A.first.tab, B.first.tab, 'first view same:', ft, '| pane texts same', same, 'differ', diff.length, diff.join(' '));
