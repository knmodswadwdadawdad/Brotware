/* ---------- BLOCK EDITOR ---------- */
function targetOptions(selected){
  var html='<option value="">Selecione</option>';
  allNodeIds().forEach(function(id){html+='<option '+(id===selected?'selected':'')+' value="'+esc(id)+'">'+esc(id)+'</option>';});
  return html;
}
function variableOptions(selected){
  var html='<option value="">Selecione</option>';
  Object.keys(state.variables).forEach(function(k){html+='<option '+(k===selected?'selected':'')+' value="'+esc(k)+'">'+esc(k)+'</option>';});
  return html;
}
function functionOptions(selected){
  var html='<option value="">Selecione</option>';
  state.functions.forEach(function(f){html+='<option '+(f.id===selected?'selected':'')+' value="'+f.id+'">'+esc(f.name)+'</option>';});
  return html;
}
function field(label,id,value,span,type){
  return '<label class="field '+(span?'span-2':'')+'"><span>'+label+'</span><input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value||'')+'"></label>';
}
function selectField(label,id,html,span){
  return '<label class="field '+(span?'span-2':'')+'"><span>'+label+'</span><select id="'+id+'">'+html+'</select></label>';
}
function helpBox(){
  return '<div class="block-help">Valores aceitam referências: <div class="value-help"><code>$variavel</code><code>@value:input1</code><code>@text:textview1</code><code>true</code><code>123</code></div></div>';
}
function openBlockEditor(id){
  var f=findBlock(id);if(!f)return;
  state.editingBlockId=id;
  var b=f.block,p=b.props||{},meta=BLOCK_META[b.type]||{name:b.type};
  $('#blockModalTitle').textContent=meta.name;
  $('#blockModalSubtitle').textContent='Configurar bloco';
  var h=helpBox()+'<div class="block-config-grid">';
  if(b.type==='if'){
    h+=field('Valor esquerdo','bf_left',p.left,true)+selectField('Operador','bf_op',
      ['==','!=','>','<','>=','<=','contains','truthy','falsy'].map(function(x){return'<option '+(x===p.op?'selected':'')+' value="'+x+'">'+x+'</option>';}).join(''))+
      field('Valor direito','bf_right',p.right);
  }else if(b.type==='repeat')h+=field('Quantidade','bf_count',p.count,true);
  else if(b.type==='wait')h+=field('Milissegundos','bf_ms',p.ms,true,'number');
  else if(b.type==='navigate')h+=field('Página ou URL','bf_url',p.url,true);
  else if(b.type==='alert')h+=field('Mensagem','bf_message',p.message,true);
  else if(b.type==='setText'||b.type==='setValue'){
    h+=selectField('Elemento','bf_target',targetOptions(p.target),true)+field('Valor','bf_value',p.value,true);
  }else if(b.type==='setStyle'){
    h+=selectField('Elemento','bf_target',targetOptions(p.target),true)+field('Propriedade CSS','bf_property',p.property)+field('Valor','bf_value',p.value);
  }else if(['show','hide','toggle'].indexOf(b.type)>=0)h+=selectField('Elemento','bf_target',targetOptions(p.target),true);
  else if(b.type==='setVar'){
    h+=selectField('Variável','bf_name',variableOptions(p.name),true)+field('Valor','bf_value',p.value,true);
  }else if(b.type==='math'){
    h+=selectField('Salvar em','bf_name',variableOptions(p.name),true)+field('Valor A','bf_left',p.left)+
      selectField('Operação','bf_op',['+','-','*','/','%'].map(function(x){return'<option '+(x===p.op?'selected':'')+'>'+x+'</option>';}).join(''))+
      field('Valor B','bf_right',p.right);
  }else if(b.type==='readInput'){
    h+=selectField('Input origem','bf_source',targetOptions(p.source),true)+selectField('Salvar na variável','bf_name',variableOptions(p.name),true);
  }else if(b.type==='storageSet'){
    h+=field('Chave','bf_key',p.key)+field('Valor','bf_value',p.value);
  }else if(b.type==='storageGet'){
    h+=field('Chave','bf_key',p.key)+selectField('Salvar na variável','bf_name',variableOptions(p.name));
  }else if(b.type==='storageRemove')h+=field('Chave','bf_key',p.key,true);
  else if(b.type==='fetch'){
    h+=selectField('Método','bf_method','<option '+(p.method==='GET'?'selected':'')+'>GET</option><option '+(p.method==='POST'?'selected':'')+'>POST</option><option '+(p.method==='PUT'?'selected':'')+'>PUT</option><option '+(p.method==='DELETE'?'selected':'')+'>DELETE</option>')+
      selectField('Resposta','bf_responseType','<option '+(p.responseType==='json'?'selected':'')+' value="json">JSON</option><option '+(p.responseType==='text'?'selected':'')+' value="text">Text</option>')+
      field('URL','bf_url',p.url,true)+field('Headers JSON','bf_headers',p.headers,true)+field('Body','bf_body',p.body,true)+selectField('Salvar resposta em','bf_saveVar',variableOptions(p.saveVar),true);
  }else if(b.type==='callFunction')h+=selectField('Função','bf_functionId',functionOptions(p.functionId),true);
  else if(b.type==='console')h+=field('Mensagem / valor','bf_message',p.message,true);
  h+='</div>';
  $('#blockEditorFields').innerHTML=h;
  openModal('blockModal');
}
function valueOf(id){var el=$('#'+id);return el?el.value:'';}
function saveBlockEditor(){
  var f=findBlock(state.editingBlockId);if(!f)return;
  var b=f.block,p=b.props;
  if(b.type==='if'){p.left=valueOf('bf_left');p.op=valueOf('bf_op');p.right=valueOf('bf_right');}
  else if(b.type==='repeat')p.count=valueOf('bf_count');
  else if(b.type==='wait')p.ms=valueOf('bf_ms');
  else if(b.type==='navigate')p.url=valueOf('bf_url');
  else if(b.type==='alert')p.message=valueOf('bf_message');
  else if(b.type==='setText'||b.type==='setValue'){p.target=valueOf('bf_target');p.value=valueOf('bf_value');}
  else if(b.type==='setStyle'){p.target=valueOf('bf_target');p.property=valueOf('bf_property');p.value=valueOf('bf_value');}
  else if(['show','hide','toggle'].indexOf(b.type)>=0)p.target=valueOf('bf_target');
  else if(b.type==='setVar'){p.name=valueOf('bf_name');p.value=valueOf('bf_value');}
  else if(b.type==='math'){p.name=valueOf('bf_name');p.left=valueOf('bf_left');p.op=valueOf('bf_op');p.right=valueOf('bf_right');}
  else if(b.type==='readInput'){p.source=valueOf('bf_source');p.name=valueOf('bf_name');}
  else if(b.type==='storageSet'){p.key=valueOf('bf_key');p.value=valueOf('bf_value');}
  else if(b.type==='storageGet'){p.key=valueOf('bf_key');p.name=valueOf('bf_name');}
  else if(b.type==='storageRemove')p.key=valueOf('bf_key');
  else if(b.type==='fetch'){p.method=valueOf('bf_method');p.responseType=valueOf('bf_responseType');p.url=valueOf('bf_url');p.headers=valueOf('bf_headers');p.body=valueOf('bf_body');p.saveVar=valueOf('bf_saveVar');}
  else if(b.type==='callFunction')p.functionId=valueOf('bf_functionId');
  else if(b.type==='console')p.message=valueOf('bf_message');
  closeModal('blockModal');saveLogic();renderLogic();
}
function deleteEditingBlock(){
  if(!state.editingBlockId)return;
  removeBlock(state.editingBlockId);state.editingBlockId=null;closeModal('blockModal');saveLogic();renderLogic();
}

