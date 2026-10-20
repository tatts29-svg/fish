/* Author: Andrew Fisher. Exact-source typed ownership regression and conservation checks. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const file=process.env.PAGE||'/workspace/private-numbers1012/inventory-candidate.html',html=fs.readFileSync(file,'utf8'),sha=crypto.createHash('sha256').update(html).digest('hex'),checks=[];
if(process.env.EXPECTED_SHA)assert.equal(sha,process.env.EXPECTED_SHA);
const marker='<script id="inventory960-script">';assert.equal(html.split(marker).length,2);const source=html.split(marker)[1].split('</script>')[0],c=vm.createContext({});vm.runInContext(source,c);const I=c.Inventory960,company=k=>k==='event-portables'?'Event Portables':k;
const row=(id,owner='event-portables',item='FWF',ref='WC70')=>({physical:true,id,owner,item,ref,assetNo:id});
const model=(rows,groups=[{item:'FWF',quantity:rows.length}])=>({rows,groups});
function test(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
test('One confirmed supplier FWF unit is counted as Event Portables',()=>{const x=I.allocation(model([row('0423')]),'FWF',1,company,'WC70');assert.equal(x.sub,1);assert.equal(x.cos['Event Portables'],1);assert.equal(x.nonum,0);});
test('WC72 follows the same generic single-item identity rule',()=>{const x=I.allocation(model([row('0699','event-portables','FWF','WC72')]),'FWF',1,company,'WC72');assert.equal(x.sub,1);assert.equal(x.coates,0);});
test('Single-item Coates identity remains Coates',()=>{const x=I.allocation(model([row('123','coates')]),'FWF',1,company,'WC70');assert.equal(x.coates,1);assert.equal(x.sub,0);assert.equal(x.numbers[0],'123');});
test('Mixed owner single-item scope remains split by owner',()=>{const x=I.allocation(model([row('EP'),row('C','coates')]),'FWF',2,company,'WC70');assert.equal(x.sub,1);assert.equal(x.coates,1);assert.equal(x.sub+x.coates+x.nonum,2);});
test('No physical identity preserves legacy reader without inventing ownership',()=>assert.equal(I.allocation(model([],[{item:'FWF',quantity:1}]),'FWF',1,company,'WC70'),null));
test('Unknown ordered scope does not activate the new single-item projection',()=>assert.equal(I.allocation(model([row('EP')],[{item:'FWF',quantity:null}]),'FWF',1,company,'WC70'),null));
test('Zero ordered scope does not activate the new single-item projection',()=>assert.equal(I.allocation(model([row('EP')],[{item:'FWF',quantity:0}]),'FWF',1,company,'WC70'),null));
test('No receipt contributes no supplier unit',()=>assert.equal(I.allocation(model([row('EP')]),'FWF',0,company,'WC70'),null));
test('Partial receipt cannot identify which of two assigned units arrived',()=>{const x=I.allocation(model([row('1'),row('2')]),'FWF',1,company,'WC70');assert.equal(x.sub,0);assert.equal(x.nonum,1);});
test('Duplicate physical id cannot multiply supplier count',()=>{const x=I.allocation(model([row('1'),row('1')]),'FWF',2,company,'WC70');assert.equal(x.sub,0);assert.equal(x.nonum,2);});
test('Duplicate supplier fleet number cannot multiply supplier count',()=>{const x=I.allocation(model([row('1'),{...row('2'),assetNo:'1'}]),'FWF',2,company,'WC70');assert.equal(x.sub,0);assert.equal(x.nonum,2);});
test('Identity belonging to another reference is not credited here',()=>{const x=I.allocation(model([row('1','event-portables','FWF','OTHER')]),'FWF',1,company,'WC70');assert.equal(x.sub,0);assert.equal(x.nonum,1);});
test('Unconfirmed owner remains unidentified',()=>{const x=I.allocation(model([row('1','unknown')]),'FWF',1,company,'WC70');assert.equal(x.sub,0);assert.equal(x.coates,0);assert.equal(x.nonum,1);});
test('Different item identity cannot satisfy the requested item',()=>assert.equal(I.allocation(model([row('P','event-portables','Pee Panel')],[{item:'FWF',quantity:1}]),'FWF',1,company,'WC70'),null));
test('Existing multi-item ownership stays separated by item',()=>{const m=model([row('F'),row('P','event-portables','Pee Panel')],[{item:'FWF',quantity:1},{item:'Pee Panel',quantity:1}]);const f=I.allocation(m,'FWF',1,company,'WC70'),p=I.allocation(m,'Pee Panel',1,company,'WC70');assert.equal(f.sub,1);assert.equal(p.sub,1);});
test('Existing VMS allocation path remains managed',()=>assert.equal(I.managed(model([],[{item:'VMS',quantity:1}]),'VMS'),true));
function inventory(){return {list:[{item:'FWF',asked:1,on:1,coates:0,sub:{},nonum:1,spareSub:{},refs:{WC70:{key:'WC70',asked:1,on:1,coates:0,sub:0,cos:{},nonum:1,onsite:true}}}],cos:{}};}
test('Inventory row, reference and company total update together with unchanged quantities',()=>{const x=I.reconcileInventory(inventory(),()=>model([row('0423')]),company),r=x.list[0];assert.equal(r.asked,1);assert.equal(r.on,1);assert.equal(r.refs.WC70.on,1);assert.equal(r.sub['Event Portables'],1);assert.equal(r.refs.WC70.cos['Event Portables'],1);assert.equal(x.cos['Event Portables'].at,1);assert.equal(r.nonum,0);});
test('Repeated reconciliation is idempotent, never a second unit',()=>{const x=I.reconcileInventory(inventory(),()=>model([row('0423')]),company);I.reconcileInventory(x,()=>model([row('0423')]),company);assert.equal(x.list[0].sub['Event Portables'],1);assert.equal(x.cos['Event Portables'].at,1);});
test('An excluded/cancelled reference is not reintroduced into inventory',()=>{const x=I.reconcileInventory({list:[],cos:{}},()=>model([row('0423')]),company);assert.equal(x.list.length,0);assert.equal(Object.keys(x.cos).length,0);});
const out={author:'Andrew Fisher',sourceSha256:sha,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass)};console.log(JSON.stringify(out,null,2));if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2));if(out.failed.length)process.exitCode=1;
