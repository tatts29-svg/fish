#!/usr/bin/env python3
"""The showcase's sound, from the generated clips Andrew Fisher picks (sources/sound/), to print/web/show_sound.json.

Andrew Fisher, 17 Sep 2026: sound matters. The three effects were generated on his ElevenLabs account
(flow E0MRZ6U6AOerEiXbpd4t, model eleven_text_to_sound_v2 — generated effects, never broadcast audio); the sandbox
cannot download from the generation host, so he downloaded the takes and sent them (all kept in sources/sound/takes/);
the three used are here as:

    sources/sound/launch.mp3    the V8 leaving the line as the lights go out (4–5 s)
    sources/sound/engine.mp3    the V8 at steady revs, which this script turns into a seamless loop
    sources/sound/whoosh.mp3    the short camera whoosh into the chase shot

Each is normalised to −1 dBFS peak, made mono, encoded as MP3 at 96 kbps (plays everywhere, Safari included) and
embedded as a data URI; the engine clip has its last 0.4 s crossfaded (equal power) over its first 0.4 s so the
loop has no seam. Where a pick is not there, the STAND-IN synthesised by pipeline/gc3d/synth_sound.py
(print/web/standin_sound/) is used and named as such in DATA.showSound.about — his pick replaces it the moment it
is dropped in. A clip that is nowhere is left out and the page says so in GC3D.sound.log ("no clip"). Needs ffmpeg
with libmp3lame.

Run from the package root:  python3 pipeline/gc3d/build_sound.py
Coates Industrial Solutions · GC500 — Author: Andrew Fisher."""
from __future__ import annotations
import base64
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'sources/sound'
STANDIN = ROOT / 'print/web/standin_sound'
OUT = ROOT / 'print/web/show_sound.json'
RATE = 44100
CLIPS = ('launch', 'engine', 'whoosh', 'engine_lo', 'engine_mid', 'engine_hi', 'crowd')   # v6.51 - three engine loops crossfaded by revs, and the crowd
XFADE = 0.4


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode_mp3(samples: np.ndarray) -> bytes:
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / 'clip.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-i', '-',
                        '-codec:a', 'libmp3lame', '-b:a', '96k', str(out)], input=samples.astype(np.float32).tobytes(), check=True)
        return out.read_bytes()


def normalise(x: np.ndarray) -> np.ndarray:
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    return x * (10 ** (-1 / 20) / peak) if peak > 0 else x


def seamless(x: np.ndarray, secs: float = XFADE) -> np.ndarray:
    """Crossfade the tail over the head (equal power) and drop the tail, so the loop point is inaudible."""
    n = int(min(secs, len(x) / RATE / 4) * RATE)   # v6.51 - a one-second loop gets a quarter-second crossfade, not none
    if n < RATE // 100 or len(x) < 3 * n:
        return x
    head, tail, body = x[:n], x[-n:], x[n:-n]
    t = np.linspace(0, 1, n, dtype=np.float32)
    mixed = head * np.sin(t * np.pi / 2) + tail * np.cos(t * np.pi / 2)
    return np.concatenate([mixed, body])


def main() -> int:
    found = {}
    about = {'made_on': 'ElevenLabs, Andrew Fisher\'s account, 17 Sep 2026 — flow E0MRZ6U6AOerEiXbpd4t, eleven_text_to_sound_v2 (generated effects, not broadcast audio)',
             'treatment': f'mono, peak −1 dBFS, MP3 96 kbps {RATE} Hz; engine crossfaded {XFADE} s tail over head for a seamless loop', 'clips': {}}
    for k in CLIPS:
        cands = [p for ext in ('mp3', 'wav', 'm4a', 'aac', 'ogg') for p in [SRC / f'{k}.{ext}'] if p.is_file()]
        standin = False
        if not cands and (STANDIN / f'{k}.mp3').is_file():
            cands, standin = [STANDIN / f'{k}.mp3'], True
        if not cands:
            about['clips'][k] = None
            continue
        p = cands[0]
        x = normalise(decode(p))
        if k == 'engine' or k.startswith('engine_') or k == 'crowd':
            x = seamless(x)
        mp3 = encode_mp3(x)
        found[k] = 'data:audio/mpeg;base64,' + base64.b64encode(mp3).decode()
        about['clips'][k] = {'file': str(p.relative_to(ROOT)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()[:16],
                             'seconds': round(len(x) / RATE, 2), 'bytes': len(mp3),
                             'source': ('STAND-IN — synthesised in the build by pipeline/gc3d/synth_sound.py, 17 Sep 2026; his ElevenLabs pick replaces it when dropped in sources/sound/'
                                        if standin else 'one of the takes Andrew Fisher downloaded from his ElevenLabs flow E0MRZ6U6AOerEiXbpd4t and sent on 17 Sep 2026 — this one chosen by analysis, not by ear (sources/sound/README.md)')}
    if not found:
        if OUT.exists():
            OUT.unlink()
        print('no clips under sources/sound/ and no stand-ins — nothing written; the scene runs without sound clips (beeps only when sound is on)')
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({**found, 'about': about}, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(about['clips']), '→', OUT.relative_to(ROOT), f'{OUT.stat().st_size:,} bytes')
    return 0


if __name__ == '__main__':
    sys.exit(main())
