/* Author: Andrew Fisher. Reviewed historical station observations; no forecast substitution or record writes. */
(function(){
 'use strict';
 const ARCHIVE = __BUILD_HISTORY984_DATA__;
 const freeze = value => {
  if(value && typeof value==='object' && !Object.isFrozen(value)){
   Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
 };
 freeze(ARCHIVE);
 const dates=Object.freeze(Object.keys(ARCHIVE.days).sort());
 const rows=Object.create(null);
 dates.forEach(date=>{
  const row=ARCHIVE.days[date],source=ARCHIVE.sources[row.source_id];
  rows[date]=freeze({...row,temperature_basis:'BOM daily min/max',wind_basis:ARCHIVE.periods.wind_kph,
   provenance:{...source,timezone:ARCHIVE.timezone,notes_url:ARCHIVE.notes_url,periods:ARCHIVE.periods,
    ...(row.condition_source?{condition_source:row.condition_source}:{})}});
 });
 const valid=iso=>typeof iso==='string' && /^2026-\d{2}-\d{2}$/.test(iso);
 function get(iso){return valid(iso) && Object.prototype.hasOwnProperty.call(rows,iso)?rows[iso]:null;}
 function status(iso){
  const row=get(iso);
  return Object.freeze({date:valid(iso)?iso:null,available:!!row,partial:row?row.partial:null,
   reason:row?(row.partial?'Some observations unavailable':'Recorded observations'):'Historical observations unavailable'});
 }
 window.BuildHistory984=Object.freeze({get,status,dates:()=>dates,metadata:freeze({author:ARCHIVE.author,
  timezone:ARCHIVE.timezone,coverage:ARCHIVE.coverage,sources:ARCHIVE.sources,periods:ARCHIVE.periods,
  notes_url:ARCHIVE.notes_url})});
})();
