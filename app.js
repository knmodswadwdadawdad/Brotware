(function(){
'use strict';

['mobile.css','mobile-fix.css'].forEach(function(href){
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  document.head.appendChild(link);
});

var files=['core-1.js','core-2.js','core-3.js','logic-1.js','logic-2.js','logic-3.js','bootstrap.js','mobile.js','mobile-fix.js'];
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
