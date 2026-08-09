(function(){
'use strict';

var FONT_URL='https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';
var timer=null;

var NAV={add:'add',layers:'layers',logic:'bolt',settings:'settings'};
var MORE={design:'dashboard',dialogs:'web_asset',pages:'description',components:'widgets',strings:'text_fields',undo:'undo',redo:'redo',code:'code',save:'save'};
var ADD={
  'linear-h':'view_week','linear-v':'view_stream',relative:'select_all',card:'crop_portrait',scroll:'swap_vert',
  text:'text_fields',button:'smart_button',image:'image',input:'input',textarea:'notes',select:'arrow_drop_down_circle',checkbox:'check_box',link:'link',progress:'linear_scale',divider:'horizontal_rule',
  grid:'grid_view',stack:'layers',radio:'radio_button_checked',switch:'toggle_on',range:'tune',number:'pin',date:'calendar_month',icon:'star',badge:'sell',video:'movie',audio:'music_note',iframe:'web',spacer:'space_bar'
};
var QUICK={
  custom:'code',convert:'swap_horiz',width:'width',height:'height',all:'more_horiz',image:'image',scale:'aspect_ratio',layoutGravity:'open_with',gravity:'center_focus_strong',backgroundResource:'wallpaper',background:'palette',text:'text_fields',textColor:'format_color_text',position:'open_with',padding:'padding',margin:'margin',border:'border_outer',radius:'rounded_corner',fontSize:'format_size',events:'bolt'
};
var CONFIG={
  components:'widgets',pages:'web',images:'image',animations:'animation',audio:'music_note',fonts:'font_download',scripts:'code',styles:'palette',resources:'folder',assets:'inventory_2',manifest:'web_asset',browser:'language',blocks:'functions',build:'package_2',collections:'collections_bookmark',
  designs:'dashboard_customize',libraries:'library_books'
};
var EVENT_RAIL={activity:'web_asset',view:'widgets',component:'extension',drawer:'menu_open',moreblock:'functions'};
var LAYER_TYPES={
  text:'text_fields',button:'smart_button',input:'input',textarea:'notes',image:'image',link:'link',checkbox:'check_box',select:'arrow_drop_down_circle',progress:'linear_scale',divider:'horizontal_rule',
  'linear-h':'view_week','linear-v':'view_stream',relative:'select_all',card:'crop_portrait',scroll:'swap_vert',grid:'grid_view',stack:'layers',radio:'radio_button_checked',switch:'toggle_on',range:'tune',number:'pin',date:'calendar_month',icon:'star',badge:'sell',video:'movie',audio:'music_note',iframe:'web',spacer:'space_bar'
};

function ensureFont(){
  if(document.getElementById('bwGoogleUiIconsFont'))return;
  var l=document.createElement('link');l.id='bwGoogleUiIconsFont';l.rel='stylesheet';l.href=FONT_URL;document.head.appendChild(l);
}
function span(name,extra){var s=document.createElement('span');s.className='bw-google-icon'+(extra?' '+extra:'');s.textContent=name;return s;}
function replaceOnlyIcon(el,name){if(!el||el.dataset.bwGoogleIcon===name)return;el.innerHTML='';el.appendChild(span(name));el.dataset.bwGoogleIcon=name;}
function replaceSlot(el,name){if(!el)return;if(el.dataset.bwGoogleIcon===name&&el.classList.contains('bw-google-icon'))return;el.textContent=name;el.classList.add('bw-google-icon');el.dataset.bwGoogleIcon=name;}
function prependIcon(el,name,label){if(!el)return;if(el.dataset.bwGoogleCompound===name)return;el.innerHTML='';el.appendChild(span(name));if(label){var s=document.createElement('span');s.textContent=label;el.appendChild(s);}el.dataset.bwGoogleCompound=name;}
function selectedType(){try{var n=typeof selectedNode==='function'?selectedNode():null;return n&&n.dataset?n.dataset.type:'';}catch(_){return'';}}
function typeIcon(type){return LAYER_TYPES[type]||'widgets';}

function staticButtons(){
  [
    ['backBtn','arrow_back'],['undoBtn','undo'],['redoBtn','redo'],['saveBtn','save'],['runBtn','play_arrow'],['codeBtn','code'],
    ['bwMobileBack','arrow_back'],['bwMobileRun','play_arrow'],['bwMobileMore','more_vert'],['bwMobileSheetClose','close'],['bwMobileSelectionClose','close'],
    ['bwDesktopZoomOut','remove'],['bwDesktopZoomIn','add'],['bwMobileZoomOut','remove'],['bwMobileZoomIn','add'],['bwConfigTopBtn','settings'],
    ['bwConfigClose','arrow_back'],['bwConfigDetailBack','arrow_back'],['bwLayersClose','close'],['bwLayersCollapseAll','collapse_all'],
    ['bwViewMgrClose','arrow_back'],['bwViewMgrRefresh','refresh'],['newPageBtn','note_add'],['pagesBtn','description'],['pageSelectorBtn','web'],['gridBtn','grid_on'],['propertiesBtn','tune']
  ].forEach(function(x){replaceOnlyIcon(document.getElementById(x[0]),x[1]);});
}
function bottomNav(){document.querySelectorAll('[data-bw-mobile-nav]').forEach(function(b){var n=NAV[b.dataset.bwMobileNav],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function menus(){document.querySelectorAll('[data-bw-mobile-action]').forEach(function(b){var n=MORE[b.dataset.bwMobileAction],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function addPalette(){document.querySelectorAll('[data-bw-mobile-add]').forEach(function(b){var n=ADD[b.dataset.bwMobileAdd],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function quickProps(){
  document.querySelectorAll('[data-mquick-action]').forEach(function(b){var n=QUICK[b.dataset.mquickAction],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});
  document.querySelectorAll('[data-mprops-action]').forEach(function(b){var n=QUICK[b.dataset.mpropsAction],i=b.querySelector('.bw-mprops-icon,.ico');if(n&&i)replaceSlot(i,n);});
  document.querySelectorAll('[data-mquick-event] .ico,.bw-mquick-event-card .ico').forEach(function(i){replaceSlot(i,'bolt');});
  var target=document.querySelector('#bwMQuickTarget .ico');if(target)replaceSlot(target,typeIcon(selectedType()));
  replaceOnlyIcon(document.getElementById('bwMQuickDelete'),'delete');
  replaceOnlyIcon(document.getElementById('bwMQuickSave'),'bookmark_add');
  var chev=document.querySelector('#bwMQuickTarget .chev');if(chev)replaceSlot(chev,'arrow_drop_down');
}
function selection(){
  var i=document.querySelector('#bwMobileSelectionTarget > span:first-child');if(i)replaceSlot(i,typeIcon(selectedType()));
  var c=document.querySelector('#bwMobileSelectionTarget > span:last-child');if(c)replaceSlot(c,'arrow_drop_down');
}
function configuration(){
  document.querySelectorAll('.bw-config-card[data-manager]').forEach(function(card){var name=CONFIG[card.dataset.manager],slot=card.querySelector('.bw-config-icon');if(name&&slot)replaceSlot(slot,name);});
  document.querySelectorAll('.bw-config-card[data-bw-cv4-manager]').forEach(function(card){var name=CONFIG[card.dataset.bwCv4Manager],slot=card.querySelector('.bw-config-icon');if(name&&slot)replaceSlot(slot,name);});
  document.querySelectorAll('.bw-config-card .chev').forEach(function(c){replaceSlot(c,'chevron_right');});
}
function eventNavigation(){
  document.querySelectorAll('#skEventRail .sk-event-cat[data-sk-cat]').forEach(function(btn){var name=EVENT_RAIL[btn.dataset.skCat],slot=btn.querySelector('.ico');if(name&&slot)replaceSlot(slot,name);});
  document.querySelectorAll('#skEventCards .sk-event-card .chev').forEach(function(c){replaceSlot(c,'chevron_right');});
  document.querySelectorAll('#skEventCards .bw-mb-edit-card').forEach(function(b){var old=b.querySelector('.bw-google-icon');if(!old)replaceOnlyIcon(b,'edit');});
}
function layers(){
  var search=document.querySelector('.bw-layers-search > span');if(search)replaceSlot(search,'search');
  document.querySelectorAll('#bwLayersList .bw-layer-row').forEach(function(row){
    var id=row.dataset.layerId||'',slot=row.querySelector('.bw-layer-icon'),type='';
    if(id==='@root')type='html';
    else{try{var n=root&&root.querySelector('[data-vf-id="'+String(id).replace(/(["\\])/g,'\\$1')+'"]');type=n&&n.dataset?n.dataset.type:'';}catch(_){}}
    if(slot)replaceSlot(slot,id==='@root'?'html':typeIcon(type));
    var toggle=row.querySelector('.bw-layer-toggle:not(.empty)');
    if(toggle){var opened=!!(row.nextElementSibling&&row.nextElementSibling.classList&&row.nextElementSibling.classList.contains('bw-layer-children'));replaceOnlyIcon(toggle,opened?'expand_more':'chevron_right');}
    var grip=row.querySelector('.bw-layer-grip');if(grip)replaceSlot(grip,'drag_indicator');
  });
  var layersBtn=document.getElementById('bwLayersBtn');if(layersBtn&&String(layersBtn.textContent||'').toLowerCase().indexOf('layers')>=0)prependIcon(layersBtn,'layers','Layers');
}
function viewManager(){
  document.querySelectorAll('[data-vm-edit-page],[data-vm-edit-dialog]').forEach(function(b){replaceOnlyIcon(b,'settings');});
  document.querySelectorAll('.bw-viewmgr-create-choice').forEach(function(b){var slot=b.querySelector('.ico');if(!slot)return;replaceSlot(slot,b.dataset.vmCreateKind==='dialog'?'web_asset':'web');});
  var create=document.getElementById('bwViewMgrCreate');if(create&&String(create.textContent||'').trim()){var txt=String(create.textContent||'').replace(/^\s*[＋+]\s*/,'');prependIcon(create,'add',txt);}
}
function misc(){
  var p=document.querySelector('.bw-mobile-nav[data-bw-mobile-nav="logic"] .ico');if(p)replaceSlot(p,'bolt');
  var v=document.getElementById('bwDesktopViewport');if(v&&v.dataset.bwGoogleDecorated!=='1'){v.dataset.bwGoogleDecorated='1';}
}
function apply(){ensureFont();staticButtons();bottomNav();menus();addPalette();quickProps();selection();configuration();eventNavigation();layers();viewManager();misc();}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,20);}

ensureFont();apply();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',schedule);
setTimeout(apply,300);setTimeout(apply,1000);
window.BrotwareGoogleUiIcons={refresh:apply};
})();