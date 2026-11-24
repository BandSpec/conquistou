// Conversa com a API oficial do Conquistou e guarda a sessão do responsável neste navegador.
//
// Onde fica cada token:
// - access token (vale 30 min): só na memória da página. Some ao fechar ou recarregar.
// - refresh token (vale 30 dias, troca a cada uso): sessionStorage (some ao fechar a aba) ou,
//   se a pessoa marcar "Manter conectado", localStorage. Sair revoga o token no servidor.
// Nada de cookie (a API é outro domínio). A página só roda scripts dela mesma (ver CSP no index.html).

import { registrarPrevia } from "./previas.js";

const API_OFICIAL = "https://conquistou-production.up.railway.app";
// No computador do desenvolvedor (localhost) a página fala com a API simulada servida no mesmo endereço.
const LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
export const API_URL = LOCAL ? location.origin : API_OFICIAL;

export const CLOUDINARY_CLOUD = "wjrfphjs";
export const CLOUDINARY_PRESET = "combinado_comprovantes";

const CHAVE = "conquistou.painel.sessao";

// Nome e foto do responsável, para o topo da página (mesma ideia do botão com a foto no app).
export const perfilGuardado = { dados: null };

let accessToken = null;
let accessExpiraEm = 0;
let sessao = lerGuardada(); // { refreshToken, usuarioId, nome, papel, precisaAceitarTermos, manter }
let aoExpirar = () => {};

export function definirAoExpirar(fn) {
  aoExpirar = fn;
}

export function sessaoAtual() {
  return sessao;
}

function lerGuardada() {
  for (const armazem of [sessionStorage, localStorage]) {
    try {
      const texto = armazem.getItem(CHAVE);
      if (texto) return JSON.parse(texto);
    } catch {
      /* armazenamento bloqueado: segue sem sessão guardada */
    }
  }
  return null;
}

function guardar(s) {
  try {
    sessionStorage.removeItem(CHAVE);
    localStorage.removeItem(CHAVE);
    if (s) (s.manter ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(s));
  } catch {
    /* sem armazenamento a sessão vale só enquanto a página estiver aberta */
  }
}

export function aplicarResultado(resultado, manter) {
  accessToken = resultado.accessToken;
  accessExpiraEm = new Date(resultado.accessTokenExpiraEm).getTime();
  sessao = {
    refreshToken: resultado.refreshToken,
    usuarioId: resultado.usuarioId,
    nome: resultado.nome,
    papel: resultado.papel,
    precisaAceitarTermos: !!resultado.precisaAceitarTermos,
    manter: !!manter,
  };
  guardar(sessao);
  return sessao;
}

export function limparSessao() {
  perfilGuardado.dados = null;
  accessToken = null;
  accessExpiraEm = 0;
  sessao = null;
  guardar(null);
}

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

// O backend responde erros como { erro: "mensagem" }, exceto validação do ASP.NET ({ errors: { Campo: [...] } }).
async function erroDaResposta(resposta, padrao) {
  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    /* corpo vazio */
  }
  if (dados?.erro) return new ErroApi(dados.erro, resposta.status);
  if (dados?.errors) {
    const primeira = Object.values(dados.errors)[0]?.[0];
    if (primeira) return new ErroApi(primeira, resposta.status);
  }
  return new ErroApi(padrao, resposta.status);
}

export function mensagemDeErro(erro, padrao = "Algo deu errado. Tente novamente.") {
  if (erro instanceof ErroApi) return erro.message;
  if (erro instanceof TypeError) return "Sem conexão com o servidor. Confira a internet e tente de novo.";
  return erro?.message || padrao;
}

// ---------- renovação da sessão (uma por vez, mesmo com várias abas abertas) ----------
let renovando = null;

async function renovar() {
  const executar = async () => {
    const guardada = lerGuardada() ?? sessao; // outra aba pode ter trocado o refresh token
    if (!guardada?.refreshToken) return false;
    const resposta = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: guardada.refreshToken }),
    });
    if (!resposta.ok) return false;
    aplicarResultado(await resposta.json(), guardada.manter);
    return true;
  };
  // false = o servidor recusou (sessão acabou); null = sem conexão (a sessão guardada continua valendo)
  renovando ??= (navigator.locks ? navigator.locks.request("conquistou-renovar", executar) : executar())
    .catch(() => null)
    .finally(() => (renovando = null));
  return renovando;
}

export async function garantirSessao() {
  if (!sessao) return false;
  if (accessToken && Date.now() < accessExpiraEm - 30_000) return true;
  return renovar();
}

