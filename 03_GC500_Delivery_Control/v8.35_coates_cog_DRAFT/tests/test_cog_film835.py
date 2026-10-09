"""Author: Andrew Fisher. Film source boundaries and resolved-media contract."""
import os
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import cog_film835 as patch


class FilmIntegrationTests(unittest.TestCase):
    def test_resolved_sources_and_safe_steering_wheel_markup(self):
        source = (ROOT / 'cog_film835_src.js').read_text()
        result = subprocess.run(['node', '-'], text=True, capture_output=True, input='const window={addEventListener(){}};\n' + source + r'''
const assert=require('assert/strict');
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
const hero={src:'poster.png',mp4:'preview.mp4',webm:'preview.webm',full_mp4:'master.mp4',width:3840,height:2160};
assert.deepEqual(cogFilmSources835(hero,false),[{src:'preview.mp4',type:'video/mp4'},{src:'preview.webm',type:'video/webm'}]);
assert.deepEqual(cogFilmSources835(hero,true),[{src:'master.mp4',type:'video/mp4'}]);
assert.deepEqual(cogFilmSources835({mp4:'preview.mp4'},true),[{src:'preview.mp4',type:'video/mp4'}]);
assert.deepEqual(cogFilmSources835({mp4:{media:'unresolved'}},false),[]);
const html=cogFilmHero835({...hero,caption:'<source words>',width:-1});
assert(html.includes('steering-wheel film'));assert(html.includes('aspect-ratio:16/9'));
assert(html.includes('&lt;source words>'));assert(!html.includes('master.mp4'));
assert(!html.includes('4K'));assert(!html.includes('machineOpen'));assert(!html.includes('autoplay'));
const still=cogFilmHero835({src:'poster.png'});assert(still.includes('disabled'));assert(!still.includes('<video'));
''', env=os.environ)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    @unittest.skipUnless(os.environ.get('BASE'), 'Set private BASE for exact full-page integration proof')
    def test_exact_changes_preserve_all_other_source_and_data(self):
        original = Path(os.environ['BASE']).read_text()
        actual = patch.apply(original)
        expected, positions = original, []
        for old, new, label in patch.changes():
            self.assertEqual(expected.count(old), 1, label)
            start = expected.index(old)
            positions.append((start, old, new, label))
            expected = expected[:start] + new + expected[start + len(old):]
        self.assertEqual(actual, expected)
        for start, old, new, label in reversed(positions):
            self.assertEqual(expected[start:start + len(new)], new, label)
            expected = expected[:start] + old + expected[start + len(new):]
        self.assertEqual(expected, original)
        for name in ['machineOpen', 'machineClose', 'machineFrameLoad', 'machineHosted', 'machineFocusable']:
            start = original.index('function ' + name + '(')
            end = original.find('\nfunction ', start + 1)
            body = original[start:end]
            self.assertIn(body, actual, name + ' remains unchanged')
        self.assertIn(patch.NEW_STORY, actual)
        self.assertIn('id="cwOpenMachine"', actual)
        self.assertIn('cogFilmLeave835();', actual)
        self.assertIn('if (COG_FILM835.dialog)', actual)
        with self.assertRaises(ValueError):
            patch.apply(actual)
        with self.assertRaises(ValueError):
            patch.apply(original.replace('function pricingAction834(', 'function differentBase('))
        if os.environ.get('COMPONENT_OUT'):
            Path(os.environ['COMPONENT_OUT']).write_text(actual)


if __name__ == '__main__':
    unittest.main()
