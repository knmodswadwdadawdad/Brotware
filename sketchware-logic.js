(function(){
'use strict';

/*
 * Brotware Sketchware-style Logic Editor
 * --------------------------------------
 * This UI intentionally does not reuse/move the old logic DOM. It reads and
 * writes the same Brotware block model (activeBlocks/newBlock/insertBlock),
 * but renders its own fixed editor. This keeps the interaction isolated and
 * avoids the overlay/observer loops that caused freezes in earlier versions.
 */

var overlay=null,stage=null,workspace=null,flow=null,palette=null,paletteScroll=null,paletteCats=null;
var titleEl=null,descEl=null,undoBtn=null,redoBtn=null,ghostEl=null,deleteEl=null;
var opened=false,currentTitle='Evento',currentDesc='Monte a lógica com blocos';
var currentPalette='var',searchValue='';
var tapTarget={slot:'root',index:0};
var drag=null;
var historyMap={};
var lastSelectedBlockId=null;

var CATEGORIES=[
  {id:'var',name:'Variable',color:'#ee7d16'},
  {id:'list',name:'List',color:'#cc5b22'},
  {id:'control',name:'Control',color:'#e1a92a'},
  {id:'operator',name:'Operator',color:'#5cb722'},
  {id:'math',name:'Math',color:'#23b9a9'},
  {id:'file',name:'File',color:'#a1887f'},
  {id:'view',name:'View',color:'#4a6cd4'},
  {id:'component',name:'Component',color:'#2ca5e2'},
  {id:'strings',name:'XML Strings',color:'#7c83db'},
  {id:'more',name:'MoreBlock',color:'#8a55d7'}
];

var PALETTE={
  var:[
    {type:'setVar',label:'set variable',desc:'Definir valor de uma variável'},
    {type:'readInput',label:'read input',desc:'Ler um campo e salvar em variável'}
  ],
  list:[],
  control:[
    {type:'if',label:'if / else',desc:'Condição com ENTÃO e SENÃO'},
    {type:'repeat',label:'repeat',desc:'Repetir blocos N vezes'},
    {type:'wait',label:'wait',desc:'Aguardar milissegundos'}
  ],
  operator:[
    {type:'if',label:'if  A == B',desc:'Criar comparação de igualdade',preset:{op:'=='}},
    {type:'if',label:'if  A != B',desc:'Criar comparação de diferença',preset:{op:'!='}},
    {type:'if',label:'if contains',desc:'Testar se um texto contém outro',preset:{op:'contains'}},
    {type:'if',label:'if truthy',desc:'Testar valor verdadeiro',preset:{op:'truthy'}}
  ],
  math:[
    {type:'math',label:'math',desc:'Somar, subtrair, multiplicar ou dividir'}
  ],
  file:[
    {type:'storageSet',label:'save local',desc:'Salvar valor no localStorage'},
    {type:'storageGet',label:'read local',desc:'Ler valor do localStorage'},
    {type:'storageRemove',label:'remove local',desc:'Remover chave local'}
  ],
  view:[
    {type:'setText',label:'set text',desc:'Alterar texto de uma View'},
    {type:'setValue',label:'set value',desc:'Alterar valor de input'},
    {type:'setStyle',label:'set style',desc:'Alterar propriedade CSS'},
    {type:'show',label:'show',desc:'Mostrar View'},
    {type:'hide',label:'hide',desc:'Ocultar View'},
    {type:'toggle',label:'toggle',desc:'Alternar visibilidade'},
    {type:'navigate',label:'open page',desc:'Abrir outra página ou URL'}
  ],
  component:[
    {type:'fetch',label:'HTTP request',desc:'Executar GET/POST em uma API'}
  ],
  strings:[
    {type:'alert',label:'alert text',desc:'Mostrar uma mensagem'},
    {type:'console',label:'console log',desc:'Enviar texto/valor ao console'}
  ],
  more:[
    {type:'callFunction',label:'call MoreBlock',desc:'Executar uma função reutilizável'}
  ]
};

function categoryMeta(id){
  for(var i=0;i<CATEGORIES.length;i++)if(CATEGORIES[i].id===id)return CATEGORIES[i];
  return CATEGORIES[0];
}
function categoryForBlock(block){
  if(block&&block.__swCategory)return block.__swCategory;
  var type=block?block.type:'';
  if(type==='setVar'||type==='readInput')return'var';
  if(type==='if'||type==='repeat'||type==='wait')return'control';
  if(type==='math')return'math';
  if(type==='storageSet'||type==='storageGet'||type==='storageRemove')return'file';
  if(type==='fetch')return'component';
  if(type==='callFunction')return'more';
  if(type==='alert'||type==='console')return'strings';
  return'view';
}
function deepClone(v){return JSON.parse(JSON.stringify(v));}
function nowSnapshot(){return JSON.stringify(activeBlocks());}
function logicKey(){
  if(state.logicMode==='function')return'fn:'+String(state.activeFunctionId||'none');
  return String(state.currentPageId||'page')+':'+String(currentEventNode())+':'+String(currentEventType());
}
function ensureHistory(){
  var key=logicKey(),snap=nowSnapshot(),h=historyMap[key];
  if(!h){historyMap[key]={items:[snap],index:0};}
  else if(h.items[h.index]!==snap){
    h.items=h.items.slice(0,h.index+1);h.items.push(snap);h.index=h.items.length-1;
  }
  updateHistoryButtons();
}
function recordHistory(){
  var key=logicKey(),snap=nowSnapshot(),h=historyMap[key];
  if(!h){historyMap[key]={items:[snap],index:0};updateHistoryButtons();return;}
  if(h.items[h.index]===snap){updateHistoryButtons();return;}
  h.items=h.items.slice(0,h.index+1);h.items.push(snap);
  if(h.items.length>80)h.items.shift();
  h.index=h.items.length-1;updateHistoryButtons();
}
function restoreSnapshot(snap){
  var data=[];try{data=JSON.parse(snap)||[];}catch(e){}
  var arr=activeBlocks();arr.splice(0,arr.length);
  data.forEach(function(b){arr.push(b);});
  if(typeof saveLogic==='function')saveLogic();
  render();
}
function undo(){var h=historyMap[logicKey()];if(!h||h.index<=0)return;h.index--;restoreSnapshot(h.items[h.index]);updateHistoryButtons();}
function redo(){var h=historyMap[logicKey()];if(!h||h.index>=h.items.length-1)return;h.index++;restoreSnapshot(h.items[h.index]);updateHistoryButtons();}
function updateHistoryButtons(){
  if(!undoBtn||!redoBtn)return;var h=historyMap[logicKey()];
  undoBtn.disabled=!h||h.index<=0;redoBtn.disabled=!h||h.index>=h.items.length-1;
}

function build(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='swLogicOverlay';overlay.className='sw-logic-overlay';
  overlay.innerHTML=''+
    '<header class="sw-logic-top">'+
      '<button class="sw-back" id="swLogicBack" type="button" aria-label="Voltar">←</button>'+
      '<div class="sw-title-wrap"><strong id="swLogicTitle">Evento</strong><small id="swLogicDesc">Monte a lógica com blocos</small></div>'+
      '<span class="sw-top-spacer"></span>'+
      '<button class="sw-top-btn" id="swLogicCode" type="button" title="Código">‹›</button>'+
      '<button class="sw-top-btn" id="swLogicUndo" type="button" title="Desfazer">↶</button>'+
      '<button class="sw-top-btn" id="swLogicRedo" type="button" title="Refazer">↷</button>'+
      '<button class="sw-top-btn" id="swLogicBookmark" type="button" title="Favoritos">♡</button>'+
    '</header>'+
    '<div class="sw-editor-area">'+
      '<div class="sw-stage" id="swStage"><div class="sw-workspace" id="swWorkspace"><div class="sw-flow" id="swFlow"></div></div></div>'+
      '<button class="sw-palette-toggle" id="swPaletteToggle" type="button" aria-label="Abrir blocos">🧩</button>'+
      '<aside class="sw-palette" id="swPalette">'+
        '<div class="sw-palette-content">'+
          '<section class="sw-palette-main"><div class="sw-palette-header"><input id="swPaletteSearch" placeholder="Search..."><button class="sw-palette-close" id="swPaletteClose" type="button">×</button></div><div class="sw-palette-scroll" id="swPaletteScroll"></div></section>'+
          '<nav class="sw-palette-cats" id="swPaletteCats"></nav>'+
        '</div>'+
      '</aside>'+
    '</div>'+
    '<div class="sw-drag-delete" id="swDragDelete">🗑 <span>Excluir bloco</span></div>'+
    '<div class="sw-drag-ghost" id="swDragGhost"></div>';
  document.body.appendChild(overlay);

  stage=document.getElementById('swStage');workspace=document.getElementById('swWorkspace');flow=document.getElementById('swFlow');
  palette=document.getElementById('swPalette');paletteScroll=document.getElementById('swPaletteScroll');paletteCats=document.getElementById('swPaletteCats');
  titleEl=document.getElementById('swLogicTitle');descEl=document.getElementById('swLogicDesc');undoBtn=document.getElementById('swLogicUndo');redoBtn=document.getElementById('swLogicRedo');
  ghostEl=document.getElementById('swDragGhost');deleteEl=document.getElementById('swDragDelete');

  document.getElementById('swLogicBack').addEventListener('click',function(){close();if(typeof showEventHome==='function')showEventHome();});
  document.getElementById('swLogicCode').addEventListener('click',function(){if(typeof showLogicCode==='function')showLogicCode();});
  undoBtn.addEventListener('click',undo);redoBtn.addEventListener('click',redo);
  document.getElementById('swLogicBookmark').addEventListener('click',function(){
    if(lastSelectedBlockId)toast('Segure o bloco para mover. Favoritos serão adicionados depois.');else toast('Toque em um bloco para selecioná-lo.');
  });
  document.getElementById('swPaletteToggle').addEventListener('click',function(){tapTarget={slot:'root',index:activeBlocks().length};openPalette();});
  document.getElementById('swPaletteClose').addEventListener('click',closePalette);
  document.getElementById('swPaletteSearch').addEventListener('input',function(){searchValue=this.value||'';renderPaletteItems();});

  paletteCats.addEventListener('click',function(e){var b=e.target.closest('[data-sw-cat]');if(!b)return;currentPalette=b.dataset.swCat;searchValue='';document.getElementById('swPaletteSearch').value='';renderPaletteCategories();renderPaletteItems();});
  paletteScroll.addEventListener('click',paletteClick);
  paletteScroll.addEventListener('pointerdown',palettePointerDown,{passive:true});
  flow.addEventListener('click',flowClick);
  flow.addEventListener('pointerdown',flowPointerDown,{passive:true});

  /* Existing config modal mutates the same model. Refresh this renderer after save/delete. */
  var saveBlock=document.getElementById('saveBlockBtn');if(saveBlock)saveBlock.addEventListener('click',function(){setTimeout(function(){if(opened){render();recordHistory();}},0);});
  var deleteBlock=document.getElementById('deleteBlockBtn');if(deleteBlock)deleteBlock.addEventListener('click',function(){setTimeout(function(){if(opened){render();recordHistory();}},0);});

  document.addEventListener('keydown',function(e){
    if(!opened)return;
    if(e.key==='Escape'){if(overlay.classList.contains('palette-open'))closePalette();else close();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
  });
  renderPaletteCategories();renderPaletteItems();
}

function renderPaletteCategories(){
  if(!paletteCats)return;paletteCats.innerHTML='';
  CATEGORIES.forEach(function(c){
    var b=document.createElement('button');b.type='button';b.className='sw-cat'+(c.id===currentPalette?' active':'');b.dataset.swCat=c.id;b.style.setProperty('--cat-color',c.color);b.textContent=c.name;paletteCats.appendChild(b);
  });
}
function allPaletteEntries(){
  var out=[];CATEGORIES.forEach(function(c){(PALETTE[c.id]||[]).forEach(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.category=c.id;out.push(y);});});return out;
}
function renderPaletteItems(){
  if(!paletteScroll)return;
  var q=String(searchValue||'').trim().toLowerCase();
  var meta=categoryMeta(currentPalette),entries=q?allPaletteEntries():(PALETTE[currentPalette]||[]).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.category=currentPalette;return y;});
  if(q)entries=entries.filter(function(x){return (x.label+' '+x.desc).toLowerCase().indexOf(q)>=0;});
  var html='';
  if(!q)html+='<div class="sw-palette-title">'+esc(meta.name)+'</div>';
  if(!q&&currentPalette==='var')html+='<div class="sw-palette-actions"><button class="sw-palette-action" data-sw-action="add-variable">Add variable</button></div>';
  if(!q&&currentPalette==='more')html+='<div class="sw-palette-actions"><button class="sw-palette-action" data-sw-action="add-function">Add MoreBlock</button></div>';
  if(!q&&currentPalette==='list'&&!entries.length)html+='<div class="sw-palette-note">A estrutura de encaixe já está igual ao editor do Sketchware. Os blocos específicos de List serão adicionados ao motor depois.</div>';
  entries.forEach(function(entry,index){
    var cat=categoryMeta(entry.category||currentPalette),bm=BLOCK_META[entry.type]||{icon:'◆'};
    html+='<button type="button" class="sw-palette-item" data-sw-palette-index="'+index+'" data-sw-type="'+esc(entry.type)+'" data-sw-entry-cat="'+esc(entry.category||currentPalette)+'" style="--item-color:'+cat.color+'"><span class="ico">'+esc(bm.icon||'◆')+'</span><span><b>'+esc(entry.label)+'</b><small>'+esc(entry.desc||'')+'</small></span></button>';
  });
  if(!entries.length&&!(currentPalette==='list'&&!q))html+='<div class="sw-palette-note">Nenhum bloco encontrado.</div>';
  paletteScroll.innerHTML=html;
}
function entryForButton(btn){
  var cat=btn.dataset.swEntryCat||currentPalette,q=String(searchValue||'').trim().toLowerCase();
  var entries=q?allPaletteEntries():(PALETTE[cat]||[]).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.category=cat;return y;});
  if(q)entries=entries.filter(function(x){return (x.label+' '+x.desc).toLowerCase().indexOf(q)>=0;});
  return entries[Number(btn.dataset.swPaletteIndex)||0]||null;
}
function makePaletteBlock(entry){
  var b=newBlock(entry.type);
  if(entry.preset&&b.props)Object.keys(entry.preset).forEach(function(k){b.props[k]=entry.preset[k];});
  if(entry.category==='operator')b.__swCategory='control';
  if(entry.functionId&&b.props)b.props.functionId=entry.functionId;
  return b;
}
function paletteClick(e){
  var action=e.target.closest('[data-sw-action]');
  if(action){
    if(action.dataset.swAction==='add-variable'&&typeof addVariable==='function'){addVariable();renderPaletteItems();}
    if(action.dataset.swAction==='add-function'&&typeof addFunction==='function'){addFunction();renderPaletteItems();}
    return;
  }
  var btn=e.target.closest('.sw-palette-item');if(!btn||btn.dataset.swSuppress==='1')return;
  var entry=entryForButton(btn);if(!entry)return;
  addFromPalette(entry,tapTarget.slot,tapTarget.index);
}
function addFromPalette(entry,slot,index){
  ensureHistory();
  insertBlock(makePaletteBlock(entry),slot||'root',index);
  if(typeof saveLogic==='function')saveLogic();
  recordHistory();render();
  tapTarget={slot:slot||'root',index:(Number(index)||0)+1};
}

