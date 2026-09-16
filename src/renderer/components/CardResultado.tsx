/** Card com as abas Inglês · Português · Aplicação (SPEC §5.3). */
import { useEffect, useState } from 'react';
import type { Sentido, Sigla } from '@shared/types';
import { Icone } from './IconeLupa';

type Aba = 'en' | 'pt' | 'aplicacao';
type SubAba = 'contexto' | 'onde';

export function CardResultado({
  sigla,
  abaPadrao,
  aoEditar,
}: {
  sigla: Sigla;
  abaPadrao: Aba;
  aoEditar?: (s: Sigla, sen: Sentido) => void;
}): JSX.Element {
  const [indice, setIndice] = useState(0);
  const [aba, setAba] = useState<Aba>(abaPadrao);
  const [sub, setSub] = useState<SubAba>('contexto');
  const sentido = sigla.sentidos[indice] ?? sigla.sentidos[0]!;

  useEffect(() => {
    void window.lupa.registrarAcesso(sigla.sigla, sentido.id);
  }, [sigla.sigla, sentido.id]);

  const textoDaAba = (): string => {
    if (aba === 'en') return sentido.en;
    if (aba === 'pt') return sentido.pt;
    return [sentido.aplicacao.contexto, sentido.aplicacao.exemplo].filter(Boolean).join('\n');
  };

  return (
    <div className="card">
      <div className="card-topo">
        <span className="sigla">{sigla.rotulo}</span>
        <span className="selo">{sentido.categoria}</span>
        {sigla.tipo === 'termo' && <span className="selo tipo">termo</span>}
        {sentido.revisar && <span className="selo rever">a conferir</span>}
        <span className="espaco" />
        {sigla.sentidos.length > 1 && (
          <select
            aria-label="Sentido"
            style={{ width: 'auto' }}
            value={indice}
            onChange={(e) => setIndice(Number(e.target.value))}
          >
            {sigla.sentidos.map((s, i) => (
              <option key={s.id} value={i}>
                {i + 1}/{sigla.sentidos.length} · {s.categoria}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="abas">
        <button className={`aba ${aba === 'en' ? 'ativa' : ''}`} onClick={() => setAba('en')}>Inglês</button>
        <button className={`aba ${aba === 'pt' ? 'ativa' : ''}`} onClick={() => setAba('pt')}>Português</button>
        <button className={`aba ${aba === 'aplicacao' ? 'ativa' : ''}`} onClick={() => setAba('aplicacao')}>Aplicação</button>
      </div>

      <div className="corpo">
        {aba === 'en' && <Campo valor={sentido.en} vazio="Significado em inglês ainda não preenchido." />}
        {aba === 'pt' && <Campo valor={sentido.pt} vazio="Significado em português ainda não preenchido." />}

        {aba === 'aplicacao' && (
          <>
            <div className="abas internas">
              <button className={`aba ${sub === 'contexto' ? 'ativa' : ''}`} onClick={() => setSub('contexto')}>Contexto</button>
              <button className={`aba ${sub === 'onde' ? 'ativa' : ''}`} onClick={() => setSub('onde')}>Onde aparece</button>
            </div>
            {sub === 'contexto' ? (
              <>
                <Campo valor={sentido.aplicacao.contexto} vazio="Contexto de uso ainda não preenchido." />
                {sentido.aplicacao.exemplo && (
                  <>
                    <div className="rotulo-campo">Exemplo</div>
                    <div className="valor">“{sentido.aplicacao.exemplo}”</div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="rotulo-campo">Área</div>
                <Campo valor={sentido.aplicacao.area} vazio="Não informada." />
                <div className="rotulo-campo">Processo</div>
                <Campo valor={sentido.aplicacao.processo} vazio="Não informado." />
                <div className="rotulo-campo">Referência</div>
                <Campo valor={sentido.aplicacao.referencia ?? ''} vazio="Sem referência." />
              </>
            )}
          </>
        )}

        {sentido.original && (
          <>
            <div className="rotulo-campo">Original ({sentido.idiomaOrigem ?? 'origem'})</div>
            <div className="valor">{sentido.original}</div>
          </>
        )}
      </div>

      <div className="linha-acoes">
        <button className="fantasma" title="Copiar o texto desta aba" onClick={() => window.lupa.copiar(textoDaAba())}>
          <Icone nome="copiar" tamanho={13} /> Copiar
        </button>
        <button
          className="fantasma"
          title={sentido.favorito ? 'Remover dos favoritos' : 'Favoritar'}
          onClick={() => void window.lupa.alternarFavorito(sigla.sigla, sentido.id)}
        >
          {sentido.favorito ? '★' : '☆'} Favorito
        </button>
        <span className="espaco" />
        {aoEditar && (
          <button className="fantasma" onClick={() => aoEditar(sigla, sentido)}>
            <Icone nome="lapis" tamanho={13} /> Editar
          </button>
        )}
      </div>
    </div>
  );
}

function Campo({ valor, vazio }: { valor: string; vazio: string }): JSX.Element {
  if (!valor.trim()) return <div className="valor vazio-campo">{vazio}</div>;
  return <div className="valor">{valor}</div>;
}
