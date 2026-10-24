// Author: Andrew Fisher. Renders showpiece.html (or certificates.html) to PDF with page previews. Local files only; no network.
//   NODE_PATH=/opt/node22/lib/node_modules node render.cjs [certificates.html]
const {chromium} = require('playwright');
const path = require('path');
const SRC = process.argv[2] || 'showpiece.html';
const CERT = /certificates/.test(SRC);
const OUT = CERT ? 'GC500_2026_fencing_crew_certificates.pdf' : 'GC500_2026_fencing_crew_what_you_built.pdf';
const PREV = CERT ? 'cert-' : 'page-';
(async () => {
 const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined});
 const p = await b.newPage({viewport: CERT ? {width: 1123, height: 794} : {width: 794, height: 1123}, deviceScaleFactor: 2});
 await p.goto('file://' + path.join(__dirname, SRC), {waitUntil: 'load'});
 await p.evaluate(() => document.fonts.ready);
 await p.evaluate(() => window.fitNames && window.fitNames());
 await p.waitForTimeout(800);
 await p.pdf({path: path.join(__dirname, OUT), printBackground: true, preferCSSPageSize: true});
 const pages = await p.$$(CERT ? 'section.cert' : 'section.pg');
 for (let i = 0; i < pages.length; i++) await pages[i].screenshot({path: path.join(__dirname, PREV + (i + 1) + '.png')});
 await b.close();
 console.log(OUT + ' written, ' + pages.length + ' pages');
})().catch(e => { console.error(e); process.exit(1); });
