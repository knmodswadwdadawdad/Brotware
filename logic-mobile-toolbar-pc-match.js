(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
var overlay=null,obs=null;
var EVENT_LABELS={load:'onCreate',imports:'Import',initializeLogic:'initializeLogic',activityResult:'onActivityResult',back:'onBackPressed',postcreate:'onPostCreate',start:'onStart',resume:'onResume',pause:'onPause',stop:'onStop',destroy:'onDestroy',saveInstanceState:'onSaveInstanceState',restoreInstanceState:'onRestoreInstanceState',newIntent:'onNewIntent',windowFocusChanged:'onWindowFocusChanged',click:'onClick',longclick:'onLongClick',dblclick:'onDoubleClick',input:'onInput',change:'onChange',focus:'onFocus',blur:'onBlur',keydown:'onKeyDown',keyup:'onKeyUp',mouseenter:'onMouseEnter',mouseleave:'onMouseLeave',submit:'onSubmit'};

function icon(n){return'<span class="bw-google-icon">'+n+'</span>';}
function currentNode(){try{return typeof currentEventNode==='function'?currentEventNode():'@page';}catch(_){return'@page';}}
function currentType(){try{return typeof currentEventType==='function'?currentEventType():'load';}catch(_){return'load';}}
function logicShown(){return !!(overlay&&overlay.classList.contains('show'));}

function decorate(){
  if(!overlay)return;
  var map={swLogicBack:'arrow_back',swLogicCode:'code',swLogicUndo:'undo',swLogicRedo:'redo',swLogicBookmark:'bookmark_border'};
  Object.keys(map).forEach(function(id){
    var b=document.getElementById(id);if(!b)return;
    if(!b.querySelector('.bw-google-icon'))b.innerHTML=icon(map[id]);
  });
}

function refreshTitle(){
  if(!logicShown())return;
  var title=document.getElementById('swLogicTitle'),sub=document.getElementById('swLogicDesc');
  if(!title||!sub)return;
  try{
    if(typeof state!=='undefined'&&state.logicMode==='function'){
      var f=(state.functions||[]).find(function(x){return x.id===state.activeFunctionId;});
      title.textContent=f?f.name:'MoreBlock';sub.textContent='MoreBlock';return;
    }
  }catch(_){}
  var n=currentNode(),t=currentType();
  title.textContent=n==='@page'?'Activity':n;
  sub.textContent=EVENT_LABELS[t]||t;
}

function setGlobalChromeHidden(hidden){
  ['bwMobileTopbar','bwMobileBottomNav','bwMobileSelection'].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    if(hidden){el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');}
    else{el.style.removeProperty('display');el.style.removeProperty('visibility');}
  });
}

function sync(){
  overlay=document.getElementById('swLogicOverlay');if(!overlay)return;
  var open=logicShown();
  if(open){
    document.body.classList.add('sw-logic-open');
    if(mq.matches)setGlobalChromeHidden(true);
    decorate();refreshTitle();
  }else{
    /* Do not remove another module's class unless the overlay is truly closed. */
    document.body.classList.remove('sw-logic-open');
    if(mq.matches)setGlobalChromeHidden(false);
  }
}

function install(){
  overlay=document.getElementById('swLogicOverlay');
  if(!overlay){setTimeout(install,120);return;}
  decorate();sync();
  if(obs)return;
  obs=new MutationObserver(function(){requestAnimationFrame(sync);});
  obs.observe(overlay,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  window.addEventListener('resize',sync);
  window.addEventListener('orientationchange',sync);
  window.addEventListener('brotware:logic-refresh',function(){requestAnimationFrame(sync);});
  document.addEventListener('click',function(e){
    if(!logicShown())return;
    if(e.target&&e.target.closest&&e.target.closest('#swLogicOverlay'))setTimeout(sync,0);
  },true);
}

setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
window.BrotwareLogicMobileToolbarMatch={refresh:sync};
})();
