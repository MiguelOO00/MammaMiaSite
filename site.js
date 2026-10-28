//site.js -> é aqui que o site funciona: le os JSON, mete os textos, ve o horario, faz o menu e a pizza do lado;
//as pizzas sao desenhadas no pizza.js -> aqui so chamo as funcoes de la;
//
//como esta dividido:
//  1. VARIAVEIS       -> o que o site tem de guardar;
//  2. FERRAMENTAS     -> funcoes pequenas que uso em todo o lado;
//  3. TEXTOS PT/EN    -> textos fixos nas duas linguas;
//  4. DADOS           -> vai buscar o site.json e o menu.json;
//  5. CONTACTOS       -> telefones, morada, mapa e redes;
//  6. HORARIO         -> ve se esta aberto ou fechado;
//  7. INICIO          -> a pizza de cima e a farinha;
//  8. SUGESTOES       -> os tres cartoes;
//  9. MENU            -> filtros, separadores, pesquisa e pratos;
// 10. PIZZA DO LADO   -> a pizza que muda com o prato e o tamanho;
// 11. COMO PEDIR E FOTOS;
// 12. EVENTOS         -> cliques e teclas;
// 13. ARRANQUE        -> poe tudo a andar;

//======================================================================;
//1. VARIAVEIS;
//======================================================================;

let Site = null; //vem do site.json -> contactos, horario e textos;
let Menu = null; //vem do menu.json -> categorias e pratos;
let Lingua = "pt"; //pt ou en;
let CategoriaAtual = "pizzas"; //separador que esta aberto;
let FiltroAtual = "todas"; //todas, vegetarianas, carne ou marisco;
let PesquisaAtual = ""; //o que a pessoa escreveu na pesquisa;
let TamanhoAtual = 1; //0 pequena, 1 media, 2 familiar -> comeca na media porque é a que se pede mais;
let PratoAtual = null; //o prato que esta na pizza do lado;
let PausaRato = 0; //quando se carrega numa sugestao o rato fica em cima da lista -> sem isto a pizza trocava logo para outra;

//======================================================================;
//2. FERRAMENTAS;
//======================================================================;

//atalho -> para nao ter de escrever document.getElementById sempre;
function Id(nome) {
  return document.getElementById(nome);
}

//poe o preco em euros -> 15.5 fica "15,50 €" e 9 fica "9 €";
function Euro(valor) {
  let casas = 2;
  if (Number.isInteger(valor)) casas = 0; //se for redondo nao leva ",00" -> igual ao menu de papel;
  return valor.toLocaleString("pt-PT", { minimumFractionDigits: casas, maximumFractionDigits: 2 }) + " €";
}

//tira os acentos -> assim se escreverem "amalia" aparece a Amália na mesma;
function SemAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

//as pizzas e os extras tem tres precos -> o resto so tem um;
function TemTresPrecos(prato) {
  return prato.pequena !== undefined;
}

//procura um prato pelo nome em portugues, em todas as categorias;
function ProcurarPrato(nome) {
  for (const categoria of Menu.categorias) {
    for (const prato of categoria.itens) {
      if (prato.nome.pt === nome) return prato;
    }
  }
  return null;
}

//======================================================================;
//3. TEXTOS PT/EN -> aqui so estao os textos fixos, os do restaurante estao no site.json;
//======================================================================;

