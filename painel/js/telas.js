// As telas do responsável, uma função por tela (mesmas regras do app: mobile/src/screens/responsavel e shared).
// Cada função recebe o <main> e os parâmetros da rota e desenha a tela nele.

import { api, auth, enviarFoto, mensagemDeErro, sessaoAtual, limparSessao } from "./api.js";
import {
  h, trocar, icone, formatarReais, lerReais, dataIso, dataCurta, tempoRelativo, primeiroNome,
  temaDoGenero, varsTema, avatar, imagemTarefa, barraProgresso, botao, comCarregando, chip, segmentos,
  campo, entradaValor, avisar, abrirJanela, confirmar, carregandoTela, ICONES_TAREFA, AVATARES_PAI, urlSegura,
} from "./ui.js";
import { criarQr } from "./qrcode.js";
import { ir } from "./rotas.js";

// ---------- pedaços comuns ----------
function cabecalho(titulo, subtitulo, { voltar, direita } = {}) {
  return h("div", { class: "cabecalho-pagina" },
    voltar ? h("a", { class: "botao-redondo", href: voltar, "aria-label": "Voltar" }, icone("voltar")) : null,
    h("div", {}, h("h1", { class: "titulo" }, titulo), subtitulo ? h("p", { class: "subtitulo" }, subtitulo) : null),
    direita
  );
}

function cartaoVazio(texto) {
  return h("div", { class: "cartao" }, h("p", { class: "vazio" }, texto));
}

function falha(main, erro, tentarDeNovo) {
  trocar(main, h("div", { class: "cartao estreito" },
    h("p", { class: "erro" }, mensagemDeErro(erro)),
    h("div", { class: "botoes" }, botao("Tentar de novo", tentarDeNovo))
  ));
}

/** Busca os dados mostrando "Carregando"; se falhar, mostra o erro com "Tentar de novo". */
async function carregar(main, buscar, desenhar) {
  trocar(main, carregandoTela());
  try {
    const dados = await buscar();
    desenhar(dados);
    window.dispatchEvent(new Event("conquistou:atualizou")); // a barra de cima reconfere o número de pendentes
  } catch (e) {
    if (e?.status === 401) return; // a sessão expirou: o app já voltou para "Entrar"
    falha(main, e, () => carregar(main, buscar, desenhar));
  }
}

/** Botão que enviou o formulário (Enter no campo também conta). */
const enviador = (ev) => ev.submitter ?? ev.target.querySelector("[type=submit]");

const erroForm = () => h("p", { class: "erro", role: "alert", hidden: true });
function mostrarErro(el, texto) {
  el.textContent = texto ?? "";
  el.hidden = !texto;
}

const aviso = (texto) =>
  h("div", { class: "aviso-app" }, icone("celular"), h("span", {}, texto));

// ======================================================================
// PAINEL
// ======================================================================
export function telaPainel(main) {
  carregar(main, () => Promise.all([api.resumoPainel(), api.filhos()]), ([resumo, filhos]) => {
    const nome = primeiroNome(sessaoAtual()?.nome);
    trocar(main,
      h("div", { class: "saudacao" },
        h("div", { style: { flex: 1 } }, h("p", { class: "subtitulo", style: { margin: 0 } }, "Central da família"), h("h1", { class: "titulo" }, `Olá, ${nome}`))
      ),
      h("div", { class: "resumos" },
        h("a", { class: "resumo destaque", href: "#/aprovacoes" },
          h("span", { class: "rotulo" }, "PENDENTES"),
          h("span", { class: "numero" }, String(resumo.totalPendentes ?? 0)),
          h("span", { class: "dica-resumo" }, "aguardando aprovação")),
        h("div", { class: "resumo branco" },
          h("span", { class: "rotulo" }, "LIBERADO NO MÊS"),
          h("span", { class: "numero" }, formatarReais(resumo.liberadoNoMes)),
          h("span", { class: "dica-resumo" }, "em tarefas aprovadas"))
      ),
      h("div", { class: "secao" }, h("span", {}, "Seus filhos"), h("a", { class: "botao pequeno", href: "#/filhos/novo" }, icone("mais"), "Cadastrar filho")),
      filhos.length === 0
        ? cartaoVazio("Nenhum filho cadastrado ainda. Use \"Cadastrar filho\" para começar.")
        : h("div", { class: "grade" }, filhos.map(cartaoFilho)),
      aviso("Para configurar o celular de um filho ou ver o app como ele vê, use o app Conquistou no celular. O resto dá para fazer por aqui.")
    );
  });
}

function cartaoFilho(filho) {
  const pend = filho.tarefasPendentes ?? 0;
  return h("div", { class: `cartao cartao-filho ${pend > 0 ? "com-pendente" : ""} ${filho.ativo ? "" : "inativo"}`, vars: varsTema(filho.genero) },
    h("div", { class: "moldura" }, avatar(filho.nome, filho.fotoUrl, 56)),
    h("div", { class: "info-filho" },
      h("div", { class: "linha" }, h("span", { class: "nome-filho espaco" }, filho.nome), h("span", { class: "saldo" }, formatarReais(filho.saldoAtual))),
      filho.metaAtual
        ? h("div", { class: "linha-meta" },
            imagemTarefa(filho.metaAtual.imagemUrl),
            h("div", { style: { flex: 1, minWidth: 0, display: "grid", gap: "3px" } }, h("span", { class: "titulo-meta" }, filho.metaAtual.titulo), barraProgresso(filho.metaAtual.percentual)),
            h("strong", { style: { color: "var(--escura)", fontSize: "0.85rem" } }, `${filho.metaAtual.percentual}%`))
        : null,
      h("div", { class: "linha" },
        h("span", { class: `pilula ${pend > 0 ? "perigo" : ""}` }, filho.ativo ? (pend > 0 ? `${pend} pendente${pend > 1 ? "s" : ""}` : "Em dia") : "Desativado"),
        h("span", { class: "espaco" }),
        h("a", { class: "icone-acao", href: `#/tarefas?filho=${filho.usuarioId}`, title: "Tarefas", "aria-label": `Tarefas de ${filho.nome}` }, icone("lista")),
        h("a", { class: "icone-acao", href: `#/metas/${filho.usuarioId}`, title: "Metas", "aria-label": `Metas de ${filho.nome}` }, icone("alvo")),
        h("a", { class: "icone-acao", href: `#/filhos/${filho.usuarioId}`, title: "Editar", "aria-label": `Editar ${filho.nome}` }, icone("editar"))
      )
    )
  );
}

