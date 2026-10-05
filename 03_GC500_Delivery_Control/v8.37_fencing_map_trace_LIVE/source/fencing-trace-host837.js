/* Author: Andrew Fisher. Current register values projected into existing map details. */
let FENCE_TRACE_RENDER837=null;
function fenceTraceLink837(result,label,page){
 if(!result||result.state!=='ready'||!webLink(result.url))return null;
 const url=new URL(result.url,location.href);if(url.origin!==location.origin)return null;
 if(page)url.hash='page='+page;
 return {label,url:url.href};
}
function fenceTraceSnapshot837(catalogue){
 const core=window.GC500FencingTrace837,records=[...allDockets(),...serviceNoteRows(),...collectionRows()],reviews={},links={},sourceLinks={},idx=photoIndex(),files=idx.state==='ready'?idx.files:null;
 for(const d of records){
  const k=core.key(d),review=fenceReviewContext836(d);reviews[k]=review;
  const items=[],binding=FENCE_TRACE837.rows.find(r=>core.key(r)===k),unique=records.filter(r=>String(r.id||'')===String(d.id||'')||String(r.docket_no||'')===String(d.docket_no||'')).length===1;
  if(review.paper){const link=fenceTraceLink837(review.paper.result,'Open reviewed docket'+(review.paper.paper.reviewedPage?' · page '+review.paper.paper.reviewedPage:''));if(link)items.push({...link,kind:'original'});}
  else if(binding&&unique){for(const proof of binding.evidence){if(core.documentState(proof,FENCE_TRACE837.sources,files))continue;const source=FENCE_TRACE837.sources.find(s=>s.id===proof.source_id),page=source.media_type==='application/pdf'?proof.page:null,link=fenceTraceLink837(photoFor({id:source.id}),'Open reviewed docket'+(page?' · page '+page:''),page);if(link)items.push({...link,kind:'original'});}}
  if(review.state==='current'&&review.summarySource){const link=fenceTraceLink837(photoFor({id:review.summarySource.id}),'Open supplier summary');if(link)items.push(link);}
  links[k]=items;
 }
 for(const s of FENCE_TRACE837.sources){if(files&&files[s.id]&&files[s.id].sha256===s.sha256){const link=fenceTraceLink837(photoFor({id:s.id}),'Open supplier source',s.media_type==='application/pdf'?1:null);if(link)sourceLinks[s.id]=link;}}
 return core.model(FENCE_TRACE837,{geometry:catalogue.geometry,sources:[...catalogue.sources,...(catalogue.reference_sources||[])],master_sha256:catalogue.master_sha256,files,records,reviews,links,sourceLinks,purchaseOrders:poAll(),canonical:fenceReviewCanonical836});
}
function fenceTraceCurrent837(){return fenceTraceSnapshot837(window.gc500FencingTraceCatalogue837());}
function fenceTraceRegister837(d){
 const trace=FENCE_TRACE_RENDER837;if(!trace)return '';
 const row=trace.rows.find(r=>r.key===window.GC500FencingTrace837.key(d)),unmapped=trace.unmapped.find(r=>r.key===window.GC500FencingTrace837.key(d));
 if(!row&&!unmapped)return '';
 if(!row||!row.area_ids.length)return `<div class="fp-review-detail"><b>Location not mapped.</b> ${esc(unmapped&&unmapped.reason||'No reviewed area association is available.')}</div>${window.GC500FencingTraceView837.recordCommercial(trace,window.GC500FencingTrace837.key(d))}`;
 if(row.state!=='current')return `<div class="fp-review-detail"><b>Map association needs review.</b> ${esc(row.reason)}</div>`;
 const areas=trace.areas.filter(a=>row.area_ids.includes(a.id)&&a.state==='current');
 return `<div class="fp-review-detail"><p><b>Recorded work in this area.</b> The link identifies the area, not an exact fence section or completion.</p>${areas.map(a=>`<button type="button" class="btn" data-ro data-fence-trace-map="${esc(row.key)}" data-fence-trace-area="${esc(a.id)}">View ${esc(a.label)} on map →</button>`).join(' ')}</div>`;
}
function fenceTraceReveal837(card){
 const main=$('main');if(!card||!main||!main.contains(card))return false;
 const delta=card.getBoundingClientRect().top-main.getBoundingClientRect().top-main.clientTop,max=Math.max(0,main.scrollHeight-main.clientHeight);
 main.scrollTop=Math.max(0,Math.min(max,main.scrollTop+delta));
 card.querySelector('summary')?.focus({preventScroll:true});return true;
}
window.gc500FencingTraceDocket837=function(key){
 const trace=fenceTraceCurrent837(),row=trace.rows.concat(trace.unmapped).find(r=>r.key===key);if(!row)return false;
 const records=[...allDockets(),...serviceNoteRows(),...collectionRows()],matches=records.filter(d=>window.GC500FencingTrace837.key(d)===key);if(matches.length!==1)return false;
 FENCE_PRIVATE_VIEW.book=row.book||'red';FENCE_PRIVATE_VIEW.date='';FENCE_PRIVATE_VIEW.evidence='all';FENCE_PRIVATE_VIEW.opened[row.record_id]=true;
 state.q=row.record_id;const q=$('#q');if(q){q.value=state.q;$('#qx').hidden=false;}go('fencing');
 requestAnimationFrame(()=>{if(state.tab!=='fencing')return;const card=[...document.querySelectorAll('#pane-fencing [data-fp-id]')].find(e=>e.dataset.fpId===row.record_id);fenceTraceReveal837(card);});return true;
};
document.addEventListener('click',event=>{
 const link=event.target.closest('#pane-fencing [data-fmtrace-record]');if(link){if(!window.gc500FencingTraceDocket837(link.dataset.fmtraceRecord))flash('This record is unavailable. Reopen the fencing register to check it.');return;}
 const b=event.target.closest('[data-fence-trace-map]');if(!b)return;
 const trace=fenceTraceCurrent837(),row=trace.rows.find(r=>r.key===b.dataset.fenceTraceMap&&r.state==='current'),area=trace.areas.find(a=>a.id===b.dataset.fenceTraceArea&&a.state==='current');
 if(!row||!area||!row.area_ids.includes(area.id)){flash('This map association needs review before it can be opened.');return;}
 window.gc500OpenFencingMap(area.geometry_id);
});
