(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var SETTINGS_PREFIX='brotware_project_settings_v1:';
var dialog=null,shell=null,main=null,iconInput=null,iconData='',installed=false,showObserver=null;

var PRESETS=[
  {id:'purple',name:'Material Purple',accent:'#00d4c8',primary:'#6d55d9',dark:'#241b56'},
  {id:'blue',name:'Material Blue',accent:'#11cfc8',primary:'#2679d8',dark:'#174b91'},
  {id:'green',name:'Material Green',accent:'#10d1c3',primary:'#2f8a45',dark:'#18572a'},
  {id:'orange',name:'Material Orange',accent:'#ffb020',primary:'#e8752e',dark:'#8f3e18'},
  {id:'rose',name:'Material Rose',accent:'#ff4f8b',primary:'#c94d7f',dark:'#6b2442'}
];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c];});}
function $(id){return document.getElementById(id);}
function fieldIcon(name){return'<span class="bw-google-icon">'+name+'</span>';}
function selectedPreset(){var b=dialog&&dialog.querySelector('.bw-create-preset.active');return b?b.dataset.preset:'custom';}
function colorValue(id,fallback){var e=$(id);return e&&e.value?e.value:fallback;}

function build(){
  dialog=$('bwNewProjectDialog');if(!dialog)return false;
  shell=dialog.querySelector('.bw-project-dialog');if(!shell)return false;
  if(shell.dataset.bwCreateV2==='1')return true;

  var oldName=$('bwNewProjectName'),oldFile=$('bwNewProjectFile'),oldTitle=$('bwNewProjectTitle');
  var oldCancel=$('bwNewProjectCancel'),oldCreate=$('bwNewProjectCreate');
  if(!oldName||!oldFile||!oldTitle||!oldCancel||!oldCreate)return false;

  shell.dataset.bwCreateV2='1';shell.classList.add('bw-create-v2');shell.innerHTML='';
  var head=document.createElement('header');head.className='bw-create-head';head.innerHTML='<button type="button" class="bw-create-back" id="bwCreateBack" aria-label="Voltar">'+fieldIcon('arrow_back')+'</button><strong>New Project</strong>';
  main=document.createElement('main');main.className='bw-create-body';
  main.innerHTML=''+
    '<section class="bw-create-icon-section"><button type="button" class="bw-create-icon-btn" id="bwCreateIconBtn">'+fieldIcon('language')+'</button><small>Tap to change icon</small><input type="file" id="bwCreateIconInput" accept="image/*" hidden></section>'+
    '<section class="bw-create-fields" id="bwCreateCoreFields"></section>'+
    '<section class="bw-create-theme-box">'+
      '<div class="bw-create-color-row">'+
        '<label><input type="color" id="bwCreateAccent" value="#00d4c8"><span class="swatch" id="bwCreateAccentSwatch"></span><small>colorAccent</small></label>'+
        '<label><input type="color" id="bwCreatePrimary" value="#6d55d9"><span class="swatch" id="bwCreatePrimarySwatch"></span><small>colorPrimary</small></label>'+
        '<label><input type="color" id="bwCreatePrimaryDark" value="#241b56"><span class="swatch" id="bwCreateDarkSwatch"></span><small>colorPrimaryDark</small></label>'+
        '<span class="bw-create-help">'+fieldIcon('help')+'</span>'+
      '</div>'+
      '<div class="bw-create-theme-title"><span>'+fieldIcon('palette')+'<b>Theme Presets</b></span><button type="button" id="bwCreateRandomTheme">Generate Random</button></div>'+
      '<small class="bw-create-theme-sub">These colors become global CSS variables in the exported project</small>'+
      '<div class="bw-create-presets" id="bwCreatePresets"></div>'+
    '</section>'+
    '<section class="bw-create-version">'+
      '<label><input id="bwCreateVersionCode" inputmode="numeric" value="1"><span>Version code</span></label>'+
      '<span class="bw-create-version-icon">'+fieldIcon('conversion_path')+'</span>'+
      '<label><input id="bwCreateVersionName" value="1.0"><span>Version name</span></label>'+
    '</section>'+
    '<section class="bw-create-web"><div class="bw-create-section-title">Initial web page</div><div id="bwCreateWebFields"></div></section>';

  var foot=document.createElement('footer');foot.className='bw-create-foot';foot.appendChild(oldCancel);foot.appendChild(oldCreate);oldCancel.textContent='Cancel';oldCreate.textContent='Create';
  shell.appendChild(head);shell.appendChild(main);shell.appendChild(foot);

  var core=$('bwCreateCoreFields');
  core.appendChild(makeField('smartphone','Application name','bwCreateAppName','Enter application name'));
  var projectWrap=makeField('favorite','Project name',null,'');projectWrap.querySelector('.bw-create-input-slot').appendChild(oldName);core.appendChild(projectWrap);oldName.placeholder='Project name';oldName.classList.add('bw-create-input');

  var web=$('bwCreateWebFields');
  var f1=makeField('description','Initial HTML',null,'');f1.querySelector('.bw-create-input-slot').appendChild(oldFile);oldFile.classList.add('bw-create-input');web.appendChild(f1);
  var f2=makeField('title','Page title',null,'');f2.querySelector('.bw-create-input-slot').appendChild(oldTitle);oldTitle.classList.add('bw-create-input');web.appendChild(f2);

  iconInput=$('bwCreateIconInput');renderPresets();bind();updateSwatches();return true;
}