// ======================================================================
// APROVAÇÕES (+ mesadas para pagar)
// ======================================================================
const FILTROS = [
  ["EnviadaParaAprovacao", "Aguardando"],
  ["Aprovada", "Aprovadas"],
  ["Recusada", "Recusadas"],
  ["NaoCumprida", "Vencidas"],
  ["Pendente", "Pendentes"],
];
const VAZIOS = {
  EnviadaParaAprovacao: "Nenhuma tarefa aguardando aprovação agora.",
  Aprovada: "Nenhuma tarefa aprovada nesse período.",
  Recusada: "Nenhuma tarefa recusada nesse período.",
  NaoCumprida: "Nenhum prazo vencido. Tudo em dia.",
  Pendente: "Nenhuma tarefa pendente de envio agora.",
};
const PERIODOS = [["hoje", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"], ["tudo", "Tudo"]];
const estadoAprovacoes = { status: "EnviadaParaAprovacao", filhoId: null, periodo: "7d" };

function intervalo(periodo) {
  if (periodo === "tudo") return {};
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - (periodo === "hoje" ? 0 : periodo === "7d" ? 6 : 29));
  return { de: dataIso(inicio), ate: dataIso(hoje) };
}

function statusVisual(status) {
  switch (status) {
    case "Aprovada": return ["Aprovada", "sucesso"];
    case "Recusada": return ["Recusada", "perigo"];
    case "NaoCumprida": return ["Não cumprida · prazo vencido", "perigo"];
    case "Pendente": return ["Aguardando o filho", "aviso"];
    default: return ["Aguardando aprovação", "neutro"];
  }
}

const TIPO_MIDIA = { 1: "Foto", 2: "Audio", 4: "Video" };

export function telaAprovacoes(main) {
  const e = estadoAprovacoes;
  carregar(main,
    () => Promise.all([api.filhos(), api.ocorrencias({ status: e.status, filhoId: e.filhoId, ...intervalo(e.periodo) }), api.saques("Pendente")]),
    ([filhos, ocorrencias, saques]) => {
      const mudar = (campo, valor) => {
        e[campo] = valor;
        telaAprovacoes(main);
      };
      const generoPorFilho = new Map(filhos.map((f) => [f.usuarioId, f.genero]));
      const fotoPorFilho = new Map(filhos.map((f) => [f.usuarioId, f.fotoUrl]));
      trocar(main,
        cabecalho("Aprovações", `${ocorrencias.length} · ${FILTROS.find(([v]) => v === e.status)[1].toLowerCase()}`),
        h("div", { class: "chips", role: "group", "aria-label": "Situação" }, FILTROS.map(([v, r]) => chip(r, v === e.status, () => mudar("status", v)))),
        filhos.length > 1
          ? h("div", { class: "chips", role: "group", "aria-label": "Filho" },
              chip("Todos", e.filhoId === null, () => mudar("filhoId", null), { antes: icone("usuarios"), vars: { "--cor-chip": "var(--ink)" } }),
              filhos.map((f) => chip(primeiroNome(f.nome), e.filhoId === f.usuarioId, () => mudar("filhoId", e.filhoId === f.usuarioId ? null : f.usuarioId), { vars: varsTema(f.genero), antes: avatar(f.nome, f.fotoUrl, 22) })))
          : null,
        h("div", { class: "chips", role: "group", "aria-label": "Período" },
          PERIODOS.map(([v, r]) => chip(r, v === e.periodo, () => mudar("periodo", v), { antes: v === "hoje" ? icone("calendario") : null }))),
        saques.length
          ? h("div", {}, h("div", { class: "secao" }, "Mesadas para pagar"),
              h("div", { class: "grade" }, saques.map((s) => cartaoSaque(s, generoPorFilho.get(s.filhoId), fotoPorFilho.get(s.filhoId), () => telaAprovacoes(main)))),
              h("div", { class: "secao" }, "Tarefas"))
          : null,
        ocorrencias.length === 0
          ? cartaoVazio(VAZIOS[e.status])
          : h("div", { class: "grade" }, ocorrencias.map((o) => cartaoOcorrencia(o, generoPorFilho.get(o.filhoId), () => telaAprovacoes(main))))
      );
    });
}

function cartaoOcorrencia(o, genero, recarregar) {
  const aguardando = o.status === "EnviadaParaAprovacao";
  const [texto, tom] = statusVisual(o.status);
  const quando = o.status === "NaoCumprida" ? `prazo venceu ${dataCurta(o.prazoFinal)}` : o.enviadoEm ? `enviada ${tempoRelativo(o.enviadoEm)}` : `prazo ${tempoRelativo(o.prazoFinal)}`;
  return h("div", { class: "cartao", vars: varsTema(genero) },
    h("div", { class: "item" },
      o.tarefaImagemUrl ? imagemTarefa(o.tarefaImagemUrl) : avatar(o.filhoNome, null, 40),
      h("div", { class: "texto" }, h("div", { class: "titulo-item" }, o.tarefaTitulo), h("div", { class: "meta" }, `${o.filhoNome} · ${quando}`)),
      h("span", { class: "valor-positivo" }, `+ ${formatarReais(o.valor)}`)
    ),
    o.comentarioFilho ? h("p", { class: "dica" }, `"${o.comentarioFilho}"`) : null,
    aguardando
      ? [
          o.midiaUrl ? botao(o.tarefaImagemUrl ? "Ver antes e depois" : "Ver comprovante", () => verComprovante(o, recarregar), { classe: "secundario largo", iconeNome: "imagem", vars: { "--cor": "var(--indigo)" } }) : null,
          h("div", { class: "botoes" }, ...botoesAprovar(o, recarregar)),
        ]
      : h("div", { class: "linha", style: { marginTop: "12px" } },
          h("span", { class: `pilula ${tom}` }, texto),
          h("span", { class: "espaco" }),
          o.midiaUrl ? botao("Ver comprovante", () => verComprovante(o, recarregar), { classe: "texto pequeno" }) : null)
  );
}

function botoesAprovar(o, aoTerminar, fecharJanela) {
  return [
    botao("Aprovar", (ev) => comCarregando(ev.currentTarget, async () => {
      try {
        await api.aprovar(o.id);
        avisar(`Aprovada: ${o.tarefaTitulo} (+ ${formatarReais(o.valor)} para ${primeiroNome(o.filhoNome)}).`);
        fecharJanela?.();
        aoTerminar();
      } catch (e) {
        avisar(mensagemDeErro(e), { erro: true });
      }
    }), { classe: "secundario", iconeNome: "check", vars: { "--cor": "var(--success)" } }),
    botao("Recusar", () => {
      fecharJanela?.();
      pedirMotivoRecusa(o, aoTerminar);
    }, { classe: "secundario", iconeNome: "x", vars: { "--cor": "var(--danger)" } }),
  ];
}

function midia(url, tipoNumero) {
  const src = urlSegura(url);
  if (!src) return h("div", { class: "midia" }, icone("imagem"));
  const tipo = TIPO_MIDIA[tipoNumero] ?? "Foto";
  if (tipo === "Video") return h("div", { class: "midia" }, h("video", { src, controls: true, playsinline: true, preload: "metadata" }));
  if (tipo === "Audio") return h("div", { class: "midia" }, h("audio", { src, controls: true, preload: "metadata" }));
  return h("div", { class: "midia" }, h("img", { src, alt: "Comprovante enviado" }));
}

function verComprovante(o, recarregar) {
  let fechar = () => {};
  const conteudo = [
    h("p", { class: "dica", style: { margin: 0 } }, `${o.filhoNome}${o.enviadoEm ? ` · ${tempoRelativo(o.enviadoEm)}` : ""}`),
    o.tarefaImagemUrl ? [h("span", { class: "rotulo-antes" }, "ANTES"), imagemTarefa(o.tarefaImagemUrl, { classe: "antes" }), h("span", { class: "rotulo-antes" }, "DEPOIS")] : null,
    midia(o.midiaUrl, o.tipoMidia),
    o.comentarioFilho ? h("p", { style: { margin: 0 } }, `"${o.comentarioFilho}"`) : null,
  ];
  const rodape = h("div", { class: "botoes" });
  const janela = abrirJanela(o.tarefaTitulo, [conteudo, rodape]);
  fechar = janela.fechar;
  if (o.status === "EnviadaParaAprovacao") rodape.append(...botoesAprovar(o, recarregar, fechar));
  else {
    const [texto, tom] = statusVisual(o.status);
    rodape.append(h("span", { class: `pilula ${tom}` }, texto));
  }
}

function pedirMotivoRecusa(o, aoTerminar) {
  const motivo = h("textarea", { placeholder: "ex: A cama ainda ficou desarrumada", maxlength: 500 });
  const erro = erroForm();
  const confirmarBtn = botao("Confirmar recusa", (ev) => comCarregando(ev.currentTarget, async () => {
    try {
      await api.recusar(o.id, motivo.value.trim() || "Não atendeu ao que foi pedido.");
      janela.fechar();
      avisar("Tarefa recusada. O filho recebe o motivo.");
      aoTerminar();
    } catch (e) {
      mostrarErro(erro, mensagemDeErro(e));
    }
  }), { classe: "perigo largo" });
  const janela = abrirJanela("Por que recusar?", [h("p", { class: "dica", style: { margin: 0 } }, o.tarefaTitulo), campo("Motivo (o filho vê)", motivo), erro, confirmarBtn]);
  motivo.focus();
}

// ---------- PIX ----------
const ROTULO_CHAVE = { Cpf: "CPF", Celular: "Celular", Email: "E-mail", Aleatoria: "Aleatória" };
const EXEMPLO_CHAVE = { Cpf: "000.000.000-00", Celular: "(11) 98765-4321", Email: "nome@email.com", Aleatoria: "Cole aqui a chave aleatória" };

function formatarChavePix(tipo, chave) {
  if (!tipo || !chave) return "";
  if (tipo === "Cpf" && /^\d{11}$/.test(chave)) return `${chave.slice(0, 3)}.${chave.slice(3, 6)}.${chave.slice(6, 9)}-${chave.slice(9)}`;
  const cel = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(chave);
  if (tipo === "Celular" && cel) return `(${cel[1]}) ${cel[2]}-${cel[3]}`;
  return chave;
}

function qrCodePix(codigo) {
  const qr = criarQr(codigo, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  let caminho = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(y, x)) caminho += `M${x} ${y}h1v1h-1z`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `-2 -2 ${n + 4} ${n + 4}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "QR Code do PIX");
  svg.setAttribute("shape-rendering", "crispEdges");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", caminho);
  path.setAttribute("fill", "#111633");
  svg.append(path);
  const copiar = botao("Copiar código PIX (copia e cola)", async (ev) => {
    const btn = ev.currentTarget;
    try {
      await navigator.clipboard.writeText(codigo);
      trocar(btn, icone("check"), "Código copiado!");
      setTimeout(() => btn.isConnected && trocar(btn, icone("copiar"), "Copiar código PIX (copia e cola)"), 2500);
    } catch {
      avisar("Não deu para copiar. Selecione o código abaixo e copie.", { erro: true });
    }
  }, { classe: "secundario pequeno", iconeNome: "copiar" });
  return h("div", { class: "qr" }, svg, copiar, h("small", { class: "dica", style: { wordBreak: "break-all", textAlign: "center" } }, codigo));
}

function cartaoSaque(s, genero, fotoUrl, recarregar) {
  const nome = primeiroNome(s.nomeFilho);
  const areaQr = h("div");
  let qrAberto = false;
  const alternarQr = botao("Ver QR Code / copia e cola", () => {
    qrAberto = !qrAberto;
    trocar(areaQr, qrAberto ? qrCodePix(s.codigoPix) : null);
    trocar(alternarQr, icone("qr"), qrAberto ? "Esconder QR Code" : "Ver QR Code / copia e cola");
  }, { classe: "texto pequeno", iconeNome: "qr", vars: { "--cor": "var(--escura)" } });

  const executar = async (btn, acao, sucesso) =>
    comCarregando(btn, async () => {
      try {
        await acao();
        avisar(sucesso);
        recarregar();
      } catch (e) {
        avisar(mensagemDeErro(e), { erro: true });
      }
    });

  return h("div", { class: "cartao", vars: varsTema(genero) },
    h("div", { class: "item" }, avatar(s.nomeFilho, fotoUrl, 40),
      h("div", { class: "texto" }, h("div", { class: "titulo-item" }, `${nome} pediu ${formatarReais(s.valor)}`), h("div", { class: "meta" }, tempoRelativo(s.solicitadoEm)))),
    s.chavePix ? h("p", { class: "dica" }, `Chave ${ROTULO_CHAVE[s.tipoChavePix] ?? "PIX"}: `, h("strong", {}, formatarChavePix(s.tipoChavePix, s.chavePix))) : h("p", { class: "dica" }, "Sem chave PIX cadastrada."),
    s.codigoPix ? [alternarQr, areaQr] : null,
    h("div", { class: "botoes" },
      botao("Cancelar", async (ev) => {
        const btn = ev.currentTarget;
        if (await confirmar("Cancelar o pedido?", `${nome} recebe um aviso e o dinheiro continua no saldo.`, { sim: "Cancelar pedido", nao: "Voltar", perigo: true }))
          executar(btn, () => api.cancelarSaque(s.id), "Pedido cancelado.");
      }, { classe: "secundario", vars: { "--cor": "var(--danger)" } }),
      botao("Já paguei", async (ev) => {
        const btn = ev.currentTarget;
        if (await confirmar("Já fez o PIX?", `Confirme só depois de pagar ${formatarReais(s.valor)} pelo app do banco. O valor sai do saldo de ${nome}.`, { sim: "Já paguei", nao: "Ainda não" }))
          executar(btn, () => api.confirmarPagamento(s.id), "Pagamento confirmado.");
      }, { classe: "sucesso" })
    )
  );
}

// ======================================================================
// TAREFAS
// ======================================================================
const DIAS = [[1, "Dom"], [2, "Seg"], [4, "Ter"], [8, "Qua"], [16, "Qui"], [32, "Sex"], [64, "Sáb"]];
const COMPROVACOES = [[1, "Foto"], [2, "Áudio"], [4, "Vídeo"]];

function descreverFrequencia(frequencia, dias) {
  if (frequencia === "Diaria") return "Todo dia";
  if (frequencia === "Unica") return "Uma vez só";
  const nomes = DIAS.filter(([v]) => dias & v).map(([, r]) => r.toLowerCase());
  return nomes.length ? nomes.join(", ") : "Nenhum dia selecionado";
}

export function telaTarefas(main, _p, busca) {
  carregar(main, api.filhos, async (todos) => {
    const filhos = todos.filter((f) => f.ativo);
    if (filhos.length === 0) {
      trocar(main, cabecalho("Tarefas", "O que rende mesada para os filhos."), cartaoVazio("Cadastre um filho no Painel para começar a criar tarefas."));
      return;
    }
    const filhoId = filhos.some((f) => f.usuarioId === busca.get("filho")) ? busca.get("filho") : filhos[0].usuarioId;
    const filho = filhos.find((f) => f.usuarioId === filhoId);
    const lista = h("div", {}, carregandoTela());
    trocar(main,
      cabecalho("Tarefas", "O que rende mesada para os filhos.", { direita: h("a", { class: "botao", href: `#/tarefas/nova/${filhoId}` }, icone("mais"), "Nova tarefa") }),
      h("div", { class: "chips", role: "group", "aria-label": "Filho" },
        filhos.map((f) => chip(f.nome, f.usuarioId === filhoId, () => ir(`/tarefas?filho=${f.usuarioId}`, { substituir: true }), { vars: varsTema(f.genero), antes: avatar(f.nome, f.fotoUrl, 22) }))),
      lista
    );
    try {
      const tarefas = await api.tarefas(filhoId);
      trocar(lista, tarefas.length === 0
        ? cartaoVazio(`Nenhuma tarefa cadastrada para ${filho.nome} ainda.`)
        : h("div", { class: "grade" }, tarefas.map((t) =>
            h("a", { class: `cartao item ${t.ativo ? "" : "inativo"}`, href: `#/tarefas/${filhoId}/${t.id}` },
              imagemTarefa(t.imagemUrl),
              h("div", { class: "texto" }, h("div", { class: "titulo-item" }, t.titulo), h("div", { class: "meta" }, descreverFrequencia(t.frequencia, t.diasDaSemana), t.ativo ? "" : " · Pausada")),
              h("span", { class: "valor-positivo" }, formatarReais(t.valorPadrao))))));
    } catch (e) {
      trocar(lista, h("p", { class: "erro" }, mensagemDeErro(e)));
    }
  });
}

