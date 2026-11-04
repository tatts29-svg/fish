"""Author: Andrew Fisher. Pack Demob cards and show each daily count once."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(source):
    if '<style id="demob-clarity1299-style">' in source:
        raise ValueError('Demob card clarity v12.99 already applied')
    if 'W.MapBeacon1298=' not in source or 'class="dl1238"' not in source:
        raise ValueError('Requires v12.98 native Demob cards and map glow')
    addition = '<style id="demob-clarity1299-style">\n' + (HERE / 'demob_clarity1299_src.css').read_text() + '\n</style>\n'
    source = rep(source, '<script id="singles1238-script">', addition + '<script id="singles1238-script">', 'Demob card packing', 'v12.99')
    source = rep(source,
        "const rows = [{label: 'Picked up', value: iso > t ? 'to come' : units + (units === 1 ? ' unit' : ' units') + (last ? ' · last ' + hhmm(last) : '')}];",
        "const rows = last ? [{label: 'Last pickup', value: hhmm(last)}] : [];",
        'Keep last pickup while the progress panel owns the daily count', 'v12.99')
    source = rep(source, 'BuildWorkView986.card(work)+', "(work.rows.length?BuildWorkView986.card(work):'')+",
        'Omit an empty duplicate summary without a false Nothing scheduled message', 'v12.99')
    return source
