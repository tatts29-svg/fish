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
        pdf = self.output(r)
        for field in [b"Company on-hire report", b"Creek & Valley", b"Impact socket", b"ITEM-0000", b"ITEM-0001",
                      b"26 Nov 2026", b"08:45", b"28 Nov 2026 05:39 AEST", b"Page 1", b"POWERED BY SITEIQ"]:
            self.assertIn(field, pdf)
        self.assertNotIn(b"PRIVATE", pdf)
        self.assertNotIn(b"Return activity", pdf)

    def test_empty_current_hires_have_a_dated_report(self):
        pdf = self.output(projection(0))
        self.assertIn(b"No equipment is currently on hire", pdf)
        self.assertIn(b"28 Nov 2026 05:39 AEST", pdf)
        self.assertNotIn(b"ITEM-0000", pdf)

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
        pdf = self.output(r)
        for part in [b"Pat Example", b"Creek & Valley", b"Disposable gloves", b"3 units per draw day",
                     b"measure unavailable", b"Due dates were unavailable", b"Daily activity"]:
            self.assertIn(part, pdf)
        self.assertNotIn(b"DO NOT EXPORT", pdf)
        self.assertNotIn(b"PRIVATE COMPANY NOTE", pdf)
        self.assertIn(b"Currently on hire to you", pdf)
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

    def test_generic_or_unscoped_inputs_are_rejected(self):
        for r in ({}, {"kind": "company", "name": ""}, {"kind": "inventory", "name": "full"}):
            with self.assertRaises(ValueError):
                render_pdf(r)


if __name__ == "__main__":
    unittest.main()
