"""Author: Andrew Fisher. Clarify quoted dates without allocating quoted costs.

Generic source-only patch. No private source payload or service call is included.
"""
import argparse
import hashlib
from pathlib import Path

HELPER = """/* A quoted period is source context, not proof of the work period. */
function acc762QuoteDateWarning(q){
 const from = acc762Date(q.start_date), to = acc762Date(q.end_date);
 if (from && to && to >= from) return 'Quoted period ' + from + ' to ' + to + '; work period still needs confirmation';
 return 'Quote hire dates need confirmation';
}
"""


def apply(text):
    old = "ex, 'Quote hire dates need confirmation', {quote: q.quote}"
    new = "ex, acc762QuoteDateWarning(q), {quote: q.quote}"
    anchor = 'function acc761Model(month){'
    if text.count(old) != 1 or text.count(anchor) != 1 or 'function acc762QuoteDateWarning(' in text:
        raise ValueError('Quote warning source changed or patch already applied; review required')
    return text.replace(anchor, HELPER + anchor, 1).replace(old, new, 1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input_html', type=Path)
    parser.add_argument('output_html', type=Path)
    args = parser.parse_args()
    result = apply(args.input_html.read_text())
    args.output_html.write_text(result)
    print(hashlib.sha256(result.encode()).hexdigest())
