(function(){
'use strict';

var exportListenerBound=false;
function h(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function bytes(v){return BrotwareVFS.toUint8(v);}
function download(name,blob){var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1500);}
function prefix(record,path){return(record.folderName||'brotware-project')+'/'+String(path||'').replace(/^\/+/, '');}
function cssSafe2(v){return String(v||'').replace(/[<>]/g,'');}
function baseCss(data){
  var css='*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{min-height:100vh}#app{position:relative;width:100%;min-height:100vh;overflow:hidden}.vf-node{position:absolute}.node-text{width:100%;height:100%;display:flex;align-items:center;padding:4px 6px}.node-button,.node-input,.node-textarea,.node-select,.node-image,.node-link,.node-checkbox,.node-progress,.node-divider,.node-layout,.node-card{width:100%;height:100%}.node-button{border:0;border-radius:7px;background:#6567f4;color:#fff;font-weight:700}.node-input,.node-textarea,.node-select{border:1px solid #aeb9c4;border-radius:7px;padding:7px 9px}.node-image{display:grid;place-items:center;background:#dbe5ed}.node-image img{width:100%;height:100%;object-fit:cover}.node-link{display:flex;align-items:center;color:#126ec5;text-decoration:underline}.node-checkbox{display:flex;align-items:center;gap:7px}.node-progress{display:flex;align-items:center}.node-progress span{height:9px;width:100%;border-radius:99px;background:#d7dee4;overflow:hidden}.node-progress i{display:block;width:60%;height:100%;background:#6567f4}.node-divider{display:flex;align-items:center}.node-divider:before{content:"";width:100%;height:1px;background:#bdc7cf}.node-layout{border:0;background:transparent}.node-layout-label{display:none}.node-card{border:1px solid #dce3e8;border-radius:13px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.10)}';
  (data.pages||[]).forEach(function(p){var n=String(p.name).replace(/"/g,'\\"'),bg=cssSafe2(p.background||'#fff');css+='\nbody[data-brotware-page="'+n+'"],body[data-brotware-page="'+n+'"] #app{background:'+bg+'}';});return css+'\n';
}
function runtime(page,data){var ov=state.variables,of=state.functions,code='';try{state.variables=data.variables||{};state.functions=data.functions||[];code=runtimeScriptForPage(page);}finally{state.variables=ov;state.functions=of;}return code;}
function sharedScript(data,cfg){var out="'use strict';\n";(data.pages||[]).forEach(function(p){out+='\nif(document.body&&document.body.dataset.brotwarePage==='+JSON.stringify(p.name)+'){\n'+runtime(p,data)+'\n}\n';});if(cfg&&cfg.customJs)out+='\n/* Brotware custom JavaScript */\n'+cfg.customJs+'\n';return out;}
function nativeHtml(page,cfg){
  var content=cleanupExportDom(page),meta=page.metaDescription?'\n<meta name="description" content="'+h(page.metaDescription)+'">':'',fav=page.favicon?'\n<link rel="icon" href="'+h(page.favicon)+'">':'',manifest=cfg&&cfg.manifest?'\n<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="'+h(cfg.manifest.theme_color||'#07131e')+'">':'';
  return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+h(page.title||page.name)+'</title>'+meta+fav+manifest+'\n<link rel="stylesheet" href="style.css">\n<script src="script.js" defer><\/script>\n</head>\n<body data-brotware-page="'+h(page.name)+'">\n<div id="app">'+content+'</div>\n</body>\n</html>\n';
}
async function nativeFiles(record){
  if(BrotwareProjectFormat.activeId()===record.id&&window.BrotwareProjects&&BrotwareProjects.save)BrotwareProjects.save();record=BrotwareProjectFormat.findRecord(record.id)||record;var data=BrotwareProjectFormat.nativeData(record.data),cfg=BrotwareProjectFormat.configFor(record.id),out={};
  (data.pages||[]).forEach(function(p){out[prefix(record,p.name)]=bytes(nativeHtml(p,cfg));});var css=baseCss(data)+(cfg&&cfg.customCss?'\n/* Brotware custom CSS */\n'+cfg.customCss+'\n':'');out[prefix(record,'style.css')]=bytes(css);out[prefix(record,'script.js')]=bytes(sharedScript(data,cfg));
  if(cfg&&cfg.manifest)out[prefix(record,'manifest.webmanifest')]=bytes(JSON.stringify(cfg.manifest,null,2));out[prefix(record,'brotware.json')]=bytes(JSON.stringify(BrotwareProjectFormat.manifestForNative(record),null,2));return out;
}
function injectOverrideLink(html,filePath){if(/brotware-overrides\.css/i.test(html))return html;var href=BrotwareVFS.relative(filePath,'brotware-overrides.css');var tag='\n<link rel="stylesheet" href="'+href+'" data-brotware-overrides>\n';return /<\/head>/i.test(html)?html.replace(/<\/head>/i,tag+'</head>'):tag+html;}
function externalOverrideCss(meta){
  var out='';Object.keys(meta.overrides||{}).forEach(function(id){var item=meta.overrides[id]||{},styles=item.styles||{},selector=item.selector||(meta.bindings&&meta.bindings[id]);if(!selector||!Object.keys(styles).length)return;out+=selector+'{';Object.keys(styles).forEach(function(p){var v=styles[p];if(v!=null&&String(v).trim())out+=p+':'+String(v).replace(/[{}]/g,'')+' !important;';});out+='}\n';});return out;
}
async function externalFiles(record){
  var rec=await BrotwareVFS.getProject(record.id),src=rec.files||{},meta=BrotwareVFS.getMeta(record.id)||{},out={},hasOverrides=Object.keys(meta.overrides||{}).some(function(id){return Object.keys((meta.overrides[id]&&meta.overrides[id].styles)||{}).length;});
  Object.keys(src).forEach(function(path){var e=src[path],data=BrotwareVFS.bytes(e);if(hasOverrides&&/\.html?$/i.test(path)){var html=BrotwareVFS.text(e);data=bytes(injectOverrideLink(html,path));}out[prefix(record,path)]=data;});
  if(hasOverrides)out[prefix(record,'brotware-overrides.css')]=bytes(externalOverrideCss(meta));
  out[prefix(record,'brotware.json')]=bytes(JSON.stringify(BrotwareProjectFormat.manifestForExternal(record,meta,src),null,2));return out;
}
async function exportProject(id){
  id=id||BrotwareProjectFormat.activeId();var record=BrotwareProjectFormat.findRecord(id);if(!record){if(typeof toast==='function')toast('Projeto não encontrado');return;}
  try{var files=BrotwareVFS.isExternal(id)?await externalFiles(record):await nativeFiles(record),blob=BrotwareZip.write(files);download((record.folderName||'brotware-project')+'.zip',blob);if(typeof toast==='function')toast('ZIP exportado com brotware.json v5');}catch(e){console.error(e);if(typeof toast==='function')toast('Erro ao exportar: '+(e.message||e));}
}
function hook(){
  if(window.BrotwareProjects){BrotwareProjects.exportZip=function(){return exportProject(BrotwareProjectFormat.activeId());};}
  window.exportAll=function(){return exportProject(BrotwareProjectFormat.activeId());};window.downloadProject=window.exportAll;
  var dl=document.getElementById('downloadProjectBtn');if(dl)dl.onclick=function(){exportProject(BrotwareProjectFormat.activeId());};var all=document.getElementById('exportAllBtn');if(all)all.onclick=function(){exportProject(BrotwareProjectFormat.activeId());};
  if(!exportListenerBound){exportListenerBound=true;document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-project-action="export"]');if(!a)return;var card=a.closest('.bw-project-card');if(!card)return;e.preventDefault();e.stopImmediatePropagation();exportProject(card.dataset.projectId);},true);}
}
function install(){hook();setTimeout(hook,700);}

window.BrotwareUniversalExporter={exportProject:exportProject,nativeFiles:nativeFiles,externalFiles:externalFiles,externalOverrideCss:externalOverrideCss};
setTimeout(install,0);setTimeout(install,900);
})();
