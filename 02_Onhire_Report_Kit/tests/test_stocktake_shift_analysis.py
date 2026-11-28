import unittest

import stocktake


DAY = "2026-11-27"
NEXT = "2026-11-28"
JOB = stocktake.NOVEMBER_SCHEDULE


def at(clock, day=DAY):
    return day + "T" + clock


def stock(asset, kind="tool", area="Container", category="Hand tools"):
    return {"kind": kind, "key": asset, "storage_unit": area, "category": category}


def scan(asset, clock, who="A", *, kind="tool", quantity=1, day=DAY, action="Stocktake", period=1):
    return {"kind": kind, "key": asset, "sighted": at(clock, day), "who": who,
            "action": action, "quantity": quantity, "round": period}


def plan(name, shift="Day", day=DAY, start=None, finish=None):
    return {"iso": day, "name": name, "shift": shift, "start": start or ("06:00" if shift == "Day" else "18:00"),
            "finish": finish or ("18:00" if shift == "Day" else "06:00"), "rate": 999}


def window(start, end, pulled=None):
    return {"start": start, "end": end, "asat": pulled or end}


def model(rows, scans, cutoff=at("07:17", NEXT), windows=None):
    return {"schedule": JOB, "arrival": DAY, "departure": NEXT, "asat": cutoff,
            "rounds": [{"start": DAY, "end": NEXT, "carry_forward": {"status": "accepted"}},
                       {"start": DAY, "end": "2026-11-30"}],
            "windows": [window(at("00:00"), cutoff)] if windows is None else windows,
            "rows": rows, "sightings": scans}


def manual(asset, clock, who, req, *, kind="tool", qty=1, day=DAY):
    return {"schedule": JOB, "kind": kind, "item_id": asset, "counted_at": at(clock, day) + "+10:00",
            "quantity": qty, "person": who, "request_id": req, "round": "routine"}


def operator(shift, name):
    return next(p for p in shift["operators"] if p["name"] == name)


