// Área do responsável do Conquistou: o pai/mãe faz pelo navegador o que faz no app.
// Começo da página: conclui o login com Google (se voltou dele), confere a sessão e desenha a tela da rota.

import { auth, api, aplicarResultado, sessaoAtual, garantirSessao, limparSessao, definirAoExpirar, mensagemDeErro, novoDesafioGoogle, verificadorGoogle, carregarPerfilGuardado, perfilGuardado } from "./api.js";
import { h, trocar, icone, iconeGoogle, botao, comCarregando, campo, avisar, carregandoTela, avatar } from "./ui.js";
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
  ["/cupons", telas.telaCupons, "cupons"],
  ["/perfil", telas.telaPerfil, null],
  ["/responsaveis", telas.telaResponsaveis, null],
  ["/ajuda", telas.telaAjuda, null],
  ["/excluir-conta", telas.telaExcluirConta, null],
];

const ABAS = [
  ["painel", "#/", "Painel", "home"],
  ["aprovacoes", "#/aprovacoes", "Aprovações", "checkQuadrado"],
  ["tarefas", "#/tarefas", "Tarefas", "lista"],
  ["castigos", "#/castigos", "Castigos", "escudo"],
];
// só aparece para o administrador do Conquistou (o servidor confere de novo em cada chamada)
const ABA_CUPONS = ["cupons", "#/cupons", "Cupons", "etiqueta"];
let admin = false;
async function conferirAdmin() {
  try {
    admin = !!(await api.souAdmin())?.admin;
  } catch {
    admin = false;
  }
}

// ---------- barra com as abas ----------
function mostrarBarra(abaAtiva, pendentes) {
  barra.hidden = false;
  document.body.classList.add("com-abas");
  trocar(abas, (admin ? [...ABAS, ABA_CUPONS] : ABAS).map(([id, href, texto, ic]) =>
    h("a", { href, "aria-current": id === abaAtiva ? "page" : null }, icone(ic), h("span", {}, texto),
      id === "aprovacoes" && pendentes > 0 ? h("span", { class: "contador", "aria-label": `${pendentes} pendentes` }, String(pendentes)) : null)));
  trocar(barraAcoes,
    // no computador a barra vira um menu lateral e estes botões ganham o texto (.rotulo-acao); no celular ficam só os ícones
    h("a", { class: "botao-redondo", href: "#/ajuda", title: "Ajuda", "aria-label": "Ajuda" }, icone("ajuda"), h("span", { class: "rotulo-acao" }, "Ajuda")),
    // a foto (ou avatar) do responsável abre o Perfil; antes só havia um ícone genérico
    h("a", { class: "botao-redondo foto-perfil", href: "#/perfil", title: "Meu perfil", "aria-label": "Meu perfil" }, avatar(perfilGuardado.dados?.nome ?? sessaoAtual()?.nome ?? "?", perfilGuardado.dados?.fotoUrl, 36), h("span", { class: "rotulo-acao" }, h("b", {}, primeiroNomeBarra()), h("small", {}, "Meu perfil"))),
    h("button", { type: "button", class: "botao-redondo", title: "Sair", "aria-label": "Sair", onclick: sair }, icone("sair"), h("span", { class: "rotulo-acao" }, "Sair")));
}

const primeiroNomeBarra = () => String(perfilGuardado.dados?.nome ?? sessaoAtual()?.nome ?? "Responsável").split(" ")[0];

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
  admin = false;
  avisar("Você saiu da conta.");
  ir("/entrar", { substituir: true });
}

// ---------- telas de entrada ----------
function telaEntrada(...conteudo) {
  esconderBarra();
  trocar(main, h("div", { class: "entrada-fundo" },
    h("aside", { class: "entrada-marca", "aria-hidden": "true" },
      h("img", { src: "../img/icone-180.png", alt: "", width: 72, height: 72 }),
      h("h2", {}, "Tarefas, mesada e conquistas da família"),
      h("p", {}, "Acompanhe tudo pelo computador: aprove tarefas, pague a mesada e veja o que cada filho está conquistando."),
      h("ul", {}, h("li", {}, "Aprovações com foto, áudio e vídeo"), h("li", {}, "Pai e mãe na mesma família"), h("li", {}, "Metas e mesada por PIX"))),
    h("div", { class: "cartao entrada-cartao" },
    h("a", { class: "marca", href: "../" }, h("img", { src: "../img/icone-180.png", alt: "", width: 44, height: 44 }), h("span", {}, "Conquistou")),
    ...conteudo)));
}

