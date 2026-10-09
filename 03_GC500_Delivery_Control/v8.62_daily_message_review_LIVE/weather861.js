/* Author: Andrew Fisher. Plain text for a text message: only the GSM-7 basic alphabet, so the message is billed
   at 160 characters a part instead of 70. Curly quotes, dashes, the degree sign and accents become plain letters. */
const DAILY861_GSM='@£$¥èéùìòÇ\nØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
function daily861Gsm(v){
 const map={'\u2018':"'",'\u2019':"'",'\u201a':"'",'\u201b':"'",'\u2032':"'",'`':"'",'\u00b4':"'",'\u201c':'"','\u201d':'"','\u201e':'"','\u2033':'"','\u00ab':'"','\u00bb':'"','\u2010':'-','\u2011':'-','\u2012':'-','\u2013':'-','\u2014':'-','\u2015':'-','\u2212':'-','\u2026':'...','\u2022':'-','\u00b7':'-','\u00b0':'','[':'(',']':')','{':'(','}':')','~':'-','^':'','|':'/','\\':'/','\u20ac':'EUR','\r':'\n','\t':' '};
 let out='';
 for(const ch of String(v==null?'':v)){
  if(DAILY861_GSM.includes(ch)){out+=ch;continue;}
  if(Object.prototype.hasOwnProperty.call(map,ch)){out+=map[ch];continue;}
  if(/\s/.test(ch)){out+=' ';continue;}
  const bare=ch.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for(const b of bare)if(DAILY861_GSM.includes(b)&&b!=='\n')out+=b;
 }
 return out;
}
/* Author: Andrew Fisher. Selected-day forecast for the daily-run message; no current-reading substitution. */
function daily861Weather(iso){
 const key=String(iso||''),now=Date.now(),today=todayIso();
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 const result=(text,available)=>({text,fingerprint:JSON.stringify([key,text]),available});
 const unavailable=()=>result('Forecast unavailable for this day. Check conditions before starting.',false);
 if(!valid(key)||!valid(today)||key<today||key>wxAddDays(today,WX_DAYS-1))return unavailable();
 const number=n=>typeof n==='number'&&Number.isFinite(n);
 const tidy=s=>daily861Gsm(String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ')).replace(/\s+/g,' ').trim();
 let row=null,provider='';
 for(const [source,name] of [[WXF,'WeatherAPI'],[WXO,'Open-Meteo']]){
  const at=source&&typeof source.at==='string'?Date.parse(source.at):NaN,age=now-at;
  const candidate=source&&source.days&&source.days[key];
  if(!Number.isFinite(at)||age<0||age>=WXF_STALE_MIN*60000||!candidate||candidate.date!==key)continue;
  const hasNumber=number(candidate.min_c)||number(candidate.max_c)||(number(candidate.rain_pc)&&candidate.rain_pc>=0&&candidate.rain_pc<=100)||(number(candidate.wind_kph)&&candidate.wind_kph>=0);
  if(!tidy(candidate.text)&&!hasNumber)continue;
  row=candidate;provider=name;break;
 }
 if(!row)return unavailable();
 let condition=tidy(row.text);
 if(condition.length>96){
  // Keep the provider's exact wording, including uncertainty and negation.
  const prefix=condition.slice(0,93),boundary=prefix.lastIndexOf(' ');
  condition=(boundary>0?prefix.slice(0,boundary):prefix)+'...';
 }
 const bits=[];
 if(condition)bits.push(condition);
 const hi=number(row.max_c)?Math.round(row.max_c):null,lo=number(row.min_c)?Math.round(row.min_c):null;
 if(hi!==null&&lo!==null&&lo<=hi)bits.push(lo+'-'+hi+'C');
 else if(hi!==null)bits.push('high '+hi+'C');
 else if(lo!==null)bits.push('low '+lo+'C');
 if(number(row.rain_pc)&&row.rain_pc>=0&&row.rain_pc<=100)bits.push(Math.round(row.rain_pc)+'% rain chance');
 if(number(row.wind_kph)&&row.wind_kph>=0)bits.push('wind to '+Math.round(row.wind_kph)+' km/h');
 if(!bits.length)return unavailable();
 const lead='Surfers Paradise '+(key>=wxAddDays(today,WX_OUTLOOK)?'outlook':'forecast')+': ';
 const render=()=>lead+bits.join(', ')+' ('+provider+').';
 while(bits.length>1&&render().length>160)bits.pop();
 // Provider condition summaries fit the limit independently of optional numeric fields.
 if(render().length>160)return unavailable();
 return result(render(),true);
}

function daily861WeatherReady(){
 return new Promise(resolve=>{
  let settled=false,pending=2;
  const finish=()=>{if(settled)return;settled=true;clearTimeout(timer);resolve();};
  const timer=setTimeout(finish,9800);
  for(const load of [wxfLoad,wxoLoad]){
   let answered=false;
   const done=()=>{if(answered||settled)return;answered=true;if(--pending===0)finish();};
   try{load(done);}catch(e){done();}
  }
 });
}