/** Foto (envia ao Cloudinary) ou ícone pronto. estado = { valor, enviando }. */
function seletorImagem(estado, { rotulo = "Imagem da tarefa (opcional)", dica, mostrarIcones = true } = {}) {
  const raiz = h("div", { class: "campo" });
  const arquivo = h("input", { type: "file", accept: "image/*", hidden: true });
  const desenhar = () => {
    trocar(raiz,
      h("span", {}, rotulo),
      h("small", { class: "dica" }, dica ?? "Uma foto de como está agora (ex.: louça suja) para comparar com o \"depois\", ou um ícone. Ajuda quem ainda não sabe ler."),
      h("div", { class: "seletor-imagem" },
        estado.enviando ? h("span", { class: "imagem-vazia previa" }, h("span", { class: "girando" })) : imagemTarefa(estado.valor, { classe: "previa" }),
        h("div", { class: "linha" },
          botao(estado.valor && !estado.valor.startsWith("icone:") ? "Trocar foto" : "Enviar foto", () => arquivo.click(), { classe: "secundario pequeno", iconeNome: "camera", desabilitado: estado.enviando }),
          estado.valor && !estado.enviando ? botao("Remover", () => { estado.valor = null; desenhar(); }, { classe: "texto pequeno", iconeNome: "x", vars: { "--cor": "var(--danger-txt)" } }) : null)
      ),
      mostrarIcones
        ? [h("small", { class: "rotulo" }, "Ou escolha um ícone"),
           h("div", { class: "grade-icones" }, ICONES_TAREFA.map(([id, nome]) =>
             h("button", { type: "button", title: nome, "aria-label": nome, "aria-pressed": estado.valor === `icone:${id}` ? "true" : "false", disabled: estado.enviando, onclick: () => { estado.valor = `icone:${id}`; desenhar(); } },
               h("img", { src: `img/icones-tarefa/${id}.png`, alt: "", loading: "lazy" }))))]
        : null,
      arquivo
    );
  };
  arquivo.addEventListener("change", async () => {
    const f = arquivo.files?.[0];
    arquivo.value = "";
    if (!f) return;
    estado.enviando = true;
    desenhar();
    try {
      estado.valor = await enviarFoto(f);
    } catch (e) {
      avisar(mensagemDeErro(e), { erro: true });
    } finally {
      estado.enviando = false;
      desenhar();
    }
  });
  desenhar();
  return raiz;
}

function chipsBits(opcoes, inicial, aoMudar, rotulo) {
  let valor = inicial;
  const grupo = h("div", { class: "chips", role: "group", "aria-label": rotulo, style: { marginBottom: 0 } });
  const desenhar = () => trocar(grupo, opcoes.map(([v, r]) => chip(r, (valor & v) !== 0, () => { valor ^= v; desenhar(); aoMudar(valor); })));
  desenhar();
  return grupo;
}

const horaAgora = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

