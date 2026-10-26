<style id="demob1234-style">
/* Author: Andrew Fisher. v12.34 - the Demob tab's look. Andrew, 26 Oct 2026: "We need this to look better come on mate."
   The pick-up list in the servicing tracker's dark style: each line a compact card on a phone (the plate and what it is, its
   branch, the three lights with the status beside them, the pick-up day and time with the More button), the Coates and
   Sub-hired sections dark, and the desktop table to match. Presentation only: the same cells, words, lights and buttons; no
   record, plan, rule or count changes. Screen only: print keeps the page's own light table. */
@media screen{
#pane-demob .sec1231{--dk-bg:#0f1b21;--dk-bg2:#0b151a;--dk-card:#162730;--dk-card2:#1b2f39;--dk-line:#ffffff14;--dk-ink:#f2f7f9;--dk-mute:#a3b7bf;--dk-dim:#728a94;
  --dk-red:#ff7469;--dk-amber:#ffc24b;--dk-green:#52e897;border-color:#0a1317;background:var(--dk-bg);box-shadow:0 10px 26px #0b141a40}
#pane-demob .sec1231.sub{--dk-bg:#0b2129;--dk-bg2:#081a21;--dk-card:#102f3b;--dk-card2:#143846}
#pane-demob .sec1231>.sb1231{background:linear-gradient(180deg,var(--dk-bg),var(--dk-bg2))}
#pane-demob .sec1231 .tblwrap{background:transparent;border:0;border-radius:0;box-shadow:none}
#pane-demob .sec1231 table.dm1231{background:transparent;color:var(--dk-ink)}
#pane-demob .sec1231 table.dm1231 tr{background:transparent}
#pane-demob .sec1231 tr[data-row816][data-st1231=not]{--st:#e5463b}
#pane-demob .sec1231 tr[data-row816][data-st1231=ready]{--st:#f5a524}
#pane-demob .sec1231 tr[data-row816][data-st1231=gone]{--st:#19c46a}
/* the areas: quiet separators */
#pane-demob .sec1231 table.dm1231 tr.zr1231 th{color:#8fb1bd;background:transparent;box-shadow:none;border:0;font:800 11.5px/1.2 Inter,Arial,sans-serif;letter-spacing:.1em}
#pane-demob .sec1231 table.dm1231 tr.zr1231 th span{background:#ffffff14;color:#d8e8ee}
/* what it is */
#pane-demob .sec1231 table.dm1231 td[data-label="What"]{color:var(--dk-ink);font:700 14px/1.3 Inter,Arial,sans-serif}
#pane-demob .sec1231 .sp1231{color:var(--dk-mute);font:500 11.5px/1.45 Inter,Arial,sans-serif;margin-top:4px}
#pane-demob .sec1231 .sp1231 .an1231 b{color:#e9f1f4}
#pane-demob .sec1231 .sp1231 em{color:#ffb37a}
#pane-demob .sec1231 .sp1231 .fx1231.none{color:var(--dk-dim)}
/* the pick-up */
#pane-demob .sec1231 .pd1231 b{color:#fff}
#pane-demob .sec1231 .pd1231 .tm1231{color:#ffa45c}
#pane-demob .sec1231 .pd1231 small{color:var(--dk-mute)}
#pane-demob .sec1231 .chip.src816{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:#ffffff0d;border:1px solid #ffffff2e;color:#dfe9ee;font:800 9.5px/1.1 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:none}
#pane-demob .sec1231 .chip.src816.s-contract{color:#ffd48f;border-color:#ffd48f59;background:#ffd48f12}
#pane-demob .sec1231 .chip.src816.s-plan{color:#a6d8ff;border-color:#a6d8ff59;background:#a6d8ff12}
#pane-demob .sec1231 .chip.src816.s-proposed{color:#ffb4a8;border-color:#ffb4a873;border-style:dashed;background:transparent}
#pane-demob .sec1231 .chip.src816.s-confirmed{color:#82f0b4;border-color:#82f0b459;background:#82f0b412}
#pane-demob .sec1231 .chip.own1231{background:#ffffff10;color:#cfe6ee;border-color:#ffffff2e}
#pane-demob .sec1231 .chip.own1231.s{background:#22c3e61f;color:#9be8f8;border-color:#22c3e666}
/* the status: the lit lamp carries the colour; the words beside it are calm */
#pane-demob .sec1231 .lamps1231{background:linear-gradient(180deg,#1d2a31,#0c1317);box-shadow:inset 0 1px #ffffff14,inset 0 -2px 6px #0008,0 0 0 1px #00000059}
#pane-demob .sec1231 .sw1231{font:800 12.5px/1.25 Inter,Arial,sans-serif}
#pane-demob .sec1231 .sw1231.no{color:var(--dk-red)}
#pane-demob .sec1231 .sw1231.ok{color:var(--dk-amber)}
#pane-demob .sec1231 .sw1231.gone{color:var(--dk-green)}
#pane-demob .sec1231 .st1231 small{color:var(--dk-mute)}
#pane-demob .sec1231 .st1231 small b{color:#e9f1f4}
#pane-demob .sec1231 .st1231 .pt1231{color:#ffb37a}
#pane-demob .sec1231 .pill1231.no{background:#ff74691a;color:#ffb1aa;box-shadow:inset 0 0 0 1px #ff746959}
#pane-demob .sec1231 .pill1231.ok{background:#ffc24b1a;color:#ffd98a;box-shadow:inset 0 0 0 1px #ffc24b59}
#pane-demob .sec1231 .pill1231.gone{background:#52e8971a;color:#9df5c4;box-shadow:inset 0 0 0 1px #52e89759}
/* departed: the stamp in luminous green ink on the dark card */
#pane-demob .sec1231 .stamp1232{background:radial-gradient(circle at 20% 30%,#52e8970f 0 2px,transparent 3px) 0 0/9px 9px,#52e89712;border-color:#52e897;color:#5ef0a2;box-shadow:0 0 18px #19c46a2e,inset 0 0 0 1px #52e89740}
#pane-demob .sec1231 .stamp1232 small{color:#a9f3ca}
/* the More button */
#pane-demob .sec1231 .menu816>summary.btn{background:#ffffff0d;border:1px solid #ffffff2e;color:#e6eef2;border-radius:10px;box-shadow:none}
#pane-demob .sec1231 .menu816>summary.btn:hover{background:#ffffff1a}
#pane-demob .sec1231 .menu816[open]>summary.btn{background:#fff;color:#13202a;border-color:#fff}
/* suppliers inside Sub-hired */
#pane-demob .sec1231 .suph1231 b{color:#eaf8fc}
#pane-demob .sec1231 .suph1231>span:not(.mono1231){color:#9cc6d2}
#pane-demob .sec1231 .sup1231+.sup1231{border-top-color:#ffffff24}
/* the day's tally and its filters, in the same dark */
#pane-demob .sum1231{background:linear-gradient(120deg,#16242c,#0f1b21);border:1px solid #ffffff14;box-shadow:0 8px 20px #0b141a30}

/* ---------- a phone: each line a compact card ---------- */
@media (max-width:900px){
  #pane-demob .sec1231>.sb1231{padding:10px 8px 4px}
  #pane-demob .sec1231 table.dm1231 tbody tr.zr1231{padding:12px 4px 4px}
  #pane-demob .sec1231 table.dm1231 tbody tr.zr1231:first-child{padding-top:2px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"ref what br" "st st st" "pk pk act";
    gap:9px 10px;align-items:start;margin:0 0 9px;padding:12px 12px 11px 15px;border:1px solid var(--dk-line);border-radius:14px;
    background:linear-gradient(180deg,var(--dk-card2),var(--dk-card));box-shadow:inset 4px 0 0 var(--st,#5d7782),0 6px 14px #0007}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td{background:transparent;padding:0;min-width:0;border:0;box-shadow:none}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td::before{display:none}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell{grid-area:ref;align-self:start}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.refcell .plateb{min-height:30px;padding:0}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="What"]{grid-area:what;font-size:15px;line-height:1.28;padding-top:3px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Branch"]{grid-area:br;justify-self:end;align-self:start;margin-top:4px;padding:5px 7px;border:1px solid #ffffff26;border-radius:7px;background:#ffffff10;color:#d6e6ec;font:800 10.5px/1 Inter,Arial,sans-serif;letter-spacing:.08em;white-space:nowrap}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231{grid-area:st;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding-top:9px;border-top:1px solid var(--dk-line)}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .lamps1231{margin:0;gap:1px;padding:3px 4px;border-radius:999px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] .lp1231{min-width:0;width:34px;padding:3px 0;border-radius:999px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] .lp1231 em{display:none}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] .lp1231 i{width:24px;height:24px;font-size:13px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] .sl1231{flex:1 1 140px;flex-direction:column;align-items:flex-start;gap:2px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .stamp1232{margin:2px 0 2px 2px;padding:6px 10px 5px;border-width:3px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .stamp1232 b{font-size:16px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .stamp1232 em{font-size:10.5px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.st1231 .stamp1232 small{font-size:9px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231{grid-area:pk;display:flex;flex-wrap:wrap;align-items:center;gap:5px 8px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231 .pd1231{margin:0;gap:2px 7px}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231 .pd1231 small{flex-basis:auto}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td.pk1231 .pd1231+.pd1231{flex-basis:100%}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Actions"]{grid-area:act;justify-self:end;align-self:center}
  #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816] td[data-label="Actions"] .menu816>summary.btn{min-height:36px;padding:6px 14px;font:700 12.5px/1 Inter,Arial,sans-serif}
}
/* ---------- a wider screen: the table, dark, each line its own band ---------- */
@media (min-width:901px){
  #pane-demob .sec1231>.sb1231{padding:4px 12px 10px}
  #pane-demob .sec1231 table.dm1231{border-collapse:separate;border-spacing:0 6px}
  #pane-demob .sec1231 table.dm1231 thead th{position:static;background:transparent;border:0;padding:8px 12px 2px;color:#7f9aa5;font:800 10.5px/1.2 Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;box-shadow:none}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816] td{background:linear-gradient(180deg,var(--dk-card2),var(--dk-card));border:0;border-top:1px solid var(--dk-line);border-bottom:1px solid var(--dk-line);padding:11px 12px;vertical-align:middle;color:var(--dk-ink);box-shadow:none}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816] td:first-child{position:static;border-left:1px solid var(--dk-line);border-radius:12px 0 0 12px;box-shadow:inset 4px 0 0 var(--st,#5d7782)}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816] td:last-child{border-right:1px solid var(--dk-line);border-radius:0 12px 12px 0}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816]:hover td{background:linear-gradient(180deg,#ffffff0a,#ffffff05),linear-gradient(180deg,var(--dk-card2),var(--dk-card))}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816] td[data-label="Branch"]{font:800 11.5px/1 Inter,Arial,sans-serif;letter-spacing:.08em;color:#d6e6ec}
  #pane-demob .sec1231 table.dm1231 tbody tr[data-row816] td.st1231 .lamps1231{margin-bottom:5px}
  #pane-demob .sec1231 table.dm1231 tbody tr.zr1231 th{padding:12px 6px 0}
}
}
</style>
