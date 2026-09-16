/**
 * Duas janelas (SPEC §2, ADR-3): a lupa flutuante de 48px, sempre no topo, e o
 * painel de busca ancorado a ela.
 */
import { BrowserWindow, screen, app } from 'electron';
import { join } from 'node:path';
import { obterConfig, salvarConfig } from './store/settings';

const TAM_LUPA = 48;
const LARG_PAINEL = 380;
const ALT_PAINEL = 520;

let lupa: BrowserWindow | null = null;
let painel: BrowserWindow | null = null;

const ehDev = !app.isPackaged;

function carregar(win: BrowserWindow, rota: string): void {
  const url = process.env['ELECTRON_RENDERER_URL'];
  if (ehDev && url) void win.loadURL(`${url}?janela=${rota}`);
  else void win.loadFile(join(__dirname, '../renderer/index.html'), { query: { janela: rota } });
}

/** Garante que a posição salva ainda cai dentro de algum monitor (SPEC §5.1). */
function posicaoValida(x: number, y: number): { x: number; y: number } {
  const displays = screen.getAllDisplays();
  const dentro = displays.some(
    (d) => x >= d.bounds.x - TAM_LUPA && x <= d.bounds.x + d.bounds.width && y >= d.bounds.y - TAM_LUPA && y <= d.bounds.y + d.bounds.height,
  );
  if (dentro && x >= 0 && y >= 0) return { x, y };
  const p = screen.getPrimaryDisplay().workArea;
  return { x: p.x + p.width - TAM_LUPA - 24, y: p.y + p.height - TAM_LUPA - 24 };
}

export function criarLupa(): BrowserWindow {
  const cfg = obterConfig();
  const pos = posicaoValida(cfg.posicaoLupa.x, cfg.posicaoLupa.y);

  lupa = new BrowserWindow({
    width: TAM_LUPA,
    height: TAM_LUPA,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  lupa.setAlwaysOnTop(true, 'screen-saver');
  carregar(lupa, 'lupa');
  lupa.once('ready-to-show', () => lupa?.show());
  lupa.on('moved', () => {
    const [x, y] = lupa?.getPosition() ?? [0, 0];
    salvarConfig({ posicaoLupa: { x: x ?? 0, y: y ?? 0 } });
    reposicionarPainel();
  });
  screen.on('display-metrics-changed', () => {
    const [x, y] = lupa?.getPosition() ?? [0, 0];
    const v = posicaoValida(x ?? 0, y ?? 0);
    lupa?.setPosition(v.x, v.y);
  });
  return lupa;
}

export function criarPainel(): BrowserWindow {
  painel = new BrowserWindow({
    width: LARG_PAINEL,
    height: ALT_PAINEL,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  painel.setAlwaysOnTop(true, 'screen-saver');
  carregar(painel, 'painel');
  // SPEC §5.2: fecha ao perder foco, salvo quando o painel está fixado ou há
  // diálogo nativo/edição pendente (o renderer avisa por IPC).
  painel.on('blur', () => {
    if (!obterConfig().fixarPainel && !bloqueioDeFechamento) painel?.hide();
  });
  return painel;
}

let bloqueioDeFechamento = false;
export function bloquearFechamento(v: boolean): void {
  bloqueioDeFechamento = v;
}

function reposicionarPainel(): void {
  if (!painel || !lupa) return;
  const [lx, ly] = lupa.getPosition();
  const area = screen.getDisplayNearestPoint({ x: lx ?? 0, y: ly ?? 0 }).workArea;
  let x = (lx ?? 0) - LARG_PAINEL - 8;
  if (x < area.x) x = (lx ?? 0) + TAM_LUPA + 8;
  let y = ly ?? 0;
  if (y + ALT_PAINEL > area.y + area.height) y = area.y + area.height - ALT_PAINEL - 8;
  if (y < area.y) y = area.y + 8;
  painel.setPosition(Math.round(x), Math.round(y));
}

export function abrirPainel(): void {
  if (!painel) criarPainel();
  reposicionarPainel();
  painel?.show();
  painel?.focus();
  painel?.webContents.send('lupa:focar-busca');
}

export function fecharPainel(): void {
  painel?.hide();
}

export function alternarPainel(): void {
  if (painel?.isVisible()) fecharPainel();
  else abrirPainel();
}

export const janelaLupa = (): BrowserWindow | null => lupa;
export const janelaPainel = (): BrowserWindow | null => painel;
