(function(){
'use strict';

var backdrop=null,customWrap=null,customInput=null;

function build(){
  if(backdrop)return;
  backdrop=document.createElement('div');
  backdrop.className='bw-size-backdrop';
  backdrop.id='bwWidthDialog';
  backdrop.innerHTML='\
    <section class="bw-size-dialog" role="dialog" aria-modal="true" aria-labelledby="bwWidthTitle">\
      <div class="bw-size-head">\
        <span class="icon">↔</span>\
        <strong id="bwWidthTitle">Width</strong>\
      </div>\
      <div class="bw-size-options">\
        <label class="bw-size-option"><input type="radio" name="bwWidthMode" value="match_parent"><span class="bw-size-radio"></span><span>match_parent</span></label>\
        <label class="bw-size-option"><input type="radio" name="bwWidthMode" value="wrap_content"><span class="bw-size-radio"></span><span>wrap_content</span></label>\
        <label class="bw-size-option"><input type="radio" name="bwWidthMode" value="custom"><span class="bw-size-radio"></span><span>Custom value</span></label>\
      </div>\
      <div class="bw-size-custom" id="bwWidthCustom">\
        <div class="bw-size-custom-row"><input id="bwWidthValue" type="text" inputmode="decimal" placeholder="Ex.: 200, 50%, 20rem"><div class="bw-size-unit">CSS</div></div>\
        <small class="bw-size-hint">Número sem unidade vira px.</small>\
      </div>\
      <div class="bw-size-actions"><button type="button" id="bwWidthCancel">Cancel</button><button type="button" id="bwWidthSelect">Select</button></div>\
    </section>';
  document.body.appendChild(backdrop);
  customWrap=document.getElementById('bwWidthCustom');
  customInput=document.getElementById('bwWidthValue');

  backdrop.querySelectorAll('input[name="bwWidthMode"]').forEach(function(r){
    r.addEventListener('change',syncCustom);
  });
  document.getElementById('bwWidthCancel').addEventListener('click',close);
  document.getElementById('bwWidthSelect').addEventListener('click',apply);
  backdrop.addEventListener('pointerdown',function(e){if(e.target===backdrop)close();});
  document.addEventListener('keydown',function(e){
    if(!backdrop.classList.contains('show'))return;
    if(e.key==='Escape')close();
    if(e.key==='Enter'&&document.activeElement===customInput){e.preventDefault();apply();}
  });
}

function selected(){
  return typeof selectedNode==='function'?selectedNode():null;
}

function currentMode(el){
  if(!el)return'custom';
  var saved=el.dataset.widthMode;
  if(saved==='match_parent'||saved==='wrap_content'||saved==='custom')return saved;
  var w=String(el.style.width||'').trim().toLowerCase();
  if(w==='100%')return'match_parent';
  if(w==='fit-content'||w==='max-content'||w==='auto')return'wrap_content';
  return'custom';
}

function syncCustom(){
  var mode=backdrop.querySelector('input[name="bwWidthMode"]:checked');
  var show=mode&&mode.value==='custom';
  customWrap.classList.toggle('show',!!show);
  if(show)setTimeout(function(){customInput.focus();customInput.select();},20);
}

function open(){
  build();
  var el=selected();
  if(!el){if(typeof toast==='function')toast('Selecione um widget primeiro');return;}
  var mode=currentMode(el);
  var radio=backdrop.querySelector('input[name="bwWidthMode"][value="'+mode+'"]');
  if(radio)radio.checked=true;
  var w=String(el.style.width||el.offsetWidth+'px');
  if(mode==='custom')customInput.value=w.replace(/px$/i,'');
  else customInput.value='';
  syncCustom();
  backdrop.classList.add('show');
}

function close(){if(backdrop)backdrop.classList.remove('show');}

function normalizeCustom(raw){
  raw=String(raw||'').trim();
  if(!raw)return null;
  if(/^-?\d+(\.\d+)?$/.test(raw))return raw+'px';
  if(typeof CSS!=='undefined'&&CSS.supports&&CSS.supports('width',raw))return raw;
  return null;
}

function apply(){
  var el=selected();if(!el){close();return;}
  var checked=backdrop.querySelector('input[name="bwWidthMode"]:checked');
  if(!checked)return;
  var mode=checked.value;

  if(mode==='match_parent'){
    el.dataset.widthMode='match_parent';
    el.style.left='0px';
    el.style.width='100%';
  }else if(mode==='wrap_content'){
    el.dataset.widthMode='wrap_content';
    el.style.width='max-content';
    var t=typeof contentTarget==='function'?contentTarget(el):null;
    if(t){t.style.maxWidth='100%';}
  }else{
    var value=normalizeCustom(customInput.value);
    if(!value){
      customInput.focus();
      customInput.select();
      if(typeof toast==='function')toast('Digite uma largura válida');
      return;
    }
    el.dataset.widthMode='custom';
    el.style.width=value;
  }

  if(typeof commit==='function')commit();
  if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  close();
  if(typeof toast==='function')toast('Width aplicado');
}

function install(){
  build();
  var btn=document.querySelector('[data-quick="width"]');
  if(!btn)return;
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();open();};
  btn.dataset.skWidthDialog='1';
}

window.BrotwareWidthDialog={open:open,close:close};
setTimeout(install,0);
setTimeout(install,250);
setTimeout(install,900);
})();
