#!/usr/bin/env python3
"""v7.28 - sub-hired equipment said as sub-hire, with the company and their own asset number. Andrew Fisher, 28 Sep 2026:
"subhired toilets if any will be Event Portables. I think we should mention if they are, or any subhired company, and
mention their asset number if one."
 - A sub-hire unit is kept as a unit of the location (the units record, already synced, merged, exported and backed up),
   named "Sub-hire: <company>" and carrying the company's own number. One unit per piece: WC41's ten toilets are ten
   units. No new store, so nothing can fall out of a sync or a backup.
 - Change deliveries: a "Sub-hire" box under the Coates asset numbers - company (Event Portables offered first), their
   number, Add; each unit listed with an x to take it off. Where the hire contract has no Coates number for the
   location (MISCITEM or SUB- lines, or none allocated) the box says so.
 - Every location's count ("n of q") counts Coates numbers and sub-hire units together; the line shows a chip naming
   the company.
 - The driver and install sheets print "Sub-hire · <company> · their no. ..." in the asset number column.
    python3 patch_v728.py <page.html>"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function subOf(' in t: sys.exit('v7.28 already applied')
JS = r"""/* v7.28 - SUB-HIRE: a unit of the location named "Sub-hire: <company>", carrying the company's own number (see patch_v728.py) */
const SUB_RX = /^Sub-hire:\s*/i;
function subOf(key){ try { return unitsOf(key).filter(u => SUB_RX.test(String(u.label || ''))).map(u => ({co: String(u.label).replace(SUB_RX, '').replace(/\s*·\s*unit\s+\d+$/i, '').trim(), no: u.asset_no || '', u})); } catch (e) { return []; } }
function subCompanies(){ const s = new Set(['Event Portables']); try { Object.keys(S.units || {}).forEach(k => subOf(k).forEach(x => x.co && s.add(x.co))); } catch (e) {} return [...s]; }
function subHint(key){ try { const L = (rentalOf(key) || {}).lines || []; if (!L.length) return '';
 const sub = L.filter(r => /^SUB-/i.test(String(r.asset_no || ''))).length, misc = L.filter(r => String(r.asset_no || '').toUpperCase() === 'MISCITEM').length, none = L.filter(r => !r.asset_no).length;
 if (sub) return 'The hire contract marks ' + sub + ' line' + (sub === 1 ? '' : 's') + ' here as a sub-hire.';
 if (misc) return 'The hire contract has no Coates number for ' + misc + ' line' + (misc === 1 ? '' : 's') + ' here (MISCITEM) - likely a sub-hire. Check the sticker.';
 if (none === L.length) return 'The hire contract has not allocated a number here yet - the sticker on the unit tells you whose it is.';
 return ''; } catch (e) { return ''; } }
