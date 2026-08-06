(function(){
'use strict';

var backdrop=null;
var OPTIONS=['left','right','center','center_horizontal','top','bottom','center_vertical'];
var pendingGesture=null;

function build(){
  if(backdrop)return;
  backdrop=document.createElement('div');
  backdrop.className='bw-gravity-backdrop';
  backdrop.id='bwLayoutGravityDialog';
  backdrop.innerHTML='\
    <section class="bw-gravity-dialog" role="dialog" aria-modal="true" aria-labelledby="bwLayoutGravityTitle">\
      <div class="bw-gravity-head"><span class="icon">⊹</span><strong id="bwLayoutGravityTitle">Layout gravity</strong></div>\
      <div class="bw-gravity-options" id="bwLayoutGravityOptions"></div>\
      <div class="bw-gravity-actions"><button type="button" id="bwLayoutGravityCancel">Cancel</button><button type="button" id="bwLayoutGravitySelect">Select</button></div>\
    </section>';
  document.body.appendChild(backdrop);

  var box=document.getElementById('bwLayoutGravityOptions');
  OPTIONS.forEach(function(name){
    var label=document.createElement('label');
    label.className='bw-gravity-option';
    label.innerHTML='<input type="checkbox" value="'+name+'"><span class="bw-gravity-check"></span><span>'+name+'</span>';
    box.appendChild(label);
  });

  box.addEventListener('change',function(e){
    var n=e.target;if(!n||n.type!=='checkbox')return;
    normalizeChecks(n.value,n.checked);
  });
  document.getElementById('bwLayoutGravityCancel').addEventListener('click',close);
  document.getElementById('bwLayoutGravitySelect').addEventListener('click',apply);
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

function flagsOf(el){
  var raw=String(el&&el.dataset.layoutGravity||'').trim();
  return raw?raw.split('|').filter(function(x){return OPTIONS.indexOf(x)>=0;}):[];
}

function open(){
  build();
  var el=selected();
  if(!el){if(typeof toast==='function')toast('Selecione um widget primeiro');return;}
  if(!el.parentElement){if(typeof toast==='function')toast('Esse widget não possui layout pai');return;}
  OPTIONS.forEach(function(x){setChecked(x,false);});
  flagsOf(el).forEach(function(x){setChecked(x,true);});
  backdrop.classList.add('show');
}
function close(){if(backdrop)backdrop.classList.remove('show');}
function selectedFlags(){return Array.prototype.slice.call(backdrop.querySelectorAll('#bwLayoutGravityOptions input:checked')).map(function(n){return n.value;});}

function parentSize(parent){
  return{w:Math.max(0,parent.clientWidth||parent.offsetWidth||0),h:Math.max(0,parent.clientHeight||parent.offsetHeight||0)};
}
function applyToElement(el,flags){
  if(!el||!el.parentElement)return;
  flags=Array.isArray(flags)?flags:flagsOf(el);
  el.dataset.layoutGravity=flags.join('|');
  if(!flags.length)return;

  var p=el.parentElement,s=parentSize(p),w=el.offsetWidth,h=el.offsetHeight;
  var center=flags.indexOf('center')>=0;
  var hasH=center||flags.indexOf('left')>=0||flags.indexOf('right')>=0||flags.indexOf('center_horizontal')>=0;
  var hasV=center||flags.indexOf('top')>=0||flags.indexOf('bottom')>=0||flags.indexOf('center_vertical')>=0;
  var x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0;

  if(hasH){
    if(center||flags.indexOf('center_horizontal')>=0)x=(s.w-w)/2;
    else if(flags.indexOf('right')>=0)x=s.w-w;
    else x=0;
  }
  if(hasV){
    if(center||flags.indexOf('center_vertical')>=0)y=(s.h-h)/2;
    else if(flags.indexOf('bottom')>=0)y=s.h-h;
    else y=0;
  }
  el.style.left=Math.max(0,Math.round(x))+'px';
  el.style.top=Math.max(0,Math.round(y))+'px';
}

function apply(){
  var el=selected();if(!el){close();return;}
  var flags=selectedFlags();
  applyToElement(el,flags);
  if(typeof commit==='function')commit();
  if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  close();
  if(typeof toast==='function')toast(flags.length?'Layout gravity aplicado':'Layout gravity removido');
}

function ensureQuickButton(){
  var wrap=document.querySelector('.quick-properties');if(!wrap)return;
  var btn=wrap.querySelector('[data-quick="layout-gravity"]');
  if(!btn){
    btn=document.createElement('button');
    btn.className='quick-card';btn.dataset.quick='layout-gravity';
    btn.innerHTML='<b>⊹</b><span>Layout gravity</span>';
    var gravity=wrap.querySelector('[data-quick="gravity"]');
    if(gravity&&gravity.nextSibling)wrap.insertBefore(btn,gravity.nextSibling);else wrap.appendChild(btn);
  }
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();open();};
}

/* A manual drag overrides Layout gravity. Only clear it when an actual drag starts,
 * not on a tap or a swipe used to pan the mobile canvas. */
function installManualMoveOverride(){
  document.addEventListener('pointerdown',function(e){
    var n=e.target&&e.target.closest?e.target.closest('.vf-node'):null;
    if(!n||!n.dataset.layoutGravity)return;
    pendingGesture={id:e.pointerId,node:n,x:e.clientX,y:e.clientY,pointerType:e.pointerType||'mouse',cleared:false};
  },true);
  document.addEventListener('pointermove',function(e){
    var g=pendingGesture;if(!g||g.id!==e.pointerId||g.cleared)return;
    var d=Math.hypot(e.clientX-g.x,e.clientY-g.y),realDrag=false;
    if(g.pointerType==='mouse')realDrag=(e.buttons&1)===1&&d>2;
    else realDrag=document.body.classList.contains('vf-widget-dragging');
    if(realDrag){delete g.node.dataset.layoutGravity;g.cleared=true;}
  },true);
  function end(e){if(!pendingGesture)return;if(e&&typeof e.pointerId==='number'&&e.pointerId!==pendingGesture.id)return;pendingGesture=null;}
  document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);window.addEventListener('blur',function(){pendingGesture=null;});
}

/* Keep semantics in generated HTML: gravity is recalculated on load/resize. */
function installRuntimeExtension(){
  if(typeof window.runtimeScriptForPage!=='function'||window.runtimeScriptForPage.__layoutGravityWrapped)return;
  var base=window.runtimeScriptForPage;
  var wrapped=function(page){
    var code=base(page);
    return code+'\n(function(){function bwLayoutGravity(){document.querySelectorAll(\'[data-layout-gravity]\').forEach(function(el){var p=el.parentElement;if(!p)return;var f=(el.dataset.layoutGravity||\'\').split(\'|\');if(!f.length||!f[0])return;var pw=p.clientWidth||p.offsetWidth||0,ph=p.clientHeight||p.offsetHeight||0,w=el.offsetWidth,h=el.offsetHeight,c=f.indexOf(\'center\')>=0,x=parseFloat(el.style.left)||0,y=parseFloat(el.style.top)||0;if(c||f.indexOf(\'center_horizontal\')>=0)x=(pw-w)/2;else if(f.indexOf(\'right\')>=0)x=pw-w;else if(f.indexOf(\'left\')>=0)x=0;if(c||f.indexOf(\'center_vertical\')>=0)y=(ph-h)/2;else if(f.indexOf(\'bottom\')>=0)y=ph-h;else if(f.indexOf(\'top\')>=0)y=0;el.style.left=Math.max(0,Math.round(x))+\'px\';el.style.top=Math.max(0,Math.round(y))+\'px\';});}window.addEventListener(\'load\',bwLayoutGravity);window.addEventListener(\'resize\',bwLayoutGravity);setTimeout(bwLayoutGravity,0);})();';
  };
  wrapped.__layoutGravityWrapped=true;
  window.runtimeScriptForPage=wrapped;
}

function install(){build();ensureQuickButton();installRuntimeExtension();}
window.BrotwareLayoutGravityDialog={open:open,close:close,applyToElement:applyToElement};
installManualMoveOverride();
setTimeout(install,0);setTimeout(install,250);setTimeout(install,900);
})();
