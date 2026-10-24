# Author: Andrew Fisher. v8.88 Costs & P&L: everything talks (one transport model behind the Forecast P&L, Costs to job end,
# the Finance handover and a new Transport view, with an "Everything reconciles" line), and the Transport view down to the branch.
# Builds on v8.85 (live, or chained in the same build); it does not depend on v8.86 or v8.87, and the footer step takes
# whichever of v8.85, v8.86 or v8.87 the page carries:
#   toolchain/build.sh v8.88 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py v8.88_costs_transport_DRAFT/patch_v888.py
import re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); s = p.read_text()

def cut(text, start, end, new, what):
    """Replace the span from `start` to the end of `end` (each found exactly once, in order) with `new`."""
    if text.count(start) != 1: sys.exit(f'{what}: start marker found {text.count(start)} times')
    if text.count(end) != 1: sys.exit(f'{what}: end marker found {text.count(end)} times')
    i = text.index(start); j = text.index(end) + len(end)
    if j <= i or j - i > 12000: sys.exit(f'{what}: span is wrong ({j - i} chars)')
    return text[:i] + new + text[j:]

# the base: v8.85 (with v8.84) applied; the functions this patch reads and rewrites; not applied already
assert 'where885-style' in s and 'today884-style' in s, 'v8.84 and v8.85 must be applied first'
for fn in ['function moneySummary_(', 'function cj764Model776Held(', 'function fh866Model(', 'function fh866Html(', 'function financeSubView857(', 'function financeLinks857(', 'function paneHeadingHtml(', 'function renderCosts_held(', 'function heldMemo(', 'function crew883Transport(', 'function handling875Record(', 'function loading872Record(', 'function trucks816(', 'function buildingTransportModel831(']:
    assert fn in s, 'base is missing ' + fn
assert 'transport888-style' not in s and 'function transport888Core(' not in s, 'v8.88 is already applied'

# 1. the release footer: the one ' · v8.8N' marker (N = 5, 6 or 7), exactly once, becomes v8.88
marks = [m for m in (' · v8.85', ' · v8.86', ' · v8.87') if m in s]
assert len(marks) == 1 and s.count(marks[0]) == 1, f'expected one footer marker once, found {[(m, s.count(m)) for m in marks]}'
s = rep(s, marks[0], ' · v8.88', 'release footer', str(p))

# 2. the Costs & P&L nav: a Transport button after Finance handover (its own data attribute, so the five v8.57 sections stay five)
s = rep(s, '<button class="btn" data-finance857="handover">Finance handover</button></nav>',
        '<button class="btn" data-finance857="handover">Finance handover</button><button class="btn" data-finance888="transport">Transport</button></nav>', 'Transport button', str(p))
# 3. the sub-view heading carries the button's word
s = rep(s, "const FIN865 = {pricing: 'Customer rates & charges', runsheet: 'Workforce costs', handover: 'Finance handover'};",
        "const FIN865 = {pricing: 'Customer rates & charges', runsheet: 'Workforce costs', handover: 'Finance handover', transport: 'Transport'};", 'FIN865 heading words', str(p))
# 4. the Transport view is drawn fresh from the record each time it is opened, like the Finance handover
s = rep(s, "if(view==='handover'){ /* v8.66 - drawn fresh each time from the record */",
        """if(view==='transport'){ /* v8.88 - drawn fresh each time from the record */
    const costs=document.getElementById('pane-costs');
    costs.innerHTML=paneHeadingHtml('costs')+financeLinks857()+'<div id="finance857-section">'+paneHeadingHtml('transport')+tr888Html()+'</div>';
    const tb=costs.querySelector('[data-finance888]'); if(tb)tb.setAttribute('aria-pressed','true');
    tr888Bind(); return true; }
  if(view==='handover'){ /* v8.66 - drawn fresh each time from the record */""", 'Transport sub-view', str(p))

