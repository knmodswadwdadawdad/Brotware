(function(){
'use strict';

/*
 * Brotware Standard Blocks Pack
 * -----------------------------
 * Sketchware-inspired statement blocks implemented with browser JavaScript.
 * This pack is additive: it preserves the current project schema/runtime and
 * extends newBlock, summaries, editor forms, interpreter, export runtime and
 * the Sketchware-style palette.
 */

var DEFS={
  changeVar:{cat:'var',name:'change variable by',icon:'±',desc:'Somar/subtrair um valor da variável'},
  toggleVar:{cat:'var',name:'toggle boolean',icon:'◐',desc:'Inverter true/false de uma variável'},

  listInsert:{cat:'list',name:'insert item at',icon:'↧',desc:'Inserir item em uma posição da lista'},
  listSet:{cat:'list',name:'set item at',icon:'✎',desc:'Alterar item pelo índice'},
  listContains:{cat:'list',name:'list contains',icon:'?',desc:'Salvar true se a lista contém o valor'},
  listIndexOf:{cat:'list',name:'index of item',icon:'⌕',desc:'Salvar o índice de um item'},
  listJoin:{cat:'list',name:'list to text',icon:'≡',desc:'Juntar os itens da lista em texto'},
  listShuffle:{cat:'list',name:'shuffle list',icon:'⇆',desc:'Embaralhar os itens da lista'},

  randomNumber:{cat:'math',name:'random number',icon:'🎲',desc:'Gerar inteiro aleatório entre mínimo e máximo'},
  roundNumber:{cat:'math',name:'round number',icon:'≈',desc:'Arredondar, floor ou ceil e salvar'},
  absNumber:{cat:'math',name:'absolute value',icon:'|x|',desc:'Salvar o valor absoluto'},
  powerNumber:{cat:'math',name:'power',icon:'x²',desc:'Elevar um número a uma potência'},
  sqrtNumber:{cat:'math',name:'square root',icon:'√',desc:'Calcular raiz quadrada'},

  logicNot:{cat:'operator',name:'not',icon:'!',desc:'Inverter um valor booleano e salvar'},
  logicAnd:{cat:'operator',name:'and',icon:'&&',desc:'Operação lógica AND e salvar'},
  logicOr:{cat:'operator',name:'or',icon:'||',desc:'Operação lógica OR e salvar'},

  textJoin:{cat:'strings',name:'join text',icon:'＋',desc:'Concatenar dois valores em texto'},
  textLength:{cat:'strings',name:'text length',icon:'#',desc:'Salvar quantidade de caracteres'},
  textReplace:{cat:'strings',name:'replace text',icon:'↺',desc:'Substituir trechos de um texto'},
  textUpper:{cat:'strings',name:'UPPERCASE',icon:'A',desc:'Converter texto para maiúsculas'},
  textLower:{cat:'strings',name:'lowercase',icon:'a',desc:'Converter texto para minúsculas'},
  textTrim:{cat:'strings',name:'trim text',icon:'↔',desc:'Remover espaços do início e do fim'},
  textSubstring:{cat:'strings',name:'substring',icon:'✂',desc:'Recortar parte de um texto'},

  setAttribute:{cat:'view',name:'set attribute',icon:'@',desc:'Definir atributo HTML de uma View'},
  removeAttribute:{cat:'view',name:'remove attribute',icon:'@×',desc:'Remover atributo HTML de uma View'},
  addClass:{cat:'view',name:'add class',icon:'＋.',desc:'Adicionar classe CSS'},
  removeClass:{cat:'view',name:'remove class',icon:'−.',desc:'Remover classe CSS'},
  enableView:{cat:'view',name:'enable view',icon:'✓',desc:'Habilitar interação com a View'},
  disableView:{cat:'view',name:'disable view',icon:'⊘',desc:'Desabilitar interação com a View'},
  focusView:{cat:'view',name:'focus view',icon:'⌖',desc:'Dar foco a um input ou elemento'},
  scrollToView:{cat:'view',name:'scroll to view',icon:'⇣',desc:'Rolar suavemente até a View'},

  copyClipboard:{cat:'more',name:'copy to clipboard',icon:'⧉',desc:'Copiar texto para a área de transferência'},
  vibrate:{cat:'more',name:'vibrate',icon:'〰',desc:'Vibrar dispositivo quando suportado'},
  timestamp:{cat:'more',name:'current timestamp',icon:'◷',desc:'Salvar Date.now() em uma variável'},
  reloadPage:{cat:'more',name:'reload page',icon:'↻',desc:'Recarregar a página atual'}
};

function isStandard(type){return Object.prototype.hasOwnProperty.call(DEFS,type);}
function def(type){return DEFS[type]||null;}
function firstVar(){try{return firstVariableName();}catch(_){return'counter';}}
function target(){try{return firstNodeId();}catch(_){return'';}}

Object.keys(DEFS).forEach(function(type){
  var d=DEFS[type];
  if(window.BLOCK_META)BLOCK_META[type]={name:d.name,icon:d.icon,cls:d.cat==='view'?'ui':d.cat==='math'||d.cat==='var'||d.cat==='operator'?'data':d.cat};
});

var baseNewBlock=window.newBlock;
window.newBlock=function(type){
  var b=baseNewBlock(type),v=firstVar(),t=target();
  if(!isStandard(type))return b;
  if(type==='changeVar')b.props={name:v,delta:'1'};
  else if(type==='toggleVar')b.props={name:v};
  else if(type==='listInsert')b.props={name:v,index:'0',value:'item'};
  else if(type==='listSet')b.props={name:v,index:'0',value:'item'};
  else if(type==='listContains')b.props={name:v,value:'item',saveVar:v};
  else if(type==='listIndexOf')b.props={name:v,value:'item',saveVar:v};
  else if(type==='listJoin')b.props={name:v,separator:', ',saveVar:v};
  else if(type==='listShuffle')b.props={name:v};
  else if(type==='randomNumber')b.props={min:'0',max:'100',saveVar:v};
  else if(type==='roundNumber')b.props={value:'0',mode:'round',saveVar:v};
  else if(type==='absNumber'||type==='sqrtNumber')b.props={value:'0',saveVar:v};
  else if(type==='powerNumber')b.props={base:'2',exponent:'2',saveVar:v};
  else if(type==='logicNot')b.props={value:'true',saveVar:v};
  else if(type==='logicAnd'||type==='logicOr')b.props={left:'true',right:'false',saveVar:v};
  else if(type==='textJoin')b.props={left:'Olá ',right:'mundo',saveVar:v};
  else if(type==='textLength'||type==='textUpper'||type==='textLower'||type==='textTrim')b.props={value:'texto',saveVar:v};
  else if(type==='textReplace')b.props={value:'Olá mundo',search:'mundo',replacement:'Brotware',saveVar:v};
  else if(type==='textSubstring')b.props={value:'Brotware',start:'0',end:'4',saveVar:v};
  else if(type==='setAttribute')b.props={target:t,name:'title',value:'Brotware'};
  else if(type==='removeAttribute')b.props={target:t,name:'title'};
  else if(type==='addClass'||type==='removeClass')b.props={target:t,className:'active'};
  else if(type==='enableView'||type==='disableView'||type==='focusView'||type==='scrollToView')b.props={target:t};
  else if(type==='copyClipboard')b.props={value:'texto'};
  else if(type==='vibrate')b.props={ms:'200'};
  else if(type==='timestamp')b.props={saveVar:v};
  else if(type==='reloadPage')b.props={};
  b.__swCategory=DEFS[type].cat;
  return b;
};

var baseSummary=window.blockSummary;
window.blockSummary=function(block){
  if(!block||!isStandard(block.type))return baseSummary(block);
  var p=block.props||{},type=block.type;
  if(type==='changeVar')return p.name+' += '+p.delta;
  if(type==='toggleVar')return p.name+' = !'+p.name;
  if(type==='listInsert')return p.name+' insert ['+p.index+'] '+p.value;
  if(type==='listSet')return p.name+'['+p.index+'] = '+p.value;
  if(type==='listContains')return p.saveVar+' ← '+p.name+' contains '+p.value;
  if(type==='listIndexOf')return p.saveVar+' ← indexOf '+p.value;
  if(type==='listJoin')return p.saveVar+' ← '+p.name+'.join('+p.separator+')';
  if(type==='listShuffle')return 'shuffle '+p.name;
  if(type==='randomNumber')return p.saveVar+' ← random '+p.min+'..'+p.max;
  if(type==='roundNumber')return p.saveVar+' ← '+p.mode+'('+p.value+')';
  if(type==='absNumber')return p.saveVar+' ← abs('+p.value+')';
  if(type==='powerNumber')return p.saveVar+' ← '+p.base+' ^ '+p.exponent;
  if(type==='sqrtNumber')return p.saveVar+' ← sqrt('+p.value+')';
  if(type==='logicNot')return p.saveVar+' ← !'+p.value;
  if(type==='logicAnd')return p.saveVar+' ← '+p.left+' && '+p.right;
  if(type==='logicOr')return p.saveVar+' ← '+p.left+' || '+p.right;
  if(type==='textJoin')return p.saveVar+' ← '+p.left+' + '+p.right;
  if(type==='textLength')return p.saveVar+' ← length('+p.value+')';
  if(type==='textReplace')return p.saveVar+' ← replace(...)';
  if(type==='textUpper')return p.saveVar+' ← upper('+p.value+')';
  if(type==='textLower')return p.saveVar+' ← lower('+p.value+')';
  if(type==='textTrim')return p.saveVar+' ← trim('+p.value+')';
  if(type==='textSubstring')return p.saveVar+' ← substring('+p.start+', '+p.end+')';
  if(type==='setAttribute')return p.target+' ['+p.name+'] = '+p.value;
  if(type==='removeAttribute')return p.target+' remove ['+p.name+']';
  if(type==='addClass')return p.target+' + .'+p.className;
  if(type==='removeClass')return p.target+' - .'+p.className;
  if(type==='enableView'||type==='disableView'||type==='focusView'||type==='scrollToView')return p.target;
  if(type==='copyClipboard')return p.value;
  if(type==='vibrate')return p.ms+' ms';
  if(type==='timestamp')return p.saveVar+' ← Date.now()';
  if(type==='reloadPage')return 'location.reload()';
  return '';
};

function varField(label,id,value,span){return selectField(label,id,variableOptions(value),span);}
function targetField(label,id,value,span){return selectField(label,id,targetOptions(value),span);}

var baseOpenBlockEditor=window.openBlockEditor;
window.openBlockEditor=function(id){
  var found=findBlock(id);if(!found||!isStandard(found.block.type))return baseOpenBlockEditor(id);
  state.editingBlockId=id;
  var b=found.block,p=b.props||{},type=b.type,d=def(type);
  $('#blockModalTitle').textContent=d.name;
  $('#blockModalSubtitle').textContent='Bloco padrão estilo Sketchware';
  var h=helpBox()+'<div class="block-config-grid">';
  if(type==='changeVar')h+=varField('Variável','bf_std_name',p.name,true)+field('Alterar por','bf_std_delta',p.delta,true);
  else if(type==='toggleVar')h+=varField('Variável booleana','bf_std_name',p.name,true);
  else if(type==='listInsert'||type==='listSet')h+=varField('Lista','bf_std_name',p.name,true)+field('Índice','bf_std_index',p.index)+field('Valor','bf_std_value',p.value);
  else if(type==='listContains'||type==='listIndexOf')h+=varField('Lista','bf_std_name',p.name,true)+field('Valor','bf_std_value',p.value)+varField('Salvar em','bf_std_save',p.saveVar);
  else if(type==='listJoin')h+=varField('Lista','bf_std_name',p.name,true)+field('Separador','bf_std_separator',p.separator)+varField('Salvar texto em','bf_std_save',p.saveVar);
  else if(type==='listShuffle')h+=varField('Lista','bf_std_name',p.name,true);
  else if(type==='randomNumber')h+=field('Mínimo','bf_std_min',p.min)+field('Máximo','bf_std_max',p.max)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='roundNumber')h+=field('Valor','bf_std_value',p.value)+selectField('Modo','bf_std_mode',['round','floor','ceil'].map(function(x){return'<option '+(x===p.mode?'selected':'')+' value="'+x+'">'+x+'</option>';}).join(''))+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='absNumber'||type==='sqrtNumber')h+=field('Valor','bf_std_value',p.value,true)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='powerNumber')h+=field('Base','bf_std_base',p.base)+field('Expoente','bf_std_exponent',p.exponent)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='logicNot')h+=field('Valor','bf_std_value',p.value,true)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='logicAnd'||type==='logicOr')h+=field('Valor A','bf_std_left',p.left)+field('Valor B','bf_std_right',p.right)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='textJoin')h+=field('Texto A','bf_std_left',p.left)+field('Texto B','bf_std_right',p.right)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='textLength'||type==='textUpper'||type==='textLower'||type==='textTrim')h+=field('Texto / valor','bf_std_value',p.value,true)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='textReplace')h+=field('Texto','bf_std_value',p.value,true)+field('Procurar','bf_std_search',p.search)+field('Substituir por','bf_std_replacement',p.replacement)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='textSubstring')h+=field('Texto','bf_std_value',p.value,true)+field('Início','bf_std_start',p.start)+field('Fim','bf_std_end',p.end)+varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='setAttribute')h+=targetField('View','bf_std_target',p.target,true)+field('Atributo','bf_std_attr',p.name)+field('Valor','bf_std_value',p.value);
  else if(type==='removeAttribute')h+=targetField('View','bf_std_target',p.target,true)+field('Atributo','bf_std_attr',p.name,true);
  else if(type==='addClass'||type==='removeClass')h+=targetField('View','bf_std_target',p.target,true)+field('Classe CSS','bf_std_class',p.className,true);
  else if(type==='enableView'||type==='disableView'||type==='focusView'||type==='scrollToView')h+=targetField('View','bf_std_target',p.target,true);
  else if(type==='copyClipboard')h+=field('Texto / valor','bf_std_value',p.value,true);
  else if(type==='vibrate')h+=field('Milissegundos','bf_std_ms',p.ms,true,'number');
  else if(type==='timestamp')h+=varField('Salvar em','bf_std_save',p.saveVar,true);
  else if(type==='reloadPage')h+='<div class="block-help span-2">Recarrega a página quando o projeto exportado estiver rodando.</div>';
  h+='</div>';
  $('#blockEditorFields').innerHTML=h;openModal('blockModal');
};

