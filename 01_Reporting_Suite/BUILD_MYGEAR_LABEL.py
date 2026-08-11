#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | THE MY GEAR HQ LABEL - artwork for the Brother VC-500W
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Andrew, 6 Aug 2026: "can you make me a beautiful piece of artwork
#  for my brother vc500w. i want both qr codes. make this a scene to
#  suit MYGEAR HQ. artistic make this colour perfect."
#
#  WHY THIS ONE IS NOT THE DARK CINEMATIC LOOK, AND THAT IS THE
#  WHOLE CRAFT OF IT.
#  ------------------------------------------------------------------
#  The VC-500W is a ZINK printer: there is no ink: the colour lives
#  in the paper and heat wakes it up. That gives it three habits you
#  design around or fight forever:
#
#    1. It cannot lay down a deep black. Big dark fills come out a
#       streaky charcoal and drink the roll. Our #0A0E14 world -
#       which is glorious on a phone - prints like a wet newspaper.
#    2. Its happiest colours are warm. Coates orange is genuinely
#       the best thing this printer does, so the orange leads.
#    3. A QR ON A DARK GROUND OFTEN WILL NOT SCAN. Most readers
#       expect dark-on-light, and a muddy dark ground kills the
#       contrast the code lives on. A label with a QR that fails is
#       not artwork, it is litter.
#
#  So the scene is INVERTED on purpose: the paper's own white is the
#  light, the orange is the hero, and the charcoal appears only as
#  ink - type, rules, and the codes themselves. It is the same world
#  seen in daylight rather than at night, and it is the version of
#  that world this machine can actually print beautifully.
#
#  SIZE. 50 mm is the widest tape the VC-500W takes, so the art is
#  built at exactly 50 mm wide at the printer's own 313 dpi. Length
#  is free on a continuous roll; 90 mm gives the composition room.
#
#  Run it:  py BUILD_MYGEAR_LABEL.py
#  Output:  MyGear_HQ_Label_50mm.png   (print at 100%, no scaling)
# =====================================================================
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

DPI = 313.0                      # the VC-500W's native resolution
MM = DPI / 25.4                  # pixels per millimetre
W_MM, H_MM = 50.0, 91.5

#  The daylight palette. Same family as the screens, chosen for what
#  ZINK can actually hold.
ORANGE = (242, 98, 34)
DEEP = (198, 66, 12)             # the orange's own shadow
INK = (26, 30, 38)               # type - a true black would band
MUTE = (108, 118, 132)
PAPER = (255, 255, 255)
WARM = (255, 244, 236)           # the faintest warm ground
LINE = (226, 230, 236)


