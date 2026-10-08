#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded transport/ownership finance attribution."""
from pathlib import Path
import sys
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8-sig');bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'function finance928Owner(' in s:raise SystemExit('Already applied')
if 'units925-script' not in s:raise SystemExit('Requires reviewed unit identity module')
s=rep(s," · v9.27'; /* v8.19"," · v9.28'; /* v8.19",'release footer',p)
s=rep(s,"function transport888Build(){",(here/'finance928.js').read_text()+"\nfunction transport888Build(){",'pure attribution helpers',p)
old="""  const cc = cardOf(a), mine = rows.filter(r => r.src === 'asset' && r.a === a && nf.includes(r.e));
  if (cc) { cardCost += cc; cardRefs++; loadsNoFig += nf.length; mine.forEach((r, i) => { r.forecast = {kind: 'card', raw: i === 0 ? cc : 0, amount: i === 0 ? cents(cc) : 0, ref: cents(cc), loads: nf.length}; }); }
  else { loadsNoFigNoCard += nf.length; mine.forEach(r => { r.forecast = {kind: 'average'}; }); } });"""
new="""  const mine = rows.filter(r => r.src === 'asset' && r.a === a && nf.includes(r.e)), lines=assetTotal(a).lines||[];
  let known=false;loadsNoFig+=nf.length;
  const demands=finance928LoadDemands(mine,lines);
  mine.forEach((r,i)=>{const demand=demands[i];if(demand.known){known=true;cardCost+=demand.amount;r.forecast={kind:'card',raw:demand.amount,amount:cents(demand.amount),ref:cents(demand.amount),loads:1,scope928:'load',reason928:demand.reason};}else r.forecast={kind:'held',raw:0,amount:0,reason928:demand.reason};});
  if(known)cardRefs++; });"""
s=rep(s,old,new,'load scoped forecast, unknown held',p)
s=rep(s,"if (r.family === 'toilet' && !r.subhired) { b.rehireLines++;","if (r.family === 'toilet' && !r.subhired && finance928ContractOwner(r).rehire) { b.rehireLines++;",'source ownership classification',p)
old="function pl760ToiletBranch(){ try { const b = pl752Rows().filter(x => x.rehireLines).sort((x, y) => y.rehireLines - x.rehireLines)[0]; return b ? b.code : 'KINP'; } catch (e) { return 'KINP'; } }"
s=rep(s,old,"function pl760ToiletBranch(){ return finance928LegacyToiletBranch(); }",'preserve approved quote cost branch',p)
s=rep(s," if (f.kind === 'average') return", " if(f.kind==='held')return `<span class=\"acc761-w\">Not forecast · ${esc(f.reason928)}</span>`;\n if(f.kind==='card'&&f.scope928==='load')return `<b>${esc(money(f.amount))}</b><br><span class=\"acc761-w\">${esc(f.reason928)}</span>`;\n if (f.kind === 'average') return",'held forecast explanation',p)
# scoped card handling must precede the original generic card display
s=rep(s," if (f.kind === 'card') return f.amount ?", " if (f.kind === 'card' && !f.scope928) return f.amount ?",'avoid reference label on load demand',p)
s=rep(s,"const cn = c => c === '—' ? 'Branch unconfirmed' : c;","const cn = c => c === '—' ? 'Branch unconfirmed' : c;",'stable transport view anchor',p)
# Both branch and forecast views use the same source ownership rule.
start=s.index(" const toil = take(r => r.family === 'toilet'),")
end=s.index(" /* the SUB lines: the item code starts with SUB",start)
old=s[start:end]
new=""" const toil=take(r=>r.family==='toilet'&&finance928ContractOwner(r).rehire), ep=toil.filter(r=>finance928ContractOwner(r).owner==='event-portables');
 const Q=(DATA.rehire_quotes&&DATA.rehire_quotes.quotes)||[];
 push({branch:pl760ToiletBranch(),what:'Toilets — Event Portables',supplier:RH.co,lines:ep.length,units:units(ep),unrated:unrated(ep),rev:r2(sum(ep)+(RH.servicing||0)),cost:RH.cost,costState:RH.cost==null?'not on the record':RH.approved?'approved — the final total may change':'quoted, unsigned',rule:'Only explicitly identified Event Portables contract units are supplier hire; servicing remains separately sourced.',basis:'Contract revenue follows confirmed ownership. Approved quote totals and their existing costing branch are unchanged; quote coverage is not allocated to individual units.',notes:['Unidentified ownership remains outside confirmed supplier revenue.'],missing:RH.cost==null?['the Rehire cost']:[]});
 const toiletSuppliers=new Map();toil.filter(r=>!ep.includes(r)).forEach(r=>{const owner=finance928ContractOwner(r).owner,key=r.branch_code+'|'+owner;const list=toiletSuppliers.get(key)||[];list.push(r);toiletSuppliers.set(key,list);});
 for(const rs of toiletSuppliers.values())push({branch:rs[0].branch_code,what:'Toilets — confirmed supplier',supplier:finance928ContractOwner(rs[0]).owner,lines:rs.length,units:units(rs),unrated:unrated(rs),rev:sum(rs),cost:null,costState:'unit cost allocation unknown',rule:'Explicit current unit ownership',basis:'No supplier quote cost has been allocated to these units.',missing:['matched supplier cost']});
"""
s=rep(s,old,new,'supplier scoped rehire groups',p)
old=" + fmtNum(b.rehireCoatesNos) + ' of the lines carry a Coates plant number; the record does not say which unit is whose. The Rehire Revenue here is already in Hire by the rate.'"
# Replace the entire old supplier assertion, retaining the surrounding conditional.
start=s.index(" if (b.rehireLines) parts.push(")
end=s.index("\n if (b.plantLines)",start)
s=rep(s,s[start:end]," if (b.rehireLines) parts.push(fmtNum(b.rehireLines)+' toilet contract lines have confirmed supplier ownership; revenue stays at our rates. Supplier costs remain at their documented quote scope.');",'accurate branch ownership description',p)
s=rep(s,"const marked = RH && RH.marked ? RH.marked : 0, co = RH && RH.co || 'Event Portables';","const marked = RH && RH.marked ? RH.marked : 0, co = 'confirmed toilet suppliers';",'avoid blanket supplier label',p)
s=rep(s,"The Rehire Revenue here is already in Hire by the rate.","Supplier revenue is classified from confirmed ownership.",'unused legacy prose',p) if 'The Rehire Revenue here is already in Hire by the rate.' in s else s
s=rep(s,"the Event Portables toilet lines, the SUB lines and the sub-hired forklifts", "the confirmed supplier toilet lines, the SUB lines and the sub-hired forklifts",'forecast ownership basis',p)
s=rep(s,"of the toilet lines carry a Coates plant number and are counted as Event Portables rehire, as that card counts them — being checked", "of the confirmed supplier toilet lines also carry a plant number; explicit supplier ownership takes precedence",'remove false blanket EP warning',p)

start=s.index(' out.push(`<span class="w">${RH && RH.servicing ?')
end=s.index("\n }\n if (b.plantLines)",start)
s=rep(s,s[start:end]," out.push('<span class=\"w\">Supplier costs remain at their original quote scope; no unit allocation is inferred here.</span>');",'keep whole quotes out of unit supplier assertions',p)
s=rep(s,"const forecast = {cardCost, cardRefs,", "const forecast = {heldLoads928:rows.filter(r=>r.forecast&&r.forecast.kind==='held').length,cardCost, cardRefs,",'report held demand count',p)
s=rep(s,"the card’s transport cost once a reference for ${n(T.forecast.cardRefs)} references", "the card’s transport cost for each confirmed load item and quantity across ${n(T.forecast.cardRefs)} references",'transport summary scope',p)
s=rep(s," · the Costs to job end figure`)", " · ${n(T.forecast.heldLoads928)} equipment loads remain unpriced or need allocation · the Costs to job end figure`)",'transport incomplete scope',p)
s=rep(s,"To come: the card’s transport cost once a reference where a load has no figure, the average for a load with no reference or card line.","To come: each equipment load’s explicit item and quantity at its existing card transport cost. Missing rates or ambiguous quantities stay unpriced. Unreferenced schedule loads keep their existing average estimate.",'transport basis scope',p)
s=rep(s,"to come: the card’s transport cost, once a reference, for ${fmtNum(loadsNoFig)}", "to come: the card’s transport cost at the explicit equipment item and quantity for ${fmtNum(loadsNoFig)}",'cost forecast scope',p)
s=rep(s,"'real carrier figures replace the card and the average as they land');", "'real carrier figures replace the card and the average as they land; '+fmtNum(F888.heldLoads928)+' equipment loads remain unpriced or need allocation');",'cost forecast held disclosure',p)
p.write_text(('\ufeff' if bom else '')+s,encoding='utf-8');print('v9.28 attribution applied; no records changed')
