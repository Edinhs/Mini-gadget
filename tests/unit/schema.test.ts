import { describe, expect, it } from 'vitest';
import { ConfigSchema, LIMITES, RepertorioSchema, SentidoSchema, SiglaSchema } from '@shared/schema';

const sentidoBase = {
  id: 'ppap-automotivo-1',
  categoria: 'automotivo' as const,
  en: 'Production Part Approval Process',
  pt: '',
  aplicacao: { contexto: '', exemplo: '', area: '', processo: '', referencia: null },
  tags: [],
  favorito: false,
  acessos: 0,
  revisar: false,
  criadoEm: '2026-09-16T00:00:00.000Z',
  atualizadoEm: '2026-09-16T00:00:00.000Z',
};

describe('SentidoSchema — regra "ao menos um entre en e pt" (SPEC §3.4)', () => {
  it('aceita só inglês', () => {
    expect(SentidoSchema.safeParse(sentidoBase).success).toBe(true);
  });

  it('aceita só português', () => {
    const r = SentidoSchema.safeParse({ ...sentidoBase, en: '', pt: 'Amplificador' });
    expect(r.success).toBe(true);
  });

  it('rejeita os dois vazios', () => {
    const r = SentidoSchema.safeParse({ ...sentidoBase, en: '', pt: '' });
    expect(r.success).toBe(false);
  });

  it('rejeita en só com espaços em branco', () => {
    const r = SentidoSchema.safeParse({ ...sentidoBase, en: '   ', pt: '' });
    expect(r.success).toBe(false);
  });
});

describe('SentidoSchema — limites (SPEC §3.3)', () => {
  it('aceita exatamente no limite', () => {
    const r = SentidoSchema.safeParse({ ...sentidoBase, en: 'x'.repeat(LIMITES.enPt) });
    expect(r.success).toBe(true);
  });

  it('rejeita um caractere acima, sem truncar', () => {
    const r = SentidoSchema.safeParse({ ...sentidoBase, en: 'x'.repeat(LIMITES.enPt + 1) });
    expect(r.success).toBe(false);
  });

  it('rejeita mais de 10 tags', () => {
    const tags = Array.from({ length: LIMITES.tags + 1 }, (_, i) => `t${i}`);
    expect(SentidoSchema.safeParse({ ...sentidoBase, tags }).success).toBe(false);
  });

  it('rejeita acessos negativo', () => {
    expect(SentidoSchema.safeParse({ ...sentidoBase, acessos: -1 }).success).toBe(false);
  });
});

describe('SiglaSchema', () => {
  const base = { sigla: 'PPAP', rotulo: 'PPAP', tipo: 'sigla' as const, sentidos: [sentidoBase] };

  it('aceita sigla normalizada', () => {
    expect(SiglaSchema.safeParse(base).success).toBe(true);
  });

  it('rejeita chave não normalizada', () => {
    expect(SiglaSchema.safeParse({ ...base, sigla: 'AD&P' }).success).toBe(false);
    expect(SiglaSchema.safeParse({ ...base, sigla: 'ppap' }).success).toBe(false);
    expect(SiglaSchema.safeParse({ ...base, sigla: 'PP-AP' }).success).toBe(false);
  });

  it('abre exceção só para rótulo sem nada normalizável (a linha "[" da planilha real)', () => {
    expect(SiglaSchema.safeParse({ ...base, sigla: '[', rotulo: '[' }).success).toBe(true);
    // e mesmo aí exige maiúsculas/trim, para não virar porta dos fundos
    expect(SiglaSchema.safeParse({ ...base, sigla: ' [ ', rotulo: '[' }).success).toBe(false);
  });

  it('preserva a grafia do usuário no rotulo', () => {
    const r = SiglaSchema.safeParse({ ...base, sigla: 'ADP', rotulo: 'AD&P' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rotulo).toBe('AD&P');
  });

  it('exige ao menos um sentido', () => {
    expect(SiglaSchema.safeParse({ ...base, sentidos: [] }).success).toBe(false);
  });

  it('aceita tipo termo', () => {
    expect(SiglaSchema.safeParse({ ...base, sigla: 'ANOMALY', tipo: 'termo' }).success).toBe(true);
  });
});

describe('RepertorioSchema — integridade (SPEC §3.4)', () => {
  const sigla = { sigla: 'PPAP', rotulo: 'PPAP', tipo: 'sigla' as const, sentidos: [sentidoBase] };
  const rep = { schemaVersion: 1 as const, atualizadoEm: '2026-09-16T00:00:00.000Z', siglas: [sigla] };

  it('aceita repertório vazio (1º boot sem carga inicial)', () => {
    expect(RepertorioSchema.safeParse({ ...rep, siglas: [] }).success).toBe(true);
  });

  it('aceita o campo origem', () => {
    expect(RepertorioSchema.safeParse({ ...rep, origem: 'lista do usuário' }).success).toBe(true);
  });

  it('rejeita sigla duplicada no topo', () => {
    expect(RepertorioSchema.safeParse({ ...rep, siglas: [sigla, sigla] }).success).toBe(false);
  });

  it('rejeita id de sentido duplicado entre siglas', () => {
    const outra = { ...sigla, sigla: 'APQP', rotulo: 'APQP' };
    expect(RepertorioSchema.safeParse({ ...rep, siglas: [sigla, outra] }).success).toBe(false);
  });
});

describe('ConfigSchema', () => {
  it('aplica os padrões do SPEC §6.1', () => {
    const c = ConfigSchema.parse({});
    expect(c.atalhoGlobal).toBe('Ctrl+Alt+L');
    expect(c.opacidadeOciosa).toBe(0.35);
    expect(c.tamanhoLupa).toBe(34);
    expect(c.ladoPainel).toBe('auto');
    expect(c.corAcento).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c.tamanhoHistorico).toBe(10);
    expect(c.cargaInicialAplicadaEm).toBeNull();
  });

  it('rejeita opacidade fora da faixa 0,05–1,00', () => {
    expect(ConfigSchema.safeParse({ opacidadeOciosa: 0.01 }).success).toBe(false);
    expect(ConfigSchema.safeParse({ opacidadeOciosa: 1.5 }).success).toBe(false);
  });

  it('limita o tamanho da lupa a 24–72 px', () => {
    expect(ConfigSchema.safeParse({ tamanhoLupa: 20 }).success).toBe(false);
    expect(ConfigSchema.safeParse({ tamanhoLupa: 80 }).success).toBe(false);
    expect(ConfigSchema.safeParse({ tamanhoLupa: 34 }).success).toBe(true);
  });

  it('exige cor de acento em hexadecimal', () => {
    expect(ConfigSchema.safeParse({ corAcento: 'azul' }).success).toBe(false);
    expect(ConfigSchema.safeParse({ corAcento: '#2f6fed' }).success).toBe(true);
  });
});
