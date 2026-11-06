"""Author: Andrew Fisher. Native date-only installation/completion; no operational inputs.

Composes after the servicing patch. Runtime calls require the existing edit capability
and named operator. Effective days and actual entry timestamps remain separate.
"""
from pathlib import Path


def replace_count(text, old, new, count):
    if text.count(old) != count:
        raise ValueError('Installation date patch expected ' + str(count) + ' anchor(s): ' + old[:90])
    return text.replace(old, new)


def once(text, old, new):
    return replace_count(text, old, new, 1)


HELPERS = '''/* Author: Andrew Fisher. v10.98: a supplied installation day is not an invented time of day. */
function installationDate1098(day){
 const iso=String(day||'');
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(iso)||!Number.isFinite(Date.parse(iso+'T00:00:00Z'))||new Date(iso+'T00:00:00Z').toISOString().slice(0,10)!==iso||iso>todayIso())return null;
 return {date_only:true,effective_date:iso,at:new Date(iso+'T00:00:00+10:00').toISOString(),recorded_at:new Date().toISOString()};
}
function installationMeta1098(value){return value&&value.date_only===true&&/^\\d{4}-\\d{2}-\\d{2}$/.test(value.effective_date||'')?{date_only:true,effective_date:value.effective_date}:{};}
function installationSet1098(key,day){
 const dated=installationDate1098(day),a=assetOf(key);
 if(!dated||!a||a._cancelled||movedAway(key)||!mayWrite('the installation day')||!whoAmI())return {ok:false,reason:'A valid existing reference, supplied day and named edit access are required'};
 if(deliveryOf(key).done)return {ok:false,reason:'Already complete; review the existing completion before changing its date'};
 if(timeline841CompletionConflict(a).length)return {ok:false,reason:'Resolve the short delivery before completing this reference'};
 const cut=dated.at; // Same-day timed reversals need review: a date-only event cannot establish their order.
 if(histOf(key,'history').some(h=>h.state!=='on site'&&h.at>=cut)||histOf(key,'done_history').some(h=>h.at>=cut)||((timeline841Proof(key)||{}).at||'')>=cut)return {ok:false,reason:'The site light changed after that day; review its history first'};
 if(!timeline841Set(key,4,day)||!timeline841Set(key,5,day))return {ok:false,reason:'The native progress action refused the change'};
 return {ok:true,key,effective_date:day,recorded_at:S.delivery[key].done_recorded_at};
}
window.installationOn1098=Object.freeze({set:installationSet1098});
'''


