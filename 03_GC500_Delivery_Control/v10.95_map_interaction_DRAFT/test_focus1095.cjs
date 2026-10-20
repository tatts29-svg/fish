/* Author: Andrew Fisher. Focused candidate UI proof; all outputs stay private. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page'),focus=require('./tests/focus_reference1095.cjs');
const out=path.resolve(process.env.OUT||'.'),repo=path.resolve(__dirname,'../..'),mobile=process.env.MOB==='1';
if(!process.env.PAGE||!process.env.FOCUS_REF||!process.env.OUT||out===repo||out.startsWith(repo+path.sep))throw Error('Candidate PAGE, FOCUS_REF and private OUT are required');
fs.mkdirSync(out,{recursive:true,mode:0o700});
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#map',W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile,gl:true});try{
 const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&window.GC500Refresh904?.report().settled&&EXP.frame?.contentWindow?.GC500Shape1060?.state.available,null,{timeout:180000});
 const f=await(await p.$('#expFrame')).contentFrame();
 const focused=await focus(p,f,process.env.FOCUS_REF,out,true);
 const result={author:'Andrew Fisher',sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),mobile,focused,errors:h.errors,counts:h.counts};
 fs.writeFileSync(path.join(out,'focus-validation.json'),JSON.stringify(result,null,2),{mode:0o600});
 assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);console.log(JSON.stringify(result));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
