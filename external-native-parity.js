(function(){
'use strict';

var installed=false,activeTab='basic',quick=null,cards=null,tabs=null,metrics=null,bottom=null,positionBack=null;
var lastRef=null,nudgeTimer=null,nudgeValue=null;

function hs(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function active(){var s=hs();return !!(s&&s.active&&s.projectId);}
function selected(){return window.BrotwareHybridEditor&&BrotwareHybridEditor.selection?BrotwareHybridEditor.selection():(hs().selection||null);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function refOf(el){return el&&(el.bwId||('@dom:'+el.selector))||'';}
function meta(){var s=hs();return s.projectId&&window.BrotwareVFS?BrotwareVFS.getMeta(s.projectId)||{}:{};}
function overrideStyles(el){var m=meta(),id=el&&(el.bwId||state.externalSelectedRef),x=id&&m.overrides&&m.overrides[id];return x&&x.styles||{};}
function parseTranslate(v){var s=String(v||'').trim(),m=s.match(/(-?[\d.]+)px(?:\s+|,\s*)(-?[\d.]+)px/);if(m)return{x:Number(m[1])||0,y:Number(m[2])||0};m=s.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/i);return m?{x:Number(m[1])||0,y:Number(m[2])||0}:{x:0,y:0};}
function xy(el){var st=overrideStyles(el);return parseTranslate(st.translate||'');}
function px(v,fallback){var n=parseFloat(String(v==null?'':v));return isFinite(n)?n:(fallback||0);}
function applyStyles(obj){if(window.BrotwareHybridEditor&&BrotwareHybridEditor.setStyles)return BrotwareHybridEditor.setStyles(obj);}
function iconFor(el){var t=String(el&&el.tag||'VIEW').toUpperCase();if(t==='IMG')return'▧';if(/^(DIV|SECTION|MAIN|HEADER|FOOTER|NAV|ARTICLE|ASIDE|FORM|BODY)$/.test(t))return'▦';if(/^(INPUT|TEXTAREA|SELECT)$/.test(t))return'⌨';return'▣';}

function ensure(){
  if(!active())return;
  quick=document.getElementById('bwHybridQuick');
  if(quick){
    quick.classList.add('bw-mquick','bw-hybrid-native-dock');
    var head=quick.querySelector('.bw-hybrid-quick-head');if(head)head.classList.add('bw-mquick-head');
    var target=document.getElementById('bwHybridTarget');if(target){target.classList.add('bw-mquick-target');var tag=target.querySelector('.tag');if(tag)tag.classList.add('ico');var name=document.getElementById('bwHybridName');if(name)name.classList.add('bw-native-target-name');}
    quick.querySelectorAll('.iconbtn').forEach(function(b){b.classList.add('bw-mquick-iconbtn');});
    cards=document.getElementById('bwHybridCards');if(cards)cards.classList.add('bw-mquick-scroll');
    if(!document.getElementById('bwHybridNativeTabs')&&cards){
      tabs=document.createElement('nav');tabs.id='bwHybridNativeTabs';tabs.className='bw-mquick-tabs bw-hybrid-native-tabs';tabs.innerHTML='<button class="bw-mquick-tab active" data-bw-hybrid-tab="basic" type="button">Basic</button><button class="bw-mquick-tab" data-bw-hybrid-tab="layout" type="button">Layout</button><button class="bw-mquick-tab" data-bw-hybrid-tab="style" type="button">Style</button><button class="bw-mquick-tab" data-bw-hybrid-tab="event" type="button">Event</button>';
      quick.insertBefore(tabs,cards);tabs.addEventListener('click',function(e){var b=e.target.closest('[data-bw-hybrid-tab]');if(!b)return;activeTab=b.dataset.bwHybridTab;render();});
    }else tabs=document.getElementById('bwHybridNativeTabs');
    if(cards&&!cards.dataset.bwNativeParity){cards.dataset.bwNativeParity='1';cards.addEventListener('click',cardClick,true);}
  }
  ensureOverlay();ensureBottom();ensurePositionSheet();
  document.body.classList.add('bw-external-native-parity');
}

function ensureOverlay(){
  var o=document.getElementById('bwHybridEditOverlay');if(!o)return;
  if(!o.querySelector('[data-resize="n"]')){var n=document.createElement('i');n.className='bw-hybrid-handle n';n.dataset.resize='n';o.appendChild(n);}
  if(!o.querySelector('[data-resize="w"]')){var w=document.createElement('i');w.className='bw-hybrid-handle w';w.dataset.resize='w';o.appendChild(w);}
  if(!document.getElementById('bwHybridNativeMetrics')){metrics=document.createElement('span');metrics.id='bwHybridNativeMetrics';metrics.className='bw-hybrid-native-metrics';o.appendChild(metrics);}else metrics=document.getElementById('bwHybridNativeMetrics');
}

function ensureBottom(){
  if(bottom)return;
  bottom=document.createElement('nav');bottom.id='bwHybridNativeBottom';bottom.className='bw-hybrid-native-bottom';
  bottom.innerHTML='<button class="active" data-bw-native-nav="view" type="button"><span>▧</span><b>View</b></button><button data-bw-native-nav="layers" type="button"><span>☷</span><b>Layers</b></button><button data-bw-native-nav="logic" type="button"><span>⚡</span><b>Logic</b></button><button data-bw-native-nav="properties" type="button"><span>☰</span><b>Properties</b></button>';
  document.body.appendChild(bottom);bottom.addEventListener('click',function(e){var b=e.target.closest('[data-bw-native-nav]');if(!b)return;var a=b.dataset.bwNativeNav;bottom.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b);});if(a==='layers'){if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.openLayers();}else if(a==='logic'){if(window.BrotwareExternalNavigation)BrotwareExternalNavigation.logic();}else if(a==='properties'){var s=selected();if(s&&window.BrotwareExternalInspector)BrotwareExternalInspector.render(s);else if(typeof toast==='function')toast('Selecione uma View primeiro');}else if(a==='view'){if(window.BrotwareExternalNavigation)BrotwareExternalNavigation.preview();}});
}

