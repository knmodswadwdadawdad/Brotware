(function(){
'use strict';

var screen=document.getElementById('screen-event');
var logicCanvas=document.getElementById('logicCanvas');
var logicRoot=document.getElementById('logicRoot');
var library=document.querySelector('#screen-event>.blocks-library');
if(!screen||!logicCanvas||!logicRoot||!library)return;

var EVENT_INFO={
  load:['onCreate','On activity create'],imports:['Import','Add custom imports'],initializeLogic:['initializeLogic','On activity create'],
  activityResult:['onActivityResult','On activity result'],back:['onBackPressed','On back button press'],postcreate:['onPostCreate','On activity startup complete'],
  start:['onStart','On activity becoming visible'],resume:['onResume','On activity resume'],pause:['onPause','On activity pause'],stop:['onStop','On activity no longer visible'],
  destroy:['onDestroy','On activity destroyed'],saveInstanceState:['onSaveInstanceState','Save activity state'],restoreInstanceState:['onRestoreInstanceState','Restore activity state'],
  newIntent:['onNewIntent','On new navigation intent'],windowFocusChanged:['onWindowFocusChanged','On window focus changed'],
  click:['onClick','On view click'],dblclick:['onDoubleClick','On view double click'],input:['onInput','On input'],change:['onChange','On value change'],
  focus:['onFocus','On view focus'],blur:['onBlur','On view blur'],keydown:['onKeyDown','On key down'],keyup:['onKeyUp','On key up'],
  mouseenter:['onMouseEnter','On pointer enter'],mouseleave:['onMouseLeave','On pointer leave'],online:['onOnline','On network online'],offline:['onOffline','On network offline'],
  resize:['onWindowResize','On window resize'],message:['onMessage','On external message'],drawerOpen:['onDrawerOpened','On drawer opened'],drawerClose:['onDrawerClosed','On drawer closed']
};
var activeCategory='all';
var built=false;
var touchJob=null;

function niceEvent(){
  if(state.logicMode==='function'){
    var fn=state.functions.find(function(f){return f.id===state.activeFunctionId;});
    return [fn?fn.name:'Moreblock','Reusable function'];
  }
  var key=(document.getElementById('eventTypeSelect')||{}).value||'load';
  return EVENT_INFO[key]||[key,'Event logic'];
}
function isLogicOpen(){
  return screen.classList.contains('active')&&!screen.classList.contains('sk-event-home');
}
function updateOpenState(){
  var open=isLogicOpen();
  document.body.classList.toggle('sk-logic-open',open&&window.matchMedia('(max-width:760px)').matches);
  if(!open){screen.classList.remove('blocks-open');cancelTouch();}
  if(open){decorate();updateHeader();}
}
function updateHeader(){
  var info=niceEvent();
  var title=document.getElementById('logicTitle'),sub=document.getElementById('logicSubtitle'),badge=document.getElementById('logicEventBadge');
  if(title)title.textContent=info[0];
  if(sub)sub.textContent=info[1];
  if(badge)badge.textContent=info[1];
  var back=document.getElementById('skBackEvents');
  if(back){back.title='Voltar para eventos';back.setAttribute('aria-label','Voltar para eventos');}
}

function decorate(){
  if(!document.getElementById('logicEventBadge')){
    var badge=document.createElement('div');badge.id='logicEventBadge';badge.className='logic-event-badge';badge.textContent='On activity create';
    logicCanvas.insertBefore(badge,logicCanvas.firstChild);
  }
  if(!document.getElementById('skBlocksFab')){
    var fab=document.createElement('button');fab.id='skBlocksFab';fab.className='sk-blocks-fab';fab.innerHTML='🧩';fab.title='Adicionar blocos';fab.setAttribute('aria-label','Adicionar blocos');
    fab.onclick=function(){screen.classList.add('blocks-open');filterBlocks();};
    screen.appendChild(fab);
  }
  if(!document.getElementById('blocksSheetBackdrop')){
    var bd=document.createElement('div');bd.id='blocksSheetBackdrop';bd.className='blocks-sheet-backdrop';bd.onclick=closeSheet;screen.insertBefore(bd,library);
  }
  if(!built)buildSheet();
}

function buildSheet(){
  built=true;
  var head=document.createElement('div');head.className='blocks-sheet-head';head.innerHTML='<span class="blocks-sheet-title">Blocos</span><span class="blocks-sheet-grab"></span><button class="blocks-sheet-close" id="blocksSheetClose">×</button>';
  library.insertBefore(head,library.firstChild);
  document.getElementById('blocksSheetClose').onclick=closeSheet;

  var search=document.createElement('div');search.className='blocks-sheet-search';search.innerHTML='<input id="blocksSearch" placeholder="Search blocks...">';
  library.insertBefore(search,head.nextSibling);
  document.getElementById('blocksSearch').addEventListener('input',filterBlocks);

  var cats=document.createElement('div');cats.className='blocks-sheet-cats';
  var data=[['all','Todos'],['data','Variable'],['control','Control'],['ui','View'],['storage','File'],['component','Component'],['debug','Debug']];
  data.forEach(function(x){var b=document.createElement('button');b.className='blocks-sheet-cat'+(x[0]==='all'?' active':'');b.dataset.blockCat=x[0];b.textContent=x[1];cats.appendChild(b);});
  library.insertBefore(cats,search.nextSibling);
  cats.addEventListener('click',function(e){var b=e.target.closest('[data-block-cat]');if(!b)return;activeCategory=b.dataset.blockCat;cats.querySelectorAll('.blocks-sheet-cat').forEach(function(x){x.classList.toggle('active',x===b);});filterBlocks();});

  var tools=document.createElement('div');tools.className='blocks-sheet-variable-tools';
  tools.innerHTML='<button id="sheetAddVariable">Add variable</button><button id="sheetAddFunction">Moreblock</button><button id="sheetClearLogic">Clear blocks</button>';
  library.insertBefore(tools,cats.nextSibling);
  document.getElementById('sheetAddVariable').onclick=function(){if(typeof addVariable==='function')addVariable();};
  document.getElementById('sheetAddFunction').onclick=function(){if(typeof addFunction==='function')addFunction();};
  document.getElementById('sheetClearLogic').onclick=function(){if(typeof clearLogic==='function')clearLogic();};

  bindTouchTemplates();
}

function closeSheet(){screen.classList.remove('blocks-open');cancelTouch();}
function catMatch(el){
  if(activeCategory==='all')return true;
  if(activeCategory==='data')return el.classList.contains('data');
  if(activeCategory==='control')return el.classList.contains('flow')||el.classList.contains('time');
  if(activeCategory==='ui')return el.classList.contains('ui');
  if(activeCategory==='storage')return el.classList.contains('storage');
  if(activeCategory==='component')return el.classList.contains('network')||el.classList.contains('function');
  if(activeCategory==='debug')return el.classList.contains('debug');
  return true;
}
function filterBlocks(){
  var query=(document.getElementById('blocksSearch')||{}).value||'';query=query.toLowerCase().trim();
  library.querySelectorAll('.block-template').forEach(function(el){
    var ok=catMatch(el)&&(!query||el.textContent.toLowerCase().indexOf(query)>=0);el.style.display=ok?'':'none';
  });
  library.querySelectorAll('.block-category').forEach(function(el){el.style.display=query||activeCategory!=='all'?'none':'';});
}

function slotAt(x,y,draggedBlock){
  var el=document.elementFromPoint(x,y);if(!el)return null;
  var slot=el.closest('[data-block-slot]');if(!slot)return null;
  if(draggedBlock){
    var host=slot.closest('.logic-block');
    if(host&&(host.dataset.blockId===draggedBlock.dataset.blockId||draggedBlock.contains(host)))return null;
  }
  return slot;
}
function clearSlotHighlight(){document.querySelectorAll('[data-block-slot].drag-over').forEach(function(x){x.classList.remove('drag-over');});}
function ghost(text){
  var g=document.getElementById('skTouchBlockGhost');
  if(!g){g=document.createElement('div');g.id='skTouchBlockGhost';g.style.cssText='position:fixed;z-index:3000;pointer-events:none;max-width:190px;padding:9px 12px;border-radius:10px;background:#ff7048;color:#fff;font:700 11px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:.92';document.body.appendChild(g);}
  g.textContent=text;g.style.display='block';return g;
}
function cancelTouch(){
  if(touchJob&&touchJob.cancel)touchJob.cancel();touchJob=null;clearSlotHighlight();var g=document.getElementById('skTouchBlockGhost');if(g)g.style.display='none';
}

function bindTouchTemplates(){
  library.querySelectorAll('.block-template[data-block-type]').forEach(function(el){
    if(el.dataset.skTouchBound==='1')return;el.dataset.skTouchBound='1';el.style.touchAction='none';
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'||!window.matchMedia('(max-width:760px)').matches)return;
      startTemplateTouch(e,el);
    },{passive:false});
  });
}
function startTemplateTouch(e,source){
  cancelTouch();e.preventDefault();e.stopPropagation();
  var id=e.pointerId,type=source.dataset.blockType,sx=e.clientX,sy=e.clientY,moved=false,done=false,g=ghost(source.querySelector('b')?source.querySelector('b').textContent:type);
  g.style.left=(e.clientX+12)+'px';g.style.top=(e.clientY+12)+'px';
  state.ignoreBlockClick=true;
  try{source.setPointerCapture(id);}catch(_){}
  function mv(ev){if(ev.pointerId!==id)return;ev.preventDefault();if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>6)moved=true;g.style.left=(ev.clientX+12)+'px';g.style.top=(ev.clientY+12)+'px';clearSlotHighlight();var slot=slotAt(ev.clientX,ev.clientY);if(slot)slot.classList.add('drag-over');}
  function finish(ev,cancelled){if(done)return;done=true;window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',pc,true);try{source.releasePointerCapture(id);}catch(_){}clearSlotHighlight();g.style.display='none';touchJob=null;
    if(!cancelled){var slot=slotAt(ev.clientX,ev.clientY);if(moved&&slot){insertBlock(newBlock(type),slot.dataset.blockSlot||'root');saveLogic();renderLogic();closeSheet();}else if(!moved){addBlockToRoot(type);closeSheet();}}
    setTimeout(function(){state.ignoreBlockClick=false;},250);
  }
  function up(ev){if(ev.pointerId===id)finish(ev,false);}function pc(ev){if(ev.pointerId===id)finish(ev,true);}
  touchJob={cancel:function(){finish({pointerId:id,clientX:sx,clientY:sy},true);}};
  window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',pc,true);
}

