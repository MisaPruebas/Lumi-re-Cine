(function(){
  const cur=document.createElement('div');cur.className='cursor';cur.id='cur';
  const ring=document.createElement('div');ring.className='cursor-ring';ring.id='cring';
  document.body.appendChild(cur);document.body.appendChild(ring);
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  (function a(){cur.style.left=mx+'px';cur.style.top=my+'px';rx+=(mx-rx)*.15;ry+=(my-ry)*.15;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(a)})();
  window.bindHover=function(el){el.addEventListener('mouseenter',()=>{cur.classList.add('h');ring.classList.add('h')});el.addEventListener('mouseleave',()=>{cur.classList.remove('h');ring.classList.remove('h')})};
})();

const session = JSON.parse(localStorage.getItem('lumiere_session') || 'null');
if (!session) { window.location.href = 'login.html'; }

function logout(){
  fetch('/api/logout',{method:'POST'}).catch(()=>{});
  localStorage.removeItem('lumiere_session');
  window.location.href='login.html';
}

async function api(method, url, body){
  const opts = { method, headers: {} };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const r = await fetch(url, opts);
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || ('HTTP '+r.status));
  return data;
}

function toast(msg, kind){
  const t = document.createElement('div');
  t.className = 'toast' + (kind==='err'?' err':'');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('on'));
  setTimeout(()=>{ t.classList.remove('on'); setTimeout(()=>t.remove(),300); }, 2800);
}

function openModal(id){ document.getElementById(id).classList.add('on'); }
function closeModal(id){ document.getElementById(id).classList.remove('on'); }

function renderTopbar(active){
  const role = session.role;
  const links = [];
  links.push({ href:'admUsu.html', label:'Panel', key:'panel' });
  if (role === 'c') {
    links.push({ href:'ventas.html', label:'Comprar boletos', key:'ventas' });
  }
  if (role === 'ag') {
    links.push({ href:'sucursales.html', label:'Sucursales', key:'sucursales' });
    links.push({ href:'peliculas.html', label:'Películas', key:'peliculas' });
    links.push({ href:'salas.html', label:'Salas', key:'salas' });
    links.push({ href:'funciones.html', label:'Funciones', key:'funciones' });
    links.push({ href:'productos.html', label:'Productos', key:'productos' });
    links.push({ href:'ventas.html', label:'Ventas', key:'ventas' });
    links.push({ href:'reportes.html', label:'Reportes', key:'reportes' });
  }
  if (role === 'al') {
    links.push({ href:'salas.html', label:'Salas', key:'salas' });
    links.push({ href:'funciones.html', label:'Funciones', key:'funciones' });
    links.push({ href:'productos.html', label:'Productos', key:'productos' });
    links.push({ href:'ventas.html', label:'Ventas', key:'ventas' });
  }
  const bar = document.createElement('div');
  bar.className = 'role-bar';
  bar.innerHTML = `
    <a class="role-logo" href="admUsu.html">LUMIÈRE<span>.</span></a>
    <div class="navlinks">
      ${links.map(l=>`<a class="navlink ${l.key===active?'on':''}" href="${l.href}">${l.label}</a>`).join('')}
    </div>
    <div class="userbox">
      <span class="uname">${session.name}${session.sucursal?(' · '+session.sucursal):''}</span>
      <button class="btn bo bsm" onclick="logout()">Cerrar sesión</button>
    </div>`;
  document.body.insertBefore(bar, document.body.firstChild);
  bar.querySelectorAll('a,button').forEach(window.bindHover);
}

function bindHoverAll(){
  document.querySelectorAll('button,a,.navlink,tr,.card,.seat:not(.occ),.slot:not(.sold),.dulc-btn,.scrd,.fnrow:not(.hdr),.skrow:not(.hdr),.mc,.viewpill .vp,select,input').forEach(window.bindHover);
}

fetch('/api/session').then(r=>{ if(!r.ok){ localStorage.removeItem('lumiere_session'); window.location.href='login.html'; } }).catch(()=>{});
