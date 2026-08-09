(function(){
'use strict';

var overlay=null,paletteScroll=null,toolbar=null,dialogBack=null;
var observer=null,selectedBlockId='',selectedAt=0,renderingTools=false,wasOpen=false;
var baseOpenBlockEditor=window.openBlockEditor;
var EVENT_LABELS={load:'onCreate',imports:'Import',initializeLogic:'initializeLogic',activityResult:'onActivityResult',back:'onBackPressed',postcreate:'onPostCreate',start:'onStart',resume:'onResume',pause:'onPause',stop:'onStop',destroy:'onDestroy',saveInstanceState:'onSaveInstanceState',restoreInstanceState:'onRestoreInstanceState',newIntent:'onNewIntent',windowFocusChanged:'onWindowFocusChanged',click:'onClick',longclick:'onLongClick',dblclick:'onDoubleClick',input:'onInput',change:'onChange',focus:'onFocus',blur:'onBlur',keydown:'onKeyDown',keyup:'onKeyUp',mouseenter:'onMouseEnter',mouseleave:'onMouseLeave',submit:'onSubmit'};
var TYPE_NAMES={button:'Button',text:'TextView',input:'EditText',textarea:'EditText',image:'ImageView',link:'TextView',checkbox:'CheckBox',select:'Spinner',progress:'ProgressBar',divider:'View','linear-h':'LinearLayout','linear-v':'LinearLayout',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView',grid:'GridLayout',stack:'FrameLayout'};

function icon(n){return'<span class="bw-google-icon">'+n+'</span>';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function mobile(){return window.matchMedia('(max-width:760px)').matches;}
function currentPageSafe(){try{return typeof currentPage==='function'?currentPage():null;}catch(_){return null;}}
function eventNode(){try{return typeof currentEventNode==='function'?currentEventNode():'@page';}catch(_){return'@page';}}
function eventType(){try{return typeof currentEventType==='function'?currentEventType():'load';}catch(_){return'load';}}
function save(){try{if(typeof saveLogic==='function')saveLogic();else if(typeof autoSave==='function')autoSave();}catch(e){console.error(e);}}
function redraw(){try{if(window.BrotwareSketchLogic&&typeof BrotwareSketchLogic.render==='function')BrotwareSketchLogic.render();}catch(e){console.error(e);}setTimeout(refreshVariableTools,0);}
function notify(msg){try{if(typeof toast==='function'){toast(msg);return;}}catch(_){}console.log(msg);}

function decorateTop(){
  if(!overlay)return;
  var map={swLogicBack:'arrow_back',swLogicCode:'code',swLogicUndo:'undo',swLogicRedo:'redo',swLogicBookmark:'bookmark_border',swPaletteToggle:'extension'};
  Object.keys(map).forEach(function(id){var b=document.getElementById(id);if(b&&!b.querySelector('.bw-google-icon'))b.innerHTML=icon(map[id]);});
  var cats={var:'Variable',list:'List',control:'Control',operator:'Operator',math:'Math',file:'File',view:'View',component:'Component',strings:'XML Strings',more:'More Block'};
  overlay.querySelectorAll('.sw-cat[data-sw-cat]').forEach(function(b){if(cats[b.dataset.swCat])b.textContent=cats[b.dataset.swCat];});
}
function refreshHeader(){
  if(!overlay||!overlay.classList.contains('show'))return;var title=document.getElementById('swLogicTitle'),sub=document.getElementById('swLogicDesc');if(!title||!sub)return;
  try{
    if(typeof state!=='undefined'&&state.logicMode==='function'){
      var f=(state.functions||[]).find(function(x){return x.id===state.activeFunctionId;});title.textContent=f?f.name:'MoreBlock';sub.textContent='MoreBlock';return;
    }
  }catch(_){}
  var n=eventNode(),e=eventType();title.textContent=n==='@page'?'Activity':n;sub.textContent=EVENT_LABELS[e]||e;
}

function variableType(name,value){
  var p=currentPageSafe(),m=p&&p.variableTypes&&p.variableTypes[name];if(m)return String(m).toLowerCase();
  if(Array.isArray(value))return'list';if(value!==null&&typeof value==='object')return'map';if(typeof value==='boolean')return'boolean';if(typeof value==='number')return'number';return'string';
}
function views(){
  var out=[];try{if(typeof root==='undefined'||!root)return out;root.querySelectorAll('.vf-node[data-vf-id]').forEach(function(n){out.push({id:n.dataset.vfId,type:TYPE_NAMES[n.dataset.type]||'View'});});}catch(_){}return out;
}
function variableSignature(){
  var vars=(typeof state!=='undefined'&&state.variables)||{};return Object.keys(vars).map(function(k){return k+':'+variableType(k,vars[k]);}).join('|')+'//'+views().map(function(v){return v.type+':'+v.id;}).join('|');
}
function paletteCategory(){var a=overlay&&overlay.querySelector('.sw-cat.active[data-sw-cat]');return a?a.dataset.swCat:'';}
function refreshVariableTools(){
  if(renderingTools||!paletteScroll)return;renderingTools=true;try{
    var old=paletteScroll.querySelector('.sw4-var-tools-wrap'),cat=paletteCategory();if(cat!=='var'){if(old)old.remove();return;}
    var sig=variableSignature();if(old&&old.dataset.sig===sig)return;if(old)old.remove();
    var vars=(typeof state!=='undefined'&&state.variables)||{},vv=views(),html='<div class="sw4-var-tools"><button type="button" data-sw4-var-action="add">Add variable</button><button type="button" data-sw4-var-action="custom">Add custom variable</button><button type="button" data-sw4-var-action="remove">Remove variable</button></div>';
    var names=Object.keys(vars);if(names.length){html+='<div class="sw4-palette-group"><div class="sw4-palette-group-title">Variables</div><div class="sw4-chip-list">';names.forEach(function(n){var t=variableType(n,vars[n]);html+='<button type="button" class="sw4-chip '+esc(t)+'" data-sw4-var-chip="'+esc(n)+'">'+esc(n)+'</button>';});html+='</div></div>';}
    if(vv.length){html+='<div class="sw4-palette-group"><div class="sw4-palette-group-title">Views</div><div class="sw4-chip-list">';vv.forEach(function(v){html+='<button type="button" class="sw4-chip view" data-sw4-view-chip="'+esc(v.id)+'">'+esc(v.type)+': '+esc(v.id)+'</button>';});html+='</div></div>';}
    var wrap=document.createElement('div');wrap.className='sw4-var-tools-wrap';wrap.dataset.sig=sig;wrap.innerHTML=html;paletteScroll.insertBefore(wrap,paletteScroll.firstChild);
  }finally{renderingTools=false;}
}

function buildDialog(){
  if(dialogBack)return;dialogBack=document.createElement('div');dialogBack.id='sw4VarDialogBackdrop';dialogBack.className='sw4-var-dialog-backdrop';document.body.appendChild(dialogBack);
  dialogBack.addEventListener('click',function(e){if(e.target===dialogBack)closeDialog();var a=e.target.closest&&e.target.closest('[data-sw4-dialog-action]');if(a)runDialogAction(a.dataset.sw4DialogAction);});
  dialogBack.addEventListener('pointerdown',function(e){e.stopPropagation();},true);
}
function openDialog(html){buildDialog();dialogBack.innerHTML='<section class="sw4-var-dialog" role="dialog" aria-modal="true">'+html+'</section>';dialogBack.classList.add('show');setTimeout(function(){var i=dialogBack.querySelector('input[type="text"]');if(i)i.focus();},40);}
function closeDialog(){if(dialogBack)dialogBack.classList.remove('show');}
function openAddVariable(){
  openDialog('<h2>Add new variable</h2><div class="sw4-var-types">'+radio('boolean','Boolean',false)+radio('number','Number',true)+radio('string','String',false)+radio('map','Map',false)+'</div><div class="sw4-var-field"><input type="text" id="sw4VarName" placeholder="Enter variable name (Case-sensitive)" autocomplete="off"></div><footer class="sw4-var-dialog-foot"><button type="button" data-sw4-dialog-action="cancel">Cancel</button><button type="button" data-sw4-dialog-action="add-variable">Add</button></footer>');
}
function radio(v,label,checked){return'<label class="sw4-radio"><input type="radio" name="sw4VarType" value="'+v+'" '+(checked?'checked':'')+'><span>'+label+'</span></label>';}
function openCustomVariable(){
  openDialog('<h2>Add a new custom variable</h2><div class="sw4-var-field"><label>private, public or public static (optional)</label><input id="sw4CustomModifier" type="text" placeholder=""></div><div class="sw4-var-help">Enter modifier e.g. private, public, public static, or empty.</div><div class="sw4-var-field"><input id="sw4CustomType" type="text" placeholder="Type, e.g. File"></div><div class="sw4-var-field"><input id="sw4CustomName" type="text" placeholder="Name, e.g. file"></div><div class="sw4-var-field"><input id="sw4CustomInit" type="text" placeholder="Initializer, e.g. new File() (optional)"></div><footer class="sw4-var-dialog-foot"><button type="button" data-sw4-dialog-action="cancel">Cancel</button><button type="button" data-sw4-dialog-action="add-custom">Add</button></footer>');
}
function openRemoveVariable(){
  var vars=(typeof state!=='undefined'&&state.variables)||{},groups={boolean:[],number:[],string:[],map:[],list:[]};Object.keys(vars).forEach(function(n){var t=variableType(n,vars[n]);if(!groups[t])groups[t]=[];groups[t].push(n);});var html='<h2>Remove a variable</h2><div class="sw4-var-remove-list">',has=false;Object.keys(groups).forEach(function(t){if(!groups[t].length)return;has=true;html+='<div class="sw4-var-remove-group"><b>'+t.charAt(0).toUpperCase()+t.slice(1)+' ('+groups[t].length+')</b>';groups[t].forEach(function(n){html+='<label class="sw4-var-remove-row"><input type="checkbox" data-sw4-remove-var="'+esc(n)+'"><span>'+esc(n)+'</span></label>';});html+='</div>';});if(!has)html+='<div class="sw4-var-help">No variables to remove.</div>';html+='</div><footer class="sw4-var-dialog-foot"><button type="button" data-sw4-dialog-action="cancel">Cancel</button><button type="button" data-sw4-dialog-action="remove-selected">Remove</button></footer>';openDialog(html);
}
function validName(name){return/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);}
function variableChanged(){try{if(typeof renderVariables==='function')renderVariables();}catch(_){}try{if(typeof refreshStringOptions==='function')refreshStringOptions();}catch(_){}try{if(typeof autoSave==='function')autoSave();}catch(_){}refreshVariableTools();}
function runDialogAction(action){
  if(action==='cancel'){closeDialog();return;}
  if(action==='add-variable'){
    var n=(document.getElementById('sw4VarName')||{}).value||'';n=n.trim();var r=dialogBack.querySelector('input[name="sw4VarType"]:checked'),t=r?r.value:'number';if(!validName(n)){notify('Use a valid variable name');return;}state.variables=state.variables||{};if(Object.prototype.hasOwnProperty.call(state.variables,n)){notify('Variable already exists');return;}var val=t==='boolean'?false:t==='number'?0:t==='map'?{}:'';state.variables[n]=val;var p=currentPageSafe();if(p){p.variableTypes=p.variableTypes||{};p.variableTypes[n]=t;}closeDialog();variableChanged();return;
  }
  if(action==='add-custom'){
    var mod=(document.getElementById('sw4CustomModifier')||{}).value||'',type=(document.getElementById('sw4CustomType')||{}).value||'',name=(document.getElementById('sw4CustomName')||{}).value||'',init=(document.getElementById('sw4CustomInit')||{}).value||'';name=name.trim();if(!validName(name)){notify('Use a valid variable name');return;}if(!type.trim()){notify('Enter the custom type');return;}state.variables=state.variables||{};if(Object.prototype.hasOwnProperty.call(state.variables,name)){notify('Variable already exists');return;}state.variables[name]=init.trim()||null;var pg=currentPageSafe();if(pg){pg.customVariables=pg.customVariables||[];pg.customVariables.push({modifier:mod.trim(),type:type.trim(),name:name,initializer:init.trim()});pg.variableTypes=pg.variableTypes||{};pg.variableTypes[name]='custom';}closeDialog();variableChanged();return;
  }
  if(action==='remove-selected'){
    var checked=dialogBack.querySelectorAll('[data-sw4-remove-var]:checked');if(!checked.length){closeDialog();return;}var pg2=currentPageSafe();checked.forEach(function(c){var n=c.dataset.sw4RemoveVar;delete state.variables[n];if(pg2&&pg2.variableTypes)delete pg2.variableTypes[n];if(pg2&&Array.isArray(pg2.customVariables))pg2.customVariables=pg2.customVariables.filter(function(x){return x.name!==n;});});closeDialog();variableChanged();return;
  }
}

function buildToolbar(){
  if(toolbar||!overlay)return;toolbar=document.createElement('div');toolbar.className='sw4-block-toolbar';toolbar.innerHTML='<button type="button" data-sw4-block-action="delete">'+icon('backspace')+'<span>Delete</span></button><button type="button" data-sw4-block-action="duplicate">'+icon('content_copy')+'<span>Duplicate</span></button><button type="button" data-sw4-block-action="collection">'+icon('bookmark_border')+'<span>Collection</span></button>';overlay.querySelector('.sw-editor-area').appendChild(toolbar);toolbar.addEventListener('click',function(e){var b=e.target.closest('[data-sw4-block-action]');if(b)blockAction(b.dataset.sw4BlockAction);});
}
function clearSelected(){selectedBlockId='';selectedAt=0;if(toolbar)toolbar.classList.remove('show');if(overlay)overlay.querySelectorAll('.sw-block.sw4-selected').forEach(function(b){b.classList.remove('sw4-selected');});}
function selectBlock(id){
  buildToolbar();selectedBlockId=id;selectedAt=Date.now();overlay.querySelectorAll('.sw-block.sw4-selected').forEach(function(b){b.classList.remove('sw4-selected');});var el=overlay.querySelector('.sw-block[data-block-id="'+String(id).replace(/(["\\])/g,'\\$1')+'"]');if(el)el.classList.add('sw4-selected');toolbar.classList.add('show');
}
function cloneBlock(b){var c=JSON.parse(JSON.stringify(b));function regen(x){if(!x||typeof x!=='object')return;x.id='block-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);(x.children||[]).forEach(regen);(x.elseChildren||[]).forEach(regen);if(x.inputs)Object.keys(x.inputs).forEach(function(k){if(x.inputs[k]&&typeof x.inputs[k]==='object')regen(x.inputs[k]);});}regen(c);return c;}
function blockAction(action){
  if(!selectedBlockId)return;var f;try{f=findBlock(selectedBlockId);}catch(_){f=null;}if(!f){clearSelected();return;}
  if(action==='delete'){try{removeBlock(selectedBlockId);}catch(_){}save();clearSelected();redraw();return;}
  if(action==='duplicate'){var c=cloneBlock(f.block);f.list.splice(f.index+1,0,c);save();clearSelected();redraw();notify('Block duplicated');return;}
  if(action==='collection'){try{var arr=JSON.parse(localStorage.getItem('brotware_block_collection_v1')||'[]');if(!Array.isArray(arr))arr=[];arr.push({savedAt:Date.now(),block:JSON.parse(JSON.stringify(f.block))});if(arr.length>50)arr=arr.slice(arr.length-50);localStorage.setItem('brotware_block_collection_v1',JSON.stringify(arr));notify('Block added to Collection');}catch(e){console.error(e);}clearSelected();}
}
function wrapBlockEditor(){
  if(!baseOpenBlockEditor||window.openBlockEditor.__sw4Wrapped)return;
  var fn=function(id){
    if(mobile()&&overlay&&overlay.classList.contains('show')){
      if(selectedBlockId===id&&Date.now()-selectedAt<900){clearSelected();return baseOpenBlockEditor(id);}selectBlock(id);return;
    }
    return baseOpenBlockEditor.apply(this,arguments);
  };fn.__sw4Wrapped=true;window.openBlockEditor=fn;
}

function bindPalette(){
  if(!overlay)return;var toggle=document.getElementById('swPaletteToggle');if(toggle&&toggle.dataset.sw4Bound!=='1'){toggle.dataset.sw4Bound='1';toggle.addEventListener('click',function(e){if(!mobile())return;e.preventDefault();e.stopImmediatePropagation();overlay.classList.toggle('sw4-palette-collapsed');clearSelected();},true);}
  paletteScroll=document.getElementById('swPaletteScroll');if(paletteScroll&&paletteScroll.dataset.sw4Bound!=='1'){
    paletteScroll.dataset.sw4Bound='1';paletteScroll.addEventListener('click',function(e){var a=e.target.closest('[data-sw4-var-action]');if(a){e.preventDefault();e.stopImmediatePropagation();if(a.dataset.sw4VarAction==='add')openAddVariable();else if(a.dataset.sw4VarAction==='custom')openCustomVariable();else openRemoveVariable();return;}var chip=e.target.closest('[data-sw4-view-chip]');if(chip){try{state.selectedId=chip.dataset.sw4ViewChip;}catch(_){}notify(chip.textContent);}},true);
    observer=new MutationObserver(function(){setTimeout(refreshVariableTools,0);});observer.observe(paletteScroll,{childList:true});
  }
  var cats=document.getElementById('swPaletteCats');if(cats&&cats.dataset.sw4Bound!=='1'){cats.dataset.sw4Bound='1';cats.addEventListener('click',function(){setTimeout(refreshVariableTools,0);});}
}
function observeOverlay(){
  if(!overlay||overlay.dataset.sw4Observe==='1')return;overlay.dataset.sw4Observe='1';new MutationObserver(function(){var open=overlay.classList.contains('show');if(open&&!wasOpen){wasOpen=true;overlay.classList.remove('sw4-palette-collapsed');clearSelected();setTimeout(function(){decorateTop();refreshHeader();refreshVariableTools();},0);}else if(!open&&wasOpen){wasOpen=false;clearSelected();}else if(open){refreshHeader();}}).observe(overlay,{attributes:true,attributeFilter:['class']});
}
function install(){
  overlay=document.getElementById('swLogicOverlay');if(!overlay){setTimeout(install,120);return;}if(overlay.dataset.sw4Installed==='1'){decorateTop();bindPalette();return;}overlay.dataset.sw4Installed='1';decorateTop();buildToolbar();bindPalette();wrapBlockEditor();observeOverlay();buildDialog();
  var bookmark=document.getElementById('swLogicBookmark');if(bookmark)bookmark.addEventListener('click',function(e){if(!mobile())return;e.preventDefault();e.stopImmediatePropagation();var arr=[];try{arr=JSON.parse(localStorage.getItem('brotware_block_collection_v1')||'[]');}catch(_){}notify('Collection: '+(Array.isArray(arr)?arr.length:0)+' block(s)');},true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dialogBack&&dialogBack.classList.contains('show')){closeDialog();e.stopPropagation();}} ,true);
}

setTimeout(install,0);setTimeout(install,500);setTimeout(install,1400);
window.addEventListener('resize',function(){setTimeout(function(){decorateTop();refreshVariableTools();},80);});
window.BrotwareLogicScreenV4={refresh:function(){decorateTop();refreshHeader();refreshVariableTools();},addVariable:openAddVariable,removeVariable:openRemoveVariable};
})();
