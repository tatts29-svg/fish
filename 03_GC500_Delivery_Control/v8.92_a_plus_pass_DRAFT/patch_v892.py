# Author: Andrew Fisher. v8.92 A+ pass (Andrew, 8 Oct 2026: "This need to be all A+ class perfection. Every look. Every movement.
# Smooth. Fast. No lag. Navigation needs to be easy. Terminology needs to be correct with words in every part.")
# Presentation, speed and words only: no record, DATA, pin, direction or navigation-text change; every money figure is worked
# out by the same functions as before. Builds on the full chain (v8.84 to v8.89); v8.91, v8.93 and v8.94 may sit between it and
# this patch, and the footer step takes whichever of them the page carries:
#   toolchain/build.sh v8.92 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
#     v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
#     v8.89_master_map_DRAFT/patch_v889.py [v8.93 …] [v8.94 …] [v8.91 …] v8.92_a_plus_pass_DRAFT/patch_v892.py
# Anchors stay out of the daily runs, run sheets, Drivers/Install prints, crew planning, loading/door side and printing code (v8.91).
import re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()
ORIG_ML = s[s.index('const MASTER_LOC = '):s.index('\n', s.index('const MASTER_LOC = '))]

# the base: the full chain is in; this patch is not
for need in ['today884-style', 'where885-style', 'ep886-style', 'map887-script', 'transport888-style', 'function transport888Core(', 'function tr888Html(',
             'function dropFileIndex(', 'function bookNumbers(', 'function docketNoInName(', 'function fin745Events()', 'function fin745History(', 'function labourPlan(',
             'function tblFocusSoon(', 'function timeline841Motion(', 'let GO_CHANGED = false;', 'let TBLF = 0;']:
    assert need in s, 'base is missing ' + need
assert 'aplus892-style' not in s and 'aplus892-script' not in s, 'v8.92 is already applied'

# 1. the release footer: the one ' · v8.NN' marker of whichever release ran last (v8.89, v8.91, v8.93 or v8.94), exactly once
marks = re.findall(r' · v8\.(?:89|9[0-9])\b', s)
assert len(marks) == 1, f'expected one footer marker once, found {marks}'
s = rep(s, marks[0], ' · v8.92', 'release footer', str(p))

# 2. speed, where the page's own closures have to change (everything else is overridden from aplus892.js):
#    Today's instrument check ran on every scroll event and rewrote every card's controls each time
s = rep(s, "window.addEventListener('scroll', checkMotion, {passive:true, capture:true});",
        "window.addEventListener('scroll', (() => { let f = 0; return () => { if (!f) f = requestAnimationFrame(() => { f = 0; checkMotion(); }); }; })(), {passive:true, capture:true}); /* v8.92 - one check per frame while scrolling, not one per scroll event */",
        'Today motion scroll listener', str(p))


# 3. the Transport view (Costs & P&L): the explanation folds under the four figures, closed, so the figures lead (lead, 8 Oct)
s = rep(s, "<p>Every truck movement the schedule carries, with what Coates pays the carrier (Transport (cartage), a direct cost) and what is charged on (Transport Revenue, the contracts’ delivery and pickup lines). The figures are the Forecast P&amp;L’s, read from one model; the loads are the Timeline’s; the references are Equipment’s. A fact the record does not carry stays unconfirmed.</p></div>",
        "</div>", 'Transport heading paragraph', str(p))
