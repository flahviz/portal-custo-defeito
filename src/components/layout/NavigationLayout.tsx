import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3, Calculator, Settings, Info, Shield, Activity,
  RefreshCw, Lock, LogOut, Radar, TrendingUp, Brain, Menu, X,
} from 'lucide-react';
import { useManagerAuth } from '@/contexts/ManagerAuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  managerOnly: boolean;
}

const navigation: NavItem[] = [
  { name: 'Sobre',                href: '/',             icon: Info,       managerOnly: false },
  { name: 'Visão Geral',          href: '/dashboard',    icon: BarChart3,  managerOnly: false },
  { name: 'Defeitos Recorrentes', href: '/recorrentes',  icon: RefreshCw,  managerOnly: false },
  { name: 'Simulador de Custo',   href: '/simulador',    icon: Calculator, managerOnly: true  },
  { name: 'Índice de Saúde',      href: '/iss',          icon: Activity,   managerOnly: true  },
  { name: 'Insights',             href: '/insights',     icon: TrendingUp, managerOnly: true  },
  { name: 'Análise IA',           href: '/analise-ia',   icon: Brain,      managerOnly: true  },
  { name: 'Configurações',        href: '/configuracoes',icon: Settings,   managerOnly: true  },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isManager, requestAccess, logout } = useManagerAuth();

  function handleLockedClick(e: React.MouseEvent) {
    e.preventDefault();
    requestAccess();
    onClose?.();
  }

  function handleLogout() {
    logout();
    navigate('/');
    onClose?.();
  }

  return (
    <aside className="w-56 h-full flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-border">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border shrink-0">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <div className="rounded-lg bg-primary/20 p-1.5 shrink-0">
            <Radar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">Radar de Qualidade</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Vertical Procuradorias</p>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          const locked = item.managerOnly && !isManager;

          return (
            <Link
              key={item.name}
              to={locked ? '#' : item.href}
              onClick={locked ? handleLockedClick : onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : locked
                  ? 'text-muted-foreground/40 hover:bg-secondary/50 cursor-pointer'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-primary' : '')} />
              <span className="flex-1 truncate">{item.name}</span>
              {locked && <Lock className="h-3 w-3 shrink-0 opacity-40" />}
              {isActive && (
                <div className="w-1 h-4 rounded-full bg-primary shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Manager section */}
      <div className="px-2 py-3 border-t border-border shrink-0">
        {isManager ? (
          <div className="px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2.5">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-primary font-semibold">Modo gestor ativo</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair do modo gestor
            </button>
          </div>
        ) : (
          <button
            onClick={() => { requestAccess(); onClose?.(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <Lock className="h-4 w-4 shrink-0" />
            Acesso gestor
          </button>
        )}
      </div>
    </aside>
  );
}

export default function NavigationLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-56 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden h-13 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Radar de Qualidade</span>
          </div>
          <div className="w-7" />
        </header>

        {/* Topbar desktop — só info contextual sutil */}
        <div className="hidden md:flex h-10 border-b border-border/50 bg-card/50 px-6 items-center justify-end shrink-0">
          <span className="text-[11px] text-muted-foreground">pge-net · Softplan · Vertical Procuradorias</span>
        </div>

        {/* Página */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
