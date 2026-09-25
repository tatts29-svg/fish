#!/usr/bin/env python3
"""v5.88 - what v5.87 got wrong on the day (Andrew Fisher, 25 Sep 2026, from the live page): the banner clipped the
clock's panel when it opened; the banner's blur and shadow effects made a phone stutter; the car picture and the brief
had been moved under the cards; the three instruments navigated on any click. Fixed: nothing on the bar is clipped, the
effects that cost a phone its scroll are gone, the picture and the brief are back under the day strip where they were,
and an instrument navigates only from its own Open line.  python3 patch_v588.py <builder|page>
Every replacement must match exactly once or nothing is written."""
import sys

p = sys.argv[1]
s = open(p, encoding='utf-8-sig').read()
bom = open(p, encoding='utf-8').read(1) == '﻿'
n0 = len(s)


def rep(old, new, label):
    global s
    c = s.count(old)
    if c != 1:
        print('FAIL [%s] expected 1 match, found %d: %r' % (label, c, old[:90])); sys.exit(1)
    s = s.replace(old, new); print('ok   [%s]' % label)


def cut(start, end, label):
    global s
    if s.count(start) != 1 or s.count(end) != 1:
        print('FAIL [%s] markers not unique (%d, %d)' % (label, s.count(start), s.count(end))); sys.exit(1)
    i, j = s.index(start), s.index(end)
    if j <= i:
        print('FAIL [%s] markers out of order' % label); sys.exit(1)
    block = s[i:j]; s = s[:i] + s[j:]; print('cut  [%s] %d chars' % (label, len(block)))
    return block


# ---- 1. nothing on the bar is clipped: the scene clips itself, the bar does not
rep("""center 62%/cover no-repeat;overflow:hidden}""", """center 62%/cover no-repeat}""", 'B1 the bar no longer clips its panels')
rep(""".brandrow{position:relative;z-index:3}""", """.brandrow{position:relative;z-index:4}""", 'B3 the bar and its panels sit above the tab row')
rep(""".hzscene{position:absolute;inset:0;pointer-events:none;z-index:0}""",
    """.hzscene{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}""", 'B2 the scene clips its own flare')

# ---- 2. the effects a phone pays for: blur, backdrop blur and stacked drop-shadows are gone; the look stays in gradients
rep("""rgba(255,106,19,.08) 55%,transparent 75%);filter:blur(6px)}""", """rgba(255,106,19,.08) 55%,transparent 75%)}""", 'E1 flare without blur')
rep("""background:linear-gradient(90deg,transparent,rgba(255,150,80,.65) 55%,transparent);filter:blur(1px)}""",
    """background:linear-gradient(90deg,transparent,rgba(255,150,80,.45) 55%,transparent)}""", 'E2 light trails without blur')
rep("""transform:scaleY(-1);opacity:.28;filter:blur(1.5px);""", """transform:scaleY(-1);opacity:.2;""", 'E3 reflection without blur')
rep("""background:linear-gradient(180deg,rgba(6,4,3,.72),rgba(6,4,3,.55));backdrop-filter:blur(6px);""",
    """background:linear-gradient(180deg,rgba(6,4,3,.82),rgba(6,4,3,.7));""", 'E4 search without backdrop blur')
rep("""nav.tabs{position:relative;z-index:3;background:linear-gradient(180deg,rgba(8,6,5,.78),rgba(8,6,5,.9));backdrop-filter:blur(8px);""",
    """nav.tabs{position:relative;z-index:3;background:linear-gradient(180deg,rgba(8,6,5,.9),rgba(8,6,5,.96));""", 'E5 tabs without backdrop blur')
rep(""".cgauge.gi .giface{filter:drop-shadow(0 12px 16px rgba(0,0,0,.6))}
""", "", 'E6 no filter on the whole dial')
rep("""width:96px;height:auto;filter:drop-shadow(0 10px 14px rgba(0,0,0,.7));align-self:center}""",
    """width:96px;height:auto;align-self:center}""", 'E7 no filter on the signal head')
rep("""color:transparent;filter:drop-shadow(0 2px 2px rgba(0,0,0,.9)) drop-shadow(0 0 14px rgba(255,255,255,.12))}""",
    """color:transparent;filter:drop-shadow(0 2px 2px rgba(0,0,0,.9))}""", 'E8 one shadow on the wordmark')