tie = "${transBad ? `<span class=\"fh866-todo\">${esc(fmtNum(transBad))} of ${esc(fmtNum(trans.length))} transport tie-outs do not tie — see Everything reconciles on the P&amp;L summary.</span>` : `<span class=\"fh866-ok\">Ties to the Forecast P&amp;L, Costs to job end, the business’s lines and the Finance handover — ${esc(fmtNum(trans.length))} tie-outs, all tied.</span>`}"
how = "To date: every schedule row with a TPORT COST figure, at the figure written; Internal is a Coates truck; a reference with our own typed transport line uses that line. To come: the card’s transport cost once a reference where a load has no figure, the average for a load with no reference or card line. Branch: the branch on the load’s reference (the hire contracts put it on; a person’s record wins); a schedule row with no reference carries the branch recorded on its stand-in; otherwise unconfirmed, never guessed."
s = rep(s, '<p class="fin745-basis">' + tie + ' ' + how + '</p>',
        '<p class="fin745-basis tr888-tie">' + tie + '</p>\n'
        ' <details class="plfold765 tr888-fold tr888-how" data-sfold="costs765|tr888how"${SFOLD_OPEN.has(\'costs765|tr888how\') ? \' open\' : \'\'}><summary>How these figures are worked out<small>what counts to date and to come, and how a load gets its branch</small></summary>\n'
        ' <p>Every truck movement the schedule carries, with what Coates pays the carrier (Transport (cartage), a direct cost) and what is charged on (Transport Revenue, the contracts’ delivery and pickup lines). The figures are the Forecast P&amp;L’s, read from one model; the loads are the Timeline’s; the references are Equipment’s. A fact the record does not carry stays unconfirmed.</p>\n'
        ' <p class="fin745-basis">' + how + '</p></details>', 'Transport explanation fold', str(p))

