(function(){
'use strict';

var oldEdit=null,oldProps=null,oldPreviewAction=null,badge=null,observer=null,resize=null;

function active(){return !!(window.state&&state.dialogEditorActive&&state.activeDialogId&&window.BrotwareDialogs);}
function dialog(){return active()&&BrotwareDialogs.get?BrotwareDialogs.get(state.activeDialogId):null;}
function pane(){return document.getElementById('viewPane');}
function rootEl(){return document.getElementById('rootLayout');}
function clean(v){return String(v==null?'':v).trim();}
function cssSafe(v,fallback){v=clean(v);return v||fallback||'';}
function normalizeKeyword(v,axis){
  v=clean(v).toLowerCase();
  if(v==='match_parent'||v==='fill_parent')return'100%';
  if(v==='wrap_content')return axis==='width'?'fit-content':'auto';
  return v;
}
function normalizeConfig(d){
  if(!d||!d.config)return;
  var c=d.config;
  c.width=normalizeKeyword(c.width||'320px','width')||'320px';
  c.height=normalizeKeyword(c.height||'auto','height')||'auto';
  c.maxWidth=normalizeKeyword(c.maxWidth||'90vw','width')||'90vw';
  c.maxHeight=normalizeKeyword(c.maxHeight||'80vh','height')||'80vh';
}
function resolvedSize(value,axis,d){
  var p=pane(),fallback=axis==='width'?320:Math.max(220,Number(d&&d.designHeight)||320),v=normalizeKeyword(value,axis);
  if(!v||v==='auto'||v==='fit-content'||v==='max-content'||v==='min-content')return fallback+'px';
  var m=v.match(/^(-?\d+(?:\.\d+)?)(px|%|vw|vh|dvh|rem|em)?$/i);
  if(!m)return v;
  var n=Number(m[1]),u=(m[2]||'px').toLowerCase();
  if(u==='px')return Math.max(80,n)+'px';
  if(u==='%'||u==='vw')return Math.max(80,(p?p.clientWidth:390)*n/100)+'px';
  if(u==='vh'||u==='dvh')return Math.max(80,(p?p.clientHeight:720)*n/100)+'px';
  if(u==='rem')return Math.max(80,n*(parseFloat(getComputedStyle(document.documentElement).fontSize)||16))+'px';
  if(u==='em')return Math.max(80,n*16)+'px';
  return v;
}
function ensureBadge(){
  var p=pane();if(!p)return null;
  if(badge&&badge.parentElement===p)return badge;
  badge=document.getElementById('bwDialogSizeBadge');
  if(!badge){badge=document.createElement('div');badge.id='bwDialogSizeBadge';badge.className='bw-dialog-size-badge';p.insertBefore(badge,p.firstChild);}
  return badge;
}
function updateBadge(){
  if(!active())return;var r=rootEl(),b=ensureBadge();if(!r||!b)return;
  b.textContent=Math.round(r.offsetWidth)+' × '+Math.round(r.offsetHeight);
}
function removeHandlesFromClone(html){
  var h=document.createElement('div');h.innerHTML=html||'';h.querySelectorAll('.bw-dialog-free-handle').forEach(function(n){n.remove();});return h.innerHTML;
}
function ensureHandles(){
  if(!active())return;var r=rootEl();if(!r)return;
  ['e','s','se'].forEach(function(dir){
    if(r.querySelector('.bw-dialog-free-handle[data-bw-dialog-resize="'+dir+'"]'))return;
    var h=document.createElement('i');h.className='bw-dialog-free-handle';h.dataset.bwDialogResize=dir;h.title='Redimensionar Dialog';h.addEventListener('pointerdown',startResize);r.appendChild(h);
  });
}
function applyFreeSize(){
  if(!active())return;var d=dialog(),r=rootEl(),p=pane();if(!d||!r||!p)return;
  normalizeConfig(d);
  r.classList.add('bw-dialog-design-root');p.classList.add('bw-dialog-design-pane');
  r.style.width=resolvedSize(d.config.width,'width',d);
  r.style.height=resolvedSize(d.config.height,'height',d);
  r.style.maxWidth='none';r.style.maxHeight='none';
  ensureHandles();ensureBadge();updateBadge();
  if(observer)observer.disconnect();
  observer=new MutationObserver(function(){if(active()){ensureHandles();updateBadge();}});
  observer.observe(r,{childList:true,subtree:false});
  setTimeout(function(){try{r.scrollIntoView({block:'center',inline:'center'});}catch(e){}},20);
}
function startResize(e){
  if(!active())return;e.preventDefault();e.stopPropagation();var r=rootEl(),d=dialog();if(!r||!d)return;
  var dir=e.currentTarget.dataset.bwDialogResize,rect=r.getBoundingClientRect();
  resize={dir:dir,sx:e.clientX,sy:e.clientY,w:rect.width,h:rect.height,scaleX:rect.width/(r.offsetWidth||rect.width||1),scaleY:rect.height/(r.offsetHeight||rect.height||1),d:d};
  window.addEventListener('pointermove',moveResize,true);window.addEventListener('pointerup',endResize,true);window.addEventListener('pointercancel',endResize,true);
  document.body.classList.add('bw-dialog-resizing');
}
function moveResize(e){
  if(!resize)return;e.preventDefault();var r=rootEl();if(!r)return;
  var dx=(e.clientX-resize.sx)/(resize.scaleX||1),dy=(e.clientY-resize.sy)/(resize.scaleY||1),w=resize.w/(resize.scaleX||1),h=resize.h/(resize.scaleY||1);
  if(resize.dir.indexOf('e')>=0)w=Math.max(80,w+dx);
  if(resize.dir.indexOf('s')>=0)h=Math.max(80,h+dy);
  if(resize.dir.indexOf('e')>=0)r.style.width=Math.round(w)+'px';
  if(resize.dir.indexOf('s')>=0)r.style.height=Math.round(h)+'px';
  updateBadge();
}
function endResize(){
  if(!resize)return;var r=rootEl(),d=resize.d,dir=resize.dir;window.removeEventListener('pointermove',moveResize,true);window.removeEventListener('pointerup',endResize,true);window.removeEventListener('pointercancel',endResize,true);document.body.classList.remove('bw-dialog-resizing');
  if(r&&d&&d.config){
    if(dir.indexOf('e')>=0)d.config.width=Math.round(parseFloat(r.style.width)||r.offsetWidth)+'px';
    if(dir.indexOf('s')>=0)d.config.height=Math.round(parseFloat(r.style.height)||r.offsetHeight)+'px';
    /* A visual resize means the user wants the designed size to win in Preview too. */
    d.config.maxWidth='none';d.config.maxHeight='none';d.updatedAt=Date.now();
    if(typeof autoSave==='function')autoSave();
  }
  resize=null;applyFreeSize();
}
function addPresets(){
  var body=document.getElementById('bwDialogPropsBody');if(!body||body.querySelector('.bw-dialog-size-presets'))return;
  var sizeHeading=Array.prototype.filter.call(body.querySelectorAll('h4'),function(h){return String(h.textContent).trim().toUpperCase()==='SIZE';})[0];
  var grid=sizeHeading&&sizeHeading.nextElementSibling;if(!grid)return;
  var help=document.createElement('div');help.className='bw-dialog-size-help';help.innerHTML='Use <b>px</b>, <b>%</b>, <b>vw</b>, <b>vh</b>, <b>match_parent</b> ou <b>wrap_content</b>. “Sem limite” permite que o Dialog seja maior que a viewport.';
  var box=document.createElement('div');box.className='bw-dialog-size-presets';box.innerHTML='<button type="button" data-bw-dsize="compact">Compacto</button><button type="button" data-bw-dsize="medium">Médio</button><button type="button" data-bw-dsize="large">Grande</button><button type="button" data-bw-dsize="full">Tela inteira</button><button type="button" data-bw-dsize="free">Sem limite</button>';
  grid.insertBefore(help,grid.firstChild);grid.insertBefore(box,help.nextSibling);
  box.addEventListener('click',function(e){var b=e.target.closest('[data-bw-dsize]');if(!b)return;var w=document.getElementById('bdp_width'),h=document.getElementById('bdp_height'),mw=document.getElementById('bdp_maxWidth'),mh=document.getElementById('bdp_maxHeight');if(!w||!h||!mw||!mh)return;var k=b.dataset.bwDsize;
    if(k==='compact'){w.value='320px';h.value='auto';mw.value='90vw';mh.value='80vh';}
    else if(k==='medium'){w.value='520px';h.value='360px';mw.value='92vw';mh.value='88vh';}
    else if(k==='large'){w.value='760px';h.value='520px';mw.value='96vw';mh.value='92vh';}
    else if(k==='full'){w.value='100%';h.value='100%';mw.value='100%';mh.value='100%';}
    else if(k==='free'){mw.value='none';mh.value='none';}
  });
}
function afterPropertiesSave(){
  setTimeout(function(){var d=dialog();if(d){normalizeConfig(d);if(typeof autoSave==='function')autoSave();applyFreeSize();}},0);
}
function patchSerialize(){
  if(!window.serializeEditor||window.serializeEditor.__bwDialogFreeSize)return;var old=window.serializeEditor;
  var wrapped=function(){return removeHandlesFromClone(old.apply(this,arguments));};wrapped.__bwDialogFreeSize=true;window.serializeEditor=wrapped;
}
function patchApi(){
  if(!window.BrotwareDialogs)return false;
  if(!oldEdit){oldEdit=BrotwareDialogs.edit;BrotwareDialogs.edit=function(){var out=oldEdit.apply(this,arguments);setTimeout(applyFreeSize,0);return out;};}
  if(!oldProps){oldProps=BrotwareDialogs.properties;BrotwareDialogs.properties=function(){var out=oldProps.apply(this,arguments);setTimeout(addPresets,0);return out;};}
  if(!oldPreviewAction){oldPreviewAction=BrotwareDialogs.previewAction;BrotwareDialogs.previewAction=function(type,id){
    var d=BrotwareDialogs.get&&BrotwareDialogs.get(id);if(!d||type==='closeDialog')return oldPreviewAction?oldPreviewAction.apply(this,arguments):Promise.resolve();
    var old=document.getElementById('bwDialogLivePreview');if(old)old.remove();if(type==='toggleDialog'&&old)return Promise.resolve();normalizeConfig(d);
    var o=document.createElement('div');o.id='bwDialogLivePreview';o.className='bw-dialog-live-preview';var c=d.config;o.style.background='rgba(0,0,0,'+Math.max(0,Math.min(1,Number(c.overlayOpacity)||0))+')';
    var w=cssSafe(c.width,'320px'),h=cssSafe(c.height,'auto'),mw=cssSafe(c.maxWidth,'90vw'),mh=cssSafe(c.maxHeight,'80vh');
    o.innerHTML='<div class="bw-dialog-live-card" style="position:relative;background:'+c.background+';border-radius:'+c.borderRadius+';padding:'+c.padding+';width:'+w+';height:'+h+';max-width:'+mw+';max-height:'+mh+';box-shadow:'+c.shadow+'"><div style="position:relative;width:100%;min-height:'+Math.max(0,d.designHeight||0)+'px">'+(d.content||'')+'</div></div>';
    document.body.appendChild(o);o.onclick=function(e){if(e.target===o)o.remove();};return Promise.resolve();
  };}
  return true;
}
function installSaveHook(){var b=document.getElementById('bwDialogPropsSave');if(b&&b.dataset.bwFreeSize!=='1'){b.dataset.bwFreeSize='1';b.addEventListener('click',afterPropertiesSave);}}
function install(){
  if(!patchApi()){setTimeout(install,100);return;}patchSerialize();installSaveHook();
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-dialog-action="properties"],#bwDialogEditorProps,[data-vm-edit-dialog]'))setTimeout(function(){addPresets();installSaveHook();},40);},true);
  window.addEventListener('resize',function(){if(active()){clearTimeout(window.__bwDialogFreeResize);window.__bwDialogFreeResize=setTimeout(applyFreeSize,80);}});
  if(active())applyFreeSize();
}

window.BrotwareDialogFreeSize={apply:applyFreeSize,refresh:applyFreeSize};
setTimeout(install,0);setTimeout(install,400);setTimeout(install,1200);
})();
