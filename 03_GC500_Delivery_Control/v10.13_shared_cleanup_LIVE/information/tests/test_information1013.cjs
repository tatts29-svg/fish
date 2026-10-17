/* Author: Andrew Fisher. Exact-source display checks; no service access or record writes. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),crypto=require('crypto');
const before=fs.readFileSync(process.argv[2]||'/workspace/private-today-audit14Oct2026/live.html','utf8');
const after=fs.readFileSync(process.argv[3]||'/workspace/private-information1013.html','utf8');
let checks=0;const check=(name,fn)=>{fn();checks++;};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function section(source,start,end){let a=source.indexOf(start);assert(a>=0,start);let b=source.indexOf(end,a+start.length);assert(b>a,end);return source.slice(a,b);}
function fn(source,name){const start='function '+name+'(';return section(source,start,'\n}\n')+'\n}';}
const helper=fs.readFileSync(path.join(__dirname,'../information1013.js'),'utf8');
function context(source,partial=null){
 const dayOnly={state:'on site',at:'2026-10-12T14:00:00.000Z',date_only:true,effective_date:'2026-10-13',recorded_at:'2026-10-14T00:00:00.000Z',by:'Recorded operator'};
 const record={state:'not on site',recorded:true,set_at:'2026-10-03T02:30:00.000Z',where:'local',by:'Recorded operator',history:[],done:false};
 const box={console,Date,Intl,Information1013:null,MON:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],EVENT_TZ:'Australia/Brisbane',
  S:{delivery:{T0266:{...dayOnly,set_at:dayOnly.at,history:[dayOnly]}}},two:n=>String(n).padStart(2,'0'),
  fmtDate:iso=>iso.slice(8,10)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(iso.slice(5,7))-1]+' '+iso.slice(0,4),
  esc:s=>String(s),LW:()=> 'shared record',todayIso:()=> '2026-10-14',assetOf:key=>({key}),deliveryOf:()=>record,toiletPresentation962:()=>partial,
  LIGHT:{'not on site':{c:'red',word:'Red',label:'Not on site'},'on site':{c:'green',word:'Green',label:'On site'},'in transit':{c:'amber',word:'Amber',label:'In transit'}}};
 box.window=box;vm.createContext(box);vm.runInContext(helper,box);
 vm.runInContext(section(source,'const fmtStamp = ','/* The light as a chip.'),box);
 vm.runInContext(section(source,'const timeOfStamp = ','function arrivalsOn('),box);
 vm.runInContext(section(source,'const DSTATE = {','function deliveryView(')+fn(source,'deliveryView')+'\n'+fn(source,'lightChip'),box);
 return {box,record,dayOnly,run:s=>vm.runInContext(s,box)};
}
const partial={status:'6 of 7 received · 6 of 7 installed',detail:'FWF 6 of 6 installed · Accessible Toilet 0 of 1 received',arrived:6,done:6,quantity:7};
const old=context(before,partial),current=context(after,partial);
check('Original partial chip wrongly red',()=>assert.match(old.run("lightChip('WC51',{full:true})"),/tl red/));
check('Shared partial chip now amber',()=>assert.match(current.run("lightChip('WC51',{full:true})"),/tl amber/));
check('Partial chip includes received scope',()=>assert.match(current.run("lightChip('WC51',{full:true})"),/6 of 7 received/));
check('Partial title names outstanding type',()=>assert.match(current.run("lightChip('WC51')"),/Accessible Toilet 0 of 1/));
check('Partial explanation does not imply old red date is current receipt',()=>assert(!current.run("deliveryView('WC51').why").includes('03 Oct')));
check('Partial display leaves native red and whole completion unchanged',()=>assert.equal(current.record.state,'not on site'));
check('Partial drawer suppresses stale red lens',()=>assert(after.includes("red: !partial962&&d.recorded && d.state === 'not on site' ? 1 : 0}")));
check('Partial whole-reference controls use persistent More info',()=>assert(after.includes("moreInfo('drawer|whole-checks|'+key")));
current.box.typedScope={rows:[{item:'Accessible Toilet',quantity:1,arrived:0,done:0,complete:false},{item:'FWF',quantity:6,arrived:6,done:6,complete:true}]};
check('Visible partial summary uses concise typed quantities',()=>assert.equal(current.run('Information1013.partialWords(typedScope)'),'Accessible Toilet: 0/1 received · FWF: 6/6 complete'));
const n=context(after);
check('Normal not-onsite remains red',()=>assert.match(n.run("lightChip('P01',{full:true})"),/tl red/));
n.record.recorded=false;
check('Unknown stays unknown and unlit',()=>assert.match(n.run("lightChip('P01',{full:true})"),/tl none.*No delivery record/s));
n.record.recorded=true;n.record.state='on site';
check('Normal onsite stays green',()=>assert.match(n.run("lightChip('P01',{full:true})"),/tl green.*On site/s));
n.record.moved={to:'P02',by:'Recorder'};
check('Moved label is preserved',()=>assert.match(n.run("lightChip('P01',{full:true})"),/Moved to P02/));
for(const ctx of [current,old])ctx.box.evidence=ctx.dayOnly;
check('Original invented midnight reproduced',()=>assert.match(old.run('fmtStamp(evidence.at,evidence)'),/00:00/));
check('Date-only long display has date and no fake time',()=>assert.equal(current.run('fmtStamp(evidence.at,evidence)'),'13 Oct 2026 · time not recorded'));
check('Date-only time column says unknown',()=>assert.equal(current.run('timeOfStamp(evidence.at,evidence)'),'Time not recorded'));
check('Same instant without evidence retains real midnight',()=>assert.equal(current.run('timeOfStamp(evidence.at,{})'),'00:00'));
check('No context never guesses date-only',()=>assert.equal(current.run('timeOfStamp(evidence.at)'),'00:00'));
check('Different reference does not inherit another midnight',()=>assert.equal(current.run("timeOfStamp(evidence.at,{ref:'P01'})"),'00:00'));
check('Reference-linked journal finds its own date evidence',()=>assert.equal(current.run("timeOfStamp(evidence.at,{ref:'T0266'})"),'Time not recorded'));
check('History evidence supports delivery projection',()=>assert.equal(current.run('timeOfStamp(evidence.at,{d:{history:[evidence]}})'),'Time not recorded'));
check('Completion stamp stays separate',()=>assert.equal(current.run("timeOfStamp('2026-10-14T00:13:00.000Z',{history:[evidence]})"),'10:13'));
check('Wrong effective day does not hide observed time',()=>assert.equal(current.run("timeOfStamp(evidence.at,{...evidence,effective_date:'2026-10-14'})"),'00:00'));
check('Malformed date does not hide observed time',()=>assert.equal(current.run("Information1013.dateOnly(evidence.at,{...evidence,effective_date:'bad'})"),null));
check('Malformed instant returns unknown marker',()=>assert.equal(current.run("timeOfStamp('bad',evidence)"),'--:--'));
check('Brisbane day matches operational calendar',()=>assert.equal(current.run("Information1013.day('2026-10-12T14:00:00.000Z')"),'2026-10-13'));
check('Journal receipt metadata retained',()=>assert(after.includes('effectiveDate:Information1013.receiptDay(h.at,h)')));
check('Projected history retains metadata',()=>assert(after.includes('(d.history || []).map(h => ({...h,at: h.at,')));
check('Map receipt formatter gets contextual evidence',()=>assert(after.includes('who(d.by, d.set_at,d)')));
check('Static42day comparison removed',()=>assert(!after.includes("for the card's 42 days</div>")));
check('Source notes are explicitly historical and folded',()=>assert(after.includes("moreInfo('pricing|earlier-source-notes'")));
check('Current pricing gaps remain generated',()=>assert(after.includes("open.length+' rate-card item types need a decision.")));
check('Fencing confirmation says latest supplied date',()=>assert(after.includes('Last confirmation: 12 Oct 2026 · on track')));
check('Current figures are not described as universal truth',()=>assert(!after.includes('Here is everything red on this job, in that shape')));
check('Coates guidance folded using existing component',()=>assert(after.includes("moreInfo('coatesway|targets'")));
// Source invariants: view changes never alter source data, receipt/scope math or financial engines.
check('Embedded original DATA unchanged',()=>assert.equal(sha(before.match(/const DATA = ([^\n]+)/)[0]),sha(after.match(/const DATA = ([^\n]+)/)[0])));
for(const name of ['deliveryOf','deliveryAsOf','chargeLines','qtyOf','assetTotal','contractCharge','labourPlan','labourTicked','toiletRows962','toiletPresentation962','timeline841State','arrivalsOn','offsiteOn','ticksOn'])check(name+' unchanged',()=>assert.equal(fn(before,name),fn(after,name)));
const scripts=[...after.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/(?:application\/json|ld\+json)/i.test(m[1]));
for(const [i,s] of scripts.entries())check('Inline script '+i+' parses',()=>new vm.Script(s[2]));
const result={author:'Andrew Fisher',beforeSha256:sha(before),candidateSha256:sha(after),checks,passed:true,serviceAccess:false,nativeWrites:0};
const output=process.env.EVIDENCE;if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
