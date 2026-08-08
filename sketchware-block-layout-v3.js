(function(){
'use strict';

function compactEvent(root){
  if(!root)return;
  var text=String(root.textContent||'').replace(/\s+/g,' ').trim();
  var label='';
  if(/oncreate/i.test(text))label='On activity create';
  else{
    var small=root.querySelector('small');
    if(small)small.style.display='none';
    text=text.replace(/^‹›\s*/,'').trim();
    if(text){
      var parts=text.split(' ');
      label=parts[0]||text;
    }
  }
  if(label&&root.dataset.sw3EventLabel!==label){
    root.dataset.sw3EventLabel=label;
    root.textContent=label;
  }
}

function measureControl(el){
  if(!el||!el.classList.contains('sw-v2-control'))return;
  var main=el.querySelector(':scope > .sw-control-wrap > .sw-block-main');
  if(!main)return;

  /* Temporarily let the header find its natural content width. */
  var oldW=main.style.width;
  main.style.width='max-content';
  var r=main.getBoundingClientRect();
  main.style.width=oldW;

  var width=Math.ceil(r.width||0);
  if(!width)return;

  /* Sketchware keeps C blocks compact. Keep a small useful floor only. */
  width=Math.max(150,Math.min(width,360));
  var px=width+'px';
  if(el.style.getPropertyValue('--sw3-control-w')!==px){
    el.style.setProperty('--sw3-control-w',px);
  }
}

function decorate(){
  var ov=document.getElementById('swLogicOverlay');
  if(!ov)return;
  compactEvent(ov.querySelector('.sw-event-root'));
  ov.querySelectorAll('.sw-block.sw-v2-control[data-block-id]').forEach(measureControl);
}

function install(){
  var ov=document.getElementById('swLogicOverlay');
  if(!ov){setTimeout(install,180);return;}
  decorate();
  if(ov.dataset.swLayoutV3Observer==='1')return;
  ov.dataset.swLayoutV3Observer='1';

  var queued=false;
  new MutationObserver(function(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;decorate();});
  }).observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

  window.addEventListener('resize',decorate);
  window.addEventListener('brotware:logic-refresh',decorate);
}

window.BrotwareSketchwareLayoutV3={refresh:decorate};
setTimeout(install,0);
setTimeout(install,450);
setTimeout(install,1200);
})();
