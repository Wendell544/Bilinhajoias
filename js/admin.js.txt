/* Painel administrativo: produtos, banners, categorias, anúncios, aparência e senha */
const A={ok:false,tab:0,edit:null,imgs:[],sel:0,m:null,fq:'',pl:20,del:null,lastAct:Date.now()};
const TABS=['Produtos','Banners','Categorias','Anúncios','Aparência','Senha'];
const MK=['','ban','cats','ads'];
const PF=['title','cat','price','promo','inst','desc'];
const MG={
  ban:{t:'Banners',on:'Exibir no site',
    h:'Imagem ideal: 1600×700 px. Banner só com imagem (sem textos) aparece inteiro, sem nada na frente. A ordem da lista é a ordem do carrossel.',
    f:[['title','Título'],['sub','Subtítulo'],['btn','Texto do botão'],['link','Link do botão (vazio = WhatsApp)']]},
  cats:{t:'Categorias',on:'Categoria ativa',h:'A ordem da lista é a ordem dos filtros da loja.',f:[['name','Nome da categoria']]},
  ads:{t:'Anúncios',on:'Anúncio ativo',h:'',f:[['title','Título'],['text','Texto'],['btn','Texto do botão'],['link','Link do botão (vazio = WhatsApp)']]}
};
const SF=[
  ['kick','Frase acima do título principal'],
  ['title','Título principal'],
  ['text','Texto de apoio do início','ta'],
  ['about','Sobre a loja (rodapé)','ta'],
  ['wa','WhatsApp da loja (só números, com 55 + DDD)'],
  ['email','E-mail'],['addr','Endereço'],
  ['ig','Instagram (somente o usuário)'],
  ['fb','Facebook (link completo)'],
  ['sec','Tempo de cada banner (segundos)','n'],
  ['page','Produtos por página','n'],
  ['mb','Tamanho máximo de cada foto (MB)','n']
];
const SH=[['feat','Produtos em destaque'],['best','Mais populares'],['promo','Promoções'],['news','Lançamentos'],['cats','Categorias'],['ads','Anúncios']];
const F=(id,l,x='',c='')=>`<label class="lb ${c}">${l}<input class="in" id="${id}" ${x}></label>`;
const UP='<div class="pg hid" id="pgp"><i></i></div><p class="sm tm" id="pgt" role="status"></p>';
const shell=()=>{
  $('adm').innerHTML=`<div class="w adin">
    <div class="row sp"><h2 class="serif h2">Painel</h2><div class="row"><button class="b ghost" data-a="bk" aria-label="Backup">Backup</button><button class="b ghost" data-a="exit">Sair</button></div></div>
    <nav class="chips tabs" id="tabs" style="padding:0">${TABS.map((t,i)=>`<button class="chip b" data-a="tab" data-v="${i}">${t}</button>`).join('')}</nav>
    <div id="ab" class="col" style="gap:16px"></div>
  </div>`
};
const enter=()=>{
  A.ok=true;A.lastAct=Date.now();
  modal('lg',0);if(!$('tabs'))shell();modal('adm',1);show(A.tab)
};
function show(n){
  A.tab=+n;
  document.querySelectorAll('#tabs .chip').forEach((b,i)=>b.classList.toggle('on',i===A.tab));
  const k=MK[A.tab];if(k&&(!A.m||A.m.k!==k))A.m={k,id:null,img:null};
  $('ab').innerHTML=[tProd,()=>tMgr('ban'),()=>tMgr('cats'),()=>tMgr('ads'),tSet,tPw][A.tab]();
  if(A.tab===0){phs();plist()}
  if(k){const x=A.m.id&&DB[k].find(y=>y.id==A.m.id);if(x)fillM(x);else A.m.id=null;mpv()}
  if(A.tab===4&&navigator.storage&&navigator.storage.estimate)
    navigator.storage.estimate().then(e=>{const t=$('stq');if(t)t.textContent='Armazenamento: '+(e.usage/1048576).toFixed(1)+' MB de '+Math.round(e.quota/1048576)+' MB. Local: '+Store.info().items+' itens.'});
  IMG.hydrate($('ab'))
}

