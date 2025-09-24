import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig, calculateCostPerHour } from '@/lib/defaultData';
import { formatCurrency } from '@/lib/defectCalculations';
import { SystemConfig, JobRole } from '@/types/defect';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Clock, 
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Configuration() {
  const { toast } = useToast();
  const [config, setConfig] = useLocalStorage<SystemConfig>('systemConfig', defaultSystemConfig);
  
  // Local state for editing
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);

  // Update work settings
  const updateWorkSettings = (field: keyof typeof localConfig.workSettings, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      workSettings: {
        ...prev.workSettings,
        [field]: value
      }
    }));
  };

  // Update job role
  const updateJobRole = (roleId: string, field: keyof JobRole, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      jobRoles: prev.jobRoles.map(role => {
        if (role.id === roleId) {
          const updatedRole = { ...role, [field]: value };
          
          // Recalculate cost per hour when salary changes
          if (field === 'salarioPraticado' || field === 'mediaMercado') {
            const salaryToUse = updatedRole.salarioPraticado || updatedRole.mediaMercado;
            updatedRole.custoHora = calculateCostPerHour(
              salaryToUse,
              prev.workSettings.horasPorDia,
              prev.workSettings.diasPorMes
            );
          }
          
          return updatedRole;
        }
        return role;
      })
    }));
  };

  // Update phase multipliers
  const updatePhaseMultiplier = (phase: keyof typeof localConfig.phaseMultipliers, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      phaseMultipliers: {
        ...prev.phaseMultipliers,
        [phase]: value
      }
    }));
  };

  // Save configuration
  const saveConfiguration = () => {
    // Recalculate all cost per hour values
    const updatedConfig = {
      ...localConfig,
      jobRoles: localConfig.jobRoles.map(role => ({
        ...role,
        custoHora: calculateCostPerHour(
          role.salarioPraticado || role.mediaMercado,
          localConfig.workSettings.horasPorDia,
          localConfig.workSettings.diasPorMes
        )
      }))
    };

    setConfig(updatedConfig);
    setLocalConfig(updatedConfig);
    
    toast({
      title: "Configurações salvas!",
      description: "Todas as configurações foram atualizadas com sucesso.",
    });
  };

  // Restore defaults
  const restoreDefaults = () => {
    setLocalConfig(defaultSystemConfig);
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações foram restauradas para os valores padrão.",
    });
  };

  const rolesByCategory = localConfig.jobRoles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, JobRole[]>);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'desenvolvedor': return 'Desenvolvedores';
      case 'qa': return 'QAs';
      case 'po': return 'Product Owners';
      case 'suporte': return 'Suporte';
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'desenvolvedor': return '💻';
      case 'qa': return '🧪';
      case 'po': return '📋';
      case 'suporte': return '🛠️';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Configure os parâmetros base para cálculo dos custos de defeitos
        </p>
      </div>

      {/* Work Settings */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Configurações de Trabalho</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="horasPorDia" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas de trabalho por dia
            </Label>
            <Input
              id="horasPorDia"
              type="number"
              min="1"
              max="24"
              value={localConfig.workSettings.horasPorDia}
              onChange={(e) => updateWorkSettings('horasPorDia', parseInt(e.target.value) || 8)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="diasPorMes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dias de trabalho por mês
            </Label>
            <Input
              id="diasPorMes"
              type="number"
              min="1"
              max="31"
              value={localConfig.workSettings.diasPorMes}
              onChange={(e) => updateWorkSettings('diasPorMes', parseInt(e.target.value) || 22)}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Salary Ranges */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Faixas Salariais (Base de Mercado - 2024)</h2>
        </div>
        
        <div className="space-y-8">
          {Object.entries(rolesByCategory).map(([category, roles]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{getCategoryIcon(category)}</span>
                <h3 className="text-lg font-medium">{getCategoryTitle(category)}</h3>
              </div>
              
              <div className="space-y-4">
                {roles.map(role => (
                  <Card key={role.id} className="p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {role.name} {role.level}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {formatCurrency(role.custoHora)}/hora
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Salário Mínimo</Label>
                        <Input
                          type="number"
                          value={role.salarioMinimo}
                          onChange={(e) => updateJobRole(role.id, 'salarioMinimo', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salário Máximo</Label>
                        <Input
                          type="number"
                          value={role.salarioMaximo}
                          onChange={(e) => updateJobRole(role.id, 'salarioMaximo', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Média Utilizada</Label>
                        <Input
                          type="number"
                          value={role.mediaMercado}
                          onChange={(e) => updateJobRole(role.id, 'mediaMercado', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salário Praticado</Label>
                        <Input
                          type="number"
                          placeholder="Opcional"
                          value={role.salarioPraticado || ''}
                          onChange={(e) => updateJobRole(role.id, 'salarioPraticado', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Custo/Hora</Label>
                        <div className="h-9 px-3 py-2 bg-muted rounded-md text-sm flex items-center">
                          {formatCurrency(role.custoHora)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Phase Multipliers */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Multiplicadores de Custo por Fase</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Baseado em estudos da indústria de software (fonte: IBM Systems Sciences Institute)
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success mb-2">
              {localConfig.phaseMultipliers.desenvolvimento}x
            </div>
            <Label className="text-sm font-medium">Desenvolvimento</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={localConfig.phaseMultipliers.desenvolvimento}
              onChange={(e) => updatePhaseMultiplier('desenvolvimento', parseFloat(e.target.value) || 1)}
              className="mt-2 text-center"
            />
          </div>
          
          <div className="text-center p-4 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning mb-2">
              {localConfig.phaseMultipliers.teste}x
            </div>
            <Label className="text-sm font-medium">Teste</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={localConfig.phaseMultipliers.teste}
              onChange={(e) => updatePhaseMultiplier('teste', parseFloat(e.target.value) || 5)}
              className="mt-2 text-center"
            />
          </div>
          
          <div className="text-center p-4 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary mb-2">
              {localConfig.phaseMultipliers.homologacao}x
            </div>
            <Label className="text-sm font-medium">Homologação</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={localConfig.phaseMultipliers.homologacao}
              onChange={(e) => updatePhaseMultiplier('homologacao', parseFloat(e.target.value) || 10)}
              className="mt-2 text-center"
            />
          </div>
          
          <div className="text-center p-4 rounded-lg bg-danger/10">
            <div className="text-2xl font-bold text-danger mb-2">
              {localConfig.phaseMultipliers.producao}x
            </div>
            <Label className="text-sm font-medium">Produção</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={localConfig.phaseMultipliers.producao}
              onChange={(e) => updatePhaseMultiplier('producao', parseFloat(e.target.value) || 30)}
              className="mt-2 text-center"
            />
          </div>
        </div>
      </Card>

      {/* Important Note */}
      <Card className="p-6 shadow-card border-warning bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-warning mb-2">Importante - Precedência de Salários</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Salário base usado:</strong> Se "Salário Praticado" estiver preenchido, ele será usado. Caso contrário, será usada a "Média Utilizada".</p>
              <p><strong>Custo/hora:</strong> salario_base_usado ÷ (dias_mes × horas_dia)</p>
              <p><strong>Recálculo automático:</strong> O custo por hora é recalculado automaticamente quando você altera qualquer valor salarial.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={restoreDefaults}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button
          onClick={saveConfiguration}
          variant="executive"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}