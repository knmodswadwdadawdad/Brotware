(function(){
'use strict';

var ACTIVE_KEY='brotware_active_project_v1';
var STORE_KEY='brotware_projects_v1';
var opening=false,lastOpenAt=0;

function home(){return document.getElementById('bwProjectHome');}
function isHomeVisible(){var h=home();return !!(h&&h.classList.contains('show'));}
function isActionTarget(t){return !!(t&&t.closest&&(
  t.closest('.bw-project-more')||
  t.closest('.bw-project-menu')||
  t.closest('[data-project-action]')||
  t.closest('#bwProjectActionBackdrop')||
  t.closest('#bwProjectDeleteBackdrop')||
  t.closest('#bwProjectSettingsBackdrop')||
  t.closest('.bw-template-card')
));}
function cardFromTarget(t){return t&&t.closest?t.closest('#bwProjectList .bw-project-card[data-project-id]'):null;}
function readRecord(id){
  try{var s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(!s||!Array.isArray(s.projects))return null;for(var i=0;i<s.projects.length;i++)if(s.projects[i].id===id)return s.projects[i];}catch(_){}
  return null;
}
function hideHomeNow(){var h=home();if(h)h.classList.remove('show');document.body.classList.remove('bw-project-home-open');document.body.style.overflow='';}
function callSafe(fn){try{if(typeof fn==='function')fn();}catch(e){console.error(e);}}

/* Emergency path used only if the normal project loader throws before closing Home. */
function directOpen(id){
  var rec=readRecord(id);if(!rec||!rec.data)return false;
  var d=JSON.parse(JSON.stringify(rec.data||{}));
  if(!Array.isArray(d.pages)||!d.pages.length)return false;
  d.currentPageId=d.currentPageId||d.pages[0].id;
  d.strings=d.strings||{app_name:rec.name||'Brotware'};
  d.variables=d.variables||{counter:0};d.functions=d.functions||[];d.components=d.components||[];
  localStorage.setItem(ACTIVE_KEY,id);
  hideHomeNow();
  try{
    state.projectName=d.projectName||rec.name||'Brotware Project';
    state.pages=d.pages;state.currentPageId=d.currentPageId;
    state.strings=d.strings;state.variables=d.variables;state.functions=d.functions;state.components=d.components;state.counter=d.counter||1;
    if(d.functionalComponents)state.functionalComponents=d.functionalComponents;
    if(d.libraryManager)state.libraryManager=d.libraryManager;
    if(d.firebaseConfig)state.firebaseConfig=d.firebaseConfig;
    if(d.projectSettings)state.projectSettings=d.projectSettings;
    state.histories={};state.historyIndex={};state.selectedId=null;
    var p=state.pages.find(function(x){return x.id===state.currentPageId;})||state.pages[0];state.currentPageId=p.id;
    if(typeof ensurePageSchema==='function')state.pages.forEach(ensurePageSchema);
    if(typeof root!=='undefined'&&root){root.innerHTML='<div class="grid-layer" id="gridLayer"></div>'+(p.content||'');root.style.background=p.background||'#fff';}
    callSafe(function(){if(typeof bindAllNodes==='function')bindAllNodes();});
    callSafe(function(){if(typeof refreshStringsOnDom==='function')refreshStringsOnDom();});
    callSafe(function(){if(typeof renderVariables==='function')renderVariables();});
    callSafe(function(){if(typeof renderFunctions==='function')renderFunctions();});
    callSafe(function(){if(typeof renderStrings==='function')renderStrings();});
    callSafe(function(){if(typeof renderComponents==='function')renderComponents();});
    callSafe(function(){if(typeof refreshStringOptions==='function')refreshStringOptions();});
    callSafe(function(){if(typeof updatePageUI==='function')updatePageUI();});
    callSafe(function(){if(typeof renderPages==='function')renderPages();});
    callSafe(function(){if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();});
    callSafe(function(){if(typeof renderLogic==='function')renderLogic();});
    callSafe(function(){if(typeof switchTab==='function')switchTab('view');});
    callSafe(function(){if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.apply==='function')BrotwareProjectSettings.apply(id);});
    return true;
  }catch(e){console.error('Brotware direct project open failed',e);return false;}
}

function openCard(card){
  if(!card||opening)return;var id=card.dataset.projectId;if(!id)return;
  var now=Date.now();if(now-lastOpenAt<350)return;lastOpenAt=now;opening=true;
  document.querySelectorAll('.bw-project-card.menu-open').forEach(function(c){c.classList.remove('menu-open');});
  var normalError=null;
  try{
    if(window.BrotwareProjects&&typeof BrotwareProjects.open==='function')BrotwareProjects.open(id);
    else normalError=new Error('BrotwareProjects.open unavailable');
  }catch(e){normalError=e;console.error('Normal project open failed',e);}
  /* If normal loading threw before hideHome(), recover immediately. */
  if(normalError||isHomeVisible())directOpen(id);
  setTimeout(function(){
    if(isHomeVisible())directOpen(id);
    opening=false;
  },80);
}

function handle(e){
  if(!isHomeVisible()||isActionTarget(e.target))return;
  var card=cardFromTarget(e.target);if(!card)return;
  if(e.type==='pointerup'&&e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();openCard(card);
}

/* pointerup is primary on touch devices; click remains a keyboard/browser fallback. */
document.addEventListener('pointerup',handle,true);
document.addEventListener('click',handle,true);

/* Keyboard accessibility for focused cards. */
document.addEventListener('keydown',function(e){if((e.key!=='Enter'&&e.key!==' ')||!isHomeVisible()||isActionTarget(e.target))return;var card=cardFromTarget(e.target);if(!card)return;e.preventDefault();openCard(card);},true);

window.BrotwareProjectCardOpenFix={open:openCard,direct:directOpen};
})();