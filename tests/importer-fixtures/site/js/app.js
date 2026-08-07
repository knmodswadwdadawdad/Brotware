(function(){
  var root=document.getElementById('dynamic-root');
  var card=document.createElement('div');
  card.className='dynamic-card';
  card.innerHTML='<h2>Produto dinâmico</h2><p>R$ 59,90</p><button id="dynamic-buy">Comprar dinâmico</button>';
  root.appendChild(card);

  document.getElementById('dynamic-buy').onclick=function(){
    var modal=document.createElement('div');
    modal.className='dynamic-modal';
    modal.innerHTML='<div><h1>Pagamento</h1><button id="finish-payment">Finalizar</button></div>';
    document.body.appendChild(modal);
    document.getElementById('finish-payment').onclick=function(){modal.remove();};
  };
})();
