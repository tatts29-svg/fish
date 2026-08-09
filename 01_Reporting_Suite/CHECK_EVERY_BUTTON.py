#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK EVERY BUTTON - before you need them to work
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Run me after any update, or the first time the suite lands on a new
#  computer. I press nothing and change nothing. I check that every
#  numbered button could run if you pressed it:
#
#    1. every button launches Python the one shared way (_RUN.bat).
#       Five different ways is how a button works on one machine and
#       does nothing at all on another.
#    2. every button points at a script that is actually here.
#    3. every script is valid Python - it would start, not fall over
#       on the first line with a syntax error.
#    4. every module a script imports is here or installed.
#    5. nothing points at a file that has been removed.
#    6. every .bat has Windows line endings. A .bat saved the Unix way
#       runs most of the time and then fails on the one line that
#       matters.
#    7. the job this computer is set to has its exports in place, and
#       they belong to THAT job.
#
#  It finishes with one line: ready, or the list of what to fix.
# =====================================================================

import glob
import os
import re
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

SHARED_LAUNCHER = "_RUN.bat"
#  Buttons that legitimately never call Python - they drive PowerShell,
#  flip a switch file, or run a Windows command.
NO_PYTHON_OK = re.compile(r'-File\s+"[^"]+\.ps1"|netsh|Start-Process|'
                          r'^\s*(echo|del|copy|type|if|set)\b', re.I | re.M)

OK, WARN, BAD = "  OK   ", "  WARN ", "  STOP "
problems = []


def say(tag, msg):
    print(tag + "| " + msg)


def note(msg):
    problems.append(msg)


def buttons():
    out = sorted(glob.glob(os.path.join(HERE, "*.bat")))
    out += sorted(glob.glob(os.path.join(HERE, "*", "*.bat")))
    return [p for p in out
            if os.path.basename(p).lower() != SHARED_LAUNCHER.lower()]


def scripts():
    out = sorted(glob.glob(os.path.join(HERE, "*.py")))
    out += sorted(glob.glob(os.path.join(HERE, "*", "*.py")))
    return out


def check_launchers(bats):
    """Every button uses the one shared launcher - nothing rolls its own."""
    stray, uses = [], 0
    old = re.compile(r'^\s*(py|python|python3|%PYCMD%)\s+\S|'
                     r'^\s*where\s+(py|python)\b', re.M)
    for b in bats:
        src = open(b, encoding="utf-8", errors="ignore").read()
        if SHARED_LAUNCHER in src:
            uses += 1
        for m in old.finditer(src):
            stray.append((b, src[:m.start()].count("\n") + 1,
                          m.group(0).strip()))
    if stray:
        say(BAD, "{} button(s) still launch Python their own way".format(
            len(stray)))
        for b, line, txt in stray[:8]:
            print("        {}:{}  {}".format(os.path.basename(b), line, txt))
        note("Some buttons don't use {} - they will work on one computer "
             "and not another. Point them at the shared launcher."
             .format(SHARED_LAUNCHER))
    else:
        say(OK, "All {} buttons launch Python the one shared way".format(uses))


def check_targets(bats):
    """Every button points at a script that is here."""
    pat = re.compile(r'_RUN\.bat"\s+(\S+\.py)|-File\s+"%~dp0(\S+\.ps1)"', re.I)
    missing, checked, silent = [], 0, []
    for b in bats:
        src = open(b, encoding="utf-8", errors="ignore").read()
        root = os.path.dirname(b)
        found = list(pat.finditer(src))
        if not found and not NO_PYTHON_OK.search(src):
            silent.append(os.path.basename(b))
        for m in found:
            t = (m.group(1) or m.group(2)).replace("\\", os.sep)
            checked += 1
            if not (os.path.isfile(os.path.join(HERE, t))
                    or os.path.isfile(os.path.join(root, t))):
                missing.append((os.path.basename(b), t))
    if missing:
        say(BAD, "{} button(s) point at a script that isn't here".format(
            len(missing)))
        for b, t in missing:
            print("        {}  ->  {}".format(b, t))
        note("A button with no script behind it does nothing when pressed. "
             "Either the file was missed out of the update, or the zip was "
             "not extracted fully.")
    else:
        say(OK, "All {} button targets are present".format(checked))
    if silent:
        say(WARN, "{} button(s) run nothing at all: {}".format(
            len(silent), ", ".join(silent[:5])))


