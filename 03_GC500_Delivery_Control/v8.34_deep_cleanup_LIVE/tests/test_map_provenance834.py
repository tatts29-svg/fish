"""Entry-distance provenance and calculation checks. Author: Andrew Fisher."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from map_provenance834 import NEW_TOOLTIP, OLD_TOOLTIP, REPLACEMENTS, apply


# Synthetic sources only; the original entryToDrop control flow is exercised intact.
ENTRY_FUNCTION = '''function entryToDrop(ref){
 const e = entryOf(ref); if (!e || e.lat == null) return null;
 const a = assetOf(ref); if (!a) return null;
 const best = bestPinFor(a);
 let to = null, basis = null;
 if (best && best.fix && best.fix.lat != null) { to = {lat: best.fix.lat, lon: best.fix.lon}; basis = 'the pinned spot'; }
 else { const pt = aerialPointFor(a), ll = pt ? lonLatOf(pt.ax, pt.ay) : null;
 if (ll) { to = ll; basis = "the drawing's callout"; } }
 if (!to) return null;
 return {m: Math.round(haversineKm(e, to) * 1000), basis: basis};
}
'''
FIXTURE = ENTRY_FUNCTION + '\nconst tooltip = `' + OLD_TOOLTIP + '`;\n'


class MapProvenance834Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.patched = apply(FIXTURE)
        script = r'''
const vm = require('node:vm');
const sources = JSON.parse(process.argv[1]);
const make = (name, options = {}) => ({name, entry:{lat:1,lon:2}, asset:{key:name}, fix:{lat:3,lon:4,master:true}, source:null, ...options});
const cases = [
 make('master'),
 make('confirmed',{source:{kind:'confirmed'}}),
 make('unverified',{source:{kind:'unverified'}}),
 make('phone',{fix:{lat:3,lon:4,acc:5,master:false},source:{kind:'confirmed'}}),
 make('unmeasured pin',{fix:{lat:3,lon:4,master:false}}),
 make('drawing',{fix:null,point:{ax:.1,ay:.2},drawing:{lat:5,lon:6}}),
 make('no destination',{fix:null}),
 make('no entry',{entry:null}),
 make('no asset',{asset:null}),
 make('missing pin latitude',{fix:{lat:null,lon:4,master:true},point:{ax:.1,ay:.2},drawing:{lat:5,lon:6}})
];
const results=[];
for(const f of cases){
 const before=JSON.stringify(f), outputs=[];
 for(const code of sources){
  const calls=[];
  const context={
   entryOf:()=>f.entry, assetOf:()=>f.asset, bestPinFor:()=>f.fix?{fix:f.fix}:null,
   locSrc782:()=>f.source, aerialPointFor:()=>f.point||null,lonLatOf:()=>f.drawing||null,
   haversineKm:(entry,to)=>{calls.push({entry,to});return .01749;},
   esc:value=>String(value),d:{basis:'the master-plan position'}
  };
  vm.createContext(context);vm.runInContext(code,context);
  const output=vm.runInContext('entryToDrop('+JSON.stringify(f.name)+')',context);
  outputs.push({output,calls,tooltip:vm.runInContext('tooltip',context)});
 }
 results.push({name:f.name,base:outputs[0],patched:outputs[1],preserved:before===JSON.stringify(f)});
}
process.stdout.write(JSON.stringify(results));
'''
        result = subprocess.run(
            ['node', '-e', script, json.dumps([FIXTURE, cls.patched])],
            check=True, capture_output=True, text=True,
        )
        cls.results = {x['name']: x for x in json.loads(result.stdout)}

    def test_endpoint_labels_keep_plan_confirmation_and_field_pin_distinct(self):
        expected = {
            'master': 'the master-plan position',
            'confirmed': 'the position confirmed by the project manager',
            'unverified': 'the unverified drawing position',
            'phone': 'location pinned on the map',
            'drawing': "the drawing's callout",
        }
        for name, label in expected.items():
            with self.subTest(name=name):
                self.assertEqual(self.results[name]['patched']['output']['basis'], label)

    def test_same_endpoints_same_distance_calls_and_same_rounded_metres(self):
        for name, result in self.results.items():
            with self.subTest(name=name):
                self.assertEqual(result['base']['calls'], result['patched']['calls'])
                baseline = result['base']['output']
                patched = result['patched']['output']
                if baseline is None:
                    self.assertIsNone(patched)
                else:
                    self.assertEqual(patched['m'], baseline['m'])
                    self.assertEqual(patched['m'], 17)
                self.assertTrue(result['preserved'])

    def test_nonmaster_pin_is_not_relabelled_by_unrelated_master_metadata(self):
        result = self.results['phone']['patched']['output']
        self.assertEqual(result['basis'], 'location pinned on the map')
        self.assertNotIn('confirmed by', result['basis'])

    def test_unmeasured_map_pin_does_not_claim_on_site_measurement(self):
        result = self.results['unmeasured pin']['patched']['output']
        self.assertEqual(result['basis'], 'location pinned on the map')
        self.assertNotIn('on site', result['basis'])

    def test_missing_coordinates_preserve_callout_and_null_fallbacks(self):
        self.assertEqual(self.results['missing pin latitude']['patched']['output']['basis'], "the drawing's callout")
        for name in ['no destination', 'no entry', 'no asset']:
            self.assertIsNone(self.results[name]['patched']['output'])
            self.assertEqual(self.results[name]['patched']['calls'], [])

    def test_tooltip_names_calculation_without_claiming_ground_measurement(self):
        tooltip = self.results['master']['patched']['tooltip']
        self.assertIn('Calculated straight-line distance to the master-plan position', tooltip)
        self.assertIn('not a driving route', tooltip)
        self.assertNotIn('Measured on the ground', tooltip)
        self.assertIn(NEW_TOOLTIP, self.patched)

    def test_apply_changes_only_declared_anchors(self):
        restored = self.patched
        for old, new, _ in reversed(REPLACEMENTS):
            self.assertEqual(restored.count(new), 1)
            restored = restored.replace(new, old, 1)
        self.assertEqual(restored, FIXTURE)

    def test_repeat_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'already applied'):
            apply(self.patched)

    def test_missing_anchor_is_rejected(self):
        with self.assertRaises(SystemExit):
            apply(FIXTURE.replace(OLD_TOOLTIP, 'changed'))

    def test_duplicate_anchor_is_rejected(self):
        with self.assertRaises(SystemExit):
            apply(FIXTURE + OLD_TOOLTIP)


if __name__ == '__main__':
    unittest.main()
