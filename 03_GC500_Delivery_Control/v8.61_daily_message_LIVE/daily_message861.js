/* Author: Andrew Fisher. Personal daily-run text; the existing deliberate-send controls own delivery. */
function daily861Message(iso,team,url,weather){
 const name=String(team&&team.name||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/^(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+/i,'').split(/\s+/)[0];
 const greeting=name?'Good morning, '+name+'.':'Good morning.';
 const date=fmtDate(iso),forecast=weather||daily861Weather(iso);
 const body=greeting+'\nGC500 - '+date+'\n\n'+forecast.text+'\n\nPlease do your Take 5 before starting and again if the task or conditions change. If plans change, check with site.\n\nYour daily runs:\n'+url;
 if(body.length>480)throw Error('The daily message is too long for the texting service. No text has been submitted.');
 return body;
}
function daily861CheckWeather(p,iso){
 if(!p.weather861||p.weather861.fingerprint!==daily861Weather(iso).fingerprint)throw Error('Weather changed. Preview again before sending.');
}
function daily861PreviewHtml(s,team){
 if(!team)return '';
 // A restored receipt is not evidence of the original text: do not reconstruct it as a sent message.
 if(s.locked&&!s.text861)return '';
 try{const text=s.text861||daily861Message(s.iso,team,'[Daily run link]',s.prepared&&s.prepared.weather861);
 return '<div class="daily861-preview"><h5>'+(s.text861?'Message text':'Message preview')+'</h5><p class="sub">'+(s.text861?'Check delivery below.':'The daily link is added when you press Text deliveries.')+'</p><pre>'+esc(text)+'</pre></div>';
 }catch(e){return '<p class="daily821-status">'+esc(e.message)+'</p>';}
}