/* ---------- FUNCTIONS ---------- */
function renderFunctions(){
  var box=$('#functionsList');box.innerHTML='';
  if(!state.functions.length){box.innerHTML='<div class="empty-state">Nenhuma função criada.</div>';return;}
  state.functions.forEach(function(f){
    var r=document.createElement('div');r.className='mini-row';
    r.innerHTML='<b>'+esc(f.name)+'</b><span>'+f.blocks.length+' blocos</span><button data-edit-fn="'+f.id+'">✎</button><button data-del-fn="'+f.id+'">×</button>';
    box.appendChild(r);
  });
  $$('[data-edit-fn]').forEach(function(b){b.onclick=function(){state.activeFunctionId=this.dataset.editFn;setLogicMode('function');};});
  $$('[data-del-fn]').forEach(function(b){b.onclick=function(){
    var id=this.dataset.delFn;if(!confirm('Excluir função?'))return;
    state.functions=state.functions.filter(function(f){return f.id!==id;});
    if(state.activeFunctionId===id)state.activeFunctionId=state.functions.length?state.functions[0].id:null;
    renderFunctions();autoSave();renderLogic();
  };});
}
function addFunction(){
  var n=prompt('Nome da função:','minhaFuncao');if(!n)return;
  n=n.trim().replace(/\s+/g,'_');if(!n)return;
  var f={id:uid('fn'),name:n,blocks:[]};state.functions.push(f);state.activeFunctionId=f.id;renderFunctions();autoSave();setLogicMode('function');
}

