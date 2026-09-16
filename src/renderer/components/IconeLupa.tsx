export function IconeLupa({ tamanho = 24 }: { tamanho?: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 L21 21" />
    </svg>
  );
}