function render(){
  if(!flow)return;
  var blocks=activeBlocks(),catRoot=state.logicMode==='function'?'more':'event';
  var rootColor=state.logicMode==='function'?'#8a55d7':'#d89b18';
  var rootLabel=state.logicMode==='function'?'define '+currentTitle:currentTitle;
  flow.innerHTML='<div class="sw-event-root" style="background:'+rootColor+'">‹› '+esc(rootLabel)+' <small>'+esc(currentDesc)+'</small></div>'+renderStack(blocks,'root');
  if(!blocks.length)flow.insertAdjacentHTML('beforeend','<div class="sw-empty-flow">Abra 🧩 e arraste um bloco para o encaixe azul.</div>');
  updateHistoryButtons();
}
function renderStack(list,slot){
  var html='<div class="sw-stack" data-sw-stack="'+esc(slot)+'">';
  html+=insertZone(slot,0);
  (list||[]).forEach(function(block,i){html+=renderBlock(block);html+=insertZone(slot,i+1);});
  return html+'</div>';
}
function insertZone(slot,index){return '<div class="sw-insert" data-sw-slot="'+esc(slot)+'" data-sw-index="'+index+'"></div>';}
function renderBlock(block){
  var cat=categoryForBlock(block),meta=BLOCK_META[block.type]||{name:block.type,icon:'◆'},summary='';
  try{summary=blockSummary(block)||'Toque para configurar';}catch(e){summary='Toque para configurar';}
  var main='<div class="sw-block-main"><span class="sw-block-icon">'+esc(meta.icon||'◆')+'</span><span class="sw-block-info"><span class="sw-block-name">'+esc(meta.name||block.type)+'</span><span class="sw-block-summary">'+esc(summary)+'</span></span><span class="sw-block-grip">⋮⋮</span></div>';
  if(block.type==='if'){
    return '<div class="sw-block" data-block-id="'+esc(block.id)+'" data-cat="'+cat+'"><div class="sw-control-wrap">'+main+'<div class="sw-branch"><span class="sw-branch-label">ENTÃO</span>'+renderStack(block.children||[],'children:'+block.id)+'</div><div class="sw-branch"><span class="sw-branch-label">SENÃO</span>'+renderStack(block.elseChildren||[],'else:'+block.id)+'</div><div class="sw-control-foot"></div></div></div>';
  }
  if(block.type==='repeat'){
    return '<div class="sw-block" data-block-id="'+esc(block.id)+'" data-cat="'+cat+'"><div class="sw-control-wrap">'+main+'<div class="sw-branch"><span class="sw-branch-label">FAÇA</span>'+renderStack(block.children||[],'children:'+block.id)+'</div><div class="sw-control-foot"></div></div></div>';
  }
  return '<div class="sw-block" data-block-id="'+esc(block.id)+'" data-cat="'+cat+'">'+main+'</div>';
}

