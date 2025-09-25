import { describe, it, expect } from 'vitest';
import { calculateDefectCosts, formatCurrency } from '../defectCalculations';
import { PhaseMultipliers, ImpactMultipliers, DefectHours } from '@/types/defect';

describe('defectCalculations', () => {
  const mockPhaseMultipliers: PhaseMultipliers = {
    desenvolvimento: 1,
    teste: 5,
    homologacao: 10,
    producao: 30,
  };

  const mockImpactMultipliers: ImpactMultipliers = {
    sem_impacto: 0,
    irritacao_leve: 1.1,
    frustracao: 1.2,
    reputacional: 1.3,
  };

  const mockHorasPorCargo: DefectHours[] = [
    {
      roleId: 'dev-senior',
      roleName: 'Desenvolvedor',
      roleLevel: 'senior',
      hours: 2,
      custoHora: 85.23,
    },
    {
      roleId: 'qa-pleno',
      roleName: 'QA',
      roleLevel: 'pleno',
      hours: 1,
      custoHora: 42.61,
    },
  ];

  describe('calculateDefectCosts', () => {
    it('calculates costs correctly for production environment', () => {
      const defectData = {
        titulo: 'Test Defect',
        horasTotais: 3,
        severidade: 'alta' as const,
        percepcaoImpacto: 'sem_impacto' as const,
        ambienteEncontrado: 'producao' as const,
        modulo: 'Test Module',
        horasPorCargo: mockHorasPorCargo,
      };

      const result = calculateDefectCosts(defectData, mockPhaseMultipliers, mockImpactMultipliers);

      // Custo base: (2 * 85.23) + (1 * 42.61) = 213.07
      const expectedCustoBase = 213.07;

      expect(result.custoTecnico).toBe(expectedCustoBase);
      expect(result.custoPago).toBe(expectedCustoBase);
      expect(result.custoComImpacto).toBe(0); // sem_impacto = 0

      // Economia potencial se fosse encontrado em desenvolvimento
      const custoDesenvolvimento = expectedCustoBase / 30; // 7.1023...
      expect(result.economiaPotencial).toBeCloseTo(expectedCustoBase - custoDesenvolvimento);
    });

    it('calculates costs correctly for development environment', () => {
      const defectData = {
        titulo: 'Test Defect',
        horasTotais: 3,
        severidade: 'media' as const,
        percepcaoImpacto: 'irritacao_leve' as const,
        ambienteEncontrado: 'desenvolvimento' as const,
        modulo: 'Test Module',
        horasPorCargo: mockHorasPorCargo,
      };

      const result = calculateDefectCosts(defectData, mockPhaseMultipliers, mockImpactMultipliers);

      const expectedCustoBase = 213.07;

      expect(result.custoTecnico).toBe(expectedCustoBase);
      expect(result.custoPago).toBe(expectedCustoBase);

      // Custo com impacto: custoBase * multiplicador_impacto
      // 213.07 * 1.1 = 234.377
      expect(result.custoComImpacto).toBeCloseTo(234.377);
    });

    it('handles empty hours array', () => {
      const defectData = {
        titulo: 'Test Defect',
        horasTotais: 0,
        severidade: 'baixa' as const,
        percepcaoImpacto: 'sem_impacto' as const,
        ambienteEncontrado: 'teste' as const,
        modulo: 'Test Module',
        horasPorCargo: [],
      };

      const result = calculateDefectCosts(defectData, mockPhaseMultipliers, mockImpactMultipliers);

      expect(result.custoTecnico).toBe(0);
      expect(result.custoPago).toBe(0);
      expect(result.custoComImpacto).toBe(0);
      expect(result.economiaPotencial).toBe(0);
    });

    it('applies impact multipliers correctly', () => {
      const defectData = {
        titulo: 'Test Defect',
        horasTotais: 2,
        severidade: 'alta' as const,
        percepcaoImpacto: 'reputacional' as const,
        ambienteEncontrado: 'homologacao' as const,
        modulo: 'Test Module',
        horasPorCargo: [
          {
            roleId: 'dev-senior',
            roleName: 'Desenvolvedor',
            roleLevel: 'senior',
            hours: 1,
            custoHora: 100,
          },
        ],
      };

      const result = calculateDefectCosts(defectData, mockPhaseMultipliers, mockImpactMultipliers);

      // Custo com impacto: 100 * 1.3 = 130
      expect(result.custoComImpacto).toBe(130);
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly for positive values', () => {
      expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
      expect(formatCurrency(1000)).toMatch(/R\$\s*1\.000,00/);
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });

    it('formats currency correctly for decimal values', () => {
      expect(formatCurrency(123.45)).toMatch(/R\$\s*123,45/);
      expect(formatCurrency(0.99)).toMatch(/R\$\s*0,99/);
    });

    it('handles large numbers', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toMatch(/R\$\s*1\.234\.567,89/);
    });
  });
});
