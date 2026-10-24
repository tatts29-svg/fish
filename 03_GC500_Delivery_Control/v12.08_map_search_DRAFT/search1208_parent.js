/* Author: Andrew Fisher. Bridge the existing map search to all verified drawing matches. */
(function(W){
 'use strict';
 const catalog=__CATALOG1208__;
 const frame=()=>document.getElementById('expFrame')?.contentWindow?.GC500Search1208||null;
 function search(q){if(!String(q||'').trim())return frame()?.search('')||{rows:[],placed:0,unplaced:0,note:''};return frame()?.search(q)||{rows:[],placed:0,unplaced:0,note:'The map is still loading. Your search will run when it is ready.'};}
 function showAll(){const f=frame();if(!f)return false;const list=document.getElementById('f1176list');if(list)list.hidden=true;document.getElementById('expcard')?.scrollIntoView({block:'start',behavior:'auto'});f.showAll();setTimeout(()=>{if(frame()===f)f.showAll();},240);return true;}
 const css=document.createElement('style');css.id='search1208-style';css.textContent='#f1176list{max-height:min(280px,35vh);overflow:auto;overscroll-behavior:contain}#f1176list .f1176-hit{flex-shrink:0}';document.head.appendChild(css);
 W.MapSearch1208=Object.freeze({version:'v12.08',catalog,frame,search,showAll,select:L=>frame()?.select(L.code1208,L.place1208||0)});
})(window);