// ---------- chamada genérica ----------
export async function chamar(metodo, caminho, { corpo, parametros, publico = false, padrao } = {}) {
  let url = `${API_URL}${caminho}`;
  if (parametros) {
    const busca = new URLSearchParams();
    for (const [k, v] of Object.entries(parametros)) if (v !== undefined && v !== null && v !== "") busca.set(k, v);
    const texto = busca.toString();
    if (texto) url += `?${texto}`;
  }

  const enviar = () => {
    const cabecalhos = {};
    if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
    if (!publico && accessToken) cabecalhos.Authorization = `Bearer ${accessToken}`;
    return fetch(url, { method: metodo, headers: cabecalhos, body: corpo !== undefined ? JSON.stringify(corpo) : undefined });
  };

  if (!publico) await garantirSessao();
  let resposta = await enviar();
  if (resposta.status === 401 && !publico) {
    const renovou = await renovar();
    if (renovou) {
      resposta = await enviar();
    } else if (renovou === null) {
      throw new ErroApi("Sem conexão com o servidor. Confira a internet e tente de novo.", 0);
    } else {
      limparSessao();
      aoExpirar();
      throw new ErroApi("Sua sessão expirou. Entre de novo.", 401);
    }
  }
  if (!resposta.ok) throw await erroDaResposta(resposta, padrao ?? "Não foi possível concluir. Tente novamente.");
  if (resposta.status === 204) return null;
  const tipo = resposta.headers.get("Content-Type") ?? "";
  return tipo.includes("json") ? resposta.json() : null;
}

const get = (c, o) => chamar("GET", c, o);
const post = (c, corpo, o) => chamar("POST", c, { ...o, corpo: corpo ?? undefined });
const put = (c, corpo, o) => chamar("PUT", c, { ...o, corpo });
const del = (c, o) => chamar("DELETE", c, o);

// ---------- código de indicação (link de afiliado: conquistou.com.br/?ref=CODIGO) ----------
const CHAVE_REF = "conquistou.ref";

/** O código guardado pelo link de afiliado (vale 30 dias), ou "". */
export function indicacaoGuardada() {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE_REF) || "null");
    return g && g.ate > Date.now() ? String(g.c) : "";
  } catch {
    return "";
  }
}

/** Guarda o código vindo do endereço (também funciona se o link apontar direto para o painel). */
export function guardarIndicacao(codigo) {
  const limpo = String(codigo ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 30);
  if (!limpo) return;
  try {
    localStorage.setItem(CHAVE_REF, JSON.stringify({ c: limpo, ate: Date.now() + 30 * 864e5 }));
  } catch {
    /* sem armazenamento: o código pode ser digitado */
  }
}

// ---------- login com Google: prova de que quem conclui o login é quem começou ----------
const CHAVE_VERIFICADOR = "conquistou.painel.google";

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Cria o segredo desta aba (guardado até a volta do Google) e devolve o "desafio" para mandar ao servidor. */
export async function novoDesafioGoogle() {
  const verificador = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  sessionStorage.setItem(CHAVE_VERIFICADOR, verificador);
  const resumo = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador));
  return base64Url(new Uint8Array(resumo));
}

/** Lê (e apaga) o segredo guardado antes de ir para o Google. */
export function verificadorGoogle() {
  const verificador = sessionStorage.getItem(CHAVE_VERIFICADOR);
  sessionStorage.removeItem(CHAVE_VERIFICADOR);
  return verificador;
}

// ---------- autenticação ----------
export const auth = {
  entrar: (email, senha) => post("/api/auth/login", { email, senha }, { publico: true, padrao: "E-mail ou senha incorretos." }),
  registrar: (dados) => post("/api/auth/registrar", dados, { publico: true }),
  // convite de pai/mãe: cria a conta dentro da família de quem convidou (e-mail + código de 8 letras e números)
  registrarComConvite: (dados) => post("/api/auth/registrar-com-convite", dados, { publico: true }),
  // "desafio" = SHA-256 (base64url) de um segredo que só esta aba tem; o segredo vai no trocarGoogle
  // convite = true: entra na família do convite (vale o e-mail da conta Google) em vez de criar uma família nova
  iniciarGoogle: (retorno, desafio, convite = false, indicacao = "") => get("/api/auth/google/iniciar", { parametros: { appRedirect: retorno, desafio, convite: convite ? "true" : undefined, indicacao: indicacao || undefined }, publico: true }),
  trocarGoogle: (handoff, verificador) => post("/api/auth/google/trocar", { handoff, verificador: verificador || undefined }, { publico: true, padrao: "Login com Google expirado. Tente novamente." }),
  aceitarTermos: () => post("/api/auth/aceitar-termos"),
  // "Esqueci a senha": o servidor manda um código de 6 números por e-mail (responde igual exista ou não a conta)
  esqueciSenha: (email) => post("/api/auth/esqueci-senha", { email }, { publico: true, padrao: "Não foi possível enviar o código. Tente novamente." }),
  redefinirSenha: (email, codigo, novaSenha) => post("/api/auth/redefinir-senha", { email, codigo, novaSenha }, { publico: true, padrao: "Não foi possível criar a senha nova. Confira o código." }),
  async sair() {
    const refresh = sessao?.refreshToken;
    limparSessao();
    if (refresh) {
      // revoga no servidor; se falhar, a sessão local já foi apagada de qualquer jeito
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ refreshToken: refresh }),
      }).catch(() => {});
    }
  },
  // senha: obrigatória para quem entra com e-mail e senha (quem entra pelo Google não tem)
  excluirFamilia: (confirmacao, senha) => post("/api/familia/excluir", { confirmacao, senha: senha || undefined }),
};

