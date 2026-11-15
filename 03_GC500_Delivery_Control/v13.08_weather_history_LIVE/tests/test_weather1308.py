"""Author: Andrew Fisher. Independent acceptance of the verified weather-only update.

Usage: python3 tests/test_weather1308.py BASE_HTML [CANDIDATE_HTML]
Reads supplied pages and the checked-in BOM snapshot. No network or record writes.
The expected rows are built from CSV column headings, independently of the release converter.
"""
import argparse
import copy
import csv
import datetime as dt
import hashlib
import io
import json
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent.parent
BASE_SHA = "e632b5bbe5aaab781bb7242b892d102e1e8e8894dd973223d6a57e1839443428"
CSV_SHA = "b4223475528e54018653ac753ab229cf3acdea6f8e2edb853d1fd76b2498a325"
CSV_URL = "https://www.bom.gov.au/climate/dwo/202611/text/IDCJDW4050.202611.csv"
HTML_URL = "https://www.bom.gov.au/climate/dwo/202611/html/IDCJDW4050.202611.shtml"
SOURCE_ID = "202611-15nov1308"
FOOT_OLD = "+' · v13.07'; /* v8.19 release922"
FOOT_NEW = "+' · v13.08'; /* v8.19 release922"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", type=Path, help="Exact verified v13.07 HTML")
    parser.add_argument("candidate", type=Path, nargs="?", help="Optional built v13.08 HTML")
    arguments = parser.parse_args()
    BASE_PATH, CANDIDATE_PATH = arguments.base, arguments.candidate
else:
    BASE_PATH = CANDIDATE_PATH = None


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def archive_span(page):
    marker = "const ARCHIVE = "
    if page.count(marker) != 1:
        raise AssertionError("Expected exactly one native historical-weather archive")
    start = page.index(marker) + len(marker)
    archive, size = json.JSONDecoder().raw_decode(page[start:])
    return archive, start, start + size


def outside_archive(page):
    _, start, end = archive_span(page)
    return page[:start] + "__VERIFIED_WEATHER_ARCHIVE__" + page[end:]


