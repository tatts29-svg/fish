"""Author: Andrew Fisher. Source-only CW1 planning update; no operational records."""
import copy
import json
import math
from pathlib import Path

from extract_cw1_954 import CATEGORIES, SOURCE_SHA, ROW_MAP

BASE = Path(__file__).resolve().parent
PROGRAMME_SHA = '836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db'
BASIS = ('CW1 source review, 9 Oct 2026: supported dated PDF and email updates are applied once. '
         'Unresolved scope, crossed-out work and earlier tasks omitted from the PDF retain their previous '
         'programme quantities as provisional forecast allowances, visibly awaiting review. '
         'These are work movements, not unique hire stock or completed work. Printed PDF subtotals are not used.')

def totals(rows):
    return {key:round(sum(row.get('fields',{}).get(key,0) for row in rows),2) for key in CATEGORIES}

def apply_cw1(original, source=None):
    source = source or json.loads((BASE/'source954.json').read_text())
    if source.get('sha256') != SOURCE_SHA or source.get('schema') != 1 or len(source.get('rows',[])) != 45:
        raise ValueError('Unreviewed CW1 source')
    expected_ids={'cw1-'+str(key) for keys in ROW_MAP.values() for key in keys}
    if {r.get('id') for r in source['rows']} != expected_ids:
        raise ValueError('CW1 source task identities changed')
    for row in source['rows']:
        if row.get('date') not in ['2026-10-'+str(n) for n in range(12,17)]:
            raise ValueError('CW1 source date outside covered 2026 week')
        if not row.get('source_pages954') or any(type(p)!=int or not 1<=p<=23 for p in row['source_pages954']):
            raise ValueError('Invalid CW1 source page')
        for key,value in row.get('fields',{}).items():
            if key not in CATEGORIES or type(value) not in [int,float] or not math.isfinite(value) or value<0:
                raise ValueError('Invalid CW1 source quantity')
            if key in ['Vehicle Gates','Ped. Gates'] and value!=int(value):
                raise ValueError('Fractional gate count')
    if original.get('source_sha256') != PROGRAMME_SHA or 'source_review951' not in original:
        raise ValueError('Expected reviewed 9 October programme base')
    if original.get('source_review954'): raise ValueError('CW1 update already applied')
    out = copy.deepcopy(original)
    week = next(x for x in out['week_sheets'] if x['sheet']=='CON WK1')
    if week.get('plan_update'): raise ValueError('An intervening CW1 installation plan needs reconciliation')
    prior = {r['source_row']:r for r in week['programme_rows951']}
    if len(prior)!=56 or [r['source_row'] for r in prior.values() if not r['included']]!=[24]:
        raise ValueError('Unexpected CW1 programme task identity set')
    conflicts=[]
    def issue(id, description, summary, detail, state='awaiting confirmation'):
        conflicts.append({'id':id,'description':description,'summary':summary,'detail':detail,'state':state})
        return id
    issue('maddison-status','Maddison Point demarcation', 'PDF p. 2: 91 m may already have been done; omitted from p. 4 detail.',
          'Prior 91 m remains a provisional allowance until actual records settle whether work is still required. No completion inferred.')
    issue('ferny-stockpile','Ferny Avenue East', 'PDF pp. 2, 4: 60 m is already stockpiled.',
          'Prior deployment allowance is retained; stockpiled is not installed. No second stockpile or unique hire quantity is added.')
    issue('inlet-date','Inlet / Serisier', 'PDF pp. 8–9 date the 30 m Event CCB on Wednesday 14 October; inherited note says (17/10).',
          'Keep the explicit current dated task and its existing Event category; retain the conflicting note for review.')
    issue('monster-struck','Monster Energy CZ', 'PDF p. 12 visibly crosses out 135 m clean and 1 vehicle gate, but the printed subtotal still includes them.',
          'Reason not stated. Prior quantities remain a provisional forecast allowance pending scope confirmation; no cancellation or completion recorded.')
    issue('spit-scope','Spit Fuel Compound / rear of transporter parking', 'PDF p. 18: 85 m clean + 35 m relocation + 1 vehicle gate. Page 20: 190 m clean + 1 vehicle gate with wider map/title extent.',
          'Prior 85 m clean + 35 m relocation retained. The 190 m detail is not added or substituted until scope and movement category are confirmed.')
    issue('gate6-date','Gate 6 Compound', 'PDF p. 10 and the p. 12 embedded row say Wednesday; dedicated p. 15 heading and row say Thursday.',
          'Thursday 15 October selected once, supported by dedicated map/table and John Brett’s supplied email. Original date text retained.', 'dated update supported')
    issue('pit-date','Pit Building / Paddock', 'PDF p. 17 says Thursday, end of day, while its embedded row still says Friday; p. 18 Friday copy is crossed out.',
          'Thursday 15 October selected once, also supported by John Brett’s supplied email. Preserve original Friday row date; never duplicate the task.', 'dated update supported')
    issue('surfers-time','Surfers Paradise light rail', 'PDF p. 12 and programme say after 12:00; p. 14 says after Cable Street works.',
          'Both conditions retained. Traffic control/access is required, not recorded as arranged.')
    issue('meriton-access','Esplanade CCB / Meriton lane', 'PDF p. 18 lists 09:30–10:30 and JB to contact 30 minutes before; p. 23 says lane access needs confirmation.',
          'Retain the timing as proposed only; access permission is unconfirmed.')
    issue('s14-length','S14 CZ', 'PDF p. 16: exact length depends on where barriers are installed; may need split crews.',
          'Prior 29 m relocation is provisional; do not mark it measured or completed.')
    issue('stockpile50','Gate 6 queuing CCB stockpile', 'PDF p. 10 records 50 m Event CCB stockpile; the Wednesday summary omits it.',
          'Kept as source evidence only. No additional installed or unique-stock forecast is inferred; reconcile reuse before adding any extra quantity.')
    issue('printed-totals','PDF subtotals and repeated pages', 'Printed totals mix stale task dates, crossed-out rows and conflicting detail scopes; pp. 21–22 are identical Cypress pages.',
          'Forecast quantities are summed from individually selected task rows, with provisional allowances identified. Cypress is counted once.', 'calculation rule')
    pending={10:'maddison-status',11:'ferny-stockpile',37:'inlet-date',51:'monster-struck',60:'spit-scope',57:'s14-length'}
    extra={
      7:'Only up to the Hutchinson construction site; the shortened extent replaces the earlier task, not an additional fence run.',
      8:'PDF extent is Seacrest to Ferny Avenue; the earlier programme says Seacrest to Pacific Point. Keep the source extents distinguishable.',
      12:'PDF says increased from 40 m; the earlier programme actually records 19 m. The current PDF specifies 100 m.',
      13:'PDF specifies Narrowneck Lodge to Narrowneck Court; prior programme describes Pacific Point to Narrowneck. One updated task, not two overlapping allowances.',
      14:'Potentially install gates first; remainder once the carpark is fully clear (p. 5).',
      16:'Additional 30 m for Silverpoint is already within the shown 165 m; do not add it again.',
      18:'Keep this 71 m clean / 102 m demarcation task distinct from the next residents run, as separately listed on pp. 6–7.',
      19:'Updated extent is Ocean Isles–Amani–SLS Tower; 152 m replaces the earlier 80 m Amani–SLS task.',
      21:'The source note says “WAS” but supplies the same 30 m clean and 155 m demarcation; no unstated replacement inferred.',
      29:'Use existing No Parking bollards outside Contessa; other highlighted no-parking spots are intended to aid installation (p. 9).',
      40:'Braced and scrimmed now, per supplied email; category and 185 m updated from the previous 135 m clean.',
      41:'Braced and scrimmed now, per supplied email; 190 m replaces the previous 180 m clean. Gates to be left open.',
      'triangle':'Prefer Fortress because this zone is removed early the following week (p. 11); no stock allocation inferred.',
      44:'First job circa 06:30, under traffic control with restricted vehicle access. Page 13 title says Helen Park, but its map and table show Cable/Pacific residents.',
      59:'06:00 start. Scottie and Wayne must do this work due to the KDR permit (p. 19 and supplied email); brace every fourth panel. This states a permit requirement, not approval.',
      62:'240 m and 2 vehicle gates counted once: pp. 21 and 22 are identical. Use fencing from Paddock/Pit Lane.',
      64:'Esplanade residents fence stays 185 m clean. No new measured actual is inferred.'}
    requirements={14:['Carpark fully clear before completing remaining fence.'],
       44:['First task, circa 06:30; traffic control and restricted vehicle access.'],
       45:['After Cable Street works and after 12:00; traffic control required.'],
       46:['After Cable Street works and after 12:00; traffic control required.'],
       47:['After Cable Street works and after 12:00; traffic control required.'],
       57:['Wait for barriers and fences; exact metres depend on barrier position. May need split crews.'],
       61:['End of Thursday; two double-wide vehicle gates (three wheels) plus one vehicle gate.'],
       59:['06:00; Scottie and Wayne due to KDR permit; brace every fourth panel.'],
       63:['Meriton lane access still to confirm; proposed 09:30–10:30, JB contact 30 minutes before.']}
    rows=[];seen=set()
    for sr in source['rows']:
        row=copy.deepcopy(sr); key=row['source_row951'] if row['source_row951'] is not None else row['id'].removeprefix('cw1-')
        if row['id'] in seen: raise ValueError('Duplicate CW1 task')
        seen.add(row['id'])
        old=prior.get(key)
        row['programme_fields954']=copy.deepcopy(old['quantities']) if old else None
        row['programme_date954']=old['date'] if old else None
        row['programme_source954']=old['source_range'] if old else None
        row['source_note954']=row['note']
        row['review_state954']='supported current plan'
        row['forecast_basis954']='PDF task quantity; dated map and supplied email resolve retained stale date text where noted.'
        row['conflicts']=[]
        if key in pending:
            row['conflicts'].append(pending[key]);row['review_state954']='prior allowance pending review'
            row['fields']=copy.deepcopy(old['quantities'])
            row['forecast_basis954']='Earlier programme quantity retained provisionally; source issue awaiting confirmation.'
        if key=='gate6': row['conflicts'].append('gate6-date')
        if key==61: row['conflicts'].append('pit-date')
        if key in [45,46,47]: row['conflicts'].append('surfers-time')
        if key==63: row['conflicts'].append('meriton-access')
        row['note']=' '.join(x for x in [row['note'],extra.get(key)] if x)
        # Conditions appear once in the native task row. Exact source notes remain
        # in source_note954 and the original transcript for audit.
        if key in requirements:
            row['note']={14:'Gates may be installed first (p. 5).',
                         44:'Page 13 title says Helen Park, but its map and table show Cable/Pacific residents.',
                         59:'The table also names Brenden; the dedicated map and supplied email require Scottie and Wayne.'}.get(key,'')
        row['requirements']=[{'id':row['id']+'-requirement-'+str(i+1),'text':text,'page':row['source_pages954'][-1],'kind':'condition'} for i,text in enumerate(requirements.get(key,[]))]
        if key in [16,17,18,19,20,21,22,23,25,26]:
            row['requirements'].append({'id':row['id']+'-bsf','text':'If possible, both sides of the road on one day under BSF traffic control (p. 7).','page':7,'kind':'condition'})
        rows.append(row)
    matched={r['source_row951'] for r in rows if r['source_row951'] is not None}
    for old in prior.values():
        if not old['included'] or old['source_row'] in matched:continue
        id='programme-'+str(old['source_row'])
        issue(id,old['location']+' — '+old['description'],'Earlier programme task is not listed in the new CW1 PDF.',
              'Omission does not confirm cancellation or completion. Previous quantity remains a provisional forecast allowance pending review.')
        rows.append({'id':'cw1-'+id,'source_row951':old['source_row'],'date':old['date'],
          'date_as_written954':old['date_as_written'],'location':old['location'],'description':old['description'],
          'fields':copy.deepcopy(old['quantities']),'programme_fields954':copy.deepcopy(old['quantities']),
          'programme_date954':old['date'],'programme_source954':old['source_range'],'source_pages954':[],
          'note':' '.join(n['text'] for n in old['notes']),'page':None,'requirements':[], 'conflicts':[id],
          'review_state954':'prior allowance pending review','forecast_basis954':'Earlier programme task omitted from PDF; retained provisionally, not newly confirmed.'})
    if len(rows)!=57 or len({r['id'] for r in rows})!=57:raise ValueError('Unexpected CW1 deduplicated task count')
    old_days={d['date']:copy.deepcopy(d) for d in week['days']}
    days=sorted(old_days)
    if days!=['2026-10-'+str(n) for n in range(12,17)]:raise ValueError('Unexpected CW1 days')
    by_day=[{'date':day,'rows':[r for r in rows if r['date']==day]} for day in days]
    plan={'week':'CON WK1','code':'C1','title':'Construction Week 1 — Fencing Installation Plan',
      'file':source['source_file'],'pages':23,'author':'John Brett','created_display':source['created_display'],
      'received':'9 Oct 2026','sha256':SOURCE_SHA,'sha256_16':SOURCE_SHA[:16],'revision':'2026-10-09',
      'basis':BASIS,'days_covered':days,'rows_by_day':by_day,'conflicts':conflicts,
      'stockpile_evidence954':[copy.deepcopy(source['stockpile_evidence'])],
      'email954':copy.deepcopy(source['email']),'printed_weekly_totals954':copy.deepcopy(source['printed_weekly_totals']),
      'printed_totals_used954':False,'flags':[],'notes':[],
      'differences':[{'date':day['date'],'location':'Selected task rows','description':'Current supported updates plus prior provisional allowances',
          'kind':'changed','programme':old_days[day['date']]['totals'],'plan':totals(day['rows'])} for day in by_day]}
    week['plan_update']=plan
    for day in week['days']:
        selected=next(d['rows'] for d in by_day if d['date']==day['date'])
        day['programme_totals']=copy.deepcopy(old_days[day['date']]['totals'])
        day['totals']=totals(selected);day['rows']=len(selected);day['basis']=BASIS
        day['cw1_review_rows954']=[r['id'] for r in selected if r['review_state954']=='prior allowance pending review']
    week['totals']=totals(rows);week['totals_basis']=BASIS
    week['provisional_totals954']=totals([r for r in rows if r['review_state954']=='prior allowance pending review'])
    out['installation_plans']['plans'].append({k:copy.deepcopy(plan[k]) for k in ['week','code','title','file','pages','author','created_display','received','sha256_16','sha256','basis']})
    out['installation_plans']['disagreements_CW1']={'what':'CW1 source conflicts and provisional allowances; no actuals or rates changed.','items':copy.deepcopy(conflicts)}
    out['source_review954']={'schema':1,'author':'Andrew Fisher','sha256':SOURCE_SHA,'reviewed_on':'2026-10-09',
      'task_count':len(rows),'pdf_task_count':45,'provisional_task_count':sum(r['review_state954']=='prior allowance pending review' for r in rows),
      'printed_subtotals_used':False,'duplicate_cypress_counted_once':True,'stockpile_additional_forecast':False,
      'source_dates_used_as_completion':False,'original_uploaded':False,'basis':BASIS}
    out['authority']+=' CW1 now applies the reviewed 9 October installation PDF and supplied email, with provisional source conflicts retained explicitly.'
    out['reference_basis']+=' CW1 quantities include identified prior allowances pending confirmation; the new PDF’s printed subtotals are not used.'
    return out
