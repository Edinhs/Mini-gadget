/**
 * Prova que o contrato serve para o DADO REAL do usuário, não só para o exemplo
 * bonito do SPEC. Se este teste quebrar, o schema está errado — o dado não.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RepertorioSchema } from '@shared/schema';
import { estaNormalizado } from '@shared/normalize';

const CAMINHO = resolve(__dirname, '../../data/carga-inicial.json');

describe('data/carga-inicial.json', () => {
  it('existe e é JSON válido', () => {
    expect(existsSync(CAMINHO)).toBe(true);
    expect(() => JSON.parse(readFileSync(CAMINHO, 'utf-8'))).not.toThrow();
  });

  it('valida inteiro contra o RepertorioSchema', () => {
    const bruto = JSON.parse(readFileSync(CAMINHO, 'utf-8'));
    const r = RepertorioSchema.safeParse(bruto);
    if (!r.success) console.error(JSON.stringify(r.error.issues.slice(0, 5), null, 2));
    expect(r.success).toBe(true);
  });

  it('tem toda chave normalizada e todo sentido com en, pt ou original', () => {
    const rep = RepertorioSchema.parse(JSON.parse(readFileSync(CAMINHO, 'utf-8')));
    for (const g of rep.siglas) {
      expect(estaNormalizado(g.sigla)).toBe(true);
      for (const s of g.sentidos) {
        expect(s.en.trim().length + s.pt.trim().length + s.original.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('marca as entradas importadas para conferência do usuário', () => {
    const rep = RepertorioSchema.parse(JSON.parse(readFileSync(CAMINHO, 'utf-8')));
    const sentidos = rep.siglas.flatMap((g) => g.sentidos);
    expect(sentidos.every((s) => s.revisar)).toBe(true);
  });
});
