(function(){
'use strict';

/*
 * Fix the Sketchware logic back button navigation.
 * The original button closes the overlay and then tries to call the private
 * showEventHome() function, which is not available outside event-sketchware.js.
 * Intercept the click in capture phase and return through switchTab('event'),
 * whose wrapper owns the real Event-home restoration.
 */
var locked=false;

function logicOpen(){
  var ov=document.getElementById('swLogicOverlay');
  return !!(ov&&ov.classList.contains('show'));
}

function returnToEvents(){
  if(locked)return;
  locked=true;
  try{
    var api=window.BrotwareSketchLogic;
    if(api&&typeof api.close==='function')api.close();
    else{
      var ov=document.getElementById('swLogicOverlay');
      if(ov)ov.classList.remove('show','palette-open');
    }
  }catch(e){console.warn('Brotware: failed to close logic overlay',e);}

  requestAnimationFrame(function(){
    try{
      if(typeof window.switchTab==='function')window.switchTab('event');
      else{
        var screen=document.getElementById('screen-event');
        if(screen)screen.classList.add('sk-event-home');
      }
    }catch(e){
      var screen=document.getElementById('screen-event');
      if(screen)screen.classList.add('sk-event-home');
      console.warn('Brotware: failed to restore Events screen',e);
    }
    setTimeout(function(){locked=false;},120);
  });
}

function onClick(e){
  var btn=e.target&&e.target.closest?e.target.closest('#swLogicBack'):null;
  if(!btn||!logicOpen())return;
  e.preventDefault();
  e.stopImmediatePropagation();
  returnToEvents();
}

document.addEventListener('click',onClick,true);

/* Desktop Escape follows the same navigation rule when the palette is closed. */
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape'||!logicOpen())return;
  var ov=document.getElementById('swLogicOverlay');
  if(ov&&ov.classList.contains('palette-open'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  returnToEvents();
},true);

window.BrotwareLogicBackNavigation={back:returnToEvents};
})();
