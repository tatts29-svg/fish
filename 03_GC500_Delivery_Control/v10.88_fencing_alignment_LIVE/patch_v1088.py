"""Author: Andrew Fisher. Source-backed supplier materials and evidence links."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "toolchain"))
from rep import rep

BASE_SHA256 = "e073add8b16cdb735929b66ede2cdb45b69b7a0a31aef1208ab60f5e3c3e35f2"


def patch(text):
    if "function supplierLink1088(" in text:
        raise ValueError("v10.88 is already applied")
    if hashlib.sha256(text.encode("utf-8")).hexdigest() != BASE_SHA256:
        raise ValueError("v10.88 requires the exact reviewed live v10.87 page")
    old = (HERE.parent / "v10.14_purchase_order_values_LIVE/pricing1014/supplier_core1014.js").read_text()
    new = (HERE / "core/supplier_core1088.js").read_text()
    text = rep(text, old, new, "supplier core", "page")
    text = rep(text,
        "const FENCE_GEAR_COLS = ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc', 'flat_feet'];",
        "const FENCE_GEAR_COLS = ['clean', 'scrim', 'v_gates', 'ped_gates', 'ccb_event', 'ccb_demarc', 'flat_feet', 'bases', 'misc'];",
        "supplier gear categories", "page")
    text = rep(text,
        "supplierExtras1014().forEach(l=>{lab+=l.paid;const x=labCols.get(l.name)||{qty:0,unit:l.unit};x.qty+=l.qty;labCols.set(l.name,x);});",
        "supplierExtras1014().forEach(l=>{if(FENCE_GEAR_COLS.includes(l.column)){gear+=l.paid;}else if(FENCE_LABOUR_COLS.includes(l.column)){lab+=l.paid;const x=labCols.get(l.name)||{qty:0,unit:l.unit};x.qty+=l.qty;labCols.set(l.name,x);}else{other+=l.paid;otherCols.add(l.name);}});",
        "supplier extras accounting category", "page")
    text = rep(text,
        "supplierExtras1014().forEach(x=>{const date=acc762Date(x.date),amount=acc762Money(x.paid);if(inM(date))addCost('Installation — external contractors, approved team leaders',x.branch,amount,'Dated supplier programme · team-leader day rate · cost only, not proof of payment',{id:x.id,po:x.po,date,status:acc762Status(date,month,asAt),forecastAmount:date>asAt?amount:0});});",
        "supplierExtras1014().forEach(x=>{const date=acc762Date(x.date),amount=acc762Money(x.paid),gear=FENCE_GEAR_COLS.includes(x.column);if(inM(date))addCost(gear?'Rehire — fencing supplier materials':'Installation — external contractors, approved team leaders',x.branch,amount,gear?'Source-backed supplier materials · cost only, not proof of payment':'Dated supplier programme · team-leader day rate · cost only, not proof of payment',{id:x.id,po:x.po,date,status:acc762Status(date,month,asAt),forecastAmount:date>asAt?amount:0});});",
        "supplier materials accrual category", "page")
    runtime = (HERE / "fencing1088_src.js").read_text()
    text = rep(text, "\n</body>\n</html>\n", "\n<script>\n"+runtime+"\n</script>\n</body>\n</html>\n", "supplier evidence projection", "page")
    return rep(text, "+ ' · v10.87'; /* v8.19 release922", "+ ' · v10.88'; /* v8.19 release922", "release footer", "page")


if __name__ == "__main__":
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text()))
