(function(){
'use strict';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function clsValue(v){var s=String(v==null?'':v).trim();if(/^\$/.test(s))return'menu';if(/^(?:true|false)$/i.test(s))return'boolean';if(s!==''&&!isNaN(Number(s)))return'number';return'string';}
function socket(v,type){type=type||clsValue(v);var extra=type==='view'?' menu view':type==='menu'?' menu':'';return'<span class="sw2-socket '+type+extra+'">'+esc(v==null?'':v)+'</span>';}
function word(v){return'<span class="sw2-word">'+esc(v)+'</span>';}
function selector(v,type){return socket(v,type||'menu');}
function boolExpr(p){return socket(String(p.left==null?'':p.left)+' '+String(p.op||'==')+' '+String(p.right==null?'':p.right),'boolean');}
function fnName(block){
  if(block.type!=='callFunction')return'';
  var id=block.props&&block.props.functionId||'',name='More Block';
  try{var f=(state.functions||[]).find(function(x){return x.id===id;});if(f&&f.name)name=f.name;}catch(_){}
  return name;
}
function blockMarkup(b){
  var p=b.props||{};
  switch(b.type){
    case 'if':return word('if')+boolExpr(p)+word('then');
    case 'repeat':return word('repeat')+socket(p.count,'number');
    case 'wait':return word('wait')+socket(p.ms,'number')+word('ms');
    case 'setVar':return word('set')+selector(p.name)+word('to')+socket(p.value);
    case 'math':return word('set')+selector(p.name)+word('to')+socket(p.left)+word(p.op||'+')+socket(p.right);
    case 'readInput':return word('read')+selector(p.source,'view')+word('into')+selector(p.name);
    case 'setText':return word('set text')+selector(p.target,'view')+word('to')+socket(p.value);
    case 'setValue':return word('set value')+selector(p.target,'view')+word('to')+socket(p.value);
    case 'setStyle':return word('set')+selector(p.target,'view')+socket(p.property,'string')+word('to')+socket(p.value);
    case 'show':return word('show')+selector(p.target,'view');
    case 'hide':return word('hide')+selector(p.target,'view');
    case 'toggle':return word('toggle')+selector(p.target,'view');
    case 'navigate':return word('open page')+socket(p.url,'string');
    case 'alert':return word('show message')+socket(p.message,'string');
    case 'console':return word('console log')+socket(p.message);
    case 'storageSet':return word('save')+socket(p.key,'string')+word('to')+socket(p.value);
    case 'storageGet':return word('read')+socket(p.key,'string')+word('into')+selector(p.name);
    case 'storageRemove':return word('remove')+socket(p.key,'string');
    case 'fetch':return word('HTTP')+socket(p.method,'string')+socket(p.url,'string')+word('to')+selector(p.saveVar);
    case 'callFunction':return word(fnName(b));
    default:
      try{var m=window.BLOCK_META&&BLOCK_META[b.type];return word(m&&m.name?m.name:b.type);}catch(_){return word(b.type);}
  }
}
function decorateBlock(el){
  var id=el.dataset.blockId,found=typeof findBlock==='function'?findBlock(id):null,b=found&&found.block;if(!b)return;
  var sig=b.type+'|'+JSON.stringify(b.props||{})+'|'+JSON.stringify((b.elseChildren||[]).length);
  if(el.dataset.swV2Sig===sig)return;el.dataset.swV2Sig=sig;
  el.classList.remove('sw-v2-command','sw-v2-control','sw-v2-if','sw-v2-repeat');
  if(b.type==='if'){el.classList.add('sw-v2-control','sw-v2-if');}
  else if(b.type==='repeat'){el.classList.add('sw-v2-control','sw-v2-repeat');}
  else el.classList.add('sw-v2-command');
  var main=el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main');if(!main)return;
  var name=main.querySelector('.sw-block-name');if(name)name.innerHTML=blockMarkup(b);
  var summary=main.querySelector('.sw-block-summary');if(summary)summary.style.display='none';
}
function paletteMarkup(type){
  switch(type){
    case 'if':return word('if')+socket('','boolean')+word('then');
    case 'repeat':return word('repeat')+socket('','number');
    case 'wait':return word('wait')+socket('','number')+word('ms');
    case 'setVar':return word('set')+selector('String :')+word('to')+socket('','string');
    case 'math':return word('set')+selector('number :')+word('to')+socket('','number')+word('+')+socket('','number');
    case 'readInput':return word('read')+selector('View','view')+word('into')+selector('Variable');
    case 'setText':return word('set text')+selector('View','view')+word('to')+socket('','string');
    case 'setValue':return word('set value')+selector('View','view')+word('to')+socket('','string');
    case 'setStyle':return word('set style')+selector('View','view')+socket('property','string')+word('to')+socket('','string');
    case 'show':return word('show')+selector('View','view');
    case 'hide':return word('hide')+selector('View','view');
    case 'toggle':return word('toggle')+selector('View','view');
    case 'navigate':return word('open page')+socket('','string');
    case 'alert':return word('show message')+socket('','string');
    case 'console':return word('console log')+socket('','string');
    case 'storageSet':return word('save')+socket('key','string')+word('to')+socket('','string');
    case 'storageGet':return word('read')+socket('key','string')+word('into')+selector('Variable');
    case 'storageRemove':return word('remove')+socket('key','string');
    case 'fetch':return word('HTTP')+socket('GET','string')+socket('url','string');
    case 'callFunction':return word('More Block');
    default:return null;
  }
}
function decoratePalette(el){
  var type=el.dataset.swType||'';if(!type)return;
  var sig=type;if(el.dataset.swV2PaletteSig===sig)return;el.dataset.swV2PaletteSig=sig;
  el.classList.remove('sw-v2-palette-command','sw-v2-palette-control');
  el.classList.add(type==='if'||type==='repeat'?'sw-v2-palette-control':'sw-v2-palette-command');
  var b=el.querySelector('b');var h=paletteMarkup(type);if(b&&h)b.innerHTML=h;
}
function decorateEvent(){
  var root=document.querySelector('#swLogicOverlay .sw-event-root');if(!root)return;
  var txt=String(root.textContent||'').trim();
  if(/^@page\s*→\s*load$/i.test(txt)||/^page\s*→\s*load$/i.test(txt))root.textContent='on activity create';
}
function decorate(){
  var ov=document.getElementById('swLogicOverlay');if(!ov)return;
  ov.querySelectorAll('.sw-block[data-block-id]').forEach(decorateBlock);
  ov.querySelectorAll('.sw-palette-item[data-sw-type]').forEach(decoratePalette);
  decorateEvent();
}
function install(){
  var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(install,180);return;}
  decorate();if(ov.dataset.swLayoutV2Observer==='1')return;ov.dataset.swLayoutV2Observer='1';
  var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decorate();});}).observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('brotware:logic-refresh',decorate);
}
window.BrotwareSketchwareLayoutV2={refresh:decorate};
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1300);
})();
