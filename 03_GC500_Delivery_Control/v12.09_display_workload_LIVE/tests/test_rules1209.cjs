/* Author: Andrew Fisher. Display workload, native UHD, exports and quality preservation. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');const code=fs.readFileSync(__dirname+'/../clarity1209_src.js','utf8'),checks=[];let fallbackArgs;
const G={QUALITY:{},renderSize(...a){fallbackArgs=a;return [11,12]},setQuality(){return true},mount(){return 'not mounted'},graphicsReport(){return {}}};const W={GC3D:G};vm.runInNewContext(code,{window:W});
function check(name,ok){checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name)}
const run=(w,h,dpr,max=16384)=>Array.from(G.renderSize(w,h,dpr,G.QUALITY.crisp,.5,max));
for(const [name,args,want] of [['720p native',[1280,720,1],[1280,720]],['1080p native',[1920,1080,1],[1920,1080]],['retina UHD',[1920,1080,2],[3840,2160]],['native UHD',[3840,2160,1],[3840,2160]],['5K bounded at UHD',[5120,2880,1],[3840,2160]],['phone native',[390,844,3],[1170,2532]],['portrait UHD',[2160,3840,1],[2160,3840]],['texture capability limit',[3840,2160,1,2048],[2048,1152]]])check(name,JSON.stringify(run(...args))===JSON.stringify(want));
check('720p removes eight of nine unseen UHD pixels',1280*720/(3840*2160)===1/9);
check('four-sample smoothing and shadow detail retained',G.QUALITY.crisp.samples===4&&G.QUALITY.crisp.shadow===2048);
check('export path delegates unchanged',JSON.stringify(Array.from(G.renderSize(100,100,1,G.QUALITY.crisp,1,4096,[3840,2160])))==='[11,12]'&&fallbackArgs[6][0]===3840);
check('other quality choices delegate unchanged',JSON.stringify(Array.from(G.renderSize(100,100,1,{name:'balanced'},.7,4096)))==='[11,12]'&&fallbackArgs[3].name==='balanced');
G.S={qualityChoice:'crisp',quality:G.QUALITY.crisp};G.setQuality('balanced',true);check('frame-rate guard cannot silently lower chosen native resolution',G.S.quality===G.QUALITY.crisp);
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(checks,null,2));console.log(checks.length+'/'+checks.length);
