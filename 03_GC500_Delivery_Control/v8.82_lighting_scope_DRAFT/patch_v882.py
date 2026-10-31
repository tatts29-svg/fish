# Author: Andrew Fisher. Preserve source records; correct source-derived display scope.
import sys,os,json,hashlib
from pathlib import Path
import openpyxl
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();assert 'function lighting882Projection(' not in s and 'function unloading881Marker(' in s
schedule=Path(os.environ['V882_SCHEDULE']);sha=hashlib.sha256(schedule.read_bytes()).hexdigest();assert sha=='6383ebdd66b2293453de07f85fd1812398d171c7ab75b2fad22196bbca8d4761'
w=openpyxl.load_workbook(schedule,read_only=True,data_only=True,keep_links=False)
boq=[r[2] for r in w['BOQ'].values if str(r[0] or '').strip()=='Light Tower' and str(r[1] or '').strip()=='Light Tower'];assert len(boq)==1 and isinstance(boq[0],(int,float)) and boq[0]>0
start=s.index('const DATA =')+len('const DATA =');D,end=json.JSONDecoder().raw_decode(s[start:].lstrip());raw=s[start:];offset=len(raw)-len(raw.lstrip());old=raw[offset:offset+end]
D['lighting_review882']={'source':'Schedule (5)','sha256':sha,'sheet':'BOQ','boq':boq[0],'map':'D024-26003-02','basis':'Symbol classification follows the D024 legend. Source totals are not overwritten.'}
s=rep(s,old,' '+json.dumps(D,ensure_ascii=False,separators=(',',':')),'lighting source review',str(p));s=rep(s,' · v8.81',' · v8.82','release footer',str(p));pos=s.index('</script>',s.index('const DATA ='));s=s[:pos]+'\n'+Path(__file__).with_name('lighting882_src.js').read_text()+'\n'+s[pos:];p.write_text(s)
