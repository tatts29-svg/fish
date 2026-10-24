"""Author: Andrew Fisher. Source-only XLSX transcription; no native or workbook writes."""
import ast, collections, datetime as dt, decimal, hashlib, json, re, sys
from pathlib import Path
from fencing_zip951 import parse
D = decimal.Decimal
SOURCE_SHA = '836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db'
FENCE='Temporary Fence (m) — '
CCB='Crowd Control Barriers (m) — '
CON=dict(zip('FGHIJKLMN',[FENCE+'Clean',FENCE+'Braced for Scrim',FENCE+'Relocation',FENCE+'Removal','Vehicle Gates','Ped. Gates',CCB+'Event',CCB+'Demarcation',CCB+'Flat Feet']))
EVENT=dict(zip('FGHIJKLMNOP',[FENCE+'Clean',FENCE+'Braced for Scrim',FENCE+'Hoarding',FENCE+'Relocation',FENCE+'Removal','Vehicle Gates','Ped. Gates',CCB+'Event',CCB+'Demarcation',CCB+'Flat Feet',CCB+'WPF']))
DECON=dict(zip('FGHIJK',[FENCE+'Clean',FENCE+'Relocation',FENCE+'Removal','Vehicle Gates','Ped. Gates',CCB+'Removal']))
BOUNDS={**{f'CON WK{6-i}':('C'+str(6-i),(dt.date(2026,9,7)+dt.timedelta(days=i*7)).isoformat(),(dt.date(2026,9,13)+dt.timedelta(days=i*7)).isoformat()) for i in range(6)},'EVENT WEEK':('EW','2026-10-19','2026-10-25'),'DECON WK1':('PW1','2026-10-25','2026-11-01'),'DECON WK2':('PW2','2026-11-02','2026-11-08'),'DECON WK3':('PW3','2026-11-09','2026-11-15')}

def number(value):
    value=str(value).strip()
    if not re.fullmatch(r'(?:\d+(?:\.\d*)?|\.\d+)',value): return None
    n=D(value)
    return int(n) if n==int(n) else float(n)

