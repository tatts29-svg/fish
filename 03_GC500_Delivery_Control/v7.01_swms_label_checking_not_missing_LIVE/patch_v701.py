#!/usr/bin/env python3
"""v7.01 - the Pre-starts page no longer says a SWMS is "not uploaded yet" while it is still asking the shared record.
Found 27 Sep 2026: for the first seconds after the page opens the Coates SWMS read "not uploaded yet" and then turned
into "Open the SWMS" once the service's file list arrived - the file was there all along. Until the list has arrived
it now says "checking the shared record…"; "not uploaded yet" is said only when the service has answered and the
file is not on it.   python3 patch_v701.py <page.html>"""
import os, sys
p = sys.argv[1]; t = open(p, encoding='utf-8').read()
old = "'<span class=\"todo\">not uploaded yet</span>'"
if 'checking the shared record' in t: sys.exit('already applied')
if t.count(old) != 2: sys.exit('anchors: %d' % t.count(old))
t = t.replace(old, "(typeof DOCS !== 'undefined' && DOCS.state && DOCS.state !== 'ready' && DOCS.state !== 'none' && DOCS.state !== 'failed' ? '<span class=\"todo\">checking the shared record…</span>' : '<span class=\"todo\">not uploaded yet</span>')")
open(p, 'w', encoding='utf-8').write(t); print('ok', os.path.basename(p))
