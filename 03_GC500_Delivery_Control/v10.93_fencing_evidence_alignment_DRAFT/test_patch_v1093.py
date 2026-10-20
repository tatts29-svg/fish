"""Author: Andrew Fisher. Synthetic private-input guards and exact page preservation."""
from pathlib import Path
import argparse
import copy
import hashlib
import json
import os
import tempfile
import unittest
from unittest import mock

import patch_v1093 as patcher


def digest(value):
    return hashlib.sha256(value).hexdigest()


def catalogue_span(text):
    declaration = "const FENCE_PROGRAMME958 = "
    if text.count(declaration) != 1:
        raise AssertionError("Expected one fencing catalogue declaration")
    start = text.index(declaration) + len(declaration)
    value, end = json.JSONDecoder().raw_decode(text, start)
    if text[end:end + 1] != ";":
        raise AssertionError("Catalogue declaration terminator changed")
    return start, end, value


def assert_candidate_preserved(base, candidate, base_version="v10.92", catalogue_only=False):
    """Verify a private built candidate without printing its operational content."""
    before_start, before_end, before = catalogue_span(base)
    after_start, after_end, after = catalogue_span(candidate)
    marker = "/* Author: Andrew Fisher. " + patcher.MARKER + ". */\n"
    restored = candidate[:after_start] + base[before_start:before_end] + candidate[after_end:]
    if catalogue_only:
        if marker in candidate:
            raise AssertionError("A catalogue-only practice page cannot carry the release marker")
    else:
        if candidate.count(marker) != 1:
            raise AssertionError("Reviewed release marker is missing or duplicated")
        if base.count("' · " + base_version + "'") != 1 or candidate.count("' · v10.93'") != 1:
            raise AssertionError("Release footer is missing or duplicated")
        restored = restored.replace(marker, "", 1).replace(
            "' · v10.93'", "' · " + base_version + "'", 1
        )
    if restored != base:
        raise AssertionError("Content outside the catalogue and release footer changed")

    # This narrower proof makes matcher preservation explicit in the report.
    start_marker = "function fenceProgrammeCanonical958("
    end_marker = "function fenceProgrammeAdjust958("
    if base.count(start_marker) != 1 or candidate.count(start_marker) != 1:
        raise AssertionError("Strict matcher preamble is missing or duplicated")
    if base.count(end_marker) != 1 or candidate.count(end_marker) != 1:
        raise AssertionError("Strict matcher boundary is missing or duplicated")
    base_matcher = base[base.index(start_marker):base.index(end_marker)]
    candidate_matcher = candidate[candidate.index(start_marker):candidate.index(end_marker)]
    if candidate_matcher != base_matcher:
        raise AssertionError("Strict matcher bytes changed")

    if not isinstance(before.get("rows"), list) or not isinstance(after.get("rows"), list):
        raise AssertionError("Catalogue row structure changed")
    if len(before["rows"]) != len(after["rows"]):
        raise AssertionError("Catalogue rows were added or removed")
    stripped_before = copy.deepcopy(before)
    stripped_after = copy.deepcopy(after)
    changed = 0
    for old, new in zip(stripped_before["rows"], stripped_after["rows"]):
        if old.get("record_id") != new.get("record_id"):
            raise AssertionError("Catalogue row identity or order changed")
        if patcher.canonical(old) != patcher.canonical(new):
            changed += 1
        old.pop("expected", None)
        old.pop("basis", None)
        new.pop("expected", None)
        new.pop("basis", None)
    if patcher.canonical(stripped_before) != patcher.canonical(stripped_after):
        raise AssertionError("Unreviewed catalogue metadata changed")
    return {"changed_catalogue_rows": changed, "matcher_bytes_unchanged": True,
            "other_page_bytes_unchanged": True}


