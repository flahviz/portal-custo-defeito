import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const STORAGE_KEY = 'radar_manager_unlocked';
const MANAGER_CODE = import.meta.env.VITE_MANAGER_CODE as string;

interface ManagerAuthContextValue {
  isManager: boolean;
  requestAccess: () => void;
  logout: () => void;
}

const ManagerAuthContext = createContext<ManagerAuthContextValue>({
  isManager: false,
  requestAccess: () => {},
  logout: () => {},
});

export function useManagerAuth() {
  return useContext(ManagerAuthContext);
}

export function ManagerAuthProvider({ children }: { children: React.ReactNode }) {
  const [isManager, setIsManager] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const requestAccess = useCallback(() => {
    setCode('');
    setError(false);
    setDialogOpen(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsManager(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code === MANAGER_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsManager(true);
      setDialogOpen(false);
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <ManagerAuthContext.Provider value={{ isManager, requestAccess, logout }}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Acesso Gestor
            </DialogTitle>
            <DialogDescription>
              Esta seção é restrita a gestores. Digite o código de acesso para continuar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <Input
              type="password"
              placeholder="Código de acesso"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">Código inválido. Tente novamente.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Entrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ManagerAuthContext.Provider>
  );
}
