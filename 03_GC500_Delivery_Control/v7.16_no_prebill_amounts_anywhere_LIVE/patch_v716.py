#!/usr/bin/env python3
"""v7.16 - NO PRE-BILL AMOUNTS, FOR ANYTHING (the project manager, 27 Sep 2026, 23:20 AEST: "Do not use pre-bill
amounts for anything.").

  1. The data: prebill_amount is taken off every on-hire / contract line in the embedded data (a JSON-aware edit of
     the DATA block, so nothing can read it and no export can carry it). The transcription note already says the
     column is never read, and stays.
  2. The charge is untouched. A contract line still charges by its rate. A transport or delivery charge line used to
     take its amount from that column; it now takes the price on the line times its quantity, which is the same
     figure on every one of the ten lines (checked here before anything is written).
  3. Every display of the column and every comparison with it goes: the "Baseplan prebilled" hovers and sentences,
     the "prebill differs" chips, the "reads differently / to settle" rows, lists, cards and plate notes, the
     differs / reads flags, prebillReads() and contractDiffWords(), the column's sums, the "Provisional" sentence in
     the Costs verdict, the "to settle" item in what is not in the figure yet, the stream notes, the email's count
     and the branch questions it raised.

Build on the live page (v7.17, kit717).   python3 patch_v716.py <page.html>"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

def rep_keep(text, old, new, what, path):
    """rep() from patch_v669 - exactly one match or stop - but the whitespace its pattern takes in front of the first
    word is put back, so a phrase replaced mid-sentence keeps the space before it and a line keeps its indent."""
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    ws = re.match(r'[ \t]*', ms[0].group(0)).group(0)
    return rep(text, old, ws + new.lstrip(' \t'), what, path, True)


PB = re.compile(r'pre.?bill', re.I)
ALLOWED = ['The Prebill column is never read']   # the only mentions left: a data note and a code comment, both saying so


def strip_data(t):
    """Take prebill_amount off every row of the embedded DATA, JSON-aware; check the charge lines first."""
    pre = 'const DATA = '
    starts = [m.start() for m in re.finditer(r'^const DATA = \{', t, re.M)]
    if len(starts) != 1: sys.exit('DATA block: expected once, found %d' % len(starts))
    i = starts[0] + len(pre)
    D, used = json.JSONDecoder().raw_decode(t, i)
    raw = t[i:used]
    if json.dumps(D, ensure_ascii=False, separators=(',', ':')) != raw:
        sys.exit('DATA does not round-trip byte for byte - refusing to rewrite it')
    oh = D.get('rental_on_hire') or {}
    # the charge lines: the price on the line times its quantity must be the figure they charged before
    for r in oh.get('rows', []):
        if not r.get('charge_line'): continue
        q = r['quantity'] if isinstance(r.get('quantity'), (int, float)) and r['quantity'] > 0 else 1
        was = r.get('prebill_amount'); now = round(r['price'] * q * 100) / 100 if isinstance(r.get('price'), (int, float)) else None
        if (was is None) != (now is None) or (was is not None and abs(was - now) > 0.005):
            sys.exit('charge line %s/%s: price x quantity %r is not the figure it charged, %r' % (r.get('rental_contract'), r.get('line'), now, was))
    n = [0]

    def walk(o):
        if isinstance(o, dict):
            for k in [k for k in o if PB.search(k)]: del o[k]; n[0] += 1
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(D)
    rows = len(oh.get('rows', []))
    if n[0] != rows: sys.exit('removed %d prebill fields, expected one per row (%d)' % (n[0], rows))
    new = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    if PB.search(new.replace(ALLOWED[0], '')): sys.exit('the data still mentions the column')
    print('  data: prebill_amount taken off %d rows' % n[0])
    return t[:i] + new + t[used:]


# (old, new, what) - each old text must match exactly once
R = []
def r(old, new, what): R.append((old, new, what))

# --- the Questions tab: the "which is the correct bill?" question per line
r(r"""(c.differs || []).forEach((x, i) => add('By branch', 'br-diff-' + code + '-' + (x.contract != null && x.line != null ? x.contract + '-' + x.line : i), contractDiffWords(x), 'The rule and Baseplan\'s prebill read differently — which is the correct bill?', 'costs')); });""",
  """});""", 'questions')

# --- the drawer: a contract line's money
r("""/* v5.81 — the line's money: the rates exactly as Baseplan exported them, under their rate type, and what the line
 CHARGES by the site rule (contractCharge — by the rate, never by the prebill amount, 24 Sep 2026).
 The prebill is in the hover for comparison and nowhere else; a line whose prebill reads differently wears a
 chip that says so. A SUB item is a subhire; a transport or delivery line is a charge, not plant. */""",
  """/* v5.81 — the line's money: the rates exactly as Baseplan exported them, under their rate type, and what the line
 CHARGES by the site rule (contractCharge — by the rate, 24 Sep 2026). A SUB item is a subhire; a transport or
 delivery line is a charge, not plant. */""", 'drawer comment')
r("""bits.push(`<b title="${esc(ch.basis + (ch.prebill != null ? ' · Baseplan prebilled ' + money(ch.prebill) : ''))}">charges""",
  """bits.push(`<b title="${esc(ch.basis)}">charges""", 'drawer hover')
r("""${ch.differs ? ` <span class="chip crit" title="${esc(ch.reads + ' — ' + money(ch.prebill) + '. Settle with the branch; the page goes by the rate.')}">prebill differs</span>` : ''}`);""",
  """`);""", 'drawer chip')

# --- contractCharge: by the rate; a charge line by its price; nothing compared
r("""/* v5.81 — WHAT A CONTRACT LINE CHARGES, BY THE RATE. forklifts, VMS and water barriers
 are charged from when they go in; everything else only over the event; go by the rate, never by the prebill
 amount — for anything that is not a VMS, forklift or water barrier, the rate is the whole-event bill for that
 item. So: a VMS, forklift or water-barrier
 line charges Rate 1 × quantity × the days from the contract's start (or its booked delivery) to its term (or
 its expected term), never fewer than the line's own minimum days; every other line charges Rate 1 × quantity,
 once, as the whole-event bill; a transport or delivery line is a charge in itself, and the amount on it is the
 charge; a line with no rate is unknown, never nought. Baseplan's prebill is kept beside the figure for
 comparison only — it is in a hover, never a headline — and a line where the two disagree is named, with what
 the prebill's arithmetic looks like, for the branch to settle. The contract's own dates are used, because the
 charge is the contract's; a light a person set on the ground is the delivery record, not the bill. */""",
  """/* v5.81 — WHAT A CONTRACT LINE CHARGES, BY THE RATE. forklifts, VMS and water barriers
 are charged from when they go in; everything else only over the event; go by the rate — for anything that is
 not a VMS, forklift or water barrier, the rate is the whole-event bill for that item. So: a VMS, forklift or
 water-barrier line charges Rate 1 × quantity × the days from the contract's start (or its booked delivery) to
 its term (or its expected term), never fewer than the line's own minimum days; every other line charges
 Rate 1 × quantity, once, as the whole-event bill; a transport or delivery line is a charge in itself, and the
 price on it times its quantity is the charge; a line with no rate is unknown, never nought. The contract's own
 dates are used, because the charge is the contract's; a light a person set on the ground is the delivery
 record, not the bill.
 v7.16 (27 Sep 2026): The Prebill column is never read - it is stripped from the data, and nothing on the page
 is compared with it. */""", 'charge comment')
r(""" const pre = typeof r.prebill_amount === 'number' ? r.prebill_amount : null;
 const out = {amount: null, basis: '', how: null, days: null, prebill: pre, differs: false, reads: '', daily: CONTRACT_DAILY_KINDS.has(r.kind)};
 if (r.charge_line) { out.amount = pre; out.how = 'charge line'; out.basis = pre != null ? 'a transport or delivery charge line — the amount on it is the charge' : 'a charge line with no amount on it yet'; return out; }""",
  """ const out = {amount: null, basis: '', how: null, days: null, daily: CONTRACT_DAILY_KINDS.has(r.kind)};
 if (r.charge_line) { out.amount = typeof r.price === 'number' ? cents(r.price * q) : null; out.how = 'charge line'; out.basis = out.amount != null ? 'a transport or delivery charge line — the price on it' + (q !== 1 ? ' × ' + q : '') + ' is the charge' : 'a charge line with no price on it yet'; return out; }""",
  'charge line')
r(""" if (pre != null && Math.abs(out.amount - pre) > 0.005) { out.differs = true; out.reads = prebillReads(r, q, out); }
 return out;
}
/* what Baseplan's prebill looks like it did, in words — a description for the branch to confirm, never a figure
 the page uses anywhere */
