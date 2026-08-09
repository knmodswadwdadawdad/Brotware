(function(){
'use strict';

var timer=null,rendering=false,lastSignature='';
var EVENT_NAMES={
  click:'onClick',longclick:'onLongClick',dblclick:'onDoubleClick',input:'onInput',change:'onChange',focus:'onFocus',blur:'onBlur',keydown:'onKeyDown',keyup:'onKeyUp',mouseenter:'onMouseEnter',mouseleave:'onMouseLeave',submit:'onSubmit'
};
var TYPE_NAMES={
  button:'Button',text:'TextView',input:'EditText',textarea:'EditText',image:'ImageView',link:'TextView',checkbox:'CheckBox',select:'Spinner',progress:'ProgressBar',divider:'View',
  'linear-h':'LinearLayout','linear-v':'LinearLayout',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView',grid:'GridLayout',stack:'FrameLayout',radio:'RadioButton',switch:'Switch',range:'SeekBar',number:'EditText',date:'EditText',icon:'ImageView',badge:'TextView',video:'VideoView',audio:'MediaPlayer',iframe:'WebView',spacer:'View'
};
var TYPE_ICONS={button:'smart_button',text:'text_fields',input:'edit_note',textarea:'notes',image:'image',link:'link',checkbox:'check_box',select:'arrow_drop_down_circle',progress:'linear_scale','linear-h':'view_week','linear-v':'view_stream',relative:'select_all',card:'crop_portrait',scroll:'swap_vert',grid:'grid_view',stack:'layers',radio:'radio_button_checked',switch:'toggle_on',range:'tune',number:'pin',date:'calendar_month',icon:'star',badge:'sell',video:'movie',audio:'music_note',iframe:'web',spacer:'space_bar'};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function icon(n){return'<span class="bw-google-icon">'+n+'</span>';}
function isViewActive(){var b=document.querySelector('#skEventRail .sk-event-cat.active[data-sk-cat="view"]');return !!b;}
function page(){try{return typeof currentPage==='function'?currentPage():null;}catch(_){return null;}}
function nodeFromLive(id){try{return typeof root!=='undefined'&&root?root.querySelector('[data-vf-id="'+String(id).replace(/(["\\])/g,'\\$1')+'"]'):null;}catch(_){return null;}}
function nodeFromSaved(id,p){if(!p)return null;var box=document.createElement('div');box.innerHTML=p.content||'';try{return box.querySelector('[data-vf-id="'+String(id).replace(/(["\\])/g,'\\$1')+'"]');}catch(_){return null;}}
function nodeInfo(id,p){var n=nodeFromLive(id)||nodeFromSaved(id,p),type=n&&n.dataset?n.dataset.type:'';return{type:type||'view',name:TYPE_NAMES[type]||'View',icon:TYPE_ICONS[type]||'widgets'};}
function eventName(key,type){
  var opts=[];try{opts=(typeof EVENT_OPTIONS!=='undefined'&&(EVENT_OPTIONS[type]||EVENT_OPTIONS.default))||[];}catch(_){}
  for(var i=0;i<opts.length;i++)if(opts[i][0]===key)return opts[i][1]||EVENT_NAMES[key]||key;
  return EVENT_NAMES[key]||key;
}
function rows(){
  var p=page(),out=[];if(!p||!p.events)return out;
  Object.keys(p.events).forEach(function(nodeId){
    if(!nodeId||nodeId.charAt(0)==='@')return;
    var info=nodeInfo(nodeId,p),obj=p.events[nodeId];if(!obj||typeof obj!=='object')return;
    Object.keys(obj).forEach(function(key){
      if(!Object.prototype.hasOwnProperty.call(obj,key))return;
      var arr=Array.isArray(obj[key])?obj[key]:[];
      out.push({node:nodeId,key:key,event:eventName(key,info.type),type:info.type,typeName:info.name,typeIcon:info.icon,count:arr.length});
    });
  });
  return out;
}
function signature(list){return list.map(function(x){return x.node+'|'+x.key+'|'+x.count+'|'+x.type;}).join('||');}
function setSubtitle(){var s=document.getElementById('skEventCatSubtitle');if(s)s.textContent='Eventos das Views desta tela';}
function render(){
  if(rendering||!isViewActive())return;var box=document.getElementById('skEventCards');if(!box)return;var list=rows(),sig=signature(list);
  if(box.dataset.bwViewList==='1'&&lastSignature===sig){setSubtitle();return;}
  rendering=true;lastSignature=sig;box.dataset.bwViewList='1';setSubtitle();
  if(!list.length){box.innerHTML='<div class="sk-event-empty bw-view-event-empty">Nenhum evento de View foi adicionado ainda.<br>Use o botão + para adicionar um evento.</div>';rendering=false;return;}
  box.innerHTML=list.map(function(x){return '<button type="button" class="sk-event-card bw-view-event-card" data-bw-view-event-card="1" data-bw-node="'+esc(x.node)+'" data-bw-event="'+esc(x.key)+'">'+
    '<span class="ev-icon bw-view-event-type-icon">'+icon(x.typeIcon)+'</span>'+
    '<span class="bw-view-event-copy"><small class="bw-view-type">'+esc(x.typeName)+'</small><b>'+esc(x.node)+'</b><small class="bw-view-event-name">'+icon('touch_app')+' '+esc(x.event)+'</small></span>'+
    '<span class="chev">'+icon('expand_more')+'</span></button>';}).join('');
  rendering=false;
}
function ensureOption(select,key,label){if(!select)return;for(var i=0;i<select.options.length;i++)if(select.options[i].value===key)return;var o=document.createElement('option');o.value=key;o.textContent=label||key;select.appendChild(o);}
function prepareEvent(card){
  var node=card.dataset.bwNode,key=card.dataset.bwEvent;if(!node||!key)return;
  try{state.selectedId=node;state.logicMode='event';}catch(_){}
  try{if(typeof setLogicMode==='function')setLogicMode('event');}catch(_){}
  try{if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();}catch(_){}
  var ns=document.getElementById('eventNodeSelect');if(ns){ns.value=node;try{if(typeof refreshEventTypes==='function')refreshEventTypes();}catch(_){}}
  var type=nodeInfo(node,page()).type,ts=document.getElementById('eventTypeSelect');if(ts){ensureOption(ts,key,eventName(key,type));ts.value=key;}
  try{if(typeof renderLogic==='function')renderLogic();}catch(e){console.error(e);}
}
function onCardsClick(e){var card=e.target.closest&&e.target.closest('.bw-view-event-card[data-bw-view-event-card="1"]');if(!card)return;prepareEvent(card);/* sketchware-logic.js bubble handler opens the visual editor after this capture handler. */}
function schedule(){clearTimeout(timer);timer=setTimeout(render,0);}
function install(){
  var box=document.getElementById('skEventCards'),rail=document.getElementById('skEventRail');if(!box||!rail){setTimeout(install,180);return;}
  if(box.dataset.bwViewV2Bound!=='1'){box.dataset.bwViewV2Bound='1';box.addEventListener('click',onCardsClick,true);new MutationObserver(function(){if(!rendering)schedule();}).observe(box,{childList:true,subtree:true});}
  if(rail.dataset.bwViewV2Bound!=='1'){rail.dataset.bwViewV2Bound='1';rail.addEventListener('click',function(e){var b=e.target.closest('[data-sk-cat]');if(b&&b.dataset.skCat==='view')setTimeout(render,0);},true);}
  document.addEventListener('bw:view-events-refresh',schedule);
  schedule();
}
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1300);
window.BrotwareViewEventList={render:render,refresh:schedule};
})();
