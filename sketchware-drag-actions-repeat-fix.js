(function(){
'use strict';

/*
 * Drag actions repeat/visibility guard.
 * The unified drag engine owns the actual actions and drop detection. This guard
 * guarantees that the same bar is visible on every drag of an already-placed
 * statement, and positions it immediately above the Sketchware block palette.
 */
var timer=0,startX=0,startY=0,pointerId=null,source=null;
var LONG_PRESS_GUARD=220,MOVE_CANCEL=12;

function logicOpen(){var ov=document.getElementById('swLogicOverlay');return !!(ov&&ov.classList.contains('show'));}
function interactive(t){return !!(t&&t.closest&&t.closest('select,input,textarea,option,[contenteditable="true"],.sw2-socket,.sw2-menu,.sw3-empty-socket,.sw3-input-host,.sw3-input-menu,.sw3-menu,.sw3-selector,.sw3-reporter[data-value-block-id]'));}
function bar(){return document.getElementById('sw5DragActions');}
function isPlacedBlock(el){return !!(el&&el.matches&&el.matches('#swLogicOverlay .sw-block[data-block-id]')&&!el.closest('#swPalette'))}
function paletteBottomOffset(){
  var p=document.getElementById('swPalette'),ov=document.getElementById('swLogicOverlay');
  if(!p||!ov||ov.classList.contains('sw4-palette-collapsed'))return 0;
  var r=p.getBoundingClientRect();
  if(r.height<5||r.top>=window.innerHeight)return 0;
  return Math.max(0,Math.round(window.innerHeight-r.top));
}
function forceShow(){
  if(!logicOpen())return;
  var drag=window.BrotwareUnifiedLogicDrag;
  if(!drag||typeof drag.active!=='function'||!drag.active())return;
  var src=document.querySelector('#swLogicOverlay .sw-block.sw5-drag-source[data-block-id]');
  if(!isPlacedBlock(src))return;
  var b=bar();if(!b)return;
  b.querySelectorAll('.hot').forEach(function(x){x.classList.remove('hot');});
  b.classList.add('show');
  b.style.setProperty('display','grid','important');
  b.style.setProperty('visibility','visible','important');
  b.style.setProperty('opacity','1','important');
  b.style.setProperty('z-index','2147483000','important');
  b.style.setProperty('top','auto','important');
  b.style.setProperty('bottom',paletteBottomOffset()+'px','important');
}
function clearInline(){
  var b=bar();if(!b)return;
  ['display','visibility','opacity','z-index','top','bottom'].forEach(function(p){b.style.removeProperty(p);});
}
function cancel(){clearTimeout(timer);timer=0;pointerId=null;source=null;}
function down(e){
  if(!logicOpen()||pointerId!==null)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(interactive(e.target))return;
  var block=e.target&&e.target.closest?e.target.closest('#swLogicOverlay .sw-block[data-block-id]'):null;
  if(!isPlacedBlock(block))return;
  pointerId=e.pointerId;source=block;startX=e.clientX;startY=e.clientY;
  clearTimeout(timer);
  timer=setTimeout(function(){
    if(pointerId===null||!source||!source.isConnected)return;
    forceShow();requestAnimationFrame(forceShow);setTimeout(forceShow,55);setTimeout(forceShow,120);
  },LONG_PRESS_GUARD);
}
function move(e){
  if(pointerId===null||e.pointerId!==pointerId)return;
  if(window.BrotwareUnifiedLogicDrag&&BrotwareUnifiedLogicDrag.active()){forceShow();return;}
  if(Math.hypot(e.clientX-startX,e.clientY-startY)>MOVE_CANCEL)cancel();
}
function end(e){if(pointerId===null||e.pointerId!==pointerId)return;cancel();setTimeout(clearInline,30);}

window.addEventListener('pointerdown',down,true);
window.addEventListener('pointermove',move,true);
window.addEventListener('pointerup',end,true);
window.addEventListener('pointercancel',end,true);
window.addEventListener('resize',function(){if(window.BrotwareUnifiedLogicDrag&&BrotwareUnifiedLogicDrag.active())forceShow();});

/* The body class is applied by the unified drag engine. Re-show on every class
   transition so a previous drag can never leave the bar stale/hidden. */
var mo=new MutationObserver(function(){
  if(!document.body.classList.contains('sw5-logic-dragging')){setTimeout(clearInline,30);return;}
  requestAnimationFrame(forceShow);setTimeout(forceShow,45);setTimeout(forceShow,110);
});
mo.observe(document.body,{attributes:true,attributeFilter:['class']});
})();
