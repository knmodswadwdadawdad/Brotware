(function(){
'use strict';
var g=null,suppressUntil=0;
function cats(){return document.querySelector('#swLogicOverlay .sw-palette-cats');}
function inCats(t){var c=cats();return c&&t&&c.contains(t)?c:null;}
function point(e){var t=e.touches&&e.touches[0];return t?{x:t.clientX,y:t.clientY}:null;}
function start(e){
  var c=inCats(e.target),p=point(e);if(!c||!p)return;
  g={el:c,startX:p.x,startY:p.y,startTop:c.scrollTop,moved:false};
}
function move(e){
  if(!g)return;var p=point(e);if(!p)return;
  var dx=p.x-g.startX,dy=p.y-g.startY;
  if(!g.moved&&Math.hypot(dx,dy)<4)return;
  g.moved=true;
  g.el.scrollTop=g.startTop-dy;
  e.preventDefault();
  e.stopPropagation();
}
function end(){
  if(g&&g.moved)suppressUntil=Date.now()+450;
  g=null;
}
function clickGuard(e){
  if(Date.now()>suppressUntil)return;
  var c=inCats(e.target);if(!c)return;
  e.preventDefault();e.stopImmediatePropagation();
}
function refresh(){
  var c=cats();if(!c)return;
  c.style.overflowY='auto';
  c.style.minHeight='0';
  c.style.maxHeight='100%';
}
document.addEventListener('touchstart',start,{capture:true,passive:true});
document.addEventListener('touchmove',move,{capture:true,passive:false});
document.addEventListener('touchend',end,true);
document.addEventListener('touchcancel',end,true);
document.addEventListener('click',clickGuard,true);
window.addEventListener('brotware:logic-refresh',refresh);
setTimeout(refresh,0);setTimeout(refresh,500);setTimeout(refresh,1200);
window.BrotwareCategoryScrollFix={refresh:refresh};
})();
