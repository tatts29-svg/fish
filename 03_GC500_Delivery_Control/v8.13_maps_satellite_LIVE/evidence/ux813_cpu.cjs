/* Author: Andrew Fisher. Execute production selection functions with a small DOM fixture; browser layout is separate. */
'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const [basePath,explorerPath,mergePath,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('Usage: node ux813_cpu.cjs before-explorer.js explorer.js explorer-merge.js report.json');
const base=fs.readFileSync(basePath,'utf8'),src=fs.readFileSync(explorerPath,'utf8'),merge=fs.readFileSync(mergePath,'utf8');
const helper=fs.readFileSync(require('path').join(__dirname,'..','ux813_src.js'),'utf8');
const checks=[];function check(id,fn){fn();checks.push({id,pass:true});}
function segment(t,start,end){const a=t.indexOf(start);assert(a>=0,start);const b=t.indexOf(end,a+start.length);assert(b>a,end);return t.slice(a,b);}
function line(t,start){return t.split('\n').find(s=>s.startsWith(start));}
function elem(id){const classes=new Set(),attrs={},events={};return {id,hidden:false,dataset:{},value:'',style:{},events,attrs,scrollTop:9,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v;}},setAttribute(k,v){attrs[k]=v;},getAttribute:k=>attrs[k],addEventListener(k,f){(events[k]??=[]).push(f);},focus(){ctx.focus=id;},querySelectorAll(){return [];},querySelector(sel){if(sel==='[data-closelegend813]')return el.close;return null;}};}
const el={};for(const id of ['stage','navBtn','legendBtn','legend','findList','results','about813','sourceProvider813','close','q'])el[id]=elem(id);
const handlers={},calls={open:0,stop:0,ring:0,paint:0,clear:0};let phone=true;
const ctx={console,Math,Number,String,Set,Map,Array,Object,JSON,document:{body:elem('body'),querySelectorAll:()=>[],activeElement:null},window:{parent:{gc500ExplorerPicked(){calls.open++;}},addEventListener(k,f,capture){(handlers[k]??=[]).push({f,capture});},GC500Explorer:{clearPick813(){calls.clear++;}}},$:id=>el[id]||null,stage:el.stage,matchMedia:()=>({matches:phone}),selected:null,marks:[],highlight:null,stopPulse(){calls.stop++;},startPulse(){calls.ring++;},requestPaint(){calls.paint++;},gotoRect(r,l){ctx.lastGoto={r,l};},toast(s){ctx.toastMessage=s;},norm:s=>String(s).toUpperCase(),esc:String,sw:390,sh:700,geoRect:r=>r,placeWord:it=>it.places.length?'placed':'unplaced',SOURCE:'google',P:null,BOOT:null,lastSearch:[],CATS_NOW:[],ITEMS:[],performance:{now:()=>1},clearTimeout(){}};
ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(helper,ctx);
vm.runInContext(segment(src,'function selectCode(', '/* v6.97 - the pulse'),ctx);
vm.runInContext(segment(src,'function showCategory(', '/* byUser:'),ctx);
vm.runInContext(line(src,'function chooseResult('),ctx);
vm.runInContext(segment(src,'function legendHtml()', '/* ---------------------------------------------------------------- find:'),ctx);
const toilets={id:'toilets',name:'Toilets',c:'#fff'},lights={id:'lights',name:'Lights',c:'#eee'};
const placed={code:'WC31',places:[[10,20,12,22]],cat:toilets,reg:{name:'Toilet'}};
const unplaced={code:'LTC99',places:[],cat:lights,reg:{name:'Tower'}};
ctx.ITEMS=[placed,unplaced];ctx.CATS_NOW=[toilets,lights];
check('placed user pick stays in map and closes phone Find',()=>{ctx.panel813(true);assert(ctx.selectCode('WC31',0,true));assert.equal(calls.open,0);assert.equal(ctx.selected,placed);assert(!ctx.document.body.classList.contains('nav'));assert.equal(ctx.focus,'stage');assert.equal(el.navBtn.attrs['aria-expanded'],'false');});
check('unplaced user pick retains phone Find and explains no location',()=>{ctx.panel813(true);ctx.selectCode('LTC99',0,true);assert(ctx.document.body.classList.contains('nav'));assert(ctx.toastMessage.includes('does not label it'));assert.equal(calls.open,0);});
check('invalid reference does not move or close panel',()=>{const before=ctx.lastGoto;assert.equal(ctx.selectCode('missing',0,true),false);assert.equal(ctx.lastGoto,before);assert(ctx.document.body.classList.contains('nav'));});
check('category including selected reference retains coherent selection',()=>{ctx.selectCode('WC31');const c=calls.clear;ctx.showCategory('toilets');assert.equal(ctx.selected,placed);assert.equal(calls.clear,c);assert.equal(ctx.marks[0].it,placed);assert(ctx.document.body.classList.contains('nav'));});
check('category excluding selected reference clears shared card/ring state',()=>{const c=calls.clear;ctx.showCategory('lights');assert.equal(ctx.selected,null);assert.equal(calls.clear,c+1);assert(ctx.document.body.classList.contains('nav'));});
check('turning category off clears pick and group marks',()=>{ctx.selectCode('WC31');ctx.showCategory(null);assert.equal(ctx.selected,null);assert.equal(ctx.marks.length,0);assert(!el.findList.classList.contains('show'));});
check('drawing-only result zero is not the first reference result',()=>{ctx.selectCode('WC31');ctx.lastSearch=[{r:['DRAWING LABEL',40,50,44,54]}];el.results.querySelector=()=>({dataset:{code:'WC31'}});ctx.chooseResult(0,true);assert.equal(ctx.lastGoto.l,'DRAWING LABEL');assert.equal(ctx.selected,null);assert.deepEqual(Array.from(ctx.highlight),[40,50,44,54]);});
check('Enter still chooses first reference result',()=>{ctx.chooseResult(0);assert.equal(ctx.selected,placed);assert(ctx.lastGoto.l.startsWith('WC31'));});
check('legend before drawing readiness remains closable',()=>{el.legendBtn.onclick();assert(el.legend.classList.contains('show'));assert(el.legend.innerHTML.includes('loading'));assert.equal(ctx.focus,'close');assert(!ctx.document.body.classList.contains('nav'));});
function escape(){let prevented=false,stopped=false;const e={key:'Escape',target:el.q,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}};handlers.keydown.find(x=>x.capture).f(e);return {prevented,stopped};}
check('Escape dismisses legend with input focus and returns visible Find',()=>{assert(escape().stopped);assert(!el.legend.classList.contains('show'));assert.equal(ctx.focus,'navBtn');assert.equal(el.legendBtn.attrs['aria-expanded'],'false');});
check('Escape dismisses phone Find without clearing the selected pin',()=>{ctx.panel813(true);ctx.selectCode('WC31');assert(escape().stopped);assert.equal(ctx.selected,placed);assert(!ctx.document.body.classList.contains('nav'));assert.equal(ctx.focus,'navBtn');});
check('desktop legend Close restores its existing source button',()=>{phone=false;el.legendBtn.onclick();ctx.closeLegend813();assert.equal(ctx.focus,'legendBtn');phone=true;});
check('Sources records actual provider while keeping limits and original metadata',()=>{ctx.P={count:12,meta:{title:'D001',drawing:'D001',project:'26003',revision:'03',sha256:'fixture'}};ctx.BOOT={images:2,underlay:[]};assert(ctx.legendHtml().includes('Google Satellite'));ctx.SOURCE='mapbox';assert(ctx.legendHtml().includes('Mapbox Satellite'));assert(ctx.legendHtml().includes('Capture date and native resolution are not stated'));ctx.sourceProvider813();assert.equal(el.sourceProvider813.textContent,'Mapbox Satellite');});
check('Fit and area source explicitly clear pick; ordinary zoom does not',()=>{assert(segment(src,'function fit(', 'function gotoRect(').includes('clearSelection813();'));assert(line(src,"$('jumps').onclick").includes('clearSelection813();'));assert(!segment(src,'function zoomBy(', 'function fit(').includes('clearSelection813'));});
check('search result handler distinguishes drawing result from reference',()=>{assert(line(src,"$('results').onclick").includes('chooseResult(+b.dataset.result, true)'));});
check('only explicit Open record invokes host drawer callback',()=>{assert(!src.includes('gc500ExplorerPicked'));assert.equal((merge.match(/h\.gc500ExplorerPicked\(o\.dataset\.xopen\)/g)||[]).length,1);assert(merge.includes('Open record ${escH(code)}'));});
check('merge shared clear removes card and 3D ring without moving position',()=>{const m={G:{},lastCode:'WC31',hideCard(){m.hidden=true;},api3d:()=>({ring(x){m.ring=x;}}),ready3d:true};vm.createContext(m);vm.runInContext(line(merge,'    G.clearPick813 ='),m);m.G.clearPick813();assert.equal(m.lastCode,null);assert(m.hidden);assert.equal(m.ring,null);});
check('master-plan and host placement construction remain byte-exact',()=>{const a=segment(base,'function buildItems(', 'done782Chip(); /* v7.82 */'),b=segment(src,'function buildItems(', 'done782Chip(); /* v7.82 */');assert.equal(a,b);});
check('core georeference transforms remain byte-exact',()=>{for(const [a,b] of [['function geoRect(', 'function '],['function sheetToDevice(', 'function ']]){const ai=base.indexOf(a),bi=src.indexOf(a);assert(ai>=0&&bi>=0,a);const ae=base.indexOf(b,ai+a.length),be=src.indexOf(b,bi+a.length);assert.equal(base.slice(ai,ae),src.slice(bi,be));}});
const sha=t=>crypto.createHash('sha256').update(t).digest('hex');
const result={author:'Andrew Fisher',scope:'Production source functions under CPU DOM fixture. Browser visibility, layout and focus order require independent actual-page evidence.',inputs:{base:sha(base),explorer:sha(src),merge:sha(merge),helper:sha(helper)},checks,passed:checks.length};
fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n');console.log(`${checks.length}/${checks.length} UX CPU checks passed`);
