(function(){
'use strict';
var mq=window.matchMedia('(max-width:760px)');
function $(s){return document.querySelector(s)}
function ensureButton(){
  if(!mq.matches)return;
  var toolbar=$('.designer-toolbar');
  if(!toolbar)return;
  var btn=$('#mobilePaletteBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='mobilePaletteBtn';
    btn.type='button';
    btn.className='tool-pill mobile-palette-toggle';
    btn.textContent='☰ Widgets';
    var page=$('#pageSelectorBtn');
    if(page&&page.nextSibling)toolbar.insertBefore(btn,page.nextSibling);else toolbar.insertBefore(btn,toolbar.firstChild);
  }
  if(!btn.dataset.mobileBound){
    btn.dataset.mobileBound='1';
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      document.body.classList.toggle('mobile-palette-open');
    });
  }
}
function forceView(){
  if(!mq.matches)return;
  var activeTab=$('.tab.active');
  var view=$('#screen-view');
  if(activeTab&&activeTab.dataset.tab==='view'&&view&&!view.classList.contains('active'))view.classList.add('active');
  ensureButton();
}
function fit(){
  if(!mq.matches)return;
  var designer=$('.designer'),shell=$('#phoneShell'),phone=$('#phone');
  if(!designer||!shell||!phone)return;
  if(phone.classList.contains('desktop')||phone.classList.contains('tablet'))return;
  var available=Math.max(280,designer.clientWidth-6),base=390;
  var scale=Math.min(1,available/base);
  scale=Math.max(.70,scale);
  shell.style.transform='scale('+scale+')';
  shell.style.transformOrigin='top center';
  shell.style.marginBottom=-(phone.offsetHeight*(1-scale))+'px';
  var z=$('#zoomLabel');if(z)z.textContent=Math.round(scale*100)+'%';
}
function sync(){
  forceView();
  fit();
}
document.addEventListener('click',function(e){
  if(!mq.matches)return;
  if(e.target.closest('.tab'))setTimeout(sync,20);
  if(document.body.classList.contains('mobile-palette-open')&&!e.target.closest('.palette')&&!e.target.closest('#mobilePaletteBtn'))document.body.classList.remove('mobile-palette-open');
});
window.addEventListener('resize',function(){clearTimeout(window.__brotwareMobileFix);window.__brotwareMobileFix=setTimeout(sync,60)});
if(mq.addEventListener)mq.addEventListener('change',sync);else mq.addListener(sync);
setTimeout(sync,0);setTimeout(sync,120);setTimeout(sync,500);
})();
