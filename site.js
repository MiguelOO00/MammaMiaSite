// =========================================================
// FUNCIONAMENTO DO SITE
// O conteúdo vem da pasta conteudo/: site.json (contactos, horário, textos),
// menu.json (pratos e preços) e avaliacoes.json (avaliações do Google).
// Os textos fixos estão no index.html em português e inglês; o CSS mostra só um.
// As pizzas são desenhadas no pizza.js e a neve está no neve.js.
// =========================================================


// ---------- 1. Conteúdo (é preenchido quando os ficheiros carregam) ----------

let SITE = {};        //contactos, horário e textos (conteudo/site.json);
let MENU = {};        //categorias e pratos (conteudo/menu.json);
let AVALIACOES = {};  //avaliações do Google (conteudo/avaliacoes.json);


// ---------- 2. Atalhos ----------

const $ = (id) => document.getElementById(id); //vai buscar um elemento pelo id;

function limpo(texto) { //evita que símbolos como < estraguem a página (ou que alguém meta código no JSON);
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkSeguro(link) { //só aceita https:// ou fotos da pasta imagens/ -> um "javascript:" no JSON fica "#";
  link = String(link || "");
  return link.startsWith("https://") || link.startsWith("imagens/") ? link : "#";
}

function duas(pt, en) { //escreve o texto nas duas línguas (o CSS mostra só uma);
  return `<span lang="pt">${limpo(pt)}</span><span lang="en">${limpo(en ?? pt)}</span>`;
}

function duasLinguas(texto) { //o mesmo, para os textos do JSON que vêm como { pt, en };
  if (!texto || typeof texto !== "object") return limpo(texto);
  return duas(texto.pt, texto.en || texto.pt);
}

function euro(valor) { //15.5 fica "15,50 €" e 9 fica "9 €" (sem ",00", como no menu de papel);
  const casas = Number.isInteger(valor) ? 0 : 2;
  return valor.toLocaleString("pt-PT", { minimumFractionDigits: casas, maximumFractionDigits: 2 }) + " €";
}

function semAcentos(texto) { //"Amália" fica "amalia" -> a pesquisa encontra com ou sem acentos;
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const tresPrecos = (prato) => prato.pequena !== undefined; //pizzas e extras têm pequena, média e familiar;

function procurarPrato(nome) { //procura um prato pelo nome em português, em todas as categorias;
  for (const categoria of MENU.categorias) {
    const prato = categoria.itens.find((p) => p.nome.pt === nome);
    if (prato) return { prato, categoria };
  }
  return null;
}

const categoriaDe = (id) => MENU.categorias.find((c) => c.id === id) || MENU.categorias[0];


// ---------- 3. Estado do site ----------

let lingua = "pt";        //língua escolhida;
let categoria = "pizzas"; //separador do menu aberto;
let filtro = "todas";     //todas, vegetarianas, carne ou marisco;
let pesquisa = "";        //o que está escrito na pesquisa;
let tamanho = 1;          //0 pequena, 1 média, 2 familiar -> começa na média;
let pratoAtual = null;    //o prato que está na pizza do lado;
let pausaRato = 0;        //depois de carregar numa sugestão o rato fica em cima da lista -> sem a pausa a pizza trocava logo;

try {
  lingua = localStorage.getItem("mammamia-lingua") || (navigator.language.startsWith("pt") ? "pt" : "en");
} catch (e) {}


// ---------- 4. Língua ----------

function mudarLingua(nova) {
  lingua = nova === "en" ? "en" : "pt";
  document.documentElement.lang = lingua === "pt" ? "pt-PT" : "en-GB"; //o CSS esconde a outra língua;

  //textos que não podem ter <span> (caixa de pesquisa e leitores de ecrã);
  document.querySelectorAll("[data-pt]").forEach((el) => {
    const texto = el.dataset[lingua];
    if (el.tagName === "INPUT") el.placeholder = texto;
    else el.setAttribute("aria-label", texto);
  });

  try { localStorage.setItem("mammamia-lingua", lingua); } catch (e) {}
}


// ---------- 5. Textos e contactos ----------

function escreverTextos() {
  //todos os elementos com data-texto no index.html (ex.: "inicio.titulo");
  document.querySelectorAll("[data-texto]").forEach((el) => {
    const [parte, chave] = el.dataset.texto.split(".");
    el.innerHTML = duasLinguas(SITE[parte][chave]);
  });

  const c = SITE.contactos;
  const ponto = Number(c.latitude) + "," + Number(c.longitude); //coordenadas -> com a morada o Google às vezes ia parar a outro sítio;
  const instagram = String(c.instagram).replace(/[^A-Za-z0-9._]/g, ""); //só letras, números, pontos e _;

  //o "tel:" só aceita números -> tira os espaços e tudo o resto;
  document.querySelectorAll("[data-ligar]").forEach((a) => a.href = "tel:+351" + c.telefone.replace(/\D/g, ""));
  document.querySelectorAll("[data-ligar-movel]").forEach((a) => a.href = "tel:+351" + c.telemovel.replace(/\D/g, ""));
  document.querySelectorAll("[data-fixo]").forEach((s) => s.textContent = c.telefone);
  document.querySelectorAll("[data-movel]").forEach((s) => s.textContent = c.telemovel);
  document.querySelectorAll("[data-direcoes]").forEach((a) => a.href = "https://www.google.com/maps/dir/?api=1&destination=" + ponto);
  document.querySelectorAll("[data-mapa-link]").forEach((a) => a.href = "https://www.google.com/maps/search/?api=1&query=" + ponto);
  document.querySelectorAll("[data-instagram]").forEach((a) => a.href = `https://www.instagram.com/${instagram}/`);
  $("linkFacebook").href = linkSeguro(c.facebook);

  const morada = `${limpo(c.morada)}<br>${limpo(c.cidade)}`;
  $("morada").innerHTML = morada;
  $("mapaMorada").innerHTML = morada;
  $("mapa").dataset.endereco = `https://maps.google.com/maps?q=${ponto}&z=17&hl=pt-PT&output=embed`;
}

function carregarMapa() { //o mapa só carrega quando a pessoa está a 600px de lá chegar -> o início abre mais depressa;
  const mapa = $("mapa");
  if (mapa.src || !mapa.dataset.endereco) return;
  if (mapa.getBoundingClientRect().top - window.innerHeight < 600) mapa.src = mapa.dataset.endereco;
}


// ---------- 6. Horário (aberto ou fechado, com a hora do telemóvel de quem vê) ----------

const DIAS = { //o 0 é domingo porque o JavaScript conta os dias assim;
  chaves: ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"], //iguais ao site.json;
  curtos: { pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
  no: { pt: ["no domingo", "na segunda", "na terça", "na quarta", "na quinta", "na sexta", "no sábado"], en: ["on Sunday", "on Monday", "on Tuesday", "on Wednesday", "on Thursday", "on Friday", "on Saturday"] },
  ao: { pt: ["ao domingo", "à segunda", "à terça", "à quarta", "à quinta", "à sexta", "ao sábado"], en: ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"] }
};
const SEMANA = [1, 2, 3, 4, 5, 6, 0]; //em Portugal a semana começa à segunda;

const minutos = (hora) => Number(hora.split(":")[0]) * 60 + Number(hora.split(":")[1]); //"14:30" -> 870, dá para comparar;

function turnos(dia) { //[["12:00","14:30"], ["19:00","22:30"]] ou [] se for dia de fecho;
  const h = SITE.horario;
  return h[DIAS.chaves[dia]] ? [[h.almocoAbre, h.almocoFecha], [h.jantarAbre, h.jantarFecha]] : [];
}

function tempo(falta) { //60 fica "1 hora", o resto fica "45 min";
  return falta === 60 ? ["1 hora", "1 hour"] : [`${falta} min`, `${falta} min`];
}

function escreverEstado(aberto, pt, en) { //o estado aparece no início e no cartão do mapa;
  [$("estado"), $("mapaEstado")].forEach((caixa) => {
    caixa.className = "estado " + (aberto ? "aberto" : "fechado"); //verde ou vermelho (estilos.css);
    caixa.querySelector(".estado-texto").innerHTML = duas(pt, en);
  });
}

function mostrarEstado() {
  const agora = new Date();
  const dia = agora.getDay();
  const minuto = agora.getHours() * 60 + agora.getMinutes();

  for (const [abre, fecha] of turnos(dia)) {
    //1. está aberto -> a hora está dentro deste turno;
    if (minuto >= minutos(abre) && minuto < minutos(fecha)) {
      const falta = minutos(fecha) - minuto;
      if (falta <= 60) return escreverEstado(true, `Aberto agora, fecha daqui a ${tempo(falta)[0]}`, `Open now, closes in ${tempo(falta)[1]}`);
      return escreverEstado(true, `Aberto agora, fecha às ${fecha}`, `Open now, closes at ${fecha}`);
    }
    //2. ainda abre hoje -> tipo são 16:00 e o jantar abre às 19:00;
    if (minuto < minutos(abre)) {
      const falta = minutos(abre) - minuto;
      if (falta <= 60) return escreverEstado(false, `Fechado, abre daqui a ${tempo(falta)[0]}`, `Closed, opens in ${tempo(falta)[1]}`);
      return escreverEstado(false, `Fechado, abre hoje às ${abre}`, `Closed, opens today at ${abre}`);
    }
  }

  //3. hoje já não abre -> procura o próximo dia aberto (o % 7 faz o sábado voltar ao domingo);
  for (let i = 1; i <= 7; i++) {
    const proximo = (dia + i) % 7;
    if (turnos(proximo).length === 0) continue;
    const hora = turnos(proximo)[0][0];
    if (i === 1) return escreverEstado(false, `Fechado, abre amanhã às ${hora}`, `Closed, opens tomorrow at ${hora}`);
    return escreverEstado(false, `Fechado, abre ${DIAS.no.pt[proximo]} às ${hora}`, `Closed, opens ${DIAS.no.en[proximo]} at ${hora}`);
  }
}

function juntar(lista, e) { //["à segunda", "ao domingo"] -> "à segunda e ao domingo";
  return lista.length > 1 ? lista.slice(0, -1).join(", ") + ` ${e} ` + lista[lista.length - 1] : lista.join("");
}

function desenharHorario() {
  const hoje = new Date().getDay();
  const h = SITE.horario;

  //a semana -> os dias abertos e o dia de hoje têm cores diferentes (estilos.css);
  $("semana").innerHTML = SEMANA.map((dia) => {
    const classes = (turnos(dia).length ? "aberto " : "") + (dia === hoje ? "hoje" : "");
    return `<li class="${classes}">${duas(DIAS.curtos.pt[dia], DIAS.curtos.en[dia])}</li>`;
  }).join("");

  $("turnos").innerHTML = `
    <div><small>${duas("Almoço", "Lunch")}</small><b>${limpo(h.almocoAbre)} – ${limpo(h.almocoFecha)}</b></div>
    <div><small>${duas("Jantar", "Dinner")}</small><b>${limpo(h.jantarAbre)} – ${limpo(h.jantarFecha)}</b></div>`;

  //"Estamos fechados à segunda e ao domingo.";
  const fechados = SEMANA.filter((dia) => turnos(dia).length === 0);
  $("fechadoTexto").innerHTML = fechados.length === 0 ? "" : duas(
    `Estamos fechados ${juntar(fechados.map((d) => DIAS.ao.pt[d]), "e")}.`,
    `We are closed on ${juntar(fechados.map((d) => DIAS.ao.en[d]), "and")}.`
  );
}


// ---------- 7. Pizza do início e sugestões ----------

function desenharPizzaInicio() { //pepperoni, manjericão e azeitonas -> é a que fica mais bonita;
  const pizza = PizzaSVG("inicio", "pepperoni, manjericão, azeitonas, orégãos", 260, 260);
  $("baseInicio").innerHTML = pizza.base;
  $("ingInicio").innerHTML = pizza.ingredientes;
}

const notaCasa = (prato) => prato.daCasa ? `<span class="mao">${duas("especialidade da casa", "house special")}</span>` : "";

const nomesTamanhos = [duas("Pequena", "Small"), duas("Média", "Medium"), duas("Familiar", "Family")];

function desenharSugestoes() {
  $("cartoes").innerHTML = SITE.sugestoes.pizzas.map((sugestao, n) => {
    const achado = procurarPrato(sugestao.nome);
    if (!achado) return ""; //se o nome não estiver no menu.json o cartão não aparece;
    const prato = achado.prato;

    let imagem;
    if (sugestao.foto) {
      imagem = `<img src="${limpo(linkSeguro(sugestao.foto))}" alt="${limpo(sugestao.nome)}" loading="lazy">`;
    } else {
      const pizza = PizzaSVG(prato.nome.pt, prato.ingredientes.pt, 260, 260);
      imagem = `<svg viewBox="-10 -10 540 550" aria-hidden="true">${pizza.base}${pizza.ingredientes}</svg>`;
    }

    const precos = tresPrecos(prato)
      ? [prato.pequena, prato.media, prato.familiar].map((v, k) => `<div><small>${nomesTamanhos[k]}</small><b>${v ? euro(v) : "—"}</b></div>`).join("")
      : `<div><b>${euro(prato.preco)}</b></div>`;

    return `
      <article class="cartao" data-sugestao="${n}" tabindex="0" role="button">
        ${imagem}
        <h3>${duasLinguas(prato.nome)}${notaCasa(prato)}</h3>
        <p>${duasLinguas(sugestao.texto)}</p>
        <div class="cartao-precos">${precos}</div>
      </article>`;
  }).join("");
}


// ---------- 8. Menu (separadores, filtros, pesquisa e pratos) ----------

//palavras que dizem se o prato leva peixe ou carne (sem acentos, porque o texto também é comparado sem acentos);
const PEIXE = ["camar", "atum", "salm", "bacalhau", "delicias", "mexilh", "peixe"];
const CARNE = ["fiambre", "bacon", "chouri", "salame", "pepperoni", "presunto", "parma", "frango", "carne", "bolonhesa", "salsicha", "bife", "francesinha", "asinhas"];

function tipoDoPrato(prato) { //primeiro vê se tem peixe, depois carne; se não tiver nenhum é vegetariano;
  const texto = semAcentos(prato.nome.pt + " " + prato.ingredientes.pt);
  if (PEIXE.some((p) => texto.includes(p))) return "marisco";
  if (CARNE.some((p) => texto.includes(p))) return "carne";
  return "vegetarianas";
}

function aparece(prato) { //o prato passa no filtro e na pesquisa? (procura em português e inglês);
  if (filtro !== "todas" && tipoDoPrato(prato) !== filtro) return false;
  const texto = semAcentos([prato.nome.pt, prato.nome.en, prato.ingredientes.pt, prato.ingredientes.en].join(" "));
  return texto.includes(semAcentos(pesquisa.trim()));
}

function desenharSeparadores() { //enquanto se pesquisa nenhum fica marcado, porque a pesquisa procura em todos;
  $("separadores").innerHTML = MENU.categorias.map((c) =>
    `<button type="button" role="tab" data-categoria="${limpo(c.id)}" aria-selected="${pesquisa === "" && c.id === categoria}">${duasLinguas(c.nome)}</button>`
  ).join("");
}

function cabecalhoTamanhos() { //os bonecos de 1, 2 e 4 pessoas são os mesmos dos botões da pizza do lado;
  const bonecos = [...document.querySelectorAll("#tamanhosBotoes svg")].map((svg) => svg.outerHTML);
  return `<div class="tamanhos">${bonecos.map((boneco, k) =>
    `<button type="button" data-tamanho="${k}" aria-pressed="${k === tamanho}">${boneco}${nomesTamanhos[k]}</button>`
  ).join("")}</div>`;
}

function linhaDoPrato(prato, idCategoria, i) { //três preços nas pizzas e extras, um preço com pontinhos no resto;
  const nome = `<h3 class="prato-nome">${duasLinguas(prato.nome)}${notaCasa(prato)}</h3>`;
  const topo = tresPrecos(prato)
    ? `<div class="prato-topo tres">${nome}${[prato.pequena, prato.media, prato.familiar].map((v, k) =>
        `<span class="preco p${k}">${v ? euro(v) : `<span class="nao-ha">${duas("—", "n/a")}</span>`}</span>`).join("")}</div>`
    : `<div class="prato-topo">${nome}<span class="pontos"></span><span class="preco">${euro(prato.preco)}</span></div>`;
  const ingredientes = prato.ingredientes.pt ? `<p class="ingredientes">${duasLinguas(prato.ingredientes)}</p>` : "";

  return `<article class="prato${prato === pratoAtual ? " ativo" : ""}" tabindex="0" data-cat="${limpo(idCategoria)}" data-i="${i}">${topo}${ingredientes}</article>`;
}

function desenharMenu() {
  const aPesquisar = pesquisa.trim() !== "";
  //sem pesquisa só mostra o separador aberto; com pesquisa procura em todas as categorias;
  const categorias = aPesquisar ? MENU.categorias : [categoriaDe(categoria)];

  let html = categorias.map((c) => {
    const linhas = c.itens.map((p, i) => aparece(p) ? linhaDoPrato(p, c.id, i) : "").join("");
    if (!linhas) return "";
    return (aPesquisar ? `<h3 class="grupo">${duasLinguas(c.nome)}</h3>` : "") + (tresPrecos(c.itens[0]) ? cabecalhoTamanhos() : "") + linhas;
  }).join("");

  if (!html) html = `<p class="vazio">${duas("Não encontrámos nada. Experimente outra palavra.", "Nothing found. Try another word.")}</p>`;
  $("lista").innerHTML = html;
  $("lista").dataset.tamanho = tamanho; //o css pinta de vermelho a coluna deste tamanho;

  //nota da categoria (tipo a dos extras) e pizza do lado -> nas massas e saladas não há pizza para mostrar;
  const atual = categoriaDe(categoria);
  $("notaCategoria").hidden = aPesquisar || !atual.nota;
  $("notaCategoria").innerHTML = duasLinguas(atual.nota);
  document.querySelector(".menu-grelha").classList.toggle("sem-vista", !aPesquisar && !tresPrecos(atual.itens[0]));
}


// ---------- 9. Pizza do lado ----------

function desenharVista(animar) { //o tamanho só muda a escala: pequena 76%, média 88%, familiar 100%;
  const p = pratoAtual;
  const foto = p.foto && linkSeguro(p.foto) !== "#" ? limpo(p.foto) : "";
  const pizza = PizzaSVG(p.nome.pt, p.ingredientes.pt, 260, 260, foto);
  $("baseVista").innerHTML = pizza.base;
  $("ingVista").innerHTML = pizza.ingredientes;
  $("vista").classList.toggle("animar", animar); //com o "animar" os ingredientes voltam a cair;

  $("vistaPizza").setAttribute("aria-label", p.nome.pt);
  $("vistaNome").innerHTML = duasLinguas(p.nome);
  $("vistaIng").innerHTML = duasLinguas(p.ingredientes);

  const tem3 = tresPrecos(p);
  const preco = tem3 ? [p.pequena, p.media, p.familiar][tamanho] : p.preco;
  $("vistaEscala").style.transform = `scale(${tem3 ? [0.76, 0.88, 1][tamanho] : 0.88})`;
  $("tamanhosBotoes").hidden = !tem3; //na burrata e no ovo não há tamanhos;
  $("vistaPreco").innerHTML = preco ? euro(preco) : duas("—", "n/a");
}

function mudarTamanho(numero) { //chamado pelos botões da pizza e pelos bonecos da lista;
  tamanho = numero;
  $("lista").dataset.tamanho = tamanho;
  document.querySelectorAll("#tamanhosBotoes button").forEach((b) => b.setAttribute("aria-checked", Number(b.dataset.tamanho) === tamanho));
  document.querySelectorAll(".tamanhos button").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.tamanho) === tamanho));
  desenharVista(false);
}

function escolherPrato(linha) { //marca a linha e muda a pizza do lado;
  const prato = categoriaDe(linha.dataset.cat).itens[Number(linha.dataset.i)];
  if (prato === pratoAtual) return;
  pratoAtual = prato;
  document.querySelectorAll(".prato.ativo").forEach((l) => l.classList.remove("ativo"));
  linha.classList.add("ativo");
  desenharVista(true);
}


// ---------- 10. Como pedir, avaliações e fotos ----------

const ICONES = { //desenhados a linha, a cor vem do css;
  mesa: '<circle cx="24" cy="26" r="13"/><circle cx="24" cy="26" r="7"/><path d="M5 10 v10 a3 3 0 0 0 6 0 v-10 M8 20 v22"/><path d="M43 10 c-5 3 -5 12 0 14 v18"/>',
  saco: '<path d="M6 20 h36 v20 h-36 z"/><path d="M6 20 l6 -8 h24 l6 8"/><path d="M16 30 h16"/>',
  casa: '<path d="M6 22 L24 7 L42 22"/><path d="M11 18 v23 h26 v-23"/><path d="M20 41 v-11 h8 v11"/>'
};

function desenharComoPedir() {
  $("opcoes").innerHTML = SITE.pedir.opcoes.map((o) => `
    <div class="opcao">
      <svg viewBox="0 0 48 48" aria-hidden="true">${ICONES[o.icone] || ICONES.mesa}</svg>
      <h3>${duasLinguas(o.titulo)}</h3>
      <p>${duasLinguas(o.texto)}</p>
    </div>`).join("");
}

function haQuanto(data) { //"2026-10-20" -> "há 4 semanas"; é calculado na hora, por isso nunca fica desatualizado;
  const dias = Math.floor((new Date() - new Date(data)) / 86400000);
  const passos = [ //[até quantos dias, texto pt, texto en, dividir por];
    [1, "hoje", "today", 1], [2, "ontem", "yesterday", 1], [7, "há {n} dias", "{n} days ago", 1],
    [14, "há 1 semana", "1 week ago", 7], [30, "há {n} semanas", "{n} weeks ago", 7], [60, "há 1 mês", "1 month ago", 30],
    [365, "há {n} meses", "{n} months ago", 30], [730, "há 1 ano", "1 year ago", 365], [Infinity, "há {n} anos", "{n} years ago", 365]
  ];
  const [, pt, en, dividir] = passos.find(([ate]) => dias < ate);
  const n = Math.floor(dias / dividir);
  return duas(pt.replace("{n}", n), en.replace("{n}", n));
}

function desenharAvaliacoes() {
  const a = AVALIACOES;
  if (!a.lista || a.lista.length === 0) {
    $("avaliacoes").hidden = true; //sem avaliações a parte não aparece;
    return;
  }

  $("avaliacoesNota").innerHTML = duas(
    `${String(a.nota).replace(".", ",")} ★ em ${a.total} avaliações no Google`,
    `${a.nota} ★ from ${a.total} Google reviews`
  );
  const link = limpo(linkSeguro(a.link));
  $("avaliacoesLink").href = linkSeguro(a.link);

  const cartoes = a.lista.map((r) => {
    const estrelas = Math.max(0, Math.min(5, Number(r.estrelas))); //sempre entre 0 e 5;
    const autor = r.nome ? `<b>${limpo(r.nome)}</b> · ` : ""; //sem nome mostra só a data -> não se inventa nome nenhum;
    return `
      <a class="avaliacao" href="${link}" target="_blank" rel="noopener noreferrer">
        <span class="estrelas" aria-label="${estrelas} de 5">${"★".repeat(estrelas)}<span class="vazia">${"★".repeat(5 - estrelas)}</span></span>
        <p class="avaliacao-texto">${limpo(r.texto)}</p>
        <p class="avaliacao-autor">${autor}${haQuanto(r.data)}</p>
      </a>`;
  }).join("");

  //os cartões vão duas vezes seguidas -> quando a primeira volta acaba a segunda já está no sítio e parece que nunca acaba;
  $("faixa").innerHTML = cartoes + `<div class="faixa-copia" aria-hidden="true">${cartoes}</div>`;
  $("faixa").style.setProperty("--tempo", a.lista.length * 7 + "s"); //7 segundos por cartão;
}

function desenharFotos() { //a galeria só aparece se houver fotos no site.json;
  const fotos = SITE.fotos || [];
  $("fotos").hidden = fotos.length === 0;
  $("fotosGrelha").innerHTML = fotos.map((f, i) =>
    `<button type="button" class="foto" data-foto="${i}"><img src="${limpo(linkSeguro(f.imagem))}" alt="${limpo(f.descricao?.pt)}" loading="lazy"></button>`
  ).join("");
}


// ---------- 11. Cliques e teclas ----------

document.addEventListener("click", (e) => {
  const botaoLingua = e.target.closest("#lingua");
  const separador = e.target.closest("#separadores button");
  const botaoFiltro = e.target.closest("[data-filtro]");
  const botaoTamanho = e.target.closest("button[data-tamanho]"); //só botões -> a #lista também tem data-tamanho e apanhava os toques nos pratos;
  const linha = e.target.closest(".prato");
  const cartao = e.target.closest(".cartao");
  const foto = e.target.closest(".foto");

  if (botaoLingua) mudarLingua(lingua === "pt" ? "en" : "pt");

  if (separador) { //mudar de separador limpa a pesquisa;
    categoria = separador.dataset.categoria;
    pesquisa = $("pesquisa").value = "";
    desenharSeparadores();
    desenharMenu();
  }

  if (botaoFiltro) {
    filtro = botaoFiltro.dataset.filtro;
    document.querySelectorAll("[data-filtro]").forEach((b) => b.setAttribute("aria-pressed", b === botaoFiltro));
    desenharMenu();
  }

  if (botaoTamanho) mudarTamanho(Number(botaoTamanho.dataset.tamanho));
  else if (linha) escolherPrato(linha);

  if (cartao) { //sugestão -> vai ao menu com essa pizza já escolhida;
    const achado = procurarPrato(SITE.sugestoes.pizzas[Number(cartao.dataset.sugestao)].nome);
    categoria = achado.categoria.id;
    pratoAtual = achado.prato;
    pesquisa = $("pesquisa").value = "";
    pausaRato = Date.now() + 1500; //1,5 segundos sem a pizza mudar com o rato;
    desenharSeparadores();
    desenharMenu();
    desenharVista(true);
    $("menu").scrollIntoView();
  }

  if (foto) { //abre a foto em grande;
    const f = SITE.fotos[Number(foto.dataset.foto)];
    $("fotoGrandeImg").src = linkSeguro(f.imagem);
    $("fotoGrandeImg").alt = f.descricao?.pt || "";
    $("fotoGrande").showModal();
  }
  if (e.target.closest("#fecharFoto") || e.target === $("fotoGrande")) $("fotoGrande").close(); //no X ou fora da foto;
});

//pesquisa -> a lista muda a cada letra;
$("pesquisa").addEventListener("input", () => {
  pesquisa = $("pesquisa").value;
  desenharSeparadores();
  desenharMenu();
});

//no computador a pizza muda ao passar o rato por cima de um prato (no telemóvel é ao tocar);
$("lista").addEventListener("mouseover", (e) => {
  const linha = e.target.closest(".prato");
  if (linha && matchMedia("(hover: hover)").matches && Date.now() > pausaRato) escolherPrato(linha);
});

//Enter ou espaço num prato também o escolhe;
$("lista").addEventListener("keydown", (e) => {
  const linha = e.target.closest(".prato");
  if (linha && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault(); //senão o espaço fazia scroll;
    escolherPrato(linha);
  }
});

window.addEventListener("scroll", carregarMapa);


// ---------- 12. Arranque ----------

async function carregarConteudo() { //lê os 3 ficheiros da pasta conteudo/;
  const ler = (nome) => fetch(`conteudo/${nome}.json`, { cache: "no-cache" }).then((r) => r.json());
  [SITE, MENU, AVALIACOES] = await Promise.all(["site", "menu", "avaliacoes"].map(ler));
}

async function iniciar() {
  try {
    await carregarConteudo();
  } catch (e) {
    document.body.classList.remove("a-carregar");
    $("lista").textContent = "Não foi possível carregar o menu. Abre o site com o Live Server (botão Go Live).";
    return;
  }

  pratoAtual = procurarPrato("MammaMia")?.prato || MENU.categorias[0].itens[0]; //a pizza do lado começa na pizza da casa;

  mudarLingua(lingua);
  escreverTextos();
  mostrarEstado();
  desenharHorario();
  desenharPizzaInicio();
  desenharSugestoes();
  desenharComoPedir();
  desenharSeparadores();
  desenharMenu();
  desenharVista(false);
  desenharAvaliacoes();
  desenharFotos();
  carregarMapa();

  document.body.classList.remove("a-carregar"); //já está tudo desenhado -> a página aparece de uma vez, sem textos a saltar;
  setInterval(mostrarEstado, 30000); //vê o horário de 30 em 30 segundos -> os minutos vão descendo sozinhos;
}

iniciar();
