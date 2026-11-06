#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | the Excel twin of a report - one writer, the kit's workbook look.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (06 Nov 2026, client feedback): every report gets an Excel copy beside
its PDF, built from the SAME model the PDF was built from, so the two
cannot disagree, and with a filter on every tab so the client can cut it
any way they ask - including leaving companies out.

THE LOOK is the Rio / MMG on-hire workbook: a Cover on a twelve-column
grid (key facts, headline tiles, a clickable list of tabs, the sources,
what needs attention), a Dashboard of native Excel charts drawn from a
Chart Data tab, and one data tab per table - the COATES band, a charcoal
heading row, frozen headings, a filter, zebra rows, Excel's own
conditional colour on the columns that carry a judgement, and print
settings that put it on A4 the right way round.

USE
    wb = Workbook("Tooling On-Hire Report", "Ampol Lytton Refinery - Permanent Tool Store",
                  asat="06 Sep 2026 18:48", kicker="COATES - TOOL STORE - TOOLING ON-HIRE REPORT")
    wb.sheet("On hire", ["Company", "Hirer", "Barcode", "Description", "On hire since", "Days", "Replacement"],
             rows, formats={4: DATE, 5: INT, 6: MONEY}, rules={5: ("days", 30, 90)})
    wb.chart("bar", "Items on hire by company", ["Ampol", "Wood"], [("Items", [205, 91])])
    wb.cover(facts=[("As at", ...)], headlines=[("Items on hire", 1506, ""), ...],
             asks=[("Chase Ampol for 164 items over 90 days", "...", "Andrew Fisher - by 13 Sep")],
             notes=["Companies left out at the client's request: ..."])
    wb.save(path)
