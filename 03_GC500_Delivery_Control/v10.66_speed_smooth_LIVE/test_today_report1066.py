"""Author: Andrew Fisher. Hidden report work and print freshness regressions."""
import json
import subprocess
import unittest

import today_report1066 as patch


class TodayReportTests(unittest.TestCase):
    def test_exact_replacements_preserve_actions_and_refuse_reapply(self):
        source = '\n'.join([
            patch.HEAD_ANCHOR,
            '<div class="head"><div class="hacts">date, Email, Print, Showcase</div>',
            patch.PANEL,
            '<div class="pstamp">unchanged report footer</div></div>',
            patch.EARLY_PRINT, patch.BUTTON,
        ])
        result = patch.apply(source, 'synthetic source')
        self.assertIn('<div class="hacts">date, Email, Print, Showcase</div>', result)
        self.assertIn('<div class="pstamp">unchanged report footer</div>', result)
        self.assertIn(patch.EARLY_PRINT_NEW, result)
        self.assertIn(patch.BUTTON_NEW, result)
        with self.assertRaises(SystemExit):
            patch.apply(result, 'repeat')

    def test_hidden_screen_print_and_freshness_paths(self):
        script = r'''
const assert=require('node:assert/strict');
const classes=(...names)=>({values:new Set(names),contains(n){return this.values.has(n);},add(...ns){ns.forEach(n=>this.values.add(n));},remove(...ns){ns.forEach(n=>this.values.delete(n));}});
let host=null,root=null,financeCalls=0,wireCalls=0,draws=[],shells=0,epoch=0,printMedia=false,disconnects=0;
let state={tab:'today'},folds=[{open:false},{open:true}];
const originalFolds=JSON.stringify(folds),actions={date:{},email:{},print:{},showcase:{}};
const pane={parentElement:{id:'pane-today'},classList:classes('wwa793'),actions,
 querySelector(selector){if(selector==='section.wip')return root;return host;}};
const document={body:{classList:classes()},getElementById(id){return id==='pane-progress'?pane:null;}};
const handlers={};
const window={addEventListener(name,fn){(handlers[name]||=[]).push(fn);},matchMedia(){return {matches:printMedia};}};
const dispatch=name=>(handlers[name]||[]).forEach(fn=>fn());
let cancelled=[],cleared=[];
const cancelAnimationFrame=id=>cancelled.push(id),clearTimeout=id=>cleared.push(id);
const WIP={raf:14,swapT:25,ro:{disconnect(){disconnects++;}},model:{old:true}};
const esc=x=>String(x).replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('&','&amp;');
const carryContext1066=()=>({epoch,config:1}),sameCarry1066=(a,b)=>!!a&&Object.keys(b).every(k=>a[k]===b[k]);
let held=0;const holdAssets=fn=>{held++;try{return fn();}finally{held--;}};
const nativeMarkup=day=>'<section class="wip" data-day="'+day+'"><span>synthetic current record '+epoch+'</span></section>';
const wipPanel=day=>{financeCalls++;WIP.model={mode:{due:{v:73.25}},day};return nativeMarkup(day);};
const wipWire=p=>{assert.equal(held,1,'print calculations must share a native held read');assert.strictEqual(p,pane);wireCalls++;WIP.raf=80;WIP.swapT=90;};
const wipDraw=(r,v)=>{draws.push(v);},wipShell=()=>shells++;
function mountDeferred(day){
 const html=TodayReport1066.html(day);
 assert.equal(html,'<div class="chero" data-wip1066-day="'+day+'"></div>');
 root=null;
 host={dataset:{wip1066Day:day},value:'',get innerHTML(){return this.value;},set innerHTML(value){this.value=value;root={dataset:{mode:'due'},classList:classes('enter','moving')};}};
 return host;
}
// This is the earlier native beforeprint handler's ordering: mark printing
// before an optional full lazy-report redraw, then leave fold handling alone.
let redrawAtPrint=false;
window.addEventListener('beforeprint',()=>{
 TodayReport1066.begin();
 if(redrawAtPrint){host=null;root={dataset:{mode:'due'},classList:classes('enter')};pane.printedHtml=TodayReport1066.html('2030-01-04');}
});
'''
        script += patch.RUNTIME + r'''
// A normal Today render leaves its already-hidden panel empty and stops old work.
let current=mountDeferred('2030-01-02');
assert.equal(financeCalls,0);assert.equal(wireCalls,0);assert.equal(disconnects,1);
assert.equal(WIP.model,null);assert.ok(cancelled.includes(14));assert.ok(cleared.includes(25));
assert.strictEqual(pane.actions,actions);assert.equal(JSON.stringify(folds),originalFolds);
// Native Print first flushes synchronously. Browser beforeprint then sees the
// same record and reuses that exact native markup, with a final gauge value.
assert.equal(TodayReport1066.flush(),true);
assert.equal(current.innerHTML,nativeMarkup('2030-01-02'));assert.equal(financeCalls,1);assert.equal(wireCalls,1);
assert.equal(draws.at(-1),73.25);assert.equal(root.classList.contains('moving'),false);
dispatch('beforeprint');assert.equal(financeCalls,1);assert.equal(wireCalls,1);
assert.equal(JSON.stringify(folds),originalFolds);assert.strictEqual(pane.actions,actions);
// A received save during a print session must invalidate the previous model.
epoch++;dispatch('beforeprint');assert.equal(financeCalls,2);assert.equal(wireCalls,2);
assert.equal(current.innerHTML,nativeMarkup('2030-01-02'));
dispatch('afterprint');
// Ctrl+P directly after a different day was rendered uses that exact as-of day.
current=mountDeferred('2030-01-03');assert.equal(financeCalls,2);
dispatch('beforeprint');assert.equal(financeCalls,3);assert.equal(WIP.model.day,'2030-01-03');
assert.equal(current.innerHTML,nativeMarkup('2030-01-03'));dispatch('afterprint');
// The existing early lazy redraw must render the native full panel even while
// print media has not switched yet. No deferred host survives that redraw.
mountDeferred('2030-01-04');redrawAtPrint=true;dispatch('beforeprint');
assert.equal(financeCalls,4);assert.equal(pane.printedHtml,'<div class="chero">'+nativeMarkup('2030-01-04')+'</div>');
assert.equal(draws.at(-1),73.25);dispatch('afterprint');redrawAtPrint=false;
// Standalone progress, detached embedded pane, showcase, explicit print mode,
// and print CSS are eager and retain the original native panel markup.
const eager=()=>{const before=financeCalls;assert.equal(TodayReport1066.html('2030-02-01'),'<div class="chero">'+nativeMarkup('2030-02-01')+'</div>');assert.equal(financeCalls,before+1);};
state.tab='progress';eager();assert.equal(TodayReport1066.flush(),false);state.tab='today';
pane.parentElement={id:'elsewhere'};eager();pane.parentElement={id:'pane-today'};
pane.classList.remove('wwa793');eager();pane.classList.add('wwa793');
document.body.classList.add('showing');eager();document.body.classList.remove('showing');
document.body.classList.add('printing-progress');eager();document.body.classList.remove('printing-progress');
printMedia=true;eager();printMedia=false;
// Returning to screen restores deferral; malformed stored dates fail closed.
current=mountDeferred('2030-02-02');const before=financeCalls;
current.dataset.wip1066Day='not-a-date';assert.throws(()=>TodayReport1066.flush(),/date is invalid/);
assert.equal(financeCalls,before);assert.equal(JSON.stringify(folds),originalFolds);
'''
        result = subprocess.run(['node', '-'], input=script, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
