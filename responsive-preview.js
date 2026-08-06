(function(){
'use strict';

var MOBILE_W=390;
var TABLET_W=720;
var DESKTOP_W=1100;
var DEFAULT_H=647;

function page(){return typeof currentPage==='function'?currentPage():null;}
function designWidth(p){
  var w=Number(p&&p.designWidth)||0;
  return w>0?w:MOBILE_W;
}
function designHeight(p){
  var h=Number(p&&p.designHeight)||0;
  return h>0?h:DEFAULT_H;
}

/* Remember which design surface the page was last edited on. */
function installDeviceTracking(){
  if(typeof window.setDevice!=='function'||window.setDevice.__bwResponsiveTracked)return;
  var base=window.setDevice;
  var wrapped=function(device){
    var out=base.apply(this,arguments),p=page();
    if(p){
      p.designWidth=device==='desktop'?DESKTOP_W:device==='tablet'?TABLET_W:MOBILE_W;
      p.designHeight=DEFAULT_H;
      p.designDevice=device||'mobile';
      if(typeof autoSave==='function')autoSave();
    }
    return out;
  };
  wrapped.__bwResponsiveTracked=true;
  window.setDevice=wrapped;
}

function responsiveRuntime(w,h){
  return "\n<script data-bw-responsive-preview>(function(){"+
    "var BASE_W="+JSON.stringify(w)+",BASE_H="+JSON.stringify(h)+";"+
    "function fit(){var app=document.getElementById('app');if(!app)return;"+
      "var vw=Math.max(1,document.documentElement.clientWidth||window.innerWidth||BASE_W);"+
      "var s=vw/BASE_W;"+
      "document.documentElement.style.setProperty('--bw-preview-scale',s);"+
      "app.style.width=BASE_W+'px';"+
      "app.style.minHeight=Math.max(BASE_H,(window.innerHeight||BASE_H)/s)+'px';"+
      "app.style.transformOrigin='0 0';app.style.transform='scale('+s+')';"+
      "var logical=Math.max(app.scrollHeight,BASE_H);"+
      "document.body.style.minHeight=Math.max(window.innerHeight||0,Math.ceil(logical*s))+'px';"+
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

function install(){installDeviceTracking();installCompileWrapper();}
install();
setTimeout(install,250);
setTimeout(install,900);
})();