function prebillReads(r, q, ch){
 const pre = r.prebill_amount;
 const whole = x => x != null && Number.isFinite(x) && Math.abs(x - Math.round(x)) < 0.02 && Math.round(x) >= 1;
 const r1 = typeof r.rate_1 === 'number' && r.rate_1 > 0 ? pre / (r.rate_1 * q) : null;
 const r2 = typeof r.rate_2 === 'number' && r.rate_2 > 0 ? pre / (r.rate_2 * q) : null;
 if (whole(r1) && Math.round(r1) === 1) return 'Baseplan prebilled Rate 1 once' + (ch && ch.how === 'per day' && ch.days > 1 ? ' — the rate on this line looks like a lump for the period, not a day rate' : '');
 if (whole(r1)) return `Baseplan prebilled Rate 1 × ${Math.round(r1)}`;
 if (whole(r2)) return `Baseplan prebilled Rate 2 (${money(r.rate_2)}) × ${Math.round(r2)}`;
 return 'Baseplan\\'s prebill does not read as either rate times a whole number';
}""",
  """ return out;
}""", 'prebillReads')

# --- contractFigures: no prebill sums, no differs list
r("""breakdown. Every line's charge is contractCharge() above — his rule, never Baseplan's
 prebill — added up by the branch on the contract tab; the prebill travels beside it for the hover only. A
 subhire line (item SUB-…) and a transport or delivery charge line are named on their own, with their money, so
 a branch's breakdown says what is Coates plant, what is subhired and what is a charge; a line with no rate is
 counted as unknown; a line whose prebill reads differently is listed for the branch to settle. */""",
  """breakdown. Every line's charge is contractCharge() above — his rule — added up by the branch on the contract
 tab. A subhire line (item SUB-…) and a transport or delivery charge line are named on their own, with their
 money, so a branch's breakdown says what is Coates plant, what is subhired and what is a charge; a line with no
 rate is counted as unknown. */""", 'figures comment')
r("""rate_type: r.rate_type, prebill: r.prebill_amount, supplier:""", """rate_type: r.rate_type, supplier:""", 'one()')
r(""" const diff = rows.filter(r => ch.get(r).differs);
 const daily =""", """ const daily =""", 'diff rows')
r(""" differs: diff.map(r => Object.assign(one(r), {reads: ch.get(r).reads})), differs_charge: sum(diff, amt), differs_prebill: sum(diff, r => r.prebill_amount),
 prebill: sum(rows, r => r.prebill_amount), prebill_lines: rows.filter(r => typeof r.prebill_amount === 'number').length,
 billed: sum(rows, r => r.billed_amount),""", """ billed: sum(rows, r => r.billed_amount),""", 'figures sums')
r("""charge: sum(plant, amt), prebill: sum(plant, r => r.prebill_amount), rated:""", """charge: sum(plant, amt), rated:""", 'plant sum')
r("""charge: sum(sub, amt), prebill: sum(sub, r => r.prebill_amount), items: sub.map(one)""", """charge: sum(sub, amt), items: sub.map(one)""", 'subhire sum')
r("""charge: sum(charge, amt), prebill: sum(charge, r => r.prebill_amount), items: charge.map(one)""", """charge: sum(charge, amt), items: charge.map(one)""", 'transport sum')
r("""/* one line where the rule and Baseplan's prebill disagree, in a breath, for the list the branch settles from */
function contractDiffWords(x){
 return `${x.branch || ''} contract ${x.contract} line ${x.line} — ${x.item ? x.item + ' ' : ''}${x.description || ''}${x.qty && x.qty !== 1 ? ' × ' + x.qty : ''}: by the rule ${money(x.charge)} (${x.basis}); ${x.reads} — ${money(x.prebill)}`;
}
function contractRowsByBranch(){""", """function contractRowsByBranch(){""", 'contractDiffWords')

# --- Costs & charges: the by-branch table and its fold
r("""water barriers; never Baseplan's prebill">On the contracts<br>""", """water barriers">On the contracts<br>""", 'branch th')
r("""${g.contract.differs.length ? ` · ${g.contract.differs.length} where Baseplan's prebill reads differently` : ''}""", "", 'branch cell hover differs')
r("""} · Baseplan prebilled ${money0(g.contract.prebill)} — listed under the table`) : ''}">""", """} — listed under the table`) : ''}">""", 'branch cell hover')
r("""${g.contract.unknown || g.contract.differs.length ? `<br><span class="w" style="font-size:11px;color:var(--mute)"> ${g.contract.unknown ? g.contract.unknown + ' no rate' : ''}${g.contract.unknown && g.contract.differs.length ? ' · ' : ''}${g.contract.differs.length ? g.contract.differs.length + ' to settle' : ''}</span>` : ''}""",
  """${g.contract.unknown ? `<br><span class="w" style="font-size:11px;color:var(--mute)"> ${g.contract.unknown} no rate</span>` : ''}""", 'branch cell')
r("""' contracts charge by the rate · Baseplan prebilled ' + money0(R.all.contract.prebill))}">""", """' contracts charge by the rate')}">""", 'branch total hover')
r("""<summary>On the contracts — by the rate, the lines to settle, subhired and charge lines, by branch</summary>""",
  """<summary>On the contracts — by the rate, subhired and charge lines, by branch</summary>""", 'fold summary')
r("""and always by the rate, never by the prebill amount — so a VMS""", """and always by the rate — so a VMS""", 'fold hint rule')
r("""Baseplan's export of ${ONHIRE ? esc(fmtDate(ONHIRE.supplied_on)) : '—'} prebilled ${esc(money0(R.all.contract.prebill))} on the same lines; the rule agrees with it on ${R.all.contract.lines - R.all.contract.unknown - R.all.contract.differs.length} of the ${R.all.contract.lines - R.all.contract.unknown} lines it can price.""",
  """The lines are from Baseplan's export of ${ONHIRE ? esc(fmtDate(ONHIRE.supplied_on)) : '—'}; the rule prices ${R.all.contract.charge_lines} of the ${R.all.contract.lines}.""", 'fold hint export')
r("""${R.all.contract.differs.length ? `<p class="hint"><b>${R.all.contract.differs.length} line${R.all.contract.differs.length === 1 ? '' : 's'} where Baseplan's prebill reads differently</b> — ${esc(money0(R.all.contract.differs_charge))} by the rule against ${esc(money0(R.all.contract.differs_prebill))} prebilled. The page goes by the rate; settle each with its branch:</p>
 <ul style="margin:0 0 8px;padding-left:18px;font-size:12.5px;line-height:1.55">${R.all.contract.differs.map(x => `<li>${esc(contractDiffWords(x))}</li>`).join('')}</ul>` : ''}
 ${rows.filter(g => g.contract && g.contract.lines).map(g =>""", """${rows.filter(g => g.contract && g.contract.lines).map(g =>""", 'fold settle list')
r("""${g.contract.differs.length ? ` · ${g.contract.differs.length} to settle` : ''} · Baseplan prebilled ${esc(money0(g.contract.prebill))}. ${contractPlateNote""",
  """. ${contractPlateNote""", 'fold branch line')

# --- moneySummary: no differs fields, nothing "to settle" in what is missing
r("""contracts_unknown: C.unknown, contracts_differs: C.differs.length,
 differs_charge: C.differs_charge, differs_prebill: C.differs_prebill, subhire: C.subhire.charge,""",
  """contracts_unknown: C.unknown,
 subhire: C.subhire.charge,""", 'summary fields')
r("""unknown: g.contract.unknown, differs: g.contract.differs.length})),""", """unknown: g.contract.unknown})),""", 'summary by branch')
r(""" if (C.differs.length) miss(`${C.differs.length} contract line${C.differs.length === 1 ? '' : 's'} where Baseplan's prebill reads differently — ${money0(C.differs_charge)} by the rule, ${money0(C.differs_prebill)} prebilled`, `${C.differs.length} to settle`);
 if (schedT.counted && schedT.plus)""", """ if (schedT.counted && schedT.plus)""", 'summary missing')

# --- the streams
r("""unrated: 0, differs: 0, subhired: 0,""", """unrated: 0, subhired: 0,""", 'stream init')
r(""" if (ch.differs) s.differs++;
 if (r.subhired) s.subhired++; });""", """ if (r.subhired) s.subhired++; });""", 'stream count')
r(""" if (s.differs) s.notes.push(`${pl(s.differs, 'line')} to settle with the branch`);
 if (s.subhired) s.notes.push(""", """ if (s.subhired) s.notes.push(""", 'stream note')

# --- Costs & charges headline and ledger
r("""${M.charge.contracts_differs ? ` <b>Provisional:</b> ${pl(M.charge.contracts_differs, 'contract line')} with the charge basis unresolved — ${esc(money0(M.charge.differs_charge))} by the rule, ${esc(money0(M.charge.differs_prebill))} prebilled. Counted by the rule until the branch settles each line; the two are not netted.` : ''}""", "", 'verdict')
r("""${c.contracts_differs ? ` · ${c.contracts_differs} to settle` : ''}""", "", 'ledger')
r("""water barriers — by the rate, never by the prebill amount. For comparison only""", """water barriers — by the rate. For comparison only""", 'branches hint')

# --- Pricing
r("""what they charge by his rule of the same day (contractCharge: by the rate, never by the prebill
 amount) — beside the card's figures.""", """what they charge by his rule of the same day (contractCharge: by the rate) — beside the card's
 figures.""", 'pricing comment')
r(""" + (cf.prebill ? ' · Baseplan prebilled ' + money(cf.prebill) : '') : '')}">""", """ : '')}">""", 'pricing hover')
r("""${cf.differs.length ? ` · <span class="chip crit" title="${esc(cf.differs.map(contractDiffWords).join('\\n'))}">${cf.differs.length} prebill differs</span>` : ''}""", "", 'pricing chip')
r("""<div class="kpi ${CT.differs.length ? 'alert' : ''}"><div class="v">${CT.charge ?""", """<div class="kpi"><div class="v">${CT.charge ?""", 'pricing kpi')
r("""water barriers — by the rate, never by the prebill amount — across""", """water barriers — by the rate — across""", 'pricing kpi words')
r("""unknown, not nought` : ''}${
 CT.differs.length ? ` · <b>${CT.differs.length} line${CT.differs.length === 1 ? '' : 's'} where Baseplan's prebill reads differently</b> (${esc(money0(CT.differs_charge))} by the rule, ${esc(money0(CT.differs_prebill))} prebilled) — listed on the <button class="linkish" data-go="costs">Costs tab</button> to settle with the branch` : ''}. A rate on""",
  """unknown, not nought` : ''}. A rate on""", 'pricing kpi settle')

# --- the plates (Where we are, by branch)
r("""unrated: 0, differs: 0};""", """unrated: 0};""", 'trade init')
r(""" if (ch.differs) x.differs++; by.set(d, x); });""", """ by.set(d, x); });""", 'trade count')
r("""rule, 24 Sep 2026), the lines with no rate, the lines whose prebill reads differently, then the subhire and the
 transport and delivery charge lines by name — the mention he asked for. The prebill is in the hover only. */""",
  """rule, 24 Sep 2026), the lines with no rate, then the subhire and the transport and delivery charge lines by
 name — the mention he asked for. */""", 'plate comment')
r("""forklifts and water barriers — never the prebill. Baseplan prebilled ' + (money0(c.prebill) || '—') + ' on the same lines.')}">By the rate""",
  """forklifts and water barriers.')}">By the rate""", 'plate hover')
r("""/* what a branch's contracts leave open — under the plate's More info (v5.81): the lines with no rate, the lines
 whose prebill reads differently, and the contract numbers */""",
  """/* what a branch's contracts leave open — under the plate's More info (v5.81): the lines with no rate and the
 contract numbers */""", 'plate more comment')
r("""unknown, not nought</small></span><b class="none">—</b>` : ''}
 ${c.differs.length ? `<span title="${esc(c.differs.map(contractDiffWords).join('\\n'))}">Prebill reads differently <small>· ${c.differs.length} line${c.differs.length === 1 ? '' : 's'} to settle · Baseplan ${money0(c.differs_prebill)}</small></span><b>${esc(money0(c.differs_charge))}</b>` : ''}`.trim();""",
  """unknown, not nought</small></span><b class="none">—</b>` : ''}`.trim();""", 'plate more row')
r(""": ${esc(c.contracts.join(', '))}. Baseplan prebilled ${esc(money0(c.prebill) || '—')} on the same lines; the page goes by the rate.</p>`;""",
  """: ${esc(c.contracts.join(', '))}. Charged by the rate.</p>`;""", 'plate more src')

# --- the progress email
r("""the contract lines with no rate and the lines to settle counted, not listed */""", """the contract lines with no rate counted, not listed */""", 'email comment')
r("""+ (Cn.unknown || (Cn.differs || []).length ? ` (contract lines: ${[Cn.unknown ? Cn.unknown + ' unrated' : '', (Cn.differs || []).length ? Cn.differs.length + ' to settle' : ''].filter(Boolean).join(', ')})` : '')""",
  """+ (Cn.unknown ? ` (contract lines: ${Cn.unknown} unrated)` : '')""", 'email')


def patch(path):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function prebillReads(' not in t and 'prebill_amount' not in t: sys.exit('v7.16 already applied')
    if 'function contractCharge(' not in t: sys.exit('not the dashboard page')
    for old, new, what in R:
        bad = re.findall(r" \.[A-Za-z_]", new)
        if bad: sys.exit('%s: the new text holds a space before a dot, which the attribution scrub folds: %r' % (what, bad[:5]))
        if 'Andrew Fisher' in new: sys.exit('%s: the new text names the project manager' % what)
    t = strip_data(t)
    for old, new, what in R:
        t = rep_keep(t, old, new, what, path)
    # nothing left anywhere but the notes that say the column is never read
    left = [(t.count('\n', 0, m.start()) + 1, t[max(0, m.start() - 60):m.end() + 60].replace('\n', ' ')) for m in PB.finditer(t)
            if not any(t[m.start() - 4:m.start() - 4 + len(a)] == a for a in ALLOWED)]
    for ln, ctx in left: print('  LEFT line %d: %s' % (ln, ctx))
    if left: sys.exit('%d mentions of the column are left' % len(left))
    for ident in ('prebillReads', 'contractDiffWords', '.differs', 'differs_charge', 'contracts_differs', 'ch.reads'):
        if ident in t: sys.exit('still referenced: ' + ident)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t), '|', len(R), 'code edits')


if __name__ == '__main__':
    patch(sys.argv[1])
