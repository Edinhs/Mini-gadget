/** Lista, CRUD, import e export (SPEC §5.4). */
import { useCallback, useEffect, useState } from 'react';
import type { Sentido, Sigla } from '@shared/types';
import { FormSentido, type Rascunho } from './FormSentido';

export function TelaRepertorio({ aoSair }: { aoSair: () => void }): JSX.Element {
  const [lista, setLista] = useState<Sigla[]>([]);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [novo, setNovo] = useState(false);
  const [aviso, setAviso] = useState('');

  const recarregar = useCallback(async () => {
    setLista(await window.lupa.listar(texto ? { texto } : undefined));
  }, [texto]);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const salvar = async (r: Rascunho): Promise<void> => {
    await window.lupa.salvarSentido(r.rotulo, r.sentido, r.tipo);
    setNovo(false); setEditando(null);
    await recarregar();
  };

  const importar = async (modo: 'merge' | 'substituir'): Promise<void> => {
    const rel = await window.lupa.importar(modo);
    if (!rel) return;
    setAviso(`${rel.inseridos} incluídas, ${rel.atualizados} atualizadas, ${rel.ignorados} ignoradas${rel.erros.length ? ` · ${rel.erros.length} erro(s): linha ${rel.erros[0]?.linha} — ${rel.erros[0]?.mensagem}` : ''}`);
    await recarregar();
  };

  if (novo || editando) {
    return (
      <>
        <div className="barra">
          <span className="titulo">{novo ? '+ Nova sigla' : 'Editar'}</span>
        </div>
        <FormSentido
          {...(editando ? { inicial: editando } : {})}
          aoSalvar={(r) => void salvar(r)}
          aoCancelar={() => { setNovo(false); setEditando(null); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="barra">
        <span className="titulo">Repertório · {lista.length}</span>
        <span className="espaco" />
        <button className="primario" onClick={() => setNovo(true)}>+ Nova sigla</button>
        <button onClick={aoSair}>Voltar</button>
      </div>

      <div className="busca-wrap" style={{ display: 'flex', gap: 6 }}>
        <input type="search" placeholder="Filtrar…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button onClick={() => void importar('merge')} title="Importar Excel, CSV ou JSON">Importar</button>
        <button onClick={() => void window.lupa.exportar('xlsx')} title="Exportar para Excel">Exportar</button>
      </div>

      <div className="conteudo">
        {aviso && <div className="aviso">{aviso}</div>}
        {lista.length === 0 ? (
          <VazioRepertorio aoCadastrar={() => setNovo(true)} aoImportar={() => void importar('merge')} />
        ) : (
          <table>
            <thead>
              <tr><th>Sigla</th><th>Significado</th><th style={{ width: 90 }} /></tr>
            </thead>
            <tbody>
              {lista.map((g) =>
                g.sentidos.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{g.rotulo}</strong><br /><span className="selo">{s.categoria}</span></td>
                    <td>{s.en || s.pt || s.original}{s.revisar && <> <span className="selo rever">a conferir</span></>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="fantasma" title="Editar"
                        onClick={() => setEditando({ rotulo: g.rotulo, tipo: g.tipo, sentido: s as Sentido })}>✎</button>
                      <button className="fantasma perigo" title="Excluir"
                        onClick={async () => {
                          if (confirm(`Excluir "${g.rotulo}" (${s.categoria})?`)) {
                            await window.lupa.excluirSentido(g.sigla, s.id);
                            await recarregar();
                          }
                        }}>✕</button>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export function VazioRepertorio({ aoCadastrar, aoImportar }: { aoCadastrar: () => void; aoImportar: () => void }): JSX.Element {
  return (
    <div className="vazio">
      <h2>Seu repertório está vazio</h2>
      <p>Nenhuma sigla é criada automaticamente — o conteúdo é todo seu.</p>
      <div className="ctas">
        <button className="primario" onClick={aoCadastrar}>+ Cadastrar primeira sigla</button>
        <button onClick={aoImportar}>Importar planilha</button>
      </div>
    </div>
  );
}
