"""Portable labour-source presentation checks. Author: Andrew Fisher."""
from pathlib import Path
import json
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from labour_labels832 import REPLACEMENTS, SOURCE_HELPER, apply_labour_labels


class LabourLabels832Tests(unittest.TestCase):
    def fixture(self):
        # Synthetic anchors only: no operational records or commercial inputs.
        return "\n".join(old for old, _, _ in REPLACEMENTS)

    def test_all_guarded_changes_apply(self):
        result = apply_labour_labels(self.fixture())
        self.assertIn("function labourSource832(", result)
        self.assertIn("retains older year headings", result)
        self.assertIn("existing calculation allocates half to install and half to demob", result)
        self.assertNotIn("some buildings ticked", result)

    def test_repeat_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "already applied"):
            apply_labour_labels(apply_labour_labels(self.fixture()))

    def test_missing_anchor_is_rejected(self):
        with self.assertRaises(SystemExit):
            apply_labour_labels(self.fixture().replace(REPLACEMENTS[-1][0], "changed"))

    def test_duplicate_anchor_is_rejected(self):
        with self.assertRaises(SystemExit):
            apply_labour_labels(self.fixture() + "\n" + REPLACEMENTS[-1][0])

    def test_badge_preserves_source_not_old_rate_claim(self):
        script = r'''
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let RM = {card_year: 2026}, CARD_WORD = 'street';
''' + SOURCE_HELPER + r'''
const line = {heading:'Labour 2024',year:2024,rate:12.5,ticked:true,money_note:'Example combined amount, split equally'};
const before = JSON.stringify(line);
const current = labourSource832(line);
RM = null;
const withoutYear = labourSource832({heading:'Labour <special> "quoted"',year:2025});
process.stdout.write(JSON.stringify({current,withoutYear,preserved:before===JSON.stringify(line)}));
'''
        result = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True)
        output = json.loads(result.stdout)
        self.assertIn(">2026 card</span>", output["current"])
        self.assertIn("source column: Labour 2024", output["current"])
        self.assertIn("split equally", output["current"])
        self.assertNotIn(">2024 rate<", output["current"])
        self.assertIn(">Card figure</span>", output["withoutYear"])
        self.assertIn("&lt;special&gt; &quot;quoted&quot;", output["withoutYear"])
        self.assertTrue(output["preserved"])

    def test_grouped_entries_are_not_called_physical_units(self):
        quantity_statement = next(new for _, new, purpose in REPLACEMENTS if purpose == "distinguish physical units from grouped tick entries")
        count_template = next(new for _, new, purpose in REPLACEMENTS if purpose == "labour table equipment wording")
        script = "const qtyOf = l => l.qty; const labourUnits = a => a.units;\n"
        script += "function wording(t){\n" + quantity_statement + "\nreturn `" + count_template + "`;\n}\n"
        script += r'''
const t = (qty, units=[]) => ({item:'Example',refs:[{a:{units},l:{qty}}]});
const results = [wording(t(2,['A','B'])),wording(t(4,['A','rest'])),wording(t(7)),wording(t(null)),wording(t(1))];
process.stdout.write(JSON.stringify(results));
'''
        result = subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True)
        self.assertEqual(json.loads(result.stdout), ["2 units on 1", "2 entries on 1", "1 entry on 1", "1 entry on 1", "1 unit on 1"])


if __name__ == "__main__":
    unittest.main()