const Textos = {
  pt: {
    menu: "Menu",
    comoPedir: "Como pedir",
    horario: "Horário",
    onde: "Onde estamos",
    ligar: "Ligar",
    verMenu: "Ver o menu",
    servLocal: "Comer no local",
    servTake: "Take away",
    servEntrega: "Entrega em casa",
    oMenu: "O menu",
    iva: "Preços com IVA incluído.",
    procurar: "Procure uma pizza ou um ingrediente",
    categorias: "Categorias do menu",
    tamanho: "Tamanho",
    ajudaToque: "toque numa pizza para a ver",
    ajudaRato: "passe o rato por cima de uma pizza para a ver",
    intolerancia: "Tem alguma intolerância alimentar? Diga-nos quando fizer o pedido.",
    ou: "ou",
    telemovel: "telemóvel",
    telemovelM: "Telemóvel",
    telefone: "Telefone",
    ligarAgora: "Ligar agora",
    aCasa: "A nossa casa",
    comoChegar: "Como chegar",
    estamosAqui: "estamos aqui",
    abrirMapa: "Abrir no Google Maps",
    wifi: "Wi-Fi disponível",
    fechar: "Fechar",
    daCasa: "especialidade da casa",
    naoHa: "não existe",
    nada: "Não encontrámos nada. Experimente outra palavra.",
    todas: "Todas",
    vegetarianas: "Sem carne nem peixe",
    carne: "Com carne",
    marisco: "Peixe e marisco",
    almoco: "Almoço",
    jantar: "Jantar",
    e: "e",
    abertoFechaAs: "Aberto agora, fecha às {hora}",
    abertoFechaDaqui: "Aberto agora, fecha daqui a {tempo}",
    abreDaqui: "Fechado, abre daqui a {tempo}",
    abreHoje: "Fechado, abre hoje às {hora}",
    umaHora: "1 hora",
    minutos: "{min} min",
    abreAmanha: "Fechado, abre amanhã às {hora}",
    abreDia: "Fechado, abre {dia} às {hora}",
    diasNo: ["no domingo", "na segunda", "na terça", "na quarta", "na quinta", "na sexta", "no sábado"],
    diasAo: ["ao domingo", "à segunda", "à terça", "à quarta", "à quinta", "à sexta", "ao sábado"],
    fechados: "Estamos fechados {dias}.",
    tamanhos: ["Pequena", "Média", "Familiar"],
    diasCurtos: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    diasLongos: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
  },
  en: {
    menu: "Menu",
    comoPedir: "How to order",
    horario: "Opening hours",
    onde: "Find us",
    ligar: "Call",
    verMenu: "See the menu",
    servLocal: "Eat in",
    servTake: "Take away",
    servEntrega: "Delivery",
    oMenu: "Our menu",
    iva: "Prices include VAT.",
    procurar: "Search for a pizza or ingredient",
    categorias: "Menu categories",
    tamanho: "Size",
    ajudaToque: "tap a pizza to see it",
    ajudaRato: "hover over a pizza to see it",
    intolerancia: "Any food intolerances? Let us know when you order.",
    ou: "or",
    telemovel: "mobile",
    telemovelM: "Mobile",
    telefone: "Phone",
    ligarAgora: "Call now",
    aCasa: "Our place",
    comoChegar: "Directions",
    estamosAqui: "we're here",
    abrirMapa: "Open in Google Maps",
    wifi: "Free Wi-Fi",
    fechar: "Close",
    daCasa: "house special",
    naoHa: "n/a",
    nada: "Nothing found. Try another word.",
    todas: "All",
    vegetarianas: "Vegetarian",
    carne: "With meat",
    marisco: "Fish and seafood",
    almoco: "Lunch",
    jantar: "Dinner",
    e: "and",
    abertoFechaAs: "Open now, closes at {hora}",
    abertoFechaDaqui: "Open now, closes in {tempo}",
    abreDaqui: "Closed, opens in {tempo}",
    abreHoje: "Closed, opens today at {hora}",
    umaHora: "1 hour",
    minutos: "{min} min",
    abreAmanha: "Closed, opens tomorrow at {hora}",
    abreDia: "Closed, opens {dia} at {hora}",
    diasNo: ["on Sunday", "on Monday", "on Tuesday", "on Wednesday", "on Thursday", "on Friday", "on Saturday"],
    diasAo: ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"],
    fechados: "We are closed on {dias}.",
    tamanhos: ["Small", "Medium", "Family"],
    diasCurtos: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    diasLongos: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  }
};

//da o texto na lingua certa -> T("ligar") da "Ligar" ou "Call";
function T(chave) {
  return Textos[Lingua][chave];
}

//troca o {hora}, {tempo}, {min}... pelo valor -> Preencher(T("abreHoje"), { hora: "19:00" });
function Preencher(texto, valores) {
  for (const chave in valores) {
    texto = texto.replace("{" + chave + "}", valores[chave]);
  }
  return texto;
}

//textos dos JSON vem como { pt, en } -> se o en estiver vazio fica o pt;
function Traduzir(objeto) {
  if (!objeto) return "";
  if (typeof objeto === "string") return objeto;
  if (Lingua === "en" && objeto.en) return objeto.en;
  return objeto.pt;
}

//ve se ja havia lingua guardada -> quem escolheu ingles volta e continua em ingles;
function LerLingua() {
  try {
    const guardada = localStorage.getItem("mammamia-lingua");
    if (guardada) {
      Lingua = guardada;
      return;
    }
  } catch (erro) {}
  //se nao houver -> vai pela lingua do telemovel;
  if (navigator.language.startsWith("pt")) Lingua = "pt";
  else Lingua = "en";
}

//troca pt/en e guarda para a proxima vez;
function MudarLingua() {
  if (Lingua === "pt") Lingua = "en";
  else Lingua = "pt";
  try {
    localStorage.setItem("mammamia-lingua", Lingua);
  } catch (erro) {}
}

