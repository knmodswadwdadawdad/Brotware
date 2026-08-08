(function(){
'use strict';
if(!window.BrotwareRuntimeBase)return;
/* Extend exported-page runtime. The insertion point is before HTTP request. */
var baseRuntimeScript=window.BrotwareRuntimeBase||window.runtimeScriptForPage;
window.runtimeScriptForPage=function(page){
  var code=baseRuntimeScript(page),needle="else if(b.type==='fetch'){";
  var ext=[
    "else if(b.type==='changeVar'){vars[p.name]=(Number(vars[p.name])||0)+(Number(rv(p.delta))||0)}",
    "else if(b.type==='toggleVar'){var btv0=rv('$'+p.name);vars[p.name]=typeof btv0==='string'?btv0.toLowerCase()!=='true':!Boolean(btv0)}",
    "else if(b.type==='listInsert'){var bli=vars[p.name];if(!Array.isArray(bli)){bli=[];vars[p.name]=bli}var bix=Math.max(0,Math.min(bli.length,Number(rv(p.index))||0));bli.splice(bix,0,rv(p.value))}",
    "else if(b.type==='listSet'){var bls=vars[p.name];if(!Array.isArray(bls)){bls=[];vars[p.name]=bls}var bsx=Number(rv(p.index))||0;if(bsx>=0)bls[bsx]=rv(p.value)}",
    "else if(b.type==='listContains'){var blc=vars[p.name];if(!Array.isArray(blc)){blc=[];vars[p.name]=blc}vars[p.saveVar]=blc.indexOf(rv(p.value))>=0}",
    "else if(b.type==='listIndexOf'){var blio=vars[p.name];if(!Array.isArray(blio)){blio=[];vars[p.name]=blio}vars[p.saveVar]=blio.indexOf(rv(p.value))}",
    "else if(b.type==='listJoin'){var blj=vars[p.name];if(!Array.isArray(blj)){blj=[];vars[p.name]=blj}vars[p.saveVar]=blj.join(String(rv(p.separator)??''))}",
    "else if(b.type==='listShuffle'){var blsh=vars[p.name];if(!Array.isArray(blsh)){blsh=[];vars[p.name]=blsh}for(var bsi=blsh.length-1;bsi>0;bsi--){var bsj=Math.floor(Math.random()*(bsi+1)),bst=blsh[bsi];blsh[bsi]=blsh[bsj];blsh[bsj]=bst}}",
    "else if(b.type==='randomNumber'){var brmin=Math.ceil(Number(rv(p.min))||0),brmax=Math.floor(Number(rv(p.max))||0);if(brmax<brmin){var brt=brmin;brmin=brmax;brmax=brt}vars[p.saveVar]=Math.floor(Math.random()*(brmax-brmin+1))+brmin}",
    "else if(b.type==='roundNumber'){var brv=Number(rv(p.value))||0;vars[p.saveVar]=p.mode==='floor'?Math.floor(brv):p.mode==='ceil'?Math.ceil(brv):Math.round(brv)}",
    "else if(b.type==='absNumber'){vars[p.saveVar]=Math.abs(Number(rv(p.value))||0)}",
    "else if(b.type==='powerNumber'){vars[p.saveVar]=Math.pow(Number(rv(p.base))||0,Number(rv(p.exponent))||0)}",
    "else if(b.type==='sqrtNumber'){vars[p.saveVar]=Math.sqrt(Math.max(0,Number(rv(p.value))||0))}",
    "else if(b.type==='logicNot'){var bln=rv(p.value);vars[p.saveVar]=typeof bln==='string'?bln.toLowerCase()!=='true':!Boolean(bln)}",
    "else if(b.type==='logicAnd'){vars[p.saveVar]=Boolean(rv(p.left))&&Boolean(rv(p.right))}",
    "else if(b.type==='logicOr'){vars[p.saveVar]=Boolean(rv(p.left))||Boolean(rv(p.right))}",
    "else if(b.type==='textJoin'){vars[p.saveVar]=String(rv(p.left)??'')+String(rv(p.right)??'')}",
    "else if(b.type==='textLength'){vars[p.saveVar]=String(rv(p.value)??'').length}",
    "else if(b.type==='textReplace'){var btxt=String(rv(p.value)??''),bts=String(rv(p.search)??'');vars[p.saveVar]=bts?btxt.split(bts).join(String(rv(p.replacement)??'')):btxt}",
    "else if(b.type==='textUpper'){vars[p.saveVar]=String(rv(p.value)??'').toUpperCase()}",
    "else if(b.type==='textLower'){vars[p.saveVar]=String(rv(p.value)??'').toLowerCase()}",
    "else if(b.type==='textTrim'){vars[p.saveVar]=String(rv(p.value)??'').trim()}",
    "else if(b.type==='textSubstring'){var bsv=String(rv(p.value)??''),bss=Math.max(0,Number(rv(p.start))||0),bse=p.end===''?bsv.length:Number(rv(p.end));if(isNaN(bse))bse=bsv.length;vars[p.saveVar]=bsv.substring(bss,Math.max(bss,bse))}",
    "else if(b.type==='setAttribute'){e=t(p.target);if(e)e.setAttribute(p.name||'',String(rv(p.value)??''))}",
    "else if(b.type==='removeAttribute'){e=t(p.target);if(e)e.removeAttribute(p.name||'')}",
    "else if(b.type==='addClass'){n=q(p.target);if(n&&p.className)n.classList.add(p.className)}",
    "else if(b.type==='removeClass'){n=q(p.target);if(n&&p.className)n.classList.remove(p.className)}",
    "else if(b.type==='enableView'){e=t(p.target);n=q(p.target);if(e&&'disabled'in e)e.disabled=false;if(n){n.removeAttribute('aria-disabled');n.style.pointerEvents=''}}",
    "else if(b.type==='disableView'){e=t(p.target);n=q(p.target);if(e&&'disabled'in e)e.disabled=true;if(n){n.setAttribute('aria-disabled','true');n.style.pointerEvents='none'}}",
    "else if(b.type==='focusView'){e=t(p.target);if(e&&e.focus)e.focus()}",
    "else if(b.type==='scrollToView'){n=q(p.target);if(n&&n.scrollIntoView)n.scrollIntoView({behavior:'smooth',block:'center'})}",
    "else if(b.type==='copyClipboard'){var bcp=String(rv(p.value)??'');try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(bcp)}catch(_){}}",
    "else if(b.type==='vibrate'){if(navigator.vibrate)navigator.vibrate(Math.max(0,Math.min(10000,Number(rv(p.ms))||0)))}",
    "else if(b.type==='timestamp'){vars[p.saveVar]=Date.now()}",
    "else if(b.type==='reloadPage'){location.reload()}"
  ].join('');
  return code.indexOf(needle)>=0?code.replace(needle,function(){return ext+needle;}):code;
};
})();