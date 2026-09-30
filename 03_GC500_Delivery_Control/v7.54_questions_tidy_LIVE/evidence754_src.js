/* Author: Andrew Fisher. Keep confirmed document and service-paper evidence beside the remaining questions. */
function drawingQuestionEvidence754(){
 const docs = (((DATA || {}).docs || {}).docs || []).filter(d => String(d.project_no) === '26003' && d.group === 'issued');
 const sheets = [...new Set(docs.flatMap(d => d.sheet_ids || []).filter(id => /^[DK]\d{3}-26003-\d{2}$/.test(id)))];
 if (!sheets.length) return null;
 const labels = docs.map(d => (d.sheet_ids || []).filter(id => sheets.includes(id)).join(', ')).filter(Boolean);
 const master = sheets.includes('D001-26003-03');
 return {title: 'Confirm the latest issued drawing set',
  why: 'The page holds these issued 2026 sheets: ' + labels.join('; ') + '. '
   + (master ? 'Tagged unit positions already follow master plan D001-26003-03. ' : '')
   + 'The remaining question is whether iEDM has issued any later revisions. This also covers R07, R14 and R25.',
  need: 'Confirm that this is the latest issued set, or identify the replacement sheet and revision.'};
}
function removalServiceEvidence754(asOf){
 const notes = typeof serviceNoteRows === 'function' ? serviceNoteRows() : [];
 const dated = n => n && n.usable !== false && /^\d{4}-\d{2}-\d{2}$/.test(n.date || '') && n.date <= asOf;
 const down = notes.find(n => String(n.note_no) === '24455' && dated(n) && n.date === '2026-09-18'
  && /stacked down/i.test(n.note || '') && /32\.5\s*m\b/i.test(n.note || '') && /truck storage/i.test(n.location || ''));
 if (!down) return '';
 const back = notes.find(n => String(n.note_no) === '24456' && dated(n) && n.date === '2026-09-21'
  && /re-installed/i.test(n.note || '') && /32\.5\s*m\b/i.test(n.note || '') && /24455/.test(n.note || ''));
 return 'Separately, service note ' + down.note_no + ' records a temporary 32.5 m stack-down at Truck storage on ' + fmtDate(down.date)
  + (back ? '; note ' + back.note_no + ' records those same panels reinstated on ' + fmtDate(back.date) : '')
  + '. This service work has not been matched to the planned removal. Removal is included in the fencing price; the supplier labour stays recorded once.';
}
function decorateQuestionEvidence754(Q){
 const drawing = drawingQuestionEvidence754();
 Q.forEach(q => {
  if (q.id === 'oi-R23' && drawing) {
   q.q = 'R23 - ' + drawing.title; q.why = drawing.why; q.need = drawing.need;
  }
  if (q.id === 'fe-gap') {
   const context = removalServiceEvidence754(qYesterday(todayIso()));
   if (context) {
    q.rows = (q.rows || []).map(row => /^Removal:/.test(row) ? row.replace(/on the record$/, 'on hire dockets') : row);
    if (!q.why.includes('service note 24455')) q.why += ' ' + context;
   }
  }
 });
 return Q;
}
function questionHistory753(){
 const drawing = drawingQuestionEvidence754();
 return questionHistoryBefore754().map(row => {
  const h = row.slice();
  if (h[0] === 'R07') h[3] = 'The 2026 drawings are held on the page, with the revision shown for each sheet. They are not all Rev 02. Any later issue is handled under R23.';
  if (h[0] === 'R23' && drawing) { h[2] = drawing.title; h[3] = drawing.why; h[4] = drawing.need; }
  return h;
 });
}