function tProd(){
  const P=DB.prod,tot=P.filter(p=>p.available!==false).reduce((s,p)=>s+pr(p),0),cc={};
  P.forEach(p=>cc[p.category]=(cc[p.category]||0)+1);
  const top=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
  return`<div class="mt">${[
    ['Produtos',P.length],
    ['Valor em estoque',money(tot)],
    ['Categoria líder',top?top[0]:'—'],
    ['Em destaque',P.filter(p=>p.featured).length]
  ].map(([k,v])=>`<div class="sf br card2"><div class="sm tm">${k}</div><div class="serif tg h3">${esc(v)}</div></div>`).join('')}</div>
  ${Draft.get()&&!A.edit?`<div class="sf br note"><span>Há um rascunho de produto não publicado.</span><div class="row"><button class="b gold" data-a="drec">Recuperar</button><button class="b ghost" data-a="ddis">Descartar</button></div></div>`:''}
  <section class="sf br box"><h3 class="serif h3" id="pft">${A.edit?'Editar produto':'Cadastrar produto'}</h3>
    <div class="fm">${F('pf-title','Nome do produto','maxlength=120','full')}
      <label class="lb">Categoria<select class="in" id="pf-cat">${DB.cats.map(c=>`<option>${esc(c.name)}</option>`).join('')}</select></label>
      ${F('pf-inst','Parcelamento','maxlength=40 placeholder="10x sem juros"')}
      ${F('pf-price','Preço original (R$)','type=number min=0 step=0.01 inputmode=decimal')}
      ${F('pf-promo','Preço promocional (R$)','type=number min=0 step=0.01 inputmode=decimal')}
      <label class="chk"><input type="checkbox" id="pf-av" checked>Disponível para venda</label>
      <label class="chk"><input type="checkbox" id="pf-feat">Produto em destaque</label>
      <label class="lb full">Descrição detalhada<textarea class="in" id="pf-desc" rows="4" maxlength="2000"></textarea></label>
      <div class="full col"><div class="lb">Fotos (a primeira é a principal)</div><div class="ph" id="pph"></div>
        <div class="row wrap">
          <label class="b ghost">Enviar fotos<input class="hid" id="pf-file" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>
          <input class="in grow" id="pf-url" placeholder="ou cole o link de uma foto (https://…)" style="min-width:180px">
          <button class="b ghost" data-a="purl">Adicionar link</button>
        </div>${UP}
      </div>
    </div>
    <p id="perr" class="err hid"></p>
    <div class="row wrap"><button class="b gold" data-a="psave">Salvar produto</button><button class="b ghost" data-a="pc">Cancelar</button></div>
  </section>
  <section class="sf br box"><div class="row sp wrap"><h3 class="serif h3">Produtos cadastrados</h3>
    <input class="in" id="fq" placeholder="Buscar produto" style="max-width:240px" value="${esc(A.fq)}"></div>
    <div id="pl"></div>
  </section>`
}

function phs(){
  const a=A.imgs;
  $('pph').innerHTML=a.map((r,i)=>`<button class="phi${i===A.sel?' on':''}" data-a="psel" data-v="${i}" aria-label="Foto ${i+1}"><span class="sk">${IMG.html(r,{s:'thumb'})}</span>${i?'':'<em>Principal</em>'}</button>`).join('')||'<p class="sm tm">Nenhuma foto. Sem foto, a loja mostra uma imagem padrão.</p>';
  if(a.length)$('pph').insertAdjacentHTML('beforeend','<div class="row wrap" style="flex-basis:100%"><button class="b ghost" data-a="pph" data-v="star">Tornar principal</button><button class="b ghost" data-a="pph" data-v="l">‹ Mover</button><button class="b ghost" data-a="pph" data-v="r">Mover ›</button><button class="b ghost" data-a="pph" data-v="x">Remover foto</button></div>');
  IMG.hydrate($('pph'))
}

