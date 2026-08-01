#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - THE PHONE EXPERIENCE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Three things the page needed, all of them phone-first
#  (A. Fisher, 25 Jul 2026):
#
#  1. SAVE TO MY PHONE, not print.
#     The old button called window.print(), which on a phone opens the
#     printer dialog - and nobody on a shutdown is printing anything.
#     Now it opens the phone's own share sheet (Save to Files, Photos,
#     send to yourself) and falls back to a plain download. Printing is
#     still there, quietly, for whoever actually wants paper.
#
#  2. SCAN MY CARD.
#     Typing an ID with gloves on in the dark is the worst part of the
#     page. The camera does it instead. Uses the phone's built-in
#     BarcodeDetector where it exists, and a bundled decoder on iPhone
#     where it doesn't - so it works on every handset on site, with no
#     app to install and no signal needed.
#
#     ALSO: the page reads ?id=NUMBER off the address. Encode the QR on
#     a hirer card as the My Gear link with ?id= on the end and the
#     native camera app opens their gear straight up - no typing, no
#     buttons, nothing to explain.
#
#  3. THE SITE GUIDES.
#     Contact board, radio guide and gas monitor guide live in the page
#     now - see mygear_guides.py for why they are rebuilt rather than
#     bolted on as PDFs.
# =====================================================================

