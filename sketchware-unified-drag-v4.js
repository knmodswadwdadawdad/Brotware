(function(){
'use strict';

/* Unified Logic Drag v4
 * - one long-press drag router for statements/reporters
 * - mobile drag never scrolls the workspace under the finger
 * - existing statement drag exposes Delete / Duplicate / Collection drop zones
 * - controls/selects/sockets never start a statement drag accidentally
 */
var pending=null,session=null,ghost=null,hot=null,bad=null,sourceEl=null,actionBar=null,actionTarget='';
var suppressClickUntil=0;
var LONG_PRESS=210,MOVE_CANCEL=9;

function overlay(){return document.getElementById('swLogicOverlay');}
function stage(){return document.getElementById('swStage');}
function paletteScroll(){return document.getElementById('swPaletteScroll');}
function engine(){return window.BrotwareConnectionEngine||null;}
function graph(){return window.BrotwareBlockGraph||null;}
function typed(){return window.BrotwareTypedSockets||null;}
function mobile(){return window.matchMedia('(max-width:760px)').matches;}
function insideLogic(el){var ov=overlay();return !!(ov&&el&&ov.contains(el));}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c];});}
function icon(n){return'<span class="bw-google-icon">'+n+'</span>';}

function isInteractiveTarget(target){
  if(!target||!target.closest)return false;
  return !!target.closest('select,input,textarea,option,[contenteditable="true"],.sw2-socket,.sw2-menu,.sw3-empty-socket,.sw3-input-host,.sw3-input-menu,.sw3-menu,.sw3-selector');
}
function sourceInfo(target){
  if(!target||!target.closest||!insideLogic(target))return null;

  var reporterPalette=target.closest('.sw3-reporter-palette[data-sw3-template]');
  if(reporterPalette)return{kind:'reporter-template',el:reporterPalette,template:reporterPalette.dataset.sw3Template};

  var reporter=target.closest('.sw3-reporter[data-value-block-id]');
  if(reporter)return{kind:'reporter-existing',el:reporter,id:reporter.dataset.valueBlockId};

  /* A tap/press on a selector/socket belongs to that control, never to its parent statement. */
  if(isInteractiveTarget(target))return null;

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
function isStatementExisting(info){return !!(info&&info.kind==='statement-existing');}
function isReporterInfo(info){return !!(info&&(info.kind==='reporter-template'||info.kind==='reporter-existing'));}

function ensureGhost(){
  if(ghost&&!ghost.isConnected)ghost=null;
  if(ghost)return ghost;
  ghost=document.createElement('div');ghost.className='sw5-logic-drag-ghost';document.body.appendChild(ghost);return ghost;
}
function ghostMarkup(info,block){
  if(info.kind==='reporter-template'||info.kind==='reporter-existing'){
    var reporter=info.el.classList.contains('sw3-reporter')?info.el:info.el.querySelector('.sw3-reporter');if(reporter)return reporter.outerHTML;
  }
  if(info.kind==='statement-existing'){
    var main=info.el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main');if(main)return '<div class="sw5-ghost-command">'+main.innerHTML+'</div>';
  }
  var name='';try{name=(window.BLOCK_META&&BLOCK_META[block.type]&&BLOCK_META[block.type].name)||block.type;}catch(_){name=block.type||'block';}
  return '<div class="sw5-ghost-command">'+esc(name)+'</div>';
}
function showGhost(info,block,x,y){var g=ensureGhost();g.innerHTML=ghostMarkup(info,block);g.classList.add('show');moveGhost(x,y);}
function moveGhost(x,y){if(ghost){ghost.style.left=(x+14)+'px';ghost.style.top=(y+14)+'px';}}
function hideGhost(){if(ghost){ghost.classList.remove('show');ghost.innerHTML='';}}

function ensureActions(){
  /* The Logic renderer may rebuild/remove transient DOM. Never trust a stale ref. */
  if(actionBar&&!actionBar.isConnected)actionBar=null;
  if(!actionBar)actionBar=document.getElementById('sw5DragActions');
  if(!actionBar){
    actionBar=document.createElement('div');actionBar.id='sw5DragActions';actionBar.className='sw5-drag-actions';
    actionBar.innerHTML='<div class="sw5-drag-action" data-sw5-drag-action="delete">'+icon('backspace')+'<span>Delete</span></div><div class="sw5-drag-action" data-sw5-drag-action="duplicate">'+icon('content_copy')+'<span>Duplicate</span></div><div class="sw5-drag-action" data-sw5-drag-action="collection">'+icon('bookmark_border')+'<span>Collection</span></div>';
  }
  var host=overlay()||document.body;
  if(actionBar.parentNode!==host)host.appendChild(actionBar);
  return actionBar;
}
function showActions(){
  var b=ensureActions();
  b.querySelectorAll('.hot').forEach(function(x){x.classList.remove('hot');});
  b.hidden=false;
  b.style.setProperty('display','grid','important');
  b.style.setProperty('visibility','visible','important');
  b.style.setProperty('opacity','1','important');
  b.classList.add('show');
}
function hideActions(){
  if(actionBar){
    actionBar.classList.remove('show');
    actionBar.querySelectorAll('.hot').forEach(function(x){x.classList.remove('hot');});
    actionBar.style.removeProperty('display');
    actionBar.style.removeProperty('visibility');
    actionBar.style.removeProperty('opacity');
  }
  actionTarget='';
}
function actionAt(x,y){
  var b=ensureActions();
  if(!b.classList.contains('show'))return'';
  var found='';b.querySelectorAll('[data-sw5-drag-action]').forEach(function(el){var r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)found=el.dataset.sw5DragAction;});return found;
}
function highlightAction(name){
  var b=actionBar&&actionBar.isConnected?actionBar:null;if(!b)return;b.querySelectorAll('[data-sw5-drag-action]').forEach(function(el){el.classList.toggle('hot',el.dataset.sw5DragAction===name);});
}

