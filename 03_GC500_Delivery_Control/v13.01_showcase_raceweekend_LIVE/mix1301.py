#!/usr/bin/env python3
"""Author: Andrew Fisher. v13.01 - mix the picked raw takes exactly as v11.65/v11.83 did.

Each picked raw take (GC500 Race Caller, eleven_v3, two takes per turn, the pick in takes/picks.json) goes through the v11.65 mix:
voice EQ (90 Hz high-pass, +3 dB at 3 kHz) and 3:1 compression from -18 dB, 0.6 s tail, the 22 s circuit bed looped under it about
17 dB down with 0.4 s in / 0.5 s out, loudnorm -16 LUFS (TP -1.5, LRA 11), limiter, mono 44.1 kHz 96 kbps MP3. The bed is checked by
its SHA-256 (the one every race-call take is mixed on); it stays private with the raw takes.

    python3 mix1301.py <raw takes folder with tNN_a.mp3 / tNN_b.mp3> <bed22.mp3>     -> takes/turnNN.mp3 + takes/takes.json
"""
import hashlib, json, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
BED_SHA = 'ef9c6f661bcd45dce19edeeeeece32257e9c8e0e7ac93d8f8489e66f8819aa9c'   # the 22 s circuit bed every take is mixed on (v11.85 cut_turn30.py)


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def mix(raw, bed, out):
    total = round(seconds(raw) + 0.6, 3)
    f = ('[0:a]aformat=channel_layouts=mono,highpass=f=90,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-18dB:ratio=3:attack=10:release=120:makeup=3,apad=pad_dur=0.6[v];'
         '[1:a]aformat=channel_layouts=mono,atrim=0:%s,afade=t=in:d=0.4,afade=t=out:st=%s:d=0.5,volume=-8dB[b];'
         '[v][b]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.891') % (total, round(total - 0.5, 3))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-stream_loop', '-1', '-i', str(bed), '-filter_complex', f,
                    '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '96k', str(out)], check=True)


def main(raw_dir, bed):
    raw_dir = Path(raw_dir)
    if sha(bed) != BED_SHA: sys.exit('that is not the circuit bed the race call is mixed on')
    picks = json.loads((HERE / 'takes' / 'picks.json').read_text(encoding='utf-8'))
    out_dir = HERE / 'takes'; out_dir.mkdir(exist_ok=True); rows = []
    for slot in sorted(int(s) for s in picks):
        pick = picks[str(slot)]; raw = raw_dir / ('t%02d_%s.mp3' % (slot, pick['take']))
        if not raw.exists(): sys.exit('missing raw take %s' % raw.name)
        out = out_dir / ('turn%02d.mp3' % slot); mix(raw, bed, out); b = out.read_bytes()
        rows.append({'slot': slot, 'take': pick['take'], 'file': 'takes/turn%02d.mp3' % slot, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
                     'measured_s': round(seconds(out), 2), 'raw_sha256': sha(raw)})
        print('turn %2d: take %s, %5.2f s, %6d bytes, %s' % (slot, pick['take'], rows[-1]['measured_s'], len(b), rows[-1]['sha256'][:12]))
    (out_dir / 'takes.json').write_text(json.dumps(rows, indent=1))
    print('%d takes mixed, %.1f s' % (len(rows), sum(r['measured_s'] for r in rows)))


if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
