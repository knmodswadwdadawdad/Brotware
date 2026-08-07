(function(){
'use strict';

var session=null;
var installed=false;
var originalOpenSpacing=null;

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function n(v){var x=parseFloat(v);return isNaN(x)?0:x;}
function round(v){return Math.round(v*100)/100;}
function cssValue(v,unit){var x=n(v);return round(x)+(unit||'px');}
function isZeroCss(v){return /^-?0(?:\.0+)?(?:px|%|rem|em)?$/i.test(String(v||'').trim());}
function isMatchParent(el,axis){
  if(!el)return false;
  var key=axis==='width'?'widthMode':'heightMode';
  if(el.dataset[key]==='match_parent')return true;
  var value=String(el.style[axis]||'').replace(/\s+/g,'').toLowerCase();
  return value==='100%'||value.indexOf('calc(100%-')===0;
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

/* Older Brotware versions tried to emulate right/bottom margin by changing
   left/top. Undo that once before applying the proper match_parent rule. */
function undoLegacyCompensation(el){
  if(!el)return;
  var oldRight=n(el.dataset.bwMarginRightComp||0),oldBottom=n(el.dataset.bwMarginBottomComp||0);
  if(oldRight){el.style.left=round(n(el.style.left)+oldRight)+'px';}
  if(oldBottom){el.style.top=round(n(el.style.top)+oldBottom)+'px';}
  delete el.dataset.bwMarginRightComp;
  delete el.dataset.bwMarginBottomComp;
}

function calcMatchParentSize(a,b){
  a=String(a||'0px').trim();b=String(b||'0px').trim();
  if(isZeroCss(a)&&isZeroCss(b))return'100%';
  if(isZeroCss(a))return'calc(100% - '+b+')';
  if(isZeroCss(b))return'calc(100% - '+a+')';
  return'calc(100% - '+a+' - '+b+')';
}

function applyVisualMargins(el,css){
  if(!el)return;
  undoLegacyCompensation(el);

  var top=css[0],right=css[1],bottom=css[2],left=css[3];
  el.style.margin=top+' '+right+' '+bottom+' '+left;

  /* A free-canvas node is position:absolute. For a match_parent node, normal
     margin-right/bottom would overflow instead of shrinking the element. Treat
     margins as the available inset, like visual Android builders do. */
  if(isMatchParent(el,'width')){
    el.dataset.widthMode='match_parent';
    el.style.left='0px';
    el.style.width=calcMatchParentSize(left,right);
    el.dataset.bwMarginMatchWidth='1';
  }else{
    delete el.dataset.bwMarginMatchWidth;
  }

  if(isMatchParent(el,'height')){
    el.dataset.heightMode='match_parent';
    el.style.top='0px';
    el.style.height=calcMatchParentSize(top,bottom);
    el.dataset.bwMarginMatchHeight='1';
  }else{
    delete el.dataset.bwMarginMatchHeight;
  }
}

function reapplyMatchParent(el){
  if(!el)return;
  var cs;try{cs=getComputedStyle(el);}catch(e){return;}
  var css=[cs.marginTop,cs.marginRight,cs.marginBottom,cs.marginLeft];
  if(el.dataset.widthMode==='match_parent'||el.dataset.bwMarginMatchWidth==='1'){
    el.dataset.widthMode='match_parent';el.style.left='0px';el.style.width=calcMatchParentSize(css[3],css[1]);
  }
  if(el.dataset.heightMode==='match_parent'||el.dataset.bwMarginMatchHeight==='1'){
    el.dataset.heightMode='match_parent';el.style.top='0px';el.style.height=calcMatchParentSize(css[0],css[2]);
  }
}

function beginMarginDialog(){
  var el=selected();if(!el||!originalOpenSpacing)return;
  originalOpenSpacing('margin');
  session={el:el};
}

function saveMargin(){
  if(!session||!session.el)return;
  var el=session.el;
  var unit=document.getElementById('bwNumUnit');
  var all=document.getElementById('bwNumAllSides');
  if(!unit||!all)return;
  var u=unit.value||'px',useAll=all.checked;
  var values;
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

  var css=values.map(function(v){return cssValue(v,u);});
  applyVisualMargins(el,css);

  session=null;
  refresh(el);
  if(window.BrotwareNumericDialogs&&BrotwareNumericDialogs.close)BrotwareNumericDialogs.close();
  if(typeof toast==='function')toast('Margin aplicada');
}

function install(){
  if(installed)return;
  var api=window.BrotwareNumericDialogs;if(!api||typeof api.openSpacing!=='function'){setTimeout(install,80);return;}
  installed=true;
  originalOpenSpacing=api.openSpacing.bind(api);

  api.openSpacing=function(kind){
    if(kind==='margin'){beginMarginDialog();return;}
    return originalOpenSpacing(kind);
  };

  /* Window capture runs before the older document capture handlers. */
  window.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('[data-mprops-action="margin"],[data-mquick-action="margin"]'):null;
    if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();
    beginMarginDialog();
  },true);

  document.addEventListener('click',function(e){
    if(!session)return;
    var save=e.target&&e.target.closest?e.target.closest('#bwNumSave'):null;
    if(!save)return;
    e.preventDefault();e.stopImmediatePropagation();
    saveMargin();
  },true);

  /* Size dialog sets match_parent back to raw 100%. Reapply existing margins
     immediately afterwards so Width/Height and Margin stay compatible. */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('#bwSizeSelect'):null;if(!b)return;
    var el=selected();setTimeout(function(){if(el){reapplyMatchParent(el);refresh(el);}},30);
  },true);

  var back=document.getElementById('bwNumericDialog');
  if(back){
    new MutationObserver(function(){if(!back.classList.contains('show'))session=null;}).observe(back,{attributes:true,attributeFilter:['class']});
  }
}

setTimeout(install,0);setTimeout(install,300);setTimeout(install,900);
window.BrotwareAbsoluteMarginFix={
  apply:function(){beginMarginDialog();},
  reapply:reapplyMatchParent,
  applyVisualMargins:applyVisualMargins
};
})();
