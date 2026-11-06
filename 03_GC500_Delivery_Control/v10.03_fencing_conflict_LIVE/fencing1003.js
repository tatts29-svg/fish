// Author: Andrew Fisher. Docket 36560 source correction and stable list equality.
function recordCanonical1003(value){
 return JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
}
function fenceDockets1003(list,deleted){
 const corrected={"id":"F-AFV-0002","date":"2026-09-28","week":"Week 3","docket_no":"36560","crew":"Advanced Temporary Fencing","map_ref":null,"location":"GC Hwy median strip (north)","quantities":{"clean":507.5,"ccb_demarc":447.5,"ped_gates":1},"note":"Includes 4 smoking zones. No shade cloth yet, requested from John (IEDM). Paper says CC Barrier 447.5 m; event or demarcation not written - recorded as demarcation, to confirm","recorded_by":'Author: Andrew Fisher'.slice(8)+' via Claude',"recorded_on":"2026-09-29","components":{"mesh_panel":203,"cc_barrier":179,"base":538,"clamp":547,"brace":171,"wheels":6},"signed_by":"Brenden","scope":"programme","source":"Advanced Temporary Fencing hire agreement 36560, signed paper photographed on site","origin":"captured"};
 const previous={...corrected,quantities:{...corrected.quantities}};delete previous.quantities.ped_gates;
 const signatures=new Set([recordCanonical1003(previous),recordCanonical1003(corrected)]);
 const base=corrected.id,aliases=[base,base+'·3529',base+'·bed7'];
 // An explicit removal is never undone by this source correction. Undo keeps the native tombstone rules.
 if(deleted&&aliases.some(id=>tombed({deleted},id)))return (list||[]).slice();
 let retained=false;const result=[];
 for(const row of list||[]){
  if(!row||String(row.id).replace(/·[0-9a-f]{4}$/,'')!==base){result.push(row);continue;}
  const compare={...row,id:base};delete compare._k;
  if(!signatures.has(recordCanonical1003(compare))){result.push(row);continue;}
  if(!retained){result.push({...corrected,quantities:{...corrected.quantities},components:{...corrected.components}});retained=true;}
 }
 return result;
}
