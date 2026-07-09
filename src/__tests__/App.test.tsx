import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from '../App';

// Custom render for App component (which already has BrowserRouter)
const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('App', () => {
  it('renders without crashing', () => {
    renderApp();

    // Should render the navigation layout
    expect(screen.getByText('Portal Custo Defeito')).toBeInTheDocument();
  });

  it('renders the About page by default (root route)', () => {
    renderApp();

    // Should show the About page content since it's the default route
    expect(screen.getByText('Entenda a Ferramenta')).toBeInTheDocument();
  });

  it('has the correct navigation structure', () => {
    renderApp();

    // Check if all navigation items are present
    expect(screen.getByText('Entenda a ferramenta')).toBeInTheDocument();
    expect(screen.getByText('Simulador')).toBeInTheDocument();
    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    // Use getAllByText since "Configurações" appears in multiple places
    const configTexts = screen.getAllByText('Configurações');
    expect(configTexts.length).toBeGreaterThan(0);
  });

  it('displays team attribution in header', () => {
    renderApp();

    // Use getAllByText since this text appears in multiple places
    const timeTexts = screen.getAllByText('Time de Qualidade');
    expect(timeTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('Vertical Procuradorias')).toBeInTheDocument();
  });

  it('displays footer with team information', () => {
    renderApp();

    expect(screen.getByText('Desenvolvido pelo Time de Qualidade')).toBeInTheDocument();
    // Use getAllByText since this text appears in multiple places (header and footer)
    const verticalTexts = screen.getAllByText(/Vertical de Procuradorias.*Softplan/);
    expect(verticalTexts.length).toBeGreaterThan(0);
  });
});
