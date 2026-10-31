"""Author: Andrew Fisher. v12.19 - the V8s are charged on Advanced's quantities.

Andrew, 25 Oct 2026 (this chat): "we work off the advanced fencing qty we have the cost we pay advanced - same qty we have the
charge we chARGE V8", after "what we are being invoiced for is what we will charge V8s for simple" and the Pay and charge table.

- fence1219_src.js: what Advanced bill us for is what the V8s are charged for, at the 2026 card or the named rates - a docket on
  their approved sheet on the sheet's quantities (CCB by the docket's own types; vehicle gates as the 2.5 m of fence each takes
  the place of; bases at the card's block rate; relocation hours at the labour rate); week 6 and the event week on our dockets,
  vehicle gates the same way; the labour notes at the labour rate on the hours they bill; the team leader, materials and orders
  outside the weeks at cost, as fencing lines on the Costs tab. The area table keeps the papers' metres.
- the words that said the labour notes are a cost only, and the team-leader rule of 15 Oct, say what is charged now; the P&L
  and the branch note name the basis.
- footer v12.18 -> v12.19.

    python3 patch_v1219.py page.html      (in place, on the live v12.18 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '677b41fce24fafdc1795259a272b4770c5d719e1dd2b3be245909ee484d0b4d4'
CHARGED = 'charged to the V8s at the labour rate on the hours Advanced bill'
WORDS = [
    ('"money":"a cost only — what Coates pays Advanced at their Labour rate; charged to the V8s inside the fencing installation rates, never on a line of its own"',
     '"money":"what Coates pays Advanced at their Labour rate; the hours they bill are ' + CHARGED.replace(' on the hours Advanced bill', '') + ', a fencing line on the Costs tab"', 'green book money words'),
    ('<span class="chip">cost only</span></h3>', '<span class="chip">charged at the labour rate</span></h3>', 'green book chip'),
    ('Cost only: the hours are paid to Advanced at their Labour rate and charged to the V8s inside the fencing installation rates, never on a line of their own.',
     'The hours are paid to Advanced at their Labour rate and the hours they bill are ' + CHARGED.replace(' on the hours Advanced bill', '') + '.', 'service note form hint'),
    ("revenue_state:'Cost only; no separate customer labour charge'", "revenue_state:'Charged with the fencing lines on the Costs tab, at the labour rate on the hours Advanced bill'", 'trace revenue state'),
    ("'<dd>Cost only; no separate customer labour charge.</dd>'", "'<dd>Charged with the fencing lines on the Costs tab, at the labour rate on the hours Advanced bill.</dd>'", 'trace revenue words'),
    ('Cost only; fencing installation revenue already covers this labour.', 'The hours Advanced bill are ' + CHARGED.replace(' on the hours Advanced bill', '') + '.', 'green drawer words'),
    ('(a cost only — the V8s pay for it inside the fencing installation rates; the project manager, 25 Sep 2026)', '(the hours they bill are ' + CHARGED.replace(' on the hours Advanced bill', '') + ', a fencing line)', 'costs words'),
    ("settle1153(Q, 'fe-rate-team_leader', 'Team leader — no separate customer rate', 'The V8s are charged fencing per metre at the 2026 street card (clean $16.16, scrim $25.53, relocation $8.65, ped gate $36.18, CCB event $7.51, demarcation $13.08) and event people at the Event Labour Scope roles (fence team $88.49/h). Advanced’s $200/day team leader is inside our cost of each week’s approval sheet, not a line to the customer. Rule applied 15 Oct 2026.');",
     "settle1153(Q, 'fe-rate-team_leader', 'Team leader — charged at cost', 'The V8s are charged for what Advanced bill, on the same quantities, at the 2026 street card or the named rates (clean $16.16, scrim $25.53, ped gate $36.18, CCB event $7.51, demarcation $13.08, labour $142/h; a vehicle gate as the 2.5 m of fence it takes the place of). The card has no team leader line, so Advanced’s $200/day team leader is charged at cost. Rule applied 25 Oct 2026; it replaces the rule of 15 Oct 2026.');", 'team leader ruling'),
    ("Advanced’s fencing dockets at the 2026 card ${money0(fence)}", "Advanced’s fencing on the quantities they bill, at the 2026 card ${money0(fence)}", 'P&L rehire basis'),
    ("${esc(pl760FencingBranch())} Advanced’s fencing dockets at the 2026 card)", "${esc(pl760FencingBranch())} Advanced’s fencing on the quantities they bill, at the 2026 card)", 'branch rehire note'),
    ("${g.costs.filter(c => c.from === 'record').length} fencing docket${g.costs.filter(c => c.from === 'record').length === 1 ? '' : 's'} charged at the 2026 card — what this branch charges the V8s for fencing, from the record.",
     "${g.costs.filter(c => c.from === 'record' && c.docket).length} fencing docket${g.costs.filter(c => c.from === 'record' && c.docket).length === 1 ? '' : 's'} charged at the 2026 card on the quantities Advanced bill${g.costs.some(c => c.invoiced1219) ? ', with the labour notes, team leader, materials and orders they bill' : ''} — what this branch charges the V8s for fencing, from the record.", 'branch subhire note'),
    ("description: `${name} docket ${no} — ${words}, charged at the 2026 card`,", "description: `${name} docket ${no} — ${words}, charged at the 2026 card${d.invoiced1219 === 'sheet' ? ' on the quantities Advanced bill' : ''}`,", 'docket cost line words'),
    ("label: 'Dockets · Revenue at the 2026 card'", "label: 'Fencing · Revenue on the quantities Advanced bill'", 'fence money label'),
    ('<div class="money"><span>Dockets — revenue at the 2026 card</span>', '<div class="money"><span>Fencing — revenue on the quantities Advanced bill</span>', 'fencing plate label'),
]


def patch(text):
    if 'FenceInvoiced1219' in text: raise ValueError('v12.19 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base changed; rebuild and retest')
    for old, new, what in WORDS:
        text = rep(text, old, new, what, 'page')
    js = (HERE / 'fence1219_src.js').read_text(encoding='utf-8').rstrip()
    end = "W.PlTidy1218 = Object.freeze({version: 'v12.18', outside: outside});\n})(window);\n</script>\n</body>\n</html>"
    text = rep(text, end, end.replace('</script>\n</body>', '</script>\n' + js + '\n</body>'), 'invoiced quantities script', 'page')
    return rep(text, "+' · v12.18'; /* v8.19 release922", "+' · v12.19'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print("patch_v1219 applied: the V8s charged on Advanced's quantities; the labour notes, team leader, materials and outside orders as fencing lines; words; footer v12.18 -> v12.19")
