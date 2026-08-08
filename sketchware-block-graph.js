(function(){
'use strict';

/*
 * Brotware BlockGraph
 * -------------------
 * A compatibility graph over the current Brotware logic model.
 *
 * Current native projects keep their existing shape:
 *   root[] / children[] / elseChildren[] / inputs{}
 *
 * This module only gives those arrays a formal connection model similar to
 * Sketchware's nextBlock / subStack1 / subStack2 / parameter relations. It
 * does NOT rewrite project data, so old projects and the current runtime stay
 * compatible.
 */

var index=new Map();
var version=0;

function roots(){
  try{return typeof activeBlocks==='function'?(activeBlocks()||[]):[];}catch(_){return[];}
}
function ensureBlock(block){
  if(!block)return block;
  if(!Array.isArray(block.children))block.children=[];
  if(!Array.isArray(block.elseChildren))block.elseChildren=[];
  if(!block.inputs||typeof block.inputs!=='object'||Array.isArray(block.inputs))block.inputs={};
  return block;
}
function keyOf(id){return String(id==null?'':id);}
function entryFor(block,relation){
  return {block:block,relation:relation};
}
function put(block,relation){
  if(!block||block.id==null)return;
  index.set(keyOf(block.id),entryFor(block,relation));
}
function scanInput(block,owner,key){
  if(!block)return;
  ensureBlock(block);
  put(block,{kind:'input',owner:owner,key:key});
  Object.keys(block.inputs).forEach(function(inputKey){
    if(block.inputs[inputKey])scanInput(block.inputs[inputKey],block,inputKey);
  });
}
function scanStack(list,owner,slot){
  if(!Array.isArray(list))return;
  for(var i=0;i<list.length;i++){
    var block=ensureBlock(list[i]);
    if(!block)continue;
    put(block,{kind:'stack',owner:owner||null,slot:slot,index:i,list:list});
    Object.keys(block.inputs).forEach(function(inputKey){
      if(block.inputs[inputKey])scanInput(block.inputs[inputKey],block,inputKey);
    });
    scanStack(block.children,block,'children');
    scanStack(block.elseChildren,block,'elseChildren');
  }
}
function refresh(){
  index.clear();
  scanStack(roots(),null,'root');
  version++;
  return index;
}
function get(id){
  refresh();
  return index.get(keyOf(id))||null;
}
function find(id){
  var e=get(id);return e?e.block:null;
}
function relationOf(id){
  var e=get(id);return e?e.relation:null;
}
function ownerId(owner){return owner&&owner.id!=null?String(owner.id):null;}
function snapshot(id){
  var e=get(id);if(!e)return null;
  var r=e.relation;
  if(r.kind==='input')return {kind:'input',ownerId:ownerId(r.owner),key:r.key};
  return {kind:'stack',ownerId:ownerId(r.owner),slot:r.slot,index:r.index};
}
function containsBlock(root,id){
  if(!root)return false;
  var target=keyOf(id),seen=new Set();
  function visit(block){
    if(!block)return false;
    var k=keyOf(block.id);if(seen.has(k))return false;seen.add(k);
    if(k===target)return true;
    ensureBlock(block);
    var inputKeys=Object.keys(block.inputs);
    for(var i=0;i<inputKeys.length;i++)if(visit(block.inputs[inputKeys[i]]))return true;
    for(var j=0;j<block.children.length;j++)if(visit(block.children[j]))return true;
    for(var x=0;x<block.elseChildren.length;x++)if(visit(block.elseChildren[x]))return true;
    return false;
  }
  return visit(root);
}
function listFor(owner,slot){
  if(slot==='root')return roots();
  if(!owner)return null;
  ensureBlock(owner);
  if(slot==='children')return owner.children;
  if(slot==='elseChildren')return owner.elseChildren;
  return null;
}
function resolveOwner(id){return id==null?null:find(id);}
function emit(detail){
  try{window.dispatchEvent(new CustomEvent('brotware:block-graph-change',{detail:detail||{}}));}catch(_){}
}
function detach(id,opts){
  opts=opts||{};
  var e=get(id);if(!e)return null;
  var block=e.block,r=e.relation,origin=snapshot(id);
  if(r.kind==='input'){
    if(r.owner&&r.owner.inputs&&r.owner.inputs[r.key]===block)r.owner.inputs[r.key]=null;
  }else if(r.kind==='stack'){
    var list=r.list;
    if(Array.isArray(list)&&list[r.index]===block)list.splice(r.index,1);
    else if(Array.isArray(list)){
      var pos=list.indexOf(block);if(pos>=0)list.splice(pos,1);
    }
  }
  refresh();
  if(!opts.silent)emit({type:'detach',block:block,origin:origin});
  return {block:block,origin:origin};
}
function insertStack(block,ownerIdValue,slot,indexValue,opts){
  opts=opts||{};if(!block)return false;
  var owner=resolveOwner(ownerIdValue),list=listFor(owner,slot||'root');
  if(!list)return false;
  if(owner&&containsBlock(block,owner.id))return false;
  var indexNum=Number(indexValue);
  if(!isFinite(indexNum))indexNum=list.length;
  indexNum=Math.max(0,Math.min(list.length,indexNum));
  list.splice(indexNum,0,block);refresh();
  if(!opts.silent)emit({type:'connect-stack',block:block,owner:owner,slot:slot||'root',index:indexNum});
  return true;
}
function connectInput(block,parentId,key,opts){
  opts=opts||{};if(!block)return false;
  var parent=find(parentId);if(!parent)return false;
  ensureBlock(parent);
  if(containsBlock(block,parent.id))return false;
  var replaced=parent.inputs[key]||null;
  parent.inputs[key]=block;refresh();
  if(!opts.silent)emit({type:'connect-input',block:block,parent:parent,key:key,replaced:replaced});
  return true;
}
function restore(origin,block,opts){
  opts=opts||{};if(!origin||!block)return false;
  if(origin.kind==='input')return connectInput(block,origin.ownerId,origin.key,opts);
  return insertStack(block,origin.ownerId,origin.slot,origin.index,opts);
}
function moveToInput(id,parentId,key,opts){
  opts=opts||{};
  var detached=detach(id,{silent:true});if(!detached)return false;
  if(connectInput(detached.block,parentId,key,{silent:true})){
    emit({type:'move-input',block:detached.block,origin:detached.origin,parentId:String(parentId),key:key});
    return true;
  }
  restore(detached.origin,detached.block,{silent:true});refresh();return false;
}
function moveToStack(id,ownerIdValue,slot,indexValue,opts){
  opts=opts||{};
  var detached=detach(id,{silent:true});if(!detached)return false;
  var targetIndex=Number(indexValue);
  if(detached.origin&&detached.origin.kind==='stack'&&detached.origin.ownerId===String(ownerIdValue==null?'':ownerIdValue)&&detached.origin.slot===slot&&detached.origin.index<targetIndex)targetIndex--;
  if(insertStack(detached.block,ownerIdValue,slot,targetIndex,{silent:true})){
    emit({type:'move-stack',block:detached.block,origin:detached.origin,ownerId:ownerIdValue==null?null:String(ownerIdValue),slot:slot,index:targetIndex});
    return true;
  }
  restore(detached.origin,detached.block,{silent:true});refresh();return false;
}
function nextOf(entry){
  if(!entry||!entry.relation||entry.relation.kind!=='stack')return null;
  var r=entry.relation,list=r.list||[];return list[r.index+1]||null;
}
function linksFor(id){
  var e=get(id);if(!e)return null;
  var b=e.block;ensureBlock(b);
  var params={};Object.keys(b.inputs).forEach(function(k){if(b.inputs[k]&&b.inputs[k].id!=null)params[k]='@'+String(b.inputs[k].id);});
  var next=nextOf(e);
  return {
    id:String(b.id),
    nextBlock:next&&next.id!=null?String(next.id):null,
    subStack1:b.children[0]&&b.children[0].id!=null?String(b.children[0].id):null,
    subStack2:b.elseChildren[0]&&b.elseChildren[0].id!=null?String(b.elseChildren[0].id):null,
    parameters:params
  };
}
function exportLinks(){
  refresh();var out=[];
  index.forEach(function(e){out.push(linksFor(e.block.id));});
  return out.filter(Boolean);
}
function debug(){
  refresh();
  return {version:version,size:index.size,links:exportLinks()};
}

window.BrotwareBlockGraph={
  refresh:refresh,
  get:get,
  find:find,
  relationOf:relationOf,
  snapshot:snapshot,
  contains:containsBlock,
  detach:detach,
  restore:restore,
  connectInput:connectInput,
  insertStack:insertStack,
  moveToInput:moveToInput,
  moveToStack:moveToStack,
  linksFor:linksFor,
  exportLinks:exportLinks,
  debug:debug
};

window.addEventListener('brotware:logic-refresh',refresh);
setTimeout(refresh,0);
setTimeout(refresh,500);
})();