export function telaNovaTarefa(main, { filhoId }) {
  carregar(main, api.filhos, (filhos) => {
    const filho = filhos.find((f) => f.usuarioId === filhoId);
    if (!filho) return trocar(main, cartaoVazio("Filho não encontrado."));
    const e = { frequencia: "Diaria", dias: 0, prazoTipo: "JanelaHoras", comprovacao: 1 };
    const imagem = { valor: null, enviando: false };
    const titulo = h("input", { type: "text", placeholder: "ex: Arrumar a cama", maxlength: 200, required: true });
    const valor = entradaValor();
    const dataInicio = h("input", { type: "date", value: dataIso(new Date()) });
    const prazoHorario = h("input", { type: "time", value: "20:00" });
    const horarioInicio = h("input", { type: "time", value: horaAgora() });
    const quantidade = h("input", { type: "number", min: 1, step: 1, value: 6, inputmode: "numeric" });
    const dias = chipsBits(DIAS, 0, (v) => (e.dias = v), "Dias da semana");
    const areaDias = h("div", { hidden: true }, dias);
    const rotuloQuantidade = h("span", {}, "Quantas horas depois de disponível");
    const areaFixo = campo("Até que horas", prazoHorario);
    const areaJanela = h("div", { class: "dupla" }, campo("Disponível a partir de", horarioInicio), h("label", { class: "campo" }, rotuloQuantidade, quantidade));
    areaFixo.hidden = true;
    const erro = erroForm();

    const form = h("form", { class: "cartao", novalidate: true },
      campo("Título", titulo),
      seletorImagem(imagem),
      campo("Valor (R$)", valor),
      h("div", { class: "campo" }, h("span", {}, "Frequência"),
        segmentos([["Diaria", "Todo dia"], ["DiasDaSemana", "Dias da semana"], ["Unica", "Uma vez"]], e.frequencia, (v) => { e.frequencia = v; areaDias.hidden = v !== "DiasDaSemana"; }, "Frequência")),
      areaDias,
      campo("Começa em", dataInicio),
      h("div", { class: "campo" }, h("span", {}, "Prazo para concluir"),
        segmentos([["JanelaHoras", "Horas depois"], ["JanelaDias", "Dias depois"], ["HorarioFixoNoDia", "Horário fixo"]], e.prazoTipo, (v) => {
          e.prazoTipo = v;
          areaFixo.hidden = v !== "HorarioFixoNoDia";
          areaJanela.hidden = v === "HorarioFixoNoDia";
          rotuloQuantidade.textContent = v === "JanelaDias" ? "Quantos dias depois de disponível" : "Quantas horas depois de disponível";
          if (v === "JanelaDias" && quantidade.value === "6") quantidade.value = "2";
        }, "Prazo")),
      areaFixo,
      areaJanela,
      h("div", { class: "campo" }, h("span", {}, "Tipos de comprovação aceitos"),
        h("small", { class: "dica" }, "O filho escolhe um desses para pedir aprovação. Se não marcar nenhum, a tarefa não exige comprovação."),
        chipsBits(COMPROVACOES, e.comprovacao, (v) => (e.comprovacao = v), "Comprovação")),
      erro,
      botao("Criar tarefa", null, { tipo: "submit", classe: "largo" })
    );
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = lerReais(valor.value);
      const qtd = Number(quantidade.value);
      if (!titulo.value.trim()) return mostrarErro(erro, "Dê um título para a tarefa.");
      if (!(v > 0)) return mostrarErro(erro, "Informe um valor maior que zero (ex.: 2,50).");
      if (e.frequencia === "DiasDaSemana" && !e.dias) return mostrarErro(erro, "Marque pelo menos um dia da semana.");
      if (e.prazoTipo !== "HorarioFixoNoDia" && !(qtd > 0)) return mostrarErro(erro, "Informe o prazo (número maior que zero).");
      if (!dataInicio.value) return mostrarErro(erro, "Informe quando a tarefa começa.");
      if (imagem.enviando) return mostrarErro(erro, "Espere a foto terminar de enviar.");
      mostrarErro(erro, null);
      const fixo = e.prazoTipo === "HorarioFixoNoDia";
      comCarregando(enviador(ev), async () => {
        try {
          await api.criarTarefa(filhoId, {
            titulo: titulo.value.trim(),
            valorPadrao: v,
            frequencia: e.frequencia,
            diasDaSemana: e.frequencia === "DiasDaSemana" ? e.dias : 0,
            dataInicio: dataInicio.value,
            prazoTipo: e.prazoTipo,
            prazoHorario: fixo ? `${prazoHorario.value || "20:00"}:00` : null,
            prazoQuantidade: fixo ? null : qtd,
            horarioInicio: fixo ? null : `${horarioInicio.value || horaAgora()}:00`,
            imagemUrl: imagem.valor,
            tiposComprovacaoAceitos: e.comprovacao,
          });
          avisar("Tarefa criada.");
          ir(`/tarefas?filho=${filhoId}`);
        } catch (err) {
          mostrarErro(erro, mensagemDeErro(err, "Não foi possível criar a tarefa."));
        }
      });
    });
    trocar(main, h("div", { class: "estreito" }, cabecalho("Nova tarefa", `Para ${filho.nome}`, { voltar: `#/tarefas?filho=${filhoId}` }), form));
    titulo.focus();
  });
}

export function telaEditarTarefa(main, { filhoId, tarefaId }) {
  carregar(main, () => api.tarefa(filhoId, tarefaId), (t) => {
    const voltar = `#/tarefas?filho=${filhoId}`;
    let comprovacao = t.tiposComprovacaoAceitos;
    const imagem = { valor: t.imagemUrl, enviando: false };
    const titulo = h("input", { type: "text", value: t.titulo, maxlength: 200 });
    const descricao = h("input", { type: "text", value: t.descricao ?? "", maxlength: 1000 });
    const dataFim = h("input", { type: "date", value: t.dataFim ? t.dataFim.slice(0, 10) : "" });
    const erro = erroForm();
    const form = h("form", { class: "cartao", novalidate: true },
      h("p", { class: "dica", style: { margin: 0 } }, `${formatarReais(t.valorPadrao)} · ${descreverFrequencia(t.frequencia, t.diasDaSemana)}${t.ativo ? "" : " · Pausada"}. Valor e frequência não mudam depois de criada.`),
      campo("Título", titulo),
      seletorImagem(imagem),
      campo("Descrição (opcional)", descricao),
      campo("Termina em (opcional)", dataFim),
      h("div", { class: "campo" }, h("span", {}, "Tipos de comprovação aceitos"), chipsBits(COMPROVACOES, comprovacao, (v) => (comprovacao = v), "Comprovação")),
      erro,
      botao("Salvar", null, { tipo: "submit", classe: "largo" })
    );
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!titulo.value.trim()) return mostrarErro(erro, "O título não pode ficar vazio.");
      if (imagem.enviando) return mostrarErro(erro, "Espere a foto terminar de enviar.");
      comCarregando(enviador(ev), async () => {
        try {
          await api.atualizarTarefa(filhoId, tarefaId, {
            titulo: titulo.value.trim(),
            descricao: descricao.value.trim() || null,
            tiposComprovacaoAceitos: comprovacao,
            dataFim: dataFim.value || null,
            imagemUrl: imagem.valor,
          });
          avisar("Tarefa salva.");
          ir(voltar.slice(1));
        } catch (e) {
          mostrarErro(erro, mensagemDeErro(e, "Não foi possível salvar."));
        }
      });
    });
    const acoes = h("div", { class: "botoes" },
      botao(t.ativo ? "Pausar tarefa" : "Reativar tarefa", (ev) => comCarregando(ev.currentTarget, async () => {
        try {
          if (t.ativo) await api.pausarTarefa(filhoId, tarefaId);
          else await api.reativarTarefa(filhoId, tarefaId);
          avisar(t.ativo ? "Tarefa pausada." : "Tarefa reativada.");
          ir(voltar.slice(1));
        } catch (e) {
          avisar(mensagemDeErro(e), { erro: true });
        }
      }), { classe: "secundario", vars: { "--cor": t.ativo ? "var(--danger)" : "var(--success)" } }),
      botao("Excluir tarefa", async (ev) => {
        const btn = ev.currentTarget;
        const ok = await confirmar("Excluir esta tarefa?", "Isso apaga a tarefa e todo o histórico de comprovantes dela. Não dá para desfazer. Se só quiser parar de gerar novas, use \"Pausar tarefa\".", { sim: "Excluir", perigo: true });
        if (!ok) return;
        comCarregando(btn, async () => {
          try {
            await api.excluirTarefa(filhoId, tarefaId);
            avisar("Tarefa excluída.");
            ir(voltar.slice(1));
          } catch (e) {
            avisar(mensagemDeErro(e), { erro: true });
          }
        });
      }, { classe: "texto", vars: { "--cor": "var(--danger-txt)" } })
    );
    trocar(main, h("div", { class: "estreito" }, cabecalho("Editar tarefa", null, { voltar }), form, acoes));
  });
}

