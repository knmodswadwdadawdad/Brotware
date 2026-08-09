(function(){
'use strict';

var STORE_KEY='brotware_projects_v1';
var ACTIVE_KEY='brotware_active_project_v1';
var SETTINGS_PREFIX='brotware_project_settings_v1:';
var templateView=null,listObserver=null,decorating=false;

function icon(name){return'<span class="bw-google-icon">'+name+'</span>';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];});}
function clone(v){return JSON.parse(JSON.stringify(v));}
function uid(prefix){return(prefix||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
function slug(v){var s=String(v||'project').trim().toLowerCase();try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(_){}return s.replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'project';}
function readStore(){try{var s=JSON.parse(localStorage.getItem(STORE_KEY)||'null');return s&&Array.isArray(s.projects)?s:{version:1,projects:[]};}catch(_){return{version:1,projects:[]};}}
function writeStore(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function projectById(id,s){s=s||readStore();return s.projects.find(function(p){return p.id===id;})||null;}
function settingsFor(id,p){if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.read==='function')return BrotwareProjectSettings.read(id);try{return JSON.parse(localStorage.getItem(SETTINGS_PREFIX+id)||'null')||(p&&p.settings)||{};}catch(_){return(p&&p.settings)||{};}}
function block(type,props,children,elseChildren){return{id:uid('block'),type:type,props:props||{},children:children||[],elseChildren:elseChildren||[]};}
function styleObj(o){return Object.keys(o||{}).map(function(k){return k+':'+o[k];}).join(';');}
function node(type,id,x,y,w,h,innerStyle,text,extraOuter){
  var inner='';
  if(type==='text')inner='<div class="node-text vf-content" style="'+styleObj(innerStyle)+'">'+esc(text||'')+'</div>';
  else if(type==='button')inner='<button class="node-button vf-content" style="'+styleObj(innerStyle)+'">'+esc(text||'Button')+'</button>';
  else if(type==='input')inner='<input class="node-input vf-content" style="'+styleObj(innerStyle)+'" placeholder="'+esc(text||'')+'">';
  else if(type==='card')inner='<div class="node-card vf-content" style="'+styleObj(innerStyle)+'"></div><div class="node-layout-label">CardView</div>';
  else inner='<div class="node-layout vf-content" style="'+styleObj(innerStyle)+'"></div>';
  return'<div class="vf-node" data-type="'+type+'" data-vf-id="'+id+'" style="position:absolute;left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;'+(extraOuter||'')+'">'+inner+'</div>';
}
function page(name,title,bg,content,events){return{id:uid('page'),name:name,title:title,background:bg,content:content,events:events||{'@page':{load:[]}},enabledEvents:['load'],createdAt:Date.now(),updatedAt:Date.now()};}
function projectData(name,pages,variables){return{version:5,projectName:name,pages:pages,currentPageId:pages[0].id,strings:{app_name:name},variables:variables||{counter:0},functions:[],components:[],functionalComponents:[],libraryManager:{},firebaseConfig:{},counter:30};}
function theme(app,accent,primary,dark){return{applicationName:app,icon:'',theme:{preset:'template',accent:accent,primary:primary,primaryDark:dark},versionCode:1,versionName:'1.0',createdWith:'Brotware'};}

function storeTemplate(){
  var c='';
  c+=node('text','storeTitle',18,18,245,42,{fontSize:'26px',fontWeight:'800',color:'#111827'},'Brot Store');
  c+=node('text','cartLabel',282,18,72,20,{fontSize:'11px',fontWeight:'700',color:'#667085'},'CARRINHO');
  c+=node('text','cartValue',314,40,42,32,{fontSize:'24px',fontWeight:'800',color:'#6d55d9',justifyContent:'center'},'0');
  c+=node('card','heroCard',16,82,358,96,{background:'linear-gradient(135deg,#6d55d9,#8d72ff)',border:'0',borderRadius:'18px',boxShadow:'0 14px 30px rgba(70,50,160,.25)'},'');
  c+=node('text','heroText',34,98,290,34,{fontSize:'20px',fontWeight:'800',color:'#ffffff'},'Produtos em destaque');
  c+=node('text','heroSub',34,132,300,25,{fontSize:'11px',color:'#eeeaff'},'Template funcional: adicione itens ao carrinho.');
  c+=node('card','card1',16,198,172,190,{background:'#ffffff',border:'1px solid #e5e7eb',borderRadius:'16px',boxShadow:'0 8px 20px rgba(17,24,39,.08)'},'');
  c+=node('text','p1name',30,218,135,28,{fontSize:'15px',fontWeight:'800',color:'#111827'},'Camiseta');
  c+=node('text','p1price',30,255,120,26,{fontSize:'19px',fontWeight:'800',color:'#6d55d9'},'R$ 49,90');
  c+=node('text','p1desc',30,286,130,32,{fontSize:'9px',color:'#667085'},'Confortável e básica.');
  c+=node('button','add1',29,330,145,42,{background:'#6d55d9',borderRadius:'10px'},'Adicionar');
  c+=node('card','card2',202,198,172,190,{background:'#ffffff',border:'1px solid #e5e7eb',borderRadius:'16px',boxShadow:'0 8px 20px rgba(17,24,39,.08)'},'');
  c+=node('text','p2name',216,218,135,28,{fontSize:'15px',fontWeight:'800',color:'#111827'},'Tênis');
  c+=node('text','p2price',216,255,120,26,{fontSize:'19px',fontWeight:'800',color:'#6d55d9'},'R$ 129,90');
  c+=node('text','p2desc',216,286,130,32,{fontSize:'9px',color:'#667085'},'Leve para o dia a dia.');
  c+=node('button','add2',215,330,145,42,{background:'#6d55d9',borderRadius:'10px'},'Adicionar');
  c+=node('button','checkout',16,410,358,48,{background:'#111827',borderRadius:'12px'},'Finalizar pedido');
  c+=node('text','storeHint',20,476,350,30,{fontSize:'10px',color:'#667085',justifyContent:'center'},'Os botões já possuem lógica no evento onClick.');
  function addBlocks(){return[block('math',{name:'cartCount',left:'$cartCount',op:'+',right:'1'}),block('setText',{target:'cartValue',value:'$cartCount'}),block('storageSet',{key:'brotware_demo_cart',value:'$cartCount'})];}
  var ev={'@page':{load:[]},add1:{click:addBlocks()},add2:{click:addBlocks()},checkout:{click:[block('alert',{message:'Pedido de demonstração criado!'})]}};
  var p=page('index.html','Loja Básica','#f8fafc',c,ev);return{data:projectData('Loja Básica',[p],{cartCount:0}),settings:theme('Brot Store','#f59e0b','#6d55d9','#2f235f')};
}
function loginTemplate(){
  var c='';
  c+=node('card','loginCard',25,70,340,430,{background:'#ffffff',border:'1px solid #e4e7ec',borderRadius:'22px',boxShadow:'0 18px 45px rgba(16,24,40,.12)'},'');
  c+=node('text','loginTitle',48,104,285,40,{fontSize:'27px',fontWeight:'800',color:'#101828'},'Entrar');
  c+=node('text','loginSub',48,148,285,38,{fontSize:'11px',color:'#667085'},'Login demonstrativo com validação visual.');
  c+=node('input','emailInput',48,214,285,48,{background:'#f9fafb',border:'1px solid #d0d5dd',borderRadius:'10px'},'Seu e-mail');
  c+=node('input','passwordInput',48,278,285,48,{background:'#f9fafb',border:'1px solid #d0d5dd',borderRadius:'10px'},'Sua senha');
  c+=node('button','loginButton',48,350,285,48,{background:'#2679d8',borderRadius:'11px'},'Entrar');
  c+=node('text','loginStatus',48,418,285,44,{fontSize:'11px',fontWeight:'700',color:'#2679d8',justifyContent:'center'},'Preencha os campos para testar.');
  var ok=[block('setText',{target:'loginStatus',value:'Login de demonstração realizado ✓'}),block('storageSet',{key:'brotware_demo_email',value:'$email'})];
  var no=[block('setText',{target:'loginStatus',value:'Digite seu e-mail para continuar.'})];
  var ev={'@page':{load:[]},loginButton:{click:[block('readInput',{source:'emailInput',name:'email'}),block('if',{left:'$email',op:'truthy',right:''},ok,no)]}};
  var p=page('index.html','Login Demo','#f2f4f7',c,ev);return{data:projectData('Login Demo',[p],{email:''}),settings:theme('Login Demo','#11cfc8','#2679d8','#174b91')};
}
function landingTemplate(){
  var c='';
  c+=node('text','brand',20,22,160,32,{fontSize:'20px',fontWeight:'900',color:'#0f172a'},'NovaStudio');
  c+=node('text','navText',252,28,120,22,{fontSize:'10px',fontWeight:'700',color:'#64748b',justifyContent:'flex-end'},'SOBRE  •  CONTATO');
  c+=node('text','headline',20,108,350,95,{fontSize:'36px',fontWeight:'900',color:'#0f172a',lineHeight:'1.05'},'Sites simples. Resultados grandes.');
  c+=node('text','subtitle',20,220,340,62,{fontSize:'13px',color:'#64748b',lineHeight:'1.5'},'Uma landing page pronta para apresentar seu produto e captar clientes.');
  c+=node('button','ctaButton',20,305,185,50,{background:'#0f766e',borderRadius:'12px'},'Quero conhecer');
  c+=node('card','contactPanel',20,390,350,150,{background:'#0f172a',border:'0',borderRadius:'18px'},'', 'display:none;');
  c+=node('text','contactTitle',40,414,300,30,{fontSize:'18px',fontWeight:'800',color:'#ffffff'},'Vamos conversar?','display:none;');
  c+=node('text','contactText',40,455,300,48,{fontSize:'11px',color:'#cbd5e1'},'contato@novastudio.dev\nResposta em até 1 dia útil.','display:none;');
  var ev={'@page':{load:[]},ctaButton:{click:[block('show',{target:'contactPanel'}),block('show',{target:'contactTitle'}),block('show',{target:'contactText'})]}};
  var p=page('index.html','Landing Page','#ffffff',c,ev);return{data:projectData('Landing Page',[p],{}),settings:theme('NovaStudio','#14b8a6','#0f766e','#042f2e')};
}
function portfolioTemplate(){
  var c='';
  c+=node('text','portfolioName',22,26,250,40,{fontSize:'25px',fontWeight:'900',color:'#111827'},'Alex Designer');
  c+=node('text','portfolioRole',22,70,310,30,{fontSize:'12px',color:'#6b7280'},'UI Designer • Front-end • Criativo');
  c+=node('card','work1',22,135,346,120,{background:'#18181b',border:'0',borderRadius:'18px'},'');
  c+=node('text','work1Title',42,158,290,30,{fontSize:'18px',fontWeight:'800',color:'#ffffff'},'Projeto Aurora');
  c+=node('text','work1Text',42,196,285,35,{fontSize:'10px',color:'#d4d4d8'},'Identidade visual e landing page.');
  c+=node('card','work2',22,275,346,120,{background:'#4f46e5',border:'0',borderRadius:'18px'},'');
  c+=node('text','work2Title',42,298,290,30,{fontSize:'18px',fontWeight:'800',color:'#ffffff'},'Projeto Atlas');
  c+=node('text','work2Text',42,336,285,35,{fontSize:'10px',color:'#e0e7ff'},'Dashboard responsivo para SaaS.');
  c+=node('button','portfolioButton',22,425,180,48,{background:'#111827',borderRadius:'11px'},'Ver disponibilidade');
  c+=node('text','portfolioStatus',22,495,345,38,{fontSize:'11px',fontWeight:'700',color:'#4f46e5'},'Disponível para novos projetos.');
  var ev={'@page':{load:[]},portfolioButton:{click:[block('setText',{target:'portfolioStatus',value:'✓ Agenda aberta — fale comigo!'})]}};
  var p=page('index.html','Portfólio','#fafafa',c,ev);return{data:projectData('Portfólio',[p],{}),settings:theme('Alex Designer','#8b5cf6','#4f46e5','#312e81')};
}

var TEMPLATES=[
  {id:'store',name:'Loja Básica',desc:'2 produtos, carrinho e botões com lógica pronta.',icon:'storefront',build:storeTemplate},
  {id:'login',name:'Login Demo',desc:'Formulário com validação e eventos configurados.',icon:'login',build:loginTemplate},
  {id:'landing',name:'Landing Page',desc:'Hero, CTA e seção de contato interativa.',icon:'rocket_launch',build:landingTemplate},
  {id:'portfolio',name:'Portfólio',desc:'Projetos, apresentação e CTA interativo.',icon:'work',build:portfolioTemplate}
];

function uniqueName(base,s){var name=base,i=2;while(s.projects.some(function(p){return String(p.name).toLowerCase()===name.toLowerCase();}))name=base+' '+(i++);return name;}
function useTemplate(id){
  var t=TEMPLATES.find(function(x){return x.id===id;});if(!t)return;var built=t.build(),s=readStore(),name=uniqueName(t.name,s);built.data.projectName=name;built.data.strings=built.data.strings||{};built.data.strings.app_name=built.settings.applicationName;var rec={id:uid('project'),name:name,folderName:slug(name),createdAt:Date.now(),updatedAt:Date.now(),data:built.data,settings:built.settings,pinned:false};s.projects.push(rec);writeStore(s);localStorage.setItem(SETTINGS_PREFIX+rec.id,JSON.stringify(built.settings));localStorage.setItem(ACTIVE_KEY,rec.id);if(window.BrotwareProjectSettings&&typeof BrotwareProjectSettings.persist==='function')BrotwareProjectSettings.persist(built.settings,rec.id);showProjects();if(window.BrotwareProjects&&typeof BrotwareProjects.open==='function')setTimeout(function(){BrotwareProjects.open(rec.id);},70);
}

function cleanPreviewContent(content){var box=document.createElement('div');box.innerHTML=content||'';box.querySelectorAll('.resize-handle,#gridLayer').forEach(function(n){n.remove();});box.querySelectorAll('.selected,.drop-target').forEach(function(n){n.classList.remove('selected','drop-target');});box.querySelectorAll('[data-bound]').forEach(function(n){n.removeAttribute('data-bound');});return box.innerHTML;}
function previewHtml(data){var p=data&&Array.isArray(data.pages)&&data.pages.length?data.pages[0]:null;if(!p||!String(p.content||'').trim())return'<div class="bw-project-thumbnail-empty">'+icon('web_asset')+'</div>';return'<div class="bw-project-thumbnail" style="background:'+esc(p.background||'#fff')+'"><div class="bw-project-thumbnail-stage" style="background:'+esc(p.background||'#fff')+'">'+cleanPreviewContent(p.content)+'</div></div>';}
function decorateProjectCards(){
  if(decorating)return;var list=document.getElementById('bwProjectList');if(!list)return;decorating=true;try{var s=readStore(),map={};s.projects.forEach(function(p){map[p.id]=p;});list.querySelectorAll('.bw-project-card[data-project-id]').forEach(function(card){var p=map[card.dataset.projectId];if(!p)return;var box=card.querySelector('.bw-project-icon');if(box){box.innerHTML=previewHtml(p.data);var st=settingsFor(p.id,p);if(st&&st.icon){var im=document.createElement('img');im.className='bw-project-thumbnail-appicon';im.src=st.icon;im.alt='';box.appendChild(im);}}var more=card.querySelector('.bw-project-more');if(more)more.innerHTML=icon('more_horiz');});decorateStaticIcons();}finally{decorating=false;}
}
function decorateStaticIcons(){
  var home=document.getElementById('bwProjectHome');if(!home)return;var menu=home.querySelector('.bw-project-search .menu'),search=home.querySelector('.bw-project-search .search-ico'),restore=home.querySelector('.bw-restore-card .ico'),chev=home.querySelector('.bw-restore-card .chev'),sort=home.querySelector('#bwProjectSort'),newI=home.querySelector('#bwNewProject>span');if(menu)menu.innerHTML=icon('menu');if(search)search.innerHTML=icon('search');if(restore)restore.innerHTML=icon('restore');if(chev)chev.innerHTML=icon('chevron_right');if(sort)sort.innerHTML=icon('swap_vert');if(newI)newI.innerHTML=icon('add');
}
function ensureNav(){
  var nav=document.querySelector('#bwProjectHome .bw-project-nav');if(!nav)return;var preview=nav.querySelector('[data-bw-nav="preview"]'),settings=nav.querySelector('[data-bw-nav="settings"]');if(preview)preview.remove();if(settings)settings.remove();var projects=nav.querySelector('[data-bw-nav="projects"]'),templates=nav.querySelector('[data-bw-nav="templates"]');if(projects){projects.querySelector('.ico').innerHTML=icon('grid_view');}if(templates){templates.querySelector('.ico').innerHTML=icon('dashboard_customize');}
  if(nav.dataset.bwV3Bound!=='1'){nav.dataset.bwV3Bound='1';nav.addEventListener('click',function(e){var b=e.target.closest('[data-bw-nav]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.bwNav==='templates')showTemplates();else showProjects();},true);}
}
function ensureTemplates(){
  var shell=document.querySelector('#bwProjectHome .bw-project-shell');if(!shell)return;if(!templateView){templateView=document.createElement('section');templateView.className='bw-template-view';templateView.id='bwTemplateView';shell.appendChild(templateView);}renderTemplates();
}
function renderTemplates(){if(!templateView)return;templateView.innerHTML='<div class="bw-template-head"><div><h2>Templates</h2><p>Projetos prontos e funcionais. Toque em um para criar uma cópia editável.</p></div>'+icon('auto_awesome')+'</div><div class="bw-template-grid">'+TEMPLATES.map(function(t){var built=t.build();return'<article class="bw-template-card" data-template-id="'+t.id+'"><span class="bw-template-badge">FUNCIONAL</span><button class="bw-template-use" type="button" aria-label="Usar template">'+icon('add')+'</button><div class="bw-template-preview">'+previewHtml(built.data)+'</div><div class="bw-template-info"><span><b>'+esc(t.name)+'</b><small>'+esc(t.desc)+'</small></span>'+icon(t.icon)+'</div></article>';}).join('')+'</div>';if(templateView.dataset.bwBound!=='1'){templateView.dataset.bwBound='1';templateView.addEventListener('click',function(e){var c=e.target.closest('[data-template-id]');if(c)useTemplate(c.dataset.templateId);});}}
function setNavActive(which){var nav=document.querySelector('#bwProjectHome .bw-project-nav');if(!nav)return;nav.querySelectorAll('[data-bw-nav]').forEach(function(b){b.classList.toggle('active',b.dataset.bwNav===which);});}
function showTemplates(){ensureTemplates();var home=document.getElementById('bwProjectHome'),shell=home&&home.querySelector('.bw-project-shell');if(!home||!shell)return;shell.classList.add('bw-show-templates');home.classList.add('bw-templates-open');templateView.classList.add('show');setNavActive('templates');}
function showProjects(){var home=document.getElementById('bwProjectHome'),shell=home&&home.querySelector('.bw-project-shell');if(!home||!shell)return;shell.classList.remove('bw-show-templates');home.classList.remove('bw-templates-open');if(templateView)templateView.classList.remove('show');setNavActive('projects');setTimeout(decorateProjectCards,0);}

function observe(){var list=document.getElementById('bwProjectList');if(!list){setTimeout(observe,220);return;}if(!listObserver){listObserver=new MutationObserver(function(){setTimeout(decorateProjectCards,0);});listObserver.observe(list,{childList:true});}ensureNav();ensureTemplates();decorateProjectCards();}
function install(){var home=document.getElementById('bwProjectHome');if(!home){setTimeout(install,220);return;}ensureNav();ensureTemplates();observe();decorateStaticIcons();showProjects();}
setTimeout(install,0);setTimeout(install,900);
window.BrotwareHomeV3={projects:showProjects,templates:showTemplates,useTemplate:useTemplate,refresh:decorateProjectCards};
})();
