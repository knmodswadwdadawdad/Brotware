(function(){
'use strict';
var STORE_KEY='brotware_projects_v1',ACTIVE_KEY='brotware_active_project_v1',SETTINGS_PREFIX='brotware_project_settings_v1:',last='';
function store(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{"projects":[]}');}catch(_){return{projects:[]};}}
function ensurePreviewStyle(){if(document.getElementById('bwProjectThemePreviewStyle'))return;var s=document.createElement('style');s.id='bwProjectThemePreviewStyle';s.textContent='#rootLayout .node-button:not([style*="background"]){background:var(--colorPrimary,#6567f4)}#rootLayout .node-link:not([style*="color"]){color:var(--colorAccent,#126ec5)}#rootLayout .node-progress i:not([style*="background"]){background:var(--colorAccent,#6567f4)}';document.head.appendChild(s);}
function sync(){ensurePreviewStyle();var api=window.BrotwareProjectSettings,id=localStorage.getItem(ACTIVE_KEY)||'';if(!api||!id)return;if(id===last)return;last=id;var has=localStorage.getItem(SETTINGS_PREFIX+id),st=store(),rec=Array.isArray(st.projects)?st.projects.find(function(p){return p.id===id;}):null,s=api.read(id);if(!has&&rec&&!rec.settings&&!(rec.data&&rec.data.projectSettings))s.applicationName=rec.name||s.applicationName;api.persist(s,id);api.apply(s);}
setInterval(sync,400);setTimeout(sync,0);setTimeout(sync,1200);
})();