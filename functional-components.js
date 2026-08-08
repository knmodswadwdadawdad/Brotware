(function(){
'use strict';

var CATALOG=[
  {type:'requestNetwork',name:'RequestNetwork',icon:'wifi',desc:'HTTP / API requests',lib:'web'},
  {type:'timer',name:'Timer',icon:'timer',desc:'Timers and delays',lib:'web'},
  {type:'dialog',name:'Dialog',icon:'chat_bubble',desc:'Alert, confirm and prompt',lib:'web'},
  {type:'filePicker',name:'FilePicker',icon:'draft',desc:'Choose files from device',lib:'web'},
  {type:'notification',name:'Notification',icon:'notifications',desc:'Browser notifications',lib:'notifications'},
  {type:'location',name:'LocationManager',icon:'location_on',desc:'Current device location',lib:'web'},
  {type:'textToSpeech',name:'TextToSpeech',icon:'volume_up',desc:'Speak text aloud',lib:'speech'},
  {type:'speechToText',name:'SpeechToText',icon:'mic',desc:'Convert speech to text',lib:'speech'},
  {type:'clipboard',name:'Clipboard',icon:'content_copy',desc:'Copy text to clipboard',lib:'web'},
  {type:'camera',name:'Camera',icon:'photo_camera',desc:'Camera / media access',lib:'speech'}
];
var LIBS=[
  {id:'web',name:'Web APIs',icon:'language',desc:'Network, files, location, timer and clipboard',fixed:true},
  {id:'notifications',name:'Notifications / PWA',icon:'notifications_active',desc:'Browser notification features'},
  {id:'speech',name:'Speech & Media',icon:'mic',desc:'Speech synthesis, recognition and camera'},
  {id:'firebase',name:'Firebase',icon:'local_fire_department',desc:'Firebase Database and Authentication',planned:true},
  {id:'maps',name:'Google Maps',icon:'map',desc:'Google Maps components',planned:true}
];
var BLOCKS={
  fcRequest:{componentType:'requestNetwork',name:'Request Network',icon:'wifi',fields:[['component','Component','component'],['method','Method','method'],['url','URL','text'],['body','Body','text'],['saveVar','Save response in','variable']]},
  fcTimerWait:{componentType:'timer',name:'Timer wait',icon:'timer',fields:[['component','Component','component'],['ms','Milliseconds','number']]},
  fcDialog:{componentType:'dialog',name:'Show Dialog',icon:'chat_bubble',fields:[['component','Component','component'],['mode','Mode','dialogMode'],['message','Message','text'],['saveVar','Save result in','variable']]},
  fcFilePick:{componentType:'filePicker',name:'Pick File',icon:'draft',fields:[['component','Component','component'],['accept','Accept','text'],['saveVar','Save file info in','variable']]},
  fcNotify:{componentType:'notification',name:'Show Notification',icon:'notifications',fields:[['component','Component','component'],['title','Title','text'],['message','Message','text']]},
  fcLocation:{componentType:'location',name:'Get Location',icon:'location_on',fields:[['component','Component','component'],['saveVar','Save location in','variable']]},
  fcSpeak:{componentType:'textToSpeech',name:'Speak Text',icon:'volume_up',fields:[['component','Component','component'],['text','Text','text']]},
  fcListen:{componentType:'speechToText',name:'Listen Speech',icon:'mic',fields:[['component','Component','component'],['saveVar','Save text in','variable']]},
  fcClipboard:{componentType:'clipboard',name:'Copy Clipboard',icon:'content_copy',fields:[['component','Component','component'],['text','Text','text']]}
};
var addBack=null,libBack=null,search=null,grid=null,observer=null,queued=false;

function ensureState(){
  if(!Array.isArray(state.functionalComponents))state.functionalComponents=[];
  if(!state.libraryManager||typeof state.libraryManager!=='object')state.libraryManager={};
  if(state.libraryManager.web!==true)state.libraryManager.web=true;
  if(state.libraryManager.notifications==null)state.libraryManager.notifications=false;
  if(state.libraryManager.speech==null)state.libraryManager.speech=true;
  if(state.libraryManager.firebase==null)state.libraryManager.firebase=false;
  if(state.libraryManager.maps==null)state.libraryManager.maps=false;
}
function icon(name){return '<span class="bw-google-icon">'+esc(name)+'</span>';}
function cat(type){for(var i=0;i<CATALOG.length;i++)if(CATALOG[i].type===type)return CATALOG[i];return null;}
function blockDef(type){return BLOCKS[type]||null;}
function componentsOf(type){ensureState();return state.functionalComponents.filter(function(c){return c.type===type;});}
function uniqueName(type){var c=cat(type),base=(c?c.name:type).replace(/[^a-zA-Z0-9]/g,'').toLowerCase(),n=1,name=base+n;var used={};state.functionalComponents.forEach(function(x){used[x.name]=1;});while(used[name])name=base+(++n);return name;}
function enabledLib(id){ensureState();return id==='web'||state.libraryManager[id]===true;}
function addComponent(type){
  ensureState();var c=cat(type);if(!c)return;
  if(!enabledLib(c.lib)){toast('Ative '+c.lib+' no Library Manager primeiro');openLibrary();return;}
  var item={id:uid('fc'),type:type,name:uniqueName(type),config:{}};state.functionalComponents.push(item);autoSave();renderInstalled();refreshLogicPalette();toast(c.name+' adicionado');
}
function removeComponent(id){ensureState();state.functionalComponents=state.functionalComponents.filter(function(c){return c.id!==id;});autoSave();renderInstalled();refreshLogicPalette();}
function componentOptions(type,selected){var a=componentsOf(type),h='<option value="">Selecione</option>';a.forEach(function(c){h+='<option value="'+esc(c.id)+'" '+(c.id===selected?'selected':'')+'>'+esc(c.name)+'</option>';});return h;}
function variableOptionsLocal(selected){var h='<option value="">Selecione</option>';Object.keys(state.variables||{}).forEach(function(k){h+='<option value="'+esc(k)+'" '+(k===selected?'selected':'')+'>'+esc(k)+'</option>';});return h;}

function buildPanel(){
  var main=document.querySelector('#screen-component .components-main');if(!main||document.getElementById('bwFunctionalComponentsPanel'))return;
  var p=document.createElement('section');p.id='bwFunctionalComponentsPanel';p.className='bw-fc-panel';p.innerHTML='<div class="bw-fc-head"><div><strong>Functional Components</strong><small>Recursos prontos para usar na Lógica sem escrever JavaScript</small></div><span class="spacer"></span><button id="bwLibraryManagerBtn">Library Manager</button><button class="primary" id="bwAddFunctionalBtn">＋ Add component</button></div><div class="bw-fc-installed" id="bwFunctionalInstalled"></div>';
  main.insertBefore(p,main.firstChild);document.getElementById('bwAddFunctionalBtn').onclick=openAdd;document.getElementById('bwLibraryManagerBtn').onclick=openLibrary;renderInstalled();
}
function renderInstalled(){
  ensureState();var box=document.getElementById('bwFunctionalInstalled');if(!box)return;
  if(!state.functionalComponents.length){box.innerHTML='<div class="bw-fc-empty">Nenhum componente funcional adicionado.<br>Use <b>Add component</b> para liberar recursos prontos na aba Lógica.</div>';return;}
  box.innerHTML=state.functionalComponents.map(function(c){var d=cat(c.type)||{name:c.type,icon:'extension'};return '<div class="bw-fc-instance"><span class="icon">'+icon(d.icon)+'</span><span><b>'+esc(c.name)+'</b><small>'+esc(d.name)+'</small></span><button class="delete" data-fc-del="'+esc(c.id)+'">×</button></div>';}).join('');
}
function buildDialogs(){
  if(addBack)return;
  addBack=document.createElement('div');addBack.id='bwFunctionalAdd';addBack.className='bw-fc-backdrop';addBack.innerHTML='<section class="bw-fc-dialog"><header class="bw-fc-titlebar"><span class="grab"></span><div><h2>Add component</h2><small>Escolha uma funcionalidade pronta</small></div><button class="close" data-fc-close="add">×</button></header><div class="bw-fc-search"><input id="bwFcSearch" placeholder="Search components..."></div><main class="bw-fc-grid" id="bwFcGrid"></main></section>';document.body.appendChild(addBack);
  search=document.getElementById('bwFcSearch');grid=document.getElementById('bwFcGrid');search.oninput=renderCatalog;grid.onclick=function(e){var b=e.target.closest('[data-fc-add]');if(!b)return;addComponent(b.dataset.fcAdd);closeAdd();};addBack.onclick=function(e){if(e.target===addBack)closeAdd();};
  libBack=document.createElement('div');libBack.id='bwLibraryManager';libBack.className='bw-fc-backdrop';libBack.innerHTML='<section class="bw-fc-dialog library"><header class="bw-fc-titlebar"><span class="grab"></span><div><h2>Library Manager</h2><small>Ative recursos disponíveis para o projeto</small></div><button class="close" data-fc-close="lib">×</button></header><main class="bw-lib-body" id="bwLibBody"></main></section>';document.body.appendChild(libBack);libBack.onclick=function(e){if(e.target===libBack)closeLibrary();};
  document.addEventListener('click',function(e){var x=e.target.closest('[data-fc-close]');if(!x)return;x.dataset.fcClose==='add'?closeAdd():closeLibrary();var d=e.target.closest('[data-fc-del]');if(d)removeComponent(d.dataset.fcDel);},true);
}
function renderCatalog(){ensureState();var q=String(search&&search.value||'').trim().toLowerCase(),a=CATALOG.filter(function(c){return !q||(c.name+' '+c.desc).toLowerCase().indexOf(q)>=0;});grid.innerHTML=a.map(function(c){var en=enabledLib(c.lib);return '<button type="button" class="bw-fc-card'+(en?'':' disabled')+'" data-fc-add="'+esc(c.type)+'"><span class="big-icon">'+icon(c.icon)+'</span><span><b>'+esc(c.name)+'</b><small>'+esc(c.desc)+'</small>'+(en?'':'<i class="lock">Library OFF</i>')+'</span></button>';}).join('');}
function renderLibraries(){ensureState();var body=document.getElementById('bwLibBody');if(!body)return;body.innerHTML='<div class="bw-lib-section">Built-in / Web</div><div class="bw-lib-card">'+LIBS.slice(0,3).map(libRow).join('')+'</div><div class="bw-lib-section">External libraries</div><div class="bw-lib-card">'+LIBS.slice(3).map(libRow).join('')+'</div>';body.querySelectorAll('[data-lib-toggle]').forEach(function(i){i.onchange=function(){state.libraryManager[this.dataset.libToggle]=this.checked;autoSave();renderLibraries();renderCatalog();refreshLogicPalette();};});}
function libRow(l){var on=enabledLib(l.id),disabled=l.fixed||l.planned;return '<label class="bw-lib-row"><span class="li">'+icon(l.icon)+'<small>'+(on?'ON':'OFF')+'</small></span><span><b>'+esc(l.name)+'</b><p>'+esc(l.desc)+(l.planned?' · suporte em expansão':'')+'</p></span><input class="bw-lib-toggle" type="checkbox" data-lib-toggle="'+l.id+'" '+(on?'checked':'')+' '+(disabled?'disabled':'')+'></label>';}
function openAdd(){buildDialogs();search.value='';renderCatalog();addBack.classList.add('show');}
function closeAdd(){if(addBack)addBack.classList.remove('show');}
function openLibrary(){buildDialogs();renderLibraries();libBack.classList.add('show');}
function closeLibrary(){if(libBack)libBack.classList.remove('show');}

/* Logic block registration */
var baseNewBlock=window.newBlock;
window.newBlock=function(type){
  var d=blockDef(type);if(!d)return baseNewBlock(type);
  var first=componentsOf(d.componentType)[0];var p={component:first?first.id:''};
  if(type==='fcRequest'){p.method='GET';p.url='';p.body='';p.saveVar='';}
  else if(type==='fcTimerWait')p.ms='1000';
  else if(type==='fcDialog'){p.mode='alert';p.message='Olá';p.saveVar='';}
  else if(type==='fcFilePick'){p.accept='*/*';p.saveVar='';}
  else if(type==='fcNotify'){p.title='Brotware';p.message='Notificação';}
  else if(type==='fcLocation')p.saveVar='';
  else if(type==='fcSpeak')p.text='Olá';
  else if(type==='fcListen')p.saveVar='';
  else if(type==='fcClipboard')p.text='Texto';
  return{id:uid('block'),type:type,props:p,children:[],elseChildren:[],inputs:{},__swCategory:'component'};
};
Object.keys(BLOCKS).forEach(function(k){BLOCK_META[k]={name:BLOCKS[k].name,icon:BLOCKS[k].icon,cls:'component'};});

var baseOpenBlockEditor=window.openBlockEditor,baseSaveBlockEditor=window.saveBlockEditor;
function customField(label,id,value,type,def){
  if(type==='component')return '<label class="field span-2"><span>'+label+'</span><select id="'+id+'">'+componentOptions(def.componentType,value)+'</select></label>';
  if(type==='variable')return '<label class="field span-2"><span>'+label+'</span><select id="'+id+'">'+variableOptionsLocal(value)+'</select></label>';
  if(type==='method')return '<label class="field"><span>'+label+'</span><select id="'+id+'"><option '+(value==='GET'?'selected':'')+'>GET</option><option '+(value==='POST'?'selected':'')+'>POST</option><option '+(value==='PUT'?'selected':'')+'>PUT</option><option '+(value==='DELETE'?'selected':'')+'>DELETE</option></select></label>';
  if(type==='dialogMode')return '<label class="field"><span>'+label+'</span><select id="'+id+'"><option value="alert" '+(value==='alert'?'selected':'')+'>Alert</option><option value="confirm" '+(value==='confirm'?'selected':'')+'>Confirm</option><option value="prompt" '+(value==='prompt'?'selected':'')+'>Prompt</option></select></label>';
  return '<label class="field '+(type==='text'?'span-2':'')+'"><span>'+label+'</span><input id="'+id+'" type="'+(type==='number'?'number':'text')+'" value="'+esc(value==null?'':value)+'"></label>';
}
window.openBlockEditor=function(id){var f=findBlock(id);if(!f||!blockDef(f.block.type))return baseOpenBlockEditor(id);var b=f.block,d=blockDef(b.type),p=b.props||{};state.editingBlockId=id;$('#blockModalTitle').textContent=d.name;$('#blockModalSubtitle').textContent='Functional Component';var h='<div class="block-config-grid">';d.fields.forEach(function(x){h+=customField(x[1],'fc_'+x[0],p[x[0]],x[2],d);});h+='</div>';$('#blockEditorFields').innerHTML=h;openModal('blockModal');};
window.saveBlockEditor=function(){var f=findBlock(state.editingBlockId);if(!f||!blockDef(f.block.type))return baseSaveBlockEditor();var b=f.block,d=blockDef(b.type);d.fields.forEach(function(x){var e=document.getElementById('fc_'+x[0]);if(e)b.props[x[0]]=e.value;});closeModal('blockModal');saveLogic();renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();};

function refreshLogicPalette(){
  var ov=document.getElementById('swLogicOverlay'),scroll=document.getElementById('swPaletteScroll');if(!ov||!scroll)return;
  var active=ov.querySelector('.sw-cat.active'),catId=active&&active.dataset.swCat;var old=scroll.querySelector('.bw-fc-logic-pack');if(old)old.remove();if(catId!=='component')return;
  var available=Object.keys(BLOCKS).filter(function(k){return componentsOf(BLOCKS[k].componentType).length>0;});if(!available.length)return;
  var wrap=document.createElement('div');wrap.className='bw-fc-logic-pack';wrap.innerHTML='<div class="bw-fc-logic-title">Functional Components</div>'+available.map(function(k){var d=BLOCKS[k];return '<button type="button" class="sw-palette-item sw-standard-item" data-sw-standard-type="'+k+'" style="--item-color:#2ca5e2"><span class="ico">'+icon(d.icon)+'</span><span><b>'+esc(d.name)+'</b><small>'+esc(d.componentType)+'</small></span></button>';}).join('');scroll.appendChild(wrap);
}
function installLogicObserver(){var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(installLogicObserver,250);return;}if(ov.dataset.bwFcObs==='1')return;ov.dataset.bwFcObs='1';observer=new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refreshLogicPalette();});});observer.observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});ov.addEventListener('click',function(){setTimeout(refreshLogicPalette,0);},true);refreshLogicPalette();}

