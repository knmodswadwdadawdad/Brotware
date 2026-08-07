(function(){
'use strict';

var installed=false;
var CARDS=[
  ['sidebar','▥','Sidebar','Menu lateral com navegação'],['bottomNav','▁','Bottom Navigation','Navegação inferior'],['signup','✚','Cadastro','Formulário de cadastro'],['form','⌨','Formulário','Campos e botão de envio'],['toastComponent','▰','Toast','Mensagem de feedback'],['tabsComponent','▤','Tabs','Navegação por abas'],['accordion','≡','Accordion','Seção expansível'],['carousel','◫','Carousel','Destaques em sequência'],['productCard','▱','Product Card','Imagem, preço e CTA'],['productGrid','▦','Grid de produtos','Grade com cards'],['dashboard','▥','Dashboard','Resumo com métricas'],['loading','◌','Loading','Estado de carregamento'],['emptyState','◇','Empty State','Estado sem conteúdo']
];

function t(el){return typeof contentTarget==='function'?contentTarget(el):el;}
function txt(el,value){if(typeof setText==='function')setText(el,value);return el;}
function bg(el,value){var x=t(el);if(x)x.style.background=value;return el;}
function color(el,value){var x=t(el);if(x)x.style.color=value;return el;}
function weight(el,value){var x=t(el);if(x)x.style.fontWeight=value;return el;}
function font(el,value){var x=t(el);if(x)x.style.fontSize=value;return el;}
function radius(el,value){var x=t(el);if(x)x.style.borderRadius=value;return el;}
function size(el,w,h){if(w!=null)el.style.width=typeof w==='number'?w+'px':w;if(h!=null)el.style.height=typeof h==='number'?h+'px':h;return el;}
function pos(el,x,y){el.style.left=x+'px';el.style.top=y+'px';return el;}
function matchWidth(el){el.dataset.widthMode='match_parent';el.style.width='100%';if(window.BrotwareAbsoluteMarginFix&&BrotwareAbsoluteMarginFix.reapply)BrotwareAbsoluteMarginFix.reapply(el);return el;}
function card(x,y,w,h,parent){return size(createNode('card',x,y,parent||root,true),w,h);}
function relative(x,y,w,h,parent){return size(createNode('relative',x,y,parent||root,true),w,h);}
function text(x,y,w,h,value,parent){var e=size(createNode('text',x,y,parent||root,true),w,h);txt(e,value);return e;}
function button(x,y,w,h,value,parent){var e=size(createNode('button',x,y,parent||root,true),w,h);txt(e,value);return e;}
function input(x,y,w,h,placeholder,parent){var e=size(createNode('input',x,y,parent||root,true),w,h);var c=t(e);if(c)c.placeholder=placeholder||'';return e;}
function finish(el){selectNode(el.dataset.vfId);commit();if(typeof switchTab==='function')switchTab('view');return el;}

function sidebar(){
  var c=relative(20,20,250,480);bg(c,'#111827');radius(c,'16px');
  var brand=text(20,22,190,40,'BROTWARE',c);color(brand,'#ffffff');weight(brand,'800');font(brand,'20px');
  ['Dashboard','Projetos','Relatórios','Configurações'].forEach(function(label,i){var b=button(18,90+i*58,210,42,label,c);bg(b,i===0?'#6567f4':'#1f2937');});
  return finish(c);
}
function bottomNav(){
  var c=relative(20,20,360,74);bg(c,'#111827');radius(c,'18px');
  ['Início','Buscar','Perfil'].forEach(function(label,i){var b=button(12+i*116,14,104,46,label,c);bg(b,i===0?'#6567f4':'#1f2937');});
  return finish(c);
}
function signup(){
  var c=card(20,20,340,430);var title=text(28,25,270,42,'Criar conta',c);font(title,'25px');weight(title,'800');
  input(28,90,284,42,'Nome',c);input(28,148,284,42,'Email',c);input(28,206,284,42,'Senha',c);input(28,264,284,42,'Confirmar senha',c);button(28,338,284,46,'Cadastrar',c);return finish(c);
}
function form(){
  var c=card(20,20,380,360);var title=text(24,22,320,38,'Entre em contato',c);weight(title,'800');font(title,'22px');input(24,82,332,42,'Seu nome',c);input(24,138,332,42,'Seu email',c);var area=size(createNode('textarea',24,194,c,true),332,82);var ct=t(area);if(ct)ct.placeholder='Mensagem';button(24,292,160,44,'Enviar',c);return finish(c);
}
function toastComponent(){var c=card(20,20,340,82);bg(c,'#111827');var title=text(18,15,260,24,'Alterações salvas',c);color(title,'#ffffff');weight(title,'800');var sub=text(18,42,285,24,'Seu projeto foi atualizado com sucesso.',c);color(sub,'#a9bac6');return finish(c);}
function tabsComponent(){var c=relative(20,20,380,180);var bar=relative(12,12,356,48,c);bg(bar,'#eef2f7');['Visão geral','Detalhes','Histórico'].forEach(function(label,i){var b=button(6+i*116,6,110,36,label,bar);bg(b,i===0?'#6567f4':'#dce4ec');if(i!==0)color(b,'#334155');});var content=text(20,82,330,70,'Conteúdo da aba selecionada.',c);return finish(c);}
function accordion(){var c=card(20,20,380,210);var h=button(18,18,344,44,'O que é a Brotware?',c);bg(h,'#eef2f7');color(h,'#1f2937');var body=text(20,78,338,105,'Uma ferramenta visual para criar páginas web e lógica com blocos, sem precisar começar pelo código.',c);return finish(c);}
function carousel(){var c=relative(20,20,420,220);for(var i=0;i<3;i++){var x=card(10+i*135,20,125,170,c);bg(x,i===1?'#eef2ff':'#ffffff');var n=text(12,16,100,26,'Slide '+(i+1),x);weight(n,'800');text(12,55,100,70,'Conteúdo do destaque.',x);}return finish(c);}
function productCard(){var c=card(20,20,270,360);var im=size(createNode('image',18,18,c,true),234,165);var name=text(18,200,225,32,'Produto',c);weight(name,'800');font(name,'19px');var price=text(18,240,220,32,'R$ 99,90',c);weight(price,'800');font(price,'22px');button(18,294,234,44,'Comprar',c);return finish(c);}
function productGrid(){var c=relative(20,20,590,410);for(var i=0;i<4;i++){var x=card(12+(i%2)*286,12+Math.floor(i/2)*196,274,184,c);var im=size(createNode('image',12,12,x,true),92,92);var name=text(118,20,130,28,'Produto '+(i+1),x);weight(name,'800');text(118,55,130,24,'R$ '+(49+i*20)+',90',x);button(118,102,130,38,'Ver produto',x);}return finish(c);}
function dashboard(){var c=relative(20,20,620,390);var title=text(18,15,400,42,'Dashboard',c);font(title,'26px');weight(title,'800');['Usuários','Vendas','Conversão'].forEach(function(label,i){var k=card(18+i*196,75,180,115,c);text(14,14,145,25,label,k);var v=text(14,48,145,42,i===0?'1.248':i===1?'R$ 8.420':'6,8%',k);font(v,'24px');weight(v,'800');});var graph=card(18,215,570,145,c);text(18,15,280,28,'Atividade recente',graph);var bar=relative(18,58,520,55,graph);bg(bar,'linear-gradient(90deg,#6567f4 65%,#e5e7eb 65%)');radius(bar,'10px');return finish(c);}
function loading(){var c=relative(20,20,280,150);var icon=text(105,24,70,55,'◌',c);font(icon,'38px');var label=text(55,90,180,30,'Carregando...',c);weight(label,'700');return finish(c);}
function emptyState(){var c=card(20,20,380,270);var icon=text(145,35,90,60,'◇',c);font(icon,'42px');var title=text(75,105,230,36,'Nenhum item ainda',c);weight(title,'800');font(title,'20px');var sub=text(55,145,270,50,'Quando você adicionar conteúdo, ele aparecerá aqui.',c);button(105,205,170,42,'Adicionar item',c);return finish(c);}

function installFunctions(){
  if(!window.builtinComponents)return false;
  builtinComponents.sidebar=sidebar;builtinComponents.bottomNav=bottomNav;builtinComponents.signup=signup;builtinComponents.form=form;builtinComponents.toastComponent=toastComponent;builtinComponents.tabsComponent=tabsComponent;builtinComponents.accordion=accordion;builtinComponents.carousel=carousel;builtinComponents.productCard=productCard;builtinComponents.productGrid=productGrid;builtinComponents.dashboard=dashboard;builtinComponents.loading=loading;builtinComponents.emptyState=emptyState;return true;
}
function injectDesktopCards(){var grid=document.getElementById('builtinComponents');if(!grid)return;CARDS.forEach(function(c){if(grid.querySelector('[data-component="'+c[0]+'"]'))return;var b=document.createElement('button');b.className='component-card';b.type='button';b.dataset.component=c[0];b.innerHTML='<span>'+c[1]+'</span><b>'+c[2]+'</b><small>'+c[3]+'</small>';b.onclick=function(){var fn=builtinComponents[c[0]];if(fn)fn();};grid.appendChild(b);});}
function injectAddSheet(){
  var title=document.getElementById('bwMobileSheetTitle'),body=document.getElementById('bwMobileSheetBody');if(!title||!body||String(title.textContent||'').trim().toLowerCase()!=='adicionar'||body.querySelector('.bw-pro-components'))return;
  var wrap=document.createElement('div');wrap.className='bw-pro-components';var html='<div class="bw-mobile-section-title">Componentes prontos</div><div class="bw-mobile-add-grid">';CARDS.slice(0,10).forEach(function(c){html+='<button class="bw-mobile-add-item" type="button" data-bw-pro-component="'+c[0]+'"><span class="ico">'+c[1]+'</span><b>'+c[2]+'</b></button>';});html+='</div>';wrap.innerHTML=html;body.appendChild(wrap);
}
function installSheet(){var body=document.getElementById('bwMobileSheetBody');if(body)new MutationObserver(function(){setTimeout(injectAddSheet,0);}).observe(body,{subtree:true,childList:true});document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bw-pro-component]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();var fn=builtinComponents[b.dataset.bwProComponent];if(fn)fn();var close=document.getElementById('bwMobileSheetClose');if(close)close.click();},true);}
function install(){if(installed)return;if(!installFunctions()){setTimeout(install,100);return;}installed=true;injectDesktopCards();installSheet();setTimeout(injectDesktopCards,500);}

window.BrotwareComponentLibrary={refresh:function(){installFunctions();injectDesktopCards();injectAddSheet();},cards:CARDS};
setTimeout(install,0);setTimeout(install,500);
})();
