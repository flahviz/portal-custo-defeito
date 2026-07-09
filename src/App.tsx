import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ManagerAuthProvider } from '@/contexts/ManagerAuthContext';
import NavigationLayout from './components/layout/NavigationLayout';
import ManagerGuard from './components/ManagerGuard';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Configuration from './pages/Configuration';
import About from './pages/About';
import NotFound from './pages/NotFound';
import IssSquad from './pages/IssSquad';
import RecorrentesPage from './pages/RecorrentesPage';
import InsightsPage from './pages/InsightsPage';
import AnaliseIA from './pages/AnaliseIA';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ManagerAuthProvider>
          <NavigationLayout>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<About />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/recorrentes" element={<RecorrentesPage />} />

              {/* Rotas restritas a gestores */}
              <Route path="/simulador" element={<ManagerGuard><Simulator /></ManagerGuard>} />
              <Route path="/iss" element={<ManagerGuard><IssSquad /></ManagerGuard>} />
              <Route path="/insights" element={<ManagerGuard><InsightsPage /></ManagerGuard>} />
              <Route path="/analise-ia" element={<ManagerGuard><AnaliseIA /></ManagerGuard>} />
              <Route path="/configuracoes" element={<ManagerGuard><Configuration /></ManagerGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </NavigationLayout>
        </ManagerAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
