/* Author: Andrew Fisher. Refresh current-day progress once at an AEST day change.
   Record writes, selected historical days and servicing's own service clock are unchanged. */
(function (root) {
'use strict';
function create(deps) {
 var day=deps.today(), refreshes=0;
 function check() {
  if (deps.paused() || !deps.ready()) return false;
  var next=deps.today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next===day) return false;
  day=next;
  if (!deps.followsToday()) return false;
  deps.redraw(); refreshes++; return true;
 }
 return {check:check,report:function(){return {day:day,refreshes:refreshes};}};
}
var api=root.DayRefresh1103={create:create};
if(typeof document==='undefined')return;
var printing=false;
function pinned(){return typeof state!=='undefined'&&/^\d{4}-\d{2}-\d{2}$/.test(state.asOf||'');}
function followsToday(){
 // Showcase has its own snapshot date; its existing shared-cache hook refreshes a paused numerical scene.
 if(typeof SHOW!=='undefined'&&SHOW.open)return !pinned();
 if(typeof state==='undefined')return false;
 if(state.tab==='today'||state.tab==='progress')return !pinned();
 // Build and Demob already have day-change controllers. Servicing follows its service clock,
 // and Event nights follows its selected night. They must not inherit this calendar-day refresh.
 return ['plant','map','vms','fencing'].includes(state.tab);
}
function ready(){
 if(document.readyState==='loading')return false;
 if(typeof DATA==='undefined'||DATA.edition!=='hosted')return true;
 return typeof SYNC!=='undefined'&&typeof SYNC_COLLS!=='undefined'&&!!SYNC.on&&!!SYNC.first&&Object.keys(SYNC_COLLS).every(function(k){return SYNC.first.has(k);});
}
var controller=create({
 today:function(){return todayIso();},
 paused:function(){return document.hidden||printing||(typeof TPOD!=='undefined'&&TPOD.frozen);},
 ready:ready,followsToday:followsToday,
 redraw:function(){sharedCache975();syncRedraw();}
});
api.check=controller.check;api.report=controller.report;
if(typeof tpodTick==='function'){
 var beforeClock=tpodTick;
 tpodTick=function(){var result=beforeClock.apply(this,arguments);controller.check();return result;};
}
document.addEventListener('visibilitychange',controller.check);
root.addEventListener('pageshow',controller.check);
root.addEventListener('focus',controller.check);
root.addEventListener('beforeprint',function(){printing=true;});
root.addEventListener('afterprint',function(){printing=false;controller.check();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',controller.check,{once:true});
})(typeof window!=='undefined'?window:globalThis);
