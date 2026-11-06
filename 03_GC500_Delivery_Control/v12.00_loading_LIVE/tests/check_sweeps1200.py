"""Author: Andrew Fisher. Validate actual tab destinations and sanitise sweep evidence."""
import json,sys
from pathlib import Path
root=Path(sys.argv[1]);out={}
aliases={'register':'#plant',**dict.fromkeys(['journal','breakdowns','variances','edit','change','add','nights'],'#today')}
deep={'#timeline':'pane-timeline','#day/2026-09-28':'pane-timeline','#change/2026-09-28':'pane-today',
 '#print/drivers/2026-09-28':'pane-timeline','#sheet/__satellite3d':'pane-map','#plant':'pane-plant','#today':'pane-today'}
for shape in ['desktop','phone']:
    r=json.loads((root/f'sweep-{shape}.log').read_text())
    assert len(r['tabs'])==27 and len(r['hashes'])==7
    assert not r['allErrors'] and not r['cons'] and not r['counts']['blocked']
    for name,t in r['tabs'].items():
        assert not t['errors'] and not t['console'] and not t['goerr'],name
        if name in aliases:assert not t['shown'] and t['hash']==aliases[name],name
        else:assert t['shown'],name
    for name,pane in deep.items():assert r['hashes'][name]['pane']==pane and not r['hashes'][name]['errors'],name
    assert r['hashes']['#print/drivers/2026-09-28']['bar']
    assert r['back']=={'hash':'#plant','pane':'pane-plant'}
    out[shape]={'routes':27,'direct_panes':19,'deep_links':7,'errors':0,'console_errors':0,'attempted_writes':0,'back':r['back']}
    print(shape,'PASS: 27 routes, 7 deep links and Back; zero errors or writes')
(root/'sweeps.json').write_text(json.dumps(out,indent=2)+'\n')
