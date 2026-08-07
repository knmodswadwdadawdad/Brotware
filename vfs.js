(function(){
'use strict';

var DB_NAME='brotware_vfs_v1';
var DB_VERSION=1;
var STORE='projects';
var META_KEY='brotware_external_meta_v1';

function normalizePath(path){
  path=String(path==null?'':path).replace(/\\/g,'/').replace(/^\/+/, '');
  var out=[];
  path.split('/').forEach(function(part){
    if(!part||part==='.')return;
    if(part==='..'){if(out.length)out.pop();return;}
    out.push(part);
  });
  return out.join('/');
}
function dirname(path){path=normalizePath(path);var i=path.lastIndexOf('/');return i<0?'':path.slice(0,i);}
function basename(path){path=normalizePath(path);var i=path.lastIndexOf('/');return i<0?path:path.slice(i+1);}
function resolvePath(baseFile,ref){
  ref=String(ref==null?'':ref).trim();
  if(!ref)return normalizePath(baseFile);
  if(/^(?:[a-z]+:|\/\/|#|data:|blob:|mailto:|tel:)/i.test(ref))return null;
  var clean=ref.split('#')[0].split('?')[0];
  if(clean.charAt(0)==='/')return normalizePath(clean);
  return normalizePath((dirname(baseFile)?dirname(baseFile)+'/':'')+clean);
}
function relativePath(fromFile,toFile){
  var a=dirname(fromFile).split('/').filter(Boolean),b=normalizePath(toFile).split('/').filter(Boolean),i=0;
  while(i<a.length&&i<b.length&&a[i]===b[i])i++;
  var parts=[];for(var x=i;x<a.length;x++)parts.push('..');parts=parts.concat(b.slice(i));
  return parts.join('/')||basename(toFile);
}
function ext(path){var n=basename(path),i=n.lastIndexOf('.');return i<0?'':n.slice(i+1).toLowerCase();}
function mime(path){
  var e=ext(path),m={html:'text/html',htm:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',txt:'text/plain',md:'text/markdown',xml:'application/xml',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',ico:'image/x-icon',avif:'image/avif',bmp:'image/bmp',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',mp4:'video/mp4',webm:'video/webm',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',pdf:'application/pdf',wasm:'application/wasm'};
  return m[e]||'application/octet-stream';
}
function isText(path,type){type=type||mime(path);return /^text\//.test(type)||/json|javascript|xml|svg/.test(type)||['html','htm','css','js','mjs','json','txt','md','xml','svg'].indexOf(ext(path))>=0;}
function toUint8(value){
  if(value instanceof Uint8Array)return value;
  if(value instanceof ArrayBuffer)return new Uint8Array(value);
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  return new TextEncoder().encode(String(value==null?'':value));
}
function commonRoot(paths){
  var list=(paths||[]).map(normalizePath).filter(Boolean);if(!list.length)return'';
  var first=list[0].split('/');if(first.length<2)return'';var root=first[0];
  for(var i=1;i<list.length;i++){var p=list[i].split('/');if(p.length<2||p[0]!==root)return'';}
  return root;
}
function stripRoot(files,root){
  root=normalizePath(root);if(!root)return files;var prefix=root+'/';var out={};
  Object.keys(files||{}).forEach(function(path){var p=normalizePath(path);out[p.indexOf(prefix)===0?p.slice(prefix.length):p]=files[path];});
  return out;
}
function cloneEntry(entry){
  if(!entry)return null;
  var out={path:normalizePath(entry.path||''),mime:entry.mime||mime(entry.path||''),kind:entry.kind||'binary',size:Number(entry.size)||0,modifiedAt:entry.modifiedAt||Date.now()};
  if(out.kind==='text')out.content=String(entry.content==null?'':entry.content);
  else out.content=toUint8(entry.content||new Uint8Array(0));
  if(!out.size)out.size=out.kind==='text'?new TextEncoder().encode(out.content).length:out.content.byteLength;
  return out;
}
function fromBytes(path,bytes,type){
  path=normalizePath(path);type=type||mime(path);bytes=toUint8(bytes);
  if(isText(path,type))return{path:path,mime:type,kind:'text',content:new TextDecoder('utf-8').decode(bytes),size:bytes.byteLength,modifiedAt:Date.now()};
  return{path:path,mime:type,kind:'binary',content:bytes,size:bytes.byteLength,modifiedAt:Date.now()};
}
function bytes(entry){if(!entry)return new Uint8Array(0);return entry.kind==='text'?new TextEncoder().encode(entry.content||''):toUint8(entry.content||new Uint8Array(0));}
function text(entry){if(!entry)return'';return entry.kind==='text'?String(entry.content||''):new TextDecoder('utf-8').decode(bytes(entry));}

function openDb(){
  return new Promise(function(resolve,reject){
    if(!window.indexedDB){reject(new Error('IndexedDB indisponível'));return;}
    var req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=function(){var db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'projectId'});};
    req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error||new Error('Falha ao abrir VFS'));};
  });
}
async function transact(mode,fn){
  var db=await openDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),result;
    try{result=fn(store,tx);}catch(e){db.close();reject(e);return;}
    tx.oncomplete=function(){db.close();resolve(result);};tx.onerror=function(){db.close();reject(tx.error||new Error('Falha no VFS'));};tx.onabort=function(){db.close();reject(tx.error||new Error('Operação VFS cancelada'));};
  });
}
async function putProject(projectId,files){
  var clean={};Object.keys(files||{}).forEach(function(p){var e=cloneEntry(files[p]);if(!e.path)e.path=normalizePath(p);clean[e.path]=e;});
  await transact('readwrite',function(store){store.put({projectId:String(projectId),files:clean,updatedAt:Date.now()});});return clean;
}
async function getProject(projectId){
  var db=await openDb();return new Promise(function(resolve,reject){var tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(String(projectId));req.onsuccess=function(){db.close();resolve(req.result||{projectId:String(projectId),files:{},updatedAt:0});};req.onerror=function(){db.close();reject(req.error);};});
}
async function deleteProject(projectId){await transact('readwrite',function(store){store.delete(String(projectId));});}
async function setFile(projectId,path,entry){var rec=await getProject(projectId);path=normalizePath(path);var e=cloneEntry(entry);e.path=path;rec.files[path]=e;return putProject(projectId,rec.files);}
async function removeFile(projectId,path){var rec=await getProject(projectId);delete rec.files[normalizePath(path)];return putProject(projectId,rec.files);}
function list(files){return Object.keys(files||{}).sort();}
function get(files,path){path=normalizePath(path);if(files&&files[path])return files[path];var low=path.toLowerCase(),keys=Object.keys(files||{});for(var i=0;i<keys.length;i++)if(keys[i].toLowerCase()===low)return files[keys[i]];return null;}
function find(files,predicate){var keys=list(files);for(var i=0;i<keys.length;i++)if(predicate(keys[i],files[keys[i]]))return keys[i];return null;}
function fileIndex(files){return list(files).map(function(path){var e=files[path];return{path:path,mime:e.mime||mime(path),size:Number(e.size)||bytes(e).length,kind:e.kind||'binary'};});}

