#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded, export-only v5.91 patch on exact v5.90.
Usage: python3 patch_server_v591.py BASE_SERVER OUTPUT_SERVER
"""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep as checked_rep
BASE_SHA256 = '55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec'

def patch(base):
    if hashlib.sha256(base).hexdigest() != BASE_SHA256:
        raise ValueError('Expected exact server v5.90; wrong base or repeat refused.')
    text = base.decode('utf8')
    def replace(old, new):
        nonlocal text
        text = checked_rep(text, old, new, 'v5.91 export completeness', 'server v5.90')
    replace("const BUILD = 'server v5.90", "const BUILD = 'server v5.91")
    replace("build: 'v5.90'", "build: 'v5.91'")
    replace("const list = c => Object.values(docs[c] || {}).filter(d => d && d._k != null).map(strip);",
            "const list = c => Object.values(docs[c] || {}).filter(d => d && d._k != null).map(strip)\n      .sort((a, b) => String(c === 'added' ? a.key : a.id).localeCompare(String(c === 'added' ? b.key : b.id))); // native fromDocs list order")
    # Exact native ScopeSync1017 read semantics: atomic quantity metadata becomes the
    # export's loads cache; it never edits docs, quantities, delivery states or prices.
    replace("    const q = (docs.fenceQuote || {}).quote;", """    const q = (docs.fenceQuote || {}).quote;
    const scopeKind591 = 'quantityScope1017';
    const scopeInteger591 = v => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
    function scopeValid591(r, ref, typed) {
      return !!(r && r.kind === scopeKind591 && typeof ref === 'string' && ref && r.ref === ref &&
        (typed == null || scopeInteger591(typed) && typed > 0) && (r.typed ?? null) === (typed ?? null) &&
        typeof r.at === 'string' && Number.isFinite(Date.parse(r.at)) && Array.isArray(r.items) && r.items.length &&
        new Set(r.items.map(i => i?.item)).size === r.items.length && r.items.every(i => i &&
          typeof i.item === 'string' && i.item.trim() && scopeInteger591(i.quantity) && scopeInteger591(i.received) &&
          scopeInteger591(i.installed) && i.installed <= i.received && (!i.receipts || Array.isArray(i.receipts) &&
            i.receipts.every(p => p && scopeInteger591(p.quantity) && typeof p.at === 'string' && Number.isFinite(Date.parse(p.at))))));
    }
    const scopeLoads591 = loads => {
      const out = Object.fromEntries(Object.entries(loads || {}).filter(([, r]) => r?.kind !== scopeKind591));
      for (const d of Object.values(docs.qtys || {})) if (d && typeof d._k === 'string' && scopeValid591(d.scope1017, d._k, d.v))
        out[scopeKind591 + '/' + d._k] = JSON.parse(JSON.stringify(d.scope1017));
      return out;
    };""")
    replace("      docketPapers: map('docketPapers') };", """      docketPapers: val('docketPapers'),
      /* v5.91: every exportable native collection survives the hosted export. The native page explicitly
         excludes mapKeys because those are hosted-address credentials, not site records. Tracker secrets
         stay in their separate private stores and unknown collections are never copied wholesale. */
      lineRates: val('lineRates'), serviceNotes: list('serviceNotes'), fenceCollections: list('fenceCollections'),
      runRules: val('runRules'), answers: val('answers'), finance745: map('finance745'),
      photoLinks: map('photoLinks'), gates: map('gates'), spares: map('spares'),
      subhire: map('subhire'), vmsboard: map('vmsboard') };
    records.loads = scopeLoads591(records.loads);""")
    replace("      dropPhotos: records.dropPhotos, units: records.units, docketPapers: records.docketPapers, records };", """      dropPhotos: records.dropPhotos, units: records.units, docketPapers: records.docketPapers,
      service_notes: records.serviceNotes, fence_collections: records.fenceCollections,
      lineRates: records.lineRates, runRules: records.runRules, answers: records.answers, finance745: records.finance745,
      photoLinks: records.photoLinks, gates: records.gates, spares: records.spares,
      subhire: records.subhire, vmsboard: records.vmsboard,
      /* Match the native record-less envelope as well as its complete records object. */
      entries: records.entries, places: records.places, stamps: records.stamps, added: records.added,
      accessories: records.accessories, assetNumbers: records.assetNumbers, notes: records.notes,
      rates: records.rates, accRates: records.accRates, fenceRates: records.fenceRates,
      fenceCosts: records.fenceCosts, weeks: records.weeks, records };""")
    return text.encode('utf8')

if __name__ == '__main__':
    result = patch(Path(sys.argv[1]).read_bytes())
    Path(sys.argv[2]).write_bytes(result)
    print(hashlib.sha256(result).hexdigest(), len(result))
