(function(){
'use strict';

var layer=null,vLine=null,hLine=null,dot=null,measureLayer=null;
var gesture=null;
var THRESHOLD=6;
var LAYOUT_TYPES=['linear-h','linear-v','relative','card','scroll'];

function build(){
  if(layer)return;
  layer=document.createElement('div');
  layer.className='vf-align-guide-layer';
  layer.id='vfAlignGuideLayer';
  layer.innerHTML='<div class="vf-align-guide vertical" id="vfGuideV"></div><div class="vf-align-guide horizontal" id="vfGuideH"></div><div class="vf-align-guide-dot" id="vfGuideDot"></div><div class="vf-space-measure-layer" id="vfSpaceMeasureLayer"></div>';
  document.body.appendChild(layer);
  vLine=document.getElementById('vfGuideV');
  hLine=document.getElementById('vfGuideH');
  dot=document.getElementById('vfGuideDot');
  measureLayer=document.getElementById('vfSpaceMeasureLayer');
}

function clearMeasures(){if(measureLayer)measureLayer.innerHTML='';}
function hide(){
  if(vLine)vLine.classList.remove('show');
  if(hLine)hLine.classList.remove('show');
  if(dot)dot.classList.remove('show');
  clearMeasures();
}

function rectPoints(r){
  return {
    x:[
      {value:r.left,kind:'start'},
      {value:r.left+r.width/2,kind:'center'},
      {value:r.right,kind:'end'}
    ],
    y:[
      {value:r.top,kind:'start'},
      {value:r.top+r.height/2,kind:'center'},
      {value:r.bottom,kind:'end'}
    ]
  };
}

function validRect(r){return r&&r.width>0&&r.height>0&&isFinite(r.left)&&isFinite(r.top);}
function isLayoutNode(n){
  return !!(n&&n.classList&&n.classList.contains('vf-node')&&LAYOUT_TYPES.indexOf(n.dataset.type)>=0);
}

function layoutAtPoint(x,y,active){
  var best=null,area=Infinity;
  document.querySelectorAll('.vf-node').forEach(function(n){
    if(!isLayoutNode(n)||n===active||(active&&active.contains(n))||!n.isConnected)return;
    var r=n.getBoundingClientRect();
    if(!validRect(r))return;
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){
      var a=r.width*r.height;
      if(a<area){best=n;area=a;}
    }
  });
  return best;
}

function rootContainer(){
  return document.getElementById('rootLayout')||document.getElementById('viewPane');
}

function activeContainer(active,x,y){
  var hovered=(typeof x==='number'&&typeof y==='number')?layoutAtPoint(x,y,active):null;
  if(hovered)return hovered;
  return rootContainer();
}

function directNodeChildren(container,active){
  var out=[];
  if(!container)return out;
  Array.prototype.forEach.call(container.children||[],function(n){
    if(!n.classList||!n.classList.contains('vf-node'))return;
    if(n===active||(active&&active.contains(n))||!n.isConnected)return;
    var r=n.getBoundingClientRect();
    if(validRect(r))out.push({el:n,rect:r,type:'node'});
  });
  return out;
}

function candidates(active,container){
  var out=[];
  if(!container)return out;
  var cr=container.getBoundingClientRect();
  if(validRect(cr))out.push({el:container,rect:cr,type:'container'});
  return out.concat(directNodeChildren(container,active));
}

function bestMatch(activePoints,list,axis){
  var best=null;
  list.forEach(function(c){
    var cp=rectPoints(c.rect)[axis];
    activePoints.forEach(function(a){
      cp.forEach(function(b){
        var d=Math.abs(a.value-b.value);
        if(d>THRESHOLD)return;
        var semanticPenalty=a.kind===b.kind?0:1.25;
        var score=d+semanticPenalty;
        if(!best||score<best.score){best={score:score,value:b.value,a:a,b:b,candidate:c};}
      });
    });
  });
  return best;
}

function showVertical(match,containerRect){
  if(!match||!validRect(containerRect)){vLine.classList.remove('show');return;}
  vLine.style.left=Math.round(match.value)+'px';
  vLine.style.top=Math.round(containerRect.top)+'px';
  vLine.style.height=Math.max(16,Math.round(containerRect.height))+'px';
  vLine.classList.add('show');
}

function showHorizontal(match,containerRect){
  if(!match||!validRect(containerRect)){hLine.classList.remove('show');return;}
  hLine.style.left=Math.round(containerRect.left)+'px';
  hLine.style.top=Math.round(match.value)+'px';
  hLine.style.width=Math.max(16,Math.round(containerRect.width))+'px';
  hLine.classList.add('show');
}

function overlap(a1,a2,b1,b2){return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1));}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function px(v){return Math.max(0,Math.round(v));}

/* Find the nearest sibling in each direction, but only when the two widgets
 * share some visual span on the perpendicular axis. This matches how design
 * tools present meaningful spacing instead of measuring diagonally. */
function nearestSpaces(ar,siblings){
  var out={left:null,right:null,top:null,bottom:null};
  siblings.forEach(function(s){
    var r=s.rect,gap;
    if(overlap(ar.top,ar.bottom,r.top,r.bottom)>0){
      if(r.right<=ar.left){gap=ar.left-r.right;if(!out.left||gap<out.left.gap)out.left={rect:r,gap:gap};}
      if(r.left>=ar.right){gap=r.left-ar.right;if(!out.right||gap<out.right.gap)out.right={rect:r,gap:gap};}
    }
    if(overlap(ar.left,ar.right,r.left,r.right)>0){
      if(r.bottom<=ar.top){gap=ar.top-r.bottom;if(!out.top||gap<out.top.gap)out.top={rect:r,gap:gap};}
      if(r.top>=ar.bottom){gap=r.top-ar.bottom;if(!out.bottom||gap<out.bottom.gap)out.bottom={rect:r,gap:gap};}
    }
  });
  return out;
}

