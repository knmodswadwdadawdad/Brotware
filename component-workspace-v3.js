(function(){
'use strict';

var picker=null,configSheet=null,pickerGrid=null,pickerSearch=null;
var currentType='',editingId='';
var configObserver=null,componentObserver=null;

var DESIGN_ICONS={
  sidebar:'view_sidebar',bottomNav:'bottom_navigation',signup:'person_add',form:'edit_note',toastComponent:'toast',tabsComponent:'tab',accordion:'expand_more',carousel:'view_carousel',productCard:'shopping_bag',productGrid:'grid_view',dashboard:'dashboard',loading:'progress_activity',emptyState:'inbox',hero:'web_asset',navbar:'menu',card:'crop_square',login:'login',modal:'dialogs',footer:'vertical_align_bottom',pricing:'sell',profile:'account_circle'
};

function fc(){return window.BrotwareFunctionalComponents||null;}
function esc3(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c];});}
function catalog(){var x=fc();return x&&Array.isArray(x.catalog)?x.catalog:[];}
function byType(type){var a=catalog();for(var i=0;i<a.length;i++)if(a[i].type===type)return a[i];return null;}
function enabled(c){if(!c)return false;if(c.lib==='web'||!c.lib)return true;return !!(state.libraryManager&&state.libraryManager[c.lib]===true);}
function iconHtml(name){return '<span class="bw-google-icon">'+esc3(name||'extension')+'</span>';}
function componentById(id){var a=Array.isArray(state.functionalComponents)?state.functionalComponents:[];for(var i=0;i<a.length;i++)if(String(a[i].id)===String(id))return a[i];return null;}
function uniqueDefault(type){
  var d=byType(type),base=String(d?d.name:type).replace(/[^a-zA-Z0-9_]/g,'').toLowerCase()||'component',n=1;
  var used={};(state.functionalComponents||[]).forEach(function(c){used[String(c.name||'').toLowerCase()]=1;});
  while(used[(base+n).toLowerCase()])n++;
  return base+n;
}
function validName(name,ignoreId){
  name=String(name||'').trim();if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))return'Use letras, números e _; o nome não pode começar com número.';
  var dup=(state.functionalComponents||[]).some(function(c){return String(c.id)!==String(ignoreId||'')&&String(c.name||'').toLowerCase()===name.toLowerCase();});
  if(dup)return'Já existe um componente com esse nome.';
  return'';
}

