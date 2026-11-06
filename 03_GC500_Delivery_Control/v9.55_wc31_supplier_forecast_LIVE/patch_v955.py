"""Author: Andrew Fisher. Exact v9.54 → v9.55 supplier estimate and supported Revenue classification."""
import sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
sys.path.insert(0,str(BASE.parent/'toolchain'))
from rep import rep

def patch(text,path='<candidate>'):
    if 'const Supplier955 = ' in text: raise ValueError('v9.55 already applied')
    if " · v9.54'; /* v8.19" not in text or 'function cw1Plan954(' not in text or 'function transport953SupplierGap(' not in text:
        raise ValueError('Expected reviewed live v9.54 source')
    def edit(old,new,why):
        nonlocal text
        text=rep(text,old,new,why,path)
    edit('function transport953SupplierGap(gap){',(BASE/'supplier955.js').read_text()+'\nfunction transport953SupplierGap(gap){','bounded same-item supplier helper')
    edit('function finance928ContractOwner(row){','function finance928ContractOwner(row){\n const linked955=Supplier955.ownerForRow(row);if(linked955)return linked955;','exact WC31 contract ownership from current physical units')
    edit('${contractMoneyWords(r)}${Source949.html(r)}`;','${contractMoneyWords(r)}${Source949.html(r)}${Supplier955.ownerHtml(r)}`;','retain original contract fields and show current ownership evidence')
    edit("${Source949.html(r)}${String(r.rental_contract)==='9987005'", "${Source949.html(r)}${Supplier955.ownerHtml(r)}${String(r.rental_contract)==='9987005'", 'contract table shows exact ownership evidence')
    start=text.index('function transport953SupplierGap(gap){')
    end=text.index('\nfunction transport953PlanHtml',start)
    edit(text[start:end],'function transport953SupplierGap(gap){ Supplier955.gap(gap); }','additional hire estimated; supplier transport still unconfirmed')
    edit(" transport953SupplierGap(gap);", " transport953SupplierGap(gap);\n const supplier955=Supplier955.model();\n if(supplier955.additional||supplier955.held)push('Rehire — WC31 additional Event Portables hire estimate',supplier955.branch,0,supplier955.estimate,Supplier955.words(supplier955),'Provisional same-item cost; additional transport is not priced.');",'new cost allowance only in still-to-come forecast')
    edit("notes:['Coates is the default owner; named supplier allocations remain Rehire.'],missing:RH.cost==null?['the Rehire cost']:[]", "notes:['Coates is the default owner; named supplier allocations remain Rehire.',Supplier955.ownerWords(),Supplier955.words()].filter(Boolean),costToCome:Supplier955.model().estimate,missing:RH.cost==null?['the Rehire cost']:[]", 'Rehire group carries additional cost forecast and classification evidence once')
    edit("costState:RH.cost==null?'not on the record':RH.approved?'approved — the final total may change':'quoted, unsigned'", "costState:RH.cost==null?'not on the record':RH.approved?(Supplier955.model().estimate?'approved quotes + provisional estimate':'approved — the final total may change'):'quoted, unsigned'", 'job-end cost caption does not label the forecast variation as approved')
    edit('fenceGear + n(F.cost) + Source949.model().reduce((sum,f)=>sum+f.estimate,0)),','fenceGear + n(F.cost) + Source949.model().reduce((sum,f)=>sum+f.estimate,0) + Supplier955.model().estimate),','P&L job-end Rehire includes extra block once')
    edit("missing: 'Job-end Rehire includes calculated supplier estimates from the linked contract quantity and charge basis; these are not invoices. Other unpriced hired-in equipment remains unconfirmed.'", "missing: 'Job-end Rehire includes calculated supplier estimates from the linked contract quantity and charge basis; these are not invoices. '+Supplier955.words()+' Other unpriced hired-in equipment remains unconfirmed.'", 'P&L separates estimate from approved quoted cost')
    anchor="Source949.model().forEach(f=>{const amount=Source949.month(f,month);"
    edit(anchor,"{const f=Supplier955.model(),amount=Supplier955.month(f,month);if(amount>0)addCost('Rehire — additional supplier hire estimate',f.branch,amount,Supplier955.words(f),{id:f.id,status:'forecast',forecastAmount:amount,source:'Q6845 page 1 same-item estimate',supplier:f.supplier,ref:f.ref,quote:'Q6845',invoiceStatus:'unverified',paymentStatus:'unknown',provisionalAllocation:true});}\n"+anchor,'event-month forecast only; no earned/accrual/journal posting')
    edit("${X.rows.filter(r => r.inPl).map(r => `<tr><td><b>","${X.rows.filter(r => r.inPl).map(r => `<tr${r.stream==='Rehire — WC31 additional Event Portables hire estimate'?' data-supplier955=\"forecast\"':''}><td><b>",'native forecast evidence selector')
    edit('The current Q6845 quote covers one 16-pan block. Coverage for the second block remains to confirm.','The original Q6845 quote covers one 16-pan block. The additional identified block has a same-item cost estimate in Costs; the variation and any extra transport remain to confirm.','unit note distinguishes estimate from approved coverage')
    edit(" · v9.54'; /* v8.19"," · v9.55'; /* v8.19",'release footer')
    return text

if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: patch_v955.py candidate.html (requires live v9.54)')
    p=Path(sys.argv[1]);raw=p.read_bytes()
    p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+patch(raw.decode('utf-8-sig'),str(p)).encode())
