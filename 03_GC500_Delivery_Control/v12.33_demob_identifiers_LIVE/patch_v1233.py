"""Author: Andrew Fisher. Label Demob identifiers without changing their records."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE = '6987269676b8d9089742978032208ffc930ebc4165471d13296285f9c745cd6f'
OLD = r'''  function specs(r) {
    let P = []; try { P = W.Loading931 ? W.Loading931.referenceProducts931(r.a || assetOf(r.key)) || [] : []; } catch (e) { P = []; }
    const nos = [], facts = [];
    P.forEach(p => { (p.units || []).forEach(u => { const n = String(u.assetNo || '').trim(); if (n && !/^MISCITEM|^SUB\b/i.test(n) && nos.indexOf(n) < 0) nos.push(n); });
      (p.facts || []).forEach(f => { const v = (f.values || []).join(' · '); if (!v) return; const s = {k: LABEL(String(f.label || '')), v, guide: /^Guide/.test(String(f.label || ''))}; if (!facts.some(x => x.k === s.k && x.v === s.v)) facts.push(s); }); });
    return {nos, facts};
  }
  function specHtml(r) {
    const s = specs(r); if (!s.nos.length && !s.facts.length) return '<div class="sp1231"><div class="fx1231 none">Asset no. and size not on record</div></div>';
    const word = f => f.k === 'Guide model' ? 'guide ' + f.v : f.k === 'Guide range' ? 'guide range ' + f.v : f.k === 'Rating' ? f.v : f.v + ' (' + f.k.replace(/^Rating \(|^Size \(|^Footprint \(|\)$/g, '').toLowerCase() + ')';
    return '<div class="sp1231">' + (s.nos.length ? '<div class="an1231">Asset no. <b>' + e1231(s.nos.slice(0, 6).join(' · ')) + '</b>' + (s.nos.length > 6 ? ' <em>+' + (s.nos.length - 6) + ' more</em>' : '') + '</div>' : '') +
      (s.facts.length ? '<div class="fx1231">' + s.facts.slice(0, 3).map(f => e1231(word(f))).join(' · ') + '</div>' : '<div class="fx1231 none">Size not on record</div>') + '</div>';
  }'''

NEW = r'''  /* demob-identifiers1233: presentation only; the source identifiers stay intact. */
  function specs(r) {
    let P = [], bulk = false;
    try { bulk = typeof unnumbered === 'function' && unnumbered(r.a || assetOf(r.key)); } catch (e) { bulk = false; }
    try { P = W.Loading931 ? W.Loading931.referenceProducts931(r.a || assetOf(r.key)) || [] : []; } catch (e) { P = []; }
    const nos = [], facts = [], codes = [], assetNos = [];
    const types = new Set(P.map(p => String(p.item || '').trim().toLowerCase()).filter(Boolean));
    const oneType = types.size === 1 && P.every(p => String(p.item || '').trim());
    const bulkProduct = p => { const item = String(p.item || '').trim();
      return bulk && !!item && (oneType || (typeof UNNUMBERED_RX !== 'undefined' && UNNUMBERED_RX.test(item)) || /^TL2$/i.test(item)); };
    P.forEach(p => { const target = bulkProduct(p) ? codes : assetNos;
      (p.units || []).forEach(u => { const n = String(u.assetNo || '').trim(); if (n && !/^MISCITEM|^SUB\b/i.test(n)) {
        if (nos.indexOf(n) < 0) nos.push(n); if (target.indexOf(n) < 0) target.push(n); } });
      (p.facts || []).forEach(f => { const v = (f.values || []).join(' · '); if (!v) return; const s = {k: LABEL(String(f.label || '')), v, guide: /^Guide/.test(String(f.label || ''))}; if (!facts.some(x => x.k === s.k && x.v === s.v)) facts.push(s); }); });
    return {nos, facts, codes, assetNos, notNumbered: bulk && (!P.length || P.every(bulkProduct))};
  }
  function specHtml(r) {
    const s = specs(r); if (!s.notNumbered && !s.nos.length && !s.facts.length) return '<div class="sp1231"><div class="fx1231 none">Asset no. and size not on record</div></div>';
    const word = f => f.k === 'Guide model' ? 'guide ' + f.v : f.k === 'Guide range' ? 'guide range ' + f.v : f.k === 'Rating' ? f.v : f.v + ' (' + f.k.replace(/^Rating \(|^Size \(|^Footprint \(|\)$/g, '').toLowerCase() + ')';
    const identifiers = (label, values) => values.length ? '<div class="an1231">' + label + ' <b>' + e1231(values.slice(0, 6).join(' · ')) + '</b>' + (values.length > 6 ? ' <em>+' + (values.length - 6) + ' more</em>' : '') + '</div>' : '';
    return '<div class="sp1231">' + identifiers('Asset no.', s.assetNos) + identifiers('Recorded code', s.codes) +
      (s.notNumbered && !s.nos.length ? '<div class="an1231">Not numbered</div>' : '') +
      (s.facts.length ? '<div class="fx1231">' + s.facts.slice(0, 3).map(f => e1231(word(f))).join(' · ') + '</div>' : '<div class="fx1231 none">Size not on record</div>') + '</div>';
  }'''


def apply(text):
    if 'demob-identifiers1233' in text:
        raise SystemExit('v12.33 already applied')
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE:
        raise SystemExit('v12.33 requires the exact verified v12.32 page')
    text = rep(text, OLD, NEW, 'Demob identifier labels', str(HERE))
    return rep(text, "+' · v12.32'; /* v8.19 release922", "+' · v12.33'; /* v8.19 release922",
        'Release footer', str(HERE))


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_bytes(apply(page.read_bytes().decode('utf-8')).encode('utf-8'))
