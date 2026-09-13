import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAgentBaseUrl } from '../api/agent-client';
import { getMockDevices } from '../lib/map-mock-device';

export interface DemoModeContextValue {
  isDemoMode: boolean;
  agentOnline: boolean;
  onlineDeviceCount: number;
  refreshAgentStatus: () => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

async function probeAgent(): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${getAgentBaseUrl()}/api/devices`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [agentOnline, setAgentOnline] = useState(false);

  const refreshAgentStatus = useCallback(async () => {
    const online = await probeAgent();
    setAgentOnline(online);
    setIsDemoMode(!online);
  }, []);

  useEffect(() => {
    void refreshAgentStatus();
  }, [refreshAgentStatus]);

  const onlineDeviceCount = useMemo(
    () => getMockDevices().filter((device) => device.online).length,
    [],
  );

  const value = useMemo(
    () => ({
      isDemoMode,
      agentOnline,
      onlineDeviceCount: agentOnline ? onlineDeviceCount : onlineDeviceCount,
      refreshAgentStatus,
    }),
    [agentOnline, isDemoMode, onlineDeviceCount, refreshAgentStatus],
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode(): DemoModeContextValue {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
}
