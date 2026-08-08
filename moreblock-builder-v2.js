(function(){
'use strict';

var RETURN_TYPES=[
  {id:'void',label:'Void',shape:'void',defaultValue:''},
  {id:'string',label:'String',shape:'string',defaultValue:''},
  {id:'number',label:'Number',shape:'number',defaultValue:'0'},
  {id:'boolean',label:'Boolean',shape:'boolean',defaultValue:'false'},
  {id:'map',label:'Map',shape:'object',defaultValue:'{}'},
  {id:'listString',label:'List String',shape:'list',defaultValue:'[]'},
  {id:'listMap',label:'List Map',shape:'list',defaultValue:'[]'},
  {id:'view',label:'View',shape:'view',defaultValue:''}
];
var BASE_PARAM_TYPES=[
  {id:'boolean',label:'Boolean',spec:'b',shape:'boolean'},
  {id:'number',label:'Number',spec:'d',shape:'number'},
  {id:'string',label:'String',spec:'s',shape:'string'},
  {id:'map',label:'Map',spec:'m.varMap',shape:'object'},
  {id:'listNumber',label:'List Number',spec:'m.listInt',shape:'list'},
  {id:'listString',label:'List String',spec:'m.listStr',shape:'list'},
  {id:'listMap',label:'List Map',spec:'m.listMap',shape:'list'},
  {id:'view',label:'View',spec:'m.view',shape:'view'}
];
var overlay=null,draft=null,editingId='',observer=null,paletteObserver=null,queued=false;
var baseAddFunction=window.addFunction,baseOpenBlockEditor=window.openBlockEditor,baseSaveBlockEditor=window.saveBlockEditor,baseExecute=window.executeBlocks,baseRuntime=window.runtimeScriptForPage;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function uid2(prefix){return typeof uid==='function'?uid(prefix):(prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7));}
function fnById(id){return (state.functions||[]).find(function(f){return String(f.id)===String(id);})||null;}
function typeInfo(id){return RETURN_TYPES.find(function(x){return x.id===id;})||RETURN_TYPES[0];}
function normalizeFunction(f){
  if(!f)return null;if(!Array.isArray(f.blocks))f.blocks=[];if(!Array.isArray(f.parts))f.parts=[];if(!Array.isArray(f.params))f.params=[];
  if(!f.returnType)f.returnType='void';if(!f.spec)f.spec=buildSpec(f.name||'moreblock',f.returnType,f.parts);return f;
}
function normalizeAll(){if(!Array.isArray(state.functions))state.functions=[];state.functions.forEach(normalizeFunction);}
function shapeForParam(p){if(!p)return'string';if(p.shape)return p.shape;var t=String(p.dataType||'');if(t==='boolean')return'boolean';if(t==='number')return'number';if(t.indexOf('list')===0)return'list';if(t==='map'||t==='object')return'object';if(t==='view')return'view';if(t.indexOf('component:')===0||t==='component')return'component';return'string';}
function returnLabel(id){var x=typeInfo(id);return x.label;}
function buildSpec(name,returnType,parts){
  var out=String(name||'moreblock').trim();
  (parts||[]).forEach(function(p){
    if(p.kind==='label')out+=' '+String(p.text||'');
    else if(p.kind==='param'){
      var s=String(p.specType||'s');
      if(s==='b')out+=' %b.'+p.name;else if(s==='d')out+=' %d.'+p.name;else if(s==='s')out+=' %s.'+p.name;else out+=' %'+s+'.'+p.name;
    }
  });
  var rt=String(returnType||'void');
  if(rt!=='void')out=String(name||'moreblock')+'['+returnLabel(rt)+']'+out.slice(String(name||'moreblock').length);
  return out.trim();
}
function paramsFromParts(parts){return (parts||[]).filter(function(p){return p.kind==='param';}).map(function(p){return{kind:'param',name:p.name,dataType:p.dataType||'string',specType:p.specType||'s',shape:shapeForParam(p),componentType:p.componentType||''};});}
function componentTypes(){
  var out=[];var fc=window.BrotwareFunctionalComponents,cat=fc&&Array.isArray(fc.catalog)?fc.catalog:[];
  cat.forEach(function(c){out.push({id:'component:'+c.type,label:c.name,spec:'m.'+String(c.type).toLowerCase(),shape:'component',componentType:c.type});});
  return out;
}
function paramTypeList(kind){
  if(kind==='views')return BASE_PARAM_TYPES.filter(function(x){return x.id==='view';});
  if(kind==='components')return componentTypes();
  return BASE_PARAM_TYPES.filter(function(x){return x.id!=='view';});
}
function paramTypeById(id){var all=BASE_PARAM_TYPES.concat(componentTypes());return all.find(function(x){return x.id===id;})||BASE_PARAM_TYPES[2];}
function defaultArg(p){
  if(!p)return'';var t=p.dataType||'';
  if(t==='number')return'0';if(t==='boolean')return'false';if(t==='map')return'{}';if(String(t).indexOf('list')===0)return'[]';
  if(t==='view')return typeof firstNodeId==='function'?firstNodeId():'';
  if(String(t).indexOf('component:')===0){var ct=String(t).slice(10),arr=state.functionalComponents||[],c=arr.find(function(x){return x.type===ct;});return c?c.id:'';}
  return'';
}
function validateName(name,ignoreId){
  name=String(name||'').trim();if(!name)return'Informe o nome do bloco.';if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))return'Use letras, números e _. O nome não pode começar com número.';
  var dup=(state.functions||[]).some(function(f){return String(f.id)!==String(ignoreId||'')&&String(f.name||'').toLowerCase()===name.toLowerCase();});return dup?'Já existe um MoreBlock com esse nome.':'';
}
function usedParamName(name){return (draft.parts||[]).some(function(p){return p.kind==='param'&&String(p.name).toLowerCase()===String(name).toLowerCase();});}
function validateParamName(name){name=String(name||'').trim();if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))return'Nome de parâmetro inválido.';if(usedParamName(name))return'Esse parâmetro já existe.';return'';}

