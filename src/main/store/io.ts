/**
 * Escrita atômica + backup rotativo (CLAUDE.md regra 5, SPEC §3.1).
 * Nunca escreve direto no arquivo final: grava .tmp e renomeia.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_BACKUPS = 5;

export function lerJson<T>(caminho: string): T | null {
  if (!existsSync(caminho)) return null;
  try {
    return JSON.parse(readFileSync(caminho, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function escreverJsonAtomico(caminho: string, dados: unknown): void {
  const tmp = `${caminho}.tmp`;
  writeFileSync(tmp, JSON.stringify(dados, null, 2), 'utf-8');
  renameSync(tmp, caminho);
}

/** Copia o arquivo atual para backups/ e mantém apenas os MAX_BACKUPS mais recentes. */
export function criarBackup(origem: string, pastaBackups: string): string {
  if (!existsSync(origem)) return '';
  mkdirSync(pastaBackups, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
  const destino = join(pastaBackups, `repertorio-${carimbo}.json`);
  copyFileSync(origem, destino);

  const antigos = readdirSync(pastaBackups)
    .filter((f) => f.startsWith('repertorio-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(MAX_BACKUPS);
  for (const f of antigos) rmSync(join(pastaBackups, f), { force: true });

  return destino;
}

export function hashArquivo(caminho: string): string {
  if (!existsSync(caminho)) return '';
  return createHash('sha256').update(readFileSync(caminho)).digest('hex');
}

export function garantirPasta(caminho: string): void {
  mkdirSync(caminho, { recursive: true });
}
