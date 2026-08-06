(function(){
'use strict';

var ACTIVE_KEY='brotware_active_project_v1';
var CONFIG_PREFIX='brotware_web_config_v1:';
var MAX_FILE=1572864;
var backdrop=null,searchInput=null,listEl=null,titleEl=null,fileInput=null;
var mode='image',picked='default_image';
var imageBtn=null,bgBtn=null;

function activeId(){return localStorage.getItem(ACTIVE_KEY)||'default';}
function configKey(){return CONFIG_PREFIX+activeId();}
function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function notify(msg){if(typeof toast==='function')toast(msg);else console.log(msg);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function readConfig(){
  if(window.BrotwareConfiguration&&typeof window.BrotwareConfiguration.read==='function'){
    try{return window.BrotwareConfiguration.read();}catch(e){}
  }
  try{return JSON.parse(localStorage.getItem(configKey())||'null')||{assets:[]};}catch(e){return{assets:[]};}
}
function writeConfig(cfg){
  if(window.BrotwareConfiguration&&typeof window.BrotwareConfiguration.save==='function'){
    try{return window.BrotwareConfiguration.save(cfg)!==false;}catch(e){}
  }
  try{localStorage.setItem(configKey(),JSON.stringify(cfg));return true;}catch(e){notify('Armazenamento cheio');return false;}
}
function images(){
  var cfg=readConfig();
  return (Array.isArray(cfg.assets)?cfg.assets:[]).filter(function(a){return a&&a.kind==='image'&&a.data;});
}
function defaultThumb(){
  return '<div class="bw-image-thumb">▧</div>';
}

function build(){
  if(backdrop)return;
  backdrop=document.createElement('div');
  backdrop.className='bw-image-backdrop';
  backdrop.id='bwImageResourceDialog';
  backdrop.innerHTML='\
    <section class="bw-image-dialog" role="dialog" aria-modal="true" aria-labelledby="bwImageResourceTitle">\
      <div class="bw-image-head"><span class="icon">▧</span><strong id="bwImageResourceTitle">Image</strong></div>\
      <div class="bw-image-search-wrap"><label class="bw-image-search"><span>⌕</span><input id="bwImageResourceSearch" type="search" placeholder="Search..." autocomplete="off"></label></div>\
      <div class="bw-image-toolbar"><button type="button" id="bwImageResourceImport">＋ Import image</button></div>\
      <div class="bw-image-list" id="bwImageResourceList"></div>\
      <div class="bw-image-actions"><button type="button" id="bwImageResourceCancel">Cancel</button><button type="button" id="bwImageResourceSelect">Select</button></div>\
      <input id="bwImageResourceFile" type="file" accept="image/*" hidden>\
    </section>';
  document.body.appendChild(backdrop);
  searchInput=document.getElementById('bwImageResourceSearch');
  listEl=document.getElementById('bwImageResourceList');
  titleEl=document.getElementById('bwImageResourceTitle');
  fileInput=document.getElementById('bwImageResourceFile');

  searchInput.addEventListener('input',render);
  listEl.addEventListener('change',function(e){if(e.target&&e.target.name==='bwImageResourceChoice')picked=e.target.value;});
  listEl.addEventListener('click',function(e){var row=e.target.closest('.bw-image-option');if(!row)return;var radio=row.querySelector('input');if(radio){radio.checked=true;picked=radio.value;}});
  document.getElementById('bwImageResourceCancel').onclick=close;
  document.getElementById('bwImageResourceSelect').onclick=apply;
  document.getElementById('bwImageResourceImport').onclick=function(){fileInput.click();};
  fileInput.addEventListener('change',function(){var f=this.files&&this.files[0];this.value='';if(f)importImage(f);});
  backdrop.addEventListener('pointerdown',function(e){if(e.target===backdrop)close();});
  document.addEventListener('keydown',function(e){if(!backdrop.classList.contains('show'))return;if(e.key==='Escape')close();if(e.key==='Enter'&&document.activeElement!==searchInput){e.preventDefault();apply();}});
}

function currentChoice(el){
  if(!el)return mode==='background'?'none':'default_image';
  if(mode==='background')return el.dataset.backgroundResource||'none';
  return el.dataset.imageResource||'default_image';
}

function open(which){
  build();
  mode=which==='background'?'background':'image';
  var el=selected();
  if(!el){notify('Selecione um widget primeiro');return;}
  if(mode==='image'&&el.dataset.type!=='image'){notify('Selecione um Image primeiro');return;}
  titleEl.textContent=mode==='image'?'Image':'Background resource';
  picked=currentChoice(el);
  searchInput.value='';
  render();
  backdrop.classList.add('show');
  setTimeout(function(){searchInput.focus({preventScroll:true});},35);
}
function close(){if(backdrop)backdrop.classList.remove('show');}

function render(){
  if(!listEl)return;
  var q=String(searchInput.value||'').trim().toLowerCase();
  var arr=images().filter(function(a){return !q||String(a.name||'').toLowerCase().indexOf(q)>=0;});
  var html='';
  if(mode==='background'&&(!q||'none'.indexOf(q)>=0)){
    html+='<label class="bw-image-option"><input type="radio" name="bwImageResourceChoice" value="none" '+(picked==='none'?'checked':'')+'><span class="bw-image-radio"></span><span class="bw-image-name"><b>none</b><small>Remove background image</small></span><div class="bw-image-thumb">×</div></label>';
  }
  if(!q||'default_image'.indexOf(q)>=0){
    html+='<label class="bw-image-option"><input type="radio" name="bwImageResourceChoice" value="default_image" '+(picked==='default_image'?'checked':'')+'><span class="bw-image-radio"></span><span class="bw-image-name"><b>default_image</b><small>Built-in image resource</small></span>'+defaultThumb()+'</label>';
  }
  arr.forEach(function(a){
    html+='<label class="bw-image-option"><input type="radio" name="bwImageResourceChoice" value="'+esc(a.id)+'" '+(picked===a.id?'checked':'')+'><span class="bw-image-radio"></span><span class="bw-image-name"><b>'+esc(a.name||'image')+'</b><small>Image Manager</small></span><div class="bw-image-thumb"><img src="'+esc(a.data)+'" alt=""></div></label>';
  });
  if(!html)html='<div class="bw-image-empty">Nenhuma imagem encontrada.</div>';
  listEl.innerHTML=html;
}

function importImage(file){
  if(!file.type||file.type.indexOf('image/')!==0){notify('Selecione um arquivo de imagem');return;}
  if(file.size>MAX_FILE){notify('Imagem grande demais (máx. 1.5 MB)');return;}
  var r=new FileReader();
  r.onload=function(){
    var cfg=readConfig();cfg.assets=Array.isArray(cfg.assets)?cfg.assets:[];
    var id='asset-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    cfg.assets.push({id:id,kind:'image',name:file.name,type:file.type,size:file.size,data:r.result,createdAt:Date.now()});
    if(writeConfig(cfg)){picked=id;render();notify(file.name+' importado');}
  };
  r.readAsDataURL(file);
}

function assetById(id){return images().find(function(a){return a.id===id;})||null;}
function setImage(el,choice){
  var t=typeof contentTarget==='function'?contentTarget(el):null;if(!t)return false;
  t.innerHTML='';
  if(choice==='default_image'){
    el.dataset.imageResource='default_image';
    var placeholder=document.createElement('div');placeholder.style.cssText='width:100%;height:100%;display:grid;place-items:center;font-size:24px;color:#7890a2;background:#dbe5ed';placeholder.textContent='▧';t.appendChild(placeholder);
    return true;
  }
  var a=assetById(choice);if(!a)return false;
  el.dataset.imageResource=a.id;
  el.dataset.imageResourceName=a.name||'';
  var img=document.createElement('img');img.src=a.data;img.alt=a.name||'';img.style.cssText='width:100%;height:100%;display:block;object-fit:'+(el.dataset.scaleType||'cover')+';';t.appendChild(img);
  return true;
}
function setBackground(el,choice){
  var t=typeof contentTarget==='function'?contentTarget(el):null;if(!t)return false;
  if(choice==='none'){
    el.dataset.backgroundResource='none';delete el.dataset.backgroundResourceName;
    t.style.removeProperty('background-image');t.style.removeProperty('background-size');t.style.removeProperty('background-position');t.style.removeProperty('background-repeat');
    return true;
  }
  if(choice==='default_image'){
    el.dataset.backgroundResource='default_image';
    t.style.backgroundImage='linear-gradient(135deg,#dbe5ed,#aab9c5)';t.style.backgroundSize='cover';t.style.backgroundPosition='center';t.style.backgroundRepeat='no-repeat';
    return true;
  }
  var a=assetById(choice);if(!a)return false;
  el.dataset.backgroundResource=a.id;el.dataset.backgroundResourceName=a.name||'';
  t.style.backgroundImage='url("'+String(a.data).replace(/"/g,'%22')+'")';t.style.backgroundSize='cover';t.style.backgroundPosition='center';t.style.backgroundRepeat='no-repeat';
  return true;
}
function apply(){
  var el=selected();if(!el){close();return;}
  var radio=listEl.querySelector('input[name="bwImageResourceChoice"]:checked');if(radio)picked=radio.value;
  var ok=mode==='image'?setImage(el,picked):setBackground(el,picked);
  if(!ok){notify('Esse recurso não está mais disponível');return;}
  if(typeof commit==='function')commit();
  if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  close();notify(mode==='image'?'Imagem aplicada':'Background aplicado');
}

function ensureButtons(){
  var wrap=document.querySelector('.quick-properties');if(!wrap)return;
  imageBtn=wrap.querySelector('[data-quick="image-resource"]');
  if(!imageBtn){
    imageBtn=document.createElement('button');imageBtn.className='quick-card';imageBtn.dataset.quick='image-resource';imageBtn.innerHTML='<b>▧</b><span>Image</span>';
    var lg=wrap.querySelector('[data-quick="layout-gravity"]');
    if(lg&&lg.nextSibling)wrap.insertBefore(imageBtn,lg.nextSibling);else wrap.appendChild(imageBtn);
  }
  bgBtn=wrap.querySelector('[data-quick="background-resource"]');
  if(!bgBtn){
    bgBtn=document.createElement('button');bgBtn.className='quick-card';bgBtn.dataset.quick='background-resource';bgBtn.innerHTML='<b>◌</b><span>Background resource</span>';
    if(imageBtn.nextSibling)wrap.insertBefore(bgBtn,imageBtn.nextSibling);else wrap.appendChild(bgBtn);
  }
  imageBtn.onclick=function(e){e.preventDefault();e.stopPropagation();open('image');};
  bgBtn.onclick=function(e){e.preventDefault();e.stopPropagation();open('background');};
  syncButtons();
}
function syncButtons(){
  if(!imageBtn)return;
  var el=selected();imageBtn.classList.toggle('bw-hidden',!(el&&el.dataset.type==='image'));
}
function wrapSelection(){
  if(typeof window.selectNode!=='function'||window.selectNode.__bwImageResourceWrapped)return;
  var base=window.selectNode;
  var wrapped=function(){var r=base.apply(this,arguments);setTimeout(syncButtons,0);return r;};
  wrapped.__bwImageResourceWrapped=true;window.selectNode=wrapped;
}
function install(){build();ensureButtons();wrapSelection();syncButtons();}

window.BrotwareImageResourceDialog={openImage:function(){open('image');},openBackground:function(){open('background');},close:close};
setTimeout(install,0);setTimeout(install,280);setTimeout(install,1000);
document.addEventListener('pointerup',function(e){if(e.target&&e.target.closest&&e.target.closest('.vf-node'))setTimeout(syncButtons,0);},true);
})();
