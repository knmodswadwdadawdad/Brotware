(function(){
'use strict';

var installed=false,gridWired=false,overlayWired=false;
var CONTAINERS={BODY:1,DIV:1,SECTION:1,HEADER:1,NAV:1,MAIN:1,FOOTER:1,ARTICLE:1,ASIDE:1,FORM:1,UL:1,OL:1,LI:1,DIALOG:1};
var ITEMS=[
  ['text','T','TextView','Texto'],['button','▣','Button','Botão'],['input','⌨','Input','Campo de texto'],
  ['textarea','▤','TextArea','Texto multilinha'],['image','▧','ImageView','Imagem'],['link','↗','Link','Link'],
  ['checkbox','☑','CheckBox','Checkbox'],['select','⌄','Select','Lista'],['progress','◒','ProgressBar','Progresso'],
  ['divider','─','Divider','Divisor'],['linear-h','▥','Linear Horizontal','Layout horizontal'],['linear-v','▤','Linear Vertical','Layout vertical'],
  ['relative','▦','RelativeLayout','Container livre'],['card','▣','CardView','Card'],['scroll','↕','ScrollView','Rolagem']
];

function hs(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function active(){var s=hs();return !!(s&&s.active&&s.projectId);}
function sel(){return window.BrotwareHybridEditor&&BrotwareHybridEditor.selection?BrotwareHybridEditor.selection():(hs().selection||null);}
function snap(v){var g=(typeof state!=='undefined'&&Number(state.snap))||1;return g>0?Math.round(v/g)*g:Math.round(v);}
function uid(p){return(p||'bw')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
function attr(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function meta(){var s=hs();return s.projectId&&window.BrotwareVFS?BrotwareVFS.getMeta(s.projectId)||{}:{};}
function overridesFor(el){var m=meta(),id=el&&(el.bwId||(typeof state!=='undefined'&&state.externalSelectedRef)),x=id&&m.overrides&&m.overrides[id];return x&&x.styles||{};}
function parseTranslate(v){var m=String(v||'').match(/(-?[\d.]+)px(?:\s+|,\s*)(-?[\d.]+)px/);return m?[Number(m[1])||0,Number(m[2])||0]:[0,0];}
function px(v){var n=parseFloat(String(v==null?'':v));return isFinite(n)?n:0;}
function absoluteMode(el){return /^(absolute|fixed)$/i.test(String(el&&el.styles&&el.styles.position||''));}
function setStyles(o){if(window.BrotwareHybridEditor&&BrotwareHybridEditor.setStyles)return BrotwareHybridEditor.setStyles(o);}

function findParentSelector(runtimeId){var root=hs().snapshot,found=null;function walk(n,parent){if(!n||found)return;if(n.runtimeId===runtimeId){found=parent&&parent.selector||'body';return;}(n.children||[]).forEach(function(c){walk(c,n);});}walk(root,null);return found||'body';}
function parentSelector(){var s=sel();if(!s)return'body';return CONTAINERS[String(s.tag||'').toUpperCase()]?s.selector:findParentSelector(s.runtimeId);}
function markup(type,pid){var a=' data-bw-patch-id="'+attr(pid)+'" data-bw-native-type="'+attr(type)+'"';
  if(type==='text')return'<p'+a+' style="display:inline-block;min-width:110px;min-height:34px">TextView</p>';
  if(type==='button')return'<button'+a+' type="button" style="min-width:110px;min-height:40px">Button</button>';
  if(type==='input')return'<input'+a+' type="text" placeholder="Digite aqui" style="min-width:170px;min-height:40px">';
  if(type==='textarea')return'<textarea'+a+' placeholder="Digite aqui" style="min-width:190px;min-height:80px"></textarea>';
  if(type==='image')return'<img'+a+' alt="ImageView" style="display:block;width:120px;height:90px;object-fit:cover">';
  if(type==='link')return'<a'+a+' href="#" style="display:inline-block;min-width:100px;min-height:34px">Link</a>';
  if(type==='checkbox')return'<label'+a+' style="display:inline-flex;align-items:center;gap:7px;min-width:130px;min-height:36px"><input type="checkbox"> <span>Checkbox</span></label>';
  if(type==='select')return'<select'+a+' style="min-width:150px;min-height:40px"><option>Opção 1</option><option>Opção 2</option></select>';
  if(type==='progress')return'<progress'+a+' max="100" value="45" style="width:160px;height:28px"></progress>';
  if(type==='divider')return'<div'+a+' style="width:180px;height:1px;min-height:1px;background:#c7c7c7"></div>';
  if(type==='linear-h')return'<div'+a+' style="display:flex;flex-direction:row;align-items:flex-start;gap:8px;position:relative;min-width:230px;min-height:120px"></div>';
  if(type==='linear-v')return'<div'+a+' style="display:flex;flex-direction:column;align-items:stretch;gap:8px;position:relative;min-width:230px;min-height:140px"></div>';
  if(type==='relative')return'<div'+a+' style="position:relative;min-width:230px;min-height:140px"></div>';
  if(type==='card')return'<div'+a+' style="position:relative;min-width:190px;min-height:110px;border-radius:12px;background:#ffffff;box-shadow:0 2px 10px rgba(0,0,0,.16)"></div>';
  if(type==='scroll')return'<div'+a+' style="position:relative;overflow:auto;min-width:230px;min-height:180px"></div>';
  return'<div'+a+'></div>';
}
function insert(type){if(!active()||!window.BrotwareHybridEditor)return;var pid=uid('patch'),selector='[data-bw-patch-id="'+pid+'"]',html=markup(type,pid),parent=parentSelector();var back=document.getElementById('bwHybridAdd');if(back)back.classList.remove('show');BrotwareHybridEditor.addPatch({id:pid,op:'insert',parentSelector:parent,html:html,position:'beforeend'});setTimeout(function(){if(window.BrotwareExternalHybrid)BrotwareExternalHybrid.selectRef('@dom:'+selector);},260);}
function enhanceAdd(){var grid=document.getElementById('bwHybridAddGrid');if(!grid)return;grid.innerHTML=ITEMS.map(function(x){return'<button class="bw-hybrid-add-item bw-native-add-item" type="button" data-bw-native-add="'+x[0]+'"><span class="ico">'+x[1]+'</span><b>'+x[2]+'</b><small>'+x[3]+'</small></button>';}).join('');if(gridWired)return;gridWired=true;grid.addEventListener('click',function(e){var b=e.target.closest('[data-bw-native-add]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();insert(b.dataset.bwNativeAdd);},true);}

function moveStart(e,o){var el=sel();if(!el||el.tag==='BODY')return;e.preventDefault();e.stopImmediatePropagation();var sx=e.clientX,sy=e.clientY,base=overridesFor(el),abs=absoluteMode(el),tr=parseTranslate(base.translate),left=px(base.left||el.styles&&el.styles.left),top=px(base.top||el.styles&&el.styles.top),ox=px(o.style.left),oy=px(o.style.top);o.classList.add('moving');function mv(ev){var dx=snap(ev.clientX-sx),dy=snap(ev.clientY-sy);o.style.left=(ox+dx)+'px';o.style.top=(oy+dy)+'px';}function up(ev){cleanup();var dx=snap(ev.clientX-sx),dy=snap(ev.clientY-sy);if(abs)setStyles({left:snap(left+dx)+'px',top:snap(top+dy)+'px',right:'auto',bottom:'auto',translate:''});else setStyles({translate:snap(tr[0]+dx)+'px '+snap(tr[1]+dy)+'px'});}function cleanup(){o.classList.remove('moving');window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);}window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);}
function resizeStart(e,o,dir){var el=sel();if(!el||el.tag==='BODY')return;e.preventDefault();e.stopImmediatePropagation();var sx=e.clientX,sy=e.clientY,r=el.rect||{},w=Number(r.width)||1,h=Number(r.height)||1,ox=px(o.style.left),oy=px(o.style.top),base=overridesFor(el),abs=absoluteMode(el),tr=parseTranslate(base.translate),left=px(base.left||el.styles&&el.styles.left),top=px(base.top||el.styles&&el.styles.top);function calc(ev){var dx=snap(ev.clientX-sx),dy=snap(ev.clientY-sy),nw=w,nh=h,tx=0,ty=0;if(dir.indexOf('e')>=0)nw=Math.max(12,snap(w+dx));if(dir.indexOf('s')>=0)nh=Math.max(12,snap(h+dy));if(dir.indexOf('w')>=0){nw=Math.max(12,snap(w-dx));tx=snap(w-nw);}if(dir.indexOf('n')>=0){nh=Math.max(12,snap(h-dy));ty=snap(h-nh);}return{w:nw,h:nh,tx:tx,ty:ty};}function mv(ev){var c=calc(ev);o.style.width=c.w+'px';o.style.height=c.h+'px';o.style.left=(ox+c.tx)+'px';o.style.top=(oy+c.ty)+'px';}function up(ev){cleanup();var c=calc(ev),st={width:Math.round(c.w)+'px',height:Math.round(c.h)+'px'};if(c.tx||c.ty){if(abs){st.left=snap(left+c.tx)+'px';st.top=snap(top+c.ty)+'px';st.right='auto';st.bottom='auto';st.translate='';}else st.translate=snap(tr[0]+c.tx)+'px '+snap(tr[1]+c.ty)+'px';}setStyles(st);}function cleanup(){window.removeEventListener('pointermove',mv,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);}window.addEventListener('pointermove',mv,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);}
function enhanceOverlay(){var o=document.getElementById('bwHybridEditOverlay');if(!o||overlayWired)return;overlayWired=true;o.addEventListener('pointerdown',function(e){if(!active()||!window.BrotwareHybridEditor||!BrotwareHybridEditor.isEdit||!BrotwareHybridEditor.isEdit())return;var h=e.target.closest('[data-resize]');if(h)resizeStart(e,o,h.dataset.resize);else moveStart(e,o);},true);}

function refresh(){if(!active())return;enhanceAdd();enhanceOverlay();}
function install(){if(installed)return;if(!window.BrotwareHybridEditor||!window.BrotwareExternalHybrid){setTimeout(install,120);return;}installed=true;window.addEventListener('brotware:external-open',function(){setTimeout(refresh,180);});window.addEventListener('brotware:external-ready',function(){setTimeout(refresh,100);});window.addEventListener('brotware:external-selection',refresh);setInterval(refresh,700);}

window.BrotwareExternalNativeBehavior={refresh:refresh,insert:insert};
setTimeout(install,0);setTimeout(install,900);
})();