/* ---------- VALUE / INTERPRETER ---------- */
function resolveValue(raw,ctx){
  if(raw===undefined||raw===null)return raw;
  if(typeof raw!=='string')return raw;
  if(raw.indexOf('$')===0)return ctx.vars[raw.slice(1)];
  if(raw.indexOf('@value:')===0){
    var n=ctx.root.querySelector('[data-vf-id="'+raw.slice(7)+'"]');var t=n?(n.querySelector('.vf-content')||n):null;
    return t&&('value' in t)?t.value:'';
  }
  if(raw.indexOf('@text:')===0){
    var n2=ctx.root.querySelector('[data-vf-id="'+raw.slice(6)+'"]');var t2=n2?(n2.querySelector('.vf-content')||n2):null;
    return t2?t2.textContent:'';
  }
  return coerce(raw);
}
function checkCondition(p,ctx){
  var l=resolveValue(p.left,ctx),r=resolveValue(p.right,ctx),op=p.op;
  if(op==='truthy')return!!l;if(op==='falsy')return!l;if(op==='contains')return String(l).indexOf(String(r))>=0;
  if(op==='==')return String(l)==String(r);if(op==='!=')return String(l)!=String(r);
  var ln=Number(l),rn=Number(r);if(!isNaN(ln)&&!isNaN(rn)){l=ln;r=rn;}
  if(op==='>')return l>r;if(op==='<')return l<r;if(op==='>=')return l>=r;if(op==='<=')return l<=r;
  return false;
}
function nodeInCtx(id,ctx){return id?ctx.root.querySelector('[data-vf-id="'+id+'"]'):null;}
function targetInCtx(id,ctx){var n=nodeInCtx(id,ctx);return n?(n.querySelector('.vf-content')||n):null;}
async function executeBlocks(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i],p=b.props||{},n,t,a,c;
    if(b.type==='if'){
      await executeBlocks(checkCondition(p,ctx)?b.children:b.elseChildren,ctx);
    }else if(b.type==='repeat'){
      var count=Math.max(0,Math.min(100,Number(resolveValue(p.count,ctx))||0));
      for(var j=0;j<count;j++){ctx.vars.__index=j;await executeBlocks(b.children,ctx);}
    }else if(b.type==='wait'){
      await new Promise(function(res){setTimeout(res,Math.max(0,Math.min(60000,Number(resolveValue(p.ms,ctx))||0)));});
    }else if(b.type==='navigate'){
      var url=String(resolveValue(p.url,ctx)||'');if(ctx.preview)toast('Navegação: '+url);else if(url)location.href=url;
    }else if(b.type==='alert'){
      alert(String(resolveValue(p.message,ctx)||''));
    }else if(b.type==='setText'){
      t=targetInCtx(p.target,ctx);if(t)t.textContent=String(resolveValue(p.value,ctx)??'');
    }else if(b.type==='setValue'){
      t=targetInCtx(p.target,ctx);if(t&&'value'in t)t.value=String(resolveValue(p.value,ctx)??'');
    }else if(b.type==='setStyle'){
      t=targetInCtx(p.target,ctx);if(t)t.style.setProperty(p.property||'background',String(resolveValue(p.value,ctx)||''));
    }else if(b.type==='show'){
      n=nodeInCtx(p.target,ctx);if(n)n.style.display='';
    }else if(b.type==='hide'){
      n=nodeInCtx(p.target,ctx);if(n)n.style.display='none';
    }else if(b.type==='toggle'){
      n=nodeInCtx(p.target,ctx);if(n)n.style.display=getComputedStyle(n).display==='none'?'':'none';
    }else if(b.type==='setVar'){
      ctx.vars[p.name]=resolveValue(p.value,ctx);
    }else if(b.type==='math'){
      a=Number(resolveValue(p.left,ctx))||0;c=Number(resolveValue(p.right,ctx))||0;
      if(p.op==='+')ctx.vars[p.name]=a+c;else if(p.op==='-')ctx.vars[p.name]=a-c;else if(p.op==='*')ctx.vars[p.name]=a*c;
      else if(p.op==='/')ctx.vars[p.name]=c===0?0:a/c;else if(p.op==='%')ctx.vars[p.name]=c===0?0:a%c;
    }else if(b.type==='readInput'){
      t=targetInCtx(p.source,ctx);ctx.vars[p.name]=t&&('value'in t)?t.value:'';
    }else if(b.type==='storageSet'){
      localStorage.setItem(p.key,String(resolveValue(p.value,ctx)??''));
    }else if(b.type==='storageGet'){
      ctx.vars[p.name]=localStorage.getItem(p.key);
    }else if(b.type==='storageRemove'){
      localStorage.removeItem(p.key);
    }else if(b.type==='fetch'){
      try{
        var opts={method:p.method||'GET',headers:{}};
        if(p.headers){try{opts.headers=JSON.parse(p.headers);}catch(e){}}
        if(p.method!=='GET'&&p.method!=='HEAD'&&p.body)opts.body=String(resolveValue(p.body,ctx));
        var response=await fetch(String(resolveValue(p.url,ctx)||''),opts);
        var data=p.responseType==='text'?await response.text():await response.json();
        if(p.saveVar)ctx.vars[p.saveVar]=data;
      }catch(err){ctx.vars[p.saveVar]=null;console.error(err);}
    }else if(b.type==='callFunction'){
      var fn=state.functions.find(function(f){return f.id===p.functionId;});
      if(fn)await executeBlocks(fn.blocks,ctx);
    }else if(b.type==='console'){
      console.log(resolveValue(p.message,ctx));
    }
  }
}
async function testCurrentLogic(){
  var ctx={root:root,vars:Object.assign({},state.variables),preview:true};
  try{await executeBlocks(activeBlocks(),ctx);toast('Lógica executada');}catch(e){console.error(e);toast('Erro: '+e.message);}
}
