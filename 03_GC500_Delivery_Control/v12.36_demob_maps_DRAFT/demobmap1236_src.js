<style id="demobmap1236-style">
/* Author: Andrew Fisher. v12.36 - the master plan beside every asset on the Demob tab. Andrew, 26 Oct 2026: "Can we make
   better lets do a nice one of my map next to each asset. Refernce location. We need this looking better . Push your
   potetntil further need to look 10/10". Screen only: print keeps the page's own light table. */
@media screen{
/* ---------- the map beside each line ---------- */
#pane-demob .mp1236{appearance:none;-webkit-appearance:none;display:flex;flex-direction:column;gap:6px;width:148px;max-width:100%;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
#pane-demob span.mp1236{cursor:default}
#pane-demob .mpf1236{position:relative;display:block;width:100%;aspect-ratio:396/276;border-radius:12px;overflow:hidden;isolation:isolate;
  background:#e8e4dd;box-shadow:0 0 0 1px #ffffff2e,0 8px 18px #0000008c}
#pane-demob .mpf1236::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;z-index:3;background:var(--st,#5d7782)}
#pane-demob .mpf1236 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .35s ease,transform .35s ease,filter .35s ease}
#pane-demob .mpf1236 img.on{opacity:1}
#pane-demob button.mp1236:hover .mpf1236 img.on{transform:scale(1.045)}
#pane-demob button.mp1236:hover .mpf1236{box-shadow:0 0 0 1px #ffffff5c,0 10px 22px #000000a6}
#pane-demob .mpf1236 .w1236{position:absolute;inset:0;background:linear-gradient(100deg,#ddd8cf 30%,#f0ece6 50%,#ddd8cf 70%) 0 0/300% 100%;animation:sh1236 1.3s linear infinite}
@keyframes sh1236{from{background-position:100% 0}to{background-position:0 0}}
@media (prefers-reduced-motion:reduce){#pane-demob .mpf1236 .w1236{animation:none}#pane-demob .mpf1236 img{transition:none}}
#pane-demob .mpf1236 .go1236{position:absolute;right:6px;bottom:9px;z-index:2;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0f1b21db;color:#fff;box-shadow:0 0 0 1px #ffffff47,0 2px 6px #0009}
#pane-demob .mpf1236 .go1236 svg{width:12px;height:12px;display:block}
#pane-demob .mpf1236 .tg1236{position:absolute;left:6px;top:6px;z-index:2;display:none;align-items:center;padding:4px 7px 3px;border-radius:999px;font:800 9px/1 Inter,Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;background:#0f1b21e0;color:#fff;box-shadow:0 0 0 1px #ffffff38}
#pane-demob .mpf1236 .tg1236.ap,#pane-demob .mpf1236 .tg1236.rp{display:inline-flex;background:#3b2a0de6;color:#ffd98a;box-shadow:0 0 0 1px #ffc24b70}
#pane-demob tr[data-st1231=gone] .mpf1236 .tg1236{display:none}
#pane-demob tr[data-st1231=gone] .mpf1236 .tg1236.gn{display:inline-flex;background:#0d3b24e8;color:#8ff5bd;box-shadow:0 0 0 1px #52e89770}
#pane-demob tr[data-st1231=gone] .mpf1236 img.on{filter:grayscale(1) contrast(.9) brightness(1.06)}
#pane-demob .mpf1236.off{background:repeating-linear-gradient(135deg,#1d313b 0 8px,#182931 8px 16px);box-shadow:0 0 0 1px #ffffff1f}
#pane-demob .mpf1236 .nm1236{position:absolute;inset:0;display:grid;place-items:center;padding:8px;text-align:center;font:700 10.5px/1.3 Inter,Arial,sans-serif;color:#a3b7bf}
#pane-demob .mpc1236{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;font:500 10.5px/1.3 Inter,Arial,sans-serif;color:#a3b7bf}
#pane-demob .mpc1236 b{color:#eef5f8;font-weight:800}
#pane-demob button.mp1236:focus-visible{outline:2px solid #ffa45c;outline-offset:3px;border-radius:12px}
/* a line found from the plan above: a short glow */
#pane-demob tr.fl1236{animation:fl1236 1.7s ease}
#pane-demob tr.fl1236>td{animation:flc1236 1.7s ease}
@keyframes fl1236{0%,100%{outline:2px solid #ffa45c00}20%,60%{outline:2px solid #ffa45c}}
@keyframes flc1236{0%,100%{}25%,55%{background:#ffa45c26}}
/* ---------- the whole site on the master plan, above the lists ---------- */
#pane-demob .ov1236{margin:12px 0 14px;padding:14px 14px 11px;border-radius:16px;background:linear-gradient(160deg,#18272f,#0f1b21);border:1px solid #ffffff14;box-shadow:0 10px 26px #0b141a40;color:#f2f7f9}
#pane-demob .ov1236 .oh1236{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8px 16px;margin:0 2px 10px}
#pane-demob .ov1236 h3{margin:0;font:800 15.5px/1.2 Inter,Arial,sans-serif;color:#fff;letter-spacing:.01em}
#pane-demob .ov1236 h3 small{display:block;margin-top:4px;font:600 11.5px/1.35 Inter,Arial,sans-serif;color:#a3b7bf;letter-spacing:0}
#pane-demob .ov1236 .lg1236{display:flex;flex-wrap:wrap;gap:6px 12px;font:800 11px/1 Inter,Arial,sans-serif;color:#d8e8ee}
#pane-demob .ov1236 .lg1236 span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
#pane-demob .ov1236 .lg1236 i{width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 2px #fff}
#pane-demob .ov1236 i.not,#pane-demob .ov1236 .dot1236.not::before{background:#e5463b}
#pane-demob .ov1236 i.ready,#pane-demob .ov1236 .dot1236.ready::before{background:#f5a524}
#pane-demob .ov1236 i.gone,#pane-demob .ov1236 .dot1236.gone::before{background:#19c46a}
#pane-demob .ov1236 i.unchecked,#pane-demob .ov1236 .dot1236.unchecked::before{background:#8aa1ab}
#pane-demob .ov1236 i.part,#pane-demob .ov1236 .dot1236.part::before{background:#2ec4a6}
#pane-demob .ov1236 .pl1236{position:relative;overflow:hidden;border-radius:12px;background:#ebe8e2;box-shadow:0 0 0 1px #ffffff26,inset 0 0 0 1px #0000001a}
#pane-demob .ov1236 .pz1236{position:absolute}
#pane-demob .ov1236 .pz1236 img{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .4s ease}
#pane-demob .ov1236 .pz1236 img.on{opacity:1}
#pane-demob .ov1236 .dot1236{appearance:none;-webkit-appearance:none;position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
#pane-demob .ov1236 .dot1236::before{content:"";position:absolute;left:5px;top:5px;width:14px;height:14px;border-radius:50%;box-shadow:0 0 0 2.5px #fff,0 2px 6px #000a;transition:transform .15s ease}
#pane-demob .ov1236 .dot1236.gone::before{opacity:.9}
#pane-demob .ov1236 .dot1236:hover::before,#pane-demob .ov1236 .dot1236:focus-visible::before{transform:scale(1.3)}
#pane-demob .ov1236 .dot1236:focus-visible{outline:none}
#pane-demob .ov1236 .ft1236{margin:9px 2px 0;font:500 10.5px/1.4 Inter,Arial,sans-serif;color:#8fa8b2}
/* the groups to go to, on the plan's card */
#pane-demob .cn1236{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 11px}
#pane-demob .cc1236{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;gap:7px;margin:0;padding:5px 10px 5px 5px;border-radius:999px;border:1px solid #ffffff26;background:#ffffff0d;color:#e9f2f5;font:700 12px/1 Inter,Arial,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
#pane-demob .cc1236:hover{background:#ffffff1c}
#pane-demob .cc1236:focus-visible{outline:2px solid #ffa45c;outline-offset:2px}
#pane-demob .cc1236 i{display:grid;place-items:center;width:22px;height:22px;border-radius:7px;color:var(--cc);background:#ffffff12}
#pane-demob .cc1236 i svg{width:14px;height:14px}
#pane-demob .cc1236 b{font-weight:800;color:#fff}
#pane-demob .cc1236 span{min-width:0}
#pane-demob .cc1236 em{display:inline-flex;align-items:center;gap:4px;font-style:normal;font-weight:800;font-size:11px}
#pane-demob .cc1236 em.ready{margin-left:auto;color:#ffd98a}
#pane-demob .cc1236 em.gone{color:#9df5c4}
#pane-demob .cc1236 em::before{content:"";width:8px;height:8px;border-radius:50%}
#pane-demob .cc1236 em.ready::before{background:#f5a524}
#pane-demob .cc1236 em.gone::before{background:#19c46a}
/* each group's header: its picture, name and count, and its lights */
#pane-demob .sec1231 table.dm1231 tr.zr1231[data-cat1236] th{color:#f2f8fa;font:800 13px/1.25 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}
#pane-demob .sec1231 table.dm1231 tr.zr1231[data-cat1236] th>span{display:inline-block;margin-left:7px;padding:4px 9px;border-radius:999px;background:#ffffff1c;color:#eef6f8;font:800 11px/1 Inter,Arial,sans-serif;letter-spacing:.02em;vertical-align:middle}
#pane-demob .ci1236{display:inline-grid;place-items:center;width:32px;height:32px;margin-right:10px;border-radius:10px;vertical-align:middle;font-style:normal;color:var(--cc,#9fb2bb);background:#ffffff10;box-shadow:inset 0 0 0 1px #ffffff26}
@supports (background:color-mix(in srgb,red 10%,transparent)){#pane-demob .ci1236,#pane-demob .cc1236 i{background:color-mix(in srgb,var(--cc) 17%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cc) 45%,transparent)}}
#pane-demob .ci1236 svg{width:18px;height:18px;display:block}
#pane-demob .cs1236{float:right;display:inline-flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-style:normal;text-transform:none;letter-spacing:0}
#pane-demob .cs1236 b{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font:800 11.5px/1 Inter,Arial,sans-serif;color:#eef6f8;background:#ffffff0d;box-shadow:inset 0 0 0 1px #ffffff21}
#pane-demob .cs1236 b::before{content:"";width:8px;height:8px;border-radius:50%}
#pane-demob .cs1236 b.not::before{background:#ff6a5f}
#pane-demob .cs1236 b.ready::before{background:#ffc24b}
#pane-demob .cs1236 b.gone::before{background:#52e897}
#pane-demob .cs1236 b.unchecked::before{background:#8aa1ab}
#pane-demob .cs1236 b.part::before{background:#2ec4a6}
#pane-demob .cs1236 b span{font-weight:600;color:#a9bcc4}
/* ---------- what it is first: the description and the asset number lead, the reference is a small tag ---------- */
#pane-demob .sec1231 tr[data-row816] td[data-label="What"]{color:#fff;font:800 15.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .sec1231 tr[data-row816] .sp1231{margin-top:6px}
#pane-demob .sec1231 tr[data-row816] .sp1231 .an1231{margin:0 0 6px;color:#cfe0e6;font:600 12.5px/1.4 Inter,Arial,sans-serif}
#pane-demob .sec1231 tr[data-row816] .sp1231 .an1231 b{display:inline-block;margin:1px 2px 1px 3px;padding:2px 8px;border-radius:7px;background:#ffffff17;box-shadow:inset 0 0 0 1px #ffffff2b;color:#fff;font:800 14px/1.25 "SFMono-Regular",Consolas,"Roboto Mono",monospace;letter-spacing:.02em}
#pane-demob .sec1231 tr[data-row816] .plateb .rplate{font-size:11.5px!important;padding:3px 7px!important;background:#ffffff0f!important;color:#ffb37a!important;box-shadow:inset 0 0 0 1.5px #ff8a3a8c!important;text-shadow:none!important;border-radius:6px!important;transform:none!important}
#pane-demob .sec1231 tr[data-row816] .plateb::before{content:"GC500 ID";display:block;margin:0 0 3px;color:#7f9aa5;font:800 8.5px/1 Inter,Arial,sans-serif;letter-spacing:.12em}
/* the size and the weight, named */
#pane-demob .gn1236{display:block;margin-top:4px;color:#8ff5bd;font:700 11px/1.4 Inter,Arial,sans-serif}
#pane-demob .gn1236 s{color:#6fae8c;text-decoration-thickness:2px;margin-right:3px}
#pane-demob .ps1236{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
#pane-demob .pp1236{display:inline-flex;align-items:baseline;gap:6px;padding:4px 8px;border-radius:8px;background:#ffffff0d;box-shadow:inset 0 0 0 1px #ffffff21;color:#eef6f8;font:700 12px/1.25 Inter,Arial,sans-serif}
#pane-demob .pp1236 i{white-space:nowrap;font-style:normal;color:#8fb1bd;font:800 9px/1 Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase}
#pane-demob .pp1236 em{font-style:normal;color:#ffb37a;font:700 9.5px/1 Inter,Arial,sans-serif;letter-spacing:.04em}
#pane-demob .pp1236.weight{background:#52e8970f;box-shadow:inset 0 0 0 1px #52e89740}
#pane-demob .pp1236.size{background:#5cb8ff10;box-shadow:inset 0 0 0 1px #5cb8ff40}
#pane-demob .pp1236.none{background:transparent;box-shadow:inset 0 0 0 1px #ffffff26;color:#90a6af;border:0;outline:1px dashed #ffffff2e;outline-offset:-1px}
#pane-demob .segs816 .ev1236{font-weight:800}
/* the reference and its asset number on its own map */
#pane-demob .mpf1236 .lb1236{position:absolute;left:0;right:0;bottom:3px;z-index:2;padding:14px 32px 4px 7px;background:linear-gradient(180deg,#0f1b2100,#0f1b21d9);color:#fff;font:800 10px/1.15 Inter,Arial,sans-serif;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pane-demob .mpf1236 .lb1236 span{color:#ffb37a}
/* what is really happening: not checked yet is quiet, not red; part picked up says how many */
#pane-demob .sec1231 tr[data-row816][data-ps1236=unchecked]{--st:#5d7782}
#pane-demob tr[data-ps1236=unchecked] .lamps1231 .lp1231.on i{background:#2c3b43!important;color:#9fb2bb!important;box-shadow:inset 0 0 0 1px #ffffff26!important}
#pane-demob tr[data-ps1236=unchecked] .sw1231{color:#cfe0e6!important}
#pane-demob tr[data-part1236] .st1231 .pt1231,#pane-demob .pt1236{display:inline-flex;align-items:center;gap:6px;margin:2px 0;padding:4px 9px;border-radius:999px;background:#52e8971a;color:#9df5c4!important;box-shadow:inset 0 0 0 1px #52e89759;font:800 11.5px/1.2 Inter,Arial,sans-serif}
#pane-demob .dmday816[data-ev1236] td.pk1231 .pd1231,#pane-demob .dmday816[data-ev1236] td.pk1231 .chip.src816,#pane-demob .dmday816[data-ev1236] td.pk1231>.w{display:none!important}
#pane-demob .bk1236{color:#a3b7bf;font:600 12px/1.3 Inter,Arial,sans-serif}
#pane-demob .bk1236 b{color:#eef6f8;font-weight:800}
/* ---------- the demob, done: a big number and the days against the percentage ---------- */
#pane-demob .pg1236{display:grid;grid-template-columns:minmax(0,330px) minmax(0,1fr);gap:16px 24px;align-items:center;margin:12px 0 14px;padding:18px 18px 14px;border-radius:18px;
  background:radial-gradient(120% 140% at 0% 0%,#ff6a1324,#ff6a1300 60%),linear-gradient(160deg,#1a2a33,#0f1b21);border:1px solid #ffffff17;box-shadow:0 12px 30px #0b141a4d;color:#f2f7f9}
#pane-demob .pg1236 .pk1236{display:flex;align-items:center;gap:16px}
#pane-demob .pg1236 .rg1236{position:relative;flex:none;width:136px;height:136px}
#pane-demob .pg1236 .rg1236 svg{width:100%;height:100%;display:block;transform:rotate(-90deg)}
#pane-demob .pg1236 .rg1236 b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:1px;font:900 32px/1 Inter,Arial,sans-serif;color:#fff;letter-spacing:-.02em}
#pane-demob .pg1236 .rg1236 b small{font-size:15px;font-weight:800;color:#ffb37a}
#pane-demob .pg1236 .tx1236 h3{margin:0 0 5px;font:800 12px/1.2 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ffb37a}
#pane-demob .pg1236 .tx1236 p{margin:3px 0;font:600 13px/1.4 Inter,Arial,sans-serif;color:#cfe0e6}
#pane-demob .pg1236 .tx1236 p b{color:#fff;font-weight:800}
#pane-demob .pg1236 .vd1236{display:inline-block;margin-top:6px;padding:5px 10px;border-radius:999px;font:800 11.5px/1.2 Inter,Arial,sans-serif;letter-spacing:.03em}
#pane-demob .pg1236 .vd1236.ok{background:#19c46a26;color:#8ff5bd;box-shadow:inset 0 0 0 1px #52e89766}
#pane-demob .pg1236 .vd1236.no{background:#e5463b26;color:#ffb1aa;box-shadow:inset 0 0 0 1px #ff746966}
#pane-demob .pg1236 .ch1236{min-width:0}
#pane-demob .pg1236 .ch1236 svg{width:100%;height:auto;display:block;overflow:visible;font-family:Inter,Arial,sans-serif}
#pane-demob .pg1236 .kl1236{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 2px 0;font:700 11px/1 Inter,Arial,sans-serif;color:#a9bcc4}
#pane-demob .pg1236 .kl1236 span{display:inline-flex;align-items:center;gap:6px}
#pane-demob .pg1236 .kl1236 i{display:inline-block;width:18px;height:0;border-top:3px solid #ff8a3a}
#pane-demob .pg1236 .kl1236 i.pace{border-top:2px dashed #8fb1bd}
/* ---------- a phone: the map on the right of each card ---------- */
@media (max-width:900px){
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]{grid-template-columns:auto minmax(0,1fr) 118px;grid-template-areas:"what what map" "ref br map" "st st st" "pk pk act"}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell{display:contents}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell .plateb{grid-area:ref;align-self:start;justify-self:start}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell .mp1236{grid-area:map;width:118px;align-self:start}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="What"]{padding-top:0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Branch"]{margin-top:5px}
  #pane-demob .sec1231 table.dm1231 tbody tr.zr1231[data-cat1236]{padding:18px 2px 8px}
  #pane-demob .sec1231 table.dm1231 tbody tr.zr1231[data-cat1236]:first-child{padding-top:4px}
  #pane-demob .sec1231 table.dm1231 tr.zr1231[data-cat1236] th{display:flex;align-items:center;flex-wrap:wrap;gap:6px 0;padding:0 0 10px;border-bottom:1px solid #ffffff1f}
  #pane-demob .cs1236{float:none;margin:0 0 0 auto}
  #pane-demob .cs1236 b{padding:5px 8px}
  #pane-demob .cs1236 b span{display:none}
  #pane-demob .ov1236{margin:10px 0 12px;padding:12px 10px 9px;border-radius:14px}
  #pane-demob .cn1236{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
  #pane-demob .cc1236{font-size:11.5px;line-height:1.2;padding:5px 9px 5px 5px;border-radius:12px;text-align:left}
  #pane-demob .pg1236{grid-template-columns:1fr;padding:14px 12px 10px;border-radius:16px}
  #pane-demob .pg1236 .rg1236{width:112px;height:112px}
  #pane-demob .pg1236 .rg1236 b{font-size:27px}
  #pane-demob .ov1236 .dot1236{width:22px;height:22px;margin:-11px 0 0 -11px}
  #pane-demob .ov1236 .dot1236::before{left:5px;top:5px;width:12px;height:12px;box-shadow:0 0 0 2px #fff,0 1px 4px #000a}
}
/* ---------- a wider screen: the same cards, in a tidy grid (Andrew: "look very messy") ---------- */
@media (min-width:901px){
  #pane-demob .sec1231 .daywrap table.daytbl{display:block;border-spacing:0;background:transparent}
  #pane-demob .sec1231 .daywrap table.daytbl thead{display:none}
  #pane-demob .sec1231 .daywrap table.daytbl tbody{display:grid;grid-template-columns:repeat(auto-fill,minmax(460px,1fr));gap:12px;align-items:start}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr.zr1231{display:block;grid-column:1/-1;padding:16px 2px 0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr.zr1231 th{display:flex;align-items:center;flex-wrap:wrap;gap:6px 0;padding:0 0 10px!important;border-bottom:1px solid #ffffff1f!important;text-align:left}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr.zr1231 .cs1236{float:none;margin:0 0 0 auto}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]{display:grid;grid-template-columns:auto minmax(0,1fr) 156px;grid-template-areas:"what what map" "ref br map" "st st st" "pk pk act";
    gap:10px 12px;align-items:start;margin:0;padding:14px 14px 12px 17px;border:1px solid var(--dk-line);border-radius:14px;
    background:linear-gradient(180deg,var(--dk-card2),var(--dk-card));box-shadow:inset 4px 0 0 var(--st,#5d7782),0 6px 14px #0007}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]:hover{background:linear-gradient(180deg,#ffffff0a,#ffffff05),linear-gradient(180deg,var(--dk-card2),var(--dk-card))}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td{display:block;background:transparent!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;min-width:0;width:auto;vertical-align:top}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td::before{display:none}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell{display:contents}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell .plateb{grid-area:ref;align-self:start;justify-self:start;min-height:0;padding:0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell .mp1236{grid-area:map;width:156px;align-self:start}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="What"]{grid-area:what}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Branch"]{grid-area:br;justify-self:end;align-self:end;padding:5px 8px!important;border:1px solid #ffffff26!important;border-radius:7px!important;background:#ffffff10!important;color:#d6e6ec;font:800 10.5px/1 Inter,Arial,sans-serif;letter-spacing:.08em;white-space:nowrap}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231{grid-area:st;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding-top:10px!important;border-top:1px solid var(--dk-line)!important}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .lamps1231{margin:0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231{grid-area:pk;display:flex;flex-wrap:wrap;align-items:center;gap:5px 8px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231 .pd1231{margin:0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Actions"]{grid-area:act;justify-self:end;align-self:center}
}
}
@media print{#pane-demob .mp1236,#pane-demob .ov1236,#pane-demob .pg1236{display:none!important}}
</style>
<script id="demobmap1236-script">
/* Author: Andrew Fisher. v12.36 - the master plan beside every asset on the Demob tab. Andrew, 26 Oct 2026: "Can we make
   better lets do a nice one of my map next to each asset. Refernce location. We need this looking better . Push your
   potetntil further need to look 10/10".
   1. Every pick-up line carries its own piece of the master plan D001-26003-03, drawn here from the page's own plan tiles
      (MAP_TILES, the drawing the Maps tab and the master-plan pictures use) and ringed in red where the reference is: a
      solid ring where its place is known to the unit, a dashed one where only the area is. Its place is the one the page
      already holds (dest782, through Find it on the map: Andrew's own pin first, then the master plan, then the record's
      other positions), carried onto the plan by the plan's own registration; where the plan itself draws the unit, its
      point on the plan is used as drawn. A reference with no drop-off yet shows the pit lane, where the driver reports,
      and says so; one with no position says so instead of guessing.
   2. Under it, its place in words: the servicing area for a toilet, otherwise what the master plan says it is next to or
      near.
   3. Tap the map for the page's own "on the map" card (v11.76): the close-up and wider pictures, Navigate, Send.
   4. Above the lists, the whole site on the master plan: every line of the day as a dot in its light's colour; tap a dot
      to go to its line.
   Presentation only: no record, plan, rule, count, charge or QR change; nothing is written anywhere. */
(function (W) {
'use strict';
const D = W.document;
if (typeof rowHtml816 !== 'function' || typeof renderDemob816 !== 'function' || typeof MAP_TILES !== 'object' || !MAP_TILES || !Array.isArray(MAP_TILES.levels) || !MAP_TILES.levels.length) return;
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ACROSS = 230;                 /* level-0 plan pixels across one map: about what the master-plan close-up pictures show */
const OUT = {w: 396, h: 276};       /* drawn at three times the largest map on screen, so it stays sharp on a phone */
const LANE = 0.002;                 /* within this of the plan's own point (a few metres), the point as the plan draws it is used */
const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7v7"/><path d="M13 3 3.5 12.5"/></svg>';
const SPOT = new Map(), PIC = new Map(), TILE = new Map(), FAIL = new Map(), Q = [];
let spotAt = 0, busy = 0;

/* ---- where a reference sits on the master plan, as fractions of the sheet ---- */
function sheetOf(lat, lon) {
 try {
  const d1 = (DATA.sheets || []).find(s => s.key === 'D001'), fit = d1 && typeof sheetFitOf === 'function' ? sheetFitOf(d1) : null;
  const fr = fit && fit.fx && fit.fy && typeof frameOf === 'function' ? frameOf(lat, lon) : null; if (!fr) return null;
  const fx = fit.fx.k * fr.ax + fit.fx.c, fy = fit.fy.k * fr.ay + fit.fy.c;
  return fx > 0.002 && fx < 0.998 && fy > 0.002 && fy < 0.998 ? [fx, fy] : null;
 } catch (e) { return null; }
}
function spot(key) {
 if (Date.now() - spotAt > 30000) { SPOT.clear(); spotAt = Date.now(); }
 if (SPOT.has(key)) return SPOT.get(key);
 let s = null;
 try {
  const m = typeof MASTER_LOC === 'object' && MASTER_LOC && MASTER_LOC[key] && Array.isArray(MASTER_LOC[key].pt) ? MASTER_LOC[key] : null;
  const pt = m && Number.isFinite(+m.pt[0]) && Number.isFinite(+m.pt[1]) ? [+m.pt[0], +m.pt[1]] : null;
  let L = null; try { L = W.Find1176 && typeof Find1176.locate === 'function' ? Find1176.locate({kind: 'asset', key}) : null; } catch (e) { L = null; }
  const has = L && Number.isFinite(L.lat) && Number.isFinite(L.lon), report = has && / report here /.test(String(L.tag || ''));
  const p = has ? sheetOf(L.lat, L.lon) : null;
  if (pt && (!p || report || (Math.abs(p[0] - pt[0]) < LANE && Math.abs(p[1] - pt[1]) < LANE))) s = {fx: pt[0], fy: pt[1], exact: m.prec === 'unit', kind: 'plan'};
  else if (p) s = {fx: p[0], fy: p[1], exact: !report && !L.warn, kind: report ? 'report' : 'record'};
  else if (pt) s = {fx: pt[0], fy: pt[1], exact: m.prec === 'unit', kind: 'plan'};
 } catch (e) { s = null; }
 SPOT.set(key, s); return s;
}

/* ---- what it is: the lines grouped by the register's own discipline (Andrew, 26 Oct 2026: "needs to be more orgabise it
   look confusing. catergorise it please") ---- */
const SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const CATS = [
 {k: 'gen', label: 'Generators', c: '#ffb020', disc: /^generators?$/i, pre: /^GN/, icon: SVG('<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>')},
 {k: 'light', label: 'Lighting towers', c: '#ffe066', disc: /^light/i, pre: /^LT/, icon: SVG('<path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8V16h7.6v-1.7A6.5 6.5 0 0 0 12 2.5z"/>')},
 {k: 'bld', label: 'Portable buildings', c: '#5cb8ff', disc: /^portable buildings?$/i, pre: /^P\d/, icon: SVG('<rect x="2.5" y="7" width="19" height="12" rx="1.5"/><path d="M6.5 11h3.5v4H6.5zM14 11h3.5v4H14zM2.5 10h19"/>')},
 {k: 'wc', label: 'Toilets & amenities', c: '#4dd8cf', disc: /^toilets/i, pre: /^(WC|PG)/, icon: SVG('<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 7.5h12M10.5 12v3.5"/>')},
 {k: 'wb', label: 'Water barriers', c: '#ff8a65', disc: /barrier/i, pre: /^WB/, icon: SVG('<path d="M2.5 18h19l-2.4-9H4.9z"/><path d="M8 13.5h8M7 9l1-3.5h8L17 9"/>')},
 {k: 'vms', label: 'VMS boards', c: '#b794ff', disc: /message sign|^vms/i, pre: /^VMS/, icon: SVG('<rect x="2.5" y="3.5" width="19" height="11" rx="1.5"/><path d="M12 14.5v6M8 20.5h8M6.5 7.5h11M6.5 10.5h7"/>')},
 {k: 'plant', label: 'Plant & equipment', c: '#ffa94d', disc: /plant|access/i, pre: /^(EQ|FL)/, icon: SVG('<path d="M3 20.5h10M5 20.5V17h6v3.5M8 17 17.5 6.5M15 4l4.5 4.5M17.5 6.5l1.5 6"/>')},
 {k: 'ground', label: 'Ground protection', c: '#a5d66f', disc: /ground/i, pre: /^TM/, icon: SVG('<path d="M3 7.5h18l-2 4H5zM5 11.5h14l-2 4H7zM7 15.5h10"/>')},
 {k: 'furn', label: 'Furniture & fridges', c: '#8fd3ff', disc: /furniture/i, pre: /^FR/, icon: SVG('<rect x="6" y="2.5" width="12" height="19" rx="1.5"/><path d="M6 9.5h12M9 5.5v2M9 12.5v3.5"/>')},
 {k: 'other', label: 'Everything else', c: '#9fb2bb', disc: /./, pre: /./, icon: SVG('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7M12 8.5v7"/>')}
];
const CAT = new Map(CATS.map(c => [c.k, c])), CATBY = new Map();
function catOf(key) {
 if (CATBY.has(key)) return CATBY.get(key);
 let a = null; try { a = typeof assetOf === 'function' ? assetOf(key) : null; } catch (e) { a = null; }
 const d = String((a && a.discipline) || '').trim(), pr = String((a && a.product) || '').trim();
 let c = d && d !== 'Other' ? CATS.find(x => x.k !== 'other' && x.disc.test(d)) : null;
 if (!c && /forklift|laser|boom|lift/i.test(pr + ' ' + ((a && a.name) || ''))) c = CAT.get('plant');
 if (!c) c = CATS.find(x => x.k !== 'other' && x.pre.test(key)) || CAT.get('other');
 CATBY.set(key, c.k); return c.k;
}
const nat = (a, b) => String(a).localeCompare(String(b), 'en-AU', {numeric: true, sensitivity: 'base'});
const stOf = r => { try { return W.Ready1231 && typeof Ready1231.state === 'function' ? Ready1231.state(r).s : ''; } catch (e) { return ''; } };
/* ---- everything on site in one list (Andrew, 26 Oct 2026: "the demob list should be everything onsite your missing 90% of it";
   "i dont want the fencing in the bracing in the demob"): every reference the demob plan holds, with anything on site that it
   does not (no pick-up day yet), fencing and bracing left out. The tab opens on it; the day lists are one tap away. ---- */
const ALLV = 'everything', FENCE = /fenc|brac/i;
let rendering = 0;
function everyRows(branch) {
 let refs = []; try { refs = demob816().refs || []; } catch (e) { refs = []; }
 const keys = new Set(refs.map(r => r.key)), extra = [];
 try { allAssets().forEach(a => { if (!a || a._cancelled || keys.has(a.key) || FENCE.test(String(a.discipline || '') + ' ' + String(a.product || ''))) return;
  let st = ''; try { st = deliveryOf(a.key).state; } catch (e) { st = ''; } if (st !== 'on site') return;
  extra.push({key: a.key, a, kind: 'other', branch: String(a.branch || ''), zone: 'unknown', side: 'unknown', pt: null, src: '', streams: [], ownerUnk: 0, subCo: '', iso: null, contractEnd: null,
   units: [], evtN: 0, evtUnk: false, evtPure: false, portions: null, qtyChange: null, nothing: false, empty: false, emptied: false, big: false, tank: false, sub: '', noPlan1236: true}); }); } catch (e) {}
 const br = branch == null ? (DM816.branch || 'all') : branch;
 return refs.filter(r => !FENCE.test(String((r.a && r.a.discipline) || ''))).concat(extra).filter(r => br === 'all' || r.branch === br);
}
if (typeof listHtml816 === 'function' && typeof DM816 === 'object' && DM816) {
 const listBefore = listHtml816;
 listHtml816 = function (rows) {
  if (rendering && DM816.view === ALLV) { try { rows = everyRows(); } catch (e) {} }
  if (!Array.isArray(rows) || !rows.length) return listBefore.apply(this, [rows]);
  const order = DM816.order, name = DM816.name;
  try {
   const copies = rows.map(r => Object.assign({}, r, {zone: catOf(r.key), zone1236: r.zone}));
   const sink = r => stOf(r) === 'gone' ? 1 : 0;
   copies.sort((a, b) => sink(a) - sink(b) || nat(a.key, b.key));
   DM816.order = CATS.map(c => c.k); DM816.name = Object.assign({}, name, Object.fromEntries(CATS.map(c => [c.k, c.label])));
   return listBefore.call(this, copies);
  } catch (e) { DM816.order = order; DM816.name = name; return listBefore.apply(this, arguments); }
  finally { DM816.order = order; DM816.name = name; }
 };
 Object.assign(listHtml816, listBefore);
}
const ZONE_OK = /^(gate1|gate2|surfers|mbp|island)$/;

/* ---- its place in words ---- */
let AREA = null;
function areaOf(key) {
 if (!AREA) { AREA = new Map(); try { (SVC1067_CARD.data.areas || []).forEach(a => (a.refs || []).forEach(r => { if (r && r.ref && a.n && !AREA.has(r.ref)) AREA.set(r.ref, {n: a.n, name: a.name}); })); } catch (e) {} }
 return AREA.get(key) || null;
}
function words(key, s, zone) {
 if (s && s.kind === 'report') return ['No drop-off yet', 'the driver reports at the pit lane'];
 const a = areaOf(key); if (a && a.name) return ['Area ' + a.n, a.name];
 let zn = ''; try { zn = zone && ZONE_OK.test(zone) && DM816.name && DM816.name[zone] ? String(DM816.name[zone]) : ''; } catch (e) { zn = ''; }
 const m = typeof MASTER_LOC === 'object' && MASTER_LOC ? MASTER_LOC[key] : null;
 const tidy = x => String(x).replace(/^S(\d+[A-Z]?)\b/, 'Stand S$1').replace(/\s*\(~\s*(\d+)\s*m\)\s*$/, ' · $1 m');
 const near = m ? (m.near || []).map(tidy) : [];
 if (m && m.next && m.next.length) return ['Next to ' + m.next.slice(0, 2).join(' & '), zn || near[0] || ''];
 if (near.length) return ['Near ' + near[0], zn || near[1] || ''];
 return zn ? [zn, ''] : null;
}

/* ---- the map's markup, inside the line's first cell ---- */
function idOf(key, s) { return key + '|' + s.fx.toFixed(5) + ',' + s.fy.toFixed(5) + (s.exact ? '' : ',a'); }
const NOS = new Map(); let nosAt = 0;
function nosOf(r) {
 if (Date.now() - nosAt > 30000) { NOS.clear(); nosAt = Date.now(); }
 if (NOS.has(r.key)) return NOS.get(r.key);
 let n = []; try { n = W.Ready1231 && typeof Ready1231.specs === 'function' ? (Ready1231.specs(r).assetNos || []) : []; } catch (e) { n = []; }
 NOS.set(r.key, n); return n;
}
function located(key) { try { const L = W.Find1176 && Find1176.locate({kind: 'asset', key}); return !!(L && Number.isFinite(L.lat) && Number.isFinite(L.lon)); } catch (e) { return false; } }
function mapHtml(key, zone, nos) {
 const s = spot(key), w = words(key, s, zone);
 const lab = '<span class="lb1236">' + esc(key) + (nos && nos.length ? ' · <span>' + esc(nos[0]) + (nos.length > 1 ? ' +' + (nos.length - 1) : '') + '</span>' : '') + '</span>';
 const cap = w ? '<span class="mpc1236"><b>' + esc(w[0]) + '</b>' + (w[1] ? ' · ' + esc(w[1]) : '') + '</span>' : '';
 if (!s && located(key)) return '<button type="button" class="mp1236" data-map1236="' + esc(key) + '" aria-label="' + esc(key) + ' is off the master plan: open its place on the satellite map"><span class="mpf1236 off"><span class="nm1236">Off the master plan · tap for the satellite map</span></span>' + cap + '</button>';
 if (!s) return '<span class="mp1236"><span class="mpf1236 off"><span class="nm1236">No spot on the plan yet</span></span>' + cap + '</span>';
 const id = idOf(key, s), url = PIC.get(id);
 const tag = s.kind === 'report' ? '<span class="tg1236 rp">Report point</span>' : s.exact ? '' : '<span class="tg1236 ap">Area</span>';
 return '<button type="button" class="mp1236" data-map1236="' + esc(key) + '" aria-label="' + esc(key) + ' on the master plan: open the close-up, directions and send">'
  + '<span class="mpf1236">' + (url ? '' : '<span class="w1236"></span>') + '<img alt="" draggable="false" decoding="async" width="132" height="92" data-id1236="' + esc(id) + '"' + (url ? ' src="' + esc(url) + '" class="on"' : '') + '>'
  + tag + '<span class="tg1236 gn">Gone</span>' + lab + '<span class="go1236" aria-hidden="true">' + ARROW + '</span></span>' + cap + '</button>';
}
const rowBefore = rowHtml816;
rowHtml816 = function (r) {
 const html = rowBefore.apply(this, arguments);
 try {
  if (!r || !r.key) return html;
  const a = html.indexOf('<td class="refcell"'), b = a < 0 ? -1 : html.indexOf('</td>', a);
  return b < 0 ? html : html.slice(0, b) + mapHtml(r.key, r.zone1236 || r.zone, nosOf(r)) + html.slice(b);
 } catch (e) { return html; }
};
Object.assign(rowHtml816, rowBefore);

/* ---- drawing a map from the plan tiles ---- */
function tile(L, tx, ty) {
 const lv = MAP_TILES.levels[L], row = lv && lv.rows && lv.rows[ty], h = row && row[tx];
 if (!h) return Promise.resolve(null);
 const k = L + '/' + tx + '/' + ty;
 if (!TILE.has(k)) TILE.set(k, new Promise(res => {
  const src = DATA.media && DATA.media[h]; if (typeof src !== 'string') { res(null); return; }
  const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => { TILE.delete(k); res(null); }; im.src = src; }));
 return TILE.get(k);
}
async function draw(id) {
 const pos = id.slice(id.lastIndexOf('|') + 1).split(','), fx = +pos[0], fy = +pos[1], approx = pos[2] === 'a';
 if (!Number.isFinite(fx) || !Number.isFinite(fy)) return null;
 const Ls = MAP_TILES.levels, need = OUT.w / ACROSS; let L = 0;
 while (L < Ls.length - 1 && Ls[L].w / Ls[0].w < need) L++;
 const lv = Ls[L], T = MAP_TILES.tile || 512, k = lv.w / Ls[0].w, vw = ACROSS * k, vh = vw * OUT.h / OUT.w;
 const x0 = fx * lv.w - vw / 2, y0 = fy * lv.h - vh / 2, jobs = [];
 for (let ty = Math.max(0, Math.floor(y0 / T)); ty <= Math.min(lv.rows.length - 1, Math.floor((y0 + vh) / T)); ty++)
  for (let tx = Math.max(0, Math.floor(x0 / T)); tx <= Math.floor((x0 + vw) / T); tx++) jobs.push(tile(L, tx, ty).then(im => im && {im, tx, ty}));
 const got = (await Promise.all(jobs)).filter(Boolean); if (!got.length) return null;
 const cv = D.createElement('canvas'); cv.width = OUT.w; cv.height = OUT.h; const c = cv.getContext('2d'); if (!c) return null;
 const sc = OUT.w / vw;
 c.fillStyle = '#efece6'; c.fillRect(0, 0, OUT.w, OUT.h); c.imageSmoothingEnabled = true; try { c.imageSmoothingQuality = 'high'; } catch (e) {}
 got.forEach(g => c.drawImage(g.im, (g.tx * T - x0) * sc, (g.ty * T - y0) * sc, g.im.naturalWidth * sc, g.im.naturalHeight * sc));
 /* the ring, red as the master-plan pictures draw it, on a white halo so it reads on any colour of the drawing */
 const X = OUT.w / 2, Y = OUT.h / 2, R = OUT.w * 0.118;
 c.save(); if (approx) c.setLineDash([OUT.w * 0.052, OUT.w * 0.03]);
 c.lineWidth = OUT.w * 0.038; c.strokeStyle = 'rgba(255,255,255,.88)'; c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.stroke();
 c.lineWidth = OUT.w * 0.021; c.strokeStyle = '#d7261e'; c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.stroke(); c.restore();
 /* a soft edge so the paper meets the dark card gently */
 const g = c.createRadialGradient(X, Y, OUT.h * 0.42, X, Y, OUT.w * 0.74); g.addColorStop(0, 'rgba(15,27,33,0)'); g.addColorStop(1, 'rgba(15,27,33,.30)');
 c.fillStyle = g; c.fillRect(0, 0, OUT.w, OUT.h);
 return await new Promise(res => { try { cv.toBlob(b => res(b ? URL.createObjectURL(b) : null), 'image/jpeg', 0.86); } catch (e) { res(null); } });
}
function show(id) {
 const url = PIC.get(id); if (!url) return;
 D.querySelectorAll('#pane-demob img[data-id1236]:not(.on)').forEach(im => {
  if (im.getAttribute('data-id1236') !== id) return;
  im.src = url; im.classList.add('on'); const w = im.parentNode && im.parentNode.querySelector('.w1236'); if (w) w.remove(); });
}
function failed(id) {
 D.querySelectorAll('#pane-demob img[data-id1236]:not(.on)').forEach(im => {
  if (im.getAttribute('data-id1236') !== id || !im.parentNode) return;
  const f = im.parentNode, w = f.querySelector('.w1236'); if (w) w.remove();
  if (!f.querySelector('.nm1236')) { f.classList.add('off'); f.insertAdjacentHTML('beforeend', '<span class="nm1236">The plan did not load · tap for the map</span>'); } });
}
function pump() {
 while (busy < 3 && Q.length) {
  const id = Q.shift(); if (PIC.has(id)) { show(id); continue; }
  busy++;
  draw(id).then(url => { if (url) { PIC.set(id, url); show(id); } else { FAIL.set(id, Date.now()); failed(id); } })
   .catch(() => { FAIL.set(id, Date.now()); failed(id); })
   .then(() => { busy--; pump(); });
 }
}
function want(id) {
 if (!id) return;
 if (PIC.has(id)) { show(id); return; }
 if (FAIL.has(id) && Date.now() - FAIL.get(id) < 60000) { failed(id); return; }
 if (!Q.includes(id)) { Q.push(id); pump(); }
}
let io = null, ioRoot;
function scroller() {
 const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement;
 while (sc && sc !== D.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY)) return sc; sc = sc.parentElement; }
 return null;
}
function arm() {
 const imgs = D.querySelectorAll('#pane-demob img[data-id1236]:not(.on)'); if (!imgs.length) return;
 if (!('IntersectionObserver' in W)) { imgs.forEach(im => want(im.getAttribute('data-id1236'))); return; }
 const root = scroller();
 if (!io || ioRoot !== root) {
  if (io) io.disconnect(); ioRoot = root;
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); want(e.target.getAttribute('data-id1236')); } }), {root, rootMargin: '600px 0px'});
 }
 imgs.forEach(im => io.observe(im));
}

/* ---- the whole site on the master plan ---- */
const ORDER = {gone: 0, part: 1, unchecked: 2, ready: 3, not: 4}, WORD = {not: 'Not ready', ready: 'Ready', gone: 'Picked up', part: 'Part picked up', unchecked: 'Not checked yet'};
let lastSig = '', box = null;
function siteBox() {
 if (box) return box;
 let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
 try { Object.values(MASTER_LOC || {}).forEach(m => { if (!m || !Array.isArray(m.pt)) return; x0 = Math.min(x0, +m.pt[0]); x1 = Math.max(x1, +m.pt[0]); y0 = Math.min(y0, +m.pt[1]); y1 = Math.max(y1, +m.pt[1]); }); } catch (e) {}
 if (!(x1 > x0 && y1 > y0)) { x0 = 0; x1 = 1; y0 = 0; y1 = 1; }
 const mx = 0.025, my = 0.035;
 box = {x0: Math.max(0, x0 - mx), x1: Math.min(1, x1 + mx), y0: Math.max(0, y0 - my), y1: Math.min(1, y1 + my)}; return box;
}
function sheetUrl() {
 let tok = 'Coates-GC500-2026';
 try { const u = Object.values(DATA.media || {}).find(v => typeof v === 'string' && v.indexOf('/m/') === 0); if (u) tok = u.split('/')[2] || tok; } catch (e) {}
 return '/w/' + tok + '/explorer/assets/sheet-overview.webp';
}
function overview() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const old = pane.querySelector('.ov1236'), rows = [...pane.querySelectorAll('tr[data-row816]')];
 if (!rows.length || !pane.querySelector('.sec1231')) { if (old) old.remove(); lastSig = ''; return; }
 const seen = new Set(), dots = [], n = {not: 0, ready: 0, gone: 0, part: 0, unchecked: 0}, cats = new Map(); let off = 0;
 rows.forEach(tr => {
  const k = tr.getAttribute('data-row816'); if (!k || seen.has(k)) return; seen.add(k);
  const st = ORDER[tr.getAttribute('data-ps1236')] != null ? tr.getAttribute('data-ps1236') : 'unchecked'; n[st]++;
  const ck = catOf(k), ce = cats.get(ck) || {n: 0, ready: 0, gone: 0}; ce.n++; if (st === 'ready') ce.ready++; if (st === 'gone') ce.gone++; cats.set(ck, ce);
  const s = spot(k); if (!s) { off++; return; } dots.push({k, s, st}); });
 const chips = CATS.filter(c => cats.has(c.k)).map(c => { const e = cats.get(c.k);
  return '<button type="button" class="cc1236" data-catgo1236="' + c.k + '" style="--cc:' + c.c + '" aria-label="' + esc(c.label + ': ' + e.n + (e.ready ? ', ' + e.ready + ' ready' : '') + (e.gone ? ', ' + e.gone + ' picked up' : '') + '. Go to the group') + '"><i>' + c.icon + '</i><span>' + esc(c.label) + '</span><b>' + e.n + '</b>' + (e.ready ? '<em class="ready" title="' + e.ready + ' ready">' + e.ready + '</em>' : '') + (e.gone ? '<em class="gone" title="' + e.gone + ' picked up">' + e.gone + '</em>' : '') + '</button>'; }).join('');
 const sig = DM816.view + '#' + dots.map(d => d.k + ':' + d.st + ':' + d.s.fx.toFixed(4) + ',' + d.s.fy.toFixed(4)).join('|') + '#' + off + '#' + chips;
 if (old && sig === lastSig && old.isConnected) return;
 const B = Object.assign({}, siteBox());
 dots.forEach(d => { B.x0 = Math.max(0, Math.min(B.x0, d.s.fx - 0.02)); B.x1 = Math.min(1, Math.max(B.x1, d.s.fx + 0.02)); B.y0 = Math.max(0, Math.min(B.y0, d.s.fy - 0.03)); B.y1 = Math.min(1, Math.max(B.y1, d.s.fy + 0.03)); });
 const bw = B.x1 - B.x0, bh = B.y1 - B.y0;
 const day = (() => { try { return dayWords816(DM816.sel); } catch (e) { return ''; } })();
 const parts = rows.filter(tr => tr.dataset.part1236 === '1').map(tr => tr.getAttribute('data-row816')).filter((k, i, a) => a.indexOf(k) === i).length;
 const legend = ['ready', 'not', 'unchecked', 'gone'].filter(k => n[k]).map(k => '<span><i class="' + k + '"></i>' + WORD[k] + ' ' + n[k] + '</span>').join('') + (parts ? '<span><i class="part"></i>' + parts + ' part picked up</span>' : '');
 const ds = dots.slice().sort((a, b) => ORDER[a.st] - ORDER[b.st]).map(d =>
  '<button type="button" class="dot1236 ' + d.st + '" data-dot1236="' + esc(d.k) + '" style="left:' + (d.s.fx * 100).toFixed(3) + '%;top:' + (d.s.fy * 100).toFixed(3) + '%" title="' + esc(d.k + ' · ' + WORD[d.st]) + '" aria-label="' + esc(d.k + ', ' + WORD[d.st].toLowerCase() + ': go to its line') + '"></button>').join('');
 const html = '<section class="ov1236" aria-labelledby="ovh1236"><div class="oh1236"><h3 id="ovh1236">On the master plan' + (DM816.view === ALLV ? ' · everything on site' : day ? ' · ' + esc(day) : '') + '<small>Every line below, where it sits, grouped by what it is. Tap a group to go to it, a dot to go to its line, a card\'s map for the close-up and directions.</small></h3><div class="lg1236">' + legend + '</div></div>'
  + (chips ? '<nav class="cn1236" aria-label="Go to a group">' + chips + '</nav>' : '')
  + '<div class="pl1236" style="aspect-ratio:' + (bw * 1192).toFixed(0) + '/' + (bh * 842).toFixed(0) + '"><div class="pz1236" style="left:' + (-B.x0 / bw * 100).toFixed(3) + '%;top:' + (-B.y0 / bh * 100).toFixed(3) + '%;width:' + (100 / bw).toFixed(3) + '%;height:' + (100 / bh).toFixed(3) + '%">'
  + '<img alt="The master plan D001-26003-03" decoding="async" draggable="false" src="' + esc(sheetUrl()) + '">' + ds + '</div></div>'
  + '<p class="ft1236">Master plan D001-26003-03 (iEDM, rev 03). Places as the page holds them: Andrew\'s own pins first, then the plan' + (off ? '; ' + off + ' line' + (off === 1 ? ' has' : 's have') + ' no position yet and ' + (off === 1 ? 'is' : 'are') + ' not drawn' : '') + '.</p></section>';
 const tmp = D.createElement('div'); tmp.innerHTML = html; const sec = tmp.firstElementChild;
 const img = sec.querySelector('.pz1236 img'), done = () => img.classList.add('on'); img.addEventListener('load', done); img.addEventListener('error', () => { img.remove(); });
 if (old) old.replaceWith(sec);
 else { const sum = pane.querySelector('.sum1231'), first = pane.querySelector('.sec1231'); if (sum && sum.parentNode) sum.after(sec); else if (first && first.parentNode) first.before(sec); else return; }
 if (img.complete && img.naturalWidth) done();
 lastSig = sig;
}

/* ---- each group's header: its picture, its name and count, and its lights ---- */
function headers() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const byLabel = new Map(CATS.map(c => [c.label, c]));
 pane.querySelectorAll('.sec1231 tr.zr1231').forEach(tr => {
  const th = tr.querySelector('th'); if (!th) return;
  const t = th.firstChild && th.firstChild.nodeType === 3 ? th.firstChild.nodeValue.trim() : '';
  const c = tr.dataset.cat1236 ? CAT.get(tr.dataset.cat1236) : byLabel.get(t); if (!c) return;
  const n = {not: 0, ready: 0, gone: 0, part: 0, unchecked: 0}; let x = tr.nextElementSibling;
  while (x && !x.classList.contains('zr1231')) { const st = x.getAttribute('data-ps1236'); if (n[st] != null) n[st]++; x = x.nextElementSibling; }
  const pills = ['ready', 'not', 'unchecked', 'part', 'gone'].filter(k => n[k]).map(k => '<b class="' + k + '" title="' + n[k] + ' ' + WORD[k].toLowerCase() + '">' + n[k] + '<span> ' + WORD[k].toLowerCase() + '</span></b>').join('');
  if (tr.dataset.cat1236 === c.k && tr.dataset.cs1236 === pills) return;
  tr.dataset.cat1236 = c.k; tr.dataset.cs1236 = pills; tr.style.setProperty('--cc', c.c);
  let ic = th.querySelector('.ci1236'); if (!ic) th.insertAdjacentHTML('afterbegin', '<i class="ci1236">' + c.icon + '</i>');
  let cs = th.querySelector('.cs1236'); if (!cs) { th.insertAdjacentHTML('beforeend', '<em class="cs1236"></em>'); cs = th.querySelector('.cs1236'); }
  cs.innerHTML = pills;
 });
}
function goCat(k) {
 const z = D.querySelector('#pane-demob .sec1231 tr.zr1231[data-cat1236="' + k + '"]:not([hidden])'); if (!z) return false;
 try { z.scrollIntoView({behavior: 'smooth', block: 'start'}); } catch (e) { z.scrollIntoView(); }
 return true;
}

/* ---- what is really happening on each line (Andrew, 26 Oct 2026: "cards are not updated with what was picked up i dont want
   thing to say not picked up we are creating this so we know what can be picked up. not work to a schedule that does not work"):
   picked up, part picked up, ready, not ready (someone said so), or not checked yet - quiet, not red. In the everything view the
   plan's day and load come off the card; the pick-up time is the one someone books. ---- */
const PS_WORD = {gone: 'Picked up', part: 'Part picked up', ready: 'Ready', not: 'Not ready', unchecked: 'Not checked yet'};
function rowsByKey() { const m = new Map(); try { everyRows('all').forEach(r => m.set(r.key, r)); } catch (e) {} return m; }
function psOf(r) {
 let st = null; try { st = W.Ready1231 ? Ready1231.state(r) : null; } catch (e) { st = null; }
 if (!st) return {ps: 'unchecked', st: null};
 const ps = st.s === 'gone' ? 'gone' : st.s === 'ready' ? 'ready' : st.unchecked ? 'unchecked' : 'not';
 return {ps, st, part: !!(st.part && st.part.collected > 0 && !st.part.complete)};
}
function statuses() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const card = pane.querySelector('.dmday816'); if (card) { if (DM816.view === ALLV) card.setAttribute('data-ev1236', ''); else card.removeAttribute('data-ev1236'); }
 const by = rowsByKey();
 pane.querySelectorAll('tr[data-row816]').forEach(tr => {
  const r = by.get(tr.getAttribute('data-row816')); if (!r) return;
  const {ps, st, part} = psOf(r);
  if (tr.dataset.ps1236 !== ps) tr.dataset.ps1236 = ps;
  if (part) tr.dataset.part1236 = '1'; else delete tr.dataset.part1236;
  const td = tr.querySelector('td.st1231');
  if (td && ps === 'unchecked' && !td.dataset.u1236) { td.dataset.u1236 = '1'; const w = td.querySelector('.sw1231'); if (w) w.textContent = 'Not checked yet'; const n = td.querySelector('.sw1231 + small, small'); if (n && /not checked/i.test(n.textContent)) n.textContent = 'on site, ready not ticked'; }
  if (td && part && !td.querySelector('.pt1236,.pt1231')) td.insertAdjacentHTML('beforeend', '<span class="pt1236">' + st.part.collected + ' picked up · ' + st.part.remaining + ' still on site</span>');
  if (DM816.view === ALLV) { const pk = tr.querySelector('td.pk1231'); if (pk && !pk.querySelector('.bk1236')) pk.insertAdjacentHTML('afterbegin', ps === 'gone' ? '<span class="bk1236"><b>Left site</b></span>' : '<span class="bk1236">Pick-up time: <b>to be booked</b></span>'); }
 });
}
function progress() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const card = pane.querySelector('.dmday816'); if (!card) return;
 let M = null, w = null; try { M = demob816(); w = DemobProgress996.whole(M, todayIso()); } catch (e) { return; }
 if (!w || !w.readings) return;
 const n = a => (a || []).reduce((t, u) => t + (Number(u.n) || 0), 0);
 let req = 0, col = 0; const byDay = new Map();
 w.readings.forEach(x => { req += n(x.required); col += n(x.collected); (x.events || []).forEach(e => { const d = String(e.date || '').slice(0, 10); if (d) byDay.set(d, (byDay.get(d) || 0) + n(e.items)); }); });
 if (!req) return;
 const days = (M.days || []).slice(), today = todayIso(), ti = days.indexOf(today), N = days.length || 1;
 const pct = Math.min(100, col / req * 100), left = ti >= 0 ? N - ti : days.filter(d => d >= today).length;
 const pace = ti >= 0 ? (ti + 1) / N * 100 : null, need = left > 0 ? (100 - pct) / left : null;
 const shown = pct < 10 ? pct.toFixed(1) : Math.round(pct).toString();
 /* the actual line: the share off site by the end of each day so far (anything that left before the first demob day counts on it) */
 const pts = []; let run = 0; [...byDay.keys()].filter(d => d < days[0]).forEach(d => run += byDay.get(d));
 days.forEach((d, i) => { if (d > today) return; run += byDay.get(d) || 0; pts.push([i, Math.min(100, run / req * 100)]); });
 const W0 = 640, H0 = 210, L = 38, R = 14, T = 12, B = 30, X = i => L + (i + 1) / N * (W0 - L - R), Y = v => T + (1 - v / 100) * (H0 - T - B), X0 = L;
 const grid = [0, 25, 50, 75, 100].map(v => '<line x1="' + L + '" x2="' + (W0 - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#ffffff1a"/><text x="' + (L - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" fill="#8fa8b2" font-size="10" text-anchor="end">' + v + '%</text>').join('');
 const labs = days.map((d, i) => { const f = new Date(d + 'T12:00:00Z'), lab = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][f.getUTCDay()].slice(0, 1) + ' ' + f.getUTCDate();
  return '<text x="' + X(i).toFixed(1) + '" y="' + (H0 - 10) + '" fill="' + (d === today ? '#ffb37a' : '#8fa8b2') + '" font-size="9.5" font-weight="' + (d === today ? 800 : 600) + '" text-anchor="middle">' + lab + '</text>'; }).join('');
 const paceLine = '<line x1="' + X0 + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(N - 1).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '" stroke="#8fb1bd" stroke-width="2" stroke-dasharray="6 5"/>';
 const path = pts.length ? 'M' + X0 + ' ' + Y(0).toFixed(1) + pts.map(p => ' L' + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('') : '';
 const area = path ? '<path d="' + path + ' L' + X(pts[pts.length - 1][0]).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z" fill="#ff8a3a24"/>' : '';
 const last = pts[pts.length - 1];
 const dot = last ? '<circle cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="5.5" fill="#ff8a3a" stroke="#fff" stroke-width="2"/><text x="' + (X(last[0]) + 9).toFixed(1) + '" y="' + (Y(last[1]) - 8).toFixed(1) + '" fill="#fff" font-size="12" font-weight="800">' + shown + '%</text>' : '';
 const todayLine = ti >= 0 ? '<line x1="' + X(ti).toFixed(1) + '" x2="' + X(ti).toFixed(1) + '" y1="' + T + '" y2="' + (H0 - B) + '" stroke="#ffb37a55" stroke-dasharray="2 3"/>' : '';
 const svg = '<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + esc(shown + ' percent of the demob units off site by day ' + (ti + 1) + ' of ' + N + '; the dashed line is the even pace to finish on the last demob day') + '">' + grid + todayLine + paceLine + area + (path ? '<path d="' + path + '" fill="none" stroke="#ff8a3a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' : '') + dot + labs + '</svg>';
 const C = 2 * Math.PI * 52, off = C * (1 - pct / 100);
 const ring = '<div class="rg1236"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="#ffffff1a" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="#ff8a3a" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + shown + '<small>%</small></b></div>';
 const end = days.length ? (() => { const f = new Date(days[days.length - 1] + 'T12:00:00Z'); return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][f.getUTCDay()] + ' ' + f.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][f.getUTCMonth()]; })() : '';
 const ahead = pace != null && pct >= pace;
 const verdict = pace == null ? '' : '<span class="vd1236 ' + (ahead ? 'ok' : 'no') + '">' + (ahead ? 'On pace to finish by ' + esc(end) : 'Even pace is ' + Math.round(pace) + '% by tonight') + '</span>';
 const html = '<section class="pg1236" aria-labelledby="pgh1236"><div class="pk1236">' + ring + '<div class="tx1236"><h3 id="pgh1236">Demob complete</h3>'
  + '<p><b>' + col + ' of ' + req + '</b> units off site</p><p><b>' + w.completed + ' of ' + w.total + '</b> references fully gone</p>'
  + (ti >= 0 ? '<p>Day <b>' + (ti + 1) + ' of ' + N + '</b> · finishes <b>' + esc(end) + '</b>' + (N - ti - 1 > 0 ? ' · ' + (N - ti - 1) + ' more demob day' + (N - ti - 1 === 1 ? '' : 's') : '') + '</p>' : '')
  + (need != null && need > 0 ? '<p><b>' + need.toFixed(1) + '%</b> a day from here finishes on time</p>' : '') + verdict + '</div></div>'
  + '<div class="ch1236">' + svg + '<div class="kl1236"><span><i></i>Off site so far</span><span><i class="pace"></i>Even pace to finish by ' + esc(end) + '</span></div></div></section>';
 const sig = [col, req, w.completed, w.total, today, DM816.view].join('|'), old = card.querySelector('.pg1236');
 if (old && old.dataset.sig === sig) return;
 const tmp = D.createElement('div'); tmp.innerHTML = html; const sec = tmp.firstElementChild; sec.dataset.sig = sig;
 if (old) old.replaceWith(sec); else { const first = card.querySelector('.sum1231') || card.querySelector('.ov1236') || card.querySelector('.sec1231'); if (first && first.parentNode) first.before(sec); }
}

