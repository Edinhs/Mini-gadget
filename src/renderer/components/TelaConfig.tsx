/** Configurações (SPEC §5.5). */
import { useEffect, useState } from 'react';
import type { Config } from '@shared/types';

export function TelaConfig({ aoSair }: { aoSair: () => void }): JSX.Element {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [backups, setBackups] = useState<{ caminho: string; data: string }[]>([]);

  useEffect(() => {
    void window.lupa.obterConfig().then(setCfg);
    void window.lupa.listarBackups().then(setBackups);
  }, []);

  if (!cfg) return <div className="conteudo">Carregando…</div>;

  const salvar = async (patch: Partial<Config>): Promise<void> => {
    setCfg(await window.lupa.salvarConfig(patch));
  };

  return (
    <>
      <div className="barra">
        <span className="titulo">Configurações</span>
        <span className="espaco" />
        <button onClick={aoSair}>Voltar</button>
      </div>
      <div className="conteudo">
        <div className="campo">
          <label>Atalho global (exige reiniciar o app)</label>
          <input type="text" value={cfg.atalhoGlobal} onChange={(e) => void salvar({ atalhoGlobal: e.target.value })} />
        </div>
        <div className="campo">
          <label>Tema</label>
          <select value={cfg.tema} onChange={(e) => void salvar({ tema: e.target.value as Config['tema'] })}>
            <option value="sistema">Seguir o Windows</option>
            <option value="claro">Claro</option>
            <option value="escuro">Escuro</option>
          </select>
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
          <label>Opacidade da lupa quando ociosa: {cfg.opacidadeOciosa.toFixed(2)}</label>
          <input type="range" min="0.3" max="1" step="0.05" value={cfg.opacidadeOciosa}
            onChange={(e) => void salvar({ opacidadeOciosa: Number(e.target.value) })} />
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={cfg.iniciarComWindows}
            onChange={(e) => void salvar({ iniciarComWindows: e.target.checked })} />
          Iniciar junto com o Windows
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={cfg.fixarPainel}
            onChange={(e) => void salvar({ fixarPainel: e.target.checked })} />
          Manter o painel aberto ao clicar fora
        </label>

        <div className="rotulo-campo">Backups ({backups.length})</div>
        {backups.length === 0 && <div className="valor vazio-campo">Nenhum backup ainda.</div>}
        {backups.slice(0, 5).map((b) => (
          <div key={b.caminho} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span className="valor" style={{ flex: 1, fontSize: 12 }}>{new Date(b.data).toLocaleString('pt-BR')}</span>
            <button onClick={async () => {
              if (confirm('Restaurar este backup? O repertório atual será substituído.')) {
                await window.lupa.restaurarBackup(b.caminho);
                alert('Backup restaurado.');
              }
            }}>Restaurar</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => void window.lupa.exportar('xlsx')}>Exportar Excel</button>
          <button onClick={() => void window.lupa.exportar('json')}>Exportar JSON</button>
          <button onClick={() => void window.lupa.abrirPastaDados()}>Abrir pasta</button>
        </div>
      </div>
    </>
  );
}
