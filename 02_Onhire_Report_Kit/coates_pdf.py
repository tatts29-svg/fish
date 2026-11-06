#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | coates_pdf.py - the PDF writer that travels with the kit
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY THIS EXISTS
#  The company pack has to come out as a PDF on a laptop that has
#  nothing installed and no internet - the same promise the rest of the
#  kit makes. No browser to find, no print driver, no library to pip.
#  So this is a small, plain PDF writer, standard library only, that
#  draws exactly what a Coates report needs and nothing it doesn't:
#
#     text in Inter - the kit carries the typeface in _fonts\ and only
#     the characters a pack uses are embedded, so the file stays small
#     and looks the same on every machine (Helvetica if the folder is
#     missing) - filled boxes, rules, rounded chips, right- and
#     centre-aligned text, word wrap, "Page 3 of 14", bookmarks down
#     the side of Acrobat, and links from a contents page to its
#     sections.
#
#  HOW TO USE IT
#     doc = Document(title="...", author="Andrew Fisher")
#     doc.new_page()
#     doc.rect(36, 36, 200, 40, fill="#1D1D1B")
#     doc.text(44, 62, "COATES", size=16, bold=True, colour="#F26222")
#     doc.save("out.pdf")
#
#  Coordinates are POINTS (72 to the inch) measured from the TOP-LEFT
#  of the page, like every layout tool people are used to. Text y is
#  the BASELINE. The flip to PDF's bottom-left origin happens once, on
#  the way out, so nobody has to think about it.
#
#  It writes PDF 1.4, the most widely readable version there is, with
#  compressed page streams. Opens in Edge, Acrobat, Preview, a phone.
# =====================================================================
import datetime as dt
import zlib

A4 = (595.28, 841.89)
A4_LANDSCAPE = (841.89, 595.28)

#  Character widths per 1000 em, indexed by Windows-1252 code, for
#  Helvetica and Helvetica-Bold (the Adobe standard metrics). Oblique
#  shares Helvetica's. These are what make right-alignment, wrapping
#  and ellipsis come out exactly, not roughly.
_W_REG = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500]
_W_BOLD = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,350,556,350,278,556,500,1000,556,556,333,1000,667,333,1000,350,611,350,350,278,278,500,500,350,556,1000,333,1000,556,333,944,350,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]

#  A few characters that turn up in SiteIQ text and in typing that
#  Windows-1252 cannot carry as-is, mapped to the nearest thing it can.
_FALLBACK = {u"‑": "-", u"−": "-", u" ": " ", u" ": " ",
             u" ": " ", u"․": ".", u"⁃": "-", u"→": "->",
             u"✓": "v", u"✔": "v", u"•": u"•",
             u"\u25b2": "+", u"\u25bc": "-", u"\u25ac": "="}


def _bytes(s):
    """Text as Windows-1252 bytes, with anything the encoding can't
    hold replaced rather than allowed to kill the run."""
    out = bytearray()
    for ch in str(s).replace("\r", " ").replace("\n", " "):
        ch = _FALLBACK.get(ch, ch)
        try:
            out += ch.encode("cp1252")
        except UnicodeEncodeError:
            out += b"?"
    return bytes(out)


def _lit(s):
    """A PDF literal string: (escaped bytes)."""
    b = _bytes(s).replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)")
    return b"(" + b + b")"


def _rgb(colour):
    c = str(colour).lstrip("#")
    if len(c) == 3:
        c = c[0] * 2 + c[1] * 2 + c[2] * 2
    return "{:.3f} {:.3f} {:.3f}".format(int(c[0:2], 16) / 255.0,
                                         int(c[2:4], 16) / 255.0,
                                         int(c[4:6], 16) / 255.0)


def _n(v):
    """A number the way PDF likes it - short, no exponent."""
    s = "{:.2f}".format(float(v))
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s or "0"


# ---- the typeface --------------------------------------------------
#  Inter (SIL Open Font License) travels in the kit's _fonts folder:
#  Regular, SemiBold (bold text), Bold (bold headings 14pt and up) and
#  Italic. Only the glyphs a document uses are written into it.
import os as _os
import struct as _struct