// ======================================================================
// CASTIGOS e REGRAS AUTOMÁTICAS
// ======================================================================
const PRESETS = [["Nota baixa", 8], ["Falta de respeito", 5], ["Não chegou no horário", 3]];

export function telaCastigos(main) {
  carregar(main, api.filhos, (todos) => {
    const filhos = todos.filter((f) => f.ativo);
    const topo = cabecalho("Castigos", "Descontam direto da mesada de quem você escolher.", { direita: h("a", { class: "botao secundario", href: "#/regras" }, icone("repetir"), "Regras automáticas") });
    if (filhos.length === 0) return trocar(main, topo, cartaoVazio("Cadastre um filho no Painel antes de aplicar um castigo."));

    const aplicar = async (btn, filho, valor, motivo) => {
      const ok = await confirmar("Aplicar castigo?", `Descontar ${formatarReais(valor)} de ${filho.nome} por "${motivo}"?`, { sim: "Aplicar", perigo: true });
      if (!ok) return false;
      return comCarregando(btn, async () => {
        try {
          await api.aplicarCastigo(filho.usuarioId, valor, motivo);
          avisar(`Castigo aplicado: ${formatarReais(valor)} descontado de ${filho.nome}.`);
          return true;
        } catch (e) {
          avisar(mensagemDeErro(e), { erro: true });
          return false;
        }
      });
    };
    const escolherFilho = (valor, obterMotivo) =>
      h("div", { class: "chips", style: { marginTop: "12px", marginBottom: 0 } },
        filhos.map((f) => h("button", { type: "button", class: "chip", vars: { "--cor-chip": "var(--danger)" }, onclick: (ev) => {
          const motivo = obterMotivo();
          const v = typeof valor === "function" ? valor() : valor;
          if (motivo && v > 0) aplicar(ev.currentTarget, f, v, motivo);
        } }, avatar(f.nome, f.fotoUrl, 22), f.nome)));

    const cartoes = PRESETS.map(([motivo, valor]) => {
      const area = h("div", { hidden: true }, h("p", { class: "dica" }, "Quem recebe?"), escolherFilho(valor, () => motivo));
      return h("div", { class: "cartao" },
        h("div", { class: "item" },
          h("div", { class: "texto titulo-item" }, motivo),
          h("span", { class: "valor-negativo" }, `- ${formatarReais(valor)}`),
          botao("Aplicar", () => { area.hidden = !area.hidden; }, { classe: "pequeno perigo" })),
        area);
    });

    const motivo = h("input", { type: "text", placeholder: "ex: Brigou com o irmão", maxlength: 200 });
    const valor = entradaValor();
    const dicaPers = h("small", { class: "dica" }, "Preencha o motivo e o valor, depois escolha quem recebe.");
    const personalizado = h("div", { class: "cartao" },
      h("div", { class: "titulo-item" }, "Castigo personalizado"),
      h("div", { class: "dupla", style: { marginTop: "12px" } }, campo("Motivo", motivo), campo("Valor (R$)", valor)),
      dicaPers,
      escolherFilho(() => lerReais(valor.value), () => {
        const m = motivo.value.trim();
        const v = lerReais(valor.value);
        if (!m || !(v > 0)) {
          dicaPers.className = "erro";
          return null;
        }
        dicaPers.className = "dica";
        return m;
      })
    );
    trocar(main, topo, h("div", { class: "grade" }, cartoes, personalizado));
  });
}

export function telaRegras(main) {
  carregar(main, api.regras, (regras) => {
    trocar(main,
      h("div", { class: "estreito" },
        cabecalho("Regras automáticas", "Aplicam um castigo sozinhas quando a condição acontece.", { voltar: "#/castigos" }),
        regras.length === 0
          ? cartaoVazio("Nenhuma regra criada ainda.")
          : h("div", { class: "pilha" }, regras.map((r) =>
              h("a", { class: `cartao ${r.ativo ? "" : "inativo"}`, href: `#/regras/${r.id}` },
                h("div", { class: "titulo-item" }, r.nome),
                h("div", { class: "meta" }, `${r.quantidadeLimite} tarefa${r.quantidadeLimite > 1 ? "s" : ""} não cumprida${r.quantidadeLimite > 1 ? "s" : ""} em ${r.periodoDias} dia${r.periodoDias > 1 ? "s" : ""} → −${formatarReais(r.valorDesconto)}`),
                r.ativo ? null : h("span", { class: "pilula" }, "Inativa")))),
        h("div", { class: "botoes" }, h("a", { class: "botao", href: "#/regras/nova" }, icone("mais"), "Nova regra"))
      ));
  });
}

export function telaFormularioRegra(main, { id }) {
  carregar(main, () => (id ? api.regra(id) : Promise.resolve(null)), (regra) => {
    const nome = h("input", { type: "text", value: regra?.nome ?? "", placeholder: "ex: Faltas recorrentes", maxlength: 100 });
    const qtd = h("input", { type: "number", min: 1, step: 1, value: regra?.quantidadeLimite ?? 3 });
    const periodo = h("input", { type: "number", min: 1, step: 1, value: regra?.periodoDias ?? 7 });
    const valor = entradaValor(regra?.valorDesconto);
    const frase = h("p", { class: "dica", style: { margin: 0 } });
    const atualizarFrase = () => (frase.textContent = `Quando o filho deixar de cumprir ${qtd.value || "?"} tarefa(s) em ${periodo.value || "?"} dia(s), aplica um desconto automático.`);
    qtd.addEventListener("input", atualizarFrase);
    periodo.addEventListener("input", atualizarFrase);
    atualizarFrase();
    const erro = erroForm();
    const form = h("form", { class: "cartao", novalidate: true },
      campo("Nome da regra", nome), frase,
      h("div", { class: "dupla" }, campo("Quantidade", qtd), campo("Período (dias)", periodo)),
      campo("Valor do desconto (R$)", valor), erro,
      botao("Salvar", null, { tipo: "submit", classe: "largo" }));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const dados = { nome: nome.value.trim(), quantidadeLimite: Number(qtd.value), periodoDias: Number(periodo.value), valorDesconto: lerReais(valor.value) };
      if (!dados.nome || !(dados.quantidadeLimite > 0) || !(dados.periodoDias > 0) || !(dados.valorDesconto > 0))
        return mostrarErro(erro, "Preencha o nome, a quantidade, o período e o valor (maiores que zero).");
      comCarregando(enviador(ev), async () => {
        try {
          if (regra) await api.atualizarRegra(regra.id, dados);
          else await api.criarRegra({ ...dados, tipoCondicao: "TarefasNaoCumpridasNoPeriodo" });
          avisar("Regra salva.");
          ir("/regras");
        } catch (e) {
          mostrarErro(erro, mensagemDeErro(e, "Não foi possível salvar."));
        }
      });
    });
    const alternar = regra
      ? h("div", { class: "botoes" }, botao(regra.ativo ? "Desativar regra" : "Reativar regra", (ev) => comCarregando(ev.currentTarget, async () => {
          try {
            if (regra.ativo) await api.desativarRegra(regra.id);
            else await api.reativarRegra(regra.id);
            ir("/regras");
          } catch (e) {
            avisar(mensagemDeErro(e), { erro: true });
          }
        }), { classe: "texto", vars: { "--cor": regra.ativo ? "var(--danger-txt)" : "var(--success-txt)" } }))
      : null;
    trocar(main, h("div", { class: "estreito" }, cabecalho(regra ? "Editar regra" : "Nova regra automática", null, { voltar: "#/regras" }), form, alternar));
  });
}

// ======================================================================
// FILHOS
// ======================================================================
const GENEROS = [["Menino", "Menino"], ["Menina", "Menina"], ["PrefiroNaoDizer", "Prefiro não dizer"]];
const FREQUENCIAS = [["Semanal", "Semanal"], ["Quinzenal", "Quinzenal"], ["Mensal", "Mensal"]];
const MODOS = { SoMeta: "Uma meta por vez. Todo dinheiro das tarefas vai direto para ela até completar. Bom para crianças menores.", Cofrinhos: "Várias metas. O dinheiro fica livre e o filho escolhe quanto guardar em cada uma." };

function campoModoMeta(e) {
  const dica = h("small", { class: "dica" }, MODOS[e.modoMeta]);
  return h("div", { class: "campo" }, h("span", {}, "Como junta dinheiro para as metas"),
    segmentos([["SoMeta", "🎯 Só a meta"], ["Cofrinhos", "🐷 Cofrinhos"]], e.modoMeta, (v) => { e.modoMeta = v; dica.textContent = MODOS[v]; }, "Modo das metas"), dica);
}

