#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | REPORTS ON YOUR PHONE
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 4 Aug 2026): "i feel like there are pages missing on my
#  phone... how much of this should be running off my phone? i can run
#  it on the laptop but i have not seen half of it."
#
#  He is right, and it is worse than half. The server serves ONE folder
#  - Gear_Lookup - and that folder holds four pages. Everything else
#  the suite builds, 62 pages and 54 PDFs a morning, lands in Reports\
#  and never leaves the laptop. So the answer to "where's the stocktake
#  scorecard" on a phone was: it isn't.
#
#  WHAT CAN GO, AND WHAT CANNOT.
#
#  Gear_Lookup is served to EVERY phone on the store Wi-Fi. So the line
#  is money, and it always has been: 15 of those reports carry rates or
#  revenue and can never sit in that folder. Thirteen carry none.
#
#  Those thirteen say nothing the stores board does not already show a
#  Coates hand - the hit list, the chase list, the stocktake, who is
#  holding what. He settled that on 3 Aug: the store Wi-Fi password is
#  the door, and the board opens on arrival. So this is not new
#  disclosure; it is the same data, on the phone he is holding.
#
#  THE GATE IS A CHECK, NOT A LIST. Every page is read before it is
#  copied and REFUSED if a dollar figure or a money key is anywhere in
#  it - visible text or payload. A report that grows a rate next month
#  stops travelling by itself, without anybody remembering to look.
#
#  The worker page never links this. It hangs off the stores board.
#
#  Run it:  py phone_reports.py          (or 78_REPORTS_ON_MY_PHONE)
# =====================================================================
from __future__ import print_function

import datetime as dt
import html
import io
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, 'Gear_Lookup', 'reports')


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


