import './styles.css';
import { Lupa } from './components/Lupa';
import { Painel } from './components/Painel';

/** Uma janela por rota (SPEC §2): ?janela=lupa ou ?janela=painel. */
export function App(): JSX.Element {
  const janela = new URLSearchParams(window.location.search).get('janela') ?? 'painel';
  if (janela === 'lupa') {
    document.body.classList.add('lupa');
    return <Lupa />;
  }
  return <Painel />;
}
