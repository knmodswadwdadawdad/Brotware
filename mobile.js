(function(){
'use strict';
var mq=window.matchMedia('(max-width:760px)');
var body=document.body;
var toolbar=document.querySelector('.designer-toolbar');
var palette=document.querySelector('.palette');
var designer=document.querySelector('.designer');
var shell=document.getElementById('phoneShell');
var phone=document.getElementById('phone');
var zoomLabel=document.getElementById('zoomLabel');

function ensureToggle(){
  if(!toolbar||document.getElementById('mobilePaletteBtn'))return;
  var b=document.createElement('button');
  b.id='mobilePaletteBtn';
  b.className='tool-pill mobile-palette-toggle';
  b.type='button';
  b.textContent='☰ Widgets';
  var pageBtn=document.getElementById('pageSelectorBtn');
  if(pageBtn&&pageBtn.nextSibling)toolbar.insertBefore(b,pageBtn.nextSibling);else toolbar.insertBefore(b,toolbar.firstChild);
  b.addEventListener('click',function(e){
    e.stopPropagation();
    body.classList.toggle('mobile-palette-open');
  });
}

function closePalette(){body.classList.remove('mobile-palette-open');}

function fitPhone(){
  if(!mq.matches||!designer||!phone||!shell)return;
  if(phone.classList.contains('desktop')||phone.classList.contains('tablet'))return;
  var available=Math.max(250,designer.clientWidth-10);
  var base=390;
  var scale=Math.min(1,available/base);
  scale=Math.max(.62,scale);
  shell.style.transform='scale('+scale+')';
  shell.style.transformOrigin='top center';
  shell.dataset.mobileFit='1';
  shell.style.marginBottom=-(phone.offsetHeight*(1-scale))+'px';
  if(typeof state!=='undefined')state.zoom=scale;
  if(zoomLabel)zoomLabel.textContent=Math.round(scale*100)+'%';
}

function clearMobileFit(){
  if(!shell||shell.dataset.mobileFit!=='1')return;
  shell.style.marginBottom='';
  delete shell.dataset.mobileFit;
}

function syncMode(){
  body.classList.toggle('is-mobile-ui',mq.matches);
  if(mq.matches){ensureToggle();fitPhone();}
  else{closePalette();clearMobileFit();}
}

if(designer){
  designer.addEventListener('pointerdown',function(e){
    if(!mq.matches||!body.classList.contains('mobile-palette-open'))return;
    if(e.target.closest('.palette')||e.target.closest('#mobilePaletteBtn'))return;
    closePalette();
  });
}

if(palette){
  palette.addEventListener('click',function(e){
    if(!mq.matches)return;
    if(e.target.closest('[data-create]'))setTimeout(closePalette,40);
  });
}

document.querySelectorAll('[data-device]').forEach(function(b){
  b.addEventListener('click',function(){setTimeout(fitPhone,40);});
});

window.addEventListener('resize',function(){clearTimeout(window.__brotwareMobileFitTimer);window.__brotwareMobileFitTimer=setTimeout(syncMode,80);});
if(mq.addEventListener)mq.addEventListener('change',syncMode);else mq.addListener(syncMode);
setTimeout(syncMode,0);
setTimeout(fitPhone,150);
})();
