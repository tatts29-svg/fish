"""Author: Andrew Fisher. Private PDF report-content regression; no published amounts."""
import argparse
import json
import re
import subprocess
from pathlib import Path


def inspect(pdf, expected):
    result=subprocess.run(['pdftotext','-layout',str(pdf),'-'],check=True,capture_output=True,text=True)
    text=result.stdout
    flat=re.sub(r'\s+',' ',text).strip()
    compact=re.sub(r'\s+','',text)
    headings=expected.get('headings',[])
    wanted=expected.get('amounts',[])
    found=[]
    for row in wanted:
        value=row.get('value')
        if not isinstance(value,(int,float)):
            found.append({'id':row.get('id'),'present':False,'reason':'No numeric expected model value'})
            continue
        number=f'{abs(value):,.2f}'
        # Preserve cents. Allow PDF extraction to put a space after the currency sign,
        # and negative-sign placement used by the native formatter.
        present=('$'+number in compact) if value>=0 else any(x in compact for x in ['-$'+number,'$-'+number,'($'+number+')'])
        found.append({'id':row.get('id'),'present':present,'expected':value})
    warning='Not printed' in flat and ('twin-steer check' in flat or 'tick the' in flat)
    checks=[
        {'id':'pdf-report-headings-present','pass':bool(headings) and all(h.lower() in flat.lower() for h in headings)},
        {'id':'pdf-current-cent-totals-present','pass':bool(wanted) and all(r['present'] for r in found)},
        {'id':'pdf-is-not-warning-only','pass':not warning},
        {'id':'pdf-has-as-at-and-tax-basis','pass':bool(re.search(r'as at',flat,re.I)) and bool(re.search(r'AUD\s+EX\s+GST',flat,re.I))},
    ]
    return {'author':'Andrew Fisher','pdf':str(pdf),'checks':checks,'amounts':found,'extractedText':text}


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--pdf',required=True);p.add_argument('--expect',required=True);p.add_argument('--out',required=True);a=p.parse_args()
    try:
        result=inspect(Path(a.pdf),json.loads(Path(a.expect).read_text()))
        Path(a.out).write_text(json.dumps(result,indent=2)+'\n')
        for c in result['checks']:print(('PASS ' if c['pass'] else 'FAIL ')+c['id'])
        raise SystemExit(0 if all(c['pass'] for c in result['checks']) else 1)
    except (OSError,subprocess.SubprocessError,ValueError) as e:
        Path(a.out).write_text(json.dumps({'author':'Andrew Fisher','error':str(e),'checks':[{'id':'pdf-inspection-completed','pass':False}]},indent=2)+'\n')
        print('FAIL pdf-inspection-completed');raise SystemExit(2)
