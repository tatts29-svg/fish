# Speed diagnosis findings so far (Claude, 18 Oct 2026, live v10.60.1)
Each finding: measured cost, root cause traced to code, the fix as prototyped, measured gain. The prototype patches and measurement scripts are in `prototypes/` beside this file (18 Oct, for Codex). The scratch paths below are where they were run. The fixes are going into v10.61 (Claude), except the boot/header set offered to Codex in `prototypes/README.md`.

## load-hotspots (12 findings)

### Load runs the full Today render three times, then rebuilds the asset list once per reference
- Area: load · confidence high
- Cost: These are the four ~10 s phone tasks. Phone, CPU x4, traced, baseline: (1) DCL 8.18 s +11.6 s, (2) reveal redraw 21.1 s +10.3 s, (3) milestone retry 31.6 s +8.9 s, (4) registry render 41.2 s +10.8 s. Tasks 1, 2 and 4 run the same render chain: render (selection-save1012 > map-identity996 > aplus892 > drops911 > S3:55766) > holdAssets > renderPass > renderToday (today993 > staff988 > prose976 > S3:57837/21425) > renderToday_held (today907 > scene896 > lighting894 > where885 > S3:21426). The wrappers nest once each, so no patch makes a render run twice inside itself. Untraced medians, live record, 3 interleaved runs: phone shows the panel at 24.3 s and settles at 40.0 s, with 32.1 s of long tasks (29.3 s from tasks of 300 ms or more, 12 such tasks, max 7.7 s). Desktop shows the panel at 5.96 s and settles at 7.77 s, with 5.9 s of long tasks (max 1.75 s). The order of the four depends on network timing; the set is always the same.
- Root cause: Triggers: (1) the S3:57720 DOMContentLoaded handler calls route(), which draws Today behind the Refresh904 loading panel (html[data-refresh904=loading] hides every pane). (2) Refresh904.update() (S3:57692, wrapped by routes1016) always queues syncRedraw (250 ms). That runs Idle1006.redraw inside persistence1010 background(), then render, then drawn(), which reveals the page. In the phone trace syncFirst had already applied the whole record at 7.76 s, before DCL, so this render repeated the DCL one exactly. (3) The v10.26 ms1026 armRetry setInterval (S126:89207) calls unseenNow(), which reads MS1025.allFacts() with no hold (finding below). (4) docsRefresh (S3:47452) finally calls photoRedraw (flows1013 wrapper S107:86994, then S3:47496), which calls render(). The registry is first requested from inside render 1 (photoIndex S3:47474), so it settles in the middle of loading; on the phone it landed after the reveal, and the visible re-render caused the 0.165 CLS pane-today jump at 41.9 s. Each render is also inflated by per-asset work in nights1040, metadata925, signature, unitEvidence and histOf (findings below).
- Fix: Apply all twelve changes in /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/load-hotspots/patch_v1061_load_hotspots.py (written in patch_*.py style). It uses toolchain rep() with exactly-once matching, refuses to run twice (load1061 marker), and refuses any base other than live v10.60.1 (shapes1060-script plus the v10.60.1 footer). Output: proto_final.html, 17 hunks, check_page.py passes.
- Gain: Final A/B against proto_final, live record, 3 interleaved runs each, medians. Phone 390x844 dpr2, CPU x4: page shown 24.3 s -> 13.1 s; settled 40.0 s -> 19.1 s; long-task total 32.1 -> 13.6 s; tasks of 300 ms or more 29.3 -> 10.2 s (12 -> 7 tasks); max 7.7 -> 4.5 s. Desktop: page shown 5.96 -> 3.86 s; settled 7.77 -> 3.88 s; long-task total 5.88 -> 2.54 s; max 1.75 -> 0.91 s. Return visit (reload with localStorage kept): phone shown 25.2 -> 13.3 s, tasks of 300 ms or more 21.9 -> 10.3 s; desktop shown 5.91 -> 3.98 s. On a settled page (frozen record, median of 5): Today render on desktop 1402/1376 -> 993/836 ms; phone x4 6340 -> 3863 ms. Background record redraw on phone 6834 -> 4533 ms. go('plant')+go('today') on phone 8661 -> 5242 ms and desktop 2026 -> 1276 ms. Build render on phone 1628 -> 891 ms.
- Risk: Each change only memoises inside the page's existing render-hold or HELD_MEMO lifetime, or skips a render that a later render is certain to replace. The finding on landing on the Map explorer is a behaviour change (a bug fix) and needs Andrew's yes. Wall-clock numbers are noisy because other agents shared this 4-core machine. Tracing inflates phone tasks about 2.5x (DCL render 11.6 s traced vs 4.3 s untraced). Compare ratios, not absolute times.

### v10.26 milestone retry rebuilds the full asset list once per reference
- Area: load · confidence high
- Cost: Phone: one 8.87 s task (traced, 31.6 s), or 6.4-7.2 s untraced. Desktop: 1.57 s. On a settled page, MS1026.unseenNow() takes 6170 ms on phone and 1396/1252 ms on desktop. The same read inside a hold takes 757 / 225 ms. It fires when Today drew while hidden behind the loading panel and an area has an unseen 100% milestone: a first visit, a new browser, or the first open after an area completes.
- Root cause: S126 (ms1026-script v10.26) armRetry polls setInterval every 500 ms. Once todayShowing(), unseenNow() calls MS1025.allFacts() (S124 ms1025 v10.25), which calls facts(), then refsOf(), then assetOf() (lighting894 wrapper S17:75708 over S3:14967), then allAssets(). Because nothing is held, each call runs buildAllAssets() (S3:12905, wrapped by lighting894 S17:75697), so the asset list is rebuilt once per reference. Profile inclusive time: buildAllAssets 7585 ms; rentalOf_ 1300 ms self; signature 740 ms self.
- Fix: In S126 unseenNow(), replace `return MS1025.allFacts().filter(` with `return (typeof holdAssets === 'function' ? holdAssets(() => MS1025.allFacts()) : MS1025.allFacts()).filter(`
- Gain: unseenNow: phone 6170 -> 278 ms; desktop 1396 -> 65 ms (hold fix alone: 170 ms). In the load trace this task drops from 8865 ms to 362 ms on phone and is no longer a long task on desktop.
- Risk: Very low. HELD_MEMO is cleared when the call returns.

### Second, identical first-record render when the record arrives before DOMContentLoaded
- Area: load · confidence medium
- Cost: Phone trace: 10.26 s task (21.1 s), the same work as the 11.6 s DCL render. This happens whenever all collections arrive before DCL. That is common on a phone, because parsing the 18 MB page takes 5-8 s. With a frozen (instant) record, baseline drew Today 3 times; the third was a visible redraw after the reveal.
- Root cause: In the S3:57720 DCL handler, route() draws with the complete record, then Refresh904.update() queues syncRedraw. After 250 ms this runs persistence1010 background() (capture/restore), Idle1006.redraw (S3:54233), a full render, then drawn() to reveal. The syncRedraw that syncFirst queued before route() is a duplicate for data route() has already drawn. In baseline it is replaced by update().
- Fix: S3:57720: `document.addEventListener('DOMContentLoaded', () => { WeatherStrip1002.resetRefresh(); const had1061 = Refresh904.report().complete; route(); if (had1061 && Refresh904.report().complete) { clearTimeout(SYNC.rtimer); Refresh904.drawn(); syncFooter(); } else Refresh904.update(); }, {once: true});` drawn() still goes through the routes1016 wrapper, so settle() still runs.
- Gain: Frozen record, instrumented render() and syncRedraw() callers: baseline draws Today 3 times (DCL, reveal, registry). Final draws once (route 1004 ms, then revealed immediately; who_renders.cjs). Page shown on desktop with frozen record: 4.3-5.0 s base vs 2.5-2.9 s.
- Risk: Medium-low. The reveal shows the route() draw, not a fresh re-draw a few hundred ms later. Any data that arrives later still schedules its own syncRedraw as before.

