# -*- coding: utf-8 -*-
"""
MY GEAR - ONE WAY AROUND
========================
Andrew, 3 Aug 2026: "back button menu button so its easy accessable going
from one spot to the next and it all makes sense where they are and how
to go from point a to point b."

WHAT WAS WRONG. Four pages, four different ideas of where you are:

  index.html   the front door. Once a card is open the only way back to
               the search box is a "Done" button at the BOTTOM of the
               card - past everything the bloke just scrolled through.
  stores.html  a crumb bar with MENU, a dock along the bottom, and NOT
               ONE LINK back to My Gear. You go in and you stay in.
  fleet.html   a thin row of blue text links at the very top. Scroll a
               1.1 MB list and there is nothing on screen at all.
  crew.html    the same thin row, two links, and it is reached from
               THREE different places - so "back" meant three things.

And the phone's own Back button walked out of the whole app from any
inner screen, because nothing pushed a history entry.

WHAT THIS IS. One bar, on every page, in the same place, saying the same
things:

     [ < BACK ]      WHERE YOU ARE      [ MENU ]

BACK is never a dead button. It steps out of an inner screen first; if
you are already at a page's front, it goes back to the page you actually
came from; and if you arrived cold off a QR code it goes to that page's
parent. It hides itself only on the front door, where there is nothing
behind it.

MENU is the same list everywhere - the four places this app goes, marked
with where you are standing now - plus whatever the page you are on can
reach. Point A to point B is always two taps: MENU, then the place.

THE PHONE'S OWN BACK BUTTON now works too. Every inner screen pushes a
history entry, so Back steps back one screen instead of leaving.

WHY IT IS ONE MODULE. Four generators drew four different bars. A rule
that lives in four places is four rules. This is the only one.
"""

from __future__ import print_function


#  --------------------------------------------------------------
#  THE MAP. Every page of the app, in the order a person meets them.
#  Adding a page here puts it in the menu on all four - which is the
#  whole point of there being one list.
#  --------------------------------------------------------------
#  The last field is WHO THE DOOR IS FOR.
#    ""      anyone who scanned the QR at the window
#    "staff" the stores team's own screens - NEVER on the worker menu
#
#  ANDREW, 4 AUG 2026: "we need to make sure the main Worker menu does
#  not have access to everything."
#
#  index.html is the worker and contractor page - the QR taped in the
#  window, scanned by anyone walking past. The stores board carries the
#  hit list, the chase list, the stocktake and every worker name; the
#  fleet list ranks every asset on site. Neither belongs on a menu a
#  contractor can open.
#
#  Neither is password-locked any more (3 Aug: the store Wi-Fi password
#  is the door) so nothing STOPS somebody typing the filename - but
#  "not locked" and "listed on the worker menu" are different things,
#  and only one of them is a decision he made.
#
#  I first built this to reveal the staff doors once a session had been
#  through one. He asked for it tighter than that, so it is tighter:
#  they are not on the worker menu at all, under any condition. The
#  stores team reaches the board the way they always have - their code
#  in the ID box on the front door.
PAGES = [
    ("index",  "index.html",  "My Gear",
     "Your own gear, by site ID", ""),
    ("stores", "stores.html", "Store Street",
     "The stores team board", "staff"),
    #  4 Aug 2026: OFF THE WORKER MENU TOO, on Andrew's call. It takes
    #  any company name and shows that company's people and what each
    #  of them holds - a contractor who scanned the window QR should
    #  not be handed that in a menu. The "Supervisor? See what your
    #  crew has on hire" link he asked for on 3 Aug stays exactly where
    #  it is on the landing page, so a supervisor at the counter still
    #  walks straight in.
    ("crew",   "crew.html",   "Who&rsquo;s got what",
     "Supervisor &mdash; your crew&rsquo;s gear", "staff"),
    ("fleet",  "fleet.html",  "Fleet Details",
     "Every asset ranked", "staff"),
]

#  Where BACK goes when there is no trail to follow - somebody who
#  scanned a QR code straight onto this page and has no history behind
#  them. index is the front door, so it has no parent and its Back
#  hides itself rather than sitting there doing nothing.
#  THE PAGES ANYONE CAN OPEN. index is the QR in the window; crew is
#  one tap off it, by Andrew's own "Supervisor? See what your crew has
#  on hire" link. Neither may name a staff screen.
#
#  Locking index alone did nothing: crew.html listed the board in its
#  own menu, so the route was window QR -> Supervisor link -> MENU ->
#  Store Street. Three taps, and I had just told him it was shut.
#  (Found by attacking it, 4 Aug 2026.)
WORKER_PAGES = ("index", "crew")