function build(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='bwMoreBlockBuilderV2';overlay.className='bw-mb-backdrop';
  overlay.innerHTML='<section class="bw-mb-shell">'+
    '<header class="bw-mb-head"><button class="bw-mb-back" id="bwMbBack" type="button"><span class="bw-google-icon">arrow_back</span></button><div><h2 id="bwMbTitle">Create MoreBlock</h2><small>Bloco reutilizável estilo Sketchware</small></div></header>'+
    '<main class="bw-mb-body">'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Preview</span><div class="bw-mb-preview-wrap" id="bwMbPreviewWrap"><div id="bwMbPreview"></div></div></section>'+
      '<section class="bw-mb-section"><label class="bw-mb-label">Block Name</label><input class="bw-mb-field" id="bwMbName" maxlength="60" placeholder="Block name"><span class="bw-mb-counter" id="bwMbNameCount">0/60</span><div class="bw-mb-error" id="bwMbNameError"></div></section>'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Select Moreblock type</span><div class="bw-mb-types" id="bwMbReturnTypes"></div></section>'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Add Variable</span><div class="bw-mb-kind-tabs"><button class="bw-mb-kind-tab active" data-mb-kind="variables">Variables</button><button class="bw-mb-kind-tab" data-mb-kind="views">Views</button><button class="bw-mb-kind-tab" data-mb-kind="components">Components</button></div><div class="bw-mb-addrow"><select class="bw-mb-select" id="bwMbParamType"></select><input class="bw-mb-mini-input" id="bwMbParamName" maxlength="100" placeholder="Variable name"><button class="bw-mb-plus" id="bwMbAddParam" type="button">＋</button></div></section>'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Add Label</span><div class="bw-mb-addrow label-row"><input class="bw-mb-mini-input" id="bwMbLabelText" maxlength="100" placeholder="Label text"><button class="bw-mb-plus" id="bwMbAddLabel" type="button">＋</button></div></section>'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Custom Parameter</span><div class="bw-mb-custom"><input class="bw-mb-mini-input" id="bwMbCustomSpec" maxlength="80" placeholder="m.name"><input class="bw-mb-mini-input" id="bwMbCustomName" maxlength="100" placeholder="Parameter"><button class="bw-mb-plus" id="bwMbAddCustom" type="button">＋</button></div><div class="bw-mb-help">Formato compatível com o spec do Sketchware, por exemplo <code>m.name</code>. Para tipos comuns use Add Variable.</div></section>'+
      '<section class="bw-mb-section"><span class="bw-mb-label">Block parts</span><div class="bw-mb-parts" id="bwMbParts"></div><div class="bw-mb-error" id="bwMbPartError"></div></section>'+
    '</main>'+
    '<footer class="bw-mb-foot"><button class="bw-mb-cancel" id="bwMbCancel" type="button">Cancel</button><button class="bw-mb-save" id="bwMbSave" type="button">Add</button></footer>'+
  '</section>';
  document.body.appendChild(overlay);
  document.getElementById('bwMbBack').onclick=closeBuilder;document.getElementById('bwMbCancel').onclick=closeBuilder;document.getElementById('bwMbSave').onclick=saveBuilder;
  document.getElementById('bwMbName').addEventListener('input',function(){renderPreview();document.getElementById('bwMbNameCount').textContent=this.value.length+'/60';});
  document.getElementById('bwMbReturnTypes').addEventListener('click',function(e){var b=e.target.closest('[data-mb-return]');if(!b)return;draft.returnType=b.dataset.mbReturn;renderReturnTypes();renderPreview();});
  document.querySelector('.bw-mb-kind-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-mb-kind]');if(!b)return;document.querySelectorAll('.bw-mb-kind-tab').forEach(function(x){x.classList.toggle('active',x===b);});renderParamTypes(b.dataset.mbKind);});
  document.getElementById('bwMbAddParam').onclick=addParam;document.getElementById('bwMbAddLabel').onclick=addLabel;document.getElementById('bwMbAddCustom').onclick=addCustom;
  document.getElementById('bwMbParts').addEventListener('click',function(e){var b=e.target.closest('[data-mb-remove-part]');if(!b)return;draft.parts.splice(Number(b.dataset.mbRemovePart),1);renderParts();renderPreview();});
  overlay.addEventListener('click',function(e){if(e.target===overlay)closeBuilder();});
}
function renderReturnTypes(){var box=document.getElementById('bwMbReturnTypes');if(!box)return;box.innerHTML=RETURN_TYPES.map(function(t){return'<button type="button" class="bw-mb-type'+(draft.returnType===t.id?' active':'')+'" data-mb-return="'+t.id+'">'+esc(t.label)+'</button>';}).join('');}
function renderParamTypes(kind){var box=document.getElementById('bwMbParamType');if(!box)return;var list=paramTypeList(kind||'variables');box.innerHTML=list.map(function(t){return'<option value="'+esc(t.id)+'">'+esc(t.label)+'</option>';}).join('');}
function renderPreview(){
  if(!draft)return;var name=document.getElementById('bwMbName');if(name)draft.name=name.value.trim();var t=typeInfo(draft.returnType),box=document.getElementById('bwMbPreview');if(!box)return;
  var html='<div class="bw-mb-preview '+t.shape+'"><span class="mb-label">'+esc(draft.name||'MoreBlock')+'</span>';
  (draft.parts||[]).forEach(function(p){if(p.kind==='label')html+='<span class="mb-label">'+esc(p.text)+'</span>';else html+='<span class="mb-socket '+shapeForParam(p)+'">'+esc(p.name)+'</span>';});html+='</div>';box.innerHTML=html;
}
function renderParts(){var box=document.getElementById('bwMbParts');if(!box)return;if(!draft.parts.length){box.innerHTML='<div class="bw-mb-empty">Nenhum parâmetro ou label adicionado.</div>';return;}box.innerHTML=draft.parts.map(function(p,i){var title=p.kind==='label'?'Label: '+p.text:p.name,sub=p.kind==='label'?'Texto fixo no bloco':((p.dataType||'custom')+' · '+(p.specType||''));return'<div class="bw-mb-part"><span class="ico"><span class="bw-google-icon">'+(p.kind==='label'?'title':'data_object')+'</span></span><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span><button type="button" data-mb-remove-part="'+i+'">×</button></div>';}).join('');}
function showPartError(msg){var e=document.getElementById('bwMbPartError');if(!e)return;e.textContent=msg||'';e.classList.toggle('show',!!msg);}
function addParam(){var sel=document.getElementById('bwMbParamType'),name=document.getElementById('bwMbParamName').value.trim(),err=validateParamName(name);if(err){showPartError(err);return;}var t=paramTypeById(sel.value);draft.parts.push({kind:'param',name:name,dataType:t.id,specType:t.spec,shape:t.shape,componentType:t.componentType||''});document.getElementById('bwMbParamName').value='';showPartError('');renderParts();renderPreview();}
function addLabel(){var input=document.getElementById('bwMbLabelText'),text=input.value.trim();if(!text){showPartError('Digite o texto do label.');return;}draft.parts.push({kind:'label',text:text});input.value='';showPartError('');renderParts();renderPreview();}
function addCustom(){var spec=document.getElementById('bwMbCustomSpec').value.trim(),name=document.getElementById('bwMbCustomName').value.trim(),err=validateParamName(name);if(err){showPartError(err);return;}if(!/^[a-zA-Z]+\.[a-zA-Z][a-zA-Z0-9_]*$/.test(spec)){showPartError('Custom Parameter deve seguir formato como m.name.');return;}draft.parts.push({kind:'param',name:name,dataType:'custom',specType:spec,shape:'string',custom:true});document.getElementById('bwMbCustomSpec').value='';document.getElementById('bwMbCustomName').value='';showPartError('');renderParts();renderPreview();}
function openBuilder(id){
  build();normalizeAll();editingId=id||'';var f=id?fnById(id):null;
  draft=f?JSON.parse(JSON.stringify(normalizeFunction(f))):{name:'',returnType:'void',parts:[],params:[],blocks:[]};
  if(!Array.isArray(draft.parts))draft.parts=[];document.getElementById('bwMbTitle').textContent=f?'Edit MoreBlock':'Create MoreBlock';document.getElementById('bwMbSave').textContent=f?'Save':'Add';document.getElementById('bwMbName').value=draft.name||'';document.getElementById('bwMbNameCount').textContent=(draft.name||'').length+'/60';
  document.getElementById('bwMbNameError').classList.remove('show');showPartError('');renderReturnTypes();renderParamTypes('variables');document.querySelectorAll('.bw-mb-kind-tab').forEach(function(x){x.classList.toggle('active',x.dataset.mbKind==='variables');});renderParts();renderPreview();overlay.classList.add('show');setTimeout(function(){document.getElementById('bwMbName').focus();},60);
}
function closeBuilder(){if(overlay)overlay.classList.remove('show');}
function saveBuilder(){
  draft.name=document.getElementById('bwMbName').value.trim();var err=validateName(draft.name,editingId),box=document.getElementById('bwMbNameError');if(err){box.textContent=err;box.classList.add('show');return;}box.classList.remove('show');draft.params=paramsFromParts(draft.parts);draft.spec=buildSpec(draft.name,draft.returnType,draft.parts);
  var f;if(editingId){f=fnById(editingId);if(!f)return;f.name=draft.name;f.returnType=draft.returnType;f.parts=JSON.parse(JSON.stringify(draft.parts));f.params=JSON.parse(JSON.stringify(draft.params));f.spec=draft.spec;}else{f={id:uid2('fn'),name:draft.name,returnType:draft.returnType,parts:JSON.parse(JSON.stringify(draft.parts)),params:JSON.parse(JSON.stringify(draft.params)),spec:draft.spec,blocks:[]};state.functions.push(f);}normalizeFunction(f);state.activeFunctionId=f.id;if(typeof autoSave==='function')autoSave();if(typeof renderFunctions==='function')renderFunctions();closeBuilder();refreshHome();refreshPalette();
  if(typeof setLogicMode==='function')setLogicMode('function');if(window.BrotwareSketchLogic&&BrotwareSketchLogic.open)BrotwareSketchLogic.open(f.name+' · MoreBlock',f.returnType==='void'?'Void MoreBlock':'Returns '+returnLabel(f.returnType));
}

