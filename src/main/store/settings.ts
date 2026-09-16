import { app } from 'electron';
import { ConfigSchema } from '../../shared/schema';
import type { Config } from '../../shared/types';
import { arquivoConfig, pastaDados } from './paths';
import { escreverJsonAtomico, garantirPasta, lerJson } from './io';

let cache: Config | null = null;

export function obterConfig(): Config {
  if (cache) return cache;
  garantirPasta(pastaDados());
  const bruto = lerJson<unknown>(arquivoConfig()) ?? {};
  const r = ConfigSchema.safeParse(bruto);
  cache = r.success ? r.data : ConfigSchema.parse({});
  return cache;
}

export function salvarConfig(patch: Partial<Config>): Config {
  const atual = obterConfig();
  const proximo = ConfigSchema.parse({ ...atual, ...patch });
  escreverJsonAtomico(arquivoConfig(), proximo);
  cache = proximo;
  if (patch.iniciarComWindows !== undefined) aplicarAutostart(proximo.iniciarComWindows);
  return proximo;
}

/**
 * Item 6 do refinamento: iniciar com o Windows precisa valer no ato, nao so no
 * proximo boot. Em app empacotado registra o proprio executavel; em dev usa o
 * electron com o caminho do projeto, senao o Windows registra o electron cru.
 */
export function aplicarAutostart(ligado: boolean): void {
  try {
    if (app.isPackaged) {
      app.setLoginItemSettings({ openAtLogin: ligado, path: process.execPath, args: [] });
    } else {
      app.setLoginItemSettings({
        openAtLogin: ligado,
        path: process.execPath,
        args: ['--processStart', `"${process.argv[1] ?? ''}"`],
      });
    }
  } catch {
    /* ambiente sem suporte a autostart (Linux de desenvolvimento) */
  }
}
