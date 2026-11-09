/* Inicialização e eventos globais */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-a]');
  if(t){const f=ACT[t.dataset.a];if(f)f(t.dataset.v,t,e);return}
  if(e.target.classList&&e.target.classList.contains('md'))ACT.close()
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')ACT.close();
  if(e.key==='Enter'&&e.target.id==='pw')ACT.login();
  if(A.ok && (e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){
    if(A.tab===0){e.preventDefault();if($('pf-title'))saveP()}
    else if(A.tab===4){e.preventDefault();ACT.sset()}
  }
});
document.addEventListener('input',e=>{
  const id=e.target.id||'';
  if(id==='fq'){A.fq=e.target.value;A.pl=20;plist()}
  else if(A.ok&&A.tab===0&&id.startsWith('pf-'))drs()
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='pf-file'){upP([...t.files]);t.value=''}
  else if(t.id==='mf-file'){upM([...t.files]);t.value=''}
});
let qt;
const onQ=e=>{S.q=e.target.value;document.querySelectorAll('.qi').forEach(o=>{if(o!==e.target)o.value=S.q});clearTimeout(qt);qt=setTimeout(()=>{S.n=0;grid()},160)};
document.querySelectorAll('.qi').forEach(i=>i.addEventListener('input',onQ));
$('so').addEventListener('change',()=>{S.srt=$('so').value;S.n=0;Prefs.set({srt:S.srt});grid()});
document.addEventListener('visibilitychange',()=>document.hidden?stop():auto());
addEventListener('pagehide',()=>{if(A.ok&&A.tab===0)drsNow()});
addEventListener('hashchange',()=>openFromHash());

const pf=Prefs.get();
if(pf.theme)document.documentElement.dataset.theme=pf.theme;
load();
S.cat=pf.cat||'Todos';S.srt=pf.srt||'feat';$('so').value=S.srt;
document.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=ic(e.dataset.i,+e.dataset.s||20));
render();
setTimeout(openFromHash,60);