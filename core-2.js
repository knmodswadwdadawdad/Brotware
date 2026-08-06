function openProperties(focus){
  var el=selectedNode();if(!el)return;
  var t=contentTarget(el);
  $('#propertiesSubtitle').textContent=el.dataset.vfId+' · '+el.dataset.type;
  $('#propId').value=el.dataset.vfId||'';
  $('#propType').value=el.dataset.type||'';
  $('#propX').value=parseFloat(el.style.left)||0;
  $('#propY').value=parseFloat(el.style.top)||0;
  $('#propWidth').value=el.style.width||el.offsetWidth+'px';
  $('#propHeight').value=el.style.height||el.offsetHeight+'px';
  $('#propText').value=getText(el);
  $('#propPlaceholder').value=textPlaceholder(el);
  $('#propBackground').value=t.style.background||t.style.backgroundColor||'';
  $('#propColor').value=t.style.color||'';
  $('#propFontSize').value=t.style.fontSize||'';
  $('#propFontWeight').value=t.style.fontWeight||'';
  $('#propBorder').value=t.style.border||'';
  $('#propRadius').value=t.style.borderRadius||'';
  $('#propPadding').value=t.style.padding||'';
  $('#propOpacity').value=el.style.opacity||'1';
  $('#propClass').value=el.dataset.userClass||'';
  $('#propHref').value=el.dataset.href||'';
  $('#propCustomCss').value=t.dataset.customCss||'';
  refreshStringOptions();
  $('#propStringKey').value=el.dataset.stringKey||'';
  openModal('propertiesModal');
  if(focus){
    var map={text:'#propText',width:'#propWidth',height:'#propHeight',background:'#propBackground',color:'#propColor'};
    setTimeout(function(){var n=$(map[focus]);if(n)n.focus();},50);
  }
}
function renameNodeInEvents(oldId,newId){
  state.pages.forEach(function(p){
    if(p.events && p.events[oldId]){
      p.events[newId]=p.events[oldId];
      delete p.events[oldId];
    }
    walkBlocksInPage(p,function(b){
      ['target','source'].forEach(function(k){
        if(b.props && b.props[k]===oldId) b.props[k]=newId;
      });
    });
  });
  state.functions.forEach(function(f){
    walkBlocks(f.blocks,function(b){
      ['target','source'].forEach(function(k){
        if(b.props && b.props[k]===oldId) b.props[k]=newId;
      });
    });
  });
}
function applyProperties(){
  var el=selectedNode();if(!el)return;
  var t=contentTarget(el),old=el.dataset.vfId,id=$('#propId').value.trim()||old;
  if(id!==old && root.querySelector('[data-vf-id="'+id+'"]')){toast('Esse ID já existe');return;}
  if(id!==old){renameNodeInEvents(old,id);el.dataset.vfId=id;state.selectedId=id;}
  el.style.left=snap(parseFloat($('#propX').value||0))+'px';
  el.style.top=snap(parseFloat($('#propY').value||0))+'px';
  el.style.width=$('#propWidth').value.trim();
  el.style.height=$('#propHeight').value.trim();
  el.style.opacity=$('#propOpacity').value.trim()||'1';
  var key=$('#propStringKey').value;
  el.dataset.stringKey=key||'';
  if(key&&state.strings[key]!=null)setText(el,state.strings[key]);else setText(el,$('#propText').value);
  if(t&&'placeholder' in t)t.placeholder=$('#propPlaceholder').value;
  t.style.background=$('#propBackground').value.trim();
  t.style.color=$('#propColor').value.trim();
  t.style.fontSize=$('#propFontSize').value.trim();
  t.style.fontWeight=$('#propFontWeight').value.trim();
  t.style.border=$('#propBorder').value.trim();
  t.style.borderRadius=$('#propRadius').value.trim();
  t.style.padding=$('#propPadding').value.trim();
  el.dataset.userClass=$('#propClass').value.trim();
  el.dataset.href=$('#propHref').value.trim();
  applyCustomCss(el,$('#propCustomCss').value);
  $('#selectedTargetName').textContent=el.dataset.vfId;
  closeModal('propertiesModal');
  commit();
  toast('Propriedades aplicadas');
}
function serializeEditor(){
  var c=root.cloneNode(true);
  var g=c.querySelector('#gridLayer');if(g)g.remove();
  c.querySelectorAll('.resize-handle').forEach(function(h){h.remove();});
  c.querySelectorAll('.selected,.drop-target').forEach(function(n){n.classList.remove('selected','drop-target');});
  c.querySelectorAll('[data-bound]').forEach(function(n){n.removeAttribute('data-bound');});
  return c.innerHTML;
}
function saveCurrentPage(){
  var p=currentPage();if(!p)return;
  p.content=serializeEditor();
  p.background=root.style.background||'#fff';
  p.updatedAt=Date.now();
}
function commit(){
  var p=currentPage();if(!p)return;
  var html=serializeEditor(),id=p.id;
  if(!state.histories[id]){state.histories[id]=[];state.historyIndex[id]=-1;}
  var arr=state.histories[id],idx=state.historyIndex[id];
  if(arr[idx]===html){autoSave();return;}
  arr.splice(idx+1);
  arr.push(html);
  if(arr.length>80)arr.shift();
  state.historyIndex[id]=arr.length-1;
  p.content=html;p.background=root.style.background||'#fff';p.updatedAt=Date.now();
  updateUndoRedo();autoSave();
}
function restoreHistory(delta){
  var p=currentPage();if(!p)return;
  var arr=state.histories[p.id]||[],idx=(state.historyIndex[p.id]||0)+delta;
  if(idx<0||idx>=arr.length)return;
  state.historyIndex[p.id]=idx;
  root.innerHTML='<div class="grid-layer" id="gridLayer"></div>'+arr[idx];
  bindAllNodes();refreshStringsOnDom();selectNode(null);
  p.content=serializeEditor();updateUndoRedo();autoSave();
}
function updateUndoRedo(){
  var p=currentPage(),arr=p?(state.histories[p.id]||[]):[],idx=p?(state.historyIndex[p.id]||0):0;
  $('#undoBtn').disabled=idx<=0;
  $('#redoBtn').disabled=idx>=arr.length-1;
}
function loadPage(id,skipSave){
  if(!skipSave)saveCurrentPage();
  var p=state.pages.find(function(x){return x.id===id;});if(!p)return;
  state.currentPageId=id;state.selectedId=null;
  root.innerHTML='<div class="grid-layer" id="gridLayer"></div>'+(p.content||'');
  root.style.background=p.background||'#fff';
  bindAllNodes();refreshStringsOnDom();
  if(!state.histories[id]){state.histories[id]=[serializeEditor()];state.historyIndex[id]=0;}
  selectNode(null);updatePageUI();renderPages();refreshEventNodeSelect();renderLogic();autoSave();
}
function updatePageUI(){
  var p=currentPage();
  $('#projectName').textContent=state.projectName;
  $('#projectInfo').textContent=state.pages.length+' página'+(state.pages.length===1?'':'s')+' · '+state.components.length+' componente'+(state.components.length===1?'':'s')+' · '+state.functions.length+' função'+(state.functions.length===1?'':'ões');
  $('#currentPageName').textContent=p?p.name:'-';
  $('#phoneLabel').textContent=p?p.name:'-';
  $('#statusFile').textContent=p?p.name:'-';
  $('#statusPage').textContent=p?p.name:'-';
  document.title=(p?p.name:'Brotware')+' — '+state.projectName;
}

