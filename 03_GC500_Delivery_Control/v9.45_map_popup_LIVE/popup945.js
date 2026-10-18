/* Author: Andrew Fisher. Retire map callouts through their native Close action. */
function dismissMapPicks945(){
 document.querySelectorAll('.mkpick').forEach(popup=>{
  const close=popup.querySelector('button.close');
  if(close)close.click();
 });
}
