/** Painel de busca (SPEC §5.2). */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Config, ResultadoBusca, Sentido, Sigla } from '@shared/types';
import { CardResultado } from './CardResultado';
import { TelaRepertorio, VazioRepertorio } from './TelaRepertorio';
import { TelaConfig } from './TelaConfig';
import { FormSentido, type Rascunho } from './FormSentido';

type Tela = 'busca' | 'repertorio' | 'config' | 'novo';

export function Painel(): JSX.Element {
  const [tela, setTela] = useState<Tela>('busca');
  const [termo, setTermo] = useState('');
  const [res, setRes] = useState<ResultadoBusca | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [total, setTotal] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void window.lupa.obterConfig().then((c) => {
      setCfg(c);
      if (c.tema !== 'sistema') document.documentElement.dataset['tema'] = c.tema;
    });
    void window.lupa.listar().then((l) => setTotal(l.length));
    window.lupa.aoFocarBusca(() => input.current?.focus());
  }, []);

  const buscar = useCallback((t: string) => {
    setTermo(t);
    if (!t.trim()) return setRes(null);
    void window.lupa.buscar(t).then(setRes);
  }, []);

  // debounce de 120 ms (SPEC §5.2)
  useEffect(() => {
    const id = setTimeout(() => {
      if (termo.trim()) void window.lupa.buscar(termo).then(setRes);
    }, 120);
    return () => clearTimeout(id);
  }, [termo]);

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { if (tela === 'busca') window.lupa.fecharPainel(); else setTela('busca'); }
      if (e.key === 'n' && e.ctrlKey) { e.preventDefault(); setTela('novo'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tela]);

  const recarregarTotal = (): void => { void window.lupa.listar().then((l) => setTotal(l.length)); };

  if (tela === 'repertorio')
    return <div className="painel"><TelaRepertorio aoSair={() => { setTela('busca'); recarregarTotal(); }} /></div>;
  if (tela === 'config')
    return <div className="painel"><TelaConfig aoSair={() => setTela('busca')} /></div>;
  if (tela === 'novo')
    return (
      <div className="painel">
        <div className="barra"><span className="titulo">+ Nova sigla</span></div>
        <FormSentido
          {...(rascunho ? { inicial: rascunho } : {})}
          aoSalvar={async (r) => {
            await window.lupa.salvarSentido(r.rotulo, r.sentido, r.tipo);
            setRascunho(null); setTela('busca'); recarregarTotal();
            if (termo.trim()) void window.lupa.buscar(termo).then(setRes);
          }}
          aoCancelar={() => { setRascunho(null); setTela('busca'); }}
        />
      </div>
    );

  return (
    <div className="painel">
      <div className="barra">
        <span className="titulo">🔍 Lupa</span>
        <span className="espaco" />
        <button className="fantasma" title="Repertório" onClick={() => setTela('repertorio')}>Repertório</button>
        <button className="fantasma" title="Configurações" onClick={() => setTela('config')}>⚙</button>
        <button className="fantasma" title="Fechar" onClick={() => window.lupa.fecharPainel()}>✕</button>
      </div>

      <div className="busca-wrap">
        <input
          ref={input}
          type="search"
          autoFocus
          placeholder="Digite a sigla…"
          value={termo}
          onChange={(e) => buscar(e.target.value)}
        />
      </div>

      <div className="conteudo">
        {total === 0 && !termo && (
          <VazioRepertorio aoCadastrar={() => setTela('novo')} aoImportar={() => setTela('repertorio')} />
        )}

        {!termo && total > 0 && (
          <div className="vazio">
            <p>{total} {total === 1 ? 'sigla cadastrada' : 'siglas cadastradas'}.</p>
            <p>Digite para buscar. <kbd>Ctrl+N</kbd> cadastra uma nova.</p>
          </div>
        )}

        {res?.resultados.map((s: Sigla) => (
          <CardResultado
            key={s.sigla}
            sigla={s}
            abaPadrao={cfg?.abaPadrao ?? 'en'}
            aoEditar={(sig, sen: Sentido) => { setRascunho({ rotulo: sig.rotulo, tipo: sig.tipo, sentido: sen }); setTela('novo'); }}
          />
        ))}

        {res?.sugestaoCadastro && (
          <div className="vazio">
            <h2>“{res.termo}” não está no repertório</h2>
            <p>Nada é inventado aqui — cadastre o significado que você usa.</p>
            <div className="ctas">
              <button className="primario" onClick={() => setTela('novo')}>+ Cadastrar “{res.termo}”</button>
            </div>
          </div>
        )}

        {res && res.estrategia !== 'exato' && res.resultados.length > 0 && (
          <p style={{ color: 'var(--txt-2)', fontSize: 11, textAlign: 'center' }}>
            {res.estrategia === 'prefixo' && 'Siglas que começam assim'}
            {res.estrategia === 'fuzzy' && 'Você quis dizer…'}
            {res.estrategia === 'fulltext' && 'Encontradas pelo significado'}
          </p>
        )}
      </div>
    </div>
  );
}
