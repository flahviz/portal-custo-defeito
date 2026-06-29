/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/portal-custo-defeito/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), componentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    ui: true,
    open: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        // Excluir componentes UI não utilizados
        'src/components/ui/accordion.tsx',
        'src/components/ui/alert-dialog.tsx',
        'src/components/ui/alert.tsx',
        'src/components/ui/aspect-ratio.tsx',
        'src/components/ui/avatar.tsx',
        'src/components/ui/breadcrumb.tsx',
        'src/components/ui/calendar.tsx',
        'src/components/ui/carousel.tsx',
        'src/components/ui/collapsible.tsx',
        'src/components/ui/command.tsx',
        'src/components/ui/context-menu.tsx',
        'src/components/ui/drawer.tsx',
        'src/components/ui/dropdown-menu.tsx',
        'src/components/ui/form.tsx',
        'src/components/ui/hover-card.tsx',
        'src/components/ui/input-otp.tsx',
        'src/components/ui/menubar.tsx',
        'src/components/ui/navigation-menu.tsx',
        'src/components/ui/pagination.tsx',
        'src/components/ui/popover.tsx',
        'src/components/ui/progress.tsx',
        'src/components/ui/radio-group.tsx',
        'src/components/ui/resizable.tsx',
        'src/components/ui/scroll-area.tsx',
        'src/components/ui/sheet.tsx',
        'src/components/ui/sidebar.tsx',
        'src/components/ui/skeleton.tsx',
        'src/components/ui/slider.tsx',
        'src/components/ui/switch.tsx',
        'src/components/ui/table.tsx',
        'src/components/ui/tabs.tsx',
        'src/components/ui/textarea.tsx',
        'src/components/ui/toggle-group.tsx',
        'src/components/ui/toggle.tsx',
        // Excluir hooks não utilizados
        'src/hooks/use-mobile.tsx',
        // Excluir dados de exemplo
        'src/sampleData.ts',
        // Excluir tipos (apenas definições)
        'src/types/**',
        // Excluir main.tsx (ponto de entrada)
        'src/main.tsx',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
  },
});
