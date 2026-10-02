// Cross-tab repeat checker (Andrew, 2 Oct 2026: "ensure we are not doubling up on showing data. Every section needs a
// importance"). Opens every tab of a build, opens every fold, splits each tab into its sections (cards, plates, notices,
// panels) and lists every figure that shows in more than one section - on the same tab or on another. Read only.
//
//   PAGE=build/GC500_vX/GC500_Delivery_Control_hosted.html [OUT=report.json] node harness/repeat_check.js
//
// Figures counted: dollar amounts of $1,000 or more, metres of 100 m or more, and "N of M" counts with M of 10 or more -
// the figures a person reads as facts. Small counts, percentages and dates repeat for good reasons and are not counted.
// KEPT lists the repeats Andrew has decided to keep; anything else is reported as a repeat to resolve.
const {open} = require('./open_page');
const fs = require('fs');
const TABS = (process.env.TABS || 'today,timeline,plant,docs,fencing,costs,prestarts,runsheet,questions,coatesway').split(',');
const KEPT = [{fact: /^\$[\d,]+$/, sections: [/^today · Fencing$/, /^today · Fencing \(By group\)$/], why: 'Andrew, 2 Oct 2026: Today\'s Fencing card stays whole'}];
(async () => {
  const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 4000));
  const all = [];
  for (const tab of TABS) {
    await p.evaluate(t => go(t), tab); await new Promise(r => setTimeout(r, tab === 'map' ? 6000 : 3500));
    const got = await p.evaluate(tab => {
      const pane = document.getElementById('pane-' + tab); if (!pane) return {tab, sections: []};
      pane.querySelectorAll('details').forEach(d => { d.open = true; });
      try { if (typeof PLANT_REST !== 'undefined' && PLANT_REST.flush) PLANT_REST.flush(); } catch (e) {}
      const SEL = '.card, .grp, .mcard, .notice, .wz1, .wz2, .wz3, .island, .out, details.fold95, details.fold96, details.pfold, details.sfold, table';
      /* a section is named by its heading: the first line of its own text that is not a 'press to open' label or a bare figure */
      const firstLine = el => (el.innerText || '').split('\n').map(x => x.trim()).find(x => x && !/^Open\b/.test(x) && !/^[\d$%.,\s·×\-—]+$/.test(x) && x.length > 2) || '';
      const name = el => {
        if (el.tagName === 'TABLE') { const host = el.parentElement && el.parentElement.closest('.card, .grp, .notice, details, .out'); return (host ? firstLine(host) : 'table').slice(0, 48) + ' (table)'; }
        let n = firstLine(el).replace(/\s+/g, ' ').slice(0, 48);
        if (el.closest('#pane-progress .groups')) n += el.closest('.branches') ? ' (By branch)' : ' (By group)';
        if (el.closest('#pane-progress .money-grid')) n += ' (Money)';
        return n; };
      const own = new Map();
      const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) { const t = node.textContent; if (!t || !t.trim()) continue;
        const el = node.parentElement; if (!el || el.closest('script,style,svg,select,option')) continue;
        if (!el.getClientRects().length) continue; /* only what shows: a card the screen hides is not a repeat a person sees */
        if (el.closest('details.sfold:not(.pdetail) > .sfoldbody, .story')) continue; /* the More info explanations are prose, not figures on show */
        const sec = el.closest(SEL) || pane; if (!pane.contains(sec)) continue;
        own.set(sec, (own.get(sec) || '') + ' ' + t); }
      const sections = [];
      own.forEach((text, sec) => {
        const T = text.replace(/\s+/g, ' ');
        const facts = new Set();
        (T.match(/\$\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?/g) || []).forEach(f => facts.add(f.replace(/\s/g, '').replace(/\.\d+$/, '')));
        (T.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?m\b/g) || []).forEach(f => { const v = parseFloat(f.replace(/,/g, '')); if (v >= 100) facts.add(f.replace(/\s/g, ' ').replace(/\s?m$/, ' m')); });
        (T.match(/\b\d[\d,]*\s+of\s+\d[\d,]*\b/g) || []).forEach(f => { const m = f.match(/of\s+([\d,]+)/); if (m && parseInt(m[1].replace(/,/g, ''), 10) >= 10) facts.add(f.replace(/\s+/g, ' ')); });
        if (facts.size) sections.push({tab, section: sec === pane ? '(page text)' : name(sec), facts: [...facts]});
      });
      const heads = [...pane.querySelectorAll('h2, h3, summary b')].filter(h => h.getClientRects().length).map(h => h.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)).filter(Boolean);
      return {tab, sections, heads: [...new Set(heads)].slice(0, 80)};
    }, tab);
    all.push(got);
  }
  // facts in more than one section
  const where = new Map();
  all.forEach(t => t.sections.forEach(sec => sec.facts.forEach(f => { const k = f; if (!where.has(k)) where.set(k, []); where.get(k).push(sec.tab + ' · ' + sec.section); })));
  const repeats = [...where.entries()].map(([fact, list]) => ({fact, places: [...new Set(list)]})).filter(r => r.places.length > 1)
    .map(r => { const kept = KEPT.find(k => k.fact.test(r.fact) && r.places.length === k.sections.length && r.places.every(pl => k.sections.some(re => re.test(pl))));
      const tabs = [...new Set(r.places.map(pl => pl.split(' · ')[0]))];
      return Object.assign(r, {scope: tabs.length > 1 ? 'across tabs' : 'same tab', kept: kept ? kept.why : null}); })
    .sort((a, b) => (a.scope === b.scope ? b.places.length - a.places.length : a.scope === 'across tabs' ? -1 : 1));
  const out = {page: process.env.PAGE, at: new Date().toISOString(), tabs: all.map(t => ({tab: t.tab, sections: t.sections.length, heads: t.heads})),
    repeats, unresolved: repeats.filter(r => !r.kept).length, errors: s.errors.slice(0, 5)};
  const pairs = new Map(); repeats.filter(r => !r.kept).forEach(r => { const pl = r.places.filter(x => !/\(page text\)/.test(x)).sort();
    for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) { const k = pl[i] + '  <->  ' + pl[j]; if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(r.fact); } });
  out.pairs = [...pairs.entries()].map(([k, f]) => ({pair: k, shared: f.length, examples: f.slice(0, 6)})).sort((a, b) => b.shared - a.shared);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  console.log(`repeats: ${repeats.length} (${out.unresolved} to resolve) · across tabs ${repeats.filter(r => r.scope === 'across tabs').length} · same tab ${repeats.filter(r => r.scope === 'same tab').length} · page errors ${s.errors.length}`);
  console.log('\nSECTIONS THAT SHARE FIGURES (most first):'); out.pairs.slice(0, 60).forEach(x => console.log(String(x.shared).padStart(4) + '  ' + x.pair + '   e.g. ' + x.examples.join(', ')));
  console.log('\nEVERY REPEATED FIGURE:');
  repeats.slice(0, 200).forEach(r => console.log(`${r.kept ? 'KEPT ' : ''}${r.scope.padEnd(11)} ${r.fact.padEnd(14)} ${r.places.join('  |  ')}`));
  await s.browser.close();
})();
