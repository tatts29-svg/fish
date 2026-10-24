// Author: Andrew Fisher. Renders fencing_crew_print.html to an A4 PDF (and page previews). Local file only; no network.
const {chromium} = require('playwright');
const path = require('path');
(async () => {
 const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 const p = await b.newPage();
 await p.goto('file://' + path.join(__dirname, 'fencing_crew_print.html'), {waitUntil: 'load'});
 await p.evaluate(() => document.fonts.ready);
 await p.waitForTimeout(500);
 await p.pdf({path: path.join(__dirname, 'GC500_2026_fencing_crew_what_you_built.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true});
 await b.close();
 console.log('pdf written');
})().catch(e => { console.error(e); process.exit(1); });
