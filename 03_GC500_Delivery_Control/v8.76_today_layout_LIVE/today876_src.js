/* Author: Andrew Fisher. Keep native controls and data; one aligned Today layout. */
function today876Tidy(){
 const p=document.getElementById('pane-today');if(!p)return;p.classList.add('today876');
 const head=p.querySelector(':scope > .acts793 .head'),who=p.querySelector(':scope > .hubhead .hubwho');
 if(head&&who){who.classList.add('today876-who');head.appendChild(who);}
}
const today876Render=renderToday;renderToday=function(...args){const result=today876Render(...args);today876Tidy();return result;};
