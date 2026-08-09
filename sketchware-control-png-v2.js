(function(){
'use strict';

/* Dynamic C/E block skins based on the original Sketchware PNG silhouettes
 * supplied by the user. The PNG alpha is sliced rather than stretched as a
 * single bitmap, so the connector notch, left spine and mouth keep their
 * proportions while the control grows with nested blocks.
 */
var DATA_C='data:image/png;base64,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';
var DATA_E='data:image/png;base64,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';
var images={},cache=new Map(),scheduled=false,ro=null;

function load(kind){
  if(images[kind])return images[kind];
  images[kind]=new Promise(function(resolve,reject){
    var im=new Image();
    im.onload=function(){resolve(im);};
    im.onerror=reject;
    im.src=kind==='e'?DATA_E:DATA_C;
  });
  return images[kind];
}
function typeOf(el){
  var id=el&&el.dataset?el.dataset.blockId:'';
  if(!id)return'';
  try{
    var f=typeof findBlock==='function'?findBlock(id):null;
    return f&&f.block?String(f.block.type||''):'';
  }catch(_){return'';}
}
function drawH3(ctx,img,sy,sh,dy,dh,w){
  var sx=4,sw=88,left=54,right=8,center=sw-left-right;
  var dl=Math.min(left,Math.max(34,w-right-12));
  var dr=Math.min(right,Math.max(4,w-dl-8));
  var dc=Math.max(1,w-dl-dr);
  ctx.drawImage(img,sx,sy,left,sh,0,dy,dl,dh);
  ctx.drawImage(img,sx+left,sy,center,sh,dl,dy,dc,dh);
  ctx.drawImage(img,sx+left+center,sy,right,sh,dl+dc,dy,dr,dh);
}
function makeMask(kind,w,parts){
  w=Math.max(70,Math.round(w));
  var hs=parts.map(function(n){return Math.max(1,Math.round(n));});
  var h=hs.reduce(function(a,b){return a+b;},0);
  var key=kind+'|'+w+'|'+hs.join(',');
  if(cache.has(key))return Promise.resolve(cache.get(key));
  return load(kind).then(function(img){
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var x=c.getContext('2d');x.clearRect(0,0,w,h);
    var y=0;
    if(kind==='c'){
      drawH3(x,img,25,21,y,hs[0],w);y+=hs[0];
      drawH3(x,img,46,7,y,hs[1],w);y+=hs[1];
      drawH3(x,img,53,18,y,hs[2],w);
    }else{
      drawH3(x,img,13,21,y,hs[0],w);y+=hs[0];
      drawH3(x,img,34,7,y,hs[1],w);y+=hs[1];
      drawH3(x,img,41,17,y,hs[2],w);y+=hs[2];
      drawH3(x,img,58,6,y,hs[3],w);y+=hs[3];
      drawH3(x,img,64,19,y,hs[4],w);
    }
    var url='url("'+c.toDataURL('image/png')+'")';
    cache.set(key,url);
    if(cache.size>180){var first=cache.keys().next().value;cache.delete(first);}
    return url;
  });
}
function sectionHeights(block,kind){
  var wrap=block.querySelector(':scope > .sw-control-wrap');
  if(!wrap)return null;
  var main=wrap.querySelector(':scope > .sw-block-main');
  var branches=wrap.querySelectorAll(':scope > .sw-branch');
  var foot=wrap.querySelector(':scope > .sw-control-foot');
  if(!main||!foot||!branches.length)return null;
  var mh=Math.max(27,Math.round(main.getBoundingClientRect().height));
  var fh=Math.max(18,Math.round(foot.getBoundingClientRect().height));
  if(kind==='c'){
    var bh=Math.max(5,Math.round(branches[0].getBoundingClientRect().height));
    return [mh,bh,fh];
  }
  var b1=Math.max(5,Math.round(branches[0].getBoundingClientRect().height));
  var b2=Math.max(5,Math.round((branches[1]||branches[0]).getBoundingClientRect().height));
  var bridge=Math.min(30,Math.max(22,b2));
  var after=Math.max(5,b2-bridge);
  return [mh,b1,bridge,after,fh];
}
function skin(block){
  if(!block||!block.isConnected)return;
  var t=typeOf(block),kind=t==='if'?'e':(t==='repeat'?'c':'');
  if(!kind){block.classList.remove('sw-ce-png-v2');return;}
  var wrap=block.querySelector(':scope > .sw-control-wrap');
  if(!wrap)return;
  var w=Math.round(wrap.getBoundingClientRect().width);
  var parts=sectionHeights(block,kind);
  if(!parts||w<70)return;
  var sig=kind+'|'+w+'|'+parts.join(',');
  if(block.dataset.swCePngSig===sig)return;
  block.dataset.swCePngSig=sig;
  block.dataset.swCePngKind=kind;
  block.classList.add('sw-ce-png-v2');
  makeMask(kind,w,parts).then(function(url){
    if(!block.isConnected||block.dataset.swCePngSig!==sig)return;
    wrap.style.setProperty('--sw-ce-png-mask',url);
  }).catch(function(e){console.warn('Sketchware C/E PNG skin:',e);});
}
function skinPalette(){
  document.querySelectorAll('#swPalette .sw-v2-palette-control').forEach(function(el){
    var txt=(el.textContent||'').toLowerCase(),kind=txt.indexOf('if')>=0?'e':'c';
    el.classList.add('sw-ce-png-palette');
    el.style.setProperty('--sw-ce-static-mask','url("'+(kind==='e'?DATA_E:DATA_C)+'")');
  });
}
function run(){
  scheduled=false;
  var ov=document.getElementById('swLogicOverlay');
  if(!ov)return;
  ov.querySelectorAll('.sw-block.sw-v2-control[data-block-id]').forEach(skin);
  skinPalette();
}
function schedule(){
  if(scheduled)return;scheduled=true;requestAnimationFrame(run);
}
function install(){
  var ov=document.getElementById('swLogicOverlay');
  if(!ov){setTimeout(install,180);return;}
  if(ov.dataset.swCePngV2==='1'){schedule();return;}
  ov.dataset.swCePngV2='1';
  new MutationObserver(schedule).observe(ov,{childList:true,subtree:true});
  if(window.ResizeObserver){
    ro=new ResizeObserver(schedule);
    var flow=document.getElementById('swFlow');if(flow)ro.observe(flow);
  }
  window.addEventListener('resize',schedule);
  schedule();
}
window.BrotwareSketchwareCESkins={refresh:schedule};
setTimeout(install,0);setTimeout(install,500);setTimeout(install,1300);
})();