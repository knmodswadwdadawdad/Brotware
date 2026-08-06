/* ---------- RUNTIME EXPORT ---------- */
function cleanupExportDom(page){
  var holder=document.createElement('div');holder.innerHTML=page.content||'';
  holder.querySelectorAll('.resize-handle').forEach(function(x){x.remove();});
  holder.querySelectorAll('.vf-node').forEach(function(n){
    n.classList.remove('selected','drop-target');n.removeAttribute('data-bound');
    var cls=n.dataset.userClass;if(cls)n.className+=' '+cls;
  });
  return holder.innerHTML;
}
function runtimeScriptForPage(page){
  var config=JSON.stringify({
    events:page.events||{},
    variables:state.variables,
    functions:state.functions
  });
  return `(function(){
var cfg=${config};
var vars=Object.assign({},cfg.variables||{});
function q(id){return document.querySelector('[data-vf-id="'+id+'"]')}
function t(id){var n=q(id);return n&&(n.querySelector('.vf-content')||n)}
function cv(v){if(v===true||v===false||v==null)return v;var s=String(v);if(s==='true')return true;if(s==='false')return false;if(s==='null')return null;if(s!==''&&!isNaN(Number(s)))return Number(s);return s}
function rv(raw){if(raw==null)return raw;if(typeof raw!=='string')return raw;if(raw[0]==='$')return vars[raw.slice(1)];if(raw.indexOf('@value:')===0){var e=t(raw.slice(7));return e&&'value'in e?e.value:''}if(raw.indexOf('@text:')===0){var z=t(raw.slice(6));return z?z.textContent:''}return cv(raw)}
function cond(p){var l=rv(p.left),r=rv(p.right),o=p.op;if(o==='truthy')return!!l;if(o==='falsy')return!l;if(o==='contains')return String(l).indexOf(String(r))>=0;if(o==='==')return String(l)==String(r);if(o==='!=')return String(l)!=String(r);var ln=Number(l),rn=Number(r);if(!isNaN(ln)&&!isNaN(rn)){l=ln;r=rn}if(o==='>')return l>r;if(o==='<')return l<r;if(o==='>=')return l>=r;if(o==='<=')return l<=r;return false}
async function run(list){for(var i=0;i<(list||[]).length;i++){var b=list[i],p=b.props||{},n,e,a,c;if(b.type==='if')await run(cond(p)?b.children:b.elseChildren);else if(b.type==='repeat'){var count=Math.max(0,Math.min(100,Number(rv(p.count))||0));for(var j=0;j<count;j++){vars.__index=j;await run(b.children)}}else if(b.type==='wait')await new Promise(function(r){setTimeout(r,Math.max(0,Math.min(60000,Number(rv(p.ms))||0))) });else if(b.type==='navigate'){var u=String(rv(p.url)||'');if(u)location.href=u}else if(b.type==='alert')alert(String(rv(p.message)||''));else if(b.type==='setText'){e=t(p.target);if(e)e.textContent=String(rv(p.value)??'')}else if(b.type==='setValue'){e=t(p.target);if(e&&'value'in e)e.value=String(rv(p.value)??'')}else if(b.type==='setStyle'){e=t(p.target);if(e)e.style.setProperty(p.property||'background',String(rv(p.value)||''))}else if(b.type==='show'){n=q(p.target);if(n)n.style.display=''}else if(b.type==='hide'){n=q(p.target);if(n)n.style.display='none'}else if(b.type==='toggle'){n=q(p.target);if(n)n.style.display=getComputedStyle(n).display==='none'?'':'none'}else if(b.type==='setVar')vars[p.name]=rv(p.value);else if(b.type==='math'){a=Number(rv(p.left))||0;c=Number(rv(p.right))||0;if(p.op==='+')vars[p.name]=a+c;else if(p.op==='-')vars[p.name]=a-c;else if(p.op==='*')vars[p.name]=a*c;else if(p.op==='/')vars[p.name]=c===0?0:a/c;else if(p.op==='%')vars[p.name]=c===0?0:a%c}else if(b.type==='readInput'){e=t(p.source);vars[p.name]=e&&'value'in e?e.value:''}else if(b.type==='storageSet')localStorage.setItem(p.key,String(rv(p.value)??''));else if(b.type==='storageGet')vars[p.name]=localStorage.getItem(p.key);else if(b.type==='storageRemove')localStorage.removeItem(p.key);else if(b.type==='fetch'){try{var o={method:p.method||'GET',headers:{}};if(p.headers){try{o.headers=JSON.parse(p.headers)}catch(_){}}if(p.method!=='GET'&&p.method!=='HEAD'&&p.body)o.body=String(rv(p.body));var res=await fetch(String(rv(p.url)||''),o);vars[p.saveVar]=p.responseType==='text'?await res.text():await res.json()}catch(err){vars[p.saveVar]=null;console.error(err)}}else if(b.type==='callFunction'){var f=(cfg.functions||[]).find(function(x){return x.id===p.functionId});if(f)await run(f.blocks)}else if(b.type==='console')console.log(rv(p.message))}}
Object.keys(cfg.events||{}).forEach(function(id){
  if(id==='@page')return;
  var n=q(id);if(!n)return;
  Object.keys(cfg.events[id]||{}).forEach(function(ev){n.addEventListener(ev,function(){run(cfg.events[id][ev])})});
});
document.querySelectorAll('[data-href]').forEach(function(n){
  if(!n.dataset.href)return;
  var ev=cfg.events[n.dataset.vfId]&&cfg.events[n.dataset.vfId].click;
  if(!ev||!ev.length)n.addEventListener('click',function(){location.href=n.dataset.href});
});
window.addEventListener('load',function(){var x=cfg.events['@page']&&cfg.events['@page'].load;if(x)run(x)});
window.addEventListener('beforeunload',function(){var x=cfg.events['@page']&&cfg.events['@page'].beforeunload;if(x)run(x)});
})();`;
}
function compilePage(page){
  var content=cleanupExportDom(page);
  var css='*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{background:'+cssSafe(page.background||'#fff')+'}#app{position:relative;width:100%;min-height:100vh;overflow:hidden;background:'+cssSafe(page.background||'#fff')+'}.vf-node{position:absolute}.node-text{width:100%;height:100%;display:flex;align-items:center;padding:4px 6px}.node-button,.node-input,.node-textarea,.node-select,.node-image,.node-link,.node-checkbox,.node-progress,.node-divider,.node-layout,.node-card{width:100%;height:100%}.node-button{border:0;border-radius:7px;background:#6567f4;color:#fff;font-weight:700}.node-input,.node-textarea,.node-select{border:1px solid #aeb9c4;border-radius:7px;padding:7px 9px}.node-image{display:grid;place-items:center;background:#dbe5ed}.node-image img{width:100%;height:100%;object-fit:cover}.node-link{display:flex;align-items:center;color:#126ec5;text-decoration:underline}.node-checkbox{display:flex;align-items:center;gap:7px}.node-progress{display:flex;align-items:center}.node-progress span{height:9px;width:100%;border-radius:99px;background:#d7dee4;overflow:hidden}.node-progress i{display:block;width:60%;height:100%;background:#6567f4}.node-divider{display:flex;align-items:center}.node-divider:before{content:"";width:100%;height:1px;background:#bdc7cf}.node-layout{border:2px dashed #72a5cc;background:rgba(114,165,204,.12)}.node-layout-label{display:none}.node-card{border:1px solid #dce3e8;border-radius:13px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.10)}';
  return '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>'+esc(page.title)+'</title>\n<style>'+css+'</style>\n</head>\n<body>\n<div id="app">'+content+'</div>\n<script>'+runtimeScriptForPage(page)+'<\/script>\n</body>\n</html>';
}
function exportCurrent(){saveCurrentPage();var p=currentPage();downloadText(p.name,compilePage(p),'text/html;charset=utf-8');toast(p.name+' exportado');}
function exportAll(){
  saveCurrentPage();
  state.pages.forEach(function(p,i){setTimeout(function(){downloadText(p.name,compilePage(p),'text/html;charset=utf-8');},i*260);});
  toast('Baixando '+state.pages.length+' páginas');
}
function preview(){
  saveCurrentPage();var h=compilePage(currentPage()),w=window.open('','_blank');
  if(!w){toast('Popup bloqueado');return;}w.document.open();w.document.write(h);w.document.close();
}
function showCode(){
  saveCurrentPage();$('#generatedCode').value=compilePage(currentPage());$('#codeFileName').textContent=currentPage().name;openModal('codeModal');
}
function showLogicCode(){
  $('#generatedCode').value=JSON.stringify(activeBlocks(),null,2);
  $('#codeFileName').textContent=state.logicMode==='function'?'Lógica da função':'Blocos do evento';
  openModal('codeModal');
}

