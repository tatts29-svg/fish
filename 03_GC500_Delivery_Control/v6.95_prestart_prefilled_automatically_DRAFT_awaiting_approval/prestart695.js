/* v6.95 - THE PRE-START, PREFILLED (Andrew Fisher, 27 Sep 2026: "in the timeline I want a prefilled prestart done for each
 day, based off what is coming in ... only ever prefill 3 days. So Sunday's prefill Monday Tuesday Wednesday.
 Wednesday's prefill Thursday and Friday. And so on. This needs to be done automatically").

 WHEN. Nobody presses anything. Twice a week the page prefills the days ahead, on the Gold Coast's own date:
 - Sunday prefills Monday, Tuesday and Wednesday;
 - Wednesday prefills Thursday and Friday (and Saturday only when something is scheduled on it - the site's hours are
 Monday to Friday unless iEDM approves otherwise);
 - a Sunday with work scheduled on it is prefilled that morning.
 Never more than three days. A day between batches keeps what its batch prefilled; a day further out says when it will be.

 WHAT. The day's own work - what is coming in and going out, the carrier's loads and their times, the sectors - and from
 that the hazards to talk through, each with its controls, always including Andrew's list: Take 5s, safety gear on,
 spotting trucks, reviewing the SWMS, unloading trucks, congested areas and low branches, tight spots, high communication
 at all times, the Coates Life Saving Rules (word for word off the Coates card, as on every pre-start since 22 Sep), and
 "if you're unsure, ask the question - everyone has the right to stop the job". The supervisor adds the morning's own
 items, names the crew and signs it off; the prefill is the start of the pre-start, not the record of one. */
const PS_LIFE_RULES = [
 ['Risk Assessment', 'I will not commence any work that I am unfamiliar with, that is non-routine, potentially hazardous or impacted by changing conditions without first completing the appropriate Coates risk assessment tool to identify, assess and control risks.'],
 ['High-Risk Work', 'I will not commence any High-Risk Work without a risk assessment being completed and without having signed onto the applicable Safe Work Method Statement (SWMS).'],
 ['Training and Competency', 'I will be inducted, trained, competent and hold the required certification and licenses to conduct the task.'],
 ['Fit for Work', 'When I commence work, I will be physically fit, and not impaired by fatigue, injury, distraction, drugs or alcohol. I will wear the required personal protective equipment (PPE) as identified for the task or site rules.'],
 ['Tools and Equipment', 'I will only use tools and equipment that are fit for purpose and for which I am trained, competent and authorised. I will ensure that damaged or defective equipment is tagged out and removed from service.'],
 ['Critical Risk Non-Negotiables', 'When I commence a work activity related to a Coates Top 10 Critical Risk, I will always ensure that I review and strictly adhere to the non-negotiable rules and controls for that Critical Risk to protect me, my workmates and others from serious harm.']];
