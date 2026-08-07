(function(){
'use strict';

function assert(ok,msg){if(!ok)throw new Error(msg);}
function eq(a,b,msg){assert(a===b,msg+' · esperado '+b+', recebido '+a);}
async function zipRoundTrip(){
  var files={'site/index.html':new TextEncoder().encode('<button>Comprar</button>'),'site/css/style.css':new TextEncoder().encode('button{color:red}'),'site/js/app.js':new TextEncoder().encode('document.body.dataset.ok="1"'),'site/assets/logo.svg':new TextEncoder().encode('<svg></svg>'),'site/brotware.json':new TextEncoder().encode('{"format":"brotware-project","version":5,"mode":"static","entry":"index.html"}')};
  var blob=BrotwareZip.write(files),parsed=await BrotwareZip.read(await blob.arrayBuffer());eq(BrotwareZip.findManifest(parsed.files),'site/brotware.json','Manifest recursivo');eq(BrotwareZip.findIndex(parsed.files),'site/index.html','Index recursivo');eq(new TextDecoder().decode(parsed.files['site/css/style.css']),'button{color:red}','CSS preservado');return true;
}
function vfsPaths(){eq(BrotwareVFS.resolve('pages/index.html','../assets/logo.png'),'assets/logo.png','Resolução ../');eq(BrotwareVFS.resolve('index.html','./css/style.css'),'css/style.css','Resolução ./');eq(BrotwareVFS.relative('pages/index.html','brotware-overrides.css'),'../brotware-overrides.css','Caminho de override');return true;}
async function domDynamic(){
  return new Promise(function(resolve,reject){
    var iframe=document.createElement('iframe');iframe.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px';document.body.appendChild(iframe);
    var html='<!doctype html><body><button id="static">Comprar</button><script>var b=document.createElement("button");b.id="dynamic";b.textContent="Comprar";b.onclick=function(){var m=document.createElement("div");m.id="modal";m.innerHTML="<h1>Pagamento</h1><button>Finalizar</button>";document.body.appendChild(m)};document.body.appendChild(b)<\/script></body>';
    iframe.onload=function(){try{var d=iframe.contentDocument;assert(d.getElementById('static'),'TESTE 1: botão estático');assert(d.getElementById('dynamic'),'TESTE 2: botão criado por JS');var seen=false,obs=new MutationObserver(function(){if(d.getElementById('modal'))seen=true;});obs.observe(d.body,{childList:true,subtree:true,attributes:true});d.getElementById('dynamic').click();setTimeout(function(){try{assert(seen&&d.getElementById('modal'),'TESTE 3: MutationObserver detectou modal após clique');obs.disconnect();iframe.remove();resolve(true);}catch(e){iframe.remove();reject(e);}},40);}catch(e){iframe.remove();reject(e);}};iframe.srcdoc=html;
  });
}
async function run(){var results=[];async function one(name,fn){try{await fn();results.push({name:name,ok:true});}catch(e){results.push({name:name,ok:false,error:e.message});}}await one('VFS paths',vfsPaths);await one('ZIP + manifest + assets',zipRoundTrip);await one('DOM dinâmico + MutationObserver',domDynamic);var failed=results.filter(function(x){return!x.ok;});console.table(results);if(typeof toast==='function')toast(failed.length?failed.length+' teste(s) falharam':'Testes do importador: OK');return{ok:!failed.length,results:results};}
window.BrotwareImportTests={run:run};if(/[?&]bw-tests=1(?:&|$)/.test(location.search))setTimeout(run,1800);
})();
