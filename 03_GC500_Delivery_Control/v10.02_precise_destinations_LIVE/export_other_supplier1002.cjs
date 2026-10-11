// Author: Andrew Fisher. Reuse the root's existing read-only browser; never launches a browser.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
module.exports=async function exportOtherSupplierPDFs(page,out){
 fs.mkdirSync(out,{recursive:true});
 const before=await page.evaluate(()=>JSON.stringify(S));
 const rows=await page.evaluate(()=>{const m=Supplier996.model();return {version:SYNC.backend.readVersion821(),asAt:m.asAt,inventory:m.inventory,demob:Supplier996.demobLoads().flatMap(l=>l.stops)};});
 const files=[];
 for(const kind of ['inventory','demob']){
  const f=await page.evaluate(async kind=>{const f=await Supplier996.pdf(kind,'',()=>true),bytes=new Uint8Array(await f.blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return {name:f.name,pages:f.pages,base64:btoa(binary)};},kind);
  fs.writeFileSync(path.join(out,f.name),Buffer.from(f.base64,'base64'));files.push({kind,name:f.name,pages:f.pages});
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(S)),before,'Native record changed during inventory/demob PDF export');
 fs.writeFileSync(path.join(out,'rows-private.json'),JSON.stringify(rows));
 fs.writeFileSync(path.join(out,'export-result.json'),JSON.stringify({author:'Andrew Fisher',pass:true,recordVersion:rows.version,files},null,2));
 return files;
};
