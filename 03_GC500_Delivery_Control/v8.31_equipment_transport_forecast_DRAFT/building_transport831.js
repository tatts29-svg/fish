/* Author: Andrew Fisher. Provisional building transport Revenue only.
   Pure inputs use units for a single leg, or total-legs for an explicit return charge.
   coveredEstimate is displaced card value, never the recorded contract dollars. */
function buildingTransport831(input){
  const cents = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const list = x => Array.isArray(x) ? x : [];
  const unique = x => [...new Set(x.filter(Boolean).map(String))];
  const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const issues = [], seen = new Map(), buildings = [];
  list(input && input.buildings).forEach(raw => {
    const b = Object.assign({}, raw, {numbers: unique(list(raw.numbers)), contracts: unique(list(raw.contracts)), lineKeys: unique(list(raw.lineKeys)), holdReasons: unique(list(raw.holdReasons))});
    b.id = String(b.id || b.ref + '|' + b.item);
    if (seen.has(b.id)) {
      const old = seen.get(b.id);
      if (JSON.stringify(raw) !== old.source) old.row.holdReasons.push('Conflicting duplicate demand identity');
      return;
    }
    seen.set(b.id, {row:b, source:JSON.stringify(raw)}); buildings.push(b);
    if(b.included&&!b.exclusion){b.exclusion=typeof b.included==='string'?b.included:'Transport included in the existing rate';b.included=true;}else if(b.exclusion)b.included=false;
    if (b.exclusion) return;
    if (b.quantity === 0) { b.exclusion = 'Zero asked quantity'; return; }
    if (!valid(b.quantity) || !Number.isInteger(b.quantity) || b.quantity <= 0) b.holdReasons.push('Asked quantity is missing or not whole transport units');
    if (valid(b.quantity) && b.numbers.length > b.quantity) b.holdReasons.push('More current asset numbers than asked units');
    if (!b.branch) b.holdReasons.push('Branch allocation needs confirmation');
  });
  const active = buildings.filter(b => !b.exclusion), numberOwners = new Map();
  active.forEach(b => b.numbers.forEach(n => { if (!numberOwners.has(n)) numberOwners.set(n,new Set()); numberOwners.get(n).add(b.ref); }));
  active.forEach(b => { if (b.numbers.some(n => numberOwners.get(n).size > 1)) b.holdReasons.push('Current asset number is shared by active references'); });
  const rows = buildings.flatMap(b => ['delivery','pickup'].map(leg => ({id:b.id+'|'+leg, buildingId:b.id, ref:b.ref, item:b.item, family:b.family||'Buildings', branch:b.branch || '', contracts:b.contracts, lineKeys:b.lineKeys, leg, quantity:b.quantity, rate:b.rate, rateSource:b.rateSource || '', coveredQuantity:0, uncoveredQuantity:0, grossEstimate:valid(b.quantity)&&valid(b.rate)?cents(b.quantity*b.rate):null, coveredEstimate:0, heldEstimate:0, additional:0, coverage:[], reasons:b.exclusion?[b.exclusion]:b.holdReasons.concat(list((b.holdReasonsByLeg||{})[leg])), state:b.included?'included':b.exclusion?'excluded':'pending'})));
  const coverSeen = new Map();
  const affected = c => {
    const exact=c.contract?active.filter(b=>b.contracts.includes(String(c.contract))):[];
    return exact.length?exact:c.branch?active.filter(b=>!b.branch||b.branch===c.branch):active;
  };
  const held = (bs,legs,reason) => rows.filter(r => bs.some(b => b.id === r.buildingId) && legs.includes(r.leg) && r.state !== 'excluded').forEach(r => r.reasons.push(reason));
  list(input && input.coverage).forEach(c => {
    const id = String(c.id || ''), serial = JSON.stringify(c);
    if (coverSeen.has(id)) {
      if (coverSeen.get(id) !== serial) { const reason='Conflicting duplicate contract charge identity'; held(affected(c),['delivery','pickup'],reason); issues.push(reason); }
      return;
    }
    coverSeen.set(id,serial);
    if (c.scope === 'other') return;
    const legs = c.leg === 'both' ? ['delivery','pickup'] : ['delivery','pickup'].includes(c.leg) ? [c.leg] : ['delivery','pickup'];
    const refConflict=active.filter(b=>c.ref===b.ref&&c.contract&&!b.contracts.includes(String(c.contract)));
    if(refConflict.length){held(refConflict,legs,'Transport reference and current contract allocation disagree');return;}
    let targets = active.filter(b => (!c.contract || b.contracts.includes(String(c.contract))) && ((c.ref && c.ref === b.ref) || list(c.candidateRefs).includes(b.ref) || list(c.lineKeys).some(k => b.lineKeys.includes(String(k)))));
    if(c.scope!=='exact')active.filter(b=>list(c.holdRefs).includes(b.ref)).forEach(b=>{if(!targets.includes(b))targets.push(b);});
    if (!targets.length || c.scope !== 'exact') { held(targets.length?targets:affected(c),legs,c.reason || 'Existing transport charge allocation needs confirmation'); return; }
    if (!valid(c.amount) || !['delivery','pickup','both'].includes(c.leg) || !valid(c.quantity) || c.quantity <= 0 || !Number.isInteger(c.quantity)) { held(targets,legs,c.reason || 'Existing transport price, direction or quantity needs confirmation'); return; }
    let q = c.quantity;
    if (c.quantityBasis === 'total-legs' && c.leg === 'both' && q % 2 === 0) q /= 2;
    else if (c.quantityBasis !== 'units') { held(targets,legs,'Existing transport unit/leg basis needs confirmation'); return; }
    const targetQ = targets.reduce((n,b) => n + (valid(b.quantity)?b.quantity:0),0);
    if (q > targetQ || (targets.length > 1 && q !== targetQ)) { held(targets,legs,'Shared transport quantity cannot be allocated to equipment units'); return; }
    targets.forEach(b => legs.forEach(leg => {
      const r = rows.find(x => x.buildingId === b.id && x.leg === leg), covered = targets.length === 1 ? q : b.quantity;
      r.coveredQuantity += covered;
      r.coverage.push({id, quantity:covered, amount:c.amount, basis:c.basis || '', sharedCharge:targets.length > 1});
    }));
  });
  rows.forEach(r => {
    r.reasons = unique(r.reasons);
    if (r.state === 'excluded' || r.state === 'included') return;
    if (r.coveredQuantity > r.quantity) { r.reasons.push('Overlapping contract coverage needs confirmation'); r.coveredQuantity = Math.min(r.quantity,r.coveredQuantity); }
    r.coveredEstimate = valid(r.rate) ? cents(r.coveredQuantity*r.rate) : 0;
    r.uncoveredQuantity = valid(r.quantity) ? Math.max(0,r.quantity-r.coveredQuantity) : null;
    if (r.reasons.length) { r.state='held'; r.heldEstimate=valid(r.rate)&&valid(r.uncoveredQuantity)?cents(r.rate*r.uncoveredQuantity):null; }
    else if (!r.uncoveredQuantity) { r.state='covered'; }
    else if (!valid(r.rate)) { r.state='held'; r.reasons.push('No current card transport charge'); r.heldEstimate=null; }
    else { r.state=r.coveredQuantity?'partly covered':'estimate'; r.additional=cents(r.uncoveredQuantity*r.rate); }
  });
  const byBranch = [];
  rows.filter(r => r.state !== 'excluded' && r.state !== 'included').forEach(r => {
    let b = byBranch.find(x => x.branch === r.branch); if (!b) { b={branch:r.branch, grossEstimate:0, coveredEstimate:0, heldEstimate:0, uncoveredAdditional:0}; byBranch.push(b); }
    b.grossEstimate += r.grossEstimate || 0; b.coveredEstimate += r.coveredEstimate; b.heldEstimate += r.heldEstimate || 0; b.uncoveredAdditional += r.additional;
  });
  byBranch.forEach(b => Object.keys(b).filter(k => k !== 'branch').forEach(k => b[k]=cents(b[k])));
  const sum = field => cents(byBranch.reduce((n,b) => n+b[field],0));
  return {provisional:true, rows, byBranch, grossEstimate:sum('grossEstimate'), coveredEstimate:sum('coveredEstimate'), heldEstimate:sum('heldEstimate'), uncoveredAdditional:sum('uncoveredAdditional'), held:unique(rows.filter(r=>r.state==='held').map(r=>r.buildingId)).length, excluded:unique(rows.filter(r=>r.state==='excluded').map(r=>r.buildingId)).length, included:unique(rows.filter(r=>r.state==='included').map(r=>r.buildingId)).length, estimated:unique(rows.filter(r=>r.additional>0).map(r=>r.buildingId)).length, issues};
}