/* Editor runtime */
var baseExecuteBlocks=window.executeBlocks;
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i],p=b.props||{};
    if(!blockDef(b.type)){await baseExecuteBlocks([b],ctx);continue;}
    if(b.type==='fcRequest'){
      try{var o={method:p.method||'GET',headers:{}};if(o.method!=='GET'&&o.method!=='HEAD'&&p.body)o.body=String(resolveValue(p.body,ctx));var r=await fetch(String(resolveValue(p.url,ctx)||''),o),text=await r.text(),data=text;try{data=JSON.parse(text);}catch(_){}if(p.saveVar)ctx.vars[p.saveVar]=data;}catch(e){if(p.saveVar)ctx.vars[p.saveVar]=null;console.error(e);}
    }else if(b.type==='fcTimerWait')await new Promise(function(res){setTimeout(res,Math.max(0,Math.min(60000,Number(resolveValue(p.ms,ctx))||0)));});
    else if(b.type==='fcDialog'){var msg=String(resolveValue(p.message,ctx)||''),v=p.mode==='confirm'?confirm(msg):p.mode==='prompt'?prompt(msg,''):alert(msg);if(p.saveVar&&p.mode!=='alert')ctx.vars[p.saveVar]=v;}
    else if(b.type==='fcFilePick'){
      var inp=document.createElement('input');inp.type='file';inp.accept=p.accept||'*/*';inp.style.display='none';document.body.appendChild(inp);var file=await new Promise(function(res){inp.onchange=function(){res(inp.files&&inp.files[0]||null);};inp.click();});if(p.saveVar)ctx.vars[p.saveVar]=file?{name:file.name,size:file.size,type:file.type}:null;inp.remove();
    }else if(b.type==='fcNotify'){var title=String(resolveValue(p.title,ctx)||'Notification'),body=String(resolveValue(p.message,ctx)||'');if('Notification'in window){if(Notification.permission==='default')await Notification.requestPermission();if(Notification.permission==='granted')new Notification(title,{body:body});else toast(title+': '+body);}else toast(title+': '+body);}
    else if(b.type==='fcLocation'){var pos=await new Promise(function(res,rej){if(!navigator.geolocation)return rej(new Error('Geolocation unavailable'));navigator.geolocation.getCurrentPosition(res,rej);}).catch(function(){return null;});if(p.saveVar)ctx.vars[p.saveVar]=pos?{latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy}:null;}
    else if(b.type==='fcSpeak'){if('speechSynthesis'in window){var u=new SpeechSynthesisUtterance(String(resolveValue(p.text,ctx)||''));speechSynthesis.speak(u);}}
    else if(b.type==='fcListen'){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){var rec=new SR();var txt=await new Promise(function(res){rec.onresult=function(e){res(e.results[0][0].transcript);};rec.onerror=function(){res('');};rec.start();});if(p.saveVar)ctx.vars[p.saveVar]=txt;}else if(p.saveVar)ctx.vars[p.saveVar]='';}
    else if(b.type==='fcClipboard'){try{await navigator.clipboard.writeText(String(resolveValue(p.text,ctx)||''));}catch(_){} }
  }
};

