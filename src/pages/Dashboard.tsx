import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DefectEditForm from '@/components/DefectEditForm';
import MetricCard from '@/components/cards/MetricCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { defaultSystemConfig } from '@/lib/defaultData';
import { formatCurrency } from '@/lib/defectCalculations';
import { Defect, SystemConfig } from '@/types/defect';
import {
  DollarSign,
  Shield,
  AlertTriangle,
  Filter,
  Eye,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  SimpleTooltip,
  Tooltip,
} from '@/components/charts/SimpleChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const [defects, setDefects] = useLocalStorage<Defect[]>('defects', []);
  const [_config] = useLocalStorage<SystemConfig>('systemConfig', defaultSystemConfig);

  // Clean up old initialization flag if it exists
  React.useEffect(() => {
    // Remove old initialization flag that might cause issues
    localStorage.removeItem('defectsInitialized');
  }, []);

  // Filters state
  const [ambienteFilter, setAmbienteFilter] = React.useState<string>('todos');
  const [severidadeFilter, setSeveridadeFilter] = React.useState<string>('todos');
  const [moduloFilter, setModuloFilter] = React.useState<string>('todos');

  // Selection state
  const [selectedDefects, setSelectedDefects] = React.useState<string[]>([]);
  const [detailsModal, setDetailsModal] = React.useState<Defect | null>(null);

  // Edit/Delete state
  const [editModal, setEditModal] = React.useState<Defect | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<Defect | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = React.useState(false);

  const filteredDefects = useMemo(() => {
    return defects.filter(defect => {
      const ambienteMatch =
        ambienteFilter === 'todos' || defect.ambienteEncontrado === ambienteFilter;
      const severidadeMatch =
        severidadeFilter === 'todos' || defect.severidade === severidadeFilter;
      const moduloMatch = moduloFilter === 'todos' || defect.modulo === moduloFilter;
      return ambienteMatch && severidadeMatch && moduloMatch;
    });
  }, [defects, ambienteFilter, severidadeFilter, moduloFilter]);

  // Get unique modules for filter
  const uniqueModules = useMemo(() => {
    return Array.from(new Set(defects.map(defect => defect.modulo))).filter(Boolean);
  }, [defects]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDefects(filteredDefects.map(defect => defect.id));
    } else {
      setSelectedDefects([]);
    }
  };

  const handleSelectDefect = (defectId: string, checked: boolean) => {
    if (checked) {
      setSelectedDefects(prev => [...prev, defectId]);
    } else {
      setSelectedDefects(prev => prev.filter(id => id !== defectId));
    }
  };

  const isAllSelected =
    filteredDefects.length > 0 && selectedDefects.length === filteredDefects.length;

  // Edit defect handler
  const handleEditDefect = (updatedDefect: Defect) => {
    setDefects(prev => prev.map(d => (d.id === updatedDefect.id ? updatedDefect : d)));
    setEditModal(null);
  };

  // Delete single defect handler
  const handleDeleteDefect = (defectId: string) => {
    setDefects(prev => prev.filter(d => d.id !== defectId));
    setDeleteConfirm(null);
  };

  // Delete multiple defects handler
  const handleBulkDelete = () => {
    setDefects(prev => prev.filter(d => !selectedDefects.includes(d.id)));
    setSelectedDefects([]);
    setBulkDeleteConfirm(false);
  };

  // Load sample data handler
  const handleLoadSampleData = async () => {
    try {
      const { sampleDefects } = await import('@/lib/sampleData');
      setDefects(sampleDefects);
    } catch (error) {
      console.error('Erro ao carregar dados de exemplo:', error);
    }
  };

  // Calculate metrics
  const totalCustoPago = filteredDefects.reduce((sum, defect) => sum + defect.custoPago, 0);
  const totalCustoComImpacto = filteredDefects.reduce(
    (sum, defect) => sum + defect.custoComImpacto,
    0
  );
  const totalCustoPorFase = filteredDefects.reduce(
    (acc, defect) => ({
      desenvolvimento: acc.desenvolvimento + defect.custoPorFase.desenvolvimento,
      teste: acc.teste + defect.custoPorFase.teste,
      homologacao: acc.homologacao + defect.custoPorFase.homologacao,
      producao: acc.producao + defect.custoPorFase.producao,
    }),
    { desenvolvimento: 0, teste: 0, homologacao: 0, producao: 0 }
  );

  const totalEconomiaPotencial = filteredDefects.reduce(
    (sum, defect) => sum + defect.economiaPotencial,
    0
  );

  // Chart data
  const phaseComparisonData = [
    { fase: 'Dev', custo: totalCustoPorFase.desenvolvimento },
    { fase: 'Teste', custo: totalCustoPorFase.teste },
    { fase: 'Homolog', custo: totalCustoPorFase.homologacao },
    { fase: 'Produção', custo: totalCustoPorFase.producao },
  ];

  const monthlyTrend = useMemo(() => {
    const monthData: { [key: string]: number } = {};

    filteredDefects.forEach(defect => {
      const raw = defect.createdAt;
      const d = typeof raw === 'string' ? new Date(raw) : raw instanceof Date ? raw : new Date();
      if (!d || isNaN(d.getTime())) {
        return;
      }
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      monthData[key] = (monthData[key] || 0) + defect.custoComImpacto;
    });

    return Object.entries(monthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, custo]) => ({
        mes: new Date(`${month}-01T00:00:00Z`).toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        custo,
      }));
  }, [filteredDefects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Análise de Defeitos
        </h1>
        <p className="text-muted-foreground mt-2">
          Plataforma para análise do impacto financeiro de defeitos de software
        </p>
      </div>

      {/* Executive Filters */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Filtros Executivos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ambiente</label>
            <Select value={ambienteFilter} onValueChange={setAmbienteFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="teste">Teste</SelectItem>
                <SelectItem value="homologacao">Homologação</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Severidade</label>
            <Select value={severidadeFilter} onValueChange={setSeveridadeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Módulo</label>
            <Select value={moduloFilter} onValueChange={setModuloFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {uniqueModules.map(module => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Custo Total Base"
          value={formatCurrency(totalCustoPago)}
          icon={DollarSign}
          description="Custo técnico acumulado"
          variant="default"
        />
        <MetricCard
          title="Custo com Impacto"
          value={formatCurrency(totalCustoComImpacto)}
          icon={AlertTriangle}
          description="Incluindo impacto do negócio"
          variant="warning"
        />
        <MetricCard
          title="Economia Potencial"
          value={formatCurrency(totalEconomiaPotencial)}
          icon={Shield}
          description="Se detectado em desenvolvimento"
          variant="success"
        />
      </div>

      {/* Defects Table */}
      <Card className="shadow-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Defeitos Cadastrados ({filteredDefects.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSelectAll(!isAllSelected)}>
                {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDefects([])}>
                Limpar Seleção
              </Button>
              {selectedDefects.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir Selecionados ({selectedDefects.length})
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium w-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                </th>
                <th className="text-left p-4 font-medium">Título</th>
                <th className="text-left p-4 font-medium">Ambiente</th>
                <th className="text-left p-4 font-medium">Severidade</th>
                <th className="text-left p-4 font-medium">Custo Base</th>
                <th className="text-left p-4 font-medium">Custo Total</th>
                <th className="text-left p-4 font-medium">Economia Potencial</th>
                <th className="text-left p-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="space-y-4">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium">
                          {defects.length === 0
                            ? 'Bem-vindo ao Dashboard'
                            : 'Nenhum defeito encontrado'}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          {defects.length === 0
                            ? 'Comece criando um novo defeito no simulador ou carregue dados de exemplo para explorar a ferramenta.'
                            : 'Nenhum defeito corresponde aos filtros aplicados. Tente ajustar os filtros acima.'}
                        </p>
                      </div>
                      {defects.length === 0 && (
                        <div className="flex gap-2 justify-center">
                          <Button onClick={handleLoadSampleData} variant="outline">
                            Carregar Dados de Exemplo
                          </Button>
                          <Button onClick={() => navigate('/simulador')}>Criar Novo Defeito</Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDefects.map(defect => (
                  <tr key={defect.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedDefects.includes(defect.id)}
                        onCheckedChange={checked =>
                          handleSelectDefect(defect.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="p-4 font-medium">{defect.titulo}</td>
                    <td className="p-4 capitalize">{defect.ambienteEncontrado}</td>
                    <td className="p-4 capitalize">{defect.severidade}</td>
                    <td className="p-4">{formatCurrency(defect.custoPago)}</td>
                    <td className="p-4">{formatCurrency(defect.custoComImpacto)}</td>
                    <td className="p-4 text-success font-medium">
                      {formatCurrency(defect.economiaPotencial)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailsModal(defect)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditModal(defect)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(defect)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Comparison Chart */}
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">📊 Comparativo de Custo por Fase</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="fase"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={value => formatCurrency(value)}
                />
                <Tooltip
                  content={<SimpleTooltip formatter={(value: number) => formatCurrency(value)} />}
                />
                <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">📈 Tendência Mensal de Custos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={value => formatCurrency(value)}
                />
                <Tooltip
                  content={<SimpleTooltip formatter={(value: number) => formatCurrency(value)} />}
                />
                <Line
                  type="monotone"
                  dataKey="custo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Defeito</DialogTitle>
          </DialogHeader>
          {editModal && (
            <DefectEditForm
              defect={editModal}
              onSave={handleEditDefect}
              onCancel={() => setEditModal(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o defeito "{deleteConfirm?.titulo}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteDefect(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedDefects.length} defeito(s) selecionado(s)?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Modal */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comparativo de Custo de Bug em Diferentes Fases</DialogTitle>
          </DialogHeader>

          {detailsModal && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                O custo de correção de um bug aumenta exponencialmente conforme a fase em que é
                descoberto. Veja como o seu caso se comportaria em diferentes fases:
              </p>

              {/* Phase Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left">Fase de Detecção</th>
                      <th className="border border-border p-3 text-left">Atividades Necessárias</th>
                      <th className="border border-border p-3 text-left">Multiplicador</th>
                      <th className="border border-border p-3 text-left">Custo Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">Desenvolvimento</td>
                      <td className="border border-border p-3">
                        Implementar correção, revisar código, testes unitários locais
                      </td>
                      <td className="border border-border p-3">1x</td>
                      <td className="border border-border p-3 text-success font-medium">
                        {formatCurrency(detailsModal.custoPorFase.desenvolvimento)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Testes Internos (QA)</td>
                      <td className="border border-border p-3">
                        Executar cenários, validar regressão, reteste completo
                      </td>
                      <td className="border border-border p-3">5x</td>
                      <td className="border border-border p-3 text-warning font-medium">
                        {formatCurrency(detailsModal.custoPorFase.teste)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Homologação</td>
                      <td className="border border-border p-3">
                        Retrabalho de código, reteste completo, validação com cliente
                      </td>
                      <td className="border border-border p-3">10x</td>
                      <td className="border border-border p-3 text-warning font-medium">
                        {formatCurrency(detailsModal.custoPorFase.homologacao)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">
                        Produção
                        {detailsModal.ambienteEncontrado === 'producao' && (
                          <span className="ml-2 text-xs bg-danger/10 text-danger px-2 py-1 rounded">
                            ⚠ Seu caso
                          </span>
                        )}
                      </td>
                      <td className="border border-border p-3">
                        Diagnóstico em ambiente real, hotfix, impacto no negócio, comunicação com
                        clientes
                      </td>
                      <td className="border border-border p-3">30x</td>
                      <td className="border border-border p-3 text-danger font-medium">
                        {formatCurrency(detailsModal.custoPorFase.producao)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Analysis Summary */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">💡 Análise do Seu Caso:</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Custo Base (Esforço Técnico):</strong>{' '}
                        {formatCurrency(detailsModal.custoPago)} (horas × custo/hora da equipe)
                      </p>
                      <p>
                        <strong>Custo Atual ({detailsModal.ambienteEncontrado}):</strong>{' '}
                        {formatCurrency(detailsModal.custoComImpacto)}
                      </p>
                      <p className="text-success">
                        <strong>Economia se detectado em desenvolvimento:</strong>{' '}
                        {formatCurrency(detailsModal.economiaPotencial)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
