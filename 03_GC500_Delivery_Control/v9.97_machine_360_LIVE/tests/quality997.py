"""Author: Andrew Fisher. Compare busy encoded views with native lossless renders."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('capture', type=Path)
    args = parser.parse_args()
    root = args.capture
    report = json.loads((root / 'media-verification.json').read_text())
    video = next(row for row in report['outputs'] if row['mime'] == 'video/mp4' and row['width'] == 3840)
    assert hashlib.sha256(Path(video['path']).read_bytes()).hexdigest() == video['sha256']
    proof = json.loads((root / 'capture-evidence.json').read_text())
    shots = {shot['frame']: shot for shot in proof['shots']}
    selected = [150, 300, 390, 480, 570, 660]
    expression = '+'.join(f'eq(n\\,{frame})' for frame in selected)
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', video['path'], '-vf',
                                   'select=' + expression, '-fps_mode', 'vfr',
                                   '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'])
    decoded = np.frombuffer(raw, np.uint8).reshape(len(selected), 2160, 3840, 3)
    rows = []
    contact = Image.new('RGB', (1280, 6 * 384), '#16191b')
    draw = ImageDraw.Draw(contact)
    for index, frame in enumerate(selected):
        source = np.asarray(Image.open(shots[frame]['file']).convert('RGB'))
        error = decoded[index].astype(np.float32) - source.astype(np.float32)
        mae = float(np.abs(error).mean())
        psnr = float(10 * np.log10(255**2 / np.mean(error**2)))
        assert mae < 4 and psnr > 33, f'Encoded detail quality regression at frame {frame}'
        rows.append({'frame': frame, 'seconds': frame / 30, 'mean_abs_rgb_error': mae, 'psnr_db': psnr})
        image = Image.fromarray(decoded[index])
        image.save(root / f'decoded-4k-frame{frame}.png')
        for col, data in enumerate((source, decoded[index])):
            thumbnail = Image.fromarray(data)
            thumbnail.thumbnail((640, 360), Image.Resampling.LANCZOS)
            contact.paste(thumbnail, (640 * col, index * 384 + 24))
            draw.text((640 * col + 10, index * 384 + 5), f'{frame / 30:g}s — ' + ('Native render' if col == 0 else 'Encoded 4K'), fill='white')
    contact.save(root / 'encoded-quality-contact.jpg', quality=94)
    result = {'author': 'Andrew Fisher', 'video_sha256': video['sha256'],
              'pass': True, 'frames': rows,
              'scope': 'Native RGB versus decoded Rec.709 4K at staged opening and four orbit views; full-frame error thresholds, followed by visual inspection.'}
    (root / 'encoded-quality.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))


if __name__ == '__main__':
    main()