# 5. the Forecast P&L reads the loads from the one transport model (the same rows, the same reading, row for row)
s = cut(s, "const tRows = []; live.forEach(a => (a.events || []).forEach(e => { const tc = e.transport_cost; if (!tc) return;",
        "schedT.unref = {rows: xUnref.filter(x => x.t.amount != null).length, amount: cents(xUnref.reduce((s, x) => s + (x.t.amount || 0), 0))};",
        """/* v8.88 - ONE MODEL FOR EVERY LOAD. transport888Core() reads the schedule's rows once - every load on a reference, the fencing
 semis to Phillip Park and the rows with no reference - with the same reading this summary has given them since v7.64 and
 v5.85 (every row with a figure counted at the figure written, Internal a Coates truck, our own line standing in for a
 reference's schedule figure). Costs to job end, the Finance handover and the Transport view read the same rows. */
 const T888 = transport888Core();
 const tRows = T888.tRows, tcs = T888.tcs, tFig = T888.tFig, tCounted = T888.tCounted, schedT = T888.schedT;""", 'moneySummary_ transport rows')

# 6. Costs to job end reads its transport forecast from the same model
s = cut(s, "const transportAssets834 = allAssets(); const live = transportAssets834.filter(a => !a._cancelled && !a.rest_of); let cardCost = 0, cardRefs = 0, loadsNoFig = 0, loadsNoFigNoCard = 0;",
        "const avg = ST.counted_refs ? r2(ST.counted / ST.counted_refs) : null; const avgPart = avg != null ? r2(avg * loadsNoFigNoCard) : null;",
        """/* v8.88 - the forecast per load comes from the one transport model (transport888Core): the card's transport cost once a
 reference where a load has no figure, the average for a load with no reference or card line - the same rows the P&L's
 to-date figure and the Transport view read, so the two can never drift apart */
 const T888 = transport888Core(), F888 = T888.forecast, ourRefs = T888.ourRefs;
 const cardCost = F888.cardCost, cardRefs = F888.cardRefs, loadsNoFig = F888.loadsNoFig, loadsNoFigNoCard = F888.loadsNoFigNoCard, nonLoadTasks834 = F888.nonLoadTasks, avg = F888.avg, avgPart = F888.avgPart;""", 'cj764 transport forecast')
# the demob legs the P&L does not forecast are named under "Not priced yet", with the card's pickup leg they would cost
s = rep(s, "gap(`${fmtNum(loadsNoFig + loadsNoFigNoCard)} loads with no transport figure yet`, 'September deliveries on 28 Sep and every October and November load', 'Andrew — the carriers’ figures on the schedule');",
        """gap(`${fmtNum(loadsNoFig + loadsNoFigNoCard)} loads with no transport figure yet`, 'September deliveries on 28 Sep and every October and November load', 'Andrew — the carriers’ figures on the schedule');
 if (T888.demob.notInPl.legs) gap(`${fmtNum(T888.demob.notInPl.legs)} demob leg${T888.demob.notInPl.legs === 1 ? '' : 's'} with no carrier, docket or figure — not forecast`, `every reference comes off again; at the card’s transport cost, once a reference, the ${fmtNum(T888.demob.notInPl.refs)} reference${T888.demob.notInPl.refs === 1 ? '' : 's'} would cost ${money0(T888.demob.notInPl.total)} — named here and on the Transport view, not added until the rule is settled`, 'Andrew — whether the demob legs go into the forecast at the card');""", 'cj764 demob gap', str(p))

# 7. the Finance handover splits transport on the same model's branches, and its demob transport is a cut of the P&L
s = cut(s, "/* the weights: transport by each reference's contract branch; people by the labour per piece on each branch */",
        "try { ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null).forEach(x => { const b = (costBranchOf(x) || {}).code; if (b) bump(tBy, b, x.amount); else tNone = r2(tNone + x.amount); }); } catch (e) {}",
        """/* v8.88 - the weights: transport by the branch on each load, from the one transport model (a reference's branch; a
 stand-in row's recorded branch); a load with no branch is spread over the branches in proportion, and said so on the
 page; people by the labour per piece on each branch */
 const T888 = transport888Core(), ourRefs = T888.ourRefs;
 const bump = (o, k, v) => { o[k] = r2((o[k] || 0) + v); };
 const tBy = Object.assign({}, T888.weights.toDate), cardBy = Object.assign({}, T888.weights.toCome); let tNone = T888.weights.toDateNone;""", 'fh866 transport weights')
