(function(){
'use strict';

/*
 * Sketchware typed sockets for Brotware native logic.
 *
 * This module deliberately layers on top of the existing block model instead
 * of replacing it. Reporter/value blocks live inside parentBlock.inputs and
 * their compiled primitive value is mirrored back into parentBlock.props so
 * the existing interpreter/export runtime keeps working unchanged.
 */

var overlay=null,flow=null,paletteScroll=null;
var socketDrag=null,ghost=null;
var observer=null,queued=false;

var REPORTERS={
  string:{type:'valueString',output:'string',label:'string',color:'#00b85a'},
  number:{type:'valueNumber',output:'number',label:'number',color:'#18b8ad'},
  boolean:{type:'valueBoolean',output:'boolean',label:'boolean',color:'#00b85a'},
  variable:{type:'getVarValue',output:'any',label:'variable',color:'#ed7445'},
  compare:{type:'compareValue',output:'boolean',label:'compare',color:'#00b85a'}
};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function reporterDef(type){
  var keys=Object.keys(REPORTERS);
  for(var i=0;i<keys.length;i++)if(REPORTERS[keys[i]].type===type)return REPORTERS[keys[i]];
  return null;
}
function isReporter(block){return !!(block&&reporterDef(block.type));}
function outputType(block){var d=reporterDef(block&&block.type);return d?d.output:'statement';}
function createReporter(kind){
  var d=REPORTERS[kind]||REPORTERS.string;
  var b={id:(typeof uid==='function'?uid('value'):'value_'+Date.now()+'_'+Math.random().toString(36).slice(2)),type:d.type,props:{},children:[],elseChildren:[],inputs:{}};
  if(kind==='string')b.props.value='texto';
  else if(kind==='number')b.props.value='0';
  else if(kind==='boolean')b.props.value='true';
  else if(kind==='variable')b.props.name=(typeof firstVariableName==='function'?firstVariableName():'counter');
  else if(kind==='compare')b.props={left:'$'+(typeof firstVariableName==='function'?firstVariableName():'counter'),op:'>',right:'0'};
  return b;
}

function ensureInputs(block){if(block&&!block.inputs)block.inputs={};return block?block.inputs:{};}
function ensureFallbacks(block){if(block&&!block.__inputFallbacks)block.__inputFallbacks={};return block?block.__inputFallbacks:{};}

function specsFor(block){
  if(!block)return[];
  var p=block.props||{};
  switch(block.type){
    case 'if':return[{key:'condition',accepts:['boolean','any'],shape:'boolean',fallback:String(p.left==null?'':p.left)+' '+String(p.op||'==')+' '+String(p.right==null?'':p.right),special:'condition'}];
    case 'repeat':return[{key:'count',prop:'count',accepts:['number','any'],shape:'number',fallback:p.count}];
    case 'wait':return[{key:'ms',prop:'ms',accepts:['number','any'],shape:'number',fallback:p.ms}];
    case 'setVar':return[{key:'value',prop:'value',accepts:['string','number','boolean','any'],shape:'string',fallback:p.value}];
    case 'math':return[
      {key:'left',prop:'left',accepts:['number','any'],shape:'number',fallback:p.left},
      {key:'right',prop:'right',accepts:['number','any'],shape:'number',fallback:p.right}
    ];
    case 'setText':return[{key:'value',prop:'value',accepts:['string','number','boolean','any'],shape:'string',fallback:p.value}];
    case 'setValue':return[{key:'value',prop:'value',accepts:['string','number','boolean','any'],shape:'string',fallback:p.value}];
    case 'setStyle':return[{key:'value',prop:'value',accepts:['string','number','any'],shape:'string',fallback:p.value}];
    case 'navigate':return[{key:'url',prop:'url',accepts:['string','any'],shape:'string',fallback:p.url}];
    case 'alert':return[{key:'message',prop:'message',accepts:['string','number','boolean','any'],shape:'string',fallback:p.message}];
    case 'console':return[{key:'message',prop:'message',accepts:['string','number','boolean','any'],shape:'string',fallback:p.message}];
    case 'storageSet':return[
      {key:'key',prop:'key',accepts:['string','any'],shape:'string',fallback:p.key},
      {key:'value',prop:'value',accepts:['string','number','boolean','any'],shape:'string',fallback:p.value}
    ];
    case 'storageGet':return[{key:'key',prop:'key',accepts:['string','any'],shape:'string',fallback:p.key}];
    case 'storageRemove':return[{key:'key',prop:'key',accepts:['string','any'],shape:'string',fallback:p.key}];
    case 'fetch':return[
      {key:'url',prop:'url',accepts:['string','any'],shape:'string',fallback:p.url},
      {key:'body',prop:'body',accepts:['string','number','boolean','any'],shape:'string',fallback:p.body||'',hidden:true}
    ];
    case 'compareValue':return[
      {key:'left',prop:'left',accepts:['string','number','boolean','any'],shape:'string',fallback:p.left},
      {key:'right',prop:'right',accepts:['string','number','boolean','any'],shape:'string',fallback:p.right}
    ];
    default:return[];
  }
}
function specByKey(block,key){var a=specsFor(block);for(var i=0;i<a.length;i++)if(a[i].key===key)return a[i];return null;}

function walkModel(list,fn,parentInput){
  (list||[]).forEach(function(b){
    fn(b,parentInput||null);
    var inputs=ensureInputs(b);
    Object.keys(inputs).forEach(function(k){if(inputs[k])walkInput(inputs[k],fn,{owner:b,key:k});});
    walkModel(b.children||[],fn,null);walkModel(b.elseChildren||[],fn,null);
  });
}
function walkInput(block,fn,parentInput){
  if(!block)return;fn(block,parentInput||null);
  var inputs=ensureInputs(block);
  Object.keys(inputs).forEach(function(k){if(inputs[k])walkInput(inputs[k],fn,{owner:block,key:k});});
}
function findModel(id){
  var result=null;
  if(typeof activeBlocks!=='function')return null;
  walkModel(activeBlocks(),function(b,parentInput){if(!result&&String(b.id)===String(id))result={block:b,parentInput:parentInput};});
  return result;
}
function containsReporter(root,id){
  if(!root)return false;if(String(root.id)===String(id))return true;
  var found=false,inputs=ensureInputs(root);Object.keys(inputs).forEach(function(k){if(!found&&inputs[k])found=containsReporter(inputs[k],id);});return found;
}

function compileReporter(block){
  if(!block)return'';
  var p=block.props||{};
  if(block.type==='valueString')return String(p.value==null?'':p.value);
  if(block.type==='valueNumber')return String(p.value==null?'0':p.value);
  if(block.type==='valueBoolean')return String(p.value).toLowerCase()==='false'?'false':'true';
  if(block.type==='getVarValue')return '$'+String(p.name||'counter');
  return '';
}
function captureFallback(owner,spec){
  var f=ensureFallbacks(owner);if(Object.prototype.hasOwnProperty.call(f,spec.key))return;
  var p=owner.props||{};
  if(spec.special==='condition')f[spec.key]={left:p.left,op:p.op,right:p.right};
  else f[spec.key]=p[spec.prop];
}
function restoreFallback(owner,spec){
  var f=ensureFallbacks(owner),p=owner.props||{};
  if(!Object.prototype.hasOwnProperty.call(f,spec.key))return;
  if(spec.special==='condition'){
    var old=f[spec.key]||{};p.left=old.left;p.op=old.op;p.right=old.right;
  }else p[spec.prop]=f[spec.key];
}
function syncInput(owner,spec){
  if(!owner||!spec)return;var child=ensureInputs(owner)[spec.key],p=owner.props||{};
  if(!child){restoreFallback(owner,spec);return;}
  if(spec.special==='condition'){
    if(child.type==='compareValue'){
      syncReporter(child);
      p.left=String(child.props.left==null?'':child.props.left);p.op=child.props.op||'==';p.right=String(child.props.right==null?'':child.props.right);
    }else{
      p.left=compileReporter(child);p.op='truthy';p.right='';
    }
  }else{
    syncReporter(child);p[spec.prop]=compileReporter(child);
  }
}
function syncReporter(block){
  if(!block)return;var specs=specsFor(block);for(var i=0;i<specs.length;i++)syncInput(block,specs[i]);
}
function syncAll(){
  if(typeof activeBlocks!=='function')return;
  walkModel(activeBlocks(),function(b){var specs=specsFor(b);for(var i=0;i<specs.length;i++)syncInput(b,specs[i]);});
}

function compatible(child,parent,spec){
  if(!child||!parent||!spec)return false;
  var out=outputType(child),accepts=spec.accepts||[];
  if(child.type==='compareValue'&&!(parent.type==='if'&&spec.key==='condition'))return false;
  if(out==='any')return true;
  return accepts.indexOf(out)>=0||accepts.indexOf('any')>=0;
}
function attach(parentId,key,child){
  var f=findModel(parentId);if(!f)return false;var parent=f.block,spec=specByKey(parent,key);if(!spec||!compatible(child,parent,spec))return false;
  if(containsReporter(child,parentId))return false;
  captureFallback(parent,spec);ensureInputs(parent)[key]=child;syncInput(parent,spec);return true;
}
function detachReporter(id){
  var f=findModel(id);if(!f||!f.parentInput)return null;var rel=f.parentInput,owner=rel.owner,spec=specByKey(owner,rel.key);ensureInputs(owner)[rel.key]=null;if(spec)restoreFallback(owner,spec);return f.block;
}

function menu(v,kind){return '<span class="sw2-socket menu'+(kind==='view'?' view':'')+'">'+esc(v==null?'':v)+'</span>';}
function word(v){return '<span class="sw2-word">'+esc(v)+'</span>';}
function fallbackSocket(owner,spec){
  var val=spec.fallback;
  if(spec.special==='condition')val=String((owner.props||{}).left==null?'':(owner.props||{}).left)+' '+String((owner.props||{}).op||'==')+' '+String((owner.props||{}).right==null?'':(owner.props||{}).right);
  else if(spec.prop)val=(owner.props||{})[spec.prop];
  return '<span class="sw3-empty-socket '+esc(spec.shape||'string')+'">'+esc(val==null?'':val)+'</span>';
}
function socketHost(owner,key){
  var spec=specByKey(owner,key);if(!spec)return'';var child=ensureInputs(owner)[key];
  return '<span class="sw3-input-host '+esc(spec.shape||'string')+'" data-sw3-parent="'+esc(owner.id)+'" data-sw3-key="'+esc(key)+'" data-sw3-accepts="'+esc((spec.accepts||[]).join(','))+'">'+(child?renderReporter(child):fallbackSocket(owner,spec))+'</span>';
}
function renderReporter(b){
  var p=b.props||{},d=reporterDef(b.type)||REPORTERS.string,h='';
  if(b.type==='valueString')h=esc(p.value==null?'':p.value);
  else if(b.type==='valueNumber')h=esc(p.value==null?'0':p.value);
  else if(b.type==='valueBoolean')h=esc(String(p.value).toLowerCase()==='false'?'false':'true');
  else if(b.type==='getVarValue')h=esc(p.name||'counter')+' <span class="sw3-mini-arrow">▼</span>';
  else if(b.type==='compareValue')h=socketHost(b,'left')+'<span class="sw3-compare-op">'+esc(p.op||'==')+'</span>'+socketHost(b,'right');
  return '<span class="sw3-reporter '+esc(d.output)+' type-'+esc(b.type)+'" data-value-block-id="'+esc(b.id)+'" style="--sw3-reporter-color:'+esc(d.color)+'">'+h+'</span>';
}
function markupForStatement(b){
  var p=b.props||{};
  switch(b.type){
    case 'if':return word('if')+socketHost(b,'condition')+word('then');
    case 'repeat':return word('repeat')+socketHost(b,'count');
    case 'wait':return word('wait')+socketHost(b,'ms')+word('ms');
    case 'setVar':return word('set')+menu(p.name||'String :')+word('to')+socketHost(b,'value');
    case 'math':return word('set')+menu(p.name||'Number :')+word('to')+socketHost(b,'left')+word(p.op||'+')+socketHost(b,'right');
    case 'readInput':return word('read')+menu(p.source,'view')+word('into')+menu(p.name);
    case 'setText':return word('set text')+menu(p.target,'view')+word('to')+socketHost(b,'value');
    case 'setValue':return word('set value')+menu(p.target,'view')+word('to')+socketHost(b,'value');
    case 'setStyle':return word('set')+menu(p.target,'view')+word(p.property||'style')+word('to')+socketHost(b,'value');
    case 'show':return word('show')+menu(p.target,'view');
    case 'hide':return word('hide')+menu(p.target,'view');
    case 'toggle':return word('toggle')+menu(p.target,'view');
    case 'navigate':return word('open page')+socketHost(b,'url');
    case 'alert':return word('show message')+socketHost(b,'message');
    case 'console':return word('console log')+socketHost(b,'message');
    case 'storageSet':return word('save')+socketHost(b,'key')+word('to')+socketHost(b,'value');
    case 'storageGet':return word('read')+socketHost(b,'key')+word('into')+menu(p.name);
    case 'storageRemove':return word('remove')+socketHost(b,'key');
    case 'fetch':return word('HTTP')+menu(p.method||'GET')+socketHost(b,'url')+word('to')+menu(p.saveVar);
    default:return null;
  }
}

function decorateStatements(){
  if(!flow)return;
  flow.querySelectorAll('.sw-block[data-block-id]').forEach(function(el){
    var f=findModel(el.dataset.blockId);if(!f||isReporter(f.block))return;var b=f.block;
    var sig=b.type+'|'+JSON.stringify(b.props||{})+'|'+JSON.stringify(b.inputs||{});if(el.dataset.sw3SocketSig===sig)return;
    el.dataset.sw3SocketSig=sig;var main=el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main');if(!main)return;
    var name=main.querySelector('.sw-block-name'),h=markupForStatement(b);if(name&&h!=null)name.innerHTML=h;
  });
}
function activeCategory(){var a=overlay&&overlay.querySelector('.sw-cat.active');return a?a.dataset.swCat:'';}
function paletteReporter(kind,text){var d=REPORTERS[kind];return '<button type="button" class="sw3-reporter-palette" data-sw3-template="'+kind+'" style="--sw3-reporter-color:'+d.color+'">'+renderReporter(createReporter(kind)).replace(/data-value-block-id="[^"]+"/,'')+'</button>';}
function decoratePalette(){
  if(!paletteScroll)return;var cat=activeCategory();if(!cat)return;
  paletteScroll.querySelectorAll('.sw3-reporter-palette').forEach(function(x){x.remove();});
  var wrap=document.createElement('div');wrap.className='sw3-reporter-palette-list';
  var html='';
  if(cat==='operator')html+=paletteReporter('boolean')+paletteReporter('compare');
  if(cat==='math')html+=paletteReporter('number');
  if(cat==='strings')html+=paletteReporter('string');
  if(cat==='var')html+=paletteReporter('variable');
  if(!html)return;wrap.innerHTML=html;paletteScroll.appendChild(wrap);
}
function decorate(){decorateStatements();decoratePalette();}
function queueDecorate(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decorate();});}

function makeGhost(block){
  if(!ghost){ghost=document.createElement('div');ghost.className='sw3-socket-drag-ghost';document.body.appendChild(ghost);}ghost.innerHTML=renderReporter(block);ghost.classList.add('show');
}
function hideGhost(){if(ghost)ghost.classList.remove('show');}
function clearHot(){if(!overlay)return;overlay.querySelectorAll('.sw3-input-host.hot,.sw3-input-host.bad').forEach(function(x){x.classList.remove('hot','bad');});}
function socketFromPoint(x,y,block){
  var el=document.elementFromPoint(x,y);if(!el)return null;var host=el.closest('.sw3-input-host');if(!host||!overlay.contains(host))return null;
  var parent=findModel(host.dataset.sw3Parent);if(!parent)return null;var spec=specByKey(parent.block,host.dataset.sw3Key);if(!spec)return null;
  if(socketDrag&&socketDrag.block&&containsReporter(socketDrag.block,parent.block.id))return null;
  if(!compatible(block,parent.block,spec)){host.classList.add('bad');return null;}return host;
}
function updateSocketDrag(x,y){
  if(!socketDrag)return;socketDrag.x=x;socketDrag.y=y;if(ghost){ghost.style.left=(x+13)+'px';ghost.style.top=(y+13)+'px';}clearHot();var host=socketFromPoint(x,y,socketDrag.block);if(host){host.classList.add('hot');socketDrag.target=host;}else socketDrag.target=null;
}
function beginSocketDrag(block,pointerId,x,y,captureEl,source){
  socketDrag={block:block,pointerId:pointerId,x:x,y:y,captureEl:captureEl,source:source||null,target:null};makeGhost(block);document.body.classList.add('sw3-socket-dragging');
  try{captureEl.setPointerCapture(pointerId);}catch(_){}
  updateSocketDrag(x,y);window.addEventListener('pointermove',socketMove,true);window.addEventListener('pointerup',socketUp,true);window.addEventListener('pointercancel',socketCancel,true);
}
function socketMove(e){if(!socketDrag||e.pointerId!==socketDrag.pointerId)return;e.preventDefault();updateSocketDrag(e.clientX,e.clientY);}
function socketUp(e){if(!socketDrag||e.pointerId!==socketDrag.pointerId)return;e.preventDefault();finishSocketDrag(false);}
function socketCancel(e){if(!socketDrag||e.pointerId!==socketDrag.pointerId)return;finishSocketDrag(true);}
function finishSocketDrag(cancelled){
  if(!socketDrag)return;var d=socketDrag;window.removeEventListener('pointermove',socketMove,true);window.removeEventListener('pointerup',socketUp,true);window.removeEventListener('pointercancel',socketCancel,true);
  try{d.captureEl.releasePointerCapture(d.pointerId);}catch(_){}clearHot();hideGhost();document.body.classList.remove('sw3-socket-dragging');socketDrag=null;
  if(cancelled||!d.target)return;
  var parentId=d.target.dataset.sw3Parent,key=d.target.dataset.sw3Key;
  if(d.source&&String(d.source.parentId)===String(parentId)&&d.source.key===key)return;
  var oldOwner=d.source?findModel(d.source.parentId):null,oldChild=null;
  if(d.source&&oldOwner){oldChild=ensureInputs(oldOwner.block)[d.source.key];ensureInputs(oldOwner.block)[d.source.key]=null;var oldSpec=specByKey(oldOwner.block,d.source.key);if(oldSpec)restoreFallback(oldOwner.block,oldSpec);}
  if(!attach(parentId,key,d.block)){
    if(d.source&&oldOwner&&oldChild){ensureInputs(oldOwner.block)[d.source.key]=oldChild;var os=specByKey(oldOwner.block,d.source.key);if(os)syncInput(oldOwner.block,os);}return;
  }
  syncAll();if(typeof saveLogic==='function')saveLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();queueDecorate();
}
function longPress(e,blockFactory,source){
  if(e.pointerType==='mouse'&&e.button!==0)return;var target=e.target,pid=e.pointerId,sx=e.clientX,sy=e.clientY,done=false;
  var timer=setTimeout(function(){if(done)return;done=true;var b=blockFactory();if(b)beginSocketDrag(b,pid,sx,sy,target,source);cleanup();},170);
  function move(ev){if(ev.pointerId!==pid||done)return;if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8){clearTimeout(timer);done=true;cleanup();}}
  function up(ev){if(ev.pointerId!==pid||done)return;clearTimeout(timer);done=true;cleanup();}
  function cancel(ev){if(ev.pointerId!==pid)return;clearTimeout(timer);done=true;cleanup();}
  function cleanup(){window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);}
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);
}