var baseSaveBlockEditor=window.saveBlockEditor;
window.saveBlockEditor=function(){
  var found=findBlock(state.editingBlockId);if(!found||!isStandard(found.block.type))return baseSaveBlockEditor();
  var b=found.block,p=b.props,type=b.type;
  if(type==='changeVar'){p.name=valueOf('bf_std_name');p.delta=valueOf('bf_std_delta');}
  else if(type==='toggleVar')p.name=valueOf('bf_std_name');
  else if(type==='listInsert'||type==='listSet'){p.name=valueOf('bf_std_name');p.index=valueOf('bf_std_index');p.value=valueOf('bf_std_value');}
  else if(type==='listContains'||type==='listIndexOf'){p.name=valueOf('bf_std_name');p.value=valueOf('bf_std_value');p.saveVar=valueOf('bf_std_save');}
  else if(type==='listJoin'){p.name=valueOf('bf_std_name');p.separator=valueOf('bf_std_separator');p.saveVar=valueOf('bf_std_save');}
  else if(type==='listShuffle')p.name=valueOf('bf_std_name');
  else if(type==='randomNumber'){p.min=valueOf('bf_std_min');p.max=valueOf('bf_std_max');p.saveVar=valueOf('bf_std_save');}
  else if(type==='roundNumber'){p.value=valueOf('bf_std_value');p.mode=valueOf('bf_std_mode');p.saveVar=valueOf('bf_std_save');}
  else if(type==='absNumber'||type==='sqrtNumber'){p.value=valueOf('bf_std_value');p.saveVar=valueOf('bf_std_save');}
  else if(type==='powerNumber'){p.base=valueOf('bf_std_base');p.exponent=valueOf('bf_std_exponent');p.saveVar=valueOf('bf_std_save');}
  else if(type==='logicNot'){p.value=valueOf('bf_std_value');p.saveVar=valueOf('bf_std_save');}
  else if(type==='logicAnd'||type==='logicOr'){p.left=valueOf('bf_std_left');p.right=valueOf('bf_std_right');p.saveVar=valueOf('bf_std_save');}
  else if(type==='textJoin'){p.left=valueOf('bf_std_left');p.right=valueOf('bf_std_right');p.saveVar=valueOf('bf_std_save');}
  else if(type==='textLength'||type==='textUpper'||type==='textLower'||type==='textTrim'){p.value=valueOf('bf_std_value');p.saveVar=valueOf('bf_std_save');}
  else if(type==='textReplace'){p.value=valueOf('bf_std_value');p.search=valueOf('bf_std_search');p.replacement=valueOf('bf_std_replacement');p.saveVar=valueOf('bf_std_save');}
  else if(type==='textSubstring'){p.value=valueOf('bf_std_value');p.start=valueOf('bf_std_start');p.end=valueOf('bf_std_end');p.saveVar=valueOf('bf_std_save');}
  else if(type==='setAttribute'){p.target=valueOf('bf_std_target');p.name=valueOf('bf_std_attr');p.value=valueOf('bf_std_value');}
  else if(type==='removeAttribute'){p.target=valueOf('bf_std_target');p.name=valueOf('bf_std_attr');}
  else if(type==='addClass'||type==='removeClass'){p.target=valueOf('bf_std_target');p.className=valueOf('bf_std_class');}
  else if(type==='enableView'||type==='disableView'||type==='focusView'||type==='scrollToView')p.target=valueOf('bf_std_target');
  else if(type==='copyClipboard')p.value=valueOf('bf_std_value');
  else if(type==='vibrate')p.ms=valueOf('bf_std_ms');
  else if(type==='timestamp')p.saveVar=valueOf('bf_std_save');
  closeModal('blockModal');saveLogic();renderLogic();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();
};

