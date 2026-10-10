/* Author: Andrew Fisher. Approved Build cards read shared facts without changing any record. */
(function(root){'use strict';
function model(day,today,read){
 if(!day.iso||day.iso>=today)return {past:false,percent:null};
 const p=read(day.iso),valid=p?.ready&&Number.isFinite(p.pct?.min)&&Number.isFinite(p.pct?.max)&&p.pct.min>=0&&p.pct.max<=100&&p.pct.min<=p.pct.max;
 if(!valid)return {past:true,percent:null,complete:false,text:'—',bound:false};
 const bound=p.pct.max-p.pct.min>.005,percent=bound?Math.floor((p.pct.min+1e-9)*100)/100:p.pct.min;
 return {past:true,percent,bound,text:percent.toLocaleString('en-AU',{maximumFractionDigits:2}),complete:!!p.allGreen&&!p.provisional&&p.pct.min===100&&p.pct.max===100};
}
if(typeof document==='undefined'){root.PastDay984={model};return;}
const facts=new Map(),progress=new Map(),weatherKeys=new WeakMap(),watched=new Set();
let revision='',lastDay=todayIso(),paused=false,printing=false,suspended=false,rendering=false;
const e=v=>esc(String(v??''));
function begin(){const key=todayIso()+JSON.stringify(S);if(key!==revision){revision=key;facts.clear();progress.clear();}}
function jobAtDate(iso){
 if(iso<'2026-10-07')return null;if(progress.has(iso))return progress.get(iso);
 const memo=new Map(RENDER_MEMO);RENDER_MEMO.clear();
 try{const value=progress881Model(iso);progress.set(iso,value);return value;}
 finally{RENDER_MEMO.clear();for(const [key,value] of memo)RENDER_MEMO.set(key,value);}
}
function reading(day,today){if(!facts.has(day.iso))facts.set(day.iso,BuildCardData984.day(day.iso,today,day));return facts.get(day.iso);}
function weather(iso){
 const past=iso<todayIso(),f=past?root.BuildHistory984?.get(iso):wxfDay(iso);
 if(!f||f.date&&f.date!==iso)return {kind:null,label:past?'History unavailable':'Forecast unavailable',tag:past?'RECORDED':'FORECAST',hi:null,lo:null,detail:past?'No verified weather observations for this date.':wxNoneWhy(iso),source:null};
 const numeric=n=>typeof n==='number'&&Number.isFinite(n),known=['sun','part','cloud','rain','pour','storm','fog','sleet'];
 let kind=past?(known.includes(f.kind)?f.kind:null):WX818.kindFor(f);
 const wind=numeric(f.gust_kph)?f.gust_kph:f.wind_kph;
 if(!kind&&past&&numeric(wind)&&wind>0)kind='wind';
 const label=kind==='wind'?(numeric(f.gust_kph)?'Gusts ':'Wind ')+Math.round(wind)+' km/h':kind?(past?(f.text||({fog:'Fog',rain:'Rain',cloud:'Cloudy',part:'Partly cloudy',sun:'Clear',pour:'Heavy rain',storm:'Storm',sleet:'Sleet'})[kind]):wxShort(kind,f.text)):'Observed range';
 return {kind,label,tag:past?'BOM RECORDED':'FORECAST',hi:numeric(f.max_c)?Math.round(f.max_c):null,lo:numeric(f.min_c)?Math.round(f.min_c):null,
 detail:past?[(f.partial?'Some observations unavailable. ':''),'Bureau of Meteorology · Gold Coast Seaway. ',f.provenance?.periods?.min_c,f.provenance?.periods?.max_c,f.provenance?.periods?.gust_kph,f.condition_source?'Sky: '+f.text:'Cloud and rain conditions not recorded.'].filter(Boolean).join(' '):wxWords(f),source:f};
}
function sky(w){if(!w.kind)return '';return '<span class="wm-card-scene'+(w.kind==='wind'?' bc984-neutral-sky':'')+'" aria-hidden="true">'+(w.kind==='wind'?'':WX818.art(w.kind,false))+'</span>';}
function foreground(kind){
 if(['rain','pour','storm','sleet'].includes(kind))return '<span class="bc984-rain-sheet" aria-hidden="true"></span>';
 if(kind==='wind')return '<svg class="bc984-weather-foreground" viewBox="0 0 400 640" preserveAspectRatio="none" aria-hidden="true"><g class="bc984-wind-line" fill="none" stroke="#cde5ed" stroke-width="1">'+[80,178,279,391,497,589].map((y,i)=>'<path d="M'+(-90+i*9)+' '+y+'q90 -22 170 0t190 0t150 0"/>').join('')+'</g></svg>';
 if(kind==='sun'||kind==='part')return '<span class="bc984-sun-rays" aria-hidden="true"></span>';
 if(kind==='cloud'||kind==='fog')return '<span class="bc984-cloud-veil" aria-hidden="true"></span>';return '';
}
function weatherHtml(w){return '<span><span class="bc984-label">WEATHER <small>'+w.tag+'</small></span><span class="bc984-condition">'+e(w.label)+'</span></span>'+(w.hi!==null||w.lo!==null?'<span class="bc984-temperature">'+(w.hi!==null?w.hi+'°':'')+(w.lo!==null?'<span>'+(w.hi!==null?'/ ':'')+w.lo+'°</span>':'')+'</span>':'');}
function loadText(l){
 if(l.status==='none-scheduled')return {value:'No loads scheduled',basis:'SCHEDULE'};
 if(l.status==='scheduled')return {value:(l.total??l.scheduledGroups)+' planned',basis:l.verified?'LOADS SCHEDULED':'GROUPS · TRUCKS UNVERIFIED'};
 if(l.verified&&l.total>0)return {value:l.completed+' / '+l.total,basis:'COMPLETED / SCHEDULED'};
 return {value:'Not verified',basis:'COMPLETED / SCHEDULED'};
}
const shield='<svg viewBox="0 0 24 28" width="22" height="26" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 2L22 6v8c0 6-5 10-10 12C7 24 2 20 2 14V6Z"/><path d="m7 13 3 3 7-7"/></svg>';
function html(day,ci,sel,today){
 const d=reading(day,today),p=model(day,today,jobAtDate),w=weather(day.iso),date=new Date(day.iso+'T12:00:00Z'),on=day.iso===sel,isToday=day.iso===today,load=loadText(d.loads);
 const classes=['day','bc984-day',on?'on':'',isToday?'today':'',p.past?'past984':'',day.phase==='Demob'?'demob':'',day.phase==='Event'?'event':''].filter(Boolean).join(' ');
 const names=d.staffNames.length?d.staffNames.map(n=>'<span>'+e(n)+'</span>').join(''):'<span class="bc984-missing">No roster recorded</span>',rule=d.lifeSavingRule;
 const pct=p.percent===null?(p.past?'Not recorded':isToday?'In progress':'Scheduled'):(p.bound?'≥':'')+p.text+'<small>%</small>';
 const progressLabel=p.past?'WHOLE BUILD':'BUILD DAY',phaseLine=isToday?'TODAY':p.past?'AT DAY’S CLOSE':'UPCOMING';
 const completion=p.past?(p.percent===null?'Whole-build progress not recorded.':(p.bound?'At least ':'')+p.text+' percent whole-build progress at day close.'):'No historical percentage for this day.';
 return '<button type="button" class="'+classes+'" data-day="'+day.iso+'" data-bc984-weather="'+(w.kind||'unknown')+'" data-bc984-motion="off" aria-pressed="'+on+'" aria-label="'+e(fmtDate(day.iso)+'. '+(p.past?'Closed day record. ':isToday?'Today. ':'Scheduled day. ')+completion+' '+load.value+'. Staff: '+(d.staffNames.join(', ')||'no roster recorded')+'. Weather: '+w.label)+'">'+
 '<span class="dface bc984-card">'+sky(w)+foreground(w.kind)+
 '<span class="bc984-cap"><span class="bc984-week">'+e(d.weekLabel)+'</span><span class="bc984-closed">'+(p.past?'<i class="bc984-lock" aria-hidden="true"></i> CLOSED':isToday?'TODAY':'UPCOMING')+'</span></span>'+
 '<span class="bc984-date-zone"><span class="bc984-weekday">'+e(date.toLocaleDateString('en-AU',{weekday:'long',timeZone:'UTC'}))+'</span><span class="bc984-date-number">'+String(date.getUTCDate()).padStart(2,'0')+'</span><span class="bc984-date-month">'+e(date.toLocaleDateString('en-AU',{month:'long',timeZone:'UTC'}))+' <span>'+date.getUTCFullYear()+'</span></span></span>'+
 (p.past?'<span class="bc984-stamp" role="img" aria-label="Day completed. Locked for reference."></span>':'')+
 '<span class="bc984-weather-reading">'+weatherHtml(w)+'</span>'+
 '<span class="bc984-progress"><span class="bc984-progress-head"><span class="bc984-label">'+progressLabel+'<span class="bc984-at-close">'+phaseLine+'</span></span><span class="bc984-percentage'+(p.percent===null?' long':'')+'">'+pct+'</span></span>'+(p.percent!==null?'<span class="bc984-rail"><i style="width:'+p.percent+'%"></i></span>':'')+'</span>'+
 '<span class="bc984-load-row"><span class="bc984-label">DAY’S LOADS<span class="bc984-at-close">'+load.basis+'</span></span><span class="bc984-load-count'+(load.value.length>10?' long':'')+'">'+e(load.value)+'</span></span>'+
 '<span class="bc984-crew"><span class="bc984-crew-head"><span class="bc984-label">STAFF ON THIS DAY</span><span class="bc984-crew-count">'+(d.staffNames.length?'<b>'+d.staffNames.length+'</b> staff':'')+'</span></span><span class="bc984-names">'+names+'</span></span>'+
 (rule?'<span class="bc984-safety-rule"><span class="bc984-rule-icon" aria-hidden="true">'+shield+'</span><span class="bc984-rule-copy"><span class="bc984-label">LIFE SAVING RULE <small>REMINDER</small></span><span class="bc984-rule-title">'+e(rule.title)+'</span></span></span>':'')+
 '<span class="bc984-card-footer"><span>'+(on?'Selected · ':'')+(p.past?'Open day record':'Open day plan')+'</span><span aria-hidden="true">↗</span></span></span></button>';
}
function active(){const p=document.getElementById('pane-timeline');return !!(p&&p.classList.contains('on')&&!p.hidden&&state.tab==='timeline');}
function allowed(){return active()&&!document.hidden&&!printing&&!suspended&&!paused&&!motionOff();}
function sync(){const play=allowed();for(const c of watched)c.dataset.bc984Motion=play&&c.dataset.bc984Visible==='true'?'on':'off';}
const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{for(const x of entries)x.target.dataset.bc984Visible=String(x.isIntersecting&&x.intersectionRatio>.05);sync();},{threshold:[0,.05]}):null;
function details(pane){
 const selected=pane.querySelector('.bc984-day.on');if(!selected)return;const d=facts.get(selected.dataset.day);if(!d)return;
 const w=weather(d.iso),url=w.source?.provenance?.url||w.source?.sourceUrl||'',safe=/^https?:\/\/(www\.)?(timeanddate\.com|bom\.gov\.au)\//.test(url)?url:null;
 let box=pane.querySelector('.bc984-more');if(!box){box=document.createElement('details');box.className='bc984-more';pane.querySelector('.daystrip')?.insertAdjacentElement('afterend',box);}
 const content='<summary>More info · '+e(fmtDate(d.iso))+'</summary><div><b>Whole build</b><p>The shared tracked-category progress index as at day close. This is separate from that day’s load completion.</p><b>Day’s loads</b><p>'+e(d.loads.source)+' '+e((d.loads.issues||[]).join(' '))+'</p><b>Weather</b><p>'+e(w.detail)+(safe?' <a href="'+e(safe)+'" target="_blank" rel="noopener">Observed source</a>':'')+'</p>'+(d.lifeSavingRule?'<b>'+e(d.lifeSavingRule.title)+'</b><p>'+e(d.lifeSavingRule.text)+'</p><p>'+e(d.lifeSavingRule.note)+'</p>':'')+'</div>';
 if(box.innerHTML!==content)box.innerHTML=content;
}
function mount(){
 const pane=document.getElementById('pane-timeline');if(!pane)return;
 for(const c of watched)if(!c.isConnected){observer?.unobserve(c);watched.delete(c);}
 for(const c of pane.querySelectorAll('.bc984-day'))if(!watched.has(c)){watched.add(c);c.dataset.bc984Visible='false';observer?.observe(c);weatherKeys.set(c,JSON.stringify(weather(c.dataset.day)));}
 let button=pane.querySelector('[data-bc984-pause]');
 if(!button){button=document.createElement('button');button.type='button';button.className='btn';button.dataset.bc984Pause='';button.onclick=()=>{paused=!paused;button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play animation':'Pause animation';sync();};pane.querySelector('.daynav')?.append(button);}
 button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(paused));details(pane);sync();
}
function refreshWeather(){
 const pane=document.getElementById('pane-timeline');if(!pane)return;
 for(const c of pane.querySelectorAll('.bc984-day')){const w=weather(c.dataset.day),key=JSON.stringify(w);if(weatherKeys.get(c)===key)continue;weatherKeys.set(c,key);c.dataset.bc984Weather=w.kind||'unknown';c.querySelectorAll('.wm-card-scene,.bc984-weather-foreground,.bc984-rain-sheet,.bc984-sun-rays,.bc984-cloud-veil').forEach(n=>n.remove());c.querySelector('.bc984-card').insertAdjacentHTML('afterbegin',sky(w)+foreground(w.kind));c.querySelector('.bc984-weather-reading').innerHTML=weatherHtml(w);}
 details(pane);sync();
}
function checkDay(){if(document.hidden||typeof TPOD!=='undefined'&&TPOD.frozen)return false;const now=todayIso();if(now===lastDay)return false;lastDay=now;if(active()){renderTimeline();return true;}return false;}
const previousRender=renderTimeline;renderTimeline=function(){begin();rendering=true;try{const result=previousRender.apply(this,arguments);mount();return result;}finally{rendering=false;}};
const previousPaint=wxfPaint;wxfPaint=function(){const result=previousPaint.apply(this,arguments);if(!rendering)refreshWeather();return result;};
const previousClock=tpodTick;tpodTick=function(){const result=previousClock.apply(this,arguments);checkDay();return result;};
const previousGo=go;go=function(){const result=previousGo.apply(this,arguments);sync();return result;};
document.addEventListener('visibilitychange',sync);document.addEventListener('gc500motionchange',sync);
window.addEventListener('pagehide',()=>{suspended=true;sync();});window.addEventListener('pageshow',()=>{suspended=false;sync();});
window.addEventListener('beforeprint',()=>{printing=true;sync();});window.addEventListener('afterprint',()=>{printing=false;sync();});
root.PastDay984={model,checkDay};root.BuildCards984={html,begin,mount,weather,refreshWeather,sync,reading,report:()=>({playing:allowed(),mounted:[...watched].filter(x=>x.isConnected).length,animated:[...watched].filter(x=>x.dataset.bc984Motion==='on').length,revisionCached:!!revision})};
if(active())renderTimeline();
})(typeof window!=='undefined'?window:globalThis);
