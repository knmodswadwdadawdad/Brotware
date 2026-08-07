(function(){
'use strict';

var oldCleanup=window.cleanupExportDom;
var oldRuntime=window.runtimeScriptForPage;

function n(v){var x=parseFloat(v);return isNaN(x)?0:x;}
function isMatch(el,axis){
  var key=axis==='width'?'widthMode':'heightMode';
  var flag=axis==='width'?'bwMarginMatchWidth':'bwMarginMatchHeight';
  return !!(el&&(el.dataset[key]==='match_parent'||el.dataset[flag]==='1'));
}
function undoLegacy(el){
  var r=n(el.dataset.bwMarginRightComp||0),b=n(el.dataset.bwMarginBottomComp||0);
  if(r)el.style.left=(n(el.style.left)+r)+'px';
  if(b)el.style.top=(n(el.style.top)+b)+'px';
  delete el.dataset.bwMarginRightComp;delete el.dataset.bwMarginBottomComp;
}
function normalizeNode(el){
  if(!el)return;
  undoLegacy(el);
  if(isMatch(el,'width')){
    el.dataset.widthMode='match_parent';
    el.style.left='0px';
    el.style.right='0px';
    el.style.width='auto';
  }
  if(isMatch(el,'height')){
    el.dataset.heightMode='match_parent';
    el.style.top='0px';
    el.style.bottom='0px';
    el.style.height='auto';
  }
}
function normalizeHtml(html){
  var holder=document.createElement('div');holder.innerHTML=html||'';
  holder.querySelectorAll('.vf-node').forEach(normalizeNode);
  return holder.innerHTML;
}

if(typeof oldCleanup==='function'){
  window.cleanupExportDom=function(page){return normalizeHtml(oldCleanup(page));};
}

/* Keep native match_parent anchors correct even if another runtime extension
   changes positions after page load (for example Layout gravity). */
if(typeof oldRuntime==='function'){
  window.runtimeScriptForPage=function(page){
    var base=oldRuntime(page);
    return base+'\n(function(){function bwMatchParent(){document.querySelectorAll(\'.vf-node\').forEach(function(el){var wm=el.dataset.widthMode===\'match_parent\'||el.dataset.bwMarginMatchWidth===\'1\',hm=el.dataset.heightMode===\'match_parent\'||el.dataset.bwMarginMatchHeight===\'1\';if(wm){el.style.left=\'0px\';el.style.right=\'0px\';el.style.width=\'auto\';}if(hm){el.style.top=\'0px\';el.style.bottom=\'0px\';el.style.height=\'auto\';}});}window.addEventListener(\'load\',bwMatchParent);window.addEventListener(\'resize\',bwMatchParent);requestAnimationFrame(bwMatchParent);})();';
  };
}

window.BrotwareMatchParentExportFix={normalizeHtml:normalizeHtml,normalizeNode:normalizeNode};
})();