function listOf(ctx,name){var x=ctx.vars[name];if(!Array.isArray(x)){x=[];ctx.vars[name]=x;}return x;}
function bool(v){if(v===true||v===false)return v;if(typeof v==='string'){var s=v.toLowerCase();if(s==='true')return true;if(s==='false'||s===''||s==='0'||s==='null'||s==='undefined')return false;}return!!v;}

async function executeStandard(b,ctx){
  if(!b||!isStandard(b.type))return false;
  var p=b.props||{},type=b.type,l,i,a,c,t,n,v,min,max,tmp,j;
  if(type==='changeVar')ctx.vars[p.name]=(Number(ctx.vars[p.name])||0)+(Number(resolveValue(p.delta,ctx))||0);
  else if(type==='toggleVar')ctx.vars[p.name]=!bool(ctx.vars[p.name]);
  else if(type==='listInsert'){l=listOf(ctx,p.name);i=Math.max(0,Math.min(l.length,Number(resolveValue(p.index,ctx))||0));l.splice(i,0,resolveValue(p.value,ctx));}
  else if(type==='listSet'){l=listOf(ctx,p.name);i=Number(resolveValue(p.index,ctx))||0;if(i>=0)l[i]=resolveValue(p.value,ctx);}
  else if(type==='listContains'){l=listOf(ctx,p.name);v=resolveValue(p.value,ctx);ctx.vars[p.saveVar]=l.indexOf(v)>=0;}
  else if(type==='listIndexOf'){l=listOf(ctx,p.name);ctx.vars[p.saveVar]=l.indexOf(resolveValue(p.value,ctx));}
  else if(type==='listJoin'){l=listOf(ctx,p.name);ctx.vars[p.saveVar]=l.join(String(resolveValue(p.separator,ctx)??''));}
  else if(type==='listShuffle'){l=listOf(ctx,p.name);for(i=l.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));tmp=l[i];l[i]=l[j];l[j]=tmp;}}
  else if(type==='randomNumber'){min=Math.ceil(Number(resolveValue(p.min,ctx))||0);max=Math.floor(Number(resolveValue(p.max,ctx))||0);if(max<min){tmp=min;min=max;max=tmp;}ctx.vars[p.saveVar]=Math.floor(Math.random()*(max-min+1))+min;}
  else if(type==='roundNumber'){a=Number(resolveValue(p.value,ctx))||0;ctx.vars[p.saveVar]=p.mode==='floor'?Math.floor(a):p.mode==='ceil'?Math.ceil(a):Math.round(a);}
  else if(type==='absNumber')ctx.vars[p.saveVar]=Math.abs(Number(resolveValue(p.value,ctx))||0);
  else if(type==='powerNumber')ctx.vars[p.saveVar]=Math.pow(Number(resolveValue(p.base,ctx))||0,Number(resolveValue(p.exponent,ctx))||0);
  else if(type==='sqrtNumber')ctx.vars[p.saveVar]=Math.sqrt(Math.max(0,Number(resolveValue(p.value,ctx))||0));
  else if(type==='logicNot')ctx.vars[p.saveVar]=!bool(resolveValue(p.value,ctx));
  else if(type==='logicAnd')ctx.vars[p.saveVar]=bool(resolveValue(p.left,ctx))&&bool(resolveValue(p.right,ctx));
  else if(type==='logicOr')ctx.vars[p.saveVar]=bool(resolveValue(p.left,ctx))||bool(resolveValue(p.right,ctx));
  else if(type==='textJoin')ctx.vars[p.saveVar]=String(resolveValue(p.left,ctx)??'')+String(resolveValue(p.right,ctx)??'');
  else if(type==='textLength')ctx.vars[p.saveVar]=String(resolveValue(p.value,ctx)??'').length;
  else if(type==='textReplace'){a=String(resolveValue(p.value,ctx)??'');c=String(resolveValue(p.search,ctx)??'');ctx.vars[p.saveVar]=c?a.split(c).join(String(resolveValue(p.replacement,ctx)??'')):a;}
  else if(type==='textUpper')ctx.vars[p.saveVar]=String(resolveValue(p.value,ctx)??'').toUpperCase();
  else if(type==='textLower')ctx.vars[p.saveVar]=String(resolveValue(p.value,ctx)??'').toLowerCase();
  else if(type==='textTrim')ctx.vars[p.saveVar]=String(resolveValue(p.value,ctx)??'').trim();
  else if(type==='textSubstring'){a=String(resolveValue(p.value,ctx)??'');i=Math.max(0,Number(resolveValue(p.start,ctx))||0);j=p.end===''?a.length:Number(resolveValue(p.end,ctx));if(isNaN(j))j=a.length;ctx.vars[p.saveVar]=a.substring(i,Math.max(i,j));}
  else if(type==='setAttribute'){t=targetInCtx(p.target,ctx);if(t)t.setAttribute(p.name||'',String(resolveValue(p.value,ctx)??''));}
  else if(type==='removeAttribute'){t=targetInCtx(p.target,ctx);if(t)t.removeAttribute(p.name||'');}
  else if(type==='addClass'){n=nodeInCtx(p.target,ctx);if(n&&p.className)n.classList.add(p.className);}
  else if(type==='removeClass'){n=nodeInCtx(p.target,ctx);if(n&&p.className)n.classList.remove(p.className);}
  else if(type==='enableView'){t=targetInCtx(p.target,ctx);n=nodeInCtx(p.target,ctx);if(t&&'disabled'in t)t.disabled=false;if(n){n.removeAttribute('aria-disabled');n.style.pointerEvents='';}}
  else if(type==='disableView'){t=targetInCtx(p.target,ctx);n=nodeInCtx(p.target,ctx);if(t&&'disabled'in t)t.disabled=true;if(n){n.setAttribute('aria-disabled','true');n.style.pointerEvents='none';}}
  else if(type==='focusView'){t=targetInCtx(p.target,ctx);if(t&&t.focus)t.focus();}
  else if(type==='scrollToView'){n=nodeInCtx(p.target,ctx);if(n&&n.scrollIntoView)n.scrollIntoView({behavior:'smooth',block:'center'});}
  else if(type==='copyClipboard'){a=String(resolveValue(p.value,ctx)??'');try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(a);}catch(_){}}
  else if(type==='vibrate'){if(navigator.vibrate)navigator.vibrate(Math.max(0,Math.min(10000,Number(resolveValue(p.ms,ctx))||0)));}
  else if(type==='timestamp')ctx.vars[p.saveVar]=Date.now();
  else if(type==='reloadPage'){if(ctx.preview){if(typeof toast==='function')toast('Reload page');}else location.reload();}
  return true;
}

