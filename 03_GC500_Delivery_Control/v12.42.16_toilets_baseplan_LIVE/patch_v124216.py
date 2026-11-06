"""v12.42.16 - 9968955 toilets at Baseplan's figures (Andrew, 28 Oct 2026: "Make our Match Baseplan", "now this one 9968955"):
tank pump-outs 24 x $624.60 = $14,990.40 (site record 18: 6 tanks x 3 nights); sewer-connect clean & restock 24 x $260.25 =
$6,246.00 (site record 33: 11 blocks x 3 nights); FWF install & demob $16,762.40 = 9968955/146 $15,814.96 + 9994954/23 $947.44
(our ticks $16,614.68: 228 FWF, the 8 team FWF held out). The site record keeps its own counts; the charge is Baseplan's.
Author: Andrew Fisher. Footer v12.42.16.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

SV0 = "function servicing748Total(){ const s = servicing748(); return s ? s.total : 0; }"
SV1 = (SV0 + "\n/* v12.42.16: tank pump-outs and sewer-connect cleans at Baseplan 9968955's counts (Andrew, 28 Oct 2026) */\n"
       ";(function(){ const S0 = servicing748; const FIX = {'service|Tank Pump Out & Clean & Restock': 24, 'service|Sewer Connect Units Clean & Restock': 24}; const c = v => Math.round(v * 100) / 100;\n"
       " servicing748 = function(){ const s = S0.apply(this, arguments); if (!s || !Array.isArray(s.lines)) return s; let hit = false;\n"
       "  const fix = l => { const q = FIX[l.key]; if (q == null || l.qty === q) return l; hit = true; return Object.assign({}, l, {qty: q, amount: c(q * l.rate), qty_site12416: l.qty, baseplan12416: 'Baseplan 9968955: ' + q + ' at $' + l.rate + ' (site record ' + l.qty + '; Andrew, 28 Oct 2026)'}); };\n"
       "  const lines = s.lines.map(fix), card = (s.card_lines || []).map(fix); if (!hit) return s;\n"
       "  return Object.assign({}, s, {lines, card_lines: card, card_total: c(card.reduce((t, l) => t + l.amount, 0)), total: c(lines.reduce((t, l) => t + l.amount, 0))}); };\n"
       " try { window.servicing748 = servicing748; } catch (e) {} })();")
L0 = " let labour = standalone1228.total, labourTicks"
L1 = " let fwf12416 = 0; let labour = standalone1228.total, labourTicks"
T0 = "if (l.labour && l.labour.ticked.length && !l.held1152) { labourTicks += l.labour.ticked.length; /* v12.42.13: a held reference's ticks are not charged */ if (l.labour.total != null) labour += l.labour.total;"
T1 = "if (l.labour && l.labour.ticked.length && !l.held1152) { labourTicks += l.labour.ticked.length; /* v12.42.13: a held reference's ticks are not charged */ if (l.labour.total != null) { labour += l.labour.total; if (l.item === 'FWF') fwf12416 += l.labour.total; }"
E0 = " cardHire += (t.lines || []).reduce((s, l) => s + (l.total || 0), 0) + (t.accessories_known || 0); });\n"
E1 = E0 + " /* v12.42.16: FWF install & demob at Baseplan's $16,762.40 (9968955/146 + 9994954/23; Andrew, 28 Oct 2026) */ if (fwf12416 > 0) labour += 16762.40 - fwf12416;\n"
FOOT = ("+' · v12.42.15'; /* v8.19 release922", "+' · v12.42.16'; /* v8.19 release922")


def patch(t, path='page'):
    for a, b, what in ((SV0, SV1, 'servicing counts'), (L0, L1, 'fwf counter'), (T0, T1, 'fwf sum'), (E0, E1, 'fwf to Baseplan'), FOOT + ('footer',)):
        if t.count(a) != 1: raise ValueError(what + ': not found once (%d)' % t.count(a))
        t = rep(t, a, b, what, path)
    return t


if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text(encoding='utf-8'), str(p)), encoding='utf-8'); print('patch_v124216 applied')
