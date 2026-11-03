// Navegação pelo "#" do endereço (ex.: /painel/#/aprovacoes). Funciona no GitHub Pages sem
// configurar nada no servidor, e o botão Voltar do navegador funciona normalmente.

export function rotaAtual() {
  const bruto = location.hash.replace(/^#/, "") || "/";
  const [caminho, consulta = ""] = bruto.split("?");
  return { caminho: caminho || "/", busca: new URLSearchParams(consulta) };
}

export function ir(caminho, { substituir = false } = {}) {
  const novo = `#${caminho}`;
  if (location.hash === novo) {
    window.dispatchEvent(new HashChangeEvent("hashchange")); // mesma rota: redesenha
  } else if (substituir) {
    history.replaceState(null, "", novo);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    location.hash = novo;
  }
}

/** Confere "/metas/:filhoId/:metaId" contra "/metas/abc/def" → { filhoId: "abc", metaId: "def" } */
export function casar(modelo, caminho) {
  const a = modelo.split("/").filter(Boolean);
  const b = caminho.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
