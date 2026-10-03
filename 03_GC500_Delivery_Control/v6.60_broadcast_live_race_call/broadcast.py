#!/usr/bin/env python3
"""The broadcast programme, from the takes Andrew Fisher downloads (sources/broadcast/), to print/web/broadcast.json.

Thirty-five turns in commentary register, generated on his ElevenLabs account (flow fAXpNixQN4wMsgD1ErKS, model
eleven_v3, LEAD on his own designed voice Gc500, COLOUR on Josh — Warm Conversational Australian). The sandbox
cannot reach the generation host, exactly as it could not for the three sound effects in v5.40, so the takes come
the same way: he downloads them and drops them in, named by their slot.

    sources/broadcast/programme.json   the spine — turn order, who speaks, which section, the words, the
                                       measured length, and which turns hold a live figure while they play
    sources/broadcast/turnNN.mp3       the take for slot NN, 01 to 35

Each take is made mono, normalised to −1 dBFS peak and encoded at 96 kbps so it plays everywhere Safari included,
then embedded as a data URI. The hosted build pulls those bytes straight back out into the media folder by their
own SHA-256 (print/hosted_media.py already knows audio/mpeg), so the hosted page stays small and the file edition
still opens from file:// with the programme in it.

THE LENGTH IS THE CHECK. Every slot carries the length its take measured when it was generated. A file whose
length does not match its slot within half a second is reported and NOT used, because the likeliest way this
goes wrong is a rename putting turn 9 in slot 8 — and nothing downstream could tell.

A slot with no take is left out. The page then runs the programme without it and says so rather than sitting in
silence with no explanation. Needs ffmpeg with libmp3lame.

v5.79 — NO STAND-IN. A synthesised voice for the empty slots was built on the evening of 23 Sep 2026 and withdrawn
within the hour on Andrew Fisher's word: the broadcast is done by ElevenLabs, not by a robotic voice. The programme
carries his takes or nothing: a slot with no take is left out and said, and the page runs the scene to the slot's
own length in silence. Every turn still says standin:false, so a page can tell.

Run from the package root:  python3 pipeline/broadcast.py
Coates Industrial Solutions · GC500 — Author: Andrew Fisher."""
from __future__ import annotations
import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'sources/broadcast'
SPINE = SRC / 'programme.json'
OUT = ROOT / 'print/web/broadcast.json'
TOLERANCE_S = 0.5
BITRATE = '96k'


def probe_seconds(p: Path) -> float | None:
    try:
        r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                            '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                           capture_output=True, text=True, check=True)
        return float(r.stdout.strip())
    except Exception:
        return None


def encode(src: Path, bitrate: str = BITRATE) -> bytes | None:
    """Mono, peak-normalised to −1 dBFS, 96 kbps MP3. The original bytes are never shipped unmodified —
    they arrive at whatever level the generator produced and the programme has to sit at one level."""
    try:
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-ac', '1',
                            '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.891',   # v6.60 - the takes carry a circuit bed; dynaudnorm pumped it up in every pause
                            '-codec:a', 'libmp3lame', '-b:a', bitrate, '-f', 'mp3', 'pipe:1'],
                           capture_output=True, check=True)
        return r.stdout or None
    except Exception as e:
        print(f'  ! ffmpeg refused {src.name}: {e}', file=sys.stderr)
        return None


def main() -> int:
    if not SPINE.is_file():
        print(f'{SPINE} is not there — the programme spine is what says which slot is which turn.', file=sys.stderr)
        return 2
    spine = json.loads(SPINE.read_text(encoding='utf-8'))
    turns, out, missing, wrong = spine['turns'], [], [], []

    for t in turns:
        f = SRC / t['file']
        row = {k: t[k] for k in ('slot', 'turn', 'role', 'section', 'voice', 'secs', 'text', 'holds', 'loop')}
        row['standin'] = False          # v5.79 — always: the programme is his takes or nothing
        if not f.is_file():
            missing.append(t['file']); row['audio'] = None; out.append(row); continue
        got = probe_seconds(f)
        if got is None:
            wrong.append(f"{t['file']}: not readable as audio"); row['audio'] = None; out.append(row); continue
        if abs(got - t['secs']) > TOLERANCE_S:
            wrong.append(f"{t['file']}: {got:.2f}s where slot {t['slot']} expects {t['secs']:.2f}s "
                         f"— a rename has most likely put the wrong take here")
            row['audio'] = None; out.append(row); continue
        data = encode(f)
        if not data:
            wrong.append(f"{t['file']}: could not be encoded"); row['audio'] = None; out.append(row); continue
        row['audio'] = 'data:audio/mpeg;base64,' + base64.b64encode(data).decode('ascii')
        row['bytes'] = len(data)
        row['sha256'] = hashlib.sha256(data).hexdigest()
        row['measured_s'] = round(got, 2)
        out.append(row)

    have = [r for r in out if r.get('audio')]
    payload = {
        'schema': spine['schema'], 'revision': spine['revision'], 'author': spine['author'],
        'flow': spine['flow'], 'model': spine['model'], 'note': spine['note'],
        'turns': out,
        'about': {
            'have': len(have), 'of': len(out),
            'his_takes': len(have), 'standins': 0,
            'standin_is': None,       # v5.79 — a synthesised stand-in was withdrawn on Andrew Fisher's word: ElevenLabs or nothing
            'body_s': round(sum(r['secs'] for r in out if not r['loop']), 2),
            'loop_s': round(sum(r['secs'] for r in out if r['loop']), 2),
            'missing': missing, 'rejected': wrong,
            'encoded': f'mono, peak-normalised, {BITRATE} MP3',
            'stated': ('Turns with no take are left out and the page says so. No figure is spoken: a turn that '
                       'points at a number carries "holds" and the page shows that figure live beside it.'),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')

    mb = sum(r.get('bytes', 0) for r in have) / 1e6
    print(f'{OUT.relative_to(ROOT)}  ·  {len(have)} of {len(out)} turns  ·  {mb:.1f} MB encoded')
    if missing:
        print(f'  no take yet for {len(missing)}: ' + ', '.join(missing[:8]) + (' …' if len(missing) > 8 else ''))
    for w in wrong:
        print('  REJECTED  ' + w)
    return 0


if __name__ == '__main__':
    sys.exit(main())
