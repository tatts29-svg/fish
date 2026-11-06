#!/usr/bin/env python3
"""Author: Andrew Fisher. v11.85 - race-call turn 30 without "two hundred and sixteen concrete blocks".

Andrew, 24 Oct 2026: "Concrete block are wrong ... What are concrete blocks are they not feet". They are: the 216 were docket
36566's feet, already inside the 8,235. A fresh voicing of the line was declined at the approval prompt and is not retried, so the
phrase is cut out of the take v11.83 used (GC500 Race Caller, take 30a, raw voice before the mix) and the result goes through the
v11.83 mix unchanged (voice EQ + compression, the 22 s circuit bed about 17 dB under, loudnorm -16 LUFS, mono 96 kbps).

The cut, from word timings (faster-whisper small.en) and the level in 10 ms steps, both in evidence/cut_turn30.txt:
  keep 0.00-11.98 s  "...that's more feet than a centipede convention!" and the first 0.24 s of the pause after it
  drop 11.98-15.22 s "Two hundred and sixteen concrete blocks -" and the breath after it
  keep 15.22 s-end   "every panel carried, stood and squared up by hand - foot by foot, around the whole circuit!"
with 0.18 s of silence between (the pause after "convention" stays about 0.47 s, as voiced) and 10 ms fades at both joins.

    python3 cut_turn30.py <raw take t30_a.mp3> <bed22.mp3>     -> takes/turn30.mp3 + takes/takes.json
"""
import hashlib, json, subprocess, sys, tempfile
from pathlib import Path
HERE = Path(__file__).resolve().parent
RAW_SHA = '3e7783737026ed8b30e337171e596813720d32a33e5d40ede3725af75d65dbe0'   # v11.83 take 30a, raw voice (raw/gens.json 30a)
BED_SHA = 'ef9c6f661bcd45dce19edeeeeece32257e9c8e0e7ac93d8f8489e66f8819aa9c'   # the 22 s circuit bed every take is mixed on
KEEP_A, KEEP_B, GAP, FADE = 11.98, 15.22, 0.18, 0.010


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def seconds(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def main(raw, bed):
    if sha(raw) != RAW_SHA: sys.exit('that is not take 30a as v11.83 used it')
    if sha(bed) != BED_SHA: sys.exit('that is not the circuit bed the race call is mixed on')
    out = HERE / 'takes' / 'turn30.mp3'; out.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        voice = Path(tmp) / 'voice.wav'
        cut = ('[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono,asplit=2[a][b];'
               '[a]atrim=0:%.3f,asetpts=PTS-STARTPTS,afade=t=out:st=%.3f:d=%.3f[a1];'
               '[b]atrim=start=%.3f,asetpts=PTS-STARTPTS,afade=t=in:d=%.3f[b1];'
               'aevalsrc=0:d=%.3f:s=44100:c=mono[g];[a1][g][b1]concat=n=3:v=0:a=1[v]') % (KEEP_A, KEEP_A - FADE, FADE, KEEP_B, FADE, GAP)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-filter_complex', cut, '-map', '[v]', '-c:a', 'pcm_s16le', str(voice)], check=True)
        total = round(seconds(voice) + 0.6, 3)
        mix = ('[0:a]aformat=channel_layouts=mono,highpass=f=90,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-18dB:ratio=3:attack=10:release=120:makeup=3,apad=pad_dur=0.6[v];'
               '[1:a]aformat=channel_layouts=mono,atrim=0:%s,afade=t=in:d=0.4,afade=t=out:st=%s:d=0.5,volume=-8dB[b];'
               '[v][b]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.891') % (total, round(total - 0.5, 3))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(voice), '-stream_loop', '-1', '-i', str(bed), '-filter_complex', mix,
                        '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '96k', str(out)], check=True)
    b = out.read_bytes()
    rows = [{'slot': 30, 'take': 'a, cut', 'file': 'takes/turn30.mp3', 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(),
             'measured_s': round(seconds(out), 2), 'from': {'raw_sha256': RAW_SHA, 'keep': [[0, KEEP_A], [KEEP_B, None]], 'gap_s': GAP}}]
    (HERE / 'takes' / 'takes.json').write_text(json.dumps(rows, indent=1))
    print('turn 30: %s, %.2f s, %d bytes' % (rows[0]['sha256'][:12], rows[0]['measured_s'], len(b)))


if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
