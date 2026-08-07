(function(){
'use strict';

var workspace=null,frame=null,shell=null,titleEl=null,subEl=null,currentProjectId=null,currentEntry=null,currentDevice='desktop',sessionId=null,urls=[],listeners={},lastSnapshot=null,lastSelection=null,missing=[],installed=false;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function emit(type,data){(listeners[type]||[]).slice().forEach(function(fn){try{fn(data);}catch(e){console.error(e);}});}
function on(type,fn){if(!listeners[type])listeners[type]=[];listeners[type].push(fn);return function(){listeners[type]=listeners[type].filter(function(x){return x!==fn;});};}
function meta(){return currentProjectId?BrotwareVFS.getMeta(currentProjectId):null;}
function record(){return currentProjectId&&window.BrotwareProjectFormat?BrotwareProjectFormat.findRecord(currentProjectId):null;}
function revoke(){urls.forEach(function(u){try{URL.revokeObjectURL(u);}catch(e){}});urls=[];}
function makeUrl(content,type){var u=URL.createObjectURL(new Blob([content],{type:type||'application/octet-stream'}));urls.push(u);return u;}
function normalizeRef(v){return String(v==null?'':v).trim().replace(/^['"]|['"]$/g,'');}
function isExternalUrl(v){return /^(?:[a-z]+:|\/\/|#|data:|blob:|mailto:|tel:)/i.test(v||'');}
function cssEscapeString(v){return String(v||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');}

async function cssFor(path,files,rawMap,seen){
  seen=seen||{};path=BrotwareVFS.normalizePath(path);if(seen[path])return'';seen[path]=true;var e=BrotwareVFS.get(files,path);if(!e)return'';var css=BrotwareVFS.text(e);
  var imports=[];css=css.replace(/@import\s+(?:url\()?\s*(["']?)([^"')\s;]+)\1\s*\)?\s*;/gi,function(all,q,ref){if(isExternalUrl(ref))return all;var p=BrotwareVFS.resolve(path,ref);if(p&&BrotwareVFS.get(files,p)){imports.push(p);return'/* Brotware inlined @import '+ref+' */';}return all;});
  css=css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,function(all,q,ref){ref=normalizeRef(ref);if(isExternalUrl(ref))return all;var p=BrotwareVFS.resolve(path,ref),u=p&&rawMap[p];return u?'url("'+u+'")':all;});
  var prefix='';for(var i=0;i<imports.length;i++)prefix+=await cssFor(imports[i],files,rawMap,seen)+'\n';return prefix+css;
}
function rewriteSrcset(value,base,rawMap){return String(value||'').split(',').map(function(part){var x=part.trim().split(/\s+/),p=BrotwareVFS.resolve(base,x[0]);if(p&&rawMap[p])x[0]=rawMap[p];return x.join(' ');}).join(', ');}
function serializeDoc(doc){return '<!doctype html>\n'+doc.documentElement.outerHTML;}

function bridgeSource(cfg){
  return `(function(){
'use strict';
var CFG=${JSON.stringify(cfg)};
var runtimeSeq=1,elementIds=new WeakMap(),idElements=new Map(),inspect=false,selected=null,snapshotTimer=null,storageData=Object.assign({},CFG.storage||{});
function post(type,payload){try{parent.postMessage(Object.assign({__brotwareExternal:1,sessionId:CFG.sessionId,type:type},payload||{}),'*')}catch(e){}}
function norm(path){var a=[];String(path||'').replace(/\\\\/g,'/').replace(/^\\/+/, '').split('/').forEach(function(x){if(!x||x==='.')return;if(x==='..'){if(a.length)a.pop()}else a.push(x)});return a.join('/')}
function dir(path){path=norm(path);var i=path.lastIndexOf('/');return i<0?'':path.slice(0,i)}
function resolve(ref,base){ref=String(ref||'').trim();if(!ref||/^(?:[a-z]+:|\\/\\/|#|data:|blob:|mailto:|tel:)/i.test(ref))return null;var clean=ref.split('#')[0].split('?')[0];return norm((clean[0]==='/'?'':(dir(base||CFG.entry)?dir(base||CFG.entry)+'/':''))+clean)}
function virtual(ref,base){var p=resolve(ref,base||CFG.entry);return p&&CFG.urls[p]?CFG.urls[p]:null}
function rid(el){if(!el||el.nodeType!==1)return'';var id=elementIds.get(el);if(!id){id='bwrt_'+(runtimeSeq++);elementIds.set(el,id);idElements.set(id,el)}return id}
function cssEsc(v){if(window.CSS&&CSS.escape)return CSS.escape(v);return String(v).replace(/(["'\\\\.#:[\\]()=>+~*^$|])/g,'\\\\$1')}
function selector(el){if(!el||el===document.documentElement)return'html';if(el===document.body)return'body';if(el.id){try{if(document.querySelectorAll('#'+cssEsc(el.id)).length===1)return'#'+cssEsc(el.id)}catch(e){}}var parts=[],n=el;while(n&&n.nodeType===1&&n!==document.body){var tag=n.tagName.toLowerCase(),idx=1,s=n;while((s=s.previousElementSibling))if(s.tagName===n.tagName)idx++;parts.unshift(tag+':nth-of-type('+idx+')');n=n.parentElement;if(parts.length>8)break}return'body > '+parts.join(' > ')}
function bindKnown(root){Object.keys(CFG.bindings||{}).forEach(function(id){var sel=CFG.bindings[id];try{var nodes=(root||document).querySelectorAll(sel);for(var i=0;i<nodes.length;i++)if(!nodes[i].dataset.bwId)nodes[i].dataset.bwId=id}catch(e){}})}
function styleInfo(el){var s=getComputedStyle(el),r=el.getBoundingClientRect();return{tag:el.tagName,id:el.id||'',classes:typeof el.className==='string'?el.className:'',text:String(el.innerText||el.textContent||'').trim().slice(0,1200),runtimeId:rid(el),bwId:el.dataset&&el.dataset.bwId||'',selector:selector(el),attributes:Array.prototype.slice.call(el.attributes||[]).reduce(function(o,a){if(a.name!=='style')o[a.name]=a.value;return o},{}),rect:{x:r.x,y:r.y,width:r.width,height:r.height},styles:{width:s.width,height:s.height,margin:s.margin,padding:s.padding,background:s.background,backgroundColor:s.backgroundColor,color:s.color,border:s.border,borderRadius:s.borderRadius,fontSize:s.fontSize,fontFamily:s.fontFamily,fontWeight:s.fontWeight,lineHeight:s.lineHeight,textAlign:s.textAlign,display:s.display,position:s.position,top:s.top,right:s.right,bottom:s.bottom,left:s.left,flex:s.flex,flexDirection:s.flexDirection,justifyContent:s.justifyContent,alignItems:s.alignItems,gridTemplateColumns:s.gridTemplateColumns,gridTemplateRows:s.gridTemplateRows,gap:s.gap,opacity:s.opacity,transform:s.transform,zIndex:s.zIndex,boxShadow:s.boxShadow,overflow:s.overflow}}}
function tiny(el,depth){if(!el||el.nodeType!==1||depth>12)return null;var kids=[];for(var i=0;i<el.children.length&&kids.length<300;i++){var x=tiny(el.children[i],depth+1);if(x)kids.push(x)}return{runtimeId:rid(el),bwId:el.dataset&&el.dataset.bwId||'',tag:el.tagName,id:el.id||'',classes:typeof el.className==='string'?el.className:'',text:String(el.childElementCount?'':(el.textContent||'')).trim().slice(0,90),children:kids}}
function snapshot(reason){clearTimeout(snapshotTimer);snapshotTimer=setTimeout(function(){bindKnown(document);post('DOM_SNAPSHOT',{reason:reason||'change',tree:tiny(document.body,0),count:document.getElementsByTagName('*').length})},45)}
function outline(el){if(selected)selected.classList.remove('bw-inspector-selected');selected=el;if(selected)selected.classList.add('bw-inspector-selected')}
function select(el,source){if(!el||el===document.documentElement)return;outline(el);post('ELEMENT_SELECTED',{source:source||'preview',element:styleInfo(el)})}
function rewriteAttr(el,name){if(!el||!el.getAttribute)return;var v=el.getAttribute(name);if(!v||/^(?:[a-z]+:|\\/\\/|#|data:|blob:|mailto:|tel:)/i.test(v))return;var u=virtual(v,CFG.entry);if(u)try{el.setAttribute(name,u)}catch(e){}}
function prepare(root){if(!root||root.nodeType!==1)return;bindKnown(root.parentNode||document);var all=[root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));all.forEach(function(el){['src','poster'].forEach(function(a){rewriteAttr(el,a)});if(el.tagName==='LINK'&&String(el.rel||'').toLowerCase()!=='stylesheet')rewriteAttr(el,'href');if(el.tagName==='SCRIPT')rewriteAttr(el,'src')})}
function storage(){return{get length(){return Object.keys(storageData).length},key:function(i){return Object.keys(storageData)[i]||null},getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(storageData,k)?String(storageData[k]):null},setItem:function(k,v){storageData[String(k)]=String(v);post('STORAGE',{data:storageData})},removeItem:function(k){delete storageData[String(k)];post('STORAGE',{data:storageData})},clear:function(){storageData={};post('STORAGE',{data:storageData})}}}
try{Object.defineProperty(window,'localStorage',{configurable:true,value:storage()})}catch(e){}
try{Object.defineProperty(window,'sessionStorage',{configurable:true,value:storage()})}catch(e){}
var realFetch=window.fetch&&window.fetch.bind(window);if(realFetch)window.fetch=function(input,init){var s=typeof input==='string'?input:(input&&input.url)||'',u=virtual(s,CFG.entry);return realFetch(u||input,init)};
if(window.XMLHttpRequest){var xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url){var args=Array.prototype.slice.call(arguments);args[1]=virtual(url,CFG.entry)||url;return xo.apply(this,args)}}
var realOpen=window.open;window.open=function(url,target,features){var p=resolve(url,CFG.entry);if(p&&CFG.urls[p]){post('NAVIGATE',{path:p});return null}return realOpen.call(window,url,target,features)};
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(inspect){e.preventDefault();e.stopImmediatePropagation();select(e.target,'click');return}if(a){var original=a.dataset.bwOriginalHref||a.getAttribute('href')||'',p=resolve(original,CFG.entry);if(p&&CFG.urls[p]&&/\\.html?$/i.test(p)){e.preventDefault();post('NAVIGATE',{path:p})}}},true);
document.addEventListener('pointerover',function(e){if(!inspect)return;var el=e.target;if(el&&el.nodeType===1)el.classList.add('bw-inspector-hover')},true);document.addEventListener('pointerout',function(e){var el=e.target;if(el&&el.classList)el.classList.remove('bw-inspector-hover')},true);
window.addEventListener('error',function(e){var target=e.target;if(target&&target!==window&&(target.src||target.href))post('ASSET_ERROR',{url:target.src||target.href,tag:target.tagName});else post('JS_ERROR',{message:e.message||'Erro JavaScript',source:e.filename||'',line:e.lineno||0})},true);
window.addEventListener('unhandledrejection',function(e){post('JS_ERROR',{message:String(e.reason&&e.reason.message||e.reason||'Promise rejeitada')})});
window.addEventListener('message',function(e){var d=e.data||{};if(!d.__brotwareEditor||d.sessionId!==CFG.sessionId)return;if(d.type==='SET_INSPECT'){inspect=!!d.enabled;document.documentElement.classList.toggle('bw-inspector-mode',inspect)}else if(d.type==='SELECT_RUNTIME'){var el=idElements.get(d.runtimeId);if(el)select(el,'layers')}else if(d.type==='BIND_ELEMENT'){var be=idElements.get(d.runtimeId);if(be){be.dataset.bwId=d.bwId;CFG.bindings[d.bwId]=d.selector||selector(be);snapshot('bind');select(be,'bind')}}else if(d.type==='OVERRIDES'){var st=document.getElementById('bwExternalOverrides');if(st)st.textContent=d.css||'';CFG.bindings=d.bindings||CFG.bindings;bindKnown(document);snapshot('overrides')}else if(d.type==='REQUEST_SNAPSHOT')snapshot('request')});
var obs=new MutationObserver(function(ms){var changed=false;ms.forEach(function(m){if(m.type==='childList'){Array.prototype.forEach.call(m.addedNodes||[],function(n){if(n.nodeType===1){prepare(n);changed=true}});if(m.removedNodes&&m.removedNodes.length)changed=true}else if(m.type==='attributes'||m.type==='characterData')changed=true});if(changed)snapshot('mutation')});
function start(){prepare(document.body);bindKnown(document);obs.observe(document.body,{childList:true,subtree:true,attributes:true,characterData:true});snapshot('load');post('READY',{entry:CFG.entry,title:document.title})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();`;
}

async function materialize(projectId,entry){
  revoke();missing=[];var rec=await BrotwareVFS.getProject(projectId),files=rec.files||{},entryFile=BrotwareVFS.get(files,entry);if(!entryFile)throw new Error('Arquivo de entrada não encontrado: '+entry);
  var rawMap={};Object.keys(files).forEach(function(path){var e=files[path];rawMap[path]=makeUrl(BrotwareVFS.bytes(e),e.mime||BrotwareVFS.mime(path));});
  var html=BrotwareVFS.text(entryFile),doc=new DOMParser().parseFromString(html,'text/html');
  Array.prototype.forEach.call(doc.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]'),function(n){n.remove();});
  Array.prototype.forEach.call(doc.querySelectorAll('base'),function(n){n.remove();});
  var styleLinks=Array.prototype.slice.call(doc.querySelectorAll('link[rel~="stylesheet"][href]'));
  for(var i=0;i<styleLinks.length;i++){var link=styleLinks[i],href=link.getAttribute('href'),p=BrotwareVFS.resolve(entry,href);if(p&&BrotwareVFS.get(files,p)){var st=doc.createElement('style');st.dataset.bwSource=p;st.textContent=await cssFor(p,files,rawMap,{});link.replaceWith(st);}else if(p)missing.push(p);}
  Array.prototype.forEach.call(doc.querySelectorAll('[src]'),function(el){var v=el.getAttribute('src'),p=BrotwareVFS.resolve(entry,v);if(p&&rawMap[p])el.setAttribute('src',rawMap[p]);else if(p&&!BrotwareVFS.get(files,p))missing.push(p);});
  Array.prototype.forEach.call(doc.querySelectorAll('[poster]'),function(el){var v=el.getAttribute('poster'),p=BrotwareVFS.resolve(entry,v);if(p&&rawMap[p])el.setAttribute('poster',rawMap[p]);});
  Array.prototype.forEach.call(doc.querySelectorAll('[srcset]'),function(el){el.setAttribute('srcset',rewriteSrcset(el.getAttribute('srcset'),entry,rawMap));});
  Array.prototype.forEach.call(doc.querySelectorAll('script[src]'),function(el){var original=el.getAttribute('src'),p=BrotwareVFS.resolve(entry,original);if(p&&rawMap[p])el.setAttribute('src',rawMap[p]);else if(p)missing.push(p);});
  Array.prototype.forEach.call(doc.querySelectorAll('a[href]'),function(a){var href=a.getAttribute('href');a.dataset.bwOriginalHref=href;var p=BrotwareVFS.resolve(entry,href);if(p&&rawMap[p]&&/\.html?$/i.test(p))a.setAttribute('href','#');});
  var m=BrotwareVFS.getMeta(projectId)||{},overrideStyle=doc.createElement('style');overrideStyle.id='bwExternalOverrides';overrideStyle.textContent=overridesCss(m);doc.head.appendChild(overrideStyle);
  var inspectorStyle=doc.createElement('style');inspectorStyle.textContent='.bw-inspector-hover{outline:1px dashed #0d99ff!important;outline-offset:1px!important}.bw-inspector-selected{outline:2px solid #0d99ff!important;outline-offset:2px!important}.bw-inspector-mode{cursor:crosshair!important}.bw-inspector-mode *{cursor:crosshair!important}';doc.head.appendChild(inspectorStyle);
  sessionId='bws_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);var bridge=doc.createElement('script');bridge.textContent=bridgeSource({sessionId:sessionId,entry:entry,urls:rawMap,bindings:m.bindings||{},storage:m.previewStorage||{}});doc.head.insertBefore(bridge,doc.head.firstChild);
  return serializeDoc(doc);
}
function overridesCss(m){var out='';Object.keys((m&&m.overrides)||{}).forEach(function(id){var item=m.overrides[id]||{},styles=item.styles||{};out+='[data-bw-id="'+cssEscapeString(id)+'"]{';Object.keys(styles).forEach(function(p){if(styles[p]!=null&&styles[p]!=='')out+=p+':'+String(styles[p]).replace(/[{}]/g,'')+' !important;';});out+='}\n';});return out;}

function build(){
  if(workspace)return;workspace=document.createElement('div');workspace.id='bwExternalWorkspace';workspace.className='bw-external-workspace';workspace.innerHTML='<header class="bw-external-top"><button id="bwExternalBack" type="button">←</button><div class="bw-external-title"><strong id="bwExternalTitle">Site importado</strong><small id="bwExternalSub"></small></div><span class="spacer"></span><button id="bwExternalInspect" type="button">⌖ Inspecionar</button><button id="bwExternalLayers" type="button">☷ Camadas</button><div class="bw-external-device"><button data-bw-ext-device="mobile">Mobile</button><button data-bw-ext-device="tablet">Tablet</button><button data-bw-ext-device="desktop" class="active">Desktop</button></div><button id="bwExternalReload" type="button">↻</button><button id="bwExternalExport" class="primary" type="button">Exportar</button></header><main class="bw-external-main"><section class="bw-external-stage"><div class="bw-external-frame-shell desktop" id="bwExternalShell"><iframe id="bwExternalFrame" class="bw-external-frame" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"></iframe></div><div class="bw-external-errors" id="bwExternalErrors"></div></section><aside class="bw-external-inspector-host" id="bwExternalInspectorHost"></aside></main>';
  document.body.appendChild(workspace);frame=document.getElementById('bwExternalFrame');shell=document.getElementById('bwExternalShell');titleEl=document.getElementById('bwExternalTitle');subEl=document.getElementById('bwExternalSub');
  document.getElementById('bwExternalBack').onclick=closeToProjects;document.getElementById('bwExternalReload').onclick=reload;document.getElementById('bwExternalInspect').onclick=toggleInspect;document.getElementById('bwExternalLayers').onclick=function(){emit('OPEN_LAYERS',{tree:lastSnapshot});};document.getElementById('bwExternalExport').onclick=function(){if(window.BrotwareUniversalExporter)BrotwareUniversalExporter.exportProject(currentProjectId);};
  Array.prototype.forEach.call(workspace.querySelectorAll('[data-bw-ext-device]'),function(b){b.onclick=function(){setDevice(this.dataset.bwExtDevice);};});window.addEventListener('message',message);
}
function setDevice(d){currentDevice=d||'desktop';if(!shell)return;shell.classList.remove('mobile','tablet','desktop');shell.classList.add(currentDevice);Array.prototype.forEach.call(workspace.querySelectorAll('[data-bw-ext-device]'),function(b){b.classList.toggle('active',b.dataset.bwExtDevice===currentDevice);});}
function send(type,payload){if(!frame||!frame.contentWindow||!sessionId)return;frame.contentWindow.postMessage(Object.assign({__brotwareEditor:1,sessionId:sessionId,type:type},payload||{}),'*');}
var inspectEnabled=false;function toggleInspect(){inspectEnabled=!inspectEnabled;var b=document.getElementById('bwExternalInspect');if(b)b.classList.toggle('active',inspectEnabled);send('SET_INSPECT',{enabled:inspectEnabled});}
async function open(projectId,entry){
  build();currentProjectId=projectId;var m=BrotwareVFS.getMeta(projectId);if(!m)throw new Error('Projeto externo não encontrado.');currentEntry=BrotwareVFS.normalizePath(entry||m.entry||'index.html');var r=BrotwareProjectFormat.findRecord(projectId);titleEl.textContent=r?r.name:'Site importado';subEl.textContent=currentEntry+(m.framework?' · '+m.framework:'');workspace.classList.add('show');document.body.classList.add('bw-external-open');setDevice(window.innerWidth<=760?'mobile':'desktop');await render();emit('OPEN',{projectId:projectId,meta:m});
}
async function render(){if(!currentProjectId)return;var errors=document.getElementById('bwExternalErrors');if(errors)errors.innerHTML='';try{var html=await materialize(currentProjectId,currentEntry);frame.srcdoc=html;if(missing.length)showIssue('warning','Assets não encontrados: '+missing.slice(0,5).join(', ')+(missing.length>5?' …':''));}catch(e){showIssue('error',e.message||String(e));}}
function reload(){render();}
function close(){if(workspace)workspace.classList.remove('show');document.body.classList.remove('bw-external-open');revoke();currentProjectId=null;currentEntry=null;sessionId=null;lastSnapshot=null;lastSelection=null;emit('CLOSE',{});}
function closeToProjects(){close();if(window.BrotwareProjects&&BrotwareProjects.show)BrotwareProjects.show(true);}
function showIssue(level,msg){var b=document.getElementById('bwExternalErrors');if(!b)return;var n=document.createElement('div');n.className='bw-ext-issue '+level;n.textContent=msg;b.appendChild(n);emit('ERROR',{level:level,message:msg});}
async function navigate(path){var rec=await BrotwareVFS.getProject(currentProjectId),p=BrotwareVFS.normalizePath(path);if(!BrotwareVFS.get(rec.files,p)){showIssue('error','Página não encontrada: '+p);return;}currentEntry=p;var m=BrotwareVFS.getMeta(currentProjectId)||{};BrotwareVFS.patchMeta(currentProjectId,{entry:p});subEl.textContent=p+(m.framework?' · '+m.framework:'');render();}
function message(e){if(!workspace||!workspace.classList.contains('show')||e.source!==frame.contentWindow)return;var d=e.data||{};if(!d.__brotwareExternal||d.sessionId!==sessionId)return;if(d.type==='READY'){emit('READY',d);send('SET_INSPECT',{enabled:inspectEnabled});}else if(d.type==='DOM_SNAPSHOT'){lastSnapshot=d.tree;emit('DOM_SNAPSHOT',d);}else if(d.type==='ELEMENT_SELECTED'){lastSelection=d.element;emit('ELEMENT_SELECTED',d.element);}else if(d.type==='NAVIGATE'){navigate(d.path);}else if(d.type==='JS_ERROR'){showIssue('error',(d.message||'Erro JavaScript')+(d.source?' · '+d.source:''));}else if(d.type==='ASSET_ERROR'){showIssue('warning','Falha ao carregar '+(d.tag||'asset')+': '+d.url);}else if(d.type==='STORAGE'){var m=BrotwareVFS.getMeta(currentProjectId)||{};BrotwareVFS.patchMeta(currentProjectId,{previewStorage:d.data||m.previewStorage||{}});}}
function selectRuntime(runtimeId){send('SELECT_RUNTIME',{runtimeId:runtimeId});}
function bindElement(runtimeId,bwId,selector){send('BIND_ELEMENT',{runtimeId:runtimeId,bwId:bwId,selector:selector});}
function updateOverrides(){var m=BrotwareVFS.getMeta(currentProjectId)||{};send('OVERRIDES',{css:overridesCss(m),bindings:m.bindings||{}});}
function requestSnapshot(){send('REQUEST_SNAPSHOT',{});}
function getState(){return{projectId:currentProjectId,entry:currentEntry,meta:meta(),snapshot:lastSnapshot,selection:lastSelection,inspect:inspectEnabled};}

function installProjectCardHook(){document.addEventListener('click',function(e){var card=e.target.closest&&e.target.closest('.bw-project-card');if(!card)return;var id=card.dataset.projectId;if(!BrotwareVFS.isExternal(id))return;var action=e.target.closest('[data-project-action]');if(action){if(action.dataset.projectAction==='export'&&window.BrotwareUniversalExporter){e.preventDefault();e.stopImmediatePropagation();BrotwareUniversalExporter.exportProject(id);}return;}if(e.target.closest('.bw-project-more'))return;e.preventDefault();e.stopImmediatePropagation();if(window.BrotwareProjects&&BrotwareProjects.open)BrotwareProjects.open(id);setTimeout(function(){open(id).catch(function(err){showIssue('error',err.message);});},100);},true);}
function install(){if(installed)return;installed=true;build();installProjectCardHook();}

window.BrotwareExternalPreview={open:open,close:close,reload:reload,navigate:navigate,setDevice:setDevice,on:on,send:send,selectRuntime:selectRuntime,bindElement:bindElement,updateOverrides:updateOverrides,requestSnapshot:requestSnapshot,getState:getState,overridesCss:overridesCss};
setTimeout(install,0);setTimeout(install,700);
})();
