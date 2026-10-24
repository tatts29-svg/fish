"""COATES | AMPOL TOOL STORE - finish a PDF: properties and bookmarks.

Author: Andrew Fisher | POWERED BY SITEIQ

WHY (03 Sep 2026): every PDF the suite prints had a title but no author,
no subject and no navigation pane. A 57-page register with no bookmarks
is a scroll, not a document. This module stamps the document properties
(Title, Author: Andrew Fisher, Subject, Keywords) and builds the outline
from the report's own section headings, found on the printed pages.

It never invents a heading: the bookmarks are the h1 and the
<div class="sect"><h3> titles the builder wrote, located on the pages in
document order. A heading the print engine split across a line break is
skipped rather than guessed at.

Engines: PyMuPDF (pip install pymupdf) does the work; pypdf is the
fallback; with neither installed the PDF is left as printed and one
console line says so. Never raises - a finishing step must not stop a
report that has already rendered.
"""

import html as _html
import re

AUTHOR = "Andrew Fisher"
CREATOR = "Coates Ampol Reporting Suite - POWERED BY SITEIQ"
KEYWORDS_BASE = "Coates, Ampol, Lytton Refinery, tool store, SiteIQ"

_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")


def _clean(t):
    return _WS.sub(" ", _html.unescape(_TAG.sub("", t))).strip()


def headings_from_html(doc):
    """[(level, text)] in document order: the cover / report h1 (level 1)
    and every section title written as <div class="sect"><h3>...</h3>
    (level 1), <h4> inside a section (level 2). Running page headers
    (h2) are not sections and are left out."""
    out = []
    body = doc
    m = re.search(r"<body[^>]*>", doc, re.I)
    if m:
        body = doc[m.end():]
    for tag, level in (("h3", 1), ("h4", 2)):
        pass
    for m in re.finditer(r"<div class=\"sect[^\"]*\">\s*<h3[^>]*>(.*?)</h3>|<h4[^>]*>(.*?)</h4>",
                         body, re.S | re.I):
        if m.group(1) is not None:
            t = _clean(m.group(1))
            if t:
                out.append((1, t))
        else:
            t = _clean(m.group(2))
            if t and out:
                out.append((2, t))
    # drop exact repeats that follow each other (a heading repeated on a
    # continuation page is the same section)
    dedup = []
    for lv, t in out:
        if dedup and dedup[-1][1] == t:
            continue
        dedup.append((lv, t))
    return dedup


def _find_page(pages_text, text, start):
    """First page index >= start whose text holds the heading (or its
    first 28 characters when the full heading did not survive a wrap)."""
    probes = [text, text[:40].strip(), text[:28].strip()]
    for pr in probes:
        if len(pr) < 6:
            continue
        pr_n = _WS.sub(" ", pr)
        for i in range(start, len(pages_text)):
            if pr_n in pages_text[i]:
                return i
    return None


