const S={cat:'Todos',q:'',srt:'feat',n:0},BN={i:0,n:0,t:null,p:false},PM={p:null,i:0,z:false};let swp=0;
const pr=p=>p.promo>0&&p.promo<p.price?+p.promo:+p.price;
const inst=p=>{const m=/^\s*(\d+)\s*x\s*(.*)$/i.exec(p.installment||'');return m&&+m[1]>1?(m[1]+'x de '+money(pr(p)/m[1])+' '+m[2]).trim():(p.installment||'')};
const lines=()=>DB.cart.map(c=>({p:DB.prod.find(p=>p.id===c.id),qty:c.qty})).filter(l=>l.p);
const total=L=>L.reduce((s,l)=>s+pr(l.p)*l.qty,0);

function chips(){
  const L=['Todos',...DB.categories.filter(c=>c.on).map(c=>c.name)];
  if(!L.includes(S.cat))S.cat='Todos';
  $('chips').innerHTML=L.map(c=>`<button class="chip b${c===S.cat?' on':''}" data-a="cat" data-v="${esc(c)}" aria-pressed="${c===S.cat}">${esc(c)}</button>`).join('')
}
function hero(){
  const s=DB.set;
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
  <div class="ac-b"><h3 class="serif h3">${esc(a.title)}</h3><p class="tm">${esc(a.text)}</p>${a.btn?`<a class="b ghost" target="_blank" rel="noopener" href="${esc(lk(a))}">${esc(a.btn)}</a>`:''}</div>
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
  if(s.promo){
    const l=P.filter(p=>pr(p)<p.price).slice(0,12);
    if(l.length)o.push(sec('promo','Promoções',l.map(card).join('')))
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

function banner(){
  const L=DB.banners.filter(b=>b.on),el=$('bnr');
  stop();el.classList.toggle('hid',!L.length);$('hero').classList.toggle('hid',!!L.length);
  if(!L.length){el.innerHTML='';return}
  BN.n=L.length;BN.i=Math.min(BN.i,BN.n-1);
  el.innerHTML=`<div class="bn${L.some(b=>b.title||b.sub||b.btn)?' tx':''}" id="bnv" role="region" aria-roledescription="carrossel" aria-label="Destaques da loja" tabindex="0"><div class="bn-t" id="bnt">${L.map((b,i)=>{
    const t=b.title||b.sub||b.btn;
    return`<div class="bn-s${b.img?' sk':' hero'}${i===BN.i?' on':''}" role="group" aria-roledescription="slide" aria-label="${i+1} de ${L.length}">
      ${b.img?IMG.html(b.img,{s:'full',alt:b.title||'Banner',eager:i===0,now:1}):''}
      ${t?`<div class="bn-c">${b.title?`<h2>${esc(b.title)}</h2>`:''}${b.sub?`<p>${esc(b.sub)}</p>`:''}${b.btn?`<a class="b gold" target="_blank" rel="noopener" href="${esc(lk(b))}">${esc(b.btn)}</a>`:''}</div>`
        :b.link?`<a class="bn-l" target="_blank" rel="noopener" href="${esc(lk(b))}" aria-label="${esc(b.title||'Abrir banner')}"></a>`:''}
    </div>`}).join('')}</div>
    ${BN.n>1?`<button class="q bn-a pv" data-a="bn" data-v="-1" aria-label="Banner anterior">${ic('prev')}</button><button class="q bn-a nx" data-a="bn" data-v="1" aria-label="Próximo banner">${ic('next')}</button>
    <div class="bn-d">${L.map((_,i)=>`<button data-a="bng" data-v="${i}" aria-label="Ir para o banner ${i+1}"><i></i></button>`).join('')}<button class="pz" id="bnz" data-a="bnp" aria-label="Pausar rotação">${ic(BN.p?'play':'pause',16)}</button></div>`:''}
  </div>`;
  IMG.hydrate(el);go(BN.i);auto();
  const v=$('bnv');
  let x0=null,mv=0;v.addEventListener('click',e=>{if(mv){e.preventDefault();e.stopPropagation();mv=0}},true);
  v.addEventListener('pointerdown',e=>{x0=e.clientX;mv=0});
  v.addEventListener('pointerup',e=>{if(x0!==null&&Math.abs(e.clientX-x0)>40){mv=1;go(BN.i+(e.clientX<x0?1:-1));auto()}x0=null});
  v.addEventListener('mouseenter',stop);v.addEventListener('mouseleave',auto);
  v.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){go(BN.i-1);auto();e.preventDefault()}
    else if(e.key==='ArrowRight'){go(BN.i+1);auto();e.preventDefault()}
    else if(e.key===' '){ACT.bnp();e.preventDefault()}
  });
}
function go(i){
  BN.i=(i+BN.n)%BN.n;
  const t=$('bnt');if(!t)return;
  t.style.transform='translateX(-'+BN.i*100+'%)';
  t.querySelectorAll('.bn-s').forEach((s,k)=>{s.setAttribute('aria-hidden',k!==BN.i);s.classList.toggle('on',k===BN.i)});
  document.querySelectorAll('.bn-d button[data-a=bng]').forEach((b,k)=>b.classList.toggle('on',k===BN.i));
}
function stop(){clearInterval(BN.t)}
function auto(){
  stop();
  if(BN.n<2||BN.p||document.hidden)return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  if($('bnr').classList.contains('hid'))return;
  BN.t=setInterval(()=>go(BN.i+1),Math.max(2,DB.set.sec||6)*1000)
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

const render=()=>{chips();hero();banner();rails();grid();cartUI();footer()};
const pop=()=>{const b=$('bd');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')};
const cartSave=()=>{Store.set(KEY.cart,DB.cart);cartUI()};

ACT.cat=c=>{S.cat=c;S.n=0;Prefs.set({cat:c});chips();grid();$('colecao').scrollIntoView({behavior:'smooth'})};
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
ACT.bn=v=>{go(BN.i+ +v);auto()};
ACT.bng=v=>{go(+v);auto()};
ACT.bnp=()=>{BN.p=!BN.p;const z=$('bnz');if(!z)return;z.innerHTML=ic(BN.p?'play':'pause',16);z.setAttribute('aria-label',BN.p?'Retomar rotação':'Pausar rotação');BN.p?stop():auto()};
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