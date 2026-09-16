/** Painel de busca (SPEC §5.2). */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Config, ResultadoBusca, Sentido, Sigla } from '@shared/types';
import { CardResultado } from './CardResultado';
import { TelaRepertorio, VazioRepertorio } from './TelaRepertorio';
import { TelaConfig } from './TelaConfig';
import { FormSentido, type Rascunho } from './FormSentido';
import { Icone, IconeLupa } from './IconeLupa';
import { aplicarTema } from '../tema';

type Tela = 'busca' | 'repertorio' | 'config' | 'novo';

export function Painel(): JSX.Element {
  const [tela, setTela] = useState<Tela>('busca');
  const [termo, setTermo] = useState('');
  const [res, setRes] = useState<ResultadoBusca | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [total, setTotal] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const recarregarTotal = useCallback(() => {
    void window.lupa.listar().then((l) => setTotal(l.length));
  }, []);

  useEffect(() => {
    void window.lupa.obterConfig().then((c) => { setCfg(c); aplicarTema(c); });
    window.lupa.aoMudarConfig((c: Config) => { setCfg(c); aplicarTema(c); });
    window.lupa.aoFocarBusca(() => input.current?.focus());
    recarregarTotal();
  }, [recarregarTotal]);

  // debounce de 120 ms (SPEC §5.2)
  useEffect(() => {
    if (!termo.trim()) { setRes(null); return; }
    const id = setTimeout(() => { void window.lupa.buscar(termo).then(setRes); }, 120);
    return () => clearTimeout(id);
  }, [termo]);

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { if (tela === 'busca') window.lupa.minimizar(); else setTela('busca'); }
      if (e.key === 'n' && e.ctrlKey) { e.preventDefault(); setRascunho(null); setTela('novo'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tela]);

  const Barra = ({ titulo, voltar }: { titulo?: string; voltar?: () => void }): JSX.Element => (
    <div className="barra">
      {voltar ? (
        <>
          <button className="btn-janela" title="Voltar" onClick={voltar}>←</button>
          <span className="marca">{titulo}</span>
        </>
      ) : (
        <span className="marca"><IconeLupa tamanho={15} /> Lupa</span>
      )}
      <span className="espaco" />
      {/* Minimizar é a única ação de janela: clicar fora e Esc também escondem,
          e o app continua vivo na lupa flutuante e na bandeja. */}
      <button className="btn-janela" title="Minimizar (Esc)" onClick={() => window.lupa.minimizar()}>
        <Icone nome="menos" tamanho={14} />
      </button>
    </div>
  );

  if (tela === 'repertorio')
    return (
      <div className="painel">
        <TelaRepertorio
          barra={<Barra titulo="Repertório" voltar={() => { setTela('busca'); recarregarTotal(); }} />}
        />
      </div>
    );

  if (tela === 'config')
    return (
      <div className="painel">
        <Barra titulo="Configurações" voltar={() => setTela('busca')} />
        <TelaConfig />
      </div>
    );

  if (tela === 'novo')
    return (
      <div className="painel">
        <Barra titulo={rascunho ? 'Editar sigla' : 'Nova sigla'} voltar={() => { setRascunho(null); setTela('busca'); }} />
        <FormSentido
          {...(rascunho ? { inicial: rascunho } : {})}
          {...(!rascunho && termo.trim() ? { rotuloInicial: termo.trim() } : {})}
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
      <Barra />

      <div className="busca-wrap">
        <input ref={input} type="search" autoFocus placeholder="Digite a sigla…"
          value={termo} onChange={(e) => setTermo(e.target.value)} />
      </div>

      {/* Item 9: acesso direto a Repertório e Configurações */}
      <div className="nav">
        <button onClick={() => setTela('repertorio')}>
          <Icone nome="livro" /> Repertório{total > 0 ? ` · ${total}` : ''}
        </button>
        <button onClick={() => { setRascunho(null); setTela('novo'); }}>
          <Icone nome="mais" /> Nova sigla
        </button>
        <button onClick={() => setTela('config')} title="Configurações" style={{ flex: '0 0 auto' }}>
          <Icone nome="engrenagem" />
        </button>
      </div>

      <div className="conteudo">
        {total === 0 && !termo && (
          <VazioRepertorio aoCadastrar={() => setTela('novo')} aoImportar={() => setTela('repertorio')} />
        )}

        {!termo && total > 0 && (
          <div className="vazio">
            <div className="icone"><IconeLupa tamanho={34} /></div>
            <p>{total} {total === 1 ? 'sigla cadastrada' : 'siglas cadastradas'}</p>
            <p><kbd>Ctrl+Alt+L</kbd> abre daqui de qualquer lugar · <kbd>Ctrl+N</kbd> cadastra</p>
          </div>
        )}

        {res?.resultados.map((s: Sigla) => (
          <CardResultado key={s.sigla} sigla={s} abaPadrao={cfg?.abaPadrao ?? 'en'}
            aoEditar={(sig, sen: Sentido) => { setRascunho({ rotulo: sig.rotulo, tipo: sig.tipo, sentido: sen }); setTela('novo'); }} />
        ))}

        {res?.sugestaoCadastro && (
          <div className="vazio">
            <h2>“{res.termo}” não está no repertório</h2>
            <p>Nada é inventado aqui — cadastre o significado que você usa.</p>
            <div className="ctas">
              <button className="primario" onClick={() => { setRascunho(null); setTela('novo'); }}>
                <Icone nome="mais" tamanho={13} /> Cadastrar “{res.termo}”
              </button>
            </div>
          </div>
        )}

        {res && res.estrategia !== 'exato' && res.resultados.length > 0 && (
          <p className="dica" style={{ textAlign: 'center' }}>
            {res.estrategia === 'prefixo' && 'Siglas que começam assim'}
            {res.estrategia === 'fuzzy' && 'Você quis dizer…'}
            {res.estrategia === 'fulltext' && 'Encontradas pelo significado'}
          </p>
        )}
      </div>
    </div>
  );
}
