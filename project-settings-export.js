(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var SETTINGS_PREFIX='brotware_project_settings_v1:';
var CONFIG_PREFIX='brotware_web_config_v1:';
var lastActive='',compileBase=null;

function clone(v){return JSON.parse(JSON.stringify(v));}
function h(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function fileSafe(v){return String(v||'index.html').replace(/[\\/:*?"<>|]+/g,'-').replace(/^\.+/,'')||'index.html';}
function slug(v){return String(v||'project').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function activeId(){return localStorage.getItem(ACTIVE_KEY)||'';}
function readStore(){try{var s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');return s&&Array.isArray(s.projects)?s:{version:1,projects:[]};}catch(_){return{version:1,projects:[]};}}
function findProject(id,s){s=s||readStore();return s.projects.find(function(p){return p.id===id;})||null;}
function readConfig(id){try{return JSON.parse(localStorage.getItem(CONFIG_PREFIX+id)||'{}')||{};}catch(_){return{};}}
function defaults(){return{applicationName:'Brotware App',icon:'',theme:{preset:'purple',accent:'#00d4c8',primary:'#6d55d9',primaryDark:'#241b56'},versionCode:1,versionName:'1.0',createdWith:'Brotware'};}
function normalizeSettings(s){var d=defaults();s=s&&typeof s==='object'?s:{};d.applicationName=String(s.applicationName||d.applicationName);d.icon=String(s.icon||'');d.versionCode=Math.max(1,parseInt(s.versionCode,10)||1);d.versionName=String(s.versionName||'1.0');d.createdWith='Brotware';var t=s.theme&&typeof s.theme==='object'?s.theme:{};d.theme={preset:String(t.preset||'custom'),accent:String(t.accent||'#00d4c8'),primary:String(t.primary||'#6d55d9'),primaryDark:String(t.primaryDark||'#241b56')};return d;}
function readSettings(id){
  id=id||activeId();var x=null;
  try{x=JSON.parse(localStorage.getItem(SETTINGS_PREFIX+id)||'null');}catch(_){}
  if(!x){var rec=findProject(id);x=rec&&(rec.settings||(rec.data&&rec.data.projectSettings));}
  if(!x&&id===activeId()&&typeof state!=='undefined')x=state.projectSettings;
  return normalizeSettings(x||{});
}
function persist(settings,id){
  id=id||activeId();if(!id)return;settings=normalizeSettings(settings);localStorage.setItem(SETTINGS_PREFIX+id,JSON.stringify(settings));
  try{var s=readStore(),rec=findProject(id,s);if(rec){rec.settings=settings;rec.data=rec.data||{};rec.data.projectSettings=settings;rec.data.strings=rec.data.strings||{};rec.data.strings.app_name=settings.applicationName;localStorage.setItem(STORE_KEY,JSON.stringify(s));}}catch(_){}
  if(id===activeId()&&typeof state!=='undefined'){state.projectSettings=settings;state.strings=state.strings||{};state.strings.app_name=settings.applicationName;apply(settings);}
}
function apply(settings){
  settings=normalizeSettings(settings||{});var r=document.documentElement.style;
  r.setProperty('--colorAccent',settings.theme.accent);r.setProperty('--colorPrimary',settings.theme.primary);r.setProperty('--colorPrimaryDark',settings.theme.primaryDark);
  r.setProperty('--brotware-accent',settings.theme.accent);r.setProperty('--brotware-primary',settings.theme.primary);r.setProperty('--brotware-primary-dark',settings.theme.primaryDark);
  var meta=document.querySelector('meta[name="theme-color"][data-brotware-project-theme]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';meta.dataset.brotwareProjectTheme='1';document.head.appendChild(meta);}meta.content=settings.theme.primary;
  var fav=document.getElementById('bwProjectDynamicFavicon');if(settings.icon){if(!fav){fav=document.createElement('link');fav.id='bwProjectDynamicFavicon';fav.rel='icon';document.head.appendChild(fav);}fav.href=settings.icon;}else if(fav)fav.remove();
}

function iconAsset(settings){
  var src=String(settings.icon||''),m=src.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,(.+)$/i);if(!m)return null;
  var mime=m[1].toLowerCase(),ext=mime.indexOf('svg')>=0?'svg':mime.indexOf('webp')>=0?'webp':mime.indexOf('gif')>=0?'gif':mime.indexOf('jpeg')>=0||mime.indexOf('jpg')>=0?'jpg':'png';
  try{var bin=atob(m[2]),out=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return{name:'app-icon.'+ext,mime:mime,data:out};}catch(_){return null;}
}
function themeCss(settings){var t=settings.theme;return ':root{--colorAccent:'+t.accent+';--colorPrimary:'+t.primary+';--colorPrimaryDark:'+t.primaryDark+';--brotware-accent:'+t.accent+';--brotware-primary:'+t.primary+';--brotware-primary-dark:'+t.primaryDark+'}\n';}
function cleanup(page){var box=document.createElement('div');box.innerHTML=page.content||'';var g=box.querySelector('#gridLayer');if(g)g.remove();box.querySelectorAll('.resize-handle').forEach(function(n){n.remove();});box.querySelectorAll('.selected,.drop-target').forEach(function(n){n.classList.remove('selected','drop-target');});box.querySelectorAll('[data-bound]').forEach(function(n){n.removeAttribute('data-bound');});return box.innerHTML;}
function baseCss(data,settings,customCss){
  var css=themeCss(settings)+'*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{min-height:100vh}#app{position:relative;width:100%;min-height:100vh;overflow:hidden}.vf-node{position:absolute}.node-text{width:100%;height:100%;display:flex;align-items:center;padding:4px 6px}.node-button,.node-input,.node-textarea,.node-select,.node-image,.node-link,.node-checkbox,.node-progress,.node-divider,.node-layout,.node-card{width:100%;height:100%}.node-button{border:0;border-radius:7px;background:var(--colorPrimary,#6567f4);color:#fff;font-weight:700}.node-input,.node-textarea,.node-select{border:1px solid #aeb9c4;border-radius:7px;padding:7px 9px}.node-image{display:grid;place-items:center;background:#dbe5ed}.node-image img{width:100%;height:100%;object-fit:cover}.node-link{display:flex;align-items:center;color:var(--colorAccent,#126ec5);text-decoration:underline}.node-checkbox{display:flex;align-items:center;gap:7px}.node-progress{display:flex;align-items:center}.node-progress span{height:9px;width:100%;border-radius:99px;background:#d7dee4;overflow:hidden}.node-progress i{display:block;width:60%;height:100%;background:var(--colorAccent,#6567f4)}.node-divider{display:flex;align-items:center}.node-divider:before{content:"";width:100%;height:1px;background:#bdc7cf}.node-layout{border:0;background:transparent}.node-layout-label{display:none}.node-card{border:1px solid #dce3e8;border-radius:13px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.10)}';
  (data.pages||[]).forEach(function(p){var n=String(p.name).replace(/"/g,'\\"'),bg=String(p.background||'#fff').replace(/[<>]/g,'');css+='\nbody[data-brotware-page="'+n+'"],body[data-brotware-page="'+n+'"] #app{background:'+bg+'}';});
  if(customCss)css+='\n/* Custom Brotware CSS */\n'+customCss+'\n';return css+'\n';
}
function runtimeForData(page,data,settings){
  if(typeof runtimeScriptForPage!=='function')return'';
  var old={variables:state.variables,functions:state.functions,functionalComponents:state.functionalComponents,libraryManager:state.libraryManager,firebaseConfig:state.firebaseConfig,projectSettings:state.projectSettings},code='';
  try{state.variables=data.variables||{};state.functions=data.functions||[];state.functionalComponents=data.functionalComponents||[];state.libraryManager=data.libraryManager||{};state.firebaseConfig=data.firebaseConfig||{};state.projectSettings=settings;code=runtimeScriptForPage(page);}finally{Object.keys(old).forEach(function(k){state[k]=old[k];});}return code;
}
function sharedScript(data,settings,customJs){var out="'use strict';\n";(data.pages||[]).forEach(function(p){out+='\nif(document.body&&document.body.dataset.brotwarePage==='+JSON.stringify(p.name)+'){\n'+runtimeForData(p,data,settings)+'\n}\n';});if(customJs)out+='\n/* Custom Brotware JavaScript */\n'+String(customJs).split('</script').join('<\\/script')+'\n';return out;}
function shortName(v){v=String(v||'Brotware').trim();return v.length>24?v.slice(0,24):v;}
function manifest(data,settings,icon,config){
  var first=(data.pages&&data.pages[0]&&data.pages[0].name)||'index.html',base=config&&config.manifest&&typeof config.manifest==='object'?clone(config.manifest):{};
  base.name=settings.applicationName||data.projectName||'Brotware App';base.short_name=shortName(base.name);base.start_url=fileSafe(first);base.display=base.display||'standalone';base.theme_color=settings.theme.primary;base.background_color=settings.theme.primaryDark;base.version=settings.versionName;base.version_code=settings.versionCode;base.generator='Brotware';
  if(icon)base.icons=[{src:icon.name,sizes:'any',type:icon.mime,purpose:'any maskable'}];else delete base.icons;return base;
}
function pageHtml(page,data,settings,icon){
  var fav=icon?'<link rel="icon" type="'+h(icon.mime)+'" href="'+h(icon.name)+'">\n':'';
  return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="application-name" content="'+h(settings.applicationName)+'">\n<meta name="theme-color" content="'+h(settings.theme.primary)+'">\n<meta name="brotware-version" content="'+h(settings.versionName)+'">\n'+fav+'<link rel="manifest" href="manifest.webmanifest">\n<title>'+h(page.title||page.name)+'</title>\n<link rel="stylesheet" href="style.css">\n<script src="script.js" defer><\/script>\n</head>\n<body data-brotware-page="'+h(page.name)+'">\n<div id="app">'+cleanup(page)+'</div>\n</body>\n</html>\n';
}
function mergedData(rec,id){var d=clone(rec.data||{});if(id===activeId()&&typeof state!=='undefined'){try{if(typeof saveCurrentPage==='function')saveCurrentPage();}catch(_){}d.projectName=state.projectName;d.pages=clone(state.pages||d.pages||[]);d.currentPageId=state.currentPageId;d.strings=clone(state.strings||{});d.variables=clone(state.variables||{});d.functions=clone(state.functions||[]);d.components=clone(state.components||[]);d.functionalComponents=clone(state.functionalComponents||[]);d.libraryManager=clone(state.libraryManager||{});d.firebaseConfig=clone(state.firebaseConfig||{});d.counter=state.counter||1;}d.pages=Array.isArray(d.pages)?d.pages:[];return d;}
function projectFiles(rec,id){
  var data=mergedData(rec,id),settings=readSettings(id),cfg=readConfig(id),folder=rec.folderName||slug(rec.name),files={},icon=iconAsset(settings),man=manifest(data,settings,icon,cfg);
  data.projectSettings=settings;data.strings=data.strings||{};data.strings.app_name=settings.applicationName;
  (data.pages||[]).forEach(function(p){files[folder+'/'+fileSafe(p.name)]=pageHtml(p,data,settings,icon);});
  files[folder+'/style.css']=baseCss(data,settings,cfg.customCss||'');files[folder+'/script.js']=sharedScript(data,settings,cfg.customJs||'');files[folder+'/manifest.webmanifest']=JSON.stringify(man,null,2);
  if(icon)files[folder+'/'+icon.name]=icon.data;
  files[folder+'/brotware.json']=JSON.stringify({format:'Brotware Project Folder',version:5,projectName:data.projectName,pages:data.pages,currentPageId:data.currentPageId,strings:data.strings,variables:data.variables,functions:data.functions,components:data.components,counter:data.counter,functionalComponents:data.functionalComponents||[],libraryManager:data.libraryManager||{},firebaseConfig:data.firebaseConfig||{},projectSettings:settings},null,2);
  return files;
}

var CRC_TABLE=null;
function crcTable(){if(CRC_TABLE)return CRC_TABLE;CRC_TABLE=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);CRC_TABLE[n]=c>>>0;}return CRC_TABLE;}
function crc32(bytes){var c=0xffffffff,t=crcTable();for(var i=0;i<bytes.length;i++)c=t[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function put16(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;}
function put32(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255;}
function dosStamp(d){d=d||new Date();var y=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}
function concat(parts){var len=0;parts.forEach(function(p){len+=p.length;});var out=new Uint8Array(len),o=0;parts.forEach(function(p){out.set(p,o);o+=p.length;});return out;}
function bytes(v,enc){return v instanceof Uint8Array?v:enc.encode(String(v));}
function makeZip(files){var enc=new TextEncoder(),stamp=dosStamp(new Date()),names=Object.keys(files),locals=[],centrals=[],offset=0,entries=[];names.forEach(function(name){var nb=enc.encode(name),db=bytes(files[name],enc),crc=crc32(db),lh=new Uint8Array(30+nb.length);put32(lh,0,0x04034b50);put16(lh,4,20);put16(lh,6,0x0800);put16(lh,8,0);put16(lh,10,stamp.time);put16(lh,12,stamp.date);put32(lh,14,crc);put32(lh,18,db.length);put32(lh,22,db.length);put16(lh,26,nb.length);put16(lh,28,0);lh.set(nb,30);entries.push({name:nb,data:db,crc:crc,offset:offset});locals.push(lh,db);offset+=lh.length+db.length;});var centralStart=offset;entries.forEach(function(e){var ch=new Uint8Array(46+e.name.length);put32(ch,0,0x02014b50);put16(ch,4,20);put16(ch,6,20);put16(ch,8,0x0800);put16(ch,10,0);put16(ch,12,stamp.time);put16(ch,14,stamp.date);put32(ch,16,e.crc);put32(ch,20,e.data.length);put32(ch,24,e.data.length);put16(ch,28,e.name.length);put16(ch,30,0);put16(ch,32,0);put16(ch,34,0);put16(ch,36,0);put32(ch,38,0);put32(ch,42,e.offset);ch.set(e.name,46);centrals.push(ch);offset+=ch.length;});var centralSize=offset-centralStart,eocd=new Uint8Array(22);put32(eocd,0,0x06054b50);put16(eocd,4,0);put16(eocd,6,0);put16(eocd,8,entries.length);put16(eocd,10,entries.length);put32(eocd,12,centralSize);put32(eocd,16,centralStart);put16(eocd,20,0);return new Blob([concat(locals.concat(centrals,[eocd]))],{type:'application/zip'});}
function download(name,blob){var a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);}
function exportId(id){
  id=id||activeId();if(!id)return;var s=readStore(),rec=findProject(id,s);if(!rec)return;
  if(id===activeId()&&typeof state!=='undefined'&&state.projectSettings)persist(state.projectSettings,id);
  download((rec.folderName||slug(rec.name))+'.zip',makeZip(projectFiles(rec,id)));if(typeof toast==='function')toast('ZIP criado com tema, manifest e ícone');
}

function singleFileManifest(settings,page){var icon=settings.icon?[{src:settings.icon,sizes:'any',purpose:'any maskable'}]:[];return{name:settings.applicationName,short_name:shortName(settings.applicationName),start_url:page&&page.name?page.name:'index.html',display:'standalone',theme_color:settings.theme.primary,background_color:settings.theme.primaryDark,version:settings.versionName,version_code:settings.versionCode,icons:icon};}
function enhanceHtml(html){
  var settings=readSettings(),page=typeof currentPage==='function'?currentPage():null;if(!html||html.indexOf('</head>')<0)return html;
  var man='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(singleFileManifest(settings,page))),fav=settings.icon?'<link rel="icon" href="'+h(settings.icon)+'">\n':'';
  var add='<meta name="application-name" content="'+h(settings.applicationName)+'">\n<meta name="theme-color" content="'+h(settings.theme.primary)+'">\n<meta name="brotware-version" content="'+h(settings.versionName)+'">\n'+fav+'<link rel="manifest" href="'+h(man)+'">\n<style>'+themeCss(settings)+'.node-button{background:var(--colorPrimary,#6567f4)}.node-link{color:var(--colorAccent,#126ec5)}.node-progress i{background:var(--colorAccent,#6567f4)}</style>\n';
  return html.replace('</head>',add+'</head>');
}
function installCompile(){if(typeof window.compilePage!=='function'||window.compilePage.__bwProjectSettings)return;if(!compileBase)compileBase=window.compilePage;var prev=window.compilePage;var wrapped=function(){return enhanceHtml(prev.apply(this,arguments));};wrapped.__bwProjectSettings=true;window.compilePage=wrapped;}
function installProjectApi(){var api=window.BrotwareProjects;if(!api||api.__bwProjectSettings)return;api.__bwProjectSettings=true;api.exportZip=function(){exportId(activeId());};var oldSave=api.save;if(oldSave)api.save=function(){var set=readSettings();var r=oldSave.apply(this,arguments);persist(set,activeId());return r;};}
function captureExport(e){var b=e.target&&e.target.closest?e.target.closest('[data-project-action="export"]'):null;if(!b)return;var card=b.closest('.bw-project-card[data-project-id]');if(!card)return;e.preventDefault();e.stopImmediatePropagation();exportId(card.dataset.projectId);}
document.addEventListener('click',captureExport,true);

function syncActive(){var id=activeId();if(id!==lastActive){lastActive=id;var s=readSettings(id);if(typeof state!=='undefined')state.projectSettings=s;apply(s);}installCompile();installProjectApi();}
setInterval(syncActive,350);setTimeout(syncActive,0);setTimeout(syncActive,900);
window.BrotwareProjectSettings={read:readSettings,persist:persist,apply:apply,exportZip:exportId,themeCss:themeCss};
})();