function ensurePositionSheet(){
  if(positionBack)return;
  positionBack=document.createElement('div');positionBack.id='bwHybridNativePosition';positionBack.className='bw-hybrid-native-position-backdrop';
  positionBack.innerHTML='<section class="bw-hybrid-native-position-sheet"><header><div><strong>Position & Size</strong><small>Mesmo controle de posição do editor Native</small></div><button data-bw-pos-close type="button">×</button></header><div class="bw-hybrid-position-grid"><label><span>X</span><input id="bwHybridPosX" inputmode="decimal"></label><label><span>Y</span><input id="bwHybridPosY" inputmode="decimal"></label><label><span>Width</span><input id="bwHybridPosW"></label><label><span>Height</span><input id="bwHybridPosH"></label></div><p>Arraste a seleção para mover. Use as alças para redimensionar. Setas movem 1px; Shift + seta move 10px.</p><footer><button data-bw-pos-reset type="button">Reset position</button><span></span><button data-bw-pos-cancel type="button">Cancel</button><button class="primary" data-bw-pos-save type="button">Apply</button></footer></section>';
  document.body.appendChild(positionBack);positionBack.addEventListener('click',function(e){if(e.target===positionBack||e.target.closest('[data-bw-pos-close]')||e.target.closest('[data-bw-pos-cancel]'))closePosition();var r=e.target.closest('[data-bw-pos-reset]');if(r){applyStyles({translate:''});closePosition();}var s=e.target.closest('[data-bw-pos-save]');if(s)savePosition();});
}
function openPosition(){var el=selected();if(!el||el.tag==='BODY')return;ensurePositionSheet();var p=xy(el),r=el.rect||{},st=overrideStyles(el);document.getElementById('bwHybridPosX').value=Math.round(p.x);document.getElementById('bwHybridPosY').value=Math.round(p.y);document.getElementById('bwHybridPosW').value=st.width||Math.round(Number(r.width)||0)+'px';document.getElementById('bwHybridPosH').value=st.height||Math.round(Number(r.height)||0)+'px';positionBack.classList.add('show');setTimeout(function(){document.getElementById('bwHybridPosX').focus();},30);}
function closePosition(){if(positionBack)positionBack.classList.remove('show');}
function cssSize(v,fallback){v=String(v==null?'':v).trim();if(!v)return fallback;if(/^[-+]?\d*\.?\d+$/.test(v))return v+'px';return v;}
function savePosition(){var el=selected();if(!el)return;var x=px(document.getElementById('bwHybridPosX').value,0),y=px(document.getElementById('bwHybridPosY').value,0),r=el.rect||{};var w=cssSize(document.getElementById('bwHybridPosW').value,Math.round(Number(r.width)||0)+'px'),h=cssSize(document.getElementById('bwHybridPosH').value,Math.round(Number(r.height)||0)+'px');applyStyles({translate:x+'px '+y+'px',width:w,height:h});closePosition();}

