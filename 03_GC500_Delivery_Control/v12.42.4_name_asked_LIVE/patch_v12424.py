"""v12.42.4 - a new person is asked for their name (Andrew, 27 Oct 2026: "I sent a edit link and they cant add times"; it worked on
his own phone and laptop; see README.md).

What was wrong, found on the live v12.42.3 page: a phone or laptop opening the edit link for the first time has no name in Tools ·
Recording as. Every save asks whoAmI() for the name first; with none, whoAmI() flashed "Put your name in Recording as first" and
focused the Recording as box. On the Demob cards' Book pick-up sheet (a modal dialog) that message was drawn behind the sheet and the
box sits inside the closed Tools menu, so Save booking did nothing anyone could see, and nothing was saved. Andrew's own devices
already carry his name, so it worked for him.

On the live v12.42.3 page:
  1. whoAmI(): with no name (or a "name" with no letter in it, such as "0"), it asks for the name in the browser's own box, which
     shows above any open sheet or form, keeps it in Recording as and on this device as before, and the press carries on. Cancelled,
     it says where the box is (Tools · Recording as) and returns no name, as before; one press never asks twice. A name already set
     is used exactly as before, with no question;
  2. flash(): the message stays on the page exactly as before (so "booked ... recorded by" still shows once the sheet closes); while a
     sheet or form sits above the page (a modal dialog, or the pick-up form), the same words are also shown at the top of it, letting
     taps through to its buttons, and go when it closes (review, 27 Oct 2026);
  3. the footer reads v12.42.4.
Nothing else on the page is touched. Author: Andrew Fisher.
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '81cacbcf24551cb5ed5178fa59601b7577da47af0e0a7b29b11bed343fb3e57f'
FOOT_OLD, FOOT_NEW = "+' · v12.42.3'; /* v8.19 release922", "+' · v12.42.4'; /* v8.19 release922"
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()

# 1. whoAmI(): a person with no name is asked for it, above any open sheet
WHO_OLD = """function whoAmI(){
 const w = ($('#who') && $('#who').value.trim()) || (S.operator || '').trim();
 if (w) { if (S.operator !== w) { S.operator = w; save(); } return w; }
 const box = $('#who');
 if (box) { box.classList.remove('need'); void box.offsetWidth; box.classList.add('need'); box.focus(); }
 flash('Put your name in "Recording as" first — every light carries the name of whoever set it.');
 return null;
}
"""
WHO_NEW = """let whoAsked12424 = 0; /* v12.42.4: when the name was last asked for, so one press never asks twice */
function whoAmI(){
 const named = v => /\\p{L}/u.test(v); /* v12.42.4: a name has a letter in it ("0" is not a name) */
 const box = $('#who'), w = (box && box.value.trim()) || (S.operator || '').trim();
 if (w && named(w)) { if (S.operator !== w) { S.operator = w; save(); } return w; }
 /* v12.42.4 (Andrew, 27 Oct 2026: "I sent a edit link and they cant add times"): a phone opening the edit link for the first time has
    no name yet, and the Recording as box is inside the Tools menu, behind any open sheet or form, so a press like Save booking did
    nothing anyone could see. The name is asked for here, in the browser's own box, which shows above the sheet; it is kept in
    Recording as and on this device, and the press carries on. */
 if (Date.now() - whoAsked12424 > 1500) {
  whoAsked12424 = Date.now();
  let typed = null; try { typed = window.prompt('Your name, please. It goes on everything you record here, with the time. (Change it later under Tools · Recording as.)', ''); } catch (e) { typed = null; }
  whoAsked12424 = Date.now();
  typed = String(typed == null ? '' : typed).replace(/\\s+/g, ' ').trim().slice(0, 60);
  if (typed && named(typed)) { if (box) { box.value = typed; box.classList.remove('need'); } S.operator = typed; save(); return typed; }
 }
 if (box) { box.classList.remove('need'); void box.offsetWidth; box.classList.add('need'); box.focus(); }
 flash('Put your name in Tools · Recording as first — every record carries the name of whoever made it.');
 return null;
}
"""

# 2. flash(): unchanged on the page; the same words also at the top of an open sheet or form, letting taps through
FLASH_OLD = """ clearTimeout(flashTimer); flashTimer = setTimeout(() => { el.style.display = 'none'; }, 3600);
}
"""
FLASH_NEW = """ clearTimeout(flashTimer); flashTimer = setTimeout(() => { el.style.display = 'none'; }, 3600);
 try { flashOnTop12424(msg); } catch (e) {} /* v12.42.4 */
}
/* v12.42.4: an open sheet or form (a modal dialog, or the pick-up form) is drawn above the page and over the message above, so while one
   is open the same words are also shown at the top of it. They let taps through to its buttons, and go when it closes or after the same
   3.6 s; the message on the page is left exactly as it was, so it still shows once the sheet has closed. */
let flashTop12424 = null, flashTopTimer12424 = 0;
function flashOnTop12424(msg){
 let modal = []; try { modal = [...document.querySelectorAll('dialog:modal')]; } catch (e) { modal = [...document.querySelectorAll('dialog[open]')]; }
 /* an open modal dialog is above everything else; otherwise a form panel marked modal that is showing something (the Demob pick-up
    panel stays on the page, empty, after it closes) */
 const showing = x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(x).visibility !== 'hidden' && !!x.querySelector(':scope > :not(.flash12424)'); };
 const forms = [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(x => x.tagName !== 'DIALOG' && !x.hidden && showing(x));
 const host = modal.length ? modal[modal.length - 1] : forms.pop();
 if (flashTop12424 && (!host || flashTop12424.parentNode !== host)) { flashTop12424.remove(); flashTop12424 = null; }
 if (!host) return;
 if (!flashTop12424) {
  const t = document.createElement('div'); t.className = 'flash12424'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  t.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:10px 16px;border-radius:8px;' +
   'z-index:2147483000;font-size:13px;max-width:90vw;box-shadow:var(--shadow);pointer-events:none;text-align:center';
  host.appendChild(t); flashTop12424 = t;
 }
 flashTop12424.textContent = msg; flashTop12424.style.display = 'block';
 clearTimeout(flashTopTimer12424); flashTopTimer12424 = setTimeout(() => { if (flashTop12424) { flashTop12424.remove(); flashTop12424 = null; } }, 3600);
}
"""


def patch(text, path='page'):
    if sha(text) != BASE: raise ValueError('Live base is not the verified v12.42.3; rebuild and retest')
    if 'whoAsked12424' in text: raise ValueError('v12.42.4 is already on this page')
    for a, b, what in ((WHO_OLD, WHO_NEW, 'whoAmI: a person with no name is asked for it'), (FLASH_OLD, FLASH_NEW, 'flash: the same words at the top of an open sheet or form')):
        if text.count(a) != 1: raise ValueError(what + ': not found once')
        text = rep(text, a, b, what, path)
    if text.count(FOOT_OLD) != 1: raise ValueError('release footer v12.42.3 not found once')
    return text.replace(FOOT_OLD, FOOT_NEW)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t, str(p)), encoding='utf-8')
    print('patch_v12424 applied: a person with no name is asked for it (above any open sheet or form), messages also shown at the top of an open sheet or form; footer v12.42.3 -> v12.42.4')
