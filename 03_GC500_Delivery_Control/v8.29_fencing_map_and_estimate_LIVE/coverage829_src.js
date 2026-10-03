/* Author: Andrew Fisher. Read-only source coverage. Private source-content map is a build input. */
function fenceSupportSources829(d){
 const no=String(d&&d.docket_no||'').trim(),id=String(d&&d.id||'');
 if(!no||!id)return[];
 const idx=photoIndex(),files=idx.state==='ready'?idx.files:(idx.state==='none'?DOCS.files:null);
 if(!files)return[];
 return FENCE_SUPPORT829.sources.filter(s=>s.rows.some(r=>r.record_id===id&&r.docket_no===no)).flatMap(s=>{
  const f=files[s.id];if(!f||f.sha256!==s.sha256)return[];
  const result=photoFor({id:s.id});return result.state==='ready'?[{source:s,result}]:[];
 });
}
function fenceSourceState829(d){
 const ps=fencePrivatePapers(d),ready=ps.filter(p=>p.result.state==='ready'),support=fenceSupportSources829(d);
 if(ready.length)return{key:'ready',text:'Approved by Andrew · docket attached',papers:ready,support};
 const idx=photoIndex();
 if(idx.state==='loading'||ps.some(p=>p.result.state==='checking'))return{key:'loading',text:'Docket recorded · checking links',papers:[],support};
 if(idx.state==='failed'||idx.state==='none'||ps.some(p=>p.result.state==='none'))return{key:'unavailable',text:'Docket recorded · links unavailable',papers:[],support};
 if(ps.some(p=>p.result.state==='ambiguous'))return{key:'ambiguous',text:'Docket recorded · review link',papers:[],support};
 if(support.length)return{key:'summary',text:'Docket recorded · summary linked',papers:[],support};
 return{key:'recorded',text:d.docket_no?'Docket recorded':'Workbook source',papers:[],support};
}
function fenceSourceLinks829(paper){
 const direct=paper.papers.map((p,i)=>`<a class="fp-paper" href="${esc(p.result.url)}" target="_blank" rel="noopener noreferrer">${i?'Docket file '+(i+1):'Open docket'}</a>`).join('');
 const support=(paper.support||[]).map(s=>`<a class="fp-paper" href="${esc(s.result.url)}" target="_blank" rel="noopener noreferrer">Open commercial summary</a>`).join('');
 return direct+support;
}
function fenceSourceBasis829(paper){
 const direct=paper.papers.map(p=>`<p class="fp-source">${esc(p.result.file?.name||p.paper.id)} · ${p.paper.byName?'matched by docket number':'linked to this record'}${p.paper.by?' · '+esc(p.paper.by):''}</p>`).join('');
 const support=(paper.support||[]).map(s=>`<p class="fp-source">${esc(s.source.title)} · exact docket number in the supporting summary. This link does not represent an individual docket scan or a new cost.</p>`).join('');
 return direct+support;
}
function fenceCoverageText829(all){
 const idx=photoIndex();
 if(idx.state==='loading')return'Source links checking';
 if(idx.state!=='ready')return'Source links unavailable';
 const linked=all.filter(d=>{const p=fencePrivatePaperState(d);return p.papers.length||(p.support||[]).length}).length;
 return linked+' with source links';
}