function plist(){
  const q=nz(A.fq),l=DB.prod.filter(p=>nz(p.title+' '+p.category).includes(q)),m=l.slice(0,A.pl);
  $('pl').innerHTML=m.map(p=>`<div class="ar">
    <span class="th br sk">${IMG.html(p.images[0],{s:'thumb'})}</span>
    <div class="grow"><b>${esc(p.title)}</b>
      <div class="sm tm">${esc(p.category)} · ${money(pr(p))}${p.featured?' · Destaque':''}${p.available===false?' · Indisponível':''}</div>
    </div>
    <div class="row wrap">
      <button class="b ghost" data-a="pedit" data-v="${p.id}">Editar</button>
      <button class="b ghost" data-a="pdup" data-v="${p.id}">Duplicar</button>
      <button class="b ghost" data-a="pup" data-v="${p.id}" aria-label="Subir">↑</button>
      <button class="b ghost" data-a="pdn" data-v="${p.id}" aria-label="Descer">↓</button>
      <button class="b ghost${A.del==='p'+p.id?' dng':''}" data-a="pdel" data-v="${p.id}">${A.del==='p'+p.id?'Confirmar?':'Excluir'}</button>
    </div>
  </div>`).join('')||'<p class="tm">Nenhum produto encontrado.</p>';
  if(l.length>m.length)$('pl').insertAdjacentHTML('beforeend',`<button class="b ghost" data-a="pmore">Ver mais (${l.length-m.length})</button>`);
  IMG.hydrate($('pl'))
}

function fillP(v){
  PF.forEach(k=>{const e=$('pf-'+k);e.value=v[k]??'';if(e.tagName==='SELECT'&&!e.value)e.selectedIndex=0});
  $('pf-feat').checked=!!v.feat;$('pf-av').checked=v.av!==false;phs()
}
function drsNow(){
  if(!$('pf-title'))return;
  const v={};PF.forEach(k=>v[k]=$('pf-'+k).value);
  v.feat=$('pf-feat').checked;v.av=$('pf-av').checked;
  if(PF.some(k=>k!=='cat'&&v[k])||A.imgs.length)Draft.set({edit:A.edit,v,imgs:A.imgs});
  else Draft.clear()
}
const drs=debounce(drsNow,400);

async function upRun(files){
  const p=$('pgp'),b=p.firstElementChild;p.classList.remove('hid');b.style.width='5%';
  const r=await IMG.upload(files,(n,t)=>{b.style.width=Math.round(n/t*100)+'%';$('pgt').textContent='Processando '+n+' de '+t+'…'});
  setTimeout(()=>p.classList.add('hid'),600);
  $('pgt').textContent=[r.refs.length?r.refs.length+' foto(s) otimizada(s) em WebP':'',r.dups?r.dups+' já existia(m)':'',...r.errs].filter(Boolean).join(' · ');
  return r
}
async function upP(files){
  if(!files.length)return;
  const room=12-A.imgs.length;
  if(room<=0){toast('Limite de 12 fotos por produto.');return}
  const r=await upRun(files.slice(0,room));
  r.refs.forEach(x=>{if(!A.imgs.some(y=>R(y).k===x.k))A.imgs.push(x)});
  if(r.refs.length)A.sel=A.imgs.length-1;
  phs();drs()
}
async function upM(files){if(!files.length)return;const r=await upRun([files[0]]);if(r.refs[0]){A.m.img=r.refs[0];mpv()}}

function saveP(){
  const g=k=>$('pf-'+k).value.trim(),t=g('title'),p=parseFloat(g('price')),o=parseFloat(g('promo')),er=$('perr');
  const m=t.length<2?'Informe o nome do produto.'
    :!(p>0&&p<1e7)?'Informe um preço original válido.'
    :o>=p?'O preço promocional deve ser menor que o original.':'';
  er.textContent=m;er.classList.toggle('hid',!m);
  if(m)return;
  const d={title:t.slice(0,120),category:g('cat'),price:p,promo:o>0?o:null,installment:g('inst').slice(0,40),description:g('desc').slice(0,2000),featured:$('pf-feat').checked,available:$('pf-av').checked,images:[...A.imgs]};
  if(A.edit)DB.prod=DB.prod.map(x=>x.id===A.edit?{...x,...d}:x);
  else DB.prod.unshift({id:uid(),...d});
  if(!save('prod'))return;
  A.edit=null;A.imgs=[];A.sel=0;Draft.clear();render();show(0);IMG.gc();toast('Produto salvo.')
}

const mpv=()=>{const e=$('mpv');if(!e)return;e.innerHTML=A.m.img?IMG.html(A.m.img,{s:'thumb'}):'<span class="sm tm">Sem imagem</span>';IMG.hydrate(e)};
function fillM(x){MG[A.m.k].f.forEach(([f])=>$('mf-'+f).value=x[f]||'');$('mf-on').checked=x.on!==false;A.m.img=x.img||null}

