#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | REPORT PAGES - real pages, never snipped
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Turns any report body into PROPER PAGES, the same framed look as the
#  Cost Tracking Snapshot: white A4 sheet, dark Coates panel with the
#  orange top bar, header on every page, "Page X of N", footer on the
#  last page. The rules, per Andrew (24 Jul 2026):
#
#    - Everything fits neatly on a page; what doesn't fit moves WHOLE
#      to the next page. No page ever starts with the tail end of
#      something from the previous page.
#    - Long tables split at ROW boundaries only, and every continuation
#      page repeats the table header - a row is never cut in half.
#    - A section heading is never left stranded at the bottom of a page
#      - it moves to the next page with its content.
#
#  How: the report body is laid out by the browser itself. A small
#  script runs when the page opens, measures every block, and deals
#  them onto framed sheets. The SAME document then serves everything:
#    - open the .html   -> you see the pages, like the snapshot
#    - print / PDF      -> one sheet per A4 page
#    - open with #page=3 -> shows ONLY page 3 (how the email images
#      are captured - each page photographed whole, never sliced)
# =====================================================================

import json

# page frame geometry in px (1px = 1/96in; exact in Edge headless AND
# print - mm heights render short in some headless modes, so never mm).
PAGE_W = 794      # 210mm
PAGE_H = 1123     # 297mm
PANEL_H = 1055    # sheet minus 34px white margin top+bottom

_PAGE_CSS_T = """
#stage{display:none}
.psheet{width:__PW__px;height:__PH__px;overflow:hidden;margin:0 auto;padding:34px;background:#fff}
.psheet + .psheet{page-break-before:always}
.ppanel{background:#0E1116;box-sizing:border-box;border:6px solid #F26222;border-top:9px solid #F26222;border-radius:18px;padding:20px 26px 16px;height:__PANH__px;overflow:hidden;display:flex;flex-direction:column;position:relative}
.pcontent{flex:1 1 auto;min-height:0;overflow:hidden}
.prule{height:2px;background:linear-gradient(90deg,#F26222,#EFFF3D,transparent);margin:12px 0 4px;flex:none}
.band{flex:none;border-bottom:0}
.bandc{display:flex;justify-content:space-between;align-items:flex-start;flex:none;padding:2px 2px 0}
.bandc .k{color:#F26222;font-weight:bold;letter-spacing:2px;font-size:9pt;text-transform:uppercase}
.bandc h1{font-size:14pt;color:#fff;margin:3px 0 0;border:0;padding:0}
.bandc .m{text-align:right;color:#A9B1BD;font-size:8.5pt;line-height:1.7;text-transform:uppercase}
.bandc .m .siq{color:#F26222;font-weight:800;letter-spacing:1px;font-size:9pt}
.bandc .m b{color:#fff}
.pcontent > h2:first-child{margin-top:8px}
.pcontent .footer{margin-top:14px}
.pteam{flex:none;border-top:1px solid #2A313C;margin-top:8px;padding-top:7px}
.pteam .tl{color:#F26222;font-size:7pt;font-weight:800;letter-spacing:2px;text-transform:uppercase}
.pteam .tn{color:#A9B1BD;font-size:7.5pt;line-height:1.55;margin-top:2px}
.pteam .tn b{color:#E6E9EE}
@media print{body{background:#fff}.psheet{margin:0}}
@page{size:A4;margin:0}
"""

# ---------------------------------------------------------------------
#  EXECUTIVE LIGHT THEME - 26 Jul 2026
#  White pages, crisp black ink, every bright Coates colour kept as an
#  accent instead of fighting a dark background. The orange rounded
#  page border stays exactly where it was; the charcoal header and
#  footer bands stay as the letterhead; each section heading becomes a
#  rounded, orange-edged card so a new section (a new person, a new
#  company) is visibly a fresh start. Print and email captures come out
#  sharper on white - dark pages were where the blur lived.
#  Set EXEC_LIGHT = False to put the dark look back everywhere at once.
# ---------------------------------------------------------------------
EXEC_LIGHT = True

