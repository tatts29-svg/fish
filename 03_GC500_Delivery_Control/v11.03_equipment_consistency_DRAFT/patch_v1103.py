"""Author: Andrew Fisher. Read-only equipment lists, completion and board location captions."""
import hashlib
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / 'toolchain'))
from rep import rep

BASE_SHA256 = '4b1ee468727cb98b3c52f751c77ce6d4b0258b7dca32c14b40c1ae41a95bcfd5'


def patch(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v11.03 requires the exact verified v11.02 predecessor')
    if 'data-equipment-progress1103' in text:
        raise ValueError('equipment consistency patch already installed')
    original = text

    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, 'page')

    modules = ['equipmentProgress1103_src.js', 'milestoneProgress1103_src.js', 'vmsLocationWords1103_src.js',
               'vmsEquipment1103_src.js', 'additionalEquipment1103_src.js']
    change('function inventory(){', '\n'.join((HERE / f).read_text() for f in modules) +
           '\nfunction inventory(){', 'shared read-only equipment projections')

    change("function plantTable(group, list){\n if (!list.length) return '';",
           "function plantTable(group, list){\n if (group === 'VMS boards') return VmsEquipment1103.equipmentHtml(todayIso(), {q: state.q, light: state.light});\n if (!list.length) return '';",
           'physical boards in Equipment without invented delivery references')
    change(" const items = list.flatMap(a => itemRows(a));\n const done = items.filter(r => r.state !== 'not recorded').length;\n const pct = items.length ? Math.round(done / items.length * 100) : 0;",
           " const progress1103 = EquipmentProgress1103.model(group, list, {day: todayIso(), filtered: !!(state.light || String(state.q || '').trim())});",
           'quantity completion replaces description-entry percentage')
    start = text.index(' <div class="prog" role="img" aria-label="${esc(done)} of ${esc(items.length)} asked-for item lines recorded as supplied">')
    end = text.index('\n ${state.plantView', start)
    change(text[start:end], ' ${EquipmentProgress1103.html(progress1103)}', 'completion meter with shared scope')
    change(" const words = `${n} reference${n === 1 ? '' : 's'}${one ? '' : ' across ' + tables.length + ' trades'}${prog ? ' · ' + prog : ''} · lights, dates, asset numbers, contracts, asked and supplied`;",
           " const scope1103 = one && state.plantGroup === 'Lighting towers' ? (tables[0]?.querySelector('[data-equipment-scope1103]')?.textContent || '') : '';\n const words = `${n} reference${n === 1 ? '' : 's'}${one ? '' : ' across ' + tables.length + ' trades'}${prog ? ' · ' + prog : ''}${scope1103 ? ' · ' + scope1103 : ''} · lights, dates, asset numbers, contracts, asked and supplied`;",
           'keep planned lighting scope and recorded surplus visible')
    change("const refs = eq796Fold('Every reference', words, keep.concat(tables)); refs.classList.add('eqrefs');",
           "const refs = eq796Fold('Every reference', words, keep.concat(tables)); refs.classList.add('eqrefs');\n if (one && prog) refs.querySelector('summary > span').setAttribute('data-equipment-progress1103', '');",
           'identify visible folded completion summary')

    # The saved pin and every existing navigation payload stay unchanged. Only
    # the caption of the superseded planned position is qualified.
    change('<div><h3>${esc(b.title)}</h3><p class="sub">${esc(phaseWord(b))}',
           '<div><h3>${esc(VmsLocationWords1103.title(b, p))}</h3><p class="sub">${esc(phaseWord(b))}',
           'board card current location title')
    change('iEDM VMS plan, page ${esc(b.page)} · red dot = position, photo = the spot',
           'iEDM VMS plan, page ${esc(b.page)} · ${esc(VmsLocationWords1103.crop(b, p))}',
           'board card original plan caption')
    change('<span>In place as drawn${r.inPlace ?',
           '<span>${esc(VmsLocationWords1103.placed(b, p))}${r.inPlace ?', 'board current pin placement wording')
    change('Position basis: ${esc(b.basis)}.${b.board_basis ?',
           'Position basis: ${esc(VmsLocationWords1103.basis(b, p))}.${b.board_basis ?',
           'preserve original plan title as historical basis')
    change('<p class="v-title"><span class="v-no">${esc(label(b))}</span> &nbsp;${esc(b.title)}</p>',
           '<p class="v-title"><span class="v-no">${esc(label(b))}</span> &nbsp;${esc(VmsLocationWords1103.title(b, p))}</p>',
           'printed board current location title')
    old_caption = '<figcaption>iEDM VMS plan \\u00b7 red dot = the position \\u00b7 photo = the spot</figcaption>'
    new_caption = '<figcaption>iEDM VMS plan · ${esc(VmsLocationWords1103.crop(b, p))}</figcaption>'
    # There are exactly two distinct live/fallback branches; replace their
    # complete statement, not an unconstrained repeated fragment.
    start = text.index(' <div class="v-pics${live ?')
    end = text.index('\n  <div class="v-k">', start)
    span = text[start:end]
    if span.count(old_caption) != 2:
        raise ValueError('expected both live and fallback printed plan captions')
    change(span, span.replace(old_caption, new_caption), 'print plan captions')
    change('<div><b>IN PLACE AS DRAWN</b><span>${r.inPlace ?',
           '<div><b>${esc(VmsLocationWords1103.placed(b, p).toUpperCase())}</b><span>${r.inPlace ?',
           'printed board placement wording')

    # VMS and additional equipment integration follows below.
    text = integrate_equipment(text)
    change('const total = completionRefs1098.length, units = {done: A.done, total: A.total, left: A.remaining};',
           'const progress1103 = MilestoneProgress1103.read(A, asOf), total = completionRefs1098.length, units = {done: progress1103.done, total: progress1103.total, left: progress1103.left};',
           'milestone uses qualified completion scope')
    change('const reached = A.total > 0 && A.done === A.total && !(A.remaining > 0) && total >= MIN_REFS && doneNow === total;',
           'const reached = progress1103.confirmedComplete && total >= MIN_REFS && doneNow === total;',
           'milestone cannot celebrate unknown or rounded incomplete progress')
    change('pct: Math.round(Number(A.pct) || 0), reached,',
           'pct: progress1103.pct, pctLabel1103: progress1103.label, progress1103, reached,',
           'milestone percentage preserves unknown and lower bounds')
    start = text.index('/* Author: Andrew Fisher. Milestones (v10.25):')
    end = text.index('</script>', start)
    source = text[start:end]
    if source.count('${f.pct}%') != 3:
        raise ValueError('expected three milestone screen and print percentages')
    fixed = source.replace('${f.pct}%', '${esc(f.pctLabel1103)}').replace('${esc(f.pctLabel1103)} complete', '${esc(f.pctLabel1103)}')
    fixed = fixed.replace('(a.completionPlanRows1098 || a.rows || [])', '(a.completionPlanRows1098 || a.sourceRows1103 || a.rows || [])')
    change(source, fixed, 'same qualified milestone percentage in screen and A4; preserve linked history')
    change('${f.units.done} of ${f.units.total} ${esc(f.unit || \'\')} done · ${f.units.left || 0} left',
           '${esc(MilestoneProgress1103.unitsText(f))}', 'unknown milestone quantity is not zero remaining')
    change("${f.units && f.units.total ? f.units.done + ' of ' + f.units.total + (f.unit ? ' ' + esc(f.unit) : '') : f.complete + ' of ' + f.total} complete${f.reached && f.reachedAt",
           '${esc(MilestoneProgress1103.summaryText(f))}${f.reached && f.reachedAt', 'qualified milestone summary quantities')
    change("not there yet — ${(f.total - f.complete) || (f.units && f.units.left ? f.units.left + (f.unit ? ' ' + f.unit : '') : 0)} to go",
           '${esc(MilestoneProgress1103.remainingText(f))}', 'milestone unknown remaining text')
    change(":' — ' + ((f.total - f.complete) || (f.units && f.units.left ? f.units.left + (f.unit ? ' ' + f.unit : '') : 0)) + ' to go'",
           ":' — ' + esc(MilestoneProgress1103.remainingText(f))", 'printed milestone unknown remaining text')
    end = text.rindex('</script>')
    start = text.rindex('<script', 0, end)
    late_script = text[start:end]
    change(late_script, late_script + '\n' + (HERE / 'dayRefresh1103_src.js').read_text() + '\n',
           'refresh automatic current-day views after date rollover or wake')
    change("+' · v11.02'; /* v8.19 release922", "+' · v11.03'; /* v8.19 release922", 'release footer')

    for begin, end in [
        ('var SvcState =', 'module.exports = SvcState;'),
        ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
        ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
        ('function write(pos, patch, what){', '/* --------------------------------------------------------------------------------------------------------- the tab */'),
    ]:
        def span(value):
            start = value.index(begin)
            stop = value.index(end, start) + len(end)
            return value[start:stop]
        if span(text) != span(original):
            raise ValueError('protected state, service data, geometry or native board save changed')
    if len(re.findall(r'<script\b', text)) != len(re.findall(r'<script\b', original)):
        raise ValueError('unexpected script boundary change')
    return text


