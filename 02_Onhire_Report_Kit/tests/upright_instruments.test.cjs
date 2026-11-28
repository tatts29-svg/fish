const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../showcase_page.html'), 'utf-8');
function functions(first, next) {
  return html.slice(html.indexOf('function '+first+'('), html.indexOf('function '+next+'('));
}

function fixture(staticMode = false) {
  const ctx = vm.createContext({
    STATIC:staticMode, mmgDugaldRiver:true, uid:0, fmt:String, esc:String,
    chartLayout:(_, width, render)=>render(width),
  });
  vm.runInContext(functions('nice','chartLayout') + functions('liquidStreams','lineChart') +
    functions('cyl','curvedGlass'), ctx);
  return ctx;
}

test('mixed stacks have one measured top and exact adjacent layers down to a fraction of a unit',()=>{
  const ctx=fixture();
  const result=ctx.columnVessel(20,40,0,100,v=>100-v,[
    {v:2.25,c:'base'},{v:6,c:'middle'},{v:.25,c:'top'},
  ],7,true);
  assert.equal(result.match(/class="glass-vessel"/g).length,1);
  assert.equal(result.match(/class="liquid-volume"/g).length,1);
  const bands=[...result.matchAll(/<rect class="(\w+) liquid-base" x="0" y="([^"]+)" width="[^"]+" height="([^"]+)"/g)];
  assert.deepEqual(bands.map(m=>[m[1],+m[2],+m[3]]),[['base',6.25,2.25],['middle',.25,6],['top',0,.25]]);
  const cap=result.match(/<ellipse class="top liquid-cap" cx="[^"]+" cy="([^"]+)" rx="[^"]+" ry="([^"]+)"/);
  assert.ok(cap && +cap[1]+ +cap[2]<=.25);
  assert.ok(result.includes('translate(0 -8.5)'));
});

test('empty, invalid, full and over-range upright gauges preserve the scale and the displayed count',()=>{
  const ctx=fixture();
  const draw=(on,fleet)=>ctx.cyl({name:'Type',on,fleet},{share:true});
  const zero=draw(0,7);
  assert.ok(zero.includes('class="glass-vessel"'));
  assert.doesNotMatch(zero,/liquid-volume|liquid-bubble|surface-pop|footlight|unknown-reading/);
  assert.match(draw(null,5),/unknown-reading/);
  assert.match(draw(null,5),/<span class="val">—</);
  assert.match(draw(0,0),/unknown-reading/);
  for(const on of [7,9]){
    const full=draw(on,7);
    assert.ok(full.includes('height="140"') && full.includes('translate(5.5 18)'));
    assert.match(full,new RegExp('data-n="'+on+'"'));
  }
  const inconsistent=ctx.cyl({name:'Type',on:9,fleet:7},{share:true,checkFleet:true});
  assert.match(inconsistent,/unknown-reading/);
  assert.match(inconsistent,/9<\/span>/);
  assert.match(inconsistent,/of 7 on site · verify fleet count/);
  assert.doesNotMatch(inconsistent,/liquid-volume/);
  const small=draw(.001,100);
  assert.doesNotMatch(small,/surface-pop|liquid-bubble/);
  assert.match(small,/class="liquid-volume"/);
});

test('zero and missing bins render differently and integer-count axes never mark fractional assets',()=>{
  const ctx=fixture(), el={};
  ctx.columns(el,['05','06','07'],[{v:[1,0,null],cls:'ca'}],{glass:true,tip:i=>'Count '+i});
  assert.equal(el.innerHTML.match(/class="glass-vessel"/g).length,3);
  assert.equal(el.innerHTML.match(/class="liquid-volume"/g).length,1);
  assert.equal(el.innerHTML.match(/unknown-reading/g).length,1);
  assert.match(el.innerHTML,/07 · Reading unavailable/);
  assert.doesNotMatch(el.innerHTML,/>0\.5<|NaN|Infinity/);
  const clear={replaceChildren(){this.empty=true}};
  ctx.columns(clear,[],[],{});
  assert.ok(clear.empty);
});

test('static exports omit particle markup but preserve the measurement',()=>{
  const ctx=fixture(true);
  const result=ctx.cyl({name:'Type',n:25},{max:100});
  assert.match(result,/height="35"/);
  assert.doesNotMatch(result,/liquid-bubble|surface-pop/);
});

test('a chart shares optics per series and each exposed cap uses its top band’s colour',()=>{
  const ctx=fixture(), el={};
  ctx.columns(el,['05','06'],[{v:[5,7],cls:'ca'},{v:[2,0],cls:'cb'}],{glass:true,tip:String});
  const chart=el.innerHTML;
  assert.equal((chart.match(/class="up-wall"/g)||[]).length,2);
  const [first,second]=chart.split('class="column-reading').slice(1);
  assert.match(first,/<ellipse class="cb liquid-cap"[^>]+#chart-ink\d+-cb-cap/);
  assert.match(second,/<ellipse class="ca liquid-cap"[^>]+#chart-ink\d+-ca-cap/);
  assert.match(first,/data-motion-gauge style="--reading-delay:150ms"/);
  assert.match(second,/data-motion-gauge style="--reading-delay:230ms"/);
  for(const [,ink] of chart.matchAll(/url\(#(chart-ink[^)]+)\)/g))assert.ok(chart.includes(`id="${ink}"`),ink);
  const tank=ctx.cyl({name:'Test',on:65,fleet:100},{share:true,index:2});
  assert.match(tank,/data-motion-gauge style="--reading-delay:310ms"/);
  assert.match(tank,/class="upright-rise"[\s\S]+class="liquid-base"|class="upright-rise"[\s\S]+ liquid-base"/);
  assert.match(tank,/data-n="65"/);
});
