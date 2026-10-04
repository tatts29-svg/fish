/* Author: Andrew Fisher. Compact Timeline presentation using native records and controls. */
function timeline846Reference(row, status) {
  const asset = row.a;
  const written = destinationOf(asset), destination = dest782(asset);
  const name = written.known && written.text || ldPlace(asset) || asset.name || asset.product || 'Destination unconfirmed';
  const source = destination && destination.sms || written.source || 'Destination to confirm';
  return '<span class="ld-ref tl841-ref" data-tl841-ref="' + esc(asset.key) + '" data-tl846-ref="' + esc(asset.key) + '" title="' + esc(status.why) + '">' +
    '<span class="tl846-identity"><span class="ld-c"><b>' + esc(asset.key) + '</b><span class="tl846-name">' + esc(name) + '</span></span><span class="tl841-status ' + status.tone + (status.stage === 5 ? ' finished' : '') + '">' + esc(status.label) + '</span></span>' +
    '<span class="ld-w"><span class="tl846-description">' + esc(ldWhat(row)) + '</span><span class="tl846-source">' + esc(source) + '</span></span>' +
    (written.quoted && written.quote ? '<span class="tl846-qualification">' + esc(written.quote) + '</span>' : '') +
    '<span class="tl846-ticks">' + ldTicks(asset) + '</span>' + timeline841Lights(status) + '</span>';
}
function timeline846Line(d, g, n, open, timed) {
  const id = ldId(d, g), body = 'ldb-' + id.replace(/[^A-Za-z0-9]+/g, '-');
  const statuses = g.rows.map(row => timeline841State(row.a));
  const refs = g.rows.map((row, index) => timeline846Reference(row, statuses[index])).join('');
  const when = timed ? '<span class="ld-t"><b class="' + (g.time ? '' : 'nt') + '">' + esc(g.time || '—') + '</b><em>' + esc(g.carrier || 'no carrier') + '</em></span>' : '';
  const say = 'Load ' + n + (g.time ? ', ' + g.time : '') + (g.carrier ? ', ' + g.carrier : '') + ': ' + g.rows.map((row, index) => row.a.key + ' ' + statuses[index].word.toLowerCase()).join(', ');
  const directions = ldGo751(g), actions = timeline841Actions(d, g, n);
  return '<div class="ld tl846' + (directions ? ' go' : '') + (open ? ' on' : '') + (g.kind === 'removals' ? ' out' : '') + (g.rows.length > 1 ? ' multi' : '') + '" role="listitem" data-tl846-load="' + esc(id) + '">' +
    '<div class="tl846-layout"><button type="button" class="ldl" data-ld="' + esc(id) + '" aria-expanded="' + open + '"' + (open ? ' aria-controls="' + esc(body) + '"' : '') + ' aria-label="' + esc(say + (open ? '. Press to close.' : '. Press to open the delivery cards.')) + '">' +
    '<span class="ld-n"><em>Load</em><b>' + n + '</b></span><span class="ld-refs' + (g.rows.length > 1 ? ' multi' : '') + '">' + refs + '</span><span class="ld-x" aria-hidden="true"></span></button>' +
    '<div class="tl846-controls">' + when + directions + actions + '</div></div>' +
    (open ? '<div class="ldb" id="' + esc(body) + '">' + dayCards(g.rows, g.kind) + '<div class="daily821-load-message">' + g.rows.map(row => '<div><b>' + esc(row.a.key) + '</b>' + mms757Button(row.a.key) + '</div>').join('') + '</div></div>' : '') + '</div>';
}
