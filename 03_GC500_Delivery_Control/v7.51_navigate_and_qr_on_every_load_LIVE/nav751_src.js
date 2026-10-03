/* v7.51 - NAVIGATE AND A QR CODE ON EVERY LOAD. The project manager, 1 Oct 2026, with the Timeline on a big screen:
 "Can I get a navigate to, as well as a QR code taking you to the exact pinned location. Make it look good and suited
 to that line. Animate it. Pulsate it."

 Each load line on the Timeline carries, at its right-hand end, a pulsing NAVIGATE pill and a QR code. Both open the
 phone's maps app with driving directions to the exact position of the first reference on the load that has one:
 the master plan's position where the plan tags the unit (master plan wins), else a pin taken on site, else a
 position placed on the map. The QR is for the big screen - a driver holds a phone up to it and drives; the pill is
 for the phone in the hand. Where a load has no position yet, the line carries nothing rather than a wrong spot.
 The pill and the code sit outside the line's own button, so pressing them never opens or closes the load. */
function ldGoTarget751(g){
 for (const r of (g && g.rows) || []) {
 let t = null; try { t = navTargetFor(r.a); } catch (e) { t = null; }
 if (t && t.ll) return {t, a: r.a, more: g.rows.length > 1};
 }
 return null;
}
function ldGoWord751(t){
 if (t.pinned && t.fix && t.fix.master) return 'master plan';
 if (t.pinned) return 'pinned on site';
 if (t.placed) return 'placed on the map';
 return 'the area';
}
function ldGo751(g){
 const x = ldGoTarget751(g); if (!x) return '';
 const url = navUrl(x.t.ll), word = ldGoWord751(x.t), key = x.a.key;
 const title = 'Directions to ' + key + ' - ' + word + ' - ' + x.t.ll.text;
 return `<div class="ld-go" role="group" aria-label="${esc('Navigate to ' + key)}">`
 + `<a class="ld-qr" href="${url}" target="_blank" rel="noopener noreferrer" title="${esc('Scan with a phone: ' + title)}" aria-label="${esc('QR code: ' + title)}">${qrSvg(url, 2)}</a>`
 + `<a class="ld-nav" href="${url}" target="_blank" rel="noopener noreferrer" title="${esc(title)}">${LD_PIN}<span class="ld-nav-t"><b>Navigate</b><em>${esc((x.more ? key + ' · ' : '') + word)}</em></span></a>`
 + `</div>`;
}
