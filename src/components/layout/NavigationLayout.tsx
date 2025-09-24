import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Calculator, 
  Settings, 
  TrendingUp 
} from 'lucide-react';

interface NavigationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Simulador',
    href: '/',
    icon: Calculator,
    description: 'Simular custos de defeitos'
  },
  {
    name: 'Visão Geral',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Dashboard executivo'
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    description: 'Parâmetros do sistema'
  }
];

export default function NavigationLayout({ children }: NavigationLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-card shadow-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Análise de Defeitos
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Plataforma executiva para análise do impacto financeiro de defeitos
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8 -mb-px">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}