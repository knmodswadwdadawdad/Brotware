(function(){
'use strict';

['mobile.css','mobile-fix.css','mobile-touch-ui.css','event-sketchware.css','sketchware-logic.css','sketchware-logic-fix.css','alignment-guides.css','project-workspace.css','sketchware-size-dialog.css','sketchware-gravity-dialog.css','configuration-manager.css','sketchware-image-resource-dialog.css','dialogs-system.css','dialogs-editor-fix.css','dialog-view-blocks.css','view-selector.css','layers-system.css','mobile-workspace-v2.css','mobile-properties-v2.css'].forEach(function(href){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  document.head.appendChild(link);
});

var files=['core-1.js','core-2.js','core-3.js','logic-1.js','logic-2.js','logic-3.js','bootstrap.js','mobile.js','mobile-fix.js','mobile-drag-fix.js','mobile-drag-final.js','event-sketchware.js','event-runtime.js','sketchware-list-blocks.js','sketchware-logic.js','sketchware-list-ui.js','sketchware-logic-fix.js','mobile-gesture-final.js','alignment-guides.js','project-workspace.js','sketchware-size-dialog.js','sketchware-gravity-dialog.js','sketchware-layout-gravity-dialog.js','configuration-manager-v2.js','sketchware-image-resource-dialog.js','responsive-preview.js','preview-blob.js','dialogs-system.js','dialog-view-blocks.js','view-selector.js','layers-system.js','mobile-workspace-v2.js','mobile-properties-v2.js'];
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
