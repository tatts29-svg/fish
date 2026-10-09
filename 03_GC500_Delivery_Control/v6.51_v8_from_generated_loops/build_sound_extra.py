#!/usr/bin/env python3
"""v6.51 - the three engine loops and the crowd, treated exactly as pipeline/gc3d/build_sound.py treats a clip (mono, peak -1 dBFS,
MP3 96 kbps 44.1 kHz, tail crossfaded over head for a seamless loop) and written to sound_extra.json as data URIs, beside
the three clips already in the page (which stay byte for byte as they are)."""
import sys, json, base64, hashlib, os
sys.path.insert(0, 'gc500/pipeline/gc3d'); os.environ['PATH'] = os.path.abspath('bin') + ':' + os.environ['PATH']
import build_sound as B
from pathlib import Path
picks = {'engine_lo': ('sfx/idle_a.mp3', 'V8 idle, flow 320nEUwxJJ0G85eJlBqA take A'), 'engine_mid': ('sfx/mid_b.mp3', 'V8 mid revs, flow 1GUwG3kMm1ksxM8AHiZQ take B'),
         'engine_hi': ('sfx/hi_b.mp3', 'V8 high revs, flow qHpMyxq0kEonkBkETLJC take B'), 'crowd': ('sfx/crowd.mp3', 'grandstand crowd, flow psL9D2b7AbA23SWxcvJ3')}
out, about = {}, {}
for k, (p, what) in picks.items():
    x = B.seamless(B.normalise(B.decode(Path(p))))
    mp3 = B.encode_mp3(x)
    out[k] = 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode()
    about[k] = {'file': 'sources/sound/' + k + '.mp3', 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16], 'seconds': round(len(x) / B.RATE, 2), 'bytes': len(mp3),
                'source': what + ' - generated on Andrew Fisher\'s ElevenLabs account, 26 Sep 2026, eleven_text_to_sound_v2, picked by analysis; loop crossfaded ' + str(round(min(B.XFADE, len(x) / B.RATE / 4), 2)) + ' s'}
    print(k, about[k]['seconds'], 's', about[k]['bytes'], 'bytes')
json.dump({'clips': out, 'about': about}, open('sound_extra.json', 'w'))
