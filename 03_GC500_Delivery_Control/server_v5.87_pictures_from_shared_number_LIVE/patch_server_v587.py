#!/usr/bin/env python3
"""Author: Andrew Fisher. Server v5.87 - picture messages from a sender that can send them.

Andrew, 1 Oct 2026: plain texts from his Own Number arrive; picture messages from it are accepted by ClickSend and then
FAILED (status 301, four of them on 1 Oct). ClickSend: MMS goes from a shared number or a dedicated MMS number only
("Choose a shared number or your dedicated MMS number from the From dropdown"; "leave it blank to use the pool of shared
numbers"). His account's Manage Senders shows a Shared number, use for MMS, SMS, Ready to use.

One new variable, MMS_FROM:
  MMS_FROM=shared      picture messages go with no "from", so ClickSend sends them from its shared number
  MMS_FROM=<number>    picture messages go from that number (a dedicated MMS number, if one is ever bought)
  MMS_FROM not set     as v5.86: picture messages go from SMS_FROM
Plain texts are unchanged: still from SMS_FROM, so replies to a text still reach Andrew's phone.

  python3 patch_server_v587.py <server v5.86 server.js> <out server.js>"""
import hashlib
import sys
from pathlib import Path

base = Path(sys.argv[1])
source = base.read_text()
expected = 'f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9'
if hashlib.sha256(base.read_bytes()).hexdigest() != expected:
    raise SystemExit('Expected the jointly reviewed v5.86 server (f5b9a3f7...); refusing another base or a second application.')


def rep(old, new, count=1):
    global source
    actual = source.count(old)
    if actual != count:
        raise SystemExit(f'Expected {count} matches, got {actual}: {old[:100]}')
    source = source.replace(old, new)


# 1. the picture sender, decided once at start
rep("const SMS_FROM = (s => (/^\\+?\\d{6,15}$/.test(s.replace(/\\s/g, '')) ? s.replace(/\\s/g, '') : s.slice(0, 11)))(String(process.env.SMS_FROM || '').trim());",
    "const SMS_FROM = (s => (/^\\+?\\d{6,15}$/.test(s.replace(/\\s/g, '')) ? s.replace(/\\s/g, '') : s.slice(0, 11)))(String(process.env.SMS_FROM || '').trim());\n"
    "/* v5.87 - the picture sender. ClickSend sends MMS only from a shared number or a dedicated MMS number, never from an Own\n"
    "   Number (accepted, then FAILED 301). MMS_FROM=shared sends with no \"from\" (ClickSend's shared pool); MMS_FROM=<number>\n"
    "   uses that number; unset keeps v5.86 (SMS_FROM). Plain texts always use SMS_FROM. */\n"
    "const MMS_SHARED = /^shared$/i.test(String(process.env.MMS_FROM || '').trim());\n"
    "const MMS_FROM = MMS_SHARED ? '' : (s => s ? (/^\\+?\\d{6,15}$/.test(s.replace(/\\s/g, '')) ? s.replace(/\\s/g, '') : s.slice(0, 11)) : SMS_FROM)(String(process.env.MMS_FROM || '').trim());\n"
    "const MMS_FROM_LABEL = MMS_SHARED ? 'a ClickSend shared number' : (MMS_FROM || null);\n"
    "function mmsSenderReady() { return MMS_SHARED || !!MMS_FROM; }")

# 2. the MMS brief the page reads
rep("return { configured: smsReady(), from: SMS_FROM || null, from_needed: !SMS_FROM, today: smsToday(), at_once: SMS_AT_ONCE,",
    "return { configured: smsReady(), from: MMS_FROM_LABEL, from_needed: !mmsSenderReady(), from_shared: MMS_SHARED, today: smsToday(), at_once: SMS_AT_ONCE,")

# 3. the guard: a picture needs a sender that can send pictures
rep("  if (!SMS_FROM) return send(res, 501, { error: 'A picture message needs a sender: ClickSend requires \"from\" for MMS, and SMS_FROM is not set on this service.', configured: true, from_needed: true });",
    "  if (!mmsSenderReady()) return send(res, 501, { error: 'A picture message needs a sender: set MMS_FROM to shared (or a dedicated MMS number), or SMS_FROM, on this service.', configured: true, from_needed: true });")

# 4. the plan the page shows, and 5. the send itself
rep("const plan = { to, text, subject, shape, from: SMS_FROM, messages: to.length, picture: { sha256: pic.sha, bytes: pic.bytes.length, url: media }, today };",
    "const plan = { to, text, subject, shape, from: MMS_FROM_LABEL, messages: to.length, picture: { sha256: pic.sha, bytes: pic.bytes.length, url: media }, today };")
rep("body: JSON.stringify({ media_file: media, messages: to.map(n => ({ source: 'gc500', subject, body: text, to: n, from: SMS_FROM })) }),",
    "body: JSON.stringify({ media_file: media, messages: to.map(n => Object.assign({ source: 'gc500', subject, body: text, to: n }, MMS_SHARED ? {} : { from: MMS_FROM })) }),")

# 6. labels: health, banner (the banner never prints a number for the picture sender beyond what it printed before)
rep("build: 'v5.86'", "build: 'v5.87'")
rep("const BUILD = 'server v5.86", "const BUILD = 'server v5.87 — PICTURES FROM A SENDER THAT CAN SEND THEM (MMS_FROM=shared: the ClickSend shared number; texts still from SMS_FROM; Andrew Fisher, 1 Oct 2026) + v5.86")
rep("+ ' · texting ' + (smsReady() ? ('on, ' + SMS_CAP + ' a day' + (SMS_FROM ? ', from ' + SMS_FROM : '')) : 'not set up')",
    "+ ' · texting ' + (smsReady() ? ('on, ' + SMS_CAP + ' a day' + (SMS_FROM ? ', from ' + SMS_FROM : '') + (MMS_SHARED ? ' · pictures from a ClickSend shared number' : MMS_FROM && MMS_FROM !== SMS_FROM ? ' · pictures from ' + MMS_FROM : '')) : 'not set up')")

Path(sys.argv[2]).write_text(source)
print('server v5.87 written: picture messages from MMS_FROM (shared or a number), texts unchanged')