### The photo/document registry is requested from inside the first render and forces an extra full render when it settles
- Area: load · confidence medium
- Cost: Desktop: hidden render of 1.84-1.91 s at 3.9 s. Phone: 6.3-7.4 s hidden, or 9.9 s visible after the reveal (traced), which caused CLS 0.165 on pane-today plus a freeze while Andrew is looking at the page. Base phone load inclusive time for photoRedraw then render: 9891 ms.
- Root cause: photoIndex() (S3:47474) first calls docsRefresh(false) during the DCL render. GET /api/files then settles in the middle of loading. docsRefresh finally calls photoRedraw() (S3:47496, inside the flows1013 S107 capture/restore wrapper), which calls render() for any tab except docs. This happens even when the page is still hidden and a reveal redraw is already queued.
- Fix: (a) In syncBoot (S3:54577), request it when the service connects: `if (rest) { SYNC.backend = rest; syncStart(rest); rest.start(); docsRedraw(); try { docsRefresh(false); } catch (e) {} return; }`. (b) In S3 photoRedraw, add `if (photoWait1061()) return;` before `if (state.tab && state.tab !== 'docs') render();`, with `function photoWait1061(){ if (document.readyState === 'loading') return true; try { const r = window.GC500Refresh904 && GC500Refresh904.report ? GC500Refresh904.report() : null; return !!(r && r.hosted && !r.settled && r.drawing && r.state === 'loading'); } catch (e) { return false; } }`. Before DCL, route() draws with the registry; while the page is hidden with the reveal queued, the queued draw renders it.
- Gain: Desktop: the 1.9 s registry render is gone when the reveal is queued. Phone: the registry now settles before DCL, so the extra render disappears; in the final phone A/B, loads drop from 3 full renders to 2. If it still settles after the reveal on a slow network, the render runs exactly as before.
- Risk: Low. Not covered: a registry that settles while the page is hidden but the record is not yet complete still renders (rule c, on desktop about 0.45 s left).

### Page sometimes opens on the Map explorer instead of Today, after a hidden Map render before route()
- Area: map · confidence high
- Cost: With the record frozen (fast API), unpatched pages opened on Map explorer in 7 of 14 loads (parity base_d2 and base_d4, bench base, meta and hold pages, phone bench base). Each of those also ran a full Map/Explorer render plus iframe boot before DCL. In live runs (slower API) it landed on Today. On a phone with a fast connection and slow parse, the race is likely.
- Root cause: S3:54468 runs after the first pull: `liveMapKeyFromService().then(() => {... if (mp && !mp.hidden) renderMap(); })`. Before route() runs, no pane carries `hidden` (markup line 11725) and state.tab defaults to 'map'. renderMap then calls renderExplorerTab (S3:22007), which calls setHash('sheet/__explorer') (stack captured while readyState was 'loading'). route() at DCL reads #sheet/__explorer and calls go('map'). A syncRedraw timer firing before DCL (S3:54250) has the same effect.
- Fix: S3:54468, start the callback with `if (document.readyState === 'loading') return;`. S3:54250: `if (document.readyState !== 'loading') try { window.Idle1006.redraw(); } catch (e) {}` (syncFooter() still runs). Before DOMContentLoaded, route() draws the right tab with the key.
- Gain: All 20+ prototype loads with this fix landed on Today. The hidden Map/Explorer render before DCL is gone.
- Risk: Behaviour (the bug fix) needs Andrew's yes. Nothing else is touched after DCL.

### nights1040 builds Intl date labels six times per asset
- Area: build · confidence high
- Cost: Base phone load self time: 4.46 s (DCL render 1.80, reveal 1.30, registry 1.37). Desktop: 0.93 s. CPU profile of one Today render on desktop: 205 ms (the largest self-time function).
- Root cause: S3:27814 nights1040(): `days.map(d => {... toLocaleDateString(...) x2 })` builds 3 days x 2 Intl formatters on every call. nightService1040 (S3:27820, wrapped by charge1050) calls it once per asset; servicing748 maps every asset.
- Fix: `const NIGHTS1061 = new Map(); function nights1040(){ ...days computed as before...; const k1061 = days.join('|'); if (!NIGHTS1061.has(k1061)) NIGHTS1061.set(k1061, nights1040make(days)); return NIGHTS1061.get(k1061).map(x => Object.assign({}, x)); } function nights1040make(days){ return days.map(d => {...original body...}); }`
- Gain: Desktop Today render with this fix alone: 1402 -> 1142 ms. The anonymous S3:27817 frame drops out of the final traces.
- Risk: Very low.

### model925 scans every shared load document once per asset
- Area: build · confidence high
- Cost: Base phone load self time: 4.49 s, plus 0.49 s in the align1055 rAF and 0.43 s in the map iframe planItems. Desktop: 0.62 s; 197 ms per Today render.
- Root cause: S35 (units925-script) model925, line 78722, calls `metadata925(env.loads).filter(d=>d.ref===a.key)`. metadata925 (line 78697) runs Object.entries(S.loads).filter(...).map(...) over every load document, once for every asset.
- Fix: Add `function metadataRef1061(loads,ref)`. Outside a hold it falls back to the original. Inside a hold it calls `heldMemo('metadataRef1061',()=>new WeakMap())`, and on first use groups `[key,v]` by `Object.assign({docKey:key},v).ref` in Object.entries order. It then returns `(by.get(ref)||[]).map(([key,v])=>Object.assign({docKey:key},v))`. In model925, use `docs=metadataRef1061(env.loads,a.key)`.
- Gain: With this fix alone, desktop: Today render 1402 -> 1115 ms; Build render 363 -> 256 ms; held facts 225 -> 90 ms. Self time drops from 4.49 s to near 0 on phone.
- Risk: Low.

### Persistence1010 capture() forces layout of every element in a pane that is hidden
- Area: load · confidence high
- Cost: Phone reveal redraw: capture self 1.58 s, plus 64 forced Layout and 64 forced UpdateLayoutTree passes (583 + 412 ms). Over the whole load: 2.26 s self. Desktop: 18 ms.
- Root cause: S102 persistence1010-script capture(), line 86449: `for(const el of [scope,...scope.querySelectorAll('*')]) if(el.scrollTop||el.scrollLeft)` reads scroll offsets of every element. It also does this when the pane is display:none behind the loading panel, during background() around the reveal redraw and in flows1013's photoRedraw wrapper.
- Fix: Prefix the loop with `if(scope.getClientRects().length||getComputedStyle(scope).display==='contents')`.
- Gain: capture no longer appears in the final phone profile. This saves about 2.3 s of phone main-thread time whenever the reveal redraw runs while the page is hidden.
- Risk: Very low.

### EventConfig1013.current() JSON-stringifies the event weeks on every heldMemo/holdAssets call
- Area: build · confidence medium
- Cost: Base phone load self time: 2.08 s (0.74 s of it inside the milestone retry). Desktop: 0.39 s; 74 ms per Today render.
- Root cause: S3:27141-27143: signature() runs JSON.stringify on charge_basis, demob weeks and holidays every time current() is called. heldMemo (S3:12809), holdAssets and nights1040 call current() on every lookup.
- Fix: Add `const perTask1061=f=>{let fresh=false,value;return function(){if(fresh)return value;value=f();fresh=true;queueMicrotask(()=>{fresh=false;});return value;};};` and change to `const current=perTask1061(makeCurrent(...unchanged...));`. Only the page instance changes; the exported makeCurrent is untouched.
- Gain: Phone trace signature self time: 2078 -> 14 ms. The wall-clock bench change was within noise.
- Risk: Low.

### unitEvidence rebuilds a Set of every labour key and stamp for each (reference, item)
- Area: build · confidence medium
- Cost: Base phone load self time: 1.47 s. Desktop: 0.21 s; 89 ms per Today render.
- Root cause: S116 quantity-scope1017-script unitEvidence (line 87594), called from evidence() for each item. It builds new Set([...Object.keys(labour), ...stamps filtered]) and then scans all of it.
- Fix: Inside a hold, `heldMemo('unitKeys1061')` groups the same Set (same order) under every '<ref>/u' prefix once, checking that labour and stamps are the same objects. Each call then filters only `m.by.get(ref)` with the original endsWith and urest tests. Outside a hold the original code runs unchanged (code in the patch, fix 12).
- Gain: Phone trace self time: 1473 -> 26 ms.
- Risk: Low.

### histOf re-deduplicates a reference's history by JSON.stringify on every call
- Area: build · confidence medium
- Cost: Base phone load self time: 0.69 s. Desktop: 0.15 s.
- Root cause: S3:50547 histOf builds `JSON.stringify(Object.keys(h).sort().map(...))` for each entry on every call. deliveryOf, deliveryAsOf, the milestone facts and others call it once per asset.
- Fix: `function histOf(key, field){ return typeof heldMemo === 'function' && ASSETS_HELD ? heldMemo('histOf1061|' + field + '|' + key, () => histOf_(key, field)).slice() : histOf_(key, field); }` with the original renamed to histOf_.
- Gain: Small: desktop Today render 1402 -> 1350 ms with this alone. Part of the combined gain.
- Risk: Low.

