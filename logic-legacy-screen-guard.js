(function(){
'use strict';

/*
 * The legacy Event/Logic editor is still kept in the DOM because old Brotware
 * code uses its selects/model helpers. It must never become a user-facing
 * screen after the Sketchware editor closes.
 */
var overlayObserver=null;
var screenObserver=null;
var lastOverlayShown=false;
var restoring=false;

function eventScreen(){return document.getElementById('screen-event');}
function overlay(){return document.getElementById('swLogicOverlay');}
function eventScreenActive(){var s=eventScreen();return !!(s&&s.classList.contains('active'));}

function hideLegacyEntrypoints(){
  var legacy=document.getElementById('skOpenLegacy');
  if(legacy){
    legacy.hidden=true;
    legacy.style.display='none';
    legacy.setAttribute('aria-hidden','true');
    legacy.tabIndex=-1;
  }
}

function restoreEventHome(){
  if(restoring||!eventScreenActive())return;
  var ov=overlay();
  if(ov&&ov.classList.contains('show'))return;
  var s=eventScreen();
  if(!s)return;
  hideLegacyEntrypoints();
  if(s.classList.contains('sk-event-home'))return;

  restoring=true;
  try{
    /* event-sketchware wraps switchTab('event') and calls its private
       showEventHome(), so this safely restores + rerenders the Event browser. */
    if(typeof window.switchTab==='function')window.switchTab('event');
    else s.classList.add('sk-event-home');
  }catch(e){
    s.classList.add('sk-event-home');
    console.warn('Brotware: could not restore Event home through switchTab',e);
  }finally{
    restoring=false;
  }
  hideLegacyEntrypoints();
}

function installOverlayGuard(){
  var ov=overlay();
  if(!ov){setTimeout(installOverlayGuard,180);return;}
  hideLegacyEntrypoints();
  if(ov.dataset.bwLegacyScreenGuard==='1')return;
  ov.dataset.bwLegacyScreenGuard='1';
  lastOverlayShown=ov.classList.contains('show');

  overlayObserver=new MutationObserver(function(){
    var shown=ov.classList.contains('show');
    if(lastOverlayShown&&!shown)setTimeout(restoreEventHome,0);
    lastOverlayShown=shown;
    hideLegacyEntrypoints();
  });
  overlayObserver.observe(ov,{attributes:true,attributeFilter:['class']});

  var back=document.getElementById('swLogicBack');
  if(back)back.addEventListener('click',function(){setTimeout(restoreEventHome,0);},true);

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&ov.classList.contains('show'))setTimeout(restoreEventHome,0);
  },true);
}

function installScreenGuard(){
  var s=eventScreen();
  if(!s){setTimeout(installScreenGuard,220);return;}
  hideLegacyEntrypoints();
  if(s.dataset.bwLegacyScreenGuard==='1')return;
  s.dataset.bwLegacyScreenGuard='1';
  screenObserver=new MutationObserver(function(){hideLegacyEntrypoints();});
  screenObserver.observe(s,{childList:true,subtree:true});
}

function install(){installOverlayGuard();installScreenGuard();hideLegacyEntrypoints();}
setTimeout(install,0);
setTimeout(install,500);
setTimeout(install,1400);

window.BrotwareLegacyLogicGuard={restore:restoreEventHome,refresh:hideLegacyEntrypoints};
})();
