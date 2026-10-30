"""Author: Andrew Fisher. v12.67 - the P&L tab in one cut of the costs, and one difference so far.

Andrew, 30 Oct 2026 (this chat, 20:2x AEST): "I also want the p&l reviewed again. I want it clean and clear. Easy to understand.
And u understand where costs are." Review and mock-up: review_30Oct2026_pl_again/. Andrew, 31 Oct 2026 06:5x AEST: "Yes proceed".

What this release changes, on the live v12.66 page (BASE is its verified SHA-256):

1. The model: the Forecast P&L's "difference so far" (moneySummary().difference, and difference0 as printed to the dollar) takes
   the labour hire worked so far off, the way its job-end figure always took the wages priced off. labourHireSoFar1267(day) reads
   the running sheet the way Costs to job end does (fin745Rows: the hired-in people's shifts to today at the rates on the record;
   not Coates wages, which stay in hours; not the Advanced race crew, a fencing cost). cost.known is unchanged: direct costs known
   stay the Finance figure they were, and the labour hire is said beside them wherever the arithmetic is laid out. The figures
   before the change stay on the model as difference_before1267 / difference0_before1267. So At a glance, the Forecast P&L, "Are we
   making money?", the emailed summary and the face all show one difference so far.
2. The wording on the cards that show it (At a glance's Difference tile, the Forecast P&L's Difference card, the Forecast P&L by
   branch, "Are we making money?" with a labour hire row under its streams, the emailed summary, the labour note) says "and labour
   hire" where it said "revenue less direct costs known".
3. The face: pl1262 (v12.65) is removed and pl1267 put in its place - three tiles, revenue in plain words, one cost table under the
   eight categories management expect naming who we pay, by-branch cards, Not in it yet, then three closed folds (Finance's lines,
   the v12.65 ledger tables unchanged; Fencing, everything included; Workings). Nothing removed, every button still bound.
4. Footer v12.66 -> v12.67.

    python3 patch_v1267.py page.html      (in place, on the live v12.66 page)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '7a745c28b0f66d3d0062255cde90e15b393b111d3b54df8c7dbff18479935e1c'  # live v12.66, public GET 31 Oct 2026 07:06 AEST
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")

HELPER = r'''/* v12.67 - the labour hire worked so far: the running sheet's hired-in people (not Coates wages and salary, which stay in hours;
   not the Advanced race crew, a fencing cost), their paid hours to today at the rates on the record, a verified actual where one is
   recorded - the same reading Costs to job end gives them. Taken off the Forecast P&L's difference so far, as the wages priced were
   always taken off its job-end figure. */
function labourHireSoFar1267(asOf){
 const today = asOf || todayIso(), r2 = n => Math.round(n * 100) / 100; let known = 0, toCome = 0, unpriced = 0, shifts = 0;
 try { const RC = typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.model(today) : null;
  fin745Rows(today).forEach(r => { if (RC && RaceCrew1227.isCrew(r)) return; if (r.type === 'cna' || r.type === 'salary') return;
   const past = r.date && r.date <= today && r.status !== 'forecast', cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost;
   if (cost == null) { unpriced += Number(r.paid) || 0; return; } shifts++; if (past) known += cost; else toCome += cost; }); } catch (e) {}
 return {known: r2(known), toCome: r2(toCome), job: r2(known + toCome), unpricedHours: r2(unpriced), shifts};
}
'''


def sub1(text, old, new, what):
    n = text.count(old)
    if n != 1: raise ValueError('%s: expected the anchor once, found %d: %r' % (what, n, old[:80]))
    return text.replace(old, new)


def patch(text):
    if 'pl1267-script' in text: raise ValueError('v12.67 is already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.66; rebuild and retest')
    for need in ('pl1262-script', 'pickedup1266-art', 'gone1263', 'Baseplan (11) charges this line'):
        if need not in text: raise ValueError('the base is missing ' + need)

    # 3a. the v12.65 face out (style and script), wherever the page holds it
    i = text.index('<style id="pl1262-style">')
    j0 = text.index('<script id="pl1262-script">', i)
    j = text.index('</script>\n', j0) + len('</script>\n')
    block = text[i:j]
    if block.count('<script') != 1 or block.count('<style') != 1 or 'var PL1262' not in block: raise ValueError('the pl1262 block is not what was expected')
    text = text[:i] + text[j:]
    if 'pl1262' in text: raise ValueError('pl1262 is still referenced after the removal')

    # 1. the model
    text = sub1(text, 'function moneySummary_(asOf){', HELPER + 'function moneySummary_(asOf){', 'the helper before moneySummary_')
    text = sub1(text, ' const difference = cents(charge.total - cost.known);',
                ' const LH1267 = labourHireSoFar1267(day); cost.labour_hire1267 = LH1267; /* v12.67 */\n const difference_before1267 = cents(charge.total - cost.known); const difference = cents(difference_before1267 - LH1267.known); /* v12.67 - after the labour hire so far */',
                'difference')
    text = sub1(text, ' const difference0 = Math.round(charge.total) - Math.round(cost.known);',
                ' const difference0_before1267 = Math.round(charge.total) - Math.round(cost.known); const difference0 = difference0_before1267 - Math.round(LH1267.known); /* v12.67 */',
                'difference0')
    text = sub1(text, 'return {as_at: day, charge, cost, difference, difference0, missing, missing_short: short,',
                'return {as_at: day, charge, cost, difference, difference0, difference_before1267, difference0_before1267, missing, missing_short: short,',
                'the summary returns the figures before the change too')

    # 2. the words on the cards that show the difference
    text = sub1(text, "none of these wages are added to this P&L",
                "the hired-in shifts worked so far are taken off the difference so far at those rates (v12.67); Coates wages are never priced here", 'the labour note')
    text = sub1(text, "'so far — revenue less direct costs known'", "'so far — revenue less direct costs known and labour hire'", 'At a glance tile')
    text = sub1(text, "revenue less direct costs known, the Forecast P&L’s figure", "revenue less direct costs known and the labour hire so far, the Forecast P&L’s figure", 'Forecast P&L difference card')
    text = sub1(text, "the Difference beside it, and At a glance, take the travel, accommodation and meals off too",
                "the Difference beside it, and At a glance, take the travel, accommodation, meals and the labour hire so far off too", 'Forecast P&L margin card words')
    text = sub1(text, "<small>not a margin yet</small>", "<small>after labour hire · not a margin yet</small>", 'Forecast P&L by branch KPI')
    old_line = "${line('Difference so far', 'revenue less the direct costs known · not a margin yet', sd(M.difference0), '', 'total diff' + (M.difference0 < 0 ? ' neg' : ''))}"
    new_line = ("${line('Labour hire so far — the running sheet at the rates on the record', 'the hired-in people; Coates wages stay in hours · taken off the difference below', m0((k.labour_hire1267 || {}).known), '', '')}\n"
                " ${line('Difference so far', 'revenue less the direct costs known and the labour hire so far · not a margin yet', sd(M.difference0), '', 'total diff' + (M.difference0 < 0 ? ' neg' : ''))}")
    text = sub1(text, old_line, new_line, 'Forecast P&L by branch difference line')
    old_tot = '<td class="num" data-l="Difference">${sd(M.difference0)}</td><td class="stnote">not a margin yet — ${esc(M.missing_short.join(\' · \'))}</td></tr></tbody></table></div>'
    new_tot = ('<td class="num" data-l="Difference">${sd(M.difference0_before1267)}</td><td class="stnote">before labour hire</td></tr>'
               '<tr class="total"><td><b>Labour hire — the running sheet, so far</b><br><span class="w">the hired-in people at the rates on the record; Coates wages stay in hours</span></td><td class="num" data-l="Revenue">—</td><td class="num" data-l="Direct costs"><b>${m0((k.labour_hire1267 || {}).known)}</b></td><td class="num" data-l="Difference">${sd(-((k.labour_hire1267 || {}).known || 0))}</td><td class="stnote">taken off the difference</td></tr>'
               '<tr class="total"><td><b>Difference so far, after labour hire</b></td><td class="num" data-l="Revenue"></td><td class="num" data-l="Direct costs"></td><td class="num" data-l="Difference">${sd(M.difference0)}</td><td class="stnote">not a margin yet — ${esc(M.missing_short.join(\' · \'))}</td></tr></tbody></table></div>')
    text = sub1(text, old_tot, new_tot, 'Are we making money, the streams total')
    text = sub1(text, "of direct costs known so far — difference so far ${sd(M.difference0)}.</b>",
                "of direct costs known so far and ${esc(money0((k.labour_hire1267 || {}).known))} of labour hire — difference so far ${sd(M.difference0)}.</b>", 'Are we making money, the verdict')
    text = sub1(text, "· DIRECT COSTS (known so far) ${money0(M.cost.known)} · DIFFERENCE SO FAR",
                "· DIRECT COSTS (known so far) ${money0(M.cost.known)} · LABOUR HIRE (so far) ${money0((M.cost.labour_hire1267 || {}).known)} · DIFFERENCE SO FAR", 'the emailed summary')
    text = sub1(text, "Wages are not in this P&L:", "Coates wages are not in this P&L (hours only):", 'the emailed summary, wages')

    # 3b. the v12.67 face in, just before the page's closing </body>, after every script it reads
    js = (HERE / 'pl1267_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'pl1267.css').read_text(encoding='utf-8').rstrip()
    end = '</body>\n</html>'
    i = text.rfind(end)
    if i < 0 or len(text) - i > len(end) + 2: raise ValueError('the page does not end with </body></html>')
    block = '<style id="pl1267-style">\n' + css + '\n</style>\n<script id="pl1267-script">\n' + js + '\n</script>\n'
    text = text[:i] + block + text[i:]

    # 4. footer
    found = FOOTER.findall(text)
    if found != ['v12.66']: raise ValueError('release footer: expected one v12.66 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.67'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1267 applied: one cut of the costs on the P&L face, one difference so far (after labour hire) everywhere; footer v12.66 -> v12.67')
