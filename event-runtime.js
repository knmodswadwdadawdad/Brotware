/* Runtime extension for Sketchware-style page lifecycle events. */
(function(){
'use strict';

runtimeScriptForPage=function(page){
  var config=JSON.stringify({events:page.events||{},variables:state.variables,functions:state.functions});
  return `(function(){
var cfg=${config};
var vars=Object.assign({},cfg.variables||{});
function q(id){return document.querySelector('[data-vf-id="'+id+'"]')}
function t(id){var n=q(id);return n&&(n.querySelector('.vf-content')||n)}
function cv(v){if(v===true||v===false||v==null)return v;var s=String(v);if(s==='true')return true;if(s==='false')return false;if(s==='null')return null;if(s!==''&&!isNaN(Number(s)))return Number(s);return s}
function rv(raw){if(raw==null)return raw;if(typeof raw!=='string')return raw;if(raw[0]==='$')return vars[raw.slice(1)];if(raw.indexOf('@value:')===0){var e=t(raw.slice(7));return e&&'value'in e?e.value:''}if(raw.indexOf('@text:')===0){var z=t(raw.slice(6));return z?z.textContent:''}return cv(raw)}
function cond(p){var l=rv(p.left),r=rv(p.right),o=p.op;if(o==='truthy')return!!l;if(o==='falsy')return!l;if(o==='contains')return String(l).indexOf(String(r))>=0;if(o==='==')return String(l)==String(r);if(o==='!=')return String(l)!=String(r);var ln=Number(l),rn=Number(r);if(!isNaN(ln)&&!isNaN(rn)){l=ln;r=rn}if(o==='>')return l>r;if(o==='<')return l<r;if(o==='>=')return l>=r;if(o==='<=')return l<=r;return false}
async function run(list){for(var i=0;i<(list||[]).length;i++){var b=list[i],p=b.props||{},n,e,a,c;if(b.type==='if')await run(cond(p)?b.children:b.elseChildren);else if(b.type==='repeat'){var count=Math.max(0,Math.min(100,Number(rv(p.count))||0));for(var j=0;j<count;j++){vars.__index=j;await run(b.children)}}else if(b.type==='wait')await new Promise(function(r){setTimeout(r,Math.max(0,Math.min(60000,Number(rv(p.ms))||0))) });else if(b.type==='navigate'){var u=String(rv(p.url)||'');if(u)location.href=u}else if(b.type==='alert')alert(String(rv(p.message)||''));else if(b.type==='setText'){e=t(p.target);if(e)e.textContent=String(rv(p.value)??'')}else if(b.type==='setValue'){e=t(p.target);if(e&&'value'in e)e.value=String(rv(p.value)??'')}else if(b.type==='setStyle'){e=t(p.target);if(e)e.style.setProperty(p.property||'background',String(rv(p.value)||''))}else if(b.type==='show'){n=q(p.target);if(n)n.style.display=''}else if(b.type==='hide'){n=q(p.target);if(n)n.style.display='none'}else if(b.type==='toggle'){n=q(p.target);if(n)n.style.display=getComputedStyle(n).display==='none'?'':'none'}else if(b.type==='setVar')vars[p.name]=rv(p.value);else if(b.type==='math'){a=Number(rv(p.left))||0;c=Number(rv(p.right))||0;if(p.op==='+')vars[p.name]=a+c;else if(p.op==='-')vars[p.name]=a-c;else if(p.op==='*')vars[p.name]=a*c;else if(p.op==='/')vars[p.name]=c===0?0:a/c;else if(p.op==='%')vars[p.name]=c===0?0:a%c}else if(b.type==='readInput'){e=t(p.source);vars[p.name]=e&&'value'in e?e.value:''}else if(b.type==='storageSet')localStorage.setItem(p.key,String(rv(p.value)??''));else if(b.type==='storageGet')vars[p.name]=localStorage.getItem(p.key);else if(b.type==='storageRemove')localStorage.removeItem(p.key);else if(b.type==='fetch'){try{var o={method:p.method||'GET',headers:{}};if(p.headers){try{o.headers=JSON.parse(p.headers)}catch(_){}}if(p.method!=='GET'&&p.method!=='HEAD'&&p.body)o.body=String(rv(p.body));var res=await fetch(String(rv(p.url)||''),o);vars[p.saveVar]=p.responseType==='text'?await res.text():await res.json()}catch(err){vars[p.saveVar]=null;console.error(err)}}else if(b.type==='callFunction'){var f=(cfg.functions||[]).find(function(x){return x.id===p.functionId});if(f)await run(f.blocks)}else if(b.type==='console')console.log(rv(p.message))}}
function pageRun(key){var x=cfg.events['@page']&&cfg.events['@page'][key];if(x&&x.length)run(x)}
Object.keys(cfg.events||{}).forEach(function(id){
  if(id==='@page')return;
  var n=q(id);if(!n)return;
  Object.keys(cfg.events[id]||{}).forEach(function(ev){n.addEventListener(ev,function(){run(cfg.events[id][ev])})});
});
document.querySelectorAll('[data-href]').forEach(function(n){var ev=cfg.events[n.dataset.vfId]&&cfg.events[n.dataset.vfId].click;if(n.dataset.href&&(!ev||!ev.length))n.addEventListener('click',function(){location.href=n.dataset.href})});
/* Activity lifecycle mapped to browser lifecycle. */
window.addEventListener('load',function(){pageRun('load');pageRun('imports');pageRun('initializeLogic');setTimeout(function(){pageRun('postcreate')},0)});
window.addEventListener('pageshow',function(){pageRun('start');pageRun('resume');pageRun('restoreInstanceState')});
window.addEventListener('pagehide',function(){pageRun('pause');pageRun('stop');pageRun('saveInstanceState')});
window.addEventListener('beforeunload',function(){pageRun('beforeunload');pageRun('destroy')});
window.addEventListener('popstate',function(){pageRun('back')});
window.addEventListener('hashchange',function(){pageRun('newIntent')});
window.addEventListener('message',function(){pageRun('activityResult');pageRun('message')});
window.addEventListener('online',function(){pageRun('online')});
window.addEventListener('offline',function(){pageRun('offline')});
window.addEventListener('resize',function(){pageRun('resize')});
window.addEventListener('focus',function(){pageRun('windowFocusChanged')});
window.addEventListener('blur',function(){pageRun('windowFocusChanged')});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')pageRun('resume');else pageRun('pause')});
document.addEventListener('brotware:draweropen',function(){pageRun('drawerOpen')});
document.addEventListener('brotware:drawerclose',function(){pageRun('drawerClose')});
})();`;
};
})();
