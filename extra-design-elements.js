(function(){
'use strict';

var EXTRA_GROUPS=[
  {title:'More Layouts',items:[['grid','▦','GridLayout'],['stack','▧','StackLayout']]},
  {title:'Form Widgets',items:[['radio','◉','RadioButton'],['switch','◐','Switch'],['range','↔','Range Slider'],['number','#','Number Input'],['date','▣','Date Input']]},
  {title:'Media & Web',items:[['icon','★','Icon'],['badge','●','Badge'],['video','▶','Video'],['audio','♪','Audio'],['iframe','⌘','Iframe'],['spacer','↕','Spacer']]}
];
var TYPE_LABELS={grid:'GridLayout',stack:'StackLayout',radio:'RadioButton',switch:'Switch',range:'Range Slider',number:'Number Input',date:'Date Input',icon:'Icon',badge:'Badge',video:'Video',audio:'Audio',iframe:'Iframe',spacer:'Spacer'};
var oldNodeMarkup=window.nodeMarkup,oldDefaultSize=window.defaultSize,oldNodeId=window.nodeId,oldIsLayout=window.isLayout,oldGetText=window.getText,oldSetText=window.setText;

function extraMarkup(type){
  if(type==='grid')return '<div class="node-layout vf-content" style="width:100%;height:100%;border:1px dashed rgba(84,170,220,.55);background:rgba(84,170,220,.05)"></div><div class="node-layout-label">GridLayout</div>';
  if(type==='stack')return '<div class="node-layout vf-content" style="width:100%;height:100%;border:1px dashed rgba(145,117,255,.55);background:rgba(145,117,255,.05)"></div><div class="node-layout-label">StackLayout</div>';
  if(type==='radio')return '<label class="vf-content" style="width:100%;height:100%;display:flex;align-items:center;gap:8px;padding:4px 7px;font-family:Arial,sans-serif"><input type="radio" style="width:18px;height:18px"><span class="bw-extra-label">RadioButton</span></label>';
  if(type==='switch')return '<label class="vf-content" style="width:100%;height:100%;display:flex;align-items:center;gap:9px;padding:4px 7px;font-family:Arial,sans-serif"><input type="checkbox" role="switch" style="width:36px;height:20px"><span class="bw-extra-label">Switch</span></label>';
  if(type==='range')return '<input class="vf-content" type="range" min="0" max="100" value="50" style="width:100%;height:100%;margin:0;padding:5px">';
  if(type==='number')return '<input class="node-input vf-content" type="number" value="0" placeholder="0" style="width:100%;height:100%;box-sizing:border-box">';
  if(type==='date')return '<input class="node-input vf-content" type="date" style="width:100%;height:100%;box-sizing:border-box">';
  if(type==='icon')return '<div class="vf-content" style="width:100%;height:100%;display:grid;place-items:center;font-size:34px">★</div>';
  if(type==='badge')return '<div class="vf-content" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;background:#6567f4;color:#fff;font:700 13px Arial,sans-serif">Badge</div>';
  if(type==='video')return '<video class="vf-content" controls style="width:100%;height:100%;display:block;background:#111;object-fit:contain"></video>';
  if(type==='audio')return '<audio class="vf-content" controls style="width:100%;height:100%;display:block"></audio>';
  if(type==='iframe')return '<iframe class="vf-content" title="Iframe" src="about:blank" style="width:100%;height:100%;border:1px solid #b9c5ce;background:#fff"></iframe>';
  if(type==='spacer')return '<div class="vf-content" style="width:100%;height:100%;border:1px dashed #9eabb4;background:repeating-linear-gradient(135deg,transparent,transparent 6px,rgba(120,140,155,.09) 6px,rgba(120,140,155,.09) 12px)"></div>';
  return null;
}
window.nodeMarkup=function(type){var x=extraMarkup(type);return x!==null?x:oldNodeMarkup(type);};
window.defaultSize=function(type){var m={grid:[250,180],stack:[230,150],radio:[145,38],switch:[145,40],range:[180,38],number:[155,40],date:[175,40],icon:[64,64],badge:[95,34],video:[240,150],audio:[250,54],iframe:[260,180],spacer:[180,32]};return m[type]||oldDefaultSize(type);};
window.nodeId=function(type){var m={grid:'grid',stack:'stack',radio:'radio',switch:'switch',range:'range',number:'number',date:'date',icon:'icon',badge:'badge',video:'video',audio:'audio',iframe:'iframe',spacer:'spacer'};return m[type]?(m[type]+(state.counter++)):oldNodeId(type);};
window.isLayout=function(type){return type==='grid'||type==='stack'||oldIsLayout(type);};
window.getText=function(el){
  if(!el)return'';var t=typeof contentTarget==='function'?contentTarget(el):el,type=el.dataset.type;
  if(type==='radio'||type==='switch'){var s=t.querySelector&&t.querySelector('.bw-extra-label');return s?s.textContent:'';}
  if(type==='badge'||type==='icon')return t.textContent||'';
  if(type==='number'||type==='date')return t.value||'';
  if(type==='range')return t.value||'50';
  return oldGetText(el);
};
window.setText=function(el,value){
  if(!el)return;var t=typeof contentTarget==='function'?contentTarget(el):el,type=el.dataset.type;value=String(value==null?'':value);
  if(type==='radio'||type==='switch'){var s=t.querySelector&&t.querySelector('.bw-extra-label');if(s)s.textContent=value;return;}
  if(type==='badge'||type==='icon'){t.textContent=value;return;}
  if(type==='number'||type==='date'||type==='range'){t.value=value;t.setAttribute('value',value);return;}
  return oldSetText(el,value);
};

if(typeof EVENT_OPTIONS!=='undefined'){
  EVENT_OPTIONS.radio=[['change','onChange'],['click','onClick']];
  EVENT_OPTIONS.switch=[['change','onChange'],['click','onClick']];
  EVENT_OPTIONS.range=[['input','onInput'],['change','onChange']];
  EVENT_OPTIONS.number=[['input','onInput'],['change','onChange'],['focus','onFocus'],['blur','onBlur']];
  EVENT_OPTIONS.date=[['input','onInput'],['change','onChange'],['focus','onFocus'],['blur','onBlur']];
}

function bindCreateButton(btn){
  if(btn.dataset.bwExtraBound==='1')return;btn.dataset.bwExtraBound='1';
  btn.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&typeof startPaletteDrag==='function')startPaletteDrag(e,this.dataset.create);});
  btn.addEventListener('click',function(){if(state.ignorePaletteClick)return;if(typeof createNode==='function')createNode(this.dataset.create,20,20,root);});
}
function injectDesktop(){
  var box=document.getElementById('paletteBasic');if(!box||box.dataset.bwExtraElements==='1')return;box.dataset.bwExtraElements='1';
  EXTRA_GROUPS.forEach(function(g){var c=document.createElement('div');c.className='category';c.textContent=g.title;box.appendChild(c);g.items.forEach(function(x){var b=document.createElement('button');b.className='palette-item';b.dataset.create=x[0];b.innerHTML='<span>'+x[1]+'</span>'+x[2];box.appendChild(b);bindCreateButton(b);});});
}
function extraMobileHtml(){var out='';EXTRA_GROUPS.forEach(function(g){out+='<div class="bw-mobile-section-title" data-bw-extra-group="1">'+g.title+'</div><div class="bw-mobile-add-grid" data-bw-extra-group="1">';g.items.forEach(function(x){out+='<button class="bw-mobile-add-item" type="button" data-bw-mobile-add="'+x[0]+'"><span class="ico">'+x[1]+'</span><b>'+x[2]+'</b></button>';});out+='</div>';});return out;}
function injectMobile(){
  var body=document.getElementById('bwMobileSheetBody');if(!body||!body.querySelector('[data-bw-mobile-add]')||body.querySelector('[data-bw-extra-group]'))return;body.insertAdjacentHTML('beforeend',extraMobileHtml());
}
function watchMobile(){var body=document.getElementById('bwMobileSheetBody');if(!body||body.dataset.bwExtraWatch==='1')return;body.dataset.bwExtraWatch='1';new MutationObserver(function(){setTimeout(injectMobile,0);}).observe(body,{childList:true});}
function patchQuickText(){
  var tray=document.getElementById('bwMobileQuickProperties'),cards=document.getElementById('bwMQuickCards'),el=typeof selectedNode==='function'?selectedNode():null;if(!tray||!cards||!el)return;
  if(['radio','switch','badge','icon','number','date'].indexOf(el.dataset.type)<0)return;
  if(!cards.querySelector('[data-mquick-action="text"]')){var b=document.createElement('button');b.className='bw-mquick-card';b.type='button';b.dataset.mquickAction='text';b.innerHTML='<span class="ico">T</span><b>Text</b>';var all=cards.querySelector('[data-mquick-action="all"]');if(all)all.insertAdjacentElement('afterend',b);else cards.appendChild(b);}
}
function installQuickObserver(){var tray=document.getElementById('bwMobileQuickProperties');if(!tray||tray.dataset.bwExtraObs==='1')return;tray.dataset.bwExtraObs='1';new MutationObserver(function(){setTimeout(patchQuickText,0);}).observe(tray,{childList:true,subtree:true});}
function install(){injectDesktop();watchMobile();injectMobile();installQuickObserver();patchQuickText();}

window.BrotwareExtraElements={groups:EXTRA_GROUPS,labels:TYPE_LABELS,refresh:install};
setTimeout(install,0);setTimeout(install,350);setTimeout(install,1100);
})();
