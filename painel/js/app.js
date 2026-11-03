// Área do responsável do Conquistou: o pai/mãe faz pelo navegador o que faz no app.
// Começo da página: conclui o login com Google (se voltou dele), confere a sessão e desenha a tela da rota.

import { auth, api, aplicarResultado, sessaoAtual, garantirSessao, limparSessao, definirAoExpirar, mensagemDeErro } from "./api.js";
import { h, trocar, icone, iconeGoogle, botao, comCarregando, campo, avisar, carregandoTela } from "./ui.js";
import { rotaAtual, ir, casar } from "./rotas.js";
import * as telas from "./telas.js";

const main = document.getElementById("conteudo");
const barra = document.getElementById("barra");
const abas = document.getElementById("abas");
const barraAcoes = document.getElementById("barra-acoes");
const CHAVE_MANTER = "conquistou.painel.manter"; // escolha "Manter conectado" enquanto vai e volta do Google

// endereço exato liberado no backend (PainelWeb:RetornosGoogle)
const RETORNO_GOOGLE = `${location.origin}${location.pathname.replace(/[^/]*$/, "")}`;

const ROTAS = [
  ["/", telas.telaPainel, "painel"],
  ["/aprovacoes", telas.telaAprovacoes, "aprovacoes"],
  ["/tarefas", telas.telaTarefas, "tarefas"],
  ["/tarefas/nova/:filhoId", telas.telaNovaTarefa, "tarefas"],
  ["/tarefas/:filhoId/:tarefaId", telas.telaEditarTarefa, "tarefas"],
  ["/castigos", telas.telaCastigos, "castigos"],
  ["/regras", telas.telaRegras, "castigos"],
  ["/regras/nova", telas.telaFormularioRegra, "castigos"],
  ["/regras/:id", telas.telaFormularioRegra, "castigos"],
  ["/filhos/novo", telas.telaNovoFilho, "painel"],
  ["/filhos/:id", telas.telaEditarFilho, "painel"],
  ["/metas/:filhoId", telas.telaMetas, "painel"],
  ["/metas/:filhoId/nova", telas.telaFormularioMeta, "painel"],
  ["/metas/:filhoId/:metaId", telas.telaDetalheMeta, "painel"],
  ["/metas/:filhoId/:metaId/editar", telas.telaFormularioMeta, "painel"],
  ["/perfil", telas.telaPerfil, null],
  ["/excluir-conta", telas.telaExcluirConta, null],
];

const ABAS = [
  ["painel", "#/", "Painel", "home"],
  ["aprovacoes", "#/aprovacoes", "Aprovações", "checkQuadrado"],
  ["tarefas", "#/tarefas", "Tarefas", "lista"],
  ["castigos", "#/castigos", "Castigos", "escudo"],
];

// ---------- barra com as abas ----------
function mostrarBarra(abaAtiva, pendentes) {
  barra.hidden = false;
  document.body.classList.add("com-abas");
  trocar(abas, ABAS.map(([id, href, texto, ic]) =>
    h("a", { href, "aria-current": id === abaAtiva ? "page" : null }, icone(ic), h("span", {}, texto),
      id === "aprovacoes" && pendentes > 0 ? h("span", { class: "contador", "aria-label": `${pendentes} pendentes` }, String(pendentes)) : null)));
  trocar(barraAcoes,
    h("a", { class: "botao-redondo", href: "#/perfil", title: "Perfil", "aria-label": "Perfil" }, icone("usuario")),
    h("button", { type: "button", class: "botao-redondo", title: "Sair", "aria-label": "Sair", onclick: sair }, icone("sair")));
}

function esconderBarra() {
  barra.hidden = true;
  document.body.classList.remove("com-abas");
}

let pendentes = 0;
async function atualizarPendentes() {
  try {
    const resumo = await api.resumoPainel();
    if (resumo.totalPendentes !== pendentes) {
      pendentes = resumo.totalPendentes;
      const aba = ROTAS.find(([m]) => casar(m, rotaAtual().caminho))?.[2];
      if (!barra.hidden) mostrarBarra(aba, pendentes);
    }
  } catch {
    /* o contador é só um extra */
  }
}

async function sair() {
  await auth.sair();
  avisar("Você saiu da conta.");
  ir("/entrar", { substituir: true });
}

// ---------- telas de entrada ----------
function telaEntrada(...conteudo) {
  esconderBarra();
  trocar(main, h("div", { class: "entrada-fundo" }, h("div", { class: "cartao entrada-cartao" },
    h("a", { class: "marca", href: "../" }, h("img", { src: "../img/icone-180.png", alt: "", width: 44, height: 44 }), h("span", {}, "Conquistou")),
    ...conteudo)));
}

