"""Author: Andrew Fisher. Index ownership within the native hold/carry lifecycle."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


OLD = """function siteNumbersElsewhere(ref){ const out = new Set(); try { for (const a of allAssets()) { if (a.key === ref || a._cancelled) continue; (assetNumbersOf(a) || []).forEach(n => out.add(String(n))); } } catch (x) {} return out; }
 let ELSE = null, ELSE_AT = 0; const elsewhere = ref => { const now = Date.now(); if (!ELSE || now - ELSE_AT > 4000) { ELSE = new Map(); ELSE_AT = now; } if (!ELSE.has(ref)) ELSE.set(ref, siteNumbersElsewhere(ref)); return ELSE.get(ref); };"""

NEW = """function siteNumbersElsewhere(ref){const out=new Set();try{for(const a of allAssets()){if(a.key===ref||a._cancelled)continue;(assetNumbersOf(a)||[]).forEach(n=>out.add(String(n)));}}catch(x){}return out;}
 /* Author: Andrew Fisher. Number ownership follows the native hold/carry memo lifecycle.
    Native save/hydration invalidation rebuilds it before the next query. Keep the
    original query as the partial-result fallback if a source read throws. */
 function siteNumberOwners1243(){
  const index=new Map();
  try{for(const a of allAssets()){
   const owner=a.key;if(a._cancelled)continue;
   (assetNumbersOf(a)||[]).forEach(n=>{const number=String(n);let owners=index.get(number);if(!owners){owners=new Set();index.set(number,owners);}owners.add(owner);});
  }}catch(x){return null;}
  return index;
 }
 const elsewhere=ref=>{
  const index=heldMemo('site-number-owners1243',siteNumberOwners1243);
  if(!index){const numbers=siteNumbersElsewhere(ref);return Object.freeze({has:number=>numbers.has(number)});}
  return Object.freeze({has:number=>{const owners=index.get(number);if(owners)for(const owner of owners)if(owner!==ref)return true;return false;}});
 };"""


def patch(text, path):
    if 'function siteNumberOwners1243()' in text:
        raise ValueError('v12.43 number ownership index is already applied')
    if text.count(OLD) != 1:
        raise ValueError('number ownership index requires one exact source match')
    start = text.index(OLD)
    return text[:start] + rep(OLD, OLD, NEW, 'native-held number ownership index', path) + text[start + len(OLD):]
