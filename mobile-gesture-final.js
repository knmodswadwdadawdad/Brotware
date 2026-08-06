(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
if(!mq.matches)return;

var HOLD_MS=260;
var MOVE_SLOP=8;
var currentGesture=null;

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
function cleanupDragUi(){
  document.body.classList.remove('vf-widget-dragging');
  var dz=document.getElementById('deleteZone');
  if(dz)dz.classList.remove('show','hot');
  var ghost=document.getElementById('dragGhost');
  if(ghost)ghost.style.display='none';
  document.querySelectorAll('.drop-target').forEach(function(n){n.classList.remove('drop-target');});
}
function clearGesture(){
  if(currentGesture&&typeof currentGesture.cancel==='function'){
    var g=currentGesture;currentGesture=null;try{g.cancel();}catch(e){}
  }
  cleanupDragUi();
}
function capture(el,pid){try{el.setPointerCapture(pid);}catch(e){}}
function release(el,pid){try{el.releasePointerCapture(pid);}catch(e){}}

/* Preserve the exact point where the finger grabbed the widget when changing parent layouts. */
function placeKeepingGrabPoint(el,parent,cx,cy,grabScreenX,grabScreenY){
  if(!el||!parent)return;
  var p=localPoint(parent,cx,cy);
  var ps=scaleFor(parent);
  var gx=grabScreenX/(ps.x||1);
  var gy=grabScreenY/(ps.y||1);
  parent.appendChild(el);
  el.style.left=Math.max(0,snap(p.x-gx))+'px';
  el.style.top=Math.max(0,snap(p.y-gy))+'px';
}

/*
 * Mobile existing-widget gesture:
 * - quick swipe = pan designer canvas
 * - tap = selection only (handled by core bindNode)
 * - hold = start widget drag, Sketchware-style
 */
window.beginMove=function(e,el){
  clearGesture();

  var pid=e.pointerId;
  var sx=e.clientX,sy=e.clientY;
  var startRect=el.getBoundingClientRect();
  var grabScreenX=sx-startRect.left;
  var grabScreenY=sy-startRect.top;
  var left=parseFloat(el.style.left)||0,top=parseFloat(el.style.top)||0;
  var parent=el.parentElement||root;
  var ps=scaleFor(parent);
  var scroller=document.getElementById('designerCanvas');
  var scrollLeft=scroller?scroller.scrollLeft:0;
  var scrollTop=scroller?scroller.scrollTop:0;
  var dragging=false,panning=false,finished=false;
  var lastX=sx,lastY=sy;

  var hold=setTimeout(function(){
    if(finished||panning)return;
    dragging=true;
    capture(el,pid);
    document.body.classList.add('vf-widget-dragging');
    var dz=document.getElementById('deleteZone');
    if(dz)dz.classList.add('show');
    if(navigator.vibrate){try{navigator.vibrate(18);}catch(err){}}
  },HOLD_MS);

  function move(ev){
    if(ev.pointerId!==pid||finished)return;
    lastX=ev.clientX;lastY=ev.clientY;
    var rawDx=ev.clientX-sx,rawDy=ev.clientY-sy;
    var dist=Math.hypot(rawDx,rawDy);

    if(!dragging&&!panning&&dist>MOVE_SLOP){
      clearTimeout(hold);
      panning=true;
      capture(el,pid);
      cleanupDragUi();
    }

    if(panning){
      ev.preventDefault();
      if(scroller){
        scroller.scrollLeft=scrollLeft-rawDx;
        scroller.scrollTop=scrollTop-rawDy;
      }
      return;
    }

    if(!dragging)return;
    ev.preventDefault();
    var dx=rawDx/(ps.x||1),dy=rawDy/(ps.y||1);
    el.style.left=snap(left+dx)+'px';
    el.style.top=snap(top+dy)+'px';

    var dz=document.getElementById('deleteZone');
    if(dz)dz.classList.toggle('hot',hit(dz,ev.clientX,ev.clientY));
    document.querySelectorAll('.drop-target').forEach(function(n){n.classList.remove('drop-target');});
    var target=findContainer(ev.clientX,ev.clientY,el);
    if(target)target.classList.add('drop-target');
  }

  function finish(ev,cancelled){
    if(finished)return;finished=true;
    clearTimeout(hold);
    window.removeEventListener('pointermove',move,true);
    window.removeEventListener('pointerup',up,true);
    window.removeEventListener('pointercancel',cancel,true);
    el.removeEventListener('lostpointercapture',lost,true);

    var cx=ev&&typeof ev.clientX==='number'?ev.clientX:lastX;
    var cy=ev&&typeof ev.clientY==='number'?ev.clientY:lastY;
    var dz=document.getElementById('deleteZone');
    var overDelete=!cancelled&&dragging&&dz&&hit(dz,cx,cy);
    var target=!cancelled&&dragging&&!overDelete?findContainer(cx,cy,el):null;
    var currentParent=el.parentElement||root;
    var insidePage=!cancelled&&dragging&&typeof viewPane!=='undefined'&&viewPane&&hit(viewPane,cx,cy);
    var dropParent=target||(insidePage?root:currentParent);

    release(el,pid);
    cleanupDragUi();
    if(currentGesture&&currentGesture.pid===pid)currentGesture=null;

    if(cancelled||!dragging)return;
    if(overDelete){deleteSelected(false);return;}

    /* If the widget stays in the same layout, keep the exact coordinates already reached during move(). */
    if(dropParent&&dropParent!==currentParent){
      placeKeepingGrabPoint(el,dropParent,cx,cy,grabScreenX,grabScreenY);
    }
    commit();
  }
  function up(ev){if(ev.pointerId===pid)finish(ev,false);}
  function cancel(ev){if(ev.pointerId===pid)finish(ev,true);}
  function lost(){if(!finished)finish({clientX:lastX,clientY:lastY},true);}

  currentGesture={pid:pid,cancel:function(){finish({clientX:lastX,clientY:lastY},true);}};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',up,true);
  window.addEventListener('pointercancel',cancel,true);
  el.addEventListener('lostpointercapture',lost,true);
};

/*
 * Widgets drawer:
 * - swipe = scroll palette
 * - tap = keep original click-to-add behavior
 * - hold = drag widget into canvas
 */
window.startPaletteDrag=function(e,type){
  clearGesture();

  var source=e.currentTarget||e.target;
  var pid=e.pointerId,sx=e.clientX,sy=e.clientY;
  var lastX=sx,lastY=sy;
  var scroller=source.closest('.palette-scroll');
  var startScroll=scroller?scroller.scrollTop:0;
  var dragging=false,panning=false,finished=false;
  e.stopPropagation();

  var hold=setTimeout(function(){
    if(finished||panning)return;
    dragging=true;
    state.ignorePaletteClick=true;
    capture(source,pid);
    var ghost=document.getElementById('dragGhost');
    if(ghost){
      ghost.style.display='flex';ghost.textContent=type;
      ghost.style.left=(sx+12)+'px';ghost.style.top=(sy+12)+'px';
    }
    if(navigator.vibrate){try{navigator.vibrate(18);}catch(err){}}
  },HOLD_MS);

  function move(ev){
    if(ev.pointerId!==pid||finished)return;
    lastX=ev.clientX;lastY=ev.clientY;
    var dx=ev.clientX-sx,dy=ev.clientY-sy;
    var dist=Math.hypot(dx,dy);

    if(!dragging&&!panning&&dist>MOVE_SLOP){
      clearTimeout(hold);
      panning=true;
      state.ignorePaletteClick=true;
      capture(source,pid);
      cleanupDragUi();
    }

    if(panning){
      ev.preventDefault();
      if(scroller)scroller.scrollTop=startScroll-dy;
      return;
    }

    if(!dragging)return;
    ev.preventDefault();
    var ghost=document.getElementById('dragGhost');
    if(ghost){
      ghost.style.left=(ev.clientX+12)+'px';ghost.style.top=(ev.clientY+12)+'px';
      ghost.style.borderColor=hit(viewPane,ev.clientX,ev.clientY)?'#67d4a8':'#8ac9fb';
    }
    document.querySelectorAll('.drop-target').forEach(function(n){n.classList.remove('drop-target');});
    var target=findContainer(ev.clientX,ev.clientY,null);
    if(target)target.classList.add('drop-target');
  }

  function finish(ev,cancelled){
    if(finished)return;finished=true;
    clearTimeout(hold);
    window.removeEventListener('pointermove',move,true);
    window.removeEventListener('pointerup',up,true);
    window.removeEventListener('pointercancel',cancel,true);
    source.removeEventListener('lostpointercapture',lost,true);

    var cx=ev&&typeof ev.clientX==='number'?ev.clientX:lastX;
    var cy=ev&&typeof ev.clientY==='number'?ev.clientY:lastY;
    release(source,pid);
    cleanupDragUi();
    if(currentGesture&&currentGesture.pid===pid)currentGesture=null;

    if(panning){
      setTimeout(function(){state.ignorePaletteClick=false;},120);
      return;
    }
    if(cancelled||!dragging){
      state.ignorePaletteClick=false;
      return;
    }

    if(hit(viewPane,cx,cy)){
      var target=findContainer(cx,cy,null),parent=target||root;
      var p=localPoint(parent,cx,cy),size=defaultSize(type);
      createNode(type,p.x-size[0]/2,p.y-size[1]/2,parent);
      document.body.classList.remove('mobile-palette-open');
    }
    setTimeout(function(){state.ignorePaletteClick=false;},140);
  }
  function up(ev){if(ev.pointerId===pid)finish(ev,false);}
  function cancel(ev){if(ev.pointerId===pid)finish(ev,true);}
  function lost(){if(!finished)finish({clientX:lastX,clientY:lastY},true);}

  currentGesture={pid:pid,cancel:function(){finish({clientX:lastX,clientY:lastY},true);}};
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',up,true);
  window.addEventListener('pointercancel',cancel,true);
  source.addEventListener('lostpointercapture',lost,true);
};

window.addEventListener('blur',clearGesture);
document.addEventListener('visibilitychange',function(){if(document.hidden)clearGesture();});
document.querySelectorAll('.tab[data-tab]').forEach(function(tab){tab.addEventListener('click',clearGesture,true);});
cleanupDragUi();
})();
