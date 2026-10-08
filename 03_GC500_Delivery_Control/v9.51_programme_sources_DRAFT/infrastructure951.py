"""Author: Andrew Fisher. Bounded workbook evidence; never imports operational state."""
import json
from pathlib import Path

def apply_infrastructure951(html, path=None):
    if 'function infrastructure951Row(' in html:
        raise ValueError('Infrastructure951 already applied')
    root=Path(path) if path else Path(__file__).parent
    if root.is_file(): root=root.parent
    evidence=json.loads((root/'infrastructure951.json').read_text())
    anchor='const DATA = '
    if html.count(anchor)!=1: raise ValueError('Expected unique DATA')
    start=html.index(anchor)+len(anchor)
    data,length=json.JSONDecoder().raw_decode(html[start:])
    if 'infrastructure_review951' in data: raise ValueError('Existing infrastructure evidence')
    known={a['key'] for a in data['assets']}
    if not {r['reference'] for r in evidence['rows']} <= known:
        raise ValueError('Source references must already exist; no automatic assets')
    data['infrastructure_review951']=evidence
    html=html[:start]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+html[start+length:]
    end=html.rfind('</body>')
    if end<0 or '</html>' not in html[end:]: raise ValueError('Missing final body end')
    return html[:end]+'<script id="infrastructure951">\n'+(root/'infrastructure951.js').read_text()+'\n</script>\n'+html[end:]
