/* Author: Andrew Fisher. Lap recurrence, resets, geometry and scope preservation. */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const page=fs.readFileSync(process.env.PAGE,'utf8'),base=fs.readFileSync(process.env.BASE,'utf8'),checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);}
const G={step(){},camStep(){},S:null},ctx=vm.createContext({window:{GC3D:G},Float32Array,Uint32Array});
vm.runInContext('const G=window.GC3D;'+page.slice(page.indexOf('G.PLANT={forklift:'),page.indexOf('G.syncRaceCarQuality=function(S){')),ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../incident1195_src.js'),'utf8'),ctx);const api=ctx.window.ShowcaseIncident1195;
const S=G.S={sim:{s:25},gridS:25,CL:{L:100},gl:{}};api.update(S);
for(const lap of [0,1,2,3,4]){S.sim.s=25+lap*100;api.update(S);check('no scene on completed lap '+lap,!api.state().active);}
for(const lap of [5,10,15]){S.sim.s=25+lap*100;api.update(S);check('scene begins on completed lap '+lap,api.state().active&&api.state().lap===lap);
 const count=api.state().triggers;for(let i=0;i<100;i++)api.update(S);check('one trigger per lap '+lap,api.state().triggers===count);
 S.sim.s+=99.999;api.update(S);check('scene stays for following pass '+lap,api.state().active);
 S.sim.s+=.0011;api.update(S);check('scene clears at next completed lap '+lap,!api.state().active);}
S.sim={s:25};api.update(S);check('restart clears scene and trigger counter',!api.state().active&&api.state().triggers===0);
S.sim.s=25+500;api.update(S);S.sim.s=25;api.update(S);check('rewind clears scene',!api.state().active);
S.sim.s=25+2000;api.update(S);check('seek across milestones creates one scene only',api.state().active&&api.state().lap===20&&api.state().triggers===2);
S.sim.s=25+2500;S.calmDrive=true;api.update(S);check('calm drive suppresses scene',!api.state().active);
const model=api.model();check('static empty branded model is cached',model===api.model()&&model.stats.logoCopies===2&&model.stats.occupants===0);
check('bounded static geometry',model.stats.triangles<25000&&model.parts.length<20,model.stats);
check('geometry indices and values valid',model.parts.every(p=>Array.from(p.vertices).every(Number.isFinite)&&Array.from(p.indices).every(i=>i>=0&&i<p.vertices.length/8)));
check('whole car has tyres on the road',model.bounds.min[1]>-.01&&model.bounds.min[1]<.01&&model.bounds.max[1]<.65,model.bounds);
const scripts=h=>Array.from(h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]),a=scripts(base),b=scripts(page);
check('one scene module added',b.length===a.length+1&&b.at(-1).includes('ShowcaseIncident1195'));
const edited=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])edited.push(i);
check('only renderer hook and release footer change in retained scripts',edited.length<=2&&edited.every(i=>a[i].replace(' if(G.drawRaceCar)G.drawRaceCar(S,VP,fog);','if(G.drawRaceCar)G.drawRaceCar(S,VP,fog);\n if(G.drawIncident1195)G.drawIncident1195(S,VP,fog);').replace("+' · v11.92'; /* v8.19 release922","+' · v11.95'; /* v8.19 release922")===b[i]));
check('shared embedded record identical',base.match(/const DATA = (.*);/)[1]===page.match(/const DATA = (.*);/)[1]);
for(const marker of ['ShowcaseTruck1192','ShowcaseGPU1175','ShowcaseStable1175']){const i=a.findIndex(x=>x.includes(marker));check(marker+' exact preservation',i>=0&&a[i]===b[i]);}
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(checks,null,2));console.log(checks.length+'/'+checks.length);