PARENT = {
    "index":  None,
    "stores": "index.html",
    "crew":   "index.html",
    "fleet":  "stores.html",
}


#  --------------------------------------------------------------
#  THE LOOK. Sized for a bloke in gloves on a phone in bad light:
#  48px targets, real contrast, and it stays on screen when the list
#  under it is a mile long.
#  --------------------------------------------------------------
CSS = """
/*  THE BAR SITS ABOVE THE DETAIL SHEET (78 > 75) so BACK is still
    tappable while a card is open - it closes the card. A visible BACK
    button that cannot be pressed is the exact thing this bar was built
    to get rid of; the card's own scrim was covering it.
    The MENU (80) does cover the bar, and should: it IS the navigation
    while it is open, and its top row is the way back out.
    (Found by the checker trying to press BACK. 4 Aug 2026.)  */
.k2bar{position:sticky;top:0;z-index:78;display:flex;align-items:stretch;
 gap:8px;background:#11161D;border-bottom:1px solid #2A3340;
 padding:7px 10px;min-height:62px}
/*  48px, which is what the note above says and what the buttons were
    NOT. 42 is fine for a thumb and marginal for a glove, and this is a
    gloved-hand app. (4 Aug 2026.)  */
.k2bar button{font-family:inherit;font-size:12px;font-weight:800;
 letter-spacing:.6px;border-radius:11px;cursor:pointer;
 display:flex;align-items:center;justify-content:center;gap:6px;
 min-width:78px;min-height:48px;padding:0 12px}
.k2bar .k2back{background:#1C232D;border:1px solid #38424F;color:#DCE3EC}
.k2bar .k2back:active{background:#242D39}
.k2bar .k2back[hidden]{display:none}
.k2bar .k2menu{background:#F26222;border:0;color:#fff}
.k2bar .k2menu:active{background:#D2551B}
.k2bar svg{width:16px;height:16px;fill:none;stroke:currentColor;
 stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.k2where{flex:1;min-width:0;display:flex;flex-direction:column;
 justify-content:center;text-align:center;padding:0 2px}
.k2where small{display:block;font-size:8.5px;letter-spacing:1.6px;
 font-weight:800;color:#7C8899;text-transform:uppercase}
.k2where b{display:block;font-size:14px;font-weight:800;color:#F0F4F9;
 white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
@media (max-width:360px){
 .k2bar button{min-width:60px;font-size:11px}
 .k2bar .k2lbl{display:none}
}

/*  THE MENU. It comes up from the BOTTOM, because that is where the
    thumb already is - a list that drops from the top of a phone is a
    list you have to shuffle the phone up your hand to reach.  */
.k2sheet{position:fixed;inset:0;z-index:80;display:none}
.k2sheet.on{display:block}
.k2sheet .k2scrim{position:absolute;inset:0;background:rgba(4,7,11,.72)}
.k2sheet .k2panel{position:absolute;left:0;right:0;bottom:0;
 max-height:86vh;overflow:auto;background:#151A22;
 border-top:3px solid #F26222;border-radius:18px 18px 0 0;
 padding:8px 12px calc(14px + env(safe-area-inset-bottom,0px));
 max-width:640px;margin:0 auto;
 -webkit-overflow-scrolling:touch}
.k2sheet .k2grab{width:44px;height:5px;border-radius:3px;background:#38424F;
 margin:6px auto 10px}
.k2sheet h4{font-size:9.5px;letter-spacing:2px;color:#7C8899;
 font-weight:800;text-transform:uppercase;margin:12px 4px 7px}
.k2sheet a,.k2sheet button.k2go{display:flex;width:100%;align-items:center;
 gap:11px;text-align:left;text-decoration:none;font-family:inherit;
 background:#1C232D;border:1px solid #2A3340;border-radius:13px;
 padding:11px 13px;margin-bottom:7px;min-height:56px;cursor:pointer}
.k2sheet a:active,.k2sheet button.k2go:active{background:#242D39}
.k2sheet .k2t{flex:1;min-width:0}
.k2sheet .k2t b{display:block;font-size:14.5px;font-weight:800;
 color:#F0F4F9;line-height:1.25}
.k2sheet .k2t span{display:block;font-size:11.5px;color:#98A4B4;
 line-height:1.3;margin-top:1px}
.k2sheet .k2chev{color:#F26222;font-size:19px;font-weight:800}
.k2sheet .k2n{background:#2A3340;color:#DCE3EC;border-radius:7px;
 font-size:11px;font-weight:800;padding:2px 7px}
.k2sheet .k2on{border-color:#F26222;background:#20262F}
.k2sheet .k2on .k2chev{color:#2BB673;font-size:11px;letter-spacing:.8px}
.k2sheet .k2warn{background:#2A1206;border:1px solid #7A3A12;
 border-radius:11px;padding:10px 12px;margin:2px 2px 6px;
 font-size:12.5px;color:#FFD9CC;line-height:1.45}
.k2sheet .k2close{width:100%;background:#1C232D;border:1px solid #38424F;
 color:#DCE3EC;font-family:inherit;font-size:13px;font-weight:800;
 border-radius:13px;padding:13px;margin-top:6px;min-height:50px;
 letter-spacing:.6px;cursor:pointer}
/*  THE DETAIL SHEET. Same shape as the menu, because a bloke should
    only ever have to learn one thing that slides up from the bottom.
    Used for "what IS this?" - tap a line, read the answer, tap away.  */
.k2det{position:fixed;inset:0;z-index:75;display:none}
.k2det.on{display:block}
.k2det .k2scrim{position:absolute;inset:0;background:rgba(4,7,11,.74)}
.k2det .k2panel{position:absolute;left:0;right:0;bottom:0;max-height:88vh;
 display:flex;flex-direction:column;background:#151A22;
 border-top:3px solid #F26222;border-radius:18px 18px 0 0;
 max-width:640px;margin:0 auto}
.k2det .k2dhd{display:flex;align-items:flex-start;gap:10px;
 padding:14px 14px 10px;border-bottom:1px solid #2A3340}
.k2det .k2dhd b{flex:1;min-width:0;font-size:16px;font-weight:800;
 color:#F0F4F9;line-height:1.3}
.k2det .k2dhd button{flex:0 0 auto;background:#1C232D;border:1px solid #38424F;
 color:#DCE3EC;font-family:inherit;font-size:12px;font-weight:800;
 border-radius:11px;min-height:48px;min-width:70px;padding:0 12px;
 letter-spacing:.6px;cursor:pointer}
.k2det .k2dbd{overflow:auto;-webkit-overflow-scrolling:touch;
 padding:12px 14px calc(16px + env(safe-area-inset-bottom,0px))}
.k2det .k2row{display:flex;gap:10px;padding:9px 0;
 border-bottom:1px solid #222B36}
.k2det .k2row:last-child{border-bottom:0}
.k2det .k2row em{flex:0 0 108px;font-style:normal;font-size:11px;
 font-weight:800;letter-spacing:1.1px;color:#7C8899;text-transform:uppercase;
 padding-top:2px}
.k2det .k2row span{flex:1;min-width:0;font-size:14px;color:#E9EEF5;
 word-break:break-word}
.k2det .k2row span small{display:block;color:#8B96A6;font-size:12px}
.k2det .k2note{background:#1C232D;border:1px solid #2A3340;border-left:3px solid
 #F26222;border-radius:0 11px 11px 0;padding:10px 12px;margin-top:11px;
 font-size:13px;color:#C6D0DD;line-height:1.5}
.k2det .k2note b{color:#F0F4F9}

/*  THE WORKED GAUGE. (Andrew, 4 Aug 2026: "how much its worked. almost
    like a worked gauge maybe.")
    The three band colours sit in the colour-blind validator's WARN band
    - worst pair dE 6.7 - which is only legal because every band also
    carries a WORD. USE NEXT / GOOD / HIGH USE are not decoration; they
    are the reason the colours are allowed at all. Never drop them.  */
.k2gauge{background:#1C232D;border:1px solid #2A3340;border-radius:13px;
 padding:12px 13px;margin:11px 0 4px}
.k2gauge .k2gh{display:flex;align-items:baseline;gap:9px}
.k2gauge .k2gh em{flex:1;font-style:normal;font-size:10px;font-weight:800;
 letter-spacing:1.6px;color:#7C8899;text-transform:uppercase}
.k2gauge .k2gp{font-size:30px;font-weight:800;line-height:1}
.k2gauge .k2gw{font-size:9.5px;font-weight:800;letter-spacing:1.2px;
 border-radius:20px;padding:4px 10px}
.k2gauge .k2gt{height:10px;background:#0B111A;border:1px solid #2A3340;
 border-radius:6px;overflow:hidden;position:relative;margin:9px 0 0}
.k2gauge .k2gt i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}
/*  where the rest of its own fleet sits, as a notch on the same track -
    a number with nothing to stand next to says very little  */
.k2gauge .k2gt u{position:absolute;top:-3px;bottom:-3px;width:2px;
 background:#EAF0F7;opacity:.85}
.k2gauge .k2gs{font-size:11.5px;color:#98A4B4;line-height:1.5;margin-top:8px}
.k2gauge .k2gs b{color:#DCE3EC}
.k2low{color:#1C9FAE}  .k2bglow{background:#0E2E35;color:#1C9FAE}
.k2ok{color:#52AC36}   .k2bgok{background:#12280C;color:#7BD45C}
.k2high{color:#C9550A} .k2bghigh{background:#3A2110;color:#E8804A}
.k2none{color:#8A97A8} .k2bgnone{background:#232B36;color:#8A97A8}

/*  NOT ON PAPER. The crew page prints a supervisor's handout and the
    fleet page prints too - a BACK button on a printed sheet is just
    ink. (4 Aug 2026.)  */
@media print{.k2bar,.k2sheet,.k2det{display:none!important}}
"""


