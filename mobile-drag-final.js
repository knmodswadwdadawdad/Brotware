(function(){
'use strict';
var mq=window.matchMedia('(max-width:760px)');
if(!mq.matches)return;

function installButton(){
  var old=document.getElementById('mobilePaletteBtn');
  if(!old)return false;
  if(old.dataset.finalToggle==='1')return true;
  var btn=old.cloneNode(true);
  btn.dataset.finalToggle='1';
  btn.textContent='☰ Widgets';
  old.parentNode.replaceChild(btn,old);
  btn.addEventListener('pointerdown',function(e){e.stopPropagation();});
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    document.body.classList.toggle('mobile-palette-open');
  });
  return true;
}
function installBackdrop(){
  var b=document.getElementById('mobilePaletteBackdrop');
  if(!b){
    b=document.createElement('div');
    b.id='mobilePaletteBackdrop';
    b.className='mobile-palette-backdrop';
    document.body.appendChild(b);
  }
  if(b.dataset.finalBound!=='1'){
    b.dataset.finalBound='1';
    b.addEventListener('pointerdown',function(e){e.preventDefault();document.body.classList.remove('mobile-palette-open');});
  }
}
function cleanupDragUi(){
  var dz=document.getElementById('deleteZone');
  if(dz)dz.classList.remove('show','hot');
  var ghost=document.getElementById('dragGhost');
  if(ghost)ghost.style.display='none';
  document.querySelectorAll('.drop-target').forEach(function(n){n.classList.remove('drop-target');});
}
function install(){
  installButton();installBackdrop();cleanupDragUi();
}

document.addEventListener('pointerup',function(){setTimeout(cleanupDragUi,60);},true);
document.addEventListener('pointercancel',function(){setTimeout(cleanupDragUi,0);},true);
window.addEventListener('blur',cleanupDragUi);

setTimeout(install,0);
setTimeout(install,180);
setTimeout(install,700);
})();
