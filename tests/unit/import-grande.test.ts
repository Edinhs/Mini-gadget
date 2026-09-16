/**
 * Import de lista grande, com as características medidas na planilha real do
 * usuário (749 linhas, 2 colunas, sem cabeçalho):
 *   - definições longas, de até ~410 caracteres;
 *   - rótulos descritivos de até ~50 caracteres;
 *   - uma "sigla" formada só por pontuação ("[");
 *   - uma linha sem significado nenhum.
 * A planilha dele não entra no repositório: o conteúdo é interno. O teste
 * recria as condições.
 */
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { SentidoSchema, SiglaSchema } from '@shared/schema';
import { chaveDeRotulo } from '@shared/normalize';
import { ehCabecalhoCompleto, idiomaDoSignificado, lerLinhaSimples, montarSentido } from '../../src/main/services/formato-planilha';

const pasta = mkdtempSync(join(tmpdir(), 'lupa-grande-'));
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

const DEFINICAO_LONGA =
  'Approves: the one who is responsible for the correct and accurate realization of the activity or objective. ' +
  'In other words, this role needs to approve the activities of the Manager, this also includes the right to veto. ' +
  'An only approver can be assigned for each action, and the approval must be registered before the next gate. ' +
  'This description exists to exercise long definitions coming from a real glossary.';

function planilhaGrande(): string {
  const linhas: unknown[][] = [];
  linhas.push(['(D)FMEA ', ' (Design) Failure Mode and Effects Analysis']);
  linhas.push(['[', DEFINICAO_LONGA]);                                  // só pontuação
  linhas.push(['Kalman Filter or linear quadratic estimation (LQE)', DEFINICAO_LONGA]); // rótulo longo
  linhas.push(['NLC', '']);                                            // sem significado
  linhas.push(['“AS IS” Process ', ' An “AS IS” process represents the current situation.']);
  for (let i = 0; i < 744; i++) {
    linhas.push([`SIG${i}`, i % 3 === 0 ? `Definição em português número ${i}` : `English meaning number ${i}`]);
  }
  const caminho = join(pasta, 'grande.xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(linhas), 'Planilha1');
  writeFileSync(caminho, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
  return caminho;
}

interface Resultado { validos: number; erros: { rotulo: string; motivo: string }[]; chaves: string[] }

function processar(caminho: string): Resultado {
  // Lê por buffer — é assim que o app faz, porque o SheetJS empacotado não
  // enxerga o `fs` do Node e `readFile` falha com "Cannot access file".
  const wb = XLSX.read(readFileSync(caminho), { type: 'buffer' });
  const aba = wb.Sheets[wb.SheetNames[0]!]!;
  const cruas = XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: '', raw: false, blankrows: false });
  expect(ehCabecalhoCompleto(cruas[0] ?? [])).toBe(false);

  const erros: Resultado['erros'] = [];
  const chaves: string[] = [];
  let validos = 0;
  let n = 0;

  for (const celulas of cruas) {
    const simples = lerLinhaSimples(celulas);
    if (!simples) continue;
    const chave = chaveDeRotulo(simples.rotulo);
    const campo = idiomaDoSignificado(simples.significado);
    const cand = montarSentido(
      {
        id: '', categoria: 'generico',
        en: campo === 'en' ? simples.significado : '',
        pt: campo === 'pt' ? simples.significado : '',
        contexto: simples.aplicacao,
      },
      undefined,
      () => `g-${++n}`,
    );
    const rs = SentidoSchema.safeParse(cand);
    if (!rs.success) { erros.push({ rotulo: simples.rotulo, motivo: rs.error.issues[0]?.message ?? '' }); continue; }
    const rg = SiglaSchema.safeParse({ sigla: chave, rotulo: simples.rotulo.trim(), tipo: 'sigla', sentidos: [rs.data] });
    if (!rg.success) { erros.push({ rotulo: simples.rotulo, motivo: rg.error.issues[0]?.message ?? '' }); continue; }
    validos += 1;
    chaves.push(chave);
  }
  return { validos, erros, chaves };
}

describe('lista grande no formato real do usuário', () => {
  const r = processar(planilhaGrande());

  it('importa 748 das 749 linhas', () => {
    expect(r.validos).toBe(748);
  });

  it('a única recusa é a linha sem significado, e ela é reportada', () => {
    expect(r.erros).toHaveLength(1);
    expect(r.erros[0]?.rotulo).toBe('NLC');
    expect(r.erros[0]?.motivo).toMatch(/ingl|portugu|origem/i);
  });

  it('aceita definição de mais de 400 caracteres', () => {
    expect(DEFINICAO_LONGA.length).toBeGreaterThan(400);
    expect(r.chaves).toContain('KALMAN FILTER OR LINEAR QUADRATIC ESTIMATION LQE');
  });

  it('não perde o rótulo formado só por pontuação', () => {
    expect(r.chaves).toContain('[');
  });

  it('normaliza parênteses e aspas curvas na chave', () => {
    expect(r.chaves).toContain('DFMEA');
    expect(r.chaves).toContain('AS IS PROCESS');
  });

  it('gera uma chave única por linha, sem colisão', () => {
    expect(new Set(r.chaves).size).toBe(r.chaves.length);
  });
});