def integrate_equipment(text):
    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, 'page')

    change('const inventoryBefore=inventory;inventory=function(){return inventoryProjection(inventoryBefore.apply(this,arguments),count(todayIso()));};',
           '''const inventoryBefore=inventory;inventory=function(){const I=inventoryBefore.apply(this,arguments);return VmsEquipment1103.inventoryProjection(I,VmsEquipment1103.model(I.td));};
const outstandingBefore1103=Inventory1017.outstanding;
Inventory1017.outstanding=function(I,disc,noFallback){
 const sources=new Set((I?.list||[]).filter(r=>r.vmsBoards1103).flatMap(r=>Object.keys(r.sourceRefs1103||{})));
 const sourceI={...I,list:VmsEquipment1103.financialRows(I?.list||[])};
 const rest=outstandingBefore1103.call(this,sourceI,disc,noFallback).filter(e=>!sources.has(e.key||e.a?.key));
 return rest.concat(VmsEquipment1103.outstanding(I,disc)).sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999'))||String(a.key||a.a?.key||'').localeCompare(String(b.key||b.a?.key||''),undefined,{numeric:true}));
};
VmsEquipment1103.bind(document);''', 'canonical inventory board rows and pending list')
    change('function inv83Money(rows){\n const out',
           'function inv83Money(rows){\n rows = VmsEquipment1103.financialRows(rows);\n const out',
           'retain real financial delivery associations')
    change("function invDrillHtml(I){\n const D = INV.drill; if (!D) return '';",
           "function invDrillHtml(I){\n const D = INV.drill; if (!D) return '';\n const boardHtml1103 = VmsEquipment1103.drillHtml(I, D); if (boardHtml1103 !== null) return boardHtml1103;",
           'board-aware inventory drill actions')
    change('function inv87Refs(r){\n const xs',
           'function inv87Refs(r){\n const boardHtml1103 = VmsEquipment1103.remainingHtml(r); if (boardHtml1103 !== null) return boardHtml1103;\n const xs',
           'pending inventory count names the actual board')
    change('function inv87Line(e, due){\n const F',
           'function inv87Line(e, due){\n if (e.vmsBoard1103) return VmsEquipment1103.outstandingHtml(e, false);\n const F',
           'pending screen line uses native board actions')
    change("${lightBar(shown.flatMap(([, list]) => list).filter(a => !q || matches(a, q)))}",
           "${only === 'VMS boards' ? VmsEquipment1103.lightBar(todayIso(), {q: state.q, light: state.light}) : lightBar(shown.flatMap(([, list]) => list).filter(a => !q || matches(a, q)))}",
           'VMS traffic-light filters use the same physical boards')
    change(' const card = e => { const F = inv87Facts(e),',
           ' const card = e => { if (e.vmsBoard1103) return VmsEquipment1103.outstandingHtml(e, true); const F = inv87Facts(e),',
           'pending print card uses actual board identity and directions')
    change('if (vms1076) { knownTotal = vms1076.total;',
           "if (vms1076) { area.sourceRows1103 = area.rows; area.rows = VmsEquipment1103.todayRows(day); area.totalRefs = area.rows.length; area.completeRefs = area.rows.filter(r=>r.complete).length; area.unknownQuantityRefs = 0; area.shortConflictRefs = 0; area.unrecordedRefs = area.rows.filter(r=>!r.board1103.recorded).length; knownTotal = vms1076.total;",
           'Today breakdown includes every physical board once')
    change("  const onsitePlan = area => {\n    const plan = noPlan('references', onsiteBasis, 'On-site plan unavailable');",
           "  const onsitePlan = area => {\n    if (health.ready && area.id === 'vms') return VmsEquipment1103.plan(day);\n    const plan = noPlan('references', onsiteBasis, 'On-site plan unavailable');",
           'board plan avoids treating physical board keys as delivery references')
    change('        sourceIds.push(id);\n        const unitKnown',
           '''        sourceIds.push(id);
        if (cardId === 'vms' && group.name === 'VMS boards' && (group.types || []).length === 1) {
          const boardType1103 = VmsEquipment1103.typeProjection({id, kind:'asset-type', cardId, groupId:group.id, groupName:group.name, name:type.name, unit:'boards', sourceType:type, scheduleTotal:type.total, drilldown:{tab:'plant',group:group.name}}, day);
          result.byCard.vms.push(boardType1103); result.instruments.push(boardType1103); continue;
        }
        const unitKnown''', 'Today exact-type model uses the same physical board rows')
    change('    const keys = [...new Set(rows.map(row => row.key).filter(Boolean))];\n    const linked = todayLinkedReferences844',
           '    const keys = [...new Set(rows.filter(row => !row.vmsBoard1103).map(row => row.key).filter(Boolean))];\n    const linked = todayLinkedReferences844',
           'board keys never enter the asset-reference lookup')
    change("      if (!row.key) return '<div class=\"tw840-detail-row\">",
           "      if (row.vmsBoard1103) return VmsEquipment1103.todayRowHtml(row, mode);\n      if (!row.key) return '<div class=\"tw840-detail-row\">", 'board-aware Today detail renderer')
    change("const action = target.closest('[data-tw840-close],[data-tw840-reference],[data-tw840-destination],[data-tw844-action],[data-tw844-source-action]');",
           "const action = target.closest('[data-tw840-close],[data-tw840-reference],[data-tw840-destination],[data-tw844-action],[data-tw844-source-action],[data-vms-open1103]');", 'Today native modal recognises board action')
    change("        if (action.hasAttribute('data-tw840-reference')) openAsset(action.dataset.tw840Reference);\n        else navigate(action);",
           "        if (action.hasAttribute('data-vms-open1103')) VmsEquipment1103.open(action.dataset.vmsOpen1103, action.dataset.vmsPos1103);\n        else if (action.hasAttribute('data-tw840-reference')) openAsset(action.dataset.tw840Reference);\n        else navigate(action);", 'close Today modal before opening the actual board card')
    change(" const n = (state.list || []).length, prog = one && tables[0] ?",
           " const n = one && state.plantGroup === 'VMS boards' ? VmsEquipment1103.filteredBoards(todayIso(), {q:state.q,light:state.light}).length : (state.list || []).length, prog = one && tables[0] ?", 'VMS folded summary counts boards including unlinked arrivals')
    change("const words = `${n} reference${n === 1 ? '' : 's'}${one ? '' : ' across ' + tables.length + ' trades'}",
           "const words = `${n} ${one && state.plantGroup === 'VMS boards' ? 'board' : 'reference'}${n === 1 ? '' : 's'}${one ? '' : ' across ' + tables.length + ' trades'}", 'VMS physical-board summary wording')
    # Retire historical description-field coverage from the completion view.
    start = text.index(' <p class="norate">As at the last update of this page: <b>${cs.items_recorded_as_supplied')
    end = text.index('</p>', start) + 4
    change(text[start:end], '', 'remove stale historical supplied-description coverage from Equipment')
    return text


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text()), encoding='utf-8')
