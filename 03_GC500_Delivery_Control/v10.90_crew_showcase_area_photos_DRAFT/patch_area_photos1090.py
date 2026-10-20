"""Author: Andrew Fisher. Optional area context using the native photo record/outbox."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep as _rep

def patch(text, path=None):
    def rep(text, old, new):
        return _rep(text, old, new, 'Area photograph hook', str(path or 'candidate.html'))
    if 'id="area1090-script"' in text:
        raise ValueError('Area photos v10.90 already applied')
    if 'const FwfPhotos1010 = (() => {' not in text or 'function photoSendUnlocked797(' not in text:
        raise ValueError('Expected current native photograph implementation')
    # A location area photo is displayed independently of whether one already exists.
    text = rep(text, "const model=gcModel925(a);if(!model.groups.length)return '';", "const model=gcModel925(a);if(!model.groups.length)return window.AreaPhotos1090?AreaPhotos1090.panel(a):'';")
    text = rep(text, "+(unassigned.length?Items933.locationPhotos(a,unassigned):'')+", "+(window.AreaPhotos1090?AreaPhotos1090.panel(a):'')+(unassigned.length?Items933.locationPhotos(a,unassigned.filter(p=>!window.AreaPhotos1090||!AreaPhotos1090.isArea(p))):'')+")
    # Context belongs in a separate gallery, never in individual/plate evidence.
    text = rep(text, "return photos.filter(p=>p.unit&&(p.unit===unit.id||(unit.assetNo&&duplicates===1&&String(p.unit)===unit.assetNo)));}", "return photos.filter(p=>(!window.AreaPhotos1090||!AreaPhotos1090.isArea(p)||AreaPhotos1090.isIndividualEvidence(p,unit.ref))&&p.unit&&(p.unit===unit.id||(unit.assetNo&&duplicates===1&&String(p.unit)===unit.assetNo)));}")
    text = rep(text, "photos:dropPhotosOf(ref),units:unitsOf(ref)", "photos:dropPhotosOf(ref).filter(p=>!window.AreaPhotos1090||AreaPhotos1090.isIndividualEvidence(p,ref)),units:unitsOf(ref)")
    text = rep(text, "return dropPhotosOf(key).some(p => String(p.unit || '') === String(u));", "return dropPhotosOf(key).some(p => (!window.AreaPhotos1090||AreaPhotos1090.isIndividualEvidence(p,key))&&String(p.unit || '') === String(u));")
    # Persist the explicit association snapshot before upload, then carry it through the existing acknowledgement plan.
    text = rep(text, "const reason=item933.fwfGroup1010?", "const reason=item933.area1090?AreaPhotos1090.guardUpload(key,item933.unitId,slot,item933.expected):item933.fwfGroup1010?")
    text = rep(text, " if (!await photoOutboxPut(entry)) { tell('Could not keep this photograph on this device.", " if(item933&&item933.area1090){entry.area1090=JSON.parse(JSON.stringify(item933.area1090));entry.title=key+' area context'+(entry.area1090.label?' — '+entry.area1090.label:'');entry.note='Area photograph with explicitly selected item associations. Context only; does not identify a plate or confirm completed work.';}\n if (!await photoOutboxPut(entry)) { tell('Could not keep this photograph on this device.")
    text = rep(text, "caption: e.caption || ''},\n    replace, replaceStamp:", "caption: e.caption || '', ...(e.area1090?{area1090:JSON.parse(JSON.stringify(e.area1090))}:{})},\n    replace, replaceStamp:")
    # A context image must be labelled as context in shared normal-page readers.
    text = rep(text, "out.push({kind: 'drop', url: sr.thumb || sr.url,", "out.push({kind: 'drop', shot, url: sr.thumb || sr.url,")
    text = rep(text, "p.kind === 'drop' ? 'On site' : p.kind === 'made' ? 'Illustration'", "p.kind === 'drop' ? (window.AreaPhotos1090&&AreaPhotos1090.isArea(p.shot)?'Area context':'On site') : p.kind === 'made' ? 'Illustration'")
    text = rep(text, "drops + ' photograph' + (drops === 1 ? '' : 's') + ' of this drop on the record'", "drops + (window.AreaPhotos1090&&pics.some(p=>AreaPhotos1090.isArea(p.shot))?' linked photograph':' photograph') + (drops === 1 ? '' : 's') + (window.AreaPhotos1090&&pics.some(p=>AreaPhotos1090.isArea(p.shot))?' on the record':' of this drop on the record')")
    text = rep(text, ". A photograph of the drop opens full size in a new tab.</p>`;", ". ${window.AreaPhotos1090&&pics.some(p=>AreaPhotos1090.isArea(p.shot))?'A linked photograph':'A photograph of the drop'} opens full size in a new tab.</p>`;")
    text = rep(text, '<span class="eqpl live">On site</span></span>', '<span class="eqpl live">${window.AreaPhotos1090&&AreaPhotos1090.isArea(shot)?\'Area context\':\'On site\'}</span></span>')
    text = rep(text, "w + ' · ' + (sl(p).lab || 'photograph')", "(window.AreaPhotos1090&&AreaPhotos1090.isArea(p)?AreaPhotos1090.caption(p):w + ' · ' + (sl(p).lab || 'photograph'))")
    text = rep(text, '<b class="rs-tag live">On site</b>` : photoBlock(r, ph, a.key)', '<b class="rs-tag live">${window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?\'Area context\':\'On site\'}</b>` : photoBlock(r, ph, a.key)')
    text = rep(text, "dpImgFig(x.r.thumb || x.r.url, 'On site' + (x.ph.at", "dpImgFig(x.r.thumb || x.r.url, (window.AreaPhotos1090&&AreaPhotos1090.isArea(x.ph)?'Area context':'On site') + (x.ph.at")
    text = rep(text, '<span class="dphl">On site</span>', '<span class="dphl">${window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?\'Area context\':\'On site\'}</span>')
    text = rep(text, "const all = dropPhotosOf(key), got = all.length;", "const all = dropPhotosOf(key), got = all.length, area1090=!!(window.AreaPhotos1090&&all.some(p=>AreaPhotos1090.isArea(p)));")
    text = rep(text, '<div class="sect">Photographs of this drop${!got', '<div class="sect">${area1090?\'Photographs linked here\':\'Photographs of this drop\'}${!got')
    text = rep(text, '<p class="dphabout">Three from the ground, then two from the air for the drone — the same places on every building. A place stays empty until somebody stands there, or flies.</p>`;', '<p class="dphabout">${area1090?\'Individual photo slots retain their ground and air purposes. Area context is managed through Area photos and does not identify a unit or confirm work.\':\'Three from the ground, then two from the air for the drone — the same places on every building. A place stays empty until somebody stands there, or flies.\'}</p>`;')
    text = rep(text, """<p class="sub">Taken after it went in. These are <b>${esc(key)}</b> itself, not the product, and they say so
 wherever they appear.${can ? ' Everyone on the record sees them.' : ''}${units.length > 1
 ? ` Each of the ${units.length} units inside it has its own two places, by asset number.` : ''}</p>""", """<p class="sub">${area1090?'Shared area photographs provide context for explicitly selected items. Their links do not establish placement, identity or completed work.':`Taken after it went in. These are <b>${esc(key)}</b> itself, not the product, and they say so
 wherever they appear.${can ? ' Everyone on the record sees them.' : ''}${units.length > 1
 ? ` Each of the ${units.length} units inside it has its own two places, by asset number.` : ''}`}</p>""")
    text = rep(text, """<div class="dphslot" data-lab="${esc(s.lab)}">${esc(s.lab)}${s.aerial ? '<i class="dphdrone" title="a drone shot — Andrew\\'s DJI">drone</i>' : ''}</div>
 <p class="dphsays">${esc(dropPhotoSays(key, ph))}</p>""", """<div class="dphslot" data-lab="${esc(window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?AreaPhotos1090.caption(ph):s.lab)}">${esc(window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?AreaPhotos1090.caption(ph):s.lab)}${s.aerial&&!(window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)) ? '<i class="dphdrone" title="a drone shot — Andrew\\'s DJI">drone</i>' : ''}</div>
 <p class="dphsays">${esc(dropPhotoSays(key, ph))}</p>""")
    text = rep(text, 'placeholder="${esc(s.lab)}" data-dphcap', 'placeholder="${esc(window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?\'Area context\':s.lab)}" data-dphcap')
    text = rep(text, '${esc(ph.caption || s.lab)}</p>`}', '${esc(window.AreaPhotos1090&&AreaPhotos1090.isArea(ph)?AreaPhotos1090.caption(ph):(ph.caption || s.lab))}</p>`}')
    text = rep(text, "const lab = (p.caption || (DROP_SLOTS[p.slot] || {}).lab || 'Photo');", "const lab = window.AreaPhotos1090&&AreaPhotos1090.isArea(p)?AreaPhotos1090.caption(p):(p.caption || (DROP_SLOTS[p.slot] || {}).lab || 'Photo');")
    source = Path(__file__).with_name('area_photos1090.js').read_text()
    return rep(text, '</script>\n</body>\n</html>', '</script>\n<script id="area1090-script">\n' + source + '\n</script>\n</body>\n</html>')

if __name__ == '__main__':
    target=Path(sys.argv[1]);target.write_text(patch(target.read_text(),target))