CSS = """
/* ---- MY GEAR wordmark - the crews' signs and the A3 poster say MY GEAR,
   so the page has to say it back to them the moment it opens ---- */
h1.mg{font-size:44px;line-height:.95;font-weight:800;letter-spacing:-1px;
  text-transform:uppercase;color:#fff;margin:0}
h1.mg b{color:var(--org)}
.mgsub{color:var(--mut);font-size:13px;margin:8px 0 2px}
.guidelink{display:flex;align-items:center;gap:10px;margin-top:14px;
  background:#11151C;border:1px solid #232A34;border-radius:12px;
  padding:11px 14px;cursor:pointer}
.guidelink b{color:#E6E9EE;font-size:13.5px}
.guidelink span{flex:1;color:var(--mut);font-size:11.5px}
.guidelink em{font-style:normal;color:#4A525E;font-size:20px}
/* ---- the guide shelf on the landing page and the card ---- */
.gshelf{margin-top:16px}
.gshelf .gh{font-size:11px;letter-spacing:2.4px;text-transform:uppercase;
  color:var(--org);font-weight:800;margin:0 0 8px 2px}
.gbtn{display:flex;align-items:center;gap:12px;width:100%;text-align:left;
  background:linear-gradient(180deg,#151A22,#11151C);border:1px solid #232A34;
  border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;
  color:#E6E9EE;font:inherit;transition:transform .12s,border-color .12s}
.gbtn:active{transform:scale(.985);border-color:var(--org)}
.gbtn svg{width:22px;height:22px;flex:none;color:var(--org)}
.gbtn div{flex:1;min-width:0}
.gbtn b{display:block;font-size:14.5px;font-weight:700}
.gbtn span{display:block;font-size:11.5px;color:var(--mut);margin-top:2px}
.gbtn em{font-style:normal;color:#4A525E;font-size:22px;line-height:1}

/* ---- the sheet the guides open into ---- */
.gsheet{position:fixed;inset:0;background:#0A0E14;z-index:60;display:none;
  flex-direction:column}
.gsheet.on{display:flex}
.gsbar{display:flex;align-items:center;gap:12px;padding:14px 16px;
  background:var(--org);flex:none}
.gsbar b{flex:1;color:#fff;font-size:16px;font-weight:800;letter-spacing:.2px}
.gsbar button{background:rgba(0,0,0,.22);border:0;color:#fff;font:inherit;
  font-size:13px;font-weight:700;border-radius:999px;padding:7px 15px;
  cursor:pointer}
.gsbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:14px 14px 34px}
.gpane{display:none}
.gpane.on{display:block}

/* ---- emergency block ---- */
.gemerg{background:linear-gradient(160deg,#C0392B,#8A1F14);border-radius:16px;
  padding:16px 18px;color:#fff;margin-bottom:14px}
.gemerg.gsmall{background:linear-gradient(160deg,#1D242E,#141A22);
  border:1px solid #2A313C}
.ge-t{font-size:11px;letter-spacing:2.2px;text-transform:uppercase;
  font-weight:800;opacity:.92}
.ge-n{font-size:40px;font-weight:800;line-height:1.05;margin-top:4px}
.ge-n a{color:#fff;text-decoration:none}
.ge-s{font-size:12px;opacity:.85;margin-top:-2px}
.ge-r{font-size:15px;font-weight:700;margin-top:9px;display:flex;
  flex-wrap:wrap;gap:8px;align-items:center}
.ge-ch{background:rgba(255,255,255,.16);border-radius:999px;padding:3px 11px;
  font-size:12px;letter-spacing:.6px}
.ge-b{font-size:12.5px;line-height:1.65;margin-top:10px;opacity:.95}
.ge-m{display:block;margin-top:6px;opacity:.8;font-size:11.5px}

/* ---- grouped contact list ---- */
.ghead{border-left:4px solid var(--org);padding:2px 0 2px 10px;margin:18px 0 8px;
  font-size:12.5px;font-weight:800;letter-spacing:.4px;color:#fff;
  text-transform:uppercase;display:flex;align-items:center}
.ghead span{margin-left:auto;background:#1B212A;color:var(--mut);
  border-radius:999px;padding:2px 9px;font-size:11px;font-weight:700;
  letter-spacing:0}
.glist{border:1px solid #232A34;border-radius:14px;overflow:hidden}
.grow{display:flex;align-items:center;gap:10px;padding:10px 13px;
  border-bottom:1px solid #1B212A;background:#11151C}
.grow:nth-child(even){background:#0E131A}
.grow:last-child{border-bottom:0}
.gwho{flex:1;min-width:0}
.gwho b{display:block;font-size:14px;color:#E6E9EE;font-weight:700}
.gwho span{display:block;font-size:11.5px;color:var(--mut);margin-top:1px;
  line-height:1.35}
.gnum{flex:none}
a.tel{display:inline-flex;align-items:center;gap:6px;background:#14301b;
  color:#7fe09a;border:1px solid #245c37;border-radius:999px;
  padding:6px 12px;font-size:13px;font-weight:800;text-decoration:none;
  white-space:nowrap;letter-spacing:.2px}
a.tel:active{background:#1b3f25}
.ge-n a.tel,.ge-r a.tel{background:rgba(255,255,255,.16);color:#fff;
  border-color:rgba(255,255,255,.28)}
.ge-n a.tel{font-size:34px;padding:2px 14px;gap:10px}
.ge-n a.tel svg{width:22px;height:22px}
.gradio{font-size:11.5px;color:#7C5CBF;font-weight:700;border:1px solid #3A2F55;
  border-radius:999px;padding:5px 11px;background:#1A1526;white-space:nowrap}
.gfoot{margin-top:16px;font-size:11.5px;color:var(--mut);line-height:1.7;
  border-top:1px solid #232A34;padding-top:11px}
.gfoot span{display:block;margin-top:4px;color:#5C6572;font-size:10.5px}

/* ---- radio + gas ---- */
.rchs{border:1px solid #232A34;border-radius:14px;overflow:hidden}
.rch{display:flex;align-items:center;gap:12px;padding:9px 12px;
  border-bottom:1px solid #1B212A;background:#11151C}
.rch:last-child{border-bottom:0}
.rcn{flex:none;width:30px;height:30px;border-radius:9px;color:#fff;
  font-weight:800;font-size:15px;display:flex;align-items:center;
  justify-content:center}
.rct b{display:block;font-size:13.5px;color:#E6E9EE}
.rct span{display:block;font-size:11.5px;color:var(--mut);margin-top:1px}
.rstep{display:flex;gap:12px;padding:10px 2px;border-bottom:1px solid #1B212A}
.rstep:last-of-type{border-bottom:0}
.rstep>span{flex:none;width:26px;height:26px;border-radius:50%;
  background:var(--org);color:#fff;font-weight:800;font-size:13px;
  display:flex;align-items:center;justify-content:center}
/* only the STEP TITLE goes on its own line - a <b> inside the body
   text ("hold for 4 seconds") must stay inline */
.rstep>div>b:first-child{display:block;font-size:14px;color:#fff;
  margin-bottom:2px}
.rstep div b{display:inline;color:#fff}
.rstep div{font-size:12.5px;color:#C2C9D2;line-height:1.6}
.rlist{margin:0;padding-left:0;list-style:none}
.rlist li{position:relative;padding:8px 0 8px 26px;font-size:13px;
  color:#C2C9D2;border-bottom:1px solid #1B212A}
.rlist li:last-child{border-bottom:0}
.rlist li:before{content:'\\2713';position:absolute;left:2px;color:#3FB950;
  font-weight:800}
.rlight,.ralarm{display:flex;gap:11px;align-items:flex-start;padding:9px 2px;
  border-bottom:1px solid #1B212A}
.rlight:last-of-type,.ralarm:last-of-type{border-bottom:0}
.rlight>span,.ralarm>span{flex:none;width:13px;height:13px;border-radius:50%;
  margin-top:3px}
.rlight b,.ralarm b{color:#fff;font-size:13.5px;display:inline-block;
  margin-right:7px}
.rlight{font-size:12.5px;color:#C2C9D2}
.ralarm div{font-size:12.5px;color:#C2C9D2;line-height:1.6}
.ralarm>div>b:first-child{display:block;margin-bottom:2px}
.grds{display:flex;gap:8px}
.grd{flex:1;background:#11151C;border:1px solid #232A34;border-radius:12px;
  padding:10px 6px;text-align:center}
.grd b{display:block;font-size:12px;letter-spacing:.5px}
.grd span{display:block;font-size:19px;font-weight:800;color:#fff;margin-top:3px}

/* ---- scan ---- */
.idrow{display:flex;gap:8px}
.idrow input{flex:1;min-width:0}
.scanbtn[hidden]{display:none}
.scanbtn{flex:none;background:#151A22;border:1px solid #2A313C;color:#E6E9EE;
  border-radius:12px;padding:0 15px;cursor:pointer;font:inherit;
  display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:700}
.scanbtn:active{border-color:var(--org)}
.scanbtn svg{width:18px;height:18px;color:var(--org)}
.scanwrap{position:fixed;inset:0;background:#000;z-index:70;display:none;
  flex-direction:column}
.scanwrap.on{display:flex}
.scanwrap video{flex:1;width:100%;object-fit:cover}
.scanbar{padding:14px 16px;background:var(--org);display:flex;
  align-items:center;gap:12px;flex:none}
.scanbar b{flex:1;color:#fff;font-size:15px;font-weight:800}
.scanbar button{background:rgba(0,0,0,.22);border:0;color:#fff;font:inherit;
  font-size:13px;font-weight:700;border-radius:999px;padding:7px 15px}
.scanhint{position:absolute;left:0;right:0;bottom:0;padding:16px;
  text-align:center;color:#fff;font-size:13px;
  background:linear-gradient(0deg,rgba(0,0,0,.8),transparent)}
.scanbox{position:absolute;top:50%;left:50%;width:64vw;height:64vw;
  max-width:300px;max-height:300px;transform:translate(-50%,-56%);
  border:3px solid rgba(255,255,255,.9);border-radius:22px;
  box-shadow:0 0 0 100vmax rgba(0,0,0,.45)}

/* ---- THE FRONT PAGE, off the A3 poster (A. Fisher, 26 Jul 2026) ----
   MY GEAR huge, the six cabinets, the scan panel, the keypad. The
   poster on the store window and this page must read as one thing. */
.mgkick{font-size:12px;font-weight:800;letter-spacing:4px;color:#E6E9EE;
  text-transform:uppercase;margin:14px 0 6px;text-align:center}
h1.mg{text-align:center;font-size:56px}
.mgsub{text-align:center}
.cabs{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:16px 0 6px}
.cab{position:relative;background:linear-gradient(180deg,#151A22,#10141B);
  border:1px solid #2A313C;border-radius:12px;padding:16px 6px 12px;
  text-align:center;overflow:hidden}
.cab:before{content:"";position:absolute;top:0;left:14%;right:14%;height:3px;
  border-radius:0 0 4px 4px;background:linear-gradient(90deg,transparent,#F26222,transparent);
  box-shadow:0 2px 10px rgba(242,98,34,.55)}
.cab svg{width:30px;height:30px;color:var(--org);display:block;margin:0 auto 8px}
.cab b{display:block;font-size:9.5px;font-weight:800;letter-spacing:1.2px;
  color:#E6E9EE;text-transform:uppercase}
.idrow input{font-size:15px}
.idrow input::placeholder{font-size:12.5px;letter-spacing:2.5px;font-weight:700}
.scanpanel{position:relative;margin:12px 0 4px;background:#10141B;
  border:1px solid #2A313C;border-radius:16px;padding:18px 16px 20px;
  text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.scanpanel:active{border-color:var(--org)}
.scanpanel .crn{position:absolute;width:22px;height:22px;border:3px solid var(--org);
  filter:drop-shadow(0 0 6px rgba(242,98,34,.7))}
.scanpanel .c1{top:10px;left:10px;border-right:0;border-bottom:0;border-radius:6px 0 0 0}
.scanpanel .c2{top:10px;right:10px;border-left:0;border-bottom:0;border-radius:0 6px 0 0}
.scanpanel .c3{bottom:10px;left:10px;border-right:0;border-top:0;border-radius:0 0 0 6px}
.scanpanel .c4{bottom:10px;right:10px;border-left:0;border-top:0;border-radius:0 0 6px 0}
.sptitle{font-size:17px;font-weight:800;letter-spacing:2px;color:#fff;
  text-transform:uppercase}
.spsub{font-size:11.5px;color:var(--soft);margin:5px 0 12px}
/* the real barcode block - screen */
.bcwrap{display:flex;gap:10px;margin:14px 0 4px;flex-wrap:wrap}
.bcbox{flex:1 1 46%;min-width:150px;background:#fff;border-radius:10px;
  padding:9px 10px 7px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.bclab{font-size:8.5px;font-weight:900;letter-spacing:2px;color:#5B6472;
  text-transform:uppercase;margin-bottom:4px}
.bcnum{font-size:12.5px;font-weight:900;letter-spacing:2.5px;color:#101317;
  margin-top:3px;font-family:Consolas,ui-monospace,monospace}
.bcode{position:relative;height:64px;margin:0 22px;border-radius:4px;
  background:repeating-linear-gradient(90deg,
    #E6E9EE 0 2px,transparent 2px 5px,#E6E9EE 5px 6px,transparent 6px 11px,
    #E6E9EE 11px 15px,transparent 15px 18px,#E6E9EE 18px 19px,transparent 19px 26px);
  opacity:.85}
.bline{position:absolute;left:-12px;right:-12px;top:50%;height:3px;
  background:linear-gradient(90deg,transparent,#FF7A33,transparent);
  box-shadow:0 0 14px 3px rgba(242,98,34,.65);border-radius:2px;
  animation:scanln 2.6s ease-in-out infinite}
@keyframes scanln{0%,100%{transform:translateY(-20px)}50%{transform:translateY(20px)}}
/* MORE LIFE (Andrew, 26 Jul 2026): the page breathes. Corners pulse with
   the scan line, the panel glows like it wants to be used, and the big
   button carries a passing sheen - phone-friendly, all CSS, no jank. */
.scanpanel{animation:spglow 3.4s ease-in-out infinite}
@keyframes spglow{0%,100%{box-shadow:0 0 0 0 rgba(242,98,34,0)}
  50%{box-shadow:0 0 26px 2px rgba(242,98,34,.38)}}
.scanpanel .crn{animation:crnpulse 2.6s ease-in-out infinite}
@keyframes crnpulse{0%,100%{filter:drop-shadow(0 0 4px rgba(242,98,34,.5))}
  50%{filter:drop-shadow(0 0 12px rgba(255,140,60,.95))}}
.btn{position:relative;overflow:hidden}
.btn::after{content:"";position:absolute;top:0;bottom:0;width:46%;left:-60%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.34),transparent);
  animation:sheen 3.2s ease-in-out infinite}
@keyframes sheen{0%,55%{left:-60%}85%,100%{left:130%}}
.cab{animation:cabin .5s ease both}
.cab:nth-child(1){animation-delay:.05s}.cab:nth-child(2){animation-delay:.12s}
.cab:nth-child(3){animation-delay:.19s}.cab:nth-child(4){animation-delay:.26s}
.cab:nth-child(5){animation-delay:.33s}.cab:nth-child(6){animation-delay:.4s}
.cab:nth-child(7){animation-delay:.47s}.cab:nth-child(8){animation-delay:.54s}
@keyframes cabin{from{opacity:0;transform:translateY(10px) scale(.94)}
  to{opacity:1;transform:none}}
.cab svg{transition:transform .25s ease}
.cab:hover svg,.cab:active svg{transform:scale(1.18) rotate(-4deg)}
@media (prefers-reduced-motion: reduce){
  .scanpanel,.scanpanel .crn,.btn::after,.cab,.bline{animation:none}}

/* three actions on a phone: Save owns a full row, Print and Done share */
.actions{flex-wrap:wrap}
.actions button.primary{flex:1 1 100%}

/* ---- PRINT A4 - MY GEAR ACCOUNTABILITY REPORT ---------------------
   Print-only. This deliberately does not touch the live phone card, the
   scanner, the encrypted payload or any SiteIQ calculations. The report
   is allowed to run to a second page rather than crushing important text.
   Orange is supported, but hierarchy, borders and labels also work on the
   store's black-and-white printer. (A. Fisher print upgrade, 26 Jul 2026) */
#printsheet{display:none}
@media print{
  @page{size:A4 portrait;margin:7mm}
  html,body{background:#fff !important;margin:0 !important;width:auto !important}
  body > *{display:none !important}
  #printsheet{display:block !important;position:relative;color:#111;background:#fff;
    font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:9.4pt;line-height:1.42;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;padding:7mm 8mm 8mm}
  #printsheet *{box-sizing:border-box}

  /* restrained Coates frame repeats; the closing control line stays in flow
     so it can never cover or split an equipment row on an intermediate page */
  .pframe{position:fixed;z-index:0;top:0;left:0;right:0;bottom:0;
    border:1.4mm solid #F26222;border-top-width:4mm;border-radius:3.5mm;
    pointer-events:none}

  /* masthead and document control */
  .pmast{position:relative;z-index:1;display:grid;grid-template-columns:1fr 72mm;
    gap:6mm;align-items:stretch;padding-bottom:3.5mm;margin-bottom:4mm;
    border-bottom:1.1mm solid #111;break-inside:avoid;page-break-inside:avoid}
  .pbrand{display:flex;flex-direction:column;justify-content:flex-end}
  .pmg{font-size:31pt;font-weight:850;letter-spacing:-1px;line-height:.86;color:#111}
  .pmg b{color:#F26222}
  .pmk{font-size:7.5pt;font-weight:850;letter-spacing:3.2px;color:#555;
    text-transform:uppercase;margin-top:2.2mm}
  .preporttitle{font-size:9.2pt;font-weight:850;letter-spacing:1.5px;color:#111;
    text-transform:uppercase;margin-top:2.5mm}
  .pdoc{border:.45mm solid #B9B9B9;border-top:1.3mm solid #F26222;
    border-radius:2.4mm;background:#F5F5F5;padding:2.6mm 3mm;display:grid;
    grid-template-columns:1fr 1fr;gap:1.5mm 3mm}
  .pdoc .pdl{font-size:5.9pt;font-weight:850;letter-spacing:1.15px;color:#777;
    text-transform:uppercase;display:block}
  .pdoc .pdv{font-size:7.5pt;font-weight:750;color:#111;display:block;margin-top:.25mm;
    overflow-wrap:anywhere}
  .pdoc .pstatusstamp{grid-column:1/-1;display:flex;align-items:center;
    justify-content:space-between;gap:3mm;border-radius:1.7mm;padding:1.8mm 2.4mm;
    background:#111;color:#fff;font-size:7.2pt;font-weight:850;
    letter-spacing:1.5px;text-transform:uppercase}
  .pdoc .pstatusstamp.open{border-left:1.4mm solid #F26222}
  .pdoc .pstatusstamp.cleared{border-left:1.4mm solid #111;background:#E9E9E9;color:#111}
  .pdoc .pstatusstamp b{font-size:9pt;color:#F26222}
  .pdoc .pstatusstamp.cleared b{color:#111}

  /* person and report identity */
  .pidentity{position:relative;z-index:1;display:grid;
    grid-template-columns:2fr .8fr 1.25fr 1.05fr;border:.45mm solid #BDBDBD;
    border-radius:2.3mm;overflow:hidden;background:#fff;margin-bottom:4mm;
    break-inside:avoid;page-break-inside:avoid}
  .pfield{padding:2.4mm 3mm;border-left:.35mm solid #D2D2D2;min-width:0}
  .pfield:first-child{border-left:0;border-top:.9mm solid #F26222}
  .pfield:not(:first-child){border-top:.9mm solid #111}
  .pfield i{display:block;font-style:normal;font-size:5.9pt;font-weight:850;
    letter-spacing:1.25px;color:#777;text-transform:uppercase}
  .pfield b{display:block;font-size:10.2pt;color:#111;margin-top:.55mm;
    overflow-wrap:anywhere;line-height:1.22}
  .pfield.big b{font-size:14pt;letter-spacing:-.2px}

  /* top status / score */
  .poverview{position:relative;z-index:1;display:grid;grid-template-columns:1.45fr .55fr;
    gap:4mm;margin-bottom:3.2mm;break-inside:avoid;page-break-inside:avoid}
  .pstate{position:relative;border:.45mm solid #B9B9B9;border-radius:2.5mm;
    padding:3.4mm 4mm 3.4mm 5mm;background:#F6F6F6;overflow:hidden}
  .pstate:before{content:'';position:absolute;left:0;top:0;bottom:0;width:1.6mm;
    background:#F26222}
  .pstate.cleared:before{background:#111}
  .pstate .pkicker{font-size:6.2pt;font-weight:850;letter-spacing:1.8px;color:#777;
    text-transform:uppercase}
  .pstate .pstatehead{font-size:17pt;font-weight:900;line-height:1.08;color:#111;
    margin-top:1mm;letter-spacing:-.25px}
  .pstate .pstatecopy{font-size:8pt;color:#555;margin-top:1.5mm;line-height:1.5}
  .pstate .pstatecopy b{color:#111}
  .pscore{border-radius:2.5mm;background:#111;color:#fff;padding:3mm 3.5mm;
    display:flex;flex-direction:column;justify-content:center;text-align:center;
    border-top:1.3mm solid #F26222}
  .pscore .plab{font-size:6.2pt;font-weight:850;letter-spacing:1.7px;
    text-transform:uppercase;color:#D6D6D6}
  .pscore .pvalue{font-size:28pt;font-weight:900;line-height:1;color:#fff;
    margin:1.2mm 0 .5mm}
  .pscore .pvalue span{font-size:9pt;color:#F26222;margin-left:.7mm}
  .pscore .prank{font-size:6.9pt;color:#D6D6D6;line-height:1.45}

  /* KPI row */
  .pnums{position:relative;z-index:1;display:grid;grid-template-columns:repeat(5,1fr);
    gap:2.2mm;margin-bottom:3.5mm;break-inside:avoid;page-break-inside:avoid}
  .pn1{border:.4mm solid #BDBDBD;border-top:1.1mm solid #111;border-radius:2mm;
    text-align:center;padding:2.6mm 1.3mm 2.2mm;background:#fff;min-width:0}
  .pn1.accent{border-top-color:#F26222;background:#FBF5F2}
  .pn1.good{border-top-color:#111;background:#F3F3F3}
  .pn1.warn{border-top-color:#F26222;background:#F4F4F4}
  .pn1 b{display:block;font-size:16pt;font-weight:900;color:#111;line-height:1}
  .pn1 span{display:block;font-size:5.5pt;font-weight:850;letter-spacing:.85px;
    color:#666;text-transform:uppercase;margin-top:1.3mm;line-height:1.25}
  .pn1 em{display:block;font-style:normal;font-size:5.6pt;color:#888;margin-top:.8mm}

  /* section titles */
  .psect{position:relative;z-index:1;display:flex;align-items:baseline;gap:2.3mm;
    font-size:8.1pt;font-weight:900;letter-spacing:1.8px;color:#111;
    text-transform:uppercase;border-bottom:.55mm solid #111;padding-bottom:1.4mm;
    margin:5mm 0 2.5mm;break-after:avoid;page-break-after:avoid}
  .psect:before{content:'';flex:none;width:4mm;height:2.2mm;background:#F26222}
  .psect strong{font-size:6pt;color:#777;letter-spacing:1px}
  .psect span{margin-left:auto;font-size:6.1pt;letter-spacing:.7px;color:#666;
    font-weight:750;text-transform:none;text-align:right}

  /* age, comparison and mix panels */
  .pinsightgrid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;
    gap:3mm;break-inside:avoid;page-break-inside:avoid}
  .pmini{border:.4mm solid #C3C3C3;border-radius:2.2mm;padding:2.7mm 3mm;background:#fff}
  .pminih{font-size:6.2pt;font-weight:900;letter-spacing:1.25px;color:#555;
    text-transform:uppercase;margin-bottom:2mm}
  .pagechips{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5mm}
  .pagechip{border:.35mm solid #BEBEBE;border-radius:1.6mm;padding:1.8mm 1mm;
    text-align:center;background:#F7F7F7}
  .pagechip b{display:block;font-size:13pt;color:#111;line-height:1}
  .pagechip span{display:block;font-size:5.4pt;font-weight:850;letter-spacing:.7px;
    color:#666;text-transform:uppercase;margin-top:.8mm}
  .pagechip.priority{border-top:1mm solid #F26222}
  .pagechip.attention{border-top:1mm solid #777}
  .pagechip.current{border-top:1mm solid #111}
  .pcmp{display:flex;flex-direction:column;gap:1.4mm}
  .pcmprow{display:grid;grid-template-columns:22mm 1fr 10mm;gap:2mm;align-items:center}
  .pcmpl{font-size:6.4pt;font-weight:750;color:#555}
  .pcmptrack{height:3.2mm;border:.35mm solid #C7C7C7;border-radius:2mm;
    background:#EFEFEF;overflow:hidden}
  .pcmpfill{display:block;height:100%;background:#777}
  .pcmpfill.me{background:#F26222}
  .pcmpv{text-align:right;font-size:7pt;font-weight:850;color:#111}
  .pmix{display:flex;flex-wrap:wrap;gap:1.4mm;margin-top:2.2mm}
  .pmix span{display:inline-flex;align-items:center;gap:1.2mm;border:.35mm solid #BFBFBF;
    border-radius:99px;padding:1mm 2mm;font-size:6.1pt;font-weight:750;color:#333}
  .pmix i{display:inline-block;width:2.3mm;height:2.3mm;border-radius:50%;background:#111}

  /* urgent action cards */
  .palerts{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,1fr);
    gap:2.2mm;margin-top:3mm;break-inside:avoid;page-break-inside:avoid}
  .palert{border:.45mm solid #B8B8B8;border-left:1.4mm solid #111;
    border-radius:2mm;padding:2.5mm 3mm;background:#F7F7F7;min-height:15mm}
  .palert.critical{border-left-color:#F26222;background:#FBF3EF}
  .palert.good{border-left-color:#111;background:#F0F0F0}
  .palert .pat{font-size:5.8pt;font-weight:900;letter-spacing:1.25px;color:#777;
    text-transform:uppercase}
  .palert b{display:block;font-size:10pt;color:#111;margin-top:.65mm;line-height:1.15}
  .palert span{display:block;font-size:7pt;color:#555;margin-top:.8mm;line-height:1.4}

  /* shutdown story */
  .pstory{position:relative;z-index:1;border-left:1.2mm solid #F26222;
    background:#F5F5F5;padding:2.6mm 3.5mm;margin-top:3mm;border-radius:0 2mm 2mm 0;
    font-size:7.4pt;color:#444;line-height:1.55;break-inside:avoid;page-break-inside:avoid}
  .pstory b{color:#111}

  /* equipment register */
  table.pt{position:relative;z-index:1;width:100%;border-collapse:collapse;
    table-layout:fixed;margin-top:.5mm}
  .pt thead{display:table-header-group}
  .pt th{font-size:6.2pt;font-weight:900;letter-spacing:.8px;color:#fff;
    background:#111;text-transform:uppercase;text-align:left;padding:1.8mm 1.8mm;
    border-right:.25mm solid #555;line-height:1.2}
  .pt .pcont th{background:#F26222;padding:1.25mm 1.8mm;font-size:5.65pt;
    letter-spacing:.8px;color:#fff;border-right:0}
  .pcontline{display:flex;justify-content:space-between;gap:5mm;align-items:center}
  .pcontline span{font-weight:800;min-width:0;overflow-wrap:anywhere}
  .pcontline b{font-size:5.65pt;letter-spacing:1.1px;white-space:nowrap}
  .pt th:last-child{border-right:0}
  .pt th.r{text-align:right}
  .pt td{font-size:8.15pt;color:#222;padding:1.45mm 1.8mm;
    border-bottom:.3mm solid #C9C9C9;vertical-align:top;overflow-wrap:anywhere}
  .pt tr{page-break-inside:avoid;break-inside:avoid}
  .pt tbody tr:nth-child(even) td{background:#F6F6F6}
  .pt tbody tr.prow-due td:first-child{border-left:1.1mm solid #F26222}
  .pt tbody tr.prow-priority td:first-child{border-left:1.1mm solid #111}
  .pt tbody tr.prow-attention td:first-child{border-left:1.1mm solid #888}
  .pcheckcell{text-align:center}
  .pbox{display:inline-block;width:4mm;height:4mm;border:.45mm solid #111;
    border-radius:.7mm;margin-top:.4mm;background:#fff}
  .pdesc{font-size:8.45pt;font-weight:750;color:#111;line-height:1.3}
  .pcat{display:inline-block;margin-top:.7mm;border:.3mm solid #AAA;border-radius:99px;
    padding:.35mm 1.4mm;font-size:5.2pt;font-weight:850;letter-spacing:.65px;
    color:#555;text-transform:uppercase;background:#fff}
  .passet b{display:block;font-size:8pt;color:#111;white-space:nowrap}
  .passet span{display:block;font-size:6.3pt;color:#666;margin-top:.7mm}
  .passet .ppid{display:inline-block;border:.35mm solid #F26222;border-radius:99px;
    padding:.25mm 1.4mm;color:#111;font-weight:850;background:#fff}
  .preq{font-size:7.1pt !important;color:#4D4D4D !important;line-height:1.45}
  .pdue{display:inline-block;border:.4mm solid #111;border-left:1.1mm solid #F26222;
    border-radius:1.3mm;padding:.35mm 1.3mm;margin:0 .8mm .7mm 0;font-size:5.5pt;
    font-weight:900;letter-spacing:.55px;color:#111;background:#fff;white-space:nowrap}
  .pquiet{color:#999;font-style:italic}
  .pagecell{text-align:right;white-space:nowrap}
  .pagecell b{display:block;font-size:8.3pt;color:#111}
  .pagebadge{display:inline-block;margin-top:.7mm;border:.35mm solid #AAA;
    border-radius:99px;padding:.35mm 1.2mm;font-size:5pt;font-weight:900;
    letter-spacing:.5px;color:#555;text-transform:uppercase;background:#fff}
  .pagebadge.due{border-color:#F26222;color:#111}
  .pagebadge.priority{border-color:#111;color:#111}
  .pt .pempty{text-align:center;font-weight:750;padding:7mm;color:#444}
  .pt.small th{font-size:6pt}
  .pt.small td{font-size:7.8pt}

  /* activity / issued support equipment */
  .pactivity{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);
    gap:2mm;break-inside:avoid;page-break-inside:avoid}
  .pact{border:.4mm solid #BEBEBE;border-radius:1.8mm;padding:2.3mm 1.5mm;
    text-align:center;background:#F7F7F7}
  .pact b{display:block;font-size:14pt;line-height:1;color:#111}
  .pact span{display:block;font-size:5.4pt;font-weight:850;letter-spacing:.75px;
    color:#666;text-transform:uppercase;margin-top:1.1mm}
  .pdetailgrid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;
    gap:3mm;margin-top:2.5mm;break-inside:avoid;page-break-inside:avoid}
  .pdetail{border:.4mm solid #C2C2C2;border-radius:2mm;overflow:hidden;background:#fff}
  .pdetailh{background:#111;color:#fff;padding:1.6mm 2.5mm;font-size:6.2pt;
    font-weight:900;letter-spacing:1.1px;text-transform:uppercase}
  .pdetailrow{display:grid;grid-template-columns:1fr auto;gap:3mm;padding:1.5mm 2.5mm;
    border-bottom:.3mm solid #D4D4D4;font-size:7pt;color:#444}
  .pdetailrow:last-child{border-bottom:0}
  .pdetailrow b{color:#111;text-align:right}

  /* responsibilities, clearance and signatures */
  .presponsibility{position:relative;z-index:1;display:grid;grid-template-columns:1.1fr .9fr;
    gap:3mm;break-inside:avoid;page-break-inside:avoid}
  .presbox{border:.45mm solid #BEBEBE;border-radius:2mm;padding:2.7mm 3mm;background:#F7F7F7}
  .presbox h4{font-size:6.2pt;font-weight:900;letter-spacing:1.15px;color:#555;
    text-transform:uppercase;margin:0 0 1.7mm}
  .presline{display:flex;justify-content:space-between;gap:4mm;padding:1mm 0;
    border-bottom:.3mm solid #D5D5D5;font-size:7pt;color:#555}
  .presline:last-child{border-bottom:0}
  .presline b{color:#111;white-space:nowrap}
  .pnote2{font-size:7pt;color:#4F4F4F;line-height:1.55}
  .pnote2 b{color:#111}
  .pclearance{position:relative;z-index:1;display:flex;align-items:center;gap:4mm;
    border:.55mm solid #111;border-left:2mm solid #F26222;border-radius:2.5mm;
    padding:3mm 3.5mm;margin-top:4mm;background:#F5F5F5;
    break-inside:avoid;page-break-inside:avoid}
  .pclearance.cleared{border-left-color:#111;background:#EDEDED}
  .pclearbadge{flex:none;min-width:28mm;text-align:center;background:#111;color:#fff;
    border-radius:1.7mm;padding:2.2mm 2mm;font-size:8.2pt;font-weight:900;
    letter-spacing:1.2px;text-transform:uppercase}
  .pclearance.open .pclearbadge{border-bottom:1.2mm solid #F26222}
  .pclearance.cleared .pclearbadge{background:#fff;color:#111;border:.45mm solid #111}
  .pcleartext b{display:block;font-size:11pt;color:#111}
  .pcleartext span{display:block;font-size:7pt;color:#555;margin-top:.8mm;line-height:1.45}
  .pclearfine{display:block;font-size:5.8pt;color:#666;margin-top:.9mm;
    line-height:1.35;font-weight:650}
  /* Replacement money wears the highlighter on paper too - the elite
     document rule (Andrew, 26 Jul 2026). */
  .prepl{background:#EFFF3D;color:#101317;font-weight:850;border-radius:1mm;
    padding:0 1.1mm;white-space:nowrap}
  /* both barcodes on the printed A4 - scan the sheet at the counter */
  .bcwrap{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:3mm 0 0;
    break-inside:avoid;page-break-inside:avoid}
  .bcbox{border:.4mm solid #999;border-radius:2mm;padding:2mm 3mm 1.6mm;
    text-align:center;background:#fff}
  .bclab{font-size:6pt;font-weight:900;letter-spacing:1.6px;color:#666;
    text-transform:uppercase}
  .bcnum{font-size:9.5pt;font-weight:900;letter-spacing:2px;color:#111;
    margin-top:.8mm;font-family:Consolas,monospace}
  .bc39{height:13mm !important}
  .preplq{color:#8a8f98;font-weight:650}
  .pn1.rex b{background:#EFFF3D;color:#101317;border-radius:1mm;padding:0 1.4mm}
  .pteamline{position:relative;z-index:1;margin-top:2.6mm;padding-top:1.8mm;
    border-top:.35mm solid #ddd;font-size:6.2pt;color:#555;line-height:1.6}
  .pteamline b{color:#111}
  .pteamline i{font-style:normal;color:#C25200;font-weight:850}
  .psign{position:relative;z-index:1;display:grid;grid-template-columns:1.25fr 1.25fr .7fr;
    gap:3mm;margin-top:3mm;break-inside:avoid;page-break-inside:avoid}
  .ps1{border:.45mm solid #999;border-radius:2mm;padding:2.3mm 2.7mm;background:#fff}
  .ps1 i{display:block;font-style:normal;font-size:5.7pt;font-weight:900;
    letter-spacing:1px;color:#777;text-transform:uppercase}
  .ps1 span{display:block;height:9mm;border-bottom:.4mm solid #333;margin-top:1mm}
  /* density changes are modest: readability wins over forcing one page */
  #printsheet.pcompact .pt td{font-size:7.7pt;padding:1.25mm 1.55mm}
  #printsheet.pcompact .pdesc{font-size:8pt}
  #printsheet.pdense .pt td{font-size:7.15pt;padding:1.05mm 1.35mm}
  #printsheet.pdense .pt th{font-size:5.7pt;padding:1.5mm 1.35mm}
  #printsheet.pdense .pdesc{font-size:7.5pt}
  #printsheet.pdense .preq{font-size:6.55pt !important}
}
"""

