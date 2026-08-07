(function(){
  var products=[
    {name:'Template Dashboard',price:29.90,type:'templates'},
    {name:'Sistema Login',price:19.90,type:'components'},
    {name:'Landing Page Pro',price:39.90,type:'templates'}
  ];
  var grid=document.getElementById('products');
  function render(list){
    grid.innerHTML='';
    list.forEach(function(product,index){
      var card=document.createElement('article');
      card.className='product-card';
      card.dataset.productIndex=String(index);
      card.innerHTML='<h3>'+product.name+'</h3><p class="price">R$ '+product.price.toFixed(2).replace('.',',')+'</p><button class="buy-button">Comprar</button>';
      card.querySelector('.buy-button').onclick=function(){
        var modal=document.createElement('div');
        modal.className='dynamic-modal';
        modal.innerHTML='<div><h1>Pagamento</h1><p>'+product.name+'</p><button id="finish-payment">Finalizar</button></div>';
        document.body.appendChild(modal);
        modal.querySelector('#finish-payment').onclick=function(){modal.remove();};
      };
      grid.appendChild(card);
    });
  }
  render(products);
  document.getElementById('searchInput').addEventListener('input',function(){var q=this.value.toLowerCase();render(products.filter(function(p){return p.name.toLowerCase().indexOf(q)>=0;}));});
  Array.prototype.forEach.call(document.querySelectorAll('[data-filter]'),function(btn){btn.onclick=function(){var type=this.dataset.filter;render(type==='all'?products:products.filter(function(p){return p.type===type;}));};});
  console.log('Brot Shop carregada com',products.length,'produtos');
})();
