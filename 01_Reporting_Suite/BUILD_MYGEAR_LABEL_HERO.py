#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR HQ - the hero label for the Brother VC-500W
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 6 Aug 2026: "u can do a lot better than that."
#
#  He was right, and the fault was mine: I DREW a tool store out of
#  polygons while sitting on 381 distinct pieces of real cinematic
#  product photography. Crude shapes next to that art was never going
#  to be the piece he puts on the window.
#
#  THE THING THAT MAKES THIS WORK. Every one of the 1,171 renders was
#  shot to the same house style - the same charcoal ground, the same
#  warm floor glow, the same low orange rim light. So they are not
#  separate pictures at all: feather their edges and they MERGE, and
#  three tools become one continuous scene that was never photo-
#  graphed. The catalogue builds its own hero shot.
#
#  Everything else follows the same two rules as before: a QR must
#  sit on white, so the white panels are the light in the picture;
#  and ZINK cannot hold a true black, so the dark is a warm near-
#  black with real tonal range in it rather than a flat slab.
#
#  Run it:  py BUILD_MYGEAR_LABEL_HERO.py
#  Output:  MyGear_HQ_Label_HERO_50mm.png   (print at 100%)
# =====================================================================
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

DPI = 313.0
MM = DPI / 25.4
W_MM, H_MM = 50.0, 104.0

ORANGE = (242, 98, 34)
EMBER = (255, 156, 78)
PAPER = (255, 255, 255)
INK = (17, 20, 26)
NIGHT = (11, 13, 17)

#  The three that make the scene: something rigged, something
#  powered, something that keeps a man alive. The whole store in one
#  frame.
HEROES = ('BOWSHACKLEALLOY1T', 'BREAKERAIRLIGHT',
          'HONEYWELLBWFLEXMULTIGASDETECTOR')


def find_thumb(stem):
    import glob
    p = os.path.join(HERE, 'Gear_Lookup', 'thumbs', stem + '.jpg')
    if os.path.isfile(p):
        return p
    hits = glob.glob(os.path.join(HERE, 'Gear_Lookup', 'thumbs',
                                  stem[:14] + '*.jpg'))
    return hits[0] if hits else None