function botaoGoogle(manter, convite = false) {
  const b = botao(convite ? "Continuar com o Google" : "Entrar com o Google", (ev) => comCarregando(ev.currentTarget, async () => {
    try {
      sessionStorage.setItem(CHAVE_MANTER, manter() ? "1" : "0");
      const { authUrl } = await auth.iniciarGoogle(RETORNO_GOOGLE, await novoDesafioGoogle(), convite);
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
    h("p", { class: "rodape-entrada", style: { marginTop: "8px" } }, h("a", { href: "#/esqueci-senha" }, "Esqueci a senha")),
    h("div", { class: "divisor", style: { margin: "16px 0" } }, "ou"),
    botaoGoogle(() => manter.checked),
    h("p", { class: "rodape-entrada" }, "Ainda não tem conta? ", h("a", { href: "#/criar-conta" }, "Criar conta da família")),
    h("p", { class: "rodape-entrada" }, "Recebeu um convite? ", h("a", { href: "#/entrar-na-familia" }, "Entrar na família")),
    h("p", { class: "rodape-entrada" }, "É filho? Use o app Conquistou no celular.")
  );
  email.focus();
}

// "Esqueci a senha": 1) informa o e-mail e recebe um código de 6 números; 2) digita o código e a senha nova.
function telaEsqueciSenha() {
  const email = h("input", { type: "email", autocomplete: "username", placeholder: "seu@email.com", required: true });
  const codigo = h("input", { type: "text", inputmode: "numeric", autocomplete: "one-time-code", placeholder: "6 números", maxlength: 6 });
  const nova = h("input", { type: "password", autocomplete: "new-password", placeholder: "Mínimo 8 caracteres" });
  const repetir = h("input", { type: "password", autocomplete: "new-password", placeholder: "Repita a senha nova" });
  const erro = h("p", { class: "erro", role: "alert", hidden: true });
  const falhar = (t) => { erro.textContent = t; erro.hidden = false; };
  const corpo = h("div", {});

  const passo1 = () => {
    erro.hidden = true;
    const form = h("form", { novalidate: true },
      h("p", { class: "subtitulo" }, "Informe o e-mail da sua conta. Vamos mandar um código de 6 números para você criar uma senha nova."),
      campo("E-mail", email), erro,
      botao("Enviar o código", null, { tipo: "submit", classe: "entrada largo" }));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!email.value.trim()) return falhar("Informe o e-mail.");
      comCarregando(form.querySelector("[type=submit]"), async () => {
        try {
          await auth.esqueciSenha(email.value.trim());
          passo2();
        } catch (e) {
          falhar(mensagemDeErro(e, "Não foi possível enviar o código. Tente novamente."));
        }
      });
    });
    trocar(corpo, form);
    email.focus();
  };

  const passo2 = () => {
    erro.hidden = true;
    const form = h("form", { novalidate: true },
      h("p", { class: "subtitulo" }, `Se existe uma conta com ${email.value.trim()}, o código chegou no e-mail (veja também a caixa de spam). Ele vale por 15 minutos.`),
      campo("Código", codigo), campo("Nova senha", nova), campo("Repita a senha", repetir), erro,
      botao("Criar a senha nova", null, { tipo: "submit", classe: "entrada largo" }),
      botao("Voltar", () => passo1(), { classe: "texto largo" }));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (!/^\d{6}$/.test(codigo.value.trim())) return falhar("O código tem 6 números.");
      if (nova.value.length < 8) return falhar("A senha precisa ter pelo menos 8 caracteres.");
      if (nova.value !== repetir.value) return falhar("As duas senhas estão diferentes.");
      comCarregando(form.querySelector("[type=submit]"), async () => {
        try {
          await auth.redefinirSenha(email.value.trim(), codigo.value.trim(), nova.value);
          avisar("Senha criada. Agora é só entrar com a senha nova.");
          ir("/entrar", { substituir: true });
        } catch (e) {
          falhar(mensagemDeErro(e, "Não foi possível criar a senha nova. Confira o código."));
        }
      });
    });
    trocar(corpo, form);
    codigo.focus();
  };

  telaEntrada(h("h1", {}, "Esqueci a senha"), corpo, h("p", { class: "rodape-entrada" }, h("a", { href: "#/entrar" }, "Voltar para entrar")));
  passo1();
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

