// Fotos no R2: logo depois do envio o valor da tela é a chave "r2:fotos/...", que não é um endereço de
// imagem. Aqui fica "chave -> blob: da foto escolhida" só para a prévia. Depois de salvar, a tela recarrega
// do servidor e já vem o link temporário de leitura.
const previas = new Map();

export function registrarPrevia(chave, enderecoBlob) {
  previas.set(chave, enderecoBlob);
}

export function previaDe(chave) {
  return typeof chave === "string" ? previas.get(chave) ?? null : null;
}