#  The landing-page ID row: type it, or let the camera do it.
ID_ROW = """<div class="idrow">
<input id="idno" autocomplete="off" autocapitalize="characters"
 autocorrect="off" spellcheck="false" placeholder="ENTER ID NUMBER">
<button class="scanbtn" id="scanbtn" onclick="startScan()" type="button" hidden>
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
 stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3M7 12h10"/></svg>Scan</button>
</div>"""

JS = r"""
/* ------------------------------------------------------------------
   SAVE TO MY PHONE - not print.
   Wraps the card as a small self-contained page and hands it to the
   phone's own share sheet (Save to Files, Photos, message it to
   yourself). Where that isn't available it just downloads. Printing is
   still one tap away for anyone who wants paper.
------------------------------------------------------------------ */
function cardFile(){
  var card=document.getElementById('result').innerHTML;
  var css=document.querySelector('style').textContent;
  var html='<!doctype html><html lang="en"><head><meta charset="utf-8">'
    +'<meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<title>My Gear - Coates K2</title><style>'+css
    +'body{background:#0A0E14}.actions,.gshelf,.gsheet,.scanwrap,.qstack{display:none!important}'
    +'</style></head><body><div class="wrap"><div class="card" '
    +'style="display:block">'+card+'</div></div></body></html>';
  return new File([html],'My Gear - Coates K2.html',{type:'text/html'});
}
/* SAVE AS A PICTURE (Andrew, 29 Jul 2026: "ensure workers have the
   option to save their onhire report as a image").
   The picture is DRAWN onto a canvas from the decoded payload, not
   screenshotted from the page - a drawn report cannot inherit a layout
   bug, cannot catch a button mid-animation, and needs no library. It
   comes out as a PNG the phone treats like any photo. */
function drawPic(){
  var p=window.LASTP; if(!p) return null;
  var items=p.items||[], st=p.stats||{};
  var W=1000,pad=52,rowH=66,S=2;
  var mons=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var t=new Date(),asof=t.getDate()+' '+mons[t.getMonth()]+' '+t.getFullYear();
  var listH=items.length?items.length*rowH:64;
  var H=286+128+34+listH+120;
  var c=document.createElement('canvas');
  c.width=W*S; c.height=H*S;
  var x=c.getContext('2d'); x.scale(S,S);
  function rr(x0,y0,w,h,r){x.beginPath();x.moveTo(x0+r,y0);
    x.arcTo(x0+w,y0,x0+w,y0+h,r);x.arcTo(x0+w,y0+h,x0,y0+h,r);
    x.arcTo(x0,y0+h,x0,y0,r);x.arcTo(x0,y0,x0+w,y0,r);x.closePath();}
  function trunc(s,max){ if(x.measureText(s).width<=max) return s;
    while(s.length>1 && x.measureText(s+'…').width>max) s=s.slice(0,-1);
    return s+'…'; }
  var F='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  x.fillStyle='#0A0E14'; x.fillRect(0,0,W,H);
  var g=x.createLinearGradient(0,0,W,0);
  g.addColorStop(0,'#F26222'); g.addColorStop(1,'#C44C28');
  x.fillStyle=g; x.fillRect(0,0,W,10);
  x.fillStyle='#fff'; x.font='800 30px '+F; x.fillText('COATES',pad,66);
  x.fillStyle='#F26222'; x.fillText('.',pad+x.measureText('COATES').width+2,66);
  x.fillStyle='#8A97A8'; x.font='700 13px '+F; x.textAlign='right';
  x.fillText('POWERED BY SITEIQ',W-pad,52);
  x.fillText('Cement Australia K2 · Gladstone',W-pad,72);
  x.textAlign='left';
  x.fillStyle='#fff'; x.font='800 54px '+F; x.fillText('MY',pad,140);
  x.fillStyle='#F26222'; x.fillText('GEAR',pad+x.measureText('MY').width+16,140);
  x.fillStyle='#EAEDF1'; x.font='700 24px '+F;
  x.fillText(trunc(String(p.name||''),W-2*pad),pad,186);
  x.fillStyle='#8A97A8'; x.font='500 17px '+F;
  x.fillText(trunc(String(p.company||'')+'  ·  ID '+String(p.id||''),W-2*pad),pad,214);
  if(p.hasReturns){
    var sc='Returns Score '+(Number(p.score)||0);
    x.font='800 15px '+F;
    var scw=x.measureText(sc).width+34;
    x.fillStyle='#F26222'; rr(pad,236,scw,36,18); x.fill();
    x.fillStyle='#fff'; x.fillText(sc,pad+17,260);
  }
  var boxes=[[String(st.items||0),'ITEMS OUT','#EFFF3D'],
             [String(st.returned||0),'RETURNED','#35D68A'],
             [String(st.sameday||0),'SAME-DAY','#35D68A']];
  var bw=(W-2*pad-2*14)/3, by=292;
  boxes.forEach(function(b,i){
    var bx=pad+i*(bw+14);
    x.fillStyle='#151A22'; rr(bx,by,bw,104,14); x.fill();
    x.strokeStyle='#2A3340'; x.lineWidth=1; rr(bx,by,bw,104,14); x.stroke();
    x.fillStyle=b[2]; x.font='800 36px '+F; x.textAlign='center';
    x.fillText(b[0],bx+bw/2,by+50);
    x.fillStyle='#8A97A8'; x.font='800 12px '+F;
    x.fillText(b[1],bx+bw/2,by+80); x.textAlign='left';
  });
  var y=by+104+44;
  x.fillStyle='#F26222'; x.fillRect(pad,y-15,3,18);
  x.fillStyle='#EAEDF1'; x.font='800 16px '+F;
  x.fillText('GEAR ON HIRE IN YOUR NAME',pad+12,y); y+=18;
  if(!items.length){
    x.fillStyle='#35D68A'; x.font='700 18px '+F;
    x.fillText('✓  Nothing on hire — fully cleared. Legend.',pad,y+38);
    y+=64;
  }
  items.forEach(function(it){
    var d=parseInt(it.days), late=!isNaN(d)&&d>4, mid=!isNaN(d)&&d>2&&!late;
    x.fillStyle='#151A22'; rr(pad,y+8,W-2*pad,rowH-14,12); x.fill();
    x.fillStyle=isNaN(d)?'#8A97A8':(late?'#FF5A4D':(mid?'#F0B429':'#35D68A'));
    x.beginPath(); x.arc(pad+26,y+8+(rowH-14)/2,7,0,7); x.fill();
    x.fillStyle='#EAEDF1'; x.font='700 17px '+F;
    x.fillText(trunc(String(it.d||''),W-2*pad-170),pad+48,y+34);
    x.fillStyle='#8A97A8'; x.font='500 13px '+F;
    x.fillText(trunc('Item '+String(it.n||''),W-2*pad-170),pad+48,y+56);
    x.textAlign='right';
    x.fillStyle=isNaN(d)?'#8A97A8':(late?'#FF5A4D':(mid?'#F0B429':'#35D68A'));
    x.font='800 20px '+F;
    x.fillText(isNaN(d)?'—':d+'d',W-pad-22,y+42);
    x.textAlign='left';
    y+=rowH;
  });
  y+=34;
  x.strokeStyle='#2A3340'; x.beginPath(); x.moveTo(pad,y); x.lineTo(W-pad,y); x.stroke();
  x.fillStyle='#8A97A8'; x.font='500 13px '+F; x.textAlign='center';
  x.fillText('As at '+asof+'  ·  updated each morning  ·  POWERED BY SITEIQ',W/2,y+30);
  x.fillText('Author: Andrew Fisher',W/2,y+52);
  x.textAlign='left';
  return c;
}
function saveCard(){
  var c=null;
  try{ c=drawPic(); }catch(e){ c=null; }
  if(c && c.toBlob){
    c.toBlob(function(b){
      if(!b){ saveCardHtml(); return; }
      var f=new File([b],'My Gear - Coates K2.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[f]}) && navigator.share){
        navigator.share({files:[f],title:'My Gear - Coates K2'})
          .catch(function(){ downloadCard(f); });
      }else{ downloadCard(f); }
    },'image/png');
    return;
  }
  saveCardHtml();
}
/* the old HTML-file save stays as the fallback for any browser whose
   canvas is crippled - a worker always gets SOMETHING saved */
function saveCardHtml(){
  var f;
  try{ f=cardFile(); }catch(e){ window.print(); return; }
  if(navigator.canShare && navigator.canShare({files:[f]}) && navigator.share){
    navigator.share({files:[f],title:'My Gear - Coates K2'})
      .catch(function(){ downloadCard(f); });
    return;
  }
  downloadCard(f);
}
function downloadCard(f){
  try{
    var u=URL.createObjectURL(f), a=document.createElement('a');
    a.href=u; a.download=f.name; document.body.appendChild(a); a.click();
    setTimeout(function(){URL.revokeObjectURL(u);a.remove();},1500);
  }catch(e){ window.print(); }
}

/* ------------------------------------------------------------------
   THE SITE GUIDES - contact board, radio, gas monitor
------------------------------------------------------------------ */
var GUIDE_TITLES={contacts:'Contact board',radio:'Your two-way radio',
                  gas:'Your gas monitor',store:"What's in the store"};
/* THE ROLLER DOOR (Andrew's own pack, 2 Aug 2026).
   Rules it obeys, in order of importance:
     1. It can never trap anybody. A missing image, a second tap, Escape,
        the skip button or a slow phone all end with the store open.
     2. It plays EVERY time the store is opened (Andrew's call, 2 Aug 2026).
        No once-a-session latch, no memory of a skip - every tap on the
        store card runs the door. SKIP OPENING and Escape are there on
        every single run for the bloke hunting a socket at 3am.
     3. A phone set to reduce motion never sees it.
   DW_DEAD is the broken-artwork latch and nothing else - a shutter image
   that failed to load will still be missing on the next tap, so once it
   has bailed it stops trying and just opens the store. */
var DW_DEAD=false, DW_BUSY=false, DW_T=null, DW_MS=6800;
function dwCan(){
  try{
    if(DW_DEAD||DW_BUSY) return false;
    if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)
      return false;
  }catch(e){}
  return !!document.getElementById('doorway');
}
function dwBail(){ DW_DEAD=true; dwEnd(); }
function dwSkip(){ dwEnd(); }
function dwEnd(){
  var d=document.getElementById('doorway');
  if(DW_T){clearTimeout(DW_T);DW_T=null}
  if(d) d.className='dw';
  DW_BUSY=false;
  openStoreNow();
}
function dwPlay(){
  var d=document.getElementById('doorway');
  if(!d){ openStoreNow(); return; }
  DW_BUSY=true;
  d.className='dw on';
  void d.offsetWidth;          // restart the animation cleanly
  d.className='dw on run';
  DW_T=setTimeout(dwEnd, DW_MS+120);
}
function openStoreNow(){
  var p=document.getElementById('g-store');
  if(p) p.className='gpane on';
  var ttl=document.getElementById('gsheet-title');
  if(ttl) ttl.textContent=(GUIDE_TITLES&&GUIDE_TITLES.store)||'The store';
  var sh=document.getElementById('gsheet');
  if(sh) sh.className='gsheet on';
  var bd=document.getElementById('gsbody'); if(bd) bd.scrollTop=0;
  document.body.style.overflow='hidden';
  if(typeof stRender==='function') stRender(true);
  if(history&&history.pushState) history.pushState({guide:'store'},'');
}
document.addEventListener('keydown',function(e){
  if(DW_BUSY&&(e.key==='Escape'||e.keyCode===27)) dwSkip();
});

function openGuide(k){
  /* the store gets the roller door, every single time */
  if(k==='store'&&dwCan()){
    var p0=document.querySelectorAll('.gpane');
    for(var z=0;z<p0.length;z++) p0[z].className='gpane';
    dwPlay(); return;
  }
  var panes=document.querySelectorAll('.gpane');
  for(var i=0;i<panes.length;i++) panes[i].className='gpane';
  var p=document.getElementById('g-'+k); if(p) p.className='gpane on';
  document.getElementById('gsheet-title').textContent=GUIDE_TITLES[k]||'Guide';
  document.getElementById('gsheet').className='gsheet on';
  document.getElementById('gsbody').scrollTop=0;
  document.body.style.overflow='hidden';
  /* the store screen paints its list the first time it is opened, and
     puts the cursor nowhere - a keyboard flying up in a bloke's face
     before he has even looked at the aisles is not helpful */
  if(k==='store' && typeof stRender==='function') stRender(true);
  if(history&&history.pushState) history.pushState({guide:k},'');
}
function closeGuide(){
  document.getElementById('gsheet').className='gsheet';
  document.body.style.overflow='';
}
window.addEventListener('popstate',function(){
  if(document.getElementById('gsheet').className.indexOf('on')>=0) closeGuide();
});

/* ------------------------------------------------------------------
   CAN THIS PHONE ACTUALLY USE THE CAMERA?
   Browsers only hand over the camera on a SECURE origin - https, or the
   phone's own localhost. The K2 tool store network has no internet and
   serves this page over plain http, so the camera is refused the instant
   it is asked for. That is what made the scanner flick on and straight
   back off. (A. Fisher, 25 Jul 2026)

   So the button is HIDDEN unless the camera can genuinely work. A button
   that cannot do its job has no business being on the page - the crews
   scan the QR on the window poster or their card with the phone's own
   camera app instead, which has no such restriction, and the ?id= link
   below opens their gear straight up.
------------------------------------------------------------------ */
/* Show any scan control on the page - called after a card renders so
   the button that lives ON the card gets the same treatment as the one
   on the landing page. */
function revealScanControls(){
  try{
    var ok = camPossible();
    ['scanbtn','cardscan'].forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      if(ok){ el.removeAttribute('hidden'); } else { el.setAttribute('hidden',''); }
    });
  }catch(e){}
}

function camPossible(){
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) return false;
    if(window.isSecureContext) return true;
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }catch(e){ return false; }
}
(function(){
  try{
    var b=document.getElementById('scanbtn');
    if(b && camPossible()){ b.removeAttribute('hidden'); }
    if(b && !camPossible()){
      var h=document.getElementById('scanhelp');
      if(h) h.textContent='Point your phone camera at the QR on the window '
        + 'or your card — it opens your gear straight up.';
    }
    /* The big SCAN panel on the landing page: a camera when the phone
       allows one, and an honest signpost to the keypad when it doesn't
       (the store wifi has no internet, so browsers refuse the camera -
       the panel must never open a scanner that instantly dies). */
    var sp=document.getElementById('scanpanel');
    var cap=document.getElementById('scancap');
    if(sp){
      if(camPossible()){
        sp.addEventListener('click',startScan);
      }else{
        if(cap) cap.textContent='No camera on this connection — type your number below';
        sp.addEventListener('click',function(){
          var i=document.getElementById('idno');
          if(i){ i.focus(); }
        });
      }
    }
  }catch(e){}
})();

/* ------------------------------------------------------------------
   SCAN MY CARD
   Uses the phone's own BarcodeDetector when it has one (Android), and
   the bundled decoder when it doesn't (iPhone). Same button either way.
------------------------------------------------------------------ */
var _scanStream=null,_scanRAF=null,_scanDet=null,_scanCv=null;
function idFromScan(txt){
  /* IDs are not always pure digits - 18479CEM and 10005013CEM are real
     cards on this job (caught 29 Jul 2026: "some people do have
     letters in their barcode"). Accept an alphanumeric token, but
     require at least three digits in it so a stray word on a label
     never reads as an ID. */
  if(!txt) return '';
  var m=String(txt).match(/(?:[?&]id=)([A-Za-z0-9]{3,})/i); // a My Gear link
  if(m) return m[1];
  var toks=String(txt).match(/[A-Za-z0-9]{4,}/g)||[];
  var best='';
  for(var i=0;i<toks.length;i++){
    var digits=(toks[i].match(/\d/g)||[]).length;
    if(digits>=3 && toks[i].length>best.length) best=toks[i];
  }
  return best;
}
function startScan(){
  var w=document.getElementById('scanwrap');
  var v=document.getElementById('scanvid');
  if(!camPossible()){
    scanFail('The tool store network has no internet, and phones only allow '
             +'the camera on a secure connection. Point your phone camera at '
             +'the QR on the window instead, or type your number in.');
    return;
  }
  w.className='scanwrap on';
  document.getElementById('scanhint').textContent='Hold your card steady in the frame';
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}})
   .then(function(s){
      _scanStream=s; v.srcObject=s; v.setAttribute('playsinline','');
      v.play();
      if('BarcodeDetector' in window){
        try{ _scanDet=new window.BarcodeDetector({formats:['qr_code']}); }
        catch(e){ _scanDet=null; }
      }
      _scanCv=document.createElement('canvas');
      _scanRAF=requestAnimationFrame(scanTick);
   })
   .catch(function(){
      scanFail('Camera access was blocked. Allow the camera for this page, '
               +'or just type the number off your card.');
   });
}
function scanFail(msg){
  stopScan();
  var e=document.getElementById('err'); if(e) e.textContent=msg;
}
function scanTick(){
  var v=document.getElementById('scanvid');
  if(!_scanStream||!v||v.readyState<2){ _scanRAF=requestAnimationFrame(scanTick); return; }
  var done=function(txt){
    var id=idFromScan(txt);
    if(id){ stopScan(); document.getElementById('idno').value=id; go(); return true; }
    return false;
  };
  if(_scanDet){
    _scanDet.detect(v).then(function(codes){
      if(codes&&codes.length&&done(codes[0].rawValue)) return;
      _scanRAF=requestAnimationFrame(scanTick);
    }).catch(function(){ _scanDet=null; _scanRAF=requestAnimationFrame(scanTick); });
    return;
  }
  if(typeof jsQR==='function'){
    var w=Math.min(v.videoWidth,640);
    if(w>0){
      var h=Math.round(v.videoHeight*(w/v.videoWidth));
      _scanCv.width=w; _scanCv.height=h;
      var cx=_scanCv.getContext('2d',{willReadFrequently:true});
      cx.drawImage(v,0,0,w,h);
      try{
        var d=cx.getImageData(0,0,w,h);
        var r=jsQR(d.data,w,h,{inversionAttempts:'dontInvert'});
        if(r&&done(r.data)) return;
      }catch(e){}
    }
  }
  _scanRAF=requestAnimationFrame(scanTick);
}
function stopScan(){
  if(_scanRAF){cancelAnimationFrame(_scanRAF);_scanRAF=null}
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop()});_scanStream=null}
  var v=document.getElementById('scanvid'); if(v) v.srcObject=null;
  document.getElementById('scanwrap').className='scanwrap';
}

/* ------------------------------------------------------------------
   ?id=NUMBER straight off the address bar.
   Encode a hirer card's QR as the My Gear link with ?id= on the end and
   the phone's own camera app opens their gear - nothing to type, no
   buttons, nothing to explain.
------------------------------------------------------------------ */
(function(){
  try{
    var m=(location.search||'').match(/[?&]id=(\d{3,})/i)
       || (location.hash||'').match(/[#&]id=(\d{3,})/i);
    if(m){
      document.getElementById('idno').value=m[1];
      setTimeout(go,60);
    }
  }catch(e){}
})();

/* the site-pulse counters on the front door count up on arrival -
   go() runs animate() again later for the card's own numbers */
try{animate()}catch(e){}


/* ------------------------------------------------------------------
   REAL BARCODES - Code 39, drawn as SVG, no library, works offline.

   Andrew, 27 Jul 2026: "a really nice barcode picture with BOTH
   barcodes - we only have one at the moment". Every person has two
   numbers that matter at the counter:

       CARD ID    the number on their Coates card (EXTERNAL_ID)
       HIRER ID   SiteIQ's own hirer number

   Both are drawn properly so a handheld scanner reads them off the
   phone screen or off the printed A4. Code 39 is self-checking, needs
   no checksum, and every store scanner on site reads it out of the box.
   Narrow:wide is 1:3 - the ratio scanners like.
------------------------------------------------------------------ */
var C39={'0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn',
'4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw',
'8':'wnnwnnwnn','9':'nnwwnnwnn','A':'wnnnnwnnw','B':'nnwnnwnnw',
'C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn',
'G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww',
'O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn',
'S':'nnwnnnwwn','T':'nnnnwnwwn','U':'wwnnnnnnw','V':'nwwnnnnnw',
'W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn',
'-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn'};

function barcode39(value, opts){
  opts = opts || {};
  var h = opts.h || 54, unit = opts.unit || 2, wide = unit * 3;
  var txt = String(value == null ? '' : value).toUpperCase()
              .replace(/[^0-9A-Z\-\. ]/g, '');
  if(!txt) return '';
  var seq = '*' + txt + '*', x = 10, rects = '';
  for(var i = 0; i < seq.length; i++){
    var pat = C39[seq.charAt(i)];
    if(!pat) continue;
    for(var e = 0; e < 9; e++){
      var w = pat.charAt(e) === 'w' ? wide : unit;
      if(e % 2 === 0){                       /* even element = a bar */
        rects += '<rect x="' + x + '" y="0" width="' + w +
                 '" height="' + h + '" fill="#111"></rect>';
      }
      x += w;
    }
    x += unit;                               /* inter-character gap */
  }
  var total = x + 10;
  return '<svg class="bc39" viewBox="0 0 ' + total + ' ' + h +
    '" width="100%" height="' + h + '" preserveAspectRatio="xMidYMid meet" ' +
    'role="img" aria-label="Barcode ' + txt + '" ' +
    'style="background:#fff">' + rects + '</svg>';
}

/* The pair of barcodes, captioned, ready for the card or the A4. */
function barcodePair(cardId, hirerId){
  function one(label, val){
    if(!val) return '';
    return '<div class="bcbox"><div class="bclab">' + esc(label) + '</div>'
      + barcode39(val) + '<div class="bcnum">' + esc(String(val)) + '</div></div>';
  }
  var a = one('CARD ID', cardId), b = one('SITEIQ HIRER ID', hirerId);
  if(!a && !b) return '';
  return '<div class="bcwrap">' + a + b + '</div>';
}

/* ------------------------------------------------------------------
   PRINT A4 - MY GEAR PERSONAL EQUIPMENT & RETURN ACCOUNTABILITY REPORT

   This is deliberately a print-only renderer. It reads the already
   decoded LASTP payload and creates a separate #printsheet. It does not
   change the live card, the scanner, encryption, score maths or exports.
------------------------------------------------------------------ */
function printCard(){
  var p=window.LASTP;
  if(!p){ window.print(); return; }
  var el=document.getElementById('printsheet');
  if(!el){
    el=document.createElement('div'); el.id='printsheet';
    document.body.appendChild(el);
  }

  var items=p.items||[], st=p.stats||{}, ag=p.aging||{g:0,a:0,r:0};
  var today=new Date();
  var mons=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var pad=function(n){return String(n).padStart(2,'0')};
  var dd=today.getDate()+' '+mons[today.getMonth()]+' '+today.getFullYear();
  var tm=pad(today.getHours())+':'+pad(today.getMinutes());
  var ymd=today.getFullYear()+pad(today.getMonth()+1)+pad(today.getDate());
  var cleanId=String(p.id||'UNKNOWN').replace(/[^A-Za-z0-9_-]/g,'');
  var reportId='MG-K2-'+cleanId+'-'+ymd;
  var supportOut=(Number(p.radios&&p.radios.out)||0)
    +(Number(p.gas&&p.gas.out)||0)+(Number(p.oth&&p.oth.out)||0);
  var cleared=(Number(st.items)||0)===0 && supportOut===0;
  var scoreText=p.hasReturns?String(Number(p.score)||0):'\u2014';

  /* Convert HTML already created by the safe builder back to plain text. */
  function textOf(html){
    if(!html) return '';
    var d=document.createElement('div'); d.innerHTML=String(html);
    return (d.textContent||'').replace(/\s+/g,' ').trim();
  }
  /* Compliance chips become plain words on paper. */
  function noteOf(b){
    if(!b) return [];
    var d=document.createElement('div');
    d.innerHTML=String(b).replace(/<\/span>/gi,'|');
    var t=(d.textContent||'')
      .replace(/[\uD800-\uDFFF\u2190-\u21FF\u2600-\u27BF\uFE0F]/g,'');
    return t.split('|').map(function(x){
      return x.replace(/\s+/g,' ').replace(/^[\s\u00b7:;,-]+|[\s\u00b7:;,-]+$/g,'');
    }).filter(function(x){return x});
  }
  function n(v){v=Number(v)||0;return v;}
  function mny(v){
    v=Number(v);
    if(!v) return '';
    return '$'+v.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function plural(v,one,many){return n(v)===1?one:many;}
  function clamp(v){v=n(v);return Math.max(0,Math.min(100,Math.round(v)));}
  function categoryOf(c){
    var k=String(c||'').toUpperCase();
    if(k==='#FFA24D') return 'Electrical';
    if(k==='#F26222') return 'Rigging';
    if(k==='#C44C28') return 'Plant';
    if(k==='#FFD27A') return 'Radios';
    return 'Tooling';
  }
  function ageInfo(v,due){
    var d=parseInt(v,10);
    if(due) return {row:'prow-due',badge:'due',label:'Due today'};
    if(isNaN(d)) return {row:'',badge:'',label:'Age unknown'};
    if(d>=5) return {row:'prow-priority',badge:'priority',label:'Priority'};
    if(d>=3) return {row:'prow-attention',badge:'attention',label:'Attention'};
    return {row:'prow-current',badge:'current',label:'Current'};
  }
  function cmpLine(label,value,me){
    var v=clamp(value);
    return '<div class="pcmprow"><span class="pcmpl">'+esc(label)+'</span>'
      +'<span class="pcmptrack"><i class="pcmpfill '+(me?'me':'')
      +'" style="width:'+v+'%"></i></span><b class="pcmpv">'+v+'</b></div>';
  }
  function alertCard(type,title,value,copy){
    return '<div class="palert '+type+'"><div class="pat">'+esc(title)+'</div>'
      +'<b>'+esc(value)+'</b><span>'+esc(copy)+'</span></div>';
  }
  function detailRow(label,value){
    return '<div class="pdetailrow"><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';
  }
  function supportLine(obj){
    obj=obj||{};
    return n(obj.back)+' returned / '+n(obj.taken)+' issued / '+n(obj.out)+' outstanding';
  }

  var rows='', dueCount=0, oldCount=0, reqCount=0;
  items.forEach(function(it,ix){
    var segs=noteOf(it.b);
    var due=segs.some(function(x){return /RETURN|DUE BACK/i.test(x)});
    if(due) dueCount++;
    var rest=segs.filter(function(x){return !/RETURN|DUE BACK/i.test(x)}).join(' \u00b7 ');
    if(rest) reqCount++;
    var days=parseInt(it.days,10);
    if(!isNaN(days)&&days>=5) oldCount++;
    var ai=ageInfo(it.days,due);
    rows+='<tr class="'+ai.row+'">'
      +'<td class="pcheckcell"><span class="pbox"></span></td>'
      +'<td><div class="pdesc">'+esc(it.d)+'</div>'
      +'<span class="pcat">'+esc(categoryOf(it.c))+'</span></td>'
      +'<td class="passet"><b>'+esc(it.n)+'</b>'
      +(it.pid?'<span class="ppid">Plant ID '+esc(it.pid)+'</span>':'<span>Plant ID \u2014</span>')+'</td>'
      +'<td class="preq">'+(due?'<span class="pdue">DUE BACK TODAY</span>':'')
      +(rest?esc(rest):'<span class="pquiet">No additional requirement shown</span>')+'</td>'
      +'<td class="pagecell r">'+(it.r?'<span class="prepl">'+mny(it.r)+'</span>':'<span class="preplq">TBC</span>')+'</td>'
      +'<td class="pagecell"><b>'+(it.days==='-'?'\u2014':esc(it.days)+(Number(it.days)===1?' day':' days'))+'</b>'
      +'<span class="pagebadge '+ai.badge+'">'+esc(ai.label)+'</span></td>'
      +'</tr>';
  });

  var consRows='';
  if(p.cons&&p.cons.list&&p.cons.list.length){
    p.cons.list.forEach(function(c,ix){
      consRows+='<tr><td class="pcheckcell">'+(ix+1)+'</td><td>'+esc(c.d)+'</td>'
        +'<td class="pagecell"><b>'+esc(c.q||1)+'</b></td></tr>';
    });
  }

  var rankText='Score begins after the first recorded return';
  if(p.hasReturns&&p.rank){
    rankText='#'+n(p.rank.comp)+' of '+n(p.rank.compTotal)+' in crew';
    if(n(p.rank.pct)>0) rankText+=' / top '+n(p.rank.pct)+'% on site';
  }

  var mixHtml='';
  (p.mix||[]).forEach(function(m){
    mixHtml+='<span><i></i>'+esc(m[0])+' <b>'+n(m[1])+'</b></span>';
  });
  if(!mixHtml) mixHtml='<span>No current kit mix recorded</span>';

  var compareHtml='';
  if(p.cmp){
    compareHtml=cmpLine('You',p.cmp.you,true)
      +cmpLine('Your crew',p.cmp.crew,false)
      +cmpLine('Site average',p.cmp.site,false);
  }else{
    compareHtml='<div class="pquiet">Comparison data not available in this snapshot.</div>';
  }

  var alerts='';
  if(dueCount>0) alerts+=alertCard('critical','Return priority',dueCount+' due back today',
    'These lines are marked for same-shift return to the tool store.');
  if(p.gas&&n(p.gas.out)>0) alerts+=alertCard('critical','Gas monitor control',n(p.gas.out)+' still outstanding',
    'Return for charge, bump or calibration checks before the next issue.');
  if(p.radios&&n(p.radios.out)>0) alerts+=alertCard('critical','Radio accountability',n(p.radios.out)+' '+plural(p.radios.out,'piece','pieces')+' outstanding',
    'Return radios and batteries over the counter so they can be charged and cleared.');
  if(p.oth&&n(p.oth.out)>0) alerts+=alertCard('','Client equipment',n(p.oth.out)+' outstanding',
    'Client-owned equipment remains recorded through this ID.');
  if(p.dmg&&n(p.dmg.n)>0) alerts+=alertCard('critical','Damage record',n(p.dmg.n)+' '+plural(p.dmg.n,'record','records'),
    (p.dmg.list&&p.dmg.list.length)?p.dmg.list.join(', '):'See the tool store for the recorded item details.');
  if(!alerts) alerts=alertCard('good','Current exceptions','No urgent exception shown',
    'No overdue support equipment or damage alert is recorded in this snapshot.');

  var activity=p.act||{};
  var activityRows='';
  if(p.radios) activityRows+=detailRow('Radio gear',supportLine(p.radios));
  if(p.gas) activityRows+=detailRow('Gas monitors',supportLine(p.gas));
  if(p.oth) activityRows+=detailRow('Client gear through this ID',supportLine(p.oth));
  activityRows+=detailRow('Damage records',String(p.dmg?n(p.dmg.n):0));
  if(activity.to) activityRows+=detailRow('SiteIQ transaction history', 'to '+activity.to);

  var comp=p.comp||{};
  var responsibilityRows='';
  if(comp.any){
    responsibilityRows+=detailRow('Electrical items with tag requirements',String(n(comp.electrical)));
    responsibilityRows+=detailRow('Rigging items with tag requirements',String(n(comp.rigging)));
    responsibilityRows+=detailRow('Daily pre-start / logbook items',String(n(comp.logbook)));
    responsibilityRows+=detailRow('Items due back today',String(n(comp.ret)));
  }else{
    responsibilityRows=detailRow('Additional compliance flags','None shown in the equipment master');
  }

  var story=textOf(p.story||'');
  var gearOpen=n(st.items), supportOpen=n(supportOut), statusTitle, statusCopy;
  if(cleared){
    statusTitle='CLEARED - ALL GEAR RETURNED';
    statusCopy='Nothing is currently shown outstanding against this ID. Thanks for bringing it all back.';
  }else if(gearOpen>0 && supportOpen>0){
    statusTitle='OPEN - '+gearOpen+' GEAR + '+supportOpen+' SUPPORT TO CLEAR';
    statusCopy='Return the equipment register items and the outstanding support equipment shown below for physical checking and removal from your name.';
  }else if(gearOpen>0){
    statusTitle='OPEN - '+gearOpen+' '+plural(gearOpen,'ITEM','ITEMS')+' TO CLEAR';
    statusCopy='Bring the equipment listed below to the tool store for physical checking and removal from your name.';
  }else{
    statusTitle='OPEN - '+supportOpen+' SUPPORT '+plural(supportOpen,'ITEM','ITEMS')+' TO CLEAR';
    statusCopy='No rental item is shown in the equipment register, but support equipment remains outstanding. Return it to the tool store for checking and clearance.';
  }
  var density=items.length>32?'pdense':(items.length>18?'pcompact':'');
  el.className=density;

  el.innerHTML=
    '<div class="pframe"></div>'
    +'<div class="pmast"><div class="pbrand"><div class="pmg">MY <b>GEAR</b></div>'
    +'<div class="pmk">MY GEAR HQ · Digital Tool Store</div>'
    +'<div class="preporttitle">Personal equipment &amp; return accountability report</div></div>'
    +'<div class="pdoc"><div class="pstatusstamp '+(cleared?'cleared':'open')+'"><span>Report status</span><b>'+(cleared?'Cleared':'Open')+'</b></div>'
    +'<div><span class="pdl">Site</span><span class="pdv">K2 Shutdown 2026 - Gladstone</span></div>'
    +'<div><span class="pdl">Source</span><span class="pdv">Read-only SiteIQ snapshot</span></div>'
    +'<div><span class="pdl">Report ID</span><span class="pdv">'+esc(reportId)+'</span></div>'
    +'<div><span class="pdl">Printed</span><span class="pdv">'+esc(dd+' '+tm)+'</span></div></div></div>'

    +'<div class="pidentity">'
    +'<div class="pfield big"><i>Name</i><b>'+esc(p.name)+'</b></div>'
    +'<div class="pfield"><i>ID number</i><b>'+esc(p.id)+'</b></div>'
    +'<div class="pfield"><i>Company</i><b style="text-transform:uppercase">'+esc(p.company)+'</b></div>'
    +'<div class="pfield"><i>Transaction coverage</i><b>'+(activity.to?esc('To '+activity.to):'Not stated')+'</b></div>'
    +'</div>'

    +'<div class="poverview"><div class="pstate '+(cleared?'cleared':'open')+'">'
    +'<div class="pkicker">Return clearance status</div><div class="pstatehead">'+esc(statusTitle)+'</div>'
    +'<div class="pstatecopy">'+esc(statusCopy)+'</div></div>'
    +'<div class="pscore"><div class="plab">Returns score</div><div class="pvalue">'+esc(scoreText)+'<span>/100</span></div>'
    +'<div class="prank">'+esc(rankText)+'</div></div></div>'

    +'<div class="pnums">'
    +'<div class="pn1 accent"><b>'+n(st.items)+'</b><span>Items on hire now</span><em>Current responsibility</em></div>'
    +'<div class="pn1"><b>'+n(st.types)+'</b><span>Different item types</span><em>Current kit variety</em></div>'
    +'<div class="pn1 good"><b>'+n(st.returned)+'</b><span>Items returned</span><em>Recorded history</em></div>'
    +'<div class="pn1 good"><b>'+n(st.sameday)+'</b><span>Same-day returns</span><em>Return behaviour</em></div>'
    +'<div class="pn1 warn"><b>'+oldCount+'</b><span>Items at 5+ days</span><em>Priority review</em></div>'
    +(st.rex?'<div class="pn1 rex"><b>'+mny(st.rex)+'</b><span>Replacement value in your name</span><em>'
      +(st.rex_tbc?st.rex_tbc+' item'+(st.rex_tbc===1?'':'s')+' priced TBC':'Every item priced')+'</em></div>':'')
    +'</div>'

    +'<div class="pinsightgrid"><div class="pmini"><div class="pminih">Equipment age profile</div>'
    +'<div class="pagechips"><div class="pagechip current"><b>'+n(ag.g)+'</b><span>0-2 days</span></div>'
    +'<div class="pagechip attention"><b>'+n(ag.a)+'</b><span>3-4 days</span></div>'
    +'<div class="pagechip priority"><b>'+n(ag.r)+'</b><span>5+ days</span></div></div>'
    +'<div class="pmix">'+mixHtml+'</div></div>'
    +'<div class="pmini"><div class="pminih">Returns score comparison</div><div class="pcmp">'+compareHtml+'</div></div></div>'

    +'<div class="palerts">'+alerts+'</div>'
    +(story?'<div class="pstory"><b>Your shutdown story:</b> '+esc(story)+'</div>':'')

    +'<div class="psect"><strong>01</strong> Equipment register <span>Oldest first \u00b7 '+items.length+' '+plural(items.length,'item','items')+' \u00b7 store check box at left</span></div>'
    +'<table class="pt"><colgroup><col style="width:8mm"><col style="width:57mm">'
    +'<col style="width:29mm"><col style="width:42mm"><col style="width:19mm"><col style="width:22mm"></colgroup>'
    +'<thead><tr class="pcont"><th colspan="6"><div class="pcontline"><span>MY GEAR \u00b7 '+esc(p.name)+' \u00b7 ID '+esc(p.id)+' \u00b7 '+esc(reportId)+'</span><b>Equipment register</b></div></th></tr>'
    +'<tr><th>Check</th><th>Equipment description</th><th>Item / plant ID</th>'
    +'<th>Compliance &amp; return requirement</th><th class="r">Replacement</th><th class="r">Age / priority</th></tr></thead><tbody>'
    +(rows||'<tr><td colspan="6" class="pempty">Nothing on hire - fully cleared. Thanks for bringing it all back.</td></tr>')
    +'</tbody></table>'

    +'<div class="psect"><strong>02</strong> Compliance &amp; return responsibilities <span>'+reqCount+' '+plural(reqCount,'line','lines')+' with additional requirements</span></div>'
    +'<div class="presponsibility"><div class="pdetail"><div class="pdetailh">Requirement summary</div>'+responsibilityRows+'</div>'
    +'<div class="presbox"><h4>What the printout means</h4><div class="pnote2">'
    +'<b>Tagged gear:</b> anything showing a tag requirement must carry the current inspection tag with a readable date. '
    +'<b>Due back today:</b> the marked item returns to the tool store this shift for the required charge, check or control. '
    +'<b>No tag or failed check:</b> do not use it - bring it to the store and the team will sort it.</div></div></div>'

    +'<div class="psect"><strong>03</strong> Store activity &amp; support equipment <span>Recorded through this ID</span></div>'
    +'<div class="pactivity">'
    +'<div class="pact"><b>'+n(activity.visits)+'</b><span>Store visit dates</span></div>'
    +'<div class="pact"><b>'+n(activity.txns)+'</b><span>Transactions</span></div>'
    +'<div class="pact"><b>'+(p.cons?n(p.cons.n):0)+'</b><span>Consumables</span></div>'
    +'<div class="pact"><b>'+(p.radios?n(p.radios.taken):0)+'</b><span>Radio gear issued</span></div>'
    +'</div>'
    +'<div class="pdetailgrid"><div class="pdetail"><div class="pdetailh">Issued / returned / outstanding</div>'+activityRows+'</div>'
    +'<div class="presbox"><h4>Damage and exceptions</h4><div class="pnote2">'
    +(p.dmg&&n(p.dmg.n)>0?'<b>'+n(p.dmg.n)+' damage '+plural(p.dmg.n,'record','records')+':</b> '+esc((p.dmg.list||[]).join(', ')||'See the tool store for details.'):'<b>No damage recorded</b> in this name in the current shutdown snapshot.')
    +'<br><br>Something does not look right? Take this report to the tool store so the source record can be checked.</div></div></div>'

    +(consRows?'<div class="psect"><strong>04</strong> Consumables usage record <span>No return required \u00b7 '+n(p.cons.n)+' total</span></div>'
      +'<table class="pt small"><colgroup><col style="width:9mm"><col><col style="width:20mm"></colgroup>'
      +'<thead><tr class="pcont"><th colspan="3"><div class="pcontline"><span>MY GEAR \u00b7 '+esc(p.name)+' \u00b7 ID '+esc(p.id)+' \u00b7 '+esc(reportId)+'</span><b>Consumables usage</b></div></th></tr>'
      +'<tr><th>#</th><th>Description</th><th class="r">Quantity</th></tr></thead><tbody>'+consRows+'</tbody></table>':'')

    +'<div class="pclearance '+(cleared?'cleared':'open')+'"><div class="pclearbadge">'+(cleared?'Cleared':'Not cleared')+'</div>'
    +'<div class="pcleartext"><b>'+esc(statusTitle)+'</b><span>'+esc(statusCopy)+'</span>'
    +'<small class="pclearfine">Read-only SiteIQ snapshot - final status is confirmed after physical checking and the latest refresh.</small></div></div>'
    +barcodePair(p.id,p.hid)
    +'<div class="psign"><div class="ps1"><i>Hirer acknowledgement / signature</i><span></span></div>'
    +'<div class="ps1"><i>Tool store return verification / signature</i><span></span></div>'
    +'<div class="ps1"><i>Date &amp; time</i><span></span></div></div>'
    +'<div class="pteamline"><b>Your Coates tool store team</b> \u00b7 '
    +'<i>ANY</i> Andrew Fisher, Shutdown Manager \u2013 andrew.fisher@coates.com.au \u00b7 '
    +'<i>DAY</i> Thomas Maher \u2013 thomas.maher@coates.com.au \u00b7 '
    +'<i>NIGHT</i> Cody Mitchell \u2013 cody.mitchell@coates.com.au \u00b7 '
    +'<i>BREAKDOWNS</i> Lucas Armstrong \u2013 lucas.armstrong@coates.com.au \u00b7 '
    +'Helen O\u2019Grady &amp; Adam Boyce at the counter \u2013 expertise, solutions, help. '
    +'We are here to help \u2013 reach out if you require anything. '
    +'<i>MY GEAR HQ</i> \u00b7 designed &amp; built by Andrew Fisher.</div>';

  window.print();
}
"""


def sheet_html(guides_html):
    """The full-screen sheet the guides open into, plus the scanner."""
    return (
        "<div id='gsheet' class='gsheet'>"
        "<div class='gsbar'><b id='gsheet-title'>Guide</b>"
        "<button onclick='closeGuide()' type='button'>Close</button></div>"
        "<div class='gsbody' id='gsbody'>" + guides_html + "</div></div>"
        "<div id='scanwrap' class='scanwrap'>"
        "<div class='scanbar'><b>Scan your card</b>"
        "<button onclick='stopScan()' type='button'>Cancel</button></div>"
        "<video id='scanvid' playsinline muted></video>"
        "<div class='scanbox'></div>"
        "<div class='scanhint' id='scanhint'>Hold your card steady in the "
        "frame</div></div>")


def shelf_html(buttons, heading="Handy on site"):
    return ("<div class='gshelf'><div class='gh'>{h}</div>{b}</div>".format(
        h=heading, b=buttons))
