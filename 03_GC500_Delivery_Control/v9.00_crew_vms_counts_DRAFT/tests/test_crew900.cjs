// Author: Andrew Fisher. v9.00 part A - the fencing crew, one name added. Opens the built page at the live address, reading the
// live record (every write is aborted), and checks: the fencing group holds nine people with the new name last and the sheet's
// eight before it in the base page's order; the install team is unchanged and the name is in no Coates group; nothing else in
// DATA.team changed against the base page (the person and the two notes only, and the notes keep their old words); the team
// page (About), the showcase's "Meet the fencing crew" card, "The work behind it", the Coates Way People pillar and Today's
// "Who to call" each show or count the crew once and right; no count says eight for the crew where nine is now right; the
// crew's cards sit in full, even rows on a laptop and one column on a phone; the pre-start contacts, the install scene and
// the org chart do not carry the name; no errors; no writes.
// The new name is read from the private input (V900_TEAM, bound by SHA-256) and is never written to this file or the log.
//   V900_TEAM=<private input> PAGE=<build> [BASE=<base page; default base_live.html beside PAGE>] [MOB=1] [W=1440 H=900]
//   node v9.00_crew_vms_counts_DRAFT/tests/test_crew900.cjs
const fs = require('fs'), path = require('path'), crypto = require('crypto'), {open} = require('../../toolchain/harness/open_page');
const TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a';
const raw = fs.readFileSync(process.env.V900_TEAM || '');
if (crypto.createHash('sha256').update(raw).digest('hex') !== TEAM_SHA) { console.error('V900_TEAM: checksum mismatch'); process.exit(2); }
const IN = JSON.parse(raw.toString('utf8')), NAME = IN.person.name;
const hide = v => JSON.parse(JSON.stringify(v === undefined ? null : v).split(NAME).join('[the new name]'));
const dataOf = file => { const s = fs.readFileSync(file, 'utf8').replace(/^﻿/, ''); const i = s.indexOf('const DATA = '), j = s.indexOf('\n', i); return JSON.parse(s.slice(i + 13, j - 1)); };
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE), 'base_live.html');
const B = dataOf(BASE).team;
(async () => { let s; try {
 const mob = !!process.env.MOB, W = mob ? 390 : Number(process.env.W || 1440), H = mob ? 844 : Number(process.env.H || 900);
 s = await open({pageFile: PAGE, W, H, mobile: mob, dpr: mob ? 2 : 1}); const p = s.page, R = [];
 const ok = (n, v, d) => R.push({name: n, pass: !!v, detail: d === undefined ? undefined : hide(d)});
 const cons = []; p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) cons.push(m.text().slice(0, 160)); });
 await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof TEAM === 'object', null, {timeout: 180000});
 await p.waitForTimeout(1500);
 const clean = t => String(t || '').replace(/\s+/g, ' ').trim();
 const EIGHT = /\b(8|eight)\s+(names|people|fencers|cards|on the crew|in the crew|Advanced Temporary Fencing)\b/i;

 /* 1. DATA.team: nine in the fencing group, the new name last, the sheet's eight before it as in the base */
 const N = await p.evaluate(() => JSON.parse(JSON.stringify(DATA.team)));
 const fenB = B.people.filter(x => x.group === 'fencing'), fenN = N.people.filter(x => x.group === 'fencing');
 ok('the fencing group holds 9 people (8 in the base)', fenB.length === 8 && fenN.length === 9, {base: fenB.length, now: fenN.length});
 ok('the new name is last in the fencing group, and the sheet\'s eight keep their order', fenN[8].name === NAME && JSON.stringify(fenN.slice(0, 8)) === JSON.stringify(fenB));
 const NP = N.people.find(x => x.name === NAME), IP = Object.fromEntries(Object.keys(B.people[0]).map(k => [k, IN.person[k]]));
 ok('the person is the input\'s, with exactly the keys every other person has, in their order, and nothing filled in',
  NP && JSON.stringify(NP) === JSON.stringify(IP) && N.people.every(x => JSON.stringify(Object.keys(x)) === JSON.stringify(Object.keys(B.people[0])))
  && ['title', 'lead', 'location', 'reports_to', 'phone', 'mobile', 'email'].every(k => NP[k] === null) && NP.event_role === 'Fencing crew' && NP.company === 'Advanced Temporary Fencing');
 const at = N.people.findIndex(x => x.name === NAME), lastFenB = B.people.map(x => x.group).lastIndexOf('fencing');
 ok('it sits straight after the last fencing person, and every other person is the base\'s, in the base\'s order',
  at === lastFenB + 1 && JSON.stringify(N.people.filter(x => x.name !== NAME)) === JSON.stringify(B.people), {at, lastFenB});
 ok('the name is in DATA.team once, in the fencing group only', N.people.filter(x => x.name === NAME).length === 1 && NP.group === 'fencing'
  && JSON.stringify(N).split(NAME).length - 1 === 1);
 ok('the install team is unchanged (' + B.people.filter(x => x.group === 'install').length + ' people)', JSON.stringify(N.people.filter(x => x.group === 'install')) === JSON.stringify(B.people.filter(x => x.group === 'install')));
 const coatesKeys = B.groups.filter(g => g.coates !== false && g.key !== 'other').map(g => g.key);
 ok('no Coates group (' + coatesKeys.join(', ') + ') changed or gained anyone', coatesKeys.every(k => JSON.stringify(N.people.filter(x => x.group === k)) === JSON.stringify(B.people.filter(x => x.group === k))));

 /* 2. nothing else in DATA.team changed: keys, stated_by/on, addresses, authority, every other group; the notes keep their words */
 ok('DATA.team keeps its keys in order, and stated_by, stated_on, addresses and authority are the base\'s',
  JSON.stringify(Object.keys(N)) === JSON.stringify(Object.keys(B)) && ['stated_by', 'stated_on', 'addresses', 'authority'].every(k => JSON.stringify(N[k]) === JSON.stringify(B[k])));
 const gB = B.groups.find(g => g.key === 'fencing'), gN = N.groups.find(g => g.key === 'fencing');
 ok('every group is the base\'s, apart from the fencing group\'s note', JSON.stringify(N.groups.filter(g => g.key !== 'fencing')) === JSON.stringify(B.groups.filter(g => g.key !== 'fencing'))
  && JSON.stringify(Object.assign({}, gN, {note: null})) === JSON.stringify(Object.assign({}, gB, {note: null})) && JSON.stringify(Object.keys(gN)) === JSON.stringify(Object.keys(gB)));
 /* the notes: the old words stay word for word; one sentence is added to each (and "for the seven" says which seven) */
 const T_ADD = ' One more name was added to the fencing crew by the project manager on 8 Oct 2026; it comes after the sheet’s eight, as Fencing crew with the company, and no other role, title, number or email was given, so none is written.';
 const tAt = B.note.indexOf('The eight names and the company are as the sheet reads'), tEnd = B.note.indexOf('so none is written.', tAt) + 'so none is written.'.length;
 ok('DATA.team.note keeps every word it had and adds, after the sheet\'s sentence, that one more name was added by the project manager on 8 Oct 2026',
  tAt > 0 && N.note === B.note.slice(0, tEnd) + T_ADD + B.note.slice(tEnd) && !N.note.includes(NAME));
 const G_ADD = ' Nine names since 8 Oct 2026: the sheet’s eight, in its order, and one added by the project manager on 8 Oct 2026, listed last, as Fencing crew with the company — no other role, title, number or email was given, so none is written.';
 ok('the fencing group\'s note now says nine: the sheet\'s eight, in its order, and one added by the project manager on 8 Oct 2026, last',
  B.note !== N.note && gB.note.split('for the seven;').length === 2 && gN.note === gB.note.replace('for the seven;', 'for the other seven on the sheet;') + G_ADD && !gN.note.includes(NAME), gN.note);

 /* 3. the team page (About): the fencing group lists nine, the new name last and once; no other group carries it */
 await p.evaluate(() => go('about')); await p.waitForTimeout(700);
 const A = await p.evaluate(NAME => { const card = document.querySelector('#pane-about .teamcard'); if (!card) return null;
  const groups = [...card.querySelectorAll('.tm-group')].map(g => ({label: g.querySelector('.sect').childNodes[0].textContent.trim(), names: [...g.querySelectorAll('.tm-person .tm-who > b')].map(b => b.textContent.trim()), text: g.textContent.replace(/\s+/g, ' ')}));
  const pane = document.getElementById('pane-about').innerText;
  const me = [...card.querySelectorAll('.tm-person')].find(li => li.querySelector('.tm-who > b').textContent.trim() === NAME);
  return {groups, count: pane.split(NAME).length - 1, me: me ? me.innerText.replace(/\s+/g, ' ').trim() : null, links: me ? [...me.querySelectorAll('a')].map(a => a.getAttribute('href')) : null};
 }, NAME);
 const aF = A && A.groups.find(g => g.label === gB.label);
 ok('About: "' + gB.label + '" lists 9, the new name last', aF && aF.names.length === 9 && aF.names[8] === NAME && JSON.stringify(aF.names.slice(0, 8)) === JSON.stringify(fenB.map(x => x.name)), A && A.groups.map(g => [g.label, g.names.length]));
 ok('About: the name shows once on the page, and in no other group', A && A.count === 1 && A.groups.filter(g => g.names.includes(NAME)).length === 1);
 ok('About: the card says Fencing crew and the company, "no number available", and carries no call or email link', A && /Fencing crew/.test(A.me) && /Advanced Temporary Fencing/.test(A.me) && /no number available/.test(A.me) && A.links.length === 0, A && A.me);
 ok('About: no count says eight for the crew', A && !A.groups.some(g => EIGHT.test(g.text)));

 /* 4. Today's "Who to call": its count is the whole team; the list is site, transport and install only, so the name is not on it */
 await p.evaluate(() => go('today')); await p.waitForTimeout(1200);
 const T = await p.evaluate(NAME => { const h = document.querySelector('#pane-today .teamhub'); return h ? {chip: h.querySelector('.hubtitle .chip').textContent.trim(), names: [...h.querySelectorAll('.tm-who > b')].map(b => b.textContent.trim()), has: h.textContent.includes(NAME)} : null; }, NAME);
 ok(T ? 'Today: "Who to call" counts ' + N.people.length + ' on the team and does not list the fencing crew' : 'Today: there is no "Who to call" card on this build (nothing to count)',
  !T || (T.chip === N.people.length + ' on the team' && !T.has && T.names.length === B.people.filter(x => ['site', 'transport', 'install'].includes(x.group)).length), T);

 /* 5. the Coates Way People pillar: contacts on the record count the crew as nine and the Coates people as before */
 await p.evaluate(() => go('coatesway')); await p.waitForTimeout(900);
 const C = await p.evaluate(() => { const r = [...document.querySelectorAll('#pane-coatesway .cwpt tr')].find(tr => /Contacts on the record/.test(tr.textContent)); return r ? r.cells[1].textContent.replace(/\s+/g, ' ').trim() : null; });
 const coatesB = B.people.length - fenB.length - B.people.filter(x => x.group === 'other').length, otherB = B.people.filter(x => x.group === 'other').length;
 ok('Coates Way: "Contacts on the record" reads ' + N.people.length + ' — ' + coatesB + ' Coates, 9 Advanced Temporary Fencing', C === `${N.people.length} — ${coatesB} Coates, 9 Advanced Temporary Fencing${otherB ? `, ${otherB} other` : ''}`, C);

 /* 6. pre-start contacts carry the site, install and office people with a number - not the fencing crew */
 const PS = await p.evaluate(NAME => ['drv', 'ins'].map(d => { try { return dpContacts(d).includes(NAME); } catch (e) { return 'error ' + e.message; } }), NAME);
 ok('pre-start contacts (driver and install sheets) do not carry the name', PS.every(x => x === false), PS);

 /* 7. the showcase: the fencing crew's own card, the work behind it, the install team, the org chart */
 await p.evaluate(() => { go('today'); showOpen(); }); await p.waitForTimeout(4200);
 /* the showcase opens on the car, with the figures hidden behind it (.show.car-focus .shscene); a viewer presses the page's own
    "Show figures" button to see the scenes - it sets a preference in this browser only and writes nothing to the record */
 const focus = await p.evaluate(() => { const show = document.getElementById('showcase'), b = document.getElementById('showCarFocus');
  const was = show.classList.contains('car-focus'); if (was && b && !b.hidden) b.click(); return {was, now: show.classList.contains('car-focus')}; });
 ok('showcase: the figures are on show (car focus ' + (focus.was ? 'turned off with the page\'s own "Show figures" button' : 'was off') + ')', !focus.now, focus);
 const scene = async key => { await p.evaluate(key => { SHOW.playing = false; clearTimeout(SHOW.timer); SHOW.i = SHOW_ORDER.indexOf(key); showRender(); clearTimeout(SHOW.timer); }, key);
  await p.waitForTimeout(900);   /* the scene's type unit and fonts settle; then the page's own fitter runs, as a resize would */
  return p.evaluate(([key, NAME]) => { clearTimeout(SHOW.timer); showFit();
  const body = document.getElementById('showBody'), wrap = body.querySelector('.shwrap'), ul = body.querySelector('.shcards');
  const lis = ul ? [...ul.children] : [], tops = [...new Set(lis.map(li => Math.round(li.getBoundingClientRect().top)))];
  const perRow = tops.map(t => lis.filter(li => Math.round(li.getBoundingClientRect().top) === t).length);
  return {title: document.getElementById('showChapter').textContent, key: SHOW_ORDER[SHOW.i], visible: getComputedStyle(body).visibility, text: body.innerText.replace(/\s+/g, ' ').trim(), names: lis.map(li => (li.querySelector('.shpn') || {}).textContent),
   cls: ul ? ul.className : null, cols: ul ? getComputedStyle(ul).gridTemplateColumns.split(' ').length : 0, perRow, zoom: SHOW.zoom,
   overX: wrap.scrollWidth > wrap.clientWidth + 1, overY: body.scrollHeight > body.clientHeight + 1, has: body.innerText.split(NAME).length - 1};
 }, [key, NAME]); };
 const F = await scene('fencing');
 ok('showcase "' + F.title + '": 9 cards, the sheet\'s eight then the new name, once', F.names.length === 9 && F.names[8] === NAME && JSON.stringify(F.names.slice(0, 8)) === JSON.stringify(fenB.map(x => x.name)) && F.has === 1, F.names.length);
 ok('showcase fine print: "9 names from the project record: 8 as the crew’s sign-on sheet reads, in its order, and 1 added by the project manager on 8 Oct 2026"',
  /\b9 names from the project record: 8 as the crew’s sign-on sheet reads, in its order, and 1 added by the project manager on 8 Oct 2026, after them\./.test(F.text) && /none was given for the name added, so none are shown/.test(F.text) && !EIGHT.test(F.text), F.text.slice(-420));
 ok(mob ? 'phone: the crew\'s cards stack one to a row (' + F.perRow.length + ' rows), as the stylesheet sets for a phone' : 'laptop: the crew\'s cards sit in full, even rows — ' + F.cols + ' across, rows of ' + F.perRow.join(', ') + ' (zoom ' + F.zoom + ')',
  mob ? F.cols === 1 && F.perRow.every(n => n === 1) : F.cols === 3 && F.perRow.length === 3 && F.perRow.every(n => n === 3) && !F.overX && !F.overY && F.cls === 'shcards crewfence', F);
 const E = await scene('effort'); const inst = B.people.filter(x => x.group === 'install').length;
 ok('showcase "' + E.title + '": ' + (inst + 9) + ' people across the two crews — ' + inst + ' installers, 9 Advanced Temporary Fencing',
  /* the big figure and its words sit in one line with no space between them in the page's text ("13people ...") */
  new RegExp('\\b' + (inst + 9) + '\\s*people across the two crews\\b').test(E.text) && new RegExp('Installers\\s*' + inst + '\\b').test(E.text) && /Advanced Temporary Fencing\s*9\b/.test(E.text) && !EIGHT.test(E.text), E.text.slice(0, 300));
 const I = await scene('crew');
 ok('showcase "' + I.title + '": the install team\'s ' + inst + ' cards, without the name', I.names.length === inst && I.has === 0 && JSON.stringify(I.names) === JSON.stringify(B.people.filter(x => x.group === 'install').map(x => x.name)), I.names.length);
 const L = await scene('lead');
 ok('showcase "' + L.title + '": the org chart (Coates only) does not carry the name', L.has === 0);
 await p.evaluate(() => { try { showClose(); } catch (e) {} }); await p.waitForTimeout(400);

 /* 8. the whole page: the name shows nowhere it should not; no overflow; no errors; no writes */
 ok('no page-wide horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
 ok('no runtime errors' + (cons.length ? ' (console: ' + cons.length + ')' : ''), s.errors.length === 0 && cons.length === 0, {errors: s.errors, cons});
 ok('no attempted live writes (blocked ' + s.counts.blocked + ')', s.counts.blocked === 0);
 R.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name.split(NAME).join('[the new name]')));
 R.filter(r => !r.pass && r.detail !== undefined).forEach(r => console.log('  detail: ' + JSON.stringify(r.detail).slice(0, 1600)));
 console.log((mob ? 'phone 390' : W + ' px') + ': ' + R.filter(r => r.pass).length + '/' + R.length + ' · live requests ' + s.counts.live + ' · blocked ' + s.counts.blocked);
 if (R.some(r => !r.pass)) process.exitCode = 1;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error(String(e && e.stack || e).split(NAME).join('[the new name]')); process.exitCode = 1; });
