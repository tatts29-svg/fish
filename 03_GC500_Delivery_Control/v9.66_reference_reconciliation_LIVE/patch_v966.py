# Author: Andrew Fisher. Reconcile existing record references without moving native records.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'const Reference966 =' not in s,'v9.66 already applied'
assert 'const ItemPhotos965 =' in s and " · v9.65'; /* v8.19" in s,'Requires v9.65 predecessor'
def change(old,new,why):
 global s
 s=rep(s,old,new,why,str(p))
change('function unreferencedRows(){\n const taken = new Set((S.added || []).map(a => a.source_row).filter(Boolean));\n return (DATA.unreferenced || []).filter(r => !taken.has(r.task_id) && !rowOff(r.task_id));\n}',(HERE/'references966.js').read_text()+'\nfunction unreferencedRows(){ return Reference966.pendingRows(); }','resolve the schedule rows against existing item records')
# Preserve old source-only renderer as evidence and its row-history helper; use the current projection on screen.
change('function unrefBlock(d, full){','function unrefBlock(d, full){ return referenceTasks966(d,full); }\nfunction unrefBlockBefore966(d, full){','additional scheduled work keeps its source reference')
change("${d.unref.length ? ldFoldIf(full, 'unref', 'On the schedule with no reference', d.unref.length, unrefBlock(d, full)) : ''}","${referenceSourceLinks966(d, full)}\n${d.unref.length ? ldFoldIf(full, 'unref', 'Additional scheduled work', d.unref.length, unrefBlock(d, full)) : ''}",'trace linked source rows without duplicate item cards')
change("chip('gap', d.unref.length, 'ref missing', 'refs missing')","chip('gap', d.unref.length, 'other task', 'other tasks')",'calendar describes source tasks accurately')
change(" · <b>${d.unref.length}</b> row${d.unref.length === 1 ? '' : 's'} with no reference"," · <b>${d.unref.length}</b> additional schedule task${d.unref.length === 1 ? '' : 's'}",'selected day summary names existing task references')
change("', ' + d.unref.length + ' rows with no reference'","', ' + d.unref.length + ' additional schedule tasks'",'accessible calendar summary agrees')
old="${unreferencedRows().length ? `${unreferencedRows().length} schedule row${unreferencedRows().length === 1 ? '' : 's'} still carr${unreferencedRows().length === 1 ? 'ies' : 'y'} no reference — they are listed on their day on the Timeline tab, each with a “Give it a reference” button.` : 'Every schedule row now carries a reference.'}"
new="${unreferencedRows().length ? `${unreferencedRows().length} additional schedule tasks retain their source references on Timeline. Existing linked items are already included in their location records.` : 'All equipment schedule rows are linked to their item records.'}"
change(old,new,'Add help does not invite duplicate records')
change('<div>rows with no reference</div>', '<div>additional schedule tasks</div>', 'printed tasks keep their schedule references')
change('a schedule row with no drawing reference</div></div>', 'additional scheduled work</div></div>', 'print heading names source-only work')
change('<span class="chip cand" title="a schedule row with no drawing reference, carried under the schedule’s own task id — open it to give it a reference">schedule row, not on a drawing</span>'.replace('schedule’s', "schedule's"), '${referenceBadge966(a)}', 'equipment schedule rows show supported map or reference status')
change(" · v9.65'; /* v8.19"," · v9.66'; /* v8.19",'footer')
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
