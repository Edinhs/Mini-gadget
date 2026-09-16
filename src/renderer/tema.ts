/**
 * Aplica a configuração visual do usuário às variáveis CSS.
 * Chamado no load e a cada mudança difundida pelo main — é isso que faz o tema,
 * a cor, a transparência e a opacidade valerem no ato (itens 3, 4 e 5).
 */
import type { Config } from '@shared/types';

export function aplicarTema(cfg: Config): void {
  const raiz = document.documentElement;

  if (cfg.tema === 'sistema') delete raiz.dataset['tema'];
  else raiz.dataset['tema'] = cfg.tema;

  raiz.style.setProperty('--acento', cfg.corAcento);
  // transparencia 0 = opaco, 0,85 = bem translucido
  raiz.style.setProperty('--alfa', String(1 - cfg.transparencia));
  raiz.style.setProperty('--opacidade-ociosa', String(cfg.opacidadeOciosa));
}
