import type { Doc } from '@/types/campus';
export const samples: Doc[] = [
  {
    id: 'manual',
    title: 'Manual do estudante 2026',
    category: 'Vida acadêmica',
    pages: 3,
    updated: '2026-10-02',
    status: 'ready',
    chunks: [
      {
        page: 1,
        text: 'Para solicitar a segunda via de um documento, acesse o Portal do Aluno e selecione Serviços > Documentos > Segunda via. Escolha o documento e confirme o pedido. O prazo de atendimento neste exemplo é de cinco dias úteis.',
      },
      {
        page: 2,
        text: 'O histórico escolar pode ser solicitado no Portal do Aluno, em Serviços > Documentos > Histórico escolar. Confira seus dados antes de concluir a solicitação.',
      },
      {
        page: 3,
        text: 'Para atualizar os dados cadastrais, acesse Perfil > Dados pessoais no Portal do Aluno. A alteração de nome exige a apresentação de documento comprobatório à secretaria.',
      },
    ],
  },
  {
    id: 'hours',
    title: 'Atividades complementares',
    category: 'Regulamentos',
    pages: 2,
    updated: '2026-10-02',
    status: 'ready',
    chunks: [
      {
        page: 1,
        text: 'As horas de atividades complementares podem ser obtidas com cursos, palestras, eventos, monitoria e projetos de extensão. A carga horária exigida deve ser consultada no projeto pedagógico do curso.',
      },
      {
        page: 2,
        text: 'Para registrar as horas complementares, envie o certificado com nome, data e carga horária no Portal do Aluno, em Atividades complementares. O coordenador analisará a documentação e validará as horas.',
      },
    ],
  },
  {
    id: 'internship',
    title: 'Guia de estágio obrigatório',
    category: 'Carreira e estágio',
    pages: 2,
    updated: '2026-10-02',
    status: 'ready',
    chunks: [
      {
        page: 1,
        text: 'O estágio obrigatório exige termo de compromisso assinado pelo estudante, pela instituição e pela empresa concedente. Antes de iniciar o estágio, solicite a aprovação do orientador e confira os pré-requisitos do seu curso.',
      },
      {
        page: 2,
        text: 'Os relatórios de estágio devem descrever as atividades realizadas, a carga horária cumprida e a avaliação do supervisor. Entregue os relatórios ao professor orientador pelo ambiente acadêmico.',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendário acadêmico — exemplo',
    category: 'Calendários',
    pages: 1,
    updated: '2026-10-02',
    status: 'ready',
    chunks: [
      {
        page: 1,
        text: 'Neste calendário fictício, a rematrícula do primeiro semestre de 2027 ocorre de 4 a 22 de janeiro de 2027. As aulas começam em 8 de fevereiro de 2027. Para datas oficiais, consulte o calendário da sua instituição.',
      },
    ],
  },
];
