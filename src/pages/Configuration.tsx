import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig, calculateCostPerHour } from '@/lib/defaultData';
import { formatCurrency } from '@/lib/defectCalculations';
import { SystemConfig, JobRole, SquadConfig, SquadDeveloper } from '@/types/defect';
import { saveSquadConfigToStorage, SquadsConfig } from '@/lib/rtcService';
import {
  Save,
  RotateCcw,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Download,
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
        [field]: value,
      },
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
      }),
    }));
  };

  // Update phase multipliers
  const updatePhaseMultiplier = (
    phase: keyof typeof localConfig.phaseMultipliers,
    value: number
  ) => {
    setLocalConfig(prev => ({
      ...prev,
      phaseMultipliers: {
        ...prev.phaseMultipliers,
        [phase]: value,
      },
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
        ),
      })),
    };

    setConfig(updatedConfig);
    setLocalConfig(updatedConfig);

    // Sincroniza com a chave usada pelo ISS e Insights
    const squadSync: SquadsConfig = {
      squads: (updatedConfig.squads ?? []).map(s => ({
        id: s.id,
        name: s.name,
        teamArea: s.teamArea,
        horasMediaPorDefeito: s.horasMediaPorDefeito ?? 8,
        developers: s.developers.map(d => ({ email: d.email, level: d.level, category: d.category })),
      })),
      jobRoles: updatedConfig.jobRoles.map(r => ({ id: r.id, name: r.name, level: r.level, category: r.category, custoHora: r.custoHora })),
      workSettings: updatedConfig.workSettings,
    };
    saveSquadConfigToStorage(squadSync);

    toast({
      title: 'Configurações salvas!',
      description: 'Todas as configurações foram atualizadas com sucesso.',
    });
  };

  // Restore defaults
  const restoreDefaults = () => {
    setLocalConfig(defaultSystemConfig);
    toast({
      title: 'Configurações restauradas',
      description: 'Todas as configurações foram restauradas para os valores padrão.',
    });
  };

  const rolesByCategory = localConfig.jobRoles.reduce(
    (acc, role) => {
      if (!acc[role.category]) {
        acc[role.category] = [];
      }
      acc[role.category].push(role);
      return acc;
    },
    {} as Record<string, JobRole[]>
  );

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'desenvolvedor':
        return 'Desenvolvedores';
      case 'qa':
        return 'QAs';
      case 'po':
        return 'Product Owners';
      case 'suporte':
        return 'Suporte';
      default:
        return category;
    }
  };

  // Squad management
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadTeamArea, setNewSquadTeamArea] = useState('');
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [newDevEmail, setNewDevEmail] = useState('');
  const [newDevName, setNewDevName] = useState('');
  const [newDevLevel, setNewDevLevel] = useState<SquadDeveloper['level']>('pleno');
  const [newDevCategory, setNewDevCategory] = useState<SquadDeveloper['category']>('desenvolvedor');

  const squads = localConfig.squads ?? [];

  const addSquad = () => {
    if (!newSquadName || !newSquadTeamArea) return;
    const squad: SquadConfig = {
      id: crypto.randomUUID(),
      name: newSquadName,
      teamArea: newSquadTeamArea,
      horasMediaPorDefeito: 8,
      developers: [],
    };
    setLocalConfig(prev => ({ ...prev, squads: [...(prev.squads ?? []), squad] }));
    setNewSquadName('');
    setNewSquadTeamArea('');
  };

  const removeSquad = (id: string) => {
    setLocalConfig(prev => ({ ...prev, squads: (prev.squads ?? []).filter(s => s.id !== id) }));
  };

  const updateSquadHours = (id: string, hours: number) => {
    setLocalConfig(prev => ({
      ...prev,
      squads: (prev.squads ?? []).map(s => s.id === id ? { ...s, horasMediaPorDefeito: hours } : s),
    }));
  };

  const addDeveloper = (squadId: string) => {
    if (!newDevEmail) return;
    const dev: SquadDeveloper = {
      email: newDevEmail.trim().toLowerCase(),
      name: newDevName || undefined,
      level: newDevLevel,
      category: newDevCategory,
    };
    setLocalConfig(prev => ({
      ...prev,
      squads: (prev.squads ?? []).map(s =>
        s.id === squadId ? { ...s, developers: [...s.developers, dev] } : s
      ),
    }));
    setNewDevEmail('');
    setNewDevName('');
  };

  const removeDeveloper = (squadId: string, email: string) => {
    setLocalConfig(prev => ({
      ...prev,
      squads: (prev.squads ?? []).map(s =>
        s.id === squadId ? { ...s, developers: s.developers.filter(d => d.email !== email) } : s
      ),
    }));
  };

  const exportSquadConfig = () => {
    const data = {
      squads: localConfig.squads ?? [],
      jobRoles: localConfig.jobRoles.map(r => ({ id: r.id, name: r.name, level: r.level, category: r.category, custoHora: r.custoHora })),
      workSettings: localConfig.workSettings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'squad-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'desenvolvedor':
        return '💻';
      case 'qa':
        return '🧪';
      case 'po':
        return '📋';
      case 'suporte':
        return '🛠️';
      default:
        return '👤';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-mono text-muted-foreground/60 tracking-[0.2em] uppercase mb-3">
          Administração · Vertical Procuradorias
        </p>
        <h1 className="text-4xl font-bold text-foreground">
          Configurações do <span style={{ color: '#64748b' }}>Sistema</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
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
              onChange={e => updateWorkSettings('horasPorDia', parseInt(e.target.value) || 8)}
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
              onChange={e => updateWorkSettings('diasPorMes', parseInt(e.target.value) || 22)}
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
                          onChange={e =>
                            updateJobRole(role.id, 'salarioMinimo', parseInt(e.target.value) || 0)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salário Máximo</Label>
                        <Input
                          type="number"
                          value={role.salarioMaximo}
                          onChange={e =>
                            updateJobRole(role.id, 'salarioMaximo', parseInt(e.target.value) || 0)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Média Utilizada</Label>
                        <Input
                          type="number"
                          value={role.mediaMercado}
                          onChange={e =>
                            updateJobRole(role.id, 'mediaMercado', parseInt(e.target.value) || 0)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Salário Praticado</Label>
                        <Input
                          type="number"
                          placeholder="Opcional"
                          value={role.salarioPraticado || ''}
                          onChange={e =>
                            updateJobRole(
                              role.id,
                              'salarioPraticado',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
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
              onChange={e =>
                updatePhaseMultiplier('desenvolvimento', parseFloat(e.target.value) || 1)
              }
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
              onChange={e => updatePhaseMultiplier('teste', parseFloat(e.target.value) || 5)}
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
              onChange={e => updatePhaseMultiplier('homologacao', parseFloat(e.target.value) || 10)}
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
              onChange={e => updatePhaseMultiplier('producao', parseFloat(e.target.value) || 30)}
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
              <p>
                <strong>Salário base usado:</strong> Se "Salário Praticado" estiver preenchido, ele
                será usado. Caso contrário, será usada a "Média Utilizada".
              </p>
              <p>
                <strong>Custo/hora:</strong> salario_base_usado ÷ (dias_mes × horas_dia)
              </p>
              <p>
                <strong>Recálculo automático:</strong> O custo por hora é recalculado
                automaticamente quando você altera qualquer valor salarial.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Squads e Desenvolvedores */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Squads e Desenvolvedores (ISS)</h2>
          </div>
          <Button variant="outline" size="sm" onClick={exportSquadConfig} disabled={squads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar squad-config.json
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Configure os desenvolvedores por squad para o cálculo automático do ISS via RTC.
          Após configurar, exporte o arquivo e salve em <code className="bg-muted px-1 rounded">.claude/squad-config.json</code>.
        </p>

        {/* Adicionar squad */}
        <div className="flex gap-3 mb-6">
          <Input placeholder="Nome do squad" value={newSquadName} onChange={e => setNewSquadName(e.target.value)} className="flex-1" />
          <Input placeholder="Team Area exata no RTC" value={newSquadTeamArea} onChange={e => setNewSquadTeamArea(e.target.value)} className="flex-1" />
          <Button onClick={addSquad} disabled={!newSquadName || !newSquadTeamArea}>
            <Plus className="h-4 w-4 mr-1" /> Squad
          </Button>
        </div>

        {squads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/20">
            Nenhum squad configurado. Adicione o primeiro squad acima.
          </p>
        )}

        <div className="space-y-4">
          {squads.map(squad => (
            <Card key={squad.id} className="p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{squad.name}</p>
                  <p className="text-xs text-muted-foreground">Team Area RTC: <code>{squad.teamArea}</code></p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs whitespace-nowrap">Horas/defeito:</Label>
                    <Input
                      type="number" min={1} max={80}
                      value={squad.horasMediaPorDefeito}
                      onChange={e => updateSquadHours(squad.id, parseInt(e.target.value) || 8)}
                      className="w-16 h-7 text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setExpandedSquad(expandedSquad === squad.id ? null : squad.id)}>
                    {expandedSquad === squad.id ? 'Fechar' : `${squad.developers.length} devs`}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeSquad(squad.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {expandedSquad === squad.id && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Lista de devs */}
                  {squad.developers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum desenvolvedor cadastrado.</p>
                  ) : (
                    <div className="space-y-1">
                      {squad.developers.map(dev => (
                        <div key={dev.email} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-background">
                          <span className="font-mono text-xs">{dev.email}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{dev.category} {dev.level}</Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeDeveloper(squad.id, dev.email)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar dev */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                    <Input placeholder="email@softplan.com.br" value={newDevEmail} onChange={e => setNewDevEmail(e.target.value)} className="md:col-span-2 text-xs h-8" />
                    <Input placeholder="Nome (opcional)" value={newDevName} onChange={e => setNewDevName(e.target.value)} className="text-xs h-8" />
                    <select
                      value={newDevCategory}
                      onChange={e => setNewDevCategory(e.target.value as SquadDeveloper['category'])}
                      className="border rounded px-2 text-xs h-8 bg-background"
                    >
                      <option value="desenvolvedor">Dev</option>
                      <option value="qa">QA</option>
                      <option value="po">PO</option>
                      <option value="suporte">Suporte</option>
                    </select>
                    <div className="flex gap-1">
                      <select
                        value={newDevLevel}
                        onChange={e => setNewDevLevel(e.target.value as SquadDeveloper['level'])}
                        className="border rounded px-2 text-xs h-8 bg-background flex-1"
                      >
                        <option value="junior">Junior</option>
                        <option value="pleno">Pleno</option>
                        <option value="senior">Senior</option>
                      </select>
                      <Button size="sm" className="h-8 px-2" onClick={() => addDeveloper(squad.id)} disabled={!newDevEmail}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={restoreDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button onClick={saveConfiguration} variant="executive">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
