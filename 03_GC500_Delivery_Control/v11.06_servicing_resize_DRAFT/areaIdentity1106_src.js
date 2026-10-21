/* Author: Andrew Fisher. Area identity follows the existing map/print number and name. */
function areaLabel1106(a){return a.id==='0'?a.name:'Area '+a.id+' · '+a.name;}
function areaTitle1106(a){return (a.id==='0'?'':'<span class="svc1106-area-number" aria-hidden="true">'+esc(a.id)+'</span>')+'<span class="svc1106-area-name">'+esc(a.name)+'</span>';}
