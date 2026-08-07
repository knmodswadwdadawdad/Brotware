(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)');
var screen=null,body=null,titleId=null,editorBack=null,editorBox=null;
var collapsed={advanced:true};
var editorApply=null;
var baseOpenProperties=window.openProperties;

var TYPE_NAMES={text:'TextView',button:'Button',input:'Input',textarea:'TextArea',image:'Image',link:'Link',checkbox:'Checkbox',select:'Select',progress:'Progress',divider:'Divider','linear-h':'Linear(H)','linear-v':'Linear(V)',relative:'RelativeLayout',card:'CardView',scroll:'ScrollView'};
var TEXT_TYPES={text:1,button:1,input:1,textarea:1,link:1,checkbox:1,select:1};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function target(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function typeName(el){return TYPE_NAMES[el&&el.dataset.type]||String(el&&el.dataset.type||'View');}
function fmtNone(v){v=String(v||'').trim();return v||'none';}
function px(v){var n=Math.round(Number(v)||0);return n+'px';}
function sizeValue(el,prop){
  var key=prop==='width'?'widthMode':'heightMode',mode=el.dataset[key],v=el.style[prop]||'';
  if(mode==='match_parent'||v==='100%')return'match_parent';
  if(mode==='wrap_content'||v==='max-content'||v==='fit-content'||v==='auto')return'wrap_content';
  return v||px(prop==='width'?el.offsetWidth:el.offsetHeight);
}
function imageLabel(el){return el.dataset.imageResourceName||el.dataset.imageResource||'default_image';}
function bgResourceLabel(el){return el.dataset.backgroundResourceName||el.dataset.backgroundResource||'none';}
function textValue(el){try{return typeof getText==='function'?getText(el):String(target(el).textContent||'');}catch(e){return'';}}
function imagePreview(el){var t=target(el),img=t&&t.querySelector?t.querySelector('img'):null;if(img)return'<span class="bw-mprops-preview"><img src="'+esc(img.src)+'" alt=""></span>';return'<span class="bw-mprops-preview">▧</span>';}
function swatch(value){var v=String(value||'').trim();return'<span class="bw-mprops-swatch" style="background:'+(v?esc(v):'transparent')+'"></span>';}

function build(){
  if(screen)return;
  screen=document.createElement('div');screen.id='bwMobileProperties';screen.className='bw-mprops-screen';
  screen.innerHTML='<header class="bw-mprops-head"><button id="bwMPropsBack" type="button">←</button><div class="bw-mprops-title"><strong>Edit Properties</strong><small id="bwMPropsId">view</small></div><button id="bwMPropsView" type="button" title="Select View">▧</button></header><main class="bw-mprops-body" id="bwMPropsBody"></main>';
  document.body.appendChild(screen);body=document.getElementById('bwMPropsBody');titleId=document.getElementById('bwMPropsId');
  document.getElementById('bwMPropsBack').onclick=close;
  document.getElementById('bwMPropsView').onclick=function(){if(window.BrotwareViewSelector&&BrotwareViewSelector.open)BrotwareViewSelector.open();};
  body.addEventListener('click',onBodyClick);

  editorBack=document.createElement('div');editorBack.id='bwMPropsEditorBackdrop';editorBack.className='bw-mprops-editor-backdrop';
  editorBack.innerHTML='<section class="bw-mprops-editor" id="bwMPropsEditor"></section>';
  document.body.appendChild(editorBack);editorBox=document.getElementById('bwMPropsEditor');
  editorBack.addEventListener('click',function(e){if(e.target===editorBack)closeEditor();});
}

function section(key,title,rows){
  if(!rows)return'';var c=!!collapsed[key];
  return'<section class="bw-mprops-section'+(c?' collapsed':'')+'" data-mprops-section="'+esc(key)+'"><button type="button" class="bw-mprops-section-head" data-mprops-collapse="'+esc(key)+'"><span>'+esc(title)+'</span><span class="chev">⌄</span></button><div class="bw-mprops-section-content">'+rows+'</div></section>';
}
function row(action,icon,name,value,trailing,disabled){
  return'<button type="button" class="bw-mprops-row'+(disabled?' disabled':'')+'" data-mprops-action="'+esc(action)+'"><span class="bw-mprops-icon">'+icon+'</span><span class="bw-mprops-meta"><b>'+esc(name)+'</b><small>'+esc(value==null?'':value)+'</small></span>'+(trailing||'')+'</button>';
}
function render(){
  build();var el=selected();if(!el){close();return;}
  titleId.textContent=el.dataset.vfId||'view';var t=target(el),typ=el.dataset.type||'';
  var general='';
  general+=row('id','◌','ID',el.dataset.vfId||'');
  general+=row('type','‹›','Type',typeName(el),'',true);

  var layout='';
  layout+=row('width','↔','Width',sizeValue(el,'width'));
  layout+=row('height','↕','Height',sizeValue(el,'height'));
  layout+=row('position','⌖','Position','X: '+Math.round(parseFloat(el.style.left)||0)+' · Y: '+Math.round(parseFloat(el.style.top)||0));
  layout+=row('padding','▣','Padding',fmtNone(t.style.padding||'0'));
  layout+=row('margin','⌞','Margin',fmtNone(el.style.margin||'0'));
  layout+=row('layoutGravity','⌘','Layout gravity',fmtNone(String(el.dataset.layoutGravity||'').replace(/\|/g,', ')));

  var specific='';
  if(typ==='image'){
    specific+=row('image','▧','Image',imageLabel(el),imagePreview(el));
    specific+=row('scaleType','↗','Scale type',String(el.dataset.scaleType||'cover').toUpperCase());
  }
  if(TEXT_TYPES[typ]){
    specific+=row('text','T','Text',textValue(el));
    if(typ==='input'||typ==='textarea')specific+=row('placeholder','⌨','Placeholder',String(t.placeholder||''));
    if(typ==='link')specific+=row('href','↗','Link / URL',String(el.dataset.href||''));
    specific+=row('gravity','⌘','Gravity',fmtNone(String(el.dataset.gravity||'').replace(/\|/g,', ')));
    specific+=row('textColor','A','Text color',fmtNone(t.style.color),swatch(t.style.color||'transparent'));
    specific+=row('fontSize','T','Font size',fmtNone(t.style.fontSize));
    specific+=row('fontWeight','B','Font weight',fmtNone(t.style.fontWeight));
  }

  var appearance='';
  appearance+=row('backgroundResource','◌','Background resource',bgResourceLabel(el),resourcePreview(el,'background'));
  appearance+=row('backgroundColor','◉','Background color',fmtNone(t.style.backgroundColor||simpleBackground(t.style.background)),swatch(t.style.backgroundColor||simpleBackground(t.style.background)||'transparent'));
  appearance+=row('border','□','Border',fmtNone(t.style.border));
  appearance+=row('radius','◯','Border radius',fmtNone(t.style.borderRadius));
  appearance+=row('opacity','◐','Opacity',String(el.style.opacity||'1'));

  var advanced='';
  advanced+=row('class','.', 'CSS Class',fmtNone(el.dataset.userClass));
  advanced+=row('customCss','</>','Custom CSS',fmtNone(t.dataset.customCss));
  advanced+='<div class="bw-mprops-advanced-note">Advanced mostra opções técnicas. O Design continua salvando HTML/CSS automaticamente.</div>';

  body.innerHTML=section('general','General',general)+section('layout','Layout Properties',layout)+(specific?section('specific',typ==='image'?'Image Properties':'Content Properties',specific):'')+section('appearance','Appearance',appearance)+section('advanced','Advanced',advanced);
}
function simpleBackground(v){v=String(v||'').trim();if(!v||v.indexOf('gradient')>=0||v.indexOf('url(')>=0)return'';return v;}
function resourcePreview(el,mode){
  if(mode==='background'){
    var t=target(el),bg=t.style.backgroundImage||'';var m=bg.match(/url\(["']?(.*?)["']?\)/);if(m&&m[1])return'<span class="bw-mprops-preview"><img src="'+esc(m[1])+'" alt=""></span>';
    return'<span class="bw-mprops-preview">◌</span>';
  }
  return'';
}

function open(){build();if(!mq.matches){if(baseOpenProperties)return baseOpenProperties.apply(window,arguments);return;}if(!selected()){if(typeof toast==='function')toast('Selecione uma View primeiro');return;}render();screen.classList.add('show');document.body.classList.add('bw-mobile-properties-open');}
function close(){closeEditor();if(screen)screen.classList.remove('show');document.body.classList.remove('bw-mobile-properties-open');}
function isOpen(){return !!(screen&&screen.classList.contains('show'));}

function onBodyClick(e){
  var c=e.target.closest('[data-mprops-collapse]');if(c){var k=c.dataset.mpropsCollapse;collapsed[k]=!collapsed[k];var s=c.closest('.bw-mprops-section');if(s)s.classList.toggle('collapsed',!!collapsed[k]);return;}
  var r=e.target.closest('[data-mprops-action]');if(!r||r.classList.contains('disabled'))return;action(r.dataset.mpropsAction);
}
function action(a){
  var el=selected();if(!el)return;var t=target(el);
  if(a==='width'&&window.BrotwareSizeDialog){BrotwareSizeDialog.open('width');return;}
  if(a==='height'&&window.BrotwareSizeDialog){BrotwareSizeDialog.open('height');return;}
  if(a==='layoutGravity'&&window.BrotwareLayoutGravityDialog){BrotwareLayoutGravityDialog.open();return;}
  if(a==='gravity'&&window.BrotwareGravityDialog){BrotwareGravityDialog.open();return;}
  if(a==='image'&&window.BrotwareImageResourceDialog){BrotwareImageResourceDialog.openImage();return;}
  if(a==='backgroundResource'&&window.BrotwareImageResourceDialog){BrotwareImageResourceDialog.openBackground();return;}
  if(a==='scaleType'){openChoice('Scale type','Como a imagem ocupa o espaço',[['cover','Cover'],['contain','Contain / Center'],['fill','Fill'],['none','Original'],['scale-down','Scale down']],el.dataset.scaleType||'cover',function(v){el.dataset.scaleType=v;var img=t.querySelector&&t.querySelector('img');if(img){img.style.objectFit=v;img.style.objectPosition='center';}commitAndRefresh();});return;}
  if(a==='id'){openField('ID','Identificador usado em Logic e exportação',el.dataset.vfId||'','text',function(v){v=String(v||'').trim().replace(/\s+/g,'_');if(!v)return false;var old=el.dataset.vfId;if(v!==old&&root.querySelector('[data-vf-id="'+cssEscape(v)+'"]')){notice('Esse ID já existe');return false;}if(v!==old){if(typeof renameNodeInEvents==='function')renameNodeInEvents(old,v);renameDialogEventId(old,v);el.dataset.vfId=v;state.selectedId=v;}commitAndRefresh();return true;});return;}
  if(a==='position'){openPosition(el);return;}
  if(a==='padding'){openField('Padding','Ex.: 16px ou 8px 12px',t.style.padding||'0','text',function(v){t.style.padding=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='margin'){openField('Margin','Ex.: 8px ou 8px 16px',el.style.margin||'0','text',function(v){el.style.margin=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='backgroundColor'){openField('Background color','Cor CSS, ex.: #17171F',t.style.backgroundColor||simpleBackground(t.style.background)||'','colorText',function(v){t.style.backgroundColor=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='textColor'){openField('Text color','Cor CSS, ex.: #FFFFFF',t.style.color||'','colorText',function(v){t.style.color=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='text'){openField('Text','Texto exibido pela View',textValue(el),'textarea',function(v){if(typeof setText==='function')setText(el,v);else t.textContent=v;commitAndRefresh();return true;});return;}
  if(a==='placeholder'){openField('Placeholder','Texto de ajuda do campo',t.placeholder||'','text',function(v){t.placeholder=v;commitAndRefresh();return true;});return;}
  if(a==='href'){openField('Link / URL','Destino do link',el.dataset.href||'','text',function(v){el.dataset.href=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='fontSize'){openField('Font size','Ex.: 16px',t.style.fontSize||'','text',function(v){t.style.fontSize=normalizeCssNumber(v,'px');commitAndRefresh();return true;});return;}
  if(a==='fontWeight'){openChoice('Font weight','Peso visual do texto',[['400','Normal'],['500','Medium'],['600','Semi Bold'],['700','Bold'],['800','Extra Bold'],['900','Black']],String(t.style.fontWeight||'400'),function(v){t.style.fontWeight=v;commitAndRefresh();});return;}
  if(a==='border'){openField('Border','Ex.: 1px solid #333',t.style.border||'','text',function(v){t.style.border=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='radius'){openField('Border radius','Ex.: 12px',t.style.borderRadius||'','text',function(v){t.style.borderRadius=normalizeCssNumber(v,'px');commitAndRefresh();return true;});return;}
  if(a==='opacity'){openField('Opacity','Valor entre 0 e 1',el.style.opacity||'1','number',function(v){var n=Math.max(0,Math.min(1,Number(v)));if(isNaN(n))return false;el.style.opacity=String(n);commitAndRefresh();return true;});return;}
  if(a==='class'){openField('CSS Class','Classes personalizadas separadas por espaço',el.dataset.userClass||'','text',function(v){el.dataset.userClass=String(v||'').trim();commitAndRefresh();return true;});return;}
  if(a==='customCss'){openField('Custom CSS','CSS avançado aplicado diretamente ao conteúdo',t.dataset.customCss||'','textarea',function(v){if(typeof applyCustomCss==='function')applyCustomCss(el,v);else t.dataset.customCss=v;commitAndRefresh();return true;});return;}
}
function cssEscape(v){return String(v||'').replace(/(["\\])/g,'\\$1');}
function normalizeCssNumber(v,unit){v=String(v||'').trim();if(!v)return'';return /^-?\d+(\.\d+)?$/.test(v)?v+(unit||'px'):v;}
function notice(s){if(typeof toast==='function')toast(s);}
function renameDialogEventId(oldId,newId){
  if(!state||!state.dialogEditorActive||!window.BrotwareDialogs||!BrotwareDialogs.get)return;var d=BrotwareDialogs.get(state.activeDialogId);if(!d||!d.events)return;
  if(d.events[oldId]){d.events[newId]=d.events[oldId];delete d.events[oldId];}
  function walk(a){(a||[]).forEach(function(b){if(b.props){if(b.props.target===oldId)b.props.target=newId;if(b.props.source===oldId)b.props.source=newId;}walk(b.children);walk(b.elseChildren);});}
  Object.keys(d.events).forEach(function(k){var ev=d.events[k]||{};Object.keys(ev).forEach(function(x){walk(ev[x]);});});
}
function commitAndRefresh(){if(typeof commit==='function')commit();if(typeof selectNode==='function'&&selected())selectNode(selected().dataset.vfId);setTimeout(render,30);}

function openField(title,sub,value,kind,apply){
  build();editorApply=apply;var input=kind==='textarea'?'<textarea id="bwMPropsEditorValue"></textarea>':'<input id="bwMPropsEditorValue" type="'+(kind==='number'?'number':'text')+'">';
  editorBox.innerHTML='<h3>'+esc(title)+'</h3><p>'+esc(sub||'')+'</p><label class="bw-mprops-field"><span>Value</span>'+input+'</label><div class="bw-mprops-editor-actions"><button data-mprops-editor="cancel" type="button">Cancel</button><button data-mprops-editor="apply" type="button">Apply</button></div>';
  var inp=document.getElementById('bwMPropsEditorValue');inp.value=value==null?'':value;
  bindEditorActions();editorBack.classList.add('show');setTimeout(function(){try{inp.focus();inp.select();}catch(e){}},50);
}
function openPosition(el){
  editorApply=function(){var x=Number(document.getElementById('bwMPropsPosX').value),y=Number(document.getElementById('bwMPropsPosY').value);if(isNaN(x)||isNaN(y))return false;el.style.left=Math.round(x)+'px';el.style.top=Math.round(y)+'px';commitAndRefresh();return true;};
  editorBox.innerHTML='<h3>Position</h3><p>Posição dentro do layout pai</p><label class="bw-mprops-field"><span>X</span><input id="bwMPropsPosX" type="number" inputmode="numeric" value="'+Math.round(parseFloat(el.style.left)||0)+'"></label><label class="bw-mprops-field"><span>Y</span><input id="bwMPropsPosY" type="number" inputmode="numeric" value="'+Math.round(parseFloat(el.style.top)||0)+'"></label><div class="bw-mprops-editor-actions"><button data-mprops-editor="cancel" type="button">Cancel</button><button data-mprops-editor="apply" type="button">Apply</button></div>';
  bindEditorActions();editorBack.classList.add('show');
}
function openChoice(title,sub,options,current,apply){
  build();editorApply=null;var html='<h3>'+esc(title)+'</h3><p>'+esc(sub||'')+'</p><div class="bw-mprops-choice-list">';
  options.forEach(function(o){html+='<button type="button" class="bw-mprops-choice'+(String(o[0])===String(current)?' active':'')+'" data-mprops-choice="'+esc(o[0])+'"><span class="radio"></span><span>'+esc(o[1])+'</span></button>';});
  html+='</div><div class="bw-mprops-editor-actions"><button data-mprops-editor="cancel" type="button">Cancel</button></div>';editorBox.innerHTML=html;
  editorBox.querySelectorAll('[data-mprops-choice]').forEach(function(b){b.onclick=function(){apply(this.dataset.mpropsChoice);closeEditor();};});
  bindEditorActions();editorBack.classList.add('show');
}
function bindEditorActions(){
  var cancel=editorBox.querySelector('[data-mprops-editor="cancel"]');if(cancel)cancel.onclick=closeEditor;
  var apply=editorBox.querySelector('[data-mprops-editor="apply"]');if(apply)apply.onclick=function(){if(!editorApply||editorApply(document.getElementById('bwMPropsEditorValue')?document.getElementById('bwMPropsEditorValue').value:null)!==false)closeEditor();};
}
function closeEditor(){if(editorBack)editorBack.classList.remove('show');editorApply=null;}

function installWrappers(){
  if(window.openProperties&&!window.openProperties.__bwMProps){var old=window.openProperties;var w=function(){if(mq.matches){open.apply(this,arguments);return;}return old.apply(this,arguments);};w.__bwMProps=true;window.openProperties=w;baseOpenProperties=old;}
  if(window.selectNode&&!window.selectNode.__bwMProps){var s0=window.selectNode;var s=function(){var r=s0.apply(this,arguments);if(isOpen()){if(selected())render();else close();}return r;};s.__bwMProps=true;window.selectNode=s;}
  if(window.commit&&!window.commit.__bwMProps){var c0=window.commit;var c=function(){var r=c0.apply(this,arguments);if(isOpen())setTimeout(render,0);return r;};c.__bwMProps=true;window.commit=c;}
}
function hookSpecialDialogs(){
  ['bwSizeSelect','bwGravitySelect','bwLayoutGravitySelect','bwImageResourceSelect'].forEach(function(id){var b=document.getElementById(id);if(b&&b.dataset.bwMPropsRefresh!=='1'){b.dataset.bwMPropsRefresh='1';b.addEventListener('click',function(){setTimeout(function(){if(isOpen())render();},60);});}});
}
function install(){build();installWrappers();hookSpecialDialogs();}
window.BrotwareMobileProperties={open:open,close:close,render:render};
setTimeout(install,0);setTimeout(install,350);setTimeout(install,1100);
})();
