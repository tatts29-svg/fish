"""Author: Andrew Fisher. Assemble an offline, self-contained component preview."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
names = ('equipment-selected', 'equipment-complete', 'photo-saved')
assets = {name: {'lottie': json.loads((ROOT / 'assets' / f'{name}.json').read_text()),
                 'project': json.loads((ROOT / 'assets' / f'{name}.project.json').read_text())}
          for name in names}
html = (ROOT / 'preview.template.html').read_text()
for name in names:
    still = (ROOT / 'assets' / f'{name}.svg').read_text()
    still = re.sub(r'<title.*?</title>|<desc.*?</desc>', '', still, flags=re.S)
    still = re.sub(r' role="img"| aria-labelledby="[^"]*"', '', still)
    still = still.replace('<svg ', '<svg aria-hidden="true" ', 1)
    pattern = r'(<article class="card" data-animation="' + name + r'">)(.*?)(</article>)'
    def replace_card(match):
        card = re.sub(r'<svg class="fallback".*?</svg>',
                      lambda _: still.replace('<svg ', '<svg class="fallback" ', 1),
                      match[2], count=1, flags=re.S)
        card = card.replace('<div class="mini" aria-hidden="true"></div>',
                            '<div class="mini" aria-hidden="true">' + still + '</div>')
        return match[1] + card + match[3]
    html = re.sub(pattern, replace_card, html, count=1, flags=re.S)
runtime = (ROOT / 'vendor/lottie_light.min.js').read_text()
html = html.replace('/*__LOTTIE_RUNTIME__*/', runtime.replace('</script', '<\\/script'))
html = html.replace('/*__MOTION_ASSETS__*/', json.dumps(assets, separators=(',', ':')).replace('</', '<\\/'))
(ROOT / 'GC500-motion-preview.html').write_text(html)
print(f'Built self-contained preview: {len(html.encode())} bytes')
