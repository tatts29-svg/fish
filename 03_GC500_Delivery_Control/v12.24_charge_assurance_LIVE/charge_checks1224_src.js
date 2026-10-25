/* Author: Andrew Fisher. Read-only currency reconciliation for charge assurance.
 * Inputs are dollar Numbers or decimal strings; outputs are integer cents.
 * Decimal strings retain source precision. A Number is interpreted through its
 * canonical decimal string, not through its binary floating-point expansion.
 * This helper checks arithmetic only; it never chooses an invoice rounding
 * boundary, prices a line, changes a record or establishes billing readiness.
 */
(function (root) {
  'use strict';

  const LIMIT = BigInt(Number.MAX_SAFE_INTEGER);
  const safe = value => value >= -LIMIT && value <= LIMIT ? Number(value) : null;

  // ROUND_HALF_UP: exact decimal ties round away from zero, including negatives.
  function cents(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const text = String(value).trim();
    if (!text || !Number.isFinite(Number(text))) return null;
    const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
    if (!match) return null;
    const fraction = match[4] === undefined ? (match[3] || '') : match[4];
    const digits = ((match[2] || '') + fraction).replace(/^0+/, '') || '0';
    if (digits === '0') return 0;

    // Work out the decimal point before allocating a BigInt. Very large or tiny
    // exponents therefore cannot request an enormous power of ten.
    const shift = 2 + Number(match[5] || 0) - fraction.length;
    const length = digits.length + shift;
    let magnitude;
    if (length < 0) magnitude = 0n;
    else if (length === 0) magnitude = digits[0] >= '5' ? 1n : 0n;
    else {
      if (length > 16) return null;
      if (shift >= 0) magnitude = BigInt(digits) * (10n ** BigInt(shift));
      else {
        magnitude = BigInt(digits.slice(0, length));
        if (digits[length] >= '5') magnitude += 1n;
      }
    }
    return safe(match[1] === '-' ? -magnitude : magnitude);
  }

  // Parts may be dollar inputs or {label, amount} entries. Missing or invalid
  // parts make the result unavailable; an explicit empty list is a known zero.
  // Variance is actual minus expected. Every returned monetary field is either
  // a safe integer number of cents or null when it cannot be established.
  function reconcile(label, expected, parts) {
    const expectedCents = cents(expected);
    let actualCents = null;
    if (Array.isArray(parts)) {
      let sum = 0n, valid = true;
      for (const part of parts) {
        const amount = part !== null && typeof part === 'object' &&
          Object.prototype.hasOwnProperty.call(part, 'amount') ? part.amount : part;
        const value = cents(amount);
        if (value === null) { valid = false; break; }
        sum += BigInt(value);
      }
      if (valid) actualCents = safe(sum);
    }
    const variance = expectedCents !== null && actualCents !== null
      ? safe(BigInt(actualCents) - BigInt(expectedCents)) : null;
    return {
      label,
      status: variance === null ? 'unavailable' : variance === 0 ? 'pass' : 'fail',
      expected: expectedCents,
      actual: actualCents,
      variance
    };
  }

  const api = Object.freeze({cents, reconcile});
  if (root) root.ChargeChecks1224 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
