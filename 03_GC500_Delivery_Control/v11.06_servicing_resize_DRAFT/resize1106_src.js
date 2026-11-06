/* Author: Andrew Fisher. Keep the viewed drawing centre across viewport changes. */
I.resize=new ResizeObserver(function(){
  var oldFit=I.fit,oldWidth=I.width,oldHeight=I.height;
  size();
  if(oldWidth!==I.width||oldHeight!==I.height||oldFit!==I.fit){
    var ratio=I.fit/oldFit;
    I.x=I.width/2-(oldWidth/2-I.x)*ratio;
    I.y=I.height/2-(oldHeight/2-I.y)*ratio;
  }
  scheduleView();
});I.resize.observe(I.view);