function psIso(dt){ return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
function psAdd(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return psIso(d); }
function psDow(iso){ return new Date(iso + 'T00:00:00').getDay(); }
function psWorkOn(d){ return !!(d && ((d.deliveries || []).length || (d.removals || []).length || (d.loads || []).length)); }
/* the batch a day belongs to: Mon-Wed are Sunday's, Thu-Sat are Wednesday's */
function psBatchOf(iso){ const w = psDow(iso); if (w >= 1 && w <= 3) return psAdd(iso, -w); if (w >= 4) return psAdd(iso, -(w - 3)); return null; }
function psPrefilled(d){
 if (!d) return {state: 'none'};
 const today = todayIso(), b = psBatchOf(d.iso), w = psDow(d.iso);
 if (!b) { if (!psWorkOn(d)) return {state: 'none'};                     /* a Sunday with work on it is prefilled on the day */
 return d.iso < today ? {state: 'past', batch: d.iso} : d.iso === today ? {state: 'ready', batch: d.iso} : {state: 'later', batch: d.iso}; }
 if (w === 6 && !psWorkOn(d)) return {state: 'none'};                     /* Saturday only when work is on */
 if (d.iso < today) return {state: 'past', batch: b};
 return b <= today ? {state: 'ready', batch: b} : {state: 'later', batch: b};
}
function psTrade(a){ const p = String(a.product || '') + ' ' + String(a.item || a.name || '');
 if (/generator/i.test(p)) return 'Generators'; if (/light ?tower/i.test(p)) return 'Light towers'; if (/toilet|amenit|shower|urinal/i.test(p)) return 'Toilets & amenities';
 if (/portable building|building|office|container/i.test(p)) return 'Portable buildings'; if (/wfb|water.filled|barrier/i.test(p)) return 'Water-filled barriers';
 if (/vms/i.test(p)) return 'VMS boards'; if (/forklift|telehandler|boom|scissor|access/i.test(p)) return 'Access & plant'; return a.product || 'Other'; }
const PS_ONE = {'generators': 'generator', 'light towers': 'light tower', 'toilets & amenities': 'toilet', 'portable buildings': 'portable building', 'water-filled barriers': 'water-filled barrier', 'vms boards': 'VMS board'};
function psWord(t, n){ const w = t.toLowerCase(); return n === 1 ? (PS_ONE[w] || w) : w; }
function psCount(rows){ const m = new Map(); rows.forEach(r => { const t = psTrade(r.a); m.set(t, (m.get(t) || 0) + 1); }); return [...m.entries()].sort((x, y) => y[1] - x[1]); }
function psSectors(rows){ const m = new Map(); rows.forEach(r => { const L = typeof MASTER_LOC !== 'undefined' ? MASTER_LOC[r.a.key] : null, s = L && L.sec; if (s) m.set(s, (m.get(s) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); }
/* the hazards: Andrew's list every day, with what today's work adds to it */
function psHazards(d){
 const ins = d.deliveries || [], outs = d.removals || [], all = ins.concat(outs), loads = d.loads || [];
 const has = t => all.some(r => psTrade(r.a) === t), n = all.length, trucks = loads.length;
 const ppe = ((DATA.driver_rules || {}).ppe || ['Hi-vis', 'Safety glasses', 'Steel-cap boots']).join(', ').toLowerCase();
 const H = [
 ['Take 5 before every task', 'Stop and do a Take 5 before each new task and again whenever the job or the conditions change - a new drop, a new spot, a new crew member, rain, a crowd. Two minutes, every time; it is the Coates risk assessment tool at the task.'],
 ['Safety gear on', `Full PPE on before the gate and kept on: ${ppe}${has('Portable buildings') || has('Water-filled barriers') ? ', gloves for handling' : ''}, and anything the SWMS adds for the task. Sun: hat, sunscreen, water.`],
 ['Spotting trucks', `${trucks ? trucks + ' carrier load' + (trucks === 1 ? '' : 's') + ' on the list today' : 'Trucks on site today'}: a dedicated spotter for every truck that moves or reverses - in the driver's mirror, eye contact before it moves, nobody behind it, the spotter does nothing else. The driver stops if they lose sight of the spotter.`],
 ['Review the SWMS', 'Read the SWMS for today\'s tasks together and sign on to it before work starts. If today\'s job is not in the SWMS, stop and review it before starting.'],
 ['Unloading trucks', `Exclusion zone set up round the truck and the lift before the first strap comes off; nobody under a suspended load or between the load and the truck; loads checked for shift before straps are released${has('Portable buildings') ? '; buildings lifted with tag lines on firm, level ground' : ''}. Only licensed operators on the forklift, crane or Hiab.`],
 ['Congested areas and low branches', `The precinct is busy - public, other contractors, event vehicles and the tram. Walk the route before the truck does, keep to walking pace, barricade the drop spot. Look up before every lift and every move: low branches, awnings, signs and wires${has('Light towers') ? ' - and light tower masts are only raised with the overhead clear' : ''}.${(DATA.driver_rules || {}).escort ? ' ' + DATA.driver_rules.escort : ''}`],
 ['Tight spots', `Plan the placement before the unit arrives: measure the gap, clear the path, a spotter on every tight manoeuvre, hands clear of pinch points. If it does not fit as planned, stop and re-plan - do not force it${has('Toilets & amenities') ? '; toilets placed clear of paths and doorways, level and stable' : ''}${has('Generators') ? '; generators on level ground, cables run clear of walkways' : ''}.`],
 ['High communication at all times', 'Radio or phone on and charged; say what you are about to do before you do it; one voice directs each lift and each reverse; any change to the plan goes to the whole crew straight away. Site contacts below.']];
 if (outs.length) H.push(['Removals today', `${outs.length} unit${outs.length === 1 ? '' : 's'} going out: isolate and disconnect before moving anything, and the same truck and lift controls as on the way in.`]);
 return H;
}
function psSite(){ const S = DATA.site || {}; const c = (S.contacts || []).map(x => `${x.role}: ${x.name}${x.phone ? ' ' + x.phone : ''}`);
 return {hours: S.hours ? `${S.hours} ${S.hours_days || ''}${S.hours_qualifier ? ' - ' + S.hours_qualifier : ''}`.trim() : '', contacts: c}; }
function psBody(d, printable){
 const ins = d.deliveries || [], outs = d.removals || [], loads = (d.loads || []).slice().sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
 const cIn = psCount(ins), cOut = psCount(outs), secs = psSectors(ins.concat(outs)), site = psSite(), H = psHazards(d);
 const box = printable ? '<i class="psbox"></i>' : '<input type="checkbox" class="pschk" aria-label="Talked through">';
 return `
 <div class="pssec"><h4><i>01</i> What is coming in</h4>
 <p>${cIn.length ? `<b>In (${ins.length}):</b> ${cIn.map(([t, n]) => `${n} ${esc(psWord(t, n))}`).join(', ')}` : 'Nothing due in on the schedule.'}${cOut.length ? `<br><b>Out (${outs.length}):</b> ${cOut.map(([t, n]) => `${n} ${esc(psWord(t, n))}`).join(', ')}` : ''}</p>
 ${loads.length ? `<p><b>Carrier loads (${loads.length}):</b> ${loads.map(l => `${esc(l.time || '')} ${esc(l.item || l.product || '')}${l.site_eta ? ' (on site about ' + esc(l.site_eta) + ')' : ''}`).join('; ')}. Times are load times at Kingston.</p>` : ''}
 ${secs.length ? `<p><b>Where:</b> ${secs.slice(0, 8).map(([s, n]) => `${esc(s)} (${n})`).join(', ')}${secs.length > 8 ? ' and more' : ''}.</p>` : ''}</div>
 <div class="pssec"><h4><i>02</i> Hazards and controls <em>talk each one through, then tick</em></h4>
 <ul class="pslist">${H.map(([h, c]) => `<li>${box}<b>${esc(h)}.</b> ${esc(c)}</li>`).join('')}</ul></div>
 <div class="pssec"><h4><i>03</i> Coates Life Saving Rules <em>read out, every one, every day</em></h4>
 <ul class="pslist lsr">${PS_LIFE_RULES.map(([n, w]) => `<li>${box}<b>${esc(n)}.</b> ${esc(w)}</li>`).join('')}</ul></div>
 <div class="pssec psstop"><b>If you're unsure, ask the question. Everyone has the right to stop the job.</b></div>
 <div class="pssec"><h4><i>04</i> Site</h4><p>${site.hours ? `<b>Hours:</b> ${esc(site.hours.replace(/\.+$/, ''))}.<br>` : ''}${site.contacts.length ? `<b>Contacts:</b> ${site.contacts.map(esc).join(' · ')}` : ''}</p>
 <p class="psadd"><b>Added on the morning:</b> ${printable ? '<span class="psline"></span><span class="psline"></span>' : 'the supervisor adds anything new on the day - weather, changes, visitors.'}</p></div>
 ${printable ? `<div class="pssec"><h4><i>05</i> Sign-on</h4><table class="pssign"><tr><th>Name</th><th>Signature</th><th>Name</th><th>Signature</th></tr>${'<tr><td></td><td></td><td></td><td></td></tr>'.repeat(6)}</table></div>` : ''}`;
}
/* Andrew, 27 Sep 2026: "pre-start is a print-off, it's not shown". So the Timeline shows no pre-start - only a Print
 pre-start button beside the day's other print buttons, on the days that are prefilled. The sheet itself exists only on paper. */
function prestartButton(d){
 const P = psPrefilled(d); if (P.state !== 'ready') return '';
 return `<button class="btn" data-print-prestart="${esc(d.iso)}" title="The day's pre-start, prefilled automatically ${esc(fmtDate(P.batch))} from what is coming in: one A4 sheet with the hazards, the Coates Life Saving Rules and a sign-on">Print pre-start</button>`;
}
function prestartPrint(iso){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return;
 const P = psPrefilled(d);
 printPages([`<section class="rs-page psprint"><div class="rs-head"><div><div class="rs-brand">${esc(DATA.brand.org)} · ${esc(DATA.event.name)}</div>
 <h1>Pre-start - ${esc(fmtDate(d.iso))}</h1><div class="sub">Prefilled automatically ${esc(fmtDate(P.batch || d.iso))} from the schedule and the carrier's list · supervisor: ______________ · start time: ______</div></div></div>
 ${psBody(d, true)}<p class="foot">${esc(DATA.brand.footer || '')} · Pre-start, prefilled · the day's record is the signed sheet</p></section>`]);
}
