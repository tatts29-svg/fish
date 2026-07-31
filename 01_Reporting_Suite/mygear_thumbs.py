#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR THUMBNAILS - a picture for every product variant
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 30 Jul 2026): "having a thumbnail of what the item
#  looks like in my gear ... what if i got thumbnails for everything /
#  for product variants". The register speaks variant codes
#  (BATCORDMIL18V5AH is every Milwaukee 18V 5Ah battery on site), so
#  ONE photo per variant covers every serialised item behind it.
#
#  THE DEAL:
#    Photos\                 <- Andrew drops pictures in, named by the
#                               variant code (BATCORDMIL18V5AH.jpg) or
#                               consumable SKU (CEME9016-590674.jpg).
#                               Any size, any source - phone, website.
#    Gear_Lookup\thumbs\     <- this module shrinks each one to a fast
#                               ~120px thumbnail the pages lazy-load.
#
#  Run 56_PHOTO_HUNT for the wanted list (every code, its plain name,
#  and search links). The shrinking uses the same headless Edge/Chrome
#  the PDFs use - browser_engine finds it - so nothing gets installed.
#  Incremental: only new or changed photos are re-shrunk, so the
#  morning build stays quick. No browser on the machine = photos wait,
#  the build says so, nothing breaks.
# =====================================================================
import base64
import json
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = 384           # thumbnail edge, px - showroom-grid sharp on phones

PHOTOS_README = """\
DROP GEAR PHOTOS IN HERE
========================
One picture per product variant, named by its code:

    BATCORDMIL18V5AH.jpg      <- covers EVERY Milwaukee 18V 5Ah battery
    CEME9016-590674.jpg       <- a consumable, by its SKU number

Run 56_PHOTO_HUNT.bat for the full wanted list - every code, what it
is in plain English, and a search button each. jpg or png, any size,
any source (phone photo of the shelf beats a studio shot). The next
04 build shrinks them and the pictures appear in My Gear.
"""


def safe_name(code):
    """The filename a code can actually be saved under. Windows bans
    \\ / : * ? " < > | in filenames, and 275 register codes carry one
    (SOCKET1/2DR11MM, TRAILERMINIEXCAVATOR<4.5T) - so their photos
    arrive with those swapped to _ (Andrew's 790-variant pack,
    31 Jul 2026). Every lookup between a code and a file goes
    through here; the pages do the same swap in tsafe()."""
    return re.sub(r'[\\/:*?"<>|]', '_', code)


def photos_dir(here=None):
    d = os.path.join(here or HERE, 'Photos')
    os.makedirs(d, exist_ok=True)
    rd = os.path.join(d, '_READ_ME_FIRST.txt')
    if not os.path.isfile(rd):
        try:
            with open(rd, 'w', encoding='utf-8') as f:
                f.write(PHOTOS_README)
        except OSError:
            pass
    return d


def variant_register(here=None):
    """Every code a photo can be named after: rental PRODUCT_VARIANTs
    and consumable SKU numbers, with plain names, families and how many
    items ride behind each - straight off the newest exports."""
    import glob
    import openpyxl
    here = here or HERE
    out = {}

    def gfind(pat):
        hits = []
        for d in (os.path.join(here, 'Data_SiteIQ'), here):
            hits += [p for p in glob.glob(os.path.join(d, pat))
                     if not os.path.basename(p).startswith('~$')]
        return max(hits, key=os.path.getmtime) if hits else None

    rp = gfind('RENTAL_STOCK*.xlsx')
    if rp:
        wb = openpyxl.load_workbook(rp, read_only=True, data_only=True)
        rows = list(wb['RENTAL_STOCK'].iter_rows(values_only=True))
        wb.close()
        ix = {str(v or '').strip(): i for i, v in enumerate(rows[0])}
        for r in rows[1:]:
            code = str(r[ix.get('PRODUCT_VARIANT', -1)] or '').strip().upper()
            if not code:
                continue
            e = out.setdefault(code, {'n': '', 'f': '', 'q': 0, 'k': 'hire'})
            e['q'] += 1
            if not e['n']:
                e['n'] = str(r[ix.get('ITEM_DESCRIPTION', -1)] or '').strip()
                e['f'] = str(r[ix.get('PRODUCT_FAMILY', -1)] or '').strip().title()
    sp = gfind('SALES_STOCK*.xlsx')
    if sp:
        wb = openpyxl.load_workbook(sp, read_only=True, data_only=True)
        ws = wb['SALES_STOCK'] if 'SALES_STOCK' in wb.sheetnames else wb.active
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
        ix = {str(v or '').strip(): i for i, v in enumerate(rows[0])}
        for r in rows[1:]:
            code = str(r[ix.get('SKU_NUMBER', -1)] or '').strip().upper()
            if not code or code in out:
                continue
            desc = str(r[ix.get('SKU_DESCRIPTION', -1)] or '').strip()
            if not desc:
                continue
            try:
                q = int(float(r[ix.get('AVAILABLE_QUANTITY', -1)] or 0))
            except (TypeError, ValueError):
                q = 0
            out[code] = {'n': desc, 'f': 'Consumables', 'q': q, 'k': 'cons'}
    return out


