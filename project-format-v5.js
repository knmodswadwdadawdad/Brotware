(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var CONFIG_PREFIX='brotware_web_config_v1:';
var FORMAT='brotware-project';
var VERSION=5;

function clone(v){return JSON.parse(JSON.stringify(v));}
function slug(v){var s=String(v||'project').trim().toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}return s.replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function readStore(){try{var d=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(d&&Array.isArray(d.projects))return d;}catch(e){}return{version:1,projects:[]};}
function writeStore(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function activeId(){return localStorage.getItem(ACTIVE_KEY)||null;}
function findRecord(id,store){store=store||readStore();return(store.projects||[]).find(function(p){return p.id===id;})||null;}
function configFor(id){try{return JSON.parse(localStorage.getItem(CONFIG_PREFIX+id)||'null');}catch(e){return null;}}
function saveConfig(id,cfg){if(cfg)try{localStorage.setItem(CONFIG_PREFIX+id,JSON.stringify(cfg));}catch(e){console.warn('Configuração não pôde ser restaurada',e);}}
function uid2(prefix){return typeof uid==='function'?uid(prefix):prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
function pageNameFromEntry(entry){var name=window.BrotwareVFS?BrotwareVFS.basename(entry):String(entry||'index.html').split('/').pop();return name||'index.html';}
function nativeData(d){
  if(d&&d.data&&Array.isArray(d.data.pages))d=d.data;
  if(d&&d.projectData&&Array.isArray(d.projectData.pages))d=Object.assign({},d.projectData,{projectName:d.projectName||d.projectData.projectName,entry:d.entry||d.projectData.entry,mode:d.mode||d.projectData.mode,config:d.config||d.projectData.config});
  if(!d||!Array.isArray(d.pages)||!d.pages.length)throw new Error('brotware.json não contém páginas válidas.');
  var out=clone(d);out.projectName=out.projectName||'Imported Project';out.currentPageId=out.currentPageId||out.pages[0].id;out.strings=out.strings||{app_name:out.projectName};out.variables=out.variables||{counter:0};out.functions=out.functions||[];out.components=out.components||[];out.counter=out.counter||1;
  out.pages.forEach(function(p,i){if(!p.id)p.id=uid2('page');if(!p.name)p.name=i===0?'index.html':'page-'+(i+1)+'.html';if(!p.title)p.title=p.name;if(!p.events)p.events={'@page':{load:[]}};if(typeof ensurePageSchema==='function')ensurePageSchema(p);});
  return out;
}
function frameworkFromFiles(files){
  var p=window.BrotwareVFS&&BrotwareVFS.get(files,'package.json');if(!p)return null;try{var j=JSON.parse(BrotwareVFS.text(p)),all=Object.assign({},j.dependencies||{},j.devDependencies||{});if(all.next)return'Next.js';if(all['@angular/core'])return'Angular';if(all.svelte||all['@sveltejs/kit'])return'Svelte';if(all.vue)return'Vue';if(all.react)return all.vite?'React + Vite':'React';if(all.vite)return'Vite';return'Node/Web';}catch(e){return'Node/Web';}}
function homePage(data){return(data.pages||[]).find(function(p){return p.isHome;})||(data.pages||[])[0]||null;}
function manifestForNative(record){
  var data=nativeData(record.data),home=homePage(data),cfg=configFor(record.id);
  return{format:FORMAT,version:VERSION,projectName:data.projectName||record.name,mode:'native',entry:(data.entry||(home&&home.name)||'index.html'),currentPageId:data.currentPageId,pages:clone(data.pages),strings:clone(data.strings),variables:clone(data.variables),functions:clone(data.functions),components:clone(data.components),counter:data.counter||1,config:cfg||null,exportedAt:new Date().toISOString()};
}
function manifestForExternal(record,meta,files){
  meta=meta||BrotwareVFS.getMeta(record.id)||{};
  return{format:FORMAT,version:VERSION,projectName:record.name,mode:meta.mode||'static',entry:meta.entry||'index.html',framework:meta.framework||null,requiresBuild:!!meta.requiresBuild,bindings:clone(meta.bindings||{}),overrides:clone(meta.overrides||{}),previewStorage:clone(meta.previewStorage||{}),fileIndex:BrotwareVFS.fileIndex(files||{}),config:configFor(record.id)||null,exportedAt:new Date().toISOString()};
}
function createRecord(name,data){var store=readStore(),rec={id:uid2('project'),name:name||'Imported Project',folderName:slug(name||'Imported Project'),createdAt:Date.now(),updatedAt:Date.now(),data:data};store.projects.push(rec);writeStore(store);return rec;}
function refreshHome(){if(window.BrotwareProjects&&BrotwareProjects.show)BrotwareProjects.show(false);}
function openRecord(id){localStorage.setItem(ACTIVE_KEY,id);if(window.BrotwareProjects&&BrotwareProjects.open)BrotwareProjects.open(id);}
function importNative(manifest){
  var data=nativeData(manifest),rec=createRecord(data.projectName,data),cfg=manifest&&manifest.config||data.config||null;saveConfig(rec.id,cfg);BrotwareVFS.deleteMeta(rec.id);refreshHome();openRecord(rec.id);return rec;
}
async function createExternal(opts){
  opts=opts||{};var files=opts.files||{},entry=BrotwareVFS.normalizePath(opts.entry||BrotwareVFS.find(files,function(p){return /(^|\/)index\.html?$/i.test(p);})||BrotwareVFS.find(files,function(p){return /\.html?$/i.test(p);})||'index.html');
  var name=opts.projectName||pageNameFromEntry(entry).replace(/\.html?$/i,'')||'Imported Site';var page={id:uid2('page'),name:pageNameFromEntry(entry),title:name,background:'#ffffff',content:'',events:{'@page':{load:[]}},createdAt:Date.now(),updatedAt:Date.now()};
  var data={version:VERSION,projectName:name,pages:[page],currentPageId:page.id,strings:{app_name:name},variables:{counter:0},functions:[],components:[],counter:1,mode:opts.mode||'static',entry:entry};
  var rec=createRecord(name,data),framework=opts.framework||frameworkFromFiles(files),meta={version:2,mode:opts.mode||'static',entry:entry,framework:framework||null,requiresBuild:!!opts.requiresBuild,bindings:clone(opts.bindings||{}),overrides:clone(opts.overrides||{}),previewStorage:clone(opts.previewStorage||{}),source:opts.source||'import',fileCount:Object.keys(files).length,createdAt:Date.now(),updatedAt:Date.now()};
  await BrotwareVFS.putProject(rec.id,files);BrotwareVFS.setMeta(rec.id,meta);saveConfig(rec.id,opts.config||null);refreshHome();openRecord(rec.id);return rec;
}
async function updateExternalMeta(id,patch){var meta=BrotwareVFS.patchMeta(id,patch||{}),store=readStore(),rec=findRecord(id,store);if(rec){rec.updatedAt=Date.now();rec.data.mode=meta.mode;rec.data.entry=meta.entry;writeStore(store);}return meta;}
function deleteProjectData(id){BrotwareVFS.deleteMeta(id);BrotwareVFS.deleteProject(id).catch(function(){});try{localStorage.removeItem(CONFIG_PREFIX+id);}catch(e){}}
function isBrotwareJson(d){return !!(d&&(Array.isArray(d.pages)||(d.data&&Array.isArray(d.data.pages))||(d.projectData&&Array.isArray(d.projectData.pages))||String(d.format||'').toLowerCase().indexOf('brotware')>=0));}

window.BrotwareProjectFormat={
  format:FORMAT,version:VERSION,readStore:readStore,writeStore:writeStore,findRecord:findRecord,activeId:activeId,configFor:configFor,saveConfig:saveConfig,nativeData:nativeData,isBrotwareJson:isBrotwareJson,
  manifestForNative:manifestForNative,manifestForExternal:manifestForExternal,importNative:importNative,createExternal:createExternal,updateExternalMeta:updateExternalMeta,frameworkFromFiles:frameworkFromFiles,openRecord:openRecord,refreshHome:refreshHome,deleteProjectData:deleteProjectData
};
})();
