(function(){
'use strict';

function isMoreBlockTab(){
  var active=document.querySelector('#skEventRail .sk-event-cat.active[data-sk-cat]');
  return !!(active&&active.dataset.skCat==='moreblock');
}
function builder(){return window.BrotwareMoreBlocks||null;}
function openBuilder(){
  var api=builder();
  if(api&&typeof api.openBuilder==='function'){api.openBuilder('');return true;}
  if(typeof window.addFunction==='function'){window.addFunction();return true;}
  return false;
}
function onClick(e){
  var btn=e.target&&e.target.closest?e.target.closest('#skAddEventBtn'):null;
  if(!btn||!isMoreBlockTab())return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openBuilder();
}
function refreshButton(){
  var btn=document.getElementById('skAddEventBtn');
  if(!btn)return;
  if(isMoreBlockTab()){
    btn.setAttribute('aria-label','Criar MoreBlock');
    btn.setAttribute('title','Criar MoreBlock');
  }else{
    btn.setAttribute('aria-label','Adicionar evento');
    btn.setAttribute('title','Adicionar evento');
  }
}
function install(){
  var home=document.getElementById('skEventHome');
  if(!home){setTimeout(install,180);return;}
  if(home.dataset.bwMoreBlockPlus==='1'){refreshButton();return;}
  home.dataset.bwMoreBlockPlus='1';
  document.addEventListener('click',onClick,true);
  var obs=new MutationObserver(function(){requestAnimationFrame(refreshButton);});
  obs.observe(home,{subtree:true,attributes:true,attributeFilter:['class']});
  refreshButton();
}
setTimeout(install,0);
setTimeout(install,600);
})();
