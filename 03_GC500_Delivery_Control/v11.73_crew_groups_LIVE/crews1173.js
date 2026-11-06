/* Author: Andrew Fisher. Crew identity is separate from QR task permissions. */
var SvcCrews1173 = (function () {
'use strict';
var ids=['cleaners','pump1','pump2','pump3','water'];
function valid(id) { return ids.indexOf(id)>=0; }
function choices(data) { return (data.crewGroups||[]).filter(function(g){return g&&valid(g.id)&&typeof g.label==='string';}); }
function label(data,id) { var g=choices(data).find(function(g){return g.id===id;});return g?g.label:'Crew group '+id; }
function add(state,event) {
  if(!state.crews){state.crews=[];state.pendingCrews=[];state.unassigned=false;state.pendingUnassigned=false;}
  var list=event.local?state.pendingCrews:state.crews;
  if(valid(event.crew_group)){if(list.indexOf(event.crew_group)<0)list.push(event.crew_group);list.sort();}
  else if(event.local)state.pendingUnassigned=true;else state.unassigned=true;
}
function text(data,state) {
  if(!state)return '';
  var names=(state.local?state.pendingCrews:state.crews)||[];
  var out=names.map(function(id){return label(data,id);});
  if(state.local?state.pendingUnassigned:state.unassigned)out.push('Group not recorded');
  return out.join(' · ')||'Group not recorded';
}
return {valid:valid,choices:choices,label:label,add:add,text:text};
})();
if(typeof module==='object'&&module.exports)module.exports=SvcCrews1173;
