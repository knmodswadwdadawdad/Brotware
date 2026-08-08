(function(){
'use strict';

var installed=false,zoom=1,device='mobile',topTools=null,menu=null,runBtn=null,zoomLabel=null,deviceBtn=null,dockWired=false;
function hs(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function active(){var s=hs();return !!(s&&s.active&&s.projectId);}
function selected(){return window.BrotwareHybridEditor&&BrotwareHybridEditor.selection?BrotwareHybridEditor.selection():(hs().selection||null);}
function basename(path){path=String(path||'index.html').replace(/\\/g,'/');return path.split('/').pop()||'index.html';}
function workspace(){return document.getElementById('bwExternalWorkspace');}
function shell(){return document.getElementById('bwExternalShell');}
function closeMenu(){if(menu)menu.classList.remove('show');}
function toastMsg(s){if(typeof toast==='function')toast(s);}

function setDevice(d){
  device=d||'mobile';
  if(window.BrotwareExternalPreview&&BrotwareExternalPreview.setDevice)BrotwareExternalPreview.setDevice(device);
  var sh=shell();if(sh){sh.classList.remove('mobile','tablet','desktop');sh.classList.add(device);}
  if(deviceBtn&&deviceBtn.textContent!==device.charAt(0).toUpperCase()+device.slice(1))deviceBtn.textContent=device.charAt(0).toUpperCase()+device.slice(1);
}
function cycleDevice(){setDevice(device==='mobile'?'tablet':device==='tablet'?'desktop':'mobile');}
function setZoom(v){
  zoom=Math.max(.5,Math.min(1.75,Math.round(v*10)/10));
  var sh=shell();if(sh)sh.style.setProperty('--bw-native-import-zoom',zoom);
  var label=Math.round(zoom*100)+'%';if(zoomLabel&&zoomLabel.textContent!==label)zoomLabel.textContent=label;
}
function runToggle(){
  if(!window.BrotwareHybridEditor)return;
  var editing=BrotwareHybridEditor.isEdit&&BrotwareHybridEditor.isEdit();
  BrotwareHybridEditor.setEdit(!editing);
  syncRun();toastMsg(editing?'Modo de interação':'Modo de edição');
}
function syncRun(){
  if(!runBtn||!window.BrotwareHybridEditor)return;
  var editing=BrotwareHybridEditor.isEdit&&BrotwareHybridEditor.isEdit(),html=editing?'▶':'✎';
  runBtn.classList.toggle('active',!editing);runBtn.title=editing?'Executar / interagir':'Voltar para edição';if(runBtn.innerHTML!==html)runBtn.innerHTML=html;
}
function openConfig(){var s=selected();if(s&&window.BrotwareExternalInspector)BrotwareExternalInspector.render(s);else toggleMenu(true);}

function buildTop(){
  var top=document.querySelector('#bwExternalWorkspace .bw-external-top');if(!top)return;
  top.classList.add('bw-import-native-topbar');
  var title=document.querySelector('#bwExternalWorkspace .bw-external-title');
  if(title){title.classList.add('bw-import-native-title');var st=hs(),strong=title.querySelector('strong'),small=title.querySelector('small'),name=basename(st.entry);if(strong&&strong.textContent!==name)strong.textContent=name;if(small&&small.textContent!=='Interface')small.textContent='Interface';}
  var back=document.getElementById('bwExternalBack');if(back){back.classList.add('bw-import-native-back');if(back.textContent!=='←')back.textContent='←';}
  if(topTools)return;
  topTools=document.createElement('div');topTools.id='bwImportNativeTopTools';topTools.className='bw-import-native-tools';
  topTools.innerHTML='<div class="bw-import-native-zoom"><button type="button" data-bw-zoom="out">−</button><span id="bwImportZoomLabel">100%</span><button type="button" data-bw-zoom="in">+</button></div><button id="bwImportDevice" class="bw-import-native-device" type="button">Mobile</button><button id="bwImportRun" class="bw-import-native-run" type="button" title="Executar / interagir">▶</button><button id="bwImportIssues" class="bw-import-native-issues" type="button" title="Erros do preview">!</button><button id="bwImportMore" class="bw-import-native-more" type="button" title="Mais">⋮</button>';
  top.appendChild(topTools);zoomLabel=document.getElementById('bwImportZoomLabel');deviceBtn=document.getElementById('bwImportDevice');runBtn=document.getElementById('bwImportRun');
  topTools.addEventListener('click',function(e){var z=e.target.closest('[data-bw-zoom]');if(z){setZoom(zoom+(z.dataset.bwZoom==='in'?0.1:-0.1));return;}if(e.target.closest('#bwImportDevice')){cycleDevice();return;}if(e.target.closest('#bwImportRun')){runToggle();return;}if(e.target.closest('#bwImportIssues')){var box=document.getElementById('bwExternalErrors');if(box)box.classList.toggle('force-show');return;}if(e.target.closest('#bwImportMore')){toggleMenu();return;}});
  buildMenu();
}
function buildMenu(){
  if(menu)return;
  menu=document.createElement('div');menu.id='bwImportNativeMenu';menu.className='bw-import-native-menu';
  menu.innerHTML='<button type="button" data-bw-import-menu="select"><span>▣</span><b>Select View</b><small>Escolher elemento da página</small></button><button type="button" data-bw-import-menu="inspect"><span>⌖</span><b>Propriedades</b><small>Inspecionar elemento selecionado</small></button><button type="button" data-bw-import-menu="reload"><span>↻</span><b>Recarregar</b><small>Executar o site novamente</small></button><button type="button" data-bw-import-menu="export"><span>⇩</span><b>Exportar</b><small>Baixar projeto preservando HTML/CSS/JS</small></button>';
  document.body.appendChild(menu);menu.addEventListener('click',function(e){var b=e.target.closest('[data-bw-import-menu]');if(!b)return;var a=b.dataset.bwImportMenu;closeMenu();if(a==='select'&&window.BrotwareViewSelector)BrotwareViewSelector.open();else if(a==='inspect'){var s=selected();if(s&&window.BrotwareExternalInspector)BrotwareExternalInspector.render(s);else toastMsg('Selecione uma View primeiro');}else if(a==='reload'){var r=document.getElementById('bwExternalReload');if(r)r.click();}else if(a==='export'){var st=hs();if(st.projectId&&window.BrotwareUniversalExporter)BrotwareUniversalExporter.exportProject(st.projectId);}});
  document.addEventListener('pointerdown',function(e){if(menu&&menu.classList.contains('show')&&!e.target.closest('#bwImportNativeMenu')&&!e.target.closest('#bwImportMore'))closeMenu();},true);
}
function toggleMenu(force){if(!menu)buildMenu();if(!menu)return;var more=document.getElementById('bwImportMore'),r=more&&more.getBoundingClientRect();if(r){menu.style.right=Math.max(10,window.innerWidth-r.right)+'px';menu.style.top=(r.bottom+7)+'px';}menu.classList.toggle('show',force===true?true:!menu.classList.contains('show'));}

function wireDock(){
  var dock=document.getElementById('bwHybridNativeBottom');if(!dock)return;
  dock.classList.add('bw-import-native-bottom');
  if(dock.dataset.bwImportShell!=='1'){
    var btns=dock.querySelectorAll('button');if(btns.length>=4){btns[0].dataset.bwNativeNav='add';btns[0].innerHTML='<span>＋</span><b>Adicionar</b>';btns[1].innerHTML='<span>☷</span><b>Camadas</b>';btns[2].innerHTML='<span>⚡</span><b>Lógica</b>';btns[3].dataset.bwNativeNav='config';btns[3].innerHTML='<span>⚙</span><b>Config.</b>';}
    dock.dataset.bwImportShell='1';
  }
  if(dockWired)return;dockWired=true;
  dock.addEventListener('click',function(e){var b=e.target.closest('[data-bw-native-nav]');if(!b)return;var a=b.dataset.bwNativeNav;if(a==='add'){e.preventDefault();e.stopImmediatePropagation();if(window.BrotwareHybridEditor&&BrotwareHybridEditor.add)BrotwareHybridEditor.add();}else if(a==='config'){e.preventDefault();e.stopImmediatePropagation();openConfig();}},true);
}
function syncIssueCount(){var b=document.getElementById('bwImportIssues'),box=document.getElementById('bwExternalErrors');if(!b||!box)return;var n=box.children.length,html='!'+(n?'<i>'+n+'</i>':'');b.dataset.count=String(n);b.classList.toggle('has-issues',n>0);if(b.innerHTML!==html)b.innerHTML=html;}
function applyNativeCanvas(){var ws=workspace(),sh=shell();if(!ws||!sh)return;ws.classList.add('bw-import-native-shell');setZoom(zoom);setDevice(device);}
function refresh(){if(!active())return;buildTop();wireDock();applyNativeCanvas();syncRun();syncIssueCount();}
function onOpen(){zoom=1;device='mobile';setTimeout(function(){refresh();setDevice('mobile');},120);setTimeout(refresh,420);}
function onClose(){closeMenu();var ws=workspace();if(ws)ws.classList.remove('bw-import-native-shell');}
function install(){if(installed)return;if(!window.BrotwareExternalHybrid||!window.BrotwareHybridEditor){setTimeout(install,120);return;}installed=true;window.addEventListener('brotware:external-open',onOpen);window.addEventListener('brotware:external-ready',refresh);window.addEventListener('brotware:external-selection',refresh);window.addEventListener('brotware:external-snapshot',refresh);window.addEventListener('brotware:external-close',onClose);setInterval(function(){if(active())refresh();},800);}
window.BrotwareExternalNativeShell={refresh:refresh,setZoom:setZoom,setDevice:setDevice};
setTimeout(install,0);setTimeout(install,900);
})();