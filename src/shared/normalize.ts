/**
 * Normalização de entrada — SPEC §4.1 e §3.4.
 *
 * Tarefa T-03 / Onda 1. Módulo puro: sem I/O, sem dependências, determinístico.
 * Toda comparação de sigla no app (busca §4.2 e chave única §3.4) passa por aqui.
 */

/**
 * Caracteres citados explicitamente pela §4.1: `.` `-` `_` `/`.
 * Mantidos em uma constante própria porque são o caso literal do SPEC
 * (`" p.h.e.s "` → `"PHES"`) e servem de documentação viva.
 */
const PONTUACAO_EXPLICITA_SPEC = /[.\-_/]/gu;

/**
 * Demais sinais de pontuação e símbolos Unicode.
 *
 * DECISÃO DE CONTRATO (T-03): a §4.1 lista apenas `. - _ /`, mas a §3.4 exige que
 * a chave `sigla` seja "maiúsculas, sem acento, **sem pontuação**", e a §4.2 compara
 * a entrada do usuário contra essa mesma chave normalizada. Se a normalização da
 * entrada fosse mais frouxa que a da chave, o match exato nunca fecharia para
 * rótulos como `"AD&P"` — que na carga inicial real do usuário tem chave `"ADP"`.
 * Portanto removemos toda pontuação (\p{P}) e símbolo (\p{S}), o que é um
 * superconjunto coerente da lista da §4.1. Letras, dígitos e espaços sobrevivem.
 */
const PONTUACAO_E_SIMBOLOS = /[\p{P}\p{S}]/gu;

/** Marcas de combinação deixadas para trás pela decomposição NFD (acentos). */
const MARCAS_DE_ACENTO = /\p{M}/gu;

/** Qualquer corrida de espaço em branco (inclui tab, NBSP, quebra de linha). */
const ESPACO_EM_BRANCO = /\s+/gu;

/**
 * Normaliza um texto para uso como chave de busca / chave de repertório.
 *
 * Pipeline (SPEC §4.1, nesta ordem):
 *   1. `trim`
 *   2. `toUpperCase`
 *   3. decomposição NFD + remoção de acentos
 *   4. remoção de `. - _ /` e demais pontuações/símbolos
 *   5. colapso de espaços internos em um único espaço + `trim` final
 *
 * ESPAÇOS INTERNOS — decisão documentada (T-03): espaços **são preservados**,
 * apenas colapsados. `normalizar("Artificial Network")` devolve `"ARTIFICIAL NETWORK"`,
 * e NÃO `"AN"` nem `"ARTIFICIALNETWORK"`. Reduzir um rótulo de várias palavras à sua
 * inicial é uma decisão de curadoria feita na carga inicial / no cadastro manual
 * (SPEC §3.2.1), não uma transformação automática: o app "nunca inventa" (§3.2.1) e
 * juntar palavras produziria colisões silenciosas entre entradas distintas.
 * A remoção de pontuação NÃO insere espaço no lugar, por isso `"pp-ap"` → `"PPAP"`
 * enquanto `"pp - ap"` → `"PP AP"`.
 *
 * Função total: entrada não-string (defensiva na fronteira IPC) devolve `""`.
 *
 * @example normalizar(" p.h.e.s ")      // "PHES"
 * @example normalizar("ação")           // "ACAO"
 * @example normalizar("pp-ap")          // "PPAP"
 * @example normalizar("AD&P")           // "ADP"
 */
export function normalizar(entrada: string): string {
  if (typeof entrada !== 'string') return '';

  return entrada
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(MARCAS_DE_ACENTO, '')
    .replace(PONTUACAO_EXPLICITA_SPEC, '')
    .replace(PONTUACAO_E_SIMBOLOS, '')
    .replace(ESPACO_EM_BRANCO, ' ')
    .trim();
}

/**
 * Gera a chave `Sigla.sigla` (§3.2) a partir do rótulo escrito pelo usuário
 * (`Sigla.rotulo`), que preserva a grafia original (§3.4).
 *
 * É a mesma transformação de `normalizar` — exposta com nome próprio porque o
 * ponto de uso é semanticamente diferente (derivar a chave de persistência, e não
 * normalizar um termo digitado na busca) e porque é aqui que uma futura regra de
 * derivação de chave passaria a divergir da normalização da entrada.
 *
 * Não trunca: um rótulo cuja chave exceda 32 chars é rejeitado pelo
 * `SiglaSchema` com mensagem de campo (§3.3 — "nunca truncado em silêncio").
 *
 * @example chaveDeRotulo("AD&P")                    // "ADP"
 * @example chaveDeRotulo("Allestimento")            // "ALLESTIMENTO"
 * @example chaveDeRotulo("Artificial Network (AN)") // "ARTIFICIAL NETWORK AN"
 */
export function chaveDeRotulo(rotulo: string): string {
  const chave = normalizar(rotulo);
  if (chave) return chave;
  /**
   * Rotulo formado so por pontuacao — a planilha real do usuario tem uma linha
   * cuja "sigla" e apenas "[". Normalizar esvaziaria a chave e a entrada seria
   * perdida, entao caimos no rotulo cru em maiusculas, sem espacos nas pontas.
   * Continua sendo a grafia do usuario; nada e inventado.
   */
  return rotulo.trim().toUpperCase().replace(/\s+/gu, ' ');
}

/**
 * `true` quando o texto já está na forma normalizada — usado pelas regras de
 * integridade do `RepertorioSchema` (§3.4: "`sigla` é chave única, normalizada").
 */
export function estaNormalizado(texto: string): boolean {
  return typeof texto === 'string' && texto === normalizar(texto);
}
