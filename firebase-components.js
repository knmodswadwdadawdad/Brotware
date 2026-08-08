(function(){
'use strict';

var FB_COMPONENTS=[
  {type:'firebaseAuth',name:'Firebase Auth',icon:'shield_person',desc:'Email/password authentication',lib:'firebase'},
  {type:'firebaseDb',name:'Firebase DB',icon:'database',desc:'Realtime Database REST access',lib:'firebase'}
];
var FB_EVENTS={
  firebaseAuth:[
    {key:'signUpSuccess',name:'onSignUpSuccess',desc:'Account created successfully'},
    {key:'signInSuccess',name:'onSignInSuccess',desc:'User signed in successfully'},
    {key:'signedOut',name:'onSignedOut',desc:'Current Firebase session was cleared'},
    {key:'passwordResetSent',name:'onPasswordResetSent',desc:'Password reset email was requested'},
    {key:'userLoaded',name:'onUserLoaded',desc:'Current user information was loaded'},
    {key:'authError',name:'onAuthError',desc:'Firebase Authentication returned an error'}
  ],
  firebaseDb:[
    {key:'dataLoaded',name:'onDataLoaded',desc:'Database data was loaded'},
    {key:'dataChanged',name:'onDataChanged',desc:'Realtime Database stream received a change'},
    {key:'writeSuccess',name:'onWriteSuccess',desc:'Database write completed successfully'},
    {key:'error',name:'onError',desc:'Realtime Database returned an error'}
  ]
};
var FB_BLOCKS={
  fbAuthCreate:{componentType:'firebaseAuth',name:'Create User',icon:'person_add',fields:[['component','Firebase Auth','component'],['email','Email','text'],['password','Password','text'],['saveVar','Save user in','variable']]},
  fbAuthSignIn:{componentType:'firebaseAuth',name:'Sign In',icon:'login',fields:[['component','Firebase Auth','component'],['email','Email','text'],['password','Password','text'],['saveVar','Save user in','variable']]},
  fbAuthSignOut:{componentType:'firebaseAuth',name:'Sign Out',icon:'logout',fields:[['component','Firebase Auth','component']]},
  fbAuthReset:{componentType:'firebaseAuth',name:'Send Password Reset',icon:'lock_reset',fields:[['component','Firebase Auth','component'],['email','Email','text']]},
  fbAuthCurrent:{componentType:'firebaseAuth',name:'Get Current User',icon:'account_circle',fields:[['component','Firebase Auth','component'],['saveVar','Save user in','variable']]},
  fbDbGet:{componentType:'firebaseDb',name:'DB Get',icon:'download',fields:[['component','Firebase DB','component'],['path','Path','text'],['saveVar','Save data in','variable']]},
  fbDbSet:{componentType:'firebaseDb',name:'DB Set',icon:'save',fields:[['component','Firebase DB','component'],['path','Path','text'],['value','Value / JSON','text']]},
  fbDbUpdate:{componentType:'firebaseDb',name:'DB Update',icon:'edit',fields:[['component','Firebase DB','component'],['path','Path','text'],['value','Value / JSON','text']]},
  fbDbPush:{componentType:'firebaseDb',name:'DB Push',icon:'add_circle',fields:[['component','Firebase DB','component'],['path','Path','text'],['value','Value / JSON','text'],['saveVar','Save generated key in','variable']]},
  fbDbRemove:{componentType:'firebaseDb',name:'DB Remove',icon:'delete',fields:[['component','Firebase DB','component'],['path','Path','text']]},
  fbDbListen:{componentType:'firebaseDb',name:'DB Listen',icon:'sync',fields:[['component','Firebase DB','component'],['path','Path','text']]},
  fbDbStopListen:{componentType:'firebaseDb',name:'Stop DB Listener',icon:'sync_disabled',fields:[['component','Firebase DB','component']]}
};
var streams=window.__brotwareFirebaseStreams||(window.__brotwareFirebaseStreams={});
var paletteObserver=null,eventObserver=null,libObserver=null,queued=false,eventQueued=false;

function ensureState(){
  if(!Array.isArray(state.functionalComponents))state.functionalComponents=[];
  if(!state.libraryManager||typeof state.libraryManager!=='object')state.libraryManager={};
  if(!state.firebaseConfig||typeof state.firebaseConfig!=='object')state.firebaseConfig={};
  if(state.libraryManager.firebase==null)state.libraryManager.firebase=false;
  if(state.firebaseConfig.apiKey==null)state.firebaseConfig.apiKey='';
  if(state.firebaseConfig.databaseURL==null)state.firebaseConfig.databaseURL='';
}
function registerCatalog(){
  var fc=window.BrotwareFunctionalComponents;if(!fc||!fc.catalog||!fc.libraries)return false;
  FB_COMPONENTS.forEach(function(d){if(!fc.catalog.some(function(x){return x.type===d.type;}))fc.catalog.push(d);});
  var lib=fc.libraries.find(function(x){return x.id==='firebase';});
  if(lib){lib.planned=false;lib.desc='Firebase Authentication and Realtime Database';}
  return true;
}
function componentById(id){ensureState();return state.functionalComponents.find(function(c){return String(c.id)===String(id);})||null;}
function componentsOf(type){ensureState();return state.functionalComponents.filter(function(c){return c.type===type;});}
function isFirebaseComponent(c){return !!(c&&FB_EVENTS[c.type]);}
function blockDef(type){return FB_BLOCKS[type]||null;}
function nodeKey(id){return '@fc:'+String(id);}
function idFromNode(node){return String(node||'').indexOf('@fc:')===0?String(node).slice(4):'';}
function isFirebaseNode(node){return isFirebaseComponent(componentById(idFromNode(node)));}
function eventDef(c,key){var a=c?(FB_EVENTS[c.type]||[]):[];return a.find(function(e){return e.key===key;})||{key:key,name:key,desc:'Firebase event'};}
function esc2(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function icon(type){return type==='firebaseAuth'?'shield_person':'database';}
function eventStore(id,key){return ensureEventPath(nodeKey(id),key);}

/* ---------- Library Manager + Firebase configuration ---------- */
function renderFirebaseConfig(){
  ensureState();
  var body=document.getElementById('bwLibBody');if(!body)return;
  var toggle=body.querySelector('[data-lib-toggle="firebase"]');if(toggle)toggle.disabled=false;
  var old=body.querySelector('.bw-firebase-config-card');if(old)old.remove();
  var card=document.createElement('section');card.className='bw-firebase-config-card';
  var enabled=state.libraryManager.firebase===true;
  card.innerHTML='<div class="bw-firebase-config-title"><span class="bw-google-icon">local_fire_department</span><span><b>Firebase project config</b><small>Usado pelo Firebase Auth e Realtime Database</small></span></div>'+
    '<label><span>Web API Key</span><input data-fb-config="apiKey" placeholder="AIza..." value="'+esc2(state.firebaseConfig.apiKey)+'" '+(enabled?'':'disabled')+'></label>'+
    '<label><span>Realtime Database URL</span><input data-fb-config="databaseURL" placeholder="https://seu-projeto-default-rtdb.firebaseio.com" value="'+esc2(state.firebaseConfig.databaseURL)+'" '+(enabled?'':'disabled')+'></label>'+
    '<p>A API Key do Firebase faz parte da configuração pública do app. Proteja seus dados com regras corretas no Firebase.</p>';
  body.appendChild(card);
  card.querySelectorAll('[data-fb-config]').forEach(function(i){i.onchange=i.oninput=function(){state.firebaseConfig[this.dataset.fbConfig]=this.value.trim();autoSave();};});
}
function installLibraryObserver(){
  var back=document.getElementById('bwLibraryManager');if(!back){setTimeout(installLibraryObserver,250);return;}
  if(back.dataset.bwFirebaseConfig==='1'){renderFirebaseConfig();return;}back.dataset.bwFirebaseConfig='1';
  libObserver=new MutationObserver(function(){requestAnimationFrame(renderFirebaseConfig);});libObserver.observe(back,{childList:true,subtree:true});
  back.addEventListener('change',function(e){if(e.target&&e.target.dataset&&e.target.dataset.libToggle==='firebase'){setTimeout(renderFirebaseConfig,0);if(window.BrotwareFunctionalComponents&&BrotwareFunctionalComponents.refresh)BrotwareFunctionalComponents.refresh();}},true);
  renderFirebaseConfig();
}

/* ---------- Logic blocks ---------- */
var previousNewBlock=window.newBlock;
window.newBlock=function(type){
  var d=blockDef(type);if(!d)return previousNewBlock(type);
  var first=componentsOf(d.componentType)[0],p={component:first?first.id:''};
  if(type==='fbAuthCreate'||type==='fbAuthSignIn'){p.email='email@exemplo.com';p.password='123456';p.saveVar='';}
  else if(type==='fbAuthReset')p.email='email@exemplo.com';
  else if(type==='fbAuthCurrent')p.saveVar='';
  else if(type==='fbDbGet'){p.path='users';p.saveVar='';}
  else if(type==='fbDbSet'||type==='fbDbUpdate'){p.path='users/user1';p.value='{"name":"Brotware"}';}
  else if(type==='fbDbPush'){p.path='messages';p.value='{"text":"Olá"}';p.saveVar='';}
  else if(type==='fbDbRemove'||type==='fbDbListen')p.path='users';
  return{id:uid('block'),type:type,props:p,children:[],elseChildren:[],inputs:{},__swCategory:'component'};
};
Object.keys(FB_BLOCKS).forEach(function(k){BLOCK_META[k]={name:FB_BLOCKS[k].name,icon:FB_BLOCKS[k].icon,cls:'component'};});

var previousSummary=window.blockSummary;
window.blockSummary=function(b){
  var d=blockDef(b&&b.type);if(!d)return previousSummary?previousSummary(b):'';
  var p=b.props||{},c=componentById(p.component),name=c?c.name:'Firebase';
  if(/^fbAuth/.test(b.type))return name+(p.email?' · '+p.email:'');
  return name+(p.path?' · /'+String(p.path).replace(/^\/+/, ''):'');
};
function componentOptions(type,selected){var h='<option value="">Selecione</option>';componentsOf(type).forEach(function(c){h+='<option value="'+esc2(c.id)+'" '+(String(c.id)===String(selected)?'selected':'')+'>'+esc2(c.name)+'</option>';});return h;}
function variableOptions(selected){var h='<option value="">Selecione</option>';Object.keys(state.variables||{}).forEach(function(k){h+='<option value="'+esc2(k)+'" '+(k===selected?'selected':'')+'>'+esc2(k)+'</option>';});return h;}
function fieldHtml(label,id,value,type,def){
  if(type==='component')return '<label class="field span-2"><span>'+esc2(label)+'</span><select id="'+id+'">'+componentOptions(def.componentType,value)+'</select></label>';
  if(type==='variable')return '<label class="field span-2"><span>'+esc2(label)+'</span><select id="'+id+'">'+variableOptions(value)+'</select></label>';
  return '<label class="field span-2"><span>'+esc2(label)+'</span><input id="'+id+'" '+(id.indexOf('password')>=0?'type="password"':'type="text"')+' value="'+esc2(value==null?'':value)+'"></label>';
}
var previousOpenBlockEditor=window.openBlockEditor,previousSaveBlockEditor=window.saveBlockEditor;
window.openBlockEditor=function(id){
  var f=findBlock(id);if(!f||!blockDef(f.block.type))return previousOpenBlockEditor(id);
  var b=f.block,d=blockDef(b.type),p=b.props||{};state.editingBlockId=id;$('#blockModalTitle').textContent=d.name;$('#blockModalSubtitle').textContent='Firebase Component';
  var h='<div class="block-config-grid">';d.fields.forEach(function(x){h+=fieldHtml(x[1],'fb_'+x[0],p[x[0]],x[2],d);});h+='</div><div class="block-help">Valores aceitam <code>$variavel</code>. Campos Value / JSON aceitam objetos JSON ou valores simples.</div>';$('#blockEditorFields').innerHTML=h;openModal('blockModal');
};
window.saveBlockEditor=function(){
  var f=findBlock(state.editingBlockId);if(!f||!blockDef(f.block.type))return previousSaveBlockEditor();
  var b=f.block,d=blockDef(b.type);d.fields.forEach(function(x){var e=document.getElementById('fb_'+x[0]);if(e)b.props[x[0]]=e.value;});closeModal('blockModal');saveLogic();renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();
};
function refreshPalette(){
  var ov=document.getElementById('swLogicOverlay'),scroll=document.getElementById('swPaletteScroll');if(!ov||!scroll)return;
  var active=ov.querySelector('.sw-cat.active'),cat=active&&active.dataset.swCat,old=scroll.querySelector('.bw-firebase-logic-pack');if(old)old.remove();if(cat!=='component')return;
  var available=Object.keys(FB_BLOCKS).filter(function(k){return componentsOf(FB_BLOCKS[k].componentType).length>0;});if(!available.length)return;
  var wrap=document.createElement('div');wrap.className='bw-firebase-logic-pack';wrap.innerHTML='<div class="bw-firebase-logic-title">Firebase</div>'+available.map(function(k){var d=FB_BLOCKS[k];return '<button type="button" class="sw-palette-item sw-standard-item" data-sw-standard-type="'+k+'" style="--item-color:#f5a623"><span class="ico"><span class="bw-google-icon">'+d.icon+'</span></span><span><b>'+esc2(d.name)+'</b><small>'+esc2(d.componentType)+'</small></span></button>';}).join('');scroll.appendChild(wrap);
}
function queuePalette(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refreshPalette();});}
function installPalette(){var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(installPalette,250);return;}if(ov.dataset.bwFirebasePalette==='1'){queuePalette();return;}ov.dataset.bwFirebasePalette='1';paletteObserver=new MutationObserver(queuePalette);paletteObserver.observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});ov.addEventListener('click',function(){setTimeout(queuePalette,0);},true);queuePalette();}

