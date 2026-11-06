"""Author: Andrew Fisher. v11.28 - the servicing panel's reference tables read: one dark table, bright text, "not yet" in amber.

Andrew, 23 Oct 2026 (a screenshot of the page's Servicing tab): "Also need to make this status data darker  can see writing".

Why it was pale: the panel wears the v11.04 race skin (svc1104-race-style), which paints the servicing card dark and the
table text light (names #dae9f0, "not yet" #c4d7e1, dashes #a6c1cf on a #161b1e table). On the page the table's body rows
come through white underneath, so that light text sits on white and all but vanishes - the reference names, the unit
lines, "not yet" and the dashes alike. The panel's own earlier rules (slate on white) lose to the skin on cascade order.

v11.28 adds a style block at the end of the page, after every skin: the table is one dark surface (the skin's #161b1e)
from head to foot - rows, cells and the done rows' green included - and the text on it is bright: reference names white,
unit lines light grey, "not yet" bold amber on a dark amber tint so a job not done is the first thing seen, the dash for a
job the line does not have in a quiet grey, a done time bright green. Page-side only: the crew card is unchanged, so no
tracker republish. Footer v11.27 -> v11.28.

    python3 patch_v1128.py page.html      (in place, on the live v11.27 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()

STYLE = ('<style id="svc1128-style">/* v11.28 - the servicing panel tables read (Andrew, 23 Oct 2026: "make this status data darker  can see writing"):\n'
         '   one dark table, bright text; the race skin\'s light text had been landing on white rows */\n'
         '#svc1067 .svc-tbl,#svc1067 .svc-tbl tbody,#svc1067 .svc-tbl tbody tr,#svc1067 .svc-tbl tbody th,#svc1067 .svc-tbl tbody td{background:#161b1e;color:#e6f1f6}\n'
         '#svc1067 .svc-tbl thead th{background:#203c48;color:#f6fcff}\n'
         '#svc1067 .svc-tbl tbody th b{color:#ffffff}\n'
         '#svc1067 .svc-tbl tbody th span,#svc1067 .svc-tbl tbody th em{color:#c9dae3}\n'
         '#svc1067 .svc-tbl tbody th em.fin,#svc1067 .svc-tbl td.ok{color:#8cf5c0}\n'
         '#svc1067 .svc-tbl td.no{color:#ffc97a;background:#2e2410;font-weight:800;font-size:12px}\n'
         '#svc1067 .svc-tbl td.na{color:#8ea3b0}\n'
         '#svc1067 .svc-tbl tr.done,#svc1067 .svc-tbl tr.done th,#svc1067 .svc-tbl tr.done td{background:#13302a}\n'
         '#svc1067 .svc-tbl tr{border-bottom:1px solid #2f4450}\n'
         '#svc1067 .svc-tbl td{border-left:1px solid #2f4450}\n'
         '</style>\n')


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.28 requires the live v11.27 page ' + BASE_SHA256)
    if 'svc1128-style' in text: raise ValueError('v11.28 already applied')
    k = text.rfind('</body>')   # the page's own; embedded documents carry their own earlier
    if k < 0 or text.find('</html>', k) < 0 or len(text) - k > 200: raise ValueError('the page end is not where expected')
    text = text[:k] + STYLE + text[k:]
    text = rep(text, "+' · v11.27'; /* v8.19 release922", "+' · v11.28'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i)
    if 'svc1128-style' in text[i:j]: raise ValueError('the rules landed inside the crew card')
    if text.rfind('<style id="svc1128-style">') < text.rfind('<style id="svc1112-glow">'): raise ValueError('the v11.28 style must come after every skin')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1128 applied: servicing panel tables one dark surface with bright text, "not yet" in amber; footer v11.27 -> v11.28')
