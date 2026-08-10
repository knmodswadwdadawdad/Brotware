(function(){
'use strict';

var rail=null;
var gesture=null;
var suppressClickUntil=0;
var MOVE_START=3;

function mobile(){
  return window.matchMedia('(max-width:760px)').matches;
}

function findRail(){
  return document.getElementById('swPaletteCats') || document.querySelector('#swLogicOverlay .sw-palette-cats');
}

function ensureRail(){
  var next=findRail();
  if(!next)return null;

  if(rail!==next){
    unbind();
    rail=next;
    bind();
  }

  /* Reinforce the dedicated viewport in case another late stylesheet mutates it. */
  rail.style.setProperty('position','absolute','important');
  rail.style.setProperty('top','29px','important');
  rail.style.setProperty('right','0','important');
  rail.style.setProperty('bottom','0','important');
  rail.style.setProperty('left','auto','important');
  rail.style.setProperty('width','108px','important');
  rail.style.setProperty('height','auto','important');
  rail.style.setProperty('min-height','0','important');
  rail.style.setProperty('max-height','none','important');
  rail.style.setProperty('overflow-y','scroll','important');
  rail.style.setProperty('overflow-x','hidden','important');
  rail.style.setProperty('touch-action','none','important');
  rail.style.setProperty('pointer-events','auto','important');
  rail.style.setProperty('-webkit-overflow-scrolling','touch','important');

  return rail;
}

function pointerDown(e){
  if(!mobile()||!rail||!rail.contains(e.target))return;
  if(e.pointerType==='mouse'&&e.button!==0)return;

  gesture={
    id:e.pointerId,
    startX:e.clientX,
    startY:e.clientY,
    startTop:rail.scrollTop,
    moved:false
  };

  try{rail.setPointerCapture(e.pointerId);}catch(_){}
}

function pointerMove(e){
  if(!gesture||e.pointerId!==gesture.id||!rail)return;

  var dx=e.clientX-gesture.startX;
  var dy=e.clientY-gesture.startY;

  if(!gesture.moved){
    if(Math.hypot(dx,dy)<MOVE_START)return;
    if(Math.abs(dy)<Math.abs(dx))return;
    gesture.moved=true;
  }

  rail.scrollTop=gesture.startTop-dy;

  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}

function pointerEnd(e){
  if(!gesture||e.pointerId!==gesture.id)return;

  if(gesture.moved)suppressClickUntil=Date.now()+550;
  try{rail.releasePointerCapture(e.pointerId);}catch(_){}
  gesture=null;
}

function clickGuard(e){
  if(Date.now()>suppressClickUntil)return;
  e.preventDefault();
  e.stopImmediatePropagation();
}

function wheel(e){
  if(!mobile()||!rail)return;
  if(rail.scrollHeight<=rail.clientHeight)return;

  rail.scrollTop+=e.deltaY;
  if(e.cancelable)e.preventDefault();
  e.stopPropagation();
}

function bind(){
  if(!rail||rail.dataset.bwCategoryRailV2==='1')return;
  rail.dataset.bwCategoryRailV2='1';
  rail.addEventListener('pointerdown',pointerDown,{passive:true});
  rail.addEventListener('pointermove',pointerMove,{passive:false});
  rail.addEventListener('pointerup',pointerEnd,{passive:true});
  rail.addEventListener('pointercancel',pointerEnd,{passive:true});
  rail.addEventListener('click',clickGuard,true);
  rail.addEventListener('wheel',wheel,{passive:false});
}

function unbind(){
  if(!rail||rail.dataset.bwCategoryRailV2!=='1')return;
  rail.removeEventListener('pointerdown',pointerDown);
  rail.removeEventListener('pointermove',pointerMove);
  rail.removeEventListener('pointerup',pointerEnd);
  rail.removeEventListener('pointercancel',pointerEnd);
  rail.removeEventListener('click',clickGuard,true);
  rail.removeEventListener('wheel',wheel);
  delete rail.dataset.bwCategoryRailV2;
  gesture=null;
}

function refresh(){
  var r=ensureRail();
  if(!r)return;

  /* Preserve current scroll, only clamp if the list became shorter. */
  var max=Math.max(0,r.scrollHeight-r.clientHeight);
  if(r.scrollTop>max)r.scrollTop=max;
}

function debug(){
  var r=ensureRail();
  if(!r)return null;
  var cs=getComputedStyle(r);
  return{
    clientHeight:r.clientHeight,
    scrollHeight:r.scrollHeight,
    scrollTop:r.scrollTop,
    maxScrollTop:Math.max(0,r.scrollHeight-r.clientHeight),
    overflowY:cs.overflowY,
    touchAction:cs.touchAction,
    pointerEvents:cs.pointerEvents
  };
}

window.addEventListener('resize',function(){setTimeout(refresh,0);});
window.addEventListener('orientationchange',function(){setTimeout(refresh,60);});
window.addEventListener('brotware:logic-refresh',function(){setTimeout(refresh,0);});

setTimeout(refresh,0);
setTimeout(refresh,250);
setTimeout(refresh,700);
setTimeout(refresh,1500);

window.BrotwareCategoryRailV2={refresh:refresh,debug:debug};
})();
