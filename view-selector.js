(function(){
'use strict';

var modal=null,listBox=null,searchInput=null;
var TYPE_LABELS={
  text:'TextView',button:'Button',input:'Input',textarea:'TextArea',image:'Image',link:'Link',checkbox:'Checkbox',select:'Select',progress:'Progress',divider:'Divider',
  'linear-h':'Linear(H)','linear-v':'Linear(V)',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView'
};
var TYPE_ICONS={text:'T',button:'▣',input:'⌨',textarea:'¶',image:'▧',link:'↗',checkbox:'☑',select:'▾',progress:'▬',divider:'—','linear-h':'▤','linear-v':'▥',relative:'◫',card:'▱',scroll:'↕'};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function currentContextName(){
  if(typeof state!=='undefined'&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.get){var d=BrotwareDialogs.get(state.activeDialogId);if(d)return'Dialog: '+(d.name||d.id);}
  var p=typeof currentPage==='function'?currentPage():null;return p?'Page: '+p.name:'Design atual';
}
function directNodes(parent){return Array.prototype.filter.call(parent.children||[],function(n){return n.classList&&n.classList.contains('vf-node');});}
function flatten(parent,depth,out){directNodes(parent).forEach(function(n){out.push({el:n,depth:depth});flatten(n,depth+1,out);});return out;}
function allRows(){return flatten(root,0,[]);}
function typeName(n){return TYPE_LABELS[n.dataset.type]||n.dataset.type||'View';}
function nodeText(n){
  var c=n.querySelector('.vf-content');if(!c)return'';
  if('value' in c&&c.value)return String(c.value);
  return String(c.textContent||'').replace(/\s+/g,' ').trim().slice(0,70);
}
function build(){
  if(modal)return;
  modal=document.createElement('div');modal.id='bwViewSelector';modal.className='bw-view-selector-backdrop';
  modal.innerHTML='<section class="bw-view-selector"><header class="bw-view-selector-head"><span class="ico">▦</span><div><strong>Select View</strong><small id="bwViewSelectorContext">Design atual</small></div><button id="bwViewSelectorClose" type="button">×</button></header><label class="bw-view-selector-search"><span>⌕</span><input id="bwViewSelectorSearch" type="search" placeholder="Search views..."></label><main class="bw-view-selector-list" id="bwViewSelectorList"></main><footer class="bw-view-selector-foot"><button id="bwViewSelectorCancel" type="button">Cancel</button></footer></section>';
  document.body.appendChild(modal);
  listBox=document.getElementById('bwViewSelectorList');searchInput=document.getElementById('bwViewSelectorSearch');
  document.getElementById('bwViewSelectorClose').onclick=close;
  document.getElementById('bwViewSelectorCancel').onclick=close;
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
  searchInput.addEventListener('input',render);
  listBox.addEventListener('click',function(e){var row=e.target.closest('[data-bw-view-id]');if(!row)return;select(row.dataset.bwViewId);});
}
function render(){
  build();document.getElementById('bwViewSelectorContext').textContent=currentContextName();
  var q=String(searchInput.value||'').trim().toLowerCase(),rows=allRows();
  if(q)rows=rows.filter(function(r){var n=r.el,s=(n.dataset.vfId+' '+typeName(n)+' '+nodeText(n)).toLowerCase();return s.indexOf(q)>=0;});
  if(!rows.length){listBox.innerHTML='<div class="bw-view-selector-empty">Nenhuma View encontrada neste Design.</div>';return;}
  listBox.innerHTML=rows.map(function(r){var n=r.el,id=n.dataset.vfId||'',type=typeName(n),txt=nodeText(n),active=typeof state!=='undefined'&&state.selectedId===id;return '<button type="button" class="bw-view-row'+(active?' active':'')+'" data-bw-view-id="'+esc(id)+'" style="--depth:'+r.depth+'"><span class="type-ico">'+esc(TYPE_ICONS[n.dataset.type]||'▣')+'</span><span class="meta"><b>'+esc(id)+'</b><small>'+esc(type+(txt?' · '+txt:''))+'</small></span><span class="check">'+(active?'✓':'')+'</span></button>';}).join('');
  var active=listBox.querySelector('.bw-view-row.active');if(active)setTimeout(function(){try{active.scrollIntoView({block:'center'});}catch(_){}},0);
}
function open(){build();searchInput.value='';render();modal.classList.add('show');setTimeout(function(){try{searchInput.focus({preventScroll:true});}catch(_){}},60);}
function close(){if(modal)modal.classList.remove('show');}
function select(id){
  if(typeof selectNode==='function')selectNode(id);close();
  var n=typeof selectedNode==='function'?selectedNode():root.querySelector('[data-vf-id="'+id+'"]');
  if(n)setTimeout(function(){try{n.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});}catch(_){try{n.scrollIntoView();}catch(__){}}},30);
}
function install(){
  var btn=document.getElementById('selectedTargetBtn');if(!btn){setTimeout(install,180);return;}
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();open();};
  btn.setAttribute('title','Selecionar View');
  btn.dataset.bwViewSelector='1';
}
window.BrotwareViewSelector={open:open,close:close,refresh:render};
install();setTimeout(install,400);setTimeout(install,1200);
})();
