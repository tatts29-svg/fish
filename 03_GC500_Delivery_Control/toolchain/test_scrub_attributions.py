"""Author: Andrew Fisher. Attribution removal must preserve executable page content."""
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest


class ScrubAttributionsTests(unittest.TestCase):
    def scrub(self, html):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'page.html'
            page.write_text(html, encoding='utf-8')
            subprocess.run([sys.executable, str(Path(__file__).with_name('scrub_attributions.py')), str(page)],
                           check=True, capture_output=True, text=True)
            return page.read_text(encoding='utf-8')

    def test_attribution_does_not_change_selectors_or_unrelated_strings(self):
        script = """// Author: Andrew Fisher
const notice = 'Ask Andrew Fisher for the editing link';
const selector = '#drawer.on .ptag.sync b';
const css = '#drv782 .box{display:grid} #drv782 .facts.bad{color:red}';
const literal = 'Keep  two spaces . and , and the the';
const template = `first  line
   second . line`;
function refresh(){
  return document.querySelector(selector);
}
const author = DATA.brand.author || 'Andrew Fisher';
"""
        original = '<script>' + script + '</script>'
        expected = original.replace('Ask Andrew Fisher for', 'Ask the project manager for')
        self.assertEqual(self.scrub(original), expected)

    def test_canonical_data_keeps_person_metadata_and_scrubs_narrative(self):
        data = {'brand': {'author': 'Andrew Fisher'},
                'events': [{'name': 'Andrew Fisher', 'recorded_by': 'Andrew Fisher',
                            'supplied_by': 'Andrew Fisher', 'confirmed_by': 'Andrew Fisher',
                            'note': '(Andrew Fisher, 2 Oct 2026) Keep  clear .'}]}
        page = '<script>\nconst DATA = ' + json.dumps(data) + ';\n</script>'
        result = self.scrub(page)
        actual = json.loads(re.search(r'^const DATA = (\{.*\});$', result, re.M).group(1))
        expected = json.loads(json.dumps(data))
        expected['events'][0]['note'] = ' Keep clear.'
        self.assertEqual(actual, expected)

    def test_scrub_is_idempotent_with_dated_attribution_and_author_credit(self):
        page = "<script>/* Author: Andrew Fisher */\nconst text = 'Andrew Fisher, 2 Oct 2026: Follow the plan';\nconst css = '#drv782 .box';</script>"
        once = self.scrub(page)
        self.assertIn("const text = 'Follow the plan';", once)
        self.assertIn('Author: Andrew Fisher', once)
        self.assertEqual(self.scrub(once), once)


if __name__ == '__main__':
    unittest.main()
