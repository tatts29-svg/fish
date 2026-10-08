#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded native paper-capture patch; no operational rows."""
import argparse, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(s):
    def replace(old,new,count=1):
        nonlocal s
        if count == 1:
            s=rep(s,old,new,'v898 native paper capture','page.html')
            return
        lines=[line for line in s.splitlines() if old in line]
        if len(lines)!=count or s.count(old)!=count: raise ValueError('Repeated integration anchor count changed')
        for line in lines:
            s=rep(s,line,line.replace(old,new),'v898 list integration','page.html')
    if 'map897-script' not in s or s.count(' · v8.97')!=1: raise ValueError('v898 requires the final v897 page and one footer')
    replace(' · v8.97',' · v8.98')
    if 'function recordCollection(f)' in s: raise ValueError('Already has collection capture')
    replace('serviceNotes:[], docketPapers:{}','serviceNotes:[], fenceCollections:[], docketPapers:{}')
    replace("serviceNotes: 'id', breakdowns:","serviceNotes: 'id', fenceCollections: 'id', breakdowns:")
    replace("c === 'serviceNotes' ? 'service note'", "c === 'serviceNotes' ? 'service note' : c === 'fenceCollections' ? 'collection form'")
    replace("'descs', 'rental', 'fenceDockets', 'deleted'", "'descs', 'rental', 'fenceDockets', 'fenceCollections', 'deleted'")
    replace("if (!vals.some(([, n]) => (n || 0) > 0)) bad.push('no quantity above zero');", "if (!vals.some(([, n]) => (n || 0) > 0) && !fenceComponentsOnly898(d)) bad.push('no quantity above zero');")
    replace('function recordHireAgreement(f){','function recordHireAgreement(f){\n if (f && f.components_only === true) return recordComponentAgreement898(f);')
    old="""function collectionRows(){
 return (FCOM.collections || []).map(c => Object.assign({}, c, {docket_no: c.collection_no, book: 'blue'}))
.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.collection_no).localeCompare(String(b.collection_no)));
}"""
    new="""function collectionRows(){
 const rows = (FCOM.collections || []).map(c => Object.assign({}, c, {docket_no:c.collection_no, book:'blue', _where:'committed'})).concat(localCollectionRows898()).filter(c => c && c.id && !fenceCollectionRemoved898(c.id));
 const groups = new Map();
 for(const row of rows) { const number=String(row.collection_no||'').trim(); const key=number||row.id; if(!groups.has(key))groups.set(key,[]); groups.get(key).push(row); }
 const result=[];
 for(const copies of groups.values()) {
   const signature=row=>fencePaperCanonical898(Object.fromEntries(['collection_no','date','week','location','collected','issued','hire_agreements_written','note','order_no','signed_by','source','recorded_by','recorded_on'].map(k=>[k,row[k]==null?null:row[k]])));
   const variants=new Map(); for(const row of copies) { const key=signature(row); const prior=variants.get(key); if(!prior || String(row.id)<String(prior.id))variants.set(key,row); }
   const identities=new Set(copies.map(row=>String(row.id))),conflict=variants.size>1||identities.size>1;
   const shown=identities.size>1?[...new Map(copies.map(row=>[row.id+'|'+signature(row),row])).values()]:[...variants.values()];
   for(const row of shown) result.push(conflict?Object.assign({},row,{usable:false,problems:[...(row.problems||[]),'conflicting copies of the same collection paper']}):row);
 }
 return result.sort((a,b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.collection_no).localeCompare(String(b.collection_no)));
}"""
    replace(old,(HERE/'capture898.js').read_text()+'\n'+new)
    replace("...(FCOM.collections||[]).map(n=>({id:n.id,docket_no:n.collection_no}))", "...collectionRows().map(n=>({id:n.id,docket_no:n.collection_no}))")
    replace("serviceNotes: (j && j.service_notes) || [], fenceQuote:","serviceNotes: (j && j.service_notes) || [], fenceCollections: (j && j.fence_collections) || [], fenceQuote:")
    replace("'fenceDockets', 'serviceNotes',", "'fenceDockets', 'serviceNotes', 'fenceCollections',",3)
    replace("union('serviceNotes', 'dockets');", "union('serviceNotes', 'dockets');\n A.fenceCollections=(A.fenceCollections||[]).map(r=>JSON.parse(fencePaperCanonical898(r))); B.fenceCollections=(B.fenceCollections||[]).map(r=>JSON.parse(fencePaperCanonical898(r)));\n union('fenceCollections', 'dockets');")
    replace(' service_notes: S.serviceNotes || [],',' service_notes: S.serviceNotes || [],\n fence_collections: S.fenceCollections || [],')
    replace("['variances', 'fenceDockets', 'breakdowns', 'costs'].forEach", "['variances', 'fenceDockets', 'fenceCollections', 'breakdowns', 'costs'].forEach")
    replace("if (k === 'fenceDockets' && !day(x.date)) bad.push('docket ' + x.id + ' has a date that is not a day');", """if (k === 'fenceDockets' && !day(x.date)) bad.push('docket ' + x.id + ' has a date that is not a day');
 if (k === 'fenceDockets' && x.components_only === true && !fenceComponentsOnly898(x)) bad.push('components-only docket ' + x.id + ' is invalid');
 if (k === 'fenceCollections') collectionProblems898(x).forEach(reason => bad.push('collection ' + x.id + ': ' + reason));""")
    replace(" serviceNotes: {kind: 'list', id: n => n.id, get: () => S.serviceNotes, set: v => S.serviceNotes = v},", " serviceNotes: {kind: 'list', id: n => n.id, get: () => S.serviceNotes, set: v => S.serviceNotes = v},\n fenceCollections: {kind: 'list', id: c => c.id, get: () => S.fenceCollections, set: v => S.fenceCollections = v},")
    replace("dockets: (S.fenceDockets || []).length,", "dockets: (S.fenceDockets || []).length + (S.serviceNotes || []).length + (S.fenceCollections || []).length,")
    replace("dockets: (theirs.fenceDockets || []).length,", "dockets: (theirs.fenceDockets || []).length + (theirs.serviceNotes || []).length + (theirs.fenceCollections || []).length,")
    replace('data-paper="green"${dis}>Service note (green book)</button></div>', 'data-paper="green"${dis}>Service note (green book)</button><button type="button" class="chip invdisc${PAPER.open === \'blue\' ? \' on\' : \'\'}" data-paper="blue"${dis}>Collection form (blue book)</button></div>')
    replace(' <label>Components on the paper</label>', ' <label class="f"><span><input type="checkbox" id="haComponentsOnly"${dis}> Components only — no charge quantity confirmed</span></label>\n <label>Components on the paper</label>')
    replace(' return `<div class="card papercard nosfold" id="paperCard">${head}${btns}${body}</div>`;', ' if (PAPER.open === \'blue\') body = collectionForm898(dis, td);\n return `<div class="card papercard nosfold" id="paperCard">${head}${btns}${body}</div>`;')
    replace('function paperBind(pane){', 'function paperBind(pane){\n bindCollection898(pane);')
    replace("components: parts, signed_by: v('haSigned')", "components: parts, components_only: !!pane.querySelector('#haComponentsOnly')?.checked, signed_by: v('haSigned')")
    replace('<td>${docketAttachBtn(c)}</td>', '<td>${c._where === \'local\' ? `<button class="btn ghost editonly" data-cndel="${esc(c.id)}">Set aside</button>` : \'\'}${docketAttachBtn(c)}</td>')
    replace("${esc(money(d.cost_total) || '')}</b>${d.cost_state === 'partly priced'", "${d.components_only ? '—' : esc(money(d.cost_total) || '')}</b>${d.components_only ? '<br><span class=\"chip\">Quantity unconfirmed</span>' : ''}${d.cost_state === 'partly priced'")
    replace(" (S.fenceDockets || []).forEach(d => push(at(d.at || d.date), 'docket', null,", " (S.fenceCollections || []).forEach(c => push(at(c.at || c.date), 'docket', null, 'Collection ' + c.collection_no + ' — ' + c.location, c.recorded_by));\n (S.fenceDockets || []).forEach(d => push(at(d.at || d.date), 'docket', null,")
    replace("const title=book==='green'?'Service note':book==='blue'?'Collection':'Hire agreement';", "const title=d.record_type==='service-work'?'Work recorded from service note':book==='green'?'Service note':book==='blue'?'Collection':'Hire agreement';")
    replace("${quantities||'<span>Work described in the source record</span>'}", "${quantities||(d.components_only?'<span>'+esc(collectWords(d.components))+' · charge quantity unconfirmed</span>':'<span>Work described in the source record</span>')}")
    replace("function docketPapersByName(d){", "function docketPapersByName(d){\n const service898=servicePaperForWork898(d); if(service898)return docketPapersByName(service898);")
    replace("  W.docketPapersByName = function (d) {", "  W.docketPapersByName = function (d) {\n   if(d && d.record_type==='service-work')return raw(d);")
    replace(" const d = (allDockets() || []).find(x => x.id === docketId) || serviceNoteRows().find(x => x.id === docketId) || collectionRows().find(x => x.id === docketId);", " const d = (allDockets() || []).find(x => x.id === docketId) || serviceNoteRows().find(x => x.id === docketId) || collectionRows().find(x => x.id === docketId);\n const service898=servicePaperForWork898(d); if(service898)return docketPaperAdd(service898.id,file);")
    replace(" const all = S.docketPapers || {};", " const all = S.docketPapers || {};\n const work898=[...(S.fenceDockets||[]),...(FCOM.dockets||[])].find(d=>d.id===id),service898=servicePaperForWork898(work898);\n if(service898)return docketPapersOf(service898.id);")
    replace("if (k === 'fenceCollections') collectionProblems898(x).forEach(reason => bad.push('collection ' + x.id + ': ' + reason));", "if (k === 'fenceCollections') collectionProblems898(x).forEach(reason => bad.push('collection ' + x.id + ': ' + reason));\n if (k === 'fenceDockets') serviceWorkProblems898(x, rec).forEach(reason => bad.push('docket ' + x.id + ': ' + reason));")
    replace("$('#exportBtn').onclick = () => {", "$('#exportBtn').onclick = () => {\n if (SYNC.backend && (!SYNC.first || !SYNC.first.has('fenceCollections'))) return flash('Wait for the shared collection records before exporting.');")
    replace("return !!s && bookNumbers().map(x => String(x || '').trim()).includes(s);", "return !!s && (bookNumbers().map(x => String(x || '').trim()).includes(s) || Object.values(S.aside||{}).some(e=>e&&e.rec&&String(e.rec.docket_no||e.rec.note_no||e.rec.collection_no||'').trim()===s));")
    replace("function costDocket(d){", "function costDocket(d){\n const sourceProblems898=serviceWorkProblems898(d); if(sourceProblems898.length)return {lines:[],cost_total:null,paid_total:null,unpriced:['source review'],paid_unpriced:['source review'],cost_state:'source review required',paid_state:'source review required',margin:null,source_problems:sourceProblems898};")
    replace("return com.concat(loc).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id).localeCompare(String(b.id)));", "return com.concat(loc).map(d=>{const bad=serviceWorkProblems898(d);return bad.length?Object.assign({},d,{usable:false,problems:[...(d.problems||[]),...bad]}):d;}).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || String(a.id).localeCompare(String(b.id)));")
    replace(" const vals = Object.entries(q).map(([k, v]) => [k, docketQuantity(v)]);", " const vals = Object.entries(q).map(([k, v]) => [k, docketQuantity(v)]);\n bad.push(...serviceWorkProblems898(d));")
    replace("${d.to_be_charged?'Quantity needed':d.not_charged_here?'Not charged here':'No priced quantities'}", "${d.cost_state==='source review required'?'Source review required':d.to_be_charged?'Quantity needed':d.not_charged_here?'Not charged here':'No priced quantities'}")
    replace('Signed by (Advanced)','Site sign-off by',2)
    return s

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('base',type=Path);ap.add_argument('output',type=Path,nargs='?');a=ap.parse_args()
    (a.output or a.base).write_text(patch(a.base.read_text()))
    print('Native collection and components-only capture patch prepared; no operational rows changed.')
