# Author: Andrew Fisher. Existing load-list, pre-start, email and drop-card consumers.
text=rep(text,'function loadLi(l){\n const aft = arrivalAfter();','function loadLi(l){\n const aft = l.booking801 ? null : arrivalAfter();','load list arrival not supplied',str(p))
text=rep(text,"""<li><span class="tm" title="load time at ${esc((DATA.depot || {}).name || 'Coates Kingston')}">""","""<li>${l.booking801 ? '<b>DD departure ' + esc(bookingOrder801(l.departure_order)) + ' · DD ' + esc(l.dd) + '</b> · ' : ''}<span class="tm" title="load time at ${esc((DATA.depot || {}).name || 'Coates Kingston')}">""",'load list DD order',str(p))
text=rep(text,'<div><label>FIRST LOAD AWAY</label>',"""<div><label>${L.some(l=>l.booking801)?'FIRST BOOKED LOAD TIME':'FIRST LOAD AWAY'}</label>""",'prestart loading clock',str(p))
old_carrier="""<p class="sub">${esc(carrier.supplied_by || 'carrier')}, received ${esc(carrier.received || '')}. These are the
 carrier's own words and are not paired to a GC500 reference — a load names a building size, not a drop point.
 ${loadTimesLine()}</p>"""
new_carrier="""<p class="sub">${d.loads.some(l=>l.booking801) ? 'Andrew Fisher, received 2 Oct 2026. Leave Kingston in DD departure order. Loading times are shown separately; they are not departure or site arrival times. The generator has no DD order supplied.' : esc(carrier.supplied_by || 'carrier') + ', received ' + esc(carrier.received || '') + '. These are the carrier’s own words; pair each load to its references. ' + loadTimesLine()}</p>"""
text=rep(text,old_carrier,new_carrier,'booking source and instruction on dispatch cards',str(p))
text=rep(text,"""<p class="norate">${esc(carrier.authority || '')}</p></div>`) : ''}""","""<p class="norate">${d.loads.some(l=>l.booking801) ? 'Bookings supplied by Andrew Fisher; site arrival and delivery status remain separate.' : esc(carrier.authority || '')}</p></div>`) : ''}""",'booking authority in day dispatch',str(p))
text=rep(text,'<h1>Load ${cardEsc(l.n)} — ${cardEsc(fmtDate(l.date))}</h1>',"""<h1>${l.booking801 ? 'DD departure ' + cardEsc(bookingOrder801(l.departure_order)) : 'Load ' + cardEsc(l.n)} — ${cardEsc(fmtDate(l.date))}</h1>${l.booking801 ? '<p class="sub">DD ' + cardEsc(l.dd) + ' · ' + cardEsc(l.carrier) + '</p>' : ''}""",'drop card DD order',str(p))
text=rep(text,"+ (qty ? ' · qty ' + qty : ''); })","+ (qty ? ' · qty ' + qty : '') + (a._bookingSource801 ? ' · booked asset ' + ((a._bookingNumbers801 || []).join(', ') || a._bookingSource801.asset_text || 'not supplied') + ' · ' + [a._bookingSource801.activity,a._bookingSource801.notes,bookingConflict801(a,a._bookingSource801)].filter(Boolean).join(' · ') : ''); })",'drop card cargo and booking asset',str(p))
# The final integrated publication owns v8.01; standalone practice need not rewrite an older Showcase.
old_release='<meta name="gc500-release" content="v8.00">'
new_release='<meta name="gc500-release" content="v8.01">'
if old_release in text:
 text=rep(text,old_release,new_release,'integrated release version',str(p))
 for old_version,new_version in [
  ("G.showcase794={version:'v8.00',paint};", "G.showcase794={version:'v8.01',paint};"),
  ("return Object.assign(report,{version:'v8.00',cameraOverride:", "return Object.assign(report,{version:'v8.01',cameraOverride:")]:
  text=rep(text,old_version,new_version,'integrated Showcase report version',str(p))
else:
 assert 'name="gc500-release"' not in text, 'Unexpected release marker; re-review'
 text=rep(text,'<title>GC500 Delivery Control</title>',new_release+'\n<title>GC500 Delivery Control</title>','standalone release marker',str(p))

