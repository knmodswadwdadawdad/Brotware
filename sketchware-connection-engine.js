(function(){
'use strict';

/*
 * Shared connection engine for the Sketchware-style logic editor.
 * It knows about both statement slots and typed reporter sockets, but does not
 * install pointer handlers by itself. The current UI can migrate to it in small
 * steps without changing project persistence.
 */

var REPORTER_OUTPUT={
  valueString:'string',
  valueNumber:'number',
  valueBoolean:'boolean',
  getVarValue:'any',
  compareValue:'boolean'
};

function graph(){return window.BrotwareBlockGraph||null;}
function typed(){return window.BrotwareTypedSockets||null;}
function isReporter(block){return !!(block&&REPORTER_OUTPUT[block.type]);}
function outputType(block){return block?REPORTER_OUTPUT[block.type]||'statement':'statement';}
function parseAccepts(value){return String(value||'').split(',').map(function(x){return x.trim();}).filter(Boolean);}
function inputCompatible(block,target){
  if(!block||!target||target.kind!=='input')return false;
  var output=outputType(block),accepts=target.accepts||[];
  if(block.type==='compareValue'&&target.key!=='condition')return false;
  if(output==='statement')return false;
  if(output==='any')return true;
  return accepts.indexOf(output)>=0||accepts.indexOf('any')>=0;
}
function parseStackSlot(raw,index){
  var slot=String(raw||'root');
  if(slot==='root')return{kind:'stack',ownerId:null,slot:'root',index:Number(index)||0};
  var p=slot.split(':'),name=p.shift(),ownerId=p.join(':')||null;
  if(name==='children')return{kind:'stack',ownerId:ownerId,slot:'children',index:Number(index)||0};
  if(name==='else')return{kind:'stack',ownerId:ownerId,slot:'elseChildren',index:Number(index)||0};
  return null;
}
function targetFromElement(el,block){
  if(!el)return null;
  if(isReporter(block)){
    var host=el.closest&&el.closest('.sw3-input-host');
    if(!host)return null;
    var target={kind:'input',parentId:host.dataset.sw3Parent,key:host.dataset.sw3Key,accepts:parseAccepts(host.dataset.sw3Accepts),element:host};
    if(!inputCompatible(block,target))return null;
    var g=graph(),parent=g&&g.find(target.parentId);
    if(g&&parent&&g.contains(block,parent.id))return null;
    return target;
  }
  var zone=el.closest&&el.closest('.sw-insert');if(!zone)return null;
  var stack=parseStackSlot(zone.dataset.swSlot,zone.dataset.swIndex);if(!stack)return null;
  stack.element=zone;
  var gr=graph();
  if(gr&&stack.ownerId&&gr.contains(block,stack.ownerId))return null;
  return stack;
}
function targetAt(x,y,block){
  if(typeof document==='undefined'||!document.elementFromPoint)return null;
  return targetFromElement(document.elementFromPoint(x,y),block);
}
function notify(){
  var t=typed();if(t){try{if(t.sync)t.sync();if(t.refresh)t.refresh();}catch(_){}}
  try{if(typeof saveLogic==='function')saveLogic();}catch(_){}
  try{if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();}catch(_){}
}
function connectReporter(block,target,origin){
  var t=typed();if(!t||!target||target.kind!=='input')return false;
  var detached=null;
  if(origin&&origin.kind==='input'&&t.detach)detached=t.detach(block.id);
  if(!t.attach||!t.attach(target.parentId,target.key,block)){
    if(detached&&origin&&origin.kind==='input'&&t.attach)t.attach(origin.ownerId,origin.key,detached);
    return false;
  }
  var g=graph();if(g)g.refresh();notify();return true;
}
function connectStatement(block,target,origin){
  var g=graph();if(!g||!target||target.kind!=='stack')return false;
  var detached=null;
  if(origin)detached=g.detach(block.id,{silent:true});
  var moving=detached?detached.block:block;
  var targetIndex=target.index;
  if(origin&&origin.kind==='stack'&&origin.ownerId===target.ownerId&&origin.slot===target.slot&&origin.index<targetIndex)targetIndex--;
  if(!g.insertStack(moving,target.ownerId,target.slot,targetIndex,{silent:true})){
    if(detached)g.restore(detached.origin,detached.block,{silent:true});
    return false;
  }
  g.refresh();notify();return true;
}
function connect(block,target,origin){
  if(!block||!target)return false;
  return isReporter(block)?connectReporter(block,target,origin):connectStatement(block,target,origin);
}
function begin(blockOrId){
  var g=graph(),block=typeof blockOrId==='object'?blockOrId:(g&&g.find(blockOrId));
  if(!block)return null;
  var origin=g&&block.id!=null?g.snapshot(block.id):null;
  return {block:block,origin:origin,target:null,x:0,y:0};
}
function update(session,x,y){
  if(!session)return null;session.x=x;session.y=y;session.target=targetAt(x,y,session.block);return session.target;
}
function commit(session){return !!(session&&session.target&&connect(session.block,session.target,session.origin));}
function cancel(session){if(session)session.target=null;return true;}

window.BrotwareConnectionEngine={
  isReporter:isReporter,
  outputType:outputType,
  inputCompatible:inputCompatible,
  parseStackSlot:parseStackSlot,
  targetFromElement:targetFromElement,
  targetAt:targetAt,
  connect:connect,
  begin:begin,
  update:update,
  commit:commit,
  cancel:cancel
};
})();
