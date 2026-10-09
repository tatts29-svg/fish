# Author: Andrew Fisher. Pure exact-once Fencing presentation patch; no service writes.
import json

def apply(s, *, support_json, coverage_js, model_js, view_js, css, shared_rep):
 def rep(text, old, new):
  if text.count(old)!=1:raise ValueError('Expected one v829 anchor: '+old[:70])
  return shared_rep(text,old,new,'v829 Fencing presentation','verified build')
 if 'function fenceSupportSources829(' in s:raise SystemExit('v829 already present')
 if 'function fencePrivateApply(' not in s:raise SystemExit('Expected v826 or later Fencing presentation')
 support=json.loads(support_json)
 helper='const FENCE_SUPPORT829 = '+json.dumps(support,separators=(',',':')).replace('</','<\\/')+';\n'+coverage_js
 s=rep(s,'function fencePrivatePapers(d){',helper+'\nfunction fencePrivatePapers(d){')
 a=s.index('function fencePrivatePaperState(d){');b=s.index('\nfunction fencePrivateFact',a);s=s[:a]+"function fencePrivatePaperState(d){return fenceSourceState829(d);}\n"+s[b:]
 s=rep(s,'const papers=paper.papers.map((p,i)=>`<a class="fp-paper" href="${esc(p.result.url)}" target="_blank" rel="noopener noreferrer">${i?\'Paper \'+(i+1):\'Open docket\'}</a>`).join(\'\');','const papers=fenceSourceLinks829(paper);')
 s=rep(s,'const paperBasis=paper.papers.map(p=>`<p class="fp-source">${esc(p.result.file?.name||p.paper.id)} · ${p.paper.byName?\'matched by docket number\':\'linked to this record\'}${p.paper.by?\' · \'+esc(p.paper.by):\'\'}</p>`).join(\'\');','const paperBasis=fenceSourceBasis829(paper);')
 s=rep(s,"${paper.key==='ready'?'✓ ':paper.key==='missing'?'? ':''}${paper.text}","${paper.key==='ready'?'✓ ':''}${paper.text}")
 s=rep(s,"${paper.key==='missing'?'<p class=\"fp-source\">The transcribed record is retained. The original file is not available from the current library.</p>':''}","${paper.key==='recorded'&&d.docket_no?'<p class=\"fp-source\">The docket record is included above. An attachment link is not connected to this row in this view.</p>':''}")
 s=rep(s,"(FENCE_PRIVATE_VIEW.evidence==='ready'?fencePrivatePaperState(d).key==='ready':!!d.docket_no&&fencePrivatePaperState(d).key==='missing')","(FENCE_PRIVATE_VIEW.evidence==='ready'?fencePrivatePaperState(d).key==='ready':FENCE_PRIVATE_VIEW.evidence==='summary'?(fencePrivatePaperState(d).support||[]).length>0:!!d.docket_no&&fencePrivatePaperState(d).key==='recorded')")
 s=rep(s,"const ready=all.filter(d=>fencePrivatePaperState(d).key==='ready').length,missing=all.filter(d=>d.docket_no&&fencePrivatePaperState(d).key==='missing').length;","const sourceLinkText=fenceCoverageText829(all);")
 s=rep(s,'<small>Source papers</small><b>${ready} attached</b><span>${missing} originals to recover · ${all.filter(d=>!d.docket_no).length} workbook row</span>','<small>Fencing records</small><b>${all.length} records</b><span>${sourceLinkText} · ${all.filter(d=>!d.docket_no).length} workbook row</span>')
 s=rep(s,'<option value="ready"${FENCE_PRIVATE_VIEW.evidence===\'ready\'?\' selected\':\'\'}>Docket attached</option><option value="missing"${FENCE_PRIVATE_VIEW.evidence===\'missing\'?\' selected\':\'\'}>Original to recover</option>','<option value="ready"${FENCE_PRIVATE_VIEW.evidence===\'ready\'?\' selected\':\'\'}>Docket attached</option><option value="summary"${FENCE_PRIVATE_VIEW.evidence===\'summary\'?\' selected\':\'\'}>Supporting summary</option><option value="recorded"${FENCE_PRIVATE_VIEW.evidence===\'recorded\'?\' selected\':\'\'}>Record details</option>')
 s=rep(s,"FENCE_PRIVATE_VIEW.evidence==='all'?'all papers':FENCE_PRIVATE_VIEW.evidence==='ready'?'attached':'to recover'","FENCE_PRIVATE_VIEW.evidence==='all'?'all records':FENCE_PRIVATE_VIEW.evidence==='ready'?'attached':FENCE_PRIVATE_VIEW.evidence==='summary'?'summary':'record details'")
 s=rep(s,'Recorded metres &amp; paper coverage','Recorded metres &amp; source links')
 model=model_js
 view=view_js
 s=rep(s,'function fencePrivatePapers(d){',model+'\n'+view+'\nfunction fencePrivatePapers(d){')
 s=rep(s,"['Quoted quantities','Quote & variations','Quoted quantities and variation control']","['Quoted quantities','Quote & estimate',fenceQuote()?'Supplied quote and variation control':'Programme quantities and current rates']")
 s=rep(s,"fold(cardBy(prefix),title,desc);","fold(prefix==='Quoted quantities'?fenceEstimateCard829(cardBy(prefix)):cardBy(prefix),title,desc);")
 css=css
 s=rep(s,'</head>\n<body>','<style id="fencing829-estimate-style">\n'+css+'\n</style>\n</head>\n<body>')
 return s
