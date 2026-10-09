/* Author: Andrew Fisher. Personal daily-run text; the existing deliberate-send controls own delivery. */
const DAILY861_MAX=480,DAILY861_NAME_MAX=30,DAILY861_TOKEN_MAX=64;
// The longest daily-run link the page will ever put in a text: the length check uses it before anything is published,
// so a text that fits here always fits once the real (shorter) link arrives.
function daily861WorstLink(){return location.origin+'/d/'+'x'.repeat(DAILY861_TOKEN_MAX);}
function daily861FirstName(team){
 const words=daily861Gsm(String(team&&team.name||'').replace(/[\u0000-\u001f\u007f]/g,' ')).replace(/\s+/g,' ').trim().replace(/^(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+/i,'').split(' ');
 return Array.from(words[0]||'').slice(0,DAILY861_NAME_MAX).join('');
}
function daily861Body(iso,team,url,weather){
 const name=daily861FirstName(team);
 const greeting=name?'Good morning, '+name+'.':'Good morning.';
 const date=daily861Gsm(fmtDate(iso)),forecast=daily861Gsm((weather||daily861Weather(iso)).text);
 return greeting+'\nGC500 - '+date+'\n\n'+forecast+'\n\nPlease do your Take 5 before starting and again if the task or conditions change. If plans change, check with site.\n\nYour daily runs:\n'+url;
}
function daily861Message(iso,team,url,weather){
 // The same worst-case check runs for the preview and before the daily page is published.
 if(daily861Body(iso,team,daily861WorstLink(),weather).length>DAILY861_MAX)throw Error('The daily message is too long for the texting service. No daily page was published and no text has been submitted.');
 const body=daily861Body(iso,team,url,weather);
 if(body.length>DAILY861_MAX)throw Error('The daily message is too long for the texting service. No text has been submitted.');
 return body;
}
function daily861CheckWeather(p,iso){
 if(!p.weather861||p.weather861.fingerprint!==daily861Weather(iso).fingerprint)throw Error('Weather changed. Preview again before sending.');
}
function daily861PreviewHtml(s,team){
 if(!team)return '';
 // A restored receipt is not evidence of the original text: do not reconstruct it as a sent message.
 if(s.locked&&!s.text861)return '';
 // A text the service did not accept is not shown as the sent message.
 const sent=s.locked&&s.text861;
 try{const text=sent?s.text861:daily861Message(s.iso,team,'[Daily run link]',s.prepared&&s.prepared.weather861);
 return '<div class="daily861-preview"><h5>'+(sent?'Message text':'Message preview')+'</h5><p class="sub">'+(sent?'Check delivery below.':'The daily link is added when you press Text deliveries.')+'</p><pre>'+esc(text)+'</pre></div>';
 }catch(e){return '<p class="daily821-status">'+esc(e.message)+'</p>';}
}
