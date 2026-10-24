import sys, re
p = sys.argv[1] if len(sys.argv) > 1 else 'build_asset_app.py'
s = open(p, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, count=1, label=''):
    global s
    c = s.count(old)
    if c != count:
        print(f'FAIL [{label}] expected {count} match(es), found {c}: {old[:80]!r}'); sys.exit(1)
    s = s.replace(old, new)
    print(f'ok   [{label}]')

# A. dial digits scale with the face (the 0/100 labels, the caption and the foot line collided at 300 px)
rep(".giface{position:relative;max-width:520px;margin:2px auto 0}",
    ".giface{position:relative;width:100%;max-width:520px;margin:2px auto 0;container-type:inline-size}", label='A1 giface container')
rep("font-weight:700;font-size:clamp(34px,10vw,58px);letter-spacing:-.04em;line-height:1;color:#fff;",
    "font-weight:700;font-size:clamp(22px,11.2cqw,58px);letter-spacing:-.04em;line-height:1;color:#fff;", label='A2 digit size')
rep(".gidig p{margin:5px 0 0;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#b6c0bb}",
    ".gidig p{margin:calc(.6cqw + 2px) 0 0;font-size:clamp(7px,1.9cqw,10px);letter-spacing:.15em;text-transform:uppercase;color:#b6c0bb}", label='A3 caption size')

# B. the Lights tiles spilled past the card: 1fr without minmax(0) sizes to content, and nowrap on the label
rep(".hublights{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
    ".hublights{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}", label='B1 lights grid')
rep("cursor:pointer;font-size:12px;text-align:left;white-space:nowrap;transition:border-color .15s, box-shadow .15s}",
    "cursor:pointer;font-size:12px;text-align:left;white-space:normal;line-height:1.15;min-width:0;transition:border-color .15s, box-shadow .15s}", label='B2 lights tile')

# C. the clash card's rows collapsed to one-character columns (flex row of four inline parts at 342 px)
rep(".hublist .hubrow{padding:5px 0;flex-wrap:wrap}",
    ".hublist .hubrow{padding:5px 0;flex-wrap:wrap}\n"
    "/* v5.84 — a clash row is a sentence, not a table: on a 340 px card the flex columns squeezed to one character each */\n"
    ".clashcard .hublist li{display:block;line-height:1.5}\n"
    ".clashcard .hublist li .tm{display:inline;margin-right:4px}\n"
    ".clashcard .hublist li .w{display:inline}", label='C clash rows')

# O. a figure never wraps away from its unit ("1302.5 / m")
rep(".hublist .tm{font-weight:700;font-variant-numeric:tabular-nums;min-width:3.2em}",
    ".hublist .tm{font-weight:700;font-variant-numeric:tabular-nums;min-width:3.2em;white-space:nowrap}", label='O nowrap figures')

# D. "Tomorrow" that was not tomorrow
rep("${sect('04', 'Tomorrow')}",
    "${sect('04', next && next.iso === addDays(iso, 1) ? 'Tomorrow' : 'Next programme day')}", label='D tomorrow heading')

# E. the Documents chip changed its count mid-session without saying why
rep('''<span class="chip ref" title="The catalogue this build carries. Files people have uploaded since are counted on the Documents tab.">${fmtNum(C.items.length)} in the catalogue</span>''',
    '''<span class="chip ref" title="${DOCS.files ? 'The build catalogue and every file uploaded since, as last read by this page.' : 'The catalogue this build carries. Files uploaded since are added once the Documents tab has been read.'}">${fmtNum(C.items.length)} ${DOCS.files ? 'listed' : 'in this build'}</span>''', label='E1 docs chip')
rep('''<span class="chip cand" title="Uploaded to the service since the build, as last read by this page.">${fmtNum(up)} uploaded</span>''',
    '''<span class="chip cand" title="Uploaded to the service since the build, as last read by this page.">${fmtNum(up)} uploaded since the build</span>''', label='E2 docs uploaded chip')

# F. a view link asked /api/reports on every load and was refused (403 in the console every time)
rep('''async function loadReports(){
  if (!SYNC.backend || !SYNC.backend.reports) {''',
    '''async function loadReports(){
  /* v5.84 — a view link may not read the card reports; the service says 403 and this page said so on every
     load in the console. The refusal is a fact the link already knows, so it is recorded here and never asked. */
  if (SYNC.claims === 'view') {
    REPORTS = {tried: true, at: null, by_key: {}, by_load: {}, total: 0, forbidden: true,
               error: 'this link can view the record but not the card reports'};
    return REPORTS;
  }
  if (!SYNC.backend || !SYNC.backend.reports) {''', label='F reports on view')

