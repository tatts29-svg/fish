#!/usr/bin/env python3
"""Author: Andrew Fisher. The map inputs for the fencing crew's book (v2), taken off the live GC500 page.

Everything is placed on the Queensland Government 2022 aerial the page already carries (DATA.aerial_hi, registered to the
drawing frame at 0.30 m RMS; DATA.georef), so nothing is drawn by eye:
  - fence runs: the 83 fence lines of the fencing map catalogue (the weekly installation plans traced onto iEDM's master
    plan D001-26003-03), master-plan points -> the D001 sheet picture (the full A1 page) -> the aerial frame through the
    D001 sheet's own 42 callouts that carry both readings (an exact linear fit, residual about a centimetre);
  - gates and grandstand numbers: the same D001 callouts (G1-G10, S01-S25);
  - the track: iEDM's key-plan ring (DATA.circuit.ring), its centre line fitted by closest points to the ring the page
    itself draws on the aerial (DATA.hzmap, "the key-plan ring drawn on it by the same registration the 3D proof uses");
  - place names: where iEDM's master plan writes them (read off the D001 sheet picture), through the same D001 fit.
Writes map_inputs_24Oct2026.json (aerial-frame pixels: 4760 x 2994, north to the left, as the page holds it).

    python3 make_inputs.py <live page .html> <hzmap .webp>
"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
PAGE_PT = (2383.94, 1683.78)            # D001-26003-03 is an A1 sheet; its picture is the whole page (S19 checks to 4 decimals)
# where iEDM's master plan D001-26003-03 writes these names, as fractions of its sheet picture
PLACES = [('MAIN BEACH', 0.0615, 0.1937, 'suburb'), ('NARROWNECK BEACH', 0.4600, 0.1490, 'beach'),
          ('SURFERS PARADISE', 0.9338, 0.1251, 'suburb'), ('PACIFIC OCEAN', 0.4631, 0.0980, 'water'),
          ('NERANG RIVER', 0.4369, 0.2763, 'water'), ('MACINTOSH ISLAND', 0.2427, 0.4407, 'park'),
          ('PARADISE WATERS', 0.3365, 0.6605, 'suburb'), ('BUDDS BEACH', 0.8554, 0.4570, 'suburb'),
          ('NERANG RIVER', 0.5954, 0.4429, 'water-wide')]


def page_data(path):
    t = Path(path).read_text(encoding='utf-8')
    i = t.find('const DATA = '); j = t.find('\n', i)
    D = json.loads(t[i + 13:j - 1])
    k = t.find('PRIVATE_INPUT = {'); k = t.find('{', k); depth = 0
    for n, ch in enumerate(t[k:]):
        depth += ch == '{'; depth -= ch == '}'
        if depth == 0: catalogue = json.loads(t[k:k + n + 1]); break
    return D, catalogue, hashlib.sha256(t.encode('utf-8')).hexdigest()


def resample(poly, n):
    poly = np.vstack([poly, poly[:1]]); seg = np.hypot(*np.diff(poly, axis=0).T); L = np.r_[0, np.cumsum(seg)]
    t = np.linspace(0, L[-1], n, endpoint=False)
    return np.c_[np.interp(t, L, poly[:, 0]), np.interp(t, L, poly[:, 1])]


def nearest(Q, P):
    d = np.empty(len(Q)); ix = np.empty(len(Q), int)
    for a in range(0, len(Q), 400):
        dd = ((Q[a:a + 400, None, :] - P[None, :, :]) ** 2).sum(-1); k = dd.argmin(1)
        ix[a:a + 400] = k; d[a:a + 400] = np.sqrt(dd[np.arange(len(k)), k])
    return d, ix


def ring_on_aerial(D, hz_path):
    """The key-plan ring's centre line, fitted (similarity) to the ring the page draws on its own aerial crop."""
    hz = D['hzmap']; x0, y0, x1, y1 = hz['crop']; pw, ph = hz['px']
    im = np.asarray(Image.open(hz_path).convert('RGB')).astype(int)
    ys, xs = np.nonzero((im[..., 0] > 235) & (im[..., 1] > 120) & (im[..., 1] < 215) & (im[..., 2] < 150))
    P = np.c_[x0 + xs * (x1 - x0) / pw, y0 + ys * (y1 - y0) / ph]
    P = P[np.random.default_rng(1).choice(len(P), min(6000, len(P)), replace=False)]
    o = resample(np.array(D['circuit']['ring']['outer']), 1200); n = resample(np.array(D['circuit']['ring']['inner']), 1200)
    mid = (o + n[nearest(o, n)[1]]) / 2
    s = D['surrounds']['mPerPt'] / D['georef']['m_per_frame_px_ground']; th = 0.0; cs = mid.mean(0); cd = P.mean(0)
    for _ in range(40):
        R = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])
        d, ix = nearest((mid - cs) @ R.T * s + cd, P); keep = d < np.percentile(d, 90)
        A, B = mid[keep], P[ix[keep]]; ma, mb = A.mean(0), B.mean(0); A0, B0 = A - ma, B - mb
        U, Sg, Vt = np.linalg.svd(B0.T @ A0 / len(A)); Dg = np.eye(2)
        if np.linalg.det(U @ Vt) < 0: Dg[1, 1] = -1
        Rr = U @ Dg @ Vt; s = (Sg * np.diag(Dg)).sum() / ((A0 ** 2).sum() / len(A)); th = np.arctan2(Rr[1, 0], Rr[0, 0]); cs, cd = ma, mb
    R = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])
    line = (mid - cs) @ R.T * s + cd; d, _ = nearest(line, P)
    fit = {'m_per_pt': round(s * D['georef']['m_per_frame_px_ground'], 4), 'rot_deg': round(float(np.degrees(th)), 3),
           'median_m': round(float(np.median(d)) * D['georef']['m_per_frame_px_ground'], 2),
           'p90_m': round(float(np.percentile(d, 90)) * D['georef']['m_per_frame_px_ground'], 2),
           'max_m': round(float(d.max()) * D['georef']['m_per_frame_px_ground'], 2)}
    return resample(line, 900), fit