function editReporter(block){
  if(!block)return;var p=block.props||{},v;
  if(block.type==='valueString'){v=prompt('Texto:',String(p.value==null?'':p.value));if(v===null)return;p.value=v;}
  else if(block.type==='valueNumber'){v=prompt('Número:',String(p.value==null?'0':p.value));if(v===null)return;if(v.trim()===''||isNaN(Number(v))){if(typeof toast==='function')toast('Digite um número válido');return;}p.value=v;}
  else if(block.type==='valueBoolean'){p.value=String(p.value).toLowerCase()==='false'?'true':'false';}
  else if(block.type==='getVarValue'){
    var names=Object.keys((window.state&&state.variables)||{}),msg='Variável'+(names.length?' ('+names.join(', ')+')':'')+':';v=prompt(msg,p.name||'counter');if(v===null)return;p.name=v.trim()||p.name;
  }else if(block.type==='compareValue'){
    v=prompt('Operador: ==, !=, >, <, >=, <=',p.op||'>');if(v===null)return;if(['==','!=','>','<','>=','<='].indexOf(v.trim())<0){if(typeof toast==='function')toast('Operador inválido');return;}p.op=v.trim();
  }
  syncAll();if(typeof saveLogic==='function')saveLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();queueDecorate();
}

function pointerDownCapture(e){
  var paletteItem=e.target.closest('.sw3-reporter-palette[data-sw3-template]');
  if(paletteItem){e.stopImmediatePropagation();var kind=paletteItem.dataset.sw3Template;longPress(e,function(){return createReporter(kind);},null);return;}
  var reporter=e.target.closest('.sw3-reporter[data-value-block-id]');
  if(reporter&&flow&&flow.contains(reporter)){
    e.stopImmediatePropagation();var id=reporter.dataset.valueBlockId,f=findModel(id);if(!f||!f.parentInput)return;
    longPress(e,function(){return f.block;},{parentId:f.parentInput.owner.id,key:f.parentInput.key});
  }
}
function clickCapture(e){
  var paletteItem=e.target.closest('.sw3-reporter-palette[data-sw3-template]');if(paletteItem){e.preventDefault();e.stopImmediatePropagation();if(typeof toast==='function')toast('Segure e arraste o bloco até uma entrada compatível.');return;}
  var reporter=e.target.closest('.sw3-reporter[data-value-block-id]');if(reporter&&flow&&flow.contains(reporter)){e.preventDefault();e.stopImmediatePropagation();var f=findModel(reporter.dataset.valueBlockId);if(f)editReporter(f.block);}
}

function install(){
  overlay=document.getElementById('swLogicOverlay');if(!overlay){setTimeout(install,180);return;}
  flow=document.getElementById('swFlow');paletteScroll=document.getElementById('swPaletteScroll');if(!flow||!paletteScroll){setTimeout(install,180);return;}
  if(overlay.dataset.swTypedSockets==='1'){queueDecorate();return;}overlay.dataset.swTypedSockets='1';
  overlay.addEventListener('pointerdown',pointerDownCapture,true);overlay.addEventListener('click',clickCapture,true);
  observer=new MutationObserver(queueDecorate);observer.observe(overlay,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  syncAll();queueDecorate();window.addEventListener('brotware:logic-refresh',queueDecorate);
}

window.BrotwareTypedSockets={
  refresh:function(){syncAll();queueDecorate();},
  createReporter:createReporter,
  findModel:findModel,
  attach:attach,
  detach:detachReporter,
  sync:syncAll
};
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
})();
