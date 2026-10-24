"""Author: Andrew Fisher. Portable synthetic guards; no project source strings."""

import copy
import importlib.util
import json
from pathlib import Path
import unittest


MODULE = Path(__file__).resolve().parents[1] / "patch_plan_notes.py"
SPEC = importlib.util.spec_from_file_location("patch_plan_notes", MODULE)
patcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(patcher)


class NotePatchTests(unittest.TestCase):
    def fixture(self, escaped=False):
        data = {"fencing": {"week_sheets": [{"plan_update": {"notes": [
            {"page": 2, "text": "Synthetic alpha note — unchanged."},
            {"page": 7, "text": 'Synthetic beta note with a "quote".'},
        ], "rows_by_day": [{"date": "2000-01-01", "rows": [{"fields": {"units": 7}, "flag": None}]}],
        "totals": {"units": 7}}}]}, "status": {"complete": False}, "price": 123.45}
        host = ("prefix<!-- untouched -->\n<script>const DATA = " + json.dumps(data, ensure_ascii=escaped) + ";\nconst unrelated = 42;</script>\ntrailer").encode()
        spec = {"expected_host_sha256": patcher.digest(host), "changes": [
            {"path": "/fencing/week_sheets/0/plan_update/notes/0/text", "before": data["fencing"]["week_sheets"][0]["plan_update"]["notes"][0]["text"], "append": " Synthetic source handling A; balance unverified."},
            {"path": "/fencing/week_sheets/0/plan_update/notes/1/text", "before": data["fencing"]["week_sheets"][0]["plan_update"]["notes"][1]["text"], "append": " Synthetic source handling B; balance unverified."},
        ]}
        return host, spec, data

    def test_only_two_notes_change_and_all_original_text_is_retained(self):
        host, spec, before = self.fixture()
        candidate, evidence = patcher.patch_host(host, spec)
        actual, _, _ = patcher.data_region(candidate.decode())
        expected = copy.deepcopy(before)
        notes = expected["fencing"]["week_sheets"][0]["plan_update"]["notes"]
        for idx, change in enumerate(spec["changes"]):
            notes[idx]["text"] += change["append"]
        self.assertEqual(actual, expected)
        self.assertEqual(evidence["changed_note_count"], 2)
        self.assertTrue(candidate.startswith(b"prefix<!-- untouched -->"))
        self.assertTrue(candidate.endswith(b"const unrelated = 42;</script>\ntrailer"))

    def test_escaped_unicode_and_html_script_end_are_safe(self):
        host, spec, _ = self.fixture(escaped=True)
        spec["changes"][0]["append"] = ' Synthetic </script> & Unicode \u2028 text.'
        candidate, _ = patcher.patch_host(host, spec)
        actual, _, _ = patcher.data_region(candidate.decode())
        self.assertEqual(actual["fencing"]["week_sheets"][0]["plan_update"]["notes"][0]["text"], spec["changes"][0]["before"] + spec["changes"][0]["append"])
        self.assertEqual(candidate.count(b"</script>"), 1)

    def test_stale_host_fails(self):
        host, spec, _ = self.fixture()
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host + b" ", spec)

    def test_wrong_before_value_fails(self):
        host, spec, _ = self.fixture()
        spec["changes"][0]["before"] = "Different source text"
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host, spec)

    def test_operational_field_is_not_a_permitted_target(self):
        host, spec, _ = self.fixture()
        spec["changes"][0]["path"] = "/status/complete"
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host, spec)

    def test_duplicate_path_and_extra_changes_fail(self):
        host, spec, _ = self.fixture()
        spec["changes"][1] = copy.deepcopy(spec["changes"][0])
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host, spec)
        host, spec, _ = self.fixture()
        spec["changes"].append(copy.deepcopy(spec["changes"][0]))
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host, spec)

    def test_ambiguous_matching_string_fails(self):
        host, spec, data = self.fixture()
        data["other"] = spec["changes"][0]["before"]
        host = ("const DATA = " + json.dumps(data) + ";").encode()
        spec["expected_host_sha256"] = patcher.digest(host)
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(host, spec)

    def test_second_application_fails_even_with_refreshed_host_hash(self):
        host, spec, _ = self.fixture()
        candidate, _ = patcher.patch_host(host, spec)
        spec["expected_host_sha256"] = patcher.digest(candidate)
        with self.assertRaises(patcher.GuardError):
            patcher.patch_host(candidate, spec)


if __name__ == "__main__":
    unittest.main()
