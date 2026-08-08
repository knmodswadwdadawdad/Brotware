(function(){
'use strict';

var EVENTS={
  requestNetwork:[
    {key:'response',name:'onResponse',desc:'Request completed successfully'},
    {key:'error',name:'onError',desc:'Request failed'}
  ],
  timer:[{key:'tick',name:'onTick',desc:'Timer delay completed'}],
  dialog:[
    {key:'positive',name:'onPositive',desc:'User confirmed'},
    {key:'negative',name:'onNegative',desc:'User cancelled or declined'},
    {key:'result',name:'onResult',desc:'Dialog returned a result'}
  ],
  filePicker:[
    {key:'fileSelected',name:'onFileSelected',desc:'A file was selected'},
    {key:'cancelled',name:'onCancelled',desc:'File selection was cancelled'}
  ],
  notification:[
    {key:'shown',name:'onShown',desc:'Notification was shown'},
    {key:'permissionDenied',name:'onPermissionDenied',desc:'Notification permission was denied'}
  ],
  location:[
    {key:'locationChanged',name:'onLocationChanged',desc:'Current location was received'},
    {key:'error',name:'onError',desc:'Location could not be obtained'}
  ],
  textToSpeech:[
    {key:'start',name:'onStart',desc:'Speech started'},
    {key:'done',name:'onDone',desc:'Speech finished'},
    {key:'error',name:'onError',desc:'Speech failed'}
  ],
  speechToText:[
    {key:'result',name:'onResult',desc:'Speech was converted to text'},
    {key:'error',name:'onError',desc:'Speech recognition failed'}
  ],
  clipboard:[
    {key:'copied',name:'onCopied',desc:'Text was copied'},
    {key:'error',name:'onError',desc:'Clipboard operation failed'}
  ]
};

var SYSTEM_EVENTS=[
  {key:'online',name:'onOnline',desc:'Internet connection returned'},
  {key:'offline',name:'onOffline',desc:'Internet connection was lost'},
  {key:'resize',name:'onWindowResize',desc:'Window size changed'},
  {key:'message',name:'onMessage',desc:'Message received from another window/app'}
];

function ensureState(){if(!Array.isArray(state.functionalComponents))state.functionalComponents=[];}
function componentById(id){ensureState();for(var i=0;i<state.functionalComponents.length;i++)if(String(state.functionalComponents[i].id)===String(id))return state.functionalComponents[i];return null;}
function eventListForComponent(c){return c?(EVENTS[c.type]||[]):[];}
function nodeKey(id){return '@fc:'+String(id);}
function idFromNode(node){return String(node||'').indexOf('@fc:')===0?String(node).slice(4):'';}
function isComponentNode(node){return String(node||'').indexOf('@fc:')===0;}
function labelForEvent(c,key){var list=eventListForComponent(c);for(var i=0;i<list.length;i++)if(list[i].key===key)return list[i];return{key:key,name:key,desc:'Component event'};}
function materialIcon(type){var m={requestNetwork:'wifi',timer:'timer',dialog:'chat_bubble',filePicker:'draft',notification:'notifications',location:'location_on',textToSpeech:'volume_up',speechToText:'mic',clipboard:'content_copy',camera:'photo_camera'};return m[type]||'extension';}
function eventStore(componentId,key){var p=currentPage();if(!p)return[];ensurePageSchema(p);var node=nodeKey(componentId);if(!p.events[node])p.events[node]={};if(!p.events[node][key])p.events[node][key]=[];return p.events[node][key];}

var baseRefreshNodes=window.refreshEventNodeSelect;
var baseRefreshTypes=window.refreshEventTypes;
var baseRenderLogic=window.renderLogic;

window.refreshEventNodeSelect=function(){
  var sel=document.getElementById('eventNodeSelect'),old=sel?sel.value:'@page';
  if(baseRefreshNodes)baseRefreshNodes();
  sel=document.getElementById('eventNodeSelect');if(!sel)return;
  ensureState();
  var group=document.createElement('optgroup');group.label='Functional Components';
  state.functionalComponents.forEach(function(c){if(!eventListForComponent(c).length)return;var o=document.createElement('option');o.value=nodeKey(c.id);o.textContent='🧩 '+c.name;group.appendChild(o);});
  if(group.children.length)sel.appendChild(group);
  var exists=Array.prototype.some.call(sel.options,function(o){return o.value===old;});if(exists)sel.value=old;
  window.refreshEventTypes();
};

window.refreshEventTypes=function(){
  var node=document.getElementById('eventNodeSelect')?document.getElementById('eventNodeSelect').value:'@page';
  if(!isComponentNode(node)){if(baseRefreshTypes)baseRefreshTypes();return;}
  var c=componentById(idFromNode(node)),list=eventListForComponent(c),sel=document.getElementById('eventTypeSelect');if(!sel)return;
  var old=sel.value;sel.innerHTML=list.map(function(ev){return '<option value="'+esc(ev.key)+'">'+esc(ev.name)+'</option>';}).join('');
  if(list.some(function(ev){return ev.key===old;}))sel.value=old;
  if(baseRenderLogic)baseRenderLogic();
};

window.renderLogic=function(){
  if(baseRenderLogic)baseRenderLogic();
  if(state.logicMode!=='event')return;
  var node=currentEventNode();if(!isComponentNode(node))return;
  var c=componentById(idFromNode(node));if(!c)return;var ev=labelForEvent(c,currentEventType());
  var t=document.getElementById('logicTitle'),s=document.getElementById('logicSubtitle');if(t)t.textContent=c.name+' → '+ev.name;if(s)s.textContent=ev.desc;
};

function openComponentEvent(id,key){
  var c=componentById(id);if(!c)return;eventStore(id,key);setLogicMode('event');window.refreshEventNodeSelect();
  var ns=document.getElementById('eventNodeSelect'),ts=document.getElementById('eventTypeSelect');if(ns){ns.value=nodeKey(id);window.refreshEventTypes();}if(ts)ts.value=key;window.renderLogic();
  var meta=labelForEvent(c,key);if(window.BrotwareSketchLogic&&BrotwareSketchLogic.open)BrotwareSketchLogic.open(c.name+' · '+meta.name,meta.desc);
}

var homeObserver=null,homeQueued=false;
function componentCategoryActive(){var a=document.querySelector('#skEventRail .sk-event-cat.active');return !!(a&&a.dataset.skCat==='component');}
function homeSignature(){ensureState();return state.functionalComponents.map(function(c){return c.id+':'+c.type+':'+c.name;}).join('|');}
function renderComponentHome(){
  if(!componentCategoryActive())return;
  var box=document.getElementById('skEventCards'),title=document.getElementById('skEventCatTitle'),sub=document.getElementById('skEventCatSubtitle');if(!box)return;
  var sig=homeSignature();if(box.dataset.bwFcEvents===sig&&box.querySelector('.bw-fc-event-home'))return;box.dataset.bwFcEvents=sig;if(title)title.textContent='Component';if(sub)sub.textContent='Eventos dos componentes funcionais do projeto';ensureState();
  var html='<div class="bw-fc-event-home">',any=false;
  state.functionalComponents.forEach(function(c){var events=eventListForComponent(c);if(!events.length)return;any=true;html+='<section class="bw-fc-event-group"><div class="bw-fc-event-group-title"><span class="bw-google-icon">'+materialIcon(c.type)+'</span><span><b>'+esc(c.name)+'</b><small>'+esc(c.type)+'</small></span></div>';events.forEach(function(ev){var count=eventStore(c.id,ev.key).length;html+='<button type="button" class="sk-event-card bw-fc-event-card" data-fc-event-id="'+esc(c.id)+'" data-fc-event-key="'+esc(ev.key)+'"><span class="ev-icon"><span class="bw-google-icon">bolt</span></span><span><b>'+esc(ev.name)+'</b><small>'+esc(ev.desc)+' · '+count+' bloco(s)</small></span><span class="chev">›</span></button>';});html+='</section>';});
  if(!any)html+='<div class="sk-event-empty">Nenhum componente funcional com eventos.<br>Adicione um componente na aba Component.</div>';
  html+='<section class="bw-fc-event-group bw-system-event-group"><div class="bw-fc-event-group-title"><span class="bw-google-icon">language</span><span><b>Browser / System</b><small>Eventos globais do navegador</small></span></div>';
  SYSTEM_EVENTS.forEach(function(ev){var p=currentPage(),arr=(p&&p.events&&p.events['@page']&&p.events['@page'][ev.key])||[];html+='<button type="button" class="sk-event-card bw-system-event-card" data-system-event-key="'+esc(ev.key)+'"><span class="ev-icon"><span class="bw-google-icon">public</span></span><span><b>'+esc(ev.name)+'</b><small>'+esc(ev.desc)+' · '+arr.length+' bloco(s)</small></span><span class="chev">›</span></button>';});
  html+='</section></div>';box.innerHTML=html;
}
function queueHome(){if(homeQueued)return;homeQueued=true;requestAnimationFrame(function(){homeQueued=false;renderComponentHome();});}
function installHome(){
  var home=document.getElementById('skEventHome'),box=document.getElementById('skEventCards');if(!home||!box){setTimeout(installHome,200);return;}if(home.dataset.bwFcEventsInstalled==='1'){queueHome();return;}home.dataset.bwFcEventsInstalled='1';
  box.addEventListener('click',function(e){var c=e.target.closest('[data-fc-event-id]');if(c){e.preventDefault();e.stopImmediatePropagation();openComponentEvent(c.dataset.fcEventId,c.dataset.fcEventKey);return;}var s=e.target.closest('[data-system-event-key]');if(s){e.preventDefault();e.stopImmediatePropagation();var key=s.dataset.systemEventKey;ensureEventPath('@page',key);setLogicMode('event');window.refreshEventNodeSelect();var ns=document.getElementById('eventNodeSelect'),ts=document.getElementById('eventTypeSelect');if(ns){ns.value='@page';window.refreshEventTypes();}if(ts){var exists=Array.prototype.some.call(ts.options,function(o){return o.value===key;});if(!exists){var o=document.createElement('option');o.value=key;o.textContent=key;ts.appendChild(o);}ts.value=key;}window.renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.open)BrotwareSketchLogic.open(s.querySelector('b').textContent,s.querySelector('small').textContent);}},true);
  home.addEventListener('click',function(){setTimeout(queueHome,0);},true);homeObserver=new MutationObserver(queueHome);homeObserver.observe(home,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});queueHome();
}

