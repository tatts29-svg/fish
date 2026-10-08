#!/usr/bin/env python3
"""Author: Andrew Fisher. Wed 14 Oct 2026 Esplanade arrival plan, A4 portrait, one page."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
M = json.load(open(os.path.join(HERE, 'maps.json')))
FONTS = open(os.path.join(HERE, 'fonts.css')).read()

ORDER = [  # from the page record, 9 Oct 2026 (record 4659): flow891 order, loading872 door sides, handling875 tilt-tray
    (1, 'P25', 'Support Category Stewards', 'Building 4.8 m', 'asset 1189408', 'Passenger side'),
    (2, 'P66', 'Support Category Scrutineers', 'Building 6 m', '', 'Driver side'),
    (3, 'P65', 'Support Categories Race Secretary', 'Building 6 m', '', 'Passenger side'),
    (4, 'P67', 'Gate 6 Security Office', 'Building 6 m', '', 'Driver side'),
]
rows = ''.join(f'''<tr><td class="n"><span>{n}</span></td><td class="ref">{ref}</td><td><b>{what}</b><small>{name}{(' · ' + asset) if asset else ''}</small></td>
<td class="door"><span class="{ 'drv' if door.startswith('Driver') else 'pas'}">Door to<br><b>{door}</b></span></td><td class="un">Tilt-tray</td></tr>''' for n, ref, name, what, asset, door in ORDER)

html = f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Wed 14 Oct · Esplanade arrival plan</title>
<style>{FONTS}
@page {{ size: A4 portrait; margin: 0 }}
* {{ box-sizing: border-box }}
html, body {{ margin: 0; background: #fff; color: #13272f; font: 400 10pt/1.35 Inter, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact }}
.page {{ width: 210mm; height: 297mm; padding: 9mm 10mm 8mm; display: flex; flex-direction: column; gap: 4mm; overflow: hidden }}
header {{ display: grid; grid-template-columns: 1fr auto; align-items: end; border-bottom: 1.2mm solid #ff6a13; padding-bottom: 3mm }}
.kick {{ font: 700 8pt/1 Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #5b6f75 }}
h1 {{ margin: 1.6mm 0 0; font: italic 700 25pt/1 'Barlow Condensed', 'Arial Narrow', sans-serif; letter-spacing: .01em; text-transform: uppercase }}
h1 em {{ font-style: italic; color: #ff6a13 }}
.date {{ text-align: right; font: italic 700 15pt/1.05 'Barlow Condensed', sans-serif; text-transform: uppercase }}
.date small {{ display: block; font: 600 7.5pt/1.3 Inter, sans-serif; letter-spacing: .04em; text-transform: none; color: #5b6f75; margin-top: 1mm }}
.must {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.4mm }}
.must div {{ background: #13272f; color: #fff; border-radius: 2.2mm; padding: 2.6mm 3mm; font: 600 8pt/1.25 Inter, sans-serif }}
.must b {{ display: block; font: italic 700 15pt/1 'Barlow Condensed', sans-serif; text-transform: uppercase; color: #ffb27d; margin-bottom: .8mm }}
.must div:first-child {{ background: #ff6a13 }} .must div:first-child b {{ color: #fff }}
table {{ width: 100%; border-collapse: separate; border-spacing: 0 1.6mm; margin-top: -1.6mm }}
th {{ text-align: left; font: 700 7pt/1 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #5b6f75; padding: 0 2mm }}
td {{ background: #f2f6f7; padding: 2mm; vertical-align: middle }}
td:first-child {{ border-radius: 2mm 0 0 2mm }} td:last-child {{ border-radius: 0 2mm 2mm 0 }}
td.n {{ width: 12mm }} td.n span {{ display: grid; place-items: center; width: 9mm; height: 9mm; border-radius: 50%; background: #13272f; color: #fff; font: 800 13pt/1 Inter, sans-serif }}
td.ref {{ width: 17mm; font: 800 13pt/1 Inter, sans-serif }}
td small {{ display: block; font-size: 7.6pt; color: #4b5e64; margin-top: .4mm }}
td.door {{ width: 38mm }} td.door span {{ display: block; border-left: 1.4mm solid; padding-left: 2mm; font-size: 7.4pt; line-height: 1.2 }}
td.door b {{ font-size: 10pt }} .drv {{ border-color: #ff6a13 }} .pas {{ border-color: #2c7da0 }}
td.un {{ width: 20mm; font-weight: 700; font-size: 8.4pt }}
.maps {{ display: grid; grid-template-columns: 1fr 1.12fr; gap: 3mm }}
figure {{ margin: 0; display: flex; flex-direction: column; min-height: 0 }}
figcaption {{ font: 700 7.4pt/1.2 Inter, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #5b6f75; margin-bottom: 1.4mm }}
.frame {{ height: 93mm; border-radius: 2.5mm; overflow: hidden; border: .4mm solid #c9d4d7; background: #eef2f3 }}
svg.map {{ width: 100%; height: 100%; display: block }}
.t-num {{ font: 800 19px Inter, sans-serif; fill: #fff }} .t-step {{ font: 700 21px Inter, sans-serif; fill: #13272f }}
.t-hold {{ font: italic 700 26px 'Barlow Condensed', sans-serif; fill: #13272f; paint-order: stroke; stroke: #fff; stroke-width: 5px }}
.t-place {{ font: 800 14px Inter, sans-serif; letter-spacing: .16em; fill: #47606a; paint-order: stroke; stroke: #fff; stroke-width: 4px }}
.t-n {{ font: 800 11px Inter, sans-serif; fill: #13272f }} .t-sc {{ font: 700 13px Inter, sans-serif; fill: #13272f }}
.t-slot {{ font: 800 19px Inter, sans-serif; fill: #13272f }}
.t-box {{ font: italic 700 24px 'Barlow Condensed', sans-serif; fill: #13272f }} .t-boxs {{ font: 700 15px Inter, sans-serif; fill: #13272f }}
.t-boxw {{ font: italic 700 24px 'Barlow Condensed', sans-serif; fill: #fff }} .t-boxws {{ font: 600 13.5px Inter, sans-serif; fill: #fff }}
.t-road {{ font: 700 16px Inter, sans-serif; fill: #13272f; paint-order: stroke; stroke: #fff; stroke-width: 5px }}
.rules {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 5mm; margin: 0; padding: 0; list-style: none; counter-reset: r }}
.rules li {{ position: relative; padding-left: 7mm; font-size: 8.6pt; line-height: 1.3 }}
.rules li::before {{ counter-increment: r; content: counter(r); position: absolute; left: 0; top: .2mm; width: 5mm; height: 5mm; border-radius: 50%; background: #ff6a13; color: #fff; font: 800 7.5pt/5mm Inter, sans-serif; text-align: center }}
.rules b {{ font-weight: 800 }}
h2 {{ margin: 0 0 1.6mm; font: italic 700 13pt/1 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: .02em }}
footer {{ display: flex; justify-content: space-between; gap: 4mm; border-top: .3mm solid #c9d4d7; padding-top: 1.8mm; font-size: 6.6pt; color: #5b6f75 }}
</style></head><body><div class="page">
<header><div><div class="kick">GC500 · Coates · Driver arrival plan · run sheet insert</div><h1>Esplanade drop — <em>arrive in order</em></h1></div>
<div class="date">Wednesday 14 Oct 2026<small>Narrowneck · Esplanade at Higman St</small></div></header>
<div class="must">
<div><b>In this order</b>P25 → P66 → P65 → P67. No truck jumps the one in front.</div>
<div><b>Parked by 07:00</b>All four in the strip before the 07:00–09:00 no-travel window.</div>
<div><b>TC from 06:00</b>Traffic controllers on site from 06:00. Follow their directions.</div>
<div><b>Doors right</b>Building door on the side shown below, for tilt-tray unloading.</div>
</div>
<section><h2>Arrival order</h2>
<table><thead><tr><th>Truck</th><th>Ref</th><th>Load</th><th>Building door (as loaded)</th><th>Unload</th></tr></thead><tbody>{rows}</tbody></table></section>
<div class="maps">
<figure><figcaption>Route in · about {M['overview']['route_m'] / 1000:.1f} km from the bridge</figcaption><div class="frame">{M['overview']['svg']}</div></figure>
<figure><figcaption>Holding strip &amp; drop · close-up</figcaption><div class="frame">{M['closeup']['svg']}</div></figure>
</div>
<section><h2>How to</h2><ol class="rules">
<li><b>Load at Kingston in this order</b> and leave by 05:00, building doors on the side shown.</li>
<li><b>Gold Coast Hwy over the Sundale Bridge</b>, then turn <b>left into Waterways Dr</b>.</li>
<li>At the roundabout take <b>MacArthur Pde</b>, then follow <b>Main Beach Pde</b> south.</li>
<li>At Narrowneck <b>keep left onto the Esplanade</b> (one-way) and stop in the <b>holding strip</b>.</li>
<li><b>Truck 1 goes to the front</b> at the Higman St end; 2, 3 and 4 pull up close behind in order.</li>
<li><b>Limited space: no overtaking, no queue-jumping.</b> A truck out of order waits until it is its turn.</li>
<li><b>Traffic control is on site from 06:00.</b> Follow their directions in and out.</li>
<li><b>All four parked before 07:00.</b> No travel to the Gold Coast 07:00–09:00.</li>
</ol></section>
<footer><span>Author: Andrew Fisher · Order, doors and unloading from the GC500 Delivery Control record (9 Oct 2026); drop positions from master plan D001-26003-03 (2 Oct 2026).</span><span>Map data © OpenStreetMap contributors</span></footer>
</div></body></html>'''
open(os.path.join(HERE, 'sheet.html'), 'w').write(html)
print('sheet.html', len(html))
