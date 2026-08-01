# ==========================================================
#  COATES | FLEET FINDER - "can we get one?" - INTERNAL ONLY
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | MY GEAR HQ
#
#  Reads the MyBranch "Fleet Listing by Availability Status"
#  export (drop it in Fleet\ - the newest .xlsx wins) and
#  builds a searchable board of the whole branch network:
#  what's Available where, how long it has sat, what it cost
#  and what it is worth now.
#
#  The job it does: a client asks for a machine the K2 store
#  doesn't have. Instead of a phone-around, search the model -
#  "1 Available at Biloela, 2 at Rockhampton, idle 30 days" -
#  and the counter's answer becomes "we can have one here."
#
#  COATES INTERNAL. This page carries cost and WDV - it never
#  joins a client pack, never goes on the store Wi-Fi pages.
#
#  MY GEAR HQ - designed and built by Andrew Fisher.
# ==========================================================
import datetime as dt
import glob
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FLEET_DIR = os.path.join(HERE, "Fleet")
TODAY = dt.date.today()

README = """FLEET FINDER - HOW THIS FOLDER WORKS
=====================================

Drop the MyBranch export here:

    "Metric Details for Fleet Listing by Availability Status"
    (Reports > MyBranch > Fleet Listing, export to Excel)

Then double-click 60_RUN_FLEET_FINDER.bat.

* The NEWEST .xlsx in this folder is the one that gets read -
  old ones can stay, they are simply ignored.
* The export is a snapshot of the day you pulled it. Pull a
  fresh one when you want fresh answers.

COATES INTERNAL - the page this builds carries cost and WDV.
It never joins a client pack.
"""


def make_folder():
    if not os.path.isdir(FLEET_DIR):
        os.makedirs(FLEET_DIR)
    rm = os.path.join(FLEET_DIR, "_READ_ME_FIRST.txt")
    if not os.path.isfile(rm):
        with open(rm, "w", encoding="utf-8") as f:
            f.write(README)


def find_export():
    files = [p for p in glob.glob(os.path.join(FLEET_DIR, "*.xlsx"))
             if not os.path.basename(p).startswith("~")]
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def read_fleet(path):
    """Header-driven so a column shuffle in MyBranch doesn't break us."""
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    hdr = None
    for r in rows:
        cells = [str(c).strip() if c is not None else "" for c in r]
        if "Branch" in cells and "Plant Number" in cells:
            hdr = {name: i for i, name in enumerate(cells)}
            break
    if hdr is None:
        raise SystemExit("  That file doesn't look like the MyBranch "
                         "fleet listing (no Branch / Plant Number header).")

    def col(r, name):
        i = hdr.get(name)
        if i is None or i >= len(r):
            return ""
        v = r[i]
        return "" if v is None else v

    out = []
    for r in rows:
        br = str(col(r, "Branch")).strip()
        if not br:
            continue
        try:
            cost = float(col(r, "Original Cost") or 0)
        except (TypeError, ValueError):
            cost = 0.0
        try:
            wdv = float(col(r, "WDV") or 0)
        except (TypeError, ValueError):
            wdv = 0.0
        try:
            days = int(float(col(r, "Days in Status") or 0))
        except (TypeError, ValueError):
            days = 0
        out.append({
            "b": br,
            "c": str(col(r, "Category")).strip(),
            "t": str(col(r, "Type")).strip(),
            "m": str(col(r, "Model")).strip(),
            "p": str(col(r, "Plant Number")).strip(),
            "a": str(col(r, "Availability")).strip(),
            "d": days,
            "oc": round(cost),
            "wv": round(wdv),
        })
    return out


