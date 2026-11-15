"""Author: Andrew Fisher. Restore bounded Build history work without changing its readings.

v12.61 added an eager read for the last Build card's race-weekend cutoff, but
applied it to every historical card. Keep the selected and last card immediate;
the existing v9.86 visibility loader supplies the others. Print still resolves
every pending past card through the same model and painter.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / "toolchain"))
from rep import rep


def patch(text, path="page"):
    if "function initialProgress1307(" in text:
        raise ValueError("Build responsiveness v13.07 already applied")
    if "+' · v13.06'; /* v8.19 release922" not in text or 'id="progress986-script"' not in text:
        raise ValueError("Build responsiveness v13.07 requires live dashboard v13.06")
    text = rep(text, "function html(day,ci,sel,today){", """function initialProgress1307(day,selected){
 return day===selected||(typeof LAST_BUILD_DAY1261==='object'&&LAST_BUILD_DAY1261&&day===LAST_BUILD_DAY1261.day);
}
function html(day,ci,sel,today){""", "Bound initial Build progress to selected and last day", path)
    text = rep(text,
        "p=model(day,today,iso=>progress.get(iso)||(typeof jobAtDate==='function'?jobAtDate(iso):null)||{ready:false,pending:todayWorkHealth840().ready})",
        "p=model(day,today,iso=>progress.get(iso)||(initialProgress1307(day.iso,sel)&&typeof jobAtDate==='function'?jobAtDate(iso):null)||{ready:false,pending:todayWorkHealth840().ready})",
        "Keep offscreen historical replay in the native visibility loader", path)
    text = rep(text,
        "root.BuildProgress986={create,sync:loader.sync,report:loader.report};",
        """/* Author: Andrew Fisher. Print lays out every Build card, including offscreen dates. */
function printProgress1307(){
 const pane=document.getElementById('pane-timeline');
 const current=()=>!!(pane&&pane.isConnected&&pane.classList.contains('on')&&!pane.hidden&&state.tab==='timeline');
 if(!current()||document.body.classList.contains('printing-day')||document.body.classList.contains('printing-sheet'))return;
 loader.stop();
 root.BuildCards984.begin();
 const today=todayIso();
 for(const card of pane.querySelectorAll('.bc984-day[data-build-progress="pending"]')){
  const day=card.dataset.day;if(!current()||!card.isConnected||day>=today)continue;
  const result=root.PastDay984.model({iso:day},today,root.BuildCards984.progressForDate);
  if(current()&&card.isConnected&&card.dataset.day===day&&card.dataset.buildProgress==='pending')paint(card,result);
 }
}
window.addEventListener('beforeprint',printProgress1307);
window.addEventListener('afterprint',loader.resume);
root.BuildProgress986={create,sync:loader.sync,report:loader.report};""",
        "Resolve pending Build readings before their native print layout", path)
    return text


if __name__ == "__main__":
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding="utf-8"), str(page)), encoding="utf-8")
    print("Build v13.07: bounded initial history, native deferred readings and print completion")
