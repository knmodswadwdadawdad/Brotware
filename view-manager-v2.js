(function(){
'use strict';

var back=null,body=null,createSheet=null;
var activeTab='view';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function page(){return typeof currentPage==='function'?currentPage():((state.pages||[]).find(function(p){return p.id===state.currentPageId;})||null);}
function pages(){return Array.isArray(state.pages)?state.pages:[];}
function dialogs(){var p=page();return p&&Array.isArray(p.dialogs)?p.dialogs:[];}
function nodeCount(content){try{var h=document.createElement('div');h.innerHTML=content||'';return h.querySelectorAll('.vf-node').length;}catch(e){return 0;}}
function thumbPage(p){var n=nodeCount(p.content),bars='';for(var i=1;i<=Math.max(2,Math.min(4,n));i++)bars+='<i class="mini m'+i+'"></i>';return '<span class="bw-viewmgr-thumb page" style="background:'+esc(p.background||'#eef2f5')+'">'+bars+'</span>';}
function thumbDialog(){return '<span class="bw-viewmgr-thumb dialog"></span>';}
function activityLabel(p){return (p&&p.title?p.title:'Web Activity')+' · '+nodeCount(p&&p.content)+' view(s)';}
function dialogLabel(d){var b=0;if(d&&d.events)Object.keys(d.events).forEach(function(k){b+=(d.events[k]||[]).length;});return 'Dialog · '+b+' bloco(s)';}

function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwViewManagerV2';back.className='bw-viewmgr-backdrop';
  back.innerHTML='<section class="bw-viewmgr"><header class="bw-viewmgr-head"><button id="bwViewMgrClose" type="button">←</button><div class="bw-viewmgr-title"><strong id="bwViewMgrProject">Views</strong><small id="bwViewMgrContext"></small></div><button id="bwViewMgrRefresh" type="button" title="Atualizar">↻</button></header><nav class="bw-viewmgr-tabs"><button class="bw-viewmgr-tab active" data-viewmgr-tab="view" type="button">View</button><button class="bw-viewmgr-tab" data-viewmgr-tab="custom" type="button">Custom View</button></nav><main class="bw-viewmgr-body" id="bwViewMgrBody"></main><footer class="bw-viewmgr-footer"><button class="bw-viewmgr-create" id="bwViewMgrCreate" type="button">＋ Create new view</button></footer></section>';
  document.body.appendChild(back);body=document.getElementById('bwViewMgrBody');
  document.getElementById('bwViewMgrClose').onclick=close;
  document.getElementById('bwViewMgrRefresh').onclick=render;
  document.getElementById('bwViewMgrCreate').onclick=createCurrent;
  back.querySelector('.bw-viewmgr-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-viewmgr-tab]');if(!b)return;activeTab=b.dataset.viewmgrTab;render();});
  body.addEventListener('click',onListClick);
  back.addEventListener('pointerdown',function(e){if(e.target===back)close();});

  createSheet=document.createElement('div');createSheet.id='bwViewMgrCreateSheet';createSheet.className='bw-viewmgr-create-sheet';
  createSheet.innerHTML='<section class="bw-viewmgr-create-box"><div class="bw-viewmgr-create-handle"></div><strong>Create Custom View</strong><button class="bw-viewmgr-create-choice" data-vm-create-kind="dialog" type="button"><span class="ico">▣</span><span><b>Dialog</b><small>Visual dialog linked to the current Activity</small></span></button><button class="bw-viewmgr-create-choice" data-vm-create-kind="activity" type="button"><span class="ico">▤</span><span><b>Activity / Page</b><small>Create another HTML screen</small></span></button><button class="bw-viewmgr-create-cancel" id="bwViewMgrCreateCancel" type="button">Cancel</button></section>';
  document.body.appendChild(createSheet);document.getElementById('bwViewMgrCreateCancel').onclick=closeCreateSheet;
  createSheet.addEventListener('click',function(e){if(e.target===createSheet){closeCreateSheet();return;}var b=e.target.closest('[data-vm-create-kind]');if(!b)return;closeCreateSheet();if(b.dataset.vmCreateKind==='dialog')createDialog();else createActivity();});
}

