/** Lista, CRUD, import e export (SPEC §5.4). */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Sentido, Sigla } from '@shared/types';
import { FormSentido, type Rascunho } from './FormSentido';
import { Icone, IconeLupa } from './IconeLupa';

export function TelaRepertorio({ barra }: { barra: ReactNode }): JSX.Element {
  const [lista, setLista] = useState<Sigla[]>([]);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [novo, setNovo] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null);

  const recarregar = useCallback(async () => {
    setLista(await window.lupa.listar(texto ? { texto } : undefined));
  }, [texto]);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const salvar = async (r: Rascunho): Promise<void> => {
    await window.lupa.salvarSentido(r.rotulo, r.sentido, r.tipo);
    setNovo(false); setEditando(null);
    await recarregar();
  };

  const importar = async (): Promise<void> => {
    setAviso({ texto: 'Lendo a planilha…', erro: false });
    const rel = await window.lupa.importar('merge');
    if (!rel) { setAviso(null); return; }

    const entraram = rel.inseridos + rel.atualizados;
    const primeiro = rel.erros[0];

    if (entraram === 0) {
      setAviso({
        erro: true,
        texto: primeiro
          ? `Nenhuma sigla importada. ${primeiro.linha > 0 ? `Linha ${primeiro.linha}: ` : ''}${primeiro.mensagem}`
          : 'Nenhuma sigla importada — a planilha parece estar vazia. Use a coluna A para a sigla e a B para o significado.',
      });
    } else {
      setAviso({
        erro: false,
        texto:
          `${rel.inseridos} incluída(s), ${rel.atualizados} atualizada(s)` +
          (rel.ignorados > 0 ? `, ${rel.ignorados} ignorada(s)` : '') +
          (primeiro ? ` · 1º problema: linha ${primeiro.linha} — ${primeiro.mensagem}` : ''),
      });
    }
    await recarregar();
  };

  if (novo || editando)
    return (
      <>
        {barra}
        <FormSentido
          {...(editando ? { inicial: editando } : {})}
          aoSalvar={(r) => void salvar(r)}
          aoCancelar={() => { setNovo(false); setEditando(null); }}
        />
      </>
    );

  return (
    <>
      {barra}

      <div className="busca-wrap" style={{ paddingBottom: 6 }}>
        <input type="search" placeholder="Filtrar siglas…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>

      <div className="nav" style={{ paddingTop: 0, paddingBottom: 8 }}>
        <button className="primario" onClick={() => setNovo(true)}><Icone nome="mais" /> Nova sigla</button>
        <button onClick={() => void importar()} title="Excel, CSV ou JSON">Importar</button>
        <button onClick={() => void window.lupa.exportar('xlsx')}>Exportar</button>
      </div>

      <div className="conteudo">
        {aviso && <div className={`aviso ${aviso.erro ? 'erro' : ''}`}>{aviso.texto}</div>}

        {lista.length === 0 ? (
          texto ? (
            <div className="vazio"><p>Nada encontrado para “{texto}”.</p></div>
          ) : (
            <VazioRepertorio aoCadastrar={() => setNovo(true)} aoImportar={() => void importar()} />
          )
        ) : (
          <table>
            <thead><tr><th style={{ width: 96 }}>Sigla</th><th>Significado</th><th className="col-acoes" /></tr></thead>
            <tbody>
              {lista.map((g) =>
                g.sentidos.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{g.rotulo}</strong>
                      <div style={{ marginTop: 3 }}><span className="selo">{s.categoria}</span></div>
                    </td>
                    <td className="td-significado">
                      <div className="texto">{s.en || s.pt || s.original}</div>
                      {s.revisar && <span className="selo rever">a conferir</span>}
                    </td>
                    <td className="col-acoes">
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
      <div className="icone"><IconeLupa tamanho={36} /></div>
      <h2>Seu repertório está vazio</h2>
      <p>Nenhuma sigla é criada automaticamente — o conteúdo é todo seu.</p>
      <div className="ctas">
        <button className="primario" onClick={aoCadastrar}><Icone nome="mais" tamanho={13} /> Cadastrar primeira</button>
        <button onClick={aoImportar}>Importar planilha</button>
      </div>
      <p className="dica" style={{ marginTop: 14 }}>
        A planilha pode ser bem simples: coluna A a sigla, B o significado e
        C a aplicação. Só com A e B também funciona.
      </p>
    </div>
  );
}