/* ---------- HTML IMPORT ---------- */
function inferType(node){
  var tag=node.tagName.toLowerCase();
  if(tag==='button')return'button';if(tag==='input')return'input';if(tag==='textarea')return'textarea';if(tag==='img')return'image';
  if(tag==='a')return'link';if(tag==='select')return'select';if(/^h[1-6]$/.test(tag)||['p','span','label'].indexOf(tag)>=0)return'text';
  return'relative';
}
function importHtml(text,name){
  saveCurrentPage();
  var p=newPage(uniquePageName(name||'importado.html'),String(name||'Importado').replace(/\.html?$/i,''));
  state.pages.push(p);state.currentPageId=p.id;
  root.innerHTML='<div class="grid-layer" id="gridLayer"></div>';
  try{
    var d=new DOMParser().parseFromString(text,'text/html'),children=Array.prototype.slice.call(d.body.children);
    children.forEach(function(n,i){
      var type=inferType(n),el=createNode(type,20+(i%3)*30,20+Math.floor(i/3)*55,root,true);
      setText(el,n.textContent.trim()||getText(el));
      var c=contentTarget(el);if(n.getAttribute('style'))c.setAttribute('style',n.getAttribute('style'));
      if(n.id){el.dataset.vfId=n.id;state.selectedId=n.id;}
      if(n.getAttribute('href'))el.dataset.href=n.getAttribute('href');
    });
    p.content=serializeEditor();p.background=d.body.style.background||'#fff';p.events={'@page':{load:[]}};
    state.histories[p.id]=[p.content];state.historyIndex[p.id]=0;loadPage(p.id,true);toast('HTML importado');
  }catch(e){console.error(e);toast('Erro ao importar HTML');}
}

