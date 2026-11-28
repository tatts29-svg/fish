"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const code = fs.readFileSync(path.join(__dirname,"..","qr_handover.js"),"utf8");

class Node {
  constructor(tag) {this.tag=tag;this.children=[];this.textContent="";this.dataset={};this.events={};}
  append(...children) {this.children.push(...children);}
  make(tag) {const child=new Node(tag);this.append(child);return child;}
  createTHead() {return this.make("thead");}
  createTBody() {return this.make("tbody");}
  insertRow() {return this.make("tr");}
  addEventListener(event,handler) {this.events[event]=handler;}
  setAttribute(name,value) {this[name]=value;}
  replaceChildren(...children) {this.children=children;}
  tags(tag) {return [...(this.tag===tag?[this]:[]), ...this.children.flatMap(c=>c.tags(tag))];}
  get text() {return [this.textContent,...this.children.map(c=>c.text)].join(" ");}
}
function page() {
  const root=new Node("div"),pills=[];
  const window={MMGReportInstruments:{pill:(host,n,total)=>pills.push([n,total])}};
  const dialog=new Node("dialog"),heading=dialog.make("h2"),close=dialog.make("button"),stage=dialog.make("div");
  dialog.querySelector=selector=>({h2:heading,button:close,".product-photo-stage":stage})[selector];
  dialog.showModal=()=>{dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.events.close();};
  vm.runInNewContext(code,{window,document:{createElement:tag=>new Node(tag),getElementById:id=>id==="product-photo-dialog"?dialog:null}});
  return {root,pills,dialog,api:window.QRHandover};
}
const item={item:"A-001",name:"Radio",issued_at:"2026-11-25T03:04",returned_at:"2026-11-26T12:03:28"};
const signedName="art-"+"a".repeat(64)+".webp."+"B".repeat(43);

test("scoped product photo opens at its signed URL and clears on dismissal",()=>{
  const {api,dialog}=page();
  const photo=api.artwork({kind:"person",product_art:{"A-001":"/qr/personal/"+signedName}},item);
  photo.tags("button")[0].events.click();
  assert.equal(dialog.open,true);
  assert.equal(dialog.tags("img")[0].src,"/qr/personal/"+signedName);
  assert.equal(dialog.querySelector("h2").textContent,item.name);
  dialog.querySelector("button").events.click();
  assert.equal(dialog.open,false);
  assert.equal(dialog.tags("img").length,0);
  assert.equal(dialog.querySelector("h2").textContent,"");
});

test("return groups preserve date, minute, second and each receipt line's real precision",()=>{
 for(const [precision,returned_at,expect] of [
  ["second","2026-11-26T12:03:28","12:03:28 AEST"],["minute","2026-11-26T12:03","latest recorded minute"],
  ["date","2026-11-26","Some entries have no return time"]]){
  const {root,api}=page();
  api.receipt(root,{kind:"person",handover:{latest_return:{precision,returned_at,count:1,items:[item]}},
    product_art:{"A-001":"/qr/personal/"+signedName}});
  assert.equal(root.children[0].id,"return-receipt");
  assert.ok(root.text.includes(expect));assert.ok(root.text.includes("A-001"));
  assert.ok(root.text.includes("Issued 25 Nov 2026, 03:04 AEST"));
  assert.ok(root.text.includes("Returned 26 Nov 2026, 12:03:28 AEST"));
  assert.equal(root.tags("img")[0].loading,"lazy");
  assert.equal(root.tags("img")[0].src,"/qr/personal/"+signedName);
 }
});

