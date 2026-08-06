(function(){
'use strict';

var DIALOG_NODE_PREFIX='@dialog:';
var DIALOG_EVENTS=[
  ['open','When dialog opens'],
  ['close','When dialog closes'],
  ['outside','When user clicks outside'],
  ['back','When back button pressed']
];
var dialogHistories={};
var manager=null,propsModal=null,eventModal=null,editorBar=null,quickBlocks=null;
var baseEnsurePageSchema=window.ensurePageSchema;
var baseSaveCurrentPage=window.saveCurrentPage;
var baseCommit=window.commit;
var baseRestoreHistory=window.restoreHistory;
var baseUpdateUndoRedo=window.updateUndoRedo;
var baseLoadPage=window.loadPage;
var baseNewBlock=window.newBlock;
var baseBlockSummary=window.blockSummary;
var baseOpenBlockEditor=window.openBlockEditor;
var baseSaveBlockEditor=window.saveBlockEditor;
var baseEnsureEventPath=window.ensureEventPath;
var baseRefreshEventNodeSelect=window.refreshEventNodeSelect;
var baseRefreshEventTypes=window.refreshEventTypes;
var baseExecuteBlocks=window.executeBlocks;
var baseRuntimeScriptForPage=window.runtimeScriptForPage;
var baseCleanupExportDom=window.cleanupExportDom;

function clone(v){return JSON.parse(JSON.stringify(v));}
function html(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function cssValue(v,fallback){
  v=String(v==null?'':v).trim();if(!v)return fallback||'';
  if(/^-?\d+(\.\d+)?$/.test(v))return v+'px';
  return v.replace(/[<>]/g,'');
}
function bool(v,def){return v===undefined?!!def:!!v;}
function safeId(v){
  var s=String(v||'dialog').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
  if(!s)s='dialog';if(s.indexOf('dialog_')!==0)s='dialog_'+s;return s;
}
function page(){return typeof currentPage==='function'?currentPage():null;}
function ensurePage(p){
  if(!p)return p;
  if(baseEnsurePageSchema)baseEnsurePageSchema(p);
  if(!Array.isArray(p.dialogs))p.dialogs=[];
  p.dialogs.forEach(ensureDialog);
  return p;
}
function defaultConfig(){return{
  width:'320px',height:'auto',maxWidth:'90vw',maxHeight:'80vh',position:'center',customX:'0px',customY:'0px',
  overlayColor:'#000000',overlayOpacity:.55,background:'#ffffff',borderRadius:'16px',border:'none',
  shadow:'0 22px 70px rgba(0,0,0,.28)',padding:'20px',closeOnOutside:true,closeOnEsc:true,closeOnBack:true,
  blockScroll:true,animation:'scale'
};}
function ensureDialog(d){
  if(!d)return d;
  d.kind=d.kind||'dialog';d.id=safeId(d.id||d.name||'dialog');d.name=d.name||d.id;
  d.content=d.content||'';d.config=Object.assign(defaultConfig(),d.config||{});
  d.events=d.events||{};DIALOG_EVENTS.forEach(function(e){if(!Array.isArray(d.events[e[0]]))d.events[e[0]]=[];});
  d.designHeight=Math.max(180,Number(d.designHeight)||320);d.createdAt=d.createdAt||Date.now();d.updatedAt=d.updatedAt||Date.now();
  return d;
}
function dialogs(){var p=ensurePage(page());return p?p.dialogs:[];}
function dialogById(id,p){p=ensurePage(p||page());if(!p)return null;for(var i=0;i<p.dialogs.length;i++)if(p.dialogs[i].id===id)return p.dialogs[i];return null;}
function activeDialog(){return state.dialogEditorActive?dialogById(state.activeDialogId):null;}
function uniqueDialogId(seed,ignore){
  var id=safeId(seed),base=id,n=2;while(dialogs().some(function(d){return d.id!==ignore&&d.id===id;}))id=base+'_'+(n++);return id;
}
function starterContent(dialogId){
  var pre=String(dialogId||'dialog').replace(/[^a-z0-9_]+/gi,'_');
  return '<div class="vf-node" data-type="linear-v" data-vf-id="'+pre+'_linear" style="left:12px;top:12px;width:256px;height:220px"><div class="node-layout vf-content"></div><div class="node-layout-label">Linear(V)</div>'+
    '<div class="vf-node" data-type="text" data-vf-id="'+pre+'_title" style="left:18px;top:24px;width:220px;height:42px"><div class="node-text vf-content" style="font-size:20px;font-weight:800">Título do Dialog</div></div>'+
    '<div class="vf-node" data-type="text" data-vf-id="'+pre+'_message" style="left:18px;top:76px;width:220px;height:48px"><div class="node-text vf-content">Digite a mensagem aqui.</div></div>'+
    '<div class="vf-node" data-type="linear-h" data-vf-id="'+pre+'_actions" style="left:18px;top:142px;width:220px;height:58px"><div class="node-layout vf-content"></div><div class="node-layout-label">Linear(H)</div>'+
      '<div class="vf-node" data-type="button" data-vf-id="'+pre+'_cancel" style="left:0;top:8px;width:100px;height:42px"><button class="node-button vf-content">Cancelar</button></div>'+
      '<div class="vf-node" data-type="button" data-vf-id="'+pre+'_ok" style="left:116px;top:8px;width:100px;height:42px"><button class="node-button vf-content">Confirmar</button></div>'+
    '</div></div>';
}
function createDialog(name){
  var p=ensurePage(page());if(!p)return null;var id=uniqueDialogId(name||'dialog');
  var d=ensureDialog({id:id,name:id,content:starterContent(id),config:defaultConfig(),events:{},designHeight:260,createdAt:Date.now(),updatedAt:Date.now()});
  p.dialogs.push(d);if(typeof autoSave==='function')autoSave();renderManager();return d;
}
function removeDialog(id){
  var p=ensurePage(page()),d=dialogById(id,p);if(!p||!d)return;if(!confirm('Excluir '+d.name+'?'))return;
  p.dialogs=p.dialogs.filter(function(x){return x.id!==id;});removeDialogRefs(id);if(state.activeDialogId===id)exitDialogEditor(false);if(typeof autoSave==='function')autoSave();renderManager();
}
function remapDialogNodes(d){
  var holder=document.createElement('div'),map={};holder.innerHTML=d.content||'';
  Array.prototype.forEach.call(holder.querySelectorAll('.vf-node'),function(n){var old=n.dataset.vfId||'',neu=typeof nodeId==='function'?nodeId(n.dataset.type||'view'):old+'_'+Date.now().toString(36);if(old)map[old]=neu;n.dataset.vfId=neu;n.removeAttribute('data-bound');});
  d.content=holder.innerHTML;walkEventObject(d.events,function(b){['target','source'].forEach(function(k){if(b.props&&map[b.props[k]])b.props[k]=map[b.props[k]];});});
}
function duplicateDialog(id){
  var p=ensurePage(page()),d=dialogById(id,p);if(!d)return;var copy=clone(d);copy.id=uniqueDialogId(d.id+'_copy');copy.name=copy.id;remapDialogNodes(copy);copy.createdAt=Date.now();copy.updatedAt=Date.now();p.dialogs.push(ensureDialog(copy));if(typeof autoSave==='function')autoSave();renderManager();
}
function removeDialogRefs(id){
  state.pages.forEach(function(p){
    if(p.events)walkEventObject(p.events,function(b){if(b.props&&b.props.dialogId===id)b.props.dialogId='';});
    (p.dialogs||[]).forEach(function(d){walkEventObject(d.events,function(b){if(b.props&&b.props.dialogId===id)b.props.dialogId='';});});
  });
  state.functions.forEach(function(f){if(typeof walkBlocks==='function')walkBlocks(f.blocks,function(b){if(b.props&&b.props.dialogId===id)b.props.dialogId='';});});
}
function renameDialogRefs(oldId,newId){
  state.pages.forEach(function(p){
    if(p.events)walkEventObject(p.events,function(b){if(b.props&&b.props.dialogId===oldId)b.props.dialogId=newId;});
    (p.dialogs||[]).forEach(function(d){walkEventObject(d.events,function(b){if(b.props&&b.props.dialogId===oldId)b.props.dialogId=newId;});});
  });
  state.functions.forEach(function(f){if(typeof walkBlocks==='function')walkBlocks(f.blocks,function(b){if(b.props&&b.props.dialogId===oldId)b.props.dialogId=newId;});});
}
function walkEventObject(obj,fn){Object.keys(obj||{}).forEach(function(k){var v=obj[k];if(Array.isArray(v)){if(typeof walkBlocks==='function')walkBlocks(v,fn);}else if(v&&typeof v==='object')walkEventObject(v,fn);});}

/* ---------- Manager ---------- */
function buildManager(){
  if(manager)return;
  manager=document.createElement('div');manager.id='bwDialogsManager';manager.className='bw-dialogs-manager';
  manager.innerHTML='<div class="bw-dialogs-shell"><header class="bw-dialogs-head"><button id="bwDialogsClose" type="button">←</button><div><strong>Dialogs</strong><small id="bwDialogsPageName"></small></div><span></span><button class="primary" id="bwCreateDialog" type="button">＋ Criar Dialog</button></header><main id="bwDialogsList"></main></div>';
  document.body.appendChild(manager);
  document.getElementById('bwDialogsClose').onclick=closeManager;
  document.getElementById('bwCreateDialog').onclick=function(){var n=prompt('Nome do Dialog:','dialog_confirm');if(n===null)return;var d=createDialog(n);if(d)enterDialogEditor(d.id);};
  document.getElementById('bwDialogsList').addEventListener('click',function(e){
    var card=e.target.closest('[data-dialog-id]');if(!card)return;var id=card.dataset.dialogId;
    var a=e.target.closest('[data-dialog-action]');if(!a)return;
    if(a.dataset.dialogAction==='design')enterDialogEditor(id);
    else if(a.dataset.dialogAction==='logic')openDialogEventChooser(id);
    else if(a.dataset.dialogAction==='properties')openDialogProperties(id);
    else if(a.dataset.dialogAction==='duplicate')duplicateDialog(id);
    else if(a.dataset.dialogAction==='delete')removeDialog(id);
  });
}
function openManager(){buildManager();saveCurrentDocument();renderManager();manager.classList.add('show');document.body.classList.add('bw-dialog-manager-open');}
function closeManager(){if(manager)manager.classList.remove('show');document.body.classList.remove('bw-dialog-manager-open');}
function renderManager(){
  if(!manager)return;var p=ensurePage(page()),box=document.getElementById('bwDialogsList');document.getElementById('bwDialogsPageName').textContent=p?p.name:'';
  var arr=p?p.dialogs:[];if(!arr.length){box.innerHTML='<div class="bw-dialog-empty"><b>Nenhum Dialog nesta página.</b><span>Crie um Dialog e desenhe ele separadamente do Canvas principal.</span></div>';return;}
  box.innerHTML=arr.map(function(d){return '<article class="bw-dialog-card" data-dialog-id="'+html(d.id)+'"><div class="bw-dialog-card-icon">▣</div><div class="bw-dialog-card-meta"><strong>'+html(d.name)+'</strong><small>#'+html(d.id)+' · '+html(d.config.animation)+' · '+((d.events.open||[]).length+(d.events.close||[]).length+(d.events.outside||[]).length+(d.events.back||[]).length)+' bloco(s)</small></div><button data-dialog-action="design">Design</button><button data-dialog-action="logic">Logic</button><button data-dialog-action="properties">Properties</button><button data-dialog-action="duplicate" title="Duplicar">⧉</button><button class="danger" data-dialog-action="delete" title="Excluir">×</button></article>';}).join('');
}

/* ---------- Visual editor context ---------- */
function saveCurrentDocument(){if(state.dialogEditorActive)saveDialogContent();else if(baseSaveCurrentPage)baseSaveCurrentPage();}
function contentHeight(){
  var max=180;Array.prototype.forEach.call(root.querySelectorAll('.vf-node'),function(n){var top=parseFloat(n.style.top)||0;max=Math.max(max,top+n.offsetHeight+20);});return Math.ceil(max);
}
function saveDialogContent(){var d=activeDialog();if(!d)return;d.content=typeof serializeEditor==='function'?serializeEditor():root.innerHTML;d.designHeight=contentHeight();d.updatedAt=Date.now();}
function editorPixelWidth(d){var w=parseFloat(d.config.width);if(!isFinite(w)||w<180)w=320;return Math.max(180,Math.min(360,w));}
function applyDialogEditorStyle(){
  var d=activeDialog();if(!d)return;var c=d.config,rootEl=root,pane=document.getElementById('viewPane');
  pane.classList.add('bw-dialog-design-pane');pane.style.setProperty('--bw-dialog-overlay',hexToRgba(c.overlayColor,c.overlayOpacity));
  rootEl.classList.add('bw-dialog-design-root');rootEl.style.background=c.background;rootEl.style.width=editorPixelWidth(d)+'px';rootEl.style.height=Math.max(220,d.designHeight||320)+'px';rootEl.style.maxWidth='calc(100% - 28px)';rootEl.style.maxHeight='calc(100% - 34px)';rootEl.style.borderRadius=cssValue(c.borderRadius,'16px');rootEl.style.border=c.border||'none';rootEl.style.boxShadow=c.shadow||'none';rootEl.style.overflow='auto';
  rootEl.style.left='50%';rootEl.style.top='50%';rootEl.style.right='auto';rootEl.style.bottom='auto';rootEl.style.transform='translate(-50%,-50%)';
}
function clearDialogEditorStyle(){
  var pane=document.getElementById('viewPane');if(pane){pane.classList.remove('bw-dialog-design-pane');pane.style.removeProperty('--bw-dialog-overlay');}
  root.classList.remove('bw-dialog-design-root');['background','width','height','maxWidth','maxHeight','borderRadius','border','boxShadow','overflow','left','top','right','bottom','transform'].forEach(function(k){root.style[k]='';});
}
function buildEditorBar(){
  if(editorBar)return;editorBar=document.createElement('div');editorBar.id='bwDialogEditorBar';editorBar.className='bw-dialog-editor-bar';editorBar.innerHTML='<button id="bwDialogBackToPage" type="button">← Página</button><div><strong id="bwDialogEditorName">Dialog</strong><small>Editor visual separado</small></div><span></span><button id="bwDialogEditorLogic" type="button">⚡ Logic</button><button id="bwDialogEditorProps" type="button">Properties</button>';
  document.querySelector('.designer').appendChild(editorBar);
  document.getElementById('bwDialogBackToPage').onclick=function(){exitDialogEditor(true);};
  document.getElementById('bwDialogEditorLogic').onclick=function(){var d=activeDialog();if(d)openDialogEventChooser(d.id);};
  document.getElementById('bwDialogEditorProps').onclick=function(){var d=activeDialog();if(d)openDialogProperties(d.id);};
}
function enterDialogEditor(id){
  var d=dialogById(id);if(!d)return;
  if(!state.dialogEditorActive&&baseSaveCurrentPage)baseSaveCurrentPage();else if(state.dialogEditorActive)saveDialogContent();
  closeManager();state.dialogEditorActive=true;state.activeDialogId=id;state.selectedId=null;document.body.classList.add('bw-dialog-editor-active');
  root.innerHTML='<div class="grid-layer" id="gridLayer"></div>'+(d.content||'');bindAllNodes();if(typeof refreshStringsOnDom==='function')refreshStringsOnDom();selectNode(null);
  buildEditorBar();editorBar.classList.add('show');document.getElementById('bwDialogEditorName').textContent=d.name;applyDialogEditorStyle();
  var key=dialogHistoryKey(d);if(!dialogHistories[key])dialogHistories[key]={items:[serializeEditor()],index:0};updateUndoRedo();refreshEventNodeSelect();
  if(typeof switchTab==='function')switchTab('view');
}
function exitDialogEditor(showManagerAfter){
  if(!state.dialogEditorActive)return;saveDialogContent();var p=page();state.dialogEditorActive=false;state.activeDialogId=null;state.selectedId=null;document.body.classList.remove('bw-dialog-editor-active');if(editorBar)editorBar.classList.remove('show');clearDialogEditorStyle();
  if(baseLoadPage&&p)baseLoadPage(p.id,true);if(typeof autoSave==='function')autoSave();if(showManagerAfter)openManager();
}
function dialogHistoryKey(d){return String(state.currentPageId)+':dialog:'+d.id;}

window.saveCurrentPage=function(){if(state.dialogEditorActive){saveDialogContent();return;}return baseSaveCurrentPage&&baseSaveCurrentPage.apply(this,arguments);};
window.commit=function(){
  if(!state.dialogEditorActive)return baseCommit&&baseCommit.apply(this,arguments);
  var d=activeDialog();if(!d)return;var snap=serializeEditor(),key=dialogHistoryKey(d),h=dialogHistories[key]||{items:[],index:-1};if(h.items[h.index]!==snap){h.items=h.items.slice(0,h.index+1);h.items.push(snap);if(h.items.length>80)h.items.shift();h.index=h.items.length-1;dialogHistories[key]=h;}d.content=snap;d.designHeight=contentHeight();d.updatedAt=Date.now();updateUndoRedo();if(typeof autoSave==='function')autoSave();
};
window.restoreHistory=function(delta){
  if(!state.dialogEditorActive)return baseRestoreHistory&&baseRestoreHistory.apply(this,arguments);var d=activeDialog();if(!d)return;var h=dialogHistories[dialogHistoryKey(d)];if(!h)return;var n=h.index+delta;if(n<0||n>=h.items.length)return;h.index=n;root.innerHTML='<div class="grid-layer" id="gridLayer"></div>'+h.items[n];bindAllNodes();if(typeof refreshStringsOnDom==='function')refreshStringsOnDom();selectNode(null);d.content=serializeEditor();updateUndoRedo();if(typeof autoSave==='function')autoSave();
};
window.updateUndoRedo=function(){
  if(!state.dialogEditorActive)return baseUpdateUndoRedo&&baseUpdateUndoRedo.apply(this,arguments);var d=activeDialog(),h=d?dialogHistories[dialogHistoryKey(d)]:null;var u=document.getElementById('undoBtn'),r=document.getElementById('redoBtn');if(u)u.disabled=!h||h.index<=0;if(r)r.disabled=!h||h.index>=h.items.length-1;
};
window.loadPage=function(id,skipSave){if(state.dialogEditorActive)exitDialogEditor(false);var p=state.pages.find(function(x){return x.id===id;});if(p)ensurePage(p);return baseLoadPage&&baseLoadPage.call(this,id,skipSave);};

/* ---------- Properties ---------- */
function buildProps(){
  if(propsModal)return;propsModal=document.createElement('div');propsModal.id='bwDialogPropsModal';propsModal.className='bw-dialog-props-backdrop';propsModal.innerHTML='<section class="bw-dialog-props"><header><div><strong>Dialog Properties</strong><small id="bwDialogPropsSub"></small></div><button id="bwDialogPropsClose">×</button></header><main id="bwDialogPropsBody"></main><footer><button id="bwDialogPropsCancel">Cancel</button><button class="primary" id="bwDialogPropsSave">Save</button></footer></section>';document.body.appendChild(propsModal);document.getElementById('bwDialogPropsClose').onclick=closeDialogProperties;document.getElementById('bwDialogPropsCancel').onclick=closeDialogProperties;document.getElementById('bwDialogPropsSave').onclick=saveDialogProperties;
}
function propField(label,id,value,type){return '<label><span>'+label+'</span><input id="'+id+'" type="'+(type||'text')+'" value="'+html(value)+'"></label>';}
function propSelect(label,id,value,opts){return '<label><span>'+label+'</span><select id="'+id+'">'+opts.map(function(o){var v=Array.isArray(o)?o[0]:o,n=Array.isArray(o)?o[1]:o;return '<option value="'+html(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+html(n)+'</option>';}).join('')+'</select></label>';}
function checkField(label,id,on){return '<label class="check"><input id="'+id+'" type="checkbox" '+(on?'checked':'')+'><span>'+label+'</span></label>';}
function openDialogProperties(id){
  buildProps();var d=dialogById(id);if(!d)return;propsModal.dataset.dialogId=id;document.getElementById('bwDialogPropsSub').textContent=d.name;var c=d.config;
  document.getElementById('bwDialogPropsBody').innerHTML='<h4>GENERAL</h4><div class="grid">'+propField('Name','bdp_name',d.name)+propField('ID','bdp_id',d.id)+'</div><h4>SIZE</h4><div class="grid">'+propField('Width','bdp_width',c.width)+propField('Height','bdp_height',c.height)+propField('Max Width','bdp_maxWidth',c.maxWidth)+propField('Max Height','bdp_maxHeight',c.maxHeight)+'</div><h4>POSITION</h4><div class="grid">'+propSelect('Position','bdp_position',c.position,[['center','Center'],['top','Top'],['bottom','Bottom'],['custom','Custom']])+propField('Custom X','bdp_customX',c.customX)+propField('Custom Y','bdp_customY',c.customY)+'</div><h4>BACKGROUND</h4><div class="grid">'+propField('Overlay Color','bdp_overlayColor',c.overlayColor,'color')+propField('Overlay Opacity','bdp_overlayOpacity',c.overlayOpacity,'number')+propField('Dialog Background','bdp_background',c.background,'color')+'</div><h4>STYLE</h4><div class="grid">'+propField('Border Radius','bdp_radius',c.borderRadius)+propField('Border','bdp_border',c.border)+propField('Shadow','bdp_shadow',c.shadow)+propField('Padding','bdp_padding',c.padding)+'</div><h4>BEHAVIOR</h4><div class="checks">'+checkField('Close on outside click','bdp_outside',c.closeOnOutside)+checkField('Close on ESC','bdp_esc',c.closeOnEsc)+checkField('Close on Back','bdp_back',c.closeOnBack)+checkField('Block page scroll','bdp_scroll',c.blockScroll)+'</div><h4>ANIMATION</h4>'+propSelect('Animation','bdp_animation',c.animation,[['none','None'],['fade','Fade'],['scale','Scale'],['slide-up','Slide Up'],['slide-down','Slide Down']]);
  propsModal.classList.add('show');
}
function closeDialogProperties(){if(propsModal)propsModal.classList.remove('show');}
function gv(id){var n=document.getElementById(id);return n?n.value:'';}
function gc(id){var n=document.getElementById(id);return !!(n&&n.checked);}
function saveDialogProperties(){
  var oldId=propsModal.dataset.dialogId,d=dialogById(oldId);if(!d)return;var newId=uniqueDialogId(gv('bdp_id')||oldId,oldId);d.name=gv('bdp_name').trim()||newId;if(newId!==oldId){d.id=newId;renameDialogRefs(oldId,newId);if(state.activeDialogId===oldId)state.activeDialogId=newId;}
  var c=d.config;c.width=cssValue(gv('bdp_width'),'320px');c.height=gv('bdp_height').trim()||'auto';if(c.height!=='auto')c.height=cssValue(c.height);c.maxWidth=cssValue(gv('bdp_maxWidth'),'90vw');c.maxHeight=cssValue(gv('bdp_maxHeight'),'80vh');c.position=gv('bdp_position')||'center';c.customX=cssValue(gv('bdp_customX'),'0px');c.customY=cssValue(gv('bdp_customY'),'0px');c.overlayColor=gv('bdp_overlayColor')||'#000000';c.overlayOpacity=Math.max(0,Math.min(1,Number(gv('bdp_overlayOpacity'))||0));c.background=gv('bdp_background')||'#ffffff';c.borderRadius=cssValue(gv('bdp_radius'),'16px');c.border=gv('bdp_border').trim()||'none';c.shadow=gv('bdp_shadow').trim()||'none';c.padding=cssValue(gv('bdp_padding'),'20px');c.closeOnOutside=gc('bdp_outside');c.closeOnEsc=gc('bdp_esc');c.closeOnBack=gc('bdp_back');c.blockScroll=gc('bdp_scroll');c.animation=gv('bdp_animation')||'none';d.updatedAt=Date.now();
  closeDialogProperties();if(state.dialogEditorActive&&state.activeDialogId===d.id){document.getElementById('bwDialogEditorName').textContent=d.name;applyDialogEditorStyle();}if(typeof autoSave==='function')autoSave();renderManager();
}

/* ---------- Dialog logic events ---------- */
function dialogFromNode(node){if(String(node||'').indexOf(DIALOG_NODE_PREFIX)!==0)return null;return dialogById(String(node).slice(DIALOG_NODE_PREFIX.length));}
window.ensurePageSchema=function(p){return ensurePage(p);};
state.pages.forEach(ensurePage);
window.ensureEventPath=function(node,event){var d=dialogFromNode(node);if(d){if(!Array.isArray(d.events[event]))d.events[event]=[];return d.events[event];}return baseEnsureEventPath?baseEnsureEventPath.apply(this,arguments):[];};
window.refreshEventNodeSelect=function(){
  if(baseRefreshEventNodeSelect)baseRefreshEventNodeSelect();var sel=document.getElementById('eventNodeSelect');if(!sel)return;var old=sel.value;dialogs().forEach(function(d){var v=DIALOG_NODE_PREFIX+d.id;if(!Array.prototype.some.call(sel.options,function(o){return o.value===v;})){var o=document.createElement('option');o.value=v;o.textContent='▣ Dialog: '+d.name;sel.appendChild(o);}});if(old&&Array.prototype.some.call(sel.options,function(o){return o.value===old;}))sel.value=old;
};
window.refreshEventTypes=function(){
  var sel=document.getElementById('eventNodeSelect'),node=sel?sel.value:'';if(!dialogFromNode(node))return baseRefreshEventTypes&&baseRefreshEventTypes.apply(this,arguments);var types=document.getElementById('eventTypeSelect'),old=types.value;types.innerHTML=DIALOG_EVENTS.map(function(e){return '<option value="'+e[0]+'">'+html(e[1])+'</option>';}).join('');if(DIALOG_EVENTS.some(function(e){return e[0]===old;}))types.value=old;if(typeof renderLogic==='function')renderLogic();
};
function buildEventModal(){
  if(eventModal)return;eventModal=document.createElement('div');eventModal.id='bwDialogEventModal';eventModal.className='bw-dialog-event-backdrop';eventModal.innerHTML='<section><header><strong>Dialog Logic</strong><button id="bwDialogEventClose">×</button></header><div id="bwDialogEventList"></div></section>';document.body.appendChild(eventModal);document.getElementById('bwDialogEventClose').onclick=function(){eventModal.classList.remove('show');};document.getElementById('bwDialogEventList').onclick=function(e){var b=e.target.closest('[data-dialog-event]');if(!b)return;openDialogLogic(eventModal.dataset.dialogId,b.dataset.dialogEvent);};
}
function openDialogEventChooser(id){buildEventModal();var d=dialogById(id);if(!d)return;if(!state.dialogEditorActive||state.activeDialogId!==id){enterDialogEditor(id);d=dialogById(id);}eventModal.dataset.dialogId=id;document.getElementById('bwDialogEventList').innerHTML=DIALOG_EVENTS.map(function(e){return '<button data-dialog-event="'+e[0]+'"><span>‹›</span><span><b>'+html(e[1])+'</b><small>'+((d.events[e[0]]||[]).length)+' bloco(s)</small></span><span>›</span></button>';}).join('');eventModal.classList.add('show');}
function openDialogLogic(id,event){
  var d=dialogById(id);if(!d)return;if(eventModal)eventModal.classList.remove('show');refreshEventNodeSelect();var ns=document.getElementById('eventNodeSelect');ns.value=DIALOG_NODE_PREFIX+d.id;refreshEventTypes();document.getElementById('eventTypeSelect').value=event;state.logicMode='event';if(typeof renderLogic==='function')renderLogic();var meta=DIALOG_EVENTS.filter(function(x){return x[0]===event;})[0];if(window.BrotwareSketchLogic&&BrotwareSketchLogic.open)BrotwareSketchLogic.open(meta?meta[1]:event,d.name+' · Dialog event');
}

/* ---------- Dialog blocks ---------- */
BLOCK_META.showDialog={name:'showDialog',icon:'▣',cls:'ui'};BLOCK_META.closeDialog={name:'closeDialog',icon:'×',cls:'ui'};BLOCK_META.toggleDialog={name:'toggleDialog',icon:'◐',cls:'ui'};
window.newBlock=function(type){var b=baseNewBlock?baseNewBlock.apply(this,arguments):{id:uid('block'),type:type,props:{},children:[],elseChildren:[]};if(type==='showDialog'||type==='closeDialog'||type==='toggleDialog'){b.props=b.props||{};b.props.dialogId=dialogs().length?dialogs()[0].id:'';b.__swCategory='view';}return b;};
window.blockSummary=function(block){if(block&&(block.type==='showDialog'||block.type==='closeDialog'||block.type==='toggleDialog'))return block.props&&block.props.dialogId||'Selecione um Dialog';return baseBlockSummary?baseBlockSummary.apply(this,arguments):'';};
function dialogOptions(selected){var out='<option value="">Selecione</option>';dialogs().forEach(function(d){out+='<option value="'+html(d.id)+'" '+(d.id===selected?'selected':'')+'>'+html(d.name)+'</option>';});return out;}
window.openBlockEditor=function(id){var f=typeof findBlock==='function'?findBlock(id):null;if(f&&(f.block.type==='showDialog'||f.block.type==='closeDialog'||f.block.type==='toggleDialog')){state.editingBlockId=id;var b=f.block;document.getElementById('blockModalTitle').textContent=BLOCK_META[b.type].name;document.getElementById('blockModalSubtitle').textContent='Escolha o Dialog da página';document.getElementById('blockEditorFields').innerHTML='<div class="block-config-grid"><label class="field span-2"><span>Dialog</span><select id="bf_dialogId">'+dialogOptions(b.props.dialogId)+'</select></label></div>';openModal('blockModal');return;}return baseOpenBlockEditor&&baseOpenBlockEditor.apply(this,arguments);};
window.saveBlockEditor=function(){var f=typeof findBlock==='function'?findBlock(state.editingBlockId):null;if(f&&(f.block.type==='showDialog'||f.block.type==='closeDialog'||f.block.type==='toggleDialog')){var n=document.getElementById('bf_dialogId');f.block.props.dialogId=n?n.value:'';closeModal('blockModal');if(typeof saveLogic==='function')saveLogic();if(typeof renderLogic==='function')renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();return;}return baseSaveBlockEditor&&baseSaveBlockEditor.apply(this,arguments);};
function addDialogBlock(type){if(!dialogs().length){if(typeof toast==='function')toast('Crie um Dialog primeiro');return;}insertBlock(newBlock(type),'root');if(typeof saveLogic==='function')saveLogic();if(typeof renderLogic==='function')renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();}
function installBlockButtons(){
  var lib=document.querySelector('.blocks-library');if(lib&&!document.getElementById('bwDialogLegacyBlocks')){var box=document.createElement('div');box.id='bwDialogLegacyBlocks';box.innerHTML='<div class="block-category ui">Dialogs</div><button class="block-template ui" data-bw-dialog-block="showDialog"><span>▣</span><b>showDialog</b><small>Abrir Dialog</small></button><button class="block-template ui" data-bw-dialog-block="closeDialog"><span>×</span><b>closeDialog</b><small>Fechar Dialog</small></button><button class="block-template ui" data-bw-dialog-block="toggleDialog"><span>◐</span><b>toggleDialog</b><small>Alternar Dialog</small></button>';lib.appendChild(box);box.onclick=function(e){var b=e.target.closest('[data-bw-dialog-block]');if(b)addDialogBlock(b.dataset.bwDialogBlock);};}
  var sw=document.getElementById('swLogicOverlay');if(sw&&!quickBlocks){quickBlocks=document.createElement('div');quickBlocks.className='bw-dialog-block-quick';quickBlocks.innerHTML='<span>Dialog</span><button data-bw-dialog-block="showDialog">show</button><button data-bw-dialog-block="closeDialog">close</button><button data-bw-dialog-block="toggleDialog">toggle</button>';sw.appendChild(quickBlocks);quickBlocks.onclick=function(e){var b=e.target.closest('[data-bw-dialog-block]');if(b)addDialogBlock(b.dataset.bwDialogBlock);};}
}

/* ---------- Runtime / export ---------- */
function cleanDialogContent(d){
  var holder=document.createElement('div');holder.innerHTML=d.content||'';holder.querySelectorAll('.resize-handle,#gridLayer').forEach(function(x){x.remove();});holder.querySelectorAll('.selected,.drop-target').forEach(function(n){n.classList.remove('selected','drop-target');});holder.querySelectorAll('[data-bound]').forEach(function(n){n.removeAttribute('data-bound');});return holder.innerHTML;
}
function dialogPositionStyle(c){if(c.position==='top')return'align-items:flex-start;padding-top:24px;';if(c.position==='bottom')return'align-items:flex-end;padding-bottom:24px;';if(c.position==='custom')return'align-items:flex-start;justify-content:flex-start;padding-left:'+cssValue(c.customX,'0px')+';padding-top:'+cssValue(c.customY,'0px')+';';return'align-items:center;';}
function dialogMarkup(pageObj){
  ensurePage(pageObj);if(!pageObj.dialogs.length)return'';var css='<style data-brot-dialog-css>'+runtimeCss()+'</style>';var markup=pageObj.dialogs.map(function(d){var c=d.config,style='--brot-overlay:'+hexToRgba(c.overlayColor,c.overlayOpacity)+';--brot-bg:'+c.background+';--brot-width:'+c.width+';--brot-height:'+c.height+';--brot-max-width:'+c.maxWidth+';--brot-max-height:'+c.maxHeight+';--brot-radius:'+c.borderRadius+';--brot-border:'+c.border+';--brot-shadow:'+c.shadow+';--brot-padding:'+c.padding+';'+dialogPositionStyle(c);return '<div id="'+html(d.id)+'" class="brot-dialog-overlay brot-anim-'+html(c.animation)+'" data-brot-dialog="'+html(d.id)+'" aria-hidden="true" style="'+style+'"><div class="brot-dialog" role="dialog" aria-modal="true"><div class="brot-dialog-content" style="min-height:'+Math.max(0,d.designHeight||0)+'px">'+cleanDialogContent(d)+'</div></div></div>';}).join('');return css+markup;
}
function runtimeCss(){return '.brot-dialog-overlay{position:fixed;inset:0;z-index:10000;display:none;justify-content:center;background:var(--brot-overlay);padding-left:12px;padding-right:12px;box-sizing:border-box}.brot-dialog-overlay.brot-open,.brot-dialog-overlay.brot-closing{display:flex}.brot-dialog{position:relative;width:var(--brot-width);height:var(--brot-height);max-width:min(var(--brot-max-width),calc(100vw - 24px));max-height:min(var(--brot-max-height),calc(100dvh - 32px));overflow:auto;background:var(--brot-bg);border-radius:var(--brot-radius);border:var(--brot-border);box-shadow:var(--brot-shadow);padding:var(--brot-padding);box-sizing:border-box}.brot-dialog-content{position:relative;width:100%;min-width:0}.brot-dialog-content>.vf-node{position:absolute}.brot-dialog-overlay.brot-anim-fade .brot-dialog{transition:opacity .2s ease}.brot-dialog-overlay.brot-anim-scale .brot-dialog{transition:opacity .2s ease,transform .2s ease}.brot-dialog-overlay.brot-anim-slide-up .brot-dialog,.brot-dialog-overlay.brot-anim-slide-down .brot-dialog{transition:opacity .22s ease,transform .22s ease}.brot-dialog-overlay:not(.brot-open).brot-anim-fade .brot-dialog{opacity:0}.brot-dialog-overlay:not(.brot-open).brot-anim-scale .brot-dialog{opacity:0;transform:scale(.94)}.brot-dialog-overlay:not(.brot-open).brot-anim-slide-up .brot-dialog{opacity:0;transform:translateY(30px)}.brot-dialog-overlay:not(.brot-open).brot-anim-slide-down .brot-dialog{opacity:0;transform:translateY(-30px)}@media(max-width:520px){.brot-dialog-overlay{padding-left:10px;padding-right:10px}.brot-dialog{max-width:calc(100vw - 20px)!important;max-height:calc(100dvh - 20px)!important}}';}
window.cleanupExportDom=function(pageObj){var base=baseCleanupExportDom?baseCleanupExportDom.apply(this,arguments):'';return base+dialogMarkup(pageObj);};
function runtimeInjection(pageObj){
  ensurePage(pageObj);var defs=JSON.stringify(pageObj.dialogs.map(function(d){return{id:d.id,config:d.config,events:d.events};}));
  return "\nvar dialogDefs="+defs+";document.querySelectorAll('[data-brot-dialog]').forEach(function(el){if(el.parentElement!==document.body)document.body.appendChild(el)});var dialogMap={};dialogDefs.forEach(function(d){dialogMap[d.id]=d;});var openDialogs=[];var oldBodyOverflow='';function dialogEl(id){return document.querySelector('[data-brot-dialog=\"'+String(id).replace(/\"/g,'\\\\\"')+'\"]')}function syncScroll(){var lock=openDialogs.some(function(id){var d=dialogMap[id];return d&&d.config&&d.config.blockScroll});if(lock){if(!document.body.dataset.brotDialogScroll){oldBodyOverflow=document.body.style.overflow||'';document.body.dataset.brotDialogScroll='1'}document.body.style.overflow='hidden'}else if(document.body.dataset.brotDialogScroll){document.body.style.overflow=oldBodyOverflow;delete document.body.dataset.brotDialogScroll}}async function showDialogRuntime(id){var d=dialogMap[id],el=dialogEl(id);if(!d||!el)return;if(openDialogs.indexOf(id)<0)openDialogs.push(id);el.classList.remove('brot-closing');el.classList.add('brot-open');el.setAttribute('aria-hidden','false');syncScroll();if(d.config&&d.config.closeOnBack){try{history.pushState({brotDialog:id},'',location.href)}catch(_){}}await run((d.events&&d.events.open)||[])}async function closeDialogRuntime(id,reason){var d=dialogMap[id],el=dialogEl(id);if(!d||!el||!el.classList.contains('brot-open'))return;el.classList.remove('brot-open');el.classList.add('brot-closing');openDialogs=openDialogs.filter(function(x){return x!==id});syncScroll();setTimeout(function(){el.classList.remove('brot-closing');el.setAttribute('aria-hidden','true')},230);await run((d.events&&d.events.close)||[])}async function toggleDialogRuntime(id){var el=dialogEl(id);if(el&&el.classList.contains('brot-open'))await closeDialogRuntime(id,'toggle');else await showDialogRuntime(id)}var BrotDialogs={show:showDialogRuntime,close:closeDialogRuntime,toggle:toggleDialogRuntime};window.BrotDialogs=BrotDialogs;dialogDefs.forEach(function(d){var el=dialogEl(d.id);if(!el)return;el.addEventListener('click',async function(e){if(e.target!==el)return;await run((d.events&&d.events.outside)||[]);if(d.config&&d.config.closeOnOutside)await closeDialogRuntime(d.id,'outside')})});document.addEventListener('keydown',function(e){if(e.key!=='Escape'||!openDialogs.length)return;var id=openDialogs[openDialogs.length-1],d=dialogMap[id];if(d&&d.config&&d.config.closeOnEsc)closeDialogRuntime(id,'esc')});window.addEventListener('popstate',function(){if(!openDialogs.length)return;var id=openDialogs[openDialogs.length-1],d=dialogMap[id];if(!d)return;run((d.events&&d.events.back)||[]);if(d.config&&d.config.closeOnBack)closeDialogRuntime(id,'back')});\n";
}
window.runtimeScriptForPage=function(pageObj){
  var code=baseRuntimeScriptForPage?baseRuntimeScriptForPage.apply(this,arguments):'';if(!pageObj||!pageObj.dialogs||!pageObj.dialogs.length)return code;
  code=code.replace("else if(b.type==='callFunction')", "else if(b.type==='showDialog'){await BrotDialogs.show(p.dialogId)}else if(b.type==='closeDialog'){await BrotDialogs.close(p.dialogId)}else if(b.type==='toggleDialog'){await BrotDialogs.toggle(p.dialogId)}else if(b.type==='callFunction')");
  var marker="Object.keys(cfg.events||{}).forEach";if(code.indexOf(marker)>=0)code=code.replace(marker,runtimeInjection(pageObj)+marker);return code;
};
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){var b=blocks[i],p=b.props||{};if(b.type==='showDialog'||b.type==='closeDialog'||b.type==='toggleDialog'){if(window.BrotwareDialogs&&BrotwareDialogs.previewAction)await BrotwareDialogs.previewAction(b.type,p.dialogId,ctx);continue;}if(baseExecuteBlocks)await baseExecuteBlocks([b],ctx);}
};

/* ---------- Editor preview of dialog blocks ---------- */
function previewAction(type,id){
  var d=dialogById(id);if(!d){if(typeof toast==='function')toast('Dialog não encontrado');return Promise.resolve();}
  var old=document.getElementById('bwDialogLivePreview');if(old)old.remove();if(type==='closeDialog'){return Promise.resolve();}
  if(type==='toggleDialog'&&old){old.remove();return Promise.resolve();}
  var o=document.createElement('div');o.id='bwDialogLivePreview';o.className='bw-dialog-live-preview';o.style.background=hexToRgba(d.config.overlayColor,d.config.overlayOpacity);o.innerHTML='<div class="bw-dialog-live-card" style="background:'+d.config.background+';border-radius:'+d.config.borderRadius+';padding:'+d.config.padding+';max-width:'+d.config.maxWidth+';max-height:'+d.config.maxHeight+';box-shadow:'+d.config.shadow+'"><div style="position:relative;width:'+editorPixelWidth(d)+'px;max-width:100%;height:'+d.designHeight+'px">'+cleanDialogContent(d)+'</div></div>';document.body.appendChild(o);o.onclick=function(e){if(e.target===o)o.remove();};return Promise.resolve();
}
function hexToRgba(color,opacity){
  color=String(color||'#000000');opacity=Math.max(0,Math.min(1,Number(opacity)));var m=color.replace('#','');if(m.length===3)m=m.split('').map(function(x){return x+x;}).join('');if(!/^[0-9a-f]{6}$/i.test(m))return'rgba(0,0,0,'+opacity+')';return'rgba('+parseInt(m.slice(0,2),16)+','+parseInt(m.slice(2,4),16)+','+parseInt(m.slice(4,6),16)+','+opacity+')';
}

/* ---------- Entrypoints ---------- */
function installToolbar(){
  var tb=document.querySelector('.designer-toolbar');if(tb&&!document.getElementById('bwDialogsBtn')){var b=document.createElement('button');b.type='button';b.id='bwDialogsBtn';b.className='tool-pill';b.textContent='Dialogs';var sep=tb.querySelector('.designer-spacer');tb.insertBefore(b,sep||tb.firstChild);b.onclick=openManager;}
  installBlockButtons();
}
function install(){ensurePage(page());buildManager();buildProps();buildEventModal();buildEditorBar();installToolbar();refreshEventNodeSelect();}
window.BrotwareDialogs={openManager:openManager,create:createDialog,edit:enterDialogEditor,exit:exitDialogEditor,properties:openDialogProperties,logic:openDialogEventChooser,previewAction:previewAction,get:function(id){return dialogById(id);}};
setTimeout(install,0);setTimeout(install,300);setTimeout(install,1000);
})();
