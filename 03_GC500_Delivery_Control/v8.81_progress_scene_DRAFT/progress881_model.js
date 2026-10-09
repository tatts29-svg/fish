/* Author: Andrew Fisher. A dimensionless seven-group index; never adds metres to units.
 * Pure fixture inputs are accepted for isolated tests. Missing groups stay missing.
 */
function progress881Model(day, suppliedSummary, suppliedFence) {
 const s=suppliedSummary||todayWorkSummary848(day),f=suppliedFence||fenceOverall853(day,s);
 const ids=['buildings','toilets','fencing','generators','lighting','vms','equipment'];
 const names={buildings:'Buildings',toilets:'Toilets',fencing:'Fencing',generators:'Generators',lighting:'Lighting',vms:'VMS boards',equipment:'Equipment'};
 const number=n=>typeof n==='number'&&Number.isFinite(n),clamp=n=>Math.max(0,Math.min(100,n));
 const rows=ids.map(id=>{
  const x=s.byId?.[id];
  if(id==='fencing')return {id,name:'Fencing',min:f.state==='ready'&&number(f.pct?.min)?clamp(f.pct.min):null,max:f.state==='ready'&&number(f.pct?.max)?clamp(f.pct.max):null,provisional:!!f.provisional,basis:'Programme work metres recorded',done:f.credited,left:f.left,total:f.total,unit:'m'};
  const known=x&&['confirmed','lower-bound'].includes(x.pctKind)&&number(x.pct),lower=x?.pctKind==='lower-bound';
  return {id,name:names[id],min:known?clamp(x.pct):null,max:known?lower?100:clamp(x.pct):null,provisional:lower||!!x?.reviewQuantity||!!x?.unquantifiedRefs,basis:'Confirmed completion',done:x?.done,left:x?.left,total:x?.total,unit:x?.unit||'units'};
 });
 const ready=!!s.health?.ready&&rows.every(r=>number(r.min)&&number(r.max)&&r.min<=r.max);
 const pct=ready?{min:rows.reduce((n,r)=>n+r.min,0)/7,max:rows.reduce((n,r)=>n+r.max,0)/7}:null;
 const provisional=rows.some(r=>r.provisional)||!!s.health?.stale;
 return {day,rows,ready,pct,provisional,reached:ready?Math.min(pct.min===100&&!provisional?5:4,Math.floor(pct.min/20)):0,allGreen:ready&&pct.min===100&&pct.max===100&&!provisional,
  basis:'Equal-weighted average of the seven displayed group percentages: each group contributes one seventh. Equipment groups use confirmed completion; Fencing uses recorded Build + Event programme work metres, capped within each activity. Metres and equipment quantities are never added. Fencing gate counts, components and physical sign-offs remain separate in its group details. A range preserves unresolved quantities; if any group percentage is unavailable, the overall index is unavailable. This is a progress index, not physical handover or financial completion.'};
}