//mete os textos na pagina -> data-t sao os fixos e data-texto sao os do site.json (tipo "inicio.titulo");
function AplicarTextos() {
  document.documentElement.lang = Lingua === "pt" ? "pt-PT" : "en-GB";
  Id("lingua").textContent = Lingua === "pt" ? "EN" : "PT"; //o botao mostra a outra lingua, a que se vai mudar;

  for (const el of document.querySelectorAll("[data-t]")) {
    el.textContent = T(el.dataset.t);
  }
  for (const el of document.querySelectorAll("[data-t-placeholder]")) {
    el.placeholder = T(el.dataset.tPlaceholder);
  }
  for (const el of document.querySelectorAll("[data-t-aria]")) {
    el.setAttribute("aria-label", T(el.dataset.tAria));
  }
  for (const el of document.querySelectorAll("[data-texto]")) {
    const partes = el.dataset.texto.split("."); //"inicio.titulo" -> ["inicio", "titulo"];
    el.textContent = Traduzir(Site[partes[0]][partes[1]]);
  }

  //no computador diz para passar o rato, no telemovel diz para tocar -> no telemovel nao ha rato;
  if (matchMedia("(hover: hover)").matches) Id("vistaAjuda").textContent = T("ajudaRato");
  else Id("vistaAjuda").textContent = T("ajudaToque");
}

//======================================================================;
//4. DADOS;
//======================================================================;

//vai buscar os dois JSON -> a demo de um ficheiro so ja tem os dados dentro (window.DADOS);
async function CarregarDados() {
  if (window.DADOS) {
    Site = window.DADOS.site;
    Menu = window.DADOS.menu;
    return;
  }
  const respostaSite = await fetch("conteudo/site.json");
  const respostaMenu = await fetch("conteudo/menu.json");
  Site = await respostaSite.json();
  Menu = await respostaMenu.json();
}

//======================================================================;
//5. CONTACTOS;
//======================================================================;

//os numeros e a morada so estao no site.json -> se mudarem, mudo la e muda em todo o lado;
function PreencherContactos() {
  const c = Site.contactos;
  const telefone = "tel:+351" + c.telefone.replace(/\s/g, ""); //o tel: nao pode ter espacos;
  const telemovel = "tel:+351" + c.telemovel.replace(/\s/g, "");
  const ponto = c.latitude + "," + c.longitude; //uso as coordenadas e nao a morada -> com a morada o Google as vezes ia parar a outro sitio;

  for (const a of document.querySelectorAll("[data-ligar]")) a.href = telefone;
  for (const a of document.querySelectorAll("[data-ligar-movel]")) a.href = telemovel;
  for (const s of document.querySelectorAll("[data-fixo]")) s.textContent = c.telefone;
  for (const s of document.querySelectorAll("[data-movel]")) s.textContent = c.telemovel;
  for (const a of document.querySelectorAll("[data-direcoes]")) a.href = "https://www.google.com/maps/dir/?api=1&destination=" + ponto;
  for (const a of document.querySelectorAll("[data-instagram]")) a.href = "https://www.instagram.com/" + c.instagram + "/";
  Id("linkFacebook").href = c.facebook;
  Id("morada").innerHTML = c.morada + "<br>" + c.cidade;

  //carregar no mapa abre o Google Maps;
  for (const a of document.querySelectorAll("[data-mapa-link]")) a.href = "https://www.google.com/maps/search/?api=1&query=" + ponto;
  Id("mapaMorada").innerHTML = c.morada + "<br>" + c.cidade;

  //so carrega o mapa uma vez -> senao piscava sempre que se mudava a lingua;
  if (!Id("mapa").src) Id("mapa").src = "https://maps.google.com/maps?q=" + ponto + "&z=17&hl=pt-PT&output=embed";
}

//======================================================================;
//6. HORARIO;
//======================================================================;

const ChavesDias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]; //tem de ser igual ao site.json, e o 0 é domingo porque o JS conta assim;

const OrdemSemana = [1, 2, 3, 4, 5, 6, 0]; //para mostrar a semana a comecar a segunda;