/* ---------- MoreBlock call / return blocks ---------- */
function safeArgKey(name){return'arg_'+String(name||'').replace(/[^A-Za-z0-9_]/g,'_');}
function makeCallBlock(fn){
  fn=normalizeFunction(fn);var p={functionId:fn.id,saveVar:fn.returnType==='void'?'':(typeof firstVariableName==='function'?firstVariableName():'counter')};
  fn.params.forEach(function(x){p[safeArgKey(x.name)]=defaultArg(x);});return{id:uid2('block'),type:'callMoreBlock',props:p,children:[],elseChildren:[],inputs:{},__swCategory:'more'};
}
function makeReturnBlock(fn){fn=normalizeFunction(fn);return{id:uid2('block'),type:'returnMoreBlock',props:{functionId:fn.id,returnType:fn.returnType,value:typeInfo(fn.returnType).defaultValue},children:[],elseChildren:[],inputs:{},__swCategory:'more'};}
BLOCK_META.callMoreBlock={name:'MoreBlock',icon:'◆',cls:'more'};BLOCK_META.returnMoreBlock={name:'return',icon:'↩',cls:'more'};
var previousNewBlock=window.newBlock;
window.newBlock=function(type){if(type==='callMoreBlock'){var f=(state.functions||[])[0];return f?makeCallBlock(f):previousNewBlock(type);}if(type==='returnMoreBlock'){var fn=fnById(state.activeFunctionId);return fn?makeReturnBlock(fn):previousNewBlock(type);}return previousNewBlock(type);};
var previousSummary=window.blockSummary;
window.blockSummary=function(b){if(b&&b.type==='callMoreBlock'){var f=fnById((b.props||{}).functionId);return f?f.name:'MoreBlock';}if(b&&b.type==='returnMoreBlock')return'return '+String((b.props||{}).value||'');return previousSummary?previousSummary(b):'';};

