(function(){
'use strict';
var palette=document.getElementById('swPaletteScroll');
var flow=document.getElementById('swFlow');
var back=document.getElementById('swLogicBack');

if(palette){
  palette.addEventListener('click',function(e){
    if(e.target.closest('.sw-palette-item')){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);
}

if(flow){
  flow.addEventListener('click',function(e){
    if(e.target.closest('.sw-insert'))return;
    if(e.target.closest('.sw-block')){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);
}

if(back){
  back.addEventListener('click',function(){
    setTimeout(function(){
      var originalBack=document.getElementById('skBackEvents');
      if(originalBack)originalBack.click();
    },0);
  });
}
})();