function flowClick(e){
  if(Date.now()<Number(overlay.dataset.suppressClickUntil||0))return;
  var zone=e.target.closest('.sw-insert');
  if(zone){
    flow.querySelectorAll('.sw-insert.selected').forEach(function(x){x.classList.remove('selected');});zone.classList.add('selected');
    tapTarget={slot:zone.dataset.swSlot||'root',index:Number(zone.dataset.swIndex)||0};openPalette();return;
  }
  var blockEl=e.target.closest('.sw-block[data-block-id]');
  if(blockEl){lastSelectedBlockId=blockEl.dataset.blockId;ensureHistory();if(typeof openBlockEditor==='function')openBlockEditor(lastSelectedBlockId);}
}
function openPalette(){if(!opened)return;overlay.classList.add('palette-open');renderPaletteCategories();renderPaletteItems();}
function closePalette(){if(overlay)overlay.classList.remove('palette-open');}

function collectBlockIds(block,set){
  if(!block)return;set[block.id]=true;(block.children||[]).forEach(function(x){collectBlockIds(x,set);});(block.elseChildren||[]).forEach(function(x){collectBlockIds(x,set);});
}
function ownerOfSlot(slot){var p=String(slot||'').split(':');return p.length>1?p.slice(1).join(':'):null;}
function zoneAt(x,y,invalidIds){
  var el=document.elementFromPoint(x,y);if(!el)return null;var z=el.closest('.sw-insert');if(!z||!overlay.contains(z))return null;
  if(invalidIds){var owner=ownerOfSlot(z.dataset.swSlot);if(owner&&invalidIds[owner])return null;}
  return z;
}
function clearHot(){if(!flow)return;flow.querySelectorAll('.sw-insert.hot').forEach(function(x){x.classList.remove('hot');});if(deleteEl)deleteEl.classList.remove('hot');}
function updateDragPoint(x,y){
  if(!drag)return;drag.x=x;drag.y=y;ghostEl.style.left=(x+14)+'px';ghostEl.style.top=(y+14)+'px';clearHot();
  if(pointInside(deleteEl,x,y)){deleteEl.classList.add('hot');drag.target={kind:'delete'};return;}
  var z=zoneAt(x,y,drag.invalidIds);if(z){z.classList.add('hot');drag.target={kind:'slot',slot:z.dataset.swSlot||'root',index:Number(z.dataset.swIndex)||0};}else drag.target=null;
  autoScroll(x,y);
}
function pointInside(el,x,y){if(!el)return false;var r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}
function autoScroll(x,y){
  var r=stage.getBoundingClientRect(),step=16;
  if(y<r.top+55)stage.scrollTop-=step;else if(y>r.bottom-55)stage.scrollTop+=step;
  if(x<r.left+45)stage.scrollLeft-=step;else if(x>r.right-45)stage.scrollLeft+=step;
}
function beginDrag(source,pointerId,x,y,captureEl){
  cancelDrag();
  drag=source;drag.pointerId=pointerId;drag.x=x;drag.y=y;drag.captureEl=captureEl;drag.invalidIds=null;
  if(source.kind==='existing'){
    var f=findBlock(source.id);if(!f){drag=null;return;}
    drag.sourceInfo={list:f.list,index:f.index};drag.invalidIds={};collectBlockIds(f.block,drag.invalidIds);
    var src=flow.querySelector('.sw-block[data-block-id="'+source.id+'"]');if(src)src.classList.add('drag-source');
  }
  ghostEl.textContent=source.label||'bloco';overlay.classList.add('sw-dragging');overlay.dataset.suppressClickUntil=String(Date.now()+700);
  try{captureEl.setPointerCapture(pointerId);}catch(e){}
  updateDragPoint(x,y);
  window.addEventListener('pointermove',dragMove,true);window.addEventListener('pointerup',dragUp,true);window.addEventListener('pointercancel',dragCancel,true);
}
function dragMove(e){if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();updateDragPoint(e.clientX,e.clientY);}
function dragUp(e){if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();finishDrag(false);}
function dragCancel(e){if(!drag||e.pointerId!==drag.pointerId)return;finishDrag(true);}
function finishDrag(cancelled){
  if(!drag)return;var d=drag;window.removeEventListener('pointermove',dragMove,true);window.removeEventListener('pointerup',dragUp,true);window.removeEventListener('pointercancel',dragCancel,true);
  try{d.captureEl.releasePointerCapture(d.pointerId);}catch(e){}
  overlay.classList.remove('sw-dragging');clearHot();flow.querySelectorAll('.drag-source').forEach(function(x){x.classList.remove('drag-source');});drag=null;
  if(cancelled||!d.target)return;
  ensureHistory();
  if(d.target.kind==='delete'){
    if(d.kind==='existing')removeBlock(d.id);else return;
  }else if(d.target.kind==='slot'){
    var slot=d.target.slot,index=d.target.index;
    if(d.kind==='new'){
      insertBlock(makePaletteBlock(d.entry),slot,index);
    }else{
      var info=findBlock(d.id);if(!info)return;var targetList=getSlot(slot),same=targetList===info.list,sourceIndex=info.index;
      var block=removeBlock(d.id);if(!block)return;if(same&&sourceIndex<index)index--;insertBlock(block,slot,index);
    }
  }
  if(typeof saveLogic==='function')saveLogic();recordHistory();render();
}
function cancelDrag(){
  if(!drag)return;var d=drag;window.removeEventListener('pointermove',dragMove,true);window.removeEventListener('pointerup',dragUp,true);window.removeEventListener('pointercancel',dragCancel,true);
  try{d.captureEl.releasePointerCapture(d.pointerId);}catch(e){}drag=null;if(overlay)overlay.classList.remove('sw-dragging');clearHot();if(flow)flow.querySelectorAll('.drag-source').forEach(function(x){x.classList.remove('drag-source');});
}