/* ---------- PAGES / PROJECT ---------- */
function renderPages(){
  var box=$('#pagesList');box.innerHTML='';
  state.pages.forEach(function(p){
    var row=document.createElement('div');
    row.className='page-row'+(p.id===state.currentPageId?' active':'');
    row.innerHTML='<div class="page-row-main" data-open-page="'+p.id+'"><b>'+esc(p.name)+'</b><small>'+esc(p.title)+'</small></div>'+
      '<div class="page-row-actions">'+
      '<button data-page-action="duplicate" data-page-id="'+p.id+'" title="Duplicar">⧉</button>'+
      '<button data-page-action="rename" data-page-id="'+p.id+'" title="Renomear">✎</button>'+
      '<button class="danger" data-page-action="delete" data-page-id="'+p.id+'" title="Excluir">×</button></div>';
    box.appendChild(row);
  });
  $$('[data-open-page]').forEach(function(el){el.onclick=function(){loadPage(this.dataset.openPage);closeModal('pagesModal');};});
  $$('[data-page-action]').forEach(function(el){el.onclick=function(e){e.stopPropagation();pageAction(this.dataset.pageAction,this.dataset.pageId);};});
}
function createPage(){
  var p=newPage($('#newPageName').value,$('#newPageTitle').value);
  saveCurrentPage();state.pages.push(p);loadPage(p.id,true);
  $('#newPageName').value='nova-pagina.html';$('#newPageTitle').value='Nova página';
  toast(p.name+' criado');
}
function pageAction(action,id){
  var p=state.pages.find(function(x){return x.id===id;});if(!p)return;
  if(action==='duplicate'){
    saveCurrentPage();
    var copy=JSON.parse(JSON.stringify(p));
    copy.id=uid('page');copy.name=uniquePageName(p.name.replace(/\.html?$/i,'')+'-copia.html');copy.title=p.title+' - cópia';
    copy.createdAt=Date.now();copy.updatedAt=Date.now();
    state.pages.push(copy);loadPage(copy.id,true);toast('Página duplicada');
  }else if(action==='rename'){
    var n=prompt('Nome do arquivo:',p.name);if(n===null)return;
    var t=prompt('Título:',p.title);p.name=uniquePageName(n,p.id);if(t!==null)p.title=t;
    updatePageUI();renderPages();autoSave();
  }else if(action==='delete'){
    if(state.pages.length<=1){toast('Precisa existir pelo menos uma página');return;}
    if(!confirm('Excluir '+p.name+'?'))return;
    state.pages=state.pages.filter(function(x){return x.id!==id;});
    if(state.currentPageId===id)loadPage(state.pages[0].id,true);else{renderPages();autoSave();}
  }
}
function autoSave(){
  try{
    saveCurrentPage();
    localStorage.setItem(state.storageKey,JSON.stringify({
      version:3,projectName:state.projectName,pages:state.pages,currentPageId:state.currentPageId,
      strings:state.strings,variables:state.variables,functions:state.functions,components:state.components,counter:state.counter
    }));
    status('Saved');
  }catch(e){status('Save error');}
}
function loadSaved(){
  try{
    var raw=localStorage.getItem(state.storageKey);if(!raw)return false;
    var d=JSON.parse(raw);if(!d||!Array.isArray(d.pages)||!d.pages.length)return false;
    state.projectName=d.projectName||state.projectName;state.pages=d.pages;
    state.currentPageId=d.currentPageId||d.pages[0].id;state.strings=d.strings||{};state.variables=d.variables||{};
    state.functions=d.functions||[];state.components=d.components||[];state.counter=d.counter||1;
    state.pages.forEach(ensurePageSchema);
    return true;
  }catch(e){return false;}
}
function ensurePageSchema(p){
  if(!p.events)p.events={};
  if(!p.events['@page'])p.events['@page']={load:[]};
}
function resetProject(){
  if(!confirm('Criar um projeto novo?'))return;
  localStorage.removeItem(state.storageKey);
  state.projectName='Brotware Project';state.pages=[newPage('index.html','Página inicial')];
  state.currentPageId=state.pages[0].id;state.strings={app_name:'Meu Site'};state.variables={counter:0};
  state.functions=[];state.components=[];state.histories={};state.historyIndex={};state.counter=1;
  closeModal('projectModal');loadPage(state.currentPageId,true);renderVariables();renderFunctions();renderStrings();renderComponents();toast('Projeto novo');
}
function downloadText(name,text,type){
  var b=new Blob([text],{type:type||'text/plain;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href);},500);
}
function downloadProject(){
  saveCurrentPage();
  downloadText((state.projectName||'brotware').replace(/[^a-z0-9_-]+/gi,'-')+'.brotware.json',
    JSON.stringify({
      format:'Brotware Studio',version:3,projectName:state.projectName,pages:state.pages,currentPageId:state.currentPageId,
      strings:state.strings,variables:state.variables,functions:state.functions,components:state.components,counter:state.counter
    },null,2),'application/json;charset=utf-8');
}
function importProject(text){
  try{
    var d=JSON.parse(text);
    if(!d||!Array.isArray(d.pages)||!d.pages.length)throw new Error('invalid');
    state.projectName=d.projectName||'Brotware Project';state.pages=d.pages;state.currentPageId=d.currentPageId||d.pages[0].id;
    state.strings=d.strings||{};state.variables=d.variables||{};state.functions=d.functions||[];state.components=d.components||[];state.counter=d.counter||1;
    state.pages.forEach(ensurePageSchema);state.histories={};state.historyIndex={};
    loadPage(state.currentPageId,true);renderVariables();renderFunctions();renderStrings();renderComponents();autoSave();closeModal('projectModal');toast('Projeto importado');
  }catch(e){toast('Projeto inválido');}
}
