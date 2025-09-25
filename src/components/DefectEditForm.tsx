import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig } from '@/lib/defaultData';
import { calculateDefectCosts, formatCurrency } from '@/lib/defectCalculations';
import { Defect, DefectHours, SystemConfig } from '@/types/defect';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface DefectEditFormProps {
  defect: Defect;
  onSave: (updatedDefect: Defect) => void;
  onCancel: () => void;
}

export default function DefectEditForm({ defect, onSave, onCancel }: DefectEditFormProps) {
  const { toast } = useToast();
  const [config] = useLocalStorage<SystemConfig>('systemConfig', defaultSystemConfig);

  // Form state
  const [formData, setFormData] = useState({
    titulo: defect.titulo,
    horasTotais: defect.horasTotais?.toString() || '',
    severidade: defect.severidade,
    percepcaoImpacto: defect.percepcaoImpacto,
    ambienteEncontrado: defect.ambienteEncontrado,
    modulo: defect.modulo,
  });

  const [horasPorCargo, setHorasPorCargo] = useState<DefectHours[]>(defect.horasPorCargo);

  // Add role hours
  const addRoleHours = (roleId: string) => {
    const role = config.jobRoles.find(r => r.id === roleId);
    if (!role) {
      return;
    }

    const existing = horasPorCargo.find(h => h.roleId === roleId);
    if (existing) {
      setHorasPorCargo(prev =>
        prev.map(h => (h.roleId === roleId ? { ...h, hours: h.hours + 1 } : h))
      );
    } else {
      setHorasPorCargo(prev => [
        ...prev,
        {
          roleId: role.id,
          roleName: role.name,
          roleLevel: role.level,
          hours: 1,
          custoHora: role.salarioPraticado
            ? role.salarioPraticado /
              (config.workSettings.horasPorDia * config.workSettings.diasPorMes)
            : role.custoHora,
        },
      ]);
    }
  };

  // Remove role hours
  const removeRoleHours = (roleId: string) => {
    setHorasPorCargo(prev => prev.filter(h => h.roleId !== roleId));
  };

  // Update role hours
  const updateRoleHours = (roleId: string, hours: number) => {
    setHorasPorCargo(prev => prev.map(h => (h.roleId === roleId ? { ...h, hours } : h)));
  };

  // Save defect
  const handleSave = () => {
    // Validation
    if (!formData.titulo || !formData.percepcaoImpacto) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha título e percepção de impacto.',
        variant: 'destructive',
      });
      return;
    }

    if (horasPorCargo.length === 0) {
      toast({
        title: 'Horas por cargo obrigatório',
        description: 'Adicione pelo menos um cargo com suas respectivas horas.',
        variant: 'destructive',
      });
      return;
    }

    const defectData = {
      titulo: formData.titulo,
      horasTotais: formData.horasTotais ? parseInt(formData.horasTotais) : undefined,
      severidade: formData.severidade,
      percepcaoImpacto: formData.percepcaoImpacto,
      ambienteEncontrado: formData.ambienteEncontrado,
      modulo: formData.modulo,
      horasPorCargo,
    };

    const results = calculateDefectCosts(
      defectData,
      config.phaseMultipliers,
      config.impactMultipliers
    );

    const updatedDefect: Defect = {
      ...defect,
      ...results,
      createdAt: defect.createdAt, // Preserve original creation date
    };

    onSave(updatedDefect);

    toast({
      title: 'Defeito atualizado com sucesso!',
      description: 'As alterações foram salvas.',
    });
  };

  const rolesByCategory = config.jobRoles.reduce(
    (acc, role) => {
      if (!acc[role.category]) {
        acc[role.category] = [];
      }
      acc[role.category].push(role);
      return acc;
    },
    {} as Record<string, typeof config.jobRoles>
  );

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título do Defeito *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Bug no login de usuários"
              value={formData.titulo}
              onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
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
                onChange={e => setFormData(prev => ({ ...prev, horasTotais: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="modulo">Módulo *</Label>
              <Input
                id="modulo"
                placeholder="Ex: Módulo de Pagamentos"
                value={formData.modulo}
                onChange={e => setFormData(prev => ({ ...prev, modulo: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="severidade">Severidade</Label>
              <Select
                value={formData.severidade}
                onValueChange={(value: 'baixa' | 'media' | 'alta' | 'critica') =>
                  setFormData(prev => ({ ...prev, severidade: value }))
                }
              >
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
              <Select
                value={formData.percepcaoImpacto}
                onValueChange={(
                  value: 'sem_impacto' | 'irritacao_leve' | 'frustracao' | 'reputacional'
                ) => setFormData(prev => ({ ...prev, percepcaoImpacto: value }))}
              >
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
            <div>
              <Label htmlFor="ambienteEncontrado">Ambiente Encontrado</Label>
              <Select
                value={formData.ambienteEncontrado}
                onValueChange={(value: 'desenvolvimento' | 'teste' | 'homologacao' | 'producao') =>
                  setFormData(prev => ({ ...prev, ambienteEncontrado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desenvolvimento">Desenvolvimento (1x)</SelectItem>
                  <SelectItem value="teste">Teste (5x)</SelectItem>
                  <SelectItem value="homologacao">Homologação (10x)</SelectItem>
                  <SelectItem value="producao">Produção (30x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Role Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Especificar horas por cargo</h3>

        {/* Add roles */}
        <div className="space-y-4 mb-6">
          {Object.entries(rolesByCategory).map(([category, roles]) => (
            <div key={category}>
              <h4 className="font-medium mb-2 capitalize">{category}s</h4>
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
          <h4 className="font-medium">Horas Atribuídas</h4>
          {horasPorCargo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cargo adicionado. Clique nos botões acima para adicionar cargos.
            </p>
          ) : (
            horasPorCargo.map(roleHour => (
              <div
                key={roleHour.roleId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
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
                    onChange={e => {
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
      <div className="flex gap-4 pt-4 border-t">
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
        <Button onClick={onCancel} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
