"""Author: Andrew Fisher. v10.52 - lock the ticks, unlock them, untick any (Andrew, 17 Oct 2026: "We need to be able to
lock the ticks but also unlock it and then untick any. And price will then come off or be added on. This need to then
update everywhere else").

Builds on the v10.49 buildings lock (not live yet) and widens it:
- "Lock ticks" on Costs holds every tick on everything on site at that moment - buildings, toilets, generators, the
  lot: the charge ticks (delivery, install, level, steps, clean, demob, pick-up, fire extinguisher), complete,
  levelled, steps, the lights, emptied, and a door side already recorded. Things that arrive after the lock stay open
  until the next lock. The buildings total and the "changed since the lock" list stay on the card.
- Unlock one reference from its drawer ("Unlock to change", then "Lock again"), or everything from Costs
  ("Unlock all"). An unlocked tick can be taken off or put on, and its price comes off or goes on everywhere the page
  adds it up - the drawer, Costs, the P&L, the branch totals and the buildings card - because they all read the same
  ticks.
- While locked, a change is refused with a plain message, and the drawer shows the ticks as locked.
- A door side Andrew recorded against a building's line before its unit was numbered (P65 passenger, P66 driver, 9 Oct)
  reads for that unit again, as v9.09 already does for toilets.

The lock lives where v10.49 keeps it (runRules buildingsLock1049) with two more fields: held (the references held)
and open (the ones unlocked one by one). No other record change. Footer v10.51 -> v10.52.

    python3 patch_v1052.py path/to/page.html   (on the v10.51 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

R = []

R.append(('locked for one reference',
 "function lockedNow1049(){ const s = state1049(); return !!(s && s.locked); }",
 "function lockedNow1049(ref){ const s = state1049(); if (!(s && s.locked)) return false; if (ref === undefined || ref === true) return true; if (s.open && s.open[ref]) return false; return Array.isArray(s.held) ? s.held.includes(ref) : isBuilding(ref); } /* v10.52 - tick-lock-1052: held references, one-by-one unlock */"))

R.append(('what the lock holds',
 "function lock1049(){",
 "function held1052(){ try { return allAssets().filter(a => !a._cancelled && !movedAway(a.key) && (deliveryOf(a.key) || {}).state === 'on site').map(a => a.key); } catch (x) { return []; } }\n function lock1049(){"))

R.append(('lock records what it holds',
 "const v = {v: 1, locked: true, at: new Date().toISOString(), by: who, total: s.total, n: s.n, refs: s.refs,",
 "const held = held1052(); const v = {v: 2, locked: true, at: new Date().toISOString(), by: who, total: s.total, n: s.n, refs: s.refs, held, open: {},"))

R.append(('lock message',
 "flash('Buildings locked: ' + s.n + ' buildings, ' + $m(s.total) + '.'); return true;",
 "flash('Ticks locked: ' + held.length + ' on site, buildings ' + $m(s.total) + '.'); return true;"))

R.append(('unlock all clears the one-by-one list',
 "const v = Object.assign({}, s, {locked: false, unlocked_at: new Date().toISOString(), unlocked_by: who});",
 "const v = Object.assign({}, s, {locked: false, open: {}, unlocked_at: new Date().toISOString(), unlocked_by: who});"))

R.append(('unlock message',
 "flash('Buildings unlocked. Lock them again when you are done.'); return true;",
 "flash('Ticks unlocked. Lock them again when you are done.'); return true;"))

R.append(('card title locked', "<h3>Buildings · locked</h3>", "<h3>Ticks · locked</h3>"))
R.append(('card title open', "<h3>Buildings · not locked</h3>", "<h3>Ticks · not locked</h3>"))
R.append(('card sub locked',
 "'<p class=\"lock1049-sub\">Locked ' + e(when(s.at)) + ' by ' + e(nm(s.by)) + ' · ' + s.n + ' buildings</p></div>",
 "'<p class=\"lock1049-sub\">Locked ' + e(when(s.at)) + ' by ' + e(nm(s.by)) + ' · ' + (Array.isArray(s.held) ? s.held.length + ' on site held · ' : '') + s.n + ' buildings</p></div>"))
R.append(('card note locked',
 "'<p class=\"lock1049-note\">While locked, ticks, complete, lights, levelling and steps on buildings cannot be changed.</p>' +",
 "'<p class=\"lock1049-note\">While locked, no tick, complete, light, levelled, steps or door side can be changed. Unlock one reference from its drawer, or all of them here.</p>' + openList1052(s) +"))
R.append(('unlock all button', ">Unlock buildings</button>", ">Unlock all</button>"))
R.append(('lock button', ">Lock buildings</button>", ">Lock ticks</button>"))
R.append(('card note open',
 "'<p class=\"lock1049-note\">Lock the buildings to hold every charge where it is; any change after that shows here.</p>' +",
 "'<p class=\"lock1049-note\">Lock the ticks to hold everything on site where it is. The buildings total stays here, and any change after that shows here.</p>' +"))
R.append(('unlock all confirm',
 "window.confirm('Unlock the buildings? Ticks and charges on buildings can be changed again until they are locked.')",
 "window.confirm('Unlock all ticks? Everything can be ticked and unticked again until you lock it.')"))

GUARD_OLD = """ const refuse = () => { const s = state1049(); flash('Buildings are locked' + (s ? ' (' + when(s.at) + ', ' + nm(s.by) + ')' : '') + '. Unlock them on Costs to change this.'); return false; };
 const guard = (name, pick) => { if (typeof W[name] !== 'function' && typeof eval('typeof ' + name) === 'undefined') return; let before; try { before = eval(name); } catch (x) { return; } if (typeof before !== 'function' || before.lock1049) return;
  const g = function(){ try { if (lockedNow1049() && pick.apply(null, arguments)) return refuse(); } catch (x) {} return before.apply(this, arguments); };
  g.lock1049 = true; W[name] = g; try { eval(name + ' = g'); } catch (x) {} };
 guard('setLabour', ref => isBuilding(ref));
 guard('setLabourAll', disc => disc === DISC);
 guard('setDone', key => isBuilding(key));
 guard('setLight', key => isBuilding(key));
 guard('setLevelled', key => isBuilding(key));
 guard('setSteps', key => isBuilding(key));"""

GUARD_NEW = """ const refuse = ref => { const s = state1049(); flash((ref && ref !== true ? ref + ' is locked' : 'The ticks are locked') + (s ? ' (' + when(s.at) + ', ' + nm(s.by) + ')' : '') + '. ' + (ref && ref !== true ? 'Press Unlock to change in its drawer, or Unlock all on Costs.' : 'Unlock all on Costs to change this.')); return false; };
 /* pick returns the reference a change is for (true: the whole job), or nothing when the change is not held */
 const guard = (name, pick) => { if (typeof W[name] !== 'function' && typeof eval('typeof ' + name) === 'undefined') return; let before; try { before = eval(name); } catch (x) { return; } if (typeof before !== 'function' || before.lock1049) return;
  const g = function(){ try { const ref = pick.apply(null, arguments); if (ref && lockedNow1049(ref)) return refuse(ref); } catch (x) {} return before.apply(this, arguments); };
  g.lock1049 = true; W[name] = g; try { eval(name + ' = g'); } catch (x) {} };
 guard('setLabour', ref => ref);
 guard('setLabourAll', () => true);
 guard('setDone', key => key);
 guard('setLight', key => key);
 guard('setLevelled', key => key);
 guard('setSteps', key => key);
 guard('setEmptied816', key => key);
 guard('loading872Set', (ref, id, side) => { try { const r = (loading872Record(ref) || {})[id]; return r && r.side ? ref : null; } catch (x) { return null; } }); /* a recorded door side holds; a missing one can still be filled */"""
R.append(('the guard covers every held reference', GUARD_OLD, GUARD_NEW))

EXPORT_OLD = "W.lock1049 = lock1049; W.unlock1049 = unlock1049;"
EXPORT_NEW = r"""/* v10.52 - one reference at a time: Unlock to change, Lock again */
 function setOpen1052(ref, on){
  const what = on ? 'unlocking ' + ref : 'locking ' + ref;
  if (!mayWrite(what)) return false; const who = whoAmI(); if (!who) return false;
  const s = state1049(); if (!s || !s.locked) return false;
  const open = Object.assign({}, s.open || {}); if (on) open[ref] = {by: who, at: new Date().toISOString()}; else delete open[ref];
  S.runRules[KEY] = JSON.stringify(Object.assign({}, s, {open})); stampIt('runRules', KEY, who); save();
  try { render(); } catch (x) {} try { if (typeof openAsset === 'function' && document.getElementById('drawer') && document.getElementById('drawer').classList.contains('on')) openAsset(ref); } catch (x) {}
  flash(on ? ref + ' unlocked: tick or untick, then press Lock again.' : ref + ' locked again.'); return true;
 }
 function openList1052(s){
  const o = Object.entries((s && s.open) || {}); if (!o.length) return '';
  return '<p class="lock1049-note"><b>Unlocked one by one:</b> ' + o.map(([k, v]) => '<button type="button" class="btn sm ghost" data-lock1052-ref="' + e(k) + '" data-lock1052-act="close" title="Unlocked ' + e(when(v.at)) + ' by ' + e(nm(v.by)) + '">' + e(k) + ' · Lock again</button>').join(' ') + '</p>';
 }
 /* the drawer: a lock chip on Complete it, and the ticks shown as locked */
 function drawer1052(){
  const dr = document.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return;
  const cmp = dr.querySelector('.cmp816'); if (!cmp) return; const head = cmp.querySelector('.hubtitle'); if (!head) return;
  const s = state1049(); const ref = (cmp.querySelector('[data-light]') || cmp.querySelector('[data-symref]') || {}).dataset || {};
  const key = ref.light || ref.symref; if (!key) return;
  const held = !!(s && s.locked) && (Array.isArray(s.held) ? s.held.includes(key) : isBuilding(key)), open = held && !!(s.open || {})[key], locked = held && !open;
  const sig = (locked ? 'L' : open ? 'O' : '-') + key; const have = head.querySelector('.lock1052');
  if (have && have.dataset.sig === sig) { cmp.classList.toggle('locked1052', locked); return; }
  if (have) have.remove(); cmp.classList.toggle('locked1052', locked); if (!held) return;
  head.querySelector('h3').insertAdjacentHTML('afterend', '<span class="lock1052" data-sig="' + e(sig) + '">' + (locked
   ? '<span class="chip">🔒 Locked</span><button type="button" class="btn sm lock1052-btn" data-lock1052-ref="' + e(key) + '" data-lock1052-act="open">Unlock to change</button>'
   : '<span class="chip warn">🔓 Unlocked</span><button type="button" class="btn sm lock1052-btn" data-lock1052-ref="' + e(key) + '" data-lock1052-act="close">Lock again</button>') + '</span>');
 }
 let q1052 = false; const run1052 = () => { if (q1052) return; q1052 = true; requestAnimationFrame(() => { q1052 = false; try { drawer1052(); } catch (x) {} }); };
 const watch1052 = () => { const dr = document.getElementById('drawer'); if (!dr || dr.__lock1052) return; dr.__lock1052 = true; new MutationObserver(run1052).observe(dr, {childList: true, subtree: true}); run1052(); };
 watch1052(); document.addEventListener('DOMContentLoaded', watch1052); setTimeout(watch1052, 0);
 document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-lock1052-act]'); if (!b) return; ev.preventDefault(); ev.stopPropagation();
  const ref = b.dataset.lock1052Ref; if (b.dataset.lock1052Act === 'open') { if (window.confirm('Unlock ' + ref + '? Its ticks can be changed, and its price changes everywhere, until you lock it again.')) setOpen1052(ref, true); }
  else setOpen1052(ref, false); }, true);
 if (!document.getElementById('lock1052-style')) { const st = document.createElement('style'); st.id = 'lock1052-style';
  st.textContent = '#drawer .cmp816 .lock1052{display:inline-flex;align-items:center;gap:6px;margin-left:auto;margin-right:8px;flex-wrap:wrap}' +
   '#drawer .cmp816.locked1052 .hublights .hl{opacity:.72;cursor:not-allowed}' +
   '#drawer .cmp816 .lock1052 .chip.warn{background:#fff1d6;color:#7a4b00}body.viewonly .lock1052-btn{display:none}';
  document.head.appendChild(st); }
 W.lockedNow1049 = lockedNow1049; W.setOpen1052 = setOpen1052; W.held1052 = held1052;
 W.lock1049 = lock1049; W.unlock1049 = unlock1049;"""
R.append(('one-by-one unlock and the drawer chip', EXPORT_OLD, EXPORT_NEW))

R.append(('door side recorded before the unit was numbered reads for buildings too',
 "if(!/^u/.test(String(id))||!chargeLines(a).some(l=>l.item&&epLine909(a,l.item)))return '';",
 "if(!/^u/.test(String(id))||!(a.discipline==='Portable buildings'||chargeLines(a).some(l=>l.item&&epLine909(a,l.item))))return ''; /* v10.52 - and a building's single line (P65, P66: sides recorded 9 Oct before their numbers) */"))

R.append(('an untick takes the on-arrival charge off: the projection honours what was taken off',
 "function project({ordered,received,lines,recorded,relocation}){",
 "function project({ordered,received,lines,recorded,relocation,off}){ /* v10.52 - off: pieces Andrew unticked, per line (Infinity: the whole reference) */"))
R.append(('the projection takes the unticked pieces off the charge and the forecast',
 "rows.push({...line,qty,recordedQty:manual,automatic:auto&&arrived>0,remainingQty:forecastQty==null?null:Math.max(0,forecastQty-qty),forecastQty,",
 "const cut1052=off&&off[line.key]?off[line.key]:0; if(cut1052){const q2=qty==null?null:Math.max(0,qty-cut1052),f2=forecastQty==null?null:Math.max(0,forecastQty-cut1052);rows.push({...line,qty:q2,recordedQty:manual,automatic:auto&&arrived>0&&q2>0,takenOff1052:cut1052,remainingQty:f2==null?null:Math.max(0,f2-(q2||0)),forecastQty:f2,value:q2==null||!Number.isFinite(line.rate)?null:cents(line.rate*q2),forecastValue:f2==null||!Number.isFinite(line.rate)?null:cents(line.rate*f2)});continue;}\n   rows.push({...line,qty,recordedQty:manual,automatic:auto&&arrived>0,remainingQty:forecastQty==null?null:Math.max(0,forecastQty-qty),forecastQty,"))
R.append(('what Andrew unticked, line by line',
 "function charge1006(a,l){return heldMemo(",
 """/* v10.52 - "Whatever as per rate card, that is the cost it will get, unless I unticked it" (Andrew, 16 Oct): a tick taken
    off (its stamp kept, the tick gone) takes that piece off the on-arrival charge. Per building where it has numbers. */
 function takenOff1052(a,l){
  const out={},Lb=S.labour||{},St=S.stamps||{},off=k=>!!St['labour/'+k]&&!Lb[k];
  let units=[];try{units=labourUnits(a,l.item)||[];}catch(x){}
  for(const key of ['install','levelling','demob','cleaning','steps']){
   const rk=labourKey(a.key,l.discipline,l.item,key);
   if(units.length){let n=0,rest=null;for(const u of units){const uk=labourKey(a.key,l.discipline,l.item,key,u);if(off(uk)||(!St['labour/'+uk]&&!Lb[uk]&&off(rk))){if(u===LAB_REST){if(rest==null)try{rest=labourRestN(a,l.item,units);}catch(x){rest=0;}n+=rest||0;}else n++;}}if(n)out[key]=n;}
   else if(off(rk))out[key]=Infinity;
  }
  return out;
 }
 window.takenOff1052=takenOff1052;
 function charge1006(a,l){return heldMemo("""))
R.append(('the charge passes what was taken off',
 "recorded:typeof ScopeFinance1017===\"undefined\"?recorded1006(a,l,manual):ScopeFinance1017.recorded(a,l,recorded1006(a,l,manual)),relocation:!!a.relocation});",
 "recorded:typeof ScopeFinance1017===\"undefined\"?recorded1006(a,l,manual):ScopeFinance1017.recorded(a,l,recorded1006(a,l,manual)),relocation:!!a.relocation,off:takenOff1052(a,l)});"))

R.append(('Release footer', "+ ' · v10.51'", "+ ' · v10.52'"))


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'tick-lock-1052' in html: sys.exit('patch_v1052 refuses a repeat')
    if 'buildings-lock-1049' not in html: sys.exit('patch_v1052 needs the v10.49 lock in the page')
    for what, old, new in R: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1052 applied: tick lock on everything on site, one-by-one unlock in the drawer, door side read for buildings; footer v10.51 -> v10.52')


if __name__ == '__main__':
    main()