//"14:30" passa a 870 -> com numeros da para comparar horas;
function Minutos(hora) {
  const partes = hora.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

//da os turnos do dia -> [["12:00","14:30"], ["19:00","22:30"]] ou [] se for dia de fecho;
function TurnosDoDia(dia) {
  const h = Site.horario;
  if (!h[ChavesDias[dia]]) return [];
  return [[h.almocoAbre, h.almocoFecha], [h.jantarAbre, h.jantarFecha]];
}

//60 fica "1 hora", o resto fica "45 min";
function TempoQueFalta(minutos) {
  if (minutos === 60) return T("umaHora");
  return Preencher(T("minutos"), { min: minutos });
}

//o estado aparece em dois sitios -> no inicio e no cartao do mapa;
function EscreverEstado(classe, texto) {
  for (const caixa of [Id("estado"), Id("mapaEstado")]) {
    caixa.className = "estado " + classe; //aberto fica verde e fechado fica vermelho (esta no estilos.css);
    caixa.querySelector(".estado-texto").textContent = texto;
  }
}

//ve se esta aberto -> usa a hora do telemovel de quem esta a ver o site;
function MostrarEstado() {
  const agora = new Date();
  const dia = agora.getDay();
  const minutoAtual = agora.getHours() * 60 + agora.getMinutes();
  const turnosHoje = TurnosDoDia(dia);

  //se a hora estiver dentro de um turno -> esta aberto;
  for (const turno of turnosHoje) {
    if (minutoAtual >= Minutos(turno[0]) && minutoAtual < Minutos(turno[1])) {
      const faltam = Minutos(turno[1]) - minutoAtual;
      if (faltam <= 60) EscreverEstado("aberto", Preencher(T("abertoFechaDaqui"), { tempo: TempoQueFalta(faltam) }));
      else EscreverEstado("aberto", Preencher(T("abertoFechaAs"), { hora: turno[1] }));
      return;
    }
  }

  //ainda abre hoje -> tipo sao 16:00 e o jantar so abre as 19:00;
  for (const turno of turnosHoje) {
    if (minutoAtual < Minutos(turno[0])) {
      const faltam = Minutos(turno[0]) - minutoAtual;
      //se faltar 1 hora ou menos mostra os minutos, se faltar mais mostra so a hora;
      if (faltam <= 60) EscreverEstado("fechado", Preencher(T("abreDaqui"), { tempo: TempoQueFalta(faltam) }));
      else EscreverEstado("fechado", Preencher(T("abreHoje"), { hora: turno[0] }));
      return;
    }
  }

  //hoje ja nao abre -> vai vendo os dias seguintes ate encontrar um aberto;
  for (let i = 1; i <= 7; i++) {
    const proximo = (dia + i) % 7; //o % 7 faz com que depois do sabado venha o domingo;
    const turnos = TurnosDoDia(proximo);
    if (turnos.length > 0) {
      if (i === 1) EscreverEstado("fechado", Preencher(T("abreAmanha"), { hora: turnos[0][0] }));
      else EscreverEstado("fechado", Preencher(T("abreDia"), { dia: T("diasNo")[proximo], hora: turnos[0][0] }));
      return;
    }
  }
}

//desenha a semana e as horas -> o dia de hoje fica a vermelho;
function DesenharHorario() {
  const hoje = new Date().getDay();
  const h = Site.horario;

  let html = "";
  for (const dia of OrdemSemana) {
    let classes = "";
    if (TurnosDoDia(dia).length > 0) classes += "aberto ";
    if (dia === hoje) classes += "hoje";
    html += `<li class="${classes}">${T("diasCurtos")[dia]}</li>`;
  }
  Id("semana").innerHTML = html;

  Id("turnos").innerHTML = `
    <div><small>${T("almoco")}</small><b>${h.almocoAbre} – ${h.almocoFecha}</b></div>
    <div><small>${T("jantar")}</small><b>${h.jantarAbre} – ${h.jantarFecha}</b></div>`;

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
    if (i === fechados.length - 1) lista += " " + T("e") + " " + fechados[i]; //o ultimo leva "e" e nao virgula;
    else lista += ", " + fechados[i];
  }
  Id("fechadoTexto").textContent = Preencher(T("fechados"), { dias: lista });
}

//======================================================================;
//7. INICIO;
//======================================================================;

//pizza do inicio -> pepperoni, manjericao e azeitonas porque é a que fica mais bonita;
function DesenharPizzaInicio() {
  if (Id("baseInicio").innerHTML !== "") return; //so desenha uma vez -> senao a animacao repetia sempre que se mudava a lingua;
  const pizza = PizzaSVG("inicio", "pepperoni, manjericão, azeitonas, orégãos", 260, 260);
  Id("baseInicio").innerHTML = pizza.base;
  Id("ingInicio").innerHTML = pizza.ingredientes;
}

