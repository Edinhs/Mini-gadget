/** Configurações (SPEC §5.5). Toda mudança vale na hora, nas duas janelas. */
import { useEffect, useState } from 'react';
import type { Config } from '@shared/types';

const CORES = ['#2f6fed', '#7b5cf0', '#0e9f6e', '#d4622a', '#c2365c', '#0f7b8a', '#4a5568'];

export function TelaConfig(): JSX.Element {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [backups, setBackups] = useState<{ caminho: string; data: string }[]>([]);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    void window.lupa.obterConfig().then(setCfg);
    void window.lupa.listarBackups().then(setBackups);
  }, []);

  if (!cfg) return <div className="conteudo">Carregando…</div>;

  const salvar = async (patch: Partial<Config>): Promise<void> => {
    setCfg(await window.lupa.salvarConfig(patch));
  };

  return (
    <div className="conteudo">
      {aviso && <div className="aviso">{aviso}</div>}

      <div className="secao">Aparência</div>

      <div className="campo">
        <label>Tema</label>
        <select value={cfg.tema} onChange={(e) => void salvar({ tema: e.target.value as Config['tema'] })}>
          <option value="sistema">Seguir o Windows</option>
          <option value="claro">Claro</option>
          <option value="escuro">Escuro</option>
        </select>
      </div>

      <div className="campo">
        <label>Cor de destaque</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {CORES.map((c) => (
            <button key={c} title={c} onClick={() => void salvar({ corAcento: c })}
              style={{
                width: 26, height: 26, padding: 0, borderRadius: '50%', background: c,
                border: cfg.corAcento.toLowerCase() === c ? '2px solid var(--txt)' : '1px solid var(--borda)',
              }} />
          ))}
          <input type="color" value={cfg.corAcento} onChange={(e) => void salvar({ corAcento: e.target.value })} />
        </div>
      </div>

      <div className="campo">
        <label>Transparência das janelas — {Math.round(cfg.transparencia * 100)}%</label>
        <input type="range" min="0" max="0.85" step="0.05" value={cfg.transparencia}
          onChange={(e) => void salvar({ transparencia: Number(e.target.value) })} />
        <p className="dica">0% deixa o fundo sólido; quanto maior, mais o que está atrás aparece.</p>
      </div>

      <div className="secao">Lupa flutuante</div>

      <div className="campo">
        <label>Tamanho — {cfg.tamanhoLupa} px</label>
        <input type="range" min="24" max="72" step="2" value={cfg.tamanhoLupa}
          onChange={(e) => void salvar({ tamanhoLupa: Number(e.target.value) })} />
      </div>

      <div className="campo">
        <label>Opacidade quando ociosa — {Math.round(cfg.opacidadeOciosa * 100)}%</label>
        <input type="range" min="0.05" max="1" step="0.05" value={cfg.opacidadeOciosa}
          onChange={(e) => void salvar({ opacidadeOciosa: Number(e.target.value) })} />
        <p className="dica">Ao passar o mouse, a lupa sempre volta a 100%.</p>
      </div>

      <div className="campo">
        <label>Lado em que o painel abre</label>
        <select value={cfg.ladoPainel} onChange={(e) => void salvar({ ladoPainel: e.target.value as Config['ladoPainel'] })}>
          <option value="auto">Automático (o lado que couber)</option>
          <option value="esquerda">Sempre à esquerda da lupa</option>
          <option value="direita">Sempre à direita da lupa</option>
        </select>
      </div>

      <p className="dica">Arraste a lupa com o botão esquerdo para movê-la livremente.
        Clique com o botão direito nela para escondê-la (volta pela bandeja).</p>

      <div className="secao">Comportamento</div>

      <div className="linha-controle">
        <label htmlFor="autostart">Iniciar junto com o Windows</label>
        <input id="autostart" type="checkbox" checked={cfg.iniciarComWindows}
          onChange={(e) => void salvar({ iniciarComWindows: e.target.checked })} />
      </div>

      <div className="linha-controle">
        <label htmlFor="fixar">Manter o painel aberto ao clicar fora</label>
        <input id="fixar" type="checkbox" checked={cfg.fixarPainel}
          onChange={(e) => void salvar({ fixarPainel: e.target.checked })} />
      </div>

      <div className="campo">
        <label>Aba aberta por padrão</label>
        <select value={cfg.abaPadrao} onChange={(e) => void salvar({ abaPadrao: e.target.value as Config['abaPadrao'] })}>
          <option value="en">Inglês</option>
          <option value="pt">Português</option>
          <option value="aplicacao">Aplicação</option>
        </select>
      </div>

      <div className="campo">
        <label>Atalho global (vale ao reiniciar o app)</label>
        <input type="text" value={cfg.atalhoGlobal}
          onChange={(e) => void salvar({ atalhoGlobal: e.target.value })} />
      </div>

      <div className="secao">Dados</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => void window.lupa.exportar('xlsx')}>Exportar Excel</button>
        <button onClick={() => void window.lupa.exportar('csv')}>Exportar CSV</button>
        <button onClick={() => void window.lupa.exportar('json')}>Exportar JSON</button>
        <button onClick={() => void window.lupa.abrirPastaDados()}>Abrir pasta</button>
      </div>

      <div className="rotulo-campo" style={{ marginTop: 16 }}>Backups ({backups.length})</div>
      {backups.length === 0 && <div className="vazio-campo">Nenhum backup ainda.</div>}
      {backups.slice(0, 5).map((b) => (
        <div key={b.caminho} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--txt-2)' }}>
            {new Date(b.data).toLocaleString('pt-BR')}
          </span>
          <button onClick={async () => {
            if (confirm('Restaurar este backup? O repertório atual será substituído.')) {
              await window.lupa.restaurarBackup(b.caminho);
              setAviso('Backup restaurado.');
            }
          }}>Restaurar</button>
        </div>
      ))}
    </div>
  );
}
