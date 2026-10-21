"""Author: Andrew Fisher. v11.15 - the crews' QR pages, v3.1: rings that fill, the chequered strip, the tick that draws itself,
the finished moment.

Andrew, 22 Oct 2026, after v11.14: "Remember i need this to look amazing.. thankyou so much".

On top of v11.14's race-night card: every percentage sits in a ring that fills as the night goes on (orange, then green
and pulsing at 100%) - in the sticky strip, the progress blocks, the area list; a chequered race strip and an orange
light line on the header; the reference ignites when the page opens; the Complete tick draws itself in green; Save &
close carries a light sweep; the Saved card has slow green rays; when the area is finished the still-to-go block becomes
an "AREA FINISHED hh:mm" stamp. Same ids, classes, data attributes, ticks, outbox, service worker and codes; reduced
motion stops every animation; the card's own suite is 46/46. The page's template SVC1067_CARD.html is rebuilt from
servicing_tracker_DRAFT/card the same way; data unchanged; the live card is then re-posted under its existing token
(update_card.cjs). Footer v11.14 -> v11.15.

    python3 patch_v1115.py page.html      (in place, on the live v11.14 page)
"""
import hashlib, json, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '4d421ade78a7e0f77617463d0c47e4c78ec1e22545ce771d9426d874dc5d6299'
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
    if 'svc-ringdone' not in html or 'class="ring' not in html or 'stamp' not in html: raise ValueError('this is not the v3.1 card')
    return html


def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.15 requires the live v11.14 page ' + BASE_SHA256)
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i)
    if i < 0: raise ValueError('SVC1067_CARD not on the page')
    line = text[i:j]
    if not line.endswith(';'): raise ValueError('SVC1067_CARD line shape')
    bundle = json.loads(line[len('var SVC1067_CARD='):-1])
    if set(bundle.keys()) != {'data', 'html'}: raise ValueError('bundle keys ' + str(list(bundle.keys())))
    old_html = bundle['html']
    if 'svc-ringdone' in old_html: raise ValueError('v11.15 already applied')
    bundle['html'] = template()
    # the same encoding v10.67 used for the bundle (JSON with '<' escaped so the line can live inside a <script>)
    enc = json.dumps(bundle, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    # sanity: the data part is byte-for-byte what was there
    old_data = json.dumps(json.loads(line[len('var SVC1067_CARD='):-1])['data'], sort_keys=True)
    if json.dumps(bundle['data'], sort_keys=True) != old_data: raise ValueError('card data must not change')
    text = text[:i] + 'var SVC1067_CARD=' + enc + ';' + text[j:]
    text = rep(text, "+' · v11.14'; /* v8.19 release922", "+' · v11.15'; /* v8.19 release922", 'release footer', 'page')
    print('v11.15: crew card template %d -> %d bytes' % (len(old_html), len(bundle['html'])))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
