(function(){
'use strict';

var installed=false;

function nativePicker(){
  var homeInput=document.getElementById('bwProjectImport');
  if(homeInput){
    homeInput.accept='.zip,.json,.brotware.json,application/json,application/zip';
    homeInput.value='';
    homeInput.click();
    return;
  }
  var input=document.getElementById('projectInput');
  if(input){
    input.accept='.json,.brotware.json,application/json';
    input.value='';
    input.click();
  }
}

function patchUi(){
  var importBtn=document.getElementById('importHtmlBtn');
  if(importBtn){
    importBtn.textContent='Importar projeto';
    importBtn.title='Importar projeto nativo do Brotware';
    importBtn.onclick=function(e){if(e)e.preventDefault();nativePicker();};
  }

  var upload=document.getElementById('uploadProjectBtn');
  if(upload){
    upload.textContent='Importar projeto Brotware';
    upload.title='Somente projetos nativos do Brotware';
    upload.onclick=function(e){if(e)e.preventDefault();nativePicker();};
  }

  var legacyHtml=document.getElementById('htmlInput');
  if(legacyHtml){
    legacyHtml.disabled=true;
    legacyHtml.accept='';
  }

  var projectInput=document.getElementById('projectInput');
  if(projectInput)projectInput.accept='.json,.brotware.json,application/json';

  var homeInput=document.getElementById('bwProjectImport');
  if(homeInput)homeInput.accept='.zip,.json,.brotware.json,application/json,application/zip';

  var restore=document.getElementById('bwRestoreProjects');
  if(restore){
    var title=restore.querySelector('b');
    var sub=restore.querySelector('small');
    if(title)title.textContent='Importar projeto Brotware';
    if(sub)sub.textContent='Somente projetos criados ou exportados pelo Brotware (.zip ou .json).';
  }

  /* Remove any stale Universal Importer UI left by an older cached session. */
  var universalBtn=document.getElementById('bwUniversalImportBtn');
  if(universalBtn)universalBtn.remove();
  var universalInput=document.getElementById('bwUniversalProjectInput');
  if(universalInput)universalInput.remove();
  var busy=document.querySelector('.bw-import-busy');
  if(busy)busy.remove();
}

function install(){
  if(!installed){
    installed=true;
    document.addEventListener('click',function(e){
      var t=e.target&&e.target.closest?e.target.closest('#importHtmlBtn,#uploadProjectBtn'):null;
      if(!t)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      nativePicker();
    },true);
  }
  patchUi();
}

window.BrotwareNativeOnly={refresh:patchUi,openImport:nativePicker};
setTimeout(install,0);
setTimeout(install,500);
setTimeout(install,1400);
setInterval(patchUi,2000);
})();