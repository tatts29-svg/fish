/* Author: Andrew Fisher. Bind after the prior read-only adapters. */
(function(){
'use strict';
const summaryBefore=todayWorkSummary848;
todayWorkSummary848=function(){const r=summaryBefore.apply(this,arguments);Scope960.applyScope(r?.byId?.vms);const l=r?.byId?.lighting;if(l)l.scopeNote960=Scope960.lightingNote(l);return r;};
const typesBefore=todayTypeMetrics843;
todayTypeMetrics843=function(){const r=typesBefore.apply(this,arguments);for(const row of r?.byCard?.vms||[]){Scope960.applyScope(row);if(row.scopeProvisional960)row.scopeNote=row.scopeNote960;}return r;};
const groupsBefore=todayGroupDetails841;
todayGroupDetails841=function(){const r=groupsBefore.apply(this,arguments),v=r?.vms;if(v&&Array.isArray(v.notes)){const total=(v.groups||[]).reduce((n,g)=>n+(g.summary?.total||0),0);if(total!==Scope960.currentEvidence().requirement)v.notes=[...new Set([...v.notes,Scope960.vmsBasis(total)])];}return r;};
})();
