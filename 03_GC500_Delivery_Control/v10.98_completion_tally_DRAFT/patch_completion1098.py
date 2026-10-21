"""Author: Andrew Fisher. Completion-only scope, supplied through private build input."""
import json
import os
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def require(ok, message):
    if not ok:
        raise ValueError(message)


def validate(scope, assets):
    require(isinstance(scope, dict) and set(scope) == {'schema', 'excluded_references'} and scope['schema'] == 1,
            'completion scope must declare schema 1 and excluded references only')
    refs = scope['excluded_references']
    require(isinstance(refs, list) and all(isinstance(x, str) and re.fullmatch(r'[A-Z][A-Z0-9_-]{0,31}', x) for x in refs),
            'completion references must be a list of canonical ids')
    require(len(refs) == len(set(refs)), 'completion references must be unique')
    for ref in refs:
        matches = [a for a in assets if a.get('key') == ref]
        require(len(matches) == 1 and matches[0].get('product') == 'WFB',
                'this completion-only change supports existing water-barrier references only')


def patch(text, scope=None):
    require('CompletionScope1098' not in text, 'completion scope patch is already applied')
    require('var SVC1067_DATA=' in text and 'showcase1090-script' in text and 'wfbNotes1030' in text,
            'completion scope requires the current servicing, showcase and water-barrier base')
    marker = 'const DATA = '
    require(text.count(marker) == 1, 'one native data source is required')
    data, _ = json.JSONDecoder().raw_decode(text[text.index(marker) + len(marker):])
    if scope is None:
        require(bool(os.environ.get('GC500_COMPLETION_SCOPE_JSON')), 'set the private completion scope path')
        scope = json.loads(Path(os.environ['GC500_COMPLETION_SCOPE_JSON']).read_text())
    validate(scope, data['assets'])
    encoded = json.dumps(scope, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    source = (HERE / 'completion1098_src.js').read_text().replace('COMPLETION_SCOPE1098_DATA', encoded)
    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, str(HERE))
    change('function todayWorkMetrics840(asOf) {', source + '\nfunction todayWorkMetrics840(asOf) {', 'shared completion scope')
    change('const members = live.filter(a => groupOf(a) === def.group);', '''const members1098 = live.filter(a => groupOf(a) === def.group);
    const members = members1098.filter(a => CompletionScope1098.includes(a));
    const omitted1098 = members1098.filter(a => !CompletionScope1098.includes(a));
    if (omitted1098.length) {
      area.completionExcluded1098 = omitted1098.map(a => a.key);
      area.notes.push(CompletionScope1098.note(omitted1098));
    }''', 'headline completion membership')
    change('area.totalRefs = area.rows.length;', '''if (area.completionExcluded1098) {
      const order1098 = new Map(members1098.map((a,i)=>[a.key,i]));
      area.completionPlanRows1098 = area.rows.concat(area.completionExcluded1098.map(key => ({key}))).sort((a,b)=>order1098.get(a.key)-order1098.get(b.key));
    }
    area.totalRefs = area.rows.length;''', 'retain full arrival plan')
    change('for (const row of area.rows || []) {', 'for (const row of area.completionPlanRows1098 || area.rows || []) {', 'arrival plan uses actual full scope')
    change('const shorts = typeof shortOf === \'function\' ? shortOf(r.a) : [];', '''const shorts = typeof shortOf === 'function' ? shortOf(r.a) : [];
      const counted1098 = CompletionScope1098.includes(r.a);''', 'type completion membership')
    change('quantityKnown: true, completionKnown: true, noQuantityLines: 0, keys: [], issues: [],',
           'quantityKnown: true, completionQuantityKnown1098: true, completionKnown: true, noQuantityLines: 0, keys: [], excludedReferences1098: [], issues: [],',
           'separate schedule and completion knowledge')
    change('''type.knownQuantity += quantity;
        type.quantityKnown = type.quantityKnown && known;
        type.completionKnown = type.completionKnown && physicalUnitKnown && !conflict && (!r.d.done || known);
if (toilet962) type.knownComplete += toilet962.done;
        else if (r.d.done && !conflict) type.knownComplete += Math.max(0, quantity - (split900g && split900g.items.get(item) || 0));
        type.noQuantityLines += lines.filter(l => l.quantity == null).length;''', '''type.quantityKnown = type.quantityKnown && known;
        if (counted1098) {
          type.knownQuantity += quantity;
          type.completionQuantityKnown1098 = type.completionQuantityKnown1098 && known;
          type.completionKnown = type.completionKnown && physicalUnitKnown && !conflict && (!r.d.done || known);
          if (toilet962) type.knownComplete += toilet962.done;
          else if (r.d.done && !conflict) type.knownComplete += Math.max(0, quantity - (split900g && split900g.items.get(item) || 0));
          type.noQuantityLines += lines.filter(l => l.quantity == null).length;
        } else if (!type.excludedReferences1098.includes(r.a.key)) type.excludedReferences1098.push(r.a.key);''', 'type completion quantities only')
    change('t.remaining = t.quantityKnown && t.completionKnown ? round(Math.max(0, t.knownQuantity - t.knownComplete)) : null;',
           '''t.remaining = t.completionQuantityKnown1098 && t.completionKnown ? round(Math.max(0, t.knownQuantity - t.knownComplete)) : null;
      if (t.excludedReferences1098.length) t.issues.push(CompletionScope1098.note(t.excludedReferences1098));''', 'remaining completion scope')
    change('for (const key of keys) {\n          const native = nativeRows.get(key);',
           'for (const key of keys) {\n          if (!CompletionScope1098.includes(key)) continue;\n          const native = nativeRows.get(key);', 'type instrument completion rows')
    change('const total = unitKnown && type.quantityKnown && knownTotal != null ? knownTotal : null;',
           'const total = unitKnown && (type.completionQuantityKnown1098 ?? type.quantityKnown) && knownTotal != null ? knownTotal : null;', 'type completion denominator')
    change('total, knownTotal, done, rows, shortConflictRefs: rows.filter(row => row.conflict).length,',
           '''total, knownTotal, done, rows,
          ...(type.excludedReferences1098?.length ? {completionPlanRows1098:rows.concat(type.excludedReferences1098.map(key=>({key}))).sort((a,b)=>keys.indexOf(a.key)-keys.indexOf(b.key))} : {}),
          shortConflictRefs: rows.filter(row => row.conflict).length,''', 'type arrival plan retains excluded references')
    change('''const known = type.quantityKnown && type.completionKnown && number(type.total) && type.total > 0 && number(type.complete);
      const percentage = known ? format(Math.min(100, type.complete / type.total * 100)) + '% complete' : 'Completion percentage unconfirmed';''', '''const completionTotal1098 = type.excludedReferences1098?.length ? type.knownQuantity : type.total;
      const known = (type.completionQuantityKnown1098 ?? type.quantityKnown) && type.completionKnown && number(completionTotal1098) && completionTotal1098 > 0 && number(type.complete);
      const percentage = known ? format(Math.min(100, type.complete / completionTotal1098 * 100)) + '% complete' : 'Completion percentage unconfirmed';''', 'fallback completion percentage')
    change("groupReading('Total', type.total, '', 'total') + groupReading('On site', type.onSite, '', 'onSite')",
           "groupReading(type.excludedReferences1098?.length ? 'Schedule total' : 'Total', type.total, '', 'total') + (type.excludedReferences1098?.length ? groupReading('Completion scope', completionTotal1098, '', 'completionScope') : '') + groupReading('On site', type.onSite, '', 'onSite')", 'fallback separates schedule and completion totals')
    # Only the global completion numerator and denominator change. Arrival, levelling
    # and step readings retain the full native tally even for unusual source records.
    change('return model({day,health,areas,toiletArrived:arrivalKnown?arrived:null,tally:lightTally(active,day),',
           '''const completionTally1098 = lightTally(active.filter(a=>CompletionScope1098.includes(a)),day);
  const tally1098 = {...lightTally(active,day),done:completionTally1098.done,total:completionTally1098.total};
  return model({day,health,areas,toiletArrived:arrivalKnown?arrived:null,tally:tally1098,''', 'showcase completion summary')
    change("+' active references ticked complete</small></div>'+", "+' references counted for completion</small></div>'+", 'showcase completion scope label')
    change("function refsOf(a){ const seen = new Set(); return (a.rows || []).map(r => r && r.key)",
           "function refsOf(a){ const seen = new Set(); return (a.completionPlanRows1098 || a.rows || []).map(r => r && r.key)", 'milestone full factual reference list')
    change('const refs = refsOf(A), raw = S.delivery || {};',
           'const refs = refsOf(A), completionRefs1098 = refs.filter(a=>CompletionScope1098.includes(a)), raw = S.delivery || {};', 'milestone separates completion membership')
    change("if (d.done) doneNow++; if (d.recorded && (d.state === 'on site' || d.done)) onNow++;",
           "if (d.done && CompletionScope1098.includes(a)) doneNow++; if (d.recorded && (d.state === 'on site' || d.done)) onNow++;", 'milestone complete and onsite counts')
    change('if (ons.length) { const last = ons[ons.length - 1]; complete.push',
           'if (ons.length && CompletionScope1098.includes(a)) { const last = ons[ons.length - 1]; complete.push', 'milestone counted completion history')
    change('else if (d.done && r.done_at && dayOf(r.done_at) <= asOf) { complete.push',
           'else if (d.done && r.done_at && dayOf(r.done_at) <= asOf && CompletionScope1098.includes(a)) { complete.push', 'milestone counted completion fallback')
    change('const total = refs.length, units = {done: A.done, total: A.total, left: A.remaining};',
           'const total = completionRefs1098.length, units = {done: A.done, total: A.total, left: A.remaining};', 'milestone completion denominator')
    change('return {id: A.id, name: A.name, group: A.groupName, unit: A.unit, slug: A.id, asOf, total, complete: doneNow, onsite: onNow, units, pct:',
           'return {id: A.id, name: A.name, group: A.groupName, unit: A.unit, slug: A.id, asOf, total, ...(refs.length!==total?{recordTotal1098:refs.length}:{}), complete: doneNow, onsite: onNow, units, pct:', 'milestone actual record denominator')
    change("['References', `${f.total} on the job · ${f.onsite} on site · ${f.complete} complete`],", '''['References', `${f.recordTotal1098 || f.total} on the job · ${f.onsite} on site${f.recordTotal1098 ? '' : ' · ' + f.complete + ' complete'}`],
  ...(f.recordTotal1098 ? [['Completion scope', `${f.complete} of ${f.total} references complete`]] : []),''', 'milestone labels preserve full site facts')
    start, end = text.index('function factsRows(f){'), text.index('function areaHtml(f, o){')
    original = text[start:end]
    updated = original
    for field in ('levelled', 'steps', 'numbered', 'withAcc'):
        label = '${f.' + field + '} of ${f.total}'
        require(original.count(label) == 1, 'milestone factual denominator changed')
        updated = updated.replace(label, '${f.' + field + '} of ${f.recordTotal1098 || f.total}')
    change(original, updated, 'milestone setup fact denominators')
    return text


if __name__ == '__main__':
    require(len(sys.argv) == 2, 'usage: patch_completion1098.py PAGE')
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text()))
