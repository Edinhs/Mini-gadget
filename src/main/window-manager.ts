/**
 * Duas janelas (SPEC §2, ADR-3): a lupa flutuante e o painel de busca.
 * Tamanho, lado e transparência vêm da configuração do usuário.
 */
import { BrowserWindow, screen, app } from 'electron';
import { join } from 'node:path';
import { obterConfig, salvarConfig } from './store/settings';

const LARG_PAINEL = 400;
const ALT_PAINEL = 560;

let lupa: BrowserWindow | null = null;
let painel: BrowserWindow | null = null;
let arrasteTimer: NodeJS.Timeout | null = null;

const ehDev = !app.isPackaged;

function carregar(win: BrowserWindow, rota: string): void {
  const url = process.env['ELECTRON_RENDERER_URL'];
  if (ehDev && url) void win.loadURL(`${url}?janela=${rota}`);
  else void win.loadFile(join(__dirname, '../renderer/index.html'), { query: { janela: rota } });
}

/** Mantém a lupa dentro de algum monitor (SPEC §5.1). */
function posicaoValida(x: number, y: number, tam: number): { x: number; y: number } {
  const dentro = screen.getAllDisplays().some(
    (d) => x >= d.bounds.x - tam && x <= d.bounds.x + d.bounds.width && y >= d.bounds.y - tam && y <= d.bounds.y + d.bounds.height,
  );
  if (dentro) return { x, y };
  const p = screen.getPrimaryDisplay().workArea;
  return { x: p.x + p.width - tam - 24, y: p.y + p.height - tam - 80 };
}

export function criarLupa(): BrowserWindow {
  const cfg = obterConfig();
  const tam = cfg.tamanhoLupa;
  const salva = cfg.posicaoLupa;
  const pos = salva.x < 0 || salva.y < 0 ? posicaoValida(-1, -1, tam) : posicaoValida(salva.x, salva.y, tam);

  lupa = new BrowserWindow({
    width: tam, height: tam, x: pos.x, y: pos.y,
    frame: false, transparent: true, resizable: false, movable: true,
    skipTaskbar: true, alwaysOnTop: true, show: false, hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  lupa.setAlwaysOnTop(true, 'screen-saver');
  lupa.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  carregar(lupa, 'lupa');
  lupa.once('ready-to-show', () => lupa?.show());

  screen.on('display-metrics-changed', () => {
    if (!lupa) return;
    const [x, y] = lupa.getPosition();
    const v = posicaoValida(x ?? 0, y ?? 0, obterConfig().tamanhoLupa);
    lupa.setPosition(v.x, v.y);
  });
  return lupa;
}

/** Redimensiona a lupa sem recriar a janela (item 2 do refinamento). */
export function aplicarTamanhoLupa(tam: number): void {
  if (!lupa) return;
  const [x, y] = lupa.getPosition();
  lupa.setBounds({ x: x ?? 0, y: y ?? 0, width: tam, height: tam });
}

/**
 * Arraste livre: o renderer avisa quando o botão desce e o main passa a seguir
 * o cursor. Mais confiável que `-webkit-app-region: drag` em janela transparente,
 * e permite mover para qualquer ponto de qualquer monitor.
 */
export function iniciarArraste(offsetX: number, offsetY: number): void {
  pararArraste();
  arrasteTimer = setInterval(() => {
    if (!lupa) return;
    const p = screen.getCursorScreenPoint();
    lupa.setPosition(Math.round(p.x - offsetX), Math.round(p.y - offsetY));
  }, 8);
}

export function pararArraste(): void {
  if (arrasteTimer) { clearInterval(arrasteTimer); arrasteTimer = null; }
  if (!lupa) return;
  const [x, y] = lupa.getPosition();
  salvarConfig({ posicaoLupa: { x: x ?? 0, y: y ?? 0 } });
  reposicionarPainel();
}

export function criarPainel(): BrowserWindow {
  painel = new BrowserWindow({
    width: LARG_PAINEL, height: ALT_PAINEL,
    frame: false, resizable: false, skipTaskbar: true,
    alwaysOnTop: true, show: false, transparent: true, hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  painel.setAlwaysOnTop(true, 'screen-saver');
  carregar(painel, 'painel');
  painel.on('blur', () => {
    if (!obterConfig().fixarPainel && !bloqueioDeFechamento) painel?.hide();
  });
  return painel;
}

let bloqueioDeFechamento = false;
export function bloquearFechamento(v: boolean): void { bloqueioDeFechamento = v; }

function reposicionarPainel(): void {
  if (!painel || !lupa) return;
  const cfg = obterConfig();
  const tam = cfg.tamanhoLupa;
  const [lx, ly] = lupa.getPosition();
  const area = screen.getDisplayNearestPoint({ x: lx ?? 0, y: ly ?? 0 }).workArea;

  const cabeEsquerda = (lx ?? 0) - LARG_PAINEL - 10 >= area.x;
  let aEsquerda: boolean;
  if (cfg.ladoPainel === 'esquerda') aEsquerda = true;
  else if (cfg.ladoPainel === 'direita') aEsquerda = false;
  else aEsquerda = cabeEsquerda;

  let x = aEsquerda ? (lx ?? 0) - LARG_PAINEL - 10 : (lx ?? 0) + tam + 10;
  x = Math.min(Math.max(x, area.x + 4), area.x + area.width - LARG_PAINEL - 4);

  let y = (ly ?? 0) + tam / 2 - ALT_PAINEL / 2;
  y = Math.min(Math.max(y, area.y + 4), area.y + area.height - ALT_PAINEL - 4);

  painel.setPosition(Math.round(x), Math.round(y));
}

export function abrirPainel(): void {
  if (!painel) criarPainel();
  reposicionarPainel();
  painel?.show();
  painel?.focus();
  painel?.webContents.send('lupa:focar-busca');
}

export function fecharPainel(): void { painel?.hide(); }

export function alternarPainel(): void {
  if (painel?.isVisible()) fecharPainel();
  else abrirPainel();
}

/** Propaga a configuração para as duas janelas: tema e aparência mudam na hora. */
export function difundirConfig(): void {
  const cfg = obterConfig();
  for (const w of [lupa, painel]) w?.webContents.send('lupa:config-mudou', cfg);
  aplicarTamanhoLupa(cfg.tamanhoLupa);
  reposicionarPainel();
}

export const janelaLupa = (): BrowserWindow | null => lupa;
export const janelaPainel = (): BrowserWindow | null => painel;
