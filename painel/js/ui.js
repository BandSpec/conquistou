// Peças de tela reaproveitadas: criar elementos, ícones, formatação, avisos, janelas e as cores de cada filho.
// Todo texto vindo da API entra como texto (textContent), nunca como HTML.

export function h(tag, atributos, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos ?? {})) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (chave === "class") el.className = valor;
    else if (chave === "style" && typeof valor === "object") Object.assign(el.style, valor);
    else if (chave === "vars") for (const [v, c] of Object.entries(valor)) el.style.setProperty(v, c);
    else if (chave.startsWith("on")) el.addEventListener(chave.slice(2).toLowerCase(), valor);
    else if (valor === true) el.setAttribute(chave, "");
    else el.setAttribute(chave, String(valor));
  }
  anexar(el, filhos);
  return el;
}

function anexar(el, filhos) {
  for (const filho of filhos.flat(Infinity)) {
    if (filho === null || filho === undefined || filho === false) continue;
    el.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
}

export function trocar(el, ...filhos) {
  el.replaceChildren();
  anexar(el, filhos);
  return el;
}

// ---------- ícones (traços no estilo Feather, como no app) ----------
const CAMINHOS = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkQuadrado: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  editar: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  imagem: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  voltar: '<path d="m15 18-6-6 6-6"/>',
  seta: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  repetir: '<path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  celular: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  copiar: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  qr: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>',
  arquivo: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  lixeira: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  link: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  direita: '<path d="m9 18 6-6-6-6"/>',
  musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
};

export function icone(nome) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = CAMINHOS[nome] ?? ""; // texto fixo deste arquivo, nunca dado da API
  return svg;
}

export function iconeGoogle() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>';
  return svg;
}

// ---------- formatação ----------
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatarReais = (v) => reais.format(Number(v) || 0);

/** "12,50" / "12.50" / "R$ 1.234,56" → 12.5 (NaN se não for número) */
export function lerReais(texto) {
  let t = String(texto ?? "").replace(/[R$\s]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^\d*\.?\d{0,2}$/.test(t) || t === "" || t === ".") return NaN;
  return Math.round(Number(t) * 100) / 100;
}

export function dataIso(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export function dataCurta(iso) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function tempoRelativo(iso) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  const futuro = minutos < 0;
  const m = Math.abs(minutos);
  let texto;
  if (m < 1) return "agora mesmo";
  if (m < 60) texto = `${m} min`;
  else if (m < 60 * 24) texto = `${Math.round(m / 60)}h`;
  else {
    const dias = Math.round(m / 1440);
    texto = `${dias} dia${dias > 1 ? "s" : ""}`;
  }
  return futuro ? `em ${texto}` : `há ${texto}`;
}

export const primeiroNome = (nome) => String(nome ?? "").split(" ")[0];

// ---------- cores de cada filho (mobile/src/design/temaFilho.ts) ----------
const TEMAS = {
  Menino: { cor: "#2A6BFF", escura: "#1747C9", profunda: "#0E2F8F", suave: "#E4EDFF" },
  Menina: { cor: "#FF5CB8", escura: "#E0218A", profunda: "#B0126C", suave: "#FFE4F4" },
  PrefiroNaoDizer: { cor: "#7A4DF5", escura: "#5A2FD6", profunda: "#3A1C95", suave: "#EEE7FF" },
};
export const temaDoGenero = (g) => TEMAS[g] ?? TEMAS.PrefiroNaoDizer;
export const varsTema = (g) => {
  const t = temaDoGenero(g);
  return { "--cor": t.cor, "--escura": t.escura, "--profunda": t.profunda, "--suave": t.suave, "--cor-chip": t.escura };
};

// ---------- imagens: fotos do Cloudinary, avatares prontos ("preset:") e ícones de tarefa ("icone:") ----------
export const AVATAR_ETNIAS = ["negra", "branca_castanha", "branca_loira", "branca_ruiva", "asiatico"];
export const AVATARES_PAI = ["adulto", "adulto40", "adulto50", "adulto60"].flatMap((c) =>
  AVATAR_ETNIAS.flatMap((e) => [`${c}_${e}_masculino`, `${c}_${e}_feminino`])
);
const AVATARES_TODOS = new Set([
  ...AVATARES_PAI,
  ...["crianca", "adolescente"].flatMap((c) => AVATAR_ETNIAS.flatMap((e) => [`${c}_${e}_masculino`, `${c}_${e}_feminino`])),
]);

