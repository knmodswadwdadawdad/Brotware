(function(){
'use strict';

var EVENT_CATALOG={
  activity:[
    {key:'load',name:'onCreate',desc:'On page create',icon:'‹›'},
    {key:'imports',name:'Import',desc:'Add custom imports / startup logic',icon:'‹›'},
    {key:'initializeLogic',name:'initializeLogic',desc:'On activity create',icon:'‹›'},
    {key:'activityResult',name:'onActivityResult',desc:'Receber resultado/mensagem externa',icon:'‹›'},
    {key:'back',name:'onBackPressed',desc:'Botão voltar / histórico',icon:'‹›'},
    {key:'postcreate',name:'onPostCreate',desc:'Após a página terminar de criar',icon:'‹›'},
    {key:'start',name:'onStart',desc:'Página ficando visível',icon:'‹›'},
    {key:'resume',name:'onResume',desc:'Página ativa novamente',icon:'‹›'},
    {key:'pause',name:'onPause',desc:'Página temporariamente inativa',icon:'‹›'},
    {key:'stop',name:'onStop',desc:'Página deixou de ficar visível',icon:'‹›'},
    {key:'destroy',name:'onDestroy',desc:'Página sendo encerrada',icon:'‹›'},
    {key:'saveInstanceState',name:'onSaveInstanceState',desc:'Antes de sair da página',icon:'‹›'},
    {key:'restoreInstanceState',name:'onRestoreInstanceState',desc:'Ao retornar para a página',icon:'‹›'},
    {key:'newIntent',name:'onNewIntent',desc:'Mudança de URL/hash',icon:'‹›'},
    {key:'windowFocusChanged',name:'onWindowFocusChanged',desc:'Janela ganhou/perdeu foco',icon:'‹›'}
  ],
  view:[
    {key:'click',name:'onClick',desc:'Ao tocar/clicar',icon:'▣'},
    {key:'dblclick',name:'onDoubleClick',desc:'Ao tocar duas vezes',icon:'▣'},
    {key:'input',name:'onInput',desc:'Enquanto o valor muda',icon:'▣'},
    {key:'change',name:'onChange',desc:'Quando o valor é confirmado',icon:'▣'},
    {key:'focus',name:'onFocus',desc:'Ao receber foco',icon:'▣'},
    {key:'blur',name:'onBlur',desc:'Ao perder foco',icon:'▣'},
    {key:'keydown',name:'onKeyDown',desc:'Tecla pressionada',icon:'▣'},
    {key:'keyup',name:'onKeyUp',desc:'Tecla liberada',icon:'▣'},
    {key:'mouseenter',name:'onMouseEnter',desc:'Ponteiro entrou',icon:'▣'},
    {key:'mouseleave',name:'onMouseLeave',desc:'Ponteiro saiu',icon:'▣'}
  ],
  component:[
    {key:'online',name:'onOnline',desc:'Conexão com internet voltou',icon:'◇'},
    {key:'offline',name:'onOffline',desc:'Conexão com internet caiu',icon:'◇'},
    {key:'resize',name:'onWindowResize',desc:'Tamanho da janela mudou',icon:'◇'},
    {key:'message',name:'onMessage',desc:'Mensagem recebida de outra janela/app',icon:'◇'}
  ],
  drawer:[
    {key:'drawerOpen',name:'onDrawerOpened',desc:'Drawer foi aberto',icon:'▤'},
    {key:'drawerClose',name:'onDrawerClosed',desc:'Drawer foi fechado',icon:'▤'}
  ]
};
var CAT_META={activity:['Activity','▱'],view:['View','▣'],component:['Component','◇'],drawer:['Drawer','▤'],moreblock:['Moreblock','▬']};
var currentCategory='activity';
var legacyOpen=false;

function ensureEnabled(page){
  if(!page.enabledEvents)page.enabledEvents=['load'];
  if(page.enabledEvents.indexOf('load')<0)page.enabledEvents.unshift('load');
}
function catEvents(cat){return EVENT_CATALOG[cat]||[];}
function eventMeta(key){
  var out=null;Object.keys(EVENT_CATALOG).some(function(c){return EVENT_CATALOG[c].some(function(x){if(x.key===key){out=x;return true;}return false;});});
  return out||{key:key,name:key,desc:'Evento personalizado',icon:'‹›'};
}
function selectedViewId(){return state.selectedId||($('#eventNodeSelect')&&$('#eventNodeSelect').value!=='@page'?$('#eventNodeSelect').value:null);}
function targetForCategory(cat){return cat==='view'?(selectedViewId()||firstNodeId()):'@page';}
function ensureEventStore(node,key){var p=currentPage();ensurePageSchema(p);if(!p.events[node])p.events[node]={};if(!p.events[node][key])p.events[node][key]=[];return p.events[node][key];}
function isEventEnabled(cat,node,key){
  var p=currentPage();ensureEnabled(p);
  if(cat==='activity'||cat==='component'||cat==='drawer')return p.enabledEvents.indexOf(key)>=0;
  return !!(p.events[node]&&Object.prototype.hasOwnProperty.call(p.events[node],key));
}
function enableEvent(cat,node,key){
  var p=currentPage();ensureEnabled(p);ensureEventStore(node,key);
  if((cat==='activity'||cat==='component'||cat==='drawer')&&p.enabledEvents.indexOf(key)<0)p.enabledEvents.push(key);
}

function buildHome(){
  var screen=document.getElementById('screen-event');if(!screen||document.getElementById('skEventHome'))return;
  var home=document.createElement('div');home.id='skEventHome';home.className='sk-event-home-ui';
  home.innerHTML='<aside class="sk-event-rail" id="skEventRail"></aside><section class="sk-event-main"><div class="sk-event-header"><div><h3 id="skEventCatTitle">Activity</h3><small id="skEventCatSubtitle">Eventos da página HTML</small></div><span class="sk-event-spacer"></span><button class="sk-event-editor-back" id="skOpenLegacy">Editor de blocos</button></div><div class="sk-event-current" id="skEventCards"></div><div class="sk-event-note">Os nomes seguem o estilo Sketchware; no HTML eles são ligados aos eventos equivalentes do navegador.</div><button class="sk-event-add" id="skAddEventBtn">＋</button></section>';
  screen.appendChild(home);
  var rail=document.getElementById('skEventRail');
  Object.keys(CAT_META).forEach(function(cat){var m=CAT_META[cat],b=document.createElement('button');b.className='sk-event-cat'+(cat===currentCategory?' active':'');b.dataset.skCat=cat;b.innerHTML='<span class="ico">'+m[1]+'</span><span>'+m[0]+'</span>';rail.appendChild(b);});
  rail.addEventListener('click',function(e){var b=e.target.closest('[data-sk-cat]');if(!b)return;currentCategory=b.dataset.skCat;rail.querySelectorAll('.sk-event-cat').forEach(function(x){x.classList.toggle('active',x===b);});renderHome();});
  document.getElementById('skAddEventBtn').onclick=openAddModal;
  document.getElementById('skOpenLegacy').onclick=function(){openLegacyEditor();};
  buildAddModal();
}

function renderHome(){
  buildHome();var p=currentPage();if(!p)return;ensureEnabled(p);
  var title=CAT_META[currentCategory]?CAT_META[currentCategory][0]:'Activity';
  document.getElementById('skEventCatTitle').textContent=title;
  document.getElementById('skEventCatSubtitle').textContent=currentCategory==='view'?'Eventos do componente selecionado':currentCategory==='moreblock'?'Funções reutilizáveis':'Eventos da página HTML';
  var box=document.getElementById('skEventCards');box.innerHTML='';
  if(currentCategory==='moreblock'){
    if(!state.functions.length){box.innerHTML='<div class="sk-event-empty">Nenhum Moreblock/função criado.<br>Use o botão + para criar uma função.</div>';return;}
    state.functions.forEach(function(f){var b=document.createElement('button');b.className='sk-event-card';b.innerHTML='<span class="ev-icon">ƒ</span><span><b>'+esc(f.name)+'</b><small>'+(f.blocks?f.blocks.length:0)+' bloco(s)</small></span><span class="chev">›</span>';b.onclick=function(){state.logicMode='function';state.activeFunctionId=f.id;openLegacyEditor(true);setLogicMode('function');renderLogic();};box.appendChild(b);});return;
  }
  var node=targetForCategory(currentCategory),events=catEvents(currentCategory),enabled=events.filter(function(ev){return isEventEnabled(currentCategory,node,ev.key);});
  if(currentCategory==='view'&&!node){box.innerHTML='<div class="sk-event-empty">Crie ou selecione um widget na aba View para adicionar eventos.</div>';return;}
  if(!enabled.length){box.innerHTML='<div class="sk-event-empty">Nenhum evento desta categoria foi adicionado ainda.</div>';return;}
  enabled.forEach(function(ev){var arr=ensureEventStore(node,ev.key),b=document.createElement('button');b.className='sk-event-card';b.innerHTML='<span class="ev-icon">'+ev.icon+'</span><span><b>'+esc(ev.name)+'</b><small>'+esc(ev.desc)+' · '+arr.length+' bloco(s)</small></span><span class="chev">⌄</span>';b.onclick=function(){openEvent(node,ev.key);};box.appendChild(b);});
}

function openEvent(node,key){
  openLegacyEditor();state.logicMode='event';setLogicMode('event');refreshEventNodeSelect();
  if($('#eventNodeSelect')){$('#eventNodeSelect').value=node;refreshEventTypes();}
  if($('#eventTypeSelect')){
    var exists=Array.prototype.some.call($('#eventTypeSelect').options,function(o){return o.value===key;});
    if(!exists){var o=document.createElement('option');o.value=key;o.textContent=eventMeta(key).name;$('#eventTypeSelect').appendChild(o);}
    $('#eventTypeSelect').value=key;
  }
  renderLogic();
}
function openLegacyEditor(asFunction){
  legacyOpen=true;var screen=document.getElementById('screen-event');if(screen)screen.classList.remove('sk-event-home');
  var top=document.querySelector('#screen-event .logic-top');
  if(top&&!document.getElementById('skBackEvents')){var b=document.createElement('button');b.id='skBackEvents';b.className='btn';b.textContent='← Eventos';b.onclick=showEventHome;top.insertBefore(b,top.firstChild);}
  if(!asFunction&&state.logicMode!=='event')setLogicMode('event');
}
function showEventHome(){legacyOpen=false;var screen=document.getElementById('screen-event');if(screen)screen.classList.add('sk-event-home');renderHome();}

function buildAddModal(){
  if(document.getElementById('skAddEventsModal'))return;
  var m=document.createElement('div');m.id='skAddEventsModal';m.className='sk-add-events-modal';
  m.innerHTML='<div class="sk-add-events-dialog"><div class="sk-add-events-top" id="skAddTabs"></div><div class="sk-add-events-body" id="skAddEventsBody"></div><div class="sk-add-events-foot"><button class="sk-cancel" id="skCancelEvents">Cancel</button><button class="sk-confirm" id="skConfirmEvents">Add</button></div></div>';
  document.body.appendChild(m);
  var tabs=document.getElementById('skAddTabs');Object.keys(CAT_META).forEach(function(cat){var meta=CAT_META[cat],b=document.createElement('button');b.className='sk-add-events-tab';b.dataset.addCat=cat;b.innerHTML='<span class="ico">'+meta[1]+'</span>'+meta[0];tabs.appendChild(b);});
  tabs.onclick=function(e){var b=e.target.closest('[data-add-cat]');if(!b)return;renderAddList(b.dataset.addCat);};
  document.getElementById('skCancelEvents').onclick=function(){m.classList.remove('show');};
  document.getElementById('skConfirmEvents').onclick=confirmAddEvents;
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('show');});
}
function openAddModal(){
  buildAddModal();document.getElementById('skAddEventsModal').classList.add('show');renderAddList(currentCategory==='moreblock'?'activity':currentCategory);
}
function renderAddList(cat){
  document.querySelectorAll('.sk-add-events-tab').forEach(function(x){x.classList.toggle('active',x.dataset.addCat===cat);});
  var body=document.getElementById('skAddEventsBody');body.dataset.cat=cat;body.innerHTML='';
  if(cat==='moreblock'){
    body.innerHTML='<div class="sk-event-empty">Moreblock é uma função reutilizável. Clique em Add para criar uma nova função.</div>';return;
  }
  var node=targetForCategory(cat);
  if(cat==='view'&&!node){body.innerHTML='<div class="sk-event-empty">Selecione um widget na aba View primeiro.</div>';return;}
  catEvents(cat).forEach(function(ev){var row=document.createElement('label');row.className='sk-add-event-row';var checked=isEventEnabled(cat,node,ev.key);row.innerHTML='<span class="ico">'+ev.icon+'</span><span><b>'+esc(CAT_META[cat][0]+': '+ev.name)+'</b><small>'+esc(ev.desc)+'</small></span><input class="sk-check" type="checkbox" data-sk-event="'+ev.key+'" '+(checked?'checked':'')+'>';body.appendChild(row);});
}
function confirmAddEvents(){
  var body=document.getElementById('skAddEventsBody'),cat=body.dataset.cat||'activity';
  if(cat==='moreblock'){
    document.getElementById('skAddEventsModal').classList.remove('show');setLogicMode('function');addFunction();currentCategory='moreblock';showEventHome();return;
  }
  var node=targetForCategory(cat);if(cat==='view'&&!node){toast('Selecione um widget primeiro');return;}
  body.querySelectorAll('[data-sk-event]:checked').forEach(function(c){enableEvent(cat,node,c.dataset.skEvent);});
  autoSave();document.getElementById('skAddEventsModal').classList.remove('show');currentCategory=cat;showEventHome();
}

/* Add page lifecycle names to the existing selector too. */
EVENT_OPTIONS['@page']=catEvents('activity').concat(catEvents('component')).concat(catEvents('drawer')).map(function(x){return[x.key,x.name];});

/* Preserve the original tab switch, but Event opens the Sketchware-style event browser first. */
var baseSwitch=window.switchTab;
window.switchTab=function(name){baseSwitch(name);if(name==='event')showEventHome();};

/* Keep new pages compatible. */
var baseEnsure=window.ensurePageSchema;
window.ensurePageSchema=function(p){baseEnsure(p);ensureEnabled(p);};
state.pages.forEach(function(p){try{ensureEnabled(p);}catch(e){}});

buildHome();
if(document.querySelector('.tab[data-tab="event"].active'))showEventHome();
})();
