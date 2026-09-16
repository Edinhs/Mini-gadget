/**
 * Handlers IPC (SPEC §6.2). CLAUDE.md regra 4: tudo validado com Zod antes de
 * tocar no store.
 */
import { clipboard, dialog, ipcMain, shell } from 'electron';
import { z } from 'zod';
import { SentidoSchema, ConfigSchema, FiltroSchema } from '../../shared/schema';
import * as repo from '../store/repository';
import { obterConfig, salvarConfig } from '../store/settings';
import { buscar } from '../services/search';
import { exportar, importar } from '../services/planilha';
import { pastaBackups } from '../store/paths';
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RepertorioSchema } from '../../shared/schema';
import {
  abrirPainel, bloquearFechamento, fecharPainel, difundirConfig,
  iniciarArraste, pararArraste, janelaPainel, janelaLupa,
} from '../window-manager';

const historico: string[] = [];

const Texto = z.string().max(200);

export function registrarHandlers(): void {
  ipcMain.handle('lupa:buscar', (_e, termo: unknown) => {
    const t = Texto.parse(termo);
    const r = buscar(t, repo.todas());
    if (r.resultados.length && t.trim()) {
      const limite = obterConfig().tamanhoHistorico;
      const i = historico.indexOf(t.trim());
      if (i >= 0) historico.splice(i, 1);
      historico.unshift(t.trim());
      historico.length = Math.min(historico.length, limite);
    }
    return r;
  });

  ipcMain.handle('lupa:obter', (_e, sigla: unknown) => repo.obter(Texto.parse(sigla)));
  ipcMain.handle('lupa:listar', (_e, filtro: unknown) =>
    repo.listar(filtro === undefined ? undefined : FiltroSchema.parse(filtro)),
  );

  ipcMain.handle('lupa:salvarSentido', (_e, sigla: unknown, sentido: unknown, tipo: unknown) => {
    repo.salvarSentido(Texto.parse(sigla), SentidoSchema.parse(sentido), tipo === 'termo' ? 'termo' : 'sigla');
  });
  ipcMain.handle('lupa:duplicarSentido', (_e, s: unknown, id: unknown) =>
    repo.duplicarSentido(Texto.parse(s), Texto.parse(id)),
  );
  ipcMain.handle('lupa:excluirSentido', (_e, s: unknown, id: unknown) =>
    repo.excluirSentido(Texto.parse(s), Texto.parse(id)),
  );
  ipcMain.handle('lupa:excluirSigla', (_e, s: unknown) => repo.excluirSigla(Texto.parse(s)));
  ipcMain.handle('lupa:alternarFavorito', (_e, s: unknown, id: unknown) =>
    repo.alternarFavorito(Texto.parse(s), Texto.parse(id)),
  );
  ipcMain.handle('lupa:registrarAcesso', (_e, s: unknown, id: unknown) =>
    repo.registrarAcesso(Texto.parse(s), Texto.parse(id)),
  );

  ipcMain.handle('lupa:importar', async (_e, modo: unknown) => {
    bloquearFechamento(true);
    try {
      const r = await dialog.showOpenDialog({
        title: 'Importar siglas',
        filters: [{ name: 'Planilha ou JSON', extensions: ['xlsx', 'xls', 'csv', 'json'] }],
        properties: ['openFile'],
      });
      if (r.canceled || !r.filePaths[0]) return null;
      const painel = janelaPainel();
      try {
        return importar(r.filePaths[0], modo === 'substituir' ? 'substituir' : 'merge', (p) =>
          painel?.webContents.send('lupa:progresso-import', p),
        );
      } catch (e) {
        // Melhor devolver o motivo do que rejeitar o invoke e a tela nao dizer nada.
        return {
          inseridos: 0, atualizados: 0, ignorados: 0, backupCriado: '',
          erros: [{ linha: 0, campo: 'arquivo', mensagem: e instanceof Error ? e.message : 'falha ao ler o arquivo' }],
        };
      }
    } finally {
      bloquearFechamento(false);
    }
  });

  ipcMain.handle('lupa:exportar', async (_e, formato: unknown) => {
    const f = z.enum(['json', 'csv', 'xlsx']).parse(formato);
    bloquearFechamento(true);
    try {
      const r = await dialog.showSaveDialog({
        title: 'Exportar repertório',
        defaultPath: `repertorio-lupa.${f}`,
        filters: [{ name: f.toUpperCase(), extensions: [f] }],
      });
      if (r.canceled || !r.filePath) return '';
      return exportar(r.filePath, f);
    } finally {
      bloquearFechamento(false);
    }
  });

  ipcMain.handle('lupa:listarBackups', () => {
    const pasta = pastaBackups();
    if (!existsSync(pasta)) return [];
    return readdirSync(pasta)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse()
      .map((f) => ({ caminho: join(pasta, f), data: statSync(join(pasta, f)).mtime.toISOString() }));
  });

  ipcMain.handle('lupa:restaurarBackup', (_e, caminho: unknown) => {
    const c = z.string().parse(caminho);
    const r = RepertorioSchema.safeParse(JSON.parse(readFileSync(c, 'utf-8')));
    if (!r.success) throw new Error('backup inválido');
    repo.substituir(r.data);
  });

  ipcMain.handle('lupa:historico', () => [...historico]);
  ipcMain.handle('lupa:obterConfig', () => obterConfig());
  ipcMain.handle('lupa:salvarConfig', (_e, patch: unknown) => {
    const cfg = salvarConfig(ConfigSchema.partial().parse(patch));
    // Tema, tamanho, opacidade e transparencia valem na hora, nas duas janelas.
    difundirConfig();
    return cfg;
  });
  ipcMain.handle('lupa:novoId', () => repo.novoId());
  ipcMain.handle('lupa:abrirPastaDados', () => shell.openPath(pastaBackups()));

  ipcMain.on('lupa:abrirPainel', () => abrirPainel());
  ipcMain.on('lupa:fecharPainel', () => fecharPainel());
  ipcMain.on('lupa:copiar', (_e, texto: unknown) => clipboard.writeText(String(texto ?? '')));
  ipcMain.on('lupa:iniciarArraste', (_e, dx: unknown, dy: unknown) =>
    iniciarArraste(Number(dx) || 0, Number(dy) || 0),
  );
  ipcMain.on('lupa:pararArraste', () => pararArraste());
  ipcMain.on('lupa:minimizar', () => janelaPainel()?.hide());
  ipcMain.on('lupa:ocultarLupa', () => janelaLupa()?.hide());
  ipcMain.on('lupa:bloquearFechamento', (_e, v: unknown) => bloquearFechamento(Boolean(v)));
  ipcMain.handle('lupa:ping', () => 'pong');
}
