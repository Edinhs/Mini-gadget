/**
 * Tipos do Lupa — derivados de `schema.ts` via `z.infer`. Nada é declarado à mão
 * aqui, exceto a superfície `LupaAPI` (SPEC §6.2), que é interface de função.
 */
import type { z } from 'zod';
import type {
  AplicacaoSchema,
  CategoriaSchema,
  ConfigSchema,
  EstrategiaSchema,
  FiltroSchema,
  IdiomaOrigemSchema,
  RelatorioImportSchema,
  RepertorioSchema,
  ResultadoBuscaSchema,
  SentidoSchema,
  SiglaSchema,
} from './schema';

export type Categoria = z.infer<typeof CategoriaSchema>;
export type Estrategia = z.infer<typeof EstrategiaSchema>;
export type IdiomaOrigem = z.infer<typeof IdiomaOrigemSchema>;
export type Aplicacao = z.infer<typeof AplicacaoSchema>;
export type Sentido = z.infer<typeof SentidoSchema>;
export type Sigla = z.infer<typeof SiglaSchema>;
export type Repertorio = z.infer<typeof RepertorioSchema>;
export type Filtro = z.infer<typeof FiltroSchema>;
export type ResultadoBusca = z.infer<typeof ResultadoBuscaSchema>;
export type RelatorioImport = z.infer<typeof RelatorioImportSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export type FormatoExport = 'json' | 'csv' | 'xlsx';
export type ModoImport = 'merge' | 'substituir';

/** SPEC §6.2 — única superfície que o renderer enxerga, via contextBridge. */
export interface LupaAPI {
  buscar(termo: string): Promise<ResultadoBusca>;
  obter(sigla: string): Promise<Sigla | null>;
  listar(filtro?: Filtro): Promise<Sigla[]>;
  salvarSentido(sigla: string, sentido: Sentido, tipo?: 'sigla' | 'termo'): Promise<void>;
  duplicarSentido(sigla: string, sentidoId: string): Promise<Sentido>;
  excluirSentido(sigla: string, sentidoId: string): Promise<void>;
  excluirSigla(sigla: string): Promise<void>;
  alternarFavorito(sigla: string, sentidoId: string): Promise<void>;
  registrarAcesso(sigla: string, sentidoId: string): Promise<void>;
  /** Abre o dialogo nativo de arquivo e importa o que o usuario escolher. */
  importar(modo: ModoImport): Promise<RelatorioImport | null>;
  /** Abre o dialogo de salvar e grava no formato escolhido. */
  exportar(formato: FormatoExport): Promise<string>;
  listarBackups(): Promise<{ caminho: string; data: string }[]>;
  restaurarBackup(caminho: string): Promise<void>;
  historico(): Promise<string[]>;
  obterConfig(): Promise<Config>;
  salvarConfig(patch: Partial<Config>): Promise<Config>;
  novoId(): Promise<string>;
  abrirPastaDados(): Promise<string>;
  abrirPainel(): void;
  fecharPainel(): void;
  copiar(texto: string): void;
  /** Segura o fechamento por blur enquanto ha edicao pendente (SPEC 5.2). */
  bloquearFechamento(v: boolean): void;
  aoFocarBusca(cb: () => void): void;
  /** Avisa o renderer quando a configuracao muda, para o tema valer na hora. */
  aoMudarConfig(cb: (cfg: Config) => void): void;
  /** Arraste livre da lupa: o main passa a seguir o cursor. */
  iniciarArraste(dx: number, dy: number): void;
  pararArraste(): void;
  minimizar(): void;
  ocultarLupa(): void;
}

declare global {
  interface Window {
    lupa: LupaAPI;
  }
}
