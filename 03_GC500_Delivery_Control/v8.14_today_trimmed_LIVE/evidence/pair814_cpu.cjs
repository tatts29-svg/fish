// Author: Andrew Fisher. Actual placement-function execution with synthetic geometry; no browser/network.
// node pair814_cpu.cjs <pre-pair-v814.html> [result.json]
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const original=fs.readFileSync(process.argv[2],'utf8'),patch=path.resolve(__dirname,'../patch_v814_pair_audit.py'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-pair814-'));
const checks=[],sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function check(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name+(detail?' '+JSON.stringify(detail):''));}
function apply(text,name){const file=path.join(temp,name+'.html');fs.writeFileSync(file,text);const r=spawnSync('python3',[patch,file],{encoding:'utf8'});return {file,r,text:fs.readFileSync(file,'utf8')};}
function source(html){const a=html.indexOf('function place799(box){'),b=html.indexOf("window.addEventListener('resize',",a);if(a<0||b<0)throw Error('placement source missing');return html.slice(a,b);}
function geometry(code,C,specs,isTodayHub=true,display='grid',rows='2px'){
 const items=specs.map(s=>({name:s.name,classes:new Set(s.classes||[]),dataset:{},visible:s.visible!==false,cssSpan:s.span||1,values:{'--sp95':String(s.height||100)},getClientRects(){return this.visible?[{}]:[];},classList:{contains(k){return this.owner.classes.has(k);}}}));
 for(const x of items){x.classList.owner=x;x.style={getPropertyValue:k=>x.values[k]||'',setProperty:(k,v)=>x.values[k]=v};}
 const box={isConnected:true,dataset:{},children:items,classList:{contains:k=>k==='mas95'},closest:()=>null,matches:s=>isTodayHub&&s==='#pane-today > .hub.mas95',C,display,rows};
 const ctx={box,getComputedStyle:x=>x===box?{display:box.display,gridAutoRows:box.rows,gridTemplateColumns:Array(box.C).fill('300px').join(' ')}:{gridColumnStart:'span '+x.cssSpan,gridColumnEnd:'auto'}};vm.createContext(ctx);vm.runInContext(code,ctx);
 const run=()=>{vm.runInContext('place799(box)',ctx);return items.map(x=>({name:x.name,column:x.values['--c799']||null,row:x.values['--r799']||null,placed:x.dataset.p799||null,wide:x.dataset.wide799||null}));};
 return {items,box,run};
}
const advice={name:'updates',classes:['advicecard'],span:2,height:110},team={name:'team',classes:['teamhub'],span:1,height:200},due={name:'due',classes:['hubcard'],span:1,height:150},alert={name:'alert',classes:['clashcard'],span:1,height:160};
try{
 const applied=apply(original,'first');check('patch applies to the original trimmed page',applied.r.status===0,applied.r.stderr||undefined);if(applied.r.status!==0)throw Error('patch failed');const candidate=applied.text;
 const before=sha(candidate),twice=spawnSync('python3',[patch,applied.file],{encoding:'utf8'});check('second application refuses and preserves bytes',twice.status!==0&&/already applied/.test(twice.stderr)&&sha(fs.readFileSync(applied.file))===before);
 const wrong=apply('function place799(box){}','wrong');check('wrong base refuses without mutation',wrong.r.status!==0&&wrong.text==='function place799(box){}');
 const absent=apply(original.replace(' const items = [];\n for (const k of kids) {',' const missing_items = [];\n for (const k of kids) {'),'missing');check('missing replacement anchor refuses without mutation',absent.r.status!==0&&absent.text===original.replace(' const items = [];\n for (const k of kids) {',' const missing_items = [];\n for (const k of kids) {'));
 check('only placement function changes',candidate.replace(source(candidate),'PLACE799')===original.replace(source(original),'PLACE799'));
 const beforeCode=source(original),code=source(candidate);
 for(const C of [2,3,4]){
  const g=geometry(code,C,[advice,team]),r=g.run();check('two-card Today pair uses 1 + '+(C-1)+' columns at C'+C,r[0].column==='1 / span 1'&&r[1].column==='2 / span '+(C-1)&&r.every(x=>x.row==='1'),r);
  for(const [name,items,home] of [['programme day',[due,advice,team],true],['extra visible alert',[advice,team,alert],true],['other section',[advice,team],false],['single card',[advice],true]]){
   const old=geometry(beforeCode,C,items,home).run(),now=geometry(code,C,items,home).run();check(name+' keeps existing placement at C'+C,JSON.stringify(old)===JSON.stringify(now),now);
  }
  const hidden=geometry(code,C,[advice,team,{...alert,visible:false}]).run();check('hidden cards do not suppress the visible pair at C'+C,hidden[0].column==='1 / span 1'&&hidden[1].column==='2 / span '+(C-1)&&hidden[2].placed===null);
 }
 const g=geometry(code,4,[advice,team]);for(const C of [4,3,2,4]){g.box.C=C;const r=g.run();check('same nodes resize to C'+C+' without stale spans',r[0].column==='1 / span 1'&&r[1].column==='2 / span '+(C-1),r);}
 for(const [name,display,rows,C] of [['phone','grid','auto',1],['paper','block','auto',4]]){const g=geometry(code,C,[advice,team],true,display,rows);g.items.forEach(x=>x.dataset.p799='1');const r=g.run();check(name+' removes placement and writes no grid coordinates',r.every(x=>!x.placed&&!x.column&&!x.row),r);}
 const report={author:'Andrew Fisher',baseSha256:sha(original),candidateSha256:sha(candidate),patchSha256:sha(fs.readFileSync(patch)),passed:checks.filter(c=>c.pass).length,total:checks.length,checks};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(report.passed+'/'+report.total+' CPU checks passed');process.exitCode=checks.every(c=>c.pass)?0:1;
}finally{fs.rmSync(temp,{recursive:true,force:true});}