function botaoGoogle(manter) {
  const b = botao("Entrar com o Google", (ev) => comCarregando(ev.currentTarget, async () => {
    try {
      sessionStorage.setItem(CHAVE_MANTER, manter() ? "1" : "0");
      const { authUrl } = await auth.iniciarGoogle(RETORNO_GOOGLE);
      if (!/^https:\/\/accounts\.google\.com\//.test(authUrl)) throw new Error("Endereço de login inesperado.");
      location.assign(authUrl);
      await new Promise(() => {}); // segura o "Aguarde..." até o navegador sair da página
    } catch (e) {
      avisar(mensagemDeErro(e, "Não foi possível entrar com o Google."), { erro: true });
    }
  }), { classe: "botao-google largo" });
  b.prepend(iconeGoogle());
  return b;
}

function telaEntrar() {
  const email = h("input", { type: "email", autocomplete: "username", placeholder: "seu@email.com", required: true });
  const senha = h("input", { type: "password", autocomplete: "current-password", placeholder: "••••••••", required: true });
  const manter = h("input", { type: "checkbox" });
  const erro = h("p", { class: "erro", role: "alert", hidden: true });
  const form = h("form", { novalidate: true },
    campo("E-mail", email),
    campo("Senha", senha),
    h("label", { class: "marcar" }, manter, h("span", {}, "Manter conectado neste computador", h("br"), h("small", { class: "dica" }, "Não marque em computador compartilhado."))),
    erro,
    botao("Entrar", null, { tipo: "submit", classe: "entrada largo" })
  );
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!email.value.trim() || !senha.value) {
      erro.textContent = "Preencha o e-mail e a senha.";
      erro.hidden = false;
      return;
    }
    comCarregando(form.querySelector("[type=submit]"), async () => {
      try {
        const resultado = await auth.entrar(email.value.trim(), senha.value);
        await concluirLogin(resultado, manter.checked);
      } catch (e) {
        erro.textContent = mensagemDeErro(e, "E-mail ou senha incorretos.");
        erro.hidden = false;
      }
    });
  });
  telaEntrada(
    h("h1", {}, "Área do responsável"),
    h("p", { class: "subtitulo" }, "Acompanhe as conquistas da família pelo computador."),
    form,
    h("div", { class: "divisor", style: { margin: "16px 0" } }, "ou"),
    botaoGoogle(() => manter.checked),
    h("p", { class: "rodape-entrada" }, "Ainda não tem conta? ", h("a", { href: "#/criar-conta" }, "Criar conta da família")),
    h("p", { class: "rodape-entrada" }, "É filho? Use o app Conquistou no celular.")
  );
  email.focus();
}

function telaCriarConta() {
  const familia = h("input", { type: "text", placeholder: "ex: Família Silva", maxlength: 100 });
  const nome = h("input", { type: "text", autocomplete: "name", placeholder: "Como você se chama", maxlength: 100 });
  const email = h("input", { type: "email", autocomplete: "username", placeholder: "seu@email.com" });
  const senha = h("input", { type: "password", autocomplete: "new-password", placeholder: "Mínimo 8 caracteres" });
  const aceite = h("input", { type: "checkbox" });
  const erro = h("p", { class: "erro", role: "alert", hidden: true });
  const form = h("form", { novalidate: true },
    campo("Nome da família", familia), campo("Seu nome", nome), campo("E-mail", email), campo("Senha", senha),
    h("label", { class: "marcar" }, aceite, h("span", {}, "Li e aceito os ",
      h("a", { href: "../termos.html", target: "_blank", rel: "noopener" }, "Termos de Uso"), " e a ",
      h("a", { href: "../privacidade.html", target: "_blank", rel: "noopener" }, "Política de Privacidade"),
      ". Sou pai, mãe ou responsável legal pelas crianças que vou cadastrar.")),
    erro,
    botao("Criar conta", null, { tipo: "submit", classe: "entrada largo" }));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const falhar = (t) => { erro.textContent = t; erro.hidden = false; };
    if (!familia.value.trim() || !nome.value.trim() || !email.value.trim()) return falhar("Preencha todos os campos.");
    if (senha.value.length < 8) return falhar("A senha precisa ter pelo menos 8 caracteres.");
    if (!aceite.checked) return falhar("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
    comCarregando(form.querySelector("[type=submit]"), async () => {
      try {
        const resultado = await auth.registrar({ nomeFamilia: familia.value.trim(), nomeResponsavel: nome.value.trim(), email: email.value.trim(), senha: senha.value, aceitouTermos: true });
        await concluirLogin(resultado, false);
      } catch (e) {
        falhar(mensagemDeErro(e, "Não foi possível criar a conta."));
      }
    });
  });
  telaEntrada(h("h1", {}, "Criar conta"), h("p", { class: "subtitulo" }, "Uma conta para a família toda."), form,
    h("p", { class: "rodape-entrada" }, "Já tem conta? ", h("a", { href: "#/entrar" }, "Entrar")));
  familia.focus();
}