function subAdd(key, co, no){
 co = String(co || '').trim().replace(/\s+/g, ' '); no = String(no || '').trim().replace(/\s+/g, '');
 if (!co) { chSay('Name the company it is sub-hired from - Event Portables, for example'); render(); return; }
 const have = subOf(key).filter(x => x.co.toLowerCase() === co.toLowerCase());
 if (no && have.some(x => String(x.no).toLowerCase() === no.toLowerCase())) { chSay(no + ' is already on ' + key + ' as a ' + co + ' unit'); render(); return; }
 const label = 'Sub-hire: ' + co + (no ? '' : ' · unit ' + (have.filter(x => !x.no).length + 1));
 if (unitAdd(key, {label, asset_no: no})) chSay(key + ': ' + co + ' sub-hire' + (no ? ' no. ' + no : '') + ' recorded');
}
"""
if re.findall(r" \.[A-Za-z_]", JS): sys.exit('space before a dot')
t = rep(t, "function locNums(a){", JS + "function locNums(a){", 'code', p, True)
# count Coates numbers and sub-hire units together
t = rep(t, " return {q: q, n: Math.min(units.length, q)};", " const subs = subOf(a.key), subNos = new Set(subs.map(x => String(x.no)).filter(Boolean));\n return {q: q, n: Math.min(units.filter(x => !subNos.has(String(x))).length + subs.length, q), sub: subs.length, co: [...new Set(subs.map(x => x.co))].join(', ')};", 'count', p, True)
# the line: a chip naming the company
t = rep(t, """${(c => c && c.q > 1 || (c && c.n < c.q) ? ` <span class="chip ${c.n < c.q ? 'act' : 'ok'}" title="units at this location that carry an asset number">${c.n} of ${c.q}</span>` : '')(locNums(a))}""",
 """${(c => c && c.q > 1 || (c && c.n < c.q) ? ` <span class="chip ${c.n < c.q ? 'act' : 'ok'}" title="units at this location that carry an asset number or are recorded as a sub-hire">${c.n} of ${c.q}</span>` : '')(locNums(a))}${(c => c && c.sub ? ` <span class="chip cand" title="sub-hired units at this location">Sub-hire · ${esc(c.co)} ×${c.sub}</span>` : '')(locNums(a))}""", 'row chip', p, True)
# the form: the sub-hire box under the Coates numbers
t = rep(t, """ ${chClashHtml(k, CHG.clash && CHG.clash.key === k ? CHG.clash : null, 'data-chmove')}</div>""",
 """ ${chClashHtml(k, CHG.clash && CHG.clash.key === k ? CHG.clash : null, 'data-chmove')}</div>
 ${(() => { const subs = subOf(k), hint = subHint(k), cos = subCompanies(); return `<div class="f chsub"><label for="chSubCo">Sub-hire</label>
 ${subs.length ? `<ul class="chnums">${subs.map(x => `<li><b>${esc(x.co)}</b> <span class="mono">${x.no ? 'no. ' + esc(x.no) : '<span class="norate">no number</span>'}</span><button type="button" class="chnumx" data-suboff="${esc(x.u.asset_no || x.u.label)}" data-subkind="${x.u.asset_no ? 'no' : 'label'}"${dis} aria-label="Take this unit off ${esc(k)}">×</button></li>`).join('')}</ul>` : '<p class="norate">Nothing recorded as a sub-hire here.</p>'}
 <div class="chdrow"><input id="chSubCo" list="chSubCos" autocomplete="off" placeholder="company" value="${esc(cos[0] || '')}"${dis}><datalist id="chSubCos">${cos.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
 <input id="chSubNo" autocomplete="off" placeholder="their asset number"${dis}><button type="button" class="btn" id="chSubAdd"${dis}>Add</button></div>
 <div class="hint">One per unit. A Coates sticker goes in Allocated asset numbers above; a supplier's sticker goes here, with their number.${hint ? ' ' + esc(hint) : ''}</div></div>`; })()}""", 'form box', p, True)
# wire it
t = rep(t, " qa('[data-chnumoff]').forEach(b => b.onclick = () => chNumOff(CHG.key, b.dataset.chnumoff));",
 """ qa('[data-chnumoff]').forEach(b => b.onclick = () => chNumOff(CHG.key, b.dataset.chnumoff));
 { const sa = q('#chSubAdd'), sc = q('#chSubCo'), sn = q('#chSubNo');   /* v7.28 - sub-hire */
 const go = () => { const co = sc ? sc.value : '', no = sn ? sn.value : ''; if (sn) sn.value = ''; subAdd(CHG.key, co, no); };
 if (sa) sa.onclick = go; if (sn) sn.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; }
 qa('[data-suboff]').forEach(b => b.onclick = () => { const v = b.dataset.suboff; unitRemove(CHG.key, b.dataset.subkind === 'no' ? {asset_no: v} : {label: v}); });""", 'wire', p, True)
# the sheets: the asset number column says sub-hire, the company and their numbers
t = rep(t, """  <td>${nums.length ? nums.map(x => `<b class="dp-num">${esc(x)}</b>`).join(' ') : (sub ? '<span>Subhired · no Coates number</span>' : '') + dpWr()}</td>""",
 """  <td>${(() => { const sh = subOf(r.a.key), shn = new Set(sh.map(x => String(x.no)).filter(Boolean)), own = nums.filter(x => !shn.has(String(x)));
   const cos = [...new Set(sh.map(x => x.co))].map(co => `<span class="dp-sub">Sub-hire · ${esc(co)}${sh.filter(x => x.co === co && x.no).length ? ' · their no. ' + sh.filter(x => x.co === co && x.no).map(x => `<b class="dp-num">${esc(x.no)}</b>`).join(' ') : ''}</span>`).join('');
   return own.length || cos ? own.map(x => `<b class="dp-num">${esc(x)}</b>`).join(' ') + cos : (sub ? '<span>Subhired · no Coates number</span>' : '') + dpWr(); })()}</td>""", 'sheet', p, True)
k = t.find('</style>'); t = t[:k] + "/* v7.28 - sub-hire */\n.chsub .chdrow input#chSubCo{max-width:44%}\n.dp-sub{display:block;font-size:.92em;margin-top:2px}\n" + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