def bar(page_key, title, where="You are here"):
    """The bar itself. Same three things, same order, every page."""
    return (
        '<div class="k2bar">'
        '<button type="button" class="k2back" id="k2back" onclick="k2Back()"'
        ' aria-label="Back">'
        '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>'
        '<span class="k2lbl">BACK</span></button>'
        '<div class="k2where"><small id="k2where-k">{w}</small>'
        '<b id="k2where-t">{t}</b></div>'
        '<button type="button" class="k2menu" onclick="k2Menu()"'
        ' aria-label="Menu">'
        '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
        '<span class="k2lbl">MENU</span></button>'
        '</div>'
    ).format(w=where, t=title)


def sheet(page_key, extra=None, extra_heading="On this page"):
    """The menu. The four pages first - the same four, in the same order,
    on every screen - then whatever this page can reach itself.

    extra: [(js_call, label, sub, count)] - a destination inside this page.
    """
    h = ['<div class="k2sheet" id="k2sheet">',
         '<div class="k2scrim" onclick="k2Shut()"></div>',
         '<div class="k2panel" role="dialog" aria-label="Menu">',
         '<div class="k2grab"></div>',
         '<div class="k2warn" id="k2warn" style="display:none"></div>',
         '<h4>Where do you want to go</h4>']
    for key, href, name, sub, who in PAGES:
        if key == page_key:
            #  THE ROW FOR THE PAGE YOU ARE ON, and it has to tell the
            #  truth. It used to be a dead tap marked YOU ARE HERE -
            #  which is a lie when you are three screens into the money
            #  pane, and a manager tapped it twice and then went hunting
            #  the edges of the screen. It is written by k2Menu() every
            #  time the sheet opens: standing on the page it says YOU
            #  ARE HERE and does nothing, standing INSIDE one of its
            #  screens it says so and takes you back out.
            #  (4 Aug 2026 - the one thing MENU could not do was get you
            #  home, and MENU covers up the two controls that could.)
            h.append(
                '<a class="k2on" id="k2here" href="#"'
                ' onclick="return k2HereTap()">'
                '<div class="k2t"><b>{n}</b>'
                '<span id="k2here-s">{s}</span></div>'
                '<span class="k2chev" id="k2here-c">YOU ARE HERE</span>'
                '</a>'.format(n=name, s=sub))
        else:
            #  NOT WRITTEN AT ALL on the worker page - not hidden, not
            #  greyed, not revealed later. A door that is not in the
            #  file cannot be opened by tapping around, by a stale
            #  session, or by anything I did not think of.
            if who == "staff" and page_key in WORKER_PAGES:
                continue
            h.append(
                '<a href="{u}" data-k2="{k}" onclick="k2Leave()">'
                '<div class="k2t"><b>{n}</b><span>{s}</span></div>'
                '<span class="k2chev">&rsaquo;</span></a>'.format(
                    u=href, k=key, n=name, s=sub))
    if extra:
        h.append('<h4>{}</h4>'.format(extra_heading))
        for call, label, sub, n in extra:
            h.append(
                '<button type="button" class="k2go" onclick="k2Shut();{c}">'
                '<div class="k2t"><b>{l}</b>{s}</div>{n}'
                '<span class="k2chev">&rsaquo;</span></button>'.format(
                    c=call, l=label,
                    s='<span>{}</span>'.format(sub) if sub else '',
                    n='<span class="k2n">{}</span>'.format(n)
                      if n not in (None, '') else ''))
    h.append('<button type="button" class="k2close" onclick="k2Shut()">'
             'Close</button>')
    h.append('</div></div>')
    return ''.join(h)


