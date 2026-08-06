'use strict';
/* ---------- BLOCK DATA ---------- */
function newBlock(type){
  var base={id:uid('block'),type:type,props:{},children:[],elseChildren:[]};
  if(type==='if')base.props={left:'$counter',op:'>',right:'0'};
  else if(type==='repeat')base.props={count:'3'};
  else if(type==='wait')base.props={ms:'1000'};
  else if(type==='navigate')base.props={url:'login.html'};
  else if(type==='alert')base.props={message:'Olá!'};
  else if(type==='setText')base.props={target:firstNodeId(),value:'Novo texto'};
  else if(type==='setValue')base.props={target:firstInputId(),value:'valor'};
  else if(type==='setStyle')base.props={target:firstNodeId(),property:'background',value:'#6567f4'};
  else if(['show','hide','toggle'].indexOf(type)>=0)base.props={target:firstNodeId()};
  else if(type==='setVar')base.props={name:firstVariableName(),value:'0'};
  else if(type==='math')base.props={name:firstVariableName(),left:'$'+firstVariableName(),op:'+',right:'1'};
  else if(type==='readInput')base.props={source:firstInputId(),name:firstVariableName()};
  else if(type==='storageSet')base.props={key:'chave',value:'$'+firstVariableName()};
  else if(type==='storageGet')base.props={key:'chave',name:firstVariableName()};
  else if(type==='storageRemove')base.props={key:'chave'};
  else if(type==='fetch')base.props={method:'GET',url:'https://api.example.com/data',body:'',headers:'',saveVar:firstVariableName(),responseType:'json'};
  else if(type==='callFunction')base.props={functionId:state.functions.length?state.functions[0].id:''};
  else if(type==='console')base.props={message:'$'+firstVariableName()};
  return base;
}
function firstVariableName(){return Object.keys(state.variables)[0]||'counter';}
function allNodeIds(){
  return Array.prototype.slice.call(root.querySelectorAll('.vf-node')).map(function(n){return n.dataset.vfId;});
}
function firstNodeId(){return allNodeIds()[0]||'';}
function firstInputId(){
  var n=root.querySelector('.vf-node[data-type="input"],.vf-node[data-type="textarea"],.vf-node[data-type="select"]');
  return n?n.dataset.vfId:firstNodeId();
}
function ensureEventPath(node,event){
  var p=currentPage();if(!p)return[];
  ensurePageSchema(p);
  if(!p.events[node])p.events[node]={};
  if(!p.events[node][event])p.events[node][event]=[];
  return p.events[node][event];
}
function currentEventNode(){return $('#eventNodeSelect').value||'@page';}
function currentEventType(){return $('#eventTypeSelect').value||'load';}
function activeBlocks(){
  if(state.logicMode==='function'){
    var f=state.functions.find(function(x){return x.id===state.activeFunctionId;});
    return f?f.blocks:[];
  }
  return ensureEventPath(currentEventNode(),currentEventType());
}
function findBlock(id,list,parentInfo){
  list=list||activeBlocks();
  for(var i=0;i<list.length;i++){
    if(list[i].id===id)return{block:list[i],list:list,index:i,parent:parentInfo||null};
    var a=findBlock(id,list[i].children,{block:list[i],branch:'children'});
    if(a)return a;
    var b=findBlock(id,list[i].elseChildren,{block:list[i],branch:'elseChildren'});
    if(b)return b;
  }
  return null;
}
function getSlot(slot){
  if(slot==='root')return activeBlocks();
  var parts=slot.split(':');
  var found=findBlock(parts[1]);
  if(!found)return activeBlocks();
  return parts[0]==='else'?found.block.elseChildren:found.block.children;
}
function removeBlock(id){
  var f=findBlock(id);if(!f)return null;
  return f.list.splice(f.index,1)[0];
}
function insertBlock(block,slot,index){
  var arr=getSlot(slot||'root');
  if(index==null||index<0||index>arr.length)arr.push(block);else arr.splice(index,0,block);
}
function walkBlocks(list,fn){
  (list||[]).forEach(function(b){fn(b);walkBlocks(b.children,fn);walkBlocks(b.elseChildren,fn);});
}
function walkBlocksInPage(page,fn){
  Object.keys(page.events||{}).forEach(function(node){
    Object.keys(page.events[node]||{}).forEach(function(ev){walkBlocks(page.events[node][ev],fn);});
  });
}

