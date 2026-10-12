/* Author: Andrew Fisher. Display the existing standdown calculation without recalculating charges. */
function generatorStanddownHtml1005(r,eventFrom){
 const known=v=>v!=null&&Number.isFinite(Number(v));
 const days=known(r.standdownDays)?Number(r.standdownDays):null;
 const arrived=r.actualIsConfirmed===true;
 const start=arrived?r.deliveredDate:r.plannedDate;
 const end=days>0&&eventFrom?new Date(Date.parse(eventFrom+'T00:00:00Z')-86400000).toISOString().slice(0,10):null;
 const unknown='<span class="pl-todo">Not recorded</span>';
 const date=v=>v?'<time datetime="'+esc(v)+'" title="'+esc(fmtDate(v))+'">'+esc(fmtDay(v).dm)+'</time>':unknown;
 const periodDate=v=>days===0?'Not applicable':date(v);
 const amount=v=>known(v)?esc(money(Number(v))):'<span class="pl-todo">Not priced</span>';
 const fact=(key,label,value)=>'<dt>'+esc(label)+'</dt><dd data-standdown1005="'+key+'">'+value+'</dd>';
 return '<dl class="generator1005-standdown">'+
  fact('rate','Rate / unit / day',amount(r.standdownRate))+
  fact('start',arrived?'Actual start':'Planned start',periodDate(start))+
  fact('end','End',periodDate(end))+
  fact('days','Total days',days==null?unknown:esc(fmtNum(days)))+
  fact('total','Total','<b>'+amount(r.standdownCharge)+'</b>')+'</dl>';
}
