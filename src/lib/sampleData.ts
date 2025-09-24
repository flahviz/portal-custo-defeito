import { Defect } from "@/types/defect";

export const sampleDefects: Defect[] = [
  {
    id: "sample-1",
    titulo: "Bug no login de usuários",
    horasTotais: 37,
    severidade: "alta",
    percepcaoImpacto: "frustracao",
    ambienteEncontrado: "producao",
    modulo: "Autenticação",
    horasPorCargo: [
      {
        roleId: "dev-senior",
        roleName: "Desenvolvedor",
        roleLevel: "senior",
        hours: 34,
        custoHora: 85.23
      },
      {
        roleId: "po-senior",
        roleName: "Product Owner",
        roleLevel: "senior", 
        hours: 3,
        custoHora: 93.75
      }
    ],
    custoTecnico: 3181.07,
    custoPago: 3181.07,
    custoComImpacto: 3817.28,
    custoPorFase: {
      desenvolvimento: 106.04,
      teste: 530.18,
      homologacao: 1060.36,
      producao: 3181.07
    },
    economias: {
      desenvolvimento: 3075.03,
      teste: 2650.89,
      homologacao: 2120.71
    },
    economiaPotencial: 3075.03,
    createdAt: new Date('2024-09-15T10:00:00Z')
  },
  {
    id: "sample-2", 
    titulo: "Erro no processamento de pagamentos",
    horasTotais: 28,
    severidade: "critica",
    percepcaoImpacto: "reputacional",
    ambienteEncontrado: "teste",
    modulo: "Pagamentos",
    horasPorCargo: [
      {
        roleId: "dev-pleno",
        roleName: "Desenvolvedor",
        roleLevel: "pleno",
        hours: 20,
        custoHora: 48.30
      },
      {
        roleId: "qa-senior",
        roleName: "QA",
        roleLevel: "senior",
        hours: 6,
        custoHora: 71.02
      },
      {
        roleId: "po-pleno",
        roleName: "Product Owner", 
        roleLevel: "pleno",
        hours: 2,
        custoHora: 56.82
      }
    ],
    custoTecnico: 1405.76,
    custoPago: 1405.76,
    custoComImpacto: 9137.44,
    custoPorFase: {
      desenvolvimento: 1405.76,
      teste: 7028.8,
      homologacao: 14057.6,
      producao: 42172.8
    },
    economias: {
      desenvolvimento: 5623.04
    },
    economiaPotencial: 5623.04,
    createdAt: new Date('2024-09-20T15:30:00Z')
  },
  {
    id: "sample-3",
    titulo: "Interface não responsiva em mobile",
    horasTotais: 15,
    severidade: "media",
    percepcaoImpacto: "irritacao_leve", 
    ambienteEncontrado: "homologacao",
    modulo: "Interface",
    horasPorCargo: [
      {
        roleId: "dev-junior",
        roleName: "Desenvolvedor",
        roleLevel: "junior",
        hours: 12,
        custoHora: 28.41
      },
      {
        roleId: "qa-pleno",
        roleName: "QA",
        roleLevel: "pleno",
        hours: 3,
        custoHora: 42.61
      }
    ],
    custoTecnico: 468.75,
    custoPago: 468.75,
    custoComImpacto: 5156.25,
    custoPorFase: {
      desenvolvimento: 468.75,
      teste: 2343.75,
      homologacao: 4687.5,
      producao: 14062.5
    },
    economias: {
      desenvolvimento: 4218.75,
      teste: 2343.75
    },
    economiaPotencial: 4218.75,
    createdAt: new Date('2024-09-18T09:15:00Z')
  }
];