function varOptions(selected){var h='<option value="">None</option>';Object.keys(state.variables||{}).forEach(function(k){h+='<option value="'+esc(k)+'" '+(k===selected?'selected':'')+'>'+esc(k)+'</option>';});return h;}
window.openBlockEditor=function(id){
  var found=findBlock(id);if(!found||['callMoreBlock','returnMoreBlock'].indexOf(found.block.type)<0)return baseOpenBlockEditor(id);state.editingBlockId=id;var b=found.block,p=b.props||{};
  if(b.type==='returnMoreBlock'){$('#blockModalTitle').textContent='return';$('#blockModalSubtitle').textContent='Retornar valor do MoreBlock';$('#blockEditorFields').innerHTML='<div class="block-config-grid"><label class="field span-2"><span>Value</span><input id="mb_be_return" value="'+esc(p.value==null?'':p.value)+'"></label></div>';openModal('blockModal');return;}
  var f=fnById(p.functionId);if(!f)return baseOpenBlockEditor(id);normalizeFunction(f);$('#blockModalTitle').textContent=f.name;$('#blockModalSubtitle').textContent='Call MoreBlock';var h='<div class="block-config-grid">';f.params.forEach(function(x){var k=safeArgKey(x.name);h+='<label class="field span-2"><span>'+esc(x.name)+' · '+esc(x.dataType)+'</span><input id="mb_be_'+esc(k)+'" value="'+esc(p[k]==null?'':p[k])+'"></label>';});if(f.returnType!=='void')h+='<label class="field span-2"><span>Save result in</span><select id="mb_be_save">'+varOptions(p.saveVar)+'</select></label>';h+='</div>';$('#blockEditorFields').innerHTML=h;openModal('blockModal');
};
window.saveBlockEditor=function(){var found=findBlock(state.editingBlockId);if(!found||['callMoreBlock','returnMoreBlock'].indexOf(found.block.type)<0)return baseSaveBlockEditor();var b=found.block,p=b.props||{};if(b.type==='returnMoreBlock')p.value=$('#mb_be_return')?$('#mb_be_return').value:'';else{var f=fnById(p.functionId);if(f){normalizeFunction(f);f.params.forEach(function(x){var k=safeArgKey(x.name),e=document.getElementById('mb_be_'+k);if(e)p[k]=e.value;});var s=document.getElementById('mb_be_save');if(s)p.saveVar=s.value;}}closeModal('blockModal');if(typeof saveLogic==='function')saveLogic();if(typeof renderLogic==='function')renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();refreshPalette();};