/* ---------- BLOCK UI ---------- */
function refreshEventNodeSelect(){
  var sel=$('#eventNodeSelect');
  var old=sel.value||'@page';
  var html='<option value="@page">📄 Página</option>';
  allNodeIds().forEach(function(id){html+='<option value="'+esc(id)+'">'+esc(id)+'</option>';});
  sel.innerHTML=html;
  if(Array.prototype.some.call(sel.options,function(o){return o.value===old;}))sel.value=old;
  else if(state.selectedId)sel.value=state.selectedId;
  refreshEventTypes();
}
function refreshEventTypes(){
  var node=$('#eventNodeSelect').value||'@page',type='default';
  if(node!=='@page'){
    var el=root.querySelector('[data-vf-id="'+node+'"]');
    if(el && EVENT_OPTIONS[el.dataset.type])type=el.dataset.type;
  }else type='@page';
  var options=EVENT_OPTIONS[type]||EVENT_OPTIONS.default,sel=$('#eventTypeSelect'),old=sel.value;
  sel.innerHTML=options.map(function(x){return'<option value="'+x[0]+'">'+x[1]+'</option>';}).join('');
  if(options.some(function(x){return x[0]===old;}))sel.value=old;
  renderLogic();
}
function setLogicMode(mode){
  state.logicMode=mode;
  $('#eventModeBtn').classList.toggle('active',mode==='event');
  $('#functionModeBtn').classList.toggle('active',mode==='function');
  $('#eventSidePanel').classList.toggle('hidden',mode!=='event');
  $('#functionSidePanel').classList.toggle('hidden',mode!=='function');
  if(mode==='function'&&!state.activeFunctionId&&state.functions.length)state.activeFunctionId=state.functions[0].id;
  renderLogic();
}
function blockSummary(block){
  var p=block.props||{};
  if(block.type==='if')return p.left+' '+p.op+' '+p.right;
  if(block.type==='repeat')return p.count+' vezes';
  if(block.type==='wait')return p.ms+' ms';
  if(block.type==='navigate')return p.url;
  if(block.type==='alert')return p.message;
  if(block.type==='setText'||block.type==='setValue')return p.target+' = '+p.value;
  if(block.type==='setStyle')return p.target+'.'+p.property+' = '+p.value;
  if(['show','hide','toggle'].indexOf(block.type)>=0)return p.target;
  if(block.type==='setVar')return p.name+' = '+p.value;
  if(block.type==='math')return p.name+' = '+p.left+' '+p.op+' '+p.right;
  if(block.type==='readInput')return p.name+' ← '+p.source;
  if(block.type==='storageSet')return p.key+' = '+p.value;
  if(block.type==='storageGet')return p.name+' ← '+p.key;
  if(block.type==='storageRemove')return p.key;
  if(block.type==='fetch')return p.method+' '+p.url+' → '+p.saveVar;
  if(block.type==='callFunction'){
    var f=state.functions.find(function(x){return x.id===p.functionId;});
    return f?f.name:'Selecione uma função';
  }
  if(block.type==='console')return p.message;
  return '';
}
function renderLogic(){
  var rootBox=$('#logicRoot');
  if(!rootBox)return;
  if(state.logicMode==='function'){
    var f=state.functions.find(function(x){return x.id===state.activeFunctionId;});
    $('#logicTitle').textContent=f?'ƒ '+f.name:'Nenhuma função';
    $('#logicSubtitle').textContent='Blocos reutilizáveis chamados por outros eventos';
  }else{
    $('#logicTitle').textContent=currentEventNode()+' → '+currentEventType();
    $('#logicSubtitle').textContent='Evento da página ou componente';
  }
  var blocks=activeBlocks();
  rootBox.innerHTML=blocks.length?renderBlockList(blocks):'<div class="logic-empty">Arraste um bloco da direita ou clique nele para começar.</div>';
  bindLogicDom();
}
function renderBlockList(list){
  return list.map(function(block){return renderBlock(block);}).join('');
}
function renderBlock(block){
  var meta=BLOCK_META[block.type]||{name:block.type,icon:'◆',cls:'debug'};
  var nested='';
  if(block.type==='if'){
    nested='<div class="block-slot-wrap"><div class="slot-label">ENTÃO</div><div class="block-slot" data-block-slot="children:'+block.id+'">'+renderBlockList(block.children)+'</div>'+
      '<div class="slot-label">SENÃO</div><div class="block-slot" data-block-slot="else:'+block.id+'">'+renderBlockList(block.elseChildren)+'</div></div>';
  }else if(block.type==='repeat'){
    nested='<div class="block-slot-wrap"><div class="slot-label">FAÇA</div><div class="block-slot" data-block-slot="children:'+block.id+'">'+renderBlockList(block.children)+'</div></div>';
  }
  return '<div class="logic-block block-'+meta.cls+'" draggable="true" data-block-id="'+block.id+'">'+
    '<div class="logic-block-head"><span class="logic-block-icon">'+meta.icon+'</span><div><div class="logic-block-name">'+esc(meta.name)+'</div><div class="logic-block-summary">'+esc(blockSummary(block))+'</div></div><span class="grow"></span>'+
    '<button class="block-mini" data-block-up="'+block.id+'" title="Subir">↑</button><button class="block-mini" data-block-down="'+block.id+'" title="Descer">↓</button>'+
    '<button class="block-mini" data-edit-block="'+block.id+'" title="Configurar">⚙</button><button class="block-mini danger" data-delete-block="'+block.id+'" title="Excluir">×</button></div>'+
    (nested||'<div class="logic-block-body">'+esc(blockSummary(block)||'Configure este bloco')+'</div>')+
    '</div>';
}
function bindLogicDom(){
  $$('.logic-block').forEach(function(el){
    el.addEventListener('dragstart',function(e){
      state.dragBlock={kind:'existing',id:this.dataset.blockId};
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',this.dataset.blockId);
    });
    el.addEventListener('dragend',function(){this.classList.remove('dragging');state.dragBlock=null;});
  });
  $$('[data-block-slot]').forEach(function(slot){
    slot.addEventListener('dragover',function(e){e.preventDefault();e.stopPropagation();this.classList.add('drag-over');});
    slot.addEventListener('dragleave',function(e){e.stopPropagation();this.classList.remove('drag-over');});
    slot.addEventListener('drop',function(e){
      e.preventDefault();e.stopPropagation();this.classList.remove('drag-over');
      var slotName=this.dataset.blockSlot||'root';
      if(!state.dragBlock||!canEditLogic())return;
      if(state.dragBlock.kind==='template')insertBlock(newBlock(state.dragBlock.type),slotName);
      else if(state.dragBlock.kind==='existing'){
        var b=removeBlock(state.dragBlock.id);
        if(b)insertBlock(b,slotName);
      }
      state.dragBlock=null;saveLogic();renderLogic();
    });
  });
  $$('[data-edit-block]').forEach(function(b){b.onclick=function(e){e.stopPropagation();openBlockEditor(this.dataset.editBlock);};});
  $$('[data-delete-block]').forEach(function(b){b.onclick=function(e){e.stopPropagation();removeBlock(this.dataset.deleteBlock);saveLogic();renderLogic();};});
  $$('[data-block-up]').forEach(function(b){b.onclick=function(e){e.stopPropagation();moveBlockIndex(this.dataset.blockUp,-1);};});
  $$('[data-block-down]').forEach(function(b){b.onclick=function(e){e.stopPropagation();moveBlockIndex(this.dataset.blockDown,1);};});
}
function moveBlockIndex(id,delta){
  var f=findBlock(id);if(!f)return;
  var n=f.index+delta;if(n<0||n>=f.list.length)return;
  var tmp=f.list[f.index];f.list[f.index]=f.list[n];f.list[n]=tmp;saveLogic();renderLogic();
}
function saveLogic(){autoSave();}
function canEditLogic(){
  if(state.logicMode==='function'&&!state.activeFunctionId){toast('Crie uma função primeiro');return false;}
  return true;
}
function addBlockToRoot(type){if(!canEditLogic())return;insertBlock(newBlock(type),'root');saveLogic();renderLogic();}
function clearLogic(){
  if(!confirm('Limpar todos os blocos desta lógica?'))return;
  var arr=activeBlocks();arr.splice(0,arr.length);saveLogic();renderLogic();
}
