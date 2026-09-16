/**
 * Processo principal — esqueleto da Onda 1 (T-01).
 *
 * Janela flutuante, bandeja, atalho global e IPC entram nas Ondas 2 e 3
 * (ver docs/SPR.md). Aqui só o ciclo de vida e a postura de segurança do
 * SPEC §2, que é o que todo o resto vai herdar.
 */
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

const ehDev = !app.isPackaged;

/** SPEC §2 — instância única: a segunda execução foca a existente. */
const conseguiuLock = app.requestSingleInstanceLock();
if (!conseguiuLock) {
  app.quit();
}

let janela: BrowserWindow | null = null;

function criarJanela(): void {
  janela = new BrowserWindow({
    width: 380,
    height: 520,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      // CLAUDE.md regra 3 — o renderer nunca toca no sistema direto.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  janela.once('ready-to-show', () => janela?.show());
  janela.on('closed', () => {
    janela = null;
  });

  if (ehDev && process.env['ELECTRON_RENDERER_URL']) {
    void janela.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void janela.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.on('second-instance', () => {
  if (janela) {
    if (janela.isMinimized()) janela.restore();
    janela.focus();
  }
});

void app.whenReady().then(criarJanela);

// Windows é o alvo (SPEC §8/RNF6): fechar a última janela encerra o app.
// Isso muda na Onda 2, quando o gadget passa a viver na bandeja.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
