(function(){
'use strict';

['mobile.css','mobile-fix.css','mobile-touch-ui.css','event-sketchware.css','sketchware-logic.css','sketchware-logic-fix.css','alignment-guides.css','project-workspace.css','sketchware-size-dialog.css','sketchware-gravity-dialog.css','configuration-manager.css'].forEach(function(href){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  document.head.appendChild(link);
});

var files=['core-1.js','core-2.js','core-3.js','logic-1.js','logic-2.js','logic-3.js','bootstrap.js','mobile.js','mobile-fix.js','mobile-drag-fix.js','mobile-drag-final.js','event-sketchware.js','event-runtime.js','sketchware-list-blocks.js','sketchware-logic.js','sketchware-list-ui.js','sketchware-logic-fix.js','mobile-gesture-final.js','alignment-guides.js','project-workspace.js','sketchware-size-dialog.js','sketchware-gravity-dialog.js','sketchware-layout-gravity-dialog.js','configuration-manager.js'];
function loadNext(i){
  if(i>=files.length)return;
  var s=document.createElement('script');
  s.src=files[i];
  s.onload=function(){loadNext(i+1);};
  s.onerror=function(){
    console.error('Falha ao carregar '+files[i]);
    var el=document.getElementById('statusText');
    if(el)el.textContent='Erro ao carregar '+files[i];
  };
  document.head.appendChild(s);
}
loadNext(0);
})();