/* Existing blocks can also be moved between slots with touch. */
logicCanvas.addEventListener('pointerdown',function(e){
  if(e.pointerType==='mouse'||!window.matchMedia('(max-width:760px)').matches)return;
  if(e.target.closest('button,[data-edit-block],[data-delete-block],[data-block-up],[data-block-down]'))return;
  var block=e.target.closest('.logic-block');var head=e.target.closest('.logic-block-head');if(!block||!head)return;
  startExistingTouch(e,block,head);
},{passive:false});
function startExistingTouch(e,block,captureEl){
  cancelTouch();e.preventDefault();e.stopPropagation();
  var pointerId=e.pointerId,sx=e.clientX,sy=e.clientY,moved=false,done=false,id=block.dataset.blockId,g=ghost((block.querySelector('.logic-block-name')||{}).textContent||'block');
  g.style.display='none';try{captureEl.setPointerCapture(pointerId);}catch(_){}
  function mv(ev){if(ev.pointerId!==pointerId)return;var dist=Math.hypot(ev.clientX-sx,ev.clientY-sy);if(!moved&&dist>9){moved=true;g.style.display='block';block.style.opacity='.35';}if(!moved)return;ev.preventDefault();g.style.left=(ev.clientX+12)+'px';g.style.top=(ev.clientY+12)+'px';clearSlotHighlight();var slot=slotAt(ev.clientX,ev.clientY,block);if(slot)slot.classList.add('drag-over');}
  function finish(ev,cancelled){if(done)return;done=true;window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',pc,true);try{captureEl.releasePointerCapture(pointerId);}catch(_){}block.style.opacity='';g.style.display='none';clearSlotHighlight();touchJob=null;if(!cancelled&&moved){var slot=slotAt(ev.clientX,ev.clientY,block);if(slot){var b=removeBlock(id);if(b){insertBlock(b,slot.dataset.blockSlot||'root');saveLogic();renderLogic();}}}}
  function up(ev){if(ev.pointerId===pointerId)finish(ev,false);}function pc(ev){if(ev.pointerId===pointerId)finish(ev,true);}
  touchJob={cancel:function(){finish({pointerId:pointerId,clientX:sx,clientY:sy},true);}};
  window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',pc,true);
}

/* Keep header and badge synchronized after the original renderer runs. */
if(typeof window.renderLogic==='function'){
  var baseRender=window.renderLogic;
  window.renderLogic=function(){var r=baseRender.apply(this,arguments);setTimeout(function(){decorate();updateHeader();bindTouchTemplates();},0);return r;};
}

var observer=new MutationObserver(function(){updateOpenState();});
observer.observe(screen,{attributes:true,attributeFilter:['class']});
document.querySelectorAll('.tab').forEach(function(t){observer.observe(t,{attributes:true,attributeFilter:['class']});});
window.addEventListener('resize',updateOpenState);
window.addEventListener('blur',cancelTouch);
document.addEventListener('visibilitychange',function(){if(document.hidden)cancelTouch();});

decorate();updateOpenState();
})();