rep("""background:var(--hzcar) center/contain no-repeat;filter:drop-shadow(0 0 5px rgba(255,106,19,.85)) drop-shadow(0 2px 2px rgba(0,0,0,.9))}""",
    """background:var(--hzcar) center/contain no-repeat;filter:drop-shadow(0 0 4px rgba(255,106,19,.85))}""", 'E9 one shadow on the rail car')
rep("""filter:drop-shadow(0 0 1px rgba(255,255,255,.35)) drop-shadow(0 8px 8px rgba(0,0,0,.7))}""",
    """filter:drop-shadow(0 6px 6px rgba(0,0,0,.7))}""", 'E10 one shadow on the #26')

# ---- 3. the picture and the brief go back under the day strip, where they were before v5.87
hero = cut("""  <div class="dsnband">${dsnBoard(today, dsnState(today), 'video')}</div>""", """  <p class="maphint">Press <b>/</b> to search from anywhere.""",
           'T1 the picture and the brief leave the bottom')
rep("""  <div class="hubhead">
    <div><h2>${esc(fmtDate(today))}</h2>""", hero + """  <div class="hubhead">
    <div><h2>${esc(fmtDate(today))}</h2>""", 'T2 and sit under the day strip again')

# ---- 4. an instrument navigates only from its Open line; the rest of it is for reading and for its own buttons
rep("""    <div class="card hubcard island lights" data-go="register">""", """    <div class="card hubcard island lights">""", 'N1 the lights island')
rep("""      <div class="hubgo">Open the register →</div>
    </div>
    ${(() => { const C = completionAsOf(today)""", """      <div class="hubgo" data-go="register" role="link" tabindex="0">Open the register →</div>
    </div>
    ${(() => { const C = completionAsOf(today)""", 'N2 its Open line')
rep("""' alert' : ''}" data-go="progress">
      <div class="hubtitle"><h3>How far through the job we are</h3>""", """' alert' : ''}">
      <div class="hubtitle"><h3>How far through the job we are</h3>""", 'N3 the dial island')
rep("""      <div class="hubgo">Open the summary →</div>
    </div>`; })()}
    ${progCard(today)}""", """      <div class="hubgo" data-go="progress" role="link" tabindex="0">Open the summary →</div>
    </div>`; })()}
    ${progCard(today)}""", 'N4 its Open line')
rep("""  return `<div class="card hubcard racecard island" data-go="progress">""", """  return `<div class="card hubcard racecard island">""", 'N5 the programme island')
rep("""<span class="hubgo">Open Where we are →</span>""", """<span class="hubgo" data-go="progress" role="link" tabindex="0">Open Where we are →</span>""", 'N6 its Open line')
rep("""  pane.querySelectorAll('.hubcard[data-go]').forEach(c => {""",
    """  /* v5.88 - an instrument's Open line is the one thing on it that navigates (Andrew Fisher, 25 Sep 2026: a press
     anywhere on the gauge jumping to another tab was the wrong feel for an instrument) */
  pane.querySelectorAll('.island .hubgo[data-go]').forEach(g => { const f = ev => { ev.stopPropagation(); go(g.dataset.go); };
    g.onclick = f; g.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(ev); } }; });
  pane.querySelectorAll('.hubcard[data-go]').forEach(c => {""", 'N7 the Open lines navigate; the islands do not')
rep(""".card.island .hubgo,.card.island .pkeyhead .hubgo{color:#ff8a3a}""",
    """.card.island{cursor:default} .card.island .hubgo,.card.island .pkeyhead .hubgo{color:#ff8a3a}
.card.island .hubgo[data-go]{cursor:pointer;display:inline-block;padding:6px 10px;margin-left:-10px;border-radius:8px} .card.island .hubgo[data-go]:hover,.card.island .hubgo[data-go]:focus-visible{background:rgba(255,106,19,.14);outline:0;text-decoration:underline}
.card.island:hover{transform:none;box-shadow:0 0 0 1px #3a2c24,0 0 0 2px #0a0706,0 18px 34px -16px rgba(0,0,0,.8)}""", 'N8 the Open line looks like the one press')

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print('written', n0, '->', len(s))