function buildingTransportSource831(r){
  const text = String(r.description || r.what || r.item || ''), item = String(r.item || '');
  const delivery = /\bdeliver(?:y|ies)?\b|drop[ -]?off/i.test(text+' '+item), pickup = /\bpick[ -]?up\b|\bcollection\b|\breturn\b/i.test(text+' '+item);
  const ha = /HA\s+Line\s+Item(?:\(s\)|s)?\s*(\d+(?:\s*,\s*\d+)*)/i.exec(text);
  const numbers = ha ? ha[1].split(',').map(x=>x.trim()) : [];
  const eachWay = /each\s+way|both\s+ways|round\s+trip/i.test(text);
  return {lineKeys:numbers.map(n=>String(r.rental_contract)+'|'+n), leg:delivery&&pickup?'both':delivery?'delivery':pickup?'pickup':eachWay?'both':null, quantityBasis:!delivery&&!pickup&&eachWay?'total-legs':delivery&&pickup?'unknown':'units', unitBasisExplicit:/\bper\s+(?:unit|building|toilet|machine|container|item|piece)\b/i.test(text), package:/\bpackage\b|\bbundl|\binstall(?:ation)?\b|\btruck\b|\bload\b|\btrip\b|\bbulk\b/i.test(text), wildcardHA:!!ha&&/\*/.test(text.slice(ha.index)), malformedHA:/HA\s+Line\s+Item/i.test(text)&&(!ha||/\d\s*[-–]\s*\d/.test(text))};
}

