(function(){
'use strict';
function has(arr,key){return (arr||[]).some(function(x){return x[0]===key;});}
/* Button must keep using EVENT_OPTIONS.default so onClick/onFocus/etc are not replaced. */
if(EVENT_OPTIONS.button&&EVENT_OPTIONS.button.length===1&&EVENT_OPTIONS.button[0][0]==='longclick')delete EVENT_OPTIONS.button;
/* TextArea should behave like Input, with onSubmit added instead of replacing the list. */
var textarea=(EVENT_OPTIONS.input||EVENT_OPTIONS.default||[]).map(function(x){return[x[0],x[1]];});
if(!has(textarea,'submit'))textarea.push(['submit','onSubmit']);
EVENT_OPTIONS.textarea=textarea;
if(typeof refreshEventTypes==='function')setTimeout(refreshEventTypes,0);
})();
