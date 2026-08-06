/* ---------- VARIABLES / STRINGS / COMPONENTS ---------- */
function coerce(v){
  if(v===true||v===false||v==null)return v;
  var s=String(v);
  if(s==='true')return true;if(s==='false')return false;if(s==='null')return null;
  if(s!==''&&!isNaN(Number(s)))return Number(s);
  return s;
}
function renderVariables(){
  var b=$('#variablesList');b.innerHTML='';
  Object.keys(state.variables).forEach(function(k){
    var r=document.createElement('div');r.className='mini-row';
    r.innerHTML='<b>'+esc(k)+'</b><span>'+esc(state.variables[k])+'</span><button data-del-var="'+esc(k)+'">×</button>';
    b.appendChild(r);
  });
  $$('[data-del-var]').forEach(function(btn){btn.onclick=function(){delete state.variables[this.dataset.delVar];renderVariables();autoSave();renderLogic();};});
}
function addVariable(){
  var k=prompt('Nome da variável:','variavel');if(!k)return;
  k=k.trim().replace(/\s+/g,'_');if(!k)return;
  var v=prompt('Valor inicial:','0');
  state.variables[k]=coerce(v==null?'':v);renderVariables();autoSave();renderLogic();
}
function renderStrings(){
  var b=$('#stringsList');b.innerHTML='';
  Object.keys(state.strings).forEach(function(k){
    var r=document.createElement('div');r.className='string-row';
    r.innerHTML='<input data-string-key="'+esc(k)+'" value="'+esc(k)+'"><input data-string-value="'+esc(k)+'" value="'+esc(state.strings[k])+'"><button data-del-string="'+esc(k)+'">×</button>';
    b.appendChild(r);
  });
  $$('[data-string-key]').forEach(function(i){i.onchange=function(){
    var old=this.dataset.stringKey,n=this.value.trim().replace(/\s+/g,'_');
    if(!n||n===old)return;if(state.strings[n]!=null){toast('Chave já existe');this.value=old;return;}
    state.strings[n]=state.strings[old];delete state.strings[old];
    state.pages.forEach(function(p){p.content=p.content.replace(new RegExp('data-string-key="'+old+'"','g'),'data-string-key="'+n+'"');});
    renderStrings();refreshStringOptions();autoSave();
  };});
  $$('[data-string-value]').forEach(function(i){i.onchange=function(){
    state.strings[this.dataset.stringValue]=this.value;refreshStringsOnDom();saveCurrentPage();autoSave();
  };});
  $$('[data-del-string]').forEach(function(bn){bn.onclick=function(){delete state.strings[this.dataset.delString];renderStrings();refreshStringOptions();autoSave();};});
}
function addString(){
  var k=prompt('Chave:','novo_texto');if(!k)return;k=k.trim().replace(/\s+/g,'_');
  if(!k||state.strings[k]!=null){toast('Chave inválida ou existente');return;}
  state.strings[k]=prompt('Texto:','Novo texto')||'';renderStrings();refreshStringOptions();autoSave();
}
function refreshStringOptions(){
  var html='<option value="">Nenhuma</option>';
  Object.keys(state.strings).forEach(function(k){html+='<option value="'+esc(k)+'">@string/'+esc(k)+'</option>';});
  $('#propStringKey').innerHTML=html;
}
var builtinComponents = {
  hero:function(){
    var p=createNode('relative',20,20,root,true);p.style.width='350px';p.style.height='280px';
    var t=createNode('text',24,36,p,true);t.style.width='300px';t.style.height='58px';setText(t,'Seu título principal');contentTarget(t).style.fontSize='28px';contentTarget(t).style.fontWeight='800';
    var q=createNode('text',24,105,p,true);q.style.width='300px';q.style.height='55px';setText(q,'Uma descrição clara para apresentar sua página.');
    var b=createNode('button',24,185,p,true);setText(b,'Começar');selectNode(p.dataset.vfId);commit();
  },
  navbar:function(){
    var n=createNode('relative',20,20,root,true);n.style.width='350px';n.style.height='64px';contentTarget(n).style.background='#111827';
    var l=createNode('text',18,14,n,true);l.style.width='120px';setText(l,'LOGO');contentTarget(l).style.color='#fff';contentTarget(l).style.fontWeight='800';
    var a=createNode('link',230,14,n,true);setText(a,'Entrar');contentTarget(a).style.color='#fff';selectNode(n.dataset.vfId);commit();
  },
  card:function(){
    var c=createNode('card',20,20,root,true);c.style.width='300px';c.style.height='190px';
    var t=createNode('text',20,24,c,true);t.style.width='250px';setText(t,'Título do card');contentTarget(t).style.fontWeight='800';
    var p=createNode('text',20,70,c,true);p.style.width='250px';p.style.height='55px';setText(p,'Conteúdo do seu card.');selectNode(c.dataset.vfId);commit();
  },
  login:function(){
    var c=createNode('card',20,20,root,true);c.style.width='320px';c.style.height='300px';
    var t=createNode('text',25,25,c,true);t.style.width='260px';setText(t,'Entrar');contentTarget(t).style.fontSize='24px';contentTarget(t).style.fontWeight='800';
    var email=createNode('input',25,85,c,true);contentTarget(email).placeholder='Email';
    var pass=createNode('input',25,145,c,true);contentTarget(pass).placeholder='Senha';
    var b=createNode('button',25,215,c,true);b.style.width='170px';setText(b,'Entrar');selectNode(c.dataset.vfId);commit();
  },
  modal:function(){
    var c=createNode('card',20,20,root,true);c.style.width='320px';c.style.height='210px';
    var t=createNode('text',25,25,c,true);t.style.width='260px';setText(t,'Confirmação');contentTarget(t).style.fontWeight='800';
    var p=createNode('text',25,75,c,true);p.style.width='260px';setText(p,'Deseja continuar?');
    var b=createNode('button',25,135,c,true);setText(b,'Confirmar');selectNode(c.dataset.vfId);commit();
  },
  footer:function(){
    var c=createNode('relative',20,20,root,true);c.style.width='350px';c.style.height='100px';contentTarget(c).style.background='#111827';
    var t=createNode('text',20,32,c,true);t.style.width='300px';setText(t,'© Brotware');contentTarget(t).style.color='#fff';selectNode(c.dataset.vfId);commit();
  },
  pricing:function(){
    var c=createNode('card',20,20,root,true);c.style.width='270px';c.style.height='260px';
    var t=createNode('text',25,24,c,true);setText(t,'Plano Pro');contentTarget(t).style.fontWeight='800';
    var p=createNode('text',25,70,c,true);p.style.width='190px';setText(p,'R$ 29/mês');contentTarget(p).style.fontSize='25px';contentTarget(p).style.fontWeight='800';
    var b=createNode('button',25,180,c,true);b.style.width='170px';setText(b,'Assinar');selectNode(c.dataset.vfId);commit();
  },
  profile:function(){
    var c=createNode('card',20,20,root,true);c.style.width='300px';c.style.height='190px';
    var im=createNode('image',20,25,c,true);im.style.width='70px';im.style.height='70px';
    var n=createNode('text',110,30,c,true);n.style.width='160px';setText(n,'Usuário');contentTarget(n).style.fontWeight='800';
    var p=createNode('text',110,70,c,true);p.style.width='160px';setText(p,'@usuario');selectNode(c.dataset.vfId);commit();
  }
};
function saveSelectedComponent(){
  var el=selectedNode();if(!el){toast('Selecione um widget');return;}
  var name=prompt('Nome do componente:',el.dataset.vfId);if(!name)return;
  var c=el.cloneNode(true);c.querySelectorAll('.resize-handle').forEach(function(h){h.remove();});c.classList.remove('selected');c.removeAttribute('data-bound');
  state.components.push({id:uid('component'),name:name,html:c.outerHTML});renderComponents();autoSave();toast('Componente salvo');
}
function renderComponents(){
  var b=$('#customComponentsList');b.innerHTML='';
  if(!state.components.length){b.innerHTML='<div class="empty-state">Nenhum componente personalizado.</div>';return;}
  state.components.forEach(function(c){
    var r=document.createElement('div');r.className='user-component';
    r.innerHTML='<span>'+esc(c.name)+'</span><button data-insert-component="'+c.id+'">＋</button><button data-delete-component="'+c.id+'">×</button>';
    b.appendChild(r);
  });
  $$('[data-insert-component]').forEach(function(bn){bn.onclick=function(){insertCustomComponent(this.dataset.insertComponent);};});
  $$('[data-delete-component]').forEach(function(bn){bn.onclick=function(){var id=this.dataset.deleteComponent;state.components=state.components.filter(function(c){return c.id!==id;});renderComponents();autoSave();};});
}
function remapIds(el){
  [el].concat(Array.prototype.slice.call(el.querySelectorAll('.vf-node'))).forEach(function(n){if(n.dataset.vfId)n.dataset.vfId=nodeId(n.dataset.type);});
}
function insertCustomComponent(id){
  var c=state.components.find(function(x){return x.id===id;});if(!c)return;
  var b=document.createElement('div');b.innerHTML=c.html;var el=b.firstElementChild;el.style.left='20px';el.style.top='20px';remapIds(el);
  root.appendChild(el);bindAllNodes();selectNode(el.dataset.vfId);commit();switchTab('view');
}
