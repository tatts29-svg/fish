#!/usr/bin/env python3
"""Keep Costs refresh scrolling local to the view being refreshed. Author: Andrew Fisher."""
from pathlib import Path
import argparse
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "toolchain"))
from rep import rep

OLD = r""" const native=renderCosts;
 renderCosts=function(){const main=document.querySelector('main'),y=main?.scrollTop||0;const result=native.apply(this,arguments);tidy();if(y>0)requestAnimationFrame(()=>main.scrollTo({top:y,behavior:"instant"}));return result;};"""

NEW = r""" // Author: Andrew Fisher. A queued Costs refresh must yield to navigation or the user's next action.
 let costsScroll1065 = 0;
 const native=renderCosts;
 renderCosts=function(){
  const generation=++costsScroll1065,main=document.querySelector('main'),y=main?.scrollTop||0;
  const tab=state.tab,hash=location.hash,pane=document.getElementById('pane-costs'),arrival=!!GO_CHANGED,intent=window.Persistence1010?.intent;
  const result=native.apply(this,arguments);tidy();const after=main?.scrollTop;
  if(!arrival&&tab==='costs'&&y>0)requestAnimationFrame(()=>{
   if(generation!==costsScroll1065||!main?.isConnected||state.tab!==tab||location.hash!==hash||GO_CHANGED||document.getElementById('pane-costs')!==pane||window.Persistence1010?.intent!==intent||main.scrollTop!==after)return;
   if(main.scrollTop!==y)main.scrollTo({top:y,behavior:"instant"});
  });
  return result;
 };"""


def apply(text, path="GC500_Delivery_Control_hosted.html"):
    if "let costsScroll1065 = 0;" in text:
        raise SystemExit("Costs scroll correction v10.65 is already present")
    return rep(text, OLD, NEW, "Costs refresh scroll stays in its own view", path, True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, nargs="?")
    args = parser.parse_args()
    result = apply(args.source.read_text(), str(args.source))
    if args.output:
        args.output.write_text(result)
    else:
        sys.stdout.write(result)
