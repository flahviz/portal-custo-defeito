import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig } from '@/lib/defaultData';
import { calculateDefectCosts, formatCurrency } from '@/lib/defectCalculations';
import { Defect, DefectHours, SystemConfig } from '@/types/defect';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Settings,
  DollarSign,
  TrendingUp,
  Target
} from 'lucide-react';
export default function Simulator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config] = useLocalStorage<SystemConfig>('systemConfig', defaultSystemConfig);
  const [defects, setDefects] = useLocalStorage<Defect[]>('defects', []);

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    horasTotais: '',
    severidade: '',
    percepcaoImpacto: '',
    ambienteEncontrado: '',
    modulo: ''
  });

  const [horasPorCargo, setHorasPorCargo] = useState<DefectHours[]>([]);
  const [calculatedResults, setCalculatedResults] = useState<any>(null);

  // Add role hours
  const addRoleHours = (roleId: string) => {
    const role = config.jobRoles.find(r => r.id === roleId);
    if (!role) return;

    const existing = horasPorCargo.find(h => h.roleId === roleId);
    if (existing) {
      setHorasPorCargo(prev => 
        prev.map(h => h.roleId === roleId ? { ...h, hours: h.hours + 1 } : h)
      );
    } else {
      setHorasPorCargo(prev => [...prev, {
        roleId: role.id,
        roleName: role.name,
        roleLevel: role.level,
        hours: 1,
        custoHora: role.salarioPraticado 
          ? (role.salarioPraticado / (config.workSettings.horasPorDia * config.workSettings.diasPorMes))
          : role.custoHora
      }]);
    }
  };

  // Remove role hours
  const removeRoleHours = (roleId: string) => {
    setHorasPorCargo(prev => prev.filter(h => h.roleId !== roleId));
  };

  // Update role hours
  const updateRoleHours = (roleId: string, hours: number) => {
    setHorasPorCargo(prev => 
      prev.map(h => h.roleId === roleId ? { ...h, hours } : h)
    );
  };

  // Calculate cost simulation
  const simulateDefect = () => {
    // Validation
    if (!formData.titulo || !formData.percepcaoImpacto) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha título e percepção de impacto.",
        variant: "destructive"
      });
      return;
    }

    if (horasPorCargo.length === 0) {
      toast({
        title: "Horas por cargo obrigatório",
        description: "Adicione pelo menos um cargo com suas respectivas horas.",
        variant: "destructive"
      });
      return;
    }

    const defectData = {
      titulo: formData.titulo,
      horasTotais: formData.horasTotais ? parseInt(formData.horasTotais) : undefined,
      severidade: formData.severidade as any || 'media',
      percepcaoImpacto: formData.percepcaoImpacto as any,
      ambienteEncontrado: 'producao' as any, // Sempre produção
      modulo: formData.modulo,
      horasPorCargo
    };

    const results = calculateDefectCosts(
      defectData,
      config.phaseMultipliers,
      config.impactMultipliers
    );

    setCalculatedResults(results);
  };

  // Save defect
  const saveDefect = () => {
    if (!calculatedResults) return;

    const newDefect: Defect = {
      id: Date.now().toString(),
      ...calculatedResults,
      createdAt: new Date()
    };

    setDefects(prev => [...prev, newDefect]);
    
    toast({
      title: "Defeito salvo com sucesso!",
      description: "Redirecionando para o dashboard para visualizar os resultados...",
    });

    navigate('/dashboard');

    // Reset form
    setFormData({
      titulo: '',
      horasTotais: '',
      severidade: '',
      percepcaoImpacto: '',
      ambienteEncontrado: '',
      modulo: ''
    });
    setHorasPorCargo([]);
    setCalculatedResults(null);
  };

  const rolesByCategory = config.jobRoles.reduce((acc, role) => {
    if (!acc[role.category]) acc[role.category] = [];
    acc[role.category].push(role);
    return acc;
  }, {} as Record<string, typeof config.jobRoles>);

  const getImpactLabel = (key: string) => {
    switch (key) {
      case 'sem_impacto': return 'Sem impacto (0x)';
      case 'irritacao_leve': return 'Irritação leve (1.1x)';
      case 'frustracao': return 'Frustração (1.2x)';
      case 'reputacional': return 'Reputacional (1.3x)';
      default: return key;
    }
  };

  const getEnvironmentLabel = (key: string) => {
    switch (key) {
      case 'desenvolvimento': return 'Desenvolvimento (1x)';
      case 'teste': return 'Teste (5x)';
      case 'homologacao': return 'Homologação (10x)';
      case 'producao': return 'Produção (30x)';
      default: return key;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Defeitos</h1>
        <p className="text-muted-foreground mt-2">
          Configure os detalhes do defeito para calcular seu impacto financeiro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título do Defeito *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Bug no login de usuários"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horasTotais">Horas Totais Gastas</Label>
                  <Input
                    id="horasTotais"
                    type="number"
                    placeholder="Ex: 40"
                    value={formData.horasTotais}
                    onChange={(e) => setFormData(prev => ({ ...prev, horasTotais: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="modulo">Módulo *</Label>
                  <Input
                    id="modulo"
                    placeholder="Ex: Módulo de Pagamentos"
                    value={formData.modulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, modulo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severidade">Severidade</Label>
                  <Select value={formData.severidade} onValueChange={(value) => setFormData(prev => ({ ...prev, severidade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="percepcaoImpacto">Percepção de Impacto *</Label>
                  <Select value={formData.percepcaoImpacto} onValueChange={(value) => setFormData(prev => ({ ...prev, percepcaoImpacto: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o impacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_impacto">Sem impacto (0x)</SelectItem>
                      <SelectItem value="irritacao_leve">Irritação leve (1.1x)</SelectItem>
                      <SelectItem value="frustracao">Frustração (1.2x)</SelectItem>
                      <SelectItem value="reputacional">Reputacional (1.3x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ambiente fixo em produção - removido o campo do formulário */}
            </div>
          </Card>

          {/* Role Hours */}
          <Card className="p-6 shadow-card">
            <h2 className="text-xl font-semibold mb-4">Especificar horas por cargo</h2>
            
            {/* Add roles */}
            <div className="space-y-4 mb-6">
              {Object.entries(rolesByCategory).map(([category, roles]) => (
                <div key={category}>
                  <h3 className="font-medium mb-2 capitalize">{category}s</h3>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
                      <Button
                        key={role.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addRoleHours(role.id)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {role.name} {role.level}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Current role hours */}
            <div className="space-y-3">
              <h3 className="font-medium">Horas Atribuídas</h3>
              {horasPorCargo.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum cargo adicionado. Clique nos botões acima para adicionar cargos.
                </p>
              ) : (
                horasPorCargo.map(roleHour => (
                  <div key={roleHour.roleId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {roleHour.roleName} {roleHour.roleLevel}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(roleHour.custoHora)}/h
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        value={roleHour.hours === 0 ? '' : roleHour.hours.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            updateRoleHours(roleHour.roleId, value === '' ? 0 : parseInt(value));
                          }
                        }}
                        className="w-20"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoleHours(roleHour.roleId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={simulateDefect}
              className="flex-1"
              variant="executive"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Simular Custo do Defeito
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {calculatedResults ? (
            <>
              {/* Cost Summary */}
              <Card className="p-6 shadow-card bg-gradient-card">
                <h2 className="text-xl font-semibold mb-4">Resultado da Simulação</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-lg font-bold">{formatCurrency(calculatedResults.custoPago)}</div>
                      <div className="text-sm text-muted-foreground">Custo Técnico</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-warning/10">
                      <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" />
                      <div className="text-lg font-bold">{formatCurrency(calculatedResults.custoComImpacto)}</div>
                      <div className="text-sm text-muted-foreground">Com Impacto</div>
                    </div>
                  </div>

                  {/* Phase breakdown */}
                  <div>
                    <h3 className="font-medium mb-2">Custo por Fase</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Desenvolvimento:</span>
                        <span className="font-medium">{formatCurrency(calculatedResults.custoPorFase.desenvolvimento)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Teste:</span>
                        <span className="font-medium">{formatCurrency(calculatedResults.custoPorFase.teste)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span>Homologação:</span>
                        <span className="font-medium">{formatCurrency(calculatedResults.custoPorFase.homologacao)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-danger/10">
                        <span>Produção:</span>
                        <span className="font-medium text-danger">{formatCurrency(calculatedResults.custoPorFase.producao)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Economia Potencial */}
                  <div className="text-center p-4 rounded-lg bg-success/10">
                    <Target className="h-6 w-6 text-success mx-auto mb-2" />
                    <div className="text-lg font-bold text-success">
                      {formatCurrency(calculatedResults.economiaPotencial)}
                    </div>
                    <div className="text-sm text-muted-foreground">Economia Potencial</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Se detectado em desenvolvimento
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                    <Button onClick={saveDefect} variant="success" className="flex-1">
                      <Target className="h-4 w-4 mr-2" />
                      Salvar Defeito
                    </Button>
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      variant="outline"
                    >
                      Ver Dashboard
                    </Button>
                </div>
              </Card>

              {/* Detailed Information */}
              <Card className="p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Informações Detalhadas</h3>
                <div className="space-y-3 text-sm">
                  <div><strong>Título:</strong> {calculatedResults.titulo}</div>
                  <div><strong>Ambiente:</strong> {getEnvironmentLabel(calculatedResults.ambienteEncontrado)}</div>
                  <div><strong>Impacto:</strong> {getImpactLabel(calculatedResults.percepcaoImpacto)}</div>
                  <div><strong>Módulo:</strong> {calculatedResults.modulo}</div>
                  <div><strong>Total de Horas:</strong> {calculatedResults.horasPorCargo.reduce((sum: number, h: any) => sum + h.hours, 0)}</div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-6 shadow-card text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Configure o Defeito</h3>
              <p className="text-muted-foreground">
                Preencha os campos ao lado e clique em "Simular" para ver o impacto financeiro.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}