// ---------- dados do responsável ----------
export const api = {
  resumoPainel: () => get("/api/familia/painel/resumo"),
  filhos: () => get("/api/familia/filhos"),
  criarFilho: (dados) => post("/api/familia/filhos", dados),
  atualizarFilho: (id, dados) => put(`/api/familia/filhos/${id}`, dados),
  desativarFilho: (id) => del(`/api/familia/filhos/${id}`),
  definirChavePix: (filhoId, tipo, chave) => put(`/api/familia/filhos/${filhoId}/chave-pix`, { tipo, chave }),

  ocorrencias: (filtro) => get("/api/ocorrencias", { parametros: filtro }),
  aprovar: (id) => post(`/api/ocorrencias/${id}/aprovar`),
  recusar: (id, motivo) => post(`/api/ocorrencias/${id}/recusar`, { motivo }),

  saques: (status) => get("/api/familia/saques", { parametros: { status } }),
  confirmarPagamento: (id) => post(`/api/familia/saques/${id}/confirmar-pagamento`),
  cancelarSaque: (id) => post(`/api/familia/saques/${id}/cancelar`),

  tarefas: (filhoId) => get(`/api/familia/filhos/${filhoId}/tarefas`),
  tarefa: (filhoId, id) => get(`/api/familia/filhos/${filhoId}/tarefas/${id}`),
  criarTarefa: (filhoId, dados) => post(`/api/familia/filhos/${filhoId}/tarefas`, dados),
  atualizarTarefa: (filhoId, id, dados) => put(`/api/familia/filhos/${filhoId}/tarefas/${id}`, dados),
  pausarTarefa: (filhoId, id) => del(`/api/familia/filhos/${filhoId}/tarefas/${id}`),
  reativarTarefa: (filhoId, id) => post(`/api/familia/filhos/${filhoId}/tarefas/${id}/reativar`),
  excluirTarefa: (filhoId, id) => del(`/api/familia/filhos/${filhoId}/tarefas/${id}/excluir`),

  aplicarCastigo: (filhoId, valor, motivo) => post(`/api/familia/filhos/${filhoId}/castigos`, { valor, motivo }),
  regras: () => get("/api/familia/regras-castigo"),
  regra: (id) => get(`/api/familia/regras-castigo/${id}`),
  criarRegra: (dados) => post("/api/familia/regras-castigo", dados),
  atualizarRegra: (id, dados) => put(`/api/familia/regras-castigo/${id}`, dados),
  desativarRegra: (id) => del(`/api/familia/regras-castigo/${id}`),
  reativarRegra: (id) => post(`/api/familia/regras-castigo/${id}/reativar`),

  metas: (filhoId) => get("/api/metas", { parametros: { filhoId } }),
  criarMeta: (filhoId, dados) => post("/api/metas", { ...dados, filhoId }),
  atualizarMeta: (id, dados) => put(`/api/metas/${id}`, dados),
  excluirMeta: (id) => del(`/api/metas/${id}`),
  guardarNaMeta: (id, valor) => post(`/api/metas/${id}/guardar`, { valor }),
  tirarDaMeta: (id, valor) => post(`/api/metas/${id}/tirar`, { valor }),
  concluirMeta: (id, darBonus) => post(`/api/metas/${id}/concluir`, { darBonus }),
  movimentacoesMeta: (id) => get(`/api/metas/${id}/movimentacoes`),

  perfil: () => get("/api/perfil"),

  // pai e mãe na mesma família (só o titular convida e remove)
  responsaveis: () => get("/api/familia/responsaveis"),
  convidarResponsavel: (email) => post("/api/familia/responsaveis/convites", { email }),
  cancelarConvite: (id) => del(`/api/familia/responsaveis/convites/${id}`),
  removerResponsavel: (id) => del(`/api/familia/responsaveis/${id}`),

  // administração (só o e-mail de Admin:Emails no servidor; os outros recebem 403)
  souAdmin: () => get("/api/admin/eu"),
  afiliados: () => get("/api/admin/afiliados"),
  criarAfiliado: (dados) => post("/api/admin/afiliados", dados),
  definirAfiliadoAtivo: (id, ativo) => put(`/api/admin/afiliados/${id}/ativo`, { ativo }),
  cupons: () => get("/api/admin/cupons"),
  criarCupom: (codigo, percentual, limiteUsos, validoAte) => post("/api/admin/cupons", { codigo, percentual, limiteUsos: limiteUsos ?? undefined, validoAte: validoAte ?? undefined }),
  definirCupomAtivo: (id, ativo) => put(`/api/admin/cupons/${id}/ativo`, { ativo }),
  atualizarFoto: (fotoUrl) => put("/api/perfil/foto", { fotoUrl }),
};

