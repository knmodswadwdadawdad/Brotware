(function(){
'use strict';

var backdrop=null,customWrap=null,customInput=null,titleEl=null,iconEl=null;
var activeProp='width';

function cap(v){return v.charAt(0).toUpperCase()+v.slice(1);}
function modeName(){return 'bwSizeMode';}

function build(){
  if(backdrop)return;
  backdrop=document.createElement('div');
  backdrop.className='bw-size-backdrop';
  backdrop.id='bwSizeDialog';
  backdrop.innerHTML='\
    <section class="bw-size-dialog" role="dialog" aria-modal="true" aria-labelledby="bwSizeTitle">\
      <div class="bw-size-head">\
        <span class="icon" id="bwSizeIcon">↔</span>\
        <strong id="bwSizeTitle">Width</strong>\
      </div>\
      <div class="bw-size-options">\
        <label class="bw-size-option"><input type="radio" name="bwSizeMode" value="match_parent"><span class="bw-size-radio"></span><span>match_parent</span></label>\
        <label class="bw-size-option"><input type="radio" name="bwSizeMode" value="wrap_content"><span class="bw-size-radio"></span><span>wrap_content</span></label>\
        <label class="bw-size-option"><input type="radio" name="bwSizeMode" value="custom"><span class="bw-size-radio"></span><span>Custom value</span></label>\
      </div>\
      <div class="bw-size-custom" id="bwSizeCustom">\
        <div class="bw-size-custom-row"><input id="bwSizeValue" type="text" inputmode="decimal" placeholder="Ex.: 200, 50%, 20rem"><div class="bw-size-unit">CSS</div></div>\
        <small class="bw-size-hint">Número sem unidade vira px.</small>\
      </div>\
      <div class="bw-size-actions"><button type="button" id="bwSizeCancel">Cancel</button><button type="button" id="bwSizeSelect">Select</button></div>\
    </section>';
  document.body.appendChild(backdrop);
  customWrap=document.getElementById('bwSizeCustom');
  customInput=document.getElementById('bwSizeValue');
  titleEl=document.getElementById('bwSizeTitle');
  iconEl=document.getElementById('bwSizeIcon');

  backdrop.querySelectorAll('input[name="'+modeName()+'"]').forEach(function(r){
    r.addEventListener('change',syncCustom);
  });
  document.getElementById('bwSizeCancel').addEventListener('click',close);
  document.getElementById('bwSizeSelect').addEventListener('click',apply);
  backdrop.addEventListener('pointerdown',function(e){if(e.target===backdrop)close();});
  document.addEventListener('keydown',function(e){
    if(!backdrop.classList.contains('show'))return;
    if(e.key==='Escape')close();
    if(e.key==='Enter'&&document.activeElement===customInput){e.preventDefault();apply();}
  });
}

function selected(){return typeof selectedNode==='function'?selectedNode():null;}

function currentMode(el,prop){
  if(!el)return'custom';
  var dataKey=prop==='width'?'widthMode':'heightMode';
  var saved=el.dataset[dataKey];
  if(saved==='match_parent'||saved==='wrap_content'||saved==='custom')return saved;
  var v=String(el.style[prop]||'').trim().toLowerCase();
  if(v==='100%')return'match_parent';
  if(v==='fit-content'||v==='max-content'||v==='min-content'||v==='auto')return'wrap_content';
  return'custom';
}

function syncCustom(){
  var mode=backdrop.querySelector('input[name="'+modeName()+'"]:checked');
  var show=mode&&mode.value==='custom';
  customWrap.classList.toggle('show',!!show);
  if(show)setTimeout(function(){customInput.focus();customInput.select();},20);
}

function open(prop){
  build();
  activeProp=prop==='height'?'height':'width';
  var el=selected();
  if(!el){if(typeof toast==='function')toast('Selecione um widget primeiro');return;}

  titleEl.textContent=cap(activeProp);
  iconEl.textContent=activeProp==='width'?'↔':'↕';

  var mode=currentMode(el,activeProp);
  var radio=backdrop.querySelector('input[name="'+modeName()+'"][value="'+mode+'"]');
  if(radio)radio.checked=true;
  var value=String(el.style[activeProp]||el[activeProp==='width'?'offsetWidth':'offsetHeight']+'px');
  if(mode==='custom')customInput.value=value.replace(/px$/i,'');
  else customInput.value='';
  syncCustom();
  backdrop.classList.add('show');
}

function close(){if(backdrop)backdrop.classList.remove('show');}

function normalizeCustom(raw,prop){
  raw=String(raw||'').trim();
  if(!raw)return null;
  if(/^-?\d+(\.\d+)?$/.test(raw))return raw+'px';
  if(typeof CSS!=='undefined'&&CSS.supports&&CSS.supports(prop,raw))return raw;
  return null;
}

function apply(){
  var el=selected();if(!el){close();return;}
  var checked=backdrop.querySelector('input[name="'+modeName()+'"]:checked');
  if(!checked)return;
  var mode=checked.value;
  var dataKey=activeProp==='width'?'widthMode':'heightMode';

  if(mode==='match_parent'){
    el.dataset[dataKey]='match_parent';
    if(activeProp==='width')el.style.left='0px';
    else el.style.top='0px';
    el.style[activeProp]='100%';
  }else if(mode==='wrap_content'){
    el.dataset[dataKey]='wrap_content';
    el.style[activeProp]='max-content';
    var t=typeof contentTarget==='function'?contentTarget(el):null;
    if(t){
      if(activeProp==='width')t.style.maxWidth='100%';
      else t.style.maxHeight='100%';
    }
  }else{
    var value=normalizeCustom(customInput.value,activeProp);
    if(!value){
      customInput.focus();
      customInput.select();
      if(typeof toast==='function')toast('Digite um '+activeProp+' válido');
      return;
    }
    el.dataset[dataKey]='custom';
    el.style[activeProp]=value;
  }

  if(typeof commit==='function')commit();
  if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  close();
  if(typeof toast==='function')toast(cap(activeProp)+' aplicado');
}

function installButton(prop){
  var btn=document.querySelector('[data-quick="'+prop+'"]');
  if(!btn)return;
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();open(prop);};
  btn.dataset.skSizeDialog='1';
}
function install(){build();installButton('width');installButton('height');}

window.BrotwareSizeDialog={open:open,close:close};
window.BrotwareWidthDialog={open:function(){open('width');},close:close};
window.BrotwareHeightDialog={open:function(){open('height');},close:close};
setTimeout(install,0);
setTimeout(install,250);
setTimeout(install,900);
})();
