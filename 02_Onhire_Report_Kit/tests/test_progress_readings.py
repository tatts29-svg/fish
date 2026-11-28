"""Check percentage labels and upload stages in the generated client report."""
from pathlib import Path
import shutil
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_showcase import render


@unittest.skipUnless(shutil.which("node"), "Node.js required for report UI tests")
class ProgressReadings(unittest.TestCase):
    def test_reported_fraction_and_upload_stage(self):
        page = render({}, {})
        percent = page[page.index("function formatMeasuredPercent("):page.index("const esc=")]
        progress = page[page.index("function prog(value,total,stage)"):page.index("const names=s.uploaders")]
        harness = """
const assert = require('node:assert/strict');
const track = {
  setAttribute(key, value){this[key] = value},
  removeAttribute(key){delete this[key]}
};
const fill = {style:{}}, percentLabel = {}, stageLabel = {};
const bar = {classList:{toggle(key, value){this[key] = value}}};
const $ = key => ({'#up-fill':fill,'#up-bar .tr':track,'#up-pct':percentLabel,'#up-stage':stageLabel})[key];
assert.deepEqual([[0, 1675], [1, 3000], [821, 1676], [2499, 2500], [1675, 1675],
                  [10001, 10000], [0, 0], [null, 3]].map(([n,t]) => formatMeasuredPercent(n,t)),
                 ['0%', '<0.1%', '49%', '>99.9%', '100%', '>100%', '—', '—']);
prog(45, 60, 'Uploading');
assert.equal(fill.style.width, '75%');
assert.equal(track['aria-valuenow'], '75');
assert.equal(percentLabel.textContent, '75%');
prog(null, null, 'Rebuilding');
assert.equal(track['aria-valuenow'], undefined);
assert.equal(percentLabel.textContent, '');
assert.equal(bar.classList['waiting-for-build'], true);
prog(1, 1, 'Reports updated');
assert.equal(fill.style.width, '100%');
assert.equal(track['aria-valuenow'], '100');
assert.equal(stageLabel.textContent, 'Reports updated');
"""
        subprocess.run(["node", "-e", percent + progress + harness], check=True, timeout=15)


if __name__ == "__main__":
    unittest.main()
