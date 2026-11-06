#!/usr/bin/env python3
"""v7.67 - Priced by us. Andrew, 1 Oct 2026, reading the Forecast P&L's "Hire with no contract rate yet ... an estimate
until the branch puts a rate on the line" and "Toilet servicing ... on no contract line yet": "can you not answer these
questions? Surely you can - you have the answers. We need this to be presentable and as accurate as possible, so we may
need to work out some ourselves. This is a good time for us to shine." Apply after v7.60 to v7.66.

  The page already prices every one of those lines - the 32 from the street rate card 2026 (or a rate typed on Costs)
  and the servicing from the card's pump-out rates - but the P&L framed them as open questions. Now it says what we did:
  "Hire priced by us from the street rate card 2026" with the rule (the card line each one is charged at, the day rate
  by the days to the term date for forklifts, VMS and barriers, the whole-event rate for the rest), and "Toilet
  servicing - priced by us at our pump-out rates" with the quantities, the card lines and what Event Portables charge us
  for the same work (the Rehire cost). Each line links to the table under The working that lists every line and its
  rate, where a rate can be changed. The two lines with no card line are named with the best evidence the record holds:
  MEAD's own contract carries Rate 1 $9.30 a week for the same forklift extension; the tyne rotator has no rate anywhere
  on the contracts. No figure changes.
    python3 patch_v767.py <page.html>   (needs v7.65: data-jump765; v7.60's pl752Card wording)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'pl767Unpriced' in t: sys.exit('v7.67 already applied')
for need in ["const CONTRACT = tag('on the contracts', 'ok'),CARD = tag('from the card', 'est'), NONE = tag('not priced', 'none'), DOCKET = tag('dockets', 'ok'), SCOPE = tag('the scope', 'ok');",
 "${cardLines ?line('Hire with no contract rate yet — from the card, or a rate typed on Costs', `${pl(cardLines, 'line')} · the street rate card 2026, or the rate the branch gave us typed on Costs · an estimate until the branch puts a rate on the line (Rate 1 on the contract is kept)`, m0(cardTotal), CARD) : ''}",
 "${servicing ?line(`Toilet servicing and cleaning — ${esc(pl760ToiletBranch())} rehire, at our pump-out rates`, 'Event Portables’ quantities on Q6844 · Rehire Revenue on no contract line yet · servicing and cleaning are not labour', m0(servicing), CARD) : ''}",
 "<h4>Toilet servicing — on no contract line yet</h4>", 'data-jump765', "function pl752Card(){"]:
    if need not in t: sys.exit('needs ' + need)

t = rep(t, "const CONTRACT = tag('on the contracts', 'ok'),CARD = tag('from the card', 'est'), NONE = tag('not priced', 'none'), DOCKET = tag('dockets', 'ok'), SCOPE = tag('the scope', 'ok');",
 "const CONTRACT = tag('on the contracts', 'ok'),CARD = tag('priced by us · the card', 'est'), NONE = tag('not priced', 'none'), DOCKET = tag('dockets', 'ok'), SCOPE = tag('the scope', 'ok');", 'card tag', p, True)

t = rep(t, "${cardLines ?line('Hire with no contract rate yet — from the card, or a rate typed on Costs', `${pl(cardLines, 'line')} · the street rate card 2026, or the rate the branch gave us typed on Costs · an estimate until the branch puts a rate on the line (Rate 1 on the contract is kept)`, m0(cardTotal), CARD) : ''}",
 """${cardLines ?line('Hire priced by us from the street rate card 2026', `${pl(cardLines, 'line')} the branch has not put Rate 1 on yet — we charge the card line each one matches: forklifts, VMS and barriers at the day rate × the days to the term date, the rest at the whole-event rate; a rate the branch gives us is typed on Costs and stands in for the card · <button class="linkish" data-jump765="card748">each line and its rate</button> · when Rate 1 lands on the contract it takes over`, m0(cardTotal), CARD) : ''}""", 'card-priced line', p, True)

t = rep(t, "${servicing ?line(`Toilet servicing and cleaning — ${esc(pl760ToiletBranch())} rehire, at our pump-out rates`, 'Event Portables’ quantities on Q6844 · Rehire Revenue on no contract line yet · servicing and cleaning are not labour', m0(servicing), CARD) : ''}",
 """${servicing ?line(`Toilet servicing and cleaning — ${esc(pl760ToiletBranch())} rehire, priced by us at our pump-out rates`, pl767Servicing(), m0(servicing), CARD) : ''}""", 'servicing line', p, True)

t = rep(t, "<h4>Toilet servicing — on no contract line yet</h4>", "<h4>Toilet servicing — priced by us at our pump-out rates</h4>", 'card748 servicing head', p, True)

# the two lines with no card line: say what the record holds for them
t = rep(t, "${noRate ? line('Contract lines with no rate and no card line', `${pl(noRate, 'line')} · unknown, not nought`, '<span class=\"pl-todo\">—</span>', NONE",
 "${noRate ? line('Contract lines with no rate and no card line — what the contracts hold for them', `${pl(noRate, 'line')} · unknown, not nought · ${pl767Unpriced().words.map(esc).join(' · ')}`, '<span class=\"pl-todo\">—</span>', NONE", 'unpriced line', p, True)

# a jump to something inside a closed fold opens the fold first (the P&L's "each line and its rate" lands on the card748 table under The working)
t = rep(t, "pane.querySelectorAll('[data-jump765]').forEach(b => b.onclick = () => { const el = document.getElementById(b.dataset.jump765); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({behavior: 'smooth', block: 'start'}); });",
 "pane.querySelectorAll('[data-jump765]').forEach(b => b.onclick = () => { const el = document.getElementById(b.dataset.jump765); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; const fold = el.closest('details'); if (fold && !fold.open) fold.open = true; /* v7.67 */ el.scrollIntoView({behavior: 'smooth', block: 'start'}); });", 'jump opens the fold', p, True)

JS = r"""/* v7.67 - PRICED BY US. Andrew, 1 Oct 2026: "can you not answer these questions? Surely you can - you have the answers."
 The servicing line says what we priced and how; the two lines with no card line are named with the best evidence the
 contracts hold (a sibling line with Rate 1 on another branch's contract). */
