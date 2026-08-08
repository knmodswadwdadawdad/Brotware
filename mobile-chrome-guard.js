(function(){
'use strict';
var mq=window.matchMedia('(max-width:760px)');
var timer=null;
function setHidden(el,hidden){
  if(!el)return;
  if(hidden)el.style.setProperty('display','none','important');
  else el.style.removeProperty('display');
}
function sync(){
  var mobile=mq.matches;
  var desktopTools=document.getElementById('bwDesktopTopTools');
  setHidden(desktopTools,mobile);
  document.querySelectorAll('.designer-toolbar').forEach(function(el){setHidden(el,mobile&&document.body.classList.contains('bw-mobile-v2'));});
  if(mobile&&document.body.classList.contains('bw-mobile-v2')){
    var top=document.getElementById('bwMobileTopbar');
    if(top){top.style.removeProperty('display');}
  }
}
function schedule(){clearTimeout(timer);timer=setTimeout(sync,30);}
if(mq.addEventListener)mq.addEventListener('change',schedule);else mq.addListener(schedule);
window.addEventListener('resize',schedule);
window.addEventListener('orientationchange',schedule);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
setTimeout(sync,0);setTimeout(sync,350);setTimeout(sync,1200);
window.BrotwareMobileChromeGuard={refresh:sync};
})();