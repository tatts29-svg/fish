"""Author: Andrew Fisher. v8.21 daily installer pages and explicit SMS submission."""
import json, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep
p=Path(sys.argv[1]);t=p.read_text();here=Path(__file__).parent
if 'const DAILY821 =' in t: raise SystemExit('v8.21 already applied')
if 'function bookingNotes801(' not in t or 'function sms777Submission(' not in t: raise SystemExit('v8.21 requires the current booking and SMS lifecycle base')
t=rep(t,'${mail}${dpEditTile(d)}</section>', '${mail}${daily821Tile(d)}${dpEditTile(d)}</section>', 'add message action to visible day documents plate',str(p))
t=rep(t,'function dpDayButtons(d){','function dpDayButtonsBefore821(d){','retain native day actions',str(p))
t=rep(t,"events:(r.events || []).filter(e=>!e.booking801)","events:(r.events || []).filter(e=>!e.booking801 || e.bookingMoved801)",'retain rescheduled bookings beside active bookings',str(p))
t=rep(t,"+ mms757Button(key) + `</div>`; }","+ `</div>`; }",'move per-load message inside expanded notes',str(p))
t=rep(t,'${dayCards(g.rows, g.kind)}</div>', '${dayCards(g.rows, g.kind)}<div class="daily821-load-message">${g.rows.map(r=>\'<div><b>\'+esc(r.a.key)+\'</b>\'+mms757Button(r.a.key)+\'</div>\').join(\'\')}</div></div>', 'retain individual location texts under each open load',str(p))
t=rep(t,"${full ? dayPanels(d) + dayAttention(d) : ''}","${full ? daily821Panel(d) + dayPanels(d) + dayAttention(d) : ''}",'add selected day installer panel',str(p))
t=rep(t,'redeliver: deliverAll,','redeliver: deliverAll,\n readVersion821: () => version,','expose already-read record revision for send freshness',str(p))
fonts='const DAILY821_FONTS = '+json.dumps((here/'daily821_fonts.css').read_text())+';\n'
src=fonts+(here/'daily821_renderer.js').read_text()+'\n'+(here/'daily821_src.js').read_text()
if '</script' in src.lower():raise SystemExit('source closes script')
t=rep(t,'function renderTimeline(){',src+'\nfunction renderTimeline(){','install daily-page source before Timeline',str(p))
t=rep(t,'</head>\n<body>','<meta name="gc500-daily-v821" content="Daily installer pages and manual text submission"><style>\n'+(here/'daily821.css').read_text()+'\n</style>\n</head>\n<body>','install scoped Timeline style',str(p))
p.write_text(t)
print('Applied v8.21 daily installer runs')
