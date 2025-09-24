export interface JobRole {
  id: string;
  name: string;
  level: "junior" | "pleno" | "senior";
  category: "desenvolvedor" | "qa" | "po" | "suporte";
  salarioMinimo: number;
  salarioMaximo: number;
  mediaMercado: number;
  salarioPraticado?: number;
  custoHora: number;
}

export interface WorkSettings {
  horasPorDia: number;
  diasPorMes: number;
}

export interface PhaseMultipliers {
  desenvolvimento: number;
  teste: number;
  homologacao: number;
  producao: number;
}

export interface DefectHours {
  roleId: string;
  roleName: string;
  roleLevel: string;
  hours: number;
  custoHora: number;
}

export interface Defect {
  id: string;
  titulo: string;
  horasTotais?: number;
  severidade: "baixa" | "media" | "alta" | "critica";
  percepcaoImpacto: "sem_impacto" | "irritacao_leve" | "frustracao" | "reputacional";
  ambienteEncontrado: "desenvolvimento" | "teste" | "homologacao" | "producao";
  modulo: string;
  horasPorCargo: DefectHours[];
  custoTecnico: number;
  custoPago: number;
  custoComImpacto: number;
  custoPorFase: {
    desenvolvimento: number;
    teste: number;  
    homologacao: number;
    producao: number;
  };
  economias: {
    desenvolvimento?: number;
    teste?: number;
    homologacao?: number;
  };
  economiaPotencial: number;
  createdAt: Date;
}

export interface ImpactMultipliers {
  sem_impacto: number;
  irritacao_leve: number;
  frustracao: number;
  reputacional: number;
}

export interface SystemConfig {
  workSettings: WorkSettings;
  jobRoles: JobRole[];
  phaseMultipliers: PhaseMultipliers;
  impactMultipliers: ImpactMultipliers;
}