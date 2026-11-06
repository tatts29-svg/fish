"""Author: Andrew Fisher. Short browser batches with source-bound frame resumption."""
import argparse
import json
import os
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
parser.add_argument('--width', type=int, default=3840)
parser.add_argument('--height', type=int, default=2160)
parser.add_argument('--batch', type=int, default=30)
args = parser.parse_args()
frames = [0, *range(31, 661), 960]
root = Path(__file__).parent
pause_file = args.output / 'pause-after-batch'

for index in range(0, len(frames), args.batch):
    batch = frames[index:index + args.batch]
    evidence_path = args.output / 'capture-evidence.json'
    captured = set()
    if evidence_path.exists():
        captured = {shot['frame'] for shot in json.loads(evidence_path.read_text())['shots']}
    # The next real capture validates every resumed frame and source hash before rendering.
    if all(frame in captured for frame in batch):
        continue
    if pause_file.exists():
        print(json.dumps({'phase': 'paused', 'captured': len(captured),
                          'total_required': len(frames), 'lock': 'not requested'}), flush=True)
        break
    env = dict(os.environ, OUTDIR=str(args.output.resolve()),
               WIDTH=str(args.width), HEIGHT=str(args.height),
               FRAMES=','.join(map(str, batch)), RESUME='1')
    env.setdefault('NODE_PATH', '/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules')
    print(json.dumps({'phase': 'batch-start', 'first': batch[0], 'last': batch[-1],
                      'total_required': len(frames)}), flush=True)
    subprocess.run(['flock', '/tmp/gc500-browser.lock', 'node',
                    str(root / 'capture_machine997.cjs')], env=env, check=True)
    evidence = json.loads(evidence_path.read_text())
    print(json.dumps({'phase': 'batch-complete', 'captured': len(evidence['shots']),
                      'total_required': len(frames), 'lock': 'released'}), flush=True)
