// Author: Andrew Fisher. Read-only local movie/poster provider for standard candidate sweeps.
// Load with node -r ./.../media995_hook.cjs. PUBLIC=1 deliberately bypasses substitution.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
if(process.env.PUBLIC!=='1'){
 const report=JSON.parse(fs.readFileSync(process.env.MACHINE995_TEST_MEDIA,'utf8'));
 const catalogue=new Map(Object.values(report.roles).map(row=>{
  const body=fs.readFileSync(row.path);
  assert.equal(crypto.createHash('sha256').update(body).digest('hex'),row.sha256,'Candidate media digest changed');
  assert.equal(body.length,row.bytes,'Candidate media bytes changed');
  assert.equal(path.parse(row.file).name,row.sha256,'Candidate media filename differs');
  return[row.file,{...row,body}];
 }));
 const fetcher=require('../../toolchain/harness/curlfetch'),held=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,headers={},method='GET',body){
  const parsed=new URL(url),file=parsed.pathname.slice('/m/Coates-GC500-2026/'.length);
  const row=parsed.origin==='https://gc500-production.up.railway.app'&&parsed.pathname.startsWith('/m/Coates-GC500-2026/')&&method==='GET'?catalogue.get(file):null;
  if(!row)return held(url,headers,method,body);
  const out={'content-type':row.type,'accept-ranges':'bytes','cache-control':'no-store','access-control-allow-origin':'*'};
  const input=Object.entries(headers).find(([k])=>k.toLowerCase()==='range')?.[1];
  if(!input)return{status:200,headers:out,body:row.body};
  const range=/^bytes=(\d+)-(\d*)$/.exec(input),start=range?+range[1]:NaN,end=range?(range[2]?Math.min(+range[2],row.bytes-1):row.bytes-1):NaN;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=row.bytes)return{status:416,headers:{...out,'content-range':'bytes */'+row.bytes},body:Buffer.alloc(0)};
  return{status:206,headers:{...out,'content-range':`bytes ${start}-${end}/${row.bytes}`},body:row.body.subarray(start,end+1)};
 };
}
