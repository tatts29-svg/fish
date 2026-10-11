#!/usr/bin/env python3
"""Author: Andrew Fisher. Encode local preview media; never upload or alter site data."""
import argparse
import json
import subprocess
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('directory', type=Path)
p.add_argument('--verified-start', type=float, help='Start confirmed against recorded staff frames')
args = p.parse_args()
report = args.directory / 'checks.json'
data = json.loads(report.read_text())
duration = float(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', data['rawVideo']], text=True).strip())
start = args.verified_start
if start is None:
    start = max(0, duration - data['postSequenceSeconds'] - data['sequenceSeconds'])
length = data['sequenceSeconds']
assert 0 <= start < duration and start + length <= duration + 0.25

def ffmpeg(*opts):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *map(str, opts)], check=True)

mp4 = args.directory / 'animated-build-preview.mp4'
webm = args.directory / 'animated-build-preview.webm'
gif = args.directory / 'animated-build-preview.gif'
ffmpeg('-ss', start, '-i', data['rawVideo'], '-t', length, '-an', '-vf', 'fps=30',
       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-movflags', '+faststart', mp4)
ffmpeg('-i', mp4, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32',
       '-deadline', 'realtime', webm)
ffmpeg('-i', mp4, '-filter_complex',
       f"fps=10,scale={min(data['width'],1080)}:-1:flags=lanczos,split[a][b];"
       '[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
       '-loop', '0', gif)
for label, second in [('first', 0), ('open', 5.8), ('last', max(0, length - .2))]:
    ffmpeg('-ss', second, '-i', mp4, '-frames:v', 1, args.directory / f'video-{label}-frame.png')
data['video'] = {'mp4': str(mp4), 'webm': str(webm), 'gif': str(gif),
                 'startSeconds': start, 'durationSeconds': length,
                 'trimBasis': 'staff frame verified' if args.verified_start is not None
                 else 'raw duration minus measured post-sequence tail and sequence duration'}
report.write_text(json.dumps(data, indent=2) + '\n')
print(json.dumps(data['video']))