/* ---- after every render of the tab ---- */
function tally() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const b = pane.querySelector('.sum1231 [data-f1231="not"]'); if (!b) return;
 const seen = new Map(); pane.querySelectorAll('tr[data-row816]').forEach(tr => seen.set(tr.getAttribute('data-row816'), tr.dataset.ps1236));
 let no = 0, un = 0; seen.forEach(v => { if (v === 'not') no++; else if (v === 'unchecked') un++; });
 const html = '<b>' + no + '</b> not ready · <b>' + un + '</b> not checked yet'; if (b.innerHTML !== html) b.innerHTML = html;
}
function titles() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const segs = pane.querySelector('.segs816'); if (!segs) return;
 const all = everyRows('all'), mine = everyRows(), on = DM816.view === ALLV;
 let b = segs.querySelector('[data-view816="' + ALLV + '"]');
 if (!b) { segs.insertAdjacentHTML('afterbegin', '<button type="button" class="btn sm ev1236" data-view816="' + ALLV + '"></button>'); b = segs.querySelector('[data-view816="' + ALLV + '"]'); }
 b.textContent = 'Everything on site · ' + mine.length; b.setAttribute('aria-pressed', String(on));
 if (!on) return;
 const h = pane.querySelector('.dmsh816 h3'); if (h && !h.dataset.ev1236) { h.dataset.ev1236 = '1'; h.textContent = 'Everything on site · ' + mine.length + (mine.length === 1 ? ' reference' : ' references'); }
 const t = pane.querySelector('.sum1231 .h1231'); if (t) t.textContent = 'Everything on site · ' + mine.length;
 pane.querySelectorAll('[data-br816]').forEach(x => { const k = x.dataset.br816; if (k !== 'all') x.textContent = k + ' ' + all.filter(r => r.branch === k).length; });
 pane.querySelectorAll('.dday816.on').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
}
function departedNos() {
 const out = new Map();
 try { DemobProgress996.whole(demob816(), todayIso()).readings.forEach(x => (x.events || []).forEach(e => (e.items || []).forEach(i => (i.numbers || []).forEach(n => { if (!out.has(x.key)) out.set(x.key, new Set()); out.get(x.key).add(String(n)); })))); } catch (e) {}
 return out;
}
function nosLine(tr, by, gone) {
 const k = tr.getAttribute('data-row816'), r = by.get(k), set = gone.get(k); if (!r || !set || !set.size) return;
 const an = tr.querySelector('.sp1231 .an1231'); if (!an || an.dataset.n1236) return;
 const all = nosOf(r); if (!all.length) return;
 const still = all.filter(n => !set.has(n)), left = all.filter(n => set.has(n)), cap = 8, show = still.slice(0, cap), more = still.length - show.length;
 an.dataset.n1236 = '1';
 an.innerHTML = (still.length ? 'Asset no. <b>' + esc(show.join(' · ')) + '</b>' + (more > 0 ? ' <em>+' + more + ' more on site</em>' : '') : 'Asset no.') +
  '<span class="gn1236">Picked up: ' + left.slice(0, 6).map(n => '<s>' + esc(n) + '</s>').join(' ') + (left.length > 6 ? ' +' + (left.length - 6) : '') + '</span>';
}
const PILL = t => /\bkg\b/i.test(t) ? 'Weight' : /\bmm\b/i.test(t) ? 'Size' : /\bkva\b/i.test(t) ? 'Rating' : '';
function pills() {
 const by = rowsByKey(), gone = departedNos();
 D.querySelectorAll('#pane-demob tr[data-part1236]').forEach(tr => { try { nosLine(tr, by, gone); } catch (e) {} });
 D.querySelectorAll('#pane-demob .sp1231:not([data-p1236])').forEach(sp => {
  sp.dataset.p1236 = '1';
  const fx = sp.querySelector('.fx1231'); const txt = fx && !fx.classList.contains('none') ? fx.textContent : '';
  let parts = txt.split(' · ').map(x => x.trim()).filter(Boolean);
  const dim = {}; let g0 = false;
  parts = parts.filter(t => { const m = t.match(/^(guide(?: range)?\s+)?(Length|Width|Height)\s+(.+?)\s*mm\b/i); if (!m) return true; if (m[1]) g0 = true; dim[m[2].toLowerCase()] = m[3]; return false; });
  if (dim.length || dim.width || dim.height) parts.unshift((g0 ? 'guide ' : '') + [dim.length || '?', dim.width || '?', dim.height || '?'].join(' × ') + ' mm');
  parts = parts.map(t => t.replace(/^(guide(?: range)?\s+)?Mass\s+/i, '$1'));
  const have = {Size: false, Weight: false};
  const html = parts.map(t => { const k = PILL(t), g = /^guide\b/i.test(t), v = t.replace(/^guide( range)?\s+/i, '').replace(/\s*\((description|delivered|contract)\)\s*$/i, '');
   if (k) have[k] = true;
   return '<span class="pp1236' + (k ? ' ' + k.toLowerCase() : '') + '">' + (k ? '<i>' + k + '</i>' : '') + esc(v) + (g ? '<em>guide</em>' : /\((description|contract)\)/i.test(t) ? '<em>' + esc(t.match(/\((description|contract)\)/i)[1]) + '</em>' : '') + '</span>'; }).join('')
   + (have.Size ? '' : '<span class="pp1236 size none"><i>Size</i>to confirm</span>') + (have.Weight ? '' : '<span class="pp1236 weight none"><i>Weight</i>to confirm</span>');
  const box = D.createElement('div'); box.className = 'ps1236'; box.innerHTML = html;
  if (fx) fx.replaceWith(box); else sp.appendChild(box);
 });
}
function after() { try { titles(); } catch (e) {} try { statuses(); } catch (e) {} try { tally(); } catch (e) {} try { pills(); } catch (e) {} try { arm(); } catch (e) {} try { headers(); } catch (e) {} try { overview(); } catch (e) {} try { progress(); } catch (e) {} }
const renderBefore = renderDemob816;
renderDemob816 = function () { let v; rendering++; try { v = renderBefore.apply(this, arguments); } finally { rendering--; } after(); return v; };
Object.assign(renderDemob816, renderBefore);
let raf = 0;
function soon() { if (raf) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; after(); }); }
function watch() {
 const pane = D.getElementById('pane-demob'); if (!pane || pane.__map1236) return; pane.__map1236 = true;
 new MutationObserver(ms => { if (ms.every(m => m.target && m.target.closest && m.target.closest('.ov1236,.mpf1236'))) return; soon(); }).observe(pane, {childList: true, subtree: true});
}

