(function(){
'use strict';

var mounted=false,installDone=false,originalParent=null,originalNext=null,rootDisplay='',captureInstalled=false,activationBusy=false;
var pollTimer=null;

function hybrid(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function legacy(){return window.BrotwareExternalPreview&&BrotwareExternalPreview.getState?BrotwareExternalPreview.getState():{};}
function active(){var s=hybrid();return !!(s&&s.active&&s.projectId);}
function workspace(){return document.getElementById('bwExternalWorkspace');}
function shell(){return document.getElementById('bwExternalShell');}
function frame(){return document.getElementById('bwExternalFrame');}
function pane(){return document.getElementById('viewPane');}
function root(){return document.getElementById('rootLayout');}
function entryName(){var s=hybrid(),p=String(s.entry||'index.html').replace(/\\/g,'/');return p.split('/').pop()||'index.html';}
function toastMsg(v){if(typeof toast==='function')toast(v);}

function ensureHybrid(){
  if(active()||activationBusy||!window.BrotwareExternalHybrid||!BrotwareExternalHybrid.activate)return Promise.resolve(active());
  var l=legacy(),w=workspace();
  if(!l.projectId||!w||!w.classList.contains('show'))return Promise.resolve(false);
  activationBusy=true;
  return Promise.resolve(BrotwareExternalHybrid.activate(l.projectId)).then(function(){activationBusy=false;return active();},function(e){activationBusy=false;console.error('[Brotware Native Host] activate failed',e);return false;});
}

function forceView(){
  if(typeof switchTab==='function')switchTab('view');
  var tab=document.querySelector('.tab[data-tab="view"]');if(tab&&!tab.classList.contains('active'))tab.click();
}
function syncLabels(){
  var name=entryName(),ids=['currentPageName','phoneLabel','statusFile','statusPage','bwMobileTitle'];
  ids.forEach(function(id){var el=document.getElementById(id);if(el&&el.textContent!==name)el.textContent=name;});
  var sub=document.getElementById('bwMobileSubtitle');if(sub&&sub.textContent!=='Interface')sub.textContent='Interface';
  var pn=document.getElementById('projectName'),r=window.BrotwareProjectFormat&&hybrid().projectId?BrotwareProjectFormat.findRecord(hybrid().projectId):null;
  if(pn&&r&&r.name)pn.textContent=r.name;
}
function syncDevice(){
  var ph=document.getElementById('phone'),d='mobile';if(ph){if(ph.classList.contains('desktop'))d='desktop';else if(ph.classList.contains('tablet'))d='tablet';}
  var sh=shell();if(sh){sh.classList.remove('mobile','tablet','desktop');sh.classList.add(d);}
}

function mount(){
  if(!active())return false;
  var sh=shell(),vp=pane(),rt=root(),ws=workspace();if(!sh||!vp||!rt||!ws)return false;
  if(!mounted){
    originalParent=sh.parentNode;originalNext=sh.nextSibling;rootDisplay=rt.style.display||'';
    vp.appendChild(sh);mounted=true;
  }
  document.body.classList.add('bw-external-native-host');document.body.classList.remove('bw-external-open');
  ws.classList.add('bw-native-runtime-only');sh.classList.add('bw-native-hosted');
  rt.style.display='none';vp.classList.add('bw-external-native-pane');
  forceView();syncLabels();syncDevice();patchNavigation();installCapture();
  if(window.BrotwareHybridEditor&&BrotwareHybridEditor.setEdit&&!BrotwareHybridEditor.isEdit())BrotwareHybridEditor.setEdit(true);
  return true;
}

function unmount(){
  if(!mounted)return;
  var sh=shell(),rt=root(),vp=pane(),ws=workspace();
  if(sh&&originalParent){if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(sh,originalNext);else originalParent.appendChild(sh);sh.classList.remove('bw-native-hosted');}
  if(rt)rt.style.display=rootDisplay;if(vp)vp.classList.remove('bw-external-native-pane');if(ws)ws.classList.remove('bw-native-runtime-only');
  document.body.classList.remove('bw-external-native-host');mounted=false;originalParent=null;originalNext=null;
}

function openLogic(){
  if(!active())return;
  if(typeof switchTab==='function')switchTab('event');
  if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();
  if(window.BrotwareExternalLogicProvider&&BrotwareExternalLogicProvider.refresh)BrotwareExternalLogicProvider.refresh();
  setTimeout(function(){var view=document.querySelector('[data-sk-cat="view"]');if(view)view.click();},30);
}
function returnView(){
  if(!active())return;if(typeof switchTab==='function')switchTab('view');
  if(window.BrotwareExternalHybrid&&BrotwareExternalHybrid.syncLogic)BrotwareExternalHybrid.syncLogic();mount();
}
function patchNavigation(){
  var n=window.BrotwareExternalNavigation;if(!n||n.__bwNativeHost)return;n.logic=openLogic;n.preview=returnView;n.__bwNativeHost=true;
}

function externalAdd(type){
  if(window.BrotwareExternalNativeBehavior&&BrotwareExternalNativeBehavior.insert){BrotwareExternalNativeBehavior.insert(type);return true;}
  return false;
}
function openExternalSettings(){
  var s=hybrid().selection||(window.BrotwareHybridEditor&&BrotwareHybridEditor.selection&&BrotwareHybridEditor.selection());
  if(s&&window.BrotwareExternalInspector&&BrotwareExternalInspector.render)BrotwareExternalInspector.render(s);else toastMsg('Selecione uma View primeiro');
}
function runToggle(){
  if(!window.BrotwareHybridEditor)return;var editing=BrotwareHybridEditor.isEdit&&BrotwareHybridEditor.isEdit();BrotwareHybridEditor.setEdit(!editing);toastMsg(editing?'Modo de interação':'Modo de edição');
}
function goBack(){var b=document.getElementById('bwExternalBack');if(b)b.click();}

function capture(e){
  if(!active()||!mounted)return;
  var t=e.target&&e.target.closest?e.target:null;if(!t)return;
  var add=t.closest('[data-bw-mobile-add],[data-create]');
  if(add){var type=add.dataset.bwMobileAdd||add.dataset.create;if(type&&externalAdd(type)){e.preventDefault();e.stopImmediatePropagation();var back=document.getElementById('bwMobileSheetBackdrop');if(back)back.classList.remove('show');document.body.classList.remove('bw-mobile-sheet-open');}return;}
  var nav=t.closest('[data-bw-mobile-nav]');
  if(nav){var a=nav.dataset.bwMobileNav;if(a==='layers'){e.preventDefault();e.stopImmediatePropagation();if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.openLayers();return;}if(a==='logic'){e.preventDefault();e.stopImmediatePropagation();openLogic();return;}if(a==='settings'){e.preventDefault();e.stopImmediatePropagation();openExternalSettings();return;}}
  var id=(t.closest('button')||{}).id||'';
  if(id==='bwMobileRun'||id==='runBtn'){e.preventDefault();e.stopImmediatePropagation();runToggle();return;}
  if(id==='bwMobileBack'){e.preventDefault();e.stopImmediatePropagation();goBack();return;}
  if(id==='bwMobileSelectionProps'){e.preventDefault();e.stopImmediatePropagation();openExternalSettings();return;}
  if(id==='bwDesktopViewport'||t.closest('[data-device]'))setTimeout(syncDevice,0);
}
function installCapture(){if(captureInstalled)return;captureInstalled=true;document.addEventListener('click',capture,true);}

function syncSelection(e){
  if(!mounted)return;var s=e&&e.detail?e.detail:hybrid().selection;if(!s)return;
  var label=s.id||(s.attributes&&s.attributes.name)||String(s.tag||'View').toLowerCase(),n=document.getElementById('bwMobileSelectionName');if(n)n.textContent=label;
  document.body.classList.add('bw-import-external-selected');
}
function clearSelection(){document.body.classList.remove('bw-import-external-selected');}

function tick(){
  ensureHybrid().then(function(ok){if(ok){mount();syncLabels();syncDevice();}else if(mounted){unmount();clearSelection();}});
}
function install(){
  if(installDone)return;installDone=true;installCapture();
  window.addEventListener('brotware:external-open',function(){setTimeout(tick,0);setTimeout(tick,120);});
  window.addEventListener('brotware:external-ready',tick);window.addEventListener('brotware:external-selection',syncSelection);
  window.addEventListener('brotware:external-close',function(){unmount();clearSelection();});
  window.addEventListener('resize',function(){if(mounted)setTimeout(syncDevice,30);});
  pollTimer=setInterval(tick,500);setTimeout(tick,0);setTimeout(tick,700);
}

window.BrotwareExternalNativeHost={mount:mount,unmount:unmount,refresh:tick,logic:openLogic,view:returnView,version:'1.0.0'};
setTimeout(install,0);
})();
