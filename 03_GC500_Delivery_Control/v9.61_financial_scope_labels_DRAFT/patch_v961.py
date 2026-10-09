# Author: Andrew Fisher
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1])
raw = p.read_bytes()
s = raw.decode('utf-8-sig')
assert 'function supplierScope961(' not in s, 'v9.61 is already applied'
assert " · v9.60'; /* v8.19" in s and 'root.Inventory960={allocation,reconcileInventory,managed};' in s, 'Requires v9.60 base'
s = rep(s, 'const STREAM_OF_KIND = ', (HERE / 'scope961.js').read_text() + '\nconst STREAM_OF_KIND = ', 'supplier scope caption helper', str(p))
s = rep(s, "who: 'our own fleet (KINP)'", "who: 'KINP contract equipment — ownership is identified per line'", 'neutral building ownership', str(p))
s = rep(s, "who: 'our own fleet (STPS)'", "who: 'STPS contract equipment — ownership is identified per line'", 'neutral traffic ownership', str(p))
s = rep(s, "if (C.subhire.lines)miss(`the rehire cost of the ${C.subhire.lines} sub-hired line${C.subhire.lines === 1 ? '' : 's'} on the contracts — not on the record`, 'rehire cost of the sub-hired lines not on the record');", "if (C.subhire.lines)miss(supplierScopeWords961(), 'supplier costs: recorded amounts and forecast coverage are separate');", 'supplier cost gap scope', str(p))
s = rep(s, "if (s.subhired)s.notes.push(`${pl(s.subhired, 'sub-hired line')} — ${s.subhired === 1 ? 'its' : 'their'} rehire cost is not on the record`);", "if (s.subhired)s.notes.push(supplierScopeWords961(ONHIRE_ROWS.filter(r=>(r.charge_line&&!r.subhired?'transport':(STREAM_OF_KIND[r.kind]||'other_hire'))===s.key)));", 'stream supplier scope', str(p))
s = rep(s, "if (X.C.subhire.lines)put('rehire', null, `${X.C.subhire.lines} sub-hired contract line${X.C.subhire.lines === 1 ? '' : 's'} — their rehire cost is not on the record, and nor is the supplier cost of the plant the project manager marked hired in (every missing cost is counted on the Rehire by branch card)`);", "if (X.C.subhire.lines)put('rehire', null, supplierScopeWords961()+' Other equipment marked hired in is reviewed separately on Rehire by branch.');", 'cost category supplier scope', str(p))
s = rep(s, "if (b.subLines) parts.push(fmtNum(b.subLines) + ' SUB line' + (b.subLines === 1 ? '' : 's') + ' the rental system books as sub-hired, from ' + (b.suppliers.join(', ') || 'a supplier not named') + ' · Rehire Revenue ' + money0(b.rehire) + ' · the Rehire cost is not on the record.');", "if (b.subLines) parts.push(supplierScopeWords961(ONHIRE_ROWS.filter(r=>r.branch_code===b.code))+' Rehire Revenue '+money0(b.rehire)+'.');", 'branch supplier scope', str(p))
s = rep(s, "if (b.subLines) out.push(`<span class=\"w\"><b>${esc(one(b.subLines, 'SUB line'))}</b> the rental system books · Rehire Revenue ${esc(money0(b.rehire))} · ${esc(b.suppliers.join(', ') || 'supplier not named')} · Rehire cost not on the record</span>`);", "if (b.subLines) out.push(`<span class=\"w\">${esc(supplierScopeWords961(ONHIRE_ROWS.filter(r=>r.branch_code===b.code)))} · Rehire Revenue ${esc(money0(b.rehire))} · ${esc(b.suppliers.join(', ') || 'supplier not named')}</span>`);", 'visible branch supplier scope', str(p))
s = rep(s, "${k.subhire_lines ?ln('Rehire cost — sub-hired contract lines', '<span class=\"todo\">not on the record</span>',`for the ${pl(k.subhire_lines, 'sub-hired contract line')}`, 'faint') : ''}", "${k.subhire_lines ?ln('Rehire cost — SUB contract lines', '<span class=\"todo\">recorded and forecast scope</span>',supplierScopeWords961(), 'faint') : ''}", 'legacy ledger supplier scope', str(p))
s = rep(s, 'REHIRE BY BRANCH · AUD EX GST · FORECAST', 'REHIRE BY REVENUE BRANCH · AUD EX GST · FORECAST', 'Rehire comparison heading', str(p))
s = rep(s, 'What is sub-hired, what it brings in, and what it costs — by branch, to job end', 'Rehire Revenue and related supplier costs — by Revenue branch, to job end', 'Rehire comparison title', str(p))
s = rep(s, 'By branch, to job end: ${R.byBranch.map', 'By Revenue branch, with related supplier costs to job end: ${R.byBranch.map', 'Rehire comparison grouping', str(p))
s = rep(s, '<h3>Rehire by branch</h3><p>What we charge the V8s at our rates against what we pay the supplier, each on the record and to job end.</p>', '<h3>Rehire by Revenue branch</h3><p>This recovery comparison groups supplier costs with their related Revenue branch. Finance allocates Direct costs to the documented cost branch; differences are identified in the rows below.</p>', 'Rehire versus Finance scope', str(p))
s = rep(s, '<table class="acc761-tbl rh766-tbl"><thead><tr><th>Branch</th>', '<table class="acc761-tbl rh766-tbl"><thead><tr><th>Revenue branch</th>', 'Rehire branch column', str(p))
s = rep(s, '${g.costEvidence949?`<br><span class="acc761-w source949-cost">${esc(Source949.words(g.costEvidence949))}</span>`:""}', '${supplierBranchWords961(g)?`<br><span class="acc761-w" data-rehire-branch961>${esc(supplierBranchWords961(g))}</span>`:""}${g.costEvidence949?`<br><span class="acc761-w source949-cost">${esc(Source949.words(g.costEvidence949))}</span>`:""}', 'documented supplier cost branches', str(p))
s = rep(s, " · v9.60'; /* v8.19", " · v9.61'; /* v8.19", 'footer', str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + s.encode())