function makeField(icon,label,id,placeholder){var l=document.createElement('label');l.className='bw-create-field';l.innerHTML='<span class="bw-create-field-icon">'+fieldIcon(icon)+'</span><span class="bw-create-input-slot">'+(id?'<input class="bw-create-input" id="'+id+'" placeholder="'+esc(placeholder||'')+'">':'')+'</span><span class="bw-create-floating">'+esc(label)+'</span>';return l;}
function renderPresets(){var box=$('bwCreatePresets');if(!box)return;box.innerHTML=PRESETS.map(function(p,i){return'<button type="button" class="bw-create-preset'+(i===0?' active':'')+'" data-preset="'+p.id+'"><span class="bars"><i style="background:'+p.accent+'"></i><i style="background:'+p.primary+'"></i><i style="background:'+p.dark+'"></i><i></i></span><small>'+esc(p.name)+'</small></button>';}).join('');}
function presetBy(id){for(var i=0;i<PRESETS.length;i++)if(PRESETS[i].id===id)return PRESETS[i];return PRESETS[0];}
function applyPreset(id){var p=presetBy(id);$('bwCreateAccent').value=p.accent;$('bwCreatePrimary').value=p.primary;$('bwCreatePrimaryDark').value=p.dark;dialog.querySelectorAll('.bw-create-preset').forEach(function(b){b.classList.toggle('active',b.dataset.preset===id);});updateSwatches();}
function hslToHex(css){var d=document.createElement('span');d.style.color=css;document.body.appendChild(d);var c=getComputedStyle(d).color;d.remove();var m=c.match(/\d+/g)||[0,0,0];return'#'+m.slice(0,3).map(function(x){return Number(x).toString(16).padStart(2,'0');}).join('');}
function randomTheme(){var hue=Math.floor(Math.random()*360);function c(l,s){return hslToHex('hsl('+hue+' '+s+'% '+l+'%)');}$('bwCreateAccent').value=c(52,78);$('bwCreatePrimary').value=c(48,62);$('bwCreatePrimaryDark').value=c(24,56);dialog.querySelectorAll('.bw-create-preset').forEach(function(b){b.classList.remove('active');});updateSwatches();}
function updateSwatches(){[['bwCreateAccent','bwCreateAccentSwatch'],['bwCreatePrimary','bwCreatePrimarySwatch'],['bwCreatePrimaryDark','bwCreateDarkSwatch']].forEach(function(x){var a=$(x[0]),b=$(x[1]);if(a&&b)b.style.background=a.value;});}
function updateIcon(){var btn=$('bwCreateIconBtn');if(!btn)return;btn.innerHTML=iconData?'<img src="'+iconData+'" alt="Project icon">':fieldIcon('language');}

