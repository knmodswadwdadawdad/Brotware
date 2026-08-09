(function(){
'use strict';

var ov=null,obs=null;
function overlay(){return document.getElementById('swLogicOverlay');}
function interactive(el){return !!(el&&el.closest&&el.closest('select,input,textarea,option,[contenteditable="true"],.sw3-reporter[data-value-block-id],.sw3-input-host,.sw3-empty-socket,.sw2-menu'))}
function cleanQuickButtons(){
  ov=overlay();if(!ov)return;
  ov.querySelectorAll('button').forEach(function(b){
    var txt=String(b.textContent||'').trim().toLowerCase();
    if(['show','close','toggle'].indexOf(txt)<0)return;
    if(b.closest('.sw-palette,.sw-block,.sw5-drag-actions'))return;
    b.remove();
  });
}
function hideClickToolbar(){
  var t=document.querySelector('#swLogicOverlay .sw4-block-toolbar');if(t)t.classList.remove('show');
  document.querySelectorAll('#swLogicOverlay .sw-block.sw4-selected').forEach(function(b){b.classList.remove('sw4-selected');});
}
function bindControls(root){
  (root||ov).querySelectorAll('select,input,textarea').forEach(function(el){
    if(el.dataset.sw5NoBubble==='1')return;el.dataset.sw5NoBubble='1';
    el.addEventListener('click',function(e){e.stopPropagation();});
    el.addEventListener('pointerdown',function(e){e.stopPropagation();});
  });
}
function bindBlocks(root){
  (root||ov).querySelectorAll('.sw-block[data-block-id]').forEach(function(block){
    if(block.dataset.sw5TapBound==='1')return;block.dataset.sw5TapBound='1';
    block.addEventListener('click',function(e){
      if(interactive(e.target))return;
      var until=Number((ov&&ov.dataset.suppressClickUntil)||0);if(Date.now()<until)return;
      e.preventDefault();e.stopImmediatePropagation();hideClickToolbar();
      var id=block.dataset.blockId;if(!id||typeof window.openBlockEditor!=='function')return;
      /* v4 wrapped openBlockEditor used first tap for selection. Two immediate calls
         preserve the original editor action while never leaving the selection toolbar visible. */
      try{window.openBlockEditor(id);window.openBlockEditor(id);}catch(err){console.error(err);}
      hideClickToolbar();
    });
  });
}
function refresh(){
  ov=overlay();if(!ov)return;cleanQuickButtons();hideClickToolbar();bindControls(ov);bindBlocks(ov);
}
function install(){
  ov=overlay();if(!ov){setTimeout(install,160);return;}refresh();
  if(obs)return;var queued=false;obs=new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refresh();});});obs.observe(ov,{childList:true,subtree:true});
  ov.addEventListener('pointerdown',function(e){if(interactive(e.target))hideClickToolbar();},true);
  window.addEventListener('brotware:logic-refresh',refresh);
}
setTimeout(install,0);setTimeout(install,600);setTimeout(install,1400);
window.BrotwareLogicInteractionV5={refresh:refresh};
})();