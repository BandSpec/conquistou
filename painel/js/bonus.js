// Bônus de tempo de tela (v3.9): funções simples, sem tela. Mesmas regras do app (mobile/src/utils/formatadores.ts).

/** 2700 -> "45 min", 3900 -> "1 h 05 min", 40 -> "40 s" */
export function formatarDuracao(segundos) {
  const s = Math.max(0, Math.round(segundos));
  if (s < 60) return `${s} s`;
  const minutos = Math.floor(s / 60);
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, "0")} min`;
}

/** "2026-11-28" -> "28/11" */
export function diaCurto(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** yyyy-MM-dd no calendário local. */
export function isoDoDia(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Próximo dia da semana (0 = domingo ... 6 = sábado), contando hoje. */
export function proximoDiaDaSemana(base, diaDaSemana) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + ((diaDaSemana - d.getDay() + 7) % 7));
  return d;
}

export const ATALHOS_BONUS = [30, 60, 120, 180, 240];

/** As escolhas de "vale até quando?": [id, texto, data (yyyy-MM-dd) ou null]. */
export function opcoesDeVencimento(hoje = new Date()) {
  return [
    ["hoje", "Só hoje", isoDoDia(hoje)],
    ["amanha", "Amanhã", isoDoDia(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1))],
    ["sabado", "Sábado", isoDoDia(proximoDiaDaSemana(hoje, 6))],
    ["domingo", "Domingo", isoDoDia(proximoDiaDaSemana(hoje, 0))],
    ["outro", "Outro dia", null],
    ["nunca", "Sem vencimento", null],
  ];
}

/** Minutos válidos (1 a 1440, inteiros) ou null. */
export function lerMinutos(texto) {
  const n = Number(String(texto).trim());
  return Number.isInteger(n) && n >= 1 && n <= 1440 ? n : null;
}
