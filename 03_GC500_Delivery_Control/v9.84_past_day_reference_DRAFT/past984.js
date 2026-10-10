/* Author: Andrew Fisher. Past days retain reference access; percentages use dated completion records. */
(function(root){'use strict';
function model(day,today,read){
 const past=!!day.iso&&day.iso<today;
 if(!past)return {past:false,percent:null};
 const seen=new Set(),rows=[];
 for(const [kind,list] of [['in',day.deliveries||[]],['out',day.removals||[]]])for(const row of list){
  const key=row.a?.key,id=kind+'|'+key;if(!key||seen.has(id)||row.a._cancelled)continue;seen.add(id);
  const status=read(row.a,day.iso,kind);rows.push({key,kind,complete:status===true});
 }
 const extra=(day.unref||[]).length,total=rows.length+extra,done=rows.filter(r=>r.complete).length;
 const percent=total?Math.floor(done/total*100):null;
 return {past:true,total,done,unrecordedTasks:extra,percent,complete:total>0&&done===total,rows};
}
function recorded(asset,day,kind){
 const d=deliveryAsOf(asset.key,day);
 if(kind==='out')return assetStatusAsOf(asset,day).outPhase==='off site';
 if(!d.done)return false;
 const toilet=toiletRows962(asset,d,chargeLines(asset),day);
 if(toilet)return !!toilet.complete;
 return timeline841CompletionConflict(asset).length===0;
}
function decorate(){
 const pane=document.getElementById('pane-timeline');if(!pane)return;
 const today=todayIso(),days=calendarDays(),byDay=new Map(days.map(d=>[d.iso,d]));
 for(const card of pane.querySelectorAll('.day[data-day]')){
  const day=byDay.get(card.dataset.day);if(!day)continue;
  const m=model(day,today,recorded);if(!m.past)continue;
  card.classList.add('past984');card.dataset.past984=m.complete?'complete':'reference';
  card.style.setProperty('--past984-progress',String(m.percent??0)+'%');
  const header=card.querySelector('.dhr');if(header)header.innerHTML='<span class="past984-stamp">PAST DAY</span>';
  const band=document.createElement('span');band.className='past984-band';band.dataset.past984Summary='';
  band.innerHTML='<span class="past984-label">'+(m.complete?'✓ Recorded complete':'Reference')+'</span>'+(m.percent===null?'<span class="past984-empty">No movements</span>':'<b>'+m.percent+'<small>%</small></b><span class="past984-count">'+m.done+'/'+m.total+' recorded complete</span>');
  card.querySelector('.dpan')?.append(band);
  const footer=card.querySelector('.dfoot');if(footer){const selected=card.classList.contains('on');footer.innerHTML='<span class="'+(selected?'dsel':'dmotto')+'">Reference'+(selected?' · selected':'')+'</span><i class="dflag" aria-hidden="true"></i>';}
  card.setAttribute('aria-label',card.getAttribute('aria-label')+'. Past day, reference. '+(m.percent===null?'No scheduled movements.':m.percent+' percent of scheduled entries recorded complete by the end of this day; '+m.done+' of '+m.total+'.'));
  band.title='Scheduled movement references recorded complete by the end of '+fmtDate(day.iso)+'. Moved and cancelled items follow the current schedule. Additional unreferenced tasks are not assumed complete.';
 }
}
if(typeof window!=='undefined') {const previous=renderTimeline;renderTimeline=function(){const result=previous.apply(this,arguments);decorate();return result;};}
root.PastDay984={model,decorate};
})(typeof window!=='undefined'?window:globalThis);
