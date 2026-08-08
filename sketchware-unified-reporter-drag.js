(function(){
'use strict';

/*
 * Phase 2 of the Sketchware-style drag migration.
 * Only reporter/value blocks are routed through BrotwareConnectionEngine.
 * Statement/C-block dragging remains handled by sketchware-logic.js for now.
 */

var pending=null,session=null,ghost=null,hot=null,suppressClickUntil=0;

function engine(){return window.BrotwareConnectionEngine||null;}
function graph(){return window.BrotwareBlockGraph||null;}
function targetInfo(el){
  if(!el||!el.closest)return null;
  var palette=el.closest('.sw3-reporter-palette[data-sw3-template]');
  if(palette)return{kind:'palette',element:palette};
  var reporter=el.closest('.sw3-reporter[data-value-block-id]');
  if(reporter)return{kind:'existing',element:reporter,id:reporter.dataset.valueBlockId};
  return null;
}
function reporterFromPalette(info){
  var typed=window.BrotwareTypedSockets;if(!typed||!typed.createReporter)return null;
  return typed.createReporter(info.element.dataset.sw3Template);
}
function blockFor(info){
  if(!info)return null;
  if(info.kind==='palette')return reporterFromPalette(info);
  var g=graph();return g&&g.find(info.id);
}
function clearHot(){
  if(hot){hot.classList.remove('hot');hot=null;}
}
function ensureGhost(){
  if(ghost)return ghost;
  ghost=document.createElement('div');ghost.className='sw4-connection-ghost';
  ghost.style.cssText='position:fixed;left:0;top:0;z-index:2147483000;pointer-events:none;display:none;filter:drop-shadow(0 6px 12px rgba(0,0,0,.32));transform-origin:0 0;';
  document.body.appendChild(ghost);return ghost;
}
function showGhost(info,block,x,y){
  var g=ensureGhost(),source=info.element;
  var visual=info.kind==='palette'?source.querySelector('.sw3-reporter'):source;
  if(visual)g.innerHTML=visual.outerHTML;
  else g.textContent=block&&block.type||'value';
  g.style.display='block';moveGhost(x,y);
}
function moveGhost(x,y){if(!ghost)return;ghost.style.transform='translate('+(x+14)+'px,'+(y+14)+'px) scale(.96)';}
function hideGhost(){if(ghost)ghost.style.display='none';}
function cleanupPending(){
  if(!pending)return;
  clearTimeout(pending.timer);
  window.removeEventListener('pointermove',pendingMove,true);
  window.removeEventListener('pointerup',pendingUp,true);
  window.removeEventListener('pointercancel',pendingCancel,true);
  pending=null;
}
function pendingMove(e){
  if(!pending||e.pointerId!==pending.pointerId)return;
  if(Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>8)cleanupPending();
}
function pendingUp(e){if(pending&&e.pointerId===pending.pointerId)cleanupPending();}
function pendingCancel(e){if(pending&&e.pointerId===pending.pointerId)cleanupPending();}
function startDrag(info,e){
  var eng=engine(),block=blockFor(info);if(!eng||!block)return;
  session=eng.begin(block)||{block:block,origin:null,target:null};
  suppressClickUntil=Date.now()+800;
  session.pointerId=e.pointerId;session.sourceInfo=info;
  showGhost(info,block,e.clientX,e.clientY);
  document.body.classList.add('sw4-reporter-dragging');
  window.addEventListener('pointermove',dragMove,true);
  window.addEventListener('pointerup',dragUp,true);
  window.addEventListener('pointercancel',dragCancel,true);
  update(e.clientX,e.clientY);
}
function update(x,y){
  if(!session)return;var eng=engine();moveGhost(x,y);clearHot();
  var target=eng&&eng.update(session,x,y);
  if(target&&target.element){hot=target.element;hot.classList.add('hot');}
}
function finish(cancelled){
  if(!session)return;var s=session,eng=engine();
  window.removeEventListener('pointermove',dragMove,true);
  window.removeEventListener('pointerup',dragUp,true);
  window.removeEventListener('pointercancel',dragCancel,true);
  clearHot();hideGhost();document.body.classList.remove('sw4-reporter-dragging');session=null;
  if(cancelled||!s.target){if(eng)eng.cancel(s);return;}
  if(!eng||!eng.commit(s)){
    if(typeof toast==='function')toast('Esse bloco não encaixa nessa entrada.');
  }
}
function dragMove(e){
  if(!session||e.pointerId!==session.pointerId)return;
  e.preventDefault();e.stopPropagation();update(e.clientX,e.clientY);
}
function dragUp(e){
  if(!session||e.pointerId!==session.pointerId)return;
  e.preventDefault();e.stopPropagation();finish(false);
}
function dragCancel(e){if(session&&e.pointerId===session.pointerId)finish(true);}

function capturePointerDown(e){
  if(session||pending)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  var info=targetInfo(e.target);if(!info)return;
  /* Stop the legacy reporter long-press handler, but leave click events alone. */
  e.stopPropagation();
  pending={pointerId:e.pointerId,x:e.clientX,y:e.clientY,info:info,eventData:{pointerId:e.pointerId,clientX:e.clientX,clientY:e.clientY}};
  pending.timer=setTimeout(function(){
    if(!pending)return;var p=pending;cleanupPending();
    startDrag(p.info,p.eventData);
  },220);
  window.addEventListener('pointermove',pendingMove,true);
  window.addEventListener('pointerup',pendingUp,true);
  window.addEventListener('pointercancel',pendingCancel,true);
}

function captureClick(e){
  if(Date.now()>suppressClickUntil)return;
  if(targetInfo(e.target)){e.preventDefault();e.stopPropagation();}
}

window.addEventListener('pointerdown',capturePointerDown,true);
window.addEventListener('click',captureClick,true);

window.BrotwareReporterDragV2={
  active:function(){return !!session;},
  cancel:function(){if(session)finish(true);else cleanupPending();}
};
})();
