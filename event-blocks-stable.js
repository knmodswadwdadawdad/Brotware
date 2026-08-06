(function(){
'use strict';

var screen=document.getElementById('screen-event');
var library=document.querySelector('#screen-event>.blocks-library');
var logicCanvas=document.getElementById('logicCanvas');
var logicRoot=document.getElementById('logicRoot');
if(!screen||!library||!logicCanvas||!logicRoot)return;

var selectedSlot='root';
var currentLabel='Evento';
var currentDesc='Monte a lógica com blocos';

function ensureUi(){
  if(!document.getElementById('stableBlocksBtn')){
    var fab=document.createElement('button');
    fab.id='stableBlocksBtn';fab.className='stable-blocks-btn';fab.type='button';fab.textContent='🧩 Blocos';
    screen.appendChild(fab);
    fab.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openLibrary();});
  }
  if(!library.querySelector('.stable-library-head')){
    var head=document.createElement('div');head.className='stable-library-head';
    head.innerHTML='<strong>Blocos</strong><small id="stableSlotLabel">Adicionar no fluxo</small><button type="button" class="stable-library-close">×</button>';
    library.insertBefore(head,library.firstChild);
    head.querySelector('.stable-library-close').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();closeLibrary();});

    var filters=document.createElement('div');filters.className='stable-library-filter';
    var cats=[['all','Todos'],['flow','Controle'],['ui','View'],['data','Variável'],['storage','Storage'],['network','API'],['function','Moreblock'],['debug','Debug']];
    cats.forEach(function(c){var b=document.createElement('button');b.type='button';b.className='stable-filter-btn'+(c[0]==='all'?' active':'');b.dataset.stableFilter=c[0];b.textContent=c[1];filters.appendChild(b);});
    library.insertBefore(filters,head.nextSibling);
    filters.addEventListener('click',function(e){var b=e.target.closest('[data-stable-filter]');if(!b)return;e.preventDefault();e.stopPropagation();filters.querySelectorAll('.stable-filter-btn').forEach(function(x){x.classList.toggle('active',x===b);});filterLibrary(b.dataset.stableFilter);});
  }
  if(!document.getElementById('stableEventBadge')){
    var badge=document.createElement('div');badge.id='stableEventBadge';badge.className='stable-event-badge';badge.textContent=currentDesc;
    logicCanvas.insertBefore(badge,logicCanvas.firstChild);
  }
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
  clearSlotSelection();selectedSlot=(slot&&slot.dataset.blockSlot)||'root';
  if(slot)slot.classList.add('stable-slot-selected');
  updateSlotLabel();openLibrary();
}

function openLibrary(){
  ensureUi();screen.classList.add('stable-library-open');updateSlotLabel();
}
function closeLibrary(){screen.classList.remove('stable-library-open');}

function openEditor(label,desc){
  ensureUi();
  currentLabel=label||'Evento';currentDesc=desc||'Monte a lógica com blocos';selectedSlot='root';clearSlotSelection();closeLibrary();
  screen.classList.add('sk-block-screen');
  document.body.classList.add('stable-block-editor');
  var title=document.getElementById('logicTitle'),sub=document.getElementById('logicSubtitle'),badge=document.getElementById('stableEventBadge');
  if(title)title.textContent=currentLabel;if(sub)sub.textContent=currentDesc;if(badge)badge.textContent=currentDesc;
}
function closeEditor(){
  closeLibrary();clearSlotSelection();selectedSlot='root';
  screen.classList.remove('sk-block-screen');
  document.body.classList.remove('stable-block-editor');
}

/* Explicit click hooks only. No observer/timer loop. */
document.addEventListener('click',function(e){
  var card=e.target.closest('.sk-event-card');
  if(card&&screen.classList.contains('active')){
    var name=(card.querySelector('b')||{}).textContent||'Evento';
    var desc=(card.querySelector('small')||{}).textContent||'Monte a lógica com blocos';
    setTimeout(function(){openEditor(name,desc);},0);
    return;
  }
  if(e.target.closest('#skOpenLegacy')){
    setTimeout(function(){openEditor('Editor de blocos','Monte a lógica visual do evento');},0);return;
  }
  if(e.target.closest('#skBackEvents')){closeEditor();return;}
  var tab=e.target.closest('.tab[data-tab]');
  if(tab&&tab.dataset.tab!=='event'){closeEditor();return;}
},false);

/* Tap an empty/root/nested slot to choose where the next block goes. */
logicCanvas.addEventListener('click',function(e){
  if(!screen.classList.contains('sk-block-screen'))return;
  if(e.target.closest('button,[data-edit-block],[data-delete-block],[data-block-up],[data-block-down]'))return;
  var slot=e.target.closest('[data-block-slot]');
  if(slot){e.preventDefault();e.stopPropagation();chooseSlot(slot);}
});

/* On mobile, intercept block template tap and insert into the chosen slot. */
library.addEventListener('click',function(e){
  if(!screen.classList.contains('sk-block-screen')||window.innerWidth>760)return;
  var tpl=e.target.closest('.block-template[data-block-type]');if(!tpl)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(typeof newBlock!=='function'||typeof insertBlock!=='function')return;
  insertBlock(newBlock(tpl.dataset.blockType),selectedSlot||'root');
  if(typeof saveLogic==='function')saveLogic();
  if(typeof renderLogic==='function')renderLogic();
  selectedSlot='root';clearSlotSelection();closeLibrary();
},true);

/* Keep the friendly event title after renderLogic rewrites it. */
var eventSelect=document.getElementById('eventTypeSelect');
if(eventSelect)eventSelect.addEventListener('change',function(){
  if(!screen.classList.contains('sk-block-screen'))return;
  var opt=eventSelect.options[eventSelect.selectedIndex];if(opt)currentLabel=opt.textContent;
  setTimeout(function(){var t=document.getElementById('logicTitle');if(t)t.textContent=currentLabel;},0);
});

window.BrotwareStableBlocks={open:openEditor,close:closeEditor,openLibrary:openLibrary};
ensureUi();
})();
