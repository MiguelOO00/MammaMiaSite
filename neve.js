// =========================================================
// NEVE A CAIR (opcional)
// A Covilhã é a porta da Serra da Estrela -> de novembro a março neva no início e no rodapé;
// no resto do ano cai farinha, mais pequena e mais devagar.
// Para tirar: apaga a linha <script src="neve.js"></script> no index.html.
// =========================================================


// ---------- 1. Definições (podes mudar à vontade) ----------

const MES = new Date().getMonth();          //0 é janeiro e 11 é dezembro;
const INVERNO = MES >= 10 || MES <= 2;      //novembro a março;
const FLOCOS = INVERNO ? 0.7 : 0.5;         //flocos por cada 10000 píxeis de ecrã;
const TAMANHO = INVERNO ? [1, 4] : [0.5, 2];  //raio mais pequeno e maior;
const QUEDA = INVERNO ? [15, 45] : [5, 14];   //píxeis por segundo (os maiores caem mais depressa, parecem mais perto);


// ---------- 2. Uma zona de neve (canvas) ----------

function neve(tela, zona) {
  const ctx = tela.getContext("2d");
  let flocos = [];
  let largura = 0;
  let rato = { x: -999, y: -999 }; //longe de tudo até o rato entrar na zona;

  function novoFloco(noTopo) { //floco com tamanho e velocidade ao calhas;
    const p = Math.random(); //perto (1) ou longe (0) -> os de perto são maiores, mais rápidos e mais transparentes;
    return {
      x: Math.random() * tela.clientWidth,
      y: noTopo ? -10 : Math.random() * tela.clientHeight,
      raio: TAMANHO[0] + p * (TAMANHO[1] - TAMANHO[0]),
      queda: QUEDA[0] + p * (QUEDA[1] - QUEDA[0]),
      brilho: 0.8 - p * 0.4,
      fase: Math.random() * 6.28 //cada floco balança ao seu ritmo;
    };
  }

  function medir() { //acerta o canvas ao tamanho da zona; só recomeça se a largura mudar (a barra do telemóvel muda a altura);
    if (tela.clientWidth === largura) return;
    largura = tela.clientWidth;
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    tela.width = largura * escala;
    tela.height = tela.clientHeight * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    const quantos = Math.round(largura * tela.clientHeight / 10000 * FLOCOS);
    flocos = Array.from({ length: quantos }, () => novoFloco(false));
  }

  let antes = performance.now();

  function passo(agora) {
    requestAnimationFrame(passo);
    const s = Math.min((agora - antes) / 1000, 0.05); //segundos desde o último passo (máximo evita saltos);
    antes = agora;

    const caixa = tela.getBoundingClientRect();
    if (caixa.bottom < 0 || caixa.top > window.innerHeight) return; //fora do ecrã não desenha -> poupa bateria;

    const vento = Math.sin(agora / 7000) * 12 + Math.sin(agora / 2600) * 5; //duas ondas lentas -> o vento nunca se repete igual;
    ctx.clearRect(0, 0, tela.clientWidth, tela.clientHeight);
    ctx.fillStyle = "#FFF";

    for (const f of flocos) {
      f.fase += s;
      f.x += (vento + Math.sin(f.fase) * 8) * (f.raio / 3) * s; //os maiores apanham mais vento;
      f.y += f.queda * s;

      //o rato sopra -> os flocos a menos de 90px fogem um bocadinho;
      const dx = f.x - rato.x, dy = f.y - rato.y, d = Math.hypot(dx, dy);
      if (d < 90 && d > 0) {
        f.x += dx / d * (90 - d) * 2 * s;
        f.y += dy / d * (90 - d) * 2 * s;
      }

      if (f.y > tela.clientHeight + 10) Object.assign(f, novoFloco(true)); //saiu por baixo -> volta a nascer em cima;
      if (f.x > tela.clientWidth + 10) f.x = -10;
      if (f.x < -10) f.x = tela.clientWidth + 10;

      ctx.globalAlpha = f.brilho * 0.35; //halo fraquinho à volta -> o floco fica macio;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.raio, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = f.brilho;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.raio * 0.55, 0, 6.28);
      ctx.fill();
    }
  }

  //só o rato sopra -> no telemóvel o dedo é para fazer scroll e puxar para atualizar;
  zona.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const caixa = tela.getBoundingClientRect();
    rato = { x: e.clientX - caixa.left, y: e.clientY - caixa.top };
  });
  zona.addEventListener("pointerleave", () => rato = { x: -999, y: -999 });

  medir();
  window.addEventListener("resize", medir);
  requestAnimationFrame(passo);
  tela.classList.add("ligada"); //a neve aparece suave (transição no estilos.css);
}


// ---------- 3. Arranque ----------

//quem tem "menos movimento" ligado no telemóvel não vê nada a cair;
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setTimeout(() => { //começa pouco depois da página -> não arranca ao mesmo tempo que a pizza do início;
    neve(document.getElementById("neveInicio"), document.getElementById("inicio"));
    neve(document.getElementById("neveRodape"), document.querySelector(".rodape"));
  }, 800);
}