function clearTargets(){
  if(hot){hot.classList.remove('hot');hot=null;}if(bad){bad.classList.remove('bad');bad=null;}highlightAction('');
}
function mobileDragScrollLock(){
  if(!mobile()||!session)return;
  var s=stage(),p=paletteScroll();
  if(s){s.scrollTop=session.stageTop;s.scrollLeft=session.stageLeft;}
  if(p){p.scrollTop=session.paletteTop;p.scrollLeft=session.paletteLeft;}
}
function autoScroll(x,y){
  /* On touch devices the block must follow the finger without the canvas moving. */
  if(mobile())return;
  var s=stage();if(!s)return;var r=s.getBoundingClientRect();
  if(x<r.left||x>r.right||y<r.top||y>r.bottom)return;
  var step=18;if(y<r.top+58)s.scrollTop-=step;else if(y>r.bottom-58)s.scrollTop+=step;if(x<r.left+48)s.scrollLeft-=step;else if(x>r.right-48)s.scrollLeft+=step;
}
function markIncompatibleSocket(x,y,block){
  var eng=engine();if(!eng||!eng.isReporter||!eng.isReporter(block))return;
  var el=document.elementFromPoint(x,y),host=el&&el.closest?el.closest('.sw3-input-host'):null;if(!host||!insideLogic(host))return;
  var accepts=String(host.dataset.sw3Accepts||'').split(',').map(function(v){return v.trim();}).filter(Boolean);
  var target={kind:'input',parentId:host.dataset.sw3Parent,key:host.dataset.sw3Key,accepts:accepts,element:host};
  if(eng.inputCompatible&&!eng.inputCompatible(block,target)){bad=host;bad.classList.add('bad');}
}
function update(x,y){
  if(!session)return;moveGhost(x,y);clearTargets();mobileDragScrollLock();
  if(isStatementExisting(session.info)){
    var b=ensureActions();
    if(!b.classList.contains('show'))showActions();
  }
  actionTarget=isStatementExisting(session.info)?actionAt(x,y):'';
  if(actionTarget){highlightAction(actionTarget);if(session.connection)session.connection.target=null;return;}
  var eng=engine(),target=eng&&eng.update?eng.update(session.connection,x,y):null;if(target&&target.element){hot=target.element;hot.classList.add('hot');}else markIncompatibleSocket(x,y,session.block);autoScroll(x,y);mobileDragScrollLock();
}
function saveAndRender(){
  try{if(window.BrotwareTypedSockets&&BrotwareTypedSockets.sync)BrotwareTypedSockets.sync();}catch(_){}
  try{if(typeof saveLogic==='function')saveLogic();}catch(_){}
  try{if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();}catch(_){}
  try{window.dispatchEvent(new CustomEvent('brotware:logic-refresh'));}catch(_){}
}
function deleteExisting(s){
  if(!s||!isExisting(s.info))return false;
  if(isReporterInfo(s.info)){var t=typed();if(!t||!t.detach)return false;var removed=t.detach(s.block.id);if(!removed)return false;}
  else{var g=graph();if(!g||!g.detach)return false;var d=g.detach(s.block.id,{silent:true});if(!d)return false;if(g.refresh)g.refresh();}
  saveAndRender();return true;
}
function cloneBlock(b){
  var c=JSON.parse(JSON.stringify(b));
  function regen(x){if(!x||typeof x!=='object')return;x.id='block-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);(x.children||[]).forEach(regen);(x.elseChildren||[]).forEach(regen);if(x.inputs)Object.keys(x.inputs).forEach(function(k){if(x.inputs[k]&&typeof x.inputs[k]==='object')regen(x.inputs[k]);});}
  regen(c);return c;
}
function duplicateExisting(s){
  if(!s||!isStatementExisting(s.info)||typeof findBlock!=='function')return false;var f=findBlock(s.block.id);if(!f)return false;f.list.splice(f.index+1,0,cloneBlock(f.block));saveAndRender();if(typeof toast==='function')toast('Bloco duplicado');return true;
}
function collectExisting(s){
  if(!s||!isStatementExisting(s.info))return false;try{var arr=JSON.parse(localStorage.getItem('brotware_block_collection_v1')||'[]');if(!Array.isArray(arr))arr=[];arr.push({savedAt:Date.now(),block:JSON.parse(JSON.stringify(s.block))});if(arr.length>50)arr=arr.slice(arr.length-50);localStorage.setItem('brotware_block_collection_v1',JSON.stringify(arr));if(typeof toast==='function')toast('Bloco adicionado à Collection');return true;}catch(e){console.error(e);return false;}
}
function runAction(s,name){if(name==='delete')return deleteExisting(s);if(name==='duplicate')return duplicateExisting(s);if(name==='collection')return collectExisting(s);return false;}

function cleanupDrag(){
  window.removeEventListener('pointermove',dragMove,true);window.removeEventListener('pointerup',dragUp,true);window.removeEventListener('pointercancel',dragCancel,true);
  clearTargets();hideGhost();hideActions();var ov=overlay();if(ov)ov.classList.remove('sw-dragging','sw5-dragging');document.body.classList.remove('sw5-logic-dragging');if(sourceEl){sourceEl.classList.remove('sw5-drag-source');sourceEl=null;}
}
function finish(cancelled){
  if(!session)return;var s=session,act=actionTarget;session=null;cleanupDrag();if(cancelled)return;
  suppressClickUntil=Date.now()+850;var ov=overlay();if(ov)ov.dataset.suppressClickUntil=String(suppressClickUntil);
  if(s.info&&s.info.el&&s.info.kind==='statement-template'){s.info.el.dataset.swSuppress='1';setTimeout(function(){try{s.info.el.dataset.swSuppress='0';}catch(_){}},900);}
  if(act&&runAction(s,act))return;
  var eng=engine();if(!s.connection||!s.connection.target||!eng||!eng.commit||!eng.commit(s.connection)){if(typeof toast==='function')toast(isReporterInfo(s.info)?'Esse valor não encaixa nessa entrada.':'Solte o bloco sobre um encaixe.');}
}
function dragMove(e){if(!session||e.pointerId!==session.pointerId)return;e.preventDefault();e.stopPropagation();update(e.clientX,e.clientY);}
function dragUp(e){if(!session||e.pointerId!==session.pointerId)return;e.preventDefault();e.stopPropagation();finish(false);}
function dragCancel(e){if(session&&e.pointerId===session.pointerId)finish(true);}
function blockTouchMove(e){if(session&&mobile()){e.preventDefault();}}

function begin(info,data){
  var eng=engine(),block=blockFromInfo(info);if(!eng||!block)return;var connection=eng.begin(block);if(!connection)return;
  var s=stage(),p=paletteScroll();session={info:info,block:block,connection:connection,pointerId:data.pointerId,stageTop:s?s.scrollTop:0,stageLeft:s?s.scrollLeft:0,paletteTop:p?p.scrollTop:0,paletteLeft:p?p.scrollLeft:0};
  sourceEl=info.el;if(sourceEl)sourceEl.classList.add('sw5-drag-source');var ov=overlay();if(ov)ov.classList.add('sw-dragging','sw5-dragging');document.body.classList.add('sw5-logic-dragging');
  if(isStatementExisting(info)){
    showActions();
    requestAnimationFrame(function(){if(session&&isStatementExisting(session.info))showActions();});
  }else hideActions();
  showGhost(info,block,data.clientX,data.clientY);window.addEventListener('pointermove',dragMove,true);window.addEventListener('pointerup',dragUp,true);window.addEventListener('pointercancel',dragCancel,true);update(data.clientX,data.clientY);
}
function cancelPending(){if(!pending)return;clearTimeout(pending.timer);window.removeEventListener('pointermove',pendingMove,true);window.removeEventListener('pointerup',pendingUp,true);window.removeEventListener('pointercancel',pendingCancel,true);pending=null;}
function pendingMove(e){
  if(!pending||e.pointerId!==pending.pointerId)return;var dx=e.clientX-pending.x,dy=e.clientY-pending.y,dist=Math.hypot(dx,dy);
  if(pending.panning){e.preventDefault();if(pending.scroller){pending.scroller.scrollTop=pending.startScrollTop-dy;pending.scroller.scrollLeft=pending.startScrollLeft-dx;}return;}
  if(dist>MOVE_CANCEL){clearTimeout(pending.timer);if(pending.scroller){pending.panning=true;e.preventDefault();pending.scroller.scrollTop=pending.startScrollTop-dy;pending.scroller.scrollLeft=pending.startScrollLeft-dx;}else cancelPending();}
}
function pendingUp(e){if(pending&&e.pointerId===pending.pointerId)cancelPending();}
function pendingCancel(e){if(pending&&e.pointerId===pending.pointerId)cancelPending();}
function pointerDown(e){
  if(session||pending)return;if(e.pointerType==='mouse'&&e.button!==0)return;var info=sourceInfo(e.target);if(!info)return;
  e.stopPropagation();var paletteScroller=info.el&&info.el.closest?info.el.closest('#swPaletteScroll,.sw-palette-scroll'):null;var workspaceScroller=!paletteScroller&&(info.kind==='statement-existing'||info.kind==='reporter-existing')?stage():null;var scroller=paletteScroller||workspaceScroller;
  pending={info:info,pointerId:e.pointerId,x:e.clientX,y:e.clientY,scroller:scroller,startScrollTop:scroller?scroller.scrollTop:0,startScrollLeft:scroller?scroller.scrollLeft:0,panning:false,data:{pointerId:e.pointerId,clientX:e.clientX,clientY:e.clientY}};
  pending.timer=setTimeout(function(){if(!pending)return;var p=pending;cancelPending();begin(p.info,p.data);},LONG_PRESS);window.addEventListener('pointermove',pendingMove,true);window.addEventListener('pointerup',pendingUp,true);window.addEventListener('pointercancel',pendingCancel,true);
}
function clickCapture(e){if(Date.now()>suppressClickUntil)return;if(insideLogic(e.target)){e.preventDefault();e.stopImmediatePropagation();}}

window.addEventListener('pointerdown',pointerDown,true);window.addEventListener('click',clickCapture,true);document.addEventListener('touchmove',blockTouchMove,{capture:true,passive:false});
window.BrotwareUnifiedLogicDrag={version:4.1,active:function(){return!!session;},cancel:function(){if(session)finish(true);else cancelPending();},refreshActions:function(){if(session&&isStatementExisting(session.info))showActions();}};
})();