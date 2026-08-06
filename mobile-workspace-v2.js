(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
var topbar=null,bottom=null,selectionBar=null,sheetBackdrop=null,sheetBody=null,sheetTitle=null,sheetSub=null;
var baseSelectNode=window.selectNode,baseLoadPage=window.loadPage,baseSwitchTab=window.switchTab;
var installed=false;

var ADD_GROUPS=[
  {title:'Layouts',items:[
    ['linear-h','▤','Linear H'],['linear-v','▥','Linear V'],['relative','◫','Relative'],['card','▱','Card'],['scroll','↕','Scroll']
  ]},
  {title:'Widgets',items:[
    ['text','T','TextView'],['button','▣','Button'],['image','▧','Image'],['input','⌨','Input'],['textarea','¶','TextArea'],['select','▾','Select'],['checkbox','☑','Checkbox'],['link','↗','Link'],['progress','▬','Progress'],['divider','—','Divider']
  ]}
];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function activeTab(){var t=document.querySelector('.tab.active[data-tab]');return t?t.dataset.tab:'view';}
function currentPageSafe(){return typeof currentPage==='function'?currentPage():null;}
function contextTitle(){
  if(typeof state!=='undefined'&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.get){var d=BrotwareDialogs.get(state.activeDialogId);if(d)return d.name||d.id;}
  var p=currentPageSafe();return p?p.name:'Brotware';
}
function contextSubtitle(){
  if(typeof state!=='undefined'&&state.dialogEditorActive)return'Dialog Design';
  var tab=activeTab();if(tab==='event')return'Logic';if(tab==='component')return'Components';if(tab==='strings')return'Strings';return'Design';
}

function build(){
  if(topbar)return;
  topbar=document.createElement('div');topbar.id='bwMobileTopbar';topbar.className='bw-mobile-topbar';
  topbar.innerHTML='<button class="bw-mobile-back" id="bwMobileBack" type="button" aria-label="Voltar">←</button><button class="bw-mobile-title" id="bwMobileTitleBtn" type="button"><span><b id="bwMobileTitle">Brotware</b><small id="bwMobileSubtitle">Design</small></span></button><button class="bw-mobile-run" id="bwMobileRun" type="button" aria-label="Run">▶</button><button class="bw-mobile-more" id="bwMobileMore" type="button" aria-label="Mais">⋮</button>';
  document.body.appendChild(topbar);

  bottom=document.createElement('nav');bottom.id='bwMobileBottomNav';bottom.className='bw-mobile-bottomnav';
  bottom.innerHTML='<button class="bw-mobile-nav primary" data-bw-mobile-nav="add" type="button"><span class="ico">＋</span><span class="label">Add</span></button><button class="bw-mobile-nav" data-bw-mobile-nav="layers" type="button"><span class="ico">☷</span><span class="label">Layers</span></button><button class="bw-mobile-nav" data-bw-mobile-nav="logic" type="button"><span class="ico">⚡</span><span class="label">Logic</span></button><button class="bw-mobile-nav" data-bw-mobile-nav="settings" type="button"><span class="ico">⚙</span><span class="label">Settings</span></button>';
  document.body.appendChild(bottom);

  selectionBar=document.createElement('div');selectionBar.id='bwMobileSelection';selectionBar.className='bw-mobile-selection';
  selectionBar.innerHTML='<button class="bw-mobile-selection-target" id="bwMobileSelectionTarget" type="button"><span>▣</span><b id="bwMobileSelectionName">View</b><span>▾</span></button><button class="bw-mobile-selection-props" id="bwMobileSelectionProps" type="button">Properties</button><button class="bw-mobile-selection-close" id="bwMobileSelectionClose" type="button">×</button>';
  document.body.appendChild(selectionBar);

  sheetBackdrop=document.createElement('div');sheetBackdrop.id='bwMobileSheetBackdrop';sheetBackdrop.className='bw-mobile-sheet-backdrop';
  sheetBackdrop.innerHTML='<section class="bw-mobile-sheet"><header class="bw-mobile-sheet-head"><div><strong id="bwMobileSheetTitle">Adicionar</strong><small id="bwMobileSheetSub"></small></div><span class="spacer"></span><button id="bwMobileSheetClose" type="button">×</button></header><main class="bw-mobile-sheet-body" id="bwMobileSheetBody"></main></section>';
  document.body.appendChild(sheetBackdrop);sheetBody=document.getElementById('bwMobileSheetBody');sheetTitle=document.getElementById('bwMobileSheetTitle');sheetSub=document.getElementById('bwMobileSheetSub');

  document.getElementById('bwMobileBack').onclick=goBack;
  document.getElementById('bwMobileTitleBtn').onclick=openPages;
  document.getElementById('bwMobileRun').onclick=function(){closeSheet();if(typeof preview==='function')preview();else{var r=document.getElementById('runBtn');if(r)r.click();}};
  document.getElementById('bwMobileMore').onclick=openMore;
  document.getElementById('bwMobileSheetClose').onclick=closeSheet;
  sheetBackdrop.addEventListener('click',function(e){if(e.target===sheetBackdrop)closeSheet();});
  sheetBody.addEventListener('click',sheetClick);
  bottom.addEventListener('click',navClick);
  document.getElementById('bwMobileSelectionTarget').onclick=function(){if(window.BrotwareViewSelector&&BrotwareViewSelector.open)BrotwareViewSelector.open();};
  document.getElementById('bwMobileSelectionProps').onclick=function(){if(typeof openProperties==='function')openProperties();};
  document.getElementById('bwMobileSelectionClose').onclick=function(){if(typeof selectNode==='function')selectNode(null);};
}

function setSheet(title,sub,html){build();sheetTitle.textContent=title||'';sheetSub.textContent=sub||'';sheetBody.innerHTML=html||'';sheetBackdrop.classList.add('show');document.body.classList.add('bw-mobile-sheet-open');}
function closeSheet(){if(sheetBackdrop)sheetBackdrop.classList.remove('show');document.body.classList.remove('bw-mobile-sheet-open');}
function openAdd(){
  if(typeof switchTab==='function')switchTab('view');
  var html='';ADD_GROUPS.forEach(function(g){html+='<div class="bw-mobile-section-title">'+esc(g.title)+'</div><div class="bw-mobile-add-grid">';g.items.forEach(function(x){html+='<button class="bw-mobile-add-item" type="button" data-bw-mobile-add="'+esc(x[0])+'"><span class="ico">'+esc(x[1])+'</span><b>'+esc(x[2])+'</b></button>';});html+='</div>';});
  setSheet('Adicionar','Toque em um elemento para inserir no Design',html);
}
function openMore(){
  var html='<div class="bw-mobile-menu-list">'+
    menuItem('design','▣','Design','Voltar para o Canvas')+
    menuItem('dialogs','▦','Dialogs','Dialogs da página atual')+
    menuItem('pages','▤','Pages','Gerenciar páginas HTML')+
    menuItem('components','◇','Components','Componentes reutilizáveis')+
    menuItem('strings','T','Strings','Recursos de texto')+
    menuItem('undo','↶','Undo','Desfazer última alteração')+
    menuItem('redo','↷','Redo','Refazer alteração')+
    menuItem('code','</>','Generated Code','Ver HTML/CSS/JS gerado')+
    menuItem('save','▣','Save','Salvar projeto agora')+
  '</div>';
  setSheet('Mais','Ferramentas do projeto',html);
}
function menuItem(action,icon,name,sub){return '<button class="bw-mobile-menu-item" type="button" data-bw-mobile-action="'+action+'"><span class="ico">'+icon+'</span><span><b>'+esc(name)+'</b><small>'+esc(sub)+'</small></span><span class="chev">›</span></button>';}

function insertionParent(){
  var n=typeof selectedNode==='function'?selectedNode():null;
  if(n&&typeof isLayout==='function'&&isLayout(n.dataset.type))return n;
  return root;
}
function addNode(type){
  closeSheet();if(typeof switchTab==='function')switchTab('view');
  if(typeof createNode!=='function')return;
  var parent=insertionParent(),count=Array.prototype.filter.call(parent.children||[],function(n){return n.classList&&n.classList.contains('vf-node');}).length;
  var x=parent===root?20:12,y=parent===root?Math.min(180,20+(count%8)*12):Math.min(140,34+(count%6)*10);
  var el=createNode(type,x,y,parent);
  if(el)setTimeout(function(){try{el.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});}catch(_){}},50);
}
function sheetClick(e){
  var add=e.target.closest('[data-bw-mobile-add]');if(add){addNode(add.dataset.bwMobileAdd);return;}
  var a=e.target.closest('[data-bw-mobile-action]');if(a){runMoreAction(a.dataset.bwMobileAction);}
}
function runMoreAction(action){
  closeSheet();
  if(action==='design'){if(typeof switchTab==='function')switchTab('view');return;}
  if(action==='dialogs'){if(typeof switchTab==='function')switchTab('view');setTimeout(function(){if(window.BrotwareDialogs&&BrotwareDialogs.openManager)BrotwareDialogs.openManager();},30);return;}
  if(action==='pages'){openPages();return;}
  if(action==='components'){if(typeof switchTab==='function')switchTab('component');return;}
  if(action==='strings'){if(typeof switchTab==='function')switchTab('strings');return;}
  if(action==='undo'){if(typeof restoreHistory==='function')restoreHistory(-1);return;}
  if(action==='redo'){if(typeof restoreHistory==='function')restoreHistory(1);return;}
  if(action==='code'){if(typeof showCode==='function')showCode();else{var c=document.getElementById('codeBtn');if(c)c.click();}return;}
  if(action==='save'){if(typeof autoSave==='function')autoSave();if(typeof toast==='function')toast('Projeto salvo');return;}
}