function buildSheets(){
  if(picker)return;
  picker=document.createElement('div');picker.className='bw-cv3-backdrop';picker.id='bwComponentPickerV3';
  picker.innerHTML='<section class="bw-cv3-sheet"><header class="bw-cv3-head"><span class="bw-cv3-grab"></span><div><h2>Add component</h2><small>Escolha uma funcionalidade para adicionar ao projeto</small></div><button class="bw-cv3-close" type="button" data-cv3-close="picker">×</button></header><div class="bw-cv3-search"><input id="bwCv3Search" placeholder="Search components..."></div><main class="bw-cv3-grid" id="bwCv3Grid"></main></section>';
  document.body.appendChild(picker);pickerGrid=document.getElementById('bwCv3Grid');pickerSearch=document.getElementById('bwCv3Search');pickerSearch.oninput=renderPicker;picker.onclick=function(e){if(e.target===picker)closePicker();};

  configSheet=document.createElement('div');configSheet.className='bw-cv3-backdrop';configSheet.id='bwComponentConfigV3';
  configSheet.innerHTML='<section class="bw-cv3-sheet compact"><header class="bw-cv3-head"><span class="bw-cv3-grab"></span><div><h2 id="bwCv3ConfigTitle">Component</h2><small id="bwCv3ConfigSub">Configure before adding</small></div><button class="bw-cv3-close" type="button" data-cv3-close="config">×</button></header><main class="bw-cv3-config" id="bwCv3ConfigBody"></main></section>';
  document.body.appendChild(configSheet);configSheet.onclick=function(e){if(e.target===configSheet)closeConfigSheet();};

  document.addEventListener('click',function(e){
    var close=e.target.closest&&e.target.closest('[data-cv3-close]');if(close){e.preventDefault();e.stopImmediatePropagation();close.dataset.cv3Close==='picker'?closePicker():closeConfigSheet();return;}
    var add=e.target.closest&&e.target.closest('[data-cv3-type]');if(add){e.preventDefault();e.stopImmediatePropagation();var d=byType(add.dataset.cv3Type);if(!enabled(d)){closePicker();setTimeout(openLibraryManager,50);return;}openConfigure(add.dataset.cv3Type,'');return;}
    var save=e.target.closest&&e.target.closest('#bwCv3SaveComponent');if(save){e.preventDefault();e.stopImmediatePropagation();saveConfigured();return;}
  },true);
}
function renderPicker(){
  if(!pickerGrid)return;var q=String(pickerSearch&&pickerSearch.value||'').trim().toLowerCase();
  var a=catalog().filter(function(c){return !q||(String(c.name)+' '+String(c.desc||'')).toLowerCase().indexOf(q)>=0;});
  pickerGrid.innerHTML=a.map(function(c){var on=enabled(c);return '<button type="button" class="bw-cv3-card'+(on?'':' disabled')+'" data-cv3-type="'+esc3(c.type)+'"><span class="icon">'+iconHtml(c.icon)+'</span><span><b>'+esc3(c.name)+'</b><small>'+esc3(c.desc||'')+'</small>'+(on?'':'<em>Library OFF</em>')+'</span></button>';}).join('');
}
function openPicker(){buildSheets();editingId='';currentType='';pickerSearch.value='';renderPicker();picker.classList.add('show');}
function closePicker(){if(picker)picker.classList.remove('show');}
function closeConfigSheet(){if(configSheet)configSheet.classList.remove('show');}
function openConfigure(type,id){
  buildSheets();var item=id?componentById(id):null,d=byType(type||(item&&item.type));if(!d)return;
  currentType=d.type;editingId=item?item.id:'';closePicker();
  document.getElementById('bwCv3ConfigTitle').textContent=item?'Edit component':d.name;
  document.getElementById('bwCv3ConfigSub').textContent=item?'Renomeie ou confira a configuração':'Configure o componente antes de adicionar';
  var name=item?item.name:uniqueDefault(d.type),firebase=d.type==='firebaseAuth'||d.type==='firebaseDb';
  var note='O nome será usado para identificar este componente nos eventos e blocos.';
  if(firebase){
    var cfg=state.firebaseConfig||{};
    if(d.type==='firebaseAuth')note='Firebase Auth usa a Web API Key configurada em Configurações → Library Manager.';
    else note='Firebase DB usa a Database URL e a autenticação configuradas em Configurações → Library Manager.';
    if(!cfg.apiKey)note+=' A Web API Key ainda não foi configurada.';
    if(d.type==='firebaseDb'&&!cfg.databaseURL)note+=' A Database URL ainda não foi configurada.';
  }
  document.getElementById('bwCv3ConfigBody').innerHTML='<div class="bw-cv3-component-info"><span class="icon">'+iconHtml(d.icon)+'</span><span><b>'+esc3(d.name)+'</b><small>'+esc3(d.desc||'Functional component')+'</small></span></div><label class="bw-cv3-field"><span>Component name</span><input id="bwCv3Name" value="'+esc3(name)+'" autocomplete="off" spellcheck="false"></label><div class="bw-cv3-error" id="bwCv3Error"></div><div class="bw-cv3-hint">'+esc3(note)+'</div><div class="bw-cv3-actions"><button type="button" data-cv3-close="config">Cancel</button><button type="button" class="primary" id="bwCv3SaveComponent">'+(item?'Save':'Add')+'</button></div>';
  configSheet.classList.add('show');setTimeout(function(){var n=document.getElementById('bwCv3Name');if(n){n.focus();n.select();}},80);
}
function saveConfigured(){
  var input=document.getElementById('bwCv3Name'),name=input?input.value.trim():'',err=validName(name,editingId),box=document.getElementById('bwCv3Error');
  if(err){if(box){box.textContent=err;box.classList.add('show');}return;}
  if(editingId){var old=componentById(editingId);if(!old)return;old.name=name;}
  else{
    var api=fc();if(!api||!api.add)return;var before={};(state.functionalComponents||[]).forEach(function(c){before[c.id]=1;});api.add(currentType);
    var created=(state.functionalComponents||[]).find(function(c){return c.type===currentType&&!before[c.id];});if(!created)return;created.name=name;
  }
  if(typeof autoSave==='function')autoSave();var api2=fc();if(api2&&api2.refresh)api2.refresh();
  try{if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();}catch(_){}
  try{window.dispatchEvent(new CustomEvent('brotware:logic-refresh'));}catch(_){}
  closeConfigSheet();installComponentScreen();
}

