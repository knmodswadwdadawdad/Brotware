(function(){
'use strict';

var mq=window.matchMedia('(min-width:761px)');
var oldBeginMove=window.beginMove;
var oldBeginResize=window.beginResize;
var oldMoveInto=window.moveInto;
var oldStartPaletteDrag=window.startPaletteDrag;

function active(){return mq.matches;}
function validScale(v){return isFinite(v)&&v>0.05?v:1;}
function scaleOf(el){
  if(!el)return{x:1,y:1};
  var r=el.getBoundingClientRect();
  var ow=el.offsetWidth||el.clientWidth||r.width||1;
  var oh=el.offsetHeight||el.clientHeight||r.height||1;
  return{x:validScale(r.width/ow),y:validScale(r.height/oh)};
}
function localPoint(container,clientX,clientY){
  var r=container.getBoundingClientRect(),s=scaleOf(container);
  return{x:(clientX-r.left)/s.x,y:(clientY-r.top)/s.y,scale:s,rect:r};
}
function removeDropTargets(){
  document.querySelectorAll('.drop-target').forEach(function(n){n.classList.remove('drop-target');});
}
function isHit(el,x,y){
  if(typeof hit==='function')return hit(el,x,y);
  if(!el)return false;var r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}
function dropParentAt(x,y,el){
  var q=typeof findContainer==='function'?findContainer(x,y,el):null;
  if(q)return q;
  if(typeof root!=='undefined'&&root&&isHit(root,x,y))return root;
  return null;
}
function reparentAtPointer(el,target,clientX,clientY,grabX,grabY){
  if(!el||!target||el===target||el.contains(target))return;
  var p=localPoint(target,clientX,clientY);
  target.appendChild(el);
  var maxX=Math.max(0,(target.clientWidth||target.offsetWidth||0)-el.offsetWidth);
  var maxY=Math.max(0,(target.clientHeight||target.offsetHeight||0)-el.offsetHeight);
  var nx=p.x-grabX,ny=p.y-grabY;
  // Keep the full widget reachable while preserving the pointer's grab offset.
  nx=Math.max(0,Math.min(maxX||nx,nx));
  ny=Math.max(0,Math.min(maxY||ny,ny));
  el.style.left=(typeof snap==='function'?snap(nx):Math.round(nx))+'px';
  el.style.top=(typeof snap==='function'?snap(ny):Math.round(ny))+'px';
}

window.beginMove=function(e,el){
  if(!active())return oldBeginMove&&oldBeginMove.apply(this,arguments);
  if(!el)return;
  var sx=e.clientX,sy=e.clientY,l=parseFloat(el.style.left)||0,t=parseFloat(el.style.top)||0;
  var er=el.getBoundingClientRect(),es=scaleOf(el);
  var grabX=(e.clientX-er.left)/es.x,grabY=(e.clientY-er.top)/es.y;
  var startParent=el.parentElement;
  if(typeof deleteZone!=='undefined'&&deleteZone)deleteZone.classList.add('show');

  function mv(ev){
    var dx=(ev.clientX-sx)/es.x,dy=(ev.clientY-sy)/es.y;
    el.style.left=(typeof snap==='function'?snap(l+dx):Math.round(l+dx))+'px';
    el.style.top=(typeof snap==='function'?snap(t+dy):Math.round(t+dy))+'px';
    if(typeof deleteZone!=='undefined'&&deleteZone){
      deleteZone.classList.toggle('hot',isHit(deleteZone,ev.clientX,ev.clientY));
    }
    removeDropTargets();
    var target=typeof findContainer==='function'?findContainer(ev.clientX,ev.clientY,el):null;
    if(target&&target!==el.parentElement)target.classList.add('drop-target');
  }
  function up(ev){
    window.removeEventListener('pointermove',mv);
    window.removeEventListener('pointerup',up);
    window.removeEventListener('pointercancel',up);
    if(typeof deleteZone!=='undefined'&&deleteZone)deleteZone.classList.remove('show','hot');
    removeDropTargets();
    if(typeof deleteZone!=='undefined'&&deleteZone&&isHit(deleteZone,ev.clientX,ev.clientY)){
      if(typeof deleteSelected==='function')deleteSelected(false);
      return;
    }
    var target=dropParentAt(ev.clientX,ev.clientY,el);
    // Critical fix: dropping inside the current parent must NOT recalculate left/top.
    if(target&&target!==el.parentElement){
      reparentAtPointer(el,target,ev.clientX,ev.clientY,grabX,grabY);
    }
    if(typeof commit==='function')commit();
  }
  window.addEventListener('pointermove',mv);
  window.addEventListener('pointerup',up);
  window.addEventListener('pointercancel',up);
};

window.beginResize=function(e,el,dir){
  if(!active())return oldBeginResize&&oldBeginResize.apply(this,arguments);
  var sx=e.clientX,sy=e.clientY,x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0,w=el.offsetWidth,h=el.offsetHeight,s=scaleOf(el);
  function mv(ev){
    var dx=(ev.clientX-sx)/s.x,dy=(ev.clientY-sy)/s.y,nx=x,ny=y,nw=w,nh=h;
    if(dir.indexOf('e')>=0)nw=Math.max(24,typeof snap==='function'?snap(w+dx):Math.round(w+dx));
    if(dir.indexOf('s')>=0)nh=Math.max(20,typeof snap==='function'?snap(h+dy):Math.round(h+dy));
    if(dir.indexOf('w')>=0){nw=Math.max(24,typeof snap==='function'?snap(w-dx):Math.round(w-dx));nx=typeof snap==='function'?snap(x+dx):Math.round(x+dx);}
    if(dir.indexOf('n')>=0){nh=Math.max(20,typeof snap==='function'?snap(h-dy):Math.round(h-dy));ny=typeof snap==='function'?snap(y+dy):Math.round(y+dy);}
    el.style.left=nx+'px';el.style.top=ny+'px';el.style.width=nw+'px';el.style.height=nh+'px';
  }
  function up(){window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(typeof commit==='function')commit();}
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
};

window.moveInto=function(el,target,x,y){
  if(!active())return oldMoveInto&&oldMoveInto.apply(this,arguments);
  if(!el||!target||el===target||el.contains(target))return;
  // If it already belongs to this container, keep the position reached during drag.
  if(el.parentElement===target)return;
  var er=el.getBoundingClientRect(),es=scaleOf(el);
  var grabX=el.offsetWidth/2,grabY=el.offsetHeight/2;
  if(typeof x==='number'&&typeof y==='number'){
    // Legacy callers only provide the pointer, so center is the safest fallback.
    reparentAtPointer(el,target,x,y,grabX,grabY);
  }
};

window.startPaletteDrag=function(e,type){
  if(!active())return oldStartPaletteDrag&&oldStartPaletteDrag.apply(this,arguments);
  e.preventDefault();
  if(typeof dragGhost==='undefined'||!dragGhost)return;
  dragGhost.style.display='flex';dragGhost.textContent=type;dragGhost.style.left=e.clientX+10+'px';dragGhost.style.top=e.clientY+10+'px';
  function mv(ev){
    dragGhost.style.left=ev.clientX+10+'px';dragGhost.style.top=ev.clientY+10+'px';
    if(typeof viewPane!=='undefined'&&viewPane)dragGhost.style.borderColor=isHit(viewPane,ev.clientX,ev.clientY)?'#67d4a8':'#8ac9fb';
    removeDropTargets();var q=typeof findContainer==='function'?findContainer(ev.clientX,ev.clientY,null):null;if(q)q.classList.add('drop-target');
  }
  function up(ev){
    window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);dragGhost.style.display='none';removeDropTargets();
    if(typeof viewPane==='undefined'||!viewPane||!isHit(viewPane,ev.clientX,ev.clientY))return;
    if(typeof state!=='undefined'){state.ignorePaletteClick=true;setTimeout(function(){state.ignorePaletteClick=false;},0);}
    var q=typeof findContainer==='function'?findContainer(ev.clientX,ev.clientY,null):null,parent=q||(typeof root!=='undefined'?root:null);if(!parent||typeof createNode!=='function')return;
    var p=localPoint(parent,ev.clientX,ev.clientY),size=typeof defaultSize==='function'?defaultSize(type):[90,40];
    createNode(type,p.x-size[0]/2,p.y-size[1]/2,parent);
  }
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
};

window.BrotwareDesktopDragFix={scaleOf:scaleOf,localPoint:localPoint};
})();