function tMgr(k){
  const m=MG[k],L=DB[k];
  const q=(A['q_'+k]||'').toLowerCase();
  const Lf=q?L.filter(x=>nz((x.title||x.name||'')).includes(nz(q))):L;
  return`<section class="sf br box"><h3 class="serif h3">${A.m.id?'Editar':'Novo'}: ${m.t}</h3>
    ${m.h?`<p class="sm tm">${m.h}</p>`:''}
    <div class="fm">${m.f.map(([f,l])=>F('mf-'+f,l,'maxlength=140')).join('')}
      <label class="chk"><input type="checkbox" id="mf-on" checked>${m.on}</label>
      <div class="full col"><div class="lb">Imagem</div>
        <div class="row wrap"><span class="th big br" id="mpv"></span>
          <label class="b ghost">Enviar imagem<input class="hid" id="mf-file" type="file" accept="image/jpeg,image/png,image/webp"></label>
          <button class="b ghost" data-a="mimgx">Remover imagem</button>
        </div>${UP}
      </div>
    </div>
    <div class="row"><button class="b gold" data-a="msave" data-v="${k}">Salvar</button><button class="b ghost" data-a="mnew" data-v="${k}">Novo</button></div>
  </section>
  <section class="sf br box">
    <div class="row sp wrap"><h3 class="serif h3">${m.t} cadastrados</h3>
      <input class="in" data-a="msearch" data-v="${k}" placeholder="Buscar" value="${esc(A['q_'+k]||'')}" style="max-width:220px">
    </div>
    ${Lf.map(x=>`<div class="ar"><span class="th br">${x.img?IMG.html(x.img,{s:'thumb'}):''}</span>
      <div class="grow"><b>${esc(x.title||x.name||'(sem título)')}</b><div class="sm tm">${x.on?'Ativo':'Pausado'}</div></div>
      <div class="row wrap">
        <button class="b ghost" data-a="medit" data-v="${k}:${x.id}">Editar</button>
        <button class="b ghost" data-a="mup" data-v="${k}:${x.id}" aria-label="Subir">↑</button>
        <button class="b ghost" data-a="mdn" data-v="${k}:${x.id}" aria-label="Descer">↓</button>
        <button class="b ghost" data-a="mtog" data-v="${k}:${x.id}">${x.on?'Pausar':'Ativar'}</button>
        <button class="b ghost${A.del===k+x.id?' dng':''}" data-a="mdel" data-v="${k}:${x.id}">${A.del===k+x.id?'Confirmar?':'Excluir'}</button>
      </div></div>`).join('')||'<p class="tm">Nada cadastrado.</p>'}
  </section>`
}

function tSet(){
  const s=DB.set;
  return`<section class="sf br box"><h3 class="serif h3">Aparência e informações da loja</h3>
    <div class="fm">${SF.map(([k,l,t])=>t==='ta'?`<label class="lb full">${l}<textarea class="in" id="sf-${k}" rows="3">${esc(s[k])}</textarea></label>`:`<label class="lb">${l}<input class="in" id="sf-${k}" ${t==='n'?'type=number ':''}value="${esc(s[k])}"></label>`).join('')}</div>
    <h4 class="serif h3">Seções da loja</h4>
    <div class="row wrap" style="gap:4px 16px">${SH.map(([k,l])=>`<label class="chk"><input type="checkbox" id="ss-${k}"${s.show[k]?' checked':''}>${l}</label>`).join('')}</div>
    <div class="row"><button class="b gold" data-a="sset">Salvar</button></div>
    <p class="sm tm" id="stq"></p>
  </section>`
}

const tPw=()=>`<section class="sf br box"><h3 class="serif h3">Alterar senha</h3>
  <p class="sm tm">A nova senha vale neste aparelho. Use 8 caracteres ou mais, com letras, números e símbolos.</p>
  <input class="in" id="np" type="password" autocomplete="new-password" placeholder="Nova senha">
  <div class="row"><button class="b gold" data-a="spw">Salvar senha</button></div>
</section>`;

const mv=(v,d)=>{const[k,id]=v.split(':'),L=DB[k],i=L.findIndex(x=>x.id==id),j=i+d;if(i<0||j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];save(k);render();show(A.tab)};

