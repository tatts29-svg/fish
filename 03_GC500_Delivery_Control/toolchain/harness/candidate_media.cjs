// Author: Andrew Fisher. Optional read-only local media for candidate browser tests.
// Operational API requests never enter this resolver. No HTTP or record writes occur here.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const HOST = 'https://gc500-production.up.railway.app';
const PREFIX = '/m/Coates-GC500-2026/';
const IMAGE = /^([a-f0-9]{64})\.(webp|png|jpe?g|gif|avif)$/;
const TYPES = {webp:'image/webp',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',avif:'image/avif'};
class CandidateMediaError extends Error {
 constructor(message) { super(message); this.name='CandidateMediaError'; this.code='GC500_CANDIDATE_MEDIA'; }
}
const fail = message => { throw new CandidateMediaError(message); };
function mediaTable(filename) {
 let source;
 try { source=fs.readFileSync(filename,'utf8'); } catch (_) { fail('Cannot read configured candidate/base page'); }
 const match=/const DATA = (\{.*?\});\r?\n/s.exec(source);
 if(!match)fail('Configured page has no DATA declaration');
 let data;
 try { data=JSON.parse(match[1]); } catch (_) { fail('Configured page DATA is not valid JSON'); }
 if(!data.media||typeof data.media!=='object'||Array.isArray(data.media))fail('Configured page has no media table');
 return data.media;
}
function createCandidateMedia({pageFile,baseFile,directories=[]}={}) {
 const configured=directories.filter(Boolean);
 // With no explicit local roots or candidate page, preserve the established network path.
 if(!pageFile||!configured.length)return ()=>null;
 let candidate=null,base=null,roots=null,loaded=false;
 function load() {
  if(loaded)return;
  candidate=mediaTable(pageFile);
  const adjacent=path.dirname(path.resolve(pageFile));
  const baseline=baseFile||[path.join(adjacent,'base_live.html'),path.join(adjacent,'v884.before.html')].find(f=>fs.existsSync(f));
  base=baseline?mediaTable(baseline):null;
  roots=[...new Set(configured.map(dir=>{
   let real;
   try { real=fs.realpathSync(dir);if(!fs.statSync(real).isDirectory())fail('Configured local media root is not a directory'); }
   catch(e) { if(e.code==='GC500_CANDIDATE_MEDIA')throw e;fail('Configured local media directory is unavailable'); }
   return real;
  }))];
  loaded=true;
 }
 return function resolve(url,headers={},method='GET') {
  // Check method, origin and route before reading either local page or directory.
  if(method!=='GET')return null;
  let parsed;
  try { parsed=new URL(url); } catch (_) { return null; }
  if(parsed.origin!==HOST||!parsed.pathname.startsWith(PREFIX))return null;
  let filename;
  try { filename=decodeURIComponent(parsed.pathname.slice(PREFIX.length)); } catch (_) { fail('Invalid candidate media path encoding'); }
  const match=IMAGE.exec(filename);
  if(!match) {
   if(filename.includes('/')||filename.includes('\\')||filename.includes('..'))fail('Candidate media path must be a single hash-named file');
   return null; // Audio, movies and existing non-image routes retain their network behaviour.
  }
  load();
  const descriptor=candidate[match[1]];
  if(!descriptor)return null; // An unrelated live-record attachment is not a candidate resource.
  if(descriptor.file!==filename||descriptor.sha256!==match[1]||!Number.isSafeInteger(descriptor.bytes)||descriptor.bytes<=0||descriptor.type!==TYPES[match[2]])fail('Invalid candidate media descriptor: '+filename);
  let body=null;
  for(const root of roots) {
   const proposed=path.join(root,filename);
   if(!fs.existsSync(proposed))continue;
   let actual;
   try { actual=fs.realpathSync(proposed); } catch (_) { fail('Cannot resolve candidate media: '+filename); }
   if(!actual.startsWith(root+path.sep)||!fs.statSync(actual).isFile())fail('Candidate media escapes its configured directory: '+filename);
   body=fs.readFileSync(actual);
   if(body.length!==descriptor.bytes)fail('Candidate media byte length mismatch: '+filename);
   if(crypto.createHash('sha256').update(body).digest('hex')!==descriptor.sha256)fail('Candidate media SHA-256 mismatch: '+filename);
   break;
  }
  if(!body) {
   const previous=base&&base[match[1]];
   if(previous&&['file','sha256','bytes','type','scope'].every(k=>previous[k]===descriptor[k]))return null;
   fail((base?'Missing new candidate media: ':'Missing candidate media; configure GC500_MEDIA_BASE to identify unchanged live files: ')+filename);
  }
  const outHeaders={'content-type':descriptor.type,'cache-control':'no-store','access-control-allow-origin':'*','accept-ranges':'bytes','x-gc500-candidate-media':'sha256-verified'};
  const range=Object.entries(headers||{}).find(([key])=>key.toLowerCase()==='range')?.[1];
  if(!range)return {status:200,headers:outHeaders,body};
  const bytes=/^bytes=(\d+)-(\d*)$/.exec(String(range));
  const start=bytes?Number(bytes[1]):NaN,end=bytes?(bytes[2]?Math.min(Number(bytes[2]),body.length-1):body.length-1):NaN;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=body.length)return {status:416,headers:{...outHeaders,'content-range':'bytes */'+body.length},body:Buffer.alloc(0)};
  return {status:206,headers:{...outHeaders,'content-range':`bytes ${start}-${end}/${body.length}`},body:body.subarray(start,end+1)};
 };
}
function fromEnvironment(environment=process.env) {
 return createCandidateMedia({pageFile:environment.PAGE,baseFile:environment.GC500_MEDIA_BASE,
  directories:['MEDIA','MEDIA893','MEDIA889','ATLAS896'].map(key=>environment[key])});
}
module.exports={createCandidateMedia,fromEnvironment,CandidateMediaError};
