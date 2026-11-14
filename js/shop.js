const S={cat:'Todos',q:'',srt:'feat',n:0},PM={p:null,i:0,z:false};let swp=0;
const pr=p=>p.promo>0&&p.promo<p.price?+p.promo:+p.price;

const inst = (p) => {
  if (!p.installment) return '';
  const raw = String(p.installment).trim();
  if (/^\d+x?$/i.test(raw)) {
    const n = parseInt(raw.replace(/x/i, ''), 10);
    if (n > 1) return `${n}x de ${money(pr(p) / n)} sem juros`;
  }
  const m = /^\s*(\d+)\s*x?\s*(.*)$/i.exec(raw);
  if (m && +m[1] > 1) {
    let txt = m[2] ? m[2].trim() : '';
    if (txt.toLowerCase().startsWith('de ') || txt.toLowerCase() === 'vezes') txt = 'sem juros';
    return `${m[1]}x de ${money(pr(p) / m[1])} ${txt || 'sem juros'}`.trim();
  }
  return raw;
};

const lines=()=>DB.cart.map(c=>({p:DB.prod.find(p=>p.id===c.id),qty:c.qty})).filter(l=>l.p);
const total=L=>L.reduce((s,l)=>s+pr(l.p)*l.qty,0);

function hero(){
  const s=DB.set;
  const bg = s.hero_bg ? (s.hero_bg.u || s.hero_bg) : '';
  const hEl = document.querySelector('.hero');
  if(bg && hEl){
    hEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('${bg}')`;
    hEl.style.backgroundSize = 'cover';
    hEl.style.backgroundPosition = 'center';
  } else if(hEl) {
    hEl.style.backgroundImage = '';
  }
  
  $('hk').textContent=s.kick;
  $('ht').innerHTML=esc(s.title).replace(/(\S+)$/,'<span class="gt">$1</span>');
  $('hx').textContent=s.text;
  $('hw').href=wa('Olá! Vim pelo site da Bilinha Jóias e Pratas e gostaria de ajuda.');
}

const card=p=>{
  const v=pr(p),off=v<p.price,un=p.available===false;
  const isNew=p.created_at&&(Date.now()-new Date(p.created_at).getTime()<30*864e5);
  return`<article class="cd${un?' un':''}">
    <div class="cd-i sk" data-a="open" data-v="${p.id}" role="button" tabindex="0" aria-label="Ver ${esc(p.title)}">
      ${IMG.html(p.images[0],{alt:p.title,s:'card'})}
      ${off?`<span class="tag gold">${Math.round((1-v/p.price)*100)}% off</span>`:''}
      ${un?'<span class="tag un">Indisponível</span>':''}
      ${isNew&&!off?'<span class="tag new">Novo</span>':''}
      ${p.featured?`<span class="star" title="Destaque">${ic('star',14)}</span>`:''}
    </div>
    <p class="kick tg">${esc(p.category)}</p>
    <h3 class="serif cd-t" data-a="open" data-v="${p.id}">${esc(p.title)}</h3>
    <div class="pr"><b class="tg">${money(v)}</b>${off?`<s class="tm sm">${money(p.price)}</s>`:''}</div>
    <p class="sm tm">${esc(inst(p))}</p>
    <div class="row">
      <button class="b gold grow" data-a="add" data-v="${p.id}"${un?' disabled':''}>${ic('bag',16)}${un?'Indisponível':'Adicionar'}</button>
      <a class="q" target="_blank" rel="noopener" aria-label="Comprar via WhatsApp" href="${esc(wa('Olá! Tenho interesse em: '+p.title+' ('+money(v)+')'))}">${ic('wa',18)}</a>
    </div>
  </article>`
};
const adCard=a=>`<article class="ac sf br">
  ${a.img?`<div class="ac-i sk">${IMG.html(a.img,{alt:a.title})}</div>`:'<div class="ac-g"></div>'}
  <div class="ac-b">
    ${a.title?`<h4 class="serif">${esc(a.title)}</h4>`:''}
    ${a.text?`<p class="tm sm">${esc(a.text)}</p>`:''}
    ${a.btn?`<a class="b ghost sm" target="_blank" rel="noopener" href="${esc(lk(a))}">${esc(a.btn)}</a>`:''}
  </div>
</article>`;
const sec=(id,t,inner,c='')=>`<section class="w sec"><div class="row sp"><h2 class="serif h2">${t}</h2><div class="row"><button class="q" data-a="rl" data-v="${id}:-1" aria-label="Anterior">${ic('prev')}</button><button class="q" data-a="rl" data-v="${id}:1" aria-label="Próximo">${ic('next')}</button></div></div><div class="rl${c}" id="rl-${id}">${inner}</div></section>`;

function rails(){
  const s=DB.set.show,P=DB.prod,o=[];
  if(s.cats){
    const c=DB.categories.filter(x=>x.on);
    if(c.length>1)o.push(sec('cats','Compre por categoria',c.map(x=>`<button class="ct" data-a="cat" data-v="${esc(x.name)}"><span class="ct-i sk">${IMG.html(x.img,{alt:x.name,s:'card'})}</span><span class="serif">${esc(x.name)}</span></button>`).join(''),' rl-cats'))
  }
  const a=DB.ads.filter(x=>x.on);
  if(s.ads&&a.length)o.push(sec('ads','Novidades e ofertas',a.map(adCard).join(''),' rl-ads'));
  if(s.feat){
    const l=P.filter(p=>p.featured).slice(0,12);
    if(l.length)o.push(sec('feat','Produtos em destaque',l.map(card).join('')))
  }
  if(s.best){
    const ids=Hist.top(24);
    const l=ids.map(id=>P.find(p=>p.id===id&&p.available!==false)).filter(Boolean).slice(0,8);
    if(l.length>=3)o.push(sec('best','Mais populares',l.map(card).join('')))
  }
  if(s.news&&P.length>8){
    o.push(sec('news','Lançamentos',[...P].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,8).map(card).join('')))
  }
  $('rails').innerHTML=o.join('');IMG.hydrate($('rails'))
}

function grid(){
  const t=nz(S.q.trim()),f=S.srt;
  const l=DB.prod.filter(p=>(S.cat==='Todos'||p.category===S.cat)&&nz(p.title+' '+p.category).includes(t));
  l.sort((a,b)=>f==='lo'?pr(a)-pr(b):f==='hi'?pr(b)-pr(a):f==='new'?new Date(b.created_at||0)-new Date(a.created_at||0):(b.featured?1:0)-(a.featured?1:0));
  const m=l.slice(0,S.n||DB.set.page);
  $('cnt').textContent=l.length+(l.length===1?' peça':' peças');
  $('grid').innerHTML=m.length?m.map(card).join(''):'<p class="empty tm">Nenhuma peça encontrada. Tente outra categoria ou busca.</p>';
  const mo=$('more');
  mo.classList.toggle('hid',l.length<=m.length);
  mo.textContent='Ver mais peças ('+(l.length-m.length)+')';
  IMG.hydrate($('grid'))
}

function drawP(){
  const p=PM.p,v=pr(p),off=v<p.price,un=p.available===false,im=p.images;
  const rel=DB.prod.filter(x=>x.id!==p.id&&x.category===p.category&&x.available!==false)
    .sort((a,b)=>(b.featured?1:0)-(a.featured?1:0))
    .slice(0,4);
  $('pmb').innerHTML=`<button class="q x" data-a="close" aria-label="Fechar">${ic('x',18)}</button>
  <div class="col">
    <div class="pm-main sk${PM.z?' zm':''}" data-a="pz" role="button" tabindex="0" aria-label="${PM.z?'Fechar ampliação':'Ampliar foto'}">${IMG.html(im[PM.i],{s:PM.z?'full':'mid',alt:p.title,eager:1,now:1})}${im.length>1?`<button class="q pm-a pv" data-a="pnav" data-v="-1" aria-label="Foto anterior">${ic('prev')}</button><button class="q pm-a nx" data-a="pnav" data-v="1" aria-label="Próxima foto">${ic('next')}</button><span class="pm-c">${PM.i+1}/${im.length}</span>`:''}</div>
    ${im.length>1?`<div class="row wrap">${im.map((r,i)=>`<button class="pm-th${i===PM.i?' on':''}" data-a="pimg" data-v="${i}" aria-label="Foto ${i+1}">${IMG.html(r,{s:'thumb',now:1})}</button>`).join('')}</div>`:''}
  </div>
  <div class="col" style="gap:10px">
    <p class="kick tg">${esc(p.category)}</p>
    <h2 class="serif h2">${esc(p.title)}</h2>
    <div class="pr"><b class="tg h3">${money(v)}</b>${off?`<s class="tm">${money(p.price)}</s>`:''}</div>
    <p class="sm tm">${esc(inst(p))}</p>
    <p style="white-space:pre-line">${esc(p.description)}</p>
    ${un?'<p class="err">Peça indisponível no momento. Fale conosco para encomendar.</p>':''}
    <div class="row wrap">
      <button class="b gold grow" data-a="add" data-v="${p.id}"${un?' disabled':''}>${ic('bag',16)}${un?'Indisponível':'Adicionar à sacola'}</button>
      <a class="b ghost grow" target="_blank" rel="noopener" href="${esc(wa('Olá! Tenho interesse em: '+p.title+' ('+money(v)+')'))}">${ic('wa',16)}WhatsApp</a>
      <button class="q" data-a="share" data-v="${p.id}" aria-label="Compartilhar produto">${ic('share',18)}</button>
    </div>
    ${rel.length?`<div class="rel"><h4 class="serif h3">Você também pode gostar</h4><div class="rl rel-rl">${rel.map(card).join('')}</div></div>`:''}
  </div>`;
  IMG.hydrate($('pmb'))
}

function cartUI(){
  const L=lines(),n=L.reduce((s,l)=>s+l.qty,0),b=$('bd');
  b.textContent=n;b.classList.toggle('hid',!n);
  b.setAttribute('aria-label',n+' item(ns) na sacola');
  $('cb').classList.toggle('hid',!n);
  $('sub').textContent=money(total(L));
  $('ci').innerHTML=L.length?L.map(({p,qty})=>`<div class="ci sf br">
    <span class="ci-i sk">${IMG.html(p.images[0],{s:'thumb',alt:p.title,now:1})}</span>
    <div class="grow">
      <div class="serif">${esc(p.title)}</div>
      <div class="tg">${money(pr(p))}</div>
      <div class="row">
        <button class="q" data-a="chg" data-v="${p.id}:-1" aria-label="Diminuir">${ic('minus',16)}</button>
        <span class="qn">${qty}</span>
        <button class="q" data-a="chg" data-v="${p.id}:1" aria-label="Aumentar">${ic('plus',16)}</button>
        <button class="q" data-a="rm" data-v="${p.id}" aria-label="Remover">${ic('trash',16)}</button>
      </div>
    </div>
  </div>`).join(''):'<p class="tm center" style="padding:48px 0">Sua sacola está vazia.</p>';
  IMG.hydrate($('ci'))
}

function footer(){
  const s=DB.set,ig=String(s.ig||'').replace(/^@/,''),L=[`<a class="tg" target="_blank" rel="noopener" href="${esc(wa('Olá! Vim pelo site e gostaria de ajuda.'))}">WhatsApp</a>`];
  if(/^[\w.]{1,30}$/.test(ig))L.push(`<a class="tg" target="_blank" rel="noopener" href="https://www.instagram.com/${ig}/">@${ig}</a>`);
  if(okUrl(s.fb))L.push(`<a class="tg" target="_blank" rel="noopener" href="${esc(s.fb)}">Facebook</a>`);
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email||''))L.push(`<a class="tg" href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
  $('ft').innerHTML=`<span class="tg">${ic('gem',26)}</span><div class="serif tg h2">Bilinha Jóias e Pratas</div>${s.about?`<p style="max-width:560px">${esc(s.about)}</p>`:''}<p>${esc(s.addr)}</p><div class="lk">${L.join('')}</div><button class="dots-btn" data-a="admin" tabindex="-1" aria-hidden="true">•••</button>`
}

const render=()=>{hero();rails();grid();cartUI();footer()};
const pop=()=>{const b=$('bd');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')};
const cartSave=()=>{Store.set(KEY.cart,DB.cart);cartUI()};

ACT.cat=c=>{S.cat=c;S.n=0;Prefs.set({cat:c});grid();$('colecao').scrollIntoView({behavior:'smooth'})};
ACT.more=()=>{S.n=(S.n||DB.set.page)+DB.set.page;grid()};
ACT.rl=v=>{const[i,d]=v.split(':'),e=$('rl-'+i);if(e)e.scrollBy({left:d*e.clientWidth*.9,behavior:'smooth'})};
ACT.open=id=>{const p=DB.prod.find(x=>x.id==id);if(!p)return;PM.p=p;PM.i=0;PM.z=false;drawP();modal('pm',1);$('pmb').scrollTop=0};
ACT.pimg=i=>{const m=$('pmb'),t=m.scrollTop;PM.i=+i;drawP();m.scrollTop=t};
ACT.pnav=v=>{const n=PM.p.images.length,m=$('pmb'),t=m.scrollTop;PM.i=(PM.i+ +v+n)%n;drawP();m.scrollTop=t};
ACT.pz=()=>{if(swp){swp=0;return}const m=$('pmb'),t=m.scrollTop;PM.z=!PM.z;drawP();m.scrollTop=t};
ACT.add=id=>{
  const p=DB.prod.find(x=>x.id==id);
  if(!p||p.available===false){toast('Peça indisponível no momento.');return}
  const c=DB.cart.find(x=>x.id===p.id);
  if(c)c.qty=Math.min(99,c.qty+1);else DB.cart.push({id:p.id,qty:1});
  Hist.bump(p.id);cartSave();pop();toast('“'+p.title+'” foi para a sacola.');
};
ACT.chg=v=>{const[i,d]=v.split(':'),c=DB.cart.find(x=>x.id==i);if(!c)return;c.qty=Math.min(99,c.qty+ +d);if(c.qty<1)DB.cart=DB.cart.filter(x=>x!==c);cartSave()};
ACT.rm=i=>{DB.cart=DB.cart.filter(x=>x.id!=i);cartSave()};
ACT.clr=()=>{DB.cart=[];cartSave()};
ACT.cart=()=>{$('ts').classList.add('hid');drawer(1)};
ACT.close=()=>{drawer(0);modal('lg',0);modal('pm',0);if(/^#p=/.test(location.hash))history.replaceState(null,'',location.pathname+location.search)};
ACT.share=async id=>{
  const p=DB.prod.find(x=>x.id==id);if(!p)return;
  const url=location.origin+location.pathname+'#p='+p.id;
  try{
    if(navigator.share){await navigator.share({title:p.title,text:p.title,url})}
    else{await navigator.clipboard.writeText(url);toast('Link copiado.')}
  }catch(e){}
};
ACT.theme=()=>{
  const r=document.documentElement;
  const d=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme=d?'light':'dark';Prefs.set({theme:r.dataset.theme})
};
ACT.fin=(v,a,e)=>{
  const L=lines(),n=$('nm').value.trim(),d=$('addr').value.trim(),er=$('cerr');
  const m=!L.length?'Adicione ao menos uma peça à sacola.':!n||!d?'Informe seu nome e o endereço com cidade.':'';
  er.textContent=m;er.classList.toggle('hid',!m);
  if(m){e.preventDefault();return}
  a.href=wa([
    '💎 *Novo pedido · Bilinha Jóias e Pratas*','',
    '👤 *Cliente:* '+n,'📍 *Entrega:* '+d,'💳 *Pagamento:* '+$('pay').value,'',
    '🛍️ *Itens do pedido*',
    ...L.map(({p,qty},i)=>(i+1)+'. '+p.title+'\n    '+qty+' × '+money(pr(p))+' = '+money(pr(p)*qty)+(inst(p)?'\n    ✨ '+inst(p):'')),
    '','💰 *Total: '+money(total(L))+'*','','Aguardo a confirmação. Obrigado! 🙏'
  ].join('\n'));
  toast('Pedido pronto! Abrindo o WhatsApp…')
};

const openFromHash=()=>{
  const m=/^#p=(\d+)/.exec(location.hash);
  if(m){const p=DB.prod.find(x=>x.id==m[1]);if(p){ACT.open(p.id)}}
};