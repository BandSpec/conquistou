// "Quando" e "prazo" da tela Nova tarefa, sem tocar na página (mesmas regras do app: mobile/src/tarefas/prazo.ts).
// O servidor guarda o prazo em 3 modos técnicos (PrazoTipo); a tela pergunta em português simples e converte aqui.
// Horários são textos "HH:mm", como o campo de hora do navegador devolve.

import { formatarReais } from "./ui.js";

const minutosDe = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const hhmmDe = (minutos) => {
  const dia = ((minutos % 1440) + 1440) % 1440;
  return `${String(Math.floor(dia / 60)).padStart(2, "0")}:${String(dia % 60).padStart(2, "0")}`;
};

/** "20:00" -> "20h"; "08:30" -> "8h30". */
export function descreverHora(hhmm) {
  const m = minutosDe(hhmm);
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto === 0 ? `${h}h` : `${h}h${String(resto).padStart(2, "0")}`;
}

/** Quantas horas a janela dura, de 1 a 24 (o servidor só aceita horas inteiras). Fim antes do início passa da meia-noite. */
export function horasDaJanela(inicio, fim) {
  let minutos = (minutosDe(fim) - minutosDe(inicio) + 1440) % 1440;
  if (minutos === 0) minutos = 1440;
  return Math.min(24, Math.max(1, Math.ceil(minutos / 60)));
}

/** O fim da janela: início + as horas inteiras. */
export const fimDaJanela = (inicio, horas) => hhmmDe(minutosDe(inicio) + horas * 60);

/** Converte a escolha da tela nos campos que o servidor guarda. quando: "AteHorario" | "Janela" | "AlgunsDias". */
export function montarPrazo({ quando, ateHorario, janelaInicio, janelaHoras, dias }) {
  if (quando === "AteHorario") return { prazoTipo: "HorarioFixoNoDia", prazoHorario: `${ateHorario}:00`, prazoQuantidade: null, horarioInicio: null };
  if (quando === "Janela") return { prazoTipo: "JanelaHoras", prazoHorario: null, prazoQuantidade: janelaHoras, horarioInicio: `${janelaInicio}:00` };
  // alguns dias: abre no começo do dia (00:00) e dá N dias para fazer
  return { prazoTipo: "JanelaDias", prazoHorario: null, prazoQuantidade: dias, horarioInicio: "00:00:00" };
}

const DIAS_CURTOS = [[1, "dom"], [2, "seg"], [4, "ter"], [8, "qua"], [16, "qui"], [32, "sex"], [64, "sáb"]];

const juntar = (itens) => (itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`);

function dataBr(iso) {
  const [a, m, d] = String(iso).split("-");
  return a && m && d ? `${d}/${m}/${a}` : "";
}

export function descreverFrequenciaEmFrase(frequencia, dias, dataInicio) {
  if (frequencia === "Diaria") return "todos os dias";
  if (frequencia === "Unica") return `uma vez, em ${dataBr(dataInicio)}`;
  const nomes = DIAS_CURTOS.filter(([v]) => dias & v).map(([, n]) => n);
  return nomes.length ? `nos dias ${juntar(nomes)}` : "(escolha os dias)";
}

export function descreverPrazoEmFrase({ quando, ateHorario, janelaInicio, janelaHoras, dias }) {
  if (quando === "AteHorario") return `até as ${descreverHora(ateHorario)}`;
  if (quando === "Janela") return `entre ${descreverHora(janelaInicio)} e ${descreverHora(fimDaJanela(janelaInicio, janelaHoras))}`;
  return dias === 1 ? "com 1 dia para fazer" : `com ${dias} dias para fazer`;
}

export function descreverProvaEmFrase(tipos) {
  const nomes = [];
  if (tipos & 1) nomes.push("foto");
  if (tipos & 2) nomes.push("áudio");
  if (tipos & 4) nomes.push("vídeo");
  if (nomes.length === 0) return "sem prova: o filho só marca como feita";
  return `prova por ${nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(", ")} ou ${nomes[nomes.length - 1]}`}`;
}

function descreverRecompensa(valor, minutos) {
  if (minutos > 0 && valor > 0) return `${formatarReais(valor)} + ${minutos} min`;
  if (minutos > 0) return `${minutos} min de tela`;
  return formatarReais(valor);
}

/** A frase do fim da tela: "Julia faz isto todos os dias, até as 20h. Ganha R$ 2,00; prova por foto." */
export function resumoDaTarefa(e) {
  const quando = `${descreverFrequenciaEmFrase(e.frequencia, e.diasDaSemana, e.dataInicio)}, ${descreverPrazoEmFrase(e)}`;
  const ganha = e.valor > 0 || e.minutos > 0 ? `Ganha ${descreverRecompensa(e.valor, e.minutos)}` : "Falta definir o que ela rende";
  return `${e.nomeDoFilho} faz isto ${quando}. ${ganha}; ${descreverProvaEmFrase(e.tiposComprovacao)}.`;
}

/** Atalhos para as tarefas que quase toda família cria (os mesmos do app). Só preenchem a tela. */
export const SUGESTOES_TAREFA = [
  { iconeId: "arrumar_a_cama", titulo: "Arrumar a cama", ateHora: "12:00" },
  { iconeId: "escovar_os_dentes", titulo: "Escovar os dentes", ateHora: "21:00" },
  { iconeId: "fazer_a_licao_de_casa", titulo: "Fazer a lição de casa", ateHora: "19:00" },
  { iconeId: "lavar_a_louca", titulo: "Lavar a louça", ateHora: "20:00" },
  { iconeId: "guardar_as_proprias_roupas", titulo: "Guardar as próprias roupas", ateHora: "20:00" },
  { iconeId: "ajudar_a_cuidar_do_pet", titulo: "Cuidar do pet", ateHora: "20:00" },
  { iconeId: "tomar_banho", titulo: "Tomar banho", ateHora: "20:00" },
  { iconeId: "ler_um_livro", titulo: "Ler um livro", ateHora: "21:00" },
];
