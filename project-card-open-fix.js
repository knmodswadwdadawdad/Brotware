(function(){
'use strict';

function isHomeVisible(){var h=document.getElementById('bwProjectHome');return !!(h&&h.classList.contains('show'));}
function isActionTarget(t){return !!(t&&t.closest&&(
  t.closest('.bw-project-more')||
  t.closest('.bw-project-menu')||
  t.closest('[data-project-action]')||
  t.closest('#bwProjectActionBackdrop')||
  t.closest('#bwProjectDeleteBackdrop')||
  t.closest('#bwProjectSettingsBackdrop')
));}
function openCard(card){
  if(!card||!window.BrotwareProjects||typeof BrotwareProjects.open!=='function')return;
  var id=card.dataset.projectId;if(!id)return;
  document.querySelectorAll('.bw-project-card.menu-open').forEach(function(c){c.classList.remove('menu-open');});
  BrotwareProjects.open(id);
}
function onClick(e){
  if(!isHomeVisible()||isActionTarget(e.target))return;
  var card=e.target&&e.target.closest?e.target.closest('#bwProjectList .bw-project-card[data-project-id]'):null;
  if(!card)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openCard(card);
}

/* Capture phase is intentional: older Home modules also listen on the list/card.
 * This gives project opening one authoritative path while preserving the ... menu. */
document.addEventListener('click',onClick,true);
window.BrotwareProjectCardOpenFix={open:openCard};
})();