function addMeasure(axis,a,b,pos,value,side){
  if(!measureLayer||value<0||!isFinite(value))return;
  var size=Math.abs(b-a);
  /* Tiny 0-2px labels create more clutter than information. */
  if(size<3)return;
  var m=document.createElement('div');
  m.className='vf-space-measure '+(axis==='x'?'horizontal':'vertical')+' side-'+side;
  m.dataset.value=px(value);
  if(axis==='x'){
    m.style.left=Math.round(Math.min(a,b))+'px';
    m.style.top=Math.round(pos)+'px';
    m.style.width=Math.max(1,Math.round(size))+'px';
  }else{
    m.style.left=Math.round(pos)+'px';
    m.style.top=Math.round(Math.min(a,b))+'px';
    m.style.height=Math.max(1,Math.round(size))+'px';
  }
  m.innerHTML='<span class="vf-space-tick start"></span><span class="vf-space-line"></span><span class="vf-space-badge">'+px(value)+' px</span><span class="vf-space-tick end"></span>';
  measureLayer.appendChild(m);
}

function showSpacing(ar,cr,siblings){
  clearMeasures();
  var near=nearestSpaces(ar,siblings);
  var midY=clamp(ar.top+ar.height/2,cr.top+10,cr.bottom-10);
  var midX=clamp(ar.left+ar.width/2,cr.left+10,cr.right-10);

  if(near.left)addMeasure('x',near.left.rect.right,ar.left,midY,near.left.gap,'left');
  else if(ar.left>=cr.left)addMeasure('x',cr.left,ar.left,midY,ar.left-cr.left,'left');

  if(near.right)addMeasure('x',ar.right,near.right.rect.left,midY,near.right.gap,'right');
  else if(ar.right<=cr.right)addMeasure('x',ar.right,cr.right,midY,cr.right-ar.right,'right');

  if(near.top)addMeasure('y',near.top.rect.bottom,ar.top,midX,near.top.gap,'top');
  else if(ar.top>=cr.top)addMeasure('y',cr.top,ar.top,midX,ar.top-cr.top,'top');

  if(near.bottom)addMeasure('y',ar.bottom,near.bottom.rect.top,midX,near.bottom.gap,'bottom');
  else if(ar.bottom<=cr.bottom)addMeasure('y',ar.bottom,cr.bottom,midX,cr.bottom-ar.bottom,'bottom');
}

function update(active,x,y){
  build();
  if(!active||!active.isConnected){hide();return;}
  var ar=active.getBoundingClientRect();
  if(!validRect(ar)){hide();return;}

  var container=activeContainer(active,x,y);
  if(!container){hide();return;}
  var cr=container.getBoundingClientRect();
  if(!validRect(cr)){hide();return;}

  var siblings=directNodeChildren(container,active);
  var p=rectPoints(ar),list=candidates(active,container);
  var mx=bestMatch(p.x,list,'x');
  var my=bestMatch(p.y,list,'y');
  showVertical(mx,cr);
  showHorizontal(my,cr);
  showSpacing(ar,cr,siblings);

  if(mx&&my){
    dot.style.left=Math.round(mx.value)+'px';
    dot.style.top=Math.round(my.value)+'px';
    dot.classList.add('show');
  }else dot.classList.remove('show');
}

function activeNodeFromEvent(e){
  var n=e.target&&e.target.closest?e.target.closest('.vf-node'):null;
  return n||null;
}

function onDown(e){
  var node=activeNodeFromEvent(e);
  if(!node)return;
  if(e.target.closest&&e.target.closest('.vf-content input,.vf-content textarea,.vf-content select'))return;
  gesture={
    id:e.pointerId,
    node:node,
    x:e.clientX,
    y:e.clientY,
    lastX:e.clientX,
    lastY:e.clientY,
    moving:false,
    resize:!!(e.target.closest&&e.target.closest('[data-resize]')),
    pointerType:e.pointerType||'mouse'
  };
}

function onMove(e){
  if(!gesture||e.pointerId!==gesture.id)return;
  gesture.lastX=e.clientX;
  gesture.lastY=e.clientY;
  var dist=Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y);

  if(gesture.pointerType==='mouse'){
    if((e.buttons&1)!==1){hide();return;}
    if(dist>2)gesture.moving=true;
  }else{
    if(document.body.classList.contains('vf-widget-dragging'))gesture.moving=true;
    if(gesture.resize&&dist>2)gesture.moving=true;
  }

  if(gesture.moving){
    var node=gesture.node,cx=e.clientX,cy=e.clientY;
    requestAnimationFrame(function(){if(gesture&&gesture.node===node)update(node,cx,cy);});
  }else hide();
}

function finish(e){
  if(!gesture)return;
  if(e&&typeof e.pointerId==='number'&&e.pointerId!==gesture.id)return;
  gesture=null;
  hide();
}

document.addEventListener('pointerdown',onDown,true);
document.addEventListener('pointermove',onMove,true);
document.addEventListener('pointerup',finish,true);
document.addEventListener('pointercancel',finish,true);
document.addEventListener('dragend',finish,true);
window.addEventListener('blur',finish);
document.addEventListener('visibilitychange',function(){if(document.hidden)finish();});
document.querySelectorAll('.tab[data-tab]').forEach(function(t){t.addEventListener('click',finish,true);});
window.addEventListener('scroll',function(){
  if(gesture&&gesture.moving)update(gesture.node,gesture.lastX,gesture.lastY);
  else hide();
},true);

build();
})();
