(function(){
'use strict';

var back=null,input=null,resBox=null,resList=null,resSearch=null,binding=null;
var selectedStringKey='';

function selected(){return typeof selectedNode==='function'?selectedNode():null;}
function target(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function canText(el){return !!(el&&['text','button','input','textarea','link','checkbox','select','radio','switch','badge','icon','number','date'].indexOf(el.dataset.type)>=0);}
function readText(el){
  if(!el)return'';var t=target(el),type=el.dataset.type;
  if(type==='select'){var o=t&&t.options&&t.options.length?t.options[t.selectedIndex>=0?t.selectedIndex:0]:null;return o?o.textContent:'';}
  if(type==='radio'){var s=t&&t.querySelector?t.querySelector('.bw-extra-label'):null;return s?s.textContent:'';}
  if(type==='switch'){var q=t&&t.querySelector?t.querySelector('.bw-extra-label'):null;return q?q.textContent:'';}
  if(type==='badge'||type==='icon')return t?t.textContent:'';
  try{return typeof getText==='function'?getText(el):String(t&&t.textContent||'');}catch(e){return'';}
}
function writeText(el,value){
  if(!el)return;var t=target(el),type=el.dataset.type;value=String(value==null?'':value);
  if(type==='select'){
    if(t&&t.options&&t.options.length)t.options[t.selectedIndex>=0?t.selectedIndex:0].textContent=value;
    return;
  }
  if(type==='radio'||type==='switch'){
    var s=t&&t.querySelector?t.querySelector('.bw-extra-label'):null;if(s)s.textContent=value;return;
  }
  if(type==='badge'||type==='icon'){if(t)t.textContent=value;return;}
  if(type==='input'||type==='number'||type==='date'){
    if(t){t.value=value;t.setAttribute('value',value);}return;
  }
  if(type==='textarea'){
    if(t){t.value=value;t.textContent=value;}return;
  }
  if(typeof setText==='function')setText(el,value);else if(t)t.textContent=value;
}
function build(){
  if(back)return;
  back=document.createElement('div');back.id='bwTextPropertyDialog';back.className='bw-textprop-backdrop';
  back.innerHTML='<section class="bw-textprop-dialog" role="dialog" aria-modal="true"><header class="bw-textprop-head"><span class="ico">▤</span><strong>Text</strong></header><main class="bw-textprop-body"><div class="bw-textprop-field"><textarea id="bwTextPropInput" spellcheck="true"></textarea><span class="chev">⌄</span></div><div class="bw-textprop-binding" id="bwTextPropBinding"></div><section class="bw-textprop-resource" id="bwTextPropResource"><div class="bw-textprop-resource-head"><input id="bwTextPropSearch" placeholder="Search strings..."><button id="bwTextPropNewString" type="button">＋ New</button></div><div class="bw-textprop-resource-list" id="bwTextPropResourceList"></div></section></main><footer class="bw-textprop-actions"><button class="strings" id="bwTextPropStrings" type="button">strings.xml</button><button id="bwTextPropCancel" type="button">Cancel</button><button class="save" id="bwTextPropSave" type="button">Save</button></footer></section>';
  document.body.appendChild(back);input=document.getElementById('bwTextPropInput');resBox=document.getElementById('bwTextPropResource');resList=document.getElementById('bwTextPropResourceList');resSearch=document.getElementById('bwTextPropSearch');binding=document.getElementById('bwTextPropBinding');
  document.getElementById('bwTextPropCancel').onclick=close;document.getElementById('bwTextPropSave').onclick=save;
  document.getElementById('bwTextPropStrings').onclick=function(){resBox.classList.toggle('show');if(resBox.classList.contains('show')){renderStrings();setTimeout(function(){resSearch.focus();},30);}};
  document.getElementById('bwTextPropNewString').onclick=createString;
  resSearch.addEventListener('input',renderStrings);
  resList.addEventListener('click',function(e){var b=e.target.closest('[data-string-key]');if(!b)return;chooseString(b.dataset.stringKey);});
  input.addEventListener('input',function(){selectedStringKey='';syncBinding();});
  back.addEventListener('pointerdown',function(e){if(e.target===back)close();});
  document.addEventListener('keydown',function(e){if(!back.classList.contains('show'))return;if(e.key==='Escape')close();if((e.ctrlKey||e.metaKey)&&e.key==='Enter')save();});
}
function syncBinding(){
  if(!binding)return;
  if(selectedStringKey)binding.innerHTML='Using resource: <b>@string/'+esc(selectedStringKey)+'</b>';
  else binding.textContent='Direct text';
}
function renderStrings(){
  var q=String(resSearch&&resSearch.value||'').trim().toLowerCase(),keys=Object.keys((typeof state!=='undefined'&&state.strings)||{});
  if(q)keys=keys.filter(function(k){return k.toLowerCase().indexOf(q)>=0||String(state.strings[k]).toLowerCase().indexOf(q)>=0;});
  if(!keys.length){resList.innerHTML='<div class="bw-textprop-empty">No strings found.</div>';return;}
  resList.innerHTML=keys.map(function(k){var active=k===selectedStringKey;return'<button class="bw-textprop-string'+(active?' active':'')+'" type="button" data-string-key="'+esc(k)+'"><span><b>@string/'+esc(k)+'</b><small>'+esc(state.strings[k])+'</small></span><i>'+(active?'✓':'›')+'</i></button>';}).join('');
}
function chooseString(key){if(!state.strings||state.strings[key]==null)return;selectedStringKey=key;input.value=String(state.strings[key]);syncBinding();renderStrings();}
function createString(){
  var key=prompt('String name:','text_title');if(key===null)return;key=String(key||'').trim().replace(/[^a-zA-Z0-9_]+/g,'_');if(!key)return;if(state.strings[key]!=null){if(typeof toast==='function')toast('Essa String já existe');return;}
  var value=prompt('String value:',input.value||'Text');if(value===null)return;state.strings[key]=value;if(typeof renderStrings==='function'&&window.renderStrings!==renderStrings)try{window.renderStrings();}catch(_){}if(typeof refreshStringOptions==='function')refreshStringOptions();if(typeof autoSave==='function')autoSave();chooseString(key);
}
function open(){
  build();var el=selected();if(!el||!canText(el)){if(typeof toast==='function')toast('Essa View não possui texto editável');return;}
  selectedStringKey=el.dataset.stringKey||'';input.value=selectedStringKey&&state.strings[selectedStringKey]!=null?String(state.strings[selectedStringKey]):readText(el);resBox.classList.remove('show');resSearch.value='';syncBinding();back.classList.add('show');setTimeout(function(){input.focus();try{input.setSelectionRange(input.value.length,input.value.length);}catch(_){}},40);
}
function close(){if(back)back.classList.remove('show');selectedStringKey='';}
function save(){
  var el=selected();if(!el)return close();var value=input.value;
  if(selectedStringKey&&state.strings[selectedStringKey]!=null){el.dataset.stringKey=selectedStringKey;writeText(el,state.strings[selectedStringKey]);}
  else{el.dataset.stringKey='';writeText(el,value);}
  if(typeof commit==='function')commit();if(typeof selectNode==='function')selectNode(el.dataset.vfId);
  setTimeout(function(){if(window.BrotwareMobileProperties&&BrotwareMobileProperties.render)BrotwareMobileProperties.render();if(window.BrotwareMobileQuickProperties&&BrotwareMobileQuickProperties.render)BrotwareMobileQuickProperties.render();},40);
  close();if(typeof toast==='function')toast('Text atualizado');
}
function install(){
  document.addEventListener('click',function(e){
    var n=e.target.closest&&e.target.closest('[data-mprops-action="text"],[data-mquick-action="text"],[data-quick="text"]');if(!n)return;var el=selected();if(!canText(el))return;e.preventDefault();e.stopImmediatePropagation();open();
  },true);
}

window.BrotwareTextDialog={open:open,close:close};build();install();
})();
