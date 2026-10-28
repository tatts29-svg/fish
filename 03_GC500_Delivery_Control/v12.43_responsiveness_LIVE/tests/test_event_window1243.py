"""Author: Andrew Fisher. Event-window equivalence and per-call freshness."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest


HELPER = Path(__file__).resolve().parents[1] / 'event_window1243_patch.py'
SPEC = importlib.util.spec_from_file_location('event_window1243_patch', HELPER)
PATCH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PATCH)

NODE = r"""
'use strict';
const assert=require('node:assert/strict');
const {oldSource,newSource}=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
let checks=0;
function check(name,fn){fn();checks++;}
function rig(source,days){
 const e={days:Object.freeze(days.slice()),calls:0,error:null,hold:false};
 const api={current(){e.calls++;if(e.error)throw e.error;return {eventDays:e.days};}};
 // The live EventConfig1013.days proxy performs a fresh current() read for
 // every property. Its validated result is always a frozen array of strings.
 const proxy=new Proxy([],{get(_target,prop){const array=api.current().eventDays;const value=Reflect.get(array,prop,array);return typeof value==='function'?value.bind(array):value;}});
 e.window=new Function('EVENT_DAYS','EventConfig1013',source+';return eventWindow;')(proxy,api);
 e.set=next=>{e.days=Object.freeze(next.slice());};
 return e;
}
const states=[[],['2030-10-25'],['2030-10-25','2030-10-26','2030-10-27'],['2030-12-31','2031-01-01']];
check('every validated event-day shape returns the identical window',()=>{for(const days of states)assert.deepEqual(rig(newSource,days).window(),rig(oldSource,days).window());});
check('nonempty calls check current once instead of five times',()=>{const old=rig(oldSource,states[2]),next=rig(newSource,states[2]);assert.deepEqual(next.window(),old.window());assert.equal(old.calls,5);assert.equal(next.calls,1);});
check('an empty or rejected configuration remains null with one current read',()=>{for(const source of [oldSource,newSource]){const e=rig(source,[]);assert.equal(e.window(),null);assert.equal(e.calls,1);}});
check('in-place configuration edit is observed on the next invocation without save',()=>{const old=rig(oldSource,states[2]),next=rig(newSource,states[2]);old.window();next.window();old.set(states[3]);next.set(states[3]);assert.deepEqual(next.window(),old.window());assert.equal(next.window().from,'2030-12-31');});
check('an active native hold does not retain an event-window result',()=>{const old=rig(oldSource,states[2]),next=rig(newSource,states[2]);old.hold=next.hold=true;old.window();next.window();old.set([]);next.set([]);assert.equal(next.window(),old.window());old.set(states[1]);next.set(states[1]);assert.deepEqual(next.window(),old.window());});
check('returned windows stay fresh mutable objects, isolated from the frozen source',()=>{const e=rig(newSource,states[2]),first=e.window(),second=e.window();assert.notEqual(first,second);first.from='edited';first.days=99;assert.deepEqual(second,{from:'2030-10-25',to:'2030-10-27',days:3});assert.equal(Object.isFrozen(e.days),true);assert.deepEqual(e.window(),second);});
check('current failures propagate without interception or retry',()=>{for(const source of [oldSource,newSource]){const e=rig(source,states[2]),failure=new Error('synthetic configuration failure');e.error=failure;assert.throws(()=>e.window(),error=>error===failure);assert.equal(e.calls,1);e.error=null;assert.equal(e.window().days,3);}});
check('long sequences of valid and rejected updates remain equivalent',()=>{const old=rig(oldSource,[]),next=rig(newSource,[]);for(let i=0;i<400;i++){old.set(states[i%states.length]);next.set(states[i%states.length]);assert.deepEqual(next.window(),old.window());}});
console.log(JSON.stringify({passed:checks}));
"""


class EventWindowTests(unittest.TestCase):
    def test_exact_patch_and_refusals(self):
        text = 'prefix\n' + PATCH.OLD + '\nsuffix'
        result = PATCH.patch(text, 'synthetic.html')
        self.assertEqual(result, 'prefix\n' + PATCH.NEW + '\nsuffix')
        for source in (result, text + PATCH.OLD, text.replace('return null;', 'return undefined;'), 'unrelated'):
            with self.assertRaises(ValueError):
                PATCH.patch(source, 'synthetic.html')

    def test_event_window_freshness(self):
        result = subprocess.run(['node', '-e', NODE], input=json.dumps({'oldSource': PATCH.OLD, 'newSource': PATCH.NEW}), text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout), {'passed': 8})


if __name__ == '__main__':
    unittest.main()
