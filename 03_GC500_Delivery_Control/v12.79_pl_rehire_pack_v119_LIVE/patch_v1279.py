#!/usr/bin/env python3
"""v12.79: the Costs & P&L tab made clean for Finance, on pack v1.19.

Author: Andrew Fisher.

Andrew, 1 Nov 2026: "Please make sure the costs/p&l tab is very clean and organised. I have the finacial team is looking at it
tommorrow". Pack v1.19: the rehire categories (fencing; toilets and water; VMS, container and forklifts) with a Rehire, all subtotal
(Andrew: "Forklift r3hire should that not go to rehire"; "1 and 2"); costs by GL account ("And 3"); the transport estimate of 1 Nov
("The transport we work out by what ever had a transport pick up cost. And is still onsite"; "What u think we do both ?"): the October
pick-ups of gear still on site move to November, and two ESTIMATE rows come in (trucks that ran by 31 Oct with no figure, October; pick-ups
still to come, November). Revenue and the accruals are unchanged; the costs and the difference move by exactly the estimate (checked below).

This patch holds no figure. On the live v12.78 page (BASE pinned) it:
- reads PLF_JSON_OLD (pack v1.18, pinned) and PLF_JSON (pack v1.19, pinned) and runs the v12.77 patch's tie checks on the new data;
- rebuilds the live P&L block from the v12.77 module and the v1.18 data and requires it to equal the page's block byte for byte;
- puts in the block built from this folder's module (plf1279_src.js and plf1279.css, with plf1279_find.js and plf1279_find.css, the
  finder, spliced in at /*__PLF1279_FIND__*/) and the v1.19 data;
- outside the block, changes words only (WORKING below), each anchor exactly once: the working figures from the live record say what
  they are, so nothing under the P&L reads as a second month-end P&L, and their exports say they are superseded;
- the release footer, v12.78 -> v12.79.

    PLF_JSON_OLD=<pack v1.18>/GC500_PL_final.json PLF_JSON=<pack v1.19>/GC500_PL_final.json \
      toolchain/build.sh v12.79 v12.79_pl_rehire_pack_v119_LIVE/patch_v1279.py
"""
import hashlib, importlib.util, json, os, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = '7bf7904784fa7e150bc92c252e987d07cb7cdc96e79e22824d8dbcf3f2b69de0'        # live v12.78, uploaded 1 Nov 2026 18:07 AEST
OLD_SHA = 'f896184a78c9c95ae665985a73980ce1231275acb0aca8b40b49c0eaf60b5f6d'     # pack v1.18, in the live v12.78 block
NEW_SHA = 'fd38abeacaacf8983901a222427bdba01e5c96a8d153851a76e31c7889f482cc'     # pack v1.19, record 12727 (audit_pack.py 573/573)

spec = importlib.util.spec_from_file_location('p1277', HERE.parent / 'v12.77_pl_tab_explorer_LIVE' / 'patch_v1277.py')
P1277 = importlib.util.module_from_spec(spec); spec.loader.exec_module(P1277)


