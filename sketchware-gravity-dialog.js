(function(){
'use strict';

var backdrop=null;
var OPTIONS=['left','right','center','center_horizontal','top','bottom','center_vertical'];

function build(){
  if(backdrop)return;
  backdrop=document.createElement('div');
  backdrop.className='bw-gravity-backdrop';
  backdrop.id='bwGravityDialog';
  backdrop.innerHTML='\
    <section class="bw-gravity-dialog" role="dialog" aria-modal="true" aria-labelledby="bwGravityTitle">\
      <div class="bw-gravity-head"><span class="icon">⌘</span><strong id="bwGravityTitle">Gravity</strong></div>\
      <div class="bw-gravity-options" id="bwGravityOptions"></div>\
      <div class="bw-gravity-actions"><button type="button" id="bwGravityCancel">Cancel</button><button type="button" id="bwGravitySelect">Select</button></div>\
    </section>';
  document.body.appendChild(backdrop);

  var box=document.getElementById('bwGravityOptions');
  OPTIONS.forEach(function(name){
    var label=document.createElement('label');
    label.className='bw-gravity-option';
    label.innerHTML='<input type="checkbox" value="'+name+'"><span class="bw-gravity-check"></span><span>'+name+'</span>';
    box.appendChild(label);
  });

  box.addEventListener('change',function(e){
    var input=e.target;if(!input||input.type!=='checkbox')return;
    normalizeChecks(input.value,input.checked);
  });
  document.getElementById('bwGravityCancel').addEventListener('click',close);
  document.getElementById('bwGravitySelect').addEventListener('click',apply);
  backdrop.addEventListener('pointerdown',function(e){if(e.target===backdrop)close();});
  document.addEventListener('keydown',function(e){
    if(!backdrop.classList.contains('show'))return;
    if(e.key==='Escape')close();
    if(e.key==='Enter'){e.preventDefault();apply();}
  });
}

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function input(name){return backdrop.querySelector('input[value="'+name+'"]');}
function setChecked(name,on){var n=input(name);if(n)n.checked=!!on;}

function normalizeChecks(name,checked){
  if(!checked)return;
  if(name==='center'){
    OPTIONS.forEach(function(x){if(x!=='center')setChecked(x,false);});
    return;
  }
  setChecked('center',false);
  if(name==='left'||name==='right'||name==='center_horizontal'){
    ['left','right','center_horizontal'].forEach(function(x){if(x!==name)setChecked(x,false);});
  }
  if(name==='top'||name==='bottom'||name==='center_vertical'){
    ['top','bottom','center_vertical'].forEach(function(x){if(x!==name)setChecked(x,false);});
  }
}

function readSaved(el){
  var raw=String(el&&el.dataset.gravity||'').trim();
  if(raw)return raw.split('|').filter(function(x){return OPTIONS.indexOf(x)>=0;});
  return [];
}

function open(){
  build();
  var el=selected();
  if(!el){if(typeof toast==='function')toast('Selecione um widget primeiro');return;}
  OPTIONS.forEach(function(x){setChecked(x,false);});
  readSaved(el).forEach(function(x){setChecked(x,true);});
  backdrop.classList.add('show');
}

function close(){if(backdrop)backdrop.classList.remove('show');}

function selectedFlags(){
  return Array.prototype.slice.call(backdrop.querySelectorAll('.bw-gravity-options input:checked')).map(function(n){return n.value;});
}

function applyGravity(el,flags){
  if(!el)return;
  el.dataset.gravity=flags.join('|');
  var t=typeof contentTarget==='function'?contentTarget(el):null;
  if(!t)return;

  var center=flags.indexOf('center')>=0;
  var h=center?'center':flags.indexOf('right')>=0?'flex-end':flags.indexOf('center_horizontal')>=0?'center':'flex-start';
  var v=center?'center':flags.indexOf('bottom')>=0?'flex-end':flags.indexOf('center_vertical')>=0?'center':'flex-start';
  var hasH=center||flags.indexOf('left')>=0||flags.indexOf('right')>=0||flags.indexOf('center_horizontal')>=0;
  var hasV=center||flags.indexOf('top')>=0||flags.indexOf('bottom')>=0||flags.indexOf('center_vertical')>=0;

  if(hasH){
    t.style.textAlign=h==='center'?'center':h==='flex-end'?'right':'left';
    t.style.justifyContent=h;
  }else{
    t.style.removeProperty('text-align');
    t.style.removeProperty('justify-content');
  }

  if(hasV)t.style.alignItems=v;
  else t.style.removeProperty('align-items');

  var tag=t.tagName?t.tagName.toLowerCase():'';
  if(['input','textarea','select'].indexOf(tag)<0 && (hasH||hasV)){
    if(!t.style.display||t.style.display==='block')t.style.display='flex';
  }
}

function apply(){
  var el=selected();if(!el){close();return;}
  var flags=selectedFlags();
  applyGravity(el,flags);
  if(typeof commit==='function')commit();
  if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  close();
  if(typeof toast==='function')toast(flags.length?'Gravity aplicado':'Gravity removido');
}

function ensureQuickButton(){
  var wrap=document.querySelector('.quick-properties');
  if(!wrap)return;
  var btn=wrap.querySelector('[data-quick="gravity"]');
  if(!btn){
    btn=document.createElement('button');
    btn.className='quick-card';
    btn.dataset.quick='gravity';
    btn.innerHTML='<b>⌘</b><span>Gravity</span>';
    var height=wrap.querySelector('[data-quick="height"]');
    if(height&&height.nextSibling)wrap.insertBefore(btn,height.nextSibling);else wrap.appendChild(btn);
  }
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();open();};
  btn.dataset.skGravityDialog='1';
}

function install(){build();ensureQuickButton();}

window.BrotwareGravityDialog={open:open,close:close,applyToElement:applyGravity};
setTimeout(install,0);
setTimeout(install,250);
setTimeout(install,900);
})();
