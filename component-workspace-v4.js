(function(){
'use strict';

var picker=null,editor=null,grid=null,search=null,editingId='',editingType='';
var DESIGN_ICONS={sidebar:'view_sidebar',bottomNav:'bottom_navigation',signup:'person_add',form:'edit_note',toastComponent:'notification_important',tabsComponent:'tab',accordion:'expand_more',carousel:'view_carousel',productCard:'shopping_bag',productGrid:'grid_view',dashboard:'dashboard',loading:'progress_activity',emptyState:'inbox',hero:'web_asset',navbar:'menu',card:'crop_square',login:'login',modal:'chat_bubble',footer:'vertical_align_bottom',pricing:'sell',profile:'account_circle'};

function api(){return window.BrotwareFunctionalComponents||null;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function icon(n){return'<span class="bw-google-icon">'+esc(n||'extension')+'</span>';}
function catalog(){var a=api();return a&&Array.isArray(a.catalog)?a.catalog:[];}
function meta(type){return catalog().find(function(x){return x.type===type;})||null;}
function components(){if(!Array.isArray(state.functionalComponents))state.functionalComponents=[];return state.functionalComponents;}
function component(id){return components().find(function(x){return String(x.id)===String(id);})||null;}
function libraryOn(d){if(!d||!d.lib||d.lib==='web')return true;return !!(state.libraryManager&&state.libraryManager[d.lib]===true);}
function defaultName(type){var d=meta(type),base=String(d?d.name:type).replace(/[^a-zA-Z0-9_]/g,'').toLowerCase()||'component',n=1;while(components().some(function(x){return String(x.name||'').toLowerCase()===(base+n).toLowerCase();}))n++;return base+n;}
function nameError(name,ignore){name=String(name||'').trim();if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))return'Use letras, números e _. O nome não pode começar com número.';if(components().some(function(x){return String(x.id)!==String(ignore||'')&&String(x.name||'').toLowerCase()===name.toLowerCase();}))return'Já existe um componente com esse nome.';return'';}

function buildSheets(){
  if(picker)return;
  picker=document.createElement('div');picker.id='bwComponentPickerV4';picker.className='bw-cv3-backdrop';picker.innerHTML='<section class="bw-cv3-sheet"><header class="bw-cv3-head"><span class="bw-cv3-grab"></span><div><h2>Add component</h2><small>Escolha uma funcionalidade para o projeto</small></div><button class="bw-cv3-close" data-cv4-close="picker">×</button></header><div class="bw-cv3-search"><input id="bwCv4Search" placeholder="Search components..."></div><main class="bw-cv3-grid" id="bwCv4Grid"></main></section>';document.body.appendChild(picker);grid=document.getElementById('bwCv4Grid');search=document.getElementById('bwCv4Search');search.oninput=renderPicker;picker.onclick=function(e){if(e.target===picker)closePicker();};
  editor=document.createElement('div');editor.id='bwComponentEditorV4';editor.className='bw-cv3-backdrop';editor.innerHTML='<section class="bw-cv3-sheet compact"><header class="bw-cv3-head"><span class="bw-cv3-grab"></span><div><h2 id="bwCv4Title">Component</h2><small id="bwCv4Sub">Configure before adding</small></div><button class="bw-cv3-close" data-cv4-close="editor">×</button></header><main class="bw-cv3-config" id="bwCv4Body"></main></section>';document.body.appendChild(editor);editor.onclick=function(e){if(e.target===editor)closeEditor();};
}
function renderPicker(){var q=String(search&&search.value||'').trim().toLowerCase();grid.innerHTML=catalog().filter(function(d){return!q||(String(d.name)+' '+String(d.desc||'')).toLowerCase().indexOf(q)>=0;}).map(function(d){var on=libraryOn(d);return'<button class="bw-cv3-card'+(on?'':' disabled')+'" type="button" data-cv4-type="'+esc(d.type)+'"><span class="icon">'+icon(d.icon)+'</span><span><b>'+esc(d.name)+'</b><small>'+esc(d.desc||'')+'</small>'+(on?'':'<em>Library OFF</em>')+'</span></button>';}).join('');}
function openPicker(){buildSheets();editingId='';editingType='';search.value='';renderPicker();picker.classList.add('show');}
function closePicker(){if(picker)picker.classList.remove('show');}
function closeEditor(){if(editor)editor.classList.remove('show');}
function openEditor(type,id){
  buildSheets();var item=id?component(id):null,d=meta(type||(item&&item.type));if(!d)return;editingId=item?item.id:'';editingType=d.type;closePicker();
  document.getElementById('bwCv4Title').textContent=item?'Edit component':d.name;document.getElementById('bwCv4Sub').textContent=item?'Rename this component':'Give the component a project name';
  var cfg=state.firebaseConfig||{},note='O nome identifica este componente nos blocos e eventos.';if(d.type==='firebaseAuth')note='Usa a Web API Key de Configurações → Library Manager.';if(d.type==='firebaseDb')note='Usa a Realtime Database URL de Configurações → Library Manager.';if((d.type==='firebaseAuth'||d.type==='firebaseDb')&&!cfg.apiKey)note+=' Configure a Web API Key antes de usar.';if(d.type==='firebaseDb'&&!cfg.databaseURL)note+=' Configure também a Database URL.';
  document.getElementById('bwCv4Body').innerHTML='<div class="bw-cv3-component-info"><span class="icon">'+icon(d.icon)+'</span><span><b>'+esc(d.name)+'</b><small>'+esc(d.desc||'Functional component')+'</small></span></div><label class="bw-cv3-field"><span>Component name</span><input id="bwCv4Name" value="'+esc(item?item.name:defaultName(d.type))+'" spellcheck="false"></label><div class="bw-cv3-error" id="bwCv4Error"></div><div class="bw-cv3-hint">'+esc(note)+'</div><div class="bw-cv3-actions"><button type="button" data-cv4-close="editor">Cancel</button><button type="button" class="primary" id="bwCv4Save">'+(item?'Save':'Add')+'</button></div>';editor.classList.add('show');setTimeout(function(){var n=document.getElementById('bwCv4Name');if(n){n.focus();n.select();}},60);
}
function saveEditor(){
  var n=document.getElementById('bwCv4Name'),name=n?n.value.trim():'',err=nameError(name,editingId),box=document.getElementById('bwCv4Error');if(err){box.textContent=err;box.classList.add('show');return;}
  if(editingId){var item=component(editingId);if(item)item.name=name;}else{var a=api(),before={};components().forEach(function(x){before[x.id]=1;});if(!a||!a.add)return;a.add(editingType);var made=components().find(function(x){return x.type===editingType&&!before[x.id];});if(made)made.name=name;}
  if(typeof autoSave==='function')autoSave();var a2=api();if(a2&&a2.refresh)a2.refresh();try{if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();}catch(_){}try{window.dispatchEvent(new CustomEvent('brotware:logic-refresh'));}catch(_){}closeEditor();cleanComponentScreen();
}

function cleanComponentScreen(){var screen=document.getElementById('screen-component'),panel=document.getElementById('bwFunctionalComponentsPanel');if(!screen||!panel)return false;screen.classList.add('bw-component-v3');var h=panel.querySelector('.bw-fc-head strong'),s=panel.querySelector('.bw-fc-head small'),b=document.getElementById('bwAddFunctionalBtn');if(h&&h.textContent!=='Components')h.textContent='Components';if(s&&s.textContent.indexOf('Componentes funcionais')!==0)s.textContent='Componentes funcionais, APIs e serviços usados pelos blocos e eventos';if(b)b.innerHTML='＋ Add component';return true;}

function configList(){return document.getElementById('bwConfigList');}
function configCard(kind,ico,title,sub){var b=document.createElement('button');b.className='bw-config-card';b.type='button';b.dataset.bwCv4Manager=kind;b.innerHTML='<span class="bw-config-icon">'+icon(ico)+'</span><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span><span class="chev">›</span>';return b;}
function injectSettings(){var list=configList();if(!list)return false;var comp=list.querySelector('[data-manager="components"]');if(comp){var bt=comp.querySelector('b'),sm=comp.querySelector('small');if(bt&&bt.textContent!=='Component Manager')bt.textContent='Component Manager';if(sm&&sm.textContent!=='Functional components, APIs and events')sm.textContent='Functional components, APIs and events';}var collections=list.querySelector('[data-manager="collections"]');if(collections)collections.style.display='none';if(!list.querySelector('[data-bw-cv4-manager="designs"]')){var d=configCard('designs','dashboard_customize','Designs','Ready-made UI layouts and saved designs');if(comp&&comp.nextSibling)list.insertBefore(d,comp.nextSibling);else list.appendChild(d);}if(!list.querySelector('[data-bw-cv4-manager="libraries"]')){var l=configCard('libraries','library_books','Library Manager','Firebase, browser APIs, speech and external services'),d2=list.querySelector('[data-bw-cv4-manager="designs"]');if(d2&&d2.nextSibling)list.insertBefore(l,d2.nextSibling);else list.appendChild(l);}return true;}
function detail(title,sub,html){var d=document.getElementById('bwConfigDetail'),t=document.getElementById('bwConfigDetailTitle'),s=document.getElementById('bwConfigDetailSub'),body=document.getElementById('bwConfigDetailBody');if(!d||!body)return null;if(t)t.textContent=title;if(s)s.textContent=sub;body.innerHTML=html;d.classList.add('show');return body;}
function designs(){var x=window.BrotwareComponentLibrary;return x&&Array.isArray(x.cards)?x.cards:[];}
function openDesigns(){
  var built=designs(),saved=Array.isArray(state.components)?state.components:[],html='<div class="bw-design-section-title">Built-in designs</div><div class="bw-design-grid">'+built.map(function(c){return'<button class="bw-design-card" type="button" data-cv4-design="'+esc(c[0])+'"><span class="bw-google-icon">'+(DESIGN_ICONS[c[0]]||'dashboard_customize')+'</span><b>'+esc(c[2])+'</b><small>'+esc(c[3])+'</small></button>';}).join('')+'</div><div class="bw-design-section-title">Saved designs</div>';
  if(!saved.length)html+='<div class="bw-design-empty">Nenhum design salvo. No editor View, selecione um layout e use “Salvar como componente”.</div>';else html+='<div class="bw-design-grid">'+saved.map(function(c){return'<div class="bw-design-saved-row"><button class="bw-design-card saved" type="button" data-cv4-saved="'+esc(c.id)+'"><span class="bw-google-icon">widgets</span><b>'+esc(c.name)+'</b><small>Design salvo no projeto</small></button><button class="bw-design-delete" type="button" data-cv4-design-delete="'+esc(c.id)+'">×</button></div>';}).join('')+'</div>';
  var body=detail('Designs','Ready-made layouts and reusable visual designs',html);if(!body)return;body.querySelectorAll('[data-cv4-design]').forEach(function(b){b.onclick=function(){insertBuiltIn(this.dataset.cv4Design);};});body.querySelectorAll('[data-cv4-saved]').forEach(function(b){b.onclick=function(){insertSaved(this.dataset.cv4Saved);};});body.querySelectorAll('[data-cv4-design-delete]').forEach(function(b){b.onclick=function(){var id=this.dataset.cv4DesignDelete;if(!confirm('Excluir este design salvo?'))return;state.components=state.components.filter(function(x){return x.id!==id;});if(typeof renderComponents==='function')renderComponents();if(typeof autoSave==='function')autoSave();openDesigns();};});
}
function closeSettings(){var b=document.getElementById('bwConfigClose');if(b)b.click();}
function insertBuiltIn(id){var fn=(window.builtinComponents&&window.builtinComponents[id])||(typeof builtinComponents!=='undefined'&&builtinComponents[id]);if(!fn)return;closeSettings();setTimeout(function(){fn();if(typeof switchTab==='function')switchTab('view');},70);}
function insertSaved(id){if(typeof insertCustomComponent!=='function')return;closeSettings();setTimeout(function(){insertCustomComponent(id);if(typeof switchTab==='function')switchTab('view');},70);}
function openLibraries(){var a=api();closeSettings();setTimeout(function(){if(a&&a.openLibrary)a.openLibrary();},70);}

function capture(e){
  var t=e.target,close=t.closest&&t.closest('[data-cv4-close]');if(close){e.preventDefault();e.stopImmediatePropagation();close.dataset.cv4Close==='picker'?closePicker():closeEditor();return;}
  var type=t.closest&&t.closest('[data-cv4-type]');if(type){e.preventDefault();e.stopImmediatePropagation();var d=meta(type.dataset.cv4Type);if(!libraryOn(d)){closePicker();openLibraries();}else openEditor(d.type,'');return;}
  var save=t.closest&&t.closest('#bwCv4Save');if(save){e.preventDefault();e.stopImmediatePropagation();saveEditor();return;}
  var add=t.closest&&t.closest('#bwAddFunctionalBtn');if(add){e.preventDefault();e.stopImmediatePropagation();openPicker();return;}
  if(t.closest&&t.closest('[data-fc-del]'))return;
  var row=t.closest&&t.closest('#screen-component.bw-component-v3 .bw-fc-instance');if(row){var del=row.querySelector('[data-fc-del]'),item=del&&component(del.dataset.fcDel);if(item){e.preventDefault();e.stopImmediatePropagation();openEditor(item.type,item.id);}return;}
  var mgr=t.closest&&t.closest('[data-bw-cv4-manager]');if(mgr){e.preventDefault();e.stopImmediatePropagation();mgr.dataset.bwCv4Manager==='designs'?openDesigns():openLibraries();}
}

function install(){buildSheets();if(!cleanComponentScreen())setTimeout(cleanComponentScreen,220);if(!injectSettings())setTimeout(injectSettings,260);var a=api();if(a)a.openAdd=openPicker;}
document.addEventListener('click',capture,true);setTimeout(install,0);setTimeout(install,650);setTimeout(install,1600);
window.addEventListener('brotware:logic-refresh',function(){setTimeout(cleanComponentScreen,0);});
window.BrotwareComponentWorkspaceV4={openAdd:openPicker,openDesigns:openDesigns,refresh:function(){cleanComponentScreen();injectSettings();}};
})();