# v12.79 (Finance reads the tab on 2 Nov 2026): the working figures from the live record keep every figure and card, but say what they are, so
# nothing under the P&L reads as a second P&L. Words only; no figure, function or card is removed.
WORKING = [
    ("fold('pl1267-finance', 'Finance’s lines', 'the ledger codes · cost of sales, gross margin ' + pc(Mo.L.gmPc.job) + ' and contribution, as Finance reads it')",
     "fold('pl1267-finance', 'The live model on the ledger codes', 'working figures from the record, not the P&L at 31 Oct')", 'the ledger fold'),
    ("'<p class=\"fin745-eyebrow\">THE SAME FIGURES ON THE LEDGER’S LINES · ON THE RECORD AND JOB END</p>'",
     "'<p class=\"fin745-eyebrow\">THE LIVE MODEL ON THE LEDGER’S LINES (WORKING FIGURES) · ON THE RECORD AND JOB END</p>'", 'the ledger heading'),
    ("'contribution is the P&L’s difference to job end'", "'contribution is the live model’s difference to job end'", 'the ledger tick'),
    ("tot('Gross margin', L.gm.now, L.gm.job,", "tot('Revenue less cost of sales (working figures)', L.gm.now, L.gm.job,", 'the ledger gross margin row'),
    ("tot('Contribution', L.contrib.now, L.contrib.job,", "tot('Difference (working figures)', L.contrib.now, L.contrib.job,", 'the ledger contribution row'),
    ("fold('pl1267-fence', 'Fencing, everything included',", "fold('pl1267-fence', 'Fencing, everything included (working figures)',", 'the fencing fold'),
    ("we pay <b>${m(M.cost)}</b>· ${M.scopeReview12451?'difference on known subtotal':'margin'}", "we pay <b>${m(M.cost)}</b> · ${M.scopeReview12451?'difference on known subtotal':'difference'}", 'the fencing card'),
    ("'every card the figures come from · At a glance · the Forecast P&L · month-end for Finance · ticks and controls'",
     "'every card the working figures come from: rate holds, the forecast model, ticks and controls'", 'the workings fold'),
    ('<p class="fin745-eyebrow">ACCRUALS FOR FINANCE · ${esc(X.label.toUpperCase())} · AUD EX GST</p>',
     '<p class="fin745-eyebrow">ACCRUALS FOR FINANCE · ${esc(X.label.toUpperCase())} · AUD EX GST · WORKING FIGURES</p><p class="fin745-note acc1279-superseded"><b>Superseded at 31 Oct 2026 by “Journals prepared for Finance, through 31 Oct” in the P&amp;L at the top of this tab.</b> The V8s were invoiced in October (18 invoices, in Revenue by invoice), so no revenue is to be accrued from here. Working figures from the record: do not post from this block.</p>',
     'the month-end accruals block'),
    ("handover: 'Finance handover'", "handover: 'PO receipts and handover (working figures)'", 'the handover button (the pane heading)'),
    ('data-finance857="runsheet">Workforce costs</button><button class="btn" data-finance857="handover">Finance handover</button>',
     'data-finance857="runsheet">Workforce costs</button><button class="btn" data-finance857="handover">PO receipts and handover (working figures)</button>', 'the handover button (the sub-view buttons)'),
    ('data-tr888-go="handover">Finance handover</button>', 'data-tr888-go="handover">PO receipts and handover (working figures)</button>', 'the handover button (Transport)'),
    ('data-finance857="pricing">Customer rates &amp; charges</button><button class="btn" data-finance857="handover">Finance handover</button>',
     'data-finance857="pricing">Customer rates &amp; charges</button><button class="btn" data-finance857="handover">PO receipts and handover (working figures)</button>', 'the handover button (the charges card)'),
    ('<h2 id="fh866Title">Purchase orders, costs and revenue by branch</h2>',
     '<h2 id="fh866Title">Purchase orders, costs and revenue by branch</h2><p class="fin745-note fh1279-working"><b>Working figures from the live record.</b> The position for Finance is the P&amp;L at 31 Oct 2026 at the top of the Costs &amp; P&amp;L summary: the 18 invoices to the V8s, all dated October, the costs and the journals prepared for Finance.</p>',
     'the handover heading'),
]

# v12.79, after the pre-upload check of 1 Nov 2026: the working views' words, one pair per anchor (handover and sub-views; the month-end accruals
# block and its Copy and CSV, which now open with the superseded line; the live model and forecast model headings; the transport view; dated
# facts in place of attributions). Words only; each anchor exactly once outside the block; checked when applied below.
WORKING += [tuple(x) for x in json.loads((HERE / 'working_v1279.json').read_text(encoding='utf-8'))]


def sub1(text, old, new, what):
    if text.count(old) != 1: raise ValueError('%s: expected the anchor once, found %d' % (what, text.count(old)))
    return text.replace(old, new)


def block(folder, js_name, css_name, J, sha, find=None):   # the block exactly as patch_v1277 writes it; v12.79: the find files spliced in first
    js = (folder / js_name).read_text(encoding='utf-8').rstrip(); css = (folder / css_name).read_text(encoding='utf-8').rstrip()
    if find:
        fjs = (folder / find[0]).read_text(encoding='utf-8').rstrip()
        if '__PLF1272_' in fjs or '__PLF1279_' in fjs: raise ValueError('a slot name inside the find file')
        js = sub1(js, '/*__PLF1279_FIND__*/', fjs, 'the find slot'); css = css + '\n' + (folder / find[1]).read_text(encoding='utf-8').rstrip()
    js = sub1(sub1(js, '__PLF1272_DATA__', page_data(J), 'the data slot'), '__PLF1272_SHA__', sha, 'the hash slot')
    if '</script' in js.lower() or '</style' in css.lower(): raise ValueError('a closing tag inside the block')
    return '<style id="plf1272-style">\n' + css + '\n</style>\n<script id="plf1272-script">\n' + js + '\n</script>\n'


