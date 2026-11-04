/* Author: Andrew Fisher. Browser chrome height changes preserve the day's manual scroll. */
let weatherResizeWidth1300=root.innerWidth;
root.addEventListener('resize',()=>{
 const width=root.innerWidth;
 if(width===weatherResizeWidth1300)return;
 weatherResizeWidth1300=width;
 reveal();
});