function open(tab){build();if(tab==='custom'||tab==='view')activeTab=tab;render();back.classList.add('show');document.body.classList.add('bw-view-manager-open');}
function close(){closeCreateSheet();if(back)back.classList.remove('show');document.body.classList.remove('bw-view-manager-open');}
function closeCreateSheet(){if(createSheet)createSheet.classList.remove('show');}
function openCreateSheet(){build();createSheet.classList.add('show');}

function render(){
  build();var p=page();
  document.getElementById('bwViewMgrProject').textContent=state.projectName||'Brotware';
  document.getElementById('bwViewMgrContext').textContent=p?p.name:'No Activity';
  back.querySelectorAll('[data-viewmgr-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.viewmgrTab===activeTab);});
  var create=document.getElementById('bwViewMgrCreate');create.textContent=activeTab==='view'?'＋ Create new view':'＋ Create custom view';
  if(activeTab==='view')renderViews();else renderCustom();
}
function pageCard(p,other){var active=p.id===state.currentPageId&&!state.dialogEditorActive;return '<article class="bw-viewmgr-card'+(active?' active':'')+'" data-vm-page="'+esc(p.id)+'">'+thumbPage(p)+'<span class="bw-viewmgr-card-main"><strong>'+esc(p.name)+'</strong><small>'+esc(activityLabel(p))+'</small><em>'+(other?'Other Activity':'HTML Activity')+'</em></span><button class="bw-viewmgr-card-edit" data-vm-edit-page="'+esc(p.id)+'" type="button" title="Editar">✎</button></article>';}
function dialogCard(d){var active=!!(state.dialogEditorActive&&state.activeDialogId===d.id);return '<article class="bw-viewmgr-card'+(active?' active':'')+'" data-vm-dialog="'+esc(d.id)+'">'+thumbDialog()+'<span class="bw-viewmgr-card-main"><strong>'+esc(d.name||d.id)+'</strong><small>'+esc(dialogLabel(d))+'</small><em>#'+esc(d.id)+'</em></span><button class="bw-viewmgr-card-edit" data-vm-edit-dialog="'+esc(d.id)+'" type="button" title="Properties">✎</button></article>';}
function renderViews(){var arr=pages(),html='<div class="bw-viewmgr-section">Activities / Pages</div><div class="bw-viewmgr-list">';if(!arr.length)html+='<div class="bw-viewmgr-empty"><b>No views yet</b><span>Create your first Activity.</span></div>';else arr.forEach(function(p){html+=pageCard(p,false);});html+='</div>';body.innerHTML=html;}
function renderCustom(){
  var ds=dialogs(),cur=page(),others=pages().filter(function(p){return !cur||p.id!==cur.id;}),html='<div class="bw-viewmgr-section">Dialogs · '+esc(cur?cur.name:'Activity')+'</div><div class="bw-viewmgr-list">';
  if(!ds.length)html+='<div class="bw-viewmgr-empty"><b>No Dialogs in this Activity</b><span>Create one and edit it on its own Canvas.</span></div>';else ds.forEach(function(d){html+=dialogCard(d);});
  html+='</div><div class="bw-viewmgr-section" style="margin-top:12px">Other Activities</div><div class="bw-viewmgr-list">';
  if(!others.length)html+='<div class="bw-viewmgr-empty"><span>No other Activities yet.</span></div>';else others.forEach(function(p){html+=pageCard(p,true);});html+='</div>';body.innerHTML=html;
}

function leaveDialogIfNeeded(cb){if(state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.exit){BrotwareDialogs.exit(false);setTimeout(cb,30);}else cb();}
function openPage(id){var p=pages().find(function(x){return x.id===id;});if(!p)return;leaveDialogIfNeeded(function(){if(typeof loadPage==='function')loadPage(id);if(typeof switchTab==='function')switchTab('view');close();});}
function openDialog(id){if(!window.BrotwareDialogs||!BrotwareDialogs.edit)return;if(state.dialogEditorActive&&state.activeDialogId===id){close();return;}BrotwareDialogs.edit(id);close();}
function editPage(id){if(typeof pageAction==='function'){pageAction('rename',id);setTimeout(render,30);return;}var p=pages().find(function(x){return x.id===id;});if(!p)return;var n=prompt('Nome da página:',p.name);if(n===null)return;if(typeof uniquePageName==='function')n=uniquePageName(n,p.id);p.name=n||p.name;var t=prompt('Título:',p.title||'');if(t!==null)p.title=t;if(typeof autoSave==='function')autoSave();if(typeof updatePageUI==='function')updatePageUI();render();}
function editDialog(id){if(window.BrotwareDialogs&&BrotwareDialogs.properties){BrotwareDialogs.properties(id);close();}}
function onListClick(e){var editP=e.target.closest('[data-vm-edit-page]');if(editP){e.preventDefault();e.stopPropagation();editPage(editP.dataset.vmEditPage);return;}var editD=e.target.closest('[data-vm-edit-dialog]');if(editD){e.preventDefault();e.stopPropagation();editDialog(editD.dataset.vmEditDialog);return;}var p=e.target.closest('[data-vm-page]');if(p){openPage(p.dataset.vmPage);return;}var d=e.target.closest('[data-vm-dialog]');if(d){openDialog(d.dataset.vmDialog);}}

function createCurrent(){if(activeTab==='view')createActivity();else openCreateSheet();}
function createActivity(){
  var name=prompt('Nome da nova Activity/página:','nova-pagina.html');if(name===null)return;name=String(name||'').trim();if(!name)return;if(typeof normalizeName==='function')name=normalizeName(name);var title=prompt('Título da Activity:','Nova página');if(title===null)title='Nova página';
  leaveDialogIfNeeded(function(){if(typeof saveCurrentPage==='function')saveCurrentPage();var p=typeof newPage==='function'?newPage(name,title):null;if(!p)return;state.pages.push(p);if(typeof loadPage==='function')loadPage(p.id,true);if(typeof autoSave==='function')autoSave();if(typeof switchTab==='function')switchTab('view');close();if(typeof toast==='function')toast(p.name+' criada');});
}
function createDialog(){
  if(!window.BrotwareDialogs||!BrotwareDialogs.create)return;var name=prompt('Nome do Dialog:','dialog_confirm');if(name===null||!String(name).trim())return;var d=BrotwareDialogs.create(name);if(d&&BrotwareDialogs.edit){BrotwareDialogs.edit(d.id);close();}
}

function installEntryPoints(){
  var mobileTitle=document.getElementById('bwMobileTitleBtn');if(mobileTitle){mobileTitle.onclick=function(e){e.preventDefault();e.stopPropagation();open('view');};}
  var pageBtn=document.getElementById('pageSelectorBtn');if(pageBtn){pageBtn.onclick=function(e){e.preventDefault();e.stopPropagation();open('view');};}
  document.addEventListener('click',function(e){
    var pagesAction=e.target.closest&&e.target.closest('[data-bw-mobile-action="pages"]');if(pagesAction){e.preventDefault();e.stopImmediatePropagation();open('view');return;}
    var dialogsAction=e.target.closest&&e.target.closest('[data-bw-mobile-action="dialogs"]');if(dialogsAction){e.preventDefault();e.stopImmediatePropagation();open('custom');}
  },true);
}
function install(){build();installEntryPoints();}

window.BrotwareViewManager={open:open,close:close,render:render,view:function(){open('view');},custom:function(){open('custom');}};
setTimeout(install,0);setTimeout(install,350);setTimeout(install,1100);
})();