class ShiftAnalysisTests(unittest.TestCase):
    def test_boundaries_and_asat_handover_pending_ids(self):
        st = model([stock(k) for k in ("One", "Two", "Three", "Four")], [
            scan("One", "16:00"), scan("Two", "18:00"), scan("Three", "02:00", day=NEXT),
            scan("Four", "06:00", day=NEXT)])
        result = stocktake.shift_analysis(st, [plan("A"), plan("A", "Night"), plan("A", day=NEXT)])
        day, night, current = result["shifts"]
        self.assertEqual([s["count_events"] for s in result["shifts"]], [1, 2, 1])
        self.assertEqual(night["date"], DAY)
        self.assertFalse(day["ongoing"])
        self.assertTrue(current["ongoing"])
        self.assertEqual(current["elapsed_minutes"], 77)
        self.assertEqual([h["count_events"] for h in current["hours"]], [1, 0])
        self.assertEqual({p["key"] for p in day["follow_up"]["areas"][0]["pending_ids"]}, {"Two", "Three", "Four"})
        self.assertEqual(night["follow_up"]["areas"][0]["pending_ids"], [{"kind": "tool", "key": "Four"}])
        self.assertEqual(night["follow_up"]["areas"][0]["still_remaining"], 0)
        self.assertEqual(current["follow_up"]["areas"], [])
        self.assertEqual(result["follow_up"]["pending_ids"], [])

    def test_exact_cutoff_on_hour_and_request_duration(self):
        st = model([stock("X")], [scan("X", "16:00")], at("16:00"),
                   [window(at("06:00:30"), at("17:30"), at("16:00"))])
        result = stocktake.shift_analysis(st, [plan("A"), plan("A", "Night")])
        self.assertEqual(len(result["shifts"]), 1)
        shift = result["shifts"][0]
        self.assertEqual(shift["coverage"], "partial")
        self.assertEqual(shift["window_minutes"], 599)
        self.assertEqual([(h["start"], h["count_events"], h["elapsed_minutes"]) for h in shift["hours"][-2:]],
                         [(at("15:00:00"), 0, 60), (at("16:00:00"), 1, 0)])
        self.assertEqual(result["follow_up"]["pending_ids"], [])

    def test_two_rostered_people_and_only_confirmed_counts_attributed(self):
        st = model([stock("X"), stock("Y"), stock("C", "cons", "")], [
            scan("X", "07:00", "Cody Mitchell"), scan("X", "08:00", "Cody Mitchell"),
            scan("Y", "09:30", "", quantity=0), scan("Y", "10:00", "A", quantity=3),
            scan("C", "11:00", "A", kind="cons", action="Sale"),
            scan("C", "12:00", "A", action=""),
            scan("Y", "12:30", "Unrostered", quantity=0),
        ], at("14:00"))
        s = stocktake.shift_analysis(st, [plan("Cody Mitchel"), plan("A", start="09:00", finish="13:00")])["shifts"][0]
        self.assertEqual(s["count_events"], 3)
        self.assertEqual((s["tools"], s["cons"], s["unattributed_counts"], s["unconfirmed_counts"]), (2, 0, 1, 1))
        self.assertEqual({p["name"] for p in s["operators"]}, {"A", "Cody Mitchell", "Unrostered"})
        c = operator(s, "Cody Mitchell")
        self.assertEqual((c["count_events"], c["tools"]), (2, 1))
        self.assertEqual([(g["start"], g["end"]) for g in c["gaps"]][-1], (at("08:00:00"), at("14:00:00")))
        a = operator(s, "A")
        self.assertEqual((a["count_events"], a["first"], a["unconfirmed_counts"]), (0, "", 1))
        self.assertEqual([g["minutes"] for g in a["gaps"]], [60, 180])
        self.assertEqual(a["gaps"][1]["other_sightings"], 2)
        self.assertEqual([h["start"][11:16] for h in a["hours"]], ["09:00", "10:00", "11:00", "12:00"])
        self.assertEqual(a["elapsed_minutes"], 240)
        self.assertEqual(operator(s, "Unrostered")["interval_basis"], "observed")
        self.assertEqual(operator(s, "Unrostered")["gaps"], [])
        self.assertTrue(all("rate" not in p for p in s["planned"]))
        st["schedule"] = "OTHER"
        other = stocktake.shift_analysis(st, [plan("Cody Mitchel")])["shifts"][0]
        self.assertIn("Cody Mitchel", [p["name"] for p in other["operators"]])
        self.assertIn("Cody Mitchell", [p["name"] for p in other["operators"]])

    def test_window_gaps_later_portal_same_item_recounts_and_ledger_clock(self):
        current = [stock("Case-01"), stock("Outside", area="Other"), stock("SKU", kind="cons", area="")]
        st = model(current, [scan("Removed", "07:00"), scan("Case-01", "09:00")], at("11:00"),
                   [window(at("06:00"), at("08:00")), window(at("07:00"), at("09:00")),
                    window(at("10:00"), at("11:00"))])
        st["recorded_entries"] = [manual("Outside", "10:00", "Superseded", "0")]
        later = manual("case-01", "13:15", "B", "1")
        second = manual("case-01", "13:45", "B", "2")
        excluded = dict(manual("Outside", "14:30", "B", "3"), schedule="OTHER")
        r = stocktake.shift_analysis(st, [plan("A")], [later, second, later, excluded], "2027-01-01T12:00")
        shift = r["shifts"][0]
        self.assertEqual((r["count_events"], r["tools"], r["cons"]), (4, 2, 0))
        self.assertEqual((r["asat"], r["siteiq_asat"]), (at("13:45:00"), at("11:00:00")))
        self.assertEqual(shift["coverage"], "partial")
        self.assertEqual(shift["window_minutes"], 240)
        self.assertFalse(any(g["end"] > at("11:00") + ":00" for g in shift["gaps"]))
        self.assertEqual({p["key"] for p in r["follow_up"]["pending_ids"]}, {"Outside", "SKU"})
        self.assertEqual(r["follow_up"]["unlocated"], {"tools": 0, "cons": 1})
        self.assertEqual(shift["follow_up"]["areas"], [])
        self.assertEqual(r["follow_up"]["round"], "closeout")
        self.assertFalse(any(p["name"] == "Superseded" for p in shift["operators"]))
        self.assertEqual(stocktake.shift_analysis(st, [plan("A")], [])["asat"], at("11:00:00"))

    def test_later_roster_start_isnt_a_completed_or_absent_operator(self):
        st = model([stock("X")], [scan("X", "07:00")], at("07:00"))
        s = stocktake.shift_analysis(st, [plan("A"), plan("B", start="09:00", finish="13:00")])["shifts"][0]
        upcoming = operator(s, "B")
        self.assertTrue(upcoming["upcoming"])
        self.assertEqual((upcoming["elapsed_minutes"], upcoming["elapsed_end"]), (0, ""))
        self.assertEqual(upcoming["gaps"], [])
        only_later_roster = stocktake.shift_analysis(st, [plan("B", start="09:00", finish="13:00")])
        self.assertEqual(only_later_roster["shifts"][0]["count_events"], 1)
        self.assertEqual(only_later_roster["follow_up"]["pending_ids"], [])

    def test_no_window_is_unknown_and_unrequested_is_none(self):
        st = model([stock("A")], [], at("12:00"), [])
        unknown = stocktake.shift_analysis(st, [plan("C")])
        self.assertFalse(unknown["count_events"])
        self.assertIsNone(next((p for p in unknown["shifts"] if p["date"] == NEXT), None))
        self.assertEqual(unknown["shifts"][0]["coverage"], "unknown")
        self.assertEqual(unknown["shifts"][0]["gaps"], [])
        st["windows"] = [window(at("02:00"), at("03:00"))]
        shift = stocktake.shift_analysis(st, [plan("C")])["shifts"][0]
        self.assertEqual(shift["coverage"], "none")
        self.assertEqual(shift["gaps"], [])

    def test_unrostered_no_gap_before_or_after_actual_counts(self):
        st = model([stock("A")], [scan("A", "09:00"), scan("A", "11:00")], at("15:00"))
        r = stocktake.shift_analysis(st)
        s = r["shifts"][0]
        self.assertEqual(r["count_events"], 2)
        self.assertEqual(s["gaps"], [{"start": at("09:00:00"), "end": at("11:00:00"),
                                      "minutes": 120, "other_sightings": 0}])
        self.assertEqual((operator(s, "A")["start"], operator(s, "A")["end"]), (at("09:00:00"), at("11:00:00")))


    def test_named_clock_minutes_do_not_merge_stores_or_cross_midnight(self):
        scans = [dict(scan("A", "23:57:30"), tool_store="Store A", storage_unit="Bin 1"),
                 dict(scan("B", "23:59:05"), tool_store="Store A", storage_unit="Bin 2"),
                 dict(scan("C", "23:59:35"), tool_store="Store B"),
                 dict(scan("D", "00:00:01", day=NEXT), tool_store="Store A"),
                 dict(scan("E", "00:01:59", day=NEXT), tool_store="Store A"),
                 scan("F", "00:03", who="", day=NEXT)]
        st = model([stock(key) for key in "ABCDEF"], scans, at("00:15", NEXT),
                   [window(at("23:55:00"), at("00:04:00", NEXT)), window(at("00:10:00", NEXT), at("00:15:00", NEXT))])
        s = stocktake.shift_analysis(st, [plan("A", "Night")])["shifts"][0]
        t = operator(s, "A")["activity_timeline"]
        self.assertEqual(t["minutes_with_counts"], 4)
        self.assertEqual(t["first_to_last_minutes"], 4)
        self.assertEqual([(w["store"], w["count_events"], w["minutes_with_counts"]) for w in t["windows"]],
                         [("Store A", 1, 1), ("Store A", 1, 1), ("Store B", 1, 1), ("Store A", 2, 2)])
        self.assertEqual(t["windows"][0]["areas"], [{"name": "Bin 1", "count_events": 1}])
        self.assertEqual(t["windows"][0]["sources"], ["SiteIQ"])
        self.assertEqual(t["windows"][-1]["start"], at("00:00:01", NEXT))
        self.assertEqual(t["windows"][-1]["end"], at("00:01:59", NEXT))
        self.assertEqual([(g["start"], g["end"]) for g in t["gaps"]],
                         [(at("23:55:00"), at("23:57:00")), (at("23:58:00"), at("23:59:00")),
                          (at("00:02:00", NEXT), at("00:04:00", NEXT)),
                          (at("00:10:00", NEXT), at("00:15:00", NEXT))])
        self.assertEqual(s["unattributed_counts"], 1)
        self.assertEqual(operator(s, "A")["count_events"], 5)

    def test_nonstandard_roster_source_cutoffs_and_date_only(self):
        roster = [plan("A", "Day", start="05:00", finish="17:00")]
        events = [scan("a", "05:30", who="A"), dict(scan("b", "05:35"), sighted=DAY),
                  scan("c", "08:00", who="A")]
        st = model([stock(k) for k in "abc"], events, at("07:17"))
        result = stocktake.shift_analysis(st, roster,
            [manual("c", "09:00", "A", "late"), manual("c", "07:40", "A", "valid")], at("08:30"))
        self.assertEqual(result["siteiq_asat"], at("07:17:00"))
        self.assertEqual(result["asat"], at("07:40:00"))
        self.assertEqual(len(result["shifts"]), 1)
        person = operator(result["shifts"][0], "A")
        self.assertEqual(person["count_events"], 2)
        self.assertEqual(person["activity_timeline"]["minutes_with_counts"], 2)
        self.assertEqual(person["activity_timeline"]["windows"][-1]["sources"], ["Portal"])
        self.assertTrue(all(g["end"] <= at("07:17:00") for g in person["activity_timeline"]["gaps"]))

    def test_private_minute_chart_matches_dated_operators_sources_and_coverage(self):
        cut = at("13:00")
        st = model([stock(k) for k in "ABCDEFGH"], [
            scan("A", "07:15:00", who="A"), scan("B", "07:15:59", who="A"),
            scan("C", "07:15:12", who="B"), scan("D", "07:15:32", who=""),
            scan("E", "08:00:00", who="B"),  # included at source boundary
            scan("F", "09:00:00", who="A"),  # record outside requested export windows
            scan("G", "10:05:01", who="A", action="Sale"),
            scan("H", "13:01:00", who="A")], cut, [
            window(at("07:00:13"), at("08:00:00")), window(at("09:50:10"), at("10:44:11"))])
        manual_rows = [manual("C", "11:17", "A", "portal")]
        plans = [plan("A", start="07:10", finish="12:00"), plan("B", start="07:00", finish="08:30")]
        shift = stocktake.shift_analysis(st, plans, manual_rows, at("14:00"))["shifts"][0]
        a, b = operator(shift, "A"), operator(shift, "B")
        self.assertEqual(shift["minute_counts"], [
            {"at": at("07:15"), "count_events": 3}, {"at": at("08:00"), "count_events": 1},
            {"at": at("11:17"), "count_events": 1}])
        self.assertEqual(a["minute_counts"], [
            {"at": at("07:15"), "count_events": 2}, {"at": at("11:17"), "count_events": 1}])
        self.assertEqual(a["minute_counts"], a["activity_timeline"]["minute_counts"])
        self.assertEqual(b["minute_counts"], [
            {"at": at("07:15"), "count_events": 1}, {"at": at("08:00"), "count_events": 1}])
        self.assertEqual(shift["covered_intervals"], [
            {"start": at("07:00:13"), "end": at("08:00:00")},
            {"start": at("09:50:10"), "end": at("10:44:11")}])
        self.assertEqual(a["covered_intervals"][0]["start"], at("07:10:00"))
        self.assertEqual(b["covered_intervals"], shift["covered_intervals"][:1])
        self.assertNotIn("minute_counts", st)  # shared report input remains free of manager series

    def test_operating_day_chart_keeps_distinct_lines_and_dated_night_records(self):
        pulled = at("00:07:15", NEXT)
        st = model([stock("A"), stock("C", "cons")], [
            scan("A", "06:00:00", "Day controller"), scan("A", "06:28:22", "Day controller"),
            scan("C", "18:00:30", "Night controller", kind="cons", quantity=50),
            scan("A", "18:05:00", "Night controller"),
            scan("A", "00:00:31", "Night controller", day=NEXT),
            scan("A", "00:06:00", "", day=NEXT),
            scan("A", "18:04:00", "Night controller", action="Rental"),
            dict(scan("A", "18:05:00", "Night controller"), sighted=DAY),
        ], pulled, [window(at("06:00:00"), pulled)])
        trends = stocktake.shift_analysis(st, [plan("Day controller"), plan("Night controller","Night")])["trends"]
        self.assertEqual([d["date"] for d in trends["days"]], [DAY])
        day = trends["days"][0]
        crew = day["profiles"][0]
        self.assertEqual((len(crew["bins"]), crew["count_events"], crew["tools"], crew["cons"],
                          crew["first"], crew["last"], crew["unattributed_counts"]),
                         (48, 5, 1, 1, at("06:00:00"), at("00:00:31", NEXT), 1))
        self.assertEqual((crew["bins"][0]["count_events"], crew["bins"][0]["tools"]),
                         (2, 1))
        self.assertEqual(crew["bins"][0]["minutes"], [("06:00", 1), ("06:28", 1)])
        self.assertEqual([p["name"] for p in day["shifts"][0]["profiles"]], ["", "Day controller"])
        night = day["shifts"][1]["profiles"][1]
        self.assertEqual((len(night["bins"]), night["count_events"], night["tools"], night["cons"]), (24, 3, 1, 1))
        self.assertEqual((night["bins"][12]["coverage"], night["bins"][12]["elapsed_end"]), ("partial", pulled))
        self.assertEqual(night["bins"][12]["covered"], [{"start": at("00:00:00", NEXT), "end": pulled}])
        self.assertEqual(night["bins"][13]["coverage"], "future")
        self.assertIsNone(night["bins"][13]["count_events"])

    def test_operating_chart_preserves_uncovered_named_scans_and_manual_evidence(self):
        st = model([stock("A")], [scan("A","13:20","Worker")], at("14:00"),
                   [window(at("07:01:00"), at("07:17:00"))])
        manual_entries = [manual("A", "15:03", "Worker", "first"), manual("A","15:03","Worker","first")]
        result = stocktake.shift_analysis(st, [plan("Worker")], manual_entries, at("15:04"))
        crew = result["trends"]["days"][0]["profiles"][0]
        self.assertEqual(crew["count_events"], 2)
        self.assertEqual(crew["bins"][6]["coverage"], "unknown")
        self.assertIsNone(crew["bins"][6]["tools"])
        self.assertEqual((crew["bins"][2]["coverage"], crew["bins"][2]["count_events"]), ("partial", 0))
        self.assertEqual((crew["bins"][14]["coverage"], crew["bins"][14]["count_events"]), ("partial", 1))
        self.assertEqual(crew["bins"][14]["covered"], [])
        self.assertEqual((crew["bins"][18]["coverage"], crew["bins"][18]["count_events"]), ("partial", 1))
        self.assertEqual(crew["bins"][19]["coverage"], "future")


if __name__ == "__main__":
    unittest.main()
