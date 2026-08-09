(function(){
'use strict';
var STORE_KEY='brotware_projects_v1',ACTIVE_KEY='brotware_active_project_v1';
var pairs=[['fontSize:','font-size:'],['fontWeight:','font-weight:'],['justifyContent:','justify-content:'],['borderRadius:','border-radius:'],['boxShadow:','box-shadow:'],['lineHeight:','line-height:']];
function norm(s){s=String(s||'');pairs.forEach(function(p){s=s.split(p[0]).join(p[1]);});return s;}
function normalizeDom(root){(root||document).querySelectorAll('[style]').forEach(function(n){var s=n.getAttribute('style')||'',x=norm(s);if(x!==s)n.setAttribute('style',x);});}
function normalizeActiveProject(){try{var id=localStorage.getItem(ACTIVE_KEY),store=JSON.parse(localStorage.getItem(STORE_KEY)||'{"projects":[]}'),p=(store.projects||[]).find(function(x){return x.id===id;});if(!p||!p.data||!Array.isArray(p.data.pages))return;var changed=false;p.data.pages.forEach(function(pg){var x=norm(pg.content||'');if(x!==pg.content){pg.content=x;changed=true;}});if(changed)localStorage.setItem(STORE_KEY,JSON.stringify(store));}catch(_){} }
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('[data-template-id]'))setTimeout(normalizeActiveProject,0);},true);
var mo=new MutationObserver(function(m){m.forEach(function(x){x.addedNodes.forEach(function(n){if(n.nodeType===1)normalizeDom(n);});});});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){normalizeDom(document);},0);
})();