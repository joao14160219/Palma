// ===========================================================
// Palma Quiropraxia — interações e cena 3D
// ===========================================================
const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (hasGSAP) document.documentElement.classList.add('js');
document.body.classList.add('loading');

// ano no rodapé
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Loader ----------
function hideLoader(){
  const loader = document.querySelector('.loader');
  if (!loader || loader.classList.contains('done')) return;
  loader.classList.add('done');
  document.body.classList.remove('loading');
  introAnimation();
}
window.addEventListener('load', () => setTimeout(hideLoader, 350));
setTimeout(hideLoader, 3000); // segurança caso algum recurso demore

// ---------- Header ----------
const header = document.querySelector('.site-header');
const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScrollHeader, {passive:true});
onScrollHeader();

// ---------- Menu mobile ----------
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  header.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  header.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// ---------- Rolagem suave para âncoras internas ----------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (el){
      e.preventDefault();
      el.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'});
    }
  });
});

// ---------- Formulário (demonstração) ----------
function handleSubmit(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  alert(`Obrigado, ${data.nome}! Em breve entraremos em contato.`);
  e.target.reset();
  return false;
}

// ---------- Seções da cena (usadas pela navegação e pela câmera) ----------
const sceneSections = [...document.querySelectorAll('.scene')];
// posição de scroll em que cada seção fica centralizada na tela.
// No celular, a "parada" da coluna antes da seção (se visível) é o ponto de foco da câmera.
function sectionAnchors(){
  const vh = window.innerHeight;
  return sceneSections.map((s, i) => {
    if (i === 0) return 0;
    const stop = document.querySelector(`.spine-stop[data-for="${s.id}"]`);
    const el = stop && stop.offsetHeight > 0 ? stop : s;
    const top = el.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, top + el.offsetHeight / 2 - vh / 2);
  });
}

// legendas das paradas aparecem ao entrar na tela
const stopIO = new IntersectionObserver(entries => {
  entries.forEach(en => en.target.classList.toggle('in', en.isIntersecting));
}, {rootMargin:'-25% 0px -25% 0px'});
document.querySelectorAll('.spine-stop').forEach(s => stopIO.observe(s));
// devolve {k, t}: entre a seção k e k+1, com t de 0 a 1
function scrollPhase(anchors){
  const y = window.scrollY;
  const last = anchors.length - 1;
  if (y <= anchors[0]) return {k:0, t:0};
  if (y >= anchors[last]) return {k:last, t:0};
  for (let i = 0; i < last; i++){
    if (y < anchors[i + 1]) return {k:i, t:(y - anchors[i]) / (anchors[i + 1] - anchors[i])};
  }
  return {k:last, t:0};
}

