"""Author: Andrew Fisher. v11.52 - not charged here: the six references on their own hire schedules (T0024 HS 9977412 &
9968929; T0162 HS 9977410; T0176 HS 9989424; BJR01 HS 9983884; SVP01 HS 9980337; PG29 / Tickford HS 9990100) are held out
of every charge and cost on the page while still tracked; the labour on a waste tank is one charge with its toilet block.

Andrew, 23 Oct 2026: "Labour on waste tanks is one charge inclusive with the toilet block. and these are not to be charged
these are on different contract we can make note and remove any charges to do with these please related to these
references we will obviously still track like we have been doing etc. but we wont include these costs in anything we do
on here ok, T0024 are on HS# 9977412 & 9968929, T0162 are on HS# 9977410, T0176 are on HS# 9989424, BJR01 are on HS#
9983884, SVP01 are on HS# 9980337, Tickford on HS# 9990100".

What changes: one new script block (notcharged1152.js, inserted before the spot1117 block, after every function it
wraps) wraps the money primitives - labourLinesFor (lines kept, money nought, on the six references and on every waste
tank), assetTotal (hire, accessories, labour, card transport at nought on the six), nightService1040 (no event-night
servicing charge, so no supplier servicing cost either), the transport inputs (legs excluded before the model prices
them, as Coates' own use is), contractTreatment747 (contract 9968929 line 5, the same asset 1257261 renamed by Baseplan,
keeps its 1 Oct own-use treatment) and arrivedChargesHtml975 (the drawer's charges table says Not charged here). Twelve
text edits: the tick wording and the drawer's hire line say why, the Pricing tab prices the job without the six and lists
them, the P&L summary and the Where-we-are money cards and the text export carry a "Not charged here" line. No record
change; the trackers, lights, servicing areas and positions are untouched. Footer v11.51 -> v11.52.

    python3 patch_v1152.py page.html      (in place, on the live v11.51 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
BLOCK = (HERE / 'notcharged1152.js').read_text(encoding='utf-8')
ANCHOR = '<script id="spot1117-script">'
WRAPPED = ['function assetTotal(', 'function labourLinesFor(', 'const OWN1050 = new Set', 'function nightService1040(', 'function otherTransportInput831(',
           'function buildingTransportInput831(', 'function contractTreatment747(', 'function arrivedChargesHtml975(', 'function labourTicksHtml(',
           'function renderPricing_held(', 'function moneySummary_(', 'function openAssetDraw(']

EDITS = [
    # the tick wording: a held reference's lines and a waste tank's lines say why they price at nought
    (": L.money === 'zero' ? '$0.00 on the card'",
     ": L.money === 'zero' ? (L.held1152 ? 'not charged here' : L.included1152 ? 'one charge with the toilet block' : '$0.00 on the card')", 'tick words'),
    ("const said = m.blocked ? esc(m.why || 'ticked, and the money is not known')",
     "const said = info.held1152 ? esc(info.held1152) : info.included1152 ? esc(info.included1152) : m.blocked ? esc(m.why || 'ticked, and the money is not known')", 'tick summary words'),
    ("const exp = labourPlan().slots.filter(s => s.ref === a.key && s.item === l.item && s.state !== 'charged' && s.value != null);",
     "const exp = labourPlan().slots.filter(s => s.ref === a.key && s.item === l.item && s.state !== 'charged' && s.value);", 'still-to-tick words skip nought lines'),
    # the Pricing tab prices the job without the six, and says so where it says which references are out
    ("const assets = allAssets().filter(a => !a._cancelled);\n const cancelled = allAssets().filter(a => a._cancelled);",
     "const held1152 = allAssets().filter(a => !a._cancelled && NotChargedHere1152.has(a.key)); /* v11.52 - on their own hire schedules: tracked, not priced here */\n const assets = allAssets().filter(a => !a._cancelled && !NotChargedHere1152.has(a.key));\n const cancelled = allAssets().filter(a => a._cancelled);", 'pricing without the held references'),
    ("cancelled.length === 1 ? 'it is' : 'they are'}still on Equipment, on the drawings and in the history, and each one still needs taking off hire if it ever went on.` : ''}</div></div>",
     "cancelled.length === 1 ? 'it is' : 'they are'}still on Equipment, on the drawings and in the history, and each one still needs taking off hire if it ever went on.` : ''}${held1152.length ? `. <span class=\"nomark\">${noGlyph(11)}</span> <b>${held1152.length} reference${held1152.length === 1 ? '' : 's'} on ${held1152.length === 1 ? 'its' : 'their'} own hire schedule${held1152.length === 1 ? '' : 's'}</b> (${esc(held1152.map(a => a.key + ' · HS ' + NotChargedHere1152.hs(a.key)).join(', '))}) ${held1152.length === 1 ? 'is' : 'are'} tracked here and not priced here — a different contract, charged there (the project manager, 23 Oct 2026).` : ''}</div></div>", 'pricing note'),
    # the P&L carries the words
    ("return {as_at: day, charge, cost, difference, difference0, missing, missing_short: short, caveats, caveats_short, streams, categories, breakeven, breakeven_hours: hrsOut,",
     "return {as_at: day, charge, cost, difference, difference0, missing, missing_short: short, caveats, caveats_short, streams, categories, breakeven, breakeven_hours: hrsOut,\n excluded1152: typeof NotChargedHere1152 !== 'undefined' ? NotChargedHere1152.summary() : null, /* v11.52 */", 'summary names what is not charged here'),
    ("${(M.caveats || []).map(x => `<li class=\"prov\">Provisional: ${esc(x)}</li>`).join('')}</ul>",
     "${(M.caveats || []).map(x => `<li class=\"prov\">Provisional: ${esc(x)}</li>`).join('')}${M.excluded1152 ? `<li class=\"held1152\">Not charged here: ${esc(M.excluded1152.words)}.</li>` : ''}</ul>", 'P&L not-in-it list'),
    ("${M.caveats.length ? ` <b>Provisional in the figure:</b> ${esc(M.caveats.join('; '))}.` : ''}</p>",
     "${M.caveats.length ? ` <b>Provisional in the figure:</b> ${esc(M.caveats.join('; '))}.` : ''}${M.excluded1152 ? ` <b>Not charged here:</b> ${esc(M.excluded1152.words)}.` : ''}</p>", 'costs ledger hint'),
    ("${M.caveats.length ? ` <b>Provisional:</b> ${esc(M.caveats.join('; '))}.` : ''}</p>`)}</div>\n </div>\n <div class=\"mcard ledgerc\"",
     "${M.caveats.length ? ` <b>Provisional:</b> ${esc(M.caveats.join('; '))}.` : ''}${M.excluded1152 ? ` <b>Not charged here:</b> ${esc(M.excluded1152.short)}.` : ''}</p>`)}</div>\n </div>\n <div class=\"mcard ledgerc\"", 'money card note'),
    ("${M.caveats.length ? ` <b>Provisional:</b> ${esc(M.caveats.join('; '))}.` : ''} Every line of both sides is on the Costs &amp; P&amp;L tab.</p>",
     "${M.caveats.length ? ` <b>Provisional:</b> ${esc(M.caveats.join('; '))}.` : ''}${M.excluded1152 ? ` <b>Not charged here:</b> ${esc(M.excluded1152.short)}.` : ''} Every line of both sides is on the Costs &amp; P&amp;L tab.</p>", 'money card note (long)'),
    ("if (M.caveats_short && M.caveats_short.length) lines.push(`PROVISIONAL: ${M.caveats_short.join('; ')}`);",
     "if (M.caveats_short && M.caveats_short.length) lines.push(`PROVISIONAL: ${M.caveats_short.join('; ')}`);\n if (M.excluded1152) lines.push(`NOT CHARGED HERE: ${M.excluded1152.words}.`); /* v11.52 */", 'text export'),
    # the drawer's hire line
    ("+ (l.total != null ? ' — <b>' + money(l.total) + '</b>' : '')\n+ (l.days != null && l.per === 'day' ? '<br><span class=\"w rate941-formula\"",
     "+ (l.held1152 ? ' — <b>not charged here</b>' : l.total != null ? ' — <b>' + money(l.total) + '</b>' : '')\n+ (!l.held1152 && l.days != null && l.per === 'day' ? '<br><span class=\"w rate941-formula\"", 'drawer hire line'),
    ("return t.lines.map(l => (l.priceable ? '<b>' + l.qty + '</b> × ' : '<span class=\"chip crit\">qty not readable</span> ')",
     "return (t.held1152 ? '<span class=\"w\" style=\"font-size:11.5px;color:var(--mute)\">' + esc(t.held1152) + '</span><br>' : '') + t.lines.map(l => (l.priceable ? '<b>' + l.qty + '</b> × ' : '<span class=\"chip crit\">qty not readable</span> ')", 'drawer hire note'),
]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.52 requires the live v11.51 page ' + BASE_SHA256)
    if 'notcharged1152-script' in text: raise ValueError('v11.52 already applied')
    if text.count(ANCHOR) != 1: raise ValueError('the spot1117 block is not on the page once')
    anchor = text.index(ANCHOR)
    for d in WRAPPED:
        if text.count(d) != 1 or text.index(d) > anchor: raise ValueError('v11.52 must come after ' + d + ' (count ' + str(text.count(d)) + ')')
    for bad in ('Claude', 'Codex', 'GPT', 'Gemini'):
        if bad in BLOCK: raise ValueError('an agent name in the block: ' + bad)
    for old, new, what in EDITS: text = rep(text, old, new, what, 'page')
    text = rep(text, ANCHOR, '<script id="notcharged1152-script">\n' + BLOCK + '</script>\n' + ANCHOR, 'the block before the spot1117 script', 'page')  # after the edits: the offsets have moved
    text = rep(text, "+' · v11.51'; /* v8.19 release922", "+' · v11.52'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('notcharged1152-script', 1), ('W.NotChargedHere1152 = api', 1), ('NotChargedHere1152.has(a.key)', 2), ('excluded1152', 11), ('held1152', 22), ('included1152', 5), ("+' · v11.52'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.52 did not land cleanly: ' + needle + ' x' + str(text.count(needle)) + ' (expected ' + str(n) + ')')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1152 applied: the six references on their own hire schedules not charged here; waste-tank labour with the block; footer v11.51 -> v11.52')
