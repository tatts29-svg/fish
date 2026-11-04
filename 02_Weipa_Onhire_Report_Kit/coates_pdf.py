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
#     text in Helvetica (regular, bold, oblique - every PDF reader
#     carries these, so nothing is embedded and the file stays small),
#     filled boxes, rules, rounded chips, right- and centre-aligned
#     text, word wrap, "Page 3 of 14", bookmarks down the side of
#     Acrobat, and links from a contents page to its sections.
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
             u"✓": "v", u"✔": "v", u"•": u"•"}


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
    @staticmethod
    def text_width(s, size, bold=False, tracking=0.0):
        table = _W_BOLD if bold else _W_REG
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
        w = self.text_width(s, size, bold, tracking)
        if align in ("right", "r"):
            x = x - w
        elif align in ("centre", "center", "c"):
            x = x - w / 2.0
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
        FONT_IDS = (4, 5, 6)
        first_page_id = 7
        page_id = lambda i: first_page_id + 2 * i
        content_id = lambda i: first_page_id + 2 * i + 1
        next_id = first_page_id + 2 * n

        objs[4] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
        objs[5] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
        objs[6] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>"

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
                "/Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> "
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
