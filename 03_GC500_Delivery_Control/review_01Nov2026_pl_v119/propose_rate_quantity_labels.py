"""Author: Andrew Fisher. Source-only transport rate-quantity wording proposal.

Changes display labels and a generic basis note, never the numeric multiplier.
The caller supplies source text and writes isolated review copies.
"""
NOTE = "Quantity follows the rate basis shown; it is not necessarily a count of truck trips."
def once(text, old, new):
    if text.count(old) != 1:
        raise ValueError("Expected one source anchor; reconcile the current version first")
    return text.replace(old, new)

def change_builder(text):
    text = once(text, "'#Loads'", "'#Rate qty'")
    text = once(text, "'Date', 'Loads', 'Rate', 'Rate from'", "'Date', 'Rate qty', 'Rate', 'Rate from'")
    anchor = "EST = json.load(open(P2 / 'transport_estimates_1nov.json'))"
    return once(text, anchor, anchor + "\nEST['method'] = EST['method'].rstrip('. ') + '. ' + " + repr(NOTE))

def change_tab(text):
    return once(text, '<th class="num">Loads</th><th class="num">Rate</th>', '<th class="num">Rate qty</th><th class="num">Rate</th>')

def main():
    import argparse
    from pathlib import Path
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source-root', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    args = ap.parse_args(); root = args.source_root.resolve(); out = args.output.resolve()
    if root == out or root in out.parents:
        raise ValueError('Review output must be outside the source checkout')
    for rel, change in [
        ('03_GC500_Delivery_Control/review_31Oct2026_october_month_end/build_monthend.py', change_builder),
        ('03_GC500_Delivery_Control/v12.79_pl_rehire_pack_v119_LIVE/plf1279_src.js', change_tab),
    ]:
        target = out / rel; target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(change((root / rel).read_text()))
    print('Review copies written. Numeric quantities and owner source are unchanged.')

if __name__ == '__main__':
    main()