#  Token-swapped, never .format() - the suite rule: CSS braces and
#  .format() ended badly once already.
PAGE = """<!DOCTYPE html><!-- MY GEAR HQ · Fleet Finder · designed and built by Andrew Fisher --><html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fleet Finder · COATES INTERNAL</title><style>
:root{--org:#F26222;--ink:#0A0E14;--pnl:#151A22;--line:#2A3340;--txt:#E9EEF5;
 --dim:#98A4B4;--gd:#2BB673;--am:#F5A623;--rd:#E23B2E}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ink);color:var(--txt);font-family:'Segoe UI',Arial,sans-serif;font-size:15px}
.wrap{max-width:1060px;margin:0 auto;padding:0 14px 70px}
.intbar{background:var(--rd);color:#fff;text-align:center;font-weight:800;
 letter-spacing:3px;font-size:11px;padding:6px}
header{padding:18px 0 10px;text-align:center}
.hqm{font-size:30px;font-weight:900;letter-spacing:1px}
.hqm b{color:var(--org)}
.sub{color:var(--dim);font-size:12px;letter-spacing:1.5px;margin-top:4px}
.tiles{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:14px 0}
.tile{background:var(--pnl);border:1px solid var(--line);border-radius:10px;
 padding:10px 16px;text-align:center;min-width:130px}
.tile b{display:block;font-size:22px;color:var(--org)}
.tile span{font-size:10px;letter-spacing:1.5px;color:var(--dim)}
.searchrow{display:flex;gap:8px;margin:6px 0 10px}
#q{flex:1;background:var(--pnl);border:1px solid var(--line);border-radius:10px;
 color:var(--txt);font-size:17px;padding:12px 15px;outline:none}
#q:focus{border-color:var(--org)}
.chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
.chip{border:1px solid var(--line);background:var(--pnl);color:var(--dim);
 border-radius:99px;font-size:12px;font-weight:700;padding:6px 13px;cursor:pointer}
.chip.on{background:var(--org);border-color:var(--org);color:#fff}
.grp{background:var(--pnl);border:1px solid var(--line);border-radius:11px;
 margin-bottom:10px;overflow:hidden}
.gh{display:flex;justify-content:space-between;gap:10px;padding:10px 14px;
 border-bottom:1px solid var(--line);align-items:baseline}
.gh b{font-size:15px}
.gh span{font-size:11.5px;color:var(--dim);white-space:nowrap}
.gh .avn{color:var(--gd);font-weight:800}
table{width:100%;border-collapse:collapse;font-size:12.5px}
td{padding:6px 14px;border-top:1px solid #1D242E;color:#C7CED8;white-space:nowrap}
tr:first-child td{border-top:0}
td.av{font-weight:800}
.AV{color:var(--gd)}.OH{color:var(--am)}.XX{color:var(--dim)}
td.money{text-align:right;font-variant-numeric:tabular-nums}
.note{color:var(--dim);font-size:12px;margin:14px 0;text-align:center;line-height:1.6}
.ft{margin-top:26px;text-align:center;color:#5A6472;font-size:9.5px;
 letter-spacing:2px;font-weight:700}
</style></head><body>
<div class="intbar">COATES INTERNAL &middot; COST &amp; WDV ON PAGE &middot; NEVER FOR CLIENT PACKS</div>
<div class="wrap">
<header><div class="hqm">FLEET <b>FINDER</b></div>
<div class="sub">CAN WE GET ONE? &middot; THE BRANCH NETWORK ON ONE PAGE &middot; SNAPSHOT __ASOF__</div></header>
<div class="tiles">
<div class="tile"><b>__NALL__</b><span>UNITS LISTED</span></div>
<div class="tile"><b>__NAV__</b><span>AVAILABLE NOW</span></div>
<div class="tile"><b>__NBR__</b><span>BRANCHES</span></div>
<div class="tile"><b>__NGL__</b><span>GLADSTONE UNITS</span></div>
</div>
<div class="searchrow"><input id="q" placeholder="Search a machine — welder, boom, generator, tower, plant number…" autocomplete="off"></div>
<div class="chips">
<div class="chip on" data-f="av">Available only</div>
<div class="chip" data-f="all">Everything</div>
<div class="chip" data-f="near">Central QLD first</div>
</div>
<div id="out"></div>
<div class="note">Type at least 3 letters. Grouped by model — greens are on a shelf somewhere right now.<br>
Snapshot data: pull a fresh MyBranch export into the Fleet folder for fresh answers.</div>
<div class="ft">MY GEAR HQ &middot; SOURCE: MYBRANCH FLEET LISTING &middot; DESIGNED &amp; BUILT BY ANDREW FISHER</div>
</div>
<script>
var D=__DATA__;
var NEAR=["GLST","BILO","ROKH","MAKY","EMER","NOIS"];
var mode="av",near=false;
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")}
function money(n){return n?("$"+Number(n).toLocaleString()):"—"}
function cls(a){return a==="Available"?"AV":(a.indexOf("On Hire")===0?"OH":"XX")}
function run(){
  var q=document.getElementById("q").value.trim().toLowerCase();
  var out=document.getElementById("out");
  if(q.length<3){out.innerHTML="";return}
  var hits=[];
  for(var i=0;i<D.length;i++){var r=D[i];
    var hay=(r.m+" "+r.t+" "+r.c+" "+r.p).toLowerCase();
    if(hay.indexOf(q)<0)continue;
    if(mode==="av"&&r.a!=="Available")continue;
    hits.push(r);
    if(hits.length>900)break;}
  var g={};
  hits.forEach(function(r){(g[r.m]=g[r.m]||[]).push(r)});
  var keys=Object.keys(g).sort(function(a,b){
    var av=function(k){return g[k].filter(function(r){return r.a==="Available"}).length};
    return av(b)-av(a)});
  var htm="";
  keys.slice(0,40).forEach(function(k){
    var rows=g[k];
    rows.sort(function(a,b){
      var na=near?(NEAR.indexOf(a.b.slice(0,4))+1||99):0,
          nb=near?(NEAR.indexOf(b.b.slice(0,4))+1||99):0;
      if(na!==nb)return na-nb;
      if(a.a!==b.a)return a.a==="Available"?-1:1;
      return a.d-b.d});
    var avn=rows.filter(function(r){return r.a==="Available"}).length;
    htm+="<div class='grp'><div class='gh'><b>"+esc(k)+"</b><span><i class='avn'>"
      +avn+" available</i> · "+rows.length+" in network</span></div><table>";
    rows.slice(0,14).forEach(function(r){
      htm+="<tr><td>"+esc(r.b)+"</td><td class='av "+cls(r.a)+"'>"+esc(r.a)
        +"</td><td>"+r.d+"d in status</td><td>#"+esc(r.p)
        +"</td><td class='money'>cost "+money(r.oc)
        +"</td><td class='money'>WDV "+money(r.wv)+"</td></tr>"});
    if(rows.length>14)htm+="<tr><td colspan='6' style='color:#5A6472'>+ "
      +(rows.length-14)+" more — refine the search</td></tr>";
    htm+="</table></div>"});
  if(!htm)htm="<div class='note'>Nothing matched — try fewer words.</div>";
  out.innerHTML=htm;
}
document.getElementById("q").addEventListener("input",run);
document.querySelectorAll(".chip").forEach(function(c){
  c.addEventListener("click",function(){
    var f=c.getAttribute("data-f");
    if(f==="near"){near=!near;c.classList.toggle("on",near)}
    else{mode=f;document.querySelectorAll(".chip").forEach(function(x){
      var xf=x.getAttribute("data-f");
      if(xf!=="near")x.classList.toggle("on",xf===f)})}
    run()});
});
</script></body></html>"""


