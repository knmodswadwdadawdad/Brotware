(function(){
'use strict';

var mq=window.matchMedia('(min-width:761px)');
var patched=false,topTools=null,zoomLabel=null,viewportBtn=null;
var TYPE_NAMES={text:'TextView',button:'Button',input:'Input',textarea:'TextArea',image:'ImageView',link:'Link',checkbox:'CheckBox',select:'Select',progress:'ProgressBar',divider:'Divider','linear-h':'Linear H','linear-v':'Linear V',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView',grid:'GridLayout',stack:'StackLayout',radio:'RadioButton',switch:'Switch',range:'Range Slider',number:'Number Input',date:'Date Input',icon:'Icon',badge:'Badge',video:'Video',audio:'Audio',iframe:'Iframe',spacer:'Spacer'};
var META={
  custom:['‹›','Custom\nattributes'],convert:['◉','Convert'],width:['↔','Width'],height:['↕','Height'],all:['•••','See All'],image:['▧','Image'],scale:['↗','Scale type'],layoutGravity:['⌘','Layout gravity'],gravity:['⌘','Gravity'],backgroundResource:['◌','Background\nresource'],background:['◉','Background\ncolor'],text:['T','Text'],textColor:['A','Text color'],position:['⌖','Position'],padding:['▣','Padding'],margin:['⌞','Margin'],border:['□','Border'],radius:['◯','Radius'],fontSize:['T','Font size']
};

function isDesktop(){return mq.matches;}
function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function currentPageSafe(){return typeof currentPage==='function'?currentPage():null;}
function tabName(){var t=document.querySelector('.tab.active[data-tab]');return t?t.dataset.tab:'view';}
function isLayoutNode(el){return !!(el&&typeof isLayout==='function'&&isLayout(el.dataset.type));}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}

function ensureTopTools(){
  var top=document.getElementById('bwMobileTopbar'),run=document.getElementById('bwMobileRun');if(!top||!run)return;
  if(topTools)return;
  topTools=document.createElement('div');topTools.className='bw-desktop-top-tools';topTools.id='bwDesktopTopTools';
  topTools.innerHTML='<div class="bw-desktop-zoom"><button id="bwDesktopZoomOut" type="button" title="Zoom out">−</button><span id="bwDesktopZoomLabel">100%</span><button id="bwDesktopZoomIn" type="button" title="Zoom in">＋</button></div><button class="bw-desktop-viewport" id="bwDesktopViewport" type="button" title="Trocar viewport">Mobile</button>';
  top.insertBefore(topTools,run);zoomLabel=document.getElementById('bwDesktopZoomLabel');viewportBtn=document.getElementById('bwDesktopViewport');
  document.getElementById('bwDesktopZoomOut').onclick=function(){setDesktopZoom(-.1);};document.getElementById('bwDesktopZoomIn').onclick=function(){setDesktopZoom(.1);};viewportBtn.onclick=cycleViewport;syncZoom();syncViewport();
}
function setDesktopZoom(delta){var z=(typeof state!=='undefined'&&Number(state.zoom))||1;z=Math.max(.4,Math.min(1.5,Math.round((z+delta)*10)/10));if(typeof setZoom==='function')setZoom(z);else if(typeof state!=='undefined')state.zoom=z;syncZoom();}
function syncZoom(){if(zoomLabel)zoomLabel.textContent=Math.round((((typeof state!=='undefined'&&Number(state.zoom))||1)*100))+'%';}
function currentViewport(){var p=document.getElementById('phone');if(!p)return'mobile';if(p.classList.contains('desktop'))return'desktop';if(p.classList.contains('tablet'))return'tablet';return'mobile';}
function syncViewport(){if(viewportBtn){var v=currentViewport();viewportBtn.textContent=v==='desktop'?'Desktop':v==='tablet'?'Tablet':'Mobile';}}
function cycleViewport(){var v=currentViewport(),next=v==='mobile'?'tablet':v==='tablet'?'desktop':'mobile';if(typeof setDevice==='function')setDevice(next);setTimeout(function(){syncViewport();syncZoom();},30);}

function contextTitle(){if(typeof state!=='undefined'&&state.dialogEditorActive&&window.BrotwareDialogs&&BrotwareDialogs.get){var d=BrotwareDialogs.get(state.activeDialogId);if(d)return d.name||d.id;}var p=currentPageSafe();return p?p.name:'Brotware';}
function contextSub(){if(typeof state!=='undefined'&&state.dialogEditorActive)return'Dialog Design';var t=tabName();if(t==='event')return'Logic';if(t==='component')return'Components';if(t==='strings')return'Strings';return'Design';}
function syncContext(){
  if(!isDesktop())return;var title=document.getElementById('bwMobileTitle'),sub=document.getElementById('bwMobileSubtitle');if(title)title.textContent=contextTitle();if(sub)sub.textContent=contextSub();document.body.classList.toggle('bw-desktop-view-active',tabName()==='view');syncZoom();syncViewport();syncSelection();
}

function quickActions(el){
  var typ=el.dataset.type||'',a=['custom'];if(!isLayoutNode(el)&&['video','audio','iframe','spacer','range'].indexOf(typ)<0)a.push('convert');a.push('width','height','all');
  if(typ==='image')a.push('image','scale','layoutGravity','backgroundResource','background','position','padding','margin','border','radius');
  else if(['text','button','input','textarea','link','checkbox','select','radio','switch','badge','icon','number','date'].indexOf(typ)>=0)a.push('text','gravity','layoutGravity','textColor','fontSize','backgroundResource','background','position','padding','margin','border','radius');
  else a.push('layoutGravity','backgroundResource','background','position','padding','margin','border','radius');
  return a;
}
function quickCard(a){var m=META[a];if(!m)return'';return'<button class="bw-mquick-card'+(a==='all'?' primary':'')+'" type="button" data-mquick-action="'+esc(a)+'"><span class="ico">'+m[0]+'</span><b>'+esc(m[1]).replace(/\n/g,'<br>')+'</b></button>';}
function renderDesktopQuick(){
  if(!isDesktop())return;var tray=document.getElementById('bwMobileQuickProperties'),cards=document.getElementById('bwMQuickCards'),name=document.getElementById('bwMQuickName'),el=selected();var show=!!(el&&tabName()==='view');document.body.classList.toggle('bw-desktop-has-selection',show);if(!tray||!cards||!name||!show)return;
  name.textContent=el.dataset.vfId||TYPE_NAMES[el.dataset.type]||'View';var icon=tray.querySelector('.bw-mquick-target .ico');if(icon)icon.textContent=el.dataset.type==='image'?'▧':isLayoutNode(el)?'▦':'▣';
  var active=tray.querySelector('[data-mquick-tab].active'),mode=active?active.dataset.mquickTab:'basic';var html='';
  if(mode==='recent'){
    var rec=[];try{rec=JSON.parse(localStorage.getItem('brotware_mobile_recent_properties_v1')||'[]');}catch(e){}rec=(Array.isArray(rec)?rec:[]).filter(function(x){return META[x];});if(!rec.length)html='<div class="bw-mquick-empty">As propriedades usadas recentemente aparecem aqui.</div>';else rec.forEach(function(a){html+=quickCard(a);});
  }else if(mode==='event'){
    html='<button class="bw-mquick-card primary" type="button" data-mquick-action="events"><span class="ico">⚡</span><b>All Events</b></button>';var key=el.dataset.type==='input'||el.dataset.type==='textarea'||el.dataset.type==='number'||el.dataset.type==='date'?'input':el.dataset.type==='checkbox'||el.dataset.type==='radio'||el.dataset.type==='switch'?'checkbox':el.dataset.type==='select'?'select':'default';var arr=(typeof EVENT_OPTIONS!=='undefined'&&EVENT_OPTIONS[el.dataset.type])||((typeof EVENT_OPTIONS!=='undefined'&&EVENT_OPTIONS[key])||[]);arr.forEach(function(x){html+='<button class="bw-mquick-card" type="button" data-mquick-event="'+esc(x[0])+'"><span class="ico">⚡</span><b>'+esc(x[1])+'</b></button>';});
  }else quickActions(el).forEach(function(a){html+=quickCard(a);});
  cards.innerHTML=html;
}

function patchProperties(){
  var api=window.BrotwareMobileProperties;if(!api||api.__bwDesktopUnified)return;var oldOpen=api.open,oldClose=api.close;
  api.open=function(){if(isDesktop()){if(!selected()){if(typeof toast==='function')toast('Selecione uma View primeiro');return;}if(api.render)api.render();var s=document.getElementById('bwMobileProperties');if(s)s.classList.add('show');document.body.classList.add('bw-mobile-properties-open');return;}return oldOpen&&oldOpen.apply(this,arguments);};
  api.close=function(){var r=oldClose&&oldClose.apply(this,arguments);document.body.classList.remove('bw-mobile-properties-open');return r;};api.__bwDesktopUnified=true;
}
function numericRoute(action){
  var api=window.BrotwareNumericDialogs,el=selected();if(!api||!el)return false;
  if(action==='padding'){api.openSpacing('padding');return true;}if(action==='margin'){api.openSpacing('margin');return true;}if(action==='radius'){api.openRadius();return true;}if(action==='border'){api.openBorder();return true;}if(action==='position'){api.openPosition();return true;}
  if(action==='fontSize'&&api.openSize){api.openSize({el:el,target:typeof contentTarget==='function'?contentTarget(el):el,prop:'fontSize',title:'Font size',icon:'T',label:'Enter font size',help:'px é a unidade mais simples para começar.'});return true;}return false;
}
function installNumericCapture(){if(document.documentElement.dataset.bwDesktopNumeric==='1')return;document.documentElement.dataset.bwDesktopNumeric='1';document.addEventListener('click',function(e){if(!isDesktop())return;var n=e.target.closest&&e.target.closest('[data-mprops-action],[data-mquick-action]');if(!n)return;var a=n.dataset.mpropsAction||n.dataset.mquickAction;if(numericRoute(a)){e.preventDefault();e.stopImmediatePropagation();}},true);}

function monitorSheet(){var title=document.getElementById('bwMobileSheetTitle');if(!title||title.dataset.bwDesktopWatch==='1')return;title.dataset.bwDesktopWatch='1';var sync=function(){document.body.classList.toggle('bw-desktop-more-sheet',String(title.textContent||'').trim().toLowerCase()==='mais');};new MutationObserver(sync).observe(title,{childList:true,characterData:true,subtree:true});sync();}
function patchWrappers(){
  if(window.selectNode&&!window.selectNode.__bwDesktopUnified){var prev=window.selectNode;var sn=function(){var r=prev.apply(this,arguments);setTimeout(renderDesktopQuick,0);return r;};sn.__bwDesktopUnified=true;window.selectNode=sn;}
  if(window.switchTab&&!window.switchTab.__bwDesktopUnified){var st=window.switchTab;var sw=function(){var r=st.apply(this,arguments);setTimeout(syncContext,0);return r;};sw.__bwDesktopUnified=true;window.switchTab=sw;}
  if(window.loadPage&&!window.loadPage.__bwDesktopUnified){var lp=window.loadPage;var l=function(){var r=lp.apply(this,arguments);setTimeout(syncContext,0);return r;};l.__bwDesktopUnified=true;window.loadPage=l;}
}
function installTabRefresh(){var tabs=document.getElementById('bwMQuickTabs');if(tabs&&tabs.dataset.bwDesktopUnified!=='1'){tabs.dataset.bwDesktopUnified='1';tabs.addEventListener('click',function(){setTimeout(renderDesktopQuick,0);});}}

function syncMode(){
  document.body.classList.toggle('bw-desktop-unified',isDesktop());if(!isDesktop()){document.body.classList.remove('bw-desktop-has-selection','bw-desktop-view-active','bw-desktop-more-sheet');return;}
  ensureTopTools();patchProperties();installNumericCapture();monitorSheet();patchWrappers();installTabRefresh();syncContext();renderDesktopQuick();
}
function install(){if(patched){syncMode();return;}patched=true;syncMode();if(mq.addEventListener)mq.addEventListener('change',syncMode);else mq.addListener(syncMode);window.addEventListener('resize',function(){clearTimeout(window.__bwDesktopUnifiedResize);window.__bwDesktopUnifiedResize=setTimeout(syncMode,100);});}

window.BrotwareDesktopUI={refresh:syncContext,quick:renderDesktopQuick};
setTimeout(install,0);setTimeout(install,400);setTimeout(install,1200);
})();
