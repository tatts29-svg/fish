"""Name the source of entry-distance endpoints. Author: Andrew Fisher."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "toolchain"))
from rep import rep


SOURCE_HELPER = '''/* v8.34: the distance endpoint retains its source; the coordinates stay unchanged. */
function entryDropBasis834(ref, fix){
 if (!fix.master) return 'location pinned on the map';
 const source = locSrc782(ref);
 if (source && source.kind === 'confirmed') return 'the position confirmed by the project manager';
 if (source && source.kind === 'unverified') return 'the unverified drawing position';
 return 'the master-plan position';
}
'''

OLD_BASIS = """ if (best && best.fix && best.fix.lat != null) { to = {lat: best.fix.lat, lon: best.fix.lon}; basis = 'the pinned spot'; }"""
NEW_BASIS = """ if (best && best.fix && best.fix.lat != null) { to = {lat: best.fix.lat, lon: best.fix.lon}; basis = entryDropBasis834(ref, best.fix); }"""
OLD_TOOLTIP = """ title="Measured on the ground from the lane entry to ${esc(d.basis)} - not a driving distance and not a route."""
NEW_TOOLTIP = """ title="Calculated straight-line distance to ${esc(d.basis)} — not a driving route."""

REPLACEMENTS = (
    ("function entryToDrop(ref){", SOURCE_HELPER + "function entryToDrop(ref){", "entry-distance source helper"),
    (OLD_BASIS, NEW_BASIS, "entry-distance endpoint provenance"),
    (OLD_TOOLTIP, NEW_TOOLTIP, "calculated entry-distance wording"),
)


def apply(text):
    """Apply guarded presentation changes; the caller owns base and release guards."""
    if "function entryDropBasis834(" in text:
        raise ValueError("v8.34 map provenance already applied")
    for old, new, purpose in REPLACEMENTS:
        text = rep(text, old, new, purpose, "map_provenance834", True)
    return text
