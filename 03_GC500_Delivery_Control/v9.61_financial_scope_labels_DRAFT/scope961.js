// Author: Andrew Fisher. Descriptions of existing supplier-cost models only.
function supplierScope961(rows=ONHIRE_ROWS) {
 const subs=rows.filter(r=>r.subhired), forecasts=Source949.model(), costs=ourCosts();
 const out={lines:subs.length,missingActual:0,forecast:0,missingRate:0,held:0,unavailable:0};
 for(const row of subs){
  const evidence=Source949.evidence(row);
  // Reuse the native supplier/contract/line matcher. A linked cost is not a
  // statement that the supplier's whole charge period has been reconciled.
  const identity=evidence||{supplierCode:row.supplier_sub_rental,supplierName:row.supplier_sub_rental};
  if(!costs.some(cost=>Source949.matches(cost,row,identity)))out.missingActual++;
  if(!evidence){out.missingRate++;continue;}
  const matches=forecasts.filter(f=>f.contract===String(row.rental_contract)&&f.line===Number(row.line)&&f.supplierCode===row.supplier_sub_rental);
  if(matches.length!==1){out.unavailable++;continue;}
  const f=matches[0];
  if(f.held)out.held++;
  else if(f.estimate>0)out.forecast++;
 }
 return out;
}
function supplierScopeWords961(rows=ONHIRE_ROWS) {
 const c=supplierScope961(rows);if(!c.lines)return '';
 const words=[`${c.missingActual} without a linked recorded supplier cost`];
 if(c.forecast)words.push(`${c.forecast} with a calculated supplier-rate forecast in Costs to job end`);
 if(c.missingRate)words.push(`${c.missingRate} without a linked supplier rate`);
 if(c.held)words.push(`${c.held} forecast${c.held===1?'':'s'} held for supplier-period reconciliation`);
 if(c.unavailable)words.push(`${c.unavailable} linked supplier rate${c.unavailable===1?'':'s'} without a current forecast calculation`);
 return `${c.lines} SUB contract line${c.lines===1?'':'s'}: ${words.join('; ')}. Recorded costs and forecast allowances are separate; a linked cost does not confirm full-period coverage.`;
}
function supplierBranchWords961(group) {
 const f=group.costEvidence949;
 if(!f||!group.branch||!f.costBranch||group.branch===f.costBranch)return '';
 return `Revenue branch ${group.branch} · Direct cost branch ${f.costBranch}. Finance allocates this supplier cost to ${f.costBranch}.`;
}
