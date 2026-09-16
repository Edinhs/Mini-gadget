/**
 * Import ponta a ponta: gera um .xlsx real, lê com a mesma biblioteca do app,
 * aplica a detecção de formato e valida cada linha contra o schema.
 *
 * Este é o teste que faltava: os testes de unidade passavam enquanto o import
 * ignorava todas as linhas por causa do `id` vazio.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { SentidoSchema } from '@shared/schema';
import { normalizar } from '@shared/normalize';
import {
  ehCabecalhoCompleto, idiomaDoSignificado, lerLinhaSimples, montarSentido,
} from '../../src/main/services/formato-planilha';

const pasta = mkdtempSync(join(tmpdir(), 'lupa-'));
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

function criarXlsx(nome: string, linhas: unknown[][]): string {
  const caminho = join(pasta, nome);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), 'Siglas');
  XLSX.writeFile(wb, caminho);
  return caminho;
}

/** Reproduz o pipeline de `importar()` sem depender do Electron. */
function processar(caminho: string): { validos: number; erros: string[]; primeiro?: unknown } {
  const wb = XLSX.readFile(caminho);
  const aba = wb.Sheets[wb.SheetNames[0]!]!;
  const cruas = XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: '', raw: false, blankrows: false });

  let linhas: Record<string, string>[];
  if (ehCabecalhoCompleto(cruas[0] ?? [])) {
    linhas = XLSX.utils.sheet_to_json<Record<string, string>>(aba, { defval: '', raw: false });
  } else {
    linhas = [];
    for (const celulas of cruas) {
      const simples = lerLinhaSimples(celulas);
      if (!simples) continue;
      const campo = idiomaDoSignificado(simples.significado);
      linhas.push({
        id: '', sigla: simples.rotulo, rotulo: simples.rotulo, tipo: 'sigla', categoria: 'generico',
        en: campo === 'en' ? simples.significado : '',
        pt: campo === 'pt' ? simples.significado : '',
        original: '', contexto: simples.aplicacao,
        exemplo: '', area: '', processo: '', referencia: '',
        tags: '', favorito: 'nao', criadoEm: '', atualizadoEm: '',
      });
    }
  }

  const erros: string[] = [];
  let validos = 0;
  let primeiro: unknown;
  let n = 0;
  for (const l of linhas) {
    const candidato = montarSentido(l, undefined, () => `gerado-${++n}`);
    const r = SentidoSchema.safeParse(candidato);
    if (r.success) { validos += 1; primeiro ??= r.data; }
    else erros.push(r.error.issues[0]?.message ?? 'erro');
  }
  return { validos, erros, primeiro };
}

describe('planilha simples de 3 colunas', () => {
  it('importa todas as linhas — nenhuma é engolida', () => {
    const c = criarXlsx('tres.xlsx', [
      ['ABS', 'Antilock Brake System', 'Sistema de freios'],
      ['APQP', 'Advanced Product Quality Planning', 'Qualidade'],
      ['PPAP', 'Production Part Approval Process', 'Validação de fornecedor'],
    ]);
    const r = processar(c);
    expect(r.erros).toEqual([]);
    expect(r.validos).toBe(3);
  });

  it('coloca a 3ª coluna no contexto de aplicação', () => {
    const c = criarXlsx('ctx.xlsx', [['ABS', 'Antilock Brake System', 'Sistema de freios']]);
    expect(processar(c).primeiro).toMatchObject({
      en: 'Antilock Brake System',
      aplicacao: { contexto: 'Sistema de freios' },
      revisar: true,
    });
  });
});

describe('planilha simples de 2 colunas', () => {
  it('importa sem a coluna de aplicação', () => {
    const c = criarXlsx('duas.xlsx', [
      ['AEB', 'Autonomous Emergency Brake'],
      ['ACC', 'Adaptive Cruise Control'],
    ]);
    const r = processar(c);
    expect(r.erros).toEqual([]);
    expect(r.validos).toBe(2);
    expect(r.primeiro).toMatchObject({ aplicacao: { contexto: '' } });
  });

  it('manda significado em português para o campo pt', () => {
    const c = criarXlsx('pt.xlsx', [['BOM', 'Lista de Materiais']]);
    expect(processar(c).primeiro).toMatchObject({ en: '', pt: 'Lista de Materiais' });
  });
});

describe('planilha completa com cabeçalho', () => {
  it('importa o formato que o próprio export gera', () => {
    const c = criarXlsx('completa.xlsx', [
      ['id', 'sigla', 'rotulo', 'tipo', 'categoria', 'en', 'pt', 'original', 'contexto', 'exemplo', 'area', 'processo', 'referencia', 'tags', 'favorito', 'criadoEm', 'atualizadoEm'],
      ['ppap-1', 'PPAP', 'PPAP', 'sigla', 'automotivo', 'Production Part Approval Process', '', '', 'ctx', 'ex', 'Qualidade', 'Validação', 'AIAG', 'a;b', 'sim', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'],
    ]);
    const r = processar(c);
    expect(r.erros).toEqual([]);
    expect(r.validos).toBe(1);
    expect(r.primeiro).toMatchObject({ id: 'ppap-1', favorito: true, tags: ['a', 'b'] });
  });

  it('gera id quando a planilha tem a coluna id em branco', () => {
    const c = criarXlsx('sem-id.xlsx', [
      ['id', 'sigla', 'categoria', 'en'],
      ['', 'ABS', 'automotivo', 'Antilock Brake System'],
    ]);
    const r = processar(c);
    expect(r.erros).toEqual([]);
    expect(r.validos).toBe(1);
  });
});

describe('casos que devem ser reportados, não engolidos', () => {
  it('linha sem sigla é descartada antes de virar erro', () => {
    const c = criarXlsx('vazia.xlsx', [['ABS', 'Antilock Brake System'], ['', 'sem sigla nenhuma']]);
    expect(processar(c).validos).toBe(1);
  });

  it('linha sem significado nenhum é reportada', () => {
    const c = criarXlsx('sem-sig.xlsx', [['ABS', '']]);
    const r = processar(c);
    expect(r.validos).toBe(0);
    expect(r.erros[0]).toMatch(/ingl|portugu|origem/i);
  });

  it('a chave normalizada da sigla sai correta', () => {
    expect(normalizar('AD&P')).toBe('ADP');
  });
});