/* ---- taps ---- */
function openMap(key) {
 try { if (W.Find1176 && typeof Find1176.open === 'function') { const L = Find1176.locate({kind: 'asset', key}); if (L) { Find1176.open(L); return true; } } } catch (e) {}
 try { const b = D.querySelector('#pane-demob [data-k816="' + (W.CSS && CSS.escape ? CSS.escape(key) : key) + '"]'); if (b) { b.click(); return true; } } catch (e) {}
 return false;
}
function goLine(key) {
 const sel = '#pane-demob tr[data-row816="' + (W.CSS && CSS.escape ? CSS.escape(key) : key) + '"]', tr = D.querySelector(sel); if (!tr) return false;
 try { tr.scrollIntoView({behavior: 'smooth', block: 'center'}); } catch (e) { tr.scrollIntoView(); }
 tr.classList.remove('fl1236'); void tr.offsetWidth; tr.classList.add('fl1236'); setTimeout(() => tr.classList.remove('fl1236'), 1800);
 return true;
}
D.addEventListener('click', ev => {
 const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
 const m = t.closest('#pane-demob [data-map1236]');
 if (m) { ev.preventDefault(); ev.stopPropagation(); openMap(m.getAttribute('data-map1236')); return; }
 const d = t.closest('#pane-demob [data-dot1236]');
 if (d) { ev.preventDefault(); ev.stopPropagation(); goLine(d.getAttribute('data-dot1236')); return; }
 const g = t.closest('#pane-demob [data-catgo1236]');
 if (g) { ev.preventDefault(); ev.stopPropagation(); goCat(g.getAttribute('data-catgo1236')); return; }
 const v = t.closest('#pane-demob [data-view816="' + ALLV + '"]');
 if (v) { ev.preventDefault(); ev.stopPropagation(); DM816.view = ALLV; renderDemob816(); try { applyCapability(); } catch (e) {} return; }
 if (DM816.view === ALLV && t.closest('#pane-demob [data-dday816]')) DM816.view = 'list';
}, true);

W.DemobMap1236 = Object.freeze({spot, words, draw, openMap, goLine, goCat, catOf, CATS: CATS.map(c => ({k: c.k, label: c.label})), release: 'v12.36'});
try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map) RENDER_MEMO.delete('demob816'); } catch (e) {}
if (!DM816.view || DM816.view === 'list') DM816.view = ALLV;
watch();
try { const p = D.getElementById('pane-demob'); if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816(); } catch (e) {}
})(window);
</script>
