/* v10.37: ten week-1 agreements link to their CON WK1 rows through the v9.58 catalogue (one exact docket, its photo's hash, the
   programme file, one unchanged programme row), 36611 is confirmed Event and 36613 pending in the CCB review. Read-only.
   Author: Andrew Fisher.   PAGE=build/GC500_v10.37/GC500_Delivery_Control_hosted.html node v10.37_week1_programme_links_DRAFT/tests/test_links1037.cjs */
const path = require('path');
const {open} = require(path.resolve(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
const results = []; const check = (name, ok, note) => { results.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : '')); };
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#fencing', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
  await p.waitForFunction(() => { try { return photoIndex().state === 'ready'; } catch (e) { return false; } }, null, {timeout: 120000}).catch(() => {});
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => holdAssets(() => {
    const docs = allDockets(); const reviews = fenceProgrammeReviews958(docs);
    const week1 = reviews.filter(x => Number(x.row.docket_no) >= 36601 && Number(x.row.docket_no) <= 36616).map(x => ({no: x.row.docket_no, state: x.state, reason: x.reason.slice(0, 90), row: x.row.programme.row, also: (x.row.also_rows || []).map(a => a.row)}));
    const older = reviews.filter(x => Number(x.row.docket_no) < 36601).map(x => x.row.docket_no + ':' + x.state + (x.state === 'matched' ? '' : ' (' + x.reason.slice(0, 80) + ')'));
    const ccb = ['36611', '36613', '36603'].map(no => { const d = docs.find(x => String(x.docket_no) === no); const c = d ? fenceCcbReview847(d) : null; return {no, state: c && c.state, reviewState: c && c.reviewState, currentType: c && c.currentType, confirmedType: c && c.confirmedType}; });
    const d11 = docs.find(x => String(x.docket_no) === '36611'); const cost11 = d11 ? costDocket(d11) : null;
    let detail = ''; try { detail = fenceProgrammeDetail958(docs.find(x => String(x.docket_no) === '36603')); } catch (e) { detail = 'ERROR ' + e.message; }
    const footer = (document.body.innerText.match(/· v10\.\d\d/g) || []).slice(-1)[0];
    return {week1, older, ccb, cost11: cost11 && {charge: cost11.cost_total, paid: cost11.paid_total}, detailLen: detail.length, detailOk: /row 16/i.test(detail) || /CON WK1/.test(detail), photos: photoIndex().state, footer};
  }));
  check('footer v10.37', r.footer === '· v10.37', r.footer);
  check('photo index ready (the links need the photos\' hashes)', r.photos === 'ready', r.photos);
  check('ten week-1 agreements in the catalogue', r.week1.length === 10, r.week1.map(x => x.no).join(','));
  check('every week-1 link is matched', r.week1.every(x => x.state === 'matched'), r.week1.filter(x => x.state !== 'matched').map(x => x.no + ': ' + x.reason).join(' | ') || 'all matched');
  check('the eight week-2 links are matched (36592 reads again now its 137.5 m duplicate is set aside)', r.older.length === 8 && r.older.every(x => /:matched$/.test(x)), r.older.join(' | '));
  check('36611 is confirmed Event by the review and booked to the event line', r.ccb[0].state === 'confirmed' && r.ccb[0].reviewState === 'current' && r.ccb[0].confirmedType === 'ccb_event' && r.ccb[0].currentType === 'ccb_event', JSON.stringify(r.ccb[0]));
  check('36613 is pending in the review', r.ccb[1].state === 'pending' && r.ccb[1].reviewState === 'current' && r.ccb[1].currentType === 'ccb_demarc', JSON.stringify(r.ccb[1]));
  check('36611 charged at the event rate', r.cost11 && Math.abs(r.cost11.charge - 3642.82) < 0.01, JSON.stringify(r.cost11));
  check('the docket detail renders the task link', r.detailOk, 'detail ' + r.detailLen + ' chars');
  await s.browser.close();
  const bad = results.filter(x => !x.ok).length; console.log(bad ? 'FAILED ' + bad + ' of ' + results.length : 'ALL ' + results.length + ' PASSED'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERROR', e); process.exit(2); });
