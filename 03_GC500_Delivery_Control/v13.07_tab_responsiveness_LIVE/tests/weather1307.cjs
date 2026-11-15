/* Author: Andrew Fisher. Run existing active-day weather checks after the job has ended. */
'use strict';
const harness=require('../../toolchain/harness/open_page');
const nativeOpen=harness.open;
// The programme ends on 13 November. The old test requires a card for "today".
// Keep its assertions unchanged and use a moving browser clock on the final programme day.
// The current forecast no longer covers that date, so provide a browser-only weather fixture.
harness.open=options=>nativeOpen({...options,init:(options.init||'')+`;
(()=>{
 const NativeDate=Date,offset=NativeDate.parse('2026-11-13T02:00:00Z')-NativeDate.now();
 class ProgrammeDate extends NativeDate{
  constructor(...args){super(...(args.length?args:[NativeDate.now()+offset]));}
  static now(){return NativeDate.now()+offset;}
 }
 window.Date=ProgrammeDate;
 localStorage.setItem('gc500.weather.forecast',JSON.stringify({at:new ProgrammeDate().toISOString(),days:{
  '2026-11-13':{date:'2026-11-13',code:1000,text:'Sunny',max_c:26,min_c:19,avg_c:23,rain_pc:10,rain_mm:0,wind_kph:20,humidity:65,sunrise:'04:49 AM',sunset:'06:17 PM'}
 }}));
})();`});
require('../../v13.00_weather_stability_LIVE/tests/check_weather_stability_ui.cjs');
