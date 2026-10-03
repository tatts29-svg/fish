// Author: Andrew Fisher. Exact-source route checks and narrow patch preservation.
const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm'),crypto=require('crypto'),cp=require('child_process');
const base=fs.readFileSync(process.env.BASE,'utf8'),page=fs.readFileSync(process.env.PAGE,'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const checks=[];function check(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);}
const start=page.indexOf('/* v8.10 - invalid addresses'),end=page.indexOf('function onPop(){');
const baseStart=base.indexOf('function route(){'),baseEnd=base.indexOf('function onPop(){');
check('Every byte outside address guard and route preserved',page.slice(0,start)===base.slice(0,baseStart)&&page.slice(end)===base.slice(baseEnd));
const knownStart="if (state.tab === 'today' || !$('.pane.on'))";
const body=s=>{const a=s.indexOf(knownStart);return s.slice(a,s.indexOf('openAsset(key);',a)+'openAsset(key);'.length);};
check('Valid asset route body byte-identical',body(base).length>200&&body(base)===body(page));
const validDay="state.day = m[1]; state.tlView = 'day'; go('timeline');";
check('Valid day route body byte-identical',base.includes(validDay)&&page.includes(validDay));
check('Known-reference drawing and business data source preserved',page.slice(0,start)===base.slice(0,baseStart));
const source=page.slice(start,end);
function context(hash,day='2026-10-07'){
 const originalRecord=Object.freeze({source:'immutable sentinel'}),state={tab:'timeline',day,sel:'P55',unit:'old',found:{key:'P55'},fview:{},record:originalRecord};
 let open=true;const drawer={classList:{contains:()=>open}};
 const c={Date,Number,state,location:{hash},history:{state:{gc:4},replaceState(s,_,h){this.state=s;c.location.hash=h;}},routing:false,NAV:{pop:true,scroll:{}},DATA:{sheets:[]},TABS:[['today'],['timeline'],['plant']],
  $:s=>s==='#drawer'?drawer:{},allAssets:()=>[{key:'P55'}],mapSheetFor:()=>null,renderMap:()=>{},
  openAsset:k=>{state.sel=k;open=true;},go:t=>{state.tab=t==='register'?'plant':t;},flash:m=>{c.message=m;},calendarDays:()=>[{iso:'2026-10-07'},{iso:'2026-10-09',empty:true},{iso:'2024-02-29',empty:true}],
  setHash:h=>{c.location.hash='#'+h;},navScrollKey:()=>'',navScrollTo:()=>{},navBackShow:()=>{c.backShown=true;}};
 state.drawerClose=()=>{open=false;state.drawerClose=null;};
 vm.createContext(c);vm.runInContext(source,c);return {c,state,originalRecord,isOpen:()=>open,run:()=>vm.runInContext('route()',c)};
}
const ctx=context('#today').c;
for(const [day,expected]of [['2024-02-29',true],['2000-02-29',true],['2400-02-29',true],['2026-10-09',true],['2026-02-29',false],['2026-02-31',false],['1900-02-29',false],['2100-02-29',false],['2026-04-31',false],['2026-00-01',false],['2026-13-01',false],['2026-10-00',false],['2026-2-03',false],['2026-10-09T00:00:00Z',false],['2026-10-09 ',false],['',false],[null,false]]){
 ctx.value810=day;check('ISO calendar validation '+JSON.stringify(day),vm.runInContext('routeDayValid810(value810)',ctx)===expected);
}
for(const [hash,tab,msg]of [['#asset/MISSING','plant','not a reference'],['#asset/','plant','does not name'],['#asset/P55%0A','plant','not a reference'],['#day/2026-10-07%0A','today','invalid date'],['#asset/%E0%A4%A','today','invalid escape'],['#day/2026-02-31','today','invalid date'],['#day/2026-10-07/extra','today','invalid date'],['#day/2030-01-01','today','outside this programme'],['#day/%E0%A4%A','today','invalid escape']]){
 const x=context(hash);x.run();
 check('Rejected route closes stale drawer, clears selection, completes history: '+hash,!x.isOpen()&&x.state.sel===null&&x.state.found===null&&x.state.tab===tab&&x.c.location.hash==='#'+tab&&x.c.message.includes(msg)&&x.c.NAV.cur==='#'+tab&&!x.c.NAV.pop&&x.c.backShown&&x.c.history.state.gc===4&&x.state.record===x.originalRecord);
 if(hash.startsWith('#day/'))check('Rejected day leaves no phantom state.day: '+hash,x.state.day===null);
}
for(const day of ['2026-10-07','2026-10-09','2024-02-29']){
 const x=context('#day/'+day);x.run();check('Native route preserves available valid day '+day,x.state.tab==='timeline'&&x.state.day===day&&x.c.location.hash==='#day/'+day&&!x.c.message&&!x.isOpen());
}
{const x=context('#asset/P55');x.run();check('Native known-reference route still opens exact reference',x.isOpen()&&x.state.sel==='P55'&&x.state.tab==='timeline'&&!x.c.message&&x.c.location.hash==='#asset/P55');}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-810-'));
try{
 const patch=path.resolve(__dirname,'../patch_v810.py'),f=path.join(tmp,'page.html');
 for(const [label,input]of [['second application',page],['missing required805',base.replaceAll('v8.05 - links','v8.XX - links')],['unexpected route source',base.replace("openAsset(key);\n } else if ((m = h.match", "openAsset(key); /* unexpected */\n } else if ((m = h.match")]]){
  fs.writeFileSync(f,input);const r=cp.spawnSync('python3',[patch,f],{encoding:'utf8'});check('Patch refuses '+label+' without altering input',r.status!==0&&fs.readFileSync(f,'utf8')===input,{exit:r.status});
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
const result={author:'Andrew Fisher',baseSha256:sha(base),candidateSha256:sha(page),checks,passed:checks.filter(c=>c.pass).length,total:checks.length,networkCalls:0,operationalWrites:0};
fs.writeFileSync(process.env.OUT||path.join(__dirname,'native_results.json'),JSON.stringify(result,null,2)+'\n');
if(result.passed!==result.total)process.exitCode=1;