#  what a browser will decode on a canvas - so what a photo may arrive
#  as. Google Images saves .webp and .jfif more often than .jpg, and
#  those used to be silently ignored: the file sat in Photos\ while the
#  hunt said wanted. (31 Jul 2026)
PHOTO_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.jfif', '.gif', '.bmp')


def _photo_files(here=None):
    """Photos\\ and one level of subfolders - a zip of pictures dragged
    in whole (folder and all) still counts, nobody has to know to
    flatten it first (30 Jul 2026, Andrew's consumables pack arrived
    exactly like that).

    Browsers save a replacement download as "CODE (1).jpg" instead of
    overwriting - that suffix is stripped so the replacement still
    lands on its code, and where two files claim the same code the
    NEWEST wins, so saving a better picture always takes effect
    (31 Jul 2026)."""
    d = photos_dir(here)
    out = {}
    dirs = [d] + sorted(os.path.join(d, s) for s in os.listdir(d)
                        if os.path.isdir(os.path.join(d, s)))
    for dd in dirs:
        for fn in sorted(os.listdir(dd)):
            stem, ext = os.path.splitext(fn)
            if ext.lower() not in PHOTO_EXTS or fn.startswith('_'):
                continue
            stem = re.sub(r'\s*\(\d+\)$', '', stem.strip()).strip().upper()
            if not stem:
                continue
            p = os.path.join(dd, fn)
            if stem in out and os.path.getmtime(out[stem]) >= os.path.getmtime(p):
                continue
            out[stem] = p
    return out


def blocklist(here=None):
    """Pictures ruled WRONG by the audit - wrong_pictures.json in the
    suite root maps a code to the reason its picture was binned
    ("shows a drill, item is a grinder"). A blocked code stays
    pictureless until a photo NEWER than the blocklist file lands in
    Photos\\ - dropping a replacement in just works, nothing to edit.
    Returns ({safe_code: reason}, blocklist_mtime). (31 Jul 2026)"""
    p = os.path.join(here or HERE, 'wrong_pictures.json')
    try:
        with open(p, encoding='utf-8') as f:
            raw = json.load(f)
        return ({safe_name(str(k)).upper(): str(v) for k, v in raw.items()},
                os.path.getmtime(p))
    except (OSError, ValueError):
        return ({}, 0)


def thumb_count(here=None):
    """How many pictures the pages can actually serve - counts
    Gear_Lookup\\thumbs itself, so thumbnails that ARRIVED ready-made
    (the audited variant pack ships straight into that folder, 31 Jul
    2026) count the same as ones shrunk from Photos\\ on this machine."""
    tdir = os.path.join(here or HERE, 'Gear_Lookup', 'thumbs')
    try:
        return sum(1 for n in os.listdir(tdir) if n.lower().endswith('.jpg'))
    except OSError:
        return 0