def main(page_path, hz_path):
    D, cat, page_sha = page_data(page_path)
    W, H = D['georef']['frame_px']
    marks = [m for m in D['sheets'][7]['markers'] if m.get('ax') is not None]
    A = np.array([[m['fx'], m['fy'], 1] for m in marks]); B = np.array([[m['ax'], m['ay']] for m in marks])
    X = np.linalg.lstsq(A, B, rcond=None)[0].T
    resid = np.hypot(*((A @ X.T) - B).T).max() * W * D['georef']['m_per_frame_px_ground']
    frac_to_px = lambda fx, fy: [round((X[0, 0] * fx + X[0, 1] * fy + X[0, 2]) * W, 1), round((X[1, 0] * fx + X[1, 1] * fy + X[1, 2]) * H, 1)]
    master_to_px = lambda p: frac_to_px(p[0] / PAGE_PT[0], p[1] / PAGE_PT[1])
    fences = [{'id': g['id'], 'pts': [master_to_px(p) for p in g['points']], 'week': g.get('source_week'), 'date': g.get('source_planned_date'),
               'category': g.get('category')} for g in cat['geometry'] if g.get('region') == 'main' and g['kind'] == 'line']
    seen, gates, stands = set(), [], []
    for m in marks:
        if m['kind'] in ('gate_approach', 'gate_on_fence') and m['label'] not in seen:
            seen.add(m['label']); gates.append({'label': m['label'], 'px': [round(m['ax'] * W, 1), round(m['ay'] * H, 1)]})
        if m['kind'] == 'circuit_sector': stands.append({'label': m['label'], 'px': [round(m['ax'] * W, 1), round(m['ay'] * H, 1)]})
    ring, fit = ring_on_aerial(D, hz_path)
    out = {'schema': 1, 'author': 'Andrew Fisher', 'read_from': {'page_sha256': page_sha, 'aerial_media': D['aerial_hi']['media'], 'hzmap_media': D['hzmap']['src']['media'],
           'catalogue_master_sha256': cat['master_sha256']},
           'frame_px': [W, H], 'north': 'left of the frame (up is bearing %.2f)' % D['georef']['up_is_bearing_deg'], 'georef': D['georef'],
           'd001_fit_worst_m': round(float(resid), 3), 'ring_fit': fit, 'lap_length_m': round(D['surrounds']['registration']['lap_length_m'], 1),
           'track': [[round(x, 1), round(y, 1)] for x, y in ring], 'key_plan_ring': D['circuit']['ring'],
           'fences': fences, 'gates': gates, 'stands': stands,
           'places': [{'name': n, 'px': frac_to_px(fx, fy), 'kind': k} for n, fx, fy, k in PLACES],
           'credits': {'aerial': D['georef']['attribution'], 'aerial_short': D['georef']['short'],
                       'fences': 'Fence runs: the weekly fencing installation plans, as traced onto iEDM master plan D001-26003-03 on the GC500 record (selected runs, not every panel; not surveyed).',
                       'track': "Track: iEDM's key plan (K220-K231-26003-02) as registered on the GC500 record."}}
    (HERE / 'map_inputs_24Oct2026.json').write_text(json.dumps(out, indent=1))
    print('fences %d, gates %d, stands %d, places %d; D001 fit worst %.3f m; track fit %s' % (len(fences), len(gates), len(stands), len(PLACES), resid, fit))


if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
