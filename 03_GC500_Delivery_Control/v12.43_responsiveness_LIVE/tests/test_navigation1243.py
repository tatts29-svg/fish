"""Author: Andrew Fisher. Native navigation and refresh guards, with synthetic DOM.

Run with BASE pointing to the reviewed live HTML. No browser, network or records
are used. The original source is a negative control for both extra layout reads;
real CSS animation and phone timing remain the browser release checks.
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess


patch_file = Path(__file__).resolve().parent.parent / 'navigation1243_patch.py'
spec = importlib.util.spec_from_file_location('navigation1243_patch', patch_file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = Path(os.environ['BASE']).read_text()
patched = module.patch(base, 'synthetic-navigation.html')
checks = []


def refuse(text, label):
    try:
        module.patch(text, 'synthetic-navigation.html')
    except ValueError:
        checks.append(label)
    else:
        raise AssertionError(label)


refuse(patched, 'Repeated patch refuses')
refuse(base.replace(module.ARRIVAL_OLD, '', 1), 'Missing arrival target refuses')
refuse(base + module.ARRIVAL_OLD, 'Duplicate arrival target refuses')
refuse(base.replace(module.COSTS_OLD, '', 1), 'Missing Costs target refuses')
refuse(base + module.COSTS_OLD, 'Duplicate Costs target refuses')
refuse(base.replace('id="performance1241-script"', 'id="other-script"', 1),
       'Missing required performance release refuses')
styles = lambda text: re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
assert styles(base) == styles(patched)
assert '.pane{display:none;' in base and '.pane.on{display:block}' in base
assert '.pane.on.arrive{animation:paneIn ' in base
assert '.pane.on.arrive > *{animation:' in base
checks.append('Every stylesheet, pane entrance and child entrance animation remains unchanged')
assert patched.replace(module.ARRIVAL_NEW, module.ARRIVAL_OLD).replace(module.COSTS_NEW, module.COSTS_OLD) == base
checks.append('Only the two exact navigation targets change')


def fragments(text):
    go = text.split('function go776Held(tab){', 1)[1].split('/* ------------------------------------------------------------------ today', 1)[0]
    costs = text.split('let costsScroll1065 = 0;', 1)[1].split('const prev=window.costsAuditDecorate;', 1)[0]
    return {'go': 'function go776Held(tab){' + go, 'costs': 'let costsScroll1065 = 0;' + costs}


program = r"""
const assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const source = JSON.parse(fs.readFileSync(0, 'utf8')), checks = [];
function check(name, fn) { fn(); checks.push(name); }
function navigation(code) {
  const events = [], frames = []; let scroll = 500;
  const main = {get scrollTop() { events.push('scroll-read'); return scroll; }, set scrollTop(v) { scroll=v; events.push('scroll-set:'+v); }, scrollHeight:2000};
  function pane(key, size) {
    const classes = new Set(key === 'today' ? ['on','arrive'] : []), attrs = {}, heading = {};
    return {id:'pane-'+key, childElementCount:1, attrs, classes, heading,
      classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);}, remove(k){classes.delete(k);}, add(k){classes.add(k);}},
      setAttribute(k,v){attrs[k]=v;}, removeAttribute(k){delete attrs[k];},
      get offsetWidth(){throw new Error('stale pane layout');}, getElementsByTagName(){return {length:size};},
      set innerHTML(v){assert.equal(v,'');events.push('clear:'+key);},
      querySelector(){return heading;}, focus(options){events.push('focus:'+key);assert.equal(options.preventScroll,true);}};
  }
  const panes = [pane('today',4001),pane('costs',100),pane('map',100)], by = Object.fromEntries(panes.map(p=>[p.id,p]));
  const sandbox = {events, frames, panes, main, state:{tab:'today'}, TABS:[['today','Today'],['costs','Costs'],['map','Map']],
    TABS_OFF:new Set(), searchTimer:null, RACE_RAN:{costs:true}, GI_SEEN:{clear(){events.push('seen-clear');}},
    TAB_SCROLL:{costs:347}, GO_CHANGED:false, DATA:{event:{name:'Synthetic'}},
    document:{querySelectorAll(){return panes;}}, $:sel=>sel==='main'?main:by[sel.slice(1)]||null,
    window:{Flows1013:{depart(){events.push('depart');},arrive(){events.push('arrive');}}, Navigation934:{depart(){events.push('nav-depart');}}},
    boardStop(){events.push('board-stop');}, setHash(){events.push('hash');}, renderTabs(){events.push('tabs');},
    render(){assert.equal(sandbox.GO_CHANGED,true);assert.equal(sandbox.state.tab,'costs');assert.equal(panes[1].classes.has('on'),true);assert.equal(panes[0].attrs.hidden,'');events.push('render');},
    countUpFigures(){events.push('figures');}, requestAnimationFrame(fn){frames.push(fn);}, clearTimeout(){}, flash(){throw new Error('unexpected flash');}};
  sandbox.Navigation934=sandbox.window.Navigation934;
  vm.createContext(sandbox);vm.runInContext(code,sandbox); return sandbox;
}
check('Original arrival forces stale-pane layout (negative control)',()=>{
  const s=navigation(source.before.go);assert.throws(()=>s.go776Held('costs'),/stale pane layout/);
});
check('Arrival retains visibility, animation classes, accessibility, focus and saved tab scroll without stale layout',()=>{
  const s=navigation(source.after.go);s.go776Held('costs');
  assert.equal(s.state.tab,'costs');assert.equal(s.GO_CHANGED,false);
  assert.equal(s.TAB_SCROLL.today,500);assert.equal(s.main.scrollTop,347);
  assert.equal(s.panes[1].classes.has('arrive'),true);assert.equal(s.panes[0].classes.has('arrive'),false);
  assert.equal(s.panes[1].attrs.role,'tabpanel');assert.equal(s.panes[1].attrs['aria-labelledby'],'panehead-costs');
  assert.equal(s.panes[1].attrs.tabindex,'-1');assert.equal('hidden' in s.panes[1].attrs,false);
  assert.equal(s.panes[1].heading.textContent,'Costs — Synthetic');
  for(const [a,b] of [['depart','render'],['hash','render'],['clear:today','render'],['render','arrive'],['render','focus:costs'],['focus:costs','scroll-set:347']])assert.ok(s.events.indexOf(a)<s.events.indexOf(b),a+' precedes '+b);
  s.main.scrollTop=0;s.frames.shift()();assert.equal(s.main.scrollTop,347);
});
check('Same-tab refresh does not replay arrival, move focus or discard another pane',()=>{
  const s=navigation(source.after.go);s.go776Held('costs');s.events.length=0;
  s.render=()=>{assert.equal(s.GO_CHANGED,false);s.events.push('render');};s.go776Held('costs');
  assert.equal(s.panes[1].classes.has('arrive'),false);
  assert.deepEqual(s.events,['hash','tabs','render']);
});
function costs(code, arrival=false) {
  const frames=[],events=[],pane={};let scroll=400,reads=0;
  const main={isConnected:true,get scrollTop(){reads++;if(arrival)throw new Error('arrival scroll measurement');return scroll;},
    scrollTo(o){assert.equal(o.behavior,'instant');scroll=o.top;events.push('restore');}};
  const s={frames,events,pane,main,state:{tab:'costs'},location:{hash:'#costs'},GO_CHANGED:arrival,
    window:{Persistence1010:{intent:10}},document:{querySelector(){return main;},getElementById(){return s.pane;}},
    renderCosts:function(arg){events.push('native');s.receiver=this;s.argument=arg;scroll=250;return 'native-result';},
    tidy(){events.push('tidy');},requestAnimationFrame(fn){frames.push(fn);},
    readCount(){return reads;},setScroll(v){scroll=v;},getScroll(){return scroll;}};
  vm.createContext(s);vm.runInContext(code,s);return s;
}
check('Original Costs arrival reads layout (negative control)',()=>{
  const s=costs(source.before.costs,true);assert.throws(()=>s.renderCosts(),/arrival scroll measurement/);
});
check('Costs arrival draws once, retains receiver/argument/result and performs zero scroll measurements/restorations',()=>{
  const s=costs(source.after.costs,true),receiver={};assert.equal(s.renderCosts.call(receiver,'sentinel'),'native-result');
  assert.equal(s.receiver,receiver);assert.equal(s.argument,'sentinel');assert.equal(s.readCount(),0);
  assert.deepEqual(s.events,['native','tidy']);assert.equal(s.frames.length,0);
});
check('Costs refresh retains its saved position and performs one native draw',()=>{
  const s=costs(source.after.costs);s.renderCosts();assert.equal(s.frames.length,1);assert.equal(s.getScroll(),250);
  s.frames.shift()();assert.equal(s.getScroll(),400);assert.deepEqual(s.events,['native','tidy','restore']);
});
for(const [name,alter] of [
  ['navigation',s=>s.state.tab='map'],['hash change',s=>s.location.hash='#map'],
  ['new user intent',s=>s.window.Persistence1010.intent++],['pane replacement',s=>s.pane={}],
  ['detached scroller',s=>s.main.isConnected=false],['active tab transition',s=>s.GO_CHANGED=true],
  ['later user scroll',s=>s.setScroll(123)]
])check('Queued Costs restoration yields to '+name,()=>{
  const s=costs(source.after.costs);s.renderCosts();alter(s);const before=s.getScroll();s.frames.shift()();
  assert.equal(s.getScroll(),before);assert.equal(s.events.includes('restore'),false);
});
check('A second draw retires the first queued restoration',()=>{
  const s=costs(source.after.costs);s.renderCosts();s.setScroll(600);s.renderCosts();s.frames.shift()();
  assert.equal(s.getScroll(),250);assert.equal(s.events.includes('restore'),false);s.frames.shift()();assert.equal(s.getScroll(),600);
});
process.stdout.write(JSON.stringify(checks));
"""
result = subprocess.run(['node', '-e', program], input=json.dumps({'before': fragments(base), 'after': fragments(patched)}),
                        capture_output=True, text=True)
assert result.returncode == 0, result.stderr
checks.extend(json.loads(result.stdout))
print(json.dumps({'author': 'Andrew Fisher', 'suite': 'navigation1243 native synthetic controls',
                  'passed': len(checks), 'failed': 0, 'checks': checks}))
