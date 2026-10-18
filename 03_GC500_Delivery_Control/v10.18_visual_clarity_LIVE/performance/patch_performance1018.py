"""Author: Andrew Fisher. Event-driven master-plan overlay updates, preserving the established camera."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep


def apply(html):
    if 'function queueView1018()' in html:
        raise ValueError('Master-plan observer correction already applied')

    def once(old, new, label):
        nonlocal html
        html = rep(html, old, new, label, 'performance1018')

    once("  let status = 'loading', destroyed = false, lastView = '', keyGuard = null;",
         "  let status = 'loading', destroyed = false, lastView = '', keyGuard = null;\n"
         "  let viewSignal1018 = null, healthTimer1018 = 0, viewDirty1018 = false, viewChecks1018 = 0;",
         'Master-plan bounded observer state')
    once("   if (destroyed || status !== 'ready') return;\n   const s = state(), v = viewport(); if (!s || !s.view || !v) return;",
         "   if (destroyed || status !== 'ready') return;\n   viewChecks1018++;\n   const s = state(), v = viewport(); if (!s || !s.view || !v) return;",
         'Master-plan view measurement counter')
    before = """  function watch() {
   if (destroyed) return;
   if (!host.isConnected) { adapter.destroy(); return; }
   if (status === 'ready' && !alive()) { status = 'stale'; call('change'); }
if(!document.body.classList.contains('showing'))changed(false); tick = requestAnimationFrame(watch);
  }"""
    once(before, (HERE / 'masterplan_observer1018.js').read_text().rstrip(),
         'Only measure an embedded master plan after an actual view change')
    once("   iframe,\n   alive,\n   get ready() { return status === 'ready' && alive(); },",
         "   iframe,\n   alive,\n   rendering1018() { return {eventDriven:!!viewSignal1018,queued:!!tick,viewChecks:viewChecks1018,dirty:viewDirty1018}; },\n   get ready() { return status === 'ready' && alive(); },",
         'Read-only embedded-map observer diagnostics')
    once("    cancelAnimationFrame(tick); clearTimeout(deadline); clearInterval(checkTimer);",
         "    cancelAnimationFrame(tick); clearTimeout(deadline); clearInterval(checkTimer);\n"
         "    clearInterval(healthTimer1018); healthTimer1018 = 0;\n"
         "    if (viewSignal1018) {\n"
         "     if(win)win.removeEventListener('gc500viewchange1018',viewSignal1018);\n"
         "     document.removeEventListener('visibilitychange',viewSignal1018);\n"
         "     window.removeEventListener('resize',viewSignal1018); viewSignal1018 = null;\n"
         "    }",
         'Dispose every observer with its map')
    # Supplier branch validation needs customer charge lines. Feeding the supplier
    # overlay back through those same lines recursed until a swallowed RangeError.
    # Carry the existing base pricer explicitly; all rules, grades and unknown
    # branch fallbacks remain in the original shared readers.
    once('function allDockets(){', 'function allDockets(docketPricer1018=costDocket){',
         'Allow the source docket pricer to be passed through explicitly')
    once('Object.assign({}, d, {cost_total_build: d.cost_total}, costDocket(d),',
         'Object.assign({}, d, {cost_total_build: d.cost_total}, docketPricer1018(d),',
         'Committed docket uses the supplied pricer')
    once('return Object.assign({}, d, {week, programme_sheet: progSheet(week)}, costDocket(d),',
         'return Object.assign({}, d, {week, programme_sheet: progSheet(week)}, docketPricer1018(d),',
         'Local docket uses the supplied pricer')
    once('function docketCostLines(){', 'function docketCostLines(docketPricer1018){',
         'Carry the source docket pricer through charge lines')
    once("return allDockets().filter(d => d.usable && (d.cost_state === 'priced' || d.cost_state === 'partly priced') && (d.lines || []).length).map(d => {",
         "return allDockets(docketPricer1018).filter(d => d.usable && (d.cost_state === 'priced' || d.cost_state === 'partly priced') && (d.lines || []).length).map(d => {",
         'Read docket charges without a circular supplier lookup')
    once('function allCosts(){', 'function allCosts(docketPricer1018){',
         'Allow explicit source pricing in the existing ledger')
    once('const rec = docketCostLines().map(c => Object.assign(gradeCost(c),',
         'const rec = docketCostLines(docketPricer1018).map(c => Object.assign(gradeCost(c),',
         'Keep all ledger grading and allocations on their shared readers')
    once('function pl760FencingByBranch(){\n const by = {}; try { allCosts().filter',
         'function pl760FencingByBranch(costs1018){\n const by = {}; try { (costs1018 || allCosts()).filter',
         'Branch totals accept explicit source-priced charge lines')
    once('function pl760FencingBranch(){ const by = pl760FencingByBranch();',
         'function pl760FencingBranch(costs1018){ const by = pl760FencingByBranch(costs1018);',
         'Preserve the exact existing branch selection and unknown handling')
    once('branch:pl760FencingBranch()});RENDER_MEMO.set(cache,result);return result;',
         'branch:pl760FencingBranch(allCosts(supplierBaseDocket1014))});RENDER_MEMO.set(cache,result);return result;',
         'Validate supplier allocation from source charges without re-entering its overlay')
    once('function gcModel925(a,options){const result=model925(a,nativeEnv925(options));return window.VmsAssignment1016?VmsAssignment1016.model(a,result):result;}',
         (HERE / 'unit_projection1018.js').read_text().rstrip(),
         'Reuse immutable identity computation within one draw, returning fresh projections')
    return html