// ---------- Navegação lateral (vértebras) ----------
(function spineNav(){
  const links = [...document.querySelectorAll('.spine-nav a')];
  const fill = document.querySelector('.spine-nav-fill');
  const navEl = document.querySelector('.spine-nav');
  if (!links.length) return;
  let anchors = sectionAnchors();
  window.addEventListener('resize', () => anchors = sectionAnchors());
  window.addEventListener('load', () => anchors = sectionAnchors());
  const update = () => {
    const {k, t} = scrollPhase(anchors);
    const active = t > 0.5 ? k + 1 : k;
    links.forEach((l, i) => l.classList.toggle('active', i === active));
    const a = links[k].offsetTop + links[k].offsetHeight / 2;
    const b = links[Math.min(k + 1, links.length - 1)].offsetTop + links[0].offsetHeight / 2;
    fill.style.height = `${a + (b - a) * t}px`;
    navEl.dataset.k = k;
  };
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

// ---------- Cursor com brilho ----------
if (canHover && !reduceMotion){
  const glow = document.querySelector('.cursor-glow');
  let gx = -500, gy = -500, tx = -500, ty = -500;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, {passive:true});
  (function loop(){
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

// ---------- Tilt 3D nos cartões ----------
if (canHover && !reduceMotion){
  document.querySelectorAll('.tilt').forEach(el => {
    const max = parseFloat(el.dataset.tiltMax || 14);
    const glare = document.createElement('span');
    glare.className = 'glare';
    el.appendChild(glare);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

    el.addEventListener('pointerenter', () => el.classList.add('tilting'));
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(10px)`;
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('tilting');
      el.style.transform = '';
    });
  });
}

// ---------- Botões magnéticos ----------
if (canHover && !reduceMotion){
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    btn.addEventListener('pointerleave', () => btn.style.transform = '');
  });
}

// ---------- Carrossel 3D de depoimentos ----------
(function carousel(){
  const ring = document.querySelector('.carousel-ring');
  if (!ring) return;
  const items = [...ring.querySelectorAll('.quote')];
  const dotsWrap = document.querySelector('.car-dots');
  const step = 360 / items.length;
  let index = 0, timer;

  const radius = () => parseFloat(getComputedStyle(ring).getPropertyValue('--r')) || 260;
  const dots = items.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Depoimento ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  function layout(){
    const r = radius();
    items.forEach((q, i) => q.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`);
    ring.style.transform = `translateZ(${-r}px) rotateY(${-index * step}deg)`;
  }
  function go(i){
    index = i;
    const n = items.length;
    const active = ((i % n) + n) % n;
    items.forEach((q, k) => q.classList.toggle('is-back', k !== active));
    dots.forEach((d, k) => d.classList.toggle('active', k === active));
    layout();
  }
  function restart(){
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(index + 1), 5500);
  }
  document.querySelectorAll('.car-btn').forEach(b =>
    b.addEventListener('click', () => { go(index + parseInt(b.dataset.dir, 10)); restart(); })
  );
  // arrastar/deslizar
  let startX = null;
  ring.addEventListener('pointerdown', e => startX = e.clientX);
  window.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40){ go(index + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });
  ring.addEventListener('pointerenter', () => clearInterval(timer));
  ring.addEventListener('pointerleave', restart);
  window.addEventListener('resize', layout);
  go(0); restart();
})();

// ---------- Contadores ----------
function runCounter(el){
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || 0, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1600, t0 = performance.now();
  (function tick(now){
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = (target * eased).toFixed(dec) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
const counterIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting){ runCounter(en.target); counterIO.unobserve(en.target); }
  });
}, {threshold:.6});
document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

// ---------- Animações GSAP ----------
function introAnimation(){
  if (!hasGSAP || reduceMotion) return;
  const tl = gsap.timeline({defaults:{ease:'expo.out'}});
  tl.to('.hero-title .line > span', {y:0, duration:1.4, stagger:.12})
    .from('.reveal-hero', {y:30, opacity:0, duration:1.1, stagger:.1}, '-=1.0')
    .from('.site-header', {y:-80, opacity:0, duration:1}, '-=1.2');
}

if (hasGSAP && !reduceMotion){
  gsap.registerPlugin(ScrollTrigger);

  // painéis entram girando em volta da coluna (vêm do lado dela)
  gsap.utils.toArray('.reveal').forEach(el => {
    const fromRight = !!el.closest('.side-right');
    gsap.fromTo(el,
      {opacity:0, x:fromRight ? 120 : -120, rotateY:fromRight ? -35 : 35, z:-150,
       transformPerspective:1200, transformOrigin:fromRight ? '0% 50%' : '100% 50%'},
      {opacity:1, x:0, rotateY:0, z:0, duration:1.4, ease:'expo.out',
       scrollTrigger:{trigger:el, start:'top 85%'},
       clearProps:'transform'}
    );
  });

  // cartões de serviço "orbitam" até o lugar
  gsap.from('.service', {
    opacity:0, x:-160, z:-300, rotateY:50,
    transformPerspective:1400, transformOrigin:'100% 50%', duration:1.4, ease:'expo.out', stagger:.08,
    scrollTrigger:{trigger:'.services', start:'top 80%'},
    clearProps:'transform,opacity'
  });

  // KPIs viram como cartas
  gsap.from('.kpi', {
    rotateY:-90, opacity:0, transformPerspective:800, duration:1.1, ease:'back.out(1.6)', stagger:.12,
    scrollTrigger:{trigger:'.kpis', start:'top 90%'},
    clearProps:'transform,opacity'
  });

  // passos entram em sequência
  gsap.from('.step', {
    x:60, opacity:0, duration:1, ease:'expo.out', stagger:.12,
    scrollTrigger:{trigger:'.steps', start:'top 85%'},
    clearProps:'transform,opacity'
  });

  // faixa girando com o scroll
  gsap.to('.marquee', {
    rotate:1.5, ease:'none',
    scrollTrigger:{trigger:'.marquee', start:'top bottom', end:'bottom top', scrub:true}
  });

  // conteúdo do herói afunda ao rolar
  gsap.to('.hero-grid', {
    y:-120, opacity:0, ease:'none',
    scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}
  });
} else {
  document.querySelectorAll('.hero-title .line > span').forEach(s => s.style.transform = 'none');
}

