"""Author: Andrew Fisher. Source-only transport precision review utility.

Keep the authoritative source unit rate unrounded. Round the extended leg once.
The function cannot recover precision already removed from an input capture: the
caller must match each rate to its authoritative source before calculating.
"""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

CENT = Decimal('0.01')

def _number(value):
    if isinstance(value, bool):
        raise ValueError('Boolean is not a quantity or rate')
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError) as error:
        raise ValueError('A finite source number is required') from error
    if not result.is_finite() or result < 0:
        raise ValueError('A finite nonnegative source number is required')
    return result

def leg_amount(quantity, source_unit_rate):
    """Return Decimal currency for a nonnegative transport-cost leg, rounded once."""
    return (_number(quantity) * _number(source_unit_rate)).quantize(CENT, rounding=ROUND_HALF_UP)

def validate_leg(leg):
    """Check a capture after its rate has independently been matched to source."""
    supplied = _number(leg['amount'])
    if supplied != supplied.quantize(CENT):
        raise ValueError('A leg amount must be an exact number of cents')
    expected = leg_amount(leg['loads'], leg['rate'])
    if supplied != expected:
        raise ValueError('Leg amount does not match the full source rate extension')
    return expected


def validate_leg_against_source(leg, authoritative_unit_rate):
    """Reject internally consistent captures whose rate lost source precision.

    authoritative_unit_rate must come from an independently matched original
    source, not from the leg being validated or its displayed rounded label.
    """
    source = _number(authoritative_unit_rate)
    if _number(leg['rate']) != source:
        raise ValueError('Captured rate differs from the authoritative source rate')
    return validate_leg(leg)
