'use strict';

var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

var state = {
  projectName: 'Brotware Project',
  pages: [],
  currentPageId: null,
  selectedId: null,
  snap: 8,
  zoom: 1,
  counter: 1,
  strings: {app_name:'Meu Site'},
  variables: {counter:0},
  functions: [],
  components: [],
  histories: {},
  historyIndex: {},
  storageKey: 'brotware_studio_project_v3',
  logicMode: 'event',
  activeFunctionId: null,
  editingBlockId: null,
  dragBlock: null,
  ignorePaletteClick: false,
  ignoreBlockClick: false
};

var root = $('#rootLayout');
var viewPane = $('#viewPane');
var dragGhost = $('#dragGhost');
var deleteZone = $('#deleteZone');

var EVENT_OPTIONS = {
  '@page': [
    ['load','onLoad'],
    ['beforeunload','onBeforeUnload']
  ],
  default: [
    ['click','onClick'],
    ['dblclick','onDoubleClick'],
    ['mouseenter','onMouseEnter'],
    ['mouseleave','onMouseLeave'],
    ['focus','onFocus'],
    ['blur','onBlur'],
    ['keydown','onKeyDown'],
    ['keyup','onKeyUp']
  ],
  input: [
    ['input','onInput'],
    ['change','onChange'],
    ['focus','onFocus'],
    ['blur','onBlur'],
    ['keydown','onKeyDown'],
    ['keyup','onKeyUp']
  ],
  checkbox: [
    ['change','onChange'],
    ['click','onClick']
  ],
  select: [
    ['change','onChange'],
    ['focus','onFocus'],
    ['blur','onBlur']
  ]
};

var BLOCK_META = {
  'if': {name:'if / else', icon:'◆', cls:'flow'},
  repeat: {name:'repeat', icon:'↻', cls:'flow'},
  wait: {name:'wait', icon:'◷', cls:'flow'},
  navigate: {name:'open page', icon:'↗', cls:'ui'},
  alert: {name:'alert', icon:'!', cls:'ui'},
  setText: {name:'set text', icon:'T', cls:'ui'},
  setValue: {name:'set value', icon:'⌨', cls:'ui'},
  setStyle: {name:'set style', icon:'🎨', cls:'ui'},
  show: {name:'show', icon:'👁', cls:'ui'},
  hide: {name:'hide', icon:'◌', cls:'ui'},
  toggle: {name:'toggle', icon:'◐', cls:'ui'},
  setVar: {name:'set variable', icon:'x', cls:'data'},
  math: {name:'math', icon:'＋', cls:'data'},
  readInput: {name:'read input', icon:'⇢', cls:'data'},
  storageSet: {name:'save local', icon:'▣', cls:'storage'},
  storageGet: {name:'read local', icon:'▤', cls:'storage'},
  storageRemove: {name:'remove local', icon:'×', cls:'storage'},
  fetch: {name:'HTTP request', icon:'⇄', cls:'network'},
  callFunction: {name:'call function', icon:'ƒ', cls:'function'},
  console: {name:'console log', icon:'>_', cls:'debug'}
};