export async function carregarPerfilGuardado() {
  try {
    perfilGuardado.dados = await get("/api/perfil");
  } catch {
    perfilGuardado.dados = null; // o topo mostra a inicial do nome
  }
  return perfilGuardado.dados;
}

// ---------- fotos (direto para o Cloudinary, preset "unsigned", igual ao app) ----------
// Fotos grandes são reduzidas antes (lado maior 1600 px, JPEG): sobe mais rápido e cabe no limite.
async function reduzirFoto(arquivo) {
  if (!arquivo.type.startsWith("image/") || arquivo.type === "image/gif") return arquivo;
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.75));
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}

// Fotos novas vão direto para o Cloudflare R2: a API devolve uma URL de envio curta (PUT) e a chave "r2:...".
// Se o servidor ainda não tem o R2, é antigo, ou o navegador for barrado (falta o CORS do bucket para este
// site), cai no Cloudinary como antes, para o painel não parar.
export async function enviarFoto(arquivo) {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (foto).");
  const imagem = await reduzirFoto(arquivo);
  if (["image/jpeg", "image/png", "image/webp"].includes(imagem.type)) {
    try {
      const pedido = await post("/api/midia/foto/envio", { tamanhoBytes: imagem.size, contentType: imagem.type });
      if (pedido && !pedido.usarCloudinary && pedido.urlEnvio && pedido.midia) {
        const resposta = await fetch(pedido.urlEnvio, { method: "PUT", headers: { "Content-Type": pedido.contentType ?? imagem.type }, body: imagem });
        if (resposta.ok) {
          registrarPrevia(pedido.midia, URL.createObjectURL(imagem));
          return pedido.midia;
        }
      }
    } catch {
      // segue para o Cloudinary
    }
  }
  return enviarFotoCloudinary(arquivo);
}

async function enviarFotoCloudinary(arquivo) {
  const dados = new FormData();
  dados.append("file", await reduzirFoto(arquivo), "foto.jpg");
  // O servidor assina o envio (só para quem está logado) e a foto vai para a pasta da família. Se o servidor
  // ainda não assina, cai no preset sem assinatura de antes.
  let assinatura = null;
  try {
    const a = await post("/api/midia/cloudinary/assinatura");
    if (a?.assinado && a.cloudName && a.apiKey && a.timestamp && a.pasta && a.assinatura) assinatura = a;
  } catch {
    assinatura = null;
  }
  if (assinatura) {
    dados.append("api_key", assinatura.apiKey);
    dados.append("timestamp", String(assinatura.timestamp));
    dados.append("folder", assinatura.pasta);
    dados.append("signature", assinatura.assinatura);
  } else {
    dados.append("upload_preset", CLOUDINARY_PRESET);
  }
  const conta = assinatura?.cloudName ?? CLOUDINARY_CLOUD;
  if (!/^[A-Za-z0-9_-]+$/.test(conta)) throw new Error("Não foi possível enviar a foto. Tente novamente.");
  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${conta}/image/upload`, { method: "POST", body: dados });
  if (!resposta.ok) {
    let detalhe;
    try {
      detalhe = (await resposta.json())?.error?.message;
    } catch {
      detalhe = undefined;
    }
    throw new Error(detalhe ? `Não foi possível enviar a foto: ${detalhe}` : "Não foi possível enviar a foto. Tente novamente.");
  }
  return (await resposta.json()).secure_url;
}
