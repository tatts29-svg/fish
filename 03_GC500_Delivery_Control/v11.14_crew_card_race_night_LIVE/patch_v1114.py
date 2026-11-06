"""Author: Andrew Fisher. v11.14 - the crews' QR pages, race-night: dark, glowing, and every total says how much is to go.

Andrew, 22 Oct 2026: "Lets work on the qr pages where they click complete.. lets glow this up and darken this up push your
limits with this one. Lets make this look good. We want the teams to know whats been done. How much more to go."

The crew card (the page every printed servicing QR opens, /d/<token>) is built from servicing_tracker_DRAFT/card/
(card.css, card_src.js, build_card.js) and carried on this page as SVC1067_CARD.html, the template the Servicing tab's
"Create / update event tracker" posts under the EXISTING token - so the printed codes stay exactly as they are (the
service keeps the tracker key; the admin read-back checks key_kept). This patch swaps that template for the v3 card:

  - race-night dark, always (no light mode): Coates orange for what is next, green glow for what is done;
  - the header strip and every progress block say the percentage AND "N to go" (jobs and references), green when done;
  - a ticked job glows green with its time; Save & close pulses orange; a finished area glows green;
  - the completion page lists "Still to go in Area n" by reference, with each one's jobs done so far;
  - the area list (no code) shows each area's to-go count; the per-task rows say "N to go".
  Same ids, classes, data attributes, ticks, outbox, service worker and codes as v2; the card's own suite is 46/46.
Nothing else on the page changes. Footer v11.13 -> v11.14. After upload, the live card is re-posted under its token
from the edit link (update_card.cjs beside this file) - the printed sheets are untouched.

    python3 patch_v1114.py page.html      (in place, on the live v11.13 page)
"""
import hashlib, json, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '3be11b11ca40423ce957d49ea0719b85568071d5fc6cfee2b8660f21c947a816'
CARD = HERE.parent / 'servicing_tracker_DRAFT' / 'card'

BUILD_JS = r'''
const B = require(process.argv[1]); const fs = require('fs');
const D = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const data = B.cardData(D), html = B.buildCardHtml(D), mark = 'var D = ' + B.scriptJson(data) + ';';
if (html.split(mark).length !== 2) throw new Error('data line not found once in the built card');
process.stdout.write(JSON.stringify({html: html.replace(mark, 'var D = /*SVC1067_DATA*/null;'), hash: B.cardScriptHash(html)}));
'''


def template():
    """the v3 crew card template, built the way v10.67 built the first one: the card with its data line as the placeholder"""
    r = subprocess.run(['node', '-e', BUILD_JS, str(CARD / 'build_card.js'), str(CARD.parent / 'tracker_data.json')], capture_output=True, text=True, check=True)
    out = json.loads(r.stdout)
    html = out['html']
    if html.count('<script>') != 1 or html.count('/*SVC1067_DATA*/null') != 1: raise ValueError('template must carry one script with the data placeholder')
    if 'svc-sheen' not in html or 'left-list' not in html or 'togoHtml' not in html: raise ValueError('this is not the v3 card')
    return html


def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.14 requires the live v11.13 page ' + BASE_SHA256)
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i)
    if i < 0: raise ValueError('SVC1067_CARD not on the page')
    line = text[i:j]
    if not line.endswith(';'): raise ValueError('SVC1067_CARD line shape')
    bundle = json.loads(line[len('var SVC1067_CARD='):-1])
    if set(bundle.keys()) != {'data', 'html'}: raise ValueError('bundle keys ' + str(list(bundle.keys())))
    old_html = bundle['html']
    if 'svc-sheen' in old_html: raise ValueError('v11.14 already applied')
    bundle['html'] = template()
    # the same encoding v10.67 used for the bundle (JSON with '<' escaped so the line can live inside a <script>)
    enc = json.dumps(bundle, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    # sanity: the data part is byte-for-byte what was there
    old_data = json.dumps(json.loads(line[len('var SVC1067_CARD='):-1])['data'], sort_keys=True)
    if json.dumps(bundle['data'], sort_keys=True) != old_data: raise ValueError('card data must not change')
    text = text[:i] + 'var SVC1067_CARD=' + enc + ';' + text[j:]
    text = rep(text, "+' · v11.13'; /* v8.19 release922", "+' · v11.14'; /* v8.19 release922", 'release footer', 'page')
    print('v11.14: crew card template %d -> %d bytes' % (len(old_html), len(bundle['html'])))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
