import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils';
import About from '../About';

describe('About Page', () => {
  it('renders the main heading', () => {
    render(<About />);

    expect(screen.getByText('Entenda a Ferramenta')).toBeInTheDocument();
  });

  it('displays the team information', () => {
    render(<About />);

    expect(screen.getByText('Time de Qualidade')).toBeInTheDocument();
    expect(screen.getByText('Vertical de Procuradorias • Softplan')).toBeInTheDocument();
  });

  it('shows the cost multipliers correctly', () => {
    render(<About />);

    // Check for the multipliers section
    expect(screen.getByText('Multiplicadores de Custo por Fase')).toBeInTheDocument();

    // Check for specific multipliers
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('5x')).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();
    expect(screen.getByText('30x')).toBeInTheDocument();

    // Check for phase names
    expect(screen.getByText('Desenvolvimento')).toBeInTheDocument();
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('Homologação')).toBeInTheDocument();
    expect(screen.getByText('Produção')).toBeInTheDocument();
  });

  it('displays the theoretical foundation section', () => {
    render(<About />);

    expect(screen.getByText('Fundamentação Teórica')).toBeInTheDocument();
    expect(screen.getByText('Custo da Qualidade')).toBeInTheDocument();
    expect(screen.getByText(/Philip Crosby/)).toBeInTheDocument();
  });

  it('shows the motivation section', () => {
    render(<About />);

    expect(screen.getByText('Motivadores da Criação')).toBeInTheDocument();
    expect(screen.getByText('Desafios Identificados')).toBeInTheDocument();
    expect(screen.getByText('Objetivos da Solução')).toBeInTheDocument();
  });

  it('displays the tool features', () => {
    render(<About />);

    expect(screen.getByText('Funcionalidades da Ferramenta')).toBeInTheDocument();
    expect(screen.getByText('Simulador de Custos')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Executivo')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('shows the InnerSource section', () => {
    render(<About />);

    expect(screen.getByText('Projeto InnerSource')).toBeInTheDocument();
    expect(screen.getByText('Como Contribuir')).toBeInTheDocument();
    expect(screen.getByText('Trusted Committers')).toBeInTheDocument();
    expect(screen.getByText(/Flávia Cristina/)).toBeInTheDocument();
    expect(screen.getByText(/Humberto Zilio/)).toBeInTheDocument();
  });

  it('has a link to the GitLab repository', () => {
    render(<About />);

    const gitlabLink = screen.getByRole('link', { name: /contribuir no gitlab/i });
    expect(gitlabLink).toBeInTheDocument();
    expect(gitlabLink).toHaveAttribute(
      'href',
      'https://gitlab.com/softplan/justica/procuradorias/arquitetura-de-software/tools/portal-custo-defeito'
    );
    expect(gitlabLink).toHaveAttribute('target', '_blank');
  });
});
