/** Cadastro e edição manual (SPEC §5.4 / T-49). Nenhum campo é autopreenchido. */
import { useEffect, useState } from 'react';
import type { Categoria, Sentido } from '@shared/types';

export type Rascunho = { rotulo: string; tipo: 'sigla' | 'termo'; sentido: Sentido };

export function FormSentido({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial?: Rascunho;
  aoSalvar: (r: Rascunho) => void;
  aoCancelar: () => void;
}): JSX.Element {
  const [rotulo, setRotulo] = useState(inicial?.rotulo ?? '');
  const [tipo, setTipo] = useState<'sigla' | 'termo'>(inicial?.tipo ?? 'sigla');
  const [s, setS] = useState<Sentido | null>(inicial?.sentido ?? null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    window.lupa.bloquearFechamento(true);
    return () => window.lupa.bloquearFechamento(false);
  }, []);

  useEffect(() => {
    if (s) return;
    void window.lupa.novoId().then((id) =>
      setS({
        id,
        categoria: 'automotivo',
        en: '', pt: '', original: '',
        aplicacao: { contexto: '', exemplo: '', area: '', processo: '', referencia: null },
        tags: [], favorito: false, acessos: 0, revisar: false,
        criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString(),
      }),
    );
  }, [s]);

  if (!s) return <div className="conteudo">Carregando…</div>;

  const set = (patch: Partial<Sentido>): void => setS({ ...s, ...patch });
  const setApp = (patch: Partial<Sentido['aplicacao']>): void => setS({ ...s, aplicacao: { ...s.aplicacao, ...patch } });

  const salvar = (): void => {
    if (!rotulo.trim()) return setErro('Informe a sigla ou o termo.');
    if (!s.en.trim() && !s.pt.trim() && !s.original.trim())
      return setErro('Preencha ao menos o significado em inglês, português ou no idioma de origem.');
    setErro('');
    aoSalvar({ rotulo: rotulo.trim(), tipo, sentido: s });
  };

  return (
    <div className="conteudo">
      {erro && <div className="aviso" style={{ color: '#d64545', background: 'transparent', border: '1px solid #d64545' }}>{erro}</div>}

      <div className="grade-2">
        <div className="campo">
          <label>Sigla / termo *</label>
          <input type="text" autoFocus value={rotulo} onChange={(e) => setRotulo(e.target.value)} placeholder="PPAP" />
        </div>
        <div className="campo">
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as 'sigla' | 'termo')}>
            <option value="sigla">Sigla (expande)</option>
            <option value="termo">Termo (define)</option>
          </select>
        </div>
      </div>

      <div className="campo">
        <label>Categoria</label>
        <select value={s.categoria} onChange={(e) => set({ categoria: e.target.value as Categoria })}>
          <option value="automotivo">Automotivo</option>
          <option value="ti">TI</option>
          <option value="corporativo">Corporativo</option>
          <option value="generico">Genérico</option>
        </select>
      </div>

      <div className="campo"><label>Inglês</label>
        <input type="text" value={s.en} onChange={(e) => set({ en: e.target.value })} /></div>
      <div className="campo"><label>Português</label>
        <input type="text" value={s.pt} onChange={(e) => set({ pt: e.target.value })} /></div>
      <div className="campo"><label>Idioma de origem (italiano, francês…)</label>
        <input type="text" value={s.original} onChange={(e) => set({ original: e.target.value })} /></div>

      <div className="campo"><label>Contexto de uso</label>
        <textarea value={s.aplicacao.contexto} onChange={(e) => setApp({ contexto: e.target.value })} /></div>
      <div className="campo"><label>Exemplo</label>
        <textarea value={s.aplicacao.exemplo} onChange={(e) => setApp({ exemplo: e.target.value })} /></div>

      <div className="grade-2">
        <div className="campo"><label>Área</label>
          <input type="text" value={s.aplicacao.area} onChange={(e) => setApp({ area: e.target.value })} /></div>
        <div className="campo"><label>Processo</label>
          <input type="text" value={s.aplicacao.processo} onChange={(e) => setApp({ processo: e.target.value })} /></div>
      </div>
      <div className="campo"><label>Referência</label>
        <input type="text" value={s.aplicacao.referencia ?? ''} onChange={(e) => setApp({ referencia: e.target.value || null })} /></div>
      <div className="campo"><label>Tags (separadas por ;)</label>
        <input type="text" value={s.tags.join(';')} onChange={(e) => set({ tags: e.target.value.split(';').map((t) => t.trim()).filter(Boolean) })} /></div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="primario" onClick={salvar}>Salvar</button>
        <button onClick={aoCancelar}>Cancelar</button>
      </div>
    </div>
  );
}
