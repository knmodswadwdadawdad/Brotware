(function(){
'use strict';

function eventLabel(root){
  if(!root)return'';
  var parts=[];
  Array.prototype.forEach.call(root.childNodes,function(n){
    if(n.nodeType===1&&n.tagName&&n.tagName.toLowerCase()==='small')return;
    if(n.nodeType===3)parts.push(n.nodeValue||'');
    else if(n.nodeType===1)parts.push(n.textContent||'');
  });
  var label=parts.join(' ').replace(/\s+/g,' ').replace(/^‹›\s*/,'').trim();
  if(!label)label=String(root.dataset.sw3EventLabel||'Evento');
  if(/^(?:@?page\s*→\s*load|oncreate|on\s+activity\s+create)$/i.test(label))label='On activity create';
  return label;
}
function compactEvent(root){
  if(!root)return;
  var small=root.querySelector('small');if(small)small.style.display='none';
  var label=eventLabel(root);
  if(label&&root.dataset.sw3EventLabel!==label){
    root.dataset.sw3EventLabel=label;
    root.textContent=label;
  }
}

function measureControl(el){
  if(!el||!el.classList.contains('sw-v2-control'))return;
  var main=el.querySelector(':scope > .sw-control-wrap > .sw-block-main');
  if(!main)return;

  var oldW=main.style.width;
  main.style.width='max-content';
  var r=main.getBoundingClientRect();
  main.style.width=oldW;

  var width=Math.ceil(r.width||0);
  if(!width)return;

  /* The C shell follows only its own header; children may extend right. */
  width=Math.max(136,Math.min(width,420));
  var px=width+'px';
  if(el.style.getPropertyValue('--sw3-control-w')!==px)el.style.setProperty('--sw3-control-w',px);
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