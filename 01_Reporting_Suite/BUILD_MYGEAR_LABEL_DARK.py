#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR HQ - the dark label for the Brother VC-500W
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 6 Aug 2026: "i have 50mm. i want something dark. really
#  showcase it. looks boring."
#
#  He is right. The daylight version was safe and safe is boring, and
#  this is the piece people will actually stand and look at.
#
#  SO: the night version - and the trick that makes it work on a ZINK
#  printer is not to fight the one hard rule but to USE it. A QR still
#  has to sit on white or it will not scan. Instead of apologising for
#  those white squares, they become the LIGHT IN THE PICTURE: two lit
#  panels glowing in a dark store, orange bleeding off their edges,
#  the gear standing in silhouette against them. The thing the printer
#  demands turns into the thing the composition is built on.
#
#  What is still true about ZINK: a deep black comes out charcoal and
#  drinks more of the roll. So the ground is a WARM near-black that
#  the machine can actually hold, lit unevenly the way a real store
#  is, rather than a flat slab of ink it will band across.
#
#  Run it:  py BUILD_MYGEAR_LABEL_DARK.py
#  Output:  MyGear_HQ_Label_DARK_50mm.png  (print at 100%, no scaling)
# =====================================================================
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

DPI = 313.0
MM = DPI / 25.4
W_MM, H_MM = 50.0, 100.0

ORANGE = (242, 98, 34)
EMBER = (255, 150, 70)
GROUND = (22, 24, 30)            # warm near-black - printable
DEEPER = (13, 15, 20)
PAPER = (255, 255, 255)
INK = (18, 21, 27)
HAZE = (255, 176, 120)


def qr_png(text, size_px):
    """Whole-pixel modules - a soft-edged QR is a QR that fails."""
    from PIL import Image
    import qr_lite
    m = qr_lite.qr_matrix(text)
    n = len(m)
    quiet = 3
    total = n + quiet * 2
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


