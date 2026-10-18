# Author: Andrew Fisher. Keep source identities and status; join booked units by DD.
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(html):
    if 'function generatorRefLabel994(' in html:
        raise RuntimeError('Generator v9.94 is already applied')
    helper = (HERE / 'generators994.js').read_text()
    changes = [
        ('function refPlate(key, px, cls){\n const k = String(key == null ? \'\' : key);',
         helper + '\nfunction refPlate(key, px, cls){\n const k = generatorRefLabel994(key);',
         'Use the known Concert name on shared reference plates'),
        ('   const nums=(l.asset_numbers || []).slice();',
         '   const nums=generatorBookingNumbers994(a,e,l);',
         'Exact rental delivery docket identifies each Concert load asset'),
        ('  const name = written.known && written.text || ldPlace(asset) || asset.name || asset.product || \'Destination unconfirmed\';',
         '  const name = asset.key === \'GN?\' ? \'generators\' : written.known && written.text || ldPlace(asset) || asset.name || asset.product || \'Destination unconfirmed\';',
         'Concert generator load name'),
        ('  const source = destination && destination.sms || written.source || \'Destination to confirm\';',
         '  const source = asset.key === \'GN?\' && (!destination || destination.kind === \'report\') ? \'Exact map position not recorded\' + (destination && destination.kind === \'report\' ? \' · report to pit lane\' : \'\') : destination && destination.sms || written.source || \'Destination to confirm\';',
         'Keep the missing exact Concert position explicit'),
        ("'<span class=\"tl846-identity\"><span class=\"ld-c\"><b>' + esc(asset.key) + '</b><span class=\"tl846-name\">'",
         "'<span class=\"tl846-identity\"><span class=\"ld-c\"><b>' + esc(generatorRefLabel994(asset.key)) + '</b><span class=\"tl846-name\">'",
         'Build load reference is descriptive without changing data keys'),
        ("row.a.key + ' ' + statuses[index].word.toLowerCase()",
         "generatorRefLabel994(row.a.key) + ' ' + statuses[index].word.toLowerCase()",
         'Build accessible load name'),
        ('${esc(a.reference_state)}</span></dd>',
         '${esc(generatorReferenceNote994(a))}</span></dd>',
         'Keep original schedule reference in record details'),
        ("out.push({kind: 'asset', key: a.key, name: a.name || '', type:",
         "out.push({kind: 'asset', key: a.key, name: a.key === 'GN?' ? 'Concert generators' : a.name || '', type:",
         'Search shows the sourced Concert generators description'),
        ("hay: [a.key, a.name, a.product,...(a.item_types || [])",
         "hay: [a.key, a.key === 'GN?' ? 'Concert generators' : a.key === 'GN13' ? destinationOf(a).text : '', a.name, a.product,...(a.item_types || [])",
         'Search accepts Concert generators while retaining original GN key'),
        (" return typeof window!=='undefined'&&window.Reference973?window.Reference973.destination(a,destination973):destination973;",
         " return generatorDestination994(a,typeof window!=='undefined'&&window.Reference973?window.Reference973.destination(a,destination973):destination973);",
         'Name the proven GN13 orange symbol without moving its position'),
        ("const rows=bookingRows801(a); if(!rows.length)return '';\n const body=rows.map(({b})=>{",
         "const rows=bookingRows801(a); if(!rows.length)return '';\n const body=rows.map(({b,e})=>{",
         'Booking detail retains the source event for exact DD matching'),
        ("${esc(l.asset_numbers.length?l.asset_numbers.join(', '):(b.asset_text || 'Not supplied'))}",
         "${esc(generatorBookingNumbers994(a,e,l).join(', ') || b.asset_text || 'Not supplied')}",
         'Show matched unit on each booked-delivery detail'),
        ("['R11', QH_OPEN, 'Concert generators - which GN and where?', 'Two synced 200 kVA units, brand new, assets 1316182 and 1316183, planned for 12 Oct. The schedule calls them \"GN?\".', 'Their GN number and where they go on the drawing. We won’t make up a number.', 'plant']",
         "['R11', QH_OPEN, 'Concert generators — exact map position', 'Two synced 200 kVA units: 1316182 on DD 26121298, loading 11:00; 1316183 on DD 26121310, loading 11:30. Scheduled 12 Oct.', 'Match the exact Concert generator position to the issued plan. Asset identities and delivery dockets are known; no arrival is inferred from a booking.', 'plant']",
         'Ask only for the remaining exact position, not known identities'),
    ]
    for old, new, label in changes:
        html = rep(html, old, new, label, 'generators994')
    return html