def detail_sheet():
    """An empty bottom sheet a page fills in and shows with k2Detail().

    It is a LAYER, not a screen: it sits over whatever you were looking
    at and BACK closes it before it does anything else. That way tapping
    a line to read it can never lose your place."""
    return ('<div class="k2det" id="k2det">'
            '<div class="k2scrim" onclick="k2DetShut()"></div>'
            '<div class="k2panel" role="dialog" aria-label="Detail">'
            '<div class="k2dhd"><b id="k2det-t"></b>'
            '<button type="button" onclick="k2DetShut()">CLOSE</button></div>'
            '<div class="k2dbd" id="k2det-b"></div>'
            '</div></div>')


def row(label, value, sub=""):
    """One line of a detail sheet: what it is, and what it says."""
    return ('<div class="k2row"><em>{l}</em><span>{v}{s}</span></div>'
            .format(l=label, v=value,
                    s='<small>{}</small>'.format(sub) if sub else ''))


def js(page_key, home_label, home_where="You are here"):
    """The behaviour. Written so that every branch has an answer - a
    Back button that can do nothing is worse than no Back button,
    because a bloke taps it twice and then stops trusting the screen."""
    parent = PARENT.get(page_key)
    return (_JS
            .replace("__PAGEKEY__", page_key)
            .replace("__PARENT__", "null" if not parent
                     else "'{}'".format(parent))
            .replace("__PARENTKEY__", _key_of(parent))
            .replace("__STAFF__", _json([p[0] for p in PAGES
                                         if p[4] == "staff"]))
            .replace("__WORKER__", _json(list(WORKER_PAGES)))
            .replace("__HOMELABEL__", _plain(home_label))
            .replace("__HOMEWHERE__", _plain(home_where))
            .replace("__HOMESUB__", _plain(
                next((x[3] for x in PAGES if x[0] == page_key), ""))))


