# Author: Andrew Fisher
import os,sys,hashlib
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep as strict_rep
def rep(s,old,new): return strict_rep(s,old,new,"Monthly branch",sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text()
if 'monthly-branch982' in s: raise SystemExit('v9.82 already applied')
if hashlib.sha256(p.read_bytes()).hexdigest()!='824192c81c4c719590d82bd5497cb8c6e5e0f93590d61035ce642e7490919b34': raise SystemExit('Wrong live base')
s=rep(s,"['Shift ID', 'Person', 'Type', 'Work date', 'Review state'","['Shift ID', 'Person', 'Home branch', 'Allocation branch', 'Type', 'Work date', 'Review state'")
s=rep(s,"[r.id, r.person, FIN745_WORDS[r.type] || r.type, r.date,","[r.id, r.person, personBranch868(r.person), 'KINP', FIN745_WORDS[r.type] || r.type, r.date,")
s=rep(s,'<th>Person / type</th><th>Confirmed worked</th>','<th>Person / type</th><th>Home branch</th><th>Confirmed worked</th>')
s=rep(s,"${esc(FIN745_WORDS[p.type] || 'Type not recorded')}</small></th><td>${esc(fin745Hours(p.confirmed))}","${esc(FIN745_WORDS[p.type] || 'Type not recorded')}</small></th><td data-monthly-branch982>${esc(personBranch868(p.name) || '—')}</td><td>${esc(fin745Hours(p.confirmed))}")
s=rep(s,'<td colspan="7">No usable labour shifts recorded for this month.','<td colspan="8">No usable labour shifts recorded for this month.')
s=rep(s,"S.purchaseOrders = S.purchaseOrders || {};\n const now = new Date().toISOString();\n const cur = S.purchaseOrders[n]", "const check982 = poReceiptIssue982(Object.assign({}, poOf(n) || {}, patch)); if (check982) { flash(check982); return false; }\n S.purchaseOrders = S.purchaseOrders || {};\n const now = new Date().toISOString();\n const cur = S.purchaseOrders[n]")
s=rep(s,"function fh866Receipt(o){\n const amt = Number(o.amount)", "function poReceiptIssue982(o){\n const amount=o.amount==null||o.amount===''?null:Number(o.amount);\n if(amount!=null&&(!Number.isFinite(amount)||amount<0))return 'PO amount must be zero or greater.';\n if(o.receipted==='part'){const value=o.receipted_amount==null||o.receipted_amount===''?null:Number(o.receipted_amount);if(value==null||!Number.isFinite(value)||value<0)return 'Enter a valid partial receipt amount.';if(amount!=null&&value>amount)return 'Partial receipt cannot exceed the PO amount.';}\n return null;\n}\nfunction fh866Receipt(o){\n const issue982=poReceiptIssue982(o);if(issue982)return {key:'unknown',words:'Receipt needs review',amount:null,issue:issue982};\n const amt = Number(o.amount)")
s=rep(s,"+ ' · v9.81'", "+ ' · v9.82'")
p.write_text(s)
