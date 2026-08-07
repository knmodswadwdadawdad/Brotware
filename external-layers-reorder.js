(function(){
'use strict';

var MOVE_JSON='brotware-layer-moves.json',MOVE_JS='brotware-layer-moves.js';
var CONTAINERS={BODY:1,DIV:1,SECTION:1,HEADER:1,NAV:1,MAIN:1,FOOTER:1,ARTICLE:1,ASIDE:1,FORM:1,UL:1,OL:1,LI:1,DIALOG:1,DETAILS:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TD:1,TH:1};
var drag=null,ghost=null,hint=null,dropRow=null,dropZone=null,suppressClickUntil=0,installed=false;
function hs(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function active(){var s=hs();return !!(s&&s.active&&s.projectId);}
function provider(){return window.BrotwareExternalDomProvider&&BrotwareExternalDomProvider.isActive()?BrotwareExternalDomProvider:null;}
function uid(){return'layer_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function entryText(path,obj){var text=JSON.stringify(obj,null,2);return{path:path,mime:'application/json',kind:'text',content:text,size:new TextEncoder().encode(text).length,modifiedAt:Date.now()};}
function scriptEntry(path,text){return{path:path,mime:'text/javascript',kind:'text',content:text,size:new TextEncoder().encode(text).length,modifiedAt:Date.now()};}
function parseMoves(files){var e=BrotwareVFS.get(files,MOVE_JSON);if(!e)return[];try{var x=JSON.parse(BrotwareVFS.text(e));return Array.isArray(x)?x:[];}catch(_){return[];}}
function compileMoves(moves){
  var json=JSON.stringify(moves||[]).replace(/<\/script/gi,'<\\/script');
  return "(function(){'use strict';var M="+json+",busy=false,timer=null;function q(s){try{return s&&document.querySelector(s)}catch(e){return null}}function by(a,id){try{return document.querySelector('['+a+'=\\\"'+id+'\\\"]')}catch(e){return null}}function mark(){M.forEach(function(m){if(!m||!m.id)return;var s=by('data-bw-layer-source',m.id)||q(m.selector),t=by('data-bw-layer-target',m.id)||q(m.targetSelector);if(s){s.setAttribute('data-bw-layer-source',m.id);if(m.bwId)s.setAttribute('data-bw-id',m.bwId)}if(t)t.setAttribute('data-bw-layer-target',m.id)})}function apply(){if(busy)return;busy=true;try{mark();M.forEach(function(m){if(!m||!m.id)return;var s=by('data-bw-layer-source',m.id),t=by('data-bw-layer-target',m.id);if(!s||!t||s===t||s.contains(t))return;if(m.position==='inside'){if(s.parentNode===t&&s===t.lastElementChild)return;t.appendChild(s);return}var p=t.parentNode;if(!p)return;if(m.position==='before'){if(s.parentNode===p&&s.nextElementSibling===t)return;p.insertBefore(s,t)}else if(m.position==='after'){if(s.parentNode===p&&t.nextElementSibling===s)return;p.insertBefore(s,t.nextSibling)}})}finally{busy=false}}function schedule(){clearTimeout(timer);timer=setTimeout(apply,45)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',apply)})();";
}
function inject(html,file){if(/data-brotware-layer-moves/i.test(html))return html;var src=BrotwareVFS.relative(file,MOVE_JS),tag='\n<script src="'+src+'" data-brotware-layer-moves defer><\/script>\n';return /<\/body>/i.test(html)?html.replace(/<\/body>/i,tag+'</body>'):html+tag;}
async function persistMove(move){
  var s=hs();if(!s.projectId)return;var rec=await BrotwareVFS.getProject(s.projectId),files=rec.files||{},moves=parseMoves(files);
  moves=moves.filter(function(x){return !(x&&x.selector===move.selector);});moves.push(move);
  files[MOVE_JSON]=entryText(MOVE_JSON,moves);files[MOVE_JS]=scriptEntry(MOVE_JS,compileMoves(moves));
  Object.keys(files).forEach(function(path){if(!/\.html?$/i.test(path))return;var e=files[path],html=BrotwareVFS.text(e),next=inject(html,path);if(next!==html)files[path]={path:path,mime:e.mime||'text/html',kind:'text',content:next,size:new TextEncoder().encode(next).length,modifiedAt:Date.now()};});
  await BrotwareVFS.putProject(s.projectId,files);await BrotwareProjectFormat.updateExternalMeta(s.projectId,{mode:'hybrid'});if(window.BrotwareExternalHybrid)await BrotwareExternalHybrid.render();if(typeof toast==='function')toast('Camada reorganizada');
}
function list(){var p=provider();return p?p.list():[];}
function item(runtimeId){return list().find(function(x){return x.runtimeId===runtimeId;})||null;}
function findTree(runtimeId){var root=hs().snapshot,out=null;function walk(n){if(!n||out)return;if(n.runtimeId===runtimeId){out=n;return;}(n.children||[]).forEach(walk);}walk(root);return out;}
function containsRuntime(root,id){if(!root)return false;if(root.runtimeId===id)return true;return(root.children||[]).some(function(c){return containsRuntime(c,id);});}
function valid(source,target,zone){if(!source||!target||source.runtimeId===target.runtimeId||source.tag==='BODY')return false;var sn=findTree(source.runtimeId);if(sn&&containsRuntime(sn,target.runtimeId))return false;if(target.tag==='BODY')return zone==='inside';if(zone==='inside'&&!CONTAINERS[target.tag])return false;return true;}
function zoneFor(row,target,y){var r=row.getBoundingClientRect(),rel=(y-r.top)/Math.max(1,r.height);if(target&&target.tag==='BODY')return'inside';if(target&&CONTAINERS[target.tag]&&rel>=.3&&rel<=.7)return'inside';return rel<.5?'before':'after';}
function clearDrop(){document.querySelectorAll('.bw-layer-drop-before,.bw-layer-drop-after,.bw-layer-drop-inside,.bw-layer-drop-invalid').forEach(function(n){n.classList.remove('bw-layer-drop-before','bw-layer-drop-after','bw-layer-drop-inside','bw-layer-drop-invalid');});dropRow=null;dropZone=null;}
function makeGhost(src,x,y){removeGhost();ghost=document.createElement('div');ghost.className='bw-layer-drag-ghost';ghost.innerHTML='<span>'+String(src.tag||'VIEW')+'</span>'+clean(src.name||src.id||src.text||src.selector||'View');document.body.appendChild(ghost);hint=document.createElement('div');hint.className='bw-layer-drop-hint';hint.textContent='Mover camada';document.body.appendChild(hint);moveGhost(x,y);}
function moveGhost(x,y){if(ghost){ghost.style.left=x+'px';ghost.style.top=y+'px';}if(hint){hint.style.left=x+'px';hint.style.top=y+'px';}}
function removeGhost(){if(ghost)ghost.remove();if(hint)hint.remove();ghost=null;hint=null;}
function autoscroll(y){var box=document.getElementById('bwExtLayersBody');if(!box)return;var r=box.getBoundingClientRect(),pad=44;if(y<r.top+pad)box.scrollTop-=14;else if(y>r.bottom-pad)box.scrollTop+=14;}
function updateDrop(x,y){
  clearDrop();autoscroll(y);var el=document.elementFromPoint(x,y),row=el&&el.closest&&el.closest('.bw-ext-layer-row[data-ext-runtime]');if(!row||!drag)return;var target=item(row.dataset.extRuntime);if(!target)return;var zone=zoneFor(row,target,y),ok=valid(drag.source,target,zone);dropRow=row;dropZone=zone;row.classList.add(ok?'bw-layer-drop-'+zone:'bw-layer-drop-invalid');if(hint)hint.textContent=ok?(zone==='inside'?'Mover para dentro':zone==='before'?'Mover antes':'Mover depois'):'Movimento não permitido';
}
async function finish(x,y,cancel){
  if(!drag)return;var d=drag;drag=null;window.removeEventListener('pointermove',pointerMove,true);window.removeEventListener('pointerup',pointerUp,true);window.removeEventListener('pointercancel',pointerCancel,true);if(d.timer)clearTimeout(d.timer);if(d.sourceRow)d.sourceRow.classList.remove('bw-layer-drag-source');
  var row=dropRow,zone=dropZone,target=row&&item(row.dataset.extRuntime);clearDrop();removeGhost();if(cancel||!d.started||!target||!valid(d.source,target,zone))return;suppressClickUntil=Date.now()+350;
  try{var p=provider(),bwId=null;if(p&&p.stabilize)bwId=await p.stabilize(d.source.node||d.source);await persistMove({id:uid(),op:'move',selector:d.source.selector,targetSelector:target.selector,position:zone,bwId:bwId||d.source.bwId||''});}catch(e){console.error(e);if(typeof toast==='function')toast('Não foi possível mover a camada');}
}
function startNow(x,y){if(!drag||drag.started)return;drag.started=true;if(drag.timer)clearTimeout(drag.timer);drag.sourceRow.classList.add('bw-layer-drag-source');makeGhost(drag.source,x,y);updateDrop(x,y);}
function pointerMove(e){if(!drag||e.pointerId!==drag.pointerId)return;drag.lastX=e.clientX;drag.lastY=e.clientY;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.started){if(drag.touch){if(Math.hypot(dx,dy)>9){finish(e.clientX,e.clientY,true);return;}}else if(Math.hypot(dx,dy)>4)startNow(e.clientX,e.clientY);}if(drag&&drag.started){e.preventDefault();moveGhost(e.clientX,e.clientY);updateDrop(e.clientX,e.clientY);}}
function pointerUp(e){if(!drag||e.pointerId!==drag.pointerId)return;finish(e.clientX,e.clientY,false);}
function pointerCancel(e){if(!drag||e.pointerId!==drag.pointerId)return;finish(e.clientX,e.clientY,true);}
function pointerDown(e){
  if(!active()||drag||e.target.closest('[data-ext-toggle]'))return;var row=e.target.closest('.bw-ext-layer-row[data-ext-runtime]');if(!row)return;if(e.pointerType==='mouse'&&e.button!==0)return;var src=item(row.dataset.extRuntime);if(!src||src.tag==='BODY')return;
  drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,source:src,sourceRow:row,started:false,touch:e.pointerType!=='mouse',timer:null};if(drag.touch)drag.timer=setTimeout(function(){if(drag)startNow(drag.lastX,drag.lastY);},280);window.addEventListener('pointermove',pointerMove,true);window.addEventListener('pointerup',pointerUp,true);window.addEventListener('pointercancel',pointerCancel,true);
}
function decorate(){var head=document.querySelector('#bwExternalLayersPanel .bw-ext-layers header');if(head&&!head.querySelector('.bw-layer-help')){var small=document.createElement('small');small.className='bw-layer-help';small.textContent='Arraste para reorganizar · segure no celular';var first=head.querySelector('div');if(first)first.appendChild(small);}}
function install(){if(installed)return;if(!window.BrotwareExternalHybrid||!window.BrotwareExternalDomProvider){setTimeout(install,120);return;}installed=true;document.addEventListener('pointerdown',pointerDown,true);document.addEventListener('click',function(e){if(Date.now()>suppressClickUntil)return;var row=e.target.closest&&e.target.closest('.bw-ext-layer-row[data-ext-runtime]');if(row){e.preventDefault();e.stopImmediatePropagation();}},true);window.addEventListener('brotware:external-snapshot',function(){setTimeout(decorate,0);});window.addEventListener('brotware:external-open',function(){setTimeout(decorate,100);});setInterval(function(){if(active())decorate();},1200);}
window.BrotwareExternalLayerReorder={persist:persistMove,compile:compileMoves,parse:parseMoves};
setTimeout(install,0);setTimeout(install,700);
})();
