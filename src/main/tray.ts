import { app, Menu, Tray, nativeImage } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { abrirPainel, janelaLupa } from './window-manager';

let tray: Tray | null = null;

function icone(): Electron.NativeImage {
  const candidatos = [
    join(process.resourcesPath ?? '', 'build', 'tray.png'),
    join(app.getAppPath(), 'build', 'tray.png'),
  ];
  const c = candidatos.find((p) => p && existsSync(p));
  return c ? nativeImage.createFromPath(c) : nativeImage.createEmpty();
}

export function criarTray(): Tray {
  tray = new Tray(icone());
  tray.setToolTip('Lupa — consulta de siglas');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir busca', click: () => abrirPainel() },
      { label: 'Mostrar/ocultar a lupa', click: () => {
          const l = janelaLupa();
          if (l?.isVisible()) l.hide(); else l?.show();
        } },
      { type: 'separator' },
      { label: 'Sair', click: () => app.exit(0) },
    ]),
  );
  tray.on('click', () => abrirPainel());
  return tray;
}