### The names1044 first pass reads document.body.textContent, which is about 18 MB including inline scripts
- Area: load · confidence high
- Cost: Inside the S3 evaluation task: 184-194 ms on desktop, 241-282 ms on phone.
- Root cause: S3:28216-28226 (v10.44 names-everywhere-1044): start() calls cleanEl(D.body), and cleanEl first runs RX.test(el.textContent) over the whole body text, which includes every inline script.
- Fix: Use `cleanAll1061(D.body)`. This walks text nodes directly with the same TreeWalker filter (SCRIPT, STYLE and TEXTAREA rejected), then runs the same title checks. MutationObserver handling is unchanged.
- Gain: cleanEl self time: 189 -> 5 ms. The S3 evaluation task drops 655 -> 358 ms on desktop and 2298 -> 1684 ms on phone (traced, together with the other fixes).
- Risk: Very low.

Notes: The four ~10 s phone tasks: three of them are the same full Today render chain, triggered by (1) route() at DOMContentLoaded, (2) the Refresh904 first-record redraw, and (3) the /api/files registry settling and calling photoRedraw. The fourth is the v10.26 milestone retry rebuilding the asset list once per reference with no hold. No patch wraps a render so that it runs several times inside one render; every wrapper calls through once. Most of the cost is repeated renders plus per-asset recomputation inside each render.

The milestone cost only appears when an area has an unseen 100% milestone (a first visit, or the first open after an area completes). On a reload with milestones already seen, baseline does 3 renders without it.

Still left after the fixes (phone all5 trace):
- S3 parse/compile/evaluate: 1.7 s.
- DCL render behind the panel: 2.5-3.2 s.
- Reveal render: 4.4-5.3 s when the record arrives after DCL, which is usual on the live link.
- About 20 tasks of 300-700 ms from the Today map iframe (tile drawing, gc500PlanItems, mapHostStatus). Most of these show as non-JS "(idle)" samples, which suggests image/canvas work. That belongs to the map investigation.

Next steps, not prototyped:
- Skip the hidden DCL render when the record is not yet complete, and render when the panel switches to 'saved'. Saves about 3 s on phone; medium risk.
- Generalise the reveal shortcut with a data-generation counter, so a reload with an unchanged record also skips the second render. Saves about 3-4 s on phone reload.
- Skip a registry render that happens while hidden with the record incomplete. About 0.45 s on desktop.
- JSON.parse for DATA measured only about 20 ms faster in Node, so it is not worth it.

Separate glitch for whoever owns Timeline: on an identical frozen record, the Thu 8 Oct Timeline day card shows either 'DAY'S DELIVERIES 1/2, 38 FWF' or 'DAY'S LOADS 3/3, 42 FWF' depending on load order. Both versions occur in unmodified v10.60.1. It looks like the loads987 'physical' grouping is computed before the plan or record data is settled (S3/loads987 around line 81745).

Measurement:
- The box was shared with other agents (load average 2.5-3.7), so wall-clock times are noisy. Every comparison was interleaved back-to-back, 3 runs each, medians reported.
- Per-fix costs come from CPU-profile self time in the trace's own V8 samples. The analyzer maps line numbers to inline script ids.

The repo and live record were untouched: every write was aborted, and GETs only. GC500_CACHE was pointed at my own cache directory rather than deleting the shared /tmp/gc500-fetch-cache. A FREEZE mode records each GET once and replays it, so parity runs use one fixed record.

## build-tab (15 findings)

### The Build tab is go('timeline'), not go('plant'); measured as such, it blocks 2.4 s on a computer and 11.3 s on a phone (combined patch: 0.8 s and 3.9 s)
- Area: build · confidence high
- Cost: Baseline v10.60.1, first visit after load, medians of 3 back-to-back runs. Desktop 1440x900: go('timeline') blocks 2,359 ms (one long task), 3,749 ms of long tasks in the 4 s after, style recalc 407 ms. Phone 390x844 dpr2 CPU x4: blocks 11,277 ms, 12,871 ms long tasks in the 4 s after, style recalc 1,661 ms. With the profiler on, the phone render was 15.1 s: day-card readings 9.8 s, dsnState 2.2 s, reveal 1.35 s, calendarDays 0.76 s, setHash 0.55 s. go('plant') is the Equipment tab: 516 ms desktop, 2.3 s phone.
- Root cause: In the main inline script (script #3), TABS reads [...['plant','Equipment'],...['timeline','Build'],...]. Everything Andrew calls Build (the day strip of 68 race-number day cards, v10.56 day cards, v10.57/58 categories and Coates on time, weather strip, twin-steer line, progress) lives in pane-timeline. The draw is a chain of 9 wrappers: past984 go -> demob-weather996 go -> holdAssets -> go776Held -> render (selection-save1012 / map-identity996 / drops911 / aplus892) -> renderPass -> loadcards991 -> staff988 -> past984 -> prose976 -> timeline968 -> renderTimeline -> renderTimeline_held. Inside it, card() -> ontime1057 g -> past984 html -> reading() -> daycats1057 / daycards1056 -> work986 day() runs once for each of the 68 day cards.
- Fix: Measure and fix go('timeline'). The combined patch is /tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/buildtab/patch_v1061_buildtab.py, in repo patch style using rep(). It refuses a second run or the wrong base. Run `python3 patch_v1061_buildtab.py page.html` for F1-F12 and F14-F16, and add `--with-f13` for the optional strip-position fix. Its output is byte-identical to proto_v7.html and proto_v7f.html, and check_page.py passes. The footer bump and release are for the release owner.
- Gain: Combined patch (proto_v7), medians of 3 run back to back with the baseline. Desktop block 2,359 -> 806 ms (-66%); long tasks in the 4 s after 3,749 -> 1,439 ms; style recalc 407 -> 301 ms. Phone CPU x4 block 11,277 -> 3,942 ms (-65%); long tasks 12,871 -> 5,831 ms; style recalc 1,661 -> 945 ms. Revisit on desktop with the record unchanged (proto_v2): 938 -> 583 ms. Side effect on load, outside this brief: phone load-phase long tasks 33.1 -> 19.6 s median, desktop 5.8 -> 4.8 s, because heldMemo, isoIn and histOf are used everywhere.
- Risk: Low overall; each fix's own risk is listed below. All memoising uses the page's existing 'once per draw' contract: holdAssets / heldMemo, which save() and sharedCache975() already make stale.

### F1 work986: the daily-works cache key stringified the whole 918 KB record once per day card
- Area: build · confidence high
- Cost: Desktop: native() self 511 ms of the 2.6 s render. Phone (profiled): 3,099 ms self of 15.1 s, the single biggest item.
- Root cause: work986-script, native(): `const key=...+JSON.stringify(S); if(cached && key===cachedKey)return cached;` runs on every BuildWork986.day() call. That is 68 cards per draw, and v10.56 daycards1056 and v10.57 daycats1057 wrap day() and add more calls. Each call builds a fresh 918 KB string and compares 918 KB against the cached key. Once the JSON alone was memoised, the remaining 158 ms on desktop was that comparison: a fresh concatenated string has to be flattened on every call.
- Fix: In work986 native():
OLD: const key=String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));
NEW: const keyOf=()=>String(ready)+'|'+photoState+'|'+docsAt+'|'+(typeof S==='undefined'?'':JSON.stringify(S));
  const key=typeof heldMemo==='function'?heldMemo('work986-key1061|'+ready+'|'+photoState+'|'+docsAt,keyOf):keyOf();
In past984 begin(), share the record string within the draw:
...+(typeof heldMemo==='function'?heldMemo('S-json1061',()=>JSON.stringify(S)):JSON.stringify(S));
- Gain: Phone profile: native() 3,099 -> 2 ms self. Desktop: 511 -> 158 ms with only the JSON memoised, and to near zero with the whole key memoised (the phone profile confirms).
- Risk: None found. Outside a draw, heldMemo just calls the function, as before. The cache still invalidates on any record change because the key still contains the record.

