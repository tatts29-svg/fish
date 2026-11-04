/* Author: Andrew Fisher. Exercise the native form cleaner/writer on a private candidate. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const A=require('../availability1299_src');
const filename=process.env.PAGE||path.resolve(__dirname,'../../build/GC500_v12.99/GC500_Delivery_Control_hosted.html');
const page=fs.readFileSync(filename,'utf8');
function fn(name){const start=page.indexOf('function '+name+'(');assert(start>=0,name+' exists');const end=page.indexOf('\n}',start);assert(end>start,name+' ends');return page.slice(start,end+2);}
const from=page.indexOf('const OUR_KINDS = ['),to=page.indexOf('const OUR_COST_CATS',from);
function native(){
 const person={id:'W-P-test-person',side:'ours',kind:'person',person:'Test Person',type:'External',employer:'Test Employer',branch:'TEST',pay_rate:12.34,accommodation_rate:45.67,note:'Existing note'};
 const S={costs:[{...person}]},audit=[],ctx={OnsiteAvailability1299:A,S,mayWrite:()=>true,whoAmI:()=> 'Test Operator',normBranch:v=>v,eventRoles:()=>[],allAssets:()=>[],ourSlug:v=>v.toLowerCase().replace(/ /g,'-'),tombedHere:()=>false,stampIt:(...a)=>audit.push(a),save:()=>{},flash:()=>{},ourRawOf:id=>S.costs.find(r=>r.id===id),Date};
 vm.createContext(ctx);vm.runInContext(page.slice(from,to)+'\n'+['cleanOur','ourIdFor','ourRefuse','setOurCost','setOurPerson'].map(fn).join('\n'),ctx);
 return {ctx,S,person,audit};
}
test('native form supplies a clearable real-date field with the correct term',()=>{
 const {ctx}=native(),field=vm.runInContext("OUR_KIND.person.fields.find(f=>f.name==='last_day')",ctx);
 assert.equal(field.type,'date');assert.equal(field.label,'Last day on site');assert(!field.req);
 assert.equal(ctx.setOurPerson('Test Person',{last_day:'2026-02-29'}),false);
 assert.equal(ctx.setOurPerson('Test Person',{last_day:'2026-10-21'}),true);
 assert.equal(ctx.S.costs[0].last_day,'2026-10-21');
 assert.equal(ctx.setOurPerson('Test Person',{last_day:''}),true);assert.equal(ctx.S.costs[0].last_day,null);
});
test('native person end-date edit preserves pay, branch, employer and historical cost source fields',()=>{
 const {ctx,S,person,audit}=native();assert.equal(ctx.setOurPerson('Test Person',{last_day:'2026-10-21',note:'Existing note. Final day confirmed.'}),true);
 for(const [k,v] of Object.entries(person))if(k!=='note')assert.equal(S.costs[0][k],v,k+' preserved');
 assert.equal(S.costs.length,1);assert.equal(S.costs[0].updated_by,'Test Operator');assert.equal(audit.length,1);assert.equal(audit[0][0],'ourcost');
 // The historical Finance source fingerprint reads pay/type/date/hours, never the new availability field.
 const finance=fn('fin745Rows');assert(!finance.includes('last_day'));assert(!finance.includes('OnsiteAvailability1299'));
});
test('current-team adapter reads current native end date and permits explicit historical cut-off',()=>{
 const {ctx,S}=native();const start=page.indexOf('var AboutContacts1089 = (function(){'),end=page.indexOf("if(typeof module==='object'&&module.exports)module.exports=AboutContacts1089;",start);
 ctx.ABOUT_CONTACT_INPUT1089={people:[]};ctx.todayIso=()=> '2026-10-22';ctx.ourCosts=()=>S.costs;
 vm.runInContext(page.slice(start,end),ctx);
 const people=[{name:'Test Person'},{name:'Other Person'}],before=JSON.stringify(people);
 assert.equal(ctx.AboutContacts1089.current(people).length,2);
 ctx.setOurPerson('Test Person',{last_day:'2026-10-21'});
 assert.equal(ctx.AboutContacts1089.current(people).length,1);
 assert.equal(ctx.AboutContacts1089.current(people,undefined,'2026-10-21').length,2);
 assert.equal(JSON.stringify(people),before);
});
