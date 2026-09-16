export function IconeLupa({ tamanho }: { tamanho?: number }): JSX.Element {
  const props = tamanho ? { width: tamanho, height: tamanho } : {};
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.4" />
      <path d="M15.3 15.3 L20.5 20.5" />
    </svg>
  );
}

export function Icone({ nome, tamanho = 14 }: { nome: 'livro' | 'engrenagem' | 'menos' | 'x' | 'mais' | 'lupa' | 'copiar' | 'lapis'; tamanho?: number }): JSX.Element {
  const comum = {
    viewBox: '0 0 24 24', width: tamanho, height: tamanho, fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  if (nome === 'livro')
    return <svg {...comum}><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M8 7h7M8 11h7" /></svg>;
  if (nome === 'engrenagem')
    return <svg {...comum}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.3 6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
  if (nome === 'menos') return <svg {...comum}><path d="M5 12h14" /></svg>;
  if (nome === 'mais') return <svg {...comum}><path d="M12 5v14M5 12h14" /></svg>;
  if (nome === 'lupa') return <svg {...comum}><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></svg>;
  if (nome === 'copiar')
    return <svg {...comum}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>;
  if (nome === 'lapis')
    return <svg {...comum}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
  return <svg {...comum}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
