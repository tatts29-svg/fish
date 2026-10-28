"""Author: Andrew Fisher. Exact-base patch boundaries and extracted native empty-layer regression."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch43_1',ROOT/'patch_v12431.py')
patch43_1=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch43_1)

class Patch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=Path(os.environ['BASE']).read_text()
        cls.candidate=patch43_1.patch(cls.base)

    def test_boundaries(self):
        self.assertEqual(hashlib.sha256(self.base.encode()).hexdigest(),patch43_1.BASE_SHA)
        for bad in (self.base+' ',self.candidate,self.base.replace("+' · v12.43';","+' · v12.42.24';")):
            with self.assertRaises(ValueError):patch43_1.patch(bad)
        restored=self.candidate
        for before,after,label in reversed(patch43_1.replacements()):
            self.assertEqual(restored.count(after),1,label)
            restored=restored.replace(after,before)
        self.assertEqual(restored,self.base,'only exact approved anchors change')

    def test_native_empty_departure_layer(self):
        start=self.candidate.index('function departureFrame1211(){')
        end=self.candidate.index('\n  departureFrame1211();',start)
        native=self.candidate[start:end]
        native=native.replace(' complete897Pull();requestPaint();',' window.__ringTest=Offsite1225;complete897Pull();requestPaint();')
        script=r'''
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=JSON.parse(fs.readFileSync(0,'utf8')),jobs=new Map();let serial=1,clears=0,baseDraws=0;
let nativeStates=[{key:'SYN-A',collected:1,remaining:0,complete:true,issues:[],items:[],taken1229:[],label:'Left site',last:'synthetic'}];
const g={setTransform(){},clearRect(){clears++},save(){},restore(){},beginPath(){},arc(){},stroke(){},setLineDash(){}};
const doc={hidden:false,body:{classList:{contains(){return false}}},head:{appendChild(){}},createElement(){return {style:{},setAttribute(){},getContext(){return g}}},addEventListener(){}};
const c={document:doc,parent:{Departure1211:{mapStates:()=>nativeStates}},window:{frameElement:null,addEventListener(){}},norm:x=>String(x).toLowerCase(),
 mapHostStatus1009:()=>({states:[]}),mapStatus1009:()=>({shape:'square',glyph:'G',colour:'blue',fill:'navy'}),
 quantity1010View:()=>({}),drawMarks(){baseDraws++;return 'native draw'},ITEMS:[{code:'SYN-A',places:[[0,0,10,10]]}],
 marksDrawn:false,show(){},mcanvas:{width:500,height:300,parentNode:{insertBefore(){}},nextSibling:null},canvas:{width:500,height:300},
 sheetToDevice:()=>({}),toGeo:(x,y)=>({x,y}),applyM:(M,x,y)=>({x,y}),dpr:1,
 matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:class{constructor(cb){this.cb=cb}observe(target){this.cb([{target,isIntersecting:true,intersectionRatio:1}])}},MutationObserver:class{observe(){}},
 requestAnimationFrame:cb=>{const id=serial++;jobs.set(id,cb);return id},cancelAnimationFrame:id=>jobs.delete(id),requestPaint(){}};
c.window.referenceQuantity1010=()=>'';c.window.fitReference1010=()=>'';
c.complete897Pull=()=>c.mapHostStatus1009();vm.createContext(c);vm.runInContext(source+'\ndepartureFrame1211();',c);
assert.equal(c.drawMarks({scale:1}),'native draw');assert.equal(c.window.__ringTest.points.length,1);assert.equal(jobs.size,1);
const full=c.mapStatus1009(c.ITEMS[0]);assert.equal(full.shape,'square');assert.equal(full.glyph,'G');assert.equal(full.colour,'blue');assert.equal(full.fill,'navy');
nativeStates=[{...nativeStates[0],complete:false,remaining:2}];c.mapHostStatus1009();assert.equal(c.mapStatus1009(c.ITEMS[0]).shape,'square','partial departure keeps native shape');
nativeStates=[{...nativeStates[0],issues:['synthetic review']}];c.mapHostStatus1009();const review=c.mapStatus1009(c.ITEMS[0]);assert.equal(review.shape,'diamond');assert.equal(review.glyph,'!');
nativeStates=[];c.mapHostStatus1009();const before=clears;assert.equal(c.drawMarks({scale:1}),'native draw');
assert.equal(c.window.__ringTest.points.length,0,'actual native wrapper clears old points before empty-state return');assert.equal(jobs.size,0,'actual native wrapper stops stale pulse');assert.equal(clears,before+1,'actual native wrapper clears old ring bitmap');assert.equal(baseDraws,2,'underlying icon drawing remains called once per wrapper call');
console.log('15 actual native empty-layer and icon-preservation checks PASS');
'''
        result=subprocess.run(['node','-e',script],input=json.dumps(native),capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr);print(result.stdout.strip())

    def test_approved_picture_scope(self):
        for value in ("{key: 'site', halfM: 1600, bar: 500, word: 'Whole site'}","fr('close') + fr('wide') + fr('site')","site: 'Whole site'","grid-column:1/-1"):
            self.assertIn(value,self.candidate)
        self.assertIn("off:'#7fffc1',part:'#7fffc1',review:'#ffaaa3'",self.candidate)
        for name in ('picture_cache12431.js','picture_queue12431.js'):
            self.assertEqual(self.candidate.count((ROOT/name).read_text().rstrip()),1,'tested picture source is inserted unchanged: '+name)

if __name__=='__main__':unittest.main()
