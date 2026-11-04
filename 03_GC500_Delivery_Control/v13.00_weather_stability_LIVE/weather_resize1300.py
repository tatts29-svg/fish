"""Author: Andrew Fisher. Width-only resize reveal for the shared weather day strip."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(source):
    """Guard one native day-strip resize listener; navigation reveals stay native."""
    if 'weatherResizeWidth1300' in source:
        raise ValueError('Weather strip resize guard already applied')
    if 'root.WeatherStrip1002={nearest,reveal,resetRefresh};' in source:
        target, label = 'root', 'weather1002-source'
    elif 'window.TimelineStrip937={reveal:pane=>WeatherStrip1002.reveal(pane)};' in source:
        target, label = 'window', 'timeline937-script'
    else:
        raise ValueError('Requires the native WeatherStrip1002 source')
    replacement = (HERE / 'weather_resize1300_src.js').read_text().rstrip().replace('root.', target + '.')
    return rep(source, target + ".addEventListener('resize',()=>reveal());", replacement,
               'preserve manual weather scroll on height-only resize', label)
