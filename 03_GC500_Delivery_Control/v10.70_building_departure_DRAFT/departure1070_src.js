/* Author: Andrew Fisher. The settled building departure rule, on delivery and demob outputs. */
(function(W){
 'use strict';
 const MARK='data-departure1070', TITLE='Building departure rule';
 const WORDS='Buildings: leave the pick-up point before 07:00, before the first load restriction. Be on site before 07:00. For a departure from Kingston, be loaded and away by 05:00. No travel 07:00–09:00 or 16:00–18:00. Week 4 onward, including Race Week and demob.';
 const SHORT='BUILDINGS: leave pick-up before 07:00; on site before 07:00; From Kingston: away by 05:00; No travel 07:00–09:00 or 16:00–18:00.';
 const REVIEW='Timing needs review: the displayed planning times do not meet this building departure rule. Confirm the run before dispatch.';
 const building=a=>!!a&&!a._cancelled&&a.discipline==='Portable buildings';
 const item=s=>/\bbuilding\b|\bticket\s*box\b|\bcontainer\b|\bcommentary\s*booth\b/i.test(String(s||''));
 function inScope(iso){
  if(!iso)return true;
  const weeks=typeof DATA==='undefined'?[]:DATA.weeks||[],week=weeks.find(w=>/^week\s*4$/i.test(String(w.sheet||'').trim()));
  const start=week&&/^\d{4}-\d{2}-\d{2}$/.test(week.start)?week.start:'2026-09-21';
  return /^\d{4}-\d{2}-\d{2}$/.test(String(iso))&&iso>=start;
 }
 function row(r){
  const a=r&&(r.a||r);if(!building(a))return false;
  let items=null;
  if(r&&Array.isArray(r.parts))items=r.parts.map(p=>p.type||p.item||'');
  else if(r&&Array.isArray(r.units))items=r.units.filter(p=>p.n>0||p.unknown).map(p=>p.type||p.item||'');
  else if(r&&r.a&&Array.isArray(r.events)&&r.events.length&&typeof dpItems==='function')items=dpItems(r).map(p=>p.item||'');
  return items?items.some(item):true;
 }
 function load(g,iso){return inScope(iso)&&!!g&&(g.rows||[]).some(row);}
 function stops(L,iso){return inScope(iso)&&!!L&&(L.stops||[]).some(s=>row({a:s.r&&s.r.a,parts:s.parts}));}
 function text(a,iso){return building(a)&&inScope(iso)?WORDS:'';}
 // Recognise only policy phrases emitted by the native LOAD782, flow891, arrival943 and demob816 outputs.
 // Existing recorded/planned clocks and warnings are never deleted or reworded.
 function missing(existing,short){
  const s=String(existing||'').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|#160);/g,' ').replace(/\s+/g,' ');
  const bits=[];
  if(!/leave (?:the )?pick-up (?:point )?before 07:00/i.test(s))bits.push(short?'BUILDINGS: leave pick-up before 07:00':'Buildings: leave the pick-up point before 07:00, before the first load restriction.');
  if(!/on site before 07:00/i.test(s))bits.push(short?'on site before 07:00':'Be on site before 07:00.');
  if(!/(?:Kingston (?:by|before) 05:00|(?:Kingston[^.]{0,20}|away (?:from Kingston )?(?:by )?)05:00)/i.test(s))bits.push(short?'From Kingston: away by 05:00':'For a departure from Kingston, be loaded and away by 05:00.');
  const am=/no travel(?: to(?: or from)? the Gold Coast)? 07:00[–-]09:00/i.test(s),pm=/no travel(?: to(?: or from)? the Gold Coast)? (?:07:00[–-]09:00 or )?16:00[–-]18:00/i.test(s);
  if(!am||!pm)bits.push('No travel '+[!am?'07:00–09:00':'',!pm?'16:00–18:00':''].filter(Boolean).join(' or ')+'.');
  if(!short&&!/Week 4 onward, including Race Week and demob/.test(s))bits.push('Week 4 onward, including Race Week and demob.');
  return bits.join(short?'; ': ' ');
 }
 function paragraph(review,words){return '<p class="note816" '+MARK+'><b>'+TITLE+'.</b> '+esc(words==null?WORDS:words)+(review?' <b>'+esc(REVIEW)+'</b>':'')+'</p>';}
 function add(html,anchor,review){if(!html||html.includes(MARK))return html;const words=missing(html,false);return html.includes(anchor)?html.replace(anchor,anchor+paragraph(review,words)):html+paragraph(review,words);}
 function arrival(a){if(typeof arrival943Ref!=='function'||typeof inPlace782!=='function'||inPlace782(a.key))return '';const m=arrival943Ref(a);return m?arrival943Words(m):'';}
 function mailWords(iso,loads){let known='';if(typeof ARRIVAL943!=='undefined'&&iso===ARRIVAL943.day&&loads.some(g=>g&&g.kind==='deliveries'&&(g.rows||[]).some(r=>ARRIVAL943.refs.includes(r.a.key)))){const m=arrival943Model();if(m)known=arrival943Words(m);}return missing(known,false);}
 function longRules(out,a){
  if(!text(a))return out;
  const native=typeof LOAD782==='undefined'?'':LOAD782;
  const suffix=' Load in the delivery order - about 70 min to site. A delivery with a time asked for gets one leave-by time that meets all of these.';
  const index=native?out.indexOf(native):-1;
  const result=out.slice();
  if(index>=0)result.splice(index,1);
  // The original TIME782 sentence duplicates the restriction already carried by the loading rule.
  if(typeof TIME782!=='undefined')for(let i=0;i<result.length;i++)if(result[i]===TIME782)result[i]=TIME782.replace(' - and no travel to the Gold Coast 07:00-09:00 or 16:00-18:00, so a run that would hit those hours comes in before them.','; a run that would hit a no-travel window comes in before it.');
  const words=missing(result.join('\n')+'\n'+arrival(a),false)+(index>=0?suffix:'');
  if(words)index>=0?result.splice(index,0,words):result.push(words);
  return result;
 }
 function minutes(value){if(typeof value==='number')return Number.isFinite(value)?value:null;const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));return m&&+m[1]<24&&+m[2]<60?+m[1]*60 + +m[2]:null;}
 function planningConflict(L){const t=L&&L.t;if(!t)return false;const dep=minutes(t.dep),arrive=minutes(t.arrive),leave=minutes(t.leave);return dep!==null&&dep>300||arrive!==null&&arrive>=420||leave!==null&&leave>=420;}
 const previousLong=rules782Long;rules782Long=function(a){return longRules(previousLong.apply(this,arguments),a);};
 const previousShort=rules782Sms;rules782Sms=function(a){const out=previousShort.apply(this,arguments);const words=text(a)?missing(out.join('\n'),true):'';return words?out.concat(words):out;};
 const previousOptional=rules782Optional;rules782Optional=function(a){const out=previousOptional.apply(this,arguments);return text(a)?out.map(x=>typeof LOAD_SMS782!=='undefined'&&x===LOAD_SMS782?'LOAD: in the delivery order.':x):out;};
 const previousHtml=rules782Html;rules782Html=function(a){let html=previousHtml.apply(this,arguments);if(!text(a)||html.includes(MARK))return html;const native=typeof LOAD782==='undefined'?'':esc(LOAD782.replace(/^LOAD: f/,'F'));if(native&&html.includes(native))return html.replace(native,esc(missing(html.replace(native,''),false)+' Load in the delivery order - about 70 min to site. A delivery with a time asked for gets one leave-by time that meets all of these.')).replace('<b>Loading</b>','<b '+MARK+'>Loading</b>');const li='<li '+MARK+'><b>'+TITLE+'</b> '+esc(missing(html,false))+'</li>';return html.includes('</ul>')?html.replace('</ul>',li+'</ul>'):'<div class="rules782"><div class="sect">Driver rules</div><ul>'+li+'</ul></div>'+html;};
 const previousFlow=flow891Card;flow891Card=function(d){const html=previousFlow.apply(this,arguments);if(!(d.deliveries||[]).concat(d.removals||[]).some(row)||!inScope(d.iso))return html;const native='oversized or curfew loads on the earliest run: away from Kingston by 05:00, on site before 07:00 (no travel 07:00–09:00 or 16:00–18:00)';if(html.includes(native)){const other=html.replace(native,'');return html.replace(native,'<span '+MARK+'>'+esc(missing(other,false))+' Oversized or curfew loads use the earliest run.</span>');}return add(html,'</h3>',false);};
 const previousPage=dpPage;dpPage=function(d,g){const html=previousPage.apply(this,arguments);return load(g,d.iso)?add(html,'<h2>Safety</h2>',false):html;};
 const previousDrop=dropPage;dropPage=function(a,events,n,total,d){const html=previousDrop.apply(this,arguments);if(!inScope(d&&d.iso)||!row({a,events}))return html;return html.includes(MARK)?html:html.replace('<div class="rs-foot">',paragraph(false,missing(html,false))+'<div class="rs-foot">');};
 const previousDaily=daily821Model;
 daily821Model=function(iso){
  const m=previousDaily.apply(this,arguments);if(!inScope(iso))return m;
  return Object.assign({},m,{loads:m.loads.map(g=>Object.assign({},g,{rows:g.rows.map(r=>{
   const a=assetOf(r.key);
   if(!building(a)||r.items&&r.items.length&&!r.items.some(p=>item(p.item)))return r;
   const notes=r.notes||[],words=missing(notes.join('\n'),false);return Object.assign({},r,{notes:words?notes.concat(words):notes.slice()});
  })}))});
 };
 const previousDemob=dayHtml816;dayHtml816=function(M,Dy){const html=previousDemob.apply(this,arguments);if(!inScope(Dy.iso)||['toilets','pump'].includes(DM816.view))return html;const rows=(Dy.list||[]).filter(r=>DM816.branch==='all'||r.branch===DM816.branch);if(!rows.some(row))return html;const runs=DM816.view==='trucks'?trucks816(Dy.iso,DM816.branch).filter(L=>stops(L,Dy.iso)):[];return add(html,'<div class="dmbody816">',runs.some(planningConflict));};
 const previousSheet=sheet816Before826;sheet816Before826=function(iso,L){const html=previousSheet.apply(this,arguments);return stops(L,iso)?add(html,'<h2>Rules</h2>',planningConflict(L)):html;};
 W.BuildingDeparture1070=Object.freeze({version:'v10.70',missing,mailWords,text,short:SHORT,words:WORDS,review:REVIEW,inScope,building,row,load,stops,planningConflict});
})(window);
