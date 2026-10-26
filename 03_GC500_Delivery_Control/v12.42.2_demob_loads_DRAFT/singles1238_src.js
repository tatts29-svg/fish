<style id="singles1238-style">
/* v12.38 - the Demob tab, one card per asset (Andrew, 26 Oct 2026): colour, glow and pulse, the equipment's own icon, two map
   pictures on every card, arrival, the Ready light and the booked pick-up for each asset */
#pane-demob{--n1238:#18e8ff;--r1238:#ff4d5e;--a1238:#ffb020;--g1238:#19d27a;--ink1238:#eef6f8;--mut1238:#9fb6be;--card1238:#12232a;--edge1238:#ffffff17}
#pane-demob[data-sg1238] .kp816,#pane-demob[data-sg1238] .ord816,#pane-demob[data-sg1238] .leg816,#pane-demob[data-sg1238] .note816.pl1238,
#pane-demob[data-sg1238] [data-conf816],#pane-demob[data-sg1238] .confirm816,#pane-demob[data-sg1238] [data-print816],#pane-demob[data-sg1238] [data-mail816],
#pane-demob[data-sg1238] .segs816 [data-view816="toilets"],#pane-demob[data-sg1238] .segs816 [data-view816="pump"],#pane-demob[data-sg1238] .segs816 [data-view816="trucks"],
#pane-demob[data-sg1238] .ovn816,#pane-demob[data-sg1238="day"] .br816,#pane-demob[data-sg1238] .sum1231{display:none!important}
#pane-demob .sgv1238{display:grid;gap:16px;margin:10px 0 0;color:var(--ink1238);font-family:Inter,Arial,sans-serif}
#pane-demob .sgv1238 [hidden],dialog.bkd1238 [hidden]{display:none!important}
/* the bar: counts, filter and find */
#pane-demob .tb1238{position:relative;z-index:4;display:grid;gap:10px;padding:12px 14px;border:1px solid #18e8ff33;border-radius:16px;background:linear-gradient(135deg,#0d1c22f2,#142b33f2);box-shadow:0 0 0 1px #18e8ff12,0 10px 30px #0008,0 0 26px #18e8ff1c;backdrop-filter:blur(6px)}
#pane-demob .tb1238 .th1238{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px}
#pane-demob .tb1238 .th1238 b{font:900 17px/1.1 Inter,Arial,sans-serif;letter-spacing:.01em;background:linear-gradient(90deg,#fff,#9ff6ff);-webkit-background-clip:text;background-clip:text;color:transparent}
#pane-demob .tb1238 .th1238 span{color:var(--mut1238);font:700 12px/1.2 Inter,Arial,sans-serif}
#pane-demob .tb1238 .fr1238{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
#pane-demob .tb1238 button.f1238{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:7px 13px;border:1px solid #ffffff22;border-radius:999px;background:#ffffff0c;color:var(--ink1238);font:800 12.5px/1 Inter,Arial,sans-serif;cursor:pointer;transition:background .2s,box-shadow .2s}
#pane-demob .tb1238 button.f1238 b{font-weight:900;font-size:14px}
#pane-demob .tb1238 button.f1238 i{width:9px;height:9px;border-radius:50%;background:#9fb6be}
#pane-demob .tb1238 button.f1238.not i{background:var(--r1238);box-shadow:0 0 8px var(--r1238)}
#pane-demob .tb1238 button.f1238.ready i{background:var(--a1238);box-shadow:0 0 8px var(--a1238)}
#pane-demob .tb1238 button.f1238.gone i{background:var(--g1238);box-shadow:0 0 8px var(--g1238)}
#pane-demob .tb1238 button.f1238.booked i{background:var(--n1238);box-shadow:0 0 8px var(--n1238)}
#pane-demob .tb1238 button.f1238[aria-pressed="true"]{border-color:var(--n1238);background:#18e8ff1f;box-shadow:0 0 14px #18e8ff55,inset 0 0 10px #18e8ff22}
#pane-demob .tb1238 .fd1238{flex:1 1 220px;min-width:0;display:flex;align-items:center;gap:8px;padding:0 12px;min-height:38px;border:1px solid #18e8ff44;border-radius:12px;background:#0a161b}
#pane-demob .tb1238 .fd1238 svg{flex:none;width:17px;height:17px;color:var(--n1238)}
#pane-demob .tb1238 .fd1238 input{all:unset;flex:1;min-width:0;color:var(--ink1238);font:700 14px/1.2 Inter,Arial,sans-serif}
#pane-demob .tb1238 .fd1238 input::placeholder{color:#7f979f}
#pane-demob .tb1238 .cn1238{display:flex;gap:7px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}
#pane-demob .tb1238 .cn1238 button{all:unset;box-sizing:border-box;flex:none;display:inline-flex;align-items:center;gap:7px;padding:6px 11px 6px 7px;border:1px solid color-mix(in srgb,var(--cc) 45%,transparent);border-radius:12px;background:color-mix(in srgb,var(--cc) 12%,#0d1c22);color:var(--ink1238);font:800 12px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .tb1238 .cn1238 button i{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:#0d1c22;color:var(--cc);box-shadow:0 0 10px color-mix(in srgb,var(--cc) 55%,transparent)}
#pane-demob .tb1238 .cn1238 button i svg{width:17px;height:17px}
#pane-demob .tb1238 .cn1238 button b{color:var(--cc)}
#pane-demob .tb1238 .cn1238 button em{font-style:normal;color:var(--mut1238);font-weight:700}
/* sections, suppliers and groups */
#pane-demob .sx1238{display:grid;gap:14px;padding:14px;border:1px solid var(--edge1238);border-radius:20px;background:radial-gradient(120% 140% at 0% 0%,#163039 0%,#0c181d 60%)}
#pane-demob .sx1238.sub{background:radial-gradient(120% 140% at 0% 0%,#22183a 0%,#0c181d 60%)}
#pane-demob .sh1238{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}
#pane-demob .sh1238 .mn1238{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#ff6a13,#ffb020);color:#160b02;font:900 19px/1 Inter,Arial,sans-serif;box-shadow:0 0 18px #ff6a1388}
#pane-demob .sx1238.sub .sh1238 .mn1238{background:linear-gradient(135deg,#8f5cff,#18e8ff);color:#08121a;box-shadow:0 0 18px #8f5cff88}
#pane-demob .sh1238 h3{margin:0;font:900 20px/1.1 Inter,Arial,sans-serif;color:#fff}
#pane-demob .sh1238 h3 small{display:block;margin-top:3px;color:var(--mut1238);font:700 12.5px/1.25 Inter,Arial,sans-serif}
#pane-demob .sh1238 .ct1238{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
#pane-demob .sh1238 .ct1238 span{padding:6px 10px;border-radius:999px;background:#ffffff0d;font:800 12px/1 Inter,Arial,sans-serif;white-space:nowrap}
#pane-demob .sh1238 .ct1238 .no{color:#ff9aa4;box-shadow:inset 0 0 0 1px #ff4d5e55}
#pane-demob .sh1238 .ct1238 .ok{color:#ffd27a;box-shadow:inset 0 0 0 1px #ffb02066}
#pane-demob .sh1238 .ct1238 .gn{color:#7ff0b4;box-shadow:inset 0 0 0 1px #19d27a66}
#pane-demob .bar1238{grid-column:1/-1;display:flex;height:8px;border-radius:999px;overflow:hidden;background:#ffffff12}
#pane-demob .bar1238 i{display:block;height:100%}
#pane-demob .bar1238 .g{background:linear-gradient(90deg,#0fae62,#3ff59d);box-shadow:0 0 10px #19d27a}
#pane-demob .bar1238 .r{background:linear-gradient(90deg,#ff9b20,#ffd060);box-shadow:0 0 10px #ffb020}
#pane-demob .bar1238 .n{background:linear-gradient(90deg,#c9303f,#ff6170)}
#pane-demob .sp1238 > h4{display:flex;align-items:center;gap:9px;margin:4px 0 8px;color:#fff;font:900 15px/1.1 Inter,Arial,sans-serif}
#pane-demob .sp1238 > h4 .mn1238{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,#8f5cff,#18e8ff);color:#08121a;font:900 12px/1 Inter,Arial,sans-serif}
#pane-demob .sp1238 > h4 small{color:var(--mut1238);font:700 12px/1 Inter,Arial,sans-serif}
#pane-demob .gp1238{display:grid;gap:10px;--cc:#9fb2bb}
#pane-demob .gh1238{display:flex;align-items:center;gap:10px;margin:6px 0 0;padding:0 0 8px;border-bottom:1px solid color-mix(in srgb,var(--cc) 35%,transparent)}
#pane-demob .gh1238 i{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#0b171c;color:var(--cc);box-shadow:0 0 0 1px color-mix(in srgb,var(--cc) 45%,transparent),0 0 16px color-mix(in srgb,var(--cc) 50%,transparent)}
#pane-demob .gh1238 i svg{width:22px;height:22px}
#pane-demob .gh1238 b{font:900 15.5px/1.1 Inter,Arial,sans-serif;color:#fff;letter-spacing:.01em}
#pane-demob .gh1238 span{color:var(--mut1238);font:700 12px/1 Inter,Arial,sans-serif}
#pane-demob .gh1238 em{margin-left:auto;display:flex;gap:6px;font-style:normal}
#pane-demob .gh1238 em b{padding:4px 8px;border-radius:999px;font:800 11px/1 Inter,Arial,sans-serif}
#pane-demob .gh1238 em .no{background:#ff4d5e22;color:#ff9aa4}#pane-demob .gh1238 em .ok{background:#ffb02022;color:#ffd27a}#pane-demob .gh1238 em .gn{background:#19d27a22;color:#7ff0b4}
#pane-demob .gg1238{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
/* the card: the data plate for one asset */
#pane-demob .sg1238{--sc:var(--r1238);position:relative;display:grid;gap:9px;padding:13px 13px 12px;border:1px solid var(--edge1238);border-radius:18px;background:linear-gradient(165deg,#173039 0%,#10212a 45%,#0c191f 100%);box-shadow:0 10px 26px #0007,inset 0 1px 0 #ffffff12;content-visibility:auto;contain-intrinsic-size:auto 560px;isolation:isolate;overflow:hidden}
#pane-demob .sg1238::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--sc);box-shadow:0 0 14px var(--sc),0 0 3px var(--sc);z-index:1}
#pane-demob .sg1238::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sc) 55%,transparent),0 0 22px color-mix(in srgb,var(--sc) 45%,transparent);opacity:.35;z-index:-1}
#pane-demob .sg1238.st-ready{--sc:var(--a1238)}
#pane-demob .sg1238.st-ready::after{opacity:.9;animation:gl1238 2.6s ease-in-out infinite}
#pane-demob .sg1238.st-gone{--sc:var(--g1238);background:linear-gradient(165deg,#12302a,#0d1f1c 50%,#0b1715)}
#pane-demob .sg1238.st-gone .ph1238 img{filter:saturate(.75) brightness(.85)}
#pane-demob .sg1238.fl1238{animation:fl1238 1.6s ease-out}
@keyframes gl1238{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes fl1238{0%{box-shadow:0 0 0 3px #18e8ff,0 0 40px #18e8ff}100%{box-shadow:0 10px 26px #0007}}
#pane-demob .sg1238 .hd1238{display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center}
#pane-demob .sg1238 .ic1238{position:relative;display:grid;place-items:center;width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#173039,#0a1519);color:#fff;box-shadow:0 0 0 2px var(--n1238),0 0 16px #18e8ffaa,inset 0 0 12px #18e8ff44}
#pane-demob .sg1238 .ic1238 svg{width:30px;height:30px;filter:drop-shadow(0 0 3px #18e8ffcc)}
#pane-demob .sg1238 .ic1238::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--n1238);opacity:0;animation:rg1238 2.4s ease-out infinite}
#pane-demob .sg1238.st-gone .ic1238{box-shadow:0 0 0 2px var(--g1238),0 0 14px #19d27a88}
#pane-demob .sg1238.st-gone .ic1238::after{display:none}
@keyframes rg1238{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.45);opacity:0}}
#pane-demob .sg1238 .tt1238{min-width:0}
#pane-demob .sg1238 .tt1238 b{display:block;color:#fff;font:900 16.5px/1.15 Inter,Arial,sans-serif;letter-spacing:.005em}
#pane-demob .sg1238 .tt1238 span{display:block;margin-top:3px;color:var(--mut1238);font:700 12px/1.25 Inter,Arial,sans-serif}
#pane-demob .sg1238 .tt1238 span u{text-decoration:none;color:#ffb37a;font-weight:900}
#pane-demob .sg1238 .ow1238{align-self:start;padding:5px 9px;border-radius:999px;font:900 10.5px/1 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
#pane-demob .ow1238.co{background:#ff6a1326;color:#ffbe8f;box-shadow:inset 0 0 0 1px #ff6a1366}
#pane-demob .ow1238.ep{background:#8f5cff2b;color:#d3bcff;box-shadow:inset 0 0 0 1px #8f5cff77}
#pane-demob .ow1238.pa{background:#18a8ff24;color:#9fd8ff;box-shadow:inset 0 0 0 1px #18a8ff66}
#pane-demob .ow1238.un{background:#ffffff14;color:#cfe0e6}
#pane-demob .sg1238 .id1238{display:flex;flex-wrap:wrap;gap:7px}
#pane-demob .sg1238 .id1238 span{display:inline-flex;align-items:baseline;gap:7px;padding:7px 11px;border:1px solid #18e8ff3a;border-radius:11px;background:#0a161b;box-shadow:inset 0 0 12px #18e8ff12}
#pane-demob .sg1238 .id1238 span i{color:#7fa3ad;font:900 9.5px/1 Inter,Arial,sans-serif;font-style:normal;letter-spacing:.09em;text-transform:uppercase}
#pane-demob .sg1238 .id1238 span b{color:#fff;font:800 16px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em;text-shadow:0 0 10px #18e8ff66}
#pane-demob .sg1238 .id1238 span.no b{color:#9fb6be;font:800 13px/1 Inter,Arial,sans-serif;text-shadow:none}
#pane-demob .sg1238 .mt1238{display:flex;flex-wrap:wrap;gap:6px}
#pane-demob .sg1238 .mt1238 span{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid #ffffff1c;border-radius:9px;background:#ffffff09;color:#dbe8ec;font:700 12px/1.1 Inter,Arial,sans-serif}
#pane-demob .sg1238 .mt1238 span i{color:#7fa3ad;font:900 9.5px/1 Inter,Arial,sans-serif;font-style:normal;letter-spacing:.08em;text-transform:uppercase}
#pane-demob .sg1238 .mt1238 span em{font-style:normal;color:#ffb37a;font-size:10.5px;font-weight:800;white-space:nowrap}
#pane-demob .sg1238 .mt1238 span.ar{border-color:#19d27a44;color:#bff5d8}
#pane-demob .sg1238 .mt1238 span.none{border-style:dashed;color:#9fb6be}
#pane-demob .sg1238 .wh1238{color:#cfe0e6;font:600 12.5px/1.35 Inter,Arial,sans-serif}
#pane-demob .sg1238 .wh1238 b{color:#fff;font-weight:800}
#pane-demob .sg1238 .wh1238 small{display:block;margin-top:2px;color:#8fb0ba;font-size:11.5px}
#pane-demob .sg1238 .in1238{padding:8px 10px;border:1px dashed #5cb8ff55;border-radius:11px;background:#5cb8ff0d;color:#cfe8f8;font:600 12px/1.4 Inter,Arial,sans-serif}
#pane-demob .sg1238 .in1238 i{display:block;margin-bottom:3px;color:#5cb8ff;font:900 9.5px/1 Inter,Arial,sans-serif;font-style:normal;letter-spacing:.09em;text-transform:uppercase}
/* the two map pictures */
#pane-demob .sg1238 .ph1238{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#pane-demob .sg1238 button.pf1238{all:unset;box-sizing:border-box;position:relative;display:block;width:100%;aspect-ratio:1000/824;overflow:hidden;border:1px solid #18e8ff2e;border-radius:13px;background:#0a161b;cursor:pointer;box-shadow:0 6px 16px #0006}
#pane-demob .sg1238 button.pf1238:focus-visible{outline:2px solid var(--n1238);outline-offset:2px}
#pane-demob .sg1238 .pf1238 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .3s}
#pane-demob .sg1238 .pf1238 img.on{opacity:1}
#pane-demob .sg1238 .pf1238 .w1238{position:absolute;inset:0;background:linear-gradient(100deg,#0a161b 30%,#17323c 50%,#0a161b 70%);background-size:200% 100%;animation:sh1238 1.4s linear infinite}
@keyframes sh1238{to{background-position:-200% 0}}
#pane-demob .sg1238 .pf1238 .nm1238{position:absolute;inset:0;display:grid;place-items:center;padding:10px;color:#a3b7bf;font:700 11.5px/1.3 Inter,Arial,sans-serif;text-align:center}
#pane-demob .sg1238 .pf1238 .pu1238{position:absolute;width:15%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;border:2px solid var(--n1238);box-shadow:0 0 12px var(--n1238),inset 0 0 8px #18e8ff88}
#pane-demob .sg1238 .pf1238 .pu1238::before,#pane-demob .sg1238 .pf1238 .pu1238::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid var(--n1238);animation:pl1238 2.2s ease-out infinite}
#pane-demob .sg1238 .pf1238 .pu1238::after{animation-delay:1.1s}
@keyframes pl1238{0%{transform:scale(1);opacity:.95}100%{transform:scale(2.6);opacity:0}}
#pane-demob .sg1238.st-gone .pf1238 .pu1238{display:none}
#pane-demob .sg1238 .pf1238 .pb1238{position:absolute;left:7px;top:7px;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#0a1519e6;color:#fff;box-shadow:0 0 0 2px var(--n1238),0 0 14px #18e8ffaa}
#pane-demob .sg1238 .pf1238 .pb1238 svg{width:21px;height:21px}
#pane-demob .sg1238 .pf1238 .vw1238{position:absolute;right:7px;top:7px;padding:4px 8px;border-radius:999px;background:#0a1519d9;color:#dff8ff;font:800 10.5px/1 Inter,Arial,sans-serif;letter-spacing:.02em}
/* the buttons */
#pane-demob .sg1238 .ac1238{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#pane-demob .sg1238 .ac1238 button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 4px;border:1px solid #ffffff22;border-radius:11px;background:#ffffff0c;color:var(--ink1238);font:800 12px/1 Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap;transition:background .2s,box-shadow .2s}
#pane-demob .sg1238 .ac1238 button:hover,#pane-demob .sg1238 .ac1238 button:focus-visible{background:#18e8ff1a;box-shadow:0 0 12px #18e8ff44;outline:none}
#pane-demob .sg1238 .ac1238 button.nv1238{border-color:#ff6a1399;background:linear-gradient(135deg,#ff6a1340,#ffb0201f);color:#ffd2b0;box-shadow:0 0 12px #ff6a1333}
#pane-demob .sg1238 .ac1238 svg{flex:none;width:15px;height:15px}
/* the light and the booking */
#pane-demob .sg1238 .ft1238{display:grid;gap:9px;padding-top:9px;border-top:1px solid #ffffff12}
#pane-demob .sg1238 .lr1238{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
#pane-demob .lm1238{display:inline-flex;gap:4px;padding:4px;border-radius:14px;background:#060d10;box-shadow:inset 0 0 0 1px #ffffff14}
#pane-demob .lm1238 .lp1238{all:unset;box-sizing:border-box;display:grid;justify-items:center;gap:3px;min-width:58px;padding:6px 6px 5px;border-radius:10px;color:#71878f;font:800 9px/1 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:default}
#pane-demob .lm1238 button.lp1238{cursor:pointer}
#pane-demob .lm1238 .lp1238 i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#1a2a30;color:#5e737a;font:900 12px/1 Inter,Arial,sans-serif;font-style:normal}
#pane-demob .lm1238 .lp1238.on{background:#ffffff0d;color:#fff}
#pane-demob .lm1238 .lp1238.red.on i{background:radial-gradient(circle at 40% 35%,#ff8a95,#e5203a);color:#fff;box-shadow:0 0 14px #ff4d5e,0 0 4px #ff4d5e}
#pane-demob .lm1238 .lp1238.amber.on i{background:radial-gradient(circle at 40% 35%,#ffe08a,#ff9b00);color:#2a1500;box-shadow:0 0 16px #ffb020,0 0 4px #ffb020;animation:lt1238 1.8s ease-in-out infinite}
#pane-demob .lm1238 .lp1238.green.on i{background:radial-gradient(circle at 40% 35%,#8af5be,#0fae62);color:#04210f;box-shadow:0 0 14px #19d27a}
@keyframes lt1238{0%,100%{box-shadow:0 0 10px #ffb020}50%{box-shadow:0 0 22px #ffb020,0 0 6px #fff3}}
#pane-demob .sg1238 .sw1238{min-width:0;flex:1 1 150px}
#pane-demob .sg1238 .sw1238 b{display:block;font:900 14px/1.15 Inter,Arial,sans-serif}
#pane-demob .sg1238 .sw1238 small{display:block;margin-top:2px;color:var(--mut1238);font:600 11.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .sg1238.st-not .sw1238 b{color:#ff8f9a}#pane-demob .sg1238.st-ready .sw1238 b{color:#ffd27a;text-shadow:0 0 10px #ffb02088}#pane-demob .sg1238.st-gone .sw1238 b{color:#7ff0b4}
#pane-demob .sg1238 .bk1238{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;border-radius:12px;background:#0a161b;box-shadow:inset 0 0 0 1px #ffffff12}
#pane-demob .sg1238 .bk1238 svg{flex:none;width:18px;height:18px;color:var(--mut1238)}
#pane-demob .sg1238 .bk1238 span{flex:1 1 140px;min-width:0;color:#cfe0e6;font:700 12.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .sg1238 .bk1238 span b{color:#fff;font-weight:900}
#pane-demob .sg1238 .bk1238 span small{display:block;color:var(--mut1238);font-size:11.5px;font-weight:600}
#pane-demob .sg1238 .bk1238.on{background:linear-gradient(135deg,#0b2a33,#0a161b);box-shadow:inset 0 0 0 1px #18e8ff66,0 0 18px #18e8ff2a}
#pane-demob .sg1238 .bk1238.on svg{color:var(--n1238);filter:drop-shadow(0 0 4px #18e8ff)}
#pane-demob .sg1238 .bk1238.past span b{color:#ffd27a}
#pane-demob .sg1238 .bk1238 button{all:unset;box-sizing:border-box;padding:8px 13px;border-radius:999px;background:linear-gradient(135deg,#18e8ff,#3b8cff);color:#04131a;font:900 12px/1 Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 0 14px #18e8ff77;white-space:nowrap}
#pane-demob .sg1238 .bk1238 button:focus-visible{outline:2px solid #fff;outline-offset:2px}
body:not([data-cap="edit"]) #pane-demob .sg1238 .bk1238 button,body:not([data-cap="edit"]) #pane-demob .bp1238 .bka1238{display:none}
/* the group card (barriers and mats) */
#pane-demob .sg1238.grp .id1238 span.q b{color:#ffd2b0}
/* booked pick-ups */
#pane-demob .bp1238{display:grid;gap:10px;padding:14px;border:1px solid #18e8ff33;border-radius:18px;background:radial-gradient(120% 160% at 100% 0%,#0f3340,#0b171c 60%);box-shadow:0 0 24px #18e8ff1a}
#pane-demob .bp1238 header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#pane-demob .bp1238 header i{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#0a161b;color:var(--n1238);box-shadow:0 0 0 1px #18e8ff66,0 0 14px #18e8ff66}
#pane-demob .bp1238 header i svg{width:20px;height:20px}
#pane-demob .bp1238 header b{color:#fff;font:900 16px/1.1 Inter,Arial,sans-serif}
#pane-demob .bp1238 header span{color:var(--mut1238);font:700 12px/1.2 Inter,Arial,sans-serif}
#pane-demob .bp1238 .bd1238{display:grid;gap:4px}
#pane-demob .bp1238 .bd1238 > b{margin-top:4px;color:#9ff6ff;font:900 11.5px/1 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
#pane-demob .bp1238 button.bl1238{all:unset;box-sizing:border-box;display:grid;grid-template-columns:62px auto 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:11px;background:#ffffff08;color:#e3eef1;font:700 12.5px/1.25 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .bp1238 button.bl1238:hover,#pane-demob .bp1238 button.bl1238:focus-visible{background:#18e8ff17;outline:none}
#pane-demob .bp1238 button.bl1238 time{color:#fff;font:900 14px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-shadow:0 0 8px #18e8ff88}
#pane-demob .bp1238 button.bl1238 i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#0a1519;color:#fff;box-shadow:0 0 0 1.5px var(--n1238)}
#pane-demob .bp1238 button.bl1238 i svg{width:16px;height:16px}
#pane-demob .bp1238 button.bl1238 em{font-style:normal;padding:4px 8px;border-radius:999px;font-size:10.5px;font-weight:900;white-space:nowrap}
#pane-demob .bp1238 em.not{background:#ff4d5e22;color:#ff9aa4}#pane-demob .bp1238 em.ready{background:#ffb02026;color:#ffd27a}#pane-demob .bp1238 em.gone{background:#19d27a22;color:#7ff0b4}
#pane-demob .bp1238 .be1238{color:var(--mut1238);font:600 12.5px/1.4 Inter,Arial,sans-serif}
#pane-demob .em1238{padding:26px 16px;border:1px dashed #18e8ff44;border-radius:18px;background:#0b171c;color:#cfe0e6;text-align:center;font:600 14px/1.45 Inter,Arial,sans-serif}
#pane-demob .em1238 b{display:block;margin-bottom:4px;color:#fff;font:900 17px/1.2 Inter,Arial,sans-serif}
/* the day cards: booked and picked up, with each reference and its asset numbers */
#pane-demob[data-sg1238] .dc996-day .bc984-progress{display:none}
#pane-demob .dc996-day .dp1238{position:relative;z-index:3;display:block;margin:12px 22px 0;padding:11px 12px 10px;border-radius:14px;background:linear-gradient(160deg,#ff8a3a1f,#0b171c 70%);box-shadow:inset 0 0 0 1px #ff8a3a40,0 0 18px #ff6a1322;text-align:left}
#pane-demob .dc996-day .dp1238.ahead{background:linear-gradient(160deg,#18e8ff14,#0b171c 70%);box-shadow:inset 0 0 0 1px #18e8ff33}
#pane-demob .dc996-day .dph1238{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
#pane-demob .dc996-day .dph1238 i{font:800 normal 10.5px/1.2 Inter,Arial,sans-serif;letter-spacing:.12em;color:#ffb37a;text-transform:uppercase}
#pane-demob .dc996-day .dp1238.ahead .dph1238 i{color:#9ff6ff}
#pane-demob .dc996-day .dph1238 b{font:700 italic 38px/1 var(--bc984-race,Inter),Inter,Arial,sans-serif;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 0 12px #ff8a3a99,0 1px 4px #000c}
#pane-demob .dc996-day .dp1238.ahead .dph1238 b{font-size:30px;color:#e8fbff;text-shadow:0 0 10px #18e8ff66}
#pane-demob .dc996-day .dph1238 b small{font-size:.5em;margin-left:2px;color:#ffd9bf}
#pane-demob .dc996-day .dpb1238{position:relative;display:block;height:9px;margin:9px 0 7px;border-radius:9px;background:#ffffff14;overflow:hidden}
#pane-demob .dc996-day .dpb1238 i{position:absolute;top:0;bottom:0;border-radius:9px}
#pane-demob .dc996-day .dpb1238 .was{left:0;background:linear-gradient(90deg,#ff6a13aa,#ffb37aaa)}
#pane-demob .dc996-day .dpb1238 .add{background:linear-gradient(90deg,#ffd24a,#fff3b0);box-shadow:0 0 10px #ffd24a,0 0 3px #fff}
#pane-demob .dc996-day .dp1238.today .dpb1238 .add{animation:dpl1238 1.8s ease-in-out infinite}
#pane-demob .dc996-day .dp1238.ahead .dpb1238 .was{background:linear-gradient(90deg,#18e8ff66,#9ff6ff66)}
#pane-demob .dc996-day .dp1238.ahead .dpb1238 .add{background:repeating-linear-gradient(135deg,#ffd24a 0 6px,#ffd24a88 6px 12px);box-shadow:0 0 8px #ffd24a88}
#pane-demob .dc996-day .dps1238{display:block;font:600 11.5px/1.35 Inter,Arial,sans-serif;color:#d6e4e9}
#pane-demob .dc996-day .dps1238 em{font-style:normal;font-weight:900;color:#ffd24a}
@keyframes dpl1238{0%,100%{opacity:1}50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){#pane-demob .dc996-day .dp1238.today .dpb1238 .add{animation:none}}
#pane-demob .dc996-day .dl1238{display:grid;gap:3px;max-height:132px;overflow:auto;margin-top:4px;padding-right:2px;scrollbar-width:thin}
#pane-demob .dc996-day .dl1238 span{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:baseline;padding:3px 6px;border-radius:7px;background:#ffffff10;font:700 10.5px/1.25 Inter,Arial,sans-serif;text-align:left;white-space:normal}
#pane-demob .dc996-day .dl1238 span b{font-weight:900}
#pane-demob .dc996-day .dl1238 span s{text-decoration:none;font:700 10px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;opacity:.9;word-break:break-word}
#pane-demob .dc996-day .dl1238 span time{font-weight:900}
#pane-demob .dc996-day .dl1238 em{font-style:normal;opacity:.8;font:700 10px/1.25 Inter,Arial,sans-serif}
#pane-demob .dc996-day .dl1238 s em:first-child{display:block;opacity:.95;font-size:10.5px}
/* the sheet: a calendar and a clock */
dialog.bkd1238{width:min(560px,calc(100vw - 20px));max-height:calc(100vh - 20px);padding:0;border:1px solid #18e8ff55;border-radius:22px;background:linear-gradient(160deg,#143039,#0b171c 60%);color:#eef6f8;box-shadow:0 30px 80px #000c,0 0 40px #18e8ff33;font-family:Inter,Arial,sans-serif;overflow:auto}
dialog.bkd1238::backdrop{background:#020a0dcc;backdrop-filter:blur(3px)}
dialog.bkd1238 form{display:grid;gap:14px;padding:18px}
dialog.bkd1238 header{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}
dialog.bkd1238 header i{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#0a1519;color:#fff;box-shadow:0 0 0 2px #18e8ff,0 0 18px #18e8ffaa}
dialog.bkd1238 header i svg{width:28px;height:28px}
dialog.bkd1238 h3{margin:0;font:900 20px/1.1 Inter,Arial,sans-serif}
dialog.bkd1238 header p{margin:3px 0 0;color:#a9c1c9;font:700 12.5px/1.3 Inter,Arial,sans-serif}
dialog.bkd1238 .bg1238{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:560px){dialog.bkd1238 .bg1238{grid-template-columns:1fr}}
dialog.bkd1238 section{padding:12px;border:1px solid #ffffff17;border-radius:16px;background:#08131799}
dialog.bkd1238 section > p{margin:0 0 8px;color:#9ff6ff;font:900 11px/1 Inter,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase}
dialog.bkd1238 .ch1238{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
dialog.bkd1238 .ch1238 b{font:900 14px/1 Inter,Arial,sans-serif}
dialog.bkd1238 .ch1238 button,dialog.bkd1238 .cg1238 button,dialog.bkd1238 .ck1238 button,dialog.bkd1238 footer button,dialog.bkd1238 .cm1238 button{all:unset;box-sizing:border-box;cursor:pointer}
dialog.bkd1238 .ch1238 button{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#ffffff10;font:900 16px/1 Inter,Arial,sans-serif}
dialog.bkd1238 .cg1238{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}
dialog.bkd1238 .cg1238 > span{color:#7f979f;font:800 10px/1.8 Inter,Arial,sans-serif}
dialog.bkd1238 .cg1238 button{position:relative;display:grid;place-items:center;aspect-ratio:1;border-radius:9px;font:800 12.5px/1 Inter,Arial,sans-serif;color:#e8f3f6}
dialog.bkd1238 .cg1238 button:hover{background:#18e8ff1f}
dialog.bkd1238 .cg1238 button[disabled]{color:#4b5f66;cursor:default;background:none}
dialog.bkd1238 .cg1238 button.dm::after{content:"";position:absolute;bottom:3px;width:4px;height:4px;border-radius:50%;background:#ff8a3a;box-shadow:0 0 6px #ff8a3a}
dialog.bkd1238 .cg1238 button.td{box-shadow:inset 0 0 0 1px #ffffff44}
dialog.bkd1238 .cg1238 button[aria-pressed="true"]{background:linear-gradient(135deg,#18e8ff,#3b8cff);color:#04131a;box-shadow:0 0 14px #18e8ffaa}
dialog.bkd1238 .tv1238{display:flex;align-items:center;gap:8px;margin-bottom:8px}
dialog.bkd1238 .tv1238 input{all:unset;box-sizing:border-box;width:100%;padding:9px 12px;border:1px solid #18e8ff55;border-radius:11px;background:#0a161b;color:#fff;font:900 22px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;text-align:center}
dialog.bkd1238 .tv1238 input:focus{box-shadow:0 0 0 2px #18e8ff88}
dialog.bkd1238 .ck1238{position:relative;width:min(220px,100%);aspect-ratio:1;margin:0 auto;border-radius:50%;background:radial-gradient(circle,#0f2128 0%,#0a161b 70%);box-shadow:inset 0 0 0 1px #18e8ff44,0 0 22px #18e8ff22}
dialog.bkd1238 .ck1238 .hn1238{position:absolute;left:50%;top:50%;width:3px;height:36%;background:linear-gradient(#18e8ff,#18e8ff00);border-radius:2px;transform-origin:50% 0;box-shadow:0 0 8px #18e8ff;pointer-events:none}
dialog.bkd1238 .ck1238 .cc1238{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#18e8ff;box-shadow:0 0 10px #18e8ff}
dialog.bkd1238 .ck1238 button{position:absolute;display:grid;place-items:center;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;color:#e8f3f6;font:800 12.5px/1 Inter,Arial,sans-serif}
dialog.bkd1238 .ck1238 button.in{width:26px;height:26px;margin:-13px 0 0 -13px;color:#8fb0ba;font-size:11px}
dialog.bkd1238 .ck1238 button:hover{background:#18e8ff2a}
dialog.bkd1238 .ck1238 button[aria-pressed="true"]{background:#18e8ff;color:#04131a;box-shadow:0 0 12px #18e8ff}
dialog.bkd1238 .cm1238{display:flex;justify-content:center;gap:6px;margin-top:8px}
dialog.bkd1238 .cm1238 button{padding:6px 12px;border-radius:999px;background:#ffffff10;font:800 11.5px/1 Inter,Arial,sans-serif}
dialog.bkd1238 .cm1238 button[aria-pressed="true"]{background:#18e8ff2e;color:#9ff6ff;box-shadow:inset 0 0 0 1px #18e8ff88}
dialog.bkd1238 label.nt1238{display:grid;gap:6px;color:#a9c1c9;font:800 11px/1 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}
dialog.bkd1238 label.nt1238 input{all:unset;box-sizing:border-box;padding:11px 12px;border:1px solid #ffffff26;border-radius:11px;background:#0a161b;color:#fff;font:600 14px/1.2 Inter,Arial,sans-serif;letter-spacing:0;text-transform:none}
dialog.bkd1238 label.al1238{display:flex;gap:9px;align-items:flex-start;color:#dce9ed;font:700 13px/1.35 Inter,Arial,sans-serif}
dialog.bkd1238 label.al1238 input{width:18px;height:18px;margin:1px 0 0;accent-color:#18e8ff}
dialog.bkd1238 .sm1238{margin:0;padding:10px 12px;border-radius:12px;background:#18e8ff12;color:#dff8ff;font:800 13.5px/1.3 Inter,Arial,sans-serif;text-align:center}
dialog.bkd1238 .sm1238.no{background:#ffffff0a;color:#9fb6be;font-weight:700}
dialog.bkd1238 .fy1238{margin:0;color:#8fb0ba;font:600 11.5px/1.35 Inter,Arial,sans-serif}
dialog.bkd1238 footer{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
dialog.bkd1238 footer button{padding:11px 16px;border-radius:999px;background:#ffffff12;font:900 13px/1 Inter,Arial,sans-serif}
dialog.bkd1238 footer button.cl1238{margin-right:auto;color:#ff9aa4}
dialog.bkd1238 footer button.sv1238{background:linear-gradient(135deg,#ff6a13,#ffb020);color:#1a0b00;box-shadow:0 0 16px #ff6a1388}
dialog.bkd1238 footer button[disabled]{opacity:.4;cursor:default;box-shadow:none}
@media (min-width:900px){#pane-demob .tb1238{position:sticky;top:0}}
@media (max-width:720px){
 #pane-demob .gg1238{grid-template-columns:1fr}
 #pane-demob .sx1238{padding:10px;border-radius:16px}
 #pane-demob .sh1238{grid-template-columns:auto 1fr}
 #pane-demob .sh1238 .ct1238{grid-column:1/-1;justify-content:flex-start}
 #pane-demob .sg1238 .ac1238 button{font-size:11.5px;gap:5px}
 #pane-demob .bp1238 button.bl1238{grid-template-columns:56px auto 1fr;}
 #pane-demob .bp1238 button.bl1238 em{grid-column:2/-1;justify-self:start}
}
@media (prefers-reduced-motion:reduce){
 #pane-demob .sg1238::after,#pane-demob .sg1238 .ic1238::after,#pane-demob .sg1238 .pf1238 .pu1238::before,#pane-demob .sg1238 .pf1238 .pu1238::after,#pane-demob .lm1238 .lp1238.amber.on i,#pane-demob .sg1238 .pf1238 .w1238{animation:none!important}
}
#pane-demob .sg1238.st-gone{contain-intrinsic-size:auto 340px}
#pane-demob .stw1238{display:grid;place-items:center;padding:16px 4px 12px}
#pane-demob .stp1238{position:relative;display:grid;justify-items:center;gap:3px;min-width:min(260px,86%);padding:14px 22px 12px;transform:rotate(-7deg);border:4px solid #3dff9e;border-radius:16px;outline:2px dashed #3dff9e99;outline-offset:5px;color:#9dffcf;text-align:center;background:radial-gradient(120% 140% at 50% 50%,#19d27a2e,#0b1a15 75%);box-shadow:0 0 16px #19d27a99,inset 0 0 16px #19d27a55;isolation:isolate}
#pane-demob .stp1238::before{content:"";position:absolute;inset:-10px;z-index:-1;border-radius:22px;box-shadow:0 0 34px 6px #3dff9ebb,0 0 70px 14px #19d27a66;opacity:.35;animation:stg1238 2.4s ease-in-out infinite}
#pane-demob .stp1238::after{content:"";position:absolute;inset:-4px;z-index:-1;border:3px solid #3dff9e;border-radius:18px;opacity:0;animation:str1238 2.4s ease-out infinite}
#pane-demob .stp1238 b{font:900 italic 36px/1 var(--bc984-race,Inter),Inter,Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#eafff4;text-shadow:0 0 8px #3dff9e,0 0 22px #19d27a,0 0 40px #19d27a88}
#pane-demob .stp1238 span{font:900 14px/1.25 Inter,Arial,sans-serif;letter-spacing:.06em;color:#c9ffe4;text-shadow:0 0 8px #19d27a}
#pane-demob .stp1238 small{font:600 11px/1.2 Inter,Arial,sans-serif;color:#9fd9bd}
#pane-demob .stp1238 .stc1238{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#3dff9e;color:#05301c;box-shadow:0 0 18px #3dff9e,0 0 4px #fff}
#pane-demob .stp1238 .stc1238 svg{width:24px;height:24px;stroke-width:3}
@keyframes stg1238{0%,100%{opacity:.3;transform:scale(.98)}50%{opacity:1;transform:scale(1.03)}}
@keyframes str1238{0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){#pane-demob .stp1238::before,#pane-demob .stp1238::after{animation:none}#pane-demob .stp1238::before{opacity:.7}}
@media print{#pane-demob .stp1238::before,#pane-demob .stp1238::after{display:none}}
@media print{#pane-demob .tb1238,#pane-demob .sg1238 .ph1238,#pane-demob .sg1238 .ac1238{display:none!important}#pane-demob .sg1238{content-visibility:visible;break-inside:avoid}}
/* v12.42.2 - truck loads from what is Ready */
#pane-demob .ld1238{display:grid;gap:10px;padding:14px;border:1px solid #ffb02044;border-radius:18px;background:radial-gradient(120% 160% at 100% 0%,#3a2a0c,#0b171c 62%);box-shadow:0 0 24px #ffb0201a}
#pane-demob .ld1238 > header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#pane-demob .ld1238 > header i{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#0a161b;color:#ffcf6a;box-shadow:0 0 0 1px #ffb02088,0 0 14px #ffb02066}
#pane-demob .ld1238 > header i svg{width:20px;height:20px}
#pane-demob .ld1238 > header b{color:#fff;font:900 16px/1.1 Inter,Arial,sans-serif}
#pane-demob .ld1238 > header span{color:var(--mut1238);font:700 12px/1.2 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lr1238{margin:0;color:#e9d9b6;font:600 12px/1.45 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lg1238{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
#pane-demob .ld1238 .lt1238{display:grid;align-content:start;gap:8px;padding:12px;border-radius:14px;background:#0a161b;box-shadow:inset 0 0 0 1px #ffffff14}
#pane-demob .ld1238 .lt1238.bk{box-shadow:inset 0 0 0 1px #18e8ff66,0 0 16px #18e8ff22}
#pane-demob .ld1238 .lt1238 h4{margin:0;display:flex;align-items:baseline;gap:6px 8px;flex-wrap:wrap;color:#fff;font:900 14px/1.25 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lt1238 h4 b{padding:3px 9px;border-radius:999px;background:#ffb020;color:#1b1203;font-size:12px}
#pane-demob .ld1238 .lt1238 h4 small{flex-basis:100%;color:var(--mut1238);font-weight:700;font-size:12px}
#pane-demob .ld1238 .lt1238 .lb1238{margin:0;color:#9ff6ff;font:800 12.5px/1.2 Inter,Arial,sans-serif}
#pane-demob .ld1238 .lt1238 .lb1238.mx{color:#ffcf6a;font-weight:700;line-height:1.35}
#pane-demob .ld1238 .lt1238 ol{margin:0;padding:0;list-style:none;display:grid;gap:4px}
#pane-demob .ld1238 .lt1238 li button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;gap:2px 8px;width:100%;padding:6px 8px;border-radius:9px;background:#ffffff08;color:#e3eef1;font:700 12.5px/1.25 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .ld1238 .lt1238 li button:hover,#pane-demob .ld1238 .lt1238 li button:focus-visible{background:#ffb02017;outline:none}
#pane-demob .ld1238 .lt1238 li b{color:#fff;font-weight:900}
#pane-demob .ld1238 .lt1238 li s{grid-column:1/-1;text-decoration:none;color:#b9cdd3;font:600 11.5px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
#pane-demob .ld1238 .lt1238 li em{grid-column:1/-1;font-style:normal;color:var(--mut1238);font-size:11.5px}
#pane-demob .ld1238 .lt1238 footer{display:flex;gap:8px;flex-wrap:wrap}
#pane-demob .ld1238 .lt1238 footer button{all:unset;box-sizing:border-box;padding:9px 13px;border-radius:10px;background:#ffffff10;color:#fff;font:800 12.5px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .ld1238 .lt1238 footer button.pri{background:#ffb020;color:#1b1203}
#pane-demob .ld1238 .lt1238 footer button:focus-visible{outline:2px solid #ffcf6a;outline-offset:2px}
@media print{#pane-demob .ld1238 .lt1238 footer{display:none}}
</style>
<script id="singles1238-script">
/* Author: Andrew Fisher. v12.38 - the Demob tab, one card per asset.
   Andrew, 26 Oct 2026: "i dont like this have singles each asset is a single item So you need to mention each. exception will be
   barriers and what is inside a building whats inside a building should be included in the building info"; "we need one block for
   each asset ... excpetion is waste tank and toilet and items inside building"; "take out our coates toilest blocks and aset and
   put in our list"; "i want everything showing no ready unless i have ticked it or stated it has been picked up"; "i want the icons
   to be what the equipment is"; "2 pic for each ... lets mention date or arrival"; "a easy function to add a date for it and a time
   of pick up"; "date selction should bring up a calendar . time selction should be manual entry or with ease use a clock";
   "nothing should be on the Demob card unless we have put that date on i or its been departed on that date"; "we want colour and
   glow and pulsate in this demob area".
   The units come from the record itself (gcUnits925): each with its owner, its asset number and, for VMS boards, its board number
   and rego. Everything on site shows one card per unit: Coates' own (and any owner still to confirm) in our list, sub-hired units
   under their supplier. A waste tank stays on its toilet's card; water barriers and ground mats stay one card a run (no asset
   number on each); what is inside a building is listed on the building's card. Each card: the equipment's own icon, its asset
   number (and rego), its owner, where it is (a VMS board where it now stands, from the pins on the record), arrival, size and
   weight, the two map pictures (close up and wider area, the page's own "on the map" pictures with the icon and a pulsing ring on
   the spot), Navigate, Text, Email and Send, its Ready light and its booked pick-up.
   Ready is per unit: Not ready until someone ticks it Ready (or Emptied for a toilet), or it has left. A unit's own tick and the
   reference's tick or Emptied are compared by time: the newest stands. The booked pick-up is per unit too. Both are new fields
   on the reference's delivery record (ready1238_units, pickup1238_units, each unit on its own clock, merged in mergeRecords).
   A day shows only what is booked for that day or left that day; the schedule's own plan is not shown. */
(function (W) {
'use strict';
const D = W.document, ALLV = 'everything', FENCE = /fenc|brac/i, REL = 'v12.42.2';
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ok = v => typeof v === 'string' && v !== '' && Number.isFinite(Date.parse(v));
const hold = fn => (typeof holdAssets === 'function' ? holdAssets(fn) : fn()); /* v12.41's nested-safe asset hold */
const pad = n => String(n).padStart(2, '0');
const qd = v => new Date(Date.parse(v) + 10 * 3600e3);
const qDay = v => qd(v).toISOString().slice(0, 10);
const hhmm = v => { const d = qd(v); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); };
const dayW = iso => { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? String(iso || '') : DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
const when = v => ok(v) ? dayW(qDay(v)) + ' · ' + hhmm(v) : '';
const todayQ = () => { try { return todayIso(); } catch (x) { return qDay(new Date().toISOString()); } };
const NATC = new Intl.Collator('en-AU', {numeric: true, sensitivity: 'base'}).compare, nat = (a, b) => NATC(String(a), String(b)); /* v12.42.2: one collator, made once */
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const cssq = s => (W.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'));

/* ---- the equipment's own pictures ---- */
const SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICONS = {
 gen: '<rect x="2.5" y="8" width="19" height="10" rx="1.5"/><path d="M5.5 11h5.5M5.5 13h5.5M5.5 15h5.5"/><rect x="13.5" y="10.5" width="5.5" height="5" rx="1"/><path d="M16.7 11.4l-1.3 1.8h1.9l-1.3 1.8M6 8V5h2.5M4.5 18v2.5M19.5 18v2.5"/>',
 tower: '<rect x="6" y="2.5" width="12" height="4" rx="1"/><path d="M10 2.5v4M14 2.5v4M12 6.5v10M4.5 16.5h15v2.5h-15zM2.5 17.75h2"/><circle cx="9" cy="21" r="1.4"/><circle cx="15" cy="21" r="1.4"/>',
 vms: '<rect x="2.5" y="2.5" width="19" height="10.5" rx="1.2"/><path d="M5.5 6h13M5.5 9.5h9M12 13v4.5M5 17.5h14l-1.2 2.5H6.2z"/><circle cx="12" cy="21.5" r="1"/>',
 fwf: '<path d="M6 21.5V8a6 3.5 0 0 1 12 0v13.5z"/><path d="M6 9.5h12M9 12h6v9.5H9zM13.3 16.8h.01M15.5 5.2V2.5"/>',
 access: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M3 8h18"/><circle cx="11.5" cy="10.8" r="1.1"/><path d="M11.5 12.4v3h3.2l1.3 2.8M10 13.8a3.3 3.3 0 1 0 4.4 4.1"/>',
 urinal: '<path d="M4 21.5V6l8-3.5L20 6v15.5M3 21.5h18"/><path d="M7 8.5v4a2 2 0 0 0 4 0v-4zM13 8.5v4a2 2 0 0 0 4 0v-4zM9 14.5v4M15 14.5v4"/>',
 block: '<rect x="2" y="6" width="20" height="13" rx="1.2"/><path d="M2 9h20M12 9v10"/><circle cx="7" cy="11.8" r="1.1"/><path d="M7 13.3v4.2M5.6 14.6h2.8"/><circle cx="17" cy="11.8" r="1.1"/><path d="M17 13.3l-1.6 3h3.2zM16.3 16.3v1.4M17.7 16.3v1.4M4 19v1.8M20 19v1.8"/>',
 tank: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M8.5 7v10M15.5 7v10M5 19.5h14M7 17v2.5M17 17v2.5M12 4v3"/>',
 bld: '<rect x="2" y="5.5" width="20" height="13" rx="1"/><path d="M2 8.5h20M5 11h5v3.5H5zM14 11h4.5v7.5M13 20.5h7M4 18.5v2"/>',
 kiosk: '<rect x="5" y="7" width="14" height="14.5" rx="1"/><path d="M3.5 7h17L19 3.5H5zM8 10.5h8v4H8zM5 16.5h14"/>',
 container: '<rect x="2" y="6.5" width="20" height="12" rx="1"/><path d="M5.5 6.5v12M9 6.5v12M12.5 6.5v12M16 6.5v12M19 6.5v12"/>',
 boom: '<path d="M3 18h12M4 18v-3h9v3M8.5 15 17 6.5"/><path d="M15.5 3h6v4h-6z"/><circle cx="5.5" cy="20.2" r="1.6"/><circle cx="12" cy="20.2" r="1.6"/>',
 scissor: '<path d="M3.5 4v3.5h17V4"/><path d="M3.5 7.5h17v2h-17zM6 9.5l12 6M18 9.5l-12 6M3.5 15.5h17V18h-17z"/><circle cx="7" cy="20.3" r="1.4"/><circle cx="17" cy="20.3" r="1.4"/>',
 forklift: '<path d="M2.5 18.5V11h6.5l3 3.5v4M4.5 11V5.5h4.5V11M15.5 3v15.5h6M12 14.5h3.5"/><circle cx="5" cy="19.5" r="1.8"/><circle cx="10.5" cy="19.5" r="1.8"/>',
 laser: '<rect x="9" y="3" width="6" height="5.5" rx="1"/><path d="M12 8.5v3M12 11.5l-5.5 10M12 11.5l5.5 10M12 11.5v10M15 5.5h6.5"/>',
 fridge: '<rect x="6" y="2.5" width="12" height="19" rx="1.5"/><path d="M6 9h12M9 5v2M9 11.5v4"/>',
 chair: '<path d="M8 3h8v8.5H8zM6 11.5h12M7.5 11.5 6 21M16.5 11.5 18 21M12 11.5v6M9 17.5h6"/>',
 barrier: '<path d="M2.5 18.5h19l-3.5-9h-12z"/><path d="M7.5 9.5 9 5.5h6l1.5 4M6 14h12"/>',
 mat: '<path d="M2.5 9.5h19l-2 5h-15z"/><path d="M6 9.5l-1.2 5M9.5 9.5l-.6 5M14.5 9.5l.6 5M18 9.5l1.2 5M4.5 17.5h15"/>',
 other: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>'
};
const WORD = {gen: 'generator', tower: 'lighting tower', vms: 'message board', fwf: 'portable toilet', access: 'accessible toilet', urinal: 'pee panel', block: 'toilet block', tank: 'waste tank', bld: 'portable building', kiosk: 'ticket box', container: 'container', boom: 'boom lift', scissor: 'scissor lift', forklift: 'forklift', laser: 'laser level', fridge: 'fridge', chair: 'chair', barrier: 'water barriers', mat: 'ground mats', other: 'equipment'};
const CAT = {
 gen: {label: 'Generators', c: '#ffb020', icon: 'gen'}, light: {label: 'Lighting towers', c: '#ffe066', icon: 'tower'}, bld: {label: 'Portable buildings', c: '#5cb8ff', icon: 'bld'},
 wc: {label: 'Toilets & amenities', c: '#4dd8cf', icon: 'fwf'}, wb: {label: 'Water barriers', c: '#ff8a65', icon: 'barrier'}, vms: {label: 'VMS boards', c: '#b794ff', icon: 'vms'},
 plant: {label: 'Plant & equipment', c: '#ffa94d', icon: 'forklift'}, ground: {label: 'Ground protection', c: '#a5d66f', icon: 'mat'}, furn: {label: 'Furniture & fridges', c: '#8fd3ff', icon: 'fridge'},
 other: {label: 'Everything else', c: '#9fb2bb', icon: 'other'}
};
const ORDER = ['gen', 'light', 'bld', 'wc', 'wb', 'vms', 'plant', 'ground', 'furn', 'other'];
function iconKey(text, cat) {
 const t = norm(text);
 if (/waste tank/.test(t)) return 'tank';
 if (/pee panel|urinal/.test(t)) return 'urinal';
 if (/accessible|disabled|ambulant/.test(t)) return 'access';
 if (/16\s*pan|toilet block|amenit(y|ies) block|\bblock\b/.test(t) && (cat === 'wc' || /toilet|pan/.test(t))) return 'block';
 if (/\bfwf\b|flush|toilet|portaloo|chemical|recirc/.test(t)) return 'fwf';
 if (/\bvms\b|message (board|sign)/.test(t)) return 'vms';
 if (/light(ing)? tower|light tower/.test(t)) return 'tower';
 if (/kva|generator/.test(t)) return 'gen';
 if (/scissor/.test(t)) return 'scissor';
 if (/boom|knuckle|ewp|cherry ?picker/.test(t)) return 'boom';
 if (/fork ?lift|forklift/.test(t)) return 'forklift';
 if (/laser/.test(t)) return 'laser';
 if (/fridge|freezer/.test(t)) return 'fridge';
 if (/chair|stool/.test(t)) return 'chair';
 if (/ticket box|kiosk|booth/.test(t)) return 'kiosk';
 if (/container/.test(t)) return 'container';
 if (/barrier|\btl2\b|wfb|armorzone/.test(t)) return 'barrier';
 if (/trakmat|track ?mat|ground (mat|protection)/.test(t)) return 'mat';
 if (/building|office|command|crib|hut|lunch|first aid|cabin|portable|police|media|room|pod|sleeper/.test(t)) return 'bld';
 return (CAT[cat] && CAT[cat].icon) || 'other';
}
const PATHS = new Map();
function iconPaths(k) {
 if (PATHS.has(k)) return PATHS.get(k);
 const out = [], num = (t, n) => { const m = t.match(new RegExp('\\b' + n + '="([-\\d.]+)"')); return m ? +m[1] : 0; };
 try {
  (String(ICONS[k] || ICONS.other).match(/<(path|rect|circle)\b[^>]*>/g) || []).forEach(t => {
   if (t.startsWith('<path')) { const d = (t.match(/\bd="([^"]+)"/) || [])[1]; if (d) out.push(new Path2D(d)); return; }
   const p = new Path2D();
   if (t.startsWith('<rect')) { const x = num(t, 'x'), y = num(t, 'y'), w = num(t, 'width'), h = num(t, 'height'), r = Math.min(num(t, 'rx'), w / 2, h / 2);
    p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r); p.lineTo(x + w, y + h - r); p.arcTo(x + w, y + h, x + w - r, y + h, r);
    p.lineTo(x + r, y + h); p.arcTo(x, y + h, x, y + h - r, r); p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r); p.closePath(); }
   else p.arc(num(t, 'cx'), num(t, 'cy'), num(t, 'r'), 0, Math.PI * 2);
   out.push(p); });
 } catch (x) { out.length = 0; }
 PATHS.set(k, out); return out;
}
const UI = {
 nav: SVG('<path d="M3 11 21 3l-8 18-2-8z"/>'), text: SVG('<path d="M4 5h16v11H9l-5 4z"/>'), mail: SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>'),
 send: SVG('<path d="M12 15V3M7 8l5-5 5 5M5 13v6h14v-6"/>'), cal: SVG('<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 13.5h3M13.5 13.5h3M7.5 17h3"/>'),
 find: SVG('<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>'), truck: SVG('<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3v3.5h-7"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>')
};

/* ---- what is on site: the same lines as v12.36's everything on site ---- */
function everyRows(branch) {
 let refs = []; try { refs = demob816().refs || []; } catch (x) { refs = []; }
 const keys = new Set(refs.map(r => r.key)), extra = [];
 try { allAssets().forEach(a => { if (!a || a._cancelled || keys.has(a.key) || FENCE.test(String(a.discipline || '') + ' ' + String(a.product || ''))) return;
  let st = ''; try { st = deliveryOf(a.key).state; } catch (x) { st = ''; } if (st !== 'on site') return;
  extra.push({key: a.key, a, kind: 'other', branch: String(a.branch || ''), zone: 'unknown', side: 'unknown', pt: null, src: '', streams: [], ownerUnk: 0, subCo: '', iso: null, contractEnd: null,
   units: [], evtN: 0, evtUnk: false, evtPure: false, portions: null, qtyChange: null, nothing: false, empty: false, emptied: false, big: false, tank: false, sub: '', noPlan1236: true}); }); } catch (x) {}
 const br = branch == null ? ((typeof DM816 === 'object' && DM816 && DM816.branch) || 'all') : branch;
 return refs.filter(r => !FENCE.test(String((r.a && r.a.discipline) || ''))).concat(extra).filter(r => br === 'all' || r.branch === br);
}
const catOf = k => { try { return W.DemobMap1236 ? DemobMap1236.catOf(k) : 'other'; } catch (x) { return 'other'; } };
const coName = o => { const k = String(o || ''); try { if (W.Units925 && typeof W.Units925.company === 'function') { const c = W.Units925.company(k); if (c) return String(c); } } catch (x) {}
 return {coates: 'Coates', 'event-portables': 'Event Portables', 'prem-air-hire': 'Premiair Hire', unknown: 'Owner to confirm'}[k] || k.replace(/^other:/, '').split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); };
const ownCls = o => o === 'coates' ? 'co' : o === 'unknown' ? 'un' : /event/.test(o) ? 'ep' : /prem/.test(o) ? 'pa' : 'ep';
const uk = u => (String(u.owner || 'unknown') + '|' + String(u.assetNo || u.nativeId || u.id || '')).replace(/[^\w:.|-]+/g, '_').slice(0, 120);
function descOf(r) { try { return DemobScope1017.description(r, demobDescription988); } catch (x) { const a = r.a || {}; return String((a.item_types || [])[0] || a.name || a.product || r.key); } }
function specsOf(r) { try { return W.Ready1231 ? Ready1231.specs(r) || {} : {}; } catch (x) { return {}; } }
/* the day it arrived: the page's own arrival, the latest time it was set on site (a unit set on site again starts a new use);
   the delivery's planned or moved day is not an arrival */
function arrivalOf(key) {
 let at = null; try { at = lastOnSite816(key); } catch (x) { at = null; }
 return ok(at) ? {day: qDay(at)} : null;
}

/* ---- what has left: the departure record, unit by unit ---- */
const later = (x, y) => !y || String(x.at || x.day || '') > String(y.at || y.day || '');
function depOf(key) {
 let st = null; try { st = W.Departure1211 ? Departure1211.status(key) : null; } catch (x) { st = null; }
 let rd = null; try { rd = W.Departure1211 && Departure1211.read ? Departure1211.read(key) : null; } catch (x) { rd = null; }
 const out = {complete: !!(st && st.complete), collected: Number(st && st.collected) || 0, remaining: Number(st && st.remaining) || 0, ids: new Map(), nos: new Map(), counts: [], last: null, events: [], byType: new Map(), left: new Map(),
  review: !!(rd && (rd.issues || []).some(x => /quantities changed after a collection/i.test(String((x && x.text) || x || ''))))}; /* the page leaves such pick-ups out until someone checks them */
 /* a type with none remaining has all gone (Departure1211.unit's rule) */
 ((rd && !(rd.issues || []).length && Array.isArray(rd.remaining)) ? rd.remaining : []).forEach(x => out.left.set(norm(x.type), Number(x.n) || 0));
 ((st && Array.isArray(st.events)) ? st.events : []).forEach(ev => {
  const at = ok(ev.departedAt1211) ? ev.departedAt1211 : null, info = {at, day: at ? qDay(at) : (ev.date || null), by: String(ev.by || '')};
  if (later(info, out.last)) out.last = info;
  const ev1 = {info, nos: [], n: 0, types: [], byType: []};
  (ev.items || []).forEach(it => { const ids = Array.isArray(it.unitIds) ? it.unitIds : [], nos = Array.isArray(it.numbers) ? it.numbers : [], t = String(it.type || ''), n = Math.max(Number(it.n) || 0, ids.length, nos.length);
   ids.forEach(id => out.ids.set(String(id), info)); nos.forEach(x => { out.nos.set(String(x), info); ev1.nos.push(String(x)); });
   ev1.n += n; if (t && ev1.types.indexOf(t) < 0) ev1.types.push(t); ev1.byType.push({type: t, n, nos: nos.map(String)});
   if (t && later(info, out.byType.get(norm(t)))) out.byType.set(norm(t), info);
   const rest = n - Math.max(ids.length, nos.length); if (rest > 0) out.counts.push({type: norm(t), n: rest, info}); });
  out.events.push(ev1);
 });
 return out;
}
/* the reference's own words pairing a toilet block with its waste tank, e.g. WC60's "Toilet block 1119489 with waste tank 1328980" */
function notePairs(key, a) {
 const out = new Map(), text = docs(key).map(d => String((d && d.note) || '')).concat((a && a.asset_notes) || [], (a && a._note) || '').map(x => typeof x === 'string' ? x : JSON.stringify(x || '')).join(' \n ');
 let m; const R1 = /(\d{4,8})\s+with\s+(?:its\s+|a\s+|the\s+)?waste\s+tank\s+(\d{4,8})/gi, R2 = /waste\s+tank\s+(\d{4,8})\s+(?:with|for|on|to)\s+(?:the\s+)?(?:toilet\s+)?(?:block\s+)?(\d{4,8})/gi;
 while ((m = R1.exec(text))) if (!out.has(m[2])) out.set(m[2], m[1]);
 while ((m = R2.exec(text))) if (!out.has(m[1])) out.set(m[1], m[2]);
 return out;
}
/* size, weight and rating for one unit: a reference of one kind of item keeps the reference's figures; on a mixed reference
   each unit takes its own product's figures (WC09's FWF guide is not the toilet block's), or "to confirm" */
const RP = new Map();
function productFacts(key, a, u) {
 let hit = RP.get(key); if (!hit || Date.now() - hit.t > 60000) { let list = []; try { list = W.Loading931 && Loading931.referenceProducts931 ? Loading931.referenceProducts931(a) || [] : []; } catch (x) { list = []; } hit = {t: Date.now(), list}; RP.set(key, hit); }
 const p = hit.list.find(x => (x.units || []).some(v => v && v.id === u.id)) || hit.list.find(x => norm(x.item) === norm(u.item) && x.owner === u.owner) || hit.list.find(x => norm(x.item) === norm(u.item));
 return p ? (p.facts || []).map(f => ({k: String(f.label || ''), v: (f.values || []).join(' · '), guide: /guide/i.test(String(f.label || ''))})) : [];
}

/* ---- the ticks and bookings on the record, unit by unit (this device's copy and the shared one, the later stamp winning) ---- */
function docs(key) { const l = ((typeof S !== 'undefined' && S.delivery) || {})[key] || {}; let c = {}; try { c = ((typeof CROW !== 'undefined' && CROW.get(key)) || {}).delivery || {}; } catch (x) { c = {}; } return [l, c]; }
function umap(key, field, stamp) {
 const out = {};
 docs(key).forEach(d => { const m = d && d[field]; if (!m || typeof m !== 'object') return;
  Object.keys(m).forEach(u => { const v = m[u]; if (!v || typeof v !== 'object') return; const p = out[u], a = String(v[stamp] || ''), b = p ? String(p[stamp] || '') : '';
   if (!p || a > b || (a === b && JSON.stringify(v) < JSON.stringify(p))) out[u] = v; }); });
 return out;
}

/* ---- the cards: one per unit ---- */
function tidyWhere(t) { const s = String(t || '').replace(/^Relocate VMS\s*\d+\w?\s+to\s+(the\s+)?/i, '').split(/\s[—–-]\s(?=installed|stored|Roadtek|removed)/i)[0].trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
function vmsIndex() {
 const V = W.VMS1024, byPos = new Map(), byAsset = new Map(), off = new Map();
 if (!V || typeof V.boards !== 'function') return {V: null, byPos, byAsset, off};
 try { (V.boards() || []).forEach(b => { if (!b || !b.pos) return; byPos.set(String(b.pos).toLowerCase(), b); let id = {}; try { id = V.identity(b) || {}; } catch (x) { id = {}; } if (id.asset && !byAsset.has(String(id.asset))) byAsset.set(String(id.asset), b); }); } catch (x) {}
 try { (W.VmsOff1132 && VmsOff1132.boards ? VmsOff1132.boards() : []).forEach(b => off.set(String(b.pos).toLowerCase(), b)); } catch (x) {}
 let fin = null; try { fin = ((W.VmsOff1132 && VmsOff1132.MORNINGS) || []).find(m => m && m.final) || null; } catch (x) { fin = null; }
 return {V, byPos, byAsset, off, fin};
}
function boardOf(c, X) {
 if (!X.V) return null;
 const m = String(c.label || '').match(/VMS\s*0?(\d+)/i);
 let home = m ? (X.byPos.get(pad(+m[1])) || X.byPos.get(String(+m[1]))) : null;
 if (!home && c.no) home = X.byAsset.get(c.no);
 if (!home) return null;
 const posOf = x => { try { return X.V.position(x) || {}; } catch (y) { return {lat: x.lat, lon: x.lon}; } };
 /* the event position (02a) while its pin is the newer one; a newer pin back at the home position (02) wins */
 const t0 = home.moves_to && X.byPos.get(String(home.moves_to).toLowerCase()), hp = posOf(home), tp = t0 ? posOf(t0) : null;
 const hAt = hp.by ? String(hp.at || '') : '', tAt = tp && tp.by ? String(tp.at || '') : '', to = t0 && !(hAt && hAt > tAt) ? t0 : null, b = to || home, p = to ? tp : hp;
 const lab = x => { try { return X.V.label(x); } catch (y) { return 'VMS ' + x.pos; } };
 const off = X.off.get(String(home.pos).toLowerCase());
 const out = {label: lab(home).replace(/\*$/, ''), at: lab(b).replace(/\*$/, ''), moved: !!to, where: tidyWhere(b.title), lat: +p.lat, lon: +p.lon, how: String(p.how || ''), pinned: !!p.by, store: off ? String(off.store || '') : '', from: off ? String(off.from || '') : '', stored: null};
 /* a session board (13-17) goes to its store after the final removal morning, or once its off-the-track tick is in */
 if (off && off.store && X.fin) { let st = {}; try { st = VmsOff1132.state(X.fin.iso, home.pos) || {}; } catch (x) { st = {}; }
  const done = !!(st.off && st.off.done), due = Date.now() >= Date.parse(X.fin.iso + 'T' + (/^\d{2}:\d{2}$/.test(off.from) ? off.from : '06:00') + ':00+10:00');
  if (done || due) { const pinned = Number.isFinite(+off.storeLat) && Number.isFinite(+off.storeLon) && off.storeLat != null && off.storeLon != null;
   out.stored = {done, at: done ? String(st.off.at || '') : '', by: done ? String(st.off.by || '') : '', day: X.fin.iso, pinned, track: out.at + ' · ' + out.where};
   out.where = String(off.store); if (pinned) { out.lat = +off.storeLat; out.lon = +off.storeLon; out.how = 'its store, ' + (off.storeBy || 'on the removals sheet'); } } }
 return out;
}
/* a board the VMS plan holds and no delivery reference does: off site once the VMS tab records it so */
function boardGone(b, X) {
 let r = null; try { r = X.V.rec ? X.V.rec(b.pos) : null; } catch (x) { r = null; } if (!r) return null;
 const evs = (Array.isArray(r.events1098) ? r.events1098 : []).slice().sort((x, y) => String(x.recorded_at || '').localeCompare(String(y.recorded_at || '')));
 const last = evs[evs.length - 1], was = evs.some(x => /^on site$/i.test(String(x.state || '')));
 if (!last || !was || !/off site|not on site|in transit|collected|removed/i.test(String(last.state || ''))) return null;
 return {at: null, day: String(last.effective_date || '') || (ok(last.recorded_at) ? qDay(last.recorded_at) : null), by: String(last.by || '')};
}
function furnFold(rows) {
 const bld = new Map(); rows.forEach(r => { if (catOf(r.key) === 'bld') { const n = norm((r.a && r.a.name) || ''); if (n) bld.set(n, r.key); } });
 const into = new Map(), skip = new Set();
 rows.forEach(r => { if (catOf(r.key) !== 'furn') return; const a = r.a || {}, parts = [a.name].concat(a.locations || []).join(' · ').split(/\s*·\s*/).map(norm);
  const hit = parts.map(p => bld.get(p)).find(Boolean); if (!hit) return; skip.add(r.key); if (!into.has(hit)) into.set(hit, []); into.get(hit).push(r); });
 return {into, skip};
}
function insideOf(r, fold) {
 const a = r.a || {}, out = [];
 (a.accessories || []).forEach(x => { if (!x || x._removed) return; const q = Number(x.qty) || 1; out.push((q > 1 ? q + ' × ' : '') + String(x.type || x.as_written || 'item') + (x.asset_no ? ' ' + x.asset_no : '')); });
 (fold.into.get(r.key) || []).forEach(f => { const sp = specsOf(f), n = (sp.assetNos || []).join(' '); out.push(descOf(f).split(' · ')[0] + ' (' + f.key + ')' + (n ? ' ' + n : '')); });
 return out;
}
/* who owns a run the record holds no units for: the page's own reading of the reference (its sub-hire company, or owner unknown) */
function groupOwner(r) {
 const co = String(r.subCo || '').trim(); if (co) return /event\s*portables/i.test(co) ? 'event-portables' : /prem/i.test(co) ? 'prem-air-hire' : 'other:' + norm(co).replace(/\s+/g, '-');
 return r.ownerUnk ? 'unknown' : 'coates';
}
const BLD = /build|office|cabin|container|hut|kiosk|room|amenit|lunch|crib|first aid|store|ticket|booth|marquee/i;
function cardsOf(r, X, fold) {
 const key = r.key, cat = catOf(key);
 let a = r.a; if (!a) { try { a = assetOf(key); } catch (x) { a = null; } } a = a || {};
 let us = []; try { us = (gcUnits925(a, {loading: false}) || []).filter(u => u && u.physical !== false); } catch (x) { us = []; }
 const G = depOf(key), what = descOf(r), sp = specsOf(r), arr = arrivalOf(key);
 let inside = cat === 'bld' ? insideOf(r, fold) : [];
 /* a building is its own card; the units the record keeps inside it (air conditioners, a fridge) are listed on that card */
 if (cat === 'bld' && us.length > 1) {
  const types = new Set((r.units || []).map(x => norm(x.type))); let own = us.filter(u => types.has(norm(u.item)));
  if (!own.length) own = us.filter(u => BLD.test(String(u.item || '') + ' ' + String(u.label || '')));
  if (own.length && own.length < us.length) { const said = inside.join(' ');
   us.filter(u => own.indexOf(u) < 0).forEach(u => { if (!u.assetNo || said.indexOf(String(u.assetNo)) < 0) inside.push(String(u.item || u.label || 'item') + (u.assetNo ? ' ' + u.assetNo : '')); });
   us = own; }
 }
 const base = {key, r, cat, what, sp, arr, G, inside};
 if (cat === 'wb' || cat === 'ground' || r.kind === 'barrier' || !us.length) {
  const n = (r.units || []).reduce((s, u) => s + (Number(u.n) || 0), 0) || us.length || 0, own = new Map(); us.forEach(u => own.set(u.owner, (own.get(u.owner) || 0) + 1));
  const top = [...own].sort((x, y) => y[1] - x[1])[0]; const item = String((a.item_types || [])[0] || a.product || what);
  return [Object.assign({}, base, {uid: '*', group: true, n, owner: top ? String(top[0] || 'unknown') : groupOwner(r), item, no: '', nos: (sp.assetNos || []).slice(), icon: iconKey(item + ' ' + what, cat), facts: sp.facts || [],
   gone: G.complete ? (G.last || {}) : null, part: !G.complete && G.collected > 0 ? {collected: G.collected, remaining: G.remaining} : null})];
 }
 /* a unit the record has not identified yet still has a card ("asset no. to confirm"), so the count never drops one */
 const want = (r.units || []).reduce((s, x) => s + (Number(x.n) || 0), 0); let short = cat === 'vms' ? 0 : want - us.length;
 if (short > 0) (r.units || []).forEach(x => { if (short <= 0) return; const t = String(x.type || ''), have = us.filter(u => norm(u.item) === norm(t)), miss = Math.min(short, (Number(x.n) || 0) - have.length); if (!t || miss <= 0) return;
  const owners = [...new Set(have.map(u => u.owner))], owner = owners.length === 1 ? owners[0] : 'unknown';
  for (let i = 1; i <= miss; i++) us.push({id: 'ph|' + key + '|' + norm(t) + '|' + i, owner, assetNo: '', nativeId: 'ph' + norm(t).replace(/\W+/g, '') + i, label: t, item: t, physical: true, placeholder: true, registration: '', branch: ''});
  short -= miss; });
 /* a waste tank goes on its toilet's card only on the record's word: its label names the toilet or the set, or the reference's
    note pairs them; or, once those are paired, one tank and one toilet block of that owner are left */
 const tanks = us.filter(u => /waste tank/i.test(String(u.item || '') || String(u.label || ''))), rest = us.filter(u => tanks.indexOf(u) < 0), pairs = new Map(), used = new Set(), np = notePairs(key, a);
 tanks.forEach(tk => { const lb = String(tk.label || '');
  let to = null; const m = lb.match(/toilet\s+(\w+)/i); if (m) to = rest.find(u => u.assetNo === m[1] && !pairs.has(u));
  if (!to && tk.assetNo && np.has(String(tk.assetNo))) to = rest.find(u => u.assetNo === np.get(String(tk.assetNo)) && !pairs.has(u));
  if (!to) { const s = lb.match(/set\s*(\d+)/i); if (s) to = rest.find(u => new RegExp('set\\s*' + s[1] + '\\b', 'i').test(String(u.label || '')) && !pairs.has(u)); }
  if (to) { pairs.set(to, tk); used.add(tk); } });
 [...new Set(tanks.map(t => t.owner))].forEach(o => { const ft = tanks.filter(t => t.owner === o && !used.has(t)), fb = rest.filter(u => u.owner === o && /block/i.test(String(u.item || '')) && !pairs.has(u));
  if (ft.length === 1 && fb.length === 1) { pairs.set(fb[0], ft[0]); used.add(ft[0]); } });
 const list = rest.concat(tanks.filter(t => !used.has(t))).sort((x, y) => (x.owner === y.owner ? 0 : x.owner === 'coates' ? -1 : y.owner === 'coates' ? 1 : nat(x.owner, y.owner)) || (x.placeholder ? 1 : 0) - (y.placeholder ? 1 : 0) || nat(x.label || '', y.label || '') || nat(x.assetNo || '', y.assetNo || ''));
 const mixed = new Set(us.filter(u => !/waste tank/i.test(String(u.item || ''))).map(u => norm(u.item))).size > 1; /* a block and its tank are one kind of thing */
 /* when it left: the unit's own departure first (its unit id or asset number); then a type with none remaining (all of that type
    has gone); a departure counted without numbers goes to the units the record has not identified, never to a numbered unit; once
    the reference has left in full, any unit still unmatched takes the last departure (Departure1211.unit's order) */
 const goneU = u => G.ids.get(String(u.id)) || (u.assetNo && G.nos.get(String(u.assetNo))) || (G.left.get(norm(u.item)) === 0 && G.byType.get(norm(u.item))) || null;
 const cards = list.map((u, i) => { const tk = pairs.get(u) || null, text = String(u.item || u.label || '');
  const c = Object.assign({}, base, {uid: uk(u), u, tank: tk, owner: String(u.owner || 'unknown'), item: String(u.item || u.label || what), label: String(u.label || ''), no: String(u.assetNo || ''), tankNo: tk ? String(tk.assetNo || '') : '',
   rego: String(u.registration || ''), branch: String(u.branch || r.branch || ''), idx: i + 1, of: list.length, icon: iconKey(text + (tk ? ' block' : ''), cat), facts: mixed ? productFacts(key, a, u) : sp.facts || [], ph: !!u.placeholder});
  const g1 = goneU(u), g2 = tk ? goneU(tk) : g1; c.gone = g1 && g2 ? (later(g2, g1) ? g2 : g1) : null; c.half = !c.gone && tk && (g1 || g2) ? (g1 ? 'block' : 'tank') : null; c.part = null;
  if (cat === 'vms') c.vms = boardOf(c, X);
  return c; });
 G.counts.forEach(x => { let n = x.n; cards.forEach(c => { if (n <= 0 || c.gone || c.no || norm(c.u.item) !== x.type) return; c.gone = x.info; n--; });
  if (n > 0) cards.forEach(c => { if (!c.gone && norm(c.u.item) === x.type) c.unk = (c.unk || 0) + n; }); });
 if (G.complete) cards.forEach(c => { if (!c.gone) { c.gone = G.last || {}; c.half = null; c.unk = 0; } });
 return cards;
}
/* a unit's entry on the record: under its own key; failing that, under a key it had before its asset number or owner was filled
   in (the same unit record, owner to confirm, or the one card its reference had before its units were recorded) */
function altKeys(c) {
 const u = c.u || {}, o = String(u.owner || 'unknown'), out = [], add = k => { k = k === '*' ? k : String(k).replace(/[^\w:.|-]+/g, '_').slice(0, 120); if (k && k !== c.uid && out.indexOf(k) < 0) out.push(k); };
 if (u.nativeId) add(o + '|' + u.nativeId); if (u.id) add(o + '|' + u.id);
 if (o !== 'unknown') { if (u.assetNo) add('unknown|' + u.assetNo); if (u.nativeId) add('unknown|' + u.nativeId); }
 if (!c.group) add('*');
 return out;
}
function pickOf(map, c, stamp) {
 if (map[c.uid]) return map[c.uid];
 const doc = c.u && c.u.docKey ? String(c.u.docKey) : '', byDoc = doc ? Object.keys(map).map(k => map[k]).filter(v => v && v.doc === doc) : [];
 return byDoc.concat(altKeys(c).map(k => map[k]).filter(Boolean)).sort((x, y) => String(y[stamp] || '').localeCompare(String(x[stamp] || '')))[0] || null;
}
function stateOf(c, ctx) {
 if (c.gone) return {s: 'gone', at: c.gone.at || null, day: c.gone.day || null, by: c.gone.by || ''};
 const rv = c.G && c.G.review ? c.key + '’s departure record needs review (quantities changed after a pick-up); check it on Picked up' : ''; /* shown after who and when, whatever the light */
 if (c.group && !c.r.noPlan1236) { let st = null; try { st = Ready1231.state(c.r); } catch (x) { st = null; }
  if (st && st.m && st.m.on) return {s: 'ready', at: st.m.at || null, by: st.m.by || '', why: '', src: 'ref', part: c.part, rv}; /* only a Ready tick makes it Ready */
  const m = st && st.m && !st.m.on ? st.m : null; return {s: 'not', at: m ? m.at : null, by: m ? m.by : '', why: m ? m.why || '' : st && st.e && st.e.on ? 'emptied · not ticked Ready yet' : st && st.pump ? 'pump it out first, then tick it' : 'not ticked yet', rv, part: c.part}; }
 const valid = x => x && ok(x.at) && (!ctx.on || Date.parse(x.at) >= Date.parse(ctx.on)), t = pickOf(ctx.ticks, c, 'at'), list = [];
 if (valid(t)) list.push({on: !!t.on, at: t.at, by: String(t.by || ''), why: String(t.why || ''), src: 'unit'});
 if (ctx.mark && ok(ctx.mark.at) && ctx.oneOwner) list.push({on: !!ctx.mark.on, at: ctx.mark.at, by: String(ctx.mark.by || ''), why: String(ctx.mark.why || ''), src: 'ref'});
 /* Andrew: "everything ticked not ready. Unless i have done so or if its been collected already". Emptied (pumped out) is the
    gate a toilet passes before it can be loaded, never a Ready tick: a unit reads Ready only once it is ticked Ready (its own
    tick, or its reference's when one owner holds every unit there; at WC31 a tick for the reference is not a tick for the
    Coates block or Event Portables' 16 Pans beside it) */
 const pumped = c.r.empty && ctx.emp && ctx.emp.on;
 if (!list.length) return {s: 'not', why: c.r.empty ? (pumped ? 'not ticked yet · ' + c.key + ' is emptied; tick it Ready when it can go' : 'not ticked yet · pump it out, then tick it') : 'not ticked yet', part: c.part, rv};
 list.sort((x, y) => String(y.at).localeCompare(String(x.at)) || (Number(x.on) - Number(y.on)));
 const p = list[0]; return {s: p.on ? 'ready' : 'not', at: p.at, by: p.by, why: p.why, src: p.src, part: c.part, rv};
}

/* ---- a VMS board on the VMS plan that no delivery reference holds as a unit (Andrew: "ensure we add all VMS boards") ---- */
function boardCards(X, cards) {
 if (!X.V) return;
 const have = new Set(cards.filter(c => c.cat === 'vms' && c.no).map(c => c.no)), targets = new Set();
 X.byPos.forEach(b => { if (b.moves_to) targets.add(String(b.moves_to).toLowerCase()); });
 const facts = []; /* another board's guide figures are not this board's (a Premiair trailer is not a Coates Senior board) */
 X.byPos.forEach((b, pos) => {
  if (targets.has(pos)) return;
  let id = {}; try { id = X.V.identity(b) || {}; } catch (x) { id = {}; }
  const asset = String(id.asset || '').trim(); if (!asset || have.has(asset)) return; have.add(asset);
  const lab = (() => { try { return X.V.label(b); } catch (x) { return 'VMS ' + b.pos; } })().replace(/\*$/, ''), key = lab.replace(/\s+/g, '');
  const co = String(id.co || '').trim(), owner = /prem/i.test(co) ? 'prem-air-hire' : /coates/i.test(co) ? 'coates' : co ? 'other:' + norm(co).replace(/\s+/g, '-') : 'unknown';
  const c = {key, r: {key, empty: false, zone: '', branch: ''}, cat: 'vms', what: 'VMS · message board', sp: {facts}, facts, arr: null, G: null, inside: [], uid: 'vms:' + b.pos, board: true, owner, item: 'VMS', label: lab, no: asset, tankNo: '', rego: String(id.rego || ''), branch: '', idx: 1, of: 1, icon: 'vms', gone: boardGone(b, X), part: null};
  c.vms = boardOf(Object.assign({}, c, {label: 'VMS' + b.pos}), X) || {label: lab, at: lab, moved: false, where: tidyWhere(b.title), lat: +b.lat, lon: +b.lon, how: '', pinned: false, store: '', from: '', stored: null};
  c.st = c.gone ? {s: 'gone', at: null, day: c.gone.day, by: c.gone.by} : {s: 'not', why: 'on the VMS plan · not on a delivery reference yet'}; c.book = null;
  cards.push(c); });
}

/* ---- the model, worked out once per drawing ---- */
let MEMO = {M: null, at: 0, v: -1, model: null}, VER = 0;
function model() {
 let M = null; try { M = demob816(); } catch (x) { M = null; }
 const now = Date.now();
 if (MEMO.model && MEMO.M === M && MEMO.v === VER && now - MEMO.at < 4000) return MEMO.model;
 const rows = everyRows('all'), X = vmsIndex(), fold = furnFold(rows), cards = [];
 rows.forEach(r => { if (fold.skip.has(r.key)) return;
  /* a run the record holds as not on site, with nothing collected, is not on site (WB19, WB20) */
  let lit = ''; try { lit = deliveryOf(r.key).state; } catch (x) { lit = ''; }
  if (lit === 'not on site') { let ev = 0; try { ev = ((Departure1211.status(r.key) || {}).events || []).length; } catch (x) { ev = 0; } if (!ev) return; }
  let list = []; try { list = cardsOf(r, X, fold); } catch (x) { list = []; }
  if (!list.length) return;
  let mark = null, emp = null, on = null; try { mark = Ready1231.mark(r.key); } catch (x) { mark = null; } try { emp = r.empty ? emptiedOf816(r.key) : null; } catch (x) { emp = null; } try { on = lastOnSite816(r.key); } catch (x) { on = null; }
  const ctx = {mark, emp, on, oneOwner: new Set(list.map(c => c.owner)).size === 1, ticks: umap(r.key, 'ready1238_units', 'at')}, books = umap(r.key, 'pickup1238_units', 'set');
  list.forEach(c => { c.st = stateOf(c, ctx); const b = pickOf(books, c, 'set'); c.book = b && ok(b.at) ? b : null; cards.push(c); }); });
 try { boardCards(X, cards); } catch (x) {}
 const m = {cards, byKey: new Map(), byId: new Map()};
 cards.forEach(c => { if (!m.byKey.has(c.key)) m.byKey.set(c.key, []); m.byKey.get(c.key).push(c); m.byId.set(c.key + '#' + c.uid, c); });
 MEMO = {M, at: now, v: VER, model: m};
 return m;
}

/* ---- the two map pictures: the page's own "on the map" pictures, with the icon and a pulsing ring on the spot ---- */
/* the spot is looked up again every 30 s (Find1176 reads the pins live), so a moved pin moves the pictures, Navigate and the words */
const LOC = new Map();
function locOf(c) {
 const k = c.vms ? 'v|' + c.vms.at + '|' + c.vms.lat + ',' + c.vms.lon : 'a|' + c.key, hit = LOC.get(k);
 if (hit && Date.now() - hit.t < 30000) return hit.L;
 let L = null;
 if (c.vms) { if (Number.isFinite(c.vms.lat) && Number.isFinite(c.vms.lon)) { const lab = c.vms.stored ? c.vms.label : c.vms.at; try { L = Find1176.locate({kind: 'vms', label: lab, where: c.vms.where, lat: c.vms.lat, lon: c.vms.lon}); } catch (x) { L = null; } if (!L) L = {kind: 'vms', label: lab, tag: lab, what: 'VMS board', lat: c.vms.lat, lon: c.vms.lon, how: c.vms.how}; } }
 else { try { L = W.Find1176 ? Find1176.locate({kind: 'asset', key: c.key}) : null; } catch (x) { L = null; } if (L && !(Number.isFinite(L.lat) && Number.isFinite(L.lon))) L = null; }
 LOC.set(k, {L, t: Date.now()}); return L;
}
const navOf = L => 'https://www.google.com/maps/dir/?api=1&destination=' + L.lat.toFixed(6) + ',' + L.lon.toFixed(6) + '&travelmode=driving';
const VIEWW = {close: 'Close up · 190 m', wide: 'Wider area · 840 m'};
function spotOf(L, v) {
 try { if (Find1176.inAerial(L)) { const g = DATA.georef, fr = frameOf(L.lat, L.lon), FX = g.frame_px[0], FY = g.frame_px[1], pxm = 1 / g.m_per_frame_px_ground, half = v === 'wide' ? 420 : 95;
  let fw = 2 * half * pxm, fh = fw * 720 / 1000; if (fw > FX) { fw = FX; fh = fw * 720 / 1000; } if (fh > FY) { fh = FY; fw = fh * 1000 / 720; }
  const x0 = Math.max(0, Math.min(FX - fw, fr.ax * FX - fw / 2)), y0 = Math.max(0, Math.min(FY - fh, fr.ay * FY - fh / 2));
  return {x: (fr.ax * FX - x0) / fw, y: (fr.ay * FY - y0) / fh * 720 / 824}; } } catch (x) {}
 return {x: 0.5, y: 360 / 824};
}
const PIC = new Map(), PFAIL = new Map(), PQ = [], FLY = new Set(); let pbusy = 0;
/* a picture is kept by its place: a moved pin draws a new one */
const picId = (c, v, L) => (c.vms ? 'v|' + c.vms.label : 'a|' + c.key) + '|' + L.lat.toFixed(6) + ',' + L.lon.toFixed(6) + '|' + v;
const LBY = new Map();
const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('picture')); im.src = src; });
async function drawPic(id) {
 const L = LBY.get(id); if (!L) return null;
 const v = id.slice(id.lastIndexOf('|') + 1), V = (Find1176.VIEWS || []).find(x => x.key === v); if (!V) return null;
 const pic = await Find1176.picture(L, V); if (!pic || !pic.dataUrl) return null;
 const im = await loadImg(pic.dataUrl), w = 560, h = Math.round(w * im.naturalHeight / im.naturalWidth);
 const cv = D.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); if (!c) return null;
 c.imageSmoothingEnabled = true; try { c.imageSmoothingQuality = 'high'; } catch (x) {} c.drawImage(im, 0, 0, w, h);
 const b = await new Promise(res => { try { cv.toBlob(x => res(x), 'image/jpeg', 0.84); } catch (x) { res(null); } });
 return b ? URL.createObjectURL(b) : null;
}
function show(id) {
 const url = PIC.get(id); if (!url) return;
 D.querySelectorAll('#pane-demob img[data-pi1238]:not(.on)').forEach(im => { if (im.getAttribute('data-pi1238') !== id) return; im.src = url; im.classList.add('on'); const w = im.parentNode && im.parentNode.querySelector('.w1238'); if (w) w.remove(); });
}
function failed(id) {
 D.querySelectorAll('#pane-demob img[data-pi1238]').forEach(im => { if (im.getAttribute('data-pi1238') !== id || !im.parentNode) return; const f = im.parentNode; im.remove(); const w = f.querySelector('.w1238'); if (w) w.remove();
  if (!f.querySelector('.nm1238')) f.insertAdjacentHTML('beforeend', '<span class="nm1238">The picture did not load · tap for the map</span>'); });
}
function pump() {
 while (pbusy < 3 && PQ.length) {
  const id = PQ.pop(); /* the newest wanted first: the cards on screen now */ if (PIC.has(id)) { show(id); continue; } if (FLY.has(id)) continue;
  pbusy++; FLY.add(id);
  drawPic(id).then(u => { if (u) { const old = PIC.get(id); if (old && old !== u) { try { URL.revokeObjectURL(old); } catch (x) {} } PIC.set(id, u); show(id); } else { PFAIL.set(id, Date.now()); failed(id); } }).catch(() => { PFAIL.set(id, Date.now()); failed(id); }).then(() => { FLY.delete(id); pbusy--; pump(); });
 }
}
function want(id) { if (PIC.has(id)) { show(id); return; } if (FLY.has(id)) return; if (PFAIL.has(id) && Date.now() - PFAIL.get(id) < 60000) { failed(id); return; } if (PQ.indexOf(id) < 0) PQ.push(id); pump(); }
let io = null, ioRoot;
function scroller() { const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement; while (sc && sc !== D.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY)) return sc; sc = sc.parentElement; } return null; }
function arm() {
 const cards = [...D.querySelectorAll('#pane-demob article.sg1238')].filter(a => a.querySelector('img[data-pi1238]:not(.on)')); if (!cards.length) return;
 const wantAll = a => a.querySelectorAll('img[data-pi1238]:not(.on)').forEach(im => want(im.getAttribute('data-pi1238')));
 if (!('IntersectionObserver' in W)) { cards.forEach(wantAll); return; }
 const root = scroller();
 if (!io || ioRoot !== root) { if (io) io.disconnect(); ioRoot = root; io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); wantAll(en.target); } }), {root, rootMargin: '500px 0px'}); }
 cards.forEach(a => io.observe(a));
}
function picsState() { return {on: D.querySelectorAll('#pane-demob img[data-pi1238].on').length, all: D.querySelectorAll('#pane-demob img[data-pi1238]').length, drawn: PIC.size, failed: PFAIL.size, queued: PQ.length, busy: pbusy}; }
function picsHtml(c) {
 const L = locOf(c), ic = SVG(ICONS[c.icon] || ICONS.other), k = e(c.key), u = e(c.uid);
 if (!L) return '<div class="ph1238"><button type="button" class="pf1238" data-pic1238="' + k + '" data-u1238="' + u + '" aria-label="' + k + ': no place on the record yet"><span class="nm1238">No place on the record yet · ' + (c.vms ? 'the board’s pin is still to come' : 'the driver reports at the pit lane') + '</span><span class="pb1238">' + ic + '</span></button><button type="button" class="pf1238" data-pic1238="' + k + '" data-u1238="' + u + '" aria-label="' + k + ': details"><span class="nm1238">Tap for its details</span></button></div>';
 const fr = v => { const id = picId(c, v, L), s = spotOf(L, v); LBY.set(id, L); const url = PIC.get(id);
  return '<button type="button" class="pf1238" data-pic1238="' + k + '" data-u1238="' + u + '" aria-label="' + e(c.key + ': ' + VIEWW[v].toLowerCase() + ' on the map - open the full pictures, Navigate and Send') + '">' + (url ? '' : '<span class="w1238"></span>')
   + '<img alt="" decoding="async" draggable="false" data-pi1238="' + e(id) + '"' + (url ? ' src="' + e(url) + '" class="on"' : '') + '><i class="pu1238" style="left:' + (s.x * 100).toFixed(2) + '%;top:' + (s.y * 100).toFixed(2) + '%"></i><span class="pb1238">' + ic + '</span><span class="vw1238">' + VIEWW[v] + '</span></button>'; };
 return '<div class="ph1238">' + fr('close') + fr('wide') + '</div>';
}

/* ---- the card ---- */
const canEd = () => { try { return typeof canEdit === 'function' && canEdit(); } catch (x) { return false; } };
function titleOf(c) {
 if (c.vms) return c.vms.label;
 if (c.group) return c.what.split(' · ')[0];
 if (c.of === 1 && !c.tank) return c.what.split(' · ').slice(0, 2).join(' · ');
 let t = c.item; const w = WORD[c.icon] || '', last = w.split(' ').pop().replace(/s$/, '');
 if (last && !new RegExp(last, 'i').test(t)) t += ' · ' + w;
 return t + (c.tank ? ' + waste tank' : '');
}
function lampsHtml(c) {
 const s = c.st.s, ed = canEd() && s !== 'gone' && !c.board, k = e(c.key), u = e(c.uid);
 const lamp = (v, cls, word, g, lit) => (ed ? '<button type="button" class="lp1238 ' + cls + (lit ? ' on' : '') + '" data-lamp1238="' + v + '" data-k1238="' + k + '" data-u1238="' + u + '"' + (lit ? ' aria-current="true"' : '') + ' title="' + word + '">' : '<span class="lp1238 ' + cls + (lit ? ' on' : '') + '" title="' + word + '">') + '<i>' + g + '</i>' + word + (ed ? '</button>' : '</span>');
 return '<div class="lm1238" role="group" aria-label="' + e(c.key + ' ' + (c.no || '') + ': ' + (s === 'gone' ? 'picked up' : s === 'ready' ? 'ready for collection' : 'not ready for collection')) + '">' + lamp('not', 'red', 'Not ready', '✕', s === 'not') + lamp('ready', 'amber', 'Ready', '●', s === 'ready') + lamp('gone', 'green', 'Picked up', '✓', s === 'gone') + '</div>';
}
function statusWords(c) {
 const st = c.st;
 if (st.s === 'gone') return ['Picked up', (st.at ? when(st.at) : st.day ? dayW(st.day) + ' · time not recorded' : 'time not recorded') + (st.by ? ' · ' + st.by : '')];
 const part = (c.group && c.part ? ' · ' + c.part.collected + ' picked up, ' + c.part.remaining + ' to go' : '')
  + (c.half === 'block' ? ' · the toilet block has left; waste tank ' + (c.tankNo || '') + ' is still here' : c.half === 'tank' ? ' · waste tank ' + (c.tankNo || '') + ' has left; the toilet block is still here' : '')
  + (c.unk ? ' · ' + c.unk + ' ' + (c.item || 'unit') + (c.unk === 1 ? ' has' : 's have') + ' left without an asset number: which one is still to confirm' : '');
 const rv = st.rv ? ' · ' + st.rv : '';
 if (st.s === 'ready') return ['Ready for collection', (st.src === 'emptied' ? 'emptied · ' : '') + [st.by, st.at ? when(st.at) : ''].filter(Boolean).join(' · ') + part + rv];
 return ['Not ready', (st.at ? [st.why, st.by, when(st.at)].filter(Boolean).join(' · ') : st.why || 'not ticked yet') + part + rv];
}
function bookHtml(c) {
 if (c.st.s === 'gone') return '';
 if (c.board) return '<div class="bk1238">' + UI.cal + '<span>Pick-up<small>On the VMS plan only: booking opens once the board is on a delivery reference</small></span></div>';
 const k = e(c.key), u = e(c.uid), b = c.book, btn = '<button type="button" data-book1238="' + k + '" data-u1238="' + u + '">' + (b ? 'Change' : 'Book pick-up') + '</button>';
 if (!b) return canEd() ? '<div class="bk1238">' + UI.cal + '<span>Pick-up</span>' + btn + '</div>' : ''; /* v12.42.1 - Andrew: no "booked" wording that reads as nothing done; the button is enough, and the view link (no button) shows a pick-up only once it is booked */
 const past = Date.parse(b.at) < Date.now();
 return '<div class="bk1238 on' + (past ? ' past' : '') + '">' + UI.truck + '<span>Pick-up booked <b>' + e(when(b.at)) + '</b>' + (past ? ' · time passed' : '') + '<small>' + e([b.note, b.by ? 'booked by ' + b.by : ''].filter(Boolean).join(' · ')) + '</small></span>' + btn + '</div>';
}
function pillsHtml(c) {
 const out = [];
 if (c.arr) out.push('<span class="ar"><i>Arrived</i>' + e(dayW(c.arr.day)) + '</span>');
 const facts = (c.facts || []).slice(0, 3), seen = {};
 facts.forEach(f => { const v = String(f.v || ''), src = f.guide ? 'guide' : /contract/i.test(f.k) ? 'contract' : /^actual/i.test(f.k) ? 'actual' : '';
  const mm = v.match(/(\d[\d\s×x–-]*×[\d\s×x–-]*\d)\s*mm/), kg = v.match(/([\d–-]+)\s*kg/i), kva = /kva/i.test(v) && !mm ? v : '';
  if (mm && !seen.size) { seen.size = 1; out.push('<span><i>Size</i>' + e(mm[1].replace(/\s+/g, ' ').trim()) + ' mm' + (src ? '<em>' + src + '</em>' : '') + '</span>'); }
  if (kg && !seen.weight) { seen.weight = 1; out.push('<span><i>Weight</i>' + e(kg[1]) + ' kg' + (src ? '<em>' + src + '</em>' : '') + '</span>'); }
  if (kva && !seen.kva) { seen.kva = 1; out.push('<span><i>Rating</i>' + e(v.replace(/\s*\(.*\)$/, '')) + '</span>'); }
  if (/Length|Width|Height/.test(v) && !seen.size) { seen.size = 1; out.push('<span><i>Size</i>' + e(v.split(' · ').filter(x => /mm/.test(x)).join(' · ')) + (src ? '<em>' + src + '</em>' : '') + '</span>'); }
  const mass = v.match(/Mass\s+([^·]+)/); if (mass && !seen.weight) { seen.weight = 1; out.push('<span><i>Weight</i>' + e(mass[1].trim()) + (src ? '<em>' + src + '</em>' : '') + '</span>'); } });
 if (!seen.size) out.push('<span class="none"><i>Size</i>to confirm</span>');
 if (!seen.weight) out.push('<span class="none"><i>Weight</i>to confirm</span>');
 return '<div class="mt1238">' + out.join('') + '</div>';
}
function whereHtml(c) {
 const sv = c.vms && c.vms.stored;
 if (sv) return '<div class="wh1238"><b>In storage · ' + e(c.vms.where) + '</b><small>' + (sv.done ? 'Taken off the track' + (ok(sv.at) ? ' ' + e(when(sv.at)) : '') + (sv.by ? ' · ' + e(sv.by) : '') : 'Off the track from ' + e(c.vms.from || '06:00') + ' ' + e(dayW(sv.day)) + ', the removals plan') + '</small><small>Was at ' + e(sv.track) + '</small>'
  + (sv.pinned ? '' : '<small>Its store is not pinned yet: the pictures and Navigate show its last pin on the track</small>') + '</div>';
 if (c.vms) return '<div class="wh1238"><b>' + e(c.vms.moved ? 'Now at ' + c.vms.at : c.vms.at) + '</b> · ' + e(c.vms.where || 'place on the VMS plan') + (c.vms.pinned ? '<small>Pinned on site' + ((c.vms.how.match(/\d{1,2} [A-Z][a-z]{2} \d{4}/) || [])[0] ? ' · ' + e(c.vms.how.match(/\d{1,2} [A-Z][a-z]{2} \d{4}/)[0]) : '') + '</small>' : '') + (c.vms.store ? '<small>After the race it goes to ' + e(c.vms.store) + (c.vms.from ? ' (off the track from ' + e(c.vms.from) + ')' : '') + '</small>' : '') + '</div>';
 let w = null; try { w = DemobMap1236.words(c.key, DemobMap1236.spot(c.key), c.r.zone); } catch (x) { w = null; }
 return w ? '<div class="wh1238"><b>' + e(w[0]) + '</b>' + (w[1] ? ' · ' + e(w[1]) : '') + '</div>' : '';
}
/* the collection stamp: big, glowing and pulsing, with the day and time it left and who recorded it */
function stampHtml(c) {
 const st = c.st, t = st.at ? dayW(qDay(st.at)) + ' · ' + hhmm(st.at) : st.day ? dayW(st.day) : 'time not recorded';
 return '<div class="stw1238"><div class="stp1238" role="img" aria-label="' + e(c.key + ' ' + (c.no || '') + ' picked up ' + t) + '"><i class="stc1238">' + SVG('<path d="m4.5 12.5 5 5 10-11"/>') + '</i><b>Picked up</b><span>' + e(t) + '</span>' + (st.by ? '<small>recorded by ' + e(st.by) + '</small>' : '') + '</div></div>';
}
function cardHtml(c) {
 const k = e(c.key), u = e(c.uid), sw = statusWords(c), own = coName(c.owner), sub = [];
 sub.push(c.board ? 'VMS plan board' : 'GC500 ID <u>' + k + '</u>');
 if (c.of > 1) sub.push(c.idx + ' of ' + c.of);
 if (c.group) sub.push(c.n + ' × ' + e(c.item));
 if (c.branch) sub.push(e(c.branch));
 const ids = [];
 if (c.group) { ids.push('<span class="q"><i>Units</i><b>' + c.n + '</b></span>'); if (c.part) ids.push('<span class="q"><i>Picked up</i><b>' + c.part.collected + '</b></span>'); }
 else ids.push(c.no ? '<span><i>Asset no.</i><b>' + e(c.no) + '</b></span>' : '<span class="no"><i>Asset no.</i><b>to confirm</b></span>');
 if (c.tankNo) ids.push('<span><i>Tank</i><b>' + e(c.tankNo) + '</b></span>');
 if (c.rego) ids.push('<span><i>Rego</i><b>' + e(c.rego) + '</b></span>');
 const q = [c.key, c.no, c.tankNo, c.rego, c.item, c.what, own, c.vms && c.vms.label, c.vms && c.vms.label.replace(/\s+/g, ''), c.vms && c.vms.at, c.vms && c.vms.where].filter(Boolean).join(' ').toLowerCase();
 return '<article class="sg1238 st-' + c.st.s + (c.group ? ' grp' : '') + '" data-sg1238="' + k + '" data-u1238="' + u + '" data-own1238="' + e(c.owner) + '" data-q1238="' + e(q) + '" data-s1238="' + c.st.s + '" data-b1238="' + (c.book ? qDay(c.book.at) : '') + '">'
  + '<div class="hd1238"><span class="ic1238" title="' + e(WORD[c.icon] || '') + '">' + SVG(ICONS[c.icon] || ICONS.other) + '</span><div class="tt1238"><b>' + e(titleOf(c)) + '</b><span>' + sub.join(' · ') + '</span></div><span class="ow1238 ' + ownCls(c.owner) + '">' + e(own) + '</span></div>'
  + '<div class="id1238">' + ids.join('') + '</div>'
  + whereHtml(c) + pillsHtml(c)
  + (c.inside.length ? '<div class="in1238"><i>Inside the building</i>' + e(c.inside.join(' · ')) + '</div>' : '')
  + (c.st.s === 'gone' ? stampHtml(c) : picsHtml(c) + '<div class="ac1238"><button type="button" class="nv1238" data-nv1238="' + k + '" data-u1238="' + u + '">' + UI.nav + '<span>Navigate</span></button><button type="button" data-sm1238="' + k + '" data-u1238="' + u + '">' + UI.text + '<span>Text</span></button><button type="button" data-em1238="' + k + '" data-u1238="' + u + '">' + UI.mail + '<span>Email</span></button><button type="button" data-sd1238="' + k + '" data-u1238="' + u + '">' + UI.send + '<span>Send</span></button></div>')
  + '<div class="ft1238"><div class="lr1238">' + lampsHtml(c) + '<div class="sw1238"><b>' + e(sw[0]) + '</b><small>' + e(sw[1]) + '</small></div></div>' + bookHtml(c) + '</div></article>';
}

/* ---- the lists: Coates first (our list), then each supplier; inside, the groups ---- */
const cnt = list => { const n = {not: 0, ready: 0, gone: 0}; list.forEach(c => { n[c.st.s] = (n[c.st.s] || 0) + 1; }); return n; };
const units = n => n + (n === 1 ? ' asset' : ' assets');
/* "on site" counts only what is still there; what has left is said beside it */
const onSite = list => { const g = list.filter(c => c.st.s === 'gone').length; return units(list.length - g) + ' on site' + (g ? ' · ' + g + ' picked up' : ''); };
function groupsHtml(list) {
 const sink = c => c.st.s === 'gone' ? 1 : 0;
 return ORDER.map(k => { const cs = list.filter(c => (CAT[c.cat] ? c.cat : 'other') === k); if (!cs.length) return '';
  cs.sort((a, b) => sink(a) - sink(b) || nat(a.vms ? a.vms.label : a.key, b.vms ? b.vms.label : b.key) || a.idx - b.idx);
  const n = cnt(cs), C = CAT[k];
  return '<div class="gp1238" data-cat1238="' + k + '" style="--cc:' + C.c + '"><div class="gh1238"><i>' + SVG(ICONS[C.icon]) + '</i><b>' + e(C.label) + '</b><span>' + units(cs.length) + '</span><em>' + (n.not ? '<b class="no">' + n.not + ' not ready</b>' : '') + (n.ready ? '<b class="ok">' + n.ready + ' ready</b>' : '') + (n.gone ? '<b class="gn">' + n.gone + ' picked up</b>' : '') + '</em></div><div class="gg1238">' + cs.map(cardHtml).join('') + '</div></div>'; }).join('');
}
function headHtml(kind, title, sub, list) {
 const n = cnt(list), all = list.length || 1, w = k => (Math.round(n[k] / all * 1000) / 10) + '%';
 return '<div class="sh1238"><span class="mn1238">' + (kind === 'coates' ? 'C' : 'S') + '</span><h3>' + e(title) + '<small>' + e(sub) + '</small></h3><div class="ct1238"><span class="no">' + n.not + ' not ready</span><span class="ok">' + n.ready + ' ready</span><span class="gn">' + n.gone + ' picked up</span></div>'
  + '<div class="bar1238" role="img" aria-label="' + e(n.gone + ' picked up, ' + n.ready + ' ready, ' + n.not + ' not ready, of ' + list.length) + '"><i class="g" style="width:' + w('gone') + '"></i><i class="r" style="width:' + w('ready') + '"></i><i class="n" style="width:' + w('not') + '"></i></div></div>';
}
const initials = c => String(c).split(/[\s/&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function sectionsHtml(list, day) {
 const word = l => day ? units(l.length) : onSite(l), ours = list.filter(c => c.owner === 'coates' || c.owner === 'unknown'), subs = list.filter(c => ours.indexOf(c) < 0), sup = new Map();
 subs.forEach(c => { const k = coName(c.owner); if (!sup.has(k)) sup.set(k, []); sup.get(k).push(c); });
 let h = '';
 if (ours.length) h += '<section class="sx1238 coates" data-sx1238="coates">' + headHtml('coates', 'Coates · our list', 'Our fleet · ' + word(ours), ours) + groupsHtml(ours) + '</section>';
 if (sup.size) h += '<section class="sx1238 sub" data-sx1238="sub">' + headHtml('sub', 'Sub-hired', 'From our suppliers · ' + word(subs) + ' · ' + sup.size + (sup.size === 1 ? ' supplier' : ' suppliers'), subs)
  + [...sup.keys()].sort().map(k => '<div class="sp1238" data-sup1238="' + e(k) + '"><h4><span class="mn1238">' + e(initials(k)) + '</span>' + e(k) + ' <small>' + units(sup.get(k).length) + '</small></h4>' + groupsHtml(sup.get(k)) + '</div>').join('') + '</section>';
 return h;
}
function barHtml(list, day) {
 const n = cnt(list), booked = list.filter(c => c.book && c.st.s !== 'gone' && (!day || qDay(c.book.at) === day)).length, cats = new Map();
 if (!day && !booked && FILTER === 'booked') FILTER = 'all'; /* the booked filter has no chip once nothing is booked, so it goes off */
 list.forEach(c => { const k = CAT[c.cat] ? c.cat : 'other'; cats.set(k, (cats.get(k) || 0) + 1); });
 const f = (k, word, v) => '<button type="button" class="f1238 ' + k + '" data-f1238="' + k + '" aria-pressed="' + (FILTER === k) + '"><i></i><b>' + v + '</b> ' + word + '</button>';
 return '<div class="tb1238"><div class="th1238"><b>' + (day ? e(dayW(day)) + ' · picked up' + (booked ? ' and booked' : '') : 'Everything on site') + '</b><span>' + (day ? units(list.length) : onSite(list)) + ' · one card each · tap a picture for the full map</span></div>'
  + '<div class="fr1238">' + f('all', 'all', list.length) + f('not', 'not ready', n.not) + f('ready', 'ready', n.ready) + f('gone', 'picked up', n.gone) + (day || !booked ? '' : f('booked', 'booked', booked))
  + '<label class="fd1238">' + UI.find + '<input type="search" data-fd1238 data-ro placeholder="Find an asset no., GC500 ID, VMS or rego" value="' + e(FIND) + '" aria-label="Find an asset"></label></div>'
  + (day ? '' : '<nav class="cn1238" aria-label="Go to a group">' + ORDER.filter(k => cats.has(k)).map(k => '<button type="button" data-catgo1238="' + k + '" style="--cc:' + CAT[k].c + '"><i>' + SVG(ICONS[CAT[k].icon]) + '</i>' + e(CAT[k].label) + ' <b>' + cats.get(k) + '</b></button>').join('') + '</nav>') + '</div>';
}
/* ---- v12.42.2 - truck loads from what is Ready (Andrew, 26 Oct 2026: "the equipment that is ready we can work out what can go on what
   load. With event portaloos they can get 24 per truck. Or 6 pee panels and 18 toilets on a truck. Or qty 1 16 pan toilet. Buildings are
   generally 1 per truck.. accessible toilet can go on with other". His answers: the accessible toilet rides on a Coates truck with other
   Coates gear; other gear one a truck for now; a truck starts from the biggest Ready group and fills from the nearest Ready units. Then:
   "Vms most trucks could tow one or a truck can load 2 and tow 1": VMS boards 3 a truck, 2 on it and 1 towed.)
   Units booked together for the same moment stay on their own trucks, whatever they are. Only what is ticked Ready is planned. ---- */
const LOADCAP = {ep: 24, panels: 6, vms: 3}, EPO = 'event-portables';
/* what a unit is comes from the unit's own item and label, never the reference's description: that names every kind the reference
   holds (WC09 "FWF, Pee Panel, Toilet Block 6m", WC01 "Accessible Toilet, FWF"), so it would make every FWF there a pee panel or an
   accessible toilet */
const ownText = c => c.u ? String(c.u.item || '') + ' ' + String(c.u.label || '') : String(c.item || '') + ' ' + String(c.label || '');
function loadKind(c) {
 const t = ownText(c);
 if (c.owner === EPO) { if (/16\s*-?\s*pan/i.test(t)) return 'pan16'; if (/pee|urinal/i.test(t)) return 'panel'; if (!c.group && /fwf|toilet|portaloo|\bloo\b|flush/i.test(t)) return 'toilet'; return 'other'; }
 if (c.cat === 'bld') return 'building';
 if (c.cat === 'vms' || c.vms) return 'vms';
 if (!c.group && /accessib|disab|ambulant|\bdda\b|\bpwd\b|wheelchair/i.test(t)) return 'access';
 return 'other';
}
const KIND = new WeakMap(), kindOf = c => { let k = KIND.get(c); if (!k) { k = loadKind(c); KIND.set(c, k); } return k; }; /* worked out once per card */
const epLoad = c => { const k = kindOf(c); return k === 'toilet' || k === 'panel'; };
function ptOf(c) { const L = locOf(c); return L ? {lat: L.lat, lon: L.lon} : null; }
const metres = (a, b) => { if (!a || !b) return 1e9; const k = Math.cos((a.lat + b.lat) / 2 * Math.PI / 180); return Math.hypot((b.lat - a.lat) * 110540, (b.lon - a.lon) * 111320 * k); };
const unitCmp = (a, b) => nat(a.key, b.key) || nat(a.vms ? a.vms.label : '', b.vms ? b.vms.label : '') || nat(a.no || '', b.no || '') || nat(a.uid || '', b.uid || '');
/* the biggest Ready group first, then the nearest Ready units until the truck is full (Event Portables: 24, of them 6 pee panels at most;
   VMS boards: 3, 2 on the truck and 1 towed). A VMS board carries its own position, so each board is measured from its own pin; every
   other unit goes by its reference's */
function fillNear(pool, out, at, o) {
 pool = pool.slice();
 while (pool.length) {
  const by = new Map(); pool.forEach(c => by.set(c.key, (by.get(c.key) || 0) + 1));
  const seedKey = [...by].sort((x, y) => y[1] - x[1] || nat(x[0], y[0]))[0][0], seedC = pool.filter(c => c.key === seedKey).sort(unitCmp)[0], seed = ptOf(seedC);
  const ref = new Map(), dist = new Map();
  pool.forEach(c => { if (c === seedC) dist.set(c, -1); else if (c.vms) dist.set(c, metres(seed, ptOf(c)));
   else { if (!ref.has(c.key)) ref.set(c.key, c.key === seedKey ? -1 : metres(seed, ptOf(c))); dist.set(c, ref.get(c.key)); } });
  const order = pool.slice().sort((a, b) => dist.get(a) - dist.get(b) || unitCmp(a, b));
  const items = []; let subs = 0;
  for (const c of order) { if (items.length >= o.cap) break; const s = !!(o.sub && o.sub(c)); if (s && subs >= o.subMax) continue; items.push(c); if (s) subs++; }
  if (!items.length) break;
  pool = pool.filter(c => items.indexOf(c) < 0);
  out.push({owner: o.owner, kind: o.kind, items, at: at || null});
 }
}
/* one pool of Ready units (all booked for one moment by one owner, or all unbooked) cut into trucks by Andrew's rules */
function cutLoads(pool, at, co) {
 const out = [], own = (a, b) => (a === 'coates' ? 0 : 1) - (b === 'coates' ? 0 : 1) || nat(co(a), co(b));
 const ep = pool.filter(c => c.owner === EPO), rest = pool.filter(c => c.owner !== EPO);
 fillNear(ep.filter(epLoad), out, at, {owner: EPO, kind: 'ep', cap: LOADCAP.ep, sub: c => kindOf(c) === 'panel', subMax: LOADCAP.panels});
 ep.filter(c => !epLoad(c)).sort(unitCmp).forEach(c => out.push({owner: EPO, kind: kindOf(c), items: [c], at: at || null}));
 [...new Set(rest.filter(c => kindOf(c) === 'vms').map(c => c.owner))].sort(own).forEach(ow => fillNear(rest.filter(c => c.owner === ow && kindOf(c) === 'vms'), out, at, {owner: ow, kind: 'vms', cap: LOADCAP.vms}));
 rest.filter(c => kindOf(c) !== 'access' && kindOf(c) !== 'vms').sort((a, b) => own(a.owner, b.owner) || (kindOf(a) === 'building' ? 0 : 1) - (kindOf(b) === 'building' ? 0 : 1) || unitCmp(a, b))
  .forEach(c => out.push({owner: c.owner, kind: kindOf(c), items: [c], at: at || null}));
 /* the accessible toilet rides on the nearest truck of its owner carrying one piece of other gear (never a building, a run, a board or
    another accessible toilet); trucks are cut per booking, so it only ever rides with gear booked for the same moment, or unbooked with unbooked */
 rest.filter(c => kindOf(c) === 'access').sort(unitCmp).forEach(c => { const p = ptOf(c), d = new Map(), far = t => { if (!d.has(t)) d.set(t, metres(p, ptOf(t.items[0]))); return d.get(t); };
  const host = out.filter(t => t.owner === c.owner && t.kind === 'other' && t.items.length === 1 && !t.items[0].group).sort((x, y) => far(x) - far(y) || unitCmp(x.items[0], y.items[0]))[0];
  if (host) host.items.push(c); else out.push({owner: c.owner, kind: 'access', items: [c], at: at || null}); });
 return out;
}
/* units booked for the same moment (one owner) are cut into their own trucks and never mixed with other units; booked trucks come first,
   by their time and first unit, so a booked truck keeps its place when the others change */
function planLoads(list) {
 const ready = (list || []).filter(c => c.st && c.st.s === 'ready' && !c.board), CO = new Map(), co = o => { if (!CO.has(o)) CO.set(o, coName(o)); return CO.get(o); };
 const sets = new Map(), free = [];
 ready.forEach(c => { const at = c.book && ok(c.book.at) ? String(c.book.at) : ''; if (!at) { free.push(c); return; } const k = at + '|' + c.owner; if (!sets.has(k)) sets.set(k, {at, cs: []}); sets.get(k).cs.push(c); });
 const booked = [].concat(...[...sets.values()].map(x => cutLoads(x.cs, x.at, co))).sort((x, y) => Date.parse(x.at) - Date.parse(y.at) || unitCmp(x.items[0], y.items[0]));
 const out = booked.concat(cutLoads(free, null, co));
 out.forEach((t, i) => { const f = t.items[0]; t.n = i + 1; t.id = (t.at || '') + '|' + f.key + '#' + f.uid; });
 return out;
}
const loadUnits = t => t.items.reduce((n, c) => n + readyUnits(c), 0);
/* a truck is named by its number and its first stop, so a name in a flash or a text still finds it after the numbers move */
const truckName = t => { const f = t.items[0]; return 'Truck ' + t.n + ' (from ' + (f ? (f.vms ? f.vms.label : f.key) : '') + ')'; };
function loadWordOf(c) { const k = kindOf(c); return k === 'panel' ? 'pee panel' : k === 'vms' ? 'VMS board' : String(c.item || (k === 'toilet' ? 'toilet' : titleOf(c))); }
/* a toilet block with its waste tank is "Toilet Block 6m + waste tank" with both numbers; once one of them has left, only the part still there */
function pieceOf(c) {
 const it = String(c.item || 'toilet block');
 if (c.tank) return c.half === 'block' ? {w: 'waste tank', n: 1, nos: [c.tankNo]} : c.half === 'tank' ? {w: it, n: 1, nos: [c.no]} : {w: it + ' + waste tank', n: 1, nos: [c.no, c.tankNo]};
 return {w: loadWordOf(c), n: readyUnits(c), nos: [c.no]};
}
function mixWords(cs) { const m = new Map(); cs.forEach(c => { const p = pieceOf(c); m.set(p.w, (m.get(p.w) || 0) + p.n); });
 return [...m].map(([w, n]) => n + ' ' + w + (n > 1 && (w === 'pee panel' || w === 'VMS board' || w === 'waste tank') ? 's' : '')).join(' · '); }
const rideOf = t => { if (t.kind !== 'vms') return ''; const n = t.items.length; return n >= 3 ? 'load 2, tow 1' : n === 2 ? 'load 1, tow 1' : 'tow 1'; };
/* a stop is a reference; a VMS board is a stop of its own (its own label, place and directions) */
function stopsOf(t) {
 const st = []; t.items.forEach(c => { const id = c.vms ? 'v|' + c.vms.label : 'a|' + c.key; let s = st.find(x => x.id === id); if (!s) st.push(s = {id, key: c.key, label: c.vms ? String(c.vms.label) : c.key, cards: []}); s.cards.push(c); });
 st.forEach(s => { const c = s.cards[0]; s.words = mixWords(s.cards); s.nos = [].concat(...s.cards.map(x => pieceOf(x).nos)).filter(Boolean);
  if (c.vms) s.where = String(c.vms.where || '');
  else { let w = null; try { w = DemobMap1236.words(c.key, DemobMap1236.spot(c.key), c.r.zone); } catch (x) { w = null; } s.where = w ? String(w.filter(Boolean)[0] || '') : ''; }
  s.L = locOf(c); });
 return st;
}
function sameAt(t) { const a = t.items.map(c => c.book && c.book.at ? c.book.at : ''); return a.length && a[0] && a.every(x => x === a[0]) ? a[0] : ''; }
/* what is already booked on a truck: one time for all of it, or (should a truck ever hold units booked apart) each time with its units,
   which booking the load moves to the one new time */
function loadNote(t) {
 const at = sameAt(t); if (at) return {at};
 const m = new Map(); t.items.forEach(c => { if (c.book && c.book.at) m.set(c.book.at, (m.get(c.book.at) || 0) + readyUnits(c)); }); if (!m.size) return null;
 const bt = [...m].sort((x, y) => Date.parse(x[0]) - Date.parse(y[0])), moves = bt.reduce((s, x) => s + x[1], 0);
 return {at: '', moves, times: bt.map(([a, n]) => when(a) + ' (' + n + ' unit' + (n === 1 ? '' : 's') + ')').join(', ')};
}
const loadOf = b => { const a = b && b.closest ? b.closest('[data-lid1238]') : null, id = a ? a.dataset.lid1238 : ''; return id ? LOADS.find(t => t.id === id) || null : null; };
let LOADS = [];
function loadsHtml(list) {
 const P = planLoads(list); LOADS = P; if (!P.length) return '';
 const total = P.reduce((n, t) => n + loadUnits(t), 0), ed = canEd();
 const card = t => { const st = stopsOf(t), u = loadUnits(t), bn = loadNote(t), i = t.n - 1;
  return '<article class="lt1238' + (bn && bn.at ? ' bk' : '') + '" data-lt1238="' + i + '" data-lid1238="' + e(t.id) + '"><h4><b>Truck ' + t.n + '</b>' + e(coName(t.owner)) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + '<small>' + e(mixWords(t.items) + (rideOf(t) ? ' · ' + rideOf(t) : '')) + '</small></h4>'
   + (bn ? (bn.at ? '<p class="lb1238">Pick-up booked ' + e(when(bn.at)) + '</p>' : '<p class="lb1238 mx">Booked now: ' + e(bn.times) + '. Booking this load moves ' + (bn.moves === 1 ? 'it' : 'them') + ' to the new time.</p>') : '')
   + '<ol>' + st.map(s => '<li><button type="button" data-go1238="' + e(s.key) + '" data-u1238="' + e(s.cards[0].uid) + '"><b>' + e(s.label) + '</b><span>' + e(s.words + (s.label !== s.key ? ' · ' + s.key : '')) + '</span>' + (s.nos.length ? '<s>' + e(s.nos.join(' ')) + '</s>' : '') + (s.where ? '<em>' + e(s.where) + '</em>' : '') + '</button></li>').join('') + '</ol>'
   + '<footer>' + (ed ? '<button type="button" class="pri" data-ldbook1238="' + i + '">' + (bn && bn.at ? 'Change booking' : bn ? 'Book this load and move ' + bn.moves + ' booked unit' + (bn.moves === 1 ? '' : 's') : 'Book this load') + '</button>' : '') + '<button type="button" data-ldsm1238="' + i + '">Text</button><button type="button" data-ldsd1238="' + i + '">Send</button></footer></article>'; };
 return '<section class="ld1238" aria-label="Truck loads"><header><i>' + UI.truck + '</i><b>Truck loads from what is Ready</b><span>' + P.length + ' truck' + (P.length === 1 ? '' : 's') + ' · ' + total + ' unit' + (total === 1 ? '' : 's') + ' ready · nearest first</span></header>'
  + '<p class="lr1238">Event Portables: 24 a truck, 6 pee panels at most; a 16 Pan block on its own. VMS boards 3 a truck: load 2, tow 1 (most trucks tow one). Buildings one a truck. The Coates accessible toilet rides with one other piece of Coates gear. Other gear one a truck for now. Units booked for the same time stay together on their own trucks, listed first.</p>'
  + '<div class="lg1238">' + P.map(card).join('') + '</div></section>';
}
/* the list for the driver: each stop with what is there, its numbers and its place, and directions to that stop */
function loadWords(t) {
 const st = stopsOf(t), u = loadUnits(t), bn = loadNote(t);
 const lines = ['Coates GC500 demob · ' + truckName(t) + ' · ' + coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' (' + mixWords(t.items) + (rideOf(t) ? ', ' + rideOf(t) : '') + ')'];
 if (bn) lines.push(bn.at ? 'Pick-up booked: ' + when(bn.at) : 'Booked now: ' + bn.times);
 st.forEach((s, i) => { lines.push((i + 1) + '. ' + s.label + (s.label !== s.key ? ' (' + s.key + ')' : '') + ' · ' + s.words + (s.nos.length ? ': ' + s.nos.join(' ') : '') + (s.where ? ' · ' + s.where : ''));
  if (s.L) lines.push('   Navigate: ' + navOf(s.L)); });
 return {subject: 'GC500 demob · ' + truckName(t) + ' · ' + coName(t.owner), lines};
}
async function sendLoad(t) {
 const w = loadWords(t), txt = w.lines.join('\n');
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { await navigator.clipboard.writeText(txt); try { flash(truckName(t) + ': the list is copied, paste it into a text or email.'); } catch (y) {} return 'copied'; } catch (x) {}
 openUrl('sms:?&body=' + encodeURIComponent(txt)); return 'sms';
}
/* the cards the Everything view shows (the branch chosen on the Demob tab), for the view and for finding a truck again after a booking */
function allCards(m) { m = m || model(); const br = (typeof DM816 === 'object' && DM816 && DM816.branch) || 'all'; return br === 'all' ? m.cards : m.cards.filter(c => c.r.branch === br); }
function openLoad(i) {
 if (!canEd()) { try { flash('Booking a pick-up needs the edit link.'); } catch (x) {} return false; }
 const t = i && typeof i === 'object' ? i : LOADS[Number(i)]; if (!t || !t.items.length) return false;
 const dlg = sheet(), td = todayQ(), bn = loadNote(t), at = bn && bn.at ? bn.at : '', first = t.items[0], groups = [], u = loadUnits(t);
 t.items.forEach(c => { let g = groups.find(x => x.key === c.key); if (!g) groups.push(g = {key: c.key, uids: []}); g.uids.push(c.uid); });
 SEL = {key: first.key, uid: first.uid, day: at ? qDay(at) : '', time: at ? hhmm(at) : '', month: null, mode: 'h', h: at ? Number(hhmm(at).slice(0, 2)) : null, load: groups, units: u, first: {key: first.key, uid: first.uid}};
 const base = SEL.day || td; SEL.month = new Date(Date.UTC(Number(base.slice(0, 4)), Number(base.slice(5, 7)) - 1, 1));
 dlg.querySelector('#bkh1238').textContent = 'Book ' + truckName(t).replace(/^Truck/, 'truck');
 dlg.querySelector('.bi1238').innerHTML = UI.truck;
 dlg.querySelector('.bs1238').textContent = coName(t.owner) + ' · ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + groups.length + ' reference' + (groups.length === 1 ? '' : 's') + ' · ' + mixWords(t.items);
 dlg.querySelector('input[name="n1238"]').value = at && first.book ? (first.book.note || '') : '';
 dlg.querySelector('label.al1238').hidden = true; dlg.querySelector('[data-bk1238="clear"]').hidden = true;
 let who = ''; try { who = whoAmI() || ''; } catch (x) { who = ''; }
 dlg.querySelector('.fy1238').textContent = 'Every unit on the truck is booked for the same day and time, on the shared record' + (who ? ' as ' + who : '') + '. Each card, its day card and the booked pick-ups show it.'
  + (bn && !bn.at ? ' Booked now: ' + bn.times + '; saving moves ' + (bn.moves === 1 ? 'it' : 'them') + ' to this time.' : '');
 calendar(); clock(); summary();
 try { dlg.showModal(); } catch (x) { dlg.setAttribute('open', ''); }
 return true;
}

function bookedHtml(list) {
 const bs = list.filter(c => c.book && c.st.s !== 'gone').sort((a, b) => String(a.book.at).localeCompare(String(b.book.at)) || nat(a.key, b.key));
 if (!bs.length) return ''; /* v12.42.1 - shown only once something is booked */
 const days = new Map();
 bs.forEach(c => { const d = qDay(c.book.at); if (!days.has(d)) days.set(d, []); days.get(d).push(c); });
 const SW = {not: 'Not ready', ready: 'Ready', gone: 'Picked up'};
 const body = bs.length ? [...days].map(([d, cs]) => '<div class="bd1238"><b>' + e(dayW(d)) + ' · ' + cs.length + '</b>' + cs.map(c => '<button type="button" class="bl1238" data-go1238="' + e(c.key) + '" data-u1238="' + e(c.uid) + '"><time>' + e(hhmm(c.book.at)) + '</time><i>' + SVG(ICONS[c.icon] || ICONS.other) + '</i><span><b>' + e(c.vms ? c.vms.label : c.key) + '</b> · ' + e(titleOf(c)) + (c.no ? ' · ' + e(c.no) : '') + ' · ' + e(coName(c.owner)) + (c.book.note ? ' · ' + e(c.book.note) : '') + '</span><em class="' + c.st.s + '">' + SW[c.st.s] + '</em></button>').join('') + '</div>').join('')
  : '<p class="be1238">No pick-ups booked yet. Book one on any card (Book pick-up): it shows here by day and time, and on that day’s card.</p>';
 return '<section class="bp1238" aria-label="Booked pick-ups"><header><i>' + UI.truck + '</i><b>Booked pick-ups</b><span>' + bs.length + ' booked · by day and time</span></header>' + body + '</section>';
}
let FILTER = 'all', FIND = '';
const goneDay = c => c.st.at ? qDay(c.st.at) : c.st.day, evDay = ev => ev.info.at ? qDay(ev.info.at) : ev.info.day;
function selDay() { try { const M = demob816(); return demobSel816(M) || DM816.sel || todayQ(); } catch (x) { return (typeof DM816 === 'object' && DM816 && DM816.sel) || todayQ(); } }
function viewHtml(day) {
 const m = model();
 if (!day) { const all = allCards(m);
  return '<div class="sgv1238" data-sgv1238="all">' + barHtml(all, null) + loadsHtml(all) + bookedHtml(all) + '<div class="sgl1238">' + sectionsHtml(all) + '</div></div>'; }
 /* a unit that has left belongs to the day it left, whatever day it was booked for; a run part-collected that day shows too */
 if (FILTER === 'booked') FILTER = 'all';
 const list = m.cards.filter(c => (c.st.s === 'gone' ? goneDay(c) === day : !!(c.book && qDay(c.book.at) === day)) || !!(c.group && c.G && c.G.events.some(ev => evDay(ev) === day)));
 return '<div class="sgv1238" data-sgv1238="day">' + barHtml(list, day) + '<div class="sgl1238">' + (list.length ? sectionsHtml(list, day) : '<div class="em1238"><b>Nothing picked up on ' + e(dayW(day)) + (day >= todayQ() ? ' yet' : '') + '</b>A day shows what left on it, and any pick-up booked for it on a card (Book pick-up).</div>') + '</div></div>';
}
function applyFilter() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const f = FILTER, q = FIND.trim().toLowerCase().split(/\s+/).filter(Boolean);
 pane.querySelectorAll('.sgv1238 article.sg1238').forEach(a => { const s = a.dataset.s1238, okF = f === 'all' || (f === 'booked' ? !!a.dataset.b1238 && s !== 'gone' : s === f), okQ = !q.length || q.every(w => (a.dataset.q1238 || '').indexOf(w) >= 0); a.hidden = !(okF && okQ); });
 pane.querySelectorAll('.sgv1238 .gp1238').forEach(g => { g.hidden = !g.querySelector('article.sg1238:not([hidden])'); });
 pane.querySelectorAll('.sgv1238 .sp1238, .sgv1238 .sx1238').forEach(g => { g.hidden = !g.querySelector('article.sg1238:not([hidden])'); });
 pane.querySelectorAll('.sgv1238 [data-f1238]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f1238 === f)));
}

/* ---- writing a unit's Ready tick and its booking ---- */
function cardOf(key, uid) { return model().byId.get(key + '#' + uid) || null; }
function stamp(prev) { let now = new Date().toISOString(); if (prev && String(prev) >= now) now = new Date(Date.parse(prev) + 1).toISOString(); return now; }
/* the unit's own record, written beside the tick, so the tick finds its unit again if its asset number is corrected */
function docOf(key, uid) { const c = cardOf(key, uid), dk = c && c.u && c.u.docKey ? String(c.u.docKey) : ''; return dk ? {doc: dk} : {}; }
function setUnitReady(key, uids, on, why) {
 if (typeof mayWrite === 'function' && !mayWrite('the ready for collection tick')) return false;
 if (typeof isRef === 'function' && !isRef(key)) { try { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); } catch (x) {} return false; }
 const who = whoAmI(); if (!who) return false;
 const list = (Array.isArray(uids) ? uids : [uids]).map(String).filter(Boolean); if (!list.length) return false;
 S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});
 const cur = umap(key, 'ready1238_units', 'at'), latest = list.map(u => cur[u] && cur[u].at).filter(Boolean).sort().pop(), now = stamp(latest), w = on ? '' : String(why || '').trim().slice(0, 140);
 list.forEach(u => { cur[u] = Object.assign({on: !!on, at: now, by: who, why: w}, docOf(key, u)); });
 d.ready1238_units = cur;
 d.ready1238_history = (Array.isArray(d.ready1238_history) ? d.ready1238_history : []).concat(list.map(u => ({unit: u, ready: !!on, at: now, by: who, why: w}))).slice(-400);
 VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* a refusal is said out loud, as on every writer in the page */
 try { buzz(on ? 50 : 20); } catch (x) {}
 try { flash(key + (list.length > 1 ? ' · ' + list.length + ' units' : '') + (on ? ' ready for collection' : ' not ready for collection' + (w ? ' (' + w + ')' : '')) + ' - recorded by ' + who + '.'); } catch (x) {}
 return true;
}
function putBooking(key, list, v, n, who) {
 S.delivery = S.delivery || {}; const d = S.delivery[key] || (S.delivery[key] = {});
 const cur = umap(key, 'pickup1238_units', 'set'), latest = list.map(u => cur[u] && cur[u].set).filter(Boolean).sort().pop(), now = stamp(latest);
 list.forEach(u => { cur[u] = Object.assign({at: v, note: v ? n : '', by: who, set: now}, docOf(key, u)); });
 d.pickup1238_units = cur;
 d.pickup1238_history = (Array.isArray(d.pickup1238_history) ? d.pickup1238_history : []).concat(list.map(u => ({unit: u, pickup: v, note: v ? n : '', by: who, at: now}))).slice(-400);
}
/* a whole truck: every unit on it booked for the same moment, one save */
function bookLoad(groups, at, note) {
 if (typeof mayWrite === 'function' && !mayWrite('the booked pick-up')) return false;
 const gs = (groups || []).map(g => ({key: String(g.key || ''), uids: (g.uids || []).map(String).filter(Boolean)})).filter(g => g.key && g.uids.length); if (!gs.length) return false;
 if (typeof isRef === 'function') { const bad = gs.find(g => !isRef(g.key)); if (bad) { try { flash(bad.key + ' is not a reference in this file - nothing recorded.'); } catch (x) {} return false; } }
 const who = whoAmI(); if (!who) return false;
 const v = String(at || ''); if (!(ok(v) && /T\d{2}:\d{2}:00\+10:00$/.test(v))) return false;
 const n = String(note || '').trim().slice(0, 80); gs.forEach(g => putBooking(g.key, g.uids, v, n, who));
 VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; }
 try { buzz(30); } catch (x) {}
 return who;
}
function setBooking(key, uids, at, note) {
 if (typeof mayWrite === 'function' && !mayWrite('the booked pick-up')) return false;
 if (typeof isRef === 'function' && !isRef(key)) { try { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); } catch (x) {} return false; }
 const who = whoAmI(); if (!who) return false;
 const list = (Array.isArray(uids) ? uids : [uids]).map(String).filter(Boolean); if (!list.length) return false;
 const v = at ? String(at) : ''; if (v && !(ok(v) && /T\d{2}:\d{2}:00\+10:00$/.test(v))) return false;
 const n = String(note || '').trim().slice(0, 80); putBooking(key, list, v, n, who);
 VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */
 try { buzz(30); } catch (x) {}
 try { flash(v ? key + (list.length > 1 ? ' · ' + list.length + ' units' : '') + ' pick-up booked for ' + when(v) + ' - recorded by ' + who + '.' : key + ' booking cleared - recorded by ' + who + '.'); } catch (x) {}
 return true;
}
/* Picked up opens the page's own departure form with this unit (and its waste tank) ticked. A toilet is loaded only once pumped
   out; Emptied is one tick for the whole reference, and the question says so */
function pickUp(c) {
 const key = c.key;
 if (c.r.empty) { let em = null; try { em = emptiedOf816(key); } catch (x) { em = null; }
  if (!(em && em.on)) { const n = (model().byKey.get(key) || []).filter(x => x.st.s !== 'gone').reduce((s, x) => s + (x.group ? x.n || 1 : x.tank ? 2 : 1), 0);
   if (!W.confirm(key + ' has no Emptied (pumped out) tick, and no toilet or waste tank is loaded until it is pumped out.\n\nEmptied is one tick for the whole of ' + key + ' (' + n + ' unit' + (n === 1 ? '' : 's') + ' still on site).\n\nOK records ' + key + ' as pumped out, in your name, now, then opens the pick-up form.\nCancel leaves it as it is.')) return false;
   try { if (!setEmptied816(key, true)) return false; } catch (x) { return false; } } }
 const pick = u => ({type: String(u.item || u.label || ''), ids: [String(u.id)]});
 const preset = c.group || !c.u || c.ph ? null : {items: [pick(c.u)].concat(c.tank ? [pick(c.tank)] : [])};
 try { if (W.DemobCollection996 && typeof DemobCollection996.open === 'function') return DemobCollection996.open(key, preset); } catch (x) {}
 try { return collect816(key); } catch (x) { try { flash(key + ': the pick-up form did not open.'); } catch (y) {} return false; }
}
function lamp(key, uid, s) {
 const c = cardOf(key, uid); if (!c) return false;
 if (c.board) { try { flash(c.vms.label + ' is on the VMS plan but on no delivery reference yet, so its Ready tick waits until it is.'); } catch (x) {} return false; }
 if (s === 'gone') return pickUp(c);
 if (c.group && !c.r.noPlan1236) { try { return s === 'ready' ? Ready1231.ready(key) : Ready1231.notReady(key); } catch (x) { return false; } }
 if (s === 'ready') {
  if (c.st.s === 'ready') { try { flash(key + ' ' + (c.no || '') + ' is already ready for collection.'); } catch (x) {} return false; }
  if (c.r.empty) { let em = null; try { em = emptiedOf816(key); } catch (x) { em = null; } if (!(em && em.on) && !W.confirm(key + ' ' + (c.no || '') + ' has no Emptied (pumped out) tick.\n\nOK records it as ready for collection in your name, now: only when it has been pumped out.\nCancel leaves it as it is.')) return false; }
  return setUnitReady(key, [uid], true);
 }
 const why = W.prompt(key + ' ' + (c.no || '') + ' - not ready for collection. Why? (optional, e.g. still in use, contents inside, power on)', ''); if (why === null) return false;
 return setUnitReady(key, [uid], false, why);
}

/* ---- the sheet: a calendar for the day and a clock for the time ---- */
let SHEET = null, SEL = {key: '', uid: '', day: '', time: '', month: null, mode: 'h', h: null};
function sheet() {
 if (SHEET && SHEET.isConnected) return SHEET;
 const dlg = D.createElement('dialog'); dlg.className = 'bkd1238'; dlg.setAttribute('aria-labelledby', 'bkh1238');
 dlg.innerHTML = '<form method="dialog"><header><i class="bi1238"></i><div><h3 id="bkh1238">Book the pick-up</h3><p class="bs1238"></p></div></header>'
  + '<div class="bg1238"><section class="cal1238"><p>Pick-up day</p><div class="ch1238"><button type="button" data-cm1238="-1" aria-label="Last month">‹</button><b class="cmh1238"></b><button type="button" data-cm1238="1" aria-label="Next month">›</button></div><div class="cg1238" role="grid"></div></section>'
  + '<section class="clk1238"><p>Pick-up time</p><div class="tv1238"><input name="t1238" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="HH:MM" aria-label="Pick-up time, 24-hour"></div><div class="ck1238" role="group" aria-label="Clock"></div><div class="cm1238"><button type="button" data-mode1238="h">Hour</button><button type="button" data-mode1238="m">Minutes</button></div></section></div>'
  + '<p class="sm1238 no" aria-live="polite"></p>'
  + '<label class="nt1238">Who is collecting, or a note (optional)<input name="n1238" maxlength="80" placeholder="e.g. Coates truck, Event Portables, the yard"></label>'
  + '<label class="al1238" hidden><input type="checkbox" name="a1238"><span></span></label>'
  + '<p class="fy1238"></p>'
  + '<footer><button type="button" class="cl1238" data-bk1238="clear">Clear booking</button><button type="button" data-bk1238="cancel">Cancel</button><button type="button" class="sv1238" data-bk1238="save" disabled>Save booking</button></footer></form>';
 D.body.appendChild(dlg); SHEET = dlg;
 let downOn = null; dlg.addEventListener('pointerdown', ev => { downOn = ev.target; }, true);
 dlg.addEventListener('click', ev => {
  const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
  if (t === dlg) { if (downOn === dlg) close(); return; } /* only a tap that starts and ends on the backdrop closes it, never a drag out of a field */
  const cm = t.closest('[data-cm1238]'); if (cm) { const m = SEL.month; SEL.month = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + Number(cm.dataset.cm1238), 1)); calendar(); return; }
  const dd = t.closest('[data-day1238]'); if (dd && !dd.disabled) { SEL.day = dd.dataset.day1238; calendar(); summary(); return; }
  const hb = t.closest('[data-h1238]'); if (hb) { SEL.h = Number(hb.dataset.h1238); const mm = SEL.time ? SEL.time.slice(3) : '00'; SEL.time = pad(SEL.h) + ':' + mm; SEL.mode = 'm'; clock(); summary(); return; }
  const mb = t.closest('[data-m1238]'); if (mb) { const h = SEL.h != null ? SEL.h : SEL.time ? Number(SEL.time.slice(0, 2)) : 7; SEL.h = h; SEL.time = pad(h) + ':' + pad(Number(mb.dataset.m1238)); clock(); summary(); return; }
  const md = t.closest('[data-mode1238]'); if (md) { SEL.mode = md.dataset.mode1238; clock(); return; }
  const b = t.closest('[data-bk1238]'); if (!b) return;
  const act = b.dataset.bk1238;
  if (act === 'cancel') { close(); return; }
  if (act === 'clear') { const c = cardOf(SEL.key, SEL.uid); if (!W.confirm('Clear the booked pick-up for ' + SEL.key + (c && c.no ? ' ' + c.no : '') + ' (this unit only)?')) return; if (setBooking(SEL.key, [SEL.uid], '', '')) close(); return; } /* Clear is for this unit alone, whatever the "Book all" box says */
  if (act === 'save') save();
 });
 dlg.querySelector('input[name="t1238"]').addEventListener('input', ev => { const v = parseTime(ev.target.value); SEL.time = v || ''; if (v) SEL.h = Number(v.slice(0, 2)); clock(true); summary(); });
 dlg.addEventListener('close', () => { SEL.key = ''; });
 return dlg;
}
function parseTime(s) {
 const t = String(s || '').trim().replace(/[.\s]/g, ':'); let m = t.match(/^(\d{1,2}):(\d{2})$/) || t.match(/^(\d{2})(\d{2})$/) || t.match(/^(\d)(\d{2})$/); /* 07:30, 0730, 730, 7 */
 if (!m && /^\d{1,2}$/.test(t)) m = [t, t, '00'];
 if (!m) return null; const h = Number(m[1]), mi = Number(m[2]); if (!(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) return null;
 return pad(h) + ':' + pad(mi);
}
function demobDays() { try { return new Set(demob816().days || []); } catch (x) { return new Set(); } }
function calendar() {
 const dlg = sheet(), m = SEL.month, y = m.getUTCFullYear(), mo = m.getUTCMonth(), first = new Date(Date.UTC(y, mo, 1)), lead = (first.getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(), td = todayQ(), dm = demobDays();
 dlg.querySelector('.cmh1238').textContent = MONTH[mo] + ' ' + y;
 let h = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => '<span>' + x.slice(0, 2) + '</span>').join('') + '<span></span>'.repeat(lead);
 for (let d = 1; d <= days; d++) { const iso = y + '-' + pad(mo + 1) + '-' + pad(d), past = iso < td;
  h += '<button type="button" data-day1238="' + iso + '" class="' + (dm.has(iso) ? 'dm' : '') + (iso === td ? ' td' : '') + '"' + (past ? ' disabled' : '') + ' aria-pressed="' + (SEL.day === iso) + '" aria-label="' + e(dayW(iso)) + (dm.has(iso) ? ', a demob day' : '') + '">' + d + '</button>'; }
 dlg.querySelector('.cg1238').innerHTML = h;
}
function clock(fromInput) {
 const dlg = sheet(), box = dlg.querySelector('.ck1238'), mode = SEL.mode, cur = SEL.time;
 const pos = (i, n, r) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return 'left:' + (50 + r * Math.cos(a)).toFixed(2) + '%;top:' + (50 + r * Math.sin(a)).toFixed(2) + '%'; };
 let h = '<i class="cc1238"></i>', ang = null;
 if (mode === 'h') {
  const hh = cur ? Number(cur.slice(0, 2)) : null;
  for (let i = 1; i <= 12; i++) h += '<button type="button" data-h1238="' + i + '" style="' + pos(i % 12, 12, 40) + '" aria-pressed="' + (hh === i) + '">' + i + '</button>';
  for (let i = 13; i <= 24; i++) { const v = i % 24; h += '<button type="button" class="in" data-h1238="' + v + '" style="' + pos(i % 12, 12, 26) + '" aria-pressed="' + (hh === v) + '">' + pad(v) + '</button>'; }
  if (hh != null) ang = (hh % 12) / 12 * 360;
 } else {
  const mm = cur ? Number(cur.slice(3)) : null;
  for (let i = 0; i < 12; i++) h += '<button type="button" data-m1238="' + (i * 5) + '" style="' + pos(i, 12, 40) + '" aria-pressed="' + (mm === i * 5) + '">' + pad(i * 5) + '</button>';
  if (mm != null) ang = mm / 60 * 360;
 }
 if (ang != null) h += '<i class="hn1238" style="transform:translateX(-50%) rotate(' + (ang + 180) + 'deg)"></i>';
 box.innerHTML = h;
 dlg.querySelectorAll('[data-mode1238]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode1238 === mode)));
 if (!fromInput) { const inp = dlg.querySelector('input[name="t1238"]'); if (inp.value !== (cur || '')) inp.value = cur || ''; }
}
function uidsNow() {
 const dlg = sheet(), all = dlg.querySelector('input[name="a1238"]'), c = cardOf(SEL.key, SEL.uid); if (!c) return [SEL.uid];
 if (all && all.checked && !all.closest('label').hidden) return (model().byKey.get(SEL.key) || []).filter(x => x.owner === c.owner && x.st.s !== 'gone' && !x.group).map(x => x.uid);
 return [SEL.uid];
}
function summary() {
 const dlg = sheet(), ok2 = !!(SEL.day && SEL.time), p = dlg.querySelector('.sm1238');
 p.textContent = ok2 ? 'Pick-up ' + dayW(SEL.day) + ' at ' + SEL.time : SEL.day ? dayW(SEL.day) + ' · now pick a time' : SEL.time ? SEL.time + ' · now pick a day' : 'Pick a day on the calendar and a time on the clock (or type it)';
 p.classList.toggle('no', !ok2);
 dlg.querySelector('[data-bk1238="save"]').disabled = !ok2;
}
function open(key, uid) {
 if (!canEd()) { try { flash('Booking a pick-up needs the edit link.'); } catch (x) {} return false; }
 const c = cardOf(key, uid); if (!c || c.board) return false;
 const dlg = sheet(), b = c.book, td = todayQ(); dlg.querySelector('#bkh1238').textContent = 'Book the pick-up';
 SEL = {key, uid, day: b ? qDay(b.at) : '', time: b ? hhmm(b.at) : '', month: null, mode: 'h', h: b ? Number(hhmm(b.at).slice(0, 2)) : null};
 const base = SEL.day || td; SEL.month = new Date(Date.UTC(Number(base.slice(0, 4)), Number(base.slice(5, 7)) - 1, 1));
 dlg.querySelector('.bi1238').innerHTML = SVG(ICONS[c.icon] || ICONS.other);
 dlg.querySelector('.bs1238').textContent = [c.vms ? c.vms.label : '', c.key, titleOf(c), c.no ? 'Asset no. ' + c.no : '', coName(c.owner)].filter(Boolean).join(' · ');
 dlg.querySelector('input[name="n1238"]').value = b ? (b.note || '') : '';
 const same = (model().byKey.get(key) || []).filter(x => x.owner === c.owner && x.st.s !== 'gone' && !x.group), al = dlg.querySelector('label.al1238');
 al.hidden = same.length < 2; al.querySelector('input').checked = false; al.querySelector('span').textContent = 'Book all ' + same.length + ' ' + coName(c.owner) + ' units at ' + key + ' still on site, for the same day and time';
 let who = ''; try { who = whoAmI() || ''; } catch (x) { who = ''; }
 dlg.querySelector('.fy1238').textContent = 'Saved on the shared record' + (who ? ' as ' + who : '') + ', with the time it was booked. The view link shows it and cannot change it.';
 dlg.querySelector('[data-bk1238="clear"]').hidden = !b;
 calendar(); clock(); summary();
 try { dlg.showModal(); } catch (x) { dlg.setAttribute('open', ''); }
 return true;
}
function close() { const dlg = SHEET; if (!dlg) return; try { dlg.close(); } catch (x) { dlg.removeAttribute('open'); } }
function save() {
 if (!SEL.day || !SEL.time) return false;
 const at = SEL.day + 'T' + SEL.time + ':00+10:00', note = sheet().querySelector('input[name="n1238"]').value;
 if (SEL.load) { const gs = SEL.load, u = SEL.units, f = SEL.first, who = bookLoad(gs, at, note); if (!who) return false;
  let t = null; try { t = planLoads(allCards()).find(x => x.at === at && x.items.some(c => c.key === f.key && c.uid === f.uid)) || null; } catch (x) { t = null; }
  try { flash((t ? truckName(t) : 'The truck') + ' booked for ' + when(at) + ': ' + u + ' unit' + (u === 1 ? '' : 's') + ' at ' + gs.length + ' reference' + (gs.length === 1 ? '' : 's') + ' - recorded by ' + who + '.'); } catch (x) {} close(); return true; }
 if (setBooking(SEL.key, uidsNow(), at, note)) { close(); return true; }
 return false;
}

/* ---- the words to send ---- */
function wordsOf(c) {
 const L = locOf(c), st = statusWords(c), lines = ['Coates GC500 demob · ' + (c.vms ? c.vms.label + ' · ' : '') + c.key + ' · ' + titleOf(c),
  (c.no ? 'Asset no. ' + c.no : c.group ? c.n + ' × ' + c.item : 'Asset no. to confirm') + (c.tankNo ? ' · waste tank ' + c.tankNo : '') + (c.rego ? ' · Rego ' + c.rego : '') + ' · ' + coName(c.owner)];
 if (c.vms) lines.push('Where: ' + (c.vms.stored ? 'in storage · ' + c.vms.where + (c.vms.stored.pinned ? '' : ' (its store is not pinned yet; Navigate goes to its last pin on the track, ' + c.vms.stored.track + ')') : (c.vms.moved ? c.vms.at + ' · ' : '') + c.vms.where));
 else { let w = null; try { w = DemobMap1236.words(c.key, DemobMap1236.spot(c.key), c.r.zone); } catch (x) { w = null; } if (w) lines.push('Where: ' + w.filter(Boolean).join(' · ')); }
 if (c.arr) lines.push('Arrived ' + dayW(c.arr.day));
 lines.push('Now: ' + st[0] + (st[1] ? ' · ' + st[1] : ''));
 if (c.book) lines.push('Pick-up booked: ' + when(c.book.at) + (c.book.note ? ' · ' + c.book.note : ''));
 if (L) lines.push('Navigate: ' + navOf(L));
 return {subject: 'GC500 demob · ' + (c.vms ? c.vms.label : c.key) + (c.no ? ' · ' + c.no : ''), lines};
}
function openUrl(u) { try { const a = D.createElement('a'); a.href = u; a.rel = 'noopener'; if (/^https?:/.test(u)) a.target = '_blank'; D.body.appendChild(a); a.click(); a.remove(); } catch (x) { W.location.href = u; } }
async function files(c) {
 const L = locOf(c), out = []; if (!L) return out;
 for (const V of (Find1176.VIEWS || [])) { try { const p = await Find1176.picture(L, V); if (!p || !p.dataUrl) continue; const b = await (await fetch(p.dataUrl)).blob(); out.push(new File([b], 'GC500-' + String(c.vms ? c.vms.label : c.key).replace(/[^a-z0-9]+/gi, '-') + (c.no ? '-' + c.no : '') + '-' + V.key + '.jpg', {type: 'image/jpeg'})); } catch (x) {} }
 return out;
}
async function send(c) {
 const w = wordsOf(c), fs = await files(c), txt = w.lines.join('\n');
 try { if (navigator.share && fs.length && (!navigator.canShare || navigator.canShare({files: fs}))) { await navigator.share({title: w.subject, text: txt, files: fs}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared words'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 fs.forEach(f => { const u = URL.createObjectURL(f), a = D.createElement('a'); a.href = u; a.download = f.name; D.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); });
 try { await navigator.clipboard.writeText(txt); } catch (x) {}
 try { flash(fs.length + ' picture' + (fs.length === 1 ? '' : 's') + ' saved and the words copied: attach them to a text or email.'); } catch (x) {}
 return 'saved';
}
function openMap(c) {
 const L = locOf(c);
 try { if (L && W.Find1176) { Find1176.open(L); return true; } } catch (x) {}
 try { openAsset(c.key); return true; } catch (x) { return false; }
}
function goCard(key, uid) {
 const pane = D.getElementById('pane-demob'); if (!pane) return false;
 const a = pane.querySelector('article.sg1238[data-sg1238="' + cssq(key) + '"]' + (uid ? '[data-u1238="' + cssq(uid) + '"]' : '')); if (!a) return false;
 if (a.hidden) { FILTER = 'all'; FIND = ''; const inp = pane.querySelector('[data-fd1238]'); if (inp) inp.value = ''; applyFilter(); }
 /* the cards between here and there draw at their own height as they come into view, so land, let them draw, and land again */
 const land = () => { try { a.scrollIntoView({block: 'center'}); } catch (x) { a.scrollIntoView(); } };
 land(); setTimeout(land, 90); setTimeout(land, 320);
 a.classList.remove('fl1238'); void a.offsetWidth; a.classList.add('fl1238'); setTimeout(() => a.classList.remove('fl1238'), 1800);
 return true;
}
function goCat(k) {
 const g = D.querySelector('#pane-demob .sgv1238 .gp1238[data-cat1238="' + cssq(k) + '"]:not([hidden])'); if (!g) return false;
 const land = () => { try { g.scrollIntoView({block: 'start'}); } catch (x) { g.scrollIntoView(); } }; land(); setTimeout(land, 90); setTimeout(land, 320); return true;
}

/* ---- taps ---- */
D.addEventListener('click', ev => {
 const t = ev.target && ev.target.closest ? ev.target : null; if (!t || !t.closest('#pane-demob')) return;
 const pick = sel => t.closest('#pane-demob ' + sel);
 let b;
 if ((b = pick('[data-lamp1238]'))) { ev.preventDefault(); ev.stopPropagation(); lamp(b.dataset.k1238, b.dataset.u1238, b.dataset.lamp1238); return; }
 if ((b = pick('[data-book1238]'))) { ev.preventDefault(); ev.stopPropagation(); open(b.dataset.book1238, b.dataset.u1238); return; }
 if ((b = pick('[data-f1238]'))) { ev.preventDefault(); ev.stopPropagation(); FILTER = b.dataset.f1238; applyFilter(); return; }
 if ((b = pick('[data-catgo1238]'))) { ev.preventDefault(); ev.stopPropagation(); goCat(b.dataset.catgo1238); return; }
 if ((b = pick('[data-ldbook1238]'))) { ev.preventDefault(); ev.stopPropagation(); openLoad(loadOf(b) || Number(b.dataset.ldbook1238)); return; }
 if ((b = pick('[data-ldsm1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = loadOf(b) || LOADS[Number(b.dataset.ldsm1238)]; if (t) openUrl('sms:?&body=' + encodeURIComponent(loadWords(t).lines.join('\n'))); return; }
 if ((b = pick('[data-ldsd1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = loadOf(b) || LOADS[Number(b.dataset.ldsd1238)]; if (t) sendLoad(t); return; }
 if ((b = pick('[data-go1238]'))) { ev.preventDefault(); ev.stopPropagation(); goCard(b.dataset.go1238, b.dataset.u1238); return; }
 const act = pick('[data-pic1238],[data-nv1238],[data-sm1238],[data-em1238],[data-sd1238]'); if (!act) return;
 ev.preventDefault(); ev.stopPropagation();
 const key = act.dataset.pic1238 || act.dataset.nv1238 || act.dataset.sm1238 || act.dataset.em1238 || act.dataset.sd1238, c = cardOf(key, act.dataset.u1238); if (!c) return;
 if (act.hasAttribute('data-pic1238')) { openMap(c); return; }
 if (act.hasAttribute('data-nv1238')) { const L = locOf(c); if (L) openUrl(navOf(L)); else try { flash(key + ' has no place on the record yet.'); } catch (x) {} return; }
 const w = wordsOf(c);
 if (act.hasAttribute('data-sm1238')) openUrl('sms:?&body=' + encodeURIComponent(w.lines.join('\n')));
 else if (act.hasAttribute('data-em1238')) openUrl('mailto:?subject=' + encodeURIComponent(w.subject) + '&body=' + encodeURIComponent(w.lines.join('\n')));
 else send(c);
}, true);
D.addEventListener('input', ev => { const t = ev.target; if (!t || !t.matches || !t.matches('#pane-demob [data-fd1238]')) return; FIND = t.value || ''; applyFilter(); }, true);

/* ---- the days: only what was booked for the day, or left on it, with each reference and its asset numbers ---- */
function dayLists(iso) {
 const m = model(), booked = m.cards.filter(c => c.book && qDay(c.book.at) === iso && c.st.s !== 'gone');
 /* one line per kind of item in each departure, with its numbers; a count beyond the numbers is said as "+k without numbers" */
 const left = []; m.byKey.forEach(cs => { const G = cs[0].G; if (!G) return; G.events.forEach(ev => { if (evDay(ev) !== iso) return;
  (ev.byType.length ? ev.byType : [{type: '', n: ev.n, nos: ev.nos}]).forEach(t => left.push({key: cs[0].key, at: ev.info.at, nos: t.nos.slice(), n: Math.max(t.n, t.nos.length), part: !G.complete, desc: descLine(cs[0], t.type ? [t.type] : null)})); }); });
 left.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || nat(a.key, b.key));
 return {booked: booked.sort((a, b) => String(a.book.at).localeCompare(String(b.book.at))), left};
}
/* "FWF portable toilet", "Pee Panel pee panel" is said once: the word comes from the item that left, not the reference's first card */
function descLine(c, types) {
 const word = t => { const w = WORD[iconKey(t, c.cat)] || '', last = w.split(' ').pop().replace(/s$/, ''); return t + (last && !new RegExp(last, 'i').test(t) ? ' ' + w : ''); };
 if (types && types.length) return types.map(word).join(', ');
 const w = WORD[c.icon] || '', t = c.item || c.what.split(' · ')[0], last = w.split(' ').pop().replace(/s$/, '');
 return t + (last && !new RegExp(last, 'i').test(t) ? ' ' + w : '');
}
const leftUnits = L => L.left.reduce((s, x) => s + (x.n || 0), 0);
/* v12.42.1 - Andrew: "I don't like the booked. And ready for booked as it looks like nothing had been booked". The day card's box says
   what was picked up; today's also says how many units are Ready for collection now. Bookings show as lines when there are any. */
const readyUnits = c => c.group ? (c.part ? Number(c.part.remaining) || 0 : Number(c.n) || 1) : c.tank && !c.half ? 2 : 1;
function dayRows(iso) {
 const L = dayLists(iso), last = L.left.reduce((x, y) => y.at && y.at > x ? y.at : x, ''), units = leftUnits(L), t = todayQ();
 const rows = [{label: 'Picked up', value: iso > t ? 'to come' : units + (units === 1 ? ' unit' : ' units') + (last ? ' · last ' + hhmm(last) : '')}];
 if (iso === t) { const r = model().cards.filter(c => c.st.s === 'ready').reduce((n, c) => n + readyUnits(c), 0); rows.push({label: 'Ready for collection', value: r + (r === 1 ? ' unit' : ' units') + ' now'}); }
 return rows;
}
try { const R0 = W.Ready1231; if (R0 && !R0.singles1238) W.Ready1231 = Object.freeze(Object.assign({}, R0, {singles1238: true, dayRows: iso => dayRows(iso)})); } catch (x) {}
/* each day card's demob completion (Andrew: "a perentage daily on the cards so we know the completion of where we are at daily"):
   the progress card's own figures, units off site against the demob's units. A day gone: complete by its end, and what it moved.
   Today: complete now, and what today has moved. A day ahead: complete now, and where its bookings take it if every booking goes. */
const pctW = v => v < 10 ? v.toFixed(1) : v >= 99 && v < 100 ? (Math.floor(v * 10) / 10).toFixed(1) : String(Math.round(v));
const unitsOf = c => c.group ? (Number(c.n) || 1) : c.tank ? 2 : 1;
function dayPct(iso, P) {
 const x = P && P.days.get(iso); if (!x) return '';
 const bar = (was, add) => '<span class="dpb1238"><i class="was" style="width:' + Math.max(0, Math.min(100, was)).toFixed(2) + '%"></i>' + (add > 0 ? '<i class="add" style="left:' + Math.max(0, Math.min(100, was)).toFixed(2) + '%;width:' + Math.max(0.6, Math.min(100 - was, add)).toFixed(2) + '%"></i>' : '') + '</span>';
 if (!x.ahead) return '<span class="dp1238' + (x.today ? ' today' : '') + '" data-dp1238="' + x.cum.toFixed(2) + '"><span class="dph1238"><i>Demob complete · ' + (x.today ? 'now' : 'end of day') + '</i><b>' + pctW(x.cum) + '<small>%</small></b></span>' + bar(x.was, x.add)
  + '<span class="dps1238"><em>+' + x.add.toFixed(1) + '%</em> ' + (x.today ? 'so far today' : 'this day') + ' · ' + x.units + ' unit' + (x.units === 1 ? '' : 's') + ' off site · ' + x.off + ' of ' + P.req + (x.today ? ' off site now' : ' by the end of the day') + '</span></span>';
 const m = model(), bk = m.cards.filter(c => c.book && c.st.s !== 'gone'), day = bk.filter(c => qDay(c.book.at) === iso).reduce((t, c) => t + unitsOf(c), 0), upto = bk.filter(c => qDay(c.book.at) <= iso).reduce((t, c) => t + unitsOf(c), 0);
 const now = x.cum, then = Math.min(100, (P.col + upto) / P.req * 100);
 if (!day) return '<span class="dp1238 ahead" data-dp1238="' + now.toFixed(2) + '"><span class="dph1238"><i>Demob complete · now</i><b>' + pctW(now) + '<small>%</small></b></span>' + bar(now, 0) + '<span class="dps1238">' + P.col + ' of ' + P.req + ' units off site now' + (upto ? ' · ' + pctW(then) + '% by then if every earlier booking goes' : '') + '</span></span>';
 return '<span class="dp1238 ahead" data-dp1238="' + then.toFixed(2) + '"><span class="dph1238"><i>If every booking goes</i><b>' + pctW(then) + '<small>%</small></b></span>' + bar(now, then - now)
  + '<span class="dps1238"><em>+' + (day / P.req * 100).toFixed(1) + '%</em> booked for this day (' + day + ' unit' + (day === 1 ? '' : 's') + ') · ' + pctW(now) + '% complete now</span></span>';
}
function decorateDays() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 let P = null; try { P = W.Glow1238 && typeof Glow1238.daily === 'function' ? Glow1238.daily() : null; } catch (x) { P = null; }
 pane.querySelectorAll('.dc996-day[data-dday816]').forEach(card => {
  const iso = card.dataset.dday816, L = dayLists(iso), pc = dayPct(iso, P);
  const sig = JSON.stringify([L.booked.map(c => c.key + c.uid + c.book.at), L.left.map(x => x.key + x.at + x.nos.join()), pc]);
  if (card.dataset.dl1238 === sig) return; card.dataset.dl1238 = sig;
  const old = card.querySelector('.dp1238'), zone = card.querySelector('.bc984-date-zone');
  if (old) { if (pc) old.outerHTML = pc; else old.remove(); } else if (pc && zone) zone.insertAdjacentHTML('afterend', pc);
  const hd = L.booked.length ? 'PICKED UP AND BOOKED' : 'PICKED UP';
  card.querySelectorAll('.bc984-label, .bc984-at-close').forEach(n => { if (/PLANNED PICK-UPS|COLLECTION RECORD/.test(n.textContent) && n.childNodes[0] && n.childNodes[0].nodeType === 3) n.childNodes[0].nodeValue = hd; });
  [...card.querySelectorAll('*')].forEach(n => { if (n.children.length === 0 && /^(PLANNED PICK-UPS|COLLECTION RECORD|PICKED UP|PICKED UP AND BOOKED)$/.test(n.textContent.trim())) n.textContent = hd; });
  const row = card.querySelector('.bc984-load-row'); if (!row) return;
  const extra = x => x.n - x.nos.length, lines = L.left.map(x => '<span><b>' + e(x.key) + '</b><s><em>' + e(x.desc) + '</em> ' + e(x.nos.length ? x.nos.join(' ') + (extra(x) > 0 ? ' +' + extra(x) + ' without numbers' : '') : (x.n ? x.n + ' unit' + (x.n === 1 ? '' : 's') : '')) + (x.part ? ' · part' : '') + '</s><time>' + e(x.at ? hhmm(x.at) : '–') + '</time></span>')
   .concat(L.booked.map(c => '<span><b>' + e(c.vms ? c.vms.label : c.key) + '</b><s><em>' + e(descLine(c)) + '</em> ' + e(c.no || '') + ' <em>booked</em></s><time>' + e(hhmm(c.book.at)) + '</time></span>'));
  const t = todayQ(); row.innerHTML = '<span class="bc984-label">PICKED UP' + (L.booked.length ? ' · BOOKED' : '') + '<span class="bc984-at-close">REF · ASSET NO. · TIME</span></span>' + (lines.length ? '<span class="dl1238">' + lines.join('') + '</span>' : '<span class="bc984-load-count long">' + (iso > t ? 'To come' : iso === t ? 'None yet' : 'None') + '</span>');
 });
}
function decorate() {
 const pane = D.getElementById('pane-demob'); if (!pane || typeof DM816 !== 'object') return;
 const mode = DM816.view === ALLV ? 'all' : 'day'; if (pane.dataset.sg1238 !== mode) pane.dataset.sg1238 = mode;
 pane.querySelectorAll('p.note816').forEach(p => { if (/^Dated outside the demob days/.test(p.textContent.trim()) && !p.classList.contains('pl1238')) p.classList.add('pl1238'); });
 /* the day's figures in units, the same as its day card; the list button says the same in both views (never the old plan's count) */
 const iso = selDay(), L = dayLists(iso), gone = leftUnits(L);
 const bk = L.booked.length, ahead = iso > todayQ();
 if (mode === 'day') { const h = pane.querySelector('.dmsh816 h3'), tx = dayW(iso) + (ahead ? ' · pick-ups to come' : ' · ' + gone + ' picked up') + (bk ? ' · ' + bk + ' booked' : ''); if (h && h.textContent !== tx) h.textContent = tx; }
 const s = pane.querySelector('.segs816 [data-view816="list"]'), st = ahead ? (mode === 'day' ? '' : dayW(iso) + ' · ') + (bk ? (mode === 'day' ? 'Booked · ' : 'booked · ') + bk : (mode === 'day' ? 'To come' : 'to come')) : (mode === 'day' ? (bk ? 'Picked up and booked · ' : 'Picked up · ') : dayW(iso) + (bk ? ' · picked up and booked · ' : ' · picked up · ')) + (bk + gone); if (s && s.textContent !== st) s.textContent = st;
 try { decorateDays(); } catch (x) {}
 try { applyFilter(); } catch (x) {}
 try { arm(); } catch (x) {}
}

/* ---- the hooks: the list, the drawing, v12.36's count ---- */
if (typeof listHtml816 === 'function') {
 const before = listHtml816;
 listHtml816 = function (rows) {
  try { if (typeof DM816 === 'object' && DM816) { if (DM816.view === ALLV) return viewHtml(null); if (!DM816.view || DM816.view === 'list') return viewHtml(selDay()); } } catch (x) { try { console.error('v12.38 demob cards', x); } catch (y) {} }
  return before.apply(this, arguments);
 };
 Object.assign(listHtml816, before);
}
if (typeof renderDemob816 === 'function') {
 const before = renderDemob816;
 renderDemob816 = function () {
  try { if (typeof DM816 === 'object' && DM816 && ['toilets', 'pump', 'trucks'].indexOf(DM816.view) >= 0) DM816.view = 'list'; } catch (x) {}
  /* the render and these decorations share v12.41's one asset hold and drawing pass; the selected date's reveal stays last */
  const self = this, args = arguments, run = () => { const v = before.apply(self, args); try { decorate(); } catch (x) {} return v; };
  const pass = () => W.Performance1241 && typeof Performance1241.demobPass === 'function' ? Performance1241.demobPass(run, () => { try { if (W.WeatherStrip1002) WeatherStrip1002.reveal(D.getElementById('pane-demob')); } catch (x) {} }) : run();
  return hold(pass);
 };
 Object.assign(renderDemob816, before);
}
/* the tab's "Everything on site · N assets": still on site, in the branch the chips have chosen */
function count() { try { const br = (typeof DM816 === 'object' && DM816 && DM816.branch) || 'all'; return model().cards.filter(c => c.st.s !== 'gone' && (br === 'all' || c.r.branch === br)).length; } catch (x) { return 0; } }
/* Live sync keeps whole delivery documents, the last one written winning. Two phones ticking or booking different units of one
   reference a few seconds apart would lose one phone's work, so as each document arrives from the store, any unit tick, booking
   or history line this browser holds that the store's copy has not got (or holds older) is kept, and the result goes back up.
   A cleared booking is a dated entry too, so a clear is never undone. */
const um = (x, y, t) => { const o = Object.assign({}, x && typeof x === 'object' ? x : {}); let ch = false;
 Object.keys(y && typeof y === 'object' ? y : {}).forEach(u => { const p = o[u], q = y[u]; if (!q || typeof q !== 'object') return; const s1 = String(q[t] || ''), s0 = p ? String(p[t] || '') : '';
  if (!p || s1 > s0 || (s1 === s0 && JSON.stringify(q) < JSON.stringify(p))) { o[u] = q; ch = true; } }); return ch ? o : null; }; /* the later stamp wins; on the same stamp the smaller entry wins on every phone, whichever copy arrives first: Not ready over Ready, a cleared booking over a booking */
const hj = (x, y, k) => { const a = Array.isArray(x) ? x : [], seen = new Set(a.map(k)), add = (Array.isArray(y) ? y : []).filter(h => h && !seen.has(k(h))); return add.length ? a.concat(add).sort((p, q) => String(p.at || '').localeCompare(String(q.at || '')) || k(p).localeCompare(k(q))).slice(-400) : null; }; /* one order on every phone */
/* theirs: the store's own copy when this browser has a change of its own waiting to go up for that reference. The waiting
   copy stands in for the store's in `next`, so a unit another phone ticked there is read from the store's copy here, or the
   waiting send would write over it (review, 26 Oct 19:05) */
function keepUnits(next, cur, theirs) {
 let changed = false;
 const hr = h => (h.unit || '') + '|' + h.ready + '|' + h.at, hp = h => (h.unit || '') + '|' + (h.pickup || '') + '|' + h.at;
 Object.keys(next || {}).forEach(k => { let n = next[k], any = false; if (!n || typeof n !== 'object') return;
  [cur && cur[k], theirs && theirs[k]].forEach(c => { if (!c || typeof c !== 'object' || c === n) return;
   const r = um(n.ready1238_units, c.ready1238_units, 'at'), p = um(n.pickup1238_units, c.pickup1238_units, 'set'), rh = hj(n.ready1238_history, c.ready1238_history, hr), ph = hj(n.pickup1238_history, c.pickup1238_history, hp);
   if (!r && !p && !rh && !ph) return;
   n = Object.assign({}, n); if (r) n.ready1238_units = r; if (p) n.pickup1238_units = p; if (rh) n.ready1238_history = rh; if (ph) n.pickup1238_history = ph; any = true; });
  if (any) { next[k] = n; changed = true; } });
 if (changed) VER++;
 return changed;
}
let raf = 0;
function watch() {
 const pane = D.getElementById('pane-demob'); if (!pane || pane.__sg1238) return; pane.__sg1238 = true;
 new MutationObserver(ms => { if (raf || ms.every(m => m.target && m.target.closest && m.target.closest('.sgv1238,.pg1238,.dl1238'))) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; try { hold(decorate); } catch (x) {} }); }).observe(pane, {childList: true, subtree: true}); /* observer decorations enter the same asset hold */
}
W.Singles1238 = Object.freeze({model, picsState, cardOf, stateOf, cardsOf, setUnitReady, setBooking, lamp, pickUp, open, save, close, wordsOf, send, files, locOf, navOf, goCard, goCat, dayRows, dayLists, iconKey, iconPaths, ICONS, WORD, count, keepUnits, pickOf, parseTime, notePairs, planLoads, loadKind, loadWords, loadUnits, stopsOf, loadNote, truckName, bookLoad, openLoad, loads: () => LOADS, owns: () => true, release: REL});
try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map) RENDER_MEMO.delete('demob816'); } catch (x) {}
watch();
try { const p = D.getElementById('pane-demob'), on = W.Performance1241 && typeof Performance1241.paneActive === 'function' ? Performance1241.paneActive(p, 'demob') : !!(p && !p.hidden); if (on && p.querySelector('.dmday816')) renderDemob816(); } catch (x) {} /* only the pane actually showing (v12.41's startup guard) */
})(window);
</script>
