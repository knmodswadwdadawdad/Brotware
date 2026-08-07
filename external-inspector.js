(function(){
'use strict';

var panel=null,layers=null,layersBody=null,current=null,currentTree=null,collapsed={};
var EDIT=[
  ['background-color','Background','backgroundColor'],['color','Cor','color'],['width','Width','width'],['height','Height','height'],['margin','Margin','margin'],['padding','Padding','padding'],['border','Border','border'],['border-radius','Radius','borderRadius'],['font-size','Font size','fontSize'],['font-family','Font','fontFamily'],['font-weight','Weight','fontWeight'],['display','Display','display'],['position','Position','position'],['gap','Gap','gap'],['opacity','Opacity','opacity'],['transform','Transform','transform'],['z-index','Z-index','zIndex']
];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function state(){return window.BrotwareExternalPreview?BrotwareExternalPreview.getState():{};}
function meta(){var s=state();return s.projectId?BrotwareVFS.getMeta(s.projectId):null;}
function uid(){return'bw_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);}
function build(){
  if(panel)return;var host=document.getElementById('bwExternalInspectorHost');if(!host)return;
  panel=document.createElement('div');panel.className='bw-dom-inspector';panel.innerHTML='<header><div><strong>Inspector</strong><small id="bwDomInspectorSub">Clique em Inspecionar e selecione um elemento</small></div><span class="spacer"></span><button id="bwInspectorClose" type="button">×</button></header><main id="bwDomInspectorBody"><div class="bw-inspector-empty">Selecione um elemento real dentro do preview.</div></main>';host.appendChild(panel);document.getElementById('bwInspectorClose').onclick=function(){host.classList.remove('open');};
  layers=document.createElement('div');layers.id='bwExternalLayersPanel';layers.className='bw-ext-layers-backdrop';layers.innerHTML='<section class="bw-ext-layers"><header><div><strong>Camadas · DOM real</strong><small>Atualiza quando o JavaScript altera a página</small></div><span class="spacer"></span><button id="bwExtLayersRefresh" type="button">↻</button><button id="bwExtLayersClose" type="button">×</button></header><label class="bw-ext-layer-search"><span>⌕</span><input id="bwExtLayerSearch" placeholder="Buscar tag, id, classe ou texto..."></label><main id="bwExtLayersBody"></main></section>';document.body.appendChild(layers);layersBody=document.getElementById('bwExtLayersBody');document.getElementById('bwExtLayersClose').onclick=closeLayers;document.getElementById('bwExtLayersRefresh').onclick=function(){BrotwareExternalPreview.requestSnapshot();};document.getElementById('bwExtLayerSearch').oninput=renderLayers;layers.addEventListener('click',function(e){if(e.target===layers)closeLayers();});layersBody.addEventListener('click',layerClick);
}
function openInspector(){build();var host=document.getElementById('bwExternalInspectorHost');if(host)host.classList.add('open');}
function attrRows(attrs){var keys=Object.keys(attrs||{});if(!keys.length)return'<div class="bw-inspector-none">Nenhum atributo.</div>';return keys.map(function(k){return'<div class="bw-inspector-attr"><code>'+esc(k)+'</code><span>'+esc(attrs[k])+'</span></div>';}).join('');}
function renderSelection(el){
  build();current=el;openInspector();var body=document.getElementById('bwDomInspectorBody'),sub=document.getElementById('bwDomInspectorSub');if(!body||!el)return;sub.textContent=el.tag+(el.id?'#'+el.id:'')+(el.bwId?' · '+el.bwId:'');
  var chips='<div class="bw-inspector-chips"><span>&lt;'+esc(String(el.tag||'').toLowerCase())+'&gt;</span>'+(el.id?'<span>#'+esc(el.id)+'</span>':'')+(el.classes?'<span>.'+esc(String(el.classes).trim().replace(/\s+/g,'.'))+'</span>':'')+'</div>';
  var rect=el.rect||{},info='<section><h4>Elemento</h4>'+chips+'<label class="bw-inspector-read"><span>Seletor</span><input readonly value="'+esc(el.selector||'')+'"></label><label class="bw-inspector-read"><span>Texto</span><textarea readonly>'+esc(el.text||'')+'</textarea></label><div class="bw-inspector-size"><b>'+Math.round(rect.width||0)+' × '+Math.round(rect.height||0)+'</b><small>x '+Math.round(rect.x||0)+' · y '+Math.round(rect.y||0)+'</small></div></section>';
  var styles='<section><h4>Estilo visual</h4><div class="bw-inspector-style-grid">';EDIT.forEach(function(row){var p=row[0],label=row[1],computed=row[2],v=(el.styles&&el.styles[computed])||'';styles+='<label><span>'+esc(label)+'</span><input data-bw-style="'+esc(p)+'" value="'+esc(v)+'"></label>';});styles+='</div><small class="bw-inspector-hint">As mudanças viram overrides separados. O CSS original não é reescrito.</small></section>';
  body.innerHTML=info+styles+'<section><h4>Atributos</h4><div class="bw-inspector-attrs">'+attrRows(el.attributes)+'</div></section>';
  body.querySelectorAll('[data-bw-style]').forEach(function(inp){inp.addEventListener('change',function(){applyStyle(this.dataset.bwStyle,this.value);});});
}
async function ensureBound(){
  if(!current)return null;var s=state(),m=BrotwareVFS.getMeta(s.projectId)||{},id=current.bwId;if(id)return id;id=uid();var bindings=Object.assign({},m.bindings||{});bindings[id]=current.selector;await BrotwareProjectFormat.updateExternalMeta(s.projectId,{bindings:bindings,mode:'hybrid'});current.bwId=id;BrotwareExternalPreview.bindElement(current.runtimeId,id,current.selector);return id;
}
async function applyStyle(prop,value){
  if(!current)return;var s=state(),id=await ensureBound(),m=BrotwareVFS.getMeta(s.projectId)||{},over=JSON.parse(JSON.stringify(m.overrides||{}));if(!over[id])over[id]={selector:current.selector,styles:{}};over[id].selector=current.selector;over[id].styles=over[id].styles||{};if(String(value||'').trim())over[id].styles[prop]=String(value).trim();else delete over[id].styles[prop];await BrotwareProjectFormat.updateExternalMeta(s.projectId,{overrides:over,bindings:m.bindings||{},mode:'hybrid'});BrotwareExternalPreview.updateOverrides();if(typeof toast==='function')toast('Override aplicado');
}
function nodeLabel(n){var s=n.tag+(n.id?'#'+n.id:'')+(n.classes?'.'+String(n.classes).trim().split(/\s+/).slice(0,2).join('.'):'');return s;}
function matches(n,q){if(!q)return true;var s=(nodeLabel(n)+' '+(n.text||'')).toLowerCase();if(s.indexOf(q)>=0)return true;return(n.children||[]).some(function(c){return matches(c,q);});}
function treeHtml(n,depth,q){if(!n||!matches(n,q))return'';var kids=n.children||[],key=n.runtimeId,closed=collapsed[key]&&!q;return'<div class="bw-ext-layer-branch"><div class="bw-ext-layer-row" data-ext-runtime="'+esc(key)+'" style="--ext-depth:'+depth+'">'+(kids.length?'<button data-ext-toggle="'+esc(key)+'" type="button">'+(closed?'›':'⌄')+'</button>':'<span class="toggle-empty"></span>')+'<span class="tag">'+esc(n.tag)+'</span><span class="meta"><b>'+esc(nodeLabel(n))+'</b><small>'+esc(n.text||'')+'</small></span>'+(n.bwId?'<em>'+esc(n.bwId)+'</em>':'')+'</div>'+(kids.length&&!closed?'<div>'+kids.map(function(c){return treeHtml(c,depth+1,q);}).join('')+'</div>':'')+'</div>';}
function renderLayers(){build();if(!layersBody)return;var q=String(document.getElementById('bwExtLayerSearch').value||'').trim().toLowerCase();layersBody.innerHTML=currentTree?treeHtml(currentTree,0,q):'<div class="bw-ext-layers-empty">Aguardando DOM do preview...</div>';}
function openLayers(data){build();if(data&&data.tree)currentTree=data.tree;layers.classList.add('show');renderLayers();}
function closeLayers(){if(layers)layers.classList.remove('show');}
function layerClick(e){var t=e.target.closest('[data-ext-toggle]');if(t){e.stopPropagation();var id=t.dataset.extToggle;collapsed[id]=!collapsed[id];renderLayers();return;}var row=e.target.closest('[data-ext-runtime]');if(!row)return;BrotwareExternalPreview.selectRuntime(row.dataset.extRuntime);closeLayers();}
function install(){
  build();if(!window.BrotwareExternalPreview)return;
  BrotwareExternalPreview.on('ELEMENT_SELECTED',renderSelection);BrotwareExternalPreview.on('DOM_SNAPSHOT',function(d){currentTree=d.tree;renderLayers();});BrotwareExternalPreview.on('OPEN_LAYERS',openLayers);BrotwareExternalPreview.on('OPEN',function(){current=null;currentTree=null;var host=document.getElementById('bwExternalInspectorHost');if(host)host.classList.remove('open');});
  if(window.BrotwareLayers&&!BrotwareLayers.__externalWrapped){var old=BrotwareLayers.open;BrotwareLayers.open=function(){var s=state();if(s&&s.projectId){openLayers({tree:s.snapshot});return;}return old.apply(this,arguments);};BrotwareLayers.__externalWrapped=true;}
}

window.BrotwareExternalInspector={open:openInspector,layers:openLayers,applyStyle:applyStyle,render:renderSelection};
setTimeout(install,0);setTimeout(install,700);setTimeout(install,1500);
})();
