"""Author: Andrew Fisher. Shared supplier receipts, capacity and day records."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(text):
    if 'function receiptParts1006(' in text: raise ValueError('Receipt patch already applied')
    text=rep(text,'function project(context){',(HERE/'receipts1006.js').read_text()+'\nfunction project(context){','Receipt projection helpers','v10.06')
    text=rep(text,'const remaining=plannedRemaining1000(rows,context.asAt);','for(const row of rows){row.receiptDateIssue1006=receiptDateIssue1006(row,context.asAt);row.receipts1006=receiptParts1006(row,context.asAt); }\n const receipts=rows.flatMap(r=>r.receipts1006);\nconst remaining=plannedRemaining1000(rows,context.asAt);','Retain actual receipts alongside remaining plan','v10.06')
    text=rep(text,'confirmation:context.confirmation||null,rows,remaining,inventory,summary,conflicts','confirmation:context.confirmation||null,rows,remaining,receipts,inventory,summary,conflicts','Expose shared receipts','v10.06')
    text=rep(text,"conflicts,issues:context.issues||[],unmatched:","conflicts,issues:(context.issues||[]).concat(rows.filter(r=>r.receiptDateIssue1006).map(r=>({ref:r.ref,item:r.item,reason:r.receiptDateIssue1006}))),unmatched:",'Expose unresolved partial receipt dates without inventing history','v10.06')
    text=rep(text,'const reserved={},pending=[];','const reserved=receivedCapacity1006(rows),pending=[];','Reserve real receipt day capacity','v10.06')
    text=rep(text,'reserved[part.date]=(reserved[part.date]||0)+taken;','// Fulfilled quantities occupy their actual receipt day, never a future planned slot.','Remove future phantom reservations','v10.06')
    text=rep(text,'const free=24-(used.get(day)||0);','const free=Math.max(0,24-(used.get(day)||0));','Handle already-exceeded actual capacity without negative allocation','v10.06')
    text=rep(text,"const typed=model.rows.filter(u=>u.physical&&same(u.item,item)),ep=typed.filter", "const typed=supplierUnits1006(model.rows.filter(u=>u.physical&&same(u.item,item)),{ref:a.key,wholeEventPortables:whole}),ep=typed.filter",'Alias numbers do not create mixed supplier quantities','v10.06')
    text=rep(text,"rows.push({ref:a.key,item,name:a.name||'',quantity:receipt.quantity", "rows.push({ref:a.key,item,name:a.name||'',receiptEvidence1006:receiptEvidence1006(a,item,d),quantity:receipt.quantity",'Capture receipt evidence independently of install dates','v10.06')
    text=rep(text,'const api={destination1002,dailyPlan1000,', 'const api={supplierUnits1006,receiptDateIssue1006,receiptParts1006,receivedCapacity1006,destination1002,dailyPlan1000,','Expose pure receipt helpers for checks','v10.06')
    start=text.index('/* Author: Andrew Fisher. Proposed physical supplier loads, driven by the same item remainder as Sub-hired. */')
    end=text.index('/* Source-row requests stay read-only until a native reference is linked. */',start)
    text=rep(text,text[start:end],(HERE/'daily1006.js').read_text()+'\n','Actual receipts stay on Build and Today','v10.06')
    old_portrait=(HERE.parent/'v10.01_qr_daily_routes_LIVE/portrait1001.js').read_text().strip()
    text=rep(text,old_portrait,(HERE/'portrait1006.js').read_text().strip(),'Daily supplier PDF retains recorded receipts','v10.06')
    text=rep(text,"const M=S996.model(),groups=[...new Set(M.remaining.map(r=>r.date))],D=S996.demobLoads();", "const M=S996.model(),groups=[...new Set(M.remaining.map(r=>r.date).concat(M.receipts.some(r=>r.date===M.asAt)?[M.asAt]:[]))].sort(),D=S996.demobLoads();",'Current supplier day remains visible after completion','v10.06')
    text=rep(text,"<summary>Remaining deliveries · '+M.summary.remaining+' items · maximum 24 portaloos per day</summary>","<summary>Daily deliveries · '+M.summary.remaining+' remaining</summary>",'Day sheets distinguish receipt from remainder','v10.06')
    text=rep(text,"' · '+M.remaining.filter(r=>r.date===day).reduce((n,r)=>n+r.remaining,0)+' remaining</summary>'", "' · '+M.receipts.filter(r=>r.date===day).reduce((n,r)=>n+r.count,0)+' received · '+M.remaining.filter(r=>r.date===day).reduce((n,r)=>n+r.remaining,0)+' remaining</summary>'",'Supplier day shows completed deliveries','v10.06')
    text=rep(text,"'+S996.inboundLoads(day).map(loadHtml).join('')", "'+M.receipts.filter(r=>r.date===day).map(r=>'<div class=\"supplier996-stop\"><b>'+esc(S996.displayRef(r))+' · '+r.count+' × '+esc(r.item)+' · Received</b><span>'+esc(r.location)+'</span></div>').join('')+S996.inboundLoads(day).map(loadHtml).join('')",'Completed supplier stops remain beside pending stops','v10.06')
    return text
if __name__=='__main__':
    path=Path(sys.argv[1]);path.write_text(apply(path.read_text()))
