import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils';
import NavigationLayout from '../NavigationLayout';

describe('NavigationLayout', () => {
  it('renders the main navigation items', () => {
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );

    // Check if navigation items are present
    expect(screen.getByText('Entenda a ferramenta')).toBeInTheDocument();
    expect(screen.getByText('Simulador')).toBeInTheDocument();
    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders the header with correct title', () => {
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );

    expect(screen.getByText('Portal Custo Defeito')).toBeInTheDocument();
    expect(
      screen.getByText('Transformando dados de qualidade em decisões estratégicas inteligentes')
    ).toBeInTheDocument();
  });

  it('renders the team attribution', () => {
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );

    expect(screen.getByText('Time de Qualidade')).toBeInTheDocument();
    expect(screen.getByText('Vertical Procuradorias')).toBeInTheDocument();
  });

  it('renders the footer with team information', () => {
    render(
      <NavigationLayout>
        <div>Test Content</div>
      </NavigationLayout>
    );

    expect(screen.getByText('Desenvolvido pelo Time de Qualidade')).toBeInTheDocument();
    expect(screen.getByText(/Vertical de Procuradorias.*Softplan/)).toBeInTheDocument();
    expect(screen.getByText(/Ferramenta de apoio.*gestão de qualidade/)).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <NavigationLayout>
        <div data-testid="test-content">Test Content</div>
      </NavigationLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
