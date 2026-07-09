import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useManagerAuth } from '@/contexts/ManagerAuthContext';

export default function ManagerGuard({ children }: { children: React.ReactNode }) {
  const { isManager, requestAccess } = useManagerAuth();

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="rounded-full bg-muted p-5">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Esta seção é exclusiva para gestores.
          </p>
        </div>
        <Button onClick={requestAccess}>Entrar com código de gestor</Button>
      </div>
    );
  }

  return <>{children}</>;
}
