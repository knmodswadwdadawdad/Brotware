(function(){
'use strict';

function install(){
  var back=document.getElementById('bwProjectSettingsBackdrop');
  if(!back||back.dataset.bwEditFix==='1')return false;
  back.dataset.bwEditFix='1';
  var sheet=back.querySelector('.bw-project-settings-sheet');
  if(!sheet)return false;

  function editable(t){return t&&t.matches&&t.matches('input:not([type="color"]),textarea');}

  sheet.querySelectorAll('input,textarea').forEach(function(i){
    i.disabled=false;i.readOnly=false;
    if(i.type!=='color')i.setAttribute('autocomplete','off');
  });

  /* Do not let workspace/layer drag handlers see gestures that begin inside this dialog. */
  ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend'].forEach(function(type){
    sheet.addEventListener(type,function(e){e.stopPropagation();},{passive:type.indexOf('touch')===0});
  });

  sheet.addEventListener('click',function(e){
    e.stopPropagation();
    var field=e.target.closest&&e.target.closest('.bw-project-settings-field');
    if(field&&!editable(e.target)){
      var input=field.querySelector('input:not([type="color"]),textarea');
      if(input){try{input.focus({preventScroll:true});}catch(_){input.focus();}}
    }
  });

  sheet.addEventListener('pointerup',function(e){
    if(!editable(e.target))return;
    var input=e.target;
    setTimeout(function(){
      if(document.activeElement!==input){try{input.focus({preventScroll:true});}catch(_){input.focus();}}
    },0);
  });

  return true;
}

function boot(){if(!install())setTimeout(boot,180);}
boot();setTimeout(boot,700);setTimeout(boot,1600);
new MutationObserver(function(){install();}).observe(document.body,{childList:true,subtree:true});
})();