// ===========================================================
// Cena 3D — o site gira em volta da coluna (Three.js)
// ===========================================================
(async function spineScene(){
  const canvas = document.getElementById('spine-canvas');
  if (!canvas) return;
  let THREE;
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  } catch (err){
    console.warn('Three.js não carregou; mantendo fundo estático.', err);
    return;
  }

  const small = () => window.innerWidth < 640;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small() ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a120d, 16, 34);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  // Luzes quentes (fixas no mundo: a câmera gira e a luz "passeia" pela coluna)
  scene.add(new THREE.HemisphereLight(0xfffaf2, 0x2a1a10, 1.0));
  const key = new THREE.DirectionalLight(0xfff3e3, 2.4);
  key.position.set(5, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9a57d, 3.2);   // contorno bege de um lado...
  rim.position.set(-6, 2, -6); scene.add(rim);
  const back = new THREE.DirectionalLight(0xffffff, 2.0);  // ...e branco do outro
  back.position.set(6, -3, -8); scene.add(back);
  const fill = new THREE.PointLight(0xc9a57d, 30, 20);
  fill.position.set(0, -3, 5); scene.add(fill);

  // Materiais
  const boneMat = new THREE.MeshPhysicalMaterial({
    color:0xf8f3ec, roughness:.42, metalness:0, clearcoat:.75, clearcoatRoughness:.33,
    sheen:.55, sheenColor:new THREE.Color(0xfff4e6)
  });
  const discBase = new THREE.MeshPhysicalMaterial({
    color:0xc9a57d, roughness:.25, clearcoat:1, emissive:0xc9a57d, emissiveIntensity:.15,
    transparent:true, opacity:.92
  });

  // Geometrias compartilhadas
  const bodyGeo = new THREE.LatheGeometry([
    new THREE.Vector2(0.001, -0.15), new THREE.Vector2(0.40, -0.15), new THREE.Vector2(0.44, -0.12),
    new THREE.Vector2(0.37, 0), new THREE.Vector2(0.44, 0.12), new THREE.Vector2(0.40, 0.15),
    new THREE.Vector2(0.001, 0.15)
  ], 40);
  bodyGeo.scale(1, 1, 0.82);
  const archGeo = new THREE.TorusGeometry(0.22, 0.065, 12, 28, Math.PI);
  const procGeo = new THREE.CapsuleGeometry(0.07, 0.5, 6, 12);
  const transGeo = new THREE.CapsuleGeometry(0.06, 0.42, 6, 12);
  const discGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.11, 36);

  // Curva em "S" da coluna (vista lateral)
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,  5.3,  0.15),
    new THREE.Vector3(0,  4.3,  0.55),
    new THREE.Vector3(0,  3.3,  0.25),
    new THREE.Vector3(0,  1.6, -0.45),
    new THREE.Vector3(0,  0.0, -0.55),
    new THREE.Vector3(0, -1.6, -0.05),
    new THREE.Vector3(0, -3.1,  0.50),
    new THREE.Vector3(0, -4.4,  0.25),
    new THREE.Vector3(0, -5.2, -0.30)
  ]);

  const spine = new THREE.Group();
  scene.add(spine);
  const UP = new THREE.Vector3(0, 1, 0);
  const COUNT = 24; // 7 cervicais + 12 torácicas + 5 lombares
  const verts = [];
  const discs = [];

  function orient(obj, t){
    obj.position.copy(curve.getPointAt(t));
    const tan = curve.getTangentAt(t).negate();
    obj.quaternion.setFromUnitVectors(UP, tan);
  }

  for (let i = 0; i < COUNT; i++){
    const t = 0.02 + (i / (COUNT - 1)) * 0.86;
    const s = 0.52 + Math.pow(i / (COUNT - 1), 1.2) * 0.62;   // cervical pequena → lombar grande
    const outer = new THREE.Group();
    orient(outer, t);
    const inner = new THREE.Group();
    inner.scale.setScalar(s);
    outer.add(inner);

    inner.add(new THREE.Mesh(bodyGeo, boneMat));
    const arch = new THREE.Mesh(archGeo, boneMat);
    arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI;
    arch.position.z = -0.36;
    inner.add(arch);
    const proc = new THREE.Mesh(procGeo, boneMat);
    proc.position.set(0, -0.1, -0.86);
    proc.rotation.x = Math.PI / 2 + 0.45;
    inner.add(proc);
    [-1, 1].forEach(side => {
      const tr = new THREE.Mesh(transGeo, boneMat);
      tr.rotation.z = Math.PI / 2;
      tr.rotation.y = side * 0.35;
      tr.position.set(side * 0.46, 0, -0.42);
      inner.add(tr);
    });

    spine.add(outer);
    verts.push({
      inner,
      off:{
        x:(Math.random() - .5) * 0.7,
        z:(Math.random() - .5) * 0.25,
        rz:(Math.random() - .5) * 0.5,
        ry:(Math.random() - .5) * 0.7
      },
      align:0, hold:0
    });

    if (i < COUNT - 1){
      const tNext = 0.02 + ((i + 1) / (COUNT - 1)) * 0.86;
      const disc = new THREE.Mesh(discGeo, discBase.clone());
      orient(disc, (t + tNext) / 2);
      disc.scale.set(s, 1, s * 0.82);
      spine.add(disc);
      discs.push({mesh:disc, glow:0});
    }
  }

  // Sacro
  const sacrum = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.5, 5, 1), boneMat);
  orient(sacrum, 0.955);
  sacrum.rotateX(Math.PI);
  sacrum.scale.set(1, 1, 0.55);
  spine.add(sacrum);

  // Medula / nervo luminoso atrás dos corpos
  const nerveCurve = new THREE.CatmullRomCurve3(curve.points.map(p => new THREE.Vector3(p.x, p.y, p.z - 0.42)));
  spine.add(new THREE.Mesh(
    new THREE.TubeGeometry(nerveCurve, 200, 0.05, 8, false),
    new THREE.MeshBasicMaterial({color:0xfff4e4, transparent:true, opacity:.6})
  ));

  // Pulsos de energia viajando pela coluna
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(.25, 'rgba(255,246,232,.7)');
    grd.addColorStop(.55, 'rgba(230,195,150,.22)');
    grd.addColorStop(1, 'rgba(201,165,125,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const pulses = [0, .33, .66].map(o => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true}));
    sp.scale.setScalar(0.9);
    spine.add(sp);
    return {sp, o};
  });

  // Anéis orbitais
  const rings = [];
  [[3.2, 0.2, 0.9], [4.1, -0.5, 0.6], [2.6, 0.9, 1.3]].forEach(([r, tilt, speed], i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.008, 8, 160),
      new THREE.MeshBasicMaterial({color:i === 1 ? 0xfff8ef : 0xc9a57d, transparent:true, opacity:.35 - i * .07})
    );
    ring.rotation.x = Math.PI / 2 + tilt;
    ring.position.y = (i - 1) * 2.2;
    ring.userData.speed = speed;
    spine.add(ring);
    rings.push(ring);
  });

  // Partículas douradas em volta
  const PCOUNT = small() ? 300 : 800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PCOUNT * 3);
  const pCol = new Float32Array(PCOUNT * 3);
  const pSeed = new Float32Array(PCOUNT);
  const cGold = new THREE.Color(0xf3d9b5), cWhite = new THREE.Color(0xfffaf3);
  for (let i = 0; i < PCOUNT; i++){
    const r = 2.5 + Math.random() * 9;
    const a = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(a) * r;
    pPos[i * 3 + 1] = (Math.random() - .5) * 16;
    pPos[i * 3 + 2] = Math.sin(a) * r;
    pSeed[i] = Math.random();
    (Math.random() < 0.3 ? cWhite : cGold).toArray(pCol, i * 3); // ~30% brancas
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size:0.06, map:glowTex, color:0xffffff, vertexColors:true, transparent:true, opacity:.85,
    depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
  }));
  scene.add(particles);

  // ---------- Roteiro da câmera por seção ----------
  // angle: órbita em volta da coluna · y: altura (0 = centro da coluna, em unidades locais)
  // dist: distância · shift: onde a coluna aparece na tela (-1 esquerda, +1 direita)
  // region: vértebras destacadas · label: etiqueta da região
  // m: ajustes do celular — dist (zoom) e lift (sobe a coluna na tela, fração da altura)
  const SHOTS = [
    {id:'topo',        angle:0.35,            y:0,    dist:15, shift: 0.45, region:null,     m:{dist:22,  lift:.22}},
    {id:'sobre',       angle:Math.PI * 0.55,  y:3.6,  dist:7.5,  shift:-0.5, region:[0, 6],   label:['C1–C7', 'Região cervical'], m:{dist:6.2, lift:.1}},
    {id:'servicos',    angle:Math.PI * 1.1,   y:0.9,  dist:9,  shift: 0.5, region:[7, 18],  label:['T1–T12', 'Região torácica'], m:{dist:8.4, lift:.1}},
    {id:'processo',    angle:Math.PI * 1.6,   y:-2.9, dist:7.5,  shift:-0.5, region:[19, 23], label:['L1–L5', 'Região lombar'], m:{dist:6.2, lift:.1}},
    {id:'depoimentos', angle:Math.PI * 2.15,  y:0,    dist:13, shift: 0.5, region:[0, 23],  m:{dist:17,  lift:0}},
    {id:'contato',     angle:Math.PI * 2.6,   y:0,    dist:14.5, shift:-0.5, region:[0, 23], m:{dist:14.5, lift:.1}}
  ];
  let anchors = sectionAnchors();

  const cam = {angle:SHOTS[0].angle, y:0, dist:15, shift:SHOTS[0].shift, lift:0};
  let spineScale = 0.78, vw = 1, vh = 1;

  function resize(){
    const w = window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    // no celular a barra de endereço muda só a altura ao rolar: ignora para a cena não "pular"
    if (vw === w && Math.abs(vh - h) < 160 && !canHover){ anchors = sectionAnchors(); return; }
    vw = w; vh = h;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    spineScale = small() ? 0.62 : 0.78;
    spine.scale.setScalar(spineScale);
    anchors = sectionAnchors();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('load', () => anchors = sectionAnchors());
  resize();

  // ---------- Interação ----------
  const mouse = {x:0, y:0, sx:-9999, sy:-9999, active:false, last:0};
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return; // toque tem tratamento próprio abaixo
    mouse.x = e.clientX / vw * 2 - 1;
    mouse.y = e.clientY / vh * 2 - 1;
    mouse.sx = e.clientX; mouse.sy = e.clientY;
    mouse.active = true; mouse.last = performance.now();
  }, {passive:true});
  document.addEventListener('pointerleave', () => { mouse.active = false; mouse.sx = mouse.sy = -9999; });

  function adjust(i){
    const v = verts[i];
    if (v.align < 0.95){
      if (discs[i]) discs[i].glow = 1;
      if (discs[i - 1]) discs[i - 1].glow = Math.max(discs[i - 1].glow, .6);
    }
    v.align = 1; v.hold = 2.5;
  }

  // ---------- Toque (celular) ----------
  // tocar numa vértebra: onda de ajuste a partir dela + vibração curta
  // deslizar para os lados (fora dos painéis): gira a coluna, com inércia
  const touch = {down:false, spinning:false, ignore:false, x:0, y:0, sx:0, sy:0, t0:0, lx:0, lt:0};
  const pending = [];
  let userSpin = 0, spinVel = 0;
  const NO_SPIN = 'a, button, input, textarea, form, .panel, .card, .carousel, .nav, .whats-fab, .marquee';

  function nearestVert(x, y, maxD){
    let best = -1, bd = maxD;
    verts.forEach((v, i) => {
      v.inner.getWorldPosition(tmp).project(camera);
      const d = Math.hypot((tmp.x * .5 + .5) * vw - x, (-tmp.y * .5 + .5) * vh - y);
      if (d < bd){ bd = d; best = i; }
    });
    return best;
  }
  function adjustWave(i){
    const now = performance.now();
    for (let d = 0; d < COUNT; d++){
      if (i - d >= 0) pending.push({i:i - d, at:now + d * 45});
      if (d && i + d < COUNT) pending.push({i:i + d, at:now + d * 45});
    }
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (_){}
  }

  window.addEventListener('touchstart', e => {
    const p = e.touches[0];
    const el = e.target instanceof Element ? e.target : null;
    touch.ignore = e.touches.length > 1 || !!(el && el.closest(NO_SPIN)) || p.clientX < 24 || p.clientX > vw - 24;
    Object.assign(touch, {down:true, spinning:false, x:p.clientX, y:p.clientY, sx:p.clientX, sy:p.clientY, lx:p.clientX, t0:performance.now(), lt:performance.now()});
    spinVel = 0;
    mouse.last = performance.now();
  }, {passive:true});

  window.addEventListener('touchmove', e => {
    if (!touch.down || touch.ignore) return;
    const p = e.touches[0], now = performance.now();
    touch.x = p.clientX; touch.y = p.clientY;
    const dx = p.clientX - touch.sx, dy = p.clientY - touch.sy;
    if (!touch.spinning && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3){
      touch.spinning = true;
      document.body.classList.add('spine-touched');
    }
    if (touch.spinning){
      const step = (p.clientX - touch.lx) / vw * Math.PI * 1.4;
      userSpin += step;
      spinVel = step / Math.max(0.008, (now - touch.lt) / 1000);
    }
    touch.lx = p.clientX; touch.lt = now;
    mouse.last = now;
  }, {passive:true});

  window.addEventListener('touchend', () => {
    const quick = performance.now() - touch.t0 < 350;
    const still = Math.hypot(touch.x - touch.sx, touch.y - touch.sy) < 10;
    if (!touch.ignore && quick && still){
      const i = nearestVert(touch.sx, touch.sy, 90);
      if (i >= 0){ adjustWave(i); document.body.classList.add('spine-touched'); }
    }
    if (performance.now() - touch.lt > 80) spinVel = 0; // dedo parou antes de soltar: sem inércia
    spinVel = Math.max(-6, Math.min(6, spinVel));
    touch.down = false; touch.spinning = false;
  }, {passive:true});
  window.addEventListener('touchcancel', () => { touch.down = false; touch.spinning = false; }, {passive:true});

  // ---------- Inclinação do celular (Android; no iPhone exigiria permissão, então fica de fora) ----------
  const tilt = {x:0, y:0, tx:0, ty:0, base:null};
  if (!canHover && !reduceMotion){
    window.addEventListener('deviceorientation', e => {
      if (e.gamma == null || e.beta == null) return;
      if (tilt.base === null) tilt.base = e.beta;
      tilt.tx = Math.max(-1, Math.min(1, e.gamma / 30));
      tilt.ty = Math.max(-1, Math.min(1, (e.beta - tilt.base) / 35));
    });
  }

  // ---------- Paradas em foco (sem escurecer a coluna) ----------
  const focusEls = new Set();
  const focusIO = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? focusEls.add(en.target) : focusEls.delete(en.target));
  }, {rootMargin:'-40% 0px -40% 0px'});
  document.querySelectorAll('.spine-stop').forEach(s => focusIO.observe(s));

  const label = document.querySelector('.spine-label');
  const labelCode = label.querySelector('b');
  const labelName = label.querySelector('span');
  const shade = document.querySelector('.scene-shade');

  const tmp = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const clock = new THREE.Clock();
  // primeira onda ~1.5s após a cena carregar
  let wave = -1, lastWave = performance.now() - 6500;
  const ease = t => t * t * (3 - 2 * t);
  const inRegion = (shot, i) => shot.region && i >= shot.region[0] && i <= shot.region[1] ? 1 : 0;

  function frame(){
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    const now = performance.now();
    const mobile = vw < 960;

    // ----- fase do scroll → alvo da câmera -----
    const {k, t} = scrollPhase(anchors);
    const A = SHOTS[k], B = SHOTS[Math.min(k + 1, SHOTS.length - 1)];
    const e = ease(t);
    const target = {
      angle:A.angle + (B.angle - A.angle) * e,
      y:A.y + (B.y - A.y) * e,
      dist:A.dist + (B.dist - A.dist) * e,
      shift:A.shift + (B.shift - A.shift) * e
    };
    target.lift = 0;
    if (mobile){
      // celular: coluna centralizada, zoom e altura próprios de cada parada
      target.shift = 0;
      target.dist = A.m.dist + (B.m.dist - A.m.dist) * e;
      target.lift = A.m.lift + (B.m.lift - A.m.lift) * e;
    }
    const lerp = Math.min(1, dt * 3);
    cam.angle += (target.angle - cam.angle) * lerp;
    cam.y     += (target.y - cam.y) * lerp;
    cam.dist  += (target.dist - cam.dist) * lerp;
    cam.shift += (target.shift - cam.shift) * lerp;
    cam.lift  += (target.lift - cam.lift) * lerp;

    // giro pelo dedo (com inércia) e inclinação do celular
    if (!touch.down){ spinVel *= Math.pow(0.04, dt); userSpin += spinVel * dt; }
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 4);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 4);

    // órbita + leve balanço + parallax do mouse / giroscópio
    const ang = cam.angle + Math.sin(time * 0.3) * 0.06 + mouse.x * 0.18 + userSpin + tilt.x * 0.35;
    const yWorld = cam.y * spineScale;
    camera.position.set(Math.sin(ang) * cam.dist, yWorld + mouse.y * -0.4 + tilt.y * -0.6 + Math.sin(time * 0.5) * 0.1, Math.cos(ang) * cam.dist);
    lookAt.set(0, yWorld, 0);
    camera.lookAt(lookAt);
    // desloca a coluna para o lado livre da tela (desktop) ou para cima (celular), sem quebrar a órbita
    camera.setViewOffset(vw, vh, -cam.shift * vw * 0.5, cam.lift * vh, vw, vh);

    // ----- alinhamento: a coluna se alinha conforme o scroll avança -----
    const progress = (k + t) / (SHOTS.length - 1);
    const floor = ease(Math.min(1, progress * 1.1));

    // onda automática quando o usuário está parado
    if (wave < 0 && now - mouse.last > 5000 && now - lastWave > 8000 && !reduceMotion) wave = 0;
    if (wave >= 0){
      wave += dt * 26;
      const idx = Math.floor(wave);
      if (idx < COUNT) adjust(idx);
      else { wave = -1; lastWave = now; }
    }
    // ondas de ajuste disparadas por toque (espalham a partir da vértebra tocada)
    for (let p = pending.length - 1; p >= 0; p--){
      if (now >= pending[p].at){ adjust(pending[p].i); pending.splice(p, 1); }
    }

    verts.forEach((v, i) => {
      if (touch.down && touch.spinning){
        // deslizando o dedo por cima da coluna também "ajusta"
        v.inner.getWorldPosition(tmp).project(camera);
        const sx = (tmp.x * .5 + .5) * vw, sy = (-tmp.y * .5 + .5) * vh;
        if (Math.hypot(sx - touch.x, sy - touch.y) < 60) adjust(i);
      }
      if (mouse.active){
        v.inner.getWorldPosition(tmp).project(camera);
        const sx = (tmp.x * .5 + .5) * vw, sy = (-tmp.y * .5 + .5) * vh;
        if (Math.hypot(sx - mouse.sx, sy - mouse.sy) < 90) adjust(i);
      }
      if (v.hold > 0) v.hold -= dt; else v.align = Math.max(floor, v.align - dt * 0.12);
      const a = Math.max(v.align, floor);
      const m = 1 - ease(a);
      const breathe = Math.sin(time * 1.4 + i * .5) * 0.02;
      const f = Math.min(1, dt * 8);
      v.inner.position.x += ((v.off.x * m + breathe) - v.inner.position.x) * f;
      v.inner.position.z += ((v.off.z * m) - v.inner.position.z) * f;
      v.inner.rotation.z += ((v.off.rz * m) - v.inner.rotation.z) * f;
      v.inner.rotation.y += ((v.off.ry * m) - v.inner.rotation.y) * f;
    });

    // ----- destaque da região da seção atual -----
    discs.forEach((d, i) => {
      d.glow = Math.max(0, d.glow - dt * 1.4);
      const w = (1 - e) * inRegion(A, i) + e * inRegion(B, i);
      const regionGlow = w * (0.5 + 0.35 * Math.sin(time * 3 - i * 0.45));
      d.mesh.material.emissiveIntensity = .15 + Math.max(d.glow * 2.2, regionGlow);
      d.mesh.scale.y = 1 + d.glow * 0.25;
    });

    // ----- etiqueta da região acompanhando a vértebra -----
    const near = t < 0.5 ? A : B;
    const nearW = 1 - Math.min(1, Math.abs((t < 0.5 ? t : 1 - t)) * 3);
    if (near.label && !mobile){
      const mid = Math.round((near.region[0] + near.region[1]) / 2);
      verts[mid].inner.getWorldPosition(tmp).project(camera);
      const sx = (tmp.x * .5 + .5) * vw, sy = (-tmp.y * .5 + .5) * vh;
      if (labelCode.textContent !== near.label[0]){ labelCode.textContent = near.label[0]; labelName.textContent = near.label[1]; }
      // etiqueta sempre do lado de fora da coluna, longe do conteúdo
      const flip = near.shift < 0;
      const gap = 110 * (10 / cam.dist); // mais perto = coluna maior = etiqueta mais afastada
      const offX = flip ? -(label.offsetWidth + gap) : gap;
      label.style.transform = `translate(${sx + offX}px, ${sy - label.offsetHeight / 2}px)`;
      label.classList.toggle('flip', flip);
      label.style.opacity = nearW.toFixed(2);
    } else {
      label.style.opacity = 0;
    }

    // no celular, escurece a coluna atrás do conteúdo — mas nunca nas paradas, onde ela é a estrela
    shade.classList.toggle('dim', mobile && window.scrollY > vh * 0.6 && !focusEls.size);

    // ----- efeitos ambientes -----
    pulses.forEach(p => {
      const tt = (time * 0.12 + p.o) % 1;
      p.sp.position.copy(nerveCurve.getPointAt(tt));
      p.sp.material.opacity = Math.sin(tt * Math.PI);
    });
    rings.forEach(r => { r.rotation.z += dt * 0.15 * r.userData.speed; });
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < PCOUNT; i++){
      pos[i * 3 + 1] += dt * (0.15 + pSeed[i] * 0.25);
      if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
    }
    pGeo.attributes.position.needsUpdate = true;
    particles.rotation.y += dt * 0.03;
    spine.position.y = Math.sin(time * 0.8) * 0.08;

    renderer.render(scene, camera);
  }

  if (reduceMotion) verts.forEach(v => { v.align = 1; v.hold = Infinity; });
  frame();
  document.body.classList.add('spine-ready'); // libera a dica de toque só quando a cena 3D existe
  canvas.style.opacity = 0;
  canvas.style.transition = 'opacity 1.6s ease';
  requestAnimationFrame(() => canvas.style.opacity = 1);
})();