def _json(seq):
    return "[" + ",".join("'{}'".format(x) for x in seq) + "]"


def _key_of(href):
    for k, u, _n, _s, _w in PAGES:
        if u == href:
            return k
    return ""


def _plain(s):
    """The bar is written with textContent, so it wants the WORD, not
    the HTML for it. "Who&rsquo;s got what" went in as markup and came
    out on the bar spelled exactly like that, ampersand and all.

    The curly quote goes in as itself. A straight one would close the JS
    string it is sitting in and kill the whole block - which is how a
    page of this suite shipped dead once already."""
    return (s.replace("&rsquo;", u"\u2019").replace("&amp;", "&")
             .replace("&mdash;", u"\u2014").replace("&middot;", u"\u00b7")
             .replace("'", u"\u2019"))


#  NOTE ON THE QUOTING. This is a raw string and there is not a single
#  bare apostrophe inside a JS string literal in it. A page of this suite
#  died silently once because "asset's" in a non-raw Python string became
#  a bare quote and closed the JS string - the file compiled, the page
#  built, and nothing on it ran. Anything possessive in here is written
#  as &rsquo; in the HTML, never as a quote in the script.
_JS = r"""
/* ------------------------------------------------------------------
   ONE WAY AROUND - the bar at the top of every My Gear page.

   THE TRAIL. These are four separate documents, so "where did I come
   from" cannot live in a variable. It lives in sessionStorage: each
   page writes itself down on arrival, and Back reads the one before.
   It dies with the browser tab, which is right - tomorrow morning is
   a fresh walk up to the window, not a continuation of yesterday.
------------------------------------------------------------------ */
var K2PAGE='__PAGEKEY__', K2PARENT=__PARENT__, K2PARENTKEY='__PARENTKEY__';
var K2HOME={t:'__HOMELABEL__',w:'__HOMEWHERE__'}, K2SUB='__HOMESUB__';
/* the page hands this over when it opens an inner screen: a name for
   the bar, and the one function that closes it again */
var K2VIEW=null;

function k2Trail(){
  try{ return JSON.parse(sessionStorage.getItem('k2trail')||'[]'); }
  catch(e){ return []; }
}
function k2Save(t){
  try{ sessionStorage.setItem('k2trail',JSON.stringify(t.slice(-8))); }
  catch(e){}
}
/* LEAVING ON PURPOSE. A menu tap is a step forward, so this page goes
   on the trail for the next one to come back to. */
function k2Leave(){
  var t=k2Trail();
  if(t[t.length-1]!==K2PAGE) t.push(K2PAGE);
  k2Save(t);
}
/* ARRIVING. If this page is already the last thing on the trail we came
   BACK to it, so take it off - otherwise Back would bounce between two
   pages for ever. */
function k2Here(){
  var t=k2Trail();
  while(t.length && t[t.length-1]===K2PAGE) t.pop();
  k2Save(t);
  k2Bar();
}
function k2Href(k){
  for(var i=0;i<K2MAP.length;i++) if(K2MAP[i][0]===k) return K2MAP[i][1];
  return null;
}
var K2MAP=[['index','index.html'],['stores','stores.html'],
           ['crew','crew.html'],['fleet','fleet.html']];
/*  the staff screens, and the pages that may not name them  */
var K2STAFFPAGES=__STAFF__, K2WORKER=__WORKER__;
function k2IsWorkerPage(){ return K2WORKER.indexOf(K2PAGE)>=0; }
function k2Nameable(k){
  /*  THE LINE, drawn where it belongs.

      A MENU row is an unconditional door - it is there for anyone who
      opens the sheet, whether or not they have ever been near the
      board. That is disclosure, and it is shut.

      A BACK destination off the TRAIL is not the same thing. The trail
      only ever holds pages this session actually opened, so BACK is
      returning a bloke to where he just was - which is its whole job,
      and is how a storeman gets from the board to the crew page and
      home again.

      This guard is for the PARENT fallback only: the invented
      destination used when there is no trail at all. Nothing may be
      invented onto a worker page.  */
  return !(k2IsWorkerPage() && K2STAFFPAGES.indexOf(k)>=0);
}

/* WHAT BACK SAYS IT WILL DO, so the label never lies */
function k2BackTo(){
  if(K2VIEW) return {kind:'view',label:K2HOME.t};
  var t=k2Trail();
  for(var i=t.length-1;i>=0;i--){
    var u=k2Href(t[i]);
    /*  i comes back too: BACK has to CUT the trail at the step it is
        going to, not add to it. It used to call the same k2Leave() a
        MENU tap calls, so walking back from the board to My Gear wrote
        "stores" down as somewhere you had been - and BACK on My Gear
        then offered to send you into the board you had just left.
        Two taps and a bloke is going in circles. (4 Aug 2026.)  */
    if(u && t[i]!==K2PAGE) return {kind:'page',url:u,label:t[i],at:i};
  }
  if(K2PARENT && k2Nameable(K2PARENTKEY))
    return {kind:'page',url:K2PARENT,label:'parent',at:-1};
  return null;
}
function k2Bar(){
  var b=document.getElementById('k2back');
  if(!b) return;
  var to=k2BackTo();
  /* Hidden, not disabled. A greyed-out button still asks to be pressed. */
  if(to) b.removeAttribute('hidden'); else b.setAttribute('hidden','');
}
/* THE BAR NAMES THE SCREEN. An inner screen puts its own name up and
   Back steps out of it; the front of the page puts the page name up. */
function k2Say(title,where){
  var t=document.getElementById('k2where-t'),
      w=document.getElementById('k2where-k');
  if(t) t.textContent=title;
  if(w) w.textContent=where||'You are here';
}
/* A page calls this when it opens an inner screen. close() is the ONE
   thing that puts it away again - the bar and the phone Back button
   both use it, so they can never disagree. */
function k2View(title,close,where){
  var was=K2VIEW&&K2VIEW.push;
  K2VIEW={t:title,close:close,push:1};
  k2Say(title,where||'You are in');
  k2Bar();
  /*  ONE LEVEL DOWN, NEVER TWO. The board is home and a pane is one
      step from it, so stepping straight from one pane to the next
      REPLACES the entry instead of adding one. Otherwise hopping
      find - chase - stocktake left three entries behind and a single
      Back went home, leaving two presses that did nothing.  */
  if(was){ try{ history.replaceState({k2:title},''); }catch(e){} }
  else k2Push({k2:title});
}
/*  OUR OWN ENTRIES, COUNTED. Anything this bar pushes, this bar takes
    back off - otherwise a closed menu leaves a live history entry and
    the phone Back button spends a press doing nothing. K2EATEN marks
    an unwind WE asked for, so the popstate handler below lets it
    through instead of treating it as the user pressing Back.  */
var K2PUSHED=0, K2EATEN=0;
var K2QUEUE=0;
function k2Push(st){
  /*  an unwind is queued and we are pushing again - they cancel, and
      the pair becomes what it always meant: replace this entry  */
  if(K2QUEUE>0){
    K2QUEUE--;
    try{ history.replaceState(st,''); }catch(e){}
    return;
  }
  try{ history.pushState(st,''); K2PUSHED++; }catch(e){}
}
function k2Unwind(){
  if(K2PUSHED<=0) return;
  K2QUEUE++;
  setTimeout(function(){
    if(K2QUEUE<=0) return;          /* a push cancelled it */
    K2QUEUE--;
    if(K2PUSHED<=0) return;
    K2PUSHED--; K2EATEN++;
    try{ history.back(); }catch(e){ K2EATEN--; }
  }, 0);
}
/* SOME PAGES ALREADY DRIVE THEIR OWN HISTORY - fleet.html routes off
   location.hash and has done since before this bar existed. Those call
   this instead: the bar still names the screen and Back still steps out
   of it, but nothing here touches the history stack. Two things both
   pushing an entry is how one Back skips a screen. */
function k2ViewOwn(title,close,where){
  K2VIEW={t:title,close:close,push:0};
  k2Say(title,where||'You are in');
  k2Bar();
}
function k2Home(){
  var had=K2VIEW && K2VIEW.push;
  K2VIEW=null;
  k2Say(K2HOME.t,K2HOME.w);
  k2Bar();
  /*  the page closed the screen itself (a Done button, a Start again,
      a keystroke) - so the entry that screen put on comes off too  */
  if(had) k2Unwind();
}
function k2Back(){
  /*  a sheet over the page comes off first - it is the thing on top  */
  if(k2DetOpen()){ k2DetShut(); return; }
  var to=k2BackTo();
  if(!to) return;
  if(to.kind==='view'){
    var v=K2VIEW;
    /* A screen this bar pushed comes off the stack the same way the
       phone Back button would take it off - one path, one outcome.
       K2VIEW is left standing for the popstate handler to clear; the
       page it belongs to is closed there, not here. */
    if(v&&v.push){ K2VIEW=null; k2Unwind(); k2Say(K2HOME.t,K2HOME.w);
      k2Bar(); if(v.close){ try{ v.close(); }catch(e){} } return; }
    K2VIEW=null;
    if(v&&v.close){ try{ v.close(); }catch(e){} }
    k2Home();
    return;
  }
  if(to.at>=0) k2Save(k2Trail().slice(0,to.at));
  window.location.href=to.url;
}
/* THE MENU */
function k2Menu(){
  var s=document.getElementById('k2sheet');
  if(!s||k2MenuOpen()) return;
  /*  say what the top row actually does BEFORE the sheet is on screen  */
  var sub=document.getElementById('k2here-s'),
      chev=document.getElementById('k2here-c'),
      row=document.getElementById('k2here');
  if(sub&&chev&&row){
    if(K2VIEW){
      sub.textContent='You are in '+K2VIEW.t+' — tap to come back out';
      chev.textContent='›';
      chev.style.fontSize='19px';
      row.style.opacity='';
    }else{
      sub.textContent=K2HOME.w==='You are here'?K2SUB:K2HOME.w;
      chev.textContent='YOU ARE HERE';
      chev.style.fontSize='11px';
    }
  }
  /*  a page may have something a bloke should know BEFORE he taps a
      row that leaves it - the stores board loses its manager unlock.
      It says so here rather than after the fact.  */
  var warn=document.getElementById('k2warn');
  if(warn){
    var msg=(typeof k2LeaveWarn==='function') ? k2LeaveWarn() : '';
    warn.textContent=msg||'';
    warn.style.display=msg?'block':'none';
  }
  s.className='k2sheet on';
  k2Push({k2menu:1});
}
/* ------------------------------------------------------------------
   THE DETAIL SHEET. A LAYER, not a screen.

   Tapping a line to read what it is must never cost you your place, so
   this sits OVER whatever you were looking at and BACK takes it off
   again before it does anything else. Order of precedence on a Back,
   from the top down: the menu, then a detail sheet, then an inner
   screen, then the page you came from. Each one is taken off by
   exactly one handler.
------------------------------------------------------------------ */
function k2DetOpen(){
  var d=document.getElementById('k2det');
  return !!(d && d.className.indexOf('on')>=0);
}
function k2Detail(title,html){
  var d=document.getElementById('k2det');
  if(!d) return;
  document.getElementById('k2det-t').innerHTML=title||'';
  var b=document.getElementById('k2det-b');
  b.innerHTML=html||''; b.scrollTop=0;
  if(!k2DetOpen()){
    d.className='k2det on';
    document.body.style.overflow='hidden';
    k2Push({k2det:1});
  }
}
function k2DetShut(){
  var d=document.getElementById('k2det');
  if(!d||!k2DetOpen()) return;
  d.className='k2det';
  document.body.style.overflow='';
  k2Unwind();
}
/*  Tapping the row you are standing on. Inside a screen it takes you
    back out - but only AFTER the menu has finished putting its own
    history entry back, or the two unwinds race and one is lost. The
    menu hands the job to the popstate handler below.  */
function k2HereTap(){
  if(K2VIEW) K2AFTER=k2Back;
  k2Shut();
  return false;
}
var K2AFTER=null;
function k2Shut(){
  var s=document.getElementById('k2sheet');
  if(!s||!k2MenuOpen()) return;
  s.className='k2sheet';
  k2Unwind();
}
function k2MenuOpen(){
  var s=document.getElementById('k2sheet');
  return !!(s && s.className.indexOf('on')>=0);
}
/* THE PHONE&rsquo;S OWN BACK BUTTON.
   It used to walk out of the whole app from any inner screen. Now it
   steps back one screen at a time.

   IT DOES NOT BARGE IN. Some pages already close a sheet or a guide on
   popstate. If one of those is open this handler keeps its hands off and
   lets the page&rsquo;s own handler do its job - two handlers both
   closing something on one Back is how you skip a screen. */
window.addEventListener('popstate',function(){
  /*  an unwind we asked for - already accounted for, nothing to do  */
  if(K2EATEN>0){
    K2EATEN--;
    var f=K2AFTER; K2AFTER=null;
    if(f) setTimeout(f,0);
    return;
  }
  if(K2PUSHED>0) K2PUSHED--;
  if(k2MenuOpen()){
    /*  close it WITHOUT unwinding: this Back already took the entry  */
    var sh=document.getElementById('k2sheet');
    if(sh) sh.className='k2sheet';
    return;
  }
  if(k2DetOpen()){
    var dt=document.getElementById('k2det');
    if(dt) dt.className='k2det';
    document.body.style.overflow='';
    return;
  }
  if(typeof k2OtherOpen==='function' && k2OtherOpen()) return;
  /* A screen the PAGE routes itself (fleet.html and its hash) is the
     page&rsquo;s to close. Touching it here would close it twice and
     skip a screen. */
  if(K2VIEW && K2VIEW.push){
    var c=K2VIEW.close;
    /*  the entry is already off - this Back took it - so clear the
        screen without asking for another unwind  */
    K2VIEW=null;
    k2Say(K2HOME.t,K2HOME.w); k2Bar();
    if(c){ try{ c(); }catch(e){} }
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'||e.keyCode===27){
    if(k2MenuOpen()) k2Shut();
    else if(k2DetOpen()) k2DetShut();
    else if(K2VIEW) k2Back();
  }
});
/* Record the arrival as soon as the bar exists. Never inside a
   DOMContentLoaded that might already have fired. */
(function(){
  function go(){ try{ k2Here(); }catch(e){} }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',go);
  else go();
})();
"""
