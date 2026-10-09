// Author: Andrew Fisher. GET-only operational surfaces; source and recorded data are not altered.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),Module=require('module');
const hp=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),m=new Module(hp,module);m.filename=hp;m.paths=Module._nodeModulePaths(path.dirname(hp));let hs=fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;');m._compile(hs,hp);
(async()=>{const h=await m.exports.open({pageFile:process.env.PAGE,mobile:true,W:390,H:844,hash:'#today'}),p=h.page;try{
await p.waitForFunction(()=>SYNC.status==='live',null,{timeout:150000});const rows=[];
for(const tab of ['today','plant','subhired','timeline','about']){
rows.push(await p.evaluate(tab=>{const record=JSON.stringify(S);go(tab);const pane=document.querySelector('#pane-'+tab),folds=[...pane.querySelectorAll('[data-prose976]')];return{tab,folds:folds.length,paragraphsFolded:folds.reduce((n,f)=>n+f.querySelectorAll('p').length,0),allClosed:folds.every(f=>!f.open),controlsFolded:folds.reduce((n,f)=>n+f.querySelectorAll('input,select,textarea,button').length,0),figuresFolded:folds.reduce((n,f)=>n+f.querySelectorAll('.kpis,.money,.mtot,.r931-fact,.fact,.stats,.metric,.kpi,canvas,table').length,0),nativeUnchanged:record===JSON.stringify(S)};},tab));}
assert(rows.every(r=>r.controlsFolded===0&&r.figuresFolded===0&&r.nativeUnchanged));assert(rows.some(r=>r.folds>0));
await p.evaluate(()=>go('subhired'));await p.locator('[data-supplier932-company]').last().click();await p.waitForTimeout(100);assert.equal(await p.locator('#pane-subhired .supplier932-head [data-prose976]').count(),1);if(process.env.OUT)await p.screenshot({path:process.env.OUT,timeout:120000});
console.log(JSON.stringify({author:'Andrew Fisher',rows,pageErrors:h.errors,nativeWrites:0}));assert.equal(h.errors.length,0);
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
