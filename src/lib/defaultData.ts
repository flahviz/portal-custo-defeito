import { SystemConfig } from "@/types/defect";

export const defaultSystemConfig: SystemConfig = {
  workSettings: {
    horasPorDia: 8,
    diasPorMes: 22
  },
  jobRoles: [
    // Desenvolvedores
    {
      id: "dev-junior",
      name: "Desenvolvedor",
      level: "junior",
      category: "desenvolvedor",
      salarioMinimo: 4000,
      salarioMaximo: 6000,
      mediaMercado: 5000,
      custoHora: 28.41
    },
    {
      id: "dev-pleno",
      name: "Desenvolvedor",
      level: "pleno", 
      category: "desenvolvedor",
      salarioMinimo: 7000,
      salarioMaximo: 10000,
      mediaMercado: 8500,
      custoHora: 48.30
    },
    {
      id: "dev-senior",
      name: "Desenvolvedor",
      level: "senior",
      category: "desenvolvedor", 
      salarioMinimo: 12000,
      salarioMaximo: 18000,
      mediaMercado: 15000,
      custoHora: 85.23
    },
    // QAs
    {
      id: "qa-junior",
      name: "QA",
      level: "junior",
      category: "qa",
      salarioMinimo: 3500,
      salarioMaximo: 5500,
      mediaMercado: 4500,
      custoHora: 25.57
    },
    {
      id: "qa-pleno", 
      name: "QA",
      level: "pleno",
      category: "qa",
      salarioMinimo: 6000,
      salarioMaximo: 9000,
      mediaMercado: 7500,
      custoHora: 42.61
    },
    {
      id: "qa-senior",
      name: "QA", 
      level: "senior",
      category: "qa",
      salarioMinimo: 10000,
      salarioMaximo: 15000,
      mediaMercado: 12500,
      custoHora: 71.02
    },
    // Product Owners
    {
      id: "po-junior",
      name: "Product Owner",
      level: "junior",
      category: "po",
      salarioMinimo: 5000,
      salarioMaximo: 8000,
      mediaMercado: 6500,
      custoHora: 36.93
    },
    {
      id: "po-pleno",
      name: "Product Owner",
      level: "pleno", 
      category: "po",
      salarioMinimo: 8000,
      salarioMaximo: 12000,
      mediaMercado: 10000,
      custoHora: 56.82
    },
    {
      id: "po-senior",
      name: "Product Owner",
      level: "senior",
      category: "po", 
      salarioMinimo: 13000,
      salarioMaximo: 20000,
      mediaMercado: 16500,
      custoHora: 93.75
    },
    // Suporte
    {
      id: "suporte-junior",
      name: "Suporte",
      level: "junior",
      category: "suporte",
      salarioMinimo: 3000,
      salarioMaximo: 4500,
      mediaMercado: 3750,
      custoHora: 21.31
    },
    {
      id: "suporte-pleno",
      name: "Suporte", 
      level: "pleno",
      category: "suporte",
      salarioMinimo: 4500,
      salarioMaximo: 7000,
      mediaMercado: 5750,
      custoHora: 32.67
    },
    {
      id: "suporte-senior",
      name: "Suporte",
      level: "senior",
      category: "suporte",
      salarioMinimo: 7000,
      salarioMaximo: 12000,
      mediaMercado: 9500,
      custoHora: 53.98
    }
  ],
  phaseMultipliers: {
    desenvolvimento: 1,
    teste: 5,
    homologacao: 10,
    producao: 30
  },
  impactMultipliers: {
    sem_impacto: 0,
    irritacao_leve: 1.1,
    frustracao: 1.2,
    reputacional: 1.3
  }
};

export function calculateCostPerHour(salary: number, hoursPerDay: number, daysPerMonth: number): number {
  return salary / (hoursPerDay * daysPerMonth);
}