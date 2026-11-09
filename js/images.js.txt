/* Imagens: validação, compressão em WebP, miniaturas, prévia borrada, IndexedDB e carregamento sob demanda */
const IMG=(()=>{
const TYPES=['image/jpeg','image/png','image/webp'],URLS=new Map();let dbp;
const open=()=>dbp||(dbp=new Promise((ok,no)=>{const r=indexedDB.open('bilinha_img',1);r.onupgradeneeded=()=>r.result.createObjectStore('b',{keyPath:'k'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
const tx=async(m,f)=>{const d=await open();return new Promise((ok,no)=>{const t=d.transaction('b',m),q=f(t.objectStore('b'));t.oncomplete=()=>ok(q.result);t.onerror=t.onabort=()=>no(t.error)})};
const get=k=>tx('readonly',s=>s.get(k));
const put=v=>tx('readwrite',s=>s.put(v));
const del=k=>tx('readwrite',s=>s.delete(k));
const keys=()=>tx('readonly',s=>s.getAllKeys());
const dec=f=>'createImageBitmap'in window?createImageBitmap(f):new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=()=>no(new Error('x'));i.src=u});
const cv=(s,max,type,q)=>{const k=Math.min(1,max/Math.max(s.width,s.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(s.width*k));c.height=Math.max(1,Math.round(s.height*k));c.getContext('2d').drawImage(s,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,type,q))};
const enc=async(s,max,q)=>{let b=await cv(s,max,'image/webp',q);if(!b||b.type!=='image/webp')b=await cv(s,max,'image/jpeg',q);return b};
const b2d=b=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(b)});
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await b.arrayBuffer()))].slice(0,8).map(x=>x.toString(16).padStart(2,'0')).join('');
async function one(f){
  if(!TYPES.includes(f.type))throw new Error(f.name+': formato não permitido (use JPG, PNG ou WebP).');
  const mb=DB.set.mb||8;if(f.size>mb*1048576)throw new Error(f.name+': passa de '+mb+' MB.');
  let s;try{s=await dec(f)}catch(e){throw new Error(f.name+': imagem inválida ou corrompida.')}
  const full=await enc(s,1200,.82),k='i:'+await hash(full);let r=await get(k);const dup=!!r;
  if(!r){r={k,full,mid:await enc(s,520,.8),thumb:await enc(s,140,.7),lq:await b2d(await enc(s,24,.5)),at:Date.now()};await put(r)}
  if(s.close)s.close();
  return{ref:{k,l:r.lq},dup}
}
async function upload(files,onp){const refs=[],errs=[];let n=0,dups=0;
  for(const f of files){try{const o=await one(f);if(o.dup)dups++;refs.push(o.ref)}catch(e){errs.push(e.message||String(e))}onp&&onp(++n,files.length)}
  return{refs,errs,dups}
}
const url=async(k,s)=>{const id=k+s;if(URLS.has(id))return URLS.get(id);const r=await get(k);if(!r||!r[s])throw 0;const u=URL.createObjectURL(r[s]);URLS.set(id,u);return u};
const fb=i=>{if(i.dataset.fb)return;i.dataset.fb=1;i.classList.add('ok');i.src=art(40)};
const ld=i=>url(i.dataset.k,i.dataset.s||'mid').then(u=>{i.src=u},()=>fb(i));
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);ld(e.target)}}),{rootMargin:'400px'}):null;
const hydrate=root=>root.querySelectorAll('img[data-k]:not([data-h])').forEach(i=>{i.dataset.h=1;io?io.observe(i):ld(i)});
const okSrc=u=>/^(https?:|data:image\/)/i.test(u||'');
const html=(r,o={})=>{
  r=R(r);const a=esc(o.alt||''),eager=o.eager?' fetchpriority="high"':'';
  if(!r||(!r.k&&!okSrc(r.u)))return`<img src="${art(40)}" alt="${a}" decoding="async">`;
  if(r.k)return`<img${r.l?` src="${esc(r.l)}"`:''} data-k="${esc(r.k)}" data-s="${o.s||'mid'}" alt="${a}" decoding="async"${eager}>`;
  return`<img src="${esc(r.u)}" alt="${a}" decoding="async"${eager}${o.eager?'':' loading="lazy"'}>`
};
async function gc(){
  try{
    const used=new Set(),add=r=>{r=R(r);r&&r.k&&used.add(r.k)};
    DB.prod.forEach(p=>p.images.forEach(add));
    [...DB.ban,...DB.ads,...DB.cats].forEach(x=>add(x.img));
    const d=Draft.get();d&&(d.imgs||[]).forEach(add);
    if(typeof A!=='undefined'){A.imgs.forEach(add);A.m&&add(A.m.img)}
    for(const k of await keys())if(!used.has(k))await del(k);
  }catch(e){}
}
document.addEventListener('load',e=>{
  const t=e.target;if(t.tagName!=='IMG')return;
  if(t.parentNode)t.parentNode.classList.remove('sk');
  if(t.dataset.k&&t.src.startsWith('blob:'))t.classList.add('ok');
},true);
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')fb(e.target)},true);
return{html,hydrate,upload,gc,get,keys};
})();