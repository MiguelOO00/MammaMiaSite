//site.js -> é aqui que o site funciona: lê os JSON, mete os textos na página, vê o horário, faz o menu e a pizza do lado;
//os dados (contactos, horário, textos) estão no restaurante.json e o menu no menu.json -> aqui só há código;
//as pizzas são desenhadas no pizza.js -> aqui só chamo a função PizzaSVG;
//
//como está dividido:
//  1. VARIÁVEIS
//  2. FERRAMENTAS        -> funções pequenas que uso em todo o lado;
//  3. DADOS E LÍNGUA     -> lê os JSON e troca entre português e inglês;
//  4. CONTACTOS E MAPA
//  5. HORÁRIO            -> vê se está aberto ou fechado;
//  6. NEVE               -> neve no início e no rodapé;
//  7. SUGESTÕES
//  8. MENU               -> filtros, separadores, pesquisa e pratos;
//  9. PIZZA DO LADO      -> muda com o prato e o tamanho;
// 10. COMO PEDIR, AVALIAÇÕES E FOTOS
// 11. EVENTOS            -> cliques e teclas;
// 12. ARRANQUE

//======================================================================;
//1. VARIÁVEIS;
//======================================================================;

let Restaurante = null; //vem do restaurante.json;
let Menu = null; //vem do menu.json;
let Lingua = "pt"; //"pt" ou "en";
let CategoriaAtual = "pizzas"; //separador do menu que está aberto;
let FiltroAtual = "todas"; //todas, vegetarianas, carne ou marisco;
let PesquisaAtual = ""; //o que a pessoa escreveu na pesquisa;
let TamanhoAtual = 1; //0 pequena, 1 média, 2 familiar -> começa na média porque é a que se pede mais;
let PratoAtual = null; //o prato que está na pizza do lado;
let PausaRato = 0; //depois de carregar numa sugestão o rato fica em cima da lista -> sem esta pausa a pizza trocava logo;

//======================================================================;
//2. FERRAMENTAS;
//======================================================================;

//atalho -> para não ter de escrever document.getElementById sempre;
function Id(nome) {
  return document.getElementById(nome);
}

//os textos dos JSON vêm como { "pt": ..., "en": ... } -> devolve o da língua escolhida, e se faltar o inglês usa o português;
function Traduzir(texto) {
  if (!texto) return "";
  if (Lingua === "en" && texto.en) return texto.en;
  return texto.pt;
}

//texto fixo do site -> T("ligar") dá "Ligar" ou "Call" (estão todos no restaurante.json, em "textos");
function T(chave) {
  return Traduzir(Restaurante.textos[chave]);
}

//troca o {hora}, {tempo}, {dias}... pelo valor -> Preencher("abre às {hora}", { hora: "19:00" }) dá "abre às 19:00";
function Preencher(texto, valores) {
  for (const chave in valores) {
    texto = texto.replace("{" + chave + "}", valores[chave]);
  }
  return texto;
}

//segurança -> tudo o que vem dos JSON passa por aqui antes de ir para a página;
//assim, se alguém meter código no JSON (tipo <script>), aparece como texto e não corre;
function Escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

//segurança -> só aceita links https:// ou ficheiros do próprio site (tipo imagens/foto.jpg);
//um link "javascript:..." no JSON corria código quando se carregava nele, por isso fica "#";
function LinkSeguro(link) {
  if (!link) return "#";
  if (link.startsWith("https://")) return link;
  if (link.startsWith("imagens/")) return link;
  return "#";
}

//preço em euros -> 15.5 fica "15,50 €" e 9 fica "9 €" (sem ",00", igual ao menu de papel);
function Euro(valor) {
  let casas = 2;
  if (Number.isInteger(valor)) casas = 0;
  return valor.toLocaleString("pt-PT", { minimumFractionDigits: casas, maximumFractionDigits: 2 }) + " €";
}

