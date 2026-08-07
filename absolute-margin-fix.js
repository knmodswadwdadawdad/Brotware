(function(){
'use strict';

var session=null;
var installed=false;
var originalOpenSpacing=null;

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function n(v){var x=parseFloat(v);return isNaN(x)?0:x;}
function round(v){return Math.round(v*100)/100;}
function cssValue(v,unit){var x=n(v);return round(x)+(unit||'px');}
function isMatchParent(el,axis){
  if(!el)return false;
  var key=axis==='width'?'widthMode':'heightMode';
  var flag=axis==='width'?'bwMarginMatchWidth':'bwMarginMatchHeight';
  var saved=el.dataset[key];
  /* Explicit user choice always wins over any legacy helper flag. */
  if(saved==='match_parent')return true;
  if(saved==='wrap_content'||saved==='custom')return false;
  if(el.dataset[flag]==='1')return true;
  var value=String(el.style[axis]||'').replace(/\s+/g,'').toLowerCase();
  return value==='100%';
}
function refresh(el){
  if(typeof commit==='function')commit();
  if(typeof selectNode==='function'&&el)selectNode(el.dataset.vfId);
  setTimeout(function(){
    if(window.BrotwareMobileProperties&&BrotwareMobileProperties.render)BrotwareMobileProperties.render();
    if(window.BrotwareMobileQuickProperties&&BrotwareMobileQuickProperties.render)BrotwareMobileQuickProperties.render();
    if(window.BrotwareDesktopUI&&BrotwareDesktopUI.quick)BrotwareDesktopUI.quick();
  },40);
}

/* Undo the old right/bottom position compensation once. */
function undoLegacyCompensation(el){
  if(!el)return;
  var oldRight=n(el.dataset.bwMarginRightComp||0),oldBottom=n(el.dataset.bwMarginBottomComp||0);
  if(oldRight)el.style.left=round(n(el.style.left)+oldRight)+'px';
  if(oldBottom)el.style.top=round(n(el.style.top)+oldBottom)+'px';
  delete el.dataset.bwMarginRightComp;
  delete el.dataset.bwMarginBottomComp;
}

/* Native absolute-positioned fill. Using left+right (or top+bottom) with auto
   size makes CSS margins behave exactly like visual insets and stays responsive. */
function applyMatchParentWidth(el){
  el.dataset.widthMode='match_parent';
  el.dataset.bwMarginMatchWidth='1';
  el.style.left='0px';
  el.style.right='0px';
  el.style.width='auto';
}
function applyMatchParentHeight(el){
  el.dataset.heightMode='match_parent';
  el.dataset.bwMarginMatchHeight='1';
  el.style.top='0px';
  el.style.bottom='0px';
  el.style.height='auto';
}
function clearWidthAnchor(el){
  if(!el)return;
  el.style.removeProperty('right');
  delete el.dataset.bwMarginMatchWidth;
}
function clearHeightAnchor(el){
  if(!el)return;
  el.style.removeProperty('bottom');
  delete el.dataset.bwMarginMatchHeight;
}

function applyVisualMargins(el,css){
  if(!el)return;
  undoLegacyCompensation(el);
  var wasMatchW=isMatchParent(el,'width'),wasMatchH=isMatchParent(el,'height');
  el.style.margin=css[0]+' '+css[1]+' '+css[2]+' '+css[3];
  if(wasMatchW)applyMatchParentWidth(el);else clearWidthAnchor(el);
  if(wasMatchH)applyMatchParentHeight(el);else clearHeightAnchor(el);
}

function reapplyMatchParent(el){
  if(!el)return;
  var widthSaved=el.dataset.widthMode,heightSaved=el.dataset.heightMode;
  if(widthSaved==='match_parent')applyMatchParentWidth(el);
  else if(widthSaved==='wrap_content'||widthSaved==='custom')clearWidthAnchor(el);
  else if(el.dataset.bwMarginMatchWidth==='1')applyMatchParentWidth(el);
  else clearWidthAnchor(el);

  if(heightSaved==='match_parent')applyMatchParentHeight(el);
  else if(heightSaved==='wrap_content'||heightSaved==='custom')clearHeightAnchor(el);
  else if(el.dataset.bwMarginMatchHeight==='1')applyMatchParentHeight(el);
  else clearHeightAnchor(el);
}

function beginMarginDialog(){
  var el=selected();if(!el||!originalOpenSpacing)return;
  originalOpenSpacing('margin');
  session={el:el};
}

function saveMargin(){
  if(!session||!session.el)return;
  var el=session.el,unit=document.getElementById('bwNumUnit'),all=document.getElementById('bwNumAllSides');
  if(!unit||!all)return;
  var u=unit.value||'px',useAll=all.checked,values;
  if(useAll){
    var v=document.getElementById('bwNumAllValue');
    values=[v?v.value:0,v?v.value:0,v?v.value:0,v?v.value:0];
  }else{
    values=[
      document.getElementById('bwNumTop')?document.getElementById('bwNumTop').value:0,
      document.getElementById('bwNumRight')?document.getElementById('bwNumRight').value:0,
      document.getElementById('bwNumBottom')?document.getElementById('bwNumBottom').value:0,
      document.getElementById('bwNumLeft')?document.getElementById('bwNumLeft').value:0
    ];
  }
  applyVisualMargins(el,values.map(function(v){return cssValue(v,u);}));
  session=null;refresh(el);
  if(window.BrotwareNumericDialogs&&BrotwareNumericDialogs.close)BrotwareNumericDialogs.close();
  if(typeof toast==='function')toast('Margin aplicada');
}

function normalizeAll(){
  var r=typeof root!=='undefined'?root:document.getElementById('rootLayout');if(!r)return;
  r.querySelectorAll('.vf-node').forEach(function(el){reapplyMatchParent(el);});
}

function install(){
  if(installed)return;
  var api=window.BrotwareNumericDialogs;if(!api||typeof api.openSpacing!=='function'){setTimeout(install,80);return;}
  installed=true;originalOpenSpacing=api.openSpacing.bind(api);
  api.openSpacing=function(kind){if(kind==='margin'){beginMarginDialog();return;}return originalOpenSpacing(kind);};

  window.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('[data-mprops-action="margin"],[data-mquick-action="margin"]'):null;
    if(!a)return;e.preventDefault();e.stopImmediatePropagation();beginMarginDialog();
  },true);
  document.addEventListener('click',function(e){
    if(!session)return;var save=e.target&&e.target.closest?e.target.closest('#bwNumSave'):null;if(!save)return;
    e.preventDefault();e.stopImmediatePropagation();saveMargin();
  },true);

  /* Reapply only if the mode selected after Size dialog is truly match_parent. */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('#bwSizeSelect'):null;if(!b)return;
    var el=selected();setTimeout(function(){if(el){reapplyMatchParent(el);refresh(el);}},35);
  },true);

  var back=document.getElementById('bwNumericDialog');
  if(back)new MutationObserver(function(){if(!back.classList.contains('show'))session=null;}).observe(back,{attributes:true,attributeFilter:['class']});

  /* Existing saved projects are normalized after load/undo without format migration. */
  if(window.loadPage&&!window.loadPage.__bwMarginAnchor){
    var lp=window.loadPage;var wrapped=function(){var out=lp.apply(this,arguments);setTimeout(normalizeAll,0);return out;};wrapped.__bwMarginAnchor=true;window.loadPage=wrapped;
  }
  if(window.restoreHistory&&!window.restoreHistory.__bwMarginAnchor){
    var rh=window.restoreHistory;var wh=function(){var out=rh.apply(this,arguments);setTimeout(normalizeAll,0);return out;};wh.__bwMarginAnchor=true;window.restoreHistory=wh;
  }
  normalizeAll();
}

setTimeout(install,0);setTimeout(install,300);setTimeout(install,900);
window.BrotwareAbsoluteMarginFix={apply:function(){beginMarginDialog();},reapply:reapplyMatchParent,applyVisualMargins:applyVisualMargins,normalize:normalizeAll};
})();
