/* Author: Andrew Fisher. Labelled synthetic artwork gallery; no operational records. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {positives}=require('./art_mapping.cjs'),manifest=require('./atlas_manifest.cjs');
const api=require('../artwork1268_src.js');
(async()=>{
 for(const k of ['CANDIDATE','EXPECTED_PAGE_SHA','OUT'])assert(process.env[k],k+' required');
 const bytes=fs.readFileSync(process.env.CANDIDATE),sha=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha,process.env.EXPECTED_PAGE_SHA);
 const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep),'OUT must stay private');
 const html=bytes.toString(),art=html.match(/<style id="artwork1268-style">([\s\S]*?)<\/style>/)?.[1];assert(art);
 const start=html.indexOf('#pane-demob .stw1238{'),end=html.indexOf('/* v12.42.2',start);assert(start>0&&end>start);
 const nativeCSS=html.slice(start,end);assert(nativeCSS.includes('#pane-demob .stp1238'));
 const kinds=Object.values(manifest).flat(),examples=kinds.map(kind=>{const context=positives.find(([,value])=>value===kind)[0];return '<section data-test-kind="'+kind+'"><h2>'+kind+'</h2><div class="stw1238"><div class="stp1238" role="img">'+api.html(context)+'<i class="stc1238">✓</i><b>Picked up</b><span>Preview only</span><small>No operational record</small></div></div></section>';}).join('');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:1200,height:900},deviceScaleFactor:1,serviceWorkers:'block'}),page=await ctx.newPage();
  await page.route('**/*',route=>route.abort());
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#071c22;color:#e9f5ef;font-family:Inter,Arial,sans-serif}header{padding:24px 30px}h1{font-size:24px;margin:0 0 8px}p{margin:0;color:#a0b6bd}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:24px 30px}section{min-width:0;padding:8px 8px 20px}h2{font-size:14px;text-align:center;margin:0 0 12px;color:#b8d6d0}</style><style>'+nativeCSS+'</style><style>'+art+'</style></head><body><header><h1>Equipment artwork — synthetic gallery</h1><p>All 30 equipment families. Exact candidate stamp and artwork CSS. These are previews, not operational cards.</p></header><main id="pane-demob">'+examples+'</main></body></html>');
  const loaded=await page.evaluate(async()=>{const sources=[...new Set([...document.querySelectorAll('.artwork1268')].map(n=>getComputedStyle(n).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]))];return Promise.all(sources.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth>0);i.onerror=()=>resolve(false);i.src=src;})));});
  assert.equal(await page.locator('[data-test-kind]').count(),30);assert.equal(loaded.length,5);assert(loaded.every(Boolean));
  fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'all-artwork-synthetic-gallery.png'),fullPage:true,animations:'disabled',timeout:60000});
  fs.writeFileSync(path.join(out,'all-artwork-synthetic-gallery.json'),JSON.stringify({author:'Andrew Fisher',status:'PASS',candidateSha256:sha,scope:'synthetic gallery only',kinds,atlases:loaded.length,network:'all denied',operationalRecords:false},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',scope:'synthetic all-artwork visual gallery'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
