(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var SETTINGS_PREFIX='brotware_project_settings_v1:';
var CONFIG_PREFIX='brotware_web_config_v1:';
var selectedId='',deleteId='',settingsId='',pendingIcon='';
var actionBackdrop=null,deleteBackdrop=null,settingsBackdrop=null,listObserver=null,reorderLock=false;

function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function slug(v){var s=String(v||'project').trim().toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}return s.replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function icon(name){return'<span class="bw-google-icon">'+name+'</span>';}
function readStore(){try{var s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');return s&&Array.isArray(s.projects)?s:{version:1,projects:[]};}catch(_){return{version:1,projects:[]};}}
function writeStore(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function findProject(id,s){s=s||readStore();return s.projects.find(function(p){return p.id===id;})||null;}
function activeId(){return localStorage.getItem(ACTIVE_KEY)||'';}
function readSettings(id){if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.read==='function')return BrotwareProjectSettings.read(id);try{return JSON.parse(localStorage.getItem(SETTINGS_PREFIX+id)||'{}')||{};}catch(_){return{};}}
function readConfig(id){try{return JSON.parse(localStorage.getItem(CONFIG_PREFIX+id)||'{}')||{};}catch(_){return{};}}
function projectInfo(p){var n=p&&p.data&&Array.isArray(p.data.pages)?p.data.pages.length:0;return n+' página'+(n===1?'':'s')+' · Web';}
function notice(msg){if(typeof toast==='function'){toast(msg);return;}var t=document.getElementById('bwHomeToast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},1600);}

function build(){
  if(actionBackdrop)return;
  actionBackdrop=document.createElement('div');actionBackdrop.id='bwProjectActionBackdrop';actionBackdrop.className='bw-project-action-backdrop';
  actionBackdrop.innerHTML='<section class="bw-project-action-sheet" role="dialog" aria-modal="true">'+
    '<div class="bw-project-sheet-grab"></div><header class="bw-project-action-head"><strong id="bwProjectActionTitle">Project</strong><small id="bwProjectActionSub">Web project</small></header>'+
    '<div class="bw-project-action-list">'+
      '<button class="bw-project-action-item" type="button" data-bw-project-sheet-action="pin">'+icon('push_pin')+'<span class="label" id="bwProjectPinLabel">Pin project</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
      '<button class="bw-project-action-item" type="button" data-bw-project-sheet-action="backup">'+icon('history')+'<span class="label">Backup project</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
      '<button class="bw-project-action-item" type="button" data-bw-project-sheet-action="export">'+icon('ios_share')+'<span class="label">Export / Build</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
      '<button class="bw-project-action-item" type="button" data-bw-project-sheet-action="settings">'+icon('tune')+'<span class="label">Change project settings</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
      '<button class="bw-project-action-item" type="button" data-bw-project-sheet-action="configuration">'+icon('toggle_on')+'<span class="label">Project configuration</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
      '<button class="bw-project-action-item danger" type="button" data-bw-project-sheet-action="delete">'+icon('backspace')+'<span class="label">Delete project</span><span class="arrow">'+icon('arrow_forward')+'</span></button>'+
    '</div></section>';
  document.body.appendChild(actionBackdrop);

  deleteBackdrop=document.createElement('div');deleteBackdrop.id='bwProjectDeleteBackdrop';deleteBackdrop.className='bw-project-delete-backdrop';
  deleteBackdrop.innerHTML='<section class="bw-project-delete-dialog" role="alertdialog" aria-modal="true"><div class="bw-project-delete-body"><span class="bw-project-delete-icon">'+icon('delete')+'</span><h2>Delete project</h2><p id="bwProjectDeleteText">Are you sure you want to delete this project?</p></div><footer class="bw-project-delete-foot"><button type="button" id="bwProjectDeleteCancel">Cancel</button><button type="button" class="danger" id="bwProjectDeleteConfirm">Delete</button></footer></section>';
  document.body.appendChild(deleteBackdrop);

  settingsBackdrop=document.createElement('div');settingsBackdrop.id='bwProjectSettingsBackdrop';settingsBackdrop.className='bw-project-settings-backdrop';
  settingsBackdrop.innerHTML='<section class="bw-project-settings-sheet" role="dialog" aria-modal="true">'+
    '<header class="bw-project-settings-head"><button type="button" id="bwProjectSettingsBack" aria-label="Voltar">'+icon('arrow_back')+'</button><strong>Project settings</strong></header>'+
    '<main class="bw-project-settings-body">'+
      '<div class="bw-project-settings-icon-wrap"><button type="button" class="bw-project-settings-icon" id="bwProjectSettingsIcon">'+icon('language')+'</button><small>Tap to change icon</small><input type="file" id="bwProjectSettingsIconInput" accept="image/*" hidden></div>'+
      '<div class="bw-project-settings-field">'+icon('smartphone')+'<input id="bwProjectSettingsApp" placeholder="Application name"><label>Application name</label></div>'+
      '<div class="bw-project-settings-field">'+icon('favorite')+'<input id="bwProjectSettingsName" placeholder="Project name"><label>Project name</label></div>'+
      '<section class="bw-project-settings-theme"><h3>Theme colors</h3><div class="bw-project-settings-colors">'+
        '<label class="bw-project-settings-color"><input type="color" id="bwProjectSettingsAccent"><i id="bwProjectSettingsAccentSwatch"></i><small>colorAccent</small></label>'+
        '<label class="bw-project-settings-color"><input type="color" id="bwProjectSettingsPrimary"><i id="bwProjectSettingsPrimarySwatch"></i><small>colorPrimary</small></label>'+
        '<label class="bw-project-settings-color"><input type="color" id="bwProjectSettingsDark"><i id="bwProjectSettingsDarkSwatch"></i><small>PrimaryDark</small></label>'+
      '</div></section>'+
      '<div class="bw-project-settings-version">'+
        '<div class="bw-project-settings-field">'+icon('tag')+'<input id="bwProjectSettingsVersionCode" inputmode="numeric"><label>Version code</label></div>'+
        '<div class="bw-project-settings-field">'+icon('conversion_path')+'<input id="bwProjectSettingsVersionName"><label>Version name</label></div>'+
      '</div>'+
    '</main><footer class="bw-project-settings-foot"><button type="button" id="bwProjectSettingsCancel">Cancel</button><button type="button" class="primary" id="bwProjectSettingsSave">Save</button></footer></section>';
  document.body.appendChild(settingsBackdrop);

  actionBackdrop.addEventListener('click',function(e){if(e.target===actionBackdrop)closeAction();var b=e.target.closest('[data-bw-project-sheet-action]');if(b)runAction(b.dataset.bwProjectSheetAction);});
  deleteBackdrop.addEventListener('click',function(e){if(e.target===deleteBackdrop)closeDelete();});
  $('bwProjectDeleteCancel').onclick=closeDelete;$('bwProjectDeleteConfirm').onclick=performDelete;
  $('bwProjectSettingsBack').onclick=closeSettings;$('bwProjectSettingsCancel').onclick=closeSettings;$('bwProjectSettingsSave').onclick=saveSettings;
  $('bwProjectSettingsIcon').onclick=function(){$('bwProjectSettingsIconInput').click();};
  $('bwProjectSettingsIconInput').onchange=readIcon;
  ['bwProjectSettingsAccent','bwProjectSettingsPrimary','bwProjectSettingsDark'].forEach(function(id){$(id).addEventListener('input',syncSettingSwatches);});
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(settingsBackdrop.classList.contains('show')){closeSettings();return;}if(deleteBackdrop.classList.contains('show')){closeDelete();return;}if(actionBackdrop.classList.contains('show'))closeAction();});
}

function openAction(id){
  build();var p=findProject(id);if(!p)return;selectedId=id;$('bwProjectActionTitle').textContent=p.name||'Project';$('bwProjectActionSub').textContent=projectInfo(p);$('bwProjectPinLabel').textContent=p.pinned?'Unpin project':'Pin project';document.querySelectorAll('.bw-project-card.menu-open').forEach(function(c){c.classList.remove('menu-open');});actionBackdrop.classList.add('show');document.body.style.overflow='hidden';
}
function closeAction(){if(actionBackdrop)actionBackdrop.classList.remove('show');restoreBodyOverflow();}
function openDelete(id){build();var p=findProject(id);if(!p)return;deleteId=id;$('bwProjectDeleteText').textContent='Are you sure you want to delete this project named '+(p.name||'Project')+'?';deleteBackdrop.classList.add('show');document.body.style.overflow='hidden';}
function closeDelete(){if(deleteBackdrop)deleteBackdrop.classList.remove('show');deleteId='';restoreBodyOverflow();}
function closeSettings(){if(settingsBackdrop)settingsBackdrop.classList.remove('show');settingsId='';pendingIcon='';restoreBodyOverflow();}
function restoreBodyOverflow(){if((actionBackdrop&&actionBackdrop.classList.contains('show'))||(deleteBackdrop&&deleteBackdrop.classList.contains('show'))||(settingsBackdrop&&settingsBackdrop.classList.contains('show')))return;if(document.body.classList.contains('bw-project-home-open'))document.body.style.overflow='hidden';else document.body.style.overflow='';}

function runAction(action){var id=selectedId;if(!id)return;if(action==='pin'){togglePin(id);closeAction();return;}if(action==='backup'){closeAction();backupProject(id);return;}if(action==='export'){closeAction();exportProject(id);return;}if(action==='settings'){closeAction();openSettings(id);return;}if(action==='configuration'){closeAction();openConfiguration(id);return;}if(action==='delete'){closeAction();openDelete(id);}}

function togglePin(id){var s=readStore(),p=findProject(id,s);if(!p)return;p.pinned=!p.pinned;writeStore(s);refreshHome();notice(p.pinned?'Project pinned':'Project unpinned');}
function backupProject(id){
  try{if(id===activeId()&&window.BrotwareProjects&&BrotwareProjects.save)BrotwareProjects.save();var s=readStore(),p=findProject(id,s);if(!p)return;var d=JSON.parse(JSON.stringify(p.data||{}));d.format='Brotware Project Backup';d.version=5;d.projectName=p.name||d.projectName||'Brotware Project';d.projectSettings=readSettings(id);d.webConfig=readConfig(id);var blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=slug(p.name)+'-backup.brotware.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},800);notice('Backup created');}catch(e){console.error(e);notice('Could not create backup');}
}
function exportProject(id){if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.exportZip==='function'){BrotwareProjectSettings.exportZip(id);return;}if(id===activeId()&&window.BrotwareProjects&&BrotwareProjects.exportZip){BrotwareProjects.exportZip();return;}notice('Export is not available yet');}
function openConfiguration(id){if(window.BrotwareProjects&&typeof BrotwareProjects.open==='function'){BrotwareProjects.open(id);setTimeout(function(){if(window.BrotwareConfiguration&&typeof BrotwareConfiguration.open==='function')BrotwareConfiguration.open();else{var b=document.getElementById('bwConfigTopBtn');if(b)b.click();}},120);}}

function openSettings(id){
  build();var p=findProject(id);if(!p)return;settingsId=id;var s=readSettings(id)||{},t=s.theme||{};pendingIcon=s.icon||'';$('bwProjectSettingsApp').value=s.applicationName||(p.data&&p.data.strings&&p.data.strings.app_name)||p.name||'Brotware App';$('bwProjectSettingsName').value=p.name||'Brotware Project';$('bwProjectSettingsAccent').value=t.accent||'#00d4c8';$('bwProjectSettingsPrimary').value=t.primary||'#6d55d9';$('bwProjectSettingsDark').value=t.primaryDark||'#241b56';$('bwProjectSettingsVersionCode').value=Math.max(1,parseInt(s.versionCode,10)||1);$('bwProjectSettingsVersionName').value=s.versionName||'1.0';renderSettingsIcon();syncSettingSwatches();settingsBackdrop.classList.add('show');document.body.style.overflow='hidden';
}
function readIcon(){var f=this.files&&this.files[0];this.value='';if(!f)return;if(f.size>1048576){notice('Use an image up to 1 MB');return;}var r=new FileReader();r.onload=function(){pendingIcon=r.result||'';renderSettingsIcon();};r.readAsDataURL(f);}
function renderSettingsIcon(){var b=$('bwProjectSettingsIcon');if(!b)return;b.innerHTML=pendingIcon?'<img src="'+pendingIcon+'" alt="Project icon">':icon('language');}
function syncSettingSwatches(){var a=$('bwProjectSettingsAccent'),p=$('bwProjectSettingsPrimary'),d=$('bwProjectSettingsDark');if(a)$('bwProjectSettingsAccentSwatch').style.background=a.value;if(p)$('bwProjectSettingsPrimarySwatch').style.background=p.value;if(d)$('bwProjectSettingsDarkSwatch').style.background=d.value;}
function saveSettings(){
  var id=settingsId;if(!id)return;var projectName=$('bwProjectSettingsName').value.trim()||'Brotware Project',appName=$('bwProjectSettingsApp').value.trim()||projectName,settings={applicationName:appName,icon:pendingIcon||'',theme:{preset:'custom',accent:$('bwProjectSettingsAccent').value||'#00d4c8',primary:$('bwProjectSettingsPrimary').value||'#6d55d9',primaryDark:$('bwProjectSettingsDark').value||'#241b56'},versionCode:Math.max(1,parseInt($('bwProjectSettingsVersionCode').value,10)||1),versionName:$('bwProjectSettingsVersionName').value.trim()||'1.0',createdWith:'Brotware'};
  if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.persist==='function')BrotwareProjectSettings.persist(settings,id);else localStorage.setItem(SETTINGS_PREFIX+id,JSON.stringify(settings));
  var store=readStore(),p=findProject(id,store);if(p){p.name=projectName;p.folderName=slug(projectName);p.settings=settings;p.data=p.data||{};p.data.projectName=projectName;p.data.projectSettings=settings;p.data.strings=p.data.strings||{};p.data.strings.app_name=appName;writeStore(store);}
  if(id===activeId()&&typeof state!=='undefined'){state.projectName=projectName;state.projectSettings=settings;state.strings=state.strings||{};state.strings.app_name=appName;if(typeof updatePageUI==='function')updatePageUI();if(window.BrotwareProjects&&BrotwareProjects.save)BrotwareProjects.save();}
  closeSettings();refreshHome();notice('Project settings saved');
}

function performDelete(){
  var id=deleteId;if(!id)return;var card=document.querySelector('.bw-project-card[data-project-id="'+CSS.escape(id)+'"]'),oldBtn=card&&card.querySelector('[data-project-action="delete"]');closeDelete();
  if(oldBtn){var oldConfirm=window.confirm;try{window.confirm=function(){return true;};oldBtn.click();}finally{window.confirm=oldConfirm;}}
  else{var s=readStore();s.projects=s.projects.filter(function(p){return p.id!==id;});writeStore(s);if(activeId()===id){if(s.projects.length)localStorage.setItem(ACTIVE_KEY,s.projects[0].id);else localStorage.removeItem(ACTIVE_KEY);}refreshHome();}
  localStorage.removeItem(SETTINGS_PREFIX+id);localStorage.removeItem(CONFIG_PREFIX+id);notice('Project deleted');
}

function refreshHome(){if(window.BrotwareProjects&&typeof BrotwareProjects.show==='function')BrotwareProjects.show(false);setTimeout(decorateProjects,30);}
function decorateProjects(){
  var list=document.getElementById('bwProjectList');if(!list||reorderLock)return;var s=readStore(),map={};s.projects.forEach(function(p){map[p.id]=p;});var cards=Array.prototype.slice.call(list.querySelectorAll('.bw-project-card[data-project-id]'));
  cards.forEach(function(card){var p=map[card.dataset.projectId],strong=card.querySelector('.bw-project-meta strong');card.classList.toggle('bw-pinned',!!(p&&p.pinned));var mark=strong&&strong.querySelector('.bw-project-pin');if(p&&p.pinned){if(strong&&!mark){mark=document.createElement('span');mark.className='bw-project-pin';mark.innerHTML=icon('push_pin');strong.appendChild(mark);}}else if(mark)mark.remove();});
  var desired=cards.filter(function(c){var p=map[c.dataset.projectId];return p&&p.pinned;}).concat(cards.filter(function(c){var p=map[c.dataset.projectId];return !(p&&p.pinned);}));var differs=desired.some(function(c,i){return cards[i]!==c;});if(differs){reorderLock=true;desired.forEach(function(c){list.appendChild(c);});setTimeout(function(){reorderLock=false;},0);}
}
function observeList(){var list=document.getElementById('bwProjectList');if(!list){setTimeout(observeList,250);return;}if(listObserver)return;listObserver=new MutationObserver(function(){setTimeout(decorateProjects,0);});listObserver.observe(list,{childList:true});decorateProjects();}

function interceptProjectMenu(e){var more=e.target&&e.target.closest?e.target.closest('.bw-project-more'):null;if(!more)return;var card=more.closest('.bw-project-card[data-project-id]');if(!card)return;e.preventDefault();e.stopImmediatePropagation();openAction(card.dataset.projectId);}
document.addEventListener('click',interceptProjectMenu,true);

setTimeout(function(){build();observeList();},0);setTimeout(observeList,700);
window.BrotwareProjectActions={open:openAction,refresh:decorateProjects};
})();