# 4. terminology: one word for one thing, in Andrew's words (AGENTS.md). Each anchor is user-visible text, matched once.
T = [
 # Plant is called Equipment (the address stays #plant); the Register tab was set aside in v5.91
 ('<button class="btn" id="toPlant">Plant page</button>', '<button class="btn" id="toPlant">Equipment page</button>'),
 ('Transport (cartage) — never revenue. Put a branch on an asset from its drawer or the Register tab.</p>', 'Transport (cartage) — never revenue. Put a branch on an asset from its drawer or the Equipment tab.</p>'),
 ("Put one on from the asset's drawer or the Register tab.</p>", "Put one on from the asset's drawer or the Equipment tab.</p>"),
 # hired-in gear is sub-hired (one spelling); the money is Rehire
 ('>subhired${r.supplier_sub_rental', '>sub-hired${r.supplier_sub_rental'),
 ("{label: 'Subhired, no Coates asset number'", "{label: 'Sub-hired, no Coates asset number'"),
 ("` · subhired ${money0(g.contract.subhire.charge)}", "` · sub-hired ${money0(g.contract.subhire.charge)}"),
 ('<summary>On the contracts — by the rate, subhired and charge lines, by branch</summary>', '<summary>On the contracts — by the rate, sub-hired and charge lines, by branch</summary>'),
 ('A line whose item code starts with SUB is subhired;', 'A line whose item code starts with SUB is sub-hired;'),
 ("miss(`the rehire cost of the ${C.subhire.lines} subhired line${", "miss(`the rehire cost of the ${C.subhire.lines} sub-hired line${"),
 ("s.notes.push(`${pl(s.subhired, 'subhired line')}", "s.notes.push(`${pl(s.subhired, 'sub-hired line')}"),
 ("put('rehire', null, `${X.C.subhire.lines} subhired contract line${", "put('rehire', null, `${X.C.subhire.lines} sub-hired contract line${"),
 ("ln('Rehire cost — subhired contract lines'", "ln('Rehire cost — sub-hired contract lines'"),
 ("`for the ${pl(k.subhire_lines, 'subhired contract line')}`", "`for the ${pl(k.subhire_lines, 'sub-hired contract line')}`"),
 ("` · including subhired ${esc(money0(c.subhire))} (Rehire Revenue)`", "` · including sub-hired ${esc(money0(c.subhire))} (Rehire Revenue)`"),
 ('<span class="chip cand">${sub} subhired</span>', '<span class="chip cand">${sub} sub-hired</span>'),
 ("` · subhired ${esc(money0(CT.subhire.charge))} on ${CT.subhire.lines}", "` · sub-hired ${esc(money0(CT.subhire.charge))} on ${CT.subhire.lines}"),
 ('<li>A rate for the subhired 5 t forklift with 1.8 m tynes', '<li>A rate for the sub-hired 5 t forklift with 1.8 m tynes'),
 ("`, ${subhires}subhired machine${subhires === 1", "`, ${subhires} sub-hired machine${subhires === 1"),
 ('<span title="a subhired machine has no Coates asset number', '<span title="a sub-hired machine has no Coates asset number'),
 ('Subhired, no Coates asset number</span><b>${esc(fmtNum(subhires))}', 'Sub-hired, no Coates asset number</span><b>${esc(fmtNum(subhires))}'),
 ("— ${numbers} on an asset number and ${subhires} subhired with none`", "— ${numbers} on an asset number and ${subhires} sub-hired with none`"),
 ("${subhires === 1 ? 'is' : 'are'} subhired and ${subhires === 1 ? 'carries'", "${subhires === 1 ? 'is' : 'are'} sub-hired and ${subhires === 1 ? 'carries'"),
 ('<span title="already in the figure above — the subhired lines among them">of which subhired — Rehire Revenue', '<span title="already in the figure above — the sub-hired lines among them">of which sub-hired — Rehire Revenue'),
 ('<b>Subhired:</b>', '<b>Sub-hired:</b>'),
 ('Where a person has named one as a subhired', 'Where a person has named one as a sub-hired'),
 ('on contract 9961976 is subhired,', 'on contract 9961976 is sub-hired,'),
 ("`, ${subs} subhired machine${subs === 1", "`, ${subs} sub-hired machine${subs === 1"),
 ("` · ${rows.reduce((s, r) => s + (r.subs || []).length, 0)} subhired`", "` · ${rows.reduce((s, r) => s + (r.subs || []).length, 0)} sub-hired`"),
 ('<h3>Sub-hire register - whose gear is where</h3>', '<h3>Sub-hired gear — whose gear is where</h3>'),
 ('<label for="sub744Co">Sub-hire company</label>', '<label for="sub744Co">Sub-hired from</label>'),
 ('<p class="norate">Nothing recorded as a sub-hire here.</p>', '<p class="norate">Nothing recorded as sub-hired here.</p>'),
 ('title="sub-hired units at this location">Sub-hire · ${esc(c.co)} ×${c.sub}</span>', 'title="sub-hired units at this location">Sub-hired · ${esc(c.co)} ×${c.sub}</span>'),
 ("return supplierGroups744(a).map(g => 'Sub-hire · ' + g.co", "return supplierGroups744(a).map(g => 'Sub-hired · ' + g.co"),
 ('title="units at this location that carry an asset number or are recorded as a sub-hire">', 'title="units at this location that carry an asset number or are recorded as sub-hired">'),
 ("[['fencing', 'Fencing — sub-hire'], ['toilets', 'Toilets — sub-hire'],", "[['fencing', 'Fencing — Rehire'], ['toilets', 'Toilets — Rehire'],"),
 ("sub-hire pick-ups, ${n(DP.days.reduce((s, d) => s + d.toilets, 0))} Coates toilet runs", "sub-hired toilet pick-ups, ${n(DP.days.reduce((s, d) => s + d.toilets, 0))} Coates toilet runs"),
 # oversized (Andrew's word), not oversize
 ('bars oversize vehicles in the Gold Coast', 'bars oversized vehicles in the Gold Coast'),
 ('we plan oversize moves 09:00–16:00.', 'we plan oversized moves 09:00–16:00.'),
 ('>oversize? the branch to say - permit not checked</span>', '>oversized? the branch to say - permit not checked</span>'),
 ('an oversize load over 3.1 m wide or 25 m long may not travel', 'an oversized load over 3.1 m wide or 25 m long may not travel'),
 ("lab: 'Pieces on one truck (not oversize)'", "lab: 'Pieces on one truck (not oversized)'"),
 ("'stagger departures - oversize loads may not run in convoy'", "'stagger departures - oversized loads may not run in convoy'"),
 ('<summary>Oversize: check permit / travel window for ${esc(dayWords816(iso))}</summary>', '<summary>Oversized: check permit / travel window for ${esc(dayWords816(iso))}</summary>'),
 ('<span class="chip crit" title="${esc(OVSRC816)}">Oversize: check permit / travel window</span>', '<span class="chip crit" title="${esc(OVSRC816)}">Oversized: check permit / travel window</span>'),
 ('flagged oversize on this device', 'flagged oversized on this device'),
 ("out.push({k: 'over', w: 'Oversize transport planning'})", "out.push({k: 'over', w: 'Oversized transport planning'})"),
 ('<li><b>Oversize planning</b>: buildings and toilet blocks are flagged for oversize transport planning', '<li><b>Oversized planning</b>: buildings and toilet blocks are flagged for oversized transport planning'),
 ('the oversize planning category from crew planning', 'the oversized planning category from crew planning'),
 # Rate 1, as the contract line calls it
 ("bits.push('rate 1 <b>' + esc(money(r.rate_1)) + '</b>' + rt);", "bits.push('Rate 1 <b>' + esc(money(r.rate_1)) + '</b>' + rt);"),
 ("bits.push('rate 2 ' + esc(money(r.rate_2)));", "bits.push('Rate 2 ' + esc(money(r.rate_2)));"),
 ("bits.push('rate 3 ' + esc(money(r.rate_3", "bits.push('Rate 3 ' + esc(money(r.rate_3"),
 ("money(x.rate_1) + ' rate 1' + (x.rate_type", "money(x.rate_1) + ' Rate 1' + (x.rate_type"),
 ('<span class="w">rate 1${types.length', '<span class="w">Rate 1${types.length'),
 # Australian English on the Pre-start declaration
 ('hold the required certification and licenses to conduct the task.', 'hold the required certification and licences to conduct the task.'),
 # the Costs & P&L heading the private presentation writes over the pane's own, and the summary email's last line (plain text)
 ("const heading=pane.querySelector('.hubhead h2');if(heading)heading.textContent='Costs & charges';", "const heading=pane.querySelector('.hubhead h2');if(heading)heading.textContent='Costs & P&L';"),
 ('`Every line is on the Costs & charges tab (#costs) · ', '`Every line is on the Costs & P&L tab (#costs) · '),
]
for old, new in T: s = rep(s, old, new, 'words: ' + old[:50], str(p))

