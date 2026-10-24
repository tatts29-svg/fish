/* Author: Andrew Fisher. Deliberate edit-only tracker publication; never writes S or the job record. */
var SvcTrackerAdmin1067 = (function () {
'use strict';
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function json(s) { return JSON.stringify(s).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'); }
function nextDay(day) { return new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10); }
function prepare(data, mode, contact, serverDay) {
  if (mode !== 'test' && mode !== 'event') throw new Error('Choose TEST or event tracker.');
  var name=String(contact.name||'').trim(), phone=String(contact.phone||'').trim();
  if (!name || name.length>80 || !/^[+0-9 ()-]{6,30}$/.test(phone) || phone.replace(/\D/g,'').length<8) throw new Error('Enter the confirmed servicing contact name and phone.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serverDay)) throw new Error('The service clock has not been verified.');
  var d=JSON.parse(JSON.stringify(data));d.contact={name:name,phone:phone};
  if(mode==='test'){var end=nextDay(serverDay),endAt=new Date(end+'T12:00:00Z');d.days=[{id:serverDay,plan:'night',label:'TEST '+serverDay,to:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][endAt.getUTCDay()]+' '+endAt.getUTCDate(),ifNeeded:false}];}
  var lines=[];d.areas.forEach(function(a){a.refs.forEach(function(r){r.lines.forEach(function(l){lines.push({id:l.id,ref:r.ref,kind:l.kind,qty:l.qty});});});});
  return {data:d,body:{load:'servicing-tracker:'+(mode==='test'?'TEST':'GC500-2026'),title:mode==='test'?'TEST servicing tracker · practice only':'GC500 servicing tracker · Fri 23 – Mon 26 Oct 2026',run_date:d.days[0].id,expires:nextDay(d.days[d.days.length-1].id),keys:[],contact:d.contact,tracker:{days:d.days.map(function(x){return {id:x.id,plan:x.plan};}),lines:lines,plans:d.plans}}};
}
function cardHtml(template, data, test) {
  var doc=new DOMParser().parseFromString(template,'text/html'), scripts=doc.querySelectorAll('script');
  if(scripts.length!==1 || scripts[0].textContent.split('/*SVC1067_DATA*/null').length!==2)throw new Error('The crew card template did not check out.');
  scripts[0].textContent=scripts[0].textContent.replace('/*SVC1067_DATA*/null',function(){return json(data);});
  var f=doc.querySelectorAll('footer .note')[1];if(!f)throw new Error('The crew card contact slot is missing.');
  f.textContent='Servicing contact: ';var a=doc.createElement('a');a.href='tel:'+data.contact.phone.replace(/[^+0-9]/g,'');a.textContent=data.contact.name+' · '+data.contact.phone;f.appendChild(a);
  if(test){doc.title='TEST GC500 Servicing';doc.querySelector('h1').textContent='TEST · GC500 Servicing';}
  return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
function mount(host, opts) {
  var fold=document.createElement('details');fold.className='svc1067-admin';
  fold.innerHTML='<summary>Manage servicing tracker</summary><p class="sub">Create a TEST tracker first. The event tracker uses the confirmed reference list and stays separate from practice. Updating keeps the same completion codes.</p>'+
    '<label>Servicing contact name <input data-contact-name maxlength="80" autocomplete="name"></label><label>Servicing contact phone <input data-contact-phone maxlength="30" inputmode="tel" autocomplete="tel"></label>'+
    '<label><input type="checkbox" data-test-checked> TEST checks have passed</label><label><input type="checkbox" data-site-checked> Area placement and no-pin directions are confirmed for the event</label>'+
    '<div><button type="button" class="btn" data-make="test" data-ro>Create / update TEST tracker</button> <button type="button" class="btn primary" data-make="event" data-ro>Create / update event tracker</button></div>'+
    '<p data-admin-status role="status"></p><div data-admin-links></div>';
  host.appendChild(fold);var busy=false, published=null;
  var status=fold.querySelector('[data-admin-status]'), links=fold.querySelector('[data-admin-links]');
  function say(s){status.textContent=s;}
  function allowed(){if(!opts.editable() || SYNC.status!=='live')throw new Error('Connect the edit link before publishing a tracker.');}
  fold.addEventListener('toggle',async function(){
    if(!fold.open || busy)return;
    try{allowed();var j=await SYNC.backend.cards();if(!opts.editable())return;
      var c=(j.cards||[]).find(function(c){return c.load==='servicing-tracker:GC500-2026'&&!c.expired&&c.contact;});
      if(c){var n=fold.querySelector('[data-contact-name]'),p=fold.querySelector('[data-contact-phone]');if(!n.value&&!p.value){n.value=c.contact.name||'';p.value=c.contact.phone||'';}}
    }catch(e){say(e.message);}
  });
  fold.addEventListener('click',async function(e){
    var b=e.target.closest('[data-make]');if(!b || busy)return;
    busy=true;fold.querySelectorAll('button').forEach(function(x){x.disabled=true;});links.innerHTML='';published=null;
    try{
      allowed();var mode=b.getAttribute('data-make');
      if(mode==='event'&&(!fold.querySelector('[data-test-checked]').checked||!fold.querySelector('[data-site-checked]').checked))throw new Error('Confirm the TEST checks and the site directions before publishing the event tracker.');
      var listing=await SYNC.backend.ticks({});allowed();
      var made=prepare(opts.data,mode,{name:fold.querySelector('[data-contact-name]').value,phone:fold.querySelector('[data-contact-phone]').value},listing.service_day);
      var matches=(listing.trackers||[]).filter(function(t){return t.load===made.body.load&&t.tracker&&!t.card_withdrawn&&!t.expired;});
      if(matches.length>1)throw new Error('More than one active tracker matches. Resolve the duplicate before publishing.');
      if(matches.length){if(!WConfirm('Update the existing '+(mode==='test'?'TEST':'event')+' tracker? Its printed completion codes will stay the same.'))return;made.body.token=matches[0].token;}
      else if(!WConfirm('Create the '+(mode==='test'?'TEST practice':'event')+' tracker with this confirmed contact and reference list?'))return;
      made.body.html=cardHtml(opts.template,made.data,mode==='test');
      allowed();say('Saving tracker…');
      var j;
      try{j=await SYNC.backend.makeTracker(made.body);}catch(err){
        if(err.code!=='tracker_exists'||!err.token)throw err;
        if(!WConfirm('Another editor created this tracker. Update that same tracker and keep its completion codes?'))return;
        made.body.token=err.token;allowed();j=await SYNC.backend.makeTracker(made.body);
      }
      allowed();if(!j.token||!/^[-_A-Za-z0-9]{16,64}$/.test(j.token))throw new Error('Published, but the service did not return a usable tracker link. Do not print yet.');
      var meta=await SYNC.backend.ticks({token:j.token,links:1});allowed();
      if(!meta.tracker||meta.card_withdrawn||!meta.key_kept||meta.load!==made.body.load||JSON.stringify(meta.tracker)!==JSON.stringify(made.body.tracker))throw new Error('Published, but its read-back did not match. Do not print yet.');
      var ctrl=new AbortController(),timer=setTimeout(function(){ctrl.abort();},15000),response,text;
      try{response=await fetch('/d/'+encodeURIComponent(j.token),{cache:'no-store',signal:ctrl.signal});text=await response.text();}finally{clearTimeout(timer);}allowed();
      if(!response.ok||text!==made.body.html)throw new Error('Published, but its crew page read-back did not match. Do not print yet.');
      published={token:j.token,links:meta.links,contact:made.body.contact,mode:mode,data_json:JSON.stringify(made.data,null,2)+'\n'};
      say((mode==='test'?'TEST':'Event')+' tracker saved and read back. '+(mode==='test'?'Complete the rehearsal checks before creating the event tracker.':'Run the iPhone and Android paper scans before laminating.'));
      links.innerHTML='<a class="btn" target="_blank" rel="noopener" href="/d/'+encodeURIComponent(j.token)+'">Open crew tracker</a> <button type="button" class="btn" data-download-links data-ro>Download private QR link file</button>';
      opts.changed(j.token);
    }catch(err){say(err.code==='key_lost'?'The existing completion key is missing. Publishing stopped; the codes were not replaced. Restore the key before using the printed sheets.':(err.name==='AbortError'?'The service response was not confirmed. Check the existing tracker before retrying; do not print yet.':String(err.message||err)));}
    finally{busy=false;fold.querySelectorAll('button').forEach(function(x){x.disabled=false;});}
  });
  fold.addEventListener('click',function(e){if(!e.target.closest('[data-download-links]')||!published)return;
    try{allowed();var blob=new Blob([JSON.stringify(published,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='GC500_servicing_'+published.mode+'_private_links.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}catch(err){say(err.message);}
  });
  return {clear:function(){published=null;fold.remove();}};
}
function WConfirm(s){return window.confirm(s);}
return {prepare:prepare,cardHtml:cardHtml,mount:mount};
})();
if(typeof module==='object'&&module&&module.exports)module.exports=SvcTrackerAdmin1067;