def refresh(here=None, quiet=False):
    """Shrink new/changed photos into Gear_Lookup\\thumbs. Returns
    (photos_found, thumbs_made_now, thumbs_served_total)."""
    here = here or HERE
    photos = _photo_files(here)
    tdir = os.path.join(here, 'Gear_Lookup', 'thumbs')
    os.makedirs(tdir, exist_ok=True)

    def tpath(code):
        return os.path.join(tdir, code + '.jpg')
    #  the audit's blocklist: a picture ruled wrong is ignored - and its
    #  already-shrunk thumb cleared, photo or no photo behind it - unless
    #  a picture NEWER than the blocklist has been dropped in, which
    #  means it was replaced and the replacement is welcome.
    blocked, bstamp = blocklist(here)
    for c in blocked:
        if c in photos and os.path.getmtime(photos[c]) > bstamp:
            continue
        photos.pop(c, None)
        try:
            if (os.path.isfile(tpath(c))
                    and os.path.getmtime(tpath(c)) <= bstamp):
                os.remove(tpath(c))
        except OSError:
            pass
    #  bumping SIZE regenerates the lot once: a marker file remembers
    #  the size the folder was built at (31 Jul 2026 - grid went big)
    marker = os.path.join(tdir, '_size.txt')
    try:
        old_size = open(marker).read().strip()
    except OSError:
        old_size = ''
    rebuild_all = old_size != str(SIZE)
    pend = [(c, p) for c, p in photos.items()
            if rebuild_all or not os.path.isfile(tpath(c))
            or os.path.getmtime(tpath(c)) < os.path.getmtime(p)]
    if not pend:
        return (len(photos), 0, thumb_count(here))
    try:
        with open(marker, 'w') as f:
            f.write(str(SIZE))
    except OSError:
        pass
    try:
        import browser_engine
        browser = browser_engine.find_browser()
        extra = browser_engine.extra_args()
    except Exception:
        browser, extra = None, []
    if not browser:
        if not quiet:
            print('  Thumbnails: {} new photo(s) waiting - no headless '
                  'browser on this machine to shrink them.'.format(len(pend)))
        return (len(photos), 0, thumb_count(here))

    made = 0
    prof = os.path.join(tempfile.gettempdir(), 'coates_thumbs_prof')
    for k in range(0, len(pend), 50):
        batch = pend[k:k + 50]
        items = []
        for code, p in batch:
            url = 'file:///' + os.path.abspath(p).replace('\\', '/').replace(' ', '%20')
            items.append([code, url])
        page = ('<!DOCTYPE html><html><body><pre id=out></pre><script>'
                'var IT=' + json.dumps(items) + ';var R={},left=IT.length;'
                'function fin(){document.getElementById("out").textContent='
                '"@@"+JSON.stringify(R)+"@@";}'
                'IT.forEach(function(it){var im=new Image();'
                'im.onload=function(){try{'
                'var c=document.createElement("canvas");'
                'c.width=' + str(SIZE) + ';c.height=' + str(SIZE) + ';'
                'var x=c.getContext("2d");x.fillStyle="#fff";'
                'x.fillRect(0,0,c.width,c.height);'
                'var s=Math.max(c.width/im.width,c.height/im.height);'
                'var w=im.width*s,h=im.height*s;'
                'x.drawImage(im,(c.width-w)/2,(c.height-h)/2,w,h);'
                'R[it[0]]=c.toDataURL("image/jpeg",0.82);}catch(e){R[it[0]]="";}'
                'if(--left===0)fin();};'
                'im.onerror=function(){R[it[0]]="";if(--left===0)fin();};'
                'im.src=it[1];});'
                '</script></body></html>')
        hp = os.path.join(tempfile.gettempdir(), 'coates_thumb_batch.html')
        with open(hp, 'w', encoding='utf-8') as f:
            f.write(page)
        try:
            r = subprocess.run(
                [browser, '--headless', '--disable-gpu', '--no-first-run',
                 '--user-data-dir=' + prof, '--allow-file-access-from-files',
                 '--virtual-time-budget=30000', '--dump-dom'] + extra +
                ['file:///' + hp.replace('\\', '/')],
                capture_output=True, timeout=180)
            dom = r.stdout.decode('utf-8', 'replace')
        except Exception:
            dom = ''
        m = re.search(r'@@(\{.*?\})@@', dom, re.S)
        if not m:
            continue
        try:
            res = json.loads(m.group(1))
        except ValueError:
            continue
        for code, dataurl in res.items():
            if not dataurl or ',' not in dataurl:
                continue
            try:
                raw = base64.b64decode(dataurl.split(',', 1)[1])
                with open(tpath(code), 'wb') as f:
                    f.write(raw)
                made += 1
            except Exception:
                continue
    return (len(photos), made, thumb_count(here))


if __name__ == '__main__':
    n, made, ready = refresh()
    print('Photos: {} | shrunk this run: {} | thumbnails ready: {}'.format(
        n, made, ready))
    sys.exit(0)