"""
import datetime as dt
import os
import re

import openpyxl
from openpyxl.chart import BarChart, DoughnutChart, LineChart, Reference
from openpyxl.chart.series import DataPoint
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties
from openpyxl.formatting.rule import CellIsRule, DataBarRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

# ---- the palette (the on-hire kit's) ---------------------------------
ORANGE, INK, SLATE, MUTED = "F26222", "1D1D1B", "2A313C", "5B6472"
LINE, ZEBRA, SOFT, TINT, GREY = "DDE1E7", "F6F7F9", "F3F4F7", "FFF1EA", "8B9099"
RAG = {"red": ("FBE7E6", "A32015", "D0342C"), "amber": ("FDF1DC", "8A5300", "E08A24"),
       "green": ("E8F3E9", "1E6B32", "409A55"), "slate": ("E9ECF0", "4A5361", "98A0AA"),
       "orange": ("FFF1EA", "A6410F", "F26222")}
WHITE = "FFFFFF"

INT, MONEY, PCT, PCT1, DATE, DATETIME, TIME = ("#,##0", "$#,##0.00", "0%", "0.0%",
                                               "dd mmm yyyy", "dd mmm yyyy hh:mm", "hh:mm")
TEXT = "@"


def _argb(h):
    h = h.lstrip("#")
    return ("FF" + h) if len(h) == 6 else h


def _fill(h):
    return PatternFill("solid", fgColor=_argb(h))


def _font(size=11, bold=False, colour=INK, italic=False, underline=None):
    return Font(name="Calibri", size=size, bold=bold, italic=italic, color=_argb(colour), underline=underline)


THIN = Side(style="thin", color=_argb(LINE))
HAIR = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
BOTTOM = Border(bottom=THIN)
HDR_SIDE = Side(style="thin", color=_argb(SLATE))
HDR_BORDER = Border(left=HDR_SIDE, right=HDR_SIDE, top=HDR_SIDE, bottom=HDR_SIDE)
RULE = Side(style="medium", color=_argb(ORANGE))
BAND_H = 34

_RICH = True
try:
    from openpyxl.cell.rich_text import CellRichText, TextBlock
    from openpyxl.cell.text import InlineFont
except Exception:               # an older openpyxl: plain text band
    _RICH = False


def _s(v):
    return "" if v is None else str(v)


def _len(v):
    if isinstance(v, (int, float)):
        return len(f"{v:,.2f}") if isinstance(v, float) else len(f"{v:,}")
    if isinstance(v, (dt.date, dt.datetime)):
        return 12
    return len(_s(v))


class Workbook:
    """One report's workbook. Tabs are added in the order they should read;
    cover() builds the front page last from what was added."""

    def __init__(self, title, project, asat, kicker="", client="Ampol", author="Andrew Fisher",
                 gen=None, hidden_note=""):
        self.title, self.project, self.asat = title, project, asat
        self.kicker = kicker or f"COATES - TOOL STORE - {title.upper()}"
        self.client, self.author = client, author
        self.gen = gen or dt.datetime.now().strftime("%d %b %Y %H:%M")
        self.hidden_note = hidden_note
        self.wb = openpyxl.Workbook()
        self.wb.remove(self.wb.active)
        self.tabs = []                      # (name, rows, what it tells you)
        self.charts = []                    # chart specs for the Dashboard
        self._chart_rows = 0
        self.sources = []                   # (file, pulled, used for)

    # ------------------------------------------------------------ pieces
    def band(self, ws, ncols, right="POWERED BY SITEIQ"):
        ncols = max(ncols, 1)
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
        c = ws.cell(row=1, column=1)
        text = f"{self.client} | {self.title}"
        if _RICH:
            try:
                c.value = CellRichText(
                    TextBlock(InlineFont(rFont="Calibri", sz=15, b=True, color=_argb(ORANGE)), "COATES"),
                    TextBlock(InlineFont(rFont="Calibri", sz=11, color=_argb("6B7280")), "    |    "),
                    TextBlock(InlineFont(rFont="Calibri", sz=12, b=True, color=_argb(WHITE)), text),
                    TextBlock(InlineFont(rFont="Calibri", sz=9, b=True, color=_argb("9AA2AC")), "          POWERED BY "),
                    TextBlock(InlineFont(rFont="Calibri", sz=9, b=True, color=_argb(ORANGE)), "SITEIQ"))
            except Exception:
                c.value = f"COATES    |    {text}          POWERED BY SITEIQ"
        else:
            c.value = f"COATES    |    {text}          POWERED BY SITEIQ"
        c.font = _font(14, True, WHITE)
        c.alignment = Alignment(vertical="center", indent=1)
        for i in range(1, ncols + 1):
            cell = ws.cell(row=1, column=i)
            cell.fill = _fill(INK)
            cell.border = Border(bottom=RULE)
        ws.row_dimensions[1].height = BAND_H

    def _strip(self, ws, ncols, text):
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncols)
        c = ws.cell(row=2, column=1, value=text)
        c.font = _font(8.5, True, MUTED)
        c.alignment = Alignment(vertical="center", indent=1)
        for i in range(1, ncols + 1):
            ws.cell(row=2, column=i).fill = _fill(SOFT)
            ws.cell(row=2, column=i).border = BOTTOM
        ws.row_dimensions[2].height = 18

    def print_setup(self, ws, ncols, landscape=True, name="", title_rows="1:2"):
        ws.page_setup.orientation = "landscape" if landscape else "portrait"
        ws.page_setup.paperSize = ws.PAPERSIZE_A4
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 0
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.print_title_rows = title_rows
        ws.print_options.horizontalCentered = True
        ws.page_margins.left = ws.page_margins.right = 0.3
        ws.page_margins.top = ws.page_margins.bottom = 0.55
        ws.page_margins.header = ws.page_margins.footer = 0.25
        ws.oddHeader.left.text = f'&"Calibri,Bold"COATES&"Calibri"  |  {name or self.title}'
        ws.oddHeader.left.size = 8
        ws.oddHeader.right.text = f"{self.project}  |  As at {self.asat}"
        ws.oddHeader.right.size = 8
        ws.oddFooter.left.text = f"POWERED BY SITEIQ  |  Author: {self.author}"
        ws.oddFooter.left.size = 8
        ws.oddFooter.center.text = "Counted from the SiteIQ exports - nothing estimated"
        ws.oddFooter.center.size = 8
        ws.oddFooter.right.text = "Page &P of &N"
        ws.oddFooter.right.size = 8

    # ---------------------------------------------------------- data tab
    def sheet(self, name, columns, rows, widths=None, formats=None, rules=None, note="",
              emphasis=None, what="", wrap=None, hide=False):
        """One data tab. formats: {col index: number format} (numbers right-
        aligned, dates centred). rules: {col index: kind} where kind is
        'rag' (High Demand / Good Use / Low Use / No Use), 'status' (On Hire),
        ('days', amber_at, red_at), 'bar' (a 0-1 data bar), 'rag_word'
        (Red / Amber / Green words), or 'yes_no'. emphasis: f(row) -> bool for
        total rows. what: the one-line description for the Cover's list."""
        name = self._tab_name(name)
        ws = self.wb.create_sheet(name)
        ncols = len(columns)
        self.band(ws, ncols)
        for i, col in enumerate(columns, start=1):
            c = ws.cell(row=2, column=i, value=col)
            c.font = _font(10, True, WHITE)
            c.fill = _fill(SLATE)
            c.border = HDR_BORDER
            c.alignment = Alignment(vertical="center", horizontal="center", wrap_text=True)
        ws.row_dimensions[2].height = 34
        fmts = formats or {}
        right = {i for i, f in fmts.items() if f in (INT, MONEY, PCT, PCT1, "#,##0.00", "0.0", "0")}
        middle = {i for i, f in fmts.items() if f in (DATE, DATETIME, TIME)}
        wrap = set(wrap or ())
        for r, row in enumerate(rows, start=3):
            total = bool(emphasis and emphasis(row))
            stripe = r % 2 == 1
            for i, v in enumerate(row, start=1):
                if isinstance(v, float) and v != v:        # NaN never lands in a cell
                    v = None
                c = ws.cell(row=r, column=i, value=v)
                c.font = _font(11, total)
                c.border = HAIR
                if total:
                    c.fill = _fill(TINT)
                elif stripe:
                    c.fill = _fill(ZEBRA)
                k = i - 1
                if k in right:
                    c.alignment = Alignment(horizontal="right", vertical="center")
                elif k in middle:
                    c.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    c.alignment = Alignment(vertical="center", wrap_text=(k in wrap))
                f = fmts.get(k)
                if f:
                    c.number_format = f
        for i, col in enumerate(columns, start=1):
            letter = get_column_letter(i)
            if widths and (i - 1) in widths:
                ws.column_dimensions[letter].width = widths[i - 1]
            else:
                longest = max([len(_s(col))] + [_len(r[i - 1]) for r in rows[:500] if i - 1 < len(r)] or [10])
                ws.column_dimensions[letter].width = min(max(longest + 2, 11), 60)
        ws.freeze_panes = "A3"
        if rows:
            last = len(rows) + 2
            ws.auto_filter.ref = f"A2:{get_column_letter(ncols)}{last}"
            for k, kind in (rules or {}).items():
                self._decorate(ws, f"{get_column_letter(k + 1)}3:{get_column_letter(k + 1)}{last}", kind)
        else:
            c = ws.cell(row=3, column=1, value="Nothing to show for this pull - no rows matched this tab.")
            c.font = _font(10, False, MUTED, italic=True)
        if note:
            r = len(rows) + 4
            ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=max(ncols, 1))
            c = ws.cell(row=r, column=1, value=note)
            c.font = _font(9.5, False, MUTED, italic=True)
            c.alignment = Alignment(wrap_text=True, vertical="top")
            ws.row_dimensions[r].height = 15 * max(1, len(note) // 150 + 1) + 4
        self.print_setup(ws, ncols, name=name)
        ws.sheet_properties.tabColor = _argb(SLATE)
        if hide:
            ws.sheet_state = "hidden"
        self.tabs.append((name, len(rows), what))
        return ws

    def _decorate(self, ws, rng, kind):
        if isinstance(kind, tuple):
            kind, args = kind[0], kind[1:]
        else:
            args = ()
        if kind == "rag":
            tone = {"High Demand": "amber", "Good Use": "green", "Low Use": "slate", "No Use": "slate",
                    "Increase Stock": "amber", "Monitor / Increase": "amber", "Keep Stock": "green",
                    "Review / Reduce": "slate"}
            for w, t in tone.items():
                fill, text, _b = RAG[t]
                ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=[f'"{w}"'],
                                                              fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
        elif kind == "rag_word":
            for w, t in (("Red", "red"), ("Amber", "amber"), ("Green", "green"), ("RED", "red"),
                         ("AMBER", "amber"), ("GREEN", "green"), ("Critical", "red"), ("High", "amber"),
                         ("Watch", "green"), ("Overdue", "red"), ("Due soon", "amber"), ("Current", "green")):
                fill, text, _b = RAG[t]
                ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=[f'"{w}"'],
                                                              fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
        elif kind == "status":
            fill, text, _b = RAG["orange"]
            ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"On Hire"'],
                                                          fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
        elif kind == "days":
            amber_at = args[0] if args else 30
            red_at = args[1] if len(args) > 1 else 90
            fill, text, _b = RAG["red"]
            ws.conditional_formatting.add(rng, CellIsRule(operator="greaterThanOrEqual", formula=[str(red_at)],
                                                          fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
            fill, text, _b = RAG["amber"]
            ws.conditional_formatting.add(rng, CellIsRule(operator="greaterThanOrEqual", formula=[str(amber_at)],
                                                          fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
        elif kind == "bar":
            ws.conditional_formatting.add(rng, DataBarRule(start_type="num", start_value=0, end_type="num",
                                                           end_value=(args[0] if args else 1), color=ORANGE, showValue=True))
        elif kind == "yes_no":
            fill, text, _b = RAG["red"]
            ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"No"'],
                                                          fill=_fill(fill), font=Font(color=_argb(text), bold=True)))
            fill, text, _b = RAG["green"]
            ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"Yes"'],
                                                          fill=_fill(fill), font=Font(color=_argb(text), bold=True)))

    def _tab_name(self, name):
        name = re.sub(r"[\[\]\*\?/\\:]", "-", _s(name)).strip()[:31] or "Sheet"
        base, n = name, 2
        while name in self.wb.sheetnames:
            name = f"{base[:28]} {n}"
            n += 1
        return name

    # ---------------------------------------------------------- charts
    def chart(self, kind, title, categories, series, colours=None, fmt=None, legend=None, note=""):
        """Queue a native Excel chart for the Dashboard. kind: 'bar'
        (horizontal), 'col', 'line', 'doughnut', 'stacked'. series:
        [(name, [values...])]. The data goes on the Chart Data tab."""
        self.charts.append(dict(kind=kind, title=title, cats=list(categories), series=list(series),
                                colours=colours, fmt=fmt, legend=legend, note=note))

    def _chart_data_sheet(self):
        if "Chart Data" in self.wb.sheetnames:
            return self.wb["Chart Data"]
        cd = self.wb.create_sheet("Chart Data")
        cd.sheet_view.showGridLines = False
        self.band(cd, 6)
        self._strip(cd, 6, "The small tables the Dashboard charts are drawn from - the same figures as the tabs. Nothing to type here.")
        cd.column_dimensions["A"].width = 40
        for i in range(2, 8):
            cd.column_dimensions[get_column_letter(i)].width = 16
        cd.sheet_properties.tabColor = _argb(GREY)
        self._chart_rows = 4
        return cd

    def _write_chart_table(self, cd, spec):
        d = self._chart_rows
        t = cd.cell(row=d, column=1, value=spec["title"].upper())
        t.font = _font(9, True, "A6410F")
        d += 1
        head = d
        heads = ["Category"] + [n for n, _v in spec["series"]]
        for i, h in enumerate(heads, start=1):
            c = cd.cell(row=d, column=i, value=h)
            c.font = _font(10, True, WHITE); c.fill = _fill(SLATE); c.border = HDR_BORDER
            c.alignment = Alignment(horizontal="left" if i == 1 else "right", vertical="center", indent=1)
        for j, cat in enumerate(spec["cats"], start=1):
            c = cd.cell(row=d + j, column=1, value=cat)
            c.font = _font(11); c.border = HAIR; c.alignment = Alignment(indent=1)
            if j % 2 == 0:
                c.fill = _fill(ZEBRA)
            for i, (_n, vals) in enumerate(spec["series"], start=2):
                v = vals[j - 1] if j - 1 < len(vals) else None
                c = cd.cell(row=d + j, column=i, value=v)
                c.font = _font(11); c.border = HAIR
                c.alignment = Alignment(horizontal="right")
                c.number_format = spec["fmt"] or (PCT if isinstance(v, float) and 0 <= v <= 1 else INT)
                if j % 2 == 0:
                    c.fill = _fill(ZEBRA)
        last = d + len(spec["cats"])
        self._chart_rows = last + 2
        return head, last

    @staticmethod
    def _finish(ch, title, legend=None):
        from openpyxl.drawing.text import CharacterProperties, ParagraphProperties
        ch.title = title
        try:
            for p in ch.title.tx.rich.p:
                p.pPr = ParagraphProperties(defRPr=CharacterProperties(sz=1200, b=True, solidFill=SLATE))
                for run in (p.r or []):
                    run.rPr = CharacterProperties(sz=1200, b=True, solidFill=SLATE)
            ch.title.overlay = False
        except Exception:
            pass
        for ax in ("x_axis", "y_axis"):
            a = getattr(ch, ax, None)
            if a is not None:
                try:
                    a.delete = False
                except Exception:
                    pass
        if legend is None:
            ch.legend = None
        elif ch.legend is not None:
            ch.legend.position = legend
        try:
            ch.graphical_properties = GraphicalProperties(ln=LineProperties(solidFill=LINE))
        except Exception:
            pass
        ch.width, ch.height = 13.3, 8.2
        return ch

    def dashboard(self, tiles=None):
        """The Dashboard tab: dark headline tiles then the queued charts,
        two across. tiles: [(label, value, sub)] up to six."""
        if not self.charts and not tiles:
            return None
        ws = self.wb.create_sheet("Dashboard", 0)
        ws.sheet_view.showGridLines = False
        ws.sheet_view.showRowColHeaders = False
        NC = 12
        for i in range(1, NC + 1):
            ws.column_dimensions[get_column_letter(i)].width = 11.5
        self.band(ws, NC)
        self._strip(ws, NC, f"POWERED BY SITEIQ     ·     Author: {self.author}     ·     Charts are live - Excel draws them from the Chart Data tab     ·     As at {self.asat}")
        ws.row_dimensions[3].height = 10
        r = 4
        if tiles:
            for k, (label, value, sub) in enumerate(tiles[:6]):
                col = 1 + k * 2
                ws.merge_cells(start_row=r, start_column=col, end_row=r, end_column=col + 1)
                c = ws.cell(row=r, column=col, value=value)
                c.font = _font(20, True, WHITE); c.alignment = Alignment(vertical="center", indent=1)
                if isinstance(value, (int, float)):
                    c.number_format = INT if isinstance(value, int) else "#,##0.00"
                ws.merge_cells(start_row=r + 1, start_column=col, end_row=r + 1, end_column=col + 1)
                c = ws.cell(row=r + 1, column=col, value=(label.upper() + (f"  -  {sub}" if sub else "")))
                c.font = _font(8.5, True, "F7A072"); c.alignment = Alignment(vertical="top", indent=1, wrap_text=True)
                for cc in (col, col + 1):
                    ws.cell(row=r, column=cc).border = Border(top=RULE)
            for rr in (r, r + 1):
                for cc in range(1, NC + 1):
                    ws.cell(row=rr, column=cc).fill = _fill(INK)
            ws.row_dimensions[r].height = 32
            ws.row_dimensions[r + 1].height = 26
            r = 7
        cd = self._chart_data_sheet() if self.charts else None
        row = r
        for n, spec in enumerate(self.charts):
            head, last = self._write_chart_table(cd, spec)
            kind = spec["kind"]
            if kind == "doughnut":
                ch = DoughnutChart(holeSize=58)
                ch.add_data(Reference(cd, min_col=2, min_row=head, max_row=last), titles_from_data=True)
                ch.set_categories(Reference(cd, min_col=1, min_row=head + 1, max_row=last))
                cols = spec["colours"] or [ORANGE, SLATE, "98A0AA", "E08A24", "409A55", "D0342C"]
                for i in range(len(spec["cats"])):
                    pt = DataPoint(idx=i)
                    pt.graphicalProperties = GraphicalProperties(solidFill=cols[i % len(cols)])
                    pt.graphicalProperties.line = LineProperties(solidFill=WHITE)
                    ch.series[0].dPt.append(pt)
                self._finish(ch, spec["title"], legend=spec["legend"] or "b")
            else:
                if kind == "line":
                    ch = LineChart()
                else:
                    ch = BarChart()
                    ch.type = "bar" if kind == "bar" else "col"
                    if kind == "stacked":
                        ch.grouping = "stacked"; ch.overlap = 100
                    ch.gapWidth = 60
                ch.style = 10
                ch.add_data(Reference(cd, min_col=2, max_col=1 + len(spec["series"]), min_row=head, max_row=last),
                            titles_from_data=True)
                ch.set_categories(Reference(cd, min_col=1, min_row=head + 1, max_row=last))
                cols = spec["colours"] or [ORANGE, SLATE, "98A0AA", "E08A24", "409A55", "D0342C"]
                for i, srs in enumerate(ch.series):
                    hexc = cols[i % len(cols)]
                    srs.graphicalProperties = GraphicalProperties(solidFill=hexc)
                    srs.graphicalProperties.line = LineProperties(solidFill=hexc, w=(28000 if kind == "line" else None))
                    if kind == "line":
                        srs.graphicalProperties.solidFill = None
                        srs.marker.symbol = "circle"; srs.marker.size = 6
                        srs.marker.graphicalProperties = GraphicalProperties(solidFill=hexc)
                        srs.marker.graphicalProperties.line = LineProperties(solidFill=hexc)
                        srs.smooth = False
                ch.y_axis.majorGridlines = None
                if kind == "bar":
                    ch.x_axis.scaling.orientation = "maxMin"
                ch.x_axis.tickLblSkip = 1
                ch.x_axis.tickMarkSkip = 1
                if spec["fmt"]:
                    ch.y_axis.number_format = spec["fmt"]
                self._finish(ch, spec["title"], legend=(spec["legend"] if spec["legend"] is not None
                                                        else ("b" if len(spec["series"]) > 1 else None)))
            col = 1 if n % 2 == 0 else 7
            ws.add_chart(ch, f"{get_column_letter(col)}{row}")
            if n % 2 == 1:
                row += 17
        if self.charts and len(self.charts) % 2 == 1:
            row += 17
        self.print_setup(ws, NC, landscape=False, name="Dashboard", title_rows="1:1")
        ws.print_area = f"A1:L{max(row, 20)}"
        ws.page_setup.fitToHeight = 1
        ws.sheet_properties.tabColor = _argb(ORANGE)
        if cd is not None:
            self.print_setup(cd, 6, name="Chart Data", title_rows="1:1")
        self.tabs.insert(0, ("Dashboard", "-", "Headline tiles and live charts"))
        return ws

    # ------------------------------------------------------------ cover
    def cover(self, facts, headlines, asks=None, notes=None, sources=None, lines=None):
        """The front page. facts: [(label, value)] (nine fit three across);
        headlines: [(label, value, note)] as tiles, four across; asks:
        [(what, why, owner)]; notes: provenance sentences; sources:
        [(file, pulled, used for)]; lines: the position in a few true lines."""
        ws = self.wb.create_sheet("Cover", 0)
        ws.sheet_view.showGridLines = False
        ws.sheet_view.showRowColHeaders = False
        NC = 12
        for i in range(1, NC + 1):
            ws.column_dimensions[get_column_letter(i)].width = 10.2
        LABEL = _font(8, True, MUTED)
        VALUE = _font(11, True)
        BIG = _font(20, True)
        HEAD = _font(10, True)
        hair = THIN
        accent = RULE

        def put(row, col, value, font=None, fmt=None, align=None, fill=None):
            c = ws.cell(row=row, column=col, value=value)
            c.font = font or _font(10.5, False, "33383F")
            if fmt:
                c.number_format = fmt
            if align:
                c.alignment = align
            if fill:
                c.fill = fill
            return c

        def merge(row, c1, c2):
            ws.merge_cells(start_row=row, start_column=c1, end_row=row, end_column=c2)

        def heading(row, text):
            put(row, 1, text.upper(), HEAD, align=Alignment(vertical="bottom"))
            for cc in range(1, NC + 1):
                ws.cell(row=row, column=cc).border = Border(bottom=accent if cc <= 2 else hair)
            ws.row_dimensions[row].height = 24
            return row + 1

        def gap(row, h=8):
            ws.row_dimensions[row].height = h
            return row + 1

        def lines_needed(text, chars):
            import textwrap
            return sum(max(1, len(textwrap.wrap(part, width=chars))) if part else 1 for part in _s(text).split("\n"))

        self.band(ws, NC)
        self._strip(ws, NC, f"POWERED BY SITEIQ     ·     Author: {self.author}     ·     The Excel twin of the PDF report - the same figures, every tab filterable")
        ws.row_dimensions[3].height = 10
        r = 4
        merge(r, 1, NC); put(r, 1, f"{self.client} {self.title}", _font(24, True), align=Alignment(vertical="center")); ws.row_dimensions[r].height = 34
        r += 1
        merge(r, 1, NC); put(r, 1, self.project, _font(12, False, MUTED), align=Alignment(vertical="center")); ws.row_dimensions[r].height = 20
        r += 1
        merge(r, 1, NC); put(r, 1, f"Data as at {self.asat}  ·  built {self.gen}", _font(11, True, "A6410F"), align=Alignment(vertical="center")); ws.row_dimensions[r].height = 18
        r += 1
        r = gap(r, 10)
        if lines:
            r = heading(r, "Where we sit")
            r = gap(r, 4)
            for ln in lines:
                merge(r, 1, NC)
                put(r, 1, ln, _font(11), align=Alignment(wrap_text=True, vertical="top", indent=1))
                ws.row_dimensions[r].height = 15 * lines_needed(ln, 125) + 6
                r += 1
            r = gap(r, 6)
        # facts, three across
        r = heading(r, "Key facts")
        r = gap(r, 4)
        SPAN = NC // 3
        value_h = max([22] + [15 * lines_needed(v, 36) + 7 for _l, v in facts])
        for start in range(0, len(facts), 3):
            for k, (label, value) in enumerate(facts[start:start + 3]):
                c1 = 1 + k * SPAN; c2 = c1 + SPAN - 1
                merge(r, c1, c2); put(r, c1, _s(label).upper(), LABEL, align=Alignment(vertical="bottom", indent=1))
                merge(r + 1, c1, c2); put(r + 1, c1, value, VALUE, align=Alignment(wrap_text=True, vertical="top", indent=1))
                for cc in range(c1, c2 + 1):
                    ws.cell(row=r + 1, column=cc).border = BOTTOM
            ws.row_dimensions[r].height = 13
            ws.row_dimensions[r + 1].height = value_h
            r += 2
            r = gap(r, 5)
        r = gap(r, 6)
        # headlines as tiles, four across
        if headlines:
            r = heading(r, "The headlines")
            r = gap(r, 6)
            PER = 4; span = NC // PER
            for start in range(0, len(headlines), PER):
                for k, item in enumerate(headlines[start:start + PER]):
                    label, value = item[0], item[1]
                    note = item[2] if len(item) > 2 else ""
                    c1 = 1 + k * span; c2 = c1 + span - 1
                    merge(r, c1, c2)
                    money = isinstance(value, float) or ("$" in _s(label)) or ("value" in _s(label).lower()) or ("exposure" in _s(label).lower()) or ("cost" in _s(label).lower())
                    if isinstance(value, (int, float)):
                        put(r, c1, value, BIG, fmt=(MONEY if money else INT), align=Alignment(vertical="center", horizontal="left", indent=1))
                    else:
                        put(r, c1, value, BIG, align=Alignment(vertical="center", horizontal="left", indent=1))
                    merge(r + 1, c1, c2)
                    put(r + 1, c1, _s(label).upper() + (f"  ·  {note}" if note else ""), LABEL, align=Alignment(vertical="top", indent=1))
                    for cc in range(c1, c2 + 1):
                        ws.cell(row=r, column=cc).border = Border(top=accent, left=hair if cc == c1 else None, right=hair if cc == c2 else None)
                        ws.cell(row=r + 1, column=cc).border = Border(bottom=hair, left=hair if cc == c1 else None, right=hair if cc == c2 else None)
                ws.row_dimensions[r].height = 32
                ws.row_dimensions[r + 1].height = 18
                r += 2
                r = gap(r, 6)
            r = gap(r, 4)
        # the asks
        if asks:
            r = heading(r, "What needs attention")
            r = gap(r, 4)
            for n, ask in enumerate(asks, start=1):
                what, why, who = (list(ask) + ["", ""])[:3]
                c = put(r, 1, n, _font(11, True, WHITE), fill=_fill(ORANGE), align=Alignment(horizontal="center", vertical="center"))
                merge(r, 2, 9); put(r, 2, f"{what}" + (f"  -  {why}" if why else ""), _font(10.5, True), align=Alignment(vertical="center", indent=1, wrap_text=True))
                merge(r, 10, NC); put(r, 10, who, _font(9, False, MUTED), align=Alignment(vertical="center", horizontal="right", indent=1, wrap_text=True))
                for cc in range(1, NC + 1):
                    ws.cell(row=r, column=cc).border = BOTTOM
                ws.row_dimensions[r].height = max(20, 15 * lines_needed(f"{what} - {why}", 78) + 5)
                r += 1
            r = gap(r, 8)
        # what's in this workbook
        r = heading(r, "What's in this workbook")
        c1 = 1
        for text, span, al in (("Tab", 3, "left"), ("Rows", 1, "right"), ("What it tells you", 8, "left")):
            if span > 1:
                merge(r, c1, c1 + span - 1)
            put(r, c1, text, _font(10, True, WHITE), fill=_fill(SLATE), align=Alignment(vertical="center", horizontal=al, indent=1))
            for cc in range(c1, c1 + span):
                ws.cell(row=r, column=cc).fill = _fill(SLATE); ws.cell(row=r, column=cc).border = HDR_BORDER
            c1 += span
        ws.row_dimensions[r].height = 20
        r += 1
        for n_, (name, n, why) in enumerate(self.tabs):
            merge(r, 1, 3)
            c = put(r, 1, name, _font(10.5, True, INK, underline="single"), align=Alignment(vertical="center", indent=1))
            try:
                c.hyperlink = "#'{}'!A1".format(name.replace("'", "''"))
                c.font = _font(10.5, True, INK, underline="single")
            except Exception:
                pass
            put(r, 4, n if isinstance(n, int) else (n or "-"), _font(10.5), fmt=INT, align=Alignment(horizontal="right", vertical="center", indent=1))
            merge(r, 5, NC); put(r, 5, why, _font(10.5, False, MUTED), align=Alignment(vertical="center", indent=1))
            for cc in range(1, NC + 1):
                ws.cell(row=r, column=cc).border = BOTTOM
                if n_ % 2:
                    ws.cell(row=r, column=cc).fill = _fill(ZEBRA)
            ws.row_dimensions[r].height = 17
            r += 1
        r = gap(r, 8)
        # sources and notes
        sources = sources or self.sources
        if sources or notes or self.hidden_note:
            r = heading(r, "Where the numbers came from")
            if sources:
                c1 = 1
                for text, span in (("Export", 3), ("Pulled from SiteIQ", 3), ("Used for", 6)):
                    merge(r, c1, c1 + span - 1)
                    put(r, c1, text, _font(10, True, WHITE), fill=_fill(SLATE), align=Alignment(vertical="center", indent=1))
                    for cc in range(c1, c1 + span):
                        ws.cell(row=r, column=cc).fill = _fill(SLATE); ws.cell(row=r, column=cc).border = HDR_BORDER
                    c1 += span
                ws.row_dimensions[r].height = 20
                r += 1
                for n_, (f, pulled, used) in enumerate(sources):
                    merge(r, 1, 3); put(r, 1, f, _font(10.5, True), align=Alignment(vertical="center", indent=1))
                    merge(r, 4, 6); put(r, 4, pulled, _font(10.5), align=Alignment(vertical="center", horizontal="left", indent=1))
                    merge(r, 7, NC); put(r, 7, used, _font(10.5, False, MUTED), align=Alignment(vertical="center", indent=1))
                    for cc in range(1, NC + 1):
                        ws.cell(row=r, column=cc).border = BOTTOM
                        if n_ % 2:
                            ws.cell(row=r, column=cc).fill = _fill(ZEBRA)
                    ws.row_dimensions[r].height = 18
                    r += 1
            for text in ([self.hidden_note] if self.hidden_note else []) + list(notes or []):
                merge(r, 1, NC)
                strong = text == self.hidden_note
                put(r, 1, text, _font(10.5, strong, "A6410F" if strong else "33383F"),
                    fill=_fill(TINT) if strong else None, align=Alignment(wrap_text=True, vertical="top", indent=1))
                if strong:
                    for cc in range(2, NC + 1):
                        ws.cell(row=r, column=cc).fill = _fill(TINT)
                ws.row_dimensions[r].height = 15 * lines_needed(text, 135) + 8
                r += 1
            r = gap(r, 6)
        merge(r, 1, NC)
        put(r, 1, f"Figures are the tool store's own record as at {self.asat}, not a live feed.   POWERED BY SITEIQ  ·  Author: {self.author}",
            _font(9, False, MUTED), align=Alignment(vertical="center", indent=1))
        self.print_setup(ws, NC, landscape=False, name="Cover", title_rows="1:1")
        ws.print_area = f"A1:L{r}"
        ws.sheet_properties.tabColor = _argb(ORANGE)
        return ws

    # ------------------------------------------------------------- save
    def save(self, path):
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        if "Cover" in self.wb.sheetnames:
            self.wb.active = self.wb.sheetnames.index("Cover")
        self.wb.properties.creator = self.author
        self.wb.properties.title = f"Coates {self.client} {self.title}"
        self.wb.properties.subject = f"{self.project} - data as at {self.asat}"
        self.wb.save(path)
        return path


if __name__ == "__main__":
    # a self-test workbook
    import sys
    wb = Workbook("Self Test", "Ampol Lytton Refinery - Permanent Tool Store", "06 Sep 2026 18:48")
    wb.sheet("Items", ["Company", "Item", "Days", "Value", "Rating"],
             [["Wood", "Spanner", 12, 25.0, "Keep Stock"], ["Ampol", "Drill", 95, 1500.0, "Increase Stock"]],
             formats={2: INT, 3: MONEY}, rules={2: ("days", 30, 90), 4: "rag"}, what="A sample tab")
    wb.chart("bar", "Items by company", ["Wood", "Ampol"], [("Items", [91, 205])])
    wb.chart("line", "Same-day % by week", ["W1", "W2", "W3"], [("Same day %", [0.71, 0.69, 0.74])], fmt="0%")
    wb.dashboard(tiles=[("Items on hire", 1506, ""), ("Over 90 days", 515, "34%")])
    wb.cover(facts=[("As at", "06 Sep 2026 18:48"), ("Report date", "06 Nov 2026"), ("Prepared by", "Andrew Fisher")],
             headlines=[("Items on hire", 1506, ""), ("Value out", 530593.5, ""), ("Companies", 20, ""), ("Over 90 days", 515, "")],
             asks=[("Chase Ampol for 164 items over 90 days", "the largest over-90 holder", "Andrew Fisher - by 13 Sep 2026")],
             sources=[("RENTAL_STOCK.xlsx", "06 Sep 2026 18:48", "where every item is")],
             notes=["Every figure is counted from the SiteIQ exports - nothing is estimated."])
    out = sys.argv[1] if len(sys.argv) > 1 else "coates_xlsx_selftest.xlsx"
    print("wrote", wb.save(out))