class _TrueType(object):
    """Just enough of a TrueType font to measure text and to write a
    subset of it into a PDF: the table directory, the character map,
    the advance widths and the glyph outlines, with the parts a
    composite glyph borrows from other glyphs."""

    def __init__(self, path):
        self.path = path
        self.data = d = open(path, "rb").read()
        tag, n = _struct.unpack(">IH", d[:6])
        if tag not in (0x00010000, 0x74727565):
            raise ValueError("not a TrueType font: " + path)
        self.tables = {}
        for i in range(n):
            t, _cs, off, ln = _struct.unpack(">4sIII", d[12 + 16 * i:28 + 16 * i])
            self.tables[t.decode("latin-1")] = (off, ln)
        for need in ("head", "hhea", "hmtx", "maxp", "cmap", "loca", "glyf"):
            if need not in self.tables:
                raise ValueError("font lacks a {} table: {}".format(need, path))
        head = self._t("head")
        self.units = _struct.unpack(">H", head[18:20])[0] or 1000
        self.bbox = _struct.unpack(">hhhh", head[36:44])
        loca_long = _struct.unpack(">h", head[50:52])[0] == 1
        hhea = self._t("hhea")
        self.ascent, self.descent = _struct.unpack(">hh", hhea[4:8])
        n_hm = _struct.unpack(">H", hhea[34:36])[0]
        self.n_glyphs = _struct.unpack(">H", self._t("maxp")[4:6])[0]
        hmtx = self._t("hmtx")
        self.adv, self.lsb = [], []
        for g in range(self.n_glyphs):
            if g < n_hm:
                a, l = _struct.unpack(">Hh", hmtx[4 * g:4 * g + 4])
            else:
                a = self.adv[-1]
                k = 4 * n_hm + 2 * (g - n_hm)
                l = _struct.unpack(">h", hmtx[k:k + 2])[0]
            self.adv.append(a)
            self.lsb.append(l)
        loca = self._t("loca")
        if loca_long:
            self.loca = list(_struct.unpack(">%dI" % (self.n_glyphs + 1),
                                            loca[:4 * (self.n_glyphs + 1)]))
        else:
            self.loca = [2 * v for v in _struct.unpack(">%dH" % (self.n_glyphs + 1),
                                                       loca[:2 * (self.n_glyphs + 1)])]
        self.cmap = self._read_cmap()
        #  Tabular figures: numbers in columns line up when every digit
        #  is the same width, so the digits are swapped for the font's
        #  'tnum' alternates where it has them.
        try:
            tnum = self._single_subst("tnum")
        except Exception:
            tnum = {}
        for ch in "0123456789":
            g = self.cmap.get(ord(ch))
            if g in tnum:
                self.cmap[ord(ch)] = tnum[g]
        os2 = self._t("OS/2") if "OS/2" in self.tables else b""
        self.cap_height = (_struct.unpack(">h", os2[88:90])[0] if len(os2) >= 90
                           else int(self.ascent * 0.72))
        post = self._t("post") if "post" in self.tables else b""
        self.italic_angle = (_struct.unpack(">i", post[4:8])[0] / 65536.0) if len(post) >= 8 else 0.0
        #  Advance per Windows-1252 code in 1/1000 em - what measuring needs.
        self.w1000 = [0] * 256
        for code in range(32, 256):
            try:
                ch = bytes([code]).decode("cp1252")
            except UnicodeDecodeError:
                continue
            g = self.cmap.get(ord(ch))
            if g is not None and g < self.n_glyphs:
                self.w1000[code] = int(round(self.adv[g] * 1000.0 / self.units))

    def _t(self, tag):
        off, ln = self.tables[tag]
        return self.data[off:off + ln]

    def _read_cmap(self):
        cm = self._t("cmap")
        n = _struct.unpack(">H", cm[2:4])[0]
        best = None
        for i in range(n):
            pid, eid, off = _struct.unpack(">HHI", cm[4 + 8 * i:12 + 8 * i])
            if off + 2 > len(cm):
                continue
            fmt = _struct.unpack(">H", cm[off:off + 2])[0]
            score = {(3, 10): 4, (3, 1): 3, (0, 4): 2, (0, 3): 2, (0, 6): 1}.get((pid, eid), 0)
            if fmt in (4, 12) and score and (best is None or score > best[0]):
                best = (score, off, fmt)
        out = {}
        if best is None:
            return out
        _sc, off, fmt = best
        if fmt == 4:
            segx2 = _struct.unpack(">H", cm[off + 6:off + 8])[0]
            seg = segx2 // 2
            ends = _struct.unpack(">%dH" % seg, cm[off + 14:off + 14 + segx2])
            starts = _struct.unpack(">%dH" % seg, cm[off + 16 + segx2:off + 16 + 2 * segx2])
            deltas = _struct.unpack(">%dh" % seg, cm[off + 16 + 2 * segx2:off + 16 + 3 * segx2])
            ro_at = off + 16 + 3 * segx2
            ros = _struct.unpack(">%dH" % seg, cm[ro_at:ro_at + segx2])
            for i in range(seg):
                if starts[i] > ends[i]:
                    continue
                for c in range(starts[i], min(ends[i], 0xFFFE) + 1):
                    if ros[i] == 0:
                        g = (c + deltas[i]) & 0xFFFF
                    else:
                        p = ro_at + 2 * i + ros[i] + 2 * (c - starts[i])
                        if p + 2 > len(cm):
                            continue
                        g = _struct.unpack(">H", cm[p:p + 2])[0]
                        if g:
                            g = (g + deltas[i]) & 0xFFFF
                    if g and c not in out:
                        out[c] = g
        else:
            ngroups = _struct.unpack(">I", cm[off + 12:off + 16])[0]
            p = off + 16
            for _k in range(ngroups):
                s0, e0, g0 = _struct.unpack(">III", cm[p:p + 12])
                p += 12
                for c in range(s0, min(e0, 0xFFFF) + 1):
                    if c not in out:
                        out[c] = g0 + (c - s0)
        return out

    def _coverage(self, off):
        d = self.data
        fmt, n = _struct.unpack(">HH", d[off:off + 4])
        out = []
        if fmt == 1:
            out = list(_struct.unpack(">%dH" % n, d[off + 4:off + 4 + 2 * n]))
        elif fmt == 2:
            p = off + 4
            for _k in range(n):
                a, b, _si = _struct.unpack(">HHH", d[p:p + 6])
                p += 6
                out.extend(range(a, b + 1))
        return out

    def _single_subst(self, feature):
        """Glyph -> glyph for every single-substitution lookup a GSUB
        feature (such as 'tnum') applies, or {} if the font has none."""
        if "GSUB" not in self.tables:
            return {}
        d = self.data
        base = self.tables["GSUB"][0]
        _maj, _min, _script, feat_off, look_off = _struct.unpack(">HHHHH", d[base:base + 10])
        feats = base + feat_off
        n = _struct.unpack(">H", d[feats:feats + 2])[0]
        lookups = []
        for i in range(n):
            tag, off = _struct.unpack(">4sH", d[feats + 2 + 6 * i:feats + 8 + 6 * i])
            if tag.decode("latin-1") != feature:
                continue
            ft = feats + off
            cnt = _struct.unpack(">H", d[ft + 2:ft + 4])[0]
            lookups.extend(_struct.unpack(">%dH" % cnt, d[ft + 4:ft + 4 + 2 * cnt]))
        out = {}
        ll = base + look_off
        n_l = _struct.unpack(">H", d[ll:ll + 2])[0]
        for li in sorted(set(lookups)):
            if li >= n_l:
                continue
            lo = ll + _struct.unpack(">H", d[ll + 2 + 2 * li:ll + 4 + 2 * li])[0]
            ltype, _flag, sc = _struct.unpack(">HHH", d[lo:lo + 6])
            for k in range(sc):
                st = lo + _struct.unpack(">H", d[lo + 6 + 2 * k:lo + 8 + 2 * k])[0]
                t = ltype
                if t == 7:                                  # extension
                    _f, t, ext = _struct.unpack(">HHI", d[st:st + 8])
                    st = st + ext
                if t != 1:
                    continue
                fmt, cov = _struct.unpack(">HH", d[st:st + 4])
                covered = self._coverage(st + cov)
                if fmt == 1:
                    delta = _struct.unpack(">h", d[st + 4:st + 6])[0]
                    for g in covered:
                        out.setdefault(g, (g + delta) & 0xFFFF)
                elif fmt == 2:
                    cnt = _struct.unpack(">H", d[st + 4:st + 6])[0]
                    subs = _struct.unpack(">%dH" % cnt, d[st + 6:st + 6 + 2 * cnt])
                    for g, sg in zip(covered, subs):
                        out.setdefault(g, sg)
        return out

    def glyph(self, g):
        a, b = self.loca[g], self.loca[g + 1]
        off = self.tables["glyf"][0]
        return self.data[off + a:off + b]

    @staticmethod
    def _components(raw):
        """(offset of the glyph index, glyph index) for each part of a
        composite glyph, so a subset can renumber them in place."""
        if len(raw) < 10 or _struct.unpack(">h", raw[:2])[0] >= 0:
            return []
        out, p = [], 10
        while p + 4 <= len(raw):
            flags, gi = _struct.unpack(">HH", raw[p:p + 4])
            out.append((p + 2, gi))
            p += 4
            p += 4 if flags & 0x0001 else 2
            if flags & 0x0008:
                p += 2
            elif flags & 0x0040:
                p += 4
            elif flags & 0x0080:
                p += 8
            if not flags & 0x0020:
                break
        return out

    def subset(self, codes):
        """A new TrueType file holding only the glyphs those Windows-1252
        codes need - plus .notdef and the parts composites borrow - with
        a character map from each character to its new glyph number."""
        want = {0}
        uni_to_old = {}
        for code in codes:
            try:
                ch = bytes([code]).decode("cp1252")
            except UnicodeDecodeError:
                continue
            g = self.cmap.get(ord(ch))
            if g is not None and g < self.n_glyphs:
                uni_to_old[ord(ch)] = g
                want.add(g)
        stack = list(want)
        while stack:
            g = stack.pop()
            for _p, gi in self._components(self.glyph(g)):
                if gi < self.n_glyphs and gi not in want:
                    want.add(gi)
                    stack.append(gi)
        old = sorted(want)
        new_of = dict((g, i) for i, g in enumerate(old))
        glyf, loca = bytearray(), []
        for g in old:
            raw = bytearray(self.glyph(g))
            for p, gi in self._components(raw):
                _struct.pack_into(">H", raw, p, new_of.get(gi, 0))
            loca.append(len(glyf))
            glyf += raw
            if len(glyf) % 4:
                glyf += b"\0" * (4 - len(glyf) % 4)
        loca.append(len(glyf))
        n = len(old)
        hmtx = b"".join(_struct.pack(">Hh", self.adv[g], self.lsb[g]) for g in old)
        head = bytearray(self._t("head"))
        _struct.pack_into(">I", head, 8, 0)
        _struct.pack_into(">h", head, 50, 1)
        hhea = bytearray(self._t("hhea"))
        _struct.pack_into(">H", hhea, 34, n)
        maxp = bytearray(self._t("maxp"))
        _struct.pack_into(">H", maxp, 4, n)
        post = bytearray((self._t("post") if "post" in self.tables else b"\0" * 32)[:32])
        post += b"\0" * (32 - len(post))
        _struct.pack_into(">I", post, 0, 0x00030000)
        tables = {"head": bytes(head), "hhea": bytes(hhea), "maxp": bytes(maxp),
                  "hmtx": hmtx, "cmap": self._cmap4(dict((u, new_of[g]) for u, g in uni_to_old.items())),
                  "loca": _struct.pack(">%dI" % (n + 1), *loca), "glyf": bytes(glyf),
                  "post": bytes(post)}
        for tag in ("OS/2", "name", "cvt ", "fpgm", "prep"):
            if tag in self.tables:
                tables[tag] = self._t(tag)
        return self._sfnt(tables)

    @staticmethod
    def _cmap4(mapping):
        """A cmap table with one (3,1) format-4 subtable: a segment per
        run of consecutive characters mapping to consecutive glyphs."""
        import math
        segs = []
        for u, g in sorted(mapping.items()):
            delta = (g - u) & 0xFFFF
            if segs and u == segs[-1][1] + 1 and delta == segs[-1][2]:
                segs[-1][1] = u
            else:
                segs.append([u, u, delta])
        segs.append([0xFFFF, 0xFFFF, 1])
        n = len(segs)
        sr = 2 * (2 ** int(math.floor(math.log(n, 2))))
        es = int(round(math.log(sr // 2, 2)))
        body = _struct.pack(">HHHHHHH", 4, 16 + 8 * n, 0, 2 * n, sr, es, 2 * n - sr)
        body += _struct.pack(">%dH" % n, *[sg[1] for sg in segs]) + b"\0\0"
        body += _struct.pack(">%dH" % n, *[sg[0] for sg in segs])
        body += _struct.pack(">%dH" % n, *[sg[2] for sg in segs])
        body += _struct.pack(">%dH" % n, *([0] * n))
        return _struct.pack(">HHHHI", 0, 1, 3, 1, 12) + body

    @staticmethod
    def _checksum(b):
        total = 0
        for i in range(0, len(b), 4):
            total = (total + _struct.unpack(">I", b[i:i + 4])[0]) & 0xFFFFFFFF
        return total

    @staticmethod
    def _sfnt(tables):
        import math
        tags = sorted(tables)
        n = len(tags)
        sr = 16 * (2 ** int(math.floor(math.log(n, 2))))
        es = int(round(math.log(sr // 16, 2)))
        head = bytearray(_struct.pack(">IHHHH", 0x00010000, n, sr, es, 16 * n - sr))
        directory, body = bytearray(), bytearray()
        start = 12 + 16 * n
        for t in tags:
            data = tables[t]
            pad = (4 - len(data) % 4) % 4
            padded = data + b"\0" * pad
            directory += _struct.pack(">4sIII", t.encode("latin-1"),
                                      _TrueType._checksum(padded), start + len(body), len(data))
            body += padded
        font = bytearray(head + directory + body)
        # TrueType requires the checksum of the entire font to equal this
        # magic value. The head table's directory checksum is calculated
        # with checkSumAdjustment zero, then the adjustment is written last.
        if "head" in tables:
            entry = 12 + 16 * tags.index("head")
            head_offset = _struct.unpack(">I", font[entry + 8:entry + 12])[0]
            adjustment = (0xB1B0AFBA - _TrueType._checksum(font)) & 0xFFFFFFFF
            _struct.pack_into(">I", font, head_offset + 8, adjustment)
        return bytes(font)


_FACES = {}
_FACE_FILES = {"regular": "Inter-Regular.ttf", "bold": "Inter-SemiBold.ttf",
               "heavy": "Inter-Bold.ttf", "italic": "Inter-Italic.ttf"}
_FACE_NAMES = {"regular": "Inter-Regular", "bold": "Inter-SemiBold",
               "heavy": "Inter-Bold", "italic": "Inter-Italic"}
_FACE_TAGS = {"regular": "CTSREG", "bold": "CTSBLD", "heavy": "CTSHVY", "italic": "CTSITA"}
_FACE_RES = {"regular": "/F1", "bold": "/F2", "italic": "/F3", "heavy": "/F4"}


def load_fonts(folder):
    """Load the kit's typeface from `folder`. Returns the faces found;
    with none (or no Regular) every document falls back to Helvetica."""
    _FACES.clear()
    for key, name in _FACE_FILES.items():
        path = _os.path.join(folder or "", name)
        if _os.path.isfile(path):
            try:
                _FACES[key] = _TrueType(path)
            except Exception:
                pass
    if "regular" not in _FACES:
        _FACES.clear()
    return sorted(_FACES)


def typeface():
    """The name of the typeface documents are set in right now."""
    return "Inter" if _FACES else "Helvetica"


def _face_key(bold, italic, size):
    """Which face a run of text is set in: italic, bold headings 14pt
    and up in Bold, other bold in SemiBold, the rest Regular."""
    if not _FACES:
        return None
    if italic and "italic" in _FACES:
        return "italic"
    if bold:
        if size >= 14 and "heavy" in _FACES:
            return "heavy"
        for k in ("bold", "heavy"):
            if k in _FACES:
                return k
    return "regular"


class _Page(object):
    def __init__(self, size):
        self.w, self.h = size
        self.ops = []           # bytes, one drawing instruction each
        self.links = []         # (x, y, w, h, page_index)


class Document(object):
    """One PDF. Make pages, draw on them, save."""

    def __init__(self, title="", author="", subject="", size=A4,
                 creator="Coates On-Hire Report Kit"):
        self.title = title
        self.author = author
        self.subject = subject
        self.creator = creator
        self.size = size
        self.pages = []
        self.page = None
        self.outline = []       # (title, page_index, y_from_top, level)
        self.used = {}          # face key -> set of character codes drawn

    # ---- pages ---------------------------------------------------------
    def new_page(self, size=None):
        """Start a new page and draw on it from now on. Returns its
        index (0-based) so a link or a bookmark can point at it."""
        self.page = _Page(size or self.size)
        self.pages.append(self.page)
        return len(self.pages) - 1

    def use_page(self, index):
        """Go back and draw on an earlier page - the contents page is
        drawn LAST, once every section knows which page it landed on."""
        self.page = self.pages[index]
        return self.page

    @property
    def page_index(self):
        return self.pages.index(self.page)

    @property
    def page_count(self):
        return len(self.pages)

    @property
    def width(self):
        return self.page.w

    @property
    def height(self):
        return self.page.h

    # ---- measuring -----------------------------------------------------
    def text_width(self, s, size, bold=False, tracking=0.0, italic=False):
        key = _face_key(bold, italic, size)
        table = _FACES[key].w1000 if key else (_W_BOLD if bold else _W_REG)
        b = _bytes(s)
        units = sum(table[c] for c in b)
        return units / 1000.0 * size + tracking * max(0, len(b) - 1)

    def fit(self, s, size, max_w, bold=False, tracking=0.0):
        """The text, cut with an ellipsis if it will not fit max_w."""
        s = str(s)
        if self.text_width(s, size, bold, tracking) <= max_w:
            return s
        ell = u"…"
        while s and self.text_width(s + ell, size, bold, tracking) > max_w:
            s = s[:-1]
        return (s.rstrip() + ell) if s else ell

    def wrap(self, s, size, max_w, bold=False, max_lines=None):
        """Word-wrap into lines that fit max_w. A single word longer
        than the line is broken by character rather than overflowing."""
        words = str(s).split()
        lines, cur = [], ""
        for w in words:
            trial = (cur + " " + w) if cur else w
            if self.text_width(trial, size, bold) <= max_w:
                cur = trial
                continue
            if cur:
                lines.append(cur)
                cur = ""
            while self.text_width(w, size, bold) > max_w and len(w) > 1:
                n = len(w)
                while n > 1 and self.text_width(w[:n], size, bold) > max_w:
                    n -= 1
                lines.append(w[:n])
                w = w[n:]
            cur = w
        if cur:
            lines.append(cur)
        if max_lines and len(lines) > max_lines:
            keep = lines[:max_lines]
            keep[-1] = self.fit(keep[-1] + u" …", size, max_w, bold)
            return keep
        return lines or [""]

    # ---- drawing -------------------------------------------------------
    def _op(self, s):
        self.page.ops.append(s.encode("latin-1") if not isinstance(s, bytes) else s)

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=0.5, radius=0):
        """A box. y is its TOP. radius > 0 rounds the corners."""
        if w <= 0 or h <= 0 or (fill is None and stroke is None):
            return
        H = self.page.h
        y0 = H - y - h                      # bottom edge, PDF coords
        paint = "B" if (fill and stroke) else ("f" if fill else "S")
        pre = ""
        if fill:
            pre += _rgb(fill) + " rg "
        if stroke:
            pre += _rgb(stroke) + " RG " + _n(lw) + " w "
        r = min(radius, w / 2.0, h / 2.0)
        if r <= 0:
            self._op("{} {} {} {} {} re {}".format(pre, _n(x), _n(y0), _n(w),
                                                   _n(h), paint))
            return
        k = 0.5523 * r
        x1, y1, x2, y2 = x, y0, x + w, y0 + h
        path = [
            "{} {} m".format(_n(x1 + r), _n(y1)),
            "{} {} l".format(_n(x2 - r), _n(y1)),
            "{} {} {} {} {} {} c".format(_n(x2 - r + k), _n(y1), _n(x2), _n(y1 + r - k), _n(x2), _n(y1 + r)),
            "{} {} l".format(_n(x2), _n(y2 - r)),
            "{} {} {} {} {} {} c".format(_n(x2), _n(y2 - r + k), _n(x2 - r + k), _n(y2), _n(x2 - r), _n(y2)),
            "{} {} l".format(_n(x1 + r), _n(y2)),
            "{} {} {} {} {} {} c".format(_n(x1 + r - k), _n(y2), _n(x1), _n(y2 - r + k), _n(x1), _n(y2 - r)),
            "{} {} l".format(_n(x1), _n(y1 + r)),
            "{} {} {} {} {} {} c".format(_n(x1), _n(y1 + r - k), _n(x1 + r - k), _n(y1), _n(x1 + r), _n(y1)),
            "h", paint]
        self._op(pre + " ".join(path))

    # ---- shapes for charts ---------------------------------------------
    #  Angles are degrees as you'd draw them on paper: 0 is three o'clock,
    #  90 is twelve o'clock, counter-clockwise is positive.
    def _arc_ops(self, cx, cy, r, a1, a2, move):
        """Bezier segments for an arc, in PDF coordinates."""
        import math
        H = self.page.h
        cy = H - cy
        ops = []
        total = a2 - a1
        steps = max(1, int(abs(total) / 90.0 + 0.999))
        step = total / float(steps)
        for i in range(steps):
            t1 = math.radians(a1 + step * i)
            t2 = math.radians(a1 + step * (i + 1))
            k = 4.0 / 3.0 * math.tan((t2 - t1) / 4.0)
            p0 = (cx + r * math.cos(t1), cy + r * math.sin(t1))
            p3 = (cx + r * math.cos(t2), cy + r * math.sin(t2))
            p1 = (p0[0] - k * r * math.sin(t1), p0[1] + k * r * math.cos(t1))
            p2 = (p3[0] + k * r * math.sin(t2), p3[1] - k * r * math.cos(t2))
            if i == 0:
                ops.append("{} {} {}".format(_n(p0[0]), _n(p0[1]), "m" if move else "l"))
            ops.append("{} {} {} {} {} {} c".format(_n(p1[0]), _n(p1[1]), _n(p2[0]),
                                                   _n(p2[1]), _n(p3[0]), _n(p3[1])))
        return ops

    def ring(self, cx, cy, r_out, r_in, a1, a2, fill):
        """A slice of a ring (or of a disc when r_in is 0) from angle a1
        to a2. Gauges and donuts are made of these."""
        if abs(a2 - a1) < 0.01:
            return
        ops = [_rgb(fill) + " rg"]
        ops += self._arc_ops(cx, cy, r_out, a1, a2, True)
        if r_in > 0:
            ops += self._arc_ops(cx, cy, r_in, a2, a1, False)
        else:
            import math
            H = self.page.h
            ops.append("{} {} l".format(_n(cx), _n(H - cy)))
        ops.append("h f")
        self._op(" ".join(ops))

    def circle(self, cx, cy, r, fill=None, stroke=None, lw=0.6):
        if fill is None and stroke is None:
            return
        pre = ""
        if fill:
            pre += _rgb(fill) + " rg "
        if stroke:
            pre += _rgb(stroke) + " RG " + _n(lw) + " w "
        paint = "B" if (fill and stroke) else ("f" if fill else "S")
        self._op(pre + " ".join(self._arc_ops(cx, cy, r, 0, 360, True)) + " h " + paint)

    def polyline(self, points, colour="#000000", lw=1.0, dash=None, close=False,
                 fill=None):
        """A line through points [(x, y), ...] from the top-left; with
        fill it becomes a filled shape."""
        if len(points) < 2:
            return
        H = self.page.h
        ops = []
        if fill:
            ops.append(_rgb(fill) + " rg")
        if colour:
            ops.append(_rgb(colour) + " RG " + _n(lw) + " w")
        if dash:
            ops.append("[{}] 0 d".format(" ".join(_n(d) for d in dash)))
        ops.append("{} {} m".format(_n(points[0][0]), _n(H - points[0][1])))
        for (x, y) in points[1:]:
            ops.append("{} {} l".format(_n(x), _n(H - y)))
        if fill and colour:
            ops.append("h B")
        elif fill:
            ops.append("h f")
        else:
            ops.append("h S" if close else "S")
        if dash:
            ops.append("[] 0 d")
        self._op(" ".join(ops))

    def line(self, x1, y1, x2, y2, colour="#000000", lw=0.5):
        H = self.page.h
        self._op("{} RG {} w {} {} m {} {} l S".format(
            _rgb(colour), _n(lw), _n(x1), _n(H - y1), _n(x2), _n(H - y2)))

    def text(self, x, y, s, size=10, bold=False, italic=False,
             colour="#000000", align="left", tracking=0.0, max_w=None):
        """Draw one line of text with its BASELINE at y. align may be
        left, right or centre (x is then the right edge / the middle).
        max_w cuts the text with an ellipsis instead of letting it run
        into the next column. Returns the width drawn."""
        s = str(s)
        if max_w is not None:
            s = self.fit(s, size, max_w, bold, tracking)
        w = self.text_width(s, size, bold, tracking, italic)
        if align in ("right", "r"):
            x = x - w
        elif align in ("centre", "center", "c"):
            x = x - w / 2.0
        key = _face_key(bold, italic, size)
        if key:
            font = _FACE_RES[key]
            self.used.setdefault(key, set()).update(_bytes(s))
        else:
            font = "/F2" if bold else ("/F3" if italic else "/F1")
        H = self.page.h
        op = (b"BT " + font.encode("latin-1") + b" " + _n(size).encode("latin-1")
              + b" Tf " + _n(tracking).encode("latin-1") + b" Tc "
              + _rgb(colour).encode("latin-1") + b" rg "
              + _n(x).encode("latin-1") + b" " + _n(H - y).encode("latin-1")
              + b" Td " + _lit(s) + b" Tj ET")
        self._op(op)
        return w

    def paragraph(self, x, y, s, size=10, max_w=200, leading=None,
                  bold=False, colour="#000000", max_lines=None):
        """Wrapped text. y is the first baseline. Returns the y of the
        NEXT free baseline so the caller can keep going underneath."""
        leading = leading or size * 1.35
        for line in self.wrap(s, size, max_w, bold, max_lines):
            self.text(x, y, line, size=size, bold=bold, colour=colour)
            y += leading
        return y

    def link(self, x, y, w, h, page_index):
        """Click anywhere in this box to jump to that page."""
        self.page.links.append((x, y, w, h, page_index))

    def bookmark(self, title, page_index=None, y=0, level=0):
        """An entry in the reader's bookmarks panel."""
        if page_index is None:
            page_index = self.page_index
        self.outline.append((str(title), page_index, y, level))

    # ---- writing -------------------------------------------------------
    def render(self):
        """The finished file as bytes."""
        objs = {}                           # id -> bytes (without obj/endobj)
        n = len(self.pages)
        first_page_id = 8                   # 4..7 are the four faces
        page_id = lambda i: first_page_id + 2 * i
        content_id = lambda i: first_page_id + 2 * i + 1
        next_id = first_page_id + 2 * n

        #  The faces: Inter embedded as subsets when the kit carries it,
        #  Helvetica otherwise. F1 regular, F2 bold, F3 italic, F4 heavy.
        fallback = {4: b"Helvetica", 5: b"Helvetica-Bold", 6: b"Helvetica-Oblique",
                    7: b"Helvetica-Bold"}
        for key, fid in (("regular", 4), ("bold", 5), ("italic", 6), ("heavy", 7)):
            face = _FACES.get(key)
            if face is None:
                objs[fid] = (b"<< /Type /Font /Subtype /Type1 /BaseFont /" + fallback[fid]
                             + b" /Encoding /WinAnsiEncoding >>")
                continue
            used = set(self.used.get(key) or ()) | {32}
            sub = face.subset(used)
            desc_id, file_id = next_id, next_id + 1
            next_id += 2
            packed = zlib.compress(sub, 9)
            objs[file_id] = (b"<< /Length " + str(len(packed)).encode("latin-1")
                             + b" /Length1 " + str(len(sub)).encode("latin-1")
                             + b" /Filter /FlateDecode >>\nstream\n" + packed + b"\nendstream")
            k = 1000.0 / face.units
            name = _FACE_TAGS[key] + "+" + _FACE_NAMES[key]
            flags = 32 | (64 if key == "italic" else 0) | (262144 if key in ("bold", "heavy") else 0)
            objs[desc_id] = (
                "<< /Type /FontDescriptor /FontName /{} /Flags {} /FontBBox [{} {} {} {}] "
                "/ItalicAngle {} /Ascent {} /Descent {} /CapHeight {} /StemV {} "
                "/FontFile2 {} 0 R >>".format(
                    name, flags, _n(face.bbox[0] * k), _n(face.bbox[1] * k),
                    _n(face.bbox[2] * k), _n(face.bbox[3] * k), _n(face.italic_angle),
                    _n(face.ascent * k), _n(face.descent * k), _n(face.cap_height * k),
                    120 if key in ("bold", "heavy") else 80, file_id)).encode("latin-1")
            objs[fid] = (
                "<< /Type /Font /Subtype /TrueType /BaseFont /{} /FirstChar 32 /LastChar 255 "
                "/Widths [{}] /Encoding /WinAnsiEncoding /FontDescriptor {} 0 R >>".format(
                    name, " ".join(str(w) for w in face.w1000[32:256]), desc_id)).encode("latin-1")

        #  Link annotations, one object each.
        annots_of = {}
        for i, p in enumerate(self.pages):
            ids = []
            for (x, y, w, h, target) in p.links:
                target = max(0, min(n - 1, int(target)))
                aid = next_id
                next_id += 1
                H = p.h
                top = self.pages[target].h
                objs[aid] = (
                    "<< /Type /Annot /Subtype /Link /Border [0 0 0] "
                    "/Rect [{} {} {} {}] /Dest [{} 0 R /XYZ null {} null] >>"
                    .format(_n(x), _n(H - y - h), _n(x + w), _n(H - y),
                            page_id(target), _n(top))).encode("latin-1")
                ids.append(aid)
            annots_of[i] = ids

        #  Pages and their streams.
        for i, p in enumerate(self.pages):
            stream = zlib.compress(b"\n".join(p.ops), 9)
            objs[content_id(i)] = (b"<< /Length " + str(len(stream)).encode("latin-1")
                                   + b" /Filter /FlateDecode >>\nstream\n"
                                   + stream + b"\nendstream")
            annots = ""
            if annots_of[i]:
                annots = " /Annots [" + " ".join(
                    "{} 0 R".format(a) for a in annots_of[i]) + "]"
            objs[page_id(i)] = (
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {} {}] "
                "/Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> "
                "/ProcSet [/PDF /Text] >> /Contents {} 0 R{} >>".format(
                    _n(p.w), _n(p.h), content_id(i), annots)).encode("latin-1")

        #  Bookmarks: a flat list, or two levels if any entry says so.
        outlines_ref = b""
        if self.outline:
            root_id = next_id
            next_id += 1
            items = []
            for (title, pi, y, level) in self.outline:
                items.append([next_id, title, pi, y, level])
                next_id += 1
            #  Parent/child wiring for level 0 and level 1.
            top = [it for it in items if it[4] == 0] or items
            for k, it in enumerate(items):
                oid, title, pi, y, level = it
                pi = max(0, min(n - 1, pi))
                H = self.pages[pi].h
                if level == 0 or it in top:
                    sibs = top
                    parent = root_id
                else:
                    parent = None
                    for back in range(k - 1, -1, -1):
                        if items[back][4] == 0:
                            parent = items[back][0]
                            break
                    parent = parent or root_id
                    sibs = [c for c in items if c[4] == level and
                            self._parent_of(items, items.index(c)) == parent]
                pos = sibs.index(it)
                prev_ = sibs[pos - 1][0] if pos > 0 else None
                next_ = sibs[pos + 1][0] if pos + 1 < len(sibs) else None
                kids = [c for c in items if c[4] > 0 and
                        self._parent_of(items, items.index(c)) == oid]
                d = ["<< /Title " + _lit(title).decode("latin-1"),
                     "/Parent {} 0 R".format(parent),
                     "/Dest [{} 0 R /XYZ 0 {} 0]".format(page_id(pi), _n(H - y + 6))]
                if prev_:
                    d.append("/Prev {} 0 R".format(prev_))
                if next_:
                    d.append("/Next {} 0 R".format(next_))
                if kids:
                    d.append("/First {} 0 R /Last {} 0 R /Count {}".format(
                        kids[0][0], kids[-1][0], len(kids)))
                d.append(">>")
                objs[oid] = " ".join(d).encode("latin-1")
            objs[root_id] = ("<< /Type /Outlines /First {} 0 R /Last {} 0 R "
                             "/Count {} >>".format(top[0][0], top[-1][0],
                                                   len(top))).encode("latin-1")
            outlines_ref = " /Outlines {} 0 R".format(root_id).encode("latin-1")

        objs[1] = (b"<< /Type /Catalog /Pages 2 0 R" + outlines_ref
                   + b" /PageMode /UseNone /ViewerPreferences << /DisplayDocTitle true >> >>")
        objs[2] = ("<< /Type /Pages /Kids [{}] /Count {} >>".format(
            " ".join("{} 0 R".format(page_id(i)) for i in range(n)), n)
            ).encode("latin-1")
        stamp = dt.datetime.now().strftime("D:%Y%m%d%H%M%S")
        objs[3] = (b"<< /Title " + _lit(self.title) + b" /Author " + _lit(self.author)
                   + b" /Subject " + _lit(self.subject) + b" /Creator " + _lit(self.creator)
                   + b" /Producer (coates_pdf.py) /CreationDate (" + stamp.encode("latin-1")
                   + b") /ModDate (" + stamp.encode("latin-1") + b") >>")

        out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = {}
        for oid in sorted(objs):
            offsets[oid] = len(out)
            out += "{} 0 obj\n".format(oid).encode("latin-1")
            out += objs[oid]
            out += b"\nendobj\n"
        xref_at = len(out)
        count = max(objs) + 1
        out += "xref\n0 {}\n".format(count).encode("latin-1")
        out += b"0000000000 65535 f \n"
        for oid in range(1, count):
            out += "{:010d} 00000 n \n".format(offsets.get(oid, 0)).encode("latin-1")
        out += ("trailer\n<< /Size {} /Root 1 0 R /Info 3 0 R >>\n"
                "startxref\n{}\n%%EOF\n".format(count, xref_at)).encode("latin-1")
        return bytes(out)

    @staticmethod
    def _parent_of(items, k):
        """The id of the nearest level-0 entry above item k."""
        for back in range(k - 1, -1, -1):
            if items[back][4] == 0:
                return items[back][0]
        return None

    def save(self, path):
        data = self.render()
        with open(path, "wb") as f:
            f.write(data)
        return path


if __name__ == "__main__":
    #  A one-page proof that the writer works on this machine.
    d = Document(title="coates_pdf self-test", author="Andrew Fisher")
    d.new_page()
    d.rect(0, 0, d.width, 60, fill="#1D1D1B")
    d.rect(0, 60, d.width, 3, fill="#F26222")
    d.text(36, 38, "COATES", size=16, bold=True, colour="#F26222", tracking=3)
    d.text(d.width - 36, 38, "coates_pdf.py self-test", size=11, bold=True,
           colour="#FFFFFF", align="right")
    y = 100
    d.text(36, y, "If you can read this, the PDF writer works.", size=12, bold=True)
    y = d.paragraph(36, y + 20, "Word wrap, right alignment, chips and rules below. "
                    "Standard library only - nothing installed.", size=10, max_w=300)
    d.rect(36, y + 4, 90, 16, fill="#FBE7E6", radius=4)
    d.text(81, y + 15.5, "92 d", size=8.5, bold=True, colour="#A32015", align="centre")
    d.text(d.width - 36, y + 15.5, "1,234", size=10, bold=True, align="right")
    d.line(36, y + 28, d.width - 36, y + 28, colour="#DDE1E7")
    d.bookmark("Self-test", 0, 0)
    d.save("coates_pdf_selftest.pdf")
    print("wrote coates_pdf_selftest.pdf")
