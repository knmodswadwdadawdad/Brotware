(function(){
'use strict';

var installed=false,returnBtn=null;
function extState(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function active(){var s=extState();return !!(s&&s.active&&s.projectId);}
function workspace(){return document.getElementById('bwExternalWorkspace');}
function ensureButtons(){
  var top=document.querySelector('#bwExternalWorkspace .bw-external-top');if(!top)return;
  if(!document.getElementById('bwExternalSelectView')){var select=document.createElement('button');select.id='bwExternalSelectView';select.type='button';select.textContent='▦ Select View';select.onclick=function(){if(window.BrotwareViewSelector)BrotwareViewSelector.open();};var inspect=document.getElementById('bwExternalInspect');top.insertBefore(select,inspect||top.firstChild);}
  if(!document.getElementById('bwExternalLogic')){var logic=document.createElement('button');logic.id='bwExternalLogic';logic.type='button';logic.textContent='⚡ Lógica';logic.onclick=openLogic;var inspect2=document.getElementById('bwExternalInspect');top.insertBefore(logic,inspect2||top.firstChild);}
}
function ensureReturn(){if(returnBtn)returnBtn=document.getElementById('bwReturnExternalPreview');if(returnBtn)return;returnBtn=document.createElement('button');returnBtn.id='bwReturnExternalPreview';returnBtn.className='bw-return-external-preview';returnBtn.type='button';returnBtn.innerHTML='← <span>Preview externo</span>';returnBtn.onclick=returnPreview;document.body.appendChild(returnBtn);}
function openLogic(){
  if(!active())return;var w=workspace();if(w)w.classList.remove('show');document.body.classList.remove('bw-external-open');document.body.classList.add('bw-external-logic-open');ensureReturn();returnBtn.classList.add('show');if(typeof switchTab==='function')switchTab('event');if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();if(window.BrotwareExternalLogicProvider)BrotwareExternalLogicProvider.refresh();
}
function returnPreview(){var w=workspace();if(w)w.classList.add('show');document.body.classList.add('bw-external-open');document.body.classList.remove('bw-external-logic-open');if(returnBtn)returnBtn.classList.remove('show');if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.syncLogic();}
function onOpen(){ensureButtons();ensureReturn();if(returnBtn)returnBtn.classList.remove('show');}
function install(){if(installed)return;installed=true;ensureReturn();window.addEventListener('brotware:external-open',onOpen);window.addEventListener('brotware:external-close',function(){document.body.classList.remove('bw-external-logic-open');if(returnBtn)returnBtn.classList.remove('show');});setTimeout(ensureButtons,900);}
window.BrotwareExternalNavigation={logic:openLogic,preview:returnPreview,refresh:ensureButtons};
setTimeout(install,0);setTimeout(ensureButtons,1200);
})();