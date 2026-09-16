import { globalShortcut } from 'electron';
import { obterConfig } from './store/settings';
import { alternarPainel } from './window-manager';

export function registrarAtalho(): boolean {
  globalShortcut.unregisterAll();
  const atalho = obterConfig().atalhoGlobal || 'Ctrl+Alt+L';
  try {
    return globalShortcut.register(atalho, alternarPainel);
  } catch {
    return false;
  }
}