export const ICONES_TAREFA = [
  ["arrumar_a_cama", "Arrumar a cama"],
  ["fazer_a_licao_de_casa", "Fazer a lição de casa"],
  ["estudar_revisar_as_materias", "Estudar / revisar as matérias"],
  ["ler_um_livro", "Ler um livro"],
  ["orar_momento_com_deus", "Orar / momento com Deus"],
  ["lavar_a_louca", "Lavar a louça"],
  ["varrer_a_casa", "Varrer a casa"],
  ["recolher_e_tirar_o_lixo", "Recolher e tirar o lixo"],
  ["guardar_as_proprias_roupas", "Guardar as próprias roupas"],
  ["colocar_a_roupa_suja_no_cesto", "Roupa suja no cesto"],
  ["manter_o_quarto_organizado", "Quarto organizado"],
  ["arrumar_ou_retirar_a_mesa_das_refeicoes", "Arrumar / retirar a mesa"],
  ["ajudar_a_cuidar_do_pet", "Cuidar do pet"],
  ["tomar_banho", "Tomar banho"],
  ["escovar_os_dentes", "Escovar os dentes"],
  ["lavar_a_cabeca", "Lavar a cabeça"],
  ["cortar_as_unhas", "Cortar as unhas"],
];
const ICONES_IDS = new Set(ICONES_TAREFA.map(([id]) => id));

/** Só endereços https (fotos enviadas). Qualquer outra coisa vira "sem imagem". */
export function urlSegura(url) {
  return typeof url === "string" && /^https:\/\//i.test(url) ? url : null;
}

export function fonteAvatar(fotoUrl) {
  if (typeof fotoUrl === "string" && fotoUrl.startsWith("preset:")) {
    const id = fotoUrl.slice(7);
    return AVATARES_TODOS.has(id) ? `img/avatares/${id}.jpg` : null;
  }
  return urlSegura(fotoUrl);
}

export function fonteImagemTarefa(imagemUrl) {
  if (typeof imagemUrl === "string" && imagemUrl.startsWith("icone:")) {
    const id = imagemUrl.slice(6);
    return ICONES_IDS.has(id) ? { src: `img/icones-tarefa/${id}.png`, icone: true } : null;
  }
  const src = urlSegura(imagemUrl);
  return src ? { src, icone: false } : null;
}

export function avatar(nome, fotoUrl, tamanho = 48) {
  const src = fonteAvatar(fotoUrl);
  const estilo = { width: `${tamanho}px`, height: `${tamanho}px`, fontSize: `${Math.round(tamanho * 0.4)}px` };
  if (src) return h("img", { class: "avatar", src, alt: "", style: estilo, loading: "lazy" });
  return h("span", { class: "avatar", style: estilo, "aria-hidden": "true" }, (nome ?? "?").trim().charAt(0).toUpperCase() || "?");
}

export function imagemTarefa(imagemUrl, { classe = "", mostrarVazio = true } = {}) {
  const fonte = fonteImagemTarefa(imagemUrl);
  if (fonte) return h("img", { class: `imagem-tarefa ${fonte.icone ? "icone" : ""} ${classe}`, src: fonte.src, alt: "", loading: "lazy" });
  return mostrarVazio ? h("span", { class: `imagem-vazia ${classe}`, "aria-hidden": "true" }, icone("imagem")) : null;
}

export function barraProgresso(percentual) {
  const p = Math.max(0, Math.min(100, Number(percentual) || 0));
  return h("div", { class: "barra-progresso", role: "progressbar", "aria-valuenow": p, "aria-valuemin": 0, "aria-valuemax": 100 }, h("i", { style: { width: `${p}%` } }));
}

// ---------- botões, chips, segmentos ----------
export function botao(texto, aoClicar, { classe = "", iconeNome, tipo = "button", desabilitado = false, vars } = {}) {
  return h("button", { type: tipo, class: `botao ${classe}`, onclick: aoClicar, disabled: desabilitado, vars }, iconeNome ? icone(iconeNome) : null, texto);
}