/* ---------- EVENT / LOGIC HELPERS ---------- */
function eventBlocks(page,node,event){
  ensurePageSchema(page);
  if(!page.events[node])page.events[node]={};
  if(!page.events[node][event])page.events[node][event]=[];
  return page.events[node][event];
}

/* ---------- TABS / UI ---------- */
function switchTab(name){
  $$('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===name);});
  $$('.tab-screen').forEach(function(s){s.classList.remove('active');});
  $('#screen-'+name).classList.add('active');
  if(name==='event'){refreshEventNodeSelect();renderVariables();renderFunctions();renderLogic();}
  if(name==='component')renderComponents();
  if(name==='strings')renderStrings();
}
function setDevice(device){
  $('#phone').classList.remove('mobile','tablet','desktop');
  if(device!=='mobile')$('#phone').classList.add(device);
  $$('[data-device]').forEach(function(b){b.classList.toggle('active',b.dataset.device===device);});
}
function setZoom(z){
  state.zoom=Math.max(.5,Math.min(1.5,z));
  $('#phoneShell').style.transform='scale('+state.zoom+')';
  $('#zoomLabel').textContent=Math.round(state.zoom*100)+'%';
}
function deleteSelected(commitIt){
  var el=selectedNode();if(!el)return;
  var id=el.dataset.vfId;el.remove();state.selectedId=null;
  state.pages.forEach(function(p){if(p.events)delete p.events[id];});
  selectNode(null);if(commitIt!==false)commit();else commit();toast('Widget excluído');
}
function duplicateSelected(){
  var el=selectedNode();if(!el)return;
  var c=el.cloneNode(true);
  c.querySelectorAll('.resize-handle').forEach(function(h){h.remove();});c.insertAdjacentHTML('beforeend',handles());c.dataset.vfId=nodeId(c.dataset.type);
  c.style.left=(parseFloat(el.style.left||0)+16)+'px';c.style.top=(parseFloat(el.style.top||0)+16)+'px';c.removeAttribute('data-bound');
  bindNode(c);el.parentNode.appendChild(c);selectNode(c.dataset.vfId);commit();
}
