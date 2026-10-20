/* Author: Andrew Fisher. The unchanged supplied original is available in Documents. */
const Documents973=(()=>{
 'use strict';
 const id='VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf';
 const sha256='9ef1527d1fd9c6c7ea70dd3db3ced96784b0c1b32eba0df2aa3fb5ecd61be382';
 function confirmed(files){const f=files&&files[id];return !!(f&&f.sha256===sha256&&f.bytes===2994014&&f.kind==='map');}
 function project(collection,files){
  if(!confirmed(files))return collection;
  return {...collection,items:collection.items.map(d=>d.id!==id?d:{...d,pages:17,sha256,
   note:'Original supplied plan · 17 pages · received 8 Oct 2026. Numbered VMS destinations and relocation details. Load-to-board allocation remains separate; existing D025 map positions are preserved.'})};
 }
 function href(){return confirmed(DOCS.files)?'/f/Coates-GC500-2026/'+encodeURIComponent(id):null;}
 return {id,sha256,confirmed,project,href};
})();
if(typeof window!=='undefined'){
 window.Documents973=Documents973;
 const collectionBefore973=docCollection;
 docCollection=function(){return Documents973.project(collectionBefore973.apply(this,arguments),DOCS.files);};
}
if(typeof module!=='undefined'&&module.exports)module.exports=Documents973;
function referenceLocation973Html(row){
 const link=Reference973.sourceLink(row),e=row.sourceEvidence973;
 const detail=e?[row.required,row.why,e.dateDiscrepancy].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' '):'';
 return esc(row.location||row.required)+(link?' <a href="'+esc(link)+'" target="_blank" rel="noopener">Plan</a>':'')+(detail?'<details><summary>More info</summary>'+esc(detail)+'</details>':'');
}