function buildingTransportInput831(skipCoverage){
  const isBuilding = s => /^(Building\s+(3\.6|4\.8|6|9\.6|12)m|Ticket Box\s+(4\.8|6)m)$/i.test(String(s || '').trim());
  const assets = allAssets(), sources = ONHIRE_ROWS || [], buildings = [], lineOwners = new Map(), unsettledLines=new Map();
  const ownersOf=n=>assets.filter(a=>!a._cancelled&&!a.rest_of&&(a.asset_numbers||[]).map(String).includes(String(n))).map(a=>a.key);
  const settledMove=r=>r.asset_no_is_plant_number&&r.match&&r.match.to==='asset'&&typeof tombedHere==='function'&&tombedHere('num/'+r.match.key+'/'+r.asset_no)&&ownersOf(r.asset_no).length===1;
  assets.filter(a => a.discipline === 'Portable buildings').forEach(a => {
    const lines = chargeLines(a).filter(l=>isBuilding(l.item));
    const aliases=(a.locations||[]).map(s=>/^([A-Z]{1,4}\d{1,3}[A-Z]?)\s*\(([A-Z]{1,4}\d{1,3}[A-Z]?)\)/i.exec(String(s))).filter(m=>m&&m[1].toUpperCase()===String(a.key).toUpperCase()).map(m=>m[2].toUpperCase());
    const nums = [...new Set((a.asset_numbers || []).map(String))], co=contractOf(a.key), branch=branchOf(a.key) || {};
    const sourceRows = sources.filter(r=>!r.charge_line && ((r.match&&r.match.to==='asset'&&r.match.key===a.key) || (r.asset_no_is_plant_number&&nums.includes(String(r.asset_no)))));
    const primary=r=>r.kind==='building'||(!r.kind&&/portable building|ticket box/i.test(String(r.description||r.what||'')));
    const contracts = [...new Set([].concat(co.ids || [],co.id?[co.id]:[],branch.contracts || [],sourceRows.map(r=>r.rental_contract)).filter(Boolean).map(String))];
    const own = sourceRows.filter(primary).some(r=>{const t=contractTreatment747(r);return t&&t.kind==='own_use';});
    lines.forEach(l => {
      const rate = cardRate(l.discipline || a.discipline,l.item,a.key), transport=rate&&rate.transport;
      const holdReasons=[];
      if(l.priceable===false)holdReasons.push('Asked building quantity is not priceable on the current source');
      if (lines.length>1 && nums.length) holdReasons.push('Asset numbers need allocation to asked building types');
      if (sourceRows.some(r=>r.match&&r.match.to==='asset'&&r.match.key!==a.key&&nums.includes(String(r.asset_no))&&!settledMove(r))) holdReasons.push('Current reference and contract asset location disagree');
      if (co.where==='local' && sourceRows.some(r=>String(r.rental_contract)!==String(co.id))) holdReasons.push('Current Rental ID and matched contract line disagree');
      sourceRows.filter(r=>primary(r)&&settledMove(r)).forEach(r=>unsettledLines.set(String(r.rental_contract)+'|'+r.line,[r.match.key].concat(ownersOf(r.asset_no))));
      const b={id:a.key+'|'+l.item,ref:a.key,aliases,item:l.item,quantity:qtyOf(l),numbers:nums,branch:branch.code||'',contracts,lineKeys:sourceRows.filter(r=>primary(r)&&!settledMove(r)).map(r=>String(r.rental_contract)+'|'+r.line),rate:transport&&typeof transport.charge==='number'?transport.charge:null,rateSource:'Current '+CARD_WORD+' card · '+(rate&&rate.line||l.item)+' · per building, per leg',exclusion:a._cancelled?'Cancelled reference':a.rest_of?'Follow-up / rest-of delivery':a.relocation?'Relocation is not a new building order':own?'Coates own use':null,holdReasons};
      buildings.push(b); if(!b.exclusion)b.lineKeys.forEach(k=>{if(!lineOwners.has(k))lineOwners.set(k,[]);lineOwners.get(k).push(b);});
    });
  });
  lineOwners.forEach(bs=>{if(new Set(bs.map(b=>b.ref)).size>1)bs.forEach(b=>b.holdReasons.push('Contract building line is shared by current references'));});
  const uncertainLines=Object.fromEntries(unsettledLines);
  return {buildings,coverage:skipCoverage?[]:transportCoverage831(buildings,sources,uncertainLines),uncertainLines};
}
function transportFamilies831(text){
  const words=String(text||'').toLowerCase(),out=[];
  [['buildings',/\bbuildings?\b|ticket\s*box/],['toilets',/\btoilets?\b|\bfwf\b|amenit|waste\s*tank/],['containers',/\bcontainers?\b/],['access',/forklift|knuckle|scissor|boom|\baccess\b/],['generators',/generators?|genset/],['towers',/lighting\s*towers?|light\s*towers?/],['vms',/\bvms\b|variable\s*message/],['ground',/trak\s?mat|track\s?mat|ground\s*protection/],['fencing',/\bfenc|crowd\s*control|\bccb\b/],['barriers',/water[ -]?filled|armorzone|crash\s*barrier/],['furniture',/furniture|fridge|chairs?|tables?/]].forEach(([name,re])=>{if(re.test(words))out.push(name);});
  return out;
}
function transportCoverage831(buildings,sources,uncertainLines,coverageOverrides){
  const unsettledLines=new Map(Object.entries(uncertainLines||{})),lineOwners=new Map();
  buildings.filter(b=>!b.exclusion).forEach(b=>(b.lineKeys||[]).forEach(k=>{if(!lineOwners.has(k))lineOwners.set(k,[]);lineOwners.get(k).push(b);}));
  const coverage = sources.filter(r=>r.charge_line&&(r.kind==='transport'||(!r.kind&&/^(delivery|pickup|pick-up|transport)$/i.test(String(r.item||'').trim())))).map(r=>{
    const parsed=buildingTransportSource831(r), amount=contractCharge(r).amount;
    const targetSources=parsed.lineKeys.map(k=>sources.find(s=>!s.charge_line&&String(s.rental_contract)+'|'+s.line===k)).filter(Boolean);
    let scope='unallocated', reason='Existing transport has no exact building allocation';
    if (parsed.lineKeys.length && !parsed.malformedHA && targetSources.length===parsed.lineKeys.length) {
      if(parsed.lineKeys.some(k=>lineOwners.has(k)))scope='exact';
      else reason='Existing transport names an in-scope or unresolved hire line with no current unit allocation';
    }
    const candidateRefs=[...new Set(parsed.lineKeys.flatMap(k=>unsettledLines.get(k)||[]))],holdRefs=[];
    const words=String(r.description||'').toUpperCase().split(/[^A-Z0-9_-]+/),namedRefs=[...new Set(buildings.filter(b=>[b.ref].concat(b.aliases||[]).some(ref=>words.includes(String(ref).toUpperCase()))).map(b=>b.ref))];
    const matched=r.match&&r.match.to==='asset'?r.match.key:null,canonical=matched?buildings.filter(b=>b.ref===matched||(b.aliases||[]).includes(String(matched).toUpperCase())):[];
    const explicitRef=canonical.length===1?canonical[0].ref:(matched||(namedRefs.length===1?namedRefs[0]:null));
    if (explicitRef && buildings.some(b=>b.ref===explicitRef)) scope='exact';
    if(parsed.wildcardHA&&scope!=='other'){scope='unallocated';reason='HA transport list has unresolved additional scope; reviewed movement allocation is required';}
    if(candidateRefs.length){scope='unallocated';reason='Contract line still names a prior asset allocation; current placement is settled but charge coverage needs review';}
    if(parsed.lineKeys.some(k=>lineOwners.has(k))&&targetSources.some(s=>!lineOwners.has(String(s.rental_contract)+'|'+s.line))){scope='unallocated';reason='Transport charge combines building and other scope';}
    if(scope==='unallocated'&&!explicitRef&&!candidateRefs.length){
      const familyText=parsed.lineKeys.length?targetSources.map(s=>[s.kind,s.register_type,s.description].join(' ')).join(' '):String(r.description||r.item||''),families=transportFamilies831(familyText);
      if(families.length){
        const sameFamily=buildings.filter(b=>!b.exclusion&&!b.included&&transportFamilies831([b.family||'Buildings',b.item].join(' ')).some(f=>families.includes(f)));
        const subset=sameFamily.filter(b=>(b.contracts||[]).includes(String(r.rental_contract))||(!(b.contracts||[]).length&&b.branch===r.branch_code));
        if(!sameFamily.length)scope='other';
        else if(subset.length){candidateRefs.push(...subset.map(b=>b.ref));reason='Existing '+families.join('/')+' transport needs allocation within this contract';}
        else {const fallback=sameFamily.filter(b=>!r.branch_code||!b.branch||b.branch===r.branch_code);if(fallback.length){holdRefs.push(...fallback.map(b=>b.ref));reason='New contract transport needs allocation to current '+families.join('/')+' references on this branch';}else scope='other';}
      }
    }
    if(scope==='exact'&&!parsed.unitBasisExplicit){
      const demand=buildings.filter(b=>!b.exclusion&&!b.included&&((explicitRef&&b.ref===explicitRef)||parsed.lineKeys.some(k=>(b.lineKeys||[]).includes(k))));
      const asked=demand.reduce((n,b)=>n+(Number.isFinite(b.quantity)?b.quantity:0),0),haUnits=targetSources.reduce((n,s)=>n+(Number.isFinite(s.quantity)?s.quantity:0),0),charged=parsed.quantityBasis==='total-legs'?r.quantity/2:r.quantity;
      if(asked>charged||haUnits>charged){scope='unallocated';reason='A transport line quantity may describe a load; equipment-unit coverage needs confirmation';}
    }
    if (parsed.package && scope!=='other') {scope='unallocated';reason='Existing transport package coverage needs confirmation';}
    return {id:String(r.rental_contract)+'|'+r.line,contract:String(r.rental_contract||''),branch:r.branch_code||'',ref:explicitRef,candidateRefs,holdRefs,lineKeys:parsed.lineKeys,leg:parsed.leg,quantity:r.quantity,quantityBasis:parsed.quantityBasis,amount,scope,reason,basis:String(r.description||r.what||r.item||'')};
  });
  const overrides=new Map();
  (coverageOverrides||[]).forEach(c=>{if(overrides.has(c.id))throw new Error('Repeated transport coverage override identity');overrides.set(c.id,c);});
  return coverage.map(c=>overrides.has(c.id)?Object.assign({},c,overrides.get(c.id)):c);
}
function buildingTransportModel831(){return heldMemo('buildingTransport831',()=>{
  const other=typeof otherTransportInput831==='function'?otherTransportInput831():null,current=buildingTransportInput831(!!other);
  if(!other)return buildingTransport831(current);
  const buildings=current.buildings.concat(other.buildings||[]),uncertainLines=Object.assign({},current.uncertainLines,other.uncertainLines||{});
  return buildingTransport831({buildings,coverage:transportCoverage831(buildings,ONHIRE_ROWS||[],uncertainLines,other.coverageOverrides||[])});
});}