LIGHT_CSS = """
html,body{background:#fff}
body{color:#20242B}
.page{background:#fff}
.ppanel{background:#fff}
.bandc h1{color:#14181F}
.bandc .m{color:#6B7380}
.bandc .m b{color:#14181F}
h2{color:#14181F;background:#F6F7F9;border:1px solid #E3E6EB;
   border-left:5px solid #F26222;border-radius:9px;padding:7px 12px;
   margin:18px 0 10px}
table.tiles td{background:#F9FAFB;color:#14181F;border:1px solid #E3E6EB}
table.tiles .v{color:#14181F}
table.tiles .l{color:#5B6472}
table.tiles td.tg{background:#E8F6EC;border:1px solid #3FB950}
table.tiles td.tg .v{color:#0C6B2D}
table.tiles td.ta{background:#FFF4D6;border:1px solid #F2B01E}
table.tiles td.ta .v{color:#7A5A00}
table.tiles td.tr{background:#FBE3DF;border:1px solid #F85149}
table.tiles td.tr .v{color:#A02A16}
table.data td{color:#262C35;border-bottom:1px solid #E7EAEF;background:#fff}
table.data tr:nth-child(even) td{background:#F6F8FA}
table.aging td{color:#262C35;border:1px solid #DFE3E9;background:#fff}
table.aging th{border:1px solid #14181F}
.g{background:#DCF3E3;color:#0C6B2D}
.a{background:#FFF0C2;color:#7A5A00}
.r{background:#FBDDD7;color:#A02A16}
.note,.limits{color:#5B6472}
.limits{border-top:1px solid #E3E6EB}
.intro{background:#FFF3EC;color:#33393F}
.intro b{color:#E04E00}
.hb .hl{color:#5B6472}
.hb .ht{background:#EDF0F4}
.hb .hv{color:#14181F}
.pteam{border-top:1px solid #E3E6EB}
.pteam .tn{color:#5B6472}
.pteam .tn b{color:#20242B}
"""


def page_css(w=PAGE_W, h=PAGE_H, panel_h=PANEL_H):
    """The sheet/panel frame CSS at any page size (the plant dashboard
    uses wider 1000x1414 pages; reports use A4 794x1123)."""
    return (_PAGE_CSS_T.replace("__PW__", str(w)).replace("__PH__", str(h))
            .replace("__PANH__", str(panel_h)))


PAGE_CSS = page_css()

