// "Duplicar para outro filho": monta o pedido de criar tarefa a partir de uma tarefa que já existe
// (mesmas regras do app: mobile/src/tarefas/duplicar.ts). A cópia começa HOJE e leva o resto igual.

export function copiaDaTarefa(t, hojeIso) {
  const janela = t.prazoTipo !== "HorarioFixoNoDia";
  return {
    titulo: t.titulo,
    descricao: t.descricao ?? null,
    valorPadrao: t.valorPadrao,
    minutosTela: t.minutosTela ?? 0,
    frequencia: t.frequencia,
    diasDaSemana: t.frequencia === "DiasDaSemana" ? t.diasDaSemana : 0,
    dataInicio: hojeIso,
    dataFim: null, // o fim da original não vale para a cópia
    prazoTipo: t.prazoTipo,
    prazoHorario: t.prazoTipo === "HorarioFixoNoDia" ? t.prazoHorario : null,
    prazoQuantidade: janela ? t.prazoQuantidade : null,
    horarioInicio: janela ? t.horarioInicio : null,
    tiposComprovacaoAceitos: t.tiposComprovacaoAceitos,
    imagemUrl: t.imagemUrl,
  };
}

/** Os outros filhos ativos. */
export const destinosDaCopia = (filhos, filhoIdOrigem) => filhos.filter((f) => f.ativo && f.usuarioId !== filhoIdOrigem);

/** A cópia só rende o que o filho de destino pode ganhar: dinheiro, tempo de tela ou os dois. */
export function recompensaCompativel(t, destino) {
  const tipo = destino.tipoRecompensa ?? "Dinheiro";
  const minutos = t.minutosTela ?? 0;
  if (tipo === "Dinheiro") return t.valorPadrao > 0;
  if (tipo === "TempoDeTela") return minutos > 0;
  return t.valorPadrao > 0 || minutos > 0;
}