def leaves(value):
    if isinstance(value, dict):
        for nested in value.values():
            yield from leaves(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from leaves(nested)
    else:
        yield value


def independent_rows(raw):
    rows = list(csv.reader(io.StringIO(raw.decode("iso-8859-1"))))
    station = "Observations were drawn from Gold Coast Seaway {station 040764}"
    if not any(row == [station] for row in rows[:8]):
        raise AssertionError("Snapshot must identify the verified station")
    header = next(row for row in rows if len(row) > 20 and row[1] == "Date")
    header = [heading.strip() for heading in header]
    result = {}
    for row in rows:
        if len(row) != len(header) or not row[1].startswith("2026-11-"):
            continue
        fields = dict(zip(header, row))
        year, month, day = (int(part) for part in fields["Date"].split("-"))
        date = dt.date(year, month, day).isoformat()
        if date in result:
            raise AssertionError("Duplicate weather date")

        def number(name):
            value = fields[name].strip()
            return None if not value else 0.0 if value.lower() == "calm" else float(value)

        def text(name):
            return fields[name].strip() or None

        samples = [
            {"time": time, "temp_c": number(prefix + " Temperature (°C)"),
             "wind_kph": number(prefix + " wind speed (km/h)"),
             "wind_direction": text(prefix + " wind direction")}
            for prefix, time in (("9am", "09:00"), ("3pm", "15:00"))
        ]
        # All target dates have two reported observations; test this explicitly below.
        samples = [sample for sample in samples if any(sample[k] is not None for k in ("temp_c", "wind_kph", "wind_direction"))]
        winds = [sample["wind_kph"] for sample in samples if sample["wind_kph"] is not None]
        expected = {
            "date": date, "src": "bom-history", "historical": True,
            "kind": "unknown", "code": None, "text": "Recorded observations",
            "min_c": number("Minimum temperature (°C)"),
            "max_c": number("Maximum temperature (°C)"),
            "rain_pc": None, "rain_mm": None,
            "rain_to_9am_mm": number("Rainfall (mm)"),
            "wind_kph": max(winds) if winds else None,
            "gust_kph": number("Speed of maximum wind gust (km/h)"),
            "gust_time": text("Time of maximum wind gust"),
            "gust_direction": text("Direction of maximum wind gust"),
            "observations": len(samples), "observation_times": [sample["time"] for sample in samples],
            "readings": samples, "sky_recorded": False, "source_id": SOURCE_ID,
        }
        expected["partial"] = (
            any(expected[k] is None for k in ("min_c", "max_c", "rain_to_9am_mm", "gust_kph"))
            or len(samples) != 2 or any(v is None for sample in samples for v in sample.values())
        )
        result[date] = (expected, fields)
    return rows, result


class Weather1308Acceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if BASE_PATH is None:
            raise unittest.SkipTest("Invoke this acceptance script with the required BASE_HTML argument")
        sys.path.insert(0, str(HERE))
        import patch_v1308
        import weather_archive1308
        cls.patch_module = patch_v1308
        cls.converter = weather_archive1308
        cls.base_raw = BASE_PATH.read_bytes()
        cls.base = cls.base_raw.decode("utf-8")
        cls.old, _, _ = archive_span(cls.base)
        cls.csv_raw = (HERE / "weather_sources" / "IDCJDW4050.202611.csv").read_bytes()
        cls.csv_lines, cls.expected = independent_rows(cls.csv_raw)
        cls.retrieval = json.loads((HERE / "weather_sources" / "retrieval.json").read_text(encoding="utf-8"))
        cls.original_input = copy.deepcopy(cls.old)
        cls.updated = cls.converter.update_archive(cls.original_input)
        cls.patched = cls.patch_module.patch(cls.base, str(BASE_PATH))

    def test_exact_base_and_independently_verified_source(self):
        self.assertEqual(sha(self.base_raw), BASE_SHA)
        self.assertEqual(sha(self.csv_raw), CSV_SHA)
        self.assertIn(CSV_URL, list(leaves(self.retrieval)))
        self.assertIn(CSV_SHA, list(leaves(self.retrieval)))
        self.assertEqual(self.csv_lines[1], ["Prepared at 06:26 UTC on Sunday 15 November 2026   IDCJDW4050.202611"])

    def test_contiguous_scope_only_through_last_demob_day(self):
        dates = [(dt.date(2026, 9, 7) + dt.timedelta(days=i)).isoformat() for i in range(68)]
        self.assertEqual(sorted(self.updated["days"]), dates)
        self.assertEqual(self.updated["coverage"], {"from": "2026-09-07", "through": "2026-11-13"})
        self.assertEqual(set(self.updated["days"]) - set(self.old["days"]), {f"2026-11-{day:02d}" for day in range(5, 14)})
        # The source also contains 14 November and incomplete 15 November; neither expands this release's scope.
        self.assertIn("2026-11-14", self.expected)
        self.assertIn("2026-11-15", self.expected)

    def test_all_ten_changed_rows_match_independent_header_conversion(self):
        for day in range(4, 14):
            date = f"2026-11-{day:02d}"
            expected, _ = self.expected[date]
            with self.subTest(date=date):
                self.assertEqual(self.updated["days"][date], expected)
                self.assertFalse(expected["partial"])
                self.assertEqual(expected["observation_times"], ["09:00", "15:00"])

    def test_no_cloud_rain_probability_or_daily_extreme_invention(self):
        for day in range(4, 14):
            date = f"2026-11-{day:02d}"
            record = self.updated["days"][date]
            _, fields = self.expected[date]
            with self.subTest(date=date):
                self.assertEqual(fields["9am cloud amount (oktas)"], "")
                self.assertEqual(fields["3pm cloud amount (oktas)"], "")
                self.assertEqual(record["kind"], "unknown")
                self.assertFalse(record["sky_recorded"])
                self.assertIsNone(record["code"])
                self.assertIsNone(record["rain_pc"])
                self.assertIsNone(record["rain_mm"])
                self.assertEqual(record["wind_kph"], max(sample["wind_kph"] for sample in record["readings"]))
        self.assertEqual(self.updated["days"]["2026-11-04"]["max_c"], 33.1)
        self.assertEqual(self.updated["days"]["2026-11-04"]["readings"][1]["temp_c"], 32.8)
        self.assertEqual(self.updated["days"]["2026-11-08"]["wind_kph"], 39)
        self.assertEqual(self.updated["days"]["2026-11-08"]["gust_kph"], 61)

    def test_fifty_eight_prior_rows_and_source_metadata_are_preserved(self):
        retained = {date: record for date, record in self.old["days"].items() if date != "2026-11-04"}
        self.assertEqual(len(retained), 58)
        for date, record in retained.items():
            with self.subTest(date=date):
                self.assertEqual(self.updated["days"][date], record)
        for source, metadata in self.old["sources"].items():
            self.assertEqual(self.updated["sources"][source], metadata)
        for key, value in self.old.items():
            if key not in {"days", "sources", "coverage"}:
                self.assertEqual(self.updated[key], value, key)
        self.assertEqual(set(self.updated), set(self.old))
        self.assertEqual(set(self.updated["sources"]) - set(self.old["sources"]), {SOURCE_ID})
        self.assertEqual(self.original_input, self.old, "Converter must not mutate its supplied archive")

    def test_first_three_november_days_still_match_official_source(self):
        for day in range(1, 4):
            date = f"2026-11-{day:02d}"
            expected = copy.deepcopy(self.expected[date][0])
            expected["source_id"] = self.old["days"][date]["source_id"]
            self.assertEqual(self.old["days"][date], expected)
            self.assertEqual(self.updated["days"][date], expected)

    def test_fourth_november_completes_only_previously_missing_facts(self):
        before, after = self.old["days"]["2026-11-04"], self.updated["days"]["2026-11-04"]
        self.assertTrue(before["partial"])
        self.assertFalse(after["partial"])
        changed = {key for key in before if before[key] != after[key]}
        self.assertEqual(changed, {"max_c", "gust_kph", "gust_time", "gust_direction", "partial", "source_id"})
        for key, value in before.items():
            if value is not None and key not in {"partial", "source_id"}:
                self.assertEqual(after[key], value, key)
        self.assertEqual({key: after[key] for key in ("max_c", "gust_kph", "gust_time", "gust_direction")},
                         {"max_c": 33.1, "gust_kph": 43.0, "gust_time": "10:59", "gust_direction": "WNW"})

    def test_new_source_has_verified_station_urls_and_retrieval_provenance(self):
        source = self.updated["sources"][SOURCE_ID]
        self.assertEqual(source["name"], "Bureau of Meteorology")
        self.assertEqual(source["station"], "Gold Coast Seaway")
        self.assertEqual(str(source["station_id"]), "040764")
        self.assertEqual(source["url"], HTML_URL)
        self.assertEqual(source["data_url"], CSV_URL)
        self.assertEqual(source["source_prepared"], self.csv_lines[1][0])
        self.assertEqual(source["original_bytes_sha256"], CSV_SHA)
        self.assertEqual(source["snapshot_sha256"], sha(self.csv_raw.decode("iso-8859-1").encode("utf-8")))
        self.assertEqual(source["html_snapshot_sha256"], sha((HERE / "weather_sources" / "IDCJDW4050.202611.shtml").read_bytes()))
        self.assertIn(source["retrieved_utc"], list(leaves(self.retrieval)))
        self.assertIsNotNone(dt.datetime.fromisoformat(source["retrieved_utc"].replace("Z", "+00:00")).tzinfo)

    def test_frozen_update_fixture_matches_converter_rows_and_provenance(self):
        fixture = json.loads((HERE / "weather_updates1308.json").read_text(encoding="utf-8"))
        expected_days = {f"2026-11-{day:02d}": self.expected[f"2026-11-{day:02d}"][0] for day in range(4, 14)}
        self.assertEqual(fixture["author"], "Andrew Fisher")
        self.assertEqual(fixture["coverage"], {"from": "2026-11-04", "through": "2026-11-13"})
        self.assertEqual(fixture["archiveRows"], 68)
        self.assertEqual(fixture["days"], expected_days)
        self.assertEqual(fixture["days"], {date: self.updated["days"][date] for date in expected_days})
        self.assertEqual(fixture["source"], self.updated["sources"][SOURCE_ID])

    def test_only_archive_json_and_release_footer_change(self):
        self.assertEqual(self.patch_module.archive_from_page(self.base), self.old)
        self.assertEqual(self.patch_module.archive_from_page(self.patched), self.updated)
        self.assertEqual(archive_span(self.patched)[0], self.updated)
        self.assertEqual(self.base.count(FOOT_OLD), 1)
        self.assertEqual(self.patched.count(FOOT_NEW), 1)
        self.assertNotIn(FOOT_OLD, self.patched)
        self.assertEqual(outside_archive(self.patched).replace(FOOT_NEW, FOOT_OLD), outside_archive(self.base))

    def test_wrong_base_and_repeat_application_are_refused(self):
        wrong_footer = self.base.replace(FOOT_OLD, "+' · v13.06'; /* v8.19 release922", 1)
        unrelated_change = self.base.replace("<!-- GC500 Delivery Control -->", "<!-- Unapproved base modification -->", 1)
        self.assertNotEqual(unrelated_change, self.base)
        for label, page in (("wrong version", wrong_footer), ("same version changed bytes", unrelated_change), ("already applied", self.patched)):
            with self.subTest(case=label), self.assertRaises((ValueError, SystemExit)):
                self.patch_module.patch(page, label)

    @unittest.skipIf(CANDIDATE_PATH is None, "No candidate path supplied")
    def test_supplied_candidate_exactly_reproduces_reviewed_patch(self):
        candidate = CANDIDATE_PATH.read_text(encoding="utf-8")
        self.assertEqual(candidate, self.patched)
        self.assertEqual(self.patch_module.archive_from_page(candidate), self.updated)


if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]], verbosity=2)