def qr_png(text, size_px):
    from PIL import Image
    import qr_lite
    m = qr_lite.qr_matrix(text)
    n = len(m)
    quiet, total = 3, len(m) + 6
    scale = max(1, int(size_px // total))
    img = Image.new('RGB', (total * scale, total * scale), PAPER)
    px = img.load()
    for y in range(n):
        for x in range(n):
            if m[y][x]:
                for dy in range(scale):
                    for dx in range(scale):
                        px[(x + quiet) * scale + dx,
                           (y + quiet) * scale + dy] = INK
    return img


def font(sz, bold=True):
    from PIL import ImageFont
    p = ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold
         else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    try:
        return ImageFont.truetype(p, sz)
    except OSError:
        return ImageFont.load_default()


def feathered(img, size, feather):
    """One render, edges dissolved, ready to merge with its
    neighbours. Because every render shares the same ground, a
    feathered edge leaves no seam - the tools simply stand in the
    same room."""
    from PIL import Image, ImageDraw, ImageFilter
    im = img.convert('RGB').resize((size, size), Image.LANCZOS)
    #  A blurred ellipse still leaves the render's own square edge
    #  faintly visible - you can see the boxes. A real radial falloff
    #  reaches zero well before the corner, so there is no edge left
    #  to see and the tools simply stand in the same dark room.
    m = Image.new('L', (size, size), 0)
    px = m.load()
    c = (size - 1) / 2.0
    inner, outer = c * 0.52, c * 0.99
    for yy in range(size):
        dy = (yy - c) ** 2
        for xx in range(size):
            r = (dy + (xx - c) ** 2) ** 0.5
            if r <= inner:
                px[xx, yy] = 255
            elif r < outer:
                t = (r - inner) / (outer - inner)
                px[xx, yy] = int(255 * (1 - t) ** 1.6)
    m = m.filter(ImageFilter.GaussianBlur(feather * 0.5))
    return im, m


def build(url=None, wifi=None, wifi_name='', out=None):
    from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

    url = url or 'http://10.1.1.50:8000/index.html'
    wifi = wifi or 'WIFI:T:WPA;S:Coates K2 Store;P:coatesk2;;'
    wifi_name = wifi_name or 'Coates K2 Store'
    out = out or os.path.join(HERE, 'MyGear_HQ_Label_HERO_50mm.png')

    W, H = int(W_MM * MM), int(H_MM * MM)
    im = Image.new('RGB', (W, H), NIGHT)
    d = ImageDraw.Draw(im)

    # ---- THE HERO SCENE, built from the catalogue itself ----------
    band = int(46.0 * MM)
    scene = Image.new('RGB', (W, band), NIGHT)

    layout = [(HEROES[1], int(30 * MM), int(10.5 * MM), int(5.5 * MM), 0.52),
              (HEROES[0], int(28 * MM), -int(3.5 * MM), int(16.0 * MM), 1.0),
              (HEROES[2], int(25 * MM), int(27.0 * MM), int(19.5 * MM), 0.92)]
    for stem, size, x, y, strength in layout:
        p = find_thumb(stem)
        if not p:
            continue
        src_im, mask = feathered(Image.open(p), size, size * 0.09)
        if strength < 1.0:                 # push it back into the dark
            src_im = ImageEnhance.Brightness(src_im).enhance(strength)
        scene.paste(src_im, (x, y), mask)

    #  grade it: lift the warmth, then sink the top and bottom so the
    #  type has somewhere quiet to sit
    scene = ImageEnhance.Color(scene).enhance(1.18)
    scene = ImageEnhance.Contrast(scene).enhance(1.10)
    grad = Image.new('L', (W, band), 0)
    gd = ImageDraw.Draw(grad)
    top_fade = int(21.0 * MM)
    for i in range(top_fade):
        gd.line([(0, i), (W, i)],
                fill=int(252 * (1 - i / float(top_fade)) ** 0.75))
    bot = int(14.0 * MM)
    for i in range(bot):
        gd.line([(0, band - 1 - i), (W, band - 1 - i)],
                fill=int(255 * (1 - i / float(bot)) ** 0.8))
    scene.paste(Image.new('RGB', (W, band), NIGHT), (0, 0), grad)
    im.paste(scene, (0, 0))

    #  a low ember bloom where the scene meets the dark
    bl = Image.new('L', (W, H), 0)
    bd = ImageDraw.Draw(bl)
    bd.ellipse([-int(6 * MM), band - int(15 * MM), W + int(6 * MM),
                band + int(4 * MM)], fill=64)
    bl = bl.filter(ImageFilter.GaussianBlur(int(4.0 * MM)))
    im.paste(Image.new('RGB', (W, H), ORANGE), (0, 0), bl)

    # ---- the wordmark, sitting in the dark at the top -------------
    f_my = font(int(6.9 * MM))
    f_hq = font(int(2.9 * MM))
    f_kick = font(int(1.72 * MM))
    f_sub = font(int(1.92 * MM), bold=False)

    x = int(3.6 * MM)
    d.text((x + 1, int(3.4 * MM)),
           'C O A T E S   ·   K 2   S H U T D O W N',
           font=f_kick, fill=(255, 186, 146))
    ty = int(6.6 * MM)
    d.text((x, ty), 'MY', font=f_my, fill=PAPER)
    wmy = d.textlength('MY ', font=f_my)
    halo = Image.new('L', (W, H), 0)
    hd = ImageDraw.Draw(halo)
    hd.text((x + wmy, ty), 'GEAR', font=f_my, fill=210)
    halo = halo.filter(ImageFilter.GaussianBlur(int(1.2 * MM)))
    im.paste(Image.new('RGB', (W, H), ORANGE), (0, 0), halo)
    d.text((x + wmy, ty), 'GEAR', font=f_my, fill=EMBER)
    wg = d.textlength('MY GEAR ', font=f_my)
    d.text((x + wg, ty + int(1.6 * MM)), 'HQ', font=f_hq, fill=PAPER)
    d.text((x + 1, int(14.6 * MM)),
           'The tool store, on every phone on site.',
           font=f_sub, fill=(216, 206, 200))

    # ---- the two lit panels ---------------------------------------
    pad = int(3.4 * MM)
    gap = int(2.8 * MM)
    cw = (W - pad * 2 - gap) // 2
    ctop = band + int(4.2 * MM)
    ch = cw + int(10.5 * MM)

    #  a real drop shadow under each panel - they sit ON the scene
    sh = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(sh)
    for cx in (pad, pad + cw + gap):
        sd.rounded_rectangle([cx - int(0.8 * MM), ctop + int(0.8 * MM),
                              cx + cw + int(0.8 * MM),
                              ctop + ch + int(2.2 * MM)],
                             radius=int(2.4 * MM), fill=170)
    sh = sh.filter(ImageFilter.GaussianBlur(int(1.6 * MM)))
    im.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), sh)
    #  and the light they throw back into the room
    gl = Image.new('L', (W, H), 0)
    gd2 = ImageDraw.Draw(gl)
    for cx in (pad, pad + cw + gap):
        gd2.rounded_rectangle([cx - int(2.2 * MM), ctop - int(2.2 * MM),
                               cx + cw + int(2.2 * MM),
                               ctop + ch + int(2.2 * MM)],
                              radius=int(3.4 * MM), fill=88)
    gl = gl.filter(ImageFilter.GaussianBlur(int(3.0 * MM)))
    im.paste(Image.new('RGB', (W, H), (255, 190, 140)), (0, 0), gl)

    f_num = font(int(2.6 * MM))
    f_ttl = font(int(2.4 * MM))
    f_hint = font(int(1.66 * MM), bold=False)

    def panel(cx, num, title, hint, payload):
        d.rounded_rectangle([cx, ctop, cx + cw, ctop + ch],
                            radius=int(2.0 * MM), fill=PAPER)
        tw, th = int(5.6 * MM), int(4.4 * MM)
        d.rounded_rectangle([cx, ctop, cx + tw, ctop + th],
                            radius=int(1.4 * MM), fill=ORANGE)
        d.rectangle([cx, ctop + th - int(1.4 * MM), cx + tw, ctop + th],
                    fill=ORANGE)
        d.rectangle([cx, ctop, cx + int(1.4 * MM), ctop + th], fill=ORANGE)
        nb = d.textbbox((0, 0), num, font=f_num)
        d.text((cx + (tw - (nb[2] - nb[0])) / 2 - nb[0],
                ctop + (th - (nb[3] - nb[1])) / 2 - nb[1]),
               num, font=f_num, fill=PAPER)
        d.text((cx + tw + int(1.5 * MM), ctop + int(1.2 * MM)),
               title, font=f_ttl, fill=INK)
        q = qr_png(payload, cw - int(2.8 * MM))
        qx = cx + (cw - q.width) // 2
        qy = ctop + th + int(1.5 * MM)
        im.paste(q, (qx, qy))
        d.text((cx + int(1.8 * MM), qy + q.height + int(1.5 * MM)),
               hint, font=f_hint, fill=(96, 104, 118))

    panel(pad, '1', 'Wi-Fi', 'Join ' + wifi_name[:15], wifi)
    panel(pad + cw + gap, '2', 'My Gear', 'Then scan this', url)

    # ---- the contact strip: the catalogue, in miniature ------------
    #  Eight real items in a row - it says "everything in this store"
    #  in a way a sentence cannot.
    import glob as _g
    import hashlib
    strip_y = ctop + ch + int(4.6 * MM)
    sz = int(5.2 * MM)
    seen, tiles = set(), []
    for p in sorted(_g.glob(os.path.join(HERE, 'Gear_Lookup', 'thumbs',
                                         '*.jpg'))):
        h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        if h in seen:
            continue
        seen.add(h)
        tiles.append(p)
        if len(tiles) >= 260:
            break
    step = max(1, len(tiles) // 8)
    row = [tiles[i * step] for i in range(8) if i * step < len(tiles)]
    gapx = (W - pad * 2 - sz * len(row)) // max(1, len(row) - 1)
    for i, p in enumerate(row):
        t = Image.open(p).convert('RGB').resize((sz, sz), Image.LANCZOS)
        t = ImageEnhance.Brightness(t).enhance(0.86)
        m = Image.new('L', (sz, sz), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, sz - 1, sz - 1],
                                            radius=int(0.9 * MM), fill=255)
        im.paste(t, (pad + i * (sz + gapx), strip_y), m)

    # ---- the closing line -----------------------------------------
    f_val = font(int(1.66 * MM))
    f_ft = font(int(1.5 * MM), bold=False)
    fy = strip_y + sz + int(3.4 * MM)
    d.rectangle([pad, fy - int(1.6 * MM), pad + int(9 * MM),
                 fy - int(1.3 * MM)], fill=ORANGE)
    d.text((pad, fy), 'No app  ·  No password  ·  Any phone',
           font=f_val, fill=(238, 230, 224))
    d.text((pad, fy + int(2.6 * MM)),
           'Care Deeply · Customer Focused · Be Our Best · One Team',
           font=f_ft, fill=(138, 130, 126))
    d.text((pad, fy + int(4.5 * MM)), 'Competitive Spirit',
           font=f_ft, fill=(138, 130, 126))
    d.text((pad, fy + int(7.0 * MM)), 'POWERED BY SITEIQ',
           font=f_val, fill=EMBER)
    d.text((W - pad - d.textlength('Andrew Fisher', font=f_ft),
            fy + int(7.2 * MM)), 'Andrew Fisher', font=f_ft,
           fill=(132, 124, 120))

    im.save(out, dpi=(int(DPI), int(DPI)))
    return out, W, H


if __name__ == '__main__':
    p, w, h = build()
    print('=' * 66)
    print(' COATES | MY GEAR HQ - THE HERO LABEL')
    print('=' * 66)
    print(' {} x {} px at {:.0f} dpi = {:.0f} x {:.0f} mm'.format(
        w, h, DPI, W_MM, H_MM))
    print(' The hero scene is built from the catalogue itself - three')
    print(' renders feathered into one room, because every one of them')
    print(' was shot to the same house style.')
    print(' Print at 100% on 50 mm tape.')
    print(' Written: ' + p)
