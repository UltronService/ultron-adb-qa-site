import { DemoModeProvider } from '../context/demo-mode-context';
import { ToastProvider, ToastViewport } from './ui/toast-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <DemoModeProvider>
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    </DemoModeProvider>
  );
}
