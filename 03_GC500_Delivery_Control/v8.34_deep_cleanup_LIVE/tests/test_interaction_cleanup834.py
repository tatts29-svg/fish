"""Author: Andrew Fisher. Source guards and synthetic interaction regressions."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import interaction_cleanup834 as patch


class InteractionTests(unittest.TestCase):
    def node(self, script):
        result = subprocess.run(['node', '-'], input=script, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_scroll_anchor_horizontal_context_and_focus(self):
        self.node(patch.HELPER + r'''
const assert = require('assert/strict');
let current, active, raf, state = {tab:'pricing'}, focused;
const main = {scrollTop:1000};
let arrivalRemoved=false;
const pane = {isConnected:true, classList:{remove:key=>{assert.equal(key,'arrive');arrivalRemoved=true;}}, contains:n=>n===current, querySelectorAll:()=>current?[current]:[]};
const $ = s=>s==='main'?main:pane;
const document = {get activeElement(){return active;}};
const requestAnimationFrame = fn=>{raf=fn;};
function control(y, left=0, value='row', on='1') {
 const attrs={'data-lab-all':value,'data-on':on}, wrap={scrollLeft:left};
 return {wrap,selectionStart:null,hasAttribute:k=>k in attrs,getAttribute:k=>attrs[k]??null,
   closest:()=>wrap,getBoundingClientRect:()=>({top:y-main.scrollTop}),
   focus:options=>{assert.equal(options.preventScroll,true);focused=true;active=current;}};
}
current=control(1400,443);active=current;
let calls=0; const result=pricingAction834(current,()=>{calls++;current=control(1700);return 9;});
assert.equal(result,9);assert.equal(calls,1);assert.equal(main.scrollTop,1300);
assert.equal(arrivalRemoved,true);
assert.equal(current.getBoundingClientRect().top,400);assert.equal(current.wrap.scrollLeft,443);assert.equal(focused,true);
raf();assert.equal(main.scrollTop,1300);assert.equal(current.getBoundingClientRect().top,400);
// A queued frame must not overwrite a newer rendering or navigation.
current=control(2500);main.scrollTop=1800;raf();assert.equal(main.scrollTop,1800);
current=control(2200,80);active=current;
pricingAction834(current,()=>{state.tab='about';current=control(3000);main.scrollTop=77;});
assert.equal(main.scrollTop,77);
state.tab='pricing';main.scrollTop=1000;current=control(1400,60);active=current;
assert.throws(()=>pricingAction834(current,()=>{current=control(1500);throw Error('synthetic');}),/synthetic/);
assert.equal(current.getBoundingClientRect().top,400);assert.equal(current.wrap.scrollLeft,60);
''')

    def test_tick_setter_keeps_one_full_render_and_original_arguments(self):
        self.node(patch.HELPER + r'''
const assert = require('assert/strict');
const button={dataset:{labAll:'Trade|Item|install',on:'1'},hasAttribute:()=>false};
const $=()=>({querySelectorAll:()=>[button]});
let seen, full=0, partial=0, answer=3;
function setLabourAll(...args){seen=args;if(answer!==false)full++;return answer;}
function flash(){}
function renderPricing(){partial++;}
''' + patch.NEW_TICK + r'''
button.onclick();assert.deepEqual(seen,['Trade','Item','install',true]);assert.equal(full,1);assert.equal(partial,0);
button.dataset.on='0';button.onclick();assert.equal(seen[3],false);assert.equal(full,2);
answer=false;button.onclick();assert.equal(full,2);assert.equal(partial,0);
''')

    def test_rate_change_retains_write_semantics_and_complete_render(self):
        script = r'''
const assert=require('assert/strict');
const input={dataset:{rk:'synthetic-rate'},value:'7.5',hasAttribute:()=>false};
const $=()=>({querySelectorAll:()=>[input]});
let allow=true,actor='Test author',saved=0,full=0,partial=0,stamp;
const S={rates:{}};
function mayWrite(){return allow;} function whoAmI(){return actor;}
function stampIt(...args){stamp=args;} function save(){saved++;}
function render(){full++;} function renderPricing(){partial++;}
''' + patch.NEW_RATE + r'''
input.onchange();assert.equal(S.rates['synthetic-rate'],'7.5');assert.deepEqual(stamp,['rates','synthetic-rate','Test author']);assert.equal(saved,1);assert.equal(full,1);assert.equal(partial,0);
input.value='';input.onchange();assert.equal('synthetic-rate' in S.rates,false);assert.equal(saved,2);
allow=false;input.value='9';input.onchange();assert.equal(saved,2);assert.equal('synthetic-rate' in S.rates,false);
'''
        self.node(patch.HELPER + script)
        self.node(patch.HELPER + script.replace("rk:", "ak:").replace("rates", "accRates").replace("data-rk", "data-ak").replace("dataset.rk", "dataset.ak"))

    def test_existing_setter_arguments_success_and_rejected_edits(self):
        for handler, dataset, key, setter, expected in (
                (patch.NEW_MINIMUM, 'min', 'Trade|Item', 'setMinDays', ['Trade', 'Item', '2']),
                (patch.NEW_HOURS, 'hrs', 'Role|date', 'setEventHours', ['Role', 'date', '2']),
                (patch.NEW_SCOPE, 'scope', 'rate|Role', 'setScope', ['rate', 'Role', None, '2'])):
            with self.subTest(setter=setter):
                self.node(patch.HELPER + f'''
const assert=require('assert/strict');
const input={{dataset:{{{dataset}:{json.dumps(key)}}},value:'2',hasAttribute:()=>false}};
const pane={{querySelectorAll:()=>[input]}},$=()=>pane;
let full=0,partial=0,accepted=true,seen;
function {setter}(...args){{seen=args;if(accepted)full++;return accepted;}}
function render(){{full++;}} function renderPricing(){{partial++;}}
{handler}
input.onchange();assert.deepEqual(seen,{json.dumps(expected)});assert.equal(full,1);assert.equal(partial,0);
accepted=false;input.onchange();assert.equal(full,2);assert.equal(partial,0);
''')
        self.node(patch.HELPER + r'''
const assert=require('assert/strict');
const input={dataset:{scope:'time|entertainment_concludes|date'},value:'00:00',hasAttribute:()=>false};
const pane={querySelectorAll:()=>[input]},$=()=>pane;
let seen;function setScope(...args){seen=args;return true;} function render(){}
''' + patch.NEW_SCOPE + r'''
input.onchange();assert.deepEqual(seen,['time','entertainment_concludes','date','none']);
''')

    @unittest.skipUnless(os.environ.get('BASE'), 'Set private BASE for exact-source checks')
    def test_exact_private_source_and_canonical_numbers(self):
        source = Path(os.environ['BASE']).read_text()
        candidate = patch.apply(source)
        with self.assertRaises(ValueError):
            patch.apply(candidate)
        with self.assertRaises(ValueError):
            patch.apply(source.replace('function labourSource832(', 'function changedSource('))
        # Reconstruct every permitted edit: all business data and unrelated source
        # bytes, including staffing, must be untouched.
        restored = candidate.replace(patch.HELPER, '', 1)
        for old, new in patch.HANDLERS:
            restored = restored.replace(new, old, 1)
        restored = restored.replace('const rows = itemRows(a), loc = localSupplied(a.key);\n const nums = [...new Set(assetNumbersOf(a).map(n => String(n).trim()).filter(Boolean))];',
                                    'const rows = itemRows(a), loc = localSupplied(a.key), com = CROW.get(a.key) || {};\n const nums = (com.asset_numbers_supplied || []).concat(loc.asset_numbers || []);', 1)
        restored = restored.replace('${nums.length ? `<p class="norate">Asset numbers: <b class="mono">${nums.map(esc).join(\', \')}</b></p>` : \'\'}',
                                    '${nums.length ? `<p class="norate">Recorded on site: <b class="mono">${nums.map(esc).join(\', \')}</b></p>` : \'\'}', 1)
        self.assertEqual(restored, source)
        start = candidate.index('function suppliedBlock(a){')
        end = candidate.index('\nfunction wireSupplied(', start)
        self.node(candidate[start:end] + r'''
const assert=require('assert/strict');
let canonical=[' current ', 'current'];
const itemRows=()=>[],localSupplied=()=>({asset_numbers:['stale-local']}),allVariances=()=>[],assetNumbersOf=()=>canonical;
const S={operator:''},esc=x=>String(x),CROW=new Map([['example',{asset_numbers_supplied:['stale-source']}] ]);
const html=suppliedBlock({key:'example'});
assert.equal(html.includes('stale-source'),false);assert.equal(html.includes('stale-local'),false);
assert.equal((html.match(/>current</g)||[]).length,1);
assert.equal(html.includes('Asset numbers:'),true);assert.equal(html.includes('Recorded on site:'),false);
canonical=[];assert.equal(suppliedBlock({key:'example'}).includes('Asset numbers:'),false);
''')
        if os.environ.get('COMPONENT_OUT'):
            Path(os.environ['COMPONENT_OUT']).write_text(candidate)
        print(json.dumps({'base_sha256': hashlib.sha256(source.encode()).hexdigest(),
                          'component_sha256': hashlib.sha256(candidate.encode()).hexdigest(),
                          'every_other_source_byte_preserved': True}))


if __name__ == '__main__':
    unittest.main()
