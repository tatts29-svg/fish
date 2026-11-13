"""Author: Andrew Fisher. v13.06 - the Demob figures read 100% when everything is off site.

Andrew, 13-14 Nov 2026: "Everything is now offsite why is it 92%", then "Page fix". The Demob tab's progress card (stars, line,
"units off site") and its day cards counted WB19 (34 TL2) and WB20 (30 TL2) as still to collect: 731 of 795 units, 184 of 186
references. They are the programme's reinstatement of WB02's and WB03's barriers; the record holds both as not on site, never
delivered, and the barriers' departures are on WB02 (9 Nov 14:00) and WB03 (29 Oct 19:00). The Demob cards already leave such a run
off (v12.42: "a run the record holds as not on site, with nothing collected, is not on site (WB19, WB20)").

One change at the source, so every reader moves together: DemobProgress996's whole() and summary() read the demob scope through
scope1306(), which leaves out a reference whose light is "not on site" and which has nothing collected on its history, at any date.
whole() feeds the progress card, its stars and line, the day cards' figures and the departed numbers; summary() feeds the tab's
"Demob scope" tile, which now names what it leaves out. Nothing else on the page reads the scope this way (the per-reference readers
call evidence() directly and are unchanged). The references stay on every other tab. At 100% the figure at the end of the progress
line ran off the card's right edge; at the right edge it now sits left of the point, below the line. Footer -> v13.06.
No record, map, money, P&L or machine change.

    python3 patch_v1306.py page.html      (in place, on the live v13.01 dashboard page)
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

path = sys.argv[1]
t = Path(path).read_text(encoding='utf-8')
if 'scope1306(' in t: sys.exit('v13.06 is already on this page')
if 'showcase1301-script' not in t or "+' · v13.01'; /* v8.19 release922" not in t: sys.exit('this is not the v13.01 page')

t = rep(t,
        "function create(env){\n function whole(M,date){const s=scope(M),readings=",
        "function create(env){\n"
        " /* v13.06 - a run the record holds as not on site, with nothing collected on its history at any date, has nothing to collect\n"
        "    (WB19 and WB20: the programme's reinstatement of WB02's and WB03's barriers, whose departures are on WB02 and WB03). It is\n"
        "    left out of the demob scope here, as the Demob cards leave it off (v12.42), so every demob figure reads the same; it stays\n"
        "    on every other tab. */\n"
        " function scope1306(M){const s=scope(M),off=[],refs=s.refs.filter(r=>{let rec=null;try{rec=env.record(r.key);}catch(x){rec=null;}"
        "if(!rec||rec.state!=='not on site')return true;let ev=null;try{ev=evidence(r,rec,'9999-12-31');}catch(x){return true;}"
        "if(!ev||ev.events.length)return true;off.push(r.key);return false;});return {...s,refs,total:refs.length,notOnSite1306:off};}\n"
        " function whole(M,date){const s=scope1306(M),readings=",
        'whole() reads the scope through scope1306', path)

t = rep(t,
        "function summary(M){const s=scope(M),n=src=>s.refs.filter(r=>r.src===src).length;return {...M.counts,total:s.total,",
        "function summary(M){const s=scope1306(M),n=src=>s.refs.filter(r=>r.src===src).length;return {...M.counts,total:s.total,"
        "notOnSite1306:s.notOnSite1306,",
        'summary() reads the scope through scope1306', path)

t = rep(t,
        '<p class="ctk">Demob scope</p><b>${C.total}</b><span>positive-quantity refs</span>',
        '<p class="ctk">Demob scope</p><b>${C.total}</b><span>positive-quantity refs${C.notOnSite1306 && C.notOnSite1306.length'
        " ? ' · ' + C.notOnSite1306.join(', ') + ' not on site, nothing to collect' : ''}</span>",
        'the Demob scope tile names what it leaves out', path)

t = rep(t,
        "+ '<text x=\"' + (+cx + 12) + '\" y=\"' + (+cy - 10) + '\" fill=\"#fff\" font-size=\"15\" font-weight=\"900\" "
        "style=\"filter:drop-shadow(0 0 6px #ff8a3a)\">' + shown + '%</text>'; })() : '';",
        "+ (() => { const right = +cx + 12 + 9 * (String(shown).length + 1) > W0 - 4; /* v13.06 - at the right edge the figure sits left of"
        " the point, below the line, so 100% is never cut off */ return '<text x=\"' + (right ? +cx - 14 : +cx + 12) + '\" y=\"'"
        " + (right ? +cy + 24 : +cy - 10) + '\"' + (right ? ' text-anchor=\"end\"' : '') + ' fill=\"#fff\" font-size=\"15\" font-weight=\"900\""
        " style=\"filter:drop-shadow(0 0 6px #ff8a3a)\">' + shown + '%</text>'; })(); })() : '';",
        "the progress line's end figure stays inside the card", path)

t = rep(t, "+' · v13.01'; /* v8.19 release922", "+' · v13.06'; /* v8.19 release922", 'footer v13.06', path)

Path(path).write_text(t, encoding='utf-8')
print('v13.06 applied')
