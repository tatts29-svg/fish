/* v11.52 - not-charged-here-1152. Author: Andrew Fisher.
   Six references are on their own hire schedules, a different contract, and are tracked on this page but never charged
   or costed here: T0024 (HS 9977412 & 9968929, Coates' own compound), T0162 (HS 9977410, Blanchard Race), T0176 (HS
   9989424, Redbull), BJR01 (HS 9983884, Brad Jones Racing), SVP01 (HS 9980337, Shell V-Power) and PG29 (HS 9990100,
   Tickford Racing). And the labour on a waste tank is one charge with its toilet block: the block's labour lines carry
   it, the tank's own lines price at nought. The project manager, 23 Oct 2026: "Labour on waste tanks is one charge
   inclusive with the toilet block ... these are not to be charged these are on different contract ... we will obviously
   still track like we have been doing ... but we wont include these costs in anything we do on here".
   The ticks, lights, servicing areas and positions are untouched: tracked as before. The money primitives are wrapped
   here, so every table built from them (the P&L, Pricing, the drawer, the finance request, labour whole-job, accruals,
   servicing and transport) says the same thing. */
(function(W){
 const TEAMS = [
  ['T0024', ['9977412', '9968929'], "Coates' own compound"],
  ['T0162', ['9977410'], 'Blanchard Race'],
  ['T0176', ['9989424'], 'Redbull'],
  ['BJR01', ['9983884'], 'Brad Jones Racing'],
  ['SVP01', ['9980337'], 'Shell V-Power'],
  ['PG29', ['9990100'], 'Tickford Racing']];
 const HELD = new Map(TEAMS.map(([ref, hs, who]) => [ref, Object.freeze({ref, hs: hs.slice(), who})]));
 const why = ref => { const h = HELD.get(String(ref)); return h ? 'Not charged here: on hire schedule ' + h.hs.join(' & ') + ' (' + h.who + '), a different contract. Tracked on this page; charged there (the project manager, 23 Oct 2026).' : null; };
 const TANK = /waste\s*tank|holding\s*tank|sewage/i;
 const TANK_WORDS = 'One charge with the toilet block: the block’s labour covers its waste tank, so the tank’s own labour prices at nought (the project manager, 23 Oct 2026).';
 const WORDS = TEAMS.map(([ref, hs, who]) => ref + ' (' + who + ', HS ' + hs.join(' & ') + ')').join(', ') + ' are on their own hire schedules, a different contract — tracked on this page, charged there; and the labour on each waste tank is one charge with its toilet block (the project manager, 23 Oct 2026)';
 const api = {
  refs: Object.freeze(TEAMS.map(t => t[0])),
  has: ref => HELD.has(String(ref)),
  of: ref => HELD.get(String(ref)) || null,
  hs: ref => { const h = HELD.get(String(ref)); return h ? h.hs.join(' & ') : ''; },
  why,
  tank: item => TANK.test(String(item || '')),
  tankWords: TANK_WORDS,
  summary: () => ({refs: TEAMS.map(([ref, hs, who]) => ({ref, hs: hs.slice(), who})), words: WORDS,
   short: TEAMS.length + ' references on their own hire schedules, not charged here; waste-tank labour one charge with the block'}),
  unwrapped: {}};
 W.NotChargedHere1152 = api;
 /* labour: the lines stay (the ticks are the record of the work done); the money on them goes */
 const beforeL = W.labourLinesFor;
 const gL = function(ref, disc, item, key, unit, asset){
  const r = beforeL.apply(this, arguments);
  if (!r || !Array.isArray(r.lines) || !r.lines.length) return r;
  const held = api.has(ref) ? why(ref) : null, tank = !held && api.tank(item) ? TANK_WORDS : null;
  if (!held && !tank) return r;
  const lines = r.lines.map(L => Object.assign({}, L, {rate: 0, money: 'zero', money_note: (held || tank) + (L.money_note ? ' ' + L.money_note : ''),
   held1152: held || undefined, included1152: tank || undefined}));
  return Object.assign({}, r, {lines, held1152: held || null, included1152: tank || null});
 };
 gL.charge1152 = true; W.labourLinesFor = gL; try { labourLinesFor = gL; } catch (x) {}
 /* the reference's money: hire, accessories, labour and the card's transport at nought on a held reference; the lines stay */
 const beforeA = W.assetTotal;
 const gA = function(a){
  const t = beforeA.apply(this, arguments);
  if (!a || !t || !api.has(a.key)) return t;
  const w = why(a.key);
  const lines = (t.lines || []).map(l => Object.assign({}, l, {total: 0, provisional: null, transport_charge: 0, transport_cost: 0, held1152: w}));
  return Object.assign({}, t, {lines, base: 0, accessories: 0, accessories_known: 0, labour: 0, known: 0, transport: 0, transport_known: true, total: 0, held1152: w});
 };
 gA.charge1152 = true; W.assetTotal = gA; try { assetTotal = gA; } catch (x) {}
 /* no event-night servicing charge, and so no supplier servicing cost, on a held reference */
 const beforeN = W.nightService1040;
 const gN = function(a){ if (a && api.has(a.key)) return null; return beforeN.apply(this, arguments); };
 gN.charge1152 = true; W.nightService1040 = gN; try { nightService1040 = gN; } catch (x) {}
 /* transport: a held reference's legs are excluded before the model prices them, the way Coates' own use is */
 const excl = out => {
  if (!out || !Array.isArray(out.buildings)) return out;
  const buildings = out.buildings.map(b => b && api.has(b.ref)
   ? Object.assign({}, b, {exclusion: b.exclusion || ('Not charged here: hire schedule ' + api.hs(b.ref) + ' (' + api.of(b.ref).who + ')'), held1152: why(b.ref)}) : b);
  return Object.assign({}, out, {buildings});
 };
 const beforeB = W.buildingTransportInput831;
 const gB = function(){ return excl(beforeB.apply(this, arguments)); };
 gB.charge1152 = true; W.buildingTransportInput831 = gB; try { buildingTransportInput831 = gB; } catch (x) {}
 const beforeO = W.otherTransportInput831;
 if (typeof beforeO === 'function') {
  const gO = function(){ return excl(beforeO.apply(this, arguments)); };
  gO.charge1152 = true; W.otherTransportInput831 = gO; try { otherTransportInput831 = gO; } catch (x) {}
 }
 /* contract 9968929 line 5 is the same asset 1257261 (T0023, Coates' own container) whose description Baseplan now
    writes as "Shop Front - Shut Down"; the 1 Oct 2026 own-use treatment stands on the line, whatever it is called */
 const beforeC = W.contractTreatment747;
 const gC = function(row){
  const t = beforeC.apply(this, arguments); if (t) return t;
  if (row && row.branch_code === 'KINP' && row.rate_1 === null && row.quantity === 1 && !row.charge_line && !row.subhired
   && String(row.rental_contract) === '9968929' && row.line === 5 && row.kind === 'container' && String(row.asset_no) === '1257261')
   return {kind: 'own_use', label: 'Coates own use', ref: 'T0023', approved_by: 'the project manager', approved_on: '2026-10-01',
    basis: 'For Coates’ own use; no customer hire charge — confirmed 1 Oct 2026 as “Container 6.0M x 2.4M”; Baseplan now writes the same asset 1257261 as “Shop Front - Shut Down”, on Coates’ own schedule 9968929'};
  return null;
 };
 gC.charge1152 = true; W.contractTreatment747 = gC; try { contractTreatment747 = gC; } catch (x) {}
 /* the drawer's arrived-charges table: one notice instead of rows priced at nought */
 const beforeH = W.arrivedChargesHtml975;
 const gH = function(a){
  if (a && api.has(a.key) && !a._cancelled && !a.rest_of) { const h = api.of(a.key);
   return '<section class="notice charges952" data-charges952="' + esc(a.key) + '" data-held1152><b>Charges to V8 Supercars · arrived equipment</b><p><b>Not charged here.</b> '
    + esc(a.key) + ' is on hire schedule ' + esc(h.hs.join(' & ')) + ' (' + esc(h.who) + '), a different contract: tracked on this page, charged there (the project manager, 23 Oct 2026). Nothing from this reference is in the hire, labour, servicing or transport figures on this page.</p></section>'; }
  return beforeH.apply(this, arguments);
 };
 gH.charge1152 = true; W.arrivedChargesHtml975 = gH; try { arrivedChargesHtml975 = gH; } catch (x) {}
 api.unwrapped.labourLinesFor = beforeL; api.unwrapped.assetTotal = beforeA; api.unwrapped.nightService1040 = beforeN;
 Object.freeze(api.unwrapped); Object.freeze(api);
})(window);
