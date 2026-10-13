/* Author: Andrew Fisher. Confirmed night labels must not imply hours or preserve stale return questions. */
const assert=require('assert');const m=require('./roster1006');
const spec={dates:['2026-10-23','2026-10-24','2026-10-25'],unconfirmed:[{name:'Kyle Gover'}]};
const rows=spec.dates.map((date,i)=>({kind:'labour',person:'Kyle Gover',date,id:String(i),note:m.NIGHT_NOTE+' Times not supplied.',hours:null,start:null,finish:null}));
assert.deepStrictEqual(m.confirmedNights(spec,[]),[]);
assert.deepStrictEqual(m.confirmedNights(spec,rows.slice(0,2)),[]);
assert.strictEqual(m.confirmedNights(spec,rows)[0].hoursKnown,false);
assert.strictEqual(m.confirmedNights(spec,rows)[0].shiftIds.length,3);
assert.deepStrictEqual(m.confirmedNights(spec,rows.map(r=>({...r,note:'Return assumed; confirm.'}))),[]);
assert.strictEqual(m.isNight({...rows[0],kind:'person'}),false);
assert.strictEqual(m.confirmedNights(spec,rows.map(r=>({...r,start:'18:00',finish:'06:00'})))[0].hoursKnown,true);
console.log('Seven roster fact checks passed');