var baseExecuteBlocks=window.executeBlocks;
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i];
    if(!(await executeStandard(b,ctx)))await baseExecuteBlocks([b],ctx);
  }
};

/* Extend exported-page runtime. The insertion point is before HTTP request. */
var baseRuntimeScript=window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=baseRuntimeScript(page),needle="else if(b.type==='fetch'){";
  var ext="else if(b.type==='changeVar')vars[p.name]=(Number(vars[p.name])||0)+(Number(rv(p.delta))||0)"+
  ";else if(b.type==='toggleVar')vars[p.name]=!Boolean(rv('$'+p.name))"+
  ";else if(b.type==='listInsert'){var bli=vars[p.name];if(!Array.isArray(bli)){bli=[];vars[p.name]=bli}var bix=Math.max(0,Math.min(bli.length,Number(rv(p.index))||0));bli.splice(bix,0,rv(p.value))}"+
  ";else if(b.type==='listSet'){var bls=vars[p.name];if(!Array.isArray(bls)){bls=[];vars[p.name]=bls}var bsx=Number(rv(p.index))||0;if(bsx>=0)bls[bsx]=rv(p.value)}"+
  ";else if(b.type==='listContains'){var blc=vars[p.name];if(!Array.isArray(blc)){blc=[];vars[p.name]=blc}vars[p.saveVar]=blc.indexOf(rv(p.value))>=0}"+
  ";else if(b.type==='listIndexOf'){var blio=vars[p.name];if(!Array.isArray(blio)){blio=[];vars[p.name]=blio}vars[p.saveVar]=blio.indexOf(rv(p.value))}"+
  ";else if(b.type==='listJoin'){var blj=vars[p.name];if(!Array.isArray(blj)){blj=[];vars[p.name]=blj}vars[p.saveVar]=blj.join(String(rv(p.separator)??''))}"+
  ";else if(b.type==='listShuffle'){var blsh=vars[p.name];if(!Array.isArray(blsh)){blsh=[];vars[p.name]=blsh}for(var bsi=blsh.length-1;bsi>0;bsi--){var bsj=Math.floor(Math.random()*(bsi+1)),bst=blsh[bsi];blsh[bsi]=blsh[bsj];blsh[bsj]=bst}}"+
  ";else if(b.type==='randomNumber'){var brmin=Math.ceil(Number(rv(p.min))||0),brmax=Math.floor(Number(rv(p.max))||0);if(brmax<brmin){var brt=brmin;brmin=brmax;brmax=brt}vars[p.saveVar]=Math.floor(Math.random()*(brmax-brmin+1))+brmin}"+
  ";else if(b.type==='roundNumber'){var brv=Number(rv(p.value))||0;vars[p.saveVar]=p.mode==='floor'?Math.floor(brv):p.mode==='ceil'?Math.ceil(brv):Math.round(brv)}"+
  ";else if(b.type==='absNumber')vars[p.saveVar]=Math.abs(Number(rv(p.value))||0)"+
  ";else if(b.type==='powerNumber')vars[p.saveVar]=Math.pow(Number(rv(p.base))||0,Number(rv(p.exponent))||0)"+
  ";else if(b.type==='sqrtNumber')vars[p.saveVar]=Math.sqrt(Math.max(0,Number(rv(p.value))||0))"+
  ";else if(b.type==='logicNot')vars[p.saveVar]=!Boolean(rv(p.value))"+
  ";else if(b.type==='logicAnd')vars[p.saveVar]=Boolean(rv(p.left))&&Boolean(rv(p.right))"+
  ";else if(b.type==='logicOr')vars[p.saveVar]=Boolean(rv(p.left))||Boolean(rv(p.right))"+
  ";else if(b.type==='textJoin')vars[p.saveVar]=String(rv(p.left)??'')+String(rv(p.right)??'')"+
  ";else if(b.type==='textLength')vars[p.saveVar]=String(rv(p.value)??'').length"+
  ";else if(b.type==='textReplace'){var btv=String(rv(p.value)??''),bts=String(rv(p.search)??'');vars[p.saveVar]=bts?btv.split(bts).join(String(rv(p.replacement)??'')):btv}"+
  ";else if(b.type==='textUpper')vars[p.saveVar]=String(rv(p.value)??'').toUpperCase()"+
  ";else if(b.type==='textLower')vars[p.saveVar]=String(rv(p.value)??'').toLowerCase()"+
  ";else if(b.type==='textTrim')vars[p.saveVar]=String(rv(p.value)??'').trim()"+
  ";else if(b.type==='textSubstring'){var bsv=String(rv(p.value)??''),bss=Math.max(0,Number(rv(p.start))||0),bse=p.end===''?bsv.length:Number(rv(p.end));if(isNaN(bse))bse=bsv.length;vars[p.saveVar]=bsv.substring(bss,Math.max(bss,bse))}"+
  ";else if(b.type==='setAttribute'){e=t(p.target);if(e)e.setAttribute(p.name||'',String(rv(p.value)??''))}"+
  ";else if(b.type==='removeAttribute'){e=t(p.target);if(e)e.removeAttribute(p.name||'')}"+
  ";else if(b.type==='addClass'){n=q(p.target);if(n&&p.className)n.classList.add(p.className)}"+
  ";else if(b.type==='removeClass'){n=q(p.target);if(n&&p.className)n.classList.remove(p.className)}"+
  ";else if(b.type==='enableView'){e=t(p.target);n=q(p.target);if(e&&'disabled'in e)e.disabled=false;if(n){n.removeAttribute('aria-disabled');n.style.pointerEvents=''}}"+
  ";else if(b.type==='disableView'){e=t(p.target);n=q(p.target);if(e&&'disabled'in e)e.disabled=true;if(n){n.setAttribute('aria-disabled','true');n.style.pointerEvents='none'}}"+
  ";else if(b.type==='focusView'){e=t(p.target);if(e&&e.focus)e.focus()}"+
  ";else if(b.type==='scrollToView'){n=q(p.target);if(n&&n.scrollIntoView)n.scrollIntoView({behavior:'smooth',block:'center'})}"+
  ";else if(b.type==='copyClipboard'){var bcp=String(rv(p.value)??'');try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(bcp)}catch(_){}}"+
  ";else if(b.type==='vibrate'){if(navigator.vibrate)navigator.vibrate(Math.max(0,Math.min(10000,Number(rv(p.ms))||0)))}"+
  ";else if(b.type==='timestamp')vars[p.saveVar]=Date.now()"+
  ";else if(b.type==='reloadPage')location.reload();";
  return code.indexOf(needle)>=0?code.replace(needle,ext+needle):code;
};

