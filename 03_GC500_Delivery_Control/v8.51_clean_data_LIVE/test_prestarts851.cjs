// Author: Andrew Fisher. Synthetic unchanged upload controls and folded guidance.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {BASE,PAGE}=process.env;if(!BASE||!PAGE)throw Error('Set BASE and PAGE');
const extract=file=>{const s=fs.readFileSync(file,'utf8'),a=s.indexOf('function renderPrestarts_held(){'),b=s.indexOf('async function prestartUpload(',a);return s.slice(a,b);};
const versions=[extract(BASE),extract(PAGE)],copy=x=>JSON.parse(JSON.stringify(x));
function draw(code,hosted,readonly,opened=false){const pane={innerHTML:'',querySelectorAll:()=>[]},state={backend:hosted?{fileUrl:()=>''}:null,readonly},input=copy(state),c={SYNC:state,S:{operator:'Synthetic operator'},PRESTART_CREWS:[{key:'alpha',label:'First crew',what:'Daily records'},{key:'beta',label:'Second crew',what:'Daily records'}],todayIso:()=> '2026-10-05',prestartsFor:()=>[{id:'example'}],prestartRow:()=>'<li>Existing record</li>',prestartMasterFor:()=>null,prestartSwmsFor:()=>null,paneHeadingHtml:()=>'<h2>Pre-starts</h2>',esc:String,fmtNum:String,ps7ListHtml:()=>'',ps7Print:()=>{},prestartUpload:()=>{},bindFenceComponents849:()=>{},captureFenceComponents849:()=>null,restoreFenceComponents849:()=>{},$:()=>pane,FENCE_COMPONENTS_VIEW849:{folds:new Map(opened?[['prestarts:filing-notes',true]]:[])},fenceComponentsEscape849:String};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'clean_notes851_ui.js'),'utf8'),c);vm.runInContext(code+'\nrenderPrestarts_held();',c);assert.deepEqual(copy(state),input);return pane.innerHTML;}
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS '+name);};
for(const [label,hosted,readonly]of [['edit',true,false],['view',true,true],['offline',false,true]]){
 const [a,b]=versions.map(v=>draw(v,hosted,readonly));
 check(label+' original records, masters and upload controls preserved',()=>{const tags=s=>s.match(/<(?:input|button|li)\b[^>]*>[^<]*/g)||[];assert.deepEqual(tags(a),tags(b));assert.equal((b.match(/Existing record/g)||[]).length,2);});
 check(label+' instructions remain once inside a closed disclosure',()=>{assert.equal((b.match(/data-fc849-fold="filing-notes"/g)||[]).length,1);assert.ok(/data-fc851-notes><summary/.test(b));assert.equal((b.match(/The daily pre-start, one a day, for each crew\./g)||[]).length,1);});
 check(label+' capability notice accurately appears at most once',()=>{assert.equal((b.match(/data-clean851-read-notice/g)||[]).length,label==='edit'?0:1);if(label==='view')assert.ok(b.includes('Open the edit link to upload a pre-start.'));if(label==='offline')assert.ok(b.includes('This copy has no service behind it'));});
}
check('Existing disclosure cache restores filing instructions open',()=>assert.ok(/data-fc851-notes open><summary/.test(draw(versions[1],true,true,true))));
console.log(count+' synthetic pre-start checks passed');
