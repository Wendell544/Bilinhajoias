/* Persistência local: dados leves, versão do esquema, rascunhos e preferências */
const Store={
  get(k,d=null){try{const v=JSON.parse(localStorage.getItem(k));return v===null||v===undefined?d:v}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}
    catch(e){if(e && e.name==='QuotaExceededError'){toast('Sem espaço local. Remova fotos ou itens para continuar.');}else{toast('Falha ao salvar dados localmente.');}return false}},
  del(k){try{localStorage.removeItem(k)}catch(e){}},
  info(){let used=0,items=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX)){used+=(localStorage.getItem(k)||'').length;items++}}return{used,items}}
};
const DB={prod:[],cart:[],ban:[],ads:[],cats:[],set:{}};
const okP=p=>p&&typeof p.title==='string'&&p.title.trim()&&p.price>=0&&typeof p.category==='string';
const wa=t=>'https://wa.me/'+(DB.set.wa||WAD)+'?text='+encodeURIComponent(t);
const lk=o=>okUrl(o.link)?o.link:wa('Olá! Vi “'+(o.title||'o anúncio')+'” no site e gostaria de saber mais.');
const save=k=>Store.set(KEY[k],DB[k]);
const saveAll=()=>{['prod','cart','ban','ads','cats','set'].forEach(save);Store.set(KEY.meta,{v:V,at:Date.now()})};

function load(){
  const m=Store.get(KEY.meta,{v:1});let d=m.v<V;
  DB.set={...SET0,...Store.get(KEY.set,{})};
  DB.set.show={...SET0.show,...(DB.set.show||{})};
  DB.prod=Store.get(KEY.prod);DB.cart=Store.get(KEY.cart,[]);
  DB.ban=Store.get(KEY.ban);DB.ads=Store.get(KEY.ads);DB.cats=Store.get(KEY.cats);
  if(!Array.isArray(DB.prod)){DB.prod=seed();d=true}
  DB.prod=DB.prod.filter(okP).map(p=>{
    if(!Array.isArray(p.images)){p.images=p.imageUrl?[p.imageUrl]:[];d=true}
    p.images=p.images.map(r=>{if(r&&r.l){d=true;return{k:r.k}}return r});
    if(p.available===undefined)p.available=true;
    return p
  });
  if(!Array.isArray(DB.cats)){
    const n=[...CATS0];DB.prod.forEach(p=>{if(!n.includes(p.category))n.push(p.category)});
    DB.cats=n.map((name,i)=>({id:i+1,name,on:true,img:null}));d=true
  }
  if(!Array.isArray(DB.ban)){
    const o=Store.get(KEY.oban);
    DB.ban=o&&o.on&&(o.img||o.title)?[{id:1,on:true,title:o.title||'',sub:o.text||'',btn:o.btn||'',link:o.link||'',img:o.img||null}]:[];d=true
  }
  if(!Array.isArray(DB.ads)){DB.ads=ads0();d=true}
  DB.cart=(Array.isArray(DB.cart)?DB.cart:[]).filter(c=>c&&c.qty>0&&DB.prod.some(p=>p.id===c.id));
  if(d)saveAll()
}
const Prefs={get:()=>Store.get(KEY.pref,{}),set:o=>Store.set(KEY.pref,{...Prefs.get(),...o})};
const Draft={get:()=>Store.get(KEY.draft),set:v=>Store.set(KEY.draft,v),clear:()=>Store.del(KEY.draft)};

/* Histórico de "interesse" (proxy de popularidade): +1 ao adicionar à sacola */
const Hist={
  get:()=>Store.get(KEY.hist,{}),
  bump:id=>{const h=Store.get(KEY.hist,{});h[id]=(h[id]||0)+1;Store.set(KEY.hist,h)},
  top:n=>{const h=Store.get(KEY.hist,{});return Object.entries(h).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([id])=>+id)}
};

/* Backup / Restore */
const Backup={
  dump:()=>({v:V,at:Date.now(),prod:DB.prod,ban:DB.ban,ads:DB.ads,cats:DB.cats,set:DB.set}),
  download(){
    const b=new Blob([JSON.stringify(Backup.dump(),null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);
    a.download='bilinha-backup-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  },
  async load(file){
    const d=JSON.parse(await file.text());
    if(!d||typeof d!=='object')throw new Error('inválido');
    if(Array.isArray(d.prod))DB.prod=d.prod.filter(okP).map(p=>({...p,available:p.available!==false}));
    if(Array.isArray(d.ban))DB.ban=d.ban;
    if(Array.isArray(d.ads))DB.ads=d.ads;
    if(Array.isArray(d.cats))DB.cats=d.cats;
    if(d.set&&typeof d.set==='object'){DB.set={...SET0,...d.set};DB.set.show={...SET0.show,...(d.set.show||{})}}
    saveAll();return true;
  }
};