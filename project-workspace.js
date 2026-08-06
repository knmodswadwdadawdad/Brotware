(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var LEGACY_KEY=state.storageKey||'brotware_studio_project_v3';
var activeProjectId=localStorage.getItem(ACTIVE_KEY)||null;
var sortMode='updated';
var home=null,listEl=null,searchEl=null,fileInput=null,dialog=null,toastEl=null;

function clone(v){return JSON.parse(JSON.stringify(v));}
function h(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function slug(v){var s=String(v||'project').trim().toLowerCase().normalize?String(v||'project').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''):String(v||'project').trim().toLowerCase();return s.replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function fileSafe(v){return String(v||'index.html').replace(/[\\/:*?"<>|]+/g,'-').replace(/^\.+/,'')||'index.html';}
function fmtDate(ms){try{return new Date(ms||Date.now()).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'});}catch(e){return'';}}

function readStore(){
  try{
    var d=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(d&&Array.isArray(d.projects))return d;
  }catch(e){}
  return{version:1,projects:[]};
}
function writeStore(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function findProject(id,store){store=store||readStore();for(var i=0;i<store.projects.length;i++)if(store.projects[i].id===id)return store.projects[i];return null;}
function projectDataSnapshot(){
  if(typeof saveCurrentPage==='function')saveCurrentPage();
  return{
    version:4,
    projectName:state.projectName||'Brotware Project',
    pages:clone(state.pages||[]),
    currentPageId:state.currentPageId,
    strings:clone(state.strings||{}),
    variables:clone(state.variables||{}),
    functions:clone(state.functions||[]),
    components:clone(state.components||[]),
    counter:state.counter||1
  };
}
function normalizeData(d){
  d=d||{};
  if(!Array.isArray(d.pages)||!d.pages.length){
    var p=freshPage('index.html','Página inicial');d.pages=[p];d.currentPageId=p.id;
  }
  d.projectName=d.projectName||'Brotware Project';
  d.currentPageId=d.currentPageId||d.pages[0].id;
  d.strings=d.strings||{app_name:'Meu Site'};d.variables=d.variables||{counter:0};d.functions=d.functions||[];d.components=d.components||[];d.counter=d.counter||1;
  d.pages.forEach(function(p){if(typeof ensurePageSchema==='function')ensurePageSchema(p);});
  return d;
}
function freshPage(name,title){
  return{id:uid('page'),name:fileSafe(name||'index.html'),title:title||'Página inicial',background:'#ffffff',content:'',events:{'@page':{load:[]}},enabledEvents:['load'],createdAt:Date.now(),updatedAt:Date.now()};
}
function freshProjectData(name,file,title){
  var p=freshPage(file||'index.html',title||'Página inicial');
  return{version:4,projectName:name||'New Project',pages:[p],currentPageId:p.id,strings:{app_name:name||'Meu Site'},variables:{counter:0},functions:[],components:[],counter:1};
}
function migrateLegacy(){
  var s=readStore();if(s.projects.length)return s;
  var d=null;
  try{var raw=localStorage.getItem(LEGACY_KEY);if(raw)d=JSON.parse(raw);}catch(e){}
  if(!d||!Array.isArray(d.pages)||!d.pages.length)d=projectDataSnapshot();
  d=normalizeData(d);
  var rec={id:uid('project'),name:d.projectName||'Brotware Project',folderName:slug(d.projectName),createdAt:Date.now(),updatedAt:Date.now(),data:d};
  s.projects.push(rec);writeStore(s);activeProjectId=rec.id;localStorage.setItem(ACTIVE_KEY,rec.id);return s;
}

function bwAutoSave(){
  try{
    if(!activeProjectId){if(typeof status==='function')status('Saved');return;}
    var s=readStore(),p=findProject(activeProjectId,s);if(!p)return;
    var d=projectDataSnapshot();p.name=d.projectName||p.name;p.folderName=slug(p.name);p.updatedAt=Date.now();p.data=d;writeStore(s);
    /* Keep one legacy recovery copy for backward compatibility. */
    try{localStorage.setItem(LEGACY_KEY,JSON.stringify(d));}catch(_){}
    if(typeof status==='function')status('Saved');
    if(home&&home.classList.contains('show'))renderProjects();
  }catch(e){if(typeof status==='function')status('Save error');console.error(e);}
}

function applyProjectData(data){
  data=normalizeData(clone(data));
  state.projectName=data.projectName;state.pages=data.pages;state.currentPageId=data.currentPageId;
  state.strings=data.strings;state.variables=data.variables;state.functions=data.functions;state.components=data.components;state.counter=data.counter;
  state.histories={};state.historyIndex={};state.selectedId=null;
  if(typeof loadPage==='function')loadPage(state.currentPageId,true);
  if(typeof renderVariables==='function')renderVariables();if(typeof renderFunctions==='function')renderFunctions();if(typeof renderStrings==='function')renderStrings();if(typeof renderComponents==='function')renderComponents();if(typeof refreshStringOptions==='function')refreshStringOptions();
  if(typeof updatePageUI==='function')updatePageUI();
}
function openProject(id){
  var s=readStore(),p=findProject(id,s);if(!p)return;
  activeProjectId=id;localStorage.setItem(ACTIVE_KEY,id);applyProjectData(p.data);hideHome();
  if(typeof switchTab==='function')switchTab('view');
}

function notify(msg){
  if(!toastEl)return;if(home&&home.classList.contains('show')){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(function(){toastEl.classList.remove('show');},1600);}else if(typeof toast==='function')toast(msg);
}
function showHome(saveFirst){
  if(saveFirst!==false&&activeProjectId)bwAutoSave();
  if(window.BrotwareSketchLogic&&typeof window.BrotwareSketchLogic.close==='function')window.BrotwareSketchLogic.close();
  document.querySelectorAll('.modal-backdrop.show,.modal.show').forEach(function(m){m.classList.remove('show');});
  home.classList.add('show');document.body.classList.add('bw-project-home-open');renderProjects();
  setTimeout(function(){if(searchEl)searchEl.focus({preventScroll:true});},80);
}
function hideHome(){home.classList.remove('show');document.body.classList.remove('bw-project-home-open');closeDialog();}

function renderProjects(){
  if(!listEl)return;var s=readStore(),q=String(searchEl&&searchEl.value||'').trim().toLowerCase(),arr=s.projects.slice();
  if(sortMode==='name')arr.sort(function(a,b){return String(a.name).localeCompare(String(b.name));});else arr.sort(function(a,b){return(b.updatedAt||0)-(a.updatedAt||0);});
  if(q)arr=arr.filter(function(p){return String(p.name).toLowerCase().indexOf(q)>=0||String(p.folderName||'').toLowerCase().indexOf(q)>=0;});
  listEl.innerHTML='';
  if(!arr.length){listEl.innerHTML='<div class="bw-empty-projects">Nenhum projeto encontrado.<br>Toque em <b>New Project</b> para começar.</div>';return;}
  arr.forEach(function(p){
    var pages=(p.data&&p.data.pages)||[],card=document.createElement('article');card.className='bw-project-card'+(p.id===activeProjectId?' active':'');card.dataset.projectId=p.id;
    card.innerHTML='<div class="bw-project-icon">&lt;/&gt;</div><div class="bw-project-meta"><strong>'+h(p.name)+'</strong><div class="bw-project-line"><span class="bw-project-badge">Web</span><small>'+pages.length+' página'+(pages.length===1?'':'s')+' · HTML/CSS/JS · '+fmtDate(p.updatedAt)+'</small></div><span class="bw-project-folder">'+h((p.folderName||slug(p.name))+'/')+'</span></div><button class="bw-project-more" type="button" aria-label="Menu">•••</button><div class="bw-project-menu"><button data-project-action="rename">Renomear</button><button data-project-action="duplicate">Duplicar</button><button data-project-action="export">Exportar ZIP</button><button class="danger" data-project-action="delete">Excluir</button></div>';
    listEl.appendChild(card);
  });
}

function openNewDialog(){
  document.getElementById('bwNewProjectName').value='New Project';document.getElementById('bwNewProjectFile').value='index.html';document.getElementById('bwNewProjectTitle').value='Página inicial';dialog.classList.add('show');setTimeout(function(){document.getElementById('bwNewProjectName').select();},40);
}
function closeDialog(){if(dialog)dialog.classList.remove('show');}
function createProjectFromDialog(){
  var name=document.getElementById('bwNewProjectName').value.trim()||'New Project';
  var file=fileSafe(document.getElementById('bwNewProjectFile').value.trim()||'index.html');if(!/\.html?$/i.test(file))file+='.html';
  var title=document.getElementById('bwNewProjectTitle').value.trim()||'Página inicial';
  var d=freshProjectData(name,file,title),s=readStore(),rec={id:uid('project'),name:name,folderName:slug(name),createdAt:Date.now(),updatedAt:Date.now(),data:d};s.projects.push(rec);writeStore(s);closeDialog();openProject(rec.id);notify('Projeto criado');
}
function renameProject(id){
  var s=readStore(),p=findProject(id,s);if(!p)return;var n=prompt('Nome do projeto:',p.name);if(n===null)return;n=n.trim();if(!n)return;
  p.name=n;p.folderName=slug(n);p.data.projectName=n;p.updatedAt=Date.now();writeStore(s);
  if(id===activeProjectId){state.projectName=n;if(typeof updatePageUI==='function')updatePageUI();bwAutoSave();}renderProjects();
}
function duplicateProject(id){
  var s=readStore(),p=findProject(id,s);if(!p)return;var d=clone(p.data),name=p.name+' Copy';d.projectName=name;var rec={id:uid('project'),name:name,folderName:slug(name),createdAt:Date.now(),updatedAt:Date.now(),data:d};s.projects.push(rec);writeStore(s);renderProjects();notify('Projeto duplicado');
}
function deleteProject(id){
  var s=readStore(),p=findProject(id,s);if(!p||!confirm('Excluir o projeto '+p.name+'?'))return;s.projects=s.projects.filter(function(x){return x.id!==id;});
  if(activeProjectId===id){activeProjectId=s.projects.length?s.projects[0].id:null;if(activeProjectId)localStorage.setItem(ACTIVE_KEY,activeProjectId);else localStorage.removeItem(ACTIVE_KEY);}
  writeStore(s);renderProjects();notify('Projeto excluído');
}

/* ---------- Separate-file project compiler ---------- */
function baseProjectCss(data){
  var css='*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{min-height:100vh}#app{position:relative;width:100%;min-height:100vh;overflow:hidden}.vf-node{position:absolute}.node-text{width:100%;height:100%;display:flex;align-items:center;padding:4px 6px}.node-button,.node-input,.node-textarea,.node-select,.node-image,.node-link,.node-checkbox,.node-progress,.node-divider,.node-layout,.node-card{width:100%;height:100%}.node-button{border:0;border-radius:7px;background:#6567f4;color:#fff;font-weight:700}.node-input,.node-textarea,.node-select{border:1px solid #aeb9c4;border-radius:7px;padding:7px 9px}.node-image{display:grid;place-items:center;background:#dbe5ed}.node-image img{width:100%;height:100%;object-fit:cover}.node-link{display:flex;align-items:center;color:#126ec5;text-decoration:underline}.node-checkbox{display:flex;align-items:center;gap:7px}.node-progress{display:flex;align-items:center}.node-progress span{height:9px;width:100%;border-radius:99px;background:#d7dee4;overflow:hidden}.node-progress i{display:block;width:60%;height:100%;background:#6567f4}.node-divider{display:flex;align-items:center}.node-divider:before{content:"";width:100%;height:1px;background:#bdc7cf}.node-layout{border:0;background:transparent}.node-layout-label{display:none}.node-card{border:1px solid #dce3e8;border-radius:13px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.10)}';
  (data.pages||[]).forEach(function(p){var n=String(p.name).replace(/"/g,'\\"');var bg=typeof cssSafe==='function'?cssSafe(p.background||'#fff'):(p.background||'#fff');css+='\nbody[data-brotware-page="'+n+'"],body[data-brotware-page="'+n+'"] #app{background:'+bg+'}';});
  return css+'\n';
}
function runtimeForData(page,data){
  var ov=state.variables,of=state.functions,code='';
  try{state.variables=data.variables||{};state.functions=data.functions||[];code=runtimeScriptForPage(page);}finally{state.variables=ov;state.functions=of;}
  return code;
}
function sharedProjectScript(data){
  var out="'use strict';\n";
  (data.pages||[]).forEach(function(p){out+='\nif(document.body&&document.body.dataset.brotwarePage==='+JSON.stringify(p.name)+'){\n'+runtimeForData(p,data)+'\n}\n';});
  return out;
}
function pageFileHtml(page){
  var content=cleanupExportDom(page);return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+h(page.title||page.name)+'</title>\n<link rel="stylesheet" href="style.css">\n<script src="script.js" defer><\/script>\n</head>\n<body data-brotware-page="'+h(page.name)+'">\n<div id="app">'+content+'</div>\n</body>\n</html>\n';
}
function projectFiles(record){
  var data=normalizeData(clone(record.data)),folder=record.folderName||slug(record.name),files={};
  (data.pages||[]).forEach(function(p){files[folder+'/'+fileSafe(p.name)]=pageFileHtml(p);});
  files[folder+'/style.css']=baseProjectCss(data);files[folder+'/script.js']=sharedProjectScript(data);
  files[folder+'/brotware.json']=JSON.stringify({format:'Brotware Project Folder',version:4,projectName:data.projectName,pages:data.pages,currentPageId:data.currentPageId,strings:data.strings,variables:data.variables,functions:data.functions,components:data.components,counter:data.counter},null,2);
  return files;
}

/* ---------- Minimal STORE ZIP writer, no external library ---------- */
var CRC_TABLE=null;
function crcTable(){if(CRC_TABLE)return CRC_TABLE;CRC_TABLE=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);CRC_TABLE[n]=c>>>0;}return CRC_TABLE;}
function crc32(bytes){var c=0xffffffff,t=crcTable();for(var i=0;i<bytes.length;i++)c=t[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function put16(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;}
function put32(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255;}
function dosStamp(d){d=d||new Date();var y=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}
function concatBytes(parts){var len=0;parts.forEach(function(p){len+=p.length;});var out=new Uint8Array(len),o=0;parts.forEach(function(p){out.set(p,o);o+=p.length;});return out;}
function makeZip(files){
  var enc=new TextEncoder(),stamp=dosStamp(new Date()),names=Object.keys(files),locals=[],centrals=[],offset=0,entries=[];
  names.forEach(function(name){
    var nb=enc.encode(name),db=enc.encode(String(files[name])),crc=crc32(db),lh=new Uint8Array(30+nb.length);put32(lh,0,0x04034b50);put16(lh,4,20);put16(lh,6,0x0800);put16(lh,8,0);put16(lh,10,stamp.time);put16(lh,12,stamp.date);put32(lh,14,crc);put32(lh,18,db.length);put32(lh,22,db.length);put16(lh,26,nb.length);put16(lh,28,0);lh.set(nb,30);entries.push({name:nb,data:db,crc:crc,offset:offset});locals.push(lh,db);offset+=lh.length+db.length;
  });
  var centralStart=offset;
  entries.forEach(function(e){var ch=new Uint8Array(46+e.name.length);put32(ch,0,0x02014b50);put16(ch,4,20);put16(ch,6,20);put16(ch,8,0x0800);put16(ch,10,0);put16(ch,12,stamp.time);put16(ch,14,stamp.date);put32(ch,16,e.crc);put32(ch,20,e.data.length);put32(ch,24,e.data.length);put16(ch,28,e.name.length);put16(ch,30,0);put16(ch,32,0);put16(ch,34,0);put16(ch,36,0);put32(ch,38,0);put32(ch,42,e.offset);ch.set(e.name,46);centrals.push(ch);offset+=ch.length;});
  var centralSize=offset-centralStart,eocd=new Uint8Array(22);put32(eocd,0,0x06054b50);put16(eocd,4,0);put16(eocd,6,0);put16(eocd,8,entries.length);put16(eocd,10,entries.length);put32(eocd,12,centralSize);put32(eocd,16,centralStart);put16(eocd,20,0);
  return new Blob([concatBytes(locals.concat(centrals,[eocd]))],{type:'application/zip'});
}
function downloadBlob(name,blob){var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);}
function exportProjectById(id){
  if(id===activeProjectId)bwAutoSave();var s=readStore(),p=findProject(id,s);if(!p)return;downloadBlob((p.folderName||slug(p.name))+'.zip',makeZip(projectFiles(p)));notify('ZIP criado: HTML + CSS + JS');
}
function exportActiveProject(){if(!activeProjectId){notify('Abra um projeto primeiro');return;}exportProjectById(activeProjectId);}

function extractManifestFromStoredZip(buffer){
  var b=new Uint8Array(buffer),dv=new DataView(buffer),dec=new TextDecoder('utf-8'),o=0;
  while(o+30<=b.length){if(dv.getUint32(o,true)!==0x04034b50)break;var method=dv.getUint16(o+8,true),size=dv.getUint32(o+18,true),nl=dv.getUint16(o+26,true),xl=dv.getUint16(o+28,true),ns=o+30,name=dec.decode(b.slice(ns,ns+nl)),ds=ns+nl+xl;if((/\/?brotware\.json$/i).test(name)){if(method!==0)throw new Error('ZIP compactado não suportado');return dec.decode(b.slice(ds,ds+size));}o=ds+size;}
  throw new Error('brotware.json não encontrado');
}
function importDataObject(d){
  if(d&&d.data&&Array.isArray(d.data.pages))d=d.data;if(!d||!Array.isArray(d.pages)||!d.pages.length)throw new Error('Projeto inválido');d=normalizeData(d);
  var s=readStore(),name=d.projectName||'Imported Project',rec={id:uid('project'),name:name,folderName:slug(name),createdAt:Date.now(),updatedAt:Date.now(),data:d};s.projects.push(rec);writeStore(s);renderProjects();notify('Projeto restaurado');
}
async function importProjectFile(file){
  try{var d;if(/\.zip$/i.test(file.name)){d=JSON.parse(extractManifestFromStoredZip(await file.arrayBuffer()));}else d=JSON.parse(await file.text());importDataObject(d);}catch(e){console.error(e);notify('Não foi possível importar esse projeto');}
}

function buildUi(){
  home=document.createElement('div');home.id='bwProjectHome';home.className='bw-project-home';home.innerHTML=''+
    '<div class="bw-project-shell">'+
      '<div class="bw-project-search"><span class="menu">☰</span><input id="bwProjectSearch" placeholder="Search projects..."><span class="search-ico">⌕</span></div>'+
      '<button class="bw-restore-card" id="bwRestoreProjects" type="button"><span class="ico">↶</span><span><b>Restore Projects</b><small>Restore saved backups and imported projects.</small></span><span class="chev">›</span></button>'+
      '<div class="bw-project-heading"><h2>My Projects</h2><span class="spacer"></span><button class="bw-sort" id="bwProjectSort" type="button">⇅</button></div>'+
      '<section class="bw-project-list" id="bwProjectList"></section>'+
    '</div>'+
    '<button class="bw-new-project" id="bwNewProject" type="button"><span>＋</span>New Project</button>'+
    '<nav class="bw-project-nav"><button class="active" data-bw-nav="projects"><span class="ico">☷</span><span>Projects</span></button><button data-bw-nav="templates"><span class="ico">▦</span><span>Templates</span></button><button data-bw-nav="preview"><span class="ico">◎</span><span>Preview</span></button><button data-bw-nav="settings"><span class="ico">▣</span><span>Settings</span></button></nav>'+
    '<input id="bwProjectImport" type="file" accept=".zip,.json,.brotware.json,application/json,application/zip" hidden>'+
    '<div class="bw-home-toast" id="bwHomeToast"></div>';
  document.body.appendChild(home);listEl=document.getElementById('bwProjectList');searchEl=document.getElementById('bwProjectSearch');fileInput=document.getElementById('bwProjectImport');toastEl=document.getElementById('bwHomeToast');

  dialog=document.createElement('div');dialog.className='bw-project-dialog-backdrop';dialog.id='bwNewProjectDialog';dialog.innerHTML='<section class="bw-project-dialog"><header><strong>New Project</strong><small>Crie um projeto web com HTML, CSS e JavaScript separados.</small></header><main><label class="bw-project-field"><span>Project name</span><input id="bwNewProjectName" value="New Project"></label><label class="bw-project-field"><span>Initial HTML</span><input id="bwNewProjectFile" value="index.html"></label><label class="bw-project-field"><span>Page title</span><input id="bwNewProjectTitle" value="Página inicial"></label></main><footer><button id="bwNewProjectCancel" type="button">Cancel</button><button class="primary" id="bwNewProjectCreate" type="button">Create</button></footer></section>';document.body.appendChild(dialog);

  searchEl.addEventListener('input',renderProjects);document.getElementById('bwRestoreProjects').onclick=function(){fileInput.click();};document.getElementById('bwNewProject').onclick=openNewDialog;document.getElementById('bwNewProjectCancel').onclick=closeDialog;document.getElementById('bwNewProjectCreate').onclick=createProjectFromDialog;dialog.addEventListener('click',function(e){if(e.target===dialog)closeDialog();});
  document.getElementById('bwProjectSort').onclick=function(){sortMode=sortMode==='updated'?'name':'updated';this.textContent=sortMode==='updated'?'⇅':'A↓';renderProjects();};
  fileInput.onchange=function(){var f=this.files&&this.files[0];if(f)importProjectFile(f);this.value='';};
  listEl.addEventListener('click',function(e){
    var card=e.target.closest('.bw-project-card');if(!card)return;var id=card.dataset.projectId;
    if(e.target.closest('.bw-project-more')){e.stopPropagation();document.querySelectorAll('.bw-project-card.menu-open').forEach(function(c){if(c!==card)c.classList.remove('menu-open');});card.classList.toggle('menu-open');return;}
    var action=e.target.closest('[data-project-action]');if(action){e.stopPropagation();card.classList.remove('menu-open');var a=action.dataset.projectAction;if(a==='rename')renameProject(id);else if(a==='duplicate')duplicateProject(id);else if(a==='export')exportProjectById(id);else if(a==='delete')deleteProject(id);return;}
    openProject(id);
  });
  home.addEventListener('click',function(e){if(!e.target.closest('.bw-project-card'))document.querySelectorAll('.bw-project-card.menu-open').forEach(function(c){c.classList.remove('menu-open');});});
  home.querySelectorAll('[data-bw-nav]').forEach(function(b){b.onclick=function(){var n=this.dataset.bwNav;if(n==='projects')return;if(n==='preview'){if(!activeProjectId){notify('Abra um projeto primeiro');return;}openProject(activeProjectId);setTimeout(function(){if(typeof preview==='function')preview();},120);return;}notify(n==='templates'?'Templates em breve':'Configurações em breve');};});
}

function bindEditorIntegration(){
  window.autoSave=bwAutoSave;window.downloadProject=exportActiveProject;window.exportAll=exportActiveProject;
  var projectBtn=document.getElementById('projectBtn');if(projectBtn){projectBtn.onclick=function(){showHome(true);};projectBtn.textContent='Projetos';}
  var back=document.getElementById('backBtn');if(back)back.onclick=function(){showHome(true);};
  var download=document.getElementById('downloadProjectBtn');if(download){download.onclick=exportActiveProject;download.textContent='Exportar pasta ZIP';}
  var exportAllBtn=document.getElementById('exportAllBtn');if(exportAllBtn){exportAllBtn.onclick=exportActiveProject;exportAllBtn.textContent='Exportar ZIP';}
  var reset=document.getElementById('resetProjectBtn');if(reset){reset.onclick=function(){closeModal('projectModal');openNewDialog();};reset.textContent='Novo projeto';}
  var saveBrowser=document.getElementById('saveBrowserBtn');if(saveBrowser){saveBrowser.onclick=function(){var v=document.getElementById('projectNameInput').value.trim();if(v)state.projectName=v;if(typeof updatePageUI==='function')updatePageUI();bwAutoSave();closeModal('projectModal');notify('Projeto salvo');};}
  var oldInput=document.getElementById('projectInput');if(oldInput){oldInput.accept='.zip,.json,.brotware.json,application/json,application/zip';oldInput.onchange=function(){var f=this.files&&this.files[0];if(f)importProjectFile(f);this.value='';};}
  var upload=document.getElementById('uploadProjectBtn');if(upload&&oldInput)upload.onclick=function(){oldInput.click();};
}

function boot(){
  buildUi();bindEditorIntegration();var s=migrateLegacy();
  if(!activeProjectId||!findProject(activeProjectId,s)){activeProjectId=s.projects.length?s.projects[0].id:null;if(activeProjectId)localStorage.setItem(ACTIVE_KEY,activeProjectId);}
  renderProjects();showHome(false);
}
boot();

window.BrotwareProjects={show:showHome,open:openProject,exportZip:exportActiveProject,save:bwAutoSave};
})();
