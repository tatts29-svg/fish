/* Author: Andrew Fisher. One common instruction disclosure for both crews. */
function renderPrestarts_held(){
 const noteFocus851 = captureFenceComponents849('prestarts');
 const hosted = !!(SYNC.backend && SYNC.backend.fileUrl);
 const canAdd = hosted && !SYNC.readonly;
 const today = todayIso();
 const card = c => {
 const rows = prestartsFor(c.key);
 const add = canAdd ? `<div class="preadd">
 <label class="f"><span>The day it was held</span><input type="date" id="preDate_${c.key}" value="${esc(today)}" max="${esc(today)}"></label>
 <label class="f"><span>The signed pre-start</span><input type="file" id="preFile_${c.key}" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"></label>
 <button class="btn primary" data-preup="${c.key}">Upload it</button>
 <p class="norate" id="preMsg_${c.key}">Goes to the shared record under that day, for ${esc(c.label)}. ${
 S.operator ? 'Recorded as ' + esc(S.operator) + '.' : 'Put your name in “Recording as” first so the upload carries it.'}</p>
 </div>` : '';
 /* the master leads, because it is the one somebody opens on the morning; the records follow, newest first */
 const mst = prestartMasterFor(c.key);
 const sw = prestartSwmsFor(c.key);
 const swHtml = sw ? `<div class="preswms">
 <div><b>The SWMS it runs to</b><span>${esc(sw.say)} \u00b7 ${esc(sw.who)}</span></div>
 ${sw.href ? `<a class="btn" href="${esc(sw.href)}" target="_blank" rel="noopener noreferrer">Open the SWMS</a>`
 : (typeof DOCS !== 'undefined' && DOCS.state && DOCS.state !== 'ready' && DOCS.state !== 'none' && DOCS.state !== 'failed' ? '<span class="todo">checking the shared record…</span>' : '<span class="todo">not uploaded yet</span>')}
 </div>` : '';
 const mstHtml = mst ? `<div class="premaster">
 <div><b>The master</b><span>Blank, with the date and the docket number to fill in. Print it as needed.</span></div>
 ${mst.href ? `<a class="btn" href="${esc(mst.href)}" target="_blank" rel="noopener noreferrer">Open the master</a>`
 : (typeof DOCS !== 'undefined' && DOCS.state && DOCS.state !== 'ready' && DOCS.state !== 'none' && DOCS.state !== 'failed' ? '<span class="todo">checking the shared record…</span>' : '<span class="todo">not uploaded yet</span>')}
 </div>` : '';
 return `<div class="card" id="pre-${esc(c.key)}">
 <h3>${esc(c.label)}</h3>
 <p class="sub">${esc(c.what)} · <b>${fmtNum(rows.length)}</b> ${rows.length === 1 ? 'document' : 'documents'}${
 mst ? ' · and the master' : ''}</p>
 ${swHtml}
 ${mstHtml}
 ${add}
 ${c.key === 'coates' ? `<div class="ps7box">${ps7ListHtml()}</div>` : ''} 
 ${rows.length ? `<ul class="prelist">${rows.map(prestartRow).join('')}</ul>`
 : `<div class="notice"><b>Nothing here yet for ${esc(c.label)}</b>A pre-start lands on its own day as soon as it is uploaded. Name it with the day — <span class="mono">2026-09-14</span> or <span class="mono">14Sep2026</span> — or pick the day above and this page writes it into the title for you.</div>`}
 </div>`;
 };
 const readNotice = canAdd ? '' : hosted
   ? '<p class="norate" data-clean851-read-notice>This link can read the record but not add to it. Open the edit link to upload a pre-start.</p>'
   : '<p class="norate" data-clean851-read-notice>This copy has no service behind it, so pre-starts can only be read from the package folder beside it.</p>';
 const filingNotes = '<p class="maphint"><b>The daily pre-start, one a day, for each crew.</b> This page lists, dates and opens them; what is inside one is whatever was signed on the day. A document is filed against a day by the date in its title or its file name — upload it here and the day you pick is written in for you.</p>';
 $('#pane-prestarts').innerHTML = paneHeadingHtml('prestarts') + readNotice
   + '<div data-fc849-scope="prestarts">' + fencePresentationFold851('prestarts', 'filing-notes', 'Filing instructions', filingNotes) + '</div>'
   + PRESTART_CREWS.map(card).join('');
 const pane = $('#pane-prestarts');
 bindFenceComponents849(pane);
 pane.querySelectorAll('[data-preup]').forEach(b => b.onclick = () => prestartUpload(b.dataset.preup));
 pane.querySelectorAll('[data-ps7]').forEach(b => b.onclick = () => ps7Print(b.dataset.ps7)); /* v6.97 */
 restoreFenceComponents849(noteFocus851);
}