# G. "1720 m over the plan" where the plan quantity was nought
rep('''done this week${l.remaining != null ? ` <span class="w" style="color:var(--mute)">· ${l.remaining < 0 ? esc(fmtQty(-l.remaining, l.unit)) + ' over the plan' : esc(fmtQty(l.remaining, l.unit)) + ' still to do'}</span>` : ''}</li>`''',
    '''done this week${!l.planned ? ' <span class="w" style="color:var(--mute)">· nothing planned this week</span>' : l.remaining != null ? ` <span class="w" style="color:var(--mute)">· ${l.remaining < 0 ? esc(fmtQty(-l.remaining, l.unit)) + ' over the plan' : esc(fmtQty(l.remaining, l.unit)) + ' still to do'}</span>` : ''}</li>`''', label='G fencing plan')

# H. the week label is a countdown, and says so
rep("function weekOf(iso){ return (DATA.weeks || []).find(w => w.start <= iso && iso <= w.end) || null; }",
    '''function weekOf(iso){ return (DATA.weeks || []).find(w => w.start <= iso && iso <= w.end) || null; }
/* v5.84 — THE WEEK SHEETS COUNT DOWN. "Week 4" on the programme is the fourth week before event week (Week 6 →
   Week 1 → Event Week), and a reader outside the job took it for the fourth week since the start — which, on
   25 Sep, would be week three. So the label says which way it counts. The sheet's own name is never changed. */
function weekWords(wk){
  if (!wk) return '';
  const m = /^Week (\\d+)$/.exec(String(wk.sheet || ''));
  if (m && String(wk.phase || '') === 'Build') { const n = +m[1]; return `${wk.sheet} · Build · ${n} week${n === 1 ? '' : 's'} to event week`; }
  return `${wk.sheet}${wk.phase ? ' · ' + wk.phase : ''}`;
}
/* v5.84 — the weather's reading time in the page's own date form, not the service's ISO */
function wxReadingWords(s){ const m = /^(\\d{4}-\\d{2}-\\d{2})[ T](\\d{2}:\\d{2})/.exec(String(s || '')); return m ? fmtDate(m[1]) + ' ' + m[2] : String(s || ''); }''', label='H weekWords + wxReadingWords')
rep('''<div class="sub">${wk ? esc(wk.sheet) + ' · ' + esc(wk.phase) : 'outside every week on the 2026 schedule'}''',
    '''<div class="sub">${wk ? esc(weekWords(wk)) : 'outside every week on the 2026 schedule'}''', label='H2 today sub')
rep('''<p class="dbsub">${esc(d.sheet ? d.sheet + ' · ' + (d.phase || '') + ' programme' : 'outside every programme week')}</p>''',
    '''<p class="dbsub">${esc(d.sheet ? weekWords({sheet: d.sheet, phase: d.phase}) : 'outside every programme week')}</p>''', label='H3 brief sub')

# N. weather reading time
rep("`, their reading of ${esc(d.reading_at)}`", "`, their reading of ${esc(wxReadingWords(d.reading_at))}`", label='N weather time')

# I. what a view link must not show: the record-changing cards and prompts
rep('''<div class="hubwho">${S.operator ? `Recording as <b>${esc(S.operator)}</b>` : '<button class="linkish" data-focus="who">Put your name in “Recording as” before you record anything</button>'}</div>''',
    '''<div class="hubwho editonly">${!canEdit() ? '' : S.operator ? `Recording as <b>${esc(S.operator)}</b>` : '<button class="linkish" data-focus="who">Put your name in “Recording as” before you record anything</button>'}</div>''', label='I1 hubwho')
rep('''<div class="card hubcard${att.export ? ' alert' : ''}">
      <div class="hubtitle"><h3>Your records</h3>''',
    '''<div class="card hubcard editonly${att.export ? ' alert' : ''}">
      <div class="hubtitle"><h3>Your records</h3>''', label='I2 your records card')
