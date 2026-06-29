import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavigationLayout from './components/layout/NavigationLayout';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Configuration from './pages/Configuration';
import About from './pages/About';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <NavigationLayout>
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/simulador" element={<Simulator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/configuracoes" element={<Configuration />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NavigationLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
