# Author: Andrew Fisher. The mock-up pictures as WebP: python3 to_webp897.py <png dir> <out dir> [quality]
import sys
from pathlib import Path
from PIL import Image
src, out = Path(sys.argv[1]), Path(sys.argv[2]); q = int(sys.argv[3]) if len(sys.argv) > 3 else 84; out.mkdir(parents=True, exist_ok=True)
for p in sorted(src.glob('*.png')):
    im = Image.open(p).convert('RGB'); f = out / (p.stem + '.webp'); im.save(f, 'WEBP', quality=q, method=6)
    print(f.name, im.size, f.stat().st_size, 'bytes')
