"""Author: Andrew Fisher. Keep ended servicing nights in collapsed saved history."""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def patch(html):
    expected = (HERE / 'BASE_SHA256').read_text().strip()
    if hashlib.sha256(html.encode()).hexdigest() != expected:
        raise ValueError('v11.60 requires the verified v11.59 live base')
    if 'svc1160-history' in html:
        raise ValueError('v11.60 already applied')
    html = rep(html, "  var days = D.days.map(function (d) {", "  function dayButton1160(d) {", 'day button renderer', 'page')
    html = rep(html, "  }).join('');\n  var none = g.d === 0 && day.ifNeeded && day.id <= cur;", """  }
  var operational1160 = M.operational1160 === true;
  var active1160 = D.days.filter(function(d){return !operational1160 || d.id >= cur;});
  var past1160 = operational1160 ? D.days.filter(function(d){return d.id < cur;}) : [];
  var days = active1160.map(dayButton1160).join('');
  var history1160 = past1160.length ? '<details class="svc1160-history" data-svc1102-key="panel-history" data-svc-history' + (M.historyOpen1160 ? ' open' : '') + '><summary data-ro>Previous nights · saved history</summary><div class="svc-days" role="group" aria-label="Previous service nights">' + past1160.map(dayButton1160).join('') + '</div></details>' : '';
  var ended1160 = operational1160 && !active1160.length ? '<p class="svc-win">Event servicing has ended. Showing the last selected night’s saved results.</p>' : '';
  var none = g.d === 0 && day.ifNeeded && day.id <= cur;""", 'separate current nights from history', 'page')
    html = rep(html, "'<div class=\"svc-days\" data-svc1102-key=\"panel-days\" role=\"group\" aria-label=\"Service day\">' + days + '</div>' +", "'<div class=\"svc-days\" data-svc1102-key=\"panel-days\" role=\"group\" aria-label=\"Service day\">' + days + '</div>' + history1160 + ended1160 +", 'history below operational selector', 'page')
    html = rep(html, "var note, open = {}, pickedDay = '', clockAt = 0, clockNow = 0, lastSignature = '', observer, admin;", "var note, open = {}, pickedDay = '', clockAt = 0, clockNow = 0, lastSignature = '', observer, admin;\nvar historyOpen1160 = false, serviceDay1160 = '';", 'history controller state', 'page')
    html = rep(html, "selected = entry.token; model = null; open = {}; pickedDay = ''; reader.clear(selected); lastSignature = ''; poll();", "selected = entry.token; model = null; open = {}; pickedDay = ''; historyOpen1160 = false; serviceDay1160 = ''; reader.clear(selected); lastSignature = ''; poll();", 'reset when changing tracker', 'page')
    html = rep(html, "host.addEventListener('toggle', function (e) { if (e.target.matches('details[data-svc-area]'))", """host.addEventListener('toggle', function (e) {
      if (e.target.matches('details[data-svc-history]')) {
        var wasOpen1160 = historyOpen1160; historyOpen1160 = e.target.open;
        if (wasOpen1160 && !historyOpen1160 && pickedDay && pickedDay < SvcState.svcDay(timeNow())) { pickedDay = ''; draw(true); }
      }
      if (e.target.matches('details[data-svc-area]'))""", 'history close returns to active night', 'page')
    html = rep(html, "var now = timeNow(), data = model.D, day = pickedDay || SvcState.autoDay(data, now), meta = model.meta;", """var now = timeNow(), data = model.D, meta = model.meta;
    var cur1160 = SvcState.svcDay(now), operational1160 = meta.load === 'servicing-tracker:GC500-2026';
    if (operational1160 && serviceDay1160 && serviceDay1160 !== cur1160) { pickedDay = ''; historyOpen1160 = false; }
    serviceDay1160 = cur1160;
    var day = pickedDay || SvcState.autoDay(data, now);""", 'follow the service-day rollover', 'page')
    html = rep(html, "day:day, open:open, example:false,", "day:day, open:open, example:false, operational1160:operational1160, historyOpen1160:historyOpen1160,", 'pass presentation choice only', 'page')
    html = rep(html, "+' · v11.59'; /* v8.19 release922", "+' · v11.60'; /* v8.19 release922", 'release footer', 'page')
    style = '<style id="svc1160-style">/* Author: Andrew Fisher. Saved history is separate from operational nights. */\n#svc1067>[data-svc1102-key="panel-days"],#svc1067 .svc1160-history .svc-days{grid-template-columns:repeat(auto-fit,minmax(80px,1fr))}#svc1067>.svc1160-history{order:2}#svc1067 .svc1160-history{margin:8px 0;border:1px solid #354c57;border-radius:6px;background:#141d21;color:#c9dae3}#svc1067 .svc1160-history>summary{padding:10px 12px;cursor:pointer;font-weight:700}#svc1067 .svc1160-history .svc-days{padding:0 10px 10px}#svc1067 .svc1160-history:focus-within{outline:2px solid #f58220;outline-offset:2px}\n</style>\n'
    i = html.rfind('</body>')
    return html[:i] + style + html[i:]

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
    print('v11.60 operational servicing nights applied')
