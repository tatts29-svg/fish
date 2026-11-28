"""Scoped PDF generation must preserve item detail across A4 page breaks."""
import re
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from reportlab import rl_config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from qr_report_pdf import render_pdf


def row(index):
    return {"item": f"ITEM-{index:04}", "date": "2026-11-26", "time": "08:45"}


def projection(count):
    return {"kind": "company", "name": "Creek & Valley", "company": "Creek & Valley",
            "asat": "2026-11-28T05:39", "hire_count": count,
            "hires": [{"name": "Impact socket", "count": count, "items": [row(i) for i in range(count)]}] if count else []}


class ScopedPdfTests(unittest.TestCase):
    def test_earned_stars_use_coates_orange_including_half_stars(self):
        from io import BytesIO
        from reportlab.pdfgen.canvas import Canvas
        from qr_report_pdf import ReturnStars

        for score, filled, clips in ((None, 0, 0), (2.5, 3, 1), (5, 5, 0)):
            with self.subTest(score=score):
                canvas = Canvas(BytesIO(), pageCompression=0)
                ReturnStars(score, "Same-day returns", "Rating", "Helvetica").drawOn(canvas, 0, 0)
                stream = canvas.getCurrentPageContent()
                # ReportLab's RGB command for the brand swatch, #F26222.
                self.assertEqual(stream.count(".94902 .384314 .133333 rg"), filled)
                self.assertEqual(len(re.findall(r"re W\*? n", stream)), clips)

    def output(self, report):
        # Built-in PDF fonts keep these fixture text streams readable without adding a PDF parser dependency.
        with patch.object(rl_config, "pageCompression", 0):
            pdf = render_pdf(report)
        self.assertTrue(pdf.startswith(b"%PDF-"))
        self.assertRegex(pdf, rb"/MediaBox\s*\[\s*0\s+0\s+595\.27\d*\s+841\.88\d*\s*\]")
        return pdf

    def test_company_only_allowlisted_fields_are_exported(self):
        r = projection(2)
        r["another_company"] = "PRIVATE OTHER COMPANY"
        r["hires"][0]["items"][0]["hirer"] = "PRIVATE WORKER"
        r["hires"][0]["items"][0]["holder"] = "Scoped Holder"
        pdf = self.output(r)
        for field in [b"Company on-hire report", b"Creek & Valley", b"Impact socket", b"ITEM-0000", b"ITEM-0001",
                      b"Scoped Holder", b"Unconfirmed", b"26 Nov 2026", b"08:45", b"28 Nov 2026 05:39 AEST", b"Page 1", b"POWERED BY SITEIQ"]:
            self.assertIn(field, pdf)
        self.assertNotIn(b"PRIVATE", pdf)
        self.assertNotIn(b"Return activity", pdf)
        self.assertIn(b"Company holding these assets: Creek & Valley", pdf)
        self.assertIn(b"ask your crew to return unneeded gear", pdf)
        self.assertIn(b"a correction or a fresh copy", pdf)

    def test_partial_issue_details_and_latest_rental_snapshot(self):
        r = projection(2)
        r["coverage"] = {"rental_asat": "2026-11-28T07:51"}
        r["hires"][0]["items"] = [{"item": "ASSET-123", "date": "", "time": "05:07"},
                                  {"item": "", "date": "2026-11-27", "time": ""}]
        pdf = self.output(r)
        for part in (b"28 Nov 2026 07:51 AEST", b"ASSET-123", b"Date not recorded", b"05:07",
                     b"Asset ID not recorded", b"27 Nov 2026", b"Time not"):
            self.assertIn(part, pdf)
        self.assertNotIn(b"05:39 AEST", pdf)

    def test_empty_current_hires_have_a_dated_report(self):
        pdf = self.output(projection(0))
        self.assertIn(b"No equipment is currently on hire", pdf)
        self.assertIn(b"28 Nov 2026 05:39 AEST", pdf)
        self.assertNotIn(b"ITEM-0000", pdf)

    def test_final_shift_deadline_in_worker_crew_and_return_list_documents(self):
        policy = dict(day_shift_date="2026-11-30", night_shift_date="2026-11-30",
                      night_finish_date="2026-12-01", day_store_finish="18:00", night_store_finish="06:00",
                      timezone="AEST", snapshot_stage="before_final_shifts")
        with patch.object(rl_config, "pageCompression", 0):
            for kind, list_only in (("company", True), ("company", False), ("person", False)):
                with self.subTest(kind=kind, list_only=list_only):
                    r = {**projection(0), "kind": kind, "return_groups": [], "return_instruction": policy,
                         "consumable_summary": {}, "consumables": [], "activity": [], "history": []}
                    doc = render_pdf(r, returns_only=list_only)
                    for text in (b"own final shift ends", b"Monday 30 Nov", b"Tuesday 1 Dec",
                                 b"18:00", b"06:00", b"rental snapshot shows no outstanding gear"):
                        self.assertIn(text, doc)
                    r["return_instruction"] = None
                    self.assertNotIn(b"Final shift returns", render_pdf(r, returns_only=list_only))

    def test_company_return_sheet_scopes_to_groups_and_handles_missing_date(self):
        r = projection(2)
        r['return_groups'] = [dict(holder="First holder", items=[
            dict(name="Cordless drill", item="DR-209", date="2026-11-27", time="06:40")]),
            dict(holder=None, items=[dict(name="Charger", item="CH-101", date="", time="")])]
        r['work_notes'] = [dict(title="Separate company milestone", date="2026-11-26", description="Other scope")]
        with patch.object(rl_config, "pageCompression", 0):
            data = render_pdf(r, returns_only=True)
            for value in (b"END-OF-SHIFT RETURN LIST", b"First holder", b"DR-209", b"CH-101", b"06:40",
                          b"Individual holder unconfirmed", b"Issue date unavailable"):
                self.assertIn(value, data)
            for value in (b"Separate company milestone", b"Record coverage", b"ITEM-0000", b"Same-day"):
                self.assertNotIn(value, data)
            r.update(asat="", coverage={}, return_groups=[])
            self.assertIn(b"needs a dated rental stock export", render_pdf(r, returns_only=True))
            with self.assertRaises(ValueError):
                render_pdf({**r,"kind":"person"}, returns_only=True)

    def test_multipage_repeats_header_and_contains_every_asset(self):
        pdf = self.output(projection(155))
        page_count = len(re.findall(rb"/Type /Page\b", pdf))
        self.assertGreater(page_count, 2)
        self.assertEqual(pdf.count(b"Date hired".upper()), page_count)
        self.assertEqual(pdf.count(b"POWERED BY SITEIQ"), page_count)
        self.assertEqual(pdf.count(b"SiteIQ pull 28 Nov 2026 05:39 AEST"), page_count)
        for i in range(155):
            self.assertEqual(pdf.count(row(i)["item"].encode()), 1)

    def test_personal_profile_has_own_activity_and_no_missing_score_fabrication(self):
        r = projection(1)
        r.update(kind="person", name="Pat Example", activity=[{"date": "2026-11-26", "issued": 1, "returned": 1, "consumable_units": 3}],
                 consumables=[{"name": "Disposable gloves", "quantity": 3}],
                 consumable_summary={"units": 3, "active_days": 1, "units_per_draw_day": 3},
                 returns={"issues": 1, "returned": 1, "same_day": 1, "eligible": 1, "score": None,
                          "method": "same_day", "due_dates_available": False},
                 coverage={"period_start": "2026-11-20", "period_end": "2026-11-28",
                           "transaction_periods": [{"start": "2026-11-20", "end": "2026-11-22"},
                                                   {"start": "2026-11-26", "end": "2026-11-28"}]},
                 history=[], unselected_people=["DO NOT EXPORT"],
                 work_notes=[{"date":"2026-11-25","title":"PRIVATE COMPANY NOTE","description":"PRIVATE"}])
        r["hires"][0]["items"][0]["holder"] = "DO NOT EXPORT"
        pdf = self.output(r)
        for part in [b"Pat Example", b"Creek & Valley", b"Disposable gloves", b"3 units per draw day",
                     b"measure unavailable", b"Due dates were unavailable", b"Daily activity"]:
            self.assertIn(part, pdf)
        self.assertNotIn(b"DO NOT EXPORT", pdf)
        self.assertNotIn(b"PRIVATE COMPANY NOTE", pdf)
        self.assertIn(b"Still to return", pdf)
        for section in (b"Record coverage", b"Daily activity", b"Return activity", b"Consumables drawn"):
            self.assertLess(pdf.index(b"ITEM-0000"), pdf.index(section))
        period = dict(current=True, schedule="Current verified shutdown", first_date="2026-11-26",
                      last_date="2026-11-26", activity_days=1, issues=1, returned=1, consumable_units=3,
                      consumable_returns=0, activity=r["activity"], equipment=[], consumables=[], coverage={})
        story_pdf = self.output(dict(r, story=[period]))
        self.assertLess(story_pdf.index(b"ITEM-0000"), story_pdf.index(b"This shutdown"))
        zero = self.output(dict(r, hires=[], hire_count=0, story=[period]))
        self.assertLess(zero.index(b"You have no equipment currently on hire"), zero.index(b"This shutdown"))

        self.assertNotIn(b"/ 5", pdf)
        self.assertIn(b"same Queensland calendar date", pdf)
        self.assertIn(b"night shift", pdf)
        self.assertIn(b"Before you leave site", pdf)
        self.assertIn(b"1 of 5 eligible completed", pdf)
        self.assertNotIn(b"SAME-DAY RETURN SCORE", pdf)
        qualifying = dict(r, returns={**r["returns"], "score": 3.5, "eligible": 8, "same_day": 5})
        rated = self.output(qualifying)
        self.assertIn(b"SAME-DAY RETURN SCORE", rated)
        self.assertIn(b"3.5 / 5", rated)
        self.assertRegex(rated, rb"re W\*? n")  # clip a genuine half-filled vector star
        self.assertLess(rated.index(b"SAME-DAY RETURN SCORE"), rated.index(b"ITEM-0000"))
        self.assertIn(b"20 Nov 2026 to 22 Nov 2026", pdf)
        self.assertIn(b"26 Nov 2026 to 28 Nov 2026", pdf)
        self.assertNotIn(b"20 Nov 2026 to 28 Nov 2026", pdf)
        r["consumable_summary"]["benchmark"] = dict(status="high", own_units=35, reference_users=15,
            threshold_units=21, period_start="2026-11-22", period_end="2026-11-28", method="Positive dated draws only.",
            internal_borrower="PRIVATE BORROWER")
        high_pdf = self.output(r)
        for word in (b"High-volume", b"35", b"Positive dated draws only."):
            self.assertIn(word, high_pdf)
        self.assertNotIn(b"PRIVATE BORROWER", high_pdf)
        self.assertNotIn(b"15 other recorded borrowers", high_pdf)
        r["consumable_summary"]["benchmark"]["status"] = "insufficient"
        insufficient = self.output(r)
        self.assertIn(b"Insufficient comparison data", insufficient)
        self.assertNotIn(b"15 other recorded borrowers", insufficient)

    def test_attributed_notes_and_shutdown_story_use_only_the_selected_company(self):
        r = projection(2)
        day = {"date": "2026-11-26", "issued": 3, "returned": 2, "consumable_units": 4, "consumable_returns": 0}
        current = dict(schedule="MMG Shutdown Novermber26-December26", current=True, first_date=day["date"],
                       last_date=day["date"], activity_days=1, issues=3, returned=2, consumable_units=4,
                       consumable_returns=0, activity=[day], equipment=[dict(name="Rigging shackle", issued=3, returned=2)],
                       consumables=[dict(name="Group gloves", quantity=4, returned=0)], coverage={},
                       worker_names=["PRIVATE FIELD"])
        r["story"] = [current, dict(current, schedule="Earlier verified shutdown", current=False)]
        r["work_notes"] = [dict(date="2026-11-26", title="Compressor service", description="Changed inlet filter.",
                                private_internal_field="PRIVATE COMMENT")]
        pdf = self.output(r)
        for field in [b"This shutdown", b"Daily tool movements", b"Group gloves", b"Rigging shackle",
                      b"Earlier verified shutdown", b"Company work notes", b"Work descriptions supplied by the company",
                      b"Compressor service", b"Changed inlet filter"]:
            self.assertIn(field, pdf)
        self.assertNotIn(b"PRIVATE", pdf)
        self.assertLess(pdf.index(b"ITEM-0001"), pdf.index(b"This shutdown"))
        self.assertLess(pdf.index(b"ITEM-0001"), pdf.index(b"Company work notes"))
        self.assertEqual(pdf.count(b"ITEM-0001"), 1)

    def test_missing_history_sources_are_distinct_from_a_measured_zero(self):
        r = projection(0)
        r.update(kind="person", name="Pat Example", coverage={}, activity=[], consumables=[],
                 consumable_summary={"units": 0, "returned_units": 0, "active_days": 0},
                 returns={"issues": 0, "returned": 0, "eligible": 0, "same_day": 0, "score": None},
                 history=[])
        period = dict(schedule="Past shutdown", current=False, activity_days=0, hire_count=0, issues=0, returned=0,
                      consumable_units=0, consumable_returns=0, activity=[], equipment=[], consumables=[], coverage={})
        r["story"] = [period]
        pdf = self.output(r)
        for part in (b"Previous shutdown activity", b"Dated activity records are unavailable",
                     b"Issue and return totals are unavailable", b"Consumable totals are unavailable",
                     b"Unavailable"):
            self.assertIn(part, pdf)
        for false_zero in (b"0 issued", b"0 of 5 eligible", b"0 assets were on hire at the saved"):
            self.assertNotIn(false_zero, pdf)
        r["coverage"] = {"transaction_periods": [{"start":"2026-11-26","end":"2026-11-27"}],
                         "sales_asat":"2026-11-28T05:39"}
        measured = self.output(r)
        self.assertIn(b"Recorded issues: 0. Recorded returns: 0.", measured)
        self.assertIn(b"Units drawn: 0. Units returned: 0.", measured)

    def test_first_page_receipts_ratings_and_crew_handover_remain_scoped(self):
        coverage = {"period_start": "2026-10-03T06:00", "period_end": "2026-10-04T06:00",
                    "sales_asat": "2026-10-04T06:30", "rental_asat": "2026-10-04T06:29"}
        stamp = "2026-10-03T17:10:07"
        receipt = {"returned_at": stamp, "precision": "second", "count": 2,
                   "items": [{"name": "Ratchet", "item": "RET-A", "worker": "PRIVATE"}]}
        worker = dict(projection(0), name="Alex Example", kind="person", coverage=coverage,
                      handover={"latest_return": receipt}, returns={"eligible": 2, "score": None,
                      "same_day": 2, "issues": 2, "returned": 2}, activity=[], consumables=[],
                      consumable_summary={"units": 3}, history=[])
        pdf = self.output(worker)
        for fragment in (b"Pending", b"Latest recorded return", b"2 hire records closed at",
                         b"3 Oct 2026 17:10:07 AEST", b"RET-A", b"Consumable units issued"):
            self.assertIn(fragment, pdf)
        self.assertNotIn(b"PRIVATE", pdf)
        by_date = self.output(dict(worker, handover={"latest_return": dict(receipt, precision="date")}))
        self.assertIn(b"2 hire records closed on 3 Oct 2026", by_date)
        self.assertNotIn(b"17:10:07", by_date)
        start = "2026-10-03T18:00"
        company = dict(projection(1), coverage=coverage,
                       return_rating={"score": 4, "eligible": 8, "same_day": 6, "worker": "PRIVATE"},
                       handover={"current_holders": 1, "unassigned_assets": 0, "latest_return": receipt, "oldest":
                                 {"name": "Impact socket", "item": "ITEM-0000", "issued_at": stamp,
                                  "elapsed_minutes": 768, "tied_count": 1, "holder": "Example Crew Holder"},
                                 "shift": {"name": "Night", "start": start, "end": "2026-10-04T06:00",
                                           "issued": 3, "returned": 2, "hourly": [
                                               {"start": start, "issued": 3, "returned": 2}],
                                           "peak_issue_hours": [start], "peak_return_hours": [start]}})
        crew = self.output(company)
        for fragment in (b"CREW SAME-DAY RETURNS", b"4 / 5", b"6 of 8 same day", b"Current holders",
                         b"Last fully covered shift", b"Tools issued: 3", b"Tools returned: 2",
                         b"Peak issue hour", b"Peak return hour", b"Longest-held equipment",
                         b"12h 48m held", b"Latest crew return", b"Example Crew Holder"):
            self.assertIn(fragment, crew)
        self.assertNotIn(b"PRIVATE", crew)
        self.assertNotIn(b"RET-A", crew)
        self.assertLess(crew.index(b"Last fully covered shift"), crew.index(b"Date hired".upper()))
        no_period = self.output(dict(company, coverage={}, handover={"shift": None}))
        self.assertIn(b"Awaiting dated records", no_period)
        self.assertNotIn(b"4 / 5", no_period)
        self.assertIn(b"Complete shift totals are unavailable", no_period)

    def test_store_activity_timing_frequency_ties_and_missing_clock_coverage(self):
        source = {"has_coverage": True, "active_days": 3, "interactions": 5, "first_at": "2026-10-02",
                  "last_at": "2026-10-04T23:40:03", "first_timed_at": "2026-10-03T08:10",
                  "last_timed_at": "2026-10-04T23:40:03", "date_only_events": 2, "undated_events": 1,
                  "unattributed_timed_events": 1, "busiest_hours": [8, 23],
                  "hourly": [{"hour": 8, "interactions": 2}, {"hour": 23, "interactions": 2}],
                  "daily": [{"private_worker": "PRIVATE COMPARISON WORKER"}]}
        subjects = [projection(1), dict(projection(0), kind="person", name="Example", returns={},
                                        consumables=[], consumable_summary={}, activity=[])]
        for subject in subjects:
            with self.subTest(kind=subject["kind"]):
                pdf = self.output(dict(subject, store_activity=source))
                for expected in (b"5 timed interactions across 3", b"Average 1.67", b"First recorded activity".upper(),
                                 b"Latest recorded activity".upper(), b"2 Oct 2026", b"3 Oct 2026 08:10 AEST",
                                 b"4 Oct 2026 23:40 AEST", b"Tied busiest hourly windows",
                                 b"08:00", b"23:00", b"00:00", b"2 timed interactions in each window",
                                 b"Date-only activity", b"Undated activity", b"Timed entries without a verified hirer"):
                    self.assertIn(expected, pdf)
                self.assertNotIn(b"PRIVATE COMPARISON WORKER", pdf)
                date_only = self.output(dict(subject, store_activity={"has_coverage": True, "active_days": 1,
                    "first_at": "2026-10-01", "last_at": "2026-10-01", "date_only_events": 2}))
                self.assertIn(b"no attributed clock times", date_only)
                self.assertNotIn(b"Average 0 per recorded", date_only)
                missing = self.output(dict(subject, store_activity={"has_coverage": False}))
                self.assertIn(b"Store activity records are unavailable", missing)
                empty = self.output(dict(subject, store_activity={"has_coverage": True, "active_days": 0}))
                self.assertIn(b"No dated store activity", empty)

    def test_generic_or_unscoped_inputs_are_rejected(self):
        for r in ({}, {"kind": "company", "name": ""}, {"kind": "inventory", "name": "full"}):
            with self.assertRaises(ValueError):
                render_pdf(r)


if __name__ == "__main__":
    unittest.main()
