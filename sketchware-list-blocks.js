(function(){
'use strict';

var LIST_TYPES=['listCreate','listAdd','listRemove','listGet','listSize','listClear'];
function isList(type){return LIST_TYPES.indexOf(type)>=0;}

BLOCK_META.listCreate={name:'create list',icon:'[]',cls:'list'};
BLOCK_META.listAdd={name:'add item',icon:'＋',cls:'list'};
BLOCK_META.listRemove={name:'remove item',icon:'−',cls:'list'};
BLOCK_META.listGet={name:'get item',icon:'↳',cls:'list'};
BLOCK_META.listSize={name:'list size',icon:'#',cls:'list'};
BLOCK_META.listClear={name:'clear list',icon:'×',cls:'list'};

var baseNewBlock=window.newBlock;
window.newBlock=function(type){
  var b=baseNewBlock(type);
  if(type==='listCreate')b.props={name:firstVariableName()};
  else if(type==='listAdd')b.props={name:firstVariableName(),value:'item'};
  else if(type==='listRemove')b.props={name:firstVariableName(),index:'0'};
  else if(type==='listGet')b.props={name:firstVariableName(),index:'0',saveVar:firstVariableName()};
  else if(type==='listSize')b.props={name:firstVariableName(),saveVar:firstVariableName()};
  else if(type==='listClear')b.props={name:firstVariableName()};
  return b;
};

var baseSummary=window.blockSummary;
window.blockSummary=function(block){
  var p=block.props||{};
  if(block.type==='listCreate')return p.name+' = []';
  if(block.type==='listAdd')return p.name+' + '+p.value;
  if(block.type==='listRemove')return p.name+' remove ['+p.index+']';
  if(block.type==='listGet')return p.saveVar+' ← '+p.name+'['+p.index+']';
  if(block.type==='listSize')return p.saveVar+' ← '+p.name+'.length';
  if(block.type==='listClear')return p.name+' = []';
  return baseSummary(block);
};

var baseOpenBlockEditor=window.openBlockEditor;
window.openBlockEditor=function(id){
  var found=findBlock(id);if(!found||!isList(found.block.type))return baseOpenBlockEditor(id);
  state.editingBlockId=id;
  var b=found.block,p=b.props||{},meta=BLOCK_META[b.type];
  $('#blockModalTitle').textContent=meta.name;
  $('#blockModalSubtitle').textContent='Configurar bloco de lista';
  var h=helpBox()+'<div class="block-config-grid">';
  if(b.type==='listCreate'||b.type==='listClear'){
    h+=selectField('Variável da lista','bf_list_name',variableOptions(p.name),true);
  }else if(b.type==='listAdd'){
    h+=selectField('Variável da lista','bf_list_name',variableOptions(p.name),true)+field('Valor','bf_list_value',p.value,true);
  }else if(b.type==='listRemove'){
    h+=selectField('Variável da lista','bf_list_name',variableOptions(p.name),true)+field('Índice','bf_list_index',p.index,true);
  }else if(b.type==='listGet'){
    h+=selectField('Variável da lista','bf_list_name',variableOptions(p.name),true)+field('Índice','bf_list_index',p.index)+selectField('Salvar em','bf_list_save',variableOptions(p.saveVar));
  }else if(b.type==='listSize'){
    h+=selectField('Variável da lista','bf_list_name',variableOptions(p.name),true)+selectField('Salvar tamanho em','bf_list_save',variableOptions(p.saveVar),true);
  }
  h+='</div>';
  $('#blockEditorFields').innerHTML=h;openModal('blockModal');
};

var baseSaveBlockEditor=window.saveBlockEditor;
window.saveBlockEditor=function(){
  var found=findBlock(state.editingBlockId);if(!found||!isList(found.block.type))return baseSaveBlockEditor();
  var b=found.block,p=b.props;
  p.name=valueOf('bf_list_name');
  if(b.type==='listAdd')p.value=valueOf('bf_list_value');
  else if(b.type==='listRemove')p.index=valueOf('bf_list_index');
  else if(b.type==='listGet'){p.index=valueOf('bf_list_index');p.saveVar=valueOf('bf_list_save');}
  else if(b.type==='listSize')p.saveVar=valueOf('bf_list_save');
  closeModal('blockModal');saveLogic();renderLogic();
};

var baseExecuteBlocks=window.executeBlocks;
window.executeBlocks=async function(blocks,ctx){
  for(var i=0;i<(blocks||[]).length;i++){
    var b=blocks[i],p=b.props||{},list,index;
    if(isList(b.type)){
      if(b.type==='listCreate'||b.type==='listClear')ctx.vars[p.name]=[];
      else {
        list=ctx.vars[p.name];if(!Array.isArray(list)){list=[];ctx.vars[p.name]=list;}
        if(b.type==='listAdd')list.push(resolveValue(p.value,ctx));
        else if(b.type==='listRemove'){index=Number(resolveValue(p.index,ctx))||0;if(index>=0&&index<list.length)list.splice(index,1);}
        else if(b.type==='listGet'){index=Number(resolveValue(p.index,ctx))||0;ctx.vars[p.saveVar]=(index>=0&&index<list.length)?list[index]:null;}
        else if(b.type==='listSize')ctx.vars[p.saveVar]=list.length;
      }
    }else{
      await baseExecuteBlocks([b],ctx);
    }
  }
};

/* Extend generated-page runtime without replacing the proven runtime implementation. */
var baseRuntimeScript=window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=baseRuntimeScript(page);
  var needle="else if(b.type==='fetch'){";
  var listRuntime="else if(b.type==='listCreate'||b.type==='listClear')vars[p.name]=[];else if(b.type==='listAdd'){var li=vars[p.name];if(!Array.isArray(li)){li=[];vars[p.name]=li}li.push(rv(p.value))}else if(b.type==='listRemove'){var lr=vars[p.name];if(!Array.isArray(lr)){lr=[];vars[p.name]=lr}var lri=Number(rv(p.index))||0;if(lri>=0&&lri<lr.length)lr.splice(lri,1)}else if(b.type==='listGet'){var lg=vars[p.name];if(!Array.isArray(lg)){lg=[];vars[p.name]=lg}var lgi=Number(rv(p.index))||0;vars[p.saveVar]=(lgi>=0&&lgi<lg.length)?lg[lgi]:null}else if(b.type==='listSize'){var ls=vars[p.name];if(!Array.isArray(ls)){ls=[];vars[p.name]=ls}vars[p.saveVar]=ls.length}";
  return code.indexOf(needle)>=0?code.replace(needle,listRuntime+needle):code;
};
})();