function defaultReturn(type){if(type==='number')return 0;if(type==='boolean')return false;if(type==='map')return{};if(type==='listString'||type==='listMap')return[];return'';}
async function runMoreBlock(fn,call,ctx){
  fn=normalizeFunction(fn);var vars=ctx.vars||(ctx.vars={}),saved={};fn.params.forEach(function(x){var k=x.name;saved[k]={had:Object.prototype.hasOwnProperty.call(vars,k),value:vars[k]};vars[k]=resolveValue((call.props||{})[safeArgKey(k)],ctx);});var result=defaultReturn(fn.returnType);
  try{await window.executeBlocks(fn.blocks,ctx);}catch(e){if(e&&e.__bwMoreReturn)result=e.value;else throw e;}finally{fn.params.forEach(function(x){var old=saved[x.name];if(old.had)vars[x.name]=old.value;else delete vars[x.name];});}return result;
}
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){var b=blocks[i],p=b.props||{};if(b.type==='returnMoreBlock'){throw{__bwMoreReturn:true,value:resolveValue(p.value,ctx)};}else if(b.type==='callMoreBlock'){var f=fnById(p.functionId);if(f){var r=await runMoreBlock(f,b,ctx);if(f.returnType!=='void'&&p.saveVar)ctx.vars[p.saveVar]=r;}}else await baseExecute([b],ctx);}
};

