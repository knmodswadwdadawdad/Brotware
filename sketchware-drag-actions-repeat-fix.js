(function(){
'use strict';

/*
 * Drag actions repeat guard.
 * Some mobile browsers leave the reusable Delete/Duplicate/Collection bar in a
 * stale hidden state after the first pointer session. The unified drag engine
 * still owns the actions/drop detection; this guard only guarantees that its
 * existing #sw5DragActions element is made visible on every subsequent
 * long-press drag of an already-placed statement block.
 */
var timer=0,startX=0,startY=0,pointerId=null,source=null;
var LONG_PRESS_GUARD=235,MOVE_CANCEL=11;

function logicOpen(){var ov=document.getElementById('swLogicOverlay');return !!(ov&&ov.classList.contains('show'));}
function interactive(t){return !!(t&&t.closest&&t.closest('select,input,textarea,option,[contenteditable="true"],.sw2-socket,.sw2-menu,.sw3-empty-socket,.sw3-input-host,.sw3-input-menu,.sw3-menu,.sw3-selector,.sw3-reporter[data-value-block-id]'));}
function bar(){return document.getElementById('sw5DragActions');}
function forceShow(){
  if(!logicOpen())return;
  var drag=window.BrotwareUnifiedLogicDrag;
  if(!drag||typeof drag.active!=='function'||!drag.active())return;
  var b=bar();
  if(!b)return;
  b.querySelectorAll('.hot').forEach(function(x){x.classList.remove('hot');});
  /* Restart display state from a clean frame on every drag. */
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  b.style.display='grid';
  b.style.visibility='visible';
  b.style.opacity='1';
}
function clearInline(){var b=bar();if(!b)return;b.style.removeProperty('display');b.style.removeProperty('visibility');b.style.removeProperty('opacity');}
function cancel(){clearTimeout(timer);timer=0;pointerId=null;source=null;}
function down(e){
  if(!logicOpen()||pointerId!==null)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(interactive(e.target))return;
  var block=e.target&&e.target.closest?e.target.closest('#swLogicOverlay .sw-block[data-block-id]'):null;
  if(!block)return;
  pointerId=e.pointerId;source=block;startX=e.clientX;startY=e.clientY;
  clearTimeout(timer);
  timer=setTimeout(function(){
    if(pointerId===null||!source||!source.isConnected)return;
    /* v4 begins at ~210 ms; retry once because DOM/class application may land
       on the following frame on Android/Chrome. */
    forceShow();setTimeout(forceShow,45);
  },LONG_PRESS_GUARD);
}
function move(e){if(pointerId===null||e.pointerId!==pointerId)return;if(Math.hypot(e.clientX-startX,e.clientY-startY)>MOVE_CANCEL&&!window.BrotwareUnifiedLogicDrag.active())cancel();}
function end(e){if(pointerId===null||e.pointerId!==pointerId)return;cancel();setTimeout(clearInline,0);}

window.addEventListener('pointerdown',down,true);
window.addEventListener('pointermove',move,true);
window.addEventListener('pointerup',end,true);
window.addEventListener('pointercancel',end,true);

/* Also cover sessions started by synthetic/legacy pointer routes. */
var mo=new MutationObserver(function(){
  if(!document.body.classList.contains('sw5-logic-dragging')){setTimeout(clearInline,0);return;}
  var src=document.querySelector('#swLogicOverlay .sw-block.sw5-drag-source[data-block-id]');
  if(src){requestAnimationFrame(forceShow);setTimeout(forceShow,50);}
});
mo.observe(document.body,{attributes:true,attributeFilter:['class']});
})();