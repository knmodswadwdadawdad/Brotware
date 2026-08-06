(function(){
'use strict';

var installed=false;

function page(){return typeof currentPage==='function'?currentPage():null;}
function dialogs(){var p=page();return p&&Array.isArray(p.dialogs)?p.dialogs:[];}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function palette(){return document.getElementById('swPaletteScroll');}
function isView(){var b=document.querySelector('#swPaletteCats .sw-cat.active');return !!(b&&b.dataset.swCat==='view');}
function query(){var q=document.getElementById('swPaletteSearch');return String(q&&q.value||'').trim().toLowerCase();}
function targetSlot(){
  var z=document.querySelector('#swFlow .sw-insert.selected');
  if(z)return{slot:z.dataset.swSlot||'root',index:Number(z.dataset.swIndex)||0};
  var arr=typeof activeBlocks==='function'?activeBlocks():[];
  return{slot:'root',index:arr.length};
}
function add(type,id){
  if(typeof newBlock!=='function'||typeof insertBlock!=='function')return;
  var b=newBlock(type);b.props=b.props||{};b.props.dialogId=id;b.__swCategory='view';
  var t=targetSlot();insertBlock(b,t.slot,t.index);
  if(typeof saveLogic==='function')saveLogic();
  if(typeof renderLogic==='function')renderLogic();
  if(window.BrotwareSketchLogic&&BrotwareSketchLogic.render)BrotwareSketchLogic.render();
  if(typeof toast==='function')toast(type+' → '+id);
}
function render(){
  var box=palette();if(!box)return;
  var old=box.querySelector('.bw-dialog-palette-section');if(old)old.remove();
  if(!isView())return;
  var list=dialogs(),q=query();
  if(!list.length){
    var empty=document.createElement('div');empty.className='bw-dialog-palette-section';empty.innerHTML='<div class="bw-dialog-palette-title">Dialogs</div><div class="bw-dialog-palette-empty">Nenhum Dialog criado nesta página.</div>';box.appendChild(empty);return;
  }
  var section=document.createElement('section');section.className='bw-dialog-palette-section';
  var html='<div class="bw-dialog-palette-title">Dialogs <small>'+list.length+'</small></div>';
  var shown=0;
  list.forEach(function(d){
    var name=String(d.name||d.id),id=String(d.id||'');
    [['showDialog','▣','showDialog'],['closeDialog','×','closeDialog'],['toggleDialog','◐','toggleDialog']].forEach(function(a){
      var search=(a[2]+' '+name+' '+id+' dialog').toLowerCase();if(q&&search.indexOf(q)<0)return;shown++;
      html+='<button type="button" class="bw-dialog-palette-item" data-bw-dialog-type="'+a[0]+'" data-bw-dialog-id="'+esc(id)+'"><span class="ico">'+a[1]+'</span><span><b>'+a[2]+' <em>'+esc(name)+'</em></b><small>'+esc(id)+'</small></span></button>';
    });
  });
  if(!shown)html+='<div class="bw-dialog-palette-empty">Nenhum Dialog encontrado.</div>';
  section.innerHTML=html;box.appendChild(section);
}
function schedule(){setTimeout(render,0);setTimeout(render,60);}
function install(){
  if(installed)return;
  var cats=document.getElementById('swPaletteCats'),toggle=document.getElementById('swPaletteToggle'),search=document.getElementById('swPaletteSearch'),box=palette();
  if(!cats||!toggle||!search||!box){setTimeout(install,180);return;}
  installed=true;
  cats.addEventListener('click',schedule);
  toggle.addEventListener('click',schedule);
  search.addEventListener('input',schedule);
  box.addEventListener('click',function(e){var b=e.target.closest('.bw-dialog-palette-item');if(!b)return;e.preventDefault();e.stopPropagation();add(b.dataset.bwDialogType,b.dataset.bwDialogId);});
  document.addEventListener('click',function(e){if(e.target.closest('#bwCreateDialog,#bwDialogPropsSave,[data-dialog-action="delete"],[data-dialog-action="duplicate"]'))setTimeout(schedule,80);});
  schedule();
}
window.BrotwareDialogViewBlocks={refresh:schedule};
install();
})();
