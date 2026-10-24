"""Author: Andrew Fisher. Crew attribution, private roster input, exact v11.72 base."""
import hashlib,json,os,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
page=Path(sys.argv[1]);raw=page.read_bytes();text=raw.decode()
assert 'var SvcCrews1173 =' not in text,'Already patched'
assert hashlib.sha256(raw).hexdigest()=='84cb7d6c1eccf57ba1cca2802e149fd7ef28b4300c94ae2441f0164697af50ea','Wrong live base'
roster=json.loads(Path(os.environ['GC500_CREW_ROSTER']).read_text())
assert len(roster)==5 and [g['id'] for g in roster]==['cleaners','pump1','pump2','pump3','water']
assert all(set(g)=={'id','label'} and isinstance(g['label'],str) and 1<=len(g['label'])<=80 and not any(x in g['label'] for x in '<>\n\r') for g in roster),'Labels only; no contact fields'
def replace(s,a,b,label):return rep(s,a,b,label,str(page))
def change(a,b,label):
 global text
 text=replace(text,a,b,label)
helper=(HERE/'crews1173.js').read_text()
state_start=text.index('var SvcState =');state_end=text.index('module.exports = SvcState;',state_start)+len('module.exports = SvcState;')
old_state=text[state_start:state_end]
new_state=replace(old_state,'s.ids.push(e.id);','SvcCrews1173.add(s,e);\n    s.ids.push(e.id);','add attribution after cancellation')
match=re.search(r'var SVC1067_CARD=(\{[^\n]+\});',text);bundle=json.loads(match.group(1));crew=bundle['html']
crew=replace(crew,old_state,helper+'\n'+new_state,'shared crew state')
crew=replace(crew,"var mode = 'view',",(HERE/'selector1173.js').read_text()+"\nvar mode = 'view',",'selector')
crew=replace(crew,"hashNote = null; focusArea = null; confirmKey = null; closing = false;","selectedCrew1173='';\n  hashNote = null; focusArea = null; confirmKey = null; closing = false;",'clear selection on scan')
crew=replace(crew,'var at = now(), auto = autoDay(at), late = day < auto;',"selectedCrew1173='';\n  var at = now(), auto = autoDay(at), late = day < auto;",'clear selection on day choice')
crew=replace(crew,"function wire(e) { return {",'function wire(e) { var w = {','wire start')
crew=replace(crew,'tapped_at: e.tapped_at }; }','tapped_at: e.tapped_at }; if(e.crew_group)w.crew_group=e.crew_group;return w; }','wire crew')
crew=replace(crew,'noteServer(j, t0, t1); netDown = false; degraded = null;',"crewReady1173=j.crew_groups_version===1;keep('crew-capability1173',crewReady1173);\n        noteServer(j, t0, t1); netDown = false; degraded = null;",'verified server capability')
crew=replace(crew,'if (sending || final || !outbox.length) return;',"if (sending || final || !outbox.length) return;\n  if(!crewReady1173 && outbox.some(function(e){return !!e.crew_group;})){schedulePump(SLOW_MS);return;}",'never discard groups on old server')
crew=replace(crew,'var ev = outbox[idx];',"var ev = outbox[idx];\n        if(ev.crew_group && sv.crew_group!==ev.crew_group){crewReady1173=false;keep('crew-capability1173',false);return;}",'acknowledgement must preserve group')
crew=replace(crew,"var ev = { id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: true,", "if(!crewReady1173 || !SvcCrews1173.choices(D).some(function(g){return g.id===selectedCrew1173;})){render();refocus('crew1173-choice');say('Select your crew group before completing a job.');return;}\n  var ev = { crew_group:selectedCrew1173, id: newId(), ref: curRef, sig: curSig, line: lineId, task: task, day: day, done: true,",'require explicit group for new completion')
crew=replace(crew,"shown.forEach(function (l) {", "h += crewSelector1173();\n  shown.forEach(function (l) {",'selector above tasks')
crew=replace(crew,"'Completed ' + hm(s.at) + (s.local ? ' · waiting for signal' : '')", "'Completed ' + hm(s.at) + ' · ' + SvcCrews1173.text(D,s) + (s.local ? ' · waiting for signal' : '')",'completion attribution')
crew=replace(crew,"var aria = label +", "if(!s)sub=!selectedCrew1173?'Select your crew group first':!crewReady1173?'Waiting for crew-group saving':sub+' · '+SvcCrews1173.label(D,selectedCrew1173);\n  var aria = label +",'selected group on task')
crew=replace(crew,"(open && !final && !stale && !identityPending() ? '' : ' disabled')", "(open && !final && !stale && !identityPending() && (s || selectedCrew1173 && crewReady1173) ? '' : ' disabled')",'disable unassigned completions')
crew=replace(crew,'log.push({ at: s.at, local: s.local, r: r, l: l, t: t })','log.push({ at: s.at, local: s.local, crew:SvcCrews1173.text(D,s), r: r, l: l, t: t })','audit data')
crew=replace(crew,"esc(words1146(e.l)) + ' · '","esc(words1146(e.l)) + ' · ' + esc(e.crew) + ' · '",'audit crew')
crew=replace(crew,"(s ? ' ' + hm(s.at) : '')", "(s ? ' ' + hm(s.at) + ' · ' + esc(SvcCrews1173.text(D,s)) : '')",'saved and area rows')
crew=replace(crew,'</style>','\n'+(HERE/'crew1173.css').read_text()+'\n</style>','selector CSS')
bundle['html']=crew;bundle['data']['crewGroups']=roster
change(match.group(0),'var SVC1067_CARD='+json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';','crew bundle')
change(old_state,helper+'\n'+new_state,'shared main state')
change("esc(M.S.hm(at)) + '</time></td>'", "esc(M.S.hm(at)) + '</time><small class=\"crew1173-report\">' + esc(SvcCrews1173.text(cfg,st[M.S.jobKey(l.id,t,M.day)])) + '</small></td>'",'tracker completion group')
change('Times only, no names.','Crew groups are recorded for new completions; earlier entries keep their original history.','tracker explanation')
change('at:done?v.at:null};','at:done?v.at:null,crew:done?SvcCrews1173.text(D,v):\'\'};','report snapshot')
change("time(t.at)+'</small></span>'", "time(t.at)+'</small><small class=\"crew1173-report\">'+esc(t.crew)+'</small></span>'",'print crew label')
change("'Author','Scope']", "'Author','Scope','Crew group']",'CSV heading')
change("'Author: Andrew Fisher','Active servicing']);", "'Author: Andrew Fisher','Active servicing',t.crew]);",'CSV crew')
change("'Author: Andrew Fisher','History only — removed from servicing to-do']);", "'Author: Andrew Fisher','History only — removed from servicing to-do',r.pending?'':'Group not recorded']);",'old history attribution')
change('Saved completion times are AEST. “To confirm” means not recorded complete.','Saved completion times are AEST. Crew groups show who recorded the work. Older entries show “Group not recorded”.','report explanation')
change("+' · v11.72';","+' · v11.73';",'footer')
page.write_text(text)