async function fireComponentEvent(id,key,ctx,payload){
  if(!id||!ctx)return;ctx.vars=ctx.vars||{};ctx.vars.__component=id;ctx.vars.__result=payload;var p=currentPage(),node=nodeKey(id),list=p&&p.events&&p.events[node]&&p.events[node][key];if(list&&list.length)await window.executeBlocks(list,ctx);
}
var previousExecute=window.executeBlocks;
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i],p=b.props||{},id=p.component;
    if(b.type==='fcRequest'){
      try{var o={method:p.method||'GET',headers:{}};if(o.method!=='GET'&&o.method!=='HEAD'&&p.body)o.body=String(resolveValue(p.body,ctx));var r=await fetch(String(resolveValue(p.url,ctx)||''),o),text=await r.text(),data=text;try{data=JSON.parse(text);}catch(_){}if(p.saveVar)ctx.vars[p.saveVar]=data;await fireComponentEvent(id,'response',ctx,data);}catch(e){if(p.saveVar)ctx.vars[p.saveVar]=null;ctx.vars.__error=String(e&&e.message||e);await fireComponentEvent(id,'error',ctx,ctx.vars.__error);}
    }else if(b.type==='fcTimerWait'){var ms=Math.max(0,Math.min(60000,Number(resolveValue(p.ms,ctx))||0));await new Promise(function(res){setTimeout(res,ms);});await fireComponentEvent(id,'tick',ctx,ms);
    }else if(b.type==='fcDialog'){var msg=String(resolveValue(p.message,ctx)||''),v;if(p.mode==='confirm'){v=confirm(msg);if(p.saveVar)ctx.vars[p.saveVar]=v;await fireComponentEvent(id,v?'positive':'negative',ctx,v);}else if(p.mode==='prompt'){v=prompt(msg,'');if(p.saveVar)ctx.vars[p.saveVar]=v;await fireComponentEvent(id,v===null?'negative':'result',ctx,v);}else{alert(msg);await fireComponentEvent(id,'result',ctx,true);}
    }else if(b.type==='fcFilePick'){var inp=document.createElement('input');inp.type='file';inp.accept=p.accept||'*/*';inp.style.display='none';document.body.appendChild(inp);var file=await new Promise(function(res){var done=false;function finish(v){if(done)return;done=true;window.removeEventListener('focus',focus,true);res(v);}function focus(){setTimeout(function(){if(!done)finish(inp.files&&inp.files[0]||null);},350);}inp.onchange=function(){finish(inp.files&&inp.files[0]||null);};window.addEventListener('focus',focus,true);inp.click();});var info=file?{name:file.name,size:file.size,type:file.type}:null;if(p.saveVar)ctx.vars[p.saveVar]=info;inp.remove();await fireComponentEvent(id,file?'fileSelected':'cancelled',ctx,info);
    }else if(b.type==='fcNotify'){var title=String(resolveValue(p.title,ctx)||'Notification'),body=String(resolveValue(p.message,ctx)||''),shown=false;if('Notification'in window){if(Notification.permission==='default')await Notification.requestPermission();if(Notification.permission==='granted'){new Notification(title,{body:body});shown=true;}}if(!shown&&typeof toast==='function')toast(title+': '+body);await fireComponentEvent(id,shown?'shown':'permissionDenied',ctx,{title:title,message:body});
    }else if(b.type==='fcLocation'){try{var pos=await new Promise(function(res,rej){if(!navigator.geolocation)return rej(new Error('Geolocation unavailable'));navigator.geolocation.getCurrentPosition(res,rej);});var loc={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy};if(p.saveVar)ctx.vars[p.saveVar]=loc;await fireComponentEvent(id,'locationChanged',ctx,loc);}catch(e){if(p.saveVar)ctx.vars[p.saveVar]=null;ctx.vars.__error=String(e&&e.message||e);await fireComponentEvent(id,'error',ctx,ctx.vars.__error);}
    }else if(b.type==='fcSpeak'){if('speechSynthesis'in window){var utter=new SpeechSynthesisUtterance(String(resolveValue(p.text,ctx)||''));await fireComponentEvent(id,'start',ctx,utter.text);var speechOk=await new Promise(function(res){utter.onend=function(){res(true);};utter.onerror=function(){res(false);};speechSynthesis.speak(utter);});await fireComponentEvent(id,speechOk?'done':'error',ctx,utter.text);}else await fireComponentEvent(id,'error',ctx,'Speech synthesis unavailable');
    }else if(b.type==='fcListen'){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){var rec=new SR(),result=await new Promise(function(res){rec.onresult=function(e){res({ok:true,text:e.results[0][0].transcript});};rec.onerror=function(e){res({ok:false,error:e.error||'speech error'});};rec.start();});if(result.ok){if(p.saveVar)ctx.vars[p.saveVar]=result.text;await fireComponentEvent(id,'result',ctx,result.text);}else{if(p.saveVar)ctx.vars[p.saveVar]='';ctx.vars.__error=result.error;await fireComponentEvent(id,'error',ctx,result.error);}}else{if(p.saveVar)ctx.vars[p.saveVar]='';await fireComponentEvent(id,'error',ctx,'Speech recognition unavailable');}
    }else if(b.type==='fcClipboard'){try{var clip=String(resolveValue(p.text,ctx)||'');await navigator.clipboard.writeText(clip);await fireComponentEvent(id,'copied',ctx,clip);}catch(e){ctx.vars.__error=String(e&&e.message||e);await fireComponentEvent(id,'error',ctx,ctx.vars.__error);}
    }else await previousExecute([b],ctx);
  }
};

