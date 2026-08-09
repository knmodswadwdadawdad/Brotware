(function(){
'use strict';

/* Sketchware PNG/NinePatch skins supplied by the user.
 * Android .9.png marker border is parsed manually and rendered to an exact-size
 * browser mask, preserving the original connector/socket geometry while the
 * Brotware block model and connection engine remain unchanged.
 */
var P='data:image/png;base64,';
var NINE={
  command:{src:P+'iVBORw0KGgoAAAANSUhEUgAAAKEAAAA+CAYAAABDYXsgAAAErUlEQVR4Xu2d3WtbdRjHK7vzRnDSje1m6pQheiGIXoigoBvT4RtD78RLwSsRwRvv/QN6p9vUWqSISsHWNOnb2qbBvlCkJE1rbfquaae0aeYgpT5+n5xmy/k16Uu65Dlh3w98IU17fjz5nc/5Pb+Ti56GBlItJGCpT0TkPuQU8hrytlG+Rxrd2oIE6juGPIK8VVT3R8jHAYs7t9XK58hT7jyVYe8LBAOdRt5D/hI7ZpAryONufUEBtZ0R7yRv+yq/d0kjvyCvuHNVgvISijex55EbvuFtWES+Rh5w67QGNZ1DPkA2fRWTLPID8rI7Zw67JRSvBesKqC04SPyO/IyccGu2QLwW/Kh47YeUZgPpRJ5256+IkhKqgO8jq77hgsEfyDXknFt3rRGvU3ziq46UQj0KIRfcOdzBLyH+8GHkogSjBZdjCfkGedBXfA0RrwV/KF7LIftTaM2lRPQklDst+JLv0OCiNyvtUuPWLF4LPotc9lVDDkJGvNb8jDuthck9ibwrwV4BXWbFu1l5Trz6axHtFJ8KqYh0Or2WSCSi5SR8Vf/GPagO0KtrRbyVsVa5KaQiksmktLe3J0pJqL/XL1kJqSqUkJhDCYk5lJCYQwmJOZSQmEMJiTmUkJhDCYk5lJCYQwmJOZSQmEMJiTmUkJhDCYk5lJCYQwmJOZSQmEMJiTmUkJhDCYk5lJCYQwmJOZSQmEMJiTmUkJhDCYk5lJCYQwmJOZSQmEMJiTmUkJhDCYk5lJCYs5eEaiElJFVnfHxcWlpapstJ+CzynXsQIXeLzc1NaW1tlaamplQ5CfU/03+L/OkcS8iRyWaz2oY1W6FQaLikhPlXIk8izUjKPwQhlbO2tibhcFg6OjpyXV1dQ1NTU28WCZhXz/+TtyLqQ2r0GSGEHImNjQ2JRCL5VbCzs/PXeDz+Bt4+5pPOlTD/jkijeK1Znw9CSEUUt2AVcHZ29h3XtR12S6hgjCfEe1oSV0RyaFZXV3XlUwFz3d3d0WQy+brrWBGlJVTkTmvWpxgRciDW19dvt2DsBWOTk5P6vES3BRdTXkIFBx/HRvInDJjdWVpNMjg4KLlczv28gUC/etAa29radtV9j2Ybq+BNiBibn5+/7DpVgr0lVAYGBi4hEaSv1sEd1W/9/f0D+GB/Dw8Py9bWluuAKSsrK/mJR523mpub51Hr9ULtsVgshcwFKe78VimRmZmZz5aXl/d74nuB/SUcHR29H4M2WgT7idMTExMnIOBXONn/9PX1uR6YUbTvkZ6ent5oNHq+uPZUKnUmaHHnt1pRZ1yP9mB/CYPAwsLCKZzkKzjhGVxp5q05k8kUWk8OIvbPzc1ddGsmB6Y+JFQWFxcfQ0u5itZ3w7I1F1owcgsrYDcEfMmtlRyK+pFQwU3SQyMjI1d1j2jRmtPpdL4F40L4D1uFHtTzglsjOTT1JaGCvc1JtOYvIOIGbgTyd6fb29uuL3cd/fa/0ILD4fB11HHBrY1URP1JqGDze3ZoaOhLbc0qRjwel+np6apmR8B/e3t7uyDgi25NpGLqU0JlaWnp+NjYmN6sTNYioVAogf3gj8lk8nm3FnIkbkuoLxjGIg3/A724uhwqNpdKAAAAAElFTkSuQmCC',sx:85,sw:36,sy:9,sh:34},
  final:{src:P+'iVBORw0KGgoAAAANSUhEUgAAAKsAAAA+CAYAAABUQ+vpAAADbUlEQVR4Xu3dvWtTURgG8DoIgt8OraL4sSkq6OIfoS4KBRcXBXH3T3BWh9rYDk4mIjgJTQLBgBDSxgyJSZvgkCbiYqp2cdAGjK/vybFp7snnvUluzivPDx5oC8053D6970mWOzUFfiBL8v8iol2c45zrnJsTykvOYXNvNuH97eZc6rD37TywKLPUvr9xZp5zwLxmHvT+Z+NFTnDucL7T5BQ4jzjT5v5swPvawznLWXDsGrblOA85+8xr51L3svKLn+Fc5Ww6lvbfH85HznNzjzbgfZ3nBJ1bhha/SRd20bx2LrWXlZyj3yYfyKIjAe2MfnXXh/5SnAB5PxJ0LKsNo7+bIucxZ8bct58Io9+rPOkjwX7zmg7AWVbSo/8aTX70dzPxIwHpyaNGf8ixMxhEnbwfCXRZSf8B1B3VttHfjToSvCKfjwSkR/9l0nd38O495xm5OxI0y3qUc4vsvaN2oo4ETzjnSO/fj6jRv0gwtLW1tUKxWLxtFLKXZlnV6N8wX9By6kjwg/OZU/IxMALhcPhnNBq9axSyl0ZZ1e+qD28BfIOyghgoK4iBsoIYKCuIgbKCGCgriIGyghgoK4iBsoIYKCuIgbKCGCgriIGyghgoK4iBsoIYKCuIgbKCGCgriIGyghgoK4iBsoIYKCuIgbKCGCgriIGyghgoK4iBsoIYKCuIgbKCGCgriIGyghgoK4iBsoIYXsuq2oqygq+CweCvUCh0zyhkL82yXiH99BOAsUun0zQ3N7cVCATuG4XspVlW9SQS9UjHqvG6ACNTr9cpn8+rIwBFIpHNWCzm/mktja+ILpIubMW5BMBorK6uNoq6tLT0bWVlZb5cLp9qKWM/O2VtfEd0jBMmFBZGTI1+VVTO12w2u1goFI44ytefs6yNnxDNkL7DfjHWA3DNHP2pVGq+UqkcMns3gPayKrzGBc4Lwh0WhrQ9+tUd1cPob9W5rArpN13qSFA21gcYSOvoz2QyCx5Gf6vuZVV4vRle4I36APffogjiJlvxeHyDS/t0fX39oNkvl3qXVVleXr6RSCTect4h3sLj75MtSWhtexxHksnk61qtNstFPWn2yoP+Zc3lcntLpdI04j38huK0LalWq237G2fMPg2hf1kBLIGyghgoK4iBsoIYKCuIgbKCGM2yqi8QxOZM/QW/Tom39+BygAAAAABJRU5ErkJggg==',sx:88,sw:34,sy:9,sh:34},
  boolean:{src:P+'iVBORw0KGgoAAAANSUhEUgAAAKsAAAA+CAYAAABUQ+vpAAAEvElEQVR4Xu3dzW8bRRgG8IRQSouASpADx3KpKH8A3Isol/IhLkDLhRSEBFKKBBJIoHDiBuLQ/gdwASSQkLiBpR4QB19AQhHKoa0QTtrULrGbxN6d2Yf3tbth+ya21utdfz4/abQ5OJmx/GT2tT27Mzc3HGCbukZEXfAfhCYGw0oTg2GliVF8WJvACQArbFPZPpHX91k5LtjXvQDFhnUDu8cdcBk0tSKgsgGcsq99AYoL6zqw2IqibzrPh6aZvMA714HTZeCQzUGOignrX3U82vL+K3ke3j4xmk46w94GXpMf77V5yEn+YV2t45EwwrdgUGfRjU3nzthM5CTfsG4CD0qNekkG7eyzoJkR3HTuReRfEuQX1l+BIwHwuQyyaUdPs0VKgg0pCc6Wy+U8A5tPWH9aWzssQb0o4wzswGk2RVG0KSXB8zYrAxg8rBrU0ONDGd+OHTDNvGALeFWO99ncZDBoWDEv5/xlGUzNjpJISUlwc9u5JQxeww4WVu/9ezKI23aAREkS2GrNuVdsfvqULazS/4K83T8HzqiUnpPA6uewWUuCbGGVaf0F6fSKGQxRT1oS7AJLf2YLbP9hrQNnpN9NOxCilKpyVn7D5iqF9GGVTu6R/4pTcqzY3on6FAXOnZfjYZuzHtKHdSvAUyGi322vRBnd8sA7SB/YdGGttPBExBqVchZF0ZbOsDZvXfQOq/y9+WoLJ+U/YNV2RJQTLQne/Bs4YvNn9A7rdeBxSf/P4AoqKtZW6PG+HO+3GUzoHtYScMxF0W9gUGk46k2PZZvDhIPDenV7+zEH/GL/GlHRAmC5S0mwP6xrjcai66zy5woqGjp5I1/vUhKYsJbLh+RB34NBpdHSkuDC3eFMhLVWw8PyoK/tbxGNSuj9x3I4eldY9XIU7/2XMgdzlT+NE13Rt4JOYNthRQv+M3DxNI2nbQ//6V5YQwmrFLa79lFEY2Bb2l5YO2UAwDKAxk07qNIe2Aur4hssGjcygeobLA2q2v/RlZQDP4AfXdFoNXp+dBW786WAzrAMLI2CfinwwQHfYu0Pq+LXrTQqOqMeEFR1cFhVCTgWgQtZaGgaui7A5jChe1jVtWaTSwRpGAZbIqjkl+fXW3iSi6+pQFHg/VtdTv1JvcMau9ZonZQZ9qrthWgQelmLy+uylqRqgKdlhv3DdkiUkV4w+C7yvmBQgZdiU34iB5y/0rtGtdKHNbbj3EvSWdX2TpTSvxLUJZurFPoPq3JwL0cAa1jqi9So1ab3byP9qT8pW1ils4UA7nXwxmyUnt6Y7Syy3edKZQtrDB56y0tdGUPUlZyFayO75eX/2jcTviDjuWUHSKTaNxPOfufApEHDGt+m3X8EXmlA+wUD3pM1afCwqvYGGN7rlkJcqUWx8dsAI/ZjpXI0gP8C3FqIOlsLnRvLrYViVeAhbto28wJ5AzPem7bFVtHeDvM7cKXWLJqc7TBjutFw4MGNhmfInY2G9XPUydloONYAFmWG5Rbus2HnRhg+h/xP/UnFhVVtYPe4FK+X7TOj6SGnzvV/wvAZ+9oXoNiwqiZwAp1rv9mmr63Iqf90qVQq6tSfVHxYiXLCsNLEYFhpYjCsNDH2wqo/sLGNc5v7D7Q9lKq4SlufAAAAAElFTkSuQmCC',sx:24,sw:117,sy:29,sh:2},
  number:{src:P+'iVBORw0KGgoAAAANSUhEUgAAAKsAAAA+CAYAAABUQ+vpAAAE6ElEQVR4Xu3dW2gcVRzH8U1Qm2hRsbXFShEfvKCCFK3ig+CD4ksREarQFy9gQfsiqEirSIReBF8URRC1BR+K+qIvigglAVEfGkTBeGmM26YXYq7N3mfm/M/P/2STuHOym710uzMbf58y3e3m7OyWfDM5k52dpFKdBS5rciGiCvyioK7BWKlrMFbqGoyVugZjpa7RvlgHgUsAXDvn+9uKwD4ROWqAYxb4VW+fAq11OV3GAmt/1M/5F77gnbOl4CG9bes54HJNpMdtpknlWFFeWUv0vus0yh2B4KCxGLIW89H/A/2Pabf4XcM9LMDuyRJucvtpwnKsG50PNKInWwwe0PsO6TOa1UuJPk+iiIJuyE6I4CW93u/G1ICFWMMVNRyrju3xgFt1a3pEr5cqnw1RI8TakbzBI5PAerevVTQX68gk1ueNeUbH/+U8PlGz8r7I++eKxRvczmpoPNYZ4Epd+Qf6LT/rPipRi3ztaWQmwH1ub1XUj3VQ9/J/znq365gfoo9D1DZzWfF3j0xOrjYtqB/rbBDcrxPjUXftRG1lkQsE+9z+Kqweq96+QTfT34B7+tQZ2YLBY26Hi2rHqrf1i8h7zsqILirdOI7PA9v1qvsiQo1YBwZ6A5HXwC0qdZ7OOvG1Xm6INFkr1ryPbXqHk85KiDrFnzPmycomU9ViHQYuLYocAreqFCPdWP49PDZ71X+tVon1TKl0s/77hHNfoo7zIPvDKWnNWAuCt1E+AIEobumc799ZNdZ0Gn16fca5A1Fciro8nyr/ZCAaq05qH3UGE8VKd5yOTExMXLEiVhH51B1MFKfw2IECsDUS6xSwBTyaihJGY5Vp3783EmsAPKwfmHYHE8XNg7weidUAu/Qy44wjip0IjkZi1Ynsc5ZH/lMyDUVjFdkLvmpFyTRaGetmnbO+6Y4gSojCcqxZYFNe5IA7gigh5iLTAF1e1sVExxAlgMWIG+uzuhSio4gSwOJbN9aduvBsKpQ4nuBwJNYgWDi7yj/OOKLYecArkViHM5mNFvjTHUgUM2/axz2RWMMrAnzijiSKk7X4SS+2rIiVhwhS0hjg48VTZkZjTWPh4GueS5WSoqjf7fekqh18HSqJfAS+rYUSQKcAp877/l2Laa6M9UwJ4RsGebogip0nclDrrP2GwfCt2J5gP/hqFsXr5Fi9t2Iv3nAb+K4Bio+fM2ZXZZNhlktxrjjXlc5dw2MFeMggdZo1Fl9lMtVPH1Q11jTQxxOzUQzGdafqbtQ4MVtNmfIxAzzlJXVK3VNermre97db4A93rURtli2IvOD2V6F+rANA77jn3aFTid/ctRO1g24MczmRFwfT6T63vwr1Y13yy0R2k7X4Utftuw9G1CKrTZ3NGjzh9lZF47GGppC/zgPeQvkcREQXQnf6MVgoH1HViOZiDZ0G+s8DDxrgO3DHi1ozFwhePV0oXI+Ve/21NB/rkp3AZVngcX2w4+Cvw6TVWf2T17/GPMiBz+fnr3F7akDrsS4Jf+ugMWZHIPKGbtbDOe0pMFwqy2oT35dE3jUGT2eAW9x+mnDhsS7RJ9ary9W63Dil8RZF9voiH+pX1DGdRafBHbO1bkbDPG4gnwXAoZwxT3kLP0XC5lFgndtLC9oXK9FFxlipazBW6hqMlboGY6WuwVipayzHGl7hwiXJS+pf1rCT+wbUqiwAAAAASUVORK5CYII=',sx:26,sw:118,sy:9,sh:34},
  string:{src:P+'iVBORw0KGgoAAAANSUhEUgAAAKsAAAA+CAYAAABUQ+vpAAABBUlEQVR4Xu3SMWrDABBFQR1IF0t8dzWpVBhFDsKFsGNwoeiFGfiwzXZvGH63mB04+BfETMbzWKevebwu14vZkZvmedy3uPmJ9WGx6+PHAgdbu/vct7gRK+ciVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyRArGWIlQ6xkiJUMsZIhVjLESoZYyXgV60Ni5S+8Fes0z+P6eDE7crfu9i1unscKJyNWMu6x3g6zM2/4BqiTUlj9liVfAAAAAElFTkSuQmCC',sx:6,sw:156,sy:3,sh:53}
};
var imgs={},cache={},overlay=null,mo=null,ro=null,queued=false;

function load(kind){
  if(imgs[kind])return imgs[kind];
  imgs[kind]=new Promise(function(resolve,reject){
    var im=new Image();
    im.onload=function(){resolve(im);};
    im.onerror=reject;
    im.src=NINE[kind].src;
  });
  return imgs[kind];
}
function n(v){return Math.max(1,Math.round(Number(v)||1));}
function drawNine(kind,w,h){
  w=n(w);h=n(h);
  var key=kind+':'+w+'x'+h;
  if(cache[key])return Promise.resolve(cache[key]);
  return load(kind).then(function(im){
    var m=NINE[kind],cw=im.naturalWidth-2,ch=im.naturalHeight-2;
    var lx=m.sx,rx=cw-(m.sx+m.sw),ty=m.sy,by=ch-(m.sy+m.sh);
    var fixedX=lx+rx,fixedY=ty+by;
    var tl=lx,tr=rx,tt=ty,tb=by;
    if(w<fixedX+1){
      var sx=w/Math.max(1,fixedX);
      tl=Math.max(1,Math.floor(lx*sx));tr=Math.max(1,w-tl-1);
    }
    if(h<fixedY+1){
      var sy=h/Math.max(1,fixedY);
      tt=Math.max(1,Math.floor(ty*sy));tb=Math.max(1,h-tt-1);
    }
    var tx=[0,tl,Math.max(tl,w-tr),w],tya=[0,tt,Math.max(tt,h-tb),h];
    var sxa=[1,1+m.sx,1+m.sx+m.sw,1+cw],sya=[1,1+m.sy,1+m.sy+m.sh,1+ch];
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;
    for(var yi=0;yi<3;yi++)for(var xi=0;xi<3;xi++){
      var sw=sxa[xi+1]-sxa[xi],sh=sya[yi+1]-sya[yi],dw=tx[xi+1]-tx[xi],dh=tya[yi+1]-tya[yi];
      if(sw>0&&sh>0&&dw>0&&dh>0)ctx.drawImage(im,sxa[xi],sya[yi],sw,sh,tx[xi],tya[yi],dw,dh);
    }
    var url='url("'+c.toDataURL('image/png')+'")';
    cache[key]=url;
    return url;
  });
}
function setMask(el,kind){
  if(!el||!el.isConnected)return;
  var r=el.getBoundingClientRect(),w=Math.ceil(r.width),h=Math.ceil(r.height);
  if(w<4||h<4)return;
  var key=kind+':'+w+'x'+h;
  if(el.dataset.swPngSkinKey===key)return;
  el.dataset.swPngSkinKey=key;
  drawNine(kind,w,h).then(function(url){
    if(!el.isConnected||el.dataset.swPngSkinKey!==key)return;
    el.style.setProperty('--sw-png-mask',url);
    el.dataset.swPngKind=kind;
    el.classList.add('sw-png-skin');
  }).catch(function(e){console.error('Sketchware PNG skin',e);});
}
function blockType(el){
  var b=el.closest&&el.closest('.sw-block[data-block-id]');
  if(!b)return'';
  try{var f=typeof findBlock==='function'?findBlock(b.dataset.blockId):null;return f&&f.block?String(f.block.type||''):'';}catch(_){return'';}
}
function isFinalType(t){
  return ['return','returnValue','returnMoreBlock','moreblockReturn','stop','finish','terminate'].indexOf(t)>=0;
}
function skinControl(control){
  if(!control)return;
  control.classList.add('sw-png-control');
  var w=Math.ceil(control.getBoundingClientRect().width||0);
  if(w<30)return;
  var bridgeW=Math.max(40,w-13);
  drawNine('command',bridgeW,30).then(function(url){
    if(control.isConnected)control.style.setProperty('--sw-png-bridge-mask',url);
  });
}
function scan(){
  queued=false;
  overlay=document.getElementById('swLogicOverlay');
  if(!overlay||!overlay.classList.contains('show'))return;

  overlay.querySelectorAll('.sw-block-main').forEach(function(el){
    var t=blockType(el);
    setMask(el,isFinalType(t)?'final':'command');
  });
  overlay.querySelectorAll('.sw-v2-control').forEach(skinControl);

  overlay.querySelectorAll('.sw3-reporter.string,.sw2-socket.string,.sw3-empty-socket.string').forEach(function(el){setMask(el,'string');});
  overlay.querySelectorAll('.sw3-reporter.number,.sw2-socket.number,.sw3-empty-socket.number').forEach(function(el){setMask(el,'number');});
  overlay.querySelectorAll('.sw3-reporter.boolean,.sw2-socket.boolean,.sw3-empty-socket.boolean').forEach(function(el){setMask(el,'boolean');});

  overlay.querySelectorAll('.sw-v2-palette-command').forEach(function(el){setMask(el,'command');});
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(scan);}
function install(){
  overlay=document.getElementById('swLogicOverlay');
  if(!overlay){setTimeout(install,160);return;}
  if(!mo){
    mo=new MutationObserver(schedule);
    mo.observe(overlay,{childList:true,subtree:true});
  }
  if(!ro&&window.ResizeObserver){
    ro=new ResizeObserver(schedule);
    ro.observe(overlay);
  }
  schedule();
}
window.BrotwareSketchwarePngSkins={
  refresh:schedule,
  renderNinePatch:function(kind,w,h){return drawNine(kind,w,h);},
  assets:NINE
};
setTimeout(install,0);setTimeout(install,400);setTimeout(install,1100);
})();