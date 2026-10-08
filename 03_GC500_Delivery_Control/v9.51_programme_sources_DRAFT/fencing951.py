"""Author: Andrew Fisher. Bounded fencing source refresh; root patch owns release/footer."""
import copy, json, re, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
sys.path.insert(0,str(BASE.parent/'toolchain'))
from rep import rep
from fencing_extract951 import SOURCE_SHA, sum_rows

BASIS='Known programme work movements, counted once from dated task rows; includes reused stock, not unique hire stock. TBC quantities and held carryovers are excluded, not recorded as zero.'

def refresh_fencing(original, source=None):
    source=source or json.loads((BASE/'fencing_source951.json').read_text())
    if 'source_review951' in original:raise ValueError('Fencing951 already applied')
    if source.get('sha256')!=SOURCE_SHA or source.get('schema')!=1:raise ValueError('Unreviewed source')
    if len(source['weeks'])!=10:raise ValueError('Expected ten programme weeks')
    out=copy.deepcopy(original)
    if [w['sheet'] for w in out['week_sheets']]!=[w['sheet'] for w in source['weeks']]:raise ValueError('Unexpected programme week order')
    out.update(source_file=source['source_file'],source_sha256=SOURCE_SHA,received=source['received'],programme_year=2026,
        authority='GC500 fencing programme received 09 Oct 2026; its cells match the 07 Oct copy. The filename retains GC600/25003. Current 2026 dated task rows are used for planning; existing installation-plan overrides remain for their covered dates. Most demob dates are now 2026. DECON WK2 rows 65–67 and the Residents Fencing / Works on Roads sheets still carry 2025 dates and remain reference only. Workbook completion words are inherited and are not actual completion evidence.',
        reference_basis=BASIS+' Existing installation-plan quantities retain precedence for their covered dates; the current workbook is shown beside them. 2026 demob dates are planned removals/movements. The three 2025 DECON WK2 rows and 2025 ancillary sheets remain outside the active plan. Signed dockets and native completion records remain the actuals.',
        not_rolled_forward=['DECON WK2 rows 65–67','RESIDENTS FENCING','WORKS ON ROADS'],stray_years=[])
    out['source_review951']={'schema':1,'author':'Andrew Fisher','sha256':SOURCE_SHA,'same_cells_as_07_oct':True,'direct_circular_formulas':8,'summary_formula_values_used':False,'source_statuses_used_as_actuals':False,'quantity_basis':BASIS,'ancillary_carryovers':copy.deepcopy(source['carryover_sheets']),'coordination_only':copy.deepcopy(source['coordination_only'])}
    for week,sw in zip(out['week_sheets'],source['weeks']):
        old_days={d['date']:copy.deepcopy(d) for d in week.get('days',[])}
        covered=set((week.get('plan_update') or {}).get('days_covered',[]))
        source_days={d['date']:d for d in sw['days']}
        dates=sorted(set(source_days)|covered)
        days=[]
        for date in dates:
            sd=source_days.get(date)
            if date in covered:
                if date not in old_days:raise ValueError('Missing existing installation-plan day '+date)
                day=old_days[date]
                # Preserve native plan values, row count, basis and all other fields.
                day['programme_totals']=copy.deepcopy(sd['totals']) if sd else None
            else:
                if sd is None:continue
                day={'date':date,'rows':sd['rows'],'totals':copy.deepcopy(sd['totals']),'basis':BASIS,'programme_totals':None}
            day['programme_source_rows951']=copy.deepcopy(sd['source_rows']) if sd else []
            day['programme_unquantified951']=copy.deepcopy(sd['unquantified']) if sd else []
            days.append(day)
        if not days:raise ValueError('No current dated tasks for '+week['sheet'])
        week['days']=days
        week['programme_totals']=copy.deepcopy(sw['totals'])
        # Sum only dated active rows/day overrides; no SUMMARY caches or embedded subtotals.
        categories=set(sw['categories'])|{k for d in days for k in d['totals']}
        week['totals']=sum_rows([{'quantities':d['totals']} for d in days],sorted(categories))
        week['totals_basis']=('Existing installation plan for covered dates; current workbook task rows for other dates. '+BASIS) if covered else BASIS
        week.update(year=2026,rolled_forward=True,first_day=days[0]['date'],last_day=days[-1]['date'])
        week['span']=days[0]['date']+' – '+days[-1]['date']+' (2026 task dates)'
        week['programme_rows951']=copy.deepcopy(sw['rows'])
        week['programme_unquantified951']=copy.deepcopy(sw['unquantified'])
        week['held_rows951']=[r['source_row'] for r in sw['rows'] if not r['included']]
        week['source_statuses_ignored951']=copy.deepcopy(sw['ignored_source_status_counts'])
    return out