def finish(pdf_path, title, subject, html_doc="", keywords="", has_cover=False,
           family=""):
    """Stamp properties and build the outline. Returns a one-line note for
    the console (always printed by the caller)."""
    pdf_path = str(pdf_path)
    kw = KEYWORDS_BASE + (f", {family}" if family else "") + (f", {keywords}" if keywords else "")
    heads = headings_from_html(html_doc) if html_doc else []
    try:
        import pymupdf
    except ImportError:
        pymupdf = None
    if pymupdf is not None:
        try:
            doc = pymupdf.open(pdf_path)
            doc.set_metadata({"title": title, "author": AUTHOR, "subject": subject,
                              "keywords": kw, "creator": CREATOR})
            pages_text = [_WS.sub(" ", p.get_text()) for p in doc]
            toc = []
            if has_cover and len(doc) > 1:
                toc.append([1, "Cover", 1])
                toc.append([1, "The position", 2])
            elif len(doc):
                toc.append([1, "The position", 1])
            cur = 1 if has_cover else 0
            for lv, t in heads:
                i = _find_page(pages_text, t, cur)
                if i is None:
                    continue
                cur = i
                # the position page is page 1 (or 2) - a section found there
                # would sit under its own bookmark; keep them in order
                toc.append([lv, t[:90], i + 1])
            # levels must not jump by more than one
            fixed = []
            for lv, t, p in toc:
                if fixed and lv > fixed[-1][0] + 1:
                    lv = fixed[-1][0] + 1
                fixed.append([lv, t, p])
            doc.set_toc(fixed)
            doc.save(pdf_path, incremental=True, encryption=pymupdf.PDF_ENCRYPT_KEEP)
            doc.close()
            return f"PDF properties + {len(fixed)} bookmarks written (Author: {AUTHOR})"
        except Exception as e:  # never stop a rendered report
            return f"NOTE: PDF properties/bookmarks not written ({type(e).__name__}: {e})"
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        return ("NOTE: PDF properties and bookmarks skipped - install PyMuPDF "
                "(pip install pymupdf) to stamp Author and the navigation pane")
    try:
        r = PdfReader(pdf_path)
        w = PdfWriter()
        w.append(r)
        w.add_metadata({"/Title": title, "/Author": AUTHOR, "/Subject": subject,
                        "/Keywords": kw, "/Creator": CREATOR})
        pages_text = [_WS.sub(" ", (p.extract_text() or "")) for p in r.pages]
        n = 0
        parents = {}
        start = 1 if has_cover else 0
        if has_cover and len(r.pages) > 1:
            w.add_outline_item("Cover", 0)
            w.add_outline_item("The position", 1)
        elif len(r.pages):
            w.add_outline_item("The position", 0)
        cur = start
        for lv, t in heads:
            i = _find_page(pages_text, t, cur)
            if i is None:
                continue
            cur = i
            parent = parents.get(lv - 1) if lv > 1 else None
            item = w.add_outline_item(t[:90], i, parent=parent)
            parents[lv] = item
            n += 1
        with open(pdf_path, "wb") as f:
            w.write(f)
        return f"PDF properties + {n} bookmarks written via pypdf (Author: {AUTHOR})"
    except Exception as e:
        return f"NOTE: PDF properties/bookmarks not written ({type(e).__name__}: {e})"


def contents_from_pdf(pdf_path, html_doc, has_cover=True, max_rows=12, skip=()):
    """(title, page) rows for the cover's "What's inside" block, read off
    the PRINTED pages so every number is real. Level-1 headings only, in
    document order; "The position" is the first row. skip: titles to leave
    out (a report's own closing page, say). Empty list when nothing can be
    read (no PyMuPDF / pypdf) - the cover then prints no block."""
    heads = [(lv, t) for lv, t in headings_from_html(html_doc) if lv == 1 and t not in skip]
    pages_text = None
    try:
        import pymupdf
        doc = pymupdf.open(str(pdf_path))
        pages_text = [_WS.sub(" ", p.get_text()) for p in doc]
        doc.close()
    except ImportError:
        try:
            from pypdf import PdfReader
            pages_text = [_WS.sub(" ", (p.extract_text() or "")) for p in PdfReader(str(pdf_path)).pages]
        except ImportError:
            return []
    except Exception:
        return []
    rows = [("The position", 2 if has_cover else 1)]
    cur = 1 if has_cover else 0
    for _, t in heads:
        i = _find_page(pages_text, t, cur)
        if i is None:
            continue
        cur = i
        if rows and rows[-1][1] == i + 1:
            continue          # one row per page: the first heading on it names it
        rows.append((t, i + 1))
    return rows[:max_rows]


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        sys.exit("usage: pdf_finish.py report.pdf report.html")
    doc = open(sys.argv[2], encoding="utf-8").read()
    print(finish(sys.argv[1], "test", "test", doc, has_cover='class="fcover"' in doc or 'page cover' in doc))