rep('''<div class="card hubcard" data-go="edit">''', '''<div class="card hubcard editonly" data-go="edit">''', label='I3 edit card')
rep('''<button class="btn primary" data-add-day="${esc(d.iso)}" title="Bring an asset forward or back to this day">Add an asset to this day</button>''',
    '''<button class="btn primary editonly" data-add-day="${esc(d.iso)}" title="Bring an asset forward or back to this day">Add an asset to this day</button>''', label='I4 add-asset button')
rep('''<button type="button" class="btn${dd.recorded ? '' : ' amber'}" data-k="${esc(a.key)}">${dd.recorded ? 'Open' : 'Confirm outcome'}</button>''',
    '''<button type="button" class="btn${dd.recorded || !canEdit() ? '' : ' amber'}" data-k="${esc(a.key)}">${dd.recorded || !canEdit() ? 'Open' : 'Confirm outcome'}</button>''', label='I5 confirm outcome')

# CSS for I, J, K, L, M, Q — appended after the footer rule so it sits with the shell's base rules
rep('''footer.foot{padding:10px 16px;border-top:1px solid var(--rule);background:var(--paper);font-size:11px;
  color:var(--mute);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;flex:0 0 auto}''',
    '''footer.foot{padding:10px 16px;border-top:1px solid var(--rule);background:var(--paper);font-size:11px;
  color:var(--mute);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;flex:0 0 auto}
/* v5.84 — WHAT A VIEW LINK DOES NOT SHOW. Hiding a control was already a courtesy and refusing the change the
   rule (mayWrite); but the day's own screen still carried "Put your name in Recording as", Your records with
   Export and Import, the Edit card and the day view's Add an asset, on a link that cannot change anything. A
   thing that only writes carries .editonly and goes with the body's viewonly class, so a link the service
   turns read-only after the render loses them too. The Tools menu's name field goes the same way. */
body.viewonly .editonly{display:none!important}
body.viewonly #moreMenu .who, body.viewonly #moreMenu .mmsec:first-child{display:none}
/* v5.84 — the phone: two lines of footer, not four; the tab's dot off the glyph; a thumb-sized button */
@media(max-width:640px){
  footer.foot{font-size:10px;padding:5px 12px;gap:1px 8px;line-height:1.3}
  footer.foot span{flex:1 1 100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  nav.tabs .dot{top:2px;right:calc(50% - 19px)}
  #pane-today .btn, .hubsheets .btn{min-height:40px}
}''', label='CSS view-only + phone')

# L. the small labels on the coloured tiles fell under 4.5:1 on their tints
rep(".dbts{font-size:10.5px;color:var(--mute)}", ".dbts{font-size:10.5px;color:var(--ink2)}", label='L1 dbts contrast')
rep(".tsq .tsqface em{font-style:normal;font-size:10.5px;color:var(--mute);font-weight:600}",
    ".tsq .tsqface em{font-style:normal;font-size:10.5px;color:var(--ink2);font-weight:600}", label='L2 tsq em contrast')

# Q. on a phone the board's lamps are 100 px wide — the line is said in words under the picture
rep('''<figcaption class="bcap">
      <span><b>${esc(DATA.event.name)}</b> — the board reads this record as at ${esc(fmtDate(asOf))}.</span>''',
    '''<figcaption class="bcap">
      ${pages.length ? `<p class="bsay" aria-hidden="true">${esc(pages[0].lines.map(l => l.t).join(' · '))}</p>` : ''}
      <span><b>${esc(DATA.event.name)}</b> — the board reads this record as at ${esc(fmtDate(asOf))}.</span>''', label='Q1 board words')
rep('''@media (max-width:620px){ .bhero .bplay{right:10px;bottom:10px;padding:8px 14px 8px 11px;font-size:12px} }''',
    '''@media (max-width:620px){ .bhero .bplay{right:10px;bottom:10px;padding:8px 14px 8px 11px;font-size:12px} }
/* v5.84 — the board's words, said under the picture on a phone, where the lamps are a hundred pixels wide */
/* a <p>, not a <span>: the weather refresh rewrites the caption's second span and must keep finding the weather line */
.bhero .bsay{display:none;margin:0}
@media (max-width:640px){ .bhero .bsay{display:block;flex:1 1 100%;font-weight:800;font-size:13px;letter-spacing:.02em;color:var(--ink)} }''', label='Q2 board words css')

open(p, 'w', encoding='utf-8').write(s)
print('written', n0, '->', len(s))
