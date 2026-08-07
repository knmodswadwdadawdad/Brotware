(function(){
'use strict';

var oldCleanup=window.cleanupExportDom;
var oldRuntime=window.runtimeScriptForPage;

function n(v){var x=parseFloat(v);return isNaN(x)?0:x;}
function inset(el,side){var p=el&&el.parentElement;return String(p&&p.dataset&&p.dataset['bwPadding'+side]||'0px');}
function isMatch(el,axis){
  if(!el)return false;
  var key=axis==='width'?'widthMode':'heightMode',flag=axis==='width'?'bwMarginMatchWidth':'bwMarginMatchHeight',saved=el.dataset[key];
  if(saved==='match_parent')return true;
  if(saved==='wrap_content'||saved==='custom')return false;
  return el.dataset[flag]==='1';
}
function undoLegacy(el){var r=n(el.dataset.bwMarginRightComp||0),b=n(el.dataset.bwMarginBottomComp||0);if(r)el.style.left=(n(el.style.left)+r)+'px';if(b)el.style.top=(n(el.style.top)+b)+'px';delete el.dataset.bwMarginRightComp;delete el.dataset.bwMarginBottomComp;}
function normalizeNode(el){
  if(!el)return;undoLegacy(el);
  if(isMatch(el,'width')){el.dataset.widthMode='match_parent';el.style.left=inset(el,'Left');el.style.right=inset(el,'Right');el.style.width='auto';}
  if(isMatch(el,'height')){el.dataset.heightMode='match_parent';el.style.top=inset(el,'Top');el.style.bottom=inset(el,'Bottom');el.style.height='auto';}
}
function normalizeHtml(html){var holder=document.createElement('div');holder.innerHTML=html||'';holder.querySelectorAll('.vf-node').forEach(normalizeNode);return holder.innerHTML;}
if(typeof oldCleanup==='function')window.cleanupExportDom=function(page){return normalizeHtml(oldCleanup(page));};
if(typeof oldRuntime==='function'){
  window.runtimeScriptForPage=function(page){var base=oldRuntime(page);return base+'\n(function(){function bwInset(el,s){var p=el.parentElement;return p&&p.dataset&&p.dataset[\'bwPadding\'+s]||\'0px\';}function bwMatchParent(){document.querySelectorAll(\'.vf-node\').forEach(function(el){var ws=el.dataset.widthMode,hs=el.dataset.heightMode,wm=ws===\'match_parent\'||(!ws&&el.dataset.bwMarginMatchWidth===\'1\'),hm=hs===\'match_parent\'||(!hs&&el.dataset.bwMarginMatchHeight===\'1\');if(wm){el.style.left=bwInset(el,\'Left\');el.style.right=bwInset(el,\'Right\');el.style.width=\'auto\';}if(hm){el.style.top=bwInset(el,\'Top\');el.style.bottom=bwInset(el,\'Bottom\');el.style.height=\'auto\';}});}window.addEventListener(\'load\',bwMatchParent);window.addEventListener(\'resize\',bwMatchParent);requestAnimationFrame(bwMatchParent);})();';};
}
window.BrotwareMatchParentExportFix={normalizeHtml:normalizeHtml,normalizeNode:normalizeNode};
})();