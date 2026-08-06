(function(){
'use strict';

var layer=null,vLine=null,hLine=null,dot=null;
var gesture=null;
var THRESHOLD=6;

function build(){
  if(layer)return;
  layer=document.createElement('div');
  layer.className='vf-align-guide-layer';
  layer.id='vfAlignGuideLayer';
  layer.innerHTML='<div class="vf-align-guide vertical" id="vfGuideV"></div><div class="vf-align-guide horizontal" id="vfGuideH"></div><div class="vf-align-guide-dot" id="vfGuideDot"></div>';
  document.body.appendChild(layer);
  vLine=document.getElementById('vfGuideV');
  hLine=document.getElementById('vfGuideH');
  dot=document.getElementById('vfGuideDot');
}

function hide(){
  if(vLine)vLine.classList.remove('show');
  if(hLine)hLine.classList.remove('show');
  if(dot)dot.classList.remove('show');
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

function candidates(active){
  var out=[];
  var view=document.getElementById('viewPane');
  if(view){var vr=view.getBoundingClientRect();if(validRect(vr))out.push({el:view,rect:vr,type:'canvas'});}

  document.querySelectorAll('.vf-node').forEach(function(n){
    if(n===active)return;
    if(active.contains(n))return;
    if(!n.isConnected)return;
    var r=n.getBoundingClientRect();
    if(!validRect(r))return;
    out.push({el:n,rect:r,type:'node'});
  });
  return out;
}

function bestMatch(activePoints,list,axis){
  var best=null;
  list.forEach(function(c){
    var cp=rectPoints(c.rect)[axis];
    activePoints.forEach(function(a){
      cp.forEach(function(b){
        var d=Math.abs(a.value-b.value);
        if(d>THRESHOLD)return;
        /* Prefer exact same semantic edge/center, then nearest distance. */
        var semanticPenalty=a.kind===b.kind?0:1.25;
        var score=d+semanticPenalty;
        if(!best||score<best.score){best={score:score,value:b.value,a:a,b:b,candidate:c};}
      });
    });
  });
  return best;
}

function showVertical(match,activeRect){
  if(!match){vLine.classList.remove('show');return;}
  var r=match.candidate.rect;
  var top=Math.min(activeRect.top,r.top);
  var bottom=Math.max(activeRect.bottom,r.bottom);
  if(match.candidate.type==='canvas'){top=r.top;bottom=r.bottom;}
  vLine.style.left=Math.round(match.value)+'px';
  vLine.style.top=Math.round(top)+'px';
  vLine.style.height=Math.max(16,Math.round(bottom-top))+'px';
  vLine.classList.add('show');
}

function showHorizontal(match,activeRect){
  if(!match){hLine.classList.remove('show');return;}
  var r=match.candidate.rect;
  var left=Math.min(activeRect.left,r.left);
  var right=Math.max(activeRect.right,r.right);
  if(match.candidate.type==='canvas'){left=r.left;right=r.right;}
  hLine.style.left=Math.round(left)+'px';
  hLine.style.top=Math.round(match.value)+'px';
  hLine.style.width=Math.max(16,Math.round(right-left))+'px';
  hLine.classList.add('show');
}

function update(active){
  build();
  if(!active||!active.isConnected){hide();return;}
  var ar=active.getBoundingClientRect();
  if(!validRect(ar)){hide();return;}
  var p=rectPoints(ar),list=candidates(active);
  var mx=bestMatch(p.x,list,'x');
  var my=bestMatch(p.y,list,'y');
  showVertical(mx,ar);
  showHorizontal(my,ar);

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
    moving:false,
    resize:!!(e.target.closest&&e.target.closest('[data-resize]')),
    pointerType:e.pointerType||'mouse'
  };
}

function onMove(e){
  if(!gesture||e.pointerId!==gesture.id)return;
  var dist=Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y);

  if(gesture.pointerType==='mouse'){
    if((e.buttons&1)!==1){hide();return;}
    if(dist>2)gesture.moving=true;
  }else{
    /* Mobile widget movement only starts after the stabilized long-press handler sets this class. */
    if(document.body.classList.contains('vf-widget-dragging'))gesture.moving=true;
    if(gesture.resize&&dist>2)gesture.moving=true;
  }

  if(gesture.moving)requestAnimationFrame(function(){if(gesture)update(gesture.node);});
  else hide();
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
window.addEventListener('scroll',function(){if(gesture&&gesture.moving)update(gesture.node);else hide();},true);

build();
})();
