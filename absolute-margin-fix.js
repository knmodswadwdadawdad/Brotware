(function(){
'use strict';

var session=null;
var installed=false;
var originalOpenSpacing=null;

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function n(v){var x=parseFloat(v);return isNaN(x)?0:x;}
function round(v){return Math.round(v*100)/100;}
function cssValue(v,unit){var x=n(v);return round(x)+(unit||'px');}
function currentPx(el,side){
  try{return n(getComputedStyle(el)['margin'+side]);}catch(e){return 0;}
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

  /* Keep the real CSS margins for export/properties. On Brotware's free canvas
     every .vf-node is absolutely positioned, so right/bottom margins do not
     move the border box by themselves. We compensate those two axes in left/top. */
  el.style.margin=values.map(function(v){return cssValue(v,u);}).join(' ');

  var newRight=currentPx(el,'Right');
  var newBottom=currentPx(el,'Bottom');
  var oldRight=n(el.dataset.bwMarginRightComp||0);
  var oldBottom=n(el.dataset.bwMarginBottomComp||0);
  var left=n(el.style.left),top=n(el.style.top);

  el.style.left=round(left-(newRight-oldRight))+'px';
  el.style.top=round(top-(newBottom-oldBottom))+'px';
  el.dataset.bwMarginRightComp=String(round(newRight));
  el.dataset.bwMarginBottomComp=String(round(newBottom));

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

  var back=document.getElementById('bwNumericDialog');
  if(back){
    new MutationObserver(function(){if(!back.classList.contains('show'))session=null;}).observe(back,{attributes:true,attributeFilter:['class']});
  }
}

setTimeout(install,0);setTimeout(install,300);setTimeout(install,900);
window.BrotwareAbsoluteMarginFix={apply:function(){beginMarginDialog();}};
})();
