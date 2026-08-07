(function(){
'use strict';

var installed=false,baseManifest=null,baseCreate=null;
function clone(v){return JSON.parse(JSON.stringify(v));}
function normalizeExternalData(data,opts){
  data=clone(data||{});if(!Array.isArray(data.pages)||!data.pages.length)return null;
  data.projectName=data.projectName||opts.projectName||'Imported Site';data.currentPageId=data.currentPageId||data.pages[0].id;data.strings=data.strings||{app_name:data.projectName};data.variables=data.variables||{counter:0};data.functions=data.functions||[];data.components=data.components||[];data.counter=data.counter||1;data.mode=opts.mode||data.mode||'static';data.entry=opts.entry||data.entry||'index.html';
  data.pages.forEach(function(p,i){if(!p.id)p.id=(typeof uid==='function'?uid('page'):'page-'+Date.now()+'-'+i);if(!p.name)p.name=i===0?(BrotwareVFS.basename(data.entry)||'index.html'):'page-'+(i+1)+'.html';if(!p.title)p.title=p.name;if(!p.events)p.events={'@page':{load:[]}};if(typeof ensurePageSchema==='function')ensurePageSchema(p);});return data;
}
function install(){
  if(installed)return;if(!window.BrotwareProjectFormat||!BrotwareProjectFormat.manifestForExternal||!BrotwareProjectFormat.createExternal){setTimeout(install,100);return;}installed=true;baseManifest=BrotwareProjectFormat.manifestForExternal;baseCreate=BrotwareProjectFormat.createExternal;
  BrotwareProjectFormat.manifestForExternal=function(record,meta,files){meta=meta||BrotwareVFS.getMeta(record&&record.id)||{};var out=baseManifest.apply(this,arguments);out.projectData=clone(record&&record.data||{});out.domPatches=clone(meta.domPatches||[]);return out;};
  BrotwareProjectFormat.createExternal=async function(opts){opts=opts||{};var rec=await baseCreate.apply(this,arguments),restored=opts.projectData&&normalizeExternalData(opts.projectData,opts);if(restored){var store=BrotwareProjectFormat.readStore(),found=BrotwareProjectFormat.findRecord(rec.id,store);if(found){found.data=restored;found.name=restored.projectName||found.name;found.updatedAt=Date.now();BrotwareProjectFormat.writeStore(store);rec=found;}if(BrotwareProjectFormat.activeId()===rec.id&&typeof applyProjectData==='function')applyProjectData(restored);}if(opts.domPatches&&opts.domPatches.length)await BrotwareProjectFormat.updateExternalMeta(rec.id,{domPatches:clone(opts.domPatches),mode:opts.mode||'hybrid'});return rec;};
}
window.BrotwareExternalProjectDataV5={normalize:normalizeExternalData};
setTimeout(install,0);setTimeout(install,500);
})();