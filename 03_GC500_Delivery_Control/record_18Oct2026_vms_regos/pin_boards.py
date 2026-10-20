"""Author: Andrew Fisher. One spec for Andrew's VMS board pins: python3 pin_boards.py NAME 'VMS15:15:-27.991937:153.429354' ...
Writes <NAME>_spec.json (vms_plan ops, rounded to 6 places as the page keeps them) and prints each pin's distance from the plan's spot."""
import json, math, sys
t = open('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/live_now.html', encoding='utf-8').read()
s = t.index('window.VMS1024_DATA = ') + len('window.VMS1024_DATA = '); plan = {b['pos']: b for b in json.JSONDecoder().raw_decode(t[s:])[0]['boards']}
def dist(a, b):
    R = 6371000; la1, la2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1] - a[1]); dp = la2 - la1
    return 2 * R * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dl / 2) ** 2))
name, ops, said = sys.argv[1], [], []
for arg in sys.argv[2:]:
    board, pos, lat, lon = arg.split(':'); lat, lon = round(float(lat), 6), round(float(lon), 6); p = plan[pos]
    print(f'{board} -> plan {pos} ({p["title"][:60]}): {round(dist((lat, lon), (p["lat"], p["lon"])))} m')
    ops.append({'op': 'vms_plan', 'pos': pos, 'lat': lat, 'lon': lon, 'how': f"Andrew Fisher's pinned location for {board}, 20 Oct 2026"}); said.append(f'{board} {lat}, {lon} (plan {pos})')
json.dump({'by': 'Andrew Fisher', 'basis': "Andrew, 20 Oct 2026, board pins in chat: " + '; '.join(said) + '.', 'ops': ops}, open(name + '_spec.json', 'w'), indent=1, ensure_ascii=False)