//tira os acentos e põe em minúsculas -> assim quem escrever "amalia" encontra a "Amália";
function SemAcentos(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

//as pizzas e os extras têm três preços (pequena, média, familiar) -> o resto só tem um;
function TemTresPrecos(prato) {
  return prato.pequena !== undefined;
}

//procura um prato pelo nome em português, em todas as categorias;
function ProcurarPrato(nome) {
  for (const categoria of Menu.categorias) {
    for (const prato of categoria.itens) {
      if (prato.nome.pt === nome) return prato;
    }
  }
  return null;
}

//procura a categoria pelo id (tipo "pizzas");
function ProcurarCategoria(id) {
  for (const categoria of Menu.categorias) {
    if (categoria.id === id) return categoria;
  }
  return Menu.categorias[0];
}

//======================================================================;
//3. DADOS E LÍNGUA;
//======================================================================;

//vai buscar os dois JSON -> só funciona com o Live Server (Go Live) ou online, a abrir o ficheiro direto não dá;
async function CarregarDados() {
  const respostaRestaurante = await fetch("conteudo/restaurante.json");
  const respostaMenu = await fetch("conteudo/menu.json");
  Restaurante = await respostaRestaurante.json();
  Menu = await respostaMenu.json();
}

//língua -> se a pessoa já tinha escolhido, continua; senão vai pela língua do telemóvel;
function LerLingua() {
  let guardada = null;
  try {
    guardada = localStorage.getItem("mammamia-lingua");
  } catch (erro) {
    //em modo privado o localStorage às vezes dá erro -> aí ignora e segue;
  }
  if (guardada === "pt" || guardada === "en") Lingua = guardada;
  else if (navigator.language.startsWith("pt")) Lingua = "pt";
  else Lingua = "en";
}

//troca pt/en e guarda a escolha para a próxima visita;
function MudarLingua() {
  if (Lingua === "pt") Lingua = "en";
  else Lingua = "pt";
  try {
    localStorage.setItem("mammamia-lingua", Lingua);
  } catch (erro) {
    //se não der para guardar, só não fica lembrado;
  }
}

//mete os textos na página -> no index.html, data-t="ligar" é um texto fixo e data-texto="inicio.titulo" é um texto do restaurante;
function AplicarTextos() {
  if (Lingua === "pt") document.documentElement.lang = "pt-PT";
  else document.documentElement.lang = "en-GB";
  if (Lingua === "pt") Id("lingua").textContent = "EN"; //o botão mostra a língua para onde se vai mudar;
  else Id("lingua").textContent = "PT";

  //textContent em vez de innerHTML -> o texto entra sempre como texto, nunca como código;
  for (const elemento of document.querySelectorAll("[data-t]")) {
    elemento.textContent = T(elemento.dataset.t);
  }
  for (const elemento of document.querySelectorAll("[data-t-placeholder]")) {
    elemento.placeholder = T(elemento.dataset.tPlaceholder);
  }
  for (const elemento of document.querySelectorAll("[data-t-aria]")) {
    elemento.setAttribute("aria-label", T(elemento.dataset.tAria));
  }
  for (const elemento of document.querySelectorAll("[data-texto]")) {
    const partes = elemento.dataset.texto.split("."); //"inicio.titulo" -> ["inicio", "titulo"];
    elemento.textContent = Traduzir(Restaurante[partes[0]][partes[1]]);
  }

  //no computador diz para passar o rato, no telemóvel diz para tocar -> no telemóvel não há rato;
  if (matchMedia("(hover: hover)").matches) Id("vistaAjuda").textContent = T("ajudaRato");
  else Id("vistaAjuda").textContent = T("ajudaToque");
}

//======================================================================;
//4. CONTACTOS E MAPA;
//======================================================================;

//os números e a morada só estão no restaurante.json -> se mudarem, muda-se lá e muda em todo o site;
function PreencherContactos() {
  const c = Restaurante.contactos;

  //só os números ficam -> tira espaços e qualquer outra coisa, porque o "tel:" só aceita números;
  const telefone = "tel:+351" + c.telefone.replace(/[^0-9]/g, "");
  const telemovel = "tel:+351" + c.telemovel.replace(/[^0-9]/g, "");

  //uso as coordenadas e não a morada -> com a morada o Google às vezes ia parar a outro sítio;
  //o Number() garante que são mesmo números e não outra coisa qualquer;
  const ponto = Number(c.latitude) + "," + Number(c.longitude);

  //o nome do Instagram só pode ter letras, números, pontos e _ -> o resto é tirado;
  const instagram = c.instagram.replace(/[^A-Za-z0-9._]/g, "");

  for (const link of document.querySelectorAll("[data-ligar]")) link.href = telefone;
  for (const link of document.querySelectorAll("[data-ligar-movel]")) link.href = telemovel;
  for (const texto of document.querySelectorAll("[data-fixo]")) texto.textContent = c.telefone;
  for (const texto of document.querySelectorAll("[data-movel]")) texto.textContent = c.telemovel;
  for (const link of document.querySelectorAll("[data-direcoes]")) link.href = "https://www.google.com/maps/dir/?api=1&destination=" + ponto;
  for (const link of document.querySelectorAll("[data-mapa-link]")) link.href = "https://www.google.com/maps/search/?api=1&query=" + ponto;
  for (const link of document.querySelectorAll("[data-instagram]")) link.href = "https://www.instagram.com/" + instagram + "/";
  Id("linkFacebook").href = LinkSeguro(c.facebook);

  const morada = Escapar(c.morada) + "<br>" + Escapar(c.cidade);
  Id("morada").innerHTML = morada;
  Id("mapaMorada").innerHTML = morada;

  Id("mapa").dataset.endereco = "https://maps.google.com/maps?q=" + ponto + "&z=17&hl=pt-PT&output=embed";
  CarregarMapa();
}

//o mapa só carrega quando a pessoa está quase a chegar lá -> é a parte mais pesada do site e assim o início abre mais depressa;
function CarregarMapa() {
  const mapa = Id("mapa");
  if (mapa.src) return; //já carregou -> não carrega outra vez (senão piscava ao mudar de língua);
  const distancia = mapa.getBoundingClientRect().top - window.innerHeight; //quanto falta para o mapa aparecer no ecrã;
  if (distancia < 600) mapa.src = mapa.dataset.endereco; //600px antes -> quando a pessoa lá chega já está pronto;
}

//======================================================================;
//5. HORÁRIO;
//======================================================================;

//nomes iguais aos do restaurante.json -> o 0 é domingo porque o JavaScript conta os dias assim;
const ChavesDias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

//ordem para mostrar a semana -> em Portugal a semana começa à segunda;
const OrdemSemana = [1, 2, 3, 4, 5, 6, 0];

//"14:30" passa a 870 minutos -> com números dá para comparar horas;
function Minutos(hora) {
  const partes = hora.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

//turnos de um dia -> [["12:00","14:30"], ["19:00","22:30"]], ou uma lista vazia se for dia de fecho;
function TurnosDoDia(dia) {
  const h = Restaurante.horario;
  if (!h[ChavesDias[dia]]) return [];
  return [[h.almocoAbre, h.almocoFecha], [h.jantarAbre, h.jantarFecha]];
}

//60 minutos fica "1 hora", o resto fica "45 min";
function TempoQueFalta(minutos) {
  if (minutos === 60) return T("umaHora");
  return Preencher(T("minutos"), { min: minutos });
}

//o estado aparece em dois sítios -> no início e no cartão do mapa;
function EscreverEstado(classe, texto) {
  for (const caixa of [Id("estado"), Id("mapaEstado")]) {
    caixa.className = "estado " + classe; //"aberto" fica verde e "fechado" fica vermelho (está no estilos.css);
    caixa.querySelector(".estado-texto").textContent = texto;
  }
}

//aberto ou fechado -> usa a hora do telemóvel de quem está a ver o site;
function MostrarEstado() {
  const agora = new Date();
  const dia = agora.getDay();
  const minutoAtual = agora.getHours() * 60 + agora.getMinutes();
  const turnosHoje = TurnosDoDia(dia);

  //1. está aberto agora? -> a hora está dentro de um dos turnos;
  for (const turno of turnosHoje) {
    if (minutoAtual >= Minutos(turno[0]) && minutoAtual < Minutos(turno[1])) {
      const faltam = Minutos(turno[1]) - minutoAtual;
      if (faltam <= 60) EscreverEstado("aberto", Preencher(T("abertoFechaDaqui"), { tempo: TempoQueFalta(faltam) }));
      else EscreverEstado("aberto", Preencher(T("abertoFechaAs"), { hora: turno[1] }));
      return;
    }
  }

  //2. ainda abre hoje? -> tipo são 16:00 e o jantar só abre às 19:00;
  for (const turno of turnosHoje) {
    if (minutoAtual < Minutos(turno[0])) {
      const faltam = Minutos(turno[0]) - minutoAtual;
      if (faltam <= 60) EscreverEstado("fechado", Preencher(T("abreDaqui"), { tempo: TempoQueFalta(faltam) }));
      else EscreverEstado("fechado", Preencher(T("abreHoje"), { hora: turno[0] }));
      return;
    }
  }

  //3. hoje já não abre -> vê os dias seguintes até encontrar um dia aberto;
  for (let i = 1; i <= 7; i++) {
    const proximo = (dia + i) % 7; //o % 7 faz com que depois do sábado (6) venha o domingo (0);
    const turnos = TurnosDoDia(proximo);
    if (turnos.length > 0) {
      if (i === 1) EscreverEstado("fechado", Preencher(T("abreAmanha"), { hora: turnos[0][0] }));
      else EscreverEstado("fechado", Preencher(T("abreDia"), { dia: T("diasNo")[proximo], hora: turnos[0][0] }));
      return;
    }
  }
}

//desenha a semana e as horas -> o dia de hoje fica com contorno vermelho;
function DesenharHorario() {
  const hoje = new Date().getDay();
  const h = Restaurante.horario;

  let html = "";
  for (const dia of OrdemSemana) {
    let classes = "";
    if (TurnosDoDia(dia).length > 0) classes += "aberto ";
    if (dia === hoje) classes += "hoje";
    html += `<li class="${classes}">${Escapar(T("diasCurtos")[dia])}</li>`;
  }
  Id("semana").innerHTML = html;

  Id("turnos").innerHTML = `
    <div><small>${Escapar(T("almoco"))}</small><b>${Escapar(h.almocoAbre)} – ${Escapar(h.almocoFecha)}</b></div>
    <div><small>${Escapar(T("jantar"))}</small><b>${Escapar(h.jantarAbre)} – ${Escapar(h.jantarFecha)}</b></div>`;

  //frase dos dias de fecho -> "Estamos fechados à segunda e ao domingo.";
  const fechados = [];
  for (const dia of OrdemSemana) {
    if (TurnosDoDia(dia).length === 0) fechados.push(T("diasAo")[dia]);
  }
  if (fechados.length === 0) {
    Id("fechadoTexto").textContent = "";
    return;
  }
  let lista = fechados[0];
  for (let i = 1; i < fechados.length; i++) {
    if (i === fechados.length - 1) lista += " " + T("e") + " " + fechados[i]; //o último leva "e" e não vírgula;
    else lista += ", " + fechados[i];
  }
  Id("fechadoTexto").textContent = Preencher(T("fechados"), { dias: lista });
}

//======================================================================;
//6. NEVE;
//======================================================================;

//pizza do início -> pepperoni, manjericão e azeitonas porque é a que fica mais bonita;
function DesenharPizzaInicio() {
  if (Id("baseInicio").innerHTML !== "") return; //só desenha uma vez -> senão a animação repetia ao mudar de língua;
  const pizza = PizzaSVG("inicio", "pepperoni, manjericão, azeitonas, orégãos", 260, 260);
  Id("baseInicio").innerHTML = pizza.base;
  Id("ingInicio").innerHTML = pizza.ingredientes;
}

//neve -> a Covilhã é a porta da Serra da Estrela, por isso no inverno neva no início e no rodapé;
function IniciarNeve() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; //quem tem "menos movimento" ligado no telemóvel não vê nada a cair;
  Neve(Id("neveInicio"), Id("inicio"));
  Neve(Id("neveRodape"), document.querySelector(".rodape"));
}

//uma zona de neve -> tela é o canvas onde se desenha e zona é a parte da página onde se ouve o rato;
function Neve(tela, zona) {
  const ctx = tela.getContext("2d");
  const mes = new Date().getMonth(); //0 é janeiro e 11 é dezembro;
  const inverno = mes >= 10 || mes <= 2; //de novembro a março neva -> no resto do ano cai farinha;

  //três camadas -> longe (pequena, lenta), meio, e perto (grande, rápida e mais transparente) -> é isto que dá profundidade;
  //densidade -> quantos flocos por cada 10000 píxeis da zona, assim uma zona pequena não fica cheia demais;
  let camadas = [
    { densidade: 1.1, tamanho: 1.5, queda: 20, brilho: 0.6, vento: 0.45 },
    { densidade: 0.45, tamanho: 2.8, queda: 35, brilho: 0.8, vento: 0.75 },
    { densidade: 0.09, tamanho: 6, queda: 60, brilho: 0.35, vento: 1.2 }
  ];
  if (!inverno) {
    camadas = [{ densidade: 0.8, tamanho: 1.2, queda: 8, brilho: 0.5, vento: 0.25 }];
  }

  let flocos = [];
  let largura = 0;
  let altura = 0;
  let ratoX = -999;
  let ratoY = -999;

  //número ao calhas entre a e b;
  function Entre(a, b) {
    return a + Math.random() * (b - a);
  }

  //floco novo -> no arranque fica num sítio qualquer da zona, depois nasce sempre um pouco acima do topo;
  function NovoFloco(camada, noTopo) {
    const c = camadas[camada];
    let y = Math.random() * altura;
    if (noTopo) y = Entre(-40, -10);
    return {
      camada: camada,
      x: Math.random() * largura,
      y: y,
      raio: c.tamanho * Entre(0.7, 1.4), //nem todos do mesmo tamanho;
      queda: c.queda * Entre(0.7, 1.3), //nem todos à mesma velocidade;
      fase: Math.random() * 6.28,
      balanco: Entre(0.4, 1.1), //cada floco balança ao seu ritmo -> se fossem todos iguais parecia um padrão;
      empurraX: 0,
      empurraY: 0
    };
  }

  let larguraAntes = 0;

  //põe o canvas do tamanho da zona e cria os flocos -> corre no arranque e quando se roda o telemóvel;
  function Medir() {
    //no telemóvel a barra do browser aparece e desaparece com o scroll e muda a altura do ecrã;
    //se a largura não mudou não recria os flocos -> senão a neve recomeçava a cada scroll;
    if (tela.offsetWidth === larguraAntes) return;
    larguraAntes = tela.offsetWidth;
    const escala = Math.min(window.devicePixelRatio || 1, 2); //ecrãs de telemóvel têm mais píxeis -> sem isto ficava desfocado;
    largura = tela.offsetWidth;
    altura = tela.offsetHeight;
    tela.width = largura * escala;
    tela.height = altura * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    flocos = [];
    for (let i = 0; i < camadas.length; i++) {
      const quantos = Math.round(largura * altura / 10000 * camadas[i].densidade);
      for (let n = 0; n < quantos; n++) flocos.push(NovoFloco(i, false));
    }
  }

  //vento -> junta três ondas lentas, por isso nunca se repete igual e de vez em quando vem uma rajada;
  function Vento(tempo) {
    const rajada = Math.max(0, Math.sin(tempo * 0.07 + 4)) ** 6 * 30;
    return Math.sin(tempo * 0.13) * 9 + Math.sin(tempo * 0.37 + 1.7) * 6 + rajada;
  }

  let antes = performance.now();

  //um passo da animação -> mexe todos os flocos um bocadinho e desenha-os;
  function Passo(agora) {
    requestAnimationFrame(Passo);
    const segundos = Math.min((agora - antes) / 1000, 0.05); //tempo desde o último passo -> o máximo evita saltos ao voltar ao separador;
    antes = agora;

    //se a zona não está no ecrã não desenha nada -> não vale a pena gastar bateria;
    const caixa = tela.getBoundingClientRect();
    if (caixa.bottom < 0 || caixa.top > window.innerHeight) return;

    const vento = Vento(agora / 1000);
    ctx.clearRect(0, 0, largura, altura);

    for (const f of flocos) {
      const c = camadas[f.camada];
      f.fase += segundos * f.balanco;
      f.x += (vento * c.vento + Math.sin(f.fase) * 10 * c.vento) * segundos;
      f.y += f.queda * segundos;

      //o rato sopra -> os flocos perto (menos de 110px) são empurrados para longe;
      const dx = f.x - ratoX;
      const dy = f.y - ratoY;
      const distancia = Math.sqrt(dx * dx + dy * dy);
      if (distancia < 110 && distancia > 0) {
        const forca = (1 - distancia / 110) * 260 * segundos;
        f.empurraX += dx / distancia * forca;
        f.empurraY += dy / distancia * forca;
      }
      f.x += f.empurraX * segundos;
      f.y += f.empurraY * segundos;
      f.empurraX *= 0.94; //o empurrão vai perdendo força -> parece ar e não uma parede;
      f.empurraY *= 0.94;
      f.empurraX = Math.max(-200, Math.min(200, f.empurraX)); //limite de velocidade -> um floco nunca dispara a voar;
      f.empurraY = Math.max(-200, Math.min(200, f.empurraY));

      //quando sai da zona volta a nascer em cima, noutro sítio;
      if (f.y > altura + 20) Object.assign(f, NovoFloco(f.camada, true));
      if (f.x > largura + 20) f.x = -20;
      if (f.x < -20) f.x = largura + 20;

      //desenho -> um círculo maior e fraquinho à volta de um círculo mais forte, assim o floco fica macio e não uma bola dura;
      ctx.fillStyle = "#FFFFFF";
      ctx.globalAlpha = c.brilho * 0.35;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.raio, 0, 6.28);
      ctx.fill();
      ctx.globalAlpha = c.brilho;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.raio * 0.55, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  //posição do rato em relação ao canvas -> o canvas não apanha cliques, por isso ouve-se a zona à volta;
  zona.addEventListener("pointermove", function (e) {
    //só o rato sopra a neve -> no telemóvel o dedo é para fazer scroll (e puxar para atualizar), senão a neve disparava;
    if (e.pointerType !== "mouse") return;
    const caixa = tela.getBoundingClientRect();
    ratoX = e.clientX - caixa.left;
    ratoY = e.clientY - caixa.top;
  });
  zona.addEventListener("pointerleave", function () {
    ratoX = -999; //longe de tudo -> deixa de empurrar;
    ratoY = -999;
  });

  Medir();
  window.addEventListener("resize", Medir);
  requestAnimationFrame(Passo);
  tela.classList.add("ligada"); //a neve aparece devagar (o css faz a transição);
}

//======================================================================;
//7. SUGESTÕES;
//======================================================================;

//"especialidade da casa" escrito à mão ao lado do nome;
function NotaDaCasa(prato) {
  if (prato.daCasa) return `<span class="mao">${Escapar(T("daCasa"))}</span>`;
  return "";
}

//os três cartões das sugestões -> se houver foto mostra a foto, senão desenha a pizza;
function DesenharSugestoes() {
  let html = "";
  const sugestoes = Restaurante.sugestoes.pizzas;

  for (let n = 0; n < sugestoes.length; n++) {
    const sugestao = sugestoes[n];
    const prato = ProcurarPrato(sugestao.nome);
    if (!prato) continue; //se o nome não estiver no menu.json salta este cartão;

    let imagem = "";
    if (sugestao.foto) {
      imagem = `<img src="${Escapar(LinkSeguro(sugestao.foto))}" alt="${Escapar(sugestao.nome)}" loading="lazy">`;
    } else {
      const pizza = PizzaSVG(prato.nome.pt, prato.ingredientes.pt, 260, 260);
      imagem = `<svg viewBox="-10 -10 540 550" aria-hidden="true">${pizza.base}${pizza.ingredientes}</svg>`;
    }

    let precos = "";
    if (TemTresPrecos(prato)) {
      const valores = [prato.pequena, prato.media, prato.familiar];
      for (let k = 0; k < 3; k++) {
        let valor = "—";
        if (valores[k]) valor = Euro(valores[k]);
        precos += `<div><small>${Escapar(T("tamanhos")[k])}</small><b>${valor}</b></div>`;
      }
    } else {
      precos = `<div><b>${Euro(prato.preco)}</b></div>`;
    }

    html += `
      <article class="cartao" data-sugestao="${n}" tabindex="0" role="button">
        ${imagem}
        <h3>${Escapar(Traduzir(prato.nome))}${NotaDaCasa(prato)}</h3>
        <p>${Escapar(Traduzir(sugestao.texto))}</p>
        <div class="cartao-precos">${precos}</div>
      </article>`;
  }
  Id("cartoes").innerHTML = html;
}

//======================================================================;
//8. MENU;
//======================================================================;

//palavras que dizem se um prato leva peixe ou carne -> sem acentos porque o texto também é comparado sem acentos;
const PalavrasMarisco = ["camar", "atum", "salm", "bacalhau", "delicias", "mexilh", "peixe"];
const PalavrasCarne = ["fiambre", "bacon", "chouri", "salame", "pepperoni", "presunto", "parma", "frango", "carne", "bolonhesa", "salsicha", "bife", "francesinha", "asinhas"];

//vê se o texto tem alguma das palavras da lista;
function TemPalavra(texto, palavras) {
  for (const palavra of palavras) {
    if (texto.includes(palavra)) return true;
  }
  return false;
}

//tipo de prato para os filtros -> primeiro vê se tem peixe, depois carne, e se não tiver nenhum é vegetariano;
function TipoDoPrato(prato) {
  const texto = SemAcentos(prato.nome.pt + " " + prato.ingredientes.pt);
  if (TemPalavra(texto, PalavrasMarisco)) return "marisco";
  if (TemPalavra(texto, PalavrasCarne)) return "carne";
  return "vegetarianas";
}

//true se o prato tiver de aparecer na lista, com o filtro e a pesquisa que estão escolhidos;
function PratoAparece(prato) {
  if (FiltroAtual !== "todas" && TipoDoPrato(prato) !== FiltroAtual) return false;
  const procura = SemAcentos(PesquisaAtual.trim());
  if (procura === "") return true;
  const textoPrato = SemAcentos(prato.nome.pt + " " + prato.nome.en + " " + prato.ingredientes.pt + " " + prato.ingredientes.en);
  return textoPrato.includes(procura); //procura no nome e nos ingredientes, em português e em inglês;
}

//botões dos filtros;
function DesenharFiltros() {
  let html = "";
  for (const filtro of ["todas", "vegetarianas", "carne", "marisco"]) {
    const escolhido = filtro === FiltroAtual;
    html += `<button type="button" class="filtro" data-filtro="${filtro}" aria-pressed="${escolhido}">${Escapar(T(filtro))}</button>`;
  }
  Id("filtros").innerHTML = html;
}

//um separador por categoria -> enquanto se pesquisa nenhum fica marcado, porque a pesquisa procura em todas;
function DesenharSeparadores() {
  let html = "";
  for (const categoria of Menu.categorias) {
    const escolhido = PesquisaAtual === "" && categoria.id === CategoriaAtual;
    html += `<button type="button" role="tab" data-categoria="${Escapar(categoria.id)}" aria-selected="${escolhido}">${Escapar(Traduzir(categoria.nome))}</button>`;
  }
  Id("separadores").innerHTML = html;
}

//bonecos de 1, 2 e 4 pessoas para os tamanhos -> igual ao menu de papel deles;
const Bonecos = [
  '<svg viewBox="0 0 18 24"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></svg>',
  '<svg viewBox="0 0 32 24"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/><g transform="translate(17 4.8) scale(.8)"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></g></svg>',
  '<svg viewBox="0 0 58 24"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/><g transform="translate(15 6) scale(.75)"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></g><g transform="translate(28 6) scale(.75)"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></g><g transform="translate(41 0)"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></g></svg>'
];

//cabeçalho da lista com os bonecos -> são botões, carregar num muda o tamanho;
function CabecalhoTamanhos() {
  let html = `<div class="tamanhos">`;
  for (let k = 0; k < 3; k++) {
    html += `<button type="button" data-tamanho="${k}" aria-pressed="${k === TamanhoAtual}">${Bonecos[k]}${Escapar(T("tamanhos")[k])}</button>`;
  }
  return html + `</div>`;
}

//uma linha do menu -> três preços nas pizzas e extras, um preço com pontinhos no resto;
function LinhaDoPrato(prato, categoriaId, numero) {
  const nome = `<h3 class="prato-nome">${Escapar(Traduzir(prato.nome))}${NotaDaCasa(prato)}</h3>`;

  let topo = "";
  if (TemTresPrecos(prato)) {
    const valores = [prato.pequena, prato.media, prato.familiar];
    let precos = "";
    for (let k = 0; k < 3; k++) {
      if (valores[k]) precos += `<span class="preco p${k}">${Euro(valores[k])}</span>`;
      else precos += `<span class="preco p${k}"><span class="nao-ha">${Escapar(T("naoHa"))}</span></span>`; //tipo a Burrata, que não há em familiar;
    }
    topo = `<div class="prato-topo tres">${nome}${precos}</div>`;
  } else {
    topo = `<div class="prato-topo">${nome}<span class="pontos"></span><span class="preco">${Euro(prato.preco)}</span></div>`;
  }

  let ingredientes = "";
  if (Traduzir(prato.ingredientes)) ingredientes = `<p class="ingredientes">${Escapar(Traduzir(prato.ingredientes))}</p>`;

  let classes = "prato";
  if (prato === PratoAtual) classes += " ativo";
  return `<article class="${classes}" tabindex="0" data-cat="${Escapar(categoriaId)}" data-i="${numero}">${topo}${ingredientes}</article>`;
}

//lista do menu -> mostra o separador escolhido, mas se houver pesquisa procura em todas as categorias;
function DesenharMenu() {
  const aPesquisar = PesquisaAtual.trim() !== "";
  let html = "";

  for (const categoria of Menu.categorias) {
    if (!aPesquisar && categoria.id !== CategoriaAtual) continue; //sem pesquisa só interessa a categoria aberta;

    let linhas = "";
    for (let i = 0; i < categoria.itens.length; i++) {
      if (PratoAparece(categoria.itens[i])) linhas += LinhaDoPrato(categoria.itens[i], categoria.id, i);
    }
    if (linhas === "") continue;

    if (aPesquisar) html += `<h3 class="grupo">${Escapar(Traduzir(categoria.nome))}</h3>`; //na pesquisa mete o nome da categoria por cima;
    if (TemTresPrecos(categoria.itens[0])) html += CabecalhoTamanhos();
    html += linhas;
  }

  if (html === "") html = `<p class="vazio">${Escapar(T("nada"))}</p>`;
  Id("lista").innerHTML = html;
  Id("lista").dataset.tamanho = TamanhoAtual; //o css pinta de vermelho a coluna deste tamanho;

  //nota da categoria -> tipo a regra de trocar ingredientes nos extras;
  const categoria = ProcurarCategoria(CategoriaAtual);
  Id("notaCategoria").hidden = aPesquisar || !categoria.nota;
  Id("notaCategoria").textContent = Traduzir(categoria.nota);

  //nas massas e saladas não há pizza para mostrar -> esconde a pizza do lado;
  const temVista = aPesquisar || TemTresPrecos(categoria.itens[0]);
  document.querySelector(".menu-grelha").classList.toggle("sem-vista", !temVista);
}

//======================================================================;
//9. PIZZA DO LADO;
//======================================================================;

//botões Pequena, Média e Familiar por baixo da pizza;
function DesenharBotoesTamanho() {
  let html = "";
  for (let k = 0; k < 3; k++) {
    html += `<button type="button" role="radio" aria-checked="${k === TamanhoAtual}" data-tamanho="${k}">${Bonecos[k]}<span>${Escapar(T("tamanhos")[k])}</span></button>`;
  }
  Id("tamanhosBotoes").innerHTML = html;
}

//desenha o prato escolhido -> o tamanho só muda a escala (pequena 76%, média 88%, familiar 100%);
function DesenharVista(animar) {
  if (!PratoAtual) return;
  const prato = PratoAtual;

  let foto = "";
  if (prato.foto && LinkSeguro(prato.foto) !== "#") foto = Escapar(prato.foto); //só usa a foto se o link for seguro;
  const pizza = PizzaSVG(prato.nome.pt, prato.ingredientes.pt, 260, 260, foto);
  Id("baseVista").innerHTML = pizza.base;
  Id("ingVista").innerHTML = pizza.ingredientes;
  Id("vista").classList.toggle("animar", animar); //com a classe "animar" os ingredientes voltam a cair;

  Id("vistaPizza").setAttribute("aria-label", Traduzir(prato.nome));
  Id("vistaNome").textContent = Traduzir(prato.nome);
  Id("vistaIng").textContent = Traduzir(prato.ingredientes);

  const escalas = [0.76, 0.88, 1];
  let escala = escalas[1]; //os pratos com um preço só ficam no tamanho do meio;
  let preco = prato.preco;
  if (TemTresPrecos(prato)) {
    escala = escalas[TamanhoAtual];
    preco = [prato.pequena, prato.media, prato.familiar][TamanhoAtual];
  }
  Id("vistaEscala").style.transform = "scale(" + escala + ")";
  Id("tamanhosBotoes").hidden = !TemTresPrecos(prato); //na burrata e no ovo não há tamanhos;
  if (preco) Id("vistaPreco").textContent = Euro(preco);
  else Id("vistaPreco").textContent = T("naoHa");
}

//muda o tamanho -> chamado pelos botões da pizza e pelos bonecos da lista;
function MudarTamanho(numero) {
  TamanhoAtual = numero;
  DesenharBotoesTamanho();
  DesenharVista(false);
  Id("lista").dataset.tamanho = TamanhoAtual;
  for (const botao of document.querySelectorAll(".tamanhos button")) {
    botao.setAttribute("aria-pressed", Number(botao.dataset.tamanho) === TamanhoAtual);
  }
}

//escolhe um prato da lista -> marca a linha e muda a pizza do lado;
function EscolherPrato(linha) {
  const categoria = ProcurarCategoria(linha.dataset.cat);
  const prato = categoria.itens[Number(linha.dataset.i)];
  if (prato === PratoAtual) return; //se já é este não vale a pena desenhar outra vez;
  PratoAtual = prato;
  for (const outra of document.querySelectorAll(".prato.ativo")) outra.classList.remove("ativo");
  linha.classList.add("ativo");
  DesenharVista(true);
}

//======================================================================;
//10. COMO PEDIR, AVALIAÇÕES E FOTOS;
//======================================================================;

//ícones do "como pedir" -> desenhados a linha, a cor vem do css;
const Icones = {
  mesa: '<circle cx="24" cy="26" r="13"/><circle cx="24" cy="26" r="7"/><path d="M5 10 v10 a3 3 0 0 0 6 0 v-10 M8 20 v22"/><path d="M43 10 c-5 3 -5 12 0 14 v18"/>',
  saco: '<path d="M6 20 h36 v20 h-36 z"/><path d="M6 20 l6 -8 h24 l6 8"/><path d="M16 30 h16"/>',
  casa: '<path d="M6 22 L24 7 L42 22"/><path d="M11 18 v23 h26 v-23"/><path d="M20 41 v-11 h8 v11"/>'
};

//as três opções: comer cá, levar para casa e entrega;
function DesenharComoPedir() {
  let html = "";
  for (const opcao of Restaurante.pedir.opcoes) {
    let icone = Icones.mesa;
    if (Icones[opcao.icone]) icone = Icones[opcao.icone];
    html += `
      <div class="opcao">
        <svg viewBox="0 0 48 48" aria-hidden="true">${icone}</svg>
        <h3>${Escapar(Traduzir(opcao.titulo))}</h3>
        <p>${Escapar(Traduzir(opcao.texto))}</p>
      </div>`;
  }
  Id("opcoes").innerHTML = html;
}

//"2026-10-20" passa a "há 1 semana" -> é calculado cada vez, por isso nunca fica desatualizado;
function TempoDesde(data) {
  const dias = Math.floor((new Date() - new Date(data)) / 86400000); //86400000 milissegundos = 1 dia;
  if (dias <= 0) return T("hoje");
  if (dias === 1) return T("ontem");
  if (dias < 7) return Preencher(T("haDias"), { n: dias });
  if (dias < 14) return T("haSemana");
  if (dias < 30) return Preencher(T("haSemanas"), { n: Math.floor(dias / 7) });
  if (dias < 60) return T("haMes");
  if (dias < 365) return Preencher(T("haMeses"), { n: Math.floor(dias / 30) });
  if (dias < 730) return T("haAno");
  return Preencher(T("haAnos"), { n: Math.floor(dias / 365) });
}

//faixa das avaliações -> os cartões vão duas vezes seguidas, assim quando a primeira volta acaba a segunda já está no sítio e parece que nunca acaba;
function DesenharAvaliacoes() {
  const a = Restaurante.avaliacoes;
  if (!a || a.lista.length === 0) {
    Id("avaliacoes").hidden = true; //sem avaliações no JSON a parte não aparece;
    return;
  }

  let nota = String(a.nota);
  if (Lingua === "pt") nota = nota.replace(".", ","); //em português é 4,6 e em inglês 4.6;
  Id("avaliacoesNota").textContent = Preencher(T("avaliacoesNota"), { nota: nota, total: a.total });
  const link = LinkSeguro(a.link);
  Id("avaliacoesLink").href = link;

  let cartoes = "";
  for (const avaliacao of a.lista) {
    const estrelas = Math.max(0, Math.min(5, Number(avaliacao.estrelas))); //entre 0 e 5, por segurança;
    let autor = "";
    if (avaliacao.nome) autor = `<b>${Escapar(avaliacao.nome)}</b> · `; //sem nome mostra só a data -> não se inventa nome nenhum;
    cartoes += `
      <a class="avaliacao" href="${Escapar(link)}" target="_blank" rel="noopener noreferrer">
        <span class="estrelas" aria-label="${Escapar(Preencher(T("estrelas"), { n: estrelas }))}">${"★".repeat(estrelas)}<span class="vazia">${"★".repeat(5 - estrelas)}</span></span>
        <p class="avaliacao-texto">${Escapar(avaliacao.texto)}</p>
        <p class="avaliacao-autor">${autor}${Escapar(TempoDesde(avaliacao.data))}</p>
      </a>`;
  }
  //a cópia fica escondida dos leitores de ecrã -> senão liam as avaliações todas duas vezes;
  Id("faixa").innerHTML = cartoes + `<div class="faixa-copia" aria-hidden="true">${cartoes}</div>`;
  Id("faixa").style.setProperty("--tempo", a.lista.length * 7 + "s"); //7 segundos por cartão -> com mais avaliações a faixa não fica mais rápida;
}

//galeria -> só aparece se houver fotos no restaurante.json;
function DesenharFotos() {
  const fotos = Restaurante.fotos || [];
  Id("fotos").hidden = fotos.length === 0;
  let html = "";
  for (let i = 0; i < fotos.length; i++) {
    html += `<button type="button" class="foto" data-foto="${i}"><img src="${Escapar(LinkSeguro(fotos[i].imagem))}" alt="${Escapar(Traduzir(fotos[i].descricao))}" loading="lazy"></button>`;
  }
  Id("fotosGrelha").innerHTML = html;
}

//abre a foto em grande por cima da página;
function AbrirFoto(numero) {
  const foto = Restaurante.fotos[numero];
  Id("fotoGrandeImg").src = LinkSeguro(foto.imagem);
  Id("fotoGrandeImg").alt = Traduzir(foto.descricao);
  Id("fotoGrande").showModal();
}

//======================================================================;
//11. EVENTOS;
//======================================================================;

//os eventos ficam nas caixas de fora (tipo a #lista) -> o que está dentro é desenhado outra vez muitas vezes e perdia os eventos;
function LigarEventos() {
  //botão PT/EN;
  Id("lingua").addEventListener("click", function () {
    MudarLingua();
    DesenharTudo();
  });

  //separadores das categorias -> mudar de separador limpa a pesquisa;
  Id("separadores").addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (!botao) return;
    CategoriaAtual = botao.dataset.categoria;
    PesquisaAtual = "";
    Id("pesquisa").value = "";
    DesenharSeparadores();
    DesenharMenu();
  });

  //filtros;
  Id("filtros").addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (!botao) return;
    FiltroAtual = botao.dataset.filtro;
    DesenharFiltros();
    DesenharMenu();
  });

  //pesquisa -> a lista muda a cada letra escrita;
  Id("pesquisa").addEventListener("input", function () {
    PesquisaAtual = Id("pesquisa").value;
    DesenharSeparadores();
    DesenharMenu();
  });

  //no computador a pizza muda ao passar o rato por cima de um prato;
  Id("lista").addEventListener("mouseover", function (e) {
    const linha = e.target.closest(".prato");
    if (!linha) return;
    if (!matchMedia("(hover: hover)").matches) return; //no telemóvel não há rato -> lá é ao tocar;
    if (Date.now() < PausaRato) return;
    EscolherPrato(linha);
  });

  //clique na lista -> num boneco muda o tamanho, num prato escolhe o prato;
  Id("lista").addEventListener("click", function (e) {
    const boneco = e.target.closest(".tamanhos button");
    if (boneco) {
      MudarTamanho(Number(boneco.dataset.tamanho));
      return;
    }
    const linha = e.target.closest(".prato");
    if (linha) EscolherPrato(linha);
  });

  //teclado -> Enter ou espaço num prato também o escolhe;
  Id("lista").addEventListener("keydown", function (e) {
    const linha = e.target.closest(".prato");
    if (linha && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); //senão o espaço fazia scroll à página;
      EscolherPrato(linha);
    }
  });

  //botões de tamanho por baixo da pizza;
  Id("tamanhosBotoes").addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (botao) MudarTamanho(Number(botao.dataset.tamanho));
  });

  //carregar numa sugestão -> vai ao menu com essa pizza já escolhida;
  Id("cartoes").addEventListener("click", function (e) {
    const cartao = e.target.closest(".cartao");
    if (!cartao) return;
    const nome = Restaurante.sugestoes.pizzas[Number(cartao.dataset.sugestao)].nome;
    for (const categoria of Menu.categorias) {
      for (const prato of categoria.itens) {
        if (prato.nome.pt === nome) {
          CategoriaAtual = categoria.id;
          PratoAtual = prato;
        }
      }
    }
    PesquisaAtual = "";
    Id("pesquisa").value = "";
    PausaRato = Date.now() + 1500; //1,5 segundos sem mudar a pizza com o rato;
    DesenharSeparadores();
    DesenharMenu();
    DesenharVista(true);
    Id("menu").scrollIntoView();
  });

  //fotos -> abrir, fechar no X e fechar ao carregar fora da foto;
  Id("fotosGrelha").addEventListener("click", function (e) {
    const botao = e.target.closest(".foto");
    if (botao) AbrirFoto(Number(botao.dataset.foto));
  });
  Id("fecharFoto").addEventListener("click", function () {
    Id("fotoGrande").close();
  });
  Id("fotoGrande").addEventListener("click", function (e) {
    if (e.target === Id("fotoGrande")) Id("fotoGrande").close();
  });

  //a cada scroll vê se já está perto do mapa para o carregar;
  window.addEventListener("scroll", CarregarMapa);
}

