/* Acesso ao painel: hash lento (PBKDF2), bloqueio por tentativas. Verificação feita no navegador. */
const Auth=(()=>{
  const SALT=['bj','2','ouro'].join('|'),IT=210000;
  const hp=['8209b2bc78f7374b','1252d72e83312f91','c08aca8ea081f455','ddea67131f5eebf2'];
  const FIXED='';
  const HASH=FIXED||[hp[1],hp[3],hp[0],hp[2]].join('');
  const kdf=async pw=>{
    const e=new TextEncoder();
    const k=await crypto.subtle.importKey('raw',e.encode(pw),'PBKDF2',false,['deriveBits']);
    return[...new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:e.encode(SALT),iterations:IT,hash:'SHA-256'},k,256))]
      .map(x=>x.toString(16).padStart(2,'0')).join('')
  };
  async function login(pw){
    const L=Store.get(KEY.lock,{n:0,t:0}),now=Date.now();
    if(L.t>now)return{st:'lock',s:Math.ceil((L.t-now)/1000)};
    try{
      if(await kdf(pw)===(Store.get(KEY.pw)||HASH)){Store.del(KEY.lock);return{st:'ok'}}
    }catch(e){return{st:'err'}}
    const n=L.n+1;
    Store.set(KEY.lock,n>=5?{n:0,t:now+60000}:{n,t:0});
    return{st:'bad',left:5-n}
  }
  async function change(pw){
    if(pw.length<8)return false;
    try{const h=await kdf(pw);if(!Store.set(KEY.pw,h)||Store.get(KEY.pw)!==h)return false;Store.del(KEY.lock);try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}return h}catch(e){return false}
  }
  return{login,change};
})();