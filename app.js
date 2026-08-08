(function(){
'use strict';

/*
 * Native-only runtime.
 * External/hybrid importer files are intentionally kept in the repository for
 * reference, but are no longer loaded by the production editor.
 */
['mobile.css','mobile-fix.css','mobile-touch-ui.css','event-sketchware.css','sketchware-logic.css','sketchware-logic-fix.css','sketchware-block-shapes.css','sketchware-block-layout-v2.css','sketchware-block-layout-v3.css','sketchware-typed-sockets.css','alignment-guides.css','project-workspace.css','project-create-v2.css','sketchware-size-dialog.css','sketchware-gravity-dialog.css','configuration-manager.css','sketchware-image-resource-dialog.css','dialogs-system.css','dialogs-editor-fix.css','dialog-view-blocks.css','view-selector.css','layers-system.css','mobile-workspace-v2.css','mobile-properties-v2.css','mobile-quick-properties.css','color-picker.css','mobile-zoom-controls.css','numeric-property-dialogs.css','view-manager-v2.css','dialogs-editor-clean.css','text-property-dialog.css','desktop-unified-ui.css','professional-foundation.css','preview-studio.css','dialog-free-size.css','mobile-ui-stability-fix.css','google-ui-icons.css','sketchware-logic-stability-v5.css','functional-components.css','functional-component-events.css','firebase-components.css','component-workspace-v3.css','moreblock-builder-v2.css','event-dialog-polish.css'].forEach(function(href){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  document.head.appendChild(link);
});

var files=['core-1.js','core-2.js','core-3.js','project-state-extensions.js','logic-1.js','logic-2.js','logic-3.js','bootstrap.js','mobile.js','mobile-fix.js','mobile-drag-fix.js','mobile-drag-final.js','event-sketchware.js','event-runtime.js','sketchware-list-blocks.js','sketchware-logic.js','sketchware-block-assets.js','sketchware-block-layout-v2.js','sketchware-block-layout-v3.js','sketchware-block-graph.js','sketchware-connection-engine.js','sketchware-typed-sockets.js','sketchware-list-ui.js','sketchware-runtime-base-capture.js','sketchware-standard-blocks.js','sketchware-standard-runtime-fix.js','sketchware-extra-sockets.js','sketchware-unified-drag-v3.js','mobile-gesture-final.js','alignment-guides.js','project-workspace.js','project-create-v2.js','sketchware-size-dialog.js','sketchware-gravity-dialog.js','sketchware-layout-gravity-dialog.js','configuration-manager-v2.js','sketchware-image-resource-dialog.js','responsive-preview.js','preview-blob.js','dialogs-system.js','dialog-view-blocks.js','view-selector.js','layers-system.js','mobile-workspace-v2.js','mobile-properties-v2.js','mobile-quick-properties.js','color-picker.js','mobile-zoom-controls.js','numeric-property-dialogs.js','view-manager-v2.js','extra-design-elements.js','text-property-dialog.js','desktop-unified-ui.js','desktop-drag-coordinate-fix.js','absolute-margin-fix.js','match-parent-export-fix.js','container-padding-fix.js','component-library-v2.js','functional-components.js','functional-components-fix.js','functional-component-events.js','firebase-components.js','component-workspace-v4.js','logic-professional-v2.js','logic-professional-event-fix.js','logic-legacy-screen-guard.js','logic-back-navigation-fix.js','moreblock-builder-v2.js','moreblock-sockets-v2.js','moreblock-plus-button.js','professional-foundation.js','view-manager-professional.js','preview-studio.js','dialog-free-size.js','native-only-mode.js','mobile-chrome-guard.js','google-ui-icons.js','event-dialog-polish.js','project-settings-export.js','project-settings-polish.js'];

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