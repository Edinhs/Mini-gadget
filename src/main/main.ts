/**
 * Processo principal do Lupa.
 */
import { app } from 'electron';
import { registrarHandlers } from './ipc/handlers';
import { criarLupa, abrirPainel, criarPainel } from './window-manager';
import { criarTray } from './tray';
import { registrarAtalho } from './shortcuts';
import * as repo from './store/repository';
import { aplicarCargaInicialSeNecessario } from './store/bootstrap';
import { obterConfig, aplicarAutostart } from './store/settings';

// SPEC §2 — instância única: a segunda execução abre o painel da existente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => abrirPainel());

  void app.whenReady().then(() => {
    repo.carregar();
    const carga = aplicarCargaInicialSeNecessario();
    console.log('[lupa] carga inicial:', carga.motivo);

    registrarHandlers();
    criarLupa();
    criarPainel();
    criarTray();
    const ok = registrarAtalho();
    console.log('[lupa] atalho global:', ok ? obterConfig().atalhoGlobal : 'indisponível');

    aplicarAutostart(obterConfig().iniciarComWindows);
  });

  // O gadget vive na bandeja: fechar o painel não encerra o app.
  app.on('window-all-closed', () => {
    /* mantido vivo pela bandeja */
  });
}
