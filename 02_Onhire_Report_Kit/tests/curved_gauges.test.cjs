const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const page = fs.readFileSync(path.join(__dirname, '..', 'showcase_page.html'), 'utf8');
function source(from, until) {
  const a = page.indexOf(from);
  const b = page.indexOf(until, a);
  assert.ok(a >= 0 && b > a, 'Template contains ' + from);
  return page.slice(a, b);
}

function instruments(options = {}) {
  const els = new Map();
  const select = key => {
    if (!els.has(key)) els.set(key, {
      innerHTML: '', style: {setProperty() {}},
      insertAdjacentHTML(_, html) { this.innerHTML += html; }
    });
    return els.get(key);
  };
  const ctx = vm.createContext({$: select, STATIC: false, stats() {}, columns() {}, ...options});
  vm.runInContext('let uid=0;' + source('const fmt=n=>', 'const QS=') +
    source('function curvedGlass(', '/* ---------- overview') +
    source('const money=v=>', 'if(D.costs){const C='), ctx);
  return { run: code => vm.runInContext(code, ctx), els };
}

test('semicircles and rings end at the exact measured angle, with no angular caps', () => {
  const {run} = instruments();
  for (const [r, width, start, sweep] of [[70,14,Math.PI,Math.PI],[100,18,-Math.PI/2,2*Math.PI],[45,8,Math.PI,Math.PI]]) {
    for (const f of [0.0001, 0.125, 0.5, 0.9999, 1]) {
      const html = run(`curvedGlass(${r},${width},${start},${sweep},${f})`);
      const shape = html.match(/<path class="curve-fill" d="([^"]+)"/)[1];
      const arcs = [...shape.matchAll(/A[\d.]+ [\d.]+ 0 0 ([01]) ([-\d.]+) ([-\d.]+)/g)];
      assert.equal(arcs.length,4);
      const a = start+sweep*f;
      const near = (actual, expected) => assert.ok(Math.abs(actual-expected)<0.00001);
      near(+arcs[1][2], (r+width/2)*Math.cos(a));
      near(+arcs[1][3], (r+width/2)*Math.sin(a));
      near(+arcs[3][2], (r-width/2)*Math.cos(start));
      near(+arcs[3][3], (r-width/2)*Math.sin(start));
      assert.match(html,/clip-path="url\(#curved\d+-glow\)"/);
      assert.match(html,/clip-path="url\(#curved\d+-fill\)"/);
      if (f===1) {
        assert.equal(shape, html.match(/<path class="curve-shell" d="([^"]+)"/)[1]);
        if (sweep===2*Math.PI) assert.doesNotMatch(html,/curve-meniscus/);
      }
    }
  }
});

test('readings distinguish exact zero, near endpoints, full, and unavailable', () => {
  const {run} = instruments();
  const dial = (n,d) => run(`dial(${n},${d},'Tooling','Fleet at pull')`);
  for (const [n,d,text] of [[0,10,'0%'],[1,10000,'&lt;0.1%'],[1,2,'50%'],[9999,10000,'&gt;99.9%'],[10,10,'100%']]) {
    const html = dial(n,d);
    assert.ok(html.includes('<div class="big">'+text+'</div>'));
    assert.ok(html.includes('data-fraction="'+n/d+'"'));
    assert.doesNotMatch(html,/data-n=/);
    if (!n) assert.doesNotMatch(html,/curve-fill|curve-aura|curve-bubble|curve-pop/);
  }
  for (const [n,d,reason] of [[0,0,'No assets in scope'],[null,12,'Count unavailable'],[4,null,'Count unavailable'],[14,12,'Check counts']]) {
    const html = dial(n,d);
    assert.match(html,/data-unavailable="true"/);
    assert.ok(html.includes(reason));
    assert.doesNotMatch(html,/curve-fill|curve-bubble|data-fraction=|NaN|Infinity/);
  }
});

test('scheduled cost ring handles partial, zero-charge and missing totals', () => {
  for (const [sofar,total,reading] of [[75,150,'50% of $150.00'],[0,0,'No scheduled cost'],[null,100,'Share unavailable'],[100,null,'Share unavailable']]) {
    const costs={sofar,total,upto:'Fri 1 Jan',days:[{date:'Fri 1 Jan',done:true,total:sofar,running:sofar}],roster:[],people:[],rates:[],cats:[],starts:{},hours:0,hours_done:0,days_done:1};
    const {run,els}=instruments({D:{costs}});
    run('initCosts()');
    const html=els.get('#cs-ring').innerHTML;
    assert.ok(html.includes(reading));
    assert.match(els.get('#cs-roster').innerHTML,/Total labour.*?\$0\.00/);
    assert.match(els.get('#cs-lead').textContent,/scheduled through the end of Fri 1 Jan/);
    if (!sofar || !total) assert.doesNotMatch(html,/curve-fill|curve-bubble|data-fraction=|NaN|Infinity/);
    assert.doesNotMatch(els.get('#cs-stats').innerHTML,/NaN|Infinity/);
  }
});
