/* Author: Andrew Fisher. Synthetic tests only: no contacts, live records or network calls. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'weather861.js'),'utf8');
const BASE=Date.parse('2026-10-05T03:00:00Z');
let checks=0;
function fixture(options={}){
 let now=options.now||BASE;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
 const context={Date:Clock,Number,JSON,Promise,WX_DAYS:10,WX_OUTLOOK:7,WXF_STALE_MIN:720,
  todayIso:()=>new Date(now+10*3600000).toISOString().slice(0,10),
  wxAddDays:(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10),
  WXF:{at:new Date(now).toISOString(),days:{}},WXO:{at:new Date(now).toISOString(),days:{}},
  setTimeout,clearTimeout,wxfLoad:done=>done(),wxoLoad:done=>done()};
 Object.assign(context,options.globals||{});vm.createContext(context);vm.runInContext(source,context);
 return {c:context,row:(day,fields={},provider='WXF')=>{context[provider].days[day]={date:day,text:'Partly cloudy',min_c:18,max_c:25,rain_pc:20,wind_kph:24,...fields};},
  weather:day=>JSON.parse(JSON.stringify(context.daily861Weather(day))),clock:value=>{now=value;}};
}
function check(name,run){run();checks++;console.log('PASS '+name);}
(async()=>{
 check('Exact selected date and WeatherAPI priority',()=>{const x=fixture();x.row('2026-10-05',{text:'Sunny'});x.row('2026-10-06',{text:'Rain'});x.row('2026-10-06',{text:'Cloudy'},'WXO');assert.match(x.weather('2026-10-06').text,/forecast: Rain/);assert.match(x.weather('2026-10-06').text,/WeatherAPI/);assert.doesNotMatch(x.weather('2026-10-06').text,/Sunny|Cloudy/);});
 check('Concise temperature, rain and maximum wind with explicit units',()=>{const x=fixture();x.row('2026-10-05');const r=x.weather('2026-10-05');assert(r.available);assert.match(r.text,/18-25°C, 20% rain chance, wind to 24 km\/h/);assert(r.text.length<=160);});
 check('Open-Meteo fallback and no weather model mutation',()=>{const x=fixture();x.row('2026-10-05',{},'WXO');const before=JSON.stringify([x.c.WXF,x.c.WXO]);assert.match(x.weather('2026-10-05').text,/Open-Meteo/);assert.equal(JSON.stringify([x.c.WXF,x.c.WXO]),before);});
 check('Past, invalid and outside-ten-day dates have no invented weather',()=>{const x=fixture();for(const day of ['2026-10-04','2026-10-15','2026-02-30','not-a-date']){x.row(day);assert.equal(x.weather(day).available,false);assert.match(x.weather(day).text,/unavailable/);}});
 check('Days eight to ten are labelled outlook',()=>{const x=fixture();for(const day of ['2026-10-12','2026-10-13','2026-10-14']){x.row(day);assert.match(x.weather(day).text,/Surfers Paradise outlook:/);}x.row('2026-10-11');assert.match(x.weather('2026-10-11').text,/forecast:/);});
 check('Twelve-hour expiry, future timestamp and invalid timestamp are rejected',()=>{for(const at of [new Date(BASE-720*60000).toISOString(),new Date(BASE+1).toISOString(),'bad date']){const x=fixture();x.row('2026-10-05');x.c.WXF.at=at;assert.equal(x.weather('2026-10-05').available,false);}const x=fixture();x.row('2026-10-05');x.c.WXF.at=new Date(BASE-720*60000+1).toISOString();assert.equal(x.weather('2026-10-05').available,true);});
 check('Unusable primary timestamp falls back to valid secondary',()=>{const x=fixture();x.row('2026-10-05',{text:'Primary'});x.c.WXF.at='invalid';x.row('2026-10-05',{text:'Secondary'},'WXO');assert.match(x.weather('2026-10-05').text,/Secondary/);});
 check('Mismatched source row date is rejected',()=>{const x=fixture();x.row('2026-10-05',{date:'2026-10-06'});assert.equal(x.weather('2026-10-05').available,false);});
 check('Missing and invalid numbers are omitted rather than shown as zero',()=>{const x=fixture();x.row('2026-10-05',{min_c:null,max_c:23,rain_pc:null,wind_kph:NaN});const r=x.weather('2026-10-05');assert.match(r.text,/high 23°C/);assert.doesNotMatch(r.text,/0°C|rain chance|km\/h|NaN/);x.row('2026-10-05',{min_c:0,max_c:0,rain_pc:0,wind_kph:0});assert.match(x.weather('2026-10-05').text,/0-0°C, 0% rain chance, wind to 0 km\/h/);});
 check('Invalid rain and wind values are not stated',()=>{const x=fixture();x.row('2026-10-05',{rain_pc:101,wind_kph:-1});assert.doesNotMatch(x.weather('2026-10-05').text,/rain chance|km\/h/);});
 check('Empty invalid primary falls back to a usable secondary',()=>{const x=fixture();x.row('2026-10-05',{text:null,min_c:null,max_c:null,rain_pc:101,wind_kph:-1});x.row('2026-10-05',{},'WXO');assert.match(x.weather('2026-10-05').text,/Open-Meteo/);});
 check('Blank condition retains known numbers without an invented sky',()=>{const x=fixture();x.row('2026-10-05',{text:null});const text=x.weather('2026-10-05').text;assert.match(text,/forecast: 18-25°C/);assert.doesNotMatch(text,/Sunny|Cloudy/);});
 check('Long conditions use a verbatim prefix without paraphrasing',()=>{const x=fixture(),condition='Thunderstorms possible with intermittent conditions throughout much of the forecast area and showers later in the afternoon';x.row('2026-10-05',{text:condition});const r=x.weather('2026-10-05'),prefix=condition.slice(0,93),expected=prefix.slice(0,prefix.lastIndexOf(' '))+'...';assert(r.available);assert(r.text.length<=160);assert(r.text.startsWith('Surfers Paradise forecast: '+expected));assert.match(r.text,/Thunderstorms possible/);});
 check('Truncation preserves negation and does not invent weather',()=>{const x=fixture(),condition='No thunderstorms or freezing fog expected in the forecast area; mostly settled conditions are expected through the morning and afternoon';x.row('2026-10-05',{text:condition});const r=x.weather('2026-10-05');assert(r.text.startsWith('Surfers Paradise forecast: No thunderstorms or freezing fog expected'));assert.doesNotMatch(r.text,/forecast: Thunderstorms|freezing conditions|sleet|snow/);assert(r.text.length<=160);});
 check('Fingerprint ignores refetch time but changes with date or content',()=>{const x=fixture();x.row('2026-10-05');const first=x.weather('2026-10-05').fingerprint;x.c.WXF.at=new Date(BASE-1000).toISOString();assert.equal(x.weather('2026-10-05').fingerprint,first);x.c.WXF.days['2026-10-05'].text='Rain';assert.notEqual(x.weather('2026-10-05').fingerprint,first);x.row('2026-10-06');assert.notEqual(x.weather('2026-10-06').fingerprint,first);});
 check('Brisbane midnight uses the new site date',()=>{const x=fixture({now:Date.parse('2026-10-05T14:01:00Z')});x.row('2026-10-05');x.row('2026-10-06');assert.equal(x.weather('2026-10-05').available,false);assert.equal(x.weather('2026-10-06').available,true);});
 const ready=fixture();await ready.c.daily861WeatherReady();console.log('PASS Existing loaders may complete synchronously');checks++;
 const throws=fixture({globals:{wxfLoad:()=>{throw Error('Unavailable');},wxoLoad:done=>done()}});await throws.c.daily861WeatherReady();console.log('PASS Loader exceptions settle without blocking');checks++;
 let primary,secondary;const waiting=fixture({globals:{wxfLoad:done=>{primary=done;},wxoLoad:done=>{secondary=done;}}});let complete=false;const task=waiting.c.daily861WeatherReady().then(()=>{complete=true;});primary();primary();await Promise.resolve();assert.equal(complete,false);secondary();await task;console.log('PASS Duplicate callbacks cannot prematurely settle both providers');checks++;
 let requested=0;const timeout=fixture({globals:{setTimeout:(fn,ms)=>{requested=ms;return setTimeout(fn,20);},wxfLoad:()=>{},wxoLoad:()=>{}}});await timeout.c.daily861WeatherReady();assert(requested>0&&requested<=10000);console.log('PASS Missing callbacks settle within the bounded deadline');checks++;
 console.log('Weather861 checks: '+checks+' passed. No network or shared-record access.');
})().catch(error=>{console.error(error);process.exitCode=1;});