function reset(){if(!build())return;iconData='';updateIcon();var name=$('bwNewProjectName'),app=$('bwCreateAppName');if(name)name.value='New Project';if(app){app.value='New Project';delete app.dataset.edited;}if($('bwNewProjectFile'))$('bwNewProjectFile').value='index.html';if($('bwNewProjectTitle'))$('bwNewProjectTitle').value='Página inicial';if($('bwCreateVersionCode'))$('bwCreateVersionCode').value='1';if($('bwCreateVersionName'))$('bwCreateVersionName').value='1.0';applyPreset('purple');}
function collect(){var name=($('bwNewProjectName')&&$('bwNewProjectName').value.trim())||'New Project';var app=($('bwCreateAppName')&&$('bwCreateAppName').value.trim())||name;return{applicationName:app,icon:iconData||'',theme:{preset:selectedPreset(),accent:colorValue('bwCreateAccent','#00d4c8'),primary:colorValue('bwCreatePrimary','#6d55d9'),primaryDark:colorValue('bwCreatePrimaryDark','#241b56')},versionCode:Math.max(1,parseInt(($('bwCreateVersionCode')||{}).value,10)||1),versionName:(($('bwCreateVersionName')||{}).value||'1.0').trim()||'1.0',createdWith:'Brotware'};}
function patchCreated(settings){try{var active=localStorage.getItem(ACTIVE_KEY);if(!active)return;localStorage.setItem(SETTINGS_PREFIX+active,JSON.stringify(settings));var store=JSON.parse(localStorage.getItem(STORE_KEY)||'{"projects":[]}');var rec=store&&Array.isArray(store.projects)?store.projects.find(function(p){return p.id===active;}):null;if(rec){rec.settings=settings;if(rec.data){rec.data.projectSettings=settings;rec.data.strings=rec.data.strings||{};rec.data.strings.app_name=settings.applicationName;}localStorage.setItem(STORE_KEY,JSON.stringify(store));}if(typeof state!=='undefined'){state.projectSettings=settings;state.strings=state.strings||{};state.strings.app_name=settings.applicationName;}if(window.BrotwareProjectSettings&&BrotwareProjectSettings.apply)BrotwareProjectSettings.apply(settings);if(typeof autoSave==='function')setTimeout(autoSave,20);}catch(e){console.warn('Brotware: could not persist project settings',e);}}

function bind(){
  if(installed)return;installed=true;
  $('bwCreateBack').addEventListener('click',function(){var c=$('bwNewProjectCancel');if(c)c.click();});
  $('bwCreateIconBtn').addEventListener('click',function(){iconInput.click();});
  iconInput.addEventListener('change',function(){var f=this.files&&this.files[0];this.value='';if(!f)return;if(f.size>1048576){alert('Use uma imagem de até 1 MB.');return;}var r=new FileReader();r.onload=function(){iconData=r.result;updateIcon();};r.readAsDataURL(f);});
  $('bwCreatePresets').addEventListener('click',function(e){var b=e.target.closest('[data-preset]');if(b)applyPreset(b.dataset.preset);});
  $('bwCreateRandomTheme').addEventListener('click',randomTheme);
  ['bwCreateAccent','bwCreatePrimary','bwCreatePrimaryDark'].forEach(function(id){$(id).addEventListener('input',function(){dialog.querySelectorAll('.bw-create-preset').forEach(function(b){b.classList.remove('active');});updateSwatches();});});
  $('bwNewProjectName').addEventListener('input',function(){if(!$('bwCreateAppName').dataset.edited)$('bwCreateAppName').value=this.value;});
  $('bwCreateAppName').addEventListener('input',function(){this.dataset.edited='1';});
  $('bwNewProjectCreate').addEventListener('click',function(){var settings=collect();setTimeout(function(){patchCreated(settings);},80);},true);
  showObserver=new MutationObserver(function(){if(dialog.classList.contains('show')&&!dialog.dataset.bwCreateOpened){dialog.dataset.bwCreateOpened='1';reset();}else if(!dialog.classList.contains('show')){delete dialog.dataset.bwCreateOpened;var a=$('bwCreateAppName');if(a)delete a.dataset.edited;}});showObserver.observe(dialog,{attributes:true,attributeFilter:['class']});
}

function install(){if(!build()){setTimeout(install,180);return;}if(dialog.classList.contains('show'))reset();}
setTimeout(install,0);setTimeout(install,600);
window.BrotwareProjectCreateV2={refresh:install,reset:reset};
})();