/* Exported-page runtime */
var baseRuntime=window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=baseRuntime(page),needle="else if(b.type==='fetch'){";
  var ext="else if(b.type==='fcRequest'){try{var fo={method:p.method||'GET',headers:{}};if(fo.method!=='GET'&&fo.method!=='HEAD'&&p.body)fo.body=String(rv(p.body));var fr=await fetch(String(rv(p.url)||''),fo),ft=await fr.text(),fd=ft;try{fd=JSON.parse(ft)}catch(_){}if(p.saveVar)vars[p.saveVar]=fd}catch(e){if(p.saveVar)vars[p.saveVar]=null}}"+
  ";else if(b.type==='fcTimerWait')await new Promise(function(r){setTimeout(r,Math.max(0,Math.min(60000,Number(rv(p.ms))||0)))})"+
  ";else if(b.type==='fcDialog'){var fm=String(rv(p.message)||''),fv=p.mode==='confirm'?confirm(fm):p.mode==='prompt'?prompt(fm,''):alert(fm);if(p.saveVar&&p.mode!=='alert')vars[p.saveVar]=fv}"+
  ";else if(b.type==='fcNotify'){var fnt=String(rv(p.title)||'Notification'),fnb=String(rv(p.message)||'');if('Notification'in window){if(Notification.permission==='default')await Notification.requestPermission();if(Notification.permission==='granted')new Notification(fnt,{body:fnb})}}"+
  ";else if(b.type==='fcLocation'){var fp=await new Promise(function(rs,rj){if(!navigator.geolocation)return rj();navigator.geolocation.getCurrentPosition(rs,rj)}).catch(function(){return null});if(p.saveVar)vars[p.saveVar]=fp?{latitude:fp.coords.latitude,longitude:fp.coords.longitude,accuracy:fp.coords.accuracy}:null}"+
  ";else if(b.type==='fcSpeak'){if('speechSynthesis'in window)speechSynthesis.speak(new SpeechSynthesisUtterance(String(rv(p.text)||''))}"+
  ";else if(b.type==='fcListen'){var FSR=window.SpeechRecognition||window.webkitSpeechRecognition;if(FSR){var frec=new FSR(),ftext=await new Promise(function(rs){frec.onresult=function(e){rs(e.results[0][0].transcript)};frec.onerror=function(){rs('')};frec.start()});if(p.saveVar)vars[p.saveVar]=ftext}}"+
  ";else if(b.type==='fcClipboard'){try{await navigator.clipboard.writeText(String(rv(p.text)||''))}catch(_){}};";
  return code.indexOf(needle)>=0?code.replace(needle,ext+needle):code;
};

function install(){ensureState();buildDialogs();buildPanel();renderInstalled();installLogicObserver();}
setTimeout(install,0);setTimeout(install,600);setTimeout(install,1500);
window.BrotwareFunctionalComponents={catalog:CATALOG,libraries:LIBS,add:addComponent,remove:removeComponent,openAdd:openAdd,openLibrary:openLibrary,refresh:function(){ensureState();buildPanel();renderInstalled();refreshLogicPalette();}};
})();
