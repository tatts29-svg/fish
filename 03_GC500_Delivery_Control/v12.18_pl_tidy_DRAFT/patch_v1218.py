"""Author: Andrew Fisher. v12.18 - the P&L tidy: Advanced's $195 collection in the fencing cost, and the P&L card's fencing wording.

Andrew, 25 Oct 2026 (this chat): "is there anything we cqan clean up here" (the Whole-job P&L card), then "can codex help
with anything we need to clean things up and make sure P&L is correct and align things into the correct cost area and
close off as much as possible to the cent".

- pl1218_src.js: an Advanced order outside the programme weeks with a receipt ID counts at its amount in the fencing cost,
  on Rehire (2126) with their gear: order 4658850, receipt 4922343, their invoice 93920 (a partial collection), $195. The
  receipted-order words name it. The charge to the V8s does not move.
- the P&L's Rehire basis says the orders have Advanced's sheet matched to the cent, not that they are invoiced: weeks 1-3
  have no receipt yet.
- the card's right-hand column is fencing's demob, and the card says Advanced's relocation and removal hours are not
  priced yet; the Coates wages row is the hours and "not priced".
- footer v12.17 -> v12.18.

    python3 patch_v1218.py page.html      (in place, on the live v12.17 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5'
STILL, DEMOB = 'Of which · fencing still to come', 'Of which · fencing demob still to come'


def patch(text):
    if 'PlTidy1218' in text: raise ValueError('v12.18 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base changed; rebuild and retest')
    text = rep(text, "' invoiced and matched to the cent, ' + money0(m.reduce((s, x) => s + x.total, 0)) + '; the other dockets await their invoice, counted at the sheet rates)'",
               "' with Advanced’s sheet matched to the cent, ' + money0(m.reduce((s, x) => s + x.total, 0)) + '; the other dockets at their sheet rates)'", 'rehire basis: sheet, not invoice', 'page')
    text = rep(text, '<th class="num">Job total · all in</th><th class="num">' + STILL + '</th>', '<th class="num">Job total · all in</th><th class="num">' + DEMOB + '</th>', 'P&L column head', 'page')
    text = rep(text, "(r.fence ? '<span>" + STILL + "</span><span>'", "(r.fence ? '<span>" + DEMOB + "</span><span>'", 'P&L phone column', 'page')
    text = rep(text, "var FENCE_DEF = ['" + STILL + "', 'Advanced’s remaining programme weeks (decon): Revenue at the 2026 card, cost at Advanced’s own rates. It is the one estimate",
               "var FENCE_DEF = ['" + DEMOB + "', 'Advanced’s demob weeks from the programme (decon): Revenue at the 2026 card, cost at Advanced’s own rates. Their relocation and removal hours are not priced yet. It is the one estimate", 'P&L column definition', 'page')
    text = rep(text, "basis.textContent = 'All in · every line to job end, demob included · fencing’s remaining programme is the one estimate still to come';",
               "basis.textContent = 'All in · every line to job end, demob included · fencing’s demob is the one estimate still to come, and Advanced’s relocation and removal hours are not priced yet';", 'P&L card line', 'page')
    text = rep(text, "' h on the running sheet, hours only, not priced (the project manager, 23 Oct 2026)'", "' h · hours only, not priced'", 'Coates wages row', 'page')
    js = (HERE / 'pl1218_src.js').read_text(encoding='utf-8').rstrip()
    end = "W.FenceOnce1216 = Object.freeze({version: 'v12.16', name: NAME});\n})(window);\n</script>\n</body>\n</html>"
    text = rep(text, end, end.replace('</script>\n</body>', '</script>\n' + js + '\n</body>'), 'P&L tidy script', 'page')
    return rep(text, "+' · v12.17'; /* v8.19 release922", "+' · v12.18'; /* v8.19 release922", 'release footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print("patch_v1218 applied: Advanced's receipted orders outside the programme weeks in the fencing cost; P&L wording; footer v12.17 -> v12.18")