#  WHAT BELONGS ON A PHONE IN THE STORE. The money check below is the
#  gate; this is the judgement. A report can be money-free and still be
#  none of a store hand's business, so it has to be BOTH.
#
#  (stem, what it is, what it answers)
SHELF = [
    ('Coates_K2_Safety_Assurance', 'Safety & Compliance',
     'Overdue gear, high-care items, and who is holding what.'),
    ('Coates_K2_Stocktake_Scorecard', 'Stocktake scorecard',
     'How the count is tracking.'),
    ('Coates_K2_Stocktake_RunSheet', 'Stocktake run sheet',
     'The walk-around, in counting order.'),
    ('Coates_K2_GearReturn_Demob', 'Gear return / demob',
     'What has to come back, and off whom.'),
    ('Coates_K2_Cement_Store_Stock', 'Store stock & reorder',
     'What is on the shelf and what to order.'),
    ('Coates_K2_Store_Consumables_WATCH', 'Consumables watch',
     'What is running low before it runs out.'),
    ('Coates_K2_Consumable_Requests', 'Consumable requests',
     'What has been asked for, and by whom.'),
    ('Coates_K2_Plant_Dashboard', 'Plant dashboard',
     'The machines, at a glance.'),
    ('Coates_K2_Returns_Performance', 'Returns performance',
     'Who brings gear back and who does not.'),
    ('Coates_K2_Shift_And_Counter_Intel', 'Shift & counter intel',
     'What the counter actually did, hour by hour.'),
    ('Coates_K2_Utilisation', 'Utilisation',
     'How hard the fleet is working.'),
    ('Coates_K2_Offline_Day', 'Offline day pack',
     'The day on paper, for when the network is down.'),
    ('Coates_K2_Designed_', 'Your own designed reports',
     'Anything you built with 76_DESIGN_A_REPORT.'),
    #  ---- and the ones that carry money -----------------------------
    #  They are listed here so they get FOUND. The check below is what
    #  decides how they travel: none of these goes in the clear, every
    #  one is locked under his code.
    ('Coates_K2_Executive_Summary', 'Executive Daily Summary',
     'The one Cement Australia gets every morning.'),
    ('Coates_K2_Cost_Tracking_Snapshot', 'Cost tracking',
     'What the shutdown is costing, against the plan.'),
    ('Coates_K2_Daily_Brief', 'Daily brief',
     'The whole day on one page.'),
    ('Coates_K2_Daily_Hit_List', 'Daily hit list',
     'Gas, radios, Milwaukee, anything past seven days.'),
    ('Coates_K2_Utilisation_Control', 'Utilisation Control',
     'The hub - bars, tiles, the timeline of the shut.'),
    ('Coates_K2_Utilisation_Intelligence', 'Utilisation intelligence',
     'Where the money is going and what to do about it.'),
    ('Coates_K2_Billing_Forecast_INTERNAL', 'Billing forecast',
     'Where this lands if nothing changes.'),
    ('Coates_K2_Invoice_Breakdown', 'Invoice breakdown',
     'What the SiteIQ invoice is made of.'),
    ('Coates_K2_Separate_Invoice', 'Separate invoice stream',
     'Baseplan and the rest, kept apart.'),
    ('Coates_K2_Money_And_Whats_Used', 'Money and what is used',
     'The rates against the usage.'),
    ('Coates_K2_Consumables_Report', 'Consumables usage',
     'What is being burned through across the site.'),
    ('Coates_SitePlant_Report', 'Site plant',
     'The machines - out, idle, free to hire.'),
    ('Coates_K2_Stocktake_TEAM', 'Stocktake - team report',
     'The same count, for the blokes doing it.'),
    ('Coates_K2_Fleet_Details', 'Fleet Details (your copy)',
     'The one with the money on it. The counter copy is already on '
     'your phone without it.'),
    ('Coates_OnHire_Summary_ALL_COMPANIES', 'Every company, one summary',
     'The whole site on one sheet.'),
    #  60 - the branch availability finder. INTERNAL, so it travels
    #  locked, and only on a machine that has the MyBranch export.
    ('Coates_K2_Fleet_Finder_INTERNAL', 'Fleet finder (branch)',
     'What the branch has, against what we need.'),
    #  ---- 63, 64, 66 ------------------------------------------------
    #  Andrew, 4 Aug 2026: "i want these on phone." None of these had a
    #  page - 66 wrote a spreadsheet, 63 edited a text file and 64 was a
    #  clock the other reports read. They have pages now, drawn by
    #  page_style so they read like everything above them.
    #
    #  70 was the fourth and is deliberately NOT here. It got a page,
    #  the page was 2,400 machines and 346 KB, and Andrew's call was
    #  "the serial page we can remove." 70 still writes its CSV and
    #  SERIALS_TO_FIX.csv; the serials themselves are still on Fleet
    #  Details (68) and the supervisor screen (69), beside the plant
    #  number, which is where you actually want them.
    ('Coates_K2_Hidden_Items', 'Held off the board',
     'What a storeman will not see when he searches, and why.'),
    ('Coates_K2_Shutdown_Clock', 'Shutdown clock',
     'Where we are in the shut, and what is next.'),
    ('Coates_K2_Flame_Off_Plant', 'Flame Off plant',
     'Every machine since Flame Off, worst idle first.'),
    #  Andrew, 5 Aug 2026: "where can i find this is this in my gear."
    #  It was not - it carries rates, so it lived on the laptop only.
    #  It travels the same way every other money report does: encrypted
    #  under his code before it reaches the folder a phone can open.
    ('Coates_K2_Plant_Utilisation', 'Plant utilisation & idle cost',
     'How hard the fleet worked, what the idle cost, and what to change '
     'next job.'),
]

#  ALREADY IN Gear_Lookup AND NEVER LINKED. 62 writes its page straight
#  into the served folder and nothing has ever pointed at it, so it has
#  been on his phone the whole time and invisible. (4 Aug 2026.)
ALREADY = [
    ('MyGear_Whats_On_My_Report.html', 'What is on my report',
     'Plain English for every number and word on a report.'),
    ('MyGear_How_It_Works.html', 'How My Gear works',
     'The one-pager the crews get.'),
]