def check_syntax(pys):
    """Every script would at least start."""
    import py_compile
    tmp = tempfile.mkdtemp()
    broken = []
    for p in pys:
        try:
            py_compile.compile(p, doraise=True,
                               cfile=os.path.join(tmp, os.path.basename(p) + "c"))
        except py_compile.PyCompileError as e:
            broken.append((os.path.basename(p), str(e).splitlines()[-1]))
        except Exception:
            pass
    if broken:
        say(BAD, "{} script(s) have a fault in the code itself".format(
            len(broken)))
        for n, why in broken[:8]:
            print("        {}  {}".format(n, why[:70]))
        note("A script with a syntax error stops the moment it starts. "
             "These need fixing before the buttons behind them will run.")
    else:
        say(OK, "All {} scripts are valid Python".format(len(pys)))


def check_imports(pys):
    """Every module a script reaches for is here or installed.

    Read with the Python parser, not by pattern-matching the text. The
    comments in this suite are full of sentences that start with "from"
    and "import", and a pattern match happily reports that you need to
    pip install "the"."""
    import ast
    import importlib.util
    local = {os.path.splitext(os.path.basename(p))[0] for p in pys}
    optional = {"playwright", "weasyprint", "PIL", "cryptography", "winreg",
                "win32com", "pythoncom"}
    wanted = set()
    for p in pys:
        try:
            tree = ast.parse(open(p, encoding="utf-8", errors="ignore").read())
        except SyntaxError:
            continue          # already reported by the syntax check
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    wanted.add(a.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.level == 0 and node.module:
                    wanted.add(node.module.split(".")[0])
    missing, soft = set(), set()
    for mod in wanted:
        if mod in local or mod in sys.builtin_module_names:
            continue
        try:
            if importlib.util.find_spec(mod) is not None:
                continue
        except (ImportError, ValueError, ModuleNotFoundError):
            pass
        (soft if mod in optional else missing).add(mod)
    if missing:
        say(BAD, "Missing libraries: {}".format(", ".join(sorted(missing))))
        note("Install them: open Command Prompt and run   pip install {}"
             .format(" ".join(sorted(missing))))
    else:
        say(OK, "Every library the suite needs is installed")
    if soft:
        say(WARN, "Optional extras not installed (fine without): {}".format(
            ", ".join(sorted(soft))))


def check_line_endings(bats):
    """A .bat with Unix line endings is a fault waiting for a bad day."""
    wrong = []
    for b in bats + [os.path.join(HERE, SHARED_LAUNCHER)]:
        if not os.path.isfile(b):
            continue
        raw = open(b, "rb").read()
        if raw.count(b"\n") and raw.count(b"\r\n") != raw.count(b"\n"):
            wrong.append(os.path.basename(b))
    if wrong:
        say(BAD, "{} button(s) have the wrong line endings".format(len(wrong)))
        for n in wrong[:8]:
            print("        " + n)
        note("Those .bat files were saved the Unix way. Windows runs them "
             "most of the time and then fails on a label or a multi-line "
             "IF. Re-save them with Windows (CRLF) line endings.")
    else:
        say(OK, "Every button has Windows line endings")


def check_job():
    """The job this computer is set to, and whether its data is here."""
    try:
        import site_config
    except ImportError:
        say(WARN, "site_config.py is missing - the suite can't tell which "
                  "job it's running")
        return
    s = site_config.site(base=HERE)
    say(OK, "This computer is running: " + s.header_line)
    folders = s.data_dirs(HERE)
    for stem in (s.exports or []):
        hits = []
        for d in folders:
            hits += [p for p in glob.glob(os.path.join(d, stem + "*.xlsx"))
                     if not os.path.basename(p).startswith("~$")]
        if not hits:
            say(WARN, "Export {} not in {}".format(
                stem, os.path.relpath(folders[0], HERE)))
            continue
        newest = max(hits, key=os.path.getmtime)
        ok, why = site_config.belongs_to_live_job(newest, HERE)
        if ok:
            say(OK, "Export {} is here and belongs to this job".format(stem))
        else:
            say(BAD, "Export {} belongs to a DIFFERENT job".format(stem))
            note(why)


def main():
    print("=" * 64)
    print(" COATES | CHECK EVERY BUTTON")
    print(" Folder: " + HERE)
    print("=" * 64)
    bats, pys = buttons(), scripts()
    check_launchers(bats)
    check_targets(bats)
    check_syntax(pys)
    check_imports(pys)
    check_line_endings(bats)
    print("-" * 64)
    check_job()
    print("=" * 64)
    if not problems:
        print(" READY. {} buttons, {} scripts - every one of them would "
              "run.".format(len(bats), len(pys)))
        return 0
    print(" {} thing(s) to fix, in plain words:".format(len(problems)))
    for i, p in enumerate(problems, 1):
        print("   {}. {}".format(i, p))
    print("=" * 64)
    return 1


if __name__ == "__main__":
    sys.exit(main())
