"""Author: Andrew Fisher. Fold secondary crew-card controls; clarify saved work by QR group.
Strict v11.60 base; no task, record, tracker configuration or send-path changes.
"""
import hashlib,json,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE=(HERE/'BASE_SHA256').read_text().strip()

def patch(text):
    if hashlib.sha256(text.encode()).hexdigest()!=BASE: raise ValueError('v11.61 requires the exact v11.60 live base')
    marker='var SVC1067_CARD='
    start=text.index(marker)+len(marker)
    pkg,end=json.JSONDecoder().raw_decode(text[start:])
    h=pkg['html']; original_data=json.dumps(pkg['data'],sort_keys=True)
    def change(a,b,label):
        nonlocal h
        h=rep(h,a,b,label,'crew card')
    change('function daysHtml(day, auto) {\n  return DAYS.map(function (d) {', '''var historyOpen1161 = false, mapOpen1161 = false, assetsOpen1161 = Object.create(null);
function daysHtml(day, auto) {
  function button(d) {''','day button factory')
    change("  }).join('');\n}\nfunction windowHtml(day)", """  }
  var past = DAYS.filter(function (d) { return d.id < auto; });
  var current = DAYS.filter(function (d) { return d.id >= auto; });
  return current.map(button).join('') + (past.length ? '<details class="crew-history1161" id="crew-history1161"' + (historyOpen1161 || day < auto ? ' open' : '') + '><summary>Previous nights · saved history</summary><div class="days">' + past.map(button).join('') + '</div></details>' : '');
}
function windowHtml(day)""",'past nights into history')
    change("+ navHtml(r) + areaMapHtml(a, r, day, st);", "+ navHtml(r) + '<details class=\"crew-map1161\" id=\"crew-map1161\"' + (mapOpen1161 ? ' open' : '') + '><summary>View area map · ' + esc(a.n ? 'Area ' + a.n : a.name) + '</summary>' + areaMapHtml(a, r, day, st) + '</details>';", 'fold existing plan above jobs')
    change("((l.label || (l.nos && l.nos.length)) ? '<p class=\"nos\">'", "((l.label || (l.nos && l.nos.length)) ? (l.nos && l.nos.length > 3 ? '<details class=\"crew-assets1161\" data-assets1161=\"' + esc(l.id) + '\"' + (assetsOpen1161[l.id] ? ' open' : '') + '><summary>Asset numbers (' + l.nos.length + ')</summary>' : '') + '<p class=\"nos\">'", 'fold long asset lists')
    change("esc(l.nos.join(', ')) : '') + '</p>' : '') +", "esc(l.nos.join(', ')) : '') + '</p>' + (l.nos && l.nos.length > 3 ? '</details>' : '') : '') +", 'retain every asset number in disclosure')
    change("    : 'Everything from ' + curRef + ' is on the service.';", "    : 'Your marked jobs at ' + curRef + ' are saved.';", 'precise saved wording')
    change("  var miss = missingTasks(r, day, st);\n  var h = '<section class=\"card saved'", """  var miss = missingTasks(r, day, st);
  var ownMissing1161 = [], ownCount1161 = 0;
  r.lines.forEach(function (l) { shownTasks(l, day).forEach(function (t) {
    ownCount1161 += l.qty;
    if (!st[jobKey(l.id, t, day)] && ownMissing1161.indexOf(t) < 0) ownMissing1161.push(t);
  }); });
  var otherMissing1161 = curGroup ? miss.filter(function (t) { return GROUPS[curGroup].tasks.indexOf(t) < 0; }) : [];
  var ownText1161 = !ownCount1161 ? 'No jobs for this code on this night.' : ownMissing1161.length
    ? 'Still to do for this code: ' + ownMissing1161.map(function (t) { return TASKS[t] || t; }).join(', ')
    : n ? 'Your jobs are marked · waiting to save.' : 'Your jobs at ' + curRef + ' are complete.';
  var h = '<section class="card saved'""",'derive this QR group remaining work')
    old="""'<p class="saved-ref">' + (rs.done ? '<span class="stamp">' + esc(curRef) + ' done</span>' + (rs.last ? ' <span class="stamp-at">' + hm(rs.last) + '</span>' : '') : '<b>' + esc(curRef) + '</b> still needs ' + esc(miss.map(function (t) { return TASKS[t] || t; }).join(', ')) + ' ' + missingIconsHtml(r, day, st)) + '</p>' +"""
    new="""'<p class="saved-ref saved-own1161">' + esc(ownText1161) + '</p>' +
    (otherMissing1161.length ? '<p class="saved-other1161">Other work at ' + esc(curRef) + ': ' + esc(otherMissing1161.map(function (t) { return TASKS[t] || t; }).join(', ')) + '</p>' : '') +"""
    change(old,new,'saved summary separates other crews jobs')
    change("document.addEventListener('click', function (ev) {\n  var b = ev.target.closest('[data-day]", """document.addEventListener('toggle', function (ev) {
  if (ev.target.dataset && ev.target.dataset.assets1161) assetsOpen1161[ev.target.dataset.assets1161] = ev.target.open;
  if (ev.target.id === 'crew-map1161') mapOpen1161 = ev.target.open;
  if (ev.target.id === 'crew-history1161') {
    historyOpen1161 = ev.target.open;
    if (!historyOpen1161 && pick && pick.day < autoDay(now())) { pick = null; advance = null; render(); }
  }
}, true);
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-day]""",'remember disclosure state across updates')
    change('</style>', '''/* v11.61: existing components folded, with large phone targets. */
.crew-history1161{grid-column:1/-1;flex:0 0 100%;width:100%;margin-top:4px}
.crew-assets1161 summary,.crew-history1161 summary,.crew-map1161 summary{cursor:pointer;min-height:44px;padding:12px;box-sizing:border-box;font-size:14px;font-weight:700;color:var(--ink);border:1px solid var(--line);border-radius:10px;background:var(--panel)}
.crew-history1161>.days{margin-top:8px}
.crew-map1161{margin:10px 0}.crew-map1161 .amap{margin-top:8px}
.crew-map1161[open] summary,.crew-history1161[open] summary{color:var(--hivis)}
.crew-assets1161{margin:6px 0 10px}.crew-assets1161 summary{color:var(--mute)}
.saved-own1161{font-size:19px;font-weight:800}.saved-other1161{font-size:14px;color:var(--mute)}
</style>''','disclosure styling')
    pkg['html']=h
    if json.dumps(pkg['data'],sort_keys=True)!=original_data: raise ValueError('tracker data changed')
    new_pkg=json.dumps(pkg,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
    text=rep(text,text[start:start+end],new_pkg,'updated template bundle','page')
    text=rep(text,"+' · v11.60'; /* v8.19 release922","+' · v11.61'; /* v8.19 release922",'release footer','page')
    return text
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()),encoding='utf-8')
    print('v11.61 crew template updated; tracker data and send path unchanged')
