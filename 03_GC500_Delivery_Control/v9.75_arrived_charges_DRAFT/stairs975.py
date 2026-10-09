# Author: Andrew Fisher. Called by the v9.75 release owner after financial patches.
from pathlib import Path

def apply_stairs975(html):
    if 'script id="stairs975-script"' in html:
        raise RuntimeError('Stairs controls already applied')
    if 'function labourTicksHtml(a)' not in html or 'function labourUnits(a, item)' not in html:
        raise RuntimeError('Per-item labour controls base missing')
    src=Path(__file__).with_name('stairs975.js').read_text()
    anchor='</body>\n</html>'
    if html.count(anchor)!=1:
        raise RuntimeError('Page end anchor not unique')
    return html.replace(anchor,'<script id="stairs975-script">\n'+src+'\n</script>\n'+anchor)
