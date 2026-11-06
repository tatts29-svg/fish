"""Author: Andrew Fisher. Reuse one Today reading and defer hidden banner paint.

This helper is applied to the captured release by patch_v1066. It neither changes
records nor retains a model beyond the existing asset hold. All replacements must
match once, including the native opening and print paths for the hidden banner.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BUILD_START = """  function build(asOf) {
    rememberFolds();
    areas = todayWorkMetrics840(asOf);"""
BUILD_START_NEW = """  function build(asOf) {
    rememberFolds();
    if (window.EventConfig1013) window.EventConfig1013.current();
    heldFresh775();
    const assets1066 = ASSETS_HELD;
    areas = todayWorkMetrics840(asOf);"""

BUILD_END = """  }
  function board() { return document.getElementById(boardId); }"""
BUILD_END_NEW = """    /* v10.66: only the complete board reading from this unchanged asset hold. */
    if (window.EventConfig1013) window.EventConfig1013.current();
    heldFresh775();
    if (assets1066 && ASSETS_HELD === assets1066)
      HELD_MEMO.set('today-board1066|' + asOf, {summary:workSummary, fencing:overallFencing});
    return built1066;
  }
  function board() { return document.getElementById(boardId); }"""

MOUNT = """  const day=todayWorkDay841(),m=progress881Model(day),prog=pane.querySelector(':scope > .today-work-programme840');"""
MOUNT_NEW = """  const day=todayWorkDay841();
  /* heldMemo checks event configuration and stale saves before looking up this draw. */
  const board1066=heldMemo('today-board1066|'+day,()=>null);
  const m=board1066?progress881Model(day,board1066.summary,board1066.fencing):progress881Model(day),prog=pane.querySelector(':scope > .today-work-programme840');"""

REFLOW = """ const reflow = () => {
 size();
 const w = Math.round(board.getBoundingClientRect().width);
 if (!w || Math.abs(w - (BOARD_RUN.w || 0)) < 8) return;"""
REFLOW_NEW = """ const reflow = () => {
 const w = Math.round(board.getBoundingClientRect().width);
 if (!w) return; /* v10.66: closed banner has no face to fit or paint. */
 size();
 if (Math.abs(w - (BOARD_RUN.w || 0)) < 8) return;"""

DRAW = """ const draw = () => { const pages = boardPages(asOf, X); if (!pages.length) return;"""
DRAW_NEW = """ const draw = () => {
 if (!board.isConnected || !board.getBoundingClientRect().width) return; /* v10.66 */
 const pages = boardPages(asOf, X); if (!pages.length) return;"""

FOLD = """   try { if (typeof BOARD_RUN !== 'undefined' && BOARD_RUN.reconcile) BOARD_RUN.reconcile(); } catch (e) {}
  });
 }
 /* the forecast itself:"""
FOLD_NEW = """   try {
    if (typeof BOARD_RUN !== 'undefined' && BOARD_RUN.reconcile) BOARD_RUN.reconcile();
    /* v10.66: opening paints immediately, including browsers without ResizeObserver. */
    if (d.open && typeof BOARD_RUN !== 'undefined' && BOARD_RUN.redraw) BOARD_RUN.redraw();
   } catch (e) {}
  });
 }
 /* the forecast itself:"""

PRINT_ANCHOR = """const BOARD_RUN = {done: false, timer: null, fade: null, ro: null, io: null, raf: 0, onVis: null, onMotion: null, onResize: null, reconcile: null, stopMedia: null, disposeMedia: null, redraw: null, seen: true};"""
PRINT_NEW = PRINT_ANCHOR + """
/* v10.66: a visible banner prints its current lamps even before a queued frame. */
window.addEventListener('beforeprint', () => { try { if (BOARD_RUN.redraw) BOARD_RUN.redraw(); } catch (e) {} });"""


def apply(text, path):
    text = rep(text, BUILD_START, BUILD_START_NEW, 'Today board hold identity', path)
    text = rep(text, "    return '<section id=\"' + boardId + '\" data-tw841-groups-merged=\"'",
               "    const built1066 = '<section id=\"' + boardId + '\" data-tw841-groups-merged=\"'",
               'finish Today markup before sharing its models', path)
    text = rep(text, BUILD_END, BUILD_END_NEW, 'Today model belongs to the current hold', path)
    text = rep(text, MOUNT, MOUNT_NEW, 'whole-job plate reuses current board models', path)
    text = rep(text, REFLOW, REFLOW_NEW, 'skip hidden VMS fitting', path)
    text = rep(text, DRAW, DRAW_NEW, 'skip hidden VMS painting', path)
    text = rep(text, FOLD, FOLD_NEW, 'paint VMS when its banner opens', path)
    text = rep(text, PRINT_ANCHOR, PRINT_NEW, 'paint visible VMS before print', path)
    return text
