/* Author: Andrew Fisher. P/O values shown as currency, a recorded "checked" state, people shown without an agent suffix. */
/* The record carries who recorded a thing. An assistant the entry was typed through is not the person, so a trailing
 "via <anything>" - with or without brackets, any case - comes off before a name is shown. A string that is nothing but
 the suffix is left as it was, so nothing recorded ever disappears. */
function personWords1019(s){
 const t = String(s == null ? '' : s).trim();
 return t.replace(/\s*\(?\bvia\s+[^()]*\)?\s*$/i, '').trim() || t;
}
/* A typed P/O value may carry the dollar sign, thousands commas and spaces the field now shows. They come off here;
 the existing "is it a number" check in the Save handler still decides whether what is left is a value. */
function poParseMoney1019(s){
 return String(s == null ? '' : s).replace(/[$,\s]/g, '');
}
/* The recorded "checked" state on a purchase order: {by, at}, set by a named person with Mark checked. It is a separate
 fact from the computed supplier-docket match, which keeps its own line. */
function poCheckedBlock1019(o){
 if (!o || !o.checked || !o.checked.by) return '';
 return `<div class="po-checked1019"><b>✓ P/O checked</b><span class="w"> · ${esc(personWords1019(o.checked.by))}${o.checked.at ? ' · ' + esc(fmtStamp(o.checked.at)) : ''}</span></div>`;
}
/* The button that records it, on a confirmed order that has no recorded check yet. It sits in the P/O cell under the
 order, where the checked line then takes its place - the cell a phone keeps in view - so the actions column and the
 value field stay exactly where v10.18 put them. The page's small button, so the P/O column keeps its width. */
function poCheckButton1019(o){
 if (!o || !o.confirmed || (o.checked && o.checked.by)) return '';
 return `<div class="po-check1019"><button class="btn sm" data-po-check1019="${esc(o.number)}" title="Record that this purchase order has been checked against the supplier's dockets">Mark checked</button></div>`;
}
(function(){
 if (typeof document === 'undefined' || document.getElementById('po-checked1019-style')) return;
 const st = document.createElement('style'); st.id = 'po-checked1019-style';
 /* the view link hides Save (body.viewonly [data-po-save]); Mark checked goes with it */
 st.textContent = '.po-checked1019 b{color:var(--green)}.po-checked1019 .w{font-size:11px;color:var(--mute)}.po-check1019{margin-top:4px}body.viewonly [data-po-check1019]{display:none!important}';
 (document.head || document.documentElement).appendChild(st);
})();
