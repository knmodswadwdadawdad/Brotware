(function(){
'use strict';

var BW_ASSET_VERSION='20260808-native-shell-v2';
['mobile.css','mobile-fix.css','mobile-touch-ui.css','event-sketchware.css','sketchware-logic.css','sketchware-logic-fix.css','alignment-guides.css','project-workspace.css','sketchware-size-dialog.css','sketchware-gravity-dialog.css','configuration-manager.css','sketchware-image-resource-dialog.css','dialogs-system.css','dialogs-editor-fix.css','dialog-view-blocks.css','view-selector.css','layers-system.css','mobile-workspace-v2.css','mobile-properties-v2.css','mobile-quick-properties.css','color-picker.css','mobile-zoom-controls.css','numeric-property-dialogs.css','view-manager-v2.css','dialogs-editor-clean.css','text-property-dialog.css','desktop-unified-ui.css','professional-foundation.css','preview-studio.css','dialog-free-size.css','external-workspace.css','external-editor-navigation.css','external-native-adapter.css','external-native-parity.css','external-layers-reorder.css','external-native-behavior.css','external-native-shell-v2.css'].forEach(function(href){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href+'?v='+BW_ASSET_VERSION;
  document.head.appendChild(link);
});

var files=['core-1.js','core-2.js','core-3.js','logic-1.js','logic-2.js','logic-3.js','bootstrap.js','mobile.js','mobile-fix.js','mobile-drag-fix.js','mobile-drag-final.js','event-sketchware.js','event-runtime.js','sketchware-list-blocks.js','sketchware-logic.js','sketchware-list-ui.js','sketchware-logic-fix.js','mobile-gesture-final.js','alignment-guides.js','project-workspace.js','sketchware-size-dialog.js','sketchware-gravity-dialog.js','sketchware-layout-gravity-dialog.js','configuration-manager-v2.js','sketchware-image-resource-dialog.js','responsive-preview.js','preview-blob.js','dialogs-system.js','dialog-view-blocks.js','view-selector.js','layers-system.js','mobile-workspace-v2.js','mobile-properties-v2.js','mobile-quick-properties.js','color-picker.js','mobile-zoom-controls.js','numeric-property-dialogs.js','view-manager-v2.js','extra-design-elements.js','text-property-dialog.js','desktop-unified-ui.js','desktop-drag-coordinate-fix.js','absolute-margin-fix.js','match-parent-export-fix.js','container-padding-fix.js','component-library-v2.js','logic-professional-v2.js','logic-professional-event-fix.js','professional-foundation.js','view-manager-professional.js','preview-studio.js','dialog-free-size.js','vfs.js','zip-engine.js','project-format-v5.js','external-project-data-v5.js','external-preview.js','external-inspector.js','external-hybrid-runtime.js','external-script-inline-fix.js','external-dom-provider.js','universal-exporter.js','universal-importer.js','project-v5-integration.js','external-logic-provider.js','external-editor-navigation.js','external-native-adapter.js','external-native-parity.js','external-native-behavior.js','external-native-shell-v2.js','external-layers-reorder.js','importer-self-tests.js'];
function loadNext(i){
  if(i>=files.length)return;
  var s=document.createElement('script');
  s.src=files[i]+'?v='+BW_ASSET_VERSION;
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