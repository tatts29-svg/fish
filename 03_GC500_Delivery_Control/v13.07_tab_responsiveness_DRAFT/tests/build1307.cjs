// Author: Andrew Fisher. Exercise the patched source; no network or operational writes.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const page = fs.readFileSync(process.env.PAGE || process.argv[2], 'utf8');
const base = fs.readFileSync(process.env.BASE || process.argv[3], 'utf8');
let checks = 0;
const check = (ok, name) => { assert(ok, name); checks++; };
const between = (text, a, b) => {
  const start = text.indexOf(a), end = text.indexOf(b, start + a.length);
  assert(start >= 0 && end > start, 'Source boundaries exist: ' + a);
  return text.slice(start, end);
};
const script = id => between(page, '<script id="' + id + '">', '</script>').replace(/^<script[^>]*>/, '');
const modelSource = text => between(text, 'function model(day,today,read){', "if(typeof document==='undefined'){root.PastDay984");
const initialSource = between(page, 'function initialProgress1307(', 'function html(day,ci,sel,today){');
const readerSource = between(page, 'p=model(day,today,iso=>progress.get(iso)', '),w=weather(day.iso)').replace('p=model(day,today,', '');
const progressSource = script('progress986-script');
const dates = Array.from({length:46}, (_, n) => new Date(Date.UTC(2026, 8, 7 + n)).toISOString().slice(0, 10));

check(modelSource(page) === modelSource(base), 'Historical cutoff, percentages and labels use the unchanged native model');
check(between(page, 'function progress881Model(', '/* Author: Andrew Fisher. v8.85') === between(base, 'function progress881Model(', '/* Author: Andrew Fisher. v8.85'), 'Seven-category native progress calculation is byte-identical');
check(between(progressSource, 'function create(deps){', "if(typeof document==='undefined')") === between(between(base, '<script id="progress986-script">', '</script>'), 'function create(deps){', "if(typeof document==='undefined')"), 'Visibility queue, revision guards and cancellation remain byte-identical');

// Run the existing 17 lifecycle assertions against the candidate's actual loader.
const reports = [], queueContext = vm.createContext({require, console:{log: value => reports.push(JSON.parse(value))}});
vm.runInContext(progressSource, queueContext);
const priorTest = fs.readFileSync(path.join(__dirname, '../../v9.86_build_card_history_LIVE/tests/progress986.cjs'), 'utf8').replace("require('../progress986.js');", '');
vm.runInContext(priorTest, queueContext);
check(reports.length === 1 && reports[0].pass && reports[0].checks === 17, 'All 17 established visibility/hydration/navigation lifecycle assertions pass on candidate source');

function readingContext(selected, cache = new Map()) {
  const reads = [];
  const c = vm.createContext({LAST_BUILD_DAY1261:{day:'2026-10-22',cutoff:'2026-10-23'},
    ProgressPercent1012:{display:n=>n,text:n=>String(n)},progress:cache,sel:selected,
    todayWorkHealth840:()=>({ready:true}),jobAtDate:iso=>{reads.push(iso);const value={ready:true,pct:{min:100,max:100},allGreen:true,provisional:false};cache.set(iso,value);return value;}});
  vm.runInContext(modelSource(page) + initialSource, c);
  const values = dates.map(iso => {
    c.day={iso};
    return vm.runInContext('model(day,"2026-11-15",' + readerSource + ')', c);
  });
  return {reads,values};
}
{
  const f=readingContext('2026-10-09');
  check(f.reads.join() === '2026-10-09,2026-10-23', 'Cold 46-card render calculates only selected date and last-day cutoff');
  check(f.values.filter(v=>v.pending).length === 44, 'Other 44 historical readings remain with the existing deferred loader');
  check(f.values.at(-1).cutoff && f.values.at(-1).percent === 100, 'Last Build day retains the native race-weekend 100 percent reading');
  const last=readingContext('2026-10-22');
  check(last.reads.join() === '2026-10-23', 'Selecting the last card reads its cutoff only once');
  const cache=new Map(dates.map(iso=>[iso,{ready:true,pct:{min:37,max:39},provisional:true}]));
  cache.set('2026-10-23',{ready:true,pct:{min:100,max:100},allGreen:true});
  const warm=readingContext('2026-10-09',cache);
  check(warm.reads.length === 0 && warm.values.every(v=>v.percent!==null), 'Warm cached readings are retained without new historical replay');
}

