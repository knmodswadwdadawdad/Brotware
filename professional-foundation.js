(function(){
'use strict';

var ONBOARD_KEY='brotware_onboarding_v2_done';
var CLIP_KEY='brotware_internal_clipboard_v1';
var problemsButton=null,problemsBackdrop=null,problemsList=null,problemsSummary=null;
var onboarding=null,pageSettings=null,pageSettingsId=null,emptyGuide=null,flowHint=null;
var lastProblems=[];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function current(){return typeof currentPage==='function'?currentPage():null;}
function isTyping(){var e=document.activeElement,t=e&&e.tagName;return t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||(e&&e.isContentEditable);}
function directNodes(parent){return Array.prototype.filter.call((parent||root).children||[],function(n){return n.classList&&n.classList.contains('vf-node');});}
function nodeIdsFromHtml(html){var h=document.createElement('div');h.innerHTML=html||'';return Array.prototype.map.call(h.querySelectorAll('.vf-node'),function(n){return n.dataset.vfId||'';}).filter(Boolean);}
function allPageNodeIds(page){return nodeIdsFromHtml(page&&page.content||'');}

/* ---------- PAGE SCHEMA / SEO ---------- */
function ensurePageData(p,index){
  if(!p)return p;
  if(p.metaDescription==null)p.metaDescription='';
  if(p.favicon==null)p.favicon='';
  if(p.isHome==null)p.isHome=index===0;
  return p;
}
function normalizeHome(){
  if(!state||!state.pages||!state.pages.length)return;
  var home=state.pages.filter(function(p){return p.isHome;});
  if(!home.length)state.pages[0].isHome=true;
  else if(home.length>1){var keep=home[0].id;state.pages.forEach(function(p){p.isHome=p.id===keep;});}
}
function patchSchema(){
  var oldEnsure=window.ensurePageSchema;
  if(oldEnsure&&!oldEnsure.__bwProfessional){
    var wrapped=function(p){var r=oldEnsure.apply(this,arguments);var i=state&&state.pages?state.pages.indexOf(p):-1;ensurePageData(p,i);return r;};
    wrapped.__bwProfessional=true;window.ensurePageSchema=wrapped;
  }
  var oldNew=window.newPage;
  if(oldNew&&!oldNew.__bwProfessional){
    var nw=function(){var p=oldNew.apply(this,arguments);ensurePageData(p,state&&state.pages?state.pages.length:0);return p;};
    nw.__bwProfessional=true;window.newPage=nw;
  }
  if(state&&state.pages)state.pages.forEach(ensurePageData);normalizeHome();
}
function injectHeadMeta(html,page){
  if(!html||!page)return html;
  var meta='';
  if(page.metaDescription)meta+='\n<meta name="description" content="'+esc(page.metaDescription)+'">';
  if(page.favicon)meta+='\n<link rel="icon" href="'+esc(page.favicon)+'">';
  if(!meta)return html;
  return html.replace('</head>',meta+'\n</head>');
}
function patchCompile(){
  if(!window.compilePage||window.compilePage.__bwProfessional)return;
  var old=window.compilePage;
  var wrapped=function(page){return injectHeadMeta(old.apply(this,arguments),page);};
  wrapped.__bwProfessional=true;window.compilePage=wrapped;
}

/* ---------- LOCALIZATION ---------- */
function setText(selector,text){var n=document.querySelector(selector);if(n)n.textContent=text;}
function localize(){
  var tabs=document.querySelectorAll('.tab[data-tab]');
  Array.prototype.forEach.call(tabs,function(t){var m={view:'Interface',event:'Lógica',component:'Componentes',strings:'Textos'};if(m[t.dataset.tab])t.textContent=m[t.dataset.tab];});
  setText('.component-sidebar .section-head strong','Componentes');
  setText('.strings-sidebar .section-head strong','Textos');
  setText('#propertiesModal .modal-head strong','Propriedades');
  setText('#propertiesBtn','Propriedades');
  var labels={add:'Adicionar',layers:'Camadas',logic:'Lógica',settings:'Config.'};
  Object.keys(labels).forEach(function(k){var n=document.querySelector('[data-bw-mobile-nav="'+k+'"] .label');if(n)n.textContent=labels[k];});
  var sub=document.getElementById('bwMobileSubtitle');if(sub){var s=String(sub.textContent||'');if(s==='Design')sub.textContent='Interface';if(s==='Logic')sub.textContent='Lógica';if(s==='Components')sub.textContent='Componentes';if(s==='Strings')sub.textContent='Textos';}
}

/* ---------- ONBOARDING / BEGINNER FLOW ---------- */
function buildOnboarding(){
  if(onboarding)return;
  onboarding=document.createElement('div');onboarding.className='bw-onboarding';onboarding.id='bwOnboarding';
  onboarding.innerHTML='<section class="bw-onboarding-card"><div class="bw-onboarding-head"><small>Primeiros passos</small><h2>Crie seu site sem começar pelo código</h2><p>A Brotware foi organizada para você montar a interface, ligar eventos, testar e exportar no mesmo fluxo.</p></div><div class="bw-onboarding-steps">'+
    step('1','Adicionar','Insira um Layout, texto, botão ou componente pronto.')+
    step('2','Posicionar e editar','Arraste a View e use as propriedades rápidas ou Ver tudo.')+
    step('3','Adicionar evento','Selecione a View e abra Lógica para escolher onClick, onChange e outros.')+
    step('4','Montar a lógica','Encaixe blocos visuais e teste o evento sem escrever JavaScript.')+
    step('5','Executar','Abra o Preview e confira Desktop, Tablet e Mobile.')+
    step('6','Exportar','Baixe a página ou o projeto quando estiver pronto.')+
    '</div><footer class="bw-onboarding-foot"><button id="bwOnboardingExample" type="button">Inserir exemplo</button><span class="spacer"></span><button id="bwOnboardingLater" type="button">Fechar</button><button class="primary" id="bwOnboardingStart" type="button">Começar</button></footer></section>';
  document.body.appendChild(onboarding);
  document.getElementById('bwOnboardingLater').onclick=closeOnboarding;
  document.getElementById('bwOnboardingStart').onclick=function(){localStorage.setItem(ONBOARD_KEY,'1');closeOnboarding();openAdd();};
  document.getElementById('bwOnboardingExample').onclick=function(){
    localStorage.setItem(ONBOARD_KEY,'1');closeOnboarding();
    if(window.builtinComponents&&builtinComponents.hero){builtinComponents.hero();if(typeof toast==='function')toast('Exemplo inserido. Selecione cada item para editar.');}
  };
  onboarding.addEventListener('click',function(e){if(e.target===onboarding)closeOnboarding();});
}
function step(n,title,sub){return '<div class="bw-onboarding-step"><b>'+n+'</b><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span></div>';}
function openOnboarding(){buildOnboarding();onboarding.classList.add('show');}
function closeOnboarding(){if(onboarding)onboarding.classList.remove('show');}
function openAdd(){if(window.BrotwareMobileWorkspace&&BrotwareMobileWorkspace.add)BrotwareMobileWorkspace.add();else{var b=document.querySelector('[data-bw-mobile-nav="add"]');if(b)b.click();}}
function buildEmptyGuide(){
  if(emptyGuide||!document.getElementById('viewPane'))return;
  emptyGuide=document.createElement('div');emptyGuide.className='bw-beginner-empty';emptyGuide.id='bwBeginnerEmpty';
  emptyGuide.innerHTML='<div class="ico">＋</div><strong>Comece pela interface</strong><p>Adicione um elemento ou use um componente pronto. Depois é só arrastar, editar e ligar um evento.</p><div class="bw-beginner-actions"><button class="primary" id="bwEmptyAdd" type="button">Adicionar elemento</button><button id="bwEmptyExample" type="button">Usar exemplo</button></div>';
  document.getElementById('viewPane').appendChild(emptyGuide);
  document.getElementById('bwEmptyAdd').onclick=openAdd;
  document.getElementById('bwEmptyExample').onclick=function(){if(window.builtinComponents&&builtinComponents.hero)builtinComponents.hero();};
}
function syncEmptyGuide(){buildEmptyGuide();if(!emptyGuide||!root)return;emptyGuide.hidden=directNodes(root).length>0||!!(state&&state.dialogEditorActive);}
function buildFlowHint(){
  if(flowHint)return;flowHint=document.createElement('div');flowHint.className='bw-flow-hint';flowHint.innerHTML='<button class="bw-flow-step active">1 Interface</button><span class="bw-flow-arrow">›</span><button class="bw-flow-step">2 Propriedades</button><span class="bw-flow-arrow">›</span><button class="bw-flow-step">3 Lógica</button><span class="bw-flow-arrow">›</span><button class="bw-flow-step">4 Preview</button><span class="bw-flow-arrow">›</span><button class="bw-flow-step">5 Exportar</button>';document.body.appendChild(flowHint);
}
function syncFlowHint(){buildFlowHint();if(!flowHint)return;var p=current(),hasNodes=p&&p.content&&p.content.indexOf('vf-node')>=0;flowHint.classList.toggle('show',!!hasNodes);var active=0;if(document.querySelector('.tab[data-tab="event"].active'))active=2;else if(state&&state.selectedId)active=1;Array.prototype.forEach.call(flowHint.querySelectorAll('.bw-flow-step'),function(b,i){b.classList.toggle('active',i===active);});}

/* ---------- PAGE SETTINGS ---------- */
function buildPageSettings(){
  if(pageSettings)return;
  pageSettings=document.createElement('div');pageSettings.className='bw-page-settings-backdrop';pageSettings.id='bwPageSettingsBackdrop';
  pageSettings.innerHTML='<section class="bw-page-settings"><header><div><strong>Configurações da página</strong><small id="bwPageSettingsSub"></small></div><span class="spacer"></span><button id="bwPageSettingsClose" type="button">×</button></header><main><label>Arquivo HTML<input id="bwPageFile"></label><label>Título da página<input id="bwPageTitle"></label><label>Meta description<textarea id="bwPageDescription" placeholder="Descrição usada por buscadores e compartilhamentos"></textarea></label><label>Favicon / URL da imagem<input id="bwPageFavicon" placeholder="https://.../favicon.png"></label><label class="check"><input id="bwPageHome" type="checkbox"> Definir como página inicial</label></main><footer><button id="bwPageDelete" type="button">Excluir</button><span class="spacer"></span><button id="bwPageSettingsCancel" type="button">Cancelar</button><button class="primary" id="bwPageSettingsSave" type="button">Salvar</button></footer></section>';
  document.body.appendChild(pageSettings);
  document.getElementById('bwPageSettingsClose').onclick=closePageSettings;document.getElementById('bwPageSettingsCancel').onclick=closePageSettings;document.getElementById('bwPageSettingsSave').onclick=savePageSettings;
  document.getElementById('bwPageDelete').onclick=function(){var id=pageSettingsId;closePageSettings();if(id&&typeof pageAction==='function')pageAction('delete',id);};
  pageSettings.addEventListener('click',function(e){if(e.target===pageSettings)closePageSettings();});
}
function openPageSettings(id){
  buildPageSettings();var p=(state.pages||[]).find(function(x){return x.id===(id||state.currentPageId);});if(!p)return;ensurePageData(p,state.pages.indexOf(p));pageSettingsId=p.id;
  document.getElementById('bwPageSettingsSub').textContent=p.name;document.getElementById('bwPageFile').value=p.name||'';document.getElementById('bwPageTitle').value=p.title||'';document.getElementById('bwPageDescription').value=p.metaDescription||'';document.getElementById('bwPageFavicon').value=p.favicon||'';document.getElementById('bwPageHome').checked=!!p.isHome;document.getElementById('bwPageDelete').disabled=state.pages.length<=1;pageSettings.classList.add('show');
}
function closePageSettings(){if(pageSettings)pageSettings.classList.remove('show');pageSettingsId=null;}
function savePageSettings(){
  var p=(state.pages||[]).find(function(x){return x.id===pageSettingsId;});if(!p)return;
  var file=document.getElementById('bwPageFile').value,title=document.getElementById('bwPageTitle').value;
  if(typeof uniquePageName==='function')p.name=uniquePageName(file,p.id);else p.name=file||p.name;
  p.title=title||'Sem título';p.metaDescription=document.getElementById('bwPageDescription').value.trim();p.favicon=document.getElementById('bwPageFavicon').value.trim();
  if(document.getElementById('bwPageHome').checked)state.pages.forEach(function(x){x.isHome=x.id===p.id;});normalizeHome();
  if(typeof updatePageUI==='function')updatePageUI();if(typeof renderPages==='function')renderPages();if(typeof autoSave==='function')autoSave();closePageSettings();refreshProblems();if(typeof toast==='function')toast('Página atualizada');
}
function patchRenderPages(){
  if(!window.renderPages||window.renderPages.__bwProfessional)return;
  var old=window.renderPages;
  var wrapped=function(){var r=old.apply(this,arguments);setTimeout(enhancePageRows,0);return r;};wrapped.__bwProfessional=true;window.renderPages=wrapped;
}
function enhancePageRows(){
  var rows=document.querySelectorAll('.page-row');
  Array.prototype.forEach.call(rows,function(row,index){
    var open=row.querySelector('[data-open-page]');if(!open)return;var id=open.dataset.openPage,p=state.pages.find(function(x){return x.id===id;});if(!p)return;ensurePageData(p,index);
    var main=row.querySelector('.page-row-main small');if(main&&p.isHome&&main.textContent.indexOf('Página inicial')<0)main.textContent='Página inicial · '+(p.title||'Sem título');
    var actions=row.querySelector('.page-row-actions');if(actions&&!actions.querySelector('[data-bw-page-settings]')){
      var settings=document.createElement('button');settings.type='button';settings.title='Configurações da página';settings.dataset.bwPageSettings=id;settings.textContent='⚙';actions.insertBefore(settings,actions.firstChild);
      settings.onclick=function(e){e.stopPropagation();openPageSettings(id);};
    }
  });
}

/* ---------- PROBLEMS ---------- */
function buildProblems(){
  if(problemsBackdrop)return;
  problemsBackdrop=document.createElement('div');problemsBackdrop.className='bw-problems-backdrop';problemsBackdrop.id='bwProblemsBackdrop';
  problemsBackdrop.innerHTML='<section class="bw-problems-panel"><header class="bw-problems-head"><div><strong>Problemas</strong><small id="bwProblemsSub">Análise do projeto</small></div><span class="spacer"></span><button id="bwProblemsRefresh" type="button" title="Atualizar">↻</button><button id="bwProblemsClose" type="button">×</button></header><div class="bw-problems-summary" id="bwProblemsSummary"></div><main class="bw-problems-list" id="bwProblemsList"></main></section>';
  document.body.appendChild(problemsBackdrop);problemsList=document.getElementById('bwProblemsList');problemsSummary=document.getElementById('bwProblemsSummary');
  document.getElementById('bwProblemsClose').onclick=closeProblems;document.getElementById('bwProblemsRefresh').onclick=refreshProblems;problemsBackdrop.addEventListener('click',function(e){if(e.target===problemsBackdrop)closeProblems();});
  problemsList.addEventListener('click',function(e){var n=e.target.closest('[data-problem-page]');if(!n)return;var pid=n.dataset.problemPage,nid=n.dataset.problemNode;closeProblems();if(pid&&pid!==state.currentPageId&&typeof loadPage==='function')loadPage(pid);if(nid)setTimeout(function(){if(typeof selectNode==='function')selectNode(nid);},50);});
}
function installProblemsButton(){
  var top=document.getElementById('bwMobileTopbar'),more=document.getElementById('bwMobileMore');if(!top||!more||problemsButton)return;
  problemsButton=document.createElement('button');problemsButton.id='bwProblemsButton';problemsButton.className='bw-problems-button';problemsButton.type='button';problemsButton.title='Problemas do projeto';problemsButton.innerHTML='<span>!</span><span class="bw-problems-count" id="bwProblemsCount">0</span>';top.insertBefore(problemsButton,more);problemsButton.onclick=openProblems;
}
function problem(level,title,detail,page,node){return{level:level,title:title,detail:detail||'',pageId:page&&page.id||'',nodeId:node||''};}
function validateProject(){
  var out=[],pages=state.pages||[],fnIds=(state.functions||[]).map(function(f){return f.id;});
  pages.forEach(function(p){
    ensurePageData(p,pages.indexOf(p));if(!String(p.title||'').trim())out.push(problem('warning','Página sem título',p.name+' precisa de um título.',p));if(!String(p.metaDescription||'').trim())out.push(problem('info','Meta description vazia',p.name+' pode ter uma descrição para SEO.',p));
    var holder=document.createElement('div');holder.innerHTML=p.content||'';var seen={};
    Array.prototype.forEach.call(holder.querySelectorAll('.vf-node'),function(n){var id=String(n.dataset.vfId||'').trim();if(!id)out.push(problem('error','Elemento sem ID','Uma View não possui ID.',p));else if(seen[id])out.push(problem('error','ID duplicado',id+' aparece mais de uma vez em '+p.name+'.',p,id));else seen[id]=true;var href=n.dataset.href;if(href&&/\.html?$/i.test(href)&&!pages.some(function(x){return x.name===href;}))out.push(problem('warning','Página de destino não existe',id+' aponta para '+href+'.',p,id));});
    if(typeof walkBlocksInPage==='function')walkBlocksInPage(p,function(b){var pr=b.props||{};if(b.type==='fetch'&&!String(pr.url||'').trim())out.push(problem('error','Request sem URL','Existe um bloco HTTP sem URL.',p));if(b.type==='navigate'&&!String(pr.url||'').trim())out.push(problem('warning','Navegação sem destino','Existe um bloco de navegação vazio.',p));['target','source'].forEach(function(k){if(pr[k]&&!seen[pr[k]])out.push(problem('warning','Referência de View inválida',b.type+' aponta para '+pr[k]+', que não existe nesta página.',p,pr[k]));});if(b.type==='callFunction'&&pr.functionId&&fnIds.indexOf(pr.functionId)<0)out.push(problem('warning','Função não encontrada','Um bloco chama uma função que foi removida.',p));});
  });
  if(pages.length&&!pages.some(function(p){return p.isHome;}))out.push(problem('warning','Página inicial não definida','Defina uma página como inicial.',pages[0]));
  return out;
}
function refreshProblems(){
  buildProblems();lastProblems=validateProject();var err=lastProblems.filter(function(x){return x.level==='error';}).length,warn=lastProblems.filter(function(x){return x.level==='warning';}).length,info=lastProblems.length-err-warn;
  if(problemsSummary)problemsSummary.innerHTML='<span class="bw-problem-chip">'+err+' erros</span><span class="bw-problem-chip">'+warn+' avisos</span><span class="bw-problem-chip">'+info+' dicas</span>';
  if(problemsList){if(!lastProblems.length)problemsList.innerHTML='<div class="bw-problems-empty"><strong>Nenhum problema encontrado</strong><span>O projeto passou pelas verificações básicas.</span></div>';else problemsList.innerHTML=lastProblems.map(function(x){var icon=x.level==='error'?'❌':x.level==='warning'?'⚠':'ℹ';return '<article class="bw-problem '+x.level+'" data-problem-page="'+esc(x.pageId)+'" data-problem-node="'+esc(x.nodeId)+'"><b>'+icon+' '+esc(x.title)+'</b><p>'+esc(x.detail)+'</p></article>';}).join('');}
  installProblemsButton();var c=document.getElementById('bwProblemsCount');if(c)c.textContent=String(err+warn);if(problemsButton)problemsButton.classList.toggle('ok',err+warn===0);return lastProblems;
}
function openProblems(){refreshProblems();problemsBackdrop.classList.add('show');}
function closeProblems(){if(problemsBackdrop)problemsBackdrop.classList.remove('show');}

/* ---------- LAYERS: RENAME / HIDE ---------- */
function enhanceLayers(){
  var list=document.getElementById('bwLayersList');if(!list)return;
  Array.prototype.forEach.call(list.querySelectorAll('.bw-layer-row[data-layer-id]'),function(row){
    var id=row.dataset.layerId;if(!id||id==='@root'||row.querySelector('[data-bw-layer-hide]'))return;var el=root.querySelector('[data-vf-id="'+cssId(id)+'"]');if(el&&el.dataset.bwHidden==='1')row.dataset.bwHidden='1';
    var grip=row.querySelector('.bw-layer-grip');var hide=document.createElement('button');hide.type='button';hide.className='bw-layer-action';hide.dataset.bwLayerHide=id;hide.title='Ocultar/mostrar';hide.textContent=el&&el.dataset.bwHidden==='1'?'◉':'◌';var rename=document.createElement('button');rename.type='button';rename.className='bw-layer-action';rename.dataset.bwLayerRename=id;rename.title='Renomear ID';rename.textContent='✎';row.insertBefore(hide,grip||null);row.insertBefore(rename,grip||null);
  });
}
function cssId(v){return String(v||'').replace(/(["\\])/g,'\\$1');}
function installLayerTools(){
  document.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('[data-bw-layer-hide]');if(h){e.preventDefault();e.stopImmediatePropagation();var id=h.dataset.bwLayerHide,el=root.querySelector('[data-vf-id="'+cssId(id)+'"]');if(!el)return;el.dataset.bwHidden=el.dataset.bwHidden==='1'?'0':'1';if(el.dataset.bwHidden==='0')delete el.dataset.bwHidden;if(typeof commit==='function')commit();setTimeout(enhanceLayers,20);refreshProblems();return;}var r=e.target.closest&&e.target.closest('[data-bw-layer-rename]');if(r){e.preventDefault();e.stopImmediatePropagation();renameNode(r.dataset.bwLayerRename);}},true);
  var panel=document.getElementById('bwLayersPanel');if(panel)new MutationObserver(function(){setTimeout(enhanceLayers,0);}).observe(panel,{subtree:true,childList:true});
}
function renameNode(id){var el=root.querySelector('[data-vf-id="'+cssId(id)+'"]');if(!el)return;var name=prompt('Novo ID:',id);if(name===null)return;name=name.trim().replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'');if(!name||name===id)return;if(root.querySelector('[data-vf-id="'+cssId(name)+'"]')){toast('Esse ID já existe');return;}if(typeof renameNodeInEvents==='function')renameNodeInEvents(id,name);el.dataset.vfId=name;state.selectedId=name;if(typeof commit==='function')commit();if(typeof selectNode==='function')selectNode(name);setTimeout(enhanceLayers,20);}
function patchHiddenExport(){
  if(!window.cleanupExportDom||window.cleanupExportDom.__bwHidden)return;var old=window.cleanupExportDom;var wrapped=function(page){var html=old.apply(this,arguments),h=document.createElement('div');h.innerHTML=html;Array.prototype.forEach.call(h.querySelectorAll('.vf-node[data-bw-hidden="1"]'),function(n){n.style.display='none';});return h.innerHTML;};wrapped.__bwHidden=true;window.cleanupExportDom=wrapped;
}

/* ---------- PRODUCTIVITY / CLIPBOARD ---------- */
function cleanClone(el){var c=el.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll('[data-bound]'),function(n){n.removeAttribute('data-bound');});c.removeAttribute('data-bound');c.classList.remove('selected');return c;}
function copySelected(){var el=selected();if(!el)return;var c=cleanClone(el);try{localStorage.setItem(CLIP_KEY,c.outerHTML);toast('Elemento copiado');}catch(e){}}
function remapTreeIds(el){var all=[el].concat(Array.prototype.slice.call(el.querySelectorAll('.vf-node')));all.forEach(function(n){if(n.dataset&&n.dataset.vfId){var old=n.dataset.vfId;n.dataset.vfId=typeof nodeId==='function'?nodeId(n.dataset.type):old+'-copy';}});}
function pasteSelected(){var html='';try{html=localStorage.getItem(CLIP_KEY)||'';}catch(e){}if(!html){toast('Nada copiado');return;}var box=document.createElement('div');box.innerHTML=html;var el=box.firstElementChild;if(!el)return;remapTreeIds(el);el.style.left=((parseFloat(el.style.left)||0)+16)+'px';el.style.top=((parseFloat(el.style.top)||0)+16)+'px';var parent=selected();if(!(parent&&typeof isLayout==='function'&&isLayout(parent.dataset.type)))parent=root;parent.appendChild(el);if(typeof bindAllNodes==='function')bindAllNodes();if(typeof selectNode==='function')selectNode(el.dataset.vfId);if(typeof commit==='function')commit();toast('Elemento colado');}
function toggleGrid(){var b=document.getElementById('gridBtn');if(b){b.click();return;}state.snap=state.snap?0:8;var g=document.getElementById('gridLayer');if(g)g.style.display=state.snap?'block':'none';}
function installShortcuts(){
  window.addEventListener('keydown',function(e){if(isTyping())return;var k=String(e.key||'').toLowerCase(),mod=e.ctrlKey||e.metaKey;if(mod&&k==='c'&&state.selectedId){e.preventDefault();copySelected();return;}if(mod&&k==='v'){e.preventDefault();pasteSelected();return;}if(mod&&k==='d'&&state.selectedId){e.preventDefault();if(typeof duplicateSelected==='function')duplicateSelected();return;}if(e.key==='F2'&&state.selectedId){e.preventDefault();renameNode(state.selectedId);return;}if(k==='g'&&!mod){e.preventDefault();toggleGrid();return;}if(mod&&e.key==='Enter'){e.preventDefault();if(typeof preview==='function')preview();return;}if(e.key==='?'&&!mod){e.preventDefault();openOnboarding();}}
  );
}

/* ---------- MORE MENU INTEGRATION ---------- */
function enhanceMoreSheet(){
  var title=document.getElementById('bwMobileSheetTitle'),body=document.getElementById('bwMobileSheetBody');if(!title||!body)return;if(String(title.textContent||'').trim().toLowerCase()!=='mais')return;if(body.querySelector('[data-bw-professional-action]'))return;
  var list=body.querySelector('.bw-mobile-menu-list')||body;var html='<button class="bw-mobile-menu-item" type="button" data-bw-professional-action="page"><span class="ico">▤</span><span><b>Configurar página</b><small>Título, SEO, favicon e página inicial</small></span><span class="chev">›</span></button><button class="bw-mobile-menu-item" type="button" data-bw-professional-action="problems"><span class="ico">!</span><span><b>Problemas</b><small>Erros, avisos e referências quebradas</small></span><span class="chev">›</span></button><button class="bw-mobile-menu-item" type="button" data-bw-professional-action="tutorial"><span class="ico">?</span><span><b>Tutorial</b><small>Reabrir os primeiros passos</small></span><span class="chev">›</span></button><button class="bw-mobile-menu-item" type="button" data-bw-professional-action="export"><span class="ico">⇩</span><span><b>Exportar página</b><small>Baixar o HTML atual</small></span><span class="chev">›</span></button>';
  list.insertAdjacentHTML('beforeend',html);
}
function installMoreIntegration(){
  var body=document.getElementById('bwMobileSheetBody'),title=document.getElementById('bwMobileSheetTitle');if(body&&title)new MutationObserver(function(){setTimeout(enhanceMoreSheet,0);}).observe(body,{childList:true,subtree:true});
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bw-professional-action]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();var close=document.getElementById('bwMobileSheetClose');if(close)close.click();var a=b.dataset.bwProfessionalAction;if(a==='page')openPageSettings();else if(a==='problems')openProblems();else if(a==='tutorial')openOnboarding();else if(a==='export'&&typeof exportCurrent==='function')exportCurrent();},true);
}

