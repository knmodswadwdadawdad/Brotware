(function(){
'use strict';

var drag=null;
var suppressUntil=0;
var MOVE_THRESHOLD=4;

function cats(){
  return document.querySelector('#swLogicOverlay .sw-palette-cats');
}

function inCats(target){
  var c=cats();
  return c&&target&&c.contains(target)?c:null;
}

function constrainRail(c){
  if(!c)return;
  var host=c.parentElement;
  if(!host)return;

  /* Give the rail a real pixel height. Some mobile grid layouts let an auto
     track expand to the content height, which makes scrollTop a no-op. */
  var h=host.clientHeight;
  if(h>0){
    c.style.setProperty('height',h+'px','important');
    c.style.setProperty('max-height',h+'px','important');
  }

  c.style.setProperty('min-height','0','important');
  c.style.setProperty('overflow-y','scroll','important');
  c.style.setProperty('overflow-x','hidden','important');
  c.style.setProperty('box-sizing','border-box','important');
  c.style.setProperty('touch-action','none','important');
}

function refresh(){
  var c=cats();
  if(!c)return;
  constrainRail(c);
}

function pointerDown(e){
  var c=inCats(e.target);
  if(!c)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;

  constrainRail(c);
  drag={
    el:c,
    pointerId:e.pointerId,
    startX:e.clientX,
    startY:e.clientY,
    startTop:c.scrollTop,
    moved:false
  };

  try{c.setPointerCapture(e.pointerId);}catch(_){}
}

function pointerMove(e){
  if(!drag||e.pointerId!==drag.pointerId)return;

  var dx=e.clientX-drag.startX;
  var dy=e.clientY-drag.startY;

  if(!drag.moved&&Math.hypot(dx,dy)<MOVE_THRESHOLD)return;

  /* Only convert the gesture into rail scrolling when it is predominantly
     vertical. This keeps a normal tap on a category working. */
  if(!drag.moved&&Math.abs(dy)<Math.abs(dx))return;

  drag.moved=true;
  drag.el.scrollTop=drag.startTop-dy;

  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}

function endPointer(e){
  if(!drag||e.pointerId!==drag.pointerId)return;

  if(drag.moved)suppressUntil=Date.now()+500;
  try{drag.el.releasePointerCapture(e.pointerId);}catch(_){}
  drag=null;
}

function clickGuard(e){
  if(Date.now()>suppressUntil)return;
  if(!inCats(e.target))return;
  e.preventDefault();
  e.stopImmediatePropagation();
}

function wheel(e){
  var c=inCats(e.target);
  if(!c)return;

  constrainRail(c);
  if(c.scrollHeight<=c.clientHeight)return;

  c.scrollTop+=e.deltaY;
  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}

/* Capture before the editor's generic drag/gesture routers. */
document.addEventListener('pointerdown',pointerDown,true);
document.addEventListener('pointermove',pointerMove,{capture:true,passive:false});
document.addEventListener('pointerup',endPointer,true);
document.addEventListener('pointercancel',endPointer,true);
document.addEventListener('click',clickGuard,true);
document.addEventListener('wheel',wheel,{capture:true,passive:false});

window.addEventListener('resize',refresh);
window.addEventListener('orientationchange',refresh);
window.addEventListener('brotware:logic-refresh',refresh);

setTimeout(refresh,0);
setTimeout(refresh,250);
setTimeout(refresh,700);
setTimeout(refresh,1500);

window.BrotwareCategoryScrollFix={refresh:refresh};
})();
