(function(){
'use strict';

/*
 * Brotware unified Sketchware-style drag session.
 * This is the only long-press drag router for Logic blocks:
 * - statements / C-blocks -> stack insertion slots
 * - reporter/value blocks -> typed input sockets
 *
 * Tap/click behavior is still owned by the existing editor. We intercept only
 * pointerdown long-press so the old parallel drag implementations never race.
 */
var pending=null,session=null,ghost=null,hot=null,bad=null,sourceEl=null;
var suppressClickUntil=0;
var LONG_PRESS=230,MOVE_CANCEL=9;

function overlay(){return document.getElementById('swLogicOverlay');}
function stage(){return document.getElementById('swStage');}
function deleteZone(){return document.getElementById('swDragDelete');}
function engine(){return window.BrotwareConnectionEngine||null;}
function graph(){return window.BrotwareBlockGraph||null;}
function typed(){return window.BrotwareTypedSockets||null;}
function insideLogic(el){var ov=overlay();return !!(ov&&el&&ov.contains(el));}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}

function sourceInfo(target){
  if(!target||!target.closest||!insideLogic(target))return null;

  var reporterPalette=target.closest('.sw3-reporter-palette[data-sw3-template]');
  if(reporterPalette)return{kind:'reporter-template',el:reporterPalette,template:reporterPalette.dataset.sw3Template};

  var reporter=target.closest('.sw3-reporter[data-value-block-id]');
  if(reporter)return{kind:'reporter-existing',el:reporter,id:reporter.dataset.valueBlockId};

  var standard=target.closest('.sw-standard-item[data-sw-standard-type]');
  if(standard)return{kind:'statement-template',el:standard,type:standard.dataset.swStandardType,source:'standard'};

  var list=target.closest('.sw-list-special[data-list-type]');
  if(list)return{kind:'statement-template',el:list,type:list.dataset.listType,source:'list'};

  var palette=target.closest('.sw-palette-item[data-sw-type]');
  if(palette)return{kind:'statement-template',el:palette,type:palette.dataset.swType,source:'base'};

  var block=target.closest('.sw-block[data-block-id]');
  if(block)return{kind:'statement-existing',el:block,id:block.dataset.blockId};

  return null;
}
function inferPreset(info,block){
  if(!info||!block||info.source!=='base')return block;
  var txt=String(info.el.textContent||'').toLowerCase();
  if(block.type==='if'){
    if(txt.indexOf('!=')>=0)block.props.op='!=';
    else if(txt.indexOf('contains')>=0)block.props.op='contains';
    else if(txt.indexOf('truthy')>=0)block.props.op='truthy';
    else if(txt.indexOf('==')>=0)block.props.op='==';
    if(info.el.dataset.swEntryCat==='operator')block.__swCategory='control';
  }
  return block;
}
function blockFromInfo(info){
  if(!info)return null;
  if(info.kind==='reporter-template'){
    var t=typed();return t&&t.createReporter?t.createReporter(info.template):null;
  }
  if(info.kind==='reporter-existing'||info.kind==='statement-existing'){
    var g=graph();return g&&g.find?g.find(info.id):null;
  }
  if(info.kind==='statement-template'){
    if(typeof newBlock!=='function')return null;
    var b=inferPreset(info,newBlock(info.type));
    if(info.source==='list')b.__swCategory='list';
    return b;
  }
  return null;
}
function isExisting(info){return !!(info&&(info.kind==='statement-existing'||info.kind==='reporter-existing'));}
function isReporterInfo(info){return !!(info&&(info.kind==='reporter-template'||info.kind==='reporter-existing'));}

function ensureGhost(){
  if(ghost)return ghost;
  ghost=document.createElement('div');
  ghost.className='sw5-logic-drag-ghost';
  document.body.appendChild(ghost);
  return ghost;
}
function ghostMarkup(info,block){
  if(info.kind==='reporter-template'||info.kind==='reporter-existing'){
    var reporter=info.el.classList.contains('sw3-reporter')?info.el:info.el.querySelector('.sw3-reporter');
    if(reporter)return reporter.outerHTML;
  }
  if(info.kind==='statement-existing'){
    var main=info.el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main');
    if(main)return '<div class="sw5-ghost-command">'+main.innerHTML+'</div>';
  }
  var name='';
  try{name=(window.BLOCK_META&&BLOCK_META[block.type]&&BLOCK_META[block.type].name)||block.type;}catch(_){name=block.type||'block';}
  return '<div class="sw5-ghost-command">'+esc(name)+'</div>';
}
function showGhost(info,block,x,y){
  var g=ensureGhost();g.innerHTML=ghostMarkup(info,block);g.classList.add('show');moveGhost(x,y);
}
function moveGhost(x,y){if(ghost){ghost.style.left=(x+14)+'px';ghost.style.top=(y+14)+'px';}}
function hideGhost(){if(ghost){ghost.classList.remove('show');ghost.innerHTML='';}}

function clearTargets(){
  if(hot){hot.classList.remove('hot');hot=null;}
  if(bad){bad.classList.remove('bad');bad=null;}
  var dz=deleteZone();if(dz)dz.classList.remove('hot');
}
function pointInside(el,x,y){
  if(!el)return false;var r=el.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}
function autoScroll(x,y){
  var s=stage();if(!s)return;var r=s.getBoundingClientRect(),step=18;
  if(y<r.top+58)s.scrollTop-=step;else if(y>r.bottom-58)s.scrollTop+=step;
  if(x<r.left+48)s.scrollLeft-=step;else if(x>r.right-48)s.scrollLeft+=step;
}
function markIncompatibleSocket(x,y,block){
  var eng=engine();if(!eng||!eng.isReporter||!eng.isReporter(block))return;
  var el=document.elementFromPoint(x,y),host=el&&el.closest?el.closest('.sw3-input-host'):null;
  if(!host||!insideLogic(host))return;
  var accepts=String(host.dataset.sw3Accepts||'').split(',').map(function(v){return v.trim();}).filter(Boolean);
  var target={kind:'input',parentId:host.dataset.sw3Parent,key:host.dataset.sw3Key,accepts:accepts,element:host};
  if(eng.inputCompatible&&!eng.inputCompatible(block,target)){bad=host;bad.classList.add('bad');}
}
function update(x,y){
  if(!session)return;
  moveGhost(x,y);clearTargets();
  session.deleteTarget=false;
  if(isExisting(session.info)&&pointInside(deleteZone(),x,y)){
    session.deleteTarget=true;var dz=deleteZone();if(dz)dz.classList.add('hot');session.connection.target=null;autoScroll(x,y);return;
  }
  var eng=engine(),target=eng&&eng.update?eng.update(session.connection,x,y):null;
  if(target&&target.element){hot=target.element;hot.classList.add('hot');}
  else markIncompatibleSocket(x,y,session.block);
  autoScroll(x,y);
}
function saveAndRender(){
  try{if(window.BrotwareTypedSockets&&BrotwareTypedSockets.sync)BrotwareTypedSockets.sync();}catch(_){}
  try{if(typeof saveLogic==='function')saveLogic();}catch(_){}
  try{if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();}catch(_){}
  try{window.dispatchEvent(new CustomEvent('brotware:logic-refresh'));}catch(_){}
}
function deleteExisting(s){
  if(!s||!isExisting(s.info))return false;
  if(isReporterInfo(s.info)){
    var t=typed();if(!t||!t.detach)return false;
    var removed=t.detach(s.block.id);if(!removed)return false;
  }else{
    var g=graph();if(!g||!g.detach)return false;
    var d=g.detach(s.block.id,{silent:true});if(!d)return false;
    if(g.refresh)g.refresh();
  }
  saveAndRender();return true;
}
function cleanupDrag(){
  window.removeEventListener('pointermove',dragMove,true);
  window.removeEventListener('pointerup',dragUp,true);
  window.removeEventListener('pointercancel',dragCancel,true);
  clearTargets();hideGhost();
  var ov=overlay();if(ov)ov.classList.remove('sw-dragging','sw5-dragging');
  document.body.classList.remove('sw5-logic-dragging');
  if(sourceEl){sourceEl.classList.remove('sw5-drag-source');sourceEl=null;}
}
function finish(cancelled){
  if(!session)return;var s=session;session=null;cleanupDrag();
  if(cancelled)return;
  suppressClickUntil=Date.now()+850;
  var ov=overlay();if(ov)ov.dataset.suppressClickUntil=String(suppressClickUntil);
  if(s.info&&s.info.el&&s.info.kind==='statement-template'){
    s.info.el.dataset.swSuppress='1';setTimeout(function(){try{s.info.el.dataset.swSuppress='0';}catch(_){}},900);
  }
  if(s.deleteTarget){deleteExisting(s);return;}
  var eng=engine();
  if(!s.connection||!s.connection.target||!eng||!eng.commit||!eng.commit(s.connection)){
    if(typeof toast==='function')toast(isReporterInfo(s.info)?'Esse valor não encaixa nessa entrada.':'Solte o bloco sobre um encaixe.');
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

function begin(info,data){
  var eng=engine(),block=blockFromInfo(info);if(!eng||!block)return;
  var connection=eng.begin(block);if(!connection)return;
  session={info:info,block:block,connection:connection,pointerId:data.pointerId,deleteTarget:false};
  sourceEl=info.el;if(sourceEl)sourceEl.classList.add('sw5-drag-source');
  var ov=overlay();if(ov)ov.classList.add('sw-dragging','sw5-dragging');
  document.body.classList.add('sw5-logic-dragging');
  showGhost(info,block,data.clientX,data.clientY);
  window.addEventListener('pointermove',dragMove,true);
  window.addEventListener('pointerup',dragUp,true);
  window.addEventListener('pointercancel',dragCancel,true);
  update(data.clientX,data.clientY);
}
function cancelPending(){
  if(!pending)return;
  clearTimeout(pending.timer);
  window.removeEventListener('pointermove',pendingMove,true);
  window.removeEventListener('pointerup',pendingUp,true);
  window.removeEventListener('pointercancel',pendingCancel,true);
  pending=null;
}
function pendingMove(e){
  if(!pending||e.pointerId!==pending.pointerId)return;
  if(Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>MOVE_CANCEL)cancelPending();
}
function pendingUp(e){if(pending&&e.pointerId===pending.pointerId)cancelPending();}
function pendingCancel(e){if(pending&&e.pointerId===pending.pointerId)cancelPending();}
function pointerDown(e){
  if(session||pending)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  var info=sourceInfo(e.target);if(!info)return;

  /* Window capture runs before the old overlay/flow drag listeners. */
  e.stopPropagation();

  pending={
    info:info,pointerId:e.pointerId,x:e.clientX,y:e.clientY,
    data:{pointerId:e.pointerId,clientX:e.clientX,clientY:e.clientY}
  };
  pending.timer=setTimeout(function(){
    if(!pending)return;var p=pending;cancelPending();begin(p.info,p.data);
  },LONG_PRESS);
  window.addEventListener('pointermove',pendingMove,true);
  window.addEventListener('pointerup',pendingUp,true);
  window.addEventListener('pointercancel',pendingCancel,true);
}
function clickCapture(e){
  if(Date.now()>suppressClickUntil)return;
  if(insideLogic(e.target)){
    e.preventDefault();e.stopImmediatePropagation();
  }
}

window.addEventListener('pointerdown',pointerDown,true);
window.addEventListener('click',clickCapture,true);

window.BrotwareUnifiedLogicDrag={
  version:3,
  active:function(){return !!session;},
  cancel:function(){if(session)finish(true);else cancelPending();}
};
})();