function setupLongPress(e,sourceFactory,tapAction){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  var pid=e.pointerId,sx=e.clientX,sy=e.clientY,done=false,started=false,el=e.currentTarget||e.target;
  var timer=setTimeout(function(){if(done)return;started=true;var src=sourceFactory();if(src)beginDrag(src,pid,sx,sy,el);cleanupPending(false);},240);
  function move(ev){if(ev.pointerId!==pid||done||started)return;if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8){clearTimeout(timer);done=true;cleanupPending(true);}}
  function up(ev){if(ev.pointerId!==pid||done||started)return;clearTimeout(timer);done=true;cleanupPending(true);if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)tapAction();}
  function cancel(ev){if(ev.pointerId!==pid)return;clearTimeout(timer);done=true;cleanupPending(true);}
  function cleanupPending(remove){if(remove!==false){window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);}else{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);}}
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);
}
function palettePointerDown(e){
  var btn=e.target.closest('.sw-palette-item');if(!btn)return;var entry=entryForButton(btn);if(!entry)return;
  setupLongPress(e,function(){btn.dataset.swSuppress='1';setTimeout(function(){btn.dataset.swSuppress='0';},700);return{kind:'new',entry:entry,label:entry.label};},function(){addFromPalette(entry,tapTarget.slot,tapTarget.index);});
}
function flowPointerDown(e){
  var blockEl=e.target.closest('.sw-block[data-block-id]');if(!blockEl)return;var id=blockEl.dataset.blockId,found=findBlock(id);if(!found)return;
  var meta=BLOCK_META[found.block.type]||{name:found.block.type};
  setupLongPress(e,function(){return{kind:'existing',id:id,label:meta.name};},function(){lastSelectedBlockId=id;ensureHistory();if(typeof openBlockEditor==='function')openBlockEditor(id);});
}

