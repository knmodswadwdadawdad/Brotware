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

function ensureFont(){
  if(document.getElementById('bwGoogleUiIconsFont'))return;
  var l=document.createElement('link');l.id='bwGoogleUiIconsFont';l.rel='stylesheet';l.href=FONT_URL;document.head.appendChild(l);
}
function span(name,extra){var s=document.createElement('span');s.className='bw-google-icon'+(extra?' '+extra:'');s.textContent=name;return s;}
function replaceOnlyIcon(el,name){if(!el||el.dataset.bwGoogleIcon===name)return;el.innerHTML='';el.appendChild(span(name));el.dataset.bwGoogleIcon=name;}
function replaceSlot(el,name){if(!el)return;if(el.dataset.bwGoogleIcon===name&&el.classList.contains('bw-google-icon'))return;el.textContent=name;el.classList.add('bw-google-icon');el.dataset.bwGoogleIcon=name;}

function staticButtons(){
  [
    ['backBtn','arrow_back'],['undoBtn','undo'],['redoBtn','redo'],['saveBtn','save'],['runBtn','play_arrow'],['codeBtn','code'],
    ['bwMobileBack','arrow_back'],['bwMobileRun','play_arrow'],['bwMobileMore','more_vert'],['bwMobileSheetClose','close'],['bwMobileSelectionClose','close'],
    ['bwDesktopZoomOut','remove'],['bwDesktopZoomIn','add'],['bwMobileZoomOut','remove'],['bwMobileZoomIn','add'],['bwConfigTopBtn','settings'],
    ['bwConfigClose','arrow_back'],['bwConfigDetailBack','arrow_back']
  ].forEach(function(x){replaceOnlyIcon(document.getElementById(x[0]),x[1]);});
}
function bottomNav(){document.querySelectorAll('[data-bw-mobile-nav]').forEach(function(b){var n=NAV[b.dataset.bwMobileNav],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function menus(){document.querySelectorAll('[data-bw-mobile-action]').forEach(function(b){var n=MORE[b.dataset.bwMobileAction],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function addPalette(){document.querySelectorAll('[data-bw-mobile-add]').forEach(function(b){var n=ADD[b.dataset.bwMobileAdd],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});}
function quickProps(){
  document.querySelectorAll('[data-mquick-action]').forEach(function(b){var n=QUICK[b.dataset.mquickAction],i=b.querySelector('.ico');if(n&&i)replaceSlot(i,n);});
  document.querySelectorAll('[data-mprops-action]').forEach(function(b){var n=QUICK[b.dataset.mpropsAction],i=b.querySelector('.bw-mprops-icon,.ico');if(n&&i)replaceSlot(i,n);});
}
function selection(){var i=document.querySelector('#bwMobileSelectionTarget > span:first-child');if(i)replaceSlot(i,'widgets');}
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
function misc(){
  var p=document.querySelector('.bw-mobile-nav[data-bw-mobile-nav="logic"] .ico');if(p)replaceSlot(p,'bolt');
  var v=document.getElementById('bwDesktopViewport');if(v&&v.dataset.bwGoogleDecorated!=='1'){v.dataset.bwGoogleDecorated='1';}
}
function apply(){ensureFont();staticButtons();bottomNav();menus();addPalette();quickProps();selection();configuration();eventNavigation();misc();}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,20);}

ensureFont();apply();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',schedule);
setTimeout(apply,300);setTimeout(apply,1000);
window.BrotwareGoogleUiIcons={refresh:apply};
})();
