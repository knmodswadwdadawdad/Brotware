(function(){
'use strict';

var lastUrl=null;

function ensureViewport(html){
  var meta='<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">';
  if(/<meta\s+name=["']viewport["'][^>]*>/i.test(html)){
    return html.replace(/<meta\s+name=["']viewport["'][^>]*>/i,meta);
  }
  return html.replace(/<head([^>]*)>/i,'<head$1>\n'+meta);
}

function addPreviewGuard(html){
  var css='<style data-bw-play-guard>html,body{margin:0!important;padding:0!important;width:100%!important;min-width:0!important;overflow-x:hidden!important}body{-webkit-text-size-adjust:100%;text-size-adjust:100%}</style>';
  return html.replace('</head>',css+'\n</head>');
}

function blobPreview(){
  try{
    if(typeof saveCurrentPage==='function')saveCurrentPage();
    var p=typeof currentPage==='function'?currentPage():null;
    if(!p)return;
    var html=typeof compilePage==='function'?compilePage(p):'';
    html=addPreviewGuard(ensureViewport(html));

    if(lastUrl){try{URL.revokeObjectURL(lastUrl);}catch(_){} lastUrl=null;}
    var blob=new Blob([html],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    lastUrl=url;

    var w=window.open(url,'_blank');
    if(!w){
      if(typeof toast==='function')toast('Popup bloqueado');
      URL.revokeObjectURL(url);lastUrl=null;return;
    }
    /* Keep the Blob alive long enough for slower Android browsers to finish loading. */
    setTimeout(function(){
      if(lastUrl===url){try{URL.revokeObjectURL(url);}catch(_){}lastUrl=null;}
    },120000);
  }catch(err){
    console.error(err);
    if(typeof toast==='function')toast('Erro ao abrir preview');
  }
}

function install(){
  window.preview=blobPreview;
  var run=document.getElementById('runBtn');
  if(run){run.onclick=blobPreview;run.dataset.bwBlobPreview='1';}
}

install();
setTimeout(install,100);
setTimeout(install,500);
setTimeout(install,1200);
})();
