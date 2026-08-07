(function(){
'use strict';

var mq=window.matchMedia('(max-width:760px)'),wrap=null,label=null;
var MIN=.4,MAX=1.3,STEP=.1;

function clamp(v){return Math.max(MIN,Math.min(MAX,v));}
function current(){var z=(typeof state!=='undefined'&&Number(state.zoom))||1;return clamp(z);}
function fmt(z){return Math.round(z*100)+'%';}
function sync(){if(label)label.textContent=fmt(current());}
function fallbackZoom(z){
  var shell=document.getElementById('phoneShell'),phone=document.getElementById('phone');if(!shell||!phone)return;
  if(typeof state!=='undefined')state.zoom=z;shell.style.transform='scale('+z+')';shell.style.transformOrigin='top center';shell.style.marginBottom=-(phone.offsetHeight*(1-z))+'px';var old=document.getElementById('zoomLabel');if(old)old.textContent=fmt(z);
}
function apply(z){
  z=clamp(Math.round(z*100)/100);
  if(typeof window.setZoom==='function'){
    try{window.setZoom(z);}catch(e){fallbackZoom(z);}
  }else fallbackZoom(z);
  /* Some legacy mobile-fit layers change transform independently. Keep state/UI consistent. */
  if(typeof state!=='undefined')state.zoom=z;
  var shell=document.getElementById('phoneShell'),phone=document.getElementById('phone');
  if(shell&&phone){shell.style.transform='scale('+z+')';shell.style.transformOrigin='top center';shell.style.marginBottom=-(phone.offsetHeight*(1-z))+'px';}
  sync();
}
function change(dir){var z=current();z=Math.round((z+(dir*STEP))*10)/10;apply(z);}
function build(){
  if(wrap)return;var run=document.getElementById('bwMobileRun'),top=document.getElementById('bwMobileTopbar');if(!run||!top)return;
  wrap=document.createElement('div');wrap.id='bwMobileZoom';wrap.className='bw-mobile-zoom';wrap.innerHTML='<button id="bwMobileZoomOut" type="button" aria-label="Diminuir zoom">−</button><button class="bw-mobile-zoom-label" id="bwMobileZoomLabel" type="button" title="Voltar para 100%">100%</button><button id="bwMobileZoomIn" type="button" aria-label="Aumentar zoom">＋</button>';
  top.insertBefore(wrap,run);label=document.getElementById('bwMobileZoomLabel');
  document.getElementById('bwMobileZoomOut').onclick=function(e){e.preventDefault();change(-1);};
  document.getElementById('bwMobileZoomIn').onclick=function(e){e.preventDefault();change(1);};
  label.onclick=function(e){e.preventDefault();apply(1);};sync();
}
function install(){if(!mq.matches)return;build();sync();}
window.BrotwareMobileZoom={set:apply,get:current,zoomIn:function(){change(1);},zoomOut:function(){change(-1);},reset:function(){apply(1);}};
setTimeout(install,0);setTimeout(install,250);setTimeout(install,700);
window.addEventListener('resize',function(){clearTimeout(window.__bwZoomSync);window.__bwZoomSync=setTimeout(function(){install();sync();},180);});
})();