def scalar(cells, address, stack=()):
    """Re-evaluate source scalar arithmetic, never cached subtotals/cycles or arbitrary Excel code."""
    if address in stack: raise ValueError('circular formula '+address)
    c=cells.get(address,{})
    f=c.get('formula')
    if f is None:
        n=number(c.get('value',''))
        if n is None: raise ValueError('unquantified '+address)
        return D(str(n))
    if len(f)>200: raise ValueError('formula too long')
    expr=re.sub(r'\$?([A-Z]+)\$?(\d+)',lambda m:'cell_'+m[1]+m[2],f)
    def visit(n):
        if isinstance(n,ast.Expression):return visit(n.body)
        if isinstance(n,ast.Constant) and type(n.value) in (int,float):return D(str(n.value))
        if isinstance(n,ast.Name) and re.fullmatch(r'cell_[A-Z]+\d+',n.id):return scalar(cells,n.id[5:],(*stack,address))
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.UAdd,ast.USub)):return visit(n.operand)*(1 if isinstance(n.op,ast.UAdd) else -1)
        if isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
            a,b=visit(n.left),visit(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            return a/b
        raise ValueError('unsupported scalar formula '+address)
    try: result=visit(ast.parse(expr,mode='eval'))
    except (SyntaxError,decimal.DecimalException) as ex:raise ValueError('invalid scalar formula '+address) from ex
    if not result.is_finite() or result<0: raise ValueError('invalid quantity '+address)
    return result

def numeric(n):return int(n) if n==int(n) else float(n)
def date_of(c):
    value=c.get('display',c.get('value','')).strip()
    m=re.match(r'^(20\d\d-\d\d-\d\d)(?:T|$)',value)
    if m:return dt.date.fromisoformat(m[1]).isoformat()
    m=re.search(r'\b(\d{1,2})[- /]([A-Za-z]{3,9})[- /](20\d\d)\b',value)
    if m:
        try:return dt.datetime.strptime(f'{m[1]} {m[2][:3]} {m[3]}','%d %b %Y').date().isoformat()
        except ValueError:return None
    return None

def sum_rows(rows, categories):
    values={k:D(0) for k in categories}
    for row in rows:
        for k,v in row['quantities'].items():values[k]+=D(str(v))
    return {k:numeric(v) for k,v in values.items()}

def extract(parsed):
    if parsed['sha256']!=SOURCE_SHA:raise ValueError('Unreviewed fencing workbook hash')
    weeks=[]
    for name,(code,first,last) in BOUNDS.items():
        cells=parsed['sheets'][name]['cells']; cols=DECON if name.startswith('DECON') else EVENT if name=='EVENT WEEK' else CON
        rows=sorted({int(re.sub(r'\D','',a)) for a in cells})
        val=lambda a:cells.get(a,{}).get('value','').strip()
        total=next(r for r in rows if val('E'+str(r))=='Totals')
        tasks=[];status_counts=collections.Counter()
        for r in rows:
            rowcode=val('B'+str(r))
            if rowcode not in {x[0] for x in BOUNDS.values()} or not val('D'+str(r)) or not val('E'+str(r)):continue
            date=date_of(cells.get('C'+str(r),{}));reason=[];warnings=[]
            if r>total:reason.append('Below weekly total; awaiting schedule confirmation or historical carryover')
            if rowcode!=code:warnings.append('Week code '+rowcode+' differs from sheet; explicit task date retained')
            if date is None:reason.append('Date to confirm')
            elif not first<=date<=last:reason.append('Outside this 2026 programme week; date retained as written')
            notes_cols='L' if name.startswith('DECON') else 'QU' if name=='EVENT WEEK' else 'OS'
            comments=[{'cell':col+str(r),'text':val(col+str(r))} for col in notes_cols if val(col+str(r))]
            qs={};unknown=[];evidence={}
            for col,category in cols.items():
                a=col+str(r);raw=val(a)
                if not raw:continue
                c=cells[a]
                evidence[category]={'cell':a,'written':raw}
                if c.get('formula') is not None:evidence[category]['formula']=c['formula']
                try:qs[category]=numeric(scalar(cells,a))
                except ValueError:unknown.append({'type':category,'cell':a,'written':raw,'reason':'Quantity to confirm'})
            status=val(('N' if name.startswith('DECON') else 'S' if name=='EVENT WEEK' else 'Q')+str(r))
            if status:status_counts[status]+=1
            scope_text=' '.join(x['text'] for x in comments)+' '+status
            if re.search(r'not\s+in\s+(?:iedm\s+)?scope|not\s+billed\s+to\s+iedm',scope_text,re.I):
                reason.append('Explicitly outside iEDM / Supercars scope; retained as source evidence')
                if status and re.search(r'not\s+in\s+(?:iedm\s+)?scope',status,re.I):comments.append({'cell':('N' if name.startswith('DECON') else 'S' if name=='EVENT WEEK' else 'Q')+str(r),'text':status})
            tasks.append({'source_row':r,'source_range':f"'{name}'!B{r}:"+('N' if name.startswith('DECON') else 'U' if name=='EVENT WEEK' else 'S')+str(r),'week_code':rowcode,'date':date,'date_as_written':cells.get('C'+str(r),{}).get('display',''),'location':val('D'+str(r)),'description':val('E'+str(r)),'quantities':qs,'quantity_evidence':evidence,'unquantified':unknown,'notes':comments,'included':not reason,'held_reasons':reason,'source_warnings':warnings})
        included=[r for r in tasks if r['included']]
        days=[]
        for date in sorted({r['date'] for r in included}):
            dr=[r for r in included if r['date']==date]
            days.append({'date':date,'rows':len(dr),'totals':sum_rows(dr,cols.values()),'source_rows':[r['source_row'] for r in dr],'unquantified':[v for r in dr for v in r['unquantified']]})
        weeks.append({'sheet':name,'categories':list(cols.values()),'days':days,'totals':sum_rows(included,cols.values()),'rows':tasks,'ignored_source_status_counts':dict(status_counts),'unquantified':[v for r in included for v in r['unquantified']]})
    return {'schema':1,'author':'Andrew Fisher','source_file':Path(parsed['file']).name,'sha256':SOURCE_SHA,'received':'09 Oct 2026','content_matches_07_oct':True,'basis':'Known quantities on dated task rows, counted once. Subtotals, SUMMARY caches, copied completion words and held rows are not imported as work or actuals. Unquantified work remains to confirm. Programme movements include reused stock and are not unique hire inventory.','weeks':weeks,'carryover_sheets':[{'sheet':'RESIDENTS FENCING','dated_rows':44,'year':2025},{'sheet':'WORKS ON ROADS','dated_rows':122,'year':2025}],'coordination_only':{'sheet':'NO PARKING BOLLARDS - ALTUS','note':'Placement one day before fencing installation/removal and removal after completion are programme assumptions; dates, counts and bookings remain to confirm.'}}

if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('Usage: fencing_extract951.py original.xlsx output.json')
    out=extract(parse(Path(sys.argv[1])))
    Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
    print('Extracted reviewed source:',len(out['weeks']),'weeks;',sum(len(w['rows']) for w in out['weeks']),'source task rows')
