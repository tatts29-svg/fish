#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply the reviewed film component and private media input."""
from pathlib import Path
import sys
from film_release839 import apply

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v839.py WORKING_COPY.html; set COG_FILM839_INPUT and COG_FILM839_INPUT_SHA256')
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()), encoding='utf-8')
    print('Steering-wheel film integrated; existing media, car, maps and business records preserved.')
