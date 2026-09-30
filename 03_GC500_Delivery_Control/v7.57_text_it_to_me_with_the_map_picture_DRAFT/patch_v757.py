#!/usr/bin/env python3
"""v7.57 - Text it to me, with a picture of the map. Andrew, 1 Oct 2026: "I want a picture of the map of where it
goes. Next to the QR code and Navigate: Text it to me. This allows you to enter in a mobile number and it will text
it to you, MMS, of where it goes. I don't mind the cost."

  - Every Timeline load line that has somewhere to navigate to gets a third control beside the QR code and Navigate:
    "Text it · to me · picture". It opens the Text box for that reference.
  - The Text box (the drawer's Text it too) now draws a picture of where the thing goes: the registered aerial,
    the master plan D001 laid over it through the same fit the drawers use, a pin on the spot, a 20 m scale bar,
    north, and a band naming the reference, the position and its source. Drawn on the page, nothing fetched but the
    page's own pictures. Shown in the box; on a phone it can be held to save.
  - With the service set up for it (server v5.85: /api/mms), a tick sends the picture as a picture message (MMS)
    with the same words, to the number typed; unticked, or where the service cannot, the plain text goes as before.
    The service answers with what went and what it cost, and refuses anything over its walls.
  Nothing about the record changes; the words of the text are v7.48's.
    python3 patch_v757.py <page.html>   (needs the live v7.51+: ldGo751, smsDropBox)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'mms757' in t: sys.exit('v7.57 already applied')
for need in ['function ldGo751(g){', 'async function smsDropBox(a){', 'function sheetFitOf(sh){', 'function frameOf(lat, lon){', 'const MAP_TILES = {']:
    if need not in t: sys.exit('needs ' + need)

def swap_function(text, key, new_src):
    """replace one whole function by its head (exactly one definition, brace-matched)"""
    if text.count(key) != 1: sys.exit(key + ': expected exactly one definition, found ' + str(text.count(key)))
    i = text.find(key); k = text.find('{', i); d = 0; instr = None; esc = False
    for e in range(k, len(text)):
        ch = text[e]
        if instr:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == instr: instr = None
            continue
        if ch in '\'"`': instr = ch; continue
        if ch == '{': d += 1
        elif ch == '}':
            d -= 1
            if d == 0: return text[:i] + new_src + text[e + 1:]
    sys.exit(key + ': unbalanced braces')

# 1. the button on the load line, and its wiring
t = rep(t, "<span class=\"ld-nav-t\"><b>Navigate</b><em>${esc((x.more ? key + ' · ' : '') + word)}</em></span></a>` + `</div>`; }",
 "<span class=\"ld-nav-t\"><b>Navigate</b><em>${esc((x.more ? key + ' · ' : '') + word)}</em></span></a>` + mms757Button(key) + `</div>`; }\n"
 "/* mms757 - Text it to me, with a picture of the map (Andrew, 1 Oct 2026). The button sits beside the QR code and Navigate; pressing it never opens or closes the load. */\n"
 "const MMS757_ICON = '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z\"/><circle cx=\"8\" cy=\"10.5\" r=\"1.4\" fill=\"#10161b\"/><circle cx=\"12\" cy=\"10.5\" r=\"1.4\" fill=\"#10161b\"/><circle cx=\"16\" cy=\"10.5\" r=\"1.4\" fill=\"#10161b\"/></svg>';\n"
 "function mms757Button(key){ return `<button type=\"button\" class=\"ld-txt\" data-ldtxt=\"${esc(key)}\" title=\"${esc('Text where ' + key + ' goes, with a picture of the map, to a mobile')}\">${MMS757_ICON}<span class=\"ld-nav-t\"><b>Text it</b><em>to me · picture</em></span></button>`; }\n"
 "document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-ldtxt]') : null; if (!b) return; e.preventDefault(); e.stopPropagation(); const a = assetOf(b.dataset.ldtxt); if (a) smsDropBox(a); else flash('That reference is not on the page.'); }, true);",
 'load line button', p, True)

# 2. the picture, and the Text box that shows and sends it
PIC = r"""
/* mms757 - THE PICTURE OF WHERE IT GOES. The registered aerial (the frame every pin is read against), about 95 m each
   side of the spot, with the master plan D001 laid over it through sheetFitOf - the same fit the drawers use to put a
   position on a sheet - a pin on the spot, a 20 m bar, north, and a band with the reference, what it is, the position
   and where the position came from. Drawn here, from the page's own pictures, as a JPEG under ClickSend's 250 kB. */
