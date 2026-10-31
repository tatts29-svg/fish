# Author: Andrew Fisher. Read-only original XLSX ZIP/XML audit; no workbook rewrite.
from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json,hashlib,re,datetime,posixpath
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

def xml(z,n):return E.fromstring(z.read(n))
def text(x):return ''.join(x.itertext()) if x is not None else ''
def parse(p):
 with zipfile.ZipFile(p) as z:
  ss=[text(x) for x in xml(z,'xl/sharedStrings.xml')] if 'xl/sharedStrings.xml' in z.namelist() else []
  styles=xml(z,'xl/styles.xml');formats={14:'mm-dd-yy',15:'d-mmm-yy',16:'d-mmm',17:'mmm-yy',18:'h:mm AM/PM',19:'h:mm:ss AM/PM',20:'h:mm',21:'h:mm:ss',22:'m/d/yy h:mm'}
  formats.update({int(x.get('numFmtId')):x.get('formatCode') for x in styles.findall('s:numFmts/s:numFmt',NS)})
  xfs=styles.find('s:cellXfs',NS);fills=styles.find('s:fills',NS);fonts=styles.find('s:fonts',NS)
  rels={x.get('Id'):x.get('Target') for x in xml(z,'xl/_rels/workbook.xml.rels')};wb=xml(z,'xl/workbook.xml');sheets={}
  for s in wb.find('s:sheets',NS):
   target=rels[s.get('{'+NS['r']+'}id')];name=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target);node=xml(z,name);cells={}
   for c in node.findall('.//s:sheetData/s:row/s:c',NS):
    v=c.find('s:v',NS);t=c.get('t');val=text(c.find('s:is',NS)) if t=='inlineStr' else (v.text if v is not None else '')
    if t=='s':val=ss[int(val)]
    f=c.find('s:f',NS);formula=f.text if f is not None else None
    if not val and formula is None:continue
    st=xfs[int(c.get('s','0'))];fmt=formats.get(int(st.get('numFmtId','0')),'General');display=val
    unquoted=re.sub(r'"[^"]*"|\[[^\]]*\]','',fmt).lower()
    if t not in ['s','inlineStr','e','b'] and re.search(r'[dy]',unquoted) and re.fullmatch(r'\d+(\.\d+)?',val):
     display=(datetime.datetime(1899,12,30)+datetime.timedelta(days=float(val))).isoformat()
    fill=E.tostring(fills[int(st.get('fillId','0'))],encoding='unicode');font=E.tostring(fonts[int(st.get('fontId','0'))],encoding='unicode')
    cells[c.get('r')]={'value':val,'display':display,'type':t,'formula':formula,'formula_attrs':f.attrib if f is not None else None,'number_format':fmt,'fill':fill,'font':font}
   sheets[s.get('name')]={'state':s.get('state','visible'),'cells':cells,'merges':[m.get('ref') for m in node.findall('s:mergeCells/s:mergeCell',NS)],'dimension':node.find('s:dimension',NS).get('ref')}
  props={x.tag.rsplit('}',1)[-1]:x.text for x in xml(z,'docProps/core.xml')}
  return {'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'properties':props,'sheets':sheets,'defined_names':[(x.get('name'),x.get('localSheetId'),x.text) for x in wb.findall('s:definedNames/s:definedName',NS)],'comment_parts':[n for n in z.namelist() if 'comment' in n.lower()],'external_links':[n for n in z.namelist() if 'externalLink' in n]}
