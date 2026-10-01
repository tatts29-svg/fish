#!/usr/bin/env python3
"""Author: Andrew Fisher. Price supported programme-only fencing forecast lines."""
import hashlib
import json
import math
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def source_map():
    data = json.loads((HERE / 'forecast_card771.json').read_text(encoding='utf-8'))
    if data.get('schema') != 'gc500-forecast-card-1':
        raise ValueError('Unexpected forecast-card schema')
    source = data.get('source', {})
    expected_path = 'reference_street_rate_card_2026/Street_Rate_Card_2026.pdf'
    if source.get('file') != expected_path:
        raise ValueError('Unexpected forecast-card source')
    pdf = HERE.parent / expected_path
    if hashlib.sha256(pdf.read_bytes()).hexdigest() != source.get('sha256'):
        raise ValueError('Issued card changed: regenerate and review the forecast source map')
    entries = data.get('entries', [])
    if len(entries) != 3 or len({e.get('programme_type') for e in entries}) != 3:
        raise ValueError('Expected three unique programme rates')
    for entry in entries:
        rate = entry.get('rate')
        if entry.get('unit') != 'm' or isinstance(rate, bool) or not isinstance(rate, (float, int)) or not math.isfinite(rate) or rate <= 0:
            raise ValueError('Invalid per-metre forecast rate')
    return data


def patch(text, path):
    if 'function cj771AddProgrammeForecast' in text:
        raise ValueError('v7.71 is already applied')
    if 'function rh769Cover' not in text or 'function cj764Fencing()' not in text:
        raise ValueError('v7.71 needs the v7.69 Rehire and fencing forecast functions')
    source = (HERE / 'forecast771_src.js').read_text(encoding='utf-8')
    source = source.replace('__FORECAST_CARD771__', json.dumps(source_map(), ensure_ascii=False, separators=(',', ':')))
    text = rep(text, 'function cj764Fencing(){', source + '\nfunction cj764Fencing(){',
               'add issued-card forecast lookup', path)
    old = '''if (!past) try { const ps = ((DATA.fencing || {}).week_sheets || []).find(x => x.sheet === w.progSheet); if (ps && ps.totals) Object.entries(ps.totals).forEach(([type, q]) => { if (!q || (FCOL || []).some(c => c.programme_type === type)) return; out.noCardRate[type] = r2((out.noCardRate[type] || 0) + q); out.noCostRate[type] = r2((out.noCostRate[type] || 0) + q); }); } catch (e) {}'''
    new = '''if (!past) try { const ps = ((DATA.fencing || {}).week_sheets || []).find(x => x.sheet === w.progSheet); if (ps && ps.totals) cj771AddProgrammeForecast(row, out, ps.totals); } catch (e) {}'''
    return rep(text, old, new, 'price supported programme-only forecast quantities', path)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v771.py <page.html>')
    page = Path(sys.argv[1])
    result = patch(page.read_text(encoding='utf-8'), str(page))
    page.write_text(result, encoding='utf-8')
    print('v7.71 applied: issued-card programme forecasts; actual dockets and costs preserved')
