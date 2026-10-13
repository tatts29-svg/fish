"""Author: Andrew Fisher. Progress precision only; quantities and money stay unchanged."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep


def apply(html):
    if 'ProgressPercent1012' in html:
        raise ValueError('Progress precision patch already applied')
    if 'const Where885=(()=>{' not in html or 'FinancialScopes1011' not in html:
        raise ValueError('Requires the reviewed v10.11 calculation and progress models')

    def change(old, new, label):
        nonlocal html
        html = rep(html, old, new, label, 'v10.12')

    def in_function(name, old, new, label):
        start = html.index('function ' + name + '(')
        end = html.index('\n}', start) + 2
        original = html[start:end]
        change(original, rep(original, old, new, label, 'v10.12'), label)

    change('function todayWorkMetrics840(asOf) {',
           (HERE / 'percentage1012.js').read_text() + '\nfunction todayWorkMetrics840(asOf) {',
           'Shared percentage precision helper')
    change('area.pct = area.total > 0 && !area.shortConflictRefs ? round(done / area.total * 100) : null;',
           'area.pct = area.total > 0 && !area.shortConflictRefs ? ProgressPercent1012.ratio(done, area.total) : null;',
           'Raw equipment category percentages')
    change("const pct = area.id !== 'fencing' && total > 0 && done != null ? lowerBound ? lowerPct(done, total) : round(done / total * 100) : null;",
           "const pct = area.id !== 'fencing' && total > 0 && done != null ? ProgressPercent1012.ratio(done, total) : null;",
           'Raw category and per-type completion ratios')
    change('const pct = total > 0 && done != null ? round(done / total * 100) : null;',
           'const pct = total > 0 && done != null ? ProgressPercent1012.ratio(done, total) : null;',
           'Raw source work percentage')
    in_function('todayWorkSummary848', 'const pct = !row.classificationPending && total > 0 && done != null ? round(done / total * 100) : null;',
           'const pct = !row.classificationPending && total > 0 && done != null ? ProgressPercent1012.ratio(done, total) : null;',
           'Raw current fencing type percentage')
    change('pct: pct == null ? null : (review ? Math.floor(pct * 100) : Math.round(pct * 100)) / 100};',
           'pct: valid ? ProgressPercent1012.ratio(credited, confirmation.towers) : null};',
           'Raw confirmed lighting scope percentage')
    change('// Floor the conservative bound so rounding cannot light an unreached milestone.',
           '// Raw bounds decide milestones; conservative rounding happens only in the display.',
           'Document raw milestone decisions')
    change('const lowerPct = Math.floor((low / total * 100 + 1e-9) * 100) / 100;\n  result.lampPct = lowerPct;\n  result.pct = {min:lowerPct,max:round(high/total*100)};\n  if (Math.abs(low-high) < 0.005) result.pct.min = result.pct.max;',
           'const lowerPct = ProgressPercent1012.ratio(low, total);\n  result.lampPct = lowerPct;\n  result.pct = {min:lowerPct,max:ProgressPercent1012.ratio(high, total)};\n  result.scopeComplete1012 = ProgressPercent1012.complete(low,total) && ProgressPercent1012.complete(high,total);',
           'Retain raw fencing bounds and exact credited-scope completion')
    change("row.pctKind=Number.isFinite(row.pct)?'provisional-scope':row.pctKind;\n row.pctLabel='Complete against schedule · provisional scope';",
           "row.pctKind=Number.isFinite(row.pct)&&row.pctKind!=='lower-bound'?'provisional-scope':row.pctKind;\n row.pctLabel=(row.pctKind==='lower-bound'?'At least complete':'Complete')+' against schedule · provisional scope';",
           'Preserve completion uncertainty when annotating provisional VMS scope')
    change("return format(kind === 'lower-bound' ? Math.floor((bounded + 1e-9) * 100) / 100 : bounded);",
           "return ProgressPercent1012.text(bounded,kind === 'lower-bound');",
           'Category and per-type percentage display')
    change('const low = format(range.min), high = format(range.max);',
           "const low = mode === 'pct' ? ProgressPercent1012.text(range.min,true) : format(range.min), high = mode === 'pct' ? ProgressPercent1012.text(range.max) : format(range.max);",
           'Fencing percentage ranges remain separate from quantity formatting')
    change("const text = format(value) + (mode === 'pct' && number(value) ? '%' : '');",
           "const text = (mode === 'pct' ? ProgressPercent1012.text(value) : format(value)) + (mode === 'pct' && number(value) ? '%' : '');",
           'Fencing type percentage display')
    change("function overallRange853(value, suffix) {\n    if (number(value)) return format(value) + (suffix || '');\n    if (!value || !number(value.min) || !number(value.max)) return '—';\n    return format(value.min) + (value.max !== value.min ? '–' + format(value.max) : '') + (suffix || '');\n  }",
           "function overallRange853(value, suffix, percentage1012) {\n    const percent = suffix === '%' || percentage1012, show = n => percent ? ProgressPercent1012.text(n) : format(n);\n    if (number(value)) return show(value) + (suffix || '');\n    if (!value || !number(value.min) || !number(value.max)) return '—';\n    const ranged = value.max !== value.min, low = percent && ranged ? ProgressPercent1012.text(value.min,true) : show(value.min);\n    return low + (ranged ? '–' + show(value.max) : '') + (suffix || '');\n  }",
           'Fencing overall percentages do not round incomplete work to 100')
    change('known ? overallRange853(model.pct) :',
           "known ? overallRange853(model.pct,'',true) :",
           'Visible fencing headline uses percentage formatting')
    change("const fmt=n=>number(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';",
           'const fmt=n=>ProgressPercent1012.text(n);',
           'Where we are percentage display')
    change("const atLeast=n=>Math.floor((n+1e-9)*100)/100;",
           'const atLeast=n=>ProgressPercent1012.display(n,true);',
           'Conservative lower-bound display')
    change('const bound=number(max)&&max-min>.005,value=bound?atLeast(min):min;',
           'const bound=number(max)&&max>min,value=bound?atLeast(min):min;',
           'Retain a real percentage range even when its width is under one display step')
    change("provisional:!!f.provisional,basis:'Programme work metres recorded'",
           "provisional:!!f.provisional,scopeComplete1012:f.scopeComplete1012===true,basis:'Programme work metres recorded'",
           'Pass exact fencing completion into the category index')
    change("provisional:lower||!!x?.reviewQuantity||!!x?.unquantifiedRefs||!!x?.scopeProvisional960,basis:",
           "provisional:lower||!!x?.reviewQuantity||!!x?.unquantifiedRefs||!!x?.scopeProvisional960,scopeComplete1012:known&&!lower&&ProgressPercent1012.complete(x?.done,x?.total),basis:",
           'Category completion follows raw done and scope quantities')
    change('const pct=ready?{min:rows.reduce((n,r)=>n+r.min,0)/7,max:rows.reduce((n,r)=>n+r.max,0)/7}:null;',
           'const pct=ready?{min:ProgressPercent1012.mean(rows.map(r=>r.min)),max:ProgressPercent1012.mean(rows.map(r=>r.max))}:null;',
           'Retain incomplete status through seven-category arithmetic')
    change("const provisional=rows.some(r=>r.provisional)||!!s.health?.stale;\n return {day,rows,ready,pct,provisional,reached:ready?Math.min(pct.min===100&&!provisional?5:4,Math.floor(pct.min/20)):0,allGreen:ready&&pct.min===100&&pct.max===100&&!provisional,",
           "const provisional=rows.some(r=>r.provisional)||!!s.health?.stale;\n const complete1012=ready&&!provisional&&rows.every(r=>r.scopeComplete1012===true);\n return {day,rows,ready,pct,provisional,reached:ready?Math.min(complete1012&&pct.min===100?5:4,Math.floor(pct.min/20)):0,allGreen:complete1012&&pct.min===100&&pct.max===100,",
           'Five green lights require verified raw scope completion')
    change('done=x.value===100&&!x.bound&&!r.provisional;',
           'done=r.scopeComplete1012===true&&x.value===100&&!x.bound&&!r.provisional;',
           'Category chip completion follows the same raw scope decision')
    change("const pctText = n => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)).toLocaleString('en-AU', {maximumFractionDigits: 2}) : '—';",
           "const pctText = n => typeof n === 'number' && Number.isFinite(n) ? ProgressPercent1012.text(Math.max(0, Math.min(100, n))) : '—';",
           'Lighting scope caption percentage display')
    change("const bound=p.pct.max-p.pct.min>.005,percent=bound?Math.floor((p.pct.min+1e-9)*100)/100:p.pct.min;\n return {past:true,percent,bound,text:percent.toLocaleString('en-AU',{maximumFractionDigits:2}),complete:",
           "const bound=p.pct.max>p.pct.min,percent=bound?ProgressPercent1012.display(p.pct.min,true):p.pct.min;\n return {past:true,percent,bound,text:ProgressPercent1012.text(percent,bound),complete:",
           'Past Build card percentage matches current precise progress')
    return html
