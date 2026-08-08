(function(){
'use strict';

var installed=false,frame=null,observer=null,lastSource='',busy=false,timer=null;

function external(v){return /^(?:[a-z]+:|\/\/|#|data:|blob:|mailto:|tel:)/i.test(String(v||''));}
function safeScript(v){return String(v||'').replace(/<\/script/gi,'<\\/script');}
function stateInfo(){
  var h=window.BrotwareExternalHybrid&&BrotwareExternalHybrid.getState?BrotwareExternalHybrid.getState():null;
  if(h&&h.active&&h.projectId)return{projectId:h.projectId,entry:h.entry||'index.html'};
  var p=window.BrotwareExternalPreview&&BrotwareExternalPreview.getState?BrotwareExternalPreview.getState():null;
  if(p&&p.projectId)return{projectId:p.projectId,entry:p.entry||'index.html'};
  return null;
}
function resolve(base,ref){return window.BrotwareVFS?BrotwareVFS.resolve(base,ref):null;}
function cleanErrors(){
  var box=document.getElementById('bwExternalErrors');if(!box)return;
  Array.prototype.slice.call(box.children).forEach(function(n){if(/Falha ao carregar SCRIPT:\s*blob:/i.test(n.textContent||'')||/Asset:\s*blob:/i.test(n.textContent||''))n.remove();});
}
function localScripts(files,entry){
  var e=BrotwareVFS.get(files,entry);if(!e)return[];
  var doc=new DOMParser().parseFromString(BrotwareVFS.text(e),'text/html'),out=[];
  Array.prototype.forEach.call(doc.querySelectorAll('script[src]'),function(s){
    var ref=s.getAttribute('src');if(!ref||external(ref))return;
    var p=resolve(entry,ref),f=p&&BrotwareVFS.get(files,p);if(!f)return;
    out.push({path:p,source:BrotwareVFS.text(f)});
  });
  return out;
}
function bootstrapSource(entry,scripts){
  var sources={};scripts.forEach(function(x){sources[x.path]=x.source;});
  return `(function(){
'use strict';
var ENTRY=${JSON.stringify(entry)},SOURCES=${JSON.stringify(sources)};
function norm(p){var a=[];String(p||'').replace(/\\\\/g,'/').replace(/^\\/+/, '').split('/').forEach(function(x){if(!x||x==='.')return;if(x==='..'){if(a.length)a.pop()}else a.push(x)});return a.join('/')}
function dir(p){p=norm(p);var i=p.lastIndexOf('/');return i<0?'':p.slice(0,i)}
function ext(v){return /^(?:[a-z]+:|\\/\\/|#|data:|blob:|mailto:|tel:)/i.test(String(v||''))}
function resolve(ref,base){ref=String(ref||'').trim();if(!ref||ext(ref))return null;var clean=ref.split('#')[0].split('?')[0];return clean.charAt(0)==='/'?norm(clean):norm((dir(base||ENTRY)?dir(base||ENTRY)+'/':'')+clean)}
function hydrate(node){if(!node||node.nodeType!==1||node.tagName!=='SCRIPT')return node;var raw=node.getAttribute('src');if(!raw)return node;var p=resolve(raw,ENTRY);if(!p||!Object.prototype.hasOwnProperty.call(SOURCES,p))return node;node.removeAttribute('src');node.removeAttribute('integrity');node.removeAttribute('crossorigin');node.setAttribute('data-bw-inlined-src',p);node.textContent=String(SOURCES[p]||'')+'\\n//# sourceURL=brotware-vfs:///'+p;return node}
var append=Node.prototype.appendChild,insert=Node.prototype.insertBefore,replace=Node.prototype.replaceChild;
Node.prototype.appendChild=function(n){return append.call(this,hydrate(n))};
Node.prototype.insertBefore=function(n,r){return insert.call(this,hydrate(n),r)};
Node.prototype.replaceChild=function(n,r){return replace.call(this,hydrate(n),r)};
if(Element.prototype.append){var ea=Element.prototype.append;Element.prototype.append=function(){var a=Array.prototype.slice.call(arguments).map(function(n){return n&&n.nodeType===1?hydrate(n):n});return ea.apply(this,a)}}
if(Element.prototype.prepend){var ep=Element.prototype.prepend;Element.prototype.prepend=function(){var a=Array.prototype.slice.call(arguments).map(function(n){return n&&n.nodeType===1?hydrate(n):n});return ep.apply(this,a)}}
})();`;
}
async function patch(){
  if(busy||!frame||!frame.srcdoc)return;
  var info=stateInfo();if(!info||!window.BrotwareVFS)return;
  var source=String(frame.srcdoc||'');if(!source||source===lastSource||/name=["']brotware-script-inline-fix["']/i.test(source))return;
  if(source.indexOf('blob:')<0)return;
  busy=true;
  try{
    var rec=await BrotwareVFS.getProject(info.projectId),files=rec&&rec.files||{},entry=BrotwareVFS.normalizePath(info.entry||'index.html'),scripts=localScripts(files,entry);
    if(!scripts.length)return;
    var doc=new DOMParser().parseFromString(source,'text/html'),targets=Array.prototype.slice.call(doc.querySelectorAll('script[src^="blob:"]'));
    if(!targets.length)return;
    var count=Math.min(targets.length,scripts.length);
    for(var i=0;i<count;i++){
      var old=targets[i],desc=scripts[i],s=doc.createElement('script');
      Array.prototype.forEach.call(old.attributes||[],function(a){if(a.name!=='src'&&a.name!=='integrity'&&a.name!=='crossorigin')s.setAttribute(a.name,a.value);});
      s.setAttribute('data-bw-inlined-src',desc.path);
      s.textContent=safeScript(desc.source+'\n//# sourceURL=brotware-vfs:///'+desc.path);
      old.replaceWith(s);
    }
    var boot=doc.createElement('script');boot.setAttribute('data-brotware-script-bootstrap','1');boot.textContent=safeScript(bootstrapSource(entry,scripts));doc.head.insertBefore(boot,doc.head.firstChild);
    var mark=doc.createElement('meta');mark.setAttribute('name','brotware-script-inline-fix');mark.setAttribute('content',String(count));doc.head.insertBefore(mark,doc.head.firstChild);
    var next='<!doctype html>\n'+doc.documentElement.outerHTML;lastSource=next;frame.srcdoc=next;
    setTimeout(cleanErrors,80);setTimeout(cleanErrors,350);
  }catch(e){console.error('[Brotware Script Fix]',e);}finally{busy=false;}
}
function schedule(){clearTimeout(timer);timer=setTimeout(patch,25);}
function bind(){
  var f=document.getElementById('bwExternalFrame');if(!f){setTimeout(bind,120);return;}
  if(frame===f&&observer)return;frame=f;
  if(observer)observer.disconnect();observer=new MutationObserver(schedule);observer.observe(frame,{attributes:true,attributeFilter:['srcdoc']});
  frame.addEventListener('load',function(){schedule();setTimeout(cleanErrors,120);});schedule();
}
function install(){if(installed)return;installed=true;bind();window.addEventListener('brotware:external-open',function(){lastSource='';setTimeout(bind,0);setTimeout(schedule,80);});window.addEventListener('brotware:external-ready',function(){setTimeout(schedule,0);});setInterval(function(){bind();if(stateInfo())schedule();},500);}
window.BrotwareExternalScriptFix={patch:patch};
setTimeout(install,0);
})();
