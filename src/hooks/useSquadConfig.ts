import { useState, useEffect } from 'react';
import { loadSquadConfig, SquadsConfig } from '@/lib/rtcService';

export function useSquadConfig() {
  const [config, setConfig] = useState<SquadsConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSquadConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  return { config, loading };
}
