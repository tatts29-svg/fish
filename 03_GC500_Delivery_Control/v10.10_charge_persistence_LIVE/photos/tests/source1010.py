"""Author: Andrew Fisher. FWF photo source and preservation guards; no browser or record writes."""
from pathlib import Path
import hashlib,importlib.util,json,re,subprocess,sys,tempfile
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('photos1010',HERE/'patch_photos1010.py');patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
source=Path(sys.argv[1]).read_text();candidate=patch.apply(source);checks=[]
def check(name,result):
 assert result,name
 checks.append({'name':name,'pass':True})
def block(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
for start,end,label in [
 ('const DATA =','\n','Original equipment data'),
 ('const ItemPhotos965 =','\n/* Author: Andrew Fisher. Item ownership','Other item photo/quantity model'),
 ('function photoLinksOf(', '/* ------------------------------------------------------------------ sending','One-document photo read/write/tombstone functions'),
 ('function photoIdb(', '/* the entry waiting','Durable outbox functions'),
 ('async function dropPhotoRemove(', '/* ------------------------------------------------------------------ photographs','Original remove-link path'),
 ('function model925(', 'function nativeEnv925(', 'Physical-unit model'),
 ('function photoUnits(', 'function friendly(ref,id)', 'Physical photo aliases and identity'),
 ('function guard(ref,id,slot,expected,replace){const data=read(ref)', 'function uploadControl(', 'Existing individual photo guard'),
 ('function chargeLines(', '/* ------------------------------------------------------------------ labour per piece','Typed quantity source'),
]:check(label+' unchanged',block(source,start,end)==block(candidate,start,end))
check('No new collection or native setter',not any(word in (HERE/'fwf_photos1010.js').read_text() for word in ['S.photoLinks =','S.dropPhotos =','SYNC_COLLS','photoLinkPut(','photoLinkRemove(','unitAdd(','stampIt(']))
check('FWF always has one photo path and keeps individual details',"FwfPhotos1010.isFwf(g.item)?FwfPhotos1010.card(a,model)+g.units.map(u=>rowHtml925(a,u,model)).join(''):quantity965?" in candidate)
check('Other item photo controls preserved',"if(FwfPhotos1010.isFwf(u.item)&&FwfPhotos1010.group(a,model))return '';const photos=" in candidate)
check('Aggregated photos not repeated under unassigned',".concat(ItemPhotos965.assigned(a,model,photos),FwfPhotos1010.photos(a,model,photos))" in candidate)
check('Native upload revalidates FWF group after image processing','item933.fwfGroup1010?FwfPhotos1010.guard(key,item933.unitId,slot,item933.expected,item933.replace)' in candidate)
check('Original caption editor and photo tools remain',block(source,"$$('[data-dphback]')",'\n}',)==block(candidate,"$$('[data-dphback]')",'\n}'))
try:patch.apply(candidate);raise AssertionError('Repeat patch accepted')
except ValueError:check('Repeated patch refused',True)
with tempfile.TemporaryDirectory(prefix='fwf1010-parse-') as folder:
 program=Path(folder)/'parse.cjs';payload=Path(folder)/'scripts.json'
 scripts=re.findall(r'<script\b[^>]*>(.*?)</script>',candidate,re.S|re.I);payload.write_text(json.dumps(scripts))
 program.write_text("const fs=require('fs'),vm=require('vm');const all=JSON.parse(fs.readFileSync(process.argv[2]));all.forEach((s,i)=>{try{new vm.Script(s)}catch(e){if(!s.trim().startsWith('{'))throw Error('script '+i+': '+e.message)}});console.log(all.length)")
 subprocess.run(['node',str(program),str(payload)],check=True,capture_output=True,text=True);check('Every inline script parses',True)
report={'author':'Andrew Fisher','pass':True,'checks':checks,'base':hashlib.sha256(source.encode()).hexdigest(),'standaloneCandidate':hashlib.sha256(candidate.encode()).hexdigest()}
(HERE/'evidence/source-controls.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'pass':True,'checks':len(checks)}))
