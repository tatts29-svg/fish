"""Author: Andrew Fisher. Check exported PDF content, navigation and map pages without exposing records."""
import json,sys
from pathlib import Path
import fitz
root=Path(sys.argv[1]);out={}
for device in ['native-desktop','native-phone']:
    doc=fitz.open(root/device/'pickup.pdf');text='\n'.join(p.get_text() for p in doc)
    out[device]={'pages':len(doc),'searchable_details':all(s in text for s in ['Demob pickup','Author: Andrew Fisher','No twin-steer','door','Navigation']),
        'navigation_link':any(p.get_links() for p in doc),'map_and_closeup':all(doc[n].get_images() for n in [0,len(doc)-1]),
        'numbered_pages':all(f'{i+1} / {len(doc)}' in p.get_text() for i,p in enumerate(doc))}
    assert len(doc)>=3 and all(out[device].values()),device
    print(device,'PDF content, maps and navigation PASS')
(root/'pdf-checks.json').write_text(json.dumps(out,indent=2)+'\n')
