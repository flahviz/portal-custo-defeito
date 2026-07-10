import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3, Calculator, Settings, Info, Shield, Activity,
  RefreshCw, Lock, TrendingUp, Brain, Menu, X, Radar, LogOut,
} from 'lucide-react';
import { useManagerAuth } from '@/contexts/ManagerAuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  managerOnly: boolean;
}

const navigation: NavItem[] = [
  { name: 'Sobre',        href: '/',              icon: Info,       managerOnly: false },
  { name: 'Visão Geral',  href: '/dashboard',     icon: BarChart3,  managerOnly: false },
  { name: 'Recorrentes',  href: '/recorrentes',   icon: RefreshCw,  managerOnly: false },
  { name: 'Simulador',    href: '/simulador',     icon: Calculator, managerOnly: true  },
  { name: 'ISS',          href: '/iss',           icon: Activity,   managerOnly: true  },
  { name: 'Insights',     href: '/insights',      icon: TrendingUp, managerOnly: true  },
  { name: 'Análise IA',   href: '/analise-ia',    icon: Brain,      managerOnly: true  },
  { name: 'Config',       href: '/configuracoes', icon: Settings,   managerOnly: true  },
];

export default function NavigationLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isManager, requestAccess, logout } = useManagerAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLockedClick(e: React.MouseEvent) {
    e.preventDefault();
    requestAccess();
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/');
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b border-border bg-[hsl(240_20%_4%/95%)] backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-full px-6 flex items-center gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="rounded-md bg-primary/15 p-1.5">
              <Radar className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-mono text-muted-foreground tracking-[0.2em] uppercase leading-none mb-0.5">
                Softplan
              </p>
              <p className="text-sm font-bold text-foreground leading-none tracking-tight">
                Radar de Qualidade
              </p>
            </div>
          </Link>

          {/* Separator */}
          <div className="hidden md:block h-5 w-px bg-border shrink-0" />

          {/* Nav — desktop */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const locked = item.managerOnly && !isManager;
              return (
                <Link
                  key={item.name}
                  to={locked ? '#' : item.href}
                  onClick={locked ? handleLockedClick : undefined}
                  className={cn(
                    'relative px-3 py-1.5 text-xs font-medium tracking-wider uppercase transition-colors rounded-md select-none',
                    isActive
                      ? 'text-foreground'
                      : locked
                      ? 'text-muted-foreground/35 cursor-pointer'
                      : 'text-muted-foreground hover:text-foreground/80'
                  )}
                >
                  {item.name}
                  {locked && (
                    <Lock className="inline-block ml-1 h-2 w-2 opacity-40 -translate-y-px" />
                  )}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right — manager mode */}
          <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
            {isManager ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary border border-primary/25 rounded-full px-3 py-1 bg-primary/8 tracking-wider">
                  <Shield className="h-3 w-3" />
                  GESTOR ATIVO
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => requestAccess()}
                className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 border border-border rounded-full px-3 py-1 hover:border-muted-foreground/30 hover:text-muted-foreground transition-colors tracking-wider"
              >
                <Lock className="h-2.5 w-2.5" />
                ACESSO GESTOR
              </button>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden ml-auto p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-14 left-0 right-0 bg-[hsl(240_16%_7%)] border-b border-border">
            <nav className="px-4 py-3 space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const locked = item.managerOnly && !isManager;
                return (
                  <Link
                    key={item.name}
                    to={locked ? '#' : item.href}
                    onClick={locked ? handleLockedClick : () => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : locked
                        ? 'text-muted-foreground/35'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                    {locked && <Lock className="ml-auto h-3 w-3 opacity-40" />}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-border">
              {isManager ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-primary tracking-wider">
                    <Shield className="h-3 w-3" />
                    MODO GESTOR ATIVO
                  </div>
                  <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <LogOut className="h-3 w-3" />
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { requestAccess(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  Acesso Gestor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Conteúdo ── */}
      <main className="pt-14 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
