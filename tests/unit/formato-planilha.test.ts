import { describe, expect, it } from 'vitest';
import { ehCabecalhoCompleto, idiomaDoSignificado, lerLinhaSimples } from '../../src/main/services/formato-planilha';

describe('detecção de formato da planilha', () => {
  it('reconhece o cabeçalho do formato completo (o que o export gera)', () => {
    expect(ehCabecalhoCompleto(['id', 'sigla', 'rotulo', 'tipo', 'categoria', 'en', 'pt'])).toBe(true);
  });

  it('reconhece cabeçalho com acento e caixa diferente', () => {
    expect(ehCabecalhoCompleto(['Sigla', 'Rótulo', 'Área'])).toBe(true);
  });

  it('não confunde uma lista simples com cabeçalho', () => {
    expect(ehCabecalhoCompleto(['ABS', 'Antilock Brake System', 'Freios'])).toBe(false);
    expect(ehCabecalhoCompleto(['APQP', 'Advanced Product Quality Planning'])).toBe(false);
  });

  it('exige duas colunas conhecidas: uma sigla chamada "ID" não vira cabeçalho', () => {
    expect(ehCabecalhoCompleto(['ID', 'Identificação do veículo', 'Engenharia'])).toBe(false);
  });
});

describe('idioma do significado solto', () => {
  it.each([
    ['Advanced Product Quality Planning', 'en'],
    ['Antilock Brake System', 'en'],
    ['Alternator', 'en'],
    ['Processo de Aprovação de Peça', 'pt'],
    ['Modelo / versão', 'pt'],
    ['Amplificador', 'pt'],
    ['Lista de Materiais', 'pt'],
    ['', 'en'],
  ])('%j → %s', (texto, esperado) => {
    expect(idiomaDoSignificado(texto)).toBe(esperado);
  });
});

describe('leitura da linha simples', () => {
  it('lê as três colunas', () => {
    expect(lerLinhaSimples(['ABS', 'Antilock Brake System', 'Freios'])).toEqual({
      rotulo: 'ABS', significado: 'Antilock Brake System', aplicacao: 'Freios',
    });
  });

  it('aceita só duas colunas, com aplicação vazia', () => {
    expect(lerLinhaSimples(['AEB', 'Autonomous Emergency Brake'])).toEqual({
      rotulo: 'AEB', significado: 'Autonomous Emergency Brake', aplicacao: '',
    });
  });

  it('ignora linha sem sigla', () => {
    expect(lerLinhaSimples(['', 'sem sigla'])).toBeNull();
    expect(lerLinhaSimples([])).toBeNull();
  });

  it('remove espaços das pontas', () => {
    expect(lerLinhaSimples(['  ACC  ', ' Adaptive Cruise Control '])?.rotulo).toBe('ACC');
  });
});
