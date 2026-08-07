(function(){
'use strict';

var input=null,busy=null,installed=false;
function notice(msg,bad){if(typeof toast==='function')toast(msg);console[bad?'error':'log']('[Import]',msg);}
function baseName(name){return String(name||'Imported Project').replace(/\.(?:zip|json|html?|brotware)$/i,'').replace(/[-_]+/g,' ').trim()||'Imported Project';}
function decodeJson(bytes){return JSON.parse(new TextDecoder('utf-8').decode(bytes));}
function fileEntriesFromZip(rawFiles,root){
  var stripped=root?{}:rawFiles;
  if(root){var prefix=root+'/';Object.keys(rawFiles).forEach(function(path){if(path===root)return;stripped[path.indexOf(prefix)===0?path.slice(prefix.length):path]=rawFiles[path];});}
  var files={};Object.keys(stripped).forEach(function(path){if(!path||/(^|\/)brotware\.json$/i.test(path))return;files[path]=BrotwareVFS.fromBytes(path,stripped[path]);});return files;
}
function commonRootForZip(paths){var usable=paths.filter(function(p){return p&&p.indexOf('__MACOSX/')!==0&&!/\.DS_Store$/i.test(p);});return BrotwareVFS.commonRoot(usable);}
function chooseEntry(files,preferred){if(preferred&&BrotwareVFS.get(files,preferred))return BrotwareVFS.normalizePath(preferred);return BrotwareVFS.find(files,function(p){return /(^|\/)index\.html?$/i.test(p);})||BrotwareVFS.find(files,function(p){return /\.html?$/i.test(p);})||null;}
function frameworkInfo(files){var framework=BrotwareProjectFormat.frameworkFromFiles(files),entry=chooseEntry(files),requiresBuild=!!(framework&&!entry);return{framework:framework,entry:entry,requiresBuild:requiresBuild};}
async function importZip(file){
  var parsed=await BrotwareZip.read(await file.arrayBuffer()),raw=parsed.files,names=Object.keys(raw),manifestPath=BrotwareZip.findManifest(raw),manifest=null;
  if(manifestPath){
    try{manifest=decodeJson(raw[manifestPath]);}catch(e){throw new Error('brotware.json encontrado, mas o JSON está inválido.');}
    if(BrotwareProjectFormat.isBrotwareJson(manifest)&&(!manifest.mode||manifest.mode==='native'||Array.isArray(manifest.pages)||(manifest.data&&Array.isArray(manifest.data.pages)))){
      return{record:BrotwareProjectFormat.importNative(manifest),kind:'native',message:'Projeto Brotware restaurado com páginas, lógica e configurações.'};
    }
  }
  var root=commonRootForZip(names),files=fileEntriesFromZip(raw,root),preferred=manifest&&manifest.entry?BrotwareVFS.normalizePath(String(manifest.entry).replace(new RegExp('^'+root.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/?'),'') ):null;
  var info=frameworkInfo(files),entry=chooseEntry(files,preferred||info.entry);
  if(!entry&&!info.framework)throw new Error('ZIP sem brotware.json e sem arquivo HTML de entrada.');
  var mode=manifest&&(manifest.mode==='hybrid'||manifest.mode==='static')?manifest.mode:(info.framework&&!entry?'framework':'static');
  var opts={projectName:manifest&&manifest.projectName||baseName(root||file.name),files:files,entry:entry||'index.html',mode:mode,framework:manifest&&manifest.framework||info.framework,requiresBuild:manifest?!!manifest.requiresBuild:info.requiresBuild,bindings:manifest&&manifest.bindings||{},overrides:manifest&&manifest.overrides||{},previewStorage:manifest&&manifest.previewStorage||{},config:manifest&&manifest.config||null,projectData:manifest&&manifest.projectData||null,source:'zip'};
  var rec=await BrotwareProjectFormat.createExternal(opts);return{record:rec,kind:'external',message:manifest?'Projeto web Brotware v5 restaurado.':'Site HTML externo importado com '+Object.keys(files).length+' arquivos.'};
}
async function importHtmlFile(file){var text=await file.text(),path=BrotwareVFS.normalizePath(file.name||'index.html'),files={};files[path]={path:path,mime:'text/html',kind:'text',content:text,size:new TextEncoder().encode(text).length,modifiedAt:Date.now()};var rec=await BrotwareProjectFormat.createExternal({projectName:baseName(file.name),files:files,entry:path,mode:'static',source:'html'});return{record:rec,kind:'external',message:'HTML importado preservando CSS e JavaScript inline.'};}
async function importJsonFile(file){
  var obj;try{obj=JSON.parse(await file.text());}catch(e){throw new Error('JSON inválido.');}
  if(!BrotwareProjectFormat.isBrotwareJson(obj))throw new Error('Este JSON não é um projeto Brotware reconhecido.');
  if((obj.mode==='static'||obj.mode==='hybrid'||obj.mode==='framework')&&!obj.files)throw new Error('Manifesto externo sem arquivos. Importe o ZIP do site para preservar HTML/CSS/JS/assets.');
  if(obj.files){var files={};Object.keys(obj.files).forEach(function(path){var f=obj.files[path]||{},content=f.content||'';if(f.encoding==='base64'){var bin=atob(content),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);files[path]=BrotwareVFS.fromBytes(path,u,f.mime);}else files[path]={path:path,mime:f.mime||BrotwareVFS.mime(path),kind:'text',content:String(content),size:String(content).length,modifiedAt:Date.now()};});var rec=await BrotwareProjectFormat.createExternal({projectName:obj.projectName,files:files,entry:obj.entry,mode:obj.mode,framework:obj.framework,requiresBuild:obj.requiresBuild,bindings:obj.bindings,overrides:obj.overrides,config:obj.config,projectData:obj.projectData||null,source:'json'});return{record:rec,kind:'external',message:'Projeto externo Brotware restaurado do JSON.'};}
  return{record:BrotwareProjectFormat.importNative(obj),kind:'native',message:'Projeto Brotware JSON restaurado.'};
}
function detect(file){var n=String(file.name||'').toLowerCase(),t=String(file.type||'').toLowerCase();if(n.endsWith('.zip')||t.indexOf('zip')>=0)return'zip';if(n.endsWith('.html')||n.endsWith('.htm')||t==='text/html')return'html';if(n.endsWith('.json')||t.indexOf('json')>=0)return'json';return'unknown';}
async function importFile(file){
  if(!file)return;var type=detect(file);if(type==='unknown'){notice('Formato não suportado. Use .zip, .html ou .json.',true);return;}
  setBusy(true,'Analisando '+file.name+'...');
  try{var result=type==='zip'?await importZip(file):type==='html'?await importHtmlFile(file):await importJsonFile(file);notice(result.message);if(result.kind==='external'&&window.BrotwareExternalPreview)setTimeout(function(){BrotwareExternalPreview.open(result.record.id);},120);}catch(e){console.error(e);notice(e&&e.message?e.message:'Não foi possível importar o projeto.',true);}finally{setBusy(false);}
}
function setBusy(on,text){if(!busy)return;busy.classList.toggle('show',!!on);var t=busy.querySelector('span');if(t&&text)t.textContent=text;}
function build(){
  if(input)return;input=document.createElement('input');input.type='file';input.accept='.zip,.html,.htm,.json,application/zip,text/html,application/json';input.hidden=true;input.id='bwUniversalProjectInput';document.body.appendChild(input);input.onchange=function(){var f=this.files&&this.files[0];this.value='';if(f)importFile(f);};
  busy=document.createElement('div');busy.className='bw-import-busy';busy.innerHTML='<div class="spinner"></div><span>Analisando projeto...</span>';document.body.appendChild(busy);
}
function openPicker(){build();input.click();}
function enhanceHome(){
  build();var restore=document.getElementById('bwRestoreProjects');if(restore&&!restore.dataset.bwUniversal){restore.dataset.bwUniversal='1';var b=restore.querySelector('b'),s=restore.querySelector('small');if(b)b.textContent='Importar projeto';if(s)s.textContent='ZIP, HTML ou JSON — o formato é detectado automaticamente.';restore.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();openPicker();},true);}
  var heading=document.querySelector('.bw-project-heading');if(heading&&!document.getElementById('bwUniversalImportBtn')){var btn=document.createElement('button');btn.id='bwUniversalImportBtn';btn.className='bw-sort';btn.type='button';btn.textContent='＋ Importar';btn.title='Importar ZIP, HTML ou JSON';btn.onclick=openPicker;heading.insertBefore(btn,heading.querySelector('.bw-sort'));}
  decorateCards();
}
function decorateCards(){document.querySelectorAll('.bw-project-card').forEach(function(card){var id=card.dataset.projectId,meta=BrotwareVFS.getMeta(id);if(!meta)return;var badge=card.querySelector('.bw-project-badge');if(badge)badge.textContent=meta.mode==='hybrid'?'Hybrid':meta.mode==='framework'?'Framework':'HTML';var folder=card.querySelector('.bw-project-folder');if(folder&&meta.entry)folder.textContent=meta.entry;});}
function install(){if(installed){enhanceHome();return;}installed=true;build();enhanceHome();var home=document.getElementById('bwProjectHome');if(home&&home.dataset.bwUniversalObserver!=='1'){home.dataset.bwUniversalObserver='1';new MutationObserver(function(){setTimeout(enhanceHome,0);}).observe(home,{childList:true,subtree:true});}}

window.BrotwareUniversalImporter={open:openPicker,importFile:importFile,importZip:importZip,importHtml:importHtmlFile,importJson:importJsonFile};
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
})();