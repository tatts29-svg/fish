#!/usr/bin/env python3
"""v6.81 (DRAFT - not live until Andrew says yes) - fixes from the deep check of v6.80, 26 Sep 2026.

  M1  labour plan: ticked labour on relocated or moved units gets its own row, so the rows add to the Charged total
  M2  Questions: an answer stays with its question when the list above it changes (ids no longer by position)
  M3  running sheet: typing a break or one time no longer wipes hours typed without times
  M4  running sheet: clearing a night's amount removes the night (as meals already did)
  L5  add person: "aaron.zelvis" is the same person as "Aaron Zelvis" (no silent type change)
  L6  a start equal to the finish is not a 24-hour shift
  L7  a pay rate that is not a number, or is below nought, is ignored (and refused when typed)
  L8  a break as long as the shift pays nought, not the whole shift
  L9  "salaried" reads as Salary; people with no type are pointed out on the sheet
  L10 hours on the sheet shown to two decimals, so the x1.5 and x2 cells add to the paid hours
  L11 the hours rule quoted on Costs is the running sheet's (editable) rule, CNA and labour hire both
  L12 the running totals leave out the same unusable lines Costs leaves out

Applied after patch_v680.py.   python3 patch_v681.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    # M1
    t = R("""try { const ml = moneySummary(td).charge.labour; if (typeof ml === 'number') all.charged = ml; } catch (e) {}""",
          """try { const ml = moneySummary(td).charge.labour; if (typeof ml === 'number') {
 /* v6.81 - ticks on relocated or moved units are in the Costs figure but on no row; they get a row of their own */
 const gap = Math.round((ml - all.charged) * 100) / 100;
 if (Math.abs(gap) >= 0.01) { const o = zero(); o.charged = gap; byLine.set('Relocated or moved units', o); const b = zero(); b.charged = gap; byBranch.set('~moved', b); }
 all.charged = ml; } } catch (e) {}""", 'M1 plan gap')
    t = R("""const bname = c => c ? `${c}${(branchInfo(c) || {}).name ? ' · ' + branchInfo(c).name : ''}` : 'No branch recorded';""",
          """const bname = c => c === '~moved' ? 'Relocated or moved units' : c ? `${c}${(branchInfo(c) || {}).name ? ' · ' + branchInfo(c).name : ''}` : 'No branch recorded';""", 'M1 bname')
    # M2
    t = R("""(c.differs || []).forEach((x, i) => add('By branch', 'br-diff-' + code + '-' + i,""",
          """(c.differs || []).forEach((x, i) => add('By branch', 'br-diff-' + code + '-' + (x.contract != null && x.line != null ? x.contract + '-' + x.line : i),""", 'M2 br-diff')
    t = R("""forEach((s, i) => add('Transport', 'tr-miss-' + i,""", """forEach((s, i) => add('Transport', 'tr-miss-' + qSlug(s),""", 'M2 tr')
    t = R("""forEach((s, i) => add('Labour', 'lb-miss-' + i,""", """forEach((s, i) => add('Labour', 'lb-miss-' + qSlug(s),""", 'M2 lb')
    t = R("""function setQAnswer(id, v){""", """/* v6.81 - a question's id from its words, less the figures in it, so it survives the list changing */
function qSlug(s){ return ourSlug(String(s || '').replace(/[\\d$.,]+/g, ' ')).slice(0, 60); }
function setQAnswer(id, v){""", 'M2 qSlug')
    # M3
    t = R("""const f = Object.assign({}, patch); if ('start' in f || 'finish' in f || 'break_min' in f) f.hours = '';""",
          """const f = Object.assign({}, patch), prior = ourRawOf(id) && !tombedHere(id) ? ourRawOf(id) : {};
 /* v6.81 - hours typed without times stay until both a start and a finish are there to work them out from */
 const st = 'start' in f ? f.start : prior.start, fin = 'finish' in f ? f.finish : prior.finish;
 if (('start' in f || 'finish' in f || 'break_min' in f)) { if (st && fin) f.hours = ''; else if (prior.hours != null && String(prior.hours).trim() !== '') f.hours = prior.hours; }""", 'M3 shift')
    # M4
    t = R("""if (s === '' && kind === 'meals') { if (ourRawOf(id) && !tombedHere(id)) removeOurCost(id); return; }""",
          """if (s === '') { if (ourRawOf(id) && !tombedHere(id)) removeOurCost(id); return; } /* v6.81 - clearing a night removes it, as for meals */""", 'M4 clear')
    # L5
    t = R("""if (ourCosts().some(c => c.kind === 'person' && c.person.toLowerCase() === n.toLowerCase())) { flash(n + ' is already on the sheet.'); return; }""",
          """const dup = ourCosts().find(c => c.kind === 'person' && ourSlug(c.person) === ourSlug(n)); if (dup) { flash(dup.person + ' is already on the sheet.'); return; }""", 'L5 dup')
    # L6
    t = R("""let mins = b - a; if (mins <= 0) mins += 24 * 60;""", """if (a === b) return null; /* v6.81 - the same start and finish is not a 24-hour shift */
 let mins = b - a; if (mins < 0) mins += 24 * 60;""", 'L6 equal')
    # L7
    t = R("""const rate = P.pay_rate != null && String(P.pay_rate).trim() !== '' && Number.isFinite(Number(P.pay_rate)) ? Number(P.pay_rate) : null;""",
          """const rate = runRateOf(P);""", 'L7 day rate')
    t = R("""per.set(n, {name: n, type: runType(P.type), rate: P.pay_rate != null && String(P.pay_rate).trim() !== '' ? Number(P.pay_rate) : null,""",
          """per.set(n, {name: n, type: runType(P.type), rate: runRateOf(P),""", 'L7 totals rate')
    t = R("""function runPay(split, rate){""", """function runRateOf(P){ const s = P && P.pay_rate != null ? String(P.pay_rate).trim() : '', n = Number(s); return s !== '' && Number.isFinite(n) && n >= 0 ? n : null; }
function runPay(split, rate){""", 'L7 helper')
    t = R("""if (s !== '' && !Number.isFinite(Number(s))) { flash('The rate has to be a number of dollars an hour.'); return; }""",
          """if (s !== '' && !(Number.isFinite(Number(s)) && Number(s) >= 0)) { flash('The rate has to be a number of dollars an hour.'); return; }""", 'L7 input')
    # L8
    t = R("""function runHours(c){
 if (c.start && c.finish) { const h = shiftHours(c.start, c.finish, runBreak(c)); if (h != null) return h; }""",
          """function runHours(c){
 if (c.start && c.finish) { const h = shiftHours(c.start, c.finish, runBreak(c)); if (h != null) return h; if (shiftHours(c.start, c.finish, 0) != null) return 0; }""", 'L8 runHours')
    t = R("""function runPaidOf(s){ if (s.start && s.finish) { const h = shiftHours(s.start, s.finish, runBreak(s)); if (h != null) return h; } return s.hours || 0; }""",
          """function runPaidOf(s){ if (s.start && s.finish) { const h = shiftHours(s.start, s.finish, runBreak(s)); if (h != null) return h; if (shiftHours(s.start, s.finish, 0) != null) return 0; } return s.hours || 0; }""", 'L8 paidOf')
    # L9
    t = R("""return /salary/.test(s) ? 'salary'""", """return /salar/.test(s) ? 'salary'""", 'L9 salar')
    t = R("""${D.team.length ? `<p class="norate">Also on this day, not against one person:""",
          """${D.rows.some(r => !r.type && r.hours != null) ? `<p class="norate"><b>No type set</b> for ${D.rows.filter(r => !r.type && r.hours != null).map(r => esc(r.name)).join(', ')} — the paid hours are split on the Coates CNA rule until a type is chosen.</p>` : ''}
 ${D.team.length ? `<p class="norate">Also on this day, not against one person:""", 'L9 note')
    # L10
    t = R("""const hh = v => v == null ? '<span class="todo">—</span>' : esc(fmtNum(Math.round(v * 100) / 100));""",
          """const hh = v => v == null ? '<span class="todo">—</span>' : esc((Math.round(v * 100) / 100).toLocaleString('en-AU', {maximumFractionDigits: 2}));""", 'L10 hh')
    # L11
    t = R("""The hours rule, stated ${esc(fmtDate(WF.hours_rule.stated_on || '2026-09-24'))}: a standard day of ${esc(String((WF.hours_rule.weekday || {}).ordinary_hours))} h, the next ${esc(String((WF.hours_rule.weekday || {}).then_at_1_5))} h at ×1.5 and the rest at ×2; Saturday ×1.5 for the first ${esc(String((WF.hours_rule.saturday || {}).at_1_5))} h and ×2 after; Sunday ×2 for every hour — applied shift by shift;""",
          """The pay rule, as set on the running sheet: Coates CNA ${esc(String(runRule('cna_ord')))} h and labour hire ${esc(String(runRule('lh_ord')))} h normal on a weekday, the next ${esc(String(runRule('ot_x15')))} h at ×1.5 and the rest at ×2; Saturday ×1.5 for the first ${esc(String(runRule('sat_x15')))} h and ×2 after; Sunday ×2 for every hour; a ${esc(String(runRule('wd_break')))} min unpaid weekday break comes off pay only, never off the hours charged — applied shift by shift;""", 'L11 rule text')
    # L12
    t = R("""L.filter(c => c.kind === 'meals' && c.person && c.amount != null).forEach(c => { P0(c.person).meals""",
          """L.filter(c => c.kind === 'meals' && c.usable && c.person && c.amount != null).forEach(c => { P0(c.person).meals""", 'L12 meals')
    t = R("""L.filter(c => c.kind === 'accommodation' && c.person).forEach(c => { const x = P0(c.person); x.nights++;""",
          """L.filter(c => c.kind === 'accommodation' && c.usable && c.person).forEach(c => { const x = P0(c.person); x.nights++;""", 'L12 nights')
    t = R("""L.filter(c => c.kind === 'misc' && c.who && c.amount != null).forEach(c => { RUN_MISC""",
          """L.filter(c => c.kind === 'misc' && c.usable && c.who && c.amount != null).forEach(c => { RUN_MISC""", 'L12 misc')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
