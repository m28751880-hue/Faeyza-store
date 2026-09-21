(function(){
  'use strict';
  var key='kj_wishlist';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)}
  function read(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}}
  function render(){var items=read(),grid=document.getElementById('wishlist-grid'),empty=document.getElementById('wishlist-empty');if(!grid)return;empty.hidden=items.length!==0;grid.innerHTML=items.map(function(x){return '<article class="card saved-card"><a class="card-link" href="/produk/'+encodeURIComponent(x.slug)+'/" ><div class="visual">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name)+'" loading="lazy">':'📦')+'<button class="save-button is-saved" type="button" data-wishlist-remove="'+esc(x.slug)+'" aria-label="Hapus '+esc(x.name)+' dari simpanan">♥</button></div></a><div class="body"><span class="tag">'+esc(x.category||'Produk')+'</span><h2><a href="/produk/'+encodeURIComponent(x.slug)+'/">'+esc(x.name)+'</a></h2>'+(x.rating?'<div class="card-rating">★ '+esc(x.rating)+'</div>':'')+'<div class="price">'+(x.price?money(x.price):'Cek harga')+'</div><div class="card-actions"><a class="btn" href="/produk/'+encodeURIComponent(x.slug)+'/">Lihat Produk →</a><button class="save-text" type="button" data-wishlist-remove="'+esc(x.slug)+'">Hapus</button></div></div></article>'}).join('')}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-wishlist-remove]');if(!b)return;e.preventDefault();e.stopPropagation();var slug=b.getAttribute('data-wishlist-remove');localStorage.setItem(key,JSON.stringify(read().filter(function(x){return x.slug!==slug})));render()});
  render();
})();
