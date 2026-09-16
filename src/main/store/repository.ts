/**
 * CRUD do repertório (SPEC §3, §6.2). Toda escrita passa por backup + gravação
 * atômica. O repertório vive em memória e é persistido a cada mudança.
 */
import { randomUUID } from 'node:crypto';
import { RepertorioSchema, SentidoSchema } from '../../shared/schema';
import type { Filtro, Repertorio, Sentido, Sigla } from '../../shared/types';
import { normalizar } from '../../shared/normalize';
import { arquivoRepertorio, pastaBackups, pastaDados } from './paths';
import { criarBackup, escreverJsonAtomico, garantirPasta, lerJson } from './io';

let repertorio: Repertorio = { schemaVersion: 1, atualizadoEm: agora(), siglas: [] };

function agora(): string {
  return new Date().toISOString();
}

export function carregar(): Repertorio {
  garantirPasta(pastaDados());
  const bruto = lerJson<unknown>(arquivoRepertorio());
  if (bruto === null) {
    repertorio = { schemaVersion: 1, atualizadoEm: agora(), siglas: [] };
    persistir(false);
    return repertorio;
  }
  const r = RepertorioSchema.safeParse(bruto);
  if (!r.success) {
    // Arquivo corrompido: preserva o original como backup e abre vazio, nunca trava.
    criarBackup(arquivoRepertorio(), pastaBackups());
    repertorio = { schemaVersion: 1, atualizadoEm: agora(), siglas: [] };
    persistir(false);
    return repertorio;
  }
  repertorio = r.data;
  return repertorio;
}

export function substituir(novo: Repertorio): void {
  repertorio = RepertorioSchema.parse(novo);
  persistir(true);
}

function persistir(comBackup = true): void {
  if (comBackup) criarBackup(arquivoRepertorio(), pastaBackups());
  repertorio.atualizadoEm = agora();
  escreverJsonAtomico(arquivoRepertorio(), repertorio);
}

export function todas(): Sigla[] {
  return repertorio.siglas;
}

export function obter(sigla: string): Sigla | null {
  const chave = normalizar(sigla);
  return repertorio.siglas.find((g) => g.sigla === chave) ?? null;
}

export function listar(filtro?: Filtro): Sigla[] {
  let lista = [...repertorio.siglas];
  if (filtro?.texto) {
    const t = filtro.texto.toLowerCase();
    lista = lista.filter(
      (g) =>
        g.rotulo.toLowerCase().includes(t) ||
        g.sentidos.some((s) => `${s.en} ${s.pt} ${s.original}`.toLowerCase().includes(t)),
    );
  }
  if (filtro?.categoria) lista = lista.filter((g) => g.sentidos.some((s) => s.categoria === filtro.categoria));
  if (filtro?.apenasFavoritos) lista = lista.filter((g) => g.sentidos.some((s) => s.favorito));

  const dir = filtro?.direcao === 'desc' ? -1 : 1;
  const por = filtro?.ordenarPor ?? 'sigla';
  lista.sort((a, b) => {
    if (por === 'acessos') {
      return (soma(b, 'acessos') - soma(a, 'acessos')) * dir;
    }
    if (por === 'atualizadoEm') {
      return (ultima(b).localeCompare(ultima(a))) * dir;
    }
    return a.sigla.localeCompare(b.sigla) * dir;
  });
  return lista;
}

const soma = (g: Sigla, campo: 'acessos'): number => g.sentidos.reduce((t, s) => t + s[campo], 0);
const ultima = (g: Sigla): string => g.sentidos.map((s) => s.atualizadoEm).sort().at(-1) ?? '';

/** Cria ou atualiza um sentido. Cria a sigla se ainda não existir. */
export function salvarSentido(rotulo: string, sentido: Sentido, tipo: 'sigla' | 'termo' = 'sigla'): void {
  const chave = normalizar(rotulo);
  if (!chave) throw new Error('sigla vazia');
  const valido = SentidoSchema.parse({ ...sentido, atualizadoEm: agora() });

  const existente = repertorio.siglas.find((g) => g.sigla === chave);
  if (!existente) {
    repertorio.siglas.push({ sigla: chave, rotulo: rotulo.trim(), tipo, sentidos: [valido] });
  } else {
    const i = existente.sentidos.findIndex((s) => s.id === valido.id);
    if (i >= 0) existente.sentidos[i] = valido;
    else existente.sentidos.push(valido);
  }
  repertorio.siglas.sort((a, b) => a.sigla.localeCompare(b.sigla));
  persistir();
}

export function duplicarSentido(sigla: string, sentidoId: string): Sentido {
  const g = obter(sigla);
  const orig = g?.sentidos.find((s) => s.id === sentidoId);
  if (!g || !orig) throw new Error('sentido não encontrado');
  const copia: Sentido = { ...orig, id: randomUUID(), criadoEm: agora(), atualizadoEm: agora(), acessos: 0 };
  g.sentidos.push(copia);
  persistir();
  return copia;
}

export function excluirSentido(sigla: string, sentidoId: string): void {
  const g = obter(sigla);
  if (!g) return;
  g.sentidos = g.sentidos.filter((s) => s.id !== sentidoId);
  // SPEC §3.4: sigla sem sentido deixa de existir.
  if (g.sentidos.length === 0) excluirSigla(sigla);
  else persistir();
}

export function excluirSigla(sigla: string): void {
  const chave = normalizar(sigla);
  repertorio.siglas = repertorio.siglas.filter((g) => g.sigla !== chave);
  persistir();
}

export function alternarFavorito(sigla: string, sentidoId: string): void {
  const s = obter(sigla)?.sentidos.find((x) => x.id === sentidoId);
  if (!s) return;
  s.favorito = !s.favorito;
  s.atualizadoEm = agora();
  persistir(false);
}

export function registrarAcesso(sigla: string, sentidoId: string): void {
  const s = obter(sigla)?.sentidos.find((x) => x.id === sentidoId);
  if (!s) return;
  s.acessos += 1;
  persistir(false);
}

export function novoId(): string {
  return randomUUID();
}
