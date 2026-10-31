"""v12.42.6 - the P&L on Andrew's Baseplan (8) answers, part 2 (27 Oct 2026, "Do 1. 2 3"). Author: Andrew Fisher.

1. The Premiair VMS boards go on the branch that sub-hires them, as their own sales analysis code says
   ("move the P&L, don't recode" - "Moving P&L will be easier changing will make dockets a mess"): VMS10, VMS11 and
   VMS18-VMS23 (KINP-SUB) to KINP, VMS24 (NVAC-SUB) to NVAC. The contract lines, references and dockets are unchanged.
   Container T0266 goes to STPS on the record (setBranch, record run 37), not here.
2. WB07 is part of WB06 ("WB07 removed from scope, included in WB06"): contract 9972648 line 7 (17 barriers) is charged
   at nought; WB06's three lines (60 + 60 + 34) carry the barriers.
3. WB03 needs nothing: its contract line already starts 18 Sep 2026, the night it went in.
4. The footer reads v12.42.6.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

FOOT = ("+' · v12.42.5'; /* v8.19 release922", "+' · v12.42.6'; /* v8.19 release922")
BR = (" generatorBranch1004=function(r){const original=sourceBranch1010(r);",
 " /* v12.42.6: a sub-hired VMS board goes on the branch its sales analysis code names - Andrew, 27 Oct 2026: move the P&L, don't recode */\n"
 " generatorBranch1004=function(r){const sub12426=r&&r.family==='vms'&&r.subhired&&/^(KINP|NVAC|STPS|MEAD)-SUB$/.exec(String(r.sales_analysis_code||''));if(sub12426)return sub12426[1];const original=sourceBranch1010(r);")
WB = ("function contractCharge(r){\n const generator1004=generatorContract1004(r);if(generator1004)return generator1004;",
 "function contractCharge(r){\n const generator1004=generatorContract1004(r);if(generator1004)return generator1004;\n"
 " /* v12.42.6: WB07 is part of WB06 (Andrew, 27 Oct 2026: \"WB07 removed from scope, included in WB06\") - its line charges nought */\n"
 " if (r && r.rental_contract === '9972648' && String(r.line) === '7' && /^WB07\\b/.test(String(r.description || ''))) { const z12426 = contractCharge_747(Object.assign({}, r, {quantity: 0})); z12426.amount = 0; z12426.basis = 'WB07 is part of WB06 - Andrew, 27 Oct 2026: removed from scope, included in WB06 · ' + (z12426.basis || ''); return z12426; }")

def patch(t, path='page'):
    for a, b, what in (BR + ('VMS on their sub-hire branch',), WB + ('WB07 in WB06',), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once')
        t = rep(t, a, b, what, path)
    return t

if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v12426 applied')