def build(url=None, wifi=None, wifi_name='', out=None):
    from PIL import Image, ImageDraw, ImageFilter

    url = url or 'http://10.1.1.50:8000/index.html'
    wifi = wifi or 'WIFI:T:WPA;S:Coates K2 Store;P:coatesk2;;'
    wifi_name = wifi_name or 'Coates K2 Store'
    out = out or os.path.join(HERE, 'MyGear_HQ_Label_DARK_50mm.png')

    W, H = int(W_MM * MM), int(H_MM * MM)
    im = Image.new('RGB', (W, H), GROUND)
    d = ImageDraw.Draw(im)

    #  ---- the ground, lit unevenly like a real store ---------------
    for y in range(H):
        t = y / float(H)
        k = 1.0 - abs(t - 0.62) * 1.4          # brightest around the codes
        k = max(0.0, min(1.0, k))
        d.line([(0, y), (W, y)],
               fill=(int(DEEPER[0] + (GROUND[0] - DEEPER[0]) * k),
                     int(DEEPER[1] + (GROUND[1] - DEEPER[1]) * k),
                     int(DEEPER[2] + (GROUND[2] - DEEPER[2]) * k)))

    #  a warm pool low on the label - the floor glow of the store
    glow = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(glow)
    #  a pool AT the horizon the gear stands on - not a wash over the
    #  whole lower half, which is what the first cut did and it turned
    #  the silhouettes into a muddy orange field.
    gd.ellipse([-int(8 * MM), int(80 * MM), W + int(8 * MM),
                int(99 * MM)], fill=175)
    gd.ellipse([int(8 * MM), int(24 * MM), W - int(8 * MM),
                int(40 * MM)], fill=42)
    glow = glow.filter(ImageFilter.GaussianBlur(int(3.4 * MM)))
    im.paste(Image.new('RGB', (W, H), ORANGE), (0, 0), glow)

    #  ---- the wordmark ---------------------------------------------
    f_my = font(int(6.9 * MM))
    f_hq = font(int(2.9 * MM))
    f_kick = font(int(1.7 * MM))
    f_sub = font(int(1.95 * MM), bold=False)

    #  a bar of ember behind the type - the light it is standing in
    band = Image.new('L', (W, H), 0)
    bd = ImageDraw.Draw(band)
    bd.rectangle([0, int(9.0 * MM), W, int(18.0 * MM)], fill=110)
    band = band.filter(ImageFilter.GaussianBlur(int(3.2 * MM)))
    im.paste(Image.new('RGB', (W, H), (120, 40, 12)), (0, 0), band)

    x = int(3.6 * MM)
    d.text((x + 1, int(4.0 * MM)),
           'C O A T E S   ·   K 2   S H U T D O W N',
           font=f_kick, fill=(255, 190, 150))
    ty = int(7.4 * MM)
    d.text((x, ty), 'MY', font=f_my, fill=PAPER)
    wmy = d.textlength('MY ', font=f_my)
    #  GEAR in ember, with its own halo - the hero word
    tmp = Image.new('L', (W, H), 0)
    td = ImageDraw.Draw(tmp)
    td.text((x + wmy, ty), 'GEAR', font=f_my, fill=200)
    tmp = tmp.filter(ImageFilter.GaussianBlur(int(1.1 * MM)))
    im.paste(Image.new('RGB', (W, H), ORANGE), (0, 0), tmp)
    d.text((x + wmy, ty), 'GEAR', font=f_my, fill=EMBER)
    wg = d.textlength('MY GEAR ', font=f_my)
    d.text((x + wg, ty + int(1.6 * MM)), 'HQ', font=f_hq, fill=PAPER)
    d.text((x + 1, int(17.6 * MM)),
           'The tool store, on every phone on site.',
           font=f_sub, fill=(226, 214, 206))

    #  ---- the two lit panels ---------------------------------------
    pad = int(3.4 * MM)
    gap = int(2.8 * MM)
    cw = (W - pad * 2 - gap) // 2
    ctop = int(26.0 * MM)
    ch = cw + int(10.5 * MM)

    #  the halo each panel throws into the dark
    halo = Image.new('L', (W, H), 0)
    hd = ImageDraw.Draw(halo)
    for cx in (pad, pad + cw + gap):
        hd.rounded_rectangle([cx - int(1.6 * MM), ctop - int(1.6 * MM),
                              cx + cw + int(1.6 * MM),
                              ctop + ch + int(1.6 * MM)],
                             radius=int(3 * MM), fill=130)
    halo = halo.filter(ImageFilter.GaussianBlur(int(2.6 * MM)))
    im.paste(Image.new('RGB', (W, H), HAZE), (0, 0), halo)

    f_num = font(int(2.6 * MM))
    f_ttl = font(int(2.4 * MM))
    f_hint = font(int(1.68 * MM), bold=False)

    def panel(cx, num, title, hint, payload):
        d.rounded_rectangle([cx, ctop, cx + cw, ctop + ch],
                            radius=int(2.0 * MM), fill=PAPER)
        #  the orange tab, top-left, reading as a lit edge
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

    #  ---- the silhouette frieze, standing in the glow --------------
    #  Solid near-black against the lit floor: the store at night, and
    #  the one shape language ZINK renders cleanly at this size.
    base = H - int(13.5 * MM)
    S = (14, 16, 21)

    #  the horizon: a bar of ember the gear stands against
    hz = Image.new('L', (W, H), 0)
    hzd = ImageDraw.Draw(hz)
    hzd.rectangle([0, base - int(2.0 * MM), W, base + int(1.0 * MM)],
                  fill=190)
    hz = hz.filter(ImageFilter.GaussianBlur(int(1.8 * MM)))
    im.paste(Image.new('RGB', (W, H), EMBER), (0, 0), hz)

    #  step ladder
    lx = pad
    lt = base - int(11.5 * MM)
    for a, b2 in ((0, int(3.0 * MM)), (int(4.2 * MM), int(1.0 * MM))):
        d.polygon([(lx + a, lt), (lx + a + int(0.75 * MM), lt),
                   (lx + b2 + int(1.5 * MM), base),
                   (lx + b2 + int(0.6 * MM), base)], fill=S)
    for i in range(4):
        ry = lt + int(2.4 * MM) + i * int(2.4 * MM)
        d.rectangle([lx + int(0.5 * MM), ry, lx + int(4.8 * MM),
                     ry + int(0.6 * MM)], fill=S)

    #  chain block on its chain
    cx2 = pad + int(11.5 * MM)
    top = base - int(15.5 * MM)
    d.arc([cx2 - int(1.5 * MM), top, cx2 + int(1.5 * MM),
           top + int(2.6 * MM)], 195, 345, fill=S,
          width=max(2, int(0.6 * MM)))
    d.rounded_rectangle([cx2 - int(2.2 * MM), top + int(2.4 * MM),
                         cx2 + int(2.2 * MM), top + int(6.4 * MM)],
                        radius=int(0.7 * MM), fill=S)
    for i in range(4):
        ly = top + int(6.4 * MM) + i * int(1.5 * MM)
        d.ellipse([cx2 - int(0.75 * MM), ly, cx2 + int(0.75 * MM),
                   ly + int(1.3 * MM)], outline=S,
                  width=max(2, int(0.42 * MM)))

    #  hard hat
    hx = pad + int(18.0 * MM)
    d.pieslice([hx, base - int(4.4 * MM), hx + int(7.4 * MM),
                base + int(2.4 * MM)], 180, 360, fill=S)
    d.rectangle([hx - int(0.9 * MM), base - int(0.9 * MM),
                 hx + int(8.3 * MM), base - int(0.1 * MM)], fill=S)

    #  the big spanner
    sx = pad + int(28.5 * MM)
    st = base - int(14.0 * MM)
    d.line([(sx, st + int(2.0 * MM)),
            (sx + int(3.4 * MM), base - int(1.0 * MM))],
           fill=S, width=max(2, int(1.2 * MM)))
    d.ellipse([sx - int(1.8 * MM), st, sx + int(1.8 * MM),
               st + int(3.6 * MM)], outline=S, width=max(2, int(0.8 * MM)))
    d.polygon([(sx + int(2.8 * MM), base - int(3.2 * MM)),
               (sx + int(5.4 * MM), base - int(1.5 * MM)),
               (sx + int(4.3 * MM), base - int(0.1 * MM)),
               (sx + int(1.9 * MM), base - int(1.8 * MM))], fill=S)

    #  gas bottle and drum
    gx = W - pad - int(7.6 * MM)
    d.rounded_rectangle([gx, base - int(10.5 * MM), gx + int(3.2 * MM),
                         base], radius=int(1.3 * MM), fill=S)
    d.rectangle([gx + int(1.2 * MM), base - int(11.8 * MM),
                 gx + int(2.0 * MM), base - int(10.0 * MM)], fill=S)
    bx = W - pad - int(3.6 * MM)
    d.rounded_rectangle([bx, base - int(6.2 * MM), bx + int(3.4 * MM),
                         base], radius=int(0.5 * MM), fill=S)

    #  ---- the closing line -----------------------------------------
    f_val = font(int(1.66 * MM))
    f_ft = font(int(1.52 * MM), bold=False)
    fy = base + int(3.0 * MM)
    d.text((pad, fy), 'No app  ·  No password  ·  Any phone',
           font=f_val, fill=(240, 232, 226))
    d.text((pad, fy + int(2.6 * MM)),
           'Care Deeply · Customer Focused · Be Our Best',
           font=f_ft, fill=(150, 142, 138))
    d.text((pad, fy + int(4.5 * MM)),
           'One Team · Competitive Spirit',
           font=f_ft, fill=(150, 142, 138))
    d.text((pad, fy + int(7.2 * MM)), 'POWERED BY SITEIQ',
           font=f_val, fill=EMBER)
    d.text((W - pad - d.textlength('Andrew Fisher', font=f_ft),
            fy + int(7.4 * MM)), 'Andrew Fisher', font=f_ft,
           fill=(140, 132, 128))

    im.save(out, dpi=(int(DPI), int(DPI)))
    return out, W, H


if __name__ == '__main__':
    p, w, h = build()
    print('=' * 66)
    print(' COATES | MY GEAR HQ - THE DARK LABEL')
    print('=' * 66)
    print(' {} x {} px at {:.0f} dpi  =  {:.0f} x {:.0f} mm'.format(
        w, h, DPI, W_MM, H_MM))
    print(' The white panels are the light in the picture AND what the')
    print(' scanner needs - the one rule and the composition agree.')
    print(' Print at 100% on 50 mm tape. A dark label uses more of the')
    print(' roll than a light one - that is the trade for the look.')
    print(' Written: ' + p)
