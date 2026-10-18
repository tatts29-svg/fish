Author: Andrew Fisher
Daily task picker integration — read-only technical recommendation for v9.01
No original attachments, people records, rates or private operational findings are included here.

Source and precedence
1. Read the roster through ourCosts(). That function already merges DATA.workforce/WF.lines, COMMITTED.costs and S.costs in precedence order and honours tombedHere(). Never rebuild this from the original workbook, raw workforce lines or the global contacts list.
2. Date-specific options come from labour rows for the exact selected ISO date, with usable === true and rosterIncludes858(row). runHours(row) supplies paid hours; runWorked(row) supplies the whole shift duration. Positive timed/hours-only rows can support planned names; hours-only rows have an unknown availability window. Invalid, zero-hour or untimed group placeholders do not prove an individual is available.
3. Operational task planning must not call Finance review/write functions, set attendance, change roster hours, rates or costs. A forecast is planned availability, not proof of attendance or licence/capability.
4. Existing S.loads[crew883Key(day)] is the explicit day override. Preserve count, names and their positions exactly, including count 0 and intentionally unnamed slots. Do not silently fill, resize, sort or replace this array when the forecast changes.
5. With no explicit day override, display forecast candidates as a read-only suggestion. No rows means availability unknown, not zero. Choosing/saving a named assignment should deliberately establish its day slot mapping; merely opening a day must not write a record.

Existing API/schema
crew883Key(day, ref) => 'crew883/' + day + '/' + (ref || 'availability')
crew883Day(day) => {count: null|integer, names: string[]}; persisted via crew883SaveDay(day,count,names).
crew883Plan(day,ref) => {order: null|integer, people:[{slot:null|integer,roles:string[]}], start:'HH:MM'|'', finish:'HH:MM'|'', location:string}.
crew883SavePlan validates slot uniqueness, one or more roles per person, valid time windows and limits. Slots are one-based positions in that day's names array. They are not people IDs.
crew883Roles keys: spotter, forklift, installer, escort. One row is one person even when several roles are ticked.
crew883Assess uses explicit slots to detect people conflicts, peak simultaneous requirements and incomplete times/areas. crew883Sheet prints the same assigned names and roles.
flow891Build reads crew883Day(day) and uses the day count for overall unloading capacity. Dedicated load windows use flow891WindowKey(day,loadId); crew reference windows are a legacy fallback. Do not merge two loads just because they share a reference.

UI recommendation
At the selected day, offer 'Rostered for this day' names with their recorded shift window, 'To be assigned' and a deliberate way to adjust the day's crew. Keep names already assigned visible even if the forecast later changes, clearly requiring review. No automated assignment of operational roles from employment/pay type. Allow unnamed person slots and multiple roles in one row; don't convert an aggregate crew label into one named individual.

Identity and conflict safeguards
- Preserve an existing day slot's meaning. Sorting forecast names must never reassign a saved task to somebody else.
- Persist a day mapping only on the user's save; use the page's native authorised functions and named audit trail.
- An overlapping slot in a different area is a conflict. Same area still requires a feasible sequence; it is not automatic simultaneous availability.
- Default 30-minute unloading windows remain planned; don't retrospectively invent actual arrivals. Manual delay/finish times win.
- Group placeholders remain requirements/unnamed capacity pending confirmation. A generic contacts entry, hotel night or meal is not a dated shift.

Synthetic acceptance cases
A. Saved day count 0 plus roster candidates => still 0 available.
B. Saved names ['Worker B','Worker A'] and task slot 1 => Worker B remains assigned after forecast names are reordered or another name is added.
C. Removed source shift absent from ourCosts() => never reappears from raw source or workbook.
D. No dated shifts and no day override => availability unknown; 'To be assigned' remains usable.
E. Two roles on one person row => one person. Two separate unnamed rows => two people.
F. Same named slot in overlapping different-area tasks => conflict; non-overlapping tasks can reuse it.
G. Hours-only dated shift => name can be suggested with time window unknown; do not claim an exact shift start/finish.
H. Viewing, changing date or opening a task editor => zero writes. Saving planning => only intended planning documents; no payroll/Finance changes.
I. Existing manual day count with blank names => preserve the count and blank slots until the user assigns names.
J. A raw named-person record with no dated labour row => not shown as rostered for that date.

Native save review aid
- `PAGE=/path/to/page.html node native_save_characterisation.cjs` executes only the extracted crew save functions in an isolated VM with synthetic records; no service or browser writes.
- These checks describe existing behaviour, including known hazards. Passing is not evidence that those hazards are fixed, and this file is not a new release acceptance gate.
- Day Save and task Save are separate writes; validate a combined operation before either begins or keep the explicit two-step workflow. Day Save triggers a full render, so preserve or avoid discarding unsaved task fields.
- Saved blank slots, explicit zero/unknown counts and legacy out-of-count assignments must remain visible. Slot identity cannot be inferred from changing roster order.
- Guard introducing duplicate names into separate slots and stale editor mappings. Preserve unchanged historic data for explicit review. Native success alone is not a promise that the shared service has confirmed the change.