function buildingTransportTable831(T){
  const amount=n=>n==null?'not priced':money(n),families=[...new Set(T.rows.map(r=>r.family))];
  const rowHtml=id=>{const rs=T.rows.filter(r=>r.buildingId===id),b=rs[0],d=rs.find(r=>r.leg==='delivery'),p=rs.find(r=>r.leg==='pickup');
    const leg=r=>r.state==='included'?'Included':r.state==='excluded'?'excluded':r.state==='held'?'held':r.state==='covered'?'covered':amount(r.additional)+(r.coveredQuantity?' · '+fmtNum(r.coveredQuantity)+' covered':'');
    const reasons=[...new Set(rs.flatMap(r=>r.reasons))],coverage=[...new Set(rs.flatMap(r=>r.coverage.map(c=>c.id)))];
    const itemDetail=b.state==='included'?b.item:b.item+' × '+(b.quantity==null?'?':fmtNum(b.quantity))+' · '+(b.branch||'branch pending');
    return `<tr data-transport-demand="${esc(b.buildingId)}"><td><b>${esc(b.ref)}</b><br><span class="acc761-w">${esc(itemDetail)}</span></td><td class="num">${esc(b.state==='included'?'Included':amount(b.rate))}</td><td class="num">${esc(leg(d))}</td><td class="num">${esc(leg(p))}</td><td class="num">${esc(b.state==='included'?'Included':amount(d.additional+p.additional))}</td><td class="acc761-why">${esc(reasons.join(' · ') || (coverage.length?'Current contract '+coverage.join(', ')+' covers the matched units/legs; no card top-up':'Provisional estimate pending branch entry'))}<br><span class="acc761-w">${esc(b.rateSource)}</span></td></tr>`;
  };
  const sections=families.map(family=>{
    const rs=T.rows.filter(r=>r.family===family),ids=[...new Set(rs.map(r=>r.buildingId))],addition=Math.round(rs.reduce((n,r)=>n+r.additional,0)*100)/100,held=new Set(rs.filter(r=>r.state==='held').map(r=>r.buildingId)).size,included=rs.every(r=>r.state==='included'),fold='transport831|'+family;
    const summary=family+' · '+(included?'Included in existing rates':money(addition)+' additional estimate')+(held?' · '+fmtNum(held)+' held for allocation review':'');
    return `<details class="plfold765" data-transport-family="${esc(family)}" data-sfold="${esc(fold)}"${SFOLD_OPEN.has(fold)?' open':''}><summary>${esc(summary)}</summary><div class="fin745-table"><table><thead><tr><th>Equipment</th><th class="num">Card / listed unit / leg</th><th class="num">Delivery</th><th class="num">Pickup</th><th class="num">Additional estimate</th><th>Coverage / hold reason</th></tr></thead><tbody>${ids.map(rowHtml).join('')}</tbody></table></div></details>`;
  }).join('');
  return `<div class="fin745-block" id="buildingTransport831"><div class="fin745-blockhead"><div><h3>Additional transport forecast — delivery and pickup</h3><p>${esc(money(T.uncoveredAdditional))} additional to recorded Transport Revenue, pending branch confirmation. Current card charges apply to eligible ordered quantities and their listed transport units, per delivery and pickup leg. Matched contract charges replace the estimate, even below the card. This forecasts Revenue; it records no trip, completion or invoice.</p></div></div><p class="fin745-basis">${T.byBranch.filter(b=>b.uncoveredAdditional).map(b=>esc(b.branch||'Branch pending')+': '+esc(money(b.uncoveredAdditional))).join(' · ')} · ${esc(fmtNum(T.held))} rows held for allocation review; ${esc(fmtNum(T.excluded))} excluded. Held quantities may overlap and are not summed as additional Revenue. Included transport and missing prices are identified below. Provisional estimates · AUD ex GST.</p>${sections}</div>`;
}