function openPages(){closeSheet();if(typeof renderPages==='function')renderPages();if(typeof openModal==='function')openModal('pagesModal');}
function openLogic(){
  closeSheet();
  if(typeof state!=='undefined'&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.logic){BrotwareDialogs.logic(state.activeDialogId);return;}
  if(typeof switchTab==='function')switchTab('event');
  if(typeof state!=='undefined'&&state.selectedId){var s=document.getElementById('eventNodeSelect');if(s){s.value=state.selectedId;if(typeof refreshEventTypes==='function')refreshEventTypes();}}
  if(typeof showEventHome==='function')setTimeout(showEventHome,20);
}
function openLayers(){closeSheet();if(typeof switchTab==='function')switchTab('view');setTimeout(function(){if(window.BrotwareLayers&&BrotwareLayers.open)BrotwareLayers.open();},20);}
function openSettings(){closeSheet();if(window.BrotwareConfiguration&&BrotwareConfiguration.open)BrotwareConfiguration.open();else{var b=document.getElementById('bwConfigTopBtn');if(b)b.click();}}
function navClick(e){var b=e.target.closest('[data-bw-mobile-nav]');if(!b)return;var a=b.dataset.bwMobileNav;if(a==='add')openAdd();else if(a==='layers')openLayers();else if(a==='logic')openLogic();else if(a==='settings')openSettings();}

