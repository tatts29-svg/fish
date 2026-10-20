/* Author: Andrew Fisher. Source review is separate from docket sign-off and charges. */
const FENCE_REVIEW_FIELDS836 = {
 red:['date','location','quantities','components'],
 green:['date','location','labour_hours','crew_note','metres'],
 blue:['date','location','collected','hire_agreements_written']
};
const fenceReviewOwn836=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
const fenceReviewPdf836=source=>!source.media_type||source.media_type==='application/pdf';
const fenceReviewHash836=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
function fenceReviewCanonical836(value){
 if(value==null)return 'null';
 if(Array.isArray(value))return '['+value.map(fenceReviewCanonical836).join(',')+']';
 if(typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+fenceReviewCanonical836(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
function fenceReviewIdentity836(record,input,records=null){
 const stop=(state,reason)=>({state,reason,po:null});
 if(!record||!input||input.schema!==1||!Array.isArray(input.rows)||!Array.isArray(input.sources))return {state:'none',po:null};
 const id=String(record.id||''),no=String(record.docket_no||''),book=record.book||'red';
 const candidates=input.rows.filter(r=>r&&(r.record_id===id||r.docket_no===no));
 if(!candidates.length)return {state:'none',po:null};
 if(candidates.length!==1)return stop('ambiguous','More than one reviewed identity matches this record.');
 if(Array.isArray(records)&&records.filter(r=>r&&(String(r.id||'')===id||String(r.docket_no||'')===no)).length!==1)return stop('ambiguous','The current docket identity is not unique.');
 const row=candidates[0],fields=fenceReviewOwn836(FENCE_REVIEW_FIELDS836,book)?FENCE_REVIEW_FIELDS836[book]:null;
 if(row.record_id!==id||row.docket_no!==no||row.book!==book||!Array.isArray(fields))return stop('stale','The docket identity differs from the reviewed record.');
 return {state:'matched',row,fields};
}
function fenceReviewOriginal836(record,input,files,records=null){
 const identity=fenceReviewIdentity836(record,input,records);
 if(identity.state!=='matched')return null;
 const row=identity.row,o=row.original;
 if(!o||!fenceReviewHash836(o.page_sha256)||!Number.isInteger(o.page)||o.page<1)return null;
 const sources=input.sources.filter(s=>s&&s.id===o.source_id);
 if(sources.length!==1)return null;
 const source=sources[0];
 if(!fenceReviewPdf836(source)&&(source.media_type!=='image/jpeg'||source.pages!==1||o.page!==1))return null;
 const file=fenceReviewOwn836(files,source.id)?files[source.id]:null;
 if(!fenceReviewHash836(source.sha256)||!file||file.sha256!==source.sha256||!Number.isInteger(source.pages)||o.page>source.pages)return null;
 return {row,originalSource:source};
}
function fencingReview836(record,input,files=null,records=null){
 const stop=(state,reason)=>({state,reason,po:null}),identity=fenceReviewIdentity836(record,input,records);
 if(identity.state!=='matched')return identity;
 const {row,fields}=identity;
 if(!row.expected||Object.keys(row.expected).sort().join('|')!==fields.slice().sort().join('|'))return stop('stale','The reviewed record signature is incomplete.');
 const current=Object.fromEntries(fields.map(k=>[k,record[k]==null?null:record[k]]));
 if(fenceReviewCanonical836(current)!==fenceReviewCanonical836(row.expected))return stop('stale','Recorded quantities or source details have changed since review.');
 if(!row.original||!fenceReviewHash836(row.original.page_sha256)||!Number.isInteger(row.original.page)||row.original.page<1||!/^\d{4}-\d{2}-\d{2}$/.test(row.reviewed_on||''))return stop('stale','The reviewed source binding is incomplete.');
 const find=id=>input.sources.filter(s=>s&&s.id===id);
 const originals=find(row.original.source_id),summaries=row.summary?find(row.summary.source_id):[];
 if(originals.length!==1||(row.summary&&summaries.length!==1))return stop(originals.length>1||summaries.length>1?'ambiguous':'stale','The reviewed source identity cannot be resolved uniquely.');
 const originalSource=originals[0],summarySource=summaries[0]||null;
 let unavailable=false;
 for(const source of [originalSource,summarySource].filter(Boolean)){
  if(!fenceReviewPdf836(source)&&(source.media_type!=='image/jpeg'||source.pages!==1))return stop('stale','The reviewed source media type is unsupported.');
  if(!fenceReviewHash836(source.sha256))return stop('stale','The reviewed source fingerprint is missing.');
  const file=fenceReviewOwn836(files,source.id)?files[source.id]:null;
  if(!file||!fenceReviewHash836(file.sha256))unavailable=true;
  else if(file.sha256!==source.sha256)return stop('stale','The linked source file has changed since review.');
 }
 if(!Number.isInteger(originalSource.pages)||row.original.page>originalSource.pages)return stop('stale','The reviewed page is outside its source document.');
 if(row.po!=null&&(!row.po||!summarySource||typeof row.po.number!=='string'||!/^\d{4,12}$/.test(row.po.number)||row.po.basis!=='source_summary'||row.po.source_id!==summarySource.id))return stop('stale','The purchase-order association lacks its reviewed source basis.');
 if(!row.query||typeof row.query.open!=='boolean'||typeof row.query.text!=='string'||!row.query.text.trim())return stop('stale','The charge-review scope is not explicit.');
 if(unavailable)return stop('unavailable','The reviewed document checksums are not available from the file registry yet.');
 return {state:'current',row,po:row.po||null,reviewedOn:row.reviewed_on,query:row.query,originalSource,summarySource};
}
function fenceReviewContext836(d){
 const idx=photoIndex(),files=idx.state==='ready'?idx.files:null;
 // Identity checks use raw collections; costing and native records are untouched.
 const records=[...(FCOM.dockets||[]),...(S.fenceDockets||[]),...(FCOM.service_notes||[]).map(n=>({id:n.id,docket_no:n.note_no})),...(S.serviceNotes||[]).filter(n=>n&&n.id&&!tombedHere(n.id)).map(n=>({id:n.id,docket_no:n.note_no})),...(FCOM.collections||[]).map(n=>({id:n.id,docket_no:n.collection_no}))];
 const review=fencingReview836(d,FENCE_REVIEW836,files,records),original=fenceReviewOriginal836(d,FENCE_REVIEW836,files,records);
 if(review.state==='unavailable')review.checking=idx.state==='loading';
 review.paper=null;
 if(original){
  const source=original.originalSource,result=photoFor({id:source.id});
  if(result.state==='ready'&&webLink(result.url)){
   const url=new URL(result.url,location.href);
   if(url.origin===location.origin){const page=fenceReviewPdf836(source)?original.row.original.page:null;url.hash=page?'page='+page:'';review.paper={paper:{id:source.id,byName:false,reviewedSource:true,reviewedPage:page},result:Object.assign({},result,{url:url.href})};}
  }
 }
 return review;
}
function fenceReviewHeading836(review){
 if(review.state!=='current'||!review.po)return '';
 return ` <span class="fp-review-po" title="P/O association from the reviewed supplier summary">P/O ${esc(review.po.number)}<small>source summary</small></span>`;
}
function fenceReviewStatus836(review){
 if(review.state==='none')return '';
 if(review.state==='unavailable')return `<span class="fp-review-state fp-review-needed">Review links ${review.checking?'checking':'unavailable'}</span>`;
 if(review.state!=='current')return '<span class="fp-review-state fp-review-needed">Source review needed</span>';
 return '<span class="fp-review-state">Source reviewed</span>'+(review.query.open?'<span class="fp-review-state fp-review-query">Charges: query open</span>':'');
}
function fenceReviewDetails836(review,paper){
 if(review.state==='none')return '';
 if(review.state==='unavailable')return `<div class="fp-review-detail"><p><b>Review links ${review.checking?'checking':'unavailable'}.</b> ${esc(review.reason)} Source-review and P/O details will appear when the reviewed document checksums can be confirmed. Existing docket sign-off is unchanged.</p></div>`;
 if(review.state!=='current')return `<div class="fp-review-detail"><p><b>Source review needed.</b> ${esc(review.reason||'The current record no longer matches this review.')} Existing docket sign-off is unchanged.</p></div>`;
 const pdf=fenceReviewPdf836(review.originalSource),pageText=pdf?' · page '+esc(review.row.original.page):'';
 const topHasPack=(paper&&paper.papers||[]).some(p=>p.paper&&p.paper.id===review.originalSource.id&&(!pdf||p.paper.reviewedPage===review.row.original.page));
 const link=review.paper&&!topHasPack?`<p><a class="fp-paper" href="${esc(review.paper.result.url)}" target="_blank" rel="noopener noreferrer">Open reviewed docket${pageText}</a></p>`:'';
 const missing=review.paper?'':' The reviewed pack link is currently unavailable.';
 return `<div class="fp-review-detail"><p><b>Source reviewed · ${esc(review.reviewedOn)}.</b> ${esc(review.originalSource.title)}${pageText}.${missing}</p><p>${review.po?`<b>P/O ${esc(review.po.number)} — source summary.</b> Matched by the docket number in ${esc(review.summarySource.title)}. This association does not confirm a recorded P/O period or invoice amount.`:'<b>P/O allocation not established.</b> This docket is not linked to a numbered purchase-order entry in the reviewed summary.'}</p><p><b>${review.query.open?'Charges: query open.':'Charge review scope.'}</b> ${esc(review.query.text)} Source review covers the recorded work and supporting papers. Andrew’s docket sign-off remains separate from charge reconciliation, formal audit and payment.</p>${link}</div>`;
}
if(typeof module!=='undefined'&&module.exports)module.exports={fenceReviewCanonical836,fenceReviewOriginal836,fencingReview836,fenceReviewHeading836,fenceReviewStatus836,fenceReviewDetails836};
