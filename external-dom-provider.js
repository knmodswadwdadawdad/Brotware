(function(){
'use strict';

var rows=[],byRef={},byRuntime={},activeSelection=null,installed=false;
var ICONS={BODY:'▦',DIV:'□',SECTION:'▤',HEADER:'▱',NAV:'☷',MAIN:'▥',FOOTER:'▿',ARTICLE:'▧',ASIDE:'▥',BUTTON:'▣',INPUT:'⌨',TEXTAREA:'¶',SELECT:'▾',FORM:'▰',IMG:'▧',VIDEO:'▶',AUDIO:'♪',CANVAS:'◇',SVG:'◇',A:'↗',H1:'T',H2:'T',H3:'T',H4:'T',H5:'T',H6:'T',P:'¶',SPAN:'T',LABEL:'T',TABLE:'▦',DIALOG:'▱',IFRAME:'⌘'};
function hybrid(){return window.BrotwareExternalHybrid?BrotwareExternalHybrid.getState():{};}
function isActive(){var s=hybrid();return !!(s&&s.active&&s.projectId);}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function short(v,n){v=clean(v);return v.length>(n||70)?v.slice(0,(n||70)-1)+'…':v;}
function safeName(v){return clean(v).replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');}
function refFor(n){return n.bwId||('@dom:'+n.selector);}
function buildRows(tree){
  rows=[];byRef={};byRuntime={};var counts={};
  function walk(n,depth){if(!n)return;var tag=String(n.tag||'DIV').toUpperCase(),low=tag.toLowerCase();counts[low]=(counts[low]||0)+1;var generated=low+counts[low],friendly=n.id||safeName(n.name)||safeName(n.ariaLabel)||generated,ref=refFor(n),txt=short(n.text,80),row={runtimeId:n.runtimeId,ref:ref,depth:depth,tag:tag,id:n.id||'',classes:n.classes||'',selector:n.selector||'',bwId:n.bwId||'',name:friendly,text:txt,icon:ICONS[tag]||'□',subtitle:tag+(txt?' • '+txt:''),node:n};rows.push(row);byRef[ref]=row;byRuntime[row.runtimeId]=row;(n.children||[]).forEach(function(c){walk(c,depth+1);});}
  walk(tree,0);return rows;
}
function refresh(){var s=hybrid();if(!s.active){rows=[];byRef={};byRuntime={};return rows;}return buildRows(s.snapshot);}
function list(){if(!isActive())return[];if(!rows.length)refresh();return rows.slice();}
function logicViews(){return list().map(function(r){return{ref:r.ref,label:r.name,subtitle:r.subtitle,tag:r.tag,runtimeId:r.runtimeId,selector:r.selector,bwId:r.bwId};});}
function currentRef(){var s=hybrid();if(s.selection){var r=s.selection.bwId||('@dom:'+s.selection.selector);activeSelection=r;return r;}return activeSelection||state.externalSelectedRef||null;}
function selectedRuntime(){var s=hybrid();return s.selection&&s.selection.runtimeId||state.externalSelectedRuntime||null;}
function selectRuntime(id){var r=byRuntime[id]||list().find(function(x){return x.runtimeId===id;});if(!r)return;activeSelection=r.ref;state.externalSelectedRef=r.ref;state.externalSelectedRuntime=r.runtimeId;BrotwareExternalHybrid.selectRuntime(r.runtimeId);}
function selectRef(ref){var r=byRef[ref];activeSelection=ref;state.externalSelectedRef=ref;if(r)state.externalSelectedRuntime=r.runtimeId;BrotwareExternalHybrid.selectRef(ref);}
function labelFor(ref){var r=byRef[ref]||list().find(function(x){return x.ref===ref;});return r?r.name+(r.text?' · '+r.text:''):String(ref||'');}
function rowForRef(ref){return byRef[ref]||list().find(function(x){return x.ref===ref;})||null;}
function firstRef(){var a=list();return a.length?a[0].ref:'';}
function firstInputRef(){var r=list().find(function(x){return /^(INPUT|TEXTAREA|SELECT)$/.test(x.tag);});return r?r.ref:firstRef();}
function eventOptions(ref){var r=rowForRef(ref),tag=r?r.tag:'';if(tag==='INPUT'||tag==='TEXTAREA')return[['input','onInput'],['change','onChange'],['focus','onFocus'],['blur','onBlur'],['keydown','onKeyDown'],['keyup','onKeyUp'],['submit','onSubmit']];if(tag==='SELECT')return[['change','onChange'],['focus','onFocus'],['blur','onBlur']];if(tag==='FORM')return[['submit','onSubmit'],['change','onChange']];if(tag==='BUTTON'||tag==='A')return[['click','onClick'],['dblclick','onDoubleClick'],['longclick','onLongClick'],['focus','onFocus'],['blur','onBlur'],['mouseenter','onMouseEnter'],['mouseleave','onMouseLeave']];return[['click','onClick'],['dblclick','onDoubleClick'],['longclick','onLongClick'],['mouseenter','onMouseEnter'],['mouseleave','onMouseLeave'],['focus','onFocus'],['blur','onBlur']];}
function onSnapshot(e){if(!isActive())return;buildRows(e.detail&&e.detail.tree||hybrid().snapshot);if(window.BrotwareViewSelector&&BrotwareViewSelector.refresh)BrotwareViewSelector.refresh();if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();}
function onSelection(e){var x=e.detail||{};activeSelection=x.bwId||('@dom:'+x.selector);state.externalSelectedRef=activeSelection;state.externalSelectedRuntime=x.runtimeId;if(typeof refreshEventNodeSelect==='function')refreshEventNodeSelect();}
function install(){if(installed)return;installed=true;window.addEventListener('brotware:external-snapshot',onSnapshot);window.addEventListener('brotware:external-selection',onSelection);window.addEventListener('brotware:external-open',function(){refresh();});window.addEventListener('brotware:external-close',function(){rows=[];byRef={};byRuntime={};activeSelection=null;});}
window.BrotwareExternalDomProvider={isActive:isActive,refresh:refresh,list:list,logicViews:logicViews,currentRef:currentRef,selectedRuntime:selectedRuntime,selectRuntime:selectRuntime,selectRef:selectRef,labelFor:labelFor,rowForRef:rowForRef,firstRef:firstRef,firstInputRef:firstInputRef,eventOptions:eventOptions};
install();
})();