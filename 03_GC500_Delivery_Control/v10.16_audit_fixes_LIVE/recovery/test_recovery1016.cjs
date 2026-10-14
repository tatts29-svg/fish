/* Author: Andrew Fisher. Focused source recovery guards; no network or operational records. */
'use strict';
const fs=require('fs'),vm=require('vm');
let now=100000,calls=0;const checks={};
const ctx={SYNC:{status:'live',backend:{files(){}}},DOCS:{state:'failed',busy:false},Date:{now:()=>now},Promise,docsRefresh(force){if(force!==true)throw Error('Recovery must refresh');calls++;return Promise.resolve();}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/recovery1016.js','utf8'),ctx);
const run=code=>vm.runInContext(code,ctx),check=(name,pass)=>checks[name]=!!pass;
check('failed evidence retries after healthy shared read',run('docsRecovery1016()')&&calls===1);
for(let i=0;i<100;i++)run('docsRecovery1016()');check('quick successful-read loops do not flood registry',calls===1);
now+=999;check('duplicate explicit Retry does not repeat same request',!run('docsRecovery1016(true)')&&calls===1);
now+=1;check('explicit Retry bypasses automatic backoff',run('docsRecovery1016(true)')&&calls===2);
ctx.DOCS.busy=true;now+=20000;check('in-flight request is deduplicated',!run('docsRecovery1016(true)')&&calls===2);ctx.DOCS.busy=false;
ctx.SYNC.status='unreachable';check('unavailable shared record does not prove recovery',!run('docsRecovery1016()')&&calls===2);ctx.SYNC.status='live';
for(const state of ['loading','ready','unrequested','none']){ctx.DOCS.state=state;check(state+' registry is not restarted',!run('docsRecovery1016()')&&calls===2);}
ctx.DOCS.state='failed';check('continued failure is retried after bounded backoff',run('docsRecovery1016()')&&calls===3);
ctx.SYNC.backend=null;now+=20000;check('absent backend is not queried',!run('docsRecovery1016(true)')&&calls===3);
console.log(JSON.stringify({author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks}));if(!Object.values(checks).every(Boolean))process.exitCode=1;