const MMS757 = {w: 1000, h: 720, band: 104, halfM: 95, maxBytes: 235000};
function mms757Load(src){ return new Promise((ok, no) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = () => no(new Error('a map picture would not load')); im.src = src; }); }
async function mms757Picture(a){
 const nt = navTargetFor(a); if (!nt || !nt.ll) throw new Error('no position on the record for ' + a.key);
 const g = DATA.georef, fr = frameOf(nt.ll.lat, nt.ll.lon); if (!g || !fr) throw new Error('the map is not registered on this page');
 const aer = (DATA.sheets || []).find(s => s.key === 'AERIAL'); if (!aer || typeof aer.src !== 'string') throw new Error('the aerial is not on this page');
 const W = MMS757.w, H = MMS757.h, B = MMS757.band, FX = g.frame_px[0], FY = g.frame_px[1];
 const pxPerM = 1 / g.m_per_frame_px_ground, fw = 2 * MMS757.halfM * pxPerM, fh = fw * H / W;
 let x0 = fr.ax * FX - fw / 2, y0 = fr.ay * FY - fh / 2;
 x0 = Math.max(0, Math.min(FX - fw, x0)); y0 = Math.max(0, Math.min(FY - fh, y0));
 const im = await mms757Load(aer.src); const sx = im.naturalWidth / FX, sy = im.naturalHeight / FY;
 const cv = document.createElement('canvas'); cv.width = W; cv.height = H + B; const c = cv.getContext('2d');
 c.fillStyle = '#10161b'; c.fillRect(0, 0, W, H + B);
 c.drawImage(im, x0 * sx, y0 * sy, fw * sx, fh * sy, 0, 0, W, H);
 /* the master plan over the photograph */
 let plan = false;
 try {
 const d1 = (DATA.sheets || []).find(s => s.key === 'D001'); const fit = d1 ? sheetFitOf(d1) : null;
 if (fit && MAP_TILES && MAP_TILES.levels && DATA.media) {
 const L = MAP_TILES.levels[0], T = MAP_TILES.tile;
 const px0 = (fit.fx.k * (x0 / FX) + fit.fx.c) * L.w, px1 = (fit.fx.k * ((x0 + fw) / FX) + fit.fx.c) * L.w;
 const py0 = (fit.fy.k * (y0 / FY) + fit.fy.c) * L.h, py1 = (fit.fy.k * ((y0 + fh) / FY) + fit.fy.c) * L.h;
 if (px1 > px0 && py1 > py0) {
 const kx = W / (px1 - px0), ky = H / (py1 - py0), loads = [];
 for (let r = Math.max(0, Math.floor(py0 / T)); r <= Math.min(L.rows.length - 1, Math.floor(py1 / T)); r++)
 for (let cc = Math.max(0, Math.floor(px0 / T)); cc <= Math.min(L.rows[0].length - 1, Math.floor(px1 / T)); cc++) { const u = DATA.media[L.rows[r][cc]]; if (typeof u === 'string') loads.push(mms757Load(u).then(im2 => ({im2, r, cc})).catch(() => null)); }
 const tiles = (await Promise.all(loads)).filter(Boolean);
 if (tiles.length) { c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip(); c.globalAlpha = 0.58; c.globalCompositeOperation = 'multiply'; tiles.forEach(({im2, r, cc}) => c.drawImage(im2, (cc * T - px0) * kx, (r * T - py0) * ky, im2.naturalWidth * kx + 0.6, im2.naturalHeight * ky + 0.6)); c.restore(); plan = true; }
 }
 }
 } catch (e) { plan = false; }
 /* the spot */
 const X = (fr.ax * FX - x0) / fw * W, Y = (fr.ay * FY - y0) / fh * H, mPx = W / (2 * MMS757.halfM);
 c.save(); c.strokeStyle = 'rgba(255,106,19,.55)'; c.lineWidth = 3; c.beginPath(); c.arc(X, Y, 8 * mPx, 0, Math.PI * 2); c.stroke(); c.restore();
 c.save(); c.translate(X, Y); c.fillStyle = '#ff6a13'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineJoin = 'round';
 c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-30, -34, -30, -64, 0, -68); c.bezierCurveTo(30, -64, 30, -34, 0, 0); c.closePath(); c.stroke(); c.fill();
 c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -46, 9, 0, Math.PI * 2); c.fill(); c.restore();
 /* the reference at the pin */
 c.save(); c.font = 'bold 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'; c.textBaseline = 'middle'; const lw = c.measureText(a.key).width + 26; const lx = Math.min(W - lw - 8, X + 30), ly = Math.max(24, Y - 88);
 c.fillStyle = 'rgba(16,22,27,.92)'; c.beginPath(); c.roundRect ? c.roundRect(lx, ly - 22, lw, 44, 10) : c.rect(lx, ly - 22, lw, 44); c.fill(); c.fillStyle = '#ff6a13'; c.fillText(a.key, lx + 13, ly + 1); c.restore();
 /* 20 m bar, and north */
 c.save(); c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 4; c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 4; c.beginPath(); c.moveTo(24, H - 26); c.lineTo(24 + 20 * mPx, H - 26); c.stroke(); c.font = 'bold 18px system-ui, sans-serif'; c.fillText('20 m', 24, H - 36);
 const b = (g.up_is_bearing_deg || 0) * Math.PI / 180, nx = W - 46, ny = H - 46, ux = -Math.sin(b), uy = -Math.cos(b);
 c.beginPath(); c.moveTo(nx + ux * 28, ny + uy * 28); c.lineTo(nx - ux * 14 + uy * 10, ny - uy * 14 - ux * 10); c.lineTo(nx - ux * 14 - uy * 10, ny - uy * 14 + ux * 10); c.closePath(); c.fill(); c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('N', nx + ux * 40, ny + uy * 40 + 6); c.restore();
 /* the band */
 const word = nt.pinned && nt.fix && nt.fix.master ? 'from the master plan D001' : nt.pinned ? 'pinned on site' + (nt.fix && nt.fix.acc != null ? ', within ' + Math.max(1, Math.round(nt.fix.acc)) + ' m' : '') : nt.placed ? 'placed on the map, not yet checked on site' : 'from the drawing';
 const m = typeof masterUnit === 'function' ? masterUnit(a.key) : null, near = m && typeof masterWords === 'function' ? masterWords(m) : '';
 c.save(); c.fillStyle = '#fff'; c.font = 'bold 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'; c.textBaseline = 'alphabetic';
 const fit2 = (s, f, max) => { c.font = f; let cut = false; while (c.measureText(s + (cut ? '…' : '')).width > max && s.length > 8) { s = s.slice(0, -2); cut = true; } return cut ? s.replace(/[\s·—\-,]+$/, '') + '…' : s; };
 c.fillText(fit2(text747What(a), 'bold 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif', W - 240), 24, H + 44);
 c.fillStyle = '#c9d1d9'; c.fillText(fit2(nt.ll.text + ' · ' + word + (near ? ' · ' + near : ''), '21px system-ui, -apple-system, Segoe UI, Roboto, sans-serif', W - 240), 24, H + 80);
 c.textAlign = 'right'; c.fillStyle = '#ff6a13'; c.font = 'bold 22px system-ui, sans-serif'; c.fillText('Coates GC500', W - 24, H + 44); c.fillStyle = '#9aa3ad'; c.font = '17px system-ui, sans-serif'; c.fillText(fmtDate(new Date().toISOString()), W - 24, H + 78); c.restore();
 /* a JPEG under the wall */
 let q = 0.86, url = cv.toDataURL('image/jpeg', q); const bytesOf = u => Math.floor((u.length - u.indexOf(',') - 1) * 3 / 4);
 while (bytesOf(url) > MMS757.maxBytes && q > 0.45) { q = Math.round((q - 0.08) * 100) / 100; url = cv.toDataURL('image/jpeg', q); }
 return {dataUrl: url, bytes: bytesOf(url), w: W, h: H + B, quality: q, plan, words: plan ? 'the aerial with the master plan over it' : 'the aerial'};
}
"""
BOX = r"""async function smsDropBox(a){ /* mms757 - with a picture of the map */
 let ready = false, today = null, mms = null;
 try { const r = await fetch('/api/sms', {headers: {'x-gc500-token': tokenOf()}}); const j = await r.json();
 ready = !!j.configured && !SYNC.readonly; today = j.today || null; } catch (e) {}
 if (ready) { try { const r = await fetch('/api/mms', {headers: {'x-gc500-token': tokenOf()}}); if (r.ok) mms = await r.json(); } catch (e) { mms = null; } }
 const nt = navTargetFor(a), canPic = !!(nt && nt.ll && DATA.georef && (DATA.sheets || []).some(s => s.key === 'AERIAL' && typeof s.src === 'string'));
 const mmsOn = !!(ready && canPic && mms && mms.configured && !mms.from_needed);
 const text = dropSmsText(a);
 const d = document.createElement('div');
 d.className = 'drawer on'; d.style.zIndex = 31; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
 d.innerHTML = `<div class="dh"><div><h2>Text ${esc(a.key)}</h2>
 <div class="sub">${ready ? 'Goes from this service through ClickSend: what it is, the GPS, a Maps link and the way in' + (canPic ? ', and a picture of the map with the spot marked' : '') + '. The link opens the card with the pictures.'
 : 'Texting is not switched on here, so this copies the words for you to send yourself' + (canPic ? '; the picture can be saved from here.' : '.')}</div></div>
 <button class="close" aria-label="Close" title="Close">&times;</button></div>
 <div class="db">
 ${ready ? `<div class="f"><label for="smTo">Send to</label>
 <input id="smTo" type="tel" inputmode="tel" autocomplete="off" placeholder="0429 352 788 — a few, separated by commas"></div>` : ''}
 <div class="f"><label for="smTx">The message</label>
 <textarea id="smTx" rows="7" style="width:100%;font:inherit">${esc(text)}</textarea></div>
 <p class="hint" id="smCount"></p>
 ${canPic ? `<div class="f mms757"><label>The picture of where it goes</label>
 <div class="mms757-pic" id="smPicWrap"><span id="smPicWait">Drawing the picture of the map…</span><img id="smPicImg" alt="${esc('Where ' + a.key + ' goes, on the map')}" hidden></div>
 ${mmsOn ? `<label class="mms757-tick"><input type="checkbox" id="smPic" checked> <span>Send the picture too — as a picture message (MMS). It costs more than a text.</span></label>`
 : ready ? `<p class="hint">Picture messages are not switched on for this service${mms && mms.from_needed ? ' (it needs a sender name, SMS_FROM)' : mms ? '' : ' yet (server v5.85)'} — the words go as a text; the picture can be saved from here.</p>`
 : `<p class="hint">On a phone, press and hold the picture to save or share it.</p>`}
 <p class="hint" id="smPicInfo"></p></div>` : ''}
 <p class="hint" id="smMsg">${today ? esc(today.left + ' of today\'s ' + today.cap + ' left') : ''}</p>
 <div class="df" style="padding:0">
 ${ready ? `<button class="btn ghost" id="smDry">Check it, send nothing</button>
 <button class="btn primary" id="smGo">Send</button>` : ''}
 <button class="btn" id="smCopy">Copy the words</button>
 <button class="btn ghost" id="smLong" type="button">Full details</button>
 <a class="btn" id="smOpen" href="sms:?&body=${encodeURIComponent(text)}">Open a text message</a>
 </div>
 </div>`;
 mounted(document.body.appendChild(d));
 const close = () => d.remove();
 d.querySelector('.close').onclick = close;
 const msg = d.querySelector('#smMsg');
 text747Wire(d, a, ready); /* v7.48 */
 if (canPic) {
 const img = d.querySelector('#smPicImg'), wait = d.querySelector('#smPicWait'), info = d.querySelector('#smPicInfo');
 mms757Picture(a).then(pic => { d._pic = pic; img.src = pic.dataUrl; img.hidden = false; if (wait) wait.remove(); info.textContent = pic.words + ' · ' + pic.w + '×' + pic.h + ' · ' + Math.round(pic.bytes / 1000) + ' kB'; })
 .catch(e => { d._picError = String(e && e.message || e); if (wait) wait.textContent = 'The picture could not be drawn: ' + d._picError; const tick = d.querySelector('#smPic'); if (tick) { tick.checked = false; tick.disabled = true; } });
 }
 d.querySelector('#smCopy').onclick = async () => {
 try { await navigator.clipboard.writeText(d.querySelector('#smTx').value); flash('Copied.'); }
 catch (e) { msg.textContent = 'Your browser would not let the page copy — select the words and copy them.'; }
 };
 if (ready) {
 const run = async dry => {
 /* mms757 - a number written with its spaces, "0429 352 788", is ONE number (it used to split on the spaces into three that did not read); several are separated by commas, semicolons or new lines */
 const to = d.querySelector('#smTo').value.split(/[,;\n]+/).map(x => x.replace(/\s+/g, '')).filter(Boolean);
 if (!to.length) { msg.textContent = 'Put a number in first.'; return; }
 const tick = d.querySelector('#smPic'), withPic = !!(mmsOn && tick && tick.checked);
 if (withPic && !d._pic) { msg.textContent = d._picError ? 'The picture could not be drawn — untick it to send the words alone.' : 'The picture is still being drawn — a moment.'; return; }
 const go = d.querySelector('#smGo'), dv = d.querySelector('#smDry');
 go.disabled = dv.disabled = true; msg.textContent = dry ? 'Checking…' : 'Sending…';
 try {
 const body = withPic ? {to, text: d.querySelector('#smTx').value, subject: ('Coates GC500 ' + a.key).slice(0, 20), picture: d._pic.dataUrl, dry_run: !!dry}
 : {to, text: d.querySelector('#smTx').value, dry_run: !!dry};
 const r = await fetch(withPic ? '/api/mms' : '/api/sms', {method: 'POST',
 headers: {'Content-Type': 'application/json', 'x-gc500-token': tokenOf(),
 'x-gc500-who': (S.operator || '').trim() || 'unnamed'},
 body: JSON.stringify(body)});
 const j = await r.json();
 if (!r.ok) msg.innerHTML = '<b>Nothing was sent.</b> ' + esc(j.error || ('the service answered ' + r.status));
 else if (dry) msg.innerHTML = 'It reads fine: <b>' + j.messages + '</b> ' + (withPic ? 'picture message' : 'message')
 + (j.messages === 1 ? '' : 's') + (withPic ? ', the picture ' + Math.round(j.picture.bytes / 1000) + ' kB' : ', ' + j.shape.parts + ' part' + (j.shape.parts === 1 ? '' : 's') + ' each') + '. Nothing has been sent.';
 else { msg.innerHTML = '<b>Sent</b> to ' + esc((j.to || (j.messages || []).map(m => m.to)).join(', ')) + (withPic ? ', with the picture' : '') + (j.clicksend && j.clicksend.total_price != null ? ' · $' + esc(String(j.clicksend.total_price)) : '') + '.'; setTimeout(close, 2600); }
 } catch (e) { msg.textContent = 'Nothing was sent: ' + (e && e.message || e); }
 finally { go.disabled = dv.disabled = false; }
 };
 d.querySelector('#smGo').onclick = () => run(false);
 d.querySelector('#smDry').onclick = () => run(true);
 d.querySelector('#smTo').focus();
 }
}"""
t = swap_function(t, 'async function smsDropBox(a){', PIC.strip('\n') + '\n' + BOX)

# 3. the styles, beside the load line's
t = rep(t, ".ld-qr svg{display:block;width:58px;height:58px}",
 ".ld-qr svg{display:block;width:58px;height:58px} /* mms757 */ .ld-txt{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:8px 12px;border-radius:10px;border:1px solid #3a4550;background:#141a1e;color:#fff;cursor:pointer;font:inherit;text-align:left;line-height:1.15} .ld-txt svg{width:22px;height:22px;fill:var(--ld-or,#ff6a13);flex:0 0 auto} .ld-txt b{display:block;font-size:14px} .ld-txt em{display:block;font-style:normal;font-size:11.5px;color:#9aa3ad} .ld-txt:hover,.ld-txt:focus-visible{border-color:var(--ld-or,#ff6a13);outline:none} .mms757-pic{position:relative;background:#0f1214;border-radius:10px;overflow:hidden;min-height:110px;display:flex;align-items:center;justify-content:center;color:#c9d1d9;font-size:13px;margin-top:4px} .mms757-pic img{display:block;width:100%;height:auto} .drawer .mms757-tick{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;font:inherit;font-size:14px;line-height:1.35;text-transform:none;letter-spacing:0;color:inherit;cursor:pointer} .drawer .mms757-tick input{margin:3px 0 0;flex:0 0 auto;width:18px;height:18px} .drawer .mms757-tick span{flex:1 1 auto} @media (max-width:640px){.ld-go{flex-wrap:wrap;justify-content:flex-end}}",
 'styles', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