function campoGenero(e) {
  return h("div", { class: "campo" }, h("span", {}, "Cor do app (gênero)"), segmentos(GENEROS, e.genero, (v) => (e.genero = v), "Gênero"),
    h("small", { class: "dica" }, "Azul para menino, rosa para menina, roxo para \"prefiro não dizer\". Só muda as cores."));
}

export function telaNovoFilho(main) {
  const e = { genero: "PrefiroNaoDizer", tipoAcesso: "PerfilGerenciado", frequenciaSaque: "Semanal", modoMeta: "SoMeta" };
  const nome = h("input", { type: "text", placeholder: "Como o filho é chamado", maxlength: 100 });
  const pin = h("input", { type: "password", inputmode: "numeric", placeholder: "1234", maxlength: 6, autocomplete: "new-password" });
  const email = h("input", { type: "email", placeholder: "dele@email.com", autocomplete: "off" });
  const senha = h("input", { type: "password", placeholder: "Mínimo 8 caracteres", autocomplete: "new-password" });
  const nascimento = h("input", { type: "date" });
  const areaPin = campo("PIN (4 a 6 números)", pin, "Ele entra só com o PIN, no celular que você configurar pelo app.");
  const areaConta = h("div", { class: "pilha", hidden: true }, campo("E-mail", email), campo("Senha", senha));
  const erro = erroForm();
  const form = h("form", { class: "cartao", novalidate: true },
    campo("Nome", nome),
    campoGenero(e),
    h("div", { class: "campo" }, h("span", {}, "Tipo de acesso"),
      segmentos([["PerfilGerenciado", "Criança (PIN)"], ["ContaPropria", "Adolescente (e-mail)"]], e.tipoAcesso, (v) => { e.tipoAcesso = v; areaPin.hidden = v !== "PerfilGerenciado"; areaConta.hidden = v === "PerfilGerenciado"; }, "Tipo de acesso")),
    areaPin, areaConta,
    campo("Data de nascimento (opcional)", nascimento),
    h("div", { class: "campo" }, h("span", {}, "Frequência de saque da mesada"), segmentos(FREQUENCIAS, e.frequenciaSaque, (v) => (e.frequenciaSaque = v), "Frequência de saque")),
    campoModoMeta(e),
    erro,
    botao("Cadastrar", null, { tipo: "submit", classe: "largo" })
  );
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const crianca = e.tipoAcesso === "PerfilGerenciado";
    if (!nome.value.trim()) return mostrarErro(erro, "Informe o nome.");
    if (crianca && !/^\d{4,6}$/.test(pin.value)) return mostrarErro(erro, "O PIN precisa ter de 4 a 6 números.");
    if (!crianca && (!email.value.trim() || senha.value.length < 8)) return mostrarErro(erro, "Informe o e-mail e uma senha com pelo menos 8 caracteres.");
    comCarregando(enviador(ev), async () => {
      try {
        await api.criarFilho({
          nome: nome.value.trim(), tipoAcesso: e.tipoAcesso, frequenciaSaque: e.frequenciaSaque, modoMeta: e.modoMeta, genero: e.genero,
          dataNascimento: nascimento.value || null,
          email: crianca ? null : email.value.trim(), senha: crianca ? null : senha.value, pin: crianca ? pin.value : null,
        });
        avisar(`${nome.value.trim()} cadastrado.`);
        ir("/");
      } catch (err) {
        mostrarErro(erro, mensagemDeErro(err, "Não foi possível cadastrar."));
      }
    });
  });
  trocar(main, h("div", { class: "estreito" }, cabecalho("Novo filho", "Cadastre um perfil para ele usar o app.", { voltar: "#/" }), form));
  nome.focus();
}

export function telaEditarFilho(main, { id }) {
  carregar(main, api.filhos, (filhos) => {
    const f = filhos.find((x) => x.usuarioId === id);
    if (!f) return trocar(main, cartaoVazio("Filho não encontrado."));
    const e = { genero: f.genero ?? "PrefiroNaoDizer", frequenciaSaque: ["Semanal", "Quinzenal", "Mensal"].includes(f.frequenciaSaque) ? f.frequenciaSaque : "Semanal", modoMeta: f.modoMeta ?? "SoMeta" };
    const nome = h("input", { type: "text", value: f.nome, maxlength: 100 });
    const nascimento = h("input", { type: "date", value: f.dataNascimento ? f.dataNascimento.slice(0, 10) : "" });
    const erro = erroForm();
    const form = h("form", { class: "cartao", novalidate: true, vars: varsTema(f.genero) },
      h("div", { class: "item" }, h("div", { class: "moldura" }, avatar(f.nome, f.fotoUrl, 56)),
        h("div", { class: "texto" }, h("div", { class: "titulo-item" }, f.nome), h("div", { class: "meta" }, `Saldo ${formatarReais(f.saldoAtual)} · ${f.tipoAcesso === "ContaPropria" ? "entra com e-mail" : "entra com PIN"}`))),
      campo("Nome", nome),
      campoGenero(e),
      campo("Data de nascimento (opcional)", nascimento),
      h("div", { class: "campo" }, h("span", {}, "Frequência de saque da mesada"), segmentos(FREQUENCIAS, e.frequenciaSaque, (v) => (e.frequenciaSaque = v), "Frequência de saque")),
      campoModoMeta(e),
      erro,
      botao("Salvar", null, { tipo: "submit", classe: "largo" })
    );
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!nome.value.trim()) return mostrarErro(erro, "Informe o nome.");
      comCarregando(enviador(ev), async () => {
        try {
          await api.atualizarFilho(id, { nome: nome.value.trim(), frequenciaSaque: e.frequenciaSaque, modoMeta: e.modoMeta, genero: e.genero, dataNascimento: nascimento.value || null });
          avisar("Dados salvos.");
          ir("/");
        } catch (err) {
          mostrarErro(erro, mensagemDeErro(err, "Não foi possível salvar."));
        }
      });
    });
    const desativar = f.ativo
      ? h("div", { class: "botoes" }, botao("Desativar filho", async (ev) => {
          const btn = ev.currentTarget;
          if (!(await confirmar("Desativar filho?", `${f.nome} não vai conseguir mais entrar no app.`, { sim: "Desativar", perigo: true }))) return;
          comCarregando(btn, async () => {
            try {
              await api.desativarFilho(id);
              avisar(`${f.nome} foi desativado.`);
              ir("/");
            } catch (err) {
              avisar(mensagemDeErro(err), { erro: true });
            }
          });
        }, { classe: "texto", vars: { "--cor": "var(--danger-txt)" } }))
      : null;
    trocar(main, h("div", { class: "estreito" }, cabecalho("Editar filho", null, { voltar: "#/" }), form, h("div", { class: "secao" }, "Chave PIX da mesada"), cartaoChavePix(f), desativar));
  });
}

function cartaoChavePix(f) {
  let tipo = f.tipoChavePix ?? "Cpf";
  const entrada = h("input", { type: "text", value: formatarChavePix(f.tipoChavePix, f.chavePix), placeholder: EXEMPLO_CHAVE[tipo], autocomplete: "off" });
  const msg = h("p", { hidden: true });
  const form = h("form", { class: "cartao", novalidate: true },
    h("small", { class: "dica" }, "É para esta chave que você paga quando o filho pede a mesada."),
    h("div", { class: "campo" }, h("span", {}, "Tipo da chave PIX"),
      segmentos(Object.entries(ROTULO_CHAVE), tipo, (v) => { tipo = v; entrada.placeholder = EXEMPLO_CHAVE[v]; }, "Tipo da chave")),
    campo("Chave PIX", entrada),
    msg,
    botao("Salvar chave PIX", null, { tipo: "submit", classe: "secundario largo" })
  );
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!entrada.value.trim()) return;
    comCarregando(enviador(ev), async () => {
      try {
        await api.definirChavePix(f.usuarioId, tipo, entrada.value.trim());
        msg.className = "ok";
        msg.textContent = "Chave PIX salva.";
      } catch (e) {
        msg.className = "erro";
        msg.textContent = mensagemDeErro(e, "Não foi possível salvar a chave.");
      }
      msg.hidden = false;
    });
  });
  return form;
}

// ======================================================================
// METAS
// ======================================================================
const ROTULO_MOV = {
  Guardar: "Guardou", Tirar: "Tirou", GuardadoAutomatico: "Guardado automático (tarefa)", RetiradaCastigo: "Retirado por castigo",
  SobraDevolvida: "Sobra devolvida (valor da meta baixou)", Bonus: "Bônus do responsável", Conclusao: "Meta concluída",
};
const entra = (t) => t === "Guardar" || t === "GuardadoAutomatico" || t === "Bonus";

