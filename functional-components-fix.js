(function(){
'use strict';

/* Small compatibility patch kept separate so the functional-components core
   stays easy to roll back while the feature is being expanded. */
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('[data-fc-del]'):null;
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  if(window.BrotwareFunctionalComponents&&BrotwareFunctionalComponents.remove)BrotwareFunctionalComponents.remove(b.dataset.fcDel);
},true);

/* functional-components.js already extends the generated runtime. Complete
   FilePicker here because exported pages need the same behavior as Preview. */
var previous=window.runtimeScriptForPage;
if(previous)window.runtimeScriptForPage=function(page){
  var code=previous(page),needle="else if(b.type==='fcNotify'){";
  var ext="else if(b.type==='fcFilePick'){var fi=document.createElement('input');fi.type='file';fi.accept=p.accept||'*/*';fi.style.display='none';document.body.appendChild(fi);var ff=await new Promise(function(rs){fi.onchange=function(){rs(fi.files&&fi.files[0]||null)};fi.click()});if(p.saveVar)vars[p.saveVar]=ff?{name:ff.name,size:ff.size,type:ff.type}:null;fi.remove()}"+
  ";";
  return code.indexOf(needle)>=0?code.replace(needle,ext+needle):code;
};
})();
