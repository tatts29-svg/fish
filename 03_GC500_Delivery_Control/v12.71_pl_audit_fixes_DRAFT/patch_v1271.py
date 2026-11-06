"""Author: Andrew Fisher. v12.71 - the P&L tab: the independent audit's findings taken forward.

The independent read-only audit of the live P&L (review_31Oct2026_pl_independent/, 31 Oct 2026, on Andrew's word "Codex needs to
be doing the audit i approve") passed 175 arithmetic checks and named three things to fix before the P&L goes to management, and
a cue to add. Handed to this module's author to implement (PR #1, 6536684611). What this release changes, on the live v12.69 page
(BASE is its verified SHA-256):

1. The Costs & P&L Print button printed the twin-steer refusal page and nothing else. Since v11.35 switched the ask off (Andrew,
   23 Oct 2026), armed() has been true, so a print went straight through - but nothing set the html.ts1053-armed flag the print
   stylesheet reads, and that stylesheet hides every element but the refusal page unless the flag is on. Reproduced on the live
   page: a two-page PDF of the warning, no figure on it. Fix, inside the twin-steer module: flag() sets the flag whenever a print is
   allowed - on load, before every print the page starts (the Print buttons, Ctrl+P, the browser's own menu through beforeprint)
   and again after a print closes (disarm() re-sets it). The rule down the edge of every printed page (the strip) and the stamp on
   the page's PDFs stay as they were; the pre-dispatch checklist's own arming is unchanged; nothing asks a question that v11.35
   switched off.
2. The face's small print (the transport split by branch, the sub-hire suppliers' estimates) said each part to the dollar, so
   parts need not add to their line; they now say cents (money, not money0).
3. The by-branch cards are named the management view. Under them, Finance's invoicing view - the handover's own figures,
   revenue by the branch on the hire contracts and costs by its own split - and the move that bridges it to the cards, branch by
   branch, with a tick that the bridge foots to the cent. No branch attribution changes anywhere: the handover and its CSV keep
   the contract branches.
4. One line under the cost table: what inside "so far" is carried at quotes or estimates (in the lines' own words), and what job
   end adds as forecast.
5. From Codex's independent review of the first candidate (PR #1, 6537377974): the Finance handover card keeps its cents (money,
   not money0, in fh866Html); the folded branch table is named the management view; the transport split reads "job end by
   branch"; and, from its optional polish, the page's print note says "printed" where it said "asset map printed" on every print.
6. Revenue stays on the branch that invoices it. Andrew, 31 Oct 2026, answering whether the people's event labour revenue should
   follow them onto KINP (an inference from his 29 Oct ruling, never his word): "Things stay in the branch. But we can align labour
   to correct branch costs if that makes sense". The management view no longer moves that revenue, so its revenue is Finance's on
   every branch and the bridge carries one move only, the people's travel, accommodation and meals to KINP (his 29 Oct ruling on
   costs). Aligning labour costs to the branch of the work is a separate step on his word, shift by shift.
7. Footer v12.69 -> v12.71.

Nothing is typed; nothing is written to the record. The pl1267 style and script keep their ids; the block is replaced whole.

    python3 patch_v1271.py page.html      (in place, on the live v12.69 page)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = '038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb'  # live v12.69, public GET 31 Oct 2026 10:2x AEST
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def sub1(text, old, new, what):
    n = text.count(old)
    if n != 1: raise ValueError('%s: expected the anchor once, found %d: %r' % (what, n, old[:80]))
    return text.replace(old, new)


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.69; rebuild and retest')
    if 'pl1267-bridge' in text or 'W.ts1053 = {armed, arm, disarm, ask, flag,' in text: raise ValueError('the v12.71 changes are already applied')

    # 1. the print flag, inside the twin-steer module (every anchor once)
    i = text.index('<script id="twinsteer1053-script">'); j = text.index('</script>', i)
    mod = text[i:j]
    mod = sub1(mod, " function disarm(){ G.until = 0; D.documentElement.classList.remove('ts1053-armed'); }",
               " function disarm(){ G.until = 0; D.documentElement.classList.remove('ts1053-armed'); const s = D.getElementById('ts1053-strip'); if (s) s.textContent = SHORT; flag(); }\n"
               " /* v12.71 - the print flag the print stylesheet reads. With the ask off (v11.35) nothing set it, so every print the page\n"
               "    started showed the refusal page and nothing else (the independent audit of 31 Oct 2026, finding 1). Set whenever a print is\n"
               "    allowed: on load, before every print, and again after one closes. The rule down the edge of every printed page stays; after\n"
               "    a checklist print closes it goes back to the rule alone, so a later print never carries that checklist's name. */\n"
               " function flag(){ if (armed()) D.documentElement.classList.add('ts1053-armed'); }", 'disarm and flag')
    mod = sub1(mod, " W.print = function(){ if (armed()) return realPrint(); ask(", " W.print = function(){ if (armed()) { flag(); return realPrint(); } ask(", 'the print wrapper')
    mod = sub1(mod, "if (armed()) realPrint(); else ask(() => realPrint()); } }, true);", "if (armed()) { flag(); realPrint(); } else ask(() => realPrint()); } }, true);", 'Ctrl+P')
    mod = sub1(mod, " W.addEventListener('beforeprint', () => { lockedPrint = !armed(); });", " W.addEventListener('beforeprint', () => { lockedPrint = !armed(); flag(); });", 'beforeprint')
    mod = sub1(mod, " D.head.appendChild(st);\n W.ts1053 = {armed, arm, disarm, ask, stats: G, SHORT, SMS, CHECK_ID};",
               " D.head.appendChild(st);\n flag(); /* v12.71 */\n W.ts1053 = {armed, arm, disarm, ask, flag, stats: G, SHORT, SMS, CHECK_ID};", 'the module end')
    if mod.count('flag()') != 6: raise ValueError('flag(): expected the definition and five calls in the module, found %d' % mod.count('flag()'))
    text = text[:i] + mod + text[j:]

    # 2b. the Finance handover card keeps its cents (Codex's independent review, PR #1 6537377974): inside fh866Html only, every
    #     figure through money, not money0; categories, hours and source branches unchanged
    a = text.index('function fh866Html(){'); b = text.index('\nfunction ', a + 10)
    card = text[a:b]
    if card.count('money0(') != 20: raise ValueError('fh866Html: expected 20 money0 figures, found %d' % card.count('money0('))
    card = card.replace('money0(', 'money(')
    text = text[:a] + card + text[b:]
    if 'money0(' in text[a:a + len(card)]: raise ValueError('fh866Html still rounds a figure to the dollar')

    # 2c. the page's own print note said "asset map printed" on every print, the P&L included (Codex's review, optional polish):
    #     "printed" is true of every print; the provenance after it (dataset, shared record) is unchanged
    text = sub1(text, "' · asset map printed '", "' · printed '", 'the print note')

    # 2-4. the face: the pl1267 block replaced whole, ids kept
    a = text.index('<style id="pl1267-style">')
    b0 = text.index('<script id="pl1267-script">', a)
    b = text.index('</script>\n', b0) + len('</script>\n')
    old = text[a:b]
    if old.count('<script') != 1 or old.count('<style') != 1 or 'var PL1267' not in old: raise ValueError('the pl1267 block is not what was expected')
    js = (HERE / 'pl1267_src.js').read_text(encoding='utf-8').rstrip()
    css = (HERE / 'pl1267.css').read_text(encoding='utf-8').rstrip()
    for need in ('pl1267-bridge', 'finRev', 'softNow', 'THE MANAGEMENT VIEW'):
        if need not in js: raise ValueError('the face source is missing ' + need)
    if 'money0(' in js: raise ValueError('the face still rounds to the dollar somewhere')
    block = '<style id="pl1267-style">\n' + css + '\n</style>\n<script id="pl1267-script">\n' + js + '\n</script>\n'
    text = text[:a] + block + text[b:]
    if text.count('<script id="pl1267-script">') != 1 or text.count('<style id="pl1267-style">') != 1: raise ValueError('the pl1267 block is not in once')

    # 5. footer
    found = FOOTER.findall(text)
    if found != ['v12.69']: raise ValueError('release footer: expected one v12.69 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.71'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1271 applied: the print flag set whenever a print is allowed; cents in the small print; the management view named with Finance\'s invoicing view and the bridge under it; the quotes-and-estimates cue; footer v12.69 -> v12.71')
