"""shut_costs: labour is hours times the typed rate, charges are as typed,
and "to date" stops at the day of the pull. Made-up figures only."""
import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import shut_costs  # noqa: E402

SPEC = {
    "rates": {"Day": 10.0, "Night": 20.0},
    "roster": [
        {"date": "2030-01-01", "type": "Mobilisation", "name": "A Person", "shift": "Day", "start": "06:00", "finish": "18:00", "hours": 12},
        {"date": "2030-01-02", "type": "Shutdown", "name": "A Person", "shift": "Day", "start": "06:00", "finish": "18:00", "hours": 12},
        {"date": "2030-01-02", "type": "Shutdown", "name": "B Person", "shift": "Night", "start": "18:00", "finish": "06:00", "hours": 12},
        {"date": "2030-01-03", "type": "Shutdown", "name": "B Person", "shift": "Night", "start": "18:00", "finish": "06:00", "hours": 6},
    ],
    "charges": [{"date": "2030-01-02", "tooling": 100.5, "services": 5}, {"date": "2030-01-03", "tooling": 100.5, "services": 5},
                {"date": "2030-01-01", "flights": 50}],
    "starts": {"labour": "2030-01-01", "nights": "2030-01-02"},
}


class ShutCosts(unittest.TestCase):
    def setUp(self):
        self.c = shut_costs.build(SPEC, dt.date(2030, 1, 2))

    def test_labour_is_hours_times_rate(self):
        self.assertEqual([r["cost"] for r in self.c["roster"]], [120.0, 120.0, 240.0, 120.0])

    def test_totals_by_category(self):
        cats = {c["key"]: c for c in self.c["cats"]}
        self.assertEqual(cats["labour"]["total"], 600.0)
        self.assertEqual(cats["tooling"]["total"], 201.0)
        self.assertEqual(cats["services"]["total"], 10.0)
        self.assertEqual(cats["flights"]["total"], 50.0)
        self.assertEqual(self.c["total"], 861.0)

    def test_to_date_stops_at_the_pull_day(self):
        self.assertEqual(self.c["sofar"], 120 + 50 + 120 + 240 + 100.5 + 5)
        self.assertEqual([d["done"] for d in self.c["days"]], [True, True, False])
        self.assertEqual(self.c["hours_done"], 36)
        self.assertEqual(self.c["hours"], 42)

    def test_running_total_ends_at_the_total(self):
        self.assertEqual(self.c["days"][-1]["running"], self.c["total"])
        self.assertEqual(sum(d["total"] for d in self.c["days"]), self.c["total"])

    def test_people(self):
        p = {x["name"]: x for x in self.c["people"]}
        self.assertEqual((p["B Person"]["hours"], p["B Person"]["cost"], p["B Person"]["night"]), (18, 360.0, 2))
        self.assertEqual(p["B Person"]["cost_done"], 240.0)

    def test_a_shift_without_a_rate_stops_the_build(self):
        bad = dict(SPEC, roster=[dict(SPEC["roster"][0], shift="Swing")])
        with self.assertRaises(ValueError):
            shut_costs.build(bad, dt.date(2030, 1, 2))


if __name__ == "__main__":
    unittest.main()
