(function(){
'use strict';

/*
 * The legacy Event/Logic editor is still kept in the DOM because old Brotware
 * code uses its selects/model helpers. It must never become a user-facing
 * screen before, during, or after the Sketchware editor is shown.
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

/* Keep the old editor hidden underneath the Sketchware overlay. This is
 * intentionally a class-only operation: calling switchTab() while opening the
 * overlay would run extra navigation handlers. */
function forceEventHomeUnderOverlay(){
  if(!eventScreenActive())return;
  var ov=overlay();
  if(!ov||!ov.classList.contains('show'))return;
  var s=eventScreen();
  if(!s)return;
  if(!s.classList.contains('sk-event-home'))s.classList.add('sk-event-home');
  hideLegacyEntrypoints();
}

function restoreEventHome(){
  if(restoring||!eventScreenActive())return;
  var ov=overlay();
  if(ov&&ov.classList.contains('show')){
    forceEventHomeUnderOverlay();
    return;
  }
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
  if(ov.dataset.bwLegacyScreenGuard==='1'){
    forceEventHomeUnderOverlay();
    return;
  }
  ov.dataset.bwLegacyScreenGuard='1';
  lastOverlayShown=ov.classList.contains('show');
  if(lastOverlayShown)forceEventHomeUnderOverlay();

  overlayObserver=new MutationObserver(function(){
    var shown=ov.classList.contains('show');
    if(shown){
      /* The legacy card click runs first and removes sk-event-home. The
         Sketchware overlay opens afterwards. MutationObserver runs before the
         next paint, so put the legacy screen back in home mode immediately. */
      forceEventHomeUnderOverlay();
    }else if(lastOverlayShown){
      setTimeout(restoreEventHome,0);
    }
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
  if(s.dataset.bwLegacyScreenGuard==='1'){
    forceEventHomeUnderOverlay();
    return;
  }
  s.dataset.bwLegacyScreenGuard='1';
  screenObserver=new MutationObserver(function(){
    hideLegacyEntrypoints();
    /* Some legacy handlers still remove this class while opening an event.
       Never let that expose the old editor while the new overlay is active. */
    forceEventHomeUnderOverlay();
  });
  screenObserver.observe(s,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}

function install(){installOverlayGuard();installScreenGuard();hideLegacyEntrypoints();forceEventHomeUnderOverlay();}
setTimeout(install,0);
setTimeout(install,500);
setTimeout(install,1400);

window.BrotwareLegacyLogicGuard={restore:restoreEventHome,forceHome:forceEventHomeUnderOverlay,refresh:hideLegacyEntrypoints};
})();