/* Exported HTML: inject call/return support into the existing runner. */
window.runtimeScriptForPage=function(page){
  var code=baseRuntime(page),needle="else if(b.type==='callFunction'){";if(code.indexOf(needle)<0)return code;
  var injected="else if(b.type==='returnMoreBlock'){throw {__bwMoreReturn:true,value:rv(p.value)}}else if(b.type==='callMoreBlock'){var mf=(cfg.functions||[]).find(function(x){return x.id===p.functionId});if(mf){var mps=mf.params||[],mold={},mr=(mf.returnType==='number'?0:mf.returnType==='boolean'?false:(mf.returnType==='map'?{}:(mf.returnType==='listString'||mf.returnType==='listMap'?[]:'')));for(var mi=0;mi<mps.length;mi++){var mn=mps[mi].name,mk='arg_'+String(mn||'').replace(/[^A-Za-z0-9_]/g,'_');mold[mn]={had:Object.prototype.hasOwnProperty.call(vars,mn),value:vars[mn]};vars[mn]=rv(p[mk])}try{await run(mf.blocks)}catch(me){if(me&&me.__bwMoreReturn)mr=me.value;else throw me}finally{for(var mj=0;mj<mps.length;mj++){var mm=mps[mj].name,mo=mold[mm];if(mo.had)vars[mm]=mo.value;else delete vars[mm]}}if(mf.returnType!=='void'&&p.saveVar)vars[p.saveVar]=mr}}";
  return code.replace(needle,injected+needle);
};