# The counted replacements below touch the page's CODE only. DATA (the record the page ships with) is one line and is never
# edited: it is cut out first and put back unchanged, and the end of the patch proves it byte for byte.
i0 = s.index('\nconst DATA = '); i1 = s.index('\n', i0 + 1); DATA_LINE = s[i0:i1]; s = s[:i0] + '\n/*DATA892*/' + s[i1:]
# the tab is called Costs & P&L; every card, hint and link that still said "Costs & charges" says so (counted, so a moved base is caught)
n = s.count('Costs &amp; charges'); assert 12 <= n <= 30, f'Costs &amp; charges found {n} times'
s = s.replace('Costs &amp; charges', 'Costs &amp; P&amp;L'); print(f'  Costs & charges -> Costs & P&L x{n}')
# Pricing is the Customer rates & charges section of Costs & P&L since v8.57; the hints that still sent people to "the Pricing tab"
for old, new, lo, hi in [('The Pricing tab prices', 'Customer rates &amp; charges prices', 1, 3), ("the Pricing tab's", 'the Customer rates &amp; charges', 8, 16), ('data-go="pricing">Pricing tab</button>', 'data-go="pricing">Customer rates &amp; charges</button>', 1, 2), ('the Pricing tab', 'Customer rates &amp; charges', 6, 14)]:
    n = s.count(old); assert lo <= n <= hi, f'{old!r} found {n} times'; s = s.replace(old, new); print(f'  {old!r} -> {new!r} x{n}')
assert 'Pricing tab' not in s.replace('Pricing tab</button>', ''), 'a Pricing tab mention is left'
assert s.count('\n/*DATA892*/') == 1; s = s.replace('\n/*DATA892*/', DATA_LINE, 1)
assert s[s.index('\nconst DATA = '):s.index('\n', s.index('\nconst DATA = ') + 1)] == DATA_LINE, 'DATA must be untouched'

# 5. style before </head>; script before the LAST </body>, after every other release's script, so its overrides land last
s = s.replace('</head>', '<style id="aplus892-style">' + (here / 'aplus892.css').read_text() + '</style>\n</head>', 1)
js = (here / 'aplus892.js').read_text()
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="aplus892-script">\n' + js + '</script>\n' + tag + tail
assert DATA_LINE in s and s.count('const DATA = ') == 1, 'DATA must be the original bytes'
assert ORIG_ML in s, 'MASTER_LOC must be the original bytes'
p.write_text(s)
print('v8.92 applied')
