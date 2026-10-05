// Author: Andrew Fisher. Synthetic reviewed-page links and URL safety checks.
// Node only: no network, browser or operational records are used.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const prior=fs.readFileSync(path.join(__dirname,'../v8.49_fencing_components_LIVE/components849_ui.js'),'utf8');
const start=prior.indexOf('function fenceComponentsEscape849('),end=prior.indexOf('function fenceComponentLinks849(');
assert.ok(start>=0&&end>start,'Original URL and escape functions are available');
const actualHelpers=prior.slice(start,end),candidate=fs.readFileSync(path.join(__dirname,'clean_links851_ui.js'),'utf8');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[x]));
const anchors=html=>[...html.matchAll(/<a href="([^"]*)" target="([^"]*)" rel="([^"]*)">([^<]*)<\/a>/g)].map(m=>({href:decode(m[1]),target:m[2],rel:m[3],label:decode(m[4])}));
const file='https://example.test/source.pdf';
function draw(options={}){
 const papers=options.papers||[],row={book:'red',recordId:'synthetic-record',papers,...options.row};
 const red=options.red??[{id:row.recordId}],blue=options.blue??[];
 const registry=options.registry||{},calls={red:0,blue:0,photo:0};
 const context={URL,Map,location:{href:'https://example.test/view/'},
  allDockets:()=>{calls.red++;return red;},collectionRows:()=>{calls.blue++;return blue;},
  fenceReviewContext836:()=>options.review||null,
  docketPapersOf:()=>options.attached||[],docketPapersByName:()=>options.named||[],
  photoFor:pointer=>{calls.photo++;if(options.throwPhoto)throw Error('Synthetic unavailable source');return registry[pointer.id]||{state:'missing'};}
 };
 const input=JSON.stringify({row,red,blue,registry});vm.createContext(context);vm.runInContext(actualHelpers+'\n'+candidate,context);
 const cache=options.cache||{books:new Map(),links:new Map()},html=context.fenceComponentLinks849(row,cache);
 assert.equal(JSON.stringify({row,red,blue,registry}),input,'Source inputs stay unchanged');
 return {html,links:anchors(html),context,row,cache,calls};
}
const ready=(url,title='Synthetic paper')=>({state:'ready',url,file:{title}});
const original=url=>({state:'current',paper:{result:ready(url)}});
const hrefs=result=>result.links.map(a=>a.href);
let total=0,passed=0;const failures=[];
function check(name,fn){total++;try{fn();passed++;console.log('PASS '+name);}catch(error){failures.push({name,error:error.message});console.error('FAIL '+name+'\n'+error.message);}}

