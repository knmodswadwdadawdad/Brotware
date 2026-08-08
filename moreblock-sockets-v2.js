(function(){
'use strict';

var patched=false,observer=null,queued=false;
function mb(){return window.BrotwareMoreBlocks||null;}
function graph(){return window.BrotwareBlockGraph||null;}
function typed(){return window.BrotwareTypedSockets||null;}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function ensureInputs(b){if(b&&!b.inputs)b.inputs={};return b?b.inputs:{};}
function ensureFallbacks(b){if(b&&!b.__inputFallbacks)b.__inputFallbacks={};return b?b.__inputFallbacks:{};}
function fn(id){return (state.functions||[]).find(function(x){return String(x.id)===String(id);})||null;}
function find(id){var g=graph();return g&&g.find?g.find(id):null;}
function safe(name){var a=mb();return a&&a.safeArgKey?a.safeArgKey(name):('arg_'+String(name||'').replace(/[^A-Za-z0-9_]/g,'_'));}
function shapeFor(t){t=String(t||'');if(t==='number')return'number';if(t==='boolean')return'boolean';if(t==='view')return'string';return'string';}
function acceptsFor(t){t=String(t||'');if(t==='number')return['number','any'];if(t==='boolean')return['boolean','any'];if(t==='string')return['string','number','boolean','any'];return['string','number','boolean','any'];}
function specsFor(b){
  if(!b)return[];var p=b.props||{};
  if(b.type==='callMoreBlock'){
    var f=fn(p.functionId);if(!f)return[];return (f.params||[]).map(function(x){return{key:safe(x.name),prop:safe(x.name),shape:shapeFor(x.dataType),accepts:acceptsFor(x.dataType)};});
  }
  if(b.type==='returnMoreBlock')return[{key:'value',prop:'value',shape:shapeFor(p.returnType),accepts:acceptsFor(p.returnType)}];
  return[];
}
function specByKey(b,key){var a=specsFor(b);for(var i=0;i<a.length;i++)if(a[i].key===key)return a[i];return null;}
function reporterOutput(b){if(!b)return'statement';if(b.type==='valueString')return'string';if(b.type==='valueNumber')return'number';if(b.type==='valueBoolean')return'boolean';if(b.type==='getVarValue')return'any';return'statement';}
function reporterValue(b){if(!b)return'';var p=b.props||{};if(b.type==='valueString')return String(p.value==null?'':p.value);if(b.type==='valueNumber')return String(p.value==null?'0':p.value);if(b.type==='valueBoolean')return String(p.value).toLowerCase()==='false'?'false':'true';if(b.type==='getVarValue')return '$'+String(p.name||'counter');return'';}
function compatible(child,spec){var out=reporterOutput(child),a=spec.accepts||[];return out!=='statement'&&(out==='any'||a.indexOf('any')>=0||a.indexOf(out)>=0);}
function capture(parent,spec){var f=ensureFallbacks(parent);if(!Object.prototype.hasOwnProperty.call(f,spec.key))f[spec.key]=(parent.props||{})[spec.prop];}
function restore(parent,spec){var f=ensureFallbacks(parent);if(Object.prototype.hasOwnProperty.call(f,spec.key)){if(!parent.props)parent.props={};parent.props[spec.prop]=f[spec.key];}}
function syncInput(parent,spec){var child=ensureInputs(parent)[spec.key];if(!child){restore(parent,spec);return;}if(!parent.props)parent.props={};parent.props[spec.prop]=reporterValue(child);}
function syncBlock(b){specsFor(b).forEach(function(s){syncInput(b,s);});}
function walk(list,cb){(list||[]).forEach(function(b){cb(b);var ins=ensureInputs(b);Object.keys(ins).forEach(function(k){if(ins[k])walkInput(ins[k],cb);});walk(b.children||[],cb);walk(b.elseChildren||[],cb);});}
function walkInput(b,cb){if(!b)return;cb(b);var ins=ensureInputs(b);Object.keys(ins).forEach(function(k){if(ins[k])walkInput(ins[k],cb);});}
function syncAll(){try{walk(activeBlocks(),function(b){if(b.type==='callMoreBlock'||b.type==='returnMoreBlock')syncBlock(b);});}catch(_){}}
function word(v){return'<span class="sw2-word">'+esc(v)+'</span>';}
function menu(v){return'<span class="sw2-socket menu">'+esc(v==null?'':v)+'</span>';}
function rep(b){var p=b.props||{},out=reporterOutput(b),h='';if(b.type==='valueString')h=esc(p.value==null?'':p.value);else if(b.type==='valueNumber')h=esc(p.value==null?'0':p.value);else if(b.type==='valueBoolean')h=esc(String(p.value).toLowerCase()==='false'?'false':'true');else if(b.type==='getVarValue')h=esc(p.name||'counter')+' <span class="sw3-mini-arrow">▼</span>';return'<span class="sw3-reporter '+out+' type-'+esc(b.type)+'" data-value-block-id="'+esc(b.id)+'">'+h+'</span>';}
function host(parent,spec){var child=ensureInputs(parent)[spec.key],v=(parent.props||{})[spec.prop];return'<span class="sw3-input-host '+esc(spec.shape)+'" data-sw3-parent="'+esc(parent.id)+'" data-sw3-key="'+esc(spec.key)+'" data-sw3-accepts="'+esc((spec.accepts||[]).join(','))+'">'+(child?rep(child):'<span class="sw3-empty-socket '+esc(spec.shape)+'">'+esc(v==null?'':v)+'</span>')+'</span>';}
function markup(b){
  if(!b)return null;var p=b.props||{};
  if(b.type==='returnMoreBlock'){var rs=specsFor(b)[0];return word('return')+(rs?host(b,rs):word(p.value||''));}
  if(b.type!=='callMoreBlock')return null;var f=fn(p.functionId);if(!f)return word('MoreBlock');var h=word(f.name),map={};specsFor(b).forEach(function(s){map[s.key]=s;});
  (f.parts||[]).forEach(function(part){if(part.kind==='label')h+=word(part.text);else{var k=safe(part.name);h+=map[k]?host(b,map[k]):word(part.name);}});if(f.returnType&&f.returnType!=='void')h+=word('→')+menu(p.saveVar||'result');return h;
}
function decorate(){var ov=document.getElementById('swLogicOverlay');if(!ov)return;ov.querySelectorAll('.sw-block[data-block-id]').forEach(function(el){var b=find(el.dataset.blockId),h=markup(b);if(h==null)return;var sig=b.type+'|'+JSON.stringify(b.props||{})+'|'+JSON.stringify(b.inputs||{});if(el.dataset.bwMbSocketSig===sig)return;el.dataset.bwMbSocketSig=sig;var main=el.querySelector(':scope > .sw-block-main, :scope > .sw-control-wrap > .sw-block-main'),name=main&&main.querySelector('.sw-block-name');if(name)name.innerHTML=h;var s=main&&main.querySelector('.sw-block-summary');if(s)s.style.display='none';});}
function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;syncAll();decorate();});}
function patch(){var t=typed();if(!t||patched)return false;patched=true;var ba=t.attach,bd=t.detach,bs=t.sync,br=t.refresh;
  t.attach=function(parentId,key,child){var parent=find(parentId),spec=specByKey(parent,key);if(!parent||!spec)return ba.apply(this,arguments);if(!compatible(child,spec))return false;var g=graph();if(g&&g.contains&&g.contains(child,parent.id))return false;capture(parent,spec);ensureInputs(parent)[key]=child;syncInput(parent,spec);if(g&&g.refresh)g.refresh();return true;};
  t.detach=function(id){var g=graph(),rel=g&&g.snapshot?g.snapshot(id):null;if(rel&&rel.kind==='input'){var parent=find(rel.ownerId),spec=specByKey(parent,rel.key);if(parent&&spec){var child=ensureInputs(parent)[rel.key]||null;ensureInputs(parent)[rel.key]=null;restore(parent,spec);if(g&&g.refresh)g.refresh();return child;}}return bd.apply(this,arguments);};
  t.sync=function(){var r=bs&&bs.apply(this,arguments);syncAll();return r;};t.refresh=function(){var r=br&&br.apply(this,arguments);queue();return r;};return true;
}
function install(){if(!patch()){setTimeout(install,200);return;}var ov=document.getElementById('swLogicOverlay');if(!ov){setTimeout(install,200);return;}if(ov.dataset.bwMbSockets==='1'){queue();return;}ov.dataset.bwMbSockets='1';observer=new MutationObserver(queue);observer.observe(ov,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('brotware:logic-refresh',queue);queue();}
window.BrotwareMoreBlockSockets={refresh:queue,sync:syncAll,specsFor:specsFor};setTimeout(install,0);setTimeout(install,700);
})();
