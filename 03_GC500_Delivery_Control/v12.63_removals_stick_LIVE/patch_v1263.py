"""Author: Andrew Fisher. v12.63 - a history entry taken off stays off.

Andrew, 30 Oct 2026: WC41's superseded 28 Oct departure entry, taken out at 11:55 (run 82) and again at 13:06 (run 91),
came back at 10:34, 12:42 and 14:05 from copies of the page that still held it. The page keeps its own saved copy of the
record on every device and merges it with the service on every load; histories merge as a union keyed by state|at, so an
entry one side still holds is put back, and refreshing the page cannot clear it (the 14:05 save followed a page load by
three seconds). This release teaches the merge the record's own tombstone for a history entry: deleted['hist/<ref>/<state>|<at>']
beats the entry on both sides, as a deleted docket's tombstone beats the docket, and the page's own `back/` undo still
puts it back. `record_26Oct2026_departures/left_site.cjs` writes that tombstone through the page's own tomb() when it
removes or withdraws a departure entry.

- one line of mergeRecords changes: the delivery history union skips entries whose tombstone is set (both sides).
- footer v12.61 -> v12.63 (v12.62, the P&L tab, is a separate release still queued on Andrew's word).

    python3 patch_v1263.py page.html      (in place, on the live v12.61 page; BASE is its verified SHA-256)
"""
import hashlib, re, sys
from pathlib import Path
BASE = 'ddd1bd7adaf8c9a3749404829d01493c7373e67a43762b8391a1568cf239ba90'  # live v12.61, public GET 30 Oct 2026 04:52 AEST
FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")
OLD = "const H = hist(a.history, b.history, h => h.state + '|' + h.at); if (H.length) m.history = H;"
NEW = ("/* v12.63 - a history entry taken off by name stays off: the record's own tombstone, deleted['hist/<ref>/<state>|<at>'], beats the\n"
       " entry on both sides, as a deleted docket's does, so a copy of the page that still holds the entry cannot put it back at the next merge;\n"
       " the page's own back/ undo on the same id puts it back */\n"
       " const gone1263 = h => !!h && tombed(out, 'hist/' + k + '/' + h.state + '|' + h.at);\n"
       " const H = hist((a.history || []).filter(h => h && !gone1263(h)), (b.history || []).filter(h => h && !gone1263(h)), h => h.state + '|' + h.at); if (H.length) m.history = H;")


def patch(text):
    if 'gone1263' in text: raise ValueError('v12.63 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE: raise ValueError('Live base is not the verified v12.61; rebuild and retest')
    n = text.count(OLD)
    if n != 1: raise ValueError('the history merge line is not where v12.63 expects it (found %d)' % n)
    text = text.replace(OLD, NEW)
    found = FOOTER.findall(text)
    if found != ['v12.61']: raise ValueError('release footer: expected one v12.61 footer, found ' + repr(found))
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.63'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1263 applied: a history entry taken off stays off (tombstones in the delivery history merge); footer v12.61 -> v12.63')