#  THE GATE. A dollar figure in the text, or a money key in a payload.
#  The second one is the important half: revenue rides into these pages
#  as JSON numbers, where a search for "$" finds nothing at all. That
#  exact hole was found in the crew page on 28 Jul.
#  HIS CODE, if this machine has it. Without it nothing money-bearing
#  travels at all - which is the right failure: a missing code must
#  never mean "send it in the clear".
def _mgr_code():
    p = os.path.join(HERE, 'manager_code.txt')
    if not os.path.isfile(p):
        return ''
    try:
        with io.open(p, encoding='utf-8', errors='ignore') as fh:
            return fh.read().strip()
    except Exception:
        return ''


MGR_CODE = _mgr_code()


def _enc(code, text):
    """The same cipher the stores board locks its rates with, but over
    UTF-8 BYTES rather than characters - a report is full of curly
    quotes and dashes, and XORing a character above 255 would corrupt
    it on the way back."""
    import base64
    import mygear_stores as MS
    r = MS._mulberry32(MS._xmur3(code + '|CoatesK2mgr2026')())
    data = text.encode('utf-8')
    return base64.b64encode(
        bytes(((b ^ ((r() >> 24) & 0xFF)) & 0xFF) for b in data)).decode('ascii')


MONEY_TEXT = re.compile(r'\$\s?[0-9]')
MONEY_KEY = re.compile(r'"(revenue|rate|rates|charge|charges|price|'
                       r'cost|costs|amount|invoice|total_?\$)"', re.I)


def money_in(text):
    m = MONEY_TEXT.search(text)
    if m:
        i = max(0, m.start() - 40)
        return 'a dollar figure: ...' + text[i:m.start() + 18].strip() + '...'
    m = MONEY_KEY.search(text)
    if m:
        return 'a money key in the payload: ' + m.group(1)
    return ''


#  NOTE ON THE QUOTING: raw string, and not one bare apostrophe inside
#  a JS string literal. A page of this suite has shipped stone dead
#  three times from exactly that.
_MGR_JS = r"""
/* ------------------------------------------------------------------
   THE MONEY, ON HIS PHONE, AND NOBODY ELSE&rsquo;S.
   (Andrew, 4 Aug 2026: "any with money is only for manager login.")

   The report is not in this page and it is not in the folder in any
   readable form - it is a .k2m blob, XORed under his manager code, the
   same cipher the stores board locks its rates with. A contractor who
   fetches one gets noise. It is fetched only when he taps it, so the
   page stays light on a store Wi-Fi.

   THE CODE IS NEVER STORED. It is checked against a hash and then held
   in a page variable that dies with the tab - the same rule the board
   follows, and the reason the unlock does not survive leaving.
------------------------------------------------------------------ */
var MTAG = "__MTAG__", MC = null;
function xmur3(s){for(var i=0,h=1779033703^s.length;i<s.length;i++){
 h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}
 return function(){h=Math.imul(h^h>>>16,2246822507);
 h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return h>>>0}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
 var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
 return((t^t>>>14)>>>0)/4294967296}}
function mtagOf(c){return (xmur3(c+"|CoatesK2mgrtag2026")()>>>0).toString(16)}
/*  bytes, not characters - a report is full of curly quotes and
    dashes, and XORing above 255 would bring them back wrong  */
function mdecBytes(c,b64){
  var raw=atob(b64), rnd=mulberry32(xmur3(c+"|CoatesK2mgr2026")());
  var arr=new Uint8Array(raw.length), i;
  for(i=0;i<raw.length;i++)
    arr[i]=(raw.charCodeAt(i)^Math.floor(rnd()*256))&255;
  try{ return new TextDecoder("utf-8").decode(arr); }
  catch(e){ var o="",j; for(j=0;j<arr.length;j++)
    o+=String.fromCharCode(arr[j]); return o; }
}
function mUnlock(){
  var i=document.getElementById("mcode"), e=document.getElementById("merr");
  var raw=(i&&i.value||"").trim();
  if(!raw) return;
  if(!MTAG){ e.textContent="No manager layer in this build - "
    +"manager_code.txt was missing when it was made."; return; }
  if(mtagOf(raw)!==MTAG){
    e.textContent="That code does not open these. Mind the capitals.";
    return; }
  MC=raw; e.textContent="";
  document.getElementById("mbox").hidden=true;
  document.getElementById("mlist").hidden=false;
}
function mOpen(b){
  if(!MC) return;
  var k=b.getAttribute("data-k");
  var t=document.getElementById("mvt");
  t.textContent=b.querySelector("b").textContent;
  var x=new XMLHttpRequest();
  x.open("GET",k,true);
  x.onload=function(){
    if(x.status>=400){ alert("That report is not in the folder any more. "
      +"Run 78 on the laptop."); return; }
    var htmlText;
    try{ htmlText=mdecBytes(MC,x.responseText); }
    catch(err){ alert("That would not open."); return; }
    var f=document.getElementById("mvf");
    f.srcdoc=htmlText;
    document.getElementById("mview").className="on";
    document.body.style.overflow="hidden";
    try{ history.pushState({mv:1},""); }catch(e2){}
  };
  x.onerror=function(){ alert("Could not fetch it - are you still on the "
    +"store Wi-Fi?"); };
  x.send();
}
function mShut(){
  var v=document.getElementById("mview");
  if(!v||v.className!=="on") return;
  v.className=""; document.getElementById("mvf").srcdoc="";
  document.body.style.overflow="";
}
/*  the bar asks this before it acts on a Back - while a report is open
    that Back belongs to the report  */
function k2OtherOpen(){
  var v=document.getElementById("mview");
  return !!(v && v.className==="on");
}
window.addEventListener("popstate",function(){ mShut(); });
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"||e.keyCode===27) mShut();
});
"""