/* ---------- Firebase component events ---------- */
var previousRefreshNodes=window.refreshEventNodeSelect,previousRefreshTypes=window.refreshEventTypes,previousRenderLogic=window.renderLogic;
window.refreshEventNodeSelect=function(){
  var sel=document.getElementById('eventNodeSelect'),old=sel?sel.value:'@page';if(previousRefreshNodes)previousRefreshNodes();sel=document.getElementById('eventNodeSelect');if(!sel)return;
  var group=document.createElement('optgroup');group.label='Firebase';state.functionalComponents.forEach(function(c){if(!isFirebaseComponent(c))return;var val=nodeKey(c.id);if(Array.prototype.some.call(sel.options,function(o){return o.value===val;}))return;var o=document.createElement('option');o.value=val;o.textContent='🔥 '+c.name;group.appendChild(o);});if(group.children.length)sel.appendChild(group);
  if(Array.prototype.some.call(sel.options,function(o){return o.value===old;}))sel.value=old;window.refreshEventTypes();
};
window.refreshEventTypes=function(){
  var node=document.getElementById('eventNodeSelect')?document.getElementById('eventNodeSelect').value:'@page';if(!isFirebaseNode(node)){if(previousRefreshTypes)previousRefreshTypes();return;}
  var c=componentById(idFromNode(node)),list=FB_EVENTS[c.type]||[],sel=document.getElementById('eventTypeSelect'),old=sel?sel.value:'';if(!sel)return;sel.innerHTML=list.map(function(e){return '<option value="'+esc2(e.key)+'">'+esc2(e.name)+'</option>';}).join('');if(list.some(function(e){return e.key===old;}))sel.value=old;if(previousRenderLogic)previousRenderLogic();
};
window.renderLogic=function(){
  if(previousRenderLogic)previousRenderLogic();if(state.logicMode!=='event')return;var node=currentEventNode();if(!isFirebaseNode(node))return;var c=componentById(idFromNode(node)),ev=eventDef(c,currentEventType()),t=document.getElementById('logicTitle'),s=document.getElementById('logicSubtitle');if(t)t.textContent=c.name+' → '+ev.name;if(s)s.textContent=ev.desc;
};
function openFirebaseEvent(id,key){
  var c=componentById(id);if(!c)return;eventStore(id,key);setLogicMode('event');window.refreshEventNodeSelect();var ns=document.getElementById('eventNodeSelect'),ts=document.getElementById('eventTypeSelect');if(ns){ns.value=nodeKey(id);window.refreshEventTypes();}if(ts)ts.value=key;window.renderLogic();var ev=eventDef(c,key);if(window.BrotwareSketchLogic&&BrotwareSketchLogic.open)BrotwareSketchLogic.open(c.name+' · '+ev.name,ev.desc);
}
function componentCategoryActive(){var a=document.querySelector('#skEventRail .sk-event-cat.active');return !!(a&&a.dataset.skCat==='component');}
function renderEventAddon(){
  if(!componentCategoryActive())return;var box=document.getElementById('skEventCards');if(!box)return;var existing=box.querySelector('.bw-firebase-event-addon');if(existing)existing.remove();var comps=state.functionalComponents.filter(isFirebaseComponent);if(!comps.length)return;
  var wrap=document.createElement('section');wrap.className='bw-firebase-event-addon';wrap.innerHTML='<div class="bw-firebase-event-addon-title"><span class="bw-google-icon">local_fire_department</span><b>Firebase</b></div>'+comps.map(function(c){var events=FB_EVENTS[c.type]||[];return '<div class="bw-firebase-event-group"><div class="bw-firebase-event-component"><span class="bw-google-icon">'+icon(c.type)+'</span><span><b>'+esc2(c.name)+'</b><small>'+esc2(c.type)+'</small></span></div>'+events.map(function(ev){var count=eventStore(c.id,ev.key).length;return '<button type="button" class="sk-event-card bw-firebase-event-card" data-firebase-event-id="'+esc2(c.id)+'" data-firebase-event-key="'+esc2(ev.key)+'"><span class="ev-icon"><span class="bw-google-icon">bolt</span></span><span><b>'+esc2(ev.name)+'</b><small>'+esc2(ev.desc)+' · '+count+' bloco(s)</small></span><span class="chev">›</span></button>';}).join('')+'</div>';}).join('');box.appendChild(wrap);
}
function queueEvents(){if(eventQueued)return;eventQueued=true;requestAnimationFrame(function(){eventQueued=false;renderEventAddon();});}
function installEvents(){var home=document.getElementById('skEventHome'),box=document.getElementById('skEventCards');if(!home||!box){setTimeout(installEvents,250);return;}if(home.dataset.bwFirebaseEvents==='1'){queueEvents();return;}home.dataset.bwFirebaseEvents='1';box.addEventListener('click',function(e){var b=e.target.closest('[data-firebase-event-id]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openFirebaseEvent(b.dataset.firebaseEventId,b.dataset.firebaseEventKey);},true);eventObserver=new MutationObserver(queueEvents);eventObserver.observe(home,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});home.addEventListener('click',function(){setTimeout(queueEvents,0);},true);queueEvents();}

/* ---------- Firebase REST helpers ---------- */
function cfg(){ensureState();return state.firebaseConfig;}
function requireApiKey(){var k=String(cfg().apiKey||'').trim();if(!k)throw new Error('Firebase Web API Key não configurada');return k;}
function sessionKey(){var k=String(cfg().apiKey||'');return 'brotware_fb_session_'+(k.slice(-12)||'default');}
function readSession(){try{return JSON.parse(localStorage.getItem(sessionKey())||'null');}catch(_){return null;}}
function saveSession(s){if(s)localStorage.setItem(sessionKey(),JSON.stringify(s));else localStorage.removeItem(sessionKey());}
function publicUser(s){return s?{uid:s.localId||s.user_id||'',email:s.email||'',expiresAt:s.expiresAt||0}:null;}
async function jsonFetch(url,opt){var r=await fetch(url,opt||{}),text=await r.text(),d=null;try{d=text?JSON.parse(text):null;}catch(_){d=text;}if(!r.ok){var msg=d&&d.error&&(d.error.message||d.error)||('HTTP '+r.status);throw new Error(String(msg));}return d;}
async function authCall(action,body){return jsonFetch('https://identitytoolkit.googleapis.com/v1/'+action+'?key='+encodeURIComponent(requireApiKey()),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
function normalizeSession(d,email){return{idToken:d.idToken||d.id_token||'',refreshToken:d.refreshToken||d.refresh_token||'',localId:d.localId||d.user_id||'',email:d.email||email||'',expiresAt:Date.now()+(Number(d.expiresIn||d.expires_in||3600)*1000)};}
async function validToken(){
  var s=readSession();if(!s)return'';if(s.idToken&&Number(s.expiresAt||0)>Date.now()+60000)return s.idToken;if(!s.refreshToken)return s.idToken||'';
  var data=await jsonFetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(requireApiKey()),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(s.refreshToken)});var n=normalizeSession(data,s.email);saveSession(n);return n.idToken;
}
function dbBase(){var u=String(cfg().databaseURL||'').trim().replace(/\/+$/,'');if(!u)throw new Error('Firebase Realtime Database URL não configurada');return u;}
function dbPath(path){return String(path||'').replace(/^\/+|\/+$/g,'').split('/').filter(Boolean).map(encodeURIComponent).join('/');}
function parseValue(v){if(typeof v!=='string')return v;var s=v.trim();if(!s)return'';if((s[0]==='{'&&s[s.length-1]==='}')||(s[0]==='['&&s[s.length-1]===']')){try{return JSON.parse(s);}catch(_){}}return v;}
async function dbRequest(method,path,value){var token=await validToken(),url=dbBase()+'/'+dbPath(path)+'.json'+(token?'?auth='+encodeURIComponent(token):''),opt={method:method,headers:{'Content-Type':'application/json'}};if(method!=='GET'&&method!=='DELETE')opt.body=JSON.stringify(parseValue(value));return jsonFetch(url,opt);}
async function fireEvent(id,key,ctx,payload,error){if(!id||!ctx)return;ctx.vars=ctx.vars||{};ctx.vars.__component=id;ctx.vars.__result=payload;ctx.vars.__error=error||'';var p=currentPage(),list=p&&p.events&&p.events[nodeKey(id)]&&p.events[nodeKey(id)][key];if(list&&list.length)await window.executeBlocks(list,ctx);}
function stopStream(id){var s=streams[id];if(s){try{s.close();}catch(_){}delete streams[id];}}
async function startStream(id,path,ctx){
  stopStream(id);var token=await validToken(),url=dbBase()+'/'+dbPath(path)+'.json'+(token?'?auth='+encodeURIComponent(token):''),es=new EventSource(url);streams[id]=es;
  function onData(e){try{var payload=JSON.parse(e.data);fireEvent(id,'dataChanged',ctx,payload,'');}catch(err){fireEvent(id,'error',ctx,null,String(err.message||err));}}
  es.addEventListener('put',onData);es.addEventListener('patch',onData);es.onerror=function(){fireEvent(id,'error',ctx,null,'Firebase realtime listener error');};return true;
}

/* ---------- Preview execution ---------- */
var previousExecute=window.executeBlocks;
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i],p=b.props||{},id=p.component;
    if(!blockDef(b.type)){await previousExecute([b],ctx);continue;}
    try{
      if(b.type==='fbAuthCreate'){
        var su=await authCall('accounts:signUp',{email:String(resolveValue(p.email,ctx)||''),password:String(resolveValue(p.password,ctx)||''),returnSecureToken:true}),ss=normalizeSession(su,p.email);saveSession(ss);var usr=publicUser(ss);if(p.saveVar)ctx.vars[p.saveVar]=usr;await fireEvent(id,'signUpSuccess',ctx,usr,'');
      }else if(b.type==='fbAuthSignIn'){
        var si=await authCall('accounts:signInWithPassword',{email:String(resolveValue(p.email,ctx)||''),password:String(resolveValue(p.password,ctx)||''),returnSecureToken:true}),sis=normalizeSession(si,p.email);saveSession(sis);var user=publicUser(sis);if(p.saveVar)ctx.vars[p.saveVar]=user;await fireEvent(id,'signInSuccess',ctx,user,'');
      }else if(b.type==='fbAuthSignOut'){saveSession(null);await fireEvent(id,'signedOut',ctx,true,'');}
      else if(b.type==='fbAuthReset'){var em=String(resolveValue(p.email,ctx)||'');await authCall('accounts:sendOobCode',{requestType:'PASSWORD_RESET',email:em});await fireEvent(id,'passwordResetSent',ctx,em,'');}
      else if(b.type==='fbAuthCurrent'){var cur=readSession();if(cur)await validToken();cur=readSession();var pu=publicUser(cur);if(p.saveVar)ctx.vars[p.saveVar]=pu;await fireEvent(id,'userLoaded',ctx,pu,'');}
      else if(b.type==='fbDbGet'){var got=await dbRequest('GET',resolveValue(p.path,ctx));if(p.saveVar)ctx.vars[p.saveVar]=got;await fireEvent(id,'dataLoaded',ctx,got,'');}
      else if(b.type==='fbDbSet'){var setv=await dbRequest('PUT',resolveValue(p.path,ctx),resolveValue(p.value,ctx));await fireEvent(id,'writeSuccess',ctx,setv,'');}
      else if(b.type==='fbDbUpdate'){var up=await dbRequest('PATCH',resolveValue(p.path,ctx),resolveValue(p.value,ctx));await fireEvent(id,'writeSuccess',ctx,up,'');}
      else if(b.type==='fbDbPush'){var pushed=await dbRequest('POST',resolveValue(p.path,ctx),resolveValue(p.value,ctx));var key=pushed&&pushed.name||'';if(p.saveVar)ctx.vars[p.saveVar]=key;await fireEvent(id,'writeSuccess',ctx,pushed,'');}
      else if(b.type==='fbDbRemove'){await dbRequest('DELETE',resolveValue(p.path,ctx));await fireEvent(id,'writeSuccess',ctx,true,'');}
      else if(b.type==='fbDbListen'){await startStream(id,resolveValue(p.path,ctx),ctx);}
      else if(b.type==='fbDbStopListen'){stopStream(id);}
    }catch(err){var msg=String(err&&err.message||err);if(/^fbAuth/.test(b.type))await fireEvent(id,'authError',ctx,null,msg);else await fireEvent(id,'error',ctx,null,msg);}
  }
};

/* ---------- Exported HTML runtime ---------- */
var previousRuntime=window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=previousRuntime(page),firebaseConfig=JSON.stringify({apiKey:String(cfg().apiKey||''),databaseURL:String(cfg().databaseURL||'')}),marker='var vars=',needle="else if(b.type==='fetch'){";
  var helper="var bwFirebaseCfg="+firebaseConfig+";var bwFirebaseStreams={};"+
  "function bwFbSessionKey(){var k=String(bwFirebaseCfg.apiKey||'');return 'brotware_fb_session_'+(k.slice(-12)||'default')}"+
  "function bwFbReadSession(){try{return JSON.parse(localStorage.getItem(bwFbSessionKey())||'null')}catch(_){return null}}"+
  "function bwFbSaveSession(s){if(s)localStorage.setItem(bwFbSessionKey(),JSON.stringify(s));else localStorage.removeItem(bwFbSessionKey())}"+
  "function bwFbPublicUser(s){return s?{uid:s.localId||s.user_id||'',email:s.email||'',expiresAt:s.expiresAt||0}:null}"+
  "function bwFbApiKey(){var k=String(bwFirebaseCfg.apiKey||'').trim();if(!k)throw new Error('Firebase Web API Key não configurada');return k}"+
  "async function bwFbFetch(url,opt){var r=await fetch(url,opt||{}),t=await r.text(),d=null;try{d=t?JSON.parse(t):null}catch(_){d=t}if(!r.ok){var m=d&&d.error&&(d.error.message||d.error)||('HTTP '+r.status);throw new Error(String(m))}return d}"+
  "async function bwFbAuth(a,b){return bwFbFetch('https://identitytoolkit.googleapis.com/v1/'+a+'?key='+encodeURIComponent(bwFbApiKey()),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})}"+
  "function bwFbNorm(d,email){return{idToken:d.idToken||d.id_token||'',refreshToken:d.refreshToken||d.refresh_token||'',localId:d.localId||d.user_id||'',email:d.email||email||'',expiresAt:Date.now()+(Number(d.expiresIn||d.expires_in||3600)*1000)}}"+
  "async function bwFbToken(){var s=bwFbReadSession();if(!s)return'';if(s.idToken&&Number(s.expiresAt||0)>Date.now()+60000)return s.idToken;if(!s.refreshToken)return s.idToken||'';var d=await bwFbFetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(bwFbApiKey()),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(s.refreshToken)}),n=bwFbNorm(d,s.email);bwFbSaveSession(n);return n.idToken}"+
  "function bwFbBase(){var u=String(bwFirebaseCfg.databaseURL||'').trim().replace(/\\/+$/,'');if(!u)throw new Error('Firebase Realtime Database URL não configurada');return u}"+
  "function bwFbPath(p){return String(p||'').replace(/^\\/+|\\/+$/g,'').split('/').filter(Boolean).map(encodeURIComponent).join('/')}"+
  "function bwFbValue(v){if(typeof v!=='string')return v;var s=v.trim();if(!s)return'';if((s[0]==='{'&&s[s.length-1]==='}')||(s[0]==='['&&s[s.length-1]===']')){try{return JSON.parse(s)}catch(_){}}return v}"+
  "async function bwFbDb(m,p,v){var tok=await bwFbToken(),url=bwFbBase()+'/'+bwFbPath(p)+'.json'+(tok?'?auth='+encodeURIComponent(tok):''),o={method:m,headers:{'Content-Type':'application/json'}};if(m!=='GET'&&m!=='DELETE')o.body=JSON.stringify(bwFbValue(v));return bwFbFetch(url,o)}"+
  "async function bwFbEvent(id,key,payload,error){vars.__component=id;vars.__result=payload;vars.__error=error||'';var n='@fc:'+id,x=cfg.events[n]&&cfg.events[n][key];if(x&&x.length)await run(x)}"+
  "function bwFbStop(id){var s=bwFirebaseStreams[id];if(s){try{s.close()}catch(_){}delete bwFirebaseStreams[id]}}"+
  "async function bwFbListen(id,path){bwFbStop(id);var tok=await bwFbToken(),url=bwFbBase()+'/'+bwFbPath(path)+'.json'+(tok?'?auth='+encodeURIComponent(tok):''),es=new EventSource(url);bwFirebaseStreams[id]=es;function data(e){try{bwFbEvent(id,'dataChanged',JSON.parse(e.data),'')}catch(er){bwFbEvent(id,'error',null,String(er.message||er))}}es.addEventListener('put',data);es.addEventListener('patch',data);es.onerror=function(){bwFbEvent(id,'error',null,'Firebase realtime listener error')}};";
  if(code.indexOf(marker)>=0)code=code.replace(marker,helper+marker);
  var ext="else if(b.type==='fbAuthCreate'){try{var d=await bwFbAuth('accounts:signUp',{email:String(rv(p.email)||''),password:String(rv(p.password)||''),returnSecureToken:true}),s=bwFbNorm(d,p.email);bwFbSaveSession(s);var u=bwFbPublicUser(s);if(p.saveVar)vars[p.saveVar]=u;await bwFbEvent(p.component,'signUpSuccess',u,'')}catch(e){await bwFbEvent(p.component,'authError',null,String(e.message||e))}}"+
  "else if(b.type==='fbAuthSignIn'){try{var d2=await bwFbAuth('accounts:signInWithPassword',{email:String(rv(p.email)||''),password:String(rv(p.password)||''),returnSecureToken:true}),s2=bwFbNorm(d2,p.email);bwFbSaveSession(s2);var u2=bwFbPublicUser(s2);if(p.saveVar)vars[p.saveVar]=u2;await bwFbEvent(p.component,'signInSuccess',u2,'')}catch(e){await bwFbEvent(p.component,'authError',null,String(e.message||e))}}"+
  "else if(b.type==='fbAuthSignOut'){bwFbSaveSession(null);await bwFbEvent(p.component,'signedOut',true,'')}"+
  "else if(b.type==='fbAuthReset'){try{var em=String(rv(p.email)||'');await bwFbAuth('accounts:sendOobCode',{requestType:'PASSWORD_RESET',email:em});await bwFbEvent(p.component,'passwordResetSent',em,'')}catch(e){await bwFbEvent(p.component,'authError',null,String(e.message||e))}}"+
  "else if(b.type==='fbAuthCurrent'){try{var cs=bwFbReadSession();if(cs)await bwFbToken();cs=bwFbReadSession();var cu=bwFbPublicUser(cs);if(p.saveVar)vars[p.saveVar]=cu;await bwFbEvent(p.component,'userLoaded',cu,'')}catch(e){await bwFbEvent(p.component,'authError',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbGet'){try{var dg=await bwFbDb('GET',rv(p.path));if(p.saveVar)vars[p.saveVar]=dg;await bwFbEvent(p.component,'dataLoaded',dg,'')}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbSet'){try{var ds=await bwFbDb('PUT',rv(p.path),rv(p.value));await bwFbEvent(p.component,'writeSuccess',ds,'')}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbUpdate'){try{var du=await bwFbDb('PATCH',rv(p.path),rv(p.value));await bwFbEvent(p.component,'writeSuccess',du,'')}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbPush'){try{var dp=await bwFbDb('POST',rv(p.path),rv(p.value)),dk=dp&&dp.name||'';if(p.saveVar)vars[p.saveVar]=dk;await bwFbEvent(p.component,'writeSuccess',dp,'')}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbRemove'){try{await bwFbDb('DELETE',rv(p.path));await bwFbEvent(p.component,'writeSuccess',true,'')}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbListen'){try{await bwFbListen(p.component,rv(p.path))}catch(e){await bwFbEvent(p.component,'error',null,String(e.message||e))}}"+
  "else if(b.type==='fbDbStopListen')bwFbStop(p.component);";
  if(code.indexOf(needle)>=0)code=code.replace(needle,ext+needle);return code;
};

function install(){
  ensureState();if(!registerCatalog()){setTimeout(install,200);return;}
  installLibraryObserver();installPalette();installEvents();
  if(window.BrotwareFunctionalComponents&&BrotwareFunctionalComponents.refresh)BrotwareFunctionalComponents.refresh();
  try{window.refreshEventNodeSelect();}catch(_){}
}
setTimeout(install,0);setTimeout(install,600);setTimeout(install,1400);
window.BrotwareFirebaseComponents={components:FB_COMPONENTS,events:FB_EVENTS,blocks:FB_BLOCKS,config:function(){ensureState();return state.firebaseConfig;},stopAll:function(){Object.keys(streams).forEach(stopStream);}};
})();
