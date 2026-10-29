"""Author: Andrew Fisher. Bounded non-VMS progress-reader replacements."""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


def apply(text):
    if 'Progress achievement is separate from current physical availability.' in text:
        raise ValueError('v12.59 completion achievement is already installed')
    path = 'base.html'
    def change(old, new, label):
        nonlocal text
        if text.count(old) != 1:
            raise ValueError(label + ': expected one exact source anchor, found ' + str(text.count(old)))
        text = text.replace(old, rep(old, old, new, label, path, True), 1)

    source = Path(__file__).with_name('completion1259_src.js').read_text(encoding='utf-8').rstrip()
    change('const DATA =', source + '\n\nconst DATA =',
           'install read-only completion achievement')
    change("const d = deliveryAsOf(a.key, day);\n      const shorts = typeof shortOf === 'function' ? shortOf(a) : [];",
           "const d = CompletionAchievement1259.delivery(a.key, day, deliveryAsOf(a.key, day));\n      const shorts = typeof shortOf === 'function' ? shortOf(a) : [];",
           'headline completion achievement')
    change("status, detail, levelled: !!d.levelled, steps: !!d.steps, ...(split900r ? {split900: split900r.row} : {})});",
           "status: CompletionAchievement1259.words(a.key, day, complete, status), detail, levelled: !!d.levelled, steps: !!d.steps, ...(split900r ? {split900: split900r.row} : {})});",
           'headline completion departure wording')
    change("const split900g = typeof split900 === 'function' ? split900(r.a, r.d, r.cls) : null; /* v9.05 */\nconst shorts = typeof shortOf === 'function' ? shortOf(r.a) : [];",
           "const achieved1259 = CompletionAchievement1259.delivery(r.a.key, day, r.d);\n      const split900g = typeof split900 === 'function' ? split900(r.a, achieved1259, r.cls) : null; /* v12.59: achievement only */\nconst shorts = typeof shortOf === 'function' ? shortOf(r.a) : [];",
           'type group achievement scope')
    change("const matchedShort = !!r.d.done && shorts.some(s => s.item === item);",
           "const matchedShort = !!achieved1259.done && shorts.some(s => s.item === item);",
           'type group shortage evidence')
    change("const toilet962 = name==='Toilets & amenities' ? toiletItem962(r.a,item,r.d,day,r.onBy.get(item)||0) : null;",
           "const toilet962 = name==='Toilets & amenities' ? toiletItem962(r.a,item,achieved1259,day,r.onBy.get(item)||0) : null;",
           'type group item installation evidence')
    change("const conflict = toilet962 ? toilet962.conflict : matchedShort || !!r.d.done && main && main.recordedComplete && !main.complete;",
           "const conflict = toilet962 ? toilet962.conflict : matchedShort || !!achieved1259.done && main && main.recordedComplete && !main.complete;",
           'type group completion conflict')
    change("type.completionKnown = type.completionKnown && physicalUnitKnown && !conflict && (!r.d.done || known);\n          if (toilet962) type.knownComplete += toilet962.done;\n          else if (r.d.done && !conflict) type.knownComplete += Math.max(0, quantity - (split900g && split900g.items.get(item) || 0));",
           "type.completionKnown = type.completionKnown && physicalUnitKnown && !conflict && (!achieved1259.done || known);\n          if (toilet962) type.knownComplete += toilet962.done;\n          else if (achieved1259.done && !conflict) type.knownComplete += Math.max(0, quantity - (split900g && split900g.items.get(item) || 0));",
           'type group completed quantity')
    change("const d = native.d || {}, recordedComplete = !!d.done;",
           "const d = CompletionAchievement1259.delivery(key, day, native.d || {}), recordedComplete = !!d.done;",
           'type rows achievement')
    change("status, issues: rowIssues});",
           "status: CompletionAchievement1259.words(key, day, complete, status), issues: rowIssues});",
           'type rows completion departure wording')
    change("const d = native.d || {};\n      const onSite = row.arrived962!=null && row.quantity!=null ? row.arrived962>=row.quantity : !!d.done || !!(d.recorded && d.state === 'on site' && d.where !== 'rental');",
           "const d = native.d || {}, achieved1259 = CompletionAchievement1259.delivery(row.key, day, d);\n      const onSite = row.arrived962!=null && row.quantity!=null ? row.arrived962>=row.quantity : !!achieved1259.done || !!(d.recorded && d.state === 'on site' && d.where !== 'rental');",
           'arrival plan retains completed attainment')
    change("if (d.recorded && d.state === 'on site' && d.where === 'rental' && !d.done) plan.rentalOnlyRefs.push(row.key);",
           "if (d.recorded && d.state === 'on site' && d.where === 'rental' && !achieved1259.done) plan.rentalOnlyRefs.push(row.key);",
           'arrival plan excludes completed rental-only warning')
    change("const TC = tradeCharges();\n const seen = new Set(DSN_GROUPS.map(g => g.disc));",
           "const TC = tradeCharges();\n const typeRows1259 = new Map();\n for(const type1259 of todayTypeMetrics843(asOf).instruments || []) for(const row1259 of type1259.rows || []) typeRows1259.set(JSON.stringify([row1259.key,type1259.name]),row1259);\n const nativeRows1259=new Map(rows.map(r=>[r.a.key,r]));\n for(const alias1259 of physicalCountAssets963(rows.map(r=>r.a)).aliases){\n  const native1259=nativeRows1259.get(alias1259.ref),source1259=typeRows1259.get(JSON.stringify([alias1259.source,alias1259.item]));\n  if(!native1259||!source1259)continue;\n  const d1259=CompletionAchievement1259.delivery(alias1259.ref,asOf,native1259.d),lines1259=native1259.cls.filter(l=>l.item===alias1259.item),quantities1259=lines1259.map(qtyOf);\n  const quantity1259=quantities1259.length===1?quantities1259[0]:null,split1259=split900(native1259.a,d1259,lines1259);\n  const reading1259=CompletionAchievement1259.aliasRow(alias1259,source1259,{item:alias1259.item,quantity:quantity1259,included:CompletionScope1098.includes(native1259.a),done:d1259.done,conflict:shortOf(native1259.a).some(s=>s.item===alias1259.item),held:split1259?.items.get(alias1259.item)||0});\n  if(reading1259)typeRows1259.set(JSON.stringify([alias1259.ref,alias1259.item]),reading1259);\n }\n const seen = new Set(DSN_GROUPS.map(g => g.disc));",
           'group cards use shared completion type rows')
    change("/* by type: on site over asked for, in the schedule's own words for the item */\n const byType = new Map();\n placed.forEach(r => { r.askedBy.forEach((v, t) => { const x = byType.get(t) || {asked: 0, on: 0, noqty: 0}; x.asked += v; byType.set(t, x); });\n r.cls.forEach(l => { const x = byType.get(l.item) || {asked: 0, on: 0, noqty: 0}; if (l.quantity == null) x.noqty++; x.on += r.onBy.get(l.item) || 0; byType.set(l.item, x); }); });\n const types = [...byType.entries()].sort((a, b) => b[1].asked - a[1].asked || a[0].localeCompare(b[0]));\n if (V1076 && types.length === 1) types[0] = [types[0][0], {asked: V1076.total, on: V1076.on, noqty: 0}];",
           "/* v12.59: reuse the type instruments' completion, scope and quantity safeguards. */\n const byType = new Map(), achieved1259 = new Map();\n placed.forEach(r => {\n  achieved1259.set(r.a.key, {done:CompletionAchievement1259.referenceComplete([...r.askedBy.keys()].map(t=>typeRows1259.get(JSON.stringify([r.a.key,t]))))});\n  r.askedBy.forEach((v, t) => {\n   const x = byType.get(t) || {asked:0,on:0,done:0,known:true,noqty:0};\n   const reading = typeRows1259.get(JSON.stringify([r.a.key,t]));\n   x.asked += v; x.on += r.onBy.get(t)||0; x.known = x.known && reading?.done != null && reading.quantity != null && !reading.conflict; x.done += reading?.done||0;\n   x.noqty += r.cls.filter(l=>l.item===t&&l.quantity==null).length; byType.set(t,x);\n  });\n });\n const types = [...byType.entries()].sort((a, b) => b[1].asked - a[1].asked || a[0].localeCompare(b[0]));\n if (V1076 && types.length === 1) types[0] = [types[0][0], {asked: V1076.total, on: V1076.on, done: V1076.done, known:true, noqty: 0}];\n const achievementKnown1259=types.length>0&&types.every(([,v])=>v.known),doneUnits1259=V1076?V1076.done:types.reduce((sum,[,v])=>sum+v.done,0);",
           'group cards completed type quantities')
    change("const due = V1076 ? V1076.due : cnt(placed.filter(r => r.due)), over = V1076 ? V1076.overdue : cnt(placed.filter(r => r.overdue)), norec = V1076 ? V1076.norecord : cnt(placed.filter(r => r.norecord)), next = V1076 ? V1076.next : cnt(placed.filter(r => r.next));",
           "const due = V1076 ? V1076.due : cnt(placed.filter(r => r.due)), over = V1076 ? V1076.overdue : cnt(placed.filter(r => r.overdue && !achieved1259.get(r.a.key)?.done)), norec = V1076 ? V1076.norecord : cnt(placed.filter(r => r.norecord && !achieved1259.get(r.a.key)?.done)), next = V1076 ? V1076.next : cnt(placed.filter(r => r.next && !achieved1259.get(r.a.key)?.done));",
           'group cards retain met arrival plan')
    change("const stateCls = onUnits >= asked && asked ? 'full' : onUnits ? 'part' : 'none';",
           "const stateCls = achievementKnown1259 && doneUnits1259 >= asked && asked ? 'full' : doneUnits1259 ? 'part' : 'none';",
           'group cards achievement state')
    change("<div class=\"n\">${esc(fmtNum(onUnits))}<small> ${['of', fmtNum(asked), word(asked), 'on site'].filter(Boolean).map(esc).join(' ')}</small></div>",
           "<div class=\"n\">${achievementKnown1259 ? esc(fmtNum(doneUnits1259)) : '—'}<small> ${['of', fmtNum(asked), word(asked), 'completed'].filter(Boolean).map(esc).join(' ')}</small></div>",
           'group cards completed headline')
    change("''}${gauge(onUnits, asked, onUnits ? [fmtNum(onUnits), word(onUnits), 'on site'].filter(Boolean).map(esc).join(' ') : 'None recorded on site', null)}",
           "''}${achievementKnown1259 ? gauge(doneUnits1259, asked, doneUnits1259 ? [fmtNum(doneUnits1259), word(doneUnits1259), 'completed'].filter(Boolean).map(esc).join(' ') : 'No completion recorded', null) : '<p class=\"note\">Completion quantity to confirm</p>'}",
           'group cards completed gauge')
    change("<th>By type</th><th>on site</th><th>in total</th>",
           "<th>By type</th><th>completed</th><th>in total</th>",
           'group cards completed column')
    change("types.map(([t, v]) => `<tr><td>${esc(t)}</td><td>${esc(fmtNum(v.on))}</td><td>${esc(fmtNum(v.asked))}</td></tr>`).join('')",
           "types.map(([t, v]) => `<tr><td>${esc(t)}</td><td>${v.known ? esc(fmtNum(v.done)) : '—'}</td><td>${esc(fmtNum(v.asked))}</td></tr>`).join('')",
           'group cards completed type values')
    change("<span>Due by this day</span>${cell(due)}\n ${over ? `<span class=\"bad\">Overdue</span>${cell(over)}` : ''}",
           "<span>On site / on hire</span>${cell(onUnits)}\n <span>Due by this day</span>${cell(due)}\n ${over ? `<span class=\"bad\">Overdue</span>${cell(over)}` : ''}",
           'group cards physical stock stays separate')
    change("${cell(V1076 ? V1076.nextNotOn : cnt(placed.filter(r => r.next && !r.on)))}",
           "${cell(V1076 ? V1076.nextNotOn : cnt(placed.filter(r => r.next && !r.on && !achieved1259.get(r.a.key)?.done)))}",
           'group cards completed scope not coming again')
    change("By group <span>what is on site over the total ${X.rw1163 ? 'booked by race weekend' : 'on the job'}, as at",
           "By group <span>completed work over the total ${X.rw1163 ? 'booked by race weekend' : 'on the job'}, as at",
           'group cards achievement basis')
    return text
