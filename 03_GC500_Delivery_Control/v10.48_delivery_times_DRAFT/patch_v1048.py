"""Author: Andrew Fisher. v10.48 - Coates delivery times on each past day card (Andrew, 16 Oct 2026: "Good data to have
against each day card I think. Days that have passed.").

The Coates delivery texts (SMS export 16 Oct 2026 17:47, analysed in analysis_16Oct2026_delivery_timing) give, for each
truck, the window first texted when it was booked, any re-sent window, the "on its way" time and the delivered time.
Each Timeline day that has passed and has texts now carries a fold: "Coates trucks · delivery times", headed with how
many arrived inside the window first booked, and opening to one line per truck. Days with no texts show nothing; days
after the export (19 Oct onward) show nothing until a new export is added.

"Inside the booked window" counts on time and early, as the analysis README does. A booking with no delivered text is
shown as that, not as late. The rows are a fixed copy of orders.csv taken when the patch runs; the record, charges and
costs do not change. Footer v10.47 -> v10.48.

    python3 patch_v1048.py path/to/page.html   (on the live v10.47 page)
"""
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

ORDERS = HERE.parent / 'analysis_16Oct2026_delivery_timing' / 'orders.csv'
EXPORT_DAY = '2026-10-16'
EXPORT_AT = '16 Oct 2026 17:47'
ANCHOR = "/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */"


def hm(iso):
    return iso[11:16] if iso else ''


def rows():
    out = {}
    for x in csv.DictReader(ORDERS.open(encoding='utf-8')):
        day = x['day']
        if day > EXPORT_DAY: continue
        item = re.sub(r'\s+-\s+Cy\w*', ' cyclone', x['item']).strip()
        t = x['delivered_at']
        if t and t[:10] != day:
            t = datetime.fromisoformat(t).strftime('%d %b ') + hm(t)
        else:
            t = hm(t)
        r = {'i': item, 'r': x['ref'], 'w': x['first_window'], 'o': hm(x['onway_at']), 't': t, 'x': x['result']}
        if x['final_window'] and x['final_window'] != x['first_window']: r['f'] = x['final_window']
        if x['result'] == 'late' and x['late_vs_first_min']: r['m'] = int(x['late_vs_first_min'])
        if x['result'] == 'early' and x['early_vs_first_min']: r['e'] = int(x['early_vs_first_min'])
        if x['failed_at']: r['k'] = hm(x['failed_at'])
        out.setdefault(day, []).append(r)
    for day in out:
        out[day].sort(key=lambda r: (r['t'] or r['k'] if 'k' in r else r['t'] or '99', r['i']))
    return out


