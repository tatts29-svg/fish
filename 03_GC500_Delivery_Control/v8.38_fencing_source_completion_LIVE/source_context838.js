/* Author: Andrew Fisher. Source-page context is not a map position or allocation. */
function fenceTraceContext838(row){
 if(!row||row.state!=='current'||!Array.isArray(row.area_ids)||row.area_ids.length)return '';
 const links=(row.links||[]).filter(link=>{
  if(link.kind!=='area-context'||!webLink(link.url))return false;
  try{const url=new URL(link.url,location.href);return url.origin===location.origin&&!url.username&&!url.password;}catch(_){return false;}
 });
 if(!links.length)return '';
 return `<div class="fp-review-detail fp-source-context838"><p><b>Source location context.</b> ${esc(row.basis)} The location remains unmapped.</p><p>${links.map(link=>`<a class="fp-paper" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`).join(' ')}</p></div>`;
}
