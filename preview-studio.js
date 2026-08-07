(function(){
'use strict';

var back=null,frame=null,shell=null,title=null,sub=null,currentPageId=null,currentDevice='mobile',lastBlob=null;

function page(){return (state.pages||[]).find(function(p){return p.id===currentPageId;})||(typeof currentPage==='function'?currentPage():null);}
function escScript(s){return String(s||'').replace(/<\/script/gi,'<\\/script');}
function bridgeHtml(html){
  if(!html)return html;
  html=html.replace(/location\.href=u/g,"window.parent.postMessage({type:'bw-preview-nav',url:u},'*')");
  html=html.replace(/location\.href=n\.dataset\.href/g,"window.parent.postMessage({type:'bw-preview-nav',url:n.dataset.href},'*')");
  var bridge='<script>(function(){document.addEventListener(\'click\',function(e){var a=e.target.closest&&e.target.closest(\'a[href]\');if(!a)return;var h=a.getAttribute(\'href\')||\'\';if(!h||h[0]===\'#\')return;if(/\\.html?(?:[?#].*)?$/i.test(h)){e.preventDefault();parent.postMessage({type:\'bw-preview-nav\',url:h},\'*\');}});window.addEventListener(\'error\',function(e){parent.postMessage({type:\'bw-preview-error\',message:e.message||\'Erro no JavaScript\'},\'*\');});window.addEventListener(\'unhandledrejection\',function(e){parent.postMessage({type:\'bw-preview-error\',message:String(e.reason&&e.reason.message||e.reason||\'Promise rejeitada\')},\'*\');});})();<\/script>';
  return html.replace('</body>',bridge+'\n</body>');
}
function htmlFor(p){if(!p||typeof compilePage!=='function')return'';return bridgeHtml(compilePage(p));}
function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwPreviewStudio';back.className='bw-preview-backdrop';
  back.innerHTML='<header class="bw-preview-top"><button id="bwPreviewClose" type="button">←</button><div class="bw-preview-title"><strong id="bwPreviewTitle">Preview</strong><small id="bwPreviewSub"></small></div><span class="bw-preview-spacer"></span><button data-bw-preview-device="mobile" type="button">Mobile</button><button data-bw-preview-device="tablet" type="button">Tablet</button><button data-bw-preview-device="desktop" type="button">Desktop</button><button id="bwPreviewProblems" type="button" title="Problemas">!</button><button id="bwPreviewReload" type="button" title="Recarregar">↻</button><button class="primary" id="bwPreviewNewTab" type="button">Nova aba</button></header><main class="bw-preview-stage"><div class="bw-preview-frame-shell" id="bwPreviewShell"><span class="bw-preview-badge" id="bwPreviewBadge">Mobile</span><iframe class="bw-preview-frame" id="bwPreviewFrame" sandbox="allow-scripts allow-forms allow-modals allow-same-origin allow-popups allow-downloads"></iframe><div class="bw-preview-error" id="bwPreviewError"><div><strong>O Preview encontrou um erro</strong><small id="bwPreviewErrorText"></small></div></div></div></main>';
  document.body.appendChild(back);frame=document.getElementById('bwPreviewFrame');shell=document.getElementById('bwPreviewShell');title=document.getElementById('bwPreviewTitle');sub=document.getElementById('bwPreviewSub');
  document.getElementById('bwPreviewClose').onclick=close;document.getElementById('bwPreviewReload').onclick=render;document.getElementById('bwPreviewNewTab').onclick=openNewTab;document.getElementById('bwPreviewProblems').onclick=function(){if(window.BrotwareProfessional&&BrotwareProfessional.problems)BrotwareProfessional.problems();};
  Array.prototype.forEach.call(back.querySelectorAll('[data-bw-preview-device]'),function(b){b.onclick=function(){setDevice(this.dataset.bwPreviewDevice);};});
}
function setDevice(d){currentDevice=d||'mobile';if(!shell)return;shell.classList.remove('mobile','tablet','desktop');shell.classList.add(currentDevice);var badge=document.getElementById('bwPreviewBadge');if(badge)badge.textContent=currentDevice==='desktop'?'Desktop':currentDevice==='tablet'?'Tablet':'Mobile';Array.prototype.forEach.call(back.querySelectorAll('[data-bw-preview-device]'),function(b){b.classList.toggle('active',b.dataset.bwPreviewDevice===currentDevice);});}
function render(){
  build();var p=page();if(!p)return;currentPageId=p.id;title.textContent=p.title||p.name||'Preview';sub.textContent=p.name||'';var err=document.getElementById('bwPreviewError');if(err)err.classList.remove('show');
  try{frame.srcdoc=htmlFor(p);}catch(e){showError(e.message||String(e));}
}
function open(p){
  build();if(typeof saveCurrentPage==='function')saveCurrentPage();p=p||currentPage();if(!p)return;currentPageId=p.id;back.classList.add('show');document.body.classList.add('bw-preview-open');setDevice(window.innerWidth<=760?'mobile':currentDevice);render();
}
function close(){if(back)back.classList.remove('show');document.body.classList.remove('bw-preview-open');}
function showError(message){var e=document.getElementById('bwPreviewError'),t=document.getElementById('bwPreviewErrorText');if(t)t.textContent=message||'Erro desconhecido';if(e)e.classList.add('show');}
function findPageByUrl(url){var clean=String(url||'').split('#')[0].split('?')[0].replace(/^\.\//,'');return (state.pages||[]).find(function(p){return p.name===clean;})||null;}
function onMessage(e){if(!back||!back.classList.contains('show')||e.source!==frame.contentWindow)return;var d=e.data||{};if(d.type==='bw-preview-nav'){var p=findPageByUrl(d.url);if(p){currentPageId=p.id;render();}else if(/^https?:\/\//i.test(String(d.url||''))){window.open(d.url,'_blank','noopener');}else showError('Página não encontrada: '+String(d.url||''));}else if(d.type==='bw-preview-error')showError(d.message||'Erro no JavaScript');}
function openNewTab(){var p=page();if(!p)return;try{var html=compilePage(p);if(lastBlob)URL.revokeObjectURL(lastBlob);lastBlob=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));window.open(lastBlob,'_blank');setTimeout(function(){if(lastBlob){URL.revokeObjectURL(lastBlob);lastBlob=null;}},120000);}catch(e){showError(e.message||String(e));}}
function install(){build();window.preview=open;var run=document.getElementById('runBtn');if(run){run.onclick=function(e){if(e)e.preventDefault();open();};run.dataset.bwPreviewStudio='1';}window.addEventListener('message',onMessage);}

window.BrotwarePreview={open:open,close:close,render:render,setDevice:setDevice};
setTimeout(install,0);setTimeout(install,600);setTimeout(install,1400);
})();