function readMetaMap(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')||{};}catch(e){return{};}}
function writeMetaMap(map){localStorage.setItem(META_KEY,JSON.stringify(map||{}));}
function getMeta(projectId){return readMetaMap()[String(projectId)]||null;}
function setMeta(projectId,meta){var map=readMetaMap();map[String(projectId)]=meta;writeMetaMap(map);return meta;}
function patchMeta(projectId,patch){var m=getMeta(projectId)||{};Object.keys(patch||{}).forEach(function(k){m[k]=patch[k];});m.updatedAt=Date.now();return setMeta(projectId,m);}
function deleteMeta(projectId){var map=readMetaMap();delete map[String(projectId)];writeMetaMap(map);}
function isExternal(projectId){var m=getMeta(projectId);return !!(m&&(m.mode==='static'||m.mode==='hybrid'||m.mode==='framework'));}

window.BrotwareVFS={
  normalizePath:normalizePath,dirname:dirname,basename:basename,resolve:resolvePath,relative:relativePath,ext:ext,mime:mime,isText:isText,toUint8:toUint8,commonRoot:commonRoot,stripRoot:stripRoot,
  fromBytes:fromBytes,bytes:bytes,text:text,putProject:putProject,getProject:getProject,deleteProject:deleteProject,setFile:setFile,removeFile:removeFile,list:list,get:get,find:find,fileIndex:fileIndex,
  getMeta:getMeta,setMeta:setMeta,patchMeta:patchMeta,deleteMeta:deleteMeta,isExternal:isExternal,metaKey:META_KEY
};
})();
