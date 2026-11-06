"""Author: Andrew Fisher. Read original private generator source cells without importing any record."""
from pathlib import Path
import argparse,hashlib,json,re,datetime,openpyxl
p=argparse.ArgumentParser();p.add_argument('--card',required=True);p.add_argument('--baseplan',required=True);p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
card=Path(args.card);w=openpyxl.load_workbook(card,data_only=True);rows=[]
for s in w:
    for row in s:
        if any(re.search(r'generator\s*\d+\s*kva',str(c.value),re.I) for c in row):
            rows.append({'sheet':s.title,'row':row[0].row,'values':[{'cell':c.coordinate,'value':c.value} for c in row if c.value is not None]})
(out/'card-original.json').write_text(json.dumps({'file':str(card),'sha256':hashlib.sha256(card.read_bytes()).hexdigest(),'rows':rows},indent=2,default=str)+'\n')
base=Path(args.baseplan);w=openpyxl.load_workbook(base,data_only=True);rows=[]
for s in w:
    header=list(next(s.values))
    for rn,values in enumerate(s.iter_rows(min_row=2,values_only=True),2):
        rec={str(k):v.isoformat() if isinstance(v,(datetime.datetime,datetime.date,datetime.time)) else v for k,v in zip(header,values) if k is not None}
        if re.search(r'generator|\d\s*kva\b',str(rec.get('Description','')),re.I):rows.append({'sheet':s.title,'row':rn,'values':rec})
(out/'baseplan2-original.json').write_text(json.dumps({'file':str(base),'sha256':hashlib.sha256(base.read_bytes()).hexdigest(),'rows':rows},indent=2)+'\n')
print(json.dumps({'originalWorkbooks':2,'baseplanDescribedRows':len(rows),'outputs':'private'}))