def apply_fencing951(html, path='<candidate>'):
    if 'function fencingNotes951(' in html or '"source_review951":' in html:raise ValueError('Fencing951 already applied')
    if 'function fencingWorkingEstimate829(' not in html:raise ValueError('Missing native fencing model')
    marker='const DATA = '
    if html.count(marker)!=1:raise ValueError('Expected one DATA declaration')
    start=html.index(marker)+len(marker)
    data,_=json.JSONDecoder().raw_decode(html[start:])
    before=data['fencing']; after=refresh_fencing(before)
    old='"fencing":'+json.dumps(before,ensure_ascii=False,separators=(',',':'))
    new='"fencing":'+json.dumps(after,ensure_ascii=False,separators=(',',':'))
    html=rep(html,old,new,'fencing programme source only',path)
    # Keep source links honest: a public link appears only if a file with this exact hash exists.
    html=rep(html,"const wanted=[{id:'P0032500301GC600_2026_Coates_Hire_Fencing_Programme.xlsx',title:'Programme source',sha:'e177dd17fe6d9389aa2fcadfd6435c5e8f7b9dd1278228e649bf803775b6cfd7'},", "const wanted=[{id:DATA.fencing.source_file,title:'Programme source · 09 Oct',sha:DATA.fencing.source_sha256},",'current fencing source hash',path)
    html=rep(html,"${esc(DATA.fencing.reference_basis || DATA.fencing.authority || '')} The planned figures below are that programme's stated week totals\n set against the matching 2026 week; on <i>Where we are</i> the plan is read by the day.</div>","${esc(DATA.fencing.reference_basis || DATA.fencing.authority || '')} The week table shows known planned work quantities; <i>Where we are</i> reads the dated plan by the day.</div>\n ${fencingNotes951()}",'fencing basis and task notes',path)
    html=rep(html,"<div class=\"notice info\"><b>Planned and quoted</b>“Planned” on the week table is the 2026 fencing programme's stated total for the\n matching week (received ${esc(DATA.fencing.received || '11 Sep 2026')}; the removal weeks in that file still carry 2025 dates and are shown as\n reference only). “Quoted” is whatever is typed in from the contractor's quote; a line that goes past it is flagged for a\n variation. Neither is an order.</div>","<div class=\"notice info\"><b>Planned and quoted</b>“Planned” is known programme work movements, including reused stock, from dated task rows and retained installation-plan updates (received ${esc(DATA.fencing.received || '')}). Current 2026 demob rows are planning only; remaining 2025 carryovers are held separately. “Quoted” is the supplied contractor quote. Neither is an order or a completion record.</div>",'current demob explanation',path)
    html=rep(html,'<th>Stated totals</th></tr></thead><tbody>${','<th>Planned work quantities</th></tr></thead><tbody>${','quantity basis heading',path)
    html=rep(html,'const started = weeks.filter(w => w.start <= asOf);','const started = weeks.filter(w => fencingWeekStarted951(w, asOf));','respect Sunday source task date',path)
    html=rep(html,'const W = ((DATA.fencing || {}).week_sheets || []).filter(w => w.year === 2026 || w.rolled_forward);','const W = ((DATA.fencing || {}).week_sheets || []).filter(w => (w.year === 2026 || w.rolled_forward) && !/decon|deconstruction/i.test(`${w.sheet} ${w.phase}`));','installation denominator excludes demob reuse',path)
    anchor='function fenceEstimateSources829(model){'
    html=rep(html,anchor,(BASE/'fencing_notes951.js').read_text()+'\n'+anchor,'native folded programme evidence',path)
    return html

if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: fencing951.py candidate.html (no footer change)')
    p=Path(sys.argv[1]);p.write_text(apply_fencing951(p.read_text(),str(p)))