/* ---------- Palette + MoreBlock browser ---------- */
function paletteActiveMore(){var a=document.querySelector('#swLogicOverlay .sw-cat.active');return !!(a&&a.dataset.swCat==='more');}
function refreshPalette(){
  var scroll=document.getElementById('swPaletteScroll');if(!scroll||!paletteActiveMore())return;var old=scroll.querySelector('.bw-mb-palette-pack');if(old)old.remove();normalizeAll();var h='<div class="bw-mb-palette-title">Your MoreBlocks</div>';
  (state.functions||[]).forEach(function(f){var t=typeInfo(f.returnType);h+='<button type="button" class="bw-mb-palette-btn" data-mb-call-fn="'+esc(f.id)+'"><span class="bw-mb-palette-shape '+t.shape+'">'+esc(f.name)+' <small>'+esc(returnLabel(f.returnType))+'</small></span></button>';});
  var active=fnById(state.activeFunctionId);if(state.logicMode==='function'&&active&&active.returnType!=='void')h+='<button type="button" class="bw-mb-palette-btn" data-mb-return-block="'+esc(active.id)+'"><span class="bw-mb-palette-shape void">return <small>'+esc(returnLabel(active.returnType))+'</small></span></button>';
  var wrap=document.createElement('div');wrap.className='bw-mb-palette-pack';wrap.innerHTML=h;scroll.appendChild(wrap);var generic=scroll.querySelector('.sw-palette-item[data-sw-type="callFunction"]');if(generic)generic.style.display='none';
}
function queuePalette(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refreshPalette();refreshHome();});}
function installPalette(){var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(installPalette,220);return;}if(ov.dataset.bwMoreBlockV2==='1'){queuePalette();return;}ov.dataset.bwMoreBlockV2='1';ov.addEventListener('click',function(e){var c=e.target.closest('[data-mb-call-fn]');if(c){e.preventDefault();e.stopImmediatePropagation();var f=fnById(c.dataset.mbCallFn);if(f){insertBlock(makeCallBlock(f),'root',activeBlocks().length);saveLogic();BrotwareSketchLogic.render();queuePalette();}return;}var r=e.target.closest('[data-mb-return-block]');if(r){e.preventDefault();e.stopImmediatePropagation();var fn=fnById(r.dataset.mbReturnBlock);if(fn){insertBlock(makeReturnBlock(fn),'root',activeBlocks().length);saveLogic();BrotwareSketchLogic.render();queuePalette();}}},true);paletteObserver=new MutationObserver(queuePalette);paletteObserver.observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});queuePalette();}
function refreshHome(){
  var rail=document.getElementById('skEventRail'),box=document.getElementById('skEventCards');if(!rail||!box)return;var active=rail.querySelector('.sk-event-cat.active');if(!active||active.dataset.skCat!=='moreblock')return;var cards=box.querySelectorAll('.sk-event-card');normalizeAll();Array.prototype.forEach.call(cards,function(card,i){var f=state.functions[i];if(!f)return;if(!card.querySelector('.bw-mb-return-badge')){var b=card.querySelector('b');if(b)b.insertAdjacentHTML('afterend','<span class="bw-mb-return-badge">'+esc(returnLabel(f.returnType))+'</span>');}if(!card.querySelector('.bw-mb-edit-card')){var edit=document.createElement('button');edit.type='button';edit.className='bw-mb-edit-card';edit.innerHTML='<span class="bw-google-icon">edit</span>';edit.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openBuilder(f.id);};card.appendChild(edit);}});
}
function installHome(){var home=document.getElementById('skEventHome');if(!home){setTimeout(installHome,220);return;}if(home.dataset.bwMoreBlockV2==='1'){refreshHome();return;}home.dataset.bwMoreBlockV2='1';observer=new MutationObserver(function(){requestAnimationFrame(refreshHome);});observer.observe(home,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});refreshHome();}

window.addFunction=function(){openBuilder('');};
window.BrotwareMoreBlocks={openBuilder:openBuilder,normalize:normalizeAll,makeCall:makeCallBlock,makeReturn:makeReturnBlock,safeArgKey:safeArgKey,typeInfo:typeInfo};
normalizeAll();setTimeout(function(){build();installPalette();installHome();},0);setTimeout(function(){installPalette();installHome();},700);
})();
