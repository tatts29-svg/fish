#!/usr/bin/env python3
"""v8.01 — load Andrew's Wednesday 7 Oct bookings in DD departure order.
Author: Andrew Fisher. Existing schedule rows only; no operational record mutation.
"""
import os,sys,json,copy,re
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep
p=Path(sys.argv[1]);text=p.read_text();root=Path(__file__).parent
if 'function bookingOrder801(' in text:sys.exit('v8.01 already applied')
if 'function eq796(' not in text:sys.exit('v8.01 requires v7.96 or later')
match=re.search(r'const DATA\s*=\s*',text);assert match, 'DATA declaration missing'
start=match.end();data,end=json.JSONDecoder().raw_decode(text[start:]);old=text[start:start+end]
source=json.loads((root/'bookings_07Oct2026.json').read_text());guards=json.loads((root/'expected_events.json').read_text())
assert len(source['rows'])==len(guards)==14
for row,guard in zip(source['rows'],guards):
 assert row['reference']==guard['reference'] and row['task_id']==guard['task_id']
 pool=data['assets']+data['plant_lines']['lines'];matches=[a for a in pool if a['key']==row['reference']];assert len(matches)==1
 a=matches[0];es=[e for e in a['events'] if e['task_id']==row['task_id']];assert len(es)==1
 e=es[0]
 if e!=guard['expected_event'] or a['asset_numbers']!=guard['expected_asset_numbers']:sys.exit('Source changed: '+row['reference']+' '+row['task_id']+'; re-review before applying')
 prev=copy.deepcopy(e)
 b=copy.deepcopy(row);b['source']={k:source[k] for k in ['author','received','source','instruction']};b['previous_schedule_event']=prev
 e['booking801']=b
 e['dd']=' / '.join(l['dd'] for l in row['loads']) or 'NA'
 e['carrier']=row['carriers_as_supplied'].upper() if row['carriers_as_supplied'] else None
 e['load_time']=row['load_times_as_supplied']
 if row['activity'] is not None:e['activity']=row['activity']
 if row['notes'] is not None:e['note']=row['notes']
 if row['reference']=='T0258':a['customers']=['scars']
