/** Ícone flutuante sempre visível (SPEC §5.1). */
import { IconeLupa } from './IconeLupa';

export function Lupa(): JSX.Element {
  return (
    <div
      className="lupa-btn"
      title="Lupa — clique para buscar uma sigla (Ctrl+Alt+L)"
      onClick={() => window.lupa.abrirPainel()}
    >
      <IconeLupa tamanho={24} />
    </div>
  );
}
