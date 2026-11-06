// Author: Andrew Fisher. Proves fencing label corrections do not change executable logic.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const {babelParse}=require(path.join(path.dirname(require.resolve('playwright')),'lib/transform/babelBundle.js'));
const root=path.resolve(__dirname,'../..'),base=process.env.BASE||path.join(root,'build/GC500_v9.93-final/GC500_Delivery_Control_hosted.html');
const temp=process.env.OUTDIR||'/workspace/private-gc500-v994/fencing-static';fs.mkdirSync(temp,{recursive:true});
const python=`import sys\nfrom pathlib import Path\nsys.path.insert(0,sys.argv[1])\nimport fencing994\ns=Path(sys.argv[2]).read_text()\nPath(sys.argv[3]).write_text(fencing994.presentation_labels(s))\np=fencing994.patch(s)\nPath(sys.argv[4]).write_text(p)\ntry:\n fencing994.patch(p)\n raise AssertionError('Duplicate patch accepted')\nexcept ValueError as e:\n assert 'already applied' in str(e)\n`;
const labelFile=path.join(temp,'labels.html'),fullFile=path.join(temp,'fencing.html');
const run=spawnSync('python3',['-c',python,path.dirname(__dirname),base,labelFile,fullFile],{encoding:'utf8',maxBuffer:1024*1024});
assert.equal(run.status,0,run.stderr||run.stdout);
const old=fs.readFileSync(base,'utf8'),labels=fs.readFileSync(labelFile,'utf8'),full=fs.readFileSync(fullFile,'utf8');
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('application/json')).map(m=>m[2]);
const oldScripts=scripts(old),newScripts=scripts(labels);assert.equal(oldScripts.length,newScripts.length);
const checks=[];function check(ok,name){checks.push({name,pass:!!ok});assert(ok,name);}
function signature(script){
 // Native page scripts intentionally redeclare older function versions. A function
 // body preserves those semantics for Babel's parser, which otherwise assumes a module.
 const ast=babelParse('(function(){\n'+script+'\n})','fencing994-source.js',false);
 function clean(value){
  if(Array.isArray(value))return value.map(clean);
  if(!value||typeof value!=='object')return value;
  const out={};for(const [key,entry] of Object.entries(value)){
   if(['start','end','loc','extra','comments','leadingComments','innerComments','trailingComments'].includes(key))continue;
   out[key]=key==='value'&&['StringLiteral','TemplateElement','DirectiveLiteral'].includes(value.type)?'<display text>':clean(entry);
  }return out;
 }
 return JSON.stringify(clean(ast));
}
for(let i=0;i<oldScripts.length;i++)check(signature(oldScripts[i])===signature(newScripts[i]),'Executable syntax unchanged in script '+i+' (only string/template text differs)');
check(old.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'<script/>')===labels.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'<script/>'),'Label correction leaves all HTML and CSS unchanged');
for(const wording of ['confirmed behind','ahead; the rest on plan','Fencing behind the programme:','is BEHIND THE PROGRAMME:','Behind the programme by type</span>',' behind the selected-day plan','Early work on one type never makes up for a type behind.'])
 check(!labels.includes(wording),'Unsupported display wording retired: '+wording);
for(const wording of ["' behind on-site plan'","' ahead of on-site plan'","P.all.overdue_keys.length",'CCB classification needs review','Unconfirmed classifications retain the raw recorded allocation',"plan.status = plan.delta < 0 ? 'behind' : plan.delta > 0 ? 'ahead' : 'on-plan'",'out.behindCost = r2((out.behindCost || 0) + row.cost)'])
 check(labels.includes(wording),'Preserved native asset/qualification/quantity logic: '+wording);
check(full.includes('function fencingReview994()')&&!full.includes('what: `Fencing behind the 2026 programme'),'Only unsupported Coates Way fencing red retired');
check((full.match(/\['Fencing programme', 'On track · confirmed 12 Oct 2026'\]/g)||[]).length===1,'Dated confirmation occurs once in Operations');
fs.writeFileSync(path.join(temp,'fencing_labels994.json'),JSON.stringify({author:'Andrew Fisher',pass:true,checks},null,2));
console.log(JSON.stringify({pass:true,checks:checks.length}));
