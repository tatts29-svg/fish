// Author: Andrew Fisher. Generic native presentation-contract checks; no service writes.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let calls = [], checks = 0;
const ctx = {esc,
  destinationOf: a => ({known:!a.unknown,text:a.location,source:'Schedule',quoted:!!a.unknown,quote:a.unknown?'Source destination is unconfirmed.':''}),
  dest782:a=>a.mapped?{sms:'master plan'}:null, ldPlace:a=>a.location || '', ldWhat:r=>r.a.item,
  ldTicks:a=>'<span class="ld-tks">'+esc(a.tick || '')+'</span>',
  timeline841Lights:v=>{calls.push(['lights',v]);return '<span class="tl841-gantry" data-tl841-stage="'+v.stage+'">'+Array(5).fill('<i></i>').join('')+'</span>';},
  timeline841State:a=>({stage:a.stage,label:a.status,word:a.status,tone:a.stage===5?'green':'red',why:'Native evidence'}),
  ldId:(d,g)=>d.iso+'|'+g.kind+'|'+g.rows[0].a.key,
  ldGo751:g=>{calls.push(['directions',g]);return g.rows.some(r=>r.a.mapped)?'<div class="ld-go"><a class="ld-qr" href="https://example.invalid/maps">QR</a><a class="ld-nav" href="https://example.invalid/maps">Navigate</a></div>':'';},
  timeline841Actions:(d,g,n)=>{calls.push(['actions',d,g,n]);return g.kind==='deliveries'?'<div class="tl841-actions">'+g.rows.map(r=>'<button data-tl841-open="'+esc(r.a.key)+'">Progress</button>').join('')+'<button data-tl841-print="'+d.iso+'" data-tl841-only="'+(n-1)+'">Print</button></div>':'';},
  dayCards:(rows,kind)=>{calls.push(['dayCards',rows,kind]);return '<div data-native-cards>'+kind+'</div>';},
  mms757Button:key=>'<button data-ldtxt="'+esc(key)+'">Text it</button>'};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'timeline846_src.js'),'utf8'),ctx);
const check=(truth)=>{assert.ok(truth);checks++;};
const d={iso:'2026-10-05'}, a={key:'TEST01',location:'A long destination & location',item:'Generic equipment',mapped:true,stage:1,status:'Off site'}, b={key:'TEST02',location:'Second location',item:'Different equipment',stage:5,status:'Finished'};
let g={kind:'deliveries',rows:[{a}],time:'06:30',carrier:'Carrier & company'};
let html=ctx.timeline846Line(d,g,3,false,true);
check(html.includes('class="ld tl846 go"'));check(html.includes('data-ld="2026-10-05|deliveries|TEST01"'));check(html.includes('aria-expanded="false"'));
check(html.includes('data-tl841-only="2"'));check(html.includes('06:30'));check(html.includes('Carrier &amp; company'));check(html.includes('A long destination &amp; location'));check(html.includes('master plan'));
check(html.includes('class="ld-qr"'));check(!html.includes('data-native-cards'));check(html.includes('data-tl841-stage="1"'));check(calls.find(c=>c[0]==='actions')[2]===g);
calls=[];g={kind:'deliveries',rows:[{a},{a:b}],time:null,carrier:null};html=ctx.timeline846Line(d,g,8,true,false);
check(html.includes('class="ld tl846 go on multi"'));check((html.match(/data-tl846-ref=/g)||[]).length===2);check((html.match(/class="tl841-gantry"/g)||[]).length===2);check(html.includes('data-tl841-stage="5"'));
check(html.includes('data-tl841-only="7"'));check(html.includes('aria-controls="ldb-2026-10-05-deliveries-TEST01"'));check(html.includes('id="ldb-2026-10-05-deliveries-TEST01"'));check(calls.find(c=>c[0]==='dayCards')[1]===g.rows);check((html.match(/data-ldtxt=/g)||[]).length===2);
g={kind:'removals',rows:[{a:{...b,mapped:false}}]};html=ctx.timeline846Line(d,g,2,false,false);check(html.includes('class="ld tl846 out"'));check(!html.includes('data-tl841-print'));check(!html.includes('class="ld-go"'));
html=ctx.timeline846Line(d,{kind:'deliveries',rows:[{a:{...a,key:'TEST<&"',location:'<unsafe>',unknown:true,mapped:false}}]},1,false,false);check(html.includes('TEST&lt;&amp;&quot;'));check(!html.includes('<unsafe>'));check(html.includes('Source destination is unconfirmed.'));
console.log('PASS '+checks+' native Timeline presentation checks');
