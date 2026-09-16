import { describe, expect, it } from 'vitest';
import { ehCabecalhoCompleto, idiomaDoSignificado, lerLinhaSimples, montarSentido } from '../../src/main/services/formato-planilha';

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

describe('montarSentido — construção da linha importada', () => {
  const gerar = (): string => 'ID-GERADO';
  const AGORA = '2026-09-16T12:00:00.000Z';

  it('gera id quando a coluna id existe mas está VAZIA (regressão do import mudo)', () => {
    // Era aqui que `?? ` deixava passar '' e o schema rejeitava a linha inteira.
    const s = montarSentido({ id: '', sigla: 'ABS', en: 'Antilock Brake System' }, undefined, gerar, AGORA);
    expect(s['id']).toBe('ID-GERADO');
  });

  it('gera id quando a coluna id nem existe (planilha simples)', () => {
    const s = montarSentido({ en: 'Adaptive Cruise Control' }, undefined, gerar, AGORA);
    expect(s['id']).toBe('ID-GERADO');
  });

  it('preserva o id de um sentido já existente (merge atualiza, não duplica)', () => {
    const s = montarSentido({ id: 'x' }, { id: 'antigo', acessos: 7, criadoEm: '2020-01-01T00:00:00.000Z' }, gerar, AGORA);
    expect(s['id']).toBe('antigo');
    expect(s['acessos']).toBe(7);
    expect(s['criadoEm']).toBe('2020-01-01T00:00:00.000Z');
  });

  it('respeita o id vindo da planilha exportada (round-trip)', () => {
    const s = montarSentido({ id: 'ppap-automotivo-1' }, undefined, gerar, AGORA);
    expect(s['id']).toBe('ppap-automotivo-1');
  });

  it('cai em "generico" quando a categoria vem vazia', () => {
    expect(montarSentido({ categoria: '' }, undefined, gerar, AGORA)['categoria']).toBe('generico');
    expect(montarSentido({ categoria: 'ti' }, undefined, gerar, AGORA)['categoria']).toBe('ti');
  });

  it('marca toda linha importada para conferência', () => {
    expect(montarSentido({ en: 'x' }, undefined, gerar, AGORA)['revisar']).toBe(true);
  });

  it('separa tags por ; e descarta vazias', () => {
    expect(montarSentido({ tags: 'freio; seguranca ;;' }, undefined, gerar, AGORA)['tags']).toEqual(['freio', 'seguranca']);
  });

  it('referência vazia vira null, não string vazia', () => {
    expect(montarSentido({ referencia: '  ' }, undefined, gerar, AGORA)['aplicacao']).toMatchObject({ referencia: null });
  });

  it('entende favorito em várias grafias', () => {
    for (const v of ['sim', 'TRUE', '1', 'x']) {
      expect(montarSentido({ favorito: v }, undefined, gerar, AGORA)['favorito']).toBe(true);
    }
    expect(montarSentido({ favorito: 'nao' }, undefined, gerar, AGORA)['favorito']).toBe(false);
  });
});
