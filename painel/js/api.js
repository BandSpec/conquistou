// Conversa com a API oficial do Conquistou e guarda a sessão do responsável neste navegador.
//
// Onde fica cada token:
// - access token (vale 30 min): só na memória da página. Some ao fechar ou recarregar.
// - refresh token (vale 30 dias, troca a cada uso): sessionStorage (some ao fechar a aba) ou,
//   se a pessoa marcar "Manter conectado", localStorage. Sair revoga o token no servidor.
// Nada de cookie (a API é outro domínio). A página só roda scripts dela mesma (ver CSP no index.html).

const API_OFICIAL = "https://conquistou-production.up.railway.app";
// No computador do desenvolvedor (localhost) a página fala com a API simulada servida no mesmo endereço.
const LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
export const API_URL = LOCAL ? location.origin : API_OFICIAL;

export const CLOUDINARY_CLOUD = "wjrfphjs";
export const CLOUDINARY_PRESET = "combinado_comprovantes";

const CHAVE = "conquistou.painel.sessao";

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

// ---------- autenticação ----------
export const auth = {
  entrar: (email, senha) => post("/api/auth/login", { email, senha }, { publico: true, padrao: "E-mail ou senha incorretos." }),
  registrar: (dados) => post("/api/auth/registrar", dados, { publico: true }),
  iniciarGoogle: (retorno) => get("/api/auth/google/iniciar", { parametros: { appRedirect: retorno }, publico: true }),
  trocarGoogle: (handoff) => post("/api/auth/google/trocar", { handoff }, { publico: true, padrao: "Login com Google expirado. Tente novamente." }),
  aceitarTermos: () => post("/api/auth/aceitar-termos"),
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
  excluirFamilia: (confirmacao) => post("/api/familia/excluir", { confirmacao }),
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
  atualizarFoto: (fotoUrl) => put("/api/perfil/foto", { fotoUrl }),
};

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

export async function enviarFoto(arquivo) {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (foto).");
  const dados = new FormData();
  dados.append("file", await reduzirFoto(arquivo), "foto.jpg");
  dados.append("upload_preset", CLOUDINARY_PRESET);
  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: dados });
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