function pl767Servicing(){
 const sv = typeof servicing748 === 'function' ? servicing748() : null; if (!sv) return 'Event Portables’ quantities on Q6844 at the card’s pump-out rates · Rehire Revenue · servicing and cleaning are not labour';
 const parts = sv.lines.map(l => `${fmtNum(l.qty)} × ${esc(l.card_line || l.description)} at ${money(l.rate)}${l.from === 'typed' ? ' (typed)' : ''}`);
 return `Event Portables’ quantities on Q6844 — ${parts.join(' · ')} — at our card’s pump-out rates; Event Portables charge us ${money0(sv.their_total)} for the same work, inside the Rehire cost · Rehire Revenue on no contract line yet: the branch adds the servicing lines when it bills · servicing and cleaning are not labour`;
}
function pl767Unpriced(){
 const norm = s => String(s || '').replace(/^(SUPPLY|COATES|EVENTS|SPARE)-?\s*/i, '').replace(/\b(telehandler|forklift)\b/gi, '').replace(/\s+/g, ' ').trim().toLowerCase();
 const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !(typeof lr748Decided === 'function' && lr748Decided(r)) && !(typeof lr748For === 'function' && lr748For(r)));
 const rated = ONHIRE_ROWS.filter(r => typeof r.rate_1 === 'number' && !r.charge_line);
 /* a sibling is the SAME description once the branch prefixes are stripped; failing that, the one named thing the contracts
    carry twice - a forklift extension (fork/forklift/telehandler + extension on both sides). Sharing one word is not a match (Codex's review, 1 Oct). */
 const forkExt = s => /\b(fork|forklift|telehandler)\b/i.test(s || '') && /\bextension\b/i.test(s || '');
 /* a stated size is a specification: two lines that both state one must state the same (1800 mm is not 2400 mm); a line that states none is not contradicted */
 const sizes = s => [...String(s || '').matchAll(/(\d+(?:\.\d+)?)\s*(mm|m|t|kg|kva)\b/gi)].map(m => m[1] + m[2].toLowerCase());
 const compatible = (a, b) => { const sa = sizes(a), sb = sizes(b); return !sa.length || !sb.length || sa.every(x => sb.includes(x)); };
 const items = open.map(r => { const exact = rated.find(x => norm(x.description) === norm(r.description)); const near = !exact && forkExt(r.description) ? rated.find(x => forkExt(x.description) && compatible(r.description, x.description)) : null; const sib = exact || near || undefined; return {r, sib, how: exact ? 'the same thing' : near ? 'the nearest thing on the contracts — a forklift extension with no size stated' : null, rateWords: sib ? `Rate 1 ${money(sib.rate_1)}${sib.rate_type === 'W' ? ' a week' : sib.rate_type === 'D' ? ' a day' : sib.rate_type ? ' (' + sib.rate_type + ')' : ''}` : ''}; });
 const words = items.map(x => `${x.r.description || x.r.item} (${x.r.branch_code})${x.sib ? ` — ${x.sib.branch_code}’s own line ${x.sib.item} carries ${x.rateWords} for ${x.how}: a starting point for the branch to confirm (the size and the period), not a rate to copy` : ' — no rate for it anywhere on the contracts or the card'}`);
 return {n: open.length, items, words, short: items.length ? (items.filter(x => x.sib).length ? `${fmtNum(items.filter(x => x.sib).length)} with a sibling rate on the contracts for the branch to confirm` : 'no rate anywhere on the contracts') : 'none'};
}
"""
t = rep(t, "function pl752Card(){", JS + "function pl752Card(){", 'priced-by-us helpers', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.67 applied: the P&L says what we priced and how — the card lines, the servicing, the two without a card line')