function cartaoMeta(m, filhoId) {
  return h("a", { class: "cartao cartao-meta", href: `#/metas/${filhoId}/${m.id}` },
    imagemTarefa(m.imagemUrl),
    h("div", { style: { flex: 1, minWidth: 0, display: "grid", gap: "6px" } },
      h("div", { class: "linha" }, h("span", { class: "titulo-item espaco" }, m.titulo), h("strong", {}, formatarReais(m.valor))),
      m.status === "Ativa"
        ? [barraProgresso(m.percentual), h("span", { class: "meta" }, `${formatarReais(m.valorGuardado)} guardados · ${m.percentual}%`)]
        : h("span", { class: "pilula sucesso" }, "Conquistada 🎉")));
}

export function telaMetas(main, { filhoId }) {
  carregar(main, () => Promise.all([api.filhos(), api.metas(filhoId)]), ([filhos, resumo]) => {
    const f = filhos.find((x) => x.usuarioId === filhoId);
    const soMeta = resumo.modoMeta === "SoMeta";
    const ativas = resumo.metas.filter((m) => m.status === "Ativa");
    const concluidas = resumo.metas.filter((m) => m.status === "Concluida");
    trocar(main, h("div", { class: "estreito", vars: varsTema(f?.genero) },
      cabecalho(`Metas de ${f?.nome ?? ""}`, null, { voltar: "#/" }),
      h("div", { class: "resumo-metas" },
        h("div", { style: { fontWeight: 800 } }, soMeta ? "🎯 Só a meta" : "🐷 Cofrinhos"),
        h("div", { style: { opacity: 0.9, fontSize: "0.85rem" } }, "Guardado nas metas"),
        h("div", { class: "numero" }, formatarReais(resumo.totalGuardado)),
        h("div", { style: { opacity: 0.9, fontSize: "0.85rem" } }, `Livre: ${formatarReais(resumo.saldoLivre)} · Total: ${formatarReais(resumo.saldoTotal)}`)),
      h("p", { class: "dica" }, soMeta ? "Todo dinheiro das tarefas vai direto para a meta até ela ficar completa." : "O filho escolhe quanto do dinheiro livre guardar em cada meta."),
      h("div", { class: "secao" }, "Em andamento"),
      ativas.length ? h("div", { class: "pilha" }, ativas.map((m) => cartaoMeta(m, filhoId))) : cartaoVazio("Nenhuma meta em andamento."),
      h("div", { class: "botoes" }, !soMeta || ativas.length === 0
        ? h("a", { class: "botao", href: `#/metas/${filhoId}/nova`, style: { background: "linear-gradient(135deg, var(--cor), var(--escura))" } }, icone("mais"), "Nova meta")
        : h("p", { class: "dica" }, "No modo \"Só a meta\" é uma por vez. Conclua ou exclua a atual para criar outra.")),
      concluidas.length ? [h("div", { class: "secao" }, "Conquistadas"), h("div", { class: "pilha" }, concluidas.map((m) => cartaoMeta(m, filhoId)))] : null
    ));
  });
}

export function telaDetalheMeta(main, { filhoId, metaId }) {
  const recarregar = () => telaDetalheMeta(main, { filhoId, metaId });
  carregar(main, () => Promise.all([api.filhos(), api.metas(filhoId), api.movimentacoesMeta(metaId)]), ([filhos, resumo, movs]) => {
    const f = filhos.find((x) => x.usuarioId === filhoId);
    const m = resumo.metas.find((x) => x.id === metaId);
    if (!m) return trocar(main, cartaoVazio("Meta não encontrada."));
    const ativa = m.status === "Ativa";
    const cofrinhos = resumo.modoMeta === "Cofrinhos";
    const livre = Math.max(0, resumo.saldoLivre ?? 0);
    const executar = (btn, acao, sucesso) => comCarregando(btn, async () => {
      try {
        await acao();
        avisar(sucesso);
        recarregar();
        return true;
      } catch (e) {
        avisar(mensagemDeErro(e), { erro: true });
        return false;
      }
    });
    const link = urlSegura(m.linkProduto) ?? (/^http:\/\//i.test(m.linkProduto ?? "") ? m.linkProduto : null);
    trocar(main, h("div", { class: "estreito", vars: varsTema(f?.genero) },
      cabecalho(m.titulo, f ? `Meta de ${f.nome}` : null, { voltar: `#/metas/${filhoId}` }),
      h("div", { class: "detalhe-meta-topo" },
        imagemTarefa(m.imagemUrl),
        h("strong", { style: { fontSize: "1.3rem" } }, formatarReais(m.valor)),
        link ? h("a", { class: "link-icone", href: link, target: "_blank", rel: "noopener noreferrer" }, icone("link"), "Ver produto") : null),
      h("div", { class: "cartao", style: { marginTop: "16px" } },
        ativa
          ? [h("div", { class: "linha" }, h("strong", { class: "espaco" }, "Cofrinho"), h("strong", { style: { color: "var(--escura)" } }, `${m.percentual}%`)),
             h("div", { style: { margin: "8px 0" } }, barraProgresso(m.percentual)),
             h("div", {}, `${formatarReais(m.valorGuardado)} guardados · faltam ${formatarReais(m.falta)}`),
             h("small", { class: "dica" }, cofrinhos ? `Livre para guardar: ${formatarReais(livre)}` : "Modo \"Só a meta\": o dinheiro das tarefas entra aqui sozinho.")]
          : h("p", { class: "ok", style: { textAlign: "center" } }, `Conquistada! 🎉 ${m.concluidaEm ? new Date(m.concluidaEm).toLocaleDateString("pt-BR") : ""}`)),
      ativa
        ? h("div", { class: "botoes" },
            cofrinhos ? botao("Guardar", () => operarMeta("guardar", m, livre, recarregar), { classe: "secundario", desabilitado: livre <= 0 || m.falta <= 0, vars: { "--cor": "var(--escura)" } }) : null,
            cofrinhos ? botao("Tirar", () => operarMeta("tirar", m, livre, recarregar), { classe: "secundario", desabilitado: m.valorGuardado <= 0, vars: { "--cor": "var(--escura)" } }) : null,
            botao("Concluir meta", async (ev) => {
              const btn = ev.currentTarget;
              if (m.falta > 0) {
                if (await confirmar("Ainda falta dinheiro", `Faltam ${formatarReais(m.falta)} para completar "${m.titulo}". Quer dar esse valor como bônus e concluir a meta?`, { sim: `Dar ${formatarReais(m.falta)} de bônus` }))
                  executar(btn, () => api.concluirMeta(m.id, true), "Meta concluída com bônus.");
              } else if (await confirmar("Concluir meta?", `Serão descontados ${formatarReais(m.valor)} do saldo por "${m.titulo}".`, { sim: "Concluir" })) {
                executar(btn, () => api.concluirMeta(m.id, false), "Meta concluída.");
              }
            }, { classe: "sucesso" }),
            h("a", { class: "botao texto", href: `#/metas/${filhoId}/${m.id}/editar`, vars: { "--cor": "var(--escura)" } }, icone("editar"), "Editar"))
        : null,
      h("div", { class: "botoes" }, botao("Excluir meta", async (ev) => {
        const btn = ev.currentTarget;
        const devolve = ativa && m.valorGuardado > 0 ? ` Os ${formatarReais(m.valorGuardado)} guardados voltam para o dinheiro livre.` : "";
        if (!(await confirmar("Excluir meta?", `"${m.titulo}" será apagada.${devolve}`, { sim: "Excluir", perigo: true }))) return;
        comCarregando(btn, async () => {
          try {
            await api.excluirMeta(m.id);
            avisar("Meta excluída.");
            ir(`/metas/${filhoId}`);
          } catch (e) {
            avisar(mensagemDeErro(e), { erro: true });
          }
        });
      }, { classe: "texto", vars: { "--cor": "var(--danger-txt)" } })),
      h("div", { class: "secao" }, "Histórico do cofrinho"),
      movs.length === 0
        ? h("p", { class: "dica" }, "Nada guardado ainda.")
        : h("div", { class: "cartao historico" }, movs.map((mv) =>
            h("div", {},
              h("div", {}, h("div", { style: { fontWeight: 700 } }, ROTULO_MOV[mv.tipo] ?? mv.tipo), h("small", { class: "dica" }, dataCurta(mv.criadoEm))),
              h("strong", { class: mv.tipo === "Conclusao" ? "" : entra(mv.tipo) ? "valor-positivo" : "valor-negativo" }, `${mv.tipo === "Conclusao" ? "" : entra(mv.tipo) ? "+ " : "- "}${formatarReais(mv.valor)}`))))
    ));
  });
}

function operarMeta(tipo, m, livre, recarregar) {
  const guardar = tipo === "guardar";
  const maximo = guardar ? Math.min(livre, m.falta) : m.valorGuardado;
  const valor = entradaValor();
  const erro = erroForm();
  const confirmarBtn = botao("Confirmar", (ev) => {
    const v = lerReais(valor.value);
    if (!(v > 0)) return mostrarErro(erro, "Informe um valor maior que zero.");
    if (v > maximo) return mostrarErro(erro, `O máximo aqui é ${formatarReais(maximo)}.`);
    comCarregando(ev.currentTarget, async () => {
      try {
        await (guardar ? api.guardarNaMeta(m.id, v) : api.tirarDaMeta(m.id, v));
        janela.fechar();
        avisar(guardar ? "Guardado na meta." : "Retirado da meta.");
        recarregar();
      } catch (e) {
        mostrarErro(erro, mensagemDeErro(e));
      }
    });
  }, { classe: "largo" });
  const janela = abrirJanela(guardar ? "Guardar na meta" : "Tirar da meta", [
    h("p", { class: "dica", style: { margin: 0 } }, guardar ? `Livre: ${formatarReais(livre)} · falta: ${formatarReais(m.falta)}` : `Guardado: ${formatarReais(m.valorGuardado)}`),
    campo("Quanto? (R$)", valor),
    botao(guardar ? (livre >= m.falta ? "Tudo que falta" : "Tudo que está livre") : "Tirar tudo", () => (valor.value = maximo.toFixed(2).replace(".", ",")), { classe: "texto pequeno" }),
    erro, confirmarBtn,
  ]);
  valor.focus();
}

export function telaFormularioMeta(main, { filhoId, metaId }) {
  carregar(main, () => (metaId ? api.metas(filhoId) : Promise.resolve(null)), (resumo) => {
    const meta = metaId ? resumo.metas.find((m) => m.id === metaId) : null;
    if (metaId && !meta) return trocar(main, cartaoVazio("Meta não encontrada."));
    const imagem = { valor: meta?.imagemUrl ?? null, enviando: false };
    const titulo = h("input", { type: "text", value: meta?.titulo ?? "", placeholder: "ex: Video game, boneca, bicicleta", maxlength: 200 });
    const valor = entradaValor(meta?.valor);
    const link = h("input", { type: "url", value: meta?.linkProduto ?? "", placeholder: "Cole aqui o link da loja" });
    const erro = erroForm();
    const form = h("form", { class: "cartao", novalidate: true },
      campo("Nome", titulo), campo("Preço (R$)", valor), campo("Link do produto (opcional)", link),
      seletorImagem(imagem, { rotulo: "Foto do produto (opcional)", dica: "Envie uma foto ou imagem do produto.", mostrarIcones: false }),
      erro, botao(meta ? "Salvar" : "Criar meta", null, { tipo: "submit", classe: "largo" }));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = lerReais(valor.value);
      if (!titulo.value.trim() || !(v > 0)) return mostrarErro(erro, "Informe o nome e um preço maior que zero.");
      if (imagem.enviando) return mostrarErro(erro, "Espere a foto terminar de enviar.");
      const dados = { titulo: titulo.value.trim(), valor: v, linkProduto: link.value.trim() || null, imagemUrl: imagem.valor };
      comCarregando(enviador(ev), async () => {
        try {
          if (meta) await api.atualizarMeta(meta.id, dados);
          else await api.criarMeta(filhoId, dados);
          avisar("Meta salva.");
          ir(meta ? `/metas/${filhoId}/${meta.id}` : `/metas/${filhoId}`);
        } catch (e) {
          mostrarErro(erro, mensagemDeErro(e, "Não foi possível salvar a meta."));
        }
      });
    });
    trocar(main, h("div", { class: "estreito" }, cabecalho(meta ? "Editar meta" : "Nova meta", "O que ele quer conquistar?", { voltar: meta ? `#/metas/${filhoId}/${meta.id}` : `#/metas/${filhoId}` }), form));
  });
}