function open(title,desc){
  build();cancelDrag();currentTitle=title||'Evento';currentDesc=String(desc||'').replace(/\s*·\s*\d+\s*bloco\(s\).*$/i,'')||'Monte a lógica com blocos';
  titleEl.textContent=currentTitle;descEl.textContent=currentDesc;tapTarget={slot:'root',index:activeBlocks().length};
  overlay.classList.add('show');document.body.classList.add('sw-logic-open');opened=true;closePalette();ensureHistory();render();
  stage.scrollLeft=0;stage.scrollTop=0;
}
function close(){if(!overlay)return;cancelDrag();closePalette();overlay.classList.remove('show');document.body.classList.remove('sw-logic-open');opened=false;}

/* Event browser is created before this file. Attach only to its own controls; no global click observer. */
function bindEventBrowser(){
  var cards=document.getElementById('skEventCards');
  if(cards&&!cards.dataset.swLogicBound){cards.dataset.swLogicBound='1';cards.addEventListener('click',function(e){var card=e.target.closest('.sk-event-card');if(!card)return;var name=(card.querySelector('b')||{}).textContent||'Evento';var desc=(card.querySelector('small')||{}).textContent||'Monte a lógica com blocos';setTimeout(function(){open(name,desc);},0);});}
  var legacy=document.getElementById('skOpenLegacy');if(legacy&&!legacy.dataset.swLogicBound){legacy.dataset.swLogicBound='1';legacy.addEventListener('click',function(){setTimeout(function(){open('Editor de blocos','Monte a lógica visual do evento');},0);});}
  document.querySelectorAll('.tab[data-tab]').forEach(function(t){if(t.dataset.swLogicBound)return;t.dataset.swLogicBound='1';t.addEventListener('click',function(){if(this.dataset.tab!=='event')close();});});
}

window.BrotwareSketchLogic={open:open,close:close,render:render,openPalette:openPalette};
build();bindEventBrowser();
})();
