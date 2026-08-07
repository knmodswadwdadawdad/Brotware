(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
var tray=null,cards=null,tabs=null,nameEl=null;
var activeTab='basic';
var RECENT_KEY='brotware_mobile_recent_properties_v1';
var baseSelectNode=window.selectNode;
var TYPE_NAMES={text:'TextView',button:'Button',input:'Input',textarea:'TextArea',image:'ImageView',link:'Link',checkbox:'CheckBox',select:'Select',progress:'ProgressBar',divider:'Divider','linear-h':'Linear Horizontal','linear-v':'Linear Vertical',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView'};
var ACTIONS={
  custom:{icon:'‹›',label:'Custom\nattributes'},convert:{icon:'◉',label:'Convert'},width:{icon:'↔',label:'Width'},height:{icon:'↕',label:'Height'},all:{icon:'•••',label:'See All',primary:true},
  image:{icon:'▧',label:'Image'},scale:{icon:'↗',label:'Scale type'},layoutGravity:{icon:'⌘',label:'Layout gravity'},gravity:{icon:'⌘',label:'Gravity'},backgroundResource:{icon:'◌',label:'Background\nresource'},background:{icon:'◉',label:'Background\ncolor'},
  text:{icon:'T',label:'Text'},textColor:{icon:'A',label:'Text color'},position:{icon:'⌖',label:'Position'},padding:{icon:'▣',label:'Padding'},margin:{icon:'⌞',label:'Margin'},border:{icon:'□',label:'Border'},radius:{icon:'◯',label:'Radius'}
};

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function typeName(el){return TYPE_NAMES[el&&el.dataset.type]||String(el&&el.dataset.type||'View');}
function isLeaf(el){return !!(el&&(!window.isLayout||!isLayout(el.dataset.type)));}
function readRecent(){try{var a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}}
function remember(action){if(!ACTIONS[action]||action==='all'||action==='convert'||action==='custom')return;var a=readRecent().filter(function(x){return x!==action;});a.unshift(action);a=a.slice(0,8);try{localStorage.setItem(RECENT_KEY,JSON.stringify(a));}catch(e){} }

function build(){
  if(tray)return;
  tray=document.createElement('section');tray.id='bwMobileQuickProperties';tray.className='bw-mquick';
  tray.innerHTML='<header class="bw-mquick-head"><button class="bw-mquick-target" id="bwMQuickTarget" type="button"><span class="ico">▧</span><b id="bwMQuickName">view</b><span class="chev">▾</span></button><button class="bw-mquick-iconbtn" id="bwMQuickDelete" type="button" title="Delete">⌫</button><button class="bw-mquick-iconbtn" id="bwMQuickSave" type="button" title="Save component">▣</button></header><nav class="bw-mquick-tabs" id="bwMQuickTabs"><button class="bw-mquick-tab active" data-mquick-tab="basic" type="button">Basic</button><button class="bw-mquick-tab" data-mquick-tab="recent" type="button">Recent</button><button class="bw-mquick-tab" data-mquick-tab="event" type="button">Event</button></nav><main class="bw-mquick-scroll" id="bwMQuickCards"></main>';
  document.body.appendChild(tray);cards=document.getElementById('bwMQuickCards');tabs=document.getElementById('bwMQuickTabs');nameEl=document.getElementById('bwMQuickName');
  document.getElementById('bwMQuickTarget').onclick=function(){if(window.BrotwareViewSelector&&BrotwareViewSelector.open)BrotwareViewSelector.open();};
  document.getElementById('bwMQuickDelete').onclick=function(){var el=selected();if(!el)return;if(confirm('Excluir '+el.dataset.vfId+'?')){if(typeof deleteSelected==='function')deleteSelected(false);}};
  document.getElementById('bwMQuickSave').onclick=function(){if(typeof saveSelectedComponent==='function')saveSelectedComponent();};
  tabs.addEventListener('click',function(e){var b=e.target.closest('[data-mquick-tab]');if(!b)return;activeTab=b.dataset.mquickTab;render();});
  cards.addEventListener('click',function(e){var b=e.target.closest('[data-mquick-action]');if(b)runAction(b.dataset.mquickAction);var ev=e.target.closest('[data-mquick-event]');if(ev)openEvent(ev.dataset.mquickEvent);});
}

function basicActions(el){
  var typ=el.dataset.type||'',a=['custom'];if(isLeaf(el))a.push('convert');a.push('width','height','all');
  if(typ==='image')a.push('image','scale','layoutGravity','backgroundResource','background','position','padding','margin','border','radius');
  else if(['text','button','input','textarea','link','checkbox','select'].indexOf(typ)>=0)a.push('text','gravity','layoutGravity','textColor','backgroundResource','background','position','padding','margin','border','radius');
  else a.push('layoutGravity','backgroundResource','background','position','padding','margin','border','radius');
  return a;
}
function availableAction(action,el){if(!ACTIONS[action])return false;if(action==='image'||action==='scale')return el.dataset.type==='image';if(action==='gravity'||action==='text'||action==='textColor')return ['text','button','input','textarea','link','checkbox','select'].indexOf(el.dataset.type)>=0;if(action==='convert')return isLeaf(el);return true;}
function cardHtml(action){var m=ACTIONS[action];if(!m)return'';return '<button class="bw-mquick-card'+(m.primary?' primary':'')+'" type="button" data-mquick-action="'+esc(action)+'"><span class="ico">'+m.icon+'</span><b>'+esc(m.label).replace(/\n/g,'<br>')+'</b></button>';}
function eventList(el){var key=el.dataset.type==='input'||el.dataset.type==='textarea'?'input':el.dataset.type==='checkbox'?'checkbox':el.dataset.type==='select'?'select':'default';var arr=(typeof EVENT_OPTIONS!=='undefined'&&EVENT_OPTIONS[key])||[];return arr;}
function render(){
  build();var el=selected();if(!mq.matches||!el){if(tray)tray.style.display='';return;}nameEl.textContent=el.dataset.vfId||'View';var ic=tray.querySelector('.bw-mquick-target .ico');if(ic)ic.textContent=el.dataset.type==='image'?'▧':(window.isLayout&&isLayout(el.dataset.type)?'▦':'▣');
  tray.querySelectorAll('[data-mquick-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.mquickTab===activeTab);});
  var html='';
  if(activeTab==='basic')basicActions(el).forEach(function(a){if(availableAction(a,el))html+=cardHtml(a);});
  else if(activeTab==='recent'){var r=readRecent().filter(function(a){return availableAction(a,el);});if(!r.length)html='<div class="bw-mquick-empty">As propriedades usadas recentemente aparecem aqui.</div>';else r.forEach(function(a){html+=cardHtml(a);});}
  else{var evs=eventList(el);html+='<button class="bw-mquick-card bw-mquick-event-card primary" type="button" data-mquick-action="events"><span class="ico">⚡</span><b>All Events</b></button>';evs.forEach(function(x){html+='<button class="bw-mquick-card bw-mquick-event-card" type="button" data-mquick-event="'+esc(x[0])+'"><span class="ico">⚡</span><b>'+esc(x[1])+'</b></button>';});}
  cards.innerHTML=html;
}

function openFull(){if(window.BrotwareMobileProperties&&BrotwareMobileProperties.open)BrotwareMobileProperties.open();else if(typeof openProperties==='function')openProperties();}
function runAction(a){
  var el=selected();if(!el)return;
  if(a!=='events')remember(a);
  if(a==='all'||a==='custom'||a==='position'||a==='padding'||a==='margin'||a==='background'||a==='text'||a==='textColor'||a==='border'||a==='radius'||a==='scale'){openFull();return;}
  if(a==='width'&&window.BrotwareSizeDialog){BrotwareSizeDialog.open('width');return;}
  if(a==='height'&&window.BrotwareSizeDialog){BrotwareSizeDialog.open('height');return;}
  if(a==='gravity'&&window.BrotwareGravityDialog){BrotwareGravityDialog.open();return;}
  if(a==='layoutGravity'&&window.BrotwareLayoutGravityDialog){BrotwareLayoutGravityDialog.open();return;}
  if(a==='image'&&window.BrotwareImageResourceDialog){BrotwareImageResourceDialog.openImage();return;}
  if(a==='backgroundResource'&&window.BrotwareImageResourceDialog){BrotwareImageResourceDialog.openBackground();return;}
  if(a==='convert'){openConvert(el);return;}
  if(a==='events'){openEvent(null);return;}
}
function openEvent(eventName){
  var el=selected();if(!el)return;
  if(typeof switchTab==='function')switchTab('event');
  setTimeout(function(){var ns=document.getElementById('eventNodeSelect'),es=document.getElementById('eventTypeSelect');if(ns){ns.value=el.dataset.vfId;if(typeof refreshEventTypes==='function')refreshEventTypes();}if(eventName&&es){es.value=eventName;if(typeof renderLogic==='function')renderLogic();}if(typeof showEventHome==='function')showEventHome();},30);
}

function openConvert(el){
  var old=document.getElementById('bwMQuickConvert');if(old)old.remove();var choices=[['text','TextView'],['button','Button'],['input','Input'],['textarea','TextArea'],['image','ImageView'],['link','Link'],['checkbox','CheckBox'],['select','Select']].filter(function(x){return x[0]!==el.dataset.type;});
  var back=document.createElement('div');back.id='bwMQuickConvert';back.style.cssText='position:fixed;inset:0;z-index:22000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end';back.innerHTML='<section style="width:100%;max-height:70dvh;overflow:auto;background:#111f29;border-radius:20px 20px 0 0;padding:18px 10px calc(18px + env(safe-area-inset-bottom));color:#eef5f9"><div style="font-size:15px;font-weight:700;padding:2px 5px 12px">Convert '+esc(typeName(el))+'</div><div id="bwMQuickConvertList" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"></div><button id="bwMQuickConvertCancel" style="width:100%;height:44px;margin-top:12px;border:0;border-radius:10px;background:#213541;color:#dce8ef">Cancel</button></section>';document.body.appendChild(back);var list=back.querySelector('#bwMQuickConvertList');list.innerHTML=choices.map(function(x){return'<button data-convert="'+x[0]+'" style="height:52px;border:1px solid #304653;border-radius:10px;background:#172934;color:#eaf2f7">'+x[1]+'</button>';}).join('');
  list.onclick=function(e){var b=e.target.closest('[data-convert]');if(!b)return;convertNode(el,b.dataset.convert);back.remove();};back.querySelector('#bwMQuickConvertCancel').onclick=function(){back.remove();};back.onclick=function(e){if(e.target===back)back.remove();};
}
function convertNode(el,newType){
  if(!el||!newType||el.dataset.type===newType||typeof nodeMarkup!=='function')return;var oldText='';try{oldText=typeof getText==='function'?getText(el):'';}catch(e){}var id=el.dataset.vfId;el.dataset.type=newType;el.removeAttribute('data-image-resource');el.removeAttribute('data-image-resource-name');el.innerHTML=nodeMarkup(newType)+(typeof handles==='function'?handles():'');el.dataset.bound='';if(typeof bindNode==='function')bindNode(el);if(oldText&&['text','button','input','textarea','link','checkbox'].indexOf(newType)>=0&&typeof setText==='function')try{setText(el,oldText);}catch(e){}if(typeof selectNode==='function')selectNode(id);if(typeof commit==='function')commit();render();if(typeof toast==='function')toast('Convertido para '+typeName(el));
}

function sync(){build();var has=!!(mq.matches&&selected());document.body.classList.toggle('bw-mobile-has-selection',has);if(has)render();}
function installWrapper(){if(typeof window.selectNode==='function'&&!window.selectNode.__bwMQuick){var prev=window.selectNode;var w=function(){var r=prev.apply(this,arguments);setTimeout(sync,0);return r;};w.__bwMQuick=true;window.selectNode=w;}}
function hookRefresh(){['bwSizeSelect','bwGravitySelect','bwLayoutGravitySelect','bwImageResourceSelect'].forEach(function(id){var b=document.getElementById(id);if(b&&b.dataset.bwMQuick!=='1'){b.dataset.bwMQuick='1';b.addEventListener('click',function(){setTimeout(render,70);});}});}
function install(){build();installWrapper();hookRefresh();sync();}
window.BrotwareMobileQuickProperties={render:render,setTab:function(t){activeTab=t||'basic';render();}};
setTimeout(install,0);setTimeout(install,350);setTimeout(install,1100);
})();