function printFixture(options={}) {
  let active=options.active!==false,ready=options.ready!==false,serial=0,begins=0;
  const events=new Map(),tasks=new Map(),reads=[];
  const card=(day,selected=false)=>{
    const reading={classList:{toggle(){}},textContent:'Loading…',append(node){this.textContent+=node.textContent;}},rail={querySelector:()=>({style:{}}),remove(){}},area={querySelector:()=>rail};
    let aria='Closed day record. Whole-build progress loading. Weather: Cloudy';
    return {dataset:{day,buildProgress:'pending',bc984Visible:'false'},isConnected:true,classList:{contains:key=>key==='on'&&selected},
      querySelector:s=>s==='.bc984-percentage'?reading:area,getAttribute:()=>aria,setAttribute:(_,value)=>{aria=value;},reading,aria:()=>aria};
  };
  const cards=dates.map(iso=>card(iso,iso==='2026-10-09'));
  cards.push(card('2026-11-15'),card('2026-11-16'));
  const pane={isConnected:true,hidden:false,classList:{contains:()=>active},querySelectorAll:()=>cards.filter(c=>c.dataset.buildProgress==='pending')};
  const context=vm.createContext({state:{tab:active?'timeline':'today'},S:{},DOCS:{state:'ready',at:1},
    LAST_BUILD_DAY1261:{day:'2026-10-22',cutoff:'2026-10-23'},ProgressPercent1012:{display:n=>n,text:n=>String(n)},
    document:{hidden:!!options.hidden,body:{classList:{contains:name=>name===options.printMode}},getElementById:()=>pane,querySelectorAll:()=>cards,addEventListener(){},createElement:()=>({textContent:''})},
    window:{addEventListener:(name,fn)=>events.set(name,fn)},todayIso:()=> '2026-11-15',todayWorkHealth840:()=>({ready}),
    requestIdleCallback:fn=>{tasks.set(++serial,fn);return serial;},cancelIdleCallback:id=>tasks.delete(id),
    BuildCards984:{begin(){begins++;},progressForDate:iso=>{reads.push(iso);return ready?{ready:true,pct:{min:iso==='2026-10-23'?100:42,max:100},allGreen:iso==='2026-10-23'}:null;}}});
  vm.runInContext(modelSource(page)+'globalThis.PastDay984={model};',context);
  // Browser root and global window are the same object.
  context.window=context;
  context.addEventListener=(name,fn)=>events.set(name,fn);
  vm.runInContext(progressSource,context);
  return {cards,tasks,reads,events,context,pane,begins:()=>begins,setActive:v=>{active=v;context.state.tab=v?'timeline':'today';},setReady:v=>{ready=v;}};
}
{
  const f=printFixture();
  check(f.tasks.size === 1, 'Native selected-card work is queued before print');
  f.events.get('beforeprint')();
  check(f.tasks.size === 0 && f.context.BuildProgress986.report().stopped, 'Print cancels queued background history work');
  check(f.reads.length === 46 && f.reads.at(-1) === '2026-10-23', 'Print resolves all 46 historical cards with the native last-day cutoff');
  check(f.cards.slice(0,45).every(c=>c.reading.textContent==='≥42%') && f.cards[45].reading.textContent==='100%', 'Print painter preserves bounds and the last card percentage');
  check(f.cards[45].aria().includes('race-weekend cut-off') && !f.cards[45].aria().includes('loading'), 'Printed last card has the native accessible cutoff explanation');
  check(f.cards.slice(46).every(c=>c.dataset.buildProgress==='pending'), 'Print does not calculate today or future history');
  f.events.get('afterprint')();
  check(!f.context.BuildProgress986.report().stopped, 'After printing the native visibility loader resumes');
  f.events.get('beforeprint')();
  check(f.reads.length===46, 'Repeated printing does not replay already painted dates');
}
{
  const f=printFixture({active:false});f.events.get('beforeprint')();
  check(f.reads.length===0&&f.begins()===0, 'Printing another tab does no Build work');
  const daySheet=printFixture({printMode:'printing-day'});daySheet.events.get('beforeprint')();
  check(daySheet.reads.length===0&&daySheet.begins()===0, 'Printing a supplier/day sheet from Build does not replay hidden Build history');
  const imageSheet=printFixture({printMode:'printing-sheet'});imageSheet.events.get('beforeprint')();
  check(imageSheet.reads.length===0&&imageSheet.begins()===0, 'Printing a drawing sheet from Build does not replay hidden Build history');
  const hidden=printFixture({hidden:true});hidden.events.get('beforeprint')();
  check(hidden.reads.length===46, 'An active Build print does not depend on document visibility');
  const waiting=printFixture({ready:false});waiting.events.get('beforeprint')();
  check(waiting.cards.slice(0,46).every(c=>c.reading.textContent==='Not recorded'&&c.dataset.buildProgress==='unavailable'), 'Unavailable native history never prints Loading or invented percentages');
  const detached=printFixture();detached.cards[0].isConnected=false;detached.events.get('beforeprint')();
  check(detached.reads.length===45&&detached.cards[0].reading.textContent==='Loading…', 'Detached cards cannot receive printed results');
}
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks,existingLoaderChecks:reports[0].checks}));
