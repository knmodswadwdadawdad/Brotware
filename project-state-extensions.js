(function(){
'use strict';

/* Persist additive Brotware project state without rewriting the legacy core. */
function extraSnapshot(){
  return {
    functionalComponents:Array.isArray(state.functionalComponents)?state.functionalComponents:[],
    libraryManager:state.libraryManager&&typeof state.libraryManager==='object'?state.libraryManager:{},
    firebaseConfig:state.firebaseConfig&&typeof state.firebaseConfig==='object'?state.firebaseConfig:{}
  };
}
function applyExtras(d){
  d=d||{};
  state.functionalComponents=Array.isArray(d.functionalComponents)?d.functionalComponents:[];
  state.libraryManager=d.libraryManager&&typeof d.libraryManager==='object'?d.libraryManager:{};
  state.firebaseConfig=d.firebaseConfig&&typeof d.firebaseConfig==='object'?d.firebaseConfig:{};
}

var baseAutoSave=window.autoSave;
window.autoSave=function(){
  if(baseAutoSave)baseAutoSave();
  try{
    var raw=localStorage.getItem(state.storageKey),d=raw?JSON.parse(raw):{};
    var x=extraSnapshot();d.functionalComponents=x.functionalComponents;d.libraryManager=x.libraryManager;d.firebaseConfig=x.firebaseConfig;
    localStorage.setItem(state.storageKey,JSON.stringify(d));
  }catch(_){}
};

var baseLoadSaved=window.loadSaved;
window.loadSaved=function(){
  var ok=baseLoadSaved?baseLoadSaved():false;
  try{var raw=localStorage.getItem(state.storageKey);applyExtras(raw?JSON.parse(raw):{});}catch(_){applyExtras({});}
  return ok;
};

var baseImportProject=window.importProject;
window.importProject=function(text){
  var parsed=null;try{parsed=JSON.parse(text);}catch(_){}
  if(baseImportProject)baseImportProject(text);
  if(parsed){applyExtras(parsed);window.autoSave();if(window.BrotwareFunctionalComponents&&BrotwareFunctionalComponents.refresh)BrotwareFunctionalComponents.refresh();}
};

window.downloadProject=function(){
  try{if(typeof saveCurrentPage==='function')saveCurrentPage();}catch(_){}
  var x=extraSnapshot();
  var data={
    format:'Brotware Studio',version:4,projectName:state.projectName,pages:state.pages,currentPageId:state.currentPageId,
    strings:state.strings,variables:state.variables,functions:state.functions,components:state.components,counter:state.counter,
    functionalComponents:x.functionalComponents,libraryManager:x.libraryManager,firebaseConfig:x.firebaseConfig
  };
  downloadText((state.projectName||'brotware').replace(/[^a-z0-9_-]+/gi,'-')+'.brotware.json',JSON.stringify(data,null,2),'application/json;charset=utf-8');
};

var baseResetProject=window.resetProject;
window.resetProject=function(){
  var beforePages=state.pages;
  if(baseResetProject)baseResetProject();
  if(state.pages===beforePages)return;
  state.functionalComponents=[];state.libraryManager={};state.firebaseConfig={};
  window.autoSave();
  if(window.BrotwareFunctionalComponents&&BrotwareFunctionalComponents.refresh)BrotwareFunctionalComponents.refresh();
};

window.BrotwareProjectStateExtensions={snapshot:extraSnapshot,apply:applyExtras};
})();
