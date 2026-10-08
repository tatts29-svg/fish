// Author: Andrew Fisher. v9.17 - read every reference's navigation point off a page, surface by surface, read only.
//   PAGE=<page html> OUT=<json> [MOB=1] node tests/collect_pins917.cjs        (run through browser_run.sh)
// Opens the page at the live address reading the live record (GET only; every write is aborted, counts.blocked must be 0)
// and records, for every reference the page knows (allAssets plus the register, added and MASTER_LOC keys it can resolve):
//   Navigate (dest782: kind, label, sms, point), the Navigate button (navBtn), the drop message (dropText: Directions and
//   "Or key in"), the job sheet lines (text747Where), dpPos, the driver card, the drop email (Sat nav line, button), the
//   drawer's satellite panel (Approx. position, Copy, Navigate, Street View, Google Earth, From Coates Kingston, Fly around,
//   Street View here), the drawer's "Where it is" links (Drive there, Walk to it, Earth), the map pin / search spot
//   (spotOf), the load list Go (ldGoTarget751) and the day list pin (dayPinCell), plus MASTER_LOC and the record version.
const fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
(async () => {
  let s;
  try {
    const mob = !!process.env.MOB;
    s = await open({pageFile: process.env.PAGE, W: mob ? 390 : 1440, H: mob ? 844 : 900, mobile: mob, dpr: mob ? 2 : 1});
    const p = s.page;
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof dest782 === 'function', null, {timeout: 180000});
    await p.waitForTimeout(3000);
    const X = await p.evaluate(() => {
      const v0 = SYNC.backend && SYNC.backend.readVersion821 ? SYNC.backend.readVersion821() : null;
      const num = x => Number(x);
      const tryf = (f) => { try { return f(); } catch (e) { return {error: String(e && e.message || e).slice(0, 160)}; } };
      const dec = h => String(h || '').replace(/&amp;/g, '&');
      const dests = h => [...dec(h).matchAll(/destination=(-?\d+\.\d+),(-?\d+\.\d+)(?:&travelmode=(driving|walking))?/g)].map(m => ({ll: [num(m[1]), num(m[2])], mode: m[3] || null}));
      const earths = h => [...dec(h).matchAll(/earth\.google\.com\/web\/@(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m => [num(m[1]), num(m[2])]);
      const svs = h => [...dec(h).matchAll(/viewpoint=(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m => [num(m[1]), num(m[2])]);
      const assets = allAssets(); const inAll = new Set(assets.map(a => a.key));
      const extra = [...new Set([].concat((DATA.assets || []).map(a => a.key), (S.added || []).map(a => a.key), Object.keys(MASTER_LOC)))].filter(k => k && !inAll.has(k));
      const work = assets.concat(extra.map(k => { try { return assetOf(k); } catch (e) { return null; } }).filter(Boolean));
      const rows = work.map(a => {
        const k = a.key, r = {key: k, inAll: inAll.has(k), name: a.name || ''};
        const d = tryf(() => dest782(a));
        r.dest = d && !d.error ? {kind: d.kind, label: d.label, sms: d.sms || '', ll: d.ll ? [d.ll.lat, d.ll.lon] : null} : (d && d.error ? d : null);
        const ml = MASTER_LOC[k]; r.master = ml ? {ll: ml.ll, pt: ml.pt, how: ml.how, img: ml.img || null} : null;
        const sf = {};
        sf.navBtn = tryf(() => dests(navBtn(a, {})).map(x => x.ll));
        sf.dropText = tryf(() => { const t = dropText(a, {}); const m = /Directions: \S*destination=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(t); const k2 = /Or key in: ([^\n]*)/.exec(t); return {ll: m ? [num(m[1]), num(m[2])] : null, keyin: k2 ? k2[1].slice(0, 200) : null}; });
        sf.text747 = tryf(() => dests(text747Where(a).join('\n')).map(x => x.ll));
        sf.dpPos = tryf(() => { const P = dpPos(a); return {kind: P.kind, ll: P.lat != null ? [P.lat, P.lon] : null}; });
        sf.driverCard = tryf(() => { const h = driverCard(a); return {dest: dests(h).map(x => x.ll), earth: earths(h)}; });
        sf.email = tryf(() => { const h = dropEmailHtml(a, {list: []}, {}); const sat = /<b>Sat nav:<\/b>\s*<span[^>]*>(-?\d+\.\d+), (-?\d+\.\d+)</.exec(h);
          const btn = /destination=(-?\d+\.\d+),(-?\d+\.\d+)(?:&amp;|&)travelmode=driving[^"]*"[^>]*>(Open the pinned spot in maps|Open it in maps)/.exec(h);
          return {satnav: sat ? [num(sat[1]), num(sat[2])] : null, button: btn ? [num(btn[1]), num(btn[2])] : null, buttonText: btn ? btn[3] : null}; });
        sf.satellite = tryf(() => { const h = satelliteBlock(a); if (!h) return null; const i = h.indexOf('satcap pos'); if (i < 0) return {pos: false};
          const seg = h.slice(i); const end = seg.indexOf('class="satacts"'); const body = end > 0 ? seg.slice(0, end) : seg;
          const mono = /Approx\. position<\/b>\s*<span class="mono">(-?\d+\.\d+), (-?\d+\.\d+)</.exec(body); const copy = /data-copypos="(-?\d+\.\d+), (-?\d+\.\d+)"/.exec(body);
          const nav = [...dec(body).matchAll(/href="([^"]+)"[^>]*>([^<]{2,40})/g)].map(m => ({url: m[1], text: m[2].trim()}));
          const pick = re => (nav.find(x => re.test(x.text)) || {}).url || '';
          const ll = u => { const m = /(?:destination=|@|viewpoint=)(-?\d+\.\d+),(-?\d+\.\d+)/.exec(u); return m ? [num(m[1]), num(m[2])] : null; };
          const acts = h.slice(h.indexOf('class="satacts"')); const fly = /id="satFly" data-lat="(-?[\d.]+)" data-lon="(-?[\d.]+)"/.exec(acts), sv = /id="satSv" data-lat="(-?[\d.]+)" data-lon="(-?[\d.]+)"/.exec(acts);
          return {pos: true, approx: mono ? [num(mono[1]), num(mono[2])] : null, copy: copy ? [num(copy[1]), num(copy[2])] : null, navigate: ll(pick(/^Navigate/)), streetView: ll(pick(/^Street View/)),
            earth: ll(pick(/^Google Earth/)), fromDepot: ll(pick(/^From /)), fly: fly ? [num(fly[1]), num(fly[2])] : null, svHere: sv ? [num(sv[1]), num(sv[2])] : null,
            sub: (/<span class="sub">— ([^:]{0,120}):/.exec(body) || [])[1] || null}; });
        sf.pinBlock = tryf(() => { const h = pinBlock(a); const master = /Where it is — master plan/.test(h); return {master, dest: dests(h).map(x => ({ll: x.ll, mode: x.mode})), earth: earths(h), note: (/Drive there, Walk to it and Earth go where Navigate goes: ([^<]*)/.exec(h) || [])[1] || null}; });
        sf.spotOf = tryf(() => { const v = spotOf(a); return v ? {ll: [v.lat, v.lon], words: String(v.words || '').slice(0, 160)} : null; });
        sf.ldGo751 = tryf(() => { const x = ldGoTarget751({rows: [{a}]}); return x && x.t && x.t.ll ? [x.t.ll.lat, x.t.ll.lon] : null; });
        sf.dayPinCell = tryf(() => dests(dayPinCell(a)).map(x => x.ll));
        r.sf = sf;
        return r;
      });
      const D001 = DATA.sheets.find(x => x.key === 'D001');
      const v1 = SYNC.backend && SYNC.backend.readVersion821 ? SYNC.backend.readVersion821() : null;
      return {footer: (document.body.innerText.match(/· v9\.\d+/) || [])[0] || null, version_start: v0, version_end: v1, n: rows.length, rows,
        layers_ep: MASTER_LAYERS.filter(x => x.layer === 'ep').map(x => x.label), manifest: DATA.hostedMedia.manifest, media: Object.keys(DATA.media).length,
        sync: {status: SYNC.status, level: SYNC.level, readonly: SYNC.readonly}, sheet: D001 && D001.sheet_id};
    });
    X.counts = s.counts; X.errors = s.errors; X.page = process.env.PAGE; X.mobile = mob;
    fs.writeFileSync(process.env.OUT, JSON.stringify(X));
    console.log('rows', X.n, 'footer', X.footer, 'record', X.version_start, '->', X.version_end, 'counts', JSON.stringify(s.counts), 'errors', s.errors.length);
  } finally { if (s) await s.browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
