/* Author: Andrew Fisher. Synthetic historical metadata and canonical-photo regression checks. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict');
assert(process.env.BASE944&&process.env.PAGE,'Provide exact before/after pages');
const helper=path.resolve(__dirname,'../ownership944.js');
function read(file){const html=fs.readFileSync(file,'utf8'),script=html.match(/<script id="units925-script">([\s\S]*?)<\/script>/);assert(script);const m=new Module(path.join(__dirname,'fixture944.cjs'),module);m.filename=path.join(__dirname,'fixture944.cjs');m.paths=module.paths;m._compile('const Ownership944=require('+JSON.stringify(helper)+');\n'+script[1],m.filename);return m.exports;}
const pre=read(process.env.BASE944),post=read(process.env.PAGE),a={key:'X01',name:'Synthetic'},identity=(ref,owner,native,no)=>JSON.stringify([ref,owner,native?'native':'asset',native||no]),rawId=identity('X01','unknown','','1234567'),oldId=identity('X01','coates','','1234567'),sourceKey=pre.sourceKey('X01','unknown','1234567','Block');
function env(doc){return {units:()=>[{asset_no:'1234567',label:'Block',item:'Block'}],numbers:()=>[],items:()=>['Block'],itemOf:()=> 'Block',loading:()=>[],lines:()=>[{item:'Block',quantity:1}],qty:l=>l.quantity,identity,loads:doc?{'unit925/test':{kind:'unit925-record',ref:'X01',owner:'coates',assetNo:'1234567',item:'Block',sourceKey,...doc}}:{}};}
let checks=0;const ok=(v,m)=>{assert(v,m);checks++;};
for(const doc of [{transportId:oldId},{}]){const e=env(doc),before=pre.model(a,e),after=post.model(a,e),photos=[{id:'photo1',unit:oldId}];ok(after.rows[0].id===before.rows[0].id&&after.rows[0].id===oldId,'Established Coates identity stays unchanged');ok(post.photos(after.rows[0],after.rows,photos).length===1,'Existing canonical Coates photograph stays assigned');}
let m=post.model(a,env());ok(m.rows[0].id===rawId&&m.rows[0].owner==='coates','Default ownership preserves raw native identity');ok(post.photos(m.rows[0],m.rows,[{id:'photo2',unit:rawId}]).length===1,'Existing unknown-owner canonical photograph stays assigned');
m=post.model(a,env({transportId:rawId}));ok(m.rows[0].id===rawId,'New default-owner detail edit preserves the recorded stable identity');ok(post.photos(m.rows[0],m.rows,[{id:'photo3',unit:rawId}]).length===1,'New default-owner detail edit preserves its photograph');
const namedId=identity('X01','event-portables','','1234567');m=post.model(a,env({owner:'event-portables',transportId:namedId}));ok(m.rows[0].id===namedId&&m.rows[0].owner==='event-portables','Named supplier metadata remains authoritative');
ok(post.photos(m.rows[0],m.rows,[{id:'photo4',unit:namedId}]).length===1,'Named supplier photograph remains assigned');
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,identityChecks:checks}));