// Convite de pai/mãe: entra numa família que já existe. Google (vale o e-mail da conta, sem senha) ou e-mail + código.
function telaEntrarNaFamilia() {
  const email = h("input", { type: "email", autocomplete: "username", placeholder: "seu@email.com" });
  const codigo = h("input", { type: "text", autocomplete: "off", placeholder: "ex: K7M2QX9P", maxlength: 12, style: { textTransform: "uppercase" } });
  const nome = h("input", { type: "text", autocomplete: "name", placeholder: "Como você quer ser chamado", maxlength: 100 });
  const senha = h("input", { type: "password", autocomplete: "new-password", placeholder: "Mínimo 8 caracteres" });
  const aceite = h("input", { type: "checkbox" });
  const erro = h("p", { class: "erro", role: "alert", hidden: true });
  const form = h("form", { novalidate: true },
    campo("E-mail do convite", email), campo("Código do convite", codigo), campo("Seu nome", nome), campo("Crie uma senha", senha),
    h("label", { class: "marcar" }, aceite, h("span", {}, "Li e aceito os ",
      h("a", { href: "../termos.html", target: "_blank", rel: "noopener" }, "Termos de Uso"), " e a ",
      h("a", { href: "../privacidade.html", target: "_blank", rel: "noopener" }, "Política de Privacidade"),
      ". Sou pai, mãe ou responsável legal pelas crianças da família.")),
    erro,
    botao("Entrar na família", null, { tipo: "submit", classe: "entrada largo" }));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const falhar = (t) => { erro.textContent = t; erro.hidden = false; };
    if (!email.value.trim() || codigo.value.trim().length < 8 || !nome.value.trim()) return falhar("Preencha o e-mail, o código de 8 letras e números e o seu nome.");
    if (senha.value.length < 8) return falhar("A senha precisa ter pelo menos 8 caracteres.");
    if (!aceite.checked) return falhar("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
    comCarregando(form.querySelector("[type=submit]"), async () => {
      try {
        const resultado = await auth.registrarComConvite({ email: email.value.trim(), codigo: codigo.value.trim(), nomeResponsavel: nome.value.trim(), senha: senha.value, aceitouTermos: true });
        await concluirLogin(resultado, false);
      } catch (e) {
        falhar(mensagemDeErro(e, "Não foi possível entrar na família."));
      }
    });
  });
  telaEntrada(
    h("h1", {}, "Entrar na família"),
    h("p", { class: "subtitulo" }, "Entre com a conta Google que recebeu o convite, ou use o código de 8 letras e números que veio no e-mail."),
    botaoGoogle(() => false, true),
    h("div", { class: "divisor", style: { margin: "16px 0" } }, "ou use o código do e-mail"),
    form,
    h("p", { class: "rodape-entrada" }, "Já tem conta? ", h("a", { href: "#/entrar" }, "Entrar")));
  email.focus();
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
  await conferirAdmin();
  await carregarPerfilGuardado();
  const guardado = sessionStorage.getItem("conquistou.painel.destino");
  sessionStorage.removeItem("conquistou.painel.destino");
  const destino = guardado ?? (location.hash.replace(/^#/, "") || "/");
  ir(destino.startsWith("/entrar") || destino.startsWith("/criar-conta") || destino.startsWith("/esqueci-senha") || destino.startsWith("/entrar-na-familia") || destino.startsWith("/conta-excluida") ? "/" : destino, { substituir: true });
}

// ---------- desenho da rota atual ----------
function desenhar() {
  const { caminho, busca } = rotaAtual();
  const logado = !!sessaoAtual();
  window.scrollTo(0, 0);

  if (!logado) {
    if (caminho === "/criar-conta") return telaCriarConta();
    if (caminho === "/esqueci-senha") return telaEsqueciSenha();
    if (caminho === "/entrar-na-familia") return telaEntrarNaFamilia();
    if (caminho !== "/entrar" && caminho !== "/esqueci-senha" && caminho !== "/entrar-na-familia") sessionStorage.setItem("conquistou.painel.destino", caminho + (busca.toString() ? `?${busca}` : ""));
    if (caminho === "/conta-excluida") return telaContaExcluida();
    if (caminho !== "/entrar") return ir("/entrar", { substituir: true });
    return telaEntrar();
  }
  if (caminho === "/entrar" || caminho === "/criar-conta" || caminho === "/esqueci-senha" || caminho === "/entrar-na-familia") return ir("/", { substituir: true });
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
  const erroGoogle = consulta.get("erro");
  if (erroGoogle) {
    history.replaceState(null, "", location.pathname + "#/entrar-na-familia"); // tira o motivo do endereço
    sessionStorage.removeItem(CHAVE_MANTER);
    verificadorGoogle(); // apaga o segredo guardado antes de ir ao Google
    avisar(erroGoogle, { erro: true });
  }
  const handoff = consulta.get("handoff");
  if (handoff) {
    history.replaceState(null, "", location.pathname + location.hash); // tira o código do endereço e do histórico
    const manter = sessionStorage.getItem(CHAVE_MANTER) === "1";
    sessionStorage.removeItem(CHAVE_MANTER);
    try {
      await concluirLogin(await auth.trocarGoogle(handoff, verificadorGoogle()), manter);
    } catch (e) {
      limparSessao();
      avisar(mensagemDeErro(e, "Não foi possível entrar com o Google."), { erro: true });
    }
  } else if (sessaoAtual() && (await garantirSessao()) === false) {
    limparSessao(); // refresh token vencido ou revogado (sem internet a sessão fica guardada)
  }
  if (sessaoAtual() && !handoff) {
    await conferirAdmin();
    await carregarPerfilGuardado();
  }

  window.addEventListener("hashchange", desenhar);
  window.addEventListener("conquistou:atualizou", atualizarPendentes);
  window.addEventListener("conquistou:perfil", () => {
    const aba = ROTAS.find(([m]) => casar(m, rotaAtual().caminho))?.[2];
    if (!barra.hidden) mostrarBarra(aba, pendentes); // a foto nova aparece no topo
  });
  desenhar();
}

iniciar();
