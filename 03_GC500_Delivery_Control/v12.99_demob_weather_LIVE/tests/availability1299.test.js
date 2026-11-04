/* Author: Andrew Fisher. Final-day boundaries and preservation of historical records. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const A=require('../availability1299_src');
test('final day accepts real dates including leap years and rejects impossible dates',()=>{
 for(const v of ['2024-02-29','2026-01-01','2026-12-31'])assert(A.validDate(v));
 for(const v of [null,undefined,0,'','2026-02-29','2026-04-31','2026-00-01','2026-13-01','2026-1-01','2026-01-01T00:00:00Z'])assert.equal(A.validDate(v),false);
});
test('last day remains inclusive and earlier team/history records are untouched',()=>{
 const people=[{name:'Test Installer',role:'Installer'},{name:'Other Person'}],records=[{kind:'person',person:'test installer',last_day:'2026-10-21',branch:'TEST',pay_rate:12.34},{kind:'labour',person:'Test Installer',date:'2026-10-20',hours:8}];
 const before=JSON.stringify({people,records});
 assert.equal(A.current(people,records,'2026-10-20').length,2);assert.equal(A.current(people,records,'2026-10-21').length,2);
 assert.deepEqual(A.current(people,records,'2026-10-22'),[people[1]]);assert.equal(JSON.stringify({people,records}),before);
});
test('blank end date restores current contact without changing source objects',()=>{
 const p={name:'Test Person'},r={kind:'person',person:'Test Person',last_day:null};
 assert.equal(A.current([p],[r],'2026-10-22')[0],p);r.last_day='';assert.equal(A.current([p],[r],'2026-10-22')[0],p);
});
test('invalid date or ambiguous duplicate person records cannot silently hide a contact',()=>{
 const p={name:' Test  Person '},r={kind:'person',person:'test person',last_day:'2026-10-21'};
 assert.equal(A.current([p],[r],null)[0],p);
 assert.equal(A.current([p],[{...r,last_day:'2026-04-31'}],'2026-10-22')[0],p);
 assert.equal(A.current([p],[r,{...r,last_day:null}],'2026-10-22')[0],p);
 assert.equal(A.current([p],[r,{...r,last_day:'2026-10-20'}],'2026-10-22')[0],p);
 assert.deepEqual(A.current([p],[r,{...r}],'2026-10-22'),[]);
});
test('only native person end dates affect current contacts, never labour or notes',()=>{
 const p={name:'Test Person'},rows=[{kind:'labour',person:'Test Person',last_day:'2026-10-21'},{kind:'person',person:'Test Person',note:'Finished earlier; no formal date supplied'}];
 assert.equal(A.current([p],rows,'2026-10-22')[0],p);
});
