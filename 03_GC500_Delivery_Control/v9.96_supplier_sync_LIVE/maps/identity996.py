"""Author: Andrew Fisher. Add canonical identities to the existing parent map projection."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

def patch(html, path='GC500_Delivery_Control_hosted.html'):
    if 'const MapIdentity996 =' in html: raise ValueError('Map identity patch already applied')
    if 'function gcUnits925(' not in html or 'const ItemOwnership969 =' not in html: raise ValueError('Canonical identity readers unavailable')
    js=Path(__file__).with_name('identity996.js').read_text()
    end=html.rfind('</body>')
    if end < 0: raise ValueError('Page closing body unavailable')
    tail=html[end-120:]
    replacement=tail[:120]+'<script id="map-identity996-script">\n'+js+'\n</script>\n'+tail[120:]
    return rep(html, tail, replacement, 'Map search uses native current identities', path)
