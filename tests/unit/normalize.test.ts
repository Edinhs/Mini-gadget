import { describe, expect, it } from 'vitest';
import { chaveDeRotulo, estaNormalizado, normalizar } from '@shared/normalize';

describe('normalizar (SPEC §4.1)', () => {
  it.each([
    [' p.h.e.s ', 'PHES'],
    ['p.h.e.s', 'PHES'],
    ['PHES', 'PHES'],
    ['phes', 'PHES'],
    ['ação', 'ACAO'],
    ['AÇÃO', 'ACAO'],
    ['validação', 'VALIDACAO'],
    ['pp-ap', 'PPAP'],
    ['pp_ap', 'PPAP'],
    ['a/b', 'AB'],
    ['AD&P', 'ADP'],
    ['P&L', 'PL'],
    ['N/A', 'NA'],
    ['DVP&R', 'DVPR'],
    ['1:1', '11'],
    ['', ''],
    ['   ', ''],
    ['...', ''],
    ['&&&', ''],
    ['  ABS  ', 'ABS'],
    ['Allestimento', 'ALLESTIMENTO'],
    ['café com leite', 'CAFE COM LEITE'],
    ['pp  -  ap', 'PP AP'],
    ['ÁÉÍÓÚÂÊÔÃÕÇ', 'AEIOUAEOAOC'],
  ])('normalizar(%j) === %j', (entrada, esperado) => {
    expect(normalizar(entrada)).toBe(esperado);
  });

  it('é idempotente', () => {
    for (const t of ['AD&P', ' p.h.e.s ', 'ação', 'Artificial Network (AN)']) {
      expect(normalizar(normalizar(t))).toBe(normalizar(t));
    }
  });

  it('não junta palavras nem inventa iniciais (§3.2.1)', () => {
    // Reduzir "Artificial Network" a "AN" é curadoria do usuário, não automação.
    expect(normalizar('Artificial Network')).toBe('ARTIFICIAL NETWORK');
  });

  it('é defensiva na fronteira IPC', () => {
    expect(normalizar(undefined as unknown as string)).toBe('');
    expect(normalizar(42 as unknown as string)).toBe('');
  });
});

describe('chaveDeRotulo / estaNormalizado', () => {
  it('deriva a chave a partir da grafia do usuário', () => {
    expect(chaveDeRotulo('AD&P')).toBe('ADP');
    expect(chaveDeRotulo('Allestimento')).toBe('ALLESTIMENTO');
  });

  it('reconhece texto já normalizado', () => {
    expect(estaNormalizado('PPAP')).toBe(true);
    expect(estaNormalizado('AD&P')).toBe(false);
    expect(estaNormalizado('ppap')).toBe(false);
  });
});
