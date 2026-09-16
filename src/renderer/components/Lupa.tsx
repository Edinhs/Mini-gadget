/**
 * Ícone flutuante (SPEC §5.1 + itens 1 e 3 do refinamento).
 *
 * Arraste livre: o botão desce, o main passa a seguir o cursor e a janela vai
 * para qualquer ponto de qualquer monitor. Um clique sem movimento abre o painel.
 */
import { useEffect, useRef, useState } from 'react';
import type { Config } from '@shared/types';
import { aplicarTema } from '../tema';
import { IconeLupa } from './IconeLupa';

const LIMIAR_ARRASTE = 4; // px — abaixo disso o gesto é clique, não arraste

export function Lupa(): JSX.Element {
  const [arrastando, setArrastando] = useState(false);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const moveu = useRef(false);

  useEffect(() => {
    void window.lupa.obterConfig().then(aplicarTema);
    window.lupa.aoMudarConfig((cfg: Config) => aplicarTema(cfg));
  }, []);

  useEffect(() => {
    const mover = (e: MouseEvent): void => {
      if (!inicio.current) return;
      const dx = Math.abs(e.screenX - inicio.current.x);
      const dy = Math.abs(e.screenY - inicio.current.y);
      if (!moveu.current && (dx > LIMIAR_ARRASTE || dy > LIMIAR_ARRASTE)) moveu.current = true;
    };
    const soltar = (): void => {
      if (!inicio.current) return;
      inicio.current = null;
      setArrastando(false);
      window.lupa.pararArraste();
      if (!moveu.current) window.lupa.abrirPainel();
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    return () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
    };
  }, []);

  const descer = (e: React.MouseEvent): void => {
    if (e.button !== 0) return;
    inicio.current = { x: e.screenX, y: e.screenY };
    moveu.current = false;
    setArrastando(true);
    // offset do cursor dentro da janela, para a lupa não "pular" ao pegar
    window.lupa.iniciarArraste(e.clientX, e.clientY);
  };

  return (
    <div
      className={`lupa-btn ${arrastando ? 'arrastando' : ''}`}
      title="Lupa — clique para buscar · arraste para mover · Ctrl+Alt+L"
      onMouseDown={descer}
      onContextMenu={(e) => { e.preventDefault(); window.lupa.ocultarLupa(); }}
    >
      <IconeLupa />
    </div>
  );
}
