(function(){
'use strict';
var cats=document.getElementById('swPaletteCats');
var scroll=document.getElementById('swPaletteScroll');
var flow=document.getElementById('swFlow');
if(!cats||!scroll||!flow)return;

var ITEMS=[
  ['listCreate','create list','Criar/resetar uma lista','[]'],
  ['listAdd','add item','Adicionar item no final','＋'],
  ['listRemove','remove item','Remover item pelo índice','−'],
  ['listGet','get item','Ler item e salvar em variável','↳'],
  ['listSize','list size','Salvar quantidade de itens','#'],
  ['listClear','clear list','Limpar todos os itens','×']
];

function renderList(){
  var active=cats.querySelector('[data-sw-cat="list"].active');if(!active)return;
  var html='<div class="sw-palette-title">List</div>';
  ITEMS.forEach(function(x){html+='<button type="button" class="sw-list-special" data-list-type="'+x[0]+'"><span class="ico">'+x[3]+'</span><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></button>';});
  scroll.innerHTML=html;
}

cats.addEventListener('click',function(e){
  if(e.target.closest('[data-sw-cat="list"]'))setTimeout(renderList,0);
});

scroll.addEventListener('click',function(e){
  var b=e.target.closest('.sw-list-special');if(!b)return;
  e.preventDefault();e.stopPropagation();
  var selected=flow.querySelector('.sw-insert.selected');
  var slot=selected?selected.dataset.swSlot:'root';
  var index=selected?Number(selected.dataset.swIndex):activeBlocks().length;
  var block=newBlock(b.dataset.listType);block.__swCategory='list';
  insertBlock(block,slot||'root',isNaN(index)?activeBlocks().length:index);
  if(typeof saveLogic==='function')saveLogic();
  if(window.BrotwareSketchLogic)window.BrotwareSketchLogic.render();
});
})();
