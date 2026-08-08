(function(){
'use strict';

var FONT_URL='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';
var FONT_HTML='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&amp;family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&amp;family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&amp;display=block';
var ICONS=[
'home','search','settings','favorite','favorite_border','person','account_circle','menu','close','add','remove','check','done','arrow_back','arrow_forward','arrow_upward','arrow_downward','chevron_left','chevron_right','expand_more','expand_less','more_vert','more_horiz','refresh','sync','download','upload','share','link','open_in_new','launch','logout','login',
'shopping_cart','shopping_bag','store','payments','credit_card','sell','receipt_long','local_offer','inventory_2','category','redeem','wallet','currency_exchange','paid',
'notifications','notifications_active','mail','email','send','chat','forum','call','phone','contacts','alternate_email','mark_email_read',
'play_arrow','pause','stop','skip_next','skip_previous','volume_up','volume_off','mic','videocam','image','photo_camera','gallery_thumbnail','movie','music_note','headphones','fullscreen','fullscreen_exit',
'delete','edit','save','content_copy','content_cut','content_paste','undo','redo','print','visibility','visibility_off','lock','lock_open','key','shield','verified','warning','error','info','help','check_circle','cancel',
'calendar_month','schedule','timer','alarm','today','event','history','update','hourglass_empty',
'location_on','map','navigation','explore','language','public','travel_explore','near_me','my_location',
'folder','folder_open','description','article','attach_file','cloud','cloud_upload','cloud_download','database','storage','terminal','code','data_object','javascript','html','css',
'wifi','bluetooth','battery_full','signal_cellular_alt','smartphone','tablet','computer','desktop_windows','memory','developer_mode','devices',
'bolt','star','star_border','rocket_launch','auto_awesome','lightbulb','palette','brush','dashboard','grid_view','view_list','tune','filter_list','sort','drag_indicator','apps','widgets','extension',
'fitness_center','directions_run','sports_esports','emoji_events','school','work','business','groups','group','admin_panel_settings','analytics','monitoring','trending_up','bar_chart','pie_chart','insights'
];

var back=null,search=null,list=null,preview=null,family=null,fill=null,weight=null,size=null;
var selectedName='star';

function ensureFont(){
  if(document.getElementById('bwMaterialSymbolsFont'))return;
  var l=document.createElement('link');l.id='bwMaterialSymbolsFont';l.rel='stylesheet';l.href=FONT_URL;document.head.appendChild(l);
}
function familyName(v){return v==='outlined'?'Material Symbols Outlined':v==='sharp'?'Material Symbols Sharp':'Material Symbols Rounded';}
function normalizeName(v){return String(v==null?'':v).trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/[^a-z0-9_]/g,'');}
function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function target(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function isIcon(el){return !!(el&&el.dataset&&el.dataset.type==='icon');}
function clamp(n,min,max,def){n=Number(n);if(!isFinite(n))n=def;return Math.max(min,Math.min(max,n));}

function settingsOf(el){
  var t=target(el),text=t?normalizeName(t.textContent):'';
  return{
    name:normalizeName(el&&el.dataset.materialIcon)||text||'star',
    family:(el&&el.dataset.materialFamily)||'rounded',
    fill:String(el&&el.dataset.materialFill)==='1'?1:0,
    weight:clamp(el&&el.dataset.materialWeight,100,700,400),
    size:clamp(el&&el.dataset.materialSize,12,160,36)
  };
}
function apply(el,opt){
  if(!isIcon(el))return;
  ensureFont();opt=opt||settingsOf(el);
  var name=normalizeName(opt.name)||'star',fam=['rounded','outlined','sharp'].indexOf(opt.family)>=0?opt.family:'rounded';
  var filled=Number(opt.fill)===1?1:0,w=clamp(opt.weight,100,700,400),sz=clamp(opt.size,12,160,36),t=target(el);if(!t)return;
  el.dataset.materialIcon=name;el.dataset.materialFamily=fam;el.dataset.materialFill=String(filled);el.dataset.materialWeight=String(w);el.dataset.materialSize=String(sz);
  t.classList.add('bw-material-symbol');t.textContent=name;t.dataset.materialName=name;
  t.style.fontFamily='"'+familyName(fam)+'"';t.style.fontSize=sz+'px';t.style.fontWeight='normal';t.style.fontStyle='normal';t.style.lineHeight='1';t.style.fontVariationSettings="'FILL' "+filled+", 'wght' "+w+", 'GRAD' 0, 'opsz' 48";
  t.style.display='grid';t.style.placeItems='center';t.style.width='100%';t.style.height='100%';t.style.overflow='hidden';
}
function hydrate(el){if(!isIcon(el))return;var s=settingsOf(el);if((target(el)&&target(el).textContent||'').trim()==='★')s.name='star';apply(el,s);}
function hydrateAll(){document.querySelectorAll('.vf-node[data-type="icon"]').forEach(hydrate);}

var baseMarkup=window.nodeMarkup;
window.nodeMarkup=function(type){
  if(type==='icon')return '<span class="vf-content bw-material-symbol" data-material-name="star" style="width:100%;height:100%;display:grid;place-items:center;overflow:hidden;font-family:\'Material Symbols Rounded\';font-size:36px;font-variation-settings:\'FILL\' 0, \'wght\' 400, \'GRAD\' 0, \'opsz\' 48">star</span>';
  return baseMarkup(type);
};
var baseCreate=window.createNode;
window.createNode=function(){var el=baseCreate.apply(this,arguments);if(isIcon(el)){apply(el,{name:'star',family:'rounded',fill:0,weight:400,size:36});if(typeof commit==='function')commit();}return el;};
var baseLoad=window.loadPage;
if(baseLoad)window.loadPage=function(){var r=baseLoad.apply(this,arguments);setTimeout(hydrateAll,0);return r;};
var baseGet=window.getText;
window.getText=function(el){if(isIcon(el))return settingsOf(el).name;return baseGet(el);};
var baseSet=window.setText;
window.setText=function(el,value){if(isIcon(el)){var s=settingsOf(el);s.name=normalizeName(value)||'star';apply(el,s);return;}return baseSet(el,value);};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function iconSpan(name,cls){return '<span class="bw-material-symbol '+(cls||'')+'" style="font-family:\''+familyName(family?family.value:'rounded')+'\';font-variation-settings:\'FILL\' '+(fill?fill.value:'0')+', \'wght\' '+(weight?weight.value:'400')+', \'GRAD\' 0, \'opsz\' 48">'+esc(name)+'</span>';}
function build(){
  if(back)return;ensureFont();
  back=document.createElement('div');back.id='bwMaterialIconPicker';back.className='bw-mi-backdrop';
  back.innerHTML='<section class="bw-mi-dialog" role="dialog" aria-modal="true">'+
    '<header class="bw-mi-head"><div class="preview" id="bwMiPreview"></div><div><strong>Google Material Symbols</strong><small>Escolha um ícone para a View selecionada</small></div><button class="bw-mi-close" id="bwMiClose" type="button">×</button></header>'+
    '<div class="bw-mi-controls">'+
      '<label class="bw-mi-field"><span>Pesquisar</span><input id="bwMiSearch" placeholder="shopping_cart, home, settings..."></label>'+
      '<label class="bw-mi-field"><span>Estilo</span><select id="bwMiFamily"><option value="rounded">Rounded</option><option value="outlined">Outlined</option><option value="sharp">Sharp</option></select></label>'+
      '<label class="bw-mi-field"><span>Preenchido</span><select id="bwMiFill"><option value="0">Não</option><option value="1">Sim</option></select></label>'+
      '<label class="bw-mi-field"><span>Peso</span><select id="bwMiWeight"><option>100</option><option>200</option><option>300</option><option selected>400</option><option>500</option><option>600</option><option>700</option></select></label>'+
      '<label class="bw-mi-field"><span>Tamanho</span><input id="bwMiSize" type="number" min="12" max="160" step="1" value="36"></label>'+
    '</div>'+
    '<main class="bw-mi-list" id="bwMiList"></main>'+
    '<footer class="bw-mi-actions"><span class="hint">Dica: você também pode digitar o nome oficial de qualquer Material Symbol.</span><button id="bwMiUseTyped" type="button">Usar nome digitado</button><button id="bwMiCancel" type="button">Cancelar</button><button class="save" id="bwMiSave" type="button">Aplicar</button></footer>'+
  '</section>';
  document.body.appendChild(back);search=document.getElementById('bwMiSearch');list=document.getElementById('bwMiList');preview=document.getElementById('bwMiPreview');family=document.getElementById('bwMiFamily');fill=document.getElementById('bwMiFill');weight=document.getElementById('bwMiWeight');size=document.getElementById('bwMiSize');
  document.getElementById('bwMiClose').onclick=close;document.getElementById('bwMiCancel').onclick=close;document.getElementById('bwMiSave').onclick=save;
  document.getElementById('bwMiUseTyped').onclick=function(){var n=normalizeName(search.value);if(n){selectedName=n;renderPreview();renderList();}};
  search.addEventListener('input',renderList);family.addEventListener('change',refreshVisuals);fill.addEventListener('change',refreshVisuals);weight.addEventListener('change',refreshVisuals);size.addEventListener('input',renderPreview);
  list.addEventListener('click',function(e){var b=e.target.closest('[data-mi-name]');if(!b)return;selectedName=b.dataset.miName;renderPreview();renderList();});
  back.addEventListener('pointerdown',function(e){if(e.target===back)close();});
  document.addEventListener('keydown',function(e){if(!back.classList.contains('show'))return;if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key==='Enter')save();});
}
function refreshVisuals(){renderPreview();renderList();}
function renderPreview(){if(!preview)return;preview.innerHTML=iconSpan(selectedName);var s=preview.querySelector('.bw-material-symbol');if(s)s.style.fontSize=clamp(size&&size.value,12,160,36)+'px';}
function renderList(){
  if(!list)return;var q=normalizeName(search&&search.value),arr=ICONS.filter(function(n){return !q||n.indexOf(q)>=0;});
  if(!arr.length){list.innerHTML='<div class="bw-mi-empty">Nenhum ícone comum encontrado. Clique em <b>Usar nome digitado</b> para tentar um nome oficial do Material Symbols.</div>';return;}
  list.innerHTML=arr.slice(0,180).map(function(n){return'<button type="button" class="bw-mi-item'+(n===selectedName?' active':'')+'" data-mi-name="'+esc(n)+'">'+iconSpan(n)+'<b>'+esc(n)+'</b></button>';}).join('');
}
function open(){
  build();var el=selected();if(!isIcon(el)){if(typeof toast==='function')toast('Selecione uma View Icon');return;}hydrate(el);var s=settingsOf(el);selectedName=s.name;search.value='';family.value=s.family;fill.value=String(s.fill);weight.value=String(s.weight);size.value=String(s.size);renderPreview();renderList();back.classList.add('show');setTimeout(function(){search.focus();},40);
}
function close(){if(back)back.classList.remove('show');}
function save(){
  var el=selected();if(!isIcon(el))return close();apply(el,{name:selectedName,family:family.value,fill:Number(fill.value),weight:Number(weight.value),size:Number(size.value)});if(typeof commit==='function')commit();if(typeof selectNode==='function')selectNode(el.dataset.vfId);close();if(typeof toast==='function')toast('Ícone atualizado');setTimeout(relabel,20);
}

function relabel(){
  var el=selected(),icon=isIcon(el);document.querySelectorAll('[data-mquick-action="text"],[data-mprops-action="text"],[data-quick="text"]').forEach(function(b){
    if(!b.dataset.bwIconOriginal)b.dataset.bwIconOriginal=b.innerHTML;
    if(!icon){if(b.dataset.bwIconChanged==='1'){b.innerHTML=b.dataset.bwIconOriginal;b.dataset.bwIconChanged='0';}return;}
    var label=b.querySelector('b');if(label)label.textContent='Icon';else{var spans=b.querySelectorAll('span');if(spans.length)spans[spans.length-1].textContent='Icon';}
    b.dataset.bwIconChanged='1';
  });
}
function installActions(){
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-mquick-action="text"],[data-mprops-action="text"],[data-quick="text"]');if(!a||!isIcon(selected()))return;e.preventDefault();e.stopImmediatePropagation();open();},true);
  document.addEventListener('dblclick',function(e){var n=e.target.closest&&e.target.closest('.vf-node[data-type="icon"]');if(!n)return;e.preventDefault();e.stopImmediatePropagation();if(typeof selectNode==='function')selectNode(n.dataset.vfId);open();},true);
  new MutationObserver(function(){setTimeout(function(){hydrateAll();relabel();},0);}).observe(document.body,{childList:true,subtree:true});
}

var baseCompile=window.compilePage;
if(baseCompile)window.compilePage=function(page){
  var html=baseCompile.apply(this,arguments);if(!/data-type=["']icon["']|bw-material-symbol/.test(html))return html;
  var link='<link rel="stylesheet" href="'+FONT_HTML+'">';
  var css='<style>.bw-material-symbol{font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-grid;place-items:center;white-space:nowrap;word-wrap:normal;direction:ltr;font-feature-settings:"liga";-webkit-font-feature-settings:"liga";-webkit-font-smoothing:antialiased;overflow:hidden}</style>';
  return html.replace('<head>','<head>'+link+css);
};

ensureFont();build();installActions();hydrateAll();setTimeout(hydrateAll,300);setTimeout(hydrateAll,1100);
window.BrotwareMaterialIcons={open:open,close:close,apply:apply,hydrate:hydrate,icons:ICONS};
})();