text=rep(text,"It is not early on site: ${esc(((DATA.transport || {}).arrival || {}).means || 'arrival is after the window opens')}","${l.booking801 ? 'Site arrival time was not supplied.' : 'It is not early on site: ' + esc(((DATA.transport || {}).arrival || {}).means || 'arrival is after the window opens')}",'early load tooltip independent of arrival',str(p))
text=rep(text,'show.loads.slice().sort((x, y) => x.time.localeCompare(y.time))','show.loads.slice().sort(bookingSort801)','Today DD order',str(p))
text=rep(text,'<p class="sub">${loadTimesLine()}</p>',"""<p class="sub">${show.loads.some(l=>l.booking801) ? 'Leave Kingston in DD order; listed times are booked loading times, not the departure sequence. No site arrival time supplied.' : loadTimesLine()}</p>""",'Today loading clock independent of departure sequence',str(p))
text=rep(text,"""<p class="norate">${esc(((DATA.transport || {}).carrier || {}).authority || '')}</p></div>""","""<p class="norate">${show.loads.some(l=>l.booking801) ? 'Bookings supplied by Andrew Fisher, 2 Oct 2026. Delivery status remains separate.' : esc(((DATA.transport || {}).carrier || {}).authority || '')}</p></div>""",'Today booking authority',str(p))

# A reference may now travel on several booked trucks; retain legacy identities for other loads.
text=rep(text,"function ldId(d, g){ return d.iso + '|' + g.kind + '|' + ((g.rows[0] || {}).a || {}).key; }","function ldId(d, g){ return d.iso + '|' + g.kind + '|' + (g.booking801 && g.truck_id ? 'booking:' + g.truck_id : ((g.rows[0] || {}).a || {}).key); }",'individual booking day-card identity',str(p))
text=rep(text," const o = state.tlLoad; if (!o) return false;\n const p = String(o).split('|')"," const o = state.tlLoad; if (!o) return false;\n if(g.booking801 && g.truck_id)return o===ldId(d,g);\n const p = String(o).split('|')",'open only the selected booked truck',str(p))

# The legacy checks treat load_time as a departure clock. Supplied bookings explicitly do not.
text=rep(text,"return (a.events || []).filter(e => e.movement !== 'remove').map(e => { const m = hhmm782(e.load_time);","return (a.events || []).filter(e => e.movement !== 'remove' && !e.booking801).map(e => { const m = hhmm782(e.load_time);",'exclude booking clocks from inferred departure and arrival',str(p))
text=rep(text,"if (!L.length) return ['no load time on the schedule - to be unloaded by '","if (!L.length) return [(bookingRows801(a).length ? 'no departure time supplied; booked loading times are separate - to be unloaded by ' : 'no load time on the schedule - to be unloaded by ')",'explicit ETA planning does not pretend loading clock is departure',str(p))
text=rep(text,' L.push(LOAD782);',' L.push(bookingLoadingWords801(a) || LOAD782);','Full details supplied loading facts',str(p))
text=rep(text,"esc(LOAD782.replace(/^LOAD: f/, 'F'))","esc(bookingLoadingWords801(a) ? bookingLoadingWords801(a).replace(/^LOAD: /, '') : LOAD782.replace(/^LOAD: f/, 'F'))",'drawer supplied loading facts',str(p))

# The selected truck's numbers are the supplied booking numbers, not every allocation on its reference.
text=rep(text,'<div class="dcno"><em>Asset no.</em><b>${assetNosLine(a) || \'<span class="todo">none supplied</span>\'}</b></div>','<div class="dcno"><em>${Array.isArray(a._bookingNumbers801) ? \'Booked asset\' : \'Asset no.\'}</em><b>${bookingNosLine801(a) || \'<span class="todo">none supplied</span>\'}</b></div>','selected booking header numbers',str(p))
for eventword in ['events','(events || [])']:
 text=rep(text,'const inferred = '+eventword+'.some(e => !e.movement_stated);','const inferred = '+eventword+'.some(e => !e.movement_stated && (!e.booking801 || e.bookingMoved801));','explicit booking movement provenance '+eventword,str(p))
