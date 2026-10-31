"""Author: Andrew Fisher. Synthetic hold invalidation and banner paint regressions."""
import json
import subprocess
import unittest

import today_models1066 as patch


class TodayModelsTests(unittest.TestCase):
    def test_exact_replacements_refuse_reapply(self):
        source = '\n'.join([
            patch.BUILD_START,
            "    return '<section id=\"' + boardId + '\" data-tw841-groups-merged=\"'",
            patch.BUILD_END, patch.MOUNT, patch.REFLOW, patch.DRAW, patch.FOLD,
            patch.PRINT_ANCHOR,
        ])
        result = patch.apply(source, 'synthetic source')
        self.assertIn("HELD_MEMO.set('today-board1066|'", result)
        with self.assertRaises(SystemExit):
            patch.apply(result, 'repeat')

    def test_hold_lifetime_and_banner_paint_paths(self):
        snippets = {key: getattr(patch, key) for key in [
            'BUILD_START_NEW', 'BUILD_END_NEW', 'MOUNT_NEW', 'REFLOW_NEW',
            'DRAW_NEW', 'FOLD_NEW', 'PRINT_NEW',
        ]}
        script = 'const x=' + json.dumps(snippets) + ';' + r'''
const assert=require('node:assert/strict');
let ASSETS_HELD={},HELD_STALE775=false,HELD_MEMO=new Map(),configChange=false;
const window={EventConfig1013:{current(){if(configChange){HELD_STALE775=true;configChange=false;}}},listeners:{},addEventListener(n,f){this.listeners[n]=f;}};
const heldFresh775=()=>{if(ASSETS_HELD&&HELD_STALE775){ASSETS_HELD={};HELD_MEMO.clear();HELD_STALE775=false;}};
const heldMemo=(k,fn)=>{window.EventConfig1013.current();if(!ASSETS_HELD)return fn();heldFresh775();if(HELD_MEMO.has(k))return HELD_MEMO.get(k);const v=fn();HELD_MEMO.set(k,v);return v;};
let areas,workSummary,overallFencing,changeInside=false,now='2030-01-02';
const rememberFolds=()=>{},todayWorkMetrics840=day=>({day});
const buildBody=x.BUILD_START_NEW+"\nworkSummary={day:asOf};overallFencing={day:asOf};const built1066='unchanged markup';if(changeInside)HELD_STALE775=true;\n"+x.BUILD_END_NEW.split('  function board()')[0];
eval(buildBody+';globalThis.buildTest=build;');
const todayWorkDay841=()=>now,pane={querySelector(){return null;}},progress881Model=(...args)=>args;
eval('function mountTest(){'+x.MOUNT_NEW+';return m;}globalThis.mountTest=mountTest;');
assert.equal(buildTest(now),'unchanged markup');
let model=mountTest();assert.equal(model.length,3);assert.strictEqual(model[1],workSummary);assert.strictEqual(model[2],overallFencing);
now='2030-01-03';assert.equal(mountTest().length,1,'different day must not reuse');
now='2030-01-02';HELD_STALE775=true;assert.equal(mountTest().length,1,'save must invalidate');
buildTest(now);configChange=true;assert.equal(mountTest().length,1,'event configuration must invalidate');
buildTest(now);ASSETS_HELD=null;assert.equal(mountTest().length,1,'outside hold must use native model');
ASSETS_HELD={};HELD_MEMO.clear();changeInside=true;buildTest(now);assert.equal(HELD_MEMO.size,0,'a changed build must not share');changeInside=false;
let width=0,fit=0,paint=0,reads=0;
const board={isConnected:true,getBoundingClientRect(){return {width};}},BOARD_RUN={w:0},size=()=>fit++,boardPages=()=>{reads++;return [1];};const asOf='',X={};
eval(x.REFLOW_NEW+' BOARD_RUN.w=w; };globalThis.reflowTest=reflow;');
eval(x.DRAW_NEW+' paint++; };globalThis.drawTest=draw;');
reflowTest();drawTest();assert.equal(fit+paint+reads,0,'hidden banner must not calculate or paint');
width=320;reflowTest();drawTest();assert.equal(fit,1);assert.equal(paint,1);
BOARD_RUN.redraw=drawTest;BOARD_RUN.reconcile=()=>{};let d={open:true};
eval('function toggleTest(){'+x.FOLD_NEW.split('  });')[0]+'};globalThis.toggleTest=toggleTest;');
toggleTest();assert.equal(paint,2,'open must paint without a ResizeObserver');d.open=false;toggleTest();assert.equal(paint,2);
eval(x.PRINT_NEW.slice(x.PRINT_NEW.indexOf('/* v10.66:')));
window.listeners.beforeprint();assert.equal(paint,3,'visible print must paint before its next frame');
width=0;window.listeners.beforeprint();assert.equal(paint,3,'print must not paint a hidden banner');
'''
        result = subprocess.run(['node', '-'], input=script, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
