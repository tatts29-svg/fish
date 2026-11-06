#!/usr/bin/env python3
"""v7.54 — count actual Rehire fleet numbers, once per supplier.
Author: Andrew Fisher
Usage: python3 patch_v754_assets.py <page.html>
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
with open(path, encoding='utf-8') as handle:
    text = handle.read()
marker = '/* v7.54 — a Rehire unit is numbered only when its fleet number is recorded. */'
if marker in text:
    sys.exit('v7.54 asset-number count already applied')
if 'function questionHistory753(' not in text:
    sys.exit('needs v7.53 Questions fixes')
old = ''' const subs = subOf(a.key), subNos = new Set(subs.map(x => String(x.no)).filter(Boolean));
 return {q: q, n: Math.min(units.filter(x => !subNos.has(String(x))).length + subs.length, q), sub: subs.length, co: [...new Set(subs.map(x => x.co))].join(', ')};'''
new = ''' /* v7.54 — a Rehire unit is numbered only when its fleet number is recorded. */
 const normNo = n => String(n == null ? '' : n).trim().toUpperCase();
 const subs = subOf(a.key), numbered = subs.filter(x => normNo(x.no));
 const subNos = new Set(numbered.map(x => normNo(x.no)));
 // Different suppliers can use the same fleet number; repeated entries from one supplier are one unit.
 const supplierUnits = new Set(numbered.map(x => JSON.stringify([String(x.co || '').trim().toLowerCase(), normNo(x.no)])));
 return {q: q, n: Math.min(units.filter(x => !subNos.has(normNo(x))).length + supplierUnits.size, q), sub: subs.length, co: [...new Set(subs.map(x => x.co))].join(', ')};'''
text = rep(text, old, new, 'count only distinct recorded supplier fleet numbers', path, True)
with open(os.path.join(os.path.dirname(__file__), 'rehire754_src.js'), encoding='utf-8') as handle:
    source = handle.read()
old_sub = "function subOf(key){ try { return unitsOf(key).filter(u => SUB_RX.test(String(u.label || ''))).map(u => ({co: String(u.label).replace(SUB_RX, '').replace(/\\s*·\\s*unit\\s+\\d+$/i, '').trim(), no: u.asset_no || '', u})); } catch (e) { return []; } }"
new_sub = """function subOf(key){ try {
 const recorded = unitsOf(key).filter(u => SUB_RX.test(String(u.label || ''))).map(u => ({co: String(u.label).replace(SUB_RX, '').replace(/\\s*·\\s*unit\\s+\\d+$/i, '').trim(), no: u.asset_no || '', u}));
 const source = sourceRehire754(key);
 return source ? recorded.concat(source) : recorded;
 } catch (e) { return []; } }"""
text = rep(text, old_sub, source + '\n' + new_sub, 'documented FL01 fleet number in every supplier-number view', path, True)
text = rep(text, "${ro ? '<p class=\"hint\">View only. Open your edit link to add sub-hired gear.</p>' : ''}",
           "${sourceRehire754Html(k)}\n${ro ? '<p class=\"hint\">View only. Open your edit link to add sub-hired gear.</p>' : ''}",
           'fleet number provenance in the drawer', path, True)
with open(path, 'w', encoding='utf-8') as handle:
    handle.write(text)
print('ok', path)
