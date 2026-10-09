/* Author: Andrew Fisher. v7.54 — a documented Rehire fleet number follows its adopted schedule row.
 * A read-only projection. It does not create a unit, name a supplier, change a contract, or override a site entry. */
function sourceRehire754(key){
 if (key !== 'FL01' || movedAway(key) || assetDeleted(key)) return null;
 const ref = (S.added || []).find(a => a && a.key === key && a.source_row === 'T0003');
 if (!ref || (S.assetNumbers[key] || []).length || unitsOf(key).length) return null;
 const supplied = localSupplied(key);
 if ((supplied.asset_numbers || []).length || (((CROW.get(key) || {}).asset_numbers_supplied) || []).length) return null;
 const matches = ONHIRE_ROWS.filter(r => String(r.rental_contract) === '9961976' && Number(r.line) === 31
  && r.kind === 'forklift' && r.quantity === 1 && r.subhired_machine === true
  && r.match && r.match.task_id === ref.source_row && String(r.asset_no).toUpperCase() === 'MISCITEM'
  && /PHILLIP PARK/i.test(r.location || ''));
 if (matches.length !== 1) return null;
 const line = matches[0], match = String(line.location || '').match(/\bASSET\s+(50004)\b/i);
 if (!match || tombedHere('num/' + key + '/' + match[1]) || tombedHere(unitTombId(key, {asset_no: match[1]}))) return null;
 const co = ((S.subhire || {})[key] || {}).co || 'Supplier not named';
 return {co, no: match[1], source754: true, source: line.location,
  u: {label: 'Sub-hire: ' + co, asset_no: match[1], _where: 'hire-record location note', source754: true}};
}
function sourceRehire754Html(key){
 const source = sourceRehire754(key);
 return source ? `<p class="hint" data-rehire-source754>Fleet number <b class="mono">${esc(source.no)}</b> is written in the hire-record location note for Phillip Park. ${source.co === 'Supplier not named' ? 'The supplier is not named in that source. ' : ''}Source: ${esc(source.source)}. A number recorded on site takes precedence.</p>` : '';
}
