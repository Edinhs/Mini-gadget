/**
 * Ponte renderer ↔ main (SPEC §2). Esqueleto da Onda 1: a superfície `LupaAPI`
 * completa é publicada na Onda 3, junto com os handlers IPC (T-20).
 *
 * Regra: nada além do que está em `LupaAPI` atravessa esta ponte.
 */
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  /** Sonda usada só para validar a ponte no esqueleto. Sai na Onda 3. */
  ping: (): Promise<string> => ipcRenderer.invoke('lupa:ping'),
} as const;

contextBridge.exposeInMainWorld('lupa', api);
