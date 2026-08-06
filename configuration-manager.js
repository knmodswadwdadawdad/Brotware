(function(){
'use strict';

var ACTIVE_KEY='brotware_active_project_v1';
var CONFIG_PREFIX='brotware_web_config_v1:';
var MAX_FILE=1572864;
var screen=null,detail=null,detailTitle=null,detailSub=null,detailBody=null,toastEl=null,fileInput=null,pendingAssetKind='asset';

var MANAGERS=[
  {id:'components',icon:'▦',name:'Component Manager',sub:'Reusable component settings'},
  {id:'pages',icon:'▣',name:'Page Manager',sub:'Manage HTML screens'},
  {id:'images',icon:'▧',name:'Image Manager',sub:'Import images, icons and logos'},
  {id:'animations',icon:'▤',name:'Animation Manager',sub:'Import Lottie JSON, GIF and animations'},
  {id:'audio',icon:'♫',name:'Audio Manager',sub:'Import music and sound effects'},
  {id:'fonts',icon:'T',name:'Font Manager',sub:'Import custom web fonts'},
  {id:'scripts',icon:'</>',name:'Script Manager',sub:'Edit custom JavaScript'},
  {id:'styles',icon:'✦',name:'Style Manager',sub:'Edit custom CSS and themes'},
  {id:'resources',icon:'□',name:'Resource Manager',sub:'Manage project resource files'},
  {id:'assets',icon:'◇',name:'Asset Manager',sub:'Import general asset files'},
  {id:'manifest',icon:'▱',name:'Web Manifest Manager',sub:'Configure PWA/app metadata'},
  {id:'browser',icon:'◈',name:'Browser Features',sub:'Configure browser capabilities'},
  {id:'blocks',icon:'▦',name:'Custom Blocks Manager',sub:'See and edit MoreBlocks'},
  {id:'build',icon:'⌁',name:'Build / Export Manager',sub:'Preview and export the web project'},
  {id:'collections',icon:'▰',name:'Collection Manager',sub:'Manage saved reusable items'}
];

function activeId(){return localStorage.getItem(ACTIVE_KEY)||'default';}
function key(){return CONFIG_PREFIX+activeId();}
function defaults(){return{version:1,assets:[],customCss:'',customJs:'',manifest:{name:state.projectName||'Brotware App',short_name:'Brotware',theme_color:'#07131e',background_color:'#ffffff',display:'standalone',start_url:'index.html'},features:{notifications:false,geolocation:false,clipboard:true,fullscreen:true}};}
function read(){try{var d=JSON.parse(localStorage.getItem(key())||'null');if(!d)return defaults();var x=defaults();Object.keys(d).forEach(function(k){x[k]=d[k];});x.assets=Array.isArray(x.assets)?x.assets:[];x.manifest=Object.assign(defaults().manifest,x.manifest||{});x.features=Object.assign(defaults().features,x.features||{});return x;}catch(e){return defaults();}}
function write(d){try{localStorage.setItem(key(),JSON.stringify(d));if(window.BrotwareProjects&&BrotwareProjects.save)BrotwareProjects.save();return true;}catch(e){notice('Armazenamento cheio. Remova algum arquivo.');return false;}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function notice(msg){if(!toastEl)return;toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(function(){toastEl.classList.remove('show');},1500);}
function fmtSize(n){n=Number(n)||0;if(n<1024)return n+' B';if(n<1048576)return(Math.round(n/102.4)/10)+' KB';return(Math.round(n/104857.6)/10)+' MB';}
function uid(){return'asset-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}

function build(){
  if(screen)return;
  screen=document.createElement('div');screen.className='bw-config-screen';screen.id='bwConfiguration';
  screen.innerHTML='<div class="bw-config-shell"><header class="bw-config-head"><button id="bwConfigClose" type="button">←</button><strong>Configuration</strong></header><main class="bw-config-body" id="bwConfigList"></main><section class="bw-config-detail" id="bwConfigDetail"><header class="bw-config-detail-head"><button id="bwConfigDetailBack" type="button">←</button><div class="bw-config-detail-title"><strong id="bwConfigDetailTitle"></strong><small id="bwConfigDetailSub"></small></div></header><main class="bw-config-detail-body" id="bwConfigDetailBody"></main></section><input id="bwConfigFileInput" type="file" multiple hidden><div class="bw-config-toast" id="bwConfigToast"></div></div>';
  document.body.appendChild(screen);
  detail=document.getElementById('bwConfigDetail');detailTitle=document.getElementById('bwConfigDetailTitle');detailSub=document.getElementById('bwConfigDetailSub');detailBody=document.getElementById('bwConfigDetailBody');toastEl=document.getElementById('bwConfigToast');fileInput=document.getElementById('bwConfigFileInput');
  document.getElementById('bwConfigClose').onclick=close;document.getElementById('bwConfigDetailBack').onclick=closeDetail;
  renderList();
  document.getElementById('bwConfigList').addEventListener('click',function(e){var c=e.target.closest('[data-manager]');if(c)openManager(c.dataset.manager);});
  fileInput.addEventListener('change',function(){var files=Array.prototype.slice.call(this.files||[]);this.value='';files.forEach(function(f){importAsset(f,pendingAssetKind);});});
}
function renderList(){var box=document.getElementById('bwConfigList');if(!box)return;box.innerHTML=MANAGERS.map(function(m){return'<button class="bw-config-card" type="button" data-manager="'+m.id+'"><span class="bw-config-icon">'+m.icon+'</span><span><b>'+esc(m.name)+'</b><small>'+esc(m.sub)+'</small></span><span class="chev">›</span></button>';}).join('');}
function open(){build();closeDetail();screen.classList.add('show');document.body.style.overflow='hidden';}
function close(){if(!screen)return;screen.classList.remove('show');detail.classList.remove('show');document.body.style.overflow='';}
function closeDetail(){if(detail)detail.classList.remove('show');}
function showDetail(title,sub,html){detailTitle.textContent=title;detailSub.textContent=sub||'';detailBody.innerHTML=html||'';detail.classList.add('show');}

function openActiveEditor(tab,after){var id=activeId();close();if(window.BrotwareProjects&&BrotwareProjects.open)BrotwareProjects.open(id);setTimeout(function(){if(tab&&typeof switchTab==='function')switchTab(tab);if(after)after();},90);}

function openManager(id){
  if(id==='components'){openActiveEditor('component');return;}
  if(id==='pages'){openActiveEditor('view',function(){if(typeof renderPages==='function')renderPages();if(typeof openModal==='function')openModal('pagesModal');});return;}
  if(id==='blocks'){openActiveEditor('event',function(){if(typeof setLogicMode==='function')setLogicMode('function');});return;}
  if(id==='collections'){openActiveEditor('component');return;}
  if(id==='images'){openAssetManager('image','Image Manager','Import images, icons and logos','image/*');return;}
  if(id==='animations'){openAssetManager('animation','Animation Manager','Import Lottie JSON, GIF and animations','.json,.gif,image/gif,application/json');return;}
  if(id==='audio'){openAssetManager('audio','Audio Manager','Import music and sound effects','audio/*');return;}
  if(id==='fonts'){openAssetManager('font','Font Manager','Import custom web fonts','.ttf,.otf,.woff,.woff2,font/*');return;}
  if(id==='resources'){openAssetManager('resource','Resource Manager','Manage project resource files','*/*');return;}
  if(id==='assets'){openAssetManager('asset','Asset Manager','Import general asset files','*/*');return;}
  if(id==='scripts'){openCodeManager('js');return;}
  if(id==='styles'){openCodeManager('css');return;}
  if(id==='manifest'){openManifest();return;}
  if(id==='browser'){openBrowserFeatures();return;}
  if(id==='build'){openBuild();return;}
}

function assetAccept(kind){return kind==='image'?'image/*':kind==='animation'?'.json,.gif,image/gif,application/json':kind==='audio'?'audio/*':kind==='font'?'.ttf,.otf,.woff,.woff2,font/*':'*/*';}
function openAssetManager(kind,title,sub,accept){pendingAssetKind=kind;showDetail(title,sub,'<div class="bw-manager-actions"><button class="bw-manager-btn primary" id="bwAssetImport">＋ Import</button></div><div id="bwAssetList" class="bw-manager-list"></div>');document.getElementById('bwAssetImport').onclick=function(){fileInput.accept=accept||assetAccept(kind);fileInput.click();};renderAssets(kind);}
function renderAssets(kind){var box=document.getElementById('bwAssetList');if(!box)return;var cfg=read(),arr=cfg.assets.filter(function(a){return kind==='asset'||a.kind===kind;});if(!arr.length){box.innerHTML='<div class="bw-manager-empty">Nenhum arquivo importado.</div>';return;}box.innerHTML=arr.map(function(a){var preview=a.type&&a.type.indexOf('image/')===0?'<img src="'+a.data+'" alt="">':(a.kind==='audio'?'♫':a.kind==='font'?'T':'◇');var use=(a.kind==='image')?'<button data-asset-use="'+a.id+'">Use</button>':'';return'<div class="bw-resource-row"><div class="bw-resource-preview">'+preview+'</div><div class="bw-resource-meta"><b>'+esc(a.name)+'</b><small>'+esc(a.kind)+' · '+fmtSize(a.size)+'</small></div><div class="bw-resource-actions">'+use+'<button data-asset-delete="'+a.id+'">×</button></div></div>';}).join('');box.querySelectorAll('[data-asset-delete]').forEach(function(b){b.onclick=function(){deleteAsset(this.dataset.assetDelete,kind);};});box.querySelectorAll('[data-asset-use]').forEach(function(b){b.onclick=function(){useImage(this.dataset.assetUse);};});}
function importAsset(file,kind){if(file.size>MAX_FILE){notice(file.name+' é grande demais (máx. 1.5 MB)');return;}var r=new FileReader();r.onload=function(){var cfg=read();cfg.assets.push({id:uid(),kind:kind,name:file.name,type:file.type||'',size:file.size,data:r.result,createdAt:Date.now()});if(write(cfg)){notice(file.name+' importado');renderAssets(kind);}};r.readAsDataURL(file);}
function deleteAsset(id,kind){var cfg=read();cfg.assets=cfg.assets.filter(function(a){return a.id!==id;});write(cfg);renderAssets(kind);}
function useImage(id){var cfg=read(),a=cfg.assets.find(function(x){return x.id===id;});if(!a)return;var el=typeof selectedNode==='function'?selectedNode():null;if(!el||el.dataset.type!=='image'){notice('Selecione um Image no editor primeiro');return;}var t=typeof contentTarget==='function'?contentTarget(el):null;if(!t)return;t.innerHTML='<img src="'+a.data+'" alt="'+esc(a.name)+'">';if(typeof commit==='function')commit();notice('Imagem aplicada');}

function openCodeManager(type){var cfg=read(),isCss=type==='css',title=isCss?'Style Manager':'Script Manager',sub=isCss?'Custom CSS and theme rules':'Custom JavaScript for the project',val=isCss?cfg.customCss:cfg.customJs;showDetail(title,sub,'<div class="bw-manager-actions"><button class="bw-manager-btn primary" id="bwCodeSave">Save</button><button class="bw-manager-btn" id="bwCodeClear">Clear</button></div><textarea class="bw-code-editor" id="bwCustomCode" spellcheck="false"></textarea>');document.getElementById('bwCustomCode').value=val||'';document.getElementById('bwCodeSave').onclick=function(){var c=read();if(isCss)c.customCss=document.getElementById('bwCustomCode').value;else c.customJs=document.getElementById('bwCustomCode').value;write(c);if(isCss)applyCssPreview(c.customCss);notice('Salvo');};document.getElementById('bwCodeClear').onclick=function(){document.getElementById('bwCustomCode').value='';};}
function applyCssPreview(css){var s=document.getElementById('bwCustomCssPreview');if(!s){s=document.createElement('style');s.id='bwCustomCssPreview';document.head.appendChild(s);}s.textContent=css||'';}

function openManifest(){var m=read().manifest;showDetail('Web Manifest Manager','Configure PWA/app metadata','<div class="bw-config-form"><label class="bw-config-field"><span>App name</span><input id="bwManifestName"></label><label class="bw-config-field"><span>Short name</span><input id="bwManifestShort"></label><label class="bw-config-field"><span>Theme color</span><input id="bwManifestTheme" type="color"></label><label class="bw-config-field"><span>Background color</span><input id="bwManifestBg" type="color"></label><label class="bw-config-field"><span>Display</span><select id="bwManifestDisplay"><option>standalone</option><option>fullscreen</option><option>minimal-ui</option><option>browser</option></select></label><label class="bw-config-field"><span>Start URL</span><input id="bwManifestStart"></label><div class="bw-manager-actions"><button class="bw-manager-btn primary" id="bwManifestSave">Save manifest</button></div></div>');document.getElementById('bwManifestName').value=m.name;document.getElementById('bwManifestShort').value=m.short_name;document.getElementById('bwManifestTheme').value=m.theme_color;document.getElementById('bwManifestBg').value=m.background_color;document.getElementById('bwManifestDisplay').value=m.display;document.getElementById('bwManifestStart').value=m.start_url;document.getElementById('bwManifestSave').onclick=function(){var c=read();c.manifest={name:document.getElementById('bwManifestName').value||state.projectName,short_name:document.getElementById('bwManifestShort').value||'Brotware',theme_color:document.getElementById('bwManifestTheme').value,background_color:document.getElementById('bwManifestBg').value,display:document.getElementById('bwManifestDisplay').value,start_url:document.getElementById('bwManifestStart').value||'index.html'};write(c);notice('Manifest salvo');};}

function openBrowserFeatures(){var f=read().features;var rows=[['notifications','Notifications','Browser notification API'],['geolocation','Geolocation','Location API'],['clipboard','Clipboard','Read/write clipboard helpers'],['fullscreen','Fullscreen','Fullscreen browser API']];showDetail('Browser Features','Configure browser capabilities','<div id="bwFeatureList">'+rows.map(function(r){return'<label class="bw-feature-row"><input type="checkbox" data-feature="'+r[0]+'" '+(f[r[0]]?'checked':'')+'><div><b>'+r[1]+'</b><small>'+r[2]+'</small></div></label>';}).join('')+'</div><div class="bw-manager-actions" style="margin-top:12px"><button class="bw-manager-btn primary" id="bwFeatureSave">Save</button></div>');document.getElementById('bwFeatureSave').onclick=function(){var c=read();document.querySelectorAll('[data-feature]').forEach(function(n){c.features[n.dataset.feature]=n.checked;});write(c);notice('Features salvas');};}

function openBuild(){var cfg=read(),assets=cfg.assets.length;showDetail('Build / Export Manager','Preview and package your project','<div class="bw-build-card"><h3>'+esc(state.projectName||'Brotware Project')+'</h3><p>Projeto web com páginas HTML, CSS, JavaScript e backup Brotware. Recursos configurados: '+assets+'.</p><div class="bw-manager-actions"><button class="bw-manager-btn primary" id="bwBuildPreview">▶ Preview</button><button class="bw-manager-btn primary" id="bwBuildZip">Export ZIP</button></div></div>');document.getElementById('bwBuildPreview').onclick=function(){close();if(typeof preview==='function')preview();};document.getElementById('bwBuildZip').onclick=function(){if(window.BrotwareProjects&&BrotwareProjects.exportZip)BrotwareProjects.exportZip();};}

function installCompileExtension(){if(typeof window.compilePage!=='function'||window.compilePage.__bwConfigWrapped)return;var base=window.compilePage;var wrapped=function(page){var html=base(page),cfg=read();if(cfg.customCss)html=html.replace('</head>','<style>\n'+cfg.customCss+'\n</style>\n</head>');if(cfg.manifest){var man=encodeURIComponent(JSON.stringify(cfg.manifest));html=html.replace('</head>','<meta name="theme-color" content="'+esc(cfg.manifest.theme_color)+'"><link rel="manifest" href="data:application/manifest+json,'+man+'">\n</head>');}if(cfg.customJs)html=html.replace('</body>','<script>\n'+cfg.customJs.replace(/<\\/script/gi,'<\\/script')+'\n<\\/script>\n</body>');return html;};wrapped.__bwConfigWrapped=true;window.compilePage=wrapped;applyCssPreview(read().customCss);}

function installEntrypoints(){build();var settings=document.querySelector('[data-bw-nav="settings"]');if(settings)settings.onclick=function(e){e.preventDefault();open();};var top=document.querySelector('.top-main');if(top&&!document.getElementById('bwConfigTopBtn')){var b=document.createElement('button');b.className='icon-btn';b.id='bwConfigTopBtn';b.title='Configuration';b.textContent='⚙';b.onclick=open;top.appendChild(b);}installCompileExtension();}

setTimeout(installEntrypoints,0);setTimeout(installEntrypoints,350);setTimeout(installEntrypoints,1100);
window.BrotwareConfiguration={open:open,close:close,read:read,save:write};
})();
