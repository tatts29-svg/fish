// Author: Andrew Fisher. Pure load/location checks and GET-only practice against the native page.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),Module=require('module');
const api=require('../drops908.js');
const checks=[];
function check(name,fn){try{const result=fn();if(result===false)throw Error('false');checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
const day={iso:'2026-10-08'},row=key=>({a:{key}}),group=(keys,extra={})=>({kind:'deliveries',rows:keys.map(row),...extra});
const idOf=(d,g)=>d.iso+'|'+g.kind+'|'+(g.truck_id?'booking:'+g.truck_id:g.rows[0].a.key);
const build=(loads,visible,states={})=>api.project({day,loads,visible:visible||loads.map((g,i)=>({g,n:i+1})),idOf,stateOf:a=>({stage:states[a.key]||0}),locationOf:a=>a.key==='UNPLACED'?{point:null,reason:'Unconfirmed'}:{point:a.key==='B'?[.5,.5]:[.3,.4],source:'Test point'}});
check('search keeps canonical first-reference identity and original load number',()=>{const m=build([group(['A','B']),group(['C'])],[{n:1,g:group(['B'])}]);assert.equal(m.loads[0].id,'2026-10-08|deliveries|A');assert.equal(m.loads[0].renderedId,'2026-10-08|deliveries|B');assert.equal(m.loads[0].n,1);assert.deepEqual(m.loads[0].allRefs,['A','B']);});
check('shared truck gets same number at both reference locations',()=>{const m=build([group(['A','B'])]);assert.deepEqual(m.points.map(p=>p.numbers),[[1],[1]]);});
check('coincident booked loads remain separate IDs at unchanged coordinates',()=>{const m=build([group(['WC09'],{truck_id:'one'}),group(['WC09'],{truck_id:'two'})]);assert.equal(m.points.length,1);assert.deepEqual(m.points[0].numbers,[1,2]);assert.deepEqual(m.points[0].point,[.3,.4]);assert.equal(new Set(m.points[0].members.map(x=>x.id)).size,2);});
check('unplaced and Due out gaps never renumber visible Due in',()=>{const m=build([group(['A']),group(['OUT'],{kind:'removals'}),group(['UNPLACED'])],[{n:3,g:group(['UNPLACED'])}]);assert.equal(m.unplaced[0].n,3);assert.equal(m.points.length,0);});
check('partial and on-site completion never ticks a whole load',()=>{const m=build([group(['A','B'])],null,{A:5,B:2});assert.equal(m.loads[0].complete,false);assert.equal(m.loads[0].refs[0].complete,true);assert(m.points.every(p=>!p.complete));});
check('filtered completed reference does not hide incomplete remainder',()=>{const m=build([group(['A','B'])],[{n:1,g:group(['A'])}],{A:5,B:4});assert.equal(m.loads[0].complete,false);});
check('only every reference at stage five ticks the load',()=>assert.equal(build([group(['A','B'])],null,{A:5,B:5}).loads[0].complete,true));
check('native reordered input determines numbers without sorting again',()=>assert.deepEqual(build([group(['C']),group(['A','B'])]).loads.map(l=>[l.n,l.allRefs]),[[1,['C']],[2,['A','B']]]));
const sheet={key:'D001'},env={master:{CP1:{pt:[.90642,.76348],prec:'unit'}},destination:()=>({kind:'master',ll:{lat:-28,lon:153}}),moved:()=>null,sheet,frame:()=>({ax:.2,ay:.3}),toSheet:(s,x,y)=>{assert.equal(s,sheet);return {fx:x+.1,fy:y+.1};}};
check('master inset uses exact paper coordinates, never ground projection',()=>assert.deepEqual(api.location({key:'CP1'},{...env,toSheet:()=>{throw Error('Must not project inset');}}).point,[.90642,.76348]));
check('genuine GPS uses calibrated D001 transform',()=>assert.deepEqual(api.location({key:'GPS'},{...env,destination:()=>({kind:'pinned',ll:{lat:-28,lon:153},sms:'Pinned ±5 m'})}).point,[.30000000000000004,.4]));
check('report fallback is never plotted as the delivery',()=>assert.equal(api.location({key:'CP1'},{...env,destination:()=>({kind:'report',ll:{lat:-28,lon:153}})}).point,null));
check('unverified and area-only master locations remain unplaced',()=>{for(const m of [{pt:[.1,.2],prec:'unit',unverified:true},{pt:[.1,.2],prec:'area'}])assert.equal(api.location({key:'CP1'},{...env,master:{CP1:m}}).point,null);});
check('new recorded GPS is not hidden by historic unverified master metadata',()=>assert(api.location({key:'CP1'},{...env,master:{CP1:{unverified:true,prec:'unit'}},destination:()=>({kind:'pinned',ll:{lat:-28,lon:153}})}).point));
check('nearby hit targets share a chooser without changing their points',()=>{const p=[{point:[.1,.2]},{point:[.104,.2]},{point:[.8,.8]}],before=JSON.stringify(p);assert.deepEqual(api.clusters(p,600,420),[[0,1],[2]]);assert.deepEqual(api.clusters(p,3600,2520),[[0,1],[2]]);assert.equal(JSON.stringify(p),before);});
check('moved reference does not fall back to its old master unit',()=>assert.equal(api.location({key:'CP1'},{...env,moved:()=>({to:'new'})}).point,null));
check('unconfirmed manually placed or approximate positions remain unplaced',()=>{for(const d of [{kind:'placed',approx:true},{kind:'desc',approx:true},{kind:'area'}])assert.equal(api.location({key:'GPS'},{...env,destination:()=>({...d,ll:{lat:-28,lon:153}})}).point,null);});
check('off-image, non-finite and missing positions are rejected',()=>{for(const p of [[1.01,.3],[NaN,.3],null])assert(!api.validPoint(p));assert.equal(api.location({key:'GPS'},{...env,destination:()=>({kind:'pinned',ll:{lat:-28,lon:153}}),toSheet:()=>({fx:1.2,fy:.2})}).point,null);});
async function browserChecks(){
 if(!process.env.PAGE)return;
 const out=process.env.EVIDENCE_DIR;if(!out||!path.isAbsolute(out))throw Error('Use absolute private EVIDENCE_DIR');fs.mkdirSync(out,{recursive:true});
 // Reuse the shared harness, with its sole non-GET Google-session exception disabled for this test.
 const harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),strict=new Module(harness,module);strict.filename=harness;strict.paths=Module._nodeModulePaths(path.dirname(harness));
 strict._compile(fs.readFileSync(harness,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;'),harness);
 const s=await strict.exports.open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1100});const p=s.page;
 try{
  await p.waitForFunction(()=>typeof Drops908!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.evaluate(()=>{state.day='2026-10-08';state.tlView='day';state.q='';go('timeline');render();});
  await p.waitForFunction(()=>{const i=document.querySelector('.drops908 img');return i&&i.complete&&i.naturalWidth>0;});
  const native=await p.evaluate(()=>{const m=Drops908.report().model,d=calendarDays().find(x=>x.iso===m.day),L=dpLoads(d);return {model:m,zoom:Drops908.report().zoom,matching:m.loads.every(l=>ldId(d,L[l.n-1])===l.id),records:JSON.stringify(S),dims:[...document.querySelectorAll('.drops908 img')].map(i=>[i.naturalWidth,i.naturalHeight])};});
  check('live map IDs and numbers match full native dpLoads',()=>native.matching);
  check('existing master-plan image decodes at its recorded dimensions',()=>assert.deepEqual(native.dims,[[2600,1837]]));
  check('first visible map fits tight confirmed drops with useful context',()=>native.zoom>=2.5&&native.zoom<=3);
  const geometry=[];
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:width===390?844:1100});await p.waitForTimeout(200);
   await p.locator('.drops908').scrollIntoViewIfNeeded();
   const g=await p.locator('.drops908').evaluate(e=>{const r=e.getBoundingClientRect(),v=e.querySelector('.drops908-viewport'),b=[...e.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width);return {width:innerWidth,x:r.x,right:r.right,h:r.height,overflow:document.documentElement.scrollWidth>innerWidth+1,viewport:{w:v.clientWidth,h:v.clientHeight},buttons:b.map(b=>({text:b.textContent,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),labels:[...e.querySelectorAll('.drops908-pin')].map(b=>b.getAttribute('aria-label'))};});geometry.push(g);
   check(width+'px: map stays within page without horizontal overflow',()=>!g.overflow&&g.x>=0&&g.right<=width+1);
   check(width+'px: map targets remain at least 44px',()=>g.buttons.every(b=>b.w>=43.9&&b.h>=43.9));
   await p.locator('.drops908').screenshot({path:path.join(out,'delivery-map-'+width+'.png')});
  }
  const interaction=await p.evaluate(()=>{
   const before=JSON.stringify(S),r=()=>Drops908.report(),el=()=>document.querySelector('.drops908');
   const point=r().model.points[0],pin=()=>el().querySelector('[data-drop908-point="0"]');pin().click();
   const chooser=!!el().querySelector('.drops908-choice');if(chooser)el().querySelector('[data-drop908-select]').click();
   const id=r().selected,load=r().model.loads.find(l=>l.id===id),card=()=>[...document.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl')].find(b=>+b.querySelector('.ld-n b').textContent===load.n);
   const open=card().getAttribute('aria-expanded')==='true';
   const same=()=>{const point=r().model.points.findIndex(p=>p.members.some(m=>m.id===id));el().querySelector('[data-drop908-point="'+point+'"]').click();const c=el().querySelector('[data-drop908-select]');if(c)c.click();};same();
   const stillOpen=card().getAttribute('aria-expanded')==='true';
   el().querySelector('[data-drop908-zoom="in"]').click();const zoom=r().zoom;render();const preserved=r().selected===id&&r().zoom===zoom;
   const sc=document.querySelector('main');sc.scrollTop=10;const top=sc.scrollTop;render();const scrollStable=sc.scrollTop===top;
   const next=r().model.loads.find(l=>l.id!==id);let reverse=true;if(next){const b=[...document.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl')].find(x=>+x.querySelector('.ld-n b').textContent===next.n);b.click();reverse=r().selected===next.id;}
   el().querySelector('[data-drop908-zoom="reset"]').click();const reset=r().zoom===1;
   el().querySelector('[data-drop908-close]').click();render();const closeStable=r().selected===null&&!el().querySelector('.drops908-detail');
   return {chooser,open,stillOpen,preserved,scrollStable,reverse,reset,closeStable,unchanged:before===JSON.stringify(S),id,loadNumber:load.n};
  });
  check('coincident loads offer a choice',()=>interaction.chooser);
  check('selecting a pin opens its native load idempotently',()=>interaction.open&&interaction.stillOpen);
  check('selection and zoom survive native sync redraw',()=>interaction.preserved);
  check('redraw does not scroll the page',()=>interaction.scrollStable);
  check('native card selection selects the matching map load',()=>interaction.reverse);
  check('reset returns to full plan',()=>interaction.reset);
  check('Close remains closed after native sync redraw',()=>interaction.closeStable);
  check('all map interactions leave operational records unchanged',()=>interaction.unchanged);
  const navigation=await p.evaluate(()=>{state.tlView='agenda';render();const noAgenda=!document.querySelector('#pane-timeline .drops908');state.tlView='day';state.day='2026-10-09';render();const noStale=Drops908.report().day!=='2026-10-08'||Drops908.report().model===null;return {noAgenda,noStale};});
  check('agenda and day navigation remove the old daily map',()=>navigation.noAgenda&&navigation.noStale);
  check('browser has no JavaScript errors',()=>s.errors.length===0);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,native,geometry,interaction,navigation,errors:s.errors,requests:s.counts},null,2));
 }finally{await s.browser.close();}
}
browserChecks().then(()=>{checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.error?' — '+c.error:'')));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