def page_data(J):
    # exactly as v12.77 writes it into the block (patch_v1277.patch)
    data = json.dumps(J, ensure_ascii=True, separators=(',', ':')).replace('</', '<\\/')
    if data.count('Andrew Fisher') != data.count('"who":"Andrew Fisher"'): raise ValueError('the name is in the pack data outside a who-field')
    return data.replace('"who":"Andrew Fisher"', '"who":"Andrew\\u0020Fisher"')


def load(env, pin):
    src = os.environ.get(env)
    if not src: raise ValueError(env + ' must name a GC500_PL_final.json')
    raw = Path(src).read_bytes(); got = hashlib.sha256(raw).hexdigest()
    if got != pin: raise ValueError('%s is %s, not the pinned %s' % (env, got, pin))
    return json.loads(raw.decode('utf-8'))


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.78; rebuild and retest')
    old_J = load('PLF_JSON_OLD', OLD_SHA)
    P1277.PLF_SHA256 = NEW_SHA                   # the v12.77 tie checks, on the new data
    new_J, sha = P1277.pack_data()
    if new_J.get('pack') != 'v1.19' or old_J.get('pack') != 'v1.18': raise ValueError('expected pack v1.18 -> v1.19')
    if [c['name'] for c in new_J['categories']].count('Forklift rehire') or not all(l['category'] == 'Rehire – VMS, container and forklifts' for l in new_J['lines'] if l['supplier'] == 'Queensland Forklifts'):
        raise ValueError('pack v1.19 should carry Queensland Forklifts under Rehire')
    for k in ('revenue', 'accrue'):
        if new_J[k] != old_J[k]: raise ValueError('a total changed between v1.18 and v1.19: ' + k)
    c = lambda a, b: abs(round(a, 2) - round(b, 2)) < 0.005
    est = (16083.79, 19847.89, 1788.02)   # the transport estimate's October and November rows, and the four pick-ups moved to November
    if not (c(new_J['costs']['total'], old_J['costs']['total'] + est[0] + est[1]) and c(new_J['costs']['sep'], old_J['costs']['sep'])
            and c(new_J['costs']['oct'], old_J['costs']['oct'] - est[2] + est[0]) and c(new_J['costs']['nov'], old_J['costs']['nov'] + est[2] + est[1])
            and c(new_J['difference'], old_J['difference'] - est[0] - est[1])):
        raise ValueError('the costs did not move by exactly the transport estimate between v1.18 and v1.19')
    a = text.index('<style id="plf1272-style">'); b0 = text.index('<script id="plf1272-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    if text[a:b] != block(HERE.parent / 'v12.77_pl_tab_explorer_LIVE', 'plf1277_src.js', 'plf1277.css', old_J, OLD_SHA):
        raise ValueError('the live P&L block is not the v12.77 module on pack v1.18')
    if len(new_J['invoices']) != 18 or any(not str(x['date']).endswith('/10/2026') for x in new_J['invoices']) or new_J['asAt'] != '2026-10-31':
        raise ValueError('the working words say 18 invoices, all dated October, and the P&L at 31 Oct 2026: the pack no longer agrees')
    before, after = text[:a], text[b:]
    for old, new, what in WORKING:   # outside the block: the working figures' own words, each anchor exactly once
        n_ = before.count(old) + after.count(old)
        if n_ != 1: raise ValueError('%s: expected the anchor once outside the P&L block, found %d' % (what, n_))
        before, after = before.replace(old, new), after.replace(old, new)
    text = before + block(HERE, 'plf1279_src.js', 'plf1279.css', new_J, NEW_SHA, ('plf1279_find.js', 'plf1279_find.css')) + after
    if text.count('<script id="plf1272-script">') != 1 or text.count('<style id="plf1272-style">') != 1: raise ValueError('the block is not in once')
    found = P1277.FOOTER.findall(text)
    if found != ['v12.78']: raise ValueError('release footer: expected one v12.78 footer, found ' + repr(found))
    text = P1277.FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.79'), text, count=1)
    print('patch_v1279 applied: the P&L on pack v1.19 (data %s; Forklift rehire under Rehire; the transport estimate); footer v12.78 -> v12.79' % NEW_SHA[:12])
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
