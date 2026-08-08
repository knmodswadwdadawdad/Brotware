(function(){
'use strict';

/* Compact Sketchware-style Add Event dialog + Material Symbols decoration. */
var CAT_ICONS={activity:'web_asset',view:'widgets',component:'extension',drawer:'menu_open',moreblock:'functions'};
var EVENT_ICONS={
  load:'rocket_launch',imports:'download',initializeLogic:'code',activityResult:'move_to_inbox',back:'arrow_back',postcreate:'task_alt',start:'play_arrow',resume:'refresh',pause:'pause',stop:'stop',destroy:'delete',saveInstanceState:'save',restoreInstanceState:'restore',newIntent:'link',windowFocusChanged:'center_focus_strong',
  click:'touch_app',dblclick:'ads_click',input:'edit',change:'sync',focus:'center_focus_strong',blur:'blur_on',keydown:'keyboard',keyup:'keyboard_hide',mouseenter:'mouse',mouseleave:'logout',
  online:'wifi',offline:'wifi_off',resize:'aspect_ratio',message:'mail',drawerOpen:'menu_open',drawerClose:'menu'
};
var queued=false;

function iconNode(name){var s=document.createElement('span');s.className='bw-google-icon';s.textContent=name;return s;}
function setIcon(slot,name){if(!slot||!name)return;if(slot.dataset.bwEventGoogleIcon===name)return;slot.textContent='';slot.appendChild(iconNode(name));slot.dataset.bwEventGoogleIcon=name;}
function decorateCategories(){
  document.querySelectorAll('#skEventRail .sk-event-cat[data-sk-cat]').forEach(function(b){setIcon(b.querySelector('.ico'),CAT_ICONS[b.dataset.skCat]||'extension');});
  document.querySelectorAll('#skAddTabs .sk-add-events-tab[data-add-cat]').forEach(function(b){setIcon(b.querySelector('.ico'),CAT_ICONS[b.dataset.addCat]||'extension');});
}
function decorateRows(){
  document.querySelectorAll('#skAddEventsBody .sk-add-event-row').forEach(function(row){
    var input=row.querySelector('.sk-check[data-sk-event]');if(!input)return;
    setIcon(row.querySelector(':scope > .ico'),EVENT_ICONS[input.dataset.skEvent]||'code');
    var wrap=row.querySelector('.sk-event-check-wrap');
    if(!wrap){
      wrap=document.createElement('span');wrap.className='sk-event-check-wrap';
      input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
      var v=iconNode('check_box_outline_blank');v.classList.add('sk-event-check-icon');wrap.appendChild(v);
      input.addEventListener('change',function(){updateCheck(wrap,input);});
    }
    updateCheck(wrap,input);
  });
}
function updateCheck(wrap,input){var v=wrap&&wrap.querySelector('.sk-event-check-icon');if(!v)return;v.textContent=input.checked?'check_box':'check_box_outline_blank';wrap.classList.toggle('checked',input.checked);}
function decorateCards(){
  document.querySelectorAll('#skEventCards .sk-event-card').forEach(function(card){
    var title=card.querySelector('b'),slot=card.querySelector('.ev-icon');if(!title||!slot)return;
    var t=title.textContent||'',key='';
    Object.keys(EVENT_ICONS).some(function(k){if(t.toLowerCase().indexOf(k.toLowerCase())>=0){key=k;return true;}return false;});
    if(t.indexOf('onCreate')>=0)key='load';else if(t.indexOf('Import')>=0)key='imports';else if(t.indexOf('initializeLogic')>=0)key='initializeLogic';else if(t.indexOf('onActivityResult')>=0)key='activityResult';else if(t.indexOf('onBackPressed')>=0)key='back';else if(t.indexOf('onPostCreate')>=0)key='postcreate';else if(t.indexOf('onStart')>=0)key='start';else if(t.indexOf('onResume')>=0)key='resume';else if(t.indexOf('onPause')>=0)key='pause';else if(t.indexOf('onStop')>=0)key='stop';else if(t.indexOf('onDestroy')>=0)key='destroy';else if(t.indexOf('onClick')>=0)key='click';
    setIcon(slot,EVENT_ICONS[key]||(t&&t.indexOf('ƒ')>=0?'functions':'code'));
  });
}
function decorateActions(){
  var cancel=document.getElementById('skCancelEvents'),confirm=document.getElementById('skConfirmEvents');
  if(cancel&&cancel.dataset.bwPolished!=='1'){cancel.dataset.bwPolished='1';cancel.innerHTML='';cancel.appendChild(iconNode('close'));var cs=document.createElement('span');cs.textContent='Cancelar';cancel.appendChild(cs);cancel.addEventListener('click',function(){var m=document.getElementById('skAddEventsModal');if(m)m.classList.remove('show');});}
  if(confirm&&confirm.dataset.bwPolished!=='1'){confirm.dataset.bwPolished='1';confirm.innerHTML='';confirm.appendChild(iconNode('add'));var as=document.createElement('span');as.textContent='Adicionar';confirm.appendChild(as);}
}
function apply(){queued=false;decorateCategories();decorateRows();decorateCards();decorateActions();}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}

document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;var m=document.getElementById('skAddEventsModal');if(m&&m.classList.contains('show')){m.classList.remove('show');e.preventDefault();}},true);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','checked']});
setTimeout(apply,0);setTimeout(apply,500);setTimeout(apply,1200);
window.BrotwareEventDialogPolish={refresh:apply};
})();
