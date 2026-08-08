(function(){
'use strict';

/*
 * One back-navigation rule for the Sketchware logic editor.
 * On mobile the visible arrow is #bwMobileBack (global editor chrome), while
 * desktop/isolated logic can use #swLogicBack. Both must close the logic
 * overlay first and return to the Event browser. They must never switch the
 * underlying editor to View while the logic overlay is still open.
 */
var locked=false;

function overlay(){return document.getElementById('swLogicOverlay');}
function logicOpen(){var ov=overlay();return !!(ov&&ov.classList.contains('show'));}

function forceEventHome(){
  var screen=document.getElementById('screen-event');
  if(screen)screen.classList.add('sk-event-home');

  /* Keep the global mobile chrome in sync with the screen we actually show. */
  try{
    if(window.BrotwareMobileWorkspace&&typeof BrotwareMobileWorkspace.refresh==='function')BrotwareMobileWorkspace.refresh();
  }catch(_){}
}

function returnToEvents(){
  if(locked)return;
  locked=true;

  try{
    var api=window.BrotwareSketchLogic;
    if(api&&typeof api.close==='function')api.close();
    else{
      var ov=overlay();
      if(ov)ov.classList.remove('show','palette-open');
    }
  }catch(e){console.warn('Brotware: failed to close logic overlay',e);}

  /* Restore Event immediately so the legacy/View screen never flashes. */
  try{
    if(typeof window.switchTab==='function')window.switchTab('event');
  }catch(e){console.warn('Brotware: failed to switch back to Event',e);}
  forceEventHome();

  requestAnimationFrame(function(){
    forceEventHome();
    setTimeout(function(){forceEventHome();locked=false;},80);
  });
}

function onClick(e){
  if(!logicOpen())return;
  var btn=e.target&&e.target.closest?e.target.closest('#swLogicBack,#bwMobileBack'):null;
  if(!btn)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  returnToEvents();
}

document.addEventListener('click',onClick,true);

/* Desktop Escape follows the same navigation rule when the palette is closed. */
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape'||!logicOpen())return;
  var ov=overlay();
  if(ov&&ov.classList.contains('palette-open'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  returnToEvents();
},true);

window.BrotwareLogicBackNavigation={back:returnToEvents,isOpen:logicOpen};
})();
