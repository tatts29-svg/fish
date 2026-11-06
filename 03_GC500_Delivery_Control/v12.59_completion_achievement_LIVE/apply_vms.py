"""Author: Andrew Fisher. Dated VMS achievement, separate from physical presence."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def change(text, old, new, what, path):
    count = text.count(old)
    if count != 1:
        raise ValueError(f'{what}: expected one exact anchor, found {count}')
    # rep() includes preceding horizontal whitespace in its first-line match.
    # Keep exactly those existing bytes in the small anchor before replacing.
    index = text.index(old)
    start = index
    while start > 0 and text[start - 1] in ' \t':
        start -= 1
    old = text[start:index] + old
    return text.replace(old, rep(old, old, new, what, path), 1)


def apply(text):
    path = 'VMS achievement v12.59'
    if 'function completionProgress1259(' in text:
        raise ValueError('VMS achievement v12.59 already applied')

    text = change(text, "function prepare(patch,who,now,old,shared,confirmedStatus){", """/* Author: Andrew Fisher. Only a corroborated automatic off-site reset is a
   physical transition. Explicit completion corrections and not-confirmed
   corrections retain their native dated meaning. The writer is unchanged. */
function completionProgress1259(record,day){
 const events=record?.completionEvents1101||(record?.completion1101?[record.completion1101]:[]);
 const arrivals=record?.events1098||(record?.arrival1098?[{...record.arrival1098,inPlace:record.inPlace}]:[]);
 const filtered=events.filter(c=>!(c&&c.done===false&&Number.isSafeInteger(c.sequence1101)&&c.sequence1101>0&&arrivals.some(a=>a&&a.state==='off site'&&validDay(a.effective_date)&&a.effective_date<=day&&a.by===c.by&&a.recorded_at===c.recorded_at&&a.sequence1101===c.sequence1101)));
 return completion({completionEvents1101:filtered},day);
}
function prepare(patch,who,now,old,shared,confirmedStatus){""", 'separate VMS completion history reader', path)

    text = change(text,
        "const e=evidence(r.record,day),saved=completion(r.record,day),here=e&&e.on!==null?e.on:!!r.on,finished=here&&(e?.inPlace===false?false:saved?saved.done:!!r.done),installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed)||!e&&!!r.done);",
        "const e=evidence(r.record,day),nativeSaved1259=completion(r.record,day),saved=completionProgress1259(r.record,day),here=e&&e.on!==null?e.on:!!r.on,finished=e?.state==='not confirmed'?false:saved?saved.done:!!r.done;\n  const nativeDone1259=Object.prototype.hasOwnProperty.call(r,'nativeDone1259')?r.nativeDone1259:r.done,nativeFinished1259=here&&(e?.inPlace===false?false:nativeSaved1259?nativeSaved1259.done:!!nativeDone1259),installed=here&&(e?.inPlace===false?false:nativeFinished1259||!!(e&&e.installed)||!e&&!!nativeDone1259);",
        'VMS achievement does not require current presence', path)
    text = change(text,
        "c.boards.push({...r,beforeNativeOn:!!r.on,on:here,done:finished,installed,evidence:e,completion:saved});",
        "const {nativeDone1259:physicalDone1259,...publicRow1259}=r;\n  c.boards.push({...publicRow1259,beforeNativeOn:!!r.on,on:here,done:finished,installed,evidence:e,completion:saved});",
        'keep the physical preservation input internal', path)
    text = change(text,
        "if((!e||!here)&&r.phase==='overdue')c.overdue++;\n  if((!e||!here)&&(r.phase==='no record'||!r.delivery&&r.due&&r.due<=day))c.norecord++;\n  if(r.phase==='next'||!r.delivery&&r.due&&r.due>day&&r.due<=soon){c.next++;if(!here)c.nextNotOn++;}\n  if(!here){",
        "if(!finished&&(!e||!here)&&r.phase==='overdue')c.overdue++;\n  if(!finished&&(!e||!here)&&(r.phase==='no record'||!r.delivery&&r.due&&r.due<=day))c.norecord++;\n  if(r.phase==='next'||!r.delivery&&r.due&&r.due>day&&r.due<=soon){c.next++;if(!here&&!finished)c.nextNotOn++;}\n  if(!here&&!finished){",
        'completed VMS boards are not missing arrivals', path)
    text = change(text,
        "const row=(rows||[]).find(r=>r&&r.key===t),finished=!here?0:row?(row.complete?list.length:Math.min(list.length,Number(row.done)||0)):(d.done?list.length:0);",
        "const achievement1259=t?root.CompletionAchievement1259.delivery(t,day,d):d;\n  const row=(rows||[]).find(r=>r&&r.key===t),finished=row?(row.complete?list.length:Math.min(list.length,Number(row.done)||0)):(achievement1259.done?list.length:0),nativeFinished1259=!here||!d.done?0:row?(row.complete?list.length:Math.min(list.length,Number(row.done)||0)):list.length;",
        'linked delivery completion uses achievement history', path)
    text = change(text,
        "phase:st?.inPhase||null,on:here,done:i<finished,record:recordFor(b.key)}));",
        "phase:st?.inPhase||null,on:here,done:i<finished,nativeDone1259:i<nativeFinished1259,record:recordFor(b.key)}));",
        'retain the original physical installation input', path)
    text = change(text,
        "return event?{...b,on:false,done:false,installed:false,received:true,state:'not on site',departure1211:{label:'Left site',at:stamp(event)}}:b;",
        "return event?{...b,on:false,installed:false,received:true,state:'not on site',departure1211:{label:'Left site',at:stamp(event)}}:b;",
        'departure preserves achieved VMS completion', path)
    text = change(text,
        "const on=!!status.on,done=on&&!!status.done,installed=on&&!!status.installed;",
        "const on=!!status.on,done=!!status.done,installed=on&&!!status.installed;",
        'physical VMS projection keeps completion separate', path)
    text = change(text,
        "board.departure1211=status.departure1211||null;board.status=status.departure1211?'Left site · '+status.departure1211.at:done?'Complete':installed?'Installed · completion not recorded':on?'On site · installation not recorded':board.received?'Off site · received previously':'Still to come';",
        "board.departure1211=status.departure1211||null;board.status=status.departure1211?(done?'Completed · left site ':'Left site · ')+status.departure1211.at:done?'Complete':installed?'Installed · completion not recorded':on?'On site · installation not recorded':board.received?'Off site · received previously':'Still to come';",
        'completed departure wording', path)
    text = change(text,
        "m=m||model(day);day=m.day;const due=m.boards.filter(b=>dayValid(b.due)&&b.due<=day),early=m.boards.filter(b=>b.on&&dayValid(b.due)&&b.due>day),late=due.filter(b=>!b.on),undated=m.boards.filter(b=>!dayValid(b.due));",
        "m=m||model(day);day=m.day;const due=m.boards.filter(b=>dayValid(b.due)&&b.due<=day),early=m.boards.filter(b=>b.on&&dayValid(b.due)&&b.due>day),late=due.filter(b=>!b.on&&!b.done),undated=m.boards.filter(b=>!dayValid(b.due)),departed1259=due.filter(b=>b.done&&b.departure1211);",
        'completed departures do not miss the arrival plan', path)
    text = change(text,
        "label:undated.length?'Some board arrival dates are unconfirmed':late.length?late.length+' due board'+(late.length===1?' is':'s are')+' not on site':'Due boards are on site',",
        "label:undated.length?'Some board arrival dates are unconfirmed':late.length?late.length+' due board'+(late.length===1?' is':'s are')+' not on site':departed1259.length?'Due board arrival plan met · '+departed1259.length+' completed and left site':'Due boards are on site',",
        'separate completed departures from missing due boards', path)
    text = change(text,
        "issues:undated.length?[undated.length+' physical board arrival date(s) are unconfirmed.']:[]};",
        "issues:(undated.length?[undated.length+' physical board arrival date(s) are unconfirmed.']:[]).concat(departed1259.map(b=>b.name+': completed · left site '+b.departure1211.at+'.'))};",
        'dated completed-departure plan detail', path)
    text = change(text,
        "area.notes.push('Counted by VMS number on the VMS register: ' + vms1076.total + ' boards · ' + vms1076.on + ' turned up · ' + (vms1076.total - vms1076.on) + ' still to come'",
        "area.notes.push('Counted by VMS number on the VMS register: ' + vms1076.total + ' boards · ' + vms1076.done + ' complete · ' + vms1076.on + ' on site · ' + vms1076.toCome.length + ' still to come'",
        'VMS summary distinguishes onsite and completion', path)
    return text
