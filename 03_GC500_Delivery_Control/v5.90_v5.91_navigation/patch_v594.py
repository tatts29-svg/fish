#!/usr/bin/env python3
"""v5.94 - SMOOTH, NO LAG, SECOND PASS (Andrew Fisher, 25 Sep 2026). The profile after v5.93: the money formatter
built an Intl.NumberFormat on every call (177 ms of a Where we are draw), and the branch roll-up and money summary
were worked out several times per draw for the same day. Now: two formatters made once; the roll-up and the
summary remembered for the length of one draw (the memo is emptied at the start of every render pass, so nothing
outlives the record it was read from).  python3 patch_v594.py <builder|page>"""
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
def rep(old, new, label, count=1):
    global s
    assert s.count(old) == count, (label, s.count(old)); s = s.replace(old, new); print('ok', label)
rep("""const money = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null :
  Number(v).toLocaleString('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:2});""",
    """/* v5.94 - the formatters are made once; toLocaleString with options built one per call, thousands of times a draw */
const MONEY_FMT = new Intl.NumberFormat('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:2});
const MONEY0_FMT = new Intl.NumberFormat('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:0});
const money = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : MONEY_FMT.format(Number(v));""", 'money formatter')
rep("""const money0 = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null :
  Math.round(Number(v)).toLocaleString('en-AU', {style:'currency', currency:'AUD', maximumFractionDigits:0});""",
    """const money0 = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : MONEY0_FMT.format(Math.round(Number(v)));""", 'money0 formatter')
rep("""function renderPass(){""", """/* v5.94 - what a draw works out once it keeps for that draw: emptied at the start of every pass */
const RENDER_MEMO = new Map();
function renderPass(){
  RENDER_MEMO.clear();""", 'memo cleared per pass')
rep("""function branchRollup(asOf, X){""", """function branchRollup(asOf, X){
  if (X !== undefined) return branchRollup_(asOf, X);   /* a roll-up over a chosen set is not remembered */
  const mk = 'rollup:' + (asOf || ''); if (RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk); const v = branchRollup_(asOf); RENDER_MEMO.set(mk, v); return v; }
function branchRollup_(asOf, X){""", 'roll-up memo')
rep("""function moneySummary(asOf){""", """function moneySummary(asOf){
  const mk = 'money:' + (asOf || ''); if (RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk); const v = moneySummary_(asOf); RENDER_MEMO.set(mk, v); return v; }
function moneySummary_(asOf){""", 'summary memo')
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('ok v5.94', n0, '->', len(s))
