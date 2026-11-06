#!/usr/bin/env python3
"""Author: Andrew Fisher. Write review copies; never edit the supplied source paths or private inputs."""
import argparse, difflib, hashlib, json
from pathlib import Path

def sub1(text, old, new, label):
    if text.count(old) != 1:
        raise ValueError(f'{label}: expected one anchor, got {text.count(old)}')
    return text.replace(old, new)

def change_builder(s):
    old="_edmy = lambda d_: '%d %s' % (int(d_[8:10]), {'09': 'Sep', '10': 'Oct', '11': 'Nov'}[d_[5:7]])\n_est_rows = [l_ for g_ in ('oct_ran', 'nov_on_site') for l_ in EST['legs'] if l_['group'] == g_]"
    new="""def _est_presentation_leg(l_):
    # An on-site observation supports a forecast month, not a collection day. Keep the immutable input as supplied.
    out_ = dict(l_)
    d_ = str(out_.get('date', ''))
    observation_ = re.fullmatch(r'on site at record \\d+ \\(\\d{1,2} [A-Za-z]{3}\\); came in on [^;]+', str(out_.get('evidence', '')))
    scheduled_ = False
    if re.fullmatch(r'\\d{4}-\\d{2}-\\d{2}', d_):
        day_ = dt.date.fromisoformat(d_)
        same_day_ = r'\\b%s\\s+%s\\b' % (day_.day, day_.strftime('%b'))
        scheduled_ = bool(re.search(r'\\bSchedule 17\\b', str(out_.get('what', ''))) and re.search(same_day_, str(out_.get('what', ''))))
    if out_['group'] == 'nov_on_site' and observation_ and not scheduled_:
        out_['date'] = d_[:7]
    return out_
def _edmy(d_):
    return ({'09': 'Sep', '10': 'Oct', '11': 'Nov'}[d_[5:7]] + ' forecast') if len(d_) == 7 else '%d %s' % (int(d_[8:10]), {'09': 'Sep', '10': 'Oct', '11': 'Nov'}[d_[5:7]])
def _est_date_label(l_):
    return _edmy(l_['date']) + (' scheduled' if l_['group'] == 'nov_on_site' and len(l_['date']) == 10 else '')
def _est_sheet_date(l_):
    return _est_date_label(l_) if l_['group'] == 'nov_on_site' else l_['date']
_est_rows = [_est_presentation_leg(l_) for g_ in ('oct_ran', 'nov_on_site') for l_ in EST['legs'] if l_['group'] == g_]"""
    s=sub1(s,old,new,'builder copied rows and date precision')
    header="['When', 'Branch', 'Ref', 'What', 'Leg', 'Date',"
    if s.count(header) != 2: raise ValueError('Transport estimate headers changed')
    s=s.replace(header, header.replace("'Date'", "'Timing'"))
    s=sub1(s,"l_['kind'], l_['date'], l_['loads'], l_['rate'], l_['rate_source'], l_['amount'], l_['evidence']] for l_ in _est_rows]", "l_['kind'], _est_sheet_date(l_), l_['loads'], l_['rate'], l_['rate_source'], l_['amount'], l_['evidence']] for l_ in _est_rows]",'workbook forecast month display')
    s=sub1(s, "l_['kind'], _edmy(l_['date']),", "l_['kind'], _est_date_label(l_),", 'pack scheduled date qualification')
    # An explanatory sentence at the estimate's own note; independent of the rate-quantity wording patch.
    s=sub1(s,"each leg is estimated here. \" + EST['method']", "each leg is estimated here. Forecast shown by month: this estimate does not establish a pick-up day. See operational bookings for collection dates. Specific dates retained from the estimate evidence are scheduled, not completed. \" + EST['method']",'pack forecast date note')
    return s

def change_module(s):
    old="function day(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] + ' ' + p[0] : e(iso); }"
    new=old+"\nfunction estimateDay(iso, group) { return /^\\d{4}-\\d{2}$/.test(String(iso || '')) ? MON[Number(String(iso).slice(5, 7)) - 1] + ' forecast' : day(iso) + (group === 'nov_on_site' ? ' scheduled' : ''); }"
    s=sub1(s,old,new,'app forecast date formatter')
    s=sub1(s,"<th>Leg · date</th>","<th>Leg · timing</th>",'app estimate timing header')
    s=sub1(s,"e(day(x.date))", "e(estimateDay(x.date, x.group))",'app estimate date cell')
    s=sub1(s,"each as an ESTIMATE: ' + e(TE.method)", "each as an ESTIMATE. Forecast shown by month: this estimate does not establish a pick-up day. See operational bookings for collection dates. Specific dates retained from the estimate evidence are scheduled, not completed. Basis: ' + e(TE.method)", 'app forecast date note')
    return s

def change_finder(s):
    old="function dayP(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] : String(iso || ''); }"
    new="function dayP(iso) { var p = String(iso || '').split('-'); return /^\\d{4}-\\d{2}$/.test(String(iso || '')) ? MON[Number(p[1]) - 1] + ' forecast' : p.length === 3 ? Number(p[2]) + ' ' + MON[Number(p[1]) - 1] : String(iso || ''); }"
    s=sub1(s,old,new,'finder forecast date formatter')
    s=sub1(s,new,new+"\nfunction estimateDayP(x) { return dayP(x.date) + (x.group === 'nov_on_site' && /^\\d{4}-\\d{2}-\\d{2}$/.test(String(x.date || '')) ? ' scheduled' : ''); }",'finder scheduled day qualifier')
    # Only transport estimate legs; leave invoice, Schedule 17 and operational movement date formatting alone.
    for old in ["x.kind + ' ' + dayP(x.date)", "lgx.kind + ' ' + dayP(lgx.date)"]:
        count=s.count(old)
        expected=2 if old.startswith('x.') else 1
        if count != expected: raise ValueError('estimate date render anchors changed: '+str(count))
        s=s.replace(old,old.replace('dayP(x.date)','estimateDayP(x)').replace('dayP(lgx.date)','estimateDayP(lgx)'))
    return s

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--builder',type=Path,required=True);p.add_argument('--module',type=Path,required=True);p.add_argument('--finder',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
    manifests=[];patches=[]
    for file,fun,rel in [(a.builder,change_builder,'03_GC500_Delivery_Control/review_31Oct2026_october_month_end/build_monthend.py'),(a.module,change_module,'03_GC500_Delivery_Control/v12.79_pl_rehire_pack_v119/plf1279_src.js'),(a.finder,change_finder,'03_GC500_Delivery_Control/v12.79_pl_rehire_pack_v119/plf1279_find.js')]:
        before=file.read_text();after=fun(before);dest=a.out/file.name
        if dest.resolve()==file.resolve():raise ValueError('Refusing to edit supplied source')
        dest.write_text(after);manifests.append({'path':rel,'base_sha256':hashlib.sha256(before.encode()).hexdigest(),'candidate_sha256':hashlib.sha256(after.encode()).hexdigest()})
        patches.append(''.join(difflib.unified_diff(before.splitlines(keepends=True),after.splitlines(keepends=True),fromfile='a/'+rel,tofile='b/'+rel)))
    (a.out/'forecast_date_precision.patch').write_text(''.join(patches));(a.out/'manifest.json').write_text(json.dumps(manifests,indent=2)+'\n');print(json.dumps(manifests,indent=2))
