/* ------------------------------------------------------------------ v7.43 - THE DRAWER SHOWS WHAT IS RELEVANT
 Andrew Fisher, 29 Sep 2026: "I want everything cleaned up, tidy. If I go into a generator there should be no option
 to add accessories. Sub-hired needs cleaning up: when I go into WC43 I want to see clear as day it's sub-hired. This
 is where we start thinking what is relevant data and what is not, and if it's data not needed we remove it."

 WHAT KIND OF THING A REFERENCE IS decides what its drawer offers. A building carries accessories (fridges, air
 conditioners, chairs), a toilet block can, a generator or a light tower or a water barrier does not; so the Attach
 an accessory form is only offered where accessories go, and the whole Contents and accessories part stays out of
 the way where there are none and none can be attached. Anything already recorded is still shown, whatever the type,
 because a record is never hidden by a rule.

 A SUB-HIRED LOCATION says so first. A banner under the header names the company and their units, the header line
 carries the SUB-HIRED chip instead of a Coates Rental ID, and the Coates-only parts (the rental contract, the branch,
 what is on hire from Coates) are left out - they are not this location's story. The units, the photographs, the
 way in and the money model are untouched. */
function refKind(a){
 const x = (a && a.key) ? a : assetOf(a); if (!x) return 'other';
 const d = String(x.discipline || '');
 if (d === 'Portable buildings') return 'building';
 if (d === 'Toilets & amenities') return 'toilet';
 if (d === 'Generators') return 'generator';
 if (d === 'Lighting towers') return 'tower';
 if (d === 'Water-filled barriers') return 'barrier';
 if (d === 'Furniture') return 'furniture';
 return 'other';
}
/* where an accessory can go: inside a building or a toilet block. A generator, a tower, a barrier and a piece of
 furniture have nothing inside them. */
function carriesAccessories(a){ const k = refKind(a); return k === 'building' || k === 'toilet'; }
function kindWord(a){ return {building: 'building', toilet: 'toilet block', generator: 'generator', tower: 'light tower', barrier: 'barrier run', furniture: 'furniture'}[refKind(a)] || 'reference'; }
/* the banner a sub-hired location leads with */
function subhireBanner(a){
 const mk = subhireOf(a.key); if (!mk) return '';
 const nos = unitsOf(a.key).map(u => String(u.asset_no || '').trim()).filter(Boolean);
 const can = !SYNC.readonly && typeof canEdit === 'function' && canEdit();
 return `<div class="notice subhirebanner" role="status"><span class="subhirebig">SUB-HIRED · ${esc(mk.co)}</span>
 <span class="subhirewords">${nos.length ? `${nos.length} unit${nos.length === 1 ? '' : 's'} at ${esc(a.key)} belong to ${esc(mk.co)} - their number${nos.length === 1 ? '' : 's'} <b class="mono">${esc(nos.join(' '))}</b>.` : `${esc(a.key)} is ${esc(mk.co)}' gear.`} Not Coates plant: no Coates asset number, no rental contract, no branch.${mk.coates_off && mk.coates_off.length ? ` Coates ${mk.coates_off.length === 1 ? 'number' : 'numbers'} ${esc(mk.coates_off.join(', '))} came off when it was marked.` : ''}</span>
 <span class="w">Marked by ${esc(mk.by || 'unnamed')}${mk.at ? ' · ' + fmtStamp(mk.at) : ''}.</span>
 ${can ? `<span class="subhireacts"><button type="button" class="btn ghost sm" data-subhireoff="${esc(a.key)}" title="Take the sub-hire mark off ${esc(a.key)} - it goes back to being Coates plant; the units stay recorded until you take them off">Not sub-hired after all</button></span>` : ''}</div>`;
}
/* after the drawer is drawn: the parts that do not apply to this kind of thing come out, and the words fit it */
function drawerTidy(a){
 const dr = $('#drawer'); if (!dr || !a) return;
 const q = s => dr.querySelector(s);
 const accN = (a.accessories || []).length + (a._accessoriesTakenOff || []).length;
 if (!carriesAccessories(a)) {
 /* nothing to attach: the form goes; with nothing recorded either, the whole part goes */
 const form = q('#accForm'); if (form && !(a.accessories || []).some(x => x._added)) form.remove();
 if (!accN) {
 const head = dr.querySelector('.sect.contents'); if (head) {
 let el = head.nextElementSibling; const gone = [head];
 while (el && !(el.tagName === 'DETAILS' && el.id === 'unitsFold')) { gone.push(el); el = el.nextElementSibling; }
 gone.forEach(x => x.remove());
 }
 }
 }
 /* the fold for other things standing under it is worded for the kind of thing it is */
 const uf = q('#unitsFold > summary');
 if (uf && refKind(a) !== 'building') { uf.textContent = uf.textContent.replace('a second building, boards', refKind(a) === 'toilet' ? 'a second block, a tank' : refKind(a) === 'generator' ? 'a second set, a distribution board' : refKind(a) === 'tower' ? 'a second tower' : 'another unit'); }
 /* not numbered: nothing to type a number into */
 if (typeof unnumbered === 'function' && unnumbered(a)) { const nb = q('#numAdd'); if (nb) { const row = nb.closest('.row2'); if (row) row.remove(); } }
 /* sub-hired: the number typed is theirs, not a Coates one */
 const mk = subhireOf(a.key);
 if (mk) { const nb = q('#numAdd'); if (nb) { nb.placeholder = mk.co + ' asset number'; const lab = dr.querySelector('label[for="numAdd"]'); if (lab) lab.textContent = 'Add the ' + mk.co + ' number that turned up'; } }
}
