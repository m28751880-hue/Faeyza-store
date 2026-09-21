(function(){
  'use strict';
  var catalogPromise=null;
  function loadCatalog(){
    if(!catalogPromise) catalogPromise=fetch('/products-search.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():[]}).catch(function(){return []});
    return catalogPromise;
  }
  function goSearch(value){var q=(value||'').trim();location.href=q?'/produk/?q='+encodeURIComponent(q):'/produk/';}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0)}
  function setupGlobalSearch(){
    var inputs=[document.getElementById('search'),document.getElementById('search-desktop')].filter(Boolean);
    inputs.forEach(function(input){
      var shell=input.closest('.search-shell'),suggest=shell&&shell.querySelector('.search-suggest'),button=shell&&shell.querySelector('.search-submit');
      input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();goSearch(input.value)}});
      input.addEventListener('input',function(){
        var q=input.value.trim().toLowerCase(); if(!suggest)return;
        if(q.length<2){suggest.innerHTML='';suggest.hidden=true;return;}
        loadCatalog().then(function(items){
          var rows=items.filter(function(x){return (x.search||'').includes(q)}).slice(0,6);
          suggest.innerHTML=rows.map(function(x){return '<a href="/produk/'+encodeURIComponent(x.slug)+'/" class="search-item"><span>'+esc(x.name)+'</span><small>'+esc(x.category)+(x.price?' · '+money(x.price):'')+'</small></a>'}).join('')||'<div class="search-noresult">Tidak ada produk yang cocok.</div>';
          suggest.innerHTML+='<button type="button" class="search-all">Lihat semua hasil →</button>';
          var all=suggest.querySelector('.search-all');if(all)all.addEventListener('click',function(){goSearch(input.value)});
          suggest.hidden=false;
        });
      });
      if(button)button.addEventListener('click',function(){goSearch(input.value)});
      document.addEventListener('click',function(e){if(shell&&!shell.contains(e.target)&&suggest)suggest.hidden=true});
    });
  }
  function setupCatalog(){
    var root=document.querySelector('.catalog-grid');if(!root)return;
    var cards=[].slice.call(root.querySelectorAll('.card')),q=document.querySelector('.catalog-search'),cat=document.querySelector('.catalog-category'),rating=document.querySelector('.catalog-rating'),price=document.querySelector('.catalog-price'),sort=document.querySelector('.catalog-sort'),count=document.querySelector('.filter-count'),chips=document.querySelector('.applied-filters'),empty=document.querySelector('.catalog-empty'),reset=document.querySelector('.catalog-clear'),emptyReset=document.querySelector('.catalog-empty-reset');
    if(!q)return;
    var params=new URLSearchParams(location.search);if(params.get('q'))q.value=params.get('q');
    function run(){
      var term=(q.value||'').trim().toLowerCase(),catv=(cat&&cat.value)||'',minRating=parseFloat((rating&&rating.value)||0),maxPrice=parseInt((price&&price.value)||0,10),mode=(sort&&sort.value)||'relevant',visible=[];
      cards.forEach(function(card){var text=card.dataset.search||card.innerText.toLowerCase(),c=card.dataset.category||'',r=parseFloat(card.dataset.rating||0),p=parseInt(card.dataset.price||0,10),ok=(!term||text.includes(term))&&(!catv||c===catv)&&(!minRating||r>=minRating)&&(!maxPrice||!p||p<=maxPrice);card.style.display=ok?'':'none';if(ok)visible.push(card)});
      visible.sort(function(a,b){var ap=parseInt(a.dataset.price||0,10),bp=parseInt(b.dataset.price||0,10),ar=parseFloat(a.dataset.rating||0),br=parseFloat(b.dataset.rating||0),an=(a.dataset.name||'').toLowerCase(),bn=(b.dataset.name||'').toLowerCase();if(mode==='price-asc')return(ap||Infinity)-(bp||Infinity);if(mode==='price-desc')return(bp||0)-(ap||0);if(mode==='rating-desc')return br-ar;if(mode==='name-asc')return an.localeCompare(bn,'id');return 0});
      visible.forEach(function(c){root.appendChild(c)});
      if(count)count.textContent=visible.length+' produk ditampilkan';if(empty)empty.hidden=visible.length!==0;
      if(chips){var out=[];if(term)out.push('Pencarian: '+q.value);if(catv)out.push('Kategori: '+cat.options[cat.selectedIndex].text);if(minRating)out.push('Rating ≥ '+minRating);if(maxPrice)out.push('Harga ≤ '+money(maxPrice));chips.innerHTML=out.map(function(x){return '<span class="filter-chip">'+esc(x)+'</span>'}).join('')}
      var u=new URL(location.href);if(term)u.searchParams.set('q',q.value);else u.searchParams.delete('q');history.replaceState(null,'',u.pathname+(u.search?u.search:'')+(u.hash||''));
    }
    [q,cat,rating,price,sort].forEach(function(x){if(x){x.addEventListener('input',run);x.addEventListener('change',run)}});
    if(reset)reset.addEventListener('click',function(){q.value='';cat.value='';rating.value='0';price.value='0';sort.value='relevant';run()});
    if(emptyReset)emptyReset.addEventListener('click',function(){if(reset)reset.click()});
    run();
  }

  function wishlistRead(){try{return JSON.parse(localStorage.getItem('kj_wishlist')||'[]')}catch(e){return []}}
  function wishlistWrite(items){try{localStorage.setItem('kj_wishlist',JSON.stringify(items.slice(0,50)))}catch(e){}}
  function wishlistSync(){var items=wishlistRead(),map={};items.forEach(function(x){map[x.slug]=x});document.querySelectorAll('[data-wishlist-toggle]').forEach(function(b){var slug=b.getAttribute('data-wishlist-toggle'),saved=!!map[slug];b.setAttribute('aria-pressed',saved?'true':'false');b.classList.toggle('is-saved',saved);if(b.classList.contains('save-button'))b.textContent=saved?'♥':'♡';else if(b.classList.contains('save-text'))b.textContent=saved?'♥ Tersimpan':'♡ Simpan'});var count=document.querySelector('[data-wishlist-count]');if(count){count.textContent=items.length;count.hidden=!items.length}}
  function wishlistToggle(slug){var items=wishlistRead(),idx=items.findIndex(function(x){return x.slug===slug});if(idx>=0){items.splice(idx,1)}else{var card=document.querySelector('[data-slug="'+CSS.escape(slug)+'"]'),x={slug:slug,name:slug,image:'',price:0,category:''};if(card){x.name=card.dataset.name||x.name;x.category=card.dataset.category||'';var img=card.querySelector('.visual img');if(img)x.image=img.getAttribute('src')||'';x.price=Number(card.dataset.price||0);x.rating=Number(card.dataset.rating||0)}var title=document.querySelector('h1');if(title&&!card)x.name=title.textContent.trim();var main=document.querySelector('.product-gallery img');if(main&&!card)x.image=main.getAttribute('src')||'';var price=document.querySelector('.price-big');if(price&&!card){var raw=(price.textContent||'').replace(/[^0-9]/g,'');x.price=Number(raw)||0}items.unshift(x)}wishlistWrite(items);wishlistSync()}
  function setupWishlist(){document.addEventListener('click',function(e){var b=e.target.closest('[data-wishlist-toggle]');if(!b)return;e.preventDefault();e.stopPropagation();wishlistToggle(b.getAttribute('data-wishlist-toggle'))});wishlistSync()}
  function init(){setupGlobalSearch();setupCatalog();setupWishlist()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
