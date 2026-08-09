(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var SETTINGS_PREFIX='brotware_project_settings_v1:';
var back=null,body=null,title=null,sub=null,foot=null,currentTemplate='',selectedProject='';
var META={
  store:{name:'Loja Básica',icon:'storefront',page:'loja.html'},
  login:{name:'Login Demo',icon:'login',page:'login.html'},
  landing:{name:'Landing Page',icon:'rocket_launch',page:'landing.html'},
  portfolio:{name:'Portfólio',icon:'work',page:'portfolio.html'}
};

function icon(n){return'<span class="bw-google-icon">'+n+'</span>';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function clone(v){return JSON.parse(JSON.stringify(v));}
function uid(prefix){return(prefix||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
function slug(v){var s=String(v||'project').trim().toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}return s.replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function fileName(v){var s=String(v||'tela.html').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/^\.+/,'');if(!s)s='tela.html';if(!/\.html?$/i.test(s))s+='.html';return s;}
function titleFromFile(v){return String(v||'Tela').replace(/\.html?$/i,'').replace(/[-_]+/g,' ').replace(/\b\w/g,function(m){return m.toUpperCase();});}
function readStore(){try{var s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');return s&&Array.isArray(s.projects)?s:{version:1,projects:[]};}catch(_){return{version:1,projects:[]};}}
function writeStore(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function projectById(id,s){s=s||readStore();return s.projects.find(function(p){return p.id===id;})||null;}
function notify(msg){if(typeof toast==='function'){toast(msg);return;}var t=document.getElementById('bwHomeToast');if(t){t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},1700);}}

function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwTemplateUseFlow';back.className='bw-template-flow-backdrop';
  back.innerHTML='<section class="bw-template-flow" role="dialog" aria-modal="true">'+
    '<header class="bw-template-flow-head"><button type="button" id="bwTemplateFlowBack" aria-label="Voltar">'+icon('arrow_back')+'</button><div class="bw-template-flow-title"><b id="bwTemplateFlowTitle">Usar template</b><small id="bwTemplateFlowSub"></small></div><button type="button" id="bwTemplateFlowClose" aria-label="Fechar">'+icon('close')+'</button></header>'+
    '<main class="bw-template-flow-body" id="bwTemplateFlowBody"></main><footer class="bw-template-flow-foot" id="bwTemplateFlowFoot" style="display:none"></footer></section>';
  document.body.appendChild(back);body=document.getElementById('bwTemplateFlowBody');title=document.getElementById('bwTemplateFlowTitle');sub=document.getElementById('bwTemplateFlowSub');foot=document.getElementById('bwTemplateFlowFoot');
  document.getElementById('bwTemplateFlowClose').onclick=close;
  document.getElementById('bwTemplateFlowBack').onclick=function(){renderMode();};
  back.addEventListener('click',function(e){if(e.target===back)close();});
  body.addEventListener('click',onBodyClick);
  foot.addEventListener('click',onFootClick);
  ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend'].forEach(function(type){back.querySelector('.bw-template-flow').addEventListener(type,function(e){e.stopPropagation();},{passive:type.indexOf('touch')===0});});
}
function open(id){build();if(!META[id])return;currentTemplate=id;selectedProject='';back.classList.add('show');document.body.style.overflow='hidden';renderMode();}
function close(){if(!back)return;back.classList.remove('show');currentTemplate='';selectedProject='';if(document.body.classList.contains('bw-project-home-open'))document.body.style.overflow='hidden';else document.body.style.overflow='';}
function header(step){var m=META[currentTemplate]||{name:'Template'};title.textContent=m.name;sub.textContent=step||'Escolha como usar este template';}
function noFoot(){foot.style.display='none';foot.innerHTML='';}
function renderMode(){
  header('Escolha onde usar o template');noFoot();
  body.innerHTML='<div class="bw-template-flow-intro"><strong>Como você quer usar este template?</strong><p>Você pode criar um projeto novo ou adicionar o template como uma nova tela em um projeto que já existe.</p></div>'+
    '<button class="bw-template-dest" type="button" data-template-flow="new">'+icon('create_new_folder')+'<span><b>Criar novo projeto</b><small>Cria um projeto novo usando este template como tela inicial.</small></span><span class="arrow">'+icon('chevron_right')+'</span></button>'+
    '<button class="bw-template-dest" type="button" data-template-flow="existing">'+icon('library_add')+'<span><b>Adicionar em projeto existente</b><small>Escolha um projeto e adicione o template como uma nova página.</small></span><span class="arrow">'+icon('chevron_right')+'</span></button>';
}
function renderNew(){
  var m=META[currentTemplate];header('Criar um projeto com este template');
  body.innerHTML='<div class="bw-template-flow-intro"><strong>Novo projeto</strong><p>Escolha o nome do projeto. O template será usado como a primeira tela.</p></div><div class="bw-template-flow-field">'+icon('favorite')+'<input id="bwTemplateNewProjectName" value="'+esc(m.name)+'" autocomplete="off"><label>Project name</label></div>'+
    '<div class="bw-template-flow-note">'+icon('info')+'<span>Depois você pode alterar nome do app, tema, ícone e versão em Project settings.</span></div>';
  foot.style.display='grid';foot.innerHTML='<button type="button" data-template-foot="cancel">Cancel</button><button class="primary" type="button" data-template-foot="create">Create</button>';
  focusLater('bwTemplateNewProjectName',true);
}
function renderProjects(){
  header('Escolha o projeto');noFoot();var s=readStore(),arr=s.projects.slice();
  var html='<div class="bw-template-flow-intro"><strong>Adicionar em qual projeto?</strong><p>O projeto atual não será substituído. O template entra como uma nova tela.</p></div><div class="bw-template-project-list">';
  if(!arr.length)html+='<div class="bw-template-flow-empty">'+icon('folder_off')+'Nenhum projeto disponível.</div>';
  else arr.forEach(function(p){var pages=p.data&&Array.isArray(p.data.pages)?p.data.pages.length:0;html+='<button class="bw-template-project" type="button" data-template-project="'+esc(p.id)+'">'+icon('web_asset')+'<span><b>'+esc(p.name||'Project')+'</b><small>'+pages+' página'+(pages===1?'':'s')+'</small></span><span class="arrow">'+icon('chevron_right')+'</span></button>';});
  body.innerHTML=html+'</div>';
}
function renderPageName(id){
  var p=projectById(id);if(!p){renderProjects();return;}selectedProject=id;var m=META[currentTemplate];header('Nova tela em '+(p.name||'Project'));
  body.innerHTML='<div class="bw-template-flow-intro"><strong>Nome da nova tela</strong><p>O template será adicionado ao projeto <b>'+esc(p.name||'Project')+'</b> sem apagar as telas existentes.</p></div><div class="bw-template-flow-field">'+icon('description')+'<input id="bwTemplatePageName" value="'+esc(m.page)+'" autocomplete="off" autocapitalize="off"><label>Screen file name</label></div>'+
    '<div class="bw-template-flow-note">'+icon('info')+'<span>Se você digitar apenas “loja”, o Brotware salva como “loja.html”. Eventos e lógica do template acompanham a nova tela.</span></div>';
  foot.style.display='grid';foot.innerHTML='<button type="button" data-template-foot="back-projects">Back</button><button class="primary" type="button" data-template-foot="add-page">Add</button>';
  focusLater('bwTemplatePageName',true);
}
function focusLater(id,select){setTimeout(function(){var i=document.getElementById(id);if(!i)return;try{i.focus({preventScroll:true});}catch(_){i.focus();}if(select)try{i.select();}catch(_){}},80);}

function onBodyClick(e){var a=e.target.closest('[data-template-flow]');if(a){if(a.dataset.templateFlow==='new')renderNew();else renderProjects();return;}var p=e.target.closest('[data-template-project]');if(p){renderPageName(p.dataset.templateProject);}}
function onFootClick(e){var b=e.target.closest('[data-template-foot]');if(!b)return;var a=b.dataset.templateFoot;if(a==='cancel'){close();return;}if(a==='back-projects'){renderProjects();return;}if(a==='create'){createNew();return;}if(a==='add-page'){addToExisting();}}

function newRecordFromTemplate(){
  if(!window.BrotwareHomeV3||typeof BrotwareHomeV3.useTemplate!=='function')return null;
  var before=readStore(),ids={};before.projects.forEach(function(p){ids[p.id]=1;});var prevActive=localStorage.getItem(ACTIVE_KEY)||'';
  BrotwareHomeV3.useTemplate(currentTemplate);
  var after=readStore(),created=null;for(var i=0;i<after.projects.length;i++)if(!ids[after.projects[i].id]){created=after.projects[i];break;}
  return{record:created,previousActive:prevActive};
}
function createNew(){
  var input=document.getElementById('bwTemplateNewProjectName'),name=input?input.value.trim():'';if(!name){notify('Digite o nome do projeto');if(input)input.focus();return;}
  var result=newRecordFromTemplate();if(!result||!result.record){notify('Não foi possível criar o projeto');return;}var s=readStore(),p=projectById(result.record.id,s);if(!p)return;
  p.name=name;p.folderName=slug(name);p.data=p.data||{};p.data.projectName=name;p.data.strings=p.data.strings||{};p.data.strings.app_name=name;p.settings=p.settings||{};p.settings.applicationName=name;writeStore(s);localStorage.setItem(SETTINGS_PREFIX+p.id,JSON.stringify(p.settings));if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.persist==='function')BrotwareProjectSettings.persist(p.settings,p.id);close();
  /* The original template creator already scheduled opening this new record. */
}
function uniquePageName(name,pages){var base=fileName(name),low=base.toLowerCase();if(!(pages||[]).some(function(p){return String(p.name||'').toLowerCase()===low;}))return base;var stem=base.replace(/\.html?$/i,''),ext=/\.htm$/i.test(base)?'.htm':'.html',i=2,n;do{n=stem+'-'+(i++)+ext;}while((pages||[]).some(function(p){return String(p.name||'').toLowerCase()===n.toLowerCase();}));return n;}
function snapshotTemplate(targetId){
  var oldActive=localStorage.getItem(ACTIVE_KEY)||'',before=readStore(),ids={};before.projects.forEach(function(p){ids[p.id]=1;});
  if(!window.BrotwareHomeV3||typeof BrotwareHomeV3.useTemplate!=='function')return null;
  BrotwareHomeV3.useTemplate(currentTemplate);
  var after=readStore(),temp=null;for(var i=0;i<after.projects.length;i++)if(!ids[after.projects[i].id]){temp=after.projects[i];break;}if(!temp)return null;
  var snap=clone(temp);after.projects=after.projects.filter(function(p){return p.id!==temp.id;});writeStore(after);localStorage.removeItem(SETTINGS_PREFIX+temp.id);localStorage.setItem(ACTIVE_KEY,oldActive||targetId);return snap;
}
function mergeObjectsMissing(target,source){target=target||{};source=source||{};Object.keys(source).forEach(function(k){if(target[k]===undefined)target[k]=clone(source[k]);});return target;}
function addToExisting(){
  var input=document.getElementById('bwTemplatePageName'),raw=input?input.value.trim():'';if(!raw){notify('Digite o nome da tela');if(input)input.focus();return;}var store=readStore(),target=projectById(selectedProject,store);if(!target){notify('Projeto não encontrado');renderProjects();return;}
  var snap=snapshotTemplate(selectedProject);if(!snap||!snap.data||!Array.isArray(snap.data.pages)||!snap.data.pages.length){notify('Não foi possível preparar o template');return;}
  /* snapshotTemplate changes localStorage; reload target from the fresh store before writing. */
  store=readStore();target=projectById(selectedProject,store);if(!target)return;target.data=target.data||{};target.data.pages=Array.isArray(target.data.pages)?target.data.pages:[];
  var pg=clone(snap.data.pages[0]),name=uniquePageName(raw,target.data.pages);pg.id=uid('page');pg.name=name;pg.title=titleFromFile(name);pg.createdAt=Date.now();pg.updatedAt=Date.now();
  target.data.pages.push(pg);target.data.currentPageId=pg.id;target.data.variables=mergeObjectsMissing(target.data.variables,snap.data.variables);target.data.strings=target.data.strings||{};Object.keys(snap.data.strings||{}).forEach(function(k){if(k!=='app_name'&&target.data.strings[k]===undefined)target.data.strings[k]=snap.data.strings[k];});
  target.data.functions=target.data.functions||[];(snap.data.functions||[]).forEach(function(f){if(!target.data.functions.some(function(x){return x.id===f.id;}))target.data.functions.push(clone(f));});
  target.updatedAt=Date.now();writeStore(store);localStorage.setItem(ACTIVE_KEY,target.id);close();notify('Tela '+name+' adicionada');
  setTimeout(function(){if(window.BrotwareProjects&&typeof BrotwareProjects.open==='function')BrotwareProjects.open(target.id);},130);
}

/* Intercept the old direct-create behavior before the original template listener. */
document.addEventListener('click',function(e){
  var card=e.target&&e.target.closest?e.target.closest('#bwTemplateView .bw-template-card[data-template-id]'):null;if(!card)return;e.preventDefault();e.stopImmediatePropagation();open(card.dataset.templateId);
},true);

document.addEventListener('keydown',function(e){if(e.key==='Escape'&&back&&back.classList.contains('show'))close();});
setTimeout(build,0);setTimeout(build,800);
window.BrotwareTemplateFlow={open:open};
})();