check('An original without page evidence keeps its unqualified source link',()=>{
 const r=draw({review:original(file)});assert.deepEqual(hrefs(r),[file]);assert.equal(r.links[0].label,'Original docket');
});
check('First explicit reviewed page replaces the same original file in place',()=>{
 const r=draw({review:original(file),papers:[{id:'a',page:3}],registry:{a:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3']);assert.equal(r.links[0].label,'Original docket · page 3');
});
check('Every distinct reviewed page of one PDF remains reachable',()=>{
 const r=draw({review:original(file),papers:[{id:'a',page:3},{id:'a',page:8},{id:'a',page:3}],registry:{a:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3',file+'#page=8']);
});
check('A later bare link does not duplicate already reviewed page links',()=>{
 const r=draw({attached:[{id:'a',reviewedPage:3}],papers:[{id:'a'}],registry:{a:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3']);
});
check('Repeated exact file and page across all pointer routes appears once',()=>{
 const r=draw({review:original(file+'#page=3'),attached:[{id:'a',reviewedPage:3}],named:[{id:'a',reviewedPage:3}],papers:[{id:'a',page:3}],registry:{a:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3']);
});
check('A P/O summary gets its explicit page without losing its source label',()=>{
 const r=draw({review:{state:'current',po:{number:'EXAMPLE'},summarySource:{id:'a'}},papers:[{id:'a',page:2}],registry:{a:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=2']);assert.equal(r.links[0].label,'P/O EXAMPLE · supplier summary · page 2');
});
check('Named PDF fragments and unqualified file links both remain',()=>{
 const r=draw({papers:[{id:'named'},{id:'bare'}],registry:{named:ready(file+'#appendix'),bare:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#appendix',file]);
});
check('Named fragments stay distinct from explicit reviewed pages',()=>{
 const r=draw({papers:[{id:'named'},{id:'bare',page:3}],registry:{named:ready(file+'#appendix'),bare:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#appendix',file+'#page=3']);
});
check('A nonnumeric page-like fragment does not erase a bare file link',()=>{
 const r=draw({papers:[{id:'named'},{id:'bare'}],registry:{named:ready(file+'#page=appendix'),bare:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=appendix',file]);
});
check('A compound PDF view fragment remains distinct from a bare file link',()=>{
 const r=draw({papers:[{id:'view'},{id:'bare'}],registry:{view:ready(file+'#page=3&zoom=100'),bare:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3&zoom=100',file]);
});
check('Different query strings on one PDF remain separate source URLs',()=>{
 const r=draw({papers:[{id:'a',page:3},{id:'b',page:3}],registry:{a:ready(file+'?revision=one'),b:ready(file+'?revision=two')}});
 assert.deepEqual(hrefs(r),[file+'?revision=one#page=3',file+'?revision=two#page=3']);
});
check('An explicit page only replaces its own query-qualified file',()=>{
 const r=draw({review:original(file+'?revision=one'),papers:[{id:'b',page:3},{id:'a',page:2}],registry:{a:ready(file+'?revision=one'),b:ready(file+'?revision=two')}});
 assert.deepEqual(hrefs(r),[file+'?revision=one#page=2',file+'?revision=two#page=3']);
});
check('Repeated URLs are compared after the original URL normalisation',()=>{
 const r=draw({papers:[{id:'a',page:3},{id:'b',page:3}],registry:{a:ready('https://EXAMPLE.test:443/source.pdf'),b:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'#page=3']);
});
check('Different file paths never collapse merely because one is a prefix',()=>{
 const r=draw({papers:[{id:'long',page:3},{id:'short'}],registry:{long:ready(file+'.copy'),short:ready(file)}});
 assert.deepEqual(hrefs(r),[file+'.copy#page=3',file]);
});
check('Relative source links use the existing URL resolution rules',()=>{
 const r=draw({papers:[{id:'a',page:2}],registry:{a:ready('../source.pdf')}});assert.deepEqual(hrefs(r),[file+'#page=2']);
});
check('Query separators are escaped in markup and preserved in the target',()=>{
 const r=draw({papers:[{id:'a',page:2}],registry:{a:ready(file+'?a=one&b=two')}});
 assert.deepEqual(hrefs(r),[file+'?a=one&b=two#page=2']);assert.ok(r.html.includes('?a=one&amp;b=two#page=2'));
});
check('Every external link keeps a separate tab and opener protections',()=>{
 const r=draw({papers:[{id:'a',page:2},{id:'a',page:7}],registry:{a:ready(file)}});
 assert.equal(r.links.length,2);assert.ok(r.links.every(a=>a.target==='_blank'&&a.rel==='noopener noreferrer'));
});
check('Hostile protocols, credentials, malformed URLs and control characters produce no anchor',()=>{
 const urls=['javascript:alert(1)','data:text/html,<script>1</script>','file:///tmp/example','blob:https://example.test/a','https://user:secret@example.test/source.pdf','//user:secret@example.test/source.pdf','https://example.test/\nsource.pdf','https://example.test/\u0000source.pdf','https://example.test/\u007fsource.pdf','https://[invalid','',null,12];
 for(const url of urls){const r=draw({papers:[{id:'a',page:2}],registry:{a:ready(url)}});assert.deepEqual(hrefs(r),[],'Unsafe URL '+JSON.stringify(url));}
});
check('Labels and record attributes are escaped without introducing markup',()=>{
 const r=draw({row:{recordId:'x" onclick="bad'},papers:[{id:'a',page:2}],registry:{a:ready(file,'<img src=x onerror="bad"> & report')}});
 assert.equal(r.links[0].label,'<img src=x onerror="bad"> & report · page 2');assert.ok(!r.html.includes('<img'));assert.ok(r.html.includes('data-fc849-record="x&quot; onclick=&quot;bad"'));assert.equal((r.html.match(/<button\b/g)||[]).length,1);
});
check('Unavailable sources do not acquire links from unverified URLs',()=>{
 const r=draw({papers:[{id:'a'}],registry:{a:{state:'pending',url:file}}});assert.deepEqual(hrefs(r),[]);
});
check('A source lookup failure leaves the existing record action usable',()=>{
 const r=draw({papers:[{id:'a'}],throwPhoto:true});assert.deepEqual(hrefs(r),[]);assert.ok(r.html.includes('>Open record</button>'));
});
check('Missing or ambiguous record identity uses the Fencing fallback',()=>{
 for(const red of [[],[{id:'synthetic-record'},{id:'synthetic-record'}]]){const r=draw({red,review:original(file)});assert.deepEqual(hrefs(r),[]);assert.ok(r.html.includes('>Open Fencing</button>'));}
});
check('Collection rows resolve against the blue book without reading the red book',()=>{
 const r=draw({row:{book:'blue'},blue:[{id:'synthetic-record'}],review:original(file)});assert.equal(r.calls.blue,1);assert.equal(r.calls.red,0);assert.deepEqual(hrefs(r),[file]);
});
check('The per-render cache reuses an identical row and its already resolved links',()=>{
 const r=draw({papers:[{id:'a',page:2}],registry:{a:ready(file)}}),calls={...r.calls};
 assert.equal(r.context.fenceComponentLinks849(r.row,r.cache),r.html);assert.deepEqual(r.calls,calls);
});
check('Different reviewed-page inputs get separate cached results',()=>{
 const r=draw({papers:[{id:'a',page:2}],registry:{a:ready(file)}});
 const html=r.context.fenceComponentLinks849({...r.row,papers:[{id:'a',page:7}]},r.cache);
 assert.deepEqual(anchors(html).map(a=>a.href),[file+'#page=7']);assert.equal(r.cache.links.size,2);
});
console.log(JSON.stringify({author:'Andrew Fisher',total,passed,failed:failures.length,failures},null,2));
if(failures.length)process.exitCode=1;