# The paginator. Plain ES5-friendly JavaScript, runs once on load inside
# Edge/Chrome (including headless). Blocks are dealt onto sheets; tables
# split by whole rows with the header repeated; headings keep with their
# content; footer rides on the last page (or its own if it can't fit).
PAGINATE_JS = r"""
(function(){
  function run(){
    var stage = document.getElementById('stage');
    var out = document.getElementById('sheets');
    if (!stage || !out) return;
    var sheets = [];
    var cur = null;

    function mkSheet(first){
      var sheet = document.createElement('div'); sheet.className = 'psheet';
      var panel = document.createElement('div'); panel.className = 'ppanel';
      panel.innerHTML = (first ? PAGES_HDR1 : PAGES_HDRN) + "<div class='prule'></div>";
      var content = document.createElement('div'); content.className = 'pcontent';
      panel.appendChild(content);
      // Meet the team on EVERY page, not just the last one
      // (A. Fisher, 25 Jul 2026). The panel is a flex column and
      // .pcontent is flex:1, so the strip takes its height off the
      // content area automatically - nothing can be pushed off.
      if (typeof PAGES_TEAM === 'string' && PAGES_TEAM){
        var tm = document.createElement('div');
        tm.className = 'pteam'; tm.innerHTML = PAGES_TEAM;
        panel.appendChild(tm);
      }
      sheet.appendChild(panel);
      out.appendChild(sheet);
      cur = {sheet: sheet, panel: panel, content: content};
      sheets.push(cur);
      return cur;
    }
    function overflows(){
      return cur.content.scrollHeight > cur.content.clientHeight + 1;
    }
    function place(node){                 // true if node fits on current page
      cur.content.appendChild(node);
      if (!overflows()) return true;
      cur.content.removeChild(node);
      return false;
    }
    function splitTable(t){               // whole rows only, header repeated
      var tb = (t.tBodies && t.tBodies.length) ? t.tBodies[0] : null;
      if (!tb || tb.rows.length < 2){     // nothing to split - force-place
        if (!place(t)){ mkSheet(false); cur.content.appendChild(t); }
        return;
      }
      var rows = [];
      while (tb.rows.length) rows.push(tb.removeChild(tb.rows[0]));
      function shell(){
        var s = t.cloneNode(false);
        if (t.tHead) s.appendChild(t.tHead.cloneNode(true));
        var b = document.createElement('tbody'); s.appendChild(b);
        return {table: s, tbody: b};
      }
      var sh = shell();
      if (!place(sh.table)){ mkSheet(false); cur.content.appendChild(sh.table); }
      var q = rows;                       // queue of rows still to place
      while (q.length){
        var row = q.shift();
        // a row marked pgbrk starts something new (a new company in the
        // demob pack) - it opens a fresh page, per Andrew's page rule
        var rc = '' + (row.className || '');
        if (rc.indexOf('pgbrk') >= 0 && sh.tbody.rows.length){
          mkSheet(false);
          sh = shell(); cur.content.appendChild(sh.table);
        }
        var freshSolo = (sh.tbody.rows.length === 0 &&
                         cur.content.childElementCount === 1);
        sh.tbody.appendChild(row);
        if (overflows()){
          if (freshSolo){
            // a single row taller than a whole fresh page: keep it (the
            // old force behaviour) rather than loop forever - never seen
            // in practice, tables don't carry page-tall rows
            continue;
          }
          sh.tbody.removeChild(row);
          var carry = [row];
          // taking that row out re-flows the column widths - earlier rows
          // can re-wrap TALLER, so re-check this page and peel rows off
          // the end until it truly fits (the 5-11px clip found in the
          // 24 Jul 2026 fleet sweep - nothing is ever cut)
          while (overflows() && sh.tbody.rows.length){
            carry.unshift(sh.tbody.removeChild(
              sh.tbody.rows[sh.tbody.rows.length - 1]));
          }
          if (!sh.tbody.rows.length && sh.table.parentNode)
            sh.table.parentNode.removeChild(sh.table);   // header-only shell: drop
          mkSheet(false);
          sh = shell(); cur.content.appendChild(sh.table);
          q = carry.concat(q);
        }
      }
      if (!sh.tbody.rows.length && sh.table.parentNode)
        sh.table.parentNode.removeChild(sh.table);
    }
    function isHeadish(n){
      // a real heading, or anything the report marked keep-with-next
      // (the coloured section bands on the activity pack)
      if (!n) return false;
      if (/^H[1-4]$/i.test(n.tagName)) return true;
      return ('' + (n.className || '')).indexOf('keepnext') >= 0;
    }
    function probeOf(n){
      // a light stand-in for "the start of this block", used to decide
      // whether a section can BEGIN on the current page. A table only
      // needs its header and a couple of rows to be worth starting.
      if (/^TABLE$/i.test(n.tagName)){
        var s = n.cloneNode(false);
        if (n.tHead) s.appendChild(n.tHead.cloneNode(true));
        var tb = (n.tBodies && n.tBodies.length) ? n.tBodies[0] : null;
        var b = document.createElement('tbody'); s.appendChild(b);
        if (tb) for (var i = 0; i < Math.min(3, tb.rows.length); i++)
          b.appendChild(tb.rows[i].cloneNode(true));
        return s;
      }
      return n.cloneNode(true);
    }
    function placeBlock(b, next, all, idx){
      // 'newpage' always starts a fresh sheet - that is how a hirer's
      // section, or the log book notice, gets a page of its own.
      //
      // A HEADING no longer forces one. It used to, and a report with ten
      // short sections burned ten pages, most of them 90% white - the
      // client packs were running 7% full. Now a section starts here if
      // its heading AND the start of its content fit; only when they
      // don't does it move to a fresh page. Nothing is ever split
      // awkwardly, and the pages actually fill. (A. Fisher, 25 Jul 2026)
      var cn = '' + (b.className || '');
      if (cn.indexOf('newpage') >= 0 && cur.content.childElementCount > 0){
        mkSheet(false);
      } else if (isHeadish(b) && cur.content.childElementCount > 0){
        // `next` may itself be a heading (an H2 followed by its first H3).
        // Probing only that would pass - a 26px heading always fits - and
        // leave the H2 stranded at the foot of the page, which is exactly
        // what it is trying to prevent. So walk forward over any run of
        // headings and probe the first real block, carrying the headings
        // in between. (A. Fisher, 25 Jul 2026)
        cur.content.appendChild(b);
        var ok = !overflows(), probes = [];
        if (ok){
          var j = idx + 1;
          while (j < all.length && isHeadish(all[j])){
            probes.push(all[j].cloneNode(true)); j++;
          }
          if (j < all.length) probes.push(probeOf(all[j]));
          for (var q = 0; q < probes.length; q++)
            cur.content.appendChild(probes[q]);
          ok = !overflows();
          for (var q2 = 0; q2 < probes.length; q2++)
            cur.content.removeChild(probes[q2]);
        }
        cur.content.removeChild(b);
        if (!ok) mkSheet(false);
      }
      if (place(b)) return;
      // heading stranded at the bottom? it travels with its content -
      // UNLESS the heading is alone on its page already (a fresh section
      // page whose first block is bigger than a whole page): then the
      // block splits right here under it, never leaving an empty page
      // behind. (Fixed 24 Jul 2026 - the empty-page bug.)
      var tail = cur.content.lastElementChild;
      // a block marked keepprev (the "End of <person>" sign-off) must
      // never be marooned on a page of its own - bring the block above it
      // along, provided that block is small enough to travel
      if (cn.indexOf('keepprev') >= 0 && tail &&
          tail.offsetHeight < cur.content.clientHeight * 0.5){
        var carryPrev = tail;
        mkSheet(false);
        cur.content.appendChild(carryPrev);
        if (place(b)) return;
      }
      tail = cur.content.lastElementChild;
      var pull = isHeadish(tail) ? tail : null;
      var alone = pull && cur.content.childElementCount === 1;
      if (!alone){
        var prevSheet = cur;
        mkSheet(false);
        if (pull) cur.content.appendChild(pull);
        if (place(b)) return;
        // It will not fit on a FRESH page either, so it is going to be
        // split whichever page it starts on. Splitting it here would
        // leave the page we just walked away from half white - which is
        // exactly what the client sees. So undo the page break, put the
        // heading back where it was, and split the table from there: the
        // page fills, the heading keeps its rows, and the remainder flows
        // on as normal. (A. Fisher, 25 Jul 2026)
        if (/^TABLE$/i.test(b.tagName)){
          if (cur.sheet.parentNode) cur.sheet.parentNode.removeChild(cur.sheet);
          sheets.pop();
          cur = prevSheet;
          if (pull) cur.content.appendChild(pull);
          splitTable(b);
          return;
        }
      }
      // taller than a whole fresh page: split tables by rows; unwrap
      // plain containers; anything else is placed and clipped (rare)
      if (/^TABLE$/i.test(b.tagName)){ splitTable(b); return; }
      if (/^(DIV|SECTION)$/i.test(b.tagName) && b.children.length > 1){
        var kids = []; while (b.firstElementChild) kids.push(b.removeChild(b.firstElementChild));
        for (var i = 0; i < kids.length; i++)
          placeBlock(kids[i], kids[i + 1], kids, i);
        return;
      }
      cur.content.appendChild(b);
    }

    mkSheet(true);
    var blocks = [];
    while (stage.firstElementChild) blocks.push(stage.removeChild(stage.firstElementChild));
    for (var i = 0; i < blocks.length; i++)
      placeBlock(blocks[i], blocks[i + 1], blocks, i);

    // footer rides on the last page - or its own page if it can't fit
    if (typeof PAGES_FOOT === 'string' && PAGES_FOOT){
      var fw = document.createElement('div'); fw.innerHTML = PAGES_FOOT;
      var fnode = fw.firstElementChild;
      if (fnode && !place(fnode)){ mkSheet(false); cur.content.appendChild(fnode); }
    }

    // PULL UP. A sparse page is often just the tail of the section on the
    // page before it - a band, a short table, a sign-off - that got pushed
    // over even though there was room left behind. Hand those blocks back
    // up while they fit. A page that begins a section of its own (a
    // hirer's page, the log book notice) is never merged into the one
    // before it. (A. Fisher, 25 Jul 2026)
    function fillOf0(c){
      var last = null;
      for (var i = 0; i < c.children.length; i++)
        if (c.children[i].offsetHeight > 0) last = c.children[i];
      if (!last) return 0;
      return (last.offsetTop + last.offsetHeight - c.offsetTop) / c.clientHeight;
    }
    function over0(c){ return c.scrollHeight > c.clientHeight + 1; }
    function headish0(n){
      if (!n) return false;
      if (/^H[1-4]$/i.test(n.tagName)) return true;
      return ('' + (n.className || '')).indexOf('keepnext') >= 0;
    }
    function startsSection(c){
      // a page OWNS its section when it opens with a newpage marker, or
      // when its first table leads with a pgbrk row (the demob pack's
      // one-company-per-page rule). Those pages are never merged upward -
      // that is the whole point of them.
      var f = c.firstElementChild;
      if (f && ('' + (f.className || '')).indexOf('newpage') >= 0) return true;
      var t = c.querySelector('table');
      if (t && t.tBodies && t.tBodies.length && t.tBodies[0].rows.length){
        var r0 = t.tBodies[0].rows[0];
        if (('' + (r0.className || '')).indexOf('pgbrk') >= 0) return true;
      }
      return false;
    }
    for (var ui = 1; ui < sheets.length; ui++){
      var uc = sheets[ui].content;
      if (fillOf0(uc) >= 0.45) continue;
      if (startsSection(uc)) continue;
      var up = sheets[ui - 1].content;
      if (!up.childElementCount) continue;
      // All or nothing. Moving half a tail up just leaves a different
      // stray block behind and the passes below fight over it - so take
      // the whole tail or leave it exactly where it is.
      var take = [], k0 = uc.firstElementChild;
      while (k0){
        if (('' + (k0.className || '')).indexOf('newpage') >= 0) break;
        take.push(k0); k0 = k0.nextElementSibling;
      }
      if (!take.length) continue;
      for (var mi = 0; mi < take.length; mi++) up.appendChild(take[mi]);
      if (over0(up)){
        for (var mj = 0; mj < take.length; mj++)
          uc.insertBefore(take[mj], null);
        // put them back in their original order at the top of the page
        for (var mk = take.length - 1; mk >= 0; mk--)
          uc.insertBefore(take[mk], uc.firstChild);
      }
      // never leave a heading behind on the page above with its content
      // stranded below - hand it back if that happened
      var t2 = up.lastElementChild;
      while (t2 && t2.offsetHeight === 0) t2 = t2.previousElementSibling;
      if (t2 && headish0(t2) && uc.childElementCount &&
          up.childElementCount > 1){
        uc.insertBefore(t2, uc.firstChild);
      }
    }

    // FINAL SWEEP - belt and braces on the keep-with-next rule.
    // Whatever route a block took through the layout above, no page is
    // allowed to END on a heading or a section band with its content on
    // the next page: it reads as a broken report. Walk the finished
    // sheets backwards and hand any trailing heading down to the top of
    // the page that follows it. Repeated until nothing moves, so a run of
    // headings travels together. (A. Fisher, 25 Jul 2026)
    for (var pass = 0; pass < 4; pass++){
      var moved = false;
      for (var si = 0; si < sheets.length - 1; si++){
        var here = sheets[si].content, nxt = sheets[si + 1].content;
        var tail = here.lastElementChild;
        while (tail && tail.offsetHeight === 0) tail = tail.previousElementSibling;
        if (!tail || !isHeadish(tail)) continue;
        if (here.childElementCount <= 1) continue;   // never leave it blank
        nxt.insertBefore(tail, nxt.firstChild);
        moved = true;
      }
      if (!moved) break;
    }

    // ...and the mirror: a page must never hold nothing but a one-line
    // sign-off. Pull the block above it down to keep it company.
    for (var sj = sheets.length - 1; sj > 0; sj--){
      var cnt = sheets[sj].content;
      var vis = [];
      for (var ci = 0; ci < cnt.children.length; ci++)
        if (cnt.children[ci].offsetHeight > 0) vis.push(cnt.children[ci]);
      if (vis.length !== 1) continue;
      if (('' + (vis[0].className || '')).indexOf('keepprev') < 0) continue;
      var prev = sheets[sj - 1].content;
      var take = prev.lastElementChild;
      while (take && take.offsetHeight === 0) take = take.previousElementSibling;
      if (!take || prev.childElementCount <= 1) continue;
      if (take.offsetHeight > cnt.clientHeight * 0.6) continue;
      cnt.insertBefore(take, cnt.firstChild);
    }

    // REBALANCE THE TAIL of a split table. A long table can fill one page
    // exactly and leave its last few blocks - an Action Required band, a
    // sign-off line - marooned on a page that is 85% white. It is not
    // broken, but it reads as though the report gave up. So where a page
    // is sparse and the page before it ends in a split table, hand rows
    // back down until both pages carry a fair share. Whole rows only, the
    // repeated header comes with them, and nothing ever overflows.
    // (A. Fisher, 25 Jul 2026)
    function fillOf(c){
      var last = null;
      for (var i = 0; i < c.children.length; i++)
        if (c.children[i].offsetHeight > 0) last = c.children[i];
      if (!last) return 0;
      return (last.offsetTop + last.offsetHeight - c.offsetTop) / c.clientHeight;
    }
    function over(c){ return c.scrollHeight > c.clientHeight + 1; }
    for (var ri = 1; ri < sheets.length; ri++){
      var cc2 = sheets[ri].content;
      if (fillOf(cc2) >= 0.45) continue;
      if (startsSection(cc2)) continue;
      var pc = sheets[ri - 1].content;
      // find the last TABLE on the previous page, stepping back over any
      // SMALL trailing blocks (a note, a legend) - those travel down with
      // the rows so the tail page reads as one continuous section
      var pTable = pc.lastElementChild, trailers = [];
      while (pTable && (pTable.offsetHeight === 0 ||
                        !/^TABLE$/i.test(pTable.tagName))){
        if (pTable.offsetHeight > 0){
          if (pTable.offsetHeight > 140 || trailers.length >= 3){ pTable = null; break; }
          trailers.unshift(pTable);
        }
        pTable = pTable.previousElementSibling;
      }
      if (!pTable || !/^TABLE$/i.test(pTable.tagName)) continue;
      for (var ti = trailers.length - 1; ti >= 0; ti--)
        cc2.insertBefore(trailers[ti], cc2.firstChild);
      if (over(cc2)){                       // put them back, nothing gained
        for (var tj = 0; tj < trailers.length; tj++) pc.appendChild(trailers[tj]);
        continue;
      }
      var pBody = (pTable.tBodies && pTable.tBodies.length) ? pTable.tBodies[0] : null;
      if (!pBody || pBody.rows.length < 2) continue;
      // Where the sparse page ALREADY opens with a continuation of this
      // same table, feed the rows straight into it. Adding a second shell
      // above it prints the column headers twice on one page, which reads
      // as two different tables. (A. Fisher, 25 Jul 2026)
      function headText(t){
        return t && t.tHead ? t.tHead.textContent.replace(/\s+/g, ' ').trim() : '';
      }
      var shell2 = null, sBody = null, madeShell = false;
      var f2 = cc2.firstElementChild;
      while (f2 && f2.offsetHeight === 0) f2 = f2.nextElementSibling;
      if (f2 && /^TABLE$/i.test(f2.tagName) && f2.tBodies && f2.tBodies.length &&
          headText(f2) && headText(f2) === headText(pTable)){
        shell2 = f2; sBody = f2.tBodies[0];
      } else {
        shell2 = pTable.cloneNode(false);
        if (pTable.tHead) shell2.appendChild(pTable.tHead.cloneNode(true));
        sBody = document.createElement('tbody'); shell2.appendChild(sBody);
        cc2.insertBefore(shell2, cc2.firstChild);
        madeShell = true;
        if (over(cc2)){ cc2.removeChild(shell2); continue; }
      }
      var moved2 = 0;
      while (pBody.rows.length > 1){
        var row2 = pBody.rows[pBody.rows.length - 1];
        sBody.insertBefore(row2, sBody.firstChild);
        if (over(cc2)){ pBody.appendChild(row2); break; }
        moved2++;
        if (fillOf(cc2) >= 0.62 || fillOf(pc) < 0.55) break;
      }
      if (!moved2 && madeShell && shell2.parentNode)
        shell2.parentNode.removeChild(shell2);
    }

    // any page left with nothing on it is removed outright
    for (var sk = sheets.length - 1; sk >= 0; sk--){
      var cc = sheets[sk].content, live = 0;
      for (var cj = 0; cj < cc.children.length; cj++)
        if (cc.children[cj].offsetHeight > 0) live++;
      if (live === 0 && sheets[sk].sheet.parentNode){
        sheets[sk].sheet.parentNode.removeChild(sheets[sk].sheet);
        sheets.splice(sk, 1);
      }
    }

    // stamp Page X of N on every header
    for (var p = 0; p < sheets.length; p++){
      var tags = sheets[p].panel.querySelectorAll('.pgnum');
      for (var q = 0; q < tags.length; q++)
        tags[q].textContent = 'Page ' + (p + 1) + ' of ' + sheets.length;
    }

    // #page=k -> show ONLY that sheet (how the email images are captured)
    function applyHash(){
      var m = (location.hash || '').match(/page=(\d+)/);
      for (var s = 0; s < sheets.length; s++)
        sheets[s].sheet.style.display =
          (!m || s + 1 === parseInt(m[1], 10)) ? '' : 'none';
      window.scrollTo(0, 0);
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', run);
  else run();
})();
"""


