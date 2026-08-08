(function(){
'use strict';

/*
 * Connectable sockets for the extra/list/standard Sketchware-style blocks.
 * The original typed-socket engine knows the core Brotware blocks. This layer
 * extends it without changing project persistence: connected reporter blocks
 * still live in block.inputs and primitive values are mirrored into props.
 */

var SPECS={
  listAdd:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  listRemove:[{key:'index',prop:'index',shape:'number',accepts:['number','any']}],
  listGet:[{key:'index',prop:'index',shape:'number',accepts:['number','any']}],

  changeVar:[{key:'delta',prop:'delta',shape:'number',accepts:['number','any']}],
  listInsert:[
    {key:'index',prop:'index',shape:'number',accepts:['number','any']},
    {key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}
  ],
  listSet:[
    {key:'index',prop:'index',shape:'number',accepts:['number','any']},
    {key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}
  ],
  listContains:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  listIndexOf:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  listJoin:[{key:'separator',prop:'separator',shape:'string',accepts:['string','any']}],

  randomNumber:[
    {key:'min',prop:'min',shape:'number',accepts:['number','any']},
    {key:'max',prop:'max',shape:'number',accepts:['number','any']}
  ],
  roundNumber:[{key:'value',prop:'value',shape:'number',accepts:['number','any']}],
  absNumber:[{key:'value',prop:'value',shape:'number',accepts:['number','any']}],
  powerNumber:[
    {key:'base',prop:'base',shape:'number',accepts:['number','any']},
    {key:'exponent',prop:'exponent',shape:'number',accepts:['number','any']}
  ],
  sqrtNumber:[{key:'value',prop:'value',shape:'number',accepts:['number','any']}],

  logicNot:[{key:'value',prop:'value',shape:'boolean',accepts:['boolean','any']}],
  logicAnd:[
    {key:'left',prop:'left',shape:'boolean',accepts:['boolean','any']},
    {key:'right',prop:'right',shape:'boolean',accepts:['boolean','any']}
  ],
  logicOr:[
    {key:'left',prop:'left',shape:'boolean',accepts:['boolean','any']},
    {key:'right',prop:'right',shape:'boolean',accepts:['boolean','any']}
  ],

  textJoin:[
    {key:'left',prop:'left',shape:'string',accepts:['string','number','boolean','any']},
    {key:'right',prop:'right',shape:'string',accepts:['string','number','boolean','any']}
  ],
  textLength:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  textReplace:[
    {key:'value',prop:'value',shape:'string',accepts:['string','any']},
    {key:'search',prop:'search',shape:'string',accepts:['string','any']},
    {key:'replacement',prop:'replacement',shape:'string',accepts:['string','number','boolean','any']}
  ],
  textUpper:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  textLower:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  textTrim:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  textSubstring:[
    {key:'value',prop:'value',shape:'string',accepts:['string','any']},
    {key:'start',prop:'start',shape:'number',accepts:['number','any']},
    {key:'end',prop:'end',shape:'number',accepts:['number','any']}
  ],

  setAttribute:[
    {key:'attr',prop:'name',shape:'string',accepts:['string','any']},
    {key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}
  ],
  removeAttribute:[{key:'attr',prop:'name',shape:'string',accepts:['string','any']}],
  addClass:[{key:'className',prop:'className',shape:'string',accepts:['string','any']}],
  removeClass:[{key:'className',prop:'className',shape:'string',accepts:['string','any']}],
  copyClipboard:[{key:'value',prop:'value',shape:'string',accepts:['string','number','boolean','any']}],
  vibrate:[{key:'ms',prop:'ms',shape:'number',accepts:['number','any']}]
};

var observer=null,queued=false,patched=false;

function graph(){return window.BrotwareBlockGraph||null;}
function typed(){return window.BrotwareTypedSockets||null;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function ensureInputs(b){if(b&&!b.inputs)b.inputs={};return b?b.inputs:{};}
function ensureFallbacks(b){if(b&&!b.__inputFallbacks)b.__inputFallbacks={};return b?b.__inputFallbacks:{};}
function specsFor(b){return b?(SPECS[b.type]||[]):[];}
function specByKey(b,key){var a=specsFor(b);for(var i=0;i<a.length;i++)if(a[i].key===key)return a[i];return null;}
function isExtended(b){return !!(b&&Object.prototype.hasOwnProperty.call(SPECS,b.type));}
function findBlockById(id){var g=graph();return g&&g.find?g.find(id):null;}

function reporterOutput(b){
  if(!b)return'statement';
  if(b.type==='valueString')return'string';
  if(b.type==='valueNumber')return'number';
  if(b.type==='valueBoolean')return'boolean';
  if(b.type==='getVarValue')return'any';
  if(b.type==='compareValue')return'boolean';
  return'statement';
}
function reporterValue(b){
  if(!b)return'';
  var p=b.props||{};
  if(b.type==='valueString')return String(p.value==null?'':p.value);
  if(b.type==='valueNumber')return String(p.value==null?'0':p.value);
  if(b.type==='valueBoolean')return String(p.value).toLowerCase()==='false'?'false':'true';
  if(b.type==='getVarValue')return '$'+String(p.name||'counter');
  return'';
}
function compatible(child,spec){
  if(!child||!spec)return false;
  var out=reporterOutput(child),a=spec.accepts||[];
  if(out==='statement'||child.type==='compareValue')return false;
  return out==='any'||a.indexOf('any')>=0||a.indexOf(out)>=0;
}
function captureFallback(parent,spec){
  var f=ensureFallbacks(parent);
  if(Object.prototype.hasOwnProperty.call(f,spec.key))return;
  f[spec.key]=(parent.props||{})[spec.prop];
}
function restoreFallback(parent,spec){
  var f=ensureFallbacks(parent);
  if(!Object.prototype.hasOwnProperty.call(f,spec.key))return;
  if(!parent.props)parent.props={};
  parent.props[spec.prop]=f[spec.key];
}
function syncInput(parent,spec){
  if(!parent||!spec)return;
  var child=ensureInputs(parent)[spec.key];
  if(!child){restoreFallback(parent,spec);return;}
  if(!parent.props)parent.props={};
  parent.props[spec.prop]=reporterValue(child);
}
function syncBlock(b){
  var specs=specsFor(b);for(var i=0;i<specs.length;i++)syncInput(b,specs[i]);
}
function walk(list,fn){
  (list||[]).forEach(function(b){
    fn(b);
    var inputs=ensureInputs(b);
    Object.keys(inputs).forEach(function(k){if(inputs[k])walkInput(inputs[k],fn);});
    walk(b.children||[],fn);walk(b.elseChildren||[],fn);
  });
}
function walkInput(b,fn){
  if(!b)return;fn(b);var inputs=ensureInputs(b);
  Object.keys(inputs).forEach(function(k){if(inputs[k])walkInput(inputs[k],fn);});
}
function syncAll(){try{if(typeof activeBlocks==='function')walk(activeBlocks(),function(b){if(isExtended(b))syncBlock(b);});}catch(_){}}

function menu(v,kind){return '<span class="sw2-socket menu'+(kind==='view'?' view':'')+'">'+esc(v==null?'':v)+'</span>';}
function word(v){return '<span class="sw2-word">'+esc(v)+'</span>';}
function fallbackSocket(parent,spec){
  var v=(parent.props||{})[spec.prop];
  return '<span class="sw3-empty-socket '+esc(spec.shape||'string')+'">'+esc(v==null?'':v)+'</span>';
}
function reporterMarkup(b){
  if(!b)return'';
  var p=b.props||{},out=reporterOutput(b),h='';
  if(b.type==='valueString')h=esc(p.value==null?'':p.value);
  else if(b.type==='valueNumber')h=esc(p.value==null?'0':p.value);
  else if(b.type==='valueBoolean')h=esc(String(p.value).toLowerCase()==='false'?'false':'true');
  else if(b.type==='getVarValue')h=esc(p.name||'counter')+' <span class="sw3-mini-arrow">▼</span>';
  else h=esc(reporterValue(b));
  return '<span class="sw3-reporter '+esc(out)+' type-'+esc(b.type)+'" data-value-block-id="'+esc(b.id)+'">'+h+'</span>';
}
function host(parent,key){
  var spec=specByKey(parent,key);if(!spec)return'';
  var child=ensureInputs(parent)[key];
  return '<span class="sw3-input-host '+esc(spec.shape||'string')+'" data-sw3-parent="'+esc(parent.id)+'" data-sw3-key="'+esc(key)+'" data-sw3-accepts="'+esc((spec.accepts||[]).join(','))+'">'+(child?reporterMarkup(child):fallbackSocket(parent,spec))+'</span>';
}

function markup(b){
  if(!b)return null;var p=b.props||{};
  switch(b.type){
    case'listCreate':return word('create list')+menu(p.name);
    case'listAdd':return word('add')+host(b,'value')+word('to')+menu(p.name);
    case'listRemove':return word('remove index')+host(b,'index')+word('from')+menu(p.name);
    case'listGet':return word('get')+menu(p.name)+word('at')+host(b,'index')+word('to')+menu(p.saveVar);
    case'listSize':return word('length of')+menu(p.name)+word('to')+menu(p.saveVar);
    case'listClear':return word('clear')+menu(p.name);

    case'changeVar':return word('change')+menu(p.name)+word('by')+host(b,'delta');
    case'toggleVar':return word('toggle')+menu(p.name);
    case'listInsert':return word('insert')+host(b,'value')+word('at')+host(b,'index')+word('in')+menu(p.name);
    case'listSet':return word('set item')+host(b,'index')+word('of')+menu(p.name)+word('to')+host(b,'value');
    case'listContains':return word('list')+menu(p.name)+word('contains')+host(b,'value')+word('to')+menu(p.saveVar);
    case'listIndexOf':return word('index of')+host(b,'value')+word('in')+menu(p.name)+word('to')+menu(p.saveVar);
    case'listJoin':return word('join')+menu(p.name)+word('with')+host(b,'separator')+word('to')+menu(p.saveVar);
    case'listShuffle':return word('shuffle')+menu(p.name);

    case'randomNumber':return word('random')+host(b,'min')+word('to')+host(b,'max')+word('→')+menu(p.saveVar);
    case'roundNumber':return word(p.mode||'round')+host(b,'value')+word('→')+menu(p.saveVar);
    case'absNumber':return word('abs')+host(b,'value')+word('→')+menu(p.saveVar);
    case'powerNumber':return host(b,'base')+word('^')+host(b,'exponent')+word('→')+menu(p.saveVar);
    case'sqrtNumber':return word('sqrt')+host(b,'value')+word('→')+menu(p.saveVar);

    case'logicNot':return word('not')+host(b,'value')+word('→')+menu(p.saveVar);
    case'logicAnd':return host(b,'left')+word('and')+host(b,'right')+word('→')+menu(p.saveVar);
    case'logicOr':return host(b,'left')+word('or')+host(b,'right')+word('→')+menu(p.saveVar);

    case'textJoin':return word('join')+host(b,'left')+host(b,'right')+word('→')+menu(p.saveVar);
    case'textLength':return word('length')+host(b,'value')+word('→')+menu(p.saveVar);
    case'textReplace':return word('replace')+host(b,'search')+word('with')+host(b,'replacement')+word('in')+host(b,'value')+word('→')+menu(p.saveVar);
    case'textUpper':return word('uppercase')+host(b,'value')+word('→')+menu(p.saveVar);
    case'textLower':return word('lowercase')+host(b,'value')+word('→')+menu(p.saveVar);
    case'textTrim':return word('trim')+host(b,'value')+word('→')+menu(p.saveVar);
    case'textSubstring':return word('substring')+host(b,'value')+word('from')+host(b,'start')+word('to')+host(b,'end')+word('→')+menu(p.saveVar);

    case'setAttribute':return word('set attr')+host(b,'attr')+word('of')+menu(p.target,'view')+word('to')+host(b,'value');
    case'removeAttribute':return word('remove attr')+host(b,'attr')+word('from')+menu(p.target,'view');
    case'addClass':return word('add class')+host(b,'className')+word('to')+menu(p.target,'view');
    case'removeClass':return word('remove class')+host(b,'className')+word('from')+menu(p.target,'view');
    case'enableView':return word('enable')+menu(p.target,'view');
    case'disableView':return word('disable')+menu(p.target,'view');
    case'focusView':return word('focus')+menu(p.target,'view');
    case'scrollToView':return word('scroll to')+menu(p.target,'view');
    case'copyClipboard':return word('copy')+host(b,'value')+word('to clipboard');
    case'vibrate':return word('vibrate')+host(b,'ms')+word('ms');
    case'timestamp':return word('timestamp →')+menu(p.saveVar);
    case'reloadPage':return word('reload page');
  }
  return null;
}
function decorate(){
  var ov=document.getElementById('swLogicOverlay');if(!ov)return;
  ov.querySelectorAll('.sw-block[data-block-id]').forEach(function(el){
    var b=findBlockById(el.dataset.blockId),h=markup(b);if(h==null)return;
    var sig=b.type+'|'+JSON.stringify(b.props||{})+'|'+JSON.stringify(b.inputs||{});
    if(el.dataset.swExtraSocketSig===sig)return;
    el.dataset.swExtraSocketSig=sig;
    var main=el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main');
    var name=main&&main.querySelector('.sw-block-name');if(name)name.innerHTML=h;
    var summary=main&&main.querySelector('.sw-block-summary');if(summary)summary.style.display='none';
  });
}
function queueDecorate(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;syncAll();decorate();});}

function patchTyped(){
  var t=typed();if(!t||patched)return false;patched=true;

  var baseAttach=t.attach,baseDetach=t.detach,baseSync=t.sync,baseRefresh=t.refresh;

  t.attach=function(parentId,key,child){
    var parent=findBlockById(parentId),spec=specByKey(parent,key);
    if(!parent||!spec)return baseAttach.apply(this,arguments);
    if(!compatible(child,spec))return false;
    var g=graph();if(g&&g.contains&&g.contains(child,parent.id))return false;
    captureFallback(parent,spec);ensureInputs(parent)[key]=child;syncInput(parent,spec);
    if(g&&g.refresh)g.refresh();return true;
  };
  t.detach=function(id){
    var g=graph(),rel=g&&g.snapshot?g.snapshot(id):null;
    if(rel&&rel.kind==='input'){
      var parent=findBlockById(rel.ownerId),spec=specByKey(parent,rel.key);
      if(parent&&spec){
        var child=ensureInputs(parent)[rel.key]||null;
        ensureInputs(parent)[rel.key]=null;restoreFallback(parent,spec);
        if(g&&g.refresh)g.refresh();return child;
      }
    }
    return baseDetach.apply(this,arguments);
  };
  t.sync=function(){var r=baseSync&&baseSync.apply(this,arguments);syncAll();return r;};
  t.refresh=function(){var r=baseRefresh&&baseRefresh.apply(this,arguments);syncAll();queueDecorate();return r;};
  return true;
}
function install(){
  if(!patchTyped()){setTimeout(install,180);return;}
  var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(install,180);return;}
  if(ov.dataset.swExtraSockets==='1'){queueDecorate();return;}
  ov.dataset.swExtraSockets='1';
  observer=new MutationObserver(queueDecorate);
  observer.observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('brotware:logic-refresh',queueDecorate);
  queueDecorate();
}

window.BrotwareExtraSockets={specs:SPECS,refresh:queueDecorate,sync:syncAll};
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
})();