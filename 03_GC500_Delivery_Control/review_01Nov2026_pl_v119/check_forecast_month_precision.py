"""Author: Andrew Fisher. Synthetic only: date precision, no operational people or values."""
import ast, copy, datetime as dt, json, re, sys
from pathlib import Path
p=Path(sys.argv[1]);tree=ast.parse(p.read_text());names={'_est_presentation_leg','_edmy','_est_date_label','_est_sheet_date'}
mod=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in names],type_ignores=[])
ctx={'dt':dt,'re':re};exec(compile(mod,str(p),'exec'),ctx);conv=ctx['_est_presentation_leg'];label=ctx['_est_date_label'];sheet=ctx['_est_sheet_date']
base={'group':'nov_on_site','ref':'SYNTHETIC','what':'equipment','date':'2031-11-24','evidence':'on site at record 999 (3 Nov); came in on synthetic carrier','amount':1.23,'rate':1.23,'loads':1}
cases=[('observation-only',{},'2031-11'),('supported schedule',{'date':'2031-11-12','what':'equipment (Schedule 17 synthetic row, 12 Nov)'},'2031-11-12'),('booked',{'date':'2031-11-07','evidence':'booked 7 Nov on synthetic source'},'2031-11-07'),('conflicting description',{'what':'equipment (Schedule 17 synthetic row, 8 Nov)'},'2031-11'),('recorded actual',{'group':'oct_ran','date':'2031-10-28','evidence':'left site 28 Oct'},'2031-10-28')]
checks=[]
for name,changes,expected in cases:
 row=dict(base,**changes);before=copy.deepcopy(row);got=conv(row)
 for sub,ok in [('precision',got['date']==expected),('input immutable',row==before),('all other fields unchanged',{k:v for k,v in got.items() if k!='date'}=={k:v for k,v in before.items() if k!='date'}),('new object',got is not row)]:checks.append({'name':name+' '+sub,'pass':ok})
checks += [{'name':'month display','pass':label(conv(base))=='Nov forecast'},{'name':'month workbook','pass':sheet(conv(base))=='Nov forecast'},{'name':'scheduled day qualified','pass':label(conv(dict(base,date='2031-11-12',what='Schedule 17, 12 Nov')))=='12 Nov scheduled'},{'name':'actual workbook ISO retained','pass':sheet(dict(base,group='oct_ran',date='2031-10-28'))=='2031-10-28'}]
fail=[x for x in checks if not x['pass']];print(json.dumps({'checks':len(checks),'passed':len(checks)-len(fail),'failures':fail},indent=2));sys.exit(bool(fail))