# Keep the original JSON formatting used by the hosted page.
text=rep(text,text[match.start():start]+old,'const DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':')),'guarded fourteen booking rows',str(p))
for name in ['programmeDays','loadOf','dpLoads','dpNums','dpBasisShort','dpTruck','loadBrief','dpLoadLine','loadAssets']:
 text=rep(text,'function '+name+'(', 'function '+name+'Before801(', 'preserve '+name,str(p))
helpers=(root/'bookings801_src.js').read_text()
text=rep(text,'function programmeDaysBefore801(){',helpers+'\nfunction programmeDaysBefore801(){','booking projections',str(p))
text=rep(text,'const etaSort = (x, y) => {','const etaSort = (x, y) => {\n const bx=bookingRank801(x),by=bookingRank801(y); if(bx!==by)return bx-by;','DD row order separate from eta',str(p))
text=rep(text,"function ps7Loads(d){ return (d.loads || []).slice().sort((a, b) => String(a.load_time_24h || a.time_24h || a.time || '').localeCompare(String(b.load_time_24h || b.time_24h || b.time || ''))); }","function ps7Loads(d){ return (d.loads || []).slice().sort(bookingSort801); }",'pre-start DD order',str(p))
# These two displays used clock sorting; preserve every older day and use DD order for these bookings.
needle='d.loads.slice().sort((x, y) => x.time.localeCompare(y.time))'
assert text.count(needle)==2
text=text.replace(needle,'d.loads.slice().sort(bookingSort801)')
needle="const l = (((DATA.transport || {}).carrier || {}).loads || []).find(x => loadId(x) === id);"
assert text.count(needle)==2
text=text.replace(needle,"const l = carrierLoads801().find(x => loadId(x) === id);")
# Existing day components retain their controls and classes; their supplied facts now name the DD order.
for eventword in ['events','(events || [])']:
 needle=" const says = "+eventword+".map(e => [e.sheet, e.activity, e.carrier ? 'carrier ' + e.carrier : null, e.dd, e.note]\n.filter(Boolean).map(esc).join(' · ')).filter(Boolean).join('<br>');"
 replacement=" const says = bookingDayWords801(a,events) || "+eventword+".map(e => [e.sheet, e.activity, e.carrier ? 'carrier ' + e.carrier : null, e.dd, e.note]\n.filter(Boolean).map(esc).join(' · ')).filter(Boolean).join('<br>');"
 text=rep(text,needle,replacement,'day booking facts '+eventword,str(p))
text=rep(text,"const rec = loadOf(l), drop = loadDrop(l), id = loadId(l), aft = arrivalAfter();","const rec = loadOf(l), drop = loadDrop(l), id = loadId(l), aft = l.booking801 ? null : arrivalAfter();",'no invented booking arrival',str(p))
text=rep(text,'<div class="pbnum racenum">Load ${two(i + 1)}</div>','<div class="pbnum racenum">${l.booking801 ? esc(l.departure_order == null ? \'—\' : bookingOrder801(l.departure_order)) : \'Load \' + two(i + 1)}</div>','DD on existing dispatch board',str(p))
text=rep(text,'<div class="pbk">Dispatch<br>load line-up</div>','<div class="pbk">Dispatch<br>${l.booking801 ? (l.departure_order == null ? \'DD departure order not supplied\' : \'DD departure order\') : \'load line-up\'}</div>','dispatch board order label',str(p))
text=rep(text,'<div class="pbwhat"><b class="pbtime tm">${esc(l.time)}</b>','<div class="pbwhat">${l.booking801 ? \'Load time \' : \'\'}<b class="pbtime tm">${esc(l.time)}</b>','explicit loading clock',str(p))
text=rep(text,"${l.carrier ? ' · ' + esc(l.carrier) : ''}</div>\n <div class=\"pbrefs\">","${l.carrier ? ' · ' + esc(l.carrier) : ''}${l.booking801 ? ' · DD ' + esc(l.dd) : ''}</div>\n <div class=\"pbrefs\">",'dispatch docket numbers',str(p))
# A loading clock is never an inferred departure or site arrival clock on the booking sheets.
text=rep(text,"const arr = ((DATA.transport || {}).arrival || {}).after;","const arr = g.booking801 ? null : ((DATA.transport || {}).arrival || {}).after;",'booking arrival not supplied',str(p))
text=rep(text,"f(doc === 'drv' ? 'Load time' : 'Truck leaves', val(g.time, g.time ? (g.basis === 'plan' ? 'transport plan' : 'Kingston') : ''))","f(g.booking801 || doc === 'drv' ? 'Load time' : 'Truck leaves', val(g.time, g.time ? (g.basis === 'plan' ? 'transport plan' : 'Kingston') : ''))",'installer load clock label',str(p))
text=rep(text,'<th class="n">#</th><th>LOAD</th><th>LEFT KINGSTON</th>','<th class="n">${rows.some(r=>r.booking801)?\'DD ORDER\':\'#\'}</th><th>LOAD</th><th>${rows.some(r=>r.booking801)?\'LOAD AT KINGSTON\':\'LEFT KINGSTON\'}</th>','prestart clock label',str(p))
text=rep(text,'${esc(r.n || i + 1)}</td><td>${esc(r.item || r.product || \'\')}','${esc(r.booking801 ? bookingOrder801(r.departure_order) : (r.n || i + 1))}</td><td>${esc(r.item || r.product || \'\')}','prestart order value',str(p))
exec(Path(__file__).with_name('patch_v801_consumers.py').read_text())
p.write_text(text)
print('v8.01 applied: fourteen existing source rows, eleven trucks, DD departure order distinct from loading clock; operational records untouched')