/* -------- Sketchware-style palette integration -------- */
var overlay=null,cats=null,scroll=null,flow=null,observer=null,queued=false;
var lastTarget={slot:'root',index:0};
var suppressUntil=0,dragSession=null,dragGhost=null,hot=null;

function itemsFor(cat){
  return Object.keys(DEFS).filter(function(type){return DEFS[type].cat===cat;});
}
function activeCat(){var a=cats&&cats.querySelector('.sw-cat.active');return a?a.dataset.swCat:'';}
function paletteMarkup(type){var d=DEFS[type];return '<button type="button" class="sw-palette-item sw-standard-item" data-sw-standard-type="'+type+'" style="--item-color:'+categoryColor(d.cat)+'"><span class="ico">'+d.icon+'</span><span><b>'+d.name+'</b><small>'+d.desc+'</small></span></button>';}
function categoryColor(cat){var m={var:'#ee7d16',list:'#cc5b22',control:'#e1a92a',operator:'#5cb722',math:'#23b9a9',file:'#a1887f',view:'#4a6cd4',component:'#2ca5e2',strings:'#7c83db',more:'#8a55d7'};return m[cat]||'#7c83db';}
function decoratePalette(){
  if(!scroll||!cats)return;var cat=activeCat(),items=itemsFor(cat);if(!cat||!items.length)return;
  var old=scroll.querySelector('.sw-standard-pack');if(old&&old.dataset.cat===cat)return;if(old)old.remove();
  var wrap=document.createElement('div');wrap.className='sw-standard-pack';wrap.dataset.cat=cat;
  wrap.innerHTML='<div class="sw-standard-pack-title">Standard</div>'+items.map(paletteMarkup).join('');
  scroll.appendChild(wrap);
}
function queueDecorate(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;decoratePalette();});}
function rememberTarget(e){
  var z=e.target&&e.target.closest?e.target.closest('.sw-insert'):null;
  if(z)lastTarget={slot:z.dataset.swSlot||'root',index:Number(z.dataset.swIndex)||0};
  var toggle=e.target&&e.target.closest?e.target.closest('#swPaletteToggle'):null;
  if(toggle)lastTarget={slot:'root',index:activeBlocks().length};
}
function addBlock(type){
  var b=newBlock(type),slot=lastTarget.slot||'root',index=Number(lastTarget.index);
  if(isNaN(index))index=activeBlocks().length;
  insertBlock(b,slot,index);saveLogic();if(window.BrotwareBlockGraph)BrotwareBlockGraph.refresh();if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();
}
function ensureDragGhost(){if(dragGhost)return dragGhost;dragGhost=document.createElement('div');dragGhost.className='sw-standard-drag-ghost';dragGhost.style.cssText='position:fixed;z-index:2147483001;pointer-events:none;display:none;padding:10px 14px;border-radius:10px;background:#202735;color:#fff;font:700 12px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.35)';document.body.appendChild(dragGhost);return dragGhost;}
function clearHot(){if(hot){hot.classList.remove('hot');hot=null;}}
function moveDrag(x,y){if(!dragSession)return;var g=ensureDragGhost();g.style.left=(x+14)+'px';g.style.top=(y+14)+'px';clearHot();var eng=window.BrotwareConnectionEngine,target=eng&&eng.update(dragSession,x,y);if(target&&target.element){hot=target.element;hot.classList.add('hot');}}
function finishDrag(cancelled){
  if(!dragSession)return;var s=dragSession;dragSession=null;window.removeEventListener('pointermove',dragMove,true);window.removeEventListener('pointerup',dragUp,true);window.removeEventListener('pointercancel',dragCancel,true);clearHot();ensureDragGhost().style.display='none';
  if(!cancelled&&window.BrotwareConnectionEngine){BrotwareConnectionEngine.commit(s);suppressUntil=Date.now()+700;}
}
function dragMove(e){if(!dragSession||e.pointerId!==dragSession.pointerId)return;e.preventDefault();moveDrag(e.clientX,e.clientY);}
function dragUp(e){if(!dragSession||e.pointerId!==dragSession.pointerId)return;e.preventDefault();finishDrag(false);}
function dragCancel(e){if(!dragSession||e.pointerId!==dragSession.pointerId)return;finishDrag(true);}
function beginPaletteLongPress(e,button,type){
  if(e.pointerType==='mouse'&&e.button!==0)return;var pid=e.pointerId,sx=e.clientX,sy=e.clientY,done=false;
  var timer=setTimeout(function(){if(done)return;done=true;var block=newBlock(type),eng=window.BrotwareConnectionEngine;if(!eng)return;dragSession=eng.begin(block);if(!dragSession)return;dragSession.pointerId=pid;var g=ensureDragGhost();g.textContent=DEFS[type].name;g.style.display='block';moveDrag(sx,sy);window.addEventListener('pointermove',dragMove,true);window.addEventListener('pointerup',dragUp,true);window.addEventListener('pointercancel',dragCancel,true);cleanup();},240);
  function move(ev){if(ev.pointerId!==pid||done)return;if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8){clearTimeout(timer);done=true;cleanup();}}
  function up(ev){if(ev.pointerId!==pid||done)return;clearTimeout(timer);done=true;cleanup();}
  function cancel(ev){if(ev.pointerId!==pid)return;clearTimeout(timer);done=true;cleanup();}
  function cleanup(){window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);}
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);
}
function paletteClick(e){var b=e.target.closest('.sw-standard-item[data-sw-standard-type]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(Date.now()<suppressUntil)return;addBlock(b.dataset.swStandardType);}
function palettePointer(e){var b=e.target.closest('.sw-standard-item[data-sw-standard-type]');if(!b)return;e.stopImmediatePropagation();beginPaletteLongPress(e,b,b.dataset.swStandardType);}
function installPalette(){
  overlay=document.getElementById('swLogicOverlay');cats=document.getElementById('swPaletteCats');scroll=document.getElementById('swPaletteScroll');flow=document.getElementById('swFlow');
  if(!overlay||!cats||!scroll||!flow){setTimeout(installPalette,180);return;}
  if(overlay.dataset.swStandardBlocks==='1'){queueDecorate();return;}overlay.dataset.swStandardBlocks='1';
  overlay.addEventListener('click',rememberTarget,true);overlay.addEventListener('pointerdown',rememberTarget,true);
  scroll.addEventListener('click',paletteClick,true);scroll.addEventListener('pointerdown',palettePointer,true);
  observer=new MutationObserver(queueDecorate);observer.observe(scroll,{childList:true,subtree:true});cats.addEventListener('click',function(){setTimeout(queueDecorate,0);},true);
  var style=document.createElement('style');style.textContent='.sw-standard-pack{display:grid;gap:8px;margin-top:10px}.sw-standard-pack-title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.55;padding:3px 2px}.sw-standard-item{width:100%}.sw-standard-drag-ghost{white-space:nowrap}';document.head.appendChild(style);
  queueDecorate();
}

window.BrotwareStandardBlocks={definitions:DEFS,isStandard:isStandard,add:addBlock,refresh:queueDecorate};
setTimeout(installPalette,0);setTimeout(installPalette,600);
})();
