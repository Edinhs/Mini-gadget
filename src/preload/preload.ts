/**
 * Ponte renderer ↔ main (SPEC §2 e §6.2). Nada além da LupaAPI atravessa.
 */
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  buscar: (termo: string) => ipcRenderer.invoke('lupa:buscar', termo),
  obter: (sigla: string) => ipcRenderer.invoke('lupa:obter', sigla),
  listar: (filtro?: unknown) => ipcRenderer.invoke('lupa:listar', filtro),
  salvarSentido: (sigla: string, sentido: unknown, tipo?: string) =>
    ipcRenderer.invoke('lupa:salvarSentido', sigla, sentido, tipo),
  duplicarSentido: (sigla: string, id: string) => ipcRenderer.invoke('lupa:duplicarSentido', sigla, id),
  excluirSentido: (sigla: string, id: string) => ipcRenderer.invoke('lupa:excluirSentido', sigla, id),
  excluirSigla: (sigla: string) => ipcRenderer.invoke('lupa:excluirSigla', sigla),
  alternarFavorito: (sigla: string, id: string) => ipcRenderer.invoke('lupa:alternarFavorito', sigla, id),
  registrarAcesso: (sigla: string, id: string) => ipcRenderer.invoke('lupa:registrarAcesso', sigla, id),
  importar: (modo: string) => ipcRenderer.invoke('lupa:importar', modo),
  exportar: (formato: string) => ipcRenderer.invoke('lupa:exportar', formato),
  listarBackups: () => ipcRenderer.invoke('lupa:listarBackups'),
  restaurarBackup: (caminho: string) => ipcRenderer.invoke('lupa:restaurarBackup', caminho),
  historico: () => ipcRenderer.invoke('lupa:historico'),
  obterConfig: () => ipcRenderer.invoke('lupa:obterConfig'),
  salvarConfig: (patch: unknown) => ipcRenderer.invoke('lupa:salvarConfig', patch),
  novoId: (): Promise<string> => ipcRenderer.invoke('lupa:novoId'),
  abrirPastaDados: () => ipcRenderer.invoke('lupa:abrirPastaDados'),
  abrirPainel: () => ipcRenderer.send('lupa:abrirPainel'),
  fecharPainel: () => ipcRenderer.send('lupa:fecharPainel'),
  copiar: (texto: string) => ipcRenderer.send('lupa:copiar', texto),
  bloquearFechamento: (v: boolean) => ipcRenderer.send('lupa:bloquearFechamento', v),
  aoFocarBusca: (cb: () => void) => ipcRenderer.on('lupa:focar-busca', cb),
  aoMudarConfig: (cb: (cfg: unknown) => void) =>
    ipcRenderer.on('lupa:config-mudou', (_e, cfg) => cb(cfg)),
  aoProgredirImport: (cb: (p: unknown) => void) => {
    ipcRenderer.removeAllListeners('lupa:progresso-import');
    ipcRenderer.on('lupa:progresso-import', (_e, p) => cb(p));
  },
  iniciarArraste: (dx: number, dy: number) => ipcRenderer.send('lupa:iniciarArraste', dx, dy),
  pararArraste: () => ipcRenderer.send('lupa:pararArraste'),
  minimizar: () => ipcRenderer.send('lupa:minimizar'),
  ocultarLupa: () => ipcRenderer.send('lupa:ocultarLupa'),
};

contextBridge.exposeInMainWorld('lupa', api);
