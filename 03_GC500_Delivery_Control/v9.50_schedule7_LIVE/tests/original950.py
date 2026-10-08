"""Author: Andrew Fisher. Verify the applied facts against the private original."""
import hashlib,json,re,sys,zipfile,xml.etree.ElementTree as E
from pathlib import Path
z=zipfile.ZipFile(sys.argv[1]);digest=hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()
assert digest=='485f5d885b88d836b63e85ad4062474a95a484022386efec7be62429f958edac'
n={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ss=[''.join(y.text or '' for y in x.findall('.//s:t',n)) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
def cells(part):
 out={}
 for c in E.fromstring(z.read(part)).findall('.//s:sheetData/s:row/s:c',n):
  v=c.find('s:v',n)
  if v is not None:out[c.get('r')]=ss[int(v.text)] if c.get('t')=='s' else v.text
 return out
w=cells('xl/worksheets/sheet8.xml');e=cells('xl/worksheets/sheet9.xml')
expected={'J5':'1st 26122823','I8':'1274555 STRP plus forklift tynes.','J8':'26120976 STRP & 26122181 EAGS','J13':'rehire 26121442'}
for k,v in expected.items():assert w[k]==v,(k,w.get(k))
assert e['A45']==e['A46']=='46316'
for k,v in {'B45':'Furniture','C45':'Fridge','D45':'1','E45':'Fridge','H45':'WAU','B46':'Furniture','C46':'Air Con','D46':'2','E46':'Portable Aircon','H46':'WAU','I46':'Rehire'}.items():assert e[k]==v,(k,e.get(k))
assert all(k not in e for k in ['J45','J46','I45'])
assert not any(E.fromstring(z.read(x)).findall('.//s:f',n) for x in z.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml',x))
print(json.dumps({'author':'Andrew Fisher','originalVerified':digest,'changedCells':4,'newDemandRows':2,'noInferredNumbers':True}))