/* ---------- WRAPPERS / OBSERVERS ---------- */
function installWrappers(){
  if(window.commit&&!window.commit.__bwProfessional){var c=window.commit;var wc=function(){var r=c.apply(this,arguments);setTimeout(function(){syncEmptyGuide();syncFlowHint();refreshProblems();},30);return r;};wc.__bwProfessional=true;window.commit=wc;}
  if(window.loadPage&&!window.loadPage.__bwProfessional){var lp=window.loadPage;var wl=function(){var r=lp.apply(this,arguments);setTimeout(function(){patchSchema();localize();syncEmptyGuide();syncFlowHint();refreshProblems();},30);return r;};wl.__bwProfessional=true;window.loadPage=wl;}
  if(window.switchTab&&!window.switchTab.__bwProfessional){var st=window.switchTab;var ws=function(){var r=st.apply(this,arguments);setTimeout(function(){localize();syncFlowHint();},20);return r;};ws.__bwProfessional=true;window.switchTab=ws;}
  if(window.saveLogic&&!window.saveLogic.__bwProfessional){var sl=window.saveLogic;var wsl=function(){var r=sl.apply(this,arguments);setTimeout(refreshProblems,25);return r;};wsl.__bwProfessional=true;window.saveLogic=wsl;}
}
function observeRoot(){if(!root||root.dataset.bwProfessionalObserved==='1')return;root.dataset.bwProfessionalObserved='1';new MutationObserver(function(){syncEmptyGuide();}).observe(root,{childList:true,subtree:false});}

function install(){
  patchSchema();patchCompile();patchRenderPages();installWrappers();buildOnboarding();buildEmptyGuide();buildFlowHint();buildProblems();installProblemsButton();installLayerTools();patchHiddenExport();installShortcuts();installMoreIntegration();observeRoot();localize();syncEmptyGuide();syncFlowHint();refreshProblems();
  setTimeout(function(){patchCompile();patchHiddenExport();installProblemsButton();enhanceLayers();localize();if(!localStorage.getItem(ONBOARD_KEY))openOnboarding();},600);
}

window.BrotwareProfessional={onboarding:openOnboarding,problems:openProblems,validate:validateProject,pageSettings:openPageSettings,copy:copySelected,paste:pasteSelected,refresh:function(){patchSchema();localize();syncEmptyGuide();syncFlowHint();refreshProblems();}};
setTimeout(install,0);setTimeout(function(){patchCompile();patchHiddenExport();installProblemsButton();},1200);
})();
