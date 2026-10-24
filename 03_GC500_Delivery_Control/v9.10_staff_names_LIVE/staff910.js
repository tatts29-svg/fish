/* Author: Andrew Fisher. Exact-day staff names in the existing Crew form; no attendance or cost writes. */
const StaffNames910 = (() => {
  'use strict';
  const ROLE_KEYS = ['spotter', 'forklift', 'installer', 'escort'];
  const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const nameKey = value => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-AU');
  const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
  const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const placeholder = row => row.placeholder === true || row.group === true || Number(row.headcount) > 1 || /^(?:fencing\s+crew\b|night\s+person\b|(?:installation|installer|labour|site)\s+(?:crew|team|group)\b|(?:crew|team|group|staff|labour|installers?|persons?|workers?|tba|tbc|unknown|unnamed)(?:\s|$)|\d+\s*(?:x\s*)?(?:people|persons|workers|installers|crew)\b)/i.test(String(row.person || '').trim());
  function rosterFromRows(day, rows, helpers) {
    if (!validDay(day)) return [];
    const names = new Map();
    for (const row of rows || []) {
      if (row.kind !== 'labour' || row.date !== day || row.usable !== true || !helpers.includes(row) || placeholder(row)) continue;
      const name = String(row.person || '').trim(), paid = helpers.hours(row), worked = helpers.worked(row);
      if (!name || !Number.isFinite(paid) || paid <= 0 || !Number.isFinite(worked) || worked <= 0 || worked > 24) continue;
      const key = nameKey(name), person = names.get(key) || {key, name, windows: [], timeUnknown: false, sourceIds: []};
      person.sourceIds.push(String(row.id || ''));
      if (validTime(row.start) && validTime(row.finish) && row.start !== row.finish) {
        const window = {start: row.start, finish: row.finish, overnight: row.finish < row.start};
        if (!person.windows.some(w => JSON.stringify(w) === JSON.stringify(window))) person.windows.push(window);
      } else person.timeUnknown = true;
      names.set(key, person);
    }
    return [...names.values()];
  }
  function mappingForRecord(record) {
    return JSON.stringify({present: record != null, count: record == null ? null : record.count, names: record == null ? [] : record.names});
  }
  function planSignature(plan) {
    return JSON.stringify({order: plan.order == null ? null : plan.order, people: plan.people || [], start: plan.start || '', finish: plan.finish || '', location: plan.location || ''});
  }
  function buildDay(day, record, plans, roster) {
    const present = record != null, saved = present ? copy(record) : {count: null, names: []};
    const names = Array.isArray(saved.names) ? saved.names : [], used = new Map(), candidates = new Map(roster.map(p => [p.key, p]));
    for (const plan of plans || []) if (plan && plan.day === day && plan.ref && Array.isArray(plan.people)) {
      for (const person of plan.people) if (Number.isInteger(person.slot) && person.slot >= 1 && person.slot <= 50) {
        const refs = used.get(person.slot) || []; if (!refs.includes(plan.ref)) refs.push(plan.ref); used.set(person.slot, refs);
      }
    }
    const highestUsed = Math.max(0, ...used.keys()), size = Math.min(50, Math.max(Number.isInteger(saved.count) ? saved.count : 0, names.length, highestUsed));
    const slots = Array.from({length: size}, (_, i) => {
      const name = names[i] || '', source = candidates.get(nameKey(name));
      return {slot: i + 1, name, refs: used.get(i + 1) || [], rostered: !!source, window: source || null, outsideCount: Number.isInteger(saved.count) && i >= saved.count};
    });
    return {day, present, count: saved.count, names: copy(names), record: saved, roster: copy(roster), slots, highestUsed,
      mappingToken: mappingForRecord(record), unknownAvailability: !present || saved.count === null,
      canUseRoster: !present && !highestUsed && roster.length > 0 && roster.length <= 50};
  }
  function validateDayValues(model, value, expectedToken) {
    if (!validDay(model.day)) return 'Choose a valid day.';
    if (expectedToken !== model.mappingToken) return 'Day availability changed. Reload the saved plan before changing names.';
    if (!value || value.count !== null && (!Number.isInteger(value.count) || value.count < 0 || value.count > 50)) return 'Number available must be blank or between 0 and 50.';
    if (!Array.isArray(value.names) || value.names.some(n => typeof n !== 'string' || n.length > 100 || /[\r\n]/.test(n))) return 'Enter one name of up to 100 characters per person.';
    const named = new Map(); value.names.forEach((name, i) => { const key = nameKey(name); if (key) named.set(key, (named.get(key) || []).concat(i)); });
    for (const [key, positions] of named) if (positions.length > 1 && positions.some(i => nameKey(model.names[i]) !== key)) return 'That name already has a person number. Use their existing number.';
    if (value.count === null && value.names.some(nameKey)) return 'Set the number available before saving names.';
    if (value.count === null && model.count !== null && (model.highestUsed || model.names.some(nameKey))) return 'Keep the person numbers used by saved names or tasks. Review those assignments before clearing availability.';
    if (value.count !== null && (value.names.slice(value.count).some(nameKey) || model.names.slice(value.count).some(nameKey))) return 'The lower count would remove a saved name. Review those person numbers first.';
    if (value.count !== null && value.count !== model.count && model.highestUsed > value.count) return 'Saved tasks use a higher person number. Review those assignments before reducing availability.';
    return '';
  }
  function validatePlanValues(model, value, currentPlan, expectedMapping, expectedPlan) {
    if (expectedMapping !== model.mappingToken || expectedPlan !== planSignature(currentPlan)) return 'The day names or crew plan changed. Reload the saved plan before assigning people.';
    if (!value || value.order != null && (!Number.isInteger(value.order) || value.order < 1 || value.order > 200) || !Array.isArray(value.people) || value.people.length > 20) return 'Check the planned order and person rows.';
    const time = v => v === '' || validTime(v);
    if (!time(value.start) || !time(value.finish) || !!value.start !== !!value.finish || value.start && value.finish <= value.start) return 'Set both unloading times, with finish after start, or leave both blank.';
    const used = new Set(), named = new Map(), previousSlots = new Set((currentPlan.people || []).map(p => p.slot).filter(Number.isInteger));
    for (const person of value.people) {
      if (!person || !Array.isArray(person.roles) || !person.roles.length || person.roles.some(r => !ROLE_KEYS.includes(r))) return 'Choose at least one role for each person.';
      if (person.slot === null) continue;
      if (!Number.isInteger(person.slot) || person.slot < 1 || person.slot > 50) return 'Choose a valid person number.';
      if (used.has(person.slot)) return 'Choose each person once and tick all their roles on that row.'; used.add(person.slot);
      if (!previousSlots.has(person.slot) && (!Number.isInteger(model.count) || person.slot > model.count)) return 'Set up that person number in day availability first.';
      const key = nameKey(model.names[person.slot - 1]); if (key) named.set(key, (named.get(key) || []).concat(person.slot));
    }
    for (const slots of named.values()) if (slots.length > 1 && slots.some(slot => !previousSlots.has(slot))) return 'The same name is listed under two person numbers. Review day availability before assigning both.';
    return '';
  }
  function roster(day) { return rosterFromRows(day, ourCosts(), {includes: rosterIncludes858, hours: runHours, worked: runWorked}); }
  function day(dayValue) {
    const key = crew883Key(dayValue), record = Object.prototype.hasOwnProperty.call(S.loads || {}, key) ? S.loads[key] : undefined;
    return buildDay(dayValue, record, Object.values(S.loads || {}).filter(p => p && p.kind === 'crew883' && p.day === dayValue && p.ref), roster(dayValue));
  }
  const mappingToken = value => day(value).mappingToken;
  const planToken = (value, ref) => planSignature(crew883Plan(value, ref));
  const windowWords = person => person ? person.windows.map(w => w.start + '–' + w.finish + (w.overnight ? ' next day' : '')).concat(person.timeUnknown ? ['time unknown'] : []).join(' / ') || 'time unknown' : '';
  const equalNames = (a, b) => { const trim = v => { const n = v.slice(); while (n.length && !nameKey(n[n.length - 1])) n.pop(); return n; }; return JSON.stringify(trim(a)) === JSON.stringify(trim(b)); };
  function personOptions(model, selected) {
    const slots = model.slots.slice(); if (Number.isInteger(selected) && !slots.some(s => s.slot === selected)) slots.push({slot: selected, name: '', outsideCount: true});
    return '<option value=""' + (selected === null ? ' selected' : '') + '>To be assigned</option>' + slots.map(slot => {
      const note = slot.outsideCount ? ' · outside saved availability' : slot.name && !slot.rostered ? ' · not on current roster' : '';
      return '<option value="' + slot.slot + '"' + (selected === slot.slot ? ' selected' : '') + '>' + esc((slot.name || 'Person ' + slot.slot + ' · name to confirm') + note) + '</option>';
    }).join('');
  }
  function dayNamesHtml(model, values, can) {
    const count = Number.isInteger(values.count) ? Math.max(0, Math.min(50, values.count)) : 0, disabled = can ? '' : ' disabled';
    const rows = Array.from({length: count}, (_, i) => {
      const name = values.names[i] || '', candidate = model.roster.find(p => p.key === nameKey(name)), refs = (model.slots.find(s => s.slot === i + 1) || {}).refs || [];
      const options = ['<option value=""' + (!name ? ' selected' : '') + '>Name to confirm</option>'];
      if (name && (!candidate || candidate.name !== name)) options.push('<option value="' + esc('name:' + name) + '" selected>' + esc(name) + ' · saved name</option>');
      for (const person of model.roster) {
        const elsewhere = values.names.some((n, j) => j !== i && nameKey(n) === person.key);
        options.push('<option value="' + esc('name:' + person.name) + '"' + (person.name === name ? ' selected' : '') + (elsewhere && person.name !== name ? ' disabled' : '') + '>' + esc(person.name + ' · ' + windowWords(person)) + '</option>');
      }
      options.push('<option value="manual">Enter a name…</option>');
      return '<div class="staff910-name"><label>Person ' + (i + 1) + '<select data-staff910-name-slot="' + (i + 1) + '"' + disabled + '>' + options.join('') + '</select></label>' +
        '<label class="staff910-manual" hidden>Enter name<input type="text" maxlength="100" data-staff910-manual-slot="' + (i + 1) + '" value="' + esc(name) + '"' + disabled + '></label>' +
        (refs.length ? '<small>Used by ' + esc(refs.join(', ')) + '. This name applies to Person ' + (i + 1) + ' across this day.</small>' : '') + '</div>';
    }).join('');
    return '<div class="staff910-names" data-staff910-names>' + rows + (model.canUseRoster && can ? '<button type="button" class="btn" data-staff910-use-roster>Use roster</button>' : '') +
      (!count ? '<p>' + (values.count === 0 ? '0 people available. Change the number deliberately to add people.' : 'Set the number available' + (model.canUseRoster ? ', or use the roster' : '') + ', before naming people.') + '</p>' : '') +
      '<p>Roster names are planned for this date. Leave unknown names blank. Save day availability to use these names below.</p></div>';
  }
  function readDayFields(editor) {
    const count = editor.querySelector('[data-crew883-count]'), names = editor.querySelector('[data-crew883-names]');
    return {count: count.value === '' ? null : Number(count.value), names: names.value === '' ? [] : names.value.split('\n')};
  }
  function captureTask(editor) {
    const value = key => editor.querySelector('[data-crew883-' + key + ']').value;
    return {order: value('order') === '' ? null : Number(value('order')), location: value('location'), start: value('start'), finish: value('finish'),
      people: [...editor.querySelectorAll('[data-crew883-person]')].map(row => ({slot: row.querySelector('[data-crew883-slot]').value === '' ? null : Number(row.querySelector('[data-crew883-slot]').value), roles: [...row.querySelectorAll('[data-crew883-role]:checked')].map(input => input.dataset.crew883Role)}))};
  }
  function currentEditor(dayValue, ref, occurrence = 0) { return [...document.querySelectorAll('.crew883[data-staff910]')].filter(e => e.dataset.crew883Day === dayValue && e.dataset.crew883Ref === ref)[occurrence] || null; }
  function message(editor, text, reload) {
    if (!editor) return; const node = editor.querySelector('[data-staff910-message]'); if (!node) return;
    node.textContent = text; if (reload) { const button = document.createElement('button'); button.type = 'button'; button.className = 'btn'; button.dataset.staff910Reload = ''; button.textContent = 'Reload saved plan'; node.append(' ', button); }
  }
  function setTimeValue(input, value) { if (typeof time907Ensure === 'function') time907Ensure(input, value); input.value = value; }
  function restoreTask(editor, value) {
    for (const key of ['order', 'location']) editor.querySelector('[data-crew883-' + key + ']').value = value[key] == null ? '' : value[key];
    for (const key of ['start', 'finish']) setTimeValue(editor.querySelector('[data-crew883-' + key + ']'), value[key]);
    const can = capability() === 'edit' && !SYNC.readonly;
    editor.querySelector('[data-crew883-people]').innerHTML = value.people.map((p, i) => crew883PersonHtml(editor.dataset.crew883Day, p, i, can)).join('');
  }
  function drawDayNames(editor, values) {
    const model = day(editor.dataset.crew883Day), node = editor.querySelector('[data-staff910-names]');
    if (node) node.outerHTML = dayNamesHtml(model, values, capability() === 'edit' && !SYNC.readonly);
  }
  function writeDayDraft(editor, value) {
    editor.querySelector('[data-crew883-count]').value = value.count === null ? '' : value.count;
    editor.querySelector('[data-crew883-names]').value = value.names.join('\n'); drawDayNames(editor, value);
  }
  function snapshots(origin) {
    const found = new Map();
    return [...document.querySelectorAll('.crew883[data-staff910]')].map(editor => {
      const d = editor.dataset.crew883Day, ref = editor.dataset.crew883Ref, k = d + '/' + ref, occurrence = found.get(k) || 0; found.set(k, occurrence + 1);
      const values = readDayFields(editor), model = day(d), task = captureTask(editor);
      return {day: d, ref, occurrence, origin: editor === origin, task, values, taskDirty: planSignature(task) !== editor.dataset.staff910PlanToken,
        dayDirty: values.count !== model.count || !equalNames(values.names, model.names), mapping: editor.dataset.staff910DayToken, mappingStale: editor.dataset.staff910DayToken !== model.mappingToken, plan: editor.dataset.staff910PlanToken,
        open: editor.open, folds: [...editor.querySelectorAll('details')].map(e => e.open)};
    });
  }
  function restoreSnapshots(saved, operation, accepted) {
    for (const snap of saved) {
      const editor = currentEditor(snap.day, snap.ref, snap.occurrence); if (!editor) continue;
      editor.open = snap.open; [...editor.querySelectorAll('details')].forEach((e, i) => e.open = !!snap.folds[i]);
      const ownPlan = operation.kind === 'plan' && snap.origin && accepted;
      if (!ownPlan && (snap.taskDirty || operation.kind === 'day')) {
        restoreTask(editor, snap.task); editor.dataset.staff910PlanToken = snap.plan;
        editor.dataset.staff910DayToken = operation.kind === 'day' && snap.day === operation.day && accepted && !snap.mappingStale ? mappingToken(snap.day) : snap.mapping;
      }
      if (snap.dayDirty && !(operation.kind === 'day' && snap.origin && accepted)) {
        writeDayDraft(editor, snap.values); editor.dataset.staff910DayToken = snap.mapping;
        if (operation.kind === 'day' && snap.day === operation.day && accepted) message(editor, 'Day availability changed. Your other draft is still here; reload before saving it.', true);
      }
      if (snap.mappingStale) {
        editor.dataset.staff910DayToken = snap.mapping;
        message(editor, 'Day availability changed. Your draft is still here; reload before saving it.', true);
      }
    }
  }
  function nativeSave(operation, origin, fn) {
    const saved = typeof document !== 'undefined' ? snapshots(origin) : []; let accepted = false, reason = '';
    try { accepted = fn() === true; } catch (_) { reason = 'The crew change could not be saved. Check the existing record before retrying.'; }
    const kept = accepted && bump.kept !== false;
    if (typeof document !== 'undefined') restoreSnapshots(saved, operation, accepted);
    return {accepted, kept, reason: kept ? '' : reason || 'The change could not be saved. Your entries remain here; check the unsaved notice and retry.'};
  }
  function saveDay(dayValue, values, expectedMappingToken, originEditor) {
    const model = day(dayValue), reason = validateDayValues(model, values, expectedMappingToken);
    if (reason) return {accepted: false, kept: false, reason};
    return nativeSave({kind: 'day', day: dayValue}, originEditor, () => crew883SaveDay(dayValue, values.count, values.names));
  }
  function savePlan(dayValue, ref, values, expectedMappingToken, expectedPlanToken, originEditor) {
    const model = day(dayValue), current = crew883Plan(dayValue, ref), reason = validatePlanValues(model, values, current, expectedMappingToken, expectedPlanToken);
    if (reason) return {accepted: false, kept: false, reason};
    return nativeSave({kind: 'plan', day: dayValue, ref}, originEditor, () => crew883SavePlan(dayValue, ref, values));
  }
  function refresh(editor) {
    const d = editor.dataset.crew883Day, ref = editor.dataset.crew883Ref, replacement = crew883Editor(assetOf(ref), d); if (!replacement) return null;
    const template = document.createElement('template'); template.innerHTML = replacement; const next = template.content.firstElementChild; editor.replaceWith(next); next.open = true; return next;
  }
  function enhanceEditor(html, asset, dayValue) {
    if (!html) return html; const template = document.createElement('template'); template.innerHTML = html; const editor = template.content.querySelector('.crew883'); if (!editor) return html;
    const d = editor.dataset.crew883Day, ref = editor.dataset.crew883Ref, model = day(d), can = capability() === 'edit' && !SYNC.readonly;
    editor.dataset.staff910 = ''; editor.dataset.staff910DayToken = model.mappingToken; editor.dataset.staff910PlanToken = planToken(d, ref);
    const names = editor.querySelector('[data-crew883-names]'), availability = names && names.closest('details');
    if (names && availability) {
      availability.dataset.staff910Availability = ''; names.closest('label').hidden = true;
      names.closest('label').insertAdjacentHTML('afterend', dayNamesHtml(model, {count: model.count, names: model.names}, can));
    }
    const note = document.createElement('div'); note.dataset.staff910Message = ''; note.className = 'staff910-message'; note.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite'); editor.querySelector('.crew883-body').append(note);
    return template.innerHTML;
  }
  function install() {
    const personBefore910 = crew883PersonHtml;
    crew883PersonHtml = function (dayValue, person, index, can) {
      const template = document.createElement('template'); template.innerHTML = personBefore910(dayValue, person, index, can); const select = template.content.querySelector('[data-crew883-slot]');
      if (select) select.innerHTML = personOptions(day(dayValue), person.slot); return template.innerHTML;
    };
    const editorBefore910 = crew883Editor;
    crew883Editor = function (...args) { return enhanceEditor(editorBefore910.apply(this, args), ...args); };
    document.addEventListener('change', event => {
      const input = event.target, editor = input.closest && input.closest('.crew883[data-staff910]'); if (!editor) return;
      if (input.matches('[data-crew883-count]')) { drawDayNames(editor, readDayFields(editor)); return; }
      if (input.matches('[data-staff910-name-slot]')) {
        const slot = Number(input.dataset.staff910NameSlot), field = editor.querySelector('[data-staff910-manual-slot="' + slot + '"]');
        if (input.value === 'manual') { field.closest('label').hidden = false; field.focus(); return; }
        const values = readDayFields(editor); while (values.names.length < slot) values.names.push(''); values.names[slot - 1] = input.value.startsWith('name:') ? input.value.slice(5) : '';
        editor.querySelector('[data-crew883-names]').value = values.names.join('\n'); drawDayNames(editor, values);
      }
    });
    document.addEventListener('input', event => {
      const input = event.target; if (!input.matches || !input.matches('[data-staff910-manual-slot]')) return; const editor = input.closest('.crew883[data-staff910]'), slot = Number(input.dataset.staff910ManualSlot), values = readDayFields(editor);
      while (values.names.length < slot) values.names.push(''); values.names[slot - 1] = input.value; editor.querySelector('[data-crew883-names]').value = values.names.join('\n');
    });
    document.addEventListener('click', event => {
      const button = event.target.closest && event.target.closest('[data-crew883-day-save],[data-crew883-save],[data-staff910-use-roster],[data-staff910-reload]'), editor = button && button.closest('.crew883[data-staff910]'); if (!editor) return;
      event.preventDefault(); event.stopImmediatePropagation(); const d = editor.dataset.crew883Day, ref = editor.dataset.crew883Ref;
      if (button.hasAttribute('data-staff910-reload')) { refresh(editor); return; }
      if (!mayWrite('crew planning')) return;
      if (button.hasAttribute('data-staff910-use-roster')) {
        const model = day(d); if (!model.canUseRoster || editor.dataset.staff910DayToken !== model.mappingToken) { message(editor, 'Keep the saved person numbers. Name them individually, or reload the saved plan.', true); return; }
        writeDayDraft(editor, {count: model.roster.length, names: model.roster.map(p => p.name)}); message(editor, 'Roster names are ready. Save day availability to use them for tasks.'); return;
      }
      const occurrence = [...document.querySelectorAll('.crew883[data-staff910]')].filter(e => e.dataset.crew883Day === d && e.dataset.crew883Ref === ref).indexOf(editor), isDay = button.hasAttribute('data-crew883-day-save');
      const result = isDay ? saveDay(d, readDayFields(editor), editor.dataset.staff910DayToken, editor) : savePlan(d, ref, captureTask(editor), editor.dataset.staff910DayToken, editor.dataset.staff910PlanToken, editor);
      const next = currentEditor(d, ref, occurrence) || editor; next.open = true;
      message(next, result.kept ? (isDay ? 'Day availability saved. Task changes are kept below until you save the crew plan.' : 'Crew plan saved.') : result.reason, !result.accepted && /changed|reload/i.test(result.reason));
      if (!result.kept) flash(result.reason);
      const target = next.querySelector(isDay ? '[data-crew883-day-save]' : '[data-crew883-save]'); if (target) target.focus({preventScroll: true});
    }, true);
  }
  const api = {roster, day, mappingToken, planToken, captureTask, refresh, saveDay, savePlan,
    _test: {nameKey, validDay, placeholder, rosterFromRows, buildDay, mappingForRecord, planSignature, validateDayValues, validatePlanValues}};
  if (typeof document !== 'undefined' && typeof crew883Editor === 'function') install();
  return api;
})();
if (typeof window !== 'undefined') window.StaffNames910 = StaffNames910;
if (typeof module !== 'undefined' && module.exports) module.exports = StaffNames910;