//farinha a cair atras da pizza;
function IniciarFarinha() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; //quem tem menos movimento ligado no telemovel nao ve a farinha;
  const tela = Id("farinha");
  const ctx = tela.getContext("2d");
  let graos = [];

  //poe o canvas do tamanho do inicio -> corre no arranque e quando se roda o telemovel;
  function Medir() {
    const escala = window.devicePixelRatio || 1; //os telemoveis tem mais pixeis -> sem isto a farinha ficava desfocada;
    tela.width = tela.offsetWidth * escala;
    tela.height = tela.offsetHeight * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    graos = [];
    const quantidade = Math.round(tela.offsetWidth / 22); //ecra maior leva mais farinha;
    for (let i = 0; i < quantidade; i++) {
      graos.push({
        x: Math.random() * tela.offsetWidth,
        y: Math.random() * tela.offsetHeight,
        raio: Math.random() * 1.6 + .4,
        velocidade: Math.random() * .22 + .06,
        opacidade: Math.random() * .45 + .2
      });
    }
  }

  //cada grao desce um bocadinho -> quando sai por baixo volta para cima;
  function Passo() {
    ctx.clearRect(0, 0, tela.offsetWidth, tela.offsetHeight);
    for (const g of graos) {
      g.y += g.velocidade;
      g.x += Math.sin(g.y / 38) * .14; //o seno faz o grao ir de um lado para o outro -> assim parece farinha e nao chuva;
      if (g.y > tela.offsetHeight) {
        g.y = -4;
        g.x = Math.random() * tela.offsetWidth;
      }
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.raio, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + g.opacidade + ")";
      ctx.fill();
    }
    requestAnimationFrame(Passo);
  }

  Medir();
  addEventListener("resize", Medir);
  Passo();
}

//======================================================================;
//8. SUGESTOES;
//======================================================================;

//cartoes das sugestoes -> se houver foto mostra a foto, senao desenha a pizza;
function DesenharSugestoes() {
  let html = "";
  for (let n = 0; n < Site.sugestoes.pizzas.length; n++) {
    const sugestao = Site.sugestoes.pizzas[n];
    const prato = ProcurarPrato(sugestao.nome);
    if (!prato) continue; //se o nome nao estiver no menu.json salta este cartao;

    let imagem = "";
    if (sugestao.foto) {
      imagem = `<img src="${sugestao.foto}" alt="${sugestao.nome}" loading="lazy">`;
    } else {
      const pizza = PizzaSVG(prato.nome.pt, prato.ingredientes.pt, 260, 260, prato.foto);
      imagem = `<svg viewBox="-10 -10 540 550" aria-hidden="true">${pizza.base}${pizza.ingredientes}</svg>`;
    }

    let precos = "";
    if (TemTresPrecos(prato)) {
      const valores = [prato.pequena, prato.media, prato.familiar];
      for (let k = 0; k < 3; k++) {
        const valor = valores[k] ? Euro(valores[k]) : "—";
        precos += `<div><small>${T("tamanhos")[k]}</small><b>${valor}</b></div>`;
      }
    } else {
      precos = `<div><b>${Euro(prato.preco)}</b></div>`;
    }

    let notaCasa = "";
    if (prato.daCasa) notaCasa = `<span class="mao">${T("daCasa")}</span>`;

    html += `
      <article class="cartao" data-sugestao="${n}" tabindex="0" role="button">
        ${imagem}
        <h3>${Traduzir(prato.nome)}${notaCasa}</h3>
        <p>${Traduzir(sugestao.texto)}</p>
        <div class="cartao-precos">${precos}</div>
      </article>`;
  }
  Id("cartoes").innerHTML = html;
}

//======================================================================;
//9. MENU;
//======================================================================;

//ve se o prato é vegetariano, de carne ou de marisco -> vai pelos ingredientes em pt;
function TipoDoPrato(prato) {
  const texto = SemAcentos(prato.nome.pt + " " + prato.ingredientes.pt);
  if (/camar|atum|salm|bacalhau|delicias|mexilh|peixe/.test(texto)) return "marisco";
  if (/fiambre|bacon|chouri|salame|pepperoni|presunto|parma|frango|carne|bolonhesa|salsicha|bife|francesinha|asinhas/.test(texto)) return "carne";
  return "vegetarianas";
}

//da true se o prato tiver de aparecer com o filtro e a pesquisa que estao escolhidos;
function PratoPassa(prato) {
  if (FiltroAtual !== "todas" && TipoDoPrato(prato) !== FiltroAtual) return false;
  const procura = SemAcentos(PesquisaAtual.trim());
  if (procura === "") return true;
  const textoPrato = SemAcentos(prato.nome.pt + " " + prato.nome.en + " " + prato.ingredientes.pt + " " + prato.ingredientes.en);
  return textoPrato.includes(procura);
}

//botoes dos filtros;
function DesenharFiltros() {
  let html = "";
  for (const filtro of ["todas", "vegetarianas", "carne", "marisco"]) {
    html += `<button type="button" class="filtro" data-filtro="${filtro}" aria-pressed="${filtro === FiltroAtual}">${T(filtro)}</button>`;
  }
  Id("filtros").innerHTML = html;
}

