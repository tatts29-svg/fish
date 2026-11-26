#!/usr/bin/env python3
"""Put product photos into the Coates picture look used on the tooling packs:
black studio background, warm orange light on the floor, a soft reflection
and a thin orange frame.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python style_pictures.py IN_FOLDER OUT_FOLDER

IN_FOLDER holds photos on a white background and an index.csv. Each photo is
cut out of its white background and set on the dark stage; the product itself
is not redrawn or altered. OUT_FOLDER gets a 512 x 512 JPEG per photo and a
copy of the index. Pictures stay outside git.
"""
import os
import shutil
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIDE, ORANGE = 512, (242, 98, 34)


def cut_out(im):
    """The product with the white around it made see-through. Only white that
    touches the edge of the photo is removed, so white parts of the product stay."""
    im = im.convert("RGB")
    if max(im.size) > 1400:
        im.thumbnail((1400, 1400), Image.LANCZOS)
    im = Image.merge("RGB", im.split())
    pad = Image.new("RGB", (im.width + 8, im.height + 8), (255, 255, 255))
    pad.paste(im, (4, 4))
    low = pad.point(lambda v: 255 if v >= 249 else 0).convert("L")
    r, g, b = pad.split()
    white = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v >= 249 else 0)
    ImageDraw.floodfill(white, (0, 0), 128)                                   # white reachable from the border
    back = white.point(lambda v: 255 if v == 128 else 0)
    alpha = ImageChops.invert(back).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = pad.convert("RGBA")
    out.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    return out.crop(box) if box else out


def stage():
    """The empty dark stage: black, with a warm pool of light on the floor."""
    base = Image.new("RGB", (SIDE, SIDE), (4, 4, 5))
    glow = Image.new("RGB", (SIDE, SIDE), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.ellipse((40, 330, SIDE - 40, 470), fill=(120, 48, 16))
    d.ellipse((150, 360, SIDE - 150, 440), fill=(200, 86, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(46))
    base = ImageChops.screen(base, glow)
    top = Image.new("RGB", (SIDE, SIDE), (0, 0, 0))
    ImageDraw.Draw(top).ellipse((120, 60, SIDE - 120, 300), fill=(26, 24, 24))
    return ImageChops.screen(base, top.filter(ImageFilter.GaussianBlur(70)))


def styled(photo):
    prod = cut_out(photo)
    box_w, box_h = 380, 290                                                   # where the product sits
    scale = min(box_w / prod.width, box_h / prod.height)
    prod = prod.resize((max(1, round(prod.width * scale)), max(1, round(prod.height * scale))), Image.LANCZOS)
    x, floor = (SIDE - prod.width) // 2, 372
    y = floor - prod.height
    canvas = stage().convert("RGBA")
    alpha = prod.getchannel("A")
    # a warm rim of light behind the product
    rim = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    halo = Image.new("L", (SIDE, SIDE), 0)
    halo.paste(alpha, (x, y))
    wide = halo.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(20)).point(lambda v: int(v * 0.75))
    rim.paste(Image.new("RGBA", (SIDE, SIDE), ORANGE + (255,)), (0, 0), wide)
    canvas = Image.alpha_composite(canvas, rim)
    # and a bright orange outline hugging its edge
    edge = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    line = halo.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(3))
    edge.paste(Image.new("RGBA", (SIDE, SIDE), (255, 122, 61, 255)), (0, 0), line)
    canvas = Image.alpha_composite(canvas, edge)
    # the reflection on the floor, fading out
    refl = prod.transpose(Image.FLIP_TOP_BOTTOM)
    fade = Image.new("L", refl.size, 0)
    fd = ImageDraw.Draw(fade)
    depth = min(refl.height, 110)
    for i in range(depth):
        fd.line((0, i, refl.width, i), fill=int(88 * (1 - i / depth) ** 1.6))
    refl.putalpha(ImageChops.multiply(refl.getchannel("A"), fade))
    refl = refl.filter(ImageFilter.GaussianBlur(1.6))
    layer = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    layer.paste(refl, (x, floor + 2), refl)
    canvas = Image.alpha_composite(canvas, layer)
    # a contact shadow, then the product itself, untouched
    shadow = Image.new("L", (SIDE, SIDE), 0)
    ImageDraw.Draw(shadow).ellipse((x + 6, floor - 7, x + prod.width - 6, floor + 9), fill=150)
    dark = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 255))
    dark.putalpha(shadow.filter(ImageFilter.GaussianBlur(7)))
    canvas = Image.alpha_composite(canvas, dark)
    layer = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    layer.paste(prod, (x, y), prod)
    canvas = Image.alpha_composite(canvas, layer)
    # the thin orange frame, with a little glow
    frame = Image.new("RGBA", (SIDE, SIDE), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((9, 9, SIDE - 10, SIDE - 10), radius=22, outline=ORANGE + (255,), width=3)
    soft = frame.filter(ImageFilter.GaussianBlur(5))
    canvas = Image.alpha_composite(Image.alpha_composite(canvas, soft), frame)
    return canvas.convert("RGB")


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    src, dst = argv[0], argv[1]
    os.makedirs(dst, exist_ok=True)
    done = 0
    for name in sorted(os.listdir(src)):
        if name.lower().endswith((".jpg", ".jpeg", ".png")):
            styled(Image.open(os.path.join(src, name))).save(os.path.join(dst, os.path.splitext(name)[0] + ".jpg"), "JPEG", quality=90)
            done += 1
    if os.path.isfile(os.path.join(src, "index.csv")):
        shutil.copy(os.path.join(src, "index.csv"), os.path.join(dst, "index.csv"))
    print("{} pictures styled  ->  {}".format(done, dst))
    return 0


if __name__ == "__main__":
    sys.exit(main())
