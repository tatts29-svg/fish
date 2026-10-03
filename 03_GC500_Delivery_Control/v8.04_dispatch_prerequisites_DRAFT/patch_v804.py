#!/usr/bin/env python3
"""Author: Andrew Fisher. Shared per-truck departure prerequisites in existing components."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if 'function dispatch803State(' in s:raise SystemExit('v8.04 dispatch already applied')
if 'function cw2Plan803(' not in s or 'function bookingLoadingWords801(' not in s:raise SystemExit('v8.04 requires the CW2 plan and final Wednesday booking release')
s=rep(s,'function pitBoard(l, i){','function pitBoardBefore803(l, i){','preserve existing dispatch component',str(p))
s=rep(s,'function pitBoardBefore803(l, i){',(ROOT/'dispatch803_src.js').read_text()+'\nfunction pitBoardBefore803(l, i){','shared departure checks',str(p))
s=rep(s,'function pitBoardBefore803(l, i){',(ROOT/'sequence803_src.js').read_text()+'\nfunction pitBoardBefore803(l, i){','source-specific fencing confirmations',str(p))
s=rep(s,"Object.entries(S.answers || {}).forEach(([id, value]) => {\n if (typeof value === 'string'", "Object.entries(S.answers || {}).forEach(([id, value]) => {\n if(sequence803OwnAnswer(id,value))return;\n if (typeof value === 'string'",'fencing confirmations stay on their task instead of orphan questions',str(p))
s=rep(s,"loads: Object.keys(S.loads || {}).length,","loads: Object.keys(S.loads || {}).filter(k=>!dispatch803OwnEvent(k,S.loads[k])).length,",'event records do not inflate saved pairing counts',str(p))
s=rep(s,'const SYNC = {on: false,','const SYNC = {durableRecordWrites: false, on: false,','default durable-record capability to unavailable',str(p))
s=rep(s,'function syncStop(why){','function syncStop(why){\n SYNC.durableRecordWrites=false;','clear durable-record capability when sync stops',str(p))
s=rep(s,' SYNC.at = Date.now(); failed = 0;',' sequence803DurableVersion(v);\n SYNC.at = Date.now(); failed = 0;','refresh strict capability before unchanged-version return',str(p))
s=rep(s,"${arrivalAfter() ? ' · on the Gold Coast after ' + esc(arrivalAfter()) : l.site_eta ? ' · on site about ' + esc(l.site_eta) : ''}","${l.booking801 ? ' · site arrival not supplied' : arrivalAfter() ? ' · on the Gold Coast after ' + esc(arrivalAfter()) : l.site_eta ? ' · on site about ' + esc(l.site_eta) : ''}",'pairing drawer booking clock',str(p))
s=rep(s,"""<div class="notice info"><b>The carrier's list does not say what is on the truck.</b> It names the item and the load
 time only, so the reference and the drop point are recorded here, by you. The carrier has asked for a drop point
 per load — this is where that is written down.</div>""","""<div class="notice info">${l.booking801 ? '<b>These references are supplied against this DD booking.</b> Check this truck’s cargo and record any confirmed pairing or drop-point change. Departure order and booked loading time remain separate.' : '<b>The carrier’s list does not say what is on the truck.</b> It names the item and the load time only, so the reference and the drop point are recorded here, by you. The carrier has asked for a drop point per load — this is where that is written down.'}</div>""",'pairing drawer supplied references',str(p))
s=rep(s,'<meta name="gc500-release" content="v8.03">','<meta name="gc500-release" content="v8.04">','dispatch release marker',str(p))
p.write_text(s)
print('v8.04 departure checks: existing shared loads records, explicit acknowledgement and DD order; no live writes')