var previousRuntime=window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=previousRuntime(page),marker="function pageRun(key){",helper="async function componentRun(id,key,payload){vars.__component=id;vars.__result=payload;var n='@fc:'+id,x=cfg.events[n]&&cfg.events[n][key];if(x&&x.length)await run(x)}\n";
  if(code.indexOf(marker)>=0&&code.indexOf('function componentRun(')<0)code=code.replace(marker,helper+marker);
  var replacements=[
    ["else if(b.type==='fcRequest'){try{var fo={method:p.method||'GET',headers:{}};if(fo.method!=='GET'&&fo.method!=='HEAD'&&p.body)fo.body=String(rv(p.body));var fr=await fetch(String(rv(p.url)||''),fo),ft=await fr.text(),fd=ft;try{fd=JSON.parse(ft)}catch(_){}if(p.saveVar)vars[p.saveVar]=fd}catch(e){if(p.saveVar)vars[p.saveVar]=null}}","else if(b.type==='fcRequest'){try{var fo={method:p.method||'GET',headers:{}};if(fo.method!=='GET'&&fo.method!=='HEAD'&&p.body)fo.body=String(rv(p.body));var fr=await fetch(String(rv(p.url)||''),fo),ft=await fr.text(),fd=ft;try{fd=JSON.parse(ft)}catch(_){}if(p.saveVar)vars[p.saveVar]=fd;await componentRun(p.component,'response',fd)}catch(e){if(p.saveVar)vars[p.saveVar]=null;vars.__error=String(e&&e.message||e);await componentRun(p.component,'error',vars.__error)}}"],
    ["else if(b.type==='fcTimerWait')await new Promise(function(r){setTimeout(r,Math.max(0,Math.min(60000,Number(rv(p.ms))||0)))})","else if(b.type==='fcTimerWait'){var fms=Math.max(0,Math.min(60000,Number(rv(p.ms))||0));await new Promise(function(r){setTimeout(r,fms)});await componentRun(p.component,'tick',fms)}"],
    ["else if(b.type==='fcDialog'){var fm=String(rv(p.message)||''),fv=p.mode==='confirm'?confirm(fm):p.mode==='prompt'?prompt(fm,''):alert(fm);if(p.saveVar&&p.mode!=='alert')vars[p.saveVar]=fv}","else if(b.type==='fcDialog'){var fm=String(rv(p.message)||''),fv;if(p.mode==='confirm'){fv=confirm(fm);if(p.saveVar)vars[p.saveVar]=fv;await componentRun(p.component,fv?'positive':'negative',fv)}else if(p.mode==='prompt'){fv=prompt(fm,'');if(p.saveVar)vars[p.saveVar]=fv;await componentRun(p.component,fv===null?'negative':'result',fv)}else{alert(fm);await componentRun(p.component,'result',true)}}"],
    ["else if(b.type==='fcFilePick'){var fi=document.createElement('input');fi.type='file';fi.accept=p.accept||'*/*';fi.style.display='none';document.body.appendChild(fi);var ff=await new Promise(function(rs){fi.onchange=function(){rs(fi.files&&fi.files[0]||null)};fi.click()});if(p.saveVar)vars[p.saveVar]=ff?{name:ff.name,size:ff.size,type:ff.type}:null;fi.remove()}","else if(b.type==='fcFilePick'){var fi=document.createElement('input');fi.type='file';fi.accept=p.accept||'*/*';fi.style.display='none';document.body.appendChild(fi);var ff=await new Promise(function(rs){var done=false;function fin(v){if(done)return;done=true;window.removeEventListener('focus',foc,true);rs(v)}function foc(){setTimeout(function(){if(!done)fin(fi.files&&fi.files[0]||null)},350)}fi.onchange=function(){fin(fi.files&&fi.files[0]||null)};window.addEventListener('focus',foc,true);fi.click()});var ffi=ff?{name:ff.name,size:ff.size,type:ff.type}:null;if(p.saveVar)vars[p.saveVar]=ffi;fi.remove();await componentRun(p.component,ff?'fileSelected':'cancelled',ffi)}"],
    ["else if(b.type==='fcNotify'){var fnt=String(rv(p.title)||'Notification'),fnb=String(rv(p.message)||'');if('Notification'in window){if(Notification.permission==='default')await Notification.requestPermission();if(Notification.permission==='granted')new Notification(fnt,{body:fnb})}}","else if(b.type==='fcNotify'){var fnt=String(rv(p.title)||'Notification'),fnb=String(rv(p.message)||''),fshow=false;if('Notification'in window){if(Notification.permission==='default')await Notification.requestPermission();if(Notification.permission==='granted'){new Notification(fnt,{body:fnb});fshow=true}}await componentRun(p.component,fshow?'shown':'permissionDenied',{title:fnt,message:fnb})}"],
    ["else if(b.type==='fcLocation'){var fp=await new Promise(function(rs,rj){if(!navigator.geolocation)return rj();navigator.geolocation.getCurrentPosition(rs,rj)}).catch(function(){return null});if(p.saveVar)vars[p.saveVar]=fp?{latitude:fp.coords.latitude,longitude:fp.coords.longitude,accuracy:fp.coords.accuracy}:null}","else if(b.type==='fcLocation'){try{var fp=await new Promise(function(rs,rj){if(!navigator.geolocation)return rj(new Error('Geolocation unavailable'));navigator.geolocation.getCurrentPosition(rs,rj)}),fl={latitude:fp.coords.latitude,longitude:fp.coords.longitude,accuracy:fp.coords.accuracy};if(p.saveVar)vars[p.saveVar]=fl;await componentRun(p.component,'locationChanged',fl)}catch(e){if(p.saveVar)vars[p.saveVar]=null;vars.__error=String(e&&e.message||e);await componentRun(p.component,'error',vars.__error)}}"],
    ["else if(b.type==='fcSpeak'){if('speechSynthesis'in window)speechSynthesis.speak(new SpeechSynthesisUtterance(String(rv(p.text)||'')))}","else if(b.type==='fcSpeak'){if('speechSynthesis'in window){var fu=new SpeechSynthesisUtterance(String(rv(p.text)||''));await componentRun(p.component,'start',fu.text);var fok=await new Promise(function(rs){fu.onend=function(){rs(true)};fu.onerror=function(){rs(false)};speechSynthesis.speak(fu)});await componentRun(p.component,fok?'done':'error',fu.text)}else await componentRun(p.component,'error','Speech synthesis unavailable')}"],
    ["else if(b.type==='fcListen'){var FSR=window.SpeechRecognition||window.webkitSpeechRecognition;if(FSR){var frec=new FSR(),ftext=await new Promise(function(rs){frec.onresult=function(e){rs(e.results[0][0].transcript)};frec.onerror=function(){rs('')};frec.start()});if(p.saveVar)vars[p.saveVar]=ftext}}","else if(b.type==='fcListen'){var FSR=window.SpeechRecognition||window.webkitSpeechRecognition;if(FSR){var frec=new FSR(),fres=await new Promise(function(rs){frec.onresult=function(e){rs({ok:true,text:e.results[0][0].transcript})};frec.onerror=function(e){rs({ok:false,error:e.error||'speech error'})};frec.start()});if(fres.ok){if(p.saveVar)vars[p.saveVar]=fres.text;await componentRun(p.component,'result',fres.text)}else{if(p.saveVar)vars[p.saveVar]='';vars.__error=fres.error;await componentRun(p.component,'error',fres.error)}}else await componentRun(p.component,'error','Speech recognition unavailable')}"],
    ["else if(b.type==='fcClipboard'){try{await navigator.clipboard.writeText(String(rv(p.text)||''))}catch(_){}};","else if(b.type==='fcClipboard'){try{var fclip=String(rv(p.text)||'');await navigator.clipboard.writeText(fclip);await componentRun(p.component,'copied',fclip)}catch(e){vars.__error=String(e&&e.message||e);await componentRun(p.component,'error',vars.__error)}};"]
  ];
  replacements.forEach(function(pair){if(code.indexOf(pair[0])>=0)code=code.replace(pair[0],pair[1]);});return code;
};

document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-fc-del]'):null;if(!b)return;var id=b.dataset.fcDel;setTimeout(function(){(state.pages||[]).forEach(function(p){if(p.events)delete p.events[nodeKey(id)];});if(typeof autoSave==='function')autoSave();queueHome();},0);},true);

function install(){ensureState();installHome();window.refreshEventNodeSelect();}
setTimeout(install,0);setTimeout(install,700);setTimeout(install,1600);
window.BrotwareFunctionalComponentEvents={events:EVENTS,open:openComponentEvent,fire:fireComponentEvent,refresh:function(){window.refreshEventNodeSelect();queueHome();}};
})();
