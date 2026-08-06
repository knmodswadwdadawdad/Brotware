'use strict';
/* ---------- EVENT HANDLERS ---------- */
$$('.tab').forEach(function(t){t.onclick=function(){switchTab(this.dataset.tab);};});
$$('[data-create]').forEach(function(b){
  b.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse')startPaletteDrag(e,this.dataset.create);
  });
  b.addEventListener('click',function(){
    if(state.ignorePaletteClick)return;
    createNode(this.dataset.create,20,20,root);
  });
});
$$('[data-palette]').forEach(function(b){b.onclick=function(){
  $$('[data-palette]').forEach(function(x){x.classList.remove('active');});this.classList.add('active');
  $('#paletteBasic').classList.toggle('hidden',this.dataset.palette!=='basic');
  $('#paletteFavorites').classList.toggle('hidden',this.dataset.palette!=='favorites');
};});
$$('[data-device]').forEach(function(b){b.onclick=function(){setDevice(this.dataset.device);};});
$('#zoomOutBtn').onclick=function(){setZoom(state.zoom-.1);};$('#zoomInBtn').onclick=function(){setZoom(state.zoom+.1);};
$('#gridBtn').onclick=function(){state.snap=state.snap?0:8;this.textContent=state.snap?'Grid 8':'Grid OFF';this.classList.toggle('active',!!state.snap);$('#gridLayer').style.display=state.snap?'block':'none';};
$('#propertiesBtn').onclick=function(){openProperties();};$('#selectedTargetBtn').onclick=function(){openProperties();};$('#hidePropertiesBtn').onclick=function(){selectNode(null);};
$$('[data-quick]').forEach(function(b){b.onclick=function(){if(this.dataset.quick==='event'){switchTab('event');if(state.selectedId){$('#eventNodeSelect').value=state.selectedId;refreshEventTypes();}}else openProperties(this.dataset.quick);};});
$('#applyPropertiesBtn').onclick=applyProperties;$('#deleteNodeBtn').onclick=function(){deleteSelected();closeModal('propertiesModal');};
$('#duplicateBtn').onclick=duplicateSelected;$('#saveComponentBtn').onclick=saveSelectedComponent;
$('#undoBtn').onclick=function(){restoreHistory(-1);};$('#redoBtn').onclick=function(){restoreHistory(1);};
$('#runBtn').onclick=preview;$('#codeBtn').onclick=showCode;$('#saveBtn').onclick=function(){autoSave();toast('Projeto salvo');};
$('#newPageBtn').onclick=function(){openModal('pagesModal');};$('#pageSelectorBtn').onclick=function(){renderPages();openModal('pagesModal');};$('#pagesBtn').onclick=function(){renderPages();openModal('pagesModal');};
$('#createPageBtn').onclick=createPage;
$('#projectBtn').onclick=function(){$('#projectNameInput').value=state.projectName;openModal('projectModal');};
$('#saveBrowserBtn').onclick=function(){state.projectName=$('#projectNameInput').value.trim()||state.projectName;updatePageUI();autoSave();toast('Salvo no navegador');};
$('#downloadProjectBtn').onclick=downloadProject;$('#uploadProjectBtn').onclick=function(){$('#projectInput').click();};$('#resetProjectBtn').onclick=resetProject;
$('#importHtmlBtn').onclick=function(){$('#htmlInput').click();};$('#exportPageBtn').onclick=exportCurrent;$('#exportAllBtn').onclick=exportAll;
$('#htmlInput').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){importHtml(r.result,f.name);};r.readAsText(f);this.value='';};
$('#projectInput').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){importProject(r.result);};r.readAsText(f);this.value='';};
$('#addVariableBtn').onclick=addVariable;$('#addStringBtn').onclick=addString;
$$('[data-component]').forEach(function(b){b.onclick=function(){var fn=builtinComponents[this.dataset.component];if(fn){fn();switchTab('view');}};});
$('#createComponentBtn').onclick=saveSelectedComponent;

/* block palette */
$$('[data-block-type]').forEach(function(b){
  b.addEventListener('dragstart',function(e){state.ignoreBlockClick=true;state.dragBlock={kind:'template',type:this.dataset.blockType};e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',this.dataset.blockType);});
  b.addEventListener('dragend',function(){state.dragBlock=null;setTimeout(function(){state.ignoreBlockClick=false;},0);});
  b.onclick=function(){if(state.ignoreBlockClick)return;addBlockToRoot(this.dataset.blockType);};
});
$('#logicRoot').addEventListener('dragover',function(e){e.preventDefault();this.classList.add('drag-over');});
$('#logicRoot').addEventListener('dragleave',function(e){if(e.target===this)this.classList.remove('drag-over');});
$('#logicRoot').addEventListener('drop',function(e){
  e.preventDefault();this.classList.remove('drag-over');
  if(!state.dragBlock||!canEditLogic())return;
  if(state.dragBlock.kind==='template')insertBlock(newBlock(state.dragBlock.type),'root');
  else if(state.dragBlock.kind==='existing'){var b=removeBlock(state.dragBlock.id);if(b)insertBlock(b,'root');}
  state.dragBlock=null;saveLogic();renderLogic();
});
$('#eventNodeSelect').onchange=refreshEventTypes;$('#eventTypeSelect').onchange=renderLogic;
$('#eventModeBtn').onclick=function(){setLogicMode('event');};$('#functionModeBtn').onclick=function(){setLogicMode('function');};
$('#addFunctionBtn').onclick=addFunction;$('#clearLogicBtn').onclick=clearLogic;$('#testEventBtn').onclick=testCurrentLogic;$('#showGeneratedLogicBtn').onclick=showLogicCode;
$('#saveBlockBtn').onclick=saveBlockEditor;$('#deleteBlockBtn').onclick=deleteEditingBlock;

$$('[data-close]').forEach(function(b){b.onclick=function(){closeModal(this.dataset.close);};});
$('#copyCodeBtn').onclick=function(){navigator.clipboard.writeText($('#generatedCode').value).then(function(){toast('Copiado');}).catch(function(){toast('Não foi possível copiar');});};
$('#downloadCodeBtn').onclick=function(){var p=currentPage();downloadText(p?p.name:'codigo.html',$('#generatedCode').value,'text/html;charset=utf-8');};

window.addEventListener('keydown',function(e){
  var tag=document.activeElement&&document.activeElement.tagName,typing=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT';
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();autoSave();toast('Salvo');}
  if(!typing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();restoreHistory(-1);}
  if(!typing&&(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y')||((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();restoreHistory(1);}
  if(!typing&&e.key==='Delete'&&state.selectedId){e.preventDefault();deleteSelected();}
  if(!typing&&state.selectedId&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].indexOf(e.key)>=0){
    e.preventDefault();var el=selectedNode(),step=e.shiftKey?8:1,x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0;
    if(e.key==='ArrowLeft')x-=step;if(e.key==='ArrowRight')x+=step;if(e.key==='ArrowUp')y-=step;if(e.key==='ArrowDown')y+=step;
    el.style.left=x+'px';el.style.top=y+'px';commit();
  }
});

/* ---------- INIT ---------- */
function init(){
  if(!loadSaved()){
    state.pages=[newPage('index.html','Página inicial')];
    state.currentPageId=state.pages[0].id;
  }
  state.pages.forEach(ensurePageSchema);
  loadPage(state.currentPageId,true);
  renderVariables();renderFunctions();renderStrings();renderComponents();refreshStringOptions();setDevice('mobile');setZoom(1);
  status('Ready');
}
init();