/** Roda uma ação mostrando "carregando" no botão e trava cliques repetidos. */
export async function comCarregando(btn, acao) {
  if (btn.dataset.ocupado) return;
  btn.dataset.ocupado = "1";
  const antes = [...btn.childNodes];
  const estavaDesabilitado = btn.disabled;
  btn.disabled = true;
  trocar(btn, h("span", { class: "girando", "aria-hidden": "true" }), " Aguarde...");
  try {
    return await acao();
  } finally {
    if (btn.isConnected) {
      btn.replaceChildren(...antes);
      btn.disabled = estavaDesabilitado;
    }
    delete btn.dataset.ocupado;
  }
}

export function chip(texto, selecionado, aoClicar, { vars, antes } = {}) {
  return h("button", { type: "button", class: "chip", "aria-pressed": selecionado ? "true" : "false", onclick: aoClicar, vars }, antes, texto);
}

/** Grupo de opções exclusivas (como o SegmentedControl do app). */
export function segmentos(opcoes, valorInicial, aoMudar, rotulo) {
  let valor = valorInicial;
  const grupo = h("div", { class: "segmentos", role: "group", "aria-label": rotulo });
  const desenhar = () =>
    trocar(
      grupo,
      opcoes.map(([v, texto]) =>
        h("button", {
          type: "button",
          "aria-pressed": v === valor ? "true" : "false",
          onclick: () => {
            valor = v;
            desenhar();
            aoMudar(v);
          },
        }, texto)
      )
    );
  desenhar();
  return grupo;
}

export function campo(rotulo, entrada, dica) {
  return h("label", { class: "campo" }, h("span", {}, rotulo), entrada, dica ? h("small", { class: "dica" }, dica) : null);
}

export function entradaValor(valorInicial) {
  return h("input", { type: "text", inputmode: "decimal", placeholder: "0,00", autocomplete: "off", value: valorInicial ? String(valorInicial.toFixed(2)).replace(".", ",") : "" });
}

// ---------- avisos e janelas ----------
export function avisar(texto, { erro = false } = {}) {
  const caixa = document.getElementById("avisos");
  const el = h("div", { class: `aviso ${erro ? "erro-aviso" : ""}` }, texto);
  caixa.append(el);
  setTimeout(() => el.remove(), erro ? 6000 : 3500);
}

/** Janela (dialog) que se remove ao fechar. Devolve { dialogo, fechar }. */
export function abrirJanela(titulo, conteudo) {
  const dialogo = h("dialog", { "aria-label": titulo });
  const fechar = () => dialogo.close();
  dialogo.append(
    h("div", { class: "modal-dentro" },
      h("div", { class: "modal-topo" }, h("h2", {}, titulo), h("button", { type: "button", class: "botao-redondo", "aria-label": "Fechar", onclick: fechar }, icone("x"))),
      conteudo
    )
  );
  dialogo.addEventListener("close", () => dialogo.remove());
  dialogo.addEventListener("click", (e) => {
    if (e.target === dialogo) fechar(); // clique fora da caixa
  });
  document.body.append(dialogo);
  dialogo.showModal();
  return { dialogo, fechar };
}

/** Pergunta de confirmação; resolve true/false. */
export function confirmar(titulo, texto, { sim = "Confirmar", nao = "Cancelar", perigo = false } = {}) {
  return new Promise((resolver) => {
    let resposta = false;
    const { dialogo, fechar } = abrirJanela(titulo, [
      h("p", { style: { margin: 0 } }, texto),
      h("div", { class: "botoes" },
        botao(nao, () => fechar(), { classe: "secundario" }),
        botao(sim, () => {
          resposta = true;
          fechar();
        }, { classe: perigo ? "perigo" : "" })
      ),
    ]);
    dialogo.addEventListener("close", () => resolver(resposta));
  });
}

export function carregandoTela() {
  return h("div", { class: "carregando-tela", role: "status" }, h("span", { class: "girando", "aria-hidden": "true" }), " Carregando...");
}