def patch(text):
    if 'function installationDate1098(' in text:
        raise ValueError('Installation date patch already present')
    text = once(text, 'function setDone(key, on){', HELPERS + '\nfunction setDone(key, on, effectiveDay1098){\n const dated1098=effectiveDay1098==null?null:installationDate1098(effectiveDay1098);\n if(effectiveDay1098!=null&&(!on||!dated1098))return false;')
    text = once(text, ''' d.done = !!on; d.done_by = who; d.done_at = now;
 d.done_history = (d.done_history || []).concat([{done: !!on, at: now, by: who}]).slice(-400);''', ''' d.done = !!on; d.done_by = who; d.done_at = dated1098 ? dated1098.at : now;
 delete d.done_date_only;delete d.done_effective_date;delete d.done_recorded_at;
 if(dated1098){d.done_date_only=true;d.done_effective_date=dated1098.effective_date;d.done_recorded_at=now;}
 d.done_history = (d.done_history || []).concat([{done: !!on, at: d.done_at, by: who,...(dated1098?{date_only:true,effective_date:dated1098.effective_date,recorded_at:now}:{})}]).slice(-400);''')
    text = once(text, " done_where: ld ? 'local' : (com && com.done) ? 'committed' : null,", " done_where: ld ? 'local' : (com && com.done) ? 'committed' : null,\n done_date_only:!!((ld?loc:com)||{}).done_date_only,\n done_effective_date:((ld?loc:com)||{}).done_effective_date||null,\n done_recorded_at:((ld?loc:com)||{}).done_recorded_at||null,")
    text = once(text, "const entries=[record,...(Array.isArray(record.history)?record.history:[])];", "const entries=[record,...(Array.isArray(record.history)?record.history:[]),...(Array.isArray(record.done_history)?record.done_history:[]),{at:record.done_at,date_only:record.done_date_only,effective_date:record.done_effective_date}];")
    text = once(text, ' d.done = false; d.done_by = who; d.done_at = now;', ' d.done = false; d.done_by = who; d.done_at = now;\n delete d.done_date_only;delete d.done_effective_date;delete d.done_recorded_at;')
    # Every completion rendering supplies its own record context; midnight alone never proves date-only.
    text = replace_count(text, 'fmtStamp(d.done_at)', 'fmtStamp(d.done_at,d)', 3)
    text = once(text, "if(h.recorded_at)event.recorded_at=h.recorded_at;events.set", "if(h.recorded_at)event.recorded_at=h.recorded_at;Object.assign(event,installationMeta1098(h));events.set")
    text = once(text, "},winner.recorded_at?{recorded_at:winner.recorded_at}:{});", "},winner.recorded_at?{recorded_at:winner.recorded_at}:{},installationMeta1098(winner));")
    text = once(text, 'function timeline841WriteProof(key,stage,by){', 'function timeline841WriteProof(key,stage,by,effectiveDay1098){\n const dated1098=effectiveDay1098==null?null:installationDate1098(effectiveDay1098);')
    text = once(text, 'd.timeline841=timeline841MergeProof({stage,at,by,recorded_at:new Date().toISOString(),history:(old&&old.history)||[]},old);', 'd.timeline841=timeline841MergeProof({stage,at:dated1098?dated1098.at:at,by,recorded_at:new Date().toISOString(),...installationMeta1098(dated1098),history:(old&&old.history)||[]},old);')
    text = once(text, 'function timeline841Set(key,stage){', 'function timeline841Set(key,stage,effectiveDay1098){\n if(effectiveDay1098!=null&&(![4,5].includes(stage)||!installationDate1098(effectiveDay1098)))return false;')
    text = once(text, 'return setDone(key,true);}', 'return setDone(key,true,effectiveDay1098);}')
    text = once(text, 'timeline841WriteProof(key,stage,who);bump();flash', 'timeline841WriteProof(key,stage,who,effectiveDay1098);bump();flash')
    text = once(text, 'Date.parse(p.at)>=Date.parse(d.set_at)', 'Date.parse(p.date_only?p.recorded_at||p.at:p.at)>=Date.parse(d.set_at)')
    text = once(text, "+' '+p.by+' · '+(p.recorded_at||p.at);", "+' '+p.by+' · '+(p.date_only?p.at:p.recorded_at||p.at);")
    text = once(text, 'v.why=v.why.replace(p.recorded_at||p.at,fmtStamp(p.recorded_at||p.at));', 'v.why=v.why.replace(p.date_only?p.at:p.recorded_at||p.at,fmtStamp(p.date_only?p.at:p.recorded_at||p.at,p));')
    text = once(text, 'who(proof.by, proof.recorded_at || proof.at)', 'who(proof.by, proof.date_only ? proof.at : proof.recorded_at || proof.at,proof)')
    text = once(text, 'who(d.done_by, d.done_at)', 'who(d.done_by, d.done_at,d)')
    # A completion proves on-site-by that day; it does not establish the arrival instant.
    text = once(text, 'const lastLvl = historyLast1066(key, \'levelled_history\', cut);', '''const doneContext1098=lastDone||{at:d.done_at,date_only:d.done_date_only,effective_date:d.done_effective_date,recorded_at:d.done_recorded_at};
 const byCompletion1098=done&&state!=='on site'&&doneContext1098.date_only===true;
 if(byCompletion1098){state='on site';recorded=true;}
const lastLvl = historyLast1066(key, 'levelled_history', cut);''')
    text = once(text, " by: last ? (last.by || null) : recorded ? d.by : null, set_at: last ? last.at : recorded ? d.set_at : null,", " by: byCompletion1098?(lastDone?.by||d.done_by):last ? (last.by || null) : recorded ? d.by : null, set_at: byCompletion1098?null:last ? last.at : recorded ? d.set_at : null,\n ...(byCompletion1098?{state_basis:'completion',arrival_time_unknown:true}:{}),")
    text = replace_count(text, ' done, done_by: lastDone ? (lastDone.by || null) : done ? d.done_by : null, done_at: lastDone ? lastDone.at : done ? d.done_at : null,\n levelled,', ' done, done_by: lastDone ? (lastDone.by || null) : done ? d.done_by : null, done_at: lastDone ? lastDone.at : done ? d.done_at : null,\n done_date_only:!!doneContext1098.date_only,done_effective_date:doneContext1098.effective_date||null,done_recorded_at:doneContext1098.recorded_at||null,\n levelled,', 2)
    text = once(text, "fmtStamp(h.recorded_at||h.at):(h.recorded_at||h.at)", "fmtStamp(h.date_only?h.at:h.recorded_at||h.at,h):(h.date_only?h.effective_date:h.recorded_at||h.at)")
    text = once(text, "hist.push({at: d.done_at, what: 'Ticked complete', by: d.done_by, c: 'green'});", "hist.push({at: d.done_at, what: 'Ticked complete', by: d.done_by, c: 'green',date_only:d.done_date_only,effective_date:d.done_effective_date,recorded_at:d.done_recorded_at});")
    text = once(text, "bits.push(t ? 'Installed tick ' + hm(t) : 'Site record at the day’s close');", "const dateOnly=t&&hist(a,'done_history').find(h=>h.at===t&&h.date_only&&h.effective_date===iso);bits.push(t ? (dateOnly?'Installed '+dmy(iso)+' (time not recorded)':'Installed tick '+hm(t)) : 'Site record at the day’s close');")
    text = once(text, "complete.push({key: a.key, at: last.at, by: last.by || null});", "complete.push({key: a.key, at: last.at, by: last.by || null,...installationMeta1098(last)});")
    text = once(text, "complete.push({key: a.key, at: r.done_at, by: r.done_by || null});", "complete.push({key: a.key, at: r.done_at, by: r.done_by || null,...installationMeta1098({date_only:r.done_date_only,effective_date:r.done_effective_date})});")
    for side in ('a', 'b'):
        old = '{done: '+side+'.done, done_by: '+side+'.done_by, done_at: '+side+'.done_at}'
        new = old[:-1] + ',...('+side+'.done_date_only?{done_date_only:true,done_effective_date:'+side+'.done_effective_date,done_recorded_at:'+side+'.done_recorded_at}:{})}'
        text = once(text, old, new)
    text = once(text, "da, a.done_at, db, b.done_at, 'delivery'", "da, a.done_recorded_at||a.done_at, db, b.done_recorded_at||b.done_at, 'delivery'")
    text = once(text, "hist(a.done_history, b.done_history, h => h.done + '|' + h.at)", "hist(a.done_history, b.done_history, h => h.done + '|' + h.at + '|' + (h.recorded_at||''))")
    text = once(text, 'function badgeHtml(f){', "function milestoneWhen1098(f){return f.last&&f.last.date_only?dmy(f.last.effective_date)+' (time not recorded)':dmyhm(f.reachedAt); }\nfunction badgeHtml(f){")
    text = replace_count(text, 'esc(dmyhm(f.reachedAt))', 'esc(milestoneWhen1098(f))', 3)
    text = once(text, "esc(milestoneWhen1098(f)) + ' AEST with '", "esc(milestoneWhen1098(f)) + (f.last&&f.last.date_only?' with ':' AEST with ')")
    return text


if __name__ == '__main__':
    import sys
    source, dest = map(Path, sys.argv[1:])
    dest.write_text(patch(source.read_text()), encoding='utf-8')
