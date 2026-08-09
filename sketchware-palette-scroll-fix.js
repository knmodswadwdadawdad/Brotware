(function(){
'use strict';

var scroller=null,gesture=null,raf=0;
var MOVE_START=5;

function dragActive(){try{return !!(window.BrotwareUnifiedLogicDrag&&BrotwareUnifiedLogicDrag.active&&BrotwareUnifiedLogicDrag.active());}catch(_){return false;}}
function findScroller(){return document.getElementById('swPaletteScroll');}
function cleanup(){
  if(raf){cancelAnimationFrame(raf);raf=0;}
  gesture=null;
  if(!dragActive())document.body.classList.remove('sw5-palette-scrolling');
}
function applyScroll(){
  raf=0;if(!gesture||!scroller||dragActive())return;
  scroller.scrollTop=gesture.startTop-(gesture.y-gesture.startY);
  scroller.scrollLeft=gesture.startLeft-(gesture.x-gesture.startX);
}
function down(e){
  scroller=findScroller();if(!scroller||!scroller.contains(e.target)||dragActive())return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  gesture={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,startTop:scroller.scrollTop,startLeft:scroller.scrollLeft,scrolling:false};
}
function move(e){
  if(!gesture||e.pointerId!==gesture.id)return;
  if(dragActive()){cleanup();return;}
  gesture.x=e.clientX;gesture.y=e.clientY;
  var dx=gesture.x-gesture.startX,dy=gesture.y-gesture.startY;
  if(!gesture.scrolling&&Math.hypot(dx,dy)>=MOVE_START){gesture.scrolling=true;document.body.classList.add('sw5-palette-scrolling');}
  if(!gesture.scrolling)return;
  e.preventDefault();
  if(!raf)raf=requestAnimationFrame(applyScroll);
}
function up(e){if(gesture&&e.pointerId===gesture.id)cleanup();}
function staleCleanup(){if(!dragActive())document.body.classList.remove('sw5-logic-dragging');cleanup();}

window.addEventListener('pointerdown',down,true);
window.addEventListener('pointermove',move,{capture:true,passive:false});
window.addEventListener('pointerup',up,true);
window.addEventListener('pointercancel',up,true);
window.addEventListener('blur',staleCleanup);
document.addEventListener('visibilitychange',function(){if(document.hidden)staleCleanup();});

/* Re-assert dimensions after the palette is rebuilt by category/search changes. */
function install(){
  var p=findScroller();if(!p){setTimeout(install,180);return;}
  if(p.dataset.swPaletteScrollFix==='1')return;p.dataset.swPaletteScrollFix='1';
  p.style.overflowY='auto';p.style.minHeight='0';
}
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1300);
window.BrotwarePaletteScrollFix={refresh:install};
})();
