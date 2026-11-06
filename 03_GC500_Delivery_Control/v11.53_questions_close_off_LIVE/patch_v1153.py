"""Author: Andrew Fisher. v11.53 - the Questions tab closed off where the record and the project manager's notes answer it.

Andrew, 23 Oct 2026: "can we look at question we should be able to close a lot of this off now.. and finish we need to look
at cleaning everything up".

What was wrong, and what changes:
- The identity check behind "51 locations on site with asset numbers missing" threw on the VMS boards (they are identified
  on the VMS boards tab, not assets), so the tab fell back to an older count that cannot see the fleet numbers recorded on
  39 of those 43 locations, and warned "Some checks didn't run (current identity question)". The check now skips VMS lines;
  the question counts the received units numbered on the current record.
- Eight questions the project manager's notes of 15 Oct 2026 (and the work since) already settle move to Answered or history
  with the decision as their answer, the note, name and time kept: Advanced's fencing quote (paid on measured dockets), the
  closure marks (read, and drawn on the Fence closures tab), fencing on the record vs the plan (read against the programme;
  the Fencing tab keeps the live comparison), the team-leader rate (inside our cost, no customer line), R10 (pick-up 13 Nov
  on the Baseplan booking), R26 (028 on D024 is the sheet's reference note), R29 (S04 metres on the dockets) and TX03 (one
  movement each on the delivery dockets).
- (both in questions1153.js, wrapping questionsList after every other decorator) Labour cost basis moves to Pending / later while every unpriced person is Coates staff on salary: the cost rate is a
  payroll figure finance supplies; nothing to enter on the page.
- Contract 9961976 lines 37, 41, 45 and 47 take the project manager's treatment (questions1153.js): inside the generator
  card rate, or Pending with no charge unless delivered / called off. NVAC has no unpriced line left; the P&L stops
  counting "3 contract lines with no rate yet".
- "Questions reviewed" reads 23 Oct 2026. Footer v11.52 -> v11.53. No record change.

    python3 patch_v1153.py page.html      (in place, on the live v11.52 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
BLOCK = (HERE / 'questions1153.js').read_text(encoding='utf-8')
ANCHOR = '<script id="spot1117-script">'

EDITS = [
    # the identity check: a VMS board is identified on its own tab, not an asset here - skip it instead of failing the whole check
    ("if(!model||!Array.isArray(model.rows))throw Error('Current unit identities unavailable');",
     "if(!model||!Array.isArray(model.rows)){if(same(line.item,'VMS'))continue;throw Error('Current unit identities unavailable');} /* v11.53 - a VMS board is identified on the VMS boards tab, not an asset here */", 'identity check skips VMS boards'),
    # the review date
    ("answersOverview754Html=function(){return '<div class=\"notice\" data-answers754><b>Questions reviewed · 09 Oct 2026</b></div>';};",
     "answersOverview754Html=function(){return '<div class=\"notice\" data-answers754><b>Questions reviewed · 23 Oct 2026</b></div>';};", 'review date'),
    # the four history rows the notes settle
    ("['R10', QH_LATER, 'Office and lunchroom - pick-up date', 'Size answered: the internal office (960639) and lunchroom (960634) are both 4.8 × 3 m, contract 9968929 lines 1 and 3. The demob sheet’s \"6 m\" is wrong.', 'One date: the demob sheet says pick-up 12 Nov, the hire contract says 13 Nov. Which is right?', 'plant'],",
     "['R10', QH_DONE, 'Office and lunchroom - pick-up 13 Nov', 'The office (960639) and lunchroom (960634) are both 4.8 × 3 m, contract 9968929 lines 1 and 3. Contract 9968929 (Baseplan export, 15 Oct 2026) books their pick-up for 13 Nov: that is the transport booking the branch holds; the demob sheet’s 12 Nov and its \"6 m\" are superseded. Pick-up: 13 Nov (the project manager, 15 Oct 2026).', '', 'plant'],", 'R10 settled'),
    ("['R26', QH_OPEN, 'Generator \"028\" on drawing D024', 'The GN22 part is answered: GN22 was replaced by GN20 (see R04).', 'D024 shows a generator \"028\" that has no row on our schedule. Is 028 ours to supply, or someone else’s?', 'plant'],",
     "['R26', QH_DONE, 'Generator \"028\" on drawing D024 - a reference note, not a generator', '028 on D024 is the sheet’s off-site reference note in its corner, not a generator position on the plan; the only 028 drawn on the set is building callout 028 on D022 (P28). No Coates generator row exists for it and none is drawn; nothing to supply unless iEDM adds a row. The GN22 part: GN22 was replaced by GN20 (R04). The project manager, 15 Oct 2026.', '', 'plant'],", 'R26 settled'),
    ("['R29', QH_OPEN, 'Fencing plan changes on 11 Sep', 'On dockets now: PB03 20 m (36508); Cypress Carpark 97.5 m (36505), later upgraded to scrim (36539); S05 back of house 35 m (36518).', 'The S04 compound: the plan added 41 m and 1 gate; docket 36546 shows a 22.5 m extension. Is the rest still coming, or was it dropped?', 'fencing'],",
     "['R29', QH_DONE, 'Fencing plan changes on 11 Sep - on the dockets', 'On dockets: PB03 20 m (36508); Cypress Carpark 97.5 m (36505), later upgraded to scrim (36539); S05 back of house 35 m (36518). S04 since the 11 Sep plan: 36546 22.5 m extension, 36589 15 m corporate toilets (scrimmed), 36565 25 m zip-tied to the S04-S05 bridge, and 36581 braced the corporate line (58 panels). The 41 m is covered (37.5 m of mesh plus the bridge run); no gate is docketed at S04, so the gate stays on the event-week install list. The project manager, 15 Oct 2026.', '', 'fencing'],", 'R29 settled'),
    ("['TX03', QH_OPEN, 'Two buildings linked to two loads each', 'All 22 loads are linked to their buildings. P20 is on two loads (16 Sep, loads 10 and 14) and P21 is on two (16 Sep, loads 12 and 16). This also covers TX05.', 'Did P20 and P21 each really go twice, or is one link on each wrong?', 'timeline'],",
     "['TX03', QH_DONE, 'Two buildings linked to two loads each - one movement each', 'Settled by the branch’s delivery dockets (Baseplan export, 15 Oct 2026): P20 is one 4.8 m building, 1097339, docket 26076698, delivered 17 Sep 13:01; P21 is one 6 m building, 1327220, docket 26076820, delivered 17 Sep 12:29. One movement each; the second load link on each (16 Sep, loads 14 and 16) is superseded. This also covers TX05. The project manager, 15 Oct 2026.', '', 'timeline'],", 'TX03 settled'),
]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.53 requires the live v11.52 page ' + BASE_SHA256)
    if 'questions1153-script' in text: raise ValueError('v11.53 already applied')
    if text.count(ANCHOR) != 1 or text.count('<script id="notcharged1152-script">') != 1: raise ValueError('the spot1117 and notcharged1152 blocks are not on the page once each')
    if text.index('<script id="notcharged1152-script">') > text.index(ANCHOR): raise ValueError('the v11.52 block must precede the spot1117 block')
    for bad in ('Claude', 'Codex', 'GPT', 'Gemini'):
        if bad in BLOCK: raise ValueError('an agent name in the patch text: ' + bad)
    for old, new, what in EDITS: text = rep(text, old, new, what, 'page')
    text = rep(text, ANCHOR, '<script id="questions1153-script">\n' + BLOCK + '</script>\n' + ANCHOR, 'the block before the spot1117 script', 'page')
    text = rep(text, "+' · v11.52'; /* v8.19 release922", "+' · v11.53'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('questions1153-script', 1), ('W.Questions1153 = Object.freeze', 1), ('settle1153(', 6), ('settled1153', 1), ('W.questionsList = gQ', 1), ("same(line.item,'VMS')", 1), ('Questions reviewed · 23 Oct 2026', 1), ('Questions reviewed · 09 Oct 2026', 0), ("['R10', QH_DONE", 1), ("['R26', QH_DONE", 1), ("['R29', QH_DONE", 1), ("['TX03', QH_DONE", 1), ("+' · v11.53'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.53 did not land cleanly: ' + needle + ' x' + str(text.count(needle)) + ' (expected ' + str(n) + ')')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1153 applied: the Questions tab closed off where the record and the notes answer it; footer v11.52 -> v11.53')
