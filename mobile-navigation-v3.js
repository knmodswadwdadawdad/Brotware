(function(){
'use strict';

var tools=null,zoomLabel=null,observer=null;

function icon(name){return'<span class="bw-google-icon">'+name+'</span>';}
function activeTab(){var t=document.querySelector('.tab.active[data-tab]');return t?t.dataset.tab:'view';}
function bottom(){return document.getElementById('bwMobileBottomNav');}
function sheetBody(){return document.getElementById('bwMobileSheetBody');}

function installBottomNav(){
  var nav=bottom();if(!nav)return false;
  var old=nav.querySelector('[data-bw-mobile-nav="settings"]');
  if(old){
    old.dataset.bwMobileNav='components';
    var ico=old.querySelector('.ico'),label=old.querySelector('.label');
    if(ico)ico.innerHTML=icon('extension');
    if(label)label.textContent='Components';
  }
  var comp=nav.querySelector('[data-bw-mobile-nav="components"]');
  if(comp&&!comp.dataset.bwComponentsBound){
    comp.dataset.bwComponentsBound='1';
    comp.addEventListener('click',function(e){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof switchTab==='function')switchTab('component');
      setTimeout(syncActive,0);
    },true);
  }
  syncActive();return true;
}

function syncActive(){
  var nav=bottom();if(!nav)return;var tab=activeTab();
  nav.querySelectorAll('[data-bw-mobile-nav]').forEach(function(b){
    var a=b.dataset.bwMobileNav;
    b.classList.toggle('active',(a==='logic'&&tab==='event')||(a==='components'&&tab==='component'));
  });
}

function installMoreMenuHook(){
  var more=document.getElementById('bwMobileMore');if(!more||more.dataset.bwNavV3Bound)return false;
  more.dataset.bwNavV3Bound='1';
  more.addEventListener('click',function(){setTimeout(patchMoreMenu,0);});
  return true;
}
function patchMoreMenu(){
  var body=sheetBody();if(!body)return;
  var list=body.querySelector('.bw-mobile-menu-list');if(!list)return;
  ['components','undo','redo'].forEach(function(a){var n=list.querySelector('[data-bw-mobile-action="'+a+'"]');if(n)n.remove();});
  if(!list.querySelector('[data-bw-mobile-action="settings-v3"]')){
    var b=document.createElement('button');b.className='bw-mobile-menu-item';b.type='button';b.dataset.bwMobileAction='settings-v3';
    b.innerHTML='<span class="ico">'+icon('settings')+'</span><span><b>Configuration</b><small>Configurações do projeto</small></span><span class="chev">'+icon('chevron_right')+'</span>';
    list.insertBefore(b,list.firstChild);
  }
}

function installSettingsAction(){
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-bw-mobile-action="settings-v3"]'):null;if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    var close=document.getElementById('bwMobileSheetClose');if(close)close.click();
    if(window.BrotwareConfiguration&&typeof BrotwareConfiguration.open==='function')BrotwareConfiguration.open();
    else{var x=document.getElementById('bwConfigTopBtn');if(x)x.click();}
  },true);
}

function syncZoomLabel(){if(!zoomLabel)return;var z=1;try{if(window.BrotwareMobileZoom&&typeof BrotwareMobileZoom.get==='function')z=BrotwareMobileZoom.get();else if(typeof state!=='undefined'&&state.zoom)z=Number(state.zoom)||1;}catch(_){}zoomLabel.textContent=Math.round(z*100)+'%';}
function historyMove(delta){try{if(typeof restoreHistory==='function')restoreHistory(delta);}catch(e){console.error(e);}setTimeout(syncHistoryState,0);}
function syncHistoryState(){
  if(!tools)return;var u=document.getElementById('bwMobileUndoTop'),r=document.getElementById('bwMobileRedoTop');
  try{
    var p=typeof currentPage==='function'?currentPage():null,arr=p&&state.histories?(state.histories[p.id]||[]):[],idx=p&&state.historyIndex?Number(state.historyIndex[p.id]||0):0;
    if(u)u.disabled=!arr.length||idx<=0;
    if(r)r.disabled=!arr.length||idx>=arr.length-1;
  }catch(_){if(u)u.disabled=false;if(r)r.disabled=false;}
}
function closeZoom(){if(tools)tools.classList.remove('zoom-open');var eye=document.getElementById('bwMobileZoomEye');if(eye)eye.classList.remove('active');}
function buildTools(){
  if(tools)return true;var top=document.getElementById('bwMobileTopbar'),run=document.getElementById('bwMobileRun');if(!top||!run)return false;
  var old=document.getElementById('bwMobileZoom');if(old)old.style.display='none';
  tools=document.createElement('div');tools.id='bwMobileEditTools';tools.className='bw-mobile-edit-tools';
  tools.innerHTML='<button class="bw-mobile-edit-tool" id="bwMobileUndoTop" type="button" aria-label="Desfazer">'+icon('undo')+'</button>'+
    '<button class="bw-mobile-edit-tool" id="bwMobileRedoTop" type="button" aria-label="Refazer">'+icon('redo')+'</button>'+
    '<button class="bw-mobile-edit-tool" id="bwMobileZoomEye" type="button" aria-label="Zoom">'+icon('visibility')+'</button>'+
    '<div class="bw-mobile-eye-zoom" id="bwMobileEyeZoom"><button id="bwMobileEyeZoomOut" type="button" aria-label="Diminuir zoom">'+icon('remove')+'</button><span class="bw-mobile-eye-label" id="bwMobileEyeZoomLabel">100%</span><button id="bwMobileEyeZoomIn" type="button" aria-label="Aumentar zoom">'+icon('add')+'</button></div>';
  top.insertBefore(tools,run);zoomLabel=document.getElementById('bwMobileEyeZoomLabel');
  document.getElementById('bwMobileUndoTop').onclick=function(e){e.preventDefault();historyMove(-1);};
  document.getElementById('bwMobileRedoTop').onclick=function(e){e.preventDefault();historyMove(1);};
  document.getElementById('bwMobileZoomEye').onclick=function(e){e.preventDefault();e.stopPropagation();tools.classList.toggle('zoom-open');this.classList.toggle('active',tools.classList.contains('zoom-open'));syncZoomLabel();};
  document.getElementById('bwMobileEyeZoomOut').onclick=function(e){e.preventDefault();e.stopPropagation();if(window.BrotwareMobileZoom&&BrotwareMobileZoom.zoomOut)BrotwareMobileZoom.zoomOut();syncZoomLabel();};
  document.getElementById('bwMobileEyeZoomIn').onclick=function(e){e.preventDefault();e.stopPropagation();if(window.BrotwareMobileZoom&&BrotwareMobileZoom.zoomIn)BrotwareMobileZoom.zoomIn();syncZoomLabel();};
  document.addEventListener('click',function(e){if(tools&&tools.classList.contains('zoom-open')&&!e.target.closest('#bwMobileEditTools'))closeZoom();});
  syncZoomLabel();syncHistoryState();return true;
}

function refresh(){installBottomNav();installMoreMenuHook();buildTools();syncActive();syncZoomLabel();syncHistoryState();}
function observe(){if(observer)return;observer=new MutationObserver(function(){clearTimeout(window.__bwNavV3Timer);window.__bwNavV3Timer=setTimeout(refresh,25);});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}

installSettingsAction();setTimeout(refresh,0);setTimeout(refresh,300);setTimeout(refresh,1000);observe();
window.addEventListener('resize',function(){setTimeout(refresh,50);});
window.BrotwareMobileNavigationV3={refresh:refresh,zoom:syncZoomLabel};
})();
