//======================================================================;
//1. FERRAMENTAS e 2. BASE DA PIZZA;
//======================================================================;

//aleatorio com semente -> a mesma pizza sai sempre igual, mas cada pizza é diferente;
function Aleatorio(semente) {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h = Math.imul(h ^ semente.charCodeAt(i), 16777619); //o nome da pizza passa a numero;
  }
  return function () {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; //da entre 0 e 1;
  };
}

//numero ao calhas entre a e b;
function Entre(r, a, b) {
  return a + r() * (b - a);
}

//circulo torto -> a massa, o molho e o queijo parecem feitos a mao;
function Bolha(cx, cy, raio, ondulacao, r) {
  const n = 28; //pontos a volta do circulo;
  const f1 = Entre(r, 0, 6), f2 = Entre(r, 0, 6), f3 = Entre(r, 0, 6);
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const angulo = i / n * Math.PI * 2;
    //junto tres ondas diferentes -> a borda fica torta mas sem bicos;
    const onda = Math.sin(3 * angulo + f1) * .5 + Math.sin(5 * angulo + f2) * .3 + Math.sin(9 * angulo + f3) * .2;
    const k = 1 + ondulacao * onda + Entre(r, -ondulacao, ondulacao) * .25;
    pontos.push([cx + Math.cos(angulo) * raio * k, cy + Math.sin(angulo) * raio * k]);
  }
  //curva entre os pontos (catmull-rom) -> sem isto ficava aos bicos;
  let d = "M" + pontos[0][0].toFixed(1) + " " + pontos[0][1].toFixed(1);
  for (let i = 0; i < n; i++) {
    const p0 = pontos[(i - 1 + n) % n], p1 = pontos[i], p2 = pontos[(i + 1) % n], p3 = pontos[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

//manchas entre dois raios -> uso para o queimado da massa, do queijo e para o molho que aparece;
function Manchas(r, cx, cy, quantidade, raioMin, raioMax, desenho) {
  let svg = "";
  for (let i = 0; i < quantidade; i++) {
    const angulo = Entre(r, 0, Math.PI * 2);
    const distancia = Math.sqrt(Entre(r, raioMin * raioMin / (raioMax * raioMax), 1)) * raioMax; //com a raiz espalham por igual, sem ela ficavam todas no meio;
    svg += desenho(cx + Math.cos(angulo) * distancia, cy + Math.sin(angulo) * distancia, angulo);
  }
  return svg;
}

//tabua e sombra -> fica por baixo de tudo;
function Tabua(cx, cy) {
  return `
    <ellipse cx="${cx}" cy="${cy + 16}" rx="250" ry="244" fill="#2B2724" opacity=".3" filter="url(#pSombraChao)"/>
    <circle cx="${cx}" cy="${cy}" r="256" fill="url(#pMadeira)" filter="url(#pVeios)"/>
    <circle cx="${cx}" cy="${cy}" r="255" fill="none" stroke="#6E4420" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="249" fill="none" stroke="#E0B484" stroke-width="1.5" opacity=".35"/>
    <ellipse cx="${cx}" cy="${cy + 8}" rx="236" ry="234" fill="#3A1F0C" opacity=".4" filter="url(#pDesfoque)"/>`;
}

//massa -> borda com bolhas e queimados como quando sai do forno;
function DesenharMassa(cx, cy, r) {
  const bolhas = Manchas(r, cx, cy, 10, 212, 226, function (x, y, a) {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${Entre(r, 6, 13).toFixed(1)}" ry="${Entre(r, 3, 6).toFixed(1)}" transform="rotate(${(a * 57.3 + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#FBE3B4" opacity=".55"/>`;
  });
  const queimado = Manchas(r, cx, cy, 22, 200, 228, function (x, y, a) {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${Entre(r, 2.5, 8).toFixed(1)}" ry="${Entre(r, 2, 4.5).toFixed(1)}" transform="rotate(${(a * 57.3 + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#3B200E" opacity="${Entre(r, .3, .75).toFixed(2)}"/>`;
  });
  return `
    <path d="${Bolha(cx, cy, 230, .012, r)}" fill="url(#pMassa)" filter="url(#pGrao)"/>
    <g filter="url(#pDesfoqueLeve)">${bolhas}${queimado}</g>`;
}

//molho -> a cor depende do molho, e tem sombra onde a borda toca;
function DesenharMolho(cx, cy, molho, r) {
  let cor = "url(#pMolhoTomate)";
  if (molho === "carbonara") cor = "url(#pMolhoCarbonara)";
  if (molho === "bolonhesa") cor = "url(#pMolhoBolonhesa)";
  return `
    <path d="${Bolha(cx, cy, 200, .025, r)}" fill="${cor}" filter="url(#pOrganico)"/>
    <circle cx="${cx}" cy="${cy}" r="203" fill="none" stroke="#5E3415" stroke-width="7" opacity=".35" filter="url(#pDesfoque)"/>
    <circle cx="${cx}" cy="${cy}" r="217" fill="none" stroke="#FFE8BE" stroke-width="9" opacity=".3" filter="url(#pDesfoque)"/>`;
}

//queijo -> derretido, com o molho a aparecer, tostado e brilho;
function DesenharQueijo(cx, cy, molho, r) {
  let corEspreita = "#A9341E";
  if (molho === "carbonara") corEspreita = "#E7D6B0";
  if (molho === "bolonhesa") corEspreita = "#7A3018";

  const pingos = Manchas(r, cx, cy, 6, 150, 168, function (x, y) {
    return `<path d="${Bolha(x, y, Entre(r, 12, 20), .2, r)}" fill="#EFCF8C"/>`;
  });
  const molhoEspreita = Manchas(r, cx, cy, 7, 40, 160, function (x, y) {
    return `<path d="${Bolha(x, y, Entre(r, 4, 9), .3, r)}" fill="${corEspreita}" opacity=".55"/>`;
  });
  const tostado = Manchas(r, cx, cy, 16, 20, 175, function (x, y) {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${Entre(r, 6, 16).toFixed(1)}" ry="${Entre(r, 4, 10).toFixed(1)}" fill="#C4802F" opacity="${Entre(r, .15, .38).toFixed(2)}"/>`;
  });
  const brilhos = Manchas(r, cx, cy, 14, 10, 165, function (x, y) {
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${Entre(r, 4, 11).toFixed(1)}" ry="${Entre(r, 2, 4).toFixed(1)}" fill="#FFFFFF" opacity="${Entre(r, .2, .45).toFixed(2)}"/>`;
  });
  return `
    <g filter="url(#pOrganico)">
      <path d="${Bolha(cx, cy, 180, .06, r)}" fill="url(#pQueijo)"/>
      ${pingos}
    </g>
    <g filter="url(#pDesfoqueLeve)">${molhoEspreita}</g>
    <g filter="url(#pDesfoque)">${tostado}</g>
    <g filter="url(#pDesfoqueLeve)">${brilhos}</g>`;
}

//cortes das fatias -> uma linha escura e uma clara ao lado para parecer o corte da faca;
function DesenharCortes(cx, cy, r) {
  let svg = "";
  for (const angulo of [0, 60, 120]) {
    const rodar = angulo + Entre(r, -4, 4); //cada corte fica um bocado torto, como feito a mao;
    svg += `<g transform="rotate(${rodar} ${cx} ${cy})">
      <path d="M${cx} ${cy - 226} L${cx} ${cy + 226}" stroke="#5A3A1E" stroke-width="1.4" opacity=".28"/>
      <path d="M${cx + 1.5} ${cy - 226} L${cx + 1.5} ${cy + 226}" stroke="#FFF6E2" stroke-width="1.4" opacity=".25"/>
    </g>`;
  }
  return svg;
}

//junta tudo de baixo para cima;
function DesenharBase(cx, cy, molho, semente) {
  const r = Aleatorio("base" + semente);
  return Tabua(cx, cy) +
    DesenharMassa(cx, cy, r) +
    DesenharMolho(cx, cy, molho, r) +
    DesenharQueijo(cx, cy, molho, r) +
    DesenharCortes(cx, cy, r) +
    `<ellipse cx="${cx - 60}" cy="${cy - 80}" rx="120" ry="80" fill="url(#pBrilho)" opacity=".35"/>`;
}

//calzone fechada -> meia lua dobrada com a borda apertada;
function DesenharCalzone(cx, cy, semente) {
  const r = Aleatorio("calzone" + semente);
  const forma = `M${cx - 214} ${cy + 40} C ${cx - 214} ${cy - 150}, ${cx + 214} ${cy - 150}, ${cx + 214} ${cy + 40} C ${cx + 120} ${cy + 96}, ${cx - 120} ${cy + 96}, ${cx - 214} ${cy + 40} Z`;

  //a borda é feita com bolinhas de massa;
  let borda = "";
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const x = cx - 214 + t * 428;
    const y = cy + 40 + Math.sin(t * Math.PI) * 56 - 4;
    const cor = i % 2 === 0 ? "#C58A47" : "#D9A15C";
    borda += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="12" ry="9" fill="${cor}" transform="rotate(${(t * 60 - 30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }

  let tostado = "";
  for (let i = 0; i < 18; i++) {
    tostado += `<ellipse cx="${Entre(r, cx - 170, cx + 170).toFixed(1)}" cy="${Entre(r, cy - 90, cy + 30).toFixed(1)}" rx="${Entre(r, 3, 10).toFixed(1)}" ry="${Entre(r, 2, 5).toFixed(1)}" fill="#6B3A15" opacity="${Entre(r, .2, .55).toFixed(2)}"/>`;
  }

  return `
    ${Tabua(cx, cy)}
    <path d="${forma}" transform="translate(0 8)" fill="#3A1F0C" opacity=".45" filter="url(#pDesfoque)"/>
    <path d="${forma}" fill="url(#pCalzone)" filter="url(#pGrao)"/>
    <g>${borda}</g>
    <g filter="url(#pDesfoqueLeve)">${tostado}</g>
    <g stroke="#6B3A15" stroke-width="3" stroke-linecap="round" opacity=".55">
      <path d="M${cx - 40} ${cy - 60} l18 -14"/><path d="M${cx + 10} ${cy - 66} l18 -14"/><path d="M${cx + 60} ${cy - 56} l18 -14"/>
    </g>
    <path d="M${cx + 64} ${cy - 50} q6 10 -4 16" fill="#A8341E" opacity=".8"/>
    <ellipse cx="${cx - 50}" cy="${cy - 70}" rx="110" ry="40" fill="url(#pBrilho)" opacity=".4"/>`;
}

//se o prato tiver foto no menu.json mostra a foto em circulo em vez do desenho;
function DesenharFoto(cx, cy, foto) {
  return `
    ${Tabua(cx, cy)}
    <clipPath id="corte${cx}${cy}"><circle cx="${cx}" cy="${cy}" r="230"/></clipPath>
    <image href="${foto}" x="${cx - 230}" y="${cy - 230}" width="460" height="460" preserveAspectRatio="xMidYMid slice" clip-path="url(#corte${cx}${cy})"/>`;
}

//a carbonara e a bolonhesa nao levam molho de tomate -> muda a cor;
function MolhoDe(texto) {
  if (/molho carbonara/i.test(texto)) return "carbonara";
  if (/molho bolonhesa/i.test(texto)) return "bolonhesa";
  return "tomate";
}

//devolve a base e os ingredientes separados -> a animacao so mexe nos ingredientes;
function PizzaSVG(nome, texto, cx, cy, foto) {
  if (foto) return { base: DesenharFoto(cx, cy, foto), ingredientes: "" };
  if (/calzone fechada/i.test(nome)) return { base: DesenharCalzone(cx, cy, nome), ingredientes: "" };
  return {
    base: DesenharBase(cx, cy, MolhoDe(texto), nome),
    ingredientes: DesenharIngredientes(nome, texto, cx, cy)
  };
}

//======================================================================;
//3. INGREDIENTES e 4. ESPALHAR -> cada ingrediente é desenhado no 0,0 e depois é mudado para o sitio dele;
//======================================================================;

function DesenharPepperoni(r) {
  const R = Entre(r, 18, 24); //as rodelas nao ficam todas do mesmo tamanho;
  let gordura = "";
  for (let i = 0; i < 5; i++) {
    gordura += `<circle cx="${Entre(r, -R * .6, R * .6).toFixed(1)}" cy="${Entre(r, -R * .6, R * .6).toFixed(1)}" r="${Entre(r, 1.2, 2.6).toFixed(1)}" fill="#EBB48D" opacity=".55"/>`;
  }
  return `<circle r="${R * 1.18}" fill="#E0672A" opacity=".16"/>
    <circle r="${R}" fill="url(#pPep)"/>
    <circle r="${R * .82}" fill="none" stroke="#5A160B" stroke-width="${R * .16}" opacity=".3"/>
    ${gordura}
    <ellipse cx="${-R * .3}" cy="${-R * .35}" rx="${R * .38}" ry="${R * .18}" fill="#FFF" opacity=".2"/>`;
}

function DesenharSalame(r) {
  const R = Entre(r, 18, 22);
  let gordura = "";
  for (let i = 0; i < 9; i++) {
    gordura += `<circle cx="${Entre(r, -R * .65, R * .65).toFixed(1)}" cy="${Entre(r, -R * .65, R * .65).toFixed(1)}" r="${Entre(r, 1.2, 2.8).toFixed(1)}" fill="#F3D3C4" opacity=".75"/>`;
  }
  return `<circle r="${R}" fill="url(#pSalame)"/>${gordura}
    <ellipse cx="${-R * .3}" cy="${-R * .35}" rx="${R * .35}" ry="${R * .16}" fill="#FFF" opacity=".18"/>`;
}

function DesenharFiambre() {
  return `<path d="M-26 -6 C -18 -20, -2 -10, 4 -16 C 14 -24, 28 -8, 24 4 C 20 16, 4 8, -4 16 C -16 22, -30 8, -26 -6 Z" fill="url(#pFiambre)" stroke="#F7DDD6" stroke-width="2.5"/>
    <path d="M-14 -4 q10 6 22 -2" stroke="#C97268" stroke-width="1.4" fill="none" opacity=".6"/>
    <path d="M-10 8 q8 -4 16 2" stroke="#F5C9C1" stroke-width="2" fill="none" opacity=".7"/>`;
}

function DesenharBacon(r) {
  return `<path d="M-24 -6 q8 -6 16 0 t16 0 t16 0 v12 q-8 -6 -16 0 t-16 0 t-16 0 z" fill="url(#pBacon)" stroke="#6E2414" stroke-width="1" transform="scale(${Entre(r, .8, 1.05).toFixed(2)})"/>`;
}

function DesenharCogumelo() {
  return `<path d="M-16 2 C -16 -14, 16 -14, 16 2 C 10 4, 6 2, 5 6 L 5 13 C 5 15, -5 15, -5 13 L -5 6 C -6 2, -10 4, -16 2 Z" fill="url(#pCogumelo)" stroke="#8C6B45" stroke-width="1.6"/>
    <path d="M-11 0 q11 -12 22 0" fill="none" stroke="#B89A72" stroke-width="1" opacity=".8"/>
    <path d="M-7 1 q7 -7 14 0" fill="none" stroke="#B89A72" stroke-width="1" opacity=".6"/>`;
}

function DesenharAzeitona() {
  return `<circle r="9.5" fill="url(#pAzeitona)"/><circle r="4" fill="#E4C48A"/>
    <path d="M-6 -5 a8 8 0 0 1 8 -3" stroke="#FFF" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/>`;
}

function DesenharCebolaRoxa(r) {
  return `<path d="M-15 6 a16 16 0 0 1 30 0" fill="none" stroke="#7A2E5E" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M-15 6 a16 16 0 0 1 30 0" fill="none" stroke="#F0DCE8" stroke-width="1" stroke-linecap="round" transform="translate(0 2.4) scale(.92)"/>
    <path d="M-9 6 a10 10 0 0 1 18 0" fill="none" stroke="#9C4C80" stroke-width="2.4" stroke-linecap="round" opacity="${Entre(r, .5, 1).toFixed(2)}"/>`;
}

function DesenharCebolaFrita() {
  return `<path d="M-9 2 q4 -8 9 -2 t9 -1" fill="none" stroke="#9A5A20" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M-8 1 q4 -7 8 -2" fill="none" stroke="#D49B52" stroke-width="1.2" stroke-linecap="round"/>`;
}

function DesenharOvo(r) {
  return `<path d="${Bolha(0, 0, 40, .14, r)}" fill="#FDFBF5" filter="url(#pDesfoqueLeve)"/>
    <path d="${Bolha(0, 0, 34, .1, r)}" fill="#FFFFFF" opacity=".8"/>
    <circle cx="3" cy="1" r="15" fill="url(#pGema)"/>
    <ellipse cx="-2" cy="-5" rx="5" ry="3" fill="#FFF" opacity=".45"/>`;
}

function DesenharAnanas() {
  return `<path d="M-12 -10 L12 -10 L9 10 L-9 10 Z" fill="url(#pAnanas)" stroke="#D1A02C" stroke-width="1" stroke-linejoin="round"/>
    <path d="M-6 -8 L-4 8 M0 -8 L0 8 M6 -8 L4 8" stroke="#E8BF4A" stroke-width="1" opacity=".8"/>`;
}

function DesenharCamarao() {
  return `<path d="M-14 6 C -18 -12, 6 -20, 15 -6 C 19 1, 12 8, 7 3 C 3 -3, -5 -2, -4 9 C -8 12, -12 10, -14 6 Z" fill="url(#pCamarao)" stroke="#C9592C" stroke-width="1.1"/>
    <path d="M-9 -7 q3 5 1 9 M-2 -11 q2 5 0 9 M5 -11 q-1 5 -2 9" stroke="#D96A3C" stroke-width="1.1" fill="none" opacity=".8"/>
    <path d="M-4 9 l-5 6 l7 -1 z" fill="#E86E3E"/>`;
}

function DesenharAtum(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="${Bolha(0, 0, Entre(r, 8, 12), .3, r)}" fill="#C2A588"/>
    <path d="M-6 -2 q6 -4 12 0 M-5 3 q5 -3 10 0" stroke="#A88A6C" stroke-width="1" fill="none"/></g>`;
}

function DesenharSalmao() {
  return `<path d="M-24 0 C -16 -16, -4 -6, 0 -10 C 8 -18, 24 -8, 24 2 C 18 14, 6 6, 0 10 C -10 16, -26 10, -24 0 Z" fill="url(#pSalmao)"/>
    <path d="M-16 -4 l8 9 M-4 -6 l8 10 M8 -6 l7 9" stroke="#FCD8C8" stroke-width="1.8" opacity=".9"/>`;
}

function DesenharDelicias() {
  return `<rect x="-16" y="-5.5" width="32" height="11" rx="3" fill="#FBF6EE" stroke="#E2D5C0"/>
    <rect x="-16" y="-5.5" width="32" height="4.5" rx="2.5" fill="#E2573E"/>
    <path d="M-14 3 h28" stroke="#EDE3D3" stroke-width="1"/>`;
}

function DesenharMexilhao() {
  return `<ellipse rx="9.5" ry="6.5" fill="#E8984A" stroke="#B9692A" stroke-width="1.1"/>
    <path d="M-6 0 q6 -4 12 0" stroke="#C2763A" stroke-width="1.2" fill="none"/>`;
}

function DesenharBacalhau(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="${Bolha(0, 0, Entre(r, 10, 14), .25, r)}" fill="#F8F3E8" stroke="#DCCFB7" stroke-width="1"/>
    <path d="M-7 -3 q7 -3 14 0 M-6 3 q6 -3 12 0" stroke="#E2D6C1" stroke-width="1.2" fill="none"/></g>`;
}

function DesenharFrango(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="M-13 -4 C -6 -9, 8 -8, 14 -3 C 12 5, 0 8, -12 4 Z" fill="#E6BE86" stroke="#B88A50" stroke-width="1"/>
    <path d="M-9 -2 l18 1 M-8 2 l14 0" stroke="#C99C62" stroke-width="1" opacity=".8"/></g>`;
}

function DesenharCarnePicada(r) {
  const cor = r() > .5 ? "#6E3A22" : "#86472A"; //dois castanhos -> senao pareciam bolinhas todas iguais;
  return `<path d="${Bolha(0, 0, Entre(r, 4, 7), .35, r)}" fill="${cor}"/>`;
}

function DesenharMilho() {
  return `<rect x="-4" y="-4.5" width="8" height="9" rx="3" fill="#F6CC45" stroke="#D3A21B" stroke-width=".8"/>
    <ellipse cx="-1.4" cy="-1.6" rx="1.6" ry="1.2" fill="#FFF" opacity=".5"/>`;
}

function DesenharBrocolo() {
  return `<path d="M-3 4 L-4 14 Q0 16 4 14 L3 4 Z" fill="#8DB463"/>
    <circle cx="-7" cy="-1" r="7" fill="#4C7A2E"/><circle cx="7" cy="-1" r="7" fill="#467228"/>
    <circle cx="0" cy="-7" r="8" fill="#55863A"/><circle cx="-2" cy="-9" r="2" fill="#7FAA55" opacity=".7"/>`;
}

function DesenharEspinafre(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="M-17 0 C -9 -13, 9 -15, 18 -2 C 11 10, -6 12, -17 0 Z" fill="url(#pFolhaEscura)"/>
    <path d="M-15 0 Q0 -3 16 -2" stroke="#4E7A3A" stroke-width="1" fill="none"/></g>`;
}

function DesenharRucula(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="M-22 0 L-16 -5 L-14 -1 L-8 -8 L-6 -2 L0 -9 L2 -2 L8 -8 L9 -1 L16 -5 L22 0 L16 4 L9 2 L8 7 L2 3 L0 8 L-6 3 L-8 7 L-14 2 L-16 5 Z" fill="url(#pFolha)"/>
    <path d="M-20 0 L20 0" stroke="#8CB46A" stroke-width="1"/></g>`;
}

function DesenharManjericao(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="M-24 2 C -16 -16, 14 -18, 25 -1 C 14 12, -12 14, -24 2 Z" fill="url(#pFolha)"/>
    <path d="M-22 1 Q0 -3 23 -1" stroke="#9CC175" stroke-width="1.3" fill="none"/>
    <path d="M-8 -1 l-4 -6 M2 -2 l-3 -7 M12 -2 l-2 -6 M-6 0 l-3 5 M4 0 l-2 6" stroke="#9CC175" stroke-width=".8" fill="none" opacity=".8"/>
    <path d="M-12 -6 C -2 -12, 10 -12, 18 -6" stroke="#FFF" stroke-width="2" fill="none" opacity=".18"/></g>`;
}

function DesenharTomate() {
  return `<circle r="13.5" fill="url(#pTomate)"/><circle r="9.5" fill="#F07A5C"/>
    <path d="M0 -9 L0 9 M-8 5 L8 -5 M-8 -5 L8 5" stroke="#E25D40" stroke-width="2.2"/>
    <circle cx="-4" cy="-3" r="1.7" fill="#F8E0A8"/><circle cx="4" cy="3" r="1.7" fill="#F8E0A8"/><circle cx="3" cy="-5" r="1.5" fill="#F8E0A8"/>
    <ellipse cx="-5" cy="-7" rx="4" ry="2" fill="#FFF" opacity=".35"/>`;
}

function DesenharPimento(r) {
  const cor = r() > .5 ? "url(#pPimVerde)" : "url(#pPimVermelho)"; //uns verdes e outros vermelhos;
  return `<path d="M-15 1 C -9 -8, 9 -8, 15 1 L 12 4 C 7 -2, -7 -2, -12 4 Z" fill="${cor}"/>
    <path d="M-10 -1 C -5 -5, 5 -5, 10 -1" stroke="#FFF" stroke-width="1.3" fill="none" opacity=".35"/>`;
}

function DesenharBurrata(r) {
  return `<ellipse cx="3" cy="6" rx="44" ry="40" fill="#3A1F0C" opacity=".3" filter="url(#pDesfoque)"/>
    <path d="${Bolha(0, 0, 42, .06, r)}" fill="url(#pBurrata)"/>
    <path d="M-16 -2 C -8 -12, 10 -12, 18 0 C 10 12, -8 14, -16 -2 Z" fill="#FBF6EA" stroke="#E8DCC4" stroke-width="1.5"/>
    <path d="M-10 0 q6 -5 12 0 q-6 6 -12 0" fill="#F2E8D3"/>
    <ellipse cx="-14" cy="-20" rx="10" ry="6" fill="#FFF" opacity=".85"/>`;
}

function DesenharQueijoBranco(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="${Bolha(0, 0, Entre(r, 9, 13), .3, r)}" fill="#FBF5E6" stroke="#E6D7B5" stroke-width="1.2"/>
    <ellipse cx="-3" cy="-3" rx="4" ry="2" fill="#FFF" opacity=".6"/></g>`;
}

function DesenharGorgonzola(r) {
  return `<g transform="rotate(${Entre(r, 0, 360).toFixed(0)})">
    <path d="${Bolha(0, 0, Entre(r, 9, 12), .3, r)}" fill="#F3EEDC" stroke="#DCD3B8"/>
    <path d="M-5 -2 q3 2 6 -1 M0 4 q2 -2 5 0" stroke="#6F8CA0" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>`;
}

function DesenharParmesao(r) {
  return `<path d="M-12 -2 C -6 -7, 6 -7, 12 -1 C 6 2, -6 3, -12 -2 Z" fill="#F6E4AE" stroke="#DCC27F" stroke-width=".8" transform="rotate(${Entre(r, 0, 360).toFixed(0)})"/>`;
}

function DesenharPerola() {
  return `<circle r="7" fill="url(#pBurrata)" stroke="#E2D6BE"/>
    <circle cx="1" cy="1" r="2.4" fill="#7E4A6E"/>
    <circle cx="-2" cy="-2.5" r="1.8" fill="#FFF" opacity=".8"/>`;
}

function DesenharAlho() {
  return `<ellipse rx="4.5" ry="3" fill="#F6EBD0" stroke="#E2CFA2" stroke-width=".8"/>`;
}

function DesenharBalsamico() {
  return `<path d="M-120 -40 C -60 -70, -20 20, 40 -10 S 110 30, 130 10" stroke="#3B1D14" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M-100 60 C -40 30, 0 90, 60 60 S 120 70, 110 90" stroke="#3B1D14" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
}

//lista dos ingredientes -> a palavra que procuro no menu, quantas pecas leva e a funcao que o desenha;
//centro -> vai para o meio (ovo, burrata), semSombra -> nao leva sombra (balsamico);
const Ingredientes = [
  { palavras: /pepperoni|chouri[cç]/, pecas: 8, desenho: DesenharPepperoni },
  { palavras: /salame/, pecas: 6, desenho: DesenharSalame },
  { palavras: /fiambre|presunto|parma/, pecas: 6, desenho: DesenharFiambre },
  { palavras: /bacon/, pecas: 6, desenho: DesenharBacon },
  { palavras: /cogumelo/, pecas: 8, desenho: DesenharCogumelo },
  { palavras: /azeitona/, pecas: 8, desenho: DesenharAzeitona },
  { palavras: /cebola roxa/, pecas: 7, desenho: DesenharCebolaRoxa },
  { palavras: /cebola (frita|caramel)/, pecas: 12, desenho: DesenharCebolaFrita },
  { palavras: /ovo/, pecas: 1, centro: true, desenho: DesenharOvo },
  { palavras: /anan[aá]s/, pecas: 7, desenho: DesenharAnanas },
  { palavras: /camar[aã]o/, pecas: 7, desenho: DesenharCamarao },
  { palavras: /atum/, pecas: 8, desenho: DesenharAtum },
  { palavras: /salm[aã]o/, pecas: 6, desenho: DesenharSalmao },
  { palavras: /del[ií]cias do mar/, pecas: 7, desenho: DesenharDelicias },
  { palavras: /mexilh[aã]o/, pecas: 8, desenho: DesenharMexilhao },
  { palavras: /bacalhau/, pecas: 8, desenho: DesenharBacalhau },
  { palavras: /frango/, pecas: 9, desenho: DesenharFrango },
  { palavras: /carne picada|bolonhesa/, pecas: 16, desenho: DesenharCarnePicada },
  { palavras: /milho/, pecas: 16, desenho: DesenharMilho },
  { palavras: /br[oó]colo/, pecas: 7, desenho: DesenharBrocolo },
  { palavras: /espinafre/, pecas: 8, desenho: DesenharEspinafre },
  { palavras: /r[uú]cula/, pecas: 9, desenho: DesenharRucula },
  { palavras: /manjeric[aã]o/, pecas: 6, desenho: DesenharManjericao },
  { palavras: /tomate (fresco|cherry)|(?<!molho de )tomate(,|$)/, pecas: 7, desenho: DesenharTomate }, //o (?<!molho de ) é para o "molho de tomate" nao contar como tomate;
  { palavras: /pimento/, pecas: 8, desenho: DesenharPimento },
  { palavras: /burrata/, pecas: 1, centro: true, desenho: DesenharBurrata },
  { palavras: /brie|queijo da serra|philadelphia|cabra|vegan/, pecas: 7, desenho: DesenharQueijoBranco },
  { palavras: /gorgonzola/, pecas: 6, desenho: DesenharGorgonzola },
  { palavras: /parmes[aã]o/, pecas: 8, desenho: DesenharParmesao },
  { palavras: /p[eé]rolas/, pecas: 9, desenho: DesenharPerola },
  { palavras: /alho/, pecas: 8, desenho: DesenharAlho },
  { palavras: /balsâmico|balsamic/, pecas: 1, centro: true, semSombra: true, desenho: DesenharBalsamico }
];

//oregaos -> pozinho verde por cima, sem sombra porque é muito fino;
function DesenharOregaos(cx, cy, r) {
  let svg = "";
  for (let i = 0; i < 70; i++) {
    const angulo = r() * Math.PI * 2;
    const distancia = Math.sqrt(r()) * 175;
    const x = (cx + Math.cos(angulo) * distancia).toFixed(1);
    const y = (cy + Math.sin(angulo) * distancia).toFixed(1);
    const cor = r() > .4 ? "#4F6A2A" : "#6B5A2A";
    svg += `<rect x="${x}" y="${y}" width="${Entre(r, 1.5, 3.2).toFixed(1)}" height="${Entre(r, 1, 2).toFixed(1)}" fill="${cor}" transform="rotate(${Entre(r, 0, 180).toFixed(0)} ${x} ${y})" opacity=".85"/>`;
  }
  return svg;
}

//dois grupos -> o de fora mete a peca no x,y e o de dentro (.ing) é o que cai na animacao;
function Peca(x, y, rodar, ordem, desenho) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rodar})"><g class="ing" style="--o:${ordem}">${desenho}</g></g>`;
}

//le os ingredientes e desenha os que encontrar;
function DesenharIngredientes(nome, texto, cx, cy) {
  const r = Aleatorio(nome);
  const textoMinusculas = texto.toLowerCase();
  const ocupados = []; //sitios ja ocupados -> para as pecas nao ficarem umas em cima das outras;
  let ordem = 0;
  let comSombra = "";
  let semSombra = "";

  //1. primeiro os do centro -> ficam no meio e por baixo do resto;
  for (const ing of Ingredientes) {
    if (!ing.centro || !ing.palavras.test(textoMinusculas)) continue;
    if (ing.semSombra) {
      semSombra += Peca(cx, cy, 0, ordem, ing.desenho(r));
    } else {
      comSombra += Peca(cx, cy, 0, ordem, ing.desenho(r));
      ocupados.push([cx, cy, 52]);
    }
    ordem++;
  }

  //2. o resto -> cada peca tenta 30 vezes encontrar um sitio livre;
  for (const ing of Ingredientes) {
    if (ing.centro || !ing.palavras.test(textoMinusculas)) continue;
    for (let p = 0; p < ing.pecas; p++) {
      let x = 0, y = 0;
      for (let tentativa = 0; tentativa < 30; tentativa++) {
        const angulo = r() * Math.PI * 2;
        const distancia = Math.sqrt(r()) * 160; //com a raiz espalham por igual, senao iam todas para o meio;
        x = cx + Math.cos(angulo) * distancia;
        y = cy + Math.sin(angulo) * distancia;
        let livre = true;
        for (const o of ocupados) {
          if (Math.hypot(o[0] - x, o[1] - y) < o[2]) livre = false;
        }
        if (livre) break;
      }
      ocupados.push([x, y, ing.pecas > 12 ? 7 : 24]); //as pecas pequenas como o milho podem ficar mais juntas;
      comSombra += Peca(x, y, (r() * 70 - 35).toFixed(0), ordem, ing.desenho(r));
      ordem++;
    }
  }

  //3. por fim os oregaos, se a pizza levar;
  let oregaos = "";
  if (/or[eé]g[aã]os|salsa/.test(textoMinusculas)) oregaos = DesenharOregaos(cx, cy, r);

  return `<g filter="url(#pSombra)">${comSombra}</g>${semSombra}<g>${oregaos}</g>`;
}
