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
  return proximo;
}