function telaTermos() {
  const aceite = h("input", { type: "checkbox" });
  const continuar = botao("Continuar", (ev) => comCarregando(ev.currentTarget, async () => {
    try {
      await auth.aceitarTermos();
      const s = sessaoAtual();
      if (s) s.precisaAceitarTermos = false;
      desenhar();
    } catch (e) {
      avisar(mensagemDeErro(e), { erro: true });
    }
  }), { classe: "entrada largo", desabilitado: true });
  aceite.addEventListener("change", () => (continuar.disabled = !aceite.checked));
  telaEntrada(
    h("h1", {}, "Antes de continuar"),
    h("p", { class: "subtitulo" }, "Atualizamos os Termos de Uso e a Política de Privacidade. Para usar o Conquistou, leia e aceite."),
    h("div", { class: "pilha" },
      h("label", { class: "marcar" }, aceite, h("span", {}, "Li e aceito os ",
        h("a", { href: "../termos.html", target: "_blank", rel: "noopener" }, "Termos de Uso"), " e a ",
        h("a", { href: "../privacidade.html", target: "_blank", rel: "noopener" }, "Política de Privacidade"),
        ". Sou pai, mãe ou responsável legal pelas crianças cadastradas.")),
      continuar,
      botao("Sair", sair, { classe: "texto largo" }))
  );
}

function telaContaExcluida() {
  telaEntrada(h("h1", {}, "Conta excluída"), h("p", { class: "subtitulo" }, "Todos os dados da família foram apagados. Obrigado por ter usado o Conquistou."),
    h("a", { class: "botao largo", href: "../" }, "Voltar ao site"));
}

async function concluirLogin(resultado, manter) {
  if (resultado.papel !== "Responsavel") {
    // conta de adolescente (e-mail próprio): não deixa sessão de filho aberta aqui
    aplicarResultado(resultado, false);
    await auth.sair();
    throw new Error("Esta área é só para o responsável. Os filhos usam o app Conquistou no celular.");
  }
  aplicarResultado(resultado, manter);
  const guardado = sessionStorage.getItem("conquistou.painel.destino");
  sessionStorage.removeItem("conquistou.painel.destino");
  const destino = guardado ?? (location.hash.replace(/^#/, "") || "/");
  ir(destino.startsWith("/entrar") || destino.startsWith("/criar-conta") || destino.startsWith("/conta-excluida") ? "/" : destino, { substituir: true });
}

// ---------- desenho da rota atual ----------
function desenhar() {
  const { caminho, busca } = rotaAtual();
  const logado = !!sessaoAtual();
  window.scrollTo(0, 0);

  if (!logado) {
    if (caminho === "/criar-conta") return telaCriarConta();
    if (caminho !== "/entrar") sessionStorage.setItem("conquistou.painel.destino", caminho + (busca.toString() ? `?${busca}` : ""));
    if (caminho === "/conta-excluida") return telaContaExcluida();
    if (caminho !== "/entrar") return ir("/entrar", { substituir: true });
    return telaEntrar();
  }
  if (caminho === "/entrar" || caminho === "/criar-conta") return ir("/", { substituir: true });
  if (sessaoAtual().precisaAceitarTermos) return telaTermos();

  for (const [modelo, tela, aba] of ROTAS) {
    const params = casar(modelo, caminho);
    if (params) {
      mostrarBarra(aba, pendentes);
      tela(main, params, busca, { sair, aoExcluir: () => ir("/conta-excluida", { substituir: true }) });
      main.focus({ preventScroll: true });
      return;
    }
  }
  mostrarBarra(null, pendentes);
  trocar(main, h("div", { class: "cartao estreito" }, h("p", {}, "Página não encontrada."), h("a", { class: "botao", href: "#/" }, "Ir para o Painel")));
}

// ---------- início ----------
async function iniciar() {
  trocar(main, carregandoTela());
  definirAoExpirar(() => {
    avisar("Sua sessão expirou. Entre de novo.", { erro: true });
    ir("/entrar", { substituir: true });
  });

  // Volta do login com Google: /painel/?handoff=... (código de uso único, vale 2 minutos)
  const consulta = new URLSearchParams(location.search);
  const handoff = consulta.get("handoff");
  if (handoff) {
    history.replaceState(null, "", location.pathname + location.hash); // tira o código do endereço e do histórico
    const manter = sessionStorage.getItem(CHAVE_MANTER) === "1";
    sessionStorage.removeItem(CHAVE_MANTER);
    try {
      await concluirLogin(await auth.trocarGoogle(handoff), manter);
    } catch (e) {
      limparSessao();
      avisar(mensagemDeErro(e, "Não foi possível entrar com o Google."), { erro: true });
    }
  } else if (sessaoAtual() && (await garantirSessao()) === false) {
    limparSessao(); // refresh token vencido ou revogado (sem internet a sessão fica guardada)
  }

  window.addEventListener("hashchange", desenhar);
  window.addEventListener("conquistou:atualizou", atualizarPendentes);
  desenhar();
}

iniciar();