function installComponentScreen(){
  var screen=document.getElementById('screen-component'),panel=document.getElementById('bwFunctionalComponentsPanel');if(!screen||!panel){setTimeout(installComponentScreen,180);return;}
  screen.classList.add('bw-component-v3');
  var strong=panel.querySelector('.bw-fc-head strong'),small=panel.querySelector('.bw-fc-head small'),add=document.getElementById('bwAddFunctionalBtn');
  if(strong)strong.textContent='Components';if(small)small.textContent='Componentes funcionais, APIs e serviços usados pelos blocos e eventos';if(add)add.innerHTML='＋ Add component';
  if(screen.dataset.bwCv3Installed==='1')return;screen.dataset.bwCv3Installed='1';
  screen.addEventListener('click',function(e){
    var addBtn=e.target.closest&&e.target.closest('#bwAddFunctionalBtn');if(addBtn){e.preventDefault();e.stopImmediatePropagation();openPicker();return;}
    if(e.target.closest&&e.target.closest('[data-fc-del]'))return;
    var row=e.target.closest&&e.target.closest('.bw-fc-instance');if(row){var del=row.querySelector('[data-fc-del]');if(del){e.preventDefault();e.stopImmediatePropagation();var item=componentById(del.dataset.fcDel);if(item)openConfigure(item.type,item.id);}}
  },true);
  componentObserver=new MutationObserver(function(){var s=document.getElementById('screen-component');if(s)s.classList.add('bw-component-v3');});componentObserver.observe(screen,{childList:true,subtree:true});
}