def compact_header(kicker, title, asat_line):
    """The page-2+ header: brand + report name on the left, POWERED BY
    SITEIQ / as-at / page number on the right."""
    return ("<div class='bandc'><div>"
            "<div class='k'>COATES &middot; {k}</div>"
            "<h1>{t}</h1></div>"
            "<div class='m'><span class='siq'>POWERED BY SITEIQ</span><br>"
            "As at <b>{a}</b><br><span class='pgnum'>&nbsp;</span></div></div>"
            ).format(k=kicker, t=title, a=asat_line)


def paged_doc(title, base_css, first_header, later_header, footer,
              body_html, doc_title="Coates K2 Report", team_html=""):
    """Assemble the paginating document: hidden staging with the report
    blocks, an empty sheets container, and the layout script. The first
    page header also carries the page number (a .pgnum span is appended
    into it automatically if none is present)."""
    if "pgnum" not in first_header:
        # the &nbsp; keeps the page-number line in the layout from the very
        # first measurement - 'Page X of N' stamps in AFTER pagination, and
        # a line that appears late steals height from a page measured full,
        # clipping its last few pixels (the 5-11px clips found in the
        # 24 Jul 2026 fleet sweep). Reserved up front, nothing ever clips.
        first_header += ("<div style='text-align:right;color:#A9B1BD;"
                         "font-size:8.5pt;text-transform:uppercase;"
                         "margin-top:4px'><span class='pgnum'>&nbsp;</span></div>")
    return ("<!DOCTYPE html><html><head><meta charset='utf-8'>"
            "<title>" + doc_title + "</title>"
            "<style>" + base_css + PAGE_CSS +
            (LIGHT_CSS if EXEC_LIGHT else "") + "</style></head><body>"
            "<div id='stage'>" + body_html + "</div>"
            "<div id='sheets'></div>"
            "<script>var PAGES_HDR1=" + json.dumps(first_header) +
            ",PAGES_HDRN=" + json.dumps(later_header) +
            ",PAGES_FOOT=" + json.dumps(footer) +
            ",PAGES_TEAM=" + json.dumps(team_html or "") + ";</script>"
            "<script>" + PAGINATE_JS + "</script>"
            "</body></html>")
