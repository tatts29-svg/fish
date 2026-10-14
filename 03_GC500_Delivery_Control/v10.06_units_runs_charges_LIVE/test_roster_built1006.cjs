/* Author: Andrew Fisher. Test the final built script against unscreened native record notes. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const file=process.env.PAGE;if(!file)throw Error('PAGE must name the final built page');
const html=fs.readFileSync(file,'utf8'),script=html.match(/<script id="roster1006-script">([\s\S]*?)<\/script>/)?.[1];assert(script,'Built roster script is present');
const sandbox={module:{exports:{}}};vm.runInNewContext(script,sandbox);const m=sandbox.module.exports;
for(const note of ['Night shift confirmed by Andrew Fisher, 13 Oct 2026. Start, finish and paid hours have not been supplied.','Night shift confirmed 13 Oct 2026. Start, finish and paid hours have not been supplied.']){
 assert(m.isNight({kind:'labour',note}));
 const spec={dates:['2026-10-23','2026-10-24','2026-10-25'],unconfirmed:[{name:'Kyle Gover'}]};
 const rows=spec.dates.map((date,id)=>({id:String(id),kind:'labour',person:'Kyle Gover',date,note,hours:null,start:null,finish:null}));
 const result=m.confirmedNights(spec,rows);assert.strictEqual(result.length,1);assert.strictEqual(result[0].hoursKnown,false);assert.strictEqual(result[0].shiftIds.length,3);
}
console.log('Eight final-built roster note checks passed');
