/**
 * Primeiro boot (SPEC §3.2.1). Regras:
 *  - sem carga inicial → repertório vazio, app abre normalmente;
 *  - com carga inicial → aplica UMA vez, marcando data e hash em config;
 *  - carga corrompida → app abre vazio, registra o erro, nunca trava.
 */
import { app } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RepertorioSchema } from '../../shared/schema';
import { lerJson, hashArquivo } from './io';
import { obterConfig, salvarConfig } from './settings';
import * as repo from './repository';

function caminhoCargaInicial(): string {
  const candidatos = [
    join(process.resourcesPath ?? '', 'data', 'carga-inicial.json'),
    join(app.getAppPath(), 'data', 'carga-inicial.json'),
    join(app.getAppPath(), '..', 'data', 'carga-inicial.json'),
  ];
  return candidatos.find((c) => c && existsSync(c)) ?? '';
}

export function aplicarCargaInicialSeNecessario(): { aplicada: boolean; motivo: string } {
  const cfg = obterConfig();
  if (cfg.cargaInicialAplicadaEm) return { aplicada: false, motivo: 'já aplicada anteriormente' };

  const caminho = caminhoCargaInicial();
  if (!caminho) return { aplicada: false, motivo: 'sem arquivo de carga inicial' };

  const bruto = lerJson<unknown>(caminho);
  if (bruto === null) return { aplicada: false, motivo: 'carga inicial ilegível' };

  const r = RepertorioSchema.safeParse(bruto);
  if (!r.success) {
    console.error('[lupa] carga inicial inválida:', r.error.issues.slice(0, 3));
    return { aplicada: false, motivo: 'carga inicial inválida' };
  }

  const atual = repo.todas();
  if (atual.length > 0) return { aplicada: false, motivo: 'repertório já tem conteúdo' };

  repo.substituir(r.data);
  salvarConfig({ cargaInicialAplicadaEm: new Date().toISOString(), cargaInicialHash: hashArquivo(caminho) });
  return { aplicada: true, motivo: `${r.data.siglas.length} siglas importadas` };
}