ACT.admin=()=>A.ok?enter():modal('lg',1);
ACT.login=async()=>{
  const e=$('pe');e.classList.add('hid');
  const r=await Auth.login($('pw').value);
  if(r.st==='ok'){$('pw').value='';enter();return}
  e.textContent=r.st==='lock'?'Muitas tentativas. Aguarde '+r.s+'s.'
    :r.st==='err'?'Este navegador não permite a verificação segura. Abra o site por HTTPS.'
    :'Senha incorreta.'+(r.left<3?' Restam '+r.left+' tentativas.':'');
  e.classList.remove('hid')
};
ACT.exit=()=>{A.ok=false;modal('adm',0);A.edit=null;A.imgs=[];A.m=null;A.del=null};
ACT.tab=v=>{A.m=null;A.del=null;show(v)};
ACT.psel=i=>{A.sel=+i;phs()};
ACT.pph=v=>{
  const a=A.imgs,i=A.sel;if(!a.length)return;
  if(v==='x'){a.splice(i,1);A.sel=Math.max(0,i-1)}
  else if(v==='star'&&i>0){a.unshift(a.splice(i,1)[0]);A.sel=0}
  else if(v==='l'&&i>0){[a[i-1],a[i]]=[a[i],a[i-1]];A.sel=i-1}
  else if(v==='r'&&i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];A.sel=i+1}
  phs();drs()
};
ACT.purl=()=>{
  const u=$('pf-url').value.trim();
  if(!okUrl(u)){toast('Cole um link que comece com http:// ou https://');return}
  if(A.imgs.length>=12){toast('Limite de 12 fotos.');return}
  A.imgs.push(u);$('pf-url').value='';A.sel=A.imgs.length-1;phs();drs()
};
ACT.psave=saveP;
ACT.pc=()=>{A.edit=null;A.imgs=[];A.sel=0;Draft.clear();show(0);IMG.gc()};
ACT.pedit=id=>{
  const p=DB.prod.find(x=>x.id==id);if(!p)return;
  A.edit=p.id;A.imgs=[...p.images];A.sel=0;show(0);
  fillP({title:p.title,cat:p.category,price:p.price,promo:p.promo||'',inst:p.installment||'',desc:p.description||'',feat:p.featured,av:p.available!==false});
  $('adm').scrollTo({top:0,behavior:'smooth'})
};
ACT.pdup=id=>{
  const i=DB.prod.findIndex(x=>x.id==id);if(i<0)return;
  const o=DB.prod[i];
  DB.prod.splice(i+1,0,{...o,id:uid(),title:o.title+' (cópia)',featured:false,images:[...o.images]});
  save('prod');render();plist();toast('Produto duplicado.')
};
const pmv=(id,d)=>{const i=DB.prod.findIndex(x=>x.id==id),j=i+d;if(i<0||j<0||j>=DB.prod.length)return;[DB.prod[i],DB.prod[j]]=[DB.prod[j],DB.prod[i]];save('prod');render();plist()};
ACT.pup=id=>pmv(id,-1);ACT.pdn=id=>pmv(id,1);
ACT.pdel=id=>{
  if(A.del==='p'+id){
    DB.prod=DB.prod.filter(x=>x.id!=id);DB.cart=DB.cart.filter(c=>c.id!=id);
    A.del=null;save('prod');save('cart');render();show(0);IMG.gc();toast('Produto excluído.')
  }else{A.del='p'+id;plist()}
};
ACT.pmore=()=>{A.pl+=20;plist()};
ACT.drec=()=>{const d=Draft.get();if(!d)return;A.edit=d.edit||null;A.imgs=d.imgs||[];A.sel=0;show(0);fillP(d.v)};
ACT.ddis=()=>{Draft.clear();show(0);IMG.gc()};
ACT.medit=v=>{
  const[k,id]=v.split(':'),x=DB[k].find(y=>y.id==id);if(!x)return;
  A.m={k,id:x.id,img:x.img||null};show(A.tab);$('adm').scrollTo({top:0,behavior:'smooth'})
};
ACT.mnew=k=>{A.m={k,id:null,img:null};show(A.tab)};
ACT.mimgx=()=>{A.m.img=null;mpv()};
ACT.msave=k=>{
  const m=MG[k],o={on:$('mf-on').checked,img:A.m.img};
  m.f.forEach(([f])=>o[f]=$('mf-'+f).value.trim());
  if(k==='cats'){
    if(!o.name){toast('Informe o nome da categoria.');return}
    if(DB.cats.some(c=>c.id!==A.m.id&&nz(c.name)===nz(o.name))){toast('Já existe uma categoria com esse nome.');return}
  }else if(!o.title&&!o.img){toast('Informe um título ou envie uma imagem.');return}
  if(o.link&&!okUrl(o.link)){toast('O link deve começar com http:// ou https://');return}
  const L=DB[k];
  if(A.m.id){
    const old=L.find(x=>x.id===A.m.id);
    if(k==='cats'&&old.name!==o.name){
      DB.prod.forEach(p=>{if(p.category===old.name)p.category=o.name});
      if(S.cat===old.name)S.cat=o.name;save('prod')
    }
    Object.assign(old,o)
  }else L.push({id:uid(),...o});
  if(!save(k))return;
  A.m={k,id:null,img:null};render();show(A.tab);IMG.gc();toast('Salvo com sucesso.')
};
ACT.mup=v=>mv(v,-1);ACT.mdn=v=>mv(v,1);
ACT.mtog=v=>{const[k,id]=v.split(':'),x=DB[k].find(y=>y.id==id);if(!x)return;x.on=!x.on;save(k);render();show(A.tab)};
ACT.mdel=v=>{
  const[k,id]=v.split(':'),x=DB[k].find(y=>y.id==id),key=k+id;if(!x)return;
  if(k==='cats'&&DB.prod.some(p=>p.category===x.name)){toast('Mova ou exclua os produtos desta categoria antes.');return}
  if(A.del===key){
    DB[k]=DB[k].filter(y=>y!==x);A.del=null;
    if(A.m&&A.m.id==id)A.m={k,id:null,img:null};
    save(k);render();show(A.tab);IMG.gc();toast('Excluído.')
  }else{A.del=key;show(A.tab)}
};
ACT.msearch=(v,el)=>{A['q_'+v]=el.value;show(A.tab)};
ACT.sset=()=>{
  const s=DB.set,v=k=>$('sf-'+k).value.trim(),n=(k,a,b)=>clamp(v(k),a,b),w=v('wa').replace(/\D/g,''),ig=v('ig').replace(/^@/,'');
  if(w&&(w.length<10||w.length>15)){toast('WhatsApp inválido. Use só números, com 55 + DDD.');return}
  if(v('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))){toast('E-mail inválido.');return}
  if(v('fb')&&!okUrl(v('fb'))){toast('O link do Facebook deve começar com https://');return}
  if(ig&&!/^[\w.]{1,30}$/.test(ig)){toast('Instagram inválido. Use só o nome de usuário.');return}
  Object.assign(s,{
    kick:v('kick').slice(0,60),
    title:v('title').slice(0,120)||SET0.title,
    text:v('text').slice(0,300),
    about:v('about').slice(0,400),
    wa:w||WAD,
    email:v('email'),
    addr:v('addr').slice(0,120),
    ig,fb:v('fb'),
    sec:n('sec',2,30),page:n('page',4,48),mb:n('mb',1,20)
  });
  SH.forEach(([k])=>{const e=$('ss-'+k);if(e)s.show[k]=e.checked?1:0});
  if(!save('set'))return;
  S.n=0;render();toast('Configurações salvas.')
};
ACT.spw=async()=>{
  const v=$('np').value;
  if(v.length<8){toast('Use 8 caracteres ou mais.');return}
  if(await Auth.change(v)){$('np').value='';toast('Senha alterada neste aparelho.')}
  else toast('Não foi possível alterar a senha.')
};
ACT.bk=()=>{
  const r=confirm('OK = Baixar backup. Cancelar = Restaurar de um arquivo.');
  if(r){Backup.download();return}
  const inp=document.createElement('input');inp.type='file';inp.accept='application/json';
  inp.onchange=async()=>{
    const f=inp.files[0];if(!f)return;
    try{
      if(!confirm('Substituir TODOS os dados atuais pelos do backup?'))return;
      await Backup.load(f);render();show(A.tab);toast('Dados restaurados.')
    }catch(e){toast('Arquivo inválido.')}
  };
  inp.click();
};
/* Session timeout: 30min de inatividade */
setInterval(()=>{
  if(A.ok && Date.now()-A.lastAct>30*60*1000){
    A.ok=false;modal('adm',0);toast('Sessão expirada por inatividade.')
  }
},60*1000);
document.addEventListener('click',()=>{A.lastAct=Date.now()});
document.addEventListener('keydown',()=>{A.lastAct=Date.now()});