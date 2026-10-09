/* Author: Andrew Fisher. The deployed v5.87 upload function, isolated from HTTP.
 * Streams synthetic bytes into a temporary directory; no service is contacted.
 * node upload_contract797_checks.cjs SERVER_JS [OUTPUT_JSON]
 */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),vm=require('vm'),assert=require('assert');
const {Readable,Transform,pipeline}=require('stream');
const file=process.argv[2];if(!file)throw Error('Give the reviewed server_v5.87 server.js');
const text=fs.readFileSync(file,'utf8'),sha=crypto.createHash('sha256').update(text).digest('hex');
assert.strictEqual(sha,'d5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc','reviewed deployed server source');
const start=text.indexOf('function fileId(name)'),end=text.indexOf('/* the card, changed in place:',start);assert(start>=0&&end>start);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-photo-contract-')),files={};
const context=vm.createContext({fs,path,crypto,Transform,pipeline,files,FILES:{filesDir:tmp},FILE_ID:/^[A-Za-z0-9._-]+$/,FILE_KINDS:new Set(['drop-photo']),MAX_FILE:1e6,TYPES:{jpg:'image/jpeg'},
 protoKey:()=>false,filing:()=>({ref:null,branch:null,invoice_no:null}),persistFiles:()=>null,diskFull:()=>false,logWrite(){},console,
 send:(res,status,body)=>res.resolve({status,body:structuredClone(body)})});
vm.runInContext(text.slice(start,end),context);
async function upload(){return new Promise(resolve=>{
 const req=Readable.from([Buffer.from('same synthetic photograph bytes')]);req.headers={'x-file-name':'drop_TEST_1_20261002-010000_abcdef0123456789.jpg','x-file-kind':'drop-photo'};
 context.uploadFile(req,{headersSent:false,resolve});
});}
(async()=>{try{
 const first=await upload(),second=await upload();assert.strictEqual(first.status,200);assert.strictEqual(second.status,200);
 assert.strictEqual(first.body.id,second.body.id);assert.strictEqual(first.body.sha256,second.body.sha256);assert.strictEqual(Object.keys(files).length,1);assert.strictEqual(fs.readdirSync(tmp).length,1);
 const result={author:'Andrew Fisher',passed:true,serverSha256:sha,method:'Exact deployed uploadFile evaluated with synthetic file stream and local temporary directory; no HTTP or service writes',sameFilenameSameId:true,sameBytesSameChecksum:true,fileIndexEntries:1,physicalFiles:1,limitation:'A retry can refresh upload metadata. This is stable file identity, not an exactly-once transaction guarantee.'};
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
