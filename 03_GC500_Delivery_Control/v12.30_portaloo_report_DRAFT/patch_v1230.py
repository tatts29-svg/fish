"""Author: Andrew Fisher. v12.30 - the servicing night report: every portaloo, who cleaned and who locked it, ready to be picked up and when.

Andrew, 26 Oct 2026 (this chat), the morning after the final night: "lets do a report on all last nights portaloos that also mentiones
who confirmed locked and cleaned too please add thi into the report", then "lets make this really good can we also mention or have a
Tick of Ready to be picked up please. and then next to it a date when it will be picked up and time. we want this to look really good
please".

The Night report (report1202, v12.05/v12.09.1) gave the night's score, the areas, the crews and the door-lock declarations, but no
location-by-location account. It now carries, area by area, every portaloo location on the night:
  - Pumped out, Cleaned & restocked (and Water on a water night): a tick, the time the job was saved and the crew group it was saved
    under (the crew card records the group, not each person);
  - Locked: the named person who declared the doors locked (SvcLock1221's own reading), with their crew; a lock-up with no named
    declaration says so, and a declaration with no name in it reads "no name given";
  - on the final night, Ready to be picked up: a tick when every job of the night (pump out, clean and restock, lock-up) is saved for
    every unit at the location, otherwise what is missing; and beside it the pick-up: the Demob plan's day for the reference and the
    load it is on (demob816, trucks816), a Coates run's planned stop time, or the supplier's own transport between 07:00 and 17:00
    (no time is planned for a supplier pick-up); the day says how firm it is (confirmed, planned, off-hire date, proposed).
A banner opens the section on the final night: locations and units ready to be picked up, and the pick-up days with how many
locations each. Whole area blocks move to the next A4 when they do not fit, as the report's other blocks do.

The door-lock declarations (SvcLock1221's reading and statement, unchanged) print one row each instead of one box each (lockTable1230):
every fact the entry carried, 69 entries in about two pages instead of fourteen.

who1230_src.js (pickups1230, who1230, whoBlocks1230, lockTable1230) is inserted inside report1202, before its model. Read only: no tracker, QR, crew
card or record change. Every edit must find its text exactly once on the verified v12.29 page. Footer v12.29 -> v12.30.
    python3 patch_v1230.py page.html      (in place, on the live v12.29 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = 'a4d611111a0ab0dd89f7effa753a52502fae661d39afc3bded2d98beeddc4276'
FOOT_OLD, FOOT_NEW = "+' · v12.29'; /* v8.19 release922", "+' · v12.30'; /* v8.19 release922"
MODEL = "/* ---- the night, from the panel's own read and the one state rule */\nfunction model(I) {"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

CSS_OLD = ".test{position:absolute;right:-24mm;top:15mm;transform:rotate(35deg);background:#c62828;color:#fff;font:800 9pt/1 Inter,sans-serif;letter-spacing:.2em;padding:2.2mm 30mm}\n`;"
CSS_NEW = CSS_OLD[:-2] + """/* v12.30 every portaloo: who serviced it, ready to be picked up and when; the door-lock declarations one row each */
.rb1230{display:grid;grid-template-columns:auto 1fr;gap:5mm;align-items:center;margin:1mm 0 3mm;padding:4.2mm 5mm;border-radius:3mm;background:radial-gradient(120% 140% at 90% 0%,#20384a 0%,#0f1e29 55%,#0a141c 100%);color:#fff;break-inside:avoid;position:relative;overflow:hidden}
.rb1230:after{content:'';position:absolute;left:0;right:0;bottom:0;height:1mm;background:linear-gradient(90deg,#0f9b5a,#2fd387 55%,#ffc21a)}
.rbt{display:flex;align-items:center;gap:3.6mm}
.rbk{display:inline-grid;place-items:center;width:13mm;height:13mm;border-radius:50%;background:linear-gradient(180deg,#2fd387,#0f9b5a);color:#fff;font:900 19pt/1 Inter,sans-serif;box-shadow:0 0 0 1.3mm #2fd38733}
.rbk.part{background:linear-gradient(180deg,#ffb04d,#f26a1b);box-shadow:0 0 0 1.3mm #f26a1b33}
.rbt b{display:block;font:italic 700 25pt/1 "Barlow Condensed",Inter,sans-serif;color:#fff}
.rbt span{display:block;margin-top:.9mm;font:600 7.8pt/1.3 Inter,sans-serif;color:#ffffffc9}
.cal1230{display:flex;flex-wrap:wrap;gap:1.5mm;justify-content:flex-end;align-content:center}
.cal1230 .cl{flex:0 0 100%;text-align:right;font:700 6.2pt/1 Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ffb04d;margin-bottom:.8mm}
.cd{display:grid;justify-items:center;min-width:11.6mm;padding:1.3mm 1.4mm 1.2mm;border-radius:1.8mm;background:#ffffff14;border:1px solid #ffffff2e}
.cd b{font:800 7.8pt/1.05 Inter,sans-serif;color:#fff;white-space:nowrap}
.cd span{font:600 5.9pt/1.2 Inter,sans-serif;color:#ffffffa6;text-transform:uppercase;letter-spacing:.1em}
.cd em{margin-top:.5mm;font:800 7.4pt/1 Inter,sans-serif;font-style:normal;color:#ffc21a}
.wh1230{margin-top:3.6mm}
.wh1230 .lga{display:flex;align-items:center;gap:2mm;margin-bottom:1.3mm}
.wh1230 .no{display:inline-grid;place-items:center;width:5.8mm;height:5.8mm;border-radius:50%;background:var(--ink);color:#fff;font:700 7pt/1 Inter,sans-serif}
.wh1230 .lgn b{font:700 9.2pt/1.2 Inter,sans-serif;color:var(--ink)}
.wh1230 .lgn em{margin-left:1.4mm;font:600 7pt/1 Inter,sans-serif;font-style:normal;color:var(--mute)}
.g1230{display:grid;grid-template-columns:15% repeat(var(--k,3),1fr);align-items:start}
.g1230.fin{grid-template-columns:12.5% 16.5% 16.5% 18% 14% 22.5%}
.gl1230{display:grid;grid-template-columns:10.5% 24% 14% 20% 9% 10% 12.5%;align-items:start}
.gh{padding:1.5mm 1.8mm;background:var(--tint);border:1px solid var(--line);border-radius:2mm 2mm 0 0;font:700 5.8pt/1.2 Inter,sans-serif;letter-spacing:.11em;text-transform:uppercase;color:var(--mute)}
.gh>span{padding-right:1.6mm}
.gr{padding:1.45mm 1.8mm;border:1px solid var(--line);border-top:0;background:#fff;font:500 7.2pt/1.25 Inter,sans-serif;color:var(--text);break-inside:avoid}
.gr>div{padding-right:1.6mm;min-width:0;overflow-wrap:anywhere}
.gr.alt{background:#fafbfc}
.gr.end{border-radius:0 0 2mm 2mm}
.gr.nr{background:#fff6f5}
.body>.gr:first-child{border-top:1px solid var(--line);border-radius:2mm 2mm 0 0}
.body>.gr.end:first-child{border-radius:2mm}
.gr .rf b{display:block;font:800 8.8pt/1.1 Inter,sans-serif;color:var(--ink)}
.gr small{display:block;margin-top:.6mm;font:500 6.2pt/1.25 Inter,sans-serif;color:var(--mute)}
.gr .wk,.gr .wx{display:inline-grid;place-items:center;width:3.7mm;height:3.7mm;margin-right:1.2mm;border-radius:50%;background:var(--c);color:#fff;font:900 6pt/1 Inter,sans-serif;vertical-align:-.7mm}
.gr .wx{background:#c62828}
.gr .tm{font:700 7.4pt/1 Inter,sans-serif;color:var(--ink);font-variant-numeric:tabular-nums}
.gr div>em{margin-left:1mm;font-style:normal;font-weight:700;color:#b45309}
.gr .wh{display:block;margin-top:.8mm}
.gr .wh b{display:block;font:600 7pt/1.25 Inter,sans-serif;color:var(--text)}
.gr .wh small{margin-top:0}
.gr .wh .warn{color:#c62828}
.gr .na{color:var(--mute)}
.gr .wn{color:#c62828;font-weight:700}
.gr .rp{display:inline-flex;align-items:center;gap:1.3mm;padding:1mm 2.6mm 1mm 1mm;border-radius:99px;background:#e3f6ec;color:#0d7a46;font:800 7.2pt/1 Inter,sans-serif;letter-spacing:.03em;white-space:nowrap;box-shadow:inset 0 0 0 1px #9fdcbc}
.gr .rp i{display:inline-grid;place-items:center;width:4.6mm;height:4.6mm;border-radius:50%;background:linear-gradient(180deg,#2fd387,#0f9b5a);color:#fff;font:900 7pt/1 Inter,sans-serif;font-style:normal}
.gr .rp.no{background:#fde8e8;color:#b42318;box-shadow:inset 0 0 0 1px #f5b5b5}
.gr .rp.no i{background:#c62828}
.gr .rd small{margin-top:.9mm;color:#b42318;font-weight:600}
.gr .pd{display:flex;flex-wrap:wrap;align-items:baseline;gap:.4mm 1.4mm}
.gr .pd b{font:800 7.6pt/1.25 Inter,sans-serif;color:var(--ink);white-space:nowrap}
.gr .pd span{font:800 7.6pt/1.25 Inter,sans-serif;color:var(--or);font-variant-numeric:tabular-nums;white-space:nowrap}
.gr .pd em{font:600 6.2pt/1 Inter,sans-serif;font-style:normal;color:var(--mute);margin:0}
.gr .pk small.pp{color:#b45309}
.gl1230.gr b{font-weight:700;color:var(--ink)}
`;"""

EDITS = [
 ('version', "const VERSION = 'v12.09.1', EVENT_LOAD", "const VERSION = 'v12.30', EVENT_LOAD"),
 ('model carries every portaloo', "lockDeclarations: SvcLock1221.report(I,day), tasks, areas, crews:",
  "lockDeclarations: SvcLock1221.report(I,day), who1230: who1230(I, cfg, day, st, dayObj.plan === 'final' && !dayObj.practice), tasks, areas, crews:"),
 ('the section after Left at close', "'<div class=\"body\">' +areas + leftBlocks + how + SvcLock1221.html(R) + '</div>'",
  "'<div class=\"body\">' +areas + leftBlocks + whoBlocks1230(R) + how + lockTable1230(R) + '</div>'"),
 ('its look', CSS_OLD, CSS_NEW),
]


def patch(text):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.29; rebuild and retest')
    if 'function who1230(' in text: raise ValueError('who1230 is already on the page')
    for label, old, new in EDITS:
        if text.count(old) != 1: raise ValueError(f'{label}: expected text found {text.count(old)} times, not once')
        text = text.replace(old, new)
    if text.count(MODEL) != 1: raise ValueError("report1202's model not found once")
    text = text.replace(MODEL, (HERE / 'who1230_src.js').read_text(encoding='utf-8').rstrip() + '\n' + MODEL)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.29 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print(f'patch_v1230 applied: {len(EDITS)} edits + who1230; the night report lists every portaloo, who cleaned and locked it, ready to be picked up and when; footer v12.29 -> v12.30')
