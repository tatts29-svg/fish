"""Author: Andrew Fisher. Keep priced contract work separate from allocation review."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep


HELPER = """ function contractWork1225(i){
  const c=i.bulkCoverage,items=c&&Array.isArray(c.items)?c.items:[];
  if(norm(i.item)!=='tl2'||norm(i.discipline)!=='water-filled barriers'||!c||c.covered!==true||c.scope!=='water-filled-barriers'||c.category!=='installation'||!items.length)return null;
  const valid=x=>x&&typeof x.contract==='string'&&x.contract.trim()&&Number.isSafeInteger(x.line)&&x.line>0&&x.category==='installation'&&x.source?.scope==='water-filled-barriers'&&typeof x.amount==='number'&&Number.isFinite(x.amount)&&x.amount>=0;
  if(!items.every(valid)||new Set(items.map(x=>x.contract+'|'+x.line)).size!==items.length)return null;
  const positive=items.some(x=>x.amount>0),source=items.map(x=>'Contract '+x.contract+' line '+x.line).join('; ');
  const why=source+(positive?' includes the combined installation / removal charge in Revenue.':' records a zero combined installation / removal charge.')+' Confirm allocation to this reference and physical work separately. No per-reference amount has been assigned; do not add another charge.';
  return {ref:i.ref,item:i.item,branch:i.branch||'no branch',quantity:i.received,key:'work_scope1007',name:positive?'Contract work included · allocation review':'Contract work recorded at zero · scope review',state:'contract_scope',rate:null,value:null,why,source};
 }
"""

OLD_RETURN = " return Finance1007.workGap({ref:a.key,item:l.item,received,ownUse,branch:branchOf(a.key).code,card:cardRate(l.discipline,l.item,a.key)});"
NEW_RETURN = """ let bulkCoverage=null;
 if(a.discipline==='Water-filled barriers'&&l.item==='TL2'&&typeof contractBulkCoverage1224==='function'){
  try{bulkCoverage=contractBulkCoverage1224('water-filled-barriers','installation');}catch(e){/* Unavailable source evidence remains a pricing review. */}
 }
 return Finance1007.workGap({ref:a.key,item:l.item,discipline:a.discipline,received,ownUse,branch:branchOf(a.key).code,card:cardRate(l.discipline,l.item,a.key),bulkCoverage});"""

CHANGES = (
    (' function workGap(input){', HELPER + ' function workGap(input){', 'Classify existing combined contract work'),
    ("  if(supplied||/\\bincluded\\b/i.test(work.state||''))return null;",
     "  if(supplied||/\\bincluded\\b/i.test(work.state||''))return null;\n  const covered=contractWork1225(i);if(covered)return covered;",
     'Keep card-priced work precedence'),
    (OLD_RETURN, NEW_RETURN, 'Read current source charge coverage for barrier work'),
    (' workPricing1007().forEach(r=>miss(r.ref+" · "+r.item+": "+r.why,r.ref+" work scope / rate to confirm"));',
     ' const workReview1225=workPricing1007();\n workReview1225.filter(r=>r.state!==\'contract_scope\').forEach(r=>miss(r.ref+" · "+r.item+": "+r.why,r.ref+" work scope / rate to confirm"));',
     'Keep only unpriced work in missing charges'),
    (' const caveats_short = [];',
     ' const caveats_short = [];\n workReview1225.filter(r=>r.state===\'contract_scope\').forEach(r=>{caveats.push(r.ref+" · "+r.item+": "+r.why);caveats_short.push(r.ref+" contract work · scope review");});',
     'Retain contract allocation and physical-work advisories'),
    ("(gap?'Work scope / rate to confirm<details><summary>More info</summary><p>'+esc(gap.why)",
     "(gap?esc(gap.name)+'<details><summary>More info</summary><p>'+esc(gap.why)",
     'Use the shared work classification in the drawer'),
    ("for(const h of array(m.workPricing))if(h.state==='unpriced')include({ref:h.ref,item:h.item,charge:h.name,reason:h.why});",
     "for(const h of array(m.workPricing))if(h.state==='unpriced'||h.state==='contract_scope')include({ref:h.ref,item:h.item,charge:h.name,reason:h.why});",
     'Keep covered work allocation in charge review'),
)


def apply(text):
    if 'function contractWork1225(' in text:
        raise SystemExit('v12.25 contract work advisory is already present')
    if 'function contractBulkCoverage1224(' not in text:
        raise SystemExit('v12.25 advisory requires the existing shared contract coverage reader')
    for before, after, label in CHANGES:
        text = rep(text, before, after, label, 'GC500 page')
    return text
