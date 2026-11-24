// Central de ajuda da Área do responsável: assuntos que abrem em perguntas, e cada pergunta abre um passo a passo.
// Os mesmos assuntos do app (mobile/src/ajuda/topicos.ts), com os passos do que se faz AQUI, pelo computador.
// O que só existe no app (celular do filho, tempo de tela, assinatura...) está no último assunto.

export const TOPICOS_SITE = [
  {
    id: "comecar",
    titulo: "Primeiros passos",
    perguntas: [
      {
        pergunta: "Como cadastrar um filho?",
        passos: [
          "No Painel, clique em \"Cadastrar filho\".",
          "Escreva o nome do filho e, se quiser, a data de nascimento.",
          "Escolha o tipo de acesso: \"PIN\" (para crianças, entram só com 4 a 6 números) ou \"Conta própria\" (e-mail e senha, para adolescentes).",
          "Escolha a frequência de saque da mesada.",
          "Clique em Cadastrar.",
        ],
        dica: "Criança pequena: use o PIN. Escolha um número fácil de lembrar, mas que os irmãos não adivinhem.",
      },
      {
        pergunta: "Como convidar o pai ou a mãe para cuidar junto?",
        passos: [
          "Clique na sua foto, no alto da página, e depois em \"Responsáveis da família\".",
          "Digite o e-mail da outra pessoa e clique em \"Enviar convite\".",
          "Ela recebe um e-mail com um código de 8 letras e números. O código vale por 48 horas.",
          "Ela entra em \"Entrar na família\" (no app ou nesta página), com a conta Google desse e-mail ou digitando o código.",
        ],
        dica: "Só quem criou a conta da família (o titular) convida e remove responsáveis. A família pode ter até 2 responsáveis (pai e mãe). O e-mail do convite não pode ter uma conta no Conquistou ainda, nem ser de um filho.",
      },
      {
        pergunta: "Recebi um convite por e-mail. Como entro na família?",
        passos: [
          "Abra a Área do responsável e clique em \"Recebeu um convite? Entrar na família\".",
          "Mais fácil: clique em \"Continuar com Google\" e escolha a conta Google que recebeu o convite. Sem senha e sem código.",
          "Ou digite o e-mail em que o convite chegou e o código de 8 letras e números, escreva o seu nome, crie uma senha, aceite os termos e clique em \"Entrar na família\".",
          "Pronto: você vê os mesmos filhos e tarefas e pode aprovar, criar tarefas e pagar a mesada.",
        ],
        dica: "O código vale por 48 horas. Se venceu, peça outro a quem convidou.",
      },
      {
        pergunta: "Meu filho tem e-mail e senha. Preciso configurar o celular dele?",
        passos: [
          "Não precisa. Filho com conta própria não usa o pareamento.",
          "No celular dele, abra o app Conquistou e toque em \"Entrar com e-mail\".",
          "Ele digita o e-mail e a senha que você cadastrou.",
        ],
      },
    ],
  },
  {
    id: "tarefas",
    titulo: "Tarefas",
    perguntas: [
      {
        pergunta: "Como criar uma tarefa?",
        passos: [
          "Abra a aba Tarefas, escolha o filho e clique em \"Nova tarefa\".",
          "1. O quê: clique numa sugestão pronta (ex: \"Arrumar a cama\") ou escreva o nome. Escolha a imagem e quanto a tarefa rende.",
          "2. Quando: escolha se é todo dia, em dias da semana ou uma vez só.",
          "Em \"Até quando o filho pode fazer?\", escolha \"Até um horário\" (ex: até as 20h), \"Numa janela\" (ex: das 8h às 12h) ou \"Alguns dias\" (ex: 3 dias para arrumar o quarto).",
          "3. Prova: marque foto, áudio e/ou vídeo.",
          "Leia a frase no fim da página (ex: \"Julia faz isto todos os dias, até as 20h...\"). Se estiver certa, clique em \"Criar tarefa\".",
        ],
        dica: "Os horários são sempre no horário de Brasília. Para mudar a data em que a tarefa começa, abra \"Mais opções\".",
      },
      {
        pergunta: "Para que serve a imagem da tarefa?",
        passos: [
          "Ao criar ou editar a tarefa, use \"Enviar foto\" ou escolha um ícone.",
          "Tire uma foto do \"antes\" (ex: louça suja) ou escolha um ícone pronto.",
          "O filho vê a imagem grande na lista do dia, o que ajuda quem ainda não sabe ler.",
          "Na hora de aprovar, você vê o \"antes\" (imagem) e o \"depois\" (comprovante) lado a lado.",
        ],
      },
      {
        pergunta: "Como editar, pausar ou excluir uma tarefa?",
        passos: [
          "Abra a aba Tarefas, escolha o filho e clique na tarefa.",
          "Para mudar algo, altere os campos e clique em Salvar.",
          "Para parar por um tempo, use \"Pausar tarefa\". Dá para \"Reativar\" depois e o histórico fica guardado.",
          "Para apagar de vez, use \"Excluir tarefa\". Isso apaga também as tarefas do dia e as aprovações dela. O dinheiro que já entrou no saldo continua.",
        ],
      },
    ],
  },
  {
    id: "aprovacoes",
    titulo: "Aprovações",
    perguntas: [
      {
        pergunta: "Como aprovar uma tarefa?",
        passos: [
          "Abra a aba Aprovações. Os pedidos novos ficam em \"Pendentes\".",
          "Clique em \"Ver comprovante\" para ver a foto, ouvir o áudio ou assistir ao vídeo.",
          "Se estiver certo, clique em Aprovar.",
          "O valor entra no saldo do filho na hora, e ele recebe um aviso.",
        ],
      },
      {
        pergunta: "Como recusar e explicar o motivo?",
        passos: [
          "Na aba Aprovações, abra o pedido pendente.",
          "Clique em Recusar.",
          "Escreva o motivo em \"Por que recusar?\" (o filho vai ler).",
          "Clique em \"Confirmar recusa\".",
          "O saldo não muda. Se ainda der tempo, o filho pode mandar outro comprovante.",
        ],
      },
      {
        pergunta: "Onde vejo o que já aprovei ou recusei?",
        passos: ["Abra a aba Aprovações.", "No filtro do alto, escolha \"Aprovadas\" ou \"Recusadas\"."],
      },
    ],
  },
  {
    id: "mesada",
    titulo: "Mesada e PIX",
    perguntas: [
      {
        pergunta: "Meu filho pediu a mesada. Como pago?",
        passos: [
          "Abra a aba Aprovações e procure a seção \"Mesadas para pagar\".",
          "Pague pelo app do seu banco: leia o QR Code com o celular ou use \"Copiar código PIX (copia e cola)\".",
          "No banco, confira o nome do dono da chave antes de confirmar.",
          "Volte aqui e clique em \"Já paguei\". Só nesse momento o saldo do filho baixa.",
        ],
        dica: "O Conquistou não move dinheiro. Quem paga é o seu banco.",
      },
      {
        pergunta: "Como cadastrar ou trocar a chave PIX do filho?",
        passos: [
          "No Painel, clique no filho e abra \"Editar filho\".",
          "Preencha ou troque a chave PIX e salve.",
          "O próprio filho também pode cadastrar a chave na tela \"Pedir mesada\", no app.",
        ],
      },
      {
        pergunta: "Posso cancelar um pedido de mesada?",
        passos: [
          "Abra a aba Aprovações e vá em \"Mesadas para pagar\".",
          "Clique em \"Cancelar pedido\".",
          "Nada muda no saldo e o filho recebe um aviso.",
        ],
      },
    ],
  },
  {
    id: "castigos",
    titulo: "Castigos",
    perguntas: [
      {
        pergunta: "Como aplicar um desconto na mesada?",
        passos: ["Abra a aba Castigos.", "Preencha o motivo e o valor.", "Escolha quem recebe o desconto.", "Clique em Aplicar."],
        dica: "O saldo pode ficar negativo.",
      },
      {
        pergunta: "Como criar uma regra automática?",
        passos: [
          "Na aba Castigos, abra as regras automáticas.",
          "Clique para criar uma nova regra.",
          "Defina: quantas tarefas não cumpridas, em quantos dias, e quanto desconta.",
          "Salve. Quando o filho chegar nesse número, o desconto é aplicado sozinho.",
        ],
        dica: "Uma mesma falta não é punida duas vezes pela mesma regra.",
      },
    ],
  },
  {
    id: "metas",
    titulo: "Metas",
    perguntas: [
      {
        pergunta: "O que são as metas do meu filho?",
        passos: [
          "Meta é algo que o filho quer conquistar (ex: uma bicicleta), com nome e preço.",
          "Ele acompanha o quanto já juntou.",
          "No modo \"Só a meta\", o dinheiro das tarefas vai direto para a meta. No modo \"Cofrinhos\", ele escolhe quanto guardar em cada uma.",
        ],
      },
      {
        pergunta: "Como mudar o modo das metas?",
        passos: ["No Painel, clique no filho e abra \"Editar filho\".", "Escolha o modo das metas.", "Clique em Salvar."],
        dica: "Para voltar ao modo \"Só a meta\", o filho precisa ter uma meta ativa só.",
      },
    ],
  },
  {
    id: "conta",
    titulo: "Conta da família",
    perguntas: [
      {
        pergunta: "Como trocar a minha foto ou avatar?",
        passos: [
          "Clique na sua foto, no alto da página.",
          "Clique em \"Trocar foto ou avatar\".",
          "Escolha um avatar, ou clique em \"Enviar uma foto\".",
          "Clique em \"Salvar foto\". A foto nova aparece no topo.",
        ],
      },
      {
        pergunta: "Esqueci a senha. O que faço?",
        passos: [
          "Na tela de entrar, clique em \"Esqueci a senha\".",
          "Informe o e-mail da conta. Mandamos um código de 6 números.",
          "Digite o código e crie a senha nova. O código vale por 15 minutos.",
        ],
      },
      {
        pergunta: "Como excluir a conta da família?",
        passos: [
          "Clique na sua foto e depois em \"Excluir conta da família\".",
          "Leia o aviso e siga as instruções da página.",
          "Atenção: isso apaga os dados da família e não tem volta.",
        ],
        dica: "Só o titular, quem criou a conta da família, pode excluí-la.",
      },
    ],
  },
  {
    id: "so-app",
    titulo: "Só no app do celular",
    perguntas: [
      {
        pergunta: "Como deixar o celular do meu filho pronto para ele usar?",
        passos: [
          "No celular do filho, abra o app Conquistou e toque em \"Configurar o aparelho\".",
          "Entre com o seu e-mail e senha. Isso é temporário: a sua conta não fica salva nesse celular.",
          "Escolha qual filho vai usar o aparelho.",
          "Pronto: daqui em diante ele entra só com o PIN dele.",
        ],
        dica: "Irmãos podem dividir o mesmo celular. Use \"Configurar outro filho\" para cada um.",
      },
      {
        pergunta: "Como bloquear apps e dar tempo de tela?",
        passos: [
          "No app, abra a aba \"Tela\" e toque no filho.",
          "Marque os apps que só abrem quando o filho ativa o tempo de tela.",
          "Em \"Editar filho\", escolha que as tarefas rendem dinheiro, tempo ou os dois.",
        ],
        dica: "O bloqueio funciona só em celulares Android e o celular do filho precisa estar configurado.",
      },
      {
        pergunta: "Como ver o app do jeito que meu filho vê?",
        passos: [
          "No app, no Painel, toque no ícone \"Ver como filho\" do cartão dele.",
          "Para sair, abra o Perfil e toque em \"Voltar ao Modo Responsável\".",
        ],
      },
      {
        pergunta: "Como ver ou assinar um plano, ou trocar a senha?",
        passos: [
          "No app, abra o seu Perfil.",
          "Toque em \"Minha assinatura\" para ver ou assinar um plano, ou em \"Senha e segurança\" para trocar a senha.",
        ],
      },
    ],
  },
];

function semAcento(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Busca simples: ignora acento e maiúscula; procura na pergunta, nos passos, na dica e no nome do assunto. */
export function filtrarTopicos(topicos, busca) {
  const termo = semAcento(String(busca ?? "").trim());
  if (!termo) return topicos;
  return topicos
    .map((t) => ({
      ...t,
      perguntas: t.perguntas.filter((p) => semAcento([t.titulo, p.pergunta, ...p.passos, p.dica ?? ""].join(" ")).includes(termo)),
    }))
    .filter((t) => t.perguntas.length > 0);
}
