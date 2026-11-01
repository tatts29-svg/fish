"""Author: Andrew Fisher. Synthetic fixtures only; no private rates or records."""
import unittest
from decimal import Decimal, ROUND_HALF_UP
from transport_precision import leg_amount, validate_leg, validate_leg_against_source

class SourcePrecisionTests(unittest.TestCase):
    def test_round_extension_once(self):
        self.assertEqual(leg_amount('2', '10.004'), Decimal('20.01'))
        self.assertEqual(leg_amount('2', '10.006'), Decimal('20.01'))
    def test_display_rate_is_not_calculation_rate(self):
        source=Decimal('10.004')
        self.assertNotEqual(leg_amount(2,source),leg_amount(2,source.quantize(Decimal('0.01'))))
    def test_single_units_and_exact_rates(self):
        self.assertEqual(leg_amount(1,'10.004'),Decimal('10.00'))
        self.assertEqual(leg_amount(3,'10.25'),Decimal('30.75'))
    def test_fractional_quantity_and_half_cent(self):
        self.assertEqual(leg_amount('0.5','10.01'),Decimal('5.01'))
    def test_total_is_sum_of_rounded_legs(self):
        self.assertEqual(sum(leg_amount(1,'10.004') for _ in range(3)),Decimal('30.00'))
        self.assertNotEqual(sum(leg_amount(1,'10.004') for _ in range(3)),leg_amount(3,'10.004'))
    def test_zero_is_not_invented_missing_value(self):
        self.assertEqual(leg_amount(0,'10.004'),Decimal('0.00'))
        self.assertEqual(leg_amount(3,0),Decimal('0.00'))
        with self.assertRaises(ValueError):leg_amount(3,None)
    def test_invalid_sources_refused(self):
        for bad in [True,False,'NaN','Infinity','-0.01','bad']:
            with self.subTest(bad=bad):
                with self.assertRaises(ValueError):leg_amount(1,bad)
                with self.assertRaises(ValueError):leg_amount(bad,1)
    def test_truncated_rate_refused_even_when_capture_ties(self):
        truncated={'loads':2,'rate':'10.00','amount':'20.00'}
        self.assertEqual(validate_leg(truncated),Decimal('20.00'))
        with self.assertRaises(ValueError):validate_leg_against_source(truncated,'10.004')
        self.assertEqual(validate_leg_against_source({'loads':2,'rate':'10.004','amount':'20.01'},'10.004'),Decimal('20.01'))
    def test_capture_uses_source_extension(self):
        self.assertEqual(validate_leg({'loads':2,'rate':'10.004','amount':'20.01'}),Decimal('20.01'))
        with self.assertRaises(ValueError):validate_leg({'loads':2,'rate':'10.004','amount':'20.00'})
        with self.assertRaises(ValueError):validate_leg({'loads':2,'rate':'10.004','amount':'20.005'})

if __name__=='__main__':unittest.main()
