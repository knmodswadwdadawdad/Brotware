(function(){
'use strict';

var installed=false,baseAll=null,baseFirst=null,baseFirstInput=null,baseRefreshNodes=null,baseRefreshTypes=null,baseTargets=null,baseRenderLogic=null,baseAutoSave=null;
function provider(){return window.BrotwareExternalDomProvider&&BrotwareExternalDomProvider.isActive()?BrotwareExternalDomProvider:null;}
function esc2(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function currentRef(){var p=provider();return p?p.currentRef():null;}
function allRefs(){var p=provider();return p?p.logicViews().map(function(x){return x.ref;}):[];}
function label(ref){var p=provider();if(!p)return String(ref||'');var r=p.logicViews().find(function(x){return x.ref===ref;});return r?r.label+' · '+r.subtitle:String(ref||'');}
function installGlobals(){
  if(installed)return;installed=true;
  baseAll=window.allNodeIds;baseFirst=window.firstNodeId;baseFirstInput=window.firstInputId;baseRefreshNodes=window.refreshEventNodeSelect;baseRefreshTypes=window.refreshEventTypes;baseTargets=window.targetOptions;baseRenderLogic=window.renderLogic;baseAutoSave=window.autoSave;
  window.allNodeIds=function(){var p=provider();return p?allRefs():baseAll.apply(this,arguments);};
  window.firstNodeId=function(){var p=provider();return p?p.firstRef():baseFirst.apply(this,arguments);};
  window.firstInputId=function(){var p=provider();return p?p.firstInputRef():baseFirstInput.apply(this,arguments);};
  window.targetOptions=function(selected){var p=provider();if(!p)return baseTargets(selected);var html='<option value="">Selecione</option>';p.logicViews().forEach(function(x){html+='<option '+(x.ref===selected?'selected':'')+' value="'+esc2(x.ref)+'">'+esc2(x.label+' · '+x.tag+(x.subtitle.indexOf(' • ')>=0?' · '+x.subtitle.split(' • ').slice(1).join(' • '):''))+'</option>';});return html;};
  window.refreshEventNodeSelect=refreshNodes;
  window.refreshEventTypes=refreshTypes;
  window.renderLogic=function(){var r=baseRenderLogic.apply(this,arguments);var p=provider();if(p&&state.logicMode!=='function'){var ref=$('#eventNodeSelect')&&$('#eventNodeSelect').value;if(ref&&ref!=='@page'){var t=document.getElementById('logicTitle');if(t)t.textContent=label(ref)+' → '+(($('#eventTypeSelect')&&$('#eventTypeSelect').value)||'click');var s=document.getElementById('logicSubtitle');if(s)s.textContent='Evento ligado ao elemento real do site importado';}}return r;};
  window.autoSave=function(){var r=baseAutoSave?baseAutoSave.apply(this,arguments):undefined;if(provider()&&window.BrotwareExternalHybrid)setTimeout(function(){BrotwareExternalHybrid.syncLogic();},0);return r;};
}
function refreshNodes(){
  var p=provider();if(!p)return baseRefreshNodes.apply(this,arguments);var sel=$('#eventNodeSelect');if(!sel)return;var old=sel.value||currentRef()||'@page',html='<option value="@page">📄 Página</option>';
  p.logicViews().forEach(function(x){html+='<option value="'+esc2(x.ref)+'">'+esc2(x.label+' · '+x.tag+(x.subtitle.indexOf(' • ')>=0?' · '+x.subtitle.split(' • ').slice(1).join(' • '):''))+'</option>';});sel.innerHTML=html;
  var desired=currentRef()||old;if(Array.prototype.some.call(sel.options,function(o){return o.value===desired;}))sel.value=desired;else if(Array.prototype.some.call(sel.options,function(o){return o.value===old;}))sel.value=old;else sel.value='@page';
  refreshTypes();
}
function refreshTypes(){
  var p=provider();if(!p)return baseRefreshTypes.apply(this,arguments);var ns=$('#eventNodeSelect'),sel=$('#eventTypeSelect');if(!ns||!sel)return;var ref=ns.value||'@page',options=ref==='@page'?(EVENT_OPTIONS['@page']||[['load','onLoad']]):p.eventOptions(ref),old=sel.value;sel.innerHTML=options.map(function(x){return'<option value="'+esc2(x[0])+'">'+esc2(x[1])+'</option>';}).join('');if(options.some(function(x){return x[0]===old;}))sel.value=old;if(typeof renderLogic==='function')renderLogic();
}
function selectionChanged(e){var p=provider();if(!p)return;var x=e.detail||{},name=x.id||x.tag||'View',labelEl=document.getElementById('selectedTargetName');if(labelEl)labelEl.textContent=name;refreshNodes();}
function snapshotChanged(){if(provider())refreshNodes();}
function hookControls(){var sel=document.getElementById('eventNodeSelect');if(sel&&!sel.dataset.bwExternalLogic){sel.dataset.bwExternalLogic='1';sel.addEventListener('change',function(){if(provider())refreshTypes();});}}
function install(){if(!window.allNodeIds||!window.refreshEventNodeSelect||!window.targetOptions||!window.renderLogic||!window.BrotwareExternalDomProvider){setTimeout(install,100);return;}installGlobals();hookControls();window.addEventListener('brotware:external-selection',selectionChanged);window.addEventListener('brotware:external-snapshot',snapshotChanged);window.addEventListener('brotware:external-open',function(){setTimeout(function(){refreshNodes();if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.syncLogic();},80);});setTimeout(hookControls,600);}
window.BrotwareExternalLogicProvider={refresh:refreshNodes,sync:function(){if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.syncLogic();},labelFor:label};
setTimeout(install,0);setTimeout(install,700);
})();