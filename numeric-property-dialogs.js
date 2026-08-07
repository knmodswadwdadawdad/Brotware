(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
var back=null,bodyEl=null,titleEl=null,subEl=null,iconEl=null,saveBtn=null,currentSave=null;
var UNITS=['px','%','rem','em'];
var SIZE_UNITS=['px','%','rem','em','vw','vh'];

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function target(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c];});}
function num(v,fallback){var n=parseFloat(v);return isNaN(n)?(fallback==null?0:fallback):n;}
function fmt(n){n=Number(n)||0;return Math.round(n*100)/100;}
function parseMeasure(v,defUnit){
  v=String(v==null?'':v).trim();var m=v.match(/^(-?\d+(?:\.\d+)?)\s*(px|%|rem|em|vw|vh)?$/i);
  if(!m)return{value:num(v,0),unit:defUnit||'px'};
  return{value:num(m[1],0),unit:(m[2]||defUnit||'px').toLowerCase()};
}
function cssValue(value,unit,allowNegative){var n=num(value,0);if(!allowNegative)n=Math.max(0,n);return fmt(n)+(unit||'px');}
function computed(el){try{return getComputedStyle(el);}catch(e){return null;}}
function commitRefresh(el){
  if(typeof commit==='function')commit();
  if(typeof selectNode==='function'&&el)selectNode(el.dataset.vfId);
  setTimeout(function(){
    if(window.BrotwareMobileProperties&&BrotwareMobileProperties.render)BrotwareMobileProperties.render();
    if(window.BrotwareMobileQuickProperties&&BrotwareMobileQuickProperties.render)BrotwareMobileQuickProperties.render();
  },45);
}
function notice(s){if(typeof toast==='function')toast(s);}

function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwNumericDialog';back.className='bw-num-backdrop';
  back.innerHTML='<section class="bw-num-dialog" role="dialog" aria-modal="true"><header class="bw-num-head"><span class="icon" id="bwNumIcon">▣</span><strong id="bwNumTitle">Value</strong><small id="bwNumSub"></small></header><main class="bw-num-body" id="bwNumBody"></main><footer class="bw-num-actions"><button id="bwNumCancel" type="button">Cancel</button><button id="bwNumSave" type="button">Save</button></footer></section>';
  document.body.appendChild(back);bodyEl=document.getElementById('bwNumBody');titleEl=document.getElementById('bwNumTitle');subEl=document.getElementById('bwNumSub');iconEl=document.getElementById('bwNumIcon');saveBtn=document.getElementById('bwNumSave');
  document.getElementById('bwNumCancel').onclick=close;saveBtn.onclick=function(){if(typeof currentSave==='function')currentSave();};
  back.addEventListener('pointerdown',function(e){if(e.target===back)close();});
  document.addEventListener('keydown',function(e){if(!back.classList.contains('show'))return;if(e.key==='Escape')close();});
}
function openDialog(icon,title,sub,html,onSave){build();iconEl.textContent=icon||'▣';titleEl.textContent=title||'Value';subEl.textContent=sub||'';bodyEl.innerHTML=html||'';currentSave=onSave;back.classList.add('show');setTimeout(function(){var n=bodyEl.querySelector('input');if(n){try{n.focus({preventScroll:true});n.select();}catch(e){}}},40);}
function close(){if(back)back.classList.remove('show');currentSave=null;}
function unitOptions(list,current){return list.map(function(u){return'<option value="'+u+'" '+(u===current?'selected':'')+'>'+u+'</option>';}).join('');}

function readBoxValues(el,kind){
  var cs=computed(el),pre=kind==='padding'?'padding':'margin';
  if(!cs)return['0px','0px','0px','0px'];
  return[cs[pre+'Top'],cs[pre+'Right'],cs[pre+'Bottom'],cs[pre+'Left']];
}
function sameFour(a){return a[0]===a[1]&&a[1]===a[2]&&a[2]===a[3];}
function openSpacing(kind){
  var el=selected();if(!el)return;var isPadding=kind==='padding',subject=isPadding?target(el):el,vals=readBoxValues(subject,kind),p=vals.map(function(x){return parseMeasure(x,'px');}),all=sameFour(vals),unit=p[0].unit||'px';
  var title=isPadding?'Padding':'Margin',icon=isPadding?'▣':'⌞';
  var html='<label class="bw-num-field"><span>Enter '+kind+' value</span><div class="bw-num-input-row"><input id="bwNumAllValue" type="number" inputmode="decimal" step="1" value="'+fmt(p[0].value)+'"><select id="bwNumUnit">'+unitOptions(UNITS,unit)+'</select></div></label><label class="bw-num-check"><input id="bwNumAllSides" type="checkbox" '+(all?'checked':'')+'> <span>'+title+' on all sides</span></label><div class="bw-num-sides '+(all?'bw-num-hidden':'')+'" id="bwNumSides"><label class="bw-num-side"><span>Top</span><input id="bwNumTop" type="number" inputmode="decimal" value="'+fmt(p[0].value)+'"></label><label class="bw-num-side"><span>Right</span><input id="bwNumRight" type="number" inputmode="decimal" value="'+fmt(p[1].value)+'"></label><label class="bw-num-side"><span>Bottom</span><input id="bwNumBottom" type="number" inputmode="decimal" value="'+fmt(p[2].value)+'"></label><label class="bw-num-side"><span>Left</span><input id="bwNumLeft" type="number" inputmode="decimal" value="'+fmt(p[3].value)+'"></label></div>';
  openDialog(icon,title,'Configure spacing without writing CSS',html,function(){
    var u=document.getElementById('bwNumUnit').value||'px',useAll=document.getElementById('bwNumAllSides').checked,allowNegative=!isPadding;
    if(useAll)subject.style[kind]=cssValue(document.getElementById('bwNumAllValue').value,u,allowNegative);
    else subject.style[kind]=[document.getElementById('bwNumTop').value,document.getElementById('bwNumRight').value,document.getElementById('bwNumBottom').value,document.getElementById('bwNumLeft').value].map(function(v){return cssValue(v,u,allowNegative);}).join(' ');
    commitRefresh(el);close();
  });
  var chk=document.getElementById('bwNumAllSides'),sides=document.getElementById('bwNumSides');chk.onchange=function(){sides.classList.toggle('bw-num-hidden',chk.checked);};
}

function readRadius(t){var cs=computed(t);if(!cs)return['0px','0px','0px','0px'];return[cs.borderTopLeftRadius,cs.borderTopRightRadius,cs.borderBottomRightRadius,cs.borderBottomLeftRadius];}
function openRadius(){
  var el=selected();if(!el)return;var t=target(el),vals=readRadius(t),p=vals.map(function(x){return parseMeasure(x,'px');}),all=sameFour(vals),unit=p[0].unit||'px';
  var html='<label class="bw-num-field"><span>Enter radius value</span><div class="bw-num-input-row"><input id="bwNumAllValue" type="number" inputmode="decimal" min="0" value="'+fmt(p[0].value)+'"><select id="bwNumUnit">'+unitOptions(UNITS,unit)+'</select></div></label><label class="bw-num-check"><input id="bwNumAllSides" type="checkbox" '+(all?'checked':'')+'> <span>Radius on all corners</span></label><div class="bw-num-sides '+(all?'bw-num-hidden':'')+'" id="bwNumSides"><label class="bw-num-side"><span>Top left</span><input id="bwNumTop" type="number" inputmode="decimal" min="0" value="'+fmt(p[0].value)+'"></label><label class="bw-num-side"><span>Top right</span><input id="bwNumRight" type="number" inputmode="decimal" min="0" value="'+fmt(p[1].value)+'"></label><label class="bw-num-side"><span>Bottom right</span><input id="bwNumBottom" type="number" inputmode="decimal" min="0" value="'+fmt(p[2].value)+'"></label><label class="bw-num-side"><span>Bottom left</span><input id="bwNumLeft" type="number" inputmode="decimal" min="0" value="'+fmt(p[3].value)+'"></label></div>';
  openDialog('◯','Border radius','Round one or all corners',html,function(){var u=document.getElementById('bwNumUnit').value||'px',useAll=document.getElementById('bwNumAllSides').checked;if(useAll)t.style.borderRadius=cssValue(document.getElementById('bwNumAllValue').value,u,false);else t.style.borderRadius=[document.getElementById('bwNumTop').value,document.getElementById('bwNumRight').value,document.getElementById('bwNumBottom').value,document.getElementById('bwNumLeft').value].map(function(v){return cssValue(v,u,false);}).join(' ');commitRefresh(el);close();});
  var chk=document.getElementById('bwNumAllSides'),sides=document.getElementById('bwNumSides');chk.onchange=function(){sides.classList.toggle('bw-num-hidden',chk.checked);};
}