function goBack(){
  closeSheet();
  if(typeof state!=='undefined'&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.exit){BrotwareDialogs.exit(true);return;}
  if(activeTab()!=='view'){if(typeof switchTab==='function')switchTab('view');return;}
  var old=document.getElementById('backBtn');if(old&&old.onclick){old.click();return;}
  if(window.BrotwareProjects&&BrotwareProjects.home){BrotwareProjects.home();}
}

function syncSelection(){
  if(!mq.matches)return;var has=!!(typeof state!=='undefined'&&state.selectedId);document.body.classList.toggle('bw-mobile-has-selection',has);
  var n=document.getElementById('bwMobileSelectionName');if(n)n.textContent=has?state.selectedId:'View';
}
function syncContext(){
  if(!topbar)return;document.getElementById('bwMobileTitle').textContent=contextTitle();document.getElementById('bwMobileSubtitle').textContent=contextSubtitle();
  var tab=activeTab();document.body.classList.toggle('bw-mobile-view-active',tab==='view');
  if(bottom)bottom.querySelectorAll('[data-bw-mobile-nav]').forEach(function(b){b.classList.toggle('active',b.dataset.bwMobileNav==='logic'&&tab==='event');});
  syncSelection();
}
function syncMode(){
  build();document.body.classList.toggle('bw-mobile-v2',mq.matches);if(!mq.matches){closeSheet();document.body.classList.remove('bw-mobile-has-selection','bw-mobile-view-active');return;}syncContext();
}

function installWrappers(){
  if(window.selectNode&&!window.selectNode.__bwMobileV2){var prev=window.selectNode;var s=function(){var r=prev.apply(this,arguments);syncSelection();return r;};s.__bwMobileV2=true;window.selectNode=s;}
  if(window.loadPage&&!window.loadPage.__bwMobileV2){var lp=window.loadPage;var l=function(){var r=lp.apply(this,arguments);setTimeout(syncContext,0);return r;};l.__bwMobileV2=true;window.loadPage=l;}
  if(window.switchTab&&!window.switchTab.__bwMobileV2){var st=window.switchTab;var w=function(){var r=st.apply(this,arguments);setTimeout(syncContext,0);return r;};w.__bwMobileV2=true;window.switchTab=w;}
}
function observeContext(){
  var title=document.getElementById('currentPageName');if(title&&title.dataset.bwMobileObserved!=='1'){title.dataset.bwMobileObserved='1';new MutationObserver(syncContext).observe(title,{childList:true,characterData:true,subtree:true});}
  var tabs=document.querySelector('.tabs');if(tabs&&tabs.dataset.bwMobileObserved!=='1'){tabs.dataset.bwMobileObserved='1';new MutationObserver(syncContext).observe(tabs,{attributes:true,subtree:true,attributeFilter:['class']});}
}
function install(){
  if(installed){installWrappers();observeContext();syncMode();return;}
  installed=true;build();installWrappers();observeContext();syncMode();
  if(mq.addEventListener)mq.addEventListener('change',syncMode);else mq.addListener(syncMode);
  window.addEventListener('resize',function(){clearTimeout(window.__bwMobileWorkspaceTimer);window.__bwMobileWorkspaceTimer=setTimeout(syncMode,80);});
}

window.BrotwareMobileWorkspace={add:openAdd,more:openMore,layers:openLayers,logic:openLogic,settings:openSettings,refresh:syncContext};
setTimeout(install,0);setTimeout(install,300);setTimeout(install,1100);
})();
