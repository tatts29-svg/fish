const {open} = require('./lh2');
const PAGE = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/GC500_Delivery_Control_hosted_v695solo.html';
(async () => { const s = await open({pageFile: PAGE, hash: '#day/2026-09-28', gl: false, W: 1280, H: 900}); const p = s.page;
  await p.waitForTimeout(12000);
  await p.evaluate(() => { window.print = () => { window.__printed = true; }; document.querySelector('[data-print-prestart="2026-09-28"]').click(); });
  await p.waitForFunction(() => window.__printed, null, {timeout: 20000});
  await p.emulateMedia({media: 'print'});
  await p.pdf({path: '/home/user/fish/03_GC500_Delivery_Control/v6.95_prestart_prefilled_automatically_DRAFT_awaiting_approval/Prestart_Mon_28_Sep_2026_prefilled_SAMPLE.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true});
  console.log('pdf ok', s.errors); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