test("complete, quiet, uncovered and partially timed shifts distinguish zero and unknown",()=>{
 const hours=[{start:"2026-11-25T23:00",issued:2,returned:null},{start:"2026-11-26T00:00",issued:2,returned:null}];
 const shift={name:"Night",start:"2026-11-25T18:00",end:"2026-11-26T06:00",
  issued:4,returned:null,hourly:hours,peak_issue_hours:hours.map(h=>h.start),peak_return_hours:[]};
 const {root,pills,api}=page();
 api.shift(root,{kind:"company",handover:{shift}});
 assert.deepEqual(pills,[[2,4]]);assert.equal(root.children[0].id,"shift-review");
 assert.ok(root.text.includes("23:00–00:00, 00:00–01:00"));assert.ok(root.text.includes("2 of 4 in each hour"));
 assert.ok(root.text.includes("Peak unavailable"));assert.ok(root.text.includes("Issued 4 · Returned Unavailable"));
 assert.equal(root.tags("tbody")[0].tags("tr").length,2);
 const quiet=page();quiet.api.shift(quiet.root,{kind:"company",handover:{shift:{...shift,issued:0,returned:0,hourly:[],peak_issue_hours:[]}}});
 assert.ok(quiet.root.text.includes("Issued 0 · Returned 0"));assert.ok(quiet.root.text.includes("None recorded this shift"));
 const missing=page();missing.api.shift(missing.root,{kind:"company",handover:{shift:null}});
 assert.ok(missing.root.text.includes("does not cover a full shift"));assert.equal(missing.pills.length,0);
});

test("longest-held item carries scoped holder, ties, snapshot time and defensible duration",()=>{
 const report={kind:"company",asat:"2026-11-28T07:15",handover:{oldest:{...item,holder:"Example Holder",elapsed_minutes:2940,tied_count:2}},
  product_art:{"A-001":"/qr/personal/"+signedName}};
 const {root,api}=page();api.oldest(root,report);assert.equal(root.children[0].id,"oldest-held");
 assert.ok(root.text.includes("2 days 1 hour"));assert.ok(root.text.includes("one of 2 assets tied"));assert.ok(root.text.includes("Held by Example Holder"));
 assert.ok(root.text.includes("28 Nov 2026, 07:15 AEST"));assert.equal(root.tags("img").length,0);
 for(const ref of ["//foreign.test/image","https://example.test/img","../"+signedName]){
  const view=page();view.api.oldest(view.root,{...report,product_art:{"A-001":ref}});assert.equal(view.root.tags("img").length,0);
 }
 const zero=page();zero.api.oldest(zero.root,{kind:"company",asat:report.asat,hire_count:0});
 assert.ok(zero.root.text.includes("No equipment was on hire"));
 const missing=page();missing.api.oldest(missing.root,{kind:"company",hire_count:0});
 assert.ok(missing.root.text.includes("cannot establish"));
 const person=page();person.api.oldest(person.root,{...report,kind:"person"});person.api.shift(person.root,{...report,kind:"person"});
 assert.equal(person.root.children.length,0);
});

test("archived snapshots without receipt evidence do not claim observed zero",()=>{
 const {root,api}=page();api.receipt(root,{kind:"person",handover:{latest_return:null},coverage:{}});
 assert.ok(root.text.includes("cannot establish"));
 const observed=page();observed.api.receipt(observed.root,{kind:"person",coverage:{transactions_asat:"2026-11-28",transaction_periods:[{}]},handover:{latest_return:null}});
 assert.ok(observed.root.text.includes("No dated return"));
 const large=page();large.api.receipt(large.root,{kind:"company",handover:{latest_return:{count:5,returned_at:"2026-11-26",precision:"date",items:Array(5).fill(item)}}});
 assert.equal(large.root.tags("details").length,1);assert.equal(large.root.tags("li").length,5);
});

test("company peak pills use reconciled hourly counts and retain joint peaks",()=>{
  const hours=[{start:"2026-11-27T06:00",issued:1,returned:2},{start:"2026-11-27T07:00",issued:3,returned:2}];
  const shift={name:"Day",start:hours[0].start,end:"2026-11-27T18:00",hourly:hours,issued:4,returned:4,
    peak_issue_hours:[hours[0].start],peak_return_hours:[]};
  const view=page();view.api.shift(view.root,{kind:"company",handover:{shift}});
  assert.deepEqual(view.pills,[[3,4],[2,4]]);
  assert.ok(view.root.text.includes("2 of 4 in each hour"));
  for(const hourly of [[{...hours[0],issued:7}], [hours[1],hours[1]], [{...hours[0],issued:null}]]){
    const invalid=page();invalid.api.shift(invalid.root,{kind:"company",handover:{shift:{...shift,returned:null,hourly}}});
    assert.deepEqual(invalid.pills,[]);
    assert.ok(invalid.root.text.includes("Peak unavailable"));
  }
});