def main():
    make_folder()
    src = find_export()
    print("=" * 66)
    print(" COATES | FLEET FINDER - can we get one?  (INTERNAL)")
    print("=" * 66)
    if not src:
        print("  No fleet export found.")
        print("  Drop the MyBranch 'Fleet Listing by Availability Status'")
        print("  .xlsx into the Fleet folder, then run me again.")
        print("  (The folder has a READ ME with the exact steps.)")
        return 1
    print("  Reading: " + os.path.basename(src))
    rows = read_fleet(src)
    asof = dt.datetime.fromtimestamp(os.path.getmtime(src)).strftime("%d %b %Y")
    n_av = sum(1 for r in rows if r["a"] == "Available")
    n_br = len(set(r["b"] for r in rows))
    n_gl = sum(1 for r in rows if r["b"].startswith("GLST"))
    out_dir = os.path.join(HERE, "Reports", TODAY.isoformat())
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir,
                       "Coates_K2_Fleet_Finder_INTERNAL_%s.html" % TODAY.isoformat())
    page = (PAGE
            .replace("__DATA__", json.dumps(rows, separators=(",", ":"),
                                            ensure_ascii=True))
            .replace("__ASOF__", html.escape(asof))
            .replace("__NALL__", "{:,}".format(len(rows)))
            .replace("__NAV__", "{:,}".format(n_av))
            .replace("__NBR__", str(n_br))
            .replace("__NGL__", "{:,}".format(n_gl)))
    with open(out, "w", encoding="utf-8") as f:
        f.write(page)
    print("  {:,} units across {} branches - {:,} Available now.".format(
        len(rows), n_br, n_av))
    print("  Gladstone units on the list: {:,}".format(n_gl))
    print("  Written: " + os.path.relpath(out, HERE))
    print("  COATES INTERNAL - cost and WDV on page. Not for clients.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyboardInterrupt, SystemExit):
        raise
    except BaseException as e:
        print("  Something went wrong: %r" % (e,))
        sys.exit(1)