class PatchTests(unittest.TestCase):
    def setUp(self):
        self.expected = {
            "id": "example-record",
            "docket_no": "EXAMPLE-1",
            "date": "2000-01-01",
            "week": "Example week",
            "programme_sheet": "EXAMPLE",
            "location": "Original example area",
            "quantities": {"clean": 4},
            "components": {"example_component": 2},
            "note": "Original example note.",
            "source": "Synthetic source",
        }
        self.row = {
            "record_id": self.expected["id"],
            "docket_no": self.expected["docket_no"],
            "expected": copy.deepcopy(self.expected),
            "source_ids": ["example-source.pdf"],
            "programme": {"sheet": "EXAMPLE", "row": 1, "expected": {"example": True}},
            "basis": "Original example basis.",
        }
        self.catalogue = {
            "schema": 1,
            "sources": [{"id": "example-source.pdf", "sha256": "a" * 64}],
            "rows": [copy.deepcopy(self.row)],
            "other_metadata": {"keep": ["unchanged"]},
        }
        after = copy.deepcopy(self.expected)
        after["location"] = "Reviewed example area"
        after["note"] = "Reviewed example note."
        self.correction = {
            "record_id": self.expected["id"],
            "before": copy.deepcopy(self.expected),
            "after": after,
            "basis_before": self.row["basis"],
            "basis_after": "Reviewed example basis.",
        }
        self.page = (
            "<html><body>\n<script>\nconst FENCE_PROGRAMME958 = "
            + json.dumps(self.catalogue, separators=(",", ":")) + ";\n"
            "function fenceProgrammeCanonical958(value) { return JSON.stringify(value); }\n"
            "function fenceProgrammeReviews958(records) { return records; }\n"
            "function fenceProgrammeAdjust958(weeks) { return weeks; }\n"
            "const footer = ' · v10.92';\n</script>\n</body></html>"
        )
        self.tmp = tempfile.TemporaryDirectory(prefix="example-fencing-test-")
        self.addCleanup(self.tmp.cleanup)
        self.private_path = Path(self.tmp.name) / "input.json"
        self.data = {"schema": 1, "source_sha256": digest(self.page.encode()),
                     "rows": [copy.deepcopy(self.correction)]}
        self.write_private()
        self.lock = mock.patch.multiple(
            patcher, BASE_SHA256=self.data["source_sha256"],
            PRIVATE_INPUT_SHA256=digest(self.private_path.read_bytes())
        )
        self.lock.start()
        self.addCleanup(self.lock.stop)
        self.env = mock.patch.dict(os.environ, {
            "GC500_FENCING_EVIDENCE_INPUT": str(self.private_path)
        })
        self.env.start()
        self.addCleanup(self.env.stop)

    def write_private(self, data=None):
        self.private_path.write_text(json.dumps(self.data if data is None else data))

    def relock_private(self):
        patcher.PRIVATE_INPUT_SHA256 = digest(self.private_path.read_bytes())

    def test_reviewed_fields_change_without_mutating_input_or_other_content(self):
        original = copy.deepcopy(self.catalogue)
        changes = copy.deepcopy([self.correction])
        result = patcher.patch_catalogue(self.catalogue, changes)
        self.assertEqual(result["rows"][0]["expected"], self.correction["after"])
        self.assertEqual(result["rows"][0]["basis"], self.correction["basis_after"])
        self.assertEqual(result["sources"], self.catalogue["sources"])
        self.assertEqual(result["other_metadata"], self.catalogue["other_metadata"])
        self.assertEqual(self.catalogue, original)
        self.assertEqual(changes, [self.correction])

    def test_other_rows_and_attributions_remain_identical(self):
        other = copy.deepcopy(self.row)
        other["record_id"] = "example-unaffected"
        other["docket_no"] = "EXAMPLE-2"
        other["attribution"] = {"example": "retained"}
        self.catalogue["rows"].append(other)
        result = patcher.patch_catalogue(self.catalogue, [self.correction])
        self.assertEqual(result["rows"][1], other)

    def test_full_patch_preserves_other_page_and_matcher_bytes(self):
        candidate = patcher.patch(self.page)
        result = assert_candidate_preserved(self.page, candidate)
        self.assertEqual(result["changed_catalogue_rows"], 1)
        self.assertTrue(result["matcher_bytes_unchanged"])
        self.assertTrue(result["other_page_bytes_unchanged"])

    def test_preservation_check_detects_a_matcher_change(self):
        candidate = patcher.patch(self.page).replace("return records;", "return [];")
        with self.assertRaises(AssertionError):
            assert_candidate_preserved(self.page, candidate)

    def test_preservation_check_detects_unreviewed_catalogue_metadata(self):
        candidate = patcher.patch(self.page).replace('"keep":["unchanged"]', '"keep":["changed"]')
        with self.assertRaises(AssertionError):
            assert_candidate_preserved(self.page, candidate)

    def test_catalogue_only_practice_page_preserves_every_other_byte(self):
        start, end, catalogue = catalogue_span(self.page)
        changed = patcher.patch_catalogue(catalogue, [self.correction])
        candidate = self.page[:start] + json.dumps(changed) + self.page[end:]
        result = assert_candidate_preserved(self.page, candidate, catalogue_only=True)
        self.assertEqual(result["changed_catalogue_rows"], 1)
        with self.assertRaises(AssertionError):
            assert_candidate_preserved(self.page, candidate)

    def test_catalogue_only_checker_rejects_release_or_footer_changes(self):
        with self.assertRaises(AssertionError):
            assert_candidate_preserved(self.page, patcher.patch(self.page), catalogue_only=True)
        candidate = self.page.replace("' · v10.92'", "' · another'")
        with self.assertRaises(AssertionError):
            assert_candidate_preserved(self.page, candidate, catalogue_only=True)

    def test_wrong_or_unfrozen_predecessor_is_rejected(self):
        with self.assertRaises(ValueError):
            patcher.patch(self.page + "\n")
        with mock.patch.object(patcher, "BASE_SHA256", None):
            with self.assertRaises(ValueError):
                patcher.patch(self.page)

    def test_second_application_is_rejected(self):
        with self.assertRaises(ValueError):
            patcher.patch(patcher.patch(self.page))

    def test_missing_private_input_is_rejected(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                patcher.load_private_input()

    def test_changed_or_unfrozen_private_input_is_rejected(self):
        self.private_path.write_text(self.private_path.read_text() + "\n")
        with self.assertRaises(ValueError):
            patcher.load_private_input()
        with mock.patch.object(patcher, "PRIVATE_INPUT_SHA256", None):
            with self.assertRaises(ValueError):
                patcher.load_private_input()

    def test_private_input_from_another_predecessor_is_rejected(self):
        self.data["source_sha256"] = "b" * 64
        self.write_private()
        self.relock_private()
        with self.assertRaises(ValueError):
            patcher.load_private_input()

    def test_private_input_inside_another_git_checkout_is_rejected(self):
        (self.private_path.parent / ".git").write_text("gitdir: example")
        with self.assertRaises(ValueError):
            patcher.load_private_input()

    def test_symlink_cannot_hide_private_input_inside_a_git_checkout(self):
        nested = self.private_path.parent / "nested"
        nested.mkdir()
        (nested / ".git").mkdir()
        moved = nested / "private.json"
        self.private_path.replace(moved)
        self.private_path.symlink_to(moved)
        with self.assertRaises(ValueError):
            patcher.load_private_input()

    def test_private_json_duplicate_properties_are_rejected(self):
        self.private_path.write_text('{"schema":1,"schema":1}')
        self.relock_private()
        with self.assertRaises(ValueError):
            patcher.load_private_input()

    def test_private_json_nonfinite_numbers_are_rejected(self):
        self.private_path.write_text('{"schema":1,"unexpected":NaN}')
        self.relock_private()
        with self.assertRaises(ValueError):
            patcher.load_private_input()

    def test_private_schema_boolean_or_missing_rows_are_rejected(self):
        for value in ({"schema": True, "rows": [self.correction]},
                      {"schema": 1, "rows": []}):
            with self.subTest(value=value["schema"]):
                value["source_sha256"] = patcher.BASE_SHA256
                self.write_private(value)
                self.relock_private()
                with self.assertRaises(ValueError):
                    patcher.load_private_input()

    def test_exact_before_expected_and_basis_are_required(self):
        for key in ("before", "basis_before"):
            change = copy.deepcopy(self.correction)
            if key == "before":
                change[key]["note"] = "Unreviewed prior note"
            else:
                change[key] = "Unreviewed prior basis"
            with self.subTest(field=key), self.assertRaises(ValueError):
                patcher.patch_catalogue(self.catalogue, [change])

    def test_json_boolean_does_not_match_numeric_before_quantity(self):
        change = copy.deepcopy(self.correction)
        change["before"]["quantities"]["clean"] = True
        self.catalogue["rows"][0]["expected"]["quantities"]["clean"] = 1
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [change])

    def test_identity_date_workweek_and_source_changes_are_rejected(self):
        for key in patcher.IDENTITY_FIELDS:
            change = copy.deepcopy(self.correction)
            change["after"][key] = "Unreviewed change"
            with self.subTest(field=key), self.assertRaises(ValueError):
                patcher.patch_catalogue(self.catalogue, [change])

    def test_missing_extra_or_partial_expected_fields_are_rejected(self):
        for shape in ("extra", "missing"):
            change = copy.deepcopy(self.correction)
            if shape == "extra":
                change["after"]["unreviewed"] = True
            else:
                del change["after"]["note"]
            with self.subTest(shape=shape), self.assertRaises(ValueError):
                patcher.patch_catalogue(self.catalogue, [change])

    def test_duplicate_or_missing_record_corrections_are_rejected(self):
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [self.correction, self.correction])
        change = copy.deepcopy(self.correction)
        change["record_id"] = "example-missing"
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [change])

    def test_duplicate_catalogue_record_is_rejected(self):
        self.catalogue["rows"].append(copy.deepcopy(self.row))
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [self.correction])

    def test_forecast_attribution_correction_is_rejected(self):
        self.catalogue["rows"][0]["attribution"] = {"example": "protected"}
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [self.correction])

    def test_empty_basis_and_noop_are_rejected(self):
        change = copy.deepcopy(self.correction)
        change["basis_after"] = " "
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [change])
        change["after"] = copy.deepcopy(change["before"])
        change["basis_after"] = change["basis_before"]
        with self.assertRaises(ValueError):
            patcher.patch_catalogue(self.catalogue, [change])

    def test_private_text_cannot_close_the_embedded_script(self):
        self.data["rows"][0]["after"]["note"] = "Example </script><script> text & \u2028"
        self.write_private()
        self.relock_private()
        candidate = patcher.patch(self.page)
        self.assertEqual(candidate.count("</script>"), self.page.count("</script>"))
        _, _, parsed = catalogue_span(candidate)
        self.assertEqual(parsed["rows"][0]["expected"]["note"],
                         self.data["rows"][0]["after"]["note"])
        assert_candidate_preserved(self.page, candidate)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path)
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--base-version", default="v10.92")
    parser.add_argument("--catalogue-only", action="store_true",
                        help="Practice page: require every byte outside catalogue JSON unchanged")
    args = parser.parse_args()
    if args.base or args.candidate:
        if not (args.base and args.candidate):
            parser.error("--base and --candidate must be supplied together")
        print(json.dumps(assert_candidate_preserved(
            args.base.read_text(), args.candidate.read_text(), args.base_version, args.catalogue_only
        )))
    else:
        unittest.main(argv=[__file__], verbosity=2)
