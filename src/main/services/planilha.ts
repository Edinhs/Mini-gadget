/**
 * Import/export JSON, CSV e XLSX (SPEC §7). Round-trip sem perda: as colunas
 * carregam id, favorito e datas.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { RepertorioSchema, SentidoSchema } from '../../shared/schema';
import type { RelatorioImport, Sentido, Sigla } from '../../shared/types';
import { chaveDeRotulo } from '../../shared/normalize';
import * as repo from '../store/repository';
import { ehCabecalhoCompleto, idiomaDoSignificado, lerLinhaSimples, montarSentido } from './formato-planilha';

export const COLUNAS = [
  'id', 'sigla', 'rotulo', 'tipo', 'categoria', 'en', 'pt', 'original',
  'contexto', 'exemplo', 'area', 'processo', 'referencia', 'tags',
  'favorito', 'criadoEm', 'atualizadoEm',
] as const;

type Linha = Record<string, string>;

function paraLinhas(siglas: Sigla[]): Linha[] {
  return siglas.flatMap((g) =>
    g.sentidos.map((s) => ({
      id: s.id, sigla: g.sigla, rotulo: g.rotulo, tipo: g.tipo, categoria: s.categoria,
      en: s.en, pt: s.pt, original: s.original,
      contexto: s.aplicacao.contexto, exemplo: s.aplicacao.exemplo,
      area: s.aplicacao.area, processo: s.aplicacao.processo,
      referencia: s.aplicacao.referencia ?? '',
      tags: s.tags.join(';'),
      favorito: s.favorito ? 'sim' : 'nao',
      criadoEm: s.criadoEm, atualizadoEm: s.atualizadoEm,
    })),
  );
}

export function exportar(caminho: string, formato: 'json' | 'csv' | 'xlsx'): string {
  const siglas = repo.todas();
  if (formato === 'json') {
    writeFileSync(caminho, JSON.stringify({ schemaVersion: 1, atualizadoEm: new Date().toISOString(), siglas }, null, 2), 'utf-8');
    return caminho;
  }
  const ws = XLSX.utils.json_to_sheet(paraLinhas(siglas), { header: [...COLUNAS] });
  if (formato === 'csv') {
    // BOM para o Excel PT-BR não quebrar acento (SPEC §7).
    writeFileSync(caminho, '﻿' + XLSX.utils.sheet_to_csv(ws), 'utf-8');
    return caminho;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Siglas');
  // Escreve por buffer: o SheetJS empacotado nao enxerga o `fs` do Node.
  writeFileSync(caminho, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
  return caminho;
}

export interface ProgressoImport {
  fase: 'lendo' | 'processando' | 'gravando' | 'concluido';
  atual: number;
  total: number;
}

export function importar(
  caminho: string,
  modo: 'merge' | 'substituir',
  aoProgredir?: (p: ProgressoImport) => void,
): RelatorioImport {
  const avisar = (fase: ProgressoImport['fase'], atual: number, total: number): void =>
    aoProgredir?.({ fase, atual, total });
  avisar('lendo', 0, 0);
  const rel: RelatorioImport = { inseridos: 0, atualizados: 0, ignorados: 0, erros: [], backupCriado: '' };

  let linhas: Linha[];
  if (caminho.toLowerCase().endsWith('.json')) {
    const r = RepertorioSchema.safeParse(JSON.parse(readFileSync(caminho, 'utf-8')));
    if (!r.success) {
      rel.erros.push({ linha: 0, campo: 'arquivo', mensagem: 'JSON fora do formato do repertório' });
      return rel;
    }
    if (modo === 'substituir') {
      repo.substituir(r.data);
      rel.inseridos = r.data.siglas.reduce((t, g) => t + g.sentidos.length, 0);
      return rel;
    }
    linhas = paraLinhas(r.data.siglas);
  } else {
    // Le por buffer pelo mesmo motivo do export (ver acima).
    const wb = XLSX.read(readFileSync(caminho), { type: 'buffer' });
    const nome = wb.SheetNames[0];
    if (!nome) {
      rel.erros.push({ linha: 0, campo: 'arquivo', mensagem: 'planilha sem abas' });
      return rel;
    }
    const aba = wb.Sheets[nome]!;
    const cruas = XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: '', raw: false, blankrows: false });
    const primeira = cruas[0] ?? [];

    if (ehCabecalhoCompleto(primeira)) {
      linhas = XLSX.utils.sheet_to_json<Linha>(aba, { defval: '', raw: false });
    } else {
      // Formato simples: sigla | significado | aplicacao (a terceira e opcional).
      linhas = [];
      for (const celulas of cruas) {
        const simples = lerLinhaSimples(celulas);
        if (!simples) continue;
        const campo = idiomaDoSignificado(simples.significado);
        linhas.push({
          id: '',
          sigla: simples.rotulo,
          rotulo: simples.rotulo,
          tipo: 'sigla',
          categoria: 'generico',
          en: campo === 'en' ? simples.significado : '',
          pt: campo === 'pt' ? simples.significado : '',
          original: '',
          contexto: simples.aplicacao,
          exemplo: '', area: '', processo: '', referencia: '',
          tags: '', favorito: 'nao', criadoEm: '', atualizadoEm: '',
        });
      }
    }
  }

  if (modo === 'substituir') repo.substituir({ schemaVersion: 1, atualizadoEm: new Date().toISOString(), siglas: [] });

  avisar('processando', 0, linhas.length);
  linhas.forEach((l, i) => {
    const numero = i + 1;
    // Avisa a cada 25 linhas: suficiente para a barra andar, sem inundar o IPC.
    if (i % 25 === 0) avisar('processando', i, linhas.length);
    const rotulo = (l['rotulo'] || l['sigla'] || '').trim();
    const chave = chaveDeRotulo(rotulo);
    if (!chave) {
      rel.ignorados += 1;
      rel.erros.push({ linha: numero, campo: 'sigla', mensagem: 'sigla vazia' });
      return;
    }
    const existente = repo.obter(chave);
    // Chave de identidade do merge (SPEC §7): id → sigla+categoria+en → inserir.
    const porId = existente?.sentidos.find((s) => s.id && s.id === l['id']);
    const porCampos = existente?.sentidos.find(
      (s) => s.categoria === l['categoria'] && s.en.trim().toLowerCase() === (l['en'] ?? '').trim().toLowerCase(),
    );
    const alvo = porId ?? porCampos;

    const candidato = montarSentido(l, alvo, repo.novoId);

    const r = SentidoSchema.safeParse(candidato);
    if (!r.success) {
      rel.ignorados += 1;
      const p = r.error.issues[0];
      rel.erros.push({ linha: numero, campo: String(p?.path?.[0] ?? '?'), mensagem: p?.message ?? 'inválido' });
      return;
    }
    const tipo = (l['tipo'] === 'termo' ? 'termo' : 'sigla') as 'sigla' | 'termo';
    repo.salvarSentido(rotulo, r.data as Sentido, tipo, true);
    if (alvo) rel.atualizados += 1;
    else rel.inseridos += 1;
  });

  avisar('gravando', linhas.length, linhas.length);
  repo.finalizarLote();
  avisar('concluido', linhas.length, linhas.length);
  return rel;
}
