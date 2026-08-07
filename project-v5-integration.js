(function(){
'use strict';

var basePreview=null,installed=false;
function active(){return window.BrotwareProjectFormat?BrotwareProjectFormat.activeId():null;}
function patchPreview(){
  if(window.preview&&window.preview.__bwV5)return;if(!basePreview)basePreview=window.preview;
  var fn=function(){var id=active();if(id&&BrotwareVFS.isExternal(id)&&window.BrotwareExternalPreview)return BrotwareExternalPreview.open(id);return basePreview?basePreview.apply(this,arguments):undefined;};fn.__bwV5=true;window.preview=fn;
  var run=document.getElementById('runBtn');if(run)run.onclick=function(e){if(e)e.preventDefault();fn();};var mobile=document.getElementById('bwMobileRun');if(mobile)mobile.onclick=function(e){if(e)e.preventDefault();fn();};
}
function patchImports(){
  var old=document.getElementById('importHtmlBtn');if(old){old.textContent='Importar projeto';old.title='Importar ZIP, HTML ou JSON';old.onclick=function(e){if(e)e.preventDefault();if(window.BrotwareUniversalImporter)BrotwareUniversalImporter.open();};}
  var upload=document.getElementById('uploadProjectBtn');if(upload){upload.textContent='Importar projeto';upload.onclick=function(){if(window.BrotwareUniversalImporter)BrotwareUniversalImporter.open();};}
}
function cleanupDeleted(id){setTimeout(function(){if(!BrotwareProjectFormat.findRecord(id)){BrotwareProjectFormat.deleteProjectData(id);}},80);}
function installDeleteCleanup(){document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-project-action="delete"]');if(!a)return;var card=a.closest('.bw-project-card');if(card)cleanupDeleted(card.dataset.projectId);},false);}
function patchPublicOpen(){
  if(!window.BrotwareProjects||BrotwareProjects.__bwV5Open)return;var old=BrotwareProjects.open;BrotwareProjects.open=function(id){var r=old.apply(this,arguments);if(BrotwareVFS.isExternal(id)&&window.BrotwareExternalPreview)setTimeout(function(){BrotwareExternalPreview.open(id);},100);return r;};BrotwareProjects.__bwV5Open=true;
}
function install(){if(installed){patchPreview();patchImports();patchPublicOpen();return;}installed=true;patchPreview();patchImports();patchPublicOpen();installDeleteCleanup();setTimeout(function(){patchPreview();patchImports();patchPublicOpen();},1000);}
setTimeout(install,0);setTimeout(install,800);setTimeout(install,1600);
})();
