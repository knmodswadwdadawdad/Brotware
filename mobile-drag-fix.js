(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
if(!mq.matches)return;

var activeCleanup=null;

function scaleFor(el){
  if(!el)return{x:1,y:1};
  var r=el.getBoundingClientRect();
  return{
    x:(el.offsetWidth&&r.width)?r.width/el.offsetWidth:1,
    y:(el.offsetHeight&&r.height)?r.height/el.offsetHeight:1
  };
}
function localPoint(el,cx,cy){
  var r=el.getBoundingClientRect(),s=scaleFor(el);
  return{x:(cx-r.left)/(s.x||1),y:(cy-r.top)/(s.y||1)};
}
function clearDropUi(){
  document.body.classList.remove('vf-widget-dragging');
  var dz=(typeof deleteZone!=='undefined'&&deleteZone)?deleteZone:document.getElementById('deleteZone');
  if(dz)dz.classList.remove('show','hot');
  document.querySelectorAll('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
  var ghost=(typeof dragGhost!=='undefined'&&dragGhost)?dragGhost:document.getElementById('dragGhost');
  if(ghost)ghost.style.display='none';
}
function hardCleanupSoon(){
  clearDropUi();
  setTimeout(clearDropUi,40);
  setTimeout(clearDropUi,180);
}
function cancelActive(){
  if(activeCleanup){var fn=activeCleanup;activeCleanup=null;try{fn(true);}catch(e){}}
  hardCleanupSoon();
}
window.addEventListener('blur',cancelActive);
document.addEventListener('visibilitychange',function(){if(document.hidden)cancelActive();});

/* Existing widget drag: one owner for start/end state. */
window.beginMove=function(e,el){
  cancelActive();
  var pointerId=e.pointerId;
  var startX=e.clientX,startY=e.clientY;
  var left=parseFloat(el.style.left)||0,top=parseFloat(el.style.top)||0;
  var parent=el.parentElement||root;
  var ps=scaleFor(parent);
  var moved=false,finished=false;
  try{el.setPointerCapture(pointerId);}catch(err){}

  function move(ev){
    if(ev.pointerId!==pointerId)return;
    var dx=(ev.clientX-startX)/(ps.x||1),dy=(ev.clientY-startY)/(ps.y||1);
    if(!moved&&Math.hypot(ev.clientX-startX,ev.clientY-startY)>5){
      moved=true;
      document.body.classList.add('vf-widget-dragging');
      deleteZone.classList.add('show');
    }
    if(!moved)return;
    ev.preventDefault();
    el.style.left=snap(left+dx)+'px';
    el.style.top=snap(top+dy)+'px';
    deleteZone.classList.toggle('hot',hit(deleteZone,ev.clientX,ev.clientY));
    document.querySelectorAll('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    var target=findContainer(ev.clientX,ev.clientY,el);
    if(target)target.classList.add('drop-target');
  }
  function finish(ev,cancelled){
    if(finished)return;finished=true;
    window.removeEventListener('pointermove',move,true);
    window.removeEventListener('pointerup',up,true);
    window.removeEventListener('pointercancel',pc,true);
    el.removeEventListener('lostpointercapture',lost,true);

    /* Check before hiding the target, otherwise display:none makes hit() false. */
    var overDelete=!cancelled&&moved&&hit(deleteZone,ev.clientX,ev.clientY);
    var target=!cancelled&&moved&&!overDelete?findContainer(ev.clientX,ev.clientY,el):null;

    try{el.releasePointerCapture(pointerId);}catch(err){}
    activeCleanup=null;
    hardCleanupSoon();

    if(cancelled||!moved)return;
    if(overDelete){deleteSelected(false);return;}
    if(target)moveIntoScaled(el,target,ev.clientX,ev.clientY);
    commit();
  }
  function up(ev){if(ev.pointerId===pointerId)finish(ev,false);}
  function pc(ev){if(ev.pointerId===pointerId)finish(ev,true);}
  function lost(ev){if(!finished)finish({pointerId:pointerId,clientX:startX,clientY:startY},true);}

  activeCleanup=function(){finish({pointerId:pointerId,clientX:startX,clientY:startY},true);};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',up,true);
  window.addEventListener('pointercancel',pc,true);
  el.addEventListener('lostpointercapture',lost,true);
};

window.moveIntoScaled=function(el,target,cx,cy){
  if(el===target||el.contains(target))return;
  var p=localPoint(target,cx,cy);
  target.appendChild(el);
  el.style.left=Math.max(0,snap(p.x-el.offsetWidth/2))+'px';
  el.style.top=Math.max(24,snap(p.y-el.offsetHeight/2))+'px';
};
window.moveInto=window.moveIntoScaled;

window.beginResize=function(e,el,dir){
  cancelActive();
  var pointerId=e.pointerId,parent=el.parentElement||root,ps=scaleFor(parent);
  var sx=e.clientX,sy=e.clientY,x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0,w=el.offsetWidth,h=el.offsetHeight,finished=false;
  try{el.setPointerCapture(pointerId);}catch(err){}
  function move(ev){
    if(ev.pointerId!==pointerId)return;ev.preventDefault();
    var dx=(ev.clientX-sx)/(ps.x||1),dy=(ev.clientY-sy)/(ps.y||1),nx=x,ny=y,nw=w,nh=h;
    if(dir.indexOf('e')>=0)nw=Math.max(24,snap(w+dx));
    if(dir.indexOf('s')>=0)nh=Math.max(20,snap(h+dy));
    if(dir.indexOf('w')>=0){nw=Math.max(24,snap(w-dx));nx=snap(x+dx);}
    if(dir.indexOf('n')>=0){nh=Math.max(20,snap(h-dy));ny=snap(y+dy);}
    el.style.left=nx+'px';el.style.top=ny+'px';el.style.width=nw+'px';el.style.height=nh+'px';
  }
  function finish(cancelled){
    if(finished)return;finished=true;
    window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',pc,true);
    try{el.releasePointerCapture(pointerId);}catch(err){}
    activeCleanup=null;hardCleanupSoon();if(!cancelled)commit();
  }
  function up(ev){if(ev.pointerId===pointerId)finish(false);}function pc(ev){if(ev.pointerId===pointerId)finish(true);}
  activeCleanup=function(){finish(true);};
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',pc,true);
};

/* Real touch drag from the Widgets drawer to the canvas. */
window.startPaletteDrag=function(e,type){
  cancelActive();
  var pointerId=e.pointerId,startX=e.clientX,startY=e.clientY,moved=false,finished=false,source=e.currentTarget||e.target;
  e.preventDefault();e.stopPropagation();
  try{source.setPointerCapture(pointerId);}catch(err){}
  dragGhost.style.display='flex';dragGhost.textContent=type;dragGhost.style.left=(e.clientX+12)+'px';dragGhost.style.top=(e.clientY+12)+'px';

  function move(ev){
    if(ev.pointerId!==pointerId)return;ev.preventDefault();
    if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>4)moved=true;
    dragGhost.style.left=(ev.clientX+12)+'px';dragGhost.style.top=(ev.clientY+12)+'px';
    var inside=hit(viewPane,ev.clientX,ev.clientY);
    dragGhost.style.borderColor=inside?'#67d4a8':'#8ac9fb';
    document.querySelectorAll('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    var target=findContainer(ev.clientX,ev.clientY,null);if(target)target.classList.add('drop-target');
  }
  function finish(ev,cancelled){
    if(finished)return;finished=true;
    window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',pc,true);
    try{source.releasePointerCapture(pointerId);}catch(err){}
    activeCleanup=null;hardCleanupSoon();
    if(cancelled)return;
    if(moved&&hit(viewPane,ev.clientX,ev.clientY)){
      state.ignorePaletteClick=true;setTimeout(function(){state.ignorePaletteClick=false;},80);
      var target=findContainer(ev.clientX,ev.clientY,null),parent=target||root,p=localPoint(parent,ev.clientX,ev.clientY),size=defaultSize(type);
      createNode(type,p.x-size[0]/2,p.y-size[1]/2,parent);
      document.body.classList.remove('mobile-palette-open');
    }
  }
  function up(ev){if(ev.pointerId===pointerId)finish(ev,false);}function pc(ev){if(ev.pointerId===pointerId)finish(ev,true);}
  activeCleanup=function(){finish({pointerId:pointerId,clientX:startX,clientY:startY},true);};
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',pc,true);
};

function bindTouchPalette(){
  document.querySelectorAll('.palette-item[data-create]').forEach(function(item){
    if(item.dataset.mobileDragBound==='1')return;
    item.dataset.mobileDragBound='1';
    item.style.touchAction='none';
    item.addEventListener('pointerdown',function(e){
      if(!mq.matches||e.pointerType==='mouse')return;
      startPaletteDrag(e,this.dataset.create);
    },{passive:false});
  });
}

function ensureDrawer(){
  var palette=document.querySelector('.palette'),btn=document.getElementById('mobilePaletteBtn');
  if(!palette)return;
  if(btn){
    btn.textContent='☰ Widgets';
    if(btn.dataset.robustToggle!=='1'){
      btn.dataset.robustToggle='1';
      btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();document.body.classList.toggle('mobile-palette-open');});
    }
  }
  var backdrop=document.getElementById('mobilePaletteBackdrop');
  if(!backdrop){
    backdrop=document.createElement('div');backdrop.id='mobilePaletteBackdrop';backdrop.className='mobile-palette-backdrop';document.body.appendChild(backdrop);
    backdrop.addEventListener('pointerdown',function(){document.body.classList.remove('mobile-palette-open');});
  }
  bindTouchPalette();
}

/* Belt-and-suspenders cleanup for browsers that lose pointer capture on touch. */
function endAnyDragSoon(){setTimeout(hardCleanupSoon,0);}
document.addEventListener('pointerup',endAnyDragSoon,true);
document.addEventListener('pointercancel',endAnyDragSoon,true);
document.addEventListener('touchend',endAnyDragSoon,true);
document.addEventListener('touchcancel',endAnyDragSoon,true);
document.addEventListener('mouseup',endAnyDragSoon,true);
document.addEventListener('dragend',endAnyDragSoon,true);
document.addEventListener('click',function(e){
  if(!e.target.closest('.vf-node')&&!e.target.closest('.resize-handle'))hardCleanupSoon();
},true);
document.querySelectorAll('.tab[data-tab]').forEach(function(t){t.addEventListener('click',hardCleanupSoon,true);});

setTimeout(ensureDrawer,0);setTimeout(ensureDrawer,250);setTimeout(ensureDrawer,900);
hardCleanupSoon();
})();