function openBorder(){
  var el=selected();if(!el)return;var t=target(el),cs=computed(t),w=parseMeasure(cs?cs.borderTopWidth:(t.style.borderWidth||'0px'),'px'),style=(cs&&cs.borderTopStyle)||t.style.borderStyle||'solid',color=(cs&&cs.borderTopColor)||t.style.borderColor||'#333333';
  if(style==='none')style='solid';var pickedColor=color;
  var html='<div class="bw-num-border-grid"><label class="bw-num-field"><span>Border width</span><div class="bw-num-input-row"><input id="bwNumBorderWidth" type="number" inputmode="decimal" min="0" value="'+fmt(w.value)+'"><select id="bwNumBorderUnit">'+unitOptions(['px','rem','em'],w.unit)+'</select></div></label><label class="bw-num-field"><span>Border style</span><div class="bw-num-input-row" style="grid-template-columns:1fr"><select id="bwNumBorderStyle" style="border-left:0;text-align:left"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option><option value="none">None</option></select></div></label><label class="bw-num-field"><span>Border color</span><button class="bw-num-color-row" id="bwNumBorderColor" type="button"><span class="bw-num-color-swatch" id="bwNumBorderSwatch" style="background:'+esc(color)+'"></span><span><b id="bwNumBorderColorText">'+esc(color)+'</b><small>Tap to choose color</small></span></button></label></div>';
  openDialog('□','Border','Width, style and color',html,function(){var n=Math.max(0,num(document.getElementById('bwNumBorderWidth').value,0)),u=document.getElementById('bwNumBorderUnit').value||'px',st=document.getElementById('bwNumBorderStyle').value||'solid';if(st==='none'||n===0)t.style.border='none';else t.style.border=fmt(n)+u+' '+st+' '+pickedColor;commitRefresh(el);close();});
  document.getElementById('bwNumBorderStyle').value=style;
  document.getElementById('bwNumBorderColor').onclick=function(){if(window.BrotwareColorPicker&&BrotwareColorPicker.open){BrotwareColorPicker.open({title:'Border color',value:pickedColor,onApply:function(c){pickedColor=c;document.getElementById('bwNumBorderSwatch').style.background=c;document.getElementById('bwNumBorderColorText').textContent=c;}});}};
}

function openSize(opts){
  opts=opts||{};var el=opts.el||selected();if(!el)return;var t=opts.target||target(el),prop=opts.prop||'fontSize',current=parseMeasure((t.style&&t.style[prop])||opts.value||'0px','px'),units=opts.units||SIZE_UNITS;
  var html='<label class="bw-num-field"><span>'+esc(opts.label||'Enter value')+'</span><div class="bw-num-input-row"><input id="bwNumSizeValue" type="number" inputmode="decimal" value="'+fmt(current.value)+'"><select id="bwNumUnit">'+unitOptions(units,current.unit)+'</select></div></label>'+(opts.help?'<div class="bw-num-help">'+esc(opts.help)+'</div>':'');
  openDialog(opts.icon||'↔',opts.title||'Size',opts.sub||'Choose value and unit',html,function(){var val=cssValue(document.getElementById('bwNumSizeValue').value,document.getElementById('bwNumUnit').value,!!opts.allowNegative);if(typeof opts.apply==='function')opts.apply(val,el,t);else t.style[prop]=val;commitRefresh(el);close();});
}
function openFontSize(){var el=selected();if(!el)return;openSize({el:el,target:target(el),prop:'fontSize',title:'Font size',icon:'T',label:'Enter font size',help:'For beginners, px is usually the easiest unit.'});}

function openPosition(){
  var el=selected();if(!el)return;var x=parseMeasure(el.style.left||'0px','px'),y=parseMeasure(el.style.top||'0px','px');
  var html='<div class="bw-num-position"><label><span>X position</span><div class="bw-num-input-row"><input id="bwNumPosX" type="number" inputmode="decimal" value="'+fmt(x.value)+'"><select disabled><option>px</option></select></div></label><label><span>Y position</span><div class="bw-num-input-row"><input id="bwNumPosY" type="number" inputmode="decimal" value="'+fmt(y.value)+'"><select disabled><option>px</option></select></div></label></div><div class="bw-num-help">Position is relative to the current parent/container.</div>';
  openDialog('⌖','Position','Set the exact X and Y coordinates',html,function(){el.style.left=fmt(num(document.getElementById('bwNumPosX').value,0))+'px';el.style.top=fmt(num(document.getElementById('bwNumPosY').value,0))+'px';commitRefresh(el);close();});
}

function route(action){if(action==='padding'){openSpacing('padding');return true;}if(action==='margin'){openSpacing('margin');return true;}if(action==='radius'){openRadius();return true;}if(action==='border'){openBorder();return true;}if(action==='fontSize'){openFontSize();return true;}if(action==='position'){openPosition();return true;}return false;}
function installIntegration(){
  document.addEventListener('click',function(e){if(!mq.matches)return;var n=e.target.closest&&e.target.closest('[data-mprops-action],[data-mquick-action]');if(!n)return;var a=n.dataset.mpropsAction||n.dataset.mquickAction;if(route(a)){e.preventDefault();e.stopImmediatePropagation();}},true);
}

build();installIntegration();
window.BrotwareNumericDialogs={openSpacing:openSpacing,openRadius:openRadius,openBorder:openBorder,openSize:openSize,openPosition:openPosition,close:close};
})();