NEW_TMPL = r'''/* v10.48 - delivery-times-1048: Coates delivery texts on each past Timeline day (Andrew, 16 Oct 2026). */
(function(W){
 const T1048 = __DATA__, SRC = 'Coates delivery texts, SMS export __AT__';
 const LBL = {'on time': 'On time', 'early': 'Early', 'in revised window': 'In the re-sent window', 'late': 'Late', 'failed': 'Delivery failed',
  'not yet due': 'No delivered text', 'delivered a later day': 'Came a later day', 'no booking text': 'No booking text'};
 const CLS = {'on time': 'ok', 'early': 'ok', 'in revised window': 'mid', 'late': 'bad', 'failed': 'bad', 'delivered a later day': 'bad'};
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const win = w => String(w || '').replace('-', '–');
 const mins = m => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min';
 const today = () => { try { return todayIso(); } catch (x) { return new Date().toISOString().slice(0, 10); } };
 function sum1048(iso){
  const rs = T1048[iso]; if (!rs || !rs.length) return null;
  const booked = rs.filter(r => r.t && r.x !== 'no booking text'), inside = booked.filter(r => r.x === 'on time' || r.x === 'early');
  return {rows: rs, booked: booked.length, inside: inside.length, pct: booked.length ? Math.round(100 * inside.length / booked.length) : null,
   late: rs.filter(r => r.x === 'late' || r.x === 'delivered a later day').length};
 }
 function line1048(r){
  const res = LBL[r.x] || r.x, extra = r.m ? ' · ' + mins(r.m) + ' after the booked window' : r.e ? ' · ' + mins(r.e) + ' before the window' : '';
  const bits = [r.w ? 'booked ' + win(r.w) : '', r.f ? 're-sent ' + win(r.f) : '', r.o ? 'on its way ' + r.o : '',
   r.k ? 'failed ' + r.k : '', r.t ? 'delivered ' + r.t : ''].filter(Boolean);
  return '<li><b>' + e(r.i) + '</b>' + (r.r && !String(r.i).toLowerCase().includes(String(r.r).toLowerCase()) ? ' <span class="dt1048-ref">' + e(r.r) + '</span>' : '') +
   '<span class="dt1048-pill ' + (CLS[r.x] || 'none') + '">' + e(res + extra) + '</span>' +
   '<div class="dt1048-sub">' + e(bits.join(' · ')) + '</div></li>';
 }
 function panel1048(iso){
  if (!iso || !(iso < today())) return '';
  const s = sum1048(iso); if (!s) return '';
  const head = s.booked ? s.inside + ' of ' + s.booked + ' inside the booked window (' + s.pct + '%)' : 'no delivered text for these bookings';
  const tone = s.pct == null ? 'none' : s.pct >= 80 ? 'ok' : s.pct >= 50 ? 'mid' : 'bad';
  return '<details class="dt1048" data-dt1048="' + e(iso) + '"><summary><span class="dt1048-t">Coates trucks · delivery times</span>' +
   '<span class="dt1048-pill ' + tone + '">' + e(head) + '</span><span class="dt1048-n">' + s.rows.length + ' texted</span></summary>' +
   '<ul class="dt1048-list">' + s.rows.map(line1048).join('') + '</ul>' +
   '<p class="dt1048-src">' + e(SRC) + '. Booked window is the one first texted; a re-sent window is shown when it changed. Inside the booked window counts on time and early.</p></details>';
 }
 W.sum1048 = sum1048; W.panel1048 = panel1048;
 if (!document.getElementById('dt1048-style')) { const st = document.createElement('style'); st.id = 'dt1048-style';
  st.textContent = '.dt1048{margin:8px 0;border:1px solid var(--line,#d8dde3);border-radius:8px;padding:6px 10px;background:var(--card,transparent)}' +
   '.dt1048>summary{cursor:pointer;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-weight:600}' +
   '.dt1048-n,.dt1048-ref,.dt1048-src,.dt1048-sub{color:var(--mute,#667);font-weight:400}.dt1048-n{font-size:.85em}' +
   '.dt1048-list{list-style:none;margin:8px 0 4px;padding:0}.dt1048-list li{padding:5px 0;border-top:1px solid var(--line,#e4e7eb)}' +
   '.dt1048-list li b{font-weight:600}.dt1048-sub{font-size:.85em;margin-top:2px}.dt1048-src{font-size:.8em;margin:6px 0 2px}' +
   '.dt1048-pill{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:10px;font-size:.8em;font-weight:600;background:#eceff3;color:#334}' +
   '.dt1048-pill.ok{background:#e3f4e8;color:#17602f}.dt1048-pill.mid{background:#fdf1d8;color:#7a5100}.dt1048-pill.bad{background:#fbe3e1;color:#8e1c12}' +
   '@media (prefers-color-scheme:dark){.dt1048-pill{background:#2b3138;color:#cfd6de}.dt1048-pill.ok{background:#173d24;color:#9fe0b2}.dt1048-pill.mid{background:#43340f;color:#f3cf7c}.dt1048-pill.bad{background:#4a1d19;color:#f4aaa2}}';
  document.head.appendChild(st); }
 const before = dayBlock;
 const g = function(d){ let html = before.apply(this, arguments);
  try { const p = d && panel1048(d.iso); if (p && typeof html === 'string' && !html.includes('data-dt1048=')) {
   const m = html.match(/<div class="dayblock[^>]*>(?:<div class="supplier996-facts"[\s\S]*?<\/div>)?/);
   if (m) html = html.replace(m[0], m[0] + p); } } catch (x) {}
  return html; };
 g.dt1048 = true; W.dayBlock = g; try { dayBlock = g; } catch (x) {}
})(window);
'''


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'delivery-times-1048' in html: sys.exit('patch_v1048 refuses a repeat')
    if "+ ' · v10.47'" not in html: sys.exit('patch_v1048: not the v10.47 line - wrong base')
    data = json.dumps(rows(), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    new = NEW_TMPL.replace('__DATA__', data).replace('__AT__', EXPORT_AT) + ANCHOR
    for what, old, nw in [('delivery times on past day cards', ANCHOR, new), ('Release footer', "+ ' · v10.47'", "+ ' · v10.48'")]:
        html = rep(html, old, nw, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1048 applied: Coates delivery times on each past Timeline day; footer v10.47 -> v10.48')


if __name__ == '__main__':
    main()