function uid(prefix){
  return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
}
function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
  });
}
function cssSafe(v){ return String(v || '').replace(/[<>]/g,''); }
function toast(message){
  var t=$('#toast');
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){ t.classList.remove('show'); },1500);
}
function status(message){ $('#statusText').textContent=message; }
function openModal(id){ $('#'+id).classList.add('show'); }
function closeModal(id){ $('#'+id).classList.remove('show'); }
function snap(v){ return state.snap ? Math.round(v/state.snap)*state.snap : Math.round(v); }
function currentPage(){
  return state.pages.find(function(p){ return p.id===state.currentPageId; }) || null;
}
function pageByName(name){
  return state.pages.find(function(p){ return p.name.toLowerCase()===String(name||'').toLowerCase(); }) || null;
}
function normalizeName(name){
  name=String(name||'pagina.html').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'-');
  if(!/\.html?$/i.test(name)) name += '.html';
  return name || 'pagina.html';
}
function uniquePageName(name,ignore){
  name=normalizeName(name);
  var base=name.replace(/\.html?$/i,''),candidate=name,i=2;
  while(state.pages.some(function(p){ return p.id!==ignore && p.name.toLowerCase()===candidate.toLowerCase(); })){
    candidate=base+'-'+(i++)+'.html';
  }
  return candidate;
}
function newPage(name,title){
  return {
    id:uid('page'),
    name:uniquePageName(name||'index.html'),
    title:title||'Nova página',
    background:'#ffffff',
    content:'',
    events:{'@page':{load:[]}},
    createdAt:Date.now(),
    updatedAt:Date.now()
  };
}
function nodeId(type){
  var m={
    text:'textview',button:'button',input:'input',textarea:'textarea',image:'image',link:'link',
    checkbox:'checkbox',select:'select',progress:'progress',divider:'divider',
    'linear-h':'linear','linear-v':'linear',relative:'relative',card:'cardview',scroll:'scroll'
  };
  return (m[type]||'view')+(state.counter++);
}
function isLayout(type){
  return ['linear-h','linear-v','relative','card','scroll'].indexOf(type)>=0;
}
function selectedNode(){
  return state.selectedId ? root.querySelector('[data-vf-id="'+state.selectedId+'"]') : null;
}
function handles(){
  return '<i class="resize-handle rh-nw" data-resize="nw"></i>'+
    '<i class="resize-handle rh-n" data-resize="n"></i>'+
    '<i class="resize-handle rh-ne" data-resize="ne"></i>'+
    '<i class="resize-handle rh-e" data-resize="e"></i>'+
    '<i class="resize-handle rh-se" data-resize="se"></i>'+
    '<i class="resize-handle rh-s" data-resize="s"></i>'+
    '<i class="resize-handle rh-sw" data-resize="sw"></i>'+
    '<i class="resize-handle rh-w" data-resize="w"></i>';
}
function nodeMarkup(type){
  if(type==='text') return '<div class="node-text vf-content">TextView</div>';
  if(type==='button') return '<button class="node-button vf-content">Button</button>';
  if(type==='input') return '<input class="node-input vf-content" placeholder="Digite aqui">';
  if(type==='textarea') return '<textarea class="node-textarea vf-content" placeholder="Digite aqui"></textarea>';
  if(type==='image') return '<div class="node-image vf-content">🖼</div>';
  if(type==='link') return '<div class="node-link vf-content">Link</div>';
  if(type==='checkbox') return '<div class="node-checkbox vf-content"><span>☐</span><span class="vf-check-label">Checkbox</span></div>';
  if(type==='select') return '<select class="node-select vf-content"><option>Opção 1</option><option>Opção 2</option></select>';
  if(type==='progress') return '<div class="node-progress vf-content"><span><i></i></span></div>';
  if(type==='divider') return '<div class="node-divider vf-content"></div>';
  if(type==='card') return '<div class="node-card vf-content"></div><div class="node-layout-label">CardView</div>';
  var label=type==='linear-h'?'Linear(H)':type==='linear-v'?'Linear(V)':type==='scroll'?'ScrollView':'RelativeLayout';
  return '<div class="node-layout vf-content '+(type==='scroll'?'node-scroll':'')+'"></div><div class="node-layout-label">'+label+'</div>';
}
function defaultSize(type){
  var m={
    text:[110,34],button:[110,40],input:[170,40],textarea:[190,80],image:[120,90],link:[100,34],
    checkbox:[130,36],select:[150,40],progress:[160,28],divider:[180,20],
    'linear-h':[230,120],'linear-v':[230,140],relative:[230,140],card:[190,110],scroll:[230,180]
  };
  return m[type]||[120,50];
}

