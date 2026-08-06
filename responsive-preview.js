(function(){
'use strict';

var MOBILE_W=390;
var TABLET_W=720;
var DESKTOP_W=1100;
var DEFAULT_H=647;

function page(){return typeof currentPage==='function'?currentPage():null;}
function widthForDevice(device){return device==='desktop'?DESKTOP_W:device==='tablet'?TABLET_W:MOBILE_W;}
function activeDevice(){
  var b=document.querySelector('[data-device].active');
  if(b&&b.dataset.device)return b.dataset.device;
  var phone=document.getElementById('phone');
  if(phone){
    if(phone.classList.contains('desktop'))return'desktop';
    if(phone.classList.contains('tablet'))return'tablet';
  }
  return'mobile';
}
function isCurrent(p){var c=page();return !!(p&&c&&p.id===c.id);}
function designWidth(p){
  /* Preview/play of the current page must follow what the toolbar shows NOW.
   * This prevents an old desktop/tablet designWidth from making Mobile tiny. */
  if(isCurrent(p))return widthForDevice(activeDevice());
  var device=String(p&&p.designDevice||'');
  if(device==='mobile'||device==='tablet'||device==='desktop')return widthForDevice(device);
  var w=Number(p&&p.designWidth)||0;
  return w>0?w:MOBILE_W;
}
function designHeight(p){
  var h=Number(p&&p.designHeight)||0;
  return h>0?h:DEFAULT_H;
}
function syncCurrentDevice(){
  var p=page();if(!p)return;
  var d=activeDevice();
  p.designDevice=d;
  p.designWidth=widthForDevice(d);
  p.designHeight=DEFAULT_H;
}

/* Remember which design surface the page was last edited on. */
function installDeviceTracking(){
  if(typeof window.setDevice!=='function'||window.setDevice.__bwResponsiveTracked)return;
  var base=window.setDevice;
  var wrapped=function(device){
    var out=base.apply(this,arguments),p=page();
    if(p){
      p.designWidth=widthForDevice(device||'mobile');
      p.designHeight=DEFAULT_H;
      p.designDevice=device||'mobile';
      if(typeof autoSave==='function')autoSave();
    }
    return out;
  };
  wrapped.__bwResponsiveTracked=true;
  window.setDevice=wrapped;
  /* bootstrap selected Mobile before this extension loaded; synchronize it now. */
  syncCurrentDevice();
}

function responsiveRuntime(w,h){
  return "\n<script data-bw-responsive-preview>(function(){"+
    "var BASE_W="+JSON.stringify(w)+",BASE_H="+JSON.stringify(h)+";"+
    "function fit(){var app=document.getElementById('app');if(!app)return;"+
      "var vw=Math.max(1,window.innerWidth||document.documentElement.clientWidth||BASE_W);"+
      "var vh=Math.max(1,window.innerHeight||document.documentElement.clientHeight||BASE_H);"+
      "var s=vw/BASE_W;"+
      "if(!isFinite(s)||s<=0)s=1;"+
      "document.documentElement.style.width='100%';document.body.style.width='100%';"+
      "document.documentElement.style.overflowX='hidden';document.body.style.overflowX='hidden';"+
      "app.style.position='relative';app.style.width=BASE_W+'px';app.style.maxWidth='none';"+
      "app.style.minHeight=Math.max(BASE_H,vh/s)+'px';"+
      "app.style.transformOrigin='left top';app.style.transform='scale('+s+')';"+
      "var logical=Math.max(app.scrollHeight,BASE_H);"+
      "document.body.style.minHeight=Math.max(vh,Math.ceil(logical*s))+'px';"+
    "}"+
    "window.addEventListener('resize',fit);window.addEventListener('orientationchange',function(){setTimeout(fit,60)});"+
    "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fit);else fit();"+
    "window.addEventListener('load',fit);setTimeout(fit,0);setTimeout(fit,120);"+
  "})();<\\/script>";
}

function installCompileWrapper(){
  if(typeof window.compilePage!=='function'||window.compilePage.__bwResponsivePreview)return;
  var base=window.compilePage;
  var wrapped=function(p){
    if(isCurrent(p))syncCurrentDevice();
    var html=base.apply(this,arguments);
    var w=designWidth(p),h=designHeight(p);
    var css='<style data-bw-responsive-preview-css>html,body{margin:0!important;width:100%!important;min-width:0!important;overflow-x:hidden!important}body{position:relative}#app{box-sizing:border-box;max-width:none!important;overflow:visible!important}</style>';
    html=html.replace('</head>',css+'\n</head>');
    html=html.replace('</body>',responsiveRuntime(w,h)+'\n</body>');
    return html;
  };
  wrapped.__bwResponsivePreview=true;
  window.compilePage=wrapped;
}

function install(){installDeviceTracking();installCompileWrapper();syncCurrentDevice();}
install();
setTimeout(install,250);
setTimeout(install,900);
})();