//um separador por categoria -> enquanto se pesquisa nenhum fica marcado;
function DesenharSeparadores() {
  let html = "";
  for (const categoria of Menu.categorias) {
    const escolhido = PesquisaAtual === "" && categoria.id === CategoriaAtual;
    html += `<button type="button" role="tab" data-categoria="${categoria.id}" aria-selected="${escolhido}">${Traduzir(categoria.nome)}</button>`;
  }
  Id("separadores").innerHTML = html;
}

//bonecos de 1, 2 e 4 pessoas -> igual ao menu de papel deles;
function Pessoa(x, escala) {
  return `<g transform="translate(${x} ${24 - 24 * escala}) scale(${escala})"><circle cx="9" cy="6" r="5"/><path d="M0 24 v-6 a9 9 0 0 1 18 0 v6 z"/></g>`;
}

const Pessoas = [
  `<svg viewBox="0 0 18 24">${Pessoa(0, 1)}</svg>`,
  `<svg viewBox="0 0 32 24">${Pessoa(0, 1)}${Pessoa(17, .8)}</svg>`,
  `<svg viewBox="0 0 58 24">${Pessoa(0, 1)}${Pessoa(15, .75)}${Pessoa(28, .75)}${Pessoa(41, 1)}</svg>`
];

//cabecalho com os bonecos -> sao botoes, carregar muda o tamanho (MudarTamanho esta na parte 10);
function CabecalhoTamanhos() {
  let html = `<div class="tamanhos">`;
  for (let k = 0; k < 3; k++) {
    html += `<button type="button" data-tamanho="${k}" aria-pressed="${k === TamanhoAtual}">${Pessoas[k]}${T("tamanhos")[k]}</button>`;
  }
  return html + `</div>`;
}

//uma linha do menu -> tres precos nas pizzas e extras, um preco com pontinhos no resto;
function LinhaDoPrato(prato, categoriaId, numero) {
  let notaCasa = "";
  if (prato.daCasa) notaCasa = `<span class="mao">${T("daCasa")}</span>`;
  const nome = `<h3 class="prato-nome">${Traduzir(prato.nome)}${notaCasa}</h3>`;

  let topo = "";
  if (TemTresPrecos(prato)) {
    const valores = [prato.pequena, prato.media, prato.familiar];
    let precos = "";
    for (let k = 0; k < 3; k++) {
      if (valores[k]) precos += `<span class="preco p${k}">${Euro(valores[k])}</span>`;
      else precos += `<span class="preco p${k}"><span class="nao-ha">${T("naoHa")}</span></span>`; //tipo a Burrata que nao ha familiar;
    }
    topo = `<div class="prato-topo tres">${nome}${precos}</div>`;
  } else {
    topo = `<div class="prato-topo">${nome}<span class="pontos"></span><span class="preco">${Euro(prato.preco)}</span></div>`;
  }

  let ingredientes = "";
  if (Traduzir(prato.ingredientes)) ingredientes = `<p class="ingredientes">${Traduzir(prato.ingredientes)}</p>`;

  let classes = "prato";
  if (prato === PratoAtual) classes += " ativo";
  return `<article class="${classes}" tabindex="0" data-cat="${categoriaId}" data-i="${numero}">${topo}${ingredientes}</article>`;
}

//lista do menu -> mostra o separador escolhido, mas se houver pesquisa procura em tudo;
function DesenharMenu() {
  const aPesquisar = PesquisaAtual.trim() !== "";
  let html = "";

  for (const categoria of Menu.categorias) {
    if (!aPesquisar && categoria.id !== CategoriaAtual) continue; //sem pesquisa so interessa a categoria aberta;

    let linhas = "";
    for (let i = 0; i < categoria.itens.length; i++) {
      if (PratoPassa(categoria.itens[i])) linhas += LinhaDoPrato(categoria.itens[i], categoria.id, i);
    }
    if (linhas === "") continue;

    if (aPesquisar) html += `<h3 class="grupo">${Traduzir(categoria.nome)}</h3>`; //na pesquisa mete o nome da categoria por cima;
    if (TemTresPrecos(categoria.itens[0])) html += CabecalhoTamanhos();
    html += linhas;
  }

  if (html === "") html = `<p class="vazio">${T("nada")}</p>`;
  Id("lista").innerHTML = html;
  Id("lista").dataset.tamanho = TamanhoAtual; //o css pinta a coluna deste tamanho de vermelho;

  //nota da categoria -> tipo a dos extras;
  const categoria = Menu.categorias.find(function (c) { return c.id === CategoriaAtual; });
  Id("notaCategoria").hidden = aPesquisar || !categoria.nota;
  Id("notaCategoria").textContent = Traduzir(categoria.nota);

  //nas massas e saladas nao ha pizza para mostrar -> esconde a pizza do lado;
  const temVista = aPesquisar || TemTresPrecos(categoria.itens[0]);
  document.querySelector(".menu-grelha").classList.toggle("sem-vista", !temVista);
}