// ======================================================================
// PERFIL e EXCLUIR CONTA
// ======================================================================
export function telaPerfil(main, _p, _b, { sair }) {
  carregar(main, api.perfil, (perfil) => {
    let foto = perfil.fotoUrl;
    const topo = h("div", { class: "item" });
    const desenharTopo = () => trocar(topo, avatar(perfil.nome, foto, 72), h("div", { class: "texto" }, h("div", { class: "titulo-item", style: { fontSize: "1.2rem" } }, perfil.nome), h("span", { class: "pilula neutro" }, "MODO RESPONSÁVEL")));
    const grade = h("div", { class: "grade-avatares" });
    const desenharGrade = () => trocar(grade, AVATARES_PAI.map((id) =>
      h("button", { type: "button", "aria-pressed": foto === `preset:${id}` ? "true" : "false", "aria-label": "Escolher este avatar", onclick: () => { foto = `preset:${id}`; desenharTopo(); desenharGrade(); } },
        h("img", { src: `img/avatares/${id}.jpg`, alt: "", loading: "lazy" }))));
    const arquivo = h("input", { type: "file", accept: "image/*", hidden: true });
    const salvar = botao("Salvar foto", (ev) => comCarregando(ev.currentTarget, async () => {
      try {
        await api.atualizarFoto(foto);
        avisar("Foto do perfil salva.");
      } catch (e) {
        avisar(mensagemDeErro(e), { erro: true });
      }
    }), { classe: "largo" });
    const enviar = botao("Enviar uma foto", () => arquivo.click(), { classe: "secundario largo", iconeNome: "camera" });
    arquivo.addEventListener("change", async () => {
      const f = arquivo.files?.[0];
      arquivo.value = "";
      if (!f) return;
      await comCarregando(enviar, async () => {
        try {
          foto = await enviarFoto(f);
          desenharTopo();
          desenharGrade();
        } catch (e) {
          avisar(mensagemDeErro(e), { erro: true });
        }
      });
    });
    desenharTopo();
    desenharGrade();
    trocar(main, h("div", { class: "estreito" },
      cabecalho("Seu perfil", null, { voltar: "#/" }),
      h("div", { class: "cartao pilha" }, topo, h("span", { class: "rotulo" }, "Escolha um avatar"), grade, h("div", { class: "divisor" }, "ou"), enviar, arquivo, salvar),
      h("div", { class: "secao" }, "Conta da família"),
      h("div", { class: "cartao lista-links" },
        h("a", { href: "../termos.html", target: "_blank", rel: "noopener" }, icone("arquivo"), h("span", { class: "espaco" }, "Termos de Uso"), icone("direita")),
        h("a", { href: "../privacidade.html", target: "_blank", rel: "noopener" }, icone("escudo"), h("span", { class: "espaco" }, "Política de Privacidade"), icone("direita")),
        h("button", { type: "button", onclick: sair }, icone("sair"), h("span", { class: "espaco" }, "Sair desta conta"), icone("direita")),
        h("a", { href: "#/excluir-conta", class: "perigo" }, icone("lixeira"), h("span", { class: "espaco" }, "Excluir conta da família"), icone("direita")))
    ));
  });
}

export function telaExcluirConta(main, _p, _b, { aoExcluir }) {
  const PALAVRA = "EXCLUIR";
  const confirmacao = h("input", { type: "text", placeholder: PALAVRA, autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
  const erro = erroForm();
  const excluir = botao("Excluir conta para sempre", null, { tipo: "submit", classe: "perigo largo", desabilitado: true });
  confirmacao.addEventListener("input", () => (excluir.disabled = confirmacao.value.trim().toUpperCase() !== PALAVRA));
  const form = h("form", { class: "cartao", novalidate: true }, campo(`Digite ${PALAVRA} para confirmar`, confirmacao), erro, excluir, h("a", { class: "botao texto", href: "#/perfil" }, "Cancelar"));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (confirmacao.value.trim().toUpperCase() !== PALAVRA) return;
    comCarregando(excluir, async () => {
      try {
        await auth.excluirFamilia(confirmacao.value.trim());
        limparSessao();
        aoExcluir();
      } catch (e) {
        mostrarErro(erro, mensagemDeErro(e, "Não foi possível excluir a conta. Tente novamente."));
      }
    });
  });
  trocar(main, h("div", { class: "estreito" },
    cabecalho("Excluir conta da família", null, { voltar: "#/perfil" }),
    h("div", { class: "perigo-caixa" },
      h("h2", {}, icone("alerta"), "Isso não tem volta"),
      h("p", { style: { margin: "8px 0 0" } }, "Vamos apagar para sempre:"),
      h("ul", {},
        h("li", {}, "a sua conta e a de todos os responsáveis e filhos da família"),
        h("li", {}, "tarefas, comprovantes (fotos, áudios e vídeos) e aprovações"),
        h("li", {}, "saldo, extrato, metas, cofrinhos, pedidos de mesada e descontos"),
        h("li", {}, "os celulares configurados para os filhos")),
      h("p", { style: { margin: 0 } }, "Quem estiver usando o app em outro celular sai na próxima vez que ele falar com o servidor.")),
    h("div", { style: { marginTop: "16px" } }, form)
  ));
}