### F6+F10: every reference's delivery, history and arrivals were replayed per day card and per flag
- Area: build · confidence high
- Cost: Phone (profiled) self time: deliveryOf 542 ms, histOf 195 + its dedupe closure 506, deliveryAsOf 231, stamped 231, deliveryTypedField 167, about 1.9 s in all. arrivalsOn was 742 ms inclusive (486 from work986 plus 256 from daycards1056) for the same days. Desktop: about 350 ms.
- Root cause: (a) work986 day() filters all 182 refs three times per past day, once each for done, levelled and steps, through env.rawDelivery = deliveryOf(key). (b) deliveryAsOf(key, asOf) calls deliveryOf and four histOf(key, field) calls per ref per day. histOf de-duplicates by JSON.stringify of every history entry each time. (c) arrivalsOn(iso) is called for the same day by work986 (env.arrivals) and by daycards1056 cameIn, and replays deliveryOf for every asset each time (script #3).
- Fix: Script #3: `function histOf(key, field){ if (ASSETS_HELD && heldMemo) return heldMemo('histOf1061|'+field+'|'+key, () => histOf0(key, field)).slice(); return histOf0(key, field); }`, with the original body renamed histOf0.
deliveryAsOf: for a past asOf, `const d = ASSETS_HELD ? heldMemo('dOf1061|'+key, () => deliveryOf(key)) : deliveryOf(key)`; the today path stays `return deliveryOf(key)`.
work986 env: `rawDelivery:key=>... heldMemo('dOf1061|'+key,()=>deliveryOf(key))`.
arrivalsOn(iso): `ASSETS_HELD ? heldMemo('arrivalsOn1061|'+iso, () => arrivalsOn0(iso)).slice() : arrivalsOn0(iso)`; inside arrivalsOn0, read d through the same 'dOf1061|' memo. Each guard also checks typeof first; exact text is in the patch.
- Gain: Phone profile: deliveryOf 542 -> 84, histOf 195 -> 16, deliveryAsOf 231 -> 85, stamped 231 -> 68 ms. arrivalsOn: one replay per day instead of two, and one deliveryOf per ref per draw instead of 68.
- Risk: Shared objects within one draw. The callers were checked and only read them: work986, daycards1056, adviceFor and daycats1057; no history array is mutated in place anywhere (grep). histOf and arrivalsOn hand out copies. Invalidation is the existing HELD_STALE775 path, which save() and hydration already use.

### F3 units925: every reference scanned every load document to find its unit metadata
- Area: build · confidence high
- Cost: Desktop: 551 ms self in metadata925's filter closure. Phone: 970 ms self. Reached through dsnState -> assetTotal -> generatorModel1004 -> financial-scope1017 owner -> contractReferenceBranches1010 / ItemIdentity979 -> gcModel925 -> model925, and through supplier996 context.
- Root cause: units925-script model925(a, env): `docs=metadata925(env.loads).filter(d=>d.ref===a.key)`. metadata925 does Object.entries over all of S.loads (268 docs), plus startsWith and Object.assign, and this runs for every reference on every call.
- Fix: Add metadataFor925(loads, ref). Inside a draw, heldMemo('metadata925-index1061') holds a WeakMap from the loads object to a Map ref -> [[key, v]...], built once in the same Object.entries order. It returns a fresh Object.assign({docKey:key}, v) per call; outside a draw it does the original scan. model925 then reads `docs=metadataFor925(env.loads,a.key)`.
- Gain: Phone profile: the 970 ms scan becomes model925 at 87 ms inclusive. dsnState 2.2 s -> 0.6 s on the phone, together with F2 and F6.
- Risk: Low. The objects handed out are fresh per call, as before, and the order is preserved.

### F2 EventConfig1013.current() re-serialised the event dates on every heldMemo and holdAssets call
- Area: build · confidence high
- Cost: Desktop: about 180 ms (makeCurrent closure 100 + signature 78). Phone: 911 ms (558 + 353) during the Build switch. The same code is hit throughout the page: thousands of heldMemo calls per draw.
- Root cause: Script #3, EventConfig1013 makeCurrent(): every current() call runs signature(DATA), a JSON.stringify of charge_basis, the demob weeks and the holidays. heldMemo() and holdAssets() both call EventConfig1013.current() first. DATA is static: nothing writes charge_basis, weeks or holidays (checked with grep).
- Fix: OLD: function makeCurrent(provider,changed=()=>{}){let key,value;return function(){const data=provider(),next=signature(data);...return value;};}
NEW: function makeCurrent(provider,changed=()=>{}){let key,value,held1061=null;return function(){const h=typeof ASSETS_HELD!=='undefined'?ASSETS_HELD:null;if(h&&h===held1061&&key!==undefined)return value;const data=provider(),next=signature(data);if(next!==key){const prior=key;value=read(data);key=next;if(prior!==undefined)changed();}held1061=h;return value;};}
- Gain: Phone profile: signature self 464 -> 117 ms (what is left includes progress986's own signature). The closure's self time falls by the same factor. This also helps load and every other tab.
- Risk: The event dates are re-checked once per draw instead of on every call; a new draw (a new asset array) always re-checks.

### F8 staff910 roster(): every day card rebuilt the whole workforce cost list to read that day's names
- Area: build · confidence high
- Cost: Phone: 1,019 ms inclusive (past984 staff -> availability988 -> staff988 roster -> staff910 roster -> workforce1010 ourCosts -> gradeCost/gradeOurs). Desktop: 159 ms. A further 75-110 ms on the phone on every 4 s poll, through the staff988 refresh.
- Root cause: staff910-script: `function roster(day) { return rosterFromRows(day, ourCosts(), ...) }`. ourCosts() grades every cost line and expands workforce rows on each call, so 68 times per draw. rosterFromRows only reads the rows.
- Fix: `function roster(day) { const rows = ASSETS_HELD && heldMemo ? heldMemo('roster-costs1061', () => ourCosts()) : ourCosts(); return rosterFromRows(day, rows, {...same helpers}); }`
- Gain: Phone profile: gradeOurs 378 -> 12, ourCosts 114 -> 2 ms self, and the staff subtree 1,019 -> 155 ms.
- Risk: The shared array is used only by roster(); rosterFromRows does not mutate it.

### F9 quantity-scope1017 unitEvidence(): rebuilt the set of every labour key in the record for each reference, item and day
- Area: build · confidence high
- Cost: Phone: 511 ms self. Desktop: 60-200 ms. Called through daycats1057 onBy -> toiletRows962 -> toiletItem962 -> read -> evidence, and through received1006 / peePrice1010.
- Root cause: `const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);` runs for every call before filtering on `ref+'/u'`.
- Fix: unitKeys1061(labour, stamps, ref): inside a draw, a heldMemo index Map ref -> keys, in the same Set order, rebuilt if the labour or stamps object changes. A ref containing '/' or a call outside a draw takes the original full scan. unitEvidence then iterates `unitKeys1061(labour,stamps,ref)`.
- Gain: Phone profile: unitEvidence 511 -> 4 ms self.
- Risk: An equivalence argument: k.startsWith(ref+'/u') with no '/' in ref means the text before k's first '/' equals ref. Refs that contain '/' fall back to the original scan.

### F4+F5: a new Intl formatter per call (hm/hhmm) and isoIn() on the same timestamps thousands of times
- Area: build · confidence high
- Cost: Phone: isoIn 527 ms, hm 159 ms, hhmm 97 ms self. Desktop: about 115 ms.
- Root cause: daycats1057 hm() and daycards1056 hhmm() call toLocaleTimeString(...) for every late or arrival line. isoIn (script #3) is called through dayStampOf on every history entry, for every ref, for every day.
- Fix: hm/hhmm: `let HM1061=null; ... if(!HM1061) HM1061=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',hour:'2-digit',minute:'2-digit',hour12:false}); return HM1061.format(t);`. An invalid date returns '' in hm and 'Invalid Date' in hhmm, as before.
isoIn: `var ISO_MEMO1061;` with a per-string Map memo, capped at 50,000 entries; a var, to avoid a TDZ error.
- Gain: Phone profile: isoIn 527 -> 104, hm 159 -> 7, hhmm 97 -> 3 ms.
- Risk: None. The output is deterministic per input string and the zone is fixed.

### F7+F12: the 475 KB header car picture was copied onto <html> on every Build draw, restyling the whole document a second time
- Area: flicker · confidence high
- Cost: Desktop trace: a forced UpdateLayoutTree of 70-102 ms over 7,334 elements, reported at navScrollSave. Phone: navScrollSave 457-490 ms self. This was paid on every Build draw, background refreshes included.
- Root cause: renderTimeline_held (script #3): `try { const hz = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); if (hz) document.documentElement.style.setProperty('--hzcar', hz); } catch (e) {}` runs after the pane is drawn. --hzcar is a data:image/webp URL of about 111 K characters (474 KB CSS line). Setting it on the root invalidates every element; the next layout read (setHash -> navScrollSave reads main.scrollTop) pays for it.
- Fix: F7: copy it only once: `if (!window.HZCAR1061) { ...set...; window.HZCAR1061 = true; }`.
F12: read the value at the top of renderTimeline_held, while style is clean (`let hz1061=''; try{ if(!window.HZCAR1061) hz1061=getComputedStyle(...).getPropertyValue('--hzcar'); }catch(e){}`), and set it straight after the pane's innerHTML, so the copy lands in the same style pass as the new pane.
- Gain: Desktop trace, v7 against base: the navScrollSave forced restyle (69.8 ms, 7,334 elements) is gone; style recalc in the 3 s trace window 357 -> 234 ms. Phone style recalc median 1,661 -> 945 ms (with F11).
- Risk: None. header.top's --hzcar comes from a static stylesheet rule, and nothing else writes or removes the root copy (grep).

### F11 weather1002 reveal(): writing the strip's 8px edge padding restyled all 6,523 strip elements a second time
- Area: flicker · confidence high
- Cost: Desktop trace: a forced UpdateLayoutTree of 58-76 ms over 6,523 elements on every Build draw. Phone: reveal + getBoundingClientRect 1,363 ms self in the base.
- Root cause: weather1002-source reveal(): `strip.style.setProperty('--wx1002-edge-start', ... :'8px')` (and the -end variant) on the freshly drawn strip. Custom properties inherit, so every card is invalidated, and the following getBoundingClientRect recalculates everything. The CSS reads var(--wx1002-edge-start,8px), so 8px is already the fallback.
- Fix: `const edge1061=(name,v)=>{const cur=strip.style.getPropertyValue(name);if(cur===v||(!cur&&v==='8px'))return;strip.style.setProperty(name,v);};` and call edge1061(...) for the start and end variables.
- Gain: The second restyle is gone in the v7 trace. Phone profile: reveal 980 -> 695 ms self and getBoundingClientRect 383 -> 13 ms. What remains in reveal is the unavoidable first style and layout of the new 7,000-element pane.
- Risk: Very low.

### F16: swiping the day strip back through past days froze about 2.6 s per card on a phone
- Area: build · confidence medium
- Cost: Phone CPU x4, swiping back 1 day at a time over 4 days: long tasks per card 2,298 / 2,767 / 2,458 / 2,764 ms, with the longest frame 1.9-2.4 s. Desktop: the 2 visible past cards cost 554 + 513 ms of idle-callback long tasks after the switch, with 'Loading…' replaced in stages by the percentage (CLS 0.0003 on bc984-percentage).
- Root cause: progress986-script runs one requestIdleCallback task per newly visible past card: read -> BuildCards984.begin -> PastDay984.model -> jobAtDate (past984). jobAtDate does `holdAssets(()=>progress881Model(iso))`, a new hold every time, so each card rebuilds allAssets, generatorModel1004, the supplier996 programme model and assetTotal for every reference. progress986 signature() also stringifies S on each IntersectionObserver change.
- Fix: Script #3 adds holdCarry1061(carry, fn) and REC_EPOCH1061. The epoch is bumped first thing in save() and in sharedCache975(), the page's existing 'record changed' points. A carried hold is reused only while the epoch and todayIso() are unchanged and no other hold is active. In past984: `var PROG_CARRY1061={};` and in jobAtDate `holdCarry1061(PROG_CARRY1061,()=>progress881Model(iso))` in place of holdAssets(...). Full text is in the patch.
- Gain: Phone swipe per card: 2,298-2,767 -> 1,649 (first card builds the models), then 834 / 732 / 785 ms; longest frame 2.4 s -> 0.5 s. Desktop progress tasks after the switch 554/513 -> 205-247 ms; after a background redraw 436/520 -> 63-106 ms.
- Risk: Medium-low. Memo entries live up to the next save, received record or date change instead of a few milliseconds. Entries depending on the clock time within a day would be up to a few seconds older; none were found on these paths.

### F13 (optional, behaviour): a background record refresh on Build froze the phone 11 s and snapped the day strip back to today
- Area: flicker · confidence high
- Cost: Andrew swipes back 3 days, then the 4 s poll sees changed shared records (emulated in page memory only, DOCS.at+1). Phone CPU x4: one 10,990 ms long task, the whole pane is rebuilt, and strip scrollLeft goes 14,972 -> 16,154, back to today. Desktop: 1,962 ms block plus 436 + 520 ms progress tasks, and the strip snaps back.
- Root cause: syncRedraw -> Idle1006.redraw -> render() -> renderTimeline. There is also past984's syncFooter wrapper, which calls renderTimeline() when the health revision changes. Every draw calls TimelineStrip937.reveal, which re-centres the selected day, so any background redraw throws away where the person has swiped.
- Fix: A small script before shapes1060-script wraps renderTimeline (and counts timelineChange as navigation). When the draw is not navigation (not a timelineChange and not GO_CHANGED) and the selected day is the same, it puts back the strip's scrollLeft. Prev, Today, Next, picking a day, filters and arriving on the tab still re-centre exactly as before. Apply with `--with-f13`.
- Gain: Phone: freeze 10,990 -> 3,370 ms (from F1-F12) and the strip stays at 14,972. Desktop: 1,962 -> 706 ms and the strip stays. F13 alone on base also keeps the position.
- Risk: This changes behaviour, though not data. Andrew should say yes, since the old code re-centred deliberately on every render. Without F13, the speed fixes alone already cut the freeze by 65-70%.

### F14 selection-save1012: any element added anywhere re-scanned the whole document for save-able fields
- Area: idle · confidence medium
- Cost: Phone CPU x4, 15 s idle on Build: mount -> querySelectorAll 439-480 ms, plus refresh 87-94 ms. 207-220 ms more in the 4 s after the switch. It is triggered by the footer strip (#recstrip), small pane updates and clock cells.
- Root cause: selection-save1012-script: `new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,...'))))schedule();}).observe(document.body,{subtree:true,childList:true})`, after which mount() runs document.querySelectorAll(selector) over about 9,500 elements.
- Fix: Schedule only when an added element is, or contains, a field: `[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.selection1012-controls,.selection1012-controls *')&&(n.matches?.(selector)||!!n.querySelector?.(selector)))`.
- Gain: Idle long tasks on Build (phone, 15 s): median 1,408 -> 1,169 ms, from 17-21 tasks down to 17-20. This was measured with the full patch; the profile attributes about 440 ms of the base idle cost to this observer.
- Risk: Low. A removal can never need a new bar (mount only adds bars to fields that exist). A field moved in the DOM appears as an addition.

### F15 Equipment (go('plant')): the rows that fill in after the first screen came 6 at a time, about 200 ms each, keeping a phone busy for over 15 s
- Area: build · confidence medium
- Cost: Desktop: go 516 ms, then about ten long tasks of about 200 ms each (2,442 ms in 4 s). Phone CPU x4: go 2,304 ms, 3,347 ms of long tasks in 4 s, then 3,468 ms of long tasks and 15.8 s of task time in the next 15 s (the fill was still going).
- Root cause: Script #3 plantPump step(): `holdAssets(() => { while (... performance.now() - t0 < 10) if (plantFill(pane, q[qi], qi, 6)) qi++; })`. The 10 ms budget never holds, because each step is a new hold and the first row's lightCell -> sym1033 state -> state1039 -> buildingTransportModel831 rebuilds the transport model (about 170 ms) plus buildAllAssets (about 126 ms).
- Fix: In plantPump, `const carry1061 = {};` and step() uses `holdCarry1061(carry1061, () => {...same loop...})`. This is the same carried hold as F16: the batches of one fill share it while the record epoch and the date are unchanged, which matches what PLANT_REST.flush() already does in a single hold.
- Gain: Desktop: go 516 -> 310 ms; long tasks in 4 s 2,442 -> 412 ms (-83%). Phone (n=1): go 2,304 -> 1,126 ms; 3,347 -> 1,777 ms in 4 s; the following 15 s drop from 3,468 ms long tasks / 15.8 s task time to 112 ms / 1.1 s.
- Risk: Low. A save or a received record bumps the epoch and ends the carry. The PLANT_REST generation check stops old batches as before.

### Not fixed: what still costs on the Build tab after the patch (phone CPU x4, about 3.9 s block)
- Area: build · confidence low
- Cost: Phone render 4.2 s profiled. Day-card readings 1.57 s: daycats1057 cameIn/onBy over 182 refs x 68 days 0.55 s, work986 day() 0.55 s, staff 0.16 s. First style and layout of the 7,000-element pane in reveal 0.70 s. dsnState(today) money 0.60 s (assetTotal 0.53 s). calendarDays -> supplier996 programme model 0.34 s. dayBlock 0.17 s. Browser rendering in the 4 s after the switch: about 2.7 s of '(program)'. A whole-pane style recalc of 72-88 ms, not forced, follows each progress986 paint. 96 :has() rules, several on body (body:has(#pane-map.on #expwrap) ...).
- Root cause: 68 fully built day cards (6,443 strip elements) are drawn and read on every Build draw. The money and programme models are rebuilt per draw because heldMemo only lives for one draw. The late whole-pane restyle points to broad selector invalidation (:has()); this was not traced to a single rule.
- Fix: Not prototyped, in order of value and risk. (1) Extend the epoch-carried hold of F15/F16 to dsnState(today) and the supplier996 model across draws: same contract, bigger win on revisits and redraws. It needs an audit that those memos have no UI-state inputs. (2) Find the :has() rule behind the restyle after progress paints. (3) content-visibility:auto on off-screen day cards would skip most of the 2.7 s of rendering, but cards have different heights (659-1,036 px) and the strip is align-items:flex-start, so the strip's height would change. It needs a mock-up and Andrew's yes.
- Gain: Not measured.
- Risk: (1) is a medium risk and needs that audit; (3) is a visual layout risk.

Notes: The Build tab is TABS key 'timeline' (label 'Build'); 'plant' is Equipment. The brief's go('plant') numbers measured Equipment, so I measured and fixed both, with Build as the main target. All work is read-only (harness GET, writes aborted). The only in-memory nudge was DOCS.at+1, used to emulate a poll seeing changed records. No repo files were edited and nothing was uploaded; I used my own fetch cache (GC500_CACHE) so other agents' runs were not disturbed. Timings are medians of 3 runs, baseline and prototype alternating in the same batch, with probes taking no layout reads. Other agents were running at the same time, so absolute numbers are noisy; self-time attribution comes from CDP CPU profiles (250 µs sampling) and devtools traces. Status from the probes on the other questions asked: no Build re-render happens while idle unless the record changes (0 renderTimeline calls in 15 s). The idle mutations (about 11/s) are the header clocks (#tpodNum etc.), not the Build pane. Off-screen card animations are already paused, with motion only on visible cards. CLS on the switch is 0.001-0.005 in both pages. Content does arrive in stages: the progress percentage ('Loading…' -> nn%) on visible past cards, which F16 makes about 2-3x quicker but keeps by design, plus the intentional 640 ms count-up and the pane 'arrive' animation. The candidate is F1-F12 + F14-F16 (proto_v7.html, sha256 dc95f744d98f9996…); with F13 it is proto_v7f.html (sha256 4b7b04d4683c242d…). Both pass check_page.py and are reproduced byte for byte by patch_v1061_buildtab.py. Before release, the owner should rebuild on the then-live page with toolchain/build.sh, run both sweeps, and ask Andrew whether F13 goes in.

## flicker (8 findings)

### Header jumps when the 9.8 MB script rebuilds it (Tools button, empty clock and countdown lines, footer)
- Area: flicker · confidence high
- Cost: Phone 390x844 dpr2 CPU x4: layout shift 0.068 at 4.0–4.5 s. The clock cluster moves up 43 px and grows 29 px, and the tab bar, main and footer move with it. The changed frame covers 18.6% of the screen. Desktop 1440x900: shift 0.157 at 1.3–1.7 s (search, footer, main, tabs, rail). The static header is 264 px tall and the finished one 303 px, so everything jumps 39 px. Identical in 3/3 runs on each.
- Root cause: The first paint (0.9–1.2 s) is the static HTML header in base.html before the main inline script (offset 3124521) runs. That script's init sequence then does three things. (1) renderTabs() moves `.tools` (Tools button plus search) out of `.brandrow` into `#tabs`. The pre-script brand row is 34 px taller because Tools wraps onto a second line. (2) tpodPaint() and hzCountdown() fill `#tpodDate`, `#hzcdT` and `#hzcdSub`, which start empty. CSS `.hzpod .num small.cdt:empty{display:none}` hides the countdown line until it has text, so the countdown pod grows from 77 to 106 px. (3) syncFooter() fills `#footL` and `#footR`, so the footer goes from 12 to 38 px.
- Fix: patch_smooth1061.py part A. Add a head `<style id="smooth1061-early">` with rules that apply only until the script has laid the header out:
html:not(.hdr1061) .brandrow > .tools{display:none}
html:not(.hdr1061) #tpodDate:empty::before,html:not(.hdr1061) #hzcdT:empty::before,html:not(.hdr1061) #hzcdSub:empty::before,html:not(.hdr1061) #footL:empty::before,html:not(.hdr1061) #footR:empty::before{content:"\00a0"}
html.cd1061:not(.hdr1061) .hzpod .num small.cdt:empty{display:inline}
@media(max-width:640px){html.cd1061:not(.hdr1061) .hzpod .num small.cdt:empty{display:block}}
In a head script:
if(Date.now()<Date.parse('2026-10-23T00:00:00+10:00'))document.documentElement.classList.add('cd1061');
document.addEventListener('DOMContentLoaded',function(){document.documentElement.classList.add('hdr1061');});
The race date is read from DATA.race_days[0] at build time. Then replace "syncBoot();\nwindow.addEventListener('popstate', onPop);" with "syncBoot();\ndocument.documentElement.classList.add('hdr1061');\nwindow.addEventListener('popstate', onPop);".
- Gain: Static header geometry (JS off) now matches the finished header within 1–2 px on phone and on desktop. The remaining 1–2 px is font metrics, removed by finding 3. CLS totals (3 runs each, medians, with findings 2–4): phone load 0.1044 → 0.0001; desktop load 0.1723 → 0.0016. The 4 s header re-layout frame drops from 18.6% to 6.0% of the screen (values filling in, nothing moving). Before/after sheet: ba_load.jpg and hdr_compare.png.
- Risk: Low. The rules are scoped to `html:not(.hdr1061)`. A DOMContentLoaded fallback ends them even if the main script stops early, so a broken script cannot leave Tools hidden. The countdown reservation switches off at race day, which is when hzCountdownTick starts leaving that line empty. A future patch that adds header content would need its own reservation; without one it is no worse than today.

### NO TWIN-STEER banner is pushed into the header after the first render
- Area: flicker · confidence high
- Cost: Phone: the tab bar and main jump down 41 px at 10.0–10.6 s (layout shift 0.0349; the frame changes over 19.6% of the screen). Desktop: shift 0.0137 at 2.6–3.9 s. 3/3 runs on each.
- Root cause: twinsteer1053-script: `if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', watch)`. watch() calls banners(), which runs insertBefore(#ts1053-banner, #tabs) inside header.top. That DOMContentLoaded listener runs after the main script's own DOMContentLoaded route() render (the 4–5 s long task at about 5.6 s on phone), so the banner appears last. Its CSS (twinsteer1053-style) is also only injected at the end of the body.
- Fix: patch_smooth1061.py part A. Replace '<nav class="tabs" id="tabs" aria-label="Views"></nav>' with the identical banner markup in front of it:
<div id="ts1053-banner" role="note"><span class="ts1053-ic" aria-hidden="true">⛔</span><b>NO TWIN-STEER TRUCKS</b> · <span class="ts1053-nw">Week 3 to demob</span> · <span class="ts1053-nw">track, Esplanade,</span> <span class="ts1053-nw">Macintosh Island Park</span></div><nav class="tabs" id="tabs" aria-label="Views"></nav>
Copy the banner's own rules verbatim from twinsteer1053-style into the head style: the first four strings, up to '.ts1053-drawer{', plus @media print{#ts1053-banner{display:none!important}}. banners() already skips when #ts1053-banner exists.
- Gain: The 41 px jump is gone. The 10.6 s frame change drops from 19.6% to 0.7% of the screen (only the record lamp changes to LIVE). This is part of the CLS totals above.
- Risk: If v10.53's banner wording ever changes, it must be changed in both places, or the static copy should be dropped.

### Header fonts swap about 0.5–1 s after the header first paints
- Area: flicker · confidence high
- Cost: Phone: all header text, including the clock digits, wordmark and tab labels, is drawn in Arial Narrow or system sans, then re-drawn in Barlow Condensed and Inter at 4.4–4.95 s. The frame change covers 7.5% of the screen, plus a layout shift of 0.0015 (i.yr and #tpodNum). Desktop: shift 0.0019 at about 1.4–2.1 s, same cause.
- Root cause: hostedMedia() inside the main DATA script (offset about 7.61 MB) builds the @font-face rules for DATA.hostedMedia.fonts (/m/<token>/<sha>.woff2, font-display:swap) and only appends them when that script executes. That is about 4.0 s after navigation on phone, so the first paint can only use the fallback fonts.
- Fix: patch_smooth1061.py part B. Add a head script, placed before the first style that uses the fonts, that declares and preloads the same five files. The file names are read from DATA.media at build time:
(function(){var m=location.pathname.match(/^\/(?:v|e)\/([^/]+)\/?$/);if(!m)return;var b='/m/'+m[1]+'/',F=[["Barlow Condensed","italic","700","3e91…fee6.woff2"],["Inter","normal","400","8909…edc.woff2"],["Inter","normal","600","f9a0…21a.woff2"],["Inter","normal","700","6f56…2491.woff2"],["Inter","normal","800","a7d0…820d.woff2"]],css='';F.forEach(function(f){css+='@font-face{font-family:'+JSON.stringify(f[0])+';font-style:'+f[1]+';font-weight:'+f[2]+';font-display:swap;src:url('+JSON.stringify(b+f[3])+') format("woff2")}';var l=document.createElement('link');l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous';l.href=b+f[3];document.head.appendChild(l);});var s=document.createElement('style');s.id='fonts1061';s.textContent=css;document.head.appendChild(s);})();
Then replace 'document.head.appendChild(font);' in hostedMedia with "if(!document.getElementById('fonts1061'))document.head.appendChild(font);".
- Gain: The first-paint frames are already in Barlow and Inter, and the 4.4–4.95 s swap frame is gone (0.075 of the screen → nothing). The 0.0015 phone and 0.0019 desktop shift entries are gone.
- Risk: The font file names are baked in at build time, so re-run the builder if DATA.hostedMedia.fonts changes (it reads them from DATA). The five preloads (about 24 KB each) start about 4 s earlier than before. Time to the record on screen was unchanged: 7 alternating pairs, median 26.1 s vs 26.0 s, and long-task time before the record 23.5 s vs 23.5 s.

### Map explorer tab is lit for about 6 s on open, then the highlight jumps to Today
- Area: flicker · confidence high
- Cost: Phone: from 4.0 s to 10.6 s the tab bar shows 'Map explorer' selected (orange box), then switches to 'Today' when the pane renders. Desktop: same, for about 1–2 s.
- Root cause: Main script: `let state = {tab:'map', q:'', sheet:'D022', …}`. The first `renderTabs();`, called right after the Refresh904 IIFE, runs before route(). route() is deferred to DOMContentLoaded, where an empty hash means go('today'). So the first tab bar marks state.tab = 'map'.
- Fix: patch_smooth1061.py part C. Replace "renderTabs();\n/* A deep link uses the later inline map/progress extensions too." with:
{ const t1061 = state.tab, h1061 = (location.hash || '').replace(/^#/, ''); if (!h1061 || TABS.some(([k]) => k === h1061)) state.tab = h1061 || 'today'; renderTabs(); state.tab = t1061; }
/* A deep link uses the later inline map/progress extensions too.
- Gain: The first tab bar already shows Today, or whichever tab is named in the hash, so the highlight never jumps (see ba_load.jpg, 4.3 s and 5.0 s columns).
- Risk: Very low. It only affects the tab bar's look in the gap before route().

### On a slow phone or network, 'Saved copy — current record not confirmed' plus a red OFFLINE lamp shows, then the Today pane is rebuilt and jumps
- Area: load · confidence high
- Cost: Reproduced 3/3 on phone CPU x4 with 4 s API latency. 'Saved copy — current record not confirmed. The connection is taking longer than expected…' with a Retry button, the red OFFLINE lamp and the footer 'Shared record not reached' appear at 16.5–20.0 s, showing the stale baked-in Today pane. When the live record draws (28.8–33.8 s) the pane is rebuilt and jumps: layout shift 0.1647 on section#pane-today. Load CLS 0.2713. This is the same 0.1647 pane-today shift the original probe caught at 41.9 s, and it is the 'feels like it's not going to load or break' moment.
- Root cause: Refresh904 IIFE in the main script: `timer = setTimeout(() => { if (!settled) { show('saved'); update(); } }, 12000);`. In syncBoot's subscribe: `SYNC.utimer = setTimeout(() => { if (SYNC.status === 'connecting') { SYNC.status = 'unreachable'; syncFooter(); } }, 12000);`. Both count wall-clock time from when the script ran (about 4 s). The page's own long tasks (about 4.3 s at DOMContentLoaded plus 4.5 s before the record applies, on CPU x4) use most of those 12 s, so the fallback fires while the answer is arriving or already in and waiting for a free thread.
- Fix: patch_smooth1061.py part E. Add a head helper that counts only waiting time:
window.patient1061=function(ms,fn){var h={t:0,acc:0,last:performance.now(),off:false};function step(){if(h.off)return;var now=performance.now(),d=now-h.last;h.last=now;h.acc+=document.hidden?d:Math.min(d,1100);if(h.acc>=ms){h.off=true;fn();}else h.t=setTimeout(step,1000);}h.t=setTimeout(step,1000);h.stop=function(){h.off=true;clearTimeout(h.t);};return h;};
window.patientStop1061=function(h){if(h&&h.stop)h.stop();else clearTimeout(h);};
Then make four replacements:
- "timer = setTimeout(() => { if (!settled) { show('saved'); update(); } }, 12000);" → "timer = patient1061(12000, () => { if (!settled) { show('saved'); update(); } });"
- "settled = true; clearTimeout(timer); show('ready');" → "settled = true; patientStop1061(timer); show('ready');"
- "clearTimeout(SYNC.ftimer); clearTimeout(SYNC.utimer);" → "clearTimeout(SYNC.ftimer); patientStop1061(SYNC.utimer);"
- "clearTimeout(SYNC.utimer);\n SYNC.utimer = setTimeout(() => { if (SYNC.status === 'connecting') { SYNC.status = 'unreachable'; syncFooter(); } }, 12000);" → "patientStop1061(SYNC.utimer);\n SYNC.utimer = patient1061(12000, () => { if (SYNC.status === 'connecting') { SYNC.status = 'unreachable'; syncFooter(); } });"
- Gain: Slow network, 3 pairs: saved copy shown 3/3 → 0/3. The OFFLINE lamp no longer flashes (the lamp stays CHECKING, then turns LIVE). The pane-today rebuild jump is gone: load CLS 0.2713 → 0.0001 (medians, all runs identical). The loading card goes straight to Today in one swap. Images: sh_slow.jpg (before) and sh_protoslow.jpg (after).
- Risk: Medium-low. On a busy phone with a live but very slow network, the saved copy now appears later (after about 12 s of real waiting instead of 12 s of wall time). Hidden tabs count real elapsed time.

### A tapped tab gives no lasting sign it was pressed; the screen freezes for up to 12 s (Build is worst)
- Area: build · confidence medium
- Cost: Phone CPU x4, time from pressing a tab to its page appearing (no screencast, 3 runs): Build (key 'timeline') 11.8 / 12.1 / 12.4 s; Today 7.1 / 8.2 / 8.3 s; Equipment ('plant') 2.6–2.8 s; Map explorer 1.4–1.9 s. During that wait the only feedback is the v5.93 `.busy` tint (rgba(255,106,19,.16), barely visible) and a ring that fades within about 430 ms. The old tab stays lit and not one frame changes: longest frozen screen after pressing Build is 12.4 s (median of 3; 42 frames in about 13 s). Desktop is the same mechanism with shorter waits.
- Root cause: The renderTabs() click handler (main script) runs `b.classList.add('busy'); requestAnimationFrame(() => setTimeout(() => { go(b.dataset.tab); }, 0));`. go() then renders synchronously in one long task. The only style for that state is `nav.tabs button.busy{color:#fff;background:rgba(255,106,19,.16)}`, and nothing animates while the main thread is blocked.
- Fix: patch_smooth1061.py part D, CSS only. Add to the head style:
nav.tabs button.busy{color:#fff;box-shadow:0 0 0 1px #ffb16b,0 0 13px 2px #ff873b60!important}
nav.tabs button.busy::after{content:'';position:absolute;left:12%;right:12%;bottom:-2.5px;height:2.5px;border-radius:2px;background:#ff6a13;box-shadow:0 0 12px 2px rgba(255,106,19,.55);transform-origin:50% 50%;animation:busy1061 .8s ease-in-out infinite alternate}
nav.tabs:has(button.busy) button[aria-selected="true"]:not(.busy)::after{opacity:.2}
@keyframes busy1061{from{transform:scaleX(.2);opacity:.55}to{transform:scaleX(1);opacity:1}}
@media (prefers-reduced-motion:reduce){nav.tabs button.busy::after{animation:none}}
The pressed tab looks chosen straight away. Its underline pulses with a transform/opacity animation, which the compositor keeps running while go() holds the main thread, and the old tab's underline dims.
- Gain: Longest frozen screen after pressing Build: 12,436 ms → 357 ms (medians of 3 A/B pairs); frames while waiting 42 → 998. Final build, 1 run: 52 ms and 615 frames. Tap-to-page time is unchanged with the screencast off: Build 12.07 s → 11.58 s, Today 8.20 s → 7.53 s (3 pairs, inside the noise). Image: ba_tap.jpg.
- Risk: Low. Older browsers without `:has` simply keep the old tab's underline at full strength. I first tried dimming the old pane (opacity on `.pane.on`) and dropped it: promoting the 15,000 px Today pane to its own layer blanked the header background to white (proto_flash.png). This only makes the wait visible. The Build render itself (about 11 s on the first open) needs the Build-tab speed work.

### The page appears, then freezes for 5–7 s before the milestone confetti (the milestone check rebuilds the asset list for every reference)
- Area: load · confidence high
- Cost: Phone CPU x4: the largest long task in the 10 s after the record appears is 6.7 / 7.1 / 6.8 s (3 runs). A CPU profile of the 8 s after the reveal shows unseenNow at 5,671 ms inclusive (allFacts → facts → refsOf → assetOf → allAssets → buildAllAssets 4,901 ms). The page is visible but does not scroll or respond, then the confetti starts. This happens on the first view of each new 100% area per browser, and on every view in a fresh browser.
- Root cause: ms1026-script armRetry(): when Today becomes visible it calls unseenNow(), which runs `MS1025.allFacts()` outside holdAssets(). With ASSETS_HELD null, allAssets() calls buildAllAssets() on every assetOf() lookup, rebuilding the whole asset list once per reference.
- Fix: patch_smooth1061.py part F. Replace "const s = MS1025.seen(); return MS1025.allFacts().filter(f => f.reached && s[f.id] !== (f.reachedAt || 'reached')).map(f => ({f})); }" with "const s = MS1025.seen(); const all = typeof W.holdAssets === 'function' ? W.holdAssets(() => MS1025.allFacts()) : MS1025.allFacts(); return all.filter(f => f.reached && s[f.id] !== (f.reachedAt || 'reached')).map(f => ({f})); }"
- Gain: unseenNow 5,671 ms → 989 ms inclusive (CPU profile, one each). Largest post-reveal long task 6.8 s → 0.86 s (medians of 3 sequential alternating pairs).
- Risk: Very low. One synchronous pass; the record cannot change inside it.

### Smaller visible events left as they are (no prototype)
- Area: other · confidence medium
- Cost: (a) Back button: the first navigation away from Today shows #navBack, which pushes the GC500 lockup 42 px right (shift 0.005, in every run on phone and in the tour runs). (b) Map explorer opens on a black canvas, and the satellite tiles fade in 0.3–0.8 s later on each open. (c) The milestone confetti (ms1026 screenBurst) plays for about 6 s, once per milestone per browser, by design. (d) Idle on Today, frame by frame from 39 to 90 s: only the clock digits each second and the shift-light segments every 4–5 s change. The 4 s record poll redraws nothing visible. (e) The rail flag and car settle: shift 0.0001 on phone, 0.0016 on desktop.
- Root cause: (a) `.navback` in .brandrow is [hidden] until navBackShow() runs after route() or go(). (b) The Explorer iframe draws its canvas before the tiles arrive. (d) tpodPaint() rewrites #tpodNum innerHTML every second; that costs CPU (see the idle finding) but is not a flicker. (e) hzCountdown() sets the flag's left position after first paint (it starts at -99px).
- Fix: (a) Overlay the button instead of reserving space for it, e.g. `.brandrow .navback{position:absolute;left:4px;top:…}`. This needs a design check, because reserving space would move the logo for good. (b) Paint the page's embedded aerial (DATA aerial_mid) as the canvas background until the first tiles land. (e) Optional: `html:not(.hdr1061) #hzrail .flag,html:not(.hdr1061) #hzrail .car{visibility:hidden}`.
- Gain: Not measured: none of these were prototyped. (a) is worth 0.005 CLS on the first navigation; the others are cosmetic.
- Risk: (a) changes the brand row's look, so it needs Andrew's or a design sign-off.

Notes: I recorded the phone page (390x844 dpr2, CPU x4) as a CDP screencast started before navigation, so every painted frame is kept, and diffed each frame against the one before. Runs went to about 90 s, then pressed Build, Today, Map explorer, Build, Equipment and Today. I also logged layout-shift sources with their rects, the data-refresh904 state, late styles, container rebuilds and resizes.

Load flicker on phone, baseline:
- 0.9–1.2 s: first paint is the static header. Tools sits in the brand row, the clock and countdown lines are empty and there is no tab label.
- 4.0 s: the script rebuilds the header (shift 0.068) and lights Map explorer.
- 4.4–4.95 s: the fonts swap.
- 10.0–10.6 s: the twin-steer banner is pushed in (shift 0.035) and the highlight jumps to Today.
- 11 s: the record lamp turns LIVE.
- About 25 s: the loading card swaps to Today, which is fine, and then the page freezes for 5–7 s before the confetti.
- On a slow network: the 'Saved copy' card and the OFFLINE lamp appear at 16–20 s, then the Today pane is rebuilt and jumps (0.165).

Fixes A–F together, median of 3 runs each, base and prototype recorded side by side:
- Phone load CLS: 0.1044 → 0.0001.
- Phone load CLS on a slow network: 0.2713 → 0.0001. The saved copy showed 3/3 before and 0/3 after.
- Desktop load CLS: 0.1723 → 0.0016.
- Visible changes before the record appears: 5 → 3. Their total area, not counting the first paint, drops from 46.8% to 7.0% of the screen.
- Longest frozen screen after pressing Build: 12.4 s → 0.36 s.
- Largest long task straight after the reveal: 6.8 s → 0.86 s.
- Time to the record on screen is unchanged: 7 alternating pairs, 26.1 s vs 26.0 s. Tap-to-page time is also unchanged with the screencast off.

Parity: innerText of all 24 tab panes, the header, the footer, the banner markup and the tab bar is identical on phone and desktop. The only DOM difference is two classes on the html element. The milestone celebration fires identically. check_page.py PASS (140 inline scripts parse, no new keys).

Correction for the other investigations: the Build tab is key 'timeline' (TABS ['timeline','Build']). 'plant' is Equipment. So the probe's go('plant') numbers are for Equipment. Build is the slowest tab: its first open is a 10.9–12.4 s long task on phone CPU x4, and later opens take 3.6–4.2 s.

Method notes: I used my own fetch cache (GC500_CACHE in my folder, cleared once at the start) instead of deleting the shared /tmp/gc500-fetch-cache other agents are using. Every write was aborted: blocked=0 attempted writes in all runs, and no repo files were touched. The screencast itself costs CPU when the prototype animates, which is why tap-to-page was re-measured with it off. My recorder clicks the real `#tabs [data-tab]` buttons.

Dropped idea: dimming the old pane during a tab change blanked the header background, so it was removed from the prototype (proto_flash.png).

Not prototyped: the Back button pushing the logo 42 px on the first navigation (0.005), and the Map explorer's black canvas before tiles arrive.