function card(action,icon,label,primary,extra){return'<button class="bw-mquick-card bw-hybrid-qcard'+(primary?' primary':'')+'" type="button" data-bw-parity="'+esc(action)+'"'+(extra||'')+'><span class="ico">'+icon+'</span><b>'+label+'</b></button>';}
function oldCard(action,icon,label,primary){return'<button class="bw-mquick-card bw-hybrid-qcard'+(primary?' primary':'')+'" type="button" data-hq="'+esc(action)+'"><span class="ico">'+icon+'</span><b>'+label+'</b></button>';}
function eventCards(el){var out=card('events','⚡','All Events',true),p=window.BrotwareExternalDomProvider,ref=refOf(el),arr=p&&p.eventOptions?p.eventOptions(ref):[['click','onClick']];arr.forEach(function(x){out+=card('event','⚡',esc(x[1]),false,' data-event-name="'+esc(x[0])+'"');});return out;}
function render(){
  if(!active())return;ensure();var el=selected();document.body.classList.toggle('bw-hybrid-has-selection',!!el);if(bottom)bottom.classList.toggle('show',true);if(!el||!quick||!cards)return;
  lastRef=refOf(el);var name=document.getElementById('bwHybridName'),tag=document.getElementById('bwHybridTag');if(name)name.textContent=el.id||el.attributes&&el.attributes.name||String(el.tag||'View').toLowerCase();if(tag){tag.textContent=iconFor(el);tag.title=el.tag||'VIEW';}
  if(tabs)tabs.querySelectorAll('[data-bw-hybrid-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.bwHybridTab===activeTab);});
  var textable=/^(BUTTON|A|H1|H2|H3|H4|H5|H6|P|SPAN|LABEL|INPUT|TEXTAREA)$/.test(el.tag||''),html='';
  if(activeTab==='basic'){
    if(textable)html+=oldCard('text','T','Text',false);
    html+=card('position','⌖','Position',false)+oldCard('width','↔','Width',false)+oldCard('height','↕','Height',false)+oldCard('more','•••','See All',true)+oldCard('background','◉','Background',false)+oldCard('padding','▣','Padding',false)+oldCard('margin','⌞','Margin',false)+oldCard('radius','◯','Radius',false);
  }else if(activeTab==='layout'){
    var p=xy(el);html+=card('x','X',Math.round(p.x)+'px',false)+card('y','Y',Math.round(p.y)+'px',false)+card('position','⌖','Position',true)+oldCard('width','↔','Width',false)+oldCard('height','↕','Height',false)+card('reset-position','↺','Reset pos.',false)+card('display','▦','Display',false);
  }else if(activeTab==='style'){
    html+=oldCard('background','◉','Background',false)+card('color','A','Text color',false)+oldCard('padding','▣','Padding',false)+oldCard('margin','⌞','Margin',false)+oldCard('border','□','Border',false)+oldCard('radius','◯','Radius',false)+card('opacity','◐','Opacity',false)+oldCard('more','•••','See All',true);
  }else html=eventCards(el);
  cards.innerHTML=html;quick.classList.add('show');updateMetrics();
}

function promptStyle(title,prop,current){var v=prompt(title,current==null?'':String(current));if(v===null)return;var o={};o[prop]=v;applyStyles(o);}
function color(){var el=selected(),value=el&&el.styles&&el.styles.color||'#ffffff';if(window.BrotwareColorPicker)BrotwareColorPicker.open({title:'Text color',value:value,onApply:function(v){applyStyles({color:v});}});else promptStyle('Text color','color',value);}
function openEvent(name){var el=selected();if(!el)return;var ref=refOf(el);if(window.BrotwareExternalDomProvider)BrotwareExternalDomProvider.selectRef(ref);if(window.BrotwareExternalNavigation)BrotwareExternalNavigation.logic();setTimeout(function(){var ns=document.getElementById('eventNodeSelect'),es=document.getElementById('eventTypeSelect');if(ns){ns.value=state.externalSelectedRef||ref;if(typeof refreshEventTypes==='function')refreshEventTypes();}if(name&&es){es.value=name;if(typeof renderLogic==='function')renderLogic();}},80);}
function cardClick(e){var b=e.target.closest('[data-bw-parity]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();var a=b.dataset.bwParity,el=selected();if(!el)return;if(a==='position'||a==='x'||a==='y')openPosition();else if(a==='reset-position')applyStyles({translate:''});else if(a==='display')promptStyle('Display','display',el.styles&&el.styles.display||'block');else if(a==='opacity')promptStyle('Opacity (0 - 1)','opacity',el.styles&&el.styles.opacity||'1');else if(a==='color')color();else if(a==='events')openEvent(null);else if(a==='event')openEvent(b.dataset.eventName||null);}

function updateMetrics(){var el=selected(),o=document.getElementById('bwHybridEditOverlay');if(!el||!o)return;ensureOverlay();var p=xy(el),r=el.rect||{},left=parseFloat(o.style.left),top=parseFloat(o.style.top),w=parseFloat(o.style.width),h=parseFloat(o.style.height);if(!isFinite(w))w=Number(r.width)||0;if(!isFinite(h))h=Number(r.height)||0;if(metrics)metrics.textContent='X '+Math.round(p.x)+'  Y '+Math.round(p.y)+'  ·  '+Math.round(w)+' × '+Math.round(h);}
function observeOverlay(){var o=document.getElementById('bwHybridEditOverlay');if(!o||o.dataset.bwParityObserved)return;o.dataset.bwParityObserved='1';new MutationObserver(function(){updateMetrics();}).observe(o,{attributes:true,attributeFilter:['style','class']});}

function nudge(dx,dy){var el=selected();if(!el||el.tag==='BODY')return;var ref=refOf(el);if(!nudgeValue||nudgeValue.ref!==ref){var p=xy(el);nudgeValue={ref:ref,x:p.x,y:p.y};}nudgeValue.x+=dx;nudgeValue.y+=dy;clearTimeout(nudgeTimer);nudgeTimer=setTimeout(function(){if(!nudgeValue)return;applyStyles({translate:nudgeValue.x+'px '+nudgeValue.y+'px'});nudgeValue=null;},45);}
function keydown(e){if(!active()||!window.BrotwareHybridEditor||!BrotwareHybridEditor.isEdit||!BrotwareHybridEditor.isEdit())return;var t=e.target;if(t&&(t.matches('input,textarea,select')||t.isContentEditable))return;var d=e.shiftKey?10:1;if(e.key==='ArrowLeft'){e.preventDefault();nudge(-d,0);}else if(e.key==='ArrowRight'){e.preventDefault();nudge(d,0);}else if(e.key==='ArrowUp'){e.preventDefault();nudge(0,-d);}else if(e.key==='ArrowDown'){e.preventDefault();nudge(0,d);}else if(e.key==='Delete'&&selected()&&selected().tag!=='BODY'){e.preventDefault();if(window.BrotwareHybridEditor.remove)BrotwareHybridEditor.remove();}}

function onOpen(){setTimeout(function(){ensure();render();observeOverlay();},120);}
function onSelection(){setTimeout(function(){ensure();render();observeOverlay();},0);}
function onSnapshot(){if(active())setTimeout(function(){render();observeOverlay();},80);}
function onClose(){document.body.classList.remove('bw-external-native-parity','bw-hybrid-has-selection');if(bottom)bottom.classList.remove('show');closePosition();lastRef=null;nudgeValue=null;}
function install(){if(installed)return;if(!window.BrotwareExternalHybrid||!window.BrotwareHybridEditor){setTimeout(install,120);return;}installed=true;window.addEventListener('brotware:external-open',onOpen);window.addEventListener('brotware:external-ready',onOpen);window.addEventListener('brotware:external-selection',onSelection);window.addEventListener('brotware:external-snapshot',onSnapshot);window.addEventListener('brotware:external-close',onClose);window.addEventListener('keydown',keydown,true);setInterval(function(){if(active()){ensure();observeOverlay();}},800);}

window.BrotwareHybridNativeParity={render:render,position:openPosition,nudge:nudge};
setTimeout(install,0);setTimeout(install,800);
})();
