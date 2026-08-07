(function(){
'use strict';

var back=null,sv=null,knob=null,hue=null,preview=null,valueText=null,hexInput=null,rInput=null,gInput=null,bInput=null;
var mode='hex',h=250,s=.75,v=.93,onApply=null,titleEl=null;
var PRESETS=['#FFFFFF','#000000','#0D0D12','#17171F','#6567F4','#7C3AED','#06B6D4','#0D99FF','#22C55E','#F59E0B','#EF4444','#EC4899'];

function clamp(n,a,b){n=Number(n);if(isNaN(n))n=a;return Math.max(a,Math.min(b,n));}
function hex2(n){return Math.round(clamp(n,0,255)).toString(16).padStart(2,'0').toUpperCase();}
function rgbToHex(r,g,b){return'#'+hex2(r)+hex2(g)+hex2(b);}
function hsvToRgb(hh,ss,vv){
  hh=((Number(hh)%360)+360)%360;ss=clamp(ss,0,1);vv=clamp(vv,0,1);
  var c=vv*ss,x=c*(1-Math.abs((hh/60)%2-1)),m=vv-c,r=0,g=0,b=0;
  if(hh<60){r=c;g=x;}else if(hh<120){r=x;g=c;}else if(hh<180){g=c;b=x;}else if(hh<240){g=x;b=c;}else if(hh<300){r=x;b=c;}else{r=c;b=x;}
  return{r:Math.round((r+m)*255),g:Math.round((g+m)*255),b:Math.round((b+m)*255)};
}
function rgbToHsv(r,g,b){
  r=clamp(r,0,255)/255;g=clamp(g,0,255)/255;b=clamp(b,0,255)/255;var max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,hh=0;
  if(d){if(max===r)hh=60*(((g-b)/d)%6);else if(max===g)hh=60*((b-r)/d+2);else hh=60*((r-g)/d+4);}if(hh<0)hh+=360;
  return{h:hh,s:max===0?0:d/max,v:max};
}
function parseColor(raw){
  raw=String(raw||'').trim();if(!raw)return{r:124,g:58,b:237};
  var m;if((m=raw.match(/^#([0-9a-f]{3})$/i))){return{r:parseInt(m[1][0]+m[1][0],16),g:parseInt(m[1][1]+m[1][1],16),b:parseInt(m[1][2]+m[1][2],16)};}
  if((m=raw.match(/^#([0-9a-f]{6})$/i))){return{r:parseInt(m[1].slice(0,2),16),g:parseInt(m[1].slice(2,4),16),b:parseInt(m[1].slice(4,6),16)};}
  if((m=raw.match(/rgba?\s*\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)))return{r:clamp(m[1],0,255),g:clamp(m[2],0,255),b:clamp(m[3],0,255)};
  try{var x=document.createElement('span');x.style.color=raw;document.body.appendChild(x);var c=getComputedStyle(x).color;x.remove();m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m)return{r:+m[1],g:+m[2],b:+m[3]};}catch(e){}
  return{r:124,g:58,b:237};
}
function currentRgb(){return hsvToRgb(h,s,v);}
function selectedValue(){var c=currentRgb();return mode==='rgb'?'rgb('+c.r+', '+c.g+', '+c.b+')':rgbToHex(c.r,c.g,c.b);}

function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwColorPicker';back.className='bw-color-backdrop';
  back.innerHTML='<section class="bw-color-sheet" role="dialog" aria-modal="true"><div class="bw-color-handle"></div><header class="bw-color-head"><div><strong id="bwColorTitle">Color</strong><small>Escolha visualmente ou informe o valor</small></div><span class="spacer"></span><button id="bwColorClose" type="button">×</button></header><div class="bw-color-preview-row"><div class="bw-color-preview" id="bwColorPreview"></div><div class="bw-color-value"><b id="bwColorValue">#7C3AED</b><small id="bwColorRgbValue">rgb(124, 58, 237)</small></div></div><div class="bw-color-sv" id="bwColorSV"><span class="bw-color-sv-knob" id="bwColorKnob"></span></div><div class="bw-color-hue-wrap"><input class="bw-color-hue" id="bwColorHue" type="range" min="0" max="360" value="250"></div><nav class="bw-color-tabs"><button class="bw-color-tab active" data-color-mode="hex" type="button">HEX</button><button class="bw-color-tab" data-color-mode="rgb" type="button">RGB</button></nav><div class="bw-color-mode active" data-color-panel="hex"><label class="bw-color-field"><span>Hexadecimal</span><input id="bwColorHex" type="text" inputmode="text" maxlength="7" placeholder="#7C3AED"></label></div><div class="bw-color-mode" data-color-panel="rgb"><div class="bw-color-rgb"><label class="bw-color-rgb-field"><span>R</span><input id="bwColorR" type="number" inputmode="numeric" min="0" max="255"></label><label class="bw-color-rgb-field"><span>G</span><input id="bwColorG" type="number" inputmode="numeric" min="0" max="255"></label><label class="bw-color-rgb-field"><span>B</span><input id="bwColorB" type="number" inputmode="numeric" min="0" max="255"></label></div></div><div class="bw-color-presets" id="bwColorPresets"></div><div class="bw-color-actions"><button id="bwColorCancel" type="button">Cancelar</button><button class="primary" id="bwColorApply" type="button">Aplicar</button></div></section>';
  document.body.appendChild(back);
  sv=document.getElementById('bwColorSV');knob=document.getElementById('bwColorKnob');hue=document.getElementById('bwColorHue');preview=document.getElementById('bwColorPreview');valueText=document.getElementById('bwColorValue');hexInput=document.getElementById('bwColorHex');rInput=document.getElementById('bwColorR');gInput=document.getElementById('bwColorG');bInput=document.getElementById('bwColorB');titleEl=document.getElementById('bwColorTitle');
  document.getElementById('bwColorPresets').innerHTML=PRESETS.map(function(c){return'<button type="button" class="bw-color-preset" data-color-preset="'+c+'" style="background:'+c+'" title="'+c+'"></button>';}).join('');
  document.getElementById('bwColorClose').onclick=close;document.getElementById('bwColorCancel').onclick=close;document.getElementById('bwColorApply').onclick=apply;
  back.addEventListener('pointerdown',function(e){if(e.target===back)close();});
  back.querySelector('.bw-color-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-color-mode]');if(!b)return;mode=b.dataset.colorMode;syncMode();syncUI();});
  document.getElementById('bwColorPresets').addEventListener('click',function(e){var b=e.target.closest('[data-color-preset]');if(!b)return;setRgb(parseColor(b.dataset.colorPreset));});
  hue.addEventListener('input',function(){h=Number(this.value)||0;syncUI();});
  bindSV();
  hexInput.addEventListener('input',function(){var x=this.value.trim();if(/^#?[0-9a-f]{6}$/i.test(x)){if(x[0]!=='#')x='#'+x;setRgb(parseColor(x),true);}});
  [rInput,gInput,bInput].forEach(function(i){i.addEventListener('input',function(){setRgb({r:clamp(rInput.value,0,255),g:clamp(gInput.value,0,255),b:clamp(bInput.value,0,255)},true);});});
  document.addEventListener('keydown',function(e){if(!back.classList.contains('show'))return;if(e.key==='Escape')close();});
}
function bindSV(){
  function move(e){var r=sv.getBoundingClientRect(),x=clamp(e.clientX-r.left,0,r.width),y=clamp(e.clientY-r.top,0,r.height);s=r.width?x/r.width:0;v=r.height?1-y/r.height:0;syncUI();}
  sv.addEventListener('pointerdown',function(e){e.preventDefault();try{sv.setPointerCapture(e.pointerId);}catch(_){}move(e);function mv(ev){if(ev.pointerId===e.pointerId){ev.preventDefault();move(ev);}}function up(ev){if(ev.pointerId!==e.pointerId)return;window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);}window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);});
}
function setRgb(c,fromInput){var hsv=rgbToHsv(c.r,c.g,c.b);h=hsv.h;s=hsv.s;v=hsv.v;hue.value=Math.round(h);syncUI(!!fromInput);}
function syncMode(){back.querySelectorAll('[data-color-mode]').forEach(function(b){b.classList.toggle('active',b.dataset.colorMode===mode);});back.querySelectorAll('[data-color-panel]').forEach(function(p){p.classList.toggle('active',p.dataset.colorPanel===mode);});}
function syncUI(fromInput){
  var c=currentRgb(),hex=rgbToHex(c.r,c.g,c.b),rgb='rgb('+c.r+', '+c.g+', '+c.b+')';var hueRgb=hsvToRgb(h,1,1);sv.style.background='rgb('+hueRgb.r+','+hueRgb.g+','+hueRgb.b+')';knob.style.left=(s*100)+'%';knob.style.top=((1-v)*100)+'%';preview.style.background=hex;valueText.textContent=mode==='hex'?hex:rgb;document.getElementById('bwColorRgbValue').textContent=rgb;hue.value=Math.round(h);
  if(!fromInput||document.activeElement!==hexInput)hexInput.value=hex;if(!fromInput||document.activeElement!==rInput)rInput.value=c.r;if(!fromInput||document.activeElement!==gInput)gInput.value=c.g;if(!fromInput||document.activeElement!==bInput)bInput.value=c.b;
}
function open(opts){build();opts=opts||{};mode=opts.mode==='rgb'?'rgb':'hex';onApply=typeof opts.onApply==='function'?opts.onApply:null;titleEl.textContent=opts.title||'Color';setRgb(parseColor(opts.value||'#7C3AED'));syncMode();syncUI();back.classList.add('show');}
function close(){if(back)back.classList.remove('show');onApply=null;}
function apply(){var val=selectedValue(),fn=onApply;back.classList.remove('show');onApply=null;if(fn)fn(val);}

function selectedEl(){return typeof selectedNode==='function'?selectedNode():null;}
function content(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function commitRefresh(el){if(typeof commit==='function')commit();if(typeof selectNode==='function'&&el)selectNode(el.dataset.vfId);setTimeout(function(){if(window.BrotwareMobileProperties&&BrotwareMobileProperties.render)BrotwareMobileProperties.render();if(window.BrotwareMobileQuickProperties&&BrotwareMobileQuickProperties.render)BrotwareMobileQuickProperties.render();},50);}
function openFor(action){var el=selectedEl();if(!el)return;var t=content(el);if(action==='textColor'){open({title:'Text color',value:t.style.color||'#FFFFFF',onApply:function(c){t.style.color=c;commitRefresh(el);}});}else{var current=t.style.backgroundColor||'';open({title:'Background color',value:current||'#FFFFFF',onApply:function(c){t.style.backgroundColor=c;commitRefresh(el);}});}}
function installIntegration(){
  document.addEventListener('click',function(e){
    var p=e.target.closest&&e.target.closest('[data-mprops-action="backgroundColor"],[data-mprops-action="textColor"]');if(p){e.preventDefault();e.stopImmediatePropagation();openFor(p.dataset.mpropsAction);return;}
    var q=e.target.closest&&e.target.closest('[data-mquick-action="background"],[data-mquick-action="textColor"]');if(q){e.preventDefault();e.stopImmediatePropagation();openFor(q.dataset.mquickAction==='textColor'?'textColor':'backgroundColor');return;}
    var old=e.target.closest&&e.target.closest('[data-quick="background"],[data-quick="color"]');if(old&&window.matchMedia('(max-width:760px)').matches){e.preventDefault();e.stopImmediatePropagation();openFor(old.dataset.quick==='color'?'textColor':'backgroundColor');}
  },true);
}

window.BrotwareColorPicker={open:open,close:close,parse:parseColor};
build();installIntegration();
})();
