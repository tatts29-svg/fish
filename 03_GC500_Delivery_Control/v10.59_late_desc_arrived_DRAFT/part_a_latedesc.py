"""Author: Andrew Fisher. v10.59 part A - Coates on time names what was late by its reference and description.

Andrew, 17 Oct 2026: "Do we know what was late and by how late is what we need to know what was late. What description
it relates too".

- Each late or failed line in More info leads with the reference and its own description on the record (the drawer's
  name, typed or the schedule's), then the item, the window given, the time done and how late:
  "P60 Gate 5 Ticket Box · Ticket box · window 05:30–08:30 · done 08:56 · 26 min late". A booking the texts tie to
  one of several references names each: "one of P01 iEDM Engineering Office or P03 SCA Event Management Office".
- The card names them too, under "1 late": one short line each ("P60 Gate 5 Ticket Box · 26 min late"); with more
  than four, the first three and "+n more · More info". The card button reads them out.
- The on-time, set-aside and no-delivered-text lists name the reference and description the same way.

Patches the v10.58 page's ontime1057 script in place (rep, each old string exactly once). No record change.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

WHO = " const who = u => u.r && u.r.length === 1 ? u.r[0] : u.r && u.r.length ? 'one of ' + u.r.join('/') : 'no reference on the page';\n"
PATCHES = [
    ('ontime: what it relates to (reference + its description)', WHO, WHO + r""" /* v10.59 - what it relates to: the reference and its own description on the record (Andrew, 17 Oct 2026: "what was late and by how late ... What description it relates too") */
 const descOf = ref => { let a = null; try { a = assetOf(ref); } catch (x) { a = null; } const n = a ? String(a.name || '').trim() : ''; return n && n !== ref ? n : ''; };
 /* no description on the record: the item stands in (never a location string, which can hold unit numbers) */
 const named = (ref, item) => { const d = descOf(ref); return ref + ' ' + (d || item || ''); };
 /* a "one of" booking the site record paired (its time done is that reference's site time) is that reference */
 const what = (u, r) => r && r.src === 'site' && r.site && r.site.ref ? named(r.site.ref, u.k).trim() : u.r && u.r.length === 1 ? named(u.r[0], u.k).trim() : u.r && u.r.length ? 'one of ' + u.r.map(x => named(x, u.k).trim()).join(' or ') : u.k;
"""),
    ('ontime: late line leads with the reference and description',
     "const u = r.u, bits = ['<b>' + e((u.k === u.c ? u.c : u.c + ' · ' + u.k) + ' · ' + who(u)) + '</b>', e('window ' + win(u.w))];",
     "const u = r.u, bits = ['<b>' + e(what(u, r)) + '</b>', e(u.k), e('window ' + win(u.w))];"),
    ('ontime: the card lists what was late',
     " function cardRow(iso){\n",
     r""" /* one reference twice in a day: say which item */
 function namer(rows){ const seen = {}; rows.forEach(r => { const k = what(r.u, r); seen[k] = (seen[k] || 0) + 1; }); return r => { const k = what(r.u, r); return seen[k] > 1 && k.indexOf(r.u.k) < 0 ? k + ' · ' + r.u.k : k; }; }
 /* v10.59 - the card names what was late, one short line each, in the order More info lists them */
 function lateHtml(M){
  const bad = M.failed.concat(M.late); if (!bad.length) return '';
  const head = [M.late.length ? M.late.length + ' late' : '', M.failed.length ? M.failed.length + ' failed' : ''].filter(Boolean).join(', ');
  const by = r => r.failed ? 'not delivered' : r.laterDay ? 'done ' + dd(r.u.td) : dur(r.lateBy) + ' late';
  const show = bad.length > 4 ? bad.slice(0, 3) : bad, name = namer(bad);
  return '<span class="ot1057-why">' + e(head) + '</span>' + show.map(r => '<span class="ot1059-late"><b>' + e(name(r)) + '</b> · ' + e(by(r)) + '</span>').join('') +
   (bad.length > show.length ? '<span class="ot1059-late ot1059-more">+' + (bad.length - show.length) + ' more · More info</span>' : '');
 }
 function cardRow(iso){
"""),
    ('ontime: card row uses the list',
     "(why ? '<span class=\"ot1057-why\">' + e(why) + '</span>' : '<span class=\"bc984-at-close\">ALL WITHIN THE WINDOW GIVEN</span>')",
     "(why ? lateHtml(M) : '<span class=\"bc984-at-close\">ALL WITHIN THE WINDOW GIVEN</span>')"),
    ('ontime: the card button reads them out',
     "(!bad.length ? '' : bad.length === 1 ? ' ' + (bad[0].failed ? '1 failed: ' : bad[0].laterDay ? '1 late: ' : '1 late: ') + bad[0].u.k + (bad[0].lateBy > 0 ? ', ' + said(bad[0].lateBy) : '') + '.' :\n   ' ' + [M.late.length ? M.late.length + ' late' : '', M.failed.length ? M.failed.length + ' failed' : ''].filter(Boolean).join(', ') + ': ' + Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => c + ' ' + n).join(', ') + '.');",
     "(!bad.length ? '' : ' ' + [M.late.length ? M.late.length + ' late' : '', M.failed.length ? M.failed.length + ' failed' : ''].filter(Boolean).join(', ') + ': ' +\n   M.failed.concat(M.late).map((r, i, all) => namer(all)(r) + ', ' + (r.failed ? 'not delivered' : r.laterDay ? 'delivered ' + dd(r.u.td) : said(r.lateBy) + ' late')).join('; ') + '.');"),
    ('ontime: on-time list names the reference and description',
     "e(M.ontime.map(r => r.u.k + ' · ' + who(r.u) + ' · window ' + win(r.u.w) + ' · done ' + ck(r.arr)).join('; '))",
     "e(M.ontime.map(r => what(r.u, r) + ' · ' + r.u.k + ' · window ' + win(r.u.w) + ' · done ' + ck(r.arr)).join('; '))"),
    ('ontime: set-aside names the reference and description',
     "'<li class=\"ot1057-li\"><span><b>' + e((u.k === u.c ? u.c : u.c + ' · ' + u.k) + ' · ' + who(u)) + '</b> · ' + e('window ' + win(u.w)",
     "'<li class=\"ot1057-li\"><span><b>' + e(what(u)) + '</b> · ' + e(u.k + ' · window ' + win(u.w)"),
    ('ontime: no-delivered-text names the reference and description',
     "return u.k + ' · ' + who(u) + ' · window ' + win(u.w) + (seen.length",
     "return what(u) + ' · ' + u.k + ' · window ' + win(u.w) + (seen.length"),
    ('ontime: card list style',
     "  ':is(#pane-timeline) .ot1057-more .ot1057-head strong{font-size:1.15em}' +",
     "  ':is(#pane-timeline) .ot1059-late{display:block;margin-top:2px;font-size:11.5px;font-weight:500;letter-spacing:.01em;line-height:1.35;text-transform:none;color:#ffe2b8;white-space:normal;overflow-wrap:anywhere}' +\n"
     "  ':is(#pane-timeline) .ot1059-late b{font-weight:700;color:#fff}' +\n"
     "  ':is(#pane-timeline) .ot1059-more{opacity:.8;font-style:italic}' +\n"
     "  ':is(#pane-timeline) .ot1057-more .ot1057-head strong{font-size:1.15em}' +"),
    ('ontime: version', "W.ontime1057 = {version: 'v10.57',", "W.ontime1057 = {version: 'v10.59', what,"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if 'ot1059-late' in t: sys.exit('part_a refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('part_a applied: late lines and card name the reference and its description')
