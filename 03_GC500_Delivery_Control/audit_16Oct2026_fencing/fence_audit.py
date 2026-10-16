import json,sys
s=json.load(open('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/state.json'))
d=s['docs']; aside=set(d['aside']); deleted=set(d['deleted'])
dk=[v for k,v in d['fenceDockets'].items() if k not in aside and k not in deleted]
P=2.5; rows=[]
for v in sorted(dk,key=lambda x:(x.get('date') or '',x.get('docket_no') or '')):
    q=v.get('quantities') or {}; c=v.get('components') or {}
    n=lambda x: x if isinstance(x,(int,float)) else 0
    m_mesh=sum(n(q.get(k)) for k in ('clean',)) ; m_scrim=n(q.get('scrim')); m_ccb=sum(n(q.get(k)) for k in ('ccb_demarc','ccb_event'))
    mp=n(c.get('mesh_panel')); cb=n(c.get('cc_barrier'))
    issues=[]
    if v.get('date') is None: issues.append('NO DATE')
    elif v['date']>'2026-10-16': issues.append('future date')
    if mp and abs((m_mesh)-mp*P)>0.01 and abs((m_mesh+m_scrim)-mp*P)>0.01: issues.append(f'mesh clean {m_mesh}+scrim {m_scrim}m vs {mp} panels x2.5={mp*P}')
    if not mp and (m_mesh or m_scrim): issues.append(f'mesh {m_mesh+m_scrim}m but no panel count')
    if mp and not (m_mesh or m_scrim): issues.append(f'{mp} panels but no metres')
    if cb and abs(m_ccb-cb*P)>0.01: issues.append(f'ccb {m_ccb}m vs {cb} barriers x2.5={cb*P}')
    if m_ccb and not cb: issues.append(f'ccb {m_ccb}m but no barrier count')
    if not v.get('signed_by'): issues.append('no signature')
    rows.append((v['id'],v.get('docket_no'),v.get('date'),v.get('map_ref'),q,c,issues,v.get('note','')))
bad=[r for r in rows if r[6]]
print(len(rows),'active dockets,',len(bad),'with flags')
for r in bad: print(r[0],r[1],r[2],r[3],'|',json.dumps(r[4]),'|',json.dumps(r[5]),'|','; '.join(r[6]),'| NOTE:',r[7][:160]); print()