//======================================================================;
//12. ARRANQUE;
//======================================================================;

//desenha a página toda -> no arranque e sempre que se muda a língua;
function DesenharTudo() {
  AplicarTextos();
  PreencherContactos();
  MostrarEstado();
  DesenharHorario();
  DesenharPizzaInicio();
  DesenharSugestoes();
  DesenharComoPedir();
  DesenharFiltros();
  DesenharSeparadores();
  DesenharMenu();
  DesenharBotoesTamanho();
  DesenharVista(false);
  DesenharFotos();
  DesenharAvaliacoes();
}

//arranque -> lê os dados e põe o site a funcionar;
async function Arrancar() {
  try {
    await CarregarDados();
  } catch (erro) {
    document.body.classList.remove("a-carregar"); //mesmo com erro a página tem de aparecer, para se ler o aviso;
    Id("lista").textContent = "Não foi possível carregar o menu. Abra o site com o Live Server (Go Live).";
    return;
  }
  LerLingua();
  PratoAtual = ProcurarPrato("MammaMia"); //a pizza do lado começa na pizza da casa;
  if (!PratoAtual) PratoAtual = Menu.categorias[0].itens[0];
  LigarEventos();
  DesenharTudo();
  document.body.classList.remove("a-carregar"); //já está tudo desenhado -> a página aparece de uma vez, sem os textos a saltar;
  setTimeout(IniciarNeve, 2500); //a neve só começa depois de a pizza do início acabar de cair -> assim o browser não faz as duas animações pesadas ao mesmo tempo;
  setInterval(MostrarEstado, 30000); //vê o horário de 30 em 30 segundos -> assim os minutos vão descendo sozinhos;
}

Arrancar();
