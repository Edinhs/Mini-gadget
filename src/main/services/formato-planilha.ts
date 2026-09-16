/**
 * Detecção do formato da planilha importada.
 *
 * Dois formatos são aceitos:
 *
 *  A) COMPLETO — primeira linha é cabeçalho com os nomes das colunas do SPEC §7
 *     (id, sigla, rotulo, categoria, en, pt, contexto…). Usado pelo export.
 *
 *  B) SIMPLES — sem cabeçalho, para colar listas grandes rapidamente:
 *       coluna A = sigla
 *       coluna B = significado
 *       coluna C = aplicação (opcional; havendo só duas colunas, é ignorada)
 */

export const CABECALHOS_CONHECIDOS = [
  'id', 'sigla', 'rotulo', 'rótulo', 'tipo', 'categoria', 'en', 'pt', 'original',
  'contexto', 'exemplo', 'area', 'área', 'processo', 'referencia', 'referência',
  'tags', 'favorito', 'criadoem', 'atualizadoem',
];

const chave = (v: unknown): string =>
  String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/**
 * É cabeçalho do formato completo quando ao menos duas células da primeira
 * linha batem com nomes de coluna conhecidos. Duas, e não uma, porque uma
 * planilha simples pode legitimamente começar com a sigla "ID" ou "TAGS".
 */
export function ehCabecalhoCompleto(primeiraLinha: unknown[]): boolean {
  const conhecidas = CABECALHOS_CONHECIDOS.map((c) => chave(c));
  const batidas = primeiraLinha.filter((c) => conhecidas.includes(chave(c))).length;
  return batidas >= 2;
}

/** Marcas de português: acento, cedilha, palavra funcional ou sufixo típico. */
const PALAVRAS_PT = /\b(de|da|do|das|dos|para|com|em|por|e|ou|no|na|nos|nas|que|ao|aos|à|às|um|uma)\b/i;
const ACENTOS = /[áàâãéêíóôõúüç]/i;
/**
 * Sufixos que praticamente não ocorrem em inglês. "ador" distingue
 * "Amplificador" de "Alternator", que termina em "ator".
 */
const SUFIXOS_PT = /(ção|ções|dade|mento|ador|adora|agem|ância|ência|izado|ável|ível|eiro|eira)\b/i;

/**
 * Decide se o significado solto da planilha simples é inglês ou português.
 * Heurística deliberadamente conservadora: na dúvida, inglês — que é como a
 * esmagadora maioria das siglas técnicas expande. Toda linha importada entra
 * marcada como "a conferir", então o usuário corrige o que ficar torto.
 */
export function idiomaDoSignificado(texto: string): 'en' | 'pt' {
  const t = texto.trim();
  if (!t) return 'en';
  if (ACENTOS.test(t)) return 'pt';
  if (PALAVRAS_PT.test(t)) return 'pt';
  if (SUFIXOS_PT.test(t)) return 'pt';
  return 'en';
}

export interface LinhaSimples {
  rotulo: string;
  significado: string;
  aplicacao: string;
}

/** Converte uma linha crua (array de células) do formato simples. */
export function lerLinhaSimples(celulas: unknown[]): LinhaSimples | null {
  const texto = (i: number): string => String(celulas[i] ?? '').trim();
  const rotulo = texto(0);
  if (!rotulo) return null;
  return { rotulo, significado: texto(1), aplicacao: texto(2) };
}

/** Linha crua de planilha, já com as colunas nomeadas. */
export type LinhaNomeada = Record<string, string>;

export interface SentidoExistente {
  id: string;
  acessos: number;
  criadoEm: string;
}

const texto = (v: string | undefined): string => (v ?? '').trim();
const verdadeiro = (v: string | undefined): boolean =>
  ['sim', 'true', '1', 'x', 'yes'].includes(texto(v).toLowerCase());

/**
 * Monta o objeto de sentido a partir de uma linha da planilha.
 *
 * Função pura para poder ser testada sem Electron — foi aqui que um `??` no
 * lugar de `||` deixou o `id` vazio quando a coluna existia mas estava em
 * branco, fazendo o schema rejeitar TODAS as linhas do import silenciosamente.
 * `??` só pula null/undefined; string vazia passa. Por isso, todo campo que
 * precisa cair no padrão quando vem vazio usa `||`.
 */
export function montarSentido(
  linha: LinhaNomeada,
  alvo: SentidoExistente | undefined,
  gerarId: () => string,
  agora: string = new Date().toISOString(),
): Record<string, unknown> {
  return {
    id: alvo?.id || texto(linha['id']) || gerarId(),
    categoria: texto(linha['categoria']) || 'generico',
    en: texto(linha['en']),
    pt: texto(linha['pt']),
    original: texto(linha['original']),
    aplicacao: {
      contexto: texto(linha['contexto']),
      exemplo: texto(linha['exemplo']),
      area: texto(linha['area']),
      processo: texto(linha['processo']),
      referencia: texto(linha['referencia']) || null,
    },
    tags: texto(linha['tags']).split(';').map((t) => t.trim()).filter(Boolean),
    favorito: verdadeiro(linha['favorito']),
    acessos: alvo?.acessos ?? 0,
    revisar: true,
    criadoEm: texto(linha['criadoEm']) || alvo?.criadoEm || agora,
    atualizadoEm: agora,
  };
}