//======================================================================;
//10. PIZZA DO LADO;
//======================================================================;

//botoes Pequena, Media e Familiar;
function DesenharBotoesTamanho() {
  let html = "";
  for (let k = 0; k < 3; k++) {
    html += `<button type="button" role="radio" aria-checked="${k === TamanhoAtual}" data-tamanho="${k}">${Pessoas[k]}<span>${T("tamanhos")[k]}</span></button>`;
  }
  Id("tamanhosBotoes").innerHTML = html;
}

//desenha o prato escolhido -> o tamanho so muda a escala;
function DesenharVista(animar) {
  if (!PratoAtual) return;
  const p = PratoAtual;
  const pizza = PizzaSVG(p.nome.pt, p.ingredientes.pt, 260, 260, p.foto);
  Id("baseVista").innerHTML = pizza.base;
  Id("ingVista").innerHTML = pizza.ingredientes;
  Id("vista").classList.toggle("animar", animar); //com o animar os ingredientes voltam a cair;
  Id("vistaPizza").setAttribute("aria-label", Traduzir(p.nome));
  Id("vistaNome").textContent = Traduzir(p.nome);
  Id("vistaIng").textContent = Traduzir(p.ingredientes);

  //pequena 76%, media 88%, familiar 100% -> os pratos com um preco ficam na media;
  const escalas = [0.76, 0.88, 1];
  let escala = escalas[1];
  let preco = p.preco;
  if (TemTresPrecos(p)) {
    escala = escalas[TamanhoAtual];
    preco = [p.pequena, p.media, p.familiar][TamanhoAtual];
  }
  Id("vistaEscala").style.transform = "scale(" + escala + ")";
  Id("tamanhosBotoes").hidden = !TemTresPrecos(p);
  Id("vistaPreco").textContent = preco ? Euro(preco) : T("naoHa");
}

//muda o tamanho -> usado pelos botoes da pizza e pelos bonecos da lista;
function MudarTamanho(numero) {
  TamanhoAtual = numero;
  DesenharBotoesTamanho();
  DesenharVista(false);
  Id("lista").dataset.tamanho = TamanhoAtual; //a coluna desse tamanho fica a vermelho;
  for (const botao of document.querySelectorAll(".tamanhos button")) {
    botao.setAttribute("aria-pressed", Number(botao.dataset.tamanho) === TamanhoAtual);
  }
}

//escolhe um prato -> marca a linha e muda a pizza do lado;
function EscolherPrato(linha) {
  const categoria = Menu.categorias.find(function (c) { return c.id === linha.dataset.cat; });
  const prato = categoria.itens[linha.dataset.i];
  if (prato === PratoAtual) return; //se ja é este nao vale a pena desenhar outra vez;
  PratoAtual = prato;
  for (const p of document.querySelectorAll(".prato.ativo")) p.classList.remove("ativo");
  linha.classList.add("ativo");
  DesenharVista(true);
}

//======================================================================;
//11. COMO PEDIR E FOTOS;
//======================================================================;

//icones do como pedir -> a cor vem do css;
const Icones = {
  mesa: '<circle cx="24" cy="26" r="13"/><circle cx="24" cy="26" r="7"/><path d="M5 10 v10 a3 3 0 0 0 6 0 v-10 M8 20 v22"/><path d="M43 10 c-5 3 -5 12 0 14 v18"/>',
  saco: '<path d="M6 20 h36 v20 h-36 z"/><path d="M6 20 l6 -8 h24 l6 8"/><path d="M16 30 h16"/>',
  casa: '<path d="M6 22 L24 7 L42 22"/><path d="M11 18 v23 h26 v-23"/><path d="M20 41 v-11 h8 v11"/>'
};

//comer ca, levar para casa e entrega;
function DesenharComoPedir() {
  let html = "";
  for (const opcao of Site.pedir.opcoes) {
    const icone = Icones[opcao.icone] || Icones.mesa;
    html += `
      <div class="opcao">
        <svg viewBox="0 0 48 48" aria-hidden="true">${icone}</svg>
        <h3>${Traduzir(opcao.titulo)}</h3>
        <p>${Traduzir(opcao.texto)}</p>
      </div>`;
  }
  Id("opcoes").innerHTML = html;
}

