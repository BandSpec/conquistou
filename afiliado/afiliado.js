// Painel do afiliado: entra com a chave secreta que o Conquistou entregou. Só leitura e só números
// (nunca nome nem dado de família). A chave vem no endereço (conquistou.com.br/afiliado/#CHAVE), é tirada do endereço
// na hora e fica só nesta aba (sessionStorage); vai apenas no cabeçalho X-Chave-Afiliado da API oficial.

import { API_URL } from "../painel/js/api.js";
import { h, trocar, icone, botao, comCarregando, campo, avisar, formatarReais, carregandoTela } from "../painel/js/ui.js";

const main = document.getElementById("conteudo");
const CHAVE = "conquistou.afiliado.chave";

function chaveGuardada() {
  try {
    return sessionStorage.getItem(CHAVE) || "";
  } catch {
    return "";
  }
}

async function buscar(chave) {
  const resposta = await fetch(`${API_URL}/api/afiliado/painel`, { headers: { "X-Chave-Afiliado": chave } });
  if (resposta.status === 401) throw new Error("Chave inválida. Confira o link que você recebeu ou peça uma nova.");
  if (resposta.status === 429) throw new Error("Muitas tentativas. Espere um pouco e tente de novo.");
  if (!resposta.ok) throw new Error("Não foi possível carregar o painel. Tente de novo.");
  return resposta.json();
}

function telaChave(mensagem) {
  const chave = h("input", { type: "password", autocomplete: "off", placeholder: "Cole aqui a chave do painel", "aria-label": "Chave do painel" });
  const erro = h("p", { class: "erro", role: "alert", hidden: !mensagem }, mensagem ?? "");
  const form = h("form", { novalidate: true }, campo("Chave do painel", chave), erro, botao("Entrar", null, { tipo: "submit", classe: "entrada largo" }));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!chave.value.trim()) {
      erro.textContent = "Cole a chave que o Conquistou mandou.";
      erro.hidden = false;
      return;
    }
    comCarregando(form.querySelector("[type=submit]"), () => abrir(chave.value.trim()).catch(() => {}));
  });
  trocar(main, h("div", { class: "estreito" }, h("div", { class: "cartao pilha" },
    h("h1", { class: "titulo", style: { fontSize: "1.6rem" } }, "Painel do afiliado"),
    h("p", { class: "subtitulo", style: { margin: 0 } }, "Acompanhe as indicações e a comissão. Entre com a chave que o Conquistou entregou."),
    form)));
  chave.focus();
}

const dinheiro = (v) => formatarReais(v);

function desenhar(d, sair) {
  const c = d.comissao;
  const copiar = botao("Copiar link de divulgação", async () => {
    try {
      await navigator.clipboard.writeText(d.linkIndicacao);
      avisar("Link copiado.");
    } catch {
      avisar("Selecione e copie o link.", { erro: true });
    }
  }, { classe: "secundario", iconeNome: "copiar" });

  const cartao = (rotulo, valor, dica, classe = "branco") =>
    h("div", { class: `resumo ${classe}` }, h("span", { class: "rotulo" }, rotulo), h("span", { class: "numero" }, valor), dica ? h("span", { class: "dica-resumo" }, dica) : null);

  trocar(main, h("div", { class: "afiliado-corpo" },
    h("div", { class: "cabecalho-pagina" },
      h("div", {},
        h("h1", { class: "titulo" }, `Olá, ${d.nome}`),
        h("p", { class: "subtitulo" }, `Seu código é ${d.codigo}. Comissão de ${d.percentualComissao}% sobre o valor líquido de cada pagamento, nos primeiros ${d.mesesComissao} meses de cada família.`)),
      d.ativo ? null : h("span", { class: "pilula perigo" }, "Código desativado")),

    h("div", { class: "cartao pilha" },
      h("span", { class: "rotulo" }, "Seu link de divulgação"),
      h("input", { type: "text", readonly: true, value: d.linkIndicacao, "aria-label": "Link de divulgação", onfocus: (e) => e.target.select() }),
      h("small", { class: "dica" }, `Quem abrir este link e criar a conta no Conquistou fica ligado a você. Também dá para a pessoa digitar o código ${d.codigo} no cadastro.`),
      copiar),

    h("div", { class: "secao" }, "Indicações"),
    h("div", { class: "resumos" },
      cartao("FAMÍLIAS INDICADAS", String(d.familias), "criaram a conta com o seu código"),
      cartao("ASSINANTES AGORA", String(d.assinantes), "com plano pago valendo")),

    h("div", { class: "secao" }, "Comissão"),
    h("div", { class: "resumos" },
      cartao("A RECEBER", dinheiro(c.aReceber), "já liberada, ainda não paga", "destaque"),
      cartao("EM CARÊNCIA", dinheiro(c.emCarencia), `libera ${c.diasDeCarencia} dias depois de cada pagamento`)),
    h("div", { class: "resumos", style: { marginTop: "14px" } },
      cartao("JÁ PAGA A VOCÊ", dinheiro(c.paga), null),
      cartao("ESTORNADA", dinheiro(c.estornada), "pagamentos reembolsados")),
    h("p", { class: "dica" }, `${c.pagamentosContados} pagamento(s) de assinatura contam. A carência existe porque o Google pode reembolsar a compra; reembolso desconta a comissão. O pagamento é feito por PIX pelo Conquistou.`),

    h("div", { class: "secao" }, "Pagamentos que você já recebeu"),
    d.pagamentosRecebidos.length === 0
      ? h("div", { class: "cartao" }, h("p", { class: "vazio" }, "Nenhum pagamento ainda."))
      : h("div", { class: "cartao pilha" }, d.pagamentosRecebidos.map((p) => h("div", { class: "item" },
          icone("check"), h("div", { class: "texto" }, new Date(p.pagoEm).toLocaleDateString("pt-BR") + (p.observacao ? " · " + p.observacao : "")), h("b", {}, dinheiro(p.valor))))),

    h("div", { class: "botoes", style: { marginTop: "22px" } }, botao("Sair deste painel", sair, { classe: "texto" }))));
}

async function abrir(chave) {
  try {
    const dados = await buscar(chave);
    try {
      sessionStorage.setItem(CHAVE, chave);
    } catch {
      /* sem armazenamento: precisa colar de novo ao recarregar */
    }
    desenhar(dados, () => {
      try {
        sessionStorage.removeItem(CHAVE);
      } catch {
        /* nada */
      }
      telaChave();
    });
  } catch (e) {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* nada */
    }
    telaChave(e.message);
    throw e;
  }
}

async function iniciar() {
  trocar(main, carregandoTela());
  let chave = location.hash.replace(/^#/, "").trim();
  if (chave) history.replaceState(null, "", location.pathname + location.search); // a chave sai do endereço e do histórico
  else chave = chaveGuardada();
  if (!chave) return telaChave();
  try {
    await abrir(chave);
  } catch {
    /* a tela de chave já mostrou o motivo */
  }
}

iniciar();