/* ---------- VISUAL EDITOR ---------- */
function createNode(type,x,y,parent,skipCommit){
  var size=defaultSize(type);
  var el=document.createElement('div');
  el.className='vf-node';
  el.dataset.type=type;
  el.dataset.vfId=nodeId(type);
  el.style.left=snap(x==null?20:x)+'px';
  el.style.top=snap(y==null?20:y)+'px';
  el.style.width=size[0]+'px';
  el.style.height=size[1]+'px';
  el.innerHTML=nodeMarkup(type)+handles();
  bindNode(el);
  (parent||root).appendChild(el);
  selectNode(el.dataset.vfId);
  if(!skipCommit) commit();
  return el;
}
function bindNode(el){
  if(el.dataset.bound==='1') return;
  el.dataset.bound='1';
  el.addEventListener('pointerdown',function(e){
    var h=e.target.closest('[data-resize]');
    if(h){
      e.preventDefault();e.stopPropagation();
      selectNode(el.dataset.vfId);
      beginResize(e,el,h.dataset.resize);
      return;
    }
    if(e.button!==0) return;
    e.preventDefault();e.stopPropagation();
    selectNode(el.dataset.vfId);
    beginMove(e,el);
  });
  el.addEventListener('dblclick',function(e){
    e.preventDefault();e.stopPropagation();
    selectNode(el.dataset.vfId);
    openProperties();
  });
}
function bindAllNodes(){
  $$('.vf-node').forEach(function(el){
    if(!el.querySelector('.resize-handle')) el.insertAdjacentHTML('beforeend',handles());
    el.dataset.bound='';
    bindNode(el);
  });
}
function selectNode(id){
  $$('.vf-node.selected').forEach(function(n){ n.classList.remove('selected'); });
  state.selectedId=id||null;
  var el=selectedNode();
  if(el){
    el.classList.add('selected');
    $('#selectedTargetName').textContent=el.dataset.vfId;
    $('#statusNode').textContent=el.dataset.vfId;
    $('#propertiesDock').classList.add('show');
  }else{
    $('#propertiesDock').classList.remove('show');
    $('#statusNode').textContent='Nenhum widget selecionado';
  }
  refreshEventNodeSelect();
}
root.addEventListener('pointerdown',function(e){
  if(e.target===root || e.target.id==='gridLayer') selectNode(null);
});
function beginMove(e,el){
  var sx=e.clientX,sy=e.clientY,l=parseFloat(el.style.left)||0,t=parseFloat(el.style.top)||0;
  deleteZone.classList.add('show');
  function mv(ev){
    el.style.left=snap(l+ev.clientX-sx)+'px';
    el.style.top=snap(t+ev.clientY-sy)+'px';
    deleteZone.classList.toggle('hot',hit(deleteZone,ev.clientX,ev.clientY));
    $$('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    var target=findContainer(ev.clientX,ev.clientY,el);
    if(target) target.classList.add('drop-target');
  }
  function up(ev){
    window.removeEventListener('pointermove',mv);
    deleteZone.classList.remove('show','hot');
    $$('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    if(hit(deleteZone,ev.clientX,ev.clientY)){ deleteSelected(false); return; }
    var target=findContainer(ev.clientX,ev.clientY,el);
    if(target) moveInto(el,target,ev.clientX,ev.clientY);
    commit();
  }
  window.addEventListener('pointermove',mv);
  window.addEventListener('pointerup',up,{once:true});
}
function beginResize(e,el,dir){
  var sx=e.clientX,sy=e.clientY,x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0,w=el.offsetWidth,h=el.offsetHeight;
  function mv(ev){
    var dx=ev.clientX-sx,dy=ev.clientY-sy,nx=x,ny=y,nw=w,nh=h;
    if(dir.indexOf('e')>=0) nw=Math.max(24,snap(w+dx));
    if(dir.indexOf('s')>=0) nh=Math.max(20,snap(h+dy));
    if(dir.indexOf('w')>=0){ nw=Math.max(24,snap(w-dx)); nx=snap(x+dx); }
    if(dir.indexOf('n')>=0){ nh=Math.max(20,snap(h-dy)); ny=snap(y+dy); }
    el.style.left=nx+'px';el.style.top=ny+'px';el.style.width=nw+'px';el.style.height=nh+'px';
  }
  function up(){ window.removeEventListener('pointermove',mv);commit(); }
  window.addEventListener('pointermove',mv);
  window.addEventListener('pointerup',up,{once:true});
}
function hit(el,x,y){
  var r=el.getBoundingClientRect();
  return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
}
function findContainer(x,y,ignore){
  var list=$$('.vf-node').filter(function(n){
    return n!==ignore && isLayout(n.dataset.type) && !(ignore && ignore.contains(n));
  });
  var best=null,area=Infinity;
  list.forEach(function(n){
    var r=n.getBoundingClientRect();
    if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){
      var a=r.width*r.height;
      if(a<area){best=n;area=a;}
    }
  });
  return best;
}
function moveInto(el,target,x,y){
  if(el===target || el.contains(target)) return;
  var r=target.getBoundingClientRect();
  target.appendChild(el);
  el.style.left=Math.max(0,snap(x-r.left-el.offsetWidth/2))+'px';
  el.style.top=Math.max(24,snap(y-r.top-el.offsetHeight/2))+'px';
}
function startPaletteDrag(e,type){
  e.preventDefault();
  dragGhost.style.display='flex';
  dragGhost.textContent=type;
  dragGhost.style.left=e.clientX+10+'px';
  dragGhost.style.top=e.clientY+10+'px';
  function mv(ev){
    dragGhost.style.left=ev.clientX+10+'px';
    dragGhost.style.top=ev.clientY+10+'px';
    dragGhost.style.borderColor=hit(viewPane,ev.clientX,ev.clientY)?'#67d4a8':'#8ac9fb';
    $$('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    var q=findContainer(ev.clientX,ev.clientY,null);
    if(q) q.classList.add('drop-target');
  }
  function up(ev){
    window.removeEventListener('pointermove',mv);
    dragGhost.style.display='none';
    $$('.drop-target').forEach(function(x){x.classList.remove('drop-target');});
    if(hit(viewPane,ev.clientX,ev.clientY)){
      state.ignorePaletteClick=true;
      setTimeout(function(){state.ignorePaletteClick=false;},0);
      var q=findContainer(ev.clientX,ev.clientY,null);
      var r=(q||root).getBoundingClientRect();
      createNode(type,ev.clientX-r.left-45,ev.clientY-r.top-20,q||root);
    }
  }
  window.addEventListener('pointermove',mv);
  window.addEventListener('pointerup',up,{once:true});
}
function contentTarget(el){ return el ? (el.querySelector('.vf-content')||el) : null; }
function getText(el){
  if(!el) return '';
  if(el.dataset.stringKey && state.strings[el.dataset.stringKey]!=null) return state.strings[el.dataset.stringKey];
  var t=contentTarget(el);
  if(el.dataset.type==='input'||el.dataset.type==='textarea') return t.value||'';
  if(el.dataset.type==='checkbox'){
    var c=el.querySelector('.vf-check-label');
    return c?c.textContent:'';
  }
  if(['select','progress','divider','image','card','linear-h','linear-v','relative','scroll'].indexOf(el.dataset.type)>=0) return '';
  return t.textContent||'';
}
function setText(el,value){
  if(!el) return;
  var t=contentTarget(el);
  if(el.dataset.type==='input'||el.dataset.type==='textarea') t.value=value;
  else if(el.dataset.type==='checkbox'){
    var c=el.querySelector('.vf-check-label');
    if(c)c.textContent=value;
  }else if(['select','progress','divider','image','card','linear-h','linear-v','relative','scroll'].indexOf(el.dataset.type)<0){
    t.textContent=value;
  }
}
function textPlaceholder(el){
  var t=contentTarget(el);
  return t && 'placeholder' in t ? t.placeholder : '';
}
function refreshStringsOnDom(){
  $$('.vf-node[data-string-key]').forEach(function(el){
    var k=el.dataset.stringKey;
    if(state.strings[k]!=null) setText(el,state.strings[k]);
  });
}
function applyCustomCss(el,css){
  var t=contentTarget(el);
  if(!t)return;
  t.dataset.customCss=css||'';
  if(!css)return;
  css.split(';').forEach(function(pair){
    var i=pair.indexOf(':');
    if(i>0){
      var k=pair.slice(0,i).trim(),v=pair.slice(i+1).trim();
      if(k&&v)try{t.style.setProperty(k,v);}catch(e){}
    }
  });
}
