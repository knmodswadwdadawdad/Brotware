(function(){
'use strict';

var panel=null,list=null,search=null,contextLabel=null,ghost=null;
var collapsed={};
var renderQueued=false;
var drag=null;
var baseSelectNode=window.selectNode;
var baseCommit=window.commit;
var baseLoadPage=window.loadPage;

var TYPE_META={
  text:['TextView','T'],button:['Button','▣'],input:['Input','⌨'],textarea:['TextArea','¶'],image:['Image','▧'],link:['Link','↗'],checkbox:['Checkbox','☑'],select:['Select','▾'],progress:['Progress','▬'],divider:['Divider','—'],
  'linear-h':['Linear(H)','▤'],'linear-v':['Linear(V)','▥'],relative:['RelativeLayout','◫'],card:['CardView','▱'],scroll:['ScrollView','↕']
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function currentPageSafe(){return typeof currentPage==='function'?currentPage():null;}
function contextKey(){
  if(state&&state.dialogEditorActive)return String(state.currentPageId||'page')+':dialog:'+String(state.activeDialogId||'dialog');
  return String(state&&state.currentPageId||'page');
}
function contextName(){
  if(state&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.get){var d=BrotwareDialogs.get(state.activeDialogId);return d?'Dialog: '+(d.name||d.id):'Dialog';}
  var p=currentPageSafe();return p?'Page: '+p.name:'Design';
}
function isNode(n){return !!(n&&n.classList&&n.classList.contains('vf-node'));}
function childrenOf(parent){return Array.prototype.filter.call(parent.children||[],isNode);}
function canContain(n){return n===root||(typeof isLayout==='function'&&isLayout(n.dataset.type));}
function meta(n){return TYPE_META[n.dataset.type]||[n.dataset.type||'View','▣'];}
function contentText(n){
  var c=n.querySelector('.vf-content');if(!c)return'';
  var s=('value' in c&&c.value)?c.value:c.textContent;
  return String(s||'').replace(/\s+/g,' ').trim().slice(0,42);
}
function collapseKey(id){return contextKey()+'|'+id;}
function isCollapsed(id){return collapsed[collapseKey(id)]===true;}
function setCollapsed(id,on){collapsed[collapseKey(id)]=!!on;}

function build(){
  if(panel)return;
  panel=document.createElement('div');panel.id='bwLayersPanel';panel.className='bw-layers-backdrop';
  panel.innerHTML=''+
    '<section class="bw-layers-sheet" role="dialog" aria-label="Layers">'+
      '<header class="bw-layers-head"><div><strong>Layers</strong><small id="bwLayersContext">Design</small></div><span class="spacer"></span><button id="bwLayersCollapseAll" type="button" title="Recolher tudo">⇈</button><button id="bwLayersClose" type="button">×</button></header>'+
      '<label class="bw-layers-search"><span>⌕</span><input id="bwLayersSearch" type="search" placeholder="Search layers..."></label>'+
      '<main id="bwLayersList" class="bw-layers-list"></main>'+
      '<footer class="bw-layers-foot"><small>Toque para selecionar · segure para mover</small></footer>'+
    '</section>'+
    '<div class="bw-layer-drag-ghost" id="bwLayerDragGhost"></div>';
  document.body.appendChild(panel);
  list=document.getElementById('bwLayersList');search=document.getElementById('bwLayersSearch');contextLabel=document.getElementById('bwLayersContext');ghost=document.getElementById('bwLayerDragGhost');
  document.getElementById('bwLayersClose').onclick=close;
  document.getElementById('bwLayersCollapseAll').onclick=function(){collapseAll();render();};
  panel.addEventListener('click',function(e){if(e.target===panel)close();});
  search.addEventListener('input',scheduleRender);
  list.addEventListener('click',onListClick);
  list.addEventListener('pointerdown',onPointerDown,{passive:true});
}

function nodeMatches(n,q){if(!q)return true;var m=meta(n),s=(n.dataset.vfId+' '+m[0]+' '+contentText(n)).toLowerCase();return s.indexOf(q)>=0;}
function branchMatches(n,q){if(nodeMatches(n,q))return true;var ch=childrenOf(n);for(var i=0;i<ch.length;i++)if(branchMatches(ch[i],q))return true;return false;}
function renderNode(n,depth,q){
  if(q&&!branchMatches(n,q))return'';
  var id=n.dataset.vfId||'',m=meta(n),kids=childrenOf(n),container=canContain(n),closed=!q&&isCollapsed(id),active=state.selectedId===id;
  var txt=contentText(n),html='<div class="bw-layer-branch">';
  html+='<div class="bw-layer-row'+(active?' active':'')+'" data-layer-id="'+esc(id)+'" data-layer-container="'+(container?'1':'0')+'" style="--layer-depth:'+depth+'">'+
    (kids.length?'<button class="bw-layer-toggle" data-layer-toggle="'+esc(id)+'" type="button">'+(closed?'›':'⌄')+'</button>':'<span class="bw-layer-toggle empty"></span>')+
    '<span class="bw-layer-icon">'+esc(m[1])+'</span><span class="bw-layer-meta"><b>'+esc(id)+'</b><small>'+esc(m[0]+(txt?' · '+txt:''))+'</small></span>'+
    (container?'<span class="bw-layer-container-badge">container</span>':'')+'<span class="bw-layer-grip">⋮⋮</span></div>';
  if(kids.length&&!closed){html+='<div class="bw-layer-children">';for(var i=0;i<kids.length;i++)html+=renderNode(kids[i],depth+1,q);html+='</div>';}
  return html+'</div>';
}
function render(){
  renderQueued=false;if(!panel||!list)return;contextLabel.textContent=contextName();var q=String(search.value||'').trim().toLowerCase(),top=childrenOf(root),html='';
  html+='<div class="bw-layer-row root-row" data-layer-id="@root" data-layer-container="1" style="--layer-depth:0"><span class="bw-layer-toggle empty"></span><span class="bw-layer-icon">▦</span><span class="bw-layer-meta"><b>body</b><small>'+esc(contextName())+' · '+top.length+' child'+(top.length===1?'':'ren')+'</small></span><span class="bw-layer-container-badge">root</span></div>';
  for(var i=0;i<top.length;i++)html+=renderNode(top[i],1,q);
  if(!top.length)html+='<div class="bw-layers-empty">Nenhuma View neste Design.</div>';
  list.innerHTML=html;syncSelection(false);
}
function scheduleRender(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(render);}
function syncSelection(scroll){
  if(!list)return;var rows=list.querySelectorAll('.bw-layer-row');for(var i=0;i<rows.length;i++)rows[i].classList.toggle('active',rows[i].dataset.layerId===state.selectedId);
  if(scroll&&state.selectedId){var r=list.querySelector('.bw-layer-row[data-layer-id="'+cssEscape(state.selectedId)+'"]');if(r)try{r.scrollIntoView({block:'nearest'});}catch(_){} }
}
function cssEscape(v){return String(v||'').replace(/(["\\])/g,'\\$1');}
function revealAncestors(n){var p=n?n.parentElement:null;while(p&&p!==root){if(isNode(p))setCollapsed(p.dataset.vfId,false);p=p.parentElement;}}
function selectLayer(id){
  if(id==='@root'){if(typeof baseSelectNode==='function')baseSelectNode(null);syncSelection(false);return;}
  var n=root.querySelector('[data-vf-id="'+cssEscape(id)+'"]');if(!n)return;revealAncestors(n);if(typeof baseSelectNode==='function')baseSelectNode(id);syncSelection(false);setTimeout(function(){try{n.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});}catch(_){}},30);
}
function onListClick(e){
  if(Date.now()<Number(list.dataset.suppressClickUntil||0))return;
  var tog=e.target.closest('[data-layer-toggle]');if(tog){e.stopPropagation();var id=tog.dataset.layerToggle;setCollapsed(id,!isCollapsed(id));render();return;}
  var row=e.target.closest('.bw-layer-row');if(!row)return;selectLayer(row.dataset.layerId);
}
function collapseAll(){var nodes=root.querySelectorAll('.vf-node');for(var i=0;i<nodes.length;i++)if(childrenOf(nodes[i]).length)setCollapsed(nodes[i].dataset.vfId,true);}

function open(){build();search.value='';render();panel.classList.add('show');document.body.classList.add('bw-layers-open');if(state.selectedId)syncSelection(true);}
function close(){cancelDrag();if(panel)panel.classList.remove('show');document.body.classList.remove('bw-layers-open');}

function parentScale(parent){var r=parent.getBoundingClientRect(),ow=parent.offsetWidth||r.width||1,oh=parent.offsetHeight||r.height||1;return{x:r.width/ow||1,y:r.height/oh||1,rect:r};}
function invalidParent(source,parent){return !source||!parent||source===parent||source.contains(parent)||!canContain(parent);}
function movePreservingScreenPosition(source,newParent,before){
  if(invalidParent(source,newParent))return false;
  var oldParent=source.parentElement,screen=source.getBoundingClientRect();
  if(before&&before.parentElement===newParent)newParent.insertBefore(source,before);else newParent.appendChild(source);
  if(oldParent!==newParent){
    var ps=parentScale(newParent),x=(screen.left-ps.rect.left)/ps.x,y=(screen.top-ps.rect.top)/ps.y;
    if(newParent!==root)y=Math.max(24,y);else y=Math.max(0,y);
    source.style.left=(typeof snap==='function'?snap(x):Math.round(x))+'px';source.style.top=(typeof snap==='function'?snap(y):Math.round(y))+'px';
  }
  return true;
}
function applyDrop(sourceId,targetId,mode){
  var source=root.querySelector('[data-vf-id="'+cssEscape(sourceId)+'"]');if(!source)return false;
  if(targetId==='@root'){if(!movePreservingScreenPosition(source,root,null))return false;}
  else{
    var target=root.querySelector('[data-vf-id="'+cssEscape(targetId)+'"]');if(!target||source===target||source.contains(target))return false;
    if(mode==='inside'&&canContain(target)){if(!movePreservingScreenPosition(source,target,null))return false;}
    else{
      var par=target.parentElement;if(!par||(!canContain(par)&&par!==root))return false;
      var before=mode==='before'?target:target.nextSibling;if(!movePreservingScreenPosition(source,par,before))return false;
    }
  }
  if(typeof commit==='function')commit();revealAncestors(source);scheduleRender();setTimeout(function(){if(typeof selectNode==='function')selectNode(sourceId);},0);return true;
}

function clearDropState(){if(!list)return;var rows=list.querySelectorAll('.drop-inside,.drop-before,.drop-after');for(var i=0;i<rows.length;i++)rows[i].classList.remove('drop-inside','drop-before','drop-after');}
function targetAt(x,y,sourceId){
  var at=document.elementFromPoint(x,y),row=at&&at.closest?at.closest('.bw-layer-row'):null;if(!row||!list.contains(row))return null;
  var id=row.dataset.layerId;if(id===sourceId)return null;var source=root.querySelector('[data-vf-id="'+cssEscape(sourceId)+'"]'),target=id==='@root'?root:root.querySelector('[data-vf-id="'+cssEscape(id)+'"]');if(!target||source&&source.contains(target))return null;
  if(id==='@root')return{row:row,id:id,mode:'inside'};
  var rect=row.getBoundingClientRect();if(row.dataset.layerContainer==='1'&&x>rect.left+48)return{row:row,id:id,mode:'inside'};
  return{row:row,id:id,mode:y<rect.top+rect.height/2?'before':'after'};
}
function updateDrag(x,y){
  if(!drag)return;drag.x=x;drag.y=y;ghost.style.left=(x+13)+'px';ghost.style.top=(y+13)+'px';clearDropState();var t=targetAt(x,y,drag.sourceId);drag.target=t;if(t)t.row.classList.add(t.mode==='inside'?'drop-inside':t.mode==='before'?'drop-before':'drop-after');
  var pr=list.getBoundingClientRect();if(y<pr.top+46)list.scrollTop-=14;else if(y>pr.bottom-46)list.scrollTop+=14;
}
function beginDrag(row,e){
  var id=row.dataset.layerId;if(!id||id==='@root')return;cancelDrag();drag={sourceId:id,pointerId:e.pointerId,target:null};list.dataset.suppressClickUntil=String(Date.now()+700);ghost.textContent=id;ghost.classList.add('show');document.body.classList.add('bw-layer-dragging');try{row.setPointerCapture(e.pointerId);}catch(_){}drag.capture=row;updateDrag(e.clientX,e.clientY);window.addEventListener('pointermove',dragMove,true);window.addEventListener('pointerup',dragEnd,true);window.addEventListener('pointercancel',dragCancel,true);
}
function dragMove(e){if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();updateDrag(e.clientX,e.clientY);}
function dragEnd(e){if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();var d=drag,target=d.target;finishDrag();if(target)applyDrop(d.sourceId,target.id,target.mode);}
function dragCancel(e){if(!drag||e.pointerId!==drag.pointerId)return;finishDrag();}
function finishDrag(){if(!drag)return;var d=drag;window.removeEventListener('pointermove',dragMove,true);window.removeEventListener('pointerup',dragEnd,true);window.removeEventListener('pointercancel',dragCancel,true);try{d.capture.releasePointerCapture(d.pointerId);}catch(_){}drag=null;ghost.classList.remove('show');document.body.classList.remove('bw-layer-dragging');clearDropState();}
function cancelDrag(){if(drag)finishDrag();}
function onPointerDown(e){
  var row=e.target.closest('.bw-layer-row');if(!row||row.classList.contains('root-row')||e.target.closest('.bw-layer-toggle'))return;if(e.pointerType==='mouse'&&e.button!==0)return;
  var sx=e.clientX,sy=e.clientY,pid=e.pointerId,done=false,started=false,delay=e.pointerType==='mouse'?120:320;
  var timer=setTimeout(function(){if(done)return;started=true;beginDrag(row,e);cleanup();},delay);
  function mv(ev){if(ev.pointerId!==pid||done||started)return;if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8){clearTimeout(timer);done=true;cleanup();}}
  function up(ev){if(ev.pointerId!==pid||done||started)return;clearTimeout(timer);done=true;cleanup();}
  function cn(ev){if(ev.pointerId!==pid)return;clearTimeout(timer);done=true;cleanup();}
  function cleanup(){window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cn,true);}
  window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cn,true);
}

function installButton(){
  var tb=document.querySelector('.designer-toolbar');if(!tb||document.getElementById('bwLayersBtn'))return;var b=document.createElement('button');b.id='bwLayersBtn';b.type='button';b.className='tool-pill bw-layers-btn';b.textContent='☷ Layers';var spacer=tb.querySelector('.designer-spacer');tb.insertBefore(b,spacer||tb.firstChild);b.onclick=open;
}
function observe(){
  if(!root||root.dataset.bwLayersObserved==='1')return;root.dataset.bwLayersObserved='1';var ob=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='childList'||m.attributeName==='data-vf-id'||m.attributeName==='data-type'){scheduleRender();break;}}});ob.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-vf-id','data-type']});
}

window.selectNode=function(id){var r=baseSelectNode?baseSelectNode.apply(this,arguments):undefined;if(id){var n=root.querySelector('[data-vf-id="'+cssEscape(id)+'"]');if(n)revealAncestors(n);}syncSelection(panel&&panel.classList.contains('show'));return r;};
window.commit=function(){var r=baseCommit?baseCommit.apply(this,arguments):undefined;scheduleRender();return r;};
window.loadPage=function(){var r=baseLoadPage?baseLoadPage.apply(this,arguments):undefined;scheduleRender();return r;};

function install(){build();installButton();observe();render();}
window.BrotwareLayers={open:open,close:close,render:render,reparent:applyDrop};
setTimeout(install,0);setTimeout(install,250);setTimeout(install,900);
})();