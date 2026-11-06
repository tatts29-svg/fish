"""Author: Andrew Fisher. v12.10.1 (claimed as v12.09.2) - Servicing: tonight's final night is Pump out, Clean & restock and Locked; Locked on the
clean code; no water. The printed QR codes stay the same.

Andrew, 25 Oct 2026 (this chat): "Also with tonights one. Shoud be Confirm emtpy and pump out. Confirmb clean and Lock no
rewater needed so can remove the fill for tonight. They can still use same qr codes." ... "So lets do. Pump out confirmed /
Cleaned / Locked. Locked is from the clean qr code".
Until now the final night (Sun 25) was one combined job on the FWF, accessible and 16-pan units, "Pump out, clean & lock",
on either code; the service refuses a tick for a job that is not on that night's plan, so pump-out and clean ticks would
have been refused tonight.
  Both copies of the tracker data, the Servicing panel's (SVC1067_DATA) and the card bundle the Manage servicing tracker
  fold publishes (SVC1067_CARD.data):
    - the lock-up job is "Locked";
    - FWF, accessible and 16-pan: the final night is pump, clean, lockup (Pump out, Clean & restock, Locked), no water;
    - the pump code's jobs are Pump out only, so Locked comes from the clean code (Clean & restock, Locked; the water job
      stays on the clean code for the other nights);
    - blocks and sewer (Clean & restock), tanks and pump-only lines (Pump out) are unchanged;
    - the card data's version line says what changed.
  The team message and the whose-job lists give the lock-up to the cleaners.
  No figure for any earlier night, QR code, signature, crew group or record changes. The event tracker itself is updated
  afterwards through the fold (same token, no re-key). Footer -> v12.10.1, a point release on Codex's v12.10 (renumbered
from v12.09.2 because v12.10 published first, so the footer never goes backwards).

    python3 patch_v12101.py page.html      (in place, on the live v12.10 page named by BASE)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '00056a857827a22519fe0ac095cf19ae94d2dbb7a06c2843c740f208adb3365c'
FOOT_OLD, FOOT_NEW = "+' · v12.10'; /* v8.19 release922", "+' · v12.10.1'; /* v8.19 release922"
DATA_EDITS = [  # twice each: var SVC1067_DATA= (the panel) and SVC1067_CARD.data (what the fold publishes)
    ('"lockup":"Pump out, clean & lock"', '"lockup":"Locked"'),
    ('"fwf":{"night":["pump","clean","refill"],"final":["lockup"]}', '"fwf":{"night":["pump","clean","refill"],"final":["pump","clean","lockup"]}'),
    ('"access":{"night":["pump","clean","refill"],"final":["lockup"]}', '"access":{"night":["pump","clean","refill"],"final":["pump","clean","lockup"]}'),
    ('"pan16":{"night":["pump","clean"],"final":["lockup"]}', '"pan16":{"night":["pump","clean"],"final":["pump","clean","lockup"]}'),
    ('"pump":{"label":"Pump out","tasks":["pump","lockup"]}', '"pump":{"label":"Pump out","tasks":["pump"]}'),
]
VERSION_OLD = ('"version":"tracker-data 22 Oct 2026;Water checked / refilled is the one water job, counted in the completion, on the clean code '
               '(Andrew, 22 Oct); 21 Oct trailer addition and site records retained"')
VERSION_NEW = ('"version":"tracker-data 25 Oct 2026;the final night is Pump out, Clean & restock and Locked, Locked on the clean code, no water '
               '(Andrew, 25 Oct); Water checked / refilled is the one water job on the other nights, on the clean code (Andrew, 22 Oct); '
               '21 Oct trailer addition and site records retained"')
EDITS = [
    ("pump1: ['pump', 'lockup'], pump2: ['pump', 'lockup'], pump3: ['pump', 'lockup']", "pump1: ['pump'], pump2: ['pump'], pump3: ['pump']", 'teams1187-script', 'team message: lock-up is the cleaners\''),
    ("the final night's lock-up for pump trucks and cleaners.", "the final night's lock-up for the cleaners (v12.10.1).", 'teams1187-script', 'team message: the note'),
    ("lockup: ['pump1', 'pump2', 'pump3', 'cleaners']", "lockup: ['cleaners']", 'who1189-script', 'whose job: lock-up is the cleaners\''),
]
FINAL = ['pump', 'clean', 'lockup']


def check_data(d, where):
    if d['tasks'].get('lockup') != 'Locked': raise ValueError(where + ': lock-up is not "Locked"')
    for k in ('fwf', 'access', 'pan16'):
        if d['plans'][k]['final'] != FINAL: raise ValueError(where + ': ' + k + ' final plan is ' + repr(d['plans'][k]['final']))
    if d['plans']['block']['final'] != ['clean'] or d['plans']['sewer']['final'] != ['clean'] or d['plans']['tank']['final'] != ['pump'] or d['plans']['pump_only']['final'] != ['pump']:
        raise ValueError(where + ': a block, sewer, tank or pump-only plan moved')
    if d['groups']['pump']['tasks'] != ['pump'] or d['groups']['clean']['tasks'] != ['clean', 'lockup', 'refill']: raise ValueError(where + ': the codes\' jobs are not pump / clean, lockup, refill')
    if d['plans']['fwf']['night'] != ['pump', 'clean', 'refill']: raise ValueError(where + ': the other nights moved')


def patch(html):
    if "+' · v12.10.1'" in html or '"lockup":"Locked"' in html: raise ValueError('v12.10.1 already applied')
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE: raise ValueError('Wrong live base for v12.10.1 (expected v12.10 00056a85...)')
    for old, new in DATA_EDITS:
        if html.count(old) != 2: raise ValueError('%r must be there twice (panel and card bundle), found %d' % (old[:60], html.count(old)))
    if html.count(VERSION_OLD) != 1: raise ValueError('the card data version line is not the expected one')
    for old, new, tag, what in EDITS:
        if html.count(old) != 1: raise ValueError('%s: %r must be there exactly once' % (what, old[:60]))
        k = html.index('<script id="%s">' % tag); e = html.index('</script>', k)
        if not k < html.index(old) < e: raise ValueError('%s: not inside %s' % (what, tag))
    if html.count(FOOT_OLD) != 1: raise ValueError('the footer must be there exactly once')
    for old, new in DATA_EDITS: html = html.replace(old, new)   # both copies, counted above
    html = rep(html, VERSION_OLD, VERSION_NEW, 'card data: version line', 'page')
    for old, new, tag, what in EDITS: html = rep(html, old, new, what, 'page')
    html = rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')
    # both copies read back as data
    line = [l for l in html.split('\n') if l.startswith('var SVC1067_CARD=')]
    if len(line) != 1: raise ValueError('one card bundle line expected')
    card = json.loads(line[0][len('var SVC1067_CARD='):].rstrip(';'))
    check_data(card['data'], 'card bundle')
    if card['html'].count('/*SVC1067_DATA*/null') != 1: raise ValueError('the card template changed')
    i = html.index('var SVC1067_DATA=') + len('var SVC1067_DATA='); panel, end = json.JSONDecoder().raw_decode(html[i:])
    check_data(panel, 'panel')
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.10.1 final night jobs applied')