function configList(){return document.getElementById('bwConfigList');}
function configCard(kind,icon,name,sub){var b=document.createElement('button');b.className='bw-config-card';b.type='button';b.dataset.bwCv3Manager=kind;b.innerHTML='<span class="bw-config-icon">'+iconHtml(icon)+'</span><span><b>'+esc3(name)+'</b><small>'+esc3(sub)+'</small></span><span class="chev">›</span>';return b;}
function injectConfigCards(){
  var list=configList();if(!list)return;
  var comp=list.querySelector('[data-manager="components"]');if(comp){var b=comp.querySelector('b'),s=comp.querySelector('small');if(b)b.textContent='Component Manager';if(s)s.textContent='Functional components, APIs and events';}
  var collections=list.querySelector('[data-manager="collections"]');if(collections)collections.style.display='none';
  if(!list.querySelector('[data-bw-cv3-manager="designs"]')){var d=configCard('designs','dashboard_customize','Designs','Ready-made UI layouts and saved designs');d.dataset.bwCv3Manager='designs';if(comp&&comp.nextSibling)list.insertBefore(d,comp.nextSibling);else list.appendChild(d);}
  if(!list.querySelector('[data-bw-cv3-manager="libraries"]')){var l=configCard('libraries','library_books','Library Manager','Firebase, browser APIs, speech and external services');l.dataset.bwCv3Manager='libraries';var design=list.querySelector('[data-bw-cv3-manager="designs"]');if(design&&design.nextSibling)list.insertBefore(l,design.nextSibling);else list.appendChild(l);}
}
function showConfigDetail(title,sub,html){var detail=document.getElementById('bwConfigDetail'),t=document.getElementById('bwConfigDetailTitle'),s=document.getElementById('bwConfigDetailSub'),body=document.getElementById('bwConfigDetailBody');if(!detail||!body)return false;if(t)t.textContent=title;if(s)s.textContent=sub||'';body.innerHTML=html||'';detail.classList.add('show');return true;}
function designCards(){var lib=window.BrotwareComponentLibrary;return lib&&Array.isArray(lib.cards)?lib.cards:[];}
function designIcon(id){return DESIGN_ICONS[id]||'dashboard_customize';}
function openDesigns(){
  var cards=designCards(),saved=Array.isArray(state.components)?state.components:[];
  var html='<div class="bw-design-section-title">Built-in designs</div><div class="bw-design-grid">'+cards.map(function(c){return '<button type="button" class="bw-design-card" data-bw-design="'+esc3(c[0])+'"><span class="bw-google-icon">'+designIcon(c[0])+'</span><b>'+esc3(c[2])+'</b><small>'+esc3(c[3])+'</small></button>';}).join('')+'</div><div class="bw-design-section-title">Saved designs</div>';
  if(!saved.length)html+='<div class="bw-design-empty">Nenhum design salvo. No editor de View, selecione um elemento/layout e use “Salvar como componente”.</div>';
  else html+='<div class="bw-design-grid">'+saved.map(function(c){return '<div class="bw-design-saved-row"><button type="button" class="bw-design-card saved" data-bw-saved-design="'+esc3(c.id)+'"><span class="bw-google-icon">widgets</span><b>'+esc3(c.name)+'</b><small>Design salvo neste projeto</small></button><button type="button" class="bw-design-delete" data-bw-delete-design="'+esc3(c.id)+'">×</button></div>';}).join('')+'</div>';
  if(!showConfigDetail('Designs','Ready-made layouts and reusable visual designs',html))return;
  var body=document.getElementById('bwConfigDetailBody');
  body.querySelectorAll('[data-bw-design]').forEach(function(b){b.onclick=function(){insertBuiltInDesign(this.dataset.bwDesign);};});
  body.querySelectorAll('[data-bw-saved-design]').forEach(function(b){b.onclick=function(){insertSavedDesign(this.dataset.bwSavedDesign);};});
  body.querySelectorAll('[data-bw-delete-design]').forEach(function(b){b.onclick=function(){var id=this.dataset.bwDeleteDesign;if(!confirm('Excluir este design salvo?'))return;state.components=state.components.filter(function(c){return c.id!==id;});if(typeof renderComponents==='function')renderComponents();if(typeof autoSave==='function')autoSave();openDesigns();};});
}
function closeConfiguration(){var b=document.getElementById('bwConfigClose');if(b)b.click();}
function insertBuiltInDesign(id){var fn=window.builtinComponents&&window.builtinComponents[id];if(!fn&&typeof builtinComponents!=='undefined')fn=builtinComponents[id];if(!fn)return;closeConfiguration();setTimeout(function(){try{fn();if(typeof switchTab==='function')switchTab('view');}catch(e){console.error(e);}},80);}
function insertSavedDesign(id){if(typeof insertCustomComponent!=='function')return;closeConfiguration();setTimeout(function(){insertCustomComponent(id);if(typeof switchTab==='function')switchTab('view');},80);}
function openLibraryManager(){var api=fc();closeConfiguration();setTimeout(function(){if(api&&api.openLibrary)api.openLibrary();},70);}
function installConfig(){
  var list=configList();if(!list){setTimeout(installConfig,220);return;}injectConfigCards();if(list.dataset.bwCv3Installed==='1')return;list.dataset.bwCv3Installed='1';
  list.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bw-cv3-manager]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();b.dataset.bwCv3Manager==='designs'?openDesigns():openLibraryManager();},true);
  configObserver=new MutationObserver(injectConfigCards);configObserver.observe(list,{childList:true,subtree:true});
}

function install(){buildSheets();installComponentScreen();installConfig();var api=fc();if(api)api.openAdd=openPicker;}
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
window.addEventListener('brotware:logic-refresh',function(){setTimeout(installComponentScreen,0);});
window.BrotwareComponentWorkspaceV3={openAdd:openPicker,openDesigns:openDesigns,refresh:function(){installComponentScreen();injectConfigCards();}};
})();