def build(date_tag=None):
    reports = os.path.join(HERE, 'Reports')
    days = sorted(d for d in os.listdir(reports)
                  if re.match(r'^\d{4}-\d{2}-\d{2}$', d)) \
        if os.path.isdir(reports) else []
    if not days:
        print('  No Reports folder yet - build some reports first.')
        return 1

    #  EACH REPORT'S NEWEST COPY, WHEREVER IT LIVES.
    #
    #  The old rule picked ONE day - "the day with the most pages,
    #  latest wins a tie" - and served the whole shelf from it. Which
    #  meant one old day with a big run could beat this morning's
    #  fresher, thinner build, and every page built since simply did
    #  not appear. Andrew, 6 Aug 2026, looking at his own board: "i
    #  feel like im missing heaps of things in mygear that we
    #  implemented." He was - the shelf was serving three days ago.
    #
    #  Now every report is hunted for on its own, newest day first:
    #  today's stocktake scorecard rides with Monday's flame-off page
    #  if Monday's is the newest one built. Nothing waits for a "best
    #  day", and nothing built today can be beaten by history. An
    #  explicit date_tag still pins the whole shelf to one day.
    search_days = ([date_tag] if date_tag
                   else sorted(days, reverse=True))

    def newest_hits(stem):
        pat = (None if stem.endswith('_') else
               re.compile(r'^' + re.escape(stem)
                          + r'(_\d{4}-\d{2}-\d{2})?\.html$'))
        for d in search_days:
            p = os.path.join(reports, d, 'Pages')
            if not os.path.isdir(p):
                continue
            if stem.endswith('_'):
                hits = sorted(f for f in os.listdir(p)
                              if f.startswith(stem) and f.endswith('.html'))
            else:
                hits = [f for f in os.listdir(p)
                        if f.startswith(stem) and f.endswith('.html')
                        and pat.match(f)]
            if hits:
                return p, hits
        return None, []

    #  a clean shelf every run - yesterday's copies never linger
    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(OUT_DIR)

    took, held, locked = [], [], []
    for stem, name, what in SHELF:
        pages, hits = newest_hits(stem)
        for f in hits:
            src = os.path.join(pages, f)
            try:
                with io.open(src, encoding='utf-8', errors='ignore') as fh:
                    text = fh.read()
            except Exception as e:
                held.append((f, 'could not be read: {}'.format(e)))
                continue
            why = money_in(text)
            if why:
                #  A MONEY REPORT DOES NOT TRAVEL IN THE CLEAR. It goes
                #  as a blob scrambled under HIS manager code, in its
                #  own file, fetched only when he unlocks and taps it -
                #  so the folder still holds nothing a contractor can
                #  read, and he still gets his numbers on his phone.
                #  (Andrew, 4 Aug 2026, choosing this over dropping the
                #  gate: "encrypt them under my code".)
                if MGR_CODE:
                    blob = _enc(MGR_CODE, text)
                    with io.open(os.path.join(OUT_DIR, f + '.k2m'), 'w',
                                 encoding='ascii') as bf:
                        bf.write(blob)
                    locked.append((f + '.k2m',
                                   re.sub(r'_\d{4}-\d{2}-\d{2}\.html$', '',
                                          f).replace('_', ' '),
                                   len(blob)))
                else:
                    held.append((f, why + ' (and no manager_code.txt on '
                                       'this machine to lock it under)'))
                continue
            shutil.copy2(src, os.path.join(OUT_DIR, f))
            label = name
            if stem.endswith('_'):
                label = re.sub(r'^' + re.escape(stem) +
                               r'|_\d{4}-\d{2}-\d{2}$', '',
                               os.path.splitext(f)[0]).replace('_', ' ')
            took.append((f, label, what, os.path.getsize(src)))

    #  ---- the shelf itself ------------------------------------------
    import mygear_nav as nav
    import mygear_stores as MS
    rows = []
    #  the ones already sitting in the served folder, linked at last
    for f, label, what in ALREADY:
        src = os.path.join(HERE, 'Gear_Lookup', f)
        if not os.path.isfile(src):
            continue
        with io.open(src, encoding='utf-8', errors='ignore') as fh:
            if money_in(fh.read()):
                continue
        rows.append(
            "<a class='rr' href='../" + _esc(f) + "'>"
            "<div class='t'><b>" + _esc(label) + "</b>"
            "<span>" + _esc(what) + "</span></div><i>&rsaquo;</i></a>")
        took.append((f, label, what, os.path.getsize(src)))
    for f, label, what, size in took:
        rows.append(
            "<a class='rr' href='" + _esc(f) + "'>"
            "<div class='t'><b>" + _esc(label) + "</b>"
            "<span>" + _esc(what) + "</span>"
            "<em>" + ('{:.1f} MB'.format(size / 1048576.0) if size >= 1048576
                      else '{:,} KB'.format(max(1, size // 1024))) + "</em>"
            "</div><i>&rsaquo;</i></a>")

    #  ---- the locked half -------------------------------------------
    lock_html = ''
    if locked:
        import mygear_stores as MS
        rowsL = ''.join(
            "<button type='button' class='rr lk' data-k='" + _esc(f)
            + "' onclick=\"mOpen(this)\"><div class='t'><b>" + _esc(label)
            + "</b><span>Locked &mdash; your code opens it.</span>"
            "<em>" + '{:,} KB'.format(max(1, n // 1024)) + "</em></div>"
            "<i>&#128274;</i></button>" for f, label, n in locked)
        lock_html = (
            "<h2 class='lk'>&#128274; YOURS &mdash; " + str(len(locked))
            + " MORE</h2><p>These carry money, so they are scrambled in "
            "the folder. Anyone else who fetches one gets nothing. Your "
            "code opens them here.</p>"
            "<div class='mbox' id='mbox'>"
            "<div class='mrow'><input id='mcode' type='password' "
            "inputmode='text' autocomplete='off' autocapitalize='none' "
            "autocorrect='off' spellcheck='false' placeholder='MANAGER CODE' "
            "aria-label='Manager code' "
            "onkeydown='if(event.keyCode===13)mUnlock()'>"
            "<button type='button' onclick='mUnlock()'>Open</button></div>"
            "<div id='merr' class='merr'></div></div>"
            "<div id='mlist' hidden>" + rowsL + "</div>")

    held_html = ''
    if held:
        held_html = ("<h2 class='no'>NOT ON THIS PHONE</h2>"
                     "<p>These were built this morning and are on the laptop "
                     "only. Every one of them carries money, and this folder "
                     "is served to every phone on the store Wi-Fi.</p>")
        for f, why in held:
            held_html += ("<div class='rr held'><div class='t'><b>"
                          + _esc(re.sub(r'_\d{4}-\d{2}-\d{2}\.html$', '',
                                        f).replace('_', ' '))
                          + "</b><span>Held back &mdash; " + _esc(why)
                          + "</span></div></div>")

    #  With no pinned day the shelf is each report at its newest, so
    #  the header carries today and the footer says how it was picked.
    if date_tag:
        pretty = dt.datetime.strptime(date_tag,
                                      '%Y-%m-%d').strftime('%d %B %Y')
        stale = date_tag != dt.date.today().isoformat()
    else:
        pretty = (dt.date.today().strftime('%d %B %Y')
                  + ' &middot; each report at its newest')
        stale = False
    page = (
        "<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1,"
        "viewport-fit=cover'><meta name='theme-color' content='#F26222'>"
        "<title>Coates | Reports on your phone</title><style>"
        "*{box-sizing:border-box;margin:0;padding:0}"
        "body{background:#0D1218;color:#DCE3EC;font-family:-apple-system,"
        "'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.45}"
        ".phone{max-width:640px;margin:0 auto;min-height:100vh}"
        ".bar2{background:#F26222;color:#fff;padding:14px 16px;display:flex;"
        "justify-content:space-between;align-items:center}"
        ".bar2 h1{font-size:18px;font-weight:800}"
        ".bar2 .siq{font-size:9px;letter-spacing:2px;font-weight:800;"
        "opacity:.85}"
        ".pad{padding:14px 16px 40px}"
        ".lead{color:#8794A6;font-size:12.5px;line-height:1.6;"
        "margin-bottom:14px}"
        ".lead b{color:#F5A623}"
        "h2{font-size:11px;font-weight:800;letter-spacing:2px;color:#F26222;"
        "margin:22px 0 4px;text-transform:uppercase}"
        "h2.no{color:#FF6B5A}"
        "h2+p{color:#8794A6;font-size:12px;line-height:1.55;margin-bottom:9px}"
        ".rr{display:flex;gap:11px;align-items:center;text-decoration:none;"
        "background:#151A22;border:1px solid #2A3340;border-radius:14px;"
        "padding:13px 14px;margin-bottom:8px;min-height:62px}"
        ".rr .t{flex:1;min-width:0}"
        ".rr .t b{display:block;font-size:15px;font-weight:800;color:#F0F4F9;"
        "line-height:1.3}"
        ".rr .t span{display:block;color:#98A4B4;font-size:12px;margin-top:2px;"
        "line-height:1.4}"
        ".rr .t em{display:block;font-style:normal;color:#5F6B7C;"
        "font-size:11px;margin-top:4px}"
        ".rr i{flex:none;color:#F26222;font-size:22px;font-style:normal}"
        ".rr.held{border-color:#7A3A12;background:#1B1109}"
        ".rr.held .t b{color:#FFD9CC}"
        ".foot{color:#4A5768;font-size:11px;text-align:center;padding:26px 0;"
        "line-height:1.7}"
        "h2.lk{color:#F5A623}"
        ".rr.lk{width:100%;text-align:left;font-family:inherit;cursor:pointer;"
        "border-color:#4A3A18;background:#171208}"
        ".rr.lk .t b{color:#F7D9A0}"
        ".mbox{background:#151A22;border:1px solid #2A3340;"
        "border-left:3px solid #F5A623;border-radius:0 13px 13px 0;"
        "padding:12px 13px;margin-bottom:10px}"
        ".mrow{display:flex;gap:8px}"
        ".mrow input{flex:1;min-width:0;background:#0B111A;"
        "border:1px solid #2A3340;border-radius:9px;padding:0 12px;"
        "min-height:48px;color:#DCE3EC;font:800 14px/1 inherit;"
        "letter-spacing:2px}"
        ".mrow button{flex:none;background:#F5A623;color:#1A1204;border:0;"
        "border-radius:9px;padding:0 18px;min-height:48px;"
        "font:900 13px/1 inherit;cursor:pointer}"
        ".merr{color:#FF6B5A;font-size:12px;font-weight:700;margin-top:7px}"
        "#mview{position:fixed;inset:0;z-index:90;background:#0D1218;"
        "display:none;flex-direction:column}"
        "#mview.on{display:flex}"
        "#mview .top{display:flex;gap:9px;align-items:center;padding:8px 10px;"
        "background:#11161D;border-bottom:1px solid #2A3340}"
        "#mview .top b{flex:1;min-width:0;font-size:13px;color:#F0F4F9;"
        "overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
        "#mview .top button{background:#1C232D;border:1px solid #38424F;"
        "color:#DCE3EC;font:800 12px/1 inherit;border-radius:10px;"
        "min-height:44px;padding:0 14px;cursor:pointer}"
        "#mview iframe{flex:1;border:0;width:100%;background:#fff}"
        + nav.CSS +
        "</style></head><body><div class='phone'>"
        + nav.bar('reports', 'Reports') +
        "<div class='bar2'><h1>Reports</h1>"
        "<span class='siq'>POWERED BY SITEIQ</span></div>"
        "<div class='pad'>"
        "<div class='lead'>Everything from <b>" + _esc(pretty) + "</b> that "
        "can be on a phone."
        + ("<br><b>This is not today.</b> Run the morning reports to move "
           "it on." if stale else '')
        + "<br>Money reports are not here and cannot be &mdash; this folder "
        "is served to every phone on the store Wi-Fi. They are on the "
        "laptop, in the Print Hub.</div>"
        "<h2>ON THIS PHONE (" + str(len(took)) + ")</h2>"
        + ''.join(rows) + lock_html + held_html +
        "<div class='foot'>Cement Australia K2 Shutdown 2026 &middot; "
        "Gladstone<br>Read-only SiteIQ snapshot &middot; no money on any "
        "page here<br>Author: Andrew Fisher &middot; POWERED BY SITEIQ"
        "</div></div></div>"
        + nav.sheet('reports')
        + "<div id='mview'><div class='top'><b id='mvt'></b>"
          "<button type='button' onclick='mShut()'>CLOSE</button></div>"
          "<iframe id='mvf' sandbox='allow-same-origin'></iframe></div>"
        + "<script>" + nav.js('reports', 'Reports') + "</script>"
        + "<script>" + _MGR_JS.replace('__MTAG__', MS.mtag(MGR_CODE)
                                       if locked and MGR_CODE else '')
        + "</script></body></html>")

    with io.open(os.path.join(OUT_DIR, 'index.html'), 'w',
                 encoding='utf-8') as fh:
        fh.write(page)

    print('=' * 64)
    print(' COATES | REPORTS ON YOUR PHONE')
    print('=' * 64)
    print(' Day                : {}{}'.format(
        date_tag or 'each report at its newest build',
        '   <-- not today' if stale else ''))
    print(' In the clear       : {}'.format(len(took)))
    for f, label, _w, _s in took:
        print('     + {}'.format(label))
    print(' Locked under your  : {}'.format(len(locked)))
    print(' manager code')
    for f, label, _n in locked:
        print('     * {}'.format(label))
    print(' Not travelling     : {}'.format(len(held)))
    for f, why in held:
        print('     - {}  ({})'.format(f[:52], why[:44]))
    print('')
    print(' Open it from the stores board: Bay 04 > Reports on your phone')
    print(' The worker page does not link it and never will.')
    return 0


if __name__ == '__main__':
    sys.exit(build(sys.argv[1] if len(sys.argv) > 1 else None))
