(function(){
'use strict';

var screen=document.getElementById('screen-event');
var library=document.querySelector('#screen-event>.blocks-library');
var logicCanvas=document.getElementById('logicCanvas');
var logicWorkspace=document.querySelector('#screen-event>.logic-workspace');
if(!screen||!library||!logicCanvas||!logicWorkspace)return;

var selectedSlot='root';
var currentLabel='Evento';
var currentDesc='Monte a lógica com blocos';
var originalCanvasParent=logicCanvas.parentNode;
var originalCanvasNext=logicCanvas.nextSibling;
var originalLibraryParent=library.parentNode;
var originalLibraryNext=library.nextSibling;
var overlay=null;
var overlayCanvasHost=null;
var overlayLibraryHost=null;

function buildOverlay(){
  if(overlay)return;
  overlay=document.createElement('div');
  overlay.id='stableBlockOverlay';
  overlay.className='stable-block-overlay';
  overlay.innerHTML=''+
    '<div class="stable-block-top">'+
      '<button type="button" id="stableBlockBack" class="stable-block-back">←</button>'+
      '<div class="stable-block-title-wrap"><strong id="stableBlockTitle">Evento</strong><small id="stableBlockDesc">Monte a lógica com blocos</small></div>'+
      '<button type="button" id="stableBlockTest" class="stable-top-action">▶</button>'+
      '<button type="button" id="stableBlockCode" class="stable-top-action">&lt;/&gt;</button>'+
    '</div>'+
    '<div class="stable-block-body"><div id="stableCanvasHost" class="stable-canvas-host"></div></div>'+
    '<button type="button" id="stableBlocksBtn" class="stable-blocks-btn">🧩 Blocos</button>'+
    '<div id="stableLibraryHost" class="stable-library-host"></div>';
  document.body.appendChild(overlay);
  overlayCanvasHost=document.getElementById('stableCanvasHost');
  overlayLibraryHost=document.getElementById('stableLibraryHost');

  document.getElementById('stableBlockBack').addEventListener('click',function(e){e.preventDefault();closeEditor();if(typeof showEventHome==='function')showEventHome();});
  document.getElementById('stableBlockTest').addEventListener('click',function(e){e.preventDefault();if(typeof testCurrentLogic==='function')testCurrentLogic();});
  document.getElementById('stableBlockCode').addEventListener('click',function(e){e.preventDefault();if(typeof showLogicCode==='function')showLogicCode();});
  document.getElementById('stableBlocksBtn').addEventListener('click',function(e){e.preventDefault();openLibrary();});
  buildLibraryChrome();
}

function buildLibraryChrome(){
  if(library.querySelector('.stable-library-head'))return;
  var head=document.createElement('div');
  head.className='stable-library-head';
  head.innerHTML='<strong>Blocos</strong><small id="stableSlotLabel">Adicionar no fluxo principal</small><button type="button" class="stable-library-close">×</button>';
  library.insertBefore(head,library.firstChild);
  head.querySelector('.stable-library-close').addEventListener('click',function(e){e.preventDefault();closeLibrary();});

  var filters=document.createElement('div');
  filters.className='stable-library-filter';
  var cats=[['all','Todos'],['flow','Controle'],['ui','View'],['data','Variável'],['storage','Storage'],['network','API'],['function','Moreblock'],['debug','Debug']];
  cats.forEach(function(c){
    var b=document.createElement('button');
    b.type='button';b.className='stable-filter-btn'+(c[0]==='all'?' active':'');b.dataset.stableFilter=c[0];b.textContent=c[1];filters.appendChild(b);
  });
  library.insertBefore(filters,head.nextSibling);
  filters.addEventListener('click',function(e){
    var b=e.target.closest('[data-stable-filter]');if(!b)return;
    filters.querySelectorAll('.stable-filter-btn').forEach(function(x){x.classList.toggle('active',x===b);});
    filterLibrary(b.dataset.stableFilter);
  });
}

function filterLibrary(cat){
  library.querySelectorAll('.block-template').forEach(function(el){
    var show=cat==='all'||el.classList.contains(cat)||(cat==='flow'&&el.classList.contains('time'));
    el.style.display=show?'':'none';
  });
  library.querySelectorAll('.block-category').forEach(function(el){el.style.display=cat==='all'?'':'none';});
}

function updateSlotLabel(){
  var el=document.getElementById('stableSlotLabel');if(!el)return;
  if(selectedSlot==='root')el.textContent='Adicionar no fluxo principal';
  else if(selectedSlot.indexOf('else:')===0)el.textContent='Adicionar em SENÃO';
  else el.textContent='Adicionar neste encaixe';
}
function clearSlotSelection(){
  document.querySelectorAll('.stable-slot-selected').forEach(function(x){x.classList.remove('stable-slot-selected');});
}
function chooseSlot(slot){
  clearSlotSelection();
  selectedSlot=(slot&&slot.dataset.blockSlot)||'root';
  if(slot)slot.classList.add('stable-slot-selected');
  updateSlotLabel();openLibrary();
}

function openLibrary(){
  if(!overlay)return;
  overlay.classList.add('stable-library-open');
  updateSlotLabel();
}
function closeLibrary(){if(overlay)overlay.classList.remove('stable-library-open');}

function moveEditorDomIntoOverlay(){
  if(logicCanvas.parentNode!==overlayCanvasHost)overlayCanvasHost.appendChild(logicCanvas);
  if(library.parentNode!==overlayLibraryHost)overlayLibraryHost.appendChild(library);
}
function restoreEditorDom(){
  if(logicCanvas.parentNode!==originalCanvasParent){
    if(originalCanvasNext&&originalCanvasNext.parentNode===originalCanvasParent)originalCanvasParent.insertBefore(logicCanvas,originalCanvasNext);
    else originalCanvasParent.appendChild(logicCanvas);
  }
  if(library.parentNode!==originalLibraryParent){
    if(originalLibraryNext&&originalLibraryNext.parentNode===originalLibraryParent)originalLibraryParent.insertBefore(library,originalLibraryNext);
    else originalLibraryParent.appendChild(library);
  }
}

function openEditor(label,desc){
  buildOverlay();
  currentLabel=label||'Evento';currentDesc=desc||'Monte a lógica com blocos';
  selectedSlot='root';clearSlotSelection();closeLibrary();
  moveEditorDomIntoOverlay();
  document.getElementById('stableBlockTitle').textContent=currentLabel;
  document.getElementById('stableBlockDesc').textContent=currentDesc;
  overlay.classList.add('show');
  document.body.classList.add('stable-block-editor');
  logicCanvas.classList.add('stable-overlay-canvas');
}
function closeEditor(){
  if(!overlay)return;
  closeLibrary();clearSlotSelection();selectedSlot='root';
  overlay.classList.remove('show');
  document.body.classList.remove('stable-block-editor');
  logicCanvas.classList.remove('stable-overlay-canvas');
  restoreEditorDom();
}

logicCanvas.addEventListener('click',function(e){
  if(!overlay||!overlay.classList.contains('show'))return;
  if(e.target.closest('button,[data-edit-block],[data-delete-block],[data-block-up],[data-block-down]'))return;
  var slot=e.target.closest('[data-block-slot]');
  if(slot){e.preventDefault();e.stopPropagation();chooseSlot(slot);}
});

library.addEventListener('click',function(e){
  if(!overlay||!overlay.classList.contains('show'))return;
  var tpl=e.target.closest('.block-template[data-block-type]');if(!tpl)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(typeof newBlock!=='function'||typeof insertBlock!=='function')return;
  insertBlock(newBlock(tpl.dataset.blockType),selectedSlot||'root');
  if(typeof saveLogic==='function')saveLogic();
  if(typeof renderLogic==='function')renderLogic();
  selectedSlot='root';clearSlotSelection();closeLibrary();
},true);

window.BrotwareStableBlocks={open:openEditor,close:closeEditor,openLibrary:openLibrary};
buildOverlay();
})();