s = cut(s, "const tdBy = {}; let tdNoBasis = 0;",
        "if (!noFig || ourRefs.has(a.key)) return; const T = assetTotal(a), cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc) bump(tdBy, b, cc); else tdNoBasis += noFig; });",
        """/* v8.88 - the demob legs are a cut of the P&L's transport figures, from the one transport model: what a demob load carries to
 date and what the P&L forecasts for it; a demob leg the P&L does not forecast is named below with the card's pickup leg it
 would cost, never added. A demob load with no branch is spread like the rest. */
 const tdBy = Object.keys(T888.demob.byKnown).length ? Object.assign({}, T888.demob.byKnown) : fh866Split(T888.demob.total, Object.keys(cardBy).length ? cardBy : (Object.keys(tBy).length ? tBy : labW));
 if (Object.keys(T888.demob.byKnown).length && T888.demob.total > r2(Object.values(T888.demob.byKnown).reduce((s, v) => s + v, 0))) Object.entries(fh866Split(r2(T888.demob.total - Object.values(T888.demob.byKnown).reduce((s, v) => s + v, 0)), T888.demob.byKnown)).forEach(([b, v]) => bump(tdBy, b, v));
 let tdNoBasis = T888.demob.noBasis;""", 'fh866 demob transport')
s = rep(s, "demobLoadsNoFigure: tdNoBasis, wagesUnpricedAfterEvent: r2(ldUnp),",
        "demobLoadsNoFigure: tdNoBasis, demobTransportNotInPl: T888.demob.notInPl, wagesUnpricedAfterEvent: r2(ldUnp),", 'fh866 return', str(p))
s = rep(s, "transport by each reference’s contract branch;wages and salary allowance to KINP Installation;",
        "transport by the branch on each load’s reference (a load with no branch spread over the branches in proportion — the Transport view lists them);wages and salary allowance to KINP Installation;", 'fh866 basis line', str(p))
s = rep(s, "${H.demobLoadsNoFigure ? ` ${esc(fmtNum(H.demobLoadsNoFigure))} demob loads carry no transport figure yet.` : ''}",
        "${H.demobLoadsNoFigure ? ` ${esc(fmtNum(H.demobLoadsNoFigure))} demob leg${H.demobLoadsNoFigure === 1 ? '' : 's'} carry no carrier, docket or figure and are not forecast in the P&amp;L yet${H.demobTransportNotInPl && H.demobTransportNotInPl.total ? ` — at the card’s transport cost, once a reference, they would be ${esc(money0(H.demobTransportNotInPl.total))} (${Object.entries(H.demobTransportNotInPl.by).map(([b, v]) => esc((b === '—' ? 'No branch' : b) + ' ' + money0(v))).join(' · ')}), not added until the rule is settled` : ''}.` : ''}", 'fh866 demob basis', str(p))

# 8. the one line on the P&L summary that says everything reconciles, under At a glance
s = rep(s, "${epScopeHtml870()}${cj765Glance()}", "${epScopeHtml870()}${cj765Glance()}${recon888Html()}", 'Everything reconciles line', str(p))

# 9. style and script. The model sits in the page's main script, just above moneySummary_, because the first draw calls
# moneySummary_ while the page is still being parsed (before any script at the end of the body has run); the view and the
# reconciliation line, drawn only on a render, go before the last </body> like every other release.
s = s.replace('</head>', '<style id="transport888-style">' + (here / 'transport888.css').read_text() + '</style>\n</head>', 1)
assert s.count('function moneySummary_(asOf){') == 1
s = s.replace('function moneySummary_(asOf){', '/* v8.88 transport model - transport888_model.js */\n' + (here / 'transport888_model.js').read_text() + '\nfunction moneySummary_(asOf){', 1)
js = (here / 'transport888_view.js').read_text()
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="transport888-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
print('v8.88 applied')