//galeria -> so aparece se houver fotos no site.json;
function DesenharFotos() {
  const fotos = Site.fotos || [];
  Id("fotos").hidden = fotos.length === 0;
  let html = "";
  for (let i = 0; i < fotos.length; i++) {
    html += `<button type="button" class="foto" data-foto="${i}"><img src="${fotos[i].imagem}" alt="${Traduzir(fotos[i].descricao)}" loading="lazy"></button>`;
  }
  Id("fotosGrelha").innerHTML = html;
}

//abre a foto em grande;
function AbrirFoto(numero) {
  const foto = Site.fotos[numero];
  Id("fotoGrandeImg").src = foto.imagem;
  Id("fotoGrandeImg").alt = Traduzir(foto.descricao);
  Id("fotoGrande").showModal();
}

//======================================================================;
//12. EVENTOS;
//======================================================================;

//os eventos ficam nas caixas de fora -> o que esta dentro é desenhado outra vez muitas vezes e perdia os eventos;
function LigarEventos() {
  //lingua;
  Id("lingua").addEventListener("click", function () {
    MudarLingua();
    DesenharTudo();
  });

  //separadores das categorias;
  Id("separadores").addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (!botao) return;
    CategoriaAtual = botao.dataset.categoria;
    PesquisaAtual = "";
    Id("pesquisa").value = ""; //ao mudar de separador limpa a pesquisa;
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

  //pesquisa -> a lista muda a cada letra;
  Id("pesquisa").addEventListener("input", function (e) {
    PesquisaAtual = e.target.value;
    DesenharSeparadores();
    DesenharMenu();
  });

  //no computador muda ao passar o rato, no telemovel ao tocar;
  Id("lista").addEventListener("mouseover", function (e) {
    const linha = e.target.closest(".prato");
    if (!linha) return;
    if (!matchMedia("(hover: hover)").matches) return; //no telemovel nao ha rato;
    if (Date.now() < PausaRato) return;
    EscolherPrato(linha);
  });
  Id("lista").addEventListener("click", function (e) {
    //bonecos do cabecalho -> tambem mudam o tamanho;
    const boneco = e.target.closest(".tamanhos button");
    if (boneco) {
      MudarTamanho(Number(boneco.dataset.tamanho));
      return;
    }
    const linha = e.target.closest(".prato");
    if (linha) EscolherPrato(linha);
  });
  Id("lista").addEventListener("keydown", function (e) {
    const linha = e.target.closest(".prato");
    if (linha && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); //senao o espaco fazia scroll;
      EscolherPrato(linha);
    }
  });

  //botoes de tamanho da pizza do lado;
  Id("tamanhosBotoes").addEventListener("click", function (e) {
    const botao = e.target.closest("button");
    if (botao) MudarTamanho(Number(botao.dataset.tamanho));
  });

  //carregar numa sugestao leva ao menu com essa pizza ja escolhida;
  Id("cartoes").addEventListener("click", function (e) {
    const cartao = e.target.closest(".cartao");
    if (!cartao) return;
    const nome = Site.sugestoes.pizzas[cartao.dataset.sugestao].nome;
    const categoria = Menu.categorias.find(function (c) {
      return c.itens.some(function (p) { return p.nome.pt === nome; });
    });
    CategoriaAtual = categoria.id;
    PesquisaAtual = "";
    Id("pesquisa").value = "";
    PratoAtual = ProcurarPrato(nome);
    PausaRato = Date.now() + 1500;
    DesenharSeparadores();
    DesenharMenu();
    DesenharVista(true);
    Id("menu").scrollIntoView();
  });

  //fotos;
  Id("fotosGrelha").addEventListener("click", function (e) {
    const botao = e.target.closest(".foto");
    if (botao) AbrirFoto(botao.dataset.foto);
  });
  Id("fecharFoto").addEventListener("click", function () {
    Id("fotoGrande").close();
  });
  Id("fotoGrande").addEventListener("click", function (e) {
    if (e.target === Id("fotoGrande")) Id("fotoGrande").close(); //carregar fora da foto fecha;
  });
}

//======================================================================;
//13. ARRANQUE;
//======================================================================;

//desenha tudo -> no arranque e sempre que se muda a lingua;
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
}

//arranque -> le os dados e desenha a pagina;
async function Arrancar() {
  try {
    await CarregarDados();
  } catch (erro) {
    Id("lista").innerHTML = "<p>Não foi possível carregar o menu. Abra o site com o Live Server (Go Live).</p>";
    return;
  }
  LerLingua();
  PratoAtual = ProcurarPrato("MammaMia") || Menu.categorias[0].itens[0]; //comeca na pizza da casa;
  LigarEventos();
  DesenharTudo();
  IniciarFarinha();
  setInterval(MostrarEstado, 30000); //ve o horario de 30 em 30 segundos -> assim os minutos vao descendo sozinhos;
}

Arrancar();
