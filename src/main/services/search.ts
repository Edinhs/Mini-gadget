/**
 * Busca em cascata (SPEC §4.2). Excludente: para na primeira etapa que produz
 * resultado. Teto de 10 resultados.
 */
import Fuse from 'fuse.js';
import type { ResultadoBusca, Sigla } from '../../shared/types';
import { normalizar } from '../../shared/normalize';

const TETO = 10;

export function buscar(termo: string, acervo: Sigla[]): ResultadoBusca {
  const chave = normalizar(termo);
  const base = { termo, normalizado: chave };

  if (!chave) return { ...base, estrategia: 'nenhum', resultados: [], sugestaoCadastro: false };

  // 1. exato
  const exato = acervo.filter((g) => g.sigla === chave);
  if (exato.length) return { ...base, estrategia: 'exato', resultados: ordenar(exato), sugestaoCadastro: false };

  // 2. prefixo
  const prefixo = acervo.filter((g) => g.sigla.startsWith(chave));
  if (prefixo.length) return { ...base, estrategia: 'prefixo', resultados: ordenar(prefixo), sugestaoCadastro: false };

  // 3. fuzzy sobre a sigla
  if (acervo.length) {
    const fuse = new Fuse(acervo, { keys: ['sigla', 'rotulo'], threshold: 0.3, includeScore: true });
    const achados = fuse.search(chave).map((r) => r.item);
    if (achados.length) return { ...base, estrategia: 'fuzzy', resultados: achados.slice(0, TETO), sugestaoCadastro: false };

    // 4. full-text no significado (busca reversa)
    const fuseTexto = new Fuse(acervo, {
      keys: ['sentidos.en', 'sentidos.pt', 'sentidos.original', 'sentidos.tags', 'sentidos.aplicacao.contexto'],
      threshold: 0.4,
    });
    const porTexto = fuseTexto.search(termo.trim()).map((r) => r.item);
    if (porTexto.length) return { ...base, estrategia: 'fulltext', resultados: porTexto.slice(0, TETO), sugestaoCadastro: false };
  }

  // 5. nada: convida a cadastrar
  return { ...base, estrategia: 'nenhum', resultados: [], sugestaoCadastro: true };
}

/** SPEC §4.3 — favorito, depois acessos, depois alfabético. */
function ordenar(lista: Sigla[]): Sigla[] {
  return [...lista]
    .sort((a, b) => {
      const favA = a.sentidos.some((s) => s.favorito) ? 1 : 0;
      const favB = b.sentidos.some((s) => s.favorito) ? 1 : 0;
      if (favA !== favB) return favB - favA;
      const acA = a.sentidos.reduce((t, s) => t + s.acessos, 0);
      const acB = b.sentidos.reduce((t, s) => t + s.acessos, 0);
      if (acA !== acB) return acB - acA;
      return a.sigla.localeCompare(b.sigla);
    })
    .slice(0, TETO);
}