def qr_png(text, size_px, dark=INK):
    """A QR drawn as pixels, from the suite's own engine - so the
    label can never disagree with the posters."""
    from PIL import Image
    import qr_lite
    m = qr_lite.qr_matrix(text)
    n = len(m)
    quiet = 3                                    # the code needs air
    total = n + quiet * 2
    #  Whole-pixel modules only. A QR resampled with smooth scaling
    #  is a QR with soft edges, and soft edges are what a scanner
    #  fails on at arm's length under a work light.
    scale = max(1, int(size_px // total))
    img = Image.new('RGB', (total * scale, total * scale), PAPER)
    px = img.load()
    for y in range(n):
        for x in range(n):
            if m[y][x]:
                for dy in range(scale):
                    for dx in range(scale):
                        px[(x + quiet) * scale + dx,
                           (y + quiet) * scale + dy] = dark
    return img


def font(sz, bold=True):
    from PIL import ImageFont
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
              if bold else
              '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',):
        try:
            return ImageFont.truetype(p, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def build(url=None, wifi=None, wifi_name='', out=None):
    from PIL import Image, ImageDraw

    url = url or 'http://10.1.1.50:8000/index.html'
    wifi = wifi or 'WIFI:T:WPA;S:Coates K2 Store;P:coatesk2;;'
    wifi_name = wifi_name or 'Coates K2 Store'
    out = out or os.path.join(HERE, 'MyGear_HQ_Label_50mm.png')

    W, H = int(W_MM * MM), int(H_MM * MM)
    im = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(im)

    #  ---- the ground: a soft warm wash, lightest at the top --------
    for y in range(H):
        t = y / float(H)
        k = 1.0 - (t * 0.55)
        d.line([(0, y), (W, y)],
               fill=(int(PAPER[0] - (PAPER[0] - WARM[0]) * (1 - k)),
                     int(PAPER[1] - (PAPER[1] - WARM[1]) * (1 - k)),
                     int(PAPER[2] - (PAPER[2] - WARM[2]) * (1 - k))))

    #  ---- the header block: the one big field of orange -----------
    hh = int(20.5 * MM)
    for y in range(hh):
        t = y / float(hh)
        d.line([(0, y), (W, y)],
               fill=(int(ORANGE[0] + (DEEP[0] - ORANGE[0]) * t),
                     int(ORANGE[1] + (DEEP[1] - ORANGE[1]) * t),
                     int(ORANGE[2] + (DEEP[2] - ORANGE[2]) * t)))

    f_hq = font(int(3.6 * MM))
    f_my = font(int(6.6 * MM))
    f_kick = font(int(1.75 * MM))
    f_sub = font(int(1.95 * MM))

    #  MY GEAR, set as two weights the way the screens do it
    x = int(4.2 * MM)
    y = int(5.2 * MM)
    d.text((x, y), 'MY', font=f_my, fill=PAPER)
    wmy = d.textlength('MY ', font=f_my)
    d.text((x + wmy, y), 'GEAR', font=f_my, fill=(255, 233, 214))
    wg = d.textlength('MY GEAR ', font=f_my)
    d.text((x + wg, y + int(1.0 * MM)), 'HQ', font=f_hq, fill=PAPER)

    d.text((x + 2, int(2.6 * MM)), 'C O A T E S   ·   K 2   S H U T D O W N',
           font=f_kick, fill=(255, 226, 212))
    d.text((x, int(13.6 * MM)),
           'The tool store, on every phone on site.',
           font=f_sub, fill=(255, 238, 228))

    #  a thin ink rule under the block - the horizon line
    d.rectangle([0, hh, W, hh + int(0.45 * MM)], fill=INK)

    #  ---- the two codes -------------------------------------------
    #  Side by side, each on its own paper-white card so the scanner
    #  gets the contrast it needs no matter what the roll does.
    pad = int(3.2 * MM)
    gap = int(2.6 * MM)
    cw = (W - pad * 2 - gap) // 2
    ctop = hh + int(5.0 * MM)
    ch = cw + int(9.5 * MM)

    f_num = font(int(2.5 * MM))
    f_ttl = font(int(2.35 * MM))
    f_hint = font(int(1.7 * MM), bold=False)

    def card(cx, num, title, hint, payload):
        #  card body
        d.rounded_rectangle([cx, ctop, cx + cw, ctop + ch],
                            radius=int(1.6 * MM), fill=PAPER,
                            outline=LINE, width=max(1, int(0.18 * MM)))
        #  the numbered tab, in orange - the eye's order of operations
        tw, th = int(5.2 * MM), int(4.2 * MM)
        d.rounded_rectangle([cx, ctop, cx + tw, ctop + th],
                            radius=int(1.2 * MM), fill=ORANGE)
        d.rectangle([cx, ctop + th - int(1.2 * MM), cx + tw, ctop + th],
                    fill=ORANGE)
        nb = d.textbbox((0, 0), num, font=f_num)
        d.text((cx + (tw - (nb[2] - nb[0])) / 2 - nb[0],
                ctop + (th - (nb[3] - nb[1])) / 2 - nb[1]),
               num, font=f_num, fill=PAPER)
        d.text((cx + tw + int(1.4 * MM), ctop + int(1.15 * MM)),
               title, font=f_ttl, fill=INK)
        #  the code itself, whole pixels, quiet zone built in
        q = qr_png(payload, cw - int(2.6 * MM))
        qx = cx + (cw - q.width) // 2
        qy = ctop + th + int(1.4 * MM)
        im.paste(q, (qx, qy))
        d.text((cx + int(1.6 * MM), qy + q.height + int(1.2 * MM)),
               hint, font=f_hint, fill=MUTE)
        return qy + q.height

    card(pad, '1', 'Wi-Fi', 'Join ' + wifi_name[:16], wifi)
    card(pad + cw + gap, '2', 'My Gear', 'Then scan this one', url)

    #  ---- THE SCENE ------------------------------------------------
    #  Andrew asked for a scene, and a ZINK printer cannot give him
    #  the dark cinematic one - a photographic store at night comes
    #  off this machine as mud. So the store is drawn instead of
    #  photographed: a racking bay in orange line work, the gear
    #  hanging in silhouette, the floor line running off to the
    #  right. Line art is exactly what ZINK is good at - thin warm
    #  strokes on its own paper white - so it prints crisp at 313 dpi
    #  and still reads as our store at arm's length.
    def scene(sy, sh):
        """THE FRIEZE. Bold silhouettes, not a wireframe.

        The first cut of this was thin line work and it printed like
        a construction diagram - pale, fiddly, and half of it clipped.
        A ZINK printer wants what a stencil wants: few shapes, solid
        colour, honest edges. So the store becomes a frieze - the gear
        standing on a floor line in flat orange, the way it would look
        cut out of steel plate. Reads at arm's length, prints crisp,
        and unmistakably a tool store."""
        floor = sy + sh
        base = floor - int(0.55 * MM)
        O = ORANGE
        P = (250, 176, 138)          # the pieces set further back

        #  the floor line the whole frieze stands on
        d.rectangle([pad, base, W - pad, base + int(0.5 * MM)], fill=O)

        #  --- a step ladder, open, on the left -----------------------
        lx = pad + int(1.2 * MM)
        lt = base - int(13.0 * MM)
        for dx1, dx2 in ((0, int(3.4 * MM)), (int(4.6 * MM), int(1.2 * MM))):
            d.polygon([(lx + dx1, lt), (lx + dx1 + int(0.7 * MM), lt),
                       (lx + dx2 + int(1.5 * MM), base),
                       (lx + dx2 + int(0.6 * MM), base)], fill=P)
        for i in range(4):           # the treads
            ry = lt + int(2.6 * MM) + i * int(2.7 * MM)
            d.rectangle([lx + int(0.5 * MM), ry,
                         lx + int(5.2 * MM), ry + int(0.55 * MM)], fill=P)

        #  --- a chain block, hanging, centre-left --------------------
        cx2 = pad + int(12.5 * MM)
        top = sy + int(0.8 * MM)
        d.arc([cx2 - int(1.5 * MM), top, cx2 + int(1.5 * MM),
               top + int(2.6 * MM)], 195, 345, fill=O,
              width=max(2, int(0.55 * MM)))
        d.rounded_rectangle([cx2 - int(2.2 * MM), top + int(2.4 * MM),
                             cx2 + int(2.2 * MM), top + int(6.6 * MM)],
                            radius=int(0.7 * MM), fill=O)
        for i in range(4):
            ly = top + int(6.6 * MM) + i * int(1.35 * MM)
            d.ellipse([cx2 - int(0.7 * MM), ly, cx2 + int(0.7 * MM),
                       ly + int(1.2 * MM)], outline=O,
                      width=max(2, int(0.4 * MM)))
        hy = top + int(6.6 * MM) + 4 * int(1.35 * MM)
        d.arc([cx2 - int(1.4 * MM), hy, cx2 + int(1.4 * MM),
               hy + int(2.6 * MM)], 15, 165, fill=O,
              width=max(2, int(0.55 * MM)))

        #  --- a hard hat on the floor, centre ------------------------
        hx = pad + int(19.5 * MM)
        d.pieslice([hx, base - int(4.6 * MM), hx + int(7.6 * MM),
                    base + int(2.4 * MM)], 180, 360, fill=O)
        d.rectangle([hx - int(0.9 * MM), base - int(1.0 * MM),
                     hx + int(8.5 * MM), base - int(0.2 * MM)], fill=O)

        #  --- a big spanner leaning, right of centre -----------------
        sx = pad + int(30.0 * MM)
        st = base - int(15.0 * MM)
        d.line([(sx, st + int(2.0 * MM)),
                (sx + int(3.6 * MM), base - int(1.2 * MM))],
               fill=O, width=max(2, int(1.15 * MM)))
        d.ellipse([sx - int(1.7 * MM), st, sx + int(1.7 * MM),
                   st + int(3.4 * MM)], outline=O,
                  width=max(2, int(0.75 * MM)))
        d.polygon([(sx + int(3.0 * MM), base - int(3.4 * MM)),
                   (sx + int(5.6 * MM), base - int(1.6 * MM)),
                   (sx + int(4.5 * MM), base - int(0.2 * MM)),
                   (sx + int(2.1 * MM), base - int(2.0 * MM))], fill=O)

        #  --- a gas bottle and a drum, far right ---------------------
        gx = W - pad - int(8.2 * MM)
        d.rounded_rectangle([gx, base - int(11.5 * MM), gx + int(3.4 * MM),
                             base], radius=int(1.4 * MM), fill=P)
        d.rectangle([gx + int(1.3 * MM), base - int(13.0 * MM),
                     gx + int(2.1 * MM), base - int(11.0 * MM)], fill=P)
        bx = W - pad - int(4.0 * MM)
        d.rounded_rectangle([bx, base - int(6.6 * MM), bx + int(3.6 * MM),
                             base], radius=int(0.5 * MM), fill=O)
        for i in range(2):
            ry = base - int(5.0 * MM) + i * int(2.2 * MM)
            d.rectangle([bx, ry, bx + int(3.6 * MM), ry + int(0.5 * MM)],
                        fill=(255, 232, 216))

    scene(ctop + ch + int(3.4 * MM), int(17.5 * MM))

    #  ---- the closing line -----------------------------------------
    fy = ctop + ch + int(23.5 * MM)
    d.rectangle([pad, fy, W - pad, fy + max(1, int(0.3 * MM))],
                fill=ORANGE)

    f_val = font(int(1.62 * MM))
    f_ft = font(int(1.5 * MM), bold=False)
    d.text((pad, fy + int(2.0 * MM)),
           'No app  ·  No password  ·  Any phone',
           font=f_val, fill=INK)
    d.text((pad, fy + int(4.6 * MM)),
           'Care Deeply · Customer Focused · Be Our Best',
           font=f_ft, fill=MUTE)
    d.text((pad, fy + int(6.7 * MM)),
           'One Team · Competitive Spirit',
           font=f_ft, fill=MUTE)
    d.text((pad, fy + int(9.4 * MM)),
           'POWERED BY SITEIQ', font=f_val, fill=ORANGE)
    d.text((W - pad - d.textlength('Author: Andrew Fisher', font=f_ft),
            fy + int(9.6 * MM)),
           'Author: Andrew Fisher', font=f_ft, fill=MUTE)

    im.save(out, dpi=(int(DPI), int(DPI)))
    return out, W, H


if __name__ == '__main__':
    p, w, h = build()
    print('=' * 66)
    print(' COATES | MY GEAR HQ LABEL - Brother VC-500W')
    print('=' * 66)
    print(' {} x {} px at {:.0f} dpi  =  {:.0f} x {:.0f} mm'.format(
        w, h, DPI, W_MM, H_MM))
    print(' Print at 100% on 50 mm tape - do not let the driver scale it.')
    print(' Written: